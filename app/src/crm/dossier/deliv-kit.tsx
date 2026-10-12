// Étape « Livrables » — socle commun aux sections L1 → L9 : contexte, coque repliable, actions, papier.
import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { CaretDown, Sparkle, ArrowsClockwise, CheckCircle, ArrowSquareOut, Warning, PaperPlaneTilt, LockSimple, Globe, CircleNotch } from '@phosphor-icons/react'
import { Card, SoftBtn, DELIV_TONE } from '../ui'
import { EXPO } from '../../ui/kit'
import { action } from '../../data/store'
import { toast, errText } from '../forms'
import type { Dossier, Property, Agent, DelivState } from '../../data/mock'
import type { Journey } from '../../data/dossier'
import type { Outbox } from '../../data/collections'
import type { StudioDocument } from '../../data/studio'

export const L_CODES = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'] as const
export type LCode = (typeof L_CODES)[number]
/** Livrables qui sortent de l’agence : validation humaine puis envoi consigné (miroir de server/templates.js). */
export const EXTERNAL = new Set<string>(['L1', 'L3', 'L4', 'L5', 'L6', 'L7'])

export const META: Record<LCode, { name: string; short: string; audience: string; inputs: string }> = {
  L1: { name: 'Mail de remerciement', short: 'Merci', audience: 'Vendeur', inputs: 'D1 + découverte D5 + débrief vocal' },
  L2: { name: 'Synthèse équipe', short: 'Équipe', audience: 'Équipe agence', inputs: 'Fiche bien + photo + besoins du conseiller' },
  L3: { name: 'Avant-première acquéreurs', short: 'Acquéreurs', audience: 'Acquéreurs qualifiés', inputs: 'Critères du bien + recherches acquéreurs du CRM' },
  L4: { name: 'Kit réseaux sociaux', short: 'Réseaux', audience: 'Public', inputs: 'Faits du bien + photos + charte de marque' },
  L5: { name: 'Courrier voisinage', short: 'Voisinage', audience: 'Riverains', inputs: 'Bien + zone + agence' },
  L6: { name: 'Book de services', short: 'Book', audience: 'Vendeur', inputs: 'Besoins D5 + services disponibles + L2–L5, L8, L9' },
  L7: { name: 'Analyse & estimation', short: 'Estimation', audience: 'Vendeur', inputs: 'Données vérifiées D5 + DVF + annonces' },
  L8: { name: 'Avant / après', short: 'Projection', audience: 'Interne', inputs: 'Photos D5 + contraintes du bien' },
  L9: { name: 'Dossier copro & diagnostics', short: 'Copro', audience: 'Interne', inputs: 'Pièces déposées au dossier' },
}

/** Réglages propres à chaque livrable, stockés sur le parcours (`journey.deliv`) : ils survivent aux régénérations. */
export type DelivPrefs = {
  L1?: { confirmed?: string[] }
  L3?: { selected?: string[]; consent?: boolean; sellerOk?: boolean }
  L4?: { schedule?: Record<string, string>; original?: string[] }
  L5?: { volume?: number; streets?: string[]; exclusions?: string[]; date?: string }
  L7?: { rejected?: string[]; price?: number }
  L8?: { variant?: string }
  L9?: { verified?: string[] }
}

export type Ctx = {
  d: Dossier; p: Property; a: Agent; j: Journey
  doc?: StudioDocument; state: DelivState; outbox?: Outbox
  prefs: DelivPrefs
  setPrefs: <K extends keyof DelivPrefs>(k: K, v: NonNullable<DelivPrefs[K]>) => Promise<void>
  save: (patch: Partial<Journey>) => Promise<void>
  open: boolean; toggle: () => void
  openDeliverable: (code: string) => void
}

