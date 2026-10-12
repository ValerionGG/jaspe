// D5 · Mode entretien plein écran, débrief vocal (dictée + extraction) et photos du bien.
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import clsx from 'clsx'
import { X, ArrowLeft, ArrowRight, Microphone, Stop, MagicWand, Check, SkipForward, UploadSimple, Trash, Image as ImageIcon, Seal, Keyboard, FastForward } from '@phosphor-icons/react'
import { EXPO } from '../../ui/kit'
import { DISCOVERY_BLOCKS, type FieldVal, type Origin, type Journey } from '../../data/dossier'
import { uploadFile } from '../../data/store'
import { toast, errText } from '../forms'
import { CRITICAL, QUESTIONS, extractFields, type JourneyX, type Proposal } from './prep-model'
import { Card } from '../ui'
import { useLatest } from './prep-ui'

export const ORIGINS: Origin[] = ['déclaré', 'vérifié', 'pièce', 'copilote', 'à confirmer']
export const ORIGIN_TONE: Record<Origin, string> = { 'déclaré': 'text-bone/70 bg-white/[0.04] ring-white/10', 'vérifié': 'text-sage bg-sage/10 ring-sage/25', 'pièce': 'text-sea bg-sea/10 ring-sea/25', 'copilote': 'text-champagne-300 bg-champagne/10 ring-champagne/25', 'à confirmer': 'text-coral bg-coral/10 ring-coral/25' }
export const FIELDS = DISCOVERY_BLOCKS.flatMap((b) => b.fields.map(([k, l]) => ({ k, l, block: b.label, blockId: b.id })))
export const LABELS: Record<string, string> = Object.fromEntries(FIELDS.map((f) => [f.k, f.l]))
type SetField = (k: string, patch: Partial<FieldVal>) => void

