import { motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Check, Minus, Plus, ShieldCheck } from '@phosphor-icons/react'
import { Eyebrow, EXPO } from '../ui/kit'
import { PublicShell } from './public-shell'
import { In, card, micro } from './essentiel-sections'
import { PLANS, PLAN_OPTIONS, COMMITMENTS } from '../data/plans'

const COMPARE: [string, string, string][] = [
  ['Prix pour 7 conseillers', '49 € / mois', '350 à 1 050 € / mois'],
  ['Prix par conseiller', '7 € / mois', '50 à 150 € / mois'],
  ['Engagement', 'Aucun, résiliation en un clic', 'Variable, parfois annuel'],
  ['Rédaction des comptes rendus et livrables', 'Oui, à relire et valider', 'Variable selon l’éditeur'],
  ['Diffusion multiportail', 'Non : à garder dans votre outil actuel', 'Oui, en général'],
  ['Envoi réel des e-mails, SMS, signature', 'Pas encore : envois consignés', 'Oui, selon l’éditeur'],
]

const FAQ: [string, string][] = [
  ['Est-ce vraiment sans engagement ?', 'Oui. L’abonnement est mensuel (ou annuel pour Solo, si vous le choisissez). Vous résiliez vous-même depuis Réglages › Facturation, bouton « Gérer ou résilier » : un clic, sans appel ni courrier. L’accès payant reste ouvert jusqu’à la fin de la période réglée.'],
  ['Comment fonctionne le remboursement de 15 jours ?', 'Si Jaspe ne vous convient pas dans les 15 jours qui suivent votre premier paiement, la somme vous est remboursée en totalité. Pour l’instant, la demande est traitée à la main : envoyez-la depuis le bouton « retour » de l’application.'],
  ['Et la garantie « 2 h gagnées ou mois remboursé » ?', 'La page Temps gagné mesure chaque semaine le temps économisé, relecture et corrections déduites. Si un mois payé affiche moins de 2 h gagnées, ce mois vous est remboursé. Cette garantie est elle aussi traitée à la main pour l’instant, sur la base de l’export de la page Temps gagné.'],
  ['Que deviennent mes données si je résilie ou si un paiement échoue ?', 'Rien n’est supprimé. Votre agence repasse sur l’offre Découverte : vous gardez l’accès en lecture à tous vos dossiers, et un seul dossier actif reste modifiable. Il suffit de vous réabonner pour tout retrouver.'],
  ['Mes données sont-elles séparées de celles des autres agences ?', 'Oui. Chaque agence a sa propre base de données ; les conseillers invités n’accèdent qu’à celle de leur agence. Les mots de passe sont stockés hachés, jamais en clair.'],
  ['Qui encaisse le paiement ?', 'Stripe. Jaspe ne voit ni ne stocke votre numéro de carte. Les factures sont disponibles dans le portail Stripe, depuis Réglages › Facturation.'],
  ['Qu’est-ce qu’un dossier actif ?', 'Un dossier vendeur qui n’est pas arrivé à l’acte ni archivé. Les dossiers terminés ne comptent pas dans votre quota.'],
]

