import { AnimatePresence, motion } from 'motion/react'
import { EXPO } from '../../ui/kit'
import type { Dossier } from '../../data/mock'
import type { Journey } from '../../data/dossier'
import type { StepId } from './Stepper'
import StepPrep from './StepPrep'
import StepDiscovery from './StepDiscovery'
import StepDeliverables from './StepDeliverables'
import StepMandate from './StepMandate'
import StepMarketing from './StepMarketing'
import StepOffers from './StepOffers'
import StepClosing from './StepClosing'
import StepAfter from './StepAfter'

/** Props communes à chaque étape du parcours vendeur. */
export type StepProps = {
  dossier: Dossier
  journey: Journey
  /** Enregistre une ou plusieurs sections du parcours (persistant, temps réel). `extra` modifie le dossier lui-même (ex. stage). */
  save: (patch: Partial<Journey>, extra?: Partial<Dossier>) => Promise<void>
  /** Ouvre le tiroir d’aperçu d’un livrable D1–L9 (génération, validation, édition, impression). */
  openDeliverable: (code: string) => void
  /** Navigue vers une autre étape. */
  goTo: (step: StepId) => void
}

const VIEWS: Record<StepId, (p: StepProps) => React.ReactNode> = {
  prep: StepPrep, discovery: StepDiscovery, deliverables: StepDeliverables, mandate: StepMandate,
  marketing: StepMarketing, offers: StepOffers, closing: StepClosing, after: StepAfter,
}

export function StepView({ step, ...p }: StepProps & { step: StepId }) {
  const V = VIEWS[step]
  return (
    <AnimatePresence mode="wait">
      <motion.div key={step} initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5, ease: EXPO }} className="space-y-6">
        <V {...p} />
      </motion.div>
    </AnimatePresence>
  )
}
