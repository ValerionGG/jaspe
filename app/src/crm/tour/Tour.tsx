/** Visite guidée interactive — montée une fois dans le shell du CRM. */
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { ArrowLeft, ArrowRight, Check, X, Compass } from '@phosphor-icons/react'
import { EXPO } from '../../ui/kit'
import { useCollection } from '../../data/store'
import { TOURS, type TutDoc } from './tours'

/** Collection `tutorials` + écriture idempotente (création ou mise à jour selon l’existence). */
export function useTutorials() {
  const [docs, ops] = useCollection<TutDoc>('tutorials')
  const upsert = useCallback((id: string, patch: Partial<TutDoc>) => (docs.some((d) => d.id === id) ? ops.update(id, patch) : ops.create({ id, ...patch }).then(() => undefined)), [docs, ops])
  return { docs, ops, upsert, get: (id: string) => docs.find((d) => d.id === id) }
}

type Box = { x: number; y: number; w: number; h: number }
const PAD = 8
const AUTO_KEY = 'nxt-tour-auto'
const markAuto = () => { try { localStorage.setItem(AUTO_KEY, '1') } catch { /* indisponible */ } }

function measure(target?: string): Box | null {
  if (!target) return null
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return null // masquée (mobile, mode simple, barre réduite)
  return { x: Math.round(r.left - PAD), y: Math.round(r.top - PAD), w: Math.round(r.width + PAD * 2), h: Math.round(r.height + PAD * 2) }
}

