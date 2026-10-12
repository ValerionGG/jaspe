import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { Handshake, Seal, Bank, Vault, Coins, DownloadSimple, Plus, CheckCircle, Circle, Warning, HourglassMedium, PaperPlaneTilt, FileText, Scales, ArrowRight, Sparkle, Check, PencilSimple, CaretRight } from '@phosphor-icons/react'
import { PageHeader, Card, Stagger, SoftBtn, Empty, IconBtn } from '../ui'
import { EXPO } from '../../ui/kit'
import { prop, eur, fmt, agent, type Dossier } from '../../data/mock'
import { TX_STAGES, type Tx, type TxStage, type CondState } from '../../data/ops'
import { useTransactions, useDossiers, useTasks, useOutbox } from '../../data/collections'
import { action, type Doc } from '../../data/store'
import { Modal, Field, Input, Select, AsyncForm, toast, errText } from '../forms'

type T = Tx & Doc
type Cond = Tx['conditions'][number]
// ponytail: horloge de démo ancrée au lundi 12 oct. 2026 10:36, avance en temps réel.
const DEMO_NOW = Date.UTC(2026, 9, 12, 10, 36)
const T0 = Date.now()
function useNow() {
  const [n, setN] = useState(DEMO_NOW)
  useEffect(() => { const t = setInterval(() => setN(DEMO_NOW + Date.now() - T0), 1000); return () => clearInterval(t) }, [])
  return n
}
const signTs = (t: Tx) => Date.UTC(t.sign.m < 9 ? 2027 : 2026, t.sign.m, t.sign.d, t.sign.h)
const split = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 } }
const pad = (n: number) => String(n).padStart(2, '0')
const stamp = () => new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const MONTHS = [9, 10, 11, 0, 1].map((m) => ({ m, l: ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'][m] }))
const STATES: CondState[] = ['à lancer', 'en cours', 'en retard', 'levée']

const COND: Record<CondState, string> = { levée: 'bg-sage/15 text-sage ring-sage/25', 'en cours': 'bg-sea/15 text-sea ring-sea/25', 'en retard': 'bg-coral/15 text-coral ring-coral/25', 'à lancer': 'bg-white/[0.04] text-bone/55 ring-white/10' }
const STAGE_I: Record<TxStage, typeof Handshake> = { offre: Handshake, compromis: FileText, conditions: Scales, acte: Seal }

export default function Transactions() {
  const now = useNow()
  const [txs, ops] = useTransactions()
  const [dossiers] = useDossiers()
  const [, taskOps] = useTasks()
  const [, outOps] = useOutbox()
  const [sel, setSel] = useState('tx2')
  const [stage, setStage] = useState<TxStage | null>(null)
  const [creating, setCreating] = useState(false)
  const tx = (txs.find((t) => t.id === sel) ?? txs[0]) as T | undefined

  const engaged = txs.filter((t) => t.stage !== 'offre')
  const fees = txs.reduce((s, t) => s + t.fees, 0)
  const deposits = txs.reduce((s, t) => s + t.deposit, 0)
  const nextActe = [...txs].filter((t) => signTs(t) > now && t.stage !== 'offre').sort((a, b) => signTs(a) - signTs(b))[0]
  const byAgency = Object.entries(txs.flatMap((t) => t.split.map((s) => [s.agency, (t.fees * s.pct) / 100] as const)).reduce<Record<string, number>>((acc, [a, v]) => ({ ...acc, [a]: (acc[a] ?? 0) + v }), {})).sort((a, b) => b[1] - a[1])
  const feesByMonth = MONTHS.map(({ m, l }) => ({ l, v: Math.round(txs.filter((t) => t.stage !== 'offre' && t.sign.m === m).reduce((s, t) => s + t.fees, 0) / 1000) }))
  const maxMonth = Math.max(1, ...feesByMonth.map((m) => m.v))
  const lateTx = txs.filter((t) => t.conditions.some((c) => c.s === 'en retard'))
  const late = txs.flatMap((t) => t.conditions.filter((c) => c.s === 'en retard')).length
  const offerDossiers = dossiers.filter((d) => d.stage === 'offre' && !txs.some((t) => t.dossier === d.id))

  const exportCsv = () => {
    const rows = [['Bien', 'Étape', 'Prix (€)', 'Honoraires (€)', 'Charge', 'Séquestre (€)', 'Signature', 'Lieu'], ...txs.map((t) => [prop(t.propertyId).title, TX_STAGES.find((s) => s.id === t.stage)?.label ?? t.stage, t.price, t.fees, t.feePayer, t.deposit, t.sign.label, t.sign.place])]
    const url = URL.createObjectURL(new Blob(['﻿' + rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = 'echeancier-transactions.csv'; a.click(); URL.revokeObjectURL(url)
    toast('Échéancier exporté')
  }

  return (
    <div>
      <PageHeader
        kicker={`Transactions · ${txs.length} en cours`}
        title={<>De l’offre <span className="italic text-champagne-300">à l’acte</span></>}
        sub="Chaque jalon, condition suspensive et pièce notariale suivi avec son responsable, son échéance et sa preuve. Les relances sont préparées, vous décidez de l’envoi."
        actions={<><SoftBtn icon={<DownloadSimple size={14} weight="light" />} onClick={exportCsv}>Échéancier</SoftBtn><SoftBtn tone="gold" icon={<Plus size={14} weight="light" />} onClick={() => setCreating(true)}>Nouvelle transaction</SoftBtn></>}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Stagger className="grid grid-cols-2 gap-4 lg:col-span-7">
          {[
            { I: Handshake, l: 'Volume sous compromis', v: eur(engaged.reduce((s, t) => s + t.price, 0)), h: `${engaged.length} transactions engagées` },
            { I: Coins, l: 'Honoraires attendus', v: eur(fees), h: 'TTC · avant répartition' },
            { I: Vault, l: 'Séquestres chez notaires', v: eur(deposits), h: 'Dépôts de garantie versés' },
            { I: HourglassMedium, l: 'Prochaine signature', v: nextActe ? (() => { const c = split(signTs(nextActe) - now); return `${c.d} j ${pad(c.h)} h` })() : '—', h: nextActe ? `${prop(nextActe.propertyId).title} · ${nextActe.sign.label}` : 'Aucune signature planifiée' },
          ].map(({ I, l, v, h }) => (
            <Card key={l}>
              <div className="flex items-center justify-between text-[12px] text-mist"><span>{l}</span><I size={16} weight="light" className="text-champagne/80" /></div>
              <div className="display mt-2 text-[2.1rem] leading-none sm:text-[2.4rem]">{v}</div>
              <div className="mt-2 truncate text-[11.5px] text-bone/45">{h}</div>
            </Card>
          ))}
        </Stagger>
        <Stagger i={1} className="lg:col-span-5">
          <Card title="Honoraires attendus" kicker="Par mois de signature · hors offres" className="h-full">
            <div className="flex h-28 items-end gap-3">
              {feesByMonth.map((m, i) => (
                <div key={m.l} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="num text-[10.5px] text-bone/60">{m.v ? `${m.v} k€` : '—'}</span>
                  <motion.div className="w-full rounded-t-lg bg-gradient-to-t from-champagne-700/60 to-champagne" initial={{ height: 0 }} animate={{ height: `${Math.max(3, (m.v / maxMonth) * 72)}px` }} transition={{ duration: 1, delay: 0.2 + i * 0.06, ease: EXPO }} style={{ opacity: m.v ? 1 : 0.15 }} />
                  <span className="text-[10.5px] text-mist">{m.l}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-white/[0.06] pt-3">
              {byAgency.slice(0, 4).map(([a, v]) => (
                <div key={a} className="flex items-center gap-3 text-[11.5px]">
                  <span className="w-36 truncate text-bone/70">{a}</span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]"><motion.div className="h-full rounded-full bg-sea" initial={{ width: 0 }} animate={{ width: `${(v / byAgency[0][1]) * 100}%` }} transition={{ duration: 1, ease: EXPO }} /></div>
                  <span className="num w-14 text-right text-bone/70">{eur(v)}</span>
                </div>
              ))}
            </div>
          </Card>
        </Stagger>
      </div>

      <Stagger i={2} className="mb-6">
        <div className="thin-scroll -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="grid min-w-[900px] grid-cols-4 gap-3">
            {TX_STAGES.map((s, si) => {
              const items = txs.filter((t) => t.stage === s.id), I = STAGE_I[s.id], active = stage === s.id
              return (
                <div key={s.id} className={clsx('rounded-[1.4rem] p-1 ring-1 transition', active ? 'bg-champagne/[0.05] ring-champagne/25' : 'bg-white/[0.02] ring-white/[0.06]')}>
                  <button onClick={() => setStage(active ? null : s.id)} className="flex w-full items-center justify-between px-3 pb-2 pt-2.5 text-left">
                    <span className="flex items-center gap-2 text-[12.5px]"><span className="num flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.06] text-[10px] text-mist">{si + 1}</span><I size={14} weight="light" className="text-champagne" />{s.label.replace(' suspensives', '')}</span>
                    <span className="num text-[11px] text-mist">{items.length} · {eur(items.reduce((x, t) => x + t.price, 0))}</span>
                  </button>
                  <div className="space-y-1.5">
                    {items.map((t) => {
                      const p = prop(t.propertyId), c = split(signTs(t) - now), on = tx?.id === t.id
                      return (
                        <motion.button layout key={t.id} onClick={() => setSel(t.id)} className={clsx('relative flex w-full items-center gap-3 rounded-2xl p-2 text-left ring-1 transition-all duration-300', on ? 'bg-ink-700 ring-champagne/40' : 'bg-ink-800/80 ring-white/[0.05] hover:ring-white/15', stage && !active && 'opacity-40')}>
                          <img src={p.photo} alt="" className="h-11 w-11 shrink-0 rounded-xl object-cover" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[12.5px] font-medium">{p.title}</div>
                            <div className="flex items-center justify-between text-[11px] text-mist"><span className="num text-bone/70">{eur(t.price)}</span><span className={clsx('num', c.d < 1 ? 'text-coral' : '')}>J-{c.d}</span></div>
                          </div>
                          {t.conditions.some((x) => x.s === 'en retard') && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-coral" />}
                        </motion.button>
                      )
                    })}
                    {!items.length && <div className="mx-1 mb-1 rounded-xl border border-dashed border-white/[0.08] p-4 text-center text-[11px] text-mist">Aucune transaction</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {late > 0 && <div className="mt-3 flex items-center gap-2 px-1 text-[12px] text-coral"><Warning size={14} weight="light" />{late} condition{late > 1 ? 's' : ''} suspensive{late > 1 ? 's' : ''} en retard · {lateTx.map((t) => prop(t.propertyId).title).join(', ')}</div>}
      </Stagger>

      <AnimatePresence mode="wait">
        {tx ? (
          <motion.div key={tx.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.5, ease: EXPO }}>
            <Detail tx={tx} now={now} d={dossiers.find((x) => x.id === tx.dossier)}
              update={async (patch, ok) => { try { await ops.update(tx.id, patch); toast(ok) } catch (x) { toast(errText(x), 'error') } }}
              relance={async (k) => {
                const p = prop(tx.propertyId)
                try {
                  await taskOps.create({ title: `Relancer ${k.owner} — ${k.k} · ${p.title}`, dossier: tx.dossier, due: 'Demain 9:00', prio: k.s === 'en retard' ? 'haute' : 'normale', kind: 'relancer', ai: true, done: false })
                  await outOps.create({ dossierId: tx.dossier ?? '', code: 'REL', to: k.owner, subject: `Relance — ${k.l} (${p.title})`, status: 'consigné (connecteur non configuré)', at: new Date().toISOString(), channel: 'E-mail' })
                  await ops.update(tx.id, { conditions: tx.conditions.map((c) => (c.k === k.k ? { ...c, relance: `Relance consignée le ${stamp()} · tâche créée` } : c)) })
                  toast('Relance préparée · tâche créée, envoi consigné (connecteur non configuré)')
                } catch (x) { toast(errText(x), 'error') }
              }}
              ask={async (labels) => {
                try {
                  await ops.update(tx.id, { pieces: tx.pieces.map((x) => (labels.includes(x.l) ? { ...x, s: 'demandée' as const } : x)) })
                  await outOps.create({ dossierId: tx.dossier ?? '', code: 'PIECES', to: [...new Set(tx.pieces.filter((x) => labels.includes(x.l)).map((x) => x.from))].join(', '), subject: `Demande de pièces — ${labels.join(', ')}`, status: 'consigné (connecteur non configuré)', at: new Date().toISOString(), channel: 'E-mail' })
                  toast(`${labels.length} pièce${labels.length > 1 ? 's' : ''} demandée${labels.length > 1 ? 's' : ''} · envoi consigné (connecteur non configuré)`)
                } catch (x) { toast(errText(x), 'error') }
              }}
              advance={async () => {
                const i = TX_STAGES.findIndex((s) => s.id === tx.stage), next = TX_STAGES[i + 1]
                if (!next) return
                try {
                  await ops.update(tx.id, { stage: next.id })
                  if (tx.dossier && (next.id === 'compromis' || next.id === 'acte')) await action('dossier.move', { id: tx.dossier, stage: next.id })
                  toast(`Transaction → ${next.label}`)
                } catch (x) { toast(errText(x), 'error') }
              }} />
          </motion.div>
        ) : <Empty title="Aucune transaction">Enregistrez une transaction depuis un dossier en offre.</Empty>}
      </AnimatePresence>

      <Modal open={creating} onClose={() => setCreating(false)} kicker="Transactions" width={620} title={<>Nouvelle <span className="italic text-champagne-300">transaction</span></>}>
        {offerDossiers.length ? <NewTx dossiers={offerDossiers} onCancel={() => setCreating(false)} onCreate={async (doc) => { const t = await ops.create(doc); setSel(t.id); setCreating(false) }} />
          : <div className="space-y-4"><Empty title="Aucun dossier en offre">Seuls les dossiers à l’étape « Offre reçue » sans transaction peuvent être convertis. Déplacez un dossier dans le tableau Dossiers.</Empty><div className="flex justify-end"><Link to="/app/dossiers"><SoftBtn icon={<ArrowRight size={14} />}>Ouvrir les dossiers</SoftBtn></Link></div></div>}
      </Modal>
    </div>
  )
}

function NewTx({ dossiers, onCreate, onCancel }: { dossiers: Dossier[]; onCreate: (t: Partial<T>) => Promise<void>; onCancel: () => void }) {
  const [id, setId] = useState(dossiers[0].id)
  const d = dossiers.find((x) => x.id === id)!, p = prop(d.propertyId)
  return (
    <AsyncForm submitLabel="Créer la transaction" success="Transaction créée · conditions et pièces à suivre" onCancel={onCancel} onSubmit={async (v) => {
      const price = Number(v.price), fees = Number(v.fees), deposit = Number(v.deposit) || 0
      if (!v.buyer.trim()) throw new Error('Acquéreur requis')
      if (!(price > 0)) throw new Error('Prix requis')
      if (!(fees >= 0)) throw new Error('Honoraires invalides')
      if (!v.date) throw new Error('Date de signature requise')
      const dt = new Date(`${v.date}T${v.time || '10:00'}`)
      const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      const day = dt.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
      const label = `${day[0].toUpperCase()}${day.slice(1)} · ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
      await onCreate({
        propertyId: d.propertyId, dossier: d.id, stage: 'offre', price, seller: d.seller, buyer: v.buyer.trim(), notaries: v.notaries.trim() || 'À désigner',
        milestones: [{ l: 'Offre acceptée', d: today, s: 'done' }, { l: 'Compromis', d: label.split(' · ')[0], s: 'now' }, { l: 'Fin rétractation SRU', d: '—', s: 'todo' }, { l: 'Conditions', d: '—', s: 'todo' }, { l: 'Acte', d: '—', s: 'todo' }],
        conditions: [
          ...(v.loan === 'yes' ? [{ k: 'Prêt', l: 'Financement de l’acquéreur', owner: v.buyer.trim(), due: '—', s: 'à lancer' as CondState }] : []),
          { k: 'Préemption (DIA)', l: `DIA mairie ${/^[aeiouyéh]/i.test(p.city) ? 'd’' : 'de '}${p.city}`, owner: 'Notaire vendeur', due: '—', s: 'à lancer' },
        ],
        pieces: [{ l: 'Offre écrite signée', s: 'reçue', from: 'Acquéreur' }, { l: 'Titre de propriété', s: 'manquante', from: 'Vendeur' }, { l: 'DDT complet', s: 'manquante', from: 'Diagnostiqueur' }, { l: 'Pièces d’identité acquéreur', s: 'manquante', from: 'Acquéreur' }],
        fees, feePayer: v.feePayer as Tx['feePayer'], split: [{ agency: agent(d.agentId).agency, pct: 100, role: 'Mandat & vente' }], deposit,
        sign: { m: dt.getMonth(), d: dt.getDate(), h: dt.getHours(), label, place: v.place.trim() || 'À définir' },
      })
    }}>
      <Field label="Dossier en offre"><Select name="dossier" value={id} onChange={(e) => setId(e.target.value)}>{dossiers.map((x) => <option key={x.id} value={x.id}>{x.seller} · {prop(x.propertyId).title}</option>)}</Select></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Acquéreur"><Input name="buyer" required placeholder="Mme Okafor" /></Field>
        <Field label="Prix accepté (€)"><Input key={`p${id}`} name="price" type="number" min={0} step={1000} required defaultValue={p.price} /></Field>
        <Field label="Honoraires TTC (€)"><Input key={`f${id}`} name="fees" type="number" min={0} step={500} required defaultValue={Math.round(p.price * 0.05)} /></Field>
        <Field label="Charge des honoraires"><Select name="feePayer" defaultValue="vendeur"><option value="vendeur">Vendeur</option><option value="acquéreur">Acquéreur</option></Select></Field>
        <Field label="Signature du compromis"><Input name="date" type="date" required min="2026-10-11" max="2027-08-31" /></Field>
        <Field label="Heure"><Input name="time" type="time" step={900} defaultValue="10:00" /></Field>
        <Field label="Notaires"><Input name="notaries" placeholder="Me Faure · Me Lenoir" /></Field>
        <Field label="Lieu de signature"><Input name="place" placeholder="Étude Faure, Antibes" /></Field>
        <Field label="Dépôt de garantie (€)"><Input name="deposit" type="number" min={0} step={500} defaultValue={0} /></Field>
        <Field label="Condition de prêt"><Select name="loan" defaultValue="yes"><option value="yes">Oui</option><option value="no">Achat comptant</option></Select></Field>
      </div>
    </AsyncForm>
  )
}

function Detail({ tx, now, d, update, relance, ask, advance }: {
  tx: T; now: number; d?: Dossier
  update: (patch: Partial<T>, ok: string) => Promise<void>; relance: (k: Cond) => Promise<void>; ask: (labels: string[]) => Promise<void>; advance: () => Promise<void>
}) {
  const [editing, setEditing] = useState<Cond | 'new' | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const go = async (k: string, f: () => Promise<void>) => { setBusy(k); try { await f() } finally { setBusy(null) } }
  const p = prop(tx.propertyId), c = split(signTs(tx) - now)
  const doneIdx = tx.milestones.filter((m) => m.s === 'done').length
  const missing = tx.pieces.filter((x) => x.s === 'manquante').map((x) => x.l)
  const received = tx.pieces.filter((x) => x.s === 'reçue').length
  const stageIdx = TX_STAGES.findIndex((s) => s.id === tx.stage), next = TX_STAGES[stageIdx + 1]
  const setPiece = (l: string, s: 'reçue' | 'demandée') => update({ pieces: tx.pieces.map((x) => (x.l === l ? { ...x, s } : x)) }, `« ${l} » marquée ${s}`)
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <Card pad={false} className="lg:col-span-12">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="relative min-h-[220px] overflow-hidden rounded-t-[calc(1.4rem-0.25rem)] lg:rounded-l-[calc(1.4rem-0.25rem)] lg:rounded-tr-none">
            <img src={p.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-800 via-ink-800/80 to-ink-800/20" />
            <div className="relative p-6 md:p-7">
              <div className="text-[10.5px] uppercase tracking-eyebrow text-champagne-300">{TX_STAGES[stageIdx]?.label}{d && ` · ${d.ref}`}</div>
              <h2 className="display mt-2 text-[2.4rem] leading-none md:text-5xl">{p.title}</h2>
              <div className="mt-2 text-[13px] text-bone/60">{p.district} · {p.city}</div>
              <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-[12.5px]">
                <div><div className="text-[10.5px] text-mist">Prix net vendeur</div><div className="num text-[17px]">{fmt(tx.price)} €</div></div>
                <div><div className="text-[10.5px] text-mist">Vendeur → acquéreur</div><div>{tx.seller} <ArrowRight size={11} className="mx-1 inline text-mist" /> {tx.buyer}</div></div>
                <div><div className="text-[10.5px] text-mist">Notaires</div><div className="text-bone/80">{tx.notaries}</div></div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {next && <SoftBtn icon={<CaretRight size={13} />} onClick={() => go('adv', advance)}>{busy === 'adv' ? 'Mise à jour…' : `Passer à « ${next.label} »`}</SoftBtn>}
                {d && <Link to={`/app/dossiers/${d.id}`}><SoftBtn icon={<FileText size={13} weight="light" />}>Dossier {d.ref}</SoftBtn></Link>}
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center border-t border-white/[0.06] p-6 lg:border-l lg:border-t-0">
            <div className="text-[10.5px] uppercase tracking-eyebrow text-mist">{tx.stage === 'offre' ? 'Échéance de l’offre' : tx.stage === 'acte' ? 'Signature de l’acte' : 'Signature prévue'}</div>
            <div className="mt-3 flex items-end gap-3">
              {([[c.d, 'jours'], [c.h, 'h'], [c.m, 'min'], [c.s, 's']] as const).map(([v, l]) => (
                <div key={l} className="text-center">
                  <div className={clsx('num text-[2.1rem] leading-none tabular-nums', l === 'jours' && c.d < 1 ? 'text-coral' : 'text-bone')}>{l === 'jours' ? v : pad(v)}</div>
                  <div className="mt-1 text-[10px] text-mist">{l}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-[12.5px] text-bone/75">{tx.sign.label}</div>
            <div className="text-[11.5px] text-mist">{tx.sign.place}</div>
          </div>
        </div>
        <div className="thin-scroll overflow-x-auto border-t border-white/[0.06] px-6 py-6">
          <div className="relative flex min-w-[620px] justify-between">
            <div className="absolute left-[10%] right-[10%] top-[9px] h-px bg-white/[0.08]" />
            <motion.div className="absolute left-[10%] top-[9px] h-px bg-gradient-to-r from-sage to-champagne" initial={{ width: 0 }} animate={{ width: `${(Math.max(0, doneIdx - 0.5) / (tx.milestones.length - 1)) * 80}%` }} transition={{ duration: 1.2, ease: EXPO }} />
            {tx.milestones.map((m) => (
              <div key={m.l} className="relative z-10 flex w-[20%] flex-col items-center text-center">
                <span className={clsx('flex h-[19px] w-[19px] items-center justify-center rounded-full ring-4 ring-ink-800', m.s === 'done' ? 'bg-sage text-ink' : m.s === 'now' ? 'bg-champagne' : 'bg-ink-600')}>
                  {m.s === 'done' ? <Check size={10} weight="bold" /> : m.s === 'now' ? <span className="absolute h-[19px] w-[19px] animate-pulseRing rounded-full bg-champagne/60" /> : null}
                </span>
                <div className={clsx('mt-2.5 text-[12px]', m.s === 'todo' ? 'text-bone/45' : 'text-bone')}>{m.l}</div>
                <div className="num text-[10.5px] text-mist">{m.d}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Conditions suspensives" kicker={`${tx.conditions.filter((x) => x.s === 'levée').length}/${tx.conditions.length} levées`} className="lg:col-span-8" pad={false}
        action={<div className="pr-5"><SoftBtn icon={<Plus size={13} weight="light" />} onClick={() => setEditing('new')}>Ajouter</SoftBtn></div>}>
        <div className="thin-scroll overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[12.5px]">
            <thead><tr className="text-[10.5px] uppercase tracking-eyebrow text-mist">{['Condition', 'Responsable', 'Échéance', 'Statut', 'Preuve / relance', ''].map((h) => <th key={h} className="px-5 pb-2.5 font-normal">{h}</th>)}</tr></thead>
            <tbody>
              {tx.conditions.map((k) => {
                const sent = k.relance?.startsWith('Relance consignée')
                return (
                  <tr key={k.k} className="border-t border-white/[0.05] align-top">
                    <td className="min-w-[190px] px-5 py-3.5"><div className="font-medium">{k.k}</div><div className="text-[11.5px] text-bone/55">{k.l}</div></td>
                    <td className="px-5 py-3.5 text-bone/75">{k.owner}</td>
                    <td className="num px-5 py-3.5 text-bone/75">{k.due}</td>
                    <td className="px-5 py-3.5">
                      <select value={k.s} aria-label={`Statut ${k.k}`} onChange={(e) => {
                        const s = e.target.value as CondState
                        if (s === 'levée' && !k.proof) return setEditing({ ...k, s })
                        update({ conditions: tx.conditions.map((x) => (x.k === k.k ? { ...x, s } : x)) }, `${k.k} → ${s}`)
                      }} className={clsx('cursor-pointer appearance-none whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10.5px] outline-none ring-1', COND[k.s])}>
                        {STATES.map((s) => <option key={s} value={s} className="bg-ink-800 text-bone">{s}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      {k.proof && <div className="flex items-center gap-1.5 text-[11.5px] text-sage"><CheckCircle size={13} weight="fill" className="shrink-0" />{k.proof}</div>}
                      {k.relance && <div className={clsx('mt-0.5 text-[11px]', sent ? 'text-champagne-300' : 'text-bone/50')}>{k.relance}</div>}
                      {k.s !== 'levée' && (
                        <button onClick={() => go(k.k, () => relance(k))} disabled={busy === k.k} className="mt-1.5 flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] text-bone/75 ring-1 ring-white/10 transition hover:bg-white/[0.05]">
                          {busy === k.k ? <><Sparkle size={11} weight="fill" className="animate-pulse" />Préparation…</> : <><PaperPlaneTilt size={11} weight="light" />{sent ? 'Relancer à nouveau' : 'Préparer une relance'}</>}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-3"><IconBtn label="Modifier la condition" onClick={() => setEditing(k)}><PencilSimple size={13} weight="light" /></IconBtn></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!tx.conditions.length && <div className="p-5"><Empty title="Aucune condition">Ajoutez les conditions suspensives du compromis.</Empty></div>}
        </div>
        {tx.conditions.some((k) => k.relance?.startsWith('Relance consignée')) && <Link to="/app/taches" className="mx-5 mb-4 mt-1 flex items-center gap-1.5 text-[11.5px] text-champagne-300 hover:underline">Relances ajoutées à vos tâches <ArrowRight size={11} /></Link>}
      </Card>

      <Card title="Honoraires & séquestre" kicker={`Charge ${tx.feePayer}`} className="lg:col-span-4">
        <div className="flex items-end justify-between">
          <div><div className="display text-[2.6rem] leading-none">{eur(tx.fees)}</div><div className="mt-1 text-[11.5px] text-mist">{((tx.fees / tx.price) * 100).toFixed(1).replace('.', ',')} % du prix · TTC</div></div>
          <div className="text-right"><div className="text-[10.5px] text-mist">Séquestre</div><div className="num text-[15px]">{tx.deposit ? `${fmt(tx.deposit)} €` : '—'}</div></div>
        </div>
        <div className="mt-5 flex h-2.5 overflow-hidden rounded-full">
          {tx.split.map((s, i) => <motion.div key={s.agency} className={i ? 'bg-sea' : 'bg-champagne'} initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 1, delay: 0.1 * i, ease: EXPO }} />)}
        </div>
        <div className="mt-3 space-y-2.5">
          {tx.split.map((s, i) => (
            <div key={s.agency} className="flex items-center gap-3 text-[12px]">
              <span className={clsx('h-2 w-2 rounded-full', i ? 'bg-sea' : 'bg-champagne')} />
              <div className="min-w-0 flex-1"><div className="truncate">{s.agency}</div><div className="text-[11px] text-mist">{s.role}</div></div>
              <div className="text-right"><div className="num">{eur((tx.fees * s.pct) / 100)}</div><div className="num text-[10.5px] text-mist">{s.pct} %</div></div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/[0.025] p-3 text-[11.5px] text-bone/60 ring-1 ring-white/[0.05]"><Bank size={14} weight="light" className="shrink-0 text-champagne" />Versement à l’agence par le notaire, le jour de l’acte.</div>
      </Card>

      <Card title="Pièces pour le notaire" kicker={`${received}/${tx.pieces.length} reçues`} className="lg:col-span-12"
        action={missing.length > 0 ? <SoftBtn onClick={() => go('ask', () => ask(missing))} icon={<PaperPlaneTilt size={13} weight="light" />}>{busy === 'ask' ? 'Préparation…' : missing.length > 1 ? `Demander les ${missing.length} manquantes` : 'Demander la pièce manquante'}</SoftBtn> : undefined}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {tx.pieces.map((x) => (
            <div key={x.l} className="flex items-center gap-3 rounded-2xl bg-white/[0.02] p-3 ring-1 ring-white/[0.05]">
              {x.s === 'reçue' ? <CheckCircle size={18} weight="fill" className="shrink-0 text-sage" /> : x.s === 'demandée' ? <HourglassMedium size={18} weight="light" className="shrink-0 text-sea" /> : <Circle size={18} weight="light" className="shrink-0 text-coral" />}
              <div className="min-w-0 flex-1"><div className="truncate text-[12.5px]">{x.l}</div><div className="text-[11px] text-mist">{x.from} · <span className={x.s === 'reçue' ? 'text-sage' : x.s === 'demandée' ? 'text-sea' : 'text-coral'}>{x.s}</span></div></div>
              <div className="flex shrink-0 gap-1">
                {x.s !== 'demandée' && <button onClick={() => setPiece(x.l, 'demandée')} className="rounded-full px-2 py-1 text-[10.5px] text-bone/60 ring-1 ring-white/10 transition hover:text-sea hover:ring-sea/30">Demandée</button>}
                {x.s !== 'reçue' && <button onClick={() => setPiece(x.l, 'reçue')} className="rounded-full bg-sage/10 px-2 py-1 text-[10.5px] text-sage ring-1 ring-sage/25 transition hover:bg-sage/20">Reçue</button>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} kicker={p.title} title={editing === 'new' ? <>Nouvelle <span className="italic text-champagne-300">condition</span></> : <>Condition <span className="italic text-champagne-300">suspensive</span></>}>
        {editing && (
          <AsyncForm submitLabel="Enregistrer" success="Condition enregistrée" onCancel={() => setEditing(null)} onSubmit={async (v) => {
            if (!v.k.trim()) throw new Error('Intitulé requis')
            if (v.s === 'levée' && !v.proof.trim()) throw new Error('Une condition levée exige une preuve (document, date)')
            const isNew = editing === 'new'
            if (isNew && tx.conditions.some((x) => x.k === v.k.trim())) throw new Error('Une condition porte déjà ce nom')
            const next: Cond = { ...(isNew ? {} : editing), k: v.k.trim(), l: v.l.trim(), owner: v.owner.trim() || '—', due: v.due.trim() || '—', s: v.s as CondState, proof: v.proof.trim() || undefined }
            await update({ conditions: isNew ? [...tx.conditions, next] : tx.conditions.map((x) => (x.k === editing.k ? next : x)) }, isNew ? 'Condition ajoutée' : `${next.k} mise à jour`)
            setEditing(null)
          }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Condition"><Input name="k" required defaultValue={editing === 'new' ? '' : editing.k} placeholder="Prêt" /></Field>
              <Field label="Statut"><Select name="s" defaultValue={editing === 'new' ? 'à lancer' : editing.s}>{STATES.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
            </div>
            <Field label="Détail"><Input name="l" defaultValue={editing === 'new' ? '' : editing.l} placeholder="Prêt 720 k€ · taux max 3,4 %" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Responsable"><Input name="owner" defaultValue={editing === 'new' ? '' : editing.owner} placeholder="Camille Roux · courtier" /></Field>
              <Field label="Échéance"><Input name="due" defaultValue={editing === 'new' ? '' : editing.due} placeholder="24 oct." /></Field>
            </div>
            <Field label="Preuve" hint="Obligatoire pour lever la condition."><Input name="proof" defaultValue={editing === 'new' ? '' : editing.proof} placeholder="Offre de prêt BNP · 30/09" /></Field>
          </AsyncForm>
        )}
      </Modal>
    </div>
  )
}
