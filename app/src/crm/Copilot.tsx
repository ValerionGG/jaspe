import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { X, Sparkle, PaperPlaneRight, Microphone, CheckCircle, Link as LinkIcon } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { EXPO } from '../ui/kit'
import { askCopilot } from '../data/store'

type Msg = { from: 'me' | 'ai'; text: string; cites?: string[]; actions?: string[]; link?: string }

const SEED: Msg[] = [
  { from: 'ai', text: 'Bonjour Claire. Trois sujets demandent votre attention avant midi : l’estimation Martin (L7) attend votre validation, la contre-offre Dubreuil expire à 18 h, et le débrief de M. Haddad propose 12 champs à confirmer.', cites: ['Agenda', 'Dossier VND-0412', 'Dossier VND-0371'], actions: ['Ouvrir L7', 'Relire le débrief'] },
]

/** Réponses scénarisées — démonstrateur sans appel à un modèle. */
function answer(q: string): Msg {
  const n = q.toLowerCase()
  if (n.includes('visite') || n.includes('14')) return { from: 'ai', text: 'Deux mandats n’ont reçu aucune visite depuis plus de 14 jours : la Bastide La Salis (prix au-dessus du haut de fourchette de 4 %) et l’appartement Belle Époque (annonce sans plan ni visite 3D). Je propose un diagnostic d’exposition pour chacun.', cites: ['DVF 2025-S2', 'Portails · statistiques du 10/10'], actions: ['Préparer les diagnostics', 'Planifier un point vendeur'] }
  if (n.includes('laurent') || n.includes('rdv') || n.includes('prépar')) return { from: 'ai', text: 'Le brief du RDV Laurent est prêt à 78 % : D1 et D2 sont complets, le radar D3 attend la couche PLU. Points à confirmer : répartition entre les trois héritiers et date du dernier DPE.', cites: ['D1 · 10/10 09:12', 'D2 · 5 comparables', 'IGN · GPU'], actions: ['Ouvrir le brief', 'Lancer D4 · simulation'] }
  if (n.includes('livrable') || n.includes('l1') || n.includes('martin')) return { from: 'ai', text: 'Sur le dossier Martin, 9 livrables sur 14 sont prêts. L9 est bloqué : le PV d’AG 2025 manque. J’ai préparé la demande au syndic — elle part après votre validation.', cites: ['Checklist L9', 'Syndic Foncia Antibes'], actions: ['Valider la demande', 'Voir les livrables'] }
  return { from: 'ai', text: 'Je regarde vos dossiers, l’agenda et les pièces pour répondre. Dans ce démonstrateur, mes réponses sont scénarisées ; en production, chaque affirmation renvoie à sa source et toute action externe attend votre accord.', cites: ['Mode démonstration'] }
}

export function CopilotDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>(SEED)
  const [q, setQ] = useState('')
  const [typing, setTyping] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, typing])
  const nav = useNavigate()
  const send = async (t: string) => {
    if (!t.trim() || typing) return
    const history = msgs
    setMsgs((m) => [...m, { from: 'me', text: t }]); setQ(''); setTyping(true)
    try {
      const r = await askCopilot(t, history)
      setMsgs((m) => [...m, { from: 'ai', text: r.text, cites: [...(r.cites ?? []), ...(r.warning ? [r.warning] : [])], actions: r.link ? ['Ouvrir'] : r.actions, link: r.link }])
    } catch {
      setMsgs((m) => [...m, { ...answer(t), cites: ['Hors ligne · réponse locale'] }])
    } finally { setTyping(false) }
  }
  return (
    <AnimatePresence>
      {open && (
        <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.6, ease: EXPO }} className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-white/[0.07] bg-ink-850/95 backdrop-blur-2xl sm:w-[400px]" aria-label="Copilote">
          <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-5">
            <div className="flex items-center gap-3">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-champagne to-champagne-700 text-ink"><Sparkle size={16} weight="fill" /><span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-sage ring-2 ring-ink-850" /></span>
              <div><div className="text-[14px] font-medium">Copilote Jaspe</div><div className="text-[11px] text-mist">Lit vos données en direct · n’envoie rien sans vous</div></div>
            </div>
            <button onClick={onClose} aria-label="Fermer" className="flex h-8 w-8 items-center justify-center rounded-full text-mist hover:bg-white/[0.06] hover:text-bone"><X size={16} /></button>
          </div>
          <div className="thin-scroll flex-1 space-y-4 overflow-y-auto p-5">
            {msgs.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EXPO }} className={m.from === 'me' ? 'flex justify-end' : ''}>
                {m.from === 'me' ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-bone px-4 py-2.5 text-[13.5px] text-ink">{m.text}</div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-[13.5px] leading-relaxed text-bone/85">{m.text}</p>
                    {m.cites && <div className="flex flex-wrap gap-1.5">{m.cites.map((c) => <span key={c} className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[10.5px] text-mist ring-1 ring-white/[0.07]"><LinkIcon size={10} />{c}</span>)}</div>}
                    {m.actions && <div className="flex flex-wrap gap-2 pt-1">{m.actions.map((a) => <button key={a} onClick={() => (m.link ? nav(m.link) : send(a))} className="inline-flex items-center gap-1.5 rounded-full bg-champagne/10 px-3 py-1.5 text-[12px] text-champagne-300 ring-1 ring-champagne/25 transition hover:bg-champagne/20"><CheckCircle size={12} />{a}</button>)}</div>}
                  </div>
                )}
              </motion.div>
            ))}
            {typing && <div className="flex gap-1 py-2">{[0, 1, 2].map((k) => <motion.span key={k} className="h-1.5 w-1.5 rounded-full bg-champagne" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: k * 0.15 }} />)}</div>}
            <div ref={end} />
          </div>
          <div className="border-t border-white/[0.06] p-4">
            <div className="mb-3 flex gap-2 overflow-x-auto scrollbar-none">
              {['Mandats sans visite depuis 14 j', 'Préparer le RDV Laurent', 'État des livrables Martin'].map((s) => <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full bg-white/[0.04] px-3 py-1.5 text-[11.5px] text-bone/70 ring-1 ring-white/[0.07] hover:text-bone">{s}</button>)}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(q) }} className="flex items-center gap-2 rounded-2xl bg-white/[0.04] p-1.5 pl-4 ring-1 ring-white/[0.08] focus-within:ring-champagne/50">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Demandez, dictez, déléguez…" className="flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-mist" />
              <button type="button" aria-label="Dicter" className="flex h-9 w-9 items-center justify-center rounded-xl text-mist hover:text-bone"><Microphone size={17} /></button>
              <button type="submit" aria-label="Envoyer" className="flex h-9 w-9 items-center justify-center rounded-xl bg-champagne text-ink"><PaperPlaneRight size={16} weight="fill" /></button>
            </form>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
