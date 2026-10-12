// Données opérationnelles (agenda, file de validation, contacts, transactions) — synthétiques.
import { img } from './mock'

/* ───────────────────────── Agenda ───────────────────────── */

export type Kind = 'rdv' | 'visite' | 'signature' | 'interne' | 'appel'
export const KINDS: Record<Kind, { label: string; dot: string; block: string; text: string }> = {
  rdv: { label: 'RDV vendeur', dot: 'bg-champagne', block: 'bg-champagne/[0.13] ring-champagne/30 hover:bg-champagne/[0.2]', text: 'text-champagne-300' },
  visite: { label: 'Visite', dot: 'bg-sea', block: 'bg-sea/[0.13] ring-sea/30 hover:bg-sea/[0.2]', text: 'text-sea' },
  signature: { label: 'Signature', dot: 'bg-sage', block: 'bg-sage/[0.13] ring-sage/30 hover:bg-sage/[0.2]', text: 'text-sage' },
  interne: { label: 'Interne', dot: 'bg-mist', block: 'bg-white/[0.05] ring-white/10 hover:bg-white/[0.08]', text: 'text-bone/60' },
  appel: { label: 'Appel / visio', dot: 'bg-coral', block: 'bg-coral/[0.12] ring-coral/30 hover:bg-coral/[0.18]', text: 'text-coral' },
}

export type Prep = { D1: number; D2: number; D3: number; D4: number }
export type CalEvent = {
  id: string; day: number; start: string; end: string; title: string; who: string; place: string; kind: Kind
  dossier?: string; prep?: Prep; travel?: { min: number; km: number; from: string }; checklist?: { t: string; ok: boolean }[]
  source: 'google' | 'outlook' | 'nxt'; conflict?: string
}

/** Jour de référence : lundi 12 octobre 2026, 10:36 (démo). `day` = jour compté depuis le 1er octobre 2026 (32 = 1er nov., 0 = 30 sept.) : date réelle = new Date(2026, 9, day). */
export const NOW = { day: 12, h: 10.6, label: '10:36' }

const CHK_RDV = [
  { t: 'Brief relationnel relu (D1)', ok: true },
  { t: 'Comparables DVF imprimés (D2)', ok: true },
  { t: 'Radar quartier & PLU (D3)', ok: false },
  { t: 'Mandat exclusif pré-rempli', ok: true },
  { t: 'Simulation des objections (D4)', ok: false },
]

