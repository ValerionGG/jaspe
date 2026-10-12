import { motion, AnimatePresence } from 'motion/react'
import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import {
  Clock, FileText, BellRinging, SealCheck, Check, Plus, WhatsappLogo, EnvelopeSimple, ChatText,
  Storefront, Hash, ShieldCheck, Sparkle, Prohibit, Scales, Lock, Megaphone, Users, Buildings, ImageSquare, Newspaper,
  BookOpenText, ClipboardText, ChartLineUp, HandHeart, type Icon,
} from '@phosphor-icons/react'
import { Eyebrow, EXPO } from '../ui/kit'
import { img } from '../data/mock'

/* ——— Briques communes de la page Essentiel ——— */

/** Apparition légère (sans flou) : la page doit rester rapide. */
export function In({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-8% 0px' }} transition={{ duration: 0.8, delay, ease: EXPO }}>
      {children}
    </motion.div>
  )
}

export const card = 'rounded-[1.4rem] bg-ink-800 ring-1 ring-white/[0.06] shadow-bezel'
export const micro = 'text-[10.5px] uppercase tracking-eyebrow text-mist'

export function Head({ kicker, title, accent, sub, center }: { kicker: string; title: ReactNode; accent: ReactNode; sub?: ReactNode; center?: boolean }) {
  return (
    <In className={clsx('max-w-2xl', center && 'mx-auto text-center')}>
      <Eyebrow>{kicker}</Eyebrow>
      <h2 className="display mt-5 text-[2.5rem] sm:text-5xl md:text-[3.6rem]">{title} <span className="italic text-champagne-300">{accent}</span></h2>
      {sub && <p className="mt-5 text-[15.5px] leading-relaxed text-bone/65">{sub}</p>}
    </In>
  )
}

export const Section = ({ id, children, className }: { id?: string; children: ReactNode; className?: string }) => (
  <section id={id} className={clsx('scroll-mt-24 px-5 py-20 md:px-10 md:py-28', className)}><div className="mx-auto max-w-[1200px]">{children}</div></section>
)

const PilotTag = () => <span className="rounded-full bg-champagne/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-champagne-300 ring-1 ring-champagne/20">Objectif pilote</span>

/* ——— 3 bénéfices chiffrés ——— */

const BENEFITS: { k: string; u: string; t: string; d: string; icon: Icon }[] = [
  { k: '−5 h', u: 'de saisie par semaine', t: 'Fini les soirées de rédaction', d: 'Brief, comptes rendus, estimation : rédigés à partir de vos rendez-vous et de sources datées (DVF, INSEE, pièces du dossier).', icon: Clock },
  { k: '10 min', u: 'pour relire les 9 livrables', t: 'Un suivi vendeur qui impressionne', d: 'Remerciement, estimation, kit social, courrier voisinage… prêts à relire quelques minutes après votre débrief.', icon: FileText },
  { k: '−30 %', u: 'de rendez-vous non honorés', t: 'Des clients qui se sentent suivis', d: 'Rappels J-1 et H-2 sur WhatsApp, relances acquéreurs et bilans vendeur programmés pour vous.', icon: BellRinging },
]

export function Benefits() {
  return (
    <Section className="bg-ink-850">
      <Head kicker="Ce que vous y gagnez" title="Moins de bureau," accent="plus de mandats." />
      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {BENEFITS.map((b, i) => (
          <In key={b.t} delay={i * 0.08} className={clsx(card, 'flex flex-col p-7')}>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-champagne/10 text-champagne-300 ring-1 ring-champagne/20"><b.icon size={18} weight="light" /></span>
              <PilotTag />
            </div>
            <div className="display mt-8 text-6xl text-bone">{b.k}</div>
            <div className="mt-1 text-[13px] text-mist">{b.u}</div>
            <div className="mt-7 border-t border-white/[0.07] pt-5 text-[16px] font-medium">{b.t}</div>
            <p className="mt-2 text-[14px] leading-relaxed text-bone/60">{b.d}</p>
          </In>
        ))}
      </div>
      <p className="mt-5 text-[12px] text-mist">Objectifs fixés pour le pilote Côte d’Azur 2026, mesurés pendant votre essai — pas des résultats garantis.</p>
    </Section>
  )
}

/* ——— Comment ça marche ——— */

