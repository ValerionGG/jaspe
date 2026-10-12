import { live } from './live'
// Données de démonstration — synthétiques, aucune personne réelle.
export const img = (n: string) => `/img/${n}.webp`

export type Stage = 'prep' | 'rdv' | 'post' | 'mandat' | 'commercial' | 'offre' | 'compromis' | 'acte'
export const STAGES: { id: Stage; label: string; short: string }[] = [
  { id: 'prep', label: 'Préparation RDV', short: 'Prépa' },
  { id: 'rdv', label: 'Découverte', short: 'D5' },
  { id: 'post', label: 'Post-RDV · livrables', short: 'L1–L9' },
  { id: 'mandat', label: 'Mandat signé', short: 'Mandat' },
  { id: 'commercial', label: 'Commercialisation', short: 'Diffusion' },
  { id: 'offre', label: 'Offre reçue', short: 'Offre' },
  { id: 'compromis', label: 'Compromis', short: 'Compromis' },
  { id: 'acte', label: 'Acte authentique', short: 'Acte' },
]

export type Agent = { id: string; name: string; role: string; agency: string; photo: string; mandats: number; ca: number; score: number }
export const AGENTS: Agent[] = [
  { id: 'a1', name: 'Claire Delmas', role: 'Conseillère senior', agency: 'Antibes Vieille-Ville', photo: img('p-claire'), mandats: 14, ca: 412000, score: 94 },
  { id: 'a2', name: 'Marc Olivieri', role: 'Directeur d’agence', agency: 'Antibes Vieille-Ville', photo: img('p-marc'), mandats: 9, ca: 368000, score: 88 },
  { id: 'a3', name: 'Sofia Benali', role: 'Conseillère', agency: 'Juan-les-Pins', photo: img('p-sofia'), mandats: 11, ca: 296000, score: 91 },
  { id: 'a4', name: 'Julien Arnaud', role: 'Conseiller', agency: 'Cap d’Antibes', photo: img('p-julien'), mandats: 7, ca: 254000, score: 79 },
  { id: 'a5', name: 'Inès Morel', role: 'Coordinatrice transaction', agency: 'Juan-les-Pins', photo: img('p-ines'), mandats: 0, ca: 0, score: 96 },
  { id: 'a6', name: 'Léa Fontaine', role: 'Marketing réseau', agency: 'Siège · Sophia', photo: img('p-lea'), mandats: 0, ca: 0, score: 90 },
  { id: 'a7', name: 'Paul Garnier', role: 'Conseiller', agency: 'Biot · Valbonne', photo: img('p-paul'), mandats: 6, ca: 198000, score: 72 },
  { id: 'a8', name: 'Thomas Rey', role: 'Directeur réseau', agency: 'Siège · Sophia', photo: img('p-thomas'), mandats: 0, ca: 0, score: 0 },
]
export const me = AGENTS[0]

export type DelivState = 'done' | 'review' | 'running' | 'waiting' | 'blocked'
export const DELIVERABLES = [
  { code: 'D1', name: 'Brief relationnel', group: 'avant' },
  { code: 'D2', name: 'Marché & comparables', group: 'avant' },
  { code: 'D3', name: 'Radar quartier', group: 'avant' },
  { code: 'D4', name: 'Simulation coaching', group: 'avant' },
  { code: 'D5', name: 'Découverte vendeur', group: 'pendant' },
  { code: 'L1', name: 'Mail de remerciement', group: 'apres' },
  { code: 'L2', name: 'Synthèse équipe', group: 'apres' },
  { code: 'L3', name: 'Avant-première acquéreurs', group: 'apres' },
  { code: 'L4', name: 'Kit réseaux sociaux', group: 'apres' },
  { code: 'L5', name: 'Courrier voisinage', group: 'apres' },
  { code: 'L6', name: 'Book de services', group: 'apres' },
  { code: 'L7', name: 'Analyse & estimation', group: 'apres' },
  { code: 'L8', name: 'Avant / après', group: 'apres' },
  { code: 'L9', name: 'Dossier copro & diagnostics', group: 'apres' },
] as const

