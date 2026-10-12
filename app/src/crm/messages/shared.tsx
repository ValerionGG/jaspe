// Messagerie — utilitaires partagés : canaux, dates relatives, contexte d’une conversation, variables de modèles, traduction simulée.
import { useEffect, useRef, type ReactNode } from 'react'
import clsx from 'clsx'
import { WhatsappLogo, EnvelopeSimple, ChatText, Globe, Hash, Lock } from '@phosphor-icons/react'
import type { Channel, Conversation, Message } from '../../data/messaging'
import { useContacts, useDossiers, useEvents, useSettings } from '../../data/collections'
import { prop, me } from '../../data/mock'
import { TAGS as TAGS_FALLBACK } from '../../data/messaging'
import type { CalEvent, Contact } from '../../data/ops'

export { me }
export const H = 3600e3
export type Conv = Conversation & { id: string; consentRequestedAt?: string }
export type Msg = Message & { id: string; mine?: string[] }

export const CH: Record<Channel, { label: string; icon: typeof Hash; dot: string; text: string }> = {
  whatsapp: { label: 'WhatsApp', icon: WhatsappLogo, dot: 'bg-sage', text: 'text-sage' },
  email: { label: 'E-mail', icon: EnvelopeSimple, dot: 'bg-sea', text: 'text-sea' },
  sms: { label: 'SMS', icon: ChatText, dot: 'bg-champagne', text: 'text-champagne-300' },
  portal: { label: 'Portails', icon: Globe, dot: 'bg-bone/60', text: 'text-bone/70' },
  internal: { label: 'Équipe', icon: Hash, dot: 'bg-mist', text: 'text-mist' },
}

