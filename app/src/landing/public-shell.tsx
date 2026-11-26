import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '../ui/theme'
import { Logo } from './chrome'

/** Cadre commun des pages publiques courtes (tarifs, connexion, inscription, invitation). */
export function PublicShell({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => { document.title = `${title} — Jaspe` }, [title])
  return (
    <div className="min-h-screen bg-ink text-bone">
      <header className="flex justify-center px-3 pt-3 md:pt-5">
        <nav className="flex w-full max-w-[1200px] items-center justify-between gap-2 rounded-full py-1.5 pl-4 pr-1.5">
          <Link to="/" aria-label="Jaspe — accueil"><Logo /></Link>
          <div className="flex items-center gap-1">
            <Link to="/tarifs" className="rounded-full px-3 py-2 text-[13px] text-bone/70 transition hover:bg-white/[0.06] hover:text-bone">Tarifs</Link>
            <Link to="/connexion" className="rounded-full px-3 py-2 text-[13px] text-bone/70 transition hover:bg-white/[0.06] hover:text-bone">Connexion</Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="mt-10 border-t border-white/[0.07] px-5 py-10 md:px-10">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 text-[12.5px] text-mist md:flex-row md:items-center md:justify-between">
          <span>© 2026 Jaspe · Le copilote des conseillers immobiliers.</span>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-bone/65">
            <Link to="/" className="hover:text-champagne-300">Présentation</Link>
            <Link to="/tarifs" className="hover:text-champagne-300">Tarifs</Link>
            <Link to="/inscription" className="hover:text-champagne-300">Créer un compte</Link>
            <Link to="/app" className="hover:text-champagne-300">Démo</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