export type Property = {
  id: string; title: string; type: string; address: string; district: string; city: string
  surface: number; rooms: number; land?: number; price: number; estimateLow: number; estimateHigh: number
  dpe: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'; photo: string; gallery: string[]; lat: number; lng: number
  features: string[]; year: number
}
export const PROPERTIES: Property[] = [
  { id: 'p1', title: 'Villa contemporaine vue mer', type: 'Villa', address: '14 chemin des Nielles', district: 'Cap d’Antibes', city: 'Antibes', surface: 286, rooms: 7, land: 1840, price: 4950000, estimateLow: 4600000, estimateHigh: 5150000, dpe: 'B', photo: img('villa-pool'), gallery: [img('villa-pool'), img('window-sea'), img('int-marble'), img('kitchen-marble'), img('bedroom-arch'), img('terrace-sea')], lat: 43.548, lng: 7.121, features: ['Piscine à débordement', 'Vue mer panoramique', 'Domotique', 'Pool-house'], year: 2019 },
  { id: 'p2', title: 'Bastide provençale restaurée', type: 'Maison', address: '3 avenue de la Salis', district: 'La Salis', city: 'Antibes', surface: 214, rooms: 6, land: 1100, price: 2390000, estimateLow: 2250000, estimateHigh: 2480000, dpe: 'C', photo: img('provence-house'), gallery: [img('provence-house'), img('villa-night'), img('provence-door'), img('int-salon'), img('kitchen-white'), img('stone-ivy')], lat: 43.5696, lng: 7.1228, features: ['Piscine', 'Oliviers centenaires', 'Garage double'], year: 1932 },
  { id: 'p3', title: 'Penthouse front de mer', type: 'Appartement', address: '22 boulevard Baudoin', district: 'Juan-les-Pins', city: 'Antibes', surface: 148, rooms: 4, price: 1890000, estimateLow: 1780000, estimateHigh: 1960000, dpe: 'C', photo: img('terrace-sea'), gallery: [img('terrace-sea'), img('balcony-breakfast'), img('int-luxe'), img('bedroom-modern'), img('bay-boat')], lat: 43.5675, lng: 7.1133, features: ['Toit-terrasse 90 m²', 'Ascenseur privatif', 'Plage à 50 m'], year: 2008 },
  { id: 'p4', title: 'Maison d’architecte', type: 'Maison', address: '8 impasse des Pins', district: 'Biot', city: 'Biot', surface: 192, rooms: 5, land: 950, price: 1640000, estimateLow: 1520000, estimateHigh: 1700000, dpe: 'A', photo: img('house-dusk'), gallery: [img('house-dusk'), img('int-loft'), img('int-art'), img('kitchen-dark')], lat: 43.628, lng: 7.096, features: ['Bois & béton brut', 'Panneaux solaires', 'Jardin paysager'], year: 2021 },
  { id: 'p5', title: 'Villa néo-provençale', type: 'Villa', address: '41 route de Grasse', district: 'Les Combes', city: 'Antibes', surface: 240, rooms: 6, land: 1500, price: 2750000, estimateLow: 2600000, estimateHigh: 2900000, dpe: 'C', photo: img('villa-sunset'), gallery: [img('villa-sunset'), img('villa-arcades'), img('int-family'), img('bedroom-classic'), img('garden-stairs')], lat: 43.589, lng: 7.104, features: ['Jacuzzi', 'Cuisine d’été', 'Vue collines'], year: 2004 },
  { id: 'p6', title: 'Appartement Belle Époque', type: 'Appartement', address: '5 place Masséna', district: 'Vieil Antibes', city: 'Antibes', surface: 112, rooms: 4, price: 985000, estimateLow: 920000, estimateHigh: 1020000, dpe: 'D', photo: img('riviera-facade'), gallery: [img('riviera-facade'), img('antibes-street'), img('int-salon'), img('bedroom-classic'), img('antibes-ramparts')], lat: 43.581, lng: 7.127, features: ['Moulures', 'Parquet point de Hongrie', 'Vue remparts'], year: 1908 },
  { id: 'p7', title: 'Villa moderne & piscine', type: 'Villa', address: '17 allée des Mimosas', district: 'Super Antibes', city: 'Antibes', surface: 205, rooms: 6, land: 1200, price: 2180000, estimateLow: 2050000, estimateHigh: 2300000, dpe: 'B', photo: img('villa-modern'), gallery: [img('villa-modern'), img('villa-dusk-pool'), img('int-living'), img('kitchen-marble')], lat: 43.596, lng: 7.112, features: ['Piscine chauffée', 'Climatisation', 'Garage'], year: 2016 },
  { id: 'p8', title: 'Maison contemporaine bois', type: 'Maison', address: '2 chemin du Valbosquet', district: 'Valbonne', city: 'Valbonne', surface: 168, rooms: 5, land: 800, price: 1290000, estimateLow: 1200000, estimateHigh: 1350000, dpe: 'A', photo: img('house-wood'), gallery: [img('house-wood'), img('int-loft'), img('kitchen-white'), img('hills-view')], lat: 43.641, lng: 7.009, features: ['Ossature bois', 'Pompe à chaleur', 'Proche écoles'], year: 2020 },
  { id: 'p9', title: 'Villa toit-terrasse & palmiers', type: 'Villa', address: '9 avenue du Grand Pin', district: 'Juan-les-Pins', city: 'Antibes', surface: 230, rooms: 6, land: 900, price: 3150000, estimateLow: 2950000, estimateHigh: 3300000, dpe: 'B', photo: img('riviera-villa-sea'), gallery: [img('riviera-villa-sea'), img('pool-sea'), img('int-glass'), img('bedroom-arch'), img('bougainvillea')], lat: 43.5694, lng: 7.1066, features: ['Toit-terrasse', 'Piscine', 'Plage à pied'], year: 2018 },
  { id: 'p10', title: 'Maison familiale & jardin', type: 'Maison', address: '27 chemin de Saint-Claude', district: 'Saint-Claude', city: 'Antibes', surface: 176, rooms: 6, land: 1050, price: 1480000, estimateLow: 1390000, estimateHigh: 1540000, dpe: 'C', photo: img('house-pool'), gallery: [img('house-pool'), img('int-family'), img('garden-stairs'), img('kitchen-white')], lat: 43.594, lng: 7.118, features: ['Piscine', 'Proche écoles', 'Garage'], year: 1998 },
  { id: 'p11', title: 'Villa blanche minimaliste', type: 'Villa', address: '6 boulevard de la Garoupe', district: 'Cap d’Antibes', city: 'Antibes', surface: 260, rooms: 6, land: 1600, price: 3890000, estimateLow: 3700000, estimateHigh: 4050000, dpe: 'B', photo: img('villa-sculpture'), gallery: [img('villa-sculpture'), img('villa-infinity'), img('int-art'), img('window-sea'), img('cap-villa-rocks')], lat: 43.556, lng: 7.131, features: ['Architecte', 'Vue mer partielle', 'Calme absolu'], year: 2015 },
  { id: 'p12', title: 'Maison contemporaine nocturne', type: 'Maison', address: '12 route de Biot', district: 'Les Semboules', city: 'Antibes', surface: 198, rooms: 5, land: 1000, price: 1720000, estimateLow: 1620000, estimateHigh: 1790000, dpe: 'A', photo: img('house-dusk2'), gallery: [img('house-dusk2'), img('int-marble'), img('bedroom-modern'), img('kitchen-dark')], lat: 43.612, lng: 7.088, features: ['Bardage bois', 'Domotique', 'Bureau indépendant'], year: 2022 },
]

