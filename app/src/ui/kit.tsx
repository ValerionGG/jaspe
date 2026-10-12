import { motion, useInView, useMotionValue, useSpring, animate } from 'motion/react'
import React, { useEffect, useRef, useState, type ReactNode, type ElementType } from 'react'
import clsx from 'clsx'
import { ArrowUpRight } from '@phosphor-icons/react'

export const EASE = [0.32, 0.72, 0, 1] as const
export const EXPO = [0.16, 1, 0.3, 1] as const

const motionCache: Record<string, typeof motion.div> = {}

export function Reveal({ children, delay = 0, y = 40, className, as = 'div', once = true }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: ElementType; once?: boolean }) {
  const M = (motionCache[as as string] ??= motion.create(as as 'div') as typeof motion.div)
  return (
    <M className={className} initial={{ opacity: 0, y, filter: 'blur(10px)' }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }} viewport={{ once, margin: '-8% 0px' }} transition={{ duration: 1.1, delay, ease: EXPO }}>
      {children}
    </M>
  )
}

/** Titre révélé ligne par ligne, chaque ligne glisse depuis un masque. */
export function MaskLines({ lines, className, delay = 0, stagger = 0.09, trigger = 'view' }: { lines: ReactNode[]; className?: string; delay?: number; stagger?: number; trigger?: 'view' | 'mount' }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const go = trigger === 'mount' || inView
  return (
    <div ref={ref} className={className}>
      {lines.map((l, i) => (
        <span key={i} className="line-mask">
          <motion.span className="block" initial={{ y: '110%', rotate: 2 }} animate={go ? { y: '0%', rotate: 0 } : {}} transition={{ duration: 1.25, delay: delay + i * stagger, ease: EXPO }}>
            {l}
          </motion.span>
        </span>
      ))}
    </div>
  )
}

export function Magnetic({ children, strength = 0.35, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 })
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 18, mass: 0.4 })
  return (
    <motion.div
      ref={ref}
      className={clsx('inline-block', className)}
      style={{ x, y }}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect()
        x.set((e.clientX - r.left - r.width / 2) * strength)
        y.set((e.clientY - r.top - r.height / 2) * strength)
      }}
      onPointerLeave={() => { x.set(0); y.set(0) }}
    >
      {children}
    </motion.div>
  )
}

type BtnProps = { children: ReactNode; variant?: 'gold' | 'light' | 'ghost' | 'dark'; size?: 'md' | 'lg' | 'sm'; icon?: ReactNode; onClick?: () => void; href?: string; className?: string; type?: 'button' | 'submit' }
export function Button({ children, variant = 'gold', size = 'md', icon, onClick, href, className, type = 'button' }: BtnProps) {
  const base = 'group relative inline-flex items-center gap-3 rounded-full font-medium transition-all duration-500 ease-silk active:scale-[0.97] whitespace-nowrap'
  const sizes = { sm: 'pl-4 pr-1 py-1 text-[13px]', md: 'pl-5 pr-1.5 py-1.5 text-sm', lg: 'pl-7 pr-2 py-2 text-[15px]' }[size]
  const v = {
    gold: 'bg-champagne text-ink hover:bg-champagne-300 shadow-glow',
    light: 'bg-bone text-ink hover:bg-white',
    dark: 'bg-ink text-bone hover:bg-ink-700',
    ghost: 'bg-white/[0.04] text-bone ring-1 ring-white/10 hover:bg-white/[0.08]',
  }[variant]
  const iconWrap = { gold: 'bg-ink/10', light: 'bg-ink/[0.07]', dark: 'bg-white/10', ghost: 'bg-white/10' }[variant]
  const dim = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
  const inner = (
    <>
      <span>{children}</span>
      <span className={clsx('flex items-center justify-center rounded-full transition-transform duration-500 ease-silk group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105', dim, iconWrap)}>
        {icon ?? <ArrowUpRight size={size === 'lg' ? 18 : 15} weight="light" />}
      </span>
    </>
  )
  return href ? <a href={href} className={clsx(base, sizes, v, className)}>{inner}</a> : <button type={type} onClick={onClick} className={clsx(base, sizes, v, className)}>{inner}</button>
}

