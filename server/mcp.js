// Serveur MCP Jaspe : 9 outils utilisables depuis Claude ou ChatGPT.
// Lecture libre ; aucune écriture directe : chaque outil « d'écriture » dépose une proposition dans la file
// « Tâches & validations » (collection `queue`, kind 'mcp'). Le conseiller la valide (mcp.approve) ou la refuse (mcp.reject) dans l'app.
import { randomBytes, randomUUID, createHash, timingSafeEqual } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import * as z from 'zod'
import { NAMES, EXTERNAL } from './templates.js'
import { HttpError } from './engine.js'
import { actor } from './actor.js'

const L_CODES = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9']
/** Seules ces actions peuvent être exécutées par une proposition validée (une entrée de file forgée ne lance rien d'autre). */
const ALLOWED = new Set(['assistant.apply', 'deliverable.generate', 'invoice.fromTransaction'])
const DAY = 864e5
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const sha256 = (s) => createHash('sha256').update(String(s)).digest('hex')
const text = (data) => ({ content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] })
const fail = (e) => ({ isError: true, content: [{ type: 'text', text: String(e?.message ?? e) }] })
const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
// Une proposition s'ajoute à la file : rien n'est modifié dans les dossiers, rien n'est envoyé.
const PROPOSE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }

/** Crée l'instance McpServer d'une base (démo ou agence). `user` : auteur affiché sur les propositions. */
export function createMcpServer({ engine, db, user, emit = () => {} } = {}) {
  if (!engine || !db) throw new Error('createMcpServer : engine et db requis')
  const by = user?.name ?? 'Assistant MCP'
  const server = new McpServer({ name: 'jaspe', version: '1.0.0' }, {
    instructions: 'Jaspe, assistant du conseiller immobilier. Les outils jaspe_* de lecture renvoient les données réelles de l’agence. '
      + 'Les outils de préparation ne modifient rien : ils déposent une proposition dans « Tâches & validations », que le conseiller valide ou refuse dans Jaspe. '
      + 'Dites-le clairement à l’utilisateur après chaque proposition.',
  })
  const tool = (name, config, fn) => server.registerTool(name, config, async (args) => { try { return await fn(args ?? {}) } catch (e) { return fail(e) } })

  const dossier = (id) => { const d = db.get('dossiers', id) ?? db.list('dossiers').find((x) => x.ref === id); if (!d) throw new HttpError(404, `Dossier introuvable : ${id}`); return d }
  const short = (d) => {
    const p = db.get('properties', d.propertyId) ?? {}
    return { id: d.id, ref: d.ref, vendeur: d.seller, etape: d.stage, prochaine_action: d.next, echeance: d.due, bien: p.title, ville: p.city, prix: p.price, conseiller: db.get('agents', d.agentId)?.name ?? d.agentId }
  }

  /** Dépose une proposition dans la file de validation : seule écriture permise aux outils MCP. */
  const propose = ({ op, title, d, why, saved, action, payload, lines }) => {
    const id = `q-mcp-${randomUUID().slice(0, 8)}`
    const q = db.put('queue', {
      id, kind: 'mcp', op, title, dossier: d?.id, due: 'Aujourd’hui', bucket: 'today', why, saved, assignee: d?.agentId ?? 'a1',
      safe: false, ai: true, source: 'MCP', status: 'proposé', createdAt: new Date().toISOString(), by,
      detail: { action, payload, lines },
    }, { front: true })
    emit('queue', q.id)
    return text({ proposition: id, statut: 'en attente de validation dans Jaspe › Tâches & validations', titre: title, detail: lines, note: 'Rien n’a été modifié ni envoyé. Le conseiller doit valider cette proposition dans l’application.' })
  }

  /* ——— Lecture ——— */
  tool('jaspe_dossiers', {
    title: 'Lister les dossiers',
    description: 'Liste les dossiers vendeurs de l’agence (référence, vendeur, étape, prochaine action, bien, prix). Filtres facultatifs : étape (prep, rdv, post, mandat, commercial, offre, compromis, acte…) et texte libre (vendeur, référence, ville, bien).',
    inputSchema: { etape: z.string().optional().describe('Étape du dossier, ex. « commercial »'), recherche: z.string().optional().describe('Texte cherché dans le vendeur, la référence, la ville ou le bien'), limite: z.number().int().min(1).max(200).optional().describe('Nombre maximal de dossiers (50 par défaut)') },
    annotations: { title: 'Lister les dossiers', ...READ },
  }, ({ etape, recherche, limite = 50 }) => {
    const q = String(recherche ?? '').toLowerCase()
    const rows = db.list('dossiers').filter((d) => !etape || d.stage === etape).map(short)
      .filter((r) => !q || [r.vendeur, r.ref, r.ville, r.bien].some((v) => String(v ?? '').toLowerCase().includes(q)))
    return text({ total: rows.length, dossiers: rows.slice(0, limite) })
  })

  tool('jaspe_dossier', {
    title: 'Détail d’un dossier',
    description: 'Détail complet d’un dossier : vendeur, bien, étape, prochaines actions (tâches ouvertes, validations en attente) et état des livrables D1–D5 / L1–L9 avec leurs documents.',
    inputSchema: { id: z.string().describe('Identifiant (ex. d1) ou référence (ex. VND-2026-014) du dossier') },
    annotations: { title: 'Détail d’un dossier', ...READ },
  }, ({ id }) => {
    const d = dossier(id)
    const p = db.get('properties', d.propertyId) ?? null
    const docs = db.list('documents').filter((x) => x.dossierId === d.id || String(x.id).startsWith(`${d.id}-`))
    const livrables = Object.entries(d.deliverables ?? {}).map(([code, etat]) => {
      const doc = docs.find((x) => x.code === code)
      return { code, nom: NAMES[code] ?? code, etat, document: doc ? { id: doc.id, version: doc.version, statut: doc.status ?? 'brouillon', sujet: doc.subject } : null }
    })
    return text({
      ...short(d), motivation: d.motivation, delai: d.timeline, tags: d.tags,
      bien: p && { id: p.id, titre: p.title, type: p.type, adresse: p.address, quartier: p.district, ville: p.city, surface: p.surface, pieces: p.rooms, prix: p.price, dpe: p.dpe },
      prochaines_actions: {
        dossier: d.next ? `${d.next}${d.due ? ` (${d.due})` : ''}` : null,
        taches: db.list('tasks').filter((t) => t.dossier === d.id && !t.done).map((t) => ({ id: t.id, titre: t.title, echeance: t.dueDate ?? t.due, priorite: t.prio })),
        validations: db.list('queue').filter((x) => x.dossier === d.id).map((x) => ({ id: x.id, titre: x.title, type: x.kind, echeance: x.due })),
      },
      livrables,
    })
  })

  tool('jaspe_taches_du_jour', {
    title: 'Tâches du jour',
    description: 'Ce qui attend le conseiller aujourd’hui : tâches ouvertes dues aujourd’hui ou en retard, tâches prioritaires et décisions de la file « Tâches & validations » à prendre aujourd’hui.',
    inputSchema: {},
    annotations: { title: 'Tâches du jour', ...READ },
  }, () => {
    const today = ymd(new Date())
    const name = (id) => (id ? db.get('dossiers', id)?.seller : undefined)
    const open = db.list('tasks').filter((t) => !t.done)
    const dueToday = (t) => (t.dueDate ? t.dueDate <= today : /aujourd|maintenant|ce soir|sous \d+ ?h/i.test(String(t.due ?? '')))
    const taches = open.filter((t) => dueToday(t) || t.prio === 'haute').map((t) => ({ id: t.id, titre: t.title, echeance: t.dueDate ?? t.due, priorite: t.prio, dossier: name(t.dossier), en_retard: !!t.dueDate && t.dueDate < today }))
    const validations = db.list('queue').filter((q) => q.bucket === 'today').map((q) => ({ id: q.id, titre: q.title, type: q.kind, dossier: name(q.dossier), echeance: q.due, revue_individuelle: !q.safe, proposee_par_mcp: q.source === 'MCP' }))
    return text({ date: today, taches, validations, autres_taches_ouvertes: open.length - taches.length })
  })

  tool('jaspe_temps_gagne', {
    title: 'Temps gagné',
    description: 'Temps gagné sur 7 jours (par défaut les 7 derniers), net des relectures et corrections : gain net = référence manuelle − temps passé. Détail par type de travail. Les brouillons pas encore relus ne comptent pas.',
    inputSchema: { fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Dernier jour de la période (AAAA-MM-JJ), aujourd’hui par défaut'), inclure_demo: z.boolean().optional().describe('Inclure l’historique de démonstration (non par défaut)') },
    annotations: { title: 'Temps gagné', ...READ },
  }, ({ fin, inclure_demo = false }) => {
    const end = fin ? new Date(`${fin}T23:59:59`) : new Date()
    const start = +end - 7 * DAY
    const rows = db.list('timelog').filter((e) => !e.pending && (inclure_demo || !e.demo) && +new Date(e.at) > start && +new Date(e.at) <= +end)
    const sum = (a, k) => Math.round(a.reduce((s, e) => s + (Number(e[k]) || 0), 0) * 10) / 10
    const kinds = [...new Set(rows.map((e) => e.kind))]
    const parType = kinds.map((k) => { const a = rows.filter((e) => e.kind === k); return { type: k, libelle: a[0].label, nombre: a.length, reference_min: sum(a, 'baseline'), passe_min: sum(a, 'spent'), net_min: sum(a, 'net'), corrections: sum(a, 'corrections') } }).sort((a, b) => b.net_min - a.net_min)
    const net = sum(rows, 'net')
    return text({ du: ymd(new Date(start + DAY)), au: ymd(end), net_min: net, net_heures: Math.round(net / 6) / 10, reference_min: sum(rows, 'baseline'), passe_min: sum(rows, 'spent'), corrections: sum(rows, 'corrections'), elements: rows.length, par_type: parType })
  })

  tool('jaspe_conformite', {
    title: 'Conformité d’un dossier',
    description: 'Points de conformité d’un dossier selon le pays de l’agence (FR : Hoguet, LCB-FT, DPE… ; PT : Lei 15/2013, Lei 83/2017…) : points bloquants à l’étape actuelle, points à faire, score. Aide à la conformité, pas un avis juridique.',
    inputSchema: { dossierId: z.string().describe('Identifiant ou référence du dossier') },
    // Recalcule la checklist dérivée (cache `compliance`) sans toucher aux données du dossier.
    annotations: { title: 'Conformité d’un dossier', ...READ },
  }, ({ dossierId }) => {
    const d = dossier(dossierId)
    const c = engine.actions['compliance.evaluate']({ dossierId: d.id })
    const pick = (i) => ({ id: i.id, point: i.label, texte: i.law, phase: i.phase, preuve: i.evidence || undefined })
    return text({ dossier: d.seller, pays: c.country, etape: c.stage, score: c.score, bloquants: c.items.filter((i) => i.state === 'blocked').map(pick), a_faire: c.items.filter((i) => i.state === 'todo').map(pick), conformes: c.items.filter((i) => i.state === 'ok').length, non_applicables: c.items.filter((i) => i.state === 'na').length })
  })

  /* ——— Préparation (propositions à valider) ——— */
  tool('jaspe_plan_depuis_brief', {
    title: 'Plan d’action depuis un brief',
    description: 'Lit un brief ou débrief libre (français ou portugais) et propose un plan d’action : relances datées, documents, veille, facture, contrôles. Ne lance rien : le plan est déposé comme proposition dans « Tâches & validations » ; les actions ne sont créées qu’après validation du conseiller.',
    inputSchema: { texte: z.string().min(3).max(4000).describe('Texte du brief ou débrief'), dossierId: z.string().optional().describe('Dossier concerné (identifiant ou référence)') },
    annotations: { title: 'Plan d’action depuis un brief', ...PROPOSE },
  }, ({ texte, dossierId }) => {
    const d = dossierId ? dossier(dossierId) : null
    const { items } = engine.actions['assistant.plan']({ text: texte })
    if (!items.length) return text({ plan: [], note: 'Aucune action détectée dans ce brief : rien n’a été proposé.' })
    return propose({
      op: 'plan', d, title: `Plan d’action (${items.length} action${items.length > 1 ? 's' : ''})${d ? ` — ${d.seller}` : ''}`, saved: 15,
      why: 'Plan proposé depuis Claude / ChatGPT (MCP) : chaque action cite la phrase du brief qui l’a déclenchée',
      action: 'assistant.apply', payload: { dossierId: d?.id, items, text: texte },
      lines: items.map((i) => `${i.label}${i.due ? ` (échéance ${i.due})` : ''} — « ${String(i.source).slice(0, 120)} »`),
    })
  })

  tool('jaspe_proposer_relance', {
    title: 'Proposer une relance',
    description: 'Propose une relance (vendeur, acquéreur, notaire, syndic…) sur un dossier, avec échéance et message suggéré. Crée seulement une proposition dans « Tâches & validations » ; après validation, Jaspe crée la tâche de relance. Aucun message n’est envoyé.',
    inputSchema: {
      dossierId: z.string().describe('Identifiant ou référence du dossier'),
      destinataire: z.string().optional().describe('Personne à relancer, ex. « vendeur », « Me Faure (notaire) »'),
      objet: z.string().min(3).max(300).describe('Objet de la relance, ex. « retour sur l’offre de 1,55 M€ »'),
      echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Date de relance AAAA-MM-JJ (dans 2 jours par défaut)'),
      message: z.string().max(2000).optional().describe('Brouillon de message proposé au conseiller'),
    },
    annotations: { title: 'Proposer une relance', ...PROPOSE },
  }, ({ dossierId, destinataire, objet, echeance, message }) => {
    const d = dossier(dossierId)
    const due = echeance ?? ymd(new Date(Date.now() + 2 * DAY))
    const label = `Relancer ${destinataire ?? 'le vendeur'} : ${objet}`
    return propose({
      op: 'relance', d, title: `${label} — ${d.seller}`, saved: 6,
      why: `Relance proposée depuis Claude / ChatGPT (MCP) pour le ${due}`,
      action: 'assistant.apply', payload: { dossierId: d.id, items: [{ id: 'mcp1', type: 'relance', label, due, source: message ? `Message suggéré : ${message}` : 'Proposé via MCP', selected: true }] },
      lines: [`Tâche : ${label}`, `Échéance : ${due}`, ...(message ? [`Message suggéré : ${message}`] : [])],
    })
  })

  tool('jaspe_preparer_document', {
    title: 'Préparer un livrable',
    description: `Propose de préparer un livrable du dossier (brouillon généré à partir des seuls faits du dossier, sources citées). Codes : ${L_CODES.map((c) => `${c} ${NAMES[c]}`).join(' ; ')}. Après validation de la proposition, le brouillon est généré puis reste à relire ; les documents destinés au client exigent une relecture individuelle avant tout envoi.`,
    inputSchema: { dossierId: z.string().describe('Identifiant ou référence du dossier'), code: z.enum(L_CODES).describe('Code du livrable, L1 à L9') },
    annotations: { title: 'Préparer un livrable', ...PROPOSE },
  }, ({ dossierId, code }) => {
    const d = dossier(dossierId)
    const prev = db.get('documents', `${d.id}-${code}`)
    return propose({
      op: 'document', d, title: `Préparer ${code} · ${NAMES[code]} — ${d.seller}`, saved: 20,
      why: `Livrable demandé depuis Claude / ChatGPT (MCP)${EXTERNAL.has(code) ? ' · document client : relecture obligatoire après génération' : ''}`,
      action: 'deliverable.generate', payload: { dossierId: d.id, code },
      lines: [`Générer ${code} · ${NAMES[code]}${prev ? ` (nouvelle version, actuelle v${prev.version})` : ''}`, 'Le brouillon arrivera dans la file pour relecture ; rien n’est envoyé.'],
    })
  })

  tool('jaspe_preparer_facture', {
    title: 'Préparer une facture de commission',
    description: 'Propose de préparer la facture de commission d’une transaction (modèle « agence » : agence → client ; « mandataire » : agent commercial → réseau). Après validation de la proposition, un brouillon de facture est créé (non numéroté, non envoyé) ; sa validation reste à faire dans la page Factures.',
    inputSchema: {
      dossierId: z.string().optional().describe('Dossier de la transaction (identifiant ou référence)'),
      transactionId: z.string().optional().describe('Identifiant de la transaction, si connu'),
      modele: z.enum(['agence', 'mandataire']).optional().describe('Modèle de facture (agence par défaut)'),
    },
    annotations: { title: 'Préparer une facture de commission', ...PROPOSE },
  }, ({ dossierId, transactionId, modele = 'agence' }) => {
    const d = dossierId ? dossier(dossierId) : null
    const tx = transactionId ? db.get('transactions', transactionId) : d ? db.list('transactions').find((t) => t.dossier === d.id) : null
    if (!tx) throw new HttpError(404, 'Transaction introuvable : indiquez un dossier qui a une transaction, ou son identifiant')
    const dd = d ?? (tx.dossier ? db.get('dossiers', tx.dossier) : null)
    const existing = db.list('invoices').find((i) => i.txId === tx.id && i.status !== 'annulée' && (i.template ?? 'agence') === modele)
    if (existing) return text({ note: `Une facture ${modele} existe déjà pour cette transaction (${existing.number ?? 'brouillon'}, ${existing.status}) : aucune proposition créée.`, facture: existing.id })
    return propose({
      op: 'facture', d: dd, title: `Facture de commission (${modele}) — ${tx.seller ?? dd?.seller ?? tx.id}`, saved: 20,
      why: 'Facture demandée depuis Claude / ChatGPT (MCP) : brouillon à vérifier, puis validation et numérotation dans Factures',
      action: 'invoice.fromTransaction', payload: { txId: tx.id, template: modele },
      lines: [`Brouillon de facture ${modele} depuis la transaction ${tx.id}`, `Prix ${Number(tx.price ?? 0).toLocaleString('fr-FR')} € · honoraires ${Number(tx.fees ?? 0).toLocaleString('fr-FR')} €`],
    })
  })

  return server
}

/** Actions moteur à brancher par engine.extend({ actions: mcpActions(engine, db, { orgId, emit }) }). `emit` : diffusion SSE (facultatif). */
export function mcpActions(engine, db, { orgId, emit } = {}) {
  const log = (q, status, extra = {}) => db.put('mcplog', { id: q.id, op: q.op, title: q.title, dossier: q.dossier, detail: q.detail, by: q.by, createdAt: q.createdAt, status, decidedAt: new Date().toISOString(), ...extra }, { front: true })
  const get = (id) => {
    const q = db.get('queue', id)
    if (!q || q.kind !== 'mcp') throw new HttpError(404, 'Proposition introuvable')
    return q
  }
  const activity = (who, what, tone, link) => { const a = db.put('activity', { t: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), at: new Date().toISOString(), who, what, tone, link }, { front: true }); emit?.('activity', a.id) }
  // Sans `emit`, `queue.resolve` retire l'entrée en la diffusant (il journalise aussi l'activité ; il n'exécute rien pour kind 'mcp').
  const drop = (id, decision) => {
    if (!db.get('queue', id)) return
    if (emit) { db.remove('queue', id); emit('queue', id, 'delete') } else engine.actions['queue.resolve']({ id, decision })
  }
  return {
    'mcp.approve': async ({ id, by = actor() }) => {
      const q = get(id)
      const { action, payload } = q.detail ?? {}
      if (!ALLOWED.has(action) || !engine.actions[action]) throw new HttpError(400, `Action non autorisée pour une proposition MCP : ${action}`)
      const result = await engine.actions[action](payload ?? {})
      drop(id, 'Proposition MCP validée')
      log(q, 'validé', { decidedBy: by })
      if (emit) activity(by, `a validé une proposition MCP : ${q.title}`, 'win', q.dossier ? `/app/dossiers/${q.dossier}` : '/app/taches')
      return { ok: true, id, action, result }
    },
    'mcp.reject': ({ id, reason, by = actor() }) => {
      const q = get(id)
      drop(id, `Proposition MCP refusée${reason ? ` (${reason})` : ''}`)
      log(q, 'refusé', { decidedBy: by, reason })
      if (emit) activity(by, `a refusé une proposition MCP : ${q.title}${reason ? ` (${reason})` : ''}`, 'warn')
      return { ok: true, id }
    },
    /** Jeton d'API de l'agence : affiché une seule fois, seule son empreinte SHA-256 est conservée. */
    'apitoken.create': ({ name } = {}) => {
      const token = `jsp.${orgId ?? 'demo'}.${randomBytes(24).toString('base64url')}`
      const doc = db.put('apitokens', { id: `tok_${randomUUID().slice(0, 8)}`, name: String(name ?? '').trim().slice(0, 80) || 'Jeton MCP', hash: sha256(token), hint: `${token.slice(0, 4)}…${token.slice(-4)}`, createdAt: new Date().toISOString(), lastUsedAt: null, revokedAt: null }, { front: true })
      activity(actor(), `a créé le jeton d’API « ${doc.name} » (MCP)`, 'warn', '/app/reglages?s=integrations')
      return { id: doc.id, name: doc.name, hint: doc.hint, createdAt: doc.createdAt, token }
    },
    'apitoken.list': () => ({ tokens: db.list('apitokens').map(({ hash: _h, ...t }) => t) }),
    'apitoken.revoke': ({ id }) => {
      const t = db.get('apitokens', id)
      if (!t) throw new HttpError(404, 'Jeton introuvable')
      db.patch('apitokens', id, { revokedAt: t.revokedAt ?? new Date().toISOString() })
      activity(actor(), `a révoqué le jeton d’API « ${t.name} »`, 'warn', '/app/reglages?s=integrations')
      return { ok: true, id }
    },
  }
}

