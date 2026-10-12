// Étape 3 du parcours vendeur — les neuf livrables post-RDV, de la génération à la validation.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { Sparkle, CheckCircle, ArrowsInLineVertical, ArrowsOutLineVertical, LockSimple, Globe, ArrowRight } from '@phosphor-icons/react'
import { Card, SoftBtn, Stagger, DELIV_TONE } from '../ui'
import { EXPO } from '../../ui/kit'
import { action } from '../../data/store'
import { useDocuments, useOutbox } from '../../data/collections'
import { prop, agent, type DelivState } from '../../data/mock'
import type { Journey } from '../../data/dossier'
import type { StudioDocument } from '../../data/studio'
import type { StepProps } from './index'
import { L_CODES, EXTERNAL, META, useBusy, type LCode, type Ctx, type DelivPrefs } from './deliv-kit'
import { L1Section, L2Section, L3Section, L4Section, L5Section } from './deliv-outreach'
import { L6Section, L7Section, L8Section, L9Section } from './deliv-dossier'

const SECTIONS: Record<LCode, (p: { ctx: Ctx }) => React.ReactNode> = { L1: L1Section, L2: L2Section, L3: L3Section, L4: L4Section, L5: L5Section, L6: L6Section, L7: L7Section, L8: L8Section, L9: L9Section }
const TXT: Record<DelivState, string> = { done: 'text-sage', review: 'text-champagne-300', running: 'text-sea', waiting: 'text-mist', blocked: 'text-coral' }
const DOT: Record<DelivState, string> = { done: 'bg-sage', review: 'bg-champagne', running: 'bg-sea animate-pulse', waiting: 'bg-white/25', blocked: 'bg-coral' }

