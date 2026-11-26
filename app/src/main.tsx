import { StrictMode, lazy, Suspense, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Landing from './landing/Landing'

// Version statique en ligne : routes par ancre (#/app) car aucun serveur ne réécrit les URL.
const Router = import.meta.env.VITE_STATIC === '1' ? HashRouter : BrowserRouter
if (import.meta.env.VITE_STATIC === '1') {
  // Liens internes écrits en chemins absolus (« /app », « /#tarifs ») et ancres de section (« #parcours ») :
  // traduits pour le routeur par ancre de la version statique.
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest('a')
    const href = a?.getAttribute('href')
    if (!a || !href || a.target === '_blank' || e.metaKey || e.ctrlKey) return
    if (href.startsWith('#') && !href.startsWith('#/')) {
      e.preventDefault()
      document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    } else if (href.startsWith('/') && !href.startsWith('//') && !/^\/(img|research|api)\//.test(href)) {
      e.preventDefault()
      const [path, frag] = href.split('#')
      location.hash = `#${path || '/'}`
      if (frag) setTimeout(() => document.getElementById(frag)?.scrollIntoView({ behavior: 'smooth' }), 400)
    }
  }, true)
}

const CrmApp = lazy(() => import('./crm/CrmApp'))
const AdminApp = lazy(() => import('./admin/AdminApp'))
const Essentiel = lazy(() => import('./landing/Essentiel'))
const Portail = lazy(() => import('./landing/Portail'))
const Tarifs = lazy(() => import('./landing/Tarifs'))
const Connexion = lazy(() => import('./landing/Compte').then((m) => ({ default: m.Connexion })))
const Inscription = lazy(() => import('./landing/Compte').then((m) => ({ default: m.Inscription })))
const Invitation = lazy(() => import('./landing/Compte').then((m) => ({ default: m.Invitation })))
const DepotClient = lazy(() => import('./landing/DepotClient'))
const MotDePasseOublie = lazy(() => import('./landing/Compte').then((m) => ({ default: m.MotDePasseOublie })))
const Reinitialiser = lazy(() => import('./landing/Compte').then((m) => ({ default: m.Reinitialiser })))
const page = (el: ReactNode) => <Suspense fallback={<div className="h-screen bg-ink" />}>{el}</Suspense>

/** Entrée de l’édition Essentiel du CRM : mémorise l’édition puis ouvre le CRM. */
function EssentielApp() {
  try { localStorage.setItem('nxt-edition', 'essentiel') } catch { /* indisponible */ }
  return <Navigate to="/app" replace />
}

// Une seule racine, même après un rechargement à chaud de ce module.
const w = window as unknown as { __nxtRoot?: ReturnType<typeof createRoot> }
;(w.__nxtRoot ??= createRoot(document.getElementById('root')!)).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/essentiel/app" element={<EssentielApp />} />
        <Route path="/portail" element={<Suspense fallback={<div className="h-screen bg-ink" />}><Portail /></Suspense>} />
        <Route path="/essentiel" element={<Suspense fallback={<div className="h-screen bg-ink" />}><Essentiel /></Suspense>} />
        <Route path="/tarifs" element={page(<Tarifs />)} />
        <Route path="/connexion" element={page(<Connexion />)} />
        <Route path="/inscription" element={page(<Inscription />)} />
        <Route path="/invitation/:token" element={page(<Invitation />)} />
        <Route path="/depot/:token" element={page(<DepotClient />)} />
        <Route path="/mot-de-passe-oublie" element={page(<MotDePasseOublie />)} />
        <Route path="/reinitialiser/:token" element={page(<Reinitialiser />)} />
        <Route path="/app/*" element={<Suspense fallback={<div className="h-screen bg-ink" />}><CrmApp /></Suspense>} />
        <Route path="/admin/*" element={page(<AdminApp />)} />
      </Routes>
    </Router>
  </StrictMode>,
)
