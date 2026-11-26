import { PROPERTIES, me as DEMO_ME, type Property, type Buyer } from '../../data/mock'
import { ZONES, WISHES, dist } from '../../data/geo'
import { useMe } from '../../data/store'

/** Bien tel que stocké : un bien importé ou saisi peut n’avoir ni adresse, ni année, ni photo, ni estimation. */
export type LooseProperty = Partial<Property> & Pick<Property, 'id' | 'title'> & {
  importedFrom?: { source?: string; file?: string; at?: string; ref?: string | null }
  status?: string
}

const IMPORT_LABEL: Record<string, string> = { ego: 'eGO', hektor: 'Hektor' }

/** Bien de démonstration (jeu de données seedé, hors mode comptes) : ses sources fictives restent affichées telles quelles. */
export const isDemoProperty = (p: LooseProperty, mode?: string) => mode !== 'auth' && !p.importedFrom && PROPERTIES.some((x) => x.id === p.id)

/** Seule provenance vraie d’un champ de la fiche : l’import d’origine, sinon la saisie du conseiller. */
export const originLabel = (p: LooseProperty) => (p.importedFrom ? `Import ${IMPORT_LABEL[p.importedFrom.source ?? ''] ?? 'CSV'}` : 'Saisi par le conseiller')

/** Badge de source d’un fait : libellé historique pour la démo, provenance réelle sinon. */
export const factSource = (p: LooseProperty, demo: boolean, demoLabel: string) => (demo ? demoLabel : originLabel(p))

/** Joint les parties non vides (adresse, ville…). */
export const joinParts = (...xs: (string | undefined | null)[]) => xs.map((x) => x?.trim()).filter(Boolean).join(', ')

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0

/** Fourchette d’estimation exploitable, ou `null` si rien ne permet d’en afficher une. */
export function estimateRange(p: LooseProperty, docRange?: [number, number]): [number, number] | null {
  if (docRange && finite(docRange[0]) && finite(docRange[1])) return docRange
  if (finite(p.estimateLow) && finite(p.estimateHigh)) return [p.estimateLow, p.estimateHigh]
  return null
}

/** Nom de l’utilisateur courant : compte connecté, sinon le conseiller de démonstration. */
export function useCurrentUserName(): string | null {
  const m = useMe()
  if (m?.mode === 'auth') return m.user.name
  if (m === null) return null
  return DEMO_ME.name
}
export const useMeMode = () => useMe()?.mode

type B = Buyer & { wishes?: string[] }
/**
 * Score acquéreur ↔ bien, même barème que la page Acquéreurs (90 pts de critères durs + 10 pts de souhaits).
 * ponytail: dupliqué de pages/Acquereurs.tsx (non exporté) ; à factoriser dans data/ si la règle évolue.
 */
export function buyerScore(b: B, p: LooseProperty): number {
  const price = p.price ?? 0, surface = p.surface ?? 0, district = p.district ?? '', city = p.city ?? ''
  const inZone = (b.zones ?? []).some((z) => z === district || z === city || (ZONES[z] && p.lng != null && p.lat != null && dist(ZONES[z].c, [p.lng, p.lat]) <= ZONES[z].r * 1.25))
  const typeOk = b.type === p.type || (b.type !== 'Appartement' && p.type !== 'Appartement')
  const hay = ((p.features ?? []).join(' ') + ' ' + p.title).toLowerCase()
  const wishes = (b.wishes ?? WISHES[b.id] ?? []).map((w) => hay.includes(w.toLowerCase()))
  const ok = [price >= b.budget[0] * 0.85 && price <= b.budget[1] * 1.05, inZone, typeOk, surface > 0 && surface >= b.surface * 0.95]
  const base = ok.reduce((s, c, i) => s + (c ? [30, 25, 20, 15][i] : 0), 0)
  const extra = wishes.length ? (wishes.filter(Boolean).length / wishes.length) * 10 : 10
  return Math.round(base + extra)
}
export const matchBuyers = (buyers: B[], p: LooseProperty, min = 60) =>
  buyers.map((b) => ({ b, score: buyerScore(b, p) })).filter((m) => m.score >= min).sort((x, y) => y.score - x.score)
