// Pack Preuves : grille de risque, lien client, dépôt rattaché, historique, export horodaté, récap IMPIC.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { openDb } from './db.js'
import { createEngine, HttpError } from './engine.js'
import { createEvidence, scoreRisk, detectSignals, canonical } from './evidence.js'

const sha256 = (b) => createHash('sha256').update(b).digest('hex')
const PDF = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(2000, 7)])
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(500, 1)])

function setup({ country = 'FR' } = {}) {
  const db = openDb(':memory:')
  const engine = createEngine(db, () => {})
  let clock = Date.parse('2026-11-10T09:00:00Z')
  const files = new Map()
  db.put('settings', { id: 'agency', agencyName: 'Maison Riviera', country })
  db.put('properties', { id: 'p1', title: 'Villa vue mer', type: 'Villa', address: '1 ch. des Nielles', city: 'Antibes', price: 1.8e6, estimateLow: 1.7e6, estimateHigh: 1.9e6, dpe: 'B' })
  db.put('dossiers', { id: 'd1', ref: 'VND-1', seller: 'Famille Test', propertyId: 'p1', agentId: 'a1', stage: 'offre', tags: [], motivation: 'Départ', timeline: '3 mois', deliverables: {} })
  db.put('transactions', { id: 'tx1', propertyId: 'p1', dossier: 'd1', stage: 'compromis', price: 1.65e6, seller: 'Famille Test', buyer: 'M. Almeida', conditions: [], pieces: [], fees: 50000, feePayer: 'acquéreur', split: [] })
  const ev = createEvidence(db, {
    HttpError, sha256, now: () => clock,
    saveFile: async (id, bytes) => { files.set(id, Buffer.from(bytes)) },
    evaluate: (id) => engine.actions['compliance.evaluate']({ dossierId: id }),
    setCompliance: (p) => engine.actions['compliance.set'](p),
  })
  return { db, engine, ev, files, tick: (ms) => { clock += ms } }
}
const status = async (p) => { try { await p; return 200 } catch (e) { return e.status } }

test('calcul de risque : pondéré, explicable, planchers légaux', () => {
  assert.equal(scoreRisk({ factors: {} }).level, 'faible')
  const pep = scoreRisk({ factors: { pep: { on: true } } })
  assert.equal(pep.level, 'eleve', 'une PPE impose la vigilance renforcée quel que soit le score')
  assert.ok(pep.floored)
  const ao = scoreRisk({ fundsCountry: { value: 'AO' }, factors: { cash: { on: true } } })
  assert.equal(ao.score, 7); assert.equal(ao.level, 'eleve'); assert.equal(ao.vigilance, 'renforcée')
  assert.match(ao.reasons[0].label, /Angola.*surveillance renforcée/)
  assert.equal(scoreRisk({ clientType: { value: 'offshore' }, factors: {} }).level, 'moyen')
  assert.equal(scoreRisk({ country: { value: 'IR' }, factors: {} }).level, 'eleve', 'pays « appel à l’action »')
  assert.equal(scoreRisk({ factors: { urgency: { on: true } }, amount: 1.2e6 }).level, 'moyen')
})

test('signaux du brief (FR et PT) → facteurs pré-cochés, sans décision', () => {
  const fr = detectSignals(['Le client paie en espèces une partie. Paiement via société offshore aux BVI, il veut signer vite.']).acquereur
  assert.equal(fr.cash.value, true); assert.equal(fr.clientType.value, 'offshore'); assert.equal(fr.urgency.value, true); assert.equal(fr.fundsCountry.value, 'VG')
  const pt = detectSignals(['Pagamento parcial com fundos vindos de Angola.']).acquereur
  assert.equal(pt.fundsCountry.value, 'AO')

  const { db, ev } = setup()
  db.put('notes', { dossierId: 'd1', text: 'Brief : l’acquéreur paie une partie en espèces, fonds venant d’Angola.', at: '2026-11-09', by: 'Claire' })
  const g = ev.actions['risk.get']({ dossierId: 'd1', party: 'acquereur' })
  assert.equal(g.factors.cash.on, true); assert.equal(g.factors.cash.suggested, true)
  assert.match(g.factors.cash.source, /espèces/)
  assert.equal(g.funds.value, 'AO')
  assert.equal(g.level, 'eleve')
  assert.equal(g.decision, null, 'la grille ne décide jamais à la place du conseiller')
  assert.ok(g.pieces.some((p) => p.id === 'releves'), 'vigilance renforcée : relevés demandés')
  const v = ev.actions['risk.get']({ dossierId: 'd1', party: 'vendeur' })
  assert.equal(v.level, 'faible')
})

