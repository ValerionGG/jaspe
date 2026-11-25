// Délai compte rendu vendeur : fin du RDV (passage en « post ») → validation L1.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from './index.js'

test('RDV terminé → L1 validé : délai mesuré et < 24 h', async () => {
  const { server, db } = createApp({ dbPath: ':memory:', delay: () => Promise.resolve() })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${server.address().port}/api`
  const call = async (path, body) => {
    const r = await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    return { status: r.status, json: await r.json() }
  }
  try {
    await call('/seed/properties', [{ id: 'p1', title: 'Villa', type: 'Villa', address: '1 rue', district: 'Centre', city: 'Antibes', surface: 120, rooms: 5, price: 1e6, estimateLow: 9e5, estimateHigh: 1.1e6, dpe: 'C', features: [] }])
    await call('/seed/dossiers', [{ id: 'd1', ref: 'VND-1', seller: 'Famille Test', propertyId: 'p1', agentId: 'a1', stage: 'rdv', next: '', due: '', tags: [], motivation: '', timeline: '', deliverables: {} }])
    db.put('routines', { id: 'AUT-024', name: 'AUT-024', enabled: false })

    await call('/actions/dossier.move', { id: 'd1', stage: 'post' })
    const ended = db.get('dossiers', 'd1').rdvEndedAt
    assert.ok(ended, 'rdvEndedAt enregistré')
    await call('/actions/dossier.move', { id: 'd1', stage: 'post' })
    assert.equal(db.get('dossiers', 'd1').rdvEndedAt, ended, 'rdvEndedAt non écrasé')

    assert.equal((await call('/actions/deliverable.generate', { dossierId: 'd1', code: 'L1' })).status, 200)
    assert.equal((await call('/actions/deliverable.validate', { dossierId: 'd1', code: 'L1' })).status, 200)
    const d = db.get('dossiers', 'd1')
    assert.ok(d.crSentAt, 'crSentAt enregistré')
    assert.equal(typeof d.crDelayH, 'number')
    assert.ok(d.crDelayH < 24)
    assert.ok(db.list('activity').some((a) => a.what.startsWith('Compte rendu envoyé en')))

    await call('/actions/deliverable.validate', { dossierId: 'd1', code: 'L1' })
    assert.equal(db.get('dossiers', 'd1').crSentAt, d.crSentAt, 'mesure faite une seule fois')
  } finally { server.close() }
})