export const dt = (iso?: string) => (iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—')

/** Action asynchrone avec état d’attente et retour utilisateur. */
export function useBusy() {
  const [busy, setBusy] = useState<string | null>(null)
  const run = async <R,>(k: string, f: () => Promise<R>, ok?: string | ((r: R) => string)) => {
    setBusy(k)
    try { const r = await f(); if (ok) toast(typeof ok === 'function' ? ok(r) : ok); return r } catch (x) { toast(errText(x), 'error') } finally { setBusy(null) }
  }
  return { busy, run }
}

/** Feuille papier claire, quel que soit le thème (aperçu fidèle du document). */
export function Paper({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('theme-dark relative overflow-hidden rounded-xl bg-bone-50 font-serif text-ink shadow-float', className ?? 'p-5 md:p-7')}>{children}</div>
}

export const Eyebrow = ({ children, className }: { children: ReactNode; className?: string }) => <div className={clsx('text-[10.5px] uppercase tracking-eyebrow text-mist', className)}>{children}</div>

/** Panneau secondaire (colonne de contrôle à côté d’un aperçu). */
export function Panel({ title, children, action: act, className }: { title: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06]', className)}>
      <div className="mb-3 flex items-center justify-between gap-2"><Eyebrow>{title}</Eyebrow>{act}</div>
      {children}
    </div>
  )
}

/** Case à cocher sobre, persistée par l’appelant. */
export function Check({ on, onChange, children, disabled }: { on: boolean; onChange: (v: boolean) => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} disabled={disabled} onClick={() => onChange(!on)} className="flex w-full items-start gap-2.5 rounded-xl px-2 py-2 text-left text-[13px] transition hover:bg-white/[0.03] disabled:opacity-50">
      <span className={clsx('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] ring-1 transition', on ? 'bg-champagne text-ink ring-champagne' : 'ring-white/20')}>{on && <CheckCircle size={12} weight="bold" />}</span>
      <span className={on ? 'text-bone' : 'text-bone/70'}>{children}</span>
    </button>
  )
}

