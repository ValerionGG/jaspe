// Briques partagées des étapes « vente » du parcours vendeur (mandat → après-vente).
import { useEffect, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import clsx from 'clsx'
import { ArrowRight, Lightning } from '@phosphor-icons/react'
import { Ring, EXPO } from '../../ui/kit'
import { action, ApiError } from '../../data/store'
import { toast, errText } from '../forms'
import type { Conversation } from '../../data/messaging'
import type { Outbox } from '../../data/collections'
import type { Ops } from '../../data/store'

export const DAY = 86400e3
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const todayIso = () => iso(new Date())
export const addDays = (s: string, n: number) => { const d = new Date(`${s.slice(0, 10)}T12:00`); d.setDate(d.getDate() + n); return iso(d) }
export const addMonths = (s: string, n: number) => { const d = new Date(`${s.slice(0, 10)}T12:00`); d.setMonth(d.getMonth() + n); return iso(d) }
export const ts = (s?: string) => (s ? Date.parse(s.length <= 10 ? `${s}T12:00` : s) : NaN)
export const daysFrom = (s?: string, now = Date.now()) => (s ? Math.round((ts(s) - now) / DAY) : NaN)
export const fdate = (s?: string, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) => (s && !Number.isNaN(ts(s)) ? new Date(ts(s)).toLocaleDateString('fr-FR', o) : '—')
export const money = (n: number) => `${new Intl.NumberFormat('fr-FR').format(Math.round(n))} €`
export const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
/** Jour du calendrier de démo (quantième d’octobre 2026, peut déborder sur sept./nov.). */
export const agendaDay = (s: string) => Math.round((ts(s) - Date.parse('2026-10-01T12:00')) / DAY) + 1

/** Horloge vivante (comptes à rebours). */
export function useNow(every = 30e3) {
  const [n, setN] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setN(Date.now()), every); return () => clearInterval(t) }, [every])
  return n
}
export function countdown(target: number, now: number) {
  const ms = target - now
  if (Number.isNaN(ms)) return '—'
  const a = Math.abs(ms), d = Math.floor(a / DAY), h = Math.floor((a % DAY) / 3600e3), m = Math.floor((a % 3600e3) / 60e3)
  const s = d ? `${d} j ${h} h` : h ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`
  return ms < 0 ? `il y a ${s}` : s
}

/** Exécute une action avec retour visuel ; renvoie false en cas d’erreur. */
export function useRun() {
  const [busy, setBusy] = useState<string | null>(null)
  const run = async (k: string, f: () => Promise<unknown>, ok?: string, tone: 'ok' | 'info' = 'ok') => {
    setBusy(k)
    try { await f(); if (ok) toast(ok, tone); return true } catch (x) { toast(errText(x), 'error'); return false } finally { setBusy(null) }
  }
  return { busy, run }
}

/**
 * Envoi externe honnête : dans la conversation du contact si elle existe (message.send, consigné faute de connecteur),
 * sinon dans la file d’envoi (outbox). Renvoie le libellé du canal utilisé.
 */
export async function consignSend(o: { conv?: Conversation; text: string; template?: string; outbox: Ops<Outbox & { id: string }>; dossierId: string; code: string; to: string; subject: string }) {
  if (o.conv) {
    const open = o.conv.channel !== 'whatsapp' || (o.conv.windowUntil && Date.parse(o.conv.windowUntil) > Date.now())
    try {
      await action('message.send', { conversationId: o.conv.id, text: o.text, ...(open ? {} : { template: o.template }) })
      return `consigné dans la conversation ${o.conv.channel === 'whatsapp' ? 'WhatsApp' : o.conv.channel === 'sms' ? 'SMS' : 'e-mail'} — connecteur non configuré`
    } catch (e) { if (!(e instanceof ApiError && e.status === 409)) throw e }
  }
  await o.outbox.create({ dossierId: o.dossierId, code: o.code, to: o.to, subject: o.subject, status: 'consigné (connecteur non configuré)', at: new Date().toISOString(), channel: 'E-mail' })
  return 'consigné dans la file d’envoi — connecteur e-mail non configuré'
}

/** En-tête d’étape : avancement réel + prochaine action recommandée. */
export function StepHead({ n, kicker, title, sub, progress, next, aside }: {
  n: number; kicker: string; title: ReactNode; sub?: ReactNode; progress: number
  next?: { label: string; hint?: string; cta?: string; onClick?: () => void; tone?: 'gold' | 'coral' | 'sage' }; aside?: ReactNode
}) {
  const tone = next?.tone ?? 'gold'
  return (
    <div className="rounded-[1.4rem] bg-white/[0.02] p-1 ring-1 ring-white/[0.06]">
      <div className="grid gap-5 rounded-[calc(1.4rem-0.25rem)] bg-ink-800/80 p-5 shadow-bezel md:p-6 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-center">
        <div className="flex items-start gap-4">
          <Ring value={progress} size={58} stroke={3} color={progress >= 100 ? 'rgb(var(--sage))' : 'rgb(var(--acc-500))'}><span className="num text-[13px]">{progress}%</span></Ring>
          <div className="min-w-0">
            <div className="text-[10.5px] uppercase tracking-eyebrow text-mist">Étape {n} · {kicker}</div>
            <h2 className="display mt-1 text-[2rem] leading-[1.05] md:text-[2.4rem]">{title}</h2>
            {sub && <p className="mt-1.5 max-w-xl text-[13px] text-bone/55">{sub}</p>}
            {aside && <div className="mt-3 flex flex-wrap gap-2">{aside}</div>}
          </div>
        </div>
        {next && (
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: EXPO, delay: 0.15 }}
            className={clsx('rounded-2xl p-4 ring-1', tone === 'coral' ? 'bg-coral/[0.07] ring-coral/20' : tone === 'sage' ? 'bg-sage/[0.07] ring-sage/20' : 'bg-champagne/[0.07] ring-champagne/20')}>
            <div className={clsx('flex items-center gap-1.5 text-[10.5px] uppercase tracking-eyebrow', tone === 'coral' ? 'text-coral' : tone === 'sage' ? 'text-sage' : 'text-champagne-300')}><Lightning size={12} weight="fill" />Prochaine action</div>
            <div className="mt-1.5 text-[14px] leading-snug text-bone">{next.label}</div>
            {next.hint && <div className="mt-1 text-[12px] text-bone/50">{next.hint}</div>}
            {next.cta && next.onClick && <button onClick={next.onClick} className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-champagne-300 transition-all hover:gap-2.5">{next.cta}<ArrowRight size={13} /></button>}
          </motion.div>
        )}
      </div>
    </div>
  )
}

/** Contrôle segmenté (pilule active animée). */
export function Seg<T extends string>({ value, onChange, items, id }: { value: T; onChange: (v: T) => void; items: { id: T; label: ReactNode }[]; id: string }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full bg-white/[0.03] p-1 ring-1 ring-white/[0.06]">
      {items.map((t) => (
        <button type="button" key={t.id} onClick={() => onChange(t.id)} className="relative rounded-full px-3 py-1.5 text-[12.5px]">
          {value === t.id && <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-full bg-white/[0.09] ring-1 ring-white/10" transition={{ duration: 0.45, ease: EXPO }} />}
          <span className={clsx('relative', value === t.id ? 'text-bone' : 'text-bone/55')}>{t.label}</span>
        </button>
      ))}
    </div>
  )
}

export const Eyebrow = ({ children, className }: { children: ReactNode; className?: string }) => <div className={clsx('text-[10.5px] uppercase tracking-eyebrow text-mist', className)}>{children}</div>

/** Petit chiffre clé. */
export function Kpi({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'sage' | 'coral' | 'sea' }) {
  return (
    <div className="rounded-2xl bg-white/[0.025] p-3.5 ring-1 ring-white/[0.06]">
      <Eyebrow>{label}</Eyebrow>
      <div className={clsx('display mt-1 text-[1.75rem] leading-none', tone === 'sage' && 'text-sage', tone === 'coral' && 'text-coral', tone === 'sea' && 'text-sea')}>{value}</div>
      {hint && <div className="mt-1 text-[11px] text-bone/45">{hint}</div>}
    </div>
  )
}

/** Papier imprimable (reste clair dans les deux thèmes). */
export function Paper({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('theme-dark rounded-2xl bg-bone-50 p-6 text-ink shadow-float md:p-8', className)}>{children}</div>
}
