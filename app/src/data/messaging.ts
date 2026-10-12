// Messagerie unifiée — amorce de démonstration (données synthétiques).
import { img } from './mock'

export type Channel = 'whatsapp' | 'email' | 'sms' | 'internal' | 'portal'
export type Conversation = {
  id: string; title: string; channel: Channel; kind: 'direct' | 'channel'; avatar?: string; subtitle?: string
  contactId?: string; dossierId?: string; eventIds?: string[]; participants?: string[]; tags: string[]; unread: number
  pinned?: boolean; status: 'open' | 'done' | 'snoozed'; snoozedUntil?: string; assignee?: string; lastAt: string; lastText: string
  optIn?: boolean; windowUntil?: string; topic?: string; private?: boolean
}
export type Message = {
  id: string; conversationId: string; dir: 'in' | 'out' | 'internal'; author: string; text: string; at: string; channel: Channel
  status: string; template?: string; attachments?: { name: string; kind: 'pdf' | 'image' | 'link'; ref?: string }[]
  reactions?: Record<string, number>; pinned?: boolean; scheduleAt?: string; ai?: boolean
}
export type Template = { id: string; name: string; channel: Channel; category: string; body: string; approved: boolean; uses?: number }
export type Reminder = { id: string; kind: 'whatsapp' | 'sms' | 'email'; rule: 'J-1' | 'H-2' | 'manuel'; eventId?: string; dossierId?: string; target: string; text: string; template?: string; dueAt: string; status: 'programmé' | 'consigné' | 'annulé'; createdBy: string; conversationId?: string }

export const CHANNEL_META: Record<Channel, { label: string; short: string }> = {
  whatsapp: { label: 'WhatsApp', short: 'WA' }, email: { label: 'E-mail', short: 'Mail' }, sms: { label: 'SMS', short: 'SMS' },
  internal: { label: 'Équipe', short: '#' }, portal: { label: 'Portails', short: 'Lead' },
}
/** Tags suggérés (le classement automatique AUT-112 en ajoute aussi). */
export const TAGS = ['Vendeur', 'Acquéreur', 'Offre', 'Visite', 'Pièces', 'Urgent', 'Notaire', 'Off-market', 'International', 'VIP', 'Rappel', 'Financement']

const t = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).toISOString()
const fut = (hours: number) => new Date(Date.now() + hours * 3600e3).toISOString()

