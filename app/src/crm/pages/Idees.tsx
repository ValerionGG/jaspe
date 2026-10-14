import { motion, AnimatePresence } from 'motion/react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  MagnifyingGlass, SquaresFour, Crosshair, Kanban, X, Cube, Lightning, HandPointing, Database, ShieldCheck, TrendUp,
  ArrowCounterClockwise, CaretDown, ThumbsUp, Plus, CheckCircle, Lightbulb, Rocket, Trash,
} from '@phosphor-icons/react'
import { PageHeader, Card, Tabs, SoftBtn, Stagger, IconBtn, Empty } from '../ui'
import { EXPO } from '../../ui/kit'
import { me } from '../../data/mock'
import { useIdeas } from '../../data/collections'
import { Modal, Field, Input, Select, Textarea, AsyncForm, toast, errText } from '../forms'

type Phase = 'P0' | 'P1' | 'P2' | 'P3'
type Effort = 'S' | 'M' | 'L' | 'XL'
type Kind = 'feature' | 'automation' | 'ux' | 'data' | 'compliance' | 'growth'
type Status = 'livré' | 'maquette' | 'proposé'
type Idea = { id: string; theme: string; title: string; benefit: string; phase: Phase; effort: Effort; impact: number; kind: Kind; status: Status; votes: number; voters: string[]; sprint: boolean; custom: boolean }

const PHASES: Phase[] = ['P0', 'P1', 'P2', 'P3']
const EFFORTS: Effort[] = ['S', 'M', 'L', 'XL']
const KINDS: Kind[] = ['feature', 'automation', 'ux', 'data', 'compliance', 'growth']
const STATUSES: Status[] = ['livré', 'maquette', 'proposé']
/** Normalisation tolérante d’un document de la collection `ideas`. */
const norm = (r: Record<string, unknown>, i: number): Idea[] => {
  if (!r || typeof r.title !== 'string') return []
  const o = r as Partial<Idea>
  const voters = Array.isArray(o.voters) ? o.voters.map(String) : []
  return [{
    id: String(o.id ?? `idea-${i}`), theme: o.theme || 'Divers', title: String(o.title), benefit: o.benefit ?? '',
    phase: PHASES.includes(o.phase as Phase) ? (o.phase as Phase) : 'P3', effort: EFFORTS.includes(o.effort as Effort) ? (o.effort as Effort) : 'M',
    impact: Math.min(5, Math.max(1, Math.round(Number(o.impact) || 3))), kind: KINDS.includes(o.kind as Kind) ? (o.kind as Kind) : 'feature',
    status: STATUSES.includes(o.status as Status) ? (o.status as Status) : 'proposé',
    votes: Math.max(Number(o.votes) || 0, voters.length), voters, sprint: !!o.sprint, custom: !!o.custom,
  }]
}

const PHASE_L: Record<Phase, string> = { P0: 'Maintenant', P1: 'Prochain trimestre', P2: 'Semestre suivant', P3: 'Horizon' }
const KIND_L: Record<Kind, { l: string; i: typeof Cube }> = {
  feature: { l: 'Fonctionnalité', i: Cube }, automation: { l: 'Automatisation', i: Lightning }, ux: { l: 'Expérience', i: HandPointing },
  data: { l: 'Données', i: Database }, compliance: { l: 'Conformité', i: ShieldCheck }, growth: { l: 'Croissance', i: TrendUp },
}
const STATUS_C: Record<Status, { c: string; dot: string; hex: string }> = {
  'livré': { c: 'bg-sage/10 text-sage ring-sage/25', dot: 'bg-sage', hex: 'rgb(var(--sage))' },
  'maquette': { c: 'bg-champagne/10 text-champagne-300 ring-champagne/25', dot: 'bg-champagne', hex: 'rgb(var(--acc-500))' },
  'proposé': { c: 'bg-sea/10 text-sea ring-sea/25', dot: 'bg-sea/60', hex: 'rgb(var(--sea) / .6)' },
}
const EFFORT_W: Record<Effort, number> = { S: 1, M: 2, L: 3, XL: 5 }
const score = (i: Idea) => Math.round((i.impact / EFFORT_W[i.effort]) * 20)
const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16 // avalanche : ids voisins → positions dispersées
  return (h >>> 0) / 4294967295
}
const PAGE = 30

