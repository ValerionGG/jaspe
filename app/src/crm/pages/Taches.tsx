import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { Sparkle, CheckCircle, Check, FileText, Microphone, Handshake, Paperclip, ArrowsClockwise, Moon, Clock, ShieldCheck, Warning, X, Timer, CaretDown, Lightning, Eye, Plus, Trash, ListChecks, ArrowUUpLeft } from '@phosphor-icons/react'
import { PageHeader, Card, Tabs, SoftBtn, Stagger, Stat, IconBtn, Empty } from '../ui'
import { Avatar, EXPO } from '../../ui/kit'
import { prop, agent, type Dossier, type Task } from '../../data/mock'
import { QKINDS, type QItem, type QKind } from '../../data/ops'
import { useQueue, useTasks, useDossiers, useAgents, useSettings, type DocumentDoc } from '../../data/collections'
import { action, useDoc, type Doc } from '../../data/store'
import { Modal, Field, Input, Select, Textarea, AsyncForm, toast, errText } from '../forms'
import { DocPaper } from './DossierDetail'

type Q = QItem & Doc & { snoozed?: string }
type T = Task & Doc & { assignee?: string }
const ICON: Record<QKind, typeof FileText> = { livrable: FileText, debrief: Microphone, offre: Handshake, piece: Paperclip, relance: ArrowsClockwise }
const BUCKETS = [{ id: 'today', l: 'Aujourd’hui' }, { id: 'week', l: 'Cette semaine' }, { id: 'later', l: 'Plus tard' }] as const
const SNOOZE: [string, QItem['bucket']][] = [['Dans 1 heure', 'today'], ['Ce soir 18:00', 'today'], ['Demain 9:00', 'week'], ['Lundi 9:00', 'week'], ['Dans 15 jours', 'later']]
const TASK_KIND: Record<Task['kind'], string> = { valider: 'Valider', appeler: 'Appeler', envoyer: 'Envoyer', relancer: 'Relancer', document: 'Document' }
const hm = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${String(m % 60).padStart(2, '0')}` : ''}` : `${m} min`)
const BASE_SAVED = 460 // 7 h 40 déjà gagnées cette semaine avant ouverture de la file

