// Modèle enrichi du dossier vendeur — champs stockés sur le document `dossiers` (clé `journey`).
// Source métier : cahier des charges Parcours vendeur V2 (D1 → L9), guide d’entretien D5, dossiers techniques.

export type Origin = 'déclaré' | 'vérifié' | 'pièce' | 'copilote' | 'à confirmer'
export type FieldVal = { v: string; origin?: Origin }

/** Guide d’entretien découverte D5 — 5 blocs. */
export const DISCOVERY_BLOCKS = [
  { id: 'projet', label: 'Projet & contact', fields: [
    ['motivation', 'Motivation de la vente'], ['horizon', 'Horizon / date souhaitée'], ['decideurs', 'Décideurs et accord'], ['projetSuivant', 'Projet suivant (achat, location…)'],
    ['prixSouhaite', 'Prix souhaité par le vendeur'], ['experience', 'Expériences passées avec des agences'], ['contactPref', 'Préférence de contact'], ['craintes', 'Craintes exprimées'],
  ] },
  { id: 'bien', label: 'Le bien', fields: [
    ['surface', 'Surface habitable (m²)'], ['terrain', 'Terrain (m²)'], ['pieces', 'Pièces / chambres'], ['annee', 'Année de construction'], ['etat', 'État général'],
    ['travaux', 'Travaux réalisés (dates, factures)'], ['equipements', 'Équipements (piscine, domotique…)'], ['dpe', 'DPE / GES'], ['exposition', 'Exposition / vue'], ['stationnement', 'Stationnement'],
  ] },
  { id: 'environnement', label: 'Commodités & environnement', fields: [
    ['transports', 'Transports'], ['ecoles', 'Écoles'], ['commerces', 'Commerces'], ['plage', 'Plage / loisirs'], ['nuisances', 'Nuisances éventuelles'],
  ] },
  { id: 'copro', label: 'Copropriété & quartier', fields: [
    ['regime', 'Régime (copro, ASL, pleine propriété)'], ['charges', 'Charges annuelles'], ['taxeFonciere', 'Taxe foncière'], ['travauxVotes', 'Travaux votés / à venir'], ['syndic', 'Syndic / gestionnaire'], ['projetsQuartier', 'Projets du quartier connus'],
  ] },
  { id: 'atouts', label: 'Atouts & vigilances', fields: [
    ['atouts', 'Atouts à mettre en avant'], ['vigilances', 'Points de vigilance'], ['objections', 'Objections probables des acquéreurs'], ['strategie', 'Stratégie de prix évoquée'],
  ] },
] as const

export type MandateInfo = {
  type: 'Exclusif' | 'Semi-exclusif' | 'Simple' | ''; price: number; feesPct: number; feesPayer: 'acquéreur' | 'vendeur'; duration: number
  start?: string; signature: 'à préparer' | 'envoyé' | 'signé'; registry?: string; mentions: { dpe: boolean; fees: boolean; surface: boolean; risks: boolean }; notes?: string
}
export type Visit = { id: string; date: string; buyer: string; agent: string; feedback?: string; interest: 1 | 2 | 3 | 4 | 5; objections?: string; followUp?: string }
export type SellerReport = { id: string; label: 'J+7' | 'J+21' | 'J+42' | 'Hebdo'; date: string; views: number; contacts: number; visits: number; summary: string; sent: boolean }
export type Offer = { id: string; date: string; buyer: string; amount: number; conditions: string; financing: 'comptant' | 'prêt' | 'mixte'; expires: string; status: 'reçue' | 'contre-offre' | 'acceptée' | 'refusée' | 'expirée'; counter?: number }
export type Closing = { compromisDate?: string; notary?: string; sruEnd?: string; loanDeadline?: string; acteDate?: string; deposit?: number; checklist: { label: string; done: boolean }[] }
export type AfterSale = { thanksSent: boolean; review?: number; reviewText?: string; referral?: string; keysHanded?: boolean; archive?: boolean; anniversary?: string }

