// Débrief WhatsApp en mode comptes : un numéro = une agence, message routé vers la bonne base, jamais ailleurs.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp } from './index.js'

const SECRET = 'app-secret-test'
const sign = (body) => `sha256=${createHmac('sha256', SECRET).update(body).digest('hex')}`
const payload = (from, text) => JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [{ id: 'WABA', changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', metadata: { phone_number_id: 'PNID' }, contacts: [{ wa_id: from }], messages: [{ from, id: `wamid.${from}.${text.length}`, timestamp: String(Math.floor(Date.now() / 1000) - 30), type: 'text', text: { body: text } }] } }] }],
})

test('comptes : numéro rattaché à une seule agence, débrief routé vers elle seule', async () => {
  const app = createApp({ auth: true, dataDir: ':memory:', filesDir: join(tmpdir(), 'jaspe-wa-comptes'), delay: () => Promise.resolve(), env: { JASPE_BETA: '1', WHATSAPP_APP_SECRET: SECRET, WHATSAPP_VERIFY_TOKEN: 'verif' }, fetch: () => { throw new Error('aucun appel réseau') } })
  await new Promise((r) => app.server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${app.server.address().port}/api`
  const client = () => {
    let cookie = ''
    return async (method, path, body) => {
      const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
      const set = r.headers.get('set-cookie'); if (set) cookie = set.split(';')[0]
      return { status: r.status, json: await r.json().catch(() => ({})) }
    }
  }
  try {
    const a = client(), b = client()
    const ra = await a('POST', '/auth/register', { name: 'Anne A', email: 'a@x.fr', password: 'motdepasse-solide', orgName: 'Agence A', country: 'FR', start: 'vide' })
    const rb = await b('POST', '/auth/register', { name: 'Bruno B', email: 'b@x.fr', password: 'motdepasse-solide', orgName: 'Agence B', country: 'FR', start: 'vide' })
    const orgA = ra.json.org.id, orgB = rb.json.org.id
    assert.equal((await a('POST', '/settings', { id: 'whatsapp-agents', agents: { '+33 6 12 34 56 78': { agentId: ra.json.user.id, name: 'Anne A' } } })).status, 201)
    // Agence B tente de capter le même numéro : refusé, sinon elle recevrait les débriefs de A.
    const steal = await b('POST', '/settings', { id: 'whatsapp-agents', agents: { '0033612345678': { agentId: rb.json.user.id, name: 'Bruno B' } } })
    assert.equal(steal.status, 409, JSON.stringify(steal.json))

    const hook = async (body) => { const r = await fetch(`${base}/whatsapp/webhook`, { method: 'POST', headers: { 'x-hub-signature-256': sign(body), 'content-type': 'application/json' }, body }); return r.status }
    assert.equal(await hook(payload('33612345678', 'RDV terminé. Je rappelle le vendeur vendredi.')), 200)
    assert.equal(await hook(payload('33699999999', 'Numéro inconnu, rien ne doit être créé.')), 200)
    const bad = await fetch(`${base}/whatsapp/webhook`, { method: 'POST', headers: { 'x-hub-signature-256': 'sha256=00' }, body: payload('33612345678', 'x') })
    assert.equal(bad.status, 401, 'signature fausse refusée')
    await new Promise((r) => setTimeout(r, 50))
    assert.equal(app.openOrg(orgA).db.list('waplans').length, 1, 'débrief déposé chez A')
    assert.equal(app.openOrg(orgB).db.list('waplans').length, 0, 'rien chez B')
  } finally { app.server.close() }
})
