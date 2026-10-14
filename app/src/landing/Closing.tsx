import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react'
import { useRef, useState, type FormEvent } from 'react'
import { Eyebrow, Reveal, MaskLines, Button, Bezel, Magnetic, EXPO } from '../ui/kit'
import { img } from '../data/mock'
import { Plus, Check, ShieldCheck } from '@phosphor-icons/react'
import { Logo } from './chrome'
import { action, ApiError } from '../data/store'
import { useTheme } from '../ui/theme'

const PERSONAS = [
  { who: 'Conseiller terrain', photo: 'p-claire', q: 'Je sors d’un rendez-vous, je dicte deux minutes dans la voiture. À mon retour, le mail de remerciement, la synthèse équipe et l’estimation m’attendent — je relis, je valide.', gain: 'Préparation, découverte, livrables' },
  { who: 'Directeur d’agence', photo: 'p-marc', q: 'Le lundi, je sais quels dossiers bloquent, qui a besoin d’aide et pourquoi. La réunion commerciale se prépare toute seule, avec des chiffres que tout le monde comprend.', gain: 'Pilotage, coaching, réunions' },
  { who: 'Coordinatrice transaction', photo: 'p-ines', q: 'Chaque pièce manquante a un responsable, une échéance et une relance. Du compromis à l’acte, plus rien ne dépend de ma mémoire.', gain: 'Pièces, échéances, notaires' },
  { who: 'Direction réseau', photo: 'p-thomas', q: 'Une méthode, une marque, des routines déployées dans 40 agences — et une vision claire de l’adoption et des coûts, agence par agence.', gain: 'Gouvernance, marque, adoption' },
]

