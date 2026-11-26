// Envoi réel des e-mails (SMTP via nodemailer). Sans SMTP_HOST : rien n’est émis, les envois restent consignés.
// Règle absolue : un livrable n’est envoyé qu’après validation humaine (élément `outbox` créé par `deliverable.validate`).
import nodemailer from 'nodemailer'
import { HttpError } from './engine.js'

const EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]{2,}$/
export const CONSIGNED = 'consigné (connecteur non configuré)'
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const truthy = (v) => /^(1|true|yes|oui)$/i.test(String(v ?? '').trim())

/**
 * `env` : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE, JASPE_PUBLIC_URL.
 * `transport` (tests) : options nodemailer (ex. { jsonTransport: true }) ou transporteur déjà créé (doté de sendMail).
 */
export function createMailer({ env = process.env, transport } = {}) {
  const host = String(env.SMTP_HOST ?? '').trim()
  const port = Number(env.SMTP_PORT) || 587
  const from = String(env.SMTP_FROM ?? '').trim() || String(env.SMTP_USER ?? '').trim() || (transport ? 'Jaspe <test@jaspe.local>' : '')
  const configured = !!(transport || host) && !!from
  const publicUrl = String(env.JASPE_PUBLIC_URL ?? '').trim().replace(/\/+$/, '') || 'http://127.0.0.1:5318'
  let tx = null
  const transporter = () => {
    if (tx) return tx
    if (transport) tx = typeof transport.sendMail === 'function' ? transport : nodemailer.createTransport(transport)
    else tx = nodemailer.createTransport({
      host, port, secure: env.SMTP_SECURE !== undefined && env.SMTP_SECURE !== '' ? truthy(env.SMTP_SECURE) : port === 465,
      ...(env.SMTP_USER ? { auth: { user: String(env.SMTP_USER), pass: String(env.SMTP_PASS ?? '') } } : {}),
      connectionTimeout: 15_000, greetingTimeout: 10_000, socketTimeout: 30_000,
    })
    return tx
  }

  async function send({ to, subject, text, html, replyTo, attachments } = {}) {
    if (!configured) throw new HttpError(503, 'E-mail non configuré : renseignez SMTP_HOST et SMTP_FROM sur le serveur')
    const list = (Array.isArray(to) ? to : String(to ?? '').split(',')).map((x) => String(x).trim()).filter(Boolean)
    if (!list.length || list.some((x) => !EMAIL.test(x))) throw new HttpError(400, 'Adresse e-mail du destinataire invalide')
    if (!String(subject ?? '').trim()) throw new HttpError(400, 'Objet de l’e-mail manquant')
    const info = await transporter().sendMail({
      from, to: list.join(', '), subject: String(subject).slice(0, 250), text: text ?? '', ...(html ? { html } : {}),
      ...(replyTo && EMAIL.test(String(replyTo)) ? { replyTo: String(replyTo) } : {}),
      ...(attachments?.length ? { attachments } : {}),
    })
    return { messageId: info.messageId, info }
  }

  return { configured, from: configured ? from : null, host: transport ? 'transport injecté' : host || null, publicUrl, send }
}

/** Corps texte + HTML d’un document (paragraphes). */
export function renderBody(paragraphs, signature) {
  const parts = (Array.isArray(paragraphs) ? paragraphs : [paragraphs]).map((p) => String(p ?? '')).filter(Boolean)
  if (signature) parts.push(String(signature))
  return {
    text: parts.join('\n\n'),
    html: `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.55;color:#1d1d1b">${parts.map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}</div>`,
  }
}

const minutes = (hhmm) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? '').trim()); return m ? Number(m[1]) * 60 + Number(m[2]) : null }
/** Heures calmes de l’agence (heure locale du serveur). Renvoie la date de fin si `now` est dans la plage, sinon null. */
export function quietUntil(settings, now = new Date()) {
  const f = minutes(settings?.quietFrom), t = minutes(settings?.quietTo)
  if (f == null || t == null || f === t) return null
  const cur = now.getHours() * 60 + now.getMinutes()
  const inside = f < t ? cur >= f && cur < t : cur >= f || cur < t
  if (!inside) return null
  const end = new Date(now); end.setHours(Math.floor(t / 60), t % 60, 0, 0)
  if (end <= now) end.setDate(end.getDate() + 1)
  return end
}

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
/** Adresse d’un destinataire nommé : dossier (vendeur), puis contacts, puis acquéreurs. */
function emailFor(db, name, dossier) {
  const n = norm(name)
  if (dossier && n === norm(dossier.seller)) {
    const own = dossier.sellerEmail ?? dossier.email ?? dossier.seller_email
    if (own && EMAIL.test(own)) return own
    const byId = dossier.contactId && db.get('contacts', dossier.contactId)
    if (byId?.email && EMAIL.test(byId.email)) return byId.email
  }
  for (const col of ['contacts', 'buyers']) {
    const hit = db.list(col).find((c) => norm(c.name) === n && c.email && EMAIL.test(c.email))
    if (hit) return hit.email
  }
  return null
}

/**
 * Envoie l’e-mail d’un élément `outbox` validé. Ne lit jamais le destinataire ni le contenu dans l’élément lui-même :
 * tout vient du document validé (`documents`), qui ne doit pas avoir été modifié depuis sa validation.
 * Retourne l’élément mis à jour (envoyé, programmé, consigné) ; lève une HttpError claire sinon (l’élément passe en « échec »).
 */
