// Factures de commission : préparées depuis une transaction, relues, validées (numéro figé), envoyées (consigné), encaissées.
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { Receipt, CheckCircle, PaperPlaneTilt, Coins, Printer, Trash, FloppyDisk, Sparkle, ArrowRight } from '@phosphor-icons/react'
import { PageHeader, Card, Stat, Stagger, SoftBtn, Empty } from '../ui'
import { Pill } from '../../ui/kit'
import { Paper, Eyebrow } from '../dossier/deliv-kit'
import { useInvoices, useTransactions, useProperties } from '../../data/collections'
import { action } from '../../data/store'
import { TX_STAGES } from '../../data/ops'
import type { Invoice, InvoiceStatus } from '../../data/assist'
import { Modal, Field, Input, Textarea, toast, errText } from '../forms'

const money = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
const fdate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')
const pct = (r: number) => `${(r * 100).toLocaleString('fr-FR')} %`
const TONE: Record<InvoiceStatus, 'neutral' | 'blue' | 'gold' | 'green' | 'red'> = { brouillon: 'neutral', validée: 'blue', envoyée: 'gold', payée: 'green', annulée: 'red' }
/** Étapes où la commission devient facturable (compromis signé → acte). */
const BILLABLE = new Set(['compromis', 'conditions', 'acte'])

