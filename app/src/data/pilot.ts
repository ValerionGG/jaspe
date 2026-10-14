// Données synthétiques — Pilotage, Réglages (domaine crm-pilot).
import { img } from './mock'

/** Téléchargement réel d’un fichier texte généré côté navigateur. */
export function download(name: string, text: string, type = 'text/plain') {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }))
  a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
/** Ligne CSV (séparateur point-virgule, compatible Excel FR). */
export const csv = (rows: (string | number)[][]) => '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')

export type Scope = 'agence' | 'reseau'

export const MONTHS = ['nov.', 'déc.', 'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.']

/** CA signé mensuel (k€), N et N-1. */
export const CA_SERIES: Record<Scope, { n: number[]; n1: number[] }> = {
  agence: { n: [118, 96, 82, 104, 131, 156, 172, 188, 164, 121, 176, 168], n1: [102, 88, 79, 91, 109, 128, 141, 150, 139, 98, 133, 140] },
  reseau: { n: [742, 610, 528, 655, 812, 948, 1036, 1121, 988, 734, 1062, 1014], n1: [668, 571, 505, 590, 702, 811, 884, 932, 851, 612, 846, 873] },
}

/** Mandats rentrés par mois : exclusifs / simples. */
export const MANDATS_SERIES: Record<Scope, { ex: number[]; simple: number[] }> = {
  agence: { ex: [3, 2, 2, 3, 4, 5, 5, 6, 4, 2, 6, 5], simple: [4, 3, 3, 4, 5, 5, 6, 6, 5, 3, 5, 4] },
  reseau: { ex: [14, 11, 10, 13, 18, 21, 22, 25, 19, 12, 26, 24], simple: [21, 17, 15, 19, 24, 26, 28, 29, 25, 16, 27, 25] },
}

export type Kpi = { id: string; label: string; value: string; delta: string; good: boolean; hint: string; spark: number[]; source: string }
export const KPIS: Record<Scope, Kpi[]> = {
  agence: [
    { id: 'ca', label: 'CA signé · 12 mois', value: '1,78 M€', delta: '+17 %', good: true, hint: 'Objectif annuel 2,1 M€ · 85 %', spark: CA_SERIES.agence.n, source: 'Actes & compromis · Apimo, 12/10 07:00' },
    { id: 'mandats', label: 'Mandats actifs', value: '38', delta: '+6', good: true, hint: 'Rentrés ce mois : 9', spark: [26, 28, 29, 31, 30, 33, 35, 34, 36, 35, 37, 38], source: 'Portefeuille CRM, 12/10' },
    { id: 'exclu', label: 'Taux d’exclusivité', value: '46 %', delta: '+5 pts', good: true, hint: 'Réseau : 45 %', spark: [36, 37, 39, 38, 40, 41, 41, 43, 42, 44, 45, 46], source: 'Mandats signés, 90 j glissants' },
    { id: 'delai', label: 'Délai de vente médian', value: '61 j', delta: '−8 j', good: true, hint: 'Mandat → compromis', spark: [74, 73, 71, 72, 70, 68, 66, 67, 65, 64, 62, 61], source: 'Dossiers clos, 12 mois' },
    { id: 'transfo', label: 'Estimation → mandat', value: '38 %', delta: '+4 pts', good: true, hint: '54 mandats / 142 estimations', spark: [29, 30, 31, 31, 32, 33, 34, 35, 35, 36, 37, 38], source: 'Parcours D1–L7, 90 j' },
    { id: 'adoption', label: 'Adoption du copilote', value: '93 %', delta: '+2 pts', good: true, hint: 'Conseillers actifs 7 j / équipe', spark: [61, 66, 70, 74, 79, 82, 85, 87, 89, 90, 91, 93], source: 'Journal d’usage, 7 j' },
  ],
  reseau: [
    { id: 'ca', label: 'CA signé · 12 mois', value: '10,25 M€', delta: '+14 %', good: true, hint: 'Objectif réseau 12 M€ · 85 %', spark: CA_SERIES.reseau.n, source: 'Actes & compromis · 6 agences, 12/10' },
    { id: 'mandats', label: 'Mandats actifs', value: '161', delta: '+19', good: true, hint: 'Rentrés ce mois : 49', spark: [128, 131, 134, 139, 137, 144, 149, 147, 152, 151, 156, 161], source: 'Portefeuille consolidé, 12/10' },
    { id: 'exclu', label: 'Taux d’exclusivité', value: '45 %', delta: '+3 pts', good: true, hint: 'Meilleure agence : Cap d’Antibes 61 %', spark: [38, 39, 40, 40, 41, 42, 42, 43, 43, 44, 44, 45], source: 'Mandats signés, 90 j glissants' },
    { id: 'delai', label: 'Délai de vente médian', value: '64 j', delta: '−5 j', good: true, hint: 'Écart agences : 54 → 77 j', spark: [72, 71, 71, 70, 69, 69, 68, 67, 66, 66, 65, 64], source: 'Dossiers clos, 12 mois' },
    { id: 'transfo', label: 'Estimation → mandat', value: '34 %', delta: '+2 pts', good: true, hint: '231 mandats / 679 estimations', spark: [29, 29, 30, 31, 31, 32, 32, 33, 33, 33, 34, 34], source: 'Parcours D1–L7, 90 j' },
    { id: 'adoption', label: 'Adoption du copilote', value: '84 %', delta: '+6 pts', good: true, hint: 'Mougins à accompagner : 69 %', spark: [48, 53, 58, 63, 67, 70, 73, 76, 78, 80, 82, 84], source: 'Journal d’usage, 7 j' },
  ],
}

