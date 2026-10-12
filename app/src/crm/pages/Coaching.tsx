import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Play, Pause, Stop, Microphone, MicrophoneSlash, Sparkle, LockSimple, UsersThree, ArrowCounterClockwise, CheckCircle, Warning, Lightbulb, ArrowRight, Timer, Waveform, Trash } from '@phosphor-icons/react'
import { PageHeader, Card, Tabs, SoftBtn, Stagger, Empty } from '../ui'
import { EXPO } from '../../ui/kit'
import { img } from '../../data/mock'
import { useCollection, type Doc } from '../../data/store'
import { toast, errText } from '../forms'

type Scn = 'honoraires' | 'prix' | 'exclu' | 'succession'
const SCENARIOS: { id: Scn; title: string; persona: string; photo: string; ctx: string; open: string; focus: string; skill: number }[] = [
  { id: 'honoraires', title: 'Objection honoraires', persona: 'M. Haddad', photo: img('p-paul'), ctx: 'Appartement Juan-les-Pins · compare avec une agence en ligne', open: 'Cinq pour cent, c’est beaucoup. Une plateforme en ligne me propose un forfait à 4 900 euros.', focus: 'Valeur du service', skill: 2 },
  { id: 'prix', title: 'Prix trop haut', persona: 'Mme Ricci', photo: img('p-sofia'), ctx: 'Penthouse Baudoin · attend 2,3 M€, marché à 1,9 M€', open: 'Ma voisine a vendu 2,4 millions l’an dernier. Je ne vois pas pourquoi je ferais moins.', focus: 'Ancrage par les comparables', skill: 3 },
  { id: 'exclu', title: 'Exclusivité', persona: 'Famille Martin', photo: img('p-marc'), ctx: 'Villa Cap d’Antibes · déçus par une agence en 2019', open: 'L’exclusivité, on a déjà donné. En 2019, l’agence n’a rien fait pendant six mois.', focus: 'Plan d’engagement', skill: 4 },
  { id: 'succession', title: 'Succession conflictuelle', persona: 'Indivision Laurent', photo: img('p-thomas'), ctx: 'Bastide La Salis · 3 héritiers, un frère opposé à la vente', open: 'Mon frère ne signera rien. Il pense que la maison vaut le double et il ne veut pas vendre.', focus: 'Médiation & neutralité', skill: 5 },
]
const LEVELS = ['Accessible', 'Exigeant', 'Redoutable'] as const
type Level = (typeof LEVELS)[number]
const SKILLS = ['Écoute', 'Reformulation', 'Argumentation', 'Objections', 'Conclusion', 'Empathie']

type Moment = { t: string; kind: 'good' | 'miss'; title: string; text: string }
/** Session de coaching enregistrée (collection `coaching`). */
type Session = { id: string; scenario: Scn; title: string; persona: string; level: Level; planned: number; elapsed: number; score: number; skills: number[]; ratio: number; moments: Moment[]; share: 'prive' | 'manager'; at: string; by: string }
const mk = (i: number, scenario: Scn, level: Level, at: string, skills: number[], elapsed: number): Session => {
  const s = SCENARIOS.find((x) => x.id === scenario)!
  return { id: `coach-seed-${i}`, scenario, title: s.title, persona: s.persona, level, planned: 10, elapsed, skills, score: Math.round(skills.reduce((a, b) => a + b, 0) / skills.length), ratio: 44, moments: [{ t: '00:09', kind: 'good', title: 'Reformulation avant argument', text: 'Objection reformulée avant de répondre.' }, { t: '00:41', kind: 'miss', title: 'Conclusion différée', text: 'Pas de question fermée en fin d’échange.' }], share: 'prive', at, by: 'Claire Delmas' }
}
const SEED: Session[] = [
  mk(1, 'honoraires', 'Accessible', '2026-08-25T09:10:00Z', [62, 44, 55, 48, 40, 66], 412),
  mk(2, 'prix', 'Exigeant', '2026-09-02T17:30:00Z', [66, 50, 58, 52, 44, 70], 538),
  mk(3, 'succession', 'Accessible', '2026-09-16T08:45:00Z', [70, 55, 60, 54, 49, 78], 465),
  mk(4, 'honoraires', 'Exigeant', '2026-09-23T18:05:00Z', [72, 58, 66, 60, 52, 76], 590),
  mk(5, 'prix', 'Redoutable', '2026-09-30T07:55:00Z', [74, 61, 70, 66, 50, 80], 640),
]

