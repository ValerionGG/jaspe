import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useRef, useState, type DragEvent } from 'react'
import clsx from 'clsx'
import { CaretLeft, CaretRight, Plus, GoogleLogo, MicrosoftOutlookLogo, Warning, MapPin, Car, Clock, Sparkle, CheckCircle, Circle, ArrowsClockwise, UsersThree, ArrowRight, CalendarDots, PencilSimple, Trash, DotsSixVertical, BellRinging, X, ChatCircleText } from '@phosphor-icons/react'
import { PageHeader, Card, Tabs, SoftBtn, Stagger, IconBtn } from '../ui'
import { Ring, EXPO } from '../../ui/kit'
import { prop, type Dossier } from '../../data/mock'
import { KINDS, NOW, type CalEvent, type Kind, type Prep } from '../../data/ops'
import { useEvents, useDossiers, useReminders } from '../../data/collections'
import type { Reminder } from '../../data/messaging'
import { action, type Doc } from '../../data/store'
import { Modal, Field, Input, Select, AsyncForm, toast, errText } from '../forms'

type Ev = CalEvent & Doc & { okWith?: string[] }

const H0 = 8, H1 = 20, HPX = 56
const WD = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const WD_LONG = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const toH = (t: string) => { const [h, m] = t.split(':').map(Number); return h + m / 60 }
const hhmm = (h: number) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`
// `day` = jour compté depuis le 1er octobre 2026 (0 = 30 sept., 32 = 1er nov.) : vrai calendrier via Date, toutes semaines et tous mois.
const dt = (d: number) => new Date(2026, 9, d)
const toDay = (x: Date) => Math.round((new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime() - dt(0).getTime()) / 864e5)
const wd = (d: number) => (dt(d).getDay() + 6) % 7
const lab = (d: number) => ({ n: dt(d).getDate(), m: dt(d).toLocaleDateString('fr-FR', { month: 'short' }) })
const weekOf = (d: number) => d - wd(d)
const isoWeek = (d: number) => { const t = dt(weekOf(d) + 3); return Math.floor(Math.round((t.getTime() - new Date(t.getFullYear(), 0, 1).getTime()) / 864e5) / 7) + 1 }
const monthOf = (d: number) => { const x = dt(d), first = d - x.getDate() + 1, n = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate(); return { first, n, m: x.getMonth(), label: x.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) } }
const monthCells = (d: number) => { const { first, n } = monthOf(d); return Array.from({ length: Math.ceil((wd(first) + n) / 7) * 7 }, (_, i) => weekOf(first) + i) }
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const dayToIso = (d: number) => { const x = dt(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}` }
const isoToDay = (s: string) => toDay(new Date(`${s}T00:00`))

const DEFAULT_CHECK: Record<Kind, string[]> = {
  rdv: ['Brief relationnel relu (D1)', 'Comparables DVF imprimés (D2)', 'Radar quartier & PLU (D3)', 'Mandat pré-rempli', 'Simulation des objections (D4)'],
  visite: ['Bon de visite prêt à signer', 'Clés récupérées', 'Fiche acquéreur relue', 'Consentement de contact vérifié'],
  signature: ['Pièces d’identité vérifiées', 'Offre en deux exemplaires', 'Justificatif de financement'],
  appel: ['Ordre du jour envoyé', 'Dossier ouvert à l’écran'],
  interne: ['Ordre du jour partagé'],
}

/** Répartit les événements qui se chevauchent en colonnes. */
function lanes(evs: Ev[]) {
  const out: { e: Ev; lane: number; n: number }[] = []
  let cluster: typeof out = [], ends: number[] = [], end = -1
  const flush = () => { cluster.forEach((c) => (c.n = ends.length)); out.push(...cluster); cluster = []; ends = [] }
  for (const e of [...evs].sort((a, b) => toH(a.start) - toH(b.start))) {
    const s = toH(e.start), f = toH(e.end)
    if (s >= end) flush()
    let l = ends.findIndex((x) => x <= s)
    if (l < 0) { l = ends.length; ends.push(f) } else ends[l] = f
    cluster.push({ e, lane: l, n: 0 }); end = Math.max(end, f)
  }
  flush()
  return out
}

const avg = (p: Prep) => Math.round((p.D1 + p.D2 + p.D3 + p.D4) / 4)
const overlaps = (a: Ev, b: Ev) => a.id !== b.id && a.day === b.day && toH(a.start) < toH(b.end) && toH(b.start) < toH(a.end) && !a.okWith?.includes(b.id) && !b.okWith?.includes(a.id)
const checkList = (e: Ev) => e.checklist ?? DEFAULT_CHECK[e.kind].map((t) => ({ t, ok: false }))

