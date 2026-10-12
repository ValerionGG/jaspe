import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import {
  House, CalendarBlank, ChatsCircle, CheckSquare, Kanban, Buildings, UsersThree, AddressBook, Handshake, PenNib, ChartLineUp, MapTrifold,
  ChartBar, Lightning, Target, Lightbulb, BookOpenText, GraduationCap, GearSix, MagnifyingGlass, ArrowUpRight, Sparkle, ArrowCounterClockwise, Play, Storefront, Crown,
} from '@phosphor-icons/react'
import { Logo } from './chrome'
import { ThemeToggle } from '../ui/theme'
import { EXPO, Eyebrow } from '../ui/kit'
import { img } from '../data/mock'

type Shortcut = { to: string; label: string; hint: string; icon: typeof House; group: string; keys?: string }
const CRM: Shortcut[] = [
  { to: '/app', label: 'Aujourd’hui', hint: 'Brief, agenda, priorités', icon: House, group: 'Travail' },
  { to: '/app/messages', label: 'Messagerie', hint: 'WhatsApp, e-mail, SMS, équipe', icon: ChatsCircle, group: 'Travail' },
  { to: '/app/agenda', label: 'Agenda', hint: 'RDV, visites, rappels J-1/H-2', icon: CalendarBlank, group: 'Travail' },
  { to: '/app/taches', label: 'Tâches & validations', hint: 'Tout ce qui attend une décision', icon: CheckSquare, group: 'Travail' },
  { to: '/app/dossiers', label: 'Dossiers vendeurs', hint: 'Pipeline glisser-déposer', icon: Kanban, group: 'Portefeuille' },
  { to: '/app/dossiers/d1', label: 'Dossier Martin', hint: 'Stepper D1 → après-vente', icon: Crown, group: 'Portefeuille' },
  { to: '/app/biens', label: 'Biens', hint: 'Grille, carte, diffusion', icon: Buildings, group: 'Portefeuille' },
  { to: '/app/acquereurs', label: 'Acquéreurs', hint: 'Matching expliqué', icon: UsersThree, group: 'Portefeuille' },
  { to: '/app/contacts', label: 'Contacts', hint: 'Consentements RGPD', icon: AddressBook, group: 'Portefeuille' },
  { to: '/app/transactions', label: 'Transactions', hint: 'Offre → compromis → acte', icon: Handshake, group: 'Portefeuille' },
  { to: '/app/studio', label: 'Studio livrables', hint: 'L1 → L9, validation, envois', icon: PenNib, group: 'Production' },
  { to: '/app/marche', label: 'Marché & estimation', hint: 'Comparables DVF, fourchette', icon: ChartLineUp, group: 'Production' },
  { to: '/app/prospection', label: 'Prospection', hint: 'Secteurs, signaux, L5', icon: MapTrifold, group: 'Production' },
  { to: '/app/pilotage', label: 'Agence & réseau', hint: 'KPI, réunion du lundi', icon: ChartBar, group: 'Pilotage' },
  { to: '/app/automatisations', label: 'Automatisations', hint: '100+ routines, exécutions', icon: Lightning, group: 'Pilotage' },
  { to: '/app/coaching', label: 'Coaching', hint: 'Simulation D4, progression', icon: Target, group: 'Pilotage' },
  { to: '/app/idees', label: 'Feuille de route', hint: '398 idées priorisées', icon: Lightbulb, group: 'Pilotage' },
  { to: '/app/etude', label: 'Étude & benchmark', hint: '~55 concurrents, DA, motion', icon: BookOpenText, group: 'Pilotage' },
  { to: '/app/aide', label: 'Aide & tutoriels', hint: 'Leçons, glossaire, FAQ', icon: GraduationCap, group: 'Pilotage' },
  { to: '/app/reglages', label: 'Réglages', hint: 'Marque, équipe, intégrations', icon: GearSix, group: 'Pilotage' },
]

const HERO = [
  { to: '/', title: 'La vitrine', sub: 'Landing animée — clair « Calcaire & Azur » ou sombre « Nocturne Riviera »', photo: 'cap-villa-rocks', icon: Sparkle },
  { to: '/essentiel', title: 'Offre Essentiel', sub: 'Page commerciale simple, calculateur de temps gagné, essai 14 jours', photo: 'terrace-sea', icon: Storefront },
  { to: '/app', title: 'CRM complet', sub: 'Agences & réseaux : 20 espaces, automatisations, pilotage', photo: 'int-marble', icon: Crown },
  { to: '/essentiel/app', title: 'CRM Essentiel', sub: 'Version simplifiée pour le conseiller indépendant', photo: 'window-sea', icon: House },
]

