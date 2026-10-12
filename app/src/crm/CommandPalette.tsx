import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { MagnifyingGlass, Sparkle, ArrowRight, Buildings, Kanban, UsersThree, Lightning, PenNib, CalendarPlus, FileText, AddressBook } from '@phosphor-icons/react'
import { prop, eur } from '../data/mock'
import { useDossiers, useProperties, useBuyers, useContacts } from '../data/collections'
import { EXPO } from '../ui/kit'

type Item = { id: string; label: string; hint?: string; group: string; icon: typeof Sparkle; go?: string; ai?: boolean }

export function CommandPalette({ open, onClose, onCopilot }: { open: boolean; onClose: () => void; onCopilot: () => void }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const nav = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  const [DOSSIERS] = useDossiers()
  const [PROPERTIES] = useProperties()
  const [BUYERS] = useBuyers()
  const [CONTACTS] = useContacts()
  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => input.current?.focus(), 40) } }, [open])

  const all: Item[] = useMemo(() => [
    { id: 'ai1', label: 'Préparer le RDV de demain avec M. & Mme Laurent', group: 'Demander au copilote', icon: Sparkle, ai: true },
    { id: 'ai2', label: 'Générer les livrables L1 → L9 du dossier Martin', group: 'Demander au copilote', icon: Sparkle, ai: true },
    { id: 'ai3', label: 'Quels mandats n’ont eu aucune visite depuis 14 jours ?', group: 'Demander au copilote', icon: Sparkle, ai: true },
    { id: 'n1', label: 'Nouveau rendez-vous vendeur', hint: 'N', group: 'Actions', icon: CalendarPlus, go: '/app/agenda' },
    { id: 'n2', label: 'Nouveau dossier vendeur', group: 'Actions', icon: Kanban, go: '/app/dossiers' },
    { id: 'n3', label: 'Lancer une estimation', group: 'Actions', icon: FileText, go: '/app/marche' },
    { id: 'n4', label: 'Centre de validation', group: 'Actions', icon: PenNib, go: '/app/studio' },
    { id: 'n5', label: 'Routines actives', group: 'Actions', icon: Lightning, go: '/app/automatisations' },
    ...DOSSIERS.map((d) => ({ id: d.id, label: `${d.seller} — ${prop(d.propertyId).title}`, hint: d.ref, group: 'Dossiers', icon: Kanban, go: `/app/dossiers/${d.id}` })),
    ...PROPERTIES.map((p) => ({ id: p.id, label: p.title, hint: `${p.district} · ${eur(p.price)}`, group: 'Biens', icon: Buildings, go: '/app/biens' })),
    ...BUYERS.map((b) => ({ id: b.id, label: b.name, hint: `${eur(b.budget[0])} – ${eur(b.budget[1])}`, group: 'Acquéreurs', icon: UsersThree, go: '/app/acquereurs' })),
    ...CONTACTS.map((c) => ({ id: c.id, label: c.name, hint: c.email, group: 'Contacts', icon: AddressBook, go: '/app/contacts' })),
  ], [DOSSIERS, PROPERTIES, BUYERS, CONTACTS])

  const list = useMemo(() => {
    const n = q.trim().toLowerCase()
    const r = n ? all.filter((i) => (i.label + ' ' + (i.hint ?? '')).toLowerCase().includes(n)) : all.filter((i) => i.group !== 'Biens' && i.group !== 'Acquéreurs' && i.group !== 'Contacts')
    return n && !r.some((i) => i.ai) ? [{ id: 'free', label: `Demander : « ${q} »`, group: 'Demander au copilote', icon: Sparkle, ai: true } as Item, ...r] : r
  }, [q, all])

  const run = (i?: Item) => { if (!i) return; if (i.ai) onCopilot(); else if (i.go) { nav(i.go); onClose() } }
  const groups = [...new Set(list.map((i) => i.group))]

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-start justify-center bg-ink/60 px-4 pt-[12vh] backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div role="dialog" aria-label="Palette de commandes" onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, y: -16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.4, ease: EXPO }} className="w-full max-w-[640px] rounded-[1.6rem] bg-white/[0.04] p-1.5 shadow-float ring-1 ring-white/10">
            <div className="overflow-hidden rounded-[1.25rem] bg-ink-800">
              <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
                <MagnifyingGlass size={18} className="text-mist" />
                <input
                  ref={input} value={q} onChange={(e) => { setQ(e.target.value); setSel(0) }}
                  onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, list.length - 1)) } if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)) } if (e.key === 'Enter') run(list[sel]) }}
                  placeholder="Rechercher ou demander au copilote…" className="flex-1 bg-transparent text-[15px] text-bone outline-none placeholder:text-mist"
                />
                <kbd className="num rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-mist">Échap</kbd>
              </div>
              <div className="thin-scroll max-h-[52vh] overflow-y-auto p-2">
                {groups.map((g) => (
                  <div key={g} className="mb-1">
                    <div className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-eyebrow text-mist">{g}</div>
                    {list.filter((i) => i.group === g).map((i) => {
                      const k = list.indexOf(i)
                      return (
                        <button key={i.id} onMouseEnter={() => setSel(k)} onClick={() => run(i)} className={clsx('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] transition-colors', sel === k ? 'bg-white/[0.07]' : '')}>
                          <span className={clsx('flex h-7 w-7 items-center justify-center rounded-lg', i.ai ? 'bg-champagne/15 text-champagne-300' : 'bg-white/[0.05] text-bone/70')}><i.icon size={14} weight={i.ai ? 'fill' : 'light'} /></span>
                          <span className="min-w-0 flex-1 truncate">{i.label}</span>
                          {i.hint && <span className="num truncate text-[11px] text-mist">{i.hint}</span>}
                          {sel === k && <ArrowRight size={13} className="text-champagne-300" />}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 border-t border-white/[0.06] px-5 py-2.5 text-[11px] text-mist"><span>↑↓ naviguer</span><span>↵ ouvrir</span><span className="ml-auto flex items-center gap-1.5"><Sparkle size={11} weight="fill" className="text-champagne" /> Toute question libre part au copilote</span></div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
