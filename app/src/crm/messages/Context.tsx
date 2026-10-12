// Colonne 4 : contexte de la conversation (contact, dossier, RDV, consentements, rappels, actions rapides, fichiers).
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import {
  X, Phone, EnvelopeSimple, ArrowSquareOut, CalendarBlank, ShieldCheck, BellRinging, CheckSquare, CalendarPlus, NotePencil, UserSwitch, Clock, CheckCircle, ArrowsClockwise,
  FilePdf, Image, LinkSimple, MapPin, Sparkle,
} from '@phosphor-icons/react'
import { Modal, Field, Input, Select, Textarea, AsyncForm, toast, errText } from '../forms'
import { action } from '../../data/store'
import { useConversations, useReminders, useTasks, useEvents, useNotes, useFiles, useAgents } from '../../data/collections'
import { STAGES, agent } from '../../data/mock'
import { useConvContext, eventDate, dayLabel, longDate, until, localInput, rel, isSnoozed, Menu, menuItem, eyebrow, me, type Conv, type Msg } from './shared'

export function SnoozeMenu({ conv, onDone, className }: { conv: Conv; onDone: () => void; className?: string }) {
  const [, ops] = useConversations()
  const [custom, setCustom] = useState('')
  const at = (h: number, d: number) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return x }
  const monday = () => { const x = at(9, 0); x.setDate(x.getDate() + ((8 - x.getDay()) % 7 || 7)); return x }
  const go = async (d: Date) => {
    try { await ops.update(conv.id, { status: 'snoozed', snoozedUntil: d.toISOString() }); toast(`En attente jusqu’à ${longDate(d.toISOString())}`); onDone() } catch (e) { toast(errText(e), 'error') }
  }
  const opts: [string, Date][] = [['Dans 3 heures', new Date(Date.now() + 3 * 3600e3)], ['Ce soir 18:00', at(18, 0)], ['Demain 9:00', at(9, 1)], ['Lundi prochain 9:00', monday()]]
  return (
    <Menu className={clsx('w-64', className)}>
      {opts.filter(([, d]) => d.getTime() > Date.now()).map(([l, d]) => <button key={l} onClick={() => go(d)} className={menuItem}><Clock size={13} />{l}<span className="num ml-auto text-[10.5px] text-mist">{d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}</span></button>)}
      <div className="p-2">
        <input type="datetime-local" min={localInput(new Date())} value={custom} onChange={(e) => setCustom(e.target.value)} className="w-full rounded-xl bg-white/[0.04] px-2.5 py-1.5 text-[12.5px] outline-none ring-1 ring-white/[0.08] [color-scheme:dark] focus:ring-champagne/50" />
        <button disabled={!custom} onClick={() => go(new Date(custom))} className="mt-2 w-full rounded-full bg-champagne py-1.5 text-[12px] font-medium text-ink disabled:opacity-40">Mettre en attente</button>
      </div>
      {isSnoozed(conv) && <button onClick={async () => { await ops.update(conv.id, { status: 'open', snoozedUntil: undefined }); toast('Conversation de retour dans la boîte'); onDone() }} className={menuItem}><ArrowsClockwise size={13} />Sortir de l’attente</button>}
    </Menu>
  )
}