export const FUNNEL: Record<Scope, { label: string; n: number; note: string }[]> = {
  agence: [
    { label: 'Contacts vendeurs', n: 318, note: 'Leads, recommandations, prospection' },
    { label: 'Estimations', n: 142, note: 'RDV D5 réalisés' },
    { label: 'Mandats', n: 54, note: 'dont 25 exclusifs' },
    { label: 'Offres', n: 31, note: 'Au prix ou négociées' },
    { label: 'Compromis', n: 22, note: 'Signés chez le notaire' },
    { label: 'Actes', n: 17, note: 'CA encaissé' },
  ],
  reseau: [
    { label: 'Contacts vendeurs', n: 1604, note: 'Leads, recommandations, prospection' },
    { label: 'Estimations', n: 679, note: 'RDV D5 réalisés' },
    { label: 'Mandats', n: 231, note: 'dont 104 exclusifs' },
    { label: 'Offres', n: 139, note: 'Au prix ou négociées' },
    { label: 'Compromis', n: 101, note: 'Signés chez le notaire' },
    { label: 'Actes', n: 83, note: 'CA encaissé' },
  ],
}

export const DAYS = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.']
export const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i) // 8 h → 20 h
/** Activité (RDV, appels, visites) par jour × heure — déterministe. */
export const HEAT: number[][] = DAYS.map((_, d) =>
  HOURS.map((h, i) => {
    const hourCurve = [0.35, 0.7, 0.95, 0.85, 0.5, 0.3, 0.55, 0.8, 0.9, 0.85, 0.65, 0.4, 0.2][i]
    const dayF = [0.9, 1, 0.85, 1, 0.95, 0.75, 0.12][d]
    const noise = ((d * 13 + h * 7) % 11) / 30
    return Math.min(1, hourCurve * dayF + noise * dayF * 0.6)
  }),
)

