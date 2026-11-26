// Bêta-test simulé : des conseillers virtuels utilisent vraiment Jaspe (mode comptes, HTTP), une semaine de travail chacun.
// Usage : node simulate-beta.js [nombre de conseillers=12] > ../docs/simulation/RESULTATS.md
// Aucun appel réseau : pas de Stripe, pas de Claude (rédaction par règles), pas de DVF (JASPE_MARKET=off).
// Les chiffres de temps sont SIMULÉS : ils servent à tester l’app et la mesure, pas à promettre un gain.
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp } from './index.js'

const N = Number(process.argv[2] ?? 12)
// Générateur pseudo-aléatoire déterministe (même résultat à chaque exécution).
let seed = 20261126
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
const pick = (a) => a[Math.floor(rnd() * a.length)]
const between = (a, b) => a + rnd() * (b - a)

const PROFILES = [
  { type: 'Mandataire indépendant', country: 'FR', rdv: [3, 6], review: [60, 180], fix: 0.25, city: 'Antibes' },
  { type: 'Négociateur en agence', country: 'FR', rdv: [5, 9], review: [45, 120], fix: 0.2, city: 'Lyon' },
  { type: 'Agent haut de gamme', country: 'FR', rdv: [2, 4], review: [120, 300], fix: 0.45, city: 'Cannes' },
  { type: 'Consultor RE/MAX', country: 'PT', rdv: [4, 8], review: [60, 150], fix: 0.3, city: 'Cascais' },
  { type: 'Consultora agência eGO', country: 'PT', rdv: [3, 7], review: [60, 200], fix: 0.35, city: 'Lisboa' },
  { type: 'Conseiller débutant', country: 'FR', rdv: [2, 5], review: [120, 360], fix: 0.5, city: 'Rennes' },
]
const FIRST = ['Claire', 'Hugo', 'Sofia', 'Marc', 'Inês', 'João', 'Lucie', 'Rui', 'Nadia', 'Tomás', 'Élodie', 'Pedro', 'Karim', 'Beatriz', 'Paul', 'Ana']
const SELLERS = ['Famille Martin', 'M. et Mme Roux', 'Mme Garnier', 'Família Costa', 'Sr. Almeida', 'Família Pereira', 'M. Haddad', 'Mme Dubreuil']
// Débriefs dictés, dans l’esprit de la fiche parcours (engagement daté, prix à confirmer, pièce attendue).
const DEBRIEFS = {
  FR: [
    'RDV terminé avec {s}. Je rappelle le vendeur vendredi après le diagnostic. Prix à confirmer, ils visent {p}. Préparer l’estimation et le compte rendu.',
    'Découverte faite chez {s}. Ils hésitent entre exclusif et simple. Relancer lundi, envoyer le book de services, demander le dernier PV d’AG.',
    'Visite acquéreur terminée pour {s} : budget validé, financement en cours. Rappeler jeudi, préparer une sélection de biens, surveiller les baisses de prix du secteur.',
  ],
  PT: [
    'Reunião terminada com {s}. Ligo ao vendedor na sexta-feira depois do certificado energético. Preço a confirmar, querem {p}. Preparar a avaliação e o resumo.',
    'Visita à {s} feita. Hesitam entre exclusivo e não exclusivo. Voltar a ligar na segunda, pedir a caderneta predial e a certidão permanente.',
  ],
}
const CSV = {
  FR: (n, city) => 'Référence;Type;Prix;Surface habitable;Nb pièces;Ville;Quartier;DPE\n' + Array.from({ length: n }, (_, i) => `SIM-${i + 1};${pick(['Maison', 'Appartement', 'Villa'])};${Math.round(between(2, 30)) * 50000};${Math.round(between(45, 260))};${Math.round(between(2, 7))};${city};Centre;${pick('ABCDEFG'.split(''))}`).join('\n'),
  PT: (n, city) => 'Referência;Tipo de Imóvel;Preço;Área Útil;Tipologia;Concelho;Freguesia;Certificado Energético\n' + Array.from({ length: n }, (_, i) => `EGO-SIM-${i + 1};${pick(['Moradia', 'Apartamento'])};"${(Math.round(between(4, 40)) * 50000).toLocaleString('pt-PT')} €";${Math.round(between(50, 300))} m²;T${Math.round(between(1, 5))};${city};Centro;${pick('ABCDE'.split(''))}`).join('\n'),
}