export default function Agenda() {
  const [raw, ops] = useEvents()
  const events = raw as Ev[]
  const [dossiers] = useDossiers()
  const [reminders] = useReminders()
  const remSet = new Set(reminders.filter((r) => r.status === 'programmé' && r.eventId).map((r) => r.eventId as string))
  const [view, setView] = useState<'jour' | 'semaine' | 'mois'>(() => (window.innerWidth < 768 ? 'jour' : 'semaine'))
  const [day, setDay] = useState(NOW.day)
  const [sel, setSel] = useState('e22')
  const [hidden, setHidden] = useState<Kind[]>([])
  const [preparing, setPreparing] = useState<{ id: string; code: string } | null>(null)
  const [editing, setEditing] = useState<Ev | 'new' | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const grab = useRef(0)

  const run = async (f: () => Promise<unknown>, ok: string) => { try { await f(); toast(ok) } catch (x) { toast(errText(x), 'error') } }
  const conflictsOf = (e: Ev) => events.filter((x) => overlaps(e, x))

  const week = weekOf(day)
  const days = view === 'jour' ? [day] : Array.from({ length: 7 }, (_, i) => week + i)
  const visible = events.filter((e) => !hidden.includes(e.kind))
  const ev = events.find((e) => e.id === sel) ?? events.find((e) => e.day === NOW.day) ?? events[0]
  const weekEvents = events.filter((e) => weekOf(e.day) === week)
  const conflicts = weekEvents.filter((e) => conflictsOf(e).length).sort((a, b) => a.day - b.day || toH(a.start) - toH(b.start))
  const field = weekEvents.filter((e) => e.kind === 'visite' || e.kind === 'rdv' || e.kind === 'signature').reduce((s, e) => s + toH(e.end) - toH(e.start), 0)

  const pick = (e: Ev) => { setSel(e.id); setDay(e.day) }
  const shift = (n: number) => setDay((d) => view === 'mois' ? toDay(new Date(dt(d).getFullYear(), dt(d).getMonth() + n, 1)) : d + n * (view === 'jour' ? 1 : 7))

  const move = (id: string, d: number, startH?: number) => {
    const e = events.find((x) => x.id === id)
    if (!e) return
    const dur = toH(e.end) - toH(e.start)
    const s = startH === undefined ? toH(e.start) : Math.min(H1 - dur, Math.max(H0, Math.round(startH * 4) / 4))
    if (e.day === d && hhmm(s) === e.start) return
    const patch = { day: d, start: hhmm(s), end: hhmm(s + dur) }
    run(() => ops.update(id, patch), `${e.title} → ${WD_LONG[wd(d)].toLowerCase()} ${lab(d).n} ${lab(d).m} · ${patch.start}`)
    setSel(id)
  }
  const dropOnColumn = (x: DragEvent<HTMLDivElement>, d: number) => {
    x.preventDefault(); setOver(null)
    const id = x.dataTransfer.getData('text/plain')
    const r = x.currentTarget.getBoundingClientRect()
    move(id, d, H0 + (x.clientY - r.top - grab.current) / HPX)
  }

  const prepare = async (e: Ev) => {
    if (!e.dossier) return
    try {
      for (const code of ['D1', 'D2', 'D3']) { setPreparing({ id: e.id, code }); await action('deliverable.generate', { dossierId: e.dossier, code }) }
      await ops.update(e.id, { prep: { D1: 100, D2: 100, D3: 100, D4: e.prep?.D4 ?? 0 } })
      toast('D1, D2 et D3 générés · à relire dans Tâches & validations')
    } catch (x) { toast(errText(x), 'error') } finally { setPreparing(null) }
  }
  const resolve = (e: Ev) => {
    const other = conflictsOf(e)[0]
    if (!other) return
    const [anchor, mover] = toH(e.start) >= toH(other.start) ? [other, e] : [e, other]
    const dur = toH(mover.end) - toH(mover.start), s = toH(anchor.end)
    if (s + dur > H1) return toast('Pas de créneau libre après 20:00 — modifiez l’événement à la main', 'error')
    run(() => ops.update(mover.id, { start: hhmm(s), end: hhmm(s + dur) }), `« ${mover.title} » décalé à ${hhmm(s)}${mover.source !== 'nxt' ? ' · mise à jour consignée pour la synchro' : ''}`)
  }
  const ignore = (e: Ev) => { const other = conflictsOf(e)[0]; if (other) run(() => ops.update(e.id, { okWith: [...(e.okWith ?? []), other.id] }), 'Chevauchement accepté') }
  const remove = (e: Ev) => { setSel(''); run(() => ops.remove(e.id), `« ${e.title} » supprimé`) }

  const title = view === 'mois' ? cap(monthOf(day).label) : view === 'jour' ? `${WD_LONG[wd(day)]} ${lab(day).n} ${lab(day).m}` : `${lab(days[0]).n} ${lab(days[0]).m} – ${lab(days[6]).n} ${lab(days[6]).m}`
  const bySource = (s: CalEvent['source']) => events.filter((e) => e.source === s).length

  return (
    <div>
      <PageHeader
        kicker={`Agenda · semaine ${isoWeek(day)}`}
        title={<>Le temps, <span className="italic text-champagne-300">orchestré</span></>}
        sub="Rendez-vous, visites et signatures au même endroit. Chaque rendez-vous vendeur arrive préparé, trajet compris. Glissez un événement pour le déplacer."
        actions={<>
          <SoftBtn icon={<ArrowsClockwise size={14} weight="light" />} onClick={() => toast('Synchronisation consignée — connecteurs Google et Outlook non configurés', 'info')}>Synchroniser</SoftBtn>
          <SoftBtn tone="gold" icon={<Plus size={14} weight="light" />} onClick={() => setEditing('new')}>Nouvel événement</SoftBtn>
        </>}
      />

      {/* Barre d'état : sources, conflits, charge */}
      <Stagger className="mb-5 flex flex-wrap items-center gap-2">
        {[{ I: GoogleLogo, l: 'Google Agenda', n: bySource('google') }, { I: MicrosoftOutlookLogo, l: 'Outlook · Étude', n: bySource('outlook') }, { I: Sparkle, l: 'NXT', n: bySource('nxt') }].map(({ I, l, n }) => (
          <span key={l} className="flex items-center gap-2 rounded-full bg-white/[0.03] px-3 py-1.5 text-[12px] ring-1 ring-white/[0.06]">
            <I size={14} weight="light" className="text-bone/70" />{l}<span className="num text-mist">{n}</span>
          </span>
        ))}
        <span className="text-[11px] text-mist">Synchro externe : connecteur non configuré</span>
        <AnimatePresence>
          {conflicts.length > 0 && (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} onClick={() => pick(conflicts[0])} className="flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1.5 text-[12px] text-coral ring-1 ring-coral/25 transition hover:bg-coral/15">
              <Warning size={14} weight="light" />{Math.ceil(conflicts.length / 2)} conflit{conflicts.length > 2 ? 's' : ''} · {WD_LONG[wd(conflicts[0].day)].toLowerCase()} {conflicts[1]?.start ?? conflicts[0].start}
            </motion.button>
          )}
        </AnimatePresence>
        <span className="ml-auto hidden text-[12px] text-mist md:block">
          <span className="num text-bone">{weekEvents.length}</span> événements · <span className="num text-bone">{field.toFixed(1).replace('.', ',')} h</span> de terrain · <span className="num text-bone">{weekEvents.filter((e) => e.kind === 'visite').length}</span> visites
        </span>
      </Stagger>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Calendrier principal */}
        <Stagger i={1} className="min-w-0">
          <Card pad={false}>
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-2">
                <IconBtn label="Précédent" onClick={() => shift(-1)}><CaretLeft size={15} weight="light" /></IconBtn>
                <IconBtn label="Suivant" onClick={() => shift(1)}><CaretRight size={15} weight="light" /></IconBtn>
                <h2 className="display ml-2 text-[1.7rem]">{title}</h2>
                {day !== NOW.day && <button onClick={() => setDay(NOW.day)} className="ml-1 rounded-full px-2.5 py-1 text-[11.5px] text-champagne-300 ring-1 ring-champagne/25 hover:bg-champagne/10">Aujourd’hui</button>}
              </div>
              <Tabs id="agenda-view" value={view} onChange={setView} items={[{ id: 'jour', label: 'Jour' }, { id: 'semaine', label: 'Semaine' }, { id: 'mois', label: 'Mois' }]} />
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={view + (view === 'mois' ? '' : days[0])} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease: EXPO }}>
                {view === 'mois' ? (
                  <Month day={day} events={visible} rem={remSet} sel={sel} onDay={(d) => { setDay(d); setView('jour') }} onPick={pick} onMove={(id, d) => move(id, d)} />
                ) : (
                  <div className="thin-scroll overflow-x-auto">
                    <div className={clsx(view === 'semaine' && 'min-w-[680px]')}>
                      <div className="grid border-y border-white/[0.06]" style={{ gridTemplateColumns: `52px repeat(${days.length}, minmax(0,1fr))` }}>
                        <div />
                        {days.map((d) => {
                          const today = d === NOW.day, n = visible.filter((e) => e.day === d).length
                          return (
                            <button key={d} onClick={() => { setDay(d); setView('jour') }} className="group flex items-center justify-center gap-2 border-l border-white/[0.04] py-2.5 text-left">
                              <span className={clsx('text-[11px] uppercase tracking-eyebrow', today ? 'text-champagne-300' : 'text-mist')}>{WD[wd(d)]}</span>
                              <span className={clsx('num flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-[13px] transition', today ? 'bg-champagne text-ink' : 'text-bone group-hover:bg-white/[0.06]')}>{lab(d).n}</span>
                              {n > 0 && <span className="num text-[10px] text-mist">{n}</span>}
                            </button>
                          )
                        })}
                      </div>
                      <div className="relative grid" style={{ gridTemplateColumns: `52px repeat(${days.length}, minmax(0,1fr))`, height: (H1 - H0) * HPX }}>
                        <div className="relative">
                          {Array.from({ length: H1 - H0 }, (_, i) => <span key={i} className="num absolute right-2 -translate-y-1/2 text-[10px] text-mist-600" style={{ top: i * HPX }}>{i ? `${H0 + i}:00` : ''}</span>)}
                        </div>
                        {days.map((d) => (
                          <div key={d} onDragOver={(x) => { x.preventDefault(); setOver(d) }} onDragLeave={() => setOver(null)} onDrop={(x) => dropOnColumn(x, d)}
                            className={clsx('relative border-l border-white/[0.04] transition-colors', over === d ? 'bg-champagne/[0.05]' : d === NOW.day ? 'bg-champagne/[0.018]' : wd(d) > 4 && 'bg-white/[0.01]')}>
                            {Array.from({ length: H1 - H0 }, (_, i) => <div key={i} className="pointer-events-none absolute inset-x-0 border-t border-white/[0.045]" style={{ top: i * HPX }}><div className="border-t border-dashed border-white/[0.02]" style={{ marginTop: HPX / 2 }} /></div>)}
                            {lanes(visible.filter((e) => e.day === d)).map(({ e, lane, n }) => (
                              <EventBlock key={e.id} e={e} lane={lane} n={n} wide={view === 'jour'} active={sel === e.id} reminded={remSet.has(e.id)} ready={e.prep ? avg(e.prep) : undefined} conflict={conflictsOf(e).length > 0}
                                onClick={() => pick(e)} onGrab={(y) => (grab.current = y)} />
                            ))}
                            {d === NOW.day && (
                              <div className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top: (NOW.h - H0) * HPX }}>
                                <span className="-ml-1 h-2 w-2 rounded-full bg-coral shadow-[0_0_0_4px_rgb(var(--coral)_/_.18)]" /><span className="h-px flex-1 bg-coral/70" />
                              </div>
                            )}
                          </div>
                        ))}
                        {days.includes(NOW.day) && <span className="num pointer-events-none absolute left-1 z-20 -translate-y-1/2 rounded bg-coral px-1 text-[9.5px] text-ink" style={{ top: (NOW.h - H0) * HPX }}>{NOW.label}</span>}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] p-4">
              <span className="mr-1 text-[10.5px] uppercase tracking-eyebrow text-mist">Afficher</span>
              {(Object.keys(KINDS) as Kind[]).map((k) => {
                const off = hidden.includes(k)
                return (
                  <button key={k} onClick={() => setHidden(off ? hidden.filter((x) => x !== k) : [...hidden, k])} className={clsx('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] ring-1 transition', off ? 'text-bone/35 ring-white/[0.05]' : 'bg-white/[0.04] text-bone/85 ring-white/[0.08]')}>
                    <span className={clsx('h-2 w-2 rounded-full', KINDS[k].dot, off && 'opacity-30')} />{KINDS[k].label}
                  </button>
                )
              })}
              <span className="ml-auto flex items-center gap-3 text-[11px] text-mist"><span className="flex items-center gap-1"><GoogleLogo size={11} /> Google</span><span className="flex items-center gap-1"><MicrosoftOutlookLogo size={11} /> Outlook</span><span className="flex items-center gap-1"><Sparkle size={11} /> NXT</span></span>
            </div>
          </Card>
        </Stagger>

        {/* Colonne latérale */}
        <div className="space-y-6">
          <Stagger i={2}><MiniCal day={day} week={week} events={events} onPick={(d) => setDay(d)} onShift={(n) => setDay(toDay(new Date(dt(day).getFullYear(), dt(day).getMonth() + n, 1)))} /></Stagger>
          <Stagger i={3}>
            <Card pad={false}>
              <AnimatePresence mode="wait">
                {ev ? (
                  <motion.div key={ev.id} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.45, ease: EXPO }}>
                    <EventPanel
                      e={ev} d={dossiers.find((x) => x.id === ev.dossier)} reminders={reminders.filter((r) => r.eventId === ev.id)} conflict={conflictsOf(ev)[0]} preparing={preparing?.id === ev.id ? preparing.code : null}
                      onCheck={(i) => { const l = checkList(ev); run(() => ops.update(ev.id, { checklist: l.map((c, j) => (j === i ? { ...c, ok: !c.ok } : c)) }), l[i].ok ? 'Point décoché' : 'Point coché') }}
                      onPrepare={() => prepare(ev)} onResolve={() => resolve(ev)} onIgnore={() => ignore(ev)} onEdit={() => setEditing(ev)} onDelete={() => remove(ev)}
                    />
                  </motion.div>
                ) : <div className="p-8 text-center text-[13px] text-mist">Aucun événement sélectionné.</div>}
              </AnimatePresence>
            </Card>
          </Stagger>
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} kicker="Agenda" title={editing === 'new' ? <>Nouvel <span className="italic text-champagne-300">événement</span></> : <>Modifier l’<span className="italic text-champagne-300">événement</span></>}>
        {editing && <EventForm key={editing === 'new' ? 'new' : editing.id} e={editing === 'new' ? undefined : editing} day={day} dossiers={dossiers} onCancel={() => setEditing(null)}
          onSave={async (patch) => {
            if (editing === 'new') { const c = await ops.create({ ...patch, source: 'nxt' }); setSel(c.id) } else await ops.update(editing.id, patch)
            setDay(patch.day); setEditing(null)
          }} />}
      </Modal>
    </div>
  )
}