export const CONVERSATIONS: Conversation[] = [
  { id: 'cv1', title: 'Hélène Martin', subtitle: 'Vendeuse · Villa contemporaine vue mer', channel: 'whatsapp', kind: 'direct', avatar: img('p-lea'), contactId: 'c1', dossierId: 'd1', tags: ['Vendeur', 'VIP', 'Pièces'], unread: 2, pinned: true, status: 'open', assignee: 'a1', lastAt: t(12, 9, 42), lastText: 'Le syndic dit que le PV d’AG arrive lundi. On maintient 14 h pour l’estimation ?', optIn: true, windowUntil: fut(20) },
  { id: 'cv2', title: 'M. & Mme Verdier', subtitle: 'Acquéreurs · budget 1,7 – 2 M€', channel: 'whatsapp', kind: 'direct', avatar: img('p-julien'), dossierId: 'd3', eventIds: ['e18'], tags: ['Acquéreur', 'Visite', 'Financement'], unread: 1, status: 'open', assignee: 'a3', lastAt: t(12, 8, 55), lastText: 'Pouvez-vous nous envoyer le plan du toit-terrasse avant la visite ?', optIn: true, windowUntil: fut(22) },
  { id: 'cv3', title: 'Mme Okafor', subtitle: 'Acquéreuse · Maison d’architecte Biot', channel: 'sms', kind: 'direct', avatar: img('p-ines'), dossierId: 'd4', tags: ['Acquéreur', 'Offre', 'Urgent'], unread: 1, status: 'open', assignee: 'a7', lastAt: t(12, 8, 31), lastText: 'OK pour 1,59 M€ si les meubles de jardin restent. Réponse avant 18 h ?' },
  { id: 'cv4', title: 'Family Office Lindqvist', subtitle: 'Acquéreur international · 4 – 6 M€', channel: 'email', kind: 'direct', avatar: img('p-paul'), dossierId: 'd11', tags: ['Acquéreur', 'International', 'Off-market', 'VIP'], unread: 0, status: 'open', assignee: 'a2', lastAt: t(11, 19, 4), lastText: 'Thank you — we would like a private viewing of the Garoupe villa next Tuesday.' },
  { id: 'cv5', title: 'Me Faure — notaire', subtitle: 'Notaire vendeur · dossier Garnier-Blanc', channel: 'email', kind: 'direct', avatar: img('p-marc'), dossierId: 'd6', tags: ['Notaire', 'Pièces'], unread: 0, status: 'open', assignee: 'a5', lastAt: t(11, 16, 20), lastText: 'Projet d’acte reçu de la banque, il manque l’attestation d’assurance DO.' },
  { id: 'cv6', title: 'Lead SeLoger — Thomas Brun', subtitle: 'Demande d’information · Villa Mimosas', channel: 'portal', kind: 'direct', avatar: img('p-thomas'), dossierId: 'd7', tags: ['Acquéreur'], unread: 1, status: 'open', lastAt: t(12, 7, 12), lastText: 'Bonjour, le bien est-il toujours disponible ? Nous sommes primo-accédants avec un accord de principe.' },
  { id: 'cv7', title: 'M. Haddad', subtitle: 'Vendeur · Villa moderne & piscine', channel: 'whatsapp', kind: 'direct', avatar: img('p-thomas'), dossierId: 'd7', tags: ['Vendeur', 'Urgent'], unread: 0, status: 'open', assignee: 'a2', lastAt: t(11, 22, 10), lastText: 'Merci pour la visite, je veux aller vite. Vous pouvez m’appeler demain matin ?', optIn: true, windowUntil: fut(9) },
  { id: 'cv8', title: 'Famille Costa', subtitle: 'Vendeurs · Villa néo-provençale', channel: 'whatsapp', kind: 'direct', avatar: img('p-sofia'), dossierId: 'd5', eventIds: ['e19'], tags: ['Vendeur', 'Rappel'], unread: 0, status: 'open', assignee: 'a4', lastAt: t(10, 18, 0), lastText: 'Rappel : RDV demain 11 h au 41 route de Grasse avec Julien Arnaud.', optIn: true },
  { id: 'cv9', title: 'M. Keller', subtitle: 'Acquéreur · Les Combes / La Salis', channel: 'email', kind: 'direct', avatar: img('p-paul'), tags: ['Acquéreur'], unread: 0, status: 'done', lastAt: t(9, 11, 40), lastText: 'Parfait, à samedi pour les deux visites.' },
  { id: 'ch1', title: 'antibes-vieille-ville', topic: 'Équipe de l’agence · briefs, dossiers du jour', channel: 'internal', kind: 'channel', tags: [], unread: 3, pinned: true, status: 'open', lastAt: t(12, 9, 15), lastText: 'Sofia : mandat exclusif signé sur le penthouse Baudoin 🎉', participants: ['a1', 'a2', 'a3', 'a4', 'a5'] },
  { id: 'ch2', title: 'acquéreurs-qualifiés', topic: 'Partage inter-agences des recherches actives', channel: 'internal', kind: 'channel', tags: [], unread: 1, status: 'open', lastAt: t(12, 8, 40), lastText: 'Paul : qui a une maison 5 p. à Valbonne < 1,4 M€ ? Client financé.', participants: ['a1', 'a2', 'a3', 'a4', 'a7'] },
  { id: 'ch3', title: 'off-market', topic: 'Biens confidentiels — accès restreint', channel: 'internal', kind: 'channel', private: true, tags: ['Off-market'], unread: 0, status: 'open', lastAt: t(11, 17, 2), lastText: 'Marc : SCI Garoupe OK pour 3 visites privées max.', participants: ['a1', 'a2'] },
  { id: 'ch4', title: 'marketing-réseau', topic: 'Kits sociaux, visuels, validations AI Act', channel: 'internal', kind: 'channel', tags: [], unread: 0, status: 'open', lastAt: t(11, 15, 30), lastText: 'Léa : nouveau gabarit L4 publié pour toutes les agences.', participants: ['a1', 'a6', 'a8'] },
]

const M = (id: string, conversationId: string, dir: Message['dir'], author: string, text: string, at: string, channel: Channel, extra: Partial<Message> = {}): Message =>
  ({ id, conversationId, dir, author, text, at, channel, status: dir === 'in' ? 'lu' : dir === 'internal' ? 'distribué' : 'consigné', ...extra })