function IllusAgenda() {
  return (
    <div className="space-y-2">
      {[['09:00', 'Visite · Appartement Juan-les-Pins', false], ['10:30', 'Estimation · Famille Costa', true], ['14:00', 'Visite · Villa Biot', false]].map(([h, t, on]) => (
        <div key={h as string} className={clsx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12.5px] ring-1', on ? 'bg-champagne/10 ring-champagne/30' : 'bg-white/[0.03] ring-white/[0.06]')}>
          <span className="num text-mist">{h}</span><span className={on ? 'text-bone' : 'text-bone/60'}>{t}</span>
          {on && <span className="ml-auto flex items-center gap-1 text-[11px] text-champagne-300"><Sparkle size={11} weight="fill" /> brief prêt</span>}
        </div>
      ))}
    </div>
  )
}

function IllusVoice() {
  return (
    <div className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/[0.06]">
      <div className="flex h-10 items-center gap-[3px]">
        {Array.from({ length: 34 }, (_, i) => (
          <span key={i} className="w-[3px] origin-center animate-wave rounded-full bg-champagne/70" style={{ height: `${30 + ((i * 37) % 70)}%`, animationDelay: `${(i % 7) * 0.12}s` }} />
        ))}
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-bone/60">« Vendeurs pressés, mutation à Lyon en janvier. Toiture refaite en 2021, piscine à rénover… »</p>
      <div className="mt-2 num text-[11px] text-mist">2 min 04 · transcrit et classé</div>
    </div>
  )
}

function IllusValidate() {
  return (
    <div className="space-y-2">
      {['L1 · Remerciement', 'L7 · Estimation', 'L5 · Courrier voisinage'].map((t) => (
        <div key={t} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 text-[12.5px] ring-1 ring-white/[0.06]">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sage/15 text-sage"><Check size={11} weight="bold" /></span>{t}
          <span className="ml-auto text-[11px] text-sage">validé</span>
        </div>
      ))}
      <div className="pt-1 text-right num text-[11px] text-mist">Validé par vous · 11:52</div>
    </div>
  )
}

const STEPS = [
  { n: '01', t: 'Connectez votre agenda', d: 'Google ou Outlook, et votre CRM si vous en avez un (Apimo, Hektor, Modelo). NXT repère vos rendez-vous vendeurs et prépare le brief la veille.', time: '10 minutes, une seule fois', el: <IllusAgenda /> },
  { n: '02', t: 'Dictez deux minutes', d: 'En sortant du rendez-vous, racontez ce que vous avez appris. Le copilote structure la découverte : projet, délais, travaux, points sensibles.', time: '2 minutes par rendez-vous', el: <IllusVoice /> },
  { n: '03', t: 'Relisez, validez', d: 'Les neuf livrables vous attendent. Vous corrigez si besoin, vous validez : rien ne part chez un client sans votre clic.', time: '10 minutes de relecture', el: <IllusValidate /> },
]

export function Steps() {
  return (
    <Section id="comment">
      <Head kicker="Comment ça marche" title="Trois gestes," accent="c’est tout." sub="Pas de formation de trois jours, pas de nouveau logiciel à apprendre : NXT travaille autour de votre agenda." />
      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <In key={s.n} delay={i * 0.08} className={clsx(card, 'flex flex-col p-6')}>
            <div className="flex items-baseline justify-between"><span className="num text-[13px] text-champagne-300">{s.n}</span><span className="text-[11.5px] text-mist">{s.time}</span></div>
            <div className="mt-5 min-h-[172px]">{s.el}</div>
            <h3 className="mt-6 text-[18px] font-medium">{s.t}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-bone/60">{s.d}</p>
          </In>
        ))}
      </div>
    </Section>
  )
}

/* ——— Avant / après : une journée de conseiller ——— */

