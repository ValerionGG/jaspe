// Serveur MCP : outils, propositions à valider, validation / refus, jeton d'API sur le point HTTP.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { openDb } from './db.js'
import { createEngine } from './engine.js'
import { createMcpServer, mcpActions, handleMcpHttp } from './mcp.js'

function setup() {
  const db = openDb(':memory:')
  const events = []
  const emit = (col, id, op = 'put') => events.push({ col, id, op })
  const engine = createEngine(db, emit, { delay: () => Promise.resolve() })
  engine.extend({ actions: mcpActions(engine, db, { emit }) })
  db.put('properties', { id: 'p1', title: 'Villa vue mer', type: 'Villa', address: '1 ch. des Nielles', district: 'Cap d’Antibes', city: 'Antibes', surface: 200, rooms: 6, price: 3e6, estimateLow: 2.8e6, estimateHigh: 3.1e6, dpe: 'B', features: ['Piscine'] })
  db.put('buyers', { id: 'b1', name: 'M. Test', budget: [2.5e6, 3.2e6], zones: ['Cap d’Antibes'], type: 'Villa' })
  db.put('dossiers', { id: 'd1', ref: 'VND-1', seller: 'Famille Test', propertyId: 'p1', agentId: 'a1', stage: 'offre', next: 'Répondre à l’offre', due: 'Demain', tags: [], motivation: 'Départ', timeline: '3 mois', deliverables: { L1: 'waiting', L7: 'waiting' } })
  db.put('transactions', { id: 'tx1', dossier: 'd1', propertyId: 'p1', seller: 'Famille Test', buyer: 'M. Test', price: 3e6, fees: 120000, feePayer: 'vendeur', split: [{ role: 'Agence', pct: 100 }] })
  db.put('tasks', { id: 't1', title: 'Appeler le notaire', dossier: 'd1', due: 'Aujourd’hui', prio: 'haute', kind: 'appeler', done: false })
  return { db, engine, emit, events }
}
async function connect(ctx) {
  const server = createMcpServer(ctx)
  const [a, b] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'test', version: '1.0.0' })
  await Promise.all([server.connect(a), client.connect(b)])
  return client
}
const json = (r) => JSON.parse(r.content[0].text)
/** Toutes les lignes de la base, sauf la file de validation. */
const snapshot = (db) => db.db.prepare("SELECT col, id, data FROM docs WHERE col <> 'queue' ORDER BY col, id").all().map((r) => `${r.col}/${r.id}/${r.data}`)

test('liste des outils et annotations', async () => {
  const client = await connect(setup())
  const { tools } = await client.listTools()
  const names = tools.map((t) => t.name).sort()
  assert.deepEqual(names, ['jaspe_conformite', 'jaspe_dossier', 'jaspe_dossiers', 'jaspe_marche', 'jaspe_plan_depuis_brief', 'jaspe_preparer_document', 'jaspe_preparer_facture', 'jaspe_proposer_relance', 'jaspe_rechercher', 'jaspe_taches_du_jour', 'jaspe_temps_gagne', 'jaspe_validations_en_attente'])
  for (const t of tools) {
    assert.ok(t.description.length > 40, `${t.name} décrit`)
    const read = ['jaspe_dossiers', 'jaspe_dossier', 'jaspe_taches_du_jour', 'jaspe_temps_gagne', 'jaspe_conformite', 'jaspe_marche', 'jaspe_validations_en_attente', 'jaspe_rechercher'].includes(t.name)
    assert.equal(t.annotations.readOnlyHint, read, `${t.name} readOnlyHint`)
  }
})