export const EVENTS: CalEvent[] = [
  // Mercredi 7
  { id: 'e1', day: 7, start: '08:30', end: '09:15', title: 'Réunion d’équipe hebdo', who: 'Équipe Vieille-Ville', place: 'Agence', kind: 'interne', source: 'nxt' },
  { id: 'e2', day: 7, start: '10:00', end: '11:30', title: 'Estimation — Villa Nielles', who: 'Famille Martin', place: '14 chemin des Nielles', kind: 'rdv', dossier: 'd1', prep: { D1: 100, D2: 100, D3: 100, D4: 100 }, source: 'google' },
  { id: 'e3', day: 7, start: '14:30', end: '15:15', title: 'Visite penthouse Baudoin', who: 'M. Serrano', place: 'Juan-les-Pins', kind: 'visite', dossier: 'd3', source: 'google' },
  { id: 'e4', day: 7, start: '17:00', end: '17:30', title: 'Point courtier — dossier Okafor', who: 'Riviera Courtage', place: 'Téléphone', kind: 'appel', source: 'outlook' },
  // Jeudi 8
  { id: 'e5', day: 8, start: '09:00', end: '10:00', title: 'Shooting photo Belle Époque', who: 'Hugo Lambert · photographe', place: '5 place Masséna', kind: 'interne', dossier: 'd6', source: 'nxt' },
  { id: 'e6', day: 8, start: '11:00', end: '11:45', title: 'Visite Maison d’architecte', who: 'Mme Okafor', place: '8 impasse des Pins, Biot', kind: 'visite', dossier: 'd4', source: 'google' },
  { id: 'e7', day: 8, start: '15:00', end: '16:30', title: 'Découverte — Villa Mimosas', who: 'M. Haddad', place: '17 allée des Mimosas', kind: 'rdv', dossier: 'd7', prep: { D1: 100, D2: 100, D3: 100, D4: 100 }, source: 'google' },
  // Vendredi 9
  { id: 'e8', day: 9, start: '08:30', end: '09:00', title: 'Brief du matin', who: 'Équipe', place: 'Agence', kind: 'interne', source: 'nxt' },
  { id: 'e9', day: 9, start: '10:15', end: '11:00', title: 'Visio notaire — compromis Belle Époque', who: 'Me Faure', place: 'Visio', kind: 'appel', dossier: 'd6', source: 'outlook' },
  { id: 'e10', day: 10, start: '12:30', end: '13:15', title: 'Visite Bastide La Salis', who: 'M. Keller', place: '3 avenue de la Salis', kind: 'visite', dossier: 'd2', source: 'google' },
  { id: 'e11', day: 9, start: '16:30', end: '18:00', title: 'Comité réseau · mandats exclusifs', who: 'Thomas Rey · siège', place: 'Sophia Antipolis', kind: 'interne', source: 'outlook' },
  // Samedi 10
  { id: 'e12', day: 10, start: '09:30', end: '10:15', title: 'Visite Villa Les Combes', who: 'M. Keller', place: '41 route de Grasse', kind: 'visite', dossier: 'd5', source: 'google' },
  { id: 'e13', day: 10, start: '11:00', end: '12:00', title: 'Offre Dubreuil — réception', who: 'Paul Garnier', place: 'Agence Biot', kind: 'signature', dossier: 'd4', source: 'nxt' },
  { id: 'e14', day: 10, start: '14:30', end: '15:00', title: 'Appel diagnostiqueur — DPE La Salis', who: 'Diag Azur', place: 'Téléphone', kind: 'appel', dossier: 'd2', source: 'nxt' },
  { id: 'e15', day: 10, start: '16:00', end: '17:15', title: 'Visite penthouse Baudoin', who: 'M. & Mme Verdier', place: 'Juan-les-Pins', kind: 'visite', dossier: 'd3', source: 'google' },
  // Dimanche 11 (brief, remise L7 et déjeuner notaires placés en semaine)
  { id: 'e16', day: 10, start: '08:30', end: '09:00', title: 'Brief du matin', who: 'Équipe', place: 'Agence', kind: 'interne', source: 'nxt' },
  { id: 'e17', day: 10, start: '17:30', end: '18:30', title: 'Remise L7 — Famille Martin', who: 'Famille Martin', place: 'Agence', kind: 'rdv', dossier: 'd1', prep: { D1: 100, D2: 100, D3: 90, D4: 70 }, source: 'google' },
  { id: 'e18', day: 8, start: '12:30', end: '14:00', title: 'Déjeuner notaires Antibes', who: 'Me Faure · Me Lenoir', place: 'Restaurant du port', kind: 'interne', source: 'outlook' },
  { id: 'e19', day: 11, start: '15:30', end: '16:15', title: 'Contre-visite Villa Mimosas', who: 'M. Serrano', place: 'Super Antibes', kind: 'visite', dossier: 'd7', source: 'google' },
  // Lundi 12 (aujourd’hui)
  { id: 'e20', day: 12, start: '08:30', end: '09:00', title: 'Brief du matin', who: 'Équipe Vieille-Ville', place: 'Agence', kind: 'interne', source: 'nxt' },
  { id: 'e21', day: 12, start: '09:45', end: '10:30', title: 'Visite penthouse Baudoin', who: 'M. & Mme Verdier · acquéreurs', place: 'Juan-les-Pins', kind: 'visite', dossier: 'd3', source: 'google', travel: { min: 12, km: 4.1, from: 'Agence' } },
  { id: 'e22', day: 12, start: '11:00', end: '12:15', title: 'RDV estimation — Villa Les Combes', who: 'Famille Costa', place: '41 route de Grasse', kind: 'rdv', dossier: 'd5', prep: { D1: 100, D2: 100, D3: 100, D4: 100 }, travel: { min: 14, km: 6.3, from: 'Juan-les-Pins' }, checklist: CHK_RDV.map((c) => ({ ...c, ok: true })), source: 'google' },
  { id: 'e23', day: 12, start: '14:00', end: '14:30', title: 'Validation estimation L7', who: 'Famille Martin', place: 'Visio', kind: 'appel', dossier: 'd1', source: 'nxt' },
  { id: 'e24', day: 12, start: '16:00', end: '17:00', title: 'Contre-visite Biot', who: 'Mme Okafor · acquéreuse', place: '8 impasse des Pins', kind: 'visite', dossier: 'd4', travel: { min: 22, km: 11.8, from: 'Agence' }, source: 'google', conflict: 'Chevauche « Appel Me Lenoir » (Outlook) de 16:30 à 17:00' },
  { id: 'e25', day: 12, start: '16:30', end: '17:00', title: 'Appel Me Lenoir — acte Perrin', who: 'Me Lenoir', place: 'Téléphone', kind: 'appel', dossier: 'd8', source: 'outlook', conflict: 'Chevauche « Contre-visite Biot » de 16:30 à 17:00' },
  { id: 'e26', day: 12, start: '18:00', end: '18:45', title: 'Signature offre Dubreuil', who: 'M. Dubreuil', place: 'Agence', kind: 'signature', dossier: 'd4', travel: { min: 25, km: 12.2, from: 'Biot' }, source: 'nxt' },
  // Mardi 13
  { id: 'e27', day: 13, start: '10:30', end: '12:00', title: 'Portes ouvertes Villa Mimosas', who: '6 acquéreurs inscrits', place: '17 allée des Mimosas', kind: 'visite', dossier: 'd7', source: 'nxt' },
  // Semaine suivante & reste du mois (vue mois)
  { id: 'e28', day: 14, start: '09:00', end: '10:30', title: 'Shooting & visite 3D — Les Combes', who: 'Hugo Lambert', place: '41 route de Grasse', kind: 'interne', dossier: 'd5', source: 'nxt' },
  { id: 'e29', day: 14, start: '10:30', end: '12:00', title: 'RDV découverte — Bastide La Salis', who: 'M. & Mme Laurent', place: '3 avenue de la Salis', kind: 'rdv', dossier: 'd2', prep: { D1: 100, D2: 100, D3: 60, D4: 0 }, travel: { min: 9, km: 3.2, from: 'Agence' }, checklist: CHK_RDV, source: 'google' },
  { id: 'e30', day: 15, start: '15:00', end: '16:00', title: 'Remise analyse de valeur', who: 'Famille Martin', place: 'Agence', kind: 'rdv', dossier: 'd1', prep: { D1: 100, D2: 100, D3: 100, D4: 80 }, source: 'google' },
  { id: 'e31', day: 17, start: '11:00', end: '11:45', title: 'Bilan vendeur J+21', who: 'Mme Ricci', place: 'Visio', kind: 'appel', dossier: 'd3', source: 'nxt' },
  { id: 'e32', day: 18, start: '09:30', end: '11:00', title: 'Photographe — Villa Nielles', who: 'Hugo Lambert', place: '14 chemin des Nielles', kind: 'interne', dossier: 'd1', source: 'nxt' },
  { id: 'e33', day: 22, start: '10:00', end: '11:30', title: 'Acte authentique — Perrin', who: 'Me Lenoir', place: 'Étude Lenoir, Valbonne', kind: 'signature', dossier: 'd8', source: 'outlook' },
  { id: 'e34', day: 25, start: '17:00', end: '17:30', title: 'Échéance condition de prêt', who: 'Mme Garnier-Blanc', place: '—', kind: 'appel', dossier: 'd6', source: 'nxt' },
  { id: 'e35', day: 29, start: '14:00', end: '15:30', title: 'Signature compromis Mimosas', who: 'M. Haddad · M. Serrano', place: 'Étude Faure, Antibes', kind: 'signature', dossier: 'd7', source: 'outlook' },
  { id: 'e36', day: 34, start: '10:00', end: '11:00', title: 'Estimation — Penthouse Baudoin', who: 'Mme Ricci', place: 'Juan-les-Pins', kind: 'rdv', dossier: 'd3', source: 'google' },
  { id: 'e37', day: 35, start: '15:00', end: '16:00', title: 'Visite Belle Époque', who: 'Dr. & Mme Achour', place: 'Vieil Antibes', kind: 'visite', dossier: 'd6', source: 'google' },
]

