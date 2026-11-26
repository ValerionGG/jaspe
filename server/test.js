// Parcours métier de bout en bout sur une base en mémoire.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from './index.js'

const now = () => Promise.resolve()

test('seed → RDV → livrables → validation → envoi programmé → lead', async () => {
  const { server, db } = createApp({ dbPath: ':memory:', delay: now })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${server.address().port}/api`
  const call = async (method, path, body) => {
    const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body) })
    return { status: r.status, json: await r.json() }
  }
  try {
    const all = (s) => Object.fromEntries(['D1', 'D2', 'D3', 'D4', 'D5', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'].map((k) => [k, s]))
    await call('POST', '/seed/properties', [{ id: 'p1', title: 'Villa vue mer', type: 'Villa', address: '1 ch. des Nielles', district: 'Cap d’Antibes', city: 'Antibes', surface: 200, rooms: 6, price: 3e6, estimateLow: 2.8e6, estimateHigh: 3.1e6, dpe: 'B', features: ['Piscine'] }])
    await call('POST', '/seed/buyers', [{ id: 'b1', name: 'M. Test', budget: [2.5e6, 3.2e6], zones: ['Cap d’Antibes'], type: 'Villa' }])
    const seeded = await call('POST', '/seed/dossiers', [{ id: 'd1', ref: 'VND-1', seller: 'Famille Test', propertyId: 'p1', agentId: 'a1', stage: 'rdv', next: 'Débrief', due: 'Demain', tags: [], motivation: 'Départ', timeline: '3 mois', deliverables: all('waiting') }])
    assert.equal(seeded.json.length, 1)
    // second seed is a no-op
    assert.equal((await call('POST', '/seed/dossiers', [{ id: 'x' }])).json.length, 1)
    // a collection written by the engine before any client still gets seeded once
    db.put('tasks', { id: 'engine-1', title: 'créée par le moteur' })
    const t = await call('POST', '/seed/tasks', [{ id: 't1', title: 'amorce' }])
    assert.deepEqual(t.json.map((x) => x.id).sort(), ['engine-1', 't1'])

    await call('POST', '/actions/dossier.move', { id: 'd1', stage: 'post' })
    await new Promise((r) => setTimeout(r, 30))
    const d = db.get('dossiers', 'd1')
    assert.equal(d.deliverables.L1, 'review')
    assert.equal(d.deliverables.L9, 'blocked', 'L9 sans PV d’AG ne peut pas être prêt')
    const l3 = db.get('documents', 'd1-L3')
    assert.equal(l3.matches[0].name, 'M. Test')
    assert.ok(db.get('queue', 'q-d1-L1'), 'la validation apparaît dans la file')

    await call('POST', '/actions/deliverable.edit', { dossierId: 'd1', code: 'L1', body: ['Texte relu'] })
    await call('POST', '/actions/deliverable.generate', { dossierId: 'd1', code: 'L1' })
    assert.deepEqual(db.get('documents', 'd1-L1').history.map((h) => h.v), [1, 2], 'versions conservées')
    assert.deepEqual(db.get('documents', 'd1-L1').history[1].body, ['Texte relu'])

    const v = await call('POST', '/actions/deliverable.validate', { dossierId: 'd1', code: 'L1' })
    assert.equal(v.json.outbox.status, 'programmé')
    assert.equal(db.get('dossiers', 'd1').deliverables.L1, 'done')
    assert.equal(db.get('queue', 'q-d1-L1'), null)

    db.put('queue', { id: 'q1', title: 'amorce', code: 'L7', dossier: 'd1' })
    await call('POST', '/actions/queue.resolve', { id: 'q1' })
    assert.equal(db.get('queue', 'q1'), null, 'un élément amorcé est retiré après validation')

    const bad = await call('POST', '/actions/lead.create', { name: 'Sans email' })
    assert.equal(bad.status, 400)
    const lead = await call('POST', '/actions/lead.create', { name: 'Jeanne', email: 'j@agence.fr', org: 'Agence du Port' })
    assert.equal(lead.status, 200)
    assert.ok(db.list('tasks').some((t) => t.leadId === lead.json.id))

    const runs = await call('POST', '/actions/routine.run', { id: 'AUT-033' })
    assert.equal(runs.json[0].routineId, 'AUT-033')
    assert.ok(db.get('tasks', 't-l9-d1'), 'AUT-033 crée la demande de pièce')
    assert.equal((await call('GET', '/nope')).status, 404)
    assert.equal((await call('POST', '/copilot', { question: 'où en est le dossier Test ?' })).json.mode, 'rules')
  } finally { server.close() }
})

test('messagerie : fenêtre WhatsApp 24 h, modèle, interne, classement, rappels', async () => {
  const { server, db, engine } = createApp({ dbPath: ':memory:', delay: now })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${server.address().port}/api`
  const call = async (method, path, body) => { const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body) }); return { status: r.status, json: await r.json() } }
  try {
    db.put('templates', { id: 'tpl-rdv', name: 'Rappel RDV', channel: 'whatsapp', approved: true, body: 'Bonjour {{prenom}}, rappel : RDV le {{date}} à {{heure}} ({{lieu}}).' })
    db.put('conversations', { id: 'c1', title: 'Mme Ricci', channel: 'whatsapp', kind: 'direct', optIn: true, tags: [], unread: 0, lastAt: new Date().toISOString() })
    db.put('conversations', { id: 'c2', title: 'antibes', channel: 'internal', kind: 'channel', tags: [], unread: 0, lastAt: new Date().toISOString() })
    db.put('conversations', { id: 'c3', title: 'M. Sans Accord', channel: 'whatsapp', kind: 'direct', optIn: false, tags: [], unread: 0, lastAt: new Date().toISOString() })

    assert.equal((await call('POST', '/actions/message.send', { conversationId: 'c1', text: 'Bonjour' })).status, 409, 'fenêtre fermée sans modèle')
    const tpl = await call('POST', '/actions/message.send', { conversationId: 'c1', text: 'Rappel', template: 'tpl-rdv' })
    assert.match(tpl.json.status, /consigné/)
    await call('POST', '/actions/message.receive', { conversationId: 'c1', text: 'Je fais une offre à 1,8 M€, possible de visiter demain ?' })
    assert.deepEqual(db.get('conversations', 'c1').tags.sort(), ['Offre', 'Visite'])
    assert.equal((await call('POST', '/actions/message.send', { conversationId: 'c1', text: 'Avec plaisir' })).status, 200, 'fenêtre ouverte après message client')
    assert.equal((await call('POST', '/actions/message.send', { conversationId: 'c3', text: 'x', template: 'tpl-rdv' })).status, 409, 'pas d’opt-in')
    const internal = await call('POST', '/actions/message.send', { conversationId: 'c2', text: 'Qui a un acquéreur ? @Sofia' })
    assert.equal(internal.json.status, 'distribué')
    const sug = await call('POST', '/actions/message.suggest', { conversationId: 'c1' })
    assert.ok(sug.json.suggestions.length >= 2)

    const soon = new Date(Date.now() + 26 * 3600e3)
    db.put('events', { id: 'e1', day: soon.getMonth() === 9 ? soon.getDate() : 31, start: `${String(soon.getHours()).padStart(2, '0')}:00`, title: 'Visite', who: 'Mme Ricci', place: 'Juan', kind: 'visite' })
    if (soon.getMonth() === 9) {
      await engine.tick(['AUT-110'], true)
      assert.equal(db.list('reminders').filter((r) => r.eventId === 'e1').length, 2, 'J-1 et H-2 programmés')
      await engine.tick(['AUT-110'], true)
      assert.equal(db.list('reminders').filter((r) => r.eventId === 'e1').length, 2, 'pas de doublon')
    }
  } finally { server.close() }
})

