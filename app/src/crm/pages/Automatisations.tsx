import { motion, AnimatePresence } from 'motion/react'
import { useMemo, useState } from 'react'
import { MagnifyingGlass, X, Lightning, Funnel, Gear, ShieldCheck, Notebook, Moon, Coins, ArrowCounterClockwise, CheckCircle, XCircle, Hourglass, Sparkle, Pause, Play, Plus, StopCircle, Cpu, PencilSimple, Trash, PlayCircle } from '@phosphor-icons/react'
import { PageHeader, Card, Tabs, SoftBtn, Stagger, IconBtn, Empty } from '../ui'
import { EXPO } from '../../ui/kit'
import { useRoutines, useRuns, type Routine, type Run } from '../../data/collections'
import { action } from '../../data/store'
import { Modal, AsyncForm, Field, Input, Select, Textarea, toast, errText } from '../forms'

type Auto = 'A' | 'V' | 'P'
type R = Routine & { custom?: boolean }

/** Routines réellement exécutées par le moteur serveur (règles + actions métier). Les autres sont déclaratives. */
const ENGINE = new Set(['AUT-046', 'AUT-033', 'AUT-039', 'AUT-042', 'AUT-010', 'AUT-004', 'AUT-024', 'AUT-058', 'AUT-001', 'AUT-003', 'AUT-037'])
const isCustom = (r: R) => !!r.custom || Number(r.id.slice(4)) > 100
const MIN_SAVED = 6 // minutes économisées par exécution réussie (hypothèse affichée)
const BUDGET = 320
const H = 3600e3

const AUTO: Record<Auto, { l: string; c: string; v: string }> = {
  A: { l: 'Automatique', c: 'bg-sage/15 text-sage ring-sage/25', v: 'Aucune validation : exécution directe, entièrement journalisée.' },
  V: { l: 'Validé', c: 'bg-champagne/15 text-champagne-300 ring-champagne/30', v: 'Validation humaine obligatoire avant tout effet externe.' },
  P: { l: 'Proposé', c: 'bg-sea/15 text-sea ring-sea/25', v: 'Proposition déposée dans le fil du conseiller, qui décide.' },
}
const eur2 = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: n > 0 && n < 1 ? 3 : 2 })
const pct = (n: number) => `${(n * 100).toFixed(1).replace('.', ',')} %`
const hms = (iso: string) => { const d = new Date(iso); const t = d.toLocaleTimeString('fr-FR'); return d.toDateString() === new Date().toDateString() ? t : `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} ${t.slice(0, 5)}` }
const since = (runs: Run[], ms: number) => { const t = Date.now() - ms; return runs.filter((r) => Date.parse(r.at) >= t) }
const statsOf = (runs: Run[]) => {
  const ok = runs.filter((r) => r.status === 'ok').length, fail = runs.filter((r) => r.status === 'fail').length
  return { n: runs.length, ok, fail, wait: runs.length - ok - fail, rate: ok + fail ? ok / (ok + fail) : null, ms: runs.length ? runs.reduce((s, r) => s + (r.ms ?? 0), 0) / runs.length : 0, cost: runs.reduce((s, r) => s + (r.cost ?? 0), 0), last: runs[0] }
}