/* ─────────────────────── Tâches & validations ─────────────────────── */

export type QKind = 'livrable' | 'debrief' | 'offre' | 'piece' | 'relance'
export const QKINDS: Record<QKind, string> = { livrable: 'Livrables', debrief: 'Débriefs', offre: 'Offres', piece: 'Pièces', relance: 'Relances' }
export type QItem = {
  id: string; kind: QKind; title: string; dossier?: string; due: string; bucket: 'today' | 'week' | 'later'
  why: string; saved: number; assignee: string; safe: boolean; ai: boolean; code?: string; urgent?: boolean
}
/** `safe` : validable en lot (interne, réversible). Les engagements externes exigent une revue individuelle. */
export const QUEUE: QItem[] = [
  { id: 'q1', kind: 'debrief', title: 'Débrief vocal M. Haddad — 12 champs proposés', dossier: 'd7', due: 'Maintenant', bucket: 'today', why: 'RDV terminé il y a 40 min · la mémoire du rendez-vous s’efface vite', saved: 25, assignee: 'a1', safe: true, ai: true, code: 'D5', urgent: true },
  { id: 'q2', kind: 'livrable', title: 'Estimation argumentée — fourchette 4,6–5,15 M€', dossier: 'd1', due: '14:00', bucket: 'today', why: 'Remise prévue en visio à 14:00 · 5 comparables DVF sourcés', saved: 90, assignee: 'a1', safe: false, ai: true, code: 'L7', urgent: true },
  { id: 'q3', kind: 'offre', title: 'Contre-offre à 1,59 M€ à transmettre à Mme Okafor', dossier: 'd4', due: 'Expire 18:00', bucket: 'today', why: 'Offre de 1,55 M€ expire ce soir · vendeur d’accord à 1,59 M€', saved: 15, assignee: 'a7', safe: false, ai: false, urgent: true },
  { id: 'q4', kind: 'livrable', title: 'Kit réseaux sociaux — 6 visuels, 2 étiquetés IA', dossier: 'd1', due: 'Aujourd’hui', bucket: 'today', why: 'Publication programmée mercredi 9:00 · AI Act : étiquetage vérifié', saved: 60, assignee: 'a6', safe: true, ai: true, code: 'L4' },
  { id: 'q5', kind: 'piece', title: 'Demande du PV d’AG 2025 au syndic', dossier: 'd1', due: 'Aujourd’hui', bucket: 'today', why: 'Bloque L9 et le pré-état daté · syndic joignable jusqu’à 17:00', saved: 10, assignee: 'a5', safe: true, ai: true, code: 'L9' },
  { id: 'q6', kind: 'livrable', title: 'Avant / après home staging — séjour & terrasse', dossier: 'd5', due: 'Aujourd’hui', bucket: 'today', why: 'Original conservé · 3 images virtuelles étiquetées', saved: 45, assignee: 'a4', safe: true, ai: true, code: 'L8' },
  { id: 'q7', kind: 'relance', title: 'Relance diagnostiqueur — DPE Bastide La Salis', dossier: 'd2', due: 'Demain', bucket: 'week', why: 'RDV découverte mercredi 10:30 · DPE indispensable au mandat', saved: 5, assignee: 'a1', safe: true, ai: true },
  { id: 'q8', kind: 'relance', title: 'Rappeler Mme Ricci — bilan J+21 prêt', dossier: 'd3', due: 'Samedi', bucket: 'week', why: '12 visites, 0 offre · bilan prêt avec recommandation de prix', saved: 20, assignee: 'a3', safe: true, ai: true },
  { id: 'q9', kind: 'piece', title: 'Attestation de financement — M. Serrano', dossier: 'd7', due: 'Vendredi', bucket: 'week', why: 'Requise avant compromis du 29 oct. · financement « en cours »', saved: 10, assignee: 'a2', safe: true, ai: false },
  { id: 'q10', kind: 'livrable', title: 'Synthèse équipe — Villa Mimosas', dossier: 'd7', due: 'Demain', bucket: 'week', why: 'Portes ouvertes demain 10:30 · l’équipe doit connaître les points sensibles', saved: 30, assignee: 'a2', safe: true, ai: true, code: 'L2' },
  { id: 'q11', kind: 'offre', title: 'Offre écrite Dr. & Mme Achour — 940 k€', dossier: 'd6', due: 'Jeudi', bucket: 'week', why: 'Offre sous le prix de 4,6 % · à présenter au vendeur avec analyse', saved: 20, assignee: 'a3', safe: false, ai: false },
  { id: 'q12', kind: 'livrable', title: 'Courrier voisinage — 48 adresses Cap d’Antibes', dossier: 'd1', due: 'Vendredi', bucket: 'week', why: 'Adresses issues du cadastre · aucun appel, courrier uniquement', saved: 40, assignee: 'a6', safe: true, ai: true, code: 'L5' },
  { id: 'q13', kind: 'debrief', title: 'Compte rendu visite Verdier', dossier: 'd3', due: 'Ce soir', bucket: 'today', why: 'Visite de 9:45 terminée · retour acquéreur à partager au vendeur', saved: 15, assignee: 'a1', safe: true, ai: true },
  { id: 'q14', kind: 'piece', title: 'État daté — copropriété Belle Époque', dossier: 'd6', due: '21 oct.', bucket: 'later', why: 'Requis par Me Faure pour l’acte · délai syndic ~10 jours', saved: 10, assignee: 'a5', safe: true, ai: true },
  { id: 'q15', kind: 'relance', title: 'Relance Family Office Lindqvist — brochure', dossier: 'd1', due: '23 oct.', bucket: 'later', why: 'Brochure ouverte 4 fois · consentement email valide', saved: 10, assignee: 'a1', safe: true, ai: true },
  { id: 'q16', kind: 'livrable', title: 'Book de services — Famille Costa', dossier: 'd5', due: '26 oct.', bucket: 'later', why: 'Mandat semi-exclusif · objectif conversion en exclusif', saved: 50, assignee: 'a4', safe: true, ai: true, code: 'L6' },
]

