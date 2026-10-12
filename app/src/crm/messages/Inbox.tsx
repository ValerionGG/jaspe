// Boîte de réception : colonne 1 (boîtes, canaux, équipe, tags), colonne 2 (liste), puis fil et contexte.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import {
  Tray, EnvelopeSimple, At, ClockCountdown, CheckCircle, Plus, MagnifyingGlass, Lock, Hash, Tag, Checks, X, SortAscending, Square, CheckSquare, PushPin, Keyboard,
} from '@phosphor-icons/react'
import { EXPO } from '../../ui/kit'
import { Empty } from '../ui'
import { Modal, Field, Input, AsyncForm, toast, errText } from '../forms'
import { action } from '../../data/store'
import { useConversations, useMessages, useAgents } from '../../data/collections'
import type { Channel } from '../../data/messaging'
import { CH, rel, isSnoozed, waiting, waitLabel, ConvAvatar, TagChip, useTags, useOutside, Menu, menuItem, eyebrow, me, type Conv, type Msg } from './shared'
import Thread from './Thread'
import Context from './Context'

type Box = 'all' | 'unread' | 'mine' | 'snoozed' | 'done'
type Sort = 'recent' | 'unread' | 'sla'
const BOXES: { id: Box; label: string; icon: typeof Tray }[] = [
  { id: 'all', label: 'Toutes', icon: Tray }, { id: 'unread', label: 'Non lues', icon: EnvelopeSimple }, { id: 'mine', label: 'Assignées à moi', icon: At },
  { id: 'snoozed', label: 'En attente', icon: ClockCountdown }, { id: 'done', label: 'Terminées', icon: CheckCircle },
]
const EXT: Channel[] = ['whatsapp', 'email', 'sms', 'portal']
const SORTS: Record<Sort, string> = { recent: 'Plus récentes', unread: 'Non lues d’abord', sla: 'Attente la plus longue' }
const inBox = (c: Conv, b: Box) => b === 'done' ? c.status === 'done' : b === 'snoozed' ? isSnoozed(c)
  : c.status !== 'done' && !isSnoozed(c) && (b === 'all' || (b === 'unread' && c.unread > 0) || (b === 'mine' && c.assignee === me.id))
const typing = (e: KeyboardEvent) => { const t = e.target as HTMLElement; return t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) }