test('le conseiller confirme, corrige et décide ; justification obligatoire', async () => {
  const { db, ev } = setup()
  db.put('notes', { dossierId: 'd1', text: 'Il veut signer vite.', at: '2026-11-09', by: 'Claire' })
  let g = ev.actions['risk.set']({ dossierId: 'd1', party: 'acquereur', factors: { urgency: false, pep: true } })
  assert.equal(g.factors.urgency.on, false); assert.equal(g.factors.urgency.by, 'conseiller')
  assert.equal(g.level, 'eleve')
  g = ev.actions['risk.get']({ dossierId: 'd1', party: 'acquereur' })
  assert.equal(g.factors.urgency.on, false, 'un choix du conseiller n’est pas écrasé par la suggestion')
  assert.equal(await status(Promise.resolve().then(() => ev.actions['risk.decide']({ dossierId: 'd1', party: 'acquereur', decision: 'accepter-renforcee', justification: 'ok' }))), 400)
  assert.equal(await status(Promise.resolve().then(() => ev.actions['risk.decide']({ dossierId: 'd1', party: 'acquereur', decision: 'accepter', justification: 'Client connu de longue date' }))), 409)
  ev.actions['risk.decide']({ dossierId: 'd1', party: 'acquereur', decision: 'accepter-renforcee', justification: 'PPE déclarée : relevés et validation direction obtenus' })
  ev.actions['risk.decide']({ dossierId: 'd1', party: 'vendeur', decision: 'accepter', justification: 'Vendeur personne physique, résident France' })
  const cmp = db.get('compliance', 'cmp-d1')
  assert.equal(cmp.items.find((i) => i.id === 'tracfin').state, 'ok', 'les deux décisions consignent l’analyse de risque')
  ev.actions['risk.set']({ dossierId: 'd1', party: 'acquereur', factors: { pep: false } })
  assert.equal(ev.actions['risk.get']({ dossierId: 'd1', party: 'acquereur' }).decisionStale, true)
})