export default function Context({ conv, messages, onClose }: { conv: Conv; messages: Msg[]; onClose: () => void }) {
  const [, convOps] = useConversations()
  const [reminders] = useReminders()
  const [notes] = useNotes()
  const [files] = useFiles()
  const [agents] = useAgents()
  const { contact, dossier, property, next } = useConvContext(conv)
  const [modal, setModal] = useState<null | 'task' | 'visit' | 'note'>(null)
  const [snooze, setSnooze] = useState(false)
  const internal = conv.kind === 'channel'
  const rems = reminders.filter((r) => r.conversationId === conv.id || (!!conv.eventIds?.length && r.eventId && conv.eventIds.includes(r.eventId)) || (conv.channel === 'whatsapp' && conv.dossierId && r.dossierId === conv.dossierId && !r.conversationId))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
  const noteList = notes.filter((n) => (dossier && n.dossierId === dossier.id) || (contact && n.contactId === contact.id)).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 3)
  const shared = [
    ...messages.flatMap((m) => (m.attachments ?? []).map((a) => ({ ...a, at: m.at }))),
    ...files.filter((f) => dossier && f.dossierId === dossier.id).map((f) => ({ name: f.name, kind: (f.type.startsWith('image/') ? 'image' : 'pdf') as 'image' | 'pdf', ref: f.id, at: f.at })),
  ].filter((a, i, l) => l.findIndex((b) => b.name === a.name) === i)
  const assign = async (id: string) => { try { await convOps.update(conv.id, { assignee: id || undefined }); toast(id ? `Assignée à ${agent(id).name}` : 'Assignation retirée') } catch (e) { toast(errText(e), 'error') } }
  const cancel = async (id: string) => { try { await action('reminder.cancel', { id }); toast('Rappel annulé') } catch (e) { toast(errText(e), 'error') } }

  return (
    <div className="flex min-h-full w-full flex-col">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-ink-800/95 px-4 py-3 backdrop-blur">
        <span className={eyebrow}>Contexte</span>
        <button onClick={onClose} aria-label="Fermer le contexte" className="flex h-7 w-7 items-center justify-center rounded-full text-mist hover:bg-white/[0.06] hover:text-bone"><X size={14} /></button>
      </div>
      <div className="space-y-5 p-4">
        {internal ? (
          <Section title={`Membres · ${conv.participants?.length ?? 0}`}>
            <div className="space-y-2">{(conv.participants ?? []).map((id) => { const a = agents.find((x) => x.id === id); return a && <div key={id} className="flex items-center gap-2.5 text-[12.5px]"><img src={a.photo} alt="" className="h-7 w-7 rounded-full object-cover" /><span className="flex-1">{a.name}</span><span className="text-[11px] text-mist">{a.role}</span></div> })}</div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-bone/50">{conv.topic}{conv.private && ' · Canal privé : contenu non visible des autres agences.'}</p>
          </Section>
        ) : (
          <>
            {/* Contact */}
            <Section title="Contact" action={contact && <Link to="/app/contacts" className="text-[11px] text-mist hover:text-bone">Fiche →</Link>}>
              <div className="flex items-center gap-3">
                {(contact?.photo ?? conv.avatar) ? <img src={contact?.photo ?? conv.avatar} alt="" className="h-11 w-11 rounded-full object-cover" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-champagne/15 font-serif text-lg italic text-champagne-300">{conv.title[0]}</span>}
                <div className="min-w-0"><div className="truncate text-[14px] font-medium">{contact?.name ?? conv.title}</div><div className="truncate text-[11.5px] text-mist">{contact?.org ?? conv.subtitle}</div></div>
                {contact && <span className="num ml-auto rounded-full bg-champagne/10 px-2 py-0.5 text-[11px] text-champagne-300 ring-1 ring-champagne/20" title="Score relationnel">{contact.score}</span>}
              </div>
              {contact && <div className="mt-3 space-y-1.5 text-[12px] text-bone/70">
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-bone"><Phone size={13} className="text-mist" /><span className="num">{contact.phone}</span></a>
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 truncate hover:text-bone"><EnvelopeSimple size={13} className="text-mist" />{contact.email}</a>
                <div className="flex items-start gap-2"><Sparkle size={13} className="mt-0.5 text-champagne-300" /><span>Préfère {contact.pref.ch.toLowerCase()} · {contact.pref.slot.toLowerCase()}{contact.pref.note ? ` — ${contact.pref.note}` : ''}</span></div>
              </div>}
            </Section>

            {/* Dossier lié */}
            {dossier && property && (
              <Section title="Dossier lié">
                <Link to={`/app/dossiers/${dossier.id}`} className="group block overflow-hidden rounded-2xl ring-1 ring-white/[0.08]">
                  <div className="theme-dark relative h-28 overflow-hidden">
                    <img src={property.photo} alt="" className="h-full w-full object-cover transition-transform duration-700 ease-silk group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3"><div className="truncate text-[13px] font-medium text-bone">{property.title}</div><div className="num text-[10.5px] text-bone/70">{dossier.ref} · {property.city}</div></div>
                    <ArrowSquareOut size={14} className="absolute right-2.5 top-2.5 text-bone/80" />
                  </div>
                  <div className="space-y-1.5 p-3 text-[12px]">
                    <div className="flex items-center justify-between"><span className="text-mist">Étape</span><span className="rounded-full bg-sea/10 px-2 py-px text-[11px] text-sea ring-1 ring-sea/20">{STAGES.find((s) => s.id === dossier.stage)?.label}</span></div>
                    <div className="flex items-start justify-between gap-3"><span className="shrink-0 text-mist">Prochaine action</span><span className="text-right text-bone/85">{dossier.next}<span className="block text-[11px] text-champagne-300">{dossier.due}</span></span></div>
                  </div>
                </Link>
              </Section>
            )}

            {/* Prochain RDV */}
            <Section title="Prochain rendez-vous">
              {next[0] ? (
                <Link to="/app/agenda" className="flex gap-3 rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06] transition hover:bg-white/[0.05]">
                  <div className="w-11 shrink-0 rounded-xl bg-champagne/10 py-1.5 text-center ring-1 ring-champagne/20"><div className="text-[9.5px] uppercase text-champagne-300">{eventDate(next[0]).toLocaleDateString('fr-FR', { month: 'short' })}</div><div className="display text-xl leading-none">{next[0].day}</div></div>
                  <div className="min-w-0 text-[12px]"><div className="truncate font-medium text-bone">{next[0].title}</div><div className="text-mist">{dayLabel(eventDate(next[0]).toISOString())} · {next[0].start}–{next[0].end}</div><div className="flex items-center gap-1 truncate text-bone/55"><MapPin size={11} />{next[0].place}</div></div>
                </Link>
              ) : <p className="text-[12px] text-bone/45">Aucun rendez-vous à venir.</p>}
              {next.length > 1 && <p className="mt-1.5 text-[11px] text-mist">+ {next.length - 1} autre{next.length > 2 ? 's' : ''} rendez-vous lié{next.length > 2 ? 's' : ''}</p>}
            </Section>

            {/* Consentements */}
            <Section title="Consentements">
              <div className="space-y-1.5 text-[12px]">
                {conv.channel === 'whatsapp' && (
                  <div className="flex items-center gap-2"><ShieldCheck size={14} className={conv.optIn === false ? 'text-coral' : 'text-sage'} /><span className="flex-1">WhatsApp</span>
                    {conv.optIn === false
                      ? <button onClick={async () => { await convOps.update(conv.id, { optIn: true }); toast('Consentement WhatsApp enregistré') }} className="text-[11px] text-champagne-300 hover:underline">{conv.consentRequestedAt ? `Demandé ${rel(conv.consentRequestedAt)} · ` : ''}Enregistrer l’accord</button>
                      : <button onClick={async () => { await convOps.update(conv.id, { optIn: false }); toast('Retrait du consentement enregistré', 'info') }} title="Enregistrer un retrait" className="text-[11px] text-sage">Opt-in recueilli</button>}
                  </div>
                )}
                {contact?.consents.filter((c) => c.p === 'Prospection' && c.ch !== 'Courrier').map((c) => (
                  <div key={c.ch} className="flex items-center gap-2"><ShieldCheck size={14} className={c.ok ? 'text-sage' : c.ok === false ? 'text-coral' : 'text-mist'} /><span className="flex-1">{c.ch} · prospection</span><span className={clsx('text-[11px]', c.ok ? 'text-sage' : c.ok === false ? 'text-coral' : 'text-mist')} title={c.proof}>{c.ok ? `Oui · ${c.date}` : c.ok === false ? 'Refus' : 'À recueillir'}</span></div>
                ))}
                {!contact && conv.channel !== 'whatsapp' && <p className="text-bone/45">Contact non rattaché au registre.</p>}
                <p className="pt-1 text-[10.5px] leading-relaxed text-mist">Suivi de dossier : base contractuelle (mandat). Démarchage téléphonique sans accord interdit depuis le 11/08/2026.</p>
              </div>
            </Section>

            {/* Rappels */}
            <Section title={`Rappels programmés · ${rems.filter((r) => r.status === 'programmé').length}`} action={<Link to="?tab=rappels" className="text-[11px] text-mist hover:text-bone">Tous →</Link>}>
              {rems.length ? <div className="space-y-2">{rems.slice(0, 4).map((r) => (
                <div key={r.id} className={clsx('rounded-xl p-2.5 text-[12px] ring-1', r.status === 'programmé' ? 'bg-sea/[0.05] ring-sea/15' : 'bg-white/[0.02] ring-white/[0.05] opacity-70')}>
                  <div className="flex items-center gap-2"><BellRinging size={13} className={r.status === 'programmé' ? 'text-sea' : 'text-mist'} /><span className="num text-[11px]">{r.rule}</span><span className="text-mist">{r.status === 'programmé' ? until(r.dueAt) : r.status}</span>
                    {r.status === 'programmé' && <button onClick={() => cancel(r.id)} className="ml-auto text-[11px] text-coral hover:underline">Annuler</button>}</div>
                  <p className="mt-1 line-clamp-2 text-bone/65">{r.text}</p>
                </div>))}</div> : <p className="text-[12px] text-bone/45">Aucun rappel pour cette conversation.</p>}
            </Section>

            {/* Actions rapides */}
            <Section title="Actions rapides">
              <div className="grid grid-cols-2 gap-1.5">
                <QA icon={<CheckSquare size={15} />} onClick={() => setModal('task')}>Tâche</QA>
                <QA icon={<CalendarPlus size={15} />} onClick={() => setModal('visit')}>Planifier une visite</QA>
                <QA icon={<NotePencil size={15} />} onClick={() => setModal('note')}>Note</QA>
                <div className="relative">
                  <QA icon={<Clock size={15} />} onClick={() => setSnooze(!snooze)}>{isSnoozed(conv) ? 'En attente' : 'Snooze'}</QA>
                  {snooze && <SnoozeMenu conv={conv} onDone={() => setSnooze(false)} className="bottom-11 right-0" />}
                </div>
                <label className="col-span-2 flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-[12px] ring-1 ring-white/[0.06]">
                  <UserSwitch size={15} className="text-mist" /><span className="text-mist">Assignée à</span>
                  <select value={conv.assignee ?? ''} onChange={(e) => assign(e.target.value)} className="ml-auto bg-transparent text-right text-bone outline-none [&>option]:bg-ink-800">
                    <option value="">Personne</option>{agents.filter((a) => a.mandats > 0 || a.id === 'a5').map((a) => <option key={a.id} value={a.id}>{a.id === me.id ? `${a.name} (moi)` : a.name}</option>)}
                  </select>
                </label>
                <button onClick={async () => { try { await convOps.update(conv.id, { status: conv.status === 'done' ? 'open' : 'done', snoozedUntil: undefined }); toast(conv.status === 'done' ? 'Conversation rouverte' : 'Conversation terminée') } catch (e) { toast(errText(e), 'error') } }}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-champagne/10 py-2 text-[12.5px] text-champagne-300 ring-1 ring-champagne/25 transition hover:bg-champagne/15">
                  {conv.status === 'done' ? <><ArrowsClockwise size={14} />Rouvrir</> : <><CheckCircle size={14} />Terminer la conversation</>}
                </button>
              </div>
            </Section>

            {noteList.length > 0 && (
              <Section title="Notes">
                <div className="space-y-2">{noteList.map((n) => <div key={n.id} className="rounded-xl bg-white/[0.03] p-2.5 text-[12px] ring-1 ring-white/[0.05]"><p className="text-bone/80">{n.text}</p><div className="mt-1 text-[10.5px] text-mist">{n.by} · {rel(n.at)}</div></div>)}</div>
              </Section>
            )}
          </>
        )}

        <Section title={`Fichiers partagés · ${shared.length}`}>
          {shared.length ? <div className="space-y-1">{shared.map((a, i) => {
            const I = a.kind === 'pdf' ? FilePdf : a.kind === 'image' ? Image : LinkSimple
            const href = a.ref?.startsWith('/') ? a.ref : a.ref ? `/api/files/${a.ref}/raw` : undefined
            const inner = <><I size={15} weight="light" className={a.kind === 'pdf' ? 'text-coral' : a.kind === 'image' ? 'text-sea' : 'text-champagne-300'} /><span className="flex-1 truncate">{a.name}</span><span className="num shrink-0 text-[10.5px] text-mist">{rel(a.at)}</span></>
            const cls = 'flex items-center gap-2 rounded-xl px-2 py-1.5 text-[12px] transition hover:bg-white/[0.04]'
            return href?.startsWith('/app') ? <Link key={i} to={href} className={cls}>{inner}</Link> : href ? <a key={i} href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a> : <div key={i} className={cls} title="Pièce de démonstration">{inner}</div>
          })}</div> : <p className="text-[12px] text-bone/45">Aucun fichier échangé.</p>}
        </Section>
      </div>

      <TaskModal open={modal === 'task'} onClose={() => setModal(null)} conv={conv} dossierId={dossier?.id} />
      <VisitModal open={modal === 'visit'} onClose={() => setModal(null)} conv={conv} dossierId={dossier?.id} place={property?.address} propertyTitle={property?.title} />
      <NoteModal open={modal === 'note'} onClose={() => setModal(null)} dossierId={dossier?.id} contactId={contact?.id} title={conv.title} />
    </div>
  )
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section><div className="mb-2 flex items-center justify-between"><span className={eyebrow}>{title}</span>{action}</div>{children}</section>
}
const QA = ({ icon, onClick, children }: { icon: ReactNode; onClick: () => void; children: ReactNode }) =>
  <button onClick={onClick} className="flex w-full items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-left text-[12px] text-bone/85 ring-1 ring-white/[0.06] transition hover:bg-white/[0.06]"><span className="text-champagne-300">{icon}</span>{children}</button>

