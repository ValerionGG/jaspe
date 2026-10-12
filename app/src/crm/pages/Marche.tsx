import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { MagnifyingGlass, Sparkle, CheckCircle, Database, ArrowsClockwise, Info, Waves, Hammer, Tree, Stairs, FileText, Target, Warning, ArrowUpRight } from '@phosphor-icons/react'
import { PageHeader, Card, Stat, Tabs, SoftBtn, Stagger, Empty } from '../ui'
import { Pill } from '../../ui/kit'
import { eur, fmt } from '../../data/mock'
import { compsFor, priceSeries, meters, DPE_STATS, DPE_C, type Comp, type Listing } from '../../data/geo'
import { useProperties, useDossiers, type DocumentDoc } from '../../data/collections'
import { action, useDoc, type Doc } from '../../data/store'
import { Modal, toast, errText } from '../forms'
import { GeoMap, circle } from '../GeoMap'
import { DocPaper } from './DossierDetail'

const MOTIFS = ['Annonce > 90 jours en ligne', 'Bien atypique', 'Travaux lourds', 'Vente entre proches', 'Prix non représentatif'] as const
const COND = { 'À rafraîchir': -0.07, 'Bon état': 0, Rénové: 0.05 } as const
const FLOOR = { 'RDC · jardin': -0.03, Intermédiaire: 0, 'Dernier étage': 0.06 } as const
const median = (a: number[]) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const pct = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
const kppm = (v: number) => `${(v / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k€/m²`
const defaultExcl = (cs: Comp[]) => Object.fromEntries(cs.filter((c) => c.kind === 'annonce' && (c.days ?? 0) > 90).map((c) => [c.id, MOTIFS[0] as string]))
type Val = NonNullable<Listing['valuation']>
const defaultVal = (n: Listing): Val => ({ sea: /mer/i.test((n.features ?? []).join(' ')), cond: 'Bon état', land: n.land ?? 0, floor: n.type === 'Appartement' ? 'Dernier étage' : 'Intermédiaire', radius: 1200, target: null })
const valOf = (n: Listing): Val => ({ ...defaultVal(n), ...(n.valuation ?? {}) })

function DocView({ id }: { id: string }) {
  const doc = useDoc<DocumentDoc & Doc>('documents', id)
  if (!doc) return <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-[13px] text-mist">Chargement du document…</div>
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-mist"><Pill tone="gold">À valider</Pill>Version {doc.version} · {new Date(doc.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</div>
      <DocPaper doc={doc} />
      <div className="mt-5"><Link to={`/app/dossiers/${doc.dossierId}`}><SoftBtn tone="gold" icon={<ArrowUpRight size={13} />}>Valider dans le dossier</SoftBtn></Link></div>
    </>
  )
}

