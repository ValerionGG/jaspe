// Copilote : Claude (si une clé est configurée) avec un instantané des données ; sinon règles sur les données réelles.
import { createLlmClient, providerOf, apiStatus } from './llm.js'

const SYSTEM = `Tu es le copilote de Jaspe, CRM d'une agence immobilière haut de gamme sur la Côte d'Azur.
Réponds en français, de façon brève et actionnable (3 à 6 phrases maximum).
Appuie-toi uniquement sur l'instantané JSON fourni : n'invente aucun chiffre, nom ou date. Si l'information manque, dis-le.
Ne prétends jamais avoir envoyé un message ou modifié une donnée : propose l'action, le conseiller valide.`

function snapshot(db) {
  const props = Object.fromEntries(db.list('properties').map((p) => [p.id, p]))
  return {
    dossiers: db.list('dossiers').map((d) => ({ id: d.id, vendeur: d.seller, etape: d.stage, prochaine_action: d.next, echeance: d.due, bien: props[d.propertyId]?.title, prix: props[d.propertyId]?.price, livrables: d.deliverables })),
    taches_ouvertes: db.list('tasks').filter((t) => !t.done).map((t) => ({ titre: t.title, echeance: t.due, priorite: t.prio })),
    validations: db.list('queue').map((q) => ({ titre: q.title, echeance: q.due })),
    agenda: db.list('events').slice(0, 40).map((e) => ({ jour: e.day, debut: e.start, titre: e.title, qui: e.who })),
    acquereurs: db.list('buyers').map((b) => ({ nom: b.name, budget: b.budget, zones: b.zones, financement: b.financing })),
  }
}

function rules(db, q) {
  const n = q.toLowerCase()
  const dossiers = db.list('dossiers')
  const props = Object.fromEntries(db.list('properties').map((p) => [p.id, p]))
  const cite = (...c) => c
  if (/visite|14 ?j|sans visite/.test(n)) {
    const visited = new Set(db.list('events').filter((e) => e.kind === 'visite').map((e) => e.dossier))
    const idle = dossiers.filter((d) => ['commercial', 'mandat'].includes(d.stage) && !visited.has(d.id))
    return { text: idle.length ? `${idle.length} mandat(s) sans visite planifiée : ${idle.map((d) => `${props[d.propertyId]?.title ?? d.seller} (${d.seller})`).join(', ')}. Je peux préparer un bilan vendeur pour chacun.` : 'Tous les mandats en diffusion ont au moins une visite planifiée.', cites: cite('Agenda', 'Dossiers'), actions: idle.length ? ['Préparer les bilans'] : [] }
  }
  if (/valid|attente|décision/.test(n)) {
    const qs = db.list('queue')
    return { text: qs.length ? `${qs.length} décision(s) vous attendent. Les plus urgentes : ${qs.slice(0, 3).map((x) => x.title).join(' ; ')}.` : 'Aucune décision en attente.', cites: cite('File de validation'), actions: qs.length ? ['Ouvrir les validations'] : [] }
  }
  const d = dossiers.find((x) => n.includes(x.seller.toLowerCase().replace(/^(famille|m\. & mme|mme|m\.)\s*/, '').split(' ')[0]))
  if (d) {
    const L = Object.entries(d.deliverables ?? {})
    const done = L.filter(([, s]) => s === 'done').length
    const blocked = L.filter(([, s]) => s === 'blocked').map(([k]) => k)
    const review = L.filter(([, s]) => s === 'review').map(([k]) => k)
    return { text: `Dossier ${d.seller} — ${props[d.propertyId]?.title ?? ''} : étape « ${d.stage} », ${done}/14 livrables prêts.${review.length ? ` À valider : ${review.join(', ')}.` : ''}${blocked.length ? ` Bloqué : ${blocked.join(', ')}.` : ''} Prochaine action : ${d.next} (${d.due}).`, cites: cite(`Dossier ${d.ref}`), actions: ['Ouvrir le dossier'], link: `/app/dossiers/${d.id}` }
  }
  if (/tâche|priorit|aujourd/.test(n)) {
    const t = db.list('tasks').filter((x) => !x.done)
    return { text: `${t.length} tâche(s) ouverte(s). Priorités : ${t.filter((x) => x.prio === 'haute').slice(0, 3).map((x) => x.title).join(' ; ') || 'aucune urgence'}.`, cites: cite('Tâches') }
  }
  return { text: 'Je peux répondre sur vos dossiers (citez le vendeur), les mandats sans visite, les validations en attente ou vos priorités du jour. Configurez une clé ANTHROPIC_API_KEY sur le serveur pour des réponses en langage libre.', cites: cite('Mode règles locales') }
}

