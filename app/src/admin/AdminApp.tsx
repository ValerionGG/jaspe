// Back-office de la plateforme Jaspe : réservé aux administrateurs (JASPE_ADMIN_EMAILS ou promus).
import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { ChartPieSlice, Buildings, SealCheck, Tag, PuzzlePiece, UserGear, ListBullets, ArrowLeft, ShieldWarning } from '@phosphor-icons/react'
import { useMe } from '../data/store'
import { EXPO } from '../ui/kit'
import { ThemeToggle } from '../ui/theme'
import { Toaster } from '../crm/forms'
import { Card } from '../crm/ui'
import Overview from './pages/Overview'
import Orgs from './pages/Orgs'
import OrgPage from './pages/OrgDetail'
import Tarifs from './pages/Tarifs'
import Modules from './pages/Modules'
import Admins from './pages/Admins'
import Journal from './pages/Journal'

const NAV = [
  { to: '', label: 'Vue d’ensemble', icon: ChartPieSlice, end: true },
  { to: 'agences', label: 'Agences', icon: Buildings },
  { to: 'verifications', label: 'Vérifications', icon: SealCheck },
  { to: 'tarifs', label: 'Tarifs & offres', icon: Tag },
  { to: 'modules', label: 'Modules', icon: PuzzlePiece },
  { to: 'administrateurs', label: 'Administrateurs', icon: UserGear },
  { to: 'journal', label: 'Journal', icon: ListBullets },
]

function Denied({ anonymous }: { anonymous: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 text-bone">
      <div className="w-full max-w-lg">
        <Card>
          <ShieldWarning size={28} weight="light" className="text-champagne-300" />
          <h1 className="display mt-3 text-3xl">Accès réservé aux administrateurs de la plateforme</h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-bone/60">
            Le back-office de Jaspe n’est ouvert qu’aux comptes administrateurs, en mode comptes (serveur lancé avec <code className="rounded bg-white/[0.06] px-1">JASPE_AUTH=1</code>).
            Un compte devient administrateur si son e-mail figure dans la variable d’environnement <code className="rounded bg-white/[0.06] px-1">JASPE_ADMIN_EMAILS</code> du serveur
            (liste séparée par des virgules), ou s’il a été promu par un administrateur existant.
          </p>
          <p className="mt-2 text-[12.5px] text-mist">La version de démonstration et la version statique n’ont pas de back-office.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {anonymous && <Link to="/connexion?next=%2Fadmin" className="inline-flex items-center rounded-full bg-champagne px-4 py-2 text-[13px] font-medium text-ink transition hover:bg-champagne-300">Se connecter</Link>}
            <Link to="/app" className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-bone/85 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08]"><ArrowLeft size={14} />Retour à mon agence</Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Sidebar() {
  return (
    <aside className="theme-azur border-white/[0.06] bg-ink-850/95 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-[240px] lg:flex-col lg:border-r">
      <div className="flex h-16 items-center px-5">
        <Link to="/admin" className="text-[15px] font-medium tracking-[-0.01em]">Jaspe <span className="text-mist">·</span> <span className="font-serif text-[17px] italic text-champagne-300">Back-office</span></Link>
        <span className="ml-auto lg:hidden"><ThemeToggle /></span>
      </div>
      <nav className="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-y-auto">
        {NAV.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => clsx('relative flex shrink-0 items-center gap-3 rounded-xl px-3 py-[7px] text-[13.5px] transition-colors duration-300', isActive ? 'text-bone' : 'text-bone/55 hover:text-bone')}>
            {({ isActive }) => (
              <>
                {isActive && <motion.span layoutId="adminNav" className="absolute inset-0 rounded-xl bg-white/[0.06] ring-1 ring-white/[0.08]" transition={{ duration: 0.5, ease: EXPO }} />}
                <it.icon size={18} weight={isActive ? 'regular' : 'light'} className={clsx('relative', isActive && 'text-champagne-300')} />
                <span className="relative">{it.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="hidden border-t border-white/[0.06] p-3 lg:block">
        <div className="mb-2 flex items-center justify-between px-3"><span className="text-[11px] text-mist">Thème</span><ThemeToggle /></div>
        <Link to="/app" className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] text-bone/70 transition hover:bg-white/[0.04] hover:text-bone"><ArrowLeft size={15} />Retour à mon agence</Link>
      </div>
    </aside>
  )
}

export default function AdminApp() {
  const me = useMe()
  const loc = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [loc.pathname])
  useEffect(() => { document.title = 'Back-office · Jaspe' }, [])
  if (!me) return <div className="h-screen bg-ink" />
  if (me.mode !== 'auth' || !me.admin) return <Denied anonymous={me.mode === 'anonymous'} />
  return (
    <div className="min-h-screen bg-ink text-bone">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(1200px_600px_at_80%_-10%,var(--halo-a),transparent_60%)]" />
      <Sidebar />
      <div className="relative lg:pl-[240px]">
        <main className="mx-auto max-w-[1400px] px-4 pb-20 pt-8 md:px-8">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="agences" element={<Orgs />} />
            <Route path="agences/:id" element={<OrgPage />} />
            <Route path="verifications" element={<Orgs pendingOnly />} />
            <Route path="tarifs" element={<Tarifs />} />
            <Route path="modules" element={<Modules />} />
            <Route path="administrateurs" element={<Admins />} />
            <Route path="journal" element={<Journal />} />
          </Routes>
          <Link to="/app" className="mt-10 inline-flex items-center gap-2 text-[13px] text-mist hover:text-bone lg:hidden"><ArrowLeft size={14} />Retour à mon agence</Link>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