const app = createApp({ auth: true, dataDir: ':memory:', filesDir: join(tmpdir(), 'jaspe-sim'), delay: () => Promise.resolve(), env: { JASPE_BETA: '1', JASPE_MARKET: 'off' }, fetch: () => { throw new Error('aucun appel réseau') } })
await new Promise((r) => app.server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${app.server.address().port}/api`
const client = () => {
  let cookie = ''
  return async (method, path, body) => {
    const r = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
    const set = r.headers.get('set-cookie'); if (set) cookie = set.split(';')[0]
    const json = await r.json().catch(() => ({}))
    if (r.status >= 400) throw new Error(`${method} ${path} → ${r.status} ${json.error ?? ''}`)
    return json
  }
}
const act = (call, name, payload) => call('POST', `/actions/${name}`, payload)
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const rows = [], problems = []
for (let i = 0; i < N; i++) {
  const prof = PROFILES[i % PROFILES.length]
  const name = `${FIRST[i % FIRST.length]} Sim${i + 1}`
  const call = client()
  const issue = (step, e) => problems.push({ who: name, type: prof.type, step, error: String(e.message ?? e) })
  const stat = { name, type: prof.type, country: prof.country, rdv: 0, docs: 0, fixed: 0, reviewMin: 0, tasks: 0 }
  try {
    const me = await call('POST', '/auth/register', { name, email: `sim${i + 1}@beta.test`, password: 'simulation-beta-2026', orgName: `${prof.type} ${prof.city}`, country: prof.country, start: 'vide' })
    const prev = await act(call, 'import.preview', { kind: 'properties', text: CSV[prof.country](8, prof.city), file: 'export.csv' })
    await act(call, 'import.run', { kind: 'properties', text: CSV[prof.country](8, prof.city), mapping: prev.mapping, file: 'export.csv' })
    const props = await call('GET', '/properties')
    const nRdv = Math.round(between(...prof.rdv))
    for (let r = 0; r < nRdv; r++) {
      const p = props[r % props.length], seller = pick(SELLERS)
      try {
        const d = await call('POST', '/dossiers', { seller, propertyId: p.id, agentId: me.user.id, stage: 'prep', deliverables: {}, tags: [] })
        stat.rdv++
        // 1. Préparer le RDV : brief D1 relu et validé.
        await act(call, 'deliverable.generateAll', { dossierId: d.id, codes: ['D1'] }).catch((e) => issue('préparer le RDV (D1)', e))
        await act(call, 'deliverable.validate', { dossierId: d.id, code: 'D1', reviewSec: Math.round(between(...prof.review) / 2) }).catch((e) => issue('valider D1', e))
        // 2. À la sortie : passage en post-RDV (génère les livrables) + débrief dicté → plan → actions cochées.
        await act(call, 'dossier.move', { id: d.id, stage: 'post' })
        await wait(5)
        const text = pick(DEBRIEFS[prof.country]).replace('{s}', seller).replace('{p}', `${Math.round(p.price / 1000)} k€`)
        const plan = await act(call, 'assistant.plan', { text })
        if (!plan.items?.length) issue('débrief → plan', new Error(`aucune action reconnue dans : « ${text.slice(0, 80)}… »`))
        const res = await act(call, 'assistant.apply', { dossierId: d.id, items: plan.items, text })
        stat.tasks += res.done.filter((x) => x.result === 'tâche créée').length
        // 3. Éditer les documents : relire, corriger parfois, valider (compte rendu, estimation, sélection).
        for (const code of ['L1', 'L7', 'L3']) {
          const doc = (await call('GET', '/documents')).find((x) => x.id === `${d.id}-${code}`)
          if (!doc) { issue(`document ${code}`, new Error('non généré après le passage en post-RDV')); continue }
          if (/undefined|NaN/.test(JSON.stringify(doc.body ?? ''))) issue(`document ${code}`, new Error('contient « undefined » ou « NaN »'))
          const sec = Math.round(between(...prof.review))
          if (rnd() < prof.fix) { await act(call, 'deliverable.edit', { dossierId: d.id, code, body: doc.body, editSec: Math.round(sec * 0.8) }); stat.fixed++ }
          await act(call, 'deliverable.validate', { dossierId: d.id, code, reviewSec: sec })
          stat.docs++; stat.reviewMin += sec / 60
        }
      } catch (e) { issue(`dossier ${r + 1}`, e) }
    }
    await wait(20)
    const log = await call('GET', '/timelog')
    const done = log.filter((e) => !e.pending)
    stat.baseline = done.reduce((n, e) => n + (e.baseline ?? 0), 0)
    stat.spent = done.reduce((n, e) => n + (e.spent ?? 0), 0)
    stat.net = done.reduce((n, e) => n + (e.net ?? 0), 0)
    stat.pending = log.filter((e) => e.pending).length
  } catch (e) { issue('inscription / import', e) }
  rows.push(stat)
}
app.server.close()

const h = (m) => `${Math.floor(m / 60)} h ${String(Math.round(m % 60)).padStart(2, '0')}`
const ok = rows.filter((r) => r.net !== undefined)
const tot = (k) => ok.reduce((n, r) => n + r[k], 0)
const out = []
out.push('# Bêta-test simulé — résultats', '')
out.push(`${rows.length} conseillers virtuels, une semaine de travail chacun, dans la vraie app (mode comptes, HTTP), selon la fiche parcours : préparer le RDV, dicter le débrief, relire et valider les documents, relancer.`, '')
out.push('**Chiffres simulés** : temps de relecture et taux de correction tirés au hasard selon le profil. Ils testent l’app et la mesure ; seuls de vrais conseillers donneront le vrai gain.', '')
out.push('| Conseiller | Profil | Pays | RDV | Docs validés | Corrigés | Référence manuelle | Temps passé | Gain net | En attente |', '|---|---|---|---|---|---|---|---|---|---|')
for (const r of rows) out.push(`| ${r.name} | ${r.type} | ${r.country} | ${r.rdv} | ${r.docs} | ${r.fixed} | ${r.baseline !== undefined ? h(r.baseline) : '—'} | ${r.spent !== undefined ? h(r.spent) : '—'} | ${r.net !== undefined ? `**${h(r.net)}**` : '—'} | ${r.pending ?? '—'} |`)
out.push('', `**Total** : ${tot('rdv')} rendez-vous, ${tot('docs')} documents validés, ${tot('fixed')} corrigés. Gain net moyen : **${h(tot('net') / Math.max(1, ok.length))} par conseiller et par semaine**, soit ${Math.round((tot('net') / Math.max(1, ok.length)) / 60 * 4.33 * 60)} € par mois à 60 €/h pour un abonnement de 10 €.`, '')
out.push('## Comment le gain est calculé', '')
out.push('- Chaque travail préparé par Jaspe a une **référence manuelle** (temps qu’il aurait pris à la main) : brief de RDV 25 min, compte rendu 10 min, estimation 45 min, sélection acquéreurs 25 min, relance 6 min, veille 20 min (`server/assist.js`, BASELINES).')
out.push('- On retire le **temps réellement passé** à relire et corriger (chronométré dans l’app).')
out.push('- Un brouillon ne compte **rien** tant qu’il n’est pas validé (colonne « En attente »).')
out.push('- Ces références sont des valeurs par défaut : chaque conseiller peut les remplacer par son propre chrono (page Temps gagné › Calibrer). Avant de communiquer un chiffre, les calibrer avec 3 à 5 vrais conseillers.', '')
out.push('## Problèmes rencontrés pendant la simulation', '')
if (!problems.length) out.push('Aucun : tous les parcours sont allés au bout sans erreur.')
else {
  const byStep = {}
  for (const p of problems) (byStep[`${p.step} — ${p.error}`] ??= []).push(p.who)
  for (const [k, who] of Object.entries(byStep)) out.push(`- ${k} (${who.length} fois : ${[...new Set(who)].slice(0, 4).join(', ')}${who.length > 4 ? '…' : ''})`)
}
process.stdout.write(out.join('\n') + '\n')