export type Dossier = {
  id: string; ref: string; seller: string; sellerPhoto?: string; propertyId: string; agentId: string; stage: Stage
  next: string; due: string; heat: 1 | 2 | 3; progress: number; mandate?: 'Exclusif' | 'Simple' | 'Semi-exclusif'
  deliverables: Record<string, DelivState>; motivation: string; timeline: string; tags: string[]
}
const all = (s: DelivState) => Object.fromEntries(DELIVERABLES.map((d) => [d.code, s])) as Record<string, DelivState>
export const DOSSIERS: Dossier[] = [
  { id: 'd1', ref: 'VND-2026-0412', seller: 'Famille Martin', propertyId: 'p1', agentId: 'a1', stage: 'post', next: 'Valider L7 · estimation', due: 'Aujourd’hui 14:00', heat: 3, progress: 64, deliverables: { ...all('done'), L4: 'review', L6: 'running', L7: 'review', L8: 'running', L9: 'blocked' }, motivation: 'Retraite en Bretagne · vente avant juin', timeline: '3 à 5 mois', tags: ['Exclusivité visée', 'Vue mer'] },
  { id: 'd2', ref: 'VND-2026-0419', seller: 'M. & Mme Laurent', propertyId: 'p2', agentId: 'a1', stage: 'prep', next: 'RDV découverte', due: 'Mer. 14 oct. 10:30', heat: 2, progress: 28, deliverables: { ...all('waiting'), D1: 'done', D2: 'done', D3: 'running', D4: 'waiting' }, motivation: 'Succession · 3 héritiers', timeline: '6 mois', tags: ['Succession', 'Indivision'] },
  { id: 'd3', ref: 'VND-2026-0388', seller: 'Mme Ricci', propertyId: 'p3', agentId: 'a3', stage: 'commercial', next: 'Bilan vendeur J+21', due: 'Sam. 17 oct.', heat: 2, progress: 78, mandate: 'Exclusif', deliverables: all('done'), motivation: 'Achat résidence à Paris', timeline: '2 mois', tags: ['Exclusif', '12 visites'] },
  { id: 'd4', ref: 'VND-2026-0371', seller: 'M. Dubreuil', propertyId: 'p4', agentId: 'a7', stage: 'offre', next: 'Contre-offre à 1,59 M€', due: 'Expire 18:00', heat: 3, progress: 86, mandate: 'Exclusif', deliverables: all('done'), motivation: 'Mutation professionnelle', timeline: 'Urgent', tags: ['Offre 1,55 M€', 'Financement OK'] },
  { id: 'd5', ref: 'VND-2026-0402', seller: 'Famille Costa', propertyId: 'p5', agentId: 'a4', stage: 'mandat', next: 'Shooting photo & visite 3D', due: 'Mer. 14 oct.', heat: 2, progress: 58, mandate: 'Semi-exclusif', deliverables: { ...all('done'), L8: 'review' }, motivation: 'Agrandissement famille', timeline: '4 mois', tags: ['Shooting', 'Matterport'] },
  { id: 'd6', ref: 'VND-2026-0356', seller: 'Mme Garnier-Blanc', propertyId: 'p6', agentId: 'a3', stage: 'compromis', next: 'Levée condition de prêt', due: 'Dim. 25 oct.', heat: 1, progress: 92, mandate: 'Simple', deliverables: all('done'), motivation: 'Départ à l’étranger', timeline: 'Signé', tags: ['Compromis 13/09', 'Notaire Me Faure'] },
  { id: 'd7', ref: 'VND-2026-0421', seller: 'M. Haddad', propertyId: 'p7', agentId: 'a2', stage: 'rdv', next: 'Débrief vocal à valider', due: 'Il y a 40 min', heat: 3, progress: 41, deliverables: { ...all('waiting'), D1: 'done', D2: 'done', D3: 'done', D4: 'done', D5: 'review' }, motivation: 'Divorce · vente rapide', timeline: '2 mois', tags: ['Sensible', 'Prix ambitieux'] },
  { id: 'd8', ref: 'VND-2026-0333', seller: 'M. & Mme Perrin', propertyId: 'p8', agentId: 'a7', stage: 'acte', next: 'Signature chez Me Lenoir', due: 'Jeu. 22 oct.', heat: 1, progress: 98, mandate: 'Exclusif', deliverables: all('done'), motivation: 'Retour en ville', timeline: 'Acte', tags: ['Acte 22/10'] },
  { id: 'd9', ref: 'VND-2026-0423', seller: 'M. Lemaire', propertyId: 'p9', agentId: 'a3', stage: 'prep', next: 'Brief D1–D3 en préparation', due: 'Mer. 14 oct. 09:00', heat: 2, progress: 18, deliverables: { ...all('waiting'), D1: 'running', D2: 'running' }, motivation: 'Expatriation à Dubaï', timeline: '3 mois', tags: ['International'] },
  { id: 'd10', ref: 'VND-2026-0409', seller: 'Famille Bonnet', propertyId: 'p10', agentId: 'a4', stage: 'post', next: 'Envoyer L1 remerciement', due: 'Aujourd’hui', heat: 2, progress: 52, deliverables: { ...all('done'), L1: 'review', L5: 'running', L8: 'waiting', L9: 'running' }, motivation: 'Achat plus grand', timeline: '5 mois', tags: ['Vente-achat'] },
  { id: 'd11', ref: 'VND-2026-0395', seller: 'SCI Garoupe', propertyId: 'p11', agentId: 'a2', stage: 'commercial', next: 'Visite Family Office', due: 'Jeu. 15 oct.', heat: 3, progress: 74, mandate: 'Exclusif', deliverables: all('done'), motivation: 'Arbitrage patrimonial', timeline: '4 mois', tags: ['Off-market', 'Exclusif'] },
  { id: 'd12', ref: 'VND-2026-0380', seller: 'M. & Mme Faure', propertyId: 'p12', agentId: 'a1', stage: 'mandat', next: 'Publication portails', due: 'Demain', heat: 2, progress: 61, mandate: 'Exclusif', deliverables: { ...all('done'), L4: 'review' }, motivation: 'Retour à Lyon', timeline: '3 mois', tags: ['Matterport fait'] },
]

