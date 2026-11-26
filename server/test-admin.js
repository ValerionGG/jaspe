// Back-office plateforme : accès administrateur, KYC (contrôles réels simulés côté réseau), validation, modules, tarifs, export.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp } from './index.js'
import { sirenValid, nifPtValid, cartePro, licencaAmi } from './admin.js'

const PW = 'motdepasse-solide'
// Registre des entreprises simulé : aucun appel réseau pendant les tests.
const registry = async (url) => {
  const siren = new URL(url).searchParams.get('q')
  return { ok: true, json: async () => ({ results: siren === '552100554' ? [{ siren, nom_complet: 'AGENCE DU PORT', etat_administratif: 'A', activite_principale: '68.31Z', siege: { adresse: '1 quai Test 06600 Antibes' } }] : [] }) }
}

async function boot() {
  const app = createApp({ auth: true, dataDir: ':memory:', filesDir: join(tmpdir(), 'jaspe-admin'), delay: () => Promise.resolve(), env: { JASPE_BETA: '0', JASPE_ADMIN_EMAILS: 'boss@jaspe.test' }, fetch: () => { throw new Error('aucun appel Stripe') }, kycFetch: registry })
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
  return { app, base, client, close: () => new Promise((r) => app.server.close(r)) }
}
const register = (c, email, orgName, country = 'FR') => c('POST', '/auth/register', { name: `Resp ${orgName}`, email, password: PW, orgName, country, start: 'vide' })

test('contrôles de format : SIREN, NIF portugais, carte T, licence AMI', () => {
  assert.equal(sirenValid('552 100 554'), true); assert.equal(sirenValid('552100555'), false)
  assert.equal(nifPtValid('501442600'), true); assert.equal(nifPtValid('501442601'), false)
  assert.equal(cartePro('CPI 0605 2024 000 041 872'), true); assert.equal(cartePro('carte 123'), false)
  assert.equal(licencaAmi('AMI 12345'), true); assert.equal(licencaAmi('abc'), false)
})

