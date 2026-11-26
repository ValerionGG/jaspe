// Paiement Stripe : checkout, portail, webhook signé. Aucun appel réel : fetch injecté.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp } from './index.js'
import { verifySignature, signPayload } from './billing.js'

const PW = 'motdepasse-solide'
const SECRET = 'whsec_test_123'
const ENV = {
  STRIPE_SECRET_KEY: 'sk_test_fictive', STRIPE_WEBHOOK_SECRET: SECRET,
  STRIPE_PRICE_SOLO_MONTH: 'price_solo_m', STRIPE_PRICE_SOLO_YEAR: 'price_solo_y', STRIPE_PRICE_AGENCE: 'price_agence',
  STRIPE_PRICE_SEAT: 'price_seat', STRIPE_PRICE_PREUVES: 'price_preuves', STRIPE_PRICE_DONNEES: 'price_donnees',
}

async function boot(env, fetchImpl) {
  const app = createApp({ auth: true, dataDir: ':memory:', filesDir: join(tmpdir(), 'jaspe-test-files'), delay: () => Promise.resolve(), env, fetch: fetchImpl })
  await new Promise((r) => app.server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${app.server.address().port}/api`
  let cookie = ''
  const call = async (method, path, body, headers = {}) => {
    const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...headers }, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) })
    const set = r.headers.get('set-cookie'); if (set) cookie = set.split(';')[0]
    return { status: r.status, json: await r.json().catch(() => ({})) }
  }
  const reg = await call('POST', '/auth/register', { name: 'Anne', email: 'anne@agence.fr', password: PW, orgName: 'Agence Test', country: 'FR', start: 'vide' })
  const hook = (event, { secret = SECRET, t } = {}) => { const payload = JSON.stringify(event); return call('POST', '/billing/webhook', payload, { 'stripe-signature': signPayload(payload, secret, t) }) }
  return { ...app, call, hook, orgId: reg.json.org.id, close: () => new Promise((r) => app.server.close(r)) }
}

test('sans clé Stripe : 503 « Paiement non configuré », aucun appel réseau', async () => {
  let calls = 0
  const app = await boot({}, () => { calls++; throw new Error('interdit') })
  try {
    const r = await app.call('POST', '/billing/checkout', { plan: 'solo', period: 'month' })
    assert.equal(r.status, 503); assert.equal(r.json.error, 'Paiement non configuré')
    assert.equal((await app.call('POST', '/billing/portal')).status, 503)
    assert.equal((await app.call('POST', '/billing/webhook', '{}', { 'stripe-signature': 't=1,v1=00' })).status, 503)
    assert.equal((await app.call('GET', '/me')).json.billing.configured, false)
    assert.equal(calls, 0)
  } finally { await app.close() }
})

test('checkout : URL Stripe, mode abonnement, client_reference_id = agence, lignes de prix', async () => {
  const seen = []
  const fake = async (url, init) => {
    seen.push({ url, init, body: new URLSearchParams(init.body) })
    if (url.endsWith('/checkout/sessions')) return new Response(JSON.stringify({ id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' }), { status: 200 })
    if (url.endsWith('/billing_portal/sessions')) return new Response(JSON.stringify({ url: 'https://billing.stripe.com/p/session/test' }), { status: 200 })
    return new Response('{}', { status: 404 })
  }
  const app = await boot(ENV, fake)
  try {
    const r = await app.call('POST', '/billing/checkout', { plan: 'solo', period: 'year', options: ['preuves'] })
    assert.equal(r.status, 200); assert.equal(r.json.url, 'https://checkout.stripe.com/c/pay/cs_test_1')
    const s = seen[0]
    assert.equal(s.url, 'https://api.stripe.com/v1/checkout/sessions')
    assert.equal(s.init.headers.authorization, 'Bearer sk_test_fictive')
    assert.equal(s.body.get('mode'), 'subscription')
    assert.equal(s.body.get('client_reference_id'), app.orgId)
    assert.equal(s.body.get('customer_email'), 'anne@agence.fr')
    assert.equal(s.body.get('line_items[0][price]'), 'price_solo_y')
    assert.equal(s.body.get('line_items[1][price]'), 'price_preuves')
    assert.equal(s.body.get('subscription_data[metadata][orgId]'), app.orgId)
    assert.match(s.body.get('success_url'), /\/app\/reglages\?s=facturation&paiement=ok$/)

    await app.call('POST', '/billing/checkout', { plan: 'agence', seats: 10, options: ['donnees'] })
    const ag = seen[1].body
    assert.equal(ag.get('line_items[0][price]'), 'price_agence')
    assert.equal(ag.get('line_items[1][price]'), 'price_seat'); assert.equal(ag.get('line_items[1][quantity]'), '3', '6 € par siège au-delà de 7')
    assert.equal(ag.get('line_items[2][price]'), 'price_donnees')
    assert.equal((await app.call('POST', '/billing/checkout', { plan: 'agence', period: 'year' })).status, 400)
    assert.equal((await app.call('POST', '/billing/checkout', { plan: 'or' })).status, 400)
    assert.equal((await app.call('POST', '/billing/portal')).status, 409, 'pas de portail sans client Stripe')

    // Paiement confirmé (webhook) → portail de résiliation disponible.
    const done = await app.hook({ id: 'evt_1', type: 'checkout.session.completed', data: { object: { object: 'checkout.session', client_reference_id: app.orgId, customer: 'cus_1', subscription: 'sub_1', metadata: { plan: 'solo', period: 'year', options: 'preuves', seats: '1' } } } })
    assert.equal(done.status, 200)
    const p = await app.call('POST', '/billing/portal')
    assert.equal(p.json.url, 'https://billing.stripe.com/p/session/test')
    assert.equal(seen.at(-1).body.get('customer'), 'cus_1')
    assert.equal((await app.call('POST', '/billing/checkout', { plan: 'agence' })).status, 409, 'un seul abonnement : changement via le portail')
    await app.hook({ id: 'evt_2', type: 'customer.subscription.deleted', data: { object: { object: 'subscription', id: 'sub_1', customer: 'cus_1', status: 'canceled' } } })
    assert.equal((await app.call('POST', '/billing/checkout', { plan: 'agence' })).status, 200, 'réabonnement après résiliation')
    assert.equal(seen.at(-1).body.get('customer'), 'cus_1', 'client Stripe réutilisé')
  } finally { await app.close() }
})

test('webhook : signature valide, invalide, périmée ; cycle de vie de l’abonnement', async () => {
  const app = await boot(ENV, async () => new Response('{}'))
  try {
    const completed = { id: 'evt_a', type: 'checkout.session.completed', data: { object: { client_reference_id: app.orgId, customer: 'cus_9', subscription: 'sub_9', metadata: { plan: 'solo', period: 'month', options: '', seats: '1' } } } }
    assert.equal((await app.hook(completed, { secret: 'whsec_autre' })).status, 400, 'mauvais secret')
    assert.equal((await app.hook(completed, { t: Math.floor(Date.now() / 1000) - 600 })).status, 400, 'horodatage > 5 min')
    assert.equal((await app.call('POST', '/billing/webhook', JSON.stringify(completed))).status, 400, 'sans en-tête')
    assert.equal((await app.call('GET', '/me')).json.plan.id, 'decouverte', 'rien appliqué sans signature valide')

    const ok = await app.hook(completed)
    assert.equal(ok.status, 200); assert.equal(ok.json.result, 'abonnement activé')
    let me = (await app.call('GET', '/me')).json
    assert.equal(me.plan.id, 'solo'); assert.equal(me.plan.status, 'active'); assert.equal(me.limits.dossiers, 20)
    assert.equal((await app.hook(completed)).json.duplicate, true, 'événement rejoué ignoré')

    // Passage à Agence avec 3 sièges en plus et l’option Données marché.
    await app.hook({ id: 'evt_b', type: 'customer.subscription.updated', data: { object: { object: 'subscription', id: 'sub_9', customer: 'cus_9', status: 'active', cancel_at_period_end: true, current_period_end: 1893456000, items: { data: [{ price: { id: 'price_agence' }, quantity: 1 }, { price: { id: 'price_seat' }, quantity: 3 }, { price: { id: 'price_donnees' }, quantity: 1 }] } } } })
    me = (await app.call('GET', '/me')).json
    assert.equal(me.plan.id, 'agence'); assert.equal(me.limits.seats, 10); assert.equal(me.limits.dossiers, null)
    assert.deepEqual(me.plan.options, ['donnees']); assert.equal(me.plan.cancelAtPeriodEnd, true)

    await app.hook({ id: 'evt_c', type: 'invoice.payment_failed', data: { object: { object: 'invoice', customer: 'cus_9', subscription: 'sub_9' } } })
    me = (await app.call('GET', '/me')).json
    assert.equal(me.plan.status, 'past_due'); assert.equal(me.plan.id, 'decouverte', 'impayé : retour à Découverte'); assert.equal(me.limits.dossiers, 1)

    await app.hook({ id: 'evt_d', type: 'customer.subscription.deleted', data: { object: { object: 'subscription', id: 'sub_9', customer: 'cus_9', status: 'canceled' } } })
    me = (await app.call('GET', '/me')).json
    assert.equal(me.plan.status, 'canceled'); assert.equal(me.plan.id, 'decouverte')
    assert.equal((await app.hook({ id: 'evt_e', type: 'customer.created', data: { object: {} } })).json.result, 'ignoré')
  } finally { await app.close() }
})

test('verifySignature : temps constant, plusieurs v1, tolérance', () => {
  const payload = '{"id":"evt"}'
  const t = 1_800_000_000
  const header = signPayload(payload, SECRET, t)
  assert.equal(verifySignature(payload, header, SECRET, { now: t * 1000 }), true)
  assert.equal(verifySignature(payload, `t=${t},v1=deadbeef,${header.split(',')[1]}`, SECRET, { now: t * 1000 }), true, 'une des signatures v1 suffit')
  assert.equal(verifySignature(payload + ' ', header, SECRET, { now: t * 1000 }), false, 'corps modifié')
  assert.equal(verifySignature(payload, header, SECRET, { now: (t + 301) * 1000 }), false, 'au-delà de 5 min')
  assert.equal(verifySignature(payload, header, SECRET, { now: (t + 299) * 1000 }), true)
  assert.equal(verifySignature(payload, 'v1=abc', SECRET), false)
  assert.equal(verifySignature(payload, header, ''), false)
})