type Slot = { s: string; e: string; t: string; k: 'bureau' | 'terrain' }
const DAY: Record<'sans' | 'avec', { slots: Slot[]; end: string; bureau: string }> = {
  sans: {
    end: '20:00', bureau: '5 h 45',
    slots: [
      { s: '08:00', e: '09:15', t: 'Préparer le rendez-vous : DVF, cadastre, annonces concurrentes', k: 'bureau' },
      { s: '10:00', e: '11:30', t: 'Rendez-vous vendeur — Famille Costa', k: 'terrain' },
      { s: '12:00', e: '13:00', t: 'Mail de remerciement et compte rendu pour l’équipe', k: 'bureau' },
      { s: '14:00', e: '15:30', t: 'Rappeler 11 contacts, confirmer 3 visites au téléphone', k: 'bureau' },
      { s: '16:00', e: '17:30', t: 'Deux visites acquéreurs', k: 'terrain' },
      { s: '18:00', e: '20:00', t: 'Estimation sous Word, courrier voisinage, post Instagram', k: 'bureau' },
    ],
  },
  avec: {
    end: '17:50', bureau: '1 h',
    slots: [
      { s: '08:00', e: '08:15', t: 'Lire le brief prêt : marché, quartier, points de vigilance', k: 'bureau' },
      { s: '08:30', e: '09:30', t: 'Prospection terrain sur le secteur', k: 'terrain' },
      { s: '10:00', e: '11:30', t: 'Rendez-vous vendeur — Famille Costa', k: 'terrain' },
      { s: '11:35', e: '11:40', t: 'Débrief vocal de deux minutes, dans la voiture', k: 'bureau' },
      { s: '12:00', e: '12:20', t: 'Relire et valider les 9 livrables', k: 'bureau' },
      { s: '14:00', e: '15:30', t: 'Deux visites acquéreurs — rappels déjà partis', k: 'terrain' },
      { s: '16:00', e: '17:30', t: 'Nouveau rendez-vous d’estimation', k: 'terrain' },
      { s: '17:30', e: '17:50', t: 'Valider les relances proposées pour demain', k: 'bureau' },
    ],
  },
}
const mins = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + b }
const pos = (h: string) => ((mins(h) - 480) / 720) * 100 // 08:00 → 20:00

export function DayCompare() {
  const [mode, setMode] = useState<'sans' | 'avec'>('avec')
  const d = DAY[mode]
  return (
    <Section className="bg-ink-850">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <Head kicker="Avant / après" title="La même journée," accent="deux fins de soirée." />
        <div className="flex shrink-0 self-start rounded-full bg-white/[0.04] p-1 ring-1 ring-white/10 md:self-auto" role="tablist">
          {(['sans', 'avec'] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className="relative rounded-full px-5 py-2 text-[13px]">
              {mode === m && <motion.span layoutId="ess-day" className="absolute inset-0 rounded-full bg-bone" transition={{ duration: 0.5, ease: EXPO }} />}
              <span className={clsx('relative', mode === m ? 'text-ink' : 'text-bone/70')}>{m === 'sans' ? 'Sans NXT' : 'Avec NXT Essentiel'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={clsx(card, 'mt-10 p-5 md:p-8')}>
        {/* Frise 08:00 → 20:00 */}
        <div className="relative h-10 rounded-full bg-white/[0.03] ring-1 ring-white/[0.06]">
          {d.slots.map((s) => (
            <motion.span key={mode + s.s} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, ease: EXPO }} title={`${s.s}–${s.e} · ${s.t}`}
              className={clsx('absolute inset-y-2 origin-left rounded-[5px] border-x border-ink-800', s.k === 'bureau' ? 'bg-coral/70' : 'bg-sage/70')}
              style={{ left: `${pos(s.s)}%`, width: `max(4px, ${pos(s.e) - pos(s.s)}%)` }} />
          ))}
        </div>
        <div className="mt-2 flex justify-between num text-[10.5px] text-mist">{['08:00', '11:00', '14:00', '17:00', '20:00'].map((h) => <span key={h}>{h}</span>)}</div>
        <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-bone/60">
          <span className="flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-coral/70" /> Bureau & saisie</span>
          <span className="flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-sage/70" /> Terrain & clients</span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
          <AnimatePresence mode="wait">
            <motion.ol key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.4, ease: EXPO }} className="divide-y divide-white/[0.06]">
              {d.slots.map((s) => (
                <li key={s.s} className="flex items-start gap-4 py-3">
                  <span className="num w-[92px] shrink-0 pt-0.5 text-[12px] text-mist">{s.s}–{s.e}</span>
                  <span className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', s.k === 'bureau' ? 'bg-coral' : 'bg-sage')} />
                  <span className="text-[14.5px] text-bone/85">{s.t}</span>
                </li>
              ))}
            </motion.ol>
          </AnimatePresence>
          <div className="grid grid-cols-2 gap-3 self-start lg:grid-cols-1">
            <div className="rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.06]">
              <div className={micro}>Temps de bureau</div>
              <div className={clsx('display mt-2 text-5xl', mode === 'avec' ? 'text-sage' : 'text-coral')}>{d.bureau}</div>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.06]">
              <div className={micro}>Fin de journée</div>
              <div className="display mt-2 text-5xl">{d.end}</div>
              <div className="mt-1 text-[12px] text-mist">{mode === 'avec' ? 'et un rendez-vous d’estimation de plus' : 'et rien de prêt pour demain'}</div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-[12px] text-mist">Journée type illustrative d’un conseiller transaction, construite avec des agences pilotes.</p>
    </Section>
  )
}

