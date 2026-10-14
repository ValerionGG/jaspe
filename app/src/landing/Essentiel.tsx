import { motion, AnimatePresence, useInView } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Play, Waveform, WhatsappLogo, Sparkle } from '@phosphor-icons/react'
import { Button, Eyebrow, EXPO } from '../ui/kit'
import { ThemeToggle } from '../ui/theme'
import { img } from '../data/mock'
import { Logo } from './chrome'
import { Benefits, Steps, DayCompare, Deliverables, Reminders, Inbox, Compliance, Scenarios, Faq, card } from './essentiel-sections'
import { Pricing, Roi, Trial } from './essentiel-offer'

/** Jaspe Essentiel : page de vente courte pour conseillers et petites agences (la grande landing reste la vitrine). */
export default function Essentiel() {
  const trialRef = useRef<HTMLDivElement>(null)
  const trialInView = useInView(trialRef, { margin: '0px 0px -30% 0px' })
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    document.title = 'Jaspe Essentiel — vos rendez-vous vendeurs préparés, vos documents rédigés'
    const html = document.documentElement
    html.style.scrollBehavior = 'smooth'
    const on = () => setScrolled(window.scrollY > 40)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => { html.style.scrollBehavior = ''; window.removeEventListener('scroll', on) }
  }, [])
  return (
    <div className="min-h-screen bg-ink pb-20 md:pb-0">
      <Nav scrolled={scrolled} />
      <main>
        <Hero />
        <Benefits />
        <Steps />
        <DayCompare />
        <Deliverables />
        <Reminders />
        <Inbox />
        <Compliance />
        <Pricing />
        <Roi />
        <Scenarios />
        <Faq />
        <div ref={trialRef}><Trial /></div>
      </main>
      <Footer />
      <StickyCta show={scrolled && !trialInView} />
    </div>
  )
}

function Nav({ scrolled }: { scrolled: boolean }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 md:pt-5">
      <nav className={clsx('flex w-full max-w-[1200px] items-center justify-between gap-2 rounded-full py-1.5 pl-4 pr-1.5 ring-1 transition-all duration-500 ease-silk', scrolled ? 'glass shadow-float ring-white/10' : 'ring-transparent')}>
        <a href="#top" aria-label="Jaspe Essentiel — haut de page" className="flex items-center gap-2">
          <Logo />
          <span className="hidden rounded-full bg-champagne/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-champagne-300 ring-1 ring-champagne/20 sm:inline">Essentiel</span>
        </a>
        <div className="flex items-center gap-1">
          <a href="#tarif" className="hidden rounded-full px-3.5 py-2 text-[13px] text-bone/70 transition hover:bg-white/[0.06] hover:text-bone sm:block">Tarif</a>
          <a href="#faq" className="hidden rounded-full px-3.5 py-2 text-[13px] text-bone/70 transition hover:bg-white/[0.06] hover:text-bone sm:block">FAQ</a>
          <Link to="/app" className="rounded-full px-3 py-2 text-[13px] text-bone/70 transition hover:bg-white/[0.06] hover:text-bone">Connexion</Link>
          <ThemeToggle />
          <span className="ml-1 hidden md:block"><Button size="sm" href="#essai">Essai gratuit</Button></span>
        </div>
      </nav>
    </header>
  )
}