test('brief → plan → actions, temps gagné corrections comprises, conformité, facture', async () => {
  const { db, engine } = createApp({ dbPath: ':memory:', delay: now })
  const A = engine.actions
  db.put('properties', { id: 'p1', title: 'Villa', type: 'Villa', city: 'Antibes', surface: 200, price: 3e6, dpe: 'C' })
  db.put('properties', { id: 'p2', title: 'Villa 2', type: 'Villa', city: 'Antibes', surface: 180, price: 2.4e6 })
  db.put('properties', { id: 'p3', title: 'Villa 3', type: 'Villa', city: 'Antibes', surface: 150, price: 2.1e6 })
  db.put('dossiers', { id: 'd1', seller: 'Famille Test', propertyId: 'p1', agentId: 'a1', stage: 'offre', deliverables: {} })
  db.put('transactions', { id: 'tx1', dossier: 'd1', propertyId: 'p1', price: 3e6, seller: 'Famille Test', buyer: 'M. Achat', fees: 120000, feePayer: 'acquéreur', split: [{ agency: 'Antibes', pct: 60 }, { agency: 'Biot', pct: 40 }], pieces: [] })

  const { items } = A['assistant.plan']({ text: 'Je rappelle le vendeur vendredi après le diagnostic. Le prix est à confirmer. Préparer l’estimation. Mettre en place une veille sur les comparables. Penser à la facture de commission.' })
  const types = items.map((i) => i.type)
  for (const t of ['relance', 'point', 'document', 'veille', 'facture']) assert.ok(types.includes(t), `plan contient ${t}`)
  assert.match(items.find((i) => i.type === 'relance').label, /après diagnostic/)
  assert.equal(new Date(items.find((i) => i.type === 'relance').due).getDay(), 5, 'relance un vendredi')

  const { done } = await A['assistant.apply']({ dossierId: 'd1', items, text: 'brief' })
  assert.equal(done.length, items.length)
  assert.ok(db.list('tasks').some((t) => /Relancer le vendeur/.test(t.title)))
  assert.ok(db.get('documents', 'd1-L7'), 'estimation préparée')
  assert.ok(db.get('watches', 'w-d1'))
  const inv = db.list('invoices')[0]
  assert.equal(inv.ht, 100000); assert.equal(inv.vat, 20000); assert.equal(inv.split[1].amount, 40000)

  // Temps gagné : 45 min de référence pour L7, relecture 3 min, correction 5 min → 37 min net
  A['deliverable.edit']({ dossierId: 'd1', code: 'L7', body: ['corrigé'] })
  A['deliverable.validate']({ dossierId: 'd1', code: 'L7' })
  const l7 = db.list('timelog').find((e) => e.ref === 'doc-d1-L7')
  assert.equal(l7.baseline, 45); assert.equal(l7.spent, 8); assert.equal(l7.net, 37); assert.equal(l7.corrections, 1)
  A['time.calibrate']({ kind: 'L7', minutes: 60 })
  assert.equal(db.get('settings', 'time-baselines').values.L7, 60)

  // Conformité FR : en offre, l’identité acquéreur est bloquante ; « ok » exige une preuve
  let c = A['compliance.evaluate']({ dossierId: 'd1' })
  assert.equal(c.items.find((i) => i.id === 'id-acquereur').state, 'blocked')
  assert.equal(c.items.find((i) => i.id === 'dpe').state, 'ok')
  assert.equal(c.items.find((i) => i.id === 'audit').state, 'na')
  assert.throws(() => A['compliance.set']({ dossierId: 'd1', itemId: 'id-acquereur', state: 'ok' }))
  c = A['compliance.set']({ dossierId: 'd1', itemId: 'id-acquereur', state: 'ok', evidence: 'CNI vérifiée 12/10' })
  assert.equal(c.items.find((i) => i.id === 'id-acquereur').state, 'ok')
  A['settings.country']({ country: 'PT' })
  assert.equal(db.get('compliance', 'cmp-d1').country, 'PT')

  // Facture : numéro attribué à la validation, puis figée
  const v = A['invoice.validate']({ id: inv.id })
  assert.match(v.number, /^FA-\d{4}-0001$/)
  assert.throws(() => A['invoice.update']({ id: inv.id, ht: 1 }))
  A['invoice.paid']({ id: inv.id })
  assert.equal(db.get('invoices', inv.id).status, 'payée')

  const runs = await engine.tick(['AUT-121', 'AUT-122'], true)
  assert.ok(runs.every((r) => r.status !== 'fail'), JSON.stringify(runs))
})

