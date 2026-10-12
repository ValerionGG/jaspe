// Extraction de champs D5 depuis un débrief vocal : règles simples et explicables, chaque proposition est validée par le conseiller.
// ponytail: regex sur le texte, pas de NLP — suffisant pour un débrief dicté ; brancher le copilote serveur si le rappel devient trop faible.
import type { Journey } from '../../data/dossier'

export type Proposal = { key: string; value: string; why: string }

const sentences = (t: string) => t.split(/(?<=[.!?…])(?<!\b(?:M|Me|Mme|Dr)\.)\s+|\n+/).map((s) => s.trim()).filter(Boolean)
const firstSentence = (t: string, re: RegExp) => sentences(t).find((s) => re.test(s))
const clean = (s: string) => s.replace(/\s+/g, ' ').replace(/[.;,]+$/, '').trim()
const num = (s: string) => s.replace(/[\s]/g, '')
const grp = (s: string) => num(s).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

const MOTIVES: [RegExp, string][] = [
  [/retraite/i, 'Départ à la retraite'], [/mutation/i, 'Mutation professionnelle'], [/divorc|séparation/i, 'Séparation'],
  [/succession|héritage|héritiers/i, 'Succession'], [/expatri|étranger|dubaï|londres/i, 'Expatriation'], [/agrandi|plus grand|naissance/i, 'Agrandissement de la famille'],
  [/investi|arbitrage/i, 'Arbitrage patrimonial'],
]

