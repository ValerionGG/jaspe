// Lien client « pièces et origine des fonds » de bout en bout par HTTP : démo, puis comptes (base de l’agence portée par le lien).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp } from './index.js'

const now = () => Promise.resolve()
const listen = async (app) => { await new Promise((r) => app.server.listen(0, '127.0.0.1', r)); return `http://127.0.0.1:${app.server.address().port}/api` }
const seed = (db) => {
  db.put('properties', { id: 'p1', title: 'Villa', type: 'Villa', city: 'Antibes', surface: 200, price: 3e6, dpe: 'C' })
  db.put('dossiers', { id: 'd1', seller: 'Famille Test', propertyId: 'p1', agentId: 'a1', stage: 'offre', deliverables: {} })
}

test('démo : le lien public se lit sans compte, un jeton inconnu donne 404', async () => {
  const app = createApp({ dbPath: ':memory:', filesDir: join(tmpdir(), 'jaspe-pub-demo'), delay: now })
  const base = await listen(app)
  try {
    seed(app.db)
    const { path } = await app.engine.actions['evidence.link.create']({ dossierId: 'd1', party: 'acquereur' })
    const token = path.split('/').pop()
    const ok = await fetch(`${base}/public/depot/${token}`)
    assert.equal(ok.status, 200)
    const body = await ok.json()
    assert.ok(!JSON.stringify(body).includes('tokenHash'), 'l’empreinte du jeton ne sort jamais')
    assert.equal((await fetch(`${base}/public/depot/${'x'.repeat(30)}`)).status, 404)
  } finally { app.server.close() }
})

test('comptes : le lien porte l’agence ; agence inconnue ou absente → 404 sans ouvrir de base', async () => {
  const app = createApp({ auth: true, dataDir: ':memory:', filesDir: join(tmpdir(), 'jaspe-pub-auth'), delay: now, env: {}, fetch: () => { throw new Error('aucun appel réseau') } })
  const base = await listen(app)
  try {
    let cookie = ''
    const r = await fetch(`${base}/auth/register`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Anne Martin', email: 'anne@test.fr', password: 'motdepasse-solide', orgName: 'Agence A', country: 'FR', start: 'vide' }) })
    assert.equal(r.status < 300, true, `inscription : ${r.status}`)
    cookie = r.headers.get('set-cookie').split(';')[0]
    const me = await (await fetch(`${base}/me`, { headers: { cookie } })).json()
    const orgId = me.org.id
    seed(app.openOrg(orgId).db)
    const link = await (await fetch(`${base}/actions/evidence.link.create`, { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: JSON.stringify({ dossierId: 'd1', party: 'acquereur' }) })).json()
    assert.ok(link.path.startsWith(`/depot/${orgId}.`), link.path)
    const token = link.path.split('/').pop()
    assert.equal((await fetch(`${base}/public/depot/${token}`)).status, 200, 'lisible sans cookie')
    const secret = token.slice(orgId.length + 1)
    assert.equal((await fetch(`${base}/public/depot/${secret}`)).status, 404, 'sans agence')
    assert.equal((await fetch(`${base}/public/depot/inconnue.${secret}`)).status, 404, 'agence inconnue')
  } finally { app.server.close() }
})
