import { motion, AnimatePresence } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  Buildings, Globe, DownloadSimple, CaretUp, CaretDown, Sparkle, HandHeart, TrendUp, Warning, CheckCircle, CalendarCheck,
  Plus, Copy, Clock, FileText, ArrowRight, Info, X, ArrowSquareOut, Trash,
} from '@phosphor-icons/react'
import { PageHeader, Card, Tabs, SoftBtn, Stagger, Empty } from '../ui'
import { Avatar, Ring, Spark, EXPO } from '../../ui/kit'
import { AGENCIES, STAGES, DELIVERABLES, eur, prop, agent, me, type Stage } from '../../data/mock'
import { useDossiers, useTransactions, useRuns, useDocuments, useNotes, useTasks, type Note } from '../../data/collections'
import type { Ops } from '../../data/store'
import { toast, errText } from '../forms'
import {
  KPIS, CA_SERIES, MANDATS_SERIES, MONTHS, FUNNEL, DAYS, HOURS, HEAT, TEAM, AI_COSTS, AI_SPLIT_LABELS, QUALITY, download, csv,
  type Scope, type Member, type Kpi,
} from '../../data/pilot'

const HOME = 'Antibes Vieille-Ville'
const HIST = 'historique importé'
const SI = (s: Stage) => STAGES.findIndex((x) => x.id === s)
/** Échéance dépassée : libellés relatifs saisis dans les dossiers (« Il y a 40 min », « en retard »…). */
const OVERDUE = /^il y a|en retard|dépass/i
type LiveKpi = Kpi & { live: boolean }
type Step = { label: string; n: number; note: string }
type Decision = Note & { meeting?: string; done?: boolean }

/** Indicateurs vivants de l’agence, recalculés depuis les collections. */
function useLive() {
  const [dossiers] = useDossiers()
  const [txs] = useTransactions()
  const [runs] = useRuns()
  const [docs] = useDocuments()
  return useMemo(() => {
    const reach = (s: Stage) => dossiers.filter((d) => SI(d.stage) >= SI(s)).length
    const mandated = dossiers.filter((d) => d.mandate)
    const active = mandated.filter((d) => d.stage !== 'acte')
    const exclu = mandated.filter((d) => d.mandate === 'Exclusif').length
    const estim = reach('post'), mand = reach('mandat')
    const fees = txs.reduce((s, t) => s + (t.fees || 0), 0), volume = txs.reduce((s, t) => s + (t.price || 0), 0)
    const week = Date.now() - 7 * 864e5
    const r7 = runs.filter((r) => Date.parse(r.at) >= week), ok7 = r7.filter((r) => r.status === 'ok').length
    const gen = docs.filter((d) => d.dossierId)
    const validated = gen.filter((d) => d.status === 'done')
    const clean = validated.filter((d) => !d.edited).length
    const days = Array.from({ length: 12 }, (_, i) => { const day = new Date(Date.now() - (11 - i) * 864e5).toISOString().slice(0, 10); return runs.filter((r) => r.at?.startsWith(day)).length })
    const h = KPIS.agence
    const pctOf = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
    const kpis: LiveKpi[] = [
      { ...h[0], live: true, label: 'Honoraires · transactions', value: eur(fees), delta: `${txs.length} en cours`, good: true, hint: `${eur(volume)} de volume · ${txs.filter((t) => t.stage === 'acte').length} à l’acte`, source: `Transactions en direct · tendance ${HIST}` },
      { ...h[1], live: true, value: String(active.length), delta: `${exclu} excl.`, good: true, hint: `${dossiers.length} dossiers ouverts · ${mandated.length} mandats signés`, source: `Dossiers en direct · tendance ${HIST}` },
      { ...h[2], live: true, value: `${pctOf(exclu, mandated.length)} %`, delta: `${exclu}/${mandated.length}`, good: pctOf(exclu, mandated.length) >= 45, hint: 'Réseau : 45 % (historique)', source: `Mandats des dossiers en direct · tendance ${HIST}` },
      { ...h[3], live: false, source: `Dossiers clos, 12 mois · ${HIST}` },
      { ...h[4], live: true, value: `${pctOf(mand, estim)} %`, delta: `${mand}/${estim}`, good: pctOf(mand, estim) >= 35, hint: `${mand} mandats / ${estim} RDV réalisés`, source: `Étapes des dossiers en direct · tendance ${HIST}` },
      { ...h[5], live: true, label: 'Copilote · réussite 7 j', value: `${pctOf(ok7, r7.length)} %`, delta: `${r7.length} exéc.`, good: !r7.length || ok7 / r7.length >= 0.9, hint: `${gen.length} livrables générés · ${validated.length} validés`, spark: days.some(Boolean) ? days : h[5].spark, source: 'Exécutions des routines, 12 derniers jours' },
    ]
    const funnel: Step[] = [
      { label: 'Dossiers ouverts', n: dossiers.length, note: 'Préparation incluse' },
      { label: 'RDV découverte', n: reach('rdv'), note: 'D5 en cours ou réalisé' },
      { label: 'Livrables L1–L9', n: estim, note: 'Post-RDV' },
      { label: 'Mandats', n: mand, note: `dont ${exclu} exclusifs` },
      { label: 'Offres', n: reach('offre'), note: 'Au prix ou négociées' },
      { label: 'Compromis', n: reach('compromis'), note: 'Signés chez le notaire' },
      { label: 'Actes', n: reach('acte'), note: 'Honoraires encaissés' },
    ]
    const blocked = dossiers.flatMap((d) => {
      const codes = Object.entries(d.deliverables ?? {}).filter(([, s]) => s === 'blocked').map(([c]) => c)
      const late = OVERDUE.test(d.due ?? '')
      if (!codes.length && !late) return []
      const reasons = [
        ...codes.map((c) => `${c} bloqué · ${DELIVERABLES.find((x) => x.code === c)?.name ?? c}`),
        ...(late ? [`Échéance dépassée : ${d.next} (${d.due})`] : []),
      ]
      return [{ d, reasons, late, codes }]
    })
    const docStats = { gen: gen.length, validated: validated.length, clean: pctOf(clean, validated.length) }
    const runStats = { n: runs.length, cost: runs.reduce((s, r) => s + (r.cost || 0), 0) }
    return { kpis, funnel, blocked, docStats, runStats }
  }, [dossiers, txs, runs, docs])
}
const pct = (n: number) => `${Math.round(n * 100)} %`
const lc = (s: string) => s[0].toLowerCase() + s.slice(1)

