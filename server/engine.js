// Actions métier et moteur de routines. Chaque effet est journalisé (runs, activity) et diffusé (SSE).
import { buildDocument, qualityCheck, NAMES, EXTERNAL } from './templates.js'
import { createMessaging } from './messaging.js'

const L_CODES = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9']
const hhmm = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export function createEngine(db, emit, { delay = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const put = (col, doc, opts) => { const d = db.put(col, doc, opts); emit(col, d.id); return d }
  const patch = (col, id, p) => { const d = db.patch(col, id, p); if (d) emit(col, id); return d }
  const activity = (who, what, tone = 'neutral', link) => put('activity', { t: hhmm(), at: new Date().toISOString(), who, what, tone, link }, { front: true })
  const notify = (title, body, tone = 'info', link) => put('notifications', { at: new Date().toISOString(), title, body, tone, link, read: false }, { front: true })
  const run = (routineId, status, detail, ms = 0, cost = 0) => {
    const r = db.get('routines', routineId)
    return put('runs', { routineId, name: r?.name ?? routineId, at: new Date().toISOString(), status, detail, ms, cost }, { front: true })
  }
  const enabled = (id) => { const r = db.get('routines', id); return r ? r.enabled !== false : true }
  const ctx = (dossierId) => {
    const dossier = db.get('dossiers', dossierId)
    if (!dossier) throw new HttpError(404, 'Dossier introuvable')
    const property = db.get('properties', dossier.propertyId)
    if (!property) throw new HttpError(409, 'Bien du dossier introuvable — ouvrez la page Biens pour l’initialiser')
    return { dossier, property, agent: db.get('agents', dossier.agentId), buyers: db.list('buyers'), settings: db.get('settings', 'agency') ?? {} }
  }
  const setDeliv = (dossierId, code, state) => {
    const d = db.get('dossiers', dossierId)
    return patch('dossiers', dossierId, { deliverables: { ...d.deliverables, [code]: state } })
  }
  /** Rend la décision visible dans la file « Tâches & validations ». */
  const enqueueReview = (doc, dossier) => {
    const qid = `q-${doc.id}`
    if (db.get('queue', qid)) return
    put('queue', { id: qid, kind: 'livrable', title: `${NAMES[doc.code]} — ${dossier.seller}`, dossier: dossier.id, due: 'Aujourd’hui', bucket: 'today', why: EXTERNAL.has(doc.code) ? 'Document destiné au client : relecture individuelle obligatoire' : 'Document interne préparé par le copilote', saved: 30, assignee: dossier.agentId, safe: !EXTERNAL.has(doc.code), ai: true, code: doc.code }, { front: true })
  }

  async function generate(dossierId, code, { quiet = false } = {}) {
    const t0 = Date.now()
    const c = ctx(dossierId)
    const prev = db.get('documents', `${dossierId}-${code}`)
    const doc = buildDocument(code, c)
    doc.version = (prev?.version ?? 0) + 1
    // Historique : chaque version précédente est conservée telle quelle.
    doc.history = prev ? [...(prev.history ?? []).filter((h) => h.v !== prev.version), { v: prev.version, at: prev.createdAt, subject: prev.subject, body: prev.body, by: prev.edited ? 'édition' : 'copilote' }] : []
    const issues = qualityCheck(doc)
    doc.checks = issues
    put('documents', doc)
    setDeliv(dossierId, code, issues.length ? 'blocked' : code === 'L9' && doc.items?.some((i) => i.state === 'missing') ? 'blocked' : 'review')
    enqueueReview(doc, c.dossier)
    if (!quiet) activity('Copilote', `a préparé ${code} · ${NAMES[code]} pour ${c.dossier.seller}`, 'ai', `/app/dossiers/${dossierId}`)
    run('AUT-058', issues.length ? 'fail' : 'ok', issues.length ? issues.join(' · ') : `${code} contrôlé — chiffres, noms, sources`, Date.now() - t0, 0.002)
    return doc
  }

  /** AUT-024 : neuf livrables lancés en parallèle après une découverte validée. */
  async function generateAll(dossierId, codes = L_CODES) {
    const c = ctx(dossierId)
    const todo = codes.filter((k) => c.dossier.deliverables?.[k] !== 'done')
    const d = db.get('dossiers', dossierId)
    patch('dossiers', dossierId, { deliverables: { ...d.deliverables, ...Object.fromEntries(todo.map((k) => [k, 'running'])) } })
    run('AUT-024', 'ok', `${todo.length} livrables lancés pour ${c.dossier.seller}`, 40, 0)
    activity('Routine AUT-024', `${todo.length} livrables lancés en parallèle — ${c.dossier.seller}`, 'ai', `/app/dossiers/${dossierId}`)
    for (const [i, k] of todo.entries()) delay(500 + i * 450).then(() => generate(dossierId, k, { quiet: true }).catch(() => setDeliv(dossierId, k, 'blocked')))
    return { started: todo }
  }

  const messaging = createMessaging(db, { put, patch, activity, notify, run })

  const actions = {
    ...messaging.actions,
    'deliverable.generate': ({ dossierId, code }) => generate(dossierId, code),
    'deliverable.generateAll': ({ dossierId, codes }) => generateAll(dossierId, codes),
    'deliverable.validate': ({ dossierId, code, by = 'Claire Delmas' }) => {
      const c = ctx(dossierId)
      const doc = db.get('documents', `${dossierId}-${code}`)
      if (doc) patch('documents', doc.id, { status: 'validated', validatedAt: new Date().toISOString(), validatedBy: by })
      setDeliv(dossierId, code, 'done')
      db.remove('queue', `q-${dossierId}-${code}`); emit('queue', `q-${dossierId}-${code}`)
      let outbox = null
      if (EXTERNAL.has(code) && doc) outbox = put('outbox', { dossierId, code, to: doc.to ?? c.dossier.seller, subject: doc.subject ?? NAMES[code], status: 'programmé', at: new Date().toISOString(), channel: doc.kind === 'letter' ? 'Courrier' : doc.kind === 'social' ? 'Réseaux sociaux' : 'E-mail' }, { front: true })
      activity(by, `a validé ${code} · ${NAMES[code]} — ${c.dossier.seller}${outbox ? ' (envoi programmé)' : ''}`, 'win', `/app/dossiers/${dossierId}`)
      return { ok: true, outbox }
    },
    'deliverable.reject': ({ dossierId, code, reason }) => { setDeliv(dossierId, code, 'blocked'); activity('Claire Delmas', `a renvoyé ${code} en correction : ${reason ?? 'sans motif'}`, 'warn'); return { ok: true } },
    'deliverable.edit': ({ dossierId, code, body, subject }) => {
      const doc = db.get('documents', `${dossierId}-${code}`)
      if (!doc) throw new HttpError(404, 'Document introuvable')
      const history = [...(doc.history ?? []).filter((h) => h.v !== doc.version), { v: doc.version, at: doc.createdAt, subject: doc.subject, body: doc.body, by: doc.edited ? 'édition' : 'copilote' }]
      return patch('documents', doc.id, { body: body ?? doc.body, subject: subject ?? doc.subject, version: doc.version + 1, edited: true, history, createdAt: new Date().toISOString() })
    },
    'dossier.move': ({ id, stage }) => {
      const d = patch('dossiers', id, { stage })
      if (!d) throw new HttpError(404, 'Dossier introuvable')
      activity('Claire Delmas', `a déplacé ${d.seller} vers « ${stage} »`, 'neutral', `/app/dossiers/${id}`)
      if (stage === 'post' && enabled('AUT-024')) generateAll(id).catch(() => {})
      if (stage === 'mandat') {
        put('tasks', { title: `Planifier shooting photo & visite 3D — ${d.seller}`, dossier: id, due: 'Sous 72 h', prio: 'haute', kind: 'document', ai: true, done: false }, { front: true })
        run('AUT-037', 'wait', `Publication multiportail en attente de validation — ${d.seller}`)
      }
      return d
    },
    'task.toggle': ({ id }) => { const t = db.get('tasks', id); return t ? patch('tasks', id, { done: !t.done }) : null },
    'queue.resolve': ({ id, decision = 'validé' }) => {
      const q = db.get('queue', id)
      if (!q) throw new HttpError(404, 'Élément introuvable')
      if (q.code && q.dossier && decision === 'validé' && db.get('documents', `${q.dossier}-${q.code}`)) { const r = actions['deliverable.validate']({ dossierId: q.dossier, code: q.code }); db.remove('queue', id); emit('queue', id); return r }
      db.remove('queue', id); emit('queue', id)
      activity('Claire Delmas', `${decision} : ${q.title}`, 'win')
      return { ok: true }
    },
    /** AUT-001 / AUT-003 : un lead entrant devient contact + tâche affectée au secteur. */
    'lead.create': ({ name, email, org, size }) => {
      if (!name || !email) throw new HttpError(400, 'Nom et e-mail requis')
      const lead = put('leads', { name, email, org, size, at: new Date().toISOString(), status: 'nouveau', source: 'Site — demande de démo' }, { front: true })
      put('contacts', { name, email, org, roles: ['acquereur'], city: '—', phone: '', dossiers: [], score: 50, last: 'Aujourd’hui · formulaire', pref: { ch: 'Email', slot: '—', lang: 'Français' }, consents: [], history: [{ d: 'Aujourd’hui', ch: 'Email', dir: 'in', s: `Demande de démonstration (${size ?? 'taille ?'})` }] }, { front: true })
      put('tasks', { title: `Rappeler ${name} (${org ?? 'organisation ?'}) — demande de démo`, due: 'Sous 2 h', prio: 'haute', kind: 'appeler', ai: true, done: false, leadId: lead.id }, { front: true })
      notify('Nouveau lead', `${name} · ${org ?? ''} demande une démonstration`, 'win', '/app/contacts')
      run('AUT-001', 'ok', `Lead reçu une fois — ${email}`, 12)
      run('AUT-003', 'ok', 'Affecté à Claire Delmas (secteur Antibes)', 8)
      activity('Routine AUT-001', `nouveau lead : ${name} — ${org ?? ''}`, 'win', '/app/contacts')
      return lead
    },
    'outbox.send': ({ id }) => {
      const o = db.get('outbox', id)
      if (!o) throw new HttpError(404, 'Envoi introuvable')
      // Aucun connecteur SMTP / courrier configuré : l’envoi est consigné, pas réellement émis.
      return patch('outbox', id, { status: 'consigné (connecteur non configuré)', sentAt: new Date().toISOString() })
    },
    'routine.toggle': ({ id }) => { const r = db.get('routines', id); if (!r) throw new HttpError(404, 'Routine introuvable'); return patch('routines', id, { enabled: r.enabled === false }) },
    'routine.run': ({ id }) => tick([id], true),
    'notifications.readAll': () => { db.list('notifications').filter((n) => !n.read).forEach((n) => patch('notifications', n.id, { read: true })); return { ok: true } },
  }

  /** Règles réellement implémentées par le moteur. Les autres routines restent déclaratives. */
  const RULES = {
    'AUT-046': () => { // brief du matin, une fois par jour
      const day = new Date().toISOString().slice(0, 10)
      if (db.get('documents', `brief-${day}`)) return ['skip', 'Brief du jour déjà prêt']
      const tasks = db.list('tasks').filter((t) => !t.done), q = db.list('queue')
      put('documents', { id: `brief-${day}`, code: 'BRIEF', title: 'Brief du matin', kind: 'report', createdAt: new Date().toISOString(), body: [`${q.length} décision(s) en attente, ${tasks.length} tâche(s) ouvertes.`, ...q.slice(0, 3).map((x) => `• ${x.title}`)], sources: [{ label: 'Tâches, file de validation, agenda', date: day }] })
      return ['ok', `Brief prêt : ${q.length} validations, ${tasks.length} tâches`]
    },
    'AUT-033': () => { // L9 bloqué → demande de pièce, sans doublon
      const blocked = db.list('dossiers').filter((d) => d.deliverables?.L9 === 'blocked')
      let n = 0
      for (const d of blocked) {
        const id = `t-l9-${d.id}`
        if (db.get('tasks', id)) continue
        put('tasks', { id, title: `Demander les pièces manquantes du dossier copro (L9) — ${d.seller}`, dossier: d.id, due: 'Aujourd’hui', prio: 'normale', kind: 'document', ai: true, done: false }, { front: true }); n++
      }
      return [n ? 'ok' : 'skip', n ? `${n} demande(s) de pièces créée(s)` : 'Aucun L9 bloqué sans demande']
    },
    'AUT-039': () => { // mandat en diffusion sans visite récente → bilan vendeur
      const visited = new Set(db.list('events').filter((e) => e.kind === 'visite').map((e) => e.dossier))
      const idle = db.list('dossiers').filter((d) => d.stage === 'commercial' && !visited.has(d.id))
      let n = 0
      for (const d of idle) {
        const id = `t-bilan-${d.id}`
        if (db.get('tasks', id)) continue
        put('tasks', { id, title: `Préparer le bilan vendeur — aucune visite planifiée (${d.seller})`, dossier: d.id, due: 'Cette semaine', prio: 'normale', kind: 'appeler', ai: true, done: false }, { front: true }); n++
      }
      return [n ? 'ok' : 'skip', n ? `${n} bilan(s) à préparer` : 'Tous les mandats en diffusion ont des visites']
    },
    'AUT-042': () => { // offre en attente
      const offers = db.list('dossiers').filter((d) => d.stage === 'offre')
      const fresh = offers.filter((d) => !db.get('notifications', `n-offre-${d.id}`))
      fresh.forEach((d) => put('notifications', { id: `n-offre-${d.id}`, at: new Date().toISOString(), title: 'Offre à traiter', body: `${d.seller} — ${d.next} (${d.due})`, tone: 'warn', read: false, link: `/app/dossiers/${d.id}` }, { front: true }))
      return [fresh.length ? 'ok' : 'skip', `${offers.length} offre(s) suivie(s)`]
    },
    'AUT-010': () => { // préparation avant RDV : D1–D3 des dossiers en préparation
      const prep = db.list('dossiers').filter((d) => d.stage === 'prep' && ['D1', 'D2', 'D3'].some((k) => d.deliverables?.[k] !== 'done' && d.deliverables?.[k] !== 'review'))
      prep.forEach((d) => ['D1', 'D2', 'D3'].forEach((k) => d.deliverables?.[k] !== 'done' && generate(d.id, k, { quiet: true }).catch(() => {})))
      return [prep.length ? 'ok' : 'skip', prep.length ? `Brief préparé pour ${prep.map((d) => d.seller).join(', ')}` : 'Tous les RDV sont préparés']
    },
    'AUT-004': () => { // lead non traité
      const late = db.list('leads').filter((l) => l.status === 'nouveau' && Date.now() - Date.parse(l.at) > 2 * 3600e3)
      late.forEach((l) => !db.get('notifications', `n-lead-${l.id}`) && put('notifications', { id: `n-lead-${l.id}`, at: new Date().toISOString(), title: 'Lead en attente depuis 2 h', body: `${l.name} — proposer une réaffectation`, tone: 'warn', read: false, link: '/app/contacts' }, { front: true }))
      return [late.length ? 'ok' : 'skip', `${late.length} lead(s) en retard`]
    },
  }
  Object.assign(RULES, messaging.rules)
  const ENGINE_IDS = Object.keys(RULES)
  // Routines propres au moteur : déclarées en base si absentes (sans écraser un réglage utilisateur).
  const OWN = [
    { id: 'AUT-110', family: 'Relation client', name: 'Rappels WhatsApp RDV & visites', trigger: 'Rendez-vous ou visite à venir', conditions: 'Consentement WhatsApp et modèle approuvé', action: 'Programmer J-1 18:00 et H-2, consigner à échéance', autonomy: 'A', success: 'Rappel unique par échéance', fallback: 'Pas de rappel sans consentement', phase: 'P0', enabled: true },
    { id: 'AUT-111', family: 'Relation client', name: 'Client sans réponse depuis 2 h', trigger: 'Message entrant non lu', conditions: 'Conversation ouverte, heures ouvrées', action: 'Alerter le conseiller responsable', autonomy: 'A', success: 'Réponse sous 2 h', fallback: 'Escalade manager après 4 h', phase: 'P0', enabled: true },
    { id: 'AUT-112', family: 'Relation client', name: 'Classement automatique des messages', trigger: 'Message entrant', conditions: 'Texte exploitable', action: 'Ajouter les tags Offre, Visite, Pièces, Urgent, Notaire', autonomy: 'A', success: 'Tags pertinents, modifiables', fallback: 'Aucun tag si doute', phase: 'P0', enabled: true },
  ]
  for (const r of OWN) if (!db.get('routines', r.id)) db.put('routines', r)

  async function tick(only, manual = false) {
    const ids = only ?? ENGINE_IDS
    const out = []
    for (const id of ids) {
      if (!manual && !enabled(id)) continue
      const rule = RULES[id]
      const t0 = Date.now()
      if (!rule) { out.push(run(id, 'wait', 'Routine déclarative : connecteur ou règle à configurer')); continue }
      try { const [status, detail] = rule(); if (status !== 'skip' || manual) out.push(run(id, status === 'skip' ? 'ok' : status, detail, Date.now() - t0)) }
      catch (e) { out.push(run(id, 'fail', String(e.message ?? e), Date.now() - t0)) }
    }
    return out
  }

  return { actions, tick, ENGINE_IDS, generate }
}

export class HttpError extends Error { constructor(status, message) { super(message); this.status = status } }
