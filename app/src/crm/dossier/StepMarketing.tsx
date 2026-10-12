import { useState } from 'react'
import clsx from 'clsx'
import { motion } from 'motion/react'
import { Broadcast, Camera, Cube, Plus, PencilSimple, Trash, Eye, ChatCircleDots, Door, Warning, FileText, PaperPlaneTilt, Sparkle, X, CheckCircle } from '@phosphor-icons/react'
import { Card, SoftBtn, Stagger, Empty } from '../ui'
import { Avatar, Pill, EXPO } from '../../ui/kit'
import { prop, agent, img } from '../../data/mock'
import { PORTALS } from '../../data/geo'
import type { Journey, Visit, SellerReport } from '../../data/dossier'
import { useAgents, useEvents, useConversations, useOutbox, useTasks } from '../../data/collections'
import { Modal, AsyncForm, Field, Input, Select, Textarea, toast } from '../forms'
import { stepProgress } from './Stepper'
import { StepHead, Kpi, mandateOf, Paper, useRun, todayIso, addDays, agendaDay, daysFrom, fdate, uid, consignSend } from './sale-ui'
import type { StepProps } from './index'

type PState = 'publiée' | 'en attente' | 'retirée' | 'off'
type Diff = Journey['diffusion'] & { stats?: Record<string, { views: number; contacts: number }>; provider?: string; shootingTime?: string; shootingEventId?: string; shootingKind?: string }
const PS: Record<PState, { l: string; tone: 'green' | 'blue' | 'red' | 'neutral' }> = { publiée: { l: 'En ligne', tone: 'green' }, 'en attente': { l: 'En attente', tone: 'blue' }, retirée: { l: 'Retirée', tone: 'red' }, off: { l: 'Non diffusée', tone: 'neutral' } }
const REPORTS: { label: 'J+7' | 'J+21' | 'J+42'; d: number }[] = [{ label: 'J+7', d: 7 }, { label: 'J+21', d: 21 }, { label: 'J+42', d: 42 }]
const FOLLOW = ['Deuxième visite', 'Offre attendue', 'Relance dans 15 jours', 'Envoyer des pièces', 'Pas de suite']