export function Eyebrow({ children, tone = 'dark', className }: { children: ReactNode; tone?: 'dark' | 'light'; className?: string }) {
  return (
    <span className={clsx('eyebrow', tone === 'dark' ? 'bg-white/[0.04] text-champagne-300 ring-1 ring-white/10' : 'bg-ink/[0.04] text-champagne-700 ring-1 ring-ink/10', className)}>
      <span className="h-1 w-1 rounded-full bg-champagne" />
      {children}
    </span>
  )
}

export function Counter({ to, decimals = 0, suffix = '', prefix = '', duration = 2, className }: { to: number; decimals?: number; suffix?: string; prefix?: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(0, to, { duration, ease: EXPO, onUpdate: setV })
    return () => c.stop()
  }, [inView, to, duration])
  return <span ref={ref} className={className}>{prefix}{v.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>
}

export function Avatar({ src, size = 32, ring = true, className }: { src: string; size?: number; ring?: boolean; className?: string }) {
  return <img src={src} alt="" width={size} height={size} className={clsx('rounded-full object-cover', ring && 'ring-2 ring-ink-800', className)} style={{ width: size, height: size }} />
}

export function Ring({ value, size = 44, stroke = 3, color = 'rgb(var(--acc-500))', track = 'rgb(var(--tint) / .08)', children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} whileInView={{ strokeDashoffset: c * (1 - value / 100) }} viewport={{ once: true }} transition={{ duration: 1.6, ease: EXPO }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </div>
  )
}

export function Spark({ data, w = 120, h = 36, color = 'rgb(var(--acc-500))', fill = true }: { data: number[]; w?: number; h?: number; color?: string; fill?: boolean }) {
  const min = Math.min(...data), max = Math.max(...data)
  const pts = data.map((d, i) => [(i / (data.length - 1)) * w, h - 3 - ((d - min) / (max - min || 1)) * (h - 6)])
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const id = 'sg' + color.replace(/[^a-z0-9]/gi, '') + w + h
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {fill && <path d={`${path} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />}
      <motion.path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.8, ease: EXPO }} />
      <circle cx={pts.at(-1)![0]} cy={pts.at(-1)![1]} r="2.5" fill={color} />
    </svg>
  )
}

export function Bezel({ children, className, coreClassName, light }: { children: ReactNode; className?: string; coreClassName?: string; light?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  // Halo champagne qui suit le curseur sur la coque (effet « magic bento »)
  const onMove = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); ref.current!.style.setProperty('--mx', `${e.clientX - r.left}px`); ref.current!.style.setProperty('--my', `${e.clientY - r.top}px`) }
  return (
    <div ref={ref} onPointerMove={light ? undefined : onMove} className={clsx(light ? 'shell-light' : 'shell spotlight', className)}>
      <div className={clsx(light ? 'core-light' : 'core', 'relative h-full overflow-hidden', coreClassName)}>{children}</div>
    </div>
  )
}

export function Pill({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'gold' | 'green' | 'red' | 'blue' | 'amber'; className?: string }) {
  const t = {
    neutral: 'bg-white/[0.05] text-bone/70 ring-white/10',
    gold: 'bg-champagne/10 text-champagne-300 ring-champagne/25',
    green: 'bg-sage/10 text-sage ring-sage/25',
    red: 'bg-coral/10 text-coral ring-coral/25',
    blue: 'bg-sea/10 text-sea ring-sea/25',
    amber: 'bg-coral/10 text-coral ring-coral/20',
  }[tone]
  return <span className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11px] font-medium ring-1', t, className)}>{children}</span>
}
