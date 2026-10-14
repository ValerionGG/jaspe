import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Warning, XCircle, PencilSimple, ArrowsClockwise, CalendarBlank, Sparkle, CardsThree, Rows, ClockCounterClockwise, BookOpenText, ShieldCheck, Keyboard, X, ArrowBendUpLeft, PaperPlaneTilt, Tray, Trash, ArrowSquareOut } from '@phosphor-icons/react'
import { PageHeader, Card, Tabs, SoftBtn, Stagger, DELIV_TONE, Empty } from '../ui'
import { EXPO } from '../../ui/kit'
import { DELIVERABLES, prop, agent, type DelivState, type Dossier } from '../../data/mock'
import { useDossiers, useDocuments, useOutbox, type Outbox } from '../../data/collections'
import { action } from '../../data/store'
import { STUDIO_CODES, FAN_CODES, EXTERNAL, checksOf, currentMeta, diffOf, type StudioCode, type StudioDocument, type Snapshot } from '../../data/studio'
import { StudioDoc } from '../studio-docs'
import { Modal, AsyncForm, Field, Input, Textarea, toast, errText } from '../forms'

const DOT: Record<DelivState, string> = { done: 'bg-sage', review: 'bg-champagne', running: 'animate-pulse bg-sea', waiting: 'bg-white/15', blocked: 'bg-coral' }
const CHECK_ICON = { ok: <CheckCircle size={15} weight="fill" className="shrink-0 text-sage" />, warn: <Warning size={15} weight="fill" className="shrink-0 text-champagne" />, fail: <XCircle size={15} weight="fill" className="shrink-0 text-coral" /> }
const nameOf = (c: string) => DELIVERABLES.find((x) => x.code === c)?.name ?? c
const PHOTO_CODES = new Set(['L3', 'L4', 'L6', 'L8'])
const ME = 'Claire Delmas'
const dt = (iso?: string) => (iso ? new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')
const defaultWhen = () => { const t = new Date(Date.now() + 864e5); t.setHours(10, 0, 0, 0); return new Date(t.getTime() - t.getTimezoneOffset() * 6e4).toISOString().slice(0, 16) }

type Filter = 'todo' | 'running' | 'done' | 'all'
const MATCH: Record<Filter, (s: DelivState) => boolean> = { todo: (s) => s === 'review' || s === 'blocked', running: (s) => s === 'running', done: (s) => s === 'done', all: (s) => s !== 'waiting' }
type Sel = { d: string; c: StudioCode }
type OutRow = Outbox & { scheduledFor?: string }
type Doc2 = StudioDocument & { rejected?: { reason: string; at: string } }
const stateOf = (d: Dossier, c: string): DelivState => d.deliverables?.[c] ?? 'waiting'
const isSent = (o: OutRow) => o.status !== 'programmé'

export default function Studio() {
  const [dossiers] = useDossiers()
  const [docsRaw, docOps] = useDocuments()
  const [outRaw, outOps] = useOutbox()
  const docs = docsRaw as Doc2[], outbox = outRaw as OutRow[]
  const [view, setView] = useState<'valider' | 'fan' | 'envois'>('valider')
  const [filter, setFilter] = useState<Filter>('todo')
  const [selRaw, setSel] = useState<Sel | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [plan, setPlan] = useState(false)
  const [when, setWhen] = useState(defaultWhen)
  const [diffV, setDiffV] = useState<number | null>(null)
  const [fanD, setFanD] = useState<string | null>(null)

  const docOf = (d: string, c: string) => docs.find((x) => x.id === `${d}-${c}`)
  const outFor = (d: string, c: string) => outbox.find((o) => o.dossierId === d && o.code === c)
  const groups = useMemo(() => dossiers
    .map((d) => ({ d, items: STUDIO_CODES.filter((c) => MATCH[filter](stateOf(d, c))) }))
    .filter((g) => g.items.length)
    .sort((a, b) => b.items.filter((c) => MATCH.todo(stateOf(b.d, c))).length - a.items.filter((c) => MATCH.todo(stateOf(a.d, c))).length), [dossiers, filter])
  const flat: Sel[] = groups.flatMap((g) => g.items.map((c) => ({ d: g.d.id, c })))
  const sel = selRaw ?? flat[0] ?? null

  const counts = useMemo(() => {
    const all = dossiers.flatMap((d) => STUDIO_CODES.map((c) => stateOf(d, c)))
    const today = new Date().toDateString()
    return {
      review: all.filter((s) => s === 'review').length,
      blocked: all.filter((s) => s === 'blocked').length,
      validated: docs.filter((x) => x.validatedAt && new Date(x.validatedAt).toDateString() === today).length,
      pending: outbox.filter((o) => !isSent(o)).length,
    }
  }, [dossiers, docs, outbox])

  const pick = (s: Sel) => { setSel(s); setEditing(false); setPlan(false); setDiffV(null) }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (editing || rejecting || view !== 'valider' || !sel || (e.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]')) return
      if (e.key !== 'j' && e.key !== 'k') return
      const i = flat.findIndex((x) => x.d === sel.d && x.c === sel.c)
      const n = flat[Math.min(flat.length - 1, Math.max(0, i + (e.key === 'j' ? 1 : -1)))]
      if (n) pick(n)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  })

  const run = async <R,>(k: string, f: () => Promise<R>, ok: string, tone: 'ok' | 'info' = 'ok') => {
    setBusy(k)
    try { const r = await f(); toast(ok, tone); return r } catch (e) { toast(errText(e), 'error') } finally { setBusy(null) }
  }

  const dossier = sel ? dossiers.find((x) => x.id === sel.d) : undefined
  const header = (
    <PageHeader
      kicker="Centre de validation"
      title={<>Studio <span className="italic text-champagne-300">livrables</span></>}
      sub={<>Rien ne part sans vous. {counts.review} brouillon{counts.review > 1 ? 's' : ''} attend{counts.review > 1 ? 'ent' : ''} votre regard, {counts.blocked} {counts.blocked > 1 ? 'sont bloqués' : 'est bloqué'} par une pièce ou un contrôle.</>}
      actions={<>
        <Tabs id="studio-view" value={view} onChange={setView} items={[{ id: 'valider', label: <span className="flex items-center gap-1.5"><Rows size={14} />Validation</span> }, { id: 'fan', label: <span className="flex items-center gap-1.5"><CardsThree size={14} />Éventail</span> }, { id: 'envois', label: <span className="flex items-center gap-1.5"><Tray size={14} />Envois</span>, count: outbox.length }]} />
        <SoftBtn tone="gold" icon={<CheckCircle size={14} />} onClick={() => { const n = dossiers.flatMap((d) => STUDIO_CODES.filter((c) => stateOf(d, c) === 'review').map((c) => ({ d: d.id, c }))).at(0); if (n) { setView('valider'); setFilter('todo'); pick(n) } else toast('Aucun brouillon à valider', 'info') }}>Valider dans l’ordre</SoftBtn>
      </>}
    />
  )

  return (
    <div>
      {header}
      <Stagger className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {([['À valider', counts.review, 'text-champagne-300'], ['Bloqués', counts.blocked, 'text-coral'], ['Validés aujourd’hui', counts.validated, 'text-sage'], ['Envois à consigner', counts.pending, 'text-sea']] as const).map(([l, v, c]) => (
          <div key={l} className="rounded-2xl bg-white/[0.02] px-4 py-3 ring-1 ring-white/[0.06]"><div className="text-[10.5px] uppercase tracking-eyebrow text-mist">{l}</div><div className={`display mt-1 text-3xl ${c}`}>{v}</div></div>
        ))}
      </Stagger>

      <AnimatePresence mode="wait">
        {view === 'fan' && (
          <motion.div key="fan" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease: EXPO }}>
            <FanView dossiers={dossiers} fanD={fanD} setFanD={setFanD} docOf={docOf} onPick={(s) => { setFilter('all'); pick(s); setView('valider') }} />
          </motion.div>
        )}
        {view === 'envois' && (
          <motion.div key="env" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease: EXPO }}>
            <Envois outbox={outbox} dossiers={dossiers} busy={busy}
              onSend={(o) => run(`send-${o.id}`, () => action('outbox.send', { id: o.id }), 'Envoi consigné — connecteur non configuré, rien n’est parti', 'info')}
              onRemove={(o) => run(`rm-${o.id}`, () => outOps.remove(o.id), 'Envoi retiré de la file')}
              onOpen={(o) => { if (STUDIO_CODES.includes(o.code as StudioCode)) { setFilter('all'); pick({ d: o.dossierId, c: o.code as StudioCode }); setView('valider') } }} />
          </motion.div>
        )}
        {view === 'valider' && (
          <motion.div key="val" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease: EXPO }} className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_290px]">
            {/* File */}
            <Stagger i={1}>
              <Card pad={false} className="xl:sticky xl:top-24">
                <div className="space-y-2.5 p-4 pb-3">
                  <div className="text-[10.5px] uppercase tracking-eyebrow text-mist">File des livrables</div>
                  <Tabs id="studio-filter" value={filter} onChange={(f) => { setFilter(f); setSel(null) }} items={[{ id: 'todo', label: 'À faire' }, { id: 'running', label: 'En cours' }, { id: 'done', label: 'Prêts' }, { id: 'all', label: 'Tous' }]} />
                </div>
                <div className="thin-scroll max-h-[300px] space-y-4 overflow-y-auto px-3 pb-4 xl:max-h-[calc(100vh-15rem)]">
                  {groups.map(({ d, items }) => {
                    const pp = prop(d.propertyId)
                    return (
                      <div key={d.id}>
                        <div className="mb-1.5 flex items-center gap-2.5 px-1">
                          <img src={pp.photo} alt="" className="h-8 w-8 rounded-lg object-cover" />
                          <div className="min-w-0 flex-1 leading-tight"><div className="truncate text-[12.5px] font-medium">{d.seller}</div><div className="truncate text-[11px] text-mist">{pp.title}</div></div>
                          <span className="num text-[10.5px] text-mist">{d.ref.slice(-4)}</span>
                        </div>
                        {items.map((c) => {
                          const s = stateOf(d, c), active = sel?.d === d.id && sel.c === c, o = outFor(d.id, c), has = !!docOf(d.id, c)
                          return (
                            <button key={c} onClick={() => pick({ d: d.id, c })} className={`relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors duration-300 ${active ? '' : 'hover:bg-white/[0.03]'}`}>
                              {active && <motion.span layoutId="studio-sel" className="absolute inset-0 rounded-xl bg-white/[0.06] ring-1 ring-champagne/25" transition={{ duration: 0.45, ease: EXPO }} />}
                              <span className="num relative w-6 text-[11.5px] text-bone/55">{c}</span>
                              <span className={`relative flex-1 truncate text-[12.5px] ${s === 'done' ? 'text-bone/50' : ''} ${has ? '' : 'italic'}`}>{nameOf(c)}</span>
                              {o && <PaperPlaneTilt size={12} className={`relative ${isSent(o) ? 'text-mist' : 'text-sea'}`} />}
                              <span className={`relative h-1.5 w-1.5 rounded-full ${DOT[s]}`} title={DELIV_TONE[s].l} />
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
                  {!groups.length && <div className="px-2 py-8 text-center text-[13px] text-bone/50">{filter === 'todo' ? 'Tout est validé. Belle journée.' : 'Aucun livrable dans cet état.'}</div>}
                </div>
                <div className="flex items-center gap-2 border-t border-white/[0.05] px-4 py-2.5 text-[11px] text-mist"><Keyboard size={13} /> <kbd className="num rounded bg-white/[0.06] px-1">J</kbd>/<kbd className="num rounded bg-white/[0.06] px-1">K</kbd> pour naviguer · <i>italique</i> = non généré</div>
              </Card>
            </Stagger>

            {sel && dossier ? (
              <Workbench key={`${sel.d}:${sel.c}`} sel={sel} dossier={dossier} doc={docOf(sel.d, sel.c)} out={outFor(sel.d, sel.c)} busy={busy}
                editing={editing} setEditing={setEditing} plan={plan} setPlan={setPlan} when={when} setWhen={setWhen} diffV={diffV} setDiffV={setDiffV}
                onReject={() => setRejecting(true)}
                onGenerate={(prev) => run('gen', async () => {
                  await action('deliverable.generate', { dossierId: sel.d, code: sel.c })
                  if (prev) await docOps.update(prev.id, { history: [...(prev.history ?? []), currentMeta(prev)] } as Partial<Doc2>)
                }, prev ? `Version ${prev.version + 1} générée — sources revérifiées` : `${sel.c} généré`)}
                onEdit={async (doc, v) => {
                  const body = v.body.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean)
                  if (!body.length) throw new Error('Le texte ne peut pas être vide')
                  await action('deliverable.edit', { dossierId: sel.d, code: sel.c, subject: doc.subject !== undefined ? v.subject : undefined, body })
                  await docOps.update(doc.id, { history: [...(doc.history ?? []), currentMeta(doc)], editedBy: ME, editedAt: new Date().toISOString() } as Partial<Doc2>)
                  setEditing(false)
                }}
                onValidate={() => run('ok', async () => {
                  await action('deliverable.validate', { dossierId: sel.d, code: sel.c })
                  const next = flat.find((x) => (x.d !== sel.d || x.c !== sel.c) && stateOf(dossiers.find((d) => d.id === x.d)!, x.c) === 'review')
                  if (next) window.setTimeout(() => pick(next), 650)
                }, EXTERNAL.has(sel.c) ? `${sel.c} validé — envoi ajouté à la file` : `${sel.c} validé`)}
                onSchedule={() => run('plan', async () => {
                  let o = outFor(sel.d, sel.c)
                  if (!o || isSent(o)) {
                    const r = await action<{ outbox: OutRow | null }>('deliverable.validate', { dossierId: sel.d, code: sel.c })
                    if (!r.outbox) throw new Error('Document interne : aucun envoi à programmer')
                    o = r.outbox
                  }
                  await action('outbox.send', { id: o.id })
                  await outOps.update(o.id, { scheduledFor: new Date(when).toISOString() } as Partial<OutRow>)
                  setPlan(false)
                }, `Programmé le ${dt(new Date(when).toISOString())} — consigné, connecteur d’envoi non configuré`, 'info')}
              />
            ) : (
              <div className="xl:col-span-2"><Empty title="Aucun livrable sélectionné">Choisissez un livrable dans la file, ou changez de filtre.</Empty></div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={rejecting && !!sel} onClose={() => setRejecting(false)} kicker={sel ? `${sel.c} · ${dossier?.seller ?? ''}` : ''} title="Renvoyer en correction">
        {sel && (
          <AsyncForm submitLabel="Renvoyer" success={`${sel.c} renvoyé en correction`} onCancel={() => setRejecting(false)} onSubmit={async (v) => {
            const reason = v.reason?.trim()
            if (!reason) throw new Error('Indiquez le motif de la correction')
            await action('deliverable.reject', { dossierId: sel.d, code: sel.c, reason })
            const doc = docOf(sel.d, sel.c)
            if (doc) await docOps.update(doc.id, { rejected: { reason, at: new Date().toISOString() } } as Partial<Doc2>)
            setRejecting(false)
          }}>
            <p className="text-[13px] text-bone/60">Le livrable passe en « Bloqué » et le motif est consigné au journal du dossier. Régénérez-le ou modifiez-le une fois la correction prise en compte.</p>
            <Field label="Motif (obligatoire)"><Textarea name="reason" rows={3} placeholder="Ex. : la fourchette doit intégrer la vente du 14 chemin des Nielles…" autoFocus /></Field>
          </AsyncForm>
        )}
      </Modal>
    </div>
  )
}

type WbProps = {
  sel: Sel; dossier: Dossier; doc?: Doc2; out?: OutRow; busy: string | null
  editing: boolean; setEditing: (v: boolean) => void; plan: boolean; setPlan: (v: boolean) => void; when: string; setWhen: (v: string) => void; diffV: number | null; setDiffV: (v: number | null) => void
  onReject: () => void; onGenerate: (prev?: Doc2) => void; onEdit: (doc: Doc2, v: Record<string, string>) => Promise<void>; onValidate: () => void; onSchedule: () => void
}

/** Aperçu, actions et contrôles du livrable sélectionné. */
function Workbench({ sel, dossier, doc, out, busy, editing, setEditing, plan, setPlan, when, setWhen, diffV, setDiffV, onReject, onGenerate, onEdit, onValidate, onSchedule }: WbProps) {
  const p = prop(dossier.propertyId), a = agent(dossier.agentId)
  const state = stateOf(dossier, sel.c)
  const checks = doc ? checksOf(doc) : []
  const hasFail = checks.some((c) => c.state === 'fail')
  const okCount = checks.filter((c) => c.state === 'ok').length
  const external = EXTERNAL.has(sel.c)
  const versions: Snapshot[] = doc ? [...(doc.history ?? []).filter((h) => h.v < doc.version), currentMeta(doc)].sort((x, y) => y.v - x.v) : []
  const shown = versions.find((v) => v.v === diffV) ?? versions[0]
  const prevOf = shown ? versions.find((v) => v.v < shown.v) : undefined
  const regen = busy === 'gen'
  const hour = new Date(when).getHours()
  const quiet = hour < 8 || hour >= 20
  const sent = out && isSent(out)

  return (
    <>
      {/* Aperçu */}
      <Stagger i={2} className="min-w-0">
        <Card pad={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="num rounded-full bg-champagne/15 px-2.5 py-0.5 text-[12px] text-champagne-300">{sel.c}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${DELIV_TONE[state].c}`}>{DELIV_TONE[state].l}</span>
                {out && <span className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${sent ? 'bg-white/[0.04] text-bone/60 ring-white/10' : 'bg-sea/15 text-sea ring-sea/25'}`}>{sent ? `Envoi consigné${out.scheduledFor ? ` · prévu ${dt(out.scheduledFor)}` : ''}` : 'Envoi en file'}</span>}
              </div>
              <h2 className="display mt-2 text-3xl">{nameOf(sel.c)}</h2>
              <div className="mt-1 text-[12px] text-mist">
                <Link to={`/app/dossiers/${dossier.id}`} className="hover:text-bone">{dossier.seller}</Link>
                {doc ? <> · version {doc.version} · {doc.sources?.length ?? 0} source(s) · {doc.editedBy ? `modifiée par ${doc.editedBy}` : 'préparée par le copilote'} le {dt(doc.editedAt ?? doc.createdAt)}</> : ' · pas encore généré'}
              </div>
            </div>
            {editing && <span className="flex items-center gap-1.5 rounded-full bg-champagne/15 px-3 py-1 text-[11.5px] text-champagne-300 ring-1 ring-champagne/30"><PencilSimple size={12} /> Mode édition</span>}
          </div>
          {doc?.rejected && state === 'blocked' && <div className="mx-5 mb-4 flex gap-2 rounded-xl bg-coral/[0.08] p-3 text-[12.5px] text-coral ring-1 ring-coral/20"><ArrowBendUpLeft size={15} className="mt-px shrink-0" /><span>Renvoyé en correction le {dt(doc.rejected.at)} : « {doc.rejected.reason} »</span></div>}
          <div className="px-3 pb-3 md:px-5 md:pb-5">
            <div className="relative rounded-[1.1rem] bg-ink-700/60 p-2 md:p-4">
              {!doc && (
                <div className="flex min-h-[340px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 p-8 text-center">
                  {state === 'running' ? <ArrowsClockwise size={22} className="animate-spin text-sea" /> : <Sparkle size={22} className="text-champagne" />}
                  <p className="mt-3 max-w-sm text-[13.5px] text-bone/60">{state === 'running' ? 'Le livrable est marqué « en cours » mais aucun document n’a encore été produit. Vous pouvez relancer la génération.' : state === 'done' ? 'Livrable marqué prêt, mais aucun document n’est conservé dans Jaspe. Générez-le pour l’archiver avec ses sources.' : 'Le copilote prépare ce livrable à partir des faits du dossier, avec ses sources datées.'}</p>
                  <div className="mt-5"><SoftBtn tone="gold" icon={<Sparkle size={13} weight="fill" />} onClick={() => onGenerate()}>{regen ? 'Génération…' : 'Générer maintenant'}</SoftBtn></div>
                </div>
              )}
              {doc && editing && (
                <div className="rounded-xl bg-ink-800 p-5">
                  <AsyncForm submitLabel={`Enregistrer la version ${doc.version + 1}`} success="Nouvelle version enregistrée" onCancel={() => setEditing(false)} onSubmit={(v) => onEdit(doc, v)}>
                    {doc.subject !== undefined && <Field label="Objet"><Input name="subject" defaultValue={doc.subject} required /></Field>}
                    <Field label="Texte · un paragraphe par bloc (ligne vide entre deux blocs)"><Textarea name="body" rows={14} defaultValue={(doc.body ?? []).join('\n\n')} /></Field>
                    {doc.posts && <p className="text-[12px] text-mist">Les publications réseaux sont régénérées par le copilote ; seul le texte d’accompagnement est modifiable ici.</p>}
                  </AsyncForm>
                </div>
              )}
              {doc && !editing && (
                <AnimatePresence mode="wait">
                  <motion.div key={`${doc.id}:${doc.version}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.55, ease: EXPO }}
                    className="theme-dark relative overflow-hidden rounded-xl bg-bone-50 p-5 font-serif text-ink shadow-float md:p-7">
                    <StudioDoc doc={doc} d={dossier} p={p} a={a} />
                    <div className="mt-7 border-t border-ink/10 pt-3 font-sans text-[10px] leading-relaxed text-ink/45">
                      {(doc.sources ?? []).map((s, i) => <span key={i} className="mr-3 inline-block">[{i + 1}] {s.label} — {s.date}</span>)}
                      {!doc.sources?.length && 'Aucune source citée'}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
              <AnimatePresence>
                {regen && doc && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-2 flex items-center justify-center overflow-hidden rounded-xl bg-ink/55 backdrop-blur-[3px] md:inset-4">
                    <span className="absolute inset-x-0 top-0 h-24 animate-scan bg-gradient-to-b from-transparent via-champagne/20 to-transparent" />
                    <span className="relative flex items-center gap-2 rounded-full bg-ink-800 px-4 py-2 text-[13px] ring-1 ring-champagne/30"><Sparkle size={14} weight="fill" className="animate-pulse text-champagne" /> Régénération — revérification des sources…</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Card>
      </Stagger>

      {/* Contrôles */}
      <div className="space-y-6">
        <Stagger i={3}>
          <Card>
            {hasFail && <div className="mb-3 flex gap-2 rounded-xl bg-coral/[0.08] p-3 text-[12px] text-coral ring-1 ring-coral/20"><ShieldCheck size={15} className="mt-px shrink-0" />Un contrôle échoue : vérifiez avant toute validation.</div>}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onValidate} disabled={!doc || state === 'done' || !!busy || editing} className="col-span-2 flex items-center justify-center gap-2 rounded-full bg-champagne py-2.5 text-[13px] font-medium text-ink shadow-glow transition-all duration-300 ease-silk hover:bg-champagne-300 active:scale-[0.98] disabled:opacity-40 disabled:shadow-none">
                <CheckCircle size={15} weight="fill" />{busy === 'ok' ? 'Validation…' : state === 'done' ? 'Validé' : hasFail ? 'Valider avec réserve' : 'Valider'}
              </button>
              <button onClick={() => setEditing(!editing)} disabled={!doc} className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-[12.5px] ring-1 transition disabled:opacity-40 ${editing ? 'bg-champagne/15 text-champagne-300 ring-champagne/30' : 'bg-white/[0.04] ring-white/[0.08] hover:bg-white/[0.08]'}`}><PencilSimple size={14} />{editing ? 'Fermer' : 'Modifier'}</button>
              <button onClick={() => onGenerate(doc)} disabled={!!busy} className="flex items-center justify-center gap-1.5 rounded-full bg-white/[0.04] py-2 text-[12.5px] ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] disabled:opacity-50"><ArrowsClockwise size={14} className={regen ? 'animate-spin' : ''} />Régénérer</button>
              <button onClick={onReject} disabled={state === 'done' || state === 'waiting'} className="col-span-2 flex items-center justify-center gap-1.5 rounded-full bg-white/[0.04] py-2 text-[12.5px] ring-1 ring-white/[0.08] transition hover:bg-coral/10 hover:text-coral disabled:opacity-40"><ArrowBendUpLeft size={14} />Renvoyer en correction</button>
              <div className="relative col-span-2">
                <button onClick={() => setPlan(!plan)} disabled={!doc || !external || !!sent} className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white/[0.04] py-2 text-[12.5px] ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] disabled:opacity-40"><CalendarBlank size={14} />{sent ? 'Envoi déjà consigné' : 'Programmer l’envoi'}</button>
                {!external && <div className="mt-1.5 text-center text-[11px] text-mist">Document interne : aucun envoi externe.</div>}
                <AnimatePresence>
                  {plan && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.35, ease: EXPO }} className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl bg-ink-700 p-4 shadow-float ring-1 ring-white/10">
                      <div className="flex items-center justify-between"><span className="text-[10.5px] uppercase tracking-eyebrow text-mist">Programmer l’envoi</span><button onClick={() => setPlan(false)} aria-label="Fermer" className="text-mist hover:text-bone"><X size={13} /></button></div>
                      <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="num mt-2 w-full rounded-xl bg-white/[0.04] px-3 py-2 text-[13px] text-bone ring-1 ring-white/10 focus:outline-none focus:ring-champagne/40" />
                      <div className={`mt-2 text-[11px] ${quiet ? 'text-coral' : 'text-bone/50'}`}>{quiet ? 'Horaire dans la fenêtre calme (20 h → 8 h) : choisissez un autre créneau.' : `${state === 'done' ? 'Déjà validé' : 'Valide le livrable'}, puis consigne l’envoi vers ${doc?.to ?? 'le destinataire'}.`}</div>
                      <div className="mt-2 rounded-lg bg-white/[0.03] px-2.5 py-2 text-[11px] text-bone/55 ring-1 ring-white/[0.06]">Aucun connecteur d’envoi configuré : l’envoi est consigné dans la file, pas réellement émis.</div>
                      <button onClick={onSchedule} disabled={quiet || !!busy} className="mt-3 w-full rounded-full bg-bone py-2 text-[12.5px] font-medium text-ink transition hover:bg-bone-50 disabled:opacity-40">{busy === 'plan' ? 'Programmation…' : 'Valider et programmer'}</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>
        </Stagger>
        {doc && (
          <>
            <Stagger i={4}>
              <Card title="Contrôles qualité" kicker="Calculés sur le document" action={<span className={`num text-[12px] ${hasFail ? 'text-coral' : okCount === checks.length ? 'text-sage' : 'text-champagne-300'}`}>{okCount}/{checks.length}</span>}>
                <div className="space-y-1.5">
                  {checks.map((c) => (
                    <div key={c.label} className={`flex gap-2.5 rounded-xl px-3 py-2.5 ring-1 ${c.state === 'fail' ? 'bg-coral/[0.06] ring-coral/20' : c.state === 'warn' ? 'bg-champagne/[0.05] ring-champagne/15' : 'bg-white/[0.02] ring-white/[0.05]'}`}>
                      <span className="mt-px">{CHECK_ICON[c.state]}</span>
                      <div className="min-w-0 leading-tight"><div className="text-[12.5px]">{c.label}</div><div className="mt-0.5 break-words text-[11px] text-bone/50">{c.detail}</div></div>
                    </div>
                  ))}
                </div>
              </Card>
            </Stagger>
            <Stagger i={5}>
              <Card title="Sources citées" kicker={`${doc.sources?.length ?? 0} référence(s) datée(s)`} action={<BookOpenText size={16} weight="light" className="text-mist" />}>
                <ol className="space-y-2">
                  {(doc.sources ?? []).map((s, i) => <li key={i} className="flex gap-2.5 text-[12.5px]"><span className="num mt-px text-[11px] text-champagne-300">[{i + 1}]</span><div className="min-w-0 flex-1 leading-tight">{s.label}</div><span className="num shrink-0 text-[10.5px] text-mist">{s.date}</span></li>)}
                  {!doc.sources?.length && <li className="text-[12.5px] text-coral">Aucune source : régénérez le document.</li>}
                </ol>
              </Card>
            </Stagger>
            <Stagger i={6}>
              <Card title="Historique des versions" kicker={`${versions.length} version(s) conservée(s)`} action={<ClockCounterClockwise size={16} weight="light" className="text-mist" />}>
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                  {versions.map((v, i) => <button key={`${i}-${v.v}`} onClick={() => setDiffV(v.v)} className={`shrink-0 rounded-full px-3 py-1 text-[11.5px] ring-1 transition ${shown?.v === v.v ? 'bg-champagne/15 text-champagne-300 ring-champagne/30' : 'text-bone/60 ring-white/[0.07] hover:text-bone'}`}>v{v.v}{v.v === doc.version && ' · actuelle'}</button>)}
                </div>
                {shown && (
                  <AnimatePresence mode="wait">
                    <motion.div key={shown.v} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EXPO }} className="mt-3">
                      <div className="text-[11px] text-mist">{dt(shown.at)} · {shown.by} · {shown.note}</div>
                      <div className="thin-scroll mt-2 max-h-56 space-y-1 overflow-y-auto rounded-xl bg-ink/60 p-3 font-mono text-[11px] leading-relaxed ring-1 ring-white/[0.05]">
                        {prevOf ? (() => {
                          const d = diffOf(prevOf, shown)
                          return d.length ? d.map((l, i) => <div key={i}>{l.del && <div className="text-coral"><span className="mr-1.5 select-none opacity-60">−</span><span className="line-through decoration-coral/40">{l.del}</span></div>}{l.ins && <div className="text-sage"><span className="mr-1.5 select-none opacity-60">+</span>{l.ins}</div>}</div>) : <div className="text-bone/50">Texte identique à v{prevOf.v} (régénération sans changement).</div>
                        })() : <div className="text-bone/50">{shown.v === 1 ? `Première version · ${shown.body.length} paragraphe(s).` : `Versions antérieures à v${shown.v} non conservées dans l’historique.`}</div>}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </Card>
            </Stagger>
          </>
        )}
      </div>
    </>
  )
}

/** File des envois externes (collection outbox). */
function Envois({ outbox, dossiers, busy, onSend, onRemove, onOpen }: { outbox: OutRow[]; dossiers: Dossier[]; busy: string | null; onSend: (o: OutRow) => void; onRemove: (o: OutRow) => void; onOpen: (o: OutRow) => void }) {
  const [f, setF] = useState<'all' | 'queued' | 'sent'>('all')
  const list = outbox.filter((o) => f === 'all' || (f === 'sent') === isSent(o))
  return (
    <div className="space-y-4">
      <Stagger i={1}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Tabs id="out-f" value={f} onChange={setF} items={[{ id: 'all', label: 'Tous', count: outbox.length }, { id: 'queued', label: 'En file', count: outbox.filter((o) => !isSent(o)).length }, { id: 'sent', label: 'Consignés', count: outbox.filter(isSent).length }]} />
          <div className="flex items-center gap-2 rounded-full bg-champagne/[0.07] px-3.5 py-2 text-[12px] text-bone/70 ring-1 ring-champagne/20"><ShieldCheck size={14} className="shrink-0 text-champagne-300" />Aucun connecteur e-mail, courrier ou réseau configuré : les envois sont consignés, jamais réellement émis.</div>
        </div>
      </Stagger>
      <Stagger i={2}>
        <Card pad={false}>
          {!list.length ? <div className="p-5"><Empty title="Aucun envoi">Validez un livrable externe (L1, L3–L7) : son envoi apparaîtra ici.</Empty></div> : (
            <div className="overflow-x-auto">
              <div className="min-w-[860px]">
                <div className="grid grid-cols-[200px_1fr_120px_150px_150px_140px] gap-3 border-b border-white/[0.05] px-5 py-3 text-[10px] uppercase tracking-eyebrow text-mist"><span>Livrable</span><span>Destinataire · objet</span><span>Canal</span><span>Statut</span><span>Date</span><span className="text-right">Actions</span></div>
                {list.map((o) => {
                  const d = dossiers.find((x) => x.id === o.dossierId), sent = isSent(o)
                  return (
                    <div key={o.id} className="grid grid-cols-[200px_1fr_120px_150px_150px_140px] items-center gap-3 border-b border-white/[0.035] px-5 py-3 text-[13px] last:border-0">
                      <div className="min-w-0"><div className="flex items-center gap-2"><span className="num rounded-full bg-champagne/15 px-2 py-0.5 text-[11px] text-champagne-300">{o.code}</span><span className="truncate text-[12px]">{nameOf(o.code)}</span></div><div className="mt-0.5 truncate text-[11px] text-mist">{d?.seller ?? o.dossierId}</div></div>
                      <div className="min-w-0"><div className="truncate">{o.to}</div><div className="truncate text-[11.5px] text-mist">{o.subject}</div></div>
                      <span className="text-[12px] text-bone/70">{o.channel}</span>
                      <span><span className={`inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[11px] ring-1 ${sent ? 'bg-white/[0.04] text-bone/65 ring-white/10' : 'bg-sea/15 text-sea ring-sea/25'}`} title={o.status}>{sent ? 'Consigné · non émis' : 'Programmé'}</span></span>
                      <div className="num text-[11.5px] leading-tight text-bone/70">{o.scheduledFor ? <>Prévu {dt(o.scheduledFor)}</> : <>Créé {dt(o.at)}</>}{o.sentAt && <div className="text-[10.5px] text-mist">consigné {dt(o.sentAt)}</div>}</div>
                      <div className="flex justify-end gap-1.5">
                        {!sent && <button onClick={() => onSend(o)} disabled={!!busy} className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1 text-[11.5px] ring-1 ring-white/10 transition hover:bg-white/[0.08] disabled:opacity-50"><PaperPlaneTilt size={12} />{busy === `send-${o.id}` ? '…' : 'Consigner'}</button>}
                        <button onClick={() => onOpen(o)} aria-label="Ouvrir le livrable" title="Ouvrir le livrable" className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.04] text-bone/70 ring-1 ring-white/10 hover:text-bone"><ArrowSquareOut size={13} /></button>
                        <button onClick={() => onRemove(o)} aria-label="Retirer de la file" title="Retirer de la file" className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.04] text-bone/70 ring-1 ring-white/10 hover:text-coral"><Trash size={13} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>
      </Stagger>
    </div>
  )
}

/** Les neuf livrables réels d'un dossier en éventail. */
function FanView({ dossiers, fanD, setFanD, docOf, onPick }: { dossiers: Dossier[]; fanD: string | null; setFanD: (v: string) => void; docOf: (d: string, c: string) => Doc2 | undefined; onPick: (s: Sel) => void }) {
  const eligible = dossiers.filter((d) => FAN_CODES.some((c) => stateOf(d, c) !== 'waiting'))
  const d = eligible.find((x) => x.id === fanD) ?? eligible[0]
  const [hover, setHover] = useState<number | null>(null)
  if (!d) return <Empty title="Aucun dossier au stade livrables">Les livrables L1–L9 apparaissent après la découverte vendeur.</Empty>
  const p = prop(d.propertyId)
  const photos = [p.photo, ...p.gallery]
  return (
    <div className="space-y-4">
      <Tabs id="fan-d" value={d.id} onChange={setFanD} items={eligible.map((x) => ({ id: x.id, label: x.seller }))} />
      <Card title="Les neuf livrables du dossier" kicker="Survolez une carte · cliquez pour l’ouvrir en validation">
        <div className="relative -mx-5 h-[330px] overflow-hidden sm:h-[500px]">
          <div className="absolute left-5 top-0 z-30 sm:left-8">
            <div className="display text-3xl sm:text-4xl">{p.title}</div>
            <div className="mt-1 text-[12px] text-mist">{d.seller} · {FAN_CODES.filter((c) => stateOf(d, c) === 'done').length}/9 prêts · {FAN_CODES.filter((c) => stateOf(d, c) === 'review').length} à valider · {FAN_CODES.filter((c) => docOf(d.id, c)).length} document(s) généré(s)</div>
          </div>
          <div className="absolute left-1/2 top-24 h-[340px] w-[760px] origin-top -translate-x-1/2 scale-[0.5] sm:top-20 sm:scale-100">
            {FAN_CODES.map((c, i) => {
              const s = stateOf(d, c), mid = i - 4, lifted = hover === i, doc = docOf(d.id, c)
              const snippet = doc?.subject ?? doc?.body?.[0]
              return (
                <motion.button key={`${d.id}${c}`} onClick={() => onPick({ d: d.id, c })} onHoverStart={() => setHover(i)} onHoverEnd={() => setHover(null)}
                  className="absolute left-1/2 top-6 -ml-[85px] h-[250px] w-[170px] text-left"
                  style={{ transformOrigin: '50% 280%', zIndex: lifted ? 20 : 10 - Math.abs(mid) }}
                  initial={{ rotate: 0, y: 60, opacity: 0 }}
                  animate={{ rotate: mid * 6.5 * (hover !== null && !lifted ? 1.06 : 1), y: lifted ? -34 : 0, opacity: 1, scale: lifted ? 1.06 : 1 }}
                  transition={{ duration: 0.9, delay: hover === null ? 0.05 + i * 0.045 : 0, ease: EXPO }}>
                  <div className={`h-full overflow-hidden rounded-2xl bg-ink-700 shadow-float ring-1 transition-colors duration-300 ${lifted ? 'ring-champagne/50' : 'ring-white/10'}`}>
                    <div className="relative h-[150px] overflow-hidden">
                      {PHOTO_CODES.has(c)
                        ? <img src={photos[i % photos.length]} alt="" className={`h-full w-full object-cover ${doc ? '' : 'opacity-40 grayscale'}`} />
                        : <div className="theme-dark h-full bg-bone-50 p-4">{doc ? <p className="line-clamp-5 font-serif text-[12.5px] leading-snug text-ink/80">{snippet}</p> : [90, 70, 84, 60, 76, 50].map((w, j) => <div key={j} className={`mb-2 h-1.5 rounded-full ${j === 0 ? 'h-2.5 bg-ink/30' : 'bg-ink/10'}`} style={{ width: `${w}%` }} />)}</div>}
                      <span className="num absolute left-2.5 top-2.5 rounded-full bg-ink/75 px-2 py-0.5 text-[11px] text-champagne-300 backdrop-blur">{c}{doc && ` · v${doc.version}`}</span>
                      {(c === 'L4' || c === 'L8') && doc && <span className="theme-dark absolute bottom-2 left-2 rounded-full bg-ink/75 px-1.5 py-0.5 text-[9px] text-bone backdrop-blur">IA étiquetée</span>}
                    </div>
                    <div className="p-3.5">
                      <div className="text-[13px] leading-tight">{nameOf(c)}</div>
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-mist"><span className={`h-1.5 w-1.5 rounded-full ${DOT[s]}`} />{DELIV_TONE[s].l}{!doc && ' · non généré'}</div>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )
}