export type Member = { id: string; name: string; agency: string; photo?: string; role: string; mandats: number; prev: number; transfo: number; livrables: number; adoption: number; help?: string; win?: string }
export const TEAM: Member[] = [
  { id: 'a1', name: 'Claire Delmas', agency: 'Antibes Vieille-Ville', photo: img('p-claire'), role: 'Conseillère senior', mandats: 14, prev: 11, transfo: 44, livrables: 91, adoption: 98, win: 'Trois exclusivités en septembre' },
  { id: 'a2', name: 'Marc Olivieri', agency: 'Antibes Vieille-Ville', photo: img('p-marc'), role: 'Directeur d’agence', mandats: 9, prev: 8, transfo: 39, livrables: 88, adoption: 94 },
  { id: 'm1', name: 'Hugo Lambert', agency: 'Antibes Vieille-Ville', role: 'Conseiller', mandats: 5, prev: 2, transfo: 31, livrables: 76, adoption: 92, win: 'Plus forte progression du trimestre' },
  { id: 'm2', name: 'Nora Chevalier', agency: 'Antibes Vieille-Ville', role: 'Conseillère', mandats: 4, prev: 5, transfo: 22, livrables: 69, adoption: 71, help: 'Estimations peu converties : simulation D4 en binôme avec Claire' },
  { id: 'm3', name: 'Yanis Ferrand', agency: 'Antibes Vieille-Ville', role: 'Conseiller junior', mandats: 3, prev: 1, transfo: 27, livrables: 82, adoption: 96 },
  { id: 'a3', name: 'Sofia Benali', agency: 'Juan-les-Pins', photo: img('p-sofia'), role: 'Conseillère', mandats: 11, prev: 9, transfo: 41, livrables: 93, adoption: 97, win: 'Taux de validation sans retouche : 93 %' },
  { id: 'a4', name: 'Julien Arnaud', agency: 'Cap d’Antibes', photo: img('p-julien'), role: 'Conseiller', mandats: 7, prev: 7, transfo: 33, livrables: 74, adoption: 79, help: 'Livrables L7 souvent retouchés : revue des comparables avec le copilote' },
  { id: 'a7', name: 'Paul Garnier', agency: 'Biot · Valbonne', photo: img('p-paul'), role: 'Conseiller', mandats: 6, prev: 4, transfo: 29, livrables: 71, adoption: 72 },
  { id: 'm4', name: 'Camille Roux', agency: 'Cannes Croisette', role: 'Conseillère senior', mandats: 12, prev: 10, transfo: 42, livrables: 89, adoption: 90 },
  { id: 'm5', name: 'Antoine Mercier', agency: 'Mougins', role: 'Directeur d’agence', mandats: 4, prev: 5, transfo: 24, livrables: 62, adoption: 58, help: 'Adoption en retrait : session de prise en main de 30 min proposée' },
  { id: 'm6', name: 'Elsa Vidal', agency: 'Cannes Croisette', role: 'Conseillère', mandats: 8, prev: 6, transfo: 36, livrables: 84, adoption: 88 },
]

export type Blocked = { id: string; ref: string; title: string; photo: string; owner: string; days: number; reason: string; action: string; kind: 'document' | 'vendeur' | 'notaire' | 'prix' }
export const BLOCKED: Blocked[] = [
  { id: 'k1', ref: 'VND-2026-0412', title: 'Villa contemporaine · Cap d’Antibes', photo: img('villa-pool'), owner: 'a1', days: 6, reason: 'L9 bloqué : PV d’AG 2025 manquant chez le syndic', action: 'Relance syndic préparée', kind: 'document' },
  { id: 'k2', ref: 'VND-2026-0374', title: 'Mas provençal · Mougins', photo: img('house-garden'), owner: 'm5', days: 19, reason: 'Prix 18 % au-dessus de la fourchette L7, aucune visite depuis 3 semaines', action: 'Préparer un bilan vendeur J+45 chiffré', kind: 'prix' },
  { id: 'k3', ref: 'VND-2026-0391', title: 'Appartement Croisette · Cannes', photo: img('int-glass'), owner: 'm4', days: 9, reason: 'Diagnostics amiante en attente du diagnostiqueur', action: 'Relancer le diagnostiqueur (2ᵉ relance)', kind: 'document' },
  { id: 'k4', ref: 'VND-2026-0356', title: 'Appartement Belle Époque · Vieil Antibes', photo: img('medit-street'), owner: 'a2', days: 4, reason: 'Notaire acquéreur sans retour sur la condition de prêt', action: 'Appel Me Faure proposé à 15:00', kind: 'notaire' },
  { id: 'k5', ref: 'VND-2026-0409', title: 'Maison bois · Valbonne', photo: img('house-wood'), owner: 'm2', days: 12, reason: 'Vendeur injoignable depuis la remise du L7', action: 'Message WhatsApp de relance à valider', kind: 'vendeur' },
]