export default function Inbox({ selected, select }: { selected: string | null; select: (id: string | null) => void }) {
  const [convs, ops] = useConversations()
  const [msgs] = useMessages()
  const [tags, addTag] = useTags()
  const [box, setBox] = useState<Box>('all')
  const [channel, setChannel] = useState<Channel | null>(null)
  const [tag, setTag] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('recent')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [pane, setPane] = useState<'list' | 'thread' | 'context'>(selected ? 'thread' : 'list')
  const [ctx, setCtx] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1680)
  const [newChannel, setNewChannel] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [bulkTag, setBulkTag] = useState(false)
  const sortRef = useOutside<HTMLDivElement>(sortOpen, useCallback(() => setSortOpen(false), []))
  const bulkRef = useOutside<HTMLDivElement>(bulkTag, useCallback(() => setBulkTag(false), []))

  const byConv = useMemo(() => {
    const m = new Map<string, Msg[]>()
    for (const x of msgs as Msg[]) { if (!m.has(x.conversationId)) m.set(x.conversationId, []); m.get(x.conversationId)!.push(x) }
    m.forEach((l) => l.sort((a, b) => a.at.localeCompare(b.at)))
    return m
  }, [msgs])
  const all = convs as Conv[]
  const conv = all.find((c) => c.id === selected)
  const last = (c: Conv) => byConv.get(c.id)?.at(-1)

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    const r = all.filter((c) => {
      if (channel ? c.channel !== channel || (channel === 'internal' ? c.status === 'done' : !inBox(c, box)) : !inBox(c, box)) return false
      if (tag && !c.tags.includes(tag)) return false
      if (!s) return true
      return [c.title, c.subtitle, c.topic, c.lastText, ...c.tags, ...(byConv.get(c.id) ?? []).map((m) => m.text)].some((t) => t?.toLowerCase().includes(s))
    })
    const w = (c: Conv) => waiting(c, byConv.get(c.id)?.at(-1))
    return r.sort((a, b) => sort === 'sla' ? w(b) - w(a) || b.lastAt.localeCompare(a.lastAt)
      : sort === 'unread' ? (b.unread > 0 ? 1 : 0) - (a.unread > 0 ? 1 : 0) || b.lastAt.localeCompare(a.lastAt)
        : Number(!!b.pinned) - Number(!!a.pinned) || b.lastAt.localeCompare(a.lastAt))
  }, [all, box, channel, tag, q, sort, byConv])

  const open = useCallback((id: string) => { select(id); setPane('thread') }, [select])

  // Lecture : à l’ouverture d’une conversation non lue.
  useEffect(() => { if (conv && conv.unread > 0) action('conversation.read', { id: conv.id }).catch(() => {}) }, [conv?.id, conv?.unread]) // eslint-disable-line react-hooks/exhaustive-deps

  // Raccourcis façon Superhuman : J / K pour naviguer, E pour terminer.
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return
      const i = list.findIndex((c) => c.id === selected)
      if (e.key === 'j' || e.key === 'k') { const n = list[Math.min(list.length - 1, Math.max(0, i + (e.key === 'j' ? 1 : -1)))]; if (n) open(n.id) }
      if (e.key === 'e' && conv && conv.kind === 'direct') { ops.update(conv.id, { status: conv.status === 'done' ? 'open' : 'done' }).then(() => toast(conv.status === 'done' ? 'Conversation rouverte' : 'Conversation terminée'), (x) => toast(errText(x), 'error')) }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [list, selected, conv, ops, open])

  const count = (b: Box) => all.filter((c) => c.kind === 'direct' && inBox(c, b)).length
  const unreadOf = (ch: Channel) => all.filter((c) => c.channel === ch && c.status !== 'done').reduce((n, c) => n + c.unread, 0)
  const team = all.filter((c) => c.kind === 'channel')

  const bulk = async (kind: 'read' | 'done' | 'tag', t?: string) => {
    const ids = [...sel]
    try {
      await Promise.all(ids.map((id) => {
        const c = all.find((x) => x.id === id)!
        if (kind === 'read') return c.unread ? action('conversation.read', { id }) : null
        if (kind === 'done') return ops.update(id, { status: 'done' })
        return ops.update(id, { tags: [...new Set([...c.tags, t!])] })
      }))
      toast(kind === 'read' ? `${ids.length} conversation(s) marquée(s) lue(s)` : kind === 'done' ? `${ids.length} conversation(s) terminée(s)` : `Tag « ${t} » ajouté à ${ids.length} conversation(s)`)
      setSel(new Set()); setBulkTag(false)
    } catch (e) { toast(errText(e), 'error') }
  }
  const toggleSel = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const pickBox = (b: Box) => { setBox(b); setChannel(null) }

  return (
    <div className="relative flex h-[max(560px,calc(100dvh-19rem))] overflow-hidden rounded-[1.4rem] bg-white/[0.02] p-1 ring-1 ring-white/[0.06] xl:h-[max(600px,calc(100dvh-18.5rem))]">
      <div className="flex min-w-0 flex-1 overflow-hidden rounded-[calc(1.4rem-0.25rem)] bg-ink-800/80 shadow-bezel">
        {/* ——— Colonne 1 ——— */}
        <aside className="thin-scroll hidden w-[208px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-white/[0.06] p-3 xl:flex">
          <div>
            <div className={clsx(eyebrow, 'mb-1.5 px-2')}>Boîtes</div>
            {BOXES.map((b) => <Row key={b.id} active={!channel && box === b.id} onClick={() => pickBox(b.id)} icon={<b.icon size={15} weight="light" />} label={b.label} n={count(b.id)} hot={b.id === 'unread'} />)}
          </div>
          <div>
            <div className={clsx(eyebrow, 'mb-1.5 px-2')}>Canaux</div>
            {EXT.map((ch) => { const I = CH[ch].icon; const n = all.filter((c) => c.channel === ch && inBox(c, box)).length; const u = unreadOf(ch)
              return <Row key={ch} active={channel === ch} onClick={() => setChannel(channel === ch ? null : ch)} icon={<I size={15} weight="light" className={CH[ch].text} />} label={CH[ch].label} n={u || n} hot={u > 0} /> })}
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between px-2"><span className={eyebrow}>Équipe</span><button onClick={() => setNewChannel(true)} aria-label="Créer un canal" title="Créer un canal" className="rounded-full p-1 text-mist hover:bg-white/[0.06] hover:text-bone"><Plus size={12} /></button></div>
            {team.map((c) => <Row key={c.id} active={selected === c.id} onClick={() => { setChannel('internal'); open(c.id) }} icon={c.private ? <Lock size={14} weight="light" /> : <Hash size={14} weight="light" />} label={c.title} n={c.unread} hot={c.unread > 0} mono />)}
          </div>
          <TagFilter tags={tags} tag={tag} setTag={setTag} addTag={addTag} />
        </aside>

        {/* ——— Colonne 2 ——— */}
        <section className={clsx('min-w-0 flex-col border-r border-white/[0.06] xl:flex xl:w-[312px] xl:shrink-0', pane === 'list' ? 'flex w-full' : 'hidden')}>
          <div className="space-y-2.5 border-b border-white/[0.06] p-3">
            <div className="flex items-center gap-2">
              <label className="flex flex-1 items-center gap-2 rounded-full bg-white/[0.03] px-3 py-2 ring-1 ring-white/[0.07] focus-within:ring-champagne/50">
                <MagnifyingGlass size={14} className="text-mist" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans les messages…" className="w-full bg-transparent text-[12.5px] outline-none placeholder:text-mist" />
                {q && <button onClick={() => setQ('')} aria-label="Effacer"><X size={12} className="text-mist" /></button>}
              </label>
              <div ref={sortRef} className="relative">
                <button onClick={() => setSortOpen(!sortOpen)} title={`Tri : ${SORTS[sort]}`} aria-label="Trier" className={clsx('flex h-9 w-9 items-center justify-center rounded-full ring-1 transition', sortOpen ? 'bg-champagne/15 text-champagne-300 ring-champagne/30' : 'bg-white/[0.03] text-bone/70 ring-white/[0.07] hover:text-bone')}><SortAscending size={15} weight="light" /></button>
                {sortOpen && <Menu className="right-0 top-11 w-56">{(Object.keys(SORTS) as Sort[]).map((s) => <button key={s} onClick={() => { setSort(s); setSortOpen(false) }} className={clsx(menuItem, sort === s && 'text-champagne-300')}>{sort === s ? <Checks size={13} /> : <span className="w-[13px]" />}{SORTS[s]}</button>)}</Menu>}
              </div>
            </div>
            {/* Boîtes en pastilles (mobile et tablette) */}
            <div className="scrollbar-none -mx-3 flex gap-1.5 overflow-x-auto px-3 xl:hidden">
              {BOXES.map((b) => <Chip key={b.id} active={!channel && box === b.id} onClick={() => pickBox(b.id)}>{b.label} <span className="num text-mist">{count(b.id)}</span></Chip>)}
              {[...EXT, 'internal' as Channel].map((ch) => <Chip key={ch} active={channel === ch} onClick={() => setChannel(channel === ch ? null : ch)}>{CH[ch].label}</Chip>)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-mist">
              <span>{list.length} conversation{list.length > 1 ? 's' : ''}{channel ? ` · ${CH[channel].label}` : ''}{tag ? ` · ${tag}` : ''}</span>
              <button onClick={() => setSel(sel.size === list.length && list.length ? new Set() : new Set(list.map((c) => c.id)))} className="hover:text-bone">{sel.size && sel.size === list.length ? 'Tout désélectionner' : 'Tout sélectionner'}</button>
            </div>
          </div>

          <AnimatePresence>
            {sel.size > 0 && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EXPO }} className="border-b border-white/[0.06] bg-champagne/[0.06]">
                <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 text-[12px]">
                  <span className="num mr-1 text-champagne-300">{sel.size} sél.</span>
                  <BulkBtn onClick={() => bulk('read')}><Checks size={13} />Lu</BulkBtn>
                  <BulkBtn onClick={() => bulk('done')}><CheckCircle size={13} />Terminer</BulkBtn>
                  <div ref={bulkRef} className="relative">
                    <BulkBtn onClick={() => setBulkTag(!bulkTag)}><Tag size={13} />Taguer</BulkBtn>
                    {bulkTag && <Menu className="left-0 top-9 w-48">{tags.map((t) => <button key={t} onClick={() => bulk('tag', t)} className={menuItem}>{t}</button>)}</Menu>}
                  </div>
                  <button onClick={() => setSel(new Set())} aria-label="Annuler la sélection" className="ml-auto text-mist hover:text-bone"><X size={14} /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="thin-scroll flex-1 overflow-y-auto p-1.5">
            {list.length === 0 ? <div className="p-3"><Empty title="Rien ici">{q ? 'Aucun message ne correspond à la recherche.' : 'Aucune conversation dans cette vue.'}</Empty></div>
              : list.map((c) => <Item key={c.id} c={c} last={last(c)} active={c.id === selected} checked={sel.has(c.id)} onCheck={() => toggleSel(c.id)} onOpen={() => open(c.id)} selecting={sel.size > 0} />)}
          </div>
          <div className="hidden items-center gap-2 border-t border-white/[0.06] px-3 py-2 text-[10.5px] text-mist xl:flex"><Keyboard size={13} /><kbd className="num">J</kbd>/<kbd className="num">K</kbd> naviguer · <kbd className="num">E</kbd> terminer · <kbd className="num">⌘↵</kbd> envoyer</div>
        </section>

        {/* ——— Colonne 3 ——— */}
        <section className={clsx('min-w-0 flex-1 flex-col xl:flex', pane === 'thread' ? 'flex' : 'hidden')}>
          {conv ? <Thread key={conv.id} conv={conv} messages={byConv.get(conv.id) ?? []} onBack={() => setPane('list')} ctxOpen={ctx} onContext={() => { setCtx(!ctx); setPane('context') }} onMobileContext={() => setPane('context')} />
            : <div className="flex flex-1 items-center justify-center p-8"><div className="max-w-sm text-center"><div className="display text-3xl">Choisissez une <span className="italic text-champagne-300">conversation</span></div><p className="mt-2 text-[13px] text-bone/50">WhatsApp, e-mails, SMS, leads portails et canaux d’équipe réunis dans un seul fil. Les réponses externes sont consignées tant que les connecteurs ne sont pas configurés.</p></div></div>}
        </section>

        {/* ——— Colonne 4 ——— */}
        {conv && (
          <aside className={clsx('thin-scroll w-full flex-col overflow-y-auto bg-ink-800 xl:absolute xl:inset-y-1 xl:right-1 xl:z-20 xl:w-[330px] xl:rounded-r-[calc(1.4rem-0.25rem)] xl:border-l xl:border-white/[0.08] xl:shadow-float min-[1680px]:static min-[1680px]:inset-auto min-[1680px]:rounded-none min-[1680px]:shadow-none',
            pane === 'context' ? 'flex' : 'hidden', ctx ? 'xl:flex' : 'xl:hidden')}>
            <Context conv={conv} messages={byConv.get(conv.id) ?? []} onClose={() => { setCtx(false); setPane('thread') }} />
          </aside>
        )}
      </div>

      <NewChannel open={newChannel} onClose={() => setNewChannel(false)} onCreated={(id) => { setChannel('internal'); open(id) }} create={ops.create} />
    </div>
  )
}

