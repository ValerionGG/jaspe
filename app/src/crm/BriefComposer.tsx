// « Un brief, et l’assistant s’occupe du reste » : texte ou dictée → plan d’actions expliqué → le conseiller coche → exécution.
// Chaque action cite la phrase qui l’a déclenchée ; rien ne part chez le client sans validation.
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { Microphone, Stop, Sparkle, ArrowsClockwise, FileText, Binoculars, PushPin, Receipt, Scales, CheckSquare, CheckCircle, ArrowRight } from '@phosphor-icons/react'
import { Modal, Field, Select, Textarea, Input, toast, errText } from './forms'
import { SoftBtn } from './ui'
import { useDossiers } from '../data/collections'
import { action } from '../data/store'
import type { PlanItem } from '../data/assist'
import { markDay1 } from '../ui/mode'

type Rec = { start: () => void; stop: () => void; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null; lang: string; continuous: boolean; interimResults: boolean }
const SR = () => { const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }; return w.SpeechRecognition ?? w.webkitSpeechRecognition }

const TYPE = {
  relance: { icon: ArrowsClockwise, label: 'Relance', tone: 'text-champagne-300 bg-champagne/10' },
  document: { icon: FileText, label: 'Brouillon', tone: 'text-sea bg-sea/10' },
  veille: { icon: Binoculars, label: 'Veille', tone: 'text-sage bg-sage/10' },
  point: { icon: PushPin, label: 'Point ouvert', tone: 'text-bone/70 bg-white/[0.05]' },
  facture: { icon: Receipt, label: 'Facture', tone: 'text-champagne-300 bg-champagne/10' },
  conformite: { icon: Scales, label: 'Conformité', tone: 'text-coral bg-coral/10' },
  tache: { icon: CheckSquare, label: 'Tâche', tone: 'text-sea bg-sea/10' },
} as const

const EXAMPLE = 'Je rappelle le vendeur vendredi après le diagnostic. Le prix reste à confirmer avec lui. Préparer l’estimation et la sélection d’acquéreurs. Mettre une veille sur les comparables du quartier.'
const fday = (d?: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : 'sans date')

