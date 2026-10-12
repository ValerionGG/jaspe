import { motion } from 'motion/react'
import clsx from 'clsx'
import { CheckCircle, ArrowRight } from '@phosphor-icons/react'
import { EXPO } from '../../ui/kit'
import { DISCOVERY_BLOCKS, type Journey } from '../../data/dossier'
import type { Dossier, Stage } from '../../data/mock'

export type StepId = 'prep' | 'discovery' | 'deliverables' | 'mandate' | 'marketing' | 'offers' | 'closing' | 'after'
export const STEPS: { id: StepId; label: string; caption: string; stages: Stage[] }[] = [
  { id: 'prep', label: 'Préparation', caption: 'D1 · D2 · D3 · D4', stages: ['prep'] },
  { id: 'discovery', label: 'Découverte', caption: 'D5 · entretien', stages: ['rdv'] },
  { id: 'deliverables', label: 'Livrables', caption: 'L1 → L9', stages: ['post'] },
  { id: 'mandate', label: 'Mandat', caption: 'Signature', stages: ['mandat'] },
  { id: 'marketing', label: 'Commercialisation', caption: 'Diffusion · visites', stages: ['commercial'] },
  { id: 'offers', label: 'Offres', caption: 'Négociation', stages: ['offre'] },
  { id: 'closing', label: 'Compromis & acte', caption: 'Conditions', stages: ['compromis', 'acte'] },
  { id: 'after', label: 'Après-vente', caption: 'Fidélisation', stages: [] },
]
const TOTAL_FIELDS = DISCOVERY_BLOCKS.reduce((n, b) => n + b.fields.length, 0)

/** Avancement réel (0–100) de chaque étape, calculé depuis le dossier. */
export function stepProgress(d: Dossier, j: Journey): Record<StepId, number> {
  const dl = d.deliverables
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
  const filled = Object.values(j.discovery).filter((f) => f?.v?.trim()).length
  const m = j.mandate
  const mandateScore = m.signature === 'signé' ? 100 : pct([m.type, m.price, m.feesPct, m.duration].filter(Boolean).length + Object.values(m.mentions).filter(Boolean).length + (m.signature === 'envoyé' ? 2 : 0), 10)
  const published = Object.values(j.diffusion.portals).filter((s) => s === 'publiée').length
  const closingDone = j.closing.checklist.filter((c) => c.done).length
  const a = j.afterSale
  return {
    prep: pct(['D1', 'D2', 'D3', 'D4'].filter((k) => dl[k] === 'done').length, 4),
    discovery: Math.max(dl.D5 === 'done' ? 100 : 0, pct(filled, TOTAL_FIELDS)),
    deliverables: pct(['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'].filter((k) => dl[k] === 'done').length, 9),
    mandate: mandateScore,
    marketing: Math.min(100, published * 15 + j.visits.length * 8 + j.reports.filter((r) => r.sent).length * 10),
    offers: j.offers.some((o) => o.status === 'acceptée') ? 100 : j.offers.length ? 50 : 0,
    closing: pct(closingDone, j.closing.checklist.length),
    after: pct([a.thanksSent, !!a.review, !!a.referral, !!a.keysHanded, !!a.archive].filter(Boolean).length, 5),
  }
}
export const currentStep = (d: Dossier): StepId => STEPS.find((s) => s.stages.includes(d.stage))?.id ?? 'prep'

export function JourneyStepper({ dossier, journey, step, onStep }: { dossier: Dossier; journey: Journey; step: StepId; onStep: (s: StepId) => void }) {
  const prog = stepProgress(dossier, journey)
  const cur = STEPS.findIndex((s) => s.id === currentStep(dossier))
  const sel = STEPS.findIndex((s) => s.id === step)
  return (
    <div className="rounded-[1.6rem] bg-white/[0.02] p-1 ring-1 ring-white/[0.06]">
      <div className="thin-scroll overflow-x-auto rounded-[calc(1.6rem-0.25rem)] bg-ink-800/80 px-4 py-5 shadow-bezel md:px-6">
        <ol className="relative flex min-w-[880px] items-start justify-between">
          <div className="absolute left-[3%] right-[3%] top-[22px] h-px bg-white/10" aria-hidden />
          <motion.div className="absolute left-[3%] top-[22px] h-px bg-champagne" initial={{ width: 0 }} animate={{ width: `${(cur / (STEPS.length - 1)) * 94}%` }} transition={{ duration: 1.2, ease: EXPO }} aria-hidden />
          {STEPS.map((s, i) => {
            const p = prog[s.id], done = p >= 100, active = i === sel, isCur = i === cur
            const r = 19, c = 2 * Math.PI * r
            return (
              <li key={s.id} className="relative z-10 flex w-[12%] flex-col items-center text-center">
                <button onClick={() => onStep(s.id)} aria-current={active ? 'step' : undefined} aria-label={`${s.label} — ${p} %`} className="group flex flex-col items-center">
                  <span className={clsx('relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-500 ease-silk', active ? 'bg-champagne text-ink shadow-glow' : done ? 'bg-sage/15 text-sage' : 'bg-ink-700 text-bone/60 group-hover:text-bone')}>
                    <svg className="absolute inset-0 -rotate-90" width="44" height="44" aria-hidden>
                      <circle cx="22" cy="22" r={r} fill="none" stroke="rgb(var(--tint) / .08)" strokeWidth="2" />
                      <motion.circle cx="22" cy="22" r={r} fill="none" stroke={active ? 'rgb(var(--ink-900) / .35)' : done ? 'rgb(var(--sage))' : 'rgb(var(--acc-500))'} strokeWidth="2" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - p / 100) }} transition={{ duration: 1.1, ease: EXPO, delay: 0.1 + i * 0.05 }} />
                    </svg>
                    {done && !active ? <CheckCircle size={18} weight="fill" /> : <span className="num relative text-[13px]">{i + 1}</span>}
                    {isCur && !active && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-coral ring-2 ring-ink-800" title="Étape en cours" />}
                  </span>
                  <span className={clsx('mt-2.5 text-[12.5px] leading-tight', active ? 'text-bone' : 'text-bone/70')}>{s.label}</span>
                  <span className="mt-0.5 text-[10.5px] text-mist">{s.caption}</span>
                  <span className={clsx('num mt-1 text-[10.5px]', done ? 'text-sage' : 'text-mist')}>{p} %</span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
      {sel < STEPS.length - 1 && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 text-[12.5px]">
          <span className="text-mist">Étape en cours : <span className="text-bone">{STEPS[cur].label}</span>{cur !== sel && <> · vous consultez <span className="text-champagne-300">{STEPS[sel].label}</span></>}</span>
          <button onClick={() => onStep(STEPS[Math.min(sel + 1, STEPS.length - 1)].id)} className="flex items-center gap-1.5 text-champagne-300 transition hover:gap-2.5">Étape suivante <ArrowRight size={13} /></button>
        </div>
      )}
    </div>
  )
}
