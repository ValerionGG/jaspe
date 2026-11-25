import { Link } from 'react-router-dom'
import { useMemo, useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Timer, DownloadSimple, ArrowCounterClockwise, Info, ArrowSquareOut } from '@phosphor-icons/react'
import { PageHeader, Card, Stat, SoftBtn, Stagger, Empty } from '../ui'
import { Pill } from '../../ui/kit'
import { useTimelog, useSettings, useDossiers } from '../../data/collections'
import { BASELINES, KIND_LABELS, type TimeEntry } from '../../data/assist'
import { action } from '../../data/store'
import { REVIEW_MIN, CORRECTION_MIN } from '../../../../server/assist.js'
import { Field, Input, Select, toast, errText } from '../forms'

const DEMO_KEY = 'jaspe.temps.includeDemo'
const DAY = 864e5
const WEEKS = 4
const BASE = BASELINES as Record<string, number>
const NAMES = KIND_LABELS as Record<string, string>
type Calib = { values?: Record<string, number>; samples?: Record<string, number[]> }

const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })
const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const hours = (min: number) => `${nf1.format(min / 60)} h`
const mins = (min: number) => `${nf1.format(min)} min`
const dShort = (t: number) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
const dFull = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const big = (v: string, u: string) => <><span className="num">{v}</span><span className="text-[1.1rem] text-bone/55"> {u}</span></>
const sum = (a: TimeEntry[], k: 'baseline' | 'spent' | 'net' | 'corrections') => a.reduce((s, e) => s + (Number(e[k]) || 0), 0)

function readDemo() { try { return localStorage.getItem(DEMO_KEY) !== '0' } catch { return true } }
const RATE_KEY = 'jaspe.temps.rate', SUB_KEY = 'jaspe.temps.subscription'
function readNum(k: string, d: number) { try { const v = Number(localStorage.getItem(k)); return v > 0 ? v : d } catch { return d } }
function writeNum(k: string, v: number) { try { localStorage.setItem(k, String(v)) } catch { /* stockage indisponible */ } }
const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
function writeDemo(v: boolean) { try { localStorage.setItem(DEMO_KEY, v ? '1' : '0') } catch { /* stockage indisponible : préférence non mémorisée */ } }