function Impact({ n }: { n: number }) {
  return <span className="inline-flex gap-[3px]" title={`Impact ${n}/5`}>{[1, 2, 3, 4, 5].map((k) => <span key={k} className={clsx('h-1.5 w-1.5 rounded-full', k <= n ? 'bg-champagne' : 'bg-white/10')} />)}</span>
}
function StatusPill({ s }: { s: Status }) {
  return <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] ring-1', STATUS_C[s].c)}><span className={clsx('h-1.5 w-1.5 rounded-full', STATUS_C[s].dot)} />{s}</span>
}
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={clsx('inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] ring-1 transition-all duration-300 ease-silk', on ? 'bg-champagne/15 text-champagne-300 ring-champagne/30' : 'bg-white/[0.03] text-bone/60 ring-white/[0.07] hover:text-bone')}>{children}</button>
}

function IdeaCard({ i, onOpen }: { i: Idea; onOpen: () => void }) {
  const K = KIND_L[i.kind]
  return (
    <button onClick={onOpen} className="group flex h-full w-full flex-col rounded-[1.3rem] bg-ink-800/80 p-4 text-left ring-1 ring-white/[0.06] transition-all duration-500 ease-silk hover:-translate-y-0.5 hover:ring-champagne/30 hover:shadow-float">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2"><span className="num rounded-full bg-white/[0.05] px-2 py-0.5 text-[10.5px] text-bone/80">{i.phase}</span><span className="flex items-center gap-1 text-[11px] text-mist"><K.i size={12} weight="light" />{K.l}</span></span>
        <StatusPill s={i.status} />
      </div>
      <div className="mt-3 text-[14px] font-medium leading-snug tracking-[-0.01em]">{i.title}</div>
      <p className="mt-1.5 line-clamp-2 flex-1 text-[12.5px] leading-relaxed text-bone/55">{i.benefit}</p>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.05] pt-3 text-[11px] text-mist">
        <span className="truncate">{i.theme}</span>
        <span className="flex shrink-0 items-center gap-3">{i.sprint && <Rocket size={12} weight="fill" className="text-champagne" aria-label="Dans le sprint" />}{i.votes > 0 && <span className="num flex items-center gap-1 text-bone/70"><ThumbsUp size={11} weight={i.voters.includes(me.id) ? 'fill' : 'light'} className={i.voters.includes(me.id) ? 'text-champagne' : ''} />{i.votes}</span>}<Impact n={i.impact} /><span className="num rounded-md bg-white/[0.05] px-1.5 text-bone/70">{i.effort}</span></span>
      </div>
    </button>
  )
}