test('lien client : lecture, dépôt rattaché au bon point, refus si expiré ou révoqué', async () => {
  const { db, ev, files, tick } = setup()
  const { token, link, path } = await ev.actions['evidence.link.create']({ dossierId: 'd1', party: 'acquereur' })
  assert.equal(path, `/depot/${token}`)
  assert.ok(!('tokenHash' in link)); assert.ok(!JSON.stringify(db.list('depotlinks')).includes(token), 'seule l’empreinte du jeton est stockée')
  assert.equal(Date.parse(link.expiresAt) - Date.parse(link.createdAt), 14 * 864e5)
  const r = await ev.publicHandlers.read(token)
  assert.equal(r.lang, 'fr'); assert.match(r.legal.body.join(' '), /L561-5/); assert.match(r.legal.privacy.join(' '), /5 ans.*L561-12/)
  assert.ok(!JSON.stringify(r).includes('eleve') && !('level' in r), 'le niveau de risque n’est jamais montré au client')

  const up = await ev.publicHandlers.upload(token, { pieceId: 'fonds', name: 'offre-pret.pdf', type: 'application/pdf', data: PDF.toString('base64') })
  assert.equal(up.ok, true)
  const proof = db.list('proofs')[0]
  assert.equal(proof.itemId, 'fonds'); assert.equal(proof.sha256, sha256(PDF))
  assert.deepEqual(files.get(proof.fileId), PDF)
  await ev.publicHandlers.upload(token, { pieceId: 'identite', name: 'passeport.png', type: 'image/png', data: PNG.toString('base64') })
  const cmp = db.get('compliance', 'cmp-d1')
  assert.equal(cmp.items.find((i) => i.id === 'fonds').proofs[0].name, 'offre-pret.pdf')
  assert.equal(cmp.items.find((i) => i.id === 'id-acquereur').proofs[0].sha256, sha256(PNG))
  assert.notEqual(cmp.items.find((i) => i.id === 'fonds').state, 'ok', 'la pièce reçue reste à vérifier par le conseiller')
  assert.ok(db.list('notifications').some((n) => n.title === 'Pièce reçue par lien client'))

  assert.equal(await status(ev.publicHandlers.upload(token, { pieceId: 'fonds', name: 'x.exe', type: 'application/x-msdownload', data: PDF.toString('base64') })), 415)
  assert.equal(await status(ev.publicHandlers.upload(token, { pieceId: 'fonds', name: 'faux.pdf', type: 'application/pdf', data: PNG.toString('base64') })), 415)
  assert.equal(await status(ev.publicHandlers.upload(token, { pieceId: 'fonds', name: 'gros.pdf', type: 'application/pdf', data: Buffer.concat([PDF, Buffer.alloc(10 * 1024 * 1024)]).toString('base64') })), 413)
  assert.equal(await status(ev.publicHandlers.upload(token, { pieceId: 'titre', name: 'a.pdf', type: 'application/pdf', data: PDF.toString('base64') })), 400, 'pièce non demandée à cette partie')

  assert.equal(await status(ev.publicHandlers.declare(token, { accepted: true, pep: 'non' })), 400, 'origine des fonds requise pour l’acquéreur')
  await ev.publicHandlers.declare(token, { accepted: true, pep: 'non', origin: 'pret' })
  assert.equal(await status(ev.publicHandlers.declare(token, { accepted: true, pep: 'non', origin: 'pret' })), 409)
  assert.ok(db.get('compliance', 'cmp-d1').items.find((i) => i.id === 'ppe').proofs.some((p) => p.kind === 'declaration'))

  assert.equal(await status(ev.publicHandlers.read('inconnu-inconnu-inconnu-123')), 404)
  tick(14 * 864e5 + 1000)
  assert.equal(await status(ev.publicHandlers.read(token)), 410, 'lien expiré')
  const second = await ev.actions['evidence.link.create']({ dossierId: 'd1', party: 'vendeur' })
  assert.equal((await ev.publicHandlers.read(second.token)).pieces.some((p) => p.id === 'titre'), true)
  ev.actions['evidence.link.revoke']({ id: second.link.id })
  assert.equal(await status(ev.publicHandlers.upload(second.token, { pieceId: 'titre', name: 'a.pdf', type: 'application/pdf', data: PDF.toString('base64') })), 410, 'lien révoqué')
})

test('lien portugais : texte Lei 83/2017 et conservation à confirmer', async () => {
  const { ev } = setup({ country: 'PT' })
  const { token } = await ev.actions['evidence.link.create']({ dossierId: 'd1', party: 'acquereur' })
  const r = await ev.publicHandlers.read(token)
  assert.equal(r.lang, 'pt')
  assert.match(r.legal.body.join(' '), /Lei n\.º 83\/2017/)
  assert.match(r.legal.privacy.join(' '), /art\. 51\.º.*a confirmar/)
  assert.ok(r.pieces.find((p) => p.id === 'fonds').label.startsWith('Comprovativo'))
})