/* ——— Dates ——— */
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
const hhmm = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
export function rel(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso), diff = Date.now() - d.getTime(), y = new Date(Date.now() - 864e5)
  if (diff < 0) return sameDay(d, new Date()) ? hhmm(d) : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  if (diff < 60e3) return 'à l’instant'
  if (diff < H) return `${Math.round(diff / 60e3)} min`
  if (sameDay(d, new Date())) return hhmm(d)
  if (sameDay(d, y)) return 'hier'
  if (diff < 6 * 864e5) return d.toLocaleDateString('fr-FR', { weekday: 'short' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
export const time = (iso: string) => hhmm(new Date(iso))
export function dayLabel(iso: string) {
  const d = new Date(iso)
  if (sameDay(d, new Date())) return 'Aujourd’hui'
  if (sameDay(d, new Date(Date.now() - 864e5))) return 'Hier'
  if (sameDay(d, new Date(Date.now() + 864e5))) return 'Demain'
  const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  return s[0].toUpperCase() + s.slice(1)
}
export const longDate = (iso: string) => `${dayLabel(iso).replace(/^./, (c) => c.toLowerCase())} à ${time(iso)}`
export function until(iso: string) {
  const m = Math.round((Date.parse(iso) - Date.now()) / 60e3)
  if (m <= 0) return 'échu'
  return m < 60 ? `dans ${m} min` : m < 1440 ? `dans ${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `dans ${Math.round(m / 1440)} j`
}
/** Valeur pour <input type="datetime-local"> (heure locale). */
export const localInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60e3).toISOString().slice(0, 16)
export const eventDate = (e: Pick<CalEvent, 'day' | 'start'>) => { const [h, m] = e.start.split(':').map(Number); return new Date(2026, 9, e.day, h, m) }

/* ——— Conversations ——— */
export const isSnoozed = (c: Conv) => c.status === 'snoozed' && !!c.snoozedUntil && Date.parse(c.snoozedUntil) > Date.now()
export const windowOpen = (c: Conv) => !!c.windowUntil && Date.parse(c.windowUntil) > Date.now()
/** Heures d’attente si le dernier message est entrant et sans réponse depuis plus de 2 h (AUT-111). */
export function waiting(c: Conv, last?: Msg) {
  if (c.kind !== 'direct' || c.status === 'done' || !last || last.dir !== 'in') return 0
  const h = (Date.now() - Date.parse(last.at)) / H
  return h >= 2 ? h : 0
}
export const waitLabel = (h: number) => (h < 24 ? `attend depuis ${Math.floor(h)} h` : `attend depuis ${Math.floor(h / 24)} j`)

/** Contexte métier d’une conversation : contact, dossier, bien, prochains rendez-vous, variables de modèle. */
export function useConvContext(conv?: Conv) {
  const [contacts] = useContacts()
  const [dossiers] = useDossiers()
  const [events] = useEvents()
  if (!conv) return { contact: undefined, dossier: undefined, property: undefined, next: [] as (CalEvent & { id: string })[], vars: {} as Record<string, string> }
  const words = conv.title.toLowerCase().split(/[\s—–·&,.]+/).filter((w) => w.length > 2 && !['mme', 'famille', 'lead', 'notaire', 'office'].includes(w))
  const contact: (Contact & { id: string }) | undefined = conv.kind === 'channel' ? undefined
    : contacts.find((c) => c.id === conv.contactId)
      ?? contacts.find((c) => words.includes(c.name.toLowerCase().split(' ').at(-1)!) && (!conv.dossierId || c.dossiers.includes(conv.dossierId)))
      ?? contacts.find((c) => words.some((w) => c.name.toLowerCase().split(' ').at(-1) === w || c.org?.toLowerCase().includes(w)))
  const dossier = dossiers.find((d) => d.id === conv.dossierId)
  const property = dossier ? prop(dossier.propertyId) : undefined
  const next = events
    .filter((e) => (conv.eventIds?.includes(e.id) || (conv.dossierId && e.dossier === conv.dossierId)) && eventDate(e).getTime() > Date.now() - H)
    .sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime())
  const ev = next[0]
  const name = contact?.name ?? conv.title
  const prenom = /^(M\.|Mme|Me|Dr)\b/.test(name) || /famille|family|office|lead/i.test(name) ? conv.title.split(' — ')[0].replace(/^Lead \w+ — /, '') : name.split(' ')[0]
  const vars: Record<string, string> = {
    prenom, conseiller: me.name,
    ...(property ? { bien: property.title.replace(/^./, (c) => c.toLowerCase()), lieu: property.address } : {}),
    ...(ev ? { date: dayLabel(eventDate(ev).toISOString()).toLowerCase(), heure: ev.start.replace(':', ' h '), lieu: ev.place } : {}),
    ...(dossier?.deliverables?.L9 === 'blocked' ? { pieces: 'le PV d’AG 2025 et le carnet d’entretien' } : {}),
  }
  return { contact, dossier, property, next, vars }
}

export const fill = (body: string, vars: Record<string, string>) => body.replace(/\{\{(\w+)\}\}/g, (m, k) => vars[k] ?? m)
export const missingVars = (text: string) => [...new Set([...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))]
export const VARS = ['prenom', 'date', 'heure', 'lieu', 'bien', 'conseiller', 'pieces']

/** Tags : suggérés + créés par l’équipe (réglage « messaging »). */
export function useTags(): [string[], (t: string) => Promise<void>] {
  const [settings, ops] = useSettings()
  const doc = settings.find((s) => s.id === 'messaging') as ({ id: string; tags?: string[] }) | undefined
  const custom = doc?.tags ?? []
  const add = async (t: string) => {
    if (doc) await ops.update('messaging', { tags: [...custom, t] } as never)
    else await ops.create({ id: 'messaging', tags: [t] } as never)
  }
  return [[...TAGS_FALLBACK, ...custom.filter((t) => !TAGS_FALLBACK.includes(t))], add]
}

/* ——— Traduction rapide FR ⇄ EN (simulée par règles, sans service externe) ——— */
const PAIRS: [string, string][] = [
  ['bonjour', 'hello'], ['bonsoir', 'good evening'], ['merci beaucoup', 'thank you very much'], ['merci pour', 'thank you for'], ['merci', 'thank you'],
  ['je vous propose', 'I suggest'], ['nous vous proposons', 'we suggest'], ['je vous confirme', 'I confirm'], ['je vous envoie', 'I am sending you'],
  ['je reviens vers vous', 'I will get back to you'], ['je reste disponible', 'I remain available'], ['à très vite', 'speak soon'], ['bien à vous', 'kind regards'],
  ['cordialement', 'best regards'], ['avec plaisir', 'with pleasure'], ['visite privée', 'private viewing'], ['la visite', 'the viewing'], ['une visite', 'a viewing'],
  ['visite', 'viewing'], ['rendez-vous', 'appointment'], ['demain', 'tomorrow'], ['aujourd’hui', 'today'], ['la semaine prochaine', 'next week'], ['cette semaine', 'this week'],
  ['lundi', 'Monday'], ['mardi', 'Tuesday'], ['mercredi', 'Wednesday'], ['jeudi', 'Thursday'], ['vendredi', 'Friday'], ['samedi', 'Saturday'], ['dimanche', 'Sunday'],
  ['matin', 'morning'], ['après-midi', 'afternoon'], ['ce soir', 'tonight'], ['le bien', 'the property'], ['vue mer', 'sea view'], ['piscine', 'pool'], ['jardin', 'garden'],
  ['offre', 'offer'], ['prix', 'price'], ['vendeur', 'seller'], ['acquéreur', 'buyer'], ['notaire', 'notary'], ['plan', 'floor plan'], ['toujours disponible', 'still available'],
  ['disponible', 'available'], ['parfait', 'perfect'], ['dossier', 'file'], ['pièces', 'documents'], ['confirmée', 'confirmed'], ['confirmé', 'confirmed'], ['heure', 'time'],
  ['réponse', 'answer'], ['question', 'question'], ['nous', 'we'], ['vous', 'you'], ['votre', 'your'], ['vos', 'your'], ['notre', 'our'], ['je', 'I'], ['et', 'and'],
  ['pour', 'for'], ['avec', 'with'], ['dans', 'in'], ['sur', 'on'], ['les', 'the'], ['le', 'the'], ['la', 'the'], ['un', 'a'], ['une', 'a'], ['est', 'is'], ['oui', 'yes'], ['non', 'no'],
  ['à', 'at'], ['de', 'of'], ['du', 'of the'], ['des', 'some'], ['ou', 'or'], ['si', 'if'], ['très', 'very'], ['envoyer', 'send'], ['villa', 'villa'], ['acte', 'deed'], ['compromis', 'preliminary contract'],
]
const dict = (from: 0 | 1) => { const m = new Map<string, string>(); PAIRS.forEach((p) => { const k = p[from].toLowerCase(); if (!m.has(k)) m.set(k, p[1 - from]) }); return m }
const FR_EN = dict(0), EN_FR = dict(1)
const rx = (m: Map<string, string>) => new RegExp(`(?<![\\p{L}’'])(${[...m.keys()].sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\p{L}])`, 'giu')
const RX_FR = rx(FR_EN), RX_EN = rx(EN_FR)
export const isEnglish = (t: string) => /\b(the|you|we|would|please|thank|viewing|next|dear|regards)\b/i.test(t)
/** Traduit FR → EN (ou EN → FR si le texte est anglais). Une seule passe : pas de retraduction en chaîne. */
export function translate(text: string): { text: string; to: 'EN' | 'FR' } {
  const en = isEnglish(text), map = en ? EN_FR : FR_EN
  const out = text.replace(en ? RX_EN : RX_FR, (w) => { const t = map.get(w.toLowerCase()) ?? w; return w[0] === w[0].toUpperCase() && w[0] !== w[0].toLowerCase() ? t[0].toUpperCase() + t.slice(1) : t })
  return { text: out, to: en ? 'FR' : 'EN' }
}

/* ——— Petits composants ——— */
export function ChannelBadge({ ch, size = 'sm', className }: { ch: Channel; size?: 'sm' | 'xs'; className?: string }) {
  const I = CH[ch].icon
  return <span className={clsx('inline-flex items-center gap-1 rounded-full bg-white/[0.05] ring-1 ring-white/[0.08]', size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-1.5 py-px text-[10px]', CH[ch].text, className)}><I size={size === 'sm' ? 12 : 10} weight="light" />{CH[ch].label}</span>
}

export function ConvAvatar({ c, size = 36 }: { c: Conv; size?: number }) {
  const I = CH[c.channel].icon
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {c.kind === 'channel'
        ? <span className="flex h-full w-full items-center justify-center rounded-xl bg-white/[0.05] text-mist ring-1 ring-white/[0.08]">{c.private ? <Lock size={size * 0.42} weight="light" /> : <Hash size={size * 0.42} weight="light" />}</span>
        : c.avatar ? <img src={c.avatar} alt="" className="h-full w-full rounded-full object-cover" />
          : <span className="flex h-full w-full items-center justify-center rounded-full bg-champagne/15 font-serif text-[15px] italic text-champagne-300">{c.title.replace(/^(M\.|Mme|Me|Lead \w+ —)\s*/, '')[0]}</span>}
      {c.kind === 'direct' && <span className={clsx('absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-ink ring-2 ring-ink-800', CH[c.channel].dot)}><I size={9} weight="bold" /></span>}
    </span>
  )
}

export function TagChip({ t, onRemove, active, onClick }: { t: string; onRemove?: () => void; active?: boolean; onClick?: () => void }) {
  const tone = t === 'Urgent' ? 'bg-coral/10 text-coral ring-coral/25' : t === 'VIP' || t === 'Off-market' ? 'bg-champagne/10 text-champagne-300 ring-champagne/25' : active ? 'bg-white/[0.1] text-bone ring-white/20' : 'bg-white/[0.04] text-bone/65 ring-white/[0.08]'
  return (
    onClick ? <button type="button" aria-pressed={active} onClick={onClick} className={clsx('inline-flex items-center whitespace-nowrap rounded-full px-2 py-px text-[10.5px] ring-1 transition hover:ring-white/20', tone)}>{t}</button>
      : <span className={clsx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-px text-[10.5px] ring-1', tone)}>
        {t}{onRemove && <button aria-label={`Retirer ${t}`} onClick={(e) => { e.stopPropagation(); onRemove() }} className="-mr-0.5 opacity-60 hover:opacity-100">×</button>}
      </span>
  )
}

/** Ferme un menu flottant au clic extérieur ou Échap. */
export function useOutside<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!open) return
    const f = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close() }
    const k = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', f); document.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', f); document.removeEventListener('keydown', k) }
  }, [open, close])
  return ref
}

export function Menu({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('absolute z-40 rounded-2xl bg-white/[0.04] p-1 shadow-float ring-1 ring-white/10 backdrop-blur-xl', className)}><div className="thin-scroll max-h-80 overflow-y-auto rounded-[0.9rem] bg-ink-800 p-1">{children}</div></div>
}
export const menuItem = 'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12.5px] text-bone/85 transition hover:bg-white/[0.06]'
export const eyebrow = 'text-[10.5px] uppercase tracking-eyebrow text-mist'
