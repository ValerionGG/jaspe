// E-mails réels après validation et réinitialisation du mot de passe — transport simulé (jsonTransport), aucun envoi réel.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import nodemailer from 'nodemailer'
import { openDb } from './db.js'
import { createEngine, HttpError } from './engine.js'
import { createMailer, sendOutbox, sendDueOutbox, quietUntil, createMailActions, CONSIGNED } from './mailer.js'
import { createAccounts, createGate, hashPassword } from './auth.js'

/** Transport nodemailer JSON : les messages sont capturés, jamais émis. */
function fakeMailer(extraEnv = {}) {
  const sent = []
  const json = nodemailer.createTransport({ jsonTransport: true })
  const transport = { sendMail: async (m) => { const info = await json.sendMail(m); sent.push(JSON.parse(info.message)); return info } }
  return { mailer: createMailer({ env: { SMTP_FROM: 'Agence <agence@test.fr>', JASPE_PUBLIC_URL: 'https://jaspe.test/', ...extraEnv }, transport }), sent }
}
const NOON = new Date(2026, 10, 26, 12, 0)

function setup({ sellerEmail = 'vendeur@test.fr', quiet = { quietFrom: '20:00', quietTo: '08:00' } } = {}) {
  const db = openDb(':memory:')
  db.seed('properties', [{ id: 'p1', title: 'Villa vue mer', type: 'Villa', address: '1 ch. des Nielles', district: 'Cap d’Antibes', city: 'Antibes', surface: 200, rooms: 6, price: 3e6, estimateLow: 2.8e6, estimateHigh: 3.1e6, dpe: 'B', features: ['Piscine'] }])
  db.seed('agents', [{ id: 'a1', name: 'Claire Delmas', email: 'claire@test.fr' }])
  db.seed('dossiers', [{ id: 'd1', ref: 'VND-1', seller: 'Famille Test', propertyId: 'p1', agentId: 'a1', stage: 'rdv', next: 'Débrief', due: 'Demain', tags: [], motivation: 'Départ', timeline: '3 mois', deliverables: {} }])
  db.seed('contacts', sellerEmail ? [{ id: 'c1', name: 'Famille Test', email: sellerEmail }] : [])
  db.seed('settings', [{ id: 'agency', signature: 'Claire Delmas — Jaspe', ...quiet }])
  const engine = createEngine(db, () => {}, { delay: () => Promise.resolve() })
  const patch = (col, id, p) => db.patch(col, id, p)
  return { db, engine, patch }
}
async function validated(env) {
  await env.engine.actions['deliverable.generate']({ dossierId: 'd1', code: 'L1' })
  const { outbox } = env.engine.actions['deliverable.validate']({ dossierId: 'd1', code: 'L1' })
  assert.ok(outbox, 'L1 validé crée un élément outbox')
  return outbox
}

test('mailer : configuration par variables SMTP_*', () => {
  assert.equal(createMailer({ env: {} }).configured, false)
  const m = createMailer({ env: { SMTP_HOST: 'smtp.test', SMTP_PORT: '465', SMTP_USER: 'u@test.fr', SMTP_PASS: 'x' } })
  assert.equal(m.configured, true); assert.equal(m.from, 'u@test.fr')
  assert.equal(createMailer({ env: { SMTP_HOST: 'smtp.test' } }).configured, false, 'sans expéditeur : non configuré')
})

test('livrable validé → e-mail envoyé au vendeur (adresse des contacts), statut envoyé + messageId', async () => {
  const env = setup(), { mailer, sent } = fakeMailer()
  const o = await validated(env)
  const r = await sendOutbox(env.db, mailer, o.id, { patch: env.patch, now: NOON })
  assert.equal(r.status, 'envoyé'); assert.ok(r.messageId); assert.ok(r.sentAt)
  assert.equal(sent.length, 1)
  assert.equal(sent[0].to[0].address, 'vendeur@test.fr')
  assert.equal(sent[0].replyTo[0].address, 'claire@test.fr')
  assert.equal(sent[0].subject, env.db.get('documents', 'd1-L1').subject)
  assert.match(sent[0].text, /Claire Delmas — Jaspe/)
  await assert.rejects(sendOutbox(env.db, mailer, o.id, { patch: env.patch, now: NOON }), /déjà été envoyé/)
  assert.equal(sent.length, 1, 'jamais deux envois')
})

