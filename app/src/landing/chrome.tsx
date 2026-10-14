import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Button, EXPO } from '../ui/kit'
import { ThemeToggle } from '../ui/theme'

export function Logo({ className, mark = true }: { className?: string; mark?: boolean }) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      {mark && (
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-bone text-ink">
          <span className="font-serif text-[19px] italic leading-none">J</span>
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-champagne ring-2 ring-ink" />
        </span>
      )}
      <span className="font-serif text-[21px] leading-none tracking-[-0.01em]">Jas<span className="italic text-champagne-300">pe</span></span>
    </span>
  )
}

export function Preloader({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0)
  const [out, setOut] = useState(false)
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1500)
      setN(Math.round((1 - Math.pow(1 - p, 3)) * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setTimeout(() => setOut(true), 180)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <AnimatePresence onExitComplete={onDone}>
      {!out && (
        <motion.div className="fixed inset-0 z-[90] flex flex-col justify-between bg-ink p-6 md:p-10" exit={{ y: '-100%' }} transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-eyebrow text-mist">
            <span>Côte d’Azur · 2026</span><span>Plateforme immobilière proactive</span>
          </div>
          <div className="overflow-hidden">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 1.2, ease: EXPO }} className="display pb-[0.12em] text-[22vw] leading-[0.9] text-bone md:text-[16vw]">
              Jas<span className="italic text-champagne">pe</span>
            </motion.div>
          </div>
          <div className="flex items-end justify-between">
            <div className="h-px w-1/2 bg-white/10"><motion.div className="h-px bg-champagne" style={{ width: `${n}%` }} /></div>
            <span className="num text-5xl text-bone md:text-7xl">{String(n).padStart(3, '0')}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Cursor() {
  const x = useSpring(useMotionValue(-100), { stiffness: 500, damping: 40, mass: 0.3 })
  const y = useSpring(useMotionValue(-100), { stiffness: 500, damping: 40, mass: 0.3 })
  const [label, setLabel] = useState<string | null>(null)
  const [fine, setFine] = useState(false)
  useEffect(() => {
    setFine(matchMedia('(pointer: fine)').matches)
    const move = (e: PointerEvent) => {
      x.set(e.clientX); y.set(e.clientY)
      const el = (e.target as HTMLElement).closest('[data-cursor]') as HTMLElement | null
      setLabel(el ? el.dataset.cursor || '' : null)
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [x, y])
  if (!fine) return null
  return (
    <motion.div className="pointer-events-none fixed left-0 top-0 z-[80] hidden md:block" style={{ x, y }}>
      <motion.div
        className="flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-bone text-[11px] font-medium uppercase tracking-[0.14em] text-ink mix-blend-difference"
        animate={{ width: label !== null ? 92 : 10, height: label !== null ? 92 : 10, mixBlendMode: label ? 'normal' : 'difference' }}
        transition={{ duration: 0.5, ease: EXPO }}
      >
        <AnimatePresence>{label && <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>{label}</motion.span>}</AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

const LINKS = [['Parcours', '#parcours'], ['Produit', '#produit'], ['Automatisations', '#automatisations'], ['Réseaux', '#reseaux'], ['Tarifs', '#tarifs']]

export function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <>
      <motion.header initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, delay: 0.2, ease: EXPO }} className="fixed inset-x-0 top-0 z-[70] flex justify-center px-4 pt-4 md:pt-6">
        <nav className={clsx('flex w-full max-w-[1100px] items-center justify-between rounded-full py-2 pl-5 pr-2 ring-1 transition-all duration-700 ease-silk', scrolled ? 'glass ring-white/10 shadow-float' : 'bg-transparent ring-transparent')}>
          <a href="#top" aria-label="Jaspe — accueil"><Logo /></a>
          <div className="hidden items-center gap-1 lg:flex">
            {LINKS.map(([l, h]) => (
              <a key={h} href={h} className="rounded-full px-4 py-2 text-[13px] text-bone/70 transition-colors duration-300 hover:bg-white/[0.06] hover:text-bone">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/app" className="hidden rounded-full px-4 py-2 text-[13px] text-bone/80 transition hover:text-bone sm:block">Se connecter</Link>
            <span className="hidden sm:block"><Button size="sm" href="#demo">Démonstration</Button></span>
            <button aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} onClick={() => setOpen(!open)} className="relative h-10 w-10 rounded-full bg-white/[0.06] ring-1 ring-white/10 lg:hidden">
              <span className={clsx('absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 bg-bone transition-all duration-500 ease-silk', open ? 'rotate-45' : '-translate-y-[3px]')} />
              <span className={clsx('absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 bg-bone transition-all duration-500 ease-silk', open ? '-rotate-45' : 'translate-y-[3px]')} />
            </button>
          </div>
        </nav>
      </motion.header>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="fixed inset-0 z-[65] flex flex-col justify-end bg-ink/90 p-6 pb-12 backdrop-blur-3xl lg:hidden">
            {[...LINKS, ['Espace client', '/app']].map(([l, h], i) => (
              <div key={h} className="overflow-hidden">
                <motion.a href={h} onClick={() => setOpen(false)} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.08 + i * 0.06, duration: 0.9, ease: EXPO }} className="display block py-1 text-6xl text-bone">
                  {l}
                </motion.a>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
