// Colonne 3 : fil de discussion rendu selon le canal + composeur riche.
import { Fragment, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import {
  ArrowLeft, SidebarSimple, CheckCircle, ArrowsClockwise, PushPin, Smiley, Translate, Paperclip, PaperPlaneRight, Sparkle, CalendarBlank, Clock, Checks, Check,
  FilePdf, Image, LinkSimple, Warning, ShieldCheck, At, X, Tag, Plus, ChatsCircle, Info, CaretDown, FileText,
} from '@phosphor-icons/react'
import { EXPO } from '../../ui/kit'
import { toast, errText } from '../forms'
import { action, uploadFile, ApiError } from '../../data/store'
import { useConversations, useMessages, useTemplates, useAgents } from '../../data/collections'
import { DELIVERABLES } from '../../data/mock'
import type { Template } from '../../data/messaging'
import {
  CH, rel, time, dayLabel, longDate, until, localInput, windowOpen, waiting, waitLabel, useConvContext, fill, missingVars, translate, isEnglish, useTags, useOutside,
  ChannelBadge, ConvAvatar, TagChip, Menu, menuItem, eyebrow, me, type Conv, type Msg,
} from './shared'
import { SnoozeMenu } from './Context'

type Att = NonNullable<Msg['attachments']>[number]
const EMOJIS = ['👍', '🎉', '👏', '❤️', '👀', '✅']
const CONNECTOR: Record<string, string> = { whatsapp: 'WhatsApp Business', email: 'SMTP', sms: 'SMS', portal: 'portail' }

/** Objet d’un e-mail : première ligne « Objet : … » si présente. */
const splitSubject = (text: string) => { const m = /^Objet\s*:\s*(.+)\n+/.exec(text); return m ? { subject: m[1], body: text.slice(m[0].length) } : { subject: '', body: text } }
const attHref = (a: Att) => (a.ref?.startsWith('/') ? a.ref : a.ref ? `/api/files/${a.ref}/raw` : undefined)

export default function Thread({ conv, messages, onBack, onContext, onMobileContext, ctxOpen }: { conv: Conv; messages: Msg[]; onBack: () => void; onContext: () => void; onMobileContext: () => void; ctxOpen: boolean }) {
  const [, convOps] = useConversations()
  const [, msgOps] = useMessages()
  const [agents] = useAgents()
  const [tags] = useTags()
  const { contact, property, vars } = useConvContext(conv)
  const [tagOpen, setTagOpen] = useState(false)
  const [snooze, setSnooze] = useState(false)
  const [showPins, setShowPins] = useState(false)
  const [translated, setTranslated] = useState<Set<string>>(new Set())
  const [picker, setPicker] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const tagRef = useOutside<HTMLDivElement>(tagOpen, useCallback(() => setTagOpen(false), []))
  const snoozeRef = useOutside<HTMLDivElement>(snooze, useCallback(() => setSnooze(false), []))
  const pickerRef = useOutside<HTMLDivElement>(!!picker, useCallback(() => setPicker(null), []))
  const internal = conv.kind === 'channel'
  const pins = messages.filter((m) => m.pinned)
  const w = waiting(conv, messages.at(-1))
  const portal = conv.channel === 'portal' ? /Lead (\S+)/.exec(conv.title)?.[1] ?? 'Portail' : ''
  const subjectBase = property?.title ?? conv.subtitle?.split('·').at(-1)?.trim() ?? conv.title

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }) }, [messages.length])

  const photoOf = (author: string) => agents.find((a) => a.name === author || a.name.split(' ')[0] === author.split(' ')[0])?.photo
  const react = async (m: Msg, e: string) => {
    const mine = new Set(m.mine ?? []), r = { ...(m.reactions ?? {}) }
    if (mine.has(e)) { mine.delete(e); r[e] = Math.max(0, (r[e] ?? 1) - 1); if (!r[e]) delete r[e] } else { mine.add(e); r[e] = (r[e] ?? 0) + 1 }
    setPicker(null)
    try { await msgOps.update(m.id, { reactions: r, mine: [...mine] }) } catch (x) { toast(errText(x), 'error') }
  }
  const pin = async (m: Msg) => { try { await msgOps.update(m.id, { pinned: !m.pinned }); toast(m.pinned ? 'Message désépinglé' : 'Message épinglé') } catch (x) { toast(errText(x), 'error') } }
  const setStatus = async (status: Conv['status']) => { try { await convOps.update(conv.id, { status, snoozedUntil: undefined }); toast(status === 'done' ? 'Conversation terminée' : 'Conversation rouverte') } catch (x) { toast(errText(x), 'error') } }
  const toggleTag = async (t: string) => { try { await convOps.update(conv.id, { tags: conv.tags.includes(t) ? conv.tags.filter((x) => x !== t) : [...conv.tags, t] }) } catch (x) { toast(errText(x), 'error') } }
  const toggleTr = (id: string) => setTranslated((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const tools = (m: Msg, side: 'left' | 'right' = 'right') => (
    <div className={clsx('absolute -top-3 z-10 hidden items-center gap-0.5 rounded-full bg-ink-700 p-0.5 shadow-float ring-1 ring-white/10 group-hover:flex', side === 'right' ? 'right-2' : 'left-2', picker === m.id && '!flex')}>
      <div ref={picker === m.id ? pickerRef : undefined} className="relative">
        <ToolBtn label="Réagir" onClick={() => setPicker(picker === m.id ? null : m.id)}><Smiley size={14} /></ToolBtn>
        {picker === m.id && <div className={clsx('absolute top-8 flex gap-0.5 rounded-full bg-ink-700 p-1 shadow-float ring-1 ring-white/10', side === 'right' ? 'right-0' : 'left-0')}>{EMOJIS.map((e) => <button key={e} onClick={() => react(m, e)} className="rounded-full px-1.5 py-0.5 text-[15px] transition hover:scale-125 hover:bg-white/[0.08]">{e}</button>)}</div>}
      </div>
      <ToolBtn label={m.pinned ? 'Désépingler' : 'Épingler'} onClick={() => pin(m)}><PushPin size={14} weight={m.pinned ? 'fill' : 'light'} className={m.pinned ? 'text-champagne-300' : ''} /></ToolBtn>
      {!internal && <ToolBtn label="Traduire (FR ⇄ EN)" onClick={() => toggleTr(m.id)}><Translate size={14} /></ToolBtn>}
    </div>
  )
  const reactions = (m: Msg) => m.reactions && Object.keys(m.reactions).length > 0 && (
    <div className="mt-1.5 flex flex-wrap gap-1">{Object.entries(m.reactions).map(([e, n]) => (
      <button key={e} onClick={() => react(m, e)} className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-px text-[12px] ring-1 transition', m.mine?.includes(e) ? 'bg-champagne/15 ring-champagne/30' : 'bg-white/[0.04] ring-white/[0.08] hover:bg-white/[0.08]')}>{e}<span className="num text-[10.5px] text-bone/70">{n}</span></button>
    ))}</div>
  )
  const tr = (m: Msg) => translated.has(m.id) && (
    <div className="mt-2 border-t border-white/[0.08] pt-2 text-[12.5px] italic text-bone/70"><span className="not-italic text-[10px] uppercase tracking-eyebrow text-mist">Traduction simulée · {translate(m.text).to}</span><br />{translate(m.text).text}</div>
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* En-tête */}
      <header className="flex items-center gap-3 border-b border-white/[0.06] px-3 py-2.5 md:px-4">
        <button onClick={onBack} aria-label="Retour à la liste" className="flex h-8 w-8 items-center justify-center rounded-full text-bone/70 hover:bg-white/[0.06] xl:hidden"><ArrowLeft size={16} /></button>
        <ConvAvatar c={conv} size={38} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><h2 className="truncate text-[15px] font-medium tracking-[-0.01em]">{internal ? `#${conv.title}` : conv.title}</h2><span className="hidden sm:inline"><ChannelBadge ch={conv.channel} size="xs" /></span>{conv.private && <span className="text-[10.5px] text-mist">privé</span>}</div>
          <div className="truncate text-[11.5px] text-mist">{internal ? `${conv.topic ?? ''} · ${conv.participants?.length ?? 0} membres` : conv.subtitle}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <div ref={tagRef} className="relative hidden md:block">
            <HeadBtn label="Tags" onClick={() => setTagOpen(!tagOpen)} active={tagOpen}><Tag size={15} weight="light" /></HeadBtn>
            {tagOpen && <Menu className="right-0 top-11 w-52">{tags.map((t) => <button key={t} onClick={() => toggleTag(t)} className={menuItem}>{conv.tags.includes(t) ? <Check size={13} className="text-champagne-300" /> : <span className="w-[13px]" />}{t}</button>)}</Menu>}
          </div>
          {!internal && (
            <div ref={snoozeRef} className="relative">
              <HeadBtn label="Mettre en attente (snooze)" onClick={() => setSnooze(!snooze)} active={snooze}><Clock size={15} weight="light" /></HeadBtn>
              {snooze && <SnoozeMenu conv={conv} onDone={() => setSnooze(false)} className="right-0 top-11" />}
            </div>
          )}
          {!internal && (conv.status === 'done'
            ? <HeadBtn label="Rouvrir" onClick={() => setStatus('open')}><ArrowsClockwise size={15} weight="light" /></HeadBtn>
            : <button onClick={() => setStatus('done')} className="hidden items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-[12px] text-bone/85 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] sm:inline-flex"><CheckCircle size={14} />Terminer</button>)}
          <span className="xl:hidden"><HeadBtn label="Contexte" onClick={onMobileContext}><Info size={15} weight="light" /></HeadBtn></span>
          <span className="hidden xl:inline"><HeadBtn label={ctxOpen ? 'Masquer le contexte' : 'Afficher le contexte'} onClick={onContext} active={ctxOpen}><SidebarSimple size={15} weight="light" className="-scale-x-100" /></HeadBtn></span>
        </div>
      </header>

      {/* Bandeaux : tags, attente, épinglés */}
      {(conv.tags.length > 0 || w > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-white/[0.04] px-4 py-2">
          {w > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-2 py-px text-[10.5px] text-coral ring-1 ring-coral/25"><Clock size={10} />{waitLabel(w)} · AUT-111</span>}
          {conv.tags.map((t) => <TagChip key={t} t={t} onRemove={() => toggleTag(t)} />)}
        </div>
      )}
      {pins.length > 0 && (
        <div className="border-b border-white/[0.04] bg-champagne/[0.04] px-4 py-2">
          <button onClick={() => setShowPins(!showPins)} className="flex w-full items-center gap-2 text-[12px] text-champagne-300"><PushPin size={13} weight="fill" className="shrink-0" /><span className="shrink-0 whitespace-nowrap">{pins.length} message{pins.length > 1 ? 's' : ''} épinglé{pins.length > 1 ? 's' : ''}</span><span className="min-w-0 truncate text-left text-bone/55">— {pins[0].text}</span><CaretDown size={12} className={clsx('ml-auto shrink-0 transition-transform', showPins && 'rotate-180')} /></button>
          <AnimatePresence>{showPins && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EXPO }} className="overflow-hidden">
            {pins.map((m) => <div key={m.id} className="mt-2 flex items-start gap-2 rounded-xl bg-white/[0.03] p-2.5 text-[12.5px] ring-1 ring-white/[0.06]"><span className="font-medium">{m.author}</span><span className="flex-1 text-bone/70">{m.text}</span><button onClick={() => pin(m)} className="text-[11px] text-mist hover:text-bone">Retirer</button></div>)}
          </motion.div>}</AnimatePresence>
        </div>
      )}

      {/* Fil */}
      <div ref={scroller} className="thin-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-5">
        {messages.length === 0 && <div className="py-16 text-center text-[13px] text-bone/45">Aucun message pour l’instant. Écrivez le premier ci-dessous.</div>}
        {messages.map((m, i) => {
          const day = i === 0 || dayLabel(messages[i - 1].at) !== dayLabel(m.at)
          const grouped = !day && messages[i - 1].author === m.author && Date.parse(m.at) - Date.parse(messages[i - 1].at) < 10 * 60e3
          return (
            <Fragment key={m.id}>
              {day && <div className="my-4 flex items-center gap-3"><span className="h-px flex-1 bg-white/[0.06]" /><span className="text-[10.5px] uppercase tracking-eyebrow text-mist">{dayLabel(m.at)}</span><span className="h-px flex-1 bg-white/[0.06]" /></div>}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EXPO }}>
                {internal || m.dir === 'internal' ? (
                  <div className={clsx('group relative flex gap-3 rounded-xl px-2 transition-colors hover:bg-white/[0.025]', grouped ? 'py-0.5' : 'mt-2 py-1.5', m.pinned && 'bg-champagne/[0.04]')}>
                    <div className="w-8 shrink-0">{!grouped && (m.ai ? <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-champagne/15 text-champagne-300"><Sparkle size={15} weight="fill" /></span>
                      : photoOf(m.author) ? <img src={photoOf(m.author)} alt="" className="h-8 w-8 rounded-lg object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-[12px]">{m.author[0]}</span>)}</div>
                    <div className="min-w-0 flex-1">
                      {!grouped && <div className="flex items-baseline gap-2"><span className="text-[13px] font-medium">{m.author}</span>{m.ai && <span className="rounded bg-champagne/15 px-1 text-[9.5px] uppercase tracking-wider text-champagne-300">IA</span>}<span className="num text-[10.5px] text-mist">{time(m.at)}</span>{m.pinned && <PushPin size={11} weight="fill" className="text-champagne-300" />}</div>}
                      <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-bone/85"><RichText text={m.text} /></p>
                      <Attachments list={m.attachments} />
                      {reactions(m)}
                    </div>
                    {tools(m)}
                  </div>
                ) : conv.channel === 'email' || conv.channel === 'portal' ? (() => { const { subject, body } = splitSubject(m.text); const out = m.dir === 'out'; return (
                  <div className={clsx('group relative my-3 rounded-2xl p-4 ring-1', out ? 'ml-6 bg-sea/[0.05] ring-sea/15 md:ml-16' : 'mr-6 bg-white/[0.03] ring-white/[0.07] md:mr-16')}>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[12px]">
                      <span className="font-medium text-bone">{m.author}</span><span className="text-mist">→ {out ? (contact?.email ?? conv.title) : `${me.name.split(' ')[0]} (${conv.channel === 'portal' ? `via ${portal}` : 'vous'})`}</span>
                      <span className="num ml-auto text-[10.5px] text-mist">{longDate(m.at)}</span>
                    </div>
                    <div className="mt-2 text-[13.5px] font-medium">{conv.channel === 'portal' ? `${portal} · demande d’information` : subject || `${out ? 'Re : ' : ''}${subjectBase}`}</div>
                    <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-bone/80"><RichText text={body} /></p>
                    {tr(m)}
                    <Attachments list={m.attachments} />
                    {out && <div className="mt-3"><Status m={m} /></div>}
                    {reactions(m)}
                    {tools(m, out ? 'left' : 'right')}
                  </div>) })() : (
                  <div className={clsx('group relative flex', m.dir === 'out' ? 'justify-end' : 'justify-start', grouped ? 'mt-1' : 'mt-3')}>
                    <div className={clsx('relative max-w-[82%] rounded-[1.15rem] px-3.5 py-2.5 ring-1 md:max-w-[70%]', m.dir === 'out' ? 'rounded-br-md bg-champagne/[0.13] ring-champagne/20' : 'rounded-bl-md bg-white/[0.045] ring-white/[0.07]', m.pinned && 'ring-champagne/50')}>
                      {m.template && <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-champagne-300"><FileText size={11} />Modèle approuvé</div>}
                      {m.author === 'Rappel automatique' && <div className="mb-1 text-[10px] uppercase tracking-wider text-sea">Rappel automatique · AUT-110</div>}
                      <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-bone/90"><RichText text={m.text} /></p>
                      {tr(m)}
                      <Attachments list={m.attachments} />
                      <div className={clsx('mt-1 flex items-center gap-1.5 text-[10.5px] text-mist', m.dir === 'out' && 'justify-end')}><span className="num">{time(m.at)}</span>{m.dir === 'out' && <Status m={m} compact />}</div>
                      {reactions(m)}
                    </div>
                    {tools(m, m.dir === 'out' ? 'left' : 'right')}
                  </div>
                )}
              </motion.div>
            </Fragment>
          )
        })}
        {conv.channel === 'whatsapp' && !windowOpen(conv) && (
          <div className="mx-auto mt-6 max-w-md rounded-2xl bg-champagne/[0.06] p-4 text-center ring-1 ring-champagne/20">
            <div className="flex items-center justify-center gap-2 text-[12.5px] font-medium text-champagne-300"><Clock size={14} />Hors fenêtre de 24 h</div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-bone/65">WhatsApp Business n’autorise une réponse libre que dans les 24 h qui suivent le dernier message du client{conv.windowUntil ? ` (fenêtre close ${rel(conv.windowUntil) === 'à l’instant' ? 'à l’instant' : `le ${longDate(conv.windowUntil)}`})` : ''}. D’ici sa prochaine réponse, seul un <span className="text-bone">modèle approuvé par Meta</span> peut être envoyé.</p>
          </div>
        )}
      </div>

      <Composer conv={conv} vars={vars} lastId={messages.at(-1)?.id} />
    </div>
  )
}