/* ───────────────────────── Contacts ───────────────────────── */

export type Role = 'vendeur' | 'acquereur' | 'notaire' | 'diagnostiqueur' | 'syndic' | 'courtier' | 'photographe'
export const ROLE_L: Record<Role, string> = { vendeur: 'Vendeur', acquereur: 'Acquéreur', notaire: 'Notaire', diagnostiqueur: 'Diagnostiqueur', syndic: 'Syndic', courtier: 'Courtier', photographe: 'Photographe' }
export const PARTNER: Role[] = ['notaire', 'diagnostiqueur', 'syndic', 'courtier', 'photographe']

export type Channel = 'Téléphone' | 'SMS' | 'Email' | 'Courrier'
export type Purpose = 'Suivi de dossier' | 'Prospection' | 'Newsletter marché' | 'Partage partenaires'
export const CHANNELS: Channel[] = ['Téléphone', 'SMS', 'Email', 'Courrier']
export const PURPOSES: Purpose[] = ['Suivi de dossier', 'Prospection', 'Newsletter marché', 'Partage partenaires']
export type Consent = { ch: Channel; p: Purpose; ok: boolean | null; date?: string; proof?: string }
export type Contact = {
  id: string; name: string; photo?: string; org?: string; roles: Role[]; city: string; phone: string; email: string
  dossiers: string[]; score: number; last: string; pref: { ch: string; slot: string; lang: string; note?: string }
  consents: Consent[]; opposition?: { what: string; date: string }; history: { d: string; ch: Channel | 'RDV'; dir: 'in' | 'out'; s: string }[]
  dupOf?: string; dupWhy?: string
}

/** Matrice de consentements : suivi de dossier = base contractuelle, le reste = consentement explicite. */
const cs = (pros: Partial<Record<Channel, [boolean | null, string?, string?]>>, news?: [boolean, string, string], share?: [boolean, string, string]): Consent[] =>
  CHANNELS.flatMap((ch) => [
    { ch, p: 'Suivi de dossier' as Purpose, ok: ch === 'Courrier' || ch === 'Email' || ch === 'Téléphone' ? true : null, date: '—', proof: 'Base légale : exécution du mandat' },
    { ch, p: 'Prospection' as Purpose, ok: pros[ch]?.[0] ?? null, date: pros[ch]?.[1], proof: pros[ch]?.[2] },
    { ch, p: 'Newsletter marché' as Purpose, ok: ch === 'Email' ? news?.[0] ?? null : null, date: ch === 'Email' ? news?.[1] : undefined, proof: ch === 'Email' ? news?.[2] : undefined },
    { ch, p: 'Partage partenaires' as Purpose, ok: ch === 'Email' ? share?.[0] ?? null : null, date: ch === 'Email' ? share?.[1] : undefined, proof: ch === 'Email' ? share?.[2] : undefined },
  ])