test('jamais d’envoi sans validation humaine (ni après modification du document)', async () => {
  const env = setup(), { mailer, sent } = fakeMailer()
  await env.engine.actions['deliverable.generate']({ dossierId: 'd1', code: 'L1' })
  const forged = env.db.put('outbox', { dossierId: 'd1', code: 'L1', to: 'pirate@x.fr', subject: 'x', status: 'programmé', at: new Date().toISOString(), channel: 'E-mail' })
  await assert.rejects(sendOutbox(env.db, mailer, forged.id, { now: NOON }), /pas été validé/)
  const o = await validated(env)
  await new Promise((r) => setTimeout(r, 5))
  env.engine.actions['deliverable.edit']({ dossierId: 'd1', code: 'L1', body: ['Modifié après validation'] })
  await assert.rejects(sendOutbox(env.db, mailer, o.id, { now: NOON }), /modifié depuis sa validation/)
  assert.equal(sent.length, 0)
})

test('adresse e-mail du vendeur manquante → échec clair', async () => {
  const env = setup({ sellerEmail: null }), { mailer, sent } = fakeMailer()
  const o = await validated(env)
  await assert.rejects(sendOutbox(env.db, mailer, o.id, { patch: env.patch, now: NOON }), (e) => e instanceof HttpError && e.status === 409 && /adresse e-mail du vendeur manquante/i.test(e.message))
  const after = env.db.get('outbox', o.id)
  assert.equal(after.status, 'échec'); assert.match(after.error, /vendeur manquante/)
  assert.equal(sent.length, 0)
})

test('heures calmes : programmé, puis envoyé au premier tick après la fin', async () => {
  const env = setup(), { mailer, sent } = fakeMailer()
  const night = new Date(2026, 10, 26, 22, 30)
  assert.equal(quietUntil({ quietFrom: '20:00', quietTo: '08:00' }, night).getHours(), 8)
  assert.equal(quietUntil({ quietFrom: '20:00', quietTo: '08:00' }, NOON), null)
  const o = await validated(env)
  const r = await sendOutbox(env.db, mailer, o.id, { patch: env.patch, now: night })
  assert.equal(r.status, 'programmé'); assert.equal(new Date(r.scheduledFor).getDate(), 27)
  assert.equal(sent.length, 0)
  assert.equal((await sendDueOutbox(env.db, mailer, { patch: env.patch, now: new Date(2026, 10, 27, 7, 0) })).length, 0, 'encore en heures calmes')
  const out = await sendDueOutbox(env.db, mailer, { patch: env.patch, now: new Date(2026, 10, 27, 8, 5) })
  assert.equal(out[0].status, 'envoyé'); assert.equal(sent.length, 1)
})

test('sans SMTP : envoi consigné comme aujourd’hui ; échec du transport → statut échec', async () => {
  const env = setup()
  const o = await validated(env)
  const r = await sendOutbox(env.db, createMailer({ env: {} }), o.id, { patch: env.patch, now: NOON })
  assert.equal(r.status, CONSIGNED)
  const env2 = setup()
  const o2 = await validated(env2)
  const broken = createMailer({ env: { SMTP_FROM: 'a@test.fr' }, transport: { sendMail: async () => { throw new Error('connexion refusée') } } })
  await assert.rejects(sendOutbox(env2.db, broken, o2.id, { patch: env2.patch, now: NOON }), /connexion refusée/)
  assert.equal(env2.db.get('outbox', o2.id).status, 'échec')
})