function Row({ active, onClick, icon, label, n, hot, mono }: { active: boolean; onClick: () => void; icon: ReactNode; label: string; n?: number; hot?: boolean; mono?: boolean }) {
  return (
    <button onClick={onClick} className={clsx('relative flex w-full items-center gap-2.5 rounded-xl px-2 py-[7px] text-left text-[12.5px] transition-colors', active ? 'text-bone' : 'text-bone/65 hover:bg-white/[0.04] hover:text-bone')}>
      {active && <motion.span layoutId="msg-box" className="absolute inset-0 rounded-xl bg-white/[0.07] ring-1 ring-white/[0.08]" transition={{ duration: 0.45, ease: EXPO }} />}
      <span className={clsx('relative', active ? 'text-champagne-300' : 'text-mist')}>{icon}</span>
      <span className={clsx('relative flex-1 truncate', mono && 'text-[12px]')}>{label}</span>
      {!!n && <span className={clsx('num relative rounded-full px-1.5 text-[10.5px]', hot ? 'bg-champagne/15 text-champagne-300' : 'text-mist')}>{n}</span>}
    </button>
  )
}
const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) =>
  <button onClick={onClick} className={clsx('shrink-0 rounded-full px-3 py-1 text-[11.5px] ring-1 transition', active ? 'bg-champagne/15 text-champagne-300 ring-champagne/30' : 'bg-white/[0.03] text-bone/65 ring-white/[0.07]')}>{children}</button>
