import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { Sparkle, ArrowRight, CheckCircle, Circle, Phone, PaperPlaneTilt, FileText, ArrowsClockwise, MapPin, Clock, Lightning, Warning, Trophy, BellRinging, ChatsCircle, Compass } from '@phosphor-icons/react'
import { Card, Stat, Stagger, SoftBtn, DELIV_TONE } from '../ui'
import { Avatar, Ring, Spark, EXPO } from '../../ui/kit'
import { prop, me, eur } from '../../data/mock'
import { NOW } from '../../data/ops'
import { useTasks, useActivity, useDossiers, useEvents, useQueue, useReminders, useConversations, useTimelog } from '../../data/collections'
import { openBrief } from '../BriefComposer'
import { isSimpleMode, readDay1, markDay1 } from '../../ui/mode'
import { useT } from '../../i18n'

/** Premier jour en 3 écrans : brief, débrief, temps gagné. Chaque étape se coche d’elle-même quand elle est faite. */
function FirstDay() {
  const [d1, setD1] = useState(readDay1)
  const { t } = useT()
  const [dossiers] = useDossiers()
  useEffect(() => { const o = () => setD1(readDay1()); window.addEventListener('nxt:day1', o); return () => window.removeEventListener('nxt:day1', o) }, [])
  if (!isSimpleMode() || d1.dismissed) return null
  const rdv = dossiers.find((d) => d.stage === 'rdv') ?? dossiers.find((d) => d.stage === 'prep')
  const steps = [
    { k: 'brief' as const, t: t('day1.brief'), s: t('day1.briefSub'), go: () => openBrief() },
    { k: 'debrief' as const, t: t('day1.debrief'), s: t('day1.debriefSub'), to: rdv ? `/app/dossiers/${rdv.id}` : '/app/dossiers' },
    { k: 'temps' as const, t: t('day1.temps'), s: t('day1.tempsSub'), to: '/app/temps' },
  ]
  const done = steps.filter((x) => d1[x.k]).length
  return (
    <div className="mt-4 rounded-2xl bg-champagne/[0.06] p-4 ring-1 ring-champagne/20">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px] font-medium">{t('day1.title', { done })}</div>
        <button onClick={() => markDay1('dismissed')} className="text-[11.5px] text-mist hover:text-bone">{t('common.hide')}</button>
      </div>
      <ol className="mt-3 space-y-2">
        {steps.map((x, i) => {
          const body = (
            <>
              <span className={clsx('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px]', d1[x.k] ? 'bg-sage/15 text-sage' : 'bg-white/[0.06] text-bone/70')}>{d1[x.k] ? <CheckCircle size={15} weight="fill" /> : <span className="num">{i + 1}</span>}</span>
              <span className="min-w-0 flex-1"><span className={clsx('block text-[13px]', d1[x.k] && 'text-bone/50 line-through')}>{x.t}</span><span className="block text-[11.5px] text-bone/55">{x.s}</span></span>
              <ArrowRight size={13} className="shrink-0 text-mist" />
            </>
          )
          const cls = 'flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.04]'
          return <li key={x.k}>{x.to ? <Link to={x.to} className={cls}>{body}</Link> : <button onClick={x.go} className={cls}>{body}</button>}</li>
        })}
      </ol>
    </div>
  )
}
import { action, useCollection } from '../../data/store'
import { startTour, type TutDoc } from '../tour/tours'
import { CH, rel, until } from '../messages/shared'

const KIND = { rdv: 'bg-champagne', visite: 'bg-sea', signature: 'bg-sage', interne: 'bg-mist', appel: 'bg-coral' } as const
const TASK_ICON = { valider: CheckCircle, appeler: Phone, envoyer: PaperPlaneTilt, relancer: ArrowsClockwise, document: FileText }