test('lecture : dossiers, dossier, tâches du jour, temps gagné, conformité', async () => {
  const { db, engine, emit } = setup()
  const client = await connect({ db, engine, emit })
  const list = json(await client.callTool({ name: 'jaspe_dossiers', arguments: { recherche: 'antibes' } }))
  assert.equal(list.total, 1)
  const d = json(await client.callTool({ name: 'jaspe_dossier', arguments: { id: 'VND-1' } }))
  assert.equal(d.vendeur, 'Famille Test')
  assert.equal(d.bien.ville, 'Antibes')
  assert.equal(d.prochaines_actions.taches[0].titre, 'Appeler le notaire')
  assert.deepEqual(d.livrables.map((l) => l.code), ['L1', 'L7'])
  const day = json(await client.callTool({ name: 'jaspe_taches_du_jour', arguments: {} }))
  assert.equal(day.taches.length, 1)
  db.put('timelog', { at: new Date().toISOString(), kind: 'L1', label: 'Mail', baseline: 10, spent: 3, net: 7, corrections: 1, pending: false })
  db.put('timelog', { at: new Date().toISOString(), kind: 'L7', label: 'Estimation', baseline: 45, spent: 0, net: 0, corrections: 0, pending: true })
  const t = json(await client.callTool({ name: 'jaspe_temps_gagne', arguments: {} }))
  assert.equal(t.net_min, 7, 'brouillon non relu exclu, corrections déduites')
  const c = json(await client.callTool({ name: 'jaspe_conformite', arguments: { dossierId: 'd1' } }))
  assert.equal(c.pays, 'FR')
  assert.ok(c.bloquants.length > 0, 'un dossier en offre a des points bloquants')
  const v = json(await client.callTool({ name: 'jaspe_validations_en_attente', arguments: {} }))
  assert.equal(typeof v.total, 'number')
  const found = json(await client.callTool({ name: 'jaspe_rechercher', arguments: { texte: 'VND-1' } }))
  assert.ok(found.dossiers.length >= 1, 'la recherche retrouve le dossier par sa référence')
  const m = json(await client.callTool({ name: 'jaspe_marche', arguments: { dossierId: 'd1' } }))
  assert.equal(typeof m.ventes, 'number', 'marché : réponse honnête même sans réseau')
  const missing = await client.callTool({ name: 'jaspe_dossier', arguments: { id: 'nope' } })
  assert.equal(missing.isError, true)
})

test('écriture : proposition seule, puis validation qui exécute', async () => {
  const { db, engine, emit, events } = setup()
  const client = await connect({ db, engine, emit, user: { name: 'Claude' } })
  const before = snapshot(db)
  const r = json(await client.callTool({ name: 'jaspe_preparer_document', arguments: { dossierId: 'd1', code: 'L1' } }))
  assert.match(r.proposition, /^q-mcp-/)
  assert.deepEqual(snapshot(db), before, 'rien d’autre que la file n’est modifié')
  const q = db.get('queue', r.proposition)
  assert.equal(q.kind, 'mcp'); assert.equal(q.source, 'MCP'); assert.equal(q.safe, false); assert.equal(q.by, 'Claude')
  assert.deepEqual(q.detail.payload, { dossierId: 'd1', code: 'L1' })
  assert.equal(q.code, undefined, 'pas de code : queue.resolve ne peut pas valider un livrable par erreur')
  assert.ok(events.some((e) => e.col === 'queue' && e.id === q.id), 'diffusée en temps réel')
  assert.equal(db.get('documents', 'd1-L1'), null)

  const ok = await engine.actions['mcp.approve']({ id: q.id })
  assert.equal(ok.action, 'deliverable.generate')
  assert.equal(db.get('documents', 'd1-L1').code, 'L1', 'le brouillon est généré')
  assert.equal(db.get('queue', q.id), null)
  assert.ok(db.get('queue', 'q-d1-L1'), 'le brouillon client part à son tour en relecture')
  assert.equal(db.get('mcplog', q.id).status, 'validé')

  // Relance et facture : exécutées par les actions existantes après validation seulement.
  const rel = json(await client.callTool({ name: 'jaspe_proposer_relance', arguments: { dossierId: 'd1', destinataire: 'l’acquéreur', objet: 'retour sur l’offre', echeance: '2026-12-01' } }))
  const tasks = db.list('tasks').length
  await engine.actions['mcp.approve']({ id: rel.proposition })
  assert.equal(db.list('tasks').length, tasks + 1)
  assert.match(db.list('tasks')[0].title, /Relancer l’acquéreur : retour sur l’offre/)
  const fac = json(await client.callTool({ name: 'jaspe_preparer_facture', arguments: { dossierId: 'd1' } }))
  assert.equal(db.list('invoices').length, 0)
  await engine.actions['mcp.approve']({ id: fac.proposition })
  assert.equal(db.list('invoices')[0].status, 'brouillon')

  const plan = json(await client.callTool({ name: 'jaspe_plan_depuis_brief', arguments: { texte: 'Rappeler le vendeur vendredi. Préparer l’estimation.', dossierId: 'd1' } }))
  assert.ok(plan.detail.length >= 2)
  assert.equal(db.get('queue', plan.proposition).detail.action, 'assistant.apply')
})

