// Grille tarifaire (fixée par la stratégie) — partagée par la page /tarifs et Réglages › Facturation.
// Les montants facturés font foi côté Stripe ; ces valeurs servent à l’affichage.
export type PlanKey = 'decouverte' | 'solo' | 'agence'

export const PLANS: { id: PlanKey; name: string; price: string; unit: string; yearly?: string; dossiers: string; seats: string; pitch: string; features: string[] }[] = [
  { id: 'decouverte', name: 'Découverte', price: '0', unit: '€ à vie', dossiers: '1 dossier actif', seats: '1 utilisateur', pitch: 'Pour essayer sur un vrai mandat, sans limite de durée.',
    features: ['Brief de rendez-vous et débrief', 'Compte rendu, estimation et relances prêts à relire', 'Temps gagné mesuré', 'Import CSV depuis votre CRM'] },
  { id: 'solo', name: 'Solo', price: '9,90', unit: '€ / mois', yearly: '99 € / an', dossiers: '20 dossiers actifs', seats: '1 utilisateur', pitch: 'Pour le conseiller indépendant.',
    features: ['Tout Découverte', '20 dossiers vendeurs en parallèle', 'Rappels et relances automatiques', 'Conformité et veille légale FR / PT'] },
  { id: 'agence', name: 'Agence', price: '49', unit: '€ / mois', dossiers: 'Dossiers illimités', seats: 'Jusqu’à 7 conseillers, puis 6 € / siège', pitch: 'Pour l’agence et son équipe.',
    features: ['Tout Solo', 'Dossiers actifs illimités', 'Invitations des conseillers par lien', 'Données séparées par agence'] },
]

export const PLAN_OPTIONS: { id: 'preuves' | 'donnees'; name: string; price: string; desc: string }[] = [
  { id: 'preuves', name: 'Pack Preuves', price: '+6 € / mois', desc: 'Journal de preuves exportable : validations, envois, consentements, contrôles de conformité.' },
  { id: 'donnees', name: 'Données marché', price: '+9 € / mois', desc: 'Références de prix et tendances par quartier pour étayer vos estimations.' },
]

export const COMMITMENTS = ['Sans engagement', '15 jours remboursés', 'Résiliation en un clic', 'Garantie « 2 h gagnées ou mois remboursé »']

/* ——— Tarifs modifiables dans le back-office ———
 * Le serveur (mode comptes) publie /api/public/plans : prix, limites et visibilité réglés par l’équipe Jaspe.
 * Les valeurs ci-dessus restent la référence hors ligne (démo statique, serveur de démonstration). */
type ServerPlan = { label?: string; price?: number; priceYear?: number; dossiers?: number | null; seats?: number; seatPrice?: number; visible?: boolean }
const fr = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })
const DEFAULT_PLANS = PLANS.map((p) => ({ ...p }))
const listeners = new Set<() => void>()
let version = 0
export function applyServerPlans(json: { plans?: Record<string, ServerPlan>; options?: Record<string, { label?: string; price?: number }> }) {
  if (!json?.plans) return
  const next = DEFAULT_PLANS.filter((d) => json.plans![d.id]).map((d) => {
    const s = json.plans![d.id]
    const dossiers = s.dossiers === null ? 'Dossiers illimités' : typeof s.dossiers === 'number' ? `${s.dossiers} dossier${s.dossiers > 1 ? 's' : ''} actif${s.dossiers > 1 ? 's' : ''}` : d.dossiers
    return {
      ...d,
      name: s.label ?? d.name,
      price: typeof s.price === 'number' ? fr(s.price) : d.price,
      yearly: typeof s.priceYear === 'number' && s.priceYear > 0 ? `${fr(s.priceYear)} € / an` : d.yearly,
      dossiers,
      seats: d.id === 'agence' && typeof s.seats === 'number' ? `Jusqu’à ${s.seats} conseillers${typeof s.seatPrice === 'number' ? `, puis ${fr(s.seatPrice)} € / siège` : ''}` : d.seats,
      features: d.features.map((f) => f.replace(/^\d+ dossiers vendeurs/, typeof s.dossiers === 'number' ? `${s.dossiers} dossiers vendeurs` : '$&')),
    }
  })
  PLANS.splice(0, PLANS.length, ...next)
  for (const o of PLAN_OPTIONS) { const s = json.options?.[o.id]; if (s?.price !== undefined) o.price = `+${fr(s.price)} € / mois`; if (s?.label) o.name = s.label }
  version++
  listeners.forEach((f) => f())
}
/** Re-rendu quand les tarifs du serveur arrivent (page Tarifs, Facturation). */
export const subscribePlans = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f) } }
export const plansVersion = () => version
if (typeof window !== 'undefined' && import.meta.env.VITE_STATIC !== '1') {
  fetch('/api/public/plans').then((r) => (r.ok ? r.json() : null)).then((j) => j && applyServerPlans(j)).catch(() => { /* démo ou hors ligne : grille par défaut */ })
}
