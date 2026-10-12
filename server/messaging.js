// Messagerie unifiée : WhatsApp, e-mail, SMS, canaux internes. Rappels WhatsApp programmés.
// Règles WhatsApp Business : consentement (opt-in) requis ; hors de la fenêtre de 24 h suivant le dernier
// message du client, seul un modèle approuvé peut être envoyé. Sans connecteur, l’envoi externe est consigné.

const EXTERNAL = new Set(['whatsapp', 'email', 'sms', 'portal'])
const CONNECTOR = { whatsapp: 'WhatsApp Business', email: 'SMTP', sms: 'SMS', portal: 'portail' }
const H = 3600e3

/** Date réelle d’un événement d’agenda de démonstration (jour d’octobre 2026 + heure « HH:MM »). */
export const eventDate = (e) => { const [h, m] = String(e.start ?? '09:00').split(':').map(Number); return new Date(2026, 9, e.day ?? 1, h, m) }

/** Remplit un modèle : {{prenom}}, {{date}}, {{heure}}, {{lieu}}, {{bien}}, {{conseiller}}. */
export const fill = (body, vars) => String(body).replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)

function classify(text) {
  const t = text.toLowerCase()
  const tags = []
  if (/offre|propos|prix|€|euros?\b|négoc/.test(t)) tags.push('Offre')
  if (/visit|voir le bien|créneau|disponib/.test(t)) tags.push('Visite')
  if (/document|diagnostic|dpe|pv|pièce|titre|taxe/.test(t)) tags.push('Pièces')
  if (/urgent|vite|aujourd|ce soir|asap/.test(t)) tags.push('Urgent')
  if (/notaire|compromis|acte/.test(t)) tags.push('Notaire')
  return tags
}

/** Suggestions de réponse contextuelles (sans modèle de langage : règles sur la conversation et le dossier). */
export function suggestReplies(conv, msgs, ctx) {
  const lastIn = [...msgs].reverse().find((m) => m.dir === 'in')
  const t = (lastIn?.text ?? '').toLowerCase()
  const first = (conv.title ?? '').replace(/^(M\.|Mme|Dr\.)\s*(&\s*Mme\s*)?/, '').split(' ')[0]
  const out = []
  if (/visit|créneau|disponib|voir/.test(t)) out.push(`Bonjour ${first}, je vous propose mardi 10 h ou jeudi 17 h 30 pour la visite. Lequel vous convient ?`)
  if (/prix|offre|propos|négoc/.test(t)) out.push(`Merci pour votre retour. Je transmets votre proposition au vendeur aujourd’hui et je reviens vers vous avant demain midi.`)
  if (/document|diagnostic|dpe|pv|pièce/.test(t)) out.push(`Bien noté, je vous envoie les pièces disponibles dans la journée ; il nous manque encore le PV d’AG 2025, demandé au syndic.`)
  if (/merci|parfait|super|top/.test(t)) out.push(`Avec plaisir ${first} ! Je reste disponible pour la suite.`)
  if (ctx?.event) out.push(`Je vous confirme notre rendez-vous du ${ctx.event} — à très vite.`)
  if (ctx?.dossier) out.push(`Point d’étape sur votre dossier : ${ctx.dossier.next.toLowerCase()}. Je vous tiens informé(e) dès que c’est fait.`)
  out.push(`Bonjour ${first}, je reviens vers vous très vite avec une réponse précise.`)
  return [...new Set(out)].slice(0, 3)
}

