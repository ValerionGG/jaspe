import { Link } from 'react-router-dom'
import { useMemo, useState, type FormEvent } from 'react'
import clsx from 'clsx'
import { Timer, DownloadSimple, ArrowCounterClockwise, Info, ArrowSquareOut, Copy, Printer, Hourglass } from '@phosphor-icons/react'
import { PageHeader, Card, Stat, SoftBtn, Stagger, Empty } from '../ui'
import { Pill } from '../../ui/kit'
import { useTimelog, useSettings, useDossiers } from '../../data/collections'
import { BASELINES, KIND_LABELS, type TimeEntry } from '../../data/assist'
import { action } from '../../data/store'
import { REVIEW_MIN, CORRECTION_MIN } from '../../../../server/assist.js'
import { Field, Input, Select, toast, errText } from '../forms'
import { useT, type TKey } from '../../i18n'

const DEMO_KEY = 'jaspe.temps.includeDemo'
const DAY = 864e5
const WEEKS = 4
const BASE = BASELINES as Record<string, number>
const NAMES = KIND_LABELS as Record<string, string>
type TE = TimeEntry & { pending?: boolean }
type CrDossier = { id: string; seller: string; rdvEndedAt?: string; crSentAt?: string; crDelayH?: number }
const median = (a: number[]) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
type Calib = { values?: Record<string, number>; samples?: Record<string, number[]> }

/** Formats selon la langue de l’interface. */
function fmts(locale: string) {
  const nf1 = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const nf0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
  return {
    nf1, nf0,
    hours: (min: number) => `${nf1.format(min / 60)} h`,
    mins: (min: number) => `${nf1.format(min)} min`,
    dShort: (t: number) => new Date(t).toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
    dFull: (iso: string) => new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }),
    eur: new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
    eur2: new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  }
}
const big = (v: string, u: string) => <><span className="num">{v}</span><span className="text-[1.1rem] text-bone/55"> {u}</span></>
const sum = (a: TimeEntry[], k: 'baseline' | 'spent' | 'net' | 'corrections') => a.reduce((s, e) => s + (Number(e[k]) || 0), 0)