export default function Today() {
  const [tasks] = useTasks()
  const [ACTIVITY] = useActivity()
  const [DOSSIERS] = useDossiers()
  const [events] = useEvents()
  const [queue] = useQueue()
  const [busy, setBusy] = useState<string | null>(null)
  const [reminders] = useReminders()
  const [convs] = useConversations()
  const [tuts] = useCollection<TutDoc>('tutorials')
  const [timelog] = useTimelog()
  const { t, locale } = useT()
  const week = timelog.filter((e) => Date.now() - Date.parse(e.at) < 7 * 864e5)
  const weekNet = week.reduce((n, e) => n + e.net, 0), weekCorr = week.filter((e) => e.corrections > 0).length
  const todayStr = new Date().toDateString()
  const remToday = reminders.filter((r) => r.status === 'programmé' && new Date(r.dueAt).toDateString() === todayStr).sort((a, b) => a.dueAt.localeCompare(b.dueAt))
  const unread = convs.filter((c) => c.unread > 0 && c.status !== 'done').sort((a, b) => b.lastAt.localeCompare(a.lastAt))
  const unreadMsgs = unread.reduce((n, c) => n + c.unread, 0)
  // ponytail: « terminée » = doc tutorials `onboarding` / `tour-onboarding` (ou kind tour + tour: 'onboarding') marqué done.
  const onboarded = tuts.some((t) => (t.id === 'onboarding' || t.id === 'tour-onboarding' || t.tour === 'onboarding' || t.tourId === 'onboarding') && t.done)
  const dateLabel = new Date(2026, 9, NOW.day).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase())
  const TODAY = events.filter((e) => e.day === NOW.day).sort((a, b) => a.start.localeCompare(b.start)).map((e) => ({ ...e, time: e.start, ready: e.prep && Object.values(e.prep).every((v) => v >= 100) ? 100 : undefined }))
  const TASKS = [...tasks].sort((a, b) => Number(!!a.done) - Number(!!b.done))
  const done = tasks.filter((t) => t.done).map((t) => t.id)
  const toggle = async (id: string) => { setBusy(id); try { await action('task.toggle', { id }) } finally { setBusy(null) } }
  const mandats = DOSSIERS.filter((d) => d.mandate).length
  const now = NOW.h
  const toH = (t: string) => { const [h, m] = t.split(':').map(Number); return h + m / 60 }
  const review = DOSSIERS.flatMap((d) => Object.entries(d.deliverables).filter(([, s]) => s === 'review' || s === 'blocked').map(([c, s]) => ({ d, c, s })))

  return (
    <div className="space-y-6">
      {/* Salut + brief */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 [&>*]:min-w-0">
        <Stagger className="lg:col-span-7">
          <div className="text-[11px] uppercase tracking-eyebrow text-mist">{dateLabel} · {NOW.label} · Antibes 19°</div>
          <h1 className="display mt-2 text-5xl md:text-6xl">{t('today.hello', { name: me.name.split(' ')[0] })}<span className="text-champagne">.</span></h1>
          <div className="relative mt-6 overflow-hidden rounded-[1.6rem] p-px">
            <div className="absolute inset-0 rounded-[1.6rem] bg-[conic-gradient(from_180deg_at_50%_50%,rgb(var(--acc-500)_/_.5),rgb(var(--acc-500)_/_.05),rgb(var(--sea)_/_.35),rgb(var(--acc-500)_/_.05),rgb(var(--acc-500)_/_.5))]" />
            <div className="relative rounded-[calc(1.6rem-1px)] bg-ink-800 p-6">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[12px] text-champagne-300"><Sparkle size={14} weight="fill" /> {t('today.briefBy', { time: '07:30' })}</span>
                <span className="text-[11px] text-mist">{t('today.briefSources')}</span>
              </div>
              <p className="mt-4 text-[17px] leading-relaxed text-bone/90 md:text-lg">
                {t('today.brief1')} <span className="text-champagne-300">{t('today.pending', { n: queue.length })}</span>{t('today.brief2')} <span className="text-sage">{t('today.ready100')}</span>.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to="/app/studio"><SoftBtn tone="gold" icon={<CheckCircle size={14} />}>{t('today.validateAll')}</SoftBtn></Link>
                <Link to="/app/dossiers/d5"><SoftBtn icon={<FileText size={14} />}>{t('today.openBrief11')}</SoftBtn></Link>
                <SoftBtn icon={<Lightning size={14} />} onClick={openBrief}>{t('day1.brief')}</SoftBtn>
              </div>
            </div>
          </div>
          {!onboarded && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-sea/[0.07] p-3 pr-4 ring-1 ring-sea/20">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sea/15 text-sea"><Compass size={17} weight="light" /></span>
              <div className="min-w-0 flex-1"><div className="text-[13px] font-medium">{t('today.onboard')}</div><div className="text-[11.5px] text-bone/55">{t('today.onboardSub')}</div></div>
              <SoftBtn icon={<ArrowRight size={14} />} onClick={() => startTour('onboarding')}>{t('today.startTour')}</SoftBtn>
            </div>
          )}
          <FirstDay />
          <Link to="/app/temps" className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-sage/[0.07] p-3 pr-4 ring-1 ring-sage/20 transition hover:bg-sage/[0.1]">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage/15 text-sage"><Clock size={17} weight="light" /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium"><span className="num">{Math.floor(weekNet / 60)} h {String(Math.round(weekNet % 60)).padStart(2, '0')}</span> {t('today.gained7')}</div>
              <div className="text-[11.5px] text-bone/55">{t('today.works', { n: week.length })} · {t('today.corrected', { n: weekCorr })} · {t('today.method')}</div>
            </div>
            <ArrowRight size={14} className="text-mist" />
          </Link>
        </Stagger>
        <Stagger i={1} className="grid min-w-0 grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:col-span-5">
          <Stat label={t('today.kpiCa')} value="168 k€" delta="+22 %" hint={t('today.kpiCaHint')}><Ring value={70} size={46}><span className="num text-[10px]">70%</span></Ring></Stat>
          <Stat label={t('today.kpiMandates')} value={String(mandats)} delta="+3" hint={t('today.kpiExclusive', { n: DOSSIERS.filter((d) => d.mandate === 'Exclusif').length })}><Spark data={[8, 9, 9, 11, 12, 12, 14]} w={70} h={30} /></Stat>
          <Stat label={t('today.kpiTime')} value="7 h 40" hint={t('today.kpiTimeHint')} />
          <Stat label={t('today.kpiConv')} value="38 %" delta="+5 pts" hint={t('today.kpiConvHint')} />
        </Stagger>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 [&>*]:min-w-0">
        {/* Agenda timeline */}
        <Stagger i={2} className="lg:col-span-5">
          <Card title={t('today.agenda')} kicker={t('today.events', { n: TODAY.length })} action={<Link to="/app/agenda" className="text-[12px] text-mist hover:text-bone">{t('today.week')}</Link>} className="h-full">
            <div className="relative">
              {TODAY.map((e, i) => {
                const past = toH(e.end) < now, live = toH(e.time) <= now && toH(e.end) >= now
                const marker = toH(e.time) > now && (i === 0 || toH(TODAY[i - 1].time) <= now)
                return (
                  <div key={e.time}>
                  {marker && <div className="-mt-1 mb-3 flex items-center gap-2 pl-[4.4rem]"><span className="h-2 w-2 rounded-full bg-coral" /><span className="h-px flex-1 bg-coral/50" /><span className="num text-[10px] text-coral">{NOW.label}</span></div>}
                  <div className={`relative flex gap-4 pb-4 ${past ? 'opacity-45' : ''}`}>
                    <div className="w-12 shrink-0 pt-0.5 text-right"><div className="num text-[13px]">{e.time}</div><div className="num text-[10.5px] text-mist">{e.end}</div></div>
                    <div className="relative flex flex-col items-center">
                      <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${KIND[e.kind]} ${live ? 'ring-4 ring-champagne/25' : ''}`} />
                      <span className="mt-1 w-px flex-1 bg-white/[0.08]" />
                    </div>
                    <div className={`min-w-0 flex-1 rounded-2xl p-3 ${e.ready ? 'bg-champagne/[0.07] ring-1 ring-champagne/20' : 'bg-white/[0.02] ring-1 ring-white/[0.05]'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0"><div className="truncate text-[13.5px] font-medium">{e.title}</div><div className="truncate text-[12px] text-bone/50">{e.who}</div></div>
                        {e.ready && <span className="shrink-0 rounded-full bg-sage/15 px-2 py-0.5 text-[10.5px] text-sage ring-1 ring-sage/25">{t('today.ready100short')}</span>}
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-mist"><span className="flex items-center gap-1"><MapPin size={11} />{e.place}</span>{e.dossier && <Link to={`/app/dossiers/${e.dossier}`} className="text-champagne-300 hover:underline">{t('today.dossierLink')}</Link>}</div>
                    </div>
                  </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </Stagger>

        {/* Priorités */}
        <Stagger i={3} className="lg:col-span-7">
          <Card title={t('today.priorities')} kicker={t('today.remaining', { n: TASKS.length - done.length })} action={<Link to="/app/taches" className="text-[12px] text-mist hover:text-bone">{t('today.seeAll')}</Link>} className="h-full">
            <div className="space-y-1.5">
              {TASKS.map((tk) => {
                const Ic = TASK_ICON[tk.kind], ok = done.includes(tk.id)
                const d = DOSSIERS.find((x) => x.id === tk.dossier)
                return (
                  <motion.div layout key={tk.id} className={`group flex items-center gap-3 rounded-2xl p-3 ring-1 transition-colors duration-300 ${ok ? 'bg-transparent ring-transparent' : 'bg-white/[0.02] ring-white/[0.05] hover:bg-white/[0.04]'}`}>
                    <button disabled={busy === tk.id} onClick={() => toggle(tk.id)} aria-label={ok ? t('common.reopen') : t('common.finish')} className="shrink-0 text-bone/40 transition hover:text-champagne">
                      {ok ? <CheckCircle size={22} weight="fill" className="text-sage" /> : <Circle size={22} weight="light" />}
                    </button>
                    {d && <img src={prop(d.propertyId).photo} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />}
                    <div className="min-w-0 flex-1">
                      <div className={`text-[13.5px] ${ok ? 'text-bone/35 line-through' : ''}`}>{tk.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-mist">
                        <Ic size={11} />{d?.seller}{tk.ai && <span className="flex items-center gap-1 text-champagne-300"><Sparkle size={10} weight="fill" />{t('today.byCopilot')}</span>}
                      </div>
                    </div>
                    <span className={`num shrink-0 text-[11.5px] ${tk.prio === 'haute' ? 'text-coral' : 'text-mist'}`}><Clock size={11} className="mr-1 inline" />{tk.due}</span>
                    <ArrowRight size={14} className="shrink-0 text-mist opacity-0 transition group-hover:opacity-100" />
                  </motion.div>
                )
              })}
            </div>
          </Card>
        </Stagger>
      </div>

      {/* Rappels WhatsApp du jour & conversations non lues */}
      <Stagger i={4}>
        <Card title={t('today.reminders')} kicker={`${t('today.remToday', { n: remToday.length })} · ${t('today.unreadConv', { n: unread.length })}`} action={<Link to="/app/messages" className="text-[12px] text-mist hover:text-bone">{t('today.messagesLink')}</Link>}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-eyebrow text-mist"><BellRinging size={13} weight="light" />{t('today.upcomingRem')}</span><Link to="/app/messages?tab=rappels" className="text-[11.5px] text-mist hover:text-bone">{t('today.all')}</Link></div>
              {remToday.length ? (
                <div className="space-y-1.5">
                  {remToday.slice(0, 4).map((r) => (
                    <Link key={r.id} to={r.conversationId ? `/app/messages?c=${r.conversationId}` : '/app/messages?tab=rappels'} className="flex items-center gap-3 rounded-2xl bg-white/[0.02] p-3 ring-1 ring-white/[0.05] transition hover:bg-white/[0.04]">
                      <div className="w-12 shrink-0 text-right"><div className="num text-[13px]">{new Date(r.dueAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</div><div className="num text-[10px] text-mist">{r.rule}</div></div>
                      <div className="min-w-0 flex-1"><div className="truncate text-[13px]">{r.target}</div><div className="truncate text-[11.5px] text-bone/50">{r.text}</div></div>
                      <span className="num shrink-0 rounded-full bg-sea/10 px-2 py-0.5 text-[10.5px] text-sea ring-1 ring-sea/25">{until(r.dueAt)}</span>
                    </Link>
                  ))}
                  {remToday.length > 4 && <div className="pl-3 text-[11px] text-mist">{t('today.moreToday', { n: remToday.length - 4 })}</div>}
                </div>
              ) : <div className="rounded-2xl border border-dashed border-white/10 p-4 text-[12px] text-mist">{t('today.noRem')}</div>}
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between"><span className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-eyebrow text-mist"><ChatsCircle size={13} weight="light" />{t('today.unreadTitle')}</span><span className="num text-[11px] text-mist">{t('today.msgs', { n: unreadMsgs })}</span></div>
              {unread.length ? (
                <div className="space-y-1.5">
                  {unread.slice(0, 4).map((c) => {
                    const ch = CH[c.channel], Ic = ch.icon
                    return (
                      <Link key={c.id} to={`/app/messages?c=${c.id}`} className="flex items-center gap-3 rounded-2xl bg-white/[0.02] p-3 ring-1 ring-white/[0.05] transition hover:bg-white/[0.04]">
                        {c.avatar ? <Avatar src={c.avatar} size={34} /> : <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-bone/60"><Ic size={15} weight="light" /></span>}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[13px]"><span className="truncate">{c.kind === 'channel' ? `#${c.title}` : c.title}</span><Ic size={12} weight="light" className={`shrink-0 ${ch.text}`} /></div>
                          <div className="truncate text-[11.5px] text-bone/50">{c.lastText}</div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1"><span className="num text-[10.5px] text-mist">{rel(c.lastAt)}</span><span className="num flex h-5 min-w-5 items-center justify-center rounded-full bg-champagne px-1.5 text-[10.5px] text-ink">{c.unread}</span></div>
                      </Link>
                    )
                  })}
                  {unread.length > 4 && <div className="pl-3 text-[11px] text-mist">{t('today.moreConv', { n: unread.length - 4 })}</div>}
                </div>
              ) : <div className="rounded-2xl border border-dashed border-white/10 p-4 text-[12px] text-mist">{t('today.inboxZero')}</div>}
            </div>
          </div>
        </Card>
      </Stagger>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 [&>*]:min-w-0">
        {/* Livrables à valider */}
        <Stagger i={5} className="lg:col-span-8">
          <Card title={t('today.delivWaiting')} kicker={t('today.validationCenter')} action={<Link to="/app/studio" className="text-[12px] text-mist hover:text-bone">{t('today.studioLink')}</Link>}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {review.slice(0, 6).map(({ d, c, s }, i) => (
                <motion.div key={d.id + c} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05, ease: EXPO, duration: 0.6 }}>
                  <Link to={`/app/dossiers/${d.id}`} className="group block overflow-hidden rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.06] transition hover:ring-champagne/30">
                    <div className="relative h-24 overflow-hidden"><img src={prop(d.propertyId).photo} alt="" className="h-full w-full object-cover transition-transform duration-700 ease-silk group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-ink-800 to-transparent" /><span className="num absolute left-3 top-3 rounded-full bg-ink/70 px-2 py-0.5 text-[11px] backdrop-blur">{c}</span></div>
                    <div className="p-3"><div className="truncate text-[13px]">{d.seller}</div><div className="mt-1.5 flex items-center justify-between"><span className={`rounded-full px-2 py-0.5 text-[10.5px] ring-1 ${DELIV_TONE[s as 'review'].c}`}>{t(`deliv.${s as 'review'}` as const)}</span><span className="text-[11px] text-mist">{eur(prop(d.propertyId).price)}</span></div></div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </Card>
        </Stagger>

        {/* Fil d'activité */}
        <Stagger i={6} className="lg:col-span-4">
          <Card title={t('today.feed')} kicker={t('today.live')} className="h-full">
            <div className="space-y-3.5">
              {ACTIVITY.map((a, i) => {
                const Ic = a.tone === 'ai' ? Sparkle : a.tone === 'win' ? Trophy : a.tone === 'warn' ? Warning : Lightning
                const c = a.tone === 'ai' ? 'text-champagne-300 bg-champagne/10' : a.tone === 'win' ? 'text-sage bg-sage/10' : a.tone === 'warn' ? 'text-coral bg-coral/10' : 'text-bone/60 bg-white/5'
                return (
                  <div key={i} className="flex gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${c}`}><Ic size={14} weight="fill" /></span>
                    <div className="min-w-0"><div className="text-[12.5px] leading-snug"><span className="font-medium">{a.who}</span> <span className="text-bone/60">{a.what}</span></div><div className="num mt-0.5 text-[10.5px] text-mist">{a.t}</div></div>
                  </div>
                )
              })}
            </div>
            <div className="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4 text-[11.5px] text-mist"><div className="flex -space-x-2">{['p-sofia', 'p-marc', 'p-paul'].map((p) => <Avatar key={p} src={`/img/${p}.webp`} size={22} />)}</div>{t('today.online', { n: 3 })}</div>
          </Card>
        </Stagger>
      </div>
    </div>
  )
}
