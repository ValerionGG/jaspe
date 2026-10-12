import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import clsx from 'clsx'
import { Sparkle, CheckCircle, Circle, Question, UserFocus, Seal, ChatCircleText, Warning, ArrowRight, Target, ChartLineUp, ShieldCheck, Lightbulb, Plus, X } from '@phosphor-icons/react'
import { Card, SoftBtn } from '../ui'
import { Avatar, Spark, EXPO } from '../../ui/kit'
import { prop, agent, eur, fmt, AGENCIES, type DelivState } from '../../data/mock'
import { DISCOVERY_BLOCKS } from '../../data/dossier'
import { compsFor, priceSeries, meters } from '../../data/geo'
import { useDocuments } from '../../data/collections'
import { useCollection, action, type Doc } from '../../data/store'
import { toast, errText } from '../forms'
import type { StepProps } from './index'
import { CRITICAL, QUESTIONS, type JourneyX, type PrepState } from './prep-model'
import { DelivHead, Sources, Sub, StatePill, nameOf, todayFr, useLatest } from './prep-ui'
import RadarPanel from './prep-radar'

type Code = 'D1' | 'D2' | 'D3' | 'D4'
const CODES: Code[] = ['D1', 'D2', 'D3', 'D4']
const WEIGHT: Record<DelivState, number> = { done: 1, review: 0.8, running: 0.4, blocked: 0.2, waiting: 0 }
const LABEL: Record<string, string> = Object.fromEntries(DISCOVERY_BLOCKS.flatMap((b) => b.fields.map(([k, l]) => [k, l])))
const CHECKLIST = [
  'Relire le brief D1 et les points à confirmer', 'Imprimer 3 comparables vendus (D2)', 'Préparer la fourchette et la stratégie de prix', 'Mandat type et barème d’honoraires',
  'Book de services de l’agence', 'Confirmer le RDV la veille (consentement de contact vérifié)', 'Itinéraire et stationnement', 'Tablette chargée — mode entretien D5',
]