function readDemo() { try { return localStorage.getItem(DEMO_KEY) !== '0' } catch { return true } }
const RATE_KEY = 'jaspe.temps.rate', SUB_KEY = 'jaspe.temps.subscription'
function readNum(k: string, d: number) { try { const v = Number(localStorage.getItem(k)); return v > 0 ? v : d } catch { return d } }
function writeNum(k: string, v: number) { try { localStorage.setItem(k, String(v)) } catch { /* stockage indisponible */ } }
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
  const [sub, setSub] = useState(() => String(readNum(SUB_KEY, 9.9)))
  const { t, locale } = useT()
  const { nf1, nf0, hours, mins, dShort, dFull, eur, eur2 } = useMemo(() => fmts(locale), [locale])
  const kn = (k: string) => (k in NAMES ? t(`kind.${k}` as TKey) : k)

  const calib = (settings.find((s) => s.id === 'time-baselines') ?? {}) as Calib
  const dossierOf = (id?: string) => (id ? dossiers.find((d) => d.id === id) : undefined)

  const visible = useMemo(() => (log as TE[]).filter((e) => withDemo || !e.demo).sort((a, b) => +new Date(b.at) - +new Date(a.at)), [log, withDemo])
  // Brouillons pas encore relus : affichés à part, jamais comptés dans les gains.
  const drafts = visible.filter((e) => e.pending)
  const entries = useMemo(() => visible.filter((e) => !e.pending), [visible])
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
  // Compte rendu vendeur : fin du RDV → validation L1.
  const crs = dossiers as unknown as CrDossier[]
  const measured = crs.filter((d) => d.crSentAt && typeof d.crDelayH === 'number').sort((a, b) => +new Date(b.crSentAt!) - +new Date(a.crSentAt!))
  const delays = measured.map((d) => d.crDelayH!)
  const crMedian = median(delays)
  const crUnder = delays.filter((h) => h < 24).length
  const crPct = delays.length ? crUnder / delays.length : 0
  const crWaiting = crs.filter((d) => d.rdvEndedAt && !d.crSentAt).map((d) => ({ ...d, sinceH: Math.max(0, (now - +new Date(d.rdvEndedAt!)) / 36e5) })).sort((a, b) => b.sinceH - a.sinceH)
  // Valeur rendue · 7 jours glissants.
  const weekStart = now - 7 * DAY
  const weekEntries = entries.filter((e) => +new Date(e.at) > weekStart)
  const weekH = sum(weekEntries, 'net') / 60
  const weekValue = weekH * rateN
  const weekSub = subN * 7 / 30.44
  const weekCr = measured.filter((d) => +new Date(d.crSentAt!) > weekStart)
  const weekCrUnder = weekCr.filter((d) => d.crDelayH! < 24).length
  const weekRelances = weekEntries.filter((e) => e.kind === 'relance').length
  const summary = () => [
    t('tg.sum.title', { from: dShort(weekStart + DAY), to: dShort(now) }),
    t('tg.sum.hours', { h: nf1.format(weekH), n: weekEntries.length }),
    t('tg.sum.value', { v: eur.format(weekValue), rate: eur.format(rateN) }),
    t('tg.sum.sub', { sub: eur2.format(subN), week: eur2.format(weekSub) }) + (weekSub > 0 ? t('tg.sum.ratio', { x: nf1.format(weekValue / weekSub) }) : ''),
    t('tg.sum.cr', { a: weekCrUnder, b: weekCr.length }),
    t('tg.sum.relances', { n: weekRelances }),
    ...(drafts.length ? [t('tg.sum.drafts', { n: drafts.length })] : []),
    t('tg.sum.method'),
  ].join('\n')
  const copySummary = async () => {
    const text = summary()
    try { await navigator.clipboard.writeText(text); toast(t('tg.copied')) } catch {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select()
      const ok = document.execCommand('copy'); ta.remove()
      if (ok) toast(t('tg.copied')); else toast(t('tg.copyFail'), 'error')
    }
  }
  const toggleDemo = () => { const v = !withDemo; setWithDemo(v); writeDemo(v) }

  const calibrate = async (ev: FormEvent) => {
    ev.preventDefault()
    const m = Number(minutes.replace(',', '.'))
    if (!(m > 0)) { toast(t('tg.errMinutes'), 'error'); return }
    setBusy(true)
    try {
      const res = await action<Calib>('time.calibrate', { kind, minutes: m })
      const ref = res?.values?.[kind]
      toast(t('tg.calibrated', { kind: kn(kind), ref: ref !== undefined ? mins(ref) : t('tg.updated') }))
      setMinutes('')
    } catch (x) { toast(errText(x), 'error') } finally { setBusy(false) }
  }
  const reset = async (k: string) => {
    try { await action('time.reset', { kind: k }); toast(t('tg.resetDone', { kind: kn(k), ref: mins(BASE[k]) })) } catch (x) { toast(errText(x), 'error') }
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
    toast(t('tg.exported', { n: entries.length }))
  }

  const calibrated = Object.keys(calib.values ?? {}).filter((k) => k in BASE)
  const selSamples = calib.samples?.[kind] ?? []
  const selCur = calib.values?.[kind]

  return (
    <div>
      <Stagger>
        <PageHeader
          kicker={t('tg.kicker')}
          title={t('tg.title')}
          sub={t('tg.sub')}
          actions={<>
            <button role="switch" aria-checked={withDemo} onClick={toggleDemo} className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.04] px-3.5 py-2 text-[13px] text-bone/85 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08]">
              <span className={clsx('relative flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 ring-1 transition-colors duration-300', withDemo ? 'justify-end bg-champagne ring-champagne' : 'justify-start bg-white/[0.06] ring-white/10')}><span className="h-4 w-4 rounded-full bg-snow shadow-sm" /></span>
              {t('tg.includeDemo')}{demoCount ? <span className="num text-[11px] text-mist">{demoCount}</span> : null}
            </button>
            <SoftBtn icon={<DownloadSimple size={15} />} onClick={exportCsv} disabled={!entries.length}>{t('tg.export')}</SoftBtn>
          </>}
        />
      </Stagger>

      {!entries.length ? (
        <Stagger i={1}><Empty title={t('tg.empty')}>{t('tg.emptyText')}{demoCount > 0 && !withDemo ? ` ${t('tg.emptyDemo')}` : ''}</Empty></Stagger>
      ) : (<>
        <Stagger i={1} className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat label={t('tg.net7')} value={big(nf1.format(thisWeek.net / 60), 'h')} hint={t('tg.net7Hint', { n: thisWeek.n, ref: hours(thisWeek.baseline) })} />
          <Stat label={t('tg.net4')} value={big(nf1.format(net4 / 60), 'h')} hint={t('tg.net4Hint', { n: last4.length })} />
          <Stat label={t('tg.equiv')} value={big(nf1.format(net4 / 60 / 7), t('tg.dayUnit'))} hint={t('tg.equivHint')} />
          <Stat label={t('tg.corrRate')} value={big(nf0.format(corrRate * 100), '%')} hint={t('tg.corrHint', { n: corrected, total: entries.length })} />
          <div className="col-span-2 lg:col-span-1"><Stat label={t('tg.avgReview')} value={big(nf1.format(avgSpent), 'min')} hint={t('tg.avgReviewHint')} /></div>
        </Stagger>

        <Stagger i={2} className="mt-3">
          <Card>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-[12px] text-mist">{t('tg.value4')}</div>
                <div className="mt-2 display text-[2.6rem] leading-none"><span className="num">{eur.format(value4)}</span></div>
                <div className="mt-2 text-[12.5px] text-bone/55">
                  {nf1.format(net4 / 60)} h × {eur.format(rateN)}/h
                  {subN > 0 && <> · {t('tg.subLine', { sub: eur.format(subN), period: eur.format(subPeriod) })} {value4 >= subPeriod
                    ? <span className="text-sage">{t('tg.gainX', { x: nf1.format(value4 / subPeriod) })}</span>
                    : <span className="text-coral">{t('tg.gainLow')}</span>}</>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:w-[320px]">
                <Field label={t('tg.rate')}><Input type="number" inputMode="decimal" min={1} step="any" value={rate} onChange={(e) => onRate(e.target.value)} /></Field>
                <Field label={t('tg.subField')}><Input type="number" inputMode="decimal" min={0} step="any" value={sub} onChange={(e) => onSub(e.target.value)} /></Field>
              </div>
            </div>
          </Card>
        </Stagger>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5 [&>*]:min-w-0">
          <Stagger i={2} className="lg:col-span-2">
            <Card title={t('tg.perWeek')} kicker={t('tg.perWeekK')} className="h-full">
              <WeekChart weeks={weeks} />
            </Card>
          </Stagger>
          <Stagger i={3} className="lg:col-span-3">
            <Card title={t('tg.perKind')} kicker={t('tg.perKindK')} pad={false} className="h-full">
              <div className="overflow-x-auto px-5 pb-4">
                <table className="w-full min-w-[520px] text-[13px]">
                  <thead><tr className="text-left text-[11px] uppercase tracking-eyebrow text-mist">
                    <th className="py-2 font-normal">{t('tg.th.type')}</th><th className="py-2 text-right font-normal">{t('tg.th.n')}</th><th className="py-2 text-right font-normal">{t('tg.th.ref')}</th><th className="py-2 text-right font-normal">{t('tg.th.spent')}</th><th className="py-2 text-right font-normal">{t('tg.th.corr')}</th><th className="py-2 text-right font-normal">{t('tg.th.net')}</th>
                  </tr></thead>
                  <tbody>{byKind.map((r) => (
                    <tr key={r.kind} className="border-t border-white/[0.05]">
                      <td className="py-2.5 pr-3"><span className="text-bone">{r.kind in NAMES ? kn(r.kind) : r.label}</span> <span className="num text-[11px] text-mist">{r.kind}</span></td>
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

      {drafts.length > 0 && (
        <Stagger i={3} className="mt-4">
          <div className="flex gap-2.5 rounded-xl bg-white/[0.03] px-4 py-3 text-[13px] text-bone/70 ring-1 ring-white/[0.06]">
            <Hourglass size={16} className="mt-0.5 shrink-0 text-champagne" />
            <div className="min-w-0"><span className="num text-bone">{drafts.length}</span> {t('tg.draftsWaiting', { n: drafts.length })} <span className="text-bone/50">{drafts.slice(0, 4).map((e) => e.label).join(' · ')}{drafts.length > 4 ? '…' : ''}</span></div>
          </div>
        </Stagger>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Stagger i={3}>
          <Card title={t('tg.cr')} kicker={t('tg.crK')} className="h-full">
            {!measured.length ? (
              <p className="text-[13px] text-bone/55">{t('tg.crNone')}</p>
            ) : (<>
              <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
                <div className="rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/[0.06]">
                  <div className="text-[12px] text-mist">{t('tg.crMedian')}</div>
                  <div className={clsx('mt-1 display text-[1.8rem] leading-none', crMedian < 24 ? 'text-sage' : 'text-coral')}>{big(nf1.format(crMedian), 'h')}</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/[0.06]">
                  <div className="text-[12px] text-mist">{t('tg.crUnder')}</div>
                  <div className="mt-1 display text-[1.8rem] leading-none">{big(nf0.format(crPct * 100), '%')}</div>
                  <div className="mt-1 text-[11.5px] text-bone/50">{t('tg.xOfY', { a: crUnder, b: delays.length })}</div>
                </div>
              </div>
              <div className="mb-1 mt-4 text-[11px] uppercase tracking-eyebrow text-mist">{t('tg.last5')}</div>
              <ul className="divide-y divide-white/[0.05]">{measured.slice(0, 5).map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-2 text-[13px]">
                  <span role="img" className={clsx('h-2.5 w-2.5 shrink-0 rounded-full', d.crDelayH! < 24 ? 'bg-sage' : 'bg-coral')} aria-label={d.crDelayH! < 24 ? t('tg.lt24') : t('tg.ge24')} />
                  <Link to={`/app/dossiers/${d.id}`} className="min-w-0 flex-1 truncate text-bone hover:underline">{d.seller}</Link>
                  <span className="num hidden shrink-0 text-[12px] text-mist sm:inline">{dFull(d.crSentAt!)}</span>
                  <span className={clsx('num shrink-0 text-right', d.crDelayH! < 24 ? 'text-sage' : 'text-coral')}>{nf1.format(d.crDelayH!)} h</span>
                </li>
              ))}</ul>
            </>)}
            {crWaiting.length > 0 && (
              <div className="mt-4">
                <div className="mb-1 text-[11px] uppercase tracking-eyebrow text-mist">{t('tg.crWaiting')}</div>
                <ul className="divide-y divide-white/[0.05]">{crWaiting.slice(0, 5).map((d) => (
                  <li key={d.id} className="flex items-center gap-3 py-2 text-[13px]">
                    <Link to={`/app/dossiers/${d.id}`} className="min-w-0 flex-1 truncate text-bone hover:underline">{d.seller}</Link>
                    <span className={clsx('num shrink-0', d.sinceH < 24 ? 'text-bone/70' : 'text-coral')}>{t('tg.since', { h: nf1.format(d.sinceH) })}</span>
                  </li>
                ))}</ul>
              </div>
            )}
          </Card>
        </Stagger>

        <Stagger i={3}>
          <Card title={t('tg.weekValue')} kicker={t('tg.weekValueK', { from: dShort(weekStart + DAY), to: dShort(now) })} className="h-full">
            <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
              <div className="rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/[0.06]">
                <div className="text-[12px] text-mist">{t('tg.netHours')}</div>
                <div className="mt-1 display text-[1.8rem] leading-none">{big(nf1.format(weekH), 'h')}</div>
                <div className="mt-1 text-[11.5px] text-bone/50">{t('tg.validated', { n: weekEntries.length })}</div>
              </div>
              <div className="rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/[0.06]">
                <div className="text-[12px] text-mist">{t('tg.valueLabel')}</div>
                <div className="mt-1 display truncate text-[1.8rem] leading-none"><span className="num">{eur.format(weekValue)}</span></div>
                <div className="mt-1 text-[11.5px] text-bone/50">{t('tg.atRate', { rate: eur.format(rateN) })}</div>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-[13px] text-bone/70">
              <li className="flex flex-wrap justify-between gap-x-3"><span>{t('tg.sub7', { sub: eur2.format(subN) })}</span><span className="num text-bone">{eur2.format(weekSub)}{weekSub > 0 && <span className={clsx('ml-2', weekValue >= weekSub ? 'text-sage' : 'text-coral')}>{weekValue >= weekSub ? `× ${nf1.format(weekValue / weekSub)}` : t('tg.notCovered')}</span>}</span></li>
              <li className="flex flex-wrap justify-between gap-x-3"><span>{t('tg.crSent24')}</span><span className="num text-bone">{weekCrUnder} / {weekCr.length}</span></li>
              <li className="flex flex-wrap justify-between gap-x-3"><span>{t('tg.relancesDone')}</span><span className="num text-bone">{weekRelances}</span></li>
              {drafts.length > 0 && <li className="flex flex-wrap justify-between gap-x-3 text-bone/50"><span>{t('tg.draftsNotCounted')}</span><span className="num">{drafts.length}</span></li>}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2 print:hidden">
              <SoftBtn tone="gold" icon={<Copy size={15} />} onClick={copySummary}>{t('tg.copy')}</SoftBtn>
              <SoftBtn icon={<Printer size={15} />} onClick={() => window.print()}>{t('tg.print')}</SoftBtn>
            </div>
          </Card>
        </Stagger>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Stagger i={4}>
          <Card title={t('tg.calib')} kicker={t('tg.calibK')} className="h-full">
            <p className="mb-4 text-[13px] text-bone/55">{t('tg.calibText')}</p>
            <form onSubmit={calibrate} className="grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
              <Field label={t('tg.workType')}>
                <Select value={kind} onChange={(e) => setKind(e.target.value)}>
                  {Object.keys(BASE).map((k) => <option key={k} value={k}>{kn(k)} ({k})</option>)}
                </Select>
              </Field>
              <Field label={t('tg.manualMin')}>
                <Input type="number" inputMode="decimal" min={1} step="any" placeholder={String(BASE[kind])} value={minutes} onChange={(e) => setMinutes(e.target.value)} required />
              </Field>
              <SoftBtn type="submit" tone="gold" icon={<Timer size={15} />} disabled={busy}>{busy ? t('common.sending') : t('common.save')}</SoftBtn>
            </form>
            <div className="mt-4 rounded-xl bg-white/[0.03] px-4 py-3 text-[12.5px] text-bone/70 ring-1 ring-white/[0.06]">
              <span className="text-bone">{kn(kind)}</span> · {t('tg.default')} <span className="num">{mins(BASE[kind])}</span>
              {selCur !== undefined ? <> · {t('tg.calibratedAt')} <span className="num text-champagne-300">{mins(selCur)}</span> · <span className="num">{selSamples.length}</span> {t('tg.chronos', { n: selSamples.length })} ({selSamples.map((s) => nf1.format(s)).join(', ')} min)</> : <> · {t('tg.notCalibrated')}</>}
            </div>
            <div className="mt-4">
              <div className="mb-2 text-[11px] uppercase tracking-eyebrow text-mist">{t('tg.calibRefs')}</div>
              {calibrated.length ? (
                <ul className="divide-y divide-white/[0.05]">{calibrated.map((k) => (
                  <li key={k} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-[13px]">
                    <span className="min-w-0 flex-1 truncate">{kn(k)}</span>
                    <span className="num text-bone/45 line-through">{mins(BASE[k])}</span>
                    <span className="num text-champagne-300">{mins(calib.values![k])}</span>
                    <Pill>{(calib.samples?.[k] ?? []).length} {t('tg.samples')}</Pill>
                    <button onClick={() => reset(k)} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] text-bone/60 ring-1 ring-white/[0.08] transition hover:bg-white/[0.06] hover:text-bone" aria-label={t('tg.resetAria', { kind: kn(k) })}><ArrowCounterClockwise size={13} />{t('tg.reset')}</button>
                  </li>
                ))}</ul>
              ) : <p className="text-[12.5px] text-bone/45">{t('tg.noCalib')}</p>}
            </div>
          </Card>
        </Stagger>

        <Stagger i={5}>
          <Card title={t('tg.method')} kicker={t('tg.methodK')} className="h-full">
            <div className="rounded-xl bg-white/[0.03] px-4 py-3 text-center ring-1 ring-white/[0.06]">
              <div className="text-[13px] text-bone/85">{t('tg.formula')}</div>
              <div className="mt-1 text-[11.5px] text-mist">{t('tg.neverNeg')}</div>
            </div>
            <ul className="mt-4 space-y-2.5 text-[13px] text-bone/65">
              <li><span className="text-bone">{t('tg.m.ref')}</span>{t('tg.m.refText')}</li>
              <li><span className="text-bone">{t('tg.m.review')}</span>{t('tg.m.reviewText', { min: REVIEW_MIN })}</li>
              <li><span className="text-bone">{t('tg.m.corr')}</span>{t('tg.m.corrText', { min: CORRECTION_MIN })}</li>
              <li><span className="text-bone">{t('tg.valueLabel')}</span>{t('tg.m.valueText')}</li>
              <li><span className="text-bone">{t('tg.m.weeks')}</span>{t('tg.m.weeksText')}</li>
            </ul>
            <div className="mt-4 flex gap-2.5 rounded-xl bg-coral/[0.06] px-4 py-3 text-[12.5px] text-bone/70 ring-1 ring-coral/15">
              <Info size={16} className="mt-0.5 shrink-0 text-coral" />
              <div><span className="text-bone">{t('tg.limits')}</span> {t('tg.limitsText')}</div>
            </div>
          </Card>
        </Stagger>
      </div>

      {entries.length > 0 && (
        <Stagger i={6} className="mt-4">
          <Card title={t('tg.latest')} kicker={t('tg.latestK', { n: entries.length })} pad={false}>
            <ul className="divide-y divide-white/[0.05] px-5 pb-3">
              {entries.slice(0, 15).map((e) => {
                const d = dossierOf(e.dossierId)
                return (
                  <li key={e.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-3 text-[13px] md:grid-cols-[90px_1fr_180px_repeat(3,72px)]">
                    <span className="num text-[12px] text-mist md:order-none">{dFull(e.at)}</span>
                    <span className="col-span-2 min-w-0 md:col-span-1">
                      <span className="text-bone">{e.kind in NAMES ? kn(e.kind) : e.label}</span>
                      {e.corrections > 0 && <Pill tone="red" className="ml-2">{e.corrections} {t('tg.corrShort')}</Pill>}
                      {e.demo && <Pill className="ml-2">{t('tg.demo')}</Pill>}
                    </span>
                    <span className="col-span-2 min-w-0 truncate md:col-span-1">
                      {d ? <Link to={`/app/dossiers/${d.id}`} className="inline-flex items-center gap-1 text-sea hover:underline">{d.seller}<ArrowSquareOut size={12} /></Link> : <span className="text-bone/35">{t('tg.noDossier')}</span>}
                    </span>
                    <span className="col-span-2 flex gap-4 md:contents">
                      <span className="num text-bone/60 md:text-right"><span className="text-mist md:hidden">{t('tg.refShort')} </span>{mins(e.baseline)}</span>
                      <span className="num text-bone/60 md:text-right"><span className="text-mist md:hidden">{t('tg.spentShort')} </span>{mins(e.spent)}</span>
                      <span className="num text-sage md:text-right"><span className="text-mist md:hidden">{t('tg.netShort')} </span>{mins(e.net)}</span>
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
  const { t, locale } = useT()
  const { nf1, hours, dShort } = fmts(locale)
  const max = Math.max(60, ...weeks.map((w) => w.baseline))
  const slot = W / weeks.length, bw = Math.min(26, slot / 3.2)
  const y = (v: number) => H - pb - (v / max) * (H - pb - pt)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={t('tg.chartAria')}>
        <line x1="0" x2={W} y1={H - pb} y2={H - pb} className="stroke-current text-bone/15" strokeWidth="1" />
        {weeks.map((w, i) => {
          const cx = slot * i + slot / 2
          return (
            <g key={w.end}>
              <rect x={cx - bw - 2} y={y(w.baseline)} width={bw} height={H - pb - y(w.baseline)} rx="3" className="fill-current text-bone/20"><title>{t('tg.chartRef', { h: hours(w.baseline) })}</title></rect>
              <rect x={cx + 2} y={y(w.spent)} width={bw} height={Math.max(1, H - pb - y(w.spent))} rx="3" className="fill-current text-champagne"><title>{t('tg.chartSpent', { h: hours(w.spent) })}</title></rect>
              <text x={cx} y={pt - 6} textAnchor="middle" className="num fill-current text-sage" fontSize="10.5">+{nf1.format(w.net / 60)} h</text>
              <text x={cx} y={H - pb + 15} textAnchor="middle" className="fill-current text-mist" fontSize="10">{dShort(w.start + DAY)}</text>
              <text x={cx} y={H - pb + 27} textAnchor="middle" className="fill-current text-mist" fontSize="9.5">{w.n} {t('tg.worksShort')}</text>
            </g>
          )
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-bone/60">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-bone/20" />{t('tg.m.ref')}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-champagne" />{t('tg.spentLegend')}</span>
        <span className="inline-flex items-center gap-1.5"><Timer size={13} className="text-sage" />{t('tg.th.net')}</span>
      </div>
    </div>
  )
}