const fade = (d: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay: d, ease: EXPO } })

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-5 pb-20 pt-28 md:px-10 md:pb-28 md:pt-40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(760px_420px_at_85%_8%,rgb(var(--acc-500)_/_0.09),transparent_70%),radial-gradient(600px_360px_at_0%_100%,rgb(var(--sea)_/_0.07),transparent_70%)]" />
      <div className="relative mx-auto grid grid-cols-1 max-w-[1200px] items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div>
          <motion.div {...fade(0)} className="flex flex-wrap items-center gap-3">
            <Eyebrow>Jaspe Essentiel</Eyebrow>
            <span className="text-[12.5px] text-mist">pour conseillers & petites agences</span>
          </motion.div>
          <motion.h1 {...fade(0.06)} className="display mt-6 text-[2.55rem] leading-[1] sm:text-[3.4rem] lg:text-[4.1rem]">
            Votre rendez-vous vendeur préparé, vos 9 documents rédigés, <span className="italic text-champagne-300">vos relances faites.</span>
          </motion.h1>
          <motion.p {...fade(0.14)} className="mt-6 max-w-[34rem] text-[16px] leading-relaxed text-bone/70">
            Jaspe prépare votre brief la veille, rédige les neuf livrables après un débrief vocal de deux minutes et rappelle vos clients sur WhatsApp. Vous relisez, vous validez&nbsp;: rien ne part sans vous.
          </motion.p>
          <motion.div {...fade(0.2)} className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" href="#essai">Essai gratuit 14 jours</Button>
            <Button size="lg" variant="ghost" href="/essentiel/app" icon={<Play size={16} weight="light" />}>Voir la démo</Button>
          </motion.div>
          <motion.p {...fade(0.24)} className="mt-4 text-[12.5px] text-mist">Sans carte bancaire · sans engagement · 49&nbsp;€ HT / siège / mois ensuite</motion.p>
          <motion.div {...fade(0.3)} className="mt-10 border-t border-white/[0.08] pt-6">
            <div className="grid grid-cols-3 gap-4">
              {[['−5 h', 'de saisie par semaine'], ['10 min', 'pour relire les 9 livrables'], ['−30 %', 'de rendez-vous manqués']].map(([k, v]) => (
                <div key={v}><div className="display text-[2.1rem] sm:text-4xl">{k}</div><div className="mt-1 text-[12px] leading-snug text-mist">{v}</div></div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-mist/80">Objectifs du pilote Côte d’Azur 2026, à mesurer pendant votre essai.</p>
          </motion.div>
        </div>
        <ProductShot />
      </div>
    </section>
  )
}

const LIV: [string, string, 'validé' | 'à relire' | 'rédaction'][] = [
  ['L1', 'Remerciement', 'validé'], ['L2', 'Synthèse équipe', 'validé'], ['L3', 'Avant-première', 'à relire'],
  ['L4', 'Kit social', 'à relire'], ['L5', 'Courrier voisinage', 'à relire'], ['L6', 'Book services', 'à relire'],
  ['L7', 'Estimation', 'rédaction'], ['L8', 'Avant / après', 'rédaction'], ['L9', 'Copro & diagnostics', 'rédaction'],
]
const TONE = { validé: 'text-sage', 'à relire': 'text-sea', rédaction: 'text-champagne-300' }

/** Capture stylisée du produit : un dossier juste après le rendez-vous. */
function ProductShot() {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.25, ease: EXPO }} className="relative pb-10 lg:pb-0">
      <div className="shell shadow-float">
        <div className="core overflow-hidden">
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
            <span className="flex gap-1.5">{[0, 1, 2].map((i) => <span key={i} className="h-2.5 w-2.5 rounded-full bg-white/10" />)}</span>
            <span className="truncate text-[12px] text-mist">Dossiers › <span className="text-bone/80">Villa Mimosas</span></span>
            <span className="ml-auto shrink-0 rounded-full bg-sage/10 px-2.5 py-0.5 text-[10.5px] text-sage ring-1 ring-sage/25">RDV fait · 09:45</span>
          </div>
          <div className="p-4 md:p-5">
            <div className="flex items-center gap-4">
              <img src={img('villa-palm')} alt="Villa Mimosas, Juan-les-Pins" className="h-16 w-20 shrink-0 rounded-xl object-cover md:h-[72px] md:w-24" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-medium">Famille Costa · Villa Mimosas</div>
                <div className="truncate text-[12px] text-mist">5 pièces · 182 m² · Juan-les-Pins</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]"><motion.div className="h-full rounded-full bg-champagne" initial={{ width: '0%' }} animate={{ width: '67%' }} transition={{ duration: 1.4, delay: 0.7, ease: EXPO }} /></div>
                  <span className="num text-[11px] text-bone/70">6/9</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/[0.06]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-champagne/15 text-champagne-300"><Waveform size={15} weight="light" /></span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-bone/75">Débrief vocal · 2 min 04 · découverte complétée</span>
              <span className="num text-[11px] text-mist">09:52</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              {LIV.map(([c, t, s], i) => (
                <div key={c} className={clsx('relative overflow-hidden rounded-lg bg-white/[0.03] px-2.5 py-2 ring-1 ring-white/[0.05]', i > 5 && 'hidden sm:block')}>
                  {s === 'rédaction' && <span className="absolute inset-0 animate-shimmer bg-[linear-gradient(100deg,transparent_30%,rgb(var(--acc-500)_/_0.10)_50%,transparent_70%)] bg-[length:200%_100%]" />}
                  <div className="relative flex items-center gap-2 sm:block">
                    <span className="num text-[10.5px] text-champagne-300">{c}</span>
                    <span className="block flex-1 truncate text-[12px] text-bone/85 sm:mt-0.5">{t}</span>
                    <span className={clsx('text-[10.5px] sm:mt-0.5 sm:block', TONE[s])}>{s === 'rédaction' ? 'en rédaction…' : s}</span>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-2 text-[12px] ring-1 ring-white/[0.05] sm:hidden">
                <span className="text-bone/85"><span className="num text-[10.5px] text-champagne-300">L7 · L8 · L9</span></span>
                <span className="text-[10.5px] text-champagne-300">en rédaction…</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-champagne/[0.08] px-3.5 py-2.5 ring-1 ring-champagne/20">
              <span className="flex items-center gap-2 text-[12.5px] text-bone/85"><Sparkle size={13} weight="fill" className="text-champagne" /> 4 livrables à relire · 2 validés</span>
              <span className="hidden text-[11px] text-champagne-300 sm:inline">Validation humaine</span>
            </div>
          </div>
        </div>
      </div>
      {/* Notification de rappel */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.1, ease: EXPO }}
        className={clsx(card, 'glass absolute -bottom-2 left-3 flex w-[min(300px,calc(100%-24px))] items-center gap-3 p-3 shadow-float sm:-left-6 lg:-bottom-14')}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sage/15 text-sage"><WhatsappLogo size={17} weight="light" /></span>
        <span className="min-w-0"><span className="block text-[13px] font-medium">Rappel J-1 programmé</span><span className="block truncate text-[11.5px] text-mist">M. Garnier · visite demain 17:00</span></span>
      </motion.div>
    </motion.div>
  )
}