test('mail.status / mail.test : test limité aux adresses de l’équipe', async () => {
  const env = setup(), { mailer, sent } = fakeMailer()
  const a = createMailActions(env.db, mailer)
  assert.equal(a['mail.status']().configured, true)
  await assert.rejects(a['mail.test']({ to: 'inconnu@x.fr' }), /membre de l’équipe/)
  assert.ok((await a['mail.test']({ to: 'claire@test.fr' })).messageId)
  await assert.rejects(a['mail.test']({ to: 'claire@test.fr' }), /30 secondes/)
  assert.equal(sent.length, 1)
  await assert.rejects(createMailActions(env.db, createMailer({ env: {} }))['mail.test']({ to: 'claire@test.fr' }), /non configuré/)
})

/* ——— Mot de passe oublié ——— */
async function bootGate(mailer) {
  const accounts = createAccounts(':memory:')
  const orgs = new Map()
  const openOrg = (id) => { if (!orgs.has(id)) orgs.set(id, { db: openDb(':memory:') }); return orgs.get(id) }
  const send = (res, status, body, headers = {}) => { res.writeHead(status, { 'content-type': 'application/json', ...headers }); res.end(JSON.stringify(body)) }
  const readBody = (req) => new Promise((resolve) => { const c = []; req.on('data', (x) => c.push(x)); req.on('end', () => resolve(c.length ? JSON.parse(Buffer.concat(c).toString()) : {})) })
  const gate = createGate({ accounts, billing: { configured: () => false }, openOrg, send, readBody, mailer })
  const server = createServer(async (req, res) => {
    try { const parts = new URL(req.url, 'http://x').pathname.slice(5).split('/').filter(Boolean); const ctx = await gate.handle(req, res, parts); if (ctx) send(res, 200, { ok: true }) }
    catch (e) { send(res, e.status ?? 500, { error: e.message }) }
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${server.address().port}/api`
  const call = async (method, path, body, cookie) => {
    const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body && JSON.stringify(body) })
    return { status: r.status, json: await r.json(), cookie: r.headers.get('set-cookie')?.split(';')[0] }
  }
  const org = accounts.createOrg({ name: 'Agence Test', country: 'FR' })
  accounts.createUser({ email: 'anne@test.fr', name: 'Anne', pass: await hashPassword('ancien-mot-de-passe'), orgId: org.id, role: 'owner' })
  return { accounts, call, close: () => new Promise((r) => server.close(r)) }
}
const tick = () => new Promise((r) => setTimeout(r, 30))
const tokenOf = (m) => /\/reinitialiser\/([A-Za-z0-9_-]+)/.exec(m.text)[1]

test('mot de passe oublié : réponse identique, jeton haché, usage unique, sessions invalidées', async () => {
  const { mailer, sent } = fakeMailer()
  const g = await bootGate(mailer)
  try {
    const login = await g.call('POST', '/auth/login', { email: 'anne@test.fr', password: 'ancien-mot-de-passe' })
    assert.equal(login.status, 200)
    assert.equal((await g.call('GET', '/me', undefined, login.cookie)).status, 200)

    const unknown = await g.call('POST', '/auth/forgot', { email: 'personne@test.fr' })
    const known = await g.call('POST', '/auth/forgot', { email: 'Anne@test.fr' })
    assert.equal(unknown.status, 200); assert.deepEqual(unknown.json, known.json, 'même réponse que le compte existe ou non')
    await tick()
    assert.equal(sent.length, 1, 'un seul e-mail : celui du compte existant')
    assert.equal(sent[0].to[0].address, 'anne@test.fr')
    const t = tokenOf(sent[0])
    assert.match(sent[0].text, /https:\/\/jaspe\.test\/reinitialiser\//)
    const row = g.accounts.db.prepare('SELECT * FROM resets').get()
    assert.notEqual(row.tokenHash, t, 'jeton stocké haché'); assert.ok(Date.parse(row.expiresAt) - Date.now() <= 3600e3)

    assert.equal((await g.call('POST', '/auth/reset', { token: t, password: 'court' })).status, 400)
    assert.equal((await g.call('POST', '/auth/reset', { token: t, password: 'nouveau-mot-de-passe' })).status, 200)
    assert.equal((await g.call('GET', '/me', undefined, login.cookie)).status, 401, 'toutes les sessions sont invalidées')
    assert.equal((await g.call('POST', '/auth/reset', { token: t, password: 'encore-un-autre-mdp' })).status, 404, 'jeton à usage unique')
    assert.equal((await g.call('POST', '/auth/login', { email: 'anne@test.fr', password: 'ancien-mot-de-passe' })).status, 401)
    assert.equal((await g.call('POST', '/auth/login', { email: 'anne@test.fr', password: 'nouveau-mot-de-passe' })).status, 200)
  } finally { await g.close() }
})

test('mot de passe oublié : jeton expiré, ancien jeton remplacé, limitation de fréquence, sans SMTP', async () => {
  const { mailer, sent } = fakeMailer()
  const g = await bootGate(mailer)
  try {
    await g.call('POST', '/auth/forgot', { email: 'anne@test.fr' }); await tick()
    await g.call('POST', '/auth/forgot', { email: 'anne@test.fr' }); await tick()
    const [first, second] = sent.map(tokenOf)
    assert.equal((await g.call('POST', '/auth/reset', { token: first, password: 'nouveau-mot-de-passe' })).status, 404, 'une nouvelle demande annule la précédente')
    g.accounts.db.prepare('UPDATE resets SET expiresAt = ?').run(new Date(Date.now() - 1000).toISOString())
    assert.equal((await g.call('POST', '/auth/reset', { token: second, password: 'nouveau-mot-de-passe' })).status, 410, 'jeton expiré')
    assert.equal((await g.call('POST', '/auth/forgot', { email: 'anne@test.fr' })).status, 200)
    assert.equal((await g.call('POST', '/auth/forgot', { email: 'anne@test.fr' })).status, 429, 'limité en fréquence')
    assert.equal((await g.call('POST', '/auth/forgot', { email: 'autre@test.fr' })).status, 200)
  } finally { await g.close() }
  const none = await bootGate(createMailer({ env: {} }))
  try {
    const r = await none.call('POST', '/auth/forgot', { email: 'anne@test.fr' })
    assert.equal(r.status, 200); assert.equal(r.json.mail, false)
    assert.equal(none.accounts.db.prepare('SELECT COUNT(*) AS n FROM resets').get().n, 0, 'sans SMTP : aucun jeton créé')
  } finally { await none.close() }
})

test('invitation envoyée par e-mail quand SMTP est configuré', async () => {
  const { mailer, sent } = fakeMailer()
  const g = await bootGate(mailer)
  try {
    g.accounts.updateOrg(g.accounts.userByEmail('anne@test.fr').orgId, { plan: 'agence', status: 'active' })
    const { cookie } = await g.call('POST', '/auth/login', { email: 'anne@test.fr', password: 'ancien-mot-de-passe' })
    assert.equal((await g.call('POST', '/team/invite', { email: 'pas-un-email' }, cookie)).status, 400)
    const r = await g.call('POST', '/team/invite', { email: 'bob@test.fr' }, cookie)
    assert.equal(r.status, 201); assert.equal(r.json.emailed, true); assert.ok(r.json.path.startsWith('/invitation/'))
    assert.equal(sent[0].to[0].address, 'bob@test.fr'); assert.ok(sent[0].text.includes(`https://jaspe.test${r.json.path}`))
    const plain = await g.call('POST', '/team/invite', {}, cookie)
    assert.equal(plain.json.emailed, false, 'sans adresse : lien à copier')
  } finally { await g.close() }
})
