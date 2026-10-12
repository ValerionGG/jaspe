import { motion, useScroll, useTransform, AnimatePresence, useMotionValueEvent } from 'motion/react'
import { useRef, useState } from 'react'
import { Eyebrow, Reveal, MaskLines, Bezel, Pill, Avatar, Spark, Ring, EXPO } from '../ui/kit'
import { img, DOSSIERS, prop, agent, TODAY, AGENCIES, eur } from '../data/mock'
import { Sparkle, CheckCircle, Clock, ArrowsLeftRight, FileMagnifyingGlass, InstagramLogo, LinkedinLogo, FacebookLogo, Microphone, House, Kanban, ChartBar, Lightning } from '@phosphor-icons/react'

/* ——— Vitrine produit ——— */
const TABS = [
  { id: 'today', label: 'Aujourd’hui', icon: House },
  { id: 'pipe', label: 'Dossiers', icon: Kanban },
  { id: 'net', label: 'Pilotage réseau', icon: ChartBar },
]

function MiniToday() {
  return (
    <div className="grid h-full grid-cols-12 gap-3 p-4 md:p-5">
      <div className="col-span-12 md:col-span-7">
        <div className="text-[11px] uppercase tracking-eyebrow text-mist">Lundi 12 octobre</div>
        <div className="display mt-1 text-3xl md:text-4xl">Bonjour Claire.</div>
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-champagne/15 to-transparent p-4 ring-1 ring-champagne/20">
          <div className="flex items-center gap-2 text-[12px] text-champagne-300"><Sparkle size={13} weight="fill" /> Brief du copilote</div>
          <p className="mt-2 text-[13px] leading-relaxed text-bone/80">3 actions comptent aujourd’hui : valider l’estimation Martin avant 14 h, envoyer la contre-offre Dubreuil, relire le débrief Haddad. Votre RDV de 11 h est prêt à 100 %.</p>
        </div>
        <div className="mt-3 space-y-1.5">
          {TODAY.slice(1, 6).map((e) => (
            <div key={e.time} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2 ring-1 ring-white/[0.05]">
              <span className="num w-11 text-[12px] text-bone/50">{e.time}</span>
              <span className="h-6 w-px bg-champagne/50" />
              <span className="min-w-0 flex-1 truncate text-[12.5px]">{e.title}</span>
              {e.ready && <Pill tone="green">Prêt</Pill>}
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-12 space-y-3 md:col-span-5">
        <div className="overflow-hidden rounded-2xl ring-1 ring-white/[0.06]">
          <img src={img('villa-pool')} alt="" className="h-28 w-full object-cover" />
          <div className="p-3">
            <div className="text-[12.5px] font-medium">Villa contemporaine vue mer</div>
            <div className="mt-2 grid grid-cols-7 gap-1">{['D1', 'D2', 'D3', 'D5', 'L1', 'L7', 'L9'].map((c, i) => <span key={c} className={`rounded-md py-1 text-center text-[9.5px] ${i < 5 ? 'bg-sage/15 text-sage' : i === 5 ? 'bg-champagne/20 text-champagne-300' : 'bg-coral/15 text-coral'}`}>{c}</span>)}</div>
          </div>
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.05]">
          <div className="flex items-center justify-between text-[11px] text-mist"><span>Mandats exclusifs · 30 j</span><span className="text-sage">+18 %</span></div>
          <div className="mt-1 flex items-end justify-between"><span className="display text-3xl">46 %</span><Spark data={[12, 14, 13, 17, 19, 22, 24, 23, 27]} w={110} h={34} /></div>
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.05]">
          <div className="mb-2 flex items-center justify-between text-[11px] text-mist"><span>À valider</span><span className="num text-champagne-300">4</span></div>
          {[['L7 · Estimation Martin', '14:00'], ['D5 · Débrief Haddad', 'Maintenant'], ['L4 · Kit social Costa', 'Aujourd’hui']].map(([a, b]) => (
            <div key={a} className="flex items-center justify-between border-t border-white/[0.05] py-2 text-[12px]"><span className="flex items-center gap-2"><Sparkle size={11} className="text-champagne" weight="fill" />{a}</span><span className="text-mist">{b}</span></div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MiniPipe() {
  const cols = [['prep', 'Préparation'], ['post', 'Livrables'], ['commercial', 'Diffusion'], ['offre', 'Offre']] as const
  return (
    <div className="grid h-full grid-cols-2 gap-3 p-4 md:grid-cols-4 md:p-5">
      {cols.map(([s, l]) => (
        <div key={s} className="rounded-2xl bg-white/[0.02] p-2 ring-1 ring-white/[0.05]">
          <div className="mb-2 flex items-center justify-between px-1 text-[11px] text-mist"><span>{l}</span><span className="num">{DOSSIERS.filter((d) => d.stage === s).length}</span></div>
          {DOSSIERS.filter((d) => d.stage === s).map((d) => (
            <div key={d.id} className="mb-2 overflow-hidden rounded-xl bg-ink-700 ring-1 ring-white/[0.06]">
              <img src={prop(d.propertyId).photo} alt="" className="h-16 w-full object-cover" />
              <div className="p-2.5">
                <div className="truncate text-[12px] font-medium">{prop(d.propertyId).title}</div>
                <div className="mt-1 flex items-center justify-between"><span className="num text-[11px] text-champagne-300">{eur(prop(d.propertyId).price)}</span><Avatar src={agent(d.agentId).photo} size={18} /></div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function MiniNet() {
  return (
    <div className="h-full p-4 md:p-5">
      <div className="grid grid-cols-3 gap-3">
        {[['Mandats actifs', '161', '+12'], ['Taux d’exclusivité', '45 %', '+6 pts'], ['Adoption', '84 %', '+9 pts']].map(([k, v, d]) => (
          <div key={k} className="rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.05]"><div className="text-[11px] text-mist">{k}</div><div className="display mt-1 text-3xl">{v}</div><div className="text-[11px] text-sage">{d}</div></div>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {AGENCIES.slice(0, 5).map((a) => (
          <div key={a.name} className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-3 py-2 text-[12px] ring-1 ring-white/[0.04]">
            <span className="w-40 truncate">{a.name}</span>
            <span className="h-1 flex-1 rounded-full bg-white/10"><span className="block h-1 rounded-full bg-champagne" style={{ width: `${a.adoption * 100}%` }} /></span>
            <span className="num w-10 text-right text-bone/60">{Math.round(a.adoption * 100)}%</span>
            <Spark data={a.trend} w={60} h={18} fill={false} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function Showcase() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const rot = useTransform(scrollYProgress, [0, 1], [24, 0])
  const sc = useTransform(scrollYProgress, [0, 1], [0.86, 1])
  const [tab, setTab] = useState('today')
  return (
    <section id="produit" className="relative overflow-hidden bg-bone-100 px-4 pb-32 pt-32 text-ink md:px-10 md:pb-44 md:pt-44">
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow tone="light">Le poste de travail</Eyebrow>
          <MaskLines className="display mt-6 text-5xl md:text-7xl lg:text-8xl" lines={[<>Un CRM qui sait</>, <span className="italic text-champagne-700">ce qui compte aujourd’hui.</span>]} />
          <Reveal delay={0.2}><p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-ink/60">Pas de tableau à remplir. Chaque matin, vos priorités, vos rendez-vous prêts, les livrables à valider — et la raison de chaque suggestion.</p></Reveal>
        </div>
        <div ref={ref} className="mt-16 [perspective:1800px] md:mt-24">
          <motion.div style={{ rotateX: rot, scale: sc }} className="origin-top">
            <div className="rounded-[2.2rem] bg-ink p-2 shadow-[0_60px_120px_-40px_rgba(30,20,8,.55)] ring-1 ring-ink/10">
              <div className="overflow-hidden rounded-[1.8rem] bg-ink-850 text-bone ring-1 ring-white/[0.06]">
                <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
                  <div className="flex gap-1.5">{['bg-coral/70', 'bg-champagne/70', 'bg-sage/70'].map((c) => <span key={c} className={`h-2.5 w-2.5 rounded-full ${c}`} />)}</div>
                  <div className="flex gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.06]">
                    {TABS.map((t) => (
                      <button key={t.id} onClick={() => setTab(t.id)} className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px]">
                        {tab === t.id && <motion.span layoutId="tabpill" className="absolute inset-0 rounded-full bg-white/10" transition={{ duration: 0.6, ease: EXPO }} />}
                        <t.icon size={13} weight="light" className="relative" /><span className="relative hidden sm:inline">{t.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="ml-auto hidden items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1.5 text-[11px] text-mist ring-1 ring-white/[0.06] md:flex">Rechercher, demander au copilote… <kbd className="num rounded bg-white/10 px-1.5">⌘K</kbd></div>
                </div>
                <div className="relative h-[620px] md:h-[470px]">
                  <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }} transition={{ duration: 0.55, ease: EXPO }} className="absolute inset-0 overflow-hidden">
                      {tab === 'today' ? <MiniToday /> : tab === 'pipe' ? <MiniPipe /> : <MiniNet />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ——— Bento des capacités ——— */
function BeforeAfter() {
  const [pos, setPos] = useState(52)
  const ref = useRef<HTMLDivElement>(null)
  const move = (cx: number) => { const r = ref.current!.getBoundingClientRect(); setPos(Math.max(4, Math.min(96, ((cx - r.left) / r.width) * 100))) }
  return (
    <div ref={ref} data-cursor="Glisser" className="relative h-full min-h-[380px] cursor-ew-resize touch-none select-none overflow-hidden" onPointerMove={(e) => (e.buttons || e.pointerType === 'mouse') && move(e.clientX)} onPointerDown={(e) => move(e.clientX)}>
      <img src={img('int-living')} alt="Projection après valorisation" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={img('int-living')} alt="Photo d’origine" className="absolute inset-0 h-full w-full object-cover [filter:grayscale(.75)_brightness(.62)_contrast(.9)_sepia(.15)]" />
      </div>
      <div className="absolute inset-y-0" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 -ml-px w-px bg-bone/80" />
        <div className="absolute top-1/2 -ml-6 -mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-bone text-ink shadow-float"><ArrowsLeftRight size={18} /></div>
      </div>
      <span className="glass absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] ring-1 ring-white/10">Photo d’origine · conservée</span>
      <span className="glass absolute right-4 top-4 rounded-full px-3 py-1 text-[11px] ring-1 ring-white/10">Projection · étiquetée</span>
    </div>
  )
}

function EstimationChart() {
  const pts = [38, 42, 40, 47, 52, 50, 58, 61, 60, 66, 70, 74]
  const W = 400, H = 150
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${(i / (pts.length - 1)) * W},${H - (p / 80) * H}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-36 w-full overflow-visible">
      <defs><linearGradient id="band" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="rgb(var(--acc-500))" stopOpacity=".25" /><stop offset="1" stopColor="rgb(var(--acc-500))" stopOpacity="0" /></linearGradient></defs>
      <motion.rect x={W * 0.78} y={10} width={W * 0.22} height={H - 10} fill="rgb(var(--acc-500) / .08)" initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.8, ease: EXPO }} style={{ originY: 1 }} />
      <path d={`${path} L${W},${H} L0,${H} Z`} fill="url(#band)" />
      <motion.path d={path} fill="none" stroke="rgb(var(--acc-500))" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2, ease: EXPO }} />
      {[0.25, 0.5, 0.75].map((y) => <line key={y} x1="0" x2={W} y1={H * y} y2={H * y} stroke="rgb(var(--tint) / .06)" />)}
    </svg>
  )
}

export function Bento() {
  return (
    <section className="relative bg-ink px-4 py-32 md:px-10 md:py-44">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-16 grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <Eyebrow>Capacités</Eyebrow>
            <MaskLines className="display mt-6 text-5xl md:text-7xl" lines={[<>Le savoir-faire d’une</>, <span className="italic text-champagne-300">grande maison,</span>, <>dans chaque dossier.</>]} />
          </div>
          <Reveal className="md:col-span-4 md:col-start-9"><p className="text-[15px] leading-relaxed text-bone/60">Chaque production est vérifiable : sources datées, original conservé, validation humaine avant tout envoi. L’IA prépare, le professionnel décide.</p></Reveal>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-5">
          <Reveal className="md:col-span-7 md:row-span-2">
            <Bezel className="h-full" coreClassName="flex flex-col">
              <div className="flex-1"><BeforeAfter /></div>
              <div className="flex items-end justify-between gap-4 p-6">
                <div><Pill tone="gold">L8 · Avant / après</Pill><h3 className="display mt-3 text-3xl md:text-4xl">Projeter sans tromper.</h3><p className="mt-2 max-w-md text-[13.5px] text-bone/60">Structure, ouvertures et volumes préservés. Décoration et travaux distingués, budget daté, original toujours accessible.</p></div>
              </div>
            </Bezel>
          </Reveal>
          <Reveal delay={0.08} className="md:col-span-5">
            <Bezel className="h-full" coreClassName="p-6">
              <div className="flex items-center justify-between"><Pill tone="gold">L7 · Estimation argumentée</Pill><span className="num text-[11px] text-mist">5 comparables DVF</span></div>
              <div className="mt-4 flex items-baseline gap-3"><span className="display text-5xl">4,60 – 5,15</span><span className="text-bone/50">M€</span></div>
              <EstimationChart />
              <p className="text-[12.5px] text-bone/55">Une fourchette qui reflète l’incertitude réelle — pas un chiffre arbitraire.</p>
            </Bezel>
          </Reveal>
          <Reveal delay={0.14} className="md:col-span-5">
            <Bezel className="h-full" coreClassName="p-6">
              <div className="flex items-center justify-between"><Pill tone="gold"><Microphone size={11} /> D5 · Débrief vocal</Pill><span className="num text-[11px] text-sage">● 01:48</span></div>
              <div className="mt-5 flex h-12 items-center gap-[3px]">{Array.from({ length: 56 }).map((_, i) => <span key={i} className="flex-1 animate-wave rounded-full bg-bone/70" style={{ height: `${18 + ((i * 53) % 82)}%`, animationDelay: `${(i % 14) * 0.07}s` }} />)}</div>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Surface 286 m²', 'Piscine à débordement', 'Départ juin 2027', 'Exclusivité envisagée', 'DPE B'].map((c, i) => (
                  <motion.span key={c} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.12, duration: 0.6, ease: EXPO }} className="inline-flex items-center gap-1.5 rounded-full bg-sage/10 px-2.5 py-1 text-[11.5px] text-sage ring-1 ring-sage/20"><CheckCircle size={12} weight="fill" />{c}</motion.span>
                ))}
              </div>
            </Bezel>
          </Reveal>
          <Reveal delay={0.06} className="md:col-span-4">
            <Bezel className="h-full" coreClassName="relative p-6">
              <Pill tone="gold"><FileMagnifyingGlass size={11} /> L9 · Copro & diagnostics</Pill>
              <div className="theme-dark relative mx-auto mt-5 h-40 w-32 overflow-hidden rounded-lg bg-bone-100 p-3 shadow-float">
                {Array.from({ length: 11 }).map((_, i) => <div key={i} className="mb-1.5 h-1 rounded bg-ink/15" style={{ width: `${55 + ((i * 29) % 45)}%` }} />)}
                <div className="absolute inset-x-0 top-0 h-6 animate-scan bg-gradient-to-b from-transparent via-champagne/50 to-transparent" />
              </div>
              <div className="mt-4 space-y-1.5 text-[12px]">
                <div className="flex justify-between"><span className="text-bone/60">PV d’AG 2025</span><Pill tone="red">Manquant</Pill></div>
                <div className="flex justify-between"><span className="text-bone/60">DPE · valide jusqu’au 03/2032</span><Pill tone="green">Vérifié p.2</Pill></div>
              </div>
            </Bezel>
          </Reveal>
          <Reveal delay={0.12} className="md:col-span-4">
            <Bezel className="h-full" coreClassName="relative p-6">
              <Pill tone="gold">L4 · Kit social</Pill>
              <div className="group relative mt-6 flex h-48 items-center justify-center">
                {[{ i: InstagramLogo, r: -10, x: -40, p: 'villa-pool' }, { i: LinkedinLogo, r: 0, x: 0, p: 'int-dining' }, { i: FacebookLogo, r: 10, x: 40, p: 'int-living' }].map((c, k) => (
                  <div key={k} className="absolute w-28 overflow-hidden rounded-xl bg-ink-700 shadow-float ring-1 ring-white/10 transition-all duration-700 ease-silk group-hover:translate-x-[var(--gx)] group-hover:rotate-[var(--gr)]" style={{ transform: `translateX(${c.x * 0.4}px) rotate(${c.r * 0.5}deg)`, ['--gx' as string]: `${c.x * 1.6}px`, ['--gr' as string]: `${c.r}deg`, zIndex: k === 1 ? 2 : 1 }}>
                    <img src={img(c.p)} alt="" className="h-24 w-full object-cover" />
                    <div className="flex items-center gap-1.5 p-2 text-[10px] text-bone/60"><c.i size={12} /> Nouveauté</div>
                  </div>
                ))}
              </div>
            </Bezel>
          </Reveal>
          <Reveal delay={0.18} className="md:col-span-4">
            <Bezel className="h-full" coreClassName="relative overflow-hidden p-6">
              <Pill tone="gold">L3 · Matching acquéreurs</Pill>
              <div className="mt-5 space-y-3">
                {[['Family Office L.', 97, 'p-paul'], ['M. & Mme Verdier', 94, 'p-julien'], ['M. Keller', 88, 'p-thomas']].map(([n, v, p]) => (
                  <div key={n as string} className="flex items-center gap-3"><Avatar src={img(p as string)} size={34} /><div className="flex-1"><div className="text-[13px]">{n}</div><div className="text-[11px] text-mist">Budget, zone et financement compatibles</div></div><Ring value={v as number} size={40}><span className="num text-[10px]">{v}</span></Ring></div>
                ))}
              </div>
            </Bezel>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ——— Une journée d’automatisations ——— */
const DAY = [
  { h: 7.5, t: '07:30', r: 'Brief du matin', d: 'Trois priorités, les validations urgentes, rien de superflu.', tag: 'AUT-046' },
  { h: 8, t: '08:00', r: 'Revue agence', d: 'Dossiers bloqués et charge de l’équipe, pour le directeur.', tag: 'AUT-047' },
  { h: 9.25, t: '09:15', r: 'Lead reçu · SeLoger', d: 'Dédoublonné, affecté au bon secteur, réponse préparée.', tag: 'AUT-001' },
  { h: 10.5, t: '10:30', r: 'Contrôle H-2', d: 'Adresse, horaire et brief du RDV de 11 h revérifiés.', tag: 'AUT-015' },
  { h: 12.75, t: '12:45', r: 'Préparation post-RDV', d: 'Neuf livrables lancés en parallèle à partir du débrief validé.', tag: 'AUT-024' },
  { h: 15, t: '15:00', r: 'Mandat sans visite · 14 j', d: 'Diagnostic exposition, prix et qualité d’annonce pour le conseiller.', tag: 'AUT-039' },
  { h: 18.5, t: '18:30', r: 'Offre proche d’expiration', d: 'Rappel avant 18 h et contre-offre prête à signer.', tag: 'AUT-042' },
  { h: 22, t: '22:00', r: 'Contrôle qualité des livrables', d: 'Chiffres, noms, marque et sources vérifiés avant demain.', tag: 'AUT-058' },
]

export function DayRoutines() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.6', 'end 0.6'] })
  const [hour, setHour] = useState(7.5)
  useMotionValueEvent(scrollYProgress, 'change', (v) => setHour(7.5 + v * 14.5))
  const hh = Math.floor(hour), mm = Math.floor((hour - hh) * 60 / 15) * 15
  const sun = useTransform(scrollYProgress, [0, 0.5, 1], ['rgb(var(--acc-500))', 'rgb(var(--acc-300))', 'rgb(var(--sea-600))'])
  return (
    <section id="automatisations" className="relative bg-ink-850 px-4 py-32 md:px-10 md:py-44">
      <div ref={ref} className="mx-auto grid max-w-[1400px] gap-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="md:sticky md:top-28">
            <Eyebrow>Automatisations</Eyebrow>
            <MaskLines className="display mt-6 text-5xl md:text-7xl" lines={[<>Votre agence tourne,</>, <span className="italic text-champagne-300">même quand vous dormez.</span>]} />
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-bone/60">60 routines métier, chacune avec son déclencheur, ses conditions, son niveau d’autonomie et sa règle d’arrêt. Vous voyez ce qui attend, ce qui échoue, ce qui coûte.</p>
            <div className="mt-12 flex items-center gap-6">
              <motion.div className="relative h-28 w-28 rounded-full" style={{ background: sun, boxShadow: '0 0 80px -10px currentColor' }}>
                <div className="absolute inset-[3px] flex items-center justify-center rounded-full bg-ink-850"><span className="num text-2xl">{String(hh).padStart(2, '0')}:{String(mm).padStart(2, '0')}</span></div>
              </motion.div>
              <div className="space-y-2 text-[12px] text-bone/55">
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sage" /> A — automatique, journalisé</div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-champagne" /> V — préparé, validé par vous</div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sea" /> P — proposé au client</div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative md:col-span-6 md:col-start-7">
          <div className="absolute bottom-0 left-[19px] top-0 w-px bg-white/10" />
          {DAY.map((e) => {
            const on = hour >= e.h
            return (
              <div key={e.t} className="relative flex gap-6 pb-14 last:pb-0">
                <span className={`relative z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 transition-all duration-700 ease-silk ${on ? 'bg-champagne text-ink ring-champagne shadow-glow' : 'bg-ink-800 text-mist ring-white/10'}`}><Lightning size={16} weight={on ? 'fill' : 'light'} /></span>
                <div className={`transition-all duration-700 ease-silk ${on ? 'opacity-100' : 'opacity-35'}`}>
                  <div className="flex items-center gap-3"><span className="num text-[13px] text-champagne-300">{e.t}</span><span className="num text-[10px] text-mist">{e.tag}</span></div>
                  <h3 className="display mt-1 text-3xl md:text-4xl">{e.r}</h3>
                  <p className="mt-1 max-w-md text-[14px] text-bone/60">{e.d}</p>
                  {on && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-sage"><CheckCircle size={12} weight="fill" /> Exécuté · journalisé <Clock size={11} className="ml-2 text-mist" /><span className="text-mist">0,8 s</span></motion.div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function Network() {
  return (
    <section id="reseaux" className="relative overflow-hidden bg-ink px-4 py-32 md:px-10 md:py-44">
      <img src={img('riviera-bay')} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink via-ink/80 to-ink" />
      <div className="relative mx-auto max-w-[1400px]">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-6">
            <Eyebrow>Pour les réseaux & groupes</Eyebrow>
            <MaskLines className="display mt-6 text-5xl md:text-7xl" lines={[<>Le même niveau</>, <>d’exigence,</>, <span className="italic text-champagne-300">dans chaque agence.</span>]} />
          </div>
          <Reveal className="md:col-span-5 md:col-start-8 md:pt-20">
            <p className="text-[15px] leading-relaxed text-bone/65">Hiérarchie réseau → agences → équipes, marque héritée et variantes locales, méthodes et routines déployées en un clic, droits au plus juste. La direction voit la qualité, l’adoption et les coûts — sans surveiller les personnes.</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {['Marque blanche & héritage', 'Coopération inter-agences', 'Intérim & délégations', 'Journal d’audit complet', 'Budget IA par agence', 'SSO & provisionnement'].map((f) => <div key={f} className="flex items-center gap-2 text-[13px] text-bone/75"><CheckCircle size={14} className="text-champagne" weight="fill" />{f}</div>)}
            </div>
          </Reveal>
        </div>
        <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-[2rem] bg-white/[0.07] md:grid-cols-4">
          {AGENCIES.slice(0, 4).map((a, i) => (
            <Reveal key={a.name} delay={i * 0.08} className="bg-ink-800/90 p-6 md:p-8">
              <div className="text-[12px] text-mist">{a.name}</div>
              <div className="mt-6 flex items-end justify-between"><span className="display text-5xl">{a.mandats}</span><Spark data={a.trend} w={90} h={30} /></div>
              <div className="mt-2 text-[12px] text-bone/50">mandats actifs · {Math.round(a.exclu * 100)} % exclusifs</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