function StickyCta({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 90, opacity: 0 }} transition={{ duration: 0.5, ease: EXPO }}
          className="glass fixed inset-x-3 bottom-3 z-50 flex items-center justify-between gap-3 rounded-full py-1.5 pl-5 pr-1.5 shadow-float ring-1 ring-white/10 md:hidden">
          <span className="text-[12.5px] leading-tight"><span className="block font-medium">14 jours gratuits</span><span className="block text-mist">puis 49&nbsp;€ HT / siège</span></span>
          <Button size="sm" href="#essai">Essai gratuit</Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.07] px-5 py-10 md:px-10">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div><Logo /><p className="mt-3 text-[12.5px] text-mist">Le copilote des conseillers immobiliers. Conçu sur la Côte d’Azur.</p></div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-bone/65">
          <Link to="/" className="hover:text-champagne-300">Présentation complète</Link>
          <a href="/#tarifs" className="hover:text-champagne-300">Toutes les offres</a>
          <a href="#faq" className="hover:text-champagne-300">FAQ</a>
          <Link to="/app" className="hover:text-champagne-300">Connexion</Link>
        </nav>
      </div>
      <div className="mx-auto mt-8 flex max-w-[1200px] flex-col gap-2 text-[11.5px] text-mist md:flex-row md:justify-between">
        <span>© 2026 Jaspe · Démonstrateur — données synthétiques.</span>
        <span>Hébergement européen · Cookies essentiels uniquement</span>
      </div>
    </footer>
  )
}
