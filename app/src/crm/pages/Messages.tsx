// Messagerie unifiée : boîte de réception (4 colonnes), rappels WhatsApp, modèles.
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChatCircleDots, Plus, Lightning } from '@phosphor-icons/react'
import { PageHeader, Tabs, SoftBtn, Stagger } from '../ui'
import { Modal, Field, Select, Textarea, AsyncForm, toast } from '../forms'
import { action } from '../../data/store'
import { live } from '../../data/live'
import { useConversations, useMessages, useReminders, useTemplates, useContacts } from '../../data/collections'
import type { Channel } from '../../data/messaging'
import { CH, waiting, me, type Conv, type Msg } from '../messages/shared'
import Inbox from '../messages/Inbox'
import Reminders from '../messages/Reminders'
import Templates from '../messages/Templates'

type Tab = 'inbox' | 'rappels' | 'modeles'
const SAMPLES = [
  'Bonjour, je fais une offre à 1,8 M€. Possible de visiter à nouveau demain ?',
  'Pouvez-vous m’envoyer le DPE et le PV d’AG avant jeudi ?',
  'C’est urgent : le notaire attend le compromis signé ce soir.',
  'Merci pour hier, tout est parfait de notre côté.',
]

export default function Messages() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'inbox'
  const c = params.get('c')
  const [convs] = useConversations()
  const [msgs] = useMessages()
  const [reminders] = useReminders()
  const [templates] = useTemplates()
  const [modal, setModal] = useState<null | 'sim' | 'new'>(null)
  const all = convs as Conv[]
  const unread = all.reduce((n, x) => n + (x.status !== 'done' ? x.unread : 0), 0)
  const late = all.filter((x) => waiting(x, (msgs as Msg[]).filter((m) => m.conversationId === x.id).sort((a, b) => a.at.localeCompare(b.at)).at(-1)) > 0).length
  const upcoming = reminders.filter((r) => r.status === 'programmé').length
  const setTab = (t: Tab) => setParams(t === 'inbox' ? (c ? { c } : {}) : { tab: t })
  const select = (id: string | null) => setParams(id ? { c: id } : {})

  return (
    <div>
      <PageHeader kicker="Travail · Messagerie unifiée" title={<>Une seule boîte, <span className="italic text-champagne-300">tous les canaux</span></>}
        sub={<><span className="text-bone/80">{unread} non lu{unread > 1 ? 's' : ''}</span> · <span className={late ? 'text-coral' : ''}>{late} client{late > 1 ? 's' : ''} en attente depuis plus de 2 h</span> · {upcoming} rappel{upcoming > 1 ? 's' : ''} WhatsApp programmé{upcoming > 1 ? 's' : ''} · {templates.length} modèles</>}
        actions={<>
          <SoftBtn icon={<Lightning size={14} />} onClick={() => setModal('sim')}>Simuler un message entrant</SoftBtn>
          <SoftBtn tone="gold" icon={<Plus size={14} />} onClick={() => setModal('new')}>Nouvelle conversation</SoftBtn>
        </>} />
      <Stagger className="mb-4">
        <Tabs id="msg-tabs" value={tab} onChange={setTab} items={[
          { id: 'inbox', label: 'Boîte de réception', count: unread },
          { id: 'rappels', label: 'Rappels WhatsApp', count: upcoming },
          { id: 'modeles', label: 'Modèles', count: templates.length },
        ]} />
      </Stagger>
      <Stagger i={1}>
        {tab === 'inbox' && <Inbox selected={c} select={select} />}
        {tab === 'rappels' && <Reminders openConv={(id) => select(id)} />}
        {tab === 'modeles' && <Templates />}
      </Stagger>
      <SimulateModal open={modal === 'sim'} onClose={() => setModal(null)} current={c} onDone={(id) => select(id)} />
      <NewConvModal open={modal === 'new'} onClose={() => setModal(null)} onDone={(id) => select(id)} />
    </div>
  )
}