export const prop = (id: string): Property => ((live.properties as Property[] | undefined)?.find((p) => p.id === id) ?? PROPERTIES.find((p) => p.id === id) ?? PROPERTIES[0])
export const agent = (id: string): Agent => ((live.agents as Agent[] | undefined)?.find((a) => a.id === id) ?? AGENTS.find((a) => a.id === id) ?? AGENTS[0])

export type Event = { time: string; end: string; title: string; who: string; place: string; kind: 'rdv' | 'visite' | 'signature' | 'interne' | 'appel'; dossier?: string; ready?: number }
export const TODAY: Event[] = [
  { time: '08:30', end: '09:00', title: 'Brief du matin', who: 'Équipe Vieille-Ville', place: 'Agence', kind: 'interne' },
  { time: '09:45', end: '10:30', title: 'Visite penthouse Baudoin', who: 'M. & Mme Verdier · acquéreurs', place: 'Juan-les-Pins', kind: 'visite', dossier: 'd3' },
  { time: '11:00', end: '12:15', title: 'RDV estimation — Villa Les Combes', who: 'Famille Costa', place: '41 route de Grasse', kind: 'rdv', dossier: 'd5', ready: 100 },
  { time: '14:00', end: '14:30', title: 'Validation estimation L7', who: 'Famille Martin', place: 'Visio', kind: 'appel', dossier: 'd1' },
  { time: '16:00', end: '17:00', title: 'Contre-visite Biot', who: 'Mme Okafor · acquéreuse', place: '8 impasse des Pins', kind: 'visite', dossier: 'd4' },
  { time: '18:00', end: '18:45', title: 'Signature offre Dubreuil', who: 'M. Dubreuil', place: 'Agence', kind: 'signature', dossier: 'd4' },
]

