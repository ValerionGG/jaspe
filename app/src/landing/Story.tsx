import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { Eyebrow, Reveal, MaskLines } from '../ui/kit'
import { img } from '../data/mock'
import { Microphone, ChartLineUp, ChatCircleText, FileText, BellRinging, Handshake, Signature } from '@phosphor-icons/react'

/** Uniquement ce que Jaspe utilise réellement aujourd’hui. */
const NAMES = ['DVF · Etalab', 'IGN / geo.api.gouv.fr', 'WhatsApp Business (débrief)', 'InvoiceXpress (Portugal)', 'Import CSV eGO', 'Import CSV Hektor']

export function Marquee() {
  return (
    <section className="relative border-y border-white/[0.06] bg-ink py-8">
      <div className="mb-5 px-5 text-center text-[10px] uppercase tracking-eyebrow text-mist">Import de vos biens et contacts depuis eGO ou Hektor (fichier CSV) · Jaspe travaille à côté de votre CRM</div>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <div className="flex w-max animate-marquee gap-14 pr-14">
          {[...NAMES, ...NAMES, ...NAMES, ...NAMES].map((n, i) => (
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
  const text = 'Votre CRM fait tourner l’agence. Jaspe vous rend le temps d’après rendez-vous — et vous montre combien, corrections comprises. Vous écoutez, vous conseillez, vous décidez : le compte rendu, les documents et les relances vous attendent, prêts à relire.'
  const words = text.split(' ')
  return (
    <section className="relative bg-bone-100 px-5 py-32 text-ink md:px-10 md:py-48">
      <div className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-12">
        <div className="md:col-span-3">
          <Eyebrow tone="light">Manifeste</Eyebrow>
          <p className="mt-6 max-w-[220px] text-sm leading-relaxed text-ink/55">Pensé pour les conseillers, les mandataires indépendants et les agences, en France comme au Portugal.</p>
        </div>
        <div ref={ref} className="md:col-span-9">
          <p className="display text-[9vw] leading-[1.02] md:text-[4.6vw]">
            {words.map((w, i) => <Word key={i} w={w} progress={scrollYProgress} range={[i / words.length, Math.min(1, (i + 2) / words.length)]} />)}
          </p>
          <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-ink/10 md:grid-cols-4">
            {[['−6 h', 'de saisie par conseiller et par semaine visées'], ['7', 'moments suivis, du premier rendez-vous à l’acte'], ['9', 'documents prêts à relire après chaque rendez-vous'], ['100 %', 'des chiffres sourcés, datés, vérifiables']].map(([k, v], i) => (
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

/* ——— Parcours horizontal épinglé : les 7 moments, de la première rencontre à la vente ——— */
const CHAPTERS = [
  { k: 'Première rencontre', t: 'Préparer le rendez-vous', you: 'Vous fixez l’objectif : le projet du vendeur, ou les critères et le budget de l’acquéreur.', jaspe: 'Un brief de rendez-vous : faits connus, questions à poser, points à confirmer.', photo: 'window-sea', icon: ChatCircleText, ui: 'brief' },
  { k: 'À la sortie', t: 'Dicter le débrief', you: 'Vous dictez les faits, les objections et les engagements pris.', jaspe: 'Un compte rendu structuré, les points à vérifier, les prochaines actions.', photo: 'balcony-breakfast', icon: Microphone, ui: 'voice' },
  { k: 'Après l’échange', t: 'Éditer les documents', you: 'Vous vérifiez, corrigez les chiffres, choisissez quoi valider ou envoyer.', jaspe: 'Des brouillons utiles : estimation, compte rendu, message vendeur, sélection de biens.', photo: 'int-living', icon: FileText, ui: 'deliver' },
  { k: 'Entre deux échanges', t: 'Relancer', you: 'Vous adaptez le message et validez l’envoi au moment convenu.', jaspe: 'Rappelle l’engagement, propose la relance, signale les réponses et pièces attendues.', photo: 'int-chair', icon: BellRinging, ui: 'relance' },
  { k: 'Tout au long', t: 'Suivre le marché', you: 'Vous jugez de la pertinence, décidez de revoir le prix ou la sélection.', jaspe: 'Nouveaux comparables, baisses de prix, signaux du quartier.', photo: 'antibes-street', icon: ChartLineUp, ui: 'market' },
  { k: 'Une offre arrive', t: 'Négocier', you: 'Vous présentez l’offre, discutez, confirmez la réponse.', jaspe: 'Résume prix, conditions et échéances ; prépare la réponse ou la contre-proposition.', photo: 'antibes-skyline', icon: Handshake, ui: 'offer' },
  { k: 'Du compromis à l’acte', t: 'Finaliser la vente', you: 'Vous coordonnez les parties, faites valider les pièces, confirmez la signature.', jaspe: 'Liste des pièces, suivi des échéances, dossier de vente rassemblé.', photo: 'int-kitchen', icon: Signature, ui: 'acte' },
]

function ChapterUI({ kind }: { kind: string }) {
  if (kind === 'market') return (
    <div className="space-y-2">
      {[['T3 · Antibes centre', '4 120 €/m²', 78], ['T3 · Juan-les-Pins', '4 480 €/m²', 86], ['T2 · Lisboa, Arroios', '5 050 €/m²', 92]].map(([a, p, w]) => (
        <div key={a as string} className="flex items-center gap-3 text-[12px]"><span className="w-36 truncate text-bone/70">{a}</span><span className="h-1 flex-1 rounded-full bg-white/10"><span className="block h-1 rounded-full bg-champagne" style={{ width: `${w}%` }} /></span><span className="num text-bone">{p}</span></div>
      ))}
      <div className="pt-1 text-[11px] text-coral">Un comparable T3 du quartier baisse de 4 % cette semaine</div>
    </div>
  )
  if (kind === 'voice') return (
    <div className="flex h-16 items-center gap-[3px]">
      {Array.from({ length: 48 }).map((_, i) => <span key={i} className="w-[3px] flex-1 origin-center animate-wave rounded-full bg-champagne/80" style={{ height: `${20 + ((i * 37) % 80)}%`, animationDelay: `${(i % 12) * 0.08}s` }} />)}
    </div>
  )
  if (kind === 'relance') return (
    <div className="text-[12px] leading-snug">
      <div className="text-bone/85">« Je rappelle le vendeur vendredi après le diagnostic. »</div>
      <div className="mt-2 space-y-1 text-bone/65">
        {['Relance prête pour vendredi, à valider', 'Prix à confirmer : gardé en suspens', 'Alerte si un comparable baisse d’ici là'].map((l) => <div key={l} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-champagne" />{l}</div>)}
      </div>
    </div>
  )
  if (kind === 'offer') return (
    <div className="grid grid-cols-3 gap-2 text-[11.5px]">
      {[['Offre', '268 000 €'], ['Financement', 'prêt 80 %'], ['Réponse', 'avant jeudi']].map(([a, b]) => <div key={a} className="rounded-lg bg-white/5 px-2 py-1.5 ring-1 ring-white/10"><div className="text-mist">{a}</div><div className="num text-bone">{b}</div></div>)}
    </div>
  )
  if (kind === 'acte') return (
    <div className="space-y-1.5 text-[12px]">
      {[['Diagnostics', 'reçus'], ['Pièces de copropriété', 'en attente'], ['Signature chez le notaire', '14 mars']].map(([a, b], i) => <div key={a} className="flex justify-between text-bone/70"><span>{a}</span><span className={i === 1 ? 'text-coral' : 'text-sage'}>{b}</span></div>)}
    </div>
  )
  if (kind === 'deliver') return (
    <div className="grid grid-cols-2 gap-1.5">
      {['Estimation', 'Compte rendu', 'Message vendeur', 'Sélection de biens'].map((c, i) => (
        <span key={c} className={`rounded-lg px-2 py-1.5 text-center text-[11px] ring-1 ${i < 2 ? 'bg-champagne/15 text-champagne-300 ring-champagne/20' : 'bg-white/5 text-bone/50 ring-white/10'}`}>{c}</span>
      ))}
    </div>
  )
  return (
    <div className="space-y-1.5 text-[12px]">
      {['Projet : vendre un T3 à 280 k€ avant juin', 'À confirmer : charges de copropriété', 'Préférence déclarée : échanges par e-mail'].map((l) => <div key={l} className="flex gap-2 text-bone/70"><span className="mt-1.5 h-1 w-1 rounded-full bg-champagne" />{l}</div>)}
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
            <Eyebrow>De la première rencontre à la vente</Eyebrow>
            <MaskLines className="display mt-5 text-5xl md:text-7xl" lines={[<>Sept moments,</>, <span className="italic text-champagne-300">vous gardez la main.</span>]} />
          </div>
          <div className="hidden w-64 md:block">
            <div className="mb-2 flex justify-between text-[10px] uppercase tracking-eyebrow text-mist"><span>Avant</span><span>Pendant</span><span>Après</span></div>
            <div className="h-px bg-white/10"><motion.div className="h-px bg-champagne" style={{ width: bar }} /></div>
          </div>
        </div>
        <motion.div ref={track} style={{ x }} className="flex gap-5 pl-5 pr-[10vw] md:gap-6 md:pl-10">
          {CHAPTERS.map((c, i) => (
            <article key={c.t} data-cursor="Glisser" className="group relative h-[58vh] min-h-[420px] w-[86vw] shrink-0 overflow-hidden rounded-[2rem] ring-1 ring-white/10 md:w-[46vw] lg:w-[38vw]">
              <img src={img(c.photo)} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] ease-silk group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/10" />
              <div className="relative flex h-full flex-col justify-between p-6 md:p-8">
                <div className="flex items-start justify-between">
                  <span className="glass flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-[12px] ring-1 ring-white/10"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-champagne text-ink"><c.icon size={13} weight="bold" /></span>{c.k}</span>
                  <span className="display text-6xl text-bone/25 md:text-7xl">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div>
                  <div className="glass mb-6 rounded-2xl p-4 ring-1 ring-white/10"><ChapterUI kind={c.ui} /></div>
                  <h3 className="display text-4xl md:text-5xl">{c.t}</h3>
                  <dl className="mt-3 max-w-md space-y-1.5 text-[13.5px] leading-snug">
                    <div className="flex gap-3"><dt className="w-12 shrink-0 pt-0.5 text-[10.5px] uppercase tracking-eyebrow text-mist">Vous</dt><dd className="text-bone/75">{c.you}</dd></div>
                    <div className="flex gap-3"><dt className="w-12 shrink-0 pt-0.5 text-[10.5px] uppercase tracking-eyebrow text-champagne-300">Jaspe</dt><dd className="text-bone/75">{c.jaspe}</dd></div>
                  </dl>
                </div>
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