/* ——— Les 9 livrables ——— */

const LIVRABLES: { c: string; t: string; d: string; to: string; icon: Icon }[] = [
  { c: 'L1', t: 'Remerciement', d: 'Mail personnalisé reprenant ce que le vendeur vous a confié.', to: 'Vendeur', icon: HandHeart },
  { c: 'L2', t: 'Synthèse équipe', d: 'Fiche bien, projet, délais et points sensibles pour vos collègues.', to: 'Interne', icon: Users },
  { c: 'L3', t: 'Avant-première acquéreurs', d: 'Les acquéreurs compatibles prévenus avant la mise en ligne.', to: 'Acquéreurs', icon: Megaphone },
  { c: 'L4', t: 'Kit social', d: 'Posts Instagram et Facebook aux couleurs de votre agence.', to: 'Réseaux sociaux', icon: Newspaper },
  { c: 'L5', t: 'Courrier voisinage', d: 'Lettre aux voisins pour trouver l’acquéreur… ou le prochain vendeur.', to: 'Voisinage', icon: EnvelopeSimple },
  { c: 'L6', t: 'Book services', d: 'Votre méthode et vos services, mis en page pour ce vendeur.', to: 'Vendeur', icon: BookOpenText },
  { c: 'L7', t: 'Estimation', d: 'Fourchette argumentée, comparables DVF datés et sourcés.', to: 'Vendeur', icon: ChartLineUp },
  { c: 'L8', t: 'Avant / après', d: 'Valorisation photo, images IA étiquetées, original conservé.', to: 'Diffusion', icon: ImageSquare },
  { c: 'L9', t: 'Copro & diagnostics', d: 'Pièces à réunir, diagnostics manquants, échéances.', to: 'Vendeur', icon: ClipboardText },
]

export function Deliverables() {
  return (
    <Section id="livrables">
      <Head kicker="Après chaque rendez-vous" title="Neuf documents rédigés," accent="à relire, pas à écrire." sub="Chaque livrable reprend votre débrief, votre marque et des chiffres sourcés. Vous modifiez une phrase si besoin, puis vous validez." />
      <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LIVRABLES.map((l, i) => (
          <In key={l.c} delay={(i % 3) * 0.06} className={clsx(card, 'group flex gap-4 p-5 transition-colors duration-500 ease-silk hover:bg-ink-700')}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-champagne-300 ring-1 ring-white/[0.08]"><l.icon size={18} weight="light" /></span>
            <div className="min-w-0">
              <div className="flex items-center gap-2"><span className="num text-[11.5px] text-champagne-300">{l.c}</span><span className="text-[15px] font-medium">{l.t}</span></div>
              <p className="mt-1 text-[13px] leading-relaxed text-bone/55">{l.d}</p>
              <span className="mt-3 inline-block rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[10.5px] text-mist ring-1 ring-white/[0.06]">→ {l.to}</span>
            </div>
          </In>
        ))}
      </div>
    </Section>
  )
}

/* ——— Rappels WhatsApp ——— */

const THREAD: { from: 'out' | 'in' | 'sys'; t: string; h?: string; tag?: string }[] = [
  { from: 'sys', t: 'Lundi 12 octobre' },
  { from: 'out', h: '18:00', tag: 'Modèle approuvé · J-1', t: 'Bonjour Madame Laurent, je vous confirme notre rendez-vous demain, mardi 13 octobre à 10 h 30, pour l’estimation de votre maison à Biot. Répondez 1 pour confirmer, 2 pour décaler. Claire — Agence du Port' },
  { from: 'in', h: '18:04', t: '1 — parfait, à demain !' },
  { from: 'sys', t: 'Confirmé · agenda mis à jour' },
  { from: 'sys', t: 'Mardi 13 octobre' },
  { from: 'out', h: '08:30', tag: 'Rappel H-2', t: 'Bonjour ! Je serai chez vous à 10 h 30 avec l’étude de marché. Pensez au dernier avis de taxe foncière si vous l’avez sous la main.' },
]

