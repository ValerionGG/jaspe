import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  MagnifyingGlass, Play, CheckCircle, Circle, ArrowRight, ArrowLeft, Clock, Compass, Lightbulb, Plus, Minus, Keyboard, Sparkle,
  Lifebuoy, Trash, Check, BookOpen, ArrowUpRight, X, Medal,
} from '@phosphor-icons/react'
import { PageHeader, Card, Stagger, Tabs, SoftBtn, Empty } from '../ui'
import { Ring, EXPO, Pill } from '../../ui/kit'
import { img, DOSSIERS } from '../../data/mock'
import { MESSAGES, REMINDERS } from '../../data/messaging'
import { useDossiers, useDocuments, useMessages, useReminders, useRoutines, useSettings, useTasks, useNotifications } from '../../data/collections'
import { Modal, Field, Input, Select, Textarea, AsyncForm, toast, errText } from '../forms'
import { useTutorials } from '../tour/Tour'
import { TOURS, startTour } from '../tour/tours'
import { LESSONS, GLOSSARY, FAQ, SHORTCUTS, CHANGELOG, type Lesson, type Role, type Term } from '../tour/content'
import { Shot } from '../tour/Shots'

type Tab = 'tutos' | 'glossaire' | 'faq' | 'raccourcis' | 'nouveautes' | 'support'
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const SEED_D = new Set(DOSSIERS.map((d) => d.id))
const SEED_M = new Set(MESSAGES.map((m) => m.id))
const SEED_R = new Set(REMINDERS.map((r) => r.id))
const DEFAULT_SIGNATURE = 'Claire Delmas — Conseillère senior'
const ROLES: ('Tous' | Role)[] = ['Tous', 'Conseiller', 'Manager', 'Coordinatrice', 'Marketing']
const LEVEL_TONE = { Essentiel: 'green', Intermédiaire: 'blue', Avancé: 'gold' } as const
const CATS: ('Tous' | Term['cat'])[] = ['Tous', 'Parcours', 'Livrables', 'Réglementation', 'Marché', 'Messagerie', 'Produit']
const POPULAR = ['fenêtre 24 h', 'AI Act', 'valider', 'DVF', 'opt-in']
const fdate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '')