/* ——— Mode entretien ——— */
export function Interview({ draft, setField, onClose, start }: { draft: Record<string, FieldVal>; setField: SetField; onClose: () => void; start?: string }) {
  const [i, setI] = useState(() => Math.max(0, start ? FIELDS.findIndex((f) => f.k === start) : FIELDS.findIndex((f) => !draft[f.k]?.v?.trim())))
  const f = FIELDS[i], val = draft[f.k], ref = useRef<HTMLTextAreaElement>(null)
  const filled = FIELDS.filter((x) => draft[x.k]?.v?.trim()).length
  const go = (n: number) => setI(Math.min(FIELDS.length - 1, Math.max(0, n)))
  const nextEmpty = () => { const n = FIELDS.findIndex((x, k) => k > i && !draft[x.k]?.v?.trim()); if (n >= 0) go(n); else toast('Tous les champs suivants sont renseignés', 'info') }
  const keys = useLatest({ i, f, go, onClose, setField })
  useEffect(() => { ref.current?.focus(); ref.current?.setSelectionRange(ref.current.value.length, ref.current.value.length) }, [i])
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = keys.current
      if (e.key === 'Escape') k.onClose()
      else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') { e.preventDefault(); k.go(k.i + 1) }
      else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') { e.preventDefault(); k.go(k.i - 1) }
      else if (e.altKey && /^[1-5]$/.test(e.key)) { e.preventDefault(); k.setField(k.f.k, { origin: ORIGINS[+e.key - 1] }) }
    }
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [keys])
  return (
    <motion.div className="fixed inset-0 z-[80] flex flex-col bg-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: EXPO }}>
      <div className="h-0.5 bg-white/[0.06]"><motion.div className="h-full bg-champagne" animate={{ width: `${(filled / FIELDS.length) * 100}%` }} transition={{ duration: 0.6, ease: EXPO }} /></div>
      <div className="flex items-center justify-between px-5 py-4 md:px-10">
        <div className="text-[11px] uppercase tracking-eyebrow text-mist">Mode entretien · <span className="num">{i + 1} / {FIELDS.length}</span> · {filled} renseignés</div>
        <button onClick={onClose} aria-label="Quitter le mode entretien" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-bone/70 ring-1 ring-white/[0.08] hover:text-bone"><X size={16} /></button>
      </div>
      <div className="thin-scroll flex flex-1 items-start justify-center overflow-y-auto px-5 pb-8 pt-4 md:items-center md:px-10">
        <AnimatePresence mode="wait">
          <motion.div key={f.k} initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45, ease: EXPO }} className="w-full max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-[12px]"><span className="rounded-full bg-white/[0.05] px-3 py-1 text-bone/70 ring-1 ring-white/[0.08]">{f.block}</span>{(CRITICAL as readonly string[]).includes(f.k) && <span className="rounded-full bg-coral/10 px-3 py-1 text-coral ring-1 ring-coral/20">Champ critique</span>}</div>
            <h2 className="display mt-5 text-[2.2rem] leading-[1.02] md:text-[3.4rem]">{QUESTIONS[f.k] ?? f.l}</h2>
            <div className="mt-3 text-[13px] text-mist">{f.l}</div>
            <textarea ref={ref} value={val?.v ?? ''} rows={3} onChange={(e) => setField(f.k, { v: e.target.value, origin: val?.origin ?? 'déclaré' })}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.altKey) { e.preventDefault(); go(i + 1) } }}
              placeholder="Notez la réponse du vendeur…" className="mt-6 w-full resize-none rounded-2xl bg-white/[0.03] px-5 py-4 text-[17px] leading-relaxed text-bone outline-none ring-1 ring-white/[0.08] placeholder:text-mist focus:ring-champagne/50" />
            <div className="mt-4 flex flex-wrap gap-1.5">
              {ORIGINS.map((o, k) => <button key={o} onClick={() => setField(f.k, { v: val?.v ?? '', origin: o })} className={clsx('rounded-full px-3 py-1.5 text-[12px] ring-1 transition', (val?.origin ?? 'déclaré') === o ? ORIGIN_TONE[o] : 'text-bone/45 ring-white/[0.06] hover:text-bone/75')}><span className="num mr-1.5 text-[10px] opacity-60" title={`Alt+${k + 1}`}>{k + 1}</span>{o}</button>)}
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <button onClick={() => go(i - 1)} disabled={i === 0} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] text-bone/70 ring-1 ring-white/[0.08] transition hover:bg-white/[0.05] disabled:opacity-30"><ArrowLeft size={14} />Précédente</button>
              <div className="flex gap-2">
                <button onClick={nextEmpty} className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] text-bone/70 ring-1 ring-white/[0.08] transition hover:bg-white/[0.05]"><FastForward size={14} />Prochain vide</button>
                {i < FIELDS.length - 1
                  ? <button onClick={() => go(i + 1)} className="inline-flex items-center gap-2 rounded-full bg-champagne px-5 py-2.5 text-[13px] font-medium text-ink transition hover:bg-champagne-300">Question suivante<ArrowRight size={14} /></button>
                  : <button onClick={onClose} className="inline-flex items-center gap-2 rounded-full bg-champagne px-5 py-2.5 text-[13px] font-medium text-ink transition hover:bg-champagne-300"><Check size={14} />Terminer</button>}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="hidden items-center justify-center gap-5 border-t border-white/[0.05] py-3 text-[11px] text-mist md:flex"><Keyboard size={13} /><span><b className="num text-bone/70">Entrée</b> suivante</span><span><b className="num text-bone/70">Maj+Entrée</b> retour à la ligne</span><span><b className="num text-bone/70">Ctrl+← →</b> naviguer</span><span><b className="num text-bone/70">Alt+1…5</b> origine</span><span><b className="num text-bone/70">Échap</b> quitter</span></div>
    </motion.div>
  )
}

/* ——— Débrief vocal ——— */
type Rec = { start: () => void; stop: () => void; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null; lang: string; continuous: boolean; interimResults: boolean }
const SR = () => (window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Rec }).webkitSpeechRecognition
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const toSec = (d?: string) => { const [m, s] = (d ?? '00:00').split(':').map(Number); return (m || 0) * 60 + (s || 0) }

