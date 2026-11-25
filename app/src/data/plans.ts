// Grille tarifaire (fixée par la stratégie) — partagée par la page /tarifs et Réglages › Facturation.
// Les montants facturés font foi côté Stripe ; ces valeurs servent à l’affichage.
export type PlanKey = 'decouverte' | 'solo' | 'agence'

export const PLANS: { id: PlanKey; name: string; price: string; unit: string; yearly?: string; dossiers: string; seats: string; pitch: string; features: string[] }[] = [
  { id: 'decouverte', name: 'Découverte', price: '0', unit: '€ à vie', dossiers: '1 dossier actif', seats: '1 utilisateur', pitch: 'Pour essayer sur un vrai mandat, sans limite de durée.',
    features: ['Brief de rendez-vous et débrief', 'Les 9 livrables à relire et valider', 'Temps gagné mesuré', 'Import CSV depuis votre CRM'] },
  { id: 'solo', name: 'Solo', price: '9,90', unit: '€ / mois', yearly: '99 € / an', dossiers: '8 dossiers actifs', seats: '1 utilisateur', pitch: 'Pour le conseiller indépendant.',
    features: ['Tout Découverte', '8 dossiers vendeurs en parallèle', 'Rappels et relances automatiques', 'Conformité et veille légale FR / PT'] },
  { id: 'agence', name: 'Agence', price: '49', unit: '€ / mois', dossiers: 'Dossiers illimités', seats: 'Jusqu’à 7 conseillers, puis 6 € / siège', pitch: 'Pour l’agence et son équipe.',
    features: ['Tout Solo', 'Dossiers actifs illimités', 'Invitations des conseillers par lien', 'Données séparées par agence'] },
]

export const PLAN_OPTIONS: { id: 'preuves' | 'donnees'; name: string; price: string; desc: string }[] = [
  { id: 'preuves', name: 'Pack Preuves', price: '+6 € / mois', desc: 'Journal de preuves exportable : validations, envois, consentements, contrôles de conformité.' },
  { id: 'donnees', name: 'Données marché', price: '+9 € / mois', desc: 'Références de prix et tendances par quartier pour étayer vos estimations.' },
]

export const COMMITMENTS = ['Sans engagement', '15 jours remboursés', 'Résiliation en un clic', 'Garantie « 2 h gagnées ou mois remboursé »']
