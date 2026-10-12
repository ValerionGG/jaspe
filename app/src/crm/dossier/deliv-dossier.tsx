// Livrables de fond : L6 book de services, L7 analyse & estimation, L8 avant/après, L9 copro & diagnostics.
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import clsx from 'clsx'
import { CaretLeft, CaretRight, ArrowsLeftRight, ArrowSquareOut, CheckCircle, Warning, XCircle, MinusCircle, ClockCounterClockwise, PaperPlaneTilt, Quotes, Info } from '@phosphor-icons/react'
import { EXPO } from '../../ui/kit'
import { SoftBtn } from '../ui'
import { AiBadge } from '../studio-docs'
import { action } from '../../data/store'
import { useTasks, useConversations, useTemplates, useFiles } from '../../data/collections'
import { COMPARABLES, eur, fmt, type DelivState } from '../../data/mock'
import { DelivSection, Paper, Panel, Eyebrow, useBusy, type Ctx } from './deliv-kit'

/* ——— L6 · Book de services (pages feuilletables) ——— */
const DEPS: Record<number, string[]> = { 1: ['L7'], 2: ['L8'], 3: ['L3', 'L4', 'L5'], 4: [] }
const DEP_TONE = (s?: DelivState) => (s === 'done' ? 'bg-sage/15 text-sage-600' : s === 'blocked' ? 'bg-coral/15 text-coral' : 'bg-champagne-600/15 text-champagne-700')

