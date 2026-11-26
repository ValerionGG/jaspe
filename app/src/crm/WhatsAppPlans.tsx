// Tâches & validations : débriefs reçus par WhatsApp (vocal transcrit ou texte) → plan d’action à cocher, puis Valider / Refuser.
// Rien n’est lancé avant « Valider » : le serveur appelle alors assistant.apply avec les seules actions cochées.
import { useState } from 'react'
import clsx from 'clsx'
import { WhatsappLogo, Microphone, ChatText, Check, X } from '@phosphor-icons/react'
import { Card, SoftBtn } from './ui'
import { toast, errText } from './forms'
import { useDossiers } from '../data/collections'
import { action, type Doc } from '../data/store'
import type { PlanItem } from '../data/assist'

export type WaQueueItem = Doc & { kind: string; planId: string; title: string; dossier?: string; why: string; transcript: string; items: PlanItem[]; source: 'audio' | 'text' }
const fday = (d?: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : 'sans date')

function Plan({ q }: { q: WaQueueItem }) {
  const [dossiers] = useDossiers()
  const [sel, setSel] = useState<string[]>(() => q.items.filter((i) => i.selected !== false).map((i) => i.id))
  const [dossierId, setDossierId] = useState(q.dossier ?? '')
  const [busy, setBusy] = useState(false)
  const needsDossier = !dossierId && q.items.some((i) => sel.includes(i.id) && ['document', 'facture', 'conformite'].includes(i.type))
  const go = async (ok: boolean) => {
    setBusy(true)
    try {
      if (ok) { const r = await action<{ done: PlanItem[] }>('waplan.approve', { id: q.planId, items: sel, dossierId }); toast(`${r.done.length} action(s) lancée(s) depuis le débrief WhatsApp`) }
      else { await action('waplan.reject', { id: q.planId }); toast('Débrief écarté') }
    } catch (e) { toast(errText(e), 'error') } finally { setBusy(false) }
  }
  return (
    <div className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[14px] font-medium">{q.source === 'audio' ? <Microphone size={15} className="text-sage" /> : <ChatText size={15} className="text-sage" />}{q.title}</div>
        <select value={dossierId} onChange={(e) => setDossierId(e.target.value)} aria-label="Dossier du débrief" className="rounded-full bg-white/[0.03] px-3 py-1.5 text-[12px] text-bone/85 outline-none ring-1 ring-white/[0.07]">
          <option value="">Sans dossier</option>
          {dossiers.map((d) => <option key={d.id} value={d.id}>{d.seller}</option>)}
        </select>
      </div>
      <div className="mt-1 text-[12px] text-mist">{q.why}</div>
      <blockquote className="mt-3 rounded-xl bg-white/[0.02] p-3 text-[12.5px] italic leading-relaxed text-bone/70 ring-1 ring-white/[0.05]">« {q.transcript} »</blockquote>
      <div className="mt-3 space-y-1.5">
        {q.items.map((it) => (
          <label key={it.id} className={clsx('flex cursor-pointer items-start gap-2.5 rounded-xl px-3 py-2 ring-1 transition', sel.includes(it.id) ? 'bg-white/[0.03] ring-white/[0.08]' : 'ring-white/[0.04] opacity-60')}>
            <input type="checkbox" className="mt-0.5 accent-[var(--color-champagne,#c9a86a)]" checked={sel.includes(it.id)} onChange={() => setSel((s) => (s.includes(it.id) ? s.filter((x) => x !== it.id) : [...s, it.id]))} />
            <span className="min-w-0 flex-1"><span className="block text-[13px]">{it.label}</span><span className="block text-[11px] text-mist">{fday(it.due)} · « {it.source.slice(0, 110)} »</span></span>
          </label>
        ))}
      </div>
      {needsDossier && <div className="mt-2 text-[11.5px] text-champagne-300">Brouillons, facture et contrôle de conformité demandent un dossier : choisissez-le ou ils seront ignorés.</div>}
      <div className="mt-3 flex flex-wrap gap-2">
        <SoftBtn tone="gold" disabled={busy || !sel.length} icon={<Check size={13} />} onClick={() => go(true)}>Valider {sel.length} action(s)</SoftBtn>
        <SoftBtn disabled={busy} icon={<X size={13} />} onClick={() => go(false)}>Refuser</SoftBtn>
      </div>
    </div>
  )
}

export function WhatsAppPlans({ items }: { items: WaQueueItem[] }) {
  if (!items.length) return null
  return (
    <Card pad={false} title={<span className="flex items-center gap-2"><WhatsappLogo size={18} weight="light" className="text-sage" />Débriefs WhatsApp à valider</span>} kicker={`${items.length} plan(s) · rien n’est lancé sans votre validation`}>
      <div className="divide-y divide-white/[0.05]">{items.map((q) => <Plan key={q.id} q={q} />)}</div>
    </Card>
  )
}