test('panel clients : portugais, offre, signaux LCB-FT, dates locales, faux positifs, gain non relu', async () => {
  const { planFromBrief, parseDue } = await import('./assist.js')
  // Mercredi 25/11/2026 à 23:50 heure locale : « vendredi » doit rester vendredi 27.
  const late = new Date(2026, 10, 25, 23, 50)
  assert.equal(parseDue('je rappelle vendredi', late), '2026-11-27')
  assert.equal(parseDue('ce soir', late), '2026-11-25')
  assert.equal(parseDue('ligar na sexta-feira', late), '2026-11-27')
  assert.equal(parseDue('amanhã', late), '2026-11-26')

  const pt = planFromBrief('Ligar ao vendedor na sexta-feira depois do certificado energético. O comprador fez uma proposta de 1,65 milhões até sexta. Os fundos vêm de Angola, pagamento parcial em numerário.', late)
  const t = pt.map((i) => i.type)
  assert.ok(t.includes('relance'), 'relance en portugais')
  assert.ok(pt.some((i) => i.type === 'tache' && /offre de 1,65 milh/.test(i.label)), 'offre détectée avec montant')
  assert.ok(t.includes('conformite'), 'numerário / Angola → vigilance BCFT')

  const fr = planFromBrief('Bel appartement de 4 pièces. L’acquéreur paiera une partie en espèces via une société aux BVI.', late)
  assert.ok(!fr.some((i) => i.code === 'L9'), '« 4 pièces » ne déclenche pas L9')
  assert.ok(fr.some((i) => i.type === 'conformite'), 'espèces / BVI → vigilance LCB-FT')

  // Un brouillon généré ne compte aucun gain tant qu’il n’est pas relu et validé.
  const { db, engine } = createApp({ dbPath: ':memory:', delay: now })
  db.put('properties', { id: 'p1', title: 'Villa', type: 'Villa', city: 'Antibes', surface: 200, price: 3e6, dpe: 'C' })
  db.put('dossiers', { id: 'd1', seller: 'Famille Test', propertyId: 'p1', agentId: 'a1', stage: 'post', deliverables: {} })
  await engine.actions['deliverable.generate']({ dossierId: 'd1', code: 'L7' })
  let e = db.list('timelog').find((x) => x.ref === 'doc-d1-L7')
  assert.equal(e.net, 0); assert.equal(e.pending, true)
  engine.actions['deliverable.validate']({ dossierId: 'd1', code: 'L7' })
  e = db.list('timelog').find((x) => x.ref === 'doc-d1-L7')
  assert.equal(e.pending, false); assert.equal(e.net, 42)
})