function Matrix({ items, onOpen }: { items: Idea[]; onOpen: (i: Idea) => void }) {
  const [hover, setHover] = useState<Idea | null>(null)
  const W = 860, H = 500, L = 56, R = 16, T = 34, B = 44
  const cw = (W - L - R) / 4, ch = (H - T - B) / 5
  const pos = (i: Idea) => {
    const cx = L + EFFORTS.indexOf(i.effort) * cw, cy = T + (5 - i.impact) * ch
    return [cx + 12 + hash(i.id) * (cw - 24), cy + 10 + hash(i.id + 'y') * (ch - 20)]
  }
  const counts = useMemo(() => { const m: Record<string, number> = {}; items.forEach((i) => { const k = i.effort + i.impact; m[k] = (m[k] ?? 0) + 1 }); return m }, [items])
  const hp = hover && pos(hover)
  return (
    <Card kicker={`${items.length} idées · position légèrement dispersée dans chaque case`} title="Matrice impact × effort"
      action={<div className="flex gap-3 text-[11px] text-mist">{STATUSES.map((s) => <span key={s} className="flex items-center gap-1.5"><span className={clsx('h-2 w-2 rounded-full', STATUS_C[s].dot)} />{s}</span>)}</div>}>
      <div className="relative overflow-x-auto thin-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[640px]">
          <rect x={L} y={T} width={cw * 2} height={ch * 2} rx="10" fill="rgb(var(--sage) / .06)" />
          <text x={L + 4} y={T - 12} fontSize="10.5" fill="rgb(var(--sage))" letterSpacing="2">↖ GAINS RAPIDES</text>
          <text x={W - R - 4} y={T - 12} fontSize="10.5" fill="rgb(var(--acc-500))" textAnchor="end" letterSpacing="2">PARIS STRATÉGIQUES ↗</text>
          <text x={W - R - 4} y={H - B + 38} fontSize="10.5" fill="rgb(var(--mist-600))" textAnchor="end" letterSpacing="2">À QUESTIONNER ↘</text>
          {EFFORTS.map((e, xi) => <g key={e}>
            {xi > 0 && <line x1={L + xi * cw} x2={L + xi * cw} y1={T} y2={H - B} stroke="rgb(var(--tint) / .06)" />}
            <text x={L + xi * cw + cw / 2} y={H - B + 22} textAnchor="middle" className="num" fontSize="12" fill="rgb(var(--mist-300))">{e}</text>
          </g>)}
          {[1, 2, 3, 4, 5].map((v) => <g key={v}>
            {v < 5 && <line x1={L} x2={W - R} y1={T + (5 - v) * ch} y2={T + (5 - v) * ch} stroke="rgb(var(--tint) / .06)" />}
            <text x={L - 14} y={T + (5 - v) * ch + ch / 2 + 4} textAnchor="end" className="num" fontSize="12" fill="rgb(var(--mist-300))">{v}</text>
          </g>)}
          {EFFORTS.flatMap((e, xi) => [1, 2, 3, 4, 5].map((v) => counts[e + v] ? <text key={e + v} x={L + (xi + 1) * cw - 8} y={T + (5 - v) * ch + ch - 6} textAnchor="end" className="num" fontSize="9.5" fill="rgb(var(--mist-700))">{counts[e + v]}</text> : null))}
          <text x={L + (W - L - R) / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="rgb(var(--mist-600))" letterSpacing="2">EFFORT →</text>
          <text transform={`translate(14 ${T + (H - T - B) / 2}) rotate(-90)`} textAnchor="middle" fontSize="10" fill="rgb(var(--mist-600))" letterSpacing="2">IMPACT →</text>
          <rect x={L} y={T} width={W - L - R} height={H - T - B} rx="10" fill="none" stroke="rgb(var(--tint) / .08)" />
          {items.map((i, k) => {
            const [x, y] = pos(i)
            const dim = hover && hover.id !== i.id
            return (
              <motion.circle key={i.id} cx={x} cy={y} r={hover?.id === i.id ? 7 : 4.5} fill={STATUS_C[i.status].hex} fillOpacity={dim ? 0.25 : 0.85} stroke="rgb(var(--ink-900))" strokeWidth="1.2"
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: Math.min(k, 200) * 0.002, ease: EXPO }}
                style={{ cursor: 'pointer', transformOrigin: `${x}px ${y}px`, transformBox: 'view-box' }}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => onOpen(i)} />
            )
          })}
        </svg>
        <AnimatePresence>
          {hover && hp && (
            <motion.div key={hover.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              className="glass pointer-events-none absolute z-10 w-64 rounded-xl p-3 ring-1 ring-white/10"
              style={{ left: `${(hp[0] / W) * 100}%`, top: `${(hp[1] / H) * 100}%`, transform: `translate(${hp[0] > W * 0.6 ? 'calc(-100% - 12px)' : '12px'}, -50%)` }}>
              <div className="text-[12.5px] font-medium leading-snug">{hover.title}</div>
              <div className="mt-1 text-[11px] text-mist">{hover.theme} · {hover.phase} · score {score(hover)}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  )
}

function Board({ items, onOpen }: { items: Idea[]; onOpen: (i: Idea) => void }) {
  const [limit, setLimit] = useState<Record<Phase, number>>({ P0: 20, P1: 20, P2: 20, P3: 20 })
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 thin-scroll md:-mx-8 md:px-8">
      <div className="grid min-w-[1080px] grid-cols-4 gap-4">
        {PHASES.map((p, pi) => {
          const col = items.filter((i) => i.phase === p).sort((a, b) => score(b) - score(a))
          return (
            <Stagger key={p} i={pi}>
              <div className="rounded-[1.4rem] bg-white/[0.015] p-2 ring-1 ring-white/[0.05]">
                <div className="mb-2 flex items-center justify-between px-2 py-1.5">
                  <div className="flex items-center gap-2"><span className="num text-[11px] text-champagne-300">{p}</span><span className="text-[13px] font-medium">{PHASE_L[p]}</span></div>
                  <span className="num rounded-full bg-white/[0.05] px-2 text-[11px] text-bone/60">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.slice(0, limit[p]).map((i) => (
                    <button key={i.id} onClick={() => onOpen(i)} className="block w-full rounded-2xl bg-ink-700/70 p-3 text-left ring-1 ring-white/[0.06] transition hover:ring-champagne/30">
                      <div className="flex items-start justify-between gap-2"><span className="text-[12.5px] leading-snug">{i.title}</span><span className={clsx('mt-1 h-2 w-2 shrink-0 rounded-full', STATUS_C[i.status].dot)} title={i.status} /></div>
                      <div className="mt-2 flex items-center justify-between text-[10.5px] text-mist"><span className="truncate pr-2">{i.theme}</span><span className="flex shrink-0 items-center gap-2"><Impact n={i.impact} /><span className="num">{i.effort}</span></span></div>
                    </button>
                  ))}
                  {col.length > limit[p] && <button onClick={() => setLimit({ ...limit, [p]: limit[p] + 30 })} className="w-full rounded-xl py-2 text-[12px] text-mist ring-1 ring-white/[0.06] transition hover:text-bone">Afficher {Math.min(30, col.length - limit[p])} de plus · {col.length - limit[p]} restantes</button>}
                  {!col.length && <div className="rounded-xl border border-dashed border-white/[0.08] p-6 text-center text-[11.5px] text-mist">Aucune idée</div>}
                </div>
              </div>
            </Stagger>
          )
        })}
      </div>
    </div>
  )
}

