// Retour bêta-testeur en deux clics, rattaché à la page courante. Les retours se lisent et s’exportent dans Réglages.
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { ChatTeardropText } from '@phosphor-icons/react'
import { Modal, Textarea, toast, errText } from './forms'
import { IconBtn, SoftBtn } from './ui'
import { action } from '../data/store'

const MOODS = [{ id: 'bloque', l: 'Je suis bloqué' }, { id: 'lent', l: 'C’est trop long' }, { id: 'idee', l: 'Une idée' }, { id: 'top', l: 'Ça m’aide' }]

export function FeedbackButton() {
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [mood, setMood] = useState('idee')
  const [busy, setBusy] = useState(false)
  const send = async () => {
    setBusy(true)
    try { await action('feedback.send', { text, mood, page: loc.pathname }); toast('Merci, retour enregistré'); setText(''); setOpen(false) }
    catch (e) { toast(errText(e), 'error') } finally { setBusy(false) }
  }
  return (
    <>
      <IconBtn label="Donner un retour (bêta)" onClick={() => setOpen(true)}><ChatTeardropText size={16} /></IconBtn>
      <Modal open={open} onClose={() => setOpen(false)} kicker="Bêta" title="Votre retour sur cet écran">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => <button key={m.id} type="button" onClick={() => setMood(m.id)} className={clsx('rounded-full px-3 py-1.5 text-[12.5px] ring-1 transition', mood === m.id ? 'bg-champagne/15 text-champagne-300 ring-champagne/30' : 'bg-white/[0.03] text-bone/60 ring-white/[0.08] hover:text-bone')}>{m.l}</button>)}
          </div>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Ce que vous cherchiez à faire, ce qui a coincé, ce qui vous ferait gagner du temps…" />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11.5px] text-mist">Page : {loc.pathname}</span>
            <SoftBtn tone="gold" disabled={!text.trim() || busy} onClick={send}>{busy ? 'Envoi…' : 'Envoyer'}</SoftBtn>
          </div>
        </div>
      </Modal>
    </>
  )
}