export const AI_COSTS = [
  { agency: 'Antibes Vieille-Ville', spent: 612, budget: 750, split: [52, 31, 17] },
  { agency: 'Juan-les-Pins', spent: 488, budget: 600, split: [48, 36, 16] },
  { agency: 'Cap d’Antibes', spent: 571, budget: 500, split: [41, 47, 12] },
  { agency: 'Biot · Valbonne', spent: 302, budget: 450, split: [58, 28, 14] },
  { agency: 'Cannes Croisette', spent: 655, budget: 800, split: [50, 33, 17] },
  { agency: 'Mougins', spent: 141, budget: 300, split: [63, 22, 15] },
]
export const AI_SPLIT_LABELS = ['Texte & analyses', 'Images & avant/après', 'Voix & transcription']

/** Taux de validation sans retouche par livrable (%). */
export const QUALITY = [
  { code: 'L1', name: 'Remerciement', rate: 94, n: 212 },
  { code: 'L2', name: 'Synthèse équipe', rate: 91, n: 198 },
  { code: 'L3', name: 'Avant-première', rate: 86, n: 141 },
  { code: 'L4', name: 'Kit social', rate: 72, n: 167 },
  { code: 'L5', name: 'Courrier voisinage', rate: 89, n: 120 },
  { code: 'L6', name: 'Book services', rate: 83, n: 96 },
  { code: 'L7', name: 'Estimation', rate: 64, n: 142 },
  { code: 'L8', name: 'Avant / après', rate: 78, n: 88 },
  { code: 'L9', name: 'Copro & diagnostics', rate: 81, n: 74 },
]

/* ————— Réglages ————— */

export const NETWORK = {
  name: 'Réseau Riviera',
  agencies: [
    { name: 'Antibes Vieille-Ville', city: 'Antibes', teams: ['Transaction', 'Location saisonnière'], members: 9, overrides: 1 },
    { name: 'Juan-les-Pins', city: 'Antibes', teams: ['Transaction'], members: 7, overrides: 0 },
    { name: 'Cap d’Antibes', city: 'Antibes', teams: ['Prestige', 'International'], members: 5, overrides: 2 },
    { name: 'Biot · Valbonne', city: 'Biot', teams: ['Transaction'], members: 6, overrides: 0 },
    { name: 'Cannes Croisette', city: 'Cannes', teams: ['Transaction', 'Prestige'], members: 8, overrides: 1 },
    { name: 'Mougins', city: 'Mougins', teams: ['Transaction'], members: 4, overrides: 0 },
  ],
}
export const INHERITED = [
  { id: 'brand', label: 'Charte & modèles de documents', from: 'Réseau', locked: true },
  { id: 'quiet', label: 'Horaires calmes (20:00 – 08:00)', from: 'Réseau', locked: false },
  { id: 'consent', label: 'Politique de consentement démarchage', from: 'Réseau', locked: true },
  { id: 'ai', label: 'Budget IA mensuel (750 €)', from: 'Agence', locked: false },
  { id: 'validation', label: 'Validation humaine avant envoi externe', from: 'Réseau', locked: true },
  { id: 'fees', label: 'Barème d’honoraires', from: 'Agence', locked: false },
]

export const ROLES = ['Directeur réseau', 'Directeur d’agence', 'Conseiller', 'Coordinateur', 'Marketing'] as const
export const PERMS = [
  { id: 'view_all', label: 'Voir tous les dossiers de l’agence', group: 'Dossiers' },
  { id: 'edit_others', label: 'Modifier les dossiers d’un collègue', group: 'Dossiers' },
  { id: 'send_ext', label: 'Valider et envoyer un livrable externe', group: 'Livrables' },
  { id: 'unlock_tpl', label: 'Modifier un modèle verrouillé', group: 'Livrables' },
  { id: 'pilot', label: 'Accéder au pilotage agence', group: 'Pilotage' },
  { id: 'network', label: 'Accéder au pilotage réseau', group: 'Pilotage' },
  { id: 'billing', label: 'Gérer la facturation', group: 'Administration' },
  { id: 'export', label: 'Exporter des données personnelles', group: 'Administration' },
]
export const PERM_MATRIX: Record<string, boolean[]> = {
  view_all: [true, true, true, true, false],
  edit_others: [true, true, false, true, false],
  send_ext: [true, true, true, false, true],
  unlock_tpl: [true, false, false, false, true],
  pilot: [true, true, false, false, false],
  network: [true, false, false, false, false],
  billing: [true, false, false, false, false],
  export: [true, true, false, false, false],
}

