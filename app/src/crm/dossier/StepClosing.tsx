import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { CheckCircle, Circle, Plus, Trash, Scales, Vault, ArrowSquareOut, FloppyDisk, Stamp, FilePdf, UploadSimple, Warning } from '@phosphor-icons/react'
import { Card, SoftBtn, Stagger, Empty } from '../ui'
import { Pill, EXPO } from '../../ui/kit'
import { prop, eur } from '../../data/mock'
import type { Closing } from '../../data/dossier'
import { useTransactions, useFiles } from '../../data/collections'
import type { CondState } from '../../data/ops'
import { action, uploadFile } from '../../data/store'
import { Field, Input, Select } from '../forms'
import { stepProgress } from './Stepper'
import { StepHead, Eyebrow, Kpi, useRun, useNow, countdown, ts, todayIso, addDays, daysFrom, fdate, money } from './sale-ui'
import type { StepProps } from './index'

const COND: Record<CondState, 'green' | 'blue' | 'red' | 'neutral'> = { levée: 'green', 'en cours': 'blue', 'en retard': 'red', 'à lancer': 'neutral' }

export default function StepClosing({ dossier, journey, save, goTo }: StepProps) {
  const p = prop(dossier.propertyId)
  const c = journey.closing
  const now = useNow(60e3)
  const [txs, txOps] = useTransactions()
  const tx = txs.find((t) => t.dossier === dossier.id)
  const { busy, run } = useRun()
  const [f, setF] = useState<Closing>(c)
  const [item, setItem] = useState('')
  const accepted = journey.offers.find((o) => o.status === 'acceptée')
  const price = tx?.price ?? accepted?.amount ?? journey.mandate.price ?? p.price
  const sru = f.compromisDate === c.compromisDate && c.sruEnd ? c.sruEnd : f.compromisDate ? addDays(f.compromisDate, 10) : undefined
  const pick = (x: Closing) => JSON.stringify([x.compromisDate, x.loanDeadline, x.acteDate, x.notary, x.deposit])
  const dirty = pick(f) !== pick(c)

  const saveDates = () => run('dates', () => save({ closing: { ...c, ...f, sruEnd: sru ?? f.sruEnd, checklist: c.checklist } }), 'Dates clés enregistrées')
  const setList = (checklist: Closing['checklist']) => save({ closing: { ...c, checklist } })
  const toggle = (i: number) => run(`c${i}`, () => setList(c.checklist.map((x, k) => (k === i ? { ...x, done: !x.done } : x))))
  const add = () => { const l = item.trim(); if (!l) return; setItem(''); run('add', () => setList([...c.checklist, { label: l, done: false }]), 'Étape ajoutée') }
  const del = (i: number) => run(`x${i}`, () => setList(c.checklist.filter((_, k) => k !== i)), 'Étape retirée')
  const lift = (k: string) => tx && run(`l${k}`, () => txOps.update(tx.id, { conditions: tx.conditions.map((x) => (x.k === k ? { ...x, s: 'levée' as CondState, proof: x.proof ?? `Levée consignée le ${fdate(todayIso())}` } : x)) }), `Condition « ${k} » levée`)
  const toActe = () => run('acte', async () => { await save({ closing: c }, { stage: 'acte' }); await action('dossier.move', { id: dossier.id, stage: 'acte' }) }, 'Dossier passé en « Acte authentique »')

  const keyDates = [
    { l: 'Compromis', d: c.compromisDate }, { l: 'Fin SRU', d: c.sruEnd }, { l: 'Condition de prêt', d: c.loanDeadline }, { l: 'Acte authentique', d: c.acteDate },
  ]
  const span = keyDates.filter((k) => k.d).map((k) => ts(k.d))
  const t0 = Math.min(...span, now), t1 = Math.max(...span, now)
  const pos = (d?: string) => (d ? ((ts(d) - t0) / (t1 - t0 || 1)) * 100 : 0)
  const done = c.checklist.filter((x) => x.done).length
  const acteIn = c.acteDate ? ts(`${c.acteDate}T10:00`) : NaN
  const prog = stepProgress(dossier, journey).closing
  const firstTodo = c.checklist.find((x) => !x.done)
  const next = !c.compromisDate ? { label: 'Fixer la date du compromis avec le notaire.', hint: accepted ? `Offre acceptée : ${accepted.buyer} · ${money(accepted.amount)}` : undefined, tone: 'coral' as const }
    : !c.acteDate ? { label: 'Planifier la date de l’acte authentique.' }
      : firstTodo ? { label: `Prochaine étape : ${firstTodo.label}.`, hint: `${done}/${c.checklist.length} étapes validées`, cta: 'Valider', onClick: () => toggle(c.checklist.indexOf(firstTodo)) }
        : { label: 'Toutes les étapes sont validées : passer à l’après-vente.', cta: 'Ouvrir l’après-vente', onClick: () => goTo('after'), tone: 'sage' as const }

  return (
    <>
      <Stagger i={0}>
        <StepHead n={7} kicker="Compromis & acte" progress={prog} next={next}
          title={<>Vers l’<span className="italic text-champagne-300">acte</span></>}
          sub={`${p.title} · ${eur(price)}${accepted ? ` · acquéreur ${accepted.buyer}` : tx ? ` · acquéreur ${tx.buyer}` : ''}`}
          aside={<><Pill tone={dossier.stage === 'acte' ? 'green' : 'blue'}>{dossier.stage === 'acte' ? 'Acte' : 'Compromis'}</Pill>{c.notary && <Pill>{c.notary}</Pill>}</>} />
      </Stagger>

      <div className="grid gap-6 2xl:grid-cols-[1fr_1.15fr]">
        <Stagger i={1}>
          <div className="theme-azur h-full rounded-[1.4rem] bg-white/[0.02] p-1 ring-1 ring-white/[0.06]">
            <div className="flex h-full flex-col justify-between rounded-[calc(1.4rem-0.25rem)] bg-ink-800/80 p-6 shadow-bezel">
              <div><Eyebrow>Compte à rebours de l’acte</Eyebrow>
                <div className="display mt-3 text-[3.4rem] leading-none md:text-[4.2rem]">{c.acteDate ? (acteIn > now ? countdown(acteIn, now) : 'Échéance passée') : '—'}</div>
                <div className="mt-2 text-[13px] text-bone/60">{c.acteDate ? `${fdate(c.acteDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}${c.notary ? ` · ${c.notary}` : ''}` : 'Date de l’acte à planifier'}</div>
              </div>
              <div className="mt-6">
                <div className="relative h-14">
                  <div className="absolute inset-x-0 top-3 h-px bg-white/10" />
                  <motion.div className="absolute left-0 top-3 h-px bg-champagne" initial={{ width: 0 }} animate={{ width: `${Math.min(100, ((now - t0) / (t1 - t0 || 1)) * 100)}%` }} transition={{ duration: 1.2, ease: EXPO }} />
                  {keyDates.filter((k) => k.d).map((k) => (
                    <div key={k.l} className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${pos(k.d)}%` }}>
                      <span className={clsx('mx-auto block h-[13px] w-[13px] translate-y-[6px] rounded-full ring-2 ring-ink-800', ts(k.d) <= now ? 'bg-sage' : 'bg-champagne')} />
                      <span className="mt-3 block whitespace-nowrap text-[10px] text-mist">{fdate(k.d, { day: 'numeric', month: 'short' })}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11.5px] sm:grid-cols-4">{keyDates.map((k) => <div key={k.l}><div className="text-mist">{k.l}</div><div className="text-bone/85">{k.d && daysFrom(k.d, now) < 0 ? '✓ ' : ''}{fdate(k.d, { day: 'numeric', month: 'short' })}</div></div>)}</div>
                {dossier.stage === 'compromis' && c.compromisDate && c.compromisDate <= todayIso() && <div className="mt-5"><SoftBtn tone="gold" icon={<Stamp size={14} />} onClick={toActe}>{busy === 'acte' ? 'Mise à jour…' : 'Passer en « Acte authentique »'}</SoftBtn></div>}
              </div>
            </div>
          </div>
        </Stagger>

        <Stagger i={2}>
          <Card title="Dates clés & intervenants" kicker="Calendrier" action={dirty && <SoftBtn tone="gold" icon={<FloppyDisk size={14} />} onClick={saveDates}>{busy === 'dates' ? 'Enregistrement…' : 'Enregistrer'}</SoftBtn>}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Signature du compromis"><Input type="date" value={f.compromisDate ?? ''} onChange={(e) => setF({ ...f, compromisDate: e.target.value || undefined })} /></Field>
              <Field label="Fin du délai SRU" hint="Calculée : compromis + 10 jours"><Input type="date" value={sru ?? ''} readOnly className="opacity-70" /></Field>
              <Field label="Date limite condition de prêt"><Input type="date" value={f.loanDeadline ?? ''} onChange={(e) => setF({ ...f, loanDeadline: e.target.value || undefined })} /></Field>
              <Field label="Acte authentique"><Input type="date" value={f.acteDate ?? ''} min={f.compromisDate} onChange={(e) => setF({ ...f, acteDate: e.target.value || undefined })} /></Field>
              <Field label="Notaire"><Input value={f.notary ?? ''} placeholder="Me Faure" onChange={(e) => setF({ ...f, notary: e.target.value || undefined })} /></Field>
              <Field label="Séquestre (€)" hint={`Usage : 5 à 10 % · ${eur(price * 0.05)} – ${eur(price * 0.1)}`}><Input type="number" min={0} step={500} value={f.deposit ?? ''} onChange={(e) => setF({ ...f, deposit: Number(e.target.value) || undefined })} /></Field>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Kpi label="Prix" value={eur(price)} />
              <Kpi label="Séquestre" value={c.deposit ? eur(c.deposit) : '—'} hint={c.deposit ? `${((c.deposit / price) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % du prix` : 'Non renseigné'} />
              <Kpi label="SRU" value={c.sruEnd ? (daysFrom(c.sruEnd, now) < 0 ? 'Purgé' : `J-${daysFrom(c.sruEnd, now)}`) : '—'} tone={c.sruEnd && daysFrom(c.sruEnd, now) < 0 ? 'sage' : 'sea'} />
            </div>
          </Card>
        </Stagger>
      </div>

      <div className="grid gap-6 2xl:grid-cols-2">
        <Stagger i={3}>
          <Card title="Checklist jusqu’à l’acte" kicker={`${done}/${c.checklist.length} validées`}>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><motion.div className="h-full rounded-full bg-sage" animate={{ width: `${(done / (c.checklist.length || 1)) * 100}%` }} transition={{ duration: 0.8, ease: EXPO }} /></div>
            <ul className="space-y-1.5">
              {c.checklist.map((x, i) => (
                <li key={`${x.label}${i}`} className="group flex items-center gap-2 rounded-xl bg-white/[0.02] pr-2 ring-1 ring-white/[0.05]">
                  <button onClick={() => toggle(i)} className="flex flex-1 items-center gap-3 px-3 py-2.5 text-left text-[13px]">
                    {x.done ? <CheckCircle size={17} weight="fill" className="shrink-0 text-sage" /> : <Circle size={17} weight="light" className="shrink-0 text-mist" />}
                    <span className={x.done ? 'text-bone/50 line-through decoration-white/20' : ''}>{x.label}</span>
                  </button>
                  <button aria-label="Retirer" onClick={() => del(i)} className="rounded-full p-1.5 text-mist opacity-60 hover:text-coral group-hover:opacity-100"><Trash size={13} /></button>
                </li>
              ))}
            </ul>
            <form onSubmit={(e) => { e.preventDefault(); add() }} className="mt-3 flex gap-2"><Input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Ajouter une étape (ex. levée d’hypothèque)" /><SoftBtn type="submit" icon={<Plus size={14} />} disabled={!item.trim()}>Ajouter</SoftBtn></form>
          </Card>
        </Stagger>

        <Stagger i={4}>
          <Card title="Transaction & conditions suspensives" kicker="Suivi notarial" action={<Link to="/app/transactions" className="inline-flex items-center gap-1.5 text-[12.5px] text-champagne-300 hover:underline">Transactions<ArrowSquareOut size={13} /></Link>}>
            {tx ? (
              <>
                <div className="flex flex-wrap items-center gap-2 text-[13px]"><Scales size={16} className="text-champagne" />{tx.seller} → {tx.buyer}<Pill tone="blue">{tx.stage}</Pill></div>
                <div className="mt-1 text-[12px] text-mist">{tx.notaries} · signature {tx.sign.label}</div>
                <ul className="mt-4 space-y-2">
                  {tx.conditions.map((k) => (
                    <li key={k.k} className="flex flex-col gap-2 rounded-xl bg-white/[0.02] px-3 py-2.5 ring-1 ring-white/[0.05] sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0"><div className="flex items-center gap-2 text-[13px]">{k.k}<Pill tone={COND[k.s]}>{k.s}</Pill></div><div className="text-[11.5px] text-mist">{k.l} · {k.owner} · échéance {k.due}</div>{(k.proof || k.relance) && <div className="text-[11px] text-bone/50">{k.proof ?? k.relance}</div>}</div>
                      {k.s !== 'levée' && <SoftBtn onClick={() => lift(k.k)}>{busy === `l${k.k}` ? '…' : 'Marquer levée'}</SoftBtn>}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center gap-2 text-[12px] text-mist"><Vault size={14} />Dépôt de garantie {tx.deposit ? money(tx.deposit) : 'non versé'} · honoraires {money(tx.fees)} ({tx.feePayer})</div>
              </>
            ) : <Empty title="Pas de transaction">{accepted ? 'Elle est créée à l’acceptation de l’offre ; ouvrez Transactions pour la saisir.' : 'Acceptez une offre pour ouvrir la transaction.'}</Empty>}
          </Card>
        </Stagger>
      </div>

      <Stagger i={5}>
        <ContractReader dossierId={dossier.id} onApplied={(closing) => save({ closing: { ...c, ...closing, checklist: c.checklist } })} />
      </Stagger>
    </>
  )
}

/* ——— Lecture du compromis / CPCV (PDF) : proposition citée, rien n’est appliqué sans case cochée ——— */
type Quoted = { quote: string; unverified?: boolean }
type Extraction = {
  id: string; mode: 'claude' | 'rules'; model?: string; cost?: number; fileName?: string; lang?: 'fr' | 'pt'
  parties: ({ role: string; name: string } & Quoted)[]
  prix: ({ value: number } & Quoted) | null; depot: ({ value: number } & Quoted) | null; notaire: ({ name: string } & Quoted) | null
  dates: ({ id: string; k: string; label: string; date: string; confidence: number; computed?: string } & Quoted)[]
  conditions: ({ id: string; k: string; label: string; echeance: string | null } & Quoted)[]
  pieces: ({ id: string; label: string } & Quoted)[]
  alertes: { level: 'info' | 'warn' | 'risk'; text: string; quote?: string }[]
}
type ApplyResult = { closing: Partial<Closing>; tasks: unknown[]; noTransaction?: boolean }

function ContractReader({ dossierId, onApplied }: { dossierId: string; onApplied: (c: Partial<Closing>) => Promise<void> }) {
  const [files] = useFiles()
  const pdfs = files.filter((f) => f.dossierId === dossierId && (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)))
  const [fileId, setFileId] = useState('')
  const [ex, setEx] = useState<Extraction | null>(null)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const { busy, run } = useRun()
  const chosen = fileId || pdfs[0]?.id || ''

  const extract = (id: string) => run('read', async () => {
    const r = await action<Extraction>('contract.extract', { dossierId, fileId: id })
    setEx(r)
    // Pré-coche ce qui est sûr (confiance ≥ 0,8 et citation retrouvée) ; le reste attend une relecture.
    setSel(new Set([...r.dates.filter((d) => d.confidence >= 0.8 && !d.unverified).map((d) => d.id), ...r.conditions.filter((x) => !x.unverified).map((x) => x.id), ...r.pieces.map((p) => p.id)]))
  }, 'Compromis lu — vérifiez chaque élément avant d’appliquer')
  const upload = (f?: File) => f && run('up', async () => { const d = await uploadFile(f, dossierId); setFileId(d.id); await extract(d.id) })
  const flip = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const apply = () => ex && run('apply', async () => {
    const r = await action<ApplyResult>('contract.apply', { extractionId: ex.id, accept: [...sel] })
    if (Object.keys(r.closing).length) await onApplied(r.closing)
    setEx(null)
  }, `${sel.size} élément(s) appliqué(s) au dossier`)

  const Row = ({ id, title, sub, q }: { id: string; title: string; sub?: string; q: Quoted }) => (
    <li className="rounded-xl bg-white/[0.02] ring-1 ring-white/[0.05]">
      <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 text-[13px]">
        <input type="checkbox" className="mt-0.5 accent-champagne" checked={sel.has(id)} onChange={() => flip(id)} />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">{title}{sub && <span className="text-[11.5px] text-mist">{sub}</span>}{q.unverified && <Pill tone="red">citation introuvable</Pill>}</span>
          <span className="mt-1 block border-l-2 border-champagne/40 pl-2 text-[11.5px] italic text-bone/60">« {q.quote} »</span>
        </span>
      </label>
    </li>
  )
  const Section = ({ t, children }: { t: string; children: ReactNode }) => <div className="mt-4"><Eyebrow>{t}</Eyebrow><ul className="mt-2 space-y-1.5">{children}</ul></div>

  return (
    <Card title="Lire le compromis (PDF)" kicker={ex ? `${ex.mode === 'claude' ? 'Lecture Opus' : 'Lecture par règles'} · ${ex.fileName ?? ''}` : 'Compromis FR · CPCV PT'}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {pdfs.length > 0 && (
          <Select value={chosen} onChange={(e) => setFileId(e.target.value)} className="sm:max-w-xs">
            {pdfs.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
        )}
        {pdfs.length > 0 && <SoftBtn tone="gold" icon={<FilePdf size={14} />} disabled={!chosen || !!busy} onClick={() => extract(chosen)}>{busy === 'read' ? 'Lecture…' : 'Lancer l’extraction'}</SoftBtn>}
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] text-champagne-300 ring-1 ring-white/10 hover:bg-white/[0.04]">
          <UploadSimple size={14} />{busy === 'up' ? 'Dépôt…' : 'Déposer un PDF'}
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = '' }} />
        </label>
      </div>
      {!ex && <p className="mt-3 text-[12px] text-mist">Dates, conditions suspensives, pièces et notaire sont proposés avec la phrase exacte du contrat. Rien n’est modifié avant « Appliquer au dossier ». Aide à la lecture, pas un avis juridique.</p>}
      {ex && (
        <>
          {ex.alertes.length > 0 && (
            <ul className="mt-4 space-y-1">{ex.alertes.map((a, i) => <li key={i} className={clsx('flex items-start gap-2 text-[12px]', a.level === 'risk' ? 'text-coral' : a.level === 'warn' ? 'text-champagne-300' : 'text-mist')}><Warning size={13} className="mt-0.5 shrink-0" />{a.text}</li>)}</ul>
          )}
          {ex.dates.length > 0 && <Section t="Dates">{ex.dates.map((d) => <Row key={d.id} id={d.id} title={`${d.label} · ${fdate(d.date)}`} sub={`${Math.round(d.confidence * 100)} %${d.computed ? ` · ${d.computed}` : ''}`} q={d} />)}</Section>}
          {ex.conditions.length > 0 && <Section t="Conditions suspensives">{ex.conditions.map((x) => <Row key={x.id} id={x.id} title={x.k} sub={x.echeance ? `échéance ${fdate(x.echeance)}` : 'échéance non datée'} q={x} />)}</Section>}
          {ex.pieces.length > 0 && <Section t="Pièces à réunir">{ex.pieces.map((p) => <Row key={p.id} id={p.id} title={p.label} q={p} />)}</Section>}
          {(ex.notaire || ex.prix || ex.depot) && (
            <Section t="Notaire & montants">
              {ex.notaire && <Row id="notaire" title={`Notaire : ${ex.notaire.name}`} q={ex.notaire} />}
              {ex.prix && <Row id="prix" title={`Prix : ${money(ex.prix.value)}`} q={ex.prix} />}
              {ex.depot && <Row id="depot" title={`${ex.lang === 'pt' ? 'Sinal' : 'Dépôt de garantie'} : ${money(ex.depot.value)}`} q={ex.depot} />}
            </Section>
          )}
          {ex.parties.length > 0 && <div className="mt-4 text-[12px] text-mist">Parties lues : {ex.parties.map((p) => `${p.name} (${p.role})`).join(' · ')}</div>}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <SoftBtn tone="gold" icon={<CheckCircle size={14} />} disabled={!sel.size || !!busy} onClick={apply}>{busy === 'apply' ? 'Application…' : `Appliquer au dossier (${sel.size})`}</SoftBtn>
            <SoftBtn onClick={() => setEx(null)}>Ignorer</SoftBtn>
            <span className="text-[11.5px] text-mist">Relances J-7 créées pour chaque échéance cochée.</span>
          </div>
        </>
      )}
    </Card>
  )
}