function EventForm({ e, day, dossiers, onSave, onCancel }: { e?: Ev; day: number; dossiers: Dossier[]; onSave: (p: Omit<CalEvent, 'id' | 'source'>) => Promise<void>; onCancel: () => void }) {
  return (
    <AsyncForm submitLabel={e ? 'Enregistrer' : 'Créer l’événement'} success={e ? 'Événement mis à jour' : 'Événement créé'} onCancel={onCancel} onSubmit={async (v) => {
      if (!v.title.trim()) throw new Error('Titre requis')
      if (!v.date) throw new Error('Jour requis')
      if (v.end <= v.start) throw new Error('L’heure de fin doit suivre l’heure de début')
      if (toH(v.start) < H0 || toH(v.end) > H1) throw new Error('Plage horaire de l’agenda : 08:00 – 20:00')
      const d = isoToDay(v.date)
      await onSave({ title: v.title.trim(), kind: v.kind as Kind, day: d, start: v.start, end: v.end, place: v.place.trim() || '—', who: v.who.trim() || '—', dossier: v.dossier } as Omit<CalEvent, 'id' | 'source'>)
    }}>
      <Field label="Titre"><Input name="title" required defaultValue={e?.title} placeholder="RDV estimation — Villa Les Combes" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type"><Select name="kind" defaultValue={e?.kind ?? 'rdv'}>{(Object.keys(KINDS) as Kind[]).map((k) => <option key={k} value={k}>{KINDS[k].label}</option>)}</Select></Field>
        <Field label="Jour"><Input name="date" type="date" required defaultValue={dayToIso(e?.day ?? day)} /></Field>
        <Field label="Début"><Input name="start" type="time" required step={900} min="08:00" max="20:00" defaultValue={e?.start ?? '10:00'} /></Field>
        <Field label="Fin"><Input name="end" type="time" required step={900} min="08:00" max="20:00" defaultValue={e?.end ?? '11:00'} /></Field>
      </div>
      <Field label="Lieu"><Input name="place" defaultValue={e?.place} placeholder="41 route de Grasse · ou Visio / Téléphone" /></Field>
      <Field label="Participant(s)"><Input name="who" defaultValue={e?.who} placeholder="Famille Costa" /></Field>
      <Field label="Dossier lié" hint="Un dossier lié permet la préparation D1–D3 par le copilote."><Select name="dossier" defaultValue={e?.dossier ?? ''}>
        <option value="">Aucun</option>{dossiers.map((d) => <option key={d.id} value={d.id}>{d.seller} · {d.ref}</option>)}
      </Select></Field>
    </AsyncForm>
  )
}

