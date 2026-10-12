// Onglet « Rappels WhatsApp » : à venir / consignés / annulés, annulation, rappel manuel, rappels d’un rendez-vous.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { BellRinging, Plus, CalendarPlus, X, ChatsCircle, Lightning, Clock } from '@phosphor-icons/react'
import { Card, Stat, Stagger, Tabs, SoftBtn, Empty } from '../ui'
import { Modal, Field, Input, Select, Textarea, AsyncForm, toast, errText } from '../forms'
import { action } from '../../data/store'
import { useReminders, useTemplates, useContacts, useConversations, useEvents } from '../../data/collections'
import type { Reminder } from '../../data/messaging'
import { fill, longDate, until, localInput, eventDate, me, type Conv } from './shared'

type St = Reminder['status']
const TONE: Record<St, string> = { programmé: 'bg-sea/10 text-sea ring-sea/25', consigné: 'bg-sage/10 text-sage ring-sage/25', annulé: 'bg-white/[0.04] text-bone/45 ring-white/10' }

export default function Reminders({ openConv }: { openConv: (id: string) => void }) {
  const [reminders] = useReminders()
  const [templates] = useTemplates()
  const [events] = useEvents()
  const [tab, setTab] = useState<St>('programmé')
  const [modal, setModal] = useState<null | 'manual' | 'event'>(null)
  const by = (s: St) => reminders.filter((r) => r.status === s)
  const list = useMemo(() => by(tab).sort((a, b) => tab === 'programmé' ? a.dueAt.localeCompare(b.dueAt) : b.dueAt.localeCompare(a.dueAt)), [reminders, tab]) // eslint-disable-line react-hooks/exhaustive-deps
  const next24 = by('programmé').filter((r) => Date.parse(r.dueAt) - Date.now() < 864e5).length
  const cancel = async (id: string) => { try { await action('reminder.cancel', { id }); toast('Rappel annulé') } catch (e) { toast(errText(e), 'error') } }

  return (
    <div className="space-y-5">
      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="À venir" value={by('programmé').length} hint={`dont ${next24} dans les 24 h`} />
        <Stat label="Consignés" value={by('consigné').length} hint="Connecteur WhatsApp Business non configuré" />
        <Stat label="Annulés" value={by('annulé').length} hint="Conservés au journal" />
        <Stat label="Règles actives" value="J-1 · H-2" hint="AUT-110 · toutes les minutes" />
      </Stagger>
      <Stagger i={1} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs id="rem" value={tab} onChange={setTab} items={[{ id: 'programmé', label: 'À venir', count: by('programmé').length }, { id: 'consigné', label: 'Consignés', count: by('consigné').length }, { id: 'annulé', label: 'Annulés', count: by('annulé').length }]} />
        <div className="flex flex-wrap gap-2">
          <SoftBtn icon={<CalendarPlus size={14} />} onClick={() => setModal('event')}>Rappels d’un rendez-vous</SoftBtn>
          <SoftBtn tone="gold" icon={<Plus size={14} />} onClick={() => setModal('manual')}>Rappel manuel</SoftBtn>
        </div>
      </Stagger>
      <Stagger i={2}>
        {list.length === 0 ? <Empty title={tab === 'programmé' ? 'Aucun rappel à venir' : tab === 'consigné' ? 'Aucun rappel consigné' : 'Aucun rappel annulé'}>Les visites et rendez-vous de l’agenda reçoivent automatiquement leurs rappels J-1 (18:00) et H-2.</Empty> : (
          <div className="grid gap-3 lg:grid-cols-2">
            {list.map((r) => {
              const ev = events.find((e) => e.id === r.eventId)
              const tpl = templates.find((t) => t.id === r.template)
              return (
                <Card key={r.id} pad={false}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <span className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1', TONE[r.status])}><BellRinging size={17} weight="light" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><span className="text-[14px] font-medium">{r.target}</span><span className="num rounded-full bg-white/[0.05] px-2 py-px text-[10.5px] text-bone/70 ring-1 ring-white/[0.08]">{r.rule}</span><span className={clsx('rounded-full px-2 py-px text-[10.5px] ring-1', TONE[r.status])}>{r.status}</span></div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-mist"><Clock size={11} />{longDate(r.dueAt)}{r.status === 'programmé' && <span className="text-sea">· {until(r.dueAt)}</span>}</div>
                      </div>
                      {r.status === 'programmé' && <button onClick={() => cancel(r.id)} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] text-coral ring-1 ring-coral/25 transition hover:bg-coral/10"><X size={11} />Annuler</button>}
                    </div>
                    <p className="mt-3 rounded-xl bg-white/[0.03] p-3 text-[12.5px] leading-relaxed text-bone/80 ring-1 ring-white/[0.05]">{r.text}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-mist">
                      {tpl && <span>Modèle : <span className="text-bone/70">{tpl.name}</span></span>}
                      {ev && <span>RDV : <span className="text-bone/70">{ev.title} · {ev.day}/10 {ev.start}</span></span>}
                      <span className="flex items-center gap-1">{r.createdBy.startsWith('Routine') && <Lightning size={11} className="text-champagne-300" />}{r.createdBy}</span>
                      {r.dossierId && <Link to={`/app/dossiers/${r.dossierId}`} className="hover:text-bone">Dossier →</Link>}
                      {r.conversationId && <button onClick={() => openConv(r.conversationId!)} className="flex items-center gap-1 text-champagne-300 hover:underline"><ChatsCircle size={11} />Conversation</button>}
                    </div>
                    {r.status === 'consigné' && <p className="mt-2 text-[11px] text-mist">Consigné dans la conversation — connecteur WhatsApp Business non configuré : aucun envoi réel.</p>}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Stagger>
      <ManualModal open={modal === 'manual'} onClose={() => setModal(null)} />
      <EventModal open={modal === 'event'} onClose={() => setModal(null)} events={events.filter((e) => ['rdv', 'visite', 'signature'].includes(e.kind) && eventDate(e).getTime() > Date.now()).sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime())} />
    </div>
  )
}

function ManualModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, ops] = useReminders()
  const [templates] = useTemplates()
  const [contacts] = useContacts()
  const [convs, convOps] = useConversations()
  const wa = templates.filter((t) => t.channel === 'whatsapp' && t.approved)
  const [contactId, setContactId] = useState('')
  const [tplId, setTplId] = useState('tpl-rdv')
  const [when, setWhen] = useState(() => { const d = new Date(Date.now() + 864e5); d.setHours(9, 0, 0, 0); return localInput(d) })
  const c = contacts.find((x) => x.id === contactId)
  const d = new Date(when)
  const preview = fill(templates.find((t) => t.id === tplId)?.body ?? '', { prenom: c?.name.split(' ')[0] ?? '{{prenom}}', conseiller: me.name, date: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }), heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) })
  return (
    <Modal open={open} onClose={onClose} title="Rappel manuel" kicker="WhatsApp · modèle approuvé" width={600}>
      <AsyncForm submitLabel="Programmer le rappel" onCancel={onClose} success="Rappel programmé — traité par la routine AUT-110 à l’échéance" onSubmit={async (v) => {
        if (!c) throw new Error('Choisissez un contact')
        const due = new Date(v.dueAt)
        if (!(due.getTime() > Date.now())) throw new Error('L’échéance doit être dans le futur')
        if (!v.text.trim()) throw new Error('Le texte du rappel est vide')
        let conv = (convs as Conv[]).find((x) => x.channel === 'whatsapp' && (x.contactId === c.id || x.title === c.name))
        if (!conv) conv = await convOps.create({ title: c.name, subtitle: c.org ?? 'Contact', channel: 'whatsapp', kind: 'direct', avatar: c.photo, contactId: c.id, dossierId: c.dossiers[0], tags: ['Rappel'], unread: 0, status: 'open', optIn: true, lastAt: new Date().toISOString(), lastText: '' }) as Conv
        await ops.create({ kind: 'whatsapp', rule: 'manuel', target: c.name, text: v.text.trim(), template: tplId, dueAt: due.toISOString(), status: 'programmé', createdBy: me.name, conversationId: conv.id, dossierId: c.dossiers[0] })
        onClose()
      }}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Contact"><Select name="contact" required value={contactId} onChange={(e) => setContactId(e.target.value)}><option value="">Choisir…</option>{contacts.map((x) => <option key={x.id} value={x.id}>{x.name}{x.org ? ` · ${x.org}` : ''}</option>)}</Select></Field>
          <Field label="Échéance"><Input name="dueAt" type="datetime-local" required min={localInput(new Date())} value={when} onChange={(e) => setWhen(e.target.value)} className="[color-scheme:dark]" /></Field>
        </div>
        <Field label="Modèle approuvé"><Select value={tplId} onChange={(e) => setTplId(e.target.value)}>{wa.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
        <Field label="Texte" hint="Pré-rempli depuis le modèle ; complétez les variables restantes."><Textarea key={`${tplId}-${contactId}-${when}`} name="text" rows={4} defaultValue={preview} /></Field>
      </AsyncForm>
    </Modal>
  )
}

function EventModal({ open, onClose, events }: { open: boolean; onClose: () => void; events: { id: string; title: string; day: number; start: string; who: string }[] }) {
  return (
    <Modal open={open} onClose={onClose} title="Rappels d’un rendez-vous" kicker="J-1 à 18:00 et H-2 · modèle de visite ou de RDV">
      <AsyncForm submitLabel="Programmer" onCancel={onClose} onSubmit={async (v) => {
        if (!v.event) throw new Error('Choisissez un rendez-vous')
        const r = await action<unknown[]>('reminders.scheduleEvent', { eventId: v.event })
        toast(`${r.length} rappel(s) programmé(s)`); onClose()
      }}>
        <Field label="Rendez-vous à venir">
          <Select name="event" required defaultValue="">{[<option key="" value="">Choisir…</option>, ...events.map((e) => <option key={e.id} value={e.id}>{e.day}/10 {e.start} — {e.title} · {e.who}</option>)]}</Select>
        </Field>
        <p className="text-[11.5px] text-mist">Si des rappels existent déjà pour ce rendez-vous, de nouveaux sont ajoutés (programmation manuelle). Un rendez-vous trop proche est refusé.</p>
      </AsyncForm>
    </Modal>
  )
}
