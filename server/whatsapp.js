// Débrief par WhatsApp (feuille de route, item 12) : le conseiller envoie un vocal ou un texte au numéro Jaspe
// → transcription → plan d’action proposé (planFromBrief) → validation dans l’app. Rien n’est lancé sans validation.
// Code sans API Node (HMAC injecté) : `fetch`, `FormData` et `Blob` sont des globaux de Node 18+ et du navigateur.
//
// WhatsApp Cloud API (Meta), formes vérifiées dans la documentation publique (novembre 2026) :
// - Vérification GET (hub.mode=subscribe, hub.verify_token, renvoyer hub.challenge) et signature
//   X-Hub-Signature-256 = « sha256= » + HMAC-SHA256 hexadécimal du corps brut avec le secret de l’app :
//   https://developers.facebook.com/docs/graph-api/webhooks/getting-started
// - Charge utile : object=whatsapp_business_account, entry[].changes[].value.{metadata.phone_number_id, contacts[].wa_id, messages[]} :
//   https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
// - Message audio : messages[].type='audio', audio.{id, mime_type, sha256, url?, voice} (« from » peut manquer : repli sur contacts[].wa_id) :
//   https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/messages/audio
// - Média : GET https://graph.facebook.com/<version>/<MEDIA_ID> (Bearer) → { url, mime_type, sha256, file_size, id },
//   puis GET <MEDIA_URL> avec le même Bearer → binaire : https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media
// - Réponse libre (« service message ») autorisée seulement dans la fenêtre de 24 h ouverte par le message de l’utilisateur :
//   POST /<PHONE_NUMBER_ID>/messages { messaging_product:'whatsapp', to, type:'text', text:{ body } } :
//   https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
//
// Transcription : service TIERS (les données vocales du conseiller y transitent ; à mentionner au registre RGPD et au DPA).
// Format « audio transcriptions » multipart courant (OpenAI-compatible) : POST JASPE_STT_URL, Authorization: Bearer JASPE_STT_KEY,
// champs file, model (JASPE_STT_MODEL), language (fr | pt) → { text }.
//   OpenAI : https://platform.openai.com/docs/api-reference/audio/createTranscription (https://api.openai.com/v1/audio/transcriptions)
//   Mistral Voxtral : https://docs.mistral.ai/api/endpoint/audio/transcriptions (https://api.mistral.ai/v1/audio/transcriptions, voxtral-mini-latest)
import { planFromBrief, BASELINES, REVIEW_MIN } from './assist.js'

const H = 3600e3
const GRAPH = 'https://graph.facebook.com'
const digits = (p) => String(p ?? '').replace(/\D/g, '')
const mask = (p) => { const d = digits(p); return d ? `…${d.slice(-4)}` : 'inconnu' }
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const safeId = (s) => String(s).replace(/[^A-Za-z0-9_-]/g, '').slice(-40)

/** Comparaison en temps constant de deux chaînes (pas de court-circuit sur le premier octet différent). */
export function safeEqual(a, b) {
  a = String(a ?? ''); b = String(b ?? '')
  let diff = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) | 0) ^ (b.charCodeAt(i) | 0)
  return diff === 0 && a.length > 0
}

/** Devine le dossier par le nom du vendeur cité dans le débrief (« Famille Martin », « Mme Duval »…). */
export function guessDossier(text, dossiers, agentId) {
  const t = ` ${norm(text).replace(/[^a-z0-9]+/g, ' ')} `
  const STOP = new Set(['famille', 'monsieur', 'madame', 'mme', 'mr', 'me', 'dr', 'sci', 'and', 'les', 'des', 'de', 'du', 'la', 'le', 'et', 'familia', 'senhor', 'senhora', 'sr', 'sra', 'dona'])
  let best = null
  for (const d of dossiers) {
    const tokens = norm(d.seller).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w))
    const hits = tokens.filter((w) => t.includes(` ${w} `)).length
    if (!hits) continue
    const score = hits * 10 + (agentId && d.agentId === agentId ? 1 : 0)
    if (!best || score > best.score) best = { d, score }
  }
  return best?.d ?? null
}