function EventBlock({ e, lane, n, wide, active, reminded, ready, conflict, onClick, onGrab }: { e: Ev; lane: number; n: number; wide: boolean; active: boolean; reminded: boolean; ready?: number; conflict: boolean; onClick: () => void; onGrab: (y: number) => void }) {
  const s = toH(e.start), f = toH(e.end), h = (f - s) * HPX
  const k = KINDS[e.kind]
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: EXPO }} className="absolute z-10"
      style={{ top: (s - H0) * HPX + 1, height: h - 2, left: `calc(${(lane / n) * 100}% + 3px)`, width: `calc(${100 / n}% - 6px)` }}>
      <button draggable onClick={onClick} onDragStart={(x) => { x.dataTransfer.setData('text/plain', e.id); x.dataTransfer.effectAllowed = 'move'; onGrab(x.clientY - x.currentTarget.getBoundingClientRect().top) }}
        className={clsx('group relative h-full w-full cursor-grab overflow-hidden rounded-xl px-2 py-1.5 text-left ring-1 backdrop-blur-[2px] transition-colors duration-300 active:cursor-grabbing', k.block, active && '!ring-2 !ring-bone/70', conflict && '!ring-coral/70')}>
        <span className={clsx('absolute inset-y-1.5 left-0 w-[2.5px] rounded-full', k.dot)} />
        <div className="min-w-0 pl-1 pr-2.5">
          <div className={clsx('truncate font-medium leading-tight text-bone', wide ? 'text-[13.5px]' : 'text-[11.5px]')}>{e.title}</div>
          {h > 34 && <div className={clsx('num mt-0.5 flex items-center gap-1 truncate whitespace-nowrap text-[10px]', k.text)}>{e.start}{n === 1 && `–${e.end}`}{reminded && <BellRinging size={10} weight="light" className="shrink-0 text-bone/70" aria-label="Rappels WhatsApp programmés" />}</div>}
          {h > 60 && <div className="mt-0.5 truncate text-[10.5px] text-bone/50">{e.who}</div>}
          {wide && h > 60 && <div className="mt-1 flex items-center gap-1 text-[10.5px] text-mist"><MapPin size={10} />{e.place}</div>}
        </div>
        {conflict ? <Warning size={11} weight="fill" className="absolute right-1.5 top-1.5 text-coral" /> : ready !== undefined && <span title={`Préparé à ${ready} %`} className={clsx('absolute right-1.5 top-2 h-1.5 w-1.5 rounded-full', ready === 100 ? 'bg-sage' : 'animate-pulse bg-champagne')} />}
        {reminded && h <= 34 && <BellRinging size={9} weight="light" className="absolute bottom-1 right-1.5 text-bone/70" aria-label="Rappels WhatsApp programmés" />}
        {wide && <DotsSixVertical size={12} className="absolute bottom-1.5 right-1 text-bone/0 transition group-hover:text-bone/40" />}
      </button>
    </motion.div>
  )
}

