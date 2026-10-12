import { Routes, Route, NavLink, useLocation, useNavigate, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, lazy, Suspense, type ComponentType } from 'react'
import clsx from 'clsx'
import {
  House, Sparkle, CalendarBlank, CheckSquare, Kanban, Buildings, UsersThree, AddressBook, Handshake, PenNib, ChartLineUp, MapTrifold,
  ChartBar, Lightning, Target, GearSix, MagnifyingGlass, CaretUpDown, SidebarSimple, ArrowLeft, Lightbulb, BookOpenText, ChatsCircle, GraduationCap,
} from '@phosphor-icons/react'
import { Logo } from '../landing/chrome'
import { Avatar, EXPO } from '../ui/kit'
import { me } from '../data/mock'
import { IconBtn } from './ui'
import { CommandPalette } from './CommandPalette'
import { CopilotDrawer } from './Copilot'
import { ThemeToggle } from '../ui/theme'
import { Bootstrap, ApiStatus, NotificationsMenu } from './Notifications'
import { Toaster } from './forms'
import { TourHost } from './tour/Tour'
import { useConversations, useQueue, useDossiers } from '../data/collections'

const page = (f: () => Promise<{ default: ComponentType }>) => lazy(f)
const P = {
  today: page(() => import('./pages/Today')),
  agenda: page(() => import('./pages/Agenda')),
  taches: page(() => import('./pages/Taches')),
  dossiers: page(() => import('./pages/Dossiers')),
  dossier: page(() => import('./pages/DossierDetail')),
  biens: page(() => import('./pages/Biens')),
  acquereurs: page(() => import('./pages/Acquereurs')),
  contacts: page(() => import('./pages/Contacts')),
  transactions: page(() => import('./pages/Transactions')),
  studio: page(() => import('./pages/Studio')),
  marche: page(() => import('./pages/Marche')),
  prospection: page(() => import('./pages/Prospection')),
  pilotage: page(() => import('./pages/Pilotage')),
  automatisations: page(() => import('./pages/Automatisations')),
  coaching: page(() => import('./pages/Coaching')),
  idees: page(() => import('./pages/Idees')),
  reglages: page(() => import('./pages/Reglages')),
  etude: page(() => import('./pages/Etude')),
  messages: page(() => import('./pages/Messages')),
  aide: page(() => import('./pages/Aide')),
}

export const NAV = [
  { group: 'Travail', items: [
    { to: '', label: 'Aujourd’hui', icon: House, end: true },
    { to: 'agenda', label: 'Agenda', icon: CalendarBlank },
    { to: 'messages', label: 'Messagerie', icon: ChatsCircle },
    { to: 'taches', label: 'Tâches & validations', icon: CheckSquare },
  ] },
  { group: 'Portefeuille', items: [
    { to: 'dossiers', label: 'Dossiers vendeurs', icon: Kanban },
    { to: 'biens', label: 'Biens', icon: Buildings },
    { to: 'acquereurs', label: 'Acquéreurs', icon: UsersThree },
    { to: 'contacts', label: 'Contacts', icon: AddressBook },
    { to: 'transactions', label: 'Transactions', icon: Handshake },
  ] },
  { group: 'Production', items: [
    { to: 'studio', label: 'Studio livrables', icon: PenNib },
    { to: 'marche', label: 'Marché & estimation', icon: ChartLineUp },
    { to: 'prospection', label: 'Prospection', icon: MapTrifold },
  ] },
  { group: 'Pilotage', items: [
    { to: 'pilotage', label: 'Agence & réseau', icon: ChartBar },
    { to: 'automatisations', label: 'Automatisations', icon: Lightning },
    { to: 'coaching', label: 'Coaching', icon: Target },
    { to: 'idees', label: 'Feuille de route', icon: Lightbulb },
    { to: 'etude', label: 'Étude & benchmark', icon: BookOpenText },
    { to: 'aide', label: 'Aide & tutoriels', icon: GraduationCap },
  ] },
]

