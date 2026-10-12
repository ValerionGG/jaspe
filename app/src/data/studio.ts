// Studio livrables — règles d'affichage dérivées des documents réels (contrôles, historique, différences).
import type { DocumentDoc } from './collections'

export const STUDIO_CODES = ['D1', 'D2', 'D3', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'] as const
export type StudioCode = (typeof STUDIO_CODES)[number]
export const FAN_CODES = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'] as const
/** Livrables qui sortent de l'agence : la validation crée un envoi dans la file `outbox`. */
export const EXTERNAL = new Set(['L1', 'L3', 'L4', 'L5', 'L6', 'L7'])

/** Version figée d'un document, conservée dans `history` à chaque modification ou régénération. */
export type Snapshot = { v: number; at: string; by: string; note: string; subject?: string; body: string[] }
export type StudioDocument = DocumentDoc & { history?: Snapshot[]; editedBy?: string; editedAt?: string; validatedBy?: string }

/** Métadonnées de la version courante. */
export const currentMeta = (d: StudioDocument): Snapshot => ({
  v: d.version,
  at: d.editedAt ?? d.createdAt,
  by: d.editedBy ?? 'Copilote',
  note: d.editedBy ? 'Modification manuelle' : d.version > 1 ? 'Régénérée par le copilote' : 'Génération initiale',
  subject: d.subject,
  body: d.body ?? [],
})

export type CheckState = 'ok' | 'warn' | 'fail'
export type Check = { label: string; detail: string; state: CheckState }

/** Contrôles qualité calculés depuis le document (AUT-058 côté serveur + règles métier). */
export function checksOf(d: StudioDocument): Check[] {
  const out: Check[] = [
    d.checks?.length ? { label: 'Contrôle automatique AUT-058', detail: d.checks.join(' · '), state: 'fail' } : { label: 'Contrôle automatique AUT-058', detail: 'Aucun champ vide, aucune valeur inventée', state: 'ok' },
    d.sources?.length ? { label: 'Chiffres sourcés', detail: `${d.sources.length} source(s) datée(s)`, state: 'ok' } : { label: 'Chiffres sourcés', detail: 'Aucune source citée', state: 'fail' },
    !EXTERNAL.has(d.code) ? { label: 'Destinataires', detail: 'Usage interne — jamais envoyé au client', state: 'ok' }
      : d.kind === 'social' ? { label: 'Destinataires', detail: 'Comptes réseaux de l’agence · publication après validation', state: 'ok' }
      : d.to && !/aucun/i.test(d.to) ? { label: 'Destinataires', detail: d.to, state: 'ok' }
      : d.kind === 'email' || d.to ? { label: 'Destinataires', detail: d.to ?? 'Destinataire manquant', state: 'fail' }
      : { label: 'Destinataires', detail: 'Vendeur du dossier · remis après validation', state: 'ok' },
  ]
  if (d.code === 'L4') {
    const labelled = d.posts?.some((p) => p.label)
    out.push({ label: 'Étiquetage IA (AI Act)', detail: labelled ? 'Mention « Image retouchée — IA » présente' : 'Mention IA absente', state: labelled ? 'ok' : 'warn' })
  }
  if (d.code === 'L8') out.push({ label: 'Étiquetage IA (AI Act)', detail: 'Original conservé, mention incrustée', state: 'ok' })
  if (d.items?.length) {
    const miss = d.items.filter((i) => i.state === 'missing'), check = d.items.filter((i) => i.state === 'check')
    out.push(miss.length ? { label: 'Pièces du dossier', detail: `${miss.map((i) => i.label).join(', ')} : manquant`, state: 'fail' } : check.length ? { label: 'Pièces du dossier', detail: `${check.length} pièce(s) à vérifier`, state: 'warn' } : { label: 'Pièces du dossier', detail: 'Toutes les pièces vérifiées', state: 'ok' })
  }
  out.push(d.validatedAt ? { label: 'Relecture humaine', detail: `Validé le ${new Date(d.validatedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`, state: 'ok' } : { label: 'Relecture humaine', detail: 'En attente de votre validation', state: 'warn' })
  return out
}

/** Différence par paragraphe entre deux versions (objet inclus). */
export function diffOf(a: Pick<Snapshot, 'subject' | 'body'>, b: Pick<Snapshot, 'subject' | 'body'>): { del?: string; ins?: string }[] {
  const A = [...(a.subject ? [`Objet : ${a.subject}`] : []), ...a.body], B = [...(b.subject ? [`Objet : ${b.subject}`] : []), ...b.body]
  const out: { del?: string; ins?: string }[] = []
  // ponytail: comparaison par appartenance, suffisante pour des documents de quelques paragraphes
  A.filter((x) => !B.includes(x)).forEach((x) => out.push({ del: x }))
  B.filter((x) => !A.includes(x)).forEach((x) => out.push({ ins: x }))
  return out
}
