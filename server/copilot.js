// Copilote : Claude (si une clé est configurée) avec un instantané des données ; sinon règles sur les données réelles.
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM = `Tu es le copilote de NXT Agent, CRM d'une agence immobilière haut de gamme sur la Côte d'Azur.
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

export function createCopilot(db) {
  const client = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN ? new Anthropic() : null
  return {
    mode: client ? 'claude' : 'rules',
    async ask(question, history = []) {
      if (!client) return { ...rules(db, question), mode: 'rules' }
      try {
        const res = await client.beta.messages.create({
          model: 'claude-opus-5-5',
          max_tokens: 16000,
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          output_config: { effort: 'low' },
          system: SYSTEM,
          messages: [
            { role: 'user', content: `Instantané des données (JSON) :\n${JSON.stringify(snapshot(db))}` },
            { role: 'assistant', content: 'Bien reçu. Quelle est votre question ?' },
            ...history.slice(-8).map((m) => ({ role: m.from === 'me' ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: question },
          ],
        })
        if (res.stop_reason === 'refusal') return { text: 'Je ne peux pas répondre à cette demande.', mode: 'claude' }
        const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
        return { text: text || 'Pas de réponse.', cites: ['Données du CRM · instantané'], mode: 'claude' }
      } catch (e) {
        if (e instanceof Anthropic.AuthenticationError) return { ...rules(db, question), mode: 'rules', warning: 'Clé API invalide — mode règles' }
        if (e instanceof Anthropic.RateLimitError) return { ...rules(db, question), mode: 'rules', warning: 'Limite de débit atteinte — mode règles' }
        if (e instanceof Anthropic.APIError) return { ...rules(db, question), mode: 'rules', warning: `Erreur API ${e.status} — mode règles` }
        return { ...rules(db, question), mode: 'rules', warning: 'API injoignable — mode règles' }
      }
    },
  }
}
