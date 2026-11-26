// Comptes, sessions, isolation par agence, invitations, sièges et quota de dossiers (JASPE_AUTH).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp } from './index.js'

const PW = 'motdepasse-solide'

async function boot(opts = {}) {
  const app = createApp({ auth: true, dataDir: ':memory:', filesDir: join(tmpdir(), 'jaspe-test-files'), delay: () => Promise.resolve(), env: { JASPE_BETA: '0' }, fetch: () => { throw new Error('aucun appel réseau attendu') }, ...opts })
  await new Promise((r) => app.server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${app.server.address().port}/api`
  /** Client avec son propre cookie de session. */
  const client = () => {
    let cookie = ''
    const call = async (method, path, body, headers = {}) => {
      const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) })
      const set = r.headers.get('set-cookie')
      if (set) cookie = set.split(';')[0].endsWith('=') ? '' : set.split(';')[0]
      return { status: r.status, json: await r.json().catch(() => ({})), headers: r.headers, setCookie: set }
    }
    return { call, get cookie() { return cookie }, set cookie(v) { cookie = v } }
  }
  return { ...app, client, close: () => new Promise((r) => app.server.close(r)) }
}
const register = (c, email, extra = {}) => c.call('POST', '/auth/register', { name: 'Anne Martin', email, password: PW, orgName: `Agence ${email}`, country: 'FR', start: 'vide', ...extra })

test('inscription, connexion, déconnexion, cookie et mot de passe haché', async () => {
  const app = await boot()
  try {
    const c = app.client()
    assert.equal((await c.call('GET', '/dossiers')).status, 401, 'sans session : 401')
    assert.equal((await c.call('GET', '/me')).status, 401)
    assert.equal((await register(c, 'a@x.fr', { password: 'court' })).status, 400, 'mot de passe < 10 caractères')
    assert.equal((await register(c, 'pas-un-email')).status, 400)
    const r = await register(c, 'A@X.fr')
    assert.equal(r.status, 201)
    assert.match(r.setCookie, /HttpOnly/); assert.match(r.setCookie, /SameSite=Lax/); assert.match(r.setCookie, /Max-Age=2592000/)
    assert.doesNotMatch(r.setCookie, /Secure/, 'pas de Secure en HTTP')
    assert.equal(r.json.user.email, 'a@x.fr'); assert.equal(r.json.user.role, 'owner')
    assert.equal(r.json.plan.id, 'decouverte'); assert.equal(r.json.limits.dossiers, 1)
    const stored = app.accounts.userByEmail('a@x.fr').pass
    assert.match(stored, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/); assert.ok(!stored.includes(PW))
    assert.equal((await register(app.client(), 'a@x.fr')).status, 409, 'adresse déjà utilisée')

    const me = await c.call('GET', '/me')
    assert.equal(me.status, 200); assert.equal(me.json.org.name, 'Agence A@X.fr')
    // Base vide : collections marquées amorcées (pas de démo), sauf routines / modèles / tutoriels / veille.
    const ds = await c.call('GET', '/dossiers')
    assert.deepEqual(ds.json, []); assert.equal(ds.headers.get('x-nxt-seeded'), '1')
    assert.equal((await c.call('GET', '/routines')).headers.get('x-nxt-seeded'), '0')
    assert.equal((await c.call('GET', '/settings/agency')).json.agencyName, 'Agence A@X.fr')

    assert.equal((await c.call('POST', '/auth/logout')).status, 200)
    assert.equal(c.cookie, '')
    const again = app.client()
    const l = await again.call('POST', '/auth/login', { email: 'a@x.fr', password: PW }, { 'x-forwarded-proto': 'https' })
    assert.equal(l.status, 200); assert.match(l.setCookie, /Secure/, 'Secure derrière HTTPS')
    assert.equal((await again.call('GET', '/me')).json.user.email, 'a@x.fr')
    // Démo (données de démonstration) : les collections restent à amorcer par le client.
    const d = app.client()
    await register(d, 'demo@x.fr', { start: 'demo' })
    assert.equal((await d.call('GET', '/dossiers')).headers.get('x-nxt-seeded'), '0')
  } finally { await app.close() }
})

test('session invalide après déconnexion ; mauvais mot de passe ; limitation des tentatives', async () => {
  const app = await boot()
  try {
    const c = app.client()
    await register(c, 'b@x.fr')
    const sid = c.cookie
    await c.call('POST', '/auth/logout')
    const stale = app.client(); stale.cookie = sid
    assert.equal((await stale.call('GET', '/me')).status, 401, 'la session supprimée ne sert plus')

    const t = app.client()
    const bad = await t.call('POST', '/auth/login', { email: 'b@x.fr', password: 'mauvais-mot-de-passe' })
    assert.equal(bad.status, 401); assert.equal(bad.json.error, 'E-mail ou mot de passe incorrect')
    assert.equal((await t.call('POST', '/auth/login', { email: 'inconnu@x.fr', password: PW })).json.error, 'E-mail ou mot de passe incorrect', 'même message sans compte')
    for (let i = 0; i < 4; i++) assert.equal((await t.call('POST', '/auth/login', { email: 'b@x.fr', password: 'mauvais-mot-de-passe' })).status, 401)
    const blocked = await t.call('POST', '/auth/login', { email: 'b@x.fr', password: PW })
    assert.equal(blocked.status, 429, '5 échecs en 15 min : bloqué même avec le bon mot de passe')
    assert.match(blocked.json.error, /Trop de tentatives/)
    // La limite vise e-mail + IP : une autre adresse reste utilisable.
    await register(app.client(), 'c@x.fr')
    assert.equal((await t.call('POST', '/auth/login', { email: 'c@x.fr', password: PW })).status, 200)
  } finally { await app.close() }
})

test('isolation : l’agence A ne voit jamais les données de B (REST, actions, SSE, fichiers)', async () => {
  const app = await boot()
  try {
    const a = app.client(), b = app.client()
    await register(a, 'a@a.fr'); await register(b, 'b@b.fr')
    const created = await a.call('POST', '/dossiers', { seller: 'Vendeur A', stage: 'rdv' })
    assert.equal(created.status, 201)
    await a.call('POST', '/contacts', { name: 'Contact A' })
    assert.equal((await a.call('GET', '/dossiers')).json.length, 1)
    assert.deepEqual((await b.call('GET', '/dossiers')).json, [], 'B ne voit pas le dossier de A')
    assert.deepEqual((await b.call('GET', '/contacts')).json, [])
    assert.equal((await b.call('GET', `/dossiers/${created.json.id}`)).status, 404)
    assert.equal((await b.call('PATCH', `/dossiers/${created.json.id}`, { seller: 'piraté' })).status, 404)
    assert.equal((await b.call('POST', '/actions/dossier.move', { id: created.json.id, stage: 'post' })).status, 404)
    assert.equal((await b.call('DELETE', `/dossiers/${created.json.id}`)).json.ok, false)
    assert.equal((await a.call('GET', `/dossiers/${created.json.id}`)).json.seller, 'Vendeur A')
    const f = await a.call('POST', '/files', { name: 'a.txt', type: 'text/plain', data: Buffer.from('secret A').toString('base64') })
    assert.equal((await b.call('GET', `/files/${f.json.id}/raw`)).status, 404, 'fichier de A introuvable pour B')
    const orgA = (await a.call('GET', '/me')).json.org.id, orgB = (await b.call('GET', '/me')).json.org.id
    assert.notEqual(orgA, orgB)
    assert.notEqual(app.openOrg(orgA).db, app.openOrg(orgB).db, 'une base par agence')
    assert.notEqual(app.openOrg(orgA).clients, app.openOrg(orgB).clients, 'un flux SSE par agence')
    await app.tick() // routines exécutées pour chaque agence active, sans erreur
    assert.ok(app.openOrg(orgA).db.list('runs').length > 0)
    assert.ok(app.openOrg(orgB).db.list('runs').length > 0)
  } finally { await app.close() }
})

test('invitation à usage unique, rôles et quota de sièges', async () => {
  const app = await boot()
  try {
    const owner = app.client()
    await register(owner, 'patron@agence.fr')
    const refused = await owner.call('POST', '/team/invite')
    assert.equal(refused.status, 402, 'Découverte : un seul siège'); assert.match(refused.json.error, /Agence/)
    const orgId = (await owner.call('GET', '/me')).json.org.id
    app.accounts.updateOrg(orgId, { plan: 'agence', status: 'active', seats: 7 })

    const inv = await owner.call('POST', '/team/invite')
    assert.equal(inv.status, 201); assert.match(inv.json.path, /^\/invitation\/[\w-]{40,}$/)
    const token = inv.json.token
    const info = await app.client().call('GET', `/auth/invite/${token}`)
    assert.equal(info.status, 200); assert.equal(info.json.org, 'Agence patron@agence.fr')
    const guest = app.client()
    const acc = await guest.call('POST', '/auth/accept', { token, name: 'Paul Conseil', email: 'paul@agence.fr', password: PW })
    assert.equal(acc.status, 201); assert.equal(acc.json.user.role, 'conseiller'); assert.equal(acc.json.org.id, orgId)
    assert.equal((await app.client().call('POST', '/auth/accept', { token, name: 'Autre', email: 'autre@agence.fr', password: PW })).status, 404, 'lien à usage unique')
    // Même agence, mêmes données.
    await owner.call('POST', '/dossiers', { seller: 'Partagé', stage: 'rdv' })
    assert.equal((await guest.call('GET', '/dossiers')).json[0].seller, 'Partagé')
    assert.equal((await guest.call('POST', '/team/invite')).status, 403, 'un conseiller n’invite pas')
    assert.equal((await guest.call('POST', '/billing/checkout', { plan: 'solo' })).status, 403)

    // 7 sièges : 2 membres + 5 invitations en attente, puis refus.
    for (let i = 0; i < 5; i++) assert.equal((await owner.call('POST', '/team/invite')).status, 201)
    const full = await owner.call('POST', '/team/invite')
    assert.equal(full.status, 402); assert.match(full.json.error, /7 sièges/)
    const team = await owner.call('GET', '/team')
    assert.equal(team.json.members.length, 2); assert.equal(team.json.invites.length, 5)
    assert.equal((await owner.call('DELETE', `/team/invites/${team.json.invites[0].id}`)).json.ok, true)
    assert.equal((await owner.call('POST', '/team/invite')).status, 201, 'une invitation révoquée libère un siège')

    // Lien expiré.
    const late = await owner.call('DELETE', `/team/invites/${team.json.invites[1].id}`)
    assert.equal(late.json.ok, true)
    const exp = await owner.call('POST', '/team/invite')
    app.accounts.db.prepare('UPDATE invites SET expiresAt = ? WHERE id = ?').run(new Date(Date.now() - 1000).toISOString(), exp.json.id)
    assert.equal((await app.client().call('GET', `/auth/invite/${exp.json.token}`)).status, 410)
    assert.equal((await app.client().call('POST', '/auth/accept', { token: exp.json.token, name: 'Trop tard', email: 'tard@agence.fr', password: PW })).status, 410)
  } finally { await app.close() }
})

test('limite de dossiers actifs : 402 au-delà, lecture seule après retour à Découverte', async () => {
  const app = await boot()
  try {
    const c = app.client()
    await register(c, 'quota@x.fr')
    assert.equal((await c.call('POST', '/dossiers', { seller: 'Un', stage: 'rdv' })).status, 201)
    const over = await c.call('POST', '/dossiers', { seller: 'Deux', stage: 'rdv' })
    assert.equal(over.status, 402); assert.match(over.json.error, /Découverte comprend 1 dossier actif/)
    const orgId = (await c.call('GET', '/me')).json.org.id
    app.accounts.updateOrg(orgId, { plan: 'solo', status: 'active' })
    for (let i = 0; i < 7; i++) assert.equal((await c.call('POST', '/dossiers', { seller: `S${i}`, stage: 'rdv' })).status, 201)
    assert.equal((await c.call('POST', '/dossiers', { seller: 'Neuvième', stage: 'rdv' })).status, 402, 'Solo : 8 dossiers actifs')
    const me = await c.call('GET', '/me')
    assert.equal(me.json.usage.dossiers, 8); assert.equal(me.json.limits.dossiers, 8)

    // Impayé : retour à Découverte, données conservées, dossiers au-delà du quota en lecture seule.
    app.accounts.updateOrg(orgId, { status: 'past_due' })
    const list = (await c.call('GET', '/dossiers')).json
    assert.equal(list.length, 8, 'aucune donnée supprimée')
    const [first, second] = list
    assert.equal((await c.call('PATCH', `/dossiers/${first.id}`, { next: 'ok' })).status, 200, 'le premier dossier reste modifiable')
    const ro = await c.call('PATCH', `/dossiers/${second.id}`, { next: 'refusé' })
    assert.equal(ro.status, 402); assert.match(ro.json.error, /lecture seule/)
    assert.equal((await c.call('POST', '/actions/dossier.move', { id: second.id, stage: 'post' })).status, 402)
    assert.equal((await c.call('POST', '/actions/dossier.move', { id: second.id, stage: 'acte' })).status, 200, 'clore un dossier reste possible')
    assert.equal((await c.call('GET', `/dossiers/${second.id}`)).status, 200, 'lecture toujours permise')
  } finally { await app.close() }
})

test('mode démonstration inchangé : /api/me signale la démo, pas de comptes', async () => {
  const app = createApp({ dbPath: ':memory:', auth: false })
  await new Promise((r) => app.server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${app.server.address().port}/api`
  try {
    assert.deepEqual(await (await fetch(`${base}/me`)).json(), { mode: 'demo' })
    assert.equal((await fetch(`${base}/auth/login`, { method: 'POST', body: '{}' })).status, 409)
    assert.equal((await fetch(`${base}/billing/checkout`, { method: 'POST', body: '{}' })).status, 503)
    assert.equal((await fetch(`${base}/dossiers`)).status, 200, 'API ouverte comme avant')
  } finally { await new Promise((r) => app.server.close(r)) }
})

test('bêta sans paiement : sans clé Stripe, offre « Bêta gratuite » sans quota et profil au nom du compte', async () => {
  const app = await boot({ env: {} })
  try {
    const c = app.client()
    const r = await register(c, 'beta@x.fr')
    assert.equal(r.status, 201)
    assert.equal(r.json.plan.id, 'beta'); assert.equal(r.json.billing.beta, true); assert.equal(r.json.limits.dossiers, null)
    for (const seller of ['Un', 'Deux', 'Trois']) assert.equal((await c.call('POST', '/dossiers', { seller, stage: 'prep' })).status < 300, true, `dossier ${seller}`)
    const profile = (await c.call('GET', '/settings')).json.find((s) => s.id === 'profile')
    assert.equal(profile.name, 'Anne Martin'); assert.equal(profile.email, 'beta@x.fr')
    assert.doesNotMatch(JSON.stringify(profile), /Delmas/)
  } finally { await app.close() }
})