export default function Portail() {
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const list = useMemo(() => { const n = q.trim().toLowerCase(); return n ? CRM.filter((s) => `${s.label} ${s.hint} ${s.group}`.toLowerCase().includes(n)) : CRM }, [q])
  const groups = [...new Set(list.map((s) => s.group))]
  const reset = () => {
    if (!confirm('Réinitialiser les données de démonstration de ce navigateur ?')) return
    try { Object.keys(localStorage).filter((k) => k.startsWith('nxt')).forEach((k) => localStorage.removeItem(k)) } catch { /* indisponible */ }
    location.reload()
  }
  const tour = () => { nav('/app'); setTimeout(() => window.dispatchEvent(new CustomEvent('nxt:tour', { detail: 'onboarding' })), 900) }

  return (
    <div className="grain min-h-screen bg-ink text-bone">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(1100px_600px_at_85%_-10%,var(--halo-a),transparent_60%),radial-gradient(900px_500px_at_0%_110%,var(--halo-b),transparent_60%)]" />
      <header className="relative mx-auto flex max-w-[1400px] items-center justify-between px-5 py-6 md:px-10">
        <Link to="/"><Logo /></Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <main className="relative mx-auto max-w-[1400px] px-5 pb-24 md:px-10">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EXPO }} className="pb-10 pt-6 md:pt-12">
          <Eyebrow>Portail · tous les accès</Eyebrow>
          <h1 className="display mt-5 text-6xl md:text-8xl">Tout NXT, <span className="italic text-champagne-300">en un geste.</span></h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-bone/60">La vitrine, l’offre commerciale, les deux éditions du CRM et chacun de ses espaces. Démonstration : les données sont synthétiques et restent dans votre navigateur.</p>
          <div className="mt-7 flex flex-wrap gap-2">
            <button onClick={tour} className="inline-flex items-center gap-2 rounded-full bg-champagne px-5 py-2.5 text-[13.5px] font-medium text-ink transition hover:bg-champagne-300"><Play size={14} weight="fill" /> Visite guidée (3 min)</button>
            <Link to="/app/aide" className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-5 py-2.5 text-[13.5px] ring-1 ring-white/10 transition hover:bg-white/[0.08]"><GraduationCap size={15} /> Tutoriels</Link>
            <button onClick={reset} className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-5 py-2.5 text-[13.5px] ring-1 ring-white/10 transition hover:bg-white/[0.08]"><ArrowCounterClockwise size={15} /> Réinitialiser la démo</button>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HERO.map((h, i) => (
            <motion.div key={h.to} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1 + i * 0.07, ease: EXPO }}>
              <Link to={h.to} data-cursor="Ouvrir" className="group relative block h-[340px] overflow-hidden rounded-[1.8rem] ring-1 ring-white/10">
                <img src={img(h.photo)} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-silk group-hover:scale-[1.06]" />
                <div className="theme-dark absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-ink via-ink/40 to-transparent p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bone/90 text-ink"><h.icon size={18} /></span>
                  <div>
                    <div className="flex items-center justify-between"><h2 className="display text-4xl text-bone">{h.title}</h2><ArrowUpRight size={20} className="text-bone transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" /></div>
                    <p className="mt-2 text-[13px] leading-snug text-bone/75">{h.sub}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <section className="mt-16">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <h2 className="display text-4xl md:text-5xl">Chaque espace <span className="italic text-champagne-300">du CRM</span></h2>
            <label className="flex w-full items-center gap-2 rounded-full bg-white/[0.04] px-4 py-2.5 ring-1 ring-white/10 focus-within:ring-champagne/50 md:w-80">
              <MagnifyingGlass size={15} className="text-mist" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer les raccourcis…" className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-mist" aria-label="Filtrer les raccourcis" />
            </label>
          </div>
          {groups.map((g) => (
            <div key={g} className="mb-8">
              <div className="mb-3 text-[10.5px] uppercase tracking-eyebrow text-mist">{g}</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {list.filter((s) => s.group === g).map((s) => (
                  <Link key={s.to} to={s.to} className="group flex items-center gap-4 rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.07] transition-all duration-500 ease-silk hover:-translate-y-0.5 hover:bg-white/[0.04] hover:ring-champagne/30">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-champagne/10 text-champagne-300 ring-1 ring-champagne/20 transition group-hover:bg-champagne group-hover:text-ink"><s.icon size={19} weight="light" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-[14px]">{s.label}</span><span className="block truncate text-[12px] text-mist">{s.hint}</span></span>
                    <ArrowUpRight size={15} className="shrink-0 text-mist transition group-hover:text-champagne-300" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {!list.length && <p className="text-[14px] text-mist">Aucun raccourci ne correspond.</p>}
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[['Raccourcis clavier', '⌘ K palette de commandes · ? aide · J / K naviguer · ⌘ ↵ envoyer un message'], ['Deux éditions', 'Complet pour les agences et réseaux ; Essentiel pour le conseiller indépendant, interface épurée.'], ['Données de démonstration', 'Synthétiques, stockées dans ce navigateur. Aucun envoi externe : WhatsApp, e-mail et portails sont consignés.']].map(([t, d]) => (
            <div key={t} className="rounded-[1.4rem] bg-white/[0.02] p-6 ring-1 ring-white/[0.07]"><div className="text-[14px] font-medium">{t}</div><p className="mt-2 text-[13px] leading-relaxed text-bone/60">{d}</p></div>
          ))}
        </section>
      </main>
    </div>
  )
}