/* ——— Routage multi-modèles ——— */
// Prix en $ par million de tokens (tarifs API Anthropic relevés le 03/11/2026). Écriture du cache = 1,25 × l’entrée (TTL 5 min).
// Lecture du cache Haiku non documentée ici : 0,1 × l’entrée par hypothèse.
export const PRICES = {
  'claude-haiku-5-5': { in: 0.10, out: 0.50, cacheRead: 0.01, cacheWrite: 0.125 },
  'claude-sonnet-5-5': { in: 2.00, out: 10.00, cacheRead: 0.10, cacheWrite: 2.50 },
  'claude-opus-5-5': { in: 4.00, out: 20.00, cacheRead: 0.20, cacheWrite: 5.00 },
}
/** Trois paliers : Haiku pour lire et lister, Sonnet pour rédiger, Opus seulement pour auditer (compromis, conformité, risque). */
export const TIERS = {
  lire: { model: process.env.JASPE_MODEL_LIRE ?? 'claude-haiku-5-5', effort: 'low', max_tokens: 2000 },
  rediger: { model: process.env.JASPE_MODEL_REDIGER ?? 'claude-sonnet-5-5', effort: 'low', max_tokens: 4000 },
  auditer: { model: process.env.JASPE_MODEL_AUDITER ?? 'claude-opus-5-5', effort: 'medium', max_tokens: 8000 },
}
export function routeQuestion(q) {
  const n = q.toLowerCase()
  if (/audit|compromis|cpcv|promessa|contrat|clause|conformit|lcb|tracfin|blanchiment|branqueamento|risque juridique|litige/.test(n)) return 'auditer'
  if (/r[ée]dig|[ée]cri[st]|pr[ée]pare|brouillon|mail|courrier|lettre|message|r[ée]ponse|contre-proposition|argumentaire|annonce|compte[- ]rendu/.test(n)) return 'rediger'
  return 'lire'
}
/** Coût d’un appel en dollars à partir de response.usage. */
export function callCost(model, u = {}) {
  const p = PRICES[model] ?? PRICES['claude-opus-5-5']
  return ((u.input_tokens ?? 0) * p.in + (u.output_tokens ?? 0) * p.out + (u.cache_read_input_tokens ?? 0) * p.cacheRead + (u.cache_creation_input_tokens ?? 0) * p.cacheWrite) / 1e6
}

export function createCopilot(db, { client: injected } = {}) {
  const client = injected ?? createLlmClient()
  /** Journal par appel : palier, modèle, tokens, coût. Sert au plafond par plan et au suivi de la marge. */
  const logCall = (tier, model, usage, extra = {}) => {
    const cost = callCost(model, usage)
    db.put('aicalls', { at: new Date().toISOString(), tier, model, input: usage?.input_tokens ?? 0, output: usage?.output_tokens ?? 0, cacheRead: usage?.cache_read_input_tokens ?? 0, cacheWrite: usage?.cache_creation_input_tokens ?? 0, cost: Math.round(cost * 1e6) / 1e6, ...extra }, { front: true })
    return cost
  }
  return {
    mode: client ? 'claude' : 'rules',
    provider: providerOf(client),
    async ask(question, history = []) {
      if (!client) return { ...rules(db, question), mode: 'rules' }
      const tier = routeQuestion(question)
      const t = TIERS[tier]
      // Haiku 5.5 n’a pas de repli serveur en cas de refus : `fallbacks` n’est envoyé qu’à Sonnet et Opus.
      const fallback = t.model.startsWith('claude-haiku') ? {} : { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }
      try {
        const res = await client.beta.messages.create({
          model: t.model,
          max_tokens: t.max_tokens,
          ...fallback,
          output_config: { effort: t.effort },
          // Prompt système figé, mis en cache ; l’instantané (variable) vient après le point de cache.
          system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
          messages: [
            { role: 'user', content: `Instantané des données (JSON) :\n${JSON.stringify(snapshot(db))}` },
            { role: 'assistant', content: 'Bien reçu. Quelle est votre question ?' },
            ...history.slice(-8).map((m) => ({ role: m.from === 'me' ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: question },
          ],
        })
        const model = res.model ?? t.model
        const cost = logCall(tier, model, res.usage, { stop: res.stop_reason, ...(res.provider ? { provider: res.provider, servedBy: res.servedBy } : {}) })
        if (res.stop_reason === 'refusal') return { text: 'Je ne peux pas répondre à cette demande.', mode: 'claude', tier, cost }
        const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
        return { text: text || 'Pas de réponse.', cites: ['Données du CRM · instantané'], mode: 'claude', tier, model, cost }
      } catch (e) {
        const st = apiStatus(e)
        if (st === 401 || st === 403) return { ...rules(db, question), mode: 'rules', warning: 'Clé API invalide — mode règles' }
        if (st === 429) return { ...rules(db, question), mode: 'rules', warning: 'Limite de débit atteinte — mode règles' }
        if (st) return { ...rules(db, question), mode: 'rules', warning: `Erreur API ${st} — mode règles` }
        return { ...rules(db, question), mode: 'rules', warning: 'API injoignable — mode règles' }
      }
    },
  }
}
