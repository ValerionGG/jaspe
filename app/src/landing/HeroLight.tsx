import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'motion/react'
import { useRef } from 'react'
import { Sparkle, CalendarCheck, UsersThree, ArrowDown } from '@phosphor-icons/react'
import { Button, MaskLines, EXPO, Avatar } from '../ui/kit'
import { img } from '../data/mock'

/** Badge circulaire au texte tournant. */
function Seal({ className }: { className?: string }) {
  const text = 'COPILOTE · ANTIBES · CÔTE D’AZUR · 2026 · '
  return (
    <div className={className}>
      <motion.svg viewBox="0 0 200 200" className="h-full w-full" animate={{ rotate: 360 }} transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}>
        <defs><path id="seal-circle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" /></defs>
        <text className="fill-coral font-sans text-[12px] font-medium"><textPath href="#seal-circle" textLength="486" lengthAdjust="spacing">{text}</textPath></text>
      </motion.svg>
      <span className="absolute inset-0 m-auto flex h-[46%] w-[46%] items-center justify-center rounded-full bg-champagne font-serif text-4xl italic text-ink shadow-float">N</span>
    </div>
  )
}

/** Tracé d’architecte qui se dessine : arche, plan, cotes. */
function Blueprint() {
  const draw = { initial: { pathLength: 0 }, animate: { pathLength: 1 } }
  return (
    <svg viewBox="0 0 1440 900" className="pointer-events-none absolute inset-0 h-full w-full text-champagne/[0.18]" fill="none" stroke="currentColor" strokeWidth="1">
      <motion.path {...draw} transition={{ duration: 3, ease: EXPO, delay: 0.3 }} d="M820 900 V420 A250 250 0 0 1 1320 420 V900" />
      <motion.path {...draw} transition={{ duration: 3, ease: EXPO, delay: 0.5 }} d="M860 900 V430 A210 210 0 0 1 1280 430 V900" strokeDasharray="4 6" />
      <motion.path {...draw} transition={{ duration: 2.4, ease: EXPO, delay: 0.9 }} d="M0 780 H1440" />
      <motion.path {...draw} transition={{ duration: 2.4, ease: EXPO, delay: 1.1 }} d="M760 160 V860 M1380 160 V860" strokeDasharray="2 8" />
      <motion.circle {...draw} transition={{ duration: 2.6, ease: EXPO, delay: 1.2 }} cx="1070" cy="420" r="320" strokeDasharray="1 7" />
    </svg>
  )
}

