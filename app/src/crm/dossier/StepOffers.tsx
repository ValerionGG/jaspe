import { useState } from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { Plus, HandCoins, Check, X, ArrowsLeftRight, Trash, Timer, PaperPlaneTilt, Copy, Trophy, ArrowSquareOut } from '@phosphor-icons/react'
import { Card, SoftBtn, Stagger, Empty } from '../ui'
import { Pill } from '../../ui/kit'
import { prop, agent, eur } from '../../data/mock'
import type { Offer } from '../../data/dossier'
import { useConversations, useOutbox, useTemplates, useTransactions } from '../../data/collections'
import { action } from '../../data/store'
import { Modal, AsyncForm, Field, Input, Select, Textarea, toast } from '../forms'
import { stepProgress } from './Stepper'
import { StepHead, Seg, Eyebrow, useRun, useNow, countdown, ts, todayIso, addDays, fdate, money, uid, consignSend } from './sale-ui'
import type { StepProps } from './index'

const ST: Record<Offer['status'], 'neutral' | 'gold' | 'green' | 'red' | 'blue'> = { reçue: 'blue', 'contre-offre': 'gold', acceptée: 'green', refusée: 'red', expirée: 'neutral' }
const SAFE = { comptant: 3, mixte: 2, prêt: 1 } as const
type Reply = 'ack' | 'counter' | 'accept' | 'refuse'