export default function Taches() {
  const [items, ops] = useQueue()
  const [tasks, taskOps] = useTasks()
  const [dossiers] = useDossiers()
  const [settings, setOps] = useSettings()
  const queue = items as Q[]
  const [sel, setSel] = useState<string[]>([])
  const [kind, setKind] = useState<'all' | QKind>('all')
  const [dossier, setDossier] = useState('all')
  const [menu, setMenu] = useState<{ id: string; t: 'snooze' | 'assign' } | null>(null)
  const [review, setReview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const stats = settings.find((s) => s.id === 'queue-stats') as { saved?: number; done?: number } | undefined
  const saved = BASE_SAVED + (stats?.saved ?? 0)
  const list = queue.filter((q) => (kind === 'all' || q.kind === kind) && (dossier === 'all' || q.dossier === dossier))
  const selItems = queue.filter((q) => sel.includes(q.id))
  const safe = selItems.filter((q) => q.safe), unsafe = selItems.filter((q) => !q.safe)
  const openTasks = (tasks as T[]).filter((t) => !t.done), doneTasks = (tasks as T[]).filter((t) => t.done)
  const dossierOf = (id?: string) => dossiers.find((d) => d.id === id)

  const bump = async (n: number, m: number) => {
    const next = { saved: (stats?.saved ?? 0) + m, done: (stats?.done ?? 0) + n }
    await (stats ? setOps.update('queue-stats', next) : setOps.create({ id: 'queue-stats', ...next }))
  }
  /** Valide via le serveur ; un élément d’amorce (id hors `q-…`) est retiré à la main, le serveur ne retirant que `q-<dossier>-<code>`. */
  const resolveOne = async (q: Q, decision = 'validé') => {
    await action('queue.resolve', { id: q.id, decision })
    if (!q.id.startsWith('q-')) await ops.remove(q.id)
  }
  const validate = async (qs: Q[]) => {
    if (!qs.length) return
    setBusy(true)
    let ok = 0, m = 0
    try { for (const q of qs) { await resolveOne(q); ok++; m += q.saved } }
    catch (x) { toast(errText(x), 'error') }
    finally {
      setSel((s) => s.filter((id) => !qs.some((q) => q.id === id))); setBusy(false)
      if (ok) { toast(`${ok > 1 ? `${ok} éléments validés` : 'Validé'} · ${hm(m)} gagnées${qs.some((q) => q.code && ['L1', 'L3', 'L4', 'L5', 'L6', 'L7'].includes(q.code)) ? ' · envoi programmé (connecteur non configuré)' : ''}`); bump(ok, m).catch(() => {}) }
    }
  }
  const snooze = async (qs: Q[], [when, bucket]: [string, QItem['bucket']]) => {
    setMenu(null); setSel((s) => s.filter((id) => !qs.some((q) => q.id === id)))
    try { for (const q of qs) await ops.update(q.id, { due: when, bucket, snoozed: when }); toast(`${qs.length > 1 ? `${qs.length} éléments reportés` : 'Reporté'} · ${when.toLowerCase()}`) } catch (x) { toast(errText(x), 'error') }
  }
  const assign = async (q: Q, a: string) => { setMenu(null); try { await ops.update(q.id, { assignee: a }); toast(`Assigné à ${agent(a).name}`) } catch (x) { toast(errText(x), 'error') } }
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const toggleTask = async (t: T) => { try { await action('task.toggle', { id: t.id }); toast(t.done ? 'Tâche rouverte' : 'Tâche terminée') } catch (x) { toast(errText(x), 'error') } }

  const dossiersInQueue = dossiers.filter((d) => queue.some((q) => q.dossier === d.id))
  const r = queue.find((q) => q.id === review)

  return (
    <div>
      <PageHeader
        kicker="File de décision unifiée"
        title={<>Ce qui attend <span className="italic text-champagne-300">votre feu vert</span></>}
        sub="Livrables, débriefs, offres, pièces et relances préparés par le copilote. Rien ne part sans vous : les engagements externes exigent une revue individuelle."
        actions={<>
          <span className="flex items-center gap-2 rounded-full bg-sage/10 px-3.5 py-2 text-[12.5px] text-sage ring-1 ring-sage/25"><Timer size={15} weight="light" /><motion.span key={saved} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="num">{hm(saved)}</motion.span> gagnées cette semaine</span>
          <SoftBtn tone="gold" icon={<Plus size={14} weight="light" />} onClick={() => setCreating(true)}>Nouvelle tâche</SoftBtn>
        </>}
      />

      <Stagger className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="À décider aujourd’hui" value={queue.filter((q) => q.bucket === 'today').length} hint={`${queue.filter((q) => q.urgent).length} urgentes avant 18:00`} />
        <Stat label="Validables en lot" value={queue.filter((q) => q.safe).length} hint="Internes et réversibles" />
        <Stat label="Revue individuelle" value={queue.filter((q) => !q.safe).length} hint="Offres, envois engageants" />
        <Stat label="Tâches ouvertes" value={openTasks.length} hint={`${openTasks.filter((t) => t.prio === 'haute').length} prioritaires · ${stats?.done ?? 0} décisions validées`} />
      </Stagger>

      <Stagger i={1} className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs id="q-kind" value={kind} onChange={setKind} items={[{ id: 'all', label: 'Tout', count: queue.length }, ...(Object.keys(QKINDS) as QKind[]).map((k) => ({ id: k, label: QKINDS[k], count: queue.filter((q) => q.kind === k).length }))]} />
        <div className="flex items-center gap-2">
          <label className="relative">
            <select value={dossier} onChange={(e) => setDossier(e.target.value)} className="appearance-none rounded-full bg-white/[0.03] py-2 pl-4 pr-9 text-[13px] text-bone/85 outline-none ring-1 ring-white/[0.07]">
              <option value="all">Tous les dossiers</option>
              {dossiersInQueue.map((d) => <option key={d.id} value={d.id}>{d.seller} · {d.ref.slice(-4)}</option>)}
            </select>
            <CaretDown size={12} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-mist" />
          </label>
          <button onClick={() => setSel(sel.length ? [] : list.filter((q) => q.safe).map((q) => q.id))} className="whitespace-nowrap rounded-full px-3.5 py-2 text-[12.5px] text-bone/70 ring-1 ring-white/[0.07] transition hover:text-bone">{sel.length ? 'Désélectionner' : 'Sélectionner les sûres'}</button>
        </div>
      </Stagger>

      <div className="space-y-6">
        {BUCKETS.map((b, bi) => {
          const rows = list.filter((q) => q.bucket === b.id)
          if (!rows.length) return null
          return (
            <Stagger key={b.id} i={2 + bi}>
              <div className="mb-2.5 flex items-baseline gap-3 px-1">
                <h2 className="display text-[1.7rem]">{b.l}</h2>
                <span className="num text-[11px] text-mist">{rows.length} · ≈ {hm(rows.reduce((s, q) => s + q.saved, 0))} de travail préparé</span>
              </div>
              <Card pad={false}>
                <div className="divide-y divide-white/[0.05]">
                  <AnimatePresence initial={false}>
                    {rows.map((q) => (
                      <Row key={q.id} q={q} d={dossierOf(q.dossier)} selected={sel.includes(q.id)} menu={menu?.id === q.id ? menu.t : null}
                        onToggle={() => toggle(q.id)} onMenu={(t) => setMenu(menu?.id === q.id && menu.t === t ? null : { id: q.id, t })}
                        onValidate={() => (q.safe ? validate([q]) : setReview(q.id))} onReview={() => setReview(q.id)} onSnooze={(w) => snooze([q], w)} onAssign={(a) => assign(q, a)} />
                    ))}
                  </AnimatePresence>
                </div>
              </Card>
            </Stagger>
          )
        })}
        {list.length === 0 && (
          <div className="rounded-[1.4rem] p-14 text-center ring-1 ring-white/[0.06]">
            <CheckCircle size={34} weight="light" className="mx-auto text-sage" />
            <div className="display mt-3 text-3xl">File vide<span className="text-champagne">.</span></div>
            <div className="mt-1 text-[13px] text-bone/50">{queue.length ? 'Aucun élément pour ces filtres.' : 'Le copilote vous préviendra dès qu’une décision vous revient.'}</div>
          </div>
        )}

        {/* Tâches */}
        <Stagger i={6}>
          <div className="mb-2.5 flex items-baseline justify-between gap-3 px-1">
            <div className="flex items-baseline gap-3"><h2 className="display text-[1.7rem]">Tâches</h2><span className="num text-[11px] text-mist">{openTasks.length} ouvertes · {doneTasks.length} terminées</span></div>
            {doneTasks.length > 0 && <button onClick={() => setShowDone(!showDone)} className="text-[12px] text-mist hover:text-bone">{showDone ? 'Masquer' : 'Afficher'} les terminées</button>}
          </div>
          <Card pad={false}>
            {openTasks.length + (showDone ? doneTasks.length : 0) === 0 ? <div className="p-5"><Empty title="Aucune tâche ouverte">Créez une tâche manuelle ou laissez le copilote en proposer.</Empty></div> : (
              <div className="divide-y divide-white/[0.05]">
                <AnimatePresence initial={false}>
                  {[...openTasks, ...(showDone ? doneTasks : [])].map((t) => (
                    <TaskRow key={t.id} t={t} d={dossierOf(t.dossier)} onToggle={() => toggleTask(t)}
                      onSnooze={(when) => taskOps.update(t.id, { due: when }).then(() => toast(`Reportée · ${when.toLowerCase()}`), (x) => toast(errText(x), 'error'))}
                      onAssign={(a) => taskOps.update(t.id, { assignee: a }).then(() => toast(`Assignée à ${agent(a).name}`), (x) => toast(errText(x), 'error'))}
                      onDelete={() => taskOps.remove(t.id).then(() => toast('Tâche supprimée'))} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </Stagger>
      </div>

      {/* Barre de validation groupée */}
      <AnimatePresence>
        {sel.length > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ duration: 0.5, ease: EXPO }} className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-3xl lg:bottom-6">
            <div className="glass flex flex-col gap-3 rounded-[1.6rem] p-3 pl-5 shadow-float ring-1 ring-white/10 md:flex-row md:items-center">
              <div className="min-w-0 flex-1 text-[12.5px]">
                <div><span className="num text-bone">{sel.length}</span> sélectionnée{sel.length > 1 ? 's' : ''} · <span className="text-sage">{safe.length} validable{safe.length > 1 ? 's' : ''} en lot</span></div>
                {unsafe.length > 0 && <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-champagne-300"><Warning size={12} weight="light" />{unsafe.length} exclue{unsafe.length > 1 ? 's' : ''} : engagement externe, revue individuelle requise</div>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <SoftBtn onClick={() => snooze(selItems, SNOOZE[2])} icon={<Moon size={14} weight="light" />}>Reporter à demain</SoftBtn>
                <SoftBtn tone="gold" onClick={() => !busy && validate(safe)} icon={<ShieldCheck size={14} weight="light" />}>{busy ? 'Validation…' : `Valider ${safe.length} en sécurité`}</SoftBtn>
                <IconBtn label="Annuler la sélection" onClick={() => setSel([])}><X size={14} /></IconBtn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{r && <Review q={r} d={dossierOf(r.dossier)} onClose={() => setReview(null)} onValidate={async () => { await validate([r]); setReview(null) }}
        onReject={async (reason) => {
          try {
            if (r.code && r.dossier) await action('deliverable.reject', { dossierId: r.dossier, code: r.code, reason })
            await resolveOne(r, `renvoyé en correction (${reason})`)
            toast('Renvoyé en correction'); setReview(null)
          } catch (x) { toast(errText(x), 'error') }
        }} />}</AnimatePresence>

      <Modal open={creating} onClose={() => setCreating(false)} kicker="Tâches" title={<>Nouvelle <span className="italic text-champagne-300">tâche</span></>}>
        <AsyncForm submitLabel="Créer la tâche" success="Tâche créée" onCancel={() => setCreating(false)} onSubmit={async (v) => {
          if (!v.title.trim()) throw new Error('Intitulé requis')
          await taskOps.create({ title: v.title.trim(), dossier: v.dossier || undefined, due: v.due.trim() || 'Sans échéance', prio: v.prio as Task['prio'], kind: v.kind as Task['kind'], assignee: v.assignee, done: false, ai: false })
          setCreating(false)
        }}>
          <Field label="Intitulé"><Textarea name="title" rows={2} required placeholder="Rappeler Me Faure pour l’état daté" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type"><Select name="kind" defaultValue="appeler">{(Object.keys(TASK_KIND) as Task['kind'][]).map((k) => <option key={k} value={k}>{TASK_KIND[k]}</option>)}</Select></Field>
            <Field label="Priorité"><Select name="prio" defaultValue="normale"><option value="normale">Normale</option><option value="haute">Haute</option></Select></Field>
            <Field label="Échéance"><Input name="due" placeholder="Demain 10:00" /></Field>
            <Field label="Assignée à"><AgentSelect name="assignee" /></Field>
          </div>
          <Field label="Dossier lié"><Select name="dossier" defaultValue=""><option value="">Aucun</option>{dossiers.map((d) => <option key={d.id} value={d.id}>{d.seller} · {d.ref}</option>)}</Select></Field>
        </AsyncForm>
      </Modal>
    </div>
  )
}

function AgentSelect({ name }: { name: string }) {
  const [agents] = useAgents()
  return <Select name={name} defaultValue="a1">{agents.filter((a) => a.id !== 'a8').map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>
}

function AgentMenu({ open, current, onPick }: { open: boolean; current?: string; onPick: (id: string) => void }) {
  const [agents] = useAgents()
  return (
    <Menu open={open} title="Assigner à">
      {agents.filter((x) => x.id !== 'a8').map((x) => (
        <button key={x.id} onClick={() => onPick(x.id)} className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-[12.5px] hover:bg-white/[0.05]">
          <Avatar src={x.photo} size={22} ring={false} /><span className="flex-1 truncate">{x.name}</span>{x.id === current && <Check size={12} className="text-champagne" />}
        </button>
      ))}
    </Menu>
  )
}

function Row({ q, d, selected, menu, onToggle, onMenu, onValidate, onReview, onSnooze, onAssign }: {
  q: Q; d?: Dossier; selected: boolean; menu: 'snooze' | 'assign' | null
  onToggle: () => void; onMenu: (t: 'snooze' | 'assign') => void; onValidate: () => void; onReview: () => void; onSnooze: (w: [string, QItem['bucket']]) => void; onAssign: (a: string) => void
}) {
  const p = d && prop(d.propertyId), a = agent(q.assignee), Ic = ICON[q.kind] ?? FileText
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0, transition: { duration: 0.4, ease: EXPO } }} className={clsx('group relative flex flex-col gap-3 p-4 transition-colors md:flex-row md:items-center', selected ? 'bg-champagne/[0.05]' : 'hover:bg-white/[0.015]')}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <button onClick={onToggle} aria-label="Sélectionner" className={clsx('mt-2.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md ring-1 transition', selected ? 'bg-champagne text-ink ring-champagne' : 'ring-white/20 hover:ring-white/40')}>{selected && <Check size={12} weight="bold" />}</button>
        <div className="relative shrink-0">
          {p ? <img src={p.photo} alt="" className="h-11 w-11 rounded-xl object-cover" /> : <span className="block h-11 w-11 rounded-xl bg-white/5" />}
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink-700 text-bone/80 ring-2 ring-ink-800"><Ic size={11} weight="light" /></span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {q.code && <span className="num rounded-full bg-champagne/10 px-1.5 text-[10.5px] text-champagne-300 ring-1 ring-champagne/20">{q.code}</span>}
            <button onClick={onReview} className="text-left text-[13.5px] font-medium leading-snug hover:text-champagne-300">{q.title}</button>
            {!q.safe && <span className="rounded-full bg-white/[0.04] px-2 py-px text-[10px] text-bone/55 ring-1 ring-white/10">Revue individuelle</span>}
            {q.snoozed && <span className="flex items-center gap-1 rounded-full bg-sea/10 px-2 py-px text-[10px] text-sea ring-1 ring-sea/20"><Moon size={10} />Reporté</span>}
          </div>
          <div className="mt-1 flex items-start gap-1.5 text-[12px] text-bone/50">
            <Sparkle size={11} weight="fill" className="mt-[3px] shrink-0 text-champagne/70" /><span><span className="text-bone/35">Pourquoi : </span>{q.why}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-mist">
            {d && <Link to={`/app/dossiers/${d.id}`} className="hover:text-champagne-300">{d.seller} · {d.ref}</Link>}
            <span className="flex items-center gap-1"><Lightning size={11} weight="light" />≈ {hm(q.saved)} gagnées</span>
            {q.ai && <span className="text-champagne-300/80">Préparé par le copilote</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-[3.6rem] md:pl-0">
        <span className={clsx('num flex w-[104px] items-center justify-end gap-1 whitespace-nowrap text-[11.5px]', q.urgent ? 'text-coral' : 'text-mist')}><Clock size={11} />{q.due}</span>
        <div className="relative">
          <button onClick={() => onMenu('assign')} title={`Assigné à ${a.name}`} className="flex items-center rounded-full p-0.5 ring-1 ring-white/10 transition hover:ring-champagne/40"><Avatar src={a.photo} size={26} ring={false} /></button>
          <AgentMenu open={menu === 'assign'} current={q.assignee} onPick={onAssign} />
        </div>
        <div className="relative">
          <IconBtn label="Reporter" onClick={() => onMenu('snooze')} active={menu === 'snooze'}><Moon size={15} weight="light" /></IconBtn>
          <Menu open={menu === 'snooze'} title="Reporter à">
            {SNOOZE.map((w) => <button key={w[0]} onClick={() => onSnooze(w)} className="block w-full rounded-xl px-2.5 py-1.5 text-left text-[12.5px] hover:bg-white/[0.05]">{w[0]}</button>)}
          </Menu>
        </div>
        <button onClick={onValidate} className={clsx('flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[12.5px] font-medium ring-1 transition-all duration-300 ease-silk active:scale-[0.97]', q.safe ? 'bg-bone text-ink ring-bone hover:bg-white' : 'bg-white/[0.04] text-bone ring-white/10 hover:bg-white/[0.08]')}>
          {q.safe ? <><Check size={13} weight="bold" />Valider</> : <><Eye size={13} weight="light" />Examiner</>}
        </button>
      </div>
    </motion.div>
  )
}

function TaskRow({ t, d, onToggle, onSnooze, onAssign, onDelete }: { t: T; d?: Dossier; onToggle: () => void; onSnooze: (w: string) => void; onAssign: (a: string) => void; onDelete: () => void }) {
  const [menu, setMenu] = useState<'snooze' | 'assign' | null>(null)
  const a = agent(t.assignee ?? 'a1')
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0, transition: { duration: 0.35, ease: EXPO } }} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <button onClick={onToggle} aria-label={t.done ? 'Rouvrir' : 'Terminer'} className={clsx('mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ring-1 transition', t.done ? 'bg-sage text-ink ring-sage' : 'ring-white/25 hover:ring-sage/60')}>{t.done && <Check size={12} weight="bold" />}</button>
        <div className="min-w-0 flex-1">
          <div className={clsx('text-[13.5px] leading-snug', t.done && 'text-bone/40 line-through decoration-bone/20')}>{t.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-mist">
            <span className="flex items-center gap-1"><ListChecks size={11} />{TASK_KIND[t.kind] ?? t.kind}</span>
            {t.prio === 'haute' && <span className="text-coral">Prioritaire</span>}
            {d && <Link to={`/app/dossiers/${d.id}`} className="hover:text-champagne-300">{d.seller} · {d.ref}</Link>}
            {t.ai && <span className="text-champagne-300/80">Proposée par le copilote</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 pl-[2.1rem] md:pl-0">
        <span className="num flex w-[104px] items-center justify-end gap-1 whitespace-nowrap text-[11.5px] text-mist"><Clock size={11} />{t.due}</span>
        <div className="relative">
          <button onClick={() => setMenu(menu === 'assign' ? null : 'assign')} title={`Assignée à ${a.name}`} className="flex items-center rounded-full p-0.5 ring-1 ring-white/10 transition hover:ring-champagne/40"><Avatar src={a.photo} size={26} ring={false} /></button>
          <AgentMenu open={menu === 'assign'} current={t.assignee ?? 'a1'} onPick={(id) => { setMenu(null); onAssign(id) }} />
        </div>
        <div className="relative">
          <IconBtn label="Reporter" active={menu === 'snooze'} onClick={() => setMenu(menu === 'snooze' ? null : 'snooze')}><Moon size={15} weight="light" /></IconBtn>
          <Menu open={menu === 'snooze'} title="Reporter à">
            {SNOOZE.map(([w]) => <button key={w} onClick={() => { setMenu(null); onSnooze(w) }} className="block w-full rounded-xl px-2.5 py-1.5 text-left text-[12.5px] hover:bg-white/[0.05]">{w}</button>)}
          </Menu>
        </div>
        <IconBtn label="Supprimer" onClick={onDelete}><Trash size={14} weight="light" /></IconBtn>
      </div>
    </motion.div>
  )
}

function Menu({ open, title, children }: { open: boolean; title: string; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.3, ease: EXPO }} className="absolute right-0 top-11 z-30 w-56 rounded-2xl bg-ink-700 p-1.5 shadow-float ring-1 ring-white/10">
          <div className="px-2.5 pb-1 pt-1.5 text-[10px] uppercase tracking-eyebrow text-mist">{title}</div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Review({ q, d, onClose, onValidate, onReject }: { q: Q; d?: Dossier; onClose: () => void; onValidate: () => Promise<void>; onReject: (reason: string) => Promise<void> }) {
  const [read, setRead] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [reason, setReason] = useState<string | null>(null)
  const doc = useDoc<DocumentDoc & Doc>('documents', q.code && q.dossier ? `${q.dossier}-${q.code}` : undefined)
  const p = d && prop(d.propertyId)
  const go = async (k: string, f: () => Promise<unknown>) => { setBusy(k); try { await f() } finally { setBusy(null) } }
  const checks: [string, boolean][] = doc?.checks?.length ? doc.checks.map((c) => [c, false])
    : q.kind === 'offre' ? [['Montant conforme au mandat et à l’accord écrit du vendeur', true], ['Délai de validité indiqué', true], ['Conditions suspensives listées', true], ['Destinataire vérifié (acquéreur ou son représentant)', false]]
    : [['Chiffres sourcés et datés (DVF, comparables)', !!doc], ['Mentions légales et signature agence', true], ['Fourchette validée par un professionnel', false]]
  return (
    <motion.div className="fixed inset-0 z-[70] flex justify-end bg-ink/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div onClick={(e) => e.stopPropagation()} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }} transition={{ duration: 0.5, ease: EXPO }} className="thin-scroll h-full w-full max-w-[600px] overflow-y-auto border-l border-white/[0.07] bg-ink-850 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <span className={clsx('flex items-center gap-2 rounded-full px-3 py-1 text-[11.5px] ring-1', q.safe ? 'bg-sage/10 text-sage ring-sage/25' : 'bg-champagne/10 text-champagne-300 ring-champagne/25')}><ShieldCheck size={13} weight="light" />{q.safe ? 'Interne · validable en lot' : 'Revue individuelle obligatoire'}</span>
          <IconBtn label="Fermer" onClick={onClose}><X size={15} /></IconBtn>
        </div>
        <h2 className="display mt-5 text-[2.2rem] leading-[1.02]">{q.title}</h2>
        {d && <div className="mt-2 text-[12px] text-mist">{d.seller} · {d.ref}{q.code && ` · livrable ${q.code}`}</div>}
        {!doc && p && <img src={p.photo} alt="" className="mt-5 h-40 w-full rounded-2xl object-cover" />}
        <div className="mt-5 rounded-2xl bg-white/[0.025] p-4 text-[13px] leading-relaxed text-bone/75 ring-1 ring-white/[0.05]">
          <div className="mb-1 flex items-center gap-1.5 text-[10.5px] uppercase tracking-eyebrow text-mist"><Sparkle size={11} weight="fill" className="text-champagne" />Pourquoi maintenant</div>
          {q.why}
        </div>
        {doc ? <DocPaper doc={doc} /> : q.code && q.dossier && (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-6 text-center">
            <p className="text-[13px] text-bone/60">Le document {q.code} n’a pas encore été généré pour ce dossier.</p>
            <div className="mt-3"><SoftBtn icon={<Sparkle size={13} weight="fill" />} onClick={() => go('gen', () => action('deliverable.generate', { dossierId: q.dossier, code: q.code }).then(() => toast(`${q.code} généré`), (x) => toast(errText(x), 'error')))}>{busy === 'gen' ? 'Génération…' : 'Générer pour relecture'}</SoftBtn></div>
          </div>
        )}
        <div className="mt-5 space-y-2">
          <div className="text-[10.5px] uppercase tracking-eyebrow text-mist">Contrôles avant décision</div>
          {checks.map(([t, ok]) => (
            <div key={t} className="flex items-center gap-2.5 rounded-xl bg-white/[0.02] px-3 py-2.5 text-[13px] ring-1 ring-white/[0.05]">{ok ? <CheckCircle size={16} weight="fill" className="text-sage" /> : <Warning size={16} weight="fill" className="text-champagne" />}{t}</div>
          ))}
        </div>
        <button onClick={() => setRead(!read)} className="mt-5 flex w-full items-center gap-3 rounded-2xl p-3 text-left text-[13px] ring-1 ring-white/[0.07] transition hover:bg-white/[0.02]">
          <span className={clsx('flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1', read ? 'bg-champagne text-ink ring-champagne' : 'ring-white/25')}>{read && <Check size={13} weight="bold" />}</span>
          J’ai relu le contenu et j’en assume l’envoi au nom de l’agence.
        </button>
        {reason !== null && (
          <div className="mt-4 space-y-2">
            <Textarea autoFocus rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif de la correction (obligatoire)" />
            <div className="flex justify-end gap-2"><SoftBtn onClick={() => setReason(null)}>Annuler</SoftBtn><SoftBtn tone="gold" onClick={() => reason.trim() ? go('rej', () => onReject(reason.trim())) : toast('Motif requis', 'error')}>{busy === 'rej' ? 'Envoi…' : 'Renvoyer en correction'}</SoftBtn></div>
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <button disabled={!read || !!busy} onClick={() => go('ok', onValidate)} className={clsx('inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-300 ease-silk', read ? 'bg-champagne text-ink shadow-glow hover:bg-champagne-300' : 'cursor-not-allowed bg-white/[0.04] text-bone/35 ring-1 ring-white/[0.06]')}>
            <ShieldCheck size={14} weight="light" />{busy === 'ok' ? 'Validation…' : q.safe ? 'Valider' : 'Valider et programmer l’envoi'}
          </button>
          {reason === null && <SoftBtn icon={<ArrowUUpLeft size={14} weight="light" />} onClick={() => setReason('')}>Renvoyer en correction</SoftBtn>}
          {d && <Link to={`/app/dossiers/${d.id}`}><SoftBtn icon={<FileText size={14} weight="light" />}>Ouvrir le dossier</SoftBtn></Link>}
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-mist">Journalisé : auteur, heure, version du document. L’envoi externe est programmé dans la file d’envoi ; tant qu’aucun connecteur n’est configuré, il est consigné, jamais envoyé.</p>
      </motion.div>
    </motion.div>
  )
}