export const MESSAGES: Message[] = [
  M('m1', 'cv1', 'out', 'Claire Delmas', 'Bonjour Hélène, l’analyse de valeur est prête. Je vous propose de la parcourir ensemble lundi 14 h en visio.', t(10, 17, 2), 'whatsapp'),
  M('m2', 'cv1', 'in', 'Hélène Martin', 'Parfait pour lundi 14 h. Mon mari sera là aussi.', t(10, 18, 30), 'whatsapp', { reactions: { '👍': 1 } }),
  M('m3', 'cv1', 'out', 'Claire Delmas', 'Merci ! Pour finaliser le dossier copro il nous manque le PV d’AG 2025. Pouvez-vous relancer le syndic ?', t(11, 9, 5), 'whatsapp'),
  M('m4', 'cv1', 'in', 'Hélène Martin', 'Je les appelle ce matin.', t(11, 9, 20), 'whatsapp'),
  M('m5', 'cv1', 'in', 'Hélène Martin', 'Le syndic dit que le PV d’AG arrive lundi. On maintient 14 h pour l’estimation ?', t(12, 9, 42), 'whatsapp', { status: 'reçu' }),
  M('m6', 'cv2', 'out', 'Sofia Benali', 'Bonjour ! Visite confirmée aujourd’hui 9 h 45 au 22 boulevard Baudoin. Le gardien vous ouvrira.', t(11, 18, 0), 'whatsapp', { template: 'tpl-visite' }),
  M('m7', 'cv2', 'in', 'M. Verdier', 'Pouvez-vous nous envoyer le plan du toit-terrasse avant la visite ?', t(12, 8, 55), 'whatsapp', { status: 'reçu' }),
  M('m8', 'cv3', 'in', 'Mme Okafor', 'Nous avons bien réfléchi après la contre-visite.', t(12, 8, 29), 'sms'),
  M('m9', 'cv3', 'in', 'Mme Okafor', 'OK pour 1,59 M€ si les meubles de jardin restent. Réponse avant 18 h ?', t(12, 8, 31), 'sms', { status: 'reçu' }),
  M('m10', 'cv4', 'out', 'Marc Olivieri', 'Dear Mr Lindqvist, please find attached the confidential brochure for the Garoupe villa (off-market).', t(11, 10, 12), 'email', { attachments: [{ name: 'Brochure-Garoupe-confidentielle.pdf', kind: 'pdf' }] }),
  M('m11', 'cv4', 'in', 'E. Lindqvist', 'Thank you — we would like a private viewing of the Garoupe villa next Tuesday.', t(11, 19, 4), 'email'),
  M('m12', 'cv5', 'in', 'Me Faure', 'Projet d’acte reçu de la banque, il manque l’attestation d’assurance DO.', t(11, 16, 20), 'email', { attachments: [{ name: 'Projet-acte-v2.pdf', kind: 'pdf' }] }),
  M('m13', 'cv6', 'in', 'Thomas Brun', 'Bonjour, le bien est-il toujours disponible ? Nous sommes primo-accédants avec un accord de principe.', t(12, 7, 12), 'portal', { status: 'reçu' }),
  M('m14', 'cv7', 'in', 'M. Haddad', 'Merci pour la visite, je veux aller vite. Vous pouvez m’appeler demain matin ?', t(11, 22, 10), 'whatsapp'),
  M('m15', 'cv8', 'out', 'Rappel automatique', 'Rappel : RDV demain 11 h au 41 route de Grasse avec Julien Arnaud.', t(10, 18, 0), 'whatsapp', { template: 'tpl-rdv', status: 'consigné · connecteur WhatsApp Business non configuré' }),
  M('m16', 'cv9', 'in', 'M. Keller', 'Parfait, à samedi pour les deux visites.', t(9, 11, 40), 'email'),
  M('m17', 'ch1', 'internal', 'Copilote', 'Brief du matin : 5 décisions en attente, 3 RDV, contre-offre Dubreuil à traiter avant 18 h.', t(12, 7, 30), 'internal', { ai: true, pinned: true }),
  M('m18', 'ch1', 'internal', 'Marc Olivieri', 'Point dossiers à 8 h 30, on commence par Martin et Haddad.', t(12, 8, 2), 'internal'),
  M('m19', 'ch1', 'internal', 'Sofia Benali', 'Mandat exclusif signé sur le penthouse Baudoin 🎉', t(12, 9, 15), 'internal', { reactions: { '🎉': 4, '👏': 2 } }),
  M('m20', 'ch2', 'internal', 'Paul Garnier', 'Qui a une maison 5 p. à Valbonne < 1,4 M€ ? Client financé.', t(12, 8, 40), 'internal'),
  M('m21', 'ch3', 'internal', 'Marc Olivieri', 'SCI Garoupe OK pour 3 visites privées max.', t(11, 17, 2), 'internal'),
  M('m22', 'ch4', 'internal', 'Léa Fontaine', 'Nouveau gabarit L4 publié pour toutes les agences. Étiquette « Image retouchée — IA » intégrée.', t(11, 15, 30), 'internal', { attachments: [{ name: 'Gabarit-L4-v3.png', kind: 'image' }] }),
]

