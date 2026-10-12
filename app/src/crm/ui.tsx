import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import clsx from 'clsx'
import { EXPO } from '../ui/kit'

/** En-tête de page : surtitre, titre serif, actions. */
export function PageHeader({ kicker, title, sub, actions }: { kicker?: string; title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        {kicker && <div className="mb-2 text-[11px] uppercase tracking-eyebrow text-mist">{kicker}</div>}
        <h1 className="display text-4xl md:text-[3.25rem]">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-[14px] text-bone/55">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Carte standard du CRM (double-bezel discret). */
export function Card({ children, className, pad = true, title, action, kicker }: { children: ReactNode; className?: string; pad?: boolean; title?: ReactNode; action?: ReactNode; kicker?: string }) {
  return (
    <section className={clsx('rounded-[1.4rem] bg-white/[0.02] p-1 ring-1 ring-white/[0.06]', className)}>
      <div className={clsx('h-full rounded-[calc(1.4rem-0.25rem)] bg-ink-800/80 shadow-bezel', pad && 'p-5')}>
        {(title || action) && (
          <div className={clsx('mb-4 flex items-center justify-between gap-3', !pad && 'px-5 pt-5')}>
            <div>
              {kicker && <div className="text-[10px] uppercase tracking-eyebrow text-mist">{kicker}</div>}
              {title && <h2 className="text-[15px] font-medium tracking-[-0.01em]">{title}</h2>}
            </div>
            {action}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}

export function Stat({ label, value, delta, hint, children }: { label: string; value: ReactNode; delta?: string; hint?: string; children?: ReactNode }) {
  const pos = delta?.startsWith('+')
  return (
    <Card>
      <div className="flex items-center justify-between text-[12px] text-mist"><span>{label}</span>{delta && <span className={pos ? 'text-sage' : 'text-coral'}>{delta}</span>}</div>
      <div className="mt-2 flex items-end justify-between gap-3"><span className="display text-[2.6rem] leading-none">{value}</span>{children}</div>
      {hint && <div className="mt-2 text-[11.5px] text-bone/45">{hint}</div>}
    </Card>
  )
}

export function Tabs<T extends string>({ value, onChange, items, id }: { value: T; onChange: (v: T) => void; items: { id: T; label: ReactNode; count?: number }[]; id: string }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-full bg-white/[0.03] p-1 ring-1 ring-white/[0.06] scrollbar-none">
      {items.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className="relative flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px]">
          {value === t.id && <motion.span layoutId={`tab-${id}`} className="absolute inset-0 rounded-full bg-white/[0.09] ring-1 ring-white/10" transition={{ duration: 0.5, ease: EXPO }} />}
          <span className={clsx('relative', value === t.id ? 'text-bone' : 'text-bone/55')}>{t.label}</span>
          {t.count !== undefined && <span className="num relative text-[10.5px] text-mist">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function IconBtn({ children, label, onClick, active }: { children: ReactNode; label: string; onClick?: () => void; active?: boolean }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className={clsx('flex h-9 w-9 items-center justify-center rounded-full ring-1 transition-all duration-300 ease-silk', active ? 'bg-champagne/15 text-champagne-300 ring-champagne/30' : 'bg-white/[0.03] text-bone/70 ring-white/[0.07] hover:bg-white/[0.07] hover:text-bone')}>
      {children}
    </button>
  )
}

export function SoftBtn({ children, onClick, icon, tone = 'ghost', type = 'button', disabled }: { children: ReactNode; onClick?: () => void; icon?: ReactNode; tone?: 'ghost' | 'gold' | 'light'; type?: 'button' | 'submit'; disabled?: boolean }) {
  const t = { ghost: 'bg-white/[0.04] text-bone/85 ring-white/[0.08] hover:bg-white/[0.08]', gold: 'bg-champagne text-ink ring-champagne hover:bg-champagne-300', light: 'bg-bone text-ink ring-bone hover:bg-white' }[tone]
  return <button type={type} disabled={disabled} onClick={onClick} className={clsx('inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium ring-1 transition-all duration-300 ease-silk active:scale-[0.97] disabled:opacity-50', t)}>{icon}{children}</button>
}

/** Entrée de page : fondu + montée, en cascade. */
export function Stagger({ children, className, i = 0 }: { children: ReactNode; className?: string; i?: number }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.8, delay: 0.05 + i * 0.06, ease: EXPO }}>{children}</motion.div>
}

export const DELIV_TONE = {
  done: { c: 'bg-sage/15 text-sage ring-sage/25', l: 'Prêt' },
  review: { c: 'bg-champagne/15 text-champagne-300 ring-champagne/30', l: 'À valider' },
  running: { c: 'bg-sea/15 text-sea ring-sea/25', l: 'En cours' },
  waiting: { c: 'bg-white/[0.04] text-bone/40 ring-white/10', l: 'En attente' },
  blocked: { c: 'bg-coral/15 text-coral ring-coral/25', l: 'Bloqué' },
} as const

export function Heat({ n }: { n: 1 | 2 | 3 }) {
  return <span className="inline-flex gap-0.5" title={`Priorité ${n}/3`}>{[1, 2, 3].map((k) => <span key={k} className={clsx('h-2.5 w-1 rounded-full', k <= n ? 'bg-champagne' : 'bg-white/10')} />)}</span>
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center"><div className="display text-2xl">{title}</div>{children && <div className="mt-2 text-[13px] text-bone/50">{children}</div>}</div>
}