const BulkBtn = ({ onClick, children }: { onClick: () => void; children: ReactNode }) =>
  <button onClick={onClick} className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-2.5 py-1 text-bone/85 ring-1 ring-white/[0.08] transition hover:bg-white/[0.1]">{children}</button>

function Item({ c, last, active, checked, onCheck, onOpen, selecting }: { c: Conv; last?: Msg; active: boolean; checked: boolean; onCheck: () => void; onOpen: () => void; selecting: boolean }) {
  const w = waiting(c, last)
  const author = c.kind === 'channel' && last ? (c.lastText.startsWith(last.author.split(' ')[0]) ? '' : `${last.author.split(' ')[0]} : `) : last?.dir === 'out' ? 'Vous : ' : ''
  return (
    <div onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className={clsx('group relative flex cursor-pointer gap-3 rounded-2xl p-2.5 transition-colors', active ? 'bg-white/[0.06] ring-1 ring-white/[0.08]' : 'hover:bg-white/[0.03]')}>
      {active && <motion.span layoutId="msg-active" className="absolute left-0 top-3 h-6 w-[3px] rounded-r bg-champagne" transition={{ duration: 0.4, ease: EXPO }} />}
      <div className="relative">
        <span className={clsx('transition-opacity', (selecting || checked) ? 'opacity-0' : 'group-hover:opacity-0')}><ConvAvatar c={c} size={38} /></span>
        <button onClick={(e) => { e.stopPropagation(); onCheck() }} aria-label={checked ? 'Désélectionner' : 'Sélectionner'} className={clsx('absolute inset-0 flex items-center justify-center rounded-full text-champagne-300 transition-opacity', (selecting || checked) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
          {checked ? <CheckSquare size={20} weight="fill" /> : <Square size={20} weight="light" className="text-bone/60" />}
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className={clsx('truncate text-[13px]', c.unread ? 'font-medium text-bone' : 'text-bone/85')}>{c.kind === 'channel' ? `#${c.title}` : c.title}</span>
          {c.pinned && <PushPin size={11} weight="fill" className="shrink-0 text-champagne/70" />}
          <span className={clsx('num ml-auto shrink-0 text-[10.5px]', c.unread ? 'text-champagne-300' : 'text-mist')}>{rel(c.lastAt)}</span>
        </div>
        <div className="mt-0.5 flex items-start gap-2">
          <p className={clsx('line-clamp-2 flex-1 text-[12px] leading-snug', c.unread ? 'text-bone/75' : 'text-bone/45')}>{author}{c.lastText || <span className="italic">Aucun message</span>}</p>
          {c.unread > 0 && <span className="num mt-0.5 flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-champagne px-1 text-[10px] font-medium text-ink">{c.unread}</span>}
        </div>
        {(w > 0 || c.tags.length > 0 || isSnoozed(c)) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {w > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-2 py-px text-[10.5px] text-coral ring-1 ring-coral/25"><ClockCountdown size={10} />{waitLabel(w)}</span>}
            {isSnoozed(c) && <span className="inline-flex items-center gap-1 rounded-full bg-sea/10 px-2 py-px text-[10.5px] text-sea ring-1 ring-sea/25"><ClockCountdown size={10} />retour {rel(c.snoozedUntil)}</span>}
            {c.tags.slice(0, 2).map((t) => <TagChip key={t} t={t} />)}
            {c.tags.length > 2 && <span className="text-[10.5px] text-mist">+{c.tags.length - 2}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

function TagFilter({ tags, tag, setTag, addTag }: { tags: string[]; tag: string | null; setTag: (t: string | null) => void; addTag: (t: string) => Promise<void> }) {
  const [adding, setAdding] = useState(false)
  const [v, setV] = useState('')
  const submit = async () => {
    const t = v.trim().replace(/^./, (c) => c.toUpperCase())
    if (!t) return setAdding(false)
    if (tags.some((x) => x.toLowerCase() === t.toLowerCase())) { toast('Ce tag existe déjà', 'info'); return }
    try { await addTag(t); toast(`Tag « ${t} » créé`); setV(''); setAdding(false) } catch (e) { toast(errText(e), 'error') }
  }
  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-2"><span className={eyebrow}>Tags</span><button onClick={() => setAdding(!adding)} aria-label="Créer un tag" title="Créer un tag" className="rounded-full p-1 text-mist hover:bg-white/[0.06] hover:text-bone"><Plus size={12} /></button></div>
      {adding && <input autoFocus value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false) }} onBlur={submit} placeholder="Nouveau tag…" className="mb-2 w-full rounded-xl bg-white/[0.03] px-3 py-1.5 text-[12px] outline-none ring-1 ring-champagne/40 placeholder:text-mist" />}
      <div className="flex flex-wrap gap-1 px-1">{tags.map((t) => <TagChip key={t} t={t} active={tag === t} onClick={() => setTag(tag === t ? null : t)} />)}</div>
      {tag && <button onClick={() => setTag(null)} className="mt-2 px-2 text-[11px] text-champagne-300">Retirer le filtre « {tag} »</button>}
    </div>
  )
}

function NewChannel({ open, onClose, onCreated, create }: { open: boolean; onClose: () => void; onCreated: (id: string) => void; create: (d: Partial<Conv>) => Promise<Conv> }) {
  const [agents] = useAgents()
  const [members, setMembers] = useState<Set<string>>(new Set([me.id]))
  return (
    <Modal open={open} onClose={onClose} title="Nouveau canal" kicker="Équipe · messagerie interne">
      <AsyncForm submitLabel="Créer le canal" onCancel={onClose} success="Canal créé" onSubmit={async (v) => {
        const title = v.name.trim().toLowerCase().normalize('NFC').replace(/^#/, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')
        if (!title) throw new Error('Nom du canal obligatoire')
        const priv = v.private === 'on'
        const c = await create({ title, topic: v.topic?.trim() || 'Canal d’équipe', channel: 'internal', kind: 'channel', private: priv, participants: [...members], tags: priv ? ['Off-market'] : [], unread: 0, status: 'open', lastAt: new Date().toISOString(), lastText: `Canal créé par ${me.name}` })
        onClose(); onCreated(c.id)
      }}>
        <Field label="Nom" hint="Minuscules et tirets, ex. « mandats-cannes »"><Input name="name" required placeholder="#mandats-cannes" /></Field>
        <Field label="Sujet"><Input name="topic" placeholder="À quoi sert ce canal ?" /></Field>
        <label className="flex items-center gap-2.5 text-[13px] text-bone/80"><input type="checkbox" name="private" className="accent-[rgb(var(--acc-500))]" /> Canal privé (accès restreint aux membres)</label>
        <Field label="Membres">
          <div className="flex flex-wrap gap-1.5">{agents.map((a) => { const on = members.has(a.id); return (
            <button type="button" key={a.id} onClick={() => setMembers((s) => { const n = new Set(s); if (on && a.id !== me.id) n.delete(a.id); else n.add(a.id); return n })} className={clsx('inline-flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-[12px] ring-1 transition', on ? 'bg-champagne/[0.12] text-bone ring-champagne/30' : 'bg-white/[0.03] text-bone/55 ring-white/[0.08]')}>
              <img src={a.photo} alt="" className="h-5 w-5 rounded-full object-cover" />{a.name.split(' ')[0]}
            </button>) })}</div>
        </Field>
      </AsyncForm>
    </Modal>
  )
}