export default function Factures() {
  const [invoices, invOps] = useInvoices()
  const [txs] = useTransactions()
  const [props] = useProperties()
  const [sel, setSel] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  const active = useMemo(() => new Set(invoices.filter((i) => i.status !== 'annulée').map((i) => i.txId)), [invoices])
  const toBill = txs.filter((t) => BILLABLE.has(t.stage) && !active.has(t.id))
  const drafts = invoices.filter((i) => i.status === 'brouillon')
  const unpaid = invoices.filter((i) => i.status === 'validée' || i.status === 'envoyée')
  const paid = invoices.filter((i) => i.status === 'payée')
  const sum = (l: Invoice[]) => l.reduce((s, i) => s + i.ttc, 0)
  const sorted = [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const cur = invoices.find((i) => i.id === sel) ?? sorted[0]

  const run = async (key: string, name: string, payload: Record<string, unknown>, ok: string, tone: 'ok' | 'info' = 'ok') => {
    setBusy(key)
    try { const r = await action<Invoice>(name, payload); await invOps.reload(); toast(ok, tone); return r }
    catch (e) { toast(errText(e), 'error') }
    finally { setBusy(null) }
  }

  const prepare = async (txId: string) => {
    const inv = await run(`tx-${txId}`, 'invoice.fromTransaction', { txId }, 'Facture préparée en brouillon : relisez-la avant validation')
    if (inv?.id) setSel(inv.id)
  }
  const cancel = async () => {
    if (!cur) return
    const draft = cur.status === 'brouillon'
    setConfirm(false)
    await run('cancel', 'invoice.cancel', { id: cur.id }, draft ? 'Brouillon supprimé' : 'Facture annulée : émettez un avoir du même montant', draft ? 'ok' : 'info')
    if (draft) setSel(null)
  }
  const txLabel = (txId: string) => {
    const t = txs.find((x) => x.id === txId), p = t && props.find((x) => x.id === t.propertyId)
    return p ? `${p.title} · ${p.city}` : t ? `${t.seller} → ${t.buyer}` : 'Transaction'
  }

  return (
    <>
      <style>{`@media print { body > *:not(#invoice-print) { display: none !important; } #invoice-print { display: block !important; } @page { margin: 14mm; } }`}</style>
      <div className="print:hidden">
        <PageHeader kicker="Commissions" title="Factures & commissions" sub="Préparez la facture depuis la transaction, relisez-la, validez-la pour figer son numéro, puis suivez l’envoi et l’encaissement." />

        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          <Stagger i={0}><Stat label="À facturer" value={toBill.length} hint="Compromis ou acte sans facture" /></Stagger>
          <Stagger i={1}><Stat label="En brouillon" value={drafts.length} hint={drafts.length ? `${money(sum(drafts))} TTC à relire` : 'Rien à relire'} /></Stagger>
          <Stagger i={2}><Stat label="Envoyées non payées" value={<span className="text-[1.7rem] md:text-[2.1rem]">{money(sum(unpaid))}</span>} hint={`${unpaid.length} facture${unpaid.length > 1 ? 's' : ''} TTC`} /></Stagger>
          <Stagger i={3}><Stat label="Encaissé" value={<span className="text-[1.7rem] md:text-[2.1rem]">{money(sum(paid))}</span>} hint={`${paid.length} facture${paid.length > 1 ? 's' : ''} payée${paid.length > 1 ? 's' : ''}`} /></Stagger>
        </div>

        <Stagger i={4} className="mt-6">
          <Card title="À facturer" kicker="Transactions">
            {toBill.length === 0
              ? <p className="text-[13px] text-bone/50">Aucune transaction en compromis ou à l’acte sans facture.</p>
              : <ul className="divide-y divide-white/[0.06]">
                  {toBill.map((t) => (
                    <li key={t.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="truncate text-[14px]">{txLabel(t.id)}</div>
                        <div className="mt-0.5 text-[12px] text-mist">{TX_STAGES.find((s) => s.id === t.stage)?.label} · {t.seller} → {t.buyer} · honoraires {money(t.fees)} à la charge {t.feePayer === 'vendeur' ? 'du vendeur' : 'de l’acquéreur'}</div>
                      </div>
                      <SoftBtn tone="gold" icon={<Sparkle size={13} />} disabled={!!busy} onClick={() => prepare(t.id)}>{busy === `tx-${t.id}` ? 'Préparation…' : 'Préparer la facture'}</SoftBtn>
                    </li>
                  ))}
                </ul>}
          </Card>
        </Stagger>
      </div>

      {sorted.length === 0
        ? <div className="mt-6 print:hidden"><Empty title="Aucune facture">Préparez une première facture depuis une transaction ci-dessus ou depuis la page Transactions.</Empty></div>
        : (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Stagger i={5} className="print:hidden lg:col-span-4">
              <Card title="Factures" kicker={`${sorted.length} au total`} pad={false}>
                <ul className="max-h-[560px] overflow-y-auto px-2 pb-2">
                  {sorted.map((i) => (
                    <li key={i.id}>
                      <button onClick={() => setSel(i.id)} className={clsx('w-full rounded-xl px-3 py-3 text-left transition-colors', cur?.id === i.id ? 'bg-white/[0.07] ring-1 ring-white/10' : 'hover:bg-white/[0.04]')}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={clsx('num text-[13px]', !i.number && 'italic text-bone/55')}>{i.number ?? 'brouillon'}</span>
                          <Pill tone={TONE[i.status]}>{i.status}</Pill>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between gap-2 text-[12.5px]">
                          <span className="truncate text-bone/70">{i.client}</span>
                          <span className="num shrink-0">{money(i.ttc)}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            </Stagger>
            {cur && <InvoiceView key={cur.id} inv={cur} busy={busy} txLabel={txLabel(cur.txId)} run={run} onCancel={() => setConfirm(true)} />}
          </div>
        )}

      <Modal open={confirm && !!cur} onClose={() => setConfirm(false)} kicker="Confirmation" title={cur?.status === 'brouillon' ? 'Supprimer le brouillon ?' : `Annuler la facture ${cur?.number ?? ''} ?`}>
        <p className="text-[13.5px] leading-relaxed text-bone/70">
          {cur?.status === 'brouillon'
            ? 'Le brouillon sera supprimé. Vous pourrez en préparer un nouveau depuis la transaction.'
            : 'Une facture validée ne se supprime pas : elle passe au statut « annulée » et son numéro reste réservé. Émettez ensuite un avoir du même montant.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <SoftBtn onClick={() => setConfirm(false)}>Revenir</SoftBtn>
          <SoftBtn tone="light" icon={<Trash size={13} />} onClick={cancel}>{cur?.status === 'brouillon' ? 'Supprimer' : 'Annuler la facture'}</SoftBtn>
        </div>
      </Modal>
    </>
  )
}

function InvoiceView({ inv, busy, txLabel, run, onCancel }: {
  inv: Invoice; busy: string | null; txLabel: string; onCancel: () => void
  run: (key: string, name: string, payload: Record<string, unknown>, ok: string, tone?: 'ok' | 'info') => Promise<Invoice | undefined>
}) {
  const draft = inv.status === 'brouillon'
  const [form, setForm] = useState({ client: inv.client, object: inv.object, due: inv.due, ht: String(inv.ht) })
  useEffect(() => { setForm({ client: inv.client, object: inv.object, due: inv.due, ht: String(inv.ht) }) }, [inv.client, inv.object, inv.due, inv.ht])
  const htNum = Number(form.ht.replace(/\s/g, '').replace(',', '.'))
  const dirty = draft && (form.client !== inv.client || form.object !== inv.object || form.due !== inv.due || htNum !== inv.ht)
  const validHt = Number.isFinite(htNum) && htNum > 0
  // Aperçu en direct pendant la saisie du brouillon.
  const ht = draft && validHt ? htNum : inv.ht
  const vat = draft && validHt ? Math.round(ht * inv.vatRate * 100) / 100 : inv.vat
  const ttc = draft && validHt ? Math.round((ht + vat) * 100) / 100 : inv.ttc
  const v = draft ? form : inv
  const pt = inv.country === 'PT'

  const save = () => {
    if (!validHt) { toast('Montant HT invalide', 'error'); return }
    if (!form.client.trim()) { toast('Indiquez le client facturé', 'error'); return }
    run('save', 'invoice.update', { id: inv.id, client: form.client.trim(), object: form.object.trim(), due: form.due.trim(), ht: htNum }, 'Brouillon enregistré')
  }
  const print = () => { toast('Impression lancée', 'info'); setTimeout(() => window.print(), 50) }

  return (
    <>
      <Stagger i={6} className="space-y-6 lg:col-span-8">
        <div className="print:hidden">
          <Card title={inv.number ?? 'Brouillon de facture'} kicker={txLabel} action={<Pill tone={TONE[inv.status]}>{inv.status}</Pill>}>
            {draft && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Client facturé"><Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} /></Field>
                <Field label="Montant HT (€)" hint={`TVA ${pct(inv.vatRate)} recalculée`}><Input inputMode="decimal" value={form.ht} onChange={(e) => setForm({ ...form, ht: e.target.value })} /></Field>
                <Field label="Objet" className="sm:col-span-2"><Textarea rows={2} value={form.object} onChange={(e) => setForm({ ...form, object: e.target.value })} /></Field>
                <Field label="Échéance" className="sm:col-span-2"><Input value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} /></Field>
              </div>
            )}
            {!draft && (
              <div className="space-y-1 text-[12.5px] text-bone/60">
                {inv.validatedAt && <div>Validée le {fdate(inv.validatedAt)} · numéro figé, la facture ne se modifie plus.</div>}
                {inv.sentAt && <div>Envoyée le {fdate(inv.sentAt)}{inv.sendNote ? ` · ${inv.sendNote}` : ''}</div>}
                {inv.paidAt && <div className="text-sage">Encaissée le {fdate(inv.paidAt)}</div>}
                {inv.cancelNote && <div className="text-coral">{inv.cancelNote}</div>}
              </div>
            )}
            <div className={clsx('flex flex-wrap gap-2', draft ? 'mt-5' : 'mt-4')}>
              {draft && <SoftBtn icon={<FloppyDisk size={13} />} disabled={!dirty || !!busy} onClick={save}>{busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}</SoftBtn>}
              {draft && <SoftBtn tone="gold" icon={<CheckCircle size={13} />} disabled={dirty || !!busy} onClick={() => run('validate', 'invoice.validate', { id: inv.id }, 'Facture validée : numéro attribué')}>{busy === 'validate' ? 'Validation…' : 'Valider'}</SoftBtn>}
              {inv.status === 'validée' && <SoftBtn tone="gold" icon={<PaperPlaneTilt size={13} />} disabled={!!busy} onClick={() => run('send', 'invoice.send', { id: inv.id }, 'Envoi consigné (connecteur e-mail non configuré)', 'info')}>{busy === 'send' ? 'Envoi…' : 'Envoyer'}</SoftBtn>}
              {(inv.status === 'validée' || inv.status === 'envoyée') && <SoftBtn tone={inv.status === 'envoyée' ? 'gold' : 'ghost'} icon={<Coins size={13} />} disabled={!!busy} onClick={() => run('paid', 'invoice.paid', { id: inv.id }, 'Commission encaissée')}>{busy === 'paid' ? 'Mise à jour…' : 'Marquer payée'}</SoftBtn>}
              <SoftBtn icon={<Printer size={13} />} onClick={print}>Imprimer / PDF</SoftBtn>
              {inv.status !== 'annulée' && inv.status !== 'payée' && <SoftBtn icon={<Trash size={13} />} disabled={!!busy} onClick={onCancel}>{draft ? 'Supprimer le brouillon' : 'Annuler'}</SoftBtn>}
            </div>
            {draft && dirty && <p className="mt-2 text-[11.5px] text-mist">Enregistrez les modifications avant de valider.</p>}
          </Card>
        </div>

        <InvoicePaper inv={inv} v={v} ht={ht} vat={vat} ttc={ttc} />
        {createPortal(<div id="invoice-print" className="hidden"><InvoicePaper inv={inv} v={v} ht={ht} vat={vat} ttc={ttc} print /></div>, document.body)}
        {pt && <p className="flex items-center gap-1.5 text-[11.5px] text-mist print:hidden"><ArrowRight size={11} />Portugal : ce document prépare la facture, à émettre dans un logiciel certifié AT.</p>}
        {!pt && <p className="flex items-center gap-1.5 text-[11.5px] text-mist print:hidden"><Receipt size={12} />Montants calculés sur les honoraires TTC de la transaction (TVA 20 %).</p>}
      </Stagger>
    </>
  )
}

function InvoicePaper({ inv, v, ht, vat, ttc, print }: { inv: Invoice; v: { client: string; object: string; due: string }; ht: number; vat: number; ttc: number; print?: boolean }) {
  const pt = inv.country === 'PT'
  return (
          <Paper className={clsx('p-5 md:p-8', print && '!rounded-none !shadow-none')}>
            <div className="flex flex-col gap-3 border-b border-ink/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="font-serif text-2xl italic">{inv.issuer.name}</div>
                <p className="mt-1 max-w-sm font-sans text-[11.5px] leading-relaxed text-ink/55">{inv.issuer.legal}</p>
              </div>
              <div className="font-sans sm:text-right">
                <div className="text-[10.5px] uppercase tracking-eyebrow text-ink/50">{pt ? 'Documento de preparação' : 'Facture'}</div>
                <div className={clsx('num mt-1 text-[15px]', !inv.number && 'italic text-ink/50')}>{inv.number ?? 'Brouillon — numéro attribué à la validation'}</div>
                <div className="mt-1 text-[11.5px] text-ink/55">Date : {fdate(inv.validatedAt ?? inv.createdAt)}</div>
              </div>
            </div>

            {inv.status === 'annulée' && <div className="mt-4 rounded-lg bg-coral/10 px-3 py-2 font-sans text-[12px] text-coral">ANNULÉE — {inv.cancelNote ?? 'émettre un avoir du même montant'}</div>}

            <div className="mt-5 grid gap-5 text-[13px] leading-relaxed text-ink/80 sm:grid-cols-2">
              <div><Eyebrow className="!text-ink/50">Facturé à</Eyebrow><p className="mt-1">{v.client}<br /><span className="text-ink/55">{inv.payerRole === 'vendeur' ? 'Vendeur' : 'Acquéreur'}, débiteur des honoraires</span></p></div>
              <div><Eyebrow className="!text-ink/50">Échéance</Eyebrow><p className="mt-1">{v.due}</p></div>
              <div className="sm:col-span-2"><Eyebrow className="!text-ink/50">Objet</Eyebrow><p className="mt-1">{v.object}</p></div>
            </div>

            <table className="mt-6 w-full font-sans text-[13px] text-ink/80">
              <tbody>
                <tr className="border-t border-ink/10"><td className="py-2">Prix de vente</td><td className="num py-2 text-right text-ink/55">{money(inv.price)}</td></tr>
                <tr className="border-t border-ink/10"><td className="py-2">Honoraires HT</td><td className="num py-2 text-right">{money(ht)}</td></tr>
                <tr className="border-t border-ink/10"><td className="py-2">{pt ? 'IVA' : 'TVA'} {pct(inv.vatRate)}</td><td className="num py-2 text-right">{money(vat)}</td></tr>
                <tr className="border-y border-ink/20 font-medium text-ink"><td className="py-2.5">Total TTC</td><td className="num py-2.5 text-right text-[15px]">{money(ttc)}</td></tr>
              </tbody>
            </table>

            {inv.split.length > 0 && (
              <div className="mt-6">
                <Eyebrow className="!text-ink/50">Répartition entre agences (sur HT)</Eyebrow>
                <ul className="mt-2 space-y-1 font-sans text-[12.5px] text-ink/75">
                  {inv.split.map((s) => (
                    <li key={s.agency} className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0">{s.agency}{s.role ? <span className="text-ink/50"> · {s.role}</span> : null} <span className="text-ink/50">({s.pct.toLocaleString('fr-FR')} %)</span></span>
                      <span className="num shrink-0">{money(Math.round(ht * s.pct) / 100)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 border-t border-ink/10 pt-4 font-sans text-[11px] leading-relaxed text-ink/55">
              {inv.mentions.map((m) => <p key={m} className="mt-1 first:mt-0">{m}</p>)}
            </div>
          </Paper>
  )
}
