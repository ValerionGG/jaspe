// Paiement Stripe en libre-service, via l’API REST (fetch, sans SDK). Aucun faux paiement : sans clé, 503.
import { createHmac, timingSafeEqual } from 'node:crypto'
import { HttpError } from './engine.js'
import { PLANS, OPTIONS, readRaw } from './auth.js'

const API = 'https://api.stripe.com/v1'
const TOLERANCE_S = 300

/** Encodage application/x-www-form-urlencoded à la manière de Stripe (objets et tableaux imbriqués). */
export function formEncode(obj, prefix = '') {
  const out = []
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue
    const key = prefix ? `${prefix}[${k}]` : k
    if (typeof v === 'object') out.push(formEncode(v, key))
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
  }
  return out.filter(Boolean).join('&')
}

/** Signature Stripe : HMAC-SHA256 de « t.payload », comparée en temps constant, horodatage à ±5 min. */
export function verifySignature(payload, header, secret, { now = Date.now(), tolerance = TOLERANCE_S } = {}) {
  if (!header || !secret) return false
  const parts = String(header).split(',').map((p) => p.trim().split('='))
  const t = Number(parts.find(([k]) => k === 't')?.[1])
  const sigs = parts.filter(([k]) => k === 'v1').map(([, v]) => v)
  if (!Number.isFinite(t) || !sigs.length) return false
  if (Math.abs(now / 1000 - t) > tolerance) return false
  const expected = Buffer.from(createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex'), 'hex')
  return sigs.some((s) => { const b = Buffer.from(String(s), 'hex'); return b.length === expected.length && timingSafeEqual(b, expected) })
}
/** Pour les tests : en-tête Stripe-Signature valide. */
export const signPayload = (payload, secret, t = Math.floor(Date.now() / 1000)) => `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')}`

export function createBilling({ accounts, env = process.env, fetch: fetchImpl = (...a) => globalThis.fetch(...a) }) {
  const key = () => env.STRIPE_SECRET_KEY
  const prices = () => ({
    solo_month: env.STRIPE_PRICE_SOLO_MONTH, solo_year: env.STRIPE_PRICE_SOLO_YEAR, agence: env.STRIPE_PRICE_AGENCE,
    seat: env.STRIPE_PRICE_SEAT, preuves: env.STRIPE_PRICE_PREUVES, donnees: env.STRIPE_PRICE_DONNEES,
  })
  const configured = () => !!key()
  const origin = (req) => env.JASPE_PUBLIC_URL?.replace(/\/$/, '') || `${String(req.headers['x-forwarded-proto'] ?? '').split(',')[0].trim() || (req.socket?.encrypted ? 'https' : 'http')}://${req.headers.host ?? '127.0.0.1'}`

  async function stripe(path, params) {
    if (!configured()) throw new HttpError(503, 'Paiement non configuré')
    let r
    try {
      r = await fetchImpl(`${API}${path}`, { method: 'POST', headers: { authorization: `Bearer ${key()}`, 'content-type': 'application/x-www-form-urlencoded', 'stripe-version': '2024-06-20' }, body: formEncode(params) })
    } catch { throw new HttpError(502, 'Stripe injoignable : réessayez dans un instant') }
    const json = await r.json().catch(() => ({}))
    if (!r.ok) throw new HttpError(502, `Stripe : ${json?.error?.message ?? `erreur ${r.status}`}`)
    return json
  }

  async function checkout(req, { user, org }, body = {}) {
    if (!configured()) throw new HttpError(503, 'Paiement non configuré')
    const plan = body.plan, period = body.period === 'year' ? 'year' : 'month'
    if (plan !== 'solo' && plan !== 'agence') throw new HttpError(400, 'Offre inconnue : solo ou agence')
    // Un seul abonnement par agence : les changements passent par le portail client.
    if (org.subscriptionId && ['active', 'trialing', 'past_due'].includes(org.status)) throw new HttpError(409, 'Abonnement déjà en cours : changez d’offre depuis « Gérer ou résilier »')
    if (plan === 'agence' && period === 'year') throw new HttpError(400, 'L’offre Agence est mensuelle')
    const options = [...new Set(Array.isArray(body.options) ? body.options : [])]
    if (options.some((o) => !OPTIONS[o])) throw new HttpError(400, 'Option inconnue')
    const seats = plan === 'agence' ? Math.max(PLANS.agence.seats, Math.min(200, Math.floor(Number(body.seats) || PLANS.agence.seats))) : 1
    const p = prices()
    const items = [{ price: plan === 'agence' ? p.agence : p[`solo_${period}`], quantity: 1 }]
    if (plan === 'agence' && seats > PLANS.agence.seats) items.push({ price: p.seat, quantity: seats - PLANS.agence.seats })
    for (const o of options) items.push({ price: p[o], quantity: 1 })
    if (items.some((i) => !i.price)) throw new HttpError(503, 'Paiement non configuré : identifiant de prix Stripe manquant')
    const meta = { orgId: org.id, plan, period, options: options.join(','), seats: String(seats) }
    const base = origin(req)
    const session = await stripe('/checkout/sessions', {
      mode: 'subscription',
      client_reference_id: org.id,
      ...(org.customerId ? { customer: org.customerId } : { customer_email: user.email }),
      line_items: Object.fromEntries(items.map((it, i) => [i, it])),
      metadata: meta,
      subscription_data: { metadata: meta },
      allow_promotion_codes: 'true',
      success_url: `${base}/app/reglages?s=facturation&paiement=ok`,
      cancel_url: `${base}/app/reglages?s=facturation&paiement=annule`,
    })
    if (!session.url) throw new HttpError(502, 'Stripe : URL de paiement absente')
    return { url: session.url, id: session.id }
  }

  async function portal(req, { org }) {
    if (!configured()) throw new HttpError(503, 'Paiement non configuré')
    if (!org.customerId) throw new HttpError(409, 'Aucun abonnement à gérer : vous êtes sur l’offre Découverte')
    const s = await stripe('/billing_portal/sessions', { customer: org.customerId, return_url: `${origin(req)}/app/reglages?s=facturation` })
    return { url: s.url }
  }

  /** Lit offre, sièges et options depuis les lignes d’un abonnement Stripe. */
  function fromItems(sub, org) {
    const p = prices()
    const lines = (sub.items?.data ?? []).map((i) => ({ price: i.price?.id ?? i.plan?.id, q: Number(i.quantity ?? 1) }))
    const has = (id) => id && lines.find((l) => l.price === id)
    let plan = org.plan, period = org.period
    if (has(p.agence)) { plan = 'agence'; period = 'month' } else if (has(p.solo_year)) { plan = 'solo'; period = 'year' } else if (has(p.solo_month)) { plan = 'solo'; period = 'month' } else if (sub.metadata?.plan) { plan = sub.metadata.plan; period = sub.metadata.period ?? period }
    const seat = has(p.seat)
    const options = lines.length ? ['preuves', 'donnees'].filter((o) => has(p[o])) : org.options
    const seats = plan === 'agence' ? PLANS.agence.seats + (seat ? seat.q : 0) : 1
    const end = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end
    return { plan, period, options, seats, periodEnd: end ? new Date(end * 1000).toISOString() : org.periodEnd }
  }

  function apply(event) {
    const o = event.data?.object ?? {}
    const find = () => (o.metadata?.orgId && accounts.getOrg(o.metadata.orgId)) || accounts.findOrg({ subscriptionId: o.object === 'subscription' ? o.id : o.subscription, customerId: o.customer })
    switch (event.type) {
      case 'checkout.session.completed': {
        const org = accounts.getOrg(o.client_reference_id) ?? find()
        if (!org) return 'agence inconnue'
        const m = o.metadata ?? {}
        accounts.updateOrg(org.id, {
          customerId: o.customer ?? org.customerId, subscriptionId: o.subscription ?? org.subscriptionId,
          plan: PLANS[m.plan] ? m.plan : org.plan, period: m.period ?? org.period,
          options: m.options ? m.options.split(',').filter((x) => OPTIONS[x]) : [], seats: Number(m.seats) || org.seats,
          status: 'active', cancelAtPeriodEnd: false,
        })
        return 'abonnement activé'
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const org = find()
        if (!org) return 'agence inconnue'
        accounts.updateOrg(org.id, { ...fromItems(o, org), subscriptionId: o.id, customerId: o.customer ?? org.customerId, status: o.status ?? org.status, cancelAtPeriodEnd: !!o.cancel_at_period_end })
        return `statut ${o.status}`
      }
      case 'customer.subscription.deleted': {
        const org = find()
        if (!org) return 'agence inconnue'
        accounts.updateOrg(org.id, { status: 'canceled', plan: 'decouverte', options: [], seats: 0, cancelAtPeriodEnd: false })
        return 'abonnement résilié : retour à Découverte'
      }
      case 'invoice.payment_failed': {
        const org = find()
        if (!org) return 'agence inconnue'
        accounts.updateOrg(org.id, { status: 'past_due' })
        return 'paiement refusé : offre Découverte jusqu’au règlement'
      }
      default: return 'ignoré'
    }
  }

  async function webhook(req, res, send) {
    if (req.method !== 'POST') throw new HttpError(405, 'Méthode non prise en charge')
    const secret = env.STRIPE_WEBHOOK_SECRET
    if (!secret) throw new HttpError(503, 'Paiement non configuré')
    const payload = await readRaw(req)
    if (!verifySignature(payload, req.headers['stripe-signature'], secret)) throw new HttpError(400, 'Signature Stripe invalide')
    let event
    try { event = JSON.parse(payload) } catch { throw new HttpError(400, 'JSON invalide') }
    if (event.id && !accounts.markEvent(event.id, String(event.type))) return send(res, 200, { received: true, duplicate: true })
    return send(res, 200, { received: true, result: apply(event) })
  }

  return { configured, checkout, portal, webhook, apply }
}