export type Buyer = { id: string; name: string; budget: [number, number]; zones: string[]; type: string; surface: number; financing: 'Validé' | 'En cours' | 'À vérifier'; heat: 1 | 2 | 3; match: Record<string, number>; source: string; last: string }
export const BUYERS: Buyer[] = [
  { id: 'b1', name: 'M. & Mme Verdier', budget: [1700000, 2000000], zones: ['Juan-les-Pins', 'Cap d’Antibes'], type: 'Appartement', surface: 130, financing: 'Validé', heat: 3, match: { p3: 96, p6: 61 }, source: 'SeLoger', last: 'Visite aujourd’hui' },
  { id: 'b2', name: 'Mme Okafor', budget: [1400000, 1650000], zones: ['Biot', 'Valbonne'], type: 'Maison', surface: 170, financing: 'Validé', heat: 3, match: { p4: 94, p8: 88 }, source: 'Recommandation', last: 'Contre-visite 16:00' },
  { id: 'b3', name: 'Family Office Lindqvist', budget: [4000000, 6000000], zones: ['Cap d’Antibes'], type: 'Villa', surface: 250, financing: 'Validé', heat: 2, match: { p1: 97 }, source: 'Réseau international', last: 'Brochure envoyée' },
  { id: 'b4', name: 'M. Serrano', budget: [2000000, 2400000], zones: ['Antibes', 'Super Antibes'], type: 'Villa', surface: 180, financing: 'En cours', heat: 2, match: { p7: 92, p2: 84, p5: 71 }, source: 'Site agence', last: 'Appel il y a 3 j' },
  { id: 'b5', name: 'Dr. & Mme Achour', budget: [900000, 1100000], zones: ['Vieil Antibes'], type: 'Appartement', surface: 100, financing: 'À vérifier', heat: 1, match: { p6: 89 }, source: 'Leboncoin', last: 'Lead J-2' },
  { id: 'b6', name: 'M. Keller', budget: [2500000, 3000000], zones: ['Les Combes', 'La Salis'], type: 'Maison', surface: 220, financing: 'Validé', heat: 2, match: { p5: 93, p2: 90 }, source: 'Belles Demeures', last: 'Visite sam. 10 oct.' },
]