type Line = { who: 'vendeur' | 'vous'; text: string; hint?: [string, 'good' | 'tip'] }
const script = (s: (typeof SCENARIOS)[number]): Line[] => [
  { who: 'vendeur', text: s.open },
  { who: 'vous', text: 'Je comprends. Si je reformule, vous voulez être certain que chaque euro investi vous rapporte réellement, c’est bien ça ?', hint: ['Reformulation avant argument — très bien', 'good'] },
  { who: 'vendeur', text: 'Exactement. Je ne veux pas payer pour une simple annonce sur un portail.' },
  { who: 'vous', text: 'Alors regardons ensemble ce que nous avons obtenu sur les cinq dernières ventes du quartier, chiffres DVF à l’appui.', hint: ['Preuve sourcée : marque un point', 'good'] },
  { who: 'vendeur', text: 'Les chiffres, tout le monde peut en sortir. Qu’est-ce qui me garantit le résultat ?' },
  { who: 'vous', text: 'Rien ne garantit un prix, mais je peux m’engager sur un plan : photos, visite 3D, avant-première à trois acquéreurs qualifiés dès la semaine prochaine.', hint: ['Pensez à vérifier l’accord avant de conclure', 'tip'] },
  { who: 'vendeur', text: 'Trois acquéreurs déjà ? Vous les avez vraiment ?' },
  { who: 'vous', text: 'Oui, financement validé pour deux d’entre eux. Souhaitez-vous qu’on fixe la séance photo jeudi ?', hint: ['Question fermée de conclusion — bien amenée', 'good'] },
]
const WPS = 0.19 // secondes par mot, rythme de parole simulé
const timeline = (lines: Line[]) => { let t = 0; return lines.map((l) => { const start = t; const dur = l.text.split(' ').length * WPS + 1.1; t += dur; return { start, dur } }) }
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const hmin = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}` : `${Math.max(1, Math.round(s / 60))} min`)
const day = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
const clamp = (v: number) => Math.max(20, Math.min(98, Math.round(v)))
const BIAS = [8, 0, 4, 2, -4, 10]
const LVL: Record<Level, number> = { Accessible: 4, Exigeant: 0, Redoutable: -5 }

/** Évalue la session à partir de ce qui a réellement été joué (répliques atteintes, indications, temps de parole). */
function evaluate(s: (typeof SCENARIOS)[number], level: Level, planned: number, t: number): Omit<Session, 'id' | 'share' | 'at' | 'by'> | null {
  const lines = script(s), tl = timeline(lines)
  const done = tl.map((x) => t >= x.start + x.dur - 0.6)
  const yours = lines.filter((l, i) => l.who === 'vous' && done[i]).length
  if (!yours) return null
  const good = lines.filter((l, i) => done[i] && l.hint?.[1] === 'good').length, tips = lines.filter((l, i) => done[i] && l.hint?.[1] === 'tip').length
  const words = (who?: string) => lines.filter((l, i) => done[i] && (!who || l.who === who)).reduce((n, l) => n + l.text.split(' ').length, 0)
  const ratio = Math.round((words('vous') / (words() || 1)) * 100)
  const progress = yours / lines.filter((l) => l.who === 'vous').length
  const skills = SKILLS.map((_, i) => clamp(40 + progress * 30 + good * 3 - tips * 2 + LVL[level] + BIAS[i] + (i === s.skill ? (progress >= 0.75 ? 6 : -6) : 0) - Math.abs(ratio - 40) / 4))
  const moments: Moment[] = lines.flatMap((l, i) => (done[i] && l.hint ? [{ t: mmss(tl[i].start), kind: l.hint[1] === 'good' ? 'good' as const : 'miss' as const, title: l.hint[0], text: l.text.length > 110 ? `${l.text.slice(0, 110)}…` : l.text }] : []))
  if (progress < 1) moments.push({ t: mmss(t), kind: 'miss', title: 'Conclusion non atteinte', text: 'La session s’est arrêtée avant la question fermée de conclusion.' })
  return { scenario: s.id, title: s.title, persona: s.persona, level, planned, elapsed: Math.round(t), score: Math.round(skills.reduce((a, b) => a + b, 0) / skills.length), skills, ratio, moments }
}

export default function Coaching() {
  const [raw, ops] = useCollection<Session & Doc>('coaching', SEED as (Session & Doc)[])
  const sessions = useMemo(() => [...raw].filter((x) => Array.isArray(x.skills)).sort((a, b) => a.at.localeCompare(b.at)), [raw])
  const [phase, setPhase] = useState<'setup' | 'live' | 'feedback'>('setup')
  const [scn, setScn] = useState<Scn>('honoraires')
  const [level, setLevel] = useState<Level>('Exigeant')
  const [dur, setDur] = useState<'5' | '10' | '15'>('10')
  const [currentId, setCurrentId] = useState<string | null>(null)
  const s = SCENARIOS.find((x) => x.id === scn)!
  const current = sessions.find((x) => x.id === currentId) ?? sessions.at(-1)

  const finish = async (t: number) => {
    const ev = evaluate(s, level, +dur, t)
    if (!ev) { toast('Session trop courte : aucune réplique à évaluer, rien n’est enregistré', 'info'); setPhase('setup'); return }
    try {
      const saved = await ops.create({ ...ev, share: 'prive', at: new Date().toISOString(), by: 'Claire Delmas' })
      setCurrentId(saved.id); setPhase('feedback'); toast(`Session enregistrée · score ${ev.score}`)
    } catch (e) { toast(errText(e), 'error') }
  }
  const remove = async (id: string) => {
    try { await ops.remove(id); toast('Session supprimée'); if (id === current?.id) { setCurrentId(null); setPhase('setup') } } catch (e) { toast(errText(e), 'error') }
  }
  const setShare = async (id: string, share: Session['share']) => {
    try { await ops.update(id, { share }); toast(share === 'prive' ? 'Session repassée en privé' : 'Score partagé avec Marc Olivieri', 'info') } catch (e) { toast(errText(e), 'error') }
  }
  const openSession = (id: string) => { setCurrentId(id); setPhase('feedback') }

  return (
    <div>
      <PageHeader
        kicker="D4 · Simulation de rendez-vous"
        title={<>Coaching <span className="italic text-champagne-300">vendeur</span></>}
        sub="Entraînez-vous à voix haute face à un vendeur simulé, puis recevez un retour précis, compétence par compétence. Chaque session est enregistrée et reste privée par défaut."
        actions={<Tabs id="coach-phase" value={phase} onChange={(p) => { if (p === 'feedback' && !current) return toast('Aucune session enregistrée pour l’instant', 'info'); setPhase(p) }} items={[{ id: 'setup', label: '1 · Préparer' }, { id: 'live', label: '2 · Session' }, { id: 'feedback', label: '3 · Retour' }]} />}
      />
      <AnimatePresence mode="wait">
        <motion.div key={phase} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5, ease: EXPO }}>
          {phase === 'setup' && <Setup {...{ scn, setScn, level, setLevel, dur, setDur, sessions }} onStart={() => setPhase('live')} onOpen={openSession} onRemove={remove} />}
          {phase === 'live' && <Live s={s} level={level} dur={+dur} onEnd={finish} />}
          {phase === 'feedback' && current && <Feedback key={current.id} session={current} sessions={sessions} onShare={(v) => setShare(current.id, v)} onRemove={() => remove(current.id)} onRetry={() => { setScn(current.scenario); setLevel(current.level); setPhase('live') }} onNew={() => setPhase('setup')} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Setup({ scn, setScn, level, setLevel, dur, setDur, sessions, onStart, onOpen, onRemove }: { scn: Scn; setScn: (v: Scn) => void; level: Level; setLevel: (v: Level) => void; dur: '5' | '10' | '15'; setDur: (v: '5' | '10' | '15') => void; sessions: Session[]; onStart: () => void; onOpen: (id: string) => void; onRemove: (id: string) => void }) {
  const s = SCENARIOS.find((x) => x.id === scn)!
  const last = sessions.slice(-8), latest = sessions.at(-1)
  const recent = sessions.slice(-3)
  const avg = SKILLS.map((_, i) => (recent.length ? recent.reduce((n, x) => n + (x.skills[i] ?? 0), 0) / recent.length : 0))
  const weakest = avg.indexOf(Math.min(...avg))
  const advice = SCENARIOS.find((x) => x.skill === weakest) ?? SCENARIOS[2]
  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="space-y-6 xl:col-span-8">
        <Stagger>
          <div className="grid gap-3 sm:grid-cols-2">
            {SCENARIOS.map((x) => {
              const on = x.id === scn, n = sessions.filter((y) => y.scenario === x.id).length
              return (
                <button key={x.id} onClick={() => setScn(x.id)} className={`group relative overflow-hidden rounded-[1.4rem] p-1 text-left ring-1 transition-all duration-500 ease-silk hover:-translate-y-0.5 ${on ? 'bg-champagne/[0.08] ring-champagne/35' : 'bg-white/[0.02] ring-white/[0.06] hover:ring-white/15'}`}>
                  <div className="rounded-[calc(1.4rem-0.25rem)] bg-ink-800/80 p-5 shadow-bezel">
                    <div className="flex items-start gap-3.5">
                      <img src={x.photo} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-ink-700" />
                      <div className="min-w-0 flex-1"><div className="text-[15px] font-medium">{x.title}</div><div className="text-[12px] text-mist">{x.persona} · {x.ctx}</div></div>
                      <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 ${on ? 'bg-champagne ring-champagne' : 'ring-white/15'}`}>{on && <CheckCircle size={14} weight="fill" className="text-ink" />}</span>
                    </div>
                    <p className="mt-4 font-serif text-[17px] italic leading-snug text-bone/80">« {x.open} »</p>
                    <div className="mt-3 flex items-center justify-between text-[11px]"><span className="text-champagne-300">Compétence ciblée · {x.focus}</span><span className="num shrink-0 whitespace-nowrap text-mist">{n ? `${n} session${n > 1 ? 's' : ''}` : 'jamais joué'}</span></div>
                  </div>
                </button>
              )
            })}
          </div>
        </Stagger>
        <Stagger i={1}>
          <Card>
            <div className="grid gap-6 md:grid-cols-2">
              <div><div className="mb-2.5 text-[10.5px] uppercase tracking-eyebrow text-mist">Difficulté</div><Tabs id="coach-level" value={level} onChange={setLevel} items={LEVELS.map((l) => ({ id: l, label: l }))} />
                <p className="mt-2.5 text-[12px] text-bone/50">{level === 'Accessible' ? 'Vendeur ouvert, objections simples, laisse le temps de répondre.' : level === 'Exigeant' ? 'Interrompt, demande des preuves, revient sur ses objections.' : 'Hostile, compare en permanence, menace de partir à la concurrence.'}</p></div>
              <div><div className="mb-2.5 text-[10.5px] uppercase tracking-eyebrow text-mist">Durée</div><Tabs id="coach-dur" value={dur} onChange={setDur} items={[{ id: '5', label: '5 min' }, { id: '10', label: '10 min' }, { id: '15', label: '15 min' }]} />
                <p className="mt-2.5 text-[12px] text-bone/50">Le vendeur simulé conclut de lui-même à l’issue de l’échange.</p></div>
            </div>
            <div className="mt-6 flex flex-col gap-4 border-t border-white/[0.05] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-[12.5px] text-bone/65"><Microphone size={18} weight="light" className="text-champagne-300" />Échange simulé · transcription locale · casque recommandé</div>
              <SoftBtn tone="gold" icon={<Play size={14} weight="fill" />} onClick={onStart}>Lancer la session avec {s.persona}</SoftBtn>
            </div>
          </Card>
        </Stagger>
      </div>
      <div className="space-y-6 xl:col-span-4">
        <Stagger i={2}>
          <Card title="Votre progression" kicker={`${last.length} dernière${last.length > 1 ? 's' : ''} session${last.length > 1 ? 's' : ''}`}>
            {latest ? <>
              <div className="flex items-end justify-between"><span className="display text-5xl">{latest.score}</span>{last.length > 1 && <span className={`text-[12px] ${latest.score >= last[0].score ? 'text-sage' : 'text-coral'}`}>{latest.score >= last[0].score ? '+' : ''}{latest.score - last[0].score} pts depuis le {day(last[0].at)}</span>}</div>
              <Progress sessions={last} />
            </> : <p className="text-[13px] text-bone/55">Aucune session enregistrée. Lancez un premier scénario pour démarrer votre courbe.</p>}
          </Card>
        </Stagger>
        {recent.length > 0 && (
          <Stagger i={3}>
            <Card title="À travailler en priorité" kicker={`Moyenne de vos ${recent.length} dernières sessions`}>
              <div className="flex gap-3"><Lightbulb size={20} weight="light" className="shrink-0 text-champagne-300" /><p className="text-[13px] leading-relaxed text-bone/75">Votre point le plus faible : <b className="font-medium text-bone">{SKILLS[weakest].toLowerCase()}</b> ({Math.round(avg[weakest])}). Le scénario « {advice.title} » cible précisément cette compétence.</p></div>
              {advice.id !== scn && <button onClick={() => setScn(advice.id)} className="mt-3 flex items-center gap-1.5 text-[12px] text-champagne-300">Choisir ce scénario <ArrowRight size={13} /></button>}
            </Card>
          </Stagger>
        )}
        <Stagger i={4}>
          <Card title="Sessions récentes" kicker={`${sessions.length} enregistrée${sessions.length > 1 ? 's' : ''}`}>
            {!sessions.length && <Empty title="Aucune session" />}
            {[...sessions].reverse().slice(0, 6).map((x) => (
              <div key={x.id} className="group flex items-center gap-3 border-b border-white/[0.04] py-2.5 last:border-0">
                <button onClick={() => onOpen(x.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <div className="min-w-0 flex-1"><div className="truncate text-[13px]">{x.title}</div><div className="flex items-center gap-1.5 text-[11px] text-mist">{x.level} · {day(x.at)} · {mmss(x.elapsed)}{x.share === 'manager' ? <UsersThree size={11} className="text-sea" /> : <LockSimple size={11} />}</div></div>
                  <span className="num text-[13px]">{x.score}</span>
                </button>
                <button onClick={() => onRemove(x.id)} aria-label={`Supprimer la session ${x.title}`} title="Supprimer" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-mist transition hover:bg-coral/10 hover:text-coral"><Trash size={13} /></button>
              </div>
            ))}
          </Card>
        </Stagger>
      </div>
    </div>
  )
}