test('refus : la proposition est écartée sans rien exécuter', async () => {
  const { db, engine, emit } = setup()
  const client = await connect({ db, engine, emit })
  const r = json(await client.callTool({ name: 'jaspe_preparer_facture', arguments: { transactionId: 'tx1', modele: 'mandataire' } }))
  const before = snapshot(db).filter((x) => !/^(activity|mcplog)\//.test(x))
  await engine.actions['mcp.reject']({ id: r.proposition, reason: 'pas maintenant' })
  assert.equal(db.get('queue', r.proposition), null)
  assert.deepEqual(snapshot(db).filter((x) => !/^(activity|mcplog)\//.test(x)), before)
  assert.equal(db.get('mcplog', r.proposition).status, 'refusé')
  await assert.rejects(() => engine.actions['mcp.approve']({ id: r.proposition }), /introuvable/)
  // Une entrée de file forgée ne peut lancer qu'une action autorisée.
  db.put('queue', { id: 'q-mcp-evil', kind: 'mcp', detail: { action: 'routine.toggle', payload: { id: 'AUT-110' } } })
  await assert.rejects(() => engine.actions['mcp.approve']({ id: 'q-mcp-evil' }), /non autorisée/)
})

test('HTTP : jeton d’API requis, invalide refusé, révoqué refusé', async () => {
  const ctx = setup()
  const http = createServer((req, res) => (req.url === '/mcp' ? handleMcpHttp(req, res, ctx) : res.end()))
  await new Promise((r) => http.listen(0, '127.0.0.1', r))
  const url = `http://127.0.0.1:${http.address().port}/mcp`
  const init = { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } }
  const post = (auth) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...(auth ? { authorization: auth } : {}) }, body: JSON.stringify(init) })
  try {
    assert.equal((await post()).status, 401)
    assert.equal((await post('Bearer jsp.demo.faux')).status, 401)
    const { token, id } = ctx.engine.actions['apitoken.create']({ name: 'Claude Desktop' })
    assert.match(token, /^jsp\.demo\./)
    assert.ok(!JSON.stringify(ctx.db.list('apitokens')).includes(token), 'seule l’empreinte est stockée')
    assert.ok(!JSON.stringify(ctx.engine.actions['apitoken.list']()).includes('hash'))
    assert.equal((await post(`Bearer ${token}`)).status, 200)

    const client = new Client({ name: 'http', version: '1.0.0' })
    await client.connect(new StreamableHTTPClientTransport(new URL(url), { requestInit: { headers: { authorization: `Bearer ${token}` } } }))
    const d = JSON.parse((await client.callTool({ name: 'jaspe_dossier', arguments: { id: 'd1' } })).content[0].text)
    assert.equal(d.vendeur, 'Famille Test')
    await client.close()

    ctx.engine.actions['apitoken.revoke']({ id })
    assert.equal((await post(`Bearer ${token}`)).status, 401)
  } finally { http.close() }
})
