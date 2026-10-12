import { useState } from 'react'
import clsx from 'clsx'
import { Heart, Star, UsersThree, Key, Archive, CalendarHeart, PaperPlaneTilt, Sparkle, Plus, CheckCircle, ArrowCounterClockwise, BellRinging, X } from '@phosphor-icons/react'
import { Card, SoftBtn, Stagger } from '../ui'
import { Pill } from '../../ui/kit'
import { prop, agent } from '../../data/mock'
import type { AfterSale } from '../../data/dossier'
import { useConversations, useOutbox, useReminders, useTasks } from '../../data/collections'
import { action } from '../../data/store'
import { Field, Input, Textarea, toast } from '../forms'
import { stepProgress } from './Stepper'
import { StepHead, Eyebrow, useRun, todayIso, addMonths, fdate, consignSend } from './sale-ui'
import type { StepProps } from './index'

type A = AfterSale & { thanksAt?: string; reviewRequestedAt?: string; keysDate?: string; reminderId?: string; archivedAt?: string; referralContact?: string; tasksCreated?: string[] }

export default function StepAfter({ dossier, journey, save }: StepProps) {
  const p = prop(dossier.propertyId), ag = agent(dossier.agentId)
  const a = journey.afterSale as A
  const [convs] = useConversations()
  const [, outbox] = useOutbox()
  const [reminders, remOps] = useReminders()
  const [, taskOps] = useTasks()
  const { busy, run } = useRun()
  const conv = convs.find((c) => c.dossierId === dossier.id && c.tags.includes('Vendeur'))
  const first = conv && !/^(M\.|Mme)/.test(conv.title) ? conv.title.split(' ')[0] : ''
  const hello = `Bonjour${first ? ` ${first}` : ''},`
  const acte = journey.closing.acteDate
  const buyer = journey.offers.find((o) => o.status === 'acceptée')?.buyer
  const next2 = journey.discovery.projetSuivant?.v

  const thanksDraft = `${hello} merci pour votre confiance tout au long de la vente de ${p.title}. Ce fut un plaisir de vous accompagner${journey.mandate.start ? ` depuis le ${fdate(journey.mandate.start, { day: 'numeric', month: 'long' })}` : ''}${acte ? ` jusqu’à la signature du ${fdate(acte, { day: 'numeric', month: 'long' })}` : ''}. ${next2 ? `Je reste à vos côtés pour votre projet : ${next2[0].toLowerCase()}${next2.slice(1)}. ` : ''}Bien chaleureusement, ${ag.name}.`
  const [thanks, setThanks] = useState<string | null>(null)
  const [stars, setStars] = useState(a.review ?? 0)
  const [review, setReview] = useState(a.reviewText ?? '')
  const [ref, setRef] = useState({ name: a.referral ?? '', contact: a.referralContact ?? '' })
  const [keys, setKeys] = useState(a.keysDate ?? acte ?? todayIso())
  const [anniv, setAnniv] = useState(a.anniversary ?? addMonths(acte ?? todayIso(), 12))
  const reminder = reminders.find((r) => r.id === a.reminderId)

  const put = (patch: Partial<A>) => save({ afterSale: { ...a, ...patch } })
  const sendThanks = () => run('thanks', async () => {
    const via = await consignSend({ conv, text: thanks ?? thanksDraft, template: 'tpl-bilan', outbox, dossierId: dossier.id, code: 'MERCI', to: dossier.seller, subject: `Merci — ${p.title}` })
    await put({ thanksSent: true, thanksAt: new Date().toISOString() })
    toast(`Remerciement ${via}`, 'info')
  })
  const askReview = () => run('ask', async () => {
    await outbox.create({ dossierId: dossier.id, code: 'AVIS', to: dossier.seller, subject: `Votre avis sur notre accompagnement — ${p.title}`, status: 'consigné (connecteur non configuré)', at: new Date().toISOString(), channel: 'E-mail' })
    await put({ reviewRequestedAt: new Date().toISOString() })
  }, 'Demande d’avis consignée — connecteur e-mail non configuré', 'info')
  const saveReview = () => run('review', () => put({ review: stars || undefined, reviewText: review.trim() || undefined }), 'Avis enregistré')
  const saveRef = () => run('ref', async () => {
    if (!ref.name.trim()) throw new Error('Nom du filleul requis')
    await put({ referral: ref.name.trim(), referralContact: ref.contact.trim() || undefined })
    await taskOps.create({ title: `Contacter ${ref.name.trim()} — recommandé par ${dossier.seller}${ref.contact.trim() ? ` (${ref.contact.trim()})` : ''}`, dossier: dossier.id, due: 'Sous 48 h', prio: 'haute', kind: 'appeler', ai: false, done: false })
  }, 'Parrainage enregistré · tâche de prise de contact créée')
  const handKeys = () => run('keys', () => put({ keysHanded: !a.keysHanded, keysDate: a.keysHanded ? undefined : keys }), a.keysHanded ? 'Remise des clés annulée' : 'Remise des clés consignée')
  const archive = () => (a.archive || window.confirm('Archiver ce dossier ? Il reste consultable et peut être réactivé.')) && run('arch', () => put({ archive: !a.archive, archivedAt: a.archive ? undefined : new Date().toISOString() }), a.archive ? 'Dossier réactivé' : 'Dossier archivé')
  const schedule = () => run('anniv', async () => {
    if (!anniv) throw new Error('Date requise')
    if (reminder && reminder.status === 'programmé') await action('reminder.cancel', { id: reminder.id })
    const r = await remOps.create({ kind: conv ? 'whatsapp' : 'email', rule: 'manuel', dossierId: dossier.id, target: dossier.seller, text: `${hello} il y a un an vous remettiez les clés de ${p.title}. Je vous propose un point sur la valeur de votre patrimoine et le marché. ${ag.name}`, template: conv ? 'tpl-bilan' : undefined, dueAt: new Date(`${anniv}T10:00`).toISOString(), status: 'programmé', createdBy: ag.name, conversationId: conv?.id })
    await put({ anniversary: anniv, reminderId: r.id })
  }, `Rappel anniversaire programmé le ${fdate(anniv)}`)
  const cancelRem = () => reminder && run('cancel', async () => { await action('reminder.cancel', { id: reminder.id }); await put({ reminderId: undefined }) }, 'Rappel annulé')

  const SUGG = [
    { id: 'valeur', t: 'Avis de valeur actualisé à 1 an', d: 'Évolution DVF du quartier, à envoyer avec le rappel anniversaire.', when: 12 },
    { id: 'projet', t: next2 ? `Projet suivant : ${next2}` : 'Suivi du projet immobilier suivant', d: 'Proposer une mise en relation avec une agence partenaire du réseau.', when: 3 },
    { id: 'reco', t: 'Demande de recommandation', d: 'Deux voisins ou proches susceptibles de vendre dans l’année.', when: 6 },
    { id: 'event', t: 'Invitation à l’événement clients', d: 'Soirée annuelle Maison Riviera, Cap d’Antibes.', when: 9 },
    { id: 'newsletter', t: 'Inscription à la lettre marché trimestrielle', d: 'Avec consentement explicite (registre RGPD).', when: 1 },
  ]
  const created = a.tasksCreated ?? []
  const suggest = (s: (typeof SUGG)[number]) => run(`s${s.id}`, async () => {
    await taskOps.create({ title: `${s.t} — ${dossier.seller}`, dossier: dossier.id, due: fdate(addMonths(acte ?? todayIso(), s.when), { day: 'numeric', month: 'short', year: 'numeric' }), prio: 'normale', kind: 'relancer', ai: true, done: false })
    await put({ tasksCreated: [...created, s.id] })
  }, 'Relance programmée en tâche')

  const prog = stepProgress(dossier, journey).after
  const next = !a.thanksSent ? { label: 'Envoyer le message de remerciement au vendeur.', cta: 'Consigner l’envoi', onClick: sendThanks }
    : !a.review ? { label: 'Recueillir l’avis du vendeur (note + verbatim).', cta: a.reviewRequestedAt ? undefined : 'Demander un avis', onClick: askReview }
      : !a.keysHanded ? { label: 'Consigner la remise des clés.', cta: 'Consigner', onClick: handKeys }
        : !a.reminderId ? { label: 'Programmer le rappel anniversaire à 1 an.', cta: 'Programmer', onClick: schedule }
          : !a.archive ? { label: 'Fidélisation en place : archiver le dossier.', cta: 'Archiver', onClick: archive, tone: 'sage' as const }
            : { label: 'Dossier archivé. Rappel anniversaire actif.', tone: 'sage' as const }

  const Done = ({ on }: { on: boolean }) => on ? <CheckCircle size={16} weight="fill" className="text-sage" /> : null

  return (
    <>
      <Stagger i={0}>
        <StepHead n={8} kicker="Après-vente" progress={prog} next={next}
          title={<>Fidéliser <span className="italic text-champagne-300">la relation</span></>}
          sub={`${dossier.seller} · ${p.title}${acte ? ` · acte du ${fdate(acte)}` : ''}${buyer ? ` · acquéreur ${buyer}` : ''}`}
          aside={<>{a.thanksSent && <Pill tone="green">Remercié</Pill>}{a.review ? <Pill tone="gold">{a.review}/5</Pill> : null}{a.archive && <Pill>Archivé</Pill>}</>} />
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-2">
        <Stagger i={1}>
          <Card title={<span className="flex items-center gap-2"><Heart size={16} className="text-champagne" />Remerciement <Done on={a.thanksSent} /></span>} kicker={a.thanksAt ? `Consigné le ${fdate(a.thanksAt)}` : 'Message personnalisé'}>
            <Textarea rows={6} value={thanks ?? thanksDraft} onChange={(e) => setThanks(e.target.value)} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11.5px] text-mist">{conv ? `Conversation ${conv.channel === 'whatsapp' ? 'WhatsApp' : conv.channel} du vendeur` : 'File e-mail'} · consigné, connecteur non configuré</span>
              <div className="flex gap-2"><SoftBtn icon={<Sparkle size={13} />} onClick={() => setThanks(null)}>Régénérer</SoftBtn><SoftBtn tone="gold" icon={<PaperPlaneTilt size={13} />} onClick={sendThanks}>{busy === 'thanks' ? 'Consignation…' : a.thanksSent ? 'Renvoyer' : 'Consigner l’envoi'}</SoftBtn></div>
            </div>
          </Card>
        </Stagger>

        <Stagger i={2}>
          <Card title={<span className="flex items-center gap-2"><Star size={16} className="text-champagne" />Avis client <Done on={!!a.review} /></span>} kicker={a.reviewRequestedAt ? `Demandé le ${fdate(a.reviewRequestedAt)}` : 'Note et verbatim'} action={<SoftBtn onClick={askReview}>{busy === 'ask' ? '…' : a.reviewRequestedAt ? 'Relancer' : 'Demander un avis'}</SoftBtn>}>
            <div className="flex gap-1" role="radiogroup" aria-label="Note">
              {[1, 2, 3, 4, 5].map((n) => <button key={n} role="radio" aria-checked={stars === n} aria-label={`${n} sur 5`} onClick={() => setStars(n)} className="p-1"><Star size={26} weight={n <= stars ? 'fill' : 'light'} className={n <= stars ? 'text-champagne' : 'text-mist'} /></button>)}
              <span className="num ml-2 self-center text-[13px] text-bone/60">{stars ? `${stars}/5` : '—'}</span>
            </div>
            <Textarea className="mt-3" rows={3} value={review} onChange={(e) => setReview(e.target.value)} placeholder="« Accompagnement remarquable, des comptes rendus après chaque visite… »" />
            <div className="mt-3 flex justify-end"><SoftBtn tone="gold" disabled={!stars} onClick={saveReview}>{busy === 'review' ? 'Enregistrement…' : 'Enregistrer l’avis'}</SoftBtn></div>
          </Card>
        </Stagger>

        <Stagger i={3}>
          <Card title={<span className="flex items-center gap-2"><UsersThree size={16} className="text-champagne" />Parrainage <Done on={!!a.referral} /></span>} kicker="Recommandation">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Filleul"><Input value={ref.name} onChange={(e) => setRef({ ...ref, name: e.target.value })} placeholder="M. et Mme Rossi" /></Field>
              <Field label="Contact"><Input value={ref.contact} onChange={(e) => setRef({ ...ref, contact: e.target.value })} placeholder="Téléphone ou e-mail" /></Field>
            </div>
            <p className="mt-2 text-[11.5px] text-mist">Prise de contact uniquement avec l’accord du filleul (démarchage sans consentement interdit depuis le 11/08/2026).</p>
            <div className="mt-3 flex justify-end"><SoftBtn tone="gold" icon={<Plus size={13} />} onClick={saveRef}>{busy === 'ref' ? 'Enregistrement…' : a.referral ? 'Mettre à jour' : 'Enregistrer'}</SoftBtn></div>
          </Card>
        </Stagger>

        <Stagger i={4}>
          <Card title={<span className="flex items-center gap-2"><Key size={16} className="text-champagne" />Remise des clés & archivage <Done on={!!a.keysHanded && !!a.archive} /></span>} kicker="Clôture">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="Date de remise" className="flex-1"><Input type="date" value={keys} disabled={a.keysHanded} onChange={(e) => setKeys(e.target.value)} /></Field>
              <SoftBtn tone={a.keysHanded ? 'ghost' : 'gold'} icon={a.keysHanded ? <ArrowCounterClockwise size={13} /> : <Key size={13} />} onClick={handKeys}>{a.keysHanded ? 'Annuler' : 'Consigner la remise'}</SoftBtn>
            </div>
            {a.keysHanded && <p className="mt-2 text-[12px] text-sage">Clés remises le {fdate(a.keysDate)}{buyer ? ` à ${buyer}` : ''}.</p>}
            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-white/[0.02] px-3 py-3 ring-1 ring-white/[0.05]">
              <div className="text-[13px]">{a.archive ? `Archivé le ${fdate(a.archivedAt)}` : 'Dossier actif'}<div className="text-[11.5px] text-mist">Archiver retire le dossier du pilotage quotidien.</div></div>
              <SoftBtn icon={<Archive size={13} />} onClick={archive}>{busy === 'arch' ? '…' : a.archive ? 'Réactiver' : 'Archiver'}</SoftBtn>
            </div>
          </Card>
        </Stagger>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1fr_1.3fr]">
        <Stagger i={5}>
          <Card title={<span className="flex items-center gap-2"><CalendarHeart size={16} className="text-champagne" />Date anniversaire <Done on={!!reminder && reminder.status !== 'annulé'} /></span>} kicker="Rappel programmé">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="Date du rappel" className="flex-1"><Input type="date" value={anniv} min={todayIso()} onChange={(e) => setAnniv(e.target.value)} /></Field>
              <SoftBtn tone="gold" icon={<BellRinging size={13} />} onClick={schedule}>{busy === 'anniv' ? '…' : reminder ? 'Reprogrammer' : 'Programmer'}</SoftBtn>
            </div>
            {reminder ? (
              <div className="mt-4 rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/[0.05]">
                <div className="flex items-center justify-between gap-2"><span className="text-[12.5px]">{fdate(reminder.dueAt, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · 10:00</span><Pill tone={reminder.status === 'programmé' ? 'blue' : reminder.status === 'annulé' ? 'red' : 'green'}>{reminder.status}</Pill></div>
                <p className="mt-2 text-[12px] text-bone/60">{reminder.text}</p>
                {reminder.status === 'programmé' && <button onClick={cancelRem} className="mt-2 inline-flex items-center gap-1 text-[12px] text-coral hover:underline"><X size={12} />Annuler le rappel</button>}
              </div>
            ) : <p className="mt-3 text-[12px] text-mist">Un rappel {conv ? 'WhatsApp' : 'e-mail'} est programmé dans la messagerie ; il sera consigné à échéance par la routine AUT-110.</p>}
          </Card>
        </Stagger>

        <Stagger i={6}>
          <Card title="Relances suggérées" kicker="Plan de fidélisation · 12 mois">
            <ul className="space-y-2">
              {SUGG.map((s) => {
                const on = created.includes(s.id)
                return (
                  <li key={s.id} className={clsx('flex flex-col gap-2 rounded-xl px-3 py-2.5 ring-1 sm:flex-row sm:items-center sm:justify-between', on ? 'bg-sage/[0.05] ring-sage/15' : 'bg-white/[0.02] ring-white/[0.05]')}>
                    <div className="min-w-0"><div className="flex items-center gap-2 text-[13px]"><span className="num rounded-full bg-white/[0.05] px-2 py-0.5 text-[10.5px] text-mist">M+{s.when}</span>{s.t}</div><div className="mt-0.5 text-[11.5px] text-mist">{s.d}</div></div>
                    {on ? <span className="flex items-center gap-1 text-[12px] text-sage"><CheckCircle size={14} weight="fill" />Tâche créée</span> : <SoftBtn icon={<Plus size={13} />} onClick={() => suggest(s)}>{busy === `s${s.id}` ? '…' : 'Créer la tâche'}</SoftBtn>}
                  </li>
                )
              })}
            </ul>
            <Eyebrow className="mt-4">Échéances calculées depuis l’acte{acte ? ` (${fdate(acte)})` : ''}</Eyebrow>
          </Card>
        </Stagger>
      </div>
    </>
  )
}