export function L6Section({ ctx }: { ctx: Ctx }) {
  const { d, p, a } = ctx
  const [page, setPage] = useState(0)
  const [dir, setDir] = useState(1)
  return (
    <DelivSection code="L6" ctx={ctx}>
      {(doc) => {
        const [head = `Notre accompagnement pour ${d.seller}`, ...rest] = doc.body ?? []
        const services = rest.filter((t) => /^\d\./.test(t)).map((t) => ({ n: Number(t[0]), text: t.replace(/^\d\.\s*/, '') }))
        const foot = rest.filter((t) => !/^\d\./.test(t))
        const pages = [{ kind: 'cover' as const }, ...services.map((s) => ({ kind: 'service' as const, ...s })), { kind: 'end' as const }]
        const go = (i: number) => { setDir(i > page ? 1 : -1); setPage(Math.max(0, Math.min(pages.length - 1, i))) }
        const cur = pages[Math.min(page, pages.length - 1)]
        const pending = Object.values(DEPS).flat().filter((c) => d.deliverables[c] !== 'done')
        return (
          <div className="space-y-4">
            <div className="relative" style={{ perspective: 1600 }}>
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div key={page} custom={dir} initial={{ rotateY: dir * 24, opacity: 0, x: dir * 40 }} animate={{ rotateY: 0, opacity: 1, x: 0 }} exit={{ rotateY: dir * -18, opacity: 0, x: dir * -30 }} transition={{ duration: 0.6, ease: EXPO }} style={{ transformOrigin: dir > 0 ? 'left center' : 'right center' }}>
                  <Paper className="min-h-[360px] p-0 md:min-h-[420px]">
                    {cur.kind === 'cover' && (
                      <div className="relative h-[360px] md:h-[420px]">
                        <img src={p.photo} alt={p.title} className="absolute inset-0 h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-ink/45" />
                        <div className="absolute left-5 top-5 text-[22px] italic text-bone">Maison Riviera<span className="text-champagne-300">.</span></div>
                        <div className="absolute inset-x-6 bottom-6 text-bone md:inset-x-8 md:bottom-8">
                          <div className="font-sans text-[10px] uppercase tracking-eyebrow text-champagne-300">Book de services · {d.ref}</div>
                          <div className="mt-2 text-[34px] leading-[1.02] md:text-[46px]">{head}</div>
                          <div className="mt-2 font-sans text-[12px] text-bone/70">{p.title} · {p.address}, {p.city} · préparé par {a.name}</div>
                        </div>
                      </div>
                    )}
                    {cur.kind === 'service' && (
                      <div className="grid h-full md:min-h-[420px] md:grid-cols-2">
                        <div className="relative h-48 md:h-auto"><img src={p.gallery[cur.n % p.gallery.length] ?? p.photo} alt="" className="absolute inset-0 h-full w-full object-cover" /></div>
                        <div className="flex flex-col p-6 md:p-8">
                          <div className="font-sans text-[10px] uppercase tracking-eyebrow text-ink/45">Engagement {String(cur.n).padStart(2, '0')}</div>
                          <div className="num mt-2 text-[44px] leading-none text-champagne-700">0{cur.n}</div>
                          <p className="mt-4 text-[21px] leading-snug">{cur.text}</p>
                          <div className="mt-auto pt-6 font-sans">
                            {(DEPS[cur.n] ?? []).length > 0 ? (
                              <>
                                <div className="text-[10px] uppercase tracking-eyebrow text-ink/45">Modules liés</div>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">{DEPS[cur.n].map((c) => <span key={c} className={clsx('rounded-full px-2.5 py-1 text-[11px]', DEP_TONE(d.deliverables[c]))}>{c} · {d.deliverables[c] === 'done' ? 'prêt' : d.deliverables[c] === 'blocked' ? 'bloqué' : 'en attente'}</span>)}</div>
                              </>
                            ) : <div className="text-[11px] text-ink/50">Rythme convenu avec le vendeur : bilan J+7, J+21, J+42.</div>}
                          </div>
                        </div>
                      </div>
                    )}
                    {cur.kind === 'end' && (
                      <div className="flex h-full flex-col justify-center p-8 md:min-h-[420px] md:p-12">
                        <div className="font-sans text-[10px] uppercase tracking-eyebrow text-ink/45">Notre parole</div>
                        <div className="mt-3 text-[30px] leading-tight md:text-[38px]">Des engagements datés, <span className="italic text-champagne-700">jamais</span> une promesse de résultat.</div>
                        <div className="mt-5 space-y-2 font-sans text-[13px] text-ink/70">{foot.map((t) => <p key={t}>{t}</p>)}<p>Honoraires et durée du mandat présentés séparément, conformément au barème affiché en agence.</p></div>
                        <div className="mt-8 flex items-center gap-3 font-sans"><img src={a.photo} alt="" className="h-11 w-11 rounded-full object-cover" /><div className="text-[12px] leading-tight"><div className="font-medium">{a.name}</div><div className="text-ink/50">{a.role} · {a.agency}</div></div></div>
                      </div>
                    )}
                    <div className="absolute bottom-3 right-4 font-sans text-[10px] text-ink/40">{page + 1} / {pages.length}</div>
                  </Paper>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button aria-label="Page précédente" disabled={page === 0} onClick={() => go(page - 1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] disabled:opacity-30"><CaretLeft size={14} /></button>
                <div className="flex gap-1.5">{pages.map((_, i) => <button key={i} aria-label={`Page ${i + 1}`} onClick={() => go(i)} className={clsx('h-1.5 rounded-full transition-all duration-500 ease-silk', i === page ? 'w-6 bg-champagne' : 'w-1.5 bg-white/20 hover:bg-white/40')} />)}</div>
                <button aria-label="Page suivante" disabled={page === pages.length - 1} onClick={() => go(page + 1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.08] transition hover:bg-white/[0.08] disabled:opacity-30"><CaretRight size={14} /></button>
              </div>
              <span className={clsx('flex items-center gap-1.5 text-[12px]', pending.length ? 'text-champagne-300' : 'text-sage')}>{pending.length ? <Warning size={14} weight="fill" /> : <CheckCircle size={14} weight="fill" />}{pending.length ? `Modules à finaliser avant remise : ${pending.join(', ')}` : 'Tous les modules liés sont validés'}</span>
            </div>
          </div>
        )
      }}
    </DelivSection>
  )
}

/* ——— L7 · Analyse & estimation ——— */
type Comp = { addr: string; date: string; surface: number; price: number; kind: string; dist: string }
function comparablesOf(p: Ctx['p']): Comp[] {
  if (p.id === 'p1') return COMPARABLES
  // ponytail: échantillon dérivé du prix au m² du bien tant que l’import DVF par secteur n’est pas branché
  const ppm = p.price / p.surface
  return [[1.06, 1.08, 'mars 2026', '380 m'], [0.95, 0.92, 'janv. 2026', '540 m'], [0.9, 0.86, 'nov. 2025', '820 m'], [1.14, 1.04, 'en ligne', '1 km'], [1.01, 0.98, 'sept. 2025', '700 m']].map(([k, s, date, dist], i) => ({
    addr: `${p.district} · mutation ${['A', 'B', 'C', 'D', 'E'][i]}`, date: date as string, surface: Math.round(p.surface * (s as number)), price: Math.round((ppm * (k as number) * p.surface * (s as number)) / 1e4) * 1e4, kind: date === 'en ligne' ? 'Annonce · 81 j' : 'Vendu · DVF', dist: dist as string,
  }))
}
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0 }
const ADJUST = [['Vue mer / dégagement', '+6 %', 'Grille réseau 2026'], ['État et année de construction', '+3 %', 'Découverte D5'], ['Terrain et piscine', '+2 %', 'Cadastre PCI'], ['Marge de négociation constatée', '−4 %', 'DVF vs annonces, 12 mois']]

export function L7Section({ ctx }: { ctx: Ctx }) {
  const { p, j } = ctx
  const pref = ctx.prefs.L7 ?? {}
  const rejected = pref.rejected ?? COMPARABLES.filter((c) => !c.keep).map((c) => c.addr)
  const [price, setPrice] = useState(pref.price ?? (j.mandate.price || p.price))
  const { busy, run } = useBusy()
  return (
    <DelivSection code="L7" ctx={ctx}>
      {(doc) => {
        const comps = comparablesOf(p)
        const kept = comps.filter((c) => !rejected.includes(c.addr) && c.kind.startsWith('Vendu'))
        const ppm = median(kept.map((c) => c.price / c.surface))
        const calc: [number, number] = [Math.round((ppm * p.surface * 0.95) / 1e4) * 1e4, Math.round((ppm * p.surface * 1.05) / 1e4) * 1e4]
        const [lo, hi] = doc.range ?? [p.estimateLow, p.estimateHigh]
        const min = Math.round((lo * 0.85) / 1e4) * 1e4, max = Math.round((hi * 1.15) / 1e4) * 1e4
        const pos = (v: number) => `${Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100))}%`
        const gap = price > hi ? (price - hi) / hi : price < lo ? (price - lo) / lo : 0
        const verdict = gap > 0 ? { t: `Au-dessus de la fourchette de ${Math.round(gap * 100)} % : argumentaire requis, risque de délai allongé`, c: 'text-coral' } : gap < 0 ? { t: `Sous la fourchette de ${Math.round(-gap * 100)} % : vente rapide probable, valeur laissée sur la table`, c: 'text-champagne-300' } : { t: 'Dans la fourchette retenue : prix défendable devant les acquéreurs', c: 'text-sage' }
        const toggle = (addr: string) => ctx.setPrefs('L7', { ...pref, rejected: rejected.includes(addr) ? rejected.filter((x) => x !== addr) : [...rejected, addr] })
        return (
          <div className="space-y-5">
            <div className="grid gap-4 2xl:grid-cols-[1.3fr_1fr]">
              <Panel title="Fourchette retenue · avis de valeur">
                <div className="display text-[2.6rem] leading-none md:text-5xl">{eur(lo)} – {eur(hi)}</div>
                <div className="num mt-1 text-[12px] text-mist">{fmt(Math.round(lo / p.surface))} – {fmt(Math.round(hi / p.surface))} €/m² · {p.surface} m² · DPE {p.dpe}</div>
                <div className="relative mt-8 h-2 rounded-full bg-white/[0.08]">
                  <div className="absolute inset-y-0 rounded-full bg-gradient-to-r from-champagne-700 to-champagne" style={{ left: pos(lo), right: `calc(100% - ${pos(hi)})` }} />
                  <div className="absolute -top-1 h-4 w-px bg-sea" style={{ left: pos(calc[0]) }} title="Recalcul bas" /><div className="absolute -top-1 h-4 w-px bg-sea" style={{ left: pos(calc[1]) }} title="Recalcul haut" />
                  <motion.div className="absolute -top-6 -translate-x-1/2" animate={{ left: pos(price) }} transition={{ duration: 0.3, ease: EXPO }}><span className="num whitespace-nowrap rounded-full bg-bone px-2 py-0.5 text-[11px] text-ink">{eur(price)}</span></motion.div>
                  <motion.div className="absolute -top-1.5 h-5 w-0.5 rounded bg-bone" animate={{ left: pos(price) }} transition={{ duration: 0.3, ease: EXPO }} />
                </div>
                <input type="range" min={min} max={max} step={10000} value={price} onChange={(e) => setPrice(+e.target.value)} onPointerUp={() => ctx.setPrefs('L7', { ...pref, rejected, price })} onKeyUp={() => ctx.setPrefs('L7', { ...pref, rejected, price })} aria-label="Prix de présentation simulé" className="mt-4 w-full accent-[rgb(var(--acc-500))]" />
                <div className="flex justify-between text-[10.5px] text-mist"><span className="num">{eur(min)}</span><span className="num">{eur(max)}</span></div>
                <p className={clsx('mt-3 text-[13px]', verdict.c)}>{verdict.t}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <SoftBtn disabled={!!busy || price === j.mandate.price} onClick={() => run('m', () => ctx.save({ mandate: { ...j.mandate, price } }), `Prix de ${eur(price)} reporté au mandat`)}>{busy === 'm' ? 'Report…' : 'Reporter au mandat'}</SoftBtn>
                  <span className="text-[11.5px] text-mist">Mandat : {j.mandate.price ? eur(j.mandate.price) : 'prix non fixé'} · vendeur : {j.discovery.prixSouhaite?.v ?? 'non déclaré'}</span>
                </div>
              </Panel>
              <Panel title="Recalcul déterministe">
                <div className="display text-4xl text-sea">{eur(calc[0])} – {eur(calc[1])}</div>
                <p className="mt-2 text-[12.5px] text-bone/70">Médiane de <span className="num">{fmt(Math.round(ppm))}</span> €/m² sur <span className="num">{kept.length}</span> vente{kept.length > 1 ? 's' : ''} DVF retenue{kept.length > 1 ? 's' : ''}, ±5 %. Calculé hors génération de texte.</p>
                <div className="mt-4 space-y-1.5">{ADJUST.map(([k, v, s]) => <div key={k} className="flex items-center justify-between gap-3 text-[12.5px]"><span className="text-bone/75">{k}</span><span className="flex items-center gap-2"><span className="text-[10.5px] text-mist">{s}</span><span className={clsx('num w-11 text-right', v.startsWith('+') ? 'text-sage' : 'text-coral')}>{v}</span></span></div>)}</div>
                <p className="mt-3 border-t border-white/[0.05] pt-3 text-[11.5px] text-mist">Avis de valeur professionnel, pas une expertise. La largeur de la fourchette reflète l’incertitude de l’échantillon.</p>
              </Panel>
            </div>
            <Panel title={`Comparables · ${kept.length} retenus sur ${comps.length}`}>
              <div className="thin-scroll -mx-1 overflow-x-auto [contain:inline-size]">
                <table className="w-full min-w-[640px] whitespace-nowrap text-[12.5px]">
                  <thead><tr className="text-left text-[10.5px] uppercase tracking-eyebrow text-mist"><th className="px-2 py-2 font-normal">Adresse</th><th className="px-2 font-normal">Date</th><th className="px-2 font-normal">Nature</th><th className="px-2 text-right font-normal">Surface</th><th className="px-2 text-right font-normal">Prix</th><th className="px-2 text-right font-normal">€/m²</th><th className="px-2 text-right font-normal">Distance</th><th className="px-2 text-right font-normal">Retenu</th></tr></thead>
                  <tbody>
                    {comps.map((c) => {
                      const on = !rejected.includes(c.addr), sale = c.kind.startsWith('Vendu')
                      return (
                        <tr key={c.addr} className={clsx('border-t border-white/[0.05]', !on && 'opacity-45')}>
                          <td className="px-2 py-2.5">{c.addr}</td><td className="px-2 text-mist">{c.date}</td>
                          <td className="px-2"><span className={clsx('rounded-full px-2 py-0.5 text-[10.5px]', sale ? 'bg-sea/10 text-sea' : 'bg-white/[0.05] text-mist')}>{c.kind}</span></td>
                          <td className="num px-2 text-right">{c.surface} m²</td><td className="num px-2 text-right">{eur(c.price)}</td><td className="num px-2 text-right">{fmt(Math.round(c.price / c.surface))}</td><td className="px-2 text-right text-mist">{c.dist}</td>
                          <td className="px-2 text-right"><button role="switch" aria-checked={on} aria-label={`Retenir ${c.addr}`} onClick={() => toggle(c.addr)} className={clsx('relative inline-flex h-5 w-9 rounded-full ring-1 transition', on ? 'bg-champagne/80 ring-champagne' : 'bg-white/[0.05] ring-white/10')}><span className={clsx('absolute top-0.5 h-4 w-4 rounded-full bg-snow shadow-sm transition-all duration-300 ease-silk', on ? 'left-[18px]' : 'left-0.5')} /></button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-mist"><Info size={13} />Les annonces ne servent que de repère de concurrence : elles n’entrent jamais dans le recalcul.</p>
            </Panel>
          </div>
        )
      }}
    </DelivSection>
  )
}

/* ——— L8 · Avant / après ——— */
const VARIANTS = [
  { id: 'staging', label: 'Home staging virtuel', filter: 'saturate(1.18) sepia(.08) brightness(1.05)', items: [['Mobilier contemporain (virtuel)', 'Décoration', 0, 0], ['Home staging réel · location 3 mois', 'Décoration', 2800, 3600], ['Peinture murs blanc cassé', 'Travaux', 3200, 4100]] },
  { id: 'light', label: 'Lumière naturelle', filter: 'brightness(1.14) contrast(1.05) saturate(1.06)', items: [['Remplacement des luminaires', 'Décoration', 900, 1400], ['Voilages lin clair', 'Décoration', 650, 980], ['Spots encastrés LED', 'Travaux', 1800, 2600]] },
  { id: 'floor', label: 'Sols harmonisés', filter: 'contrast(1.1) saturate(1.04) hue-rotate(-4deg)', items: [['Parquet chêne contrecollé · 68 m²', 'Travaux', 5400, 7300], ['Plinthes et seuils', 'Travaux', 700, 1100], ['Tapis et finitions', 'Décoration', 400, 800]] },
] as const

export function L8Section({ ctx }: { ctx: Ctx }) {
  const { p } = ctx
  const [room, setRoom] = useState(Math.min(1, p.gallery.length - 1))
  const [x, setX] = useState(50)
  const variant = VARIANTS.find((v) => v.id === ctx.prefs.L8?.variant) ?? VARIANTS[0]
  const photo = p.gallery[room] ?? p.photo
  const [lo, hi] = variant.items.reduce(([a, b], it) => [a + it[2], b + it[3]], [0, 0])
  return (
    <DelivSection code="L8" ctx={ctx}>
      {() => (
        <div className="grid items-start gap-5 2xl:grid-cols-[1.45fr_1fr]">
          <div className="space-y-3">
            <div className="theme-dark relative aspect-[16/10] overflow-hidden rounded-xl">
              <img src={photo} alt="Projection retouchée par IA" className="absolute inset-0 h-full w-full object-cover" style={{ filter: variant.filter }} />
              <img src={photo} alt="Photo originale" className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }} />
              <div className="pointer-events-none absolute inset-y-0 w-px bg-bone" style={{ left: `${x}%` }}><span className="absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-bone text-ink shadow-float"><ArrowsLeftRight size={15} /></span></div>
              <span className="absolute left-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-eyebrow text-bone backdrop-blur">Avant · original</span>
              <span className="absolute right-3 top-3 rounded-full bg-champagne px-2.5 py-1 text-[10px] font-medium uppercase tracking-eyebrow text-ink">Après</span>
              <AiBadge className="absolute bottom-3 right-3" label="Image virtuelle — IA" />
              <input type="range" min={0} max={100} value={x} onChange={(e) => setX(+e.target.value)} aria-label="Comparer avant et après" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {p.gallery.map((g, i) => <button key={g} aria-label={`Pièce ${i + 1}`} onClick={() => setRoom(i)} className={clsx('h-12 w-16 overflow-hidden rounded-lg ring-2 transition', i === room ? 'ring-champagne' : 'ring-transparent opacity-60 hover:opacity-100')}><img src={g} alt="" className="h-full w-full object-cover" /></button>)}
              <a href={photo} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-champagne-300 hover:underline"><ArrowSquareOut size={13} />Original conservé · ouvrir</a>
            </div>
          </div>
          <div className="space-y-4">
            <Panel title="Variante">
              <div className="flex flex-wrap gap-1.5">{VARIANTS.map((v) => <button key={v.id} onClick={() => ctx.setPrefs('L8', { variant: v.id })} className={clsx('rounded-full px-3 py-1.5 text-[12.5px] ring-1 transition', v.id === variant.id ? 'bg-champagne/15 text-champagne-300 ring-champagne/30' : 'bg-white/[0.03] text-bone/70 ring-white/[0.07] hover:bg-white/[0.06]')}>{v.label}</button>)}</div>
              <p className="mt-3 text-[12px] text-mist">Structure, ouvertures et volumes préservés. Étiquette « Image virtuelle — IA » incrustée sur chaque export (AI Act, août 2026).</p>
            </Panel>
            <Panel title="Budget indicatif daté" action={<span className="text-[10.5px] text-mist">Prix relevés le 12/10/2026</span>}>
              <div className="space-y-2">{variant.items.map(([label, kind, a, b]) => <div key={label} className="flex items-center justify-between gap-3 text-[12.5px]"><span className="min-w-0"><span className="text-bone/80">{label}</span> <span className={clsx('ml-1 rounded-full px-1.5 py-px text-[10px]', kind === 'Travaux' ? 'bg-coral/10 text-coral' : 'bg-sea/10 text-sea')}>{kind}</span></span><span className="num shrink-0 whitespace-nowrap text-bone/80">{b ? `${fmt(a)} – ${fmt(b)} €` : 'inclus'}</span></div>)}</div>
              <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-white/[0.05] pt-3"><span className="text-[12px] text-mist">Total TTC · devis artisans partenaires</span><span className="num shrink-0 whitespace-nowrap text-[15px]">{fmt(lo)} – {fmt(hi)} €</span></div>
              <p className="mt-2 text-[11.5px] text-mist">Aucun gain de valeur n’est déduit automatiquement de ces travaux.</p>
            </Panel>
          </div>
        </div>
      )}
    </DelivSection>
  )
}

/* ——— L9 · Dossier copro & diagnostics ——— */
type Item = { label: string; state: 'ok' | 'missing' | 'check' | 'na' | 'expired'; ref: string; origin: string }
const IC = {
  ok: [CheckCircle, 'text-sage', 'Vérifié'], missing: [XCircle, 'text-coral', 'Manquant'], check: [Warning, 'text-champagne-300', 'À vérifier'],
  na: [MinusCircle, 'text-mist', 'Non applicable'], expired: [ClockCounterClockwise, 'text-coral', 'Expiré'],
} as const

/** Pièces issues du document + règles conditionnelles du bien (type, année, terrain, régime). */
function itemsOf(ctx: Ctx, docItems: { label: string; state: string; ref: string }[]): Item[] {
  const { p, j } = ctx
  const out: Item[] = docItems.map((i) => ({ label: i.label, state: (i.state in IC ? i.state : 'check') as Item['state'], ref: i.ref, origin: 'Extraction des pièces' }))
  const regime = j.discovery.regime?.v ?? ''
  const rule = (label: string, state: Item['state'], ref: string) => !out.some((o) => o.label === label) && out.push({ label, state, ref, origin: 'Règle conditionnelle' })
  const has = (re: RegExp) => out.some((o) => re.test(o.label))
  if (!has(/plomb/i)) rule('Constat plomb (CREP)', p.year >= 1949 ? 'na' : 'check', p.year >= 1949 ? `Construit en ${p.year} (après 1949)` : 'Avant 1949')
  if (!has(/gaz/i)) rule('Diagnostic gaz', p.year >= 2011 ? 'na' : 'check', p.year >= 2011 ? 'Installation de moins de 15 ans' : 'Installation de plus de 15 ans')
  if (p.type === 'Appartement' || /copro/i.test(regime)) { rule('Fiche synthétique de copropriété', 'check', 'à demander au syndic'); rule('Pré-état daté', 'missing', '—'); rule('Carnet d’entretien', 'check', 'à vérifier') }
  if (/ASL/i.test(regime)) rule('Statuts et budget de l’ASL', 'check', j.discovery.syndic?.v ?? 'ASL')
  if (p.features.some((f) => /piscine/i.test(f))) rule('Dispositif de sécurité piscine', 'check', 'Norme NF P90-306')
  if (p.land) rule('Assainissement (SPANC ou raccordement)', 'check', 'Mairie')
  return out
}

export function L9Section({ ctx }: { ctx: Ctx }) {
  const { d, a } = ctx
  const [tasks, taskOps] = useTasks()
  const [convs] = useConversations()
  const [templates] = useTemplates()
  const [files] = useFiles()
  const { busy, run } = useBusy()
  const verified = ctx.prefs.L9?.verified ?? []
  const conv = convs.find((c) => c.dossierId === d.id && c.kind === 'direct' && c.tags?.includes('Vendeur'))
  const tpl = templates.find((t) => t.id === 'tpl-pieces')
  const asked = (label: string) => tasks.some((t) => t.dossier === d.id && t.title.includes(label))
  const request = (label: string) => run(label, async () => {
    await taskOps.create({ title: `Obtenir « ${label} » — ${d.seller} (L9)`, dossier: d.id, due: 'Aujourd’hui', prio: 'normale', kind: 'document', ai: false, done: false })
    if (!conv || !tpl) return 'Tâche créée · aucun canal vendeur avec consentement : relance à faire par téléphone ou e-mail'
    const text = tpl.body.replace(/\{\{(\w+)\}\}/g, (_, k: string) => ({ prenom: conv.title.split(' ')[0], pieces: label, conseiller: a.name } as Record<string, string>)[k] ?? '')
    const m = await action<{ status?: string }>('message.send', { conversationId: conv.id, text, template: tpl.id })
    return `Tâche créée · relance « Relance de pièces » ${m.status ?? 'consignée'}`
  }, (r) => r)
  return (
    <DelivSection code="L9" ctx={ctx}>
      {(doc) => {
        const items = itemsOf(ctx, doc.items ?? []).map((i) => (i.state === 'check' && verified.includes(i.label) ? { ...i, state: 'ok' as const, origin: 'Vérifié par le conseiller' } : i))
        const count = (s: Item['state']) => items.filter((i) => i.state === s).length
        const mine = files.filter((f) => f.dossierId === d.id)
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {(Object.keys(IC) as Item['state'][]).map((s) => { const [I, c, l] = IC[s]; return <div key={s} className="rounded-xl bg-white/[0.02] px-3 py-2.5 ring-1 ring-white/[0.06]"><div className={clsx('flex items-center gap-1.5 text-[11px]', c)}><I size={13} weight="fill" />{l}</div><div className="num mt-1 text-[22px] leading-none">{count(s)}</div></div> })}
            </div>
            {count('missing') > 0 && <div className="flex items-start gap-2.5 rounded-xl bg-coral/10 px-3.5 py-3 text-[12.5px] text-coral ring-1 ring-coral/20"><Warning size={16} weight="fill" className="mt-px shrink-0" />Pièce absente : impossible de conclure « aucun point bloquant ». Le livrable reste bloqué jusqu’au dépôt puis à la régénération.</div>}
            <div className="space-y-1.5">
              {items.map((it) => {
                const [I, c, l] = IC[it.state]
                return (
                  <div key={it.label} className="flex flex-col gap-2 rounded-xl bg-white/[0.02] px-3.5 py-3 ring-1 ring-white/[0.05] sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <I size={17} weight="fill" className={clsx('shrink-0', c)} />
                      <div className="min-w-0"><div className="text-[13px]">{it.label}</div><div className="text-[11px] text-mist">{it.origin}</div></div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pl-8 sm:pl-0">
                      {it.ref && !['—', 'à vérifier'].includes(it.ref) && <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[10.5px] text-bone/65 ring-1 ring-white/[0.06]"><Quotes size={10} />{it.ref}</span>}
                      <span className={clsx('text-[11px]', c)}>{l}</span>
                      {it.state === 'missing' && (asked(it.label)
                        ? <span className="rounded-full bg-sea/10 px-2 py-0.5 text-[10.5px] text-sea">Demandée · tâche ouverte</span>
                        : <SoftBtn icon={<PaperPlaneTilt size={13} />} disabled={!!busy} onClick={() => request(it.label)}>{busy === it.label ? 'Demande…' : 'Demander la pièce'}</SoftBtn>)}
                      {it.state === 'check' && <button onClick={() => ctx.setPrefs('L9', { verified: [...verified, it.label] })} className="rounded-full px-2.5 py-1 text-[11.5px] text-champagne-300 ring-1 ring-champagne/25 transition hover:bg-champagne/10">Marquer vérifié</button>}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-mist">
              <span>{mine.length} pièce{mine.length > 1 ? 's' : ''} déposée{mine.length > 1 ? 's' : ''} dans NXT{mine.length ? ' — régénérez L9 pour les intégrer à l’extraction' : ''}.</span>
              <Eyebrow>Absent ≠ non applicable ≠ à vérifier ≠ expiré</Eyebrow>
            </div>
          </div>
        )
      }}
    </DelivSection>
  )
}