export const TEMPLATES: Template[] = [
  { id: 'tpl-rdv', name: 'Rappel de rendez-vous', channel: 'whatsapp', category: 'Rappels', approved: true, uses: 48, body: 'Bonjour {{prenom}}, je vous rappelle notre rendez-vous {{date}} à {{heure}} — {{lieu}}. À très vite, {{conseiller}}.' },
  { id: 'tpl-visite', name: 'Confirmation de visite', channel: 'whatsapp', category: 'Visites', approved: true, uses: 63, body: 'Bonjour {{prenom}}, votre visite de {{bien}} est confirmée {{date}} à {{heure}} ({{lieu}}). Répondez « 1 » pour confirmer, « 2 » pour décaler.' },
  { id: 'tpl-retour', name: 'Retour après visite', channel: 'whatsapp', category: 'Visites', approved: true, uses: 22, body: 'Merci {{prenom}} pour votre visite de {{bien}}. Qu’en avez-vous pensé ? Un mot suffit, je le transmets au vendeur.' },
  { id: 'tpl-bilan', name: 'Bilan vendeur hebdomadaire', channel: 'whatsapp', category: 'Suivi vendeur', approved: true, uses: 17, body: 'Bonjour {{prenom}}, votre bilan de la semaine est prêt : visites, retours et prochaines actions. Je vous l’envoie par e-mail ?' },
  { id: 'tpl-pieces', name: 'Relance de pièces', channel: 'email', category: 'Pièces', approved: true, uses: 31, body: 'Bonjour {{prenom}},\n\nPour avancer sur votre dossier, il nous manque : {{pieces}}.\nVous pouvez les déposer directement sur votre espace sécurisé.\n\nBien à vous,\n{{conseiller}}' },
  { id: 'tpl-offre', name: 'Accusé de réception d’offre', channel: 'sms', category: 'Offres', approved: true, uses: 9, body: 'Bonjour {{prenom}}, votre offre est bien reçue et transmise au vendeur. Réponse au plus tard {{date}}. {{conseiller}}' },
  { id: 'tpl-consent', name: 'Demande de consentement WhatsApp', channel: 'email', category: 'Conformité', approved: true, uses: 12, body: 'Bonjour {{prenom}}, acceptez-vous d’être contacté(e) par WhatsApp pour le suivi de votre projet ? Répondez OUI pour confirmer. Vous pourrez retirer votre accord à tout moment.' },
  { id: 'tpl-lead', name: 'Réponse à un lead portail', channel: 'portal', category: 'Acquisition', approved: true, uses: 40, body: 'Bonjour {{prenom}}, merci pour votre intérêt pour {{bien}}. Il est toujours disponible : je vous propose une visite {{date}}. Avez-vous déjà un accord de financement ?' },
]

export const REMINDERS: Reminder[] = [
  { id: 'rm1', kind: 'whatsapp', rule: 'J-1', eventId: 'e19', dossierId: 'd5', target: 'Famille Costa', text: 'Rappel : RDV demain 11 h au 41 route de Grasse avec Julien Arnaud.', template: 'tpl-rdv', dueAt: t(10, 18, 0), status: 'consigné', createdBy: 'Routine AUT-110', conversationId: 'cv8' },
  { id: 'rm2', kind: 'whatsapp', rule: 'H-2', eventId: 'e18', dossierId: 'd3', target: 'M. & Mme Verdier', text: 'Votre visite du penthouse Baudoin est dans 2 h (22 bd Baudoin, Juan-les-Pins).', template: 'tpl-visite', dueAt: fut(1.5), status: 'programmé', createdBy: 'Routine AUT-110', conversationId: 'cv2' },
  { id: 'rm3', kind: 'whatsapp', rule: 'manuel', dossierId: 'd1', target: 'Hélène Martin', text: 'Bonjour Hélène, je vous rappelle notre visio de 14 h pour l’analyse de valeur. Lien envoyé par e-mail.', template: 'tpl-rdv', dueAt: fut(3), status: 'programmé', createdBy: 'Claire Delmas', conversationId: 'cv1' },
]