/** Mode simple : navigation réduite à l’essentiel du conseiller (mémorisé localement). */
const SIMPLE = new Set(['', 'messages', 'agenda', 'taches', 'dossiers', 'biens', 'acquereurs', 'studio', 'aide'])
function useSimpleMode() {
  const [simple, set] = useState(() => { try { return localStorage.getItem('nxt-simple') === '1' } catch { return false } })
  const toggle = () => set((v) => { try { localStorage.setItem('nxt-simple', v ? '0' : '1') } catch { /* indisponible */ } return !v })
  return { simple, toggle }
}

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const [convs] = useConversations()
  const [queue] = useQueue()
  const [dossiers] = useDossiers()
  const { simple, toggle } = useSimpleMode()
  const badges: Record<string, number> = {
    messages: convs.reduce((n, c) => n + (c.unread ?? 0), 0),
    taches: queue.length,
    studio: dossiers.reduce((n, d) => n + Object.values(d.deliverables ?? {}).filter((x) => x === 'review').length, 0),
  }
  return (
    <aside className={clsx('theme-azur fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/[0.06] bg-ink-850/95 transition-[width] duration-500 ease-silk lg:flex', collapsed ? 'w-[76px]' : 'w-[256px]')}>
      <div className={clsx('flex h-16 items-center', collapsed ? 'justify-center' : 'justify-between px-5')}>
        <Link to="/" title="Retour au site">{collapsed ? <Logo className="[&>span:last-child]:hidden" /> : <Logo />}</Link>
        {!collapsed && <IconBtn label="Réduire" onClick={onToggle}><SidebarSimple size={16} weight="light" /></IconBtn>}
      </div>
      {!collapsed && (
        <button className="mx-3 mb-2 flex items-center gap-3 rounded-2xl bg-white/[0.03] p-2.5 text-left ring-1 ring-white/[0.06] transition hover:bg-white/[0.05]">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-champagne to-champagne-700 font-serif text-[15px] italic text-ink">A</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-[13px]">Antibes Vieille-Ville</span><span className="block text-[11px] text-mist">Réseau Riviera · 6 agences</span></span>
          <CaretUpDown size={14} className="text-mist" />
        </button>
      )}
      <nav className="thin-scroll flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((g) => ({ ...g, items: g.items.filter((it) => !simple || SIMPLE.has(it.to)) })).filter((g) => g.items.length).map((g) => (
          <div key={g.group} className="mb-3">
            {!collapsed && <div className="mb-1.5 px-3 text-[10px] uppercase tracking-eyebrow text-mist-600">{g.group}</div>}
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} end={'end' in it} title={it.label} data-tour={`nav-${it.to || 'today'}`} className={({ isActive }) => clsx('group relative flex items-center gap-3 rounded-xl py-[7px] text-[13.5px] transition-colors duration-300', collapsed ? 'justify-center px-0' : 'px-3', isActive ? 'text-bone' : 'text-bone/55 hover:text-bone')}>
                {({ isActive }) => (
                  <>
                    {isActive && <motion.span layoutId="navActive" className="absolute inset-0 rounded-xl bg-white/[0.06] ring-1 ring-white/[0.08]" transition={{ duration: 0.5, ease: EXPO }} />}
                    {isActive && <motion.span layoutId="navBar" className="absolute -left-3 top-2 h-5 w-[3px] rounded-r bg-champagne" transition={{ duration: 0.5, ease: EXPO }} />}
                    <it.icon size={18} weight={isActive ? 'regular' : 'light'} className={clsx('relative', isActive && 'text-champagne-300')} />
                    {!collapsed && <span className="relative flex-1">{it.label}</span>}
                    {!collapsed && badges[it.to] > 0 && <span className="num relative rounded-full bg-champagne/15 px-1.5 text-[10.5px] text-champagne-300">{badges[it.to]}</span>}
                    {collapsed && badges[it.to] > 0 && <span className="absolute right-3 top-1.5 h-2 w-2 rounded-full bg-champagne" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/[0.06] p-3">
        {!collapsed && (
          <button onClick={toggle} data-tour="simple-mode" className="mb-2 flex w-full items-center justify-between rounded-xl px-3 py-2 text-[12px] text-bone/60 transition hover:bg-white/[0.04] hover:text-bone" aria-pressed={simple}>
            <span>{simple ? 'Mode simple' : 'Mode complet'}</span>
            <span className={clsx('relative h-4 w-7 rounded-full transition-colors', simple ? 'bg-champagne' : 'bg-white/15')}><span className={clsx('absolute top-0.5 h-3 w-3 rounded-full bg-bone transition-all duration-300', simple ? 'left-3.5' : 'left-0.5')} /></span>
          </button>
        )}
        <NavLink to="reglages" className={clsx('flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/[0.04]', collapsed && 'justify-center')}>
          <Avatar src={me.photo} size={32} />
          {!collapsed && <span className="min-w-0 flex-1"><span className="block truncate text-[13px]">{me.name}</span><span className="block text-[11px] text-mist">{me.role}</span></span>}
          {!collapsed && <GearSix size={16} className="text-mist" />}
        </NavLink>
        {collapsed && <button onClick={onToggle} className="mt-2 flex w-full justify-center rounded-xl p-2 text-mist hover:text-bone" aria-label="Déplier"><SidebarSimple size={16} /></button>}
      </div>
    </aside>
  )
}

function Topbar({ onSearch, onCopilot, copilot }: { onSearch: () => void; onCopilot: () => void; copilot: boolean }) {
  const loc = useLocation()
  const nav = useNavigate()
  const deep = loc.pathname.split('/').filter(Boolean).length > 2
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.05] bg-ink/75 px-4 backdrop-blur-xl md:px-8">
      {deep ? <IconBtn label="Retour" onClick={() => nav(-1)}><ArrowLeft size={16} /></IconBtn> : <span className="lg:hidden"><Logo /></span>}
      <button onClick={onSearch} data-tour="search" className="ml-auto flex items-center gap-2 rounded-full bg-white/[0.03] px-3.5 py-2 text-[12.5px] text-mist ring-1 ring-white/[0.06] transition hover:text-bone md:w-80">
        <MagnifyingGlass size={14} /><span className="hidden md:inline">Biens, contacts, dossiers, actions…</span><kbd className="num ml-auto hidden rounded bg-white/[0.06] px-1.5 text-[10px] md:inline">⌘K</kbd>
      </button>
      <ApiStatus />
      <ThemeToggle />
      <NotificationsMenu />
      <button onClick={onCopilot} data-tour="copilot" className={clsx('group flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-[13px] ring-1 transition-all duration-500 ease-silk', copilot ? 'bg-champagne text-ink ring-champagne' : 'bg-white/[0.04] ring-white/10 hover:bg-white/[0.08]')}>
        <span className={clsx('flex h-6 w-6 items-center justify-center rounded-full', copilot ? 'bg-ink/10' : 'bg-champagne/20 text-champagne-300')}><Sparkle size={13} weight="fill" /></span>Copilote
      </button>
    </header>
  )
}