function TaskModal({ open, onClose, conv, dossierId }: { open: boolean; onClose: () => void; conv: Conv; dossierId?: string }) {
  const [, ops] = useTasks()
  return (
    <Modal open={open} onClose={onClose} title="Nouvelle tâche" kicker={`Depuis · ${conv.title}`}>
      <AsyncForm submitLabel="Créer la tâche" onCancel={onClose} success="Tâche créée — visible dans Tâches & validations" onSubmit={async (v) => {
        if (!v.title.trim()) throw new Error('Intitulé obligatoire')
        await ops.create({ title: v.title.trim(), dossier: dossierId, due: v.due, prio: v.prio as 'haute' | 'normale', kind: v.kind as 'relancer' })
        onClose()
      }}>
        <Field label="Intitulé"><Input name="title" required defaultValue={`Répondre à ${conv.title} — ${conv.lastText.slice(0, 50)}${conv.lastText.length > 50 ? '…' : ''}`} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Échéance"><Select name="due" defaultValue="Aujourd’hui">{['Maintenant', 'Aujourd’hui', 'Demain', 'Cette semaine'].map((d) => <option key={d}>{d}</option>)}</Select></Field>
          <Field label="Priorité"><Select name="prio" defaultValue="normale"><option value="haute">Haute</option><option value="normale">Normale</option></Select></Field>
          <Field label="Type"><Select name="kind" defaultValue="relancer"><option value="relancer">Relancer</option><option value="appeler">Appeler</option><option value="envoyer">Envoyer</option><option value="document">Document</option><option value="valider">Valider</option></Select></Field>
        </div>
      </AsyncForm>
    </Modal>
  )
}