export function StatePill({ state }: { state: DelivState }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] ring-1 ${DELIV_TONE[state].c}`}>{state === 'running' && <CircleNotch size={10} className="animate-spin" />}{DELIV_TONE[state].l}</span>
}

/**
 * Coque d’un livrable : en-tête repliable (statut, version, audience), corps spécifique, pied d’actions.
 * `gate` : raison bloquant la validation (null = validable). `beforeValidate` : mise à jour du document juste avant validation.
 */
export function DelivSection({ code, ctx, gate, beforeValidate, children, aside }: {
  code: LCode; ctx: Ctx; gate?: string | null; beforeValidate?: () => Promise<void>; children: (doc: StudioDocument) => ReactNode; aside?: ReactNode
}) {
  const { d, doc, state, outbox, open, toggle } = ctx
  const { busy, run } = useBusy()
  const ext = EXTERNAL.has(code)
  const generate = () => run('gen', () => action('deliverable.generate', { dossierId: d.id, code }), doc ? `${code} · version ${doc.version + 1} générée` : `${code} généré`)
  const validate = () => run('ok', async () => { await beforeValidate?.(); return action('deliverable.validate', { dossierId: d.id, code }) }, ext ? `${code} validé — envoi consigné dans la file` : `${code} validé`)
  return (
    <section id={`deliv-${code}`} className="scroll-mt-36">
      <Card pad={false}>
        <div className="flex items-start gap-3 p-4 md:p-5">
          <button onClick={toggle} aria-expanded={open} className="group flex min-w-0 flex-1 items-start gap-3 text-left md:gap-4">
            <span className="num mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-champagne/10 text-[13px] text-champagne-300 ring-1 ring-champagne/25">{code}</span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="display text-[1.7rem] leading-none md:text-3xl">{META[code].name}</span>
                <StatePill state={state} />
                <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[10.5px] text-mist ring-1 ring-white/[0.07]">{ext ? <Globe size={11} /> : <LockSimple size={11} />}{ext ? `Externe · ${META[code].audience}` : 'Interne'}</span>
              </span>
              <span className="mt-1.5 block text-[12px] text-mist">
                {doc ? <>Version <span className="num text-bone/80">{doc.version}</span> · {doc.edited ? 'modifiée' : 'préparée'} le {dt(doc.editedAt ?? doc.createdAt)} · <span className="num">{doc.sources?.length ?? 0}</span> source{(doc.sources?.length ?? 0) > 1 ? 's' : ''}{doc.validatedAt && <> · validée le {dt(doc.validatedAt)}</>}</> : state === 'done' ? 'Validé avant NXT — aucun aperçu conservé' : `Entrées : ${META[code].inputs}`}
              </span>
            </span>
            <CaretDown size={16} className={clsx('mt-2 shrink-0 text-mist transition-transform duration-500 ease-silk group-hover:text-bone', open && 'rotate-180')} />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.55, ease: EXPO }} className="overflow-hidden">
              <div className="border-t border-white/[0.05] p-4 md:p-5">
                {doc?.checks && doc.checks.length > 0 && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-coral/10 px-3.5 py-3 text-[12.5px] text-coral ring-1 ring-coral/20"><Warning size={16} weight="fill" className="mt-px shrink-0" /><span>Contrôle AUT-058 : {doc.checks.join(' · ')}</span></div>
                )}
                {state === 'running' && !doc && (
                  <div className="relative overflow-hidden rounded-2xl bg-white/[0.02] p-10 text-center ring-1 ring-white/[0.06]">
                    <span className="absolute inset-x-0 top-0 h-24 animate-scan bg-gradient-to-b from-transparent via-champagne/15 to-transparent" />
                    <CircleNotch size={22} className="mx-auto animate-spin text-champagne" />
                    <p className="mt-3 text-[13.5px] text-bone/60">Le copilote prépare {code} à partir des faits du dossier : {META[code].inputs.toLowerCase()}.</p>
                  </div>
                )}
                {!doc && state !== 'running' && (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center md:p-10">
                    <Sparkle size={22} className="mx-auto text-champagne" />
                    <p className="mx-auto mt-3 max-w-md text-[13.5px] text-bone/60">{state === 'done' ? 'Ce livrable a été validé avant l’arrivée du dossier dans NXT. Générer un aperçu crée une nouvelle version, à revalider.' : `Le copilote prépare ce livrable à partir de : ${META[code].inputs.toLowerCase()}. Chaque chiffre sera sourcé et daté.`}</p>
                    <div className="mt-5"><SoftBtn tone="gold" icon={<Sparkle size={13} weight="fill" />} onClick={generate} disabled={!!busy}>{busy === 'gen' ? 'Génération…' : state === 'done' ? 'Générer un aperçu' : 'Générer maintenant'}</SoftBtn></div>
                  </div>
                )}
                {doc && children(doc)}

                {doc && (
                  <div className="mt-5 flex flex-col gap-4 border-t border-white/[0.05] pt-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap gap-1.5">{(doc.sources ?? []).map((s, i) => <span key={i} className="rounded-full bg-white/[0.03] px-2.5 py-1 text-[11px] text-bone/60 ring-1 ring-white/[0.06]"><span className="num text-mist">[{i + 1}]</span> {s.label} · {s.date}</span>)}{!doc.sources?.length && <span className="text-[11.5px] text-coral">Aucune source citée</span>}</div>
                      {ext && (
                        <div className="flex items-center gap-2 text-[12px] text-mist">
                          <PaperPlaneTilt size={13} className={outbox ? 'text-sea' : 'text-mist'} />
                          {outbox ? <span>Envoi consigné · <span className="text-bone/80">{outbox.channel}</span> → {outbox.to} · <span className="text-sea">{outbox.status}</span> ({dt(outbox.at)})</span> : <span>Envoi consigné après validation — aucun envoi réel sans connecteur configuré.</span>}
                        </div>
                      )}
                      {aside}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <SoftBtn icon={<ArrowSquareOut size={14} />} onClick={() => ctx.openDeliverable(code)}>Ouvrir</SoftBtn>
                      <SoftBtn icon={<ArrowsClockwise size={14} className={busy === 'gen' ? 'animate-spin' : ''} />} onClick={generate} disabled={!!busy}>{busy === 'gen' ? 'Génération…' : 'Régénérer'}</SoftBtn>
                      {state !== 'done' && (
                        <span title={gate ?? undefined}><SoftBtn tone="gold" icon={<CheckCircle size={14} />} onClick={validate} disabled={!!busy || !!gate || state === 'blocked'}>{busy === 'ok' ? 'Validation…' : 'Valider'}</SoftBtn></span>
                      )}
                    </div>
                  </div>
                )}
                {doc && state !== 'done' && (gate || state === 'blocked') && <p className="mt-2 text-right text-[11.5px] text-champagne-300">{state === 'blocked' ? 'Bloqué : corrigez les points signalés puis régénérez.' : gate}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </section>
  )
}