export function createMessaging(db, { put, patch, activity, notify, run }) {
  const now = () => new Date()
  const convOf = (id) => { const c = db.get('conversations', id); if (!c) throw Object.assign(new Error('Conversation introuvable'), { status: 404 }); return c }

  function addMessage(conv, msg) {
    const m = put('messages', { conversationId: conv.id, at: now().toISOString(), channel: conv.channel, ...msg })
    patch('conversations', conv.id, { lastAt: m.at, lastText: m.text, ...(msg.dir === 'in' ? { unread: (conv.unread ?? 0) + 1, windowUntil: new Date(Date.parse(m.at) + 24 * H).toISOString() } : {}) })
    return m
  }

  function send({ conversationId, text, template, attachments, scheduleAt, author = 'Claire Delmas' }) {
    const conv = convOf(conversationId)
    if (!text?.trim() && !template) throw Object.assign(new Error('Message vide'), { status: 400 })
    if (conv.channel === 'whatsapp') {
      if (conv.optIn === false) throw Object.assign(new Error('Pas de consentement WhatsApp pour ce contact : demandez son accord par e-mail ou téléphone.'), { status: 409 })
      const open = conv.windowUntil && Date.parse(conv.windowUntil) > Date.now()
      if (!open && !template) throw Object.assign(new Error('Fenêtre de 24 h fermée : seul un modèle approuvé peut être envoyé.'), { status: 409 })
    }
    const external = EXTERNAL.has(conv.channel)
    const status = scheduleAt ? 'programmé' : external ? `consigné · connecteur ${CONNECTOR[conv.channel]} non configuré` : 'distribué'
    const m = addMessage(conv, { dir: conv.kind === 'channel' ? 'internal' : 'out', author, text: text?.trim() ?? '', template, attachments, status, scheduleAt })
    if (conv.kind === 'channel') {
      const mentions = [...(text ?? '').matchAll(/@([A-ZÉ][\wé-]+)/g)].map((x) => x[1])
      if (mentions.length) notify(`Mention dans #${conv.title}`, `${author} : ${text.slice(0, 80)}`, 'info', `/app/messages?c=${conv.id}`)
    }
    return m
  }

  /** Simulation d’un message entrant (démo et tests) : classement automatique AUT-112. */
  function receive({ conversationId, text, author }) {
    const conv = convOf(conversationId)
    const m = addMessage(conv, { dir: 'in', author: author ?? conv.title, text, status: 'reçu' })
    const tags = classify(text).filter((t) => !(conv.tags ?? []).includes(t))
    if (tags.length) { patch('conversations', conv.id, { tags: [...(conv.tags ?? []), ...tags] }); run('AUT-112', 'ok', `Tags ajoutés à ${conv.title} : ${tags.join(', ')}`) }
    notify(`Nouveau message · ${conv.title}`, text.slice(0, 90), 'info', `/app/messages?c=${conv.id}`)
    return m
  }

  /** Programme les rappels J-1 (18:00) et H-2 d’un rendez-vous ou d’une visite. */
  function scheduleForEvent(e, { manual = false } = {}) {
    const when = eventDate(e)
    const existing = db.list('reminders').filter((r) => r.eventId === e.id && r.status !== 'annulé')
    if (existing.length && !manual) return []
    const tpl = db.get('templates', e.kind === 'visite' ? 'tpl-visite' : 'tpl-rdv')
    const vars = { prenom: String(e.who ?? '').split('·')[0].trim(), date: when.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }), heure: e.start, lieu: e.place, bien: e.title, conseiller: 'Claire Delmas' }
    const j1 = new Date(when); j1.setDate(j1.getDate() - 1); j1.setHours(18, 0, 0, 0)
    const h2 = new Date(when.getTime() - 2 * H)
    return [['J-1', j1], ['H-2', h2]].filter(([, d]) => d.getTime() > Date.now() - 6 * H).map(([rule, d]) => put('reminders', {
      kind: 'whatsapp', rule, eventId: e.id, dossierId: e.dossier, target: vars.prenom || e.who, text: fill(tpl?.body ?? 'Rappel : rendez-vous le {{date}} à {{heure}} — {{lieu}}.', vars),
      template: tpl?.id, dueAt: d.toISOString(), status: 'programmé', createdBy: manual ? 'Claire Delmas' : 'Routine AUT-110',
    }, { front: true }))
  }

  function conversationFor(r) {
    const all = db.list('conversations')
    const found = all.find((c) => c.channel === 'whatsapp' && (c.eventIds?.includes(r.eventId) || (r.dossierId && c.dossierId === r.dossierId) || c.title === r.target))
    return found ?? put('conversations', { title: r.target, channel: 'whatsapp', kind: 'direct', dossierId: r.dossierId, eventIds: [r.eventId], tags: ['Rappel'], unread: 0, status: 'open', optIn: true, participants: [r.target], lastAt: now().toISOString(), lastText: '' }, { front: true })
  }

  /** AUT-110 : programme les rappels manquants et traite ceux qui arrivent à échéance. */
  function processReminders() {
    const upcoming = db.list('events').filter((e) => ['rdv', 'visite', 'signature'].includes(e.kind) && eventDate(e).getTime() > Date.now())
    const created = upcoming.flatMap((e) => scheduleForEvent(e))
    const due = db.list('reminders').filter((r) => r.status === 'programmé' && Date.parse(r.dueAt) <= Date.now())
    for (const r of due) {
      const conv = conversationFor(r)
      addMessage(conv, { dir: 'out', author: 'Rappel automatique', text: r.text, template: r.template, status: `consigné · connecteur ${CONNECTOR.whatsapp} non configuré` })
      patch('reminders', r.id, { status: 'consigné', sentAt: now().toISOString(), conversationId: conv.id })
    }
    if (due.length) activity('Routine AUT-110', `${due.length} rappel(s) WhatsApp consigné(s)`, 'ai', '/app/messages')
    return [created.length || due.length ? 'ok' : 'skip', `${created.length} rappel(s) programmé(s), ${due.length} échu(s)`]
  }

  /** AUT-111 : message client sans réponse depuis 2 h ouvrées. */
  function slaCheck() {
    const late = db.list('conversations').filter((c) => c.kind === 'direct' && c.status !== 'done' && c.unread > 0 && Date.now() - Date.parse(c.lastAt) > 2 * H)
    late.forEach((c) => !db.get('notifications', `n-sla-${c.id}`) && put('notifications', { id: `n-sla-${c.id}`, at: now().toISOString(), title: 'Client en attente de réponse', body: `${c.title} attend depuis plus de 2 h`, tone: 'warn', read: false, link: `/app/messages?c=${c.id}` }, { front: true }))
    return [late.length ? 'ok' : 'skip', `${late.length} conversation(s) en attente`]
  }

  return {
    actions: {
      'message.send': send,
      'message.receive': receive,
      'message.suggest': ({ conversationId }) => {
        const conv = convOf(conversationId)
        const msgs = db.list('messages').filter((m) => m.conversationId === conversationId)
        const dossier = conv.dossierId ? db.get('dossiers', conv.dossierId) : null
        const ev = db.list('events').find((e) => conv.eventIds?.includes(e.id))
        return { suggestions: suggestReplies(conv, msgs, { dossier, event: ev ? `${eventDate(ev).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${ev.start}` : null }) }
      },
      'conversation.read': ({ id }) => patch('conversations', id, { unread: 0 }),
      'reminders.scheduleEvent': ({ eventId }) => {
        const e = db.get('events', eventId)
        if (!e) throw Object.assign(new Error('Événement introuvable'), { status: 404 })
        const r = scheduleForEvent(e, { manual: true })
        if (!r.length) throw Object.assign(new Error('Rendez-vous trop proche ou passé : aucun rappel à programmer'), { status: 409 })
        return r
      },
      'reminder.cancel': ({ id }) => patch('reminders', id, { status: 'annulé' }),
    },
    rules: { 'AUT-110': processReminders, 'AUT-111': slaCheck },
    classify,
  }
}