function VisitModal({ open, onClose, conv, dossierId, place, propertyTitle }: { open: boolean; onClose: () => void; conv: Conv; dossierId?: string; place?: string; propertyTitle?: string }) {
  const [, ops] = useEvents()
  const [, convOps] = useConversations()
  const today = new Date()
  const iso = (d: Date) => localInput(d).slice(0, 10)
  return (
    <Modal open={open} onClose={onClose} title="Planifier une visite" kicker="Agenda · rappels WhatsApp J-1 et H-2">
      <AsyncForm submitLabel="Ajouter à l’agenda" onCancel={onClose} onSubmit={async (v) => {
        const d = new Date(`${v.date}T${v.start}`)
        if (d.getFullYear() !== 2026 || d.getMonth() !== 9) throw new Error('L’agenda de démonstration couvre octobre 2026 : choisissez une date en octobre.')
        if (d.getTime() < Date.now()) throw new Error('Cette date est déjà passée.')
        if (v.end <= v.start) throw new Error('L’heure de fin doit suivre l’heure de début.')
        const e = await ops.create({ day: d.getDate(), start: v.start, end: v.end, title: v.title.trim(), who: conv.title, place: v.place.trim() || '—', kind: 'visite', dossier: dossierId, source: 'nxt' })
        await convOps.update(conv.id, { eventIds: [...(conv.eventIds ?? []), e.id] })
        let msg = `Visite ajoutée ${longDate(d.toISOString())}`
        if (v.remind === 'on') { try { const r = await action<unknown[]>('reminders.scheduleEvent', { eventId: e.id }); msg += ` · ${r.length} rappel(s) programmé(s)` } catch (x) { msg += ` · rappels : ${errText(x)}` } }
        toast(msg); onClose()
      }}>
        <Field label="Intitulé"><Input name="title" required defaultValue={`Visite — ${propertyTitle ?? conv.title}`} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Date"><Input name="date" type="date" required min={iso(today)} max="2026-10-31" defaultValue={iso(new Date(today.getTime() + 864e5))} /></Field>
          <Field label="Début"><Input name="start" type="time" required defaultValue="10:00" /></Field>
          <Field label="Fin"><Input name="end" type="time" required defaultValue="10:45" /></Field>
        </div>
        <Field label="Lieu"><Input name="place" defaultValue={place ?? ''} /></Field>
        <label className="flex items-center gap-2.5 text-[13px] text-bone/80"><input type="checkbox" name="remind" defaultChecked={conv.channel === 'whatsapp'} className="accent-[rgb(var(--acc-500))]" /> Programmer les rappels WhatsApp (J-1 18:00 et H-2, routine AUT-110)</label>
        <p className="flex items-center gap-1.5 text-[11.5px] text-mist"><CalendarBlank size={12} />L’événement est lié à la conversation et au dossier.</p>
      </AsyncForm>
    </Modal>
  )
}

function NoteModal({ open, onClose, dossierId, contactId, title }: { open: boolean; onClose: () => void; dossierId?: string; contactId?: string; title: string }) {
  const [, ops] = useNotes()
  return (
    <Modal open={open} onClose={onClose} title="Ajouter une note" kicker={title}>
      <AsyncForm submitLabel="Enregistrer la note" onCancel={onClose} success="Note ajoutée au dossier" onSubmit={async (v) => {
        if (!v.text.trim()) throw new Error('La note est vide')
        await ops.create({ text: v.text.trim(), dossierId, contactId, at: new Date().toISOString(), by: me.name })
        onClose()
      }}>
        <Field label="Note" hint={dossierId ? 'Visible dans le journal du dossier.' : 'Rattachée au contact.'}><Textarea name="text" required autoFocus placeholder="Ce qu’il faut retenir de l’échange…" /></Field>
      </AsyncForm>
    </Modal>
  )
}
