// Petits composants partagés par les pages du back-office.
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import clsx from 'clsx'
import { EXPO, Pill } from '../ui/kit'
import { Link } from 'react-router-dom'
import type { VerificationState } from '../data/store'
import { VERIF_LABEL, VERIF_TONE, actionLabel, dateTime, detailText, type LogEntry } from './shared'

export function VerifBadge({ state, submitted }: { state: VerificationState; submitted?: boolean }) {
  return <Pill tone={VERIF_TONE[state]}>{VERIF_LABEL[state]}{state === 'en_attente' && submitted !== undefined && <span className="opacity-70">· {submitted ? 'dossier déposé' : 'rien déposé'}</span>}</Pill>
}

export function Toggle({ on, onChange, label, disabled }: { on: boolean; onChange?: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange?.(!on)}
      className={clsx('relative h-6 w-11 shrink-0 rounded-full ring-1 transition-colors duration-300 ease-silk disabled:cursor-not-allowed disabled:opacity-50', on ? 'bg-champagne ring-champagne' : 'bg-white/[0.06] ring-white/10')}>
      <motion.span className={clsx('absolute top-[3px] h-[18px] w-[18px] rounded-full shadow', on ? 'bg-ink' : 'bg-bone/70')} animate={{ left: on ? 23 : 3 }} transition={{ duration: 0.4, ease: EXPO }} />
    </button>
  )
}

/** Interrupteur à trois états : suivre le réglage global, forcé oui, forcé non. */
export function TriState({ value, onChange, label, inherited }: { value: boolean | undefined; onChange: (v: boolean | undefined) => void; label: string; inherited: boolean }) {
  const opts: { v: boolean | undefined; l: string }[] = [{ v: undefined, l: `Global (${inherited ? 'oui' : 'non'})` }, { v: true, l: 'Oui' }, { v: false, l: 'Non' }]
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex shrink-0 rounded-full bg-white/[0.03] p-0.5 ring-1 ring-white/[0.08]">
      {opts.map((o) => {
        const active = value === o.v
        return (
          <button key={o.l} type="button" role="radio" aria-checked={active} onClick={() => onChange(o.v)}
            className={clsx('rounded-full px-3 py-1 text-[12px] transition-colors', active ? (o.v === undefined ? 'bg-white/[0.1] text-bone' : o.v ? 'bg-sage/20 text-sage' : 'bg-coral/20 text-coral') : 'text-bone/50 hover:text-bone')}>
            {o.l}
          </button>
        )
      })}
    </div>
  )
}

/** Répartition en barres horizontales. */
export function Bars({ data, labels }: { data: Record<string, number>; labels?: Record<string, string> }) {
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1])
  const total = rows.reduce((n, [, v]) => n + v, 0) || 1
  if (!rows.length) return <p className="text-[13px] text-mist">Aucune donnée.</p>
  return (
    <ul className="space-y-3">
      {rows.map(([k, v]) => (
        <li key={k}>
          <div className="mb-1 flex items-center justify-between text-[13px]"><span className="text-bone/80">{labels?.[k] ?? k}</span><span className="num text-mist">{v} · {Math.round((v / total) * 100)} %</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]"><motion.div className="h-full rounded-full bg-champagne/70" initial={{ width: 0 }} animate={{ width: `${(v / total) * 100}%` }} transition={{ duration: 0.8, ease: EXPO }} /></div>
        </li>
      ))}
    </ul>
  )
}

export function Loading() {
  return <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-3xl bg-white/[0.03]" />)}</div>
}

export function ErrorBox({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-coral/10 px-4 py-3 text-[13px] text-coral ring-1 ring-coral/20">
      <span>{children}</span>{onRetry && <button type="button" onClick={onRetry} className="shrink-0 underline-offset-2 hover:underline">Réessayer</button>}
    </div>
  )
}

/** Liste d’actions d’administration (journal). `orgNames` : id → nom d’agence. */
export function LogList({ log, orgNames, showOrg = true }: { log: LogEntry[]; orgNames?: Record<string, string>; showOrg?: boolean }) {
  if (!log.length) return <p className="text-[13px] text-mist">Aucune action enregistrée.</p>
  return (
    <ul className="divide-y divide-white/[0.05]">
      {log.map((e) => {
        const d = detailText(e)
        return (
          <li key={e.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:gap-4">
            <span className="num w-40 shrink-0 text-[12px] text-mist">{dateTime(e.at)}</span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px]">
                <span className="font-medium">{actionLabel(e.action)}</span>
                {showOrg && e.orgId && <> · <Link to={`/admin/agences/${e.orgId}`} className="text-champagne-300 hover:underline">{orgNames?.[e.orgId] ?? e.orgId}</Link></>}
              </div>
              {d && <div className="mt-0.5 break-words text-[12.5px] text-bone/55">{d}</div>}
            </div>
            <span className="shrink-0 truncate text-[12px] text-mist sm:max-w-[14rem]">{e.admin}</span>
          </li>
        )
      })}
    </ul>
  )
}