export default function StepPrep({ dossier: d, journey, save, openDeliverable, goTo }: StepProps) {
  const j = journey as JourneyX
  const [docs] = useDocuments()
  const [sel, setSel] = useState<Code>(() => CODES.find((c) => d.deliverables[c] !== 'done') ?? 'D1')
  const [busy, setBusy] = useState(false)
  const latest = useLatest({ j, save })
  const prep: PrepState = j.prep ?? {}
  const items = [...CHECKLIST, ...(prep.custom ?? [])]
  const checked = items.filter((x) => prep.checklist?.[x]).length
  const savePrep = async (patch: PrepState) => {
    const { j: cur, save: s } = latest.current
    try { await s({ prep: { ...(cur.prep ?? {}), ...patch } } as Partial<JourneyX>) } catch (x) { toast(errText(x), 'error') }
  }
  const state = (c: string) => (d.deliverables[c] ?? 'waiting') as DelivState
  const docOf = (c: string) => docs.find((x) => x.id === `${d.id}-${c}`)
  const parts = [...CODES.map((c) => WEIGHT[state(c)]), items.length ? checked / items.length : 0]
  const ready = Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100)
  const missing = (['D1', 'D2', 'D3'] as const).filter((c) => !['done', 'review', 'running'].includes(state(c)))

  const prepareAll = async () => {
    setBusy(true)
    try { await action('deliverable.generateAll', { dossierId: d.id, codes: missing }); toast(`${missing.join(', ')} en préparation — résultats en temps réel`) } catch (x) { toast(errText(x), 'error') } finally { setBusy(false) }
  }

  return (
    <>
      {/* Bandeau de préparation */}
      <Card>
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="relative h-[88px] w-[88px] shrink-0">
              <svg viewBox="0 0 92 92" className="-rotate-90"><circle cx="46" cy="46" r="40" fill="none" stroke="rgb(var(--tint) / .07)" strokeWidth="5" /><motion.circle cx="46" cy="46" r="40" fill="none" stroke={ready >= 100 ? 'rgb(var(--sage))' : 'rgb(var(--acc-500))'} strokeWidth="5" strokeLinecap="round" strokeDasharray={251.3} initial={{ strokeDashoffset: 251.3 }} animate={{ strokeDashoffset: 251.3 * (1 - ready / 100) }} transition={{ duration: 1.2, ease: EXPO }} /></svg>
              <span className="display absolute inset-0 flex items-center justify-center text-[1.8rem]">{ready}<span className="ml-0.5 text-sm text-mist">%</span></span>
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] uppercase tracking-eyebrow text-mist">{d.next} · {d.due}</div>
              <div className="display mt-1.5 text-[1.9rem] leading-none md:text-[2.2rem]">Préparation prête à <span className="whitespace-nowrap italic text-champagne-300">{ready} %</span></div>
              <div className="mt-1.5 text-[12.5px] text-bone/55">{d.seller} · {prop(d.propertyId).district}</div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <SoftBtn tone="gold" disabled={busy || !missing.length} onClick={prepareAll} icon={<Sparkle size={14} weight="fill" />}>{busy ? 'Lancement…' : missing.length ? 'Tout préparer' : 'D1–D3 lancés'}</SoftBtn>
            <SoftBtn onClick={() => goTo('discovery')} icon={<ArrowRight size={14} />}>Entretien D5</SoftBtn>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-5 gap-2 border-t border-white/[0.05] pt-4">
          {[...CODES.map((c) => ({ k: c, v: WEIGHT[state(c)], l: nameOf(c) })), { k: 'RDV', v: parts[4], l: `Check-list ${checked}/${items.length}` }].map((x) => (
            <div key={x.k} title={x.l} className="min-w-0">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><motion.div className={clsx('h-full rounded-full', x.v >= 1 ? 'bg-sage' : 'bg-champagne')} initial={{ width: 0 }} animate={{ width: `${x.v * 100}%` }} transition={{ duration: 1, ease: EXPO }} /></div>
              <div className="mt-1.5 flex items-baseline gap-1.5"><span className="num text-[10.5px] text-champagne-300">{x.k}</span><span className="hidden truncate text-[11px] text-mist sm:inline">{x.l}</span></div>
            </div>
          ))}
        </div>
        {missing.length > 0 && <p className="mt-3 text-[11.5px] text-mist">« Tout préparer » lance {missing.join(', ')} en parallèle ; chaque livrable arrive « à valider » dans la file.</p>}
      </Card>

      {/* Sous-navigation D1–D4 */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {CODES.map((c) => {
          const on = sel === c
          return (
            <button key={c} onClick={() => setSel(c)} className={clsx('relative rounded-[1.2rem] p-4 text-left ring-1 transition-colors duration-300', on ? 'ring-champagne/40' : 'bg-white/[0.02] ring-white/[0.06] hover:bg-white/[0.04]')}>
              {on && <motion.span layoutId="prep-tile" className="absolute inset-0 rounded-[1.2rem] bg-champagne/[0.08]" transition={{ duration: 0.5, ease: EXPO }} />}
              <span className="relative flex items-center justify-between"><span className={clsx('num text-[12px]', on ? 'text-champagne-300' : 'text-mist')}>{c}</span><StatePill state={state(c)} /></span>
              <span className="relative mt-3 block text-[14px] leading-tight">{nameOf(c)}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={sel} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease: EXPO }}>
          <Card>
            {sel === 'D1' && <BriefPanel {...{ d, j, prep, savePrep }} head={<DelivHead code="D1" state={state('D1')} doc={docOf('D1')} dossierId={d.id} onOpen={openDeliverable} lead="Préparation relationnelle à partir de faits déclarés ou publics autorisés — jamais de traits sensibles déduits." />} foot={<Sources doc={docOf('D1')} planned={['Fiche dossier', 'Agenda', 'Découverte D5']} />} />}
            {sel === 'D2' && <MarketPanel d={d} head={<DelivHead code="D2" state={state('D2')} doc={docOf('D2')} dossierId={d.id} onOpen={openDeliverable} lead="Prix vendus (DVF) et prix affichés distingués, échantillon visible, fourchette qui reflète l’incertitude." />} foot={<Sources doc={docOf('D2')} planned={['DVF · Etalab 2026-S1', 'Annonces actives du secteur']} />} />}
            {sel === 'D3' && <RadarPanel d={d} head={<DelivHead code="D3" state={state('D3')} doc={docOf('D3')} dossierId={d.id} onOpen={openDeliverable} lead="Carte, faits établis et impacts supposés séparés, statut et date de chaque projet." />} foot={<Sources doc={docOf('D3')} planned={['IGN Géoplateforme', 'Géoportail de l’urbanisme', 'Géorisques']} />} />}
            {sel === 'D4' && <CoachPanel {...{ d, j, prep, items, savePrep }} head={<DelivHead code="D4" state={state('D4')} doc={docOf('D4')} dossierId={d.id} onOpen={openDeliverable} lead="Répétition des objections probables à partir de D1–D3, évaluation observable — pas de jugement de personnalité." />} foot={<Sources doc={docOf('D4')} planned={['Simulation NXT Coaching', 'Brief D1', 'Marché D2']} />} />}
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

type Base = { d: StepProps['dossier']; head: React.ReactNode; foot: React.ReactNode }

/* ——— D1 · Brief relationnel ——— */
function BriefPanel({ d, j, prep, savePrep, head, foot }: Base & { j: JourneyX; prep: PrepState; savePrep: (p: PrepState) => Promise<void> }) {
  const p = prop(d.propertyId), a = agent(d.agentId), disc = j.discovery
  const val = (k: string) => disc[k]?.v?.trim()
  const facts = [
    { l: 'Surface habitable', v: `${p.surface} m²`, s: 'Plan géomètre' },
    ...(p.land ? [{ l: 'Terrain', v: `${fmt(p.land)} m²`, s: 'Cadastre PCI' }] : []),
    { l: 'Année de construction', v: String(p.year), s: 'Acte de propriété' },
    { l: 'DPE', v: `Classe ${p.dpe}`, s: 'Observatoire ADEME' },
    ...Object.entries(disc).filter(([k, f]) => f?.v && (f.origin === 'pièce' || f.origin === 'vérifié') && !['surface', 'terrain', 'annee', 'dpe'].includes(k)).map(([k, f]) => ({ l: LABEL[k] ?? k, v: f.v, s: f.origin === 'pièce' ? 'Pièce déposée' : 'Vérifié' })),
  ]
  const toConfirm = [
    ...Object.entries(disc).filter(([, f]) => f?.v && f.origin === 'à confirmer').map(([k, f]) => ({ k, l: LABEL[k] ?? k, v: f.v })),
    ...CRITICAL.filter((k) => !val(k) && !['surface', 'pieces', 'dpe'].includes(k)).map((k) => ({ k, l: LABEL[k], v: '' })), // ponytail: surface, pièces et DPE connus par la fiche bien
  ]
  const prefs = (['contactPref', 'craintes', 'experience', 'decideurs'] as const).map((k) => ({ k, l: LABEL[k], v: val(k) }))
  const questions = [...new Set(toConfirm.map((x) => x.k))].map((k) => QUESTIONS[k]).filter(Boolean).slice(0, 6)
  return (
    <div className="space-y-5">
      {head}
      <div className="grid gap-4 lg:grid-cols-5">
        <Sub kicker="Contexte vendeur" className="lg:col-span-2">
          <div className="flex items-center gap-3"><Avatar src={d.sellerPhoto ?? '/img/p-paul.webp'} size={44} /><div><div className="text-[15px]">{d.seller}</div><div className="text-[11.5px] text-mist">Suivi par {a.name}</div></div></div>
          <dl className="mt-4 space-y-2 text-[13px]">
            <div className="flex justify-between gap-3"><dt className="text-mist">Projet</dt><dd className="text-right">{val('motivation') ?? d.motivation}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-mist">Horizon</dt><dd className="text-right">{val('horizon') ?? d.timeline}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-mist">Bien</dt><dd className="text-right">{p.title}</dd></div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-1.5">{d.tags.map((t) => <span key={t} className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] ring-1 ring-white/[0.07]">{t}</span>)}</div>
        </Sub>
        <Sub kicker="Faits sourcés" title={`${facts.length} faits vérifiables`} className="lg:col-span-3">
          <ul className="divide-y divide-white/[0.05]">
            {facts.slice(0, 8).map((f) => <li key={f.l} className="flex items-center justify-between gap-3 py-2 text-[13px]"><span className="text-mist">{f.l}</span><span className="flex min-w-0 items-center gap-2"><span className="truncate">{f.v}</span><span className="shrink-0 rounded-full bg-sage/10 px-2 py-0.5 text-[10px] text-sage ring-1 ring-sage/20">{f.s}</span></span></li>)}
          </ul>
        </Sub>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Sub kicker="Points à confirmer" title={toConfirm.length ? `${toConfirm.length} point(s) ouverts` : 'Tout est confirmé'}>
          {toConfirm.length === 0 && <p className="text-[13px] text-mist">Aucun champ critique manquant ni en attente de confirmation.</p>}
          <ul className="space-y-1.5">{toConfirm.slice(0, 7).map((x) => <li key={x.k + x.v} className="flex items-start gap-2.5 text-[13px]"><Warning size={15} weight="light" className="mt-0.5 shrink-0 text-coral" /><span><span className="text-bone/85">{x.l}</span>{x.v ? <span className="text-mist"> — {x.v}</span> : <span className="text-coral/80"> — non renseigné</span>}</span></li>)}</ul>
        </Sub>
        <Sub kicker="Préférences déclarées" title="Ce que le vendeur a dit lui-même">
          <ul className="space-y-2">{prefs.map((x) => <li key={x.k} className="text-[13px]"><div className="text-[11px] text-mist">{x.l}</div><div className={x.v ? 'text-bone/85' : 'text-mist italic'}>{x.v ?? 'À recueillir pendant l’entretien'}</div></li>)}</ul>
        </Sub>
        <Sub kicker="Identité & incertitude" title="Homonymie">
          <p className="text-[13px] leading-relaxed text-bone/70">« {d.seller} » : plusieurs homonymes dans les annuaires publics du secteur. Seules la fiche dossier et les pièces fournies font foi ; aucune recherche sur la vie privée, aucun trait sensible déduit (RGPD, accès limité au dossier).</p>
          <button onClick={() => savePrep({ identityConfirmed: !prep.identityConfirmed }).then(() => toast(prep.identityConfirmed ? 'Identité remise à confirmer' : 'Identité confirmée'))} className={clsx('mt-3 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] ring-1 transition', prep.identityConfirmed ? 'bg-sage/15 text-sage ring-sage/25' : 'bg-white/[0.04] text-bone/80 ring-white/[0.08] hover:bg-white/[0.08]')}>{prep.identityConfirmed ? <Seal size={14} weight="fill" /> : <UserFocus size={14} />}{prep.identityConfirmed ? 'Identité confirmée par le vendeur' : 'Marquer l’identité confirmée'}</button>
        </Sub>
        <Sub kicker="Questions à poser" title="Ouvertes, issues du guide D5">
          <ol className="space-y-2">{(questions.length ? questions : [QUESTIONS.motivation, QUESTIONS.experience, QUESTIONS.strategie]).map((q, i) => <li key={q} className="flex gap-2.5 text-[13px]"><span className="num mt-0.5 text-[11px] text-champagne-300">{String(i + 1).padStart(2, '0')}</span><span className="text-bone/85">{q}</span></li>)}</ol>
        </Sub>
      </div>
      {foot}
    </div>
  )
}

/* ——— D2 · Marché & comparables ——— */
function MarketPanel({ d, head, foot }: Base) {
  const p = prop(d.propertyId)
  const comps = useMemo(() => compsFor(p), [p])
  const series = useMemo(() => priceSeries(p), [p])
  const [kind, setKind] = useState<'all' | 'dvf' | 'annonce'>('all')
  const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0 }
  const dvf = comps.filter((c) => c.kind === 'dvf'), ann = comps.filter((c) => c.kind === 'annonce')
  const mDvf = med(dvf.map((c) => c.ppm)), mAnn = med(ann.map((c) => c.ppm)), ppm = Math.round(p.price / p.surface)
  const lo = Math.round(p.estimateLow / p.surface), hi = Math.round(p.estimateHigh / p.surface)
  const ag = AGENCIES.find((x) => x.name.includes(p.district) || p.district.includes(x.name)) ?? AGENCIES.find((x) => x.name.includes(p.city)) ?? AGENCIES[0]
  const sold12 = dvf.filter((c) => c.t >= 2025.78).length
  const stock = sold12 ? (ann.length / (sold12 / 12)).toFixed(1).replace('.', ',') : '—'
  const real = series.filter((x) => !x.proj), yoy = real.length > 4 ? Math.round(((real.at(-1)!.v - real.at(-5)!.v) / real.at(-5)!.v) * 1000) / 10 : 0
  const all = comps.map((c) => c.ppm).concat(lo, hi, ppm), min = Math.min(...all) * 0.97, max = Math.max(...all) * 1.03
  const x = (v: number) => `${((v - min) / (max - min)) * 100}%`
  const rows = comps.filter((c) => kind === 'all' || c.kind === kind)
  return (
    <div className="space-y-5">
      {head}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Médiane vendus', `${fmt(mDvf)} €/m²`, `${dvf.length} ventes DVF`],
          ['Médiane annonces', `${fmt(mAnn)} €/m²`, `${mDvf ? (mAnn > mDvf ? '+' : '') + Math.round(((mAnn - mDvf) / mDvf) * 100) : 0} % vs vendus`],
          ['Délai de vente', `${ag.delai} j`, `Secteur ${ag.name}`],
          ['Stock', `${stock} mois`, `${ann.length} annonces · ${sold12} ventes / 12 mois`],
        ].map(([l, v, h]) => <Sub key={l}><div className="text-[11px] text-mist">{l}</div><div className="display mt-1 text-[1.75rem] leading-none">{v}</div><div className="mt-1.5 text-[11px] text-bone/45">{h}</div></Sub>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <Sub kicker="€/m² · échantillon" title="Fourchette et positionnement" className="lg:col-span-3">
          <div className="relative mt-6 h-14">
            <div className="absolute inset-x-0 top-6 h-px bg-white/10" />
            <div className="absolute top-[18px] h-4 rounded-full bg-champagne/15 ring-1 ring-champagne/30" style={{ left: x(lo), width: `calc(${x(hi)} - ${x(lo)})` }} title={`Fourchette ${fmt(lo)}–${fmt(hi)} €/m²`} />
            {comps.map((c) => <span key={c.id} title={`${c.addr} · ${fmt(c.ppm)} €/m² · ${c.kind === 'dvf' ? 'vendu' : 'annonce'}`} className={clsx('absolute top-[21px] h-2.5 w-2.5 -translate-x-1/2 rounded-full', c.kind === 'dvf' ? 'bg-sea' : 'bg-transparent ring-[1.5px] ring-coral')} style={{ left: x(c.ppm) }} />)}
            <div className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: x(ppm) }}><span className="num whitespace-nowrap rounded-full bg-champagne px-2 py-0.5 text-[10px] text-ink">Prix envisagé {fmt(ppm)}</span><span className="h-7 w-px bg-champagne" /></div>
          </div>
          <div className="num mt-2 flex justify-between text-[10.5px] text-mist"><span>{fmt(Math.round(min))} €/m²</span><span>{fmt(Math.round(max))} €/m²</span></div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[11.5px] text-bone/60"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sea" />Vendu (DVF)</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full ring-[1.5px] ring-coral" />Annonce</span><span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-full bg-champagne/25 ring-1 ring-champagne/30" />Fourchette {eur(p.estimateLow)} – {eur(p.estimateHigh)}</span></div>
        </Sub>
        <Sub kicker="Indice du secteur" title={<span className="flex items-center gap-2"><ChartLineUp size={15} className="text-champagne-300" />{yoy >= 0 ? '+' : ''}{String(yoy).replace('.', ',')} % sur 12 mois</span>} className="lg:col-span-2">
          <div className="mt-2 w-full overflow-hidden"><Spark data={real.map((s) => s.v)} w={230} h={76} /></div>
          <div className="num mt-2 flex justify-between text-[10.5px] text-mist"><span>2022</span><span>2026</span></div>
          <Link to="/app/marche" className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-champagne-300 transition hover:gap-2.5">Ouvrir l’analyse Marché <ArrowRight size={13} /></Link>
        </Sub>
      </div>
      <Sub kicker="Comparables" title={`${rows.length} biens dans un rayon de 1,9 km`} action={
        <div className="flex gap-1 rounded-full bg-white/[0.03] p-1 ring-1 ring-white/[0.06]">{([['all', 'Tous'], ['dvf', 'Vendus'], ['annonce', 'Annonces']] as const).map(([k, l]) => <button key={k} onClick={() => setKind(k)} className={clsx('relative rounded-full px-3 py-1 text-[12px]', kind === k ? 'text-bone' : 'text-bone/55')}>{kind === k && <motion.span layoutId="d2-kind" className="absolute inset-0 rounded-full bg-white/[0.09]" transition={{ duration: 0.4, ease: EXPO }} />}<span className="relative">{l}</span></button>)}</div>
      }>
        <div className="thin-scroll -mx-1 overflow-x-auto">
          <table className="w-full min-w-[620px] text-[12.5px]">
            <thead><tr className="text-left text-[10.5px] uppercase tracking-eyebrow text-mist">{['Adresse', 'Nature', 'Date', 'Surface', 'Prix', '€/m²', 'Distance'].map((h) => <th key={h} className="px-1 pb-2 font-normal">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-white/[0.05]">
                  <td className="px-1 py-2">{c.addr}</td>
                  <td className="px-1 py-2">{c.kind === 'dvf' ? <span className="rounded-full bg-sea/10 px-2 py-0.5 text-[10.5px] text-sea">Vendu · DVF</span> : <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[10.5px] text-coral">Annonce · {c.days} j</span>}</td>
                  <td className="px-1 py-2 text-mist">{c.date}</td>
                  <td className="num px-1 py-2">{c.surface} m²</td>
                  <td className="num px-1 py-2">{eur(c.price)}</td>
                  <td className={clsx('num px-1 py-2', c.ppm > ppm ? 'text-sage' : 'text-bone/80')}>{fmt(c.ppm)}</td>
                  <td className="num px-1 py-2 text-mist">{meters(c.d)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-mist">Les annonces sont des prix affichés, non des prix de vente : elles éclairent la concurrence, pas la valeur. Échantillon calculé le {todayFr()}.</p>
      </Sub>
      {foot}
    </div>
  )
}

/* ——— D4 · Simulation coaching ——— */
type Session = { id: string; title: string; level: string; score: number; at: string; persona: string }
const ANSWERS: [RegExp, string][] = [
  [/honorai/i, 'Chiffrer le plan (photos, 3D, avant-première, reporting) action par action.'],
  [/exclusiv/i, 'Engagements écrits : bilans J+7 / J+21 / J+42, sortie possible si non tenus.'],
  [/voisin|plus cher|prix/i, 'Montrer les ventes DVF (D2), pas les annonces : prix réels datés.'],
  [/jardin|entretien/i, 'Proposer un contrat d’entretien chiffré à présenter aux acquéreurs.'],
]
function CoachPanel({ d, j, prep, items, savePrep, head, foot }: Base & { j: JourneyX; prep: PrepState; items: string[]; savePrep: (p: PrepState) => Promise<void> }) {
  const [raw] = useCollection<Session & Doc>('coaching')
  const last = [...raw].filter((s) => typeof s.score === 'number' && s.at).sort((a, b) => b.at.localeCompare(a.at))[0]
  const [adding, setAdding] = useState('')
  const fromDisc = j.discovery.objections?.v?.split(/,|;| et /).map((s) => s.trim()).filter(Boolean) ?? []
  const objections = [...new Set([...(j.coaching?.objections ?? []), ...fromDisc.map((s) => s[0].toUpperCase() + s.slice(1))])]
  const list = objections.length ? objections : ['Honoraires trop élevés', 'Pourquoi l’exclusivité ?', 'Le voisin a vendu plus cher']
  const score = j.coaching?.score ?? last?.score
  const done = items.filter((x) => prep.checklist?.[x]).length
  const toggle = (x: string) => savePrep({ checklist: { ...(prep.checklist ?? {}), [x]: !prep.checklist?.[x] } })
  const add = async () => { const t = adding.trim(); if (!t) return; await savePrep({ custom: [...(prep.custom ?? []), t] }); setAdding(''); toast('Point ajouté à la check-list') }
  const removeCustom = (x: string) => savePrep({ custom: (prep.custom ?? []).filter((c) => c !== x) })
  return (
    <div className="space-y-5">
      {head}
      <div className="grid gap-4 lg:grid-cols-5">
        <Sub kicker="Objections probables" title={`${list.length} objections à répéter`} className="lg:col-span-3">
          <ul className="space-y-2.5">
            {list.map((o) => (
              <li key={o} className="rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/[0.05]">
                <div className="flex items-center gap-2 text-[13.5px]"><ChatCircleText size={15} weight="light" className="text-coral" />« {o} »</div>
                <div className="mt-1.5 flex gap-2 pl-[23px] text-[12px] text-bone/60"><Lightbulb size={13} className="mt-0.5 shrink-0 text-champagne-300" />{ANSWERS.find(([re]) => re.test(o))?.[1] ?? 'Préparer une preuve sourcée et une question de reformulation.'}</div>
              </li>
            ))}
          </ul>
        </Sub>
        <Sub kicker="Dernière simulation" className="lg:col-span-2">
          {score !== undefined ? (
            <>
              <div className="flex items-end gap-2"><span className="display text-[3.4rem] leading-none">{score}</span><span className="pb-1.5 text-mist">/ 100</span></div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><motion.div className={clsx('h-full rounded-full', score >= 75 ? 'bg-sage' : score >= 55 ? 'bg-champagne' : 'bg-coral')} initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1.1, ease: EXPO }} /></div>
              <p className="mt-3 text-[12.5px] text-bone/60">{last ? `${last.title} · ${last.persona} · niveau ${last.level.toLowerCase()} · ${new Date(last.at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : 'Score enregistré sur le dossier.'}</p>
            </>
          ) : <p className="text-[13px] text-mist">Aucune simulation pour ce dossier. Dix minutes suffisent, même avec un brief partiel.</p>}
          <Link to="/app/coaching" className="mt-4 inline-flex items-center gap-2 rounded-full bg-champagne px-4 py-2 text-[13px] font-medium text-ink transition hover:bg-champagne-300"><Target size={14} />S’entraîner maintenant</Link>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-mist"><ShieldCheck size={12} />Mode privé par défaut — partage manager explicite.</p>
        </Sub>
      </div>
      <Sub kicker="Check-list du rendez-vous" title={`${done} / ${items.length} prêts`} action={<span className="num text-[12px] text-mist">{Math.round((done / (items.length || 1)) * 100)} %</span>}>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {items.map((x) => {
            const on = !!prep.checklist?.[x], custom = prep.custom?.includes(x)
            return (
              <div key={x} className={clsx('group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] ring-1 transition', on ? 'bg-sage/[0.07] ring-sage/20' : 'bg-white/[0.02] ring-white/[0.05] hover:bg-white/[0.04]')}>
                <button onClick={() => toggle(x)} className="flex flex-1 items-center gap-2.5 text-left" aria-pressed={on}>{on ? <CheckCircle size={17} weight="fill" className="shrink-0 text-sage" /> : <Circle size={17} weight="light" className="shrink-0 text-mist" />}<span className={on ? 'text-bone/60 line-through decoration-white/20' : ''}>{x}</span></button>
                {custom && <button onClick={() => removeCustom(x)} aria-label="Retirer" className="text-mist opacity-0 transition group-hover:opacity-100 hover:text-coral"><X size={13} /></button>}
              </div>
            )
          })}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); add() }} className="mt-3 flex gap-2">
          <input value={adding} onChange={(e) => setAdding(e.target.value)} placeholder="Ajouter un point (ex. apporter le plan cadastral)" className="flex-1 rounded-full bg-white/[0.03] px-4 py-2 text-[13px] outline-none ring-1 ring-white/[0.08] placeholder:text-mist focus:ring-champagne/50" />
          <button type="submit" disabled={!adding.trim()} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05] ring-1 ring-white/[0.08] transition hover:bg-white/[0.1] disabled:opacity-40" aria-label="Ajouter"><Plus size={14} /></button>
        </form>
      </Sub>
      {foot}
      <p className="flex items-center gap-1.5 text-[11px] text-mist"><Question size={12} />Dossier {d.ref} · la check-list est enregistrée sur le dossier et partagée avec l’équipe.</p>
    </div>
  )
}