export function Reminders() {
  return (
    <Section className="bg-ink-850">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div>
          <Head kicker="Rappels automatiques" title="Vos relances partent," accent="même quand vous visitez." sub="J-1 à 18 h, H-2 le jour même : chaque rendez-vous de votre agenda déclenche ses rappels WhatsApp. Le client confirme d’un chiffre, votre agenda se met à jour." />
          <ul className="mt-8 space-y-3.5">
            {[
              ['Uniquement aux clients qui ont accepté', 'Sans accord WhatsApp enregistré, aucun message ne part.'],
              ['Des modèles validés à l’avance', 'Prénom, date, heure, lieu, bien : les variables se remplissent seules.'],
              ['« 2 » pour décaler ?', 'Le copilote vous propose trois créneaux libres, vous choisissez.'],
              ['Client sans réponse depuis 2 h ?', 'Vous êtes alerté, avec un message de relance prêt à valider.'],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-champagne/15 text-champagne-300"><Check size={11} weight="bold" /></span>
                <span><span className="block text-[14.5px] font-medium">{t}</span><span className="block text-[13.5px] text-bone/55">{d}</span></span>
              </li>
            ))}
          </ul>
        </div>
        <In className="mx-auto w-full max-w-[380px]">
          <div className="rounded-[2.4rem] bg-ink-700 p-2.5 shadow-float ring-1 ring-white/10">
            <div className="overflow-hidden rounded-[2rem] bg-ink-900">
              <div className="flex items-center gap-3 bg-ink-800 px-4 py-3.5 ring-1 ring-white/[0.06]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sea/15 text-[12px] font-medium text-sea">ML</span>
                <div className="min-w-0 flex-1"><div className="text-[14px] font-medium">Mme Laurent</div><div className="text-[11px] text-mist">Vendeuse · Maison à Biot</div></div>
                <WhatsappLogo size={20} weight="light" className="text-sage" />
              </div>
              <div className="space-y-2.5 px-3.5 py-4">
                {THREAD.map((m, i) => m.from === 'sys' ? (
                  <div key={i} className="text-center"><span className="rounded-full bg-white/[0.05] px-3 py-1 text-[10.5px] text-mist">{m.t}</span></div>
                ) : (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 * i, duration: 0.6, ease: EXPO }}
                    className={clsx('max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug', m.from === 'out' ? 'ml-auto rounded-br-md bg-sage/[0.16] text-bone' : 'rounded-bl-md bg-white/[0.06] text-bone')}>
                    {m.tag && <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-sage">{m.tag}</div>}
                    {m.t}
                    <div className="mt-1 text-right num text-[10px] text-mist">{m.h}{m.from === 'out' && ' ✓✓'}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </In>
      </div>
    </Section>
  )
}

/* ——— Messagerie unifiée ——— */

const CHANNELS: [Icon, string, number][] = [[WhatsappLogo, 'WhatsApp', 4], [EnvelopeSimple, 'E-mail', 7], [ChatText, 'SMS', 1], [Storefront, 'Portails', 3], [Hash, 'Équipe', 2]]
const CONVS: { ch: Icon; who: string; t: string; tag: string; tone: string; h: string }[] = [
  { ch: WhatsappLogo, who: 'Mme Costa', t: 'Merci pour ce matin ! On prépare les diagnostics ?', tag: 'Vendeur', tone: 'bg-champagne/10 text-champagne-300 ring-champagne/25', h: '10:31' },
  { ch: EnvelopeSimple, who: 'Paul Garnier', t: 'Financement validé, quand peut-on revisiter ?', tag: 'Acquéreur chaud', tone: 'bg-sage/10 text-sage ring-sage/25', h: '10:12' },
  { ch: Storefront, who: 'SeLoger', t: 'Demande de visite — 3 pièces, Juan-les-Pins', tag: 'Nouveau contact', tone: 'bg-sea/10 text-sea ring-sea/25', h: '09:47' },
  { ch: ChatText, who: 'Me Ravel, notaire', t: 'Projet de compromis envoyé pour relecture.', tag: 'Transaction', tone: 'bg-white/[0.05] text-bone/70 ring-white/10', h: '09:20' },
  { ch: Hash, who: '#équipe · Julien', t: '@Claire je prends la visite de 17 h à Biot.', tag: 'Interne', tone: 'bg-white/[0.05] text-bone/70 ring-white/10', h: '08:58' },
]

export function Inbox() {
  return (
    <Section>
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <In className={clsx(card, 'order-2 overflow-hidden lg:order-1')}>
          <div className="flex gap-1.5 overflow-x-auto border-b border-white/[0.06] p-3 scrollbar-none">
            {CHANNELS.map(([I, l, n]) => (
              <span key={l} className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-[12px] text-bone/75 ring-1 ring-white/[0.06]">
                <I size={13} weight="light" />{l}<span className="num text-[10.5px] text-champagne-300">{n}</span>
              </span>
            ))}
          </div>
          <ul className="divide-y divide-white/[0.05]">
            {CONVS.map((c) => (
              <li key={c.who} className="flex items-start gap-3 px-4 py-3.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-bone/70"><c.ch size={15} weight="light" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="truncate text-[13.5px] font-medium">{c.who}</span><span className="ml-auto num text-[10.5px] text-mist">{c.h}</span></div>
                  <p className="truncate text-[12.5px] text-bone/55">{c.t}</p>
                  <span className={clsx('mt-1.5 inline-block rounded-full px-2 py-[2px] text-[10.5px] ring-1', c.tone)}>{c.tag}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-start gap-2.5 border-t border-white/[0.06] bg-champagne/[0.05] px-4 py-3 text-[12.5px] text-bone/75">
            <Sparkle size={14} weight="fill" className="mt-0.5 shrink-0 text-champagne" />
            <span><span className="text-champagne-300">Réponse suggérée à Paul Garnier :</span> « Bonne nouvelle ! Je vous propose jeudi 15 à 17 h ou vendredi 16 à 9 h 30. »</span>
          </div>
        </In>
        <div className="order-1 lg:order-2">
          <Head kicker="Messagerie unifiée" title="Un seul fil" accent="par client." sub="WhatsApp, e-mails, SMS, demandes des portails et discussions d’équipe arrivent au même endroit, classés automatiquement : vendeur, acquéreur chaud, transaction, nouveau contact." />
          <div className="mt-7 flex flex-wrap gap-2 text-[12.5px] text-bone/70">
            {['Classement automatique', 'Réponses suggérées', 'Mentions @équipe', 'Historique dans le dossier'].map((x) => <span key={x} className="rounded-full bg-white/[0.04] px-3 py-1.5 ring-1 ring-white/[0.08]">{x}</span>)}
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ——— Conformité ——— */

const COMPLIANCE: [Icon, string, string][] = [
  [Lock, 'RGPD', 'Hébergement européen, registre des consentements, opposition propagée à toutes les relances.'],
  [ImageSquare, 'AI Act', 'Images retouchées par IA étiquetées, original toujours conservé (août 2026).'],
  [Prohibit, 'Démarchage', 'Aucun appel de prospection sans consentement préalable (11/08/2026), preuve horodatée.'],
  [SealCheck, 'Validation humaine', 'Rien ne part chez un client, un acquéreur ou un voisin sans votre clic.'],
  [Scales, 'Chiffres sourcés', 'Chaque prix et chaque surface sont datés et reliés à leur source.'],
]

export function Compliance() {
  return (
    <Section className="bg-ink-850">
      <Head center kicker="Conformité incluse" title="Serein face aux règles" accent="de 2026." />
      <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {COMPLIANCE.map(([I, t, d], i) => (
          <In key={t} delay={i * 0.05} className={clsx(card, 'p-5')}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage/10 text-sage ring-1 ring-sage/25"><I size={16} weight="light" /></span>
              <span className="text-[14.5px] font-medium">{t}</span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-bone/55">{d}</p>
          </In>
        ))}
      </div>
      <p className="mt-5 flex items-center justify-center gap-2 text-center text-[12px] text-mist"><ShieldCheck size={13} weight="light" /> Vos données ne servent jamais à entraîner des modèles et ne sont jamais revendues.</p>
    </Section>
  )
}

/* ——— Scénarios d’usage ——— */

const SCENARIOS = [
  { photo: 'p-sofia', who: 'Sofia', role: 'Conseillère indépendante · Juan-les-Pins', q: 'Mes estimations, je les faisais le soir. Maintenant je dicte dans la voiture, je relis à midi et le vendeur reçoit tout avant même que je sois rentrée.', gain: 'Préparation & livrables', icon: FileText },
  { photo: 'p-julien', who: 'Julien', role: 'Agence de 3 conseillers · Biot', q: 'Les visites confirmées la veille sur WhatsApp, c’est fini les déplacements pour rien. Et je ne me demande plus qui a rappelé qui.', gain: 'Rappels & messagerie', icon: BellRinging },
  { photo: 'p-lea', who: 'Léa', role: 'Directrice d’agence · Valbonne', q: 'Le courrier voisinage et le kit social partent pour chaque mandat, pas seulement quand on a le temps. Notre image a changé dans le quartier.', gain: 'Marketing du mandat', icon: Buildings },
]

export function Scenarios() {
  return (
    <Section>
      <Head kicker="Scénarios d’usage" title="À quoi ressemble" accent="votre semaine." sub="Ces portraits sont des scénarios illustratifs construits avec des agences pilotes — pas des témoignages de clients." />
      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {SCENARIOS.map((s, i) => (
          <In key={s.who} delay={i * 0.08} className={clsx(card, 'flex flex-col p-6')}>
            <div className="flex items-center gap-3">
              <img src={img(s.photo)} alt="" loading="lazy" className="h-11 w-11 rounded-full object-cover" />
              <div><div className="text-[14.5px] font-medium">{s.who}</div><div className="text-[12px] text-mist">{s.role}</div></div>
            </div>
            <blockquote className="display mt-6 flex-1 text-[1.45rem] leading-[1.25] text-bone/90">« {s.q} »</blockquote>
            <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-4 text-[12px]">
              <span className="flex items-center gap-1.5 text-champagne-300"><s.icon size={13} weight="light" /> {s.gain}</span>
              <span className="text-mist">Scénario illustratif</span>
            </div>
          </In>
        ))}
      </div>
    </Section>
  )
}

/* ——— FAQ ——— */

const FAQ = [
  ['Que se passe-t-il après les 14 jours ?', 'Rien d’automatique : aucune carte bancaire n’est demandée. Vous choisissez de continuer à 49 € HT par siège et par mois, ou vous exportez vos documents ; vos données sont alors supprimées sous 30 jours.'],
  ['Faut-il changer de CRM ?', 'Non. NXT Essentiel se branche sur Apimo, Hektor ou Modelo, ou fonctionne seul avec votre agenda. Vous gardez vos habitudes, NXT s’occupe de la rédaction et des relances.'],
  ['Est-ce que des messages partent sans moi ?', 'Seuls les rappels de rendez-vous, sur des modèles que vous avez validés et à des clients qui ont donné leur accord. Tout le reste — livrables, relances, courriers — attend votre validation.'],
  ['De quoi ai-je besoin pour WhatsApp ?', 'D’un numéro WhatsApp Business. Nous le connectons avec vous pendant l’appel de démarrage de 30 minutes ; en attendant, les rappels restent préparés et visibles dans NXT.'],
  ['Et si mon agence grandit ?', 'Vous passez à l’offre Agence (5 sièges, CRM natif, matching acquéreurs) à tout moment, sans ressaisie, au prorata du mois en cours.'],
]

export function Faq() {
  const [o, setO] = useState<number | null>(0)
  return (
    <Section id="faq" className="bg-ink-850">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[0.8fr_1.2fr]">
        <Head kicker="FAQ" title="Les questions" accent="qu’on nous pose." />
        <div>
          {FAQ.map(([q, a], i) => (
            <div key={q} className="border-b border-white/[0.07]">
              <button onClick={() => setO(o === i ? null : i)} aria-expanded={o === i} className="flex w-full items-center justify-between gap-6 py-5 text-left">
                <span className="text-[16.5px]">{q}</span>
                <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ring-white/10 transition-transform duration-500 ease-silk', o === i && 'rotate-45 bg-champagne text-ink')}><Plus size={14} /></span>
              </button>
              <AnimatePresence initial={false}>
                {o === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: EXPO }} className="overflow-hidden">
                    <p className="pb-6 pr-10 text-[14.5px] leading-relaxed text-bone/60">{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