export type IntegrationStatus = 'connecte' | 'a_connecter' | 'erreur'
export type Integration = { name: string; cat: 'Logiciel métier' | 'Agenda & messagerie' | 'Signature' | 'Diffusion' | 'Données publiques' | 'Médias & paiement'; desc: string; status: IntegrationStatus; sync?: string; objects?: string; mono: string; simulated?: boolean }
export const INTEGRATIONS: Integration[] = [
  { name: 'Apimo', cat: 'Logiciel métier', desc: 'Biens, mandats et contacts synchronisés dans les deux sens', status: 'connecte', sync: 'il y a 4 min', objects: '412 biens · 2 318 contacts', mono: 'Ap' },
  { name: 'Hektor', cat: 'Logiciel métier', desc: 'Import des mandats et du suivi des visites', status: 'a_connecter', mono: 'Hk' },
  { name: 'Modelo', cat: 'Logiciel métier', desc: 'Génération des mandats et compromis', status: 'connecte', sync: 'il y a 1 h', objects: '86 actes · 54 mandats', mono: 'Mo' },
  { name: 'Google Agenda', cat: 'Agenda & messagerie', desc: 'RDV, visites et préparation automatique des briefs', status: 'connecte', sync: 'en continu', objects: '9 agendas · 1 204 événements', mono: 'G' },
  { name: 'Outlook', cat: 'Agenda & messagerie', desc: 'Agenda et mails pour les agences sous Microsoft 365', status: 'erreur', sync: 'échec il y a 2 h · jeton expiré', objects: '3 agendas', mono: 'Ol' },
  { name: 'WhatsApp Business', cat: 'Agenda & messagerie', desc: 'Relances vendeurs et acquéreurs, toujours validées', status: 'connecte', sync: 'il y a 12 min', objects: '641 conversations', mono: 'Wa' },
  { name: 'Yousign', cat: 'Signature', desc: 'Signature électronique des mandats et offres', status: 'connecte', sync: 'il y a 26 min', objects: '128 enveloppes', mono: 'Ys' },
  { name: 'DocuSign', cat: 'Signature', desc: 'Alternative pour les clients internationaux', status: 'a_connecter', mono: 'Ds' },
  { name: 'SeLoger', cat: 'Diffusion', desc: 'Diffusion des annonces et retour des leads', status: 'connecte', sync: 'il y a 8 min', objects: '96 annonces · 312 leads', mono: 'Sl' },
  { name: 'Leboncoin', cat: 'Diffusion', desc: 'Diffusion multi-annonces et messagerie', status: 'connecte', sync: 'il y a 18 min', objects: '71 annonces · 188 leads', mono: 'Lb' },
  { name: 'Bien’ici', cat: 'Diffusion', desc: 'Diffusion avec visites virtuelles', status: 'a_connecter', mono: 'Bi' },
  { name: 'DVF / Etalab', cat: 'Données publiques', desc: 'Ventes notariées pour les comparables D2 et L7', status: 'connecte', sync: 'mise à jour du 01/10', objects: '48 210 mutations 06', mono: 'Dv' },
  { name: 'IGN', cat: 'Données publiques', desc: 'Cadastre, parcelles et relief pour le radar D3', status: 'connecte', sync: 'hebdomadaire', objects: 'Cadastre 06', mono: 'Ig' },
  { name: 'INSEE', cat: 'Données publiques', desc: 'Démographie et revenus par IRIS', status: 'connecte', sync: 'mensuelle', objects: '312 IRIS', mono: 'In' },
  { name: 'Matterport', cat: 'Médias & paiement', desc: 'Visites 3D intégrées aux annonces et au L3', status: 'connecte', sync: 'il y a 3 j', objects: '22 modèles 3D', mono: 'Mp' },
  { name: 'Stripe', cat: 'Médias & paiement', desc: 'Paiement des frais de services et abonnement', status: 'a_connecter', mono: 'St' },
]