export const CONTACTS: Contact[] = [
  { id: 'c1', name: 'Hélène Martin', photo: img('p-lea'), roles: ['vendeur'], city: 'Cap d’Antibes', phone: '+33 6 12 48 77 03', email: 'h.martin@orange.fr', dossiers: ['d1'], score: 92, last: 'Sam. · RDV agence',
    pref: { ch: 'Email', slot: 'Matin, avant 11 h', lang: 'Français', note: 'Préfère un récapitulatif écrit après chaque appel' },
    consents: cs({ Téléphone: [true, '14/03/2026', 'Case cochée · mandat d’estimation p. 4'], Email: [true, '14/03/2026', 'Double opt-in · horodaté 18:22'], SMS: [false, '14/03/2026', 'Refus explicite · formulaire'] }, [true, '14/03/2026', 'Double opt-in'], [true, '03/10/2026', 'Accord écrit · notaire & diagnostiqueur']),
    history: [{ d: '10 oct.', ch: 'RDV', dir: 'out', s: 'Remise L7 en agence — fourchette jugée cohérente, veut réfléchir au prix d’appel' }, { d: '09 oct.', ch: 'Email', dir: 'in', s: 'Envoi des plans et de la taxe foncière 2025' }, { d: '07 oct.', ch: 'RDV', dir: 'out', s: 'Estimation sur place — 2 h, visite complète, pool-house' }, { d: '03 oct.', ch: 'Téléphone', dir: 'in', s: 'Premier contact, recommandée par Me Faure' }] },
  { id: 'c2', name: 'Karim Haddad', photo: img('p-julien'), roles: ['vendeur'], city: 'Super Antibes', phone: '+33 6 71 20 54 98', email: 'karim.haddad@gmail.com', dossiers: ['d7'], score: 64, last: 'Il y a 40 min · RDV',
    pref: { ch: 'SMS', slot: 'Après 18 h', lang: 'Français', note: 'Situation sensible : ne jamais joindre le domicile' },
    consents: cs({ SMS: [true, '08/10/2026', 'Consentement oral enregistré · 0:42'], Email: [true, '08/10/2026', 'Formulaire web · IP hachée'] }, [false, '08/10/2026', 'Décoché']),
    history: [{ d: '12 oct.', ch: 'RDV', dir: 'out', s: 'Découverte — vente rapide souhaitée, prix ambitieux à travailler' }, { d: '08 oct.', ch: 'SMS', dir: 'in', s: 'Confirme le RDV de cet après-midi' }] },
  { id: 'c3', name: 'M. Haddad', roles: ['vendeur'], city: 'Antibes', phone: '+33 6 71 20 54 98', email: 'k.haddad@outlook.fr', dossiers: [], score: 20, last: 'Juin 2025 · import',
    pref: { ch: 'Téléphone', slot: '—', lang: 'Français' }, consents: cs({}), history: [{ d: 'juin 2025', ch: 'Email', dir: 'in', s: 'Demande d’estimation en ligne (ancien CRM)' }],
    dupOf: 'c2', dupWhy: 'Même téléphone · nom proche · même quartier' },
  { id: 'c4', name: 'Isabella Ricci', photo: img('p-sofia'), roles: ['vendeur', 'acquereur'], city: 'Juan-les-Pins', phone: '+33 6 03 88 14 52', email: 'isabella.ricci@icloud.com', dossiers: ['d3'], score: 81, last: 'Mer. · appel',
    pref: { ch: 'Téléphone', slot: 'Midi', lang: 'Italien / français' },
    consents: cs({ Téléphone: [true, '22/09/2026', 'Mandat exclusif · art. 9'], Email: [true, '22/09/2026', 'Mandat exclusif · art. 9'] }, [true, '22/09/2026', 'Double opt-in'], [false, '22/09/2026', 'Refus']),
    history: [{ d: '07 oct.', ch: 'Téléphone', dir: 'out', s: 'Point visites : 12 visites, retours sur la cuisine' }, { d: '22 sept.', ch: 'RDV', dir: 'out', s: 'Signature mandat exclusif' }] },
  { id: 'c5', name: 'Mme Ricci', roles: ['vendeur'], city: 'Juan-les-Pins', phone: '+39 347 220 1187', email: 'isabella.ricci@icloud.com', dossiers: [], score: 12, last: 'Portail · 2024',
    pref: { ch: 'Email', slot: '—', lang: 'Italien' }, consents: cs({}), history: [{ d: '2024', ch: 'Email', dir: 'in', s: 'Lead portail, sans suite' }],
    dupOf: 'c4', dupWhy: 'Même email · même ville' },
  { id: 'c6', name: 'Grace Okafor', photo: img('p-ines'), roles: ['acquereur'], city: 'Valbonne', phone: '+33 7 68 41 09 35', email: 'grace.okafor@proton.me', dossiers: ['d4'], score: 88, last: 'Aujourd’hui 16:00',
    pref: { ch: 'WhatsApp', slot: 'Soir', lang: 'Anglais / français' },
    consents: cs({ Téléphone: [true, '30/09/2026', 'Formulaire de visite signé'], SMS: [true, '30/09/2026', 'Formulaire de visite signé'], Email: [true, '30/09/2026', 'Formulaire de visite signé'] }, [true, '30/09/2026', 'Double opt-in'], [true, '02/10/2026', 'Accord courtier']),
    history: [{ d: '08 oct.', ch: 'RDV', dir: 'out', s: 'Visite Biot — coup de cœur, offre à 1,55 M€ le 10' }, { d: '30 sept.', ch: 'Email', dir: 'in', s: 'Demande recommandée par un ancien client' }] },
  { id: 'c7', name: 'Anders Lindqvist', photo: img('p-thomas'), org: 'Family Office Lindqvist', roles: ['acquereur'], city: 'Stockholm · Cap d’Antibes', phone: '+46 70 412 88 31', email: 'a.lindqvist@lfo.se', dossiers: ['d1'], score: 73, last: '4 oct. · email',
    pref: { ch: 'Email', slot: 'Heures CET', lang: 'Anglais' },
    consents: cs({ Email: [true, '13/09/2026', 'Opt-in salon MIPIM · badge scanné'], Téléphone: [false, '13/09/2026', 'Non sollicité'] }, [true, '13/09/2026', 'Opt-in']),
    history: [{ d: '04 oct.', ch: 'Email', dir: 'out', s: 'Brochure Villa Nielles (avant-première L3) — ouverte 4 fois' }] },
  { id: 'c8', name: 'Jean-Pierre Dubreuil', roles: ['vendeur'], city: 'Biot', phone: '+33 6 45 30 92 17', email: 'jp.dubreuil@free.fr', dossiers: ['d4'], score: 79, last: 'Hier · SMS',
    pref: { ch: 'Téléphone', slot: '8 h – 9 h', lang: 'Français', note: 'Mutation à Lyon : signature à distance possible' },
    consents: cs({ Téléphone: [true, '18/07/2026', 'Mandat exclusif'], SMS: [true, '18/07/2026', 'Mandat exclusif'] }),
    opposition: { what: 'Newsletter marché — désinscription', date: '02/09/2026' },
    history: [{ d: '11 oct.', ch: 'SMS', dir: 'in', s: 'D’accord pour contre-proposer à 1,59 M€' }, { d: '10 oct.', ch: 'RDV', dir: 'out', s: 'Présentation offre Okafor 1,55 M€' }] },
  { id: 'c9', name: 'Me Isabelle Faure', photo: img('p-claire'), org: 'Étude Faure & associés', roles: ['notaire'], city: 'Antibes', phone: '+33 4 93 34 12 00', email: 'i.faure@notaires.fr', dossiers: ['d6', 'd7'], score: 95, last: 'Ven. · visio',
    pref: { ch: 'Email', slot: 'Après-midi', lang: 'Français' }, consents: cs({ Email: [true, '01/01/2026', 'Convention partenaire'] }),
    history: [{ d: '09 oct.', ch: 'Téléphone', dir: 'out', s: 'Point compromis Belle Époque — état daté attendu' }, { d: '08 oct.', ch: 'RDV', dir: 'out', s: 'Déjeuner notaires' }] },
  { id: 'c10', name: 'Me Olivier Lenoir', photo: img('p-marc'), org: 'Étude Lenoir', roles: ['notaire'], city: 'Valbonne', phone: '+33 4 93 12 77 40', email: 'o.lenoir@notaires.fr', dossiers: ['d8'], score: 89, last: 'Aujourd’hui 16:30',
    pref: { ch: 'Téléphone', slot: 'Matin', lang: 'Français' }, consents: cs({ Email: [true, '01/01/2026', 'Convention partenaire'] }),
    history: [{ d: '10 oct.', ch: 'Email', dir: 'in', s: 'Projet d’acte Perrin transmis' }] },
  { id: 'c11', name: 'Diag Azur', org: 'Diagnostics immobiliers', roles: ['diagnostiqueur'], city: 'Antibes', phone: '+33 4 92 90 18 55', email: 'contact@diag-azur.fr', dossiers: ['d2', 'd5'], score: 58, last: 'Sam. · appel',
    pref: { ch: 'Téléphone', slot: '8 h – 12 h', lang: 'Français', note: 'Délai moyen DPE : 6 jours ouvrés' }, consents: cs({ Email: [true, '15/02/2026', 'Convention partenaire'] }),
    history: [{ d: '10 oct.', ch: 'Téléphone', dir: 'out', s: 'Relance DPE La Salis — passage prévu mardi 13' }] },
  { id: 'c12', name: 'Cabinet Azur Syndic', org: 'Syndic de copropriété', roles: ['syndic'], city: 'Antibes', phone: '+33 4 93 61 40 22', email: 'gestion@azur-syndic.fr', dossiers: ['d1', 'd6'], score: 41, last: '30 sept. · email',
    pref: { ch: 'Email', slot: 'Jours ouvrés', lang: 'Français', note: 'Répond en 8 jours en moyenne' }, consents: cs({ Email: [true, '15/02/2026', 'Relation professionnelle'] }),
    history: [{ d: '30 sept.', ch: 'Email', dir: 'out', s: 'Demande pré-état daté Belle Époque' }] },
  { id: 'c13', name: 'Camille Roux', photo: img('p-paul'), org: 'Riviera Courtage', roles: ['courtier'], city: 'Sophia Antipolis', phone: '+33 6 22 70 31 84', email: 'c.roux@riviera-courtage.fr', dossiers: ['d4', 'd6'], score: 84, last: 'Mer. · appel',
    pref: { ch: 'Téléphone', slot: 'Toute la journée', lang: 'Français' }, consents: cs({ Email: [true, '10/01/2026', 'Convention apporteur'] }),
    history: [{ d: '07 oct.', ch: 'Téléphone', dir: 'out', s: 'Accord de principe Okafor — 1,2 M€ sur 20 ans' }] },
  { id: 'c14', name: 'Hugo Lambert', photo: img('p-julien'), org: 'Studio Lumière Riviera', roles: ['photographe'], city: 'Cannes', phone: '+33 6 58 14 29 70', email: 'hugo@lumiere-riviera.fr', dossiers: ['d1', 'd5', 'd6'], score: 90, last: 'Jeu. · shooting',
    pref: { ch: 'SMS', slot: 'Flexible', lang: 'Français' }, consents: cs({ Email: [true, '10/01/2026', 'Contrat prestataire'] }),
    history: [{ d: '08 oct.', ch: 'RDV', dir: 'out', s: 'Shooting Belle Époque — 42 images livrées, originaux archivés' }] },
  { id: 'c15', name: 'Luc Verdier', roles: ['acquereur'], city: 'Lyon', phone: '+33 6 90 11 47 25', email: 'luc.verdier@gmail.com', dossiers: ['d3'], score: 77, last: 'Aujourd’hui 9:45',
    pref: { ch: 'Email', slot: 'Soir', lang: 'Français' },
    consents: cs({ Email: [true, '21/09/2026', 'Formulaire portail · opt-in'], Téléphone: [null] }, [true, '21/09/2026', 'Opt-in']),
    history: [{ d: '12 oct.', ch: 'RDV', dir: 'out', s: 'Visite penthouse — très intéressés, question sur les charges' }] },
  { id: 'c16', name: 'Bernard Achour', roles: ['acquereur'], city: 'Antibes', phone: '+33 6 34 56 02 81', email: 'dr.achour@medecin.fr', dossiers: ['d6'], score: 52, last: 'J-2 · lead',
    pref: { ch: 'Email', slot: '—', lang: 'Français' }, consents: cs({ Email: [true, '10/10/2026', 'Formulaire Leboncoin'] }),
    opposition: { what: 'Inscrit Bloctel · démarchage téléphonique', date: '11/08/2026' },
    history: [{ d: '10 oct.', ch: 'Email', dir: 'in', s: 'Demande de visite Belle Époque' }] },
]