export type Task = { id: string; title: string; dossier?: string; due: string; prio: 'haute' | 'normale'; kind: 'valider' | 'appeler' | 'envoyer' | 'relancer' | 'document'; ai?: boolean; done?: boolean }
export const TASKS: Task[] = [
  { id: 't1', title: 'Valider l’estimation argumentée L7 — fourchette 4,6–5,15 M€', dossier: 'd1', due: '14:00', prio: 'haute', kind: 'valider', ai: true },
  { id: 't2', title: 'Relire le débrief vocal de M. Haddad (12 champs proposés)', dossier: 'd7', due: 'Maintenant', prio: 'haute', kind: 'valider', ai: true },
  { id: 't3', title: 'Envoyer la contre-offre signée à l’acquéreur', dossier: 'd4', due: '17:30', prio: 'haute', kind: 'envoyer' },
  { id: 't4', title: 'Demander le PV d’AG 2025 au syndic (L9 bloqué)', dossier: 'd1', due: 'Aujourd’hui', prio: 'normale', kind: 'document', ai: true },
  { id: 't5', title: 'Rappeler Mme Ricci — bilan J+21 prêt', dossier: 'd3', due: 'Samedi', prio: 'normale', kind: 'appeler', ai: true },
  { id: 't6', title: 'Relancer le diagnostiqueur — DPE Bastide La Salis', dossier: 'd2', due: 'Demain', prio: 'normale', kind: 'relancer' },
]

export const ACTIVITY = [
  { t: '09:12', who: 'Copilote', what: 'a préparé le brief D1–D3 pour M. & Mme Laurent', tone: 'ai' },
  { t: '08:57', who: 'Sofia Benali', what: 'a signé un mandat exclusif — Penthouse Baudoin', tone: 'win' },
  { t: '08:40', who: 'Routine AUT-054', what: 'DPE de la Villa Les Combes expire dans 45 jours', tone: 'warn' },
  { t: '08:31', who: 'Copilote', what: 'a trouvé 3 acquéreurs compatibles à plus de 90 % pour la Villa Mimosas', tone: 'ai' },
  { t: 'Hier', who: 'Paul Garnier', what: 'offre reçue 1,55 M€ — Maison d’architecte Biot', tone: 'win' },
  { t: 'Hier', who: 'Inès Morel', what: 'a déposé 6 pièces au dossier copropriété', tone: 'neutral' },
]

export const AGENCIES = [
  { name: 'Antibes Vieille-Ville', agents: 9, mandats: 38, exclu: 0.46, ca: 1840000, adoption: 0.93, delai: 61, trend: [12, 14, 13, 17, 19, 22, 24] },
  { name: 'Juan-les-Pins', agents: 7, mandats: 31, exclu: 0.52, ca: 1520000, adoption: 0.89, delai: 54, trend: [10, 11, 13, 12, 15, 17, 18] },
  { name: 'Cap d’Antibes', agents: 5, mandats: 19, exclu: 0.61, ca: 2210000, adoption: 0.81, delai: 72, trend: [6, 7, 7, 9, 8, 10, 12] },
  { name: 'Biot · Valbonne', agents: 6, mandats: 24, exclu: 0.33, ca: 980000, adoption: 0.74, delai: 68, trend: [8, 9, 8, 9, 11, 10, 12] },
  { name: 'Cannes Croisette', agents: 8, mandats: 35, exclu: 0.41, ca: 2640000, adoption: 0.86, delai: 58, trend: [14, 13, 16, 18, 17, 20, 23] },
  { name: 'Mougins', agents: 4, mandats: 14, exclu: 0.38, ca: 870000, adoption: 0.69, delai: 77, trend: [4, 5, 5, 6, 6, 7, 8] },
]

export const COMPARABLES = [
  { addr: 'Chemin de la Garoupe', date: 'mars 2026', surface: 310, price: 5400000, kind: 'Vendu · DVF', dist: '420 m', keep: true },
  { addr: 'Boulevard du Cap', date: 'janv. 2026', surface: 265, price: 4720000, kind: 'Vendu · DVF', dist: '650 m', keep: true },
  { addr: 'Avenue Beau-Site', date: 'nov. 2025', surface: 240, price: 3980000, kind: 'Vendu · DVF', dist: '900 m', keep: true },
  { addr: 'Chemin des Mougins', date: 'en ligne', surface: 300, price: 5950000, kind: 'Annonce · 94 j', dist: '1,1 km', keep: false },
  { addr: 'Avenue Mrs L. D. Beaumont', date: 'sept. 2025', surface: 280, price: 4900000, kind: 'Vendu · DVF', dist: '780 m', keep: true },
]

export const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)
export const eur = (n: number) => (n >= 1e6 ? `${(n / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M€` : `${fmt(Math.round(n / 1000))} k€`)
