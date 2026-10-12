// Primitives de formulaire et de retour utilisateur partagées par toutes les pages du CRM.
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, useSyncExternalStore, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type FormEvent } from 'react'
import clsx from 'clsx'
import { X, CheckCircle, WarningCircle, Info } from '@phosphor-icons/react'
import { EXPO } from '../ui/kit'
import { SoftBtn } from './ui'
import { ApiError } from '../data/store'

/* ——— Toasts ——— */
type Toast = { id: number; text: string; tone: 'ok' | 'error' | 'info' }
let toasts: Toast[] = []
const tsubs = new Set<() => void>()
export function toast(text: string, tone: Toast['tone'] = 'ok') {
  const t = { id: Date.now() + Math.random(), text, tone }
  toasts = [...toasts, t]; tsubs.forEach((f) => f())
  setTimeout(() => { toasts = toasts.filter((x) => x.id !== t.id); tsubs.forEach((f) => f()) }, tone === 'error' ? 6000 : 3500)
}
/** Message lisible pour une erreur d’API ou réseau. */
export const errText = (e: unknown) => (e instanceof ApiError || (e instanceof Error && !(e instanceof TypeError)) ? (e as Error).message : 'Action impossible : serveur injoignable')

export function Toaster() {
  const list = useSyncExternalStore((f) => { tsubs.add(f); return () => tsubs.delete(f) }, () => toasts)
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-[95] flex -translate-x-1/2 flex-col items-center gap-2 lg:bottom-6" role="status" aria-live="polite">
      <AnimatePresence>
        {list.map((t) => {
          const I = t.tone === 'ok' ? CheckCircle : t.tone === 'error' ? WarningCircle : Info
          return (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.4, ease: EXPO }}
              className="glass pointer-events-auto flex items-center gap-2.5 rounded-full py-2.5 pl-3 pr-5 text-[13px] shadow-float ring-1 ring-white/10">
              <I size={17} weight="fill" className={t.tone === 'ok' ? 'text-sage' : t.tone === 'error' ? 'text-coral' : 'text-champagne'} />{t.text}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

/* ——— Modale ——— */
export function Modal({ open, onClose, title, kicker, children, width = 560 }: { open: boolean; onClose: () => void; title: ReactNode; kicker?: string; children: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[85] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: width }}
            initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.5, ease: EXPO }}
            className="w-full rounded-t-[1.6rem] bg-white/[0.04] p-1.5 shadow-float ring-1 ring-white/10 sm:rounded-[1.6rem]">
            <div className="thin-scroll max-h-[88vh] overflow-y-auto rounded-t-[1.3rem] bg-ink-800 p-6 sm:rounded-[1.3rem] md:p-7">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>{kicker && <div className="text-[10.5px] uppercase tracking-eyebrow text-mist">{kicker}</div>}<h2 className="display mt-1 text-3xl">{title}</h2></div>
                <button onClick={onClose} aria-label="Fermer" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-mist ring-1 ring-white/[0.08] hover:text-bone"><X size={15} /></button>
              </div>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ——— Champs ——— */
const fieldCls = 'w-full rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-bone outline-none ring-1 ring-white/[0.08] transition placeholder:text-mist focus:ring-champagne/60'
export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return <label className={clsx('block', className)}><span className="mb-1.5 block text-[11px] uppercase tracking-eyebrow text-mist">{label}</span>{children}{hint && <span className="mt-1 block text-[11px] text-mist">{hint}</span>}</label>
}
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={clsx(fieldCls, p.className)} />
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={4} {...p} className={clsx(fieldCls, 'resize-y leading-relaxed', p.className)} />
export const Select = ({ children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={clsx(fieldCls, 'appearance-none bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-9', p.className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%23968f84' stroke-width='1.4'/%3E%3C/svg%3E\")" }}>{children}</select>

/**
 * Formulaire avec soumission asynchrone, état d’envoi et erreur.
 * `onSubmit` reçoit les valeurs (FormData → objet) ; renvoyer normalement = succès.
 */
export function AsyncForm({ onSubmit, submitLabel, onCancel, children, success }: { onSubmit: (v: Record<string, string>) => Promise<unknown>; submitLabel: string; onCancel?: () => void; children: ReactNode; success?: string }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try { await onSubmit(Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>); if (success) toast(success) }
    catch (x) { setErr(errText(x)) }
    finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {children}
      {err && <p role="alert" className="rounded-xl bg-coral/10 px-3.5 py-2.5 text-[12.5px] text-coral ring-1 ring-coral/20">{err}</p>}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <SoftBtn onClick={onCancel}>Annuler</SoftBtn>}
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-champagne px-5 py-2 text-[13px] font-medium text-ink transition hover:bg-champagne-300 disabled:opacity-60">{busy ? 'Enregistrement…' : submitLabel}</button>
      </div>
    </form>
  )
}