/** Courbe €/m² : réel en trait plein, projection hachurée avec cône d'incertitude. */
function PriceChart({ series, dots }: { series: { t: number; v: number; proj?: boolean }[]; dots: Comp[] }) {
  const W = 440, H = 250, P = { l: 44, r: 8, t: 14, b: 24 }
  const [hi, setHi] = useState<number | null>(null)
  const ref = useRef<SVGSVGElement>(null)
  const t0 = 2022, t1 = series.at(-1)!.t
  const vals = [...series.map((s) => s.v * 1.07), ...series.map((s) => s.v * 0.93), ...dots.map((d) => d.ppm)]
  const v0 = Math.floor(Math.min(...vals) / 500) * 500, v1 = Math.ceil(Math.max(...vals) / 500) * 500
  const x = (t: number) => P.l + ((t - t0) / (t1 - t0)) * (W - P.l - P.r)
  const y = (v: number) => P.t + (1 - (v - v0) / (v1 - v0)) * (H - P.t - P.b)
  const real = series.filter((s) => !s.proj), proj = [real.at(-1)!, ...series.filter((s) => s.proj)]
  const line = (pts: typeof series) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
  const cone = proj.map((p, i) => [x(p.t), y(p.v * (1 + i * 0.016))] as const).concat([...proj].reverse().map((p, i) => [x(p.t), y(p.v * (1 - (proj.length - 1 - i) * 0.016))] as const))
  const ticks = Array.from({ length: 5 }, (_, i) => v0 + ((v1 - v0) * i) / 4)
  const h = hi !== null ? series[hi] : null
  return (
    <div className="relative">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" onMouseLeave={() => setHi(null)}
        onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(), t = t0 + (((e.clientX - r.left) / r.width) * W - P.l) / (W - P.l - P.r) * (t1 - t0); let b = 0; series.forEach((s, i) => { if (Math.abs(s.t - t) < Math.abs(series[b].t - t)) b = i }); setHi(b) }}>
        <defs>
          <linearGradient id="mk-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="rgb(var(--acc-500))" stopOpacity=".22" /><stop offset="1" stopColor="rgb(var(--acc-500))" stopOpacity="0" /></linearGradient>
          <pattern id="mk-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="rgb(var(--acc-500))" strokeOpacity=".35" strokeWidth="1.2" /></pattern>
        </defs>
        {ticks.map((v) => <g key={v}><line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke="rgb(var(--tint) / .06)" /><text x={P.l - 8} y={y(v) + 3} textAnchor="end" className="num fill-mist text-[10px]">{fmt(Math.round(v))}</text></g>)}
        {[2022, 2023, 2024, 2025, 2026, 2027].map((t) => t <= t1 && <text key={t} x={x(t)} y={H - 8} textAnchor="middle" className="num fill-mist text-[10px]">{t}</text>)}
        <rect x={x(real.at(-1)!.t)} y={P.t} width={W - P.r - x(real.at(-1)!.t)} height={H - P.t - P.b} fill="rgb(var(--tint) / .02)" />
        <text x={x(real.at(-1)!.t) + 6} y={P.t + 10} className="fill-mist text-[9.5px] uppercase tracking-[0.18em]">Projection</text>
        <path d={`${line(real)} L${x(real.at(-1)!.t)},${H - P.b} L${x(real[0].t)},${H - P.b} Z`} fill="url(#mk-area)" />
        <polygon points={cone.map((c) => c.join(',')).join(' ')} fill="url(#mk-hatch)" />
        <motion.path d={line(real)} fill="none" stroke="rgb(var(--acc-500))" strokeWidth="1.8" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }} />
        <path d={line(proj)} fill="none" stroke="rgb(var(--acc-300))" strokeWidth="1.5" strokeDasharray="4 4" />
        {dots.map((d) => <circle key={d.id} cx={x(Math.min(Math.max(d.t, t0), t1))} cy={y(d.ppm)} r="3.2" fill="rgb(var(--sage))" fillOpacity=".85" stroke="rgb(var(--ink-800))" strokeWidth="1"><title>{d.addr} · {fmt(d.ppm)} €/m²</title></circle>)}
        {h && <g><line x1={x(h.t)} x2={x(h.t)} y1={P.t} y2={H - P.b} stroke="rgb(var(--tint) / .25)" strokeDasharray="2 3" /><circle cx={x(h.t)} cy={y(h.v)} r="4.5" fill="rgb(var(--acc-500))" stroke="rgb(var(--ink-900))" strokeWidth="2" /></g>}
      </svg>
      {h && (
        <div className="pointer-events-none absolute top-1 rounded-xl bg-ink/90 px-3 py-2 text-[11.5px] ring-1 ring-white/10 backdrop-blur-md" style={{ left: `clamp(0px, calc(${(x(h.t) / W) * 100}% - 60px), calc(100% - 130px))` }}>
          <div className="text-mist">T{Math.round((h.t % 1) * 4) + 1} {Math.floor(h.t)}{h.proj ? ' · projection' : ''}</div>
          <div className="num text-[13px] text-bone">{fmt(h.v)} €/m²</div>
        </div>
      )}
    </div>
  )
}

function Seg<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: T[] }) {
  return <div className="flex flex-wrap gap-1">{items.map((i) => <button key={i} onClick={() => onChange(i)} className={clsx('rounded-full px-2.5 py-1 text-[11.5px] ring-1 transition-colors duration-300', value === i ? 'bg-champagne/15 text-champagne-300 ring-champagne/30' : 'bg-white/[0.03] text-bone/60 ring-white/[0.07] hover:text-bone')}>{i}</button>)}</div>
}

export default function Marche() {
  const [raw] = useProperties()
  const props = raw as Listing[]
  const [sid, setSid] = useState('p1')
  const s = props.find((l) => l.id === sid) ?? props[0]
  if (!s) return <div><PageHeader kicker="Production · estimation argumentée" title={<>Marché <span className="italic text-champagne-300">&amp; estimation</span></>} /><Empty title="Aucun bien à estimer">Créez un bien dans le portefeuille pour lancer une estimation.</Empty></div>
  return <Estimation s={s} props={props} onPick={setSid} />
}