export function HeroLight({ ready }: { ready: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const archY = useTransform(scrollYProgress, [0, 1], [0, -120])
  const photoScale = useTransform(scrollYProgress, [0, 1], [1.08, 1.28])
  const smallY = useTransform(scrollYProgress, [0, 1], [0, -260])
  const textY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const mx = useSpring(useMotionValue(0), { stiffness: 50, damping: 18 })
  const my = useSpring(useMotionValue(0), { stiffness: 50, damping: 18 })
  const go = ready

  return (
    <section id="top" ref={ref} onPointerMove={(e) => { mx.set((e.clientX / innerWidth - 0.5) * 18); my.set((e.clientY / innerHeight - 0.5) * 12) }} className="relative min-h-[100dvh] overflow-hidden bg-ink pb-16 pt-28 md:pt-32">
      <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_75%_30%,rgb(var(--acc-500)_/_0.07),transparent_70%),radial-gradient(700px_400px_at_10%_90%,rgb(var(--coral)_/_0.07),transparent_70%)]" />
      {go && <Blueprint />}
      <div className="relative mx-auto grid max-w-[1440px] gap-12 px-5 md:px-10 lg:grid-cols-12 lg:gap-6">
        <motion.div style={{ y: textY }} className="flex flex-col justify-center lg:col-span-6 lg:pt-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={go ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3, duration: 1, ease: EXPO }} className="mb-7 flex flex-wrap items-center gap-3">
            <span className="eyebrow bg-champagne/[0.08] text-champagne-300 ring-1 ring-champagne/20"><Sparkle size={11} weight="fill" /> Copilote proactif</span>
            <span className="text-[12px] text-mist">pour agences & réseaux immobiliers</span>
          </motion.div>
          {go && (
            <MaskLines trigger="mount" delay={0.35} className="display text-[16vw] leading-[0.88] sm:text-[11vw] lg:text-[7.4vw]"
              lines={[<>L’immobilier</>, <>d’exception,</>, <span className="italic text-champagne-300">orchestré<span className="text-coral">.</span></span>]} />
          )}
          <motion.p initial={{ opacity: 0, y: 20 }} animate={go ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.95, duration: 1.1, ease: EXPO }} className="mt-8 max-w-[34rem] text-[16px] leading-relaxed text-bone/70">
            NXT prépare chaque rendez-vous, structure la découverte vendeur, rédige les neuf livrables et fait tourner votre agence — pour que vos conseillers ne fassent plus que l’essentiel : <span className="font-serif text-[19px] italic text-bone">la relation.</span>
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={go ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.1, duration: 1.1, ease: EXPO }} className="mt-9 flex flex-wrap items-center gap-3">
            <Button size="lg" href="#demo">Réserver une démonstration</Button>
            <Button size="lg" variant="ghost" href="/app">Explorer le CRM</Button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={go ? { opacity: 1 } : {}} transition={{ delay: 1.4, duration: 1 }} className="mt-14 grid max-w-[34rem] grid-cols-3 gap-6 border-t border-white/10 pt-6">
            {[['14', 'livrables par RDV'], ['60+', 'routines métier'], ['−6 h', 'de saisie / semaine*']].map(([k, v]) => (
              <div key={v}><div className="display text-4xl">{k}</div><div className="mt-1 text-[12px] text-mist">{v}</div></div>
            ))}
          </motion.div>
        </motion.div>

        {/* Composition d’arches */}
        <div className="relative h-[560px] sm:h-[640px] lg:col-span-6 lg:h-[760px]">
          <motion.div style={{ y: archY, x: mx }} initial={{ clipPath: 'inset(100% 0 0 0 round 999px 999px 0 0)' }} animate={go ? { clipPath: 'inset(0% 0 0 0 round 999px 999px 0 0)' } : {}} transition={{ duration: 1.6, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
            className="absolute right-0 top-0 h-[88%] w-[78%] overflow-hidden rounded-t-full shadow-float ring-[10px] ring-ink-800">
            <motion.img src={img('cap-villa-rocks')} alt="Villa sur les rochers du Cap d’Antibes" style={{ scale: photoScale }} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
            <span className="theme-dark absolute right-[18%] top-[30%] whitespace-nowrap rounded-full bg-ink/50 px-4 py-1.5 text-[11px] uppercase tracking-eyebrow text-bone backdrop-blur-md">Cap d’Antibes · 4,95 M€</span>
          </motion.div>
          <motion.div style={{ y: smallY, x: my }} initial={{ opacity: 0, y: 60 }} animate={go ? { opacity: 1, y: 0 } : {}} transition={{ duration: 1.4, delay: 0.7, ease: EXPO }}
            className="absolute bottom-[4%] left-0 h-[44%] w-[38%] overflow-hidden rounded-t-full shadow-float ring-[8px] ring-ink-800">
            <img src={img('window-sea')} alt="" className="h-full w-full object-cover" />
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.6, rotate: -40 }} animate={go ? { opacity: 1, scale: 1, rotate: 0 } : {}} transition={{ duration: 1.4, delay: 1, ease: EXPO }} className="absolute left-[24%] top-[6%] hidden sm:block">
            <Seal className="relative h-36 w-36" />
          </motion.div>
          {/* Cartes du copilote */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={go ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1.5, duration: 1.1, ease: EXPO }} className="absolute left-[8%] top-[46%] z-10 hidden md:block">
            <div className="glass flex w-[280px] animate-float items-start gap-3 rounded-2xl p-3.5 shadow-float ring-1 ring-white/10">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-champagne text-ink"><CalendarCheck size={17} weight="light" /></span>
              <span><span className="block text-[13px] font-medium">Brief prêt · 07:42</span><span className="block text-[11.5px] text-mist">RDV Famille Costa · D1 D2 D3 complets</span></span>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} animate={go ? { opacity: 1, x: 0 } : {}} transition={{ delay: 1.75, duration: 1.1, ease: EXPO }} className="absolute bottom-[14%] right-[4%] z-10">
            <div className="glass flex w-[270px] animate-float items-center gap-3 rounded-2xl p-3.5 shadow-float ring-1 ring-white/10" style={{ animationDelay: '1.2s' }}>
              <div className="flex -space-x-2">{['p-paul', 'p-julien', 'p-thomas'].map((p) => <Avatar key={p} src={img(p)} size={28} />)}</div>
              <span><span className="flex items-center gap-1.5 text-[13px] font-medium"><UsersThree size={14} /> 3 acquéreurs à 94 %</span><span className="block text-[11.5px] text-mist">Villa Mimosas · financement validé</span></span>
            </div>
          </motion.div>
        </div>
      </div>
      <motion.a href="#parcours" initial={{ opacity: 0 }} animate={go ? { opacity: 1 } : {}} transition={{ delay: 1.8 }} className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[12px] text-mist lg:flex">
        <motion.span animate={{ y: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity }}><ArrowDown size={14} /></motion.span> Découvrir le parcours
      </motion.a>
    </section>
  )
}
