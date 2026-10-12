import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue, useSpring } from 'motion/react'
import { useRef } from 'react'
import { Sparkle, CalendarCheck, UsersThree, FileText } from '@phosphor-icons/react'
import { Button, MaskLines, EXPO, Avatar } from '../ui/kit'
import { img } from '../data/mock'

const CARDS = [
  { icon: CalendarCheck, t: 'Brief prêt · 07:42', s: 'RDV Famille Costa · D1 D2 D3 complets', top: '22%', right: '6%', d: 1.9, depth: -60 },
  { icon: UsersThree, t: '3 acquéreurs à 94 %', s: 'Villa Mimosas · financement validé', top: '44%', right: '14%', d: 2.1, depth: -120 },
  { icon: FileText, t: 'L7 · estimation à valider', s: 'Fourchette 4,60 – 5,15 M€ · 5 comparables DVF', top: '63%', right: '4%', d: 2.3, depth: -40 },
]

export function Hero({ ready }: { ready: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const inset = useTransform(scrollYProgress, [0, 0.6], [0, 5])
  const radius = useTransform(scrollYProgress, [0, 0.6], [0, 36])
  const clip = useMotionTemplate`inset(${inset}% ${inset}% ${inset}% ${inset}% round ${radius}px)`
  const scale = useTransform(scrollYProgress, [0, 1], [1.12, 1])
  const textY = useTransform(scrollYProgress, [0, 0.7], [0, -160])
  const textO = useTransform(scrollYProgress, [0, 0.55], [1, 0])
  const cardsY = useTransform(scrollYProgress, [0, 1], [0, -260])
  const go = ready
  // Parallaxe souris discrète sur la photo
  const mx = useSpring(useMotionValue(0), { stiffness: 60, damping: 20 })
  const my = useSpring(useMotionValue(0), { stiffness: 60, damping: 20 })

  return (
    <section id="top" ref={ref} className="relative h-[175vh] bg-ink" onPointerMove={(e) => { mx.set((e.clientX / innerWidth - 0.5) * -24); my.set((e.clientY / innerHeight - 0.5) * -16) }}>
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
          <motion.img
            src={img('house-dusk')} alt="Maison d’architecte illuminée au crépuscule"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ scale, x: mx, y: my }}
            initial={{ opacity: 0, filter: 'blur(20px)' }} animate={go ? { opacity: 1, filter: 'blur(0px)' } : {}} transition={{ duration: 2, ease: EXPO }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/20 to-transparent" />
        </motion.div>

        {/* Repères éditoriaux */}
        <motion.div initial={{ opacity: 0 }} animate={go ? { opacity: 1 } : {}} transition={{ delay: 1.4, duration: 1 }} className="pointer-events-none absolute inset-x-0 top-28 hidden justify-between px-10 text-[10px] uppercase tracking-eyebrow text-bone/50 md:flex">
          <span>N° 01 — Cap d’Antibes</span><span className="num">43°33′N · 7°07′E</span>
        </motion.div>

        <motion.div style={{ y: textY, opacity: textO }} className="relative z-10 flex h-full flex-col justify-end px-5 pb-10 md:px-10 md:pb-14">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={go ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5, duration: 1, ease: EXPO }} className="mb-6 flex items-center gap-3">
            <span className="eyebrow bg-white/[0.06] text-champagne-300 ring-1 ring-white/15 backdrop-blur-md"><Sparkle size={11} weight="fill" /> Copilote proactif<span className="hidden sm:inline">&nbsp;pour agences & réseaux</span></span>
          </motion.div>
          {go && (
            <MaskLines
              trigger="mount" delay={0.55}
              className="display max-w-[14ch] text-[15vw] text-bone sm:text-[11vw] lg:text-[8.6vw]"
              lines={[<>L’immobilier</>, <>d’exception,</>, <span className="italic text-champagne-300">orchestré.</span>]}
            />
          )}
          <div className="mt-8 flex flex-col gap-8 md:mt-10 md:flex-row md:items-end md:justify-between">
            <motion.p initial={{ opacity: 0, y: 20 }} animate={go ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.15, duration: 1.1, ease: EXPO }} className="max-w-md text-[15px] leading-relaxed text-bone/70 md:text-base">
              NXT prépare chaque rendez-vous, structure la découverte vendeur, rédige les neuf livrables et fait tourner votre agence — pour que vos conseillers ne fassent plus que l’essentiel : la relation.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={go ? { opacity: 1, y: 0 } : {}} transition={{ delay: 1.3, duration: 1.1, ease: EXPO }} className="flex flex-wrap items-center gap-3">
              <Button size="lg" href="#demo">Réserver une démonstration</Button>
              <Button size="lg" variant="ghost" href="/app">Explorer le CRM</Button>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={go ? { opacity: 1 } : {}} transition={{ delay: 1.6, duration: 1 }} className="mt-10 flex items-center justify-between border-t border-white/10 pt-5 text-[12px] text-bone/55">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">{['p-claire', 'p-marc', 'p-sofia', 'p-julien'].map((p) => <Avatar key={p} src={img(p)} size={26} className="ring-ink" />)}</div>
              <span>Conçu avec des conseillers de la Riviera</span>
            </div>
            <span className="hidden items-center gap-2 md:flex"><span className="relative h-8 w-[18px] rounded-full ring-1 ring-white/30"><motion.span className="absolute left-1/2 top-1.5 h-1.5 w-[3px] -translate-x-1/2 rounded-full bg-bone" animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }} /></span> Faites défiler</span>
          </motion.div>
        </motion.div>

        {/* Notifications du copilote */}
        <motion.div style={{ y: cardsY }} className="pointer-events-none absolute inset-0 z-20 hidden lg:block">
          {CARDS.map((c) => (
            <motion.div key={c.t} initial={{ opacity: 0, x: 40, filter: 'blur(8px)' }} animate={go ? { opacity: 1, x: 0, filter: 'blur(0px)' } : {}} transition={{ delay: c.d, duration: 1.2, ease: EXPO }} style={{ top: c.top, right: c.right }} className="absolute">
              <div className="glass flex w-[300px] animate-float items-start gap-3 rounded-2xl p-3.5 pr-5 shadow-float ring-1 ring-white/10" style={{ animationDelay: `${c.d}s` }}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-champagne/15 text-champagne-300"><c.icon size={18} weight="light" /></span>
                <span>
                  <span className="block text-[13px] font-medium text-bone">{c.t}</span>
                  <span className="block text-[11.5px] leading-snug text-bone/55">{c.s}</span>
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