function MobileNav() {
  const items = [NAV[0].items[0], NAV[0].items[1], NAV[1].items[0], NAV[2].items[0], NAV[0].items[3]]
  return (
    <nav className="glass fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-full p-1.5 ring-1 ring-white/10 lg:hidden">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.to === ''} className={({ isActive }) => clsx('flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px]', isActive ? 'bg-white/10 text-champagne-300' : 'text-bone/60')}>
          <it.icon size={19} weight="light" />{it.label.split(' ')[0]}
        </NavLink>
      ))}
    </nav>
  )
}

export default function CrmApp() {
  const [collapsed, setCollapsed] = useState(false)
  const [palette, setPalette] = useState(false)
  const [copilot, setCopilot] = useState(false)
  const loc = useLocation()
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((v) => !v) } if (e.key === 'Escape') { setPalette(false) } }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  // Toute page peut ouvrir le copilote : window.dispatchEvent(new Event('nxt:copilot'))
  useEffect(() => { const o = () => setCopilot(true); window.addEventListener('nxt:copilot', o); return () => window.removeEventListener('nxt:copilot', o) }, [])
  return (
    <div className="min-h-screen bg-ink text-bone">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(1200px_600px_at_80%_-10%,var(--halo-a),transparent_60%),radial-gradient(900px_500px_at_0%_110%,var(--halo-b),transparent_60%)]" />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={clsx('relative transition-[padding] duration-500 ease-silk', collapsed ? 'lg:pl-[76px]' : 'lg:pl-[256px]', copilot && 'xl:pr-[400px]')}>
        <Topbar onSearch={() => setPalette(true)} onCopilot={() => setCopilot(!copilot)} copilot={copilot} />
        <main className="mx-auto max-w-[1500px] px-4 pb-28 pt-8 md:px-8 lg:pb-16">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white/[0.02]" />}>
            <AnimatePresence mode="wait">
              <motion.div key={loc.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <Routes location={loc}>
                  <Route index element={<P.today />} />
                  <Route path="agenda" element={<P.agenda />} />
                  <Route path="taches" element={<P.taches />} />
                  <Route path="dossiers" element={<P.dossiers />} />
                  <Route path="dossiers/:id" element={<P.dossier />} />
                  <Route path="biens" element={<P.biens />} />
                  <Route path="acquereurs" element={<P.acquereurs />} />
                  <Route path="contacts" element={<P.contacts />} />
                  <Route path="transactions" element={<P.transactions />} />
                  <Route path="studio" element={<P.studio />} />
                  <Route path="marche" element={<P.marche />} />
                  <Route path="prospection" element={<P.prospection />} />
                  <Route path="pilotage" element={<P.pilotage />} />
                  <Route path="automatisations" element={<P.automatisations />} />
                  <Route path="coaching" element={<P.coaching />} />
                  <Route path="idees" element={<P.idees />} />
                  <Route path="reglages" element={<P.reglages />} />
                  <Route path="etude" element={<P.etude />} />
                  <Route path="messages" element={<P.messages />} />
                  <Route path="aide" element={<P.aide />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>
      <Bootstrap />
      <TourHost />
      <Toaster />
      <MobileNav />
      <CommandPalette open={palette} onClose={() => setPalette(false)} onCopilot={() => { setPalette(false); setCopilot(true) }} />
      <CopilotDrawer open={copilot} onClose={() => setCopilot(false)} />
    </div>
  )
}