const ToolBtn = ({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) =>
  <button aria-label={label} title={label} onClick={onClick} className="flex h-7 w-7 items-center justify-center rounded-full text-bone/70 transition hover:bg-white/[0.08] hover:text-bone">{children}</button>
const HeadBtn = ({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: ReactNode }) =>
  <button aria-label={label} title={label} onClick={onClick} className={clsx('flex h-8 w-8 items-center justify-center rounded-full ring-1 transition', active ? 'bg-champagne/15 text-champagne-300 ring-champagne/30' : 'bg-white/[0.03] text-bone/70 ring-white/[0.07] hover:text-bone')}>{children}</button>

function RichText({ text }: { text: string }) {
  return <>{text.split(/(@[A-ZÉ][\wéèàç-]+|\{\{\w+\}\})/g).map((p, i) => p.startsWith('@') ? <span key={i} className="rounded bg-champagne/15 px-1 text-champagne-300">{p}</span> : p.startsWith('{{') ? <span key={i} className="rounded bg-coral/15 px-1 text-coral">{p}</span> : p)}</>
}

function Status({ m, compact }: { m: Msg; compact?: boolean }) {
  const s = m.status ?? ''
  if (s === 'programmé') return <span title={m.scheduleAt ? `Envoi programmé ${longDate(m.scheduleAt)}` : 'Programmé'} className="inline-flex items-center gap-1 text-sea"><CalendarBlank size={11} />{compact ? 'programmé' : `Programmé · ${m.scheduleAt ? longDate(m.scheduleAt) : ''}`}</span>
  if (s.startsWith('consigné')) return <span title={s} className="inline-flex items-center gap-1 text-mist"><Clock size={11} />{compact ? 'consigné' : s}</span>
  if (s === 'lu') return <span title="Lu" className="inline-flex items-center text-sea"><Checks size={13} /></span>
  if (s === 'distribué') return <span title="Distribué" className="inline-flex items-center"><Checks size={13} /></span>
  return <span className="inline-flex items-center gap-1"><Check size={11} />{s}</span>
}

function Attachments({ list }: { list?: Att[] }) {
  if (!list?.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {list.map((a, i) => {
        const I = a.kind === 'pdf' ? FilePdf : a.kind === 'image' ? Image : LinkSimple
        const href = attHref(a)
        const cls = 'inline-flex max-w-full items-center gap-2 rounded-xl bg-white/[0.04] px-2.5 py-1.5 text-[12px] ring-1 ring-white/[0.08] transition hover:bg-white/[0.08]'
        const inner = <><I size={15} weight="light" className={a.kind === 'pdf' ? 'text-coral' : a.kind === 'image' ? 'text-sea' : 'text-champagne-300'} /><span className="truncate">{a.name}</span></>
        return href?.startsWith('/app') ? <Link key={i} to={href} className={cls}>{inner}</Link> : href ? <a key={i} href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a> : <span key={i} title="Pièce jointe de démonstration" className={cls}>{inner}</span>
      })}
    </div>
  )
}

/* ——— Composeur ——— */
function Composer({ conv, vars, lastId }: { conv: Conv; vars: Record<string, string>; lastId?: string }) {
  const [templates, tplOps] = useTemplates()
  const [convs, convOps] = useConversations()
  const [agents] = useAgents()
  const { dossier, contact } = useConvContext(conv)
  const draftKey = `nxt:draft:${conv.id}`
  const [text, setText] = useState(() => { try { return localStorage.getItem(draftKey) ?? '' } catch { return '' } })
  const [subject, setSubject] = useState('')
  const [tpl, setTpl] = useState<string | null>(null)
  const [atts, setAtts] = useState<Att[]>([])
  const [scheduleAt, setScheduleAt] = useState('')
  const [menu, setMenu] = useState<null | 'tpl' | 'att' | 'sched' | 'at'>(null)
  const [err, setErr] = useState<{ msg: string; kind: 'window' | 'consent' } | null>(null)
  const [busy, setBusy] = useState(false)
  const [sug, setSug] = useState<string[]>([])
  const [sugBusy, setSugBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useOutside<HTMLDivElement>(!!menu, useCallback(() => setMenu(null), []))
  const internal = conv.kind === 'channel'
  const wa = conv.channel === 'whatsapp'
  const open = windowOpen(conv)
  const tplDoc = templates.find((t) => t.id === tpl) as (Template & { id: string }) | undefined
  const missing = missingVars(text)
  const mention = internal ? /@([\p{L}-]*)$/u.exec(text) : null

  useEffect(() => { try { if (text) localStorage.setItem(draftKey, text); else localStorage.removeItem(draftKey) } catch { /* indisponible */ } }, [text, draftKey])
  const suggest = useCallback(async () => {
    if (internal) return
    setSugBusy(true)
    try { setSug((await action<{ suggestions: string[] }>('message.suggest', { conversationId: conv.id })).suggestions) } catch { setSug([]) } finally { setSugBusy(false) }
  }, [conv.id, internal])
  useEffect(() => { suggest() }, [suggest, lastId])

  const insertTpl = (t: Template & { id: string }) => {
    setText(fill(t.body, vars)); setTpl(t.id); setMenu(null); setErr(null)
    taRef.current?.focus()
  }
  const send = async () => {
    if (busy || (!text.trim() && !tpl)) return
    if (missing.length) { toast(`Complétez les variables : ${missing.map((v) => `{{${v}}}`).join(', ')}`, 'error'); return }
    const body = conv.channel === 'email' && subject.trim() ? `Objet : ${subject.trim()}\n\n${text.trim()}` : text.trim()
    setBusy(true); setErr(null)
    try {
      await action('message.send', { conversationId: conv.id, text: body, template: tpl ?? undefined, attachments: atts.length ? atts : undefined, scheduleAt: scheduleAt ? new Date(scheduleAt).toISOString() : undefined })
      if (tplDoc) tplOps.update(tplDoc.id, { uses: (tplDoc.uses ?? 0) + 1 }).catch(() => {})
      toast(scheduleAt ? `Envoi programmé ${longDate(new Date(scheduleAt).toISOString())}` : internal ? 'Distribué à l’équipe' : `Consigné — connecteur ${CONNECTOR[conv.channel]} non configuré`, scheduleAt || internal ? 'ok' : 'info')
      setText(''); setSubject(''); setTpl(null); setAtts([]); setScheduleAt('')
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setErr({ msg: e.message, kind: /consentement/i.test(e.message) ? 'consent' : 'window' })
      else toast(errText(e), 'error')
    } finally { setBusy(false) }
  }

  /** Demande de consentement : modèle tpl-consent envoyé dans la conversation e-mail du contact (créée si besoin). */
  const requestConsent = async () => {
    const t = templates.find((x) => x.id === 'tpl-consent')
    if (!t) { toast('Modèle de consentement introuvable (onglet Modèles)', 'error'); return }
    try {
      let mail = (convs as Conv[]).find((c) => c.channel === 'email' && c.kind === 'direct' && ((conv.contactId && c.contactId === conv.contactId) || c.title === conv.title))
      if (!mail) mail = await convOps.create({ title: conv.title, subtitle: conv.subtitle, channel: 'email', kind: 'direct', avatar: conv.avatar, contactId: conv.contactId ?? contact?.id, dossierId: conv.dossierId, tags: conv.tags, unread: 0, status: 'open', assignee: conv.assignee, lastAt: new Date().toISOString(), lastText: '' }) as Conv
      await action('message.send', { conversationId: mail.id, text: `Objet : Votre accord pour échanger sur WhatsApp\n\n${fill(t.body, vars)}`, template: 'tpl-consent' })
      await convOps.update(conv.id, { consentRequestedAt: new Date().toISOString() } as Partial<Conv>)
      tplOps.update(t.id, { uses: (t.uses ?? 0) + 1 }).catch(() => {})
      setErr(null)
      toast(`Demande de consentement consignée par e-mail${contact?.email ? ` (${contact.email})` : ''} — connecteur SMTP non configuré`, 'info')
    } catch (e) { toast(errText(e), 'error') }
  }

  const upload = async (f: File) => {
    try { const d = await uploadFile(f, conv.dossierId); setAtts((a) => [...a, { name: f.name, kind: f.type.startsWith('image/') ? 'image' : f.type === 'application/pdf' ? 'pdf' : 'link', ref: d.id }]); toast(`« ${f.name} » joint et classé dans les fichiers${conv.dossierId ? ' du dossier' : ''}`) }
    catch (e) { toast(errText(e), 'error') }
  }
  const deliverables = dossier ? DELIVERABLES.filter((d) => dossier.deliverables?.[d.code] === 'done') : []
  const pickMention = (first: string) => { setText(text.replace(/@([\p{L}-]*)$/u, `@${first} `)); taRef.current?.focus() }
  const waTemplates = (templates as (Template & { id: string })[]).filter((t) => t.channel === conv.channel || (conv.channel === 'portal' && t.channel === 'email') || conv.channel === 'internal')
  const others = (templates as (Template & { id: string })[]).filter((t) => !waTemplates.includes(t))

  return (
    <div className="border-t border-white/[0.06] p-3">
      {/* Suggestions du copilote */}
      {!internal && (
        <div className="scrollbar-none mb-2 flex items-center gap-1.5 overflow-x-auto">
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-champagne-300"><Sparkle size={12} weight="fill" />Copilote</span>
          {sugBusy && !sug.length ? <span className="h-6 w-48 shrink-0 animate-pulse rounded-full bg-white/[0.05]" />
            : sug.map((s, i) => <button key={i} onClick={() => { setText(s); setTpl(null); taRef.current?.focus() }} title={s} className="max-w-[260px] shrink-0 truncate rounded-full bg-champagne/[0.07] px-3 py-1 text-[11.5px] text-bone/80 ring-1 ring-champagne/20 transition hover:bg-champagne/15">{s}</button>)}
          <button onClick={suggest} aria-label="Nouvelles suggestions" title="Nouvelles suggestions" className="shrink-0 rounded-full p-1 text-mist hover:text-bone"><ArrowsClockwise size={12} className={clsx(sugBusy && 'animate-spin')} /></button>
        </div>
      )}

      {/* Erreur 409 avec action corrective */}
      <AnimatePresence>{err && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: EXPO }} role="alert" className="mb-2 rounded-2xl bg-coral/[0.08] p-3 ring-1 ring-coral/25">
          <div className="flex items-start gap-2 text-[12.5px] text-coral"><Warning size={15} className="mt-0.5 shrink-0" /><span className="flex-1"><b className="font-medium">Envoi refusé (409).</b> {err.msg}</span><button onClick={() => setErr(null)} aria-label="Fermer"><X size={13} /></button></div>
          <div className="mt-2 flex flex-wrap gap-1.5 pl-6">
            {err.kind === 'window' ? <>
              <button onClick={() => setMenu('tpl')} className="rounded-full bg-champagne px-3 py-1 text-[12px] font-medium text-ink">Choisir un modèle approuvé</button>
              {(['tpl-rdv', 'tpl-bilan'] as const).map((id) => { const t = templates.find((x) => x.id === id); return t && <button key={id} onClick={() => insertTpl(t)} className="rounded-full bg-white/[0.05] px-3 py-1 text-[12px] text-bone/85 ring-1 ring-white/10">Insérer « {t.name} »</button> })}
            </> : <>
              <button onClick={requestConsent} className="rounded-full bg-champagne px-3 py-1 text-[12px] font-medium text-ink">Demander le consentement (modèle par e-mail)</button>
              <button onClick={async () => { await convOps.update(conv.id, { optIn: true }); setErr(null); toast('Consentement WhatsApp enregistré — preuve à conserver au registre') }} className="rounded-full bg-white/[0.05] px-3 py-1 text-[12px] text-bone/85 ring-1 ring-white/10">J’ai déjà son accord écrit</button>
            </>}
          </div>
        </motion.div>
      )}</AnimatePresence>

      <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.08] transition focus-within:ring-champagne/40">
        {conv.channel === 'email' && <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={`Objet — Re : ${conv.subtitle?.split('·').at(-1)?.trim() ?? conv.title}`} className="w-full border-b border-white/[0.06] bg-transparent px-3.5 py-2 text-[13px] outline-none placeholder:text-mist" />}
        {(tplDoc || atts.length > 0 || scheduleAt || missing.length > 0) && (
          <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
            {tplDoc && <span className="inline-flex items-center gap-1 rounded-full bg-champagne/10 px-2 py-0.5 text-[11px] text-champagne-300 ring-1 ring-champagne/25"><FileText size={11} />{tplDoc.name}{tplDoc.approved && wa && ' · approuvé'}<button onClick={() => setTpl(null)} aria-label="Retirer le modèle"><X size={10} /></button></span>}
            {atts.map((a, i) => <span key={i} className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] ring-1 ring-white/[0.08]"><Paperclip size={11} />{a.name}<button onClick={() => setAtts(atts.filter((_, j) => j !== i))} aria-label="Retirer"><X size={10} /></button></span>)}
            {scheduleAt && <span className="inline-flex items-center gap-1 rounded-full bg-sea/10 px-2 py-0.5 text-[11px] text-sea ring-1 ring-sea/25"><CalendarBlank size={11} />{longDate(new Date(scheduleAt).toISOString())}<button onClick={() => setScheduleAt('')} aria-label="Annuler la programmation"><X size={10} /></button></span>}
            {missing.length > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-2 py-0.5 text-[11px] text-coral ring-1 ring-coral/25"><Warning size={11} />À compléter : {missing.map((v) => `{{${v}}}`).join(' ')}</span>}
          </div>
        )}
        <div className="relative">
          <textarea ref={taRef} value={text} onChange={(e) => { setText(e.target.value); if (err) setErr(null) }} rows={2}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send() } }}
            placeholder={internal ? `Message à #${conv.title} — @ pour mentionner` : wa && !open ? 'Fenêtre fermée : insérez un modèle approuvé…' : conv.channel === 'portal' ? 'Répondre via le portail…' : `Répondre par ${CH[conv.channel].label}…`}
            className="thin-scroll block max-h-40 min-h-[56px] w-full resize-none bg-transparent px-3.5 py-2.5 text-[13.5px] leading-relaxed outline-none placeholder:text-mist" />
          {mention && (
            <div className="absolute bottom-full left-3 mb-1"><Menu className="relative w-56">{agents.filter((a) => a.name.toLowerCase().includes(mention[1].toLowerCase())).map((a) => (
              <button key={a.id} onClick={() => pickMention(a.name.split(' ')[0])} className={menuItem}><img src={a.photo} alt="" className="h-5 w-5 rounded-full object-cover" />{a.name}<span className="ml-auto text-[10.5px] text-mist">{a.role.split(' ')[0]}</span></button>
            ))}</Menu></div>
          )}
        </div>
        <div ref={menuRef} className="relative flex flex-wrap items-center gap-1 px-2 pb-2">
          <TBtn label="Modèles" active={menu === 'tpl'} onClick={() => setMenu(menu === 'tpl' ? null : 'tpl')}><FileText size={15} weight="light" /><span className="hidden sm:inline">Modèles</span></TBtn>
          <TBtn label="Joindre" active={menu === 'att'} onClick={() => setMenu(menu === 'att' ? null : 'att')}><Paperclip size={15} weight="light" /></TBtn>
          {!internal && <TBtn label="Programmer l’envoi" active={menu === 'sched' || !!scheduleAt} onClick={() => setMenu(menu === 'sched' ? null : 'sched')}><CalendarBlank size={15} weight="light" /></TBtn>}
          {!internal && <TBtn label={`Traduire ${text && isEnglish(text) ? 'EN → FR' : 'FR → EN'} (simulation)`} onClick={() => { if (!text.trim()) return toast('Écrivez d’abord un message à traduire', 'info'); const r = translate(text); setText(r.text); setTpl(null); toast(`Traduit en ${r.to} — simulation par règles, relisez avant envoi`, 'info') }}><Translate size={15} weight="light" /><span className="num text-[10.5px]">{text && isEnglish(text) ? 'FR' : 'EN'}</span></TBtn>}
          {internal && <TBtn label="Mentionner" onClick={() => { setText((t) => `${t}${t && !t.endsWith(' ') ? ' ' : ''}@`); taRef.current?.focus() }}><At size={15} weight="light" /></TBtn>}
          {wa && <span className={clsx('ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] ring-1', conv.optIn === false ? 'bg-coral/10 text-coral ring-coral/25' : open ? 'bg-sage/10 text-sage ring-sage/25' : 'bg-champagne/10 text-champagne-300 ring-champagne/25')} title="Consentement WhatsApp et fenêtre de service de 24 h">
            <ShieldCheck size={11} />{conv.optIn === false ? (conv.consentRequestedAt ? 'Consentement demandé' : 'Sans consentement') : open ? `Opt-in · fenêtre ${until(conv.windowUntil!).replace('dans ', '')}` : 'Opt-in · modèle requis'}
          </span>}
          <span className="ml-auto hidden text-[10.5px] text-mist md:inline"><kbd className="num">⌘↵</kbd></span>
          <button onClick={send} disabled={busy || (!text.trim() && !tpl)} className="inline-flex items-center gap-1.5 rounded-full bg-champagne px-3.5 py-1.5 text-[12.5px] font-medium text-ink transition hover:bg-champagne-300 disabled:opacity-40">
            {busy ? 'Envoi…' : scheduleAt ? 'Programmer' : internal ? 'Envoyer' : 'Consigner l’envoi'}<PaperPlaneRight size={13} weight="fill" />
          </button>

          {menu === 'tpl' && (
            <Menu className="bottom-12 left-0 w-[min(380px,calc(100vw-3rem))]">
              {[['Pour ce canal', waTemplates], ['Autres canaux', others]].map(([label, list]) => (list as (Template & { id: string })[]).length > 0 && (
                <div key={label as string}>
                  <div className={clsx(eyebrow, 'px-3 pb-1 pt-2')}>{label as string}</div>
                  {(list as (Template & { id: string })[]).map((t) => {
                    const blocked = wa && !open && !(t.approved && t.channel === 'whatsapp')
                    return (
                      <button key={t.id} disabled={blocked} onClick={() => insertTpl(t)} className={clsx(menuItem, 'flex-col items-start gap-0.5 disabled:cursor-not-allowed disabled:opacity-40')}>
                        <span className="flex w-full items-center gap-2"><span className="flex-1 truncate font-medium">{t.name}</span><ChannelBadge ch={t.channel} size="xs" />{t.approved ? <span className="text-[10px] text-sage">approuvé</span> : <span className="text-[10px] text-champagne-300">en revue</span>}</span>
                        <span className="line-clamp-2 text-[11.5px] text-bone/50">{fill(t.body, vars)}</span>
                      </button>
                    )
                  })}
                </div>
              ))}
              <Link to="?tab=modeles" className="mt-1 flex items-center gap-1.5 border-t border-white/[0.06] px-3 py-2 text-[11.5px] text-champagne-300"><Plus size={11} />Gérer les modèles</Link>
            </Menu>
          )}
          {menu === 'att' && (
            <Menu className="bottom-12 left-0 w-[min(320px,calc(100vw-3rem))]">
              <button onClick={() => fileRef.current?.click()} className={menuItem}><Paperclip size={14} />Fichier de l’ordinateur…</button>
              <div className={clsx(eyebrow, 'px-3 pb-1 pt-2')}>{dossier ? `Livrables du dossier ${dossier.ref}` : 'Aucun dossier lié'}</div>
              {deliverables.map((d) => <button key={d.code} onClick={() => { setAtts((a) => [...a, { name: `${d.code} · ${d.name}`, kind: 'link', ref: `/app/dossiers/${dossier!.id}` }]); setMenu(null) }} className={menuItem}><LinkSimple size={14} className="text-champagne-300" /><span className="num text-[11px] text-mist">{d.code}</span>{d.name}</button>)}
              {dossier && !deliverables.length && <div className="px-3 py-2 text-[11.5px] text-mist">Aucun livrable validé pour l’instant.</div>}
            </Menu>
          )}
          {menu === 'sched' && (
            <Menu className="bottom-12 left-0 w-72">
              <div className="space-y-1 p-1">
                {([['Ce soir 18:00', 18, 0], ['Demain 9:00', 9, 1], ['Demain 14:00', 14, 1]] as const).map(([l, h, d]) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return x.getTime() > Date.now() && <button key={l} onClick={() => { setScheduleAt(localInput(x)); setMenu(null) }} className={menuItem}><Clock size={13} />{l}</button> })}
                <label className="block px-3 pt-2"><span className={eyebrow}>Date et heure</span><input type="datetime-local" min={localInput(new Date())} value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className="mt-1 w-full rounded-xl bg-white/[0.04] px-2.5 py-1.5 text-[12.5px] outline-none ring-1 ring-white/[0.08] [color-scheme:dark] focus:ring-champagne/50" /></label>
                <p className="px-3 pb-1 pt-1 text-[11px] text-mist">Le message est consigné au statut « programmé » ; il partira avec le connecteur.</p>
              </div>
            </Menu>
          )}
        </div>
      </div>
      <input ref={fileRef} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; setMenu(null) }} />
      {wa && conv.optIn === false && !err && <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-coral"><ChatsCircle size={12} />Aucun consentement WhatsApp : tout envoi sera refusé. <button onClick={requestConsent} className="underline underline-offset-2">Demander l’accord par e-mail</button></p>}
    </div>
  )
}

const TBtn = ({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: ReactNode }) =>
  <button type="button" aria-label={label} title={label} onClick={onClick} className={clsx('inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-[12px] transition', active ? 'bg-champagne/15 text-champagne-300' : 'text-bone/65 hover:bg-white/[0.06] hover:text-bone')}>{children}</button>

