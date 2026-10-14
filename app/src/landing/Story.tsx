import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { Eyebrow, Reveal, MaskLines, Ring, Pill } from '../ui/kit'
import { img } from '../data/mock'
import { Microphone, MapPin, ChartLineUp, ChatCircleText, Target, Sparkle } from '@phosphor-icons/react'

const NAMES = ['Apimo', 'Hektor', 'Google Agenda', 'Outlook', 'WhatsApp Business', 'Yousign', 'DVF · Etalab', 'IGN Géoplateforme', 'INSEE', 'SeLoger', 'Leboncoin', 'Bien’ici', 'Matterport', 'DocuSign']

export function Marquee() {
  return (
    <section className="relative border-y border-white/[0.06] bg-ink py-8">
      <div className="mb-5 text-center text-[10px] uppercase tracking-eyebrow text-mist">Se branche sur l’écosystème que vos équipes utilisent déjà</div>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <div className="flex w-max animate-marquee gap-14 pr-14">
          {[...NAMES, ...NAMES].map((n, i) => (
            <span key={i} className="flex items-center gap-14 whitespace-nowrap font-serif text-3xl text-bone/35">
              {n}<span className="h-1.5 w-1.5 rounded-full bg-champagne/40" />
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function Word({ w, progress, range }: { w: string; progress: MotionValue<number>; range: [number, number] }) {
  const o = useTransform(progress, range, [0.12, 1])
  return <motion.span style={{ opacity: o }} className="mr-[0.22em] inline-block">{w}</motion.span>
}

export function Manifesto() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.45'] })
  const text = 'Un grand conseiller ne perd pas son temps à saisir, chercher, relancer ou mettre en page. Il écoute, il conseille, il conclut. Jaspe prend tout le reste — et le fait avec le même niveau d’exigence, dans chaque agence du réseau.'
  const words = text.split(' ')
  return (
    <section className="relative bg-bone-100 px-5 py-32 text-ink md:px-10 md:py-48">
      <div className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-12">
        <div className="md:col-span-3">
          <Eyebrow tone="light">Manifeste</Eyebrow>
          <p className="mt-6 max-w-[220px] text-sm leading-relaxed text-ink/55">Pensé pour les agences indépendantes, les groupes multi-sites et les réseaux de mandataires.</p>
        </div>
        <div ref={ref} className="md:col-span-9">
          <p className="display text-[9vw] leading-[1.02] md:text-[4.6vw]">
            {words.map((w, i) => <Word key={i} w={w} progress={scrollYProgress} range={[i / words.length, Math.min(1, (i + 2) / words.length)]} />)}
          </p>
          <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-ink/10 md:grid-cols-4">
            {[['−6 h', 'de saisie par conseiller et par semaine visées'], ['14', 'livrables préparés à partir d’un seul rendez-vous'], ['60', 'routines métier prêtes à activer'], ['100 %', 'des chiffres sourcés, datés, vérifiables']].map(([k, v], i) => (
              <Reveal key={k} delay={i * 0.08} className="bg-bone-100 p-6 md:p-8">
                <div className="display text-5xl md:text-6xl">{k}</div>
                <div className="mt-3 text-[13px] leading-snug text-ink/55">{v}</div>
              </Reveal>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-ink/40">Objectifs de conception du pilote, à mesurer en conditions réelles.</p>
        </div>
      </div>
    </section>
  )
}

/* ——— Parcours horizontal épinglé ——— */
const CHAPTERS = [
  { n: 'D1', k: 'La veille', t: 'Brief relationnel', d: 'La veille du rendez-vous, Jaspe rassemble le contexte du vendeur, l’historique du bien et les points à confirmer. Chaque fait porte sa source.', photo: 'window-sea', icon: ChatCircleText, ui: 'brief' },
  { n: 'D2', k: 'Le marché', t: 'Comparables & tendances', d: 'Transactions DVF, annonces actives, délais de vente : un échantillon visible, des prix vendus distincts des prix affichés.', photo: 'villa-modern', icon: ChartLineUp, ui: 'market' },
  { n: 'D3', k: 'Le quartier', t: 'Radar d’évolution', d: 'Projets d’urbanisme, transports, permis et zonages au point exact — fait établi et impact supposé séparés.', photo: 'antibes-skyline', icon: MapPin, ui: 'radar' },
  { n: 'D4', k: 'La répétition', t: 'Coaching simulé', d: 'Un vendeur virtuel rejoue les objections probables. Feedback précis, privé, jamais un jugement de personnalité.', photo: 'int-chair', icon: Target, ui: 'coach' },
  { n: 'D5', k: 'La découverte', t: 'Entretien guidé & dictée', d: 'Sur le terrain, une dictée de deux minutes suffit : Jaspe propose les champs, vous validez. Hors connexion, rien ne se perd.', photo: 'balcony-breakfast', icon: Microphone, ui: 'voice' },
  { n: 'L1–L9', k: 'L’après', t: 'Neuf livrables, prêts à valider', d: 'Remerciement, synthèse équipe, avant-première acquéreurs, kit social, courrier voisinage, book de services, estimation, avant/après, dossier copro.', photo: 'villa-dusk-pool', icon: Sparkle, ui: 'deliver' },
]

function ChapterUI({ kind }: { kind: string }) {
  if (kind === 'market') return (
    <div className="space-y-2">
      {[['Ch. de la Garoupe', '17 419 €/m²', 92], ['Bd du Cap', '17 811 €/m²', 84], ['Av. Beau-Site', '16 583 €/m²', 71]].map(([a, p, w]) => (
        <div key={a as string} className="flex items-center gap-3 text-[12px]"><span className="w-32 truncate text-bone/70">{a}</span><span className="h-1 flex-1 rounded-full bg-white/10"><span className="block h-1 rounded-full bg-champagne" style={{ width: `${w}%` }} /></span><span className="num text-bone">{p}</span></div>
      ))}
    </div>
  )
  if (kind === 'radar') return (
    <div className="relative h-28 overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_50%,rgb(var(--sea)_/_.25),transparent_70%)]">
      {[[30, 40], [62, 30], [48, 66], [75, 62]].map(([x, y], i) => (
        <span key={i} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}><span className="absolute h-3 w-3 animate-pulseRing rounded-full bg-sea" style={{ animationDelay: `${i * 0.4}s` }} /><span className="relative block h-3 w-3 rounded-full bg-sea ring-2 ring-ink" /></span>
      ))}
      <div className="absolute inset-0 rounded-full border border-sea/20" style={{ inset: '10% 25%' }} />
    </div>
  )
  if (kind === 'voice') return (
    <div className="flex h-16 items-center gap-[3px]">
      {Array.from({ length: 48 }).map((_, i) => <span key={i} className="w-[3px] flex-1 origin-center animate-wave rounded-full bg-champagne/80" style={{ height: `${20 + ((i * 37) % 80)}%`, animationDelay: `${(i % 12) * 0.08}s` }} />)}
    </div>
  )
  if (kind === 'coach') return (
    <div className="flex items-center gap-4"><Ring value={82} size={64}><span className="num text-sm">82</span></Ring><div className="text-[12px] leading-snug text-bone/70">Objection « honoraires » bien traitée.<br /><span className="text-champagne-300">À travailler : reformulation du prix.</span></div></div>
  )
  if (kind === 'deliver') return (
    <div className="grid grid-cols-3 gap-1.5">
      {['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'].map((c, i) => (
        <span key={c} className={`rounded-lg px-2 py-1.5 text-center text-[11px] ring-1 ${i < 6 ? 'bg-champagne/15 text-champagne-300 ring-champagne/20' : 'bg-white/5 text-bone/50 ring-white/10'}`}>{c}</span>
      ))}
    </div>
  )
  return (
    <div className="space-y-1.5 text-[12px]">
      {['Projet : retraite en Bretagne, vente avant juin', 'À confirmer : surface du pool-house', 'Préférence déclarée : échanges par e-mail'].map((l) => <div key={l} className="flex gap-2 text-bone/70"><span className="mt-1.5 h-1 w-1 rounded-full bg-champagne" />{l}</div>)}
    </div>
  )
}

export function Parcours() {
  const ref = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [dist, setDist] = useState(0)
  useLayoutEffect(() => {
    const m = () => track.current && setDist(track.current.scrollWidth - window.innerWidth)
    m(); window.addEventListener('resize', m)
    return () => window.removeEventListener('resize', m)
  }, [])
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -dist])
  const bar = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  return (
    <section id="parcours" ref={ref} className="relative bg-ink" style={{ height: `calc(100vh + ${dist}px)` }}>
      <div className="sticky top-0 flex h-[100dvh] flex-col justify-center overflow-hidden pt-20">
        <div className="mb-10 flex items-end justify-between px-5 md:px-10">
          <div>
            <Eyebrow>Le parcours vendeur</Eyebrow>
            <MaskLines className="display mt-5 text-5xl md:text-7xl" lines={[<>D’un rendez-vous</>, <span className="italic text-champagne-300">à quatorze livrables.</span>]} />
          </div>
          <div className="hidden w-64 md:block">
            <div className="mb-2 flex justify-between text-[10px] uppercase tracking-eyebrow text-mist"><span>Avant</span><span>Pendant</span><span>Après</span></div>
            <div className="h-px bg-white/10"><motion.div className="h-px bg-champagne" style={{ width: bar }} /></div>
          </div>
        </div>
        <motion.div ref={track} style={{ x }} className="flex gap-5 pl-5 pr-[10vw] md:gap-6 md:pl-10">
          {CHAPTERS.map((c, i) => (
            <article key={c.n} data-cursor="Glisser" className="group relative h-[58vh] min-h-[420px] w-[86vw] shrink-0 overflow-hidden rounded-[2rem] ring-1 ring-white/10 md:w-[46vw] lg:w-[38vw]">
              <img src={img(c.photo)} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] ease-silk group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/10" />
              <div className="relative flex h-full flex-col justify-between p-6 md:p-8">
                <div className="flex items-start justify-between">
                  <span className="glass flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-[12px] ring-1 ring-white/10"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-champagne text-ink"><c.icon size={13} weight="bold" /></span>{c.k}</span>
                  <span className="display text-6xl text-bone/25 md:text-7xl">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div>
                  <div className="glass mb-6 rounded-2xl p-4 ring-1 ring-white/10"><ChapterUI kind={c.ui} /></div>
                  <div className="mb-2 flex items-center gap-3"><Pill tone="gold">{c.n}</Pill></div>
                  <h3 className="display text-4xl md:text-5xl">{c.t}</h3>
                  <p className="mt-3 max-w-md text-[14px] leading-relaxed text-bone/65">{c.d}</p>
                </div>
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