export function Personas() {
  const [i, setI] = useState(0)
  const p = PERSONAS[i]
  return (
    <section className="relative bg-bone-100 px-4 py-32 text-ink md:px-10 md:py-44">
      <div className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <Eyebrow tone="light">Par métier</Eyebrow>
          <MaskLines className="display mt-6 text-5xl md:text-6xl" lines={[<>Chacun y gagne</>, <span className="italic text-champagne-700">ce qui lui manque.</span>]} />
          <div className="mt-10 space-y-1">
            {PERSONAS.map((x, k) => (
              <button key={x.who} onClick={() => setI(k)} className={`group flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left transition-all duration-500 ease-silk ${k === i ? 'bg-ink text-bone' : 'hover:bg-ink/5'}`}>
                <span className="flex items-center gap-3"><img src={img(x.photo)} alt="" className="h-9 w-9 rounded-full object-cover" /><span className="text-[15px]">{x.who}</span></span>
                <span className={`text-[11px] ${k === i ? 'text-champagne-300' : 'text-ink/40'}`}>{x.gain}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-7 md:col-start-6">
          <AnimatePresence mode="wait">
            <motion.figure key={i} initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }} transition={{ duration: 0.8, ease: EXPO }} className="relative">
              <div className="relative overflow-hidden rounded-[2rem]">
                <img src={img(p.photo)} alt="" className="h-[300px] w-full object-cover object-[50%_25%] md:h-[380px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                <span className="absolute bottom-5 left-6 text-[11px] uppercase tracking-eyebrow text-bone/80">{p.who} · scénario d’usage</span>
              </div>
              <blockquote className="display mt-10 text-3xl leading-[1.15] md:text-[2.75rem]">« {p.q} »</blockquote>
            </motion.figure>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

const PLANS = [
  { n: 'Overlay', p: 49, u: '/ siège / mois HT', d: 'Sur votre CRM actuel — Apimo, Hektor, Modelo.', f: ['Parcours D1 → L9 complet', 'Débrief vocal & validation', 'Synchronisation CRM existant', 'Routines essentielles'], cta: 'Commencer' },
  { n: 'Agence', p: 249, u: '/ mois HT · 5 sièges', d: 'Le poste de travail complet pour une agence.', f: ['Tout Overlay, plus :', 'CRM vendeur & acquéreur natif', 'Matching & kit marketing', '60 routines configurables', 'Marque agence & modèles'], cta: 'Réserver une démo', hi: true },
  { n: 'Réseau', p: 990, u: '/ mois HT + 149 € / agence', d: 'Gouvernance, marque et pilotage multi-sites.', f: ['Tout Agence, plus :', 'Console réseau & héritage', 'Coopération inter-agences', 'SSO, audit, budget IA', 'Accompagnement au déploiement'], cta: 'Parler à l’équipe' },
]

export function Pricing() {
  const [annual, setAnnual] = useState(true)
  return (
    <section id="tarifs" className="relative bg-ink px-4 py-32 md:px-10 md:py-44">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <Eyebrow>Tarifs</Eyebrow>
            <MaskLines className="display mt-6 text-5xl md:text-7xl" lines={[<>L’IA incluse.</>, <span className="italic text-champagne-300">Jamais en option.</span>]} />
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/10">
            {[[false, 'Mensuel'], [true, 'Annuel · −15 %']].map(([v, l]) => (
              <button key={String(v)} onClick={() => setAnnual(v as boolean)} className="relative rounded-full px-4 py-2 text-[13px]">
                {annual === v && <motion.span layoutId="billing" className="absolute inset-0 rounded-full bg-bone" transition={{ duration: 0.6, ease: EXPO }} />}
                <span className={`relative ${annual === v ? 'text-ink' : 'text-bone/70'}`}>{l as string}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.1}>
              <Bezel className={`h-full ${p.hi ? '!ring-champagne/40' : ''}`} coreClassName={`flex h-full flex-col p-8 ${p.hi ? 'bg-gradient-to-b from-champagne/[0.12] to-ink-800' : ''}`}>
                <div className="flex items-center justify-between"><span className="text-[15px] font-medium">{p.n}</span>{p.hi && <span className="eyebrow bg-champagne text-ink">Recommandé</span>}</div>
                <p className="mt-2 text-[13px] text-bone/55">{p.d}</p>
                <div className="mt-8 flex items-baseline gap-2">
                  <span className="relative inline-block overflow-hidden"><AnimatePresence mode="popLayout" initial={false}><motion.span key={String(annual)} initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ duration: 0.6, ease: EXPO }} className="display inline-block text-7xl">{Math.round(annual ? p.p * 0.85 : p.p)}</motion.span></AnimatePresence></span><span className="text-2xl text-bone/60">€</span>
                </div>
                <div className="text-[12px] text-mist">{p.u}</div>
                <ul className="mt-8 flex-1 space-y-3">
                  {p.f.map((f) => <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-bone/75"><Check size={15} className="mt-0.5 shrink-0 text-champagne" />{f}</li>)}
                </ul>
                <div className="mt-10"><Button variant={p.hi ? 'gold' : 'ghost'} href="#demo" className="w-full justify-between">{p.cta}</Button></div>
              </Bezel>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-[12px] text-mist">Tarifs indicatifs de lancement, à confirmer pendant le pilote. Dossiers vendeurs supplémentaires au-delà du forfait : 9 € HT.</p>
      </div>
    </section>
  )
}

const FAQ = [
  ['Faut-il abandonner notre CRM actuel ?', 'Non. Le mode Overlay se branche sur Apimo, Hektor ou Modelo : Jaspe lit vos biens et contacts, prépare et rédige, puis réécrit ce que vous validez. Vous pouvez migrer plus tard vers le CRM natif, sans ressaisie.'],
  ['Les textes et chiffres sont-ils fiables ?', 'Chaque chiffre est calculé hors génération de texte, daté et relié à sa source (DVF, INSEE, IGN, pièces du dossier). Une estimation affiche sa fourchette et ses limites ; un document manquant n’est jamais présenté comme « sans point bloquant ».'],
  ['Qu’est-ce qui part chez le client sans validation ?', 'Rien par défaut. Chaque routine a un niveau d’autonomie : automatique pour les tâches internes, validé par le conseiller pour tout ce qui sort de l’agence. Vous gardez la main sur les destinataires, les engagements et les dates.'],
  ['Et la conformité — RGPD, prospection, AI Act ?', 'Registre des consentements, opposition propagée à toutes les séquences, prospection sans démarchage téléphonique non consenti, images de valorisation étiquetées et original conservé, journal d’audit complet et hébergement européen.'],
  ['Combien de temps pour démarrer ?', 'Une agence est opérationnelle en une journée : connexion de l’agenda et du CRM, import de la marque, activation des routines essentielles. Un réseau se déploie par vagues d’agences pilotes.'],
]

export function Faq() {
  const [o, setO] = useState<number | null>(0)
  return (
    <section className="bg-ink px-4 pb-32 md:px-10 md:pb-44">
      <div className="mx-auto grid max-w-[1400px] gap-12 border-t border-white/[0.07] pt-24 md:grid-cols-12">
        <div className="md:col-span-4"><Eyebrow>Questions</Eyebrow><h2 className="display mt-6 text-5xl">Ce qu’on nous <span className="italic text-champagne-300">demande.</span></h2></div>
        <div className="md:col-span-7 md:col-start-6">
          {FAQ.map(([q, a], i) => (
            <div key={q} className="border-b border-white/[0.07]">
              <button onClick={() => setO(o === i ? null : i)} className="flex w-full items-center justify-between gap-6 py-6 text-left" aria-expanded={o === i}>
                <span className="text-lg md:text-xl">{q}</span>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-white/10 transition-transform duration-500 ease-silk ${o === i ? 'rotate-45 bg-champagne text-ink' : ''}`}><Plus size={15} /></span>
              </button>
              <AnimatePresence initial={false}>
                {o === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.5, ease: EXPO }} className="overflow-hidden">
                    <p className="max-w-2xl pb-7 text-[15px] leading-relaxed text-bone/60">{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Cta() {
  const { theme } = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-12%', '12%'])
  const [sent, setSent] = useState<'idle' | 'sending' | 'ok' | 'local'>('idle')
  const [err, setErr] = useState('')
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    setSent('sending'); setErr('')
    try { await action('lead.create', f); setSent('ok') }
    catch (x) { if (x instanceof ApiError) { setErr(x.message); setSent('idle') } else setSent('local') }
  }
  return (
    <section id="demo" ref={ref} className="relative overflow-hidden px-4 py-32 md:px-10 md:py-48">
      <motion.img src={img(theme === 'light' ? 'pool-sea' : 'villa-night')} alt="" style={{ y }} className="absolute inset-0 h-[124%] w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/60" />
      <div className="relative mx-auto grid max-w-[1400px] gap-14 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <MaskLines className="display text-[14vw] leading-[0.9] md:text-[7.5vw]" lines={[<>Prenez une</>, <>longueur</>, <span className="italic text-champagne-300">d’avance.</span>]} />
          <p className="mt-8 max-w-md text-[15px] text-bone/70">30 minutes, sur vos propres biens. Nous préparons un vrai brief de rendez-vous sur une adresse de votre choix.</p>
        </div>
        <div className="md:col-span-5">
          <div className="glass rounded-[2rem] p-2 ring-1 ring-white/10">
            <div className="rounded-[1.6rem] bg-ink/60 p-6 md:p-8">
              <AnimatePresence mode="wait">
                {sent === 'ok' || sent === 'local' ? (
                  <motion.div key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-10 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-champagne text-ink"><Check size={24} /></span>
                    <div className="display mt-6 text-4xl">Merci.</div>
                    <p className="mt-2 text-[14px] text-bone/60">{sent === 'ok' ? 'Votre demande est enregistrée : un conseiller vous rappelle sous 2 h ouvrées.' : 'Serveur injoignable : rien n’a été transmis, réessayez plus tard.'}</p>
                  </motion.div>
                ) : (
                  <motion.form key="f" onSubmit={submit} className="space-y-3">
                    {[['Nom complet', 'text', 'name'], ['E-mail professionnel', 'email', 'email'], ['Agence ou réseau', 'text', 'org']].map(([l, t, n]) => (
                      <label key={n} className="block">
                        <span className="mb-1.5 block text-[11px] uppercase tracking-eyebrow text-mist">{l}</span>
                        <input required type={t} name={n} autoComplete={n === 'org' ? 'organization' : n} className="w-full rounded-xl bg-white/[0.04] px-4 py-3 text-[15px] text-bone outline-none ring-1 ring-white/10 transition placeholder:text-mist focus:ring-champagne/60" />
                      </label>
                    ))}
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] uppercase tracking-eyebrow text-mist">Taille</span>
                      <select name="size" className="w-full rounded-xl bg-white/[0.04] px-4 py-3 text-[15px] text-bone outline-none ring-1 ring-white/10 focus:ring-champagne/60">
                        {['1 agence', '2 à 5 agences', '6 à 30 agences', 'Plus de 30 agences'].map((s) => <option key={s} className="bg-ink">{s}</option>)}
                      </select>
                    </label>
                    {err && <p role="alert" className="text-[12.5px] text-coral">{err}</p>}
                    <div className="pt-3"><Magnetic className="w-full"><Button type="submit" size="lg" className="w-full justify-between">{sent === 'sending' ? 'Envoi…' : 'Réserver ma démonstration'}</Button></Magnetic></div>
                    <p className="flex items-center gap-2 pt-1 text-[11px] text-mist"><ShieldCheck size={13} /> Hébergement européen · aucune revente de données</p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink px-4 pb-8 pt-24 md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-12 border-b border-white/[0.07] pb-16 md:grid-cols-12">
          <div className="md:col-span-4"><Logo /><p className="mt-5 max-w-xs text-[13px] leading-relaxed text-mist">Le copilote proactif des agences et réseaux immobiliers. Conçu sur la Côte d’Azur.</p></div>
          {([['Produit', [['Parcours vendeur', '#parcours'], ['CRM & dossiers', '/app/dossiers'], ['Automatisations', '#automatisations'], ['Console réseau', '/app/pilotage'], ['Messagerie & WhatsApp', '/app/messages']]], ['Découvrir', [['Portail · tous les accès', '/portail'], ['Offre Essentiel', '/essentiel'], ['CRM Essentiel', '/essentiel/app'], ['Tutoriels', '/app/aide'], ['Étude & benchmark', '/app/etude']]], ['Ressources', [['Tarifs', '#tarifs'], ['Questions fréquentes', '#demo'], ['Feuille de route', '/app/idees']]]] as const).map(([t, l]) => (
            <div key={t} className="md:col-span-2">
              <div className="text-[11px] uppercase tracking-eyebrow text-mist">{t}</div>
              <ul className="mt-4 space-y-2.5">{l.map(([x, h]) => <li key={x}><a href={h} {...(h.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})} className="text-[14px] text-bone/70 transition hover:text-champagne-300">{x}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <Reveal y={80}>
          <div className="display select-none py-6 text-center text-[23vw] leading-[0.8] text-bone/[0.06]">Jas<span className="italic">pe</span></div>
        </Reveal>
        <div className="flex flex-col justify-between gap-3 text-[12px] text-mist md:flex-row">
          <span>© 2026 Jaspe. Démonstrateur — données synthétiques.</span>
          <span>Mentions légales · Confidentialité · Cookies essentiels uniquement</span>
        </div>
      </div>
    </footer>
  )
}