export default function StepMarketing({ dossier, journey, save, goTo }: StepProps) {
  const p = prop(dossier.propertyId), ag = agent(dossier.agentId)
  const diff = journey.diffusion as Diff
  const visits = [...journey.visits].sort((a, b) => b.date.localeCompare(a.date))
  const [agents] = useAgents()
  const [, evOps] = useEvents()
  const [convs] = useConversations()
  const [, outbox] = useOutbox()
  const [, taskOps] = useTasks()
  const { busy, run } = useRun()
  const [visitEdit, setVisitEdit] = useState<Visit | 'new' | null>(null)
  const [shoot, setShoot] = useState(false)
  const [preview, setPreview] = useState<SellerReport | null>(null)
  const [statEdit, setStatEdit] = useState<string | null>(null)

  const signed = mandateOf(dossier, journey).signature === 'signé'
  const start = diff.startedAt ?? journey.mandate.start
  const sellerConv = convs.find((c) => c.dossierId === dossier.id && c.tags.includes('Vendeur'))
  const stats = diff.stats ?? {}
  const statTotal = Object.values(stats).reduce((s, x) => ({ views: s.views + x.views, contacts: s.contacts + x.contacts }), { views: 0, contacts: 0 })
  const lastRep = [...journey.reports].sort((a, b) => b.date.localeCompare(a.date))[0]
  const views = statTotal.views || lastRep?.views || 0, contacts = statTotal.contacts || lastRep?.contacts || 0
  const hot = journey.visits.filter((v) => v.interest >= 4).length
  const funnel = [{ l: 'Vues', v: views, I: Eye }, { l: 'Contacts', v: contacts, I: ChatCircleDots }, { l: 'Visites', v: journey.visits.length, I: Door }, { l: 'Intérêt fort', v: hot, I: Sparkle }, { l: 'Offres', v: journey.offers.length, I: FileText }]
  const lastVisit = visits[0]?.date
  const idle = signed ? -daysFrom(lastVisit ?? start ?? todayIso()) : 0
  const published = PORTALS.filter((k) => diff.portals[k] === 'publiée').length

  const setDiff = (patch: Partial<Diff>) => save({ diffusion: { ...diff, ...patch } as Journey['diffusion'] })
  const setPortal = (k: string, s: PState) => run(k, () => setDiff({ portals: { ...diff.portals, [k]: s }, startedAt: diff.startedAt ?? (s !== 'off' ? todayIso() : undefined) }),
    s === 'en attente' ? `${k} : demande consignée — connecteur portail non configuré` : s === 'publiée' ? `${k} : annonce confirmée en ligne` : `${k} : annonce ${s === 'retirée' ? 'retirée' : 'désactivée'}`, s === 'en attente' ? 'info' : 'ok')
  const diffuseAll = () => run('all', () => setDiff({ portals: Object.fromEntries(PORTALS.map((k) => [k, diff.portals[k] === 'publiée' ? 'publiée' : 'en attente'])), startedAt: diff.startedAt ?? todayIso() }), 'Diffusion multiportail consignée — connecteurs non configurés', 'info')

  const saveVisit = async (v: Record<string, string>) => {
    if (!v.buyer.trim()) throw new Error('Acquéreur requis')
    if (!v.date) throw new Error('Date requise')
    const doc: Visit = { id: visitEdit && visitEdit !== 'new' ? visitEdit.id : uid('v'), date: v.date, buyer: v.buyer.trim(), agent: v.agent, interest: Number(v.interest) as Visit['interest'], feedback: v.feedback.trim() || undefined, objections: v.objections.trim() || undefined, followUp: v.followUp || undefined }
    await save({ visits: visitEdit === 'new' ? [doc, ...journey.visits] : journey.visits.map((x) => (x.id === doc.id ? doc : x)) })
    setVisitEdit(null)
  }
  const delVisit = (v: Visit) => window.confirm(`Supprimer la visite de ${v.buyer} ?`) && run(`del${v.id}`, () => save({ visits: journey.visits.filter((x) => x.id !== v.id) }), 'Visite supprimée')

  const saveShoot = async (v: Record<string, string>) => {
    if (!v.date || !v.provider.trim()) throw new Error('Date et prestataire requis')
    const [h, mi] = (v.time || '09:00').split(':').map(Number)
    const end = `${String(h + (v.kind === 'photo' ? 2 : 3)).padStart(2, '0')}:${String(mi).padStart(2, '0')}`
    if (diff.shootingEventId) await evOps.remove(diff.shootingEventId).catch(() => {})
    const label = v.kind === 'photo' ? 'Shooting photo' : v.kind === '3d' ? 'Visite 3D' : 'Shooting photo & visite 3D'
    const ev = await evOps.create({ day: agendaDay(v.date), start: v.time || '09:00', end, title: `${label} — ${p.title}`, who: v.provider.trim(), place: `${p.address}, ${p.city}`, kind: 'interne', dossier: dossier.id, source: 'nxt' })
    await setDiff({ shooting: v.date, shootingTime: v.time || '09:00', provider: v.provider.trim(), visit3d: v.kind !== 'photo', shootingKind: label, shootingEventId: ev.id })
    setShoot(false)
  }
  const cancelShoot = () => run('cs', async () => { if (diff.shootingEventId) await evOps.remove(diff.shootingEventId); await setDiff({ shooting: undefined, shootingTime: undefined, provider: undefined, shootingEventId: undefined }) }, 'Shooting annulé et retiré de l’agenda')

  const saveStat = async (k: string, v: Record<string, string>) => { await setDiff({ stats: { ...stats, [k]: { views: Number(v.views) || 0, contacts: Number(v.contacts) || 0 } } }); setStatEdit(null) }

  /** Bilan construit à partir des visites réelles jusqu’à l’échéance. */
  const buildReport = (label: SellerReport['label'], due: string): SellerReport => {
    const upTo = due < todayIso() ? due : todayIso()
    const vs = journey.visits.filter((v) => v.date <= upTo)
    const avg = vs.length ? vs.reduce((s, v) => s + v.interest, 0) / vs.length : 0
    const objs = [...new Set(vs.flatMap((v) => (v.objections ? v.objections.split(/[,;]/).map((x) => x.trim()) : [])).filter(Boolean))]
    const best = [...vs].sort((a, b) => b.interest - a.interest)[0]
    const parts = [
      `${vs.length} visite${vs.length > 1 ? 's' : ''} depuis le lancement${vs.length ? `, intérêt moyen ${avg.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}/5` : ''}.`,
      best ? `Piste la plus avancée : ${best.buyer} (${best.interest}/5)${best.followUp ? ` — ${best.followUp.toLowerCase()}` : ''}.` : 'Aucune visite à ce stade : nous recommandons un point sur le prix et la mise en avant.',
      objs.length ? `Objections relevées : ${objs.join(', ').toLowerCase()}.` : '',
      `${published} portail${published > 1 ? 's' : ''} en ligne · ${views.toLocaleString('fr-FR')} vues · ${contacts} contacts.`,
    ]
    return { id: journey.reports.find((r) => r.label === label)?.id ?? uid('r'), label, date: due, views, contacts, visits: vs.length, summary: parts.filter(Boolean).join(' '), sent: false }
  }
  const generate = (label: SellerReport['label'], due: string) => run(`g${label}`, async () => {
    const r = buildReport(label, due)
    await save({ reports: [...journey.reports.filter((x) => x.label !== label), r].sort((a, b) => a.date.localeCompare(b.date)) })
    setPreview(r)
  }, `Bilan ${label} généré depuis ${journey.visits.length} visite(s)`)
  const sendReport = (r: SellerReport) => run(`s${r.label}`, async () => {
    const text = `Bonjour, voici votre bilan ${r.label} pour ${p.title} : ${r.summary} ${ag.name}`
    const via = await consignSend({ conv: sellerConv, text, template: 'tpl-bilan', outbox, dossierId: dossier.id, code: `BILAN-${r.label}`, to: dossier.seller, subject: `Votre bilan ${r.label} — ${p.title}` })
    await save({ reports: journey.reports.map((x) => (x.id === r.id ? { ...x, sent: true, sentVia: via } as SellerReport : x)) })
    setPreview(null)
    toast(`Bilan ${r.label} ${via}`, 'info')
  })
  const idleTask = (title: string) => run('t', () => taskOps.create({ title: `${title} — ${dossier.seller}`, dossier: dossier.id, due: 'Sous 48 h', prio: 'haute', kind: 'appeler', ai: true, done: false }), 'Tâche créée')

  const dueReports = REPORTS.map((x) => ({ ...x, due: start ? addDays(start, x.d) : undefined, rep: journey.reports.find((r) => r.label === x.label) }))
  const pending = dueReports.find((x) => x.due && x.due <= addDays(todayIso(), 2) && !x.rep?.sent)
  const prog = stepProgress(dossier, journey).marketing
  const next = !signed
    ? { label: 'Le mandat n’est pas encore signé : la diffusion reste en préparation.', cta: 'Aller au mandat', onClick: () => goTo('mandate'), tone: 'coral' as const }
    : !published ? { label: 'Diffuser l’annonce sur les portails.', hint: `${PORTALS.length} portails disponibles`, cta: 'Tout diffuser', onClick: diffuseAll }
      : !diff.shooting ? { label: 'Planifier le shooting photo et la visite 3D.', cta: 'Planifier', onClick: () => setShoot(true) }
        : idle > 14 ? { label: `Aucune visite depuis ${idle} jours : revoir la stratégie.`, cta: 'Créer une tâche', onClick: () => idleTask('Point stratégie prix / mise en avant'), tone: 'coral' as const }
          : pending ? { label: `Bilan vendeur ${pending.label} ${pending.rep ? 'à envoyer' : 'à générer'} (échéance ${fdate(pending.due, { day: 'numeric', month: 'short' })}).`, cta: pending.rep ? 'Aperçu & envoi' : 'Générer', onClick: () => (pending.rep ? setPreview(pending.rep) : generate(pending.label, pending.due!)) }
            : journey.offers.length ? { label: 'Une offre est arrivée : passer à la négociation.', cta: 'Voir les offres', onClick: () => goTo('offers'), tone: 'sage' as const }
              : { label: 'Saisir le retour de chaque visite pour nourrir les bilans.', cta: 'Ajouter une visite', onClick: () => setVisitEdit('new') }
  const editV = visitEdit && visitEdit !== 'new' ? visitEdit : undefined

  return (
    <>
      <Stagger i={0}>
        <StepHead n={5} kicker="Commercialisation" progress={prog} next={next}
          title={<>Diffusion & <span className="italic text-champagne-300">visites</span></>}
          sub={start ? `Lancée le ${fdate(start)} · J+${Math.max(0, -daysFrom(start))}` : 'Diffusion non lancée'}
          aside={<><Pill tone="green">{published}/{PORTALS.length} portails</Pill><Pill tone="blue">{journey.visits.length} visites</Pill>{diff.visit3d && <Pill tone="gold">Visite 3D</Pill>}</>} />
      </Stagger>

      {idle > 14 && (
        <Stagger i={1}>
          <div className="flex flex-col gap-3 rounded-2xl bg-coral/[0.08] p-4 ring-1 ring-coral/25 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3"><Warning size={20} weight="fill" className="mt-0.5 shrink-0 text-coral" /><div><div className="text-[14px]">Mandat sans visite depuis {idle} jours</div><div className="text-[12px] text-bone/55">{lastVisit ? `Dernière visite le ${fdate(lastVisit)}` : `Aucune visite depuis le lancement (${fdate(start)})`} — seuil d’alerte : 14 jours.</div></div></div>
            <div className="flex flex-wrap gap-2"><SoftBtn onClick={() => idleTask('Proposer un ajustement de prix')}>Ajuster le prix</SoftBtn><SoftBtn tone="gold" onClick={() => idleTask('Relancer les acquéreurs compatibles')}>Relancer les acquéreurs</SoftBtn></div>
          </div>
        </Stagger>
      )}

      {/* Statistiques & entonnoir */}
      <Stagger i={2}>
        <Card title="Performance" kicker="Statistiques & entonnoir">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label="Vues" value={views.toLocaleString('fr-FR')} hint={statTotal.views ? 'Somme des portails' : lastRep ? `Bilan ${lastRep.label}` : 'Saisir par portail'} />
            <Kpi label="Contacts" value={contacts} hint={views ? `${((contacts / views) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % des vues` : '—'} />
            <Kpi label="Visites" value={journey.visits.length} tone="sea" hint={contacts ? `${Math.round((journey.visits.length / contacts) * 100)} % des contacts` : '—'} />
            <Kpi label="Intérêt moyen" value={journey.visits.length ? (journey.visits.reduce((s, v) => s + v.interest, 0) / journey.visits.length).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '—'} tone="sage" hint="sur 5" />
          </div>
          <div className="mt-5 space-y-2">
            {funnel.map((f, i) => {
              const w = funnel[0].v ? Math.max(4, Math.sqrt(f.v / funnel[0].v) * 100) : f.v ? 40 : 4
              return (
                <div key={f.l} className="grid grid-cols-[7rem_1fr_3.5rem] items-center gap-3 text-[12.5px]">
                  <span className="flex items-center gap-2 text-bone/70"><f.I size={14} weight="light" />{f.l}</span>
                  <div className="h-7 rounded-lg bg-white/[0.03]"><motion.div className="h-full rounded-lg bg-gradient-to-r from-champagne/70 to-champagne/30" initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ duration: 1, ease: EXPO, delay: i * 0.08 }} /></div>
                  <span className="num text-right">{f.v.toLocaleString('fr-FR')}</span>
                </div>
              )
            })}
          </div>
        </Card>
      </Stagger>

      <div className="grid gap-6 2xl:grid-cols-[1.3fr_1fr]">
        <Stagger i={3}>
          <Card title="Diffusion par portail" kicker="Multiportail" action={<SoftBtn tone="gold" icon={<Broadcast size={14} />} onClick={diffuseAll} disabled={!signed}>{busy === 'all' ? 'Consignation…' : 'Tout diffuser'}</SoftBtn>}>
            <ul className="divide-y divide-white/[0.05]">
              {PORTALS.map((k) => {
                const s = (diff.portals[k] ?? 'off') as PState, st = stats[k]
                return (
                  <li key={k} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0"><div className="flex items-center gap-2 text-[13.5px]">{k}<Pill tone={PS[s].tone}>{PS[s].l}</Pill></div>
                      <button onClick={() => setStatEdit(k)} className="mt-0.5 text-[11.5px] text-mist hover:text-bone">{st ? `${st.views.toLocaleString('fr-FR')} vues · ${st.contacts} contacts` : 'Saisir les statistiques'} · modifier</button></div>
                    <div className="flex flex-wrap gap-1.5">
                      {(s === 'off' || s === 'retirée') && <SoftBtn onClick={() => setPortal(k, 'en attente')} disabled={!signed}>Demander la publication</SoftBtn>}
                      {s === 'en attente' && <SoftBtn tone="gold" onClick={() => setPortal(k, 'publiée')}>Confirmer en ligne</SoftBtn>}
                      {(s === 'publiée' || s === 'en attente') && <SoftBtn onClick={() => setPortal(k, 'retirée')}>Retirer</SoftBtn>}
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 text-[11.5px] text-mist">Connecteurs portails non configurés : chaque demande est consignée, la mise en ligne se confirme manuellement.</p>
          </Card>
        </Stagger>

        <Stagger i={4}>
          <Card title="Shooting & visite 3D" kicker="Production" action={<SoftBtn icon={<Camera size={14} />} onClick={() => setShoot(true)}>{diff.shooting ? 'Replanifier' : 'Planifier'}</SoftBtn>}>
            {diff.shooting ? (
              <div className="overflow-hidden rounded-2xl ring-1 ring-white/[0.06]">
                <div className="theme-dark relative h-36"><img src={p.photo} alt="" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-ink/90 to-transparent" />
                  <div className="absolute bottom-3 left-4 text-bone"><div className="text-[10.5px] uppercase tracking-eyebrow text-bone/60">{diff.shootingKind ?? (diff.visit3d ? 'Shooting photo & visite 3D' : 'Shooting photo')}</div><div className="display text-2xl">{fdate(diff.shooting, { weekday: 'long', day: 'numeric', month: 'long' })}{diff.shootingTime ? ` · ${diff.shootingTime}` : ''}</div></div></div>
                <div className="flex flex-wrap items-center justify-between gap-2 p-4 text-[12.5px]">
                  <span className="text-bone/70">{diff.provider ?? 'Prestataire non renseigné'} · {daysFrom(diff.shooting) >= 0 ? `dans ${daysFrom(diff.shooting)} j` : 'réalisé'}</span>
                  <span className="flex items-center gap-3">{diff.shootingEventId && <span className="flex items-center gap-1 text-sage"><CheckCircle size={14} weight="fill" />Dans l’agenda</span>}{diff.visit3d && <span className="flex items-center gap-1 text-champagne-300"><Cube size={14} />3D</span>}<button onClick={cancelShoot} className="text-coral hover:underline">Annuler</button></span>
                </div>
              </div>
            ) : <Empty title="Rien de planifié">Planifiez le photographe et la visite 3D : un événement est créé dans l’agenda.</Empty>}
            <div className="mt-4 grid grid-cols-4 gap-2">{p.gallery.slice(0, 4).map((g) => <img key={g} src={g} alt="" className="aspect-square w-full rounded-xl object-cover ring-1 ring-white/[0.06]" />)}</div>
          </Card>
        </Stagger>
      </div>

      {/* Visites */}
      <Stagger i={5}>
        <Card title="Visites & retours" kicker={`${journey.visits.length} visite(s)`} action={<SoftBtn tone="gold" icon={<Plus size={14} />} onClick={() => setVisitEdit('new')}>Ajouter une visite</SoftBtn>}>
          {visits.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {visits.map((v) => {
                const va = agents.find((x) => x.name === v.agent)
                return (
                  <li key={v.id} className="rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3"><Avatar src={va?.photo ?? img('p-claire')} size={32} /><div><div className="text-[13.5px]">{v.buyer}</div><div className="text-[11.5px] text-mist">{fdate(v.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {v.agent}</div></div></div>
                      <div className="flex gap-0.5" title={`Intérêt ${v.interest}/5`}>{[1, 2, 3, 4, 5].map((n) => <span key={n} className={clsx('h-2 w-4 rounded-full', n <= v.interest ? (v.interest >= 4 ? 'bg-sage' : v.interest >= 3 ? 'bg-champagne' : 'bg-coral') : 'bg-white/10')} />)}</div>
                    </div>
                    {v.feedback && <p className="mt-3 text-[12.5px] text-bone/75">« {v.feedback} »</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {v.objections && <Pill tone="red">{v.objections}</Pill>}
                      {v.followUp && <Pill tone="blue">{v.followUp}</Pill>}
                      <span className="ml-auto flex gap-1"><button aria-label="Modifier" onClick={() => setVisitEdit(v)} className="rounded-full p-1.5 text-mist hover:bg-white/[0.06] hover:text-bone"><PencilSimple size={14} /></button><button aria-label="Supprimer" onClick={() => delVisit(v)} className="rounded-full p-1.5 text-mist hover:bg-coral/10 hover:text-coral"><Trash size={14} /></button></span>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : <Empty title="Aucune visite">Ajoutez chaque visite avec le retour de l’acquéreur : il alimente les bilans vendeur.</Empty>}
        </Card>
      </Stagger>

      {/* Bilans vendeur */}
      <Stagger i={6}>
        <Card title="Bilans vendeur" kicker="J+7 · J+21 · J+42">
          <div className="grid gap-3 md:grid-cols-3">
            {dueReports.map(({ label, due, rep }) => {
              const late = due && due < todayIso() && !rep?.sent
              return (
                <div key={label} className={clsx('rounded-2xl p-4 ring-1', rep?.sent ? 'bg-sage/[0.05] ring-sage/20' : late ? 'bg-coral/[0.05] ring-coral/20' : 'bg-white/[0.02] ring-white/[0.06]')}>
                  <div className="flex items-center justify-between"><span className="display text-[1.6rem]">{label}</span><Pill tone={rep?.sent ? 'green' : rep ? 'gold' : late ? 'red' : 'neutral'}>{rep?.sent ? 'Envoyé' : rep ? 'Prêt' : late ? 'En retard' : 'À venir'}</Pill></div>
                  <div className="mt-1 text-[11.5px] text-mist">Échéance {fdate(due)}</div>
                  {rep ? <p className="mt-3 line-clamp-3 text-[12.5px] text-bone/70">{rep.summary}</p> : <p className="mt-3 text-[12.5px] text-bone/45">Généré depuis les visites réelles à la date d’échéance.</p>}
                  {(rep as SellerReport & { sentVia?: string })?.sentVia && <p className="mt-2 text-[11px] text-mist">{(rep as SellerReport & { sentVia?: string }).sentVia}</p>}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <SoftBtn icon={<Sparkle size={13} />} disabled={!due} onClick={() => generate(label, due!)}>{busy === `g${label}` ? 'Génération…' : rep ? 'Régénérer' : 'Générer'}</SoftBtn>
                    {rep && <SoftBtn tone={rep.sent ? 'ghost' : 'gold'} icon={<Eye size={13} />} onClick={() => setPreview(rep)}>Aperçu</SoftBtn>}
                  </div>
                </div>
              )
            })}
          </div>
          {!start && <p className="mt-3 text-[12px] text-mist">Les échéances démarrent au lancement de la diffusion.</p>}
        </Card>
      </Stagger>

      <Modal open={!!visitEdit} onClose={() => setVisitEdit(null)} title={editV ? 'Modifier la visite' : 'Nouvelle visite'} kicker="Formulaire de retour">
        <AsyncForm key={editV?.id ?? 'new'} submitLabel="Enregistrer" success="Visite enregistrée" onCancel={() => setVisitEdit(null)} onSubmit={saveVisit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Acquéreur"><Input name="buyer" required defaultValue={editV?.buyer} placeholder="M. & Mme Verdier" /></Field>
            <Field label="Date"><Input name="date" type="date" required defaultValue={editV?.date ?? todayIso()} /></Field>
            <Field label="Conseiller"><Select name="agent" defaultValue={editV?.agent ?? ag.name}>{agents.map((x) => <option key={x.id}>{x.name}</option>)}</Select></Field>
            <Field label="Intérêt (1 – 5)"><Select name="interest" defaultValue={editV?.interest ?? 3}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} — {['', 'Aucun', 'Faible', 'Moyen', 'Fort', 'Coup de cœur'][n]}</option>)}</Select></Field>
          </div>
          <Field label="Retour de l’acquéreur"><Textarea name="feedback" rows={3} defaultValue={editV?.feedback} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Objections" hint="Séparées par des virgules"><Input name="objections" defaultValue={editV?.objections} placeholder="Prix, cuisine à rafraîchir" /></Field>
            <Field label="Suite à donner"><Select name="followUp" defaultValue={editV?.followUp ?? ''}><option value="">—</option>{[...new Set([...FOLLOW, ...(editV?.followUp ? [editV.followUp] : [])])].map((f) => <option key={f}>{f}</option>)}</Select></Field>
          </div>
        </AsyncForm>
      </Modal>

      <Modal open={shoot} onClose={() => setShoot(false)} title="Planifier la production" kicker="Shooting & visite 3D">
        <AsyncForm submitLabel="Planifier" success="Production planifiée — événement ajouté à l’agenda" onCancel={() => setShoot(false)} onSubmit={saveShoot}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date"><Input name="date" type="date" required min={todayIso()} defaultValue={diff.shooting ?? addDays(todayIso(), 2)} /></Field>
            <Field label="Heure"><Input name="time" type="time" step={900} defaultValue={diff.shootingTime ?? '09:30'} /></Field>
            <Field label="Prestataire"><Input name="provider" required defaultValue={diff.provider ?? 'Hugo Lambert · photographe'} /></Field>
            <Field label="Prestation"><Select name="kind" defaultValue="both"><option value="both">Photo + visite 3D</option><option value="photo">Photo seule</option><option value="3d">Visite 3D seule</option></Select></Field>
          </div>
        </AsyncForm>
      </Modal>

      <Modal open={!!statEdit} onClose={() => setStatEdit(null)} title={statEdit ?? ''} kicker="Statistiques du portail" width={420}>
        {statEdit && <AsyncForm key={statEdit} submitLabel="Enregistrer" success="Statistiques enregistrées" onCancel={() => setStatEdit(null)} onSubmit={(v) => saveStat(statEdit, v)}>
          <div className="grid grid-cols-2 gap-4"><Field label="Vues"><Input name="views" type="number" min={0} defaultValue={stats[statEdit]?.views ?? 0} /></Field><Field label="Contacts"><Input name="contacts" type="number" min={0} defaultValue={stats[statEdit]?.contacts ?? 0} /></Field></div>
        </AsyncForm>}
      </Modal>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={`Bilan ${preview?.label ?? ''}`} kicker="Aperçu avant envoi" width={680}>
        {preview && <>
          <Paper>
            <div className="flex items-baseline justify-between border-b border-ink/10 pb-3"><span className="font-serif text-xl italic">Maison Riviera · Antibes</span><span className="text-[10.5px] uppercase tracking-eyebrow text-ink/50">Bilan {preview.label} · {fdate(preview.date)}</span></div>
            <p className="mt-4 text-[13px] text-ink/60">À : {dossier.seller}</p>
            <h3 className="mt-1 font-serif text-2xl">{p.title}</h3>
            <div className="mt-4 grid grid-cols-3 gap-3">{([['Vues', preview.views], ['Contacts', preview.contacts], ['Visites', preview.visits]] as const).map(([l, v]) => <div key={l} className="rounded-xl bg-ink/[0.04] p-3"><div className="text-[10px] uppercase tracking-eyebrow text-ink/50">{l}</div><div className="font-serif text-2xl">{v.toLocaleString('fr-FR')}</div></div>)}</div>
            <p className="mt-4 text-[13.5px] leading-relaxed text-ink/80">{preview.summary}</p>
            {journey.visits.filter((v) => v.date <= preview.date).length > 0 && <ul className="mt-4 space-y-1.5">{journey.visits.filter((v) => v.date <= preview.date).map((v) => <li key={v.id} className="flex justify-between gap-3 rounded-lg bg-ink/[0.04] px-3 py-2 text-[12px]"><span>{fdate(v.date, { day: 'numeric', month: 'short' })} · {v.buyer}</span><span className="text-ink/60">{v.interest}/5{v.followUp ? ` · ${v.followUp}` : ''}</span></li>)}</ul>}
            <p className="mt-5 border-t border-ink/10 pt-3 text-[10.5px] text-ink/50">Sources : visites saisies dans NXT, statistiques portails au {fdate(todayIso())}. {ag.name}, {ag.role.toLowerCase()}.</p>
          </Paper>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[12px] text-mist">{sellerConv ? `Via la conversation ${sellerConv.channel === 'whatsapp' ? 'WhatsApp' : sellerConv.channel} du vendeur` : 'Pas de conversation vendeur : file d’envoi e-mail'} · consigné, connecteur non configuré</span>
            <div className="flex gap-2"><SoftBtn icon={<X size={13} />} onClick={() => setPreview(null)}>Fermer</SoftBtn><SoftBtn tone="gold" icon={<PaperPlaneTilt size={13} />} onClick={() => sendReport(preview)}>{busy === `s${preview.label}` ? 'Consignation…' : preview.sent ? 'Renvoyer' : 'Envoyer'}</SoftBtn></div>
          </div>
        </>}
      </Modal>
    </>
  )
}
