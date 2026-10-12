// Briques visuelles partagées par les étapes Préparation (D1–D4) et Découverte (D5).
import { useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { Sparkle, ArrowUpRight, ClockCounterClockwise, Database } from '@phosphor-icons/react'
import { DELIV_TONE } from '../ui'
import { DELIVERABLES, type DelivState } from '../../data/mock'
import { action } from '../../data/store'
import type { DocumentDoc } from '../../data/collections'
import { toast, errText } from '../forms'

export const todayFr = () => new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
export const nameOf = (code: string) => DELIVERABLES.find((x) => x.code === code)?.name ?? code

/** Toujours la dernière version d’une valeur (évite les fermetures périmées dans les sauvegardes différées). */
export function useLatest<T>(v: T) { const r = useRef(v); r.current = v; return r }

export function StatePill({ state }: { state: DelivState }) {
  const t = DELIV_TONE[state] ?? DELIV_TONE.waiting
  return <span className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] ring-1', t.c)}>{state === 'running' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sea" />}{t.l}</span>
}

/** Sous-bloc à l’intérieur d’un panneau : fond très léger, micro-libellé. */
export function Sub({ title, kicker, action: act, children, className }: { title?: ReactNode; kicker?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06]', className)}>
      {(title || kicker || act) && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>{kicker && <div className="text-[10.5px] uppercase tracking-eyebrow text-mist">{kicker}</div>}{title && <div className="mt-0.5 text-[14px] font-medium">{title}</div>}</div>
          {act}
        </div>
      )}
      {children}
    </div>
  )
}

/** Sources datées d’un livrable (celles du document généré, sinon les sources prévues). */
export function Sources({ doc, planned }: { doc?: DocumentDoc; planned: string[] }) {
  const items = doc?.sources?.length ? doc.sources : planned.map((label) => ({ label, date: '' }))
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <span className="mr-1 flex items-center gap-1 text-mist"><Database size={12} weight="light" />Sources</span>
      {items.map((s) => <span key={s.label} className="rounded-full bg-white/[0.04] px-2.5 py-1 text-bone/70 ring-1 ring-white/[0.06]">{s.label}{s.date ? <span className="num text-mist"> · {s.date}</span> : <span className="text-mist"> · à consulter</span>}</span>)}
    </div>
  )
}

/** En-tête d’un livrable : code, nom, statut, génération ou ouverture du tiroir d’aperçu. */
export function DelivHead({ code, state, doc, dossierId, onOpen, lead }: { code: string; state: DelivState; doc?: DocumentDoc; dossierId: string; onOpen: (c: string) => void; lead: string }) {
  const [busy, setBusy] = useState(false)
  const generate = async () => {
    setBusy(true)
    try { await action('deliverable.generate', { dossierId, code }); toast(`${code} · ${nameOf(code)} généré — à relire`) } catch (x) { toast(errText(x), 'error') } finally { setBusy(false) }
  }
  const canOpen = !!doc || state === 'done' || state === 'review'
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><span className="num rounded-full bg-champagne/15 px-2.5 py-1 text-[12px] text-champagne-300">{code}</span><StatePill state={state} />{doc && <span className="num flex items-center gap-1 text-[11px] text-mist"><ClockCounterClockwise size={12} />v{doc.version} · {new Date(doc.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>}</div>
        <h3 className="display mt-3 text-[2.1rem] md:text-[2.6rem]">{nameOf(code).split(' ').slice(0, -1).join(' ')} <span className="italic text-champagne-300">{nameOf(code).split(' ').at(-1)}</span></h3>
        <p className="mt-1.5 max-w-xl text-[13px] text-bone/55">{lead}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {canOpen
          ? <button onClick={() => onOpen(code)} className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[13px] font-medium ring-1 ring-white/[0.08] transition hover:bg-white/[0.08]"><ArrowUpRight size={14} />Ouvrir {code}</button>
          : <button onClick={generate} disabled={busy || state === 'running'} className="inline-flex items-center gap-2 rounded-full bg-champagne px-4 py-2 text-[13px] font-medium text-ink ring-1 ring-champagne transition hover:bg-champagne-300 disabled:opacity-60"><Sparkle size={14} weight="fill" />{busy ? 'Génération…' : state === 'running' ? 'En cours…' : `Générer ${code}`}</button>}
      </div>
    </div>
  )
}