function Live({ s, level, dur, onEnd }: { s: (typeof SCENARIOS)[number]; level: string; dur: number; onEnd: (t: number) => void }) {
  const lines = script(s), tl = timeline(lines)
  const [t, setT] = useState(0)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(false)
  const [ending, setEnding] = useState(false)
  useEffect(() => {
    if (paused || ending) return
    const id = window.setInterval(() => setT((v) => v + 0.1), 100)
    return () => window.clearInterval(id)
  }, [paused, ending])
  const cur = tl.filter((x) => x.start <= t).length - 1
  const end = tl.at(-1)!.start + tl.at(-1)!.dur
  const speaking = cur >= 0 && t < tl[cur].start + tl[cur].dur - 1.1 && !paused
  const who = cur >= 0 ? lines[cur].who : 'vendeur'
  const visible = lines.slice(0, cur + 1).map((l, i) => i < cur ? l.text : l.text.split(' ').slice(0, Math.ceil((t - tl[i].start) / WPS)).join(' '))
  const hints = lines.slice(0, cur + 1).filter((l, i) => l.hint && t > tl[i].start + tl[i].dur - 0.6).map((l) => l.hint!)
  const youWords = lines.slice(0, cur + 1).filter((l) => l.who === 'vous').reduce((n, l) => n + l.text.split(' ').length, 0)
  const allWords = lines.slice(0, cur + 1).reduce((n, l) => n + l.text.split(' ').length, 0) || 1
  const ratio = Math.round((youWords / allWords) * 100)
  const tone = who === 'vendeur' ? ['rgb(var(--sea))', 'rgb(var(--sea-800))'] : ['rgb(var(--acc-300))', 'rgb(var(--acc-700))']
  const stop = () => { if (ending) return; setEnding(true); onEnd(t) }

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <Stagger className="xl:col-span-7">
        <Card pad={false} className="overflow-hidden">
          <div className="relative flex flex-col items-center px-6 pb-8 pt-7">
            <div className="flex w-full items-center justify-between gap-2 text-[12px]">
              <span className="flex items-center gap-2 text-coral"><span className="relative flex h-2 w-2"><span className="absolute inset-0 animate-pulseRing rounded-full bg-coral" /><span className="relative h-2 w-2 rounded-full bg-coral" /></span>{paused ? 'En pause' : 'En direct'}</span>
              <span className="truncate text-mist">{s.title} · {level}</span>
              <span className="num flex items-center gap-1.5 text-bone"><Timer size={14} />{mmss(t)} <span className="text-mist">/ {dur}:00</span></span>
            </div>
            {/* Orbe */}
            <div className="relative mt-8 flex h-56 w-56 items-center justify-center">
              {speaking && [0, 0.7, 1.4].map((d) => <span key={d} className="absolute inset-6 animate-pulseRing rounded-full" style={{ animationDelay: `${d}s`, boxShadow: `0 0 0 1px ${tone[0]}66` }} />)}
              <motion.div className="absolute inset-4 rounded-full blur-2xl" animate={{ background: `radial-gradient(circle, ${tone[0]}55, transparent 70%)` }} transition={{ duration: 0.8, ease: EXPO }} />
              <motion.div className="relative h-40 w-40 rounded-full shadow-float"
                animate={{ scale: speaking ? [1, 1.07, 0.98, 1.05, 1] : 1, background: `radial-gradient(circle at 32% 28%, rgb(var(--bone-50)) 0%, ${tone[0]} 32%, ${tone[1]} 78%, rgb(var(--ink-900)) 100%)` }}
                transition={{ scale: { duration: 1.6, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }, background: { duration: 0.8, ease: EXPO } }} />
              <img src={who === 'vendeur' ? s.photo : img('p-claire')} alt="" className="absolute bottom-3 right-5 h-11 w-11 rounded-full object-cover ring-2 ring-ink-800" />
            </div>
            <div className="mt-4 text-[13px] text-bone/70">{who === 'vendeur' ? `${s.persona} parle…` : 'Vous parlez…'}</div>
            {/* Onde */}
            <div className="mt-5 flex h-12 items-center gap-[3px]">
              {Array.from({ length: 36 }, (_, i) => <span key={i} className={`w-[3px] origin-center rounded-full ${speaking && !(muted && who === 'vous') ? 'animate-wave' : ''}`} style={{ height: `${18 + ((i * 37) % 30)}px`, animationDelay: `${(i % 9) * 0.09}s`, background: tone[0], opacity: speaking ? 0.85 : 0.2, transform: speaking ? undefined : 'scaleY(.2)' }} />)}
            </div>
            <div className="mt-7 flex items-center gap-3">
              <button onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Activer le micro' : 'Couper le micro'} className={`flex h-12 w-12 items-center justify-center rounded-full ring-1 transition ${muted ? 'bg-coral/15 text-coral ring-coral/30' : 'bg-white/[0.04] ring-white/10 hover:bg-white/[0.08]'}`}>{muted ? <MicrophoneSlash size={18} /> : <Microphone size={18} />}</button>
              <button onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Reprendre' : 'Pause'} className="flex h-14 w-14 items-center justify-center rounded-full bg-bone text-ink transition hover:bg-bone-50 active:scale-95">{paused ? <Play size={20} weight="fill" /> : <Pause size={20} weight="fill" />}</button>
              <button onClick={stop} disabled={ending} aria-label="Terminer et enregistrer" className="flex h-12 items-center gap-2 rounded-full bg-coral/15 px-4 text-[13px] text-coral ring-1 ring-coral/30 transition hover:bg-coral/25 disabled:opacity-60"><Stop size={16} weight="fill" />{ending ? 'Enregistrement…' : 'Terminer'}</button>
            </div>
            {t > end && !ending && <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onClick={stop} className="mt-5 flex items-center gap-2 text-[13px] text-champagne-300">Le vendeur a conclu · enregistrer et voir mon retour <ArrowRight size={14} /></motion.button>}
          </div>
        </Card>
      </Stagger>
      <div className="space-y-6 xl:col-span-5">
        <Stagger i={1}>
          <Card title="Transcription en direct" kicker="Locale · seuls le score et les moments clés sont enregistrés" action={<Waveform size={16} weight="light" className="text-mist" />}>
            <div className="thin-scroll flex max-h-[360px] flex-col-reverse overflow-y-auto">
              <div className="space-y-3">
                {visible.map((txt, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EXPO }} className="flex gap-3">
                    <span className="num w-10 shrink-0 pt-0.5 text-[10.5px] text-mist">{mmss(tl[i].start)}</span>
                    <div className="min-w-0"><div className={`text-[10.5px] uppercase tracking-eyebrow ${lines[i].who === 'vous' ? 'text-champagne-300' : 'text-sea'}`}>{lines[i].who === 'vous' ? 'Vous' : s.persona}</div><p className="mt-0.5 text-[13.5px] leading-relaxed text-bone/85">{txt}{i === cur && speaking && <span className="ml-0.5 inline-block h-3.5 w-px animate-pulse bg-bone align-middle" />}</p></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </Stagger>
        <Stagger i={2}>
          <Card title="Coach discret" kicker="Indications en temps réel">
            <div className="mb-4">
              <div className="flex justify-between text-[11px] text-mist"><span>Temps de parole · vous {ratio} %</span><span>idéal 35–45 %</span></div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sea/30"><motion.div className="h-full rounded-full bg-champagne" animate={{ width: `${ratio}%` }} transition={{ duration: 0.6, ease: EXPO }} /></div>
            </div>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {hints.slice(-3).reverse().map(([h, k]) => (
                  <motion.div key={h} layout initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, ease: EXPO }} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] ring-1 ${k === 'good' ? 'bg-sage/[0.07] ring-sage/20' : 'bg-champagne/[0.07] ring-champagne/20'}`}>
                    {k === 'good' ? <CheckCircle size={15} weight="fill" className="shrink-0 text-sage" /> : <Lightbulb size={15} weight="fill" className="shrink-0 text-champagne" />}{h}
                  </motion.div>
                ))}
              </AnimatePresence>
              {!hints.length && <div className="text-[12.5px] text-bone/45">Les indications apparaissent au fil de l’échange.</div>}
            </div>
          </Card>
        </Stagger>
      </div>
    </div>
  )
}

function Radar({ now, before }: { now: number[]; before?: number[] }) {
  const R = 110, C = 150, n = SKILLS.length
  const pt = (i: number, v: number) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return [C + Math.cos(a) * R * (v / 100), C + Math.sin(a) * R * (v / 100)] }
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v).join(',')).join(' ')
  return (
    <svg viewBox="0 0 300 300" className="mx-auto w-full max-w-[340px] overflow-visible">
      {[25, 50, 75, 100].map((r) => <polygon key={r} points={poly(Array(n).fill(r))} fill="none" stroke="rgb(var(--tint) / .07)" />)}
      {SKILLS.map((_, i) => { const [x, y] = pt(i, 100); return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgb(var(--tint) / .06)" /> })}
      {before && <polygon points={poly(before)} fill="none" stroke="rgb(var(--mist-500))" strokeDasharray="3 4" strokeWidth="1" />}
      <motion.polygon key={now.join()} points={poly(now)} fill="rgb(var(--acc-500) / .18)" stroke="rgb(var(--acc-500))" strokeWidth="1.5" style={{ transformOrigin: '150px 150px' }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, ease: EXPO, delay: 0.2 }} />
      {now.map((v, i) => { const [x, y] = pt(i, v); return <motion.circle key={i} cx={x} cy={y} r="3" fill="rgb(var(--acc-300))" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 + i * 0.05 }} /> })}
      {SKILLS.map((s, i) => { const [x, y] = pt(i, 128); return <text key={s} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="rgb(var(--mist-300))" fontSize="11" fontFamily="Geist">{s}<tspan x={x} dy="13" fill="rgb(var(--bone-200))" fontFamily="Geist Mono" fontSize="10.5">{now[i]}</tspan></text> })}
    </svg>
  )
}

/** Courbe du score global, issue des sessions enregistrées. */
function Progress({ sessions, highlight }: { sessions: Session[]; highlight?: string }) {
  if (!sessions.length) return null
  const w = 320, h = 110
  const vals = sessions.map((x) => x.score)
  const min = Math.min(40, ...vals) - 5, max = Math.max(90, ...vals)
  const pts = vals.map((v, i) => [sessions.length === 1 ? w / 2 : 10 + (i / (sessions.length - 1)) * (w - 20), h - 18 - ((v - min) / (max - min)) * (h - 30)])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const hi = sessions.findIndex((x) => x.id === highlight)
  const focus = hi >= 0 ? hi : sessions.length - 1
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 w-full overflow-visible">
      <defs><linearGradient id="coach-g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="rgb(var(--acc-500))" stopOpacity=".25" /><stop offset="1" stopColor="rgb(var(--acc-500))" stopOpacity="0" /></linearGradient></defs>
      {pts.length > 1 && <path d={`${d} L${pts.at(-1)![0]},${h - 18} L${pts[0][0]},${h - 18} Z`} fill="url(#coach-g)" />}
      <motion.path key={d} d={d} fill="none" stroke="rgb(var(--acc-500))" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: EXPO }} />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === focus ? 3.5 : 2} fill={i === focus ? 'rgb(var(--acc-300))' : 'rgb(var(--acc-700))'}><title>{`${sessions[i].title} · ${vals[i]}`}</title></circle>)}
      {sessions.map((x, i) => (i % 2 === (sessions.length - 1) % 2 ? <text key={x.id} x={pts[i][0]} y={h - 2} textAnchor="middle" fontSize="9" fill="rgb(var(--mist-500))" fontFamily="Geist Mono">{day(x.at)}</text> : null))}
    </svg>
  )
}

function Feedback({ session, sessions, onShare, onRemove, onRetry, onNew }: { session: Session; sessions: Session[]; onShare: (v: Session['share']) => void; onRemove: () => void; onRetry: () => void; onNew: () => void }) {
  const idx = sessions.findIndex((x) => x.id === session.id)
  const prev = idx > 0 ? sessions[idx - 1] : undefined
  const window8 = sessions.slice(Math.max(0, idx - 7), idx + 1)
  const delta = prev ? session.score - prev.score : null
  const total = sessions.reduce((n, x) => n + (x.elapsed ?? 0), 0)
  const best = Math.max(...sessions.map((x) => x.score))
  const [confirm, setConfirm] = useState(false)
  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <div className="space-y-6 xl:col-span-7">
        <Stagger>
          <Card>
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="md:w-48">
                <div className="text-[10.5px] uppercase tracking-eyebrow text-mist">Score global</div>
                <div className="mt-1 flex items-end gap-2"><span className="display text-7xl leading-none">{session.score}</span>{delta !== null && <span className={`mb-2 text-[13px] ${delta >= 0 ? 'text-sage' : 'text-coral'}`}>{delta >= 0 ? '+' : ''}{delta}</span>}</div>
                <div className="mt-2 text-[12px] text-bone/55">{session.title} · {session.level}<br />Durée {mmss(session.elapsed)} · {session.persona}<br />{new Date(session.at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-mist"><span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-champagne" />Cette session</span>{prev && <span className="flex items-center gap-1.5"><span className="h-0 w-4 border-t border-dashed border-mist" />Précédente ({day(prev.at)})</span>}</div>
              </div>
              <div className="flex-1"><Radar now={session.skills} before={prev?.skills} /></div>
            </div>
          </Card>
        </Stagger>
        <Stagger i={1}>
          <Card title="Moments clés" kicker={`Horodatés · temps de parole ${session.ratio} %`}>
            <div className="space-y-2">
              {session.moments.map((m, i) => (
                <div key={i} className="flex gap-3 rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/[0.05]">
                  <span className="num flex h-7 shrink-0 items-center rounded-full bg-white/[0.05] px-2 text-[11px] text-bone/80">{m.t}</span>
                  <div className="min-w-0"><div className="flex items-center gap-2 text-[13px]">{m.kind === 'good' ? <CheckCircle size={14} weight="fill" className="shrink-0 text-sage" /> : <Warning size={14} weight="fill" className="shrink-0 text-coral" />}{m.title}</div><div className="mt-0.5 text-[12px] leading-relaxed text-bone/55">{m.text}</div></div>
                </div>
              ))}
              {!session.moments.length && <div className="text-[12.5px] text-bone/50">Aucun moment marquant relevé.</div>}
            </div>
          </Card>
        </Stagger>
        <Stagger i={2}>
          <Card title="Reformulations suggérées" kicker="Ce que vous avez dit · ce qui porterait davantage">
            {[['Rien ne garantit un prix, mais je peux m’engager sur un plan.', 'Je m’engage par écrit : trois visites qualifiées sous 21 jours, sinon nous revoyons ensemble la stratégie, sans frais.'], ['Les chiffres DVF montrent que…', 'Sur les cinq maisons vendues à moins de 900 m depuis un an, quatre l’ont été entre 15 800 et 17 900 € le mètre carré.']].map(([a, b]) => (
              <div key={a} className="mb-3 grid gap-2 last:mb-0 md:grid-cols-2">
                <div className="rounded-xl bg-coral/[0.05] p-3.5 text-[13px] leading-relaxed text-bone/60 ring-1 ring-coral/15"><div className="mb-1 text-[10px] uppercase tracking-eyebrow text-coral">Dit</div>« {a} »</div>
                <div className="rounded-xl bg-sage/[0.06] p-3.5 text-[13px] leading-relaxed ring-1 ring-sage/20"><div className="mb-1 text-[10px] uppercase tracking-eyebrow text-sage">Suggéré</div>« {b} »</div>
              </div>
            ))}
          </Card>
        </Stagger>
      </div>
      <div className="space-y-6 xl:col-span-5">
        <Stagger i={2}>
          <Card title="Progression dans le temps" kicker={`Score global · ${window8.length} session${window8.length > 1 ? 's' : ''}`}>
            <Progress sessions={window8} highlight={session.id} />
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">{[['Sessions', String(sessions.length)], ['Temps total', hmin(total)], ['Meilleur', String(best)]].map(([l, v]) => <div key={l} className="rounded-xl bg-white/[0.02] p-2.5 ring-1 ring-white/[0.05]"><div className="display text-2xl">{v}</div><div className="text-[10.5px] text-mist">{l}</div></div>)}</div>
          </Card>
        </Stagger>
        <Stagger i={3}>
          <Card title="Confidentialité" kicker="Enregistrée avec la session">
            <Tabs id="coach-share" value={session.share} onChange={onShare} items={[{ id: 'prive', label: <span className="flex items-center gap-1.5"><LockSimple size={13} />Privé</span> }, { id: 'manager', label: <span className="flex items-center gap-1.5"><UsersThree size={13} />Partagé avec Marc O.</span> }]} />
            <AnimatePresence mode="wait">
              <motion.p key={session.share} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EXPO }} className="mt-3 text-[12.5px] leading-relaxed text-bone/60">
                {session.share === 'prive' ? 'Seule vous avez accès au score, aux compétences et aux moments clés. Rien ne remonte dans le pilotage d’agence.' : 'Votre manager voit le score et les compétences, jamais la transcription. Vous pouvez retirer le partage à tout moment.'}
              </motion.p>
            </AnimatePresence>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/[0.02] px-3 py-2.5 text-[11.5px] text-bone/55 ring-1 ring-white/[0.05]"><Sparkle size={13} weight="fill" className="text-champagne" />Aucun audio conservé · transcription locale non enregistrée (RGPD).</div>
          </Card>
        </Stagger>
        <Stagger i={4}>
          <div className="flex flex-wrap gap-2">
            <SoftBtn tone="gold" icon={<ArrowCounterClockwise size={14} />} onClick={onRetry}>Rejouer ce scénario</SoftBtn>
            <SoftBtn onClick={onNew}>Choisir un autre scénario</SoftBtn>
            {confirm
              ? <button onClick={onRemove} className="inline-flex items-center gap-2 rounded-full bg-coral/15 px-4 py-2 text-[13px] font-medium text-coral ring-1 ring-coral/30 transition hover:bg-coral/25"><Trash size={14} />Confirmer la suppression</button>
              : <SoftBtn icon={<Trash size={14} />} onClick={() => setConfirm(true)}>Supprimer la session</SoftBtn>}
          </div>
        </Stagger>
      </div>
    </div>
  )
}