/* ─────────────────────── Transactions ─────────────────────── */

export type TxStage = 'offre' | 'compromis' | 'conditions' | 'acte'
export const TX_STAGES: { id: TxStage; label: string }[] = [
  { id: 'offre', label: 'Offre acceptée' }, { id: 'compromis', label: 'Compromis' }, { id: 'conditions', label: 'Conditions suspensives' }, { id: 'acte', label: 'Acte authentique' },
]
export type CondState = 'levée' | 'en cours' | 'en retard' | 'à lancer'
export type Tx = {
  id: string; propertyId: string; dossier?: string; stage: TxStage; price: number; seller: string; buyer: string
  notaries: string; milestones: { l: string; d: string; s: 'done' | 'now' | 'todo' }[]
  conditions: { k: string; l: string; owner: string; due: string; s: CondState; proof?: string; relance?: string }[]
  pieces: { l: string; s: 'reçue' | 'demandée' | 'manquante'; from: string }[]
  fees: number; feePayer: 'acquéreur' | 'vendeur'; split: { agency: string; pct: number; role: string }[]
  deposit: number; sign: { m: number; d: number; h: number; label: string; place: string }
}

export const TXS: Tx[] = [
  { id: 'tx1', propertyId: 'p8', dossier: 'd8', stage: 'acte', price: 1255000, seller: 'M. & Mme Perrin', buyer: 'M. & Mme Castel', notaries: 'Me Lenoir (vendeur) · Me Bianchi (acquéreur)',
    milestones: [{ l: 'Offre acceptée', d: '29 juil.', s: 'done' }, { l: 'Compromis', d: '19 août', s: 'done' }, { l: 'Fin rétractation SRU', d: '30 août', s: 'done' }, { l: 'Conditions levées', d: '4 oct.', s: 'done' }, { l: 'Acte', d: '22 oct.', s: 'now' }],
    conditions: [
      { k: 'Prêt', l: 'Prêt 640 k€ · 1,9 % · 20 ans', owner: 'Riviera Courtage', due: '4 oct.', s: 'levée', proof: 'Offre de prêt BNP · 01/10' },
      { k: 'Préemption (DIA)', l: 'DIA mairie de Valbonne', owner: 'Me Lenoir', due: '19 oct.', s: 'levée', proof: 'Renonciation expresse · 23/09' },
      { k: 'Urbanisme', l: 'Note de renseignements d’urbanisme', owner: 'Me Lenoir', due: '16 sept.', s: 'levée', proof: 'NRU · aucune servitude' },
    ],
    pieces: [{ l: 'Titre de propriété', s: 'reçue', from: 'Vendeur' }, { l: 'Dossier de diagnostics (DDT)', s: 'reçue', from: 'Diag Azur' }, { l: 'Attestation SPANC assainissement', s: 'reçue', from: 'Mairie' }, { l: 'DAACT extension 2021', s: 'reçue', from: 'Vendeur' }, { l: 'Fonds — virement acquéreur', s: 'demandée', from: 'Me Bianchi' }],
    fees: 62000, feePayer: 'acquéreur', split: [{ agency: 'Biot · Valbonne', pct: 100, role: 'Mandat & vente' }],
    deposit: 62750, sign: { m: 9, d: 22, h: 10, label: 'Jeu. 22 oct. · 10:00', place: 'Étude Lenoir, Valbonne' } },
  { id: 'tx2', propertyId: 'p6', dossier: 'd6', stage: 'conditions', price: 965000, seller: 'Mme Garnier-Blanc', buyer: 'M. Navarro', notaries: 'Me Faure (les deux parties)',
    milestones: [{ l: 'Offre acceptée', d: '29 août', s: 'done' }, { l: 'Compromis', d: '13 sept.', s: 'done' }, { l: 'Fin rétractation SRU', d: '24 sept.', s: 'done' }, { l: 'Conditions', d: '25 oct.', s: 'now' }, { l: 'Acte', d: '30 nov.', s: 'todo' }],
    conditions: [
      { k: 'Prêt', l: 'Prêt 720 k€ · taux max 3,4 %', owner: 'Camille Roux · courtier', due: '25 oct.', s: 'en cours', relance: 'Relance auto J-7 programmée · 18 oct.' },
      { k: 'Préemption (DIA)', l: 'DIA mairie d’Antibes · délai 2 mois', owner: 'Me Faure', due: '15 nov.', s: 'en cours', proof: 'DIA déposée · 15/09' },
      { k: 'Urbanisme', l: 'Absence de servitude grevant le bien', owner: 'Me Faure', due: '11 oct.', s: 'levée', proof: 'NRU reçue · 03/10' },
    ],
    pieces: [{ l: 'Titre de propriété', s: 'reçue', from: 'Vendeur' }, { l: 'DDT complet', s: 'reçue', from: 'Diag Azur' }, { l: 'État daté', s: 'demandée', from: 'Cabinet Azur Syndic' }, { l: 'PV d’AG des 3 dernières années', s: 'reçue', from: 'Syndic' }, { l: 'Règlement de copropriété', s: 'reçue', from: 'Syndic' }, { l: 'Fiche synthétique copro', s: 'manquante', from: 'Syndic' }],
    fees: 48000, feePayer: 'acquéreur', split: [{ agency: 'Juan-les-Pins', pct: 60, role: 'Mandat' }, { agency: 'Cannes Croisette', pct: 40, role: 'Acquéreur · inter-agences' }],
    deposit: 48250, sign: { m: 10, d: 30, h: 11, label: 'Lun. 30 nov. · 11:00', place: 'Étude Faure, Antibes' } },
  { id: 'tx3', propertyId: 'p7', dossier: 'd7', stage: 'compromis', price: 2120000, seller: 'M. Haddad', buyer: 'M. Serrano', notaries: 'Me Faure (vendeur) · Me Costa (acquéreur)',
    milestones: [{ l: 'Offre acceptée', d: '11 oct.', s: 'done' }, { l: 'Compromis', d: '29 oct.', s: 'now' }, { l: 'Fin rétractation SRU', d: '8 nov.', s: 'todo' }, { l: 'Conditions', d: '23 déc.', s: 'todo' }, { l: 'Acte', d: '1er févr.', s: 'todo' }],
    conditions: [
      { k: 'Prêt', l: 'Prêt 1,4 M€ · 25 ans', owner: 'M. Serrano', due: '23 déc.', s: 'à lancer', relance: 'Attestation de financement manquante' },
      { k: 'Préemption (DIA)', l: 'DIA à déposer après compromis', owner: 'Me Faure', due: '29 déc.', s: 'à lancer' },
      { k: 'Urbanisme', l: 'Conformité piscine (déclaration préalable)', owner: 'Me Faure', due: '16 nov.', s: 'en retard', relance: 'Vendeur relancé 2 fois · DP introuvable' },
      { k: 'Vente préalable', l: 'Vente de l’appartement de l’acquéreur', owner: 'M. Serrano', due: '16 déc.', s: 'en cours' },
    ],
    pieces: [{ l: 'Titre de propriété', s: 'reçue', from: 'Vendeur' }, { l: 'DDT complet', s: 'demandée', from: 'Diag Azur' }, { l: 'Déclaration préalable piscine', s: 'manquante', from: 'Vendeur' }, { l: 'Attestation de financement', s: 'manquante', from: 'Acquéreur' }, { l: 'Jugement de divorce (pouvoir de vendre)', s: 'demandée', from: 'Vendeur' }],
    fees: 106000, feePayer: 'acquéreur', split: [{ agency: 'Antibes Vieille-Ville', pct: 70, role: 'Mandat & acquéreur' }, { agency: 'Cap d’Antibes', pct: 30, role: 'Apport acquéreur' }],
    deposit: 212000, sign: { m: 9, d: 29, h: 14, label: 'Jeu. 29 oct. · 14:00', place: 'Étude Faure, Antibes' } },
  { id: 'tx4', propertyId: 'p4', dossier: 'd4', stage: 'offre', price: 1590000, seller: 'M. Dubreuil', buyer: 'Mme Okafor', notaries: 'À désigner',
    milestones: [{ l: 'Offre 1,55 M€', d: '10 oct.', s: 'done' }, { l: 'Contre-offre 1,59 M€', d: '12 oct.', s: 'now' }, { l: 'Compromis', d: '5 nov.', s: 'todo' }, { l: 'Conditions', d: '20 déc.', s: 'todo' }, { l: 'Acte', d: '1er févr.', s: 'todo' }],
    conditions: [
      { k: 'Prêt', l: 'Prêt 1,2 M€ · accord de principe', owner: 'Camille Roux · courtier', due: '20 déc.', s: 'en cours', proof: 'Accord de principe · 07/10' },
      { k: 'Préemption (DIA)', l: 'DIA mairie de Biot', owner: 'Notaire vendeur', due: '—', s: 'à lancer' },
    ],
    pieces: [{ l: 'Offre écrite signée', s: 'reçue', from: 'Acquéreur' }, { l: 'Contre-offre signée vendeur', s: 'reçue', from: 'Vendeur' }, { l: 'DDT complet', s: 'reçue', from: 'Diag Azur' }, { l: 'Pièces d’identité acquéreur', s: 'demandée', from: 'Acquéreur' }],
    fees: 79500, feePayer: 'vendeur', split: [{ agency: 'Biot · Valbonne', pct: 100, role: 'Mandat & vente' }],
    deposit: 0, sign: { m: 9, d: 12, h: 18, label: 'Aujourd’hui · expire 18:00', place: 'Agence Biot' } },
  { id: 'tx5', propertyId: 'p5', stage: 'compromis', price: 2690000, seller: 'Indivision Costa-Bruni', buyer: 'M. Keller', notaries: 'Me Lenoir · Me Faure',
    milestones: [{ l: 'Offre acceptée', d: '2 oct.', s: 'done' }, { l: 'Compromis', d: '10 oct.', s: 'done' }, { l: 'Fin rétractation SRU', d: '21 oct.', s: 'now' }, { l: 'Conditions', d: '6 déc.', s: 'todo' }, { l: 'Acte', d: '18 janv.', s: 'todo' }],
    conditions: [
      { k: 'Prêt', l: 'Achat comptant · sans condition', owner: '—', due: '—', s: 'levée', proof: 'Attestation de fonds · banque privée' },
      { k: 'Préemption (DIA)', l: 'DIA mairie d’Antibes', owner: 'Me Lenoir', due: '10 déc.', s: 'en cours', proof: 'DIA déposée · 12/10' },
      { k: 'Urbanisme', l: 'Certificat d’urbanisme opérationnel', owner: 'Me Lenoir', due: '6 déc.', s: 'en cours' },
    ],
    pieces: [{ l: 'Titre de propriété', s: 'reçue', from: 'Vendeur' }, { l: 'Attestation dévolutive (succession)', s: 'demandée', from: 'Me Lenoir' }, { l: 'DDT complet', s: 'reçue', from: 'Diag Azur' }, { l: 'Accord écrit des 3 indivisaires', s: 'reçue', from: 'Vendeurs' }],
    fees: 134500, feePayer: 'vendeur', split: [{ agency: 'Cap d’Antibes', pct: 50, role: 'Mandat' }, { agency: 'Mougins', pct: 50, role: 'Acquéreur · inter-agences' }],
    deposit: 269000, sign: { m: 0, d: 18, h: 10, label: 'Lun. 18 janv. · 10:00', place: 'Étude Lenoir, Valbonne' } },
]

/** Échéancier d’honoraires attendus par mois (k€). */
export const FEES_BY_MONTH = [{ m: 'Oct.', v: 62 }, { m: 'Nov.', v: 48 }, { m: 'Déc.', v: 0 }, { m: 'Janv.', v: 320 }, { m: 'Févr.', v: 0 }]