export default function Tarifs() {
  const [yearly, setYearly] = useState(false)
  const [open, setOpen] = useState<number | null>(0)
  return (
    <PublicShell title="Tarifs">
      <section className="px-5 pb-16 pt-16 md:px-10 md:pt-24">
        <div className="mx-auto max-w-[1200px]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EXPO }} className="max-w-2xl">
            <Eyebrow>Tarifs</Eyebrow>
            <h1 className="display mt-5 text-[2.6rem] leading-[1.02] sm:text-6xl">Commencez gratuitement. <span className="italic text-champagne-300">Payez quand vous gagnez du temps.</span></h1>
            <p className="mt-5 text-[15.5px] leading-relaxed text-bone/65">Trois offres, deux options, aucun frais caché. Tout se fait en ligne : inscription, paiement, ajout de sièges, résiliation.</p>
          </motion.div>
          <div className="mt-8 flex flex-wrap gap-2">{COMMITMENTS.map((c) => <span key={c} className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-[12.5px] text-bone/75 ring-1 ring-white/10"><ShieldCheck size={13} className="text-sage" />{c}</span>)}</div>

          <div className="mt-10 flex rounded-full bg-white/[0.04] p-1 ring-1 ring-white/10 sm:inline-flex">
            {([[false, 'Mensuel'], [true, 'Annuel (Solo)']] as const).map(([v, l]) => (
              <button key={l} onClick={() => setYearly(v)} aria-pressed={yearly === v} className="relative flex-1 rounded-full px-4 py-2 text-[13px]">
                {yearly === v && <motion.span layoutId="tarifs-period" className="absolute inset-0 rounded-full bg-bone" transition={{ duration: 0.5, ease: EXPO }} />}
                <span className={clsx('relative', yearly === v ? 'text-ink' : 'text-bone/70')}>{l}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {PLANS.map((p, i) => {
              const hi = p.id === 'solo'
              const showYear = yearly && p.yearly
              return (
                <In key={p.id} delay={i * 0.06} className={clsx(card, 'flex flex-col p-7', hi && 'ring-champagne/30')}>
                  <div className="flex items-center justify-between"><span className="text-[17px] font-medium">{p.name}</span>{hi && <span className="eyebrow bg-champagne text-ink">Le plus choisi</span>}</div>
                  <p className="mt-2 text-[13.5px] text-bone/60">{p.pitch}</p>
                  <div className="mt-7 flex items-baseline gap-2"><span className="display text-6xl">{showYear ? '99' : p.price}</span><span className="text-[14px] text-bone/60">{showYear ? '€ / an' : p.unit}</span></div>
                  <div className="mt-1 h-5 text-[12.5px] text-mist">{showYear ? 'soit 8,25 € / mois, deux mois offerts' : p.yearly ? `ou ${p.yearly}` : ''}</div>
                  <div className="mt-6 space-y-1 text-[13.5px]"><div className="text-bone">{p.dossiers}</div><div className="text-bone/60">{p.seats}</div></div>
                  <ul className="mt-6 flex-1 space-y-2.5">{p.features.map((f) => <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-bone/80"><Check size={14} className="mt-0.5 shrink-0 text-champagne" />{f}</li>)}</ul>
                  <Link to="/inscription" className={clsx('mt-8 rounded-full px-5 py-3 text-center text-[14px] font-medium transition', hi ? 'bg-champagne text-ink hover:bg-champagne-300' : 'bg-white/[0.04] text-bone ring-1 ring-white/10 hover:bg-white/[0.08]')}>
                    {p.id === 'decouverte' ? 'Créer mon compte gratuit' : `Commencer avec ${p.name}`}
                  </Link>
                </In>
              )
            })}
          </div>
          <p className="mt-4 text-[12px] text-mist">Prix hors taxes. Pour Solo et Agence, l’inscription se fait d’abord sur l’offre Découverte ; le paiement se règle ensuite dans Réglages › Facturation.</p>

          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
            {PLAN_OPTIONS.map((o) => (
              <In key={o.id} className={clsx(card, 'p-6')}>
                <div className="flex items-baseline justify-between gap-3"><span className="text-[15.5px] font-medium">Option {o.name}</span><span className="num text-[14px] text-champagne-300">{o.price}</span></div>
                <p className="mt-2 text-[13.5px] text-bone/65">{o.desc}</p>
                <p className="mt-2 text-[12px] text-mist">S’ajoute à Solo ou Agence.</p>
              </In>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-10">
        <div className="mx-auto max-w-[1200px]">
          <In className="max-w-2xl">
            <Eyebrow>Comparatif</Eyebrow>
            <h2 className="display mt-5 text-[2.3rem] sm:text-5xl">Face aux CRM <span className="italic text-champagne-300">à 50–150 € par agent.</span></h2>
            <p className="mt-5 text-[15px] leading-relaxed text-bone/65">Jaspe ne remplace pas tout. Il rédige, prépare et relance ; votre outil de diffusion reste utile. Voici la comparaison, y compris ce que nous ne faisons pas encore.</p>
          </In>
          <div className={clsx(card, 'mt-10 overflow-x-auto')}>
            <table className="w-full min-w-[560px] text-[13.5px]">
              <thead><tr className={micro}><th className="px-5 py-4 text-left font-normal" /><th className="px-5 py-4 text-left font-normal text-champagne-300">Jaspe Agence</th><th className="px-5 py-4 text-left font-normal">CRM immobilier classique</th></tr></thead>
              <tbody>
                {COMPARE.map(([k, a, b]) => (
                  <tr key={k} className="border-t border-white/[0.05]">
                    <td className="px-5 py-3.5 text-bone/70">{k}</td>
                    <td className="px-5 py-3.5"><span className="flex items-start gap-2">{a.startsWith('Non') || a.startsWith('Pas') ? <Minus size={14} className="mt-0.5 shrink-0 text-mist" /> : <Check size={14} className="mt-0.5 shrink-0 text-champagne" />}{a}</span></td>
                    <td className="px-5 py-3.5 text-bone/70">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12px] text-mist">Fourchette issue de notre étude concurrentielle de novembre 2026 ; les tarifs négociés varient.</p>
        </div>
      </section>

      <section className="px-5 py-16 md:px-10">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 md:grid-cols-[0.8fr_1.2fr]">
          <In><Eyebrow>Questions</Eyebrow><h2 className="display mt-5 text-[2.3rem] sm:text-5xl">Engagement, remboursement, <span className="italic text-champagne-300">données.</span></h2></In>
          <div>
            {FAQ.map(([q, a], i) => (
              <div key={q} className="border-b border-white/[0.07]">
                <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-6 py-5 text-left">
                  <span className="text-[16px]">{q}</span>
                  <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ring-white/10 transition-transform duration-500 ease-silk', open === i && 'rotate-45 bg-champagne text-ink')}><Plus size={14} /></span>
                </button>
                {open === i && <p className="pb-5 pr-12 text-[14.5px] leading-relaxed text-bone/65">{a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-10 pt-6 md:px-10">
        <In className={clsx(card, 'mx-auto flex max-w-[1200px] flex-col items-start gap-5 p-8 md:flex-row md:items-center md:justify-between')}>
          <div><div className="display text-[2rem]">Un vrai mandat, <span className="italic text-champagne-300">gratuitement.</span></div><p className="mt-1 text-[13.5px] text-bone/60">Sans carte bancaire. Passez à Solo ou Agence quand vous le décidez.</p></div>
          <Link to="/inscription" className="rounded-full bg-champagne px-6 py-3 text-[14px] font-medium text-ink transition hover:bg-champagne-300">Créer mon compte</Link>
        </In>
      </section>
    </PublicShell>
  )
}