/** Propose des valeurs de champs D5 à partir d’un texte libre (débrief dicté ou saisi). */
export function extractFields(text: string): Proposal[] {
  const t = text.replace(/[’']/g, '’')
  const out: Proposal[] = []
  const add = (key: string, value: string | null | undefined, why: string) => { if (value && !out.some((p) => p.key === key)) out.push({ key, value: clean(value), why }) }

  // Surfaces : le terrain d’abord pour ne pas le confondre avec l’habitable.
  const land = t.match(/terrain\s+(?:de\s+)?(\d[\d\s]*)\s?m(?:²|2)/i)
  add('terrain', land && grp(land[1]), 'surface suivie de « terrain »')
  const hab = [...t.matchAll(/(\d[\d\s]{0,5})\s?m(?:²|2)(?!\w)/gi)].find((m) => !/terrain\s+(?:de\s+)?$/i.test(t.slice(Math.max(0, m.index! - 14), m.index)))
  add('surface', hab && num(hab[1]), 'surface en m² citée')

  const price = t.match(/(\d+(?:[,.]\d+)?)\s?(?:M€|millions?(?:\s+d’euros)?)/i)
  add('prixSouhaite', price && `${price[1].replace('.', ',')} M€`, 'montant en millions')
  const k = t.match(/(\d[\d\s]{2,})\s?(?:k€|000\s?€)/i)
  if (!price && k) add('prixSouhaite', `${num(k[1])} k€`, 'montant en euros')

  const ch = t.match(/(\d+)\s+chambres?/i), pc = t.match(/(\d+)\s+pièces?/i)
  if (ch || pc) add('pieces', [pc && `${pc[1]} pièces`, ch && `${ch[1]} chambres`].filter(Boolean).join(' · '), 'pièces / chambres citées')
  const dpe = t.match(/DPE\s+(?:en\s+|classé\s+|de\s+)?([A-G])\b/i)
  add('dpe', dpe && dpe[1].toUpperCase(), 'classe DPE citée')
  const year = t.match(/(?:construite?|bâtie?|date)\s+(?:en\s+)?(1[89]\d\d|20[0-2]\d)/i)
  add('annee', year?.[1], 'année de construction')
  const tf = t.match(/taxe foncière[^\d]{0,20}(\d[\d\s]*)\s?€/i)
  add('taxeFonciere', tf && `${grp(tf[1])} €`, 'montant de taxe foncière')
  const charges = t.match(/charges[^\d]{0,20}(\d[\d\s]*)\s?€/i)
  add('charges', charges && `${grp(charges[1])} €/an`, 'montant de charges')

  const motive = MOTIVES.find(([re]) => re.test(t))
  add('motivation', motive && (firstSentence(t, motive[0]) ?? motive[1]), `motif « ${motive?.[1].toLowerCase()} »`)
  const horizon = t.match(/(?:avant|d’ici|pour)\s+(l’été|la rentrée|l’hiver|le printemps|la fin de l’année|fin\s+\w+|\w+\s+20\d\d|\d+\s+mois)(?:\s+20\d\d)?/i)
  add('horizon', horizon && horizon[0], 'échéance citée')
  add('travaux', firstSentence(t, /refait|rénov|travaux|factures?/i), 'phrase sur les travaux')
  add('strategie', firstSentence(t, /exclusivit|prix d’appel|mandat/i), 'phrase sur le mandat ou le prix')
  add('experience', firstSentence(t, /déçu|agence en \d{4}|ancienne agence|mauvaise expérience/i), 'expérience passée avec une agence')
  add('craintes', firstSentence(t, /crain|peur|inquiet|curieux|attention/i), 'crainte exprimée')
  const eq = ['piscine', 'domotique', 'climatisation', 'pool-house', 'jacuzzi', 'panneaux solaires', 'ascenseur'].filter((w) => new RegExp(w, 'i').test(t))
  add('equipements', eq.length ? eq.map((w, i) => (i ? w : w[0].toUpperCase() + w.slice(1))).join(', ') : undefined, 'équipements cités')
  add('exposition', firstSentence(t, /vue (mer|dégagée|panoramique)|exposé|plein sud/i), 'vue ou exposition')
  add('stationnement', firstSentence(t, /garage|parking|places?\s+de\s+stationnement/i), 'stationnement cité')
  add('decideurs', firstSentence(t, /héritiers|accord|tous les deux|signer|décid/i), 'décideurs ou accord')
  add('contactPref', firstSentence(t, /par e-?mail|par téléphone|whatsapp|pas avant|visio/i), 'préférence de contact')
  add('nuisances', firstSentence(t, /bruit|nuisance|route passante|voisin/i), 'nuisance évoquée')
  return out
}

// ——— Modèle partagé Préparation / Découverte ———

/** Sections du parcours ajoutées par la préparation (stockées dans `journey`, fusion superficielle). */
export type PrepState = { checklist?: Record<string, boolean>; identityConfirmed?: boolean; custom?: string[] }
export type JourneyX = Journey & { prep?: PrepState; photoRooms?: Record<string, string> }

/** Champs sans lesquels L1–L9 ne peuvent pas être fiables. */
export const CRITICAL = ['motivation', 'horizon', 'decideurs', 'prixSouhaite', 'surface', 'pieces', 'dpe', 'regime', 'taxeFonciere'] as const

/** Question ouverte à poser pour chaque champ du guide D5. */
export const QUESTIONS: Record<string, string> = {
  motivation: 'Qu’est-ce qui vous amène à envisager la vente aujourd’hui ?', horizon: 'À quelle date aimeriez-vous être installés ailleurs ?', decideurs: 'Qui participe à la décision, et tout le monde est-il d’accord ?', projetSuivant: 'Quel est votre projet après la vente ?',
  prixSouhaite: 'Quel prix avez-vous en tête, et sur quoi vous appuyez-vous ?', experience: 'Avez-vous déjà travaillé avec une agence ? Qu’avez-vous apprécié, ou regretté ?', contactPref: 'Comment et quand préférez-vous être tenus informés ?', craintes: 'Qu’est-ce qui vous inquiète le plus dans cette vente ?',
  surface: 'Quelle est la surface habitable mesurée ? Avez-vous un certificat ?', terrain: 'Quelle est la surface du terrain au cadastre ?', pieces: 'Combien de pièces et de chambres compte la maison ?', annee: 'En quelle année la maison a-t-elle été construite ?', etat: 'Comment décririez-vous l’état général du bien ?',
  travaux: 'Quels travaux avez-vous réalisés, et quand ? Avez-vous les factures ?', equipements: 'Quels équipements souhaitez-vous mettre en avant ?', dpe: 'Avez-vous un DPE récent ? Quelle classe ?', exposition: 'Comment la lumière circule-t-elle au fil de la journée ?', stationnement: 'Comment se gare-t-on chez vous ?',
  transports: 'Quels transports utilisez-vous au quotidien ?', ecoles: 'Quelles écoles fréquentent les familles du quartier ?', commerces: 'Où faites-vous vos courses ?', plage: 'À combien êtes-vous de la plage, à pied ?', nuisances: 'Y a-t-il des bruits ou nuisances à certaines heures ?',
  regime: 'La maison dépend-elle d’une copropriété ou d’une ASL ?', charges: 'À combien s’élèvent les charges annuelles ?', taxeFonciere: 'Quel est le montant de votre dernière taxe foncière ?', travauxVotes: 'Des travaux ont-ils été votés ou sont-ils envisagés ?', syndic: 'Qui gère la copropriété ou l’ASL ?', projetsQuartier: 'Avez-vous entendu parler de projets dans le quartier ?',
  atouts: 'Qu’est-ce qui vous a fait choisir cette maison ?', vigilances: 'Y a-t-il un point qu’un acquéreur pourrait relever ?', objections: 'Selon vous, qu’est-ce qui pourrait freiner un acquéreur ?', strategie: 'Comment envisagez-vous la mise en vente : prix, exclusivité, calendrier ?',
}