export function TourHost() {
  const nav = useNavigate()
  const loc = useLocation()
  const { upsert } = useTutorials()
  const [run, setRun] = useState<{ id: string; i: number } | null>(null)
  const [box, setBox] = useState<Box | null>(null)
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [bh, setBh] = useState(220)
  const bubble = useRef<HTMLDivElement>(null)
  const nextBtn = useRef<HTMLButtonElement>(null)
  const tour = run ? TOURS.find((t) => t.id === run.id) : undefined
  const step = tour && run ? tour.steps[run.i] : undefined
  const last = !!tour && !!run && run.i === tour.steps.length - 1

  // Démarrage par évènement global : window.dispatchEvent(new CustomEvent('nxt:tour', { detail: 'id' }))
  useEffect(() => {
    const f = (e: Event) => { const id = (e as CustomEvent<string>).detail; if (TOURS.some((t) => t.id === id)) { markAuto(); setRun({ id, i: 0 }) } }
    window.addEventListener('nxt:tour', f)
    return () => window.removeEventListener('nxt:tour', f)
  }, [])

  // Premier passage : la prise en main démarre seule, une seule fois (mémorisé localement et en base).
  useEffect(() => {
    // ponytail: pas de démarrage auto sous navigateur piloté (captures d’autres écrans), la visite reste lançable à la main.
    if (navigator.webdriver) return
    try { if (localStorage.getItem(AUTO_KEY)) return } catch { return }
    let off = false, timer = 0
    fetch('/api/tutorials').then((r) => (r.ok ? r.json() : [])).catch(() => []).then((docs: TutDoc[]) => {
      if (off) return
      if (docs.some((d) => d.id === 'tour:onboarding')) return markAuto()
      timer = window.setTimeout(() => { markAuto(); setRun({ id: 'onboarding', i: 0 }) }, 1400)
    })
    return () => { off = true; clearTimeout(timer) }
  }, [])

  // Touche « ? » : ouvrir l’aide (hors champ de saisie).
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key !== '?' || run || t.closest('input, textarea, select, [contenteditable="true"]')) return
      nav('/app/aide')
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [nav, run])

  // Navigation entre pages quand l’étape l’exige.
  useEffect(() => { if (step?.route && loc.pathname !== step.route) nav(step.route) }, [run]) // eslint-disable-line react-hooks/exhaustive-deps

  // Suivi continu de la cible (animations de page, défilement, redimensionnement).
  useEffect(() => {
    if (!step) return
    let raf = 0, scrolled = false
    const loop = () => {
      const b = measure(step.target)
      if (b && !scrolled) {
        scrolled = true
        // « nearest » fait aussi défiler les conteneurs internes (navigation latérale) quand la cible y est rognée.
        document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
      setBox((p) => (p === b || (p && b && p.x === b.x && p.y === b.y && p.w === b.w && p.h === b.h) ? p : b))
      setVp((p) => (p.w === window.innerWidth && p.h === window.innerHeight ? p : { w: window.innerWidth, h: window.innerHeight }))
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [step])

  useLayoutEffect(() => {
    if (!bubble.current) return
    const ro = new ResizeObserver(() => bubble.current && setBh(bubble.current.offsetHeight))
    ro.observe(bubble.current)
    return () => ro.disconnect()
  }, [run !== null]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { nextBtn.current?.focus({ preventScroll: true }) }, [run])

  const close = useCallback((done: boolean) => {
    if (!run) return
    upsert(`tour:${run.id}`, { kind: 'tour', ...(done ? { done: true } : { skipped: true }), step: run.i, at: new Date().toISOString() }).catch(() => {})
    setRun(null); setBox(null)
  }, [run, upsert])
  const go = useCallback((d: 1 | -1) => {
    if (!run || !tour) return
    if (d === 1 && run.i === tour.steps.length - 1) return close(true)
    setRun({ ...run, i: Math.max(0, Math.min(tour.steps.length - 1, run.i + d)) })
  }, [run, tour, close])

  useEffect(() => {
    if (!run) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(false) }
      else if (e.key === 'ArrowRight' || (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON')) { e.preventDefault(); go(1) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1) }
    }
    window.addEventListener('keydown', k, true)
    return () => window.removeEventListener('keydown', k, true)
  }, [run, go, close])

  // Placement de la bulle : à côté de la cible si la place le permet, sinon dessous/dessus, sinon centrée. Feuille basse sur mobile.
  const mobile = vp.w < 640
  const W = Math.min(372, vp.w - 24)
  let pos: { left: number; top: number }
  if (mobile) pos = { left: 12, top: vp.h - bh - 12 }
  else if (!box) pos = { left: (vp.w - W) / 2, top: (vp.h - bh) / 2 }
  else {
    const clampY = (y: number) => Math.max(16, Math.min(vp.h - bh - 16, y))
    const clampX = (x: number) => Math.max(16, Math.min(vp.w - W - 16, x))
    if (box.x + box.w + 18 + W < vp.w) pos = { left: box.x + box.w + 18, top: clampY(box.y + box.h / 2 - 48) }
    else if (box.x - 18 - W > 0) pos = { left: box.x - 18 - W, top: clampY(box.y + box.h / 2 - 48) }
    else if (box.y + box.h + 18 + bh < vp.h) pos = { left: clampX(box.x + box.w / 2 - W / 2), top: box.y + box.h + 18 }
    else pos = { left: clampX(box.x + box.w / 2 - W / 2), top: clampY(box.y - 18 - bh) }
  }

  return (
    <AnimatePresence>
      {run && tour && step && (
        <motion.div key="tour" className="fixed inset-0 z-[90]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: EXPO }}>
          {/* Voile + découpe : forcé en jetons sombres pour rester un voile dans les deux thèmes. */}
          <svg className="theme-dark absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <mask id="nxt-tour-mask">
                <rect width="100%" height="100%" fill="white" />
                {box && <motion.rect initial={false} animate={{ x: box.x, y: box.y, width: box.w, height: box.h }} transition={{ duration: 0.55, ease: EXPO }} rx={14} fill="black" />}
              </mask>
            </defs>
            <rect width="100%" height="100%" mask="url(#nxt-tour-mask)" className={clsx('transition-[fill-opacity] duration-500', box ? 'fill-ink/[0.72]' : 'fill-ink/[0.55]')} />
          </svg>
          {box && (
            <motion.div initial={false} animate={{ left: box.x, top: box.y, width: box.w, height: box.h }} transition={{ duration: 0.55, ease: EXPO }}
              className="pointer-events-none absolute rounded-[14px] ring-[1.5px] ring-champagne shadow-glow">
              <span className="absolute -inset-1 animate-pulse rounded-[18px] ring-1 ring-champagne/30" />
            </motion.div>
          )}

          <motion.div ref={bubble} role="dialog" aria-modal="true" aria-labelledby="nxt-tour-title" initial={{ opacity: 0, y: 12, ...pos }} animate={{ opacity: 1, y: 0, ...pos }} transition={{ duration: 0.55, ease: EXPO }}
            style={{ width: mobile ? vp.w - 24 : W }} className="absolute rounded-[1.5rem] bg-white/[0.05] p-1 shadow-float ring-1 ring-white/10">
            <div className="relative overflow-hidden rounded-[calc(1.5rem-0.25rem)] bg-ink-800 p-5">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-champagne/10 blur-3xl" />
              <div className="relative flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-eyebrow text-champagne-300"><Compass size={13} weight="light" />{tour.title}</span>
                <button onClick={() => close(false)} aria-label="Quitter la visite" className="flex h-7 w-7 items-center justify-center rounded-full text-mist ring-1 ring-white/[0.08] transition hover:text-bone"><X size={13} /></button>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={run.i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3, ease: EXPO }} className="relative">
                  <h2 id="nxt-tour-title" className="display mt-3 text-[1.85rem] leading-[1]">{step.title}</h2>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-bone/70">{step.body}</p>
                  {step.hint && <p className="mt-3 rounded-xl bg-champagne/[0.08] px-3 py-2 text-[12px] text-champagne-300 ring-1 ring-champagne/20">{step.hint}</p>}
                </motion.div>
              </AnimatePresence>
              <div className="relative mt-4 flex gap-1" aria-hidden>
                {tour.steps.map((_, k) => (
                  <button key={k} tabIndex={-1} onClick={() => setRun({ ...run, i: k })} className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                    <motion.span className="block h-full rounded-full bg-champagne" initial={false} animate={{ width: k <= run.i ? '100%' : '0%' }} transition={{ duration: 0.5, ease: EXPO }} />
                  </button>
                ))}
              </div>
              <div className="relative mt-4 flex items-center gap-2">
                <span className="num text-[11px] text-mist">{run.i + 1} / {tour.steps.length}</span>
                <button onClick={() => close(false)} className="ml-auto rounded-full px-3 py-1.5 text-[12.5px] text-mist transition hover:text-bone">Passer</button>
                <button onClick={() => go(-1)} disabled={run.i === 0} aria-label="Étape précédente" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] text-bone/80 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] disabled:opacity-35"><ArrowLeft size={14} /></button>
                <button ref={nextBtn} onClick={() => go(1)} className="inline-flex items-center gap-1.5 rounded-full bg-champagne py-1.5 pl-4 pr-3 text-[13px] font-medium text-ink transition hover:bg-champagne-300">
                  {last ? <>Terminer<Check size={14} /></> : <>Suivant<ArrowRight size={14} /></>}
                </button>
              </div>
            </div>
          </motion.div>
          <span className="sr-only" aria-live="polite">{`Étape ${run.i + 1} sur ${tour.steps.length} : ${step.title}`}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