export default function StepDeliverables({ dossier: d, journey, save, openDeliverable, goTo }: StepProps) {
  const p = prop(d.propertyId), a = agent(d.agentId)
  const [docs] = useDocuments()
  const [outbox] = useOutbox()
  const { busy, run } = useBusy()
  const prefs = (journey as Journey & { deliv?: DelivPrefs }).deliv ?? {}
  const st = (c: LCode): DelivState => d.deliverables[c] ?? 'waiting'
  const docOf = (c: LCode) => docs.find((x) => x.id === `${d.id}-${c}`) as StudioDocument | undefined
  // Repli par défaut : ouvert tant que le livrable n’est pas prêt ; un clic de l’utilisateur prime ensuite.
  const [openOverride, setOpen] = useState<Record<string, boolean>>({})
  const open = Object.fromEntries(L_CODES.map((c) => [c, openOverride[c] ?? st(c) !== 'done'])) as Record<string, boolean>
  const [active, setActive] = useState<LCode>('L1')
  const friezeRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  // Navigation : la barre collante n’apparaît qu’une fois la frise sortie de l’écran ; la section visible est suivie.
  useEffect(() => {
    const onScroll = () => {
      setStuck((friezeRef.current?.getBoundingClientRect().bottom ?? 1) < 64)
      const cur = [...L_CODES].reverse().find((c) => (document.getElementById(`deliv-${c}`)?.getBoundingClientRect().top ?? 1e9) < 180)
      if (cur) setActive(cur)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Sur mobile, la pastille active reste visible dans la barre défilante.
  useEffect(() => {
    const nav = document.querySelector<HTMLElement>('nav[aria-label="Livrables"]'), b = nav?.querySelector<HTMLElement>(`[data-code="${active}"]`)
    if (nav && b) nav.scrollTo({ left: b.offsetLeft - nav.clientWidth / 2 + b.clientWidth / 2, behavior: 'smooth' })
  }, [active, stuck])

  const jump = (c: LCode) => { setOpen((o) => ({ ...o, [c]: true })); requestAnimationFrame(() => document.getElementById(`deliv-${c}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }
  const setPrefs: Ctx['setPrefs'] = (k, v) => save({ deliv: { ...prefs, [k]: v } } as Partial<Journey>)

  const counts = { done: 0, review: 0, running: 0, waiting: 0, blocked: 0 } as Record<DelivState, number>
  L_CODES.forEach((c) => counts[st(c)]++)
  // Inclut les « en cours » sans document : l’amorce de démo en contient qui n’ont aucune génération réelle derrière.
  const missing = L_CODES.filter((c) => !docOf(c))
  const safe = L_CODES.filter((c) => !EXTERNAL.has(c) && st(c) === 'review' && docOf(c) && !docOf(c)!.checks?.length)
  const allOpen = L_CODES.every((c) => open[c])

  const generateMissing = () => run('gen', async () => {
    const fresh = missing.filter((c) => st(c) !== 'done'), redo = missing.filter((c) => st(c) === 'done')
    if (fresh.length) await action('deliverable.generateAll', { dossierId: d.id, codes: fresh })
    for (const code of redo) await action('deliverable.generate', { dossierId: d.id, code })
    setOpen((o) => ({ ...o, ...Object.fromEntries(missing.map((c) => [c, true])) }))
  }, `${missing.length} livrable${missing.length > 1 ? 's' : ''} lancé${missing.length > 1 ? 's' : ''} — génération en cours`)
  const validateSafe = () => run('safe', async () => { for (const code of safe) await action('deliverable.validate', { dossierId: d.id, code }) }, `${safe.join(', ')} validé${safe.length > 1 ? 's' : ''}`)

  const pills = (compact: boolean) => L_CODES.map((c) => (
    <button key={c} data-code={c} onClick={() => jump(c)} className={clsx('relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px]', compact && active === c ? 'text-bone' : 'text-bone/60 hover:text-bone')}>
      {compact && active === c && <motion.span layoutId="deliv-nav" className="absolute inset-0 rounded-full bg-white/[0.09] ring-1 ring-white/10" transition={{ duration: 0.5, ease: EXPO }} />}
      <span className={clsx('relative h-1.5 w-1.5 rounded-full', DOT[st(c)])} /><span className="num relative">{c}</span>
    </button>
  ))

  return (
    <>
      <Stagger>
        <Card>
          <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
            <div>
              <div className="text-[10.5px] uppercase tracking-eyebrow text-mist">Étape 3 · post-rendez-vous · {d.seller}</div>
              <h2 className="display mt-2 text-4xl md:text-5xl">Neuf livrables, <span className="italic text-champagne-300">une</span> relecture.</h2>
              <p className="mt-2 max-w-xl text-[13px] text-bone/55">Préparés depuis la découverte D5, chaque chiffre sourcé et daté. Rien ne sort de l’agence sans votre validation : les envois externes sont consignés tant que les connecteurs ne sont pas configurés.</p>
            </div>
            <div className="grid shrink-0 grid-cols-4 gap-2 rounded-2xl bg-white/[0.02] py-3 text-center ring-1 ring-white/[0.05] sm:gap-4 2xl:bg-transparent 2xl:py-0 2xl:ring-0">
              {([['done', 'Prêts', 'text-sage'], ['review', 'À valider', 'text-champagne-300'], ['running', 'En cours', 'text-sea'], ['blocked', 'Bloqués', 'text-coral']] as const).map(([k, l, c]) => <div key={k}><div className={clsx('display text-[2.4rem] leading-none', counts[k] ? c : 'text-bone/30')}>{counts[k]}</div><div className="mt-1 whitespace-nowrap text-[9.5px] uppercase tracking-[0.14em] text-mist sm:text-[10.5px] sm:tracking-eyebrow">{l}</div></div>)}
            </div>
          </div>

          <div ref={friezeRef} className="thin-scroll -mx-1 mt-6 overflow-x-auto px-1 pb-1 [contain:inline-size]">
            <ol className="relative grid min-w-[620px] grid-cols-9 gap-1">
              <div className="absolute left-4 right-4 top-[19px] h-px bg-white/[0.08]" aria-hidden />
              {L_CODES.map((c, i) => {
                const s = st(c), doc = docOf(c)
                return (
                  <motion.li key={c} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 + i * 0.04, ease: EXPO }}>
                    <button onClick={() => jump(c)} title={META[c].name} className="group relative flex w-full flex-col items-center rounded-2xl px-1.5 pb-3 pt-0 text-center transition hover:bg-white/[0.03]">
                      <span className={clsx('num relative flex h-10 w-10 items-center justify-center rounded-full text-[12.5px] ring-1 transition', s === 'done' ? 'bg-sage/15 text-sage ring-sage/30' : s === 'review' ? 'bg-champagne/15 text-champagne-300 ring-champagne/35' : s === 'blocked' ? 'bg-coral/15 text-coral ring-coral/30' : s === 'running' ? 'bg-sea/15 text-sea ring-sea/30' : 'bg-ink-700 text-bone/45 ring-white/10')}>
                        {s === 'done' ? <CheckCircle size={17} weight="fill" /> : c}
                        {s === 'running' && <span className="absolute inset-0 animate-pulseRing rounded-full ring-1 ring-sea/50" />}
                      </span>
                      <span className="mt-2 w-full truncate text-[11.5px] leading-tight text-bone/85">{META[c].short}</span>
                      <span className={clsx('mt-1 text-[10.5px]', TXT[s])}>{DELIV_TONE[s].l}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[10px] text-mist">{EXTERNAL.has(c) ? <Globe size={10} /> : <LockSimple size={10} />}{doc ? `v${doc.version}` : '—'}</span>
                    </button>
                  </motion.li>
                )
              })}
            </ol>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-white/[0.05] pt-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <SoftBtn tone="gold" icon={<Sparkle size={13} weight="fill" />} disabled={!!busy || !missing.length} onClick={generateMissing}>{busy === 'gen' ? 'Lancement…' : missing.length ? `Générer les manquants (${missing.length})` : 'Tous les livrables sont générés'}</SoftBtn>
              <span title={safe.length ? `Internes sans alerte : ${safe.join(', ')}` : 'Aucun livrable interne sûr en attente'}>
                <SoftBtn icon={<CheckCircle size={14} />} disabled={!!busy || !safe.length} onClick={validateSafe}>{busy === 'safe' ? 'Validation…' : `Valider les internes sûrs${safe.length ? ` · ${safe.join(', ')}` : ''}`}</SoftBtn>
              </span>
              <SoftBtn icon={allOpen ? <ArrowsInLineVertical size={14} /> : <ArrowsOutLineVertical size={14} />} onClick={() => setOpen(Object.fromEntries(L_CODES.map((c) => [c, !allOpen])))}>{allOpen ? 'Tout replier' : 'Tout déplier'}</SoftBtn>
            </div>
            <p className="text-[11.5px] text-mist">Les externes (L1, L3–L7) restent en relecture individuelle.</p>
          </div>
        </Card>
      </Stagger>

      {/* Hauteur nulle : la barre se superpose sans décaler le contenu quand elle apparaît. */}
      <div className="sticky top-[72px] z-20 !mt-0 h-0">
        <AnimatePresence>
          {stuck && (
            <motion.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: EXPO }} aria-label="Livrables" className="glass thin-scroll flex gap-1 overflow-x-auto [contain:inline-size] rounded-full p-1 shadow-float ring-1 ring-white/10">
              {pills(true)}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      {L_CODES.map((c, i) => {
        const S = SECTIONS[c]
        const ctx: Ctx = {
          d, p, a, j: journey, doc: docOf(c), state: st(c), prefs, setPrefs, save,
          outbox: outbox.filter((o) => o.dossierId === d.id && o.code === c).sort((x, y) => y.at.localeCompare(x.at))[0],
          open: !!open[c], toggle: () => setOpen((o) => ({ ...o, [c]: !open[c] })), openDeliverable,
        }
        return <Stagger key={c} i={Math.min(i + 1, 5)}><S ctx={ctx} /></Stagger>
      })}

      <Stagger i={6}>
        <button onClick={() => goTo('mandate')} className="group flex w-full items-center justify-between rounded-[1.4rem] bg-white/[0.02] px-5 py-4 text-left ring-1 ring-white/[0.06] transition hover:bg-white/[0.04]">
          <span><span className="block text-[10.5px] uppercase tracking-eyebrow text-mist">Étape suivante</span><span className="display text-2xl">Mandat <span className="italic text-champagne-300">&</span> signature</span></span>
          <ArrowRight size={18} className="text-champagne-300 transition-transform group-hover:translate-x-1" />
        </button>
      </Stagger>
    </>
  )
}
