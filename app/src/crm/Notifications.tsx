import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Bell, Checks, Lightning } from '@phosphor-icons/react'
import { EXPO } from '../ui/kit'
import { IconBtn } from './ui'
import { action, useApiStatus } from '../data/store'
import { useNotifications, useRuns, useProperties, useAgents, useDossiers, useBuyers, useRoutines, useSettings } from '../data/collections'

const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000)
  return m < 1 ? 'à l’instant' : m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/** Monte les collections nécessaires au moteur (biens, conseillers…) pour qu’elles soient amorcées côté serveur. */
export function Bootstrap() {
  useProperties(); useAgents(); useDossiers(); useBuyers(); useRoutines(); useSettings()
  return null
}

export function ApiStatus() {
  const s = useApiStatus()
  const demo = import.meta.env.VITE_STATIC === '1'
  const label = demo ? 'Démo en ligne · données dans ce navigateur' : s === 'online' ? 'Synchronisé' : s === 'offline' ? 'Hors ligne · enregistré localement' : 'Connexion…'
  return (
    <span title={label} className="hidden items-center gap-2 rounded-full bg-white/[0.03] px-3 py-1.5 text-[11.5px] text-mist ring-1 ring-white/[0.06] xl:flex">
      <span className={clsx('h-1.5 w-1.5 rounded-full', s === 'online' || demo ? 'bg-sage' : s === 'offline' ? 'bg-coral' : 'animate-pulse bg-champagne')} />{label}
    </span>
  )
}

export function NotificationsMenu() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'notif' | 'runs'>('notif')
  const [items] = useNotifications()
  const [runs] = useRuns()
  const unread = items.filter((n) => !n.read).length
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])
  return (
    <div ref={ref} className="relative">
      <IconBtn label={`Notifications${unread ? ` (${unread} non lues)` : ''}`} onClick={() => setOpen(!open)} active={open}><Bell size={16} weight="light" /></IconBtn>
      {unread > 0 && <span className="num pointer-events-none absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-coral px-1 text-[10px] text-snow ring-2 ring-ink">{unread}</span>}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: EXPO }} className="absolute right-0 top-12 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-[1.4rem] bg-white/[0.03] p-1 shadow-float ring-1 ring-white/10 backdrop-blur-2xl">
            <div className="rounded-[1.2rem] bg-ink-800">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <div className="flex gap-1">{([['notif', `Notifications${unread ? ` · ${unread}` : ''}`], ['runs', 'Routines']] as const).map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={clsx('rounded-full px-3 py-1 text-[12px]', tab === k ? 'bg-white/[0.08] text-bone' : 'text-mist hover:text-bone')}>{l}</button>)}</div>
                {tab === 'notif' && unread > 0 && <button onClick={() => action('notifications.readAll')} className="flex items-center gap-1 text-[11.5px] text-champagne-300"><Checks size={13} />Tout lire</button>}
              </div>
              <div className="thin-scroll max-h-[60vh] overflow-y-auto p-2">
                {tab === 'notif' ? (items.length ? items.slice(0, 30).map((n) => (
                  <Link key={n.id} to={n.link ?? '#'} onClick={() => setOpen(false)} className="flex gap-3 rounded-xl p-3 transition hover:bg-white/[0.04]">
                    <span className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-white/15' : n.tone === 'warn' ? 'bg-coral' : n.tone === 'win' ? 'bg-sage' : 'bg-champagne')} />
                    <span className="min-w-0 flex-1"><span className="block text-[13px]">{n.title}</span><span className="block text-[12px] text-bone/55">{n.body}</span><span className="mt-0.5 block text-[10.5px] text-mist">{ago(n.at)}</span></span>
                  </Link>
                )) : <div className="p-8 text-center text-[13px] text-mist">Rien de nouveau. Les routines vous préviendront ici.</div>)
                : (runs.length ? runs.slice(0, 30).map((r) => (
                  <div key={r.id} className="flex gap-3 rounded-xl p-3">
                    <Lightning size={14} weight="fill" className={clsx('mt-0.5 shrink-0', r.status === 'ok' ? 'text-sage' : r.status === 'fail' ? 'text-coral' : 'text-champagne')} />
                    <span className="min-w-0 flex-1"><span className="block text-[12.5px]"><span className="num text-mist">{r.routineId}</span> · {r.name}</span><span className="block text-[11.5px] text-bone/55">{r.detail}</span><span className="text-[10.5px] text-mist">{ago(r.at)}</span></span>
                  </div>
                )) : <div className="p-8 text-center text-[13px] text-mist">Aucune exécution pour l’instant.</div>)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