export function Debrief({ journey, save, draft, setField }: { journey: Journey; save: (p: Partial<Journey>) => Promise<void>; draft: Record<string, FieldVal>; setField: SetField }) {
  const deb = journey.debrief
  const [text, setText] = useState(deb?.transcript ?? '')
  const [rec, setRec] = useState<Rec | null>(null)
  const [interim, setInterim] = useState('')
  const [secs, setSecs] = useState(0)
  const secsRef = useRef(0)
  const [props, setProps] = useState<Proposal[] | null>(null)
  const [edit, setEdit] = useState('')
  const timer = useRef<number | undefined>(undefined)
  const latest = useLatest({ journey, save, text })
  const persist = (patch: Partial<NonNullable<Journey['debrief']>>) => {
    const cur = latest.current.journey.debrief
    return latest.current.save({ debrief: { transcript: latest.current.text, duration: cur?.duration ?? '00:00', validated: cur?.validated ?? false, ...patch } }).catch((x) => toast(errText(x), 'error'))
  }
  useEffect(() => { if (timer.current === undefined && !rec) setText(deb?.transcript ?? '') }, [deb?.transcript]) // eslint-disable-line react-hooks/exhaustive-deps
  const onText = (v: string) => { setText(v); clearTimeout(timer.current); timer.current = window.setTimeout(() => { timer.current = undefined; persist({ transcript: v, validated: false }) }, 900) }
  useEffect(() => { if (!rec) return; const t = window.setInterval(() => { secsRef.current += 1; setSecs(secsRef.current) }, 1000); return () => clearInterval(t) }, [rec])
  useEffect(() => () => { rec?.stop(); if (timer.current !== undefined) { clearTimeout(timer.current); persist({}) } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dictate = () => {
    if (rec) { rec.stop(); return }
    const C = SR()
    if (!C) { toast('Dictée indisponible dans ce navigateur (Chrome ou Edge requis) — saisissez ou collez le débrief', 'info'); return }
    const r = new C()
    r.lang = 'fr-FR'; r.continuous = true; r.interimResults = true
    setSecs(0); secsRef.current = 0
    r.onresult = (e) => {
      let fin = '', mid = ''
      for (let k = e.resultIndex; k < e.results.length; k++) { const x = e.results[k]; if (x.isFinal) fin += x[0].transcript; else mid += x[0].transcript }
      setInterim(mid)
      if (fin) { const v = `${latest.current.text}${latest.current.text && !/\s$/.test(latest.current.text) ? ' ' : ''}${fin.trim()}`; latest.current.text = v; setText(v) }
    }
    r.onerror = (e) => toast(e.error === 'not-allowed' ? 'Micro refusé : autorisez-le dans le navigateur' : `Dictée interrompue (${e.error})`, 'error')
    r.onend = () => { setRec(null); setInterim(''); persist({ transcript: latest.current.text, duration: mmss(toSec(latest.current.journey.debrief?.duration) + secsRef.current), validated: false }); toast('Dictée enregistrée') }
    try { r.start(); setRec(r) } catch (x) { toast(errText(x), 'error') }
  }
  const extract = () => {
    const found = extractFields(text).filter((p) => draft[p.key]?.v?.trim() !== p.value)
    if (!found.length) { toast('Aucune nouvelle valeur détectée dans le débrief', 'info'); return }
    setProps(found); setEdit(found[0].value)
  }
  const cur = props?.[0]
  const next = (accept: boolean) => {
    if (!props || !cur) return
    if (accept && edit.trim()) setField(cur.key, { v: edit.trim(), origin: 'copilote' })
    const rest = props.slice(1)
    setProps(rest.length ? rest : null); setEdit(rest[0]?.value ?? '')
    if (!rest.length) toast('Extraction terminée — champs mis à jour')
  }
  return (
    <Card kicker="Débrief vocal" title={<span className="flex items-center gap-2">Transcription{deb?.validated && <span className="inline-flex items-center gap-1 rounded-full bg-sage/10 px-2 py-0.5 text-[10.5px] text-sage ring-1 ring-sage/20"><Seal size={11} weight="fill" />validée</span>}</span>}
      action={<span className="num text-[11px] text-mist">{rec ? mmss(secs) : deb?.duration ?? '00:00'}</span>}>
      <div className="relative">
        <textarea value={text} onChange={(e) => onText(e.target.value)} rows={5} placeholder="Dictez ou collez le débrief de l’entretien : motivation, prix évoqué, travaux, craintes…" className="w-full resize-y rounded-xl bg-white/[0.03] px-4 py-3 text-[13.5px] leading-relaxed text-bone outline-none ring-1 ring-white/[0.08] placeholder:text-mist focus:ring-champagne/50" />
        {interim && <div className="pointer-events-none absolute bottom-3 left-4 right-4 truncate text-[12.5px] italic text-mist">{interim}…</div>}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={dictate} className={clsx('inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium ring-1 transition', rec ? 'bg-coral/15 text-coral ring-coral/30' : 'bg-white/[0.04] text-bone/85 ring-white/[0.08] hover:bg-white/[0.08]')}>
          {rec ? <><Stop size={14} weight="fill" />Arrêter<span className="ml-1 flex h-3.5 items-end gap-[2px]">{[0, 1, 2, 3].map((k) => <span key={k} className="w-[2px] origin-bottom animate-wave rounded-full bg-coral" style={{ height: '100%', animationDelay: `${k * 0.12}s` }} />)}</span></> : <><Microphone size={14} />Dicter</>}
        </button>
        <button onClick={extract} disabled={!text.trim()} className="inline-flex items-center gap-2 rounded-full bg-champagne px-4 py-2 text-[13px] font-medium text-ink transition hover:bg-champagne-300 disabled:opacity-50"><MagicWand size={14} />Extraire les champs</button>
        <button onClick={() => persist({ transcript: text, validated: !deb?.validated }).then(() => toast(deb?.validated ? 'Débrief remis en relecture' : 'Débrief validé'))} disabled={!text.trim()} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] text-bone/70 ring-1 ring-white/[0.08] transition hover:bg-white/[0.05] disabled:opacity-40"><Check size={14} />{deb?.validated ? 'Annuler la validation' : 'Valider le débrief'}</button>
      </div>
      <AnimatePresence>
        {cur && (
          <motion.div key={cur.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: EXPO }} className="mt-4 rounded-2xl bg-champagne/[0.06] p-4 ring-1 ring-champagne/20">
            <div className="flex items-center justify-between text-[11px]"><span className="uppercase tracking-eyebrow text-champagne-300">Proposition · {LABELS[cur.key]}</span><span className="num text-mist">{props!.length} restante(s)</span></div>
            <div className="mt-2 text-[12px] text-mist">Actuel : {draft[cur.key]?.v?.trim() || <i>vide</i>} · détecté par {cur.why}</div>
            <input value={edit} onChange={(e) => setEdit(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && next(true)} className="mt-2 w-full rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-[14px] text-bone outline-none ring-1 ring-white/[0.1] focus:ring-champagne/50" />
            <div className="mt-3 flex gap-2"><button onClick={() => next(true)} className="inline-flex items-center gap-1.5 rounded-full bg-champagne px-4 py-1.5 text-[12.5px] font-medium text-ink"><Check size={13} />Accepter</button><button onClick={() => next(false)} className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12.5px] text-bone/70 ring-1 ring-white/[0.1]"><SkipForward size={13} />Ignorer</button><button onClick={() => setProps(null)} className="ml-auto text-[12px] text-mist hover:text-bone">Tout ignorer</button></div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

/* ——— Photos du bien ——— */
const ROOMS = ['À classer', 'Extérieur', 'Séjour', 'Cuisine', 'Chambre', 'Salle de bain', 'Vue', 'Autre']
const guess = (url: string) => (/pool|villa|house|garden|street|riviera/.test(url) ? 'Extérieur' : /living|lounge|loft|glass|family|boho|chair/.test(url) ? 'Séjour' : /kitchen|dining/.test(url) ? 'Cuisine' : /bedroom/.test(url) ? 'Chambre' : /bath/.test(url) ? 'Salle de bain' : 'À classer')

export function Photos({ journey, save, dossierId }: { journey: JourneyX; save: (p: Partial<JourneyX>) => Promise<void>; dossierId: string }) {
  const photos = journey.photos ?? [], rooms = journey.photoRooms ?? {}
  const roomOf = (u: string) => rooms[u] ?? guess(u)
  const [filter, setFilter] = useState('Toutes')
  const [busy, setBusy] = useState(false)
  const [zoom, setZoom] = useState<string | null>(null)
  const latest = useLatest({ journey, save })
  const counts = useMemo(() => photos.reduce<Record<string, number>>((m, u) => { const r = rooms[u] ?? guess(u); m[r] = (m[r] ?? 0) + 1; return m }, {}), [photos, rooms])
  const shown = photos.filter((u) => filter === 'Toutes' || roomOf(u) === filter)
  const write = async (p: Partial<JourneyX>, ok?: string) => { try { await latest.current.save(p); if (ok) toast(ok) } catch (x) { toast(errText(x), 'error') } }
  const upload = async (list: FileList | null) => {
    if (!list?.length) return
    setBusy(true)
    try {
      const urls: string[] = []
      for (const f of Array.from(list)) {
        if (!f.type.startsWith('image/')) throw new Error(`${f.name} n’est pas une image`)
        if (f.size > 8e6) throw new Error(`${f.name} dépasse 8 Mo`)
        const doc = await uploadFile(f, dossierId)
        urls.push(`/api/files/${doc.id}/raw`)
      }
      const cur = latest.current.journey
      await write({ photos: [...(cur.photos ?? []), ...urls], photoRooms: { ...(cur.photoRooms ?? {}), ...Object.fromEntries(urls.map((u) => [u, filter !== 'Toutes' ? filter : 'À classer'])) } }, `${urls.length} photo(s) ajoutée(s) — originaux conservés`)
    } catch (x) { toast(errText(x), 'error') } finally { setBusy(false) }
  }
  return (
    <Card kicker="Photos du bien" title={`${photos.length} photo(s) · originaux conservés`} action={
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/[0.04] px-3.5 py-1.5 text-[12.5px] font-medium ring-1 ring-white/[0.08] transition hover:bg-white/[0.08]"><UploadSimple size={14} />{busy ? 'Dépôt…' : 'Déposer'}<input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { upload(e.currentTarget.files); e.currentTarget.value = '' }} /></label>
    }>
      <div className="thin-scroll -mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {['Toutes', ...ROOMS].filter((r) => r === 'Toutes' || counts[r]).map((r) => <button key={r} onClick={() => setFilter(r)} className={clsx('shrink-0 rounded-full px-3 py-1 text-[12px] ring-1 transition', filter === r ? 'bg-white/[0.09] text-bone ring-white/[0.14]' : 'text-bone/55 ring-white/[0.06] hover:text-bone/80')}>{r}<span className="num ml-1.5 text-[10.5px] text-mist">{r === 'Toutes' ? photos.length : counts[r]}</span></button>)}
      </div>
      {photos.length === 0 ? (
        <label className="flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-white/10 p-8 text-center transition hover:bg-white/[0.02]"><ImageIcon size={22} weight="light" className="text-champagne" /><span className="mt-2 text-[13px] text-bone/70">Déposez les photos prises pendant la visite</span><span className="mt-1 text-[11.5px] text-mist">Elles alimentent L4 (réseaux) et L8 (avant / après) — images IA toujours étiquetées</span><input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { upload(e.currentTarget.files); e.currentTarget.value = '' }} /></label>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((u) => (
            <div key={u} className="group relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-white/[0.06]">
              <button onClick={() => setZoom(u)} className="absolute inset-0" aria-label="Agrandir"><img src={u} alt={roomOf(u)} className="h-full w-full object-cover transition duration-700 ease-expo group-hover:scale-105" /></button>
              <div className="theme-dark pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-ink/85 to-transparent p-2 pt-8">
                <select value={roomOf(u)} onChange={(e) => write({ photoRooms: { ...(latest.current.journey.photoRooms ?? {}), [u]: e.target.value } }, `Classée : ${e.target.value}`)} aria-label="Pièce" className="pointer-events-auto min-w-0 flex-1 appearance-none rounded-full bg-ink/70 px-2.5 py-1 text-[11px] text-bone outline-none ring-1 ring-white/15 backdrop-blur">{ROOMS.map((r) => <option key={r}>{r}</option>)}</select>
                <button onClick={() => write({ photos: (latest.current.journey.photos ?? []).filter((x) => x !== u) }, 'Photo retirée du dossier')} aria-label="Retirer la photo" className="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-bone/80 ring-1 ring-white/15 opacity-0 transition group-hover:opacity-100 hover:text-coral max-md:opacity-100"><Trash size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {createPortal(<AnimatePresence>
        {zoom && (
          <motion.div className="fixed inset-0 z-[85] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoom(null)}>
            <motion.img src={zoom} alt="" initial={{ scale: 0.96 }} animate={{ scale: 1 }} transition={{ duration: 0.45, ease: EXPO }} className="max-h-[86vh] max-w-full rounded-2xl object-contain shadow-float" />
            <span className="theme-dark absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-ink/70 px-3 py-1 text-[12px] text-bone ring-1 ring-white/15">{roomOf(zoom)}</span>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </Card>
  )
}