function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={(e) => { e.stopPropagation(); onChange() }} className={`relative flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 ring-1 transition-colors duration-300 ${on ? 'justify-end bg-champagne ring-champagne' : 'justify-start bg-white/[0.06] ring-white/10'}`}>
      <motion.span layout transition={{ duration: 0.35, ease: EXPO }} className={`h-4 w-4 rounded-full ${on ? 'bg-ink' : 'bg-bone/60'}`} />
    </button>
  )
}
const Badge = ({ a }: { a: Auto }) => <span title={AUTO[a]?.l} className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] ring-1 ${AUTO[a]?.c}`}><b className="num font-medium">{a}</b><span className="hidden sm:inline">{AUTO[a]?.l}</span></span>
const Engine = ({ id }: { id: string }) => ENGINE.has(id)
  ? <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-sage/10 px-2 py-0.5 text-[11px] text-sage ring-1 ring-sage/25"><span className="h-1.5 w-1.5 rounded-full bg-sage" />Moteur actif</span>
  : <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-bone/55 ring-1 ring-white/10">Déclarative</span>
const StatusCell = ({ s }: { s: Run['status'] }) => s === 'ok' ? <span className="flex items-center gap-1.5 text-sage"><CheckCircle size={14} weight="fill" />Succès</span> : s === 'fail' ? <span className="flex items-center gap-1.5 text-coral"><XCircle size={14} weight="fill" />Échec</span> : <span className="flex items-center gap-1.5 text-champagne-300"><Hourglass size={14} weight="fill" />En attente</span>

/** Schéma du flux : nœuds reliés par une ligne où circule une impulsion. */
function Flow({ r }: { r: Pick<Routine, 'trigger' | 'conditions' | 'action' | 'autonomy' | 'success'> }) {
  const nodes = [
    { k: 'Déclencheur', v: r.trigger, I: Lightning, c: 'text-champagne-300' },
    { k: 'Conditions', v: r.conditions, I: Funnel, c: 'text-sea' },
    { k: 'Action', v: r.action, I: Gear, c: 'text-bone' },
    { k: 'Validation', v: AUTO[r.autonomy]?.v, I: ShieldCheck, c: r.autonomy === 'A' ? 'text-sage' : 'text-champagne-300' },
    { k: 'Journal', v: r.success, I: Notebook, c: 'text-mist' },
  ]
  return (
    <div>
      {nodes.map((n, i) => (
        <div key={n.k}>
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: EXPO }} className="flex items-start gap-3.5 rounded-2xl bg-white/[0.025] p-3.5 ring-1 ring-white/[0.06]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-700 ring-1 ring-white/[0.08]"><n.I size={16} weight="light" className={n.c} /></span>
            <div className="min-w-0 leading-snug"><div className="text-[10px] uppercase tracking-eyebrow text-mist">{String(i + 1).padStart(2, '0')} · {n.k}</div><div className="mt-0.5 text-[13px]">{n.v}</div></div>
          </motion.div>
          {i < nodes.length - 1 && (
            <div className="relative ml-[2.15rem] h-6 w-px bg-[repeating-linear-gradient(to_bottom,rgb(var(--tint)_/_.18)_0_3px,transparent_3px_6px)]">
              <motion.span className="absolute -left-[3px] h-[7px] w-[7px] rounded-full bg-champagne shadow-[0_0_10px_2px_rgb(var(--acc-500)_/_.55)]" initial={{ top: -4, opacity: 0 }} animate={{ top: [-4, 22], opacity: [0, 1, 0] }} transition={{ duration: 1.1, delay: i * 0.55, repeat: Infinity, repeatDelay: 1.7, ease: EXPO }} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Drawer({ r, runs, families, toggle, onClose, onEdit, onDelete }: { r: R; runs: Run[]; families: string[]; toggle: () => void; onClose: () => void; onEdit: (patch: Partial<R>) => Promise<void>; onDelete: () => Promise<void> }) {
  const mine = runs.filter((x) => x.routineId === r.id)
  const s24 = statsOf(since(mine, 24 * H))
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0)
  const spent = mine.filter((x) => Date.parse(x.at) >= month.getTime()).reduce((n, x) => n + (x.cost ?? 0), 0)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Run[] | null>(null)
  const [editing, setEditing] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const on = r.enabled !== false
  const quiet = (h: number) => h >= 20 || h < 8
  const exec = async () => {
    setBusy(true); setResult(null)
    try { const out = await action<Run[]>('routine.run', { id: r.id }); setResult(out); toast(out.some((x) => x.status === 'fail') ? `${r.id} exécutée avec erreur` : `${r.id} exécutée`, out.some((x) => x.status === 'fail') ? 'error' : 'ok') }
    catch (e) { toast(errText(e), 'error') } finally { setBusy(false) }
  }
  return (
    <motion.div className="fixed inset-0 z-[70] flex justify-end bg-ink/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div onClick={(e) => e.stopPropagation()} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }} transition={{ duration: 0.5, ease: EXPO }} className="thin-scroll h-full w-full max-w-[620px] overflow-y-auto border-l border-white/[0.07] bg-ink-850 p-6 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2"><span className="num rounded-full bg-champagne/15 px-2.5 py-1 text-[12px] text-champagne-300">{r.id}</span><Badge a={r.autonomy} /><Engine id={r.id} /><span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] text-bone/70 ring-1 ring-white/10">Phase {r.phase}</span></div>
          <IconBtn label="Fermer" onClick={onClose}><X size={15} /></IconBtn>
        </div>
        <h2 className="display mt-5 text-4xl">{r.name}</h2>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[12px] text-mist">Famille {r.family} · {s24.n} exécution(s) / 24 h{s24.rate !== null && ` · ${pct(s24.rate)} de succès`}{s24.last && ` · dernière ${hms(s24.last.at)}`}</span>
          <span className="flex items-center gap-2 text-[12px] text-bone/70">{on ? 'Active' : 'Inactive'}<Switch on={on} onChange={toggle} label="Activer la routine" /></span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <SoftBtn tone="gold" icon={<PlayCircle size={15} />} onClick={exec}>{busy ? 'Exécution…' : 'Exécuter maintenant'}</SoftBtn>
          <SoftBtn icon={on ? <Pause size={14} /> : <Play size={14} />} onClick={toggle}>{on ? 'Désactiver' : 'Activer'}</SoftBtn>
          {isCustom(r) && <SoftBtn icon={<PencilSimple size={14} />} onClick={() => setEditing(true)}>Modifier</SoftBtn>}
          {isCustom(r) && (confirmDel
            ? <button onClick={onDelete} className="inline-flex items-center gap-2 rounded-full bg-coral/15 px-4 py-2 text-[13px] font-medium text-coral ring-1 ring-coral/30 transition hover:bg-coral/25"><Trash size={14} />Confirmer la suppression</button>
            : <SoftBtn icon={<Trash size={14} />} onClick={() => setConfirmDel(true)}>Supprimer</SoftBtn>)}
        </div>
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EXPO }} className="mt-4 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.08]">
              <div className="mb-2 text-[10.5px] uppercase tracking-eyebrow text-mist">Résultat de l’exécution</div>
              {result.length ? result.map((x) => (
                <div key={x.id} className="flex items-start justify-between gap-3 text-[12.5px]">
                  <div className="min-w-0"><StatusCell s={x.status} /><div className="mt-1 text-bone/70">{x.detail}</div></div>
                  <span className="num shrink-0 text-[11px] text-mist">{x.ms} ms · {hms(x.at)}</span>
                </div>
              )) : <div className="text-[12.5px] text-bone/60">Aucune action nécessaire.</div>}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-7 text-[10.5px] uppercase tracking-eyebrow text-mist">Schéma du flux</div>
        <div className="mt-3"><Flow r={r} /></div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06]">
            <div className="flex items-center gap-2 text-[12.5px]"><Cpu size={15} weight="light" className={ENGINE.has(r.id) ? 'text-sage' : 'text-mist'} />Mode d’exécution</div>
            <div className="mt-2.5 text-[12px] leading-relaxed text-bone/60">{ENGINE.has(r.id) ? 'Règle implémentée par le moteur serveur : exécutée automatiquement quand elle est active (cycle de 60 s ou action métier), chaque effet est journalisé.' : 'Routine déclarative : décrite et versionnée, mais sa règle ou son connecteur reste à configurer. Une exécution manuelle consigne une attente au journal.'}</div>
          </div>
          <div className="rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06]">
            <div className="flex items-center gap-2 text-[12.5px]"><StopCircle size={15} weight="light" className="text-coral" />Règles d’arrêt</div>
            <ul className="mt-2.5 space-y-1.5 text-[12px] text-bone/60">{[r.fallback, 'Arrêt immédiat si retrait du consentement'].filter(Boolean).map((x) => <li key={x} className="flex gap-2"><span className="text-mist">—</span>{x}</li>)}</ul>
          </div>
          <div className="rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06]">
            <div className="flex items-center gap-2 text-[12.5px]"><Moon size={15} weight="light" className="text-sea" />Fenêtre calme</div>
            <div className="mt-3 flex h-6 gap-px overflow-hidden rounded-md">{Array.from({ length: 24 }, (_, h) => <span key={h} className={`flex-1 ${quiet(h) ? 'bg-sea/30' : 'bg-white/[0.06]'}`} title={`${h} h`} />)}</div>
            <div className="num mt-1 flex justify-between text-[9.5px] text-mist"><span>0 h</span><span>8 h</span><span>20 h</span><span>24 h</span></div>
            <div className="mt-2 text-[12px] text-bone/60">Aucun envoi externe 20 h → 8 h (réglages agence). Actions internes autorisées.</div>
          </div>
          <div className="rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06]">
            <div className="flex items-center gap-2 text-[12.5px]"><Coins size={15} weight="light" className="text-champagne-300" />Coût IA · ce mois</div>
            <div className="mt-2.5 flex items-baseline justify-between"><span className="display text-2xl">{eur2(spent)}</span><span className="num text-[11px] text-mist">{mine.length} exécution(s) au journal</span></div>
            <div className="mt-2 text-[11.5px] text-bone/50">{s24.n ? `${Math.round(s24.ms)} ms en moyenne sur 24 h` : 'Aucune exécution sur 24 h'}</div>
          </div>
        </div>

        <div className="mt-7 text-[10.5px] uppercase tracking-eyebrow text-mist">Dernières exécutions</div>
        <div className="mt-2 space-y-1.5">
          {mine.slice(0, 6).map((x) => <div key={x.id} className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2 text-[12px] ring-1 ring-white/[0.05]"><span className="num w-[68px] shrink-0 text-[11px] text-mist">{hms(x.at)}</span><span className="w-24 shrink-0"><StatusCell s={x.status} /></span><span className="min-w-0 flex-1 truncate text-bone/70">{x.detail}</span></div>)}
          {!mine.length && <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-[12.5px] text-bone/50">Jamais exécutée. Lancez « Exécuter maintenant » pour tracer un premier passage.</div>}
        </div>
      </motion.div>

      <div onClick={(e) => e.stopPropagation()}>
      <Modal open={editing} onClose={() => setEditing(false)} kicker={r.id} title="Modifier la routine" width={620}>
        <AsyncForm submitLabel="Enregistrer" success="Routine mise à jour" onCancel={() => setEditing(false)} onSubmit={async (v) => {
          if (!v.name?.trim() || !v.trigger?.trim() || !v.action?.trim()) throw new Error('Nom, déclencheur et action sont obligatoires')
          await onEdit({ name: v.name.trim(), family: v.family, trigger: v.trigger.trim(), conditions: v.conditions.trim(), action: v.action.trim(), autonomy: v.autonomy as Auto, success: v.success.trim(), fallback: v.fallback.trim() })
          setEditing(false)
        }}>
          <Field label="Nom"><Input name="name" defaultValue={r.name} required /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Famille"><Select name="family" defaultValue={r.family}>{families.map((f) => <option key={f}>{f}</option>)}</Select></Field>
            <Field label="Autonomie"><Select name="autonomy" defaultValue={r.autonomy}>{(['A', 'V', 'P'] as Auto[]).map((a) => <option key={a} value={a}>{a} · {AUTO[a].l}</option>)}</Select></Field>
          </div>
          <Field label="Déclencheur"><Input name="trigger" defaultValue={r.trigger} required /></Field>
          <Field label="Conditions"><Input name="conditions" defaultValue={r.conditions} /></Field>
          <Field label="Action"><Textarea name="action" rows={2} defaultValue={r.action} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Journal / succès"><Input name="success" defaultValue={r.success} /></Field>
            <Field label="Repli"><Input name="fallback" defaultValue={r.fallback} /></Field>
          </div>
        </AsyncForm>
      </Modal>
      </div>
    </motion.div>
  )
}

const EXAMPLES = ['Quand un DPE expire dans moins de 60 jours, prévenir le conseiller et proposer un diagnostiqueur', 'Après chaque visite, envoyer un e-mail de remerciement à l’acquéreur le lendemain à 10 h', 'Si un acquéreur ouvre 3 fois la même annonce, le signaler au conseiller']
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function draft(text: string): Omit<R, 'id'> {
  const t = text.toLowerCase()
  const external = /envoy|e-mail|mail|sms|courrier|whatsapp/.test(t)
  const [trigger, rest] = text.split(/,\s*/, 2)
  return {
    family: /dpe|diagnost|copro/.test(t) ? 'Mandat' : /visite|acquéreur|annonce/.test(t) ? 'Transaction' : 'Exploitation',
    name: cap(rest ?? text).slice(0, 60),
    trigger: cap(trigger.trim()),
    conditions: external ? 'Consentement valide · hors fenêtre calme · pas de doublon 72 h' : 'Dossier actif · conseiller assigné',
    action: rest ? cap(rest) : 'Créer une tâche pour le conseiller',
    autonomy: external ? 'V' : 'P', success: 'Action tracée au journal du dossier', fallback: 'File manager si règle inapplicable', phase: 'P1', enabled: false, custom: true,
  }
}

export default function Automatisations() {
  const [routinesRaw, ops] = useRoutines()
  const [runs] = useRuns()
  const all = useMemo(() => [...(routinesRaw as R[])].sort((a, b) => a.id.localeCompare(b.id)), [routinesRaw])
  const families = useMemo(() => [...new Set(all.map((r) => r.family))], [all])
  const [tab, setTab] = useState<'lib' | 'runs' | 'create'>('lib')
  const [fam, setFam] = useState('all')
  const [q, setQ] = useState('')
  const [autoF, setAutoF] = useState<Auto[]>([])
  const [engineOnly, setEngineOnly] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const open = all.find((r) => r.id === openId) ?? null

  const toggle = async (r: R) => {
    try { await action('routine.toggle', { id: r.id }); await ops.reload(); toast(`${r.id} ${r.enabled === false ? 'activée' : 'désactivée'}`) }
    catch (e) { toast(errText(e), 'error') }
  }

  // Journal réel (collection runs, temps réel via SSE)
  const [frozen, setFrozen] = useState<Run[] | null>(null)
  const shownRuns = frozen ?? runs
  const [runF, setRunF] = useState<'all' | 'ok' | 'fail' | 'wait'>('all')
  const [rq, setRq] = useState('')
  const [replaying, setReplaying] = useState<string | null>(null)
  const replay = async (id: string) => {
    setReplaying(id)
    try { const out = await action<Run[]>('routine.run', { id }); const bad = out.some((x) => x.status === 'fail'); toast(bad ? `${id} : nouvel échec — ${out[0]?.detail ?? ''}` : `${id} rejouée : ${out[0]?.detail ?? 'ok'}`, bad ? 'error' : 'ok') }
    catch (e) { toast(errText(e), 'error') } finally { setReplaying(null) }
  }
  // Incident = dernier passage en échec d'une routine, sans succès plus récent.
  const incidents = useMemo(() => {
    const seen = new Set<string>(), out: Run[] = []
    for (const r of runs) { if (seen.has(r.routineId)) continue; seen.add(r.routineId); if (r.status === 'fail') out.push(r) }
    return out
  }, [runs])
  const lastHour = useMemo(() => {
    const now = Date.now(), bins = Array.from({ length: 30 }, () => ({ n: 0, fail: 0 }))
    for (const r of since(runs, H)) { const i = Math.min(29, Math.floor((now - Date.parse(r.at)) / (2 * 60e3))); bins[29 - i].n++; if (r.status === 'fail') bins[29 - i].fail++ }
    return bins
  }, [runs])
  const maxBin = Math.max(1, ...lastHour.map((b) => b.n))

  // KPI calculés depuis le journal
  const active = all.filter((r) => r.enabled !== false)
  const s24 = statsOf(since(runs, 24 * H)), s7 = statsOf(since(runs, 7 * 24 * H))
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0)
  const sMonth = statsOf(runs.filter((r) => Date.parse(r.at) >= month.getTime()))
  const measured = s7.ok + s7.fail
  const hours = (sMonth.ok * MIN_SAVED) / 60

  // Constructeur
  const [prompt, setPrompt] = useState(EXAMPLES[0])
  const [ready, setReady] = useState(false)
  const generated = useMemo(() => draft(prompt), [prompt])
  const [adding, setAdding] = useState(false)
  const add = async () => {
    const n = Math.max(100, ...all.filter(isCustom).map((r) => Number(r.id.slice(4)) || 0)) + 1
    if (n > 199) return toast('Plage AUT-101 à AUT-199 épuisée : supprimez une routine personnalisée', 'error')
    const id = `AUT-${n}`
    setAdding(true)
    try { await ops.create({ ...generated, id } as R); toast(`${id} créée · inactive par défaut`); setTab('lib'); setFam('all'); setQ(id); setReady(false) }
    catch (e) { toast(errText(e), 'error') } finally { setAdding(false) }
  }

  const list = all.filter((r) => (fam === 'all' || r.family === fam) && (!autoF.length || autoF.includes(r.autonomy)) && (!engineOnly || ENGINE.has(r.id)) && (!q || `${r.id} ${r.name} ${r.trigger} ${r.action}`.toLowerCase().includes(q.toLowerCase())))
  const runList = shownRuns.filter((r) => (runF === 'all' || r.status === runF) && (!rq || `${r.routineId} ${r.name} ${r.detail}`.toLowerCase().includes(rq.toLowerCase())))
  const perRoutine = useMemo(() => { const m = new Map<string, Run[]>(); for (const r of since(runs, 24 * H)) m.set(r.routineId, [...(m.get(r.routineId) ?? []), r]); return m }, [runs])

  return (
    <div>
      <PageHeader
        kicker="Routines & garde-fous"
        title={<>Automatisations <span className="italic text-champagne-300">métier</span></>}
        sub={<>{all.length} routines métier, dont {ENGINE.size} exécutées par le moteur. Chacune a son déclencheur, ses conditions, son niveau d’autonomie et ses règles d’arrêt ; rien ne part vers un client sans validation quand la routine l’exige.</>}
        actions={<Tabs id="auto-tab" value={tab} onChange={setTab} items={[{ id: 'lib', label: 'Bibliothèque', count: all.length }, { id: 'runs', label: 'Exécutions', count: runs.length }, { id: 'create', label: 'Créer' }]} />}
      />

      <Stagger className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Routines actives', `${active.length}`, `sur ${all.length} · ${all.filter((r) => ENGINE.has(r.id) && r.enabled !== false).length} au moteur`],
          ['Exécutions · 24 h', s24.n.toLocaleString('fr-FR'), `${s24.fail} échec(s) · ${s24.wait} en attente`],
          measured >= 10 ? ['Taux de succès', pct(s7.rate ?? 0), `7 jours · ${measured} exécutions mesurées`] : ['Taux de succès', s7.rate !== null ? `≈ ${pct(s7.rate)}` : '—', `estimation · ${measured} exécution(s) seulement`],
          ['Heures économisées', `${hours.toFixed(1).replace('.', ',')} h`, `estimation · ${MIN_SAVED} min par succès ce mois`],
        ].map(([l, v, h]) => (
          <div key={l} className="rounded-2xl bg-white/[0.02] px-4 py-3.5 ring-1 ring-white/[0.06]"><div className="text-[10.5px] uppercase tracking-eyebrow text-mist">{l}</div><div className="display mt-1 text-[2.1rem] leading-none">{v}</div><div className="mt-1 text-[11px] text-bone/45">{h}</div></div>
        ))}
        <div className="col-span-2 rounded-2xl bg-white/[0.02] px-4 py-3.5 ring-1 ring-white/[0.06] lg:col-span-1">
          <div className="text-[10.5px] uppercase tracking-eyebrow text-mist">Coût IA · {new Date().toLocaleDateString('fr-FR', { month: 'long' })}</div>
          <div className="mt-1 flex items-baseline gap-1.5"><span className="display text-[2.1rem] leading-none">{eur2(sMonth.cost)}</span><span className="num text-[11px] text-mist">/ {BUDGET} €</span></div>
          <div className="mt-2 h-1.5 rounded-full bg-white/[0.06]"><motion.div className="h-1.5 rounded-full bg-gradient-to-r from-champagne-700 to-champagne" initial={{ width: 0 }} animate={{ width: `${Math.max(1, Math.min(100, (sMonth.cost / BUDGET) * 100))}%` }} transition={{ duration: 1.2, ease: EXPO }} /></div>
          <div className="mt-1 text-[11px] text-bone/45">{sMonth.n} exécution(s) facturée(s) ce mois</div>
        </div>
      </Stagger>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease: EXPO }}>
          {tab === 'lib' && (
            <Stagger i={1}>
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <Tabs id="auto-fam" value={fam} onChange={setFam} items={[{ id: 'all', label: 'Toutes', count: all.length }, ...families.map((f) => ({ id: f, label: f, count: all.filter((r) => r.family === f).length }))]} />
                <div className="flex items-center gap-2">
                  <button onClick={() => setEngineOnly((v) => !v)} className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] ring-1 transition ${engineOnly ? 'bg-sage/15 text-sage ring-sage/25' : 'text-bone/55 ring-white/[0.08] hover:text-bone'}`}><Cpu size={13} />Moteur</button>
                  <div className="flex gap-1">{(['A', 'V', 'P'] as Auto[]).map((a) => <button key={a} onClick={() => setAutoF((l) => (l.includes(a) ? l.filter((x) => x !== a) : [...l, a]))} title={AUTO[a].l} className={`num h-8 w-8 rounded-full text-[12px] ring-1 transition ${autoF.includes(a) ? AUTO[a].c : 'text-bone/50 ring-white/[0.08] hover:text-bone'}`}>{a}</button>)}</div>
                  <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white/[0.03] px-3.5 py-2 text-[13px] ring-1 ring-white/[0.07] focus-within:ring-champagne/40 lg:w-64 lg:flex-none">
                    <MagnifyingGlass size={14} className="text-mist" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une routine…" className="min-w-0 flex-1 bg-transparent placeholder:text-mist focus:outline-none" />
                    {q && <button onClick={() => setQ('')} aria-label="Effacer"><X size={12} className="text-mist" /></button>}
                  </label>
                </div>
              </div>
              <Card pad={false}>
                <div className="divide-y divide-white/[0.04] md:hidden">
                  {list.map((r) => (
                    <div key={r.id} onClick={() => setOpenId(r.id)} role="button" tabIndex={0} className={`flex items-center gap-3 px-4 py-3 ${r.enabled !== false ? '' : 'opacity-50'}`}>
                      <Switch on={r.enabled !== false} onChange={() => toggle(r)} label={`Activer ${r.id}`} />
                      <div className="min-w-0 flex-1"><div className="truncate text-[13px]">{r.name}</div><div className="num flex items-center gap-1.5 text-[10.5px] text-mist">{r.id} · {r.family}{ENGINE.has(r.id) && <span className="h-1.5 w-1.5 rounded-full bg-sage" title="Moteur actif" />}</div></div>
                      <Badge a={r.autonomy} />
                    </div>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <div className="min-w-[820px]">
                    <div className="grid grid-cols-[44px_80px_1fr_110px_104px_110px_52px_64px] gap-3 border-b border-white/[0.05] px-5 py-3 text-[10px] uppercase tracking-eyebrow text-mist"><span /><span>Réf.</span><span>Routine · déclencheur</span><span>Famille</span><span>Autonomie</span><span>Exécution</span><span className="text-right">24 h</span><span className="text-right">Succès</span></div>
                    {list.map((r, i) => {
                      const act = r.enabled !== false, st = statsOf(perRoutine.get(r.id) ?? [])
                      return (
                        <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: Math.min(i, 12) * 0.025, ease: EXPO }} onClick={() => setOpenId(r.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpenId(r.id)}
                          className={`grid cursor-pointer grid-cols-[44px_80px_1fr_110px_104px_110px_52px_64px] items-center gap-3 border-b border-white/[0.035] px-5 py-3 text-[13px] transition-colors duration-300 last:border-0 hover:bg-white/[0.025] ${act ? '' : 'opacity-50'}`}>
                          <Switch on={act} onChange={() => toggle(r)} label={`Activer ${r.id}`} />
                          <span className="num text-[11.5px] text-bone/55">{r.id}</span>
                          <div className="min-w-0"><div className="flex items-center gap-2 truncate">{r.name}{isCustom(r) && <span className="shrink-0 rounded-full bg-champagne/10 px-1.5 py-px text-[10px] text-champagne-300 ring-1 ring-champagne/25">Perso</span>}</div><div className="truncate text-[11.5px] text-mist">{r.trigger}</div></div>
                          <span className="truncate text-[12px] text-bone/65">{r.family}</span>
                          <span><Badge a={r.autonomy} /></span>
                          <span><Engine id={r.id} /></span>
                          <span className="num text-right text-[12px]">{st.n || '—'}</span>
                          <span className={`num text-right text-[12px] ${st.rate === null ? 'text-mist' : st.rate > 0.95 ? 'text-sage' : st.rate > 0.7 ? 'text-champagne-300' : 'text-coral'}`}>{st.rate === null ? '—' : (st.rate * 100).toFixed(0)}</span>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
                {!list.length && <div className="p-5"><Empty title="Aucune routine">Aucune routine ne correspond à ces filtres.</Empty></div>}
              </Card>
            </Stagger>
          )}

          {tab === 'runs' && (
            <div className="grid gap-6 xl:grid-cols-12">
              <Stagger i={1} className="min-w-0 xl:col-span-8">
                <Card title={<span className="flex items-center gap-2">{!frozen && <span className="relative flex h-2 w-2"><span className="absolute inset-0 animate-pulseRing rounded-full bg-sage" /><span className="relative h-2 w-2 rounded-full bg-sage" /></span>}{frozen ? 'Journal figé' : 'Journal en direct'}</span>} kicker={`${runList.length} exécution(s) affichée(s) sur ${shownRuns.length}`}
                  action={<IconBtn label={frozen ? 'Reprendre le direct' : 'Figer le journal'} onClick={() => setFrozen((f) => (f ? null : runs))} active={!!frozen}>{frozen ? <Play size={14} /> : <Pause size={14} />}</IconBtn>}>
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Tabs id="run-f" value={runF} onChange={setRunF} items={[{ id: 'all', label: 'Tout' }, { id: 'ok', label: 'Succès', count: shownRuns.filter((r) => r.status === 'ok').length }, { id: 'fail', label: 'Échecs', count: shownRuns.filter((r) => r.status === 'fail').length }, { id: 'wait', label: 'En attente', count: shownRuns.filter((r) => r.status === 'wait').length }]} />
                    <label className="flex items-center gap-2 rounded-full bg-white/[0.03] px-3.5 py-2 text-[13px] ring-1 ring-white/[0.07] focus-within:ring-champagne/40 sm:w-56">
                      <MagnifyingGlass size={14} className="text-mist" /><input value={rq} onChange={(e) => setRq(e.target.value)} placeholder="Routine, détail…" className="min-w-0 flex-1 bg-transparent placeholder:text-mist focus:outline-none" />
                    </label>
                  </div>
                  {!runList.length ? <Empty title="Aucune exécution">{runs.length ? 'Aucune exécution ne correspond à ces filtres.' : 'Le moteur n’a encore rien exécuté. Ouvrez une routine et lancez « Exécuter maintenant ».'}</Empty> : (
                    <div className="overflow-x-auto">
                      <div className="min-w-[640px]">
                        <div className="grid grid-cols-[80px_1fr_100px_64px_72px] gap-3 px-3 pb-2 text-[10px] uppercase tracking-eyebrow text-mist"><span>Heure</span><span>Routine · détail</span><span>Statut</span><span className="text-right">Durée</span><span className="text-right">Coût</span></div>
                        <div className="thin-scroll max-h-[560px] overflow-y-auto">
                          <AnimatePresence initial={false}>
                            {runList.slice(0, 200).map((r) => (
                              <motion.div key={r.id} layout initial={{ opacity: 0, y: -10, backgroundColor: 'rgb(var(--acc-500) / 0.10)' }} animate={{ opacity: 1, y: 0, backgroundColor: 'rgb(var(--acc-500) / 0)' }} transition={{ duration: 0.9, ease: EXPO }} onClick={() => setOpenId(r.routineId)}
                                className="grid cursor-pointer grid-cols-[80px_1fr_100px_64px_72px] items-center gap-3 rounded-xl px-3 py-2.5 text-[12.5px] hover:bg-white/[0.025]">
                                <span className="num text-[11.5px] text-mist">{hms(r.at)}</span>
                                <span className="min-w-0"><span className="block truncate"><span className="num mr-2 text-[11px] text-bone/50">{r.routineId}</span>{r.name}</span><span className="block truncate text-[11.5px] text-bone/45">{r.detail}</span></span>
                                <StatusCell s={r.status} />
                                <span className="num text-right text-[11.5px] text-bone/70">{r.ms < 1000 ? `${r.ms} ms` : `${(r.ms / 1000).toFixed(1).replace('.', ',')} s`}</span>
                                <span className="num text-right text-[11.5px] text-bone/70">{eur2(r.cost ?? 0)}</span>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </Stagger>
              <div className="space-y-6 xl:col-span-4">
                <Stagger i={2}>
                  <Card title="Incidents" kicker={incidents.length ? `${incidents.length} routine(s) en échec` : 'Aucun échec en cours'}>
                    <div className="space-y-2">
                      {incidents.map((x) => (
                        <motion.div key={x.id} layout className="rounded-xl bg-coral/[0.05] p-3.5 ring-1 ring-coral/20">
                          <div className="flex items-center justify-between gap-2"><span className="min-w-0 truncate text-[13px]"><span className="num mr-1.5 text-[11px] text-bone/50">{x.routineId}</span>{x.name}</span><span className="num shrink-0 text-[11px] text-mist">{hms(x.at)}</span></div>
                          <div className="mt-1 text-[12px] text-bone/60">{x.detail}</div>
                          <button onClick={() => replay(x.routineId)} disabled={replaying === x.routineId} className="mt-2.5 flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1.5 text-[12px] ring-1 ring-white/10 transition hover:bg-white/[0.1] disabled:opacity-60"><ArrowCounterClockwise size={13} className={replaying === x.routineId ? 'animate-spin' : ''} />{replaying === x.routineId ? 'Relance…' : 'Rejouer'}</button>
                        </motion.div>
                      ))}
                      {!incidents.length && <div className="flex items-center gap-2 rounded-xl bg-sage/[0.05] p-3.5 text-[12.5px] text-sage ring-1 ring-sage/20"><CheckCircle size={15} weight="fill" />Toutes les routines ont réussi leur dernier passage.</div>}
                    </div>
                  </Card>
                </Stagger>
                <Stagger i={3}>
                  <Card title="Dernière heure" kicker={`${since(runs, H).length} exécution(s) · tranches de 2 min`}>
                    <div className="relative flex h-20 items-end gap-1">
                      {lastHour.map((b, i) => <motion.span key={i} className={`flex-1 rounded-t-sm ${b.fail ? 'bg-coral/70' : b.n ? 'bg-champagne/60' : 'bg-white/[0.05]'}`} initial={{ height: 0 }} animate={{ height: b.n ? `${12 + (b.n / maxBin) * 88}%` : '4%' }} transition={{ duration: 0.8, delay: i * 0.015, ease: EXPO }} title={`${b.n} exécution(s)`} />)}
                    </div>
                    <div className="num mt-1.5 flex justify-between text-[10px] text-mist"><span>−60 min</span><span>−30 min</span><span>maintenant</span></div>
                  </Card>
                </Stagger>
              </div>
            </div>
          )}

          {tab === 'create' && (
            <div className="grid gap-6 xl:grid-cols-12">
              <Stagger i={1} className="xl:col-span-6">
                <Card title="Décrivez la routine en une phrase" kicker="Constructeur en langage naturel">
                  <textarea value={prompt} onChange={(e) => { setPrompt(e.target.value); setReady(false) }} rows={4} className="w-full resize-none rounded-2xl bg-ink-700/60 p-4 font-serif text-[19px] leading-snug text-bone ring-1 ring-white/[0.07] placeholder:text-mist focus:outline-none focus:ring-champagne/40" placeholder="Quand…, alors…" />
                  <div className="mt-3 flex flex-wrap gap-1.5">{EXAMPLES.map((e) => <button key={e} onClick={() => { setPrompt(e); setReady(false) }} className={`rounded-full px-3 py-1.5 text-left text-[11.5px] ring-1 transition ${prompt === e ? 'bg-champagne/10 text-champagne-300 ring-champagne/30' : 'text-bone/60 ring-white/[0.08] hover:text-bone'}`}>{e.length > 52 ? e.slice(0, 52) + '…' : e}</button>)}</div>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-4">
                    <span className="text-[11.5px] text-bone/50">Fenêtre calme, consentement et déduplication ajoutés d’office.</span>
                    <SoftBtn tone="gold" icon={<Sparkle size={14} weight="fill" />} onClick={() => { if (prompt.trim().length < 12) toast('Décrivez la routine en une phrase complète', 'error'); else setReady(true) }}>Générer le flux</SoftBtn>
                  </div>
                </Card>
              </Stagger>
              <Stagger i={2} className="xl:col-span-6">
                <Card title="Aperçu du flux généré" kicker={ready ? `${generated.family} · phase ${generated.phase} · déclarative` : 'En attente de génération'} action={ready ? <Badge a={generated.autonomy} /> : undefined}>
                  <AnimatePresence mode="wait">
                    {!ready ? <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-72 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 text-center"><Lightning size={22} weight="light" className="text-champagne-300" /><div className="text-[13px] text-bone/55">Le schéma apparaîtra ici :<br />déclencheur → conditions → action → validation → journal.</div></motion.div> : (
                      <motion.div key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="display mb-4 text-2xl">{generated.name}</div>
                        <Flow r={generated} />
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          <SoftBtn tone="gold" icon={<Plus size={14} />} onClick={add}>{adding ? 'Création…' : 'Ajouter à la bibliothèque'}</SoftBtn>
                          <span className="text-[11.5px] text-bone/50">Créée inactive, modifiable et supprimable depuis son tiroir.</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </Stagger>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {open && <Drawer key={open.id} r={open} runs={runs} families={families} toggle={() => toggle(open)} onClose={() => setOpenId(null)}
          onEdit={(patch) => ops.update(open.id, patch)}
          onDelete={async () => { try { await ops.remove(open.id); setOpenId(null); toast(`${open.id} supprimée`) } catch (e) { toast(errText(e), 'error') } }} />}
      </AnimatePresence>
    </div>
  )
}