export default function StepOffers({ dossier, journey, save, goTo }: StepProps) {
  const p = prop(dossier.propertyId), ag = agent(dossier.agentId)
  const ask = journey.mandate.price || p.price
  const now = useNow(30e3)
  const [convs] = useConversations()
  const [, outbox] = useOutbox()
  const [templates] = useTemplates()
  const [txs, txOps] = useTransactions()
  const { busy, run } = useRun()
  const [adding, setAdding] = useState(false)
  const [counterOf, setCounterOf] = useState<Offer | null>(null)

  const eff = (o: Offer): Offer['status'] => ((o.status === 'reçue' || o.status === 'contre-offre') && ts(o.expires) < now ? 'expirée' : o.status)
  const offers = [...journey.offers].sort((a, b) => b.amount - a.amount)
  const active = offers.filter((o) => ['reçue', 'contre-offre'].includes(eff(o)))
  const accepted = offers.find((o) => o.status === 'acceptée')
  const gap = (n: number) => ((n - ask) / ask) * 100
  const fees = (n: number) => Math.round((n * journey.mandate.feesPct) / 100)
  const net = (n: number) => (journey.mandate.feesPayer === 'vendeur' ? n - fees(n) : n)
  const score = (o: Offer) => Math.round(Math.max(0, 100 + gap(o.counter ?? o.amount) * 4) * 0.6 + SAFE[o.financing] * 10 + (o.conditions.split(/[,;]/).length <= 1 ? 10 : 0))
  const best = [...active].sort((a, b) => score(b) - score(a))[0]

  const setOffers = (list: Offer[], extra = {}) => save({ offers: list }, extra)
  const patchOffer = (id: string, patch: Partial<Offer>) => journey.offers.map((o) => (o.id === id ? { ...o, ...patch } : o))

  const addOffer = async (v: Record<string, string>) => {
    const amount = Number(v.amount)
    if (!v.buyer.trim() || !(amount > 0)) throw new Error('Acquéreur et montant requis')
    if (!v.expires) throw new Error('Date d’expiration requise')
    await setOffers([{ id: uid('o'), date: todayIso(), buyer: v.buyer.trim(), amount, conditions: v.conditions.trim() || 'Sans condition particulière', financing: v.financing as Offer['financing'], expires: v.expires, status: 'reçue' }, ...journey.offers], dossier.stage === 'commercial' || dossier.stage === 'mandat' ? { stage: 'offre' } : {})
    if (dossier.stage === 'commercial' || dossier.stage === 'mandat') await action('dossier.move', { id: dossier.id, stage: 'offre' })
    setAdding(false)
  }
  const counter = async (v: Record<string, string>) => {
    const c = Number(v.counter)
    if (!counterOf || !(c > 0)) throw new Error('Montant requis')
    await setOffers(patchOffer(counterOf.id, { status: 'contre-offre', counter: c, expires: v.expires || counterOf.expires }))
    setCounterOf(null)
  }
  const refuse = (o: Offer) => run(`r${o.id}`, () => setOffers(patchOffer(o.id, { status: 'refusée' })), `Offre de ${o.buyer} refusée`)
  const remove = (o: Offer) => window.confirm(`Supprimer l’offre de ${o.buyer} ?`) && run(`d${o.id}`, () => setOffers(journey.offers.filter((x) => x.id !== o.id)), 'Offre supprimée')
  const accept = (o: Offer) => window.confirm(`Accepter l’offre de ${o.buyer} à ${money(o.counter ?? o.amount)} ? Le dossier passera en compromis.`) && run(`a${o.id}`, async () => {
    const price = o.status === 'contre-offre' && o.counter ? o.counter : o.amount
    await setOffers(patchOffer(o.id, { status: 'acceptée', amount: price }), { stage: 'compromis' })
    await action('dossier.move', { id: dossier.id, stage: 'compromis' })
    if (!txs.some((t) => t.dossier === dossier.id)) {
      const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      const sign = new Date(`${addDays(todayIso(), 21)}T10:00`)
      const label = sign.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
      await txOps.create({
        propertyId: p.id, dossier: dossier.id, stage: 'offre', price, seller: dossier.seller, buyer: o.buyer, notaries: journey.closing.notary ?? 'À désigner',
        milestones: [{ l: 'Offre acceptée', d: today, s: 'done' }, { l: 'Compromis', d: label, s: 'now' }, { l: 'Fin rétractation SRU', d: '—', s: 'todo' }, { l: 'Conditions', d: '—', s: 'todo' }, { l: 'Acte', d: '—', s: 'todo' }],
        conditions: [...(o.financing !== 'comptant' ? [{ k: 'Prêt', l: `Financement ${o.financing} de l’acquéreur`, owner: o.buyer, due: '—', s: 'à lancer' as const }] : []), { k: 'Préemption (DIA)', l: `DIA mairie ${/^[aeiouyéh]/i.test(p.city) ? 'd’' : 'de '}${p.city}`, owner: 'Notaire vendeur', due: '—', s: 'à lancer' as const }],
        pieces: [{ l: 'Offre écrite signée', s: 'reçue', from: 'Acquéreur' }, { l: 'Titre de propriété', s: 'manquante', from: 'Vendeur' }, { l: 'DDT complet', s: 'manquante', from: 'Diagnostiqueur' }],
        fees: fees(price), feePayer: journey.mandate.feesPayer, split: [{ agency: ag.agency, pct: 100, role: 'Mandat & vente' }], deposit: 0,
        sign: { m: sign.getMonth(), d: sign.getDate(), h: 10, label: `${label[0].toUpperCase()}${label.slice(1)} · 10:00`, place: 'À définir' },
      })
    }
  }, 'Offre acceptée — dossier en compromis, transaction créée')

  /* ——— Rédaction de la réponse ——— */
  const [rid, setRid] = useState<string>('')
  const ro = offers.find((o) => o.id === rid) ?? active[0] ?? offers[0]
  const [kind, setKind] = useState<Reply>('ack')
  const tpl = templates.find((t) => t.id === 'tpl-offre')
  const draftFor = (o: Offer | undefined, k: Reply) => {
    if (!o) return ''
    const first = o.buyer
    const base = (tpl?.body ?? 'Bonjour {{prenom}}, votre offre est bien reçue. Réponse au plus tard {{date}}. {{conseiller}}').replace('{{prenom}}', first).replace('{{date}}', fdate(o.expires, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })).replace('{{conseiller}}', ag.name)
    return {
      ack: base,
      counter: `Bonjour ${first}, merci pour votre offre de ${money(o.amount)} pour ${p.title}. ${dossier.seller} vous propose une contre-offre à ${money(o.counter ?? Math.round((o.amount + ask) / 2 / 5000) * 5000)}, conditions inchangées (${o.conditions.toLowerCase()}). Cette proposition est valable jusqu’au ${fdate(o.expires, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}. ${ag.name}`,
      accept: `Bonjour ${first}, excellente nouvelle : ${dossier.seller} accepte votre offre de ${money(o.counter ?? o.amount)} pour ${p.title}. Je reviens vers vous sous 48 h avec le notaire pour fixer la date du compromis. ${ag.name}`,
      refuse: `Bonjour ${first}, merci pour votre offre sur ${p.title}. Après étude, ${dossier.seller} ne souhaite pas y donner suite en l’état. Je reste à votre disposition si votre projet évolue. ${ag.name}`,
    }[k]
  }
  const [text, setText] = useState<string | null>(null)
  const body = text ?? draftFor(ro, kind)
  const buyerConv = ro && convs.find((c) => c.dossierId === dossier.id && c.title.toLowerCase().includes(ro.buyer.replace(/^(M\.|Mme)\s*(&\s*Mme\s*)?/, '').toLowerCase().split(' ')[0]))
  const sendReply = () => ro && run('send', async () => {
    const via = await consignSend({ conv: buyerConv, text: body, template: 'tpl-offre', outbox, dossierId: dossier.id, code: 'OFFRE', to: ro.buyer, subject: `Votre offre — ${p.title}` })
    toast(`Réponse ${via}`, 'info')
    setText(null)
  })

  const stats = { n: journey.offers.length, top: offers[0]?.counter ?? offers[0]?.amount ?? 0 }
  const prog = stepProgress(dossier, journey).offers
  const urgent = [...active].sort((a, b) => ts(a.expires) - ts(b.expires))[0]
  const next = accepted
    ? { label: `Offre de ${accepted.buyer} acceptée à ${money(accepted.amount)} : préparer le compromis.`, cta: 'Compromis & acte', onClick: () => goTo('closing'), tone: 'sage' as const }
    : urgent ? { label: `Répondre à ${urgent.buyer} avant expiration (${countdown(ts(urgent.expires), now)}).`, hint: `${money(urgent.counter ?? urgent.amount)} · ${gap(urgent.counter ?? urgent.amount).toFixed(1).replace('.', ',')} % vs prix`, cta: 'Rédiger la réponse', onClick: () => { setRid(urgent.id); setText(null); document.getElementById('offer-reply')?.scrollIntoView({ behavior: 'smooth' }) }, tone: ts(urgent.expires) - now < 864e5 ? 'coral' as const : 'gold' as const }
      : { label: 'Aucune offre active : saisir toute proposition écrite reçue.', cta: 'Saisir une offre', onClick: () => setAdding(true) }

  return (
    <>
      <Stagger i={0}>
        <StepHead n={6} kicker="Offres" progress={prog} next={next}
          title={<>Offres & <span className="italic text-champagne-300">négociation</span></>}
          sub={`Prix de présentation ${money(ask)} · honoraires ${journey.mandate.feesPct.toLocaleString('fr-FR')} % charge ${journey.mandate.feesPayer}`}
          aside={<><Pill tone="blue">{stats.n} offre{stats.n > 1 ? 's' : ''}</Pill><Pill tone="gold">{active.length} active{active.length > 1 ? 's' : ''}</Pill>{stats.top > 0 && <Pill>Meilleure {eur(stats.top)}</Pill>}</>} />
      </Stagger>

      <Stagger i={1}>
        <Card title="Offres reçues" kicker="Montant · écart · expiration" action={<SoftBtn tone="gold" icon={<Plus size={14} />} onClick={() => setAdding(true)}>Saisir une offre</SoftBtn>}>
          {offers.length ? (
            <ul className="space-y-3">
              {offers.map((o) => {
                const s = eff(o), live = s === 'reçue' || s === 'contre-offre', left = ts(o.expires) - now
                return (
                  <li key={o.id} className={clsx('rounded-2xl p-4 ring-1', o.status === 'acceptée' ? 'bg-sage/[0.06] ring-sage/25' : 'bg-white/[0.02] ring-white/[0.06]')}>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0"><div className="display whitespace-nowrap text-[2rem] leading-none">{eur(o.amount)}</div><div className={clsx('num mt-1 whitespace-nowrap text-[12px]', gap(o.amount) >= 0 ? 'text-sage' : 'text-coral')}>{gap(o.amount) >= 0 ? '+' : ''}{gap(o.amount).toFixed(1).replace('.', ',')} % vs prix</div></div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[14px]">{o.buyer}<Pill tone={ST[s]}>{s}</Pill>{best?.id === o.id && active.length > 1 && <Pill tone="gold"><Trophy size={11} />Meilleure</Pill>}</div>
                          <div className="mt-1 text-[12px] text-bone/60">{o.conditions}</div>
                          <div className="mt-1 text-[11.5px] text-mist">Reçue le {fdate(o.date)} · financement {o.financing}{o.counter ? ` · contre-offre ${money(o.counter)}` : ''}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-2 md:items-end">
                        {live && <span className={clsx('flex items-center gap-1.5 text-[12.5px]', left < 864e5 ? 'text-coral' : 'text-bone/70')}><Timer size={14} />Expire dans <span className="num">{countdown(ts(o.expires), now)}</span></span>}
                        {s === 'expirée' && <span className="text-[12px] text-mist">Expirée le {fdate(o.expires, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                        <div className="flex flex-wrap gap-1.5">
                          {o.status !== 'acceptée' && o.status !== 'refusée' && <>
                            <SoftBtn tone="gold" icon={<Check size={13} />} onClick={() => accept(o)}>{busy === `a${o.id}` ? '…' : o.counter ? `Accepter ${eur(o.counter)}` : 'Accepter'}</SoftBtn>
                            <SoftBtn icon={<ArrowsLeftRight size={13} />} onClick={() => setCounterOf(o)}>Contre-offre</SoftBtn>
                            <SoftBtn icon={<X size={13} />} onClick={() => refuse(o)}>Refuser</SoftBtn>
                          </>}
                          <button aria-label="Supprimer" onClick={() => remove(o)} className="rounded-full p-2 text-mist hover:bg-coral/10 hover:text-coral"><Trash size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : <Empty title="Aucune offre">Saisissez chaque offre écrite : montant, conditions, financement et date d’expiration.</Empty>}
        </Card>
      </Stagger>

      {active.length > 0 && (
        <Stagger i={2}>
          <Card title="Comparateur d’offres" kicker="Aide à la décision">
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full min-w-[560px] text-[12.5px]">
                <thead><tr className="text-left text-[10.5px] uppercase tracking-eyebrow text-mist"><th className="pb-2 font-normal">Critère</th>{active.map((o) => <th key={o.id} className="pb-2 font-normal">{o.buyer}</th>)}</tr></thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {([
                    ['Montant retenu', (o: Offer) => money(o.counter ?? o.amount)],
                    ['Écart au prix', (o: Offer) => `${gap(o.counter ?? o.amount).toFixed(1).replace('.', ',')} %`],
                    [journey.mandate.feesPayer === 'vendeur' ? 'Net vendeur' : 'Prix net vendeur', (o: Offer) => money(net(o.counter ?? o.amount))],
                    ['Financement', (o: Offer) => `${o.financing} · ${'●'.repeat(SAFE[o.financing])}${'○'.repeat(3 - SAFE[o.financing])}`],
                    ['Conditions', (o: Offer) => o.conditions],
                    ['Expiration', (o: Offer) => countdown(ts(o.expires), now)],
                    ['Score Jaspe', (o: Offer) => <span className={clsx('num', best?.id === o.id ? 'text-champagne-300' : '')}>{score(o)}</span>],
                  ] as const).map(([l, f]) => <tr key={l}><td className="py-2.5 pr-4 text-mist">{l}</td>{active.map((o) => <td key={o.id} className={clsx('py-2.5 pr-4', best?.id === o.id && 'text-bone')}>{f(o)}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11.5px] text-mist">Score = montant (60 %) + sécurité du financement + simplicité des conditions. Indicatif : la décision revient au vendeur.</p>
          </Card>
        </Stagger>
      )}

      {offers.length > 0 && (
        <Stagger i={3}>
          <div id="offer-reply">
            <Card title="Rédiger la réponse" kicker="Modèle tpl-offre">
              <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
                <div className="space-y-4">
                  <Field label="Offre"><Select value={ro?.id} onChange={(e) => { setRid(e.target.value); setText(null) }}>{offers.map((o) => <option key={o.id} value={o.id}>{o.buyer} · {eur(o.amount)}</option>)}</Select></Field>
                  <div><Eyebrow className="mb-1.5">Réponse</Eyebrow><Seg id="reply" value={kind} onChange={(k) => { setKind(k); setText(null) }} items={[{ id: 'ack', label: 'Accusé' }, { id: 'counter', label: 'Contre-offre' }, { id: 'accept', label: 'Acceptation' }, { id: 'refuse', label: 'Refus' }]} /></div>
                  <p className="text-[12px] text-mist">{buyerConv ? `Envoi via la conversation « ${buyerConv.title} » (${buyerConv.channel}).` : 'Aucune conversation liée : envoi par la file e-mail.'} Consigné, connecteur non configuré.</p>
                </div>
                <div>
                  <Textarea rows={7} value={body} onChange={(e) => setText(e.target.value)} />
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <SoftBtn icon={<Copy size={13} />} onClick={() => navigator.clipboard.writeText(body).then(() => toast('Texte copié'), () => toast('Copie impossible', 'error'))}>Copier</SoftBtn>
                    <SoftBtn tone="gold" icon={<PaperPlaneTilt size={13} />} disabled={!body.trim()} onClick={sendReply}>{busy === 'send' ? 'Consignation…' : 'Envoyer'}</SoftBtn>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Stagger>
      )}

      {accepted && (
        <Stagger i={4}>
          <div className="flex flex-col gap-3 rounded-2xl bg-sage/[0.07] p-4 ring-1 ring-sage/20 md:flex-row md:items-center md:justify-between">
            <span className="flex items-center gap-2 text-[13.5px]"><HandCoins size={18} className="text-sage" />Transaction {txs.some((t) => t.dossier === dossier.id) ? 'ouverte' : 'à créer'} pour {accepted.buyer} · {money(accepted.amount)}</span>
            <Link to="/app/transactions" className="inline-flex items-center gap-1.5 text-[12.5px] text-champagne-300 hover:underline">Ouvrir les transactions<ArrowSquareOut size={13} /></Link>
          </div>
        </Stagger>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Nouvelle offre" kicker="Saisie">
        <AsyncForm submitLabel="Enregistrer l’offre" success="Offre enregistrée" onCancel={() => setAdding(false)} onSubmit={addOffer}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Acquéreur"><Input name="buyer" required placeholder="Mme Okafor" /></Field>
            <Field label="Montant (€)" hint={`Prix : ${money(ask)}`}><Input name="amount" type="number" min={0} step={5000} required /></Field>
            <Field label="Financement"><Select name="financing" defaultValue="prêt"><option value="prêt">Prêt</option><option value="mixte">Mixte</option><option value="comptant">Comptant</option></Select></Field>
            <Field label="Expire le"><Input name="expires" type="datetime-local" required defaultValue={`${addDays(todayIso(), 3)}T18:00`} /></Field>
          </div>
          <Field label="Conditions"><Textarea name="conditions" rows={2} placeholder="Prêt 70 %, meubles de jardin inclus" /></Field>
        </AsyncForm>
      </Modal>

      <Modal open={!!counterOf} onClose={() => setCounterOf(null)} title="Contre-offre" kicker={counterOf ? `${counterOf.buyer} · ${money(counterOf.amount)}` : ''} width={460}>
        {counterOf && <AsyncForm key={counterOf.id} submitLabel="Enregistrer la contre-offre" success="Contre-offre enregistrée" onCancel={() => setCounterOf(null)} onSubmit={counter}>
          <Field label="Montant proposé (€)" hint={`Offre ${money(counterOf.amount)} · prix ${money(ask)}`}><Input name="counter" type="number" min={0} step={5000} required defaultValue={counterOf.counter ?? Math.round((counterOf.amount + ask) / 2 / 5000) * 5000} /></Field>
          <Field label="Valable jusqu’au"><Input name="expires" type="datetime-local" defaultValue={counterOf.expires.length > 10 ? counterOf.expires.slice(0, 16) : `${counterOf.expires}T18:00`} /></Field>
        </AsyncForm>}
      </Modal>
    </>
  )
}