function SimulateModal({ open, onClose, current, onDone }: { open: boolean; onClose: () => void; current: string | null; onDone: (id: string) => void }) {
  const [convs, ops] = useConversations()
  const direct = (convs as Conv[]).filter((x) => x.kind === 'direct')
  const [text, setText] = useState(SAMPLES[0])
  const def = direct.find((x) => x.id === current)?.id ?? direct[0]?.id
  return (
    <Modal open={open} onClose={onClose} title="Simuler un message entrant" kicker="Démo · classement automatique AUT-112">
      <AsyncForm submitLabel="Recevoir le message" onCancel={onClose} onSubmit={async (v) => {
        const conv = direct.find((x) => x.id === v.conv)
        if (!conv) throw new Error('Choisissez une conversation')
        if (!text.trim()) throw new Error('Le message est vide')
        const before = conv.tags
        await action('message.receive', { conversationId: conv.id, text: text.trim() })
        await ops.reload()
        const after = ((live.conversations ?? []) as Conv[]).find((x) => x.id === conv.id)?.tags ?? before
        const added = after.filter((t) => !before.includes(t))
        toast(added.length ? `Classé automatiquement : ${added.join(', ')} · notification envoyée` : 'Message reçu · notification envoyée (aucun nouveau tag)')
        onClose(); onDone(conv.id)
      }}>
        <Field label="Conversation"><Select name="conv" defaultValue={def} key={def}>{direct.map((x) => <option key={x.id} value={x.id}>{x.title} · {CH[x.channel].label}</option>)}</Select></Field>
        <Field label="Message du client" hint="Mots-clés détectés : offre / prix, visite, documents, urgent, notaire…"><Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} /></Field>
        <div className="flex flex-wrap gap-1.5">{SAMPLES.map((s) => <button type="button" key={s} onClick={() => setText(s)} className="rounded-full bg-white/[0.04] px-3 py-1 text-left text-[11.5px] text-bone/75 ring-1 ring-white/[0.08] hover:bg-white/[0.08]">{s.slice(0, 44)}…</button>)}</div>
      </AsyncForm>
    </Modal>
  )
}

function NewConvModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (id: string) => void }) {
  const [, ops] = useConversations()
  const [contacts] = useContacts()
  const [channel, setChannel] = useState<Channel>('whatsapp')
  return (
    <Modal open={open} onClose={onClose} title="Nouvelle conversation" kicker="Contact du registre">
      <AsyncForm submitLabel="Ouvrir la conversation" onCancel={onClose} success="Conversation créée" onSubmit={async (v) => {
        const ct = contacts.find((x) => x.id === v.contact)
        if (!ct) throw new Error('Choisissez un contact')
        const role = ct.roles[0]
        const created = await ops.create({
          title: ct.name, subtitle: [ct.org, ct.city].filter(Boolean).join(' · '), channel, kind: 'direct', avatar: ct.photo, contactId: ct.id, dossierId: ct.dossiers[0],
          tags: role === 'vendeur' ? ['Vendeur'] : role === 'acquereur' ? ['Acquéreur'] : role === 'notaire' ? ['Notaire'] : [], unread: 0, status: 'open', assignee: me.id,
          lastAt: new Date().toISOString(), lastText: '', ...(channel === 'whatsapp' ? { optIn: v.optin === 'on' } : {}),
        })
        onClose(); onDone(created.id)
      }}>
        <Field label="Contact"><Select name="contact" required defaultValue="">{[<option key="" value="">Choisir…</option>, ...contacts.map((x) => <option key={x.id} value={x.id}>{x.name}{x.org ? ` · ${x.org}` : ''}</option>)]}</Select></Field>
        <Field label="Canal"><Select value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>{(['whatsapp', 'email', 'sms'] as Channel[]).map((x) => <option key={x} value={x}>{CH[x].label}</option>)}</Select></Field>
        {channel === 'whatsapp' && <label className="flex items-start gap-2.5 text-[13px] text-bone/80"><input type="checkbox" name="optin" className="mt-1 accent-[rgb(var(--acc-500))]" /><span>Consentement WhatsApp recueilli (preuve écrite au registre). <span className="text-mist">Sans accord, tout envoi sera refusé et vous pourrez demander le consentement par e-mail.</span></span></label>}
        <p className="flex items-center gap-1.5 text-[11.5px] text-mist"><ChatCircleDots size={12} />Les envois externes sont consignés tant que le connecteur n’est pas configuré.</p>
      </AsyncForm>
    </Modal>
  )
}