function Estimation({ s, props, onPick }: { s: Listing; props: Listing[]; onPick: (id: string) => void }) {
  const [, ops] = useProperties()
  const [dossiers] = useDossiers()
  const comps = useMemo(() => compsFor(s), [s.id, s.price, s.surface, s.lng, s.lat]) // eslint-disable-line react-hooks/exhaustive-deps
  const v0 = valOf(s)
  const [q, setQ] = useState(`${s.address}, ${s.city}`)
  const [sugg, setSugg] = useState(false)
  const [radius, setRadius] = useState(v0.radius)
  const [sea, setSea] = useState(v0.sea)
  const [cond, setCond] = useState<keyof typeof COND>(v0.cond as keyof typeof COND)
  const [land, setLand] = useState(v0.land)
  const [floor, setFloor] = useState<keyof typeof FLOOR>(v0.floor as keyof typeof FLOOR)
  const [target, setTarget] = useState<number | null>(v0.target)
  const [hover, setHover] = useState<string | null>(null)
  const [l7, setL7] = useState<'idle' | 'gen' | 'done' | 'nodossier'>('idle')
  const [docId, setDocId] = useState<string | null>(null)
  const [tab, setTab] = useState<'tous' | 'dvf' | 'annonce'>('tous')
  const dossierId = dossiers.find((d) => d.propertyId === s.id)?.id

  // Ajustements persistés sur le bien (champ `valuation`), après une courte pause de saisie
  const dirty = useRef(false)
  const val: Val = { sea, cond, land, floor, radius, target }
  const valKey = JSON.stringify(val)
  useEffect(() => {
    if (!dirty.current || valKey === JSON.stringify(valOf(s))) return
    const id = s.id, t = setTimeout(() => ops.update(id, { valuation: JSON.parse(valKey) }).catch((e) => toast(errText(e), 'error')), 600)
    return () => clearTimeout(t)
  }, [valKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const edit = <T,>(f: (v: T) => void) => (v: T) => { dirty.current = true; f(v) }

  // Comparables retenus / écartés persistés sur le bien (champ `compsExcluded`)
  const excl = s.compsExcluded ?? defaultExcl(comps)
  const setExcl = (n: Record<string, string>) => ops.update(s.id, { compsExcluded: n }).catch((e) => toast(errText(e), 'error'))

  const pick = (id: string) => {
    const n = props.find((l) => l.id === id)
    if (!n) return
    const v = valOf(n)
    dirty.current = false
    onPick(id); setQ(`${n.address}, ${n.city}`); setSugg(false); setRadius(v.radius); setLand(v.land)
    setSea(v.sea); setCond(v.cond as keyof typeof COND); setFloor(v.floor as keyof typeof FLOOR); setTarget(v.target); setL7('idle')
  }

  const inR = comps.filter((c) => c.d <= radius)
  const kept = inR.filter((c) => !excl[c.id])
  const ppms = kept.map((c) => (c.kind === 'annonce' ? c.ppm * 0.92 : c.ppm))
  const med = median(ppms)
  const refLand = s.land ?? 0
  const adj = {
    sea: sea ? 0.08 : 0,
    cond: COND[cond],
    land: refLand ? Math.max(-0.06, Math.min(0.06, ((land - refLand) / refLand) * 0.12)) : 0,
    floor: FLOOR[floor],
  }
  const value = Math.round((med * s.surface * (1 + adj.sea) * (1 + adj.cond) * (1 + adj.land) * (1 + adj.floor)) / 10000) * 10000
  const mean = ppms.reduce((a, b) => a + b, 0) / (ppms.length || 1)
  const cv = ppms.length ? Math.sqrt(ppms.reduce((a, b) => a + (b - mean) ** 2, 0) / ppms.length) / mean : 0
  const u = Math.min(0.15, Math.max(0.03, 0.025 + (cv / Math.sqrt(Math.max(1, ppms.length))) * 1.6 + (ppms.length < 4 ? 0.04 : 0)))
  const low = Math.round((value * (1 - u)) / 10000) * 10000, high = Math.round((value * (1 + u)) / 10000) * 10000
  const tMin = Math.round(low * 0.9 / 10000) * 10000, tMax = Math.round(high * 1.1 / 10000) * 10000
  const tg = Math.min(tMax, Math.max(tMin, target ?? value))
  const gap = value ? (tg - value) / value : 0
  const delay = Math.round(Math.max(35, 62 + gap * 700))
  const series = useMemo(() => priceSeries(s), [s])

  const markers = [
    ...inR.map((c) => ({ id: c.id, lng: c.lng, lat: c.lat, label: kppm(c.ppm), tone: excl[c.id] ? 'mist' as const : c.kind === 'dvf' ? 'sage' as const : 'sea' as const, title: c.addr })),
    { id: 'subject', lng: s.lng, lat: s.lat, label: 'Bien estimé', tone: 'gold' as const },
  ]
  // centre entre le bien et ses comparables : la carte montre la terre, pas la mer
  const mid: [number, number] = inR.length ? [(s.lng * 2 + inR.reduce((a, c) => a + c.lng, 0) / inR.length) / 3, (s.lat * 2 + inR.reduce((a, c) => a + c.lat, 0) / inR.length) / 3] : [s.lng, s.lat]
  const shapes = useMemo(() => [circle([s.lng, s.lat], radius, { id: 'radius', color: 'rgb(var(--acc-500))', opacity: 0.05, dashed: true })], [s, radius])
  const rows = inR.filter((c) => tab === 'tous' || c.kind === tab)
  const sugList = props.filter((l) => `${l.address} ${l.city} ${l.title} ${l.district}`.toLowerCase().includes(q.toLowerCase().split(',')[0].trim())).slice(0, 6)
  const genL7 = async () => {
    if (!kept.length) return toast('Aucun comparable retenu : impossible de calculer une fourchette', 'error')
    setL7('gen')
    try {
      await ops.update(s.id, { estimateLow: low, estimateHigh: high, valuation: val })
      if (!dossierId) { setL7('nodossier'); toast('Fourchette enregistrée sur le bien — aucun dossier vendeur lié, L7 non générée', 'info'); return }
      await action('deliverable.generate', { dossierId, code: 'L7' })
      setL7('done'); setDocId(`${dossierId}-L7`); toast('L7 générée — en file de validation, rien n’est envoyé au vendeur')
    } catch (e) { setL7('idle'); toast(errText(e), 'error') }
  }
  const refresh = async () => { try { await ops.reload(); toast('Sources relues · DVF 2026-S1, dernier millésime publié', 'info') } catch (e) { toast(errText(e), 'error') } }
  const maxDpe = Math.max(...DPE_STATS.map((d) => d.ppm))

  return (
    <div>
      <PageHeader
        kicker="Production · estimation argumentée"
        title={<>Marché <span className="italic text-champagne-300">&amp; estimation</span></>}
        sub="Comparables DVF et annonces en cours, ajustements explicites, fourchette avec incertitude. Chaque chiffre est sourcé et daté."
        actions={<>
          <SoftBtn icon={<ArrowsClockwise size={14} />} onClick={refresh}>Actualiser les sources</SoftBtn>
          <SoftBtn tone="gold" icon={l7 === 'gen' ? <ArrowsClockwise size={14} className="animate-spin" /> : <FileText size={14} />} onClick={l7 === 'gen' ? undefined : l7 === 'done' && dossierId ? () => setDocId(`${dossierId}-L7`) : genL7}>{l7 === 'gen' ? 'Génération…' : l7 === 'done' ? 'Voir la L7' : 'Générer L7'}</SoftBtn>
        </>}
      />

      {/* Recherche d'adresse */}
      <Stagger className="relative z-20 mb-6">
        <div className="relative max-w-2xl">
          <div className="flex items-center gap-3 rounded-full bg-white/[0.03] py-1.5 pl-4 pr-1.5 ring-1 ring-white/[0.08] transition focus-within:ring-champagne/40">
            <MagnifyingGlass size={16} className="text-mist" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setSugg(true) }} onFocus={() => setSugg(true)} onBlur={() => setTimeout(() => setSugg(false), 150)} placeholder="Adresse du bien à estimer…" className="min-w-0 flex-1 bg-transparent text-[14px] text-bone outline-none placeholder:text-mist" aria-label="Adresse à estimer" />
            <span className="hidden items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1.5 text-[11.5px] text-bone/70 sm:flex"><img src={s.photo} alt="" className="h-5 w-5 rounded-full object-cover" />{s.surface} m² · {s.type}</span>
          </div>
          <AnimatePresence>
            {sugg && sugList.length > 0 && (
              <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl bg-ink-800/95 p-1.5 shadow-float ring-1 ring-white/10 backdrop-blur-xl">
                {sugList.map((l) => (
                  <li key={l.id}><button onMouseDown={() => pick(l.id)} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/[0.05]"><img src={l.photo} alt="" className="h-8 w-10 rounded-lg object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-[13px]">{l.address}, {l.city}</span><span className="block truncate text-[11px] text-mist">{l.title} · {l.surface} m²</span></span><span className="num text-[11.5px] text-mist">{l.district}</span></button></li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Carte comparables */}
        <Stagger i={1} className="min-w-0 lg:col-span-7">
          <Card pad={false} className="h-full">
            <div className="flex h-full flex-col">
            <GeoMap markers={markers} shapes={shapes} activeId={hover ?? 'subject'} onHover={setHover} center={[s.lng, s.lat]} zoom={13.6} focus={{ center: mid, zoom: 14.4 - Math.log2(radius / 500) }} className="h-[420px] rounded-t-[calc(1.4rem-0.25rem)] lg:h-auto lg:min-h-[470px] lg:flex-1">
              <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
                {[['bg-sage', `Vendus DVF · ${inR.filter((c) => c.kind === 'dvf').length}`], ['bg-sea', `Annonces · ${inR.filter((c) => c.kind === 'annonce').length}`], ['bg-mist', 'Écartés']].map(([c, l]) => <span key={l} className="flex items-center gap-1.5 rounded-full bg-ink/75 px-2.5 py-1 text-[11px] text-bone/80 ring-1 ring-white/10 backdrop-blur-md"><span className={clsx('h-1.5 w-1.5 rounded-full', c)} />{l}</span>)}
              </div>
            </GeoMap>
            <div className="flex flex-wrap items-center gap-4 p-5">
              <span className="text-[10.5px] uppercase tracking-eyebrow text-mist">Rayon</span>
              <input type="range" min={300} max={2000} step={50} value={radius} onChange={(e) => edit(setRadius)(+e.target.value)} className="min-w-[160px] flex-1 accent-[rgb(var(--acc-500))]" aria-label="Rayon de recherche" />
              <span className="num w-16 text-right text-[13px]">{meters(radius)}</span>
              <span className="text-[11.5px] text-mist"><span className="num text-bone">{kept.length}</span> retenus sur {inR.length}</span>
            </div>
            </div>
          </Card>
        </Stagger>

        {/* Fourchette */}
        <Stagger i={2} className="min-w-0 lg:col-span-5">
          <Card kicker="Fourchette calculée" title={`${s.title} · ${s.surface} m²`} className="h-full">
            <div className="display text-[2.9rem] leading-none md:text-[3.4rem]">{eur(low).replace(' M€', '')} – {eur(high)}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-bone/60"><span>Valeur centrale <span className="num text-bone">{eur(value)}</span></span><span className="text-white/15">·</span><span>incertitude <span className="num text-champagne-300">± {(u * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %</span></span><span className="text-white/15">·</span><span className="num">{fmt(Math.round(med))} €/m² médian</span></div>
            <div className="mt-1.5 text-[11.5px] text-mist">Fourchette enregistrée sur la fiche : <span className="num text-bone/75">{eur(s.estimateLow)} – {eur(s.estimateHigh)}</span>{s.estimateLow === low && s.estimateHigh === high && <span className="text-sage"> · à jour</span>}</div>

            <div className="relative mt-7 h-12">
              <div className="absolute inset-x-0 top-5 h-1.5 rounded-full bg-white/[0.06]" />
              <motion.div className="absolute top-5 h-1.5 rounded-full bg-gradient-to-r from-champagne-700 via-champagne to-champagne-700" animate={{ left: `${((low - tMin) / (tMax - tMin)) * 100}%`, right: `${100 - ((high - tMin) / (tMax - tMin)) * 100}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
              <motion.div className="absolute top-3.5 h-4 w-px bg-bone/60" animate={{ left: `${((value - tMin) / (tMax - tMin)) * 100}%` }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
              <motion.div className="absolute top-0 -translate-x-1/2" animate={{ left: `${((tg - tMin) / (tMax - tMin)) * 100}%` }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}><span className="num block whitespace-nowrap rounded-full bg-champagne px-2 py-0.5 text-[10.5px] text-ink">{eur(tg)}</span></motion.div>
              <input type="range" min={tMin} max={tMax} step={10000} value={tg} onChange={(e) => edit(setTarget)(+e.target.value)} className="absolute inset-x-0 top-3 h-6 w-full cursor-pointer opacity-0" aria-label="Prix de présentation" />
              <div className="num absolute inset-x-0 top-9 flex justify-between text-[10px] text-mist"><span>{eur(tMin)}</span><span>{eur(tMax)}</span></div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[[pct(gap), 'écart / valeur'], [`${delay} j`, 'délai estimé'], [gap > 0.06 ? 'Faible' : gap > 0 ? 'Moyenne' : 'Forte', 'probabilité · 90 j']].map(([a, b]) => <div key={b} className="rounded-2xl bg-white/[0.025] p-3 ring-1 ring-white/[0.05]"><div className="display text-2xl">{a}</div><div className="text-[10.5px] text-mist">{b}</div></div>)}
            </div>

            <div className="mt-5 space-y-3 border-t border-white/[0.06] pt-5">
              <div className="text-[10.5px] uppercase tracking-eyebrow text-mist">Ajustements · recalcul en direct</div>
              <div className="flex items-center gap-3"><Waves size={15} className="text-champagne-300" /><span className="flex-1 text-[13px]">Vue mer <span className="num ml-1.5 text-[11px] text-champagne-300">{pct(adj.sea)}</span></span><button role="switch" aria-checked={sea} onClick={() => edit(setSea)(!sea)} className={clsx('relative h-5 w-9 rounded-full transition-colors duration-300', sea ? 'bg-champagne' : 'bg-white/10')}><motion.span layout transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className={clsx('absolute top-0.5 h-4 w-4 rounded-full bg-ink-800', sea ? 'right-0.5' : 'left-0.5')} /></button></div>
              <div className="flex flex-wrap items-center gap-3"><Hammer size={15} className="text-champagne-300" /><span className="flex-1 text-[13px]">État <span className="num ml-1.5 text-[11px] text-champagne-300">{pct(adj.cond)}</span></span><Seg value={cond} onChange={edit(setCond)} items={Object.keys(COND) as (keyof typeof COND)[]} /></div>
              <div className="flex items-center gap-3"><Tree size={15} className="text-champagne-300" /><span className="whitespace-nowrap text-[13px]">Terrain <span className="num ml-1.5 text-[11px] text-champagne-300">{pct(adj.land)}</span></span><input type="range" min={0} max={3000} step={50} disabled={!refLand} value={land} onChange={(e) => edit(setLand)(+e.target.value)} className="min-w-0 flex-1 accent-[rgb(var(--acc-500))] disabled:opacity-30" aria-label="Surface de terrain" /><span className="num w-16 text-right text-[11.5px] text-bone/70">{refLand ? `${fmt(land)} m²` : 'Sans'}</span></div>
              <div className="flex flex-wrap items-center gap-3"><Stairs size={15} className="text-champagne-300" /><span className="flex-1 text-[13px]">Étage <span className="num ml-1.5 text-[11px] text-champagne-300">{pct(adj.floor)}</span></span><Seg value={floor} onChange={edit(setFloor)} items={Object.keys(FLOOR) as (keyof typeof FLOOR)[]} /></div>
            </div>
          </Card>
        </Stagger>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <Stagger i={3} className="min-w-0 lg:col-span-7">
          <Card title="Comparables" kicker={`${inR.length} dans un rayon de ${meters(radius)}`} action={<Tabs id="mk-comp" value={tab} onChange={setTab} items={[{ id: 'tous', label: 'Tous' }, { id: 'dvf', label: 'DVF' }, { id: 'annonce', label: 'Annonces' }]} />} pad={false}>
            <div className="thin-scroll max-h-[520px] overflow-auto">
              <table className="w-full min-w-[700px] text-left text-[12.5px]">
                <thead className="sticky top-0 z-10 bg-ink-800 text-[10px] uppercase tracking-eyebrow text-mist"><tr className="border-b border-white/[0.06]">{['', 'Adresse', 'Date', 'Surface', 'Prix', '€/m²', 'Dist.', 'Exclusion'].map((h) => <th key={h} className="px-3 py-3 font-normal">{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map((c) => {
                    const off = !!excl[c.id]
                    return (
                      <tr key={c.id} onMouseEnter={() => setHover(c.id)} onMouseLeave={() => setHover(null)} className={clsx('whitespace-nowrap border-b border-white/[0.04] transition-colors duration-200', hover === c.id ? 'bg-white/[0.035]' : '', off && 'text-bone/40')}>
                        <td className="px-3 py-2.5"><input type="checkbox" checked={!off} onChange={() => { const n = { ...excl }; if (off) delete n[c.id]; else n[c.id] = c.kind === 'annonce' ? MOTIFS[0] : MOTIFS[1]; setExcl(n) }} className="h-4 w-4 cursor-pointer accent-[rgb(var(--sage))]" aria-label={`Retenir ${c.addr}`} /></td>
                        <td className="px-3 py-2.5"><div className="flex items-center gap-2"><span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', off ? 'bg-mist' : c.kind === 'dvf' ? 'bg-sage' : 'bg-sea')} /><span className="truncate">{c.addr}</span></div><div className="pl-3.5 text-[10.5px] text-mist">{c.kind === 'dvf' ? 'Vendu · DVF' : `Annonce · ${c.days} j`}{c.seaView ? ' · vue mer' : ''} · {c.condition.toLowerCase()}</div></td>
                        <td className="num px-3 py-2.5 text-bone/70">{c.date}</td>
                        <td className="num px-3 py-2.5">{c.surface} m²</td>
                        <td className="num px-3 py-2.5">{eur(c.price)}</td>
                        <td className="num px-3 py-2.5">{fmt(c.ppm)}</td>
                        <td className="num px-3 py-2.5 text-bone/60">{meters(c.d)}</td>
                        <td className="px-3 py-2.5">{off ? <select value={excl[c.id]} onChange={(e) => setExcl({ ...excl, [c.id]: e.target.value })} className="rounded-full bg-coral/10 px-2.5 py-1 text-[11px] text-coral outline-none ring-1 ring-coral/25">{MOTIFS.map((m) => <option key={m} className="bg-ink-800 text-bone">{m}</option>)}</select> : <span className="text-[11px] text-mist">—</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </Stagger>

        <div className="min-w-0 space-y-6 lg:col-span-5">
          <Stagger i={4}>
            <Card title="Prix au m² du secteur" kicker={`${s.district} · trimestriel`} action={<span className="flex items-center gap-3 text-[10.5px] text-mist"><span className="flex items-center gap-1"><span className="h-0.5 w-4 bg-champagne" />Réel</span><span className="flex items-center gap-1"><span className="h-0.5 w-4 border-t border-dashed border-champagne-300" />Projection</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sage" />Retenus</span></span>}>
              <PriceChart series={series} dots={kept.filter((c) => c.kind === 'dvf')} />
              <p className="mt-2 text-[11.5px] text-bone/50">Projection à 12 mois : <span className="num text-champagne-300">+3,0 %</span>, cône d’incertitude à 80 %. Indicatif, ne constitue pas une garantie de prix.</p>
            </Card>
          </Stagger>
          <Stagger i={5}>
            <Card title="Sources" kicker="Datées et traçables" action={<Database size={15} className="text-mist" />}>
              <div className="space-y-2">
                {[['DVF · Demandes de valeurs foncières', 'Millésime 2026-S1 · publié le 15/04/2026', 'data.gouv.fr'], ['Annonces actives', 'Veille portails · 11/10/2026 07:00', '5 portails'], ['INSEE · Recensement & Filosofi', 'RP 2022 · Filosofi 2021', 'insee.fr'], ['Indices Notaires-INSEE', '2T 2026 · Alpes-Maritimes', 'notaires.fr']].map(([a, b, c]) => (
                  <div key={a} className="flex items-start gap-3 rounded-xl bg-white/[0.02] px-3 py-2.5 ring-1 ring-white/[0.05]"><CheckCircle size={15} weight="fill" className="mt-0.5 shrink-0 text-sage" /><div className="min-w-0 flex-1"><div className="text-[12.5px]">{a}</div><div className="num text-[11px] text-mist">{b}</div></div><span className="text-[10.5px] text-mist">{c}</span></div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-champagne/[0.06] p-4 ring-1 ring-champagne/20">
                <AnimatePresence mode="wait">
                  {l7 === 'done' ? (
                    <motion.div key="d" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3"><CheckCircle size={18} weight="fill" className="mt-0.5 text-sage" /><div className="text-[12.5px]"><div className="text-bone">Estimation argumentée L7 générée</div><div className="mt-0.5 text-bone/55">{eur(low)} – {eur(high)} · {kept.length} comparables · en attente de votre validation dans le dossier. Rien n’est envoyé au vendeur.</div><button onClick={() => dossierId && setDocId(`${dossierId}-L7`)} className="mt-1.5 text-champagne-300 hover:underline">Ouvrir le document</button></div></motion.div>
                  ) : l7 === 'nodossier' ? (
                    <motion.div key="n" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3"><Warning size={18} className="mt-0.5 shrink-0 text-coral" /><div className="text-[12.5px]"><div className="text-bone">Fourchette enregistrée, L7 non générée</div><div className="mt-0.5 text-bone/55">Aucun dossier vendeur n’est rattaché à « {s.title} ». Le livrable L7 s’adresse au vendeur : créez d’abord son dossier.</div><Link to="/app/dossiers" className="mt-1.5 inline-block text-champagne-300 hover:underline">Créer le dossier vendeur</Link></div></motion.div>
                  ) : (
                    <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-3"><Sparkle size={16} weight="fill" className="text-champagne" /><span className="flex-1 text-[12.5px] text-bone/75">Enregistrer la fourchette sur le bien et la transformer en document vendeur L7, avec méthode et sources.{!dossierId && <span className="text-coral"> Aucun dossier lié.</span>}</span><SoftBtn tone="gold" icon={l7 === 'gen' ? <ArrowsClockwise size={13} className="animate-spin" /> : <FileText size={13} />} onClick={l7 === 'idle' ? genL7 : undefined}>{l7 === 'gen' ? 'Génération…' : 'Générer L7'}</SoftBtn></motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </Stagger>
        </div>
      </div>

      {/* Analyse DPE */}
      <Stagger i={6} className="mt-6">
        <Card title="Valeur verte · analyse DPE locale" kicker="Antibes · ventes DVF 2024 – 2026 · appartements et maisons" action={<Pill tone="gold"><Target size={11} />Bien estimé : classe {s.dpe}</Pill>}>
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-2 lg:col-span-8">
              {DPE_STATS.map((d, i) => (
                <div key={d.c} className={clsx('flex items-center gap-3 rounded-xl px-2 py-1 transition-colors', d.c === s.dpe && 'bg-white/[0.04] ring-1 ring-white/[0.08]')}>
                  <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[12px] font-semibold text-ink" style={{ background: DPE_C[d.c] }}>{d.c}</span>
                  <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-white/[0.03]">
                    <motion.div className="absolute inset-y-0 left-0 rounded-lg" style={{ background: `linear-gradient(90deg, ${DPE_C[d.c]}22, ${DPE_C[d.c]}66)` }} initial={{ width: 0 }} whileInView={{ width: `${(d.ppm / maxDpe) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.2, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }} />
                    <span className="num absolute inset-y-0 left-3 flex items-center text-[12px] text-bone">{fmt(d.ppm)} €/m²</span>
                  </div>
                  <span className="num w-16 text-right text-[11.5px] text-mist">n = {d.n}</span>
                  <span className={clsx('num w-16 text-right text-[11.5px]', d.ppm >= DPE_STATS[3].ppm ? 'text-sage' : 'text-coral')}>{pct(d.ppm / DPE_STATS[3].ppm - 1)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3 lg:col-span-4">
              <div className="rounded-2xl bg-white/[0.025] p-4 ring-1 ring-white/[0.05]"><div className="text-[10.5px] uppercase tracking-eyebrow text-mist">Décote F/G vs D</div><div className="display mt-1 text-4xl text-coral">−18 %</div><div className="mt-1 text-[12px] text-bone/55">Accentuée depuis l’interdiction de louer les logements G (2025), F suivra en 2028.</div></div>
              <div className="flex gap-2.5 rounded-2xl bg-sea/[0.06] p-4 text-[12px] leading-relaxed text-bone/70 ring-1 ring-sea/15"><Info size={15} className="mt-0.5 shrink-0 text-sea" /><span>Effectifs inférieurs à 50 (classe A) : écart indicatif. Écarts calculés en médiane, base classe D, 1 446 ventes.</span></div>
            </div>
          </div>
        </Card>
      </Stagger>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Délai de vente médian" value="74 j" delta="−6 j" hint="Secteur, 12 derniers mois" />
        <Stat label="Marge de négociation" value="4,8 %" hint="Annonce → acte, DVF appariés" />
        <Stat label="Stock d’annonces" value="186" delta="+11 %" hint="Biens > 1 M€ · Antibes" />
        <Stat label="Tension acheteurs" value="2,4" hint="Acquéreurs qualifiés par bien" />
      </div>
      <Modal open={!!docId} onClose={() => setDocId(null)} width={640} kicker="Document généré · validation humaine requise" title={<>Analyse <span className="italic text-champagne-300">&amp; estimation</span> L7</>}>
        {docId && <DocView id={docId} />}
      </Modal>
    </div>
  )
}