/** Courbe lissée (Catmull-Rom → Bézier). */
function smooth(pts: [number, number][]) {
  return pts.reduce((d, p, i, a) => {
    if (!i) return `M${p[0]},${p[1]}`
    const p0 = a[i - 2] ?? a[i - 1], p1 = a[i - 1], p2 = p, p3 = a[i + 1] ?? p
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    return `${d} C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }, '')
}

function Initials({ name, size = 32 }: { name: string; size?: number }) {
  const ini = name.split(' ').map((w) => w[0]).slice(0, 2).join('')
  return <span className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ink-500 to-ink-700 font-serif italic text-champagne-300 ring-2 ring-ink-800" style={{ width: size, height: size, fontSize: size * 0.42 }}>{ini}</span>
}
const Face = ({ m, size = 32 }: { m: Member; size?: number }) => (m.photo ? <Avatar src={m.photo} size={size} /> : <Initials name={m.name} size={size} />)

/* ——— Graphique en aires : CA N vs N-1 ——— */
function AreaChart({ n, n1 }: { n: number[]; n1: number[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 720, H = 250, L = 44, R = 14, T = 18, B = 30
  const max = Math.ceil(Math.max(...n, ...n1) * 1.15 / 50) * 50
  const x = (i: number) => L + (i / (n.length - 1)) * (W - L - R)
  const y = (v: number) => T + (1 - v / max) * (H - T - B)
  const pn = n.map((v, i) => [x(i), y(v)] as [number, number]), pn1 = n1.map((v, i) => [x(i), y(v)] as [number, number])
  const line = smooth(pn), line1 = smooth(pn1)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t))
  const unit = 'k€'
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; setHover(Math.max(0, Math.min(n.length - 1, Math.round(((px - L) / (W - L - R)) * (n.length - 1))))) }}>
        <defs>
          <linearGradient id="pl-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="rgb(var(--acc-500))" stopOpacity=".32" /><stop offset="1" stopColor="rgb(var(--acc-500))" stopOpacity="0" /></linearGradient>
        </defs>
        {ticks.map((t) => <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="rgb(var(--tint) / .06)" strokeDasharray={t ? '2 4' : undefined} /><text x={L - 10} y={y(t) + 3.5} textAnchor="end" className="num" fontSize="10" fill="rgb(var(--mist-600))">{t}</text></g>)}
        {MONTHS.map((m, i) => <text key={m} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill={hover === i ? 'rgb(var(--bone-200))' : 'rgb(var(--mist-600))'}>{m}</text>)}
        <motion.path key={line1} d={line1} fill="none" stroke="rgb(var(--sea))" strokeOpacity=".7" strokeWidth="1.4" strokeDasharray="4 4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: EXPO }} />
        <motion.path key={'a' + line} d={`${line} L${x(n.length - 1)},${H - B} L${L},${H - B} Z`} fill="url(#pl-area)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.3 }} />
        <motion.path key={line} d={line} fill="none" stroke="rgb(var(--acc-500))" strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: EXPO }} />
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="rgb(var(--tint) / .18)" />
            <circle cx={x(hover)} cy={y(n1[hover])} r="3.5" fill="rgb(var(--ink-900))" stroke="rgb(var(--sea))" strokeWidth="1.5" />
            <circle cx={x(hover)} cy={y(n[hover])} r="4.5" fill="rgb(var(--ink-900))" stroke="rgb(var(--acc-500))" strokeWidth="2" />
          </g>
        )}
      </svg>
      <AnimatePresence>
        {hover !== null && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="glass pointer-events-none absolute top-0 rounded-xl px-3 py-2 text-[11.5px] ring-1 ring-white/10"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > 8 ? '-110%' : '10%'})` }}>
            <div className="mb-1 text-mist">{MONTHS[hover]} {hover < 2 ? '2025' : '2026'}</div>
            <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-champagne" /><span className="num">{n[hover]} {unit}</span></div>
            <div className="flex items-center gap-2 text-bone/55"><span className="h-1.5 w-1.5 rounded-full bg-sea" /><span className="num">{n1[hover]} {unit}</span><span className={n[hover] >= n1[hover] ? 'text-sage' : 'text-coral'}>{n[hover] >= n1[hover] ? '+' : ''}{Math.round(((n[hover] - n1[hover]) / n1[hover]) * 100)} %</span></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ——— Barres empilées : mandats exclusifs / simples ——— */
function StackedBars({ ex, simple }: { ex: number[]; simple: number[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 420, H = 200, B = 24, T = 10
  const max = Math.max(...ex.map((v, i) => v + simple[i]))
  const bw = (W / ex.length) * 0.56
  const h = (v: number) => (v / max) * (H - B - T)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)}>
      {ex.map((e, i) => {
        const cx = (i + 0.5) * (W / ex.length), s = simple[i]
        const dim = hover !== null && hover !== i
        return (
          <g key={i} onMouseEnter={() => setHover(i)} opacity={dim ? 0.35 : 1} style={{ transition: 'opacity .3s' }}>
            <rect x={cx - W / ex.length / 2} y={0} width={W / ex.length} height={H} fill="transparent" />
            <motion.rect x={cx - bw / 2} width={bw} rx={3} fill="rgb(var(--tint) / .14)" initial={{ height: 0, y: H - B }} animate={{ height: h(s), y: H - B - h(s) - h(e) - 2 }} transition={{ duration: 0.9, delay: i * 0.03, ease: EXPO }} />
            <motion.rect x={cx - bw / 2} width={bw} rx={3} fill="rgb(var(--acc-500))" initial={{ height: 0, y: H - B }} animate={{ height: h(e), y: H - B - h(e) }} transition={{ duration: 0.9, delay: i * 0.03, ease: EXPO }} />
            <text x={cx} y={H - 7} textAnchor="middle" fontSize="9.5" fill={hover === i ? 'rgb(var(--bone-200))' : 'rgb(var(--mist-600))'}>{MONTHS[i].slice(0, 3)}</text>
            {hover === i && <text x={cx} y={H - B - h(s) - h(e) - 8} textAnchor="middle" className="num" fontSize="10.5" fill="rgb(var(--bone-200))">{e} + {s}</text>}
          </g>
        )
      })}
    </svg>
  )
}