export function BriefComposer() {
  const loc = useLocation()
  const [dossiers] = useDossiers()
  const [open, setOpen] = useState(false)
  const [dossierId, setDossierId] = useState('')
  const [text, setText] = useState('')
  const [items, setItems] = useState<PlanItem[] | null>(null)
  const [done, setDone] = useState<PlanItem[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [rec, setRec] = useState<Rec | null>(null)
  const textRef = useRef(text); textRef.current = text

  useEffect(() => {
    const o = () => { const m = loc.pathname.match(/\/dossiers\/([^/]+)/); setDossierId(m?.[1] ?? ''); setItems(null); setDone(null); setOpen(true) }
    window.addEventListener('nxt:brief', o)
    return () => window.removeEventListener('nxt:brief', o)
  }, [loc.pathname])
  useEffect(() => () => rec?.stop(), [rec])

  const close = () => { rec?.stop(); setOpen(false) }
  const dictate = () => {
    if (rec) { rec.stop(); return }
    const C = SR()
    if (!C) { toast('Dictée indisponible dans ce navigateur (Chrome ou Edge) — tapez ou collez le brief', 'info'); return }
    const r = new C(); r.lang = 'fr-FR'; r.continuous = true; r.interimResults = false
    r.onresult = (e) => { let fin = ''; for (let k = e.resultIndex; k < e.results.length; k++) if (e.results[k].isFinal) fin += e.results[k][0].transcript; if (fin) setText(`${textRef.current}${textRef.current && !/\s$/.test(textRef.current) ? ' ' : ''}${fin.trim()}`) }
    r.onerror = (e) => toast(e.error === 'not-allowed' ? 'Micro refusé : autorisez-le dans le navigateur' : `Dictée interrompue (${e.error})`, 'error')
    r.onend = () => setRec(null)
    try { r.start(); setRec(r) } catch (x) { toast(errText(x), 'error') }
  }
  const analyse = async () => {
    setBusy(true)
    try {
      const r = await action<{ items: PlanItem[] }>('assistant.plan', { text })
      setItems(r.items)
      if (!r.items.length) toast('Aucune action reconnue : précisez qui relancer, quand, et quel document préparer', 'info')
    } catch (e) { toast(errText(e), 'error') } finally { setBusy(false) }
  }
  const apply = async () => {
    if (!items) return
    setBusy(true)
    try {
      const r = await action<{ done: PlanItem[] }>('assistant.apply', { dossierId: dossierId || undefined, items, text })
      setDone(r.done)
      markDay1('brief')
      toast(`${r.done.length} action(s) lancée(s)`)
    } catch (e) { toast(errText(e), 'error') } finally { setBusy(false) }
  }
  const set = (id: string, p: Partial<PlanItem>) => setItems((xs) => xs?.map((x) => (x.id === id ? { ...x, ...p } : x)) ?? null)
  const needsDossier = items?.some((i) => i.selected && ['document', 'facture', 'conformite'].includes(i.type)) && !dossierId
  const n = items?.filter((i) => i.selected).length ?? 0
  const dossier = dossiers.find((d) => d.id === dossierId)

  return (
    <Modal open={open} onClose={close} kicker="Assistant" title="Un brief, un plan d’action" width={680}>
      {done ? (
        <div className="space-y-4">
          <p className="text-[13.5px] text-bone/70">C’est lancé. Les brouillons attendent votre relecture, aucun message n’est parti.</p>
          <ul className="space-y-2">
            {done.map((it) => { const T = TYPE[it.type]; return (
              <li key={it.id} className="flex items-start gap-3 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
                <CheckCircle size={17} weight="fill" className="mt-0.5 shrink-0 text-sage" />
                <div className="min-w-0 flex-1"><div className="text-[13.5px]">{it.label}</div><div className="text-[11.5px] text-mist">{T.label} · {it.result}</div></div>
              </li>
            ) })}
          </ul>
          <div className="flex flex-wrap justify-end gap-2">
            <SoftBtn onClick={() => { setItems(null); setDone(null); setText('') }}>Nouveau brief</SoftBtn>
            <Link to="/app/taches" onClick={close}><SoftBtn icon={<CheckSquare size={14} />}>Voir les tâches</SoftBtn></Link>
            {dossier && <Link to={`/app/dossiers/${dossier.id}`} onClick={close}><SoftBtn tone="gold" icon={<ArrowRight size={14} />}>Ouvrir le dossier</SoftBtn></Link>}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Field label="Dossier concerné" hint="Nécessaire pour préparer des documents, une facture ou la conformité">
            <Select value={dossierId} onChange={(e) => setDossierId(e.target.value)}>
              <option value="">Aucun dossier (relances et tâches seulement)</option>
              {dossiers.map((d) => <option key={d.id} value={d.id}>{d.seller} · {d.ref}</option>)}
            </Select>
          </Field>
          <Field label="Brief ou débrief" hint="Dites ce qui a été convenu : qui relancer et quand, quels documents, ce qu’il faut surveiller">
            <div className="relative">
              <Textarea rows={5} value={text} onChange={(e) => { setText(e.target.value); setItems(null) }} placeholder={EXAMPLE} />
              <button type="button" onClick={dictate} aria-label={rec ? 'Arrêter la dictée' : 'Dicter'} className={clsx('absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full ring-1 transition', rec ? 'animate-pulse bg-coral text-ink ring-coral' : 'bg-white/[0.05] text-bone/70 ring-white/10 hover:text-bone')}>
                {rec ? <Stop size={15} weight="fill" /> : <Microphone size={16} />}
              </button>
            </div>
          </Field>
          {!text && <button type="button" onClick={() => setText(EXAMPLE)} className="text-[12px] text-champagne-300 hover:underline">Essayer avec un exemple</button>}

          {items && items.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10.5px] uppercase tracking-eyebrow text-mist">Plan proposé · cochez ce qui doit être lancé</div>
              {items.map((it) => { const T = TYPE[it.type]; return (
                <label key={it.id} className={clsx('flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1 transition', it.selected ? 'bg-white/[0.04] ring-white/[0.1]' : 'bg-transparent ring-white/[0.05] opacity-60')}>
                  <input type="checkbox" checked={it.selected} onChange={(e) => set(it.id, { selected: e.target.checked })} className="mt-1 accent-[rgb(var(--acc-500))]" />
                  <span className={clsx('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', T.tone)}><T.icon size={14} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px]">{it.label}</span>
                    <span className="mt-0.5 block text-[11.5px] italic text-mist">« {it.source} »</span>
                  </span>
                  {(it.type === 'relance' || it.type === 'tache') && (
                    <Input type="date" value={it.due ?? ''} onChange={(e) => set(it.id, { due: e.target.value })} className="!w-[150px] !py-1.5 text-[12px]" aria-label="Échéance" title={fday(it.due)} />
                  )}
                </label>
              ) })}
              {needsDossier && <p className="text-[12px] text-coral">Choisissez un dossier : certaines actions cochées en ont besoin.</p>}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-[11.5px] text-mist">Vous gardez la main : brouillons à relire, aucun envoi automatique.</span>
            <div className="flex gap-2">
              <SoftBtn onClick={close}>Fermer</SoftBtn>
              {!items || !items.length
                ? <SoftBtn tone="gold" disabled={!text.trim() || busy} onClick={analyse} icon={<Sparkle size={14} weight="fill" />}>{busy ? 'Analyse…' : 'Proposer un plan'}</SoftBtn>
                : <SoftBtn tone="gold" disabled={!n || busy || !!needsDossier} onClick={apply} icon={<CheckCircle size={14} />}>{busy ? 'Lancement…' : `Lancer ${n} action${n > 1 ? 's' : ''}`}</SoftBtn>}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

export const openBrief = () => window.dispatchEvent(new Event('nxt:brief'))