export async function sendOutbox(db, mailer, outboxId, { patch, activity, now = new Date(), force = false } = {}) {
  const set = patch ?? ((col, id, p) => db.patch(col, id, p))
  const o = db.get('outbox', outboxId)
  if (!o) throw new HttpError(404, 'Envoi introuvable')
  if (o.status === 'envoyé') throw new HttpError(409, 'Cet e-mail a déjà été envoyé')
  const doc = o.dossierId && o.code ? db.get('documents', `${o.dossierId}-${o.code}`) : null
  const validated = doc && doc.status === 'validated' && doc.validatedAt && Date.parse(doc.createdAt ?? 0) <= Date.parse(doc.validatedAt) && Date.parse(o.at ?? 0) >= Date.parse(doc.validatedAt) - 1000
  if (!validated) throw new HttpError(409, 'Envoi refusé : ce document n’a pas été validé par un conseiller (ou a été modifié depuis sa validation)')
  if (!mailer?.configured || o.channel !== 'E-mail') return set('outbox', outboxId, { status: CONSIGNED, sentAt: now.toISOString() })

  const settings = db.get('settings', 'agency') ?? {}
  const until = force ? null : quietUntil(settings, now)
  if (until) {
    const r = set('outbox', outboxId, { status: 'programmé', scheduledFor: until.toISOString(), note: `Heures calmes de l’agence (${settings.quietFrom}–${settings.quietTo}) : envoi programmé` })
    activity?.('Jaspe', `Envoi programmé à ${until.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} (heures calmes) — ${doc.subject ?? o.subject}`, 'neutral', o.dossierId ? `/app/dossiers/${o.dossierId}` : undefined)
    return r
  }
  const fail = (status, reason) => { set('outbox', outboxId, { status: 'échec', failedAt: now.toISOString(), error: reason }); activity?.('Jaspe', `Échec de l’envoi — ${doc.subject ?? o.subject} : ${reason}`, 'warn', o.dossierId ? `/app/dossiers/${o.dossierId}` : undefined); return new HttpError(status, reason) }

  const dossier = db.get('dossiers', o.dossierId)
  const names = String(doc.to ?? dossier?.seller ?? '').split(',').map((x) => x.trim()).filter(Boolean)
  const to = []
  for (const name of names) {
    const addr = EMAIL.test(name) ? name : emailFor(db, name, dossier)
    if (!addr) throw fail(409, dossier && norm(name) === norm(dossier.seller) ? `Adresse e-mail du vendeur manquante (${name}) : ajoutez-la à sa fiche contact ou au dossier` : `Adresse e-mail du destinataire manquante (${name})`)
    to.push(addr)
  }
  if (!to.length) throw fail(409, 'Adresse e-mail du vendeur manquante : aucun destinataire sur le document')
  const agent = dossier?.agentId ? db.get('agents', dossier.agentId) : null
  const { text, html } = renderBody(doc.body, settings.signature)
  try {
    const { messageId } = await mailer.send({ to, subject: doc.subject ?? o.subject, text, html, replyTo: agent?.email ?? settings.email })
    const r = set('outbox', outboxId, { status: 'envoyé', sentAt: now.toISOString(), messageId, toEmail: to.join(', '), error: null, scheduledFor: null })
    activity?.('Jaspe', `E-mail envoyé à ${to.join(', ')} — ${doc.subject ?? o.subject}`, 'win', o.dossierId ? `/app/dossiers/${o.dossierId}` : undefined)
    return r
  } catch (e) {
    throw fail(502, `Échec de l’envoi SMTP : ${e?.message ?? e}`)
  }
}

/** À appeler à chaque tick : envoie les éléments programmés dont l’heure est passée (heures calmes terminées). */
export async function sendDueOutbox(db, mailer, opts = {}) {
  if (!mailer?.configured) return []
  const now = opts.now ?? new Date()
  const due = db.list('outbox').filter((o) => o.status === 'programmé' && o.scheduledFor && Date.parse(o.scheduledFor) <= now.getTime())
  const out = []
  for (const o of due) { try { out.push(await sendOutbox(db, mailer, o.id, opts)) } catch (e) { out.push({ id: o.id, error: e.message }) } }
  return out
}

/**
 * Actions `mail.status` et `mail.test` (Réglages › Intégrations). Le test ne part que vers une adresse de l’équipe
 * (agents de l’agence ou e-mail de l’agence) : jamais vers une adresse arbitraire.
 */
export function createMailActions(db, mailer) {
  const last = new Map()
  return {
    'mail.status': () => ({ configured: !!mailer?.configured, from: mailer?.from ?? null, host: mailer?.host ?? null }),
    'mail.test': async ({ to } = {}) => {
      if (!mailer?.configured) throw new HttpError(503, 'E-mail (SMTP) non configuré sur ce serveur : aucun envoi possible')
      const addr = String(to ?? '').trim().toLowerCase()
      const team = new Set([...db.list('agents').map((a) => a.email), db.get('settings', 'agency')?.email].filter(Boolean).map((x) => String(x).toLowerCase()))
      if (!team.has(addr)) throw new HttpError(403, 'Le test ne peut partir que vers l’adresse d’un membre de l’équipe')
      if (Date.now() - (last.get(addr) ?? 0) < 30_000) throw new HttpError(429, 'Un e-mail de test vient d’être envoyé : patientez 30 secondes')
      last.set(addr, Date.now())
      const { messageId } = await mailer.send({ to: addr, subject: 'Jaspe — e-mail de test', ...renderBody(['Ceci est un e-mail de test envoyé depuis Jaspe (Réglages › Intégrations).', 'Si vous le lisez, l’envoi SMTP fonctionne.']) })
      return { ok: true, to: addr, messageId }
    },
  }
}