export function createWhatsApp({ db, put, patch, remove = (col, id) => db.remove(col, id), activity, notify, HttpError, fetch = globalThis.fetch, env = {}, transcribe, hmac, apply, now = () => Date.now() }) {
  const version = env.WHATSAPP_API_VERSION || 'v23.0'
  const appUrl = `${String(env.JASPE_PUBLIC_URL || 'http://127.0.0.1:5318').replace(/\/$/, '')}/app/taches`
  const agentsCfg = () => db.get('settings', 'whatsapp-agents') ?? { id: 'whatsapp-agents', agents: {} }
  const agentFor = (phone) => { const map = agentsCfg().agents ?? {}; const k = Object.keys(map).find((n) => digits(n) && digits(n) === digits(phone)); return k ? map[k] : null }
  const stats = () => db.get('settings', 'whatsapp-stats') ?? { id: 'whatsapp-stats', received: 0, briefs: 0, voice: 0, ignored: 0, approved: 0, rejected: 0, sttMissing: 0, badSignature: 0 }
  const bump = (p) => { const s = stats(); const next = { ...s, ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === 'number' ? (s[k] ?? 0) + v : v])) }; return db.get('settings', 'whatsapp-stats') ? patch('settings', 'whatsapp-stats', next) : put('settings', next) }
  const iso = () => new Date(now()).toISOString()
  const lang = () => (env.JASPE_STT_LANG || (db.get('settings', 'agency')?.country === 'PT' ? 'pt' : 'fr'))
  const sttConfigured = () => !!(transcribe || (env.JASPE_STT_URL && env.JASPE_STT_KEY))

  /** Transcription par défaut : API « audio transcriptions » OpenAI-compatible (service tiers). */
  const stt = transcribe ?? (async ({ bytes, mime, language }) => {
    const form = new FormData()
    const ext = /mpeg|mp3/.test(mime) ? 'mp3' : /mp4|m4a|aac/.test(mime) ? 'm4a' : /wav/.test(mime) ? 'wav' : 'ogg'
    form.append('file', new Blob([bytes], { type: String(mime || 'audio/ogg').split(';')[0] }), `vocal.${ext}`)
    form.append('model', env.JASPE_STT_MODEL || 'whisper-1')
    form.append('language', language)
    const r = await fetch(env.JASPE_STT_URL, { method: 'POST', headers: { authorization: `Bearer ${env.JASPE_STT_KEY}` }, body: form })
    if (!r.ok) throw new Error(`Transcription refusée (${r.status})`)
    const j = await r.json()
    return String(j.text ?? '')
  })

  /** Récupère le binaire d’un vocal : URL du média (fournie ou via GET /MEDIA_ID), puis téléchargement avec le jeton. */
  async function downloadAudio(audio) {
    if (!env.WHATSAPP_TOKEN) throw new Error('WHATSAPP_TOKEN absent : vocal non téléchargeable')
    const auth = { authorization: `Bearer ${env.WHATSAPP_TOKEN}` }
    let url = audio.url, mime = audio.mime_type
    if (!url) {
      const r = await fetch(`${GRAPH}/${version}/${encodeURIComponent(audio.id)}`, { headers: auth })
      if (!r.ok) throw new Error(`Média introuvable (${r.status})`)
      const j = await r.json(); url = j.url; mime = j.mime_type ?? mime
    }
    const b = await fetch(url, { headers: auth })
    if (!b.ok) throw new Error(`Téléchargement du vocal refusé (${b.status})`)
    return { bytes: new Uint8Array(await b.arrayBuffer()), mime: mime ?? 'audio/ogg' }
  }

  /** Réponse au conseiller : message libre dans la fenêtre de 24 h ; sans jeton, l’envoi est consigné comme le reste. */
  async function reply(to, text, { phoneNumberId, inboundAt, planId } = {}) {
    const inWindow = inboundAt && now() - inboundAt < 24 * H
    let status
    if (!inWindow) status = 'non envoyé · fenêtre de 24 h fermée (modèle approuvé requis)'
    else if (!env.WHATSAPP_TOKEN || !(phoneNumberId || env.WHATSAPP_PHONE_NUMBER_ID)) status = 'consigné · connecteur WhatsApp Business non configuré'
    else {
      try {
        const r = await fetch(`${GRAPH}/${version}/${encodeURIComponent(phoneNumberId || env.WHATSAPP_PHONE_NUMBER_ID)}/messages`, {
          method: 'POST', headers: { authorization: `Bearer ${env.WHATSAPP_TOKEN}`, 'content-type': 'application/json' },
          body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: digits(to), type: 'text', text: { preview_url: false, body: text.slice(0, 4096) } }),
        })
        status = r.ok ? 'envoyé' : `échec d’envoi (${r.status})`
      } catch (e) { status = `échec d’envoi (${e.message})` }
    }
    put('outbox', { channel: 'whatsapp', code: 'WA-DEBRIEF', to: mask(to), subject: text.split('\n')[0].slice(0, 120), body: text, status, at: iso(), planId }, { front: true })
    return status
  }

  const summary = (plan, dossier) => {
    const lines = plan.items.slice(0, 6).map((it) => `• ${it.label}${it.due ? ` (${it.due})` : ''}`)
    return [`Jaspe — débrief reçu${dossier ? ` · ${dossier.seller}` : ' · sans dossier'}`, plan.items.length ? `${plan.items.length} action(s) proposée(s), rien n’est lancé sans votre validation :` : 'Aucune action reconnue : précisez qui relancer, quand et quel document préparer.', ...lines, plan.items.length > 6 ? `… et ${plan.items.length - 6} autre(s)` : '', `Valider : ${appUrl}`].filter(Boolean).join('\n')
  }

  /** Traite un message entrant d’un conseiller enregistré. */
  async function processMessage(m, value) {
    const from = m.from ?? value.contacts?.[0]?.wa_id
    const phoneNumberId = value.metadata?.phone_number_id
    const inboundAt = Number(m.timestamp) ? Number(m.timestamp) * 1000 : now()
    const agent = agentFor(from)
    if (!agent) {
      bump({ ignored: 1, lastIgnoredAt: iso() })
      activity('WhatsApp', `message ignoré : numéro non enregistré (${mask(from)})`, 'warn', '/app/reglages?s=integrations')
      return { ignored: true }
    }
    const id = `wa-${safeId(m.id ?? `${from}-${inboundAt}`)}`
    if (db.get('waplans', id)) return { duplicate: true, id } // Meta peut relivrer le même événement.
    const agentId = typeof agent === 'string' ? agent : agent.agentId
    const agentName = (typeof agent === 'object' && agent.name) || db.get('agents', agentId)?.name || 'Conseiller'
    bump({ received: 1, lastAt: iso() })
    const base = { id, at: iso(), from: mask(from), agentId, agentName, source: m.type, messageId: m.id }

    let text = ''
    if (m.type === 'text') text = String(m.text?.body ?? '')
    else if (m.type === 'audio') {
      bump({ voice: 1 })
      if (!sttConfigured()) {
        bump({ sttMissing: 1 })
        put('waplans', { ...base, status: 'transcription non configurée', transcript: '', items: [] }, { front: true })
        activity('WhatsApp', `vocal de ${agentName} consigné : transcription non configurée`, 'warn', '/app/reglages?s=integrations')
        await reply(from, 'Jaspe : votre vocal est bien reçu, mais la transcription n’est pas encore configurée sur ce compte. Pouvez-vous m’écrire votre débrief en texte ? Merci.', { phoneNumberId, inboundAt, planId: id })
        return { id, status: 'transcription non configurée' }
      }
      try { const a = await downloadAudio(m.audio ?? {}); text = await stt({ ...a, language: lang() }) } catch (e) {
        put('waplans', { ...base, status: 'transcription échouée', error: String(e.message ?? e), transcript: '', items: [] }, { front: true })
        activity('WhatsApp', `vocal de ${agentName} non transcrit : ${e.message ?? e}`, 'warn')
        await reply(from, 'Jaspe : je n’ai pas pu transcrire votre vocal. Pouvez-vous le renvoyer ou écrire votre débrief ?', { phoneNumberId, inboundAt, planId: id })
        return { id, status: 'transcription échouée' }
      }
    } else return { unsupported: m.type }

    text = text.trim().slice(0, 4000)
    if (!text) return { empty: true }
    const dossier = guessDossier(text, db.list('dossiers'), agentId)
    const items = planFromBrief(text, new Date(now()))
    const plan = put('waplans', { ...base, status: items.length ? 'en attente' : 'vide', transcript: text, items, dossierId: dossier?.id ?? null, dossierLabel: dossier?.seller ?? 'sans dossier' }, { front: true })
    const baseline = { ...BASELINES, ...(db.get('settings', 'time-baselines')?.values ?? {}) }.brief ?? 15
    put('timelog', { at: iso(), kind: 'brief', label: 'Débrief WhatsApp', dossierId: dossier?.id, ref: id, baseline, spent: 0, net: 0, corrections: 0, pending: true, channel: 'whatsapp' }, { front: true })
    bump({ briefs: 1 })
    if (items.length) {
      put('queue', { id: `q-${id}`, kind: 'whatsapp', planId: id, title: `Débrief WhatsApp — ${dossier?.seller ?? 'sans dossier'}`, dossier: dossier?.id, due: 'Aujourd’hui', bucket: 'today', why: `${m.type === 'audio' ? 'Vocal transcrit' : 'Message'} de ${agentName} : ${items.length} action(s) proposée(s), à cocher avant lancement`, saved: baseline, assignee: agentId, safe: false, ai: true, transcript: text, items, source: m.type }, { front: true })
      notify('Débrief WhatsApp à valider', `${agentName} · ${dossier?.seller ?? 'sans dossier'} · ${items.length} action(s)`, 'info', '/app/taches')
    }
    activity('WhatsApp', `débrief ${m.type === 'audio' ? 'vocal' : 'écrit'} de ${agentName} → ${items.length} action(s) proposée(s) — ${dossier?.seller ?? 'sans dossier'}`, 'ai', '/app/taches')
    plan.reply = await reply(from, summary(plan, dossier), { phoneNumberId, inboundAt, planId: id })
    patch('waplans', id, { reply: plan.reply })
    return { id, status: plan.status, items: items.length }
  }

  /**
   * Point d’entrée HTTP : `req` = { method, headers }, `rawBody` = corps BRUT (Buffer/Uint8Array/chaîne, nécessaire à la signature),
   * `query` = URLSearchParams ou objet. Renvoie { status, body, contentType, done? } ; `done` (POST) se résout à la fin du traitement,
   * la réponse 200 pouvant partir avant (Meta relivre si la réponse tarde).
   */
  async function handleWebhook(req, rawBody, query = {}) {
    const q = (k) => (typeof query.get === 'function' ? query.get(k) : query[k])
    if (req.method === 'GET') {
      if (q('hub.mode') === 'subscribe' && env.WHATSAPP_VERIFY_TOKEN && safeEqual(q('hub.verify_token'), env.WHATSAPP_VERIFY_TOKEN)) return { status: 200, body: String(q('hub.challenge') ?? ''), contentType: 'text/plain' }
      return { status: 403, body: 'Jeton de vérification invalide', contentType: 'text/plain' }
    }
    if (req.method !== 'POST') return { status: 405, body: 'Méthode non prise en charge', contentType: 'text/plain' }
    if (!env.WHATSAPP_APP_SECRET || !hmac) return { status: 503, body: 'WhatsApp non configuré (WHATSAPP_APP_SECRET)', contentType: 'text/plain' }
    const h = req.headers ?? {}
    const sig = String(h['x-hub-signature-256'] ?? h['X-Hub-Signature-256'] ?? '')
    const expected = `sha256=${await hmac(env.WHATSAPP_APP_SECRET, rawBody ?? '')}`
    if (!safeEqual(sig.toLowerCase(), expected.toLowerCase())) {
      bump({ badSignature: 1, lastBadSignatureAt: iso() })
      return { status: 401, body: 'Signature invalide', contentType: 'text/plain' }
    }
    let payload
    try { payload = JSON.parse(typeof rawBody === 'string' ? rawBody : new TextDecoder().decode(rawBody)) } catch { return { status: 400, body: 'JSON invalide', contentType: 'text/plain' } }
    const jobs = []
    if (payload?.object === 'whatsapp_business_account') {
      for (const e of payload.entry ?? []) for (const c of e.changes ?? []) {
        if (c.field !== 'messages') continue
        for (const m of c.value?.messages ?? []) jobs.push({ m, value: c.value })
      }
    }
    bump({ lastWebhookAt: iso() })
    const done = (async () => {
      const out = []
      for (const { m, value } of jobs) { try { out.push(await processMessage(m, value)) } catch (e) { out.push({ error: String(e.message ?? e) }); activity('WhatsApp', `erreur de traitement : ${e.message ?? e}`, 'warn') } }
      return out
    })()
    return { status: 200, body: 'EVENT_RECEIVED', contentType: 'text/plain', done }
  }

  const planOf = (id) => {
    const p = db.get('waplans', id)
    if (!p) throw new HttpError(404, 'Plan WhatsApp introuvable')
    if (p.status !== 'en attente') throw new HttpError(409, `Plan déjà traité (${p.status})`)
    return p
  }
  const settle = (p, approved) => {
    const e = db.list('timelog').find((x) => x.ref === p.id)
    if (e) patch('timelog', e.id, approved ? { pending: false, spent: REVIEW_MIN, net: Math.max(0, e.baseline - REVIEW_MIN) } : { pending: false, net: 0, rejected: true })
    if (db.get('queue', `q-${p.id}`)) remove('queue', `q-${p.id}`)
  }

  const actions = {
    /** Valide un plan reçu par WhatsApp : seules les actions cochées sont lancées (via assistant.apply). */
    'waplan.approve': async ({ id, items, dossierId }) => {
      const p = planOf(id)
      if (!apply) throw new HttpError(503, 'assistant.apply non branché')
      const chosen = Array.isArray(items) ? (items.every((x) => typeof x === 'string') ? p.items.map((it) => ({ ...it, selected: items.includes(it.id) })) : items) : p.items
      const target = dossierId === undefined ? p.dossierId : dossierId || null
      const r = await apply({ dossierId: target || undefined, items: chosen, text: p.transcript })
      patch('waplans', id, { status: 'validé', decidedAt: iso(), dossierId: target, items: chosen, done: r?.done ?? [] })
      settle(p, true)
      bump({ approved: 1 })
      activity('Claire Delmas', `a validé le débrief WhatsApp de ${p.agentName} (${(r?.done ?? []).length} action(s))`, 'win', target ? `/app/dossiers/${target}` : '/app/taches')
      return { ok: true, done: r?.done ?? [] }
    },
    'waplan.reject': ({ id }) => {
      const p = planOf(id)
      patch('waplans', id, { status: 'refusé', decidedAt: iso() })
      settle(p, false)
      bump({ rejected: 1 })
      activity('Claire Delmas', `a écarté le débrief WhatsApp de ${p.agentName}`, 'neutral', '/app/taches')
      return { ok: true }
    },
    /** État de l’intégration pour Réglages (aucun secret renvoyé) et part des débriefs arrivés par WhatsApp. */
    'whatsapp.status': () => {
      const s = stats()
      // Débriefs saisis dans l’app = exécutions AUT-120 hors validations de plans WhatsApp.
      const appBriefs = Math.max(0, db.list('runs').filter((r) => r.routineId === 'AUT-120').length - (s.approved ?? 0))
      const total = (s.briefs ?? 0) + appBriefs
      return {
        webhook: { verifyToken: !!env.WHATSAPP_VERIFY_TOKEN, appSecret: !!env.WHATSAPP_APP_SECRET, path: '/api/whatsapp/webhook', lastAt: s.lastWebhookAt ?? null },
        sending: { token: !!env.WHATSAPP_TOKEN, phoneNumberId: !!env.WHATSAPP_PHONE_NUMBER_ID },
        transcription: { configured: sttConfigured(), model: env.JASPE_STT_MODEL || null, host: env.JASPE_STT_URL ? String(env.JASPE_STT_URL).replace(/^https?:\/\//, '').split('/')[0] : null, language: lang() },
        stats: s, appBriefs, share: total ? Math.round(((s.briefs ?? 0) / total) * 100) : null, target: 40,
        pending: db.list('waplans').filter((p) => p.status === 'en attente').length,
      }
    },
  }

  return { handleWebhook, actions, processMessage }
}