test('historique horodaté et export de contrôle avec empreintes', async () => {
  const { db, engine, ev, tick } = setup()
  engine.actions['compliance.evaluate']({ dossierId: 'd1' })
  engine.actions['compliance.set']({ dossierId: 'd1', itemId: 'id-acquereur', state: 'ok', evidence: 'Passeport n° 12AB34, vu le 10/11' })
  tick(60_000)
  const { token } = await ev.actions['evidence.link.create']({ dossierId: 'd1', party: 'acquereur' })
  tick(60_000)
  await ev.publicHandlers.upload(token, { pieceId: 'fonds', name: 'pret.pdf', type: 'application/pdf', data: PDF.toString('base64') })
  tick(60_000)
  engine.actions['compliance.set']({ dossierId: 'd1', itemId: 'fonds', state: 'ok', evidence: 'Offre de prêt reçue par lien client' })

  const log = db.list('cmplog').filter((e) => e.dossierId === 'd1')
  const chk = log.filter((e) => e.kind === 'checklist')
  assert.equal(chk.length, 2)
  assert.equal(chk[0].by, 'Claire Delmas'); assert.equal(chk[0].from, 'blocked'); assert.equal(chk[0].to, 'ok')
  assert.ok(log.every((e) => !Number.isNaN(Date.parse(e.at)) && e.by && e.what))
  assert.ok(log.some((e) => e.kind === 'depot' && e.by.startsWith('Client')))

  const out = await ev.actions['evidence.export']({ dossierId: 'd1' })
  assert.equal(out.sha256, sha256(canonical(out.json.content)), 'empreinte de l’export recalculable')
  assert.equal(out.json.content.proofs[0].sha256, sha256(PDF))
  assert.ok(out.html.includes(sha256(PDF)) && out.html.includes(out.sha256), 'HTML imprimable avec les empreintes')
  assert.match(out.html, /Dossier de vigilance LCB-FT/)
  const hist = out.json.content.history
  assert.ok(hist.length >= 4)
  assert.deepEqual(hist.map((h) => h.at), [...hist.map((h) => h.at)].sort(), 'historique dans l’ordre chronologique')
  assert.equal(out.json.content.parties.length, 2)
  assert.equal(out.json.content.checklist.find((i) => i.id === 'fonds').state, 'ok')
  assert.ok(db.list('exports').some((e) => e.sha256 === out.sha256))
  assert.ok(db.list('cmplog').some((e) => e.kind === 'export'), 'l’export lui-même est journalisé')
})

test('récapitulatif trimestriel IMPIC (anexo B) et CSV', () => {
  const { db, ev } = setup({ country: 'PT' })
  db.patch('dossiers', 'd1', { stage: 'acte' })
  db.patch('transactions', 'tx1', { stage: 'acte', acteAt: '2026-11-05T10:00:00Z', conditions: [{ k: 'Crédito', l: 'Crédito habitação' }] })
  db.put('properties', { id: 'p2', title: 'T2', city: 'Cascais', price: 6e5 })
  db.put('dossiers', { id: 'd2', ref: 'VND-2', seller: 'Sr. Silva', propertyId: 'p2', stage: 'acte', deliverables: {} })
  db.put('transactions', { id: 'tx2', propertyId: 'p2', dossier: 'd2', stage: 'acte', acteAt: '2026-08-20T10:00:00Z', price: 6e5, seller: 'Sr. Silva', buyer: 'Sra. Costa', conditions: [], pieces: [] })
  ev.actions['risk.set']({ dossierId: 'd1', party: 'acquereur', factors: { cash: true }, residence: 'AO' })
  const r = ev.actions['impic.quarter']({ year: 2026, quarter: 4 })
  assert.equal(r.period, '2026-T4')
  assert.equal(r.rows.length, 1, 'seuls les actes du trimestre')
  const row = r.rows[0]
  assert.equal(row.data_escritura, '2026-11-05'); assert.equal(row.valor_eur, 1.65e6); assert.equal(row.comprador_pais_residencia, 'AO')
  assert.match(row.meio_pagamento, /Numerário/)
  assert.match(row.campos_em_falta, /comprador_nif/)
  assert.match(r.note, /a confirmar/)
  const lines = r.csv.replace(/^﻿/, '').split('\r\n')
  assert.equal(lines.length, 2)
  assert.ok(lines[0].startsWith('periodo;dossier;data_escritura'))
  assert.equal(ev.actions['impic.quarter']({ year: 2026, quarter: 3 }).rows[0].dossier, 'VND-2')
})