export const CONSENTS = [
  { who: 'M. & Mme Laurent', canal: 'Téléphone', status: 'accordé', date: '03/10/2026', source: 'Formulaire estimation en ligne', proof: 'Case cochée + IP horodatée' },
  { who: 'Mme Ricci', canal: 'WhatsApp', status: 'accordé', date: '19/09/2026', source: 'RDV découverte D5', proof: 'Mention enregistrée dans le débrief' },
  { who: 'M. Haddad', canal: 'Courriel', status: 'accordé', date: '11/10/2026', source: 'Mail de remerciement L1', proof: 'Lien de préférence cliqué' },
  { who: 'Copropriété Les Pins', canal: 'Téléphone', status: 'refusé', date: '08/10/2026', source: 'Courrier voisinage L5', proof: 'Opposition par retour courrier' },
  { who: 'M. Keller', canal: 'Téléphone', status: 'expiré', date: '11/10/2023', source: 'Ancien mandat 2023', proof: 'Durée de 3 ans dépassée' },
  { who: 'Dr. & Mme Achour', canal: 'SMS', status: 'en attente', date: '10/10/2026', source: 'Lead Leboncoin', proof: 'Demande de consentement envoyée' },
]

export const RETENTION = [
  { id: 'prospects', label: 'Prospects sans suite', months: 36, legal: '3 ans après le dernier contact (CNIL)' },
  { id: 'clients', label: 'Clients après transaction', months: 60, legal: '5 ans · obligations LCB-FT' },
  { id: 'audio', label: 'Enregistrements vocaux D5', months: 3, legal: 'Transcrits puis supprimés' },
  { id: 'id', label: 'Pièces d’identité', months: 60, legal: '5 ans · Tracfin' },
]

export const AUDIT = [
  { t: '12/10 10:21', who: 'Claire Delmas', what: 'a validé et envoyé L1 · Famille Martin', kind: 'envoi' },
  { t: '12/10 09:58', who: 'Copilote', what: 'a étiqueté 6 images IA « Image retouchée par IA » · L8 Villa Costa', kind: 'ia' },
  { t: '12/10 09:12', who: 'Marc Olivieri', what: 'a exporté le registre des consentements (CSV)', kind: 'export' },
  { t: '11/10 18:40', who: 'Thomas Rey', what: 'a verrouillé le modèle « Estimation argumentée L7 »', kind: 'config' },
  { t: '11/10 16:02', who: 'Système', what: 'a bloqué un appel sortant : aucun consentement pour M. Keller', kind: 'blocage' },
  { t: '11/10 11:17', who: 'Inès Morel', what: 'a supprimé 3 enregistrements vocaux arrivés à échéance', kind: 'rgpd' },
]

export const SESSIONS = [
  { device: 'MacBook Pro · Safari', place: 'Antibes, France', last: 'Session actuelle', current: true },
  { device: 'iPhone 16 · App Jaspe', place: 'Antibes, France', last: 'il y a 12 min', current: false },
  { device: 'iPad Air · Chrome', place: 'Juan-les-Pins, France', last: 'hier 19:42', current: false },
  { device: 'Windows · Edge', place: 'Nice, France', last: 'il y a 9 jours', current: false },
]

export const AI_USAGE = [412, 486, 530, 498, 602, 688, 731, 802, 744, 590, 812, 769] // € / mois, réseau
export const INVOICES = [
  { id: 'F-2026-10', date: '01/10/2026', amount: 3486, status: 'Payée' },
  { id: 'F-2026-09', date: '01/09/2026', amount: 3529, status: 'Payée' },
  { id: 'F-2026-08', date: '01/08/2026', amount: 3307, status: 'Payée' },
  { id: 'F-2026-07', date: '01/07/2026', amount: 3461, status: 'Payée' },
]