export default function Aide() {
  const tut = useTutorials()
  const [dossiers] = useDossiers()
  const [documents] = useDocuments()
  const [messages] = useMessages()
  const [reminders] = useReminders()
  const [routines] = useRoutines()
  const [settings] = useSettings()
  const [, taskOps] = useTasks()
  const [, notifOps] = useNotifications()
  const [tab, setTab] = useState<Tab>('tutos')
  const [q, setQ] = useState('')
  const [role, setRole] = useState<(typeof ROLES)[number]>('Tous')
  const [cat, setCat] = useState<(typeof CATS)[number]>('Tous')
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [faqOpen, setFaqOpen] = useState<number | null>(0)
  const [formKey, setFormKey] = useState(0)
  const tabsRef = useRef<HTMLDivElement>(null)

  // ——— Checklist : détection sur les données réelles, cochage manuel en repli ———
  const signature = settings.find((s) => s.id === 'agency')?.signature
  const checklist = [
    { id: 'tour', label: 'Suivre la visite « Prise en main »', hint: 'Trois minutes pour repérer chaque écran.', auto: !!tut.get('tour-onboarding')?.done, run: () => startTour('onboarding'), cta: 'Lancer' },
    { id: 'dossier', label: 'Créer votre premier dossier vendeur', hint: 'Bouton « Nouveau dossier » du pipeline.', auto: dossiers.some((d) => !SEED_D.has(d.id)), to: '/app/dossiers' },
    { id: 'generate', label: 'Générer un livrable', hint: 'Depuis un dossier ou le Studio.', auto: documents.length > 0, to: '/app/studio' },
    { id: 'validate', label: 'Valider un livrable', hint: 'Relecture dans « Tâches & validations ».', auto: documents.some((d) => d.status === 'validated'), to: '/app/taches' },
    { id: 'message', label: 'Envoyer un message', hint: 'Client ou canal d’équipe.', auto: messages.some((m) => !SEED_M.has(m.id) && m.dir !== 'in'), to: '/app/messages' },
    { id: 'reminder', label: 'Programmer un rappel WhatsApp', hint: 'J-1 et H-2 depuis un rendez-vous.', auto: reminders.some((r) => !SEED_R.has(r.id)), to: '/app/agenda' },
    { id: 'routine', label: 'Activer ou ajuster une routine', hint: 'Interrupteur d’une automatisation.', auto: routines.some((r) => (r.enabled !== false) !== (r.phase !== 'P2')), to: '/app/automatisations' },
    { id: 'signature', label: 'Personnaliser votre signature', hint: 'Réglages de l’agence.', auto: !!signature && signature !== DEFAULT_SIGNATURE, to: '/app/reglages' },
  ].map((s) => ({ ...s, manual: !!tut.get(`step-${s.id}`)?.done, done: s.auto || !!tut.get(`step-${s.id}`)?.done }))
  const doneCount = checklist.filter((s) => s.done).length
  const pct = Math.round((doneCount / checklist.length) * 100)
  const nextStep = checklist.find((s) => !s.done)
  const toggleStep = (id: string, done: boolean) => tut.upsert(`step-${id}`, { kind: 'step', done, at: new Date().toISOString() }).then(() => toast(done ? 'Étape marquée comme faite' : 'Étape rouverte', 'info')).catch((e) => toast(errText(e), 'error'))

  // ——— Recherche transverse ———
  const nq = norm(q.trim())
  const lessons = useMemo(() => LESSONS.filter((l) => (role === 'Tous' || l.role === role) && (!nq || norm(`${l.title} ${l.summary} ${l.steps.map((s) => s.t + s.d).join(' ')}`).includes(nq))), [role, nq])
  const terms = useMemo(() => GLOSSARY.filter((t) => (cat === 'Tous' || t.cat === cat) && (!nq || norm(`${t.term} ${t.def}`).includes(nq))), [cat, nq])
  const faqs = useMemo(() => FAQ.filter((f) => !nq || norm(f.q + f.a).includes(nq)), [nq])
  const lessonsDone = LESSONS.filter((l) => tut.get(`lesson-${l.id}`)?.done).length
  const tickets = tut.docs.filter((d) => d.kind === 'ticket').sort((a, b) => String(b.at).localeCompare(String(a.at)))

  const goTab = (t: Tab) => { setTab(t); setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30) }
  const search = (v: string) => {
    setQ(v)
    const n = norm(v.trim())
    if (!n || tab === 'tutos' || tab === 'glossaire' || tab === 'faq') return
    setTab('tutos')
  }
  const launch = (id: string) => { setLesson(null); setTimeout(() => startTour(id), 250) }

  return (
    <div className="space-y-6">
      <PageHeader kicker="Centre d’aide" title={<>Aide & <span className="italic text-champagne-300">tutoriels</span></>}
        sub="Visites guidées, leçons pas à pas, glossaire métier et support : tout pour maîtriser Jaspe sans manuel."
        actions={<>
          <SoftBtn icon={<Lifebuoy size={14} />} onClick={() => goTab('support')}>Contacter le support</SoftBtn>
          <SoftBtn tone="gold" icon={<Play size={14} weight="fill" />} onClick={() => startTour('onboarding')}>Lancer la visite</SoftBtn>
        </>} />

      {/* Héros éditorial */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Stagger className="lg:col-span-7">
          <div className="relative h-full overflow-hidden rounded-[1.6rem] p-px">
            <div className="absolute inset-0 rounded-[1.6rem] bg-[conic-gradient(from_200deg_at_50%_50%,rgb(var(--acc-500)_/_.45),rgb(var(--acc-500)_/_.04),rgb(var(--sea)_/_.3),rgb(var(--acc-500)_/_.04),rgb(var(--acc-500)_/_.45))]" />
            <div className="relative flex h-full flex-col rounded-[calc(1.6rem-1px)] bg-ink-800 p-6 md:p-8">
              <div className="text-[10.5px] uppercase tracking-eyebrow text-mist">Apprendre en faisant</div>
              <h2 className="display mt-3 text-[2.4rem] leading-[0.95] md:text-[3.1rem]">Maîtriser Jaspe, <span className="italic text-champagne-300">une étape</span> à la fois.</h2>
              <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-bone/60">Cherchez un geste, un terme ou une règle. Les résultats couvrent les tutoriels, le glossaire et la FAQ.</p>
              <label className="mt-6 flex items-center gap-3 rounded-2xl bg-white/[0.03] px-4 py-3.5 ring-1 ring-white/[0.08] transition focus-within:ring-champagne/50">
                <MagnifyingGlass size={18} weight="light" className="text-mist" />
                <input value={q} onChange={(e) => search(e.target.value)} placeholder="Ex. : fenêtre de 24 h, valider un livrable, DIA…" aria-label="Rechercher dans l’aide" className="min-w-0 flex-1 bg-transparent text-[15px] text-bone outline-none placeholder:text-mist" />
                {q && <button onClick={() => setQ('')} aria-label="Effacer" className="text-mist hover:text-bone"><X size={14} /></button>}
              </label>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] text-mist">Fréquent :</span>
                {POPULAR.map((p) => <button key={p} onClick={() => search(p)} className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11.5px] text-bone/70 ring-1 ring-white/[0.07] transition hover:text-champagne-300 hover:ring-champagne/30">{p}</button>)}
              </div>
              {nq && <div className="mt-4 text-[12px] text-bone/55"><span className="num text-champagne-300">{lessons.length}</span> tutoriel{lessons.length > 1 ? 's' : ''} · <span className="num text-champagne-300">{terms.length}</span> terme{terms.length > 1 ? 's' : ''} · <span className="num text-champagne-300">{faqs.length}</span> question{faqs.length > 1 ? 's' : ''}</div>}
              <div className="mt-auto grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-5 [&>div]:min-w-0">
                {[[LESSONS.length, 'tutoriels'], [TOURS.length, 'visites guidées'], [GLOSSARY.length, 'termes métier']].map(([n, l]) => (
                  <div key={l}><div className="display text-[2rem] leading-none">{n}</div><div className="mt-1 text-[11.5px] text-mist">{l}</div></div>
                ))}
              </div>
            </div>
          </div>
        </Stagger>
        <Stagger i={1} className="lg:col-span-5">
          <button onClick={() => startTour('onboarding')} className="group relative block h-full min-h-[320px] w-full overflow-hidden rounded-[1.6rem] text-left ring-1 ring-white/[0.06]">
            <img src={img('villa-pool')} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-silk group-hover:scale-105" />
            <div className="theme-dark absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-ink via-ink/40 to-ink/10 p-6">
              <span className="eyebrow self-start bg-ink/50 text-champagne-300 ring-1 ring-white/15 backdrop-blur"><Compass size={12} />Visite guidée · 3 min</span>
              <div>
                <div className="display text-[2.3rem] leading-[0.95] text-bone">Votre cockpit<br /><span className="italic text-champagne-300">en dix arrêts.</span></div>
                <p className="mt-2 max-w-sm text-[13px] text-bone/70">Brief, recherche, copilote, messagerie, validation : la visite s’adapte à l’écran et passe d’une page à l’autre.</p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-champagne text-ink shadow-glow transition-transform duration-500 ease-silk group-hover:scale-110"><Play size={18} weight="fill" /></span>
                  <span className="text-[13px] text-bone/85">{tut.get('tour-onboarding')?.done ? 'Revoir la visite' : 'Commencer maintenant'}</span>
                </div>
              </div>
            </div>
          </button>
        </Stagger>
      </div>

      {/* Checklist + visites */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Stagger i={2} className="lg:col-span-7">
          <Card className="h-full" kicker="Prise en main" title="Votre checklist de démarrage"
            action={<Ring value={pct} size={52}><span className="num text-[11px]">{pct}%</span></Ring>}>
            <p className="-mt-2 mb-4 text-[12.5px] text-bone/55">Les étapes se cochent seules dès que l’action est détectée dans vos données. {nextStep ? <>Prochaine : <span className="text-champagne-300">{nextStep.label.toLowerCase()}</span>.</> : <span className="text-sage">Tout est fait, bravo.</span>}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {checklist.map((s, i) => (
                <motion.div key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.04, duration: 0.5, ease: EXPO }}
                  className={clsx('group flex items-start gap-3 rounded-2xl p-3 ring-1 transition-colors', s.done ? 'bg-sage/[0.05] ring-sage/15' : 'bg-white/[0.02] ring-white/[0.05] hover:bg-white/[0.04]')}>
                  <button onClick={() => !s.auto && toggleStep(s.id, !s.manual)} disabled={s.auto} aria-label={s.done ? 'Rouvrir l’étape' : 'Marquer comme faite'} title={s.auto ? 'Détecté automatiquement' : s.done ? 'Rouvrir' : 'Marquer comme faite'} className="mt-0.5 shrink-0 text-bone/40 transition hover:text-champagne disabled:cursor-default">
                    {s.done ? <CheckCircle size={20} weight="fill" className="text-sage" /> : <Circle size={20} weight="light" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className={clsx('text-[13px] leading-snug', s.done && 'text-bone/50 line-through decoration-bone/20')}>{s.label}</div>
                    <div className="mt-0.5 text-[11px] text-mist">{s.auto ? 'Détecté dans vos données' : s.manual ? 'Marqué manuellement' : s.hint}</div>
                  </div>
                  {!s.done && (s.run
                    ? <button onClick={s.run} className="shrink-0 rounded-full bg-champagne/10 px-2.5 py-1 text-[11px] text-champagne-300 ring-1 ring-champagne/25 transition hover:bg-champagne/20">{s.cta}</button>
                    : <Link to={s.to!} aria-label={`Ouvrir : ${s.label}`} className="shrink-0 rounded-full p-1.5 text-mist ring-1 ring-white/[0.07] transition hover:text-champagne-300"><ArrowRight size={12} /></Link>)}
                </motion.div>
              ))}
            </div>
          </Card>
        </Stagger>
        <Stagger i={3} className="lg:col-span-5">
          <Card className="h-full" kicker={`${TOURS.filter((t) => tut.get(`tour-${t.id}`)?.done).length}/${TOURS.length} terminées`} title="Visites guidées">
            <div className="space-y-1.5">
              {TOURS.map((t) => {
                const st = tut.get(`tour-${t.id}`)
                return (
                  <button key={t.id} onClick={() => startTour(t.id)} className="group flex w-full items-center gap-3 rounded-2xl p-2 text-left ring-1 ring-transparent transition hover:bg-white/[0.03] hover:ring-white/[0.06]">
                    <img src={img(t.img)} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px]">{t.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-mist"><Clock size={11} />{t.minutes} min · {t.steps.length} étapes · {t.role}</div>
                    </div>
                    {st?.done ? <Pill tone="green"><Check size={10} />Terminée</Pill> : st?.skipped ? <Pill tone="neutral">Étape {Number(st.step ?? 0) + 1}</Pill> : null}
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-bone/70 ring-1 ring-white/[0.07] transition group-hover:bg-champagne group-hover:text-ink"><Play size={12} weight="fill" /></span>
                  </button>
                )
              })}
            </div>
          </Card>
        </Stagger>
      </div>

      {/* Bibliothèque */}
      <Stagger i={4}>
        <div ref={tabsRef} className="scroll-mt-24">
          <Tabs id="aide" value={tab} onChange={setTab} items={[
            { id: 'tutos', label: 'Tutoriels', count: lessons.length },
            { id: 'glossaire', label: 'Glossaire', count: terms.length },
            { id: 'faq', label: 'FAQ', count: faqs.length },
            { id: 'raccourcis', label: 'Raccourcis' },
            { id: 'nouveautes', label: 'Nouveautés' },
            { id: 'support', label: 'Support', count: tickets.length || undefined },
          ]} />
        </div>
      </Stagger>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.4, ease: EXPO }}>
          {tab === 'tutos' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {ROLES.map((r) => <button key={r} onClick={() => setRole(r)} className={clsx('rounded-full px-3 py-1.5 text-[12px] ring-1 transition', role === r ? 'bg-champagne/15 text-champagne-300 ring-champagne/30' : 'bg-white/[0.03] text-bone/60 ring-white/[0.07] hover:text-bone')}>{r}</button>)}
                </div>
                <span className="flex items-center gap-1.5 text-[12px] text-mist"><Medal size={14} weight="light" className="text-champagne-300" /><span className="num">{lessonsDone}/{LESSONS.length}</span> leçons terminées</span>
              </div>
              {lessons.length === 0 ? <Empty title="Aucun tutoriel ne correspond">Essayez un autre rôle ou un autre mot-clé.</Empty> : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {lessons.map((l, i) => {
                    const done = tut.get(`lesson-${l.id}`)?.done
                    return (
                      <motion.button key={l.id} onClick={() => setLesson(l)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.6, ease: EXPO }}
                        className="group flex flex-col justify-start overflow-hidden rounded-[1.4rem] bg-white/[0.02] p-1 text-left ring-1 ring-white/[0.06] transition hover:ring-champagne/30">
                        <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-[1.1rem]">
                          <img src={img(l.img)} alt="" className="h-full w-full object-cover transition-transform duration-700 ease-silk group-hover:scale-105" />
                          <div className="theme-dark absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                          <div className="theme-dark absolute left-3 top-3 flex gap-1.5"><span className="rounded-full bg-ink/60 px-2 py-0.5 text-[10.5px] text-bone backdrop-blur">{l.role}</span>{l.tour && <span className="flex items-center gap-1 rounded-full bg-ink/60 px-2 py-0.5 text-[10.5px] text-champagne-300 backdrop-blur"><Compass size={10} />Visite</span>}</div>
                          {done && <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-sage text-ink"><Check size={13} weight="bold" /></span>}
                          <span className="theme-dark num absolute bottom-3 left-3 flex items-center gap-1 text-[11px] text-bone/85"><Clock size={11} />{l.minutes} min · {l.steps.length} étapes</span>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2"><h3 className="text-[14.5px] font-medium leading-snug">{l.title}</h3><Pill tone={LEVEL_TONE[l.level]}>{l.level}</Pill></div>
                          <p className="mt-1.5 text-[12.5px] leading-relaxed text-bone/55">{l.summary}</p>
                          <span className="mt-3 inline-flex items-center gap-1 text-[12px] text-champagne-300">{done ? 'Revoir la leçon' : 'Ouvrir la leçon'}<ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" /></span>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'glossaire' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {CATS.map((c) => <button key={c} onClick={() => setCat(c)} className={clsx('rounded-full px-3 py-1.5 text-[12px] ring-1 transition', cat === c ? 'bg-champagne/15 text-champagne-300 ring-champagne/30' : 'bg-white/[0.03] text-bone/60 ring-white/[0.07] hover:text-bone')}>{c}<span className="num ml-1.5 text-[10px] text-mist">{c === 'Tous' ? GLOSSARY.length : GLOSSARY.filter((t) => t.cat === c).length}</span></button>)}
              </div>
              {terms.length === 0 ? <Empty title="Aucun terme trouvé">Le glossaire couvre le parcours vendeur, les livrables et la réglementation.</Empty> : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {terms.map((t) => {
                    const [code, name] = t.term.includes(' · ') ? t.term.split(' · ') : [null, t.term]
                    return (
                      <div key={t.term} className="rounded-[1.2rem] bg-white/[0.02] p-4 ring-1 ring-white/[0.06]">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-baseline gap-2">{code && <span className="num text-[13px] text-champagne-300">{code}</span>}<span className="display text-[1.35rem] leading-tight">{name}</span></div>
                          <span className="shrink-0 text-[10px] uppercase tracking-eyebrow text-mist">{t.cat}</span>
                        </div>
                        <p className="mt-2 text-[12.5px] leading-relaxed text-bone/60">{t.def}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'faq' && (
            faqs.length === 0 ? <Empty title="Aucune question ne correspond">Posez-la au support : nous enrichissons la FAQ à partir de vos demandes.</Empty> : (
              <Card pad={false}>
                <div className="divide-y divide-white/[0.05]">
                  {faqs.map((f, i) => {
                    const open = faqOpen === i
                    return (
                      <div key={f.q}>
                        <button onClick={() => setFaqOpen(open ? null : i)} aria-expanded={open} className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/[0.02]">
                          <span className="num text-[11px] text-mist">{String(i + 1).padStart(2, '0')}</span>
                          <span className="flex-1 text-[14px]">{f.q}</span>
                          <span className={clsx('flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 transition', open ? 'bg-champagne text-ink ring-champagne' : 'text-mist ring-white/[0.08]')}>{open ? <Minus size={12} /> : <Plus size={12} />}</span>
                        </button>
                        <AnimatePresence initial={false}>
                          {open && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: EXPO }} className="overflow-hidden">
                              <div className="pb-5 pl-[3.3rem] pr-5">
                                <p className="max-w-3xl text-[13.5px] leading-relaxed text-bone/65">{f.a}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {f.tour && <SoftBtn icon={<Compass size={13} />} onClick={() => startTour(f.tour!)}>Voir la visite associée</SoftBtn>}
                                  {f.link && <Link to={f.link}><SoftBtn icon={<ArrowUpRight size={13} />}>Ouvrir l’écran</SoftBtn></Link>}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          )}

          {tab === 'raccourcis' && (
            <div className="grid gap-6 lg:grid-cols-12">
              <Card className="lg:col-span-8" kicker="Clavier" title="Raccourcis disponibles">
                <div className="divide-y divide-white/[0.05]">
                  {SHORTCUTS.map((s) => (
                    <div key={s.label} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="flex w-36 shrink-0 gap-1">{s.keys.map((k) => <kbd key={k} className="num min-w-[26px] rounded-lg bg-white/[0.05] px-2 py-1 text-center text-[11.5px] text-bone ring-1 ring-white/[0.1] shadow-bezel">{k}</kbd>)}</div>
                      <div className="min-w-0 flex-1"><div className="text-[13px]">{s.label}</div><div className="text-[11px] text-mist">{s.where}</div></div>
                      {s.demo === 'palette' && <SoftBtn onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}>Essayer</SoftBtn>}
                      {s.demo === 'tour' && <SoftBtn onClick={() => startTour('onboarding')}>Essayer</SoftBtn>}
                      {s.demo === 'help' && <span className="text-[11px] text-sage">Vous y êtes</span>}
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="lg:col-span-4" kicker="Astuce" title="Gagner du temps">
                <Keyboard size={28} weight="light" className="text-champagne-300" />
                <p className="mt-3 text-[13px] leading-relaxed text-bone/60">Dans la palette, tapez directement une action : « générer », « nouveau dossier », « valider ». Les résultats d’action apparaissent avant les fiches.</p>
                <p className="mt-3 text-[13px] leading-relaxed text-bone/60">La visite guidée se pilote entièrement au clavier : ← → pour naviguer, Échap pour quitter à tout moment.</p>
              </Card>
            </div>
          )}

          {tab === 'nouveautes' && (
            <div className="relative space-y-4 pl-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-white/[0.08]">
              {CHANGELOG.map((c, i) => (
                <div key={c.v} className="relative">
                  <span className={clsx('absolute -left-6 top-6 h-3.5 w-3.5 rounded-full ring-4 ring-ink', i === 0 ? 'bg-champagne' : 'bg-white/20')} />
                  <Card>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="num rounded-full bg-champagne/10 px-2.5 py-0.5 text-[12px] text-champagne-300 ring-1 ring-champagne/25">v{c.v}</span>
                      <span className="text-[12px] text-mist">{c.date}</span>
                      {i === 0 && <Pill tone="green">Nouveau</Pill>}
                      <span className="ml-auto">{c.tour ? <SoftBtn icon={<Compass size={13} />} onClick={() => startTour(c.tour!)}>Découvrir</SoftBtn> : c.link ? <Link to={c.link}><SoftBtn icon={<ArrowUpRight size={13} />}>Ouvrir</SoftBtn></Link> : null}</span>
                    </div>
                    <h3 className="display mt-3 text-[1.7rem] leading-tight">{c.title}</h3>
                    <ul className="mt-3 grid gap-1.5 md:grid-cols-2">
                      {c.items.map((it) => <li key={it} className="flex gap-2 text-[13px] text-bone/65"><Sparkle size={12} weight="fill" className="mt-1 shrink-0 text-champagne-300" />{it}</li>)}
                    </ul>
                  </Card>
                </div>
              ))}
            </div>
          )}

          {tab === 'support' && (
            <div className="grid gap-6 lg:grid-cols-12">
              <Card className="lg:col-span-7" kicker="Écrire au support" title="Une question, une anomalie ?">
                <p className="-mt-2 mb-5 text-[12.5px] text-bone/55">Votre demande est enregistrée, une tâche de suivi est ajoutée à votre liste et une notification confirme la prise en compte. Le connecteur support n’étant pas configuré, la demande reste <span className="text-champagne-300">consignée</span> jusqu’à son activation dans Réglages.</p>
                <AsyncForm key={formKey} submitLabel="Envoyer la demande" success="Demande consignée — suivi ajouté à vos tâches" onSubmit={async (v) => {
                  const subject = (v.subject ?? '').trim(), message = (v.message ?? '').trim()
                  if (!subject || !message) throw new Error('Le sujet et le message sont obligatoires')
                  const at = new Date().toISOString()
                  const prio = v.prio === 'haute' ? 'haute' : 'normale'
                  const task = await taskOps.create({ title: `Support Jaspe · ${subject}`, due: prio === 'haute' ? 'Aujourd’hui' : 'Sous 48 h', prio, kind: 'relancer' })
                  await tut.ops.create({ id: `ticket-${Date.now().toString(36)}`, kind: 'ticket', subject, message, category: v.category, prio, page: v.page, at, status: 'consigné', taskId: task.id })
                  await notifOps.create({ at, title: 'Demande support consignée', body: `« ${subject} » — connecteur support non configuré, suivi ajouté à vos tâches.`, tone: 'info', read: false, link: '/app/aide' })
                  setFormKey((k) => k + 1)
                }}>
                  <Field label="Sujet *"><Input name="subject" required maxLength={120} placeholder="Ex. : rappel WhatsApp non programmé" /></Field>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Catégorie"><Select name="category" defaultValue="Question d’usage">{['Question d’usage', 'Anomalie', 'Demande d’évolution', 'Conformité & RGPD'].map((c) => <option key={c}>{c}</option>)}</Select></Field>
                    <Field label="Urgence"><Select name="prio" defaultValue="normale"><option value="normale">Normale</option><option value="haute">Haute</option></Select></Field>
                    <Field label="Écran concerné"><Select name="page" defaultValue="Général">{['Général', 'Aujourd’hui', 'Messagerie', 'Agenda', 'Dossiers', 'Studio', 'Automatisations', 'Pilotage'].map((c) => <option key={c}>{c}</option>)}</Select></Field>
                  </div>
                  <Field label="Message *" hint="N’incluez pas de données personnelles de clients."><Textarea name="message" required rows={5} maxLength={2000} placeholder="Décrivez ce que vous faisiez, ce que vous attendiez et ce qui s’est passé." /></Field>
                </AsyncForm>
              </Card>
              <div className="space-y-6 lg:col-span-5">
                <Card kicker={`${tickets.length} demande${tickets.length > 1 ? 's' : ''}`} title="Mes demandes">
                  {tickets.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-[12.5px] text-bone/50">Aucune demande pour l’instant.</p> : (
                    <div className="space-y-2">
                      {tickets.map((t) => {
                        const closed = t.status === 'clos'
                        return (
                          <div key={t.id} className="rounded-2xl bg-white/[0.02] p-3 ring-1 ring-white/[0.05]">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0"><div className={clsx('truncate text-[13px]', closed && 'text-bone/45 line-through')}>{String(t.subject)}</div><div className="mt-0.5 text-[11px] text-mist">{String(t.category ?? '')} · {fdate(t.at)}</div></div>
                              {closed ? <Pill tone="neutral">Clos</Pill> : <Pill tone={t.prio === 'haute' ? 'red' : 'gold'}>Consigné</Pill>}
                            </div>
                            {!closed && <p className="mt-2 text-[11px] text-bone/45">Connecteur support non configuré — transmission à l’activation.</p>}
                            <div className="mt-2.5 flex gap-1.5">
                              {!closed && <button onClick={() => Promise.all([tut.ops.update(t.id, { status: 'clos' }), t.taskId ? taskOps.update(String(t.taskId), { done: true }) : null]).then(() => toast('Demande close')).catch((e) => toast(errText(e), 'error'))} className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] text-bone/75 ring-1 ring-white/[0.07] hover:text-bone"><Check size={11} />Clore</button>}
                              <button onClick={() => Promise.all([tut.ops.remove(t.id), t.taskId ? taskOps.remove(String(t.taskId)) : null]).then(() => toast('Demande supprimée', 'info')).catch((e) => toast(errText(e), 'error'))} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] text-mist hover:text-coral"><Trash size={11} />Supprimer</button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
                <Card kicker="Avant d’écrire" title="Ressources utiles">
                  <div className="space-y-1.5">
                    {[{ l: 'Parcourir la FAQ', t: 'faq' as Tab, i: Lifebuoy }, { l: 'Chercher un terme', t: 'glossaire' as Tab, i: BookOpen }, { l: 'Voir les nouveautés', t: 'nouveautes' as Tab, i: Lightbulb }].map((r) => (
                      <button key={r.l} onClick={() => goTab(r.t)} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left text-[13px] transition hover:bg-white/[0.03]"><r.i size={16} weight="light" className="text-champagne-300" /><span className="flex-1">{r.l}</span><ArrowRight size={12} className="text-mist" /></button>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <LessonReader lesson={lesson} onClose={() => setLesson(null)} done={!!(lesson && tut.get(`lesson-${lesson.id}`)?.done)}
        onDone={(v) => lesson && tut.upsert(`lesson-${lesson.id}`, { kind: 'lesson', done: v, at: new Date().toISOString() }).then(() => toast(v ? 'Leçon terminée' : 'Leçon rouverte', v ? 'ok' : 'info')).catch((e) => toast(errText(e), 'error'))}
        onTour={launch} />
    </div>
  )
}

function LessonReader({ lesson, onClose, done, onDone, onTour }: { lesson: Lesson | null; onClose: () => void; done: boolean; onDone: (v: boolean) => void; onTour: (id: string) => void }) {
  const [i, setI] = useState(0)
  const [shown, setShown] = useState<string | null>(null)
  if (lesson && shown !== lesson.id) { setShown(lesson.id); setI(0) }
  const s = lesson?.steps[i]
  return (
    <Modal open={!!lesson} onClose={onClose} width={960} kicker={lesson ? `${lesson.role} · ${lesson.level} · ${lesson.minutes} min` : undefined} title={lesson?.title ?? ''}>
      {lesson && s && (
        <div className="grid gap-6 md:grid-cols-[230px_1fr]">
          <ol className="flex gap-2 overflow-x-auto scrollbar-none md:flex-col md:gap-1">
            {lesson.steps.map((st, k) => (
              <li key={st.t} className="shrink-0">
                <button onClick={() => setI(k)} className={clsx('flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition', k === i ? 'bg-white/[0.06] ring-1 ring-white/[0.08]' : 'hover:bg-white/[0.03]')}>
                  <span className={clsx('num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px]', k < i ? 'bg-sage/20 text-sage' : k === i ? 'bg-champagne text-ink' : 'bg-white/[0.05] text-mist')}>{k < i ? <Check size={11} /> : k + 1}</span>
                  <span className={clsx('text-[12.5px] leading-snug', k === i ? 'text-bone' : 'text-bone/55')}>{st.t}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.4, ease: EXPO }}>
                <Shot kind={s.shot} />
                <div className="mt-5 text-[10.5px] uppercase tracking-eyebrow text-mist">Étape {i + 1} sur {lesson.steps.length}</div>
                <h3 className="display mt-1 text-[1.9rem] leading-tight">{s.t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-bone/65">{s.d}</p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-champagne/[0.07] p-4 ring-1 ring-champagne/20">
              <Lightbulb size={18} weight="light" className="mt-0.5 shrink-0 text-champagne-300" />
              <p className="text-[13px] leading-relaxed text-bone/80"><span className="font-medium text-champagne-300">Astuce · </span>{lesson.tip}</p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-5">
              <button onClick={() => setI(i - 1)} disabled={i === 0} aria-label="Étape précédente" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.08] disabled:opacity-35"><ArrowLeft size={14} /></button>
              {i < lesson.steps.length - 1
                ? <SoftBtn tone="gold" onClick={() => setI(i + 1)} icon={<ArrowRight size={14} />}>Étape suivante</SoftBtn>
                : <SoftBtn tone="gold" onClick={() => onDone(!done)} icon={<Check size={14} />}>{done ? 'Leçon terminée ✓' : 'Marquer comme terminée'}</SoftBtn>}
              <span className="flex-1" />
              {lesson.tour && <SoftBtn icon={<Compass size={14} />} onClick={() => onTour(lesson.tour!)}>Lancer la visite guidée</SoftBtn>}
              <Link to={lesson.link} onClick={onClose}><SoftBtn icon={<ArrowUpRight size={14} />}>Ouvrir l’écran</SoftBtn></Link>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