function Month({ day, events, rem, sel, onDay, onPick, onMove }: { day: number; events: Ev[]; rem: Set<string>; sel: string; onDay: (d: number) => void; onPick: (e: Ev) => void; onMove: (id: string, d: number) => void }) {
  const [over, setOver] = useState<number | null>(null)
  const cells = monthCells(day), month = monthOf(day).m
  return (
    <div className="thin-scroll overflow-x-auto border-t border-white/[0.06]">
      <div className="grid min-w-[640px] grid-cols-7">
        {WD.map((w) => <div key={w} className="border-b border-white/[0.06] px-3 py-2 text-[10.5px] uppercase tracking-eyebrow text-mist">{w}</div>)}
        {cells.map((d) => {
          const evs = events.filter((e) => e.day === d).sort((a, b) => toH(a.start) - toH(b.start)), out = dt(d).getMonth() !== month, today = d === NOW.day
          return (
            <div key={d} onClick={() => onDay(d)} onDragOver={(x) => { x.preventDefault(); setOver(d) }} onDragLeave={() => setOver(null)} onDrop={(x) => { x.preventDefault(); setOver(null); onMove(x.dataTransfer.getData('text/plain'), d) }}
              className={clsx('group min-h-[112px] cursor-pointer border-b border-l border-white/[0.04] p-2 transition-colors hover:bg-white/[0.02]', out && 'opacity-35', over === d && 'bg-champagne/[0.06]')}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className={clsx('num flex h-6 min-w-6 items-center justify-center rounded-full text-[12px]', today ? 'bg-champagne text-ink' : 'text-bone/80')}>{lab(d).n}</span>
                {evs.length > 0 && <span className="num text-[10px] text-mist">{evs.length}</span>}
              </div>
              <div className="space-y-1">
                {evs.slice(0, 3).map((e) => (
                  <button key={e.id} draggable onDragStart={(x) => x.dataTransfer.setData('text/plain', e.id)} onClick={(x) => { x.stopPropagation(); onPick(e) }} className={clsx('flex w-full items-center gap-1.5 truncate rounded-md px-1.5 py-0.5 text-left text-[10.5px] ring-1', KINDS[e.kind].block, sel === e.id && '!ring-bone/60')}>
                    <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', KINDS[e.kind].dot)} /><span className="truncate" title={`${e.start} · ${e.title}`}>{e.title}</span>{rem.has(e.id) && <BellRinging size={10} weight="light" className="ml-auto shrink-0 text-bone/60" aria-label="Rappels programmés" />}
                  </button>
                ))}
                {evs.length > 3 && <div className="pl-1.5 text-[10.5px] text-mist">+ {evs.length - 3} autre{evs.length > 4 ? 's' : ''}</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MiniCal({ day, week, events, onPick, onShift }: { day: number; week: number; events: Ev[]; onPick: (d: number) => void; onShift: (n: number) => void }) {
  const month = monthOf(day)
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between"><span className="display text-xl">{cap(month.label)}</span><span className="flex items-center gap-1"><IconBtn label="Mois précédent" onClick={() => onShift(-1)}><CaretLeft size={13} weight="light" /></IconBtn><IconBtn label="Mois suivant" onClick={() => onShift(1)}><CaretRight size={13} weight="light" /></IconBtn><CalendarDots size={16} weight="light" className="ml-1 text-mist" /></span></div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WD.map((w) => <span key={w} className="pb-1 text-[10px] uppercase tracking-wider text-mist-600">{w[0]}</span>)}
        {monthCells(day).map((d) => {
          const inWeek = weekOf(d) === week, has = events.some((e) => e.day === d), out = dt(d).getMonth() !== month.m
          return (
            <button key={d} onClick={() => onPick(d)} className={clsx('relative mx-auto flex h-8 w-full items-center justify-center text-[12px] transition', inWeek && 'bg-white/[0.04]', inWeek && wd(d) === 0 && 'rounded-l-full', inWeek && wd(d) === 6 && 'rounded-r-full', out && 'text-bone/20')}>
              <span className={clsx('num flex h-7 w-7 items-center justify-center rounded-full', d === day ? 'bg-bone text-ink' : d === NOW.day ? 'text-champagne-300 ring-1 ring-champagne/40' : 'hover:bg-white/[0.06]')}>{lab(d).n}</span>
              {has && !out && d !== day && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-champagne/70" />}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function EventPanel({ e, d, reminders, conflict, preparing, onCheck, onPrepare, onResolve, onIgnore, onEdit, onDelete }: {
  e: Ev; d?: Dossier; reminders: (Reminder & Doc)[]; conflict?: Ev; preparing: string | null
  onCheck: (i: number) => void; onPrepare: () => void; onResolve: () => void; onIgnore: () => void; onEdit: () => void; onDelete: () => void
}) {
  const [confirm, setConfirm] = useState(false)
  const p = d && prop(d.propertyId), k = KINDS[e.kind], prep = e.prep
  const checks = checkList(e)
  const done = checks.filter((c) => c.ok).length
  const prepped = !!prep && prep.D1 === 100 && prep.D2 === 100 && prep.D3 === 100
  const remote = /visio|téléphone/i.test(e.place)
  const SrcI = e.source === 'google' ? GoogleLogo : e.source === 'outlook' ? MicrosoftOutlookLogo : Sparkle
  const later = conflict && (toH(e.start) >= toH(conflict.start) ? e : conflict)
  const anchor = conflict && (later === e ? conflict : e)
  return (
    <div>
      {p && (
        <div className="relative h-32 overflow-hidden rounded-t-[calc(1.4rem-0.25rem)]">
          <img src={p.photo} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-800 via-ink-800/40 to-transparent" />
        </div>
      )}
      <div className={clsx('p-5', p && 'relative -mt-10')}>
        <div className="flex items-center justify-between gap-2">
          <span className={clsx('flex items-center gap-1.5 rounded-full bg-ink-800/80 px-2.5 py-1 text-[11px] ring-1 ring-white/10 backdrop-blur', k.text)}><span className={clsx('h-1.5 w-1.5 rounded-full', k.dot)} />{k.label}</span>
          <div className="flex items-center gap-1.5">
            <span className="mr-1 flex items-center gap-1 text-[10.5px] text-mist"><SrcI size={12} weight="light" />{e.source === 'nxt' ? 'NXT' : e.source === 'google' ? 'Google' : 'Outlook'}</span>
            <IconBtn label="Modifier" onClick={onEdit}><PencilSimple size={14} weight="light" /></IconBtn>
            <IconBtn label={confirm ? 'Confirmer la suppression' : 'Supprimer'} active={confirm} onClick={() => (confirm ? onDelete() : setConfirm(true))}><Trash size={14} weight="light" className={confirm ? 'text-coral' : ''} /></IconBtn>
          </div>
        </div>
        {confirm && <div className="mt-2 text-right text-[11px] text-coral">Cliquez à nouveau pour supprimer · <button className="underline" onClick={() => setConfirm(false)}>annuler</button></div>}
        <h3 className="display mt-3 text-[1.65rem] leading-[1.05]">{e.title}</h3>
        <div className="mt-3 space-y-1.5 text-[12.5px] text-bone/70">
          <div className="flex items-center gap-2"><Clock size={14} weight="light" className="text-mist" /><span className="num">{WD_LONG[wd(e.day)]} {lab(e.day).n} {lab(e.day).m} · {e.start}–{e.end}</span></div>
          <div className="flex items-center gap-2"><UsersThree size={14} weight="light" className="text-mist" />{e.who}</div>
          <div className="flex items-center gap-2"><MapPin size={14} weight="light" className="text-mist" />{e.place}</div>
        </div>

        {conflict && later && anchor && (
          <div className="mt-4 rounded-2xl bg-coral/[0.08] p-3 ring-1 ring-coral/20">
            <div className="flex items-start gap-2 text-[12px] text-coral"><Warning size={15} weight="light" className="mt-px shrink-0" />Chevauche « {conflict.title} » ({conflict.start}–{conflict.end})</div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button onClick={onResolve} className="rounded-full bg-coral/15 px-3 py-1 text-[11.5px] text-coral ring-1 ring-coral/30 hover:bg-coral/25">Décaler « {later.title.split(' — ')[0]} » à {anchor.end}</button>
              <button onClick={onIgnore} className="rounded-full px-3 py-1 text-[11.5px] text-bone/60 ring-1 ring-white/10 hover:text-bone">Accepter le chevauchement</button>
            </div>
          </div>
        )}

        {prep && (
          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10.5px] uppercase tracking-eyebrow text-mist">État de préparation</span>
              <Ring key={avg(prep)} value={avg(prep)} size={40} color={avg(prep) === 100 ? 'rgb(var(--sage))' : 'rgb(var(--acc-500))'}><span className="num text-[10px]">{avg(prep)}</span></Ring>
            </div>
            <div className="space-y-2">
              {(['D1', 'D2', 'D3', 'D4'] as const).map((c) => (
                <div key={c} className="flex items-center gap-3">
                  <span className="num w-6 text-[11px] text-champagne-300">{c}</span>
                  <span className="w-28 truncate text-[11.5px] text-bone/60">{{ D1: 'Brief relationnel', D2: 'Marché', D3: 'Radar quartier', D4: 'Coaching' }[c]}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div className={clsx('h-full rounded-full', prep[c] === 100 ? 'bg-sage' : 'bg-champagne')} initial={{ width: 0 }} animate={{ width: `${prep[c]}%` }} transition={{ duration: 1.1, ease: EXPO }} />
                  </div>
                  <span className="num w-8 text-right text-[10.5px] text-mist">{prep[c]}%</span>
                </div>
              ))}
            </div>
            {prep.D4 < 100 && <div className="mt-2 text-[11px] text-mist">D4 se prépare en séance sur la page Coaching.</div>}
          </div>
        )}

        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/[0.025] p-3 ring-1 ring-white/[0.05]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sea/10 text-sea"><Car size={16} weight="light" /></span>
          {remote ? <div className="text-[12px] text-bone/70">À distance · aucun trajet</div> : e.travel ? (
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px]"><span className="num">{e.travel.min} min</span> <span className="text-bone/50">· {e.travel.km.toString().replace('.', ',')} km depuis {e.travel.from}</span></div>
              <div className="text-[11px] text-mist">Départ conseillé <span className="num text-bone/70">{hhmm(toH(e.start) - (e.travel.min + 10) / 60)}</span> · estimation, sans trafic temps réel</div>
            </div>
          ) : <div className="text-[12px] text-bone/60">Trajet non calculé · service cartographique non configuré</div>}
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between"><span className="text-[10.5px] uppercase tracking-eyebrow text-mist">Checklist avant RDV</span><span className="num text-[11px] text-mist">{done}/{checks.length}</span></div>
          <div className="space-y-1">
            {checks.map((c, i) => (
              <button key={c.t} onClick={() => onCheck(i)} className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-[12.5px] transition hover:bg-white/[0.03]">
                {c.ok ? <CheckCircle size={17} weight="fill" className="shrink-0 text-sage" /> : <Circle size={17} weight="light" className="shrink-0 text-bone/30" />}
                <span className={c.ok ? 'text-bone/45 line-through decoration-bone/20' : 'text-bone/85'}>{c.t}</span>
              </button>
            ))}
          </div>
        </div>

        {(e.kind === 'rdv' || e.kind === 'visite' || e.kind === 'signature') && <Reminders e={e} list={reminders} />}

        <div className="mt-5 space-y-2">
          {d ? (
            <button onClick={onPrepare} disabled={!!preparing || prepped} className={clsx('relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full py-2.5 text-[13px] font-medium transition-all duration-500 ease-silk active:scale-[0.98]', prepped ? 'bg-sage/15 text-sage ring-1 ring-sage/25' : 'bg-champagne text-ink shadow-glow hover:bg-champagne-300')}>
              {preparing && <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_30%,rgb(var(--tint)_/_.35)_50%,transparent_70%)] bg-[length:200%_100%]" />}
              {prepped ? <><CheckCircle size={15} weight="fill" />D1–D3 générés · à relire</> : preparing ? <><Sparkle size={15} weight="fill" className="animate-pulse" />Génération de {preparing}…</> : <><Sparkle size={15} weight="fill" />Préparer avec le copilote</>}
            </button>
          ) : <div className="rounded-2xl border border-dashed border-white/10 p-3 text-center text-[11.5px] text-mist">Liez un dossier (Modifier) pour la préparation par le copilote.</div>}
          {d && <Link to={`/app/dossiers/${d.id}`} className="flex items-center justify-center gap-1.5 py-1 text-[12px] text-mist transition hover:text-bone">Ouvrir le dossier {d.ref}<ArrowRight size={12} /></Link>}
        </div>
      </div>
    </div>
  )
}

const REM_TONE: Record<Reminder['status'], string> = { programmé: 'bg-sea/10 text-sea ring-sea/25', consigné: 'bg-sage/10 text-sage ring-sage/25', annulé: 'bg-white/[0.04] text-bone/45 ring-white/10' }
const when = (iso: string) => new Date(iso).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Rappels WhatsApp liés à l’événement : J-1 18:00 et H-2 via modèle approuvé (routine AUT-110). */
function Reminders({ e, list }: { e: Ev; list: (Reminder & Doc)[] }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const rems = [...list].sort((a, b) => a.dueAt.localeCompare(b.dueAt))
  const live = rems.filter((r) => r.status === 'programmé').length
  const schedule = async () => {
    setBusy('new'); setErr(null)
    try { const r = await action<unknown[]>('reminders.scheduleEvent', { eventId: e.id }); toast(`${r.length} rappel${r.length > 1 ? 's' : ''} WhatsApp programmé${r.length > 1 ? 's' : ''}`) }
    catch (x) { setErr(errText(x)); toast(errText(x), 'error') } finally { setBusy(null) }
  }
  const cancel = async (r: Reminder & Doc) => {
    setBusy(r.id)
    try { await action('reminder.cancel', { id: r.id }); toast(`Rappel ${r.rule} annulé`) } catch (x) { toast(errText(x), 'error') } finally { setBusy(null) }
  }
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-eyebrow text-mist"><BellRinging size={13} weight="light" />Rappels WhatsApp</span>
        <span className="num text-[11px] text-mist">{live} programmé{live > 1 ? 's' : ''}</span>
      </div>
      {rems.length ? (
        <div className="space-y-1.5">
          {rems.map((r) => (
            <div key={r.id} className={clsx('rounded-2xl bg-white/[0.025] p-3 ring-1 ring-white/[0.05]', r.status === 'annulé' && 'opacity-60')}>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="num rounded-md bg-white/[0.05] px-1.5 py-0.5 text-bone/85">{r.rule}</span>
                <span className="num truncate text-mist">{when(r.dueAt)}</span>
                <span className={clsx('ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10.5px] ring-1', REM_TONE[r.status])}>{r.status}</span>
                {r.status === 'programmé' && <button disabled={busy === r.id} onClick={() => cancel(r)} title="Annuler ce rappel" aria-label="Annuler ce rappel" className="shrink-0 text-mist transition hover:text-coral disabled:opacity-40"><X size={13} weight="light" /></button>}
              </div>
              <p className={clsx('mt-1.5 line-clamp-2 text-[12px] leading-snug', r.status === 'annulé' ? 'text-bone/45 line-through decoration-bone/20' : 'text-bone/70')}>{r.text}</p>
              {r.conversationId && <Link to={`/app/messages?c=${r.conversationId}`} className="mt-1 inline-flex items-center gap-1 text-[11px] text-champagne-300 hover:underline"><ChatCircleText size={12} weight="light" />Voir la conversation</Link>}
            </div>
          ))}
        </div>
      ) : <div className="rounded-2xl border border-dashed border-white/10 p-3 text-[11.5px] leading-snug text-mist">Aucun rappel pour ce rendez-vous. J-1 à 18:00 et H-2 partent via un modèle WhatsApp approuvé.</div>}
      {err && <div className="mt-2 flex items-start gap-2 rounded-xl bg-coral/[0.08] p-2.5 text-[11.5px] text-coral ring-1 ring-coral/20"><Warning size={14} weight="light" className="mt-px shrink-0" />{err}</div>}
      <button onClick={schedule} disabled={busy === 'new'} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-white/[0.04] py-2 text-[12.5px] text-bone/85 ring-1 ring-white/10 transition hover:bg-white/[0.08] disabled:opacity-50">
        <BellRinging size={14} weight="light" />{busy === 'new' ? 'Programmation…' : 'Programmer J-1 & H-2'}
      </button>
      <div className="mt-1.5 text-center text-[10.5px] text-mist">Envoi consigné · connecteur WhatsApp Business non configuré</div>
    </div>
  )
}