export type Journey = {
  discovery: Record<string, FieldVal>; debrief?: { transcript: string; duration: string; validated: boolean }
  photos?: string[]; coaching?: { score: number; objections: string[] }
  mandate: MandateInfo; diffusion: { portals: Record<string, 'publiée' | 'en attente' | 'retirée' | 'off'>; shooting?: string; visit3d?: boolean; startedAt?: string }
  visits: Visit[]; reports: SellerReport[]; offers: Offer[]; closing: Closing; afterSale: AfterSale
  /** Préparation du RDV (check-list D4, identité confirmée) et classement des photos par pièce. */
  prep?: { checklist?: { label: string; done: boolean }[]; identityConfirmed?: boolean } & Record<string, unknown>
  photoRooms?: Record<string, string>
}

const fv = (v: string, origin: Origin = 'déclaré'): FieldVal => ({ v, origin })
const CLOSING_CHECKLIST = ['Compromis signé', 'Fin du délai de rétractation SRU (10 j)', 'Purge du droit de préemption (DIA)', 'Accord de prêt', 'Pré-état daté / documents copro', 'Diagnostics à jour', 'Fonds sur compte séquestre', 'Projet d’acte relu', 'Acte authentique signé', 'Remise des clés']

export function emptyJourney(): Journey {
  return {
    discovery: {}, mandate: { type: '', price: 0, feesPct: 4, feesPayer: 'vendeur', duration: 3, signature: 'à préparer', mentions: { dpe: false, fees: false, surface: false, risks: false } },
    diffusion: { portals: {} }, visits: [], reports: [], offers: [], closing: { checklist: CLOSING_CHECKLIST.map((label) => ({ label, done: false })) }, afterSale: { thanksSent: false },
  }
}

