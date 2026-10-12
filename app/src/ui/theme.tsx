import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import clsx from 'clsx'
import { EXPO } from './kit'

export type Theme = 'light' | 'dark'
const read = (): Theme => (document.documentElement.dataset.theme as Theme) || 'dark'

// Mode « Système » = aucune préférence mémorisée : on suit l’appareil en direct.
if (typeof window !== 'undefined') {
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    try { if (localStorage.getItem('nxt-theme')) return } catch { /* stockage indisponible */ }
    document.documentElement.dataset.theme = e.matches ? 'light' : 'dark'
    window.dispatchEvent(new Event('nxt:theme'))
  })
}

/** Thème global : attribut data-theme sur <html>, mémorisé localement. */
export function useTheme() {
  const [theme, set] = useState<Theme>(read)
  useEffect(() => {
    const on = () => set(read())
    window.addEventListener('nxt:theme', on)
    return () => window.removeEventListener('nxt:theme', on)
  }, [])
  const setTheme = (t: Theme) => {
    document.documentElement.dataset.theme = t
    try { localStorage.setItem('nxt-theme', t) } catch { /* stockage indisponible */ }
    window.dispatchEvent(new Event('nxt:theme'))
  }
  return { theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') }
}

/** Interrupteur soleil / lune : le disque se creuse en croissant. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button onClick={toggle} aria-label={dark ? 'Passer en mode clair' : 'Passer en mode sombre'} title={dark ? 'Mode clair' : 'Mode sombre'}
      className={clsx('relative flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-bone ring-1 ring-white/10 transition-colors duration-500 ease-silk hover:bg-white/[0.08]', className)}>
      <svg width="18" height="18" viewBox="0 0 24 24" className="overflow-visible">
        <mask id="moon-cut"><rect x="-4" y="-4" width="32" height="32" fill="white" /><motion.circle r="6.5" fill="black" initial={false} animate={{ cx: dark ? 16.5 : 30, cy: dark ? 7.5 : -4 }} transition={{ duration: 0.7, ease: EXPO }} /></mask>
        <motion.circle cx="12" cy="12" fill="currentColor" mask="url(#moon-cut)" initial={false} animate={{ r: dark ? 7.5 : 4.6 }} transition={{ duration: 0.7, ease: EXPO }} />
        <motion.g initial={false} animate={{ opacity: dark ? 0 : 1, rotate: dark ? -45 : 0, scale: dark ? 0.6 : 1 }} transition={{ duration: 0.7, ease: EXPO }} style={{ originX: '12px', originY: '12px' }} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <line key={a} x1="12" y1="2.2" x2="12" y2="4.2" transform={`rotate(${a} 12 12)`} />)}
        </motion.g>
      </svg>
    </button>
  )
}