test('back-office : accès, KYC, validation, suspension, modules, tarifs, export, journal', async () => {
  const { client, base, close } = await boot()
  try {
    const boss = client(), agence = client(), autre = client()
    assert.equal((await register(boss, 'boss@jaspe.test', 'Jaspe HQ')).status, 201)
    const ra = await register(agence, 'anne@port.test', 'Agence du Port')
    const orgId = ra.json.org.id
    await register(autre, 'paul@autre.test', 'Autre agence')

    // Accès réservé
    assert.equal((await agence('GET', '/admin/overview')).status, 403, 'une agence n’accède pas au back-office')
    assert.equal((await boss('GET', '/me')).json.admin, true)
    assert.equal((await agence('GET', '/me')).json.admin, false)
    assert.equal((await agence('GET', '/me')).json.verification.state, 'en_attente')

    // KYC déposé par l’agence : contrôles automatiques (registre simulé)
    const k = await agence('POST', '/kyc', { companyId: '552 100 554', legalName: 'Agence du Port', cardNumber: 'CPI 0605 2024 000 041 872', managerName: 'Anne Martin' })
    assert.equal(k.status, 200, JSON.stringify(k.json))
    const byId = Object.fromEntries(k.json.kyc.result.checks.map((c) => [c.id, c.status]))
    assert.equal(byId.siren, 'ok'); assert.equal(byId.registre, 'ok'); assert.equal(byId.naf, 'ok'); assert.equal(byId.nom, 'ok'); assert.equal(byId.carte, 'manuel'); assert.equal(byId.responsable, 'ok')

    const ov = (await boss('GET', '/admin/overview')).json
    assert.equal(ov.orgs, 3); assert.equal(ov.pending, 1, 'une demande en attente')
    const list = (await boss('GET', '/admin/orgs')).json.orgs
    assert.ok(list.find((o) => o.id === orgId && o.kycSubmitted))

    // Validation, puis suspension (motif obligatoire) : l’agence est bloquée, /me reste lisible
    assert.equal((await boss('POST', `/admin/orgs/${orgId}/verify`, { decision: 'valide' })).status, 200)
    assert.equal((await agence('GET', '/me')).json.verification.state, 'valide')
    assert.equal((await boss('POST', `/admin/orgs/${orgId}/verify`, { decision: 'suspendu' })).status, 400, 'motif obligatoire')
    assert.equal((await boss('POST', `/admin/orgs/${orgId}/verify`, { decision: 'suspendu', note: 'Carte T expirée' })).status, 200)
    const blocked = await agence('GET', '/dossiers')
    assert.equal(blocked.status, 403); assert.match(blocked.json.error, /Carte T expirée/)
    assert.equal((await agence('GET', '/me')).status, 200)
    await boss('POST', `/admin/orgs/${orgId}/verify`, { decision: 'valide' })

    // Modules : facture coupée pour cette agence seulement
    const mods = await boss('PUT', `/admin/orgs/${orgId}/modules`, { modules: { factures: false } })
    assert.equal(mods.json.modules.factures, false)
    const cut = await agence('POST', '/actions/invoice.fromTransaction', { txId: 'x' })
    assert.equal(cut.status, 403); assert.match(cut.json.error, /Factures/)
    assert.notEqual((await autre('POST', '/actions/invoice.fromTransaction', { txId: 'x' })).status, 403, 'l’autre agence garde le module')
    assert.equal((await agence('GET', '/me')).json.modules.factures, false)

    // Module MCP coupé : le jeton ne permet plus d’accéder à l’agence
    const tok = (await agence('POST', '/actions/apitoken.create', { name: 'Test' })).json.token
    await boss('PUT', `/admin/orgs/${orgId}/modules`, { modules: { mcp: false } })
    const mcp = await fetch(base.replace('/api', '/mcp'), { method: 'POST', headers: { authorization: `Bearer ${tok}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) })
    assert.equal(mcp.status, 403)

    // Tarifs : prix et limite modifiés dans le back-office → site public et quotas
    const cfg = await boss('PUT', '/admin/config', { plans: { solo: { price: 12, dossiers: 25 } } })
    assert.equal(cfg.json.plans.solo.price, 12)
    const pub = await (await fetch(`${base}/public/plans`)).json()
    assert.equal(pub.plans.solo.price, 12); assert.equal(pub.plans.solo.dossiers, 25)
    assert.equal((await boss('PUT', `/admin/orgs/${orgId}/plan`, { plan: 'solo', status: 'active' })).status, 200)
    assert.equal((await agence('GET', '/me')).json.limits.dossiers, 25)

    // Données : export complet de l’agence, journal des actions d’administration
    await agence('POST', '/dossiers', { seller: 'Famille Export', stage: 'prep' })
    const exp = await fetch(`${base}/admin/orgs/${orgId}/export`, { headers: { cookie: '' } })
    assert.equal(exp.status, 401, 'export protégé')
    const detail = (await boss('GET', `/admin/orgs/${orgId}`)).json
    assert.ok(detail.usage.dossiers >= 1); assert.equal(detail.membersList.length, 1)
    const log = (await boss('GET', '/admin/log')).json.log
    assert.ok(log.some((l) => l.action === 'verification:suspendu') && log.some((l) => l.action === 'configuration') && log.some((l) => l.action === 'kyc:depot'))
  } finally { await close() }
})

test('KYC Portugal : NIF contrôlé, licence AMI à confirmer à la main', async () => {
  const { client, close } = await boot()
  try {
    const pt = client()
    await register(pt, 'ines@lisboa.test', 'Agência Lisboa', 'PT')
    const k = await pt('POST', '/kyc', { companyId: '501442600', cardNumber: 'AMI 12345', managerName: 'Inês Costa' })
    const byId = Object.fromEntries(k.json.kyc.result.checks.map((c) => [c.id, c.status]))
    assert.equal(byId.nif, 'ok'); assert.equal(byId.ami, 'manuel'); assert.equal(byId.responsable, 'ok')
  } finally { await close() }
})
