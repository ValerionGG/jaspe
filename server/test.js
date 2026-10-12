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
