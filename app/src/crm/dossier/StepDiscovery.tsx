import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import clsx from 'clsx'
import { PlayCircle, CheckCircle, Warning, CloudCheck, CloudArrowUp, CloudSlash, ChatTeardropText, SealCheck, ArrowRight, Lightning } from '@phosphor-icons/react'
import { Card, SoftBtn } from '../ui'
import { EXPO } from '../../ui/kit'
import { DISCOVERY_BLOCKS, type FieldVal, type Origin } from '../../data/dossier'
import { STAGES } from '../../data/mock'
import { action } from '../../data/store'
import { Modal, toast, errText } from '../forms'
import type { StepProps } from './index'
import { CRITICAL, QUESTIONS, type JourneyX } from './prep-model'
import { useLatest } from './prep-ui'
import { Interview, Debrief, Photos, ORIGINS, ORIGIN_TONE, FIELDS, LABELS } from './prep-interview'

type Disc = Record<string, FieldVal>
const has = (d: Disc, k: string) => !!d[k]?.v?.trim()
const isCritical = (k: string) => (CRITICAL as readonly string[]).includes(k)

export default function StepDiscovery({ dossier: d, journey, save, goTo }: StepProps) {
  const j = journey as JourneyX
  const [draft, setDraft] = useState<Disc>(journey.discovery)
  const [block, setBlock] = useState<string>(() => DISCOVERY_BLOCKS.find((b) => b.fields.some(([k]) => !has(journey.discovery, k)))?.id ?? DISCOVERY_BLOCKS[0].id)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [savedAt, setSavedAt] = useState('')
  const [interview, setInterview] = useState<string | false>(false)
  const [confirm, setConfirm] = useState(false)
  const [moving, setMoving] = useState(false)
  const pending = useRef<number | undefined>(undefined)
  const draftRef = useRef(draft)
  const latest = useLatest({ save })

  // Mise à jour distante (autre onglet, extraction serveur) : on l’accepte tant qu’aucune saisie locale n’est en attente.
  const remote = JSON.stringify(journey.discovery)
  useEffect(() => { if (pending.current === undefined) { draftRef.current = journey.discovery; setDraft(journey.discovery) } }, [remote]) // eslint-disable-line react-hooks/exhaustive-deps

  const persist = async (next: Disc) => {
    setStatus('saving')
    try { await latest.current.save({ discovery: next }); setStatus('saved'); setSavedAt(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })) } catch (x) { setStatus('error'); toast(errText(x), 'error') }
  }
  const flush = async () => { if (pending.current !== undefined) { clearTimeout(pending.current); pending.current = undefined; await persist(draftRef.current) } }
  const setField = (k: string, patch: Partial<FieldVal>) => {
    const prev = draftRef.current[k]
    const next = { ...draftRef.current, [k]: { v: prev?.v ?? '', origin: prev?.origin ?? 'déclaré', ...patch } }
    draftRef.current = next; setDraft(next); setStatus('saving')
    clearTimeout(pending.current)
    pending.current = window.setTimeout(() => { pending.current = undefined; persist(draftRef.current) }, 700)
  }
  // Aucune saisie perdue en quittant l’étape.
  useEffect(() => () => { if (pending.current !== undefined) { clearTimeout(pending.current); latest.current.save({ discovery: draftRef.current }).catch(() => {}) } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filled = FIELDS.filter((f) => has(draft, f.k)).length
  const total = Math.round((filled / FIELDS.length) * 100)
  const perBlock = DISCOVERY_BLOCKS.map((b) => ({ ...b, n: b.fields.filter(([k]) => has(draft, k)).length }))
  const missingCritical = CRITICAL.filter((k) => !has(draft, k))
  const toConfirm = FIELDS.filter((f) => has(draft, f.k) && draft[f.k].origin === 'à confirmer')
  const cur = perBlock.find((b) => b.id === block)!
  const suggestions = cur.fields.filter(([k]) => !has(draft, k)).map(([k]) => ({ k, q: QUESTIONS[k] })).slice(0, 4)
  const stageIdx = STAGES.findIndex((s) => s.id === d.stage)
  const canValidate = stageIdx <= 1

  const focus = (k: string) => {
    const b = DISCOVERY_BLOCKS.find((x) => x.fields.some(([f]) => f === k))
    if (b) setBlock(b.id)
    setTimeout(() => { const el = document.getElementById(`d5-${k}`); el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); el?.focus() }, 120)
  }

  const validate = async () => {
    setMoving(true)
    try {
      clearTimeout(pending.current); pending.current = undefined
      await save({ discovery: draftRef.current, ...(journey.debrief ? { debrief: { ...journey.debrief, validated: true } } : {}) }, { stage: 'post', deliverables: { ...d.deliverables, D5: 'done' } })
      await action('dossier.move', { id: d.id, stage: 'post' })
      toast('Découverte validée — les 9 livrables L1 → L9 sont en préparation')
      setConfirm(false)
      goTo('deliverables')
    } catch (x) { toast(errText(x), 'error') } finally { setMoving(false) }
  }

  const S = status === 'error' ? CloudSlash : status === 'saving' ? CloudArrowUp : CloudCheck
  return (
    <>
      {/* Synthèse D5 */}
      <Card>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-eyebrow text-mist">D5 · guide d’entretien <span className={clsx('flex items-center gap-1 normal-case tracking-normal', status === 'error' ? 'text-coral' : status === 'saving' ? 'text-sea' : 'text-sage')}><S size={13} />{status === 'saving' ? 'Enregistrement…' : status === 'error' ? 'Non enregistré' : savedAt ? `Enregistré à ${savedAt}` : 'Sauvegarde automatique'}</span></div>
            <div className="display mt-2 text-[2.4rem] leading-none md:text-[2.9rem]">Découverte <span className="italic text-champagne-300">{total} %</span></div>
            <div className="mt-2 text-[12.5px] text-bone/55"><span className="num">{filled}</span> champs sur <span className="num">{FIELDS.length}</span> · {missingCritical.length ? <span className="text-coral">{missingCritical.length} critique(s) manquant(s)</span> : <span className="text-sage">tous les champs critiques renseignés</span>}{toConfirm.length > 0 && <> · <span className="text-champagne-300">{toConfirm.length} à confirmer</span></>}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <SoftBtn tone="gold" icon={<PlayCircle size={15} weight="fill" />} onClick={() => setInterview('')}>Mode entretien</SoftBtn>
            {canValidate
              ? <SoftBtn icon={<SealCheck size={15} />} onClick={async () => { await flush(); setConfirm(true) }}>Valider la découverte</SoftBtn>
              : <SoftBtn icon={<ArrowRight size={14} />} onClick={() => goTo('deliverables')}>Livrables L1 → L9</SoftBtn>}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {perBlock.map((b) => {
            const p = b.n / b.fields.length, on = b.id === block
            return (
              <button key={b.id} onClick={() => setBlock(b.id)} className={clsx('relative rounded-2xl p-3 text-left ring-1 transition-colors', on ? 'ring-champagne/40' : 'bg-white/[0.02] ring-white/[0.06] hover:bg-white/[0.04]')}>
                {on && <motion.span layoutId="d5-block" className="absolute inset-0 rounded-2xl bg-champagne/[0.08]" transition={{ duration: 0.5, ease: EXPO }} />}
                <span className="relative block text-[12.5px] leading-tight">{b.label}</span>
                <span className="relative mt-2.5 block h-1 overflow-hidden rounded-full bg-white/[0.07]"><motion.span className={clsx('block h-full rounded-full', p >= 1 ? 'bg-sage' : 'bg-champagne')} initial={{ width: 0 }} animate={{ width: `${p * 100}%` }} transition={{ duration: 0.8, ease: EXPO }} /></span>
                <span className="num relative mt-1.5 block text-[10.5px] text-mist">{b.n}/{b.fields.length}</span>
              </button>
            )
          })}
        </div>
        {missingCritical.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 flex items-center gap-1.5 text-[11.5px] text-coral"><Warning size={13} />Critiques manquants</span>
            {missingCritical.map((k) => <button key={k} onClick={() => focus(k)} className="rounded-full bg-coral/10 px-2.5 py-1 text-[11.5px] text-coral ring-1 ring-coral/20 transition hover:bg-coral/15">{LABELS[k]}</button>)}
          </div>
        )}
      </Card>

      {/* Formulaire du bloc courant */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div key={block} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: EXPO }}>
            <Card title={cur.label} kicker={`Bloc ${perBlock.indexOf(cur) + 1} / ${perBlock.length}`} action={<span className="num text-[12px] text-mist">{cur.n}/{cur.fields.length}</span>}>
              <div className="grid gap-3 md:grid-cols-2">
                {cur.fields.map(([k, l]) => {
                  const f = draft[k], crit = isCritical(k), empty = !has(draft, k)
                  return (
                    <div key={k} className={clsx('rounded-2xl p-3.5 ring-1 transition-colors', crit && empty ? 'bg-coral/[0.04] ring-coral/25' : 'bg-white/[0.02] ring-white/[0.06] focus-within:ring-champagne/40')}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <label htmlFor={`d5-${k}`} className="flex items-center gap-1.5 text-[12px] text-bone/65">{l}{crit && <span className={clsx('h-1.5 w-1.5 rounded-full', empty ? 'bg-coral' : 'bg-sage')} title="Champ critique" />}</label>
                        <select value={f?.origin ?? 'déclaré'} disabled={empty} onChange={(e) => setField(k, { origin: e.target.value as Origin })} aria-label={`Origine — ${l}`} className={clsx('shrink-0 cursor-pointer appearance-none rounded-full px-2.5 py-0.5 text-[10.5px] outline-none ring-1 disabled:cursor-default disabled:opacity-40', ORIGIN_TONE[f?.origin ?? 'déclaré'])}>
                          {ORIGINS.map((o) => <option key={o} value={o} className="bg-ink-800 text-bone">{o}</option>)}
                        </select>
                      </div>
                      <textarea id={`d5-${k}`} value={f?.v ?? ''} rows={2} onChange={(e) => setField(k, { v: e.target.value })} placeholder={QUESTIONS[k]} className="w-full resize-none bg-transparent text-[13.5px] leading-relaxed text-bone outline-none placeholder:text-mist/70" />
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 flex justify-between">
                <button disabled={perBlock.indexOf(cur) === 0} onClick={() => setBlock(perBlock[perBlock.indexOf(cur) - 1].id)} className="text-[12.5px] text-bone/60 transition hover:text-bone disabled:opacity-30">← Bloc précédent</button>
                <button disabled={perBlock.indexOf(cur) === perBlock.length - 1} onClick={() => setBlock(perBlock[perBlock.indexOf(cur) + 1].id)} className="text-[12.5px] text-champagne-300 transition hover:text-champagne disabled:opacity-30">Bloc suivant →</button>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
        <Card title="Questions suggérées" kicker="Guide D5 · questions ouvertes">
          {suggestions.length === 0 ? <p className="flex items-center gap-2 text-[13px] text-sage"><CheckCircle size={16} weight="fill" />Bloc complet.</p> : (
            <ul className="grid gap-1 md:grid-cols-2">
              {suggestions.map((s) => <li key={s.k}><button onClick={() => setInterview(s.k)} className="group flex w-full gap-2.5 rounded-xl p-2.5 text-left transition hover:bg-white/[0.04]"><ChatTeardropText size={16} weight="light" className="mt-0.5 shrink-0 text-champagne-300" /><span className="text-[13px] leading-snug text-bone/85">{s.q}<span className="mt-0.5 block text-[11px] text-mist group-hover:text-champagne-300">{LABELS[s.k]} · poser en mode entretien →</span></span></button></li>)}
            </ul>
          )}
          <div className="mt-4 rounded-xl bg-white/[0.02] p-3 text-[11.5px] leading-relaxed text-mist ring-1 ring-white/[0.05]"><Lightning size={12} className="mb-0.5 mr-1 inline text-champagne-300" />Chaque champ porte son origine : une valeur « à confirmer » ne sera jamais présentée comme un fait dans L1–L9.</div>
        </Card>
      </div>

      <div className="space-y-6">
        <Debrief journey={journey} save={save} draft={draft} setField={setField} />
        <Photos journey={j} save={save as (p: Partial<JourneyX>) => Promise<void>} dossierId={d.id} />
      </div>

      {canValidate && (
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div><div className="text-[15px] font-medium">Fin d’entretien</div><p className="mt-1 text-[12.5px] text-bone/55">La validation passe le dossier en « {STAGES[2].label} » et lance AUT-024 : neuf livrables préparés en parallèle, chacun à relire avant envoi.</p></div>
            <SoftBtn tone="gold" icon={<SealCheck size={15} weight="fill" />} onClick={async () => { await flush(); setConfirm(true) }}>Valider la découverte</SoftBtn>
          </div>
        </Card>
      )}

      <AnimatePresence>{interview !== false && <Interview draft={draft} setField={setField} start={interview || undefined} onClose={() => { setInterview(false); flush() }} />}</AnimatePresence>

      <Modal open={confirm} onClose={() => setConfirm(false)} kicker={`${d.ref} · ${d.seller}`} title="Valider la découverte ?">
        <div className="space-y-3 text-[13.5px]">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/[0.06]"><span className="text-mist">Complétude</span><span className="num">{filled}/{FIELDS.length} · {total} %</span></div>
          {missingCritical.length > 0 && <div className="rounded-xl bg-coral/10 px-4 py-3 text-coral ring-1 ring-coral/20"><div className="flex items-center gap-2 font-medium"><Warning size={15} />{missingCritical.length} champ(s) critique(s) manquant(s)</div><div className="mt-1 text-[12.5px] opacity-90">{missingCritical.map((k) => LABELS[k]).join(' · ')} — les livrables concernés le signaleront.</div></div>}
          {toConfirm.length > 0 && <div className="rounded-xl bg-champagne/[0.07] px-4 py-3 text-[12.5px] text-bone/80 ring-1 ring-champagne/20">{toConfirm.length} valeur(s) « à confirmer » resteront marquées comme telles.</div>}
          <p className="text-bone/60">Le dossier passe en post-RDV et neuf livrables (L1 → L9) sont générés. Aucun n’est envoyé sans votre validation.</p>
        </div>
        <div className="mt-6 flex justify-end gap-2"><SoftBtn onClick={() => setConfirm(false)}>Annuler</SoftBtn><SoftBtn tone="gold" disabled={moving} onClick={validate} icon={<SealCheck size={14} weight="fill" />}>{moving ? 'Validation…' : 'Valider et lancer L1 → L9'}</SoftBtn></div>
      </Modal>
    </>
  )
}