export default function TempsGagne() {
  const [log] = useTimelog()
  const [settings] = useSettings()
  const [dossiers] = useDossiers()
  const [withDemo, setWithDemo] = useState(readDemo)
  const [kind, setKind] = useState<string>('L7')
  const [minutes, setMinutes] = useState('')
  const [busy, setBusy] = useState(false)
  const [rate, setRate] = useState(() => String(readNum(RATE_KEY, 60)))
  const [sub, setSub] = useState(() => String(readNum(SUB_KEY, 49)))

  const calib = (settings.find((s) => s.id === 'time-baselines') ?? {}) as Calib
  const dossierOf = (id?: string) => (id ? dossiers.find((d) => d.id === id) : undefined)

  const entries = useMemo(() => (log as TimeEntry[]).filter((e) => withDemo || !e.demo).sort((a, b) => +new Date(b.at) - +new Date(a.at)), [log, withDemo])
  const demoCount = (log as TimeEntry[]).filter((e) => e.demo).length

  const now = Date.now()
  const weeks = useMemo(() => Array.from({ length: WEEKS }, (_, i) => {
    const end = now - i * 7 * DAY, start = end - 7 * DAY
    const es = entries.filter((e) => { const t = +new Date(e.at); return t > start && t <= end })
    return { start, end, n: es.length, baseline: sum(es, 'baseline'), spent: sum(es, 'spent'), net: sum(es, 'net') }
  }).reverse(), [entries, now])
  const thisWeek = weeks[WEEKS - 1]
  const last4 = entries.filter((e) => +new Date(e.at) > now - WEEKS * 7 * DAY)
  const net4 = sum(last4, 'net')
  const corrected = entries.filter((e) => e.corrections > 0).length
  const corrRate = entries.length ? corrected / entries.length : 0
  const avgSpent = entries.length ? sum(entries, 'spent') / entries.length : 0

  const byKind = useMemo(() => {
    const m = new Map<string, TimeEntry[]>()
    for (const e of entries) m.set(e.kind, [...(m.get(e.kind) ?? []), e])
    return [...m.entries()].map(([k, es]) => ({
      kind: k, label: NAMES[k] ?? es[0].label, n: es.length,
      baseline: sum(es, 'baseline') / es.length, spent: sum(es, 'spent') / es.length,
      corrections: sum(es, 'corrections'), net: sum(es, 'net'),
    })).sort((a, b) => b.net - a.net)
  }, [entries])

  const rateN = Number(rate.replace(',', '.')) || 0, subN = Number(sub.replace(',', '.')) || 0
  const value4 = (net4 / 60) * rateN
  const subPeriod = subN * (WEEKS * 7) / 30.44 // abonnement ramené à 4 semaines
  const onRate = (v: string) => { setRate(v); const n = Number(v.replace(',', '.')); if (n > 0) writeNum(RATE_KEY, n) }
  const onSub = (v: string) => { setSub(v); const n = Number(v.replace(',', '.')); if (n > 0) writeNum(SUB_KEY, n) }
  const toggleDemo = () => { const v = !withDemo; setWithDemo(v); writeDemo(v) }

  const calibrate = async (ev: FormEvent) => {
    ev.preventDefault()
    const m = Number(minutes.replace(',', '.'))
    if (!(m > 0)) { toast('Indiquez une durée en minutes supérieure à 0', 'error'); return }
    setBusy(true)
    try {
      const res = await action<Calib>('time.calibrate', { kind, minutes: m })
      const ref = res?.values?.[kind]
      toast(`Chrono enregistré · « ${NAMES[kind]} » : référence ${ref !== undefined ? mins(ref) : 'mise à jour'}`)
      setMinutes('')
    } catch (x) { toast(errText(x), 'error') } finally { setBusy(false) }
  }
  const reset = async (k: string) => {
    try { await action('time.reset', { kind: k }); toast(`Référence « ${NAMES[k]} » revenue à ${mins(BASE[k])}`) } catch (x) { toast(errText(x), 'error') }
  }

  const exportCsv = () => {
    const esc = (v: unknown) => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
    const head = ['date', 'type', 'libelle', 'dossier', 'vendeur', 'reference_min', 'passe_min', 'corrections', 'net_min', 'demo']
    const rows = entries.map((e) => { const d = dossierOf(e.dossierId); return [new Date(e.at).toISOString(), e.kind, e.label, d?.ref ?? e.dossierId ?? '', d?.seller ?? '', e.baseline, e.spent, e.corrections, e.net, e.demo ? 'oui' : 'non'] })
    const csv = '﻿' + [head, ...rows].map((r) => r.map(esc).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = `jaspe-temps-gagne-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast(`${entries.length} entrées exportées`)
  }

  const calibrated = Object.keys(calib.values ?? {}).filter((k) => k in BASE)
  const selSamples = calib.samples?.[kind] ?? []
  const selCur = calib.values?.[kind]

  return (
    <div>
      <Stagger>
        <PageHeader
          kicker="Assistant · mesure"
          title="Temps gagné"
          sub="Chaque travail préparé par l’assistant est comparé au temps qu’il vous aurait pris à la main, moins le temps réellement passé à le relire et le corriger."
          actions={<>
            <button role="switch" aria-checked={withDemo} onClick={toggleDemo} className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.04] px-3.5 py-2 text-[13px] text-bone/85 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08]">
              <span className={clsx('relative flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 ring-1 transition-colors duration-300', withDemo ? 'justify-end bg-champagne ring-champagne' : 'justify-start bg-white/[0.06] ring-white/10')}><span className="h-4 w-4 rounded-full bg-snow shadow-sm" /></span>
              Inclure l’historique de démonstration{demoCount ? <span className="num text-[11px] text-mist">{demoCount}</span> : null}
            </button>
            <SoftBtn icon={<DownloadSimple size={15} />} onClick={exportCsv} disabled={!entries.length}>Exporter CSV</SoftBtn>
          </>}
        />
      </Stagger>

      {!entries.length ? (
        <Stagger i={1}><Empty title="Aucune mesure pour l’instant">Validez un livrable, une relance ou une facture préparés par l’assistant : chaque validation crée une entrée ici.{demoCount > 0 && !withDemo ? ' Vous pouvez aussi réactiver l’historique de démonstration.' : ''}</Empty></Stagger>
      ) : (<>
        <Stagger i={1} className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat label="Gain net · 7 jours" value={big(nf1.format(thisWeek.net / 60), 'h')} hint={`${thisWeek.n} travaux · ${hours(thisWeek.baseline)} de référence`} />
          <Stat label="Gain net · 4 semaines" value={big(nf1.format(net4 / 60), 'h')} hint={`${last4.length} travaux mesurés`} />
          <Stat label="Équivalent" value={big(nf1.format(net4 / 60 / 7), 'j')} hint="jours de travail de 7 h, sur 4 semaines" />
          <Stat label="Taux de correction" value={big(nf0.format(corrRate * 100), '%')} hint={`${corrected} entrée${corrected > 1 ? 's' : ''} corrigée${corrected > 1 ? 's' : ''} sur ${entries.length}`} />
          <div className="col-span-2 lg:col-span-1"><Stat label="Relecture moyenne" value={big(nf1.format(avgSpent), 'min')} hint="par document, corrections comprises" /></div>
        </Stagger>

        <Stagger i={2} className="mt-3">
          <Card>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[12px] text-mist">Valeur du temps gagné · 4 semaines</div>
                <div className="mt-2 display text-[2.6rem] leading-none"><span className="num">{eur.format(value4)}</span></div>
                <div className="mt-2 text-[12.5px] text-bone/55">
                  {nf1.format(net4 / 60)} h × {eur.format(rateN)}/h
                  {subN > 0 && <> · abonnement {eur.format(subN)}/mois, soit {eur.format(subPeriod)} sur 4 semaines : {value4 >= subPeriod
                    ? <span className="text-sage">gain {nf1.format(value4 / subPeriod)} fois supérieur</span>
                    : <span className="text-coral">gain inférieur au coût</span>}</>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:w-[320px]">
                <Field label="Votre taux horaire (€/h)"><Input type="number" inputMode="decimal" min={1} step="any" value={rate} onChange={(e) => onRate(e.target.value)} /></Field>
                <Field label="Abonnement (€/mois)"><Input type="number" inputMode="decimal" min={0} step="any" value={sub} onChange={(e) => onSub(e.target.value)} /></Field>
              </div>
            </div>
          </Card>
        </Stagger>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5 [&>*]:min-w-0">
          <Stagger i={2} className="lg:col-span-2">
            <Card title="Par semaine" kicker="Référence manuelle vs temps passé" className="h-full">
              <WeekChart weeks={weeks} />
            </Card>
          </Stagger>
          <Stagger i={3} className="lg:col-span-3">
            <Card title="Par type de travail" kicker="Trié par gain net" pad={false} className="h-full">
              <div className="overflow-x-auto px-5 pb-4">
                <table className="w-full min-w-[520px] text-[13px]">
                  <thead><tr className="text-left text-[11px] uppercase tracking-eyebrow text-mist">
                    <th className="py-2 font-normal">Type</th><th className="py-2 text-right font-normal">Nb</th><th className="py-2 text-right font-normal">Référence</th><th className="py-2 text-right font-normal">Passé moy.</th><th className="py-2 text-right font-normal">Corrections</th><th className="py-2 text-right font-normal">Gain net</th>
                  </tr></thead>
                  <tbody>{byKind.map((r) => (
                    <tr key={r.kind} className="border-t border-white/[0.05]">
                      <td className="py-2.5 pr-3"><span className="text-bone">{r.label}</span> <span className="num text-[11px] text-mist">{r.kind}</span></td>
                      <td className="num py-2.5 text-right text-bone/70">{r.n}</td>
                      <td className="num py-2.5 text-right text-bone/70">{mins(r.baseline)}</td>
                      <td className="num py-2.5 text-right text-bone/70">{mins(r.spent)}</td>
                      <td className={clsx('num py-2.5 text-right', r.corrections ? 'text-coral' : 'text-bone/40')}>{r.corrections}</td>
                      <td className="num py-2.5 text-right text-sage">{hours(r.net)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </Card>
          </Stagger>
        </div>
      </>)}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Stagger i={4}>
          <Card title="Calibrer avec un vrai chrono" kicker="Vos références, pas les nôtres" className="h-full">
            <p className="mb-4 text-[13px] text-bone/55">Faites une fois le travail à la main, chronomètre en route, et saisissez la durée. La référence devient la médiane de vos chronos ; elle s’applique aux prochaines mesures.</p>
            <form onSubmit={calibrate} className="grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
              <Field label="Type de travail">
                <Select value={kind} onChange={(e) => setKind(e.target.value)}>
                  {Object.keys(BASE).map((k) => <option key={k} value={k}>{NAMES[k]} ({k})</option>)}
                </Select>
              </Field>
              <Field label="Minutes à la main">
                <Input type="number" inputMode="decimal" min={1} step="any" placeholder={String(BASE[kind])} value={minutes} onChange={(e) => setMinutes(e.target.value)} required />
              </Field>
              <SoftBtn type="submit" tone="gold" icon={<Timer size={15} />} disabled={busy}>{busy ? 'Envoi…' : 'Enregistrer'}</SoftBtn>
            </form>
            <div className="mt-4 rounded-xl bg-white/[0.03] px-4 py-3 text-[12.5px] text-bone/70 ring-1 ring-white/[0.06]">
              <span className="text-bone">{NAMES[kind]}</span> · défaut <span className="num">{mins(BASE[kind])}</span>
              {selCur !== undefined ? <> · calibrée <span className="num text-champagne-300">{mins(selCur)}</span> · <span className="num">{selSamples.length}</span> chrono{selSamples.length > 1 ? 's' : ''} ({selSamples.map((s) => nf1.format(s)).join(', ')} min)</> : <> · pas encore calibrée</>}
            </div>
            <div className="mt-4">
              <div className="mb-2 text-[11px] uppercase tracking-eyebrow text-mist">Références calibrées</div>
              {calibrated.length ? (
                <ul className="divide-y divide-white/[0.05]">{calibrated.map((k) => (
                  <li key={k} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-[13px]">
                    <span className="min-w-0 flex-1 truncate">{NAMES[k]}</span>
                    <span className="num text-bone/45 line-through">{mins(BASE[k])}</span>
                    <span className="num text-champagne-300">{mins(calib.values![k])}</span>
                    <Pill>{(calib.samples?.[k] ?? []).length} éch.</Pill>
                    <button onClick={() => reset(k)} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] text-bone/60 ring-1 ring-white/[0.08] transition hover:bg-white/[0.06] hover:text-bone" aria-label={`Réinitialiser la référence ${NAMES[k]}`}><ArrowCounterClockwise size={13} />Réinitialiser</button>
                  </li>
                ))}</ul>
              ) : <p className="text-[12.5px] text-bone/45">Aucune : toutes les références sont les valeurs par défaut de Jaspe.</p>}
            </div>
          </Card>
        </Stagger>

        <Stagger i={5}>
          <Card title="Méthode" kicker="Comment ces chiffres sont calculés" className="h-full">
            <div className="rounded-xl bg-white/[0.03] px-4 py-3 text-center ring-1 ring-white/[0.06]">
              <div className="text-[13px] text-bone/85">gain net = référence manuelle − (relecture + corrections)</div>
              <div className="mt-1 text-[11.5px] text-mist">jamais négatif : un travail qui vous a coûté plus qu’à la main compte pour 0</div>
            </div>
            <ul className="mt-4 space-y-2.5 text-[13px] text-bone/65">
              <li><span className="text-bone">Référence manuelle</span> : durée type du travail fait sans assistant, figée au moment de la mesure. Valeurs par défaut Jaspe, remplacées par vos chronos dès que vous calibrez.</li>
              <li><span className="text-bone">Relecture</span> : chaque validation compte {REVIEW_MIN} min par défaut, ou la durée réelle quand elle est transmise.</li>
              <li><span className="text-bone">Corrections</span> : chaque modification d’un document déjà préparé ajoute {CORRECTION_MIN} min et incrémente le compteur de corrections.</li>
              <li><span className="text-bone">Valeur</span> : heures nettes × votre taux horaire, comparée à l’abonnement ramené à 4 semaines. Les deux montants sont les vôtres, mémorisés dans ce navigateur.</li>
              <li><span className="text-bone">Semaines</span> : périodes glissantes de 7 jours se terminant aujourd’hui.</li>
            </ul>
            <div className="mt-4 flex gap-2.5 rounded-xl bg-coral/[0.06] px-4 py-3 text-[12.5px] text-bone/70 ring-1 ring-coral/15">
              <Info size={16} className="mt-0.5 shrink-0 text-coral" />
              <div><span className="text-bone">Limites.</span> Les références par défaut sont des estimations tant qu’elles ne sont pas calibrées ; les chronos sont déclaratifs ; un recalibrage ne modifie pas les entrées passées. L’historique de démonstration est fictif : désactivez-le pour ne voir que vos mesures.</div>
            </div>
          </Card>
        </Stagger>
      </div>

      {entries.length > 0 && (
        <Stagger i={6} className="mt-4">
          <Card title="Dernières entrées" kicker={`15 plus récentes sur ${entries.length}`} pad={false}>
            <ul className="divide-y divide-white/[0.05] px-5 pb-3">
              {entries.slice(0, 15).map((e) => {
                const d = dossierOf(e.dossierId)
                return (
                  <li key={e.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 text-[13px] md:grid-cols-[90px_1fr_180px_repeat(3,72px)]">
                    <span className="num text-[12px] text-mist md:order-none">{dFull(e.at)}</span>
                    <span className="col-span-2 min-w-0 md:col-span-1">
                      <span className="text-bone">{e.label}</span>
                      {e.corrections > 0 && <Pill tone="red" className="ml-2">{e.corrections} corr.</Pill>}
                      {e.demo && <Pill className="ml-2">démo</Pill>}
                    </span>
                    <span className="col-span-2 min-w-0 truncate md:col-span-1">
                      {d ? <Link to={`/app/dossiers/${d.id}`} className="inline-flex items-center gap-1 text-sea hover:underline">{d.seller}<ArrowSquareOut size={12} /></Link> : <span className="text-bone/35">Sans dossier</span>}
                    </span>
                    <span className="col-span-2 flex gap-4 md:contents">
                      <span className="num text-bone/60 md:text-right"><span className="text-mist md:hidden">réf. </span>{mins(e.baseline)}</span>
                      <span className="num text-bone/60 md:text-right"><span className="text-mist md:hidden">passé </span>{mins(e.spent)}</span>
                      <span className="num text-sage md:text-right"><span className="text-mist md:hidden">net </span>{mins(e.net)}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </Card>
        </Stagger>
      )}
    </div>
  )
}

function WeekChart({ weeks }: { weeks: { start: number; end: number; n: number; baseline: number; spent: number; net: number }[] }) {
  const W = 320, H = 170, pb = 34, pt = 18
  const max = Math.max(60, ...weeks.map((w) => w.baseline))
  const slot = W / weeks.length, bw = Math.min(26, slot / 3.2)
  const y = (v: number) => H - pb - (v / max) * (H - pb - pt)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Temps de référence et temps passé par semaine">
        <line x1="0" x2={W} y1={H - pb} y2={H - pb} className="stroke-current text-bone/15" strokeWidth="1" />
        {weeks.map((w, i) => {
          const cx = slot * i + slot / 2
          return (
            <g key={w.end}>
              <rect x={cx - bw - 2} y={y(w.baseline)} width={bw} height={H - pb - y(w.baseline)} rx="3" className="fill-current text-bone/20"><title>{`Référence : ${hours(w.baseline)}`}</title></rect>
              <rect x={cx + 2} y={y(w.spent)} width={bw} height={Math.max(1, H - pb - y(w.spent))} rx="3" className="fill-current text-champagne"><title>{`Passé : ${hours(w.spent)}`}</title></rect>
              <text x={cx} y={pt - 6} textAnchor="middle" className="num fill-current text-sage" fontSize="10.5">+{nf1.format(w.net / 60)} h</text>
              <text x={cx} y={H - pb + 15} textAnchor="middle" className="fill-current text-mist" fontSize="10">{dShort(w.start + DAY)}</text>
              <text x={cx} y={H - pb + 27} textAnchor="middle" className="fill-current text-mist" fontSize="9.5">{w.n} trav.</text>
            </g>
          )
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-bone/60">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-bone/20" />Référence manuelle</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-champagne" />Temps passé</span>
        <span className="inline-flex items-center gap-1.5"><Timer size={13} className="text-sage" />Gain net</span>
      </div>
    </div>
  )
}
