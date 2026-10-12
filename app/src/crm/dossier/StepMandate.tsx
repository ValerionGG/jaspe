import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { CheckCircle, Circle, PaperPlaneTilt, Signature, Printer, Seal, ArrowCounterClockwise, Hash, FloppyDisk, Warning } from '@phosphor-icons/react'
import { Card, SoftBtn, Stagger } from '../ui'
import { Pill } from '../../ui/kit'
import { prop, agent, eur } from '../../data/mock'
import { journeyOf, type MandateInfo } from '../../data/dossier'
import { useDossiers, useOutbox } from '../../data/collections'
import { action } from '../../data/store'
import { Field, Input, Select, Textarea, toast } from '../forms'
import { stepProgress } from './Stepper'
import { StepHead, Seg, mandateOf, Eyebrow, Kpi, Paper, useRun, todayIso, addMonths, fdate, money } from './sale-ui'
import type { StepProps } from './index'

type M = MandateInfo & { sentAt?: string; signedAt?: string }
type MType = Exclude<MandateInfo['type'], ''>

const TYPES: { id: MType; pitch: string; rows: [string, string][] }[] = [
  { id: 'Exclusif', pitch: 'Une seule agence, un plan de commercialisation complet.', rows: [['Agences', '1 seule'], ['Vente directe par le vendeur', 'Non, pendant la durée'], ['Irrévocabilité', '3 mois, puis préavis 15 j'], ['Plan marketing', 'Complet · L4, L6, 3D, portails premium'], ['Comptes rendus', 'Bilans J+7 · J+21 · J+42'], ['Honoraires usuels', '4 – 5 %']] },
  { id: 'Semi-exclusif', pitch: 'Une agence, mais le vendeur garde la vente directe.', rows: [['Agences', '1 seule'], ['Vente directe par le vendeur', 'Oui, sans honoraires'], ['Irrévocabilité', '3 mois, puis préavis 15 j'], ['Plan marketing', 'Standard · portails + réseau'], ['Comptes rendus', 'Bilans J+7 · J+21'], ['Honoraires usuels', '4,5 – 5,5 %']] },
  { id: 'Simple', pitch: 'Plusieurs agences en concurrence, aucune exclusivité.', rows: [['Agences', 'Illimité'], ['Vente directe par le vendeur', 'Oui'], ['Irrévocabilité', 'Aucune après 3 mois'], ['Plan marketing', 'Portails de base'], ['Comptes rendus', 'Sur demande'], ['Honoraires usuels', '5 – 6 %']] },
]
const SIG: M['signature'][] = ['à préparer', 'envoyé', 'signé']