/* ——— Entonnoir du pipeline ——— */
function Funnel({ steps }: { steps: Step[] }) {
  const max = Math.max(1, steps[0].n)
  return (
    <div className="space-y-1">
      {steps.map((s, i) => {
        const w = Math.max(14, Math.sqrt(s.n / max) * 100)
        const conv = i ? (steps[i - 1].n ? Math.round((s.n / steps[i - 1].n) * 100) : 0) : null
        return (
          <div key={s.label}>
            {conv !== null && <div className="flex justify-center py-0.5"><span className="num rounded-full bg-white/[0.03] px-2 text-[10px] text-mist ring-1 ring-white/[0.05]">↓ {conv} %</span></div>}
            <div className="group grid grid-cols-[7.5rem_1fr_auto] items-center gap-3" title={s.note}>
              <span className="truncate text-[12px] text-bone/75">{s.label}</span>
              <div className="relative h-8">
                <motion.div className="absolute inset-y-0 left-1/2 rounded-xl" style={{ background: `linear-gradient(90deg, rgb(var(--acc-500) / ${0.12 + i * 0.07}), rgb(var(--acc-500) / ${0.22 + i * 0.1}))` }}
                  initial={{ width: 0, x: '-50%' }} animate={{ width: `${w}%`, x: '-50%' }} transition={{ duration: 1, delay: 0.1 + i * 0.07, ease: EXPO }} />
              </div>
              <div className="w-14 text-right"><div className="num text-[14px]">{s.n.toLocaleString('fr-FR')}</div></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ——— Carte de chaleur ——— */
function Heatmap({ scale }: { scale: number }) {
  const [hover, setHover] = useState<[number, number] | null>(null)
  const peak = useMemo(() => { let b = [0, 0, 0]; HEAT.forEach((r, d) => r.forEach((v, h) => { if (v > b[0]) b = [v, d, h] })); return b }, [])
  return (
    <div>
      <div className="overflow-x-auto thin-scroll">
        <div className="min-w-[520px]">
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: `40px repeat(${HOURS.length}, 1fr)` }}>
            <span />
            {HOURS.map((h) => <span key={h} className="num pb-1 text-center text-[9.5px] text-mist">{h}h</span>)}
            {DAYS.map((d, di) => (
              <div key={d} className="contents">
                <span className="self-center text-[11px] text-mist">{d}</span>
                {HEAT[di].map((v, hi) => {
                  const on = hover?.[0] === di && hover?.[1] === hi
                  return (
                    <motion.button key={hi} aria-label={`${d} ${HOURS[hi]} h`} onMouseEnter={() => setHover([di, hi])} onMouseLeave={() => setHover(null)}
                      initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: (di * 13 + hi) * 0.004, ease: EXPO }}
                      className={clsx('aspect-[1.5] rounded-[5px] ring-1 transition-[box-shadow]', on ? 'ring-bone/60' : 'ring-white/[0.03]')}
                      style={{ background: v < 0.08 ? 'rgb(var(--tint) / .03)' : `rgb(var(--acc-500) / ${(0.08 + v * 0.85).toFixed(2)})` }} />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11.5px] text-mist">
        <span className="min-h-[18px] text-bone/70">
          {hover ? <><span className="text-bone">{DAYS[hover[0]]} {HOURS[hover[1]]} h</span> · <span className="num">{Math.round(HEAT[hover[0]][hover[1]] * 14 * scale)}</span> interactions en moyenne</>
            : <>Pic : <span className="text-bone">{DAYS[peak[1]]} {HOURS[peak[2]]} h</span> · protégez ce créneau pour les RDV vendeurs</>}
        </span>
        <span className="flex items-center gap-1.5">Calme{[0.1, 0.3, 0.5, 0.7, 0.92].map((o) => <span key={o} className="h-2.5 w-4 rounded-[3px]" style={{ background: `rgb(var(--acc-500) / ${o})` }} />)}Intense</span>
      </div>
    </div>
  )
}

type SortKey = 'name' | 'agents' | 'mandats' | 'exclu' | 'ca' | 'delai' | 'adoption'

function AgencyTable({ scope }: { scope: Scope }) {
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: 'ca', dir: -1 })
  const rows = [...AGENCIES].sort((a, b) => (a[sort.k] > b[sort.k] ? 1 : -1) * sort.dir)
  const maxCa = Math.max(...AGENCIES.map((a) => a.ca))
  const cols: [SortKey, string][] = [['name', 'Agence'], ['agents', 'Conseillers'], ['mandats', 'Mandats'], ['exclu', 'Exclusivité'], ['ca', 'CA 12 mois'], ['delai', 'Délai médian'], ['adoption', 'Adoption']]
  return (
    <div className="overflow-x-auto thin-scroll">
      <table className="w-full min-w-[880px] text-left text-[13px]">
        <thead className="text-[10.5px] uppercase tracking-eyebrow text-mist">
          <tr className="border-b border-white/[0.06]">
            {cols.map(([k, l]) => (
              <th key={k} className="whitespace-nowrap px-5 py-3.5 font-normal">
                <button onClick={() => setSort({ k, dir: sort.k === k ? (-sort.dir as 1 | -1) : -1 })} className={clsx('inline-flex items-center gap-1 uppercase tracking-eyebrow transition hover:text-bone', sort.k === k && 'text-champagne-300')}>
                  {l}{sort.k === k && (sort.dir === 1 ? <CaretUp size={10} /> : <CaretDown size={10} />)}
                </button>
              </th>
            ))}
            <th className="px-5 py-3.5 font-normal">Mandats · 7 mois</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const home = scope === 'agence' && a.name === HOME
            return (
              <motion.tr layout transition={{ duration: 0.5, ease: EXPO }} key={a.name} className={clsx('border-b border-white/[0.04] transition hover:bg-white/[0.025]', home && 'bg-champagne/[0.05]')}>
                <td className="px-5 py-3"><div className="flex items-center gap-3"><span className={clsx('flex h-8 w-8 items-center justify-center rounded-xl font-serif text-[15px] italic', home ? 'bg-champagne text-ink' : 'bg-white/[0.05] text-champagne-300')}>{a.name[0]}</span><div><div>{a.name}</div>{home && <div className="text-[10.5px] text-champagne-300">Votre agence</div>}</div></div></td>
                <td className="num px-5 py-3 text-bone/75">{a.agents}</td>
                <td className="num px-5 py-3">{a.mandats}</td>
                <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="h-1 w-16 rounded-full bg-white/10"><div className="h-1 rounded-full bg-champagne" style={{ width: pct(a.exclu) }} /></div><span className="num whitespace-nowrap text-[12px]">{pct(a.exclu)}</span></div></td>
                <td className="px-5 py-3"><div className="num whitespace-nowrap">{eur(a.ca)}</div><div className="mt-1 h-[2px] w-20 rounded-full bg-white/[0.06]"><div className="h-[2px] rounded-full bg-sea" style={{ width: `${(a.ca / maxCa) * 100}%` }} /></div></td>
                <td className={clsx('num px-5 py-3', a.delai > 70 ? 'text-coral' : a.delai < 60 ? 'text-sage' : 'text-bone/80')}>{a.delai} j</td>
                <td className="px-5 py-3"><Ring value={a.adoption * 100} size={34} stroke={2.5} color={a.adoption < 0.75 ? 'rgb(var(--coral))' : 'rgb(var(--sage))'}><span className="num text-[9px]">{Math.round(a.adoption * 100)}</span></Ring></td>
                <td className="px-5 py-3"><Spark data={a.trend} w={96} h={28} color={home ? 'rgb(var(--acc-300))' : 'rgb(var(--acc-500))'} /></td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TeamDynamics({ scope }: { scope: Scope }) {
  const [tab, setTab] = useState<'prog' | 'help'>('prog')
  const [tasks, tops] = useTasks()
  const pool = TEAM.filter((m) => scope === 'reseau' || m.agency === HOME)
  const list = tab === 'help' ? pool.filter((m) => m.help) : [...pool].sort((a, b) => (b.mandats - b.prev) / Math.max(1, b.prev) - (a.mandats - a.prev) / Math.max(1, a.prev))
  const offer = async (m: Member, done: boolean) => {
    try {
      if (done) { await tops.remove(`coach-${m.id}`); toast('Proposition de binôme retirée', 'info') }
      else { await tops.create({ id: `coach-${m.id}`, title: `Coup de main — ${m.name} : ${lc(m.help ?? '')}`, due: 'Lun. 19 oct.', prio: 'normale', kind: 'appeler', ai: true }); toast(`Tâche créée pour accompagner ${m.name.split(' ')[0]}`) }
    } catch (e) { toast(errText(e), 'error') }
  }
  return (
    <Card kicker="Équipe · sans podium" title="Dynamique de progression" className="h-full">
      <div className="mb-3"><Tabs id="pl-team" value={tab} onChange={setTab} items={[{ id: 'prog', label: 'Progression' }, { id: 'help', label: 'Coup de main', count: pool.filter((m) => m.help).length }]} /></div>
      <p className="mb-4 flex items-start gap-2 text-[12px] text-bone/50"><Info size={14} className="mt-0.5 shrink-0" />Chacun est comparé à lui-même sur 90 jours ({HIST}). Aucune donnée individuelle n’est affichée hors de l’équipe.</p>
      <AnimatePresence mode="popLayout">
        <div className="space-y-2">
          {list.map((m) => {
            const delta = m.mandats - m.prev
            const done = tasks.some((t) => t.id === `coach-${m.id}`)
            return (
              <motion.div layout key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EXPO }}
                className={clsx('rounded-2xl p-3 ring-1', m.help && tab === 'help' ? 'bg-champagne/[0.04] ring-champagne/15' : 'bg-white/[0.02] ring-white/[0.05]')}>
                <div className="flex items-center gap-3">
                  <Face m={m} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="truncate text-[13.5px] font-medium">{m.name}</span>{scope === 'reseau' && <span className="hidden truncate text-[11px] text-mist sm:inline">{m.agency}</span>}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 whitespace-nowrap text-[11px] text-mist">
                      <span>Transfo <span className="num text-bone/80">{m.transfo} %</span></span>
                      <span>Sans retouche <span className="num text-bone/80">{m.livrables} %</span></span>
                      <span className="hidden sm:inline">Copilote <span className="num text-bone/80">{m.adoption} %</span></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="num text-[13px]">{m.prev} → {m.mandats}</div>
                    <div className={clsx('num text-[11px]', delta > 0 ? 'text-sage' : delta < 0 ? 'text-champagne-300' : 'text-mist')}>{delta > 0 ? `+${delta}` : delta === 0 ? 'stable' : delta} mandats</div>
                  </div>
                </div>
                {(m.win || m.help) && (
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.05] pt-2.5 text-[12px]">
                    {m.help ? <span className="flex items-center gap-1.5 text-bone/70"><HandHeart size={14} className="shrink-0 text-champagne-300" />{m.help}</span>
                      : <span className="flex items-center gap-1.5 text-bone/70"><TrendUp size={14} className="text-sage" />{m.win}</span>}
                    {m.help && <button onClick={() => offer(m, done)} title={done ? 'Retirer la tâche créée' : 'Crée une tâche de binôme pour lundi'} className={clsx('rounded-full px-3 py-1 text-[11.5px] ring-1 transition', done ? 'bg-sage/10 text-sage ring-sage/25' : 'bg-white/[0.04] ring-white/10 hover:bg-white/[0.08]')}>{done ? 'Tâche créée ✓' : 'Proposer un binôme'}</button>}
                  </div>
                )}
              </motion.div>
            )
          })}
          {!list.length && <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-[12.5px] text-mist">Personne n’a besoin d’un coup de main cette semaine.</div>}
        </div>
      </AnimatePresence>
    </Card>
  )
}

type BlockedRow = ReturnType<typeof useLive>['blocked'][number]

function BlockedList({ rows }: { rows: BlockedRow[] }) {
  const nav = useNavigate()
  return (
    <Card kicker={`${rows.length} à débloquer · en direct`} title="Dossiers bloqués" className="h-full" action={<Link to="/app/dossiers" className="text-[12px] text-mist hover:text-bone">Tous les dossiers →</Link>}>
      {!rows.length ? <Empty title="Rien ne bloque">Aucun livrable bloqué ni échéance dépassée dans les dossiers.</Empty> : (
        <div className="space-y-2">
          {rows.map(({ d, reasons, late }) => {
            const p = prop(d.propertyId), o = agent(d.agentId)
            return (
              <motion.div layout key={d.id} className="flex flex-col gap-3 rounded-2xl bg-white/[0.02] p-3 ring-1 ring-white/[0.05]">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <img src={p.photo} alt="" className="h-12 w-14 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><span className="truncate text-[13px] font-medium">{p.title}</span><span className="num hidden shrink-0 text-[10.5px] text-mist sm:inline">{d.ref}</span></div>
                    {reasons.map((r) => <div key={r} className="mt-0.5 flex items-start gap-1.5 text-[11.5px] text-bone/55">{r.startsWith('Échéance') ? <Clock size={12} className="mt-0.5 shrink-0 text-coral" /> : <FileText size={12} className="mt-0.5 shrink-0 text-coral" />}{r}</div>)}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-mist"><Avatar src={o.photo} size={18} /><span className="whitespace-nowrap">{o.name}</span><span className="whitespace-nowrap">· {d.seller}</span>{late && <span className="whitespace-nowrap rounded-full bg-coral/10 px-1.5 text-coral">en retard</span>}</div>
                  </div>
                </div>
                <button onClick={() => nav(`/app/dossiers/${d.id}`)}
                  className="flex shrink-0 items-center gap-2 self-start rounded-full bg-white/[0.04] px-3 py-1.5 text-[12px] ring-1 ring-white/10 transition hover:bg-champagne hover:text-ink hover:ring-champagne sm:ml-[4.25rem]">
                  <Sparkle size={12} weight="fill" className="text-champagne" />{d.next}<ArrowSquareOut size={12} />
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

function MondayMeeting({ scope, kpis, blocked }: { scope: Scope; kpis: Kpi[]; blocked: BlockedRow[] }) {
  const k = kpis
  const meeting = `2026-10-13:${scope}`
  const [notes, nops] = useNotes() as unknown as [Decision[], Ops<Decision>]
  const decisions = notes.filter((n) => n.meeting === meeting).sort((a, b) => (a.at ?? '').localeCompare(b.at ?? ''))
  const helpers = TEAM.filter((m) => m.help && (scope === 'reseau' || m.agency === HOME))
  const over = AI_COSTS.filter((a) => a.spent > a.budget)
  const agenda = [
    { min: 5, title: 'Victoires de la semaine', detail: TEAM.filter((m) => m.win && (scope === 'reseau' || m.agency === HOME)).map((m) => `${m.name.split(' ')[0]} : ${lc(m.win!)}`).join(' · ') },
    { min: 10, title: `Chiffres clés · ${lc(k[0].label)} ${k[0].value}`, detail: `Mandats actifs ${k[1].value}, exclusivité ${k[2].value}, transformation ${k[4].value}, délai ${k[3].value}` },
    { min: 15, title: `Dossiers bloqués (${blocked.length})`, detail: blocked.length ? blocked.map((b) => `${b.d.ref} : ${b.reasons[0]}`).join(' · ') : 'Aucun dossier bloqué' },
    { min: 10, title: 'Entraide & coaching', detail: helpers.length ? helpers.map((m) => `${m.name.split(' ')[0]} : ${m.help}`).join(' · ') : 'Aucune demande cette semaine' },
    ...(scope === 'reseau' && over.length ? [{ min: 5, title: 'Budget IA', detail: over.map((a) => `${a.agency} à ${Math.round((a.spent / a.budget) * 100)} % du budget`).join(' · ') }] : []),
    { min: 5, title: 'Objectifs de la semaine', detail: 'Deux exclusivités supplémentaires, relances J+21 à jour, zéro livrable en attente > 48 h' },
  ]
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const total = agenda.reduce((s, a) => s + a.min, 0)
  const md = () => [`# Réunion commerciale · lundi 19 octobre 2026, 09:00`, `Périmètre : ${scope === 'agence' ? HOME : 'Réseau Riviera'} · ${total} min`, '', '## Ordre du jour', ...agenda.map((a, i) => `${i + 1}. ${a.title} (${a.min} min)\n   ${a.detail}`), '', '## Décisions', ...(decisions.length ? decisions.map((d) => `- [${d.done ? 'x' : ' '}] ${d.text} — ${d.by}`) : ['_Aucune décision consignée._']), '', `_Chiffres : CRM NXT Agent, extraits le ${new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}. Séries de tendance : ${HIST}._`].join('\n')
  const add = async () => {
    const text = draft.trim()
    if (!text) return toast('Saisissez une décision', 'error')
    setBusy(true)
    try { await nops.create({ text, at: new Date().toISOString(), by: me.name, meeting, done: false }); setDraft(''); toast('Décision consignée') }
    catch (e) { toast(errText(e), 'error') } finally { setBusy(false) }
  }
  const run = (p: Promise<unknown>, ok?: string) => p.then(() => ok && toast(ok)).catch((e) => toast(errText(e), 'error'))
  return (
    <Card pad={false} className="h-full">
      <div className="relative overflow-hidden rounded-t-[calc(1.4rem-0.25rem)] p-5">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-champagne/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-eyebrow text-mist"><CalendarCheck size={13} />Lundi 13 octobre · 09:00</div>
            <h2 className="display mt-2 text-[2rem]">Réunion <span className="italic text-champagne-300">commerciale</span></h2>
            <div className="mt-1 flex items-center gap-1.5 text-[12px] text-champagne-300"><Sparkle size={12} weight="fill" />Ordre du jour généré à partir des données de la semaine · {total} min</div>
          </div>
          <div className="flex gap-2">
            <SoftBtn icon={<Copy size={14} />} onClick={() => navigator.clipboard?.writeText(md()).then(() => toast('Compte rendu copié'), () => toast('Copie refusée par le navigateur', 'error'))}>Copier</SoftBtn>
            <SoftBtn tone="gold" icon={<DownloadSimple size={14} />} onClick={() => { download(`reunion-lundi-13-octobre-${scope}.md`, md(), 'text/markdown'); toast('Compte rendu exporté (.md)') }}>Exporter .md</SoftBtn>
          </div>
        </div>
      </div>
      <div className="grid gap-5 p-5 pt-0 lg:grid-cols-[1.4fr_1fr]">
        <ol className="space-y-1.5">
          {agenda.map((a, i) => (
            <li key={a.title} className="flex gap-3 rounded-2xl bg-white/[0.02] p-3 ring-1 ring-white/[0.05]">
              <span className="num mt-0.5 text-[11px] text-champagne-300">{String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-[13px] font-medium">{a.title}</span><span className="num flex shrink-0 items-center gap-1 text-[11px] text-mist"><Clock size={11} />{a.min} min</span></div><div className="mt-0.5 text-[11.5px] leading-relaxed text-bone/50">{a.detail}</div></div>
            </li>
          ))}
        </ol>
        <div>
          <div className="mb-2 flex items-center justify-between text-[10.5px] uppercase tracking-eyebrow text-mist"><span>Décisions & suites</span><span className="num normal-case tracking-normal">{decisions.filter((d) => d.done).length}/{decisions.length}</span></div>
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {decisions.map((d) => (
                <motion.div key={d.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: EXPO }} className="group flex items-start gap-1 overflow-hidden rounded-xl transition hover:bg-white/[0.03]">
                  <button onClick={() => run(nops.update(d.id, { done: !d.done }))} className="flex min-w-0 flex-1 items-start gap-2.5 px-2 py-2 text-left text-[12.5px]" aria-pressed={!!d.done}>
                    {d.done ? <CheckCircle size={17} weight="fill" className="shrink-0 text-sage" /> : <span className="mt-[1px] h-4 w-4 shrink-0 rounded-full ring-1 ring-white/25" />}
                    <span className="min-w-0"><span className={clsx(d.done && 'text-bone/45 line-through')}>{d.text}</span><span className="block text-[10.5px] text-mist">{d.by}</span></span>
                  </button>
                  <button onClick={() => run(nops.remove(d.id), 'Décision supprimée')} aria-label="Supprimer la décision" className="mr-1 mt-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-mist opacity-60 transition hover:bg-coral/10 hover:text-coral group-hover:opacity-100"><Trash size={13} /></button>
                </motion.div>
              ))}
            </AnimatePresence>
            {!decisions.length && <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-[12px] text-mist">Aucune décision consignée pour cette réunion.</div>}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); add() }} className="mt-2 flex items-center gap-2 rounded-full bg-white/[0.03] p-1 pl-4 ring-1 ring-white/[0.07] focus-within:ring-champagne/40">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={240} placeholder="Ajouter une décision…" aria-label="Nouvelle décision" className="min-w-0 flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-mist" />
            {draft && <button type="button" onClick={() => setDraft('')} aria-label="Effacer" className="text-mist hover:text-bone"><X size={13} /></button>}
            <button type="submit" disabled={busy} aria-label="Ajouter" className="flex h-7 w-7 items-center justify-center rounded-full bg-champagne text-ink disabled:opacity-50"><Plus size={13} /></button>
          </form>
        </div>
      </div>
    </Card>
  )
}

function AiCosts({ runs }: { runs: { n: number; cost: number } }) {
  const total = AI_COSTS.reduce((s, a) => s + a.spent, 0), budget = AI_COSTS.reduce((s, a) => s + a.budget, 0)
  const max = Math.max(...AI_COSTS.map((a) => Math.max(a.spent, a.budget)))
  return (
    <Card kicker={`Octobre · au 11 · ${HIST}`} title="Coûts IA par agence" className="h-full" action={<span className="num text-[12px] text-bone/70">{total.toLocaleString('fr-FR')} / {budget.toLocaleString('fr-FR')} €</span>}>
      <div className="space-y-3.5">
        {AI_COSTS.map((a, i) => {
          const overB = a.spent > a.budget
          return (
            <div key={a.agency}>
              <div className="mb-1.5 flex items-center justify-between text-[12px]"><span className="text-bone/80">{a.agency}</span><span className={clsx('num', overB ? 'text-coral' : 'text-bone/60')}>{a.spent} € <span className="text-mist">/ {a.budget}</span>{overB && <Warning size={12} weight="fill" className="ml-1 inline" />}</span></div>
              <div className="relative h-2 rounded-full bg-white/[0.05]">
                <motion.div className="absolute inset-y-0 left-0 flex overflow-hidden rounded-full" initial={{ width: 0 }} animate={{ width: `${(a.spent / max) * 100}%` }} transition={{ duration: 1, delay: i * 0.06, ease: EXPO }}>
                  {a.split.map((s, j) => <span key={j} style={{ width: `${s}%`, background: overB ? ['rgb(var(--coral))', 'rgb(var(--coral) / .7)', 'rgb(var(--coral) / .45)'][j] : ['rgb(var(--acc-500))', 'rgb(var(--sea))', 'rgb(var(--sage))'][j] }} />)}
                </motion.div>
                <span className="absolute -top-1 h-4 w-[2px] rounded bg-bone/70" style={{ left: `${(a.budget / max) * 100}%` }} title="Budget" />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/[0.06] pt-3 text-[11px] text-mist">
        {AI_SPLIT_LABELS.map((l, j) => <span key={l} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: ['rgb(var(--acc-500))', 'rgb(var(--sea))', 'rgb(var(--sage))'][j] }} />{l}</span>)}
        <span className="flex items-center gap-1.5"><span className="h-3 w-[2px] bg-bone/70" />Budget</span>
      </div>
      <div className="mt-3 rounded-xl bg-coral/[0.06] p-3 text-[12px] text-bone/70 ring-1 ring-coral/15"><span className="text-coral">Cap d’Antibes à 114 %</span> : 47 % du budget part en avant/après L8. Suggestion : plafonner à 2 variantes par pièce.</div>
      <div className="mt-2 flex items-center gap-2 text-[11.5px] text-bone/55"><span className="h-1.5 w-1.5 rounded-full bg-sage" />En direct : <span className="num text-bone/80">{runs.n}</span> exécutions de routines · <span className="num text-bone/80">{runs.cost.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span> consommés</div>
    </Card>
  )
}

function Quality({ live }: { live: { gen: number; validated: number; clean: number } }) {
  const total = QUALITY.reduce((s, q) => s + q.n, 0)
  const avg = Math.round(QUALITY.reduce((s, q) => s + q.rate * q.n, 0) / total)
  return (
    <Card kicker={`${total.toLocaleString('fr-FR')} livrables · 90 j · ${HIST}`} title="Qualité des livrables" className="h-full">
      <div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-white/[0.02] p-3 ring-1 ring-white/[0.05]">
        {([['Générés', live.gen], ['Validés', live.validated], ['Sans retouche', live.validated ? `${live.clean} %` : '—']] as const).map(([l, v]) => <div key={l}><div className="flex items-center gap-1.5 text-[10px] uppercase tracking-eyebrow text-mist">{l === 'Générés' && <span className="h-1.5 w-1.5 rounded-full bg-sage" />}{l}</div><div className="num mt-1 text-[17px]">{v}</div></div>)}
      </div>
      <div className="mb-5 flex items-center gap-4">
        <Ring value={avg} size={68} stroke={4}><span className="display text-[1.4rem]">{avg}<span className="text-[0.7rem] text-mist">%</span></span></Ring>
        <div className="text-[12.5px] text-bone/60">validés <span className="text-bone">sans aucune retouche</span> par le conseiller. Chaque retouche alimente le modèle de l’agence.</div>
      </div>
      <div className="space-y-2">
        {QUALITY.map((q, i) => {
          const c = q.rate >= 85 ? 'rgb(var(--sage))' : q.rate >= 75 ? 'rgb(var(--acc-500))' : 'rgb(var(--coral))'
          return (
            <div key={q.code} className="grid grid-cols-[2.2rem_1fr_2.6rem] items-center gap-2 text-[12px]" title={`${q.name} · ${q.n} livrables`}>
              <span className="num text-mist">{q.code}</span>
              <div className="h-1.5 rounded-full bg-white/[0.05]"><motion.div className="h-1.5 rounded-full" style={{ background: c }} initial={{ width: 0 }} animate={{ width: `${q.rate}%` }} transition={{ duration: 1, delay: i * 0.05, ease: EXPO }} /></div>
              <span className="num text-right">{q.rate} %</span>
            </div>
          )
        })}
      </div>
      <div className="mt-4 text-[11.5px] text-bone/50"><span className="text-coral">L7</span> : les retouches portent surtout sur l’ajustement « vue mer » des comparables.</div>
    </Card>
  )
}

export default function Pilotage() {
  const [scope, setScope] = useState<Scope>('agence')
  const live = useLive()
  const kpis: LiveKpi[] = scope === 'agence' ? live.kpis : KPIS.reseau.map((k) => ({ ...k, live: false, source: `${k.source} · ${HIST}` }))
  const funnel = scope === 'agence' ? live.funnel : FUNNEL.reseau
  const ca = CA_SERIES[scope], md = MANDATS_SERIES[scope]
  const exportCsv = () => {
    download(`kpi-${scope}-${new Date().toISOString().slice(0, 10)}.csv`, csv([['Indicateur', 'Valeur', 'Écart', 'Détail', 'Source', 'Origine'], ...kpis.map((k) => [k.label, k.value, k.delta, k.hint, k.source, k.live ? 'en direct' : HIST]), [], ['Entonnoir', 'Effectif'], ...funnel.map((f) => [f.label, f.n])]), 'text/csv')
    toast('Indicateurs exportés (.csv)')
  }
  const last = funnel[funnel.length - 1].n, first = funnel[1].n
  return (
    <div>
      <PageHeader
        kicker="Pilotage"
        title={<>Agence & <span className="italic text-champagne-300">réseau</span></>}
        sub={<>{scope === 'agence' ? `${HOME} · indicateurs recalculés en direct depuis les dossiers, transactions et exécutions du copilote` : 'Réseau Riviera · 6 agences, 39 conseillers · consolidation du lundi 12 octobre à 07:00'} · sources au survol.</>}
        actions={<>
          <Tabs id="pl-scope" value={scope} onChange={setScope} items={[{ id: 'agence', label: <span className="flex items-center gap-1.5"><Buildings size={14} weight="light" />Agence</span> }, { id: 'reseau', label: <span className="flex items-center gap-1.5"><Globe size={14} weight="light" />Réseau</span> }]} />
          <SoftBtn icon={<DownloadSimple size={14} />} onClick={exportCsv}>Exporter .csv</SoftBtn>
        </>}
      />

      <AnimatePresence mode="wait">
        <motion.div key={scope} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.45, ease: EXPO }} className="space-y-6">
          {/* KPIs */}
          <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-6">
            {kpis.map((k) => (
              <Card key={k.id} className="group">
                <div className="flex items-center justify-between gap-2 text-[11.5px] text-mist"><span className="truncate">{k.label}</span><span className={clsx('num shrink-0 whitespace-nowrap', k.good ? 'text-sage' : 'text-coral')}>{k.delta}</span></div>
                <div className="display mt-2 text-[2.3rem] leading-none">{k.value}</div>
                <div className="mt-3 [&>svg]:h-auto [&>svg]:w-full"><Spark data={k.spark} w={150} h={26} color={k.id === 'adoption' ? 'rgb(var(--sage))' : 'rgb(var(--acc-500))'} /></div>
                <div className="mt-2 truncate text-[11px] text-bone/45">{k.hint}</div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-eyebrow text-mist"><span className={clsx('h-1.5 w-1.5 rounded-full', k.live ? 'bg-sage' : 'bg-white/25')} />{k.live ? 'En direct' : 'Historique importé'}</div>
                <div className="mt-1 max-h-0 overflow-hidden text-[10.5px] text-mist opacity-0 transition-all duration-500 ease-silk group-hover:max-h-12 group-hover:opacity-100">Source : {k.source}</div>
              </Card>
            ))}
          </Stagger>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Stagger i={1} className="lg:col-span-7">
              <Card kicker={`Chiffre d’affaires signé · k€ · ${HIST}`} title="12 derniers mois" className="h-full"
                action={<div className="flex items-center gap-4 text-[11px] text-mist"><span className="flex items-center gap-1.5"><span className="h-[2px] w-4 rounded bg-champagne" />2025–26</span><span className="flex items-center gap-1.5"><span className="h-px w-4 border-t border-dashed border-sea" />N-1</span></div>}>
                <AreaChart n={ca.n} n1={ca.n1} />
              </Card>
            </Stagger>
            <Stagger i={2} className="lg:col-span-5">
              <Card kicker={scope === 'agence' ? 'Pipeline · en direct' : `Pipeline · 90 jours · ${HIST}`} title="Entonnoir vendeur" className="h-full" action={<span className="num whitespace-nowrap text-[11px] text-sage">{first ? Math.round((last / first) * 100) : 0} % {scope === 'agence' ? 'RDV' : 'estim.'} → acte</span>}>
                <Funnel steps={funnel} />
              </Card>
            </Stagger>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Stagger i={3} className="lg:col-span-7">
              <Card kicker={`RDV, visites, appels · 8 semaines · ${HIST}`} title="Quand l’équipe est sur le terrain" className="h-full"><Heatmap scale={scope === 'reseau' ? 5.2 : 1} /></Card>
            </Stagger>
            <Stagger i={4} className="lg:col-span-5">
              <Card kicker={`Mandats rentrés · ${HIST}`} title="Exclusifs et simples" className="h-full"
                action={<div className="flex items-center gap-3 text-[11px] text-mist"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-champagne" />Exclusifs</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-white/20" />Simples</span></div>}>
                <StackedBars ex={md.ex} simple={md.simple} />
              </Card>
            </Stagger>
          </div>

          <Stagger i={5}>
            <Card pad={false} kicker={`Réseau Riviera · ${HIST}`} title="Agences" action={<span className="text-[11.5px] text-mist">Cliquez une colonne pour trier</span>}><AgencyTable scope={scope} /></Card>
          </Stagger>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Stagger i={6} className="lg:col-span-6"><TeamDynamics scope={scope} /></Stagger>
            <Stagger i={7} className="lg:col-span-6"><BlockedList rows={live.blocked} /></Stagger>
          </div>

          <Stagger i={8}><MondayMeeting scope={scope} kpis={kpis} blocked={live.blocked} /></Stagger>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Stagger i={9} className="lg:col-span-7"><AiCosts runs={live.runStats} /></Stagger>
            <Stagger i={10} className="lg:col-span-5"><Quality live={live.docStats} /></Stagger>
          </div>
          <Link to="/app/reglages?s=conformite" className="flex items-center justify-end gap-1.5 text-[11px] text-mist transition hover:text-bone">Toutes les données individuelles restent visibles de l’équipe concernée uniquement <ArrowRight size={11} /> Réglages · Conformité</Link>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