/** Jeton valide de la base → document du jeton, sinon null. */
export function verifyApiToken(db, token) {
  const h = Buffer.from(sha256(token), 'hex')
  const t = db.list('apitokens').find((x) => !x.revokedAt && x.hash && timingSafeEqual(Buffer.from(x.hash, 'hex'), h))
  if (!t) return null
  db.patch('apitokens', t.id, { lastUsedAt: new Date().toISOString() })
  return t
}

const rpcError = (res, status, message, headers = {}) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers })
  res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: status === 401 ? -32001 : -32000, message }, id: null }))
}
const readJson = (req, max = 1024 * 1024) => new Promise((resolve, reject) => {
  let size = 0; const chunks = []
  req.on('data', (c) => { size += c.length; if (size > max) { reject(new HttpError(413, 'Corps trop volumineux')); req.destroy() } else chunks.push(c) })
  req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined) } catch { reject(new HttpError(400, 'JSON invalide')) } })
  req.on('error', reject)
})

/**
 * Point d'entrée Streamable HTTP (sans état) à monter sur /mcp.
 * ctx : contexte de la base de démo `{ db, engine }`, ou en mode comptes `{ openOrg, accounts }` (le jeton porte l'agence : jsp.<orgId>.<secret>).
 */
export async function handleMcpHttp(req, res, ctx = {}) {
  try {
    const m = /^Bearer\s+(\S+)$/i.exec(String(req.headers.authorization ?? ''))
    const token = m?.[1] ?? ''
    const [prefix, orgId, secret] = token.split('.')
    const deny = () => rpcError(res, 401, 'Jeton d’API invalide ou révoqué', { 'www-authenticate': 'Bearer realm="jaspe-mcp"' })
    if (prefix !== 'jsp' || !orgId || !secret) return deny()
    let base = null
    if (ctx.openOrg) {
      if (!/^org_[a-z0-9]{6,32}$/.test(orgId) || (ctx.accounts && !ctx.accounts.getOrg(orgId))) return deny()
      base = ctx.openOrg(orgId)
    } else if (orgId === 'demo') base = ctx
    if (!base?.db || !base.engine) return deny()
    const tok = verifyApiToken(base.db, token)
    if (!tok) return deny()
    if (req.method !== 'POST') return rpcError(res, 405, 'Méthode non prise en charge : utilisez POST (mode sans état)', { allow: 'POST' })
    const body = await readJson(req)
    const server = createMcpServer({ engine: base.engine, db: base.db, emit: base.emit, user: { name: `MCP · ${tok.name}` } })
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
    res.on('close', () => { transport.close(); server.close() })
    await server.connect(transport)
    await transport.handleRequest(req, res, body)
  } catch (e) {
    if (!res.headersSent) rpcError(res, e instanceof HttpError ? e.status : 500, e?.message ?? 'Erreur serveur')
  }
}