export default function StepMandate({ dossier, journey, save, goTo }: StepProps) {
  const p = prop(dossier.propertyId), a = agent(dossier.agentId)
  const eff = mandateOf(dossier, journey)
  const saved = eff as M
  const [m, setM] = useState<M>(() => ({ ...saved, price: saved.price || p.price }))
  const [dossiers] = useDossiers()
  const [, outbox] = useOutbox()
  const { busy, run } = useRun()
  const set = <K extends keyof M>(k: K, v: M[K]) => setM((x) => ({ ...x, [k]: v }))
  const dirty = JSON.stringify(m) !== JSON.stringify({ ...saved, price: saved.price || p.price })
  const locked = saved.signature !== 'à préparer' && !eff.inferred

  const fees = Math.round((m.price * m.feesPct) / 100)
  const start = m.start ?? todayIso()
  const end = addMonths(start, m.duration)
  const dpe = journey.discovery.dpe?.v ?? `${p.dpe}`
  const mentions: { k: keyof M['mentions']; l: string; s: string; v: string }[] = [
    { k: 'dpe', s: 'DPE', l: 'Diagnostic de performance énergétique', v: `Classe ${dpe}` },
    { k: 'fees', s: 'mention des honoraires', l: 'Honoraires TTC et partie qui les supporte', v: `${money(fees)} · ${m.feesPct.toLocaleString('fr-FR')} % · charge ${m.feesPayer}` },
    { k: 'surface', s: 'surface', l: 'Surface habitable / loi Carrez', v: `${journey.discovery.surface?.v ?? p.surface} m² ${p.type === 'Appartement' ? '(Carrez)' : '(habitable)'}` },
    { k: 'risks', s: 'état des risques', l: 'État des risques (ERP) de moins de 6 mois', v: 'Arrêté préfectoral 06 · PPR incendie & séisme' },
  ]
  const missing = [
    !m.type && 'type de mandat', !(m.price > 0) && 'prix', !m.registry && 'numéro de registre',
    ...mentions.filter((x) => !m.mentions[x.k]).map((x) => x.s),
  ].filter(Boolean) as string[]

  const nextRegistry = useMemo(() => {
    const nums = dossiers.map((d) => journeyOf(d as never).mandate.registry?.match(/(\d{4})-(\d+)/)).filter(Boolean).map((x) => Number(x![2]))
    return `Registre n° ${new Date().getFullYear()}-${String(Math.max(187, ...nums) + 1).padStart(3, '0')}`
  }, [dossiers])

  const persist = (patch: Partial<M>, extra = {}) => { const { inferred: _i, ...rest } = { ...m, ...patch } as M & { inferred?: boolean }; void _i; return save({ mandate: rest }, extra) }
  const onSave = () => run('save', () => persist({}), 'Mandat enregistré')
  const toggleMention = (k: keyof M['mentions']) => {
    const mentions2 = { ...m.mentions, [k]: !m.mentions[k] }
    setM((x) => ({ ...x, mentions: mentions2 }))
    run('m', () => persist({ ...saved, mentions: mentions2 }))
  }
  const send = () => run('send', async () => {
    const at = new Date().toISOString()
    await outbox.create({ dossierId: dossier.id, code: 'MANDAT', to: dossier.seller, subject: `Mandat ${m.type.toLowerCase()} — ${p.title} (${m.registry})`, status: 'consigné · signature électronique non configurée', at, channel: 'Signature électronique' })
    setM((x) => ({ ...x, signature: 'envoyé', sentAt: at }))
    await persist({ signature: 'envoyé', sentAt: at, start })
  }, 'Envoi consigné — signature électronique non configurée', 'info')
  const sign = () => run('sign', async () => {
    const at = new Date().toISOString()
    setM((x) => ({ ...x, signature: 'signé', signedAt: at }))
    await persist({ signature: 'signé', signedAt: at, start }, { stage: 'mandat', mandate: m.type || undefined })
    await action('dossier.move', { id: dossier.id, stage: 'mandat' })
  }, 'Mandat signé — dossier passé en « Mandat signé »')
  const back = () => run('back', async () => { setM((x) => ({ ...x, signature: 'à préparer' })); await persist({ signature: 'à préparer', sentAt: undefined }) }, 'Envoi annulé — mandat de nouveau modifiable', 'info')

  const prog = stepProgress(dossier, { ...journey, mandate: eff }).mandate
  const next = saved.signature === 'signé'
    ? { label: 'Mandat signé : lancer la diffusion et planifier le shooting.', hint: `${saved.registry ?? 'Numéro de registre à compléter'} · fin ${fdate(addMonths(saved.start ?? start, saved.duration))}`, cta: 'Ouvrir la commercialisation', onClick: () => goTo('marketing'), tone: 'sage' as const }
    : saved.signature === 'envoyé'
      ? { label: 'Mandat envoyé : consigner la signature dès réception de l’exemplaire signé.', hint: saved.sentAt ? `Envoi consigné le ${fdate(saved.sentAt, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}` : undefined, cta: 'Marquer comme signé', onClick: sign }
      : missing.length
        ? { label: `Compléter avant envoi : ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ` (+${missing.length - 3})` : ''}.`, hint: 'Checklist bloquante (loi Hoguet, décret 1972).', tone: 'coral' as const }
        : { label: 'Tout est prêt : envoyer le mandat pour signature.', cta: 'Envoyer pour signature', onClick: send }

  return (
    <>
      <Stagger i={0}>
        <StepHead n={4} kicker="Mandat" progress={prog} next={next}
          title={<>Mandat <span className="italic text-champagne-300">{(m.type || 'à définir').toLowerCase()}</span></>}
          sub={`${p.title} · ${p.address}, ${p.city} — mandant : ${dossier.seller}`}
          aside={<>{eff.inferred && <Pill tone="amber">Reconstitué depuis l’étape du dossier</Pill>}<Pill tone={saved.signature === 'signé' ? 'green' : saved.signature === 'envoyé' ? 'blue' : 'neutral'}>{saved.signature}</Pill>{saved.registry && <Pill tone="gold">{saved.registry}</Pill>}<Pill>{eur(m.price)}</Pill></>} />
      </Stagger>

      {/* Type de mandat — comparaison des engagements */}
      <Stagger i={1}>
        <Card title="Type de mandat" kicker="Comparer les engagements" action={locked && <span className="text-[11.5px] text-mist">Verrouillé après envoi</span>}>
          <div className="grid gap-3 md:grid-cols-3">
            {TYPES.map((t) => {
              const on = m.type === t.id
              return (
                <button key={t.id} type="button" disabled={locked} onClick={() => setM((x) => ({ ...x, type: t.id, feesPct: x.type ? x.feesPct : t.id === 'Simple' ? 5 : t.id === 'Semi-exclusif' ? 4.5 : 4 }))}
                  className={clsx('rounded-2xl p-4 text-left ring-1 transition-all duration-300 ease-silk disabled:cursor-not-allowed', on ? 'bg-champagne/[0.08] ring-champagne/40' : 'bg-white/[0.02] ring-white/[0.06] hover:bg-white/[0.04]')}>
                  <div className="flex items-center justify-between"><span className="display text-[1.5rem]">{t.id}</span>{on ? <CheckCircle size={18} weight="fill" className="text-champagne" /> : <Circle size={18} weight="light" className="text-mist" />}</div>
                  <p className="mt-1 text-[12.5px] text-bone/55">{t.pitch}</p>
                  <dl className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-3">
                    {t.rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3 text-[12px]"><dt className="text-mist">{k}</dt><dd className="text-right text-bone/85">{v}</dd></div>)}
                  </dl>
                </button>
              )
            })}
          </div>
        </Card>
      </Stagger>

      <div className="grid gap-6 2xl:grid-cols-[1.25fr_1fr]">
        {/* Conditions */}
        <Stagger i={2}>
          <Card title="Conditions du mandat" kicker="Prix · honoraires · durée" action={dirty && !locked && <SoftBtn tone="gold" icon={<FloppyDisk size={14} />} onClick={onSave}>{busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}</SoftBtn>}>
            <fieldset disabled={locked} className="grid gap-4 sm:grid-cols-2">
              <Field label="Prix de présentation (€)" hint={`Estimation L7 : ${eur(p.estimateLow)} – ${eur(p.estimateHigh)}`}><Input type="number" min={0} step={5000} value={m.price || ''} onChange={(e) => set('price', Number(e.target.value))} /></Field>
              <Field label="Honoraires (% TTC)"><Input type="number" min={0} max={10} step={0.25} value={m.feesPct} onChange={(e) => set('feesPct', Number(e.target.value))} /></Field>
              <Field label="À la charge de" className="sm:col-span-2">
                <Seg id="payer" value={m.feesPayer} onChange={(v) => !locked && set('feesPayer', v)} items={[{ id: 'vendeur', label: 'Vendeur' }, { id: 'acquéreur', label: 'Acquéreur' }]} />
              </Field>
              <Field label="Durée"><Select value={m.duration} onChange={(e) => set('duration', Number(e.target.value))}>{[3, 6, 9, 12].map((n) => <option key={n} value={n}>{n} mois</option>)}</Select></Field>
              <Field label="Date de début"><Input type="date" value={start} onChange={(e) => set('start', e.target.value)} /></Field>
              <Field label="Numéro de registre des mandats" className="sm:col-span-2">
                <div className="flex gap-2"><Input value={m.registry ?? ''} placeholder="Registre n° 2026-…" onChange={(e) => set('registry', e.target.value)} /><SoftBtn icon={<Hash size={14} />} onClick={() => set('registry', nextRegistry)}>Attribuer</SoftBtn></div>
              </Field>
              <Field label="Notes" className="sm:col-span-2"><Textarea rows={2} value={m.notes ?? ''} onChange={(e) => set('notes', e.target.value)} placeholder="Conditions particulières, accords verbaux à formaliser…" /></Field>
            </fieldset>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi label="Honoraires TTC" value={eur(fees)} hint={`${m.feesPct.toLocaleString('fr-FR')} % · ${m.feesPayer}`} />
              <Kpi label={m.feesPayer === 'vendeur' ? 'Net vendeur' : 'Prix FAI'} value={eur(m.feesPayer === 'vendeur' ? m.price - fees : m.price + fees)} hint={m.feesPayer === 'vendeur' ? 'Prix − honoraires' : 'Prix + honoraires'} />
              <Kpi label="Fin du mandat" value={<span className="text-[1.35rem]">{fdate(end, { day: 'numeric', month: 'short' })}</span>} hint={fdate(end, { year: 'numeric' })} />
              <Kpi label="Écart estimation" value={`${m.price > p.estimateHigh ? '+' : ''}${Math.round(((m.price - (p.estimateLow + p.estimateHigh) / 2) / ((p.estimateLow + p.estimateHigh) / 2)) * 100)} %`} tone={m.price > p.estimateHigh ? 'coral' : 'sage'} hint="vs milieu de fourchette" />
            </div>
          </Card>
        </Stagger>

        {/* Mentions + signature */}
        <div className="space-y-6">
          <Stagger i={3}>
            <Card title="Mentions obligatoires" kicker="Checklist bloquante" action={<span className={clsx('num text-[12px]', Object.values(m.mentions).every(Boolean) ? 'text-sage' : 'text-coral')}>{Object.values(m.mentions).filter(Boolean).length}/4</span>}>
              <ul className="space-y-2">
                {mentions.map((x) => (
                  <li key={x.k}>
                    <button type="button" disabled={locked} onClick={() => toggleMention(x.k)} className="flex w-full items-start gap-3 rounded-xl bg-white/[0.02] px-3 py-2.5 text-left ring-1 ring-white/[0.05] transition hover:bg-white/[0.04] disabled:cursor-not-allowed">
                      {m.mentions[x.k] ? <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-sage" /> : <Circle size={18} weight="light" className="mt-0.5 shrink-0 text-coral" />}
                      <span className="min-w-0"><span className="block text-[13px]">{x.l}</span><span className="block text-[11.5px] text-mist">{x.v}</span></span>
                    </button>
                  </li>
                ))}
              </ul>
              {missing.length > 0 && !locked && <p className="mt-3 flex items-start gap-2 text-[12px] text-coral"><Warning size={14} className="mt-0.5 shrink-0" />Envoi bloqué — manque : {missing.join(', ')}.</p>}
            </Card>
          </Stagger>

          <Stagger i={4}>
            <Card title="Signature" kicker="Statut">
              <ol className="relative flex justify-between">
                <div className="absolute left-[8%] right-[8%] top-[13px] h-px bg-white/10" />
                {SIG.map((s, i) => {
                  const cur = SIG.indexOf(saved.signature), done = i <= cur
                  return (
                    <li key={s} className="relative z-10 flex w-1/3 flex-col items-center text-center">
                      <span className={clsx('flex h-7 w-7 items-center justify-center rounded-full ring-1', done ? 'bg-sage/15 text-sage ring-sage/30' : 'bg-ink-700 text-mist ring-white/10')}>{done ? <CheckCircle size={15} weight="fill" /> : <span className="num text-[11px]">{i + 1}</span>}</span>
                      <span className={clsx('mt-2 text-[12px] capitalize', i === cur ? 'text-bone' : 'text-bone/55')}>{s}</span>
                      <span className="text-[10.5px] text-mist">{i === 1 && saved.sentAt ? fdate(saved.sentAt, { day: 'numeric', month: 'short' }) : i === 2 && saved.signedAt ? fdate(saved.signedAt, { day: 'numeric', month: 'short' }) : ' '}</span>
                    </li>
                  )
                })}
              </ol>
              <div className="mt-4 rounded-xl bg-white/[0.02] px-3 py-2.5 text-[12px] text-bone/55 ring-1 ring-white/[0.05]">Signature électronique non configurée : l’envoi est consigné dans la file d’envoi ; la signature se consigne à réception de l’exemplaire signé.</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {saved.signature === 'à préparer' && <SoftBtn tone="gold" disabled={missing.length > 0 || dirty} icon={<PaperPlaneTilt size={14} />} onClick={send}>{busy === 'send' ? 'Consignation…' : 'Envoyer pour signature'}</SoftBtn>}
                {saved.signature === 'envoyé' && <><SoftBtn tone="gold" icon={<Signature size={14} />} onClick={sign}>{busy === 'sign' ? 'Enregistrement…' : 'Marquer comme signé'}</SoftBtn><SoftBtn icon={<ArrowCounterClockwise size={14} />} onClick={back}>Annuler l’envoi</SoftBtn></>}
                {saved.signature === 'signé' && <span className="inline-flex items-center gap-2 text-[13px] text-sage"><Seal size={16} weight="fill" />Signé{saved.signedAt ? ` le ${fdate(saved.signedAt)}` : ''}</span>}
                {dirty && saved.signature === 'à préparer' && <span className="self-center text-[11.5px] text-mist">Enregistrez d’abord les modifications.</span>}
              </div>
            </Card>
          </Stagger>
        </div>
      </div>

      {/* Aperçu */}
      <Stagger i={5}>
        <Card title="Aperçu du mandat" kicker="Document" action={<SoftBtn icon={<Printer size={14} />} onClick={() => { window.print(); toast('Impression lancée', 'info') }}>Imprimer / PDF</SoftBtn>}>
          <Paper>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink/10 pb-4">
              <span className="font-serif text-2xl italic">Maison Riviera · Antibes</span>
              <span className="text-[10.5px] uppercase tracking-eyebrow text-ink/50">{m.registry || 'Registre n° —'}</span>
            </div>
            <h3 className="mt-5 font-serif text-[1.9rem] leading-tight">Mandat de vente {m.type ? m.type.toLowerCase() : '—'}</h3>
            <p className="mt-1 text-[12px] text-ink/55">Loi n° 70-9 du 2 janvier 1970 (Hoguet) et décret n° 72-678 du 20 juillet 1972</p>
            <div className="mt-5 grid gap-5 text-[13px] leading-relaxed text-ink/80 md:grid-cols-2">
              <div><Eyebrow className="!text-ink/50">Mandant</Eyebrow><p className="mt-1">{dossier.seller}<br />{p.address}, {p.city}</p></div>
              <div><Eyebrow className="!text-ink/50">Mandataire</Eyebrow><p className="mt-1">Maison Riviera · Antibes — carte CPI 0605 2026 000 041 · représentée par {a.name}, {a.role.toLowerCase()}</p></div>
              <div><Eyebrow className="!text-ink/50">Désignation du bien</Eyebrow><p className="mt-1">{p.type} · {p.title}, {journey.discovery.surface?.v ?? p.surface} m² {p.type === 'Appartement' ? 'loi Carrez' : 'habitables'}{p.land ? ` sur ${p.land.toLocaleString('fr-FR')} m² de terrain` : ''} · {p.rooms} pièces · DPE {dpe}</p></div>
              <div><Eyebrow className="!text-ink/50">Prix et honoraires</Eyebrow><p className="mt-1">Prix de présentation {money(m.price)}. Honoraires {m.feesPct.toLocaleString('fr-FR')} % TTC soit {money(fees)}, à la charge de l’{m.feesPayer}.</p></div>
              <div><Eyebrow className="!text-ink/50">Durée</Eyebrow><p className="mt-1">{m.duration} mois du {fdate(start)} au {fdate(end)}{m.type && m.type !== 'Simple' ? ', irrévocable les 3 premiers mois puis résiliable avec un préavis de 15 jours par lettre recommandée.' : ', résiliable à tout moment après 3 mois.'}</p></div>
              <div><Eyebrow className="!text-ink/50">Annexes</Eyebrow><p className="mt-1">{mentions.map((x) => `${m.mentions[x.k] ? '☑' : '☐'} ${x.l}`).join(' · ')}</p></div>
            </div>
            {m.notes && <p className="mt-5 rounded-xl bg-ink/[0.04] p-3 text-[12.5px] text-ink/70">Conditions particulières : {m.notes}</p>}
            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-ink/10 pt-5 text-[11.5px] text-ink/55">
              <div>Le mandant<div className="mt-6 h-px bg-ink/20" />{saved.signature === 'signé' ? `Signé le ${fdate(saved.signedAt)}` : 'Signature précédée de « Bon pour mandat »'}</div>
              <div>Le mandataire<div className="mt-6 h-px bg-ink/20" />{a.name}</div>
            </div>
          </Paper>
        </Card>
      </Stagger>
    </>
  )
}