type IdeaOps = ReturnType<typeof useIdeas>[1]

function Drawer({ idea, all, ops, onClose, onOpen }: { idea: Idea; all: Idea[]; ops: IdeaOps; onClose: () => void; onOpen: (i: Idea) => void }) {
  const K = KIND_L[idea.kind]
  const [confirm, setConfirm] = useState(false)
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])
  useEffect(() => setConfirm(false), [idea.id])
  const similar = all.filter((i) => i.theme === idea.theme && i.id !== idea.id).sort((a, b) => score(b) - score(a)).slice(0, 5)
  const voted = idea.voters.includes(me.id)
  const patch = (p: Partial<Idea>, ok: string) => ops.update(idea.id, p as never).then(() => toast(ok), (e) => toast(errText(e), 'error'))
  const vote = () => {
    const voters = voted ? idea.voters.filter((v) => v !== me.id) : [...idea.voters, me.id]
    patch({ voters, votes: Math.max(0, idea.votes - idea.voters.length) + voters.length }, voted ? 'Soutien retiré' : 'Idée soutenue')
  }
  const remove = () => ops.remove(idea.id).then(() => { toast('Idée supprimée'); onClose() }, (e) => toast(errText(e), 'error'))
  return (
    <motion.div className="fixed inset-0 z-[70] flex justify-end bg-ink/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.aside onClick={(e) => e.stopPropagation()} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }} transition={{ duration: 0.5, ease: EXPO }}
        role="dialog" aria-modal="true" aria-label={idea.title}
        className="thin-scroll h-full w-full max-w-[540px] overflow-y-auto border-l border-white/[0.07] bg-ink-850 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="num rounded-full bg-champagne/15 px-2.5 py-1 text-[12px] text-champagne-300">{idea.id}</span><StatusPill s={idea.status} />{idea.sprint && <span className="flex items-center gap-1 text-[11px] text-champagne-300"><Rocket size={12} weight="fill" />Sprint</span>}</div>
          <IconBtn label="Fermer" onClick={onClose}><X size={15} /></IconBtn>
        </div>
        <div className="mt-6 text-[11px] uppercase tracking-eyebrow text-mist">{idea.theme}</div>
        <h2 className="display mt-2 text-[2.4rem]">{idea.title}</h2>
        <p className="mt-4 text-[14.5px] leading-relaxed text-bone/75">{idea.benefit || 'Bénéfice à préciser.'}</p>
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[['Impact', <Impact key="i" n={idea.impact} />], ['Effort', <span key="e" className="num text-[15px]">{idea.effort}</span>], ['Type', <span key="k" className="flex items-center gap-1 text-[12.5px]"><K.i size={13} weight="light" />{K.l}</span>], ['Score', <span key="s" className="display text-[1.6rem] leading-none">{score(idea)}</span>]].map(([l, v]) => (
            <div key={l as string} className="rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]"><div className="mb-2 text-[10px] uppercase tracking-eyebrow text-mist">{l}</div>{v}</div>
          ))}
        </div>
        <div className="mt-2 text-[11px] text-mist">Score = impact ÷ poids d’effort (S 1, M 2, L 3, XL 5) × 20.</div>
        <div className="mt-6 flex flex-wrap gap-2">
          <SoftBtn tone={voted ? 'gold' : 'ghost'} icon={<ThumbsUp size={14} weight={voted ? 'fill' : 'light'} />} onClick={vote}>{voted ? 'Soutenue' : 'Soutenir'} · <span className="num">{idea.votes}</span></SoftBtn>
          <SoftBtn tone={idea.sprint ? 'light' : 'ghost'} icon={idea.sprint ? <CheckCircle size={14} weight="fill" /> : <Plus size={14} />} onClick={() => patch({ sprint: !idea.sprint }, idea.sprint ? 'Retirée du sprint' : 'Ajoutée au prochain sprint')}>{idea.sprint ? 'Dans le prochain sprint' : 'Ajouter au sprint'}</SoftBtn>
        </div>
        <div className="mt-6 grid gap-3 rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.05] sm:grid-cols-2">
          <Field label="Statut"><Select value={idea.status} onChange={(e) => patch({ status: e.target.value as Status }, `Statut : ${e.target.value}`)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
          <Field label="Phase"><Select value={idea.phase} onChange={(e) => patch({ phase: e.target.value as Phase }, `Phase ${e.target.value} · ${PHASE_L[e.target.value as Phase]}`)}>{PHASES.map((p) => <option key={p} value={p}>{p} · {PHASE_L[p]}</option>)}</Select></Field>
        </div>
        {idea.custom && (
          <div className="mt-3 flex items-center justify-between gap-2 text-[12px] text-mist">
            <span>Idée ajoutée manuellement</span>
            {confirm ? <span className="flex items-center gap-2"><button onClick={remove} className="rounded-full bg-coral/15 px-3 py-1.5 text-coral ring-1 ring-coral/25">Confirmer la suppression</button><button onClick={() => setConfirm(false)} className="hover:text-bone">Annuler</button></span>
              : <button onClick={() => setConfirm(true)} className="flex items-center gap-1.5 hover:text-coral"><Trash size={13} />Supprimer</button>}
          </div>
        )}
        {similar.length > 0 && (
          <div className="mt-8">
            <div className="mb-2 text-[10.5px] uppercase tracking-eyebrow text-mist">Dans le même thème</div>
            <div className="space-y-1.5">
              {similar.map((s) => (
                <button key={s.id} onClick={() => onOpen(s)} className="flex w-full items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2.5 text-left ring-1 ring-white/[0.05] transition hover:bg-white/[0.04]">
                  <span className={clsx('h-2 w-2 shrink-0 rounded-full', STATUS_C[s.status].dot)} />
                  <span className="min-w-0 flex-1 truncate text-[12.5px]">{s.title}</span>
                  <span className="num shrink-0 text-[11px] text-mist">{s.phase} · {s.effort}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.aside>
    </motion.div>
  )
}

export default function Idees() {
  const [view, setView] = useState<'cards' | 'matrix' | 'board'>('cards')
  const [q, setQ] = useState('')
  const dq = useDeferredValue(q)
  const [theme, setTheme] = useState('')
  const [phases, setPhases] = useState<Phase[]>([])
  const [kinds, setKinds] = useState<Kind[]>([])
  const [statuses, setStatuses] = useState<Status[]>([])
  const [limit, setLimit] = useState(PAGE)
  const [allThemes, setAllThemes] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [sprintOnly, setSprintOnly] = useState(false)
  const [raw, ops] = useIdeas()
  const IDEAS = useMemo(() => (raw as unknown as Record<string, unknown>[]).flatMap(norm), [raw])
  const open = IDEAS.find((i) => i.id === openId) ?? null
  const setOpen = (i: Idea | null) => setOpenId(i?.id ?? null)
  const sprintCount = IDEAS.filter((i) => i.sprint).length
  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void) => { set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]); setLimit(PAGE) }

  const themes = useMemo(() => { const m = new Map<string, number>(); IDEAS.forEach((i) => m.set(i.theme, (m.get(i.theme) ?? 0) + 1)); return [...m].sort((a, b) => b[1] - a[1]) }, [IDEAS])
  const list = useMemo(() => {
    const s = dq.trim().toLowerCase()
    return IDEAS.filter((i) => (!sprintOnly || i.sprint) && (!theme || i.theme === theme) && (!phases.length || phases.includes(i.phase)) && (!kinds.length || kinds.includes(i.kind)) && (!statuses.length || statuses.includes(i.status))
      && (!s || i.title.toLowerCase().includes(s) || i.benefit.toLowerCase().includes(s) || i.theme.toLowerCase().includes(s)))
  }, [IDEAS, dq, theme, phases, kinds, statuses, sprintOnly])
  const sorted = useMemo(() => [...list].sort((a, b) => PHASES.indexOf(a.phase) - PHASES.indexOf(b.phase) || score(b) - score(a)), [list])
  const active = !!(q || theme || phases.length || kinds.length || statuses.length || sprintOnly)
  const by = (s: Status) => IDEAS.filter((i) => i.status === s).length
  const reset = () => { setQ(''); setTheme(''); setPhases([]); setKinds([]); setStatuses([]); setSprintOnly(false); setLimit(PAGE) }

  return (
    <div>
      <PageHeader kicker="Produit · Jaspe" title={<>Feuille de <span className="italic text-champagne-300">route</span></>}
        sub={IDEAS.length ? <>{IDEAS.length} idées · {by('livré')} livrées · {by('maquette')} en maquette · {by('proposé')} proposées · {sprintCount} dans le prochain sprint. Soutenez, planifiez, faites évoluer.</> : 'Le catalogue d’idées est en cours de chargement.'}
        actions={<>
          <Tabs id="id-view" value={view} onChange={setView} items={[
            { id: 'cards', label: <span className="flex items-center gap-1.5"><SquaresFour size={14} />Cartes</span> },
            { id: 'matrix', label: <span className="flex items-center gap-1.5"><Crosshair size={14} />Matrice</span> },
            { id: 'board', label: <span className="flex items-center gap-1.5"><Kanban size={14} />Par phase</span> },
          ]} />
          <SoftBtn tone="gold" icon={<Plus size={14} />} onClick={() => setCreating(true)}>Nouvelle idée</SoftBtn>
        </>} />

      {!IDEAS.length ? <Empty title="Aucune idée pour l’instant"><button onClick={() => setCreating(true)} className="text-champagne-300 hover:underline">Proposer la première idée</button></Empty> : (
        <div className="space-y-6">
          {/* Compteurs par phase */}
          <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {PHASES.map((p) => {
              const all = IDEAS.filter((i) => i.phase === p), on = phases.includes(p)
              return (
                <button key={p} onClick={() => toggle(phases, p, setPhases)} className={clsx('rounded-[1.4rem] p-1 text-left ring-1 transition-all duration-500 ease-silk', on ? 'bg-champagne/[0.06] ring-champagne/30' : 'bg-white/[0.02] ring-white/[0.06] hover:ring-white/15')}>
                  <div className="h-full rounded-[calc(1.4rem-0.25rem)] bg-ink-800/80 p-5 shadow-bezel">
                    <div className="flex items-center justify-between text-[12px] text-mist"><span><span className="num text-champagne-300">{p}</span> · {PHASE_L[p]}</span>{on && <CheckCircle size={14} weight="fill" className="text-champagne" />}</div>
                    <div className="display mt-2 text-[2.6rem] leading-none">{all.length}</div>
                    <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-white/[0.05]">{STATUSES.map((s) => <span key={s} className={STATUS_C[s].dot} style={{ width: `${(all.filter((i) => i.status === s).length / Math.max(1, all.length)) * 100}%` }} />)}</div>
                    <div className="mt-2 hidden gap-3 text-[10.5px] text-mist sm:flex">{STATUSES.map((s) => <span key={s}><span className="num text-bone/70">{all.filter((i) => i.status === s).length}</span> {s}</span>)}</div>
                  </div>
                </button>
              )
            })}
          </Stagger>

          {/* Thèmes */}
          <Stagger i={1}>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:flex-wrap md:px-0">
              <Chip on={!theme} onClick={() => { setTheme(''); setLimit(PAGE) }}>Tous les thèmes <span className="num text-mist">{IDEAS.length}</span></Chip>
              {(allThemes ? themes : themes.filter(([t], k) => k < 9 || t === theme)).map(([t, n]) => <Chip key={t} on={theme === t} onClick={() => { setTheme(theme === t ? '' : t); setLimit(PAGE) }}>{t} <span className="num text-mist">{n}</span></Chip>)}
              {themes.length > 9 && <button onClick={() => setAllThemes(!allThemes)} className="shrink-0 whitespace-nowrap px-2 py-1.5 text-[12px] text-champagne-300 hover:text-champagne">{allThemes ? 'Réduire' : `+ ${themes.length - 9} thèmes`}</button>}
            </div>
          </Stagger>

          {/* Filtres */}
          <Stagger i={2}>
            <Card>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                <label className="flex flex-1 items-center gap-2.5 rounded-full bg-white/[0.03] px-4 py-2.5 ring-1 ring-white/[0.07] focus-within:ring-champagne/40">
                  <MagnifyingGlass size={15} className="text-mist" />
                  <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE) }} placeholder="Rechercher une idée, un bénéfice, un thème…" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-mist" />
                  {q && <button onClick={() => setQ('')} aria-label="Effacer"><X size={13} className="text-mist" /></button>}
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {KINDS.map((k) => { const K = KIND_L[k]; return <Chip key={k} on={kinds.includes(k)} onClick={() => toggle(kinds, k, setKinds)}><K.i size={13} weight="light" />{K.l}</Chip> })}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-3">
                <div className="flex flex-wrap gap-1.5">{STATUSES.map((s) => <Chip key={s} on={statuses.includes(s)} onClick={() => toggle(statuses, s, setStatuses)}><span className={clsx('h-1.5 w-1.5 rounded-full', STATUS_C[s].dot)} />{s}</Chip>)}<Chip on={sprintOnly} onClick={() => { setSprintOnly(!sprintOnly); setLimit(PAGE) }}><Rocket size={12} weight={sprintOnly ? 'fill' : 'light'} />Sprint <span className="num text-mist">{sprintCount}</span></Chip></div>
                <div className="flex items-center gap-3 text-[12px] text-mist">
                  <span><span className="num text-bone">{list.length}</span> résultat{list.length > 1 ? 's' : ''}</span>
                  {active && <button onClick={reset} className="flex items-center gap-1.5 hover:text-bone"><ArrowCounterClockwise size={13} />Réinitialiser</button>}
                </div>
              </div>
            </Card>
          </Stagger>

          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EXPO }}>
              {!list.length ? <Empty title="Aucune idée ne correspond">Élargissez les filtres ou <button onClick={reset} className="text-champagne-300 underline-offset-2 hover:underline">réinitialisez</button>.</Empty>
                : view === 'cards' ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {sorted.slice(0, limit).map((i, k) => (
                        <motion.div key={i.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: (k % PAGE) * 0.015, ease: EXPO }}>
                          <IdeaCard i={i} onOpen={() => setOpen(i)} />
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-6 flex flex-col items-center gap-3">
                      <div className="h-[2px] w-48 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-champagne transition-[width] duration-700 ease-silk" style={{ width: `${(Math.min(limit, sorted.length) / sorted.length) * 100}%` }} /></div>
                      <span className="num text-[11.5px] text-mist">{Math.min(limit, sorted.length)} / {sorted.length}</span>
                      {limit < sorted.length && <SoftBtn icon={<CaretDown size={13} />} onClick={() => setLimit(limit + PAGE)}>Afficher {Math.min(PAGE, sorted.length - limit)} de plus</SoftBtn>}
                    </div>
                  </>
                ) : view === 'matrix' ? <Matrix items={list} onOpen={setOpen} /> : <Board items={list} onOpen={setOpen} />}
            </motion.div>
          </AnimatePresence>
          <button onClick={() => setCreating(true)} className="mx-auto flex items-center justify-center gap-2 pt-2 text-[11.5px] text-mist transition hover:text-bone"><Lightbulb size={13} weight="light" />Une idée manque ? Proposez-la : elle rejoint le catalogue avec le statut « proposé ».</button>
        </div>
      )}

      <AnimatePresence>
        {open && <Drawer key="d" idea={open} all={IDEAS} ops={ops} onClose={() => setOpen(null)} onOpen={setOpen} />}
      </AnimatePresence>
      <Modal open={creating} onClose={() => setCreating(false)} title="Nouvelle idée" kicker="Feuille de route · statut « proposé »" width={600}>
        <AsyncForm submitLabel="Ajouter au catalogue" onCancel={() => setCreating(false)} onSubmit={async (v) => {
          const title = v.title?.trim()
          if (!title || title.length < 6) throw new Error('Titre obligatoire (6 caractères minimum)')
          if (IDEAS.some((i) => i.title.toLowerCase() === title.toLowerCase())) throw new Error('Une idée porte déjà ce titre')
          const theme = (v.newTheme?.trim() || v.theme || 'Divers')
          const n = Math.max(0, ...IDEAS.map((i) => Number(/^NX-(\d+)$/.exec(i.id)?.[1] ?? 0))) + 1
          const id = `NX-${String(n).padStart(3, '0')}`
          await ops.create({ id, title, benefit: v.benefit?.trim() ?? '', theme, phase: v.phase as Phase, effort: v.effort as Effort, impact: Number(v.impact), kind: v.kind as Kind, status: 'proposé', votes: 0, voters: [], sprint: false, custom: true, by: me.name, at: new Date().toISOString() } as never)
          toast(`Idée ${id} ajoutée`); setCreating(false); setOpenId(id)
        }}>
          <Field label="Titre *"><Input name="title" placeholder="Ex. Relance automatique J+7 après visite" maxLength={110} autoFocus /></Field>
          <Field label="Bénéfice attendu"><Textarea name="benefit" rows={3} placeholder="Ce que l’idée change pour le conseiller ou le client…" maxLength={400} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Thème"><Select name="theme" defaultValue={themes[0]?.[0]}>{themes.map(([t]) => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="…ou nouveau thème"><Input name="newTheme" placeholder="Laisser vide pour garder la liste" maxLength={50} /></Field>
            <Field label="Phase"><Select name="phase" defaultValue="P1">{PHASES.map((p) => <option key={p} value={p}>{p} · {PHASE_L[p]}</option>)}</Select></Field>
            <Field label="Type"><Select name="kind" defaultValue="feature">{KINDS.map((k) => <option key={k} value={k}>{KIND_L[k].l}</option>)}</Select></Field>
            <Field label="Effort"><Select name="effort" defaultValue="M">{EFFORTS.map((e) => <option key={e}>{e}</option>)}</Select></Field>
            <Field label="Impact (1 à 5)"><Select name="impact" defaultValue="3">{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</Select></Field>
          </div>
        </AsyncForm>
      </Modal>
    </div>
  )
}