/** Amorce riche pour la démonstration : dossier Martin (d1) complet, les autres cohérents avec leur étape. */
export const JOURNEYS: Record<string, Journey> = {
  d1: {
    ...emptyJourney(),
    discovery: {
      motivation: fv('Retraite en Bretagne (Saint-Malo), vente avant l’été 2027'), horizon: fv('3 à 5 mois'), decideurs: fv('Hélène et Pierre Martin — accord commun'), projetSuivant: fv('Achat d’une maison à Saint-Malo, budget 900 k€'),
      prixSouhaite: fv('5,2 M€, ouvert à discussion'), experience: fv('Déçus par une agence en 2019 : aucun compte rendu de visite'), contactPref: fv('E-mail, pas avant 10 h ; visio possible'), craintes: fv('Visites non qualifiées, curieux'),
      surface: fv('286', 'pièce'), terrain: fv('1 840', 'pièce'), pieces: fv('7 pièces · 5 chambres'), annee: fv('2019', 'pièce'), etat: fv('Excellent, prestations haut de gamme'),
      travaux: fv('Pool-house 2022 (factures fournies)'), equipements: fv('Piscine à débordement, domotique, climatisation réversible'), dpe: fv('B · 74 kWh/m²/an', 'pièce'), exposition: fv('Sud-ouest, vue mer panoramique'), stationnement: fv('Garage double + 3 places'),
      transports: fv('Bus 2 · gare d’Antibes à 10 min'), ecoles: fv('Collège International à 12 min'), commerces: fv('Juan-les-Pins à 6 min'), plage: fv('Plage de la Garoupe à 700 m'), nuisances: fv('Aucune signalée', 'à confirmer'),
      regime: fv('Pleine propriété + ASL du lotissement'), charges: fv('1 200 €/an (ASL)'), taxeFonciere: fv('6 840 €', 'pièce'), travauxVotes: fv('Réfection voirie ASL 2027 (quote-part 4 k€)', 'à confirmer'), syndic: fv('ASL des Nielles'), projetsQuartier: fv('Aucun projet d’urbanisme majeur au PLU', 'copilote'),
      atouts: fv('Vue mer, calme absolu, construction récente, DPE B'), vigilances: fv('PV d’AG ASL manquant ; prix souhaité au-dessus du haut de fourchette'), objections: fv('Prix au m², entretien du jardin'), strategie: fv('Prix d’appel 4,95 M€, exclusivité 3 mois'),
    },
    debrief: { transcript: 'Ils veulent être installés à Saint-Malo pour la rentrée. Exclusivité possible si on présente un plan de commercialisation solide — ils ont été déçus par une agence en 2019. Pool-house refait en 2022, factures disponibles. Attention au prix : ils ont 5,2 en tête.', duration: '01:48', validated: true },
    photos: ['/img/villa-pool.webp', '/img/int-living.webp', '/img/int-dining.webp', '/img/int-bedroom.webp'],
    coaching: { score: 82, objections: ['Honoraires trop élevés', 'Pourquoi l’exclusivité ?', 'Le voisin a vendu plus cher'] },
    mandate: { type: 'Exclusif', price: 4950000, feesPct: 4, feesPayer: 'vendeur', duration: 3, signature: 'à préparer', mentions: { dpe: true, fees: true, surface: true, risks: false }, notes: 'Exclusivité acceptée sous réserve du plan de commercialisation (L6).' },
  },
  d3: {
    ...emptyJourney(),
    discovery: { motivation: fv('Achat d’une résidence à Paris'), horizon: fv('2 mois'), decideurs: fv('Mme Ricci seule'), surface: fv('148', 'pièce'), dpe: fv('C', 'pièce'), atouts: fv('Toit-terrasse 90 m², plage à 50 m') },
    mandate: { type: 'Exclusif', price: 1890000, feesPct: 4.5, feesPayer: 'acquéreur', duration: 3, start: '2026-09-20', signature: 'signé', registry: 'Registre n° 2026-188', mentions: { dpe: true, fees: true, surface: true, risks: true } },
    diffusion: { portals: { SeLoger: 'publiée', Leboncoin: 'publiée', 'Bien’ici': 'publiée', 'Belles Demeures': 'publiée', 'Figaro Prestige': 'en attente' }, shooting: '2026-09-22', visit3d: true, startedAt: '2026-09-23' },
    visits: [
      { id: 'v1', date: '2026-09-28', buyer: 'M. & Mme Verdier', agent: 'Sofia Benali', feedback: 'Coup de cœur pour la terrasse, cuisine à rafraîchir', interest: 5, objections: 'Cuisine', followUp: 'Deuxième visite' },
      { id: 'v2', date: '2026-10-02', buyer: 'M. Achour', agent: 'Sofia Benali', feedback: 'Trop grand pour leur besoin', interest: 2 },
      { id: 'v3', date: '2026-10-07', buyer: 'Mme Laval', agent: 'Sofia Benali', feedback: 'Intéressée, attend la vente de son bien', interest: 3, followUp: 'Relance dans 15 jours' },
    ],
    reports: [
      { id: 'r1', label: 'J+7', date: '2026-09-30', views: 1840, contacts: 22, visits: 1, summary: 'Démarrage fort sur Belles Demeures, 1 visite qualifiée.', sent: true },
      { id: 'r2', label: 'J+21', date: '2026-10-14', views: 4120, contacts: 41, visits: 3, summary: '3 visites, 1 acquéreur très intéressé (2e visite planifiée).', sent: false },
    ],
  },
  d4: {
    ...emptyJourney(),
    mandate: { type: 'Exclusif', price: 1640000, feesPct: 4, feesPayer: 'vendeur', duration: 3, start: '2026-08-30', signature: 'signé', registry: 'Registre n° 2026-161', mentions: { dpe: true, fees: true, surface: true, risks: true } },
    diffusion: { portals: { SeLoger: 'publiée', Leboncoin: 'publiée', 'Bien’ici': 'publiée' }, startedAt: '2026-09-02' },
    visits: [{ id: 'v1', date: '2026-10-04', buyer: 'Mme Okafor', agent: 'Paul Garnier', feedback: 'Très intéressée, revient avec son mari', interest: 5 }, { id: 'v2', date: '2026-10-11', buyer: 'Mme Okafor (contre-visite)', agent: 'Paul Garnier', feedback: 'Offre annoncée', interest: 5 }],
    offers: [{ id: 'o1', date: '2026-10-10', buyer: 'Mme Okafor', amount: 1550000, conditions: 'Prêt 70 %, meubles de jardin inclus', financing: 'prêt', expires: '2026-10-12T18:00', status: 'contre-offre', counter: 1590000 }],
  },
  d5: {
    ...emptyJourney(),
    discovery: { motivation: fv('Agrandissement de la famille'), horizon: fv('4 mois'), surface: fv('240', 'pièce'), dpe: fv('C', 'pièce'), atouts: fv('Jacuzzi, cuisine d’été, vue collines') },
    mandate: { type: 'Semi-exclusif', price: 2750000, feesPct: 4, feesPayer: 'vendeur', duration: 3, start: '2026-10-08', signature: 'signé', registry: 'Registre n° 2026-201', mentions: { dpe: true, fees: true, surface: true, risks: true } },
    diffusion: { portals: { SeLoger: 'en attente', 'Belles Demeures': 'en attente' }, shooting: '2026-10-13' },
  },
  d11: {
    ...emptyJourney(),
    mandate: { type: 'Exclusif', price: 3890000, feesPct: 4, feesPayer: 'vendeur', duration: 3, start: '2026-09-15', signature: 'signé', registry: 'Registre n° 2026-176', mentions: { dpe: true, fees: true, surface: true, risks: true }, notes: 'Off-market : 3 visites privées maximum.' },
    diffusion: { portals: { SeLoger: 'off', 'Belles Demeures': 'off' }, visit3d: true, startedAt: '2026-09-18' },
    visits: [{ id: 'v1', date: '2026-09-29', buyer: 'Family Office Lindqvist (visio)', agent: 'Marc Olivieri', feedback: 'Demande une visite privée', interest: 4, followUp: 'Visite privée mardi' }],
  },
  d12: {
    ...emptyJourney(),
    mandate: { type: 'Exclusif', price: 1720000, feesPct: 4, feesPayer: 'vendeur', duration: 3, start: '2026-10-05', signature: 'signé', registry: 'Registre n° 2026-197', mentions: { dpe: true, fees: true, surface: true, risks: true } },
    diffusion: { portals: { SeLoger: 'en attente', Leboncoin: 'en attente', 'Bien’ici': 'en attente' }, visit3d: true },
  },
  d6: {
    ...emptyJourney(),
    mandate: { type: 'Simple', price: 985000, feesPct: 5, feesPayer: 'acquéreur', duration: 3, start: '2026-07-01', signature: 'signé', mentions: { dpe: true, fees: true, surface: true, risks: true } },
    offers: [{ id: 'o1', date: '2026-09-01', buyer: 'M. & Mme Lopez', amount: 960000, conditions: 'Prêt 80 %', financing: 'prêt', expires: '2026-09-04', status: 'acceptée' }],
    closing: { compromisDate: '2026-09-12', notary: 'Me Faure', sruEnd: '2026-09-23', loanDeadline: '2026-10-24', acteDate: '2026-11-28', deposit: 48000, checklist: CLOSING_CHECKLIST.map((label, i) => ({ label, done: i < 3 })) },
  },
  d8: {
    ...emptyJourney(),
    mandate: { type: 'Exclusif', price: 1290000, feesPct: 4, feesPayer: 'vendeur', duration: 3, signature: 'signé', mentions: { dpe: true, fees: true, surface: true, risks: true } },
    closing: { compromisDate: '2026-08-18', notary: 'Me Lenoir', sruEnd: '2026-08-29', loanDeadline: '2026-10-03', acteDate: '2026-10-21', deposit: 62750, checklist: CLOSING_CHECKLIST.map((label, i) => ({ label, done: i < 8 })) },
    afterSale: { thanksSent: false, anniversary: '2027-10-21' },
  },
}

export const journeyOf = (d: { id: string; journey?: Journey }): Journey => ({ ...emptyJourney(), ...(JOURNEYS[d.id] ?? {}), ...(d.journey ?? {}) })
