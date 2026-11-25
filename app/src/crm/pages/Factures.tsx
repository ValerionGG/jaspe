// Factures de commission : préparées depuis une transaction (modèle agence ou mandataire), relues, validées (numéro figé),
// puis émises par un logiciel certifié (InvoiceXpress au Portugal) ou exportées en Factur-X (France), envoyées, encaissées.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { Receipt, CheckCircle, PaperPlaneTilt, Coins, Printer, Trash, FloppyDisk, Sparkle, ArrowRight, DownloadSimple, SealCheck, GearSix, ArrowSquareOut, Lock } from '@phosphor-icons/react'
import { PageHeader, Card, Stat, Stagger, SoftBtn, Empty } from '../ui'
import { Pill } from '../../ui/kit'
import { Paper, Eyebrow } from '../dossier/deliv-kit'
import { useInvoices, useTransactions, useProperties } from '../../data/collections'
import { action } from '../../data/store'
import { TX_STAGES } from '../../data/ops'
import type { Invoice, InvoiceStatus, InvoiceTemplate, InvoicingConnector, BillingParty } from '../../data/assist'
import { Modal, Field, Input, Textarea, Select, AsyncForm, toast, errText } from '../forms'

const money = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
const fdate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—')
const pct = (r: number) => `${(r * 100).toLocaleString('fr-FR')} %`
const TONE: Record<InvoiceStatus, 'neutral' | 'blue' | 'gold' | 'green' | 'red'> = { brouillon: 'neutral', validée: 'blue', envoyée: 'gold', payée: 'green', annulée: 'red' }
/** Étapes où la commission devient facturable (compromis signé → acte). */
const BILLABLE = new Set(['compromis', 'conditions', 'acte'])
const TEMPLATES: { id: InvoiceTemplate; label: string; hint: string }[] = [
  { id: 'agence', label: 'Agence → client', hint: 'Honoraires facturés au vendeur ou à l’acquéreur' },
  { id: 'mandataire', label: 'Mandataire → réseau', hint: 'L’agent commercial facture sa quote-part au réseau ou à l’agence' },
]
const AGENT_ROLE = /mandataire|agent|conseill|consultor/i
type Conn = InvoicingConnector | 'off' | null
const isIssued = (inv: Invoice) => !!inv.legal?.issuedAt && (inv.legal.provider === 'facturx' || inv.legal.state === 'final')

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/xml' }))
  const a = document.createElement('a'); a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function Factures() {
  const [invoices, invOps] = useInvoices()
  const [txs] = useTransactions()
  const [props] = useProperties()
  const [sel, setSel] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [tpl, setTpl] = useState<InvoiceTemplate>('agence')
  const [shares, setShares] = useState<Record<string, string>>({})
  const [conn, setConn] = useState<Conn>(null)
  const [billing, setBilling] = useState(false)

  const loadConn = useCallback(async () => {
    try { setConn(await action<InvoicingConnector>('invoice.connector')) } catch { setConn('off') }
  }, [])
  useEffect(() => { loadConn() }, [loadConn])

  const active = useMemo(() => new Set(invoices.filter((i) => i.status !== 'annulée').map((i) => `${i.txId}:${i.template ?? 'agence'}`)), [invoices])
  const toBill = txs.filter((t) => BILLABLE.has(t.stage) && !active.has(`${t.id}:${tpl}`))
  const drafts = invoices.filter((i) => i.status === 'brouillon')
  const unpaid = invoices.filter((i) => i.status === 'validée' || i.status === 'envoyée')
  const paid = invoices.filter((i) => i.status === 'payée')
  const sum = (l: Invoice[]) => l.reduce((s, i) => s + i.ttc, 0)
  const sorted = [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const cur = invoices.find((i) => i.id === sel) ?? sorted[0]
  const defaultShare = (txId: string) => { const t = txs.find((x) => x.id === txId); return (t?.split.find((x) => AGENT_ROLE.test(x.role ?? '')) ?? t?.split[0])?.pct ?? 100 }

  const run = async (key: string, name: string, payload: Record<string, unknown>, ok: string, tone: 'ok' | 'info' = 'ok') => {
    setBusy(key)
    try { const r = await action<Invoice>(name, payload); await invOps.reload(); toast(ok, tone); return r }
    catch (e) { toast(errText(e), 'error') }
    finally { setBusy(null) }
  }

  const prepare = async (txId: string) => {
    const share = Number(String(shares[txId] ?? defaultShare(txId)).replace(',', '.'))
    if (tpl === 'mandataire' && !(share > 0 && share <= 100)) { toast('Quote-part du mandataire : entre 0 et 100 %', 'error'); return }
    const inv = await run(`tx-${txId}`, 'invoice.fromTransaction', { txId, template: tpl, ...(tpl === 'mandataire' ? { agentShare: share } : {}) }, 'Facture préparée en brouillon : relisez-la avant validation')
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
  const c = conn && conn !== 'off' ? conn : null

  return (
    <>
      <style>{`@media print { body > *:not(#invoice-print) { display: none !important; } #invoice-print { display: block !important; } @page { margin: 14mm; } }`}</style>
      <div className="print:hidden">
        <PageHeader kicker="Commissions" title="Factures & commissions" sub="Jaspe prépare, un logiciel certifié émet : préparez la facture depuis la transaction, validez-la, puis émettez-la via InvoiceXpress (Portugal) ou exportez le Factur-X (France) avant de suivre l’encaissement." />

        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          <Stagger i={0}><Stat label="À facturer" value={toBill.length} hint={tpl === 'agence' ? 'Compromis ou acte sans facture agence' : 'Sans facture mandataire'} /></Stagger>
          <Stagger i={1}><Stat label="En brouillon" value={drafts.length} hint={drafts.length ? `${money(sum(drafts))} TTC à relire` : 'Rien à relire'} /></Stagger>
          <Stagger i={2}><Stat label="Envoyées non payées" value={<span className="text-[1.7rem] md:text-[2.1rem]">{money(sum(unpaid))}</span>} hint={`${unpaid.length} facture${unpaid.length > 1 ? 's' : ''} TTC`} /></Stagger>
          <Stagger i={3}><Stat label="Encaissé" value={<span className="text-[1.7rem] md:text-[2.1rem]">{money(sum(paid))}</span>} hint={`${paid.length} facture${paid.length > 1 ? 's' : ''} payée${paid.length > 1 ? 's' : ''}`} /></Stagger>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Stagger i={4} className="lg:col-span-8">
            <Card title="À facturer" kicker="Transactions">
              <div role="radiogroup" aria-label="Modèle de facture" className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TEMPLATES.map((t) => (
                  <button key={t.id} role="radio" aria-checked={tpl === t.id} onClick={() => setTpl(t.id)}
                    className={clsx('min-w-0 rounded-xl px-3.5 py-2.5 text-left ring-1 transition-colors', tpl === t.id ? 'bg-white/[0.07] ring-champagne/60' : 'ring-white/[0.08] hover:bg-white/[0.04]')}>
                    <div className="text-[13px] font-medium">{t.label}</div>
                    <div className="mt-0.5 text-[11.5px] leading-snug text-mist">{t.hint}</div>
                  </button>
                ))}
              </div>
              {toBill.length === 0
                ? <p className="text-[13px] text-bone/50">Aucune transaction en compromis ou à l’acte sans facture {tpl === 'agence' ? 'agence' : 'mandataire'}.</p>
                : <ul className="divide-y divide-white/[0.06]">
                    {toBill.map((t) => (
                      <li key={t.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="truncate text-[14px]">{txLabel(t.id)}</div>
                          <div className="mt-0.5 text-[12px] text-mist">{TX_STAGES.find((s) => s.id === t.stage)?.label} · {t.seller} → {t.buyer} · honoraires {money(t.fees)} à la charge {t.feePayer === 'vendeur' ? 'du vendeur' : 'de l’acquéreur'}</div>
                          {tpl === 'mandataire' && t.split.length > 0 && <div className="mt-0.5 text-[11.5px] text-mist/80">Répartition : {t.split.map((s) => `${s.agency} ${s.pct} %`).join(' · ')}</div>}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {tpl === 'mandataire' && (
                            <label className="flex items-center gap-1.5 text-[12px] text-mist">
                              <span className="sr-only">Quote-part du mandataire en %</span>
                              <Input inputMode="decimal" aria-label="Quote-part du mandataire en %" className="!w-[4.5rem] !py-1.5 text-right" value={shares[t.id] ?? String(defaultShare(t.id))} onChange={(e) => setShares({ ...shares, [t.id]: e.target.value })} />%
                            </label>
                          )}
                          <SoftBtn tone="gold" icon={<Sparkle size={13} />} disabled={!!busy} onClick={() => prepare(t.id)}>{busy === `tx-${t.id}` ? 'Préparation…' : 'Préparer'}</SoftBtn>
                        </div>
                      </li>
                    ))}
                  </ul>}
            </Card>
          </Stagger>
          <Stagger i={5} className="lg:col-span-4">
            <ConnectorCard conn={conn} onSettings={() => setBilling(true)} />
          </Stagger>
        </div>
      </div>

      {sorted.length === 0
        ? <div className="mt-6 print:hidden"><Empty title="Aucune facture">Préparez une première facture depuis une transaction ci-dessus ou depuis la page Transactions.</Empty></div>
        : (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Stagger i={6} className="print:hidden lg:col-span-4">
              <Card title="Factures" kicker={`${sorted.length} au total`} pad={false}>
                <ul className="max-h-[560px] overflow-y-auto px-2 pb-2">
                  {sorted.map((i) => (
                    <li key={i.id}>
                      <button onClick={() => setSel(i.id)} className={clsx('w-full rounded-xl px-3 py-3 text-left transition-colors', cur?.id === i.id ? 'bg-white/[0.07] ring-1 ring-white/10' : 'hover:bg-white/[0.04]')}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={clsx('num min-w-0 truncate text-[13px]', !i.number && 'italic text-bone/55')}>{i.legal?.legalNumber && i.legal.provider === 'invoicexpress' ? i.legal.legalNumber : i.number ?? 'brouillon'}</span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            {isIssued(i) && <SealCheck size={14} className="text-sage" aria-label="Émise" />}
                            <Pill tone={TONE[i.status]}>{i.status}</Pill>
                          </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between gap-2 text-[12.5px]">
                          <span className="truncate text-bone/70">{i.template === 'mandataire' ? 'Mandataire → ' : ''}{i.client}</span>
                          <span className="num shrink-0">{money(i.ttc)}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            </Stagger>
            {cur && <InvoiceView key={cur.id} inv={cur} busy={busy} conn={c} txLabel={txLabel(cur.txId)} run={run} setBusy={setBusy} onCancel={() => setConfirm(true)} />}
          </div>
        )}

      <Modal open={confirm && !!cur} onClose={() => setConfirm(false)} kicker="Confirmation" title={cur?.status === 'brouillon' ? 'Supprimer le brouillon ?' : `Annuler la facture ${cur?.number ?? ''} ?`}>
        <p className="text-[13.5px] leading-relaxed text-bone/70">
          {cur?.status === 'brouillon'
            ? 'Le brouillon sera supprimé. Vous pourrez en préparer un nouveau depuis la transaction.'
            : cur && isIssued(cur)
              ? 'Cette facture a été émise par un logiciel certifié : l’annulation dans Jaspe ne l’annule pas chez l’éditeur. Annulez-la ou émettez l’avoir dans InvoiceXpress ou via votre plateforme.'
              : 'Une facture validée ne se supprime pas : elle passe au statut « annulée » et son numéro reste réservé. Émettez ensuite un avoir du même montant.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <SoftBtn onClick={() => setConfirm(false)}>Revenir</SoftBtn>
          <SoftBtn tone="light" icon={<Trash size={13} />} onClick={cancel}>{cur?.status === 'brouillon' ? 'Supprimer' : 'Annuler la facture'}</SoftBtn>
        </div>
      </Modal>

      <Modal open={billing} onClose={() => setBilling(false)} kicker="Émission" title="Coordonnées de facturation" width={680}>
        <BillingForm settings={c?.settings ?? {}} onDone={async () => { await loadConn(); setBilling(false) }} />
      </Modal>
    </>
  )
}

function ConnectorCard({ conn, onSettings }: { conn: Conn; onSettings: () => void }) {
  if (conn === null) return <Card title="Émission" kicker="Connecteurs"><p className="text-[13px] text-mist">Lecture de l’état du connecteur…</p></Card>
  if (conn === 'off') return <Card title="Émission" kicker="Connecteurs"><p className="text-[13px] text-mist">État du connecteur indisponible : le module d’émission n’est pas branché sur ce serveur.</p></Card>
  const pt = conn.country === 'PT'
  return (
    <Card title="Émission" kicker={pt ? 'Portugal · logiciel certifié AT' : 'France · facturation électronique'}>
      {pt ? (
        <div className="space-y-2 text-[12.5px] leading-relaxed text-bone/70">
          <div className="flex flex-wrap items-center gap-2"><span className="text-[13px] text-bone">InvoiceXpress</span><Pill tone={conn.invoicexpress.configured ? 'green' : 'neutral'}>{conn.invoicexpress.configured ? 'configuré' : 'non configuré'}</Pill></div>
          {conn.invoicexpress.configured && conn.invoicexpress.account && <p className="text-mist">Compte : <span className="num break-all">{conn.invoicexpress.account}</span></p>}
          <p className="text-mist">{conn.invoicexpress.note}</p>
        </div>
      ) : (
        <div className="space-y-2 text-[12.5px] leading-relaxed text-bone/70">
          <div className="flex flex-wrap items-center gap-2"><span className="text-[13px] text-bone">{conn.facturx.profile}</span><Pill tone="blue">fichier</Pill></div>
          <p className="text-mist">{conn.facturx.note}</p>
        </div>
      )}
      <div className="mt-4"><SoftBtn icon={<GearSix size={13} />} onClick={onSettings}>Coordonnées de facturation</SoftBtn></div>
    </Card>
  )
}

function BillingForm({ settings, onDone }: { settings: InvoicingConnector['settings']; onDone: () => Promise<void> }) {
  const f = (group: 'seller' | 'agent' | 'network', key: keyof BillingParty, label: string, extra: { hint?: string; className?: string } = {}) => (
    <Field label={label} hint={extra.hint} className={extra.className}><Input name={`${group}.${key}`} defaultValue={String(settings[group]?.[key] ?? '')} maxLength={200} /></Field>
  )
  return (
    <AsyncForm submitLabel="Enregistrer" success="Coordonnées de facturation enregistrées" onSubmit={async (v) => {
      const out: Record<string, Record<string, string>> = {}
      for (const [k, val] of Object.entries(v)) { const [g, f2] = k.split('.'); (out[g] ??= {})[f2] = val }
      await action('invoice.settings', out)
      await onDone()
    }}>
      <p className="text-[12.5px] leading-relaxed text-mist">Ces informations alimentent les mentions légales, le Factur-X et la création du client chez InvoiceXpress. Laissez vide ce qui ne vous concerne pas.</p>
      <fieldset className="space-y-3">
        <legend className="mb-2 text-[11px] uppercase tracking-eyebrow text-mist">Agence (modèle agence → client)</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {f('seller', 'name', 'Raison sociale')}{f('seller', 'siren', 'SIREN', { hint: '9 chiffres' })}
          {f('seller', 'vatId', 'N° TVA intracommunautaire')}{f('seller', 'nif', 'NIF (Portugal)')}
          {f('seller', 'address', 'Adresse', { className: 'sm:col-span-2' })}{f('seller', 'postcode', 'Code postal')}{f('seller', 'city', 'Ville')}
        </div>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="mb-2 text-[11px] uppercase tracking-eyebrow text-mist">Mandataire / consultor (émetteur)</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {f('agent', 'name', 'Nom')}{f('agent', 'rsac', 'RSAC', { hint: 'Ville et numéro d’immatriculation' })}
          {f('agent', 'siren', 'SIREN')}{f('agent', 'vatId', 'N° TVA (si assujetti)')}
          <Field label="Régime de TVA (France)"><Select name="agent.vatRegime" defaultValue={settings.agent?.vatRegime ?? ''}><option value="">À confirmer (franchise par défaut)</option><option value="franchise">Franchise en base (art. 293 B du CGI)</option><option value="assujetti">Assujetti, TVA 20 %</option></Select></Field>
          <Field label="Regime de IVA (Portugal)"><Select name="agent.ptVatRegime" defaultValue={settings.agent?.ptVatRegime ?? ''}><option value="">A confirmar (isenção por defeito)</option><option value="isencao53">Isenção, art. 53.º do CIVA</option><option value="normal">IVA à taxa normal (23 %)</option></Select></Field>
          {f('agent', 'nif', 'NIF (Portugal)')}{f('agent', 'address', 'Adresse')}{f('agent', 'postcode', 'Code postal')}{f('agent', 'city', 'Ville')}
        </div>
      </fieldset>
      <fieldset className="space-y-3">
        <legend className="mb-2 text-[11px] uppercase tracking-eyebrow text-mist">Réseau / agence mandante (facturé par le mandataire)</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {f('network', 'name', 'Nom')}{f('network', 'siren', 'SIREN')}{f('network', 'vatId', 'N° TVA')}{f('network', 'nif', 'NIF (Portugal)')}
          {f('network', 'address', 'Adresse', { className: 'sm:col-span-2' })}{f('network', 'postcode', 'Code postal')}{f('network', 'city', 'Ville')}
        </div>
      </fieldset>
    </AsyncForm>
  )
}

function InvoiceView({ inv, busy, conn, txLabel, run, setBusy, onCancel }: {
  inv: Invoice; busy: string | null; conn: InvoicingConnector | null; txLabel: string; onCancel: () => void; setBusy: (k: string | null) => void
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
  const issued = isIssued(inv)
  const canIssue = !draft && inv.status !== 'annulée' && !issued
  const ixReady = !!conn?.invoicexpress.configured

  const save = () => {
    if (!validHt) { toast('Montant HT invalide', 'error'); return }
    if (!form.client.trim()) { toast('Indiquez le client facturé', 'error'); return }
    run('save', 'invoice.update', { id: inv.id, client: form.client.trim(), object: form.object.trim(), due: form.due.trim(), ht: htNum }, 'Brouillon enregistré')
  }
  const print = () => { toast('Impression lancée', 'info'); setTimeout(() => window.print(), 50) }
  const facturx = async () => {
    setBusy('fx')
    try {
      const r = await action<{ xml: string; filename: string; missing: string[] }>('invoice.facturx', { id: inv.id })
      download(r.filename, r.xml)
      if (r.missing.length) toast(`Factur-X téléchargé, mais incomplet : ${r.missing.join(', ')}`, 'info')
      else toast('Factur-X téléchargé : à joindre via votre plateforme agréée', 'ok')
    } catch (e) { toast(errText(e), 'error') }
    finally { setBusy(null) }
  }

  return (
    <>
      <Stagger i={7} className="min-w-0 space-y-6 lg:col-span-8">
        <div className="print:hidden">
          <Card title={inv.legal?.provider === 'invoicexpress' && inv.legal.legalNumber ? inv.legal.legalNumber : inv.number ?? 'Brouillon de facture'} kicker={`${inv.template === 'mandataire' ? 'Mandataire → réseau' : 'Agence → client'} · ${txLabel}`} action={<Pill tone={TONE[inv.status]}>{inv.status}</Pill>}>
            {draft && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={inv.template === 'mandataire' ? 'Réseau / agence facturé(e)' : 'Client facturé'}><Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} /></Field>
                <Field label="Montant HT (€)" hint={inv.vatRate > 0 ? `TVA ${pct(inv.vatRate)} recalculée` : 'Sans TVA (régime d’exonération)'}><Input inputMode="decimal" value={form.ht} onChange={(e) => setForm({ ...form, ht: e.target.value })} /></Field>
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
            {inv.regimeToConfirm && <p className="mt-3 rounded-lg bg-champagne/10 px-3 py-2 text-[12px] text-bone/80 ring-1 ring-champagne/25">Régime de TVA à confirmer : réglez-le dans « Coordonnées de facturation » avant validation.</p>}
            <LegalBlock inv={inv} />
            <div className={clsx('flex flex-wrap gap-2', draft ? 'mt-5' : 'mt-4')}>
              {draft && <SoftBtn icon={<FloppyDisk size={13} />} disabled={!dirty || !!busy} onClick={save}>{busy === 'save' ? 'Enregistrement…' : 'Enregistrer'}</SoftBtn>}
              {draft && <SoftBtn tone="gold" icon={<CheckCircle size={13} />} disabled={dirty || !!busy} onClick={() => run('validate', 'invoice.validate', { id: inv.id }, 'Facture validée : numéro attribué')}>{busy === 'validate' ? 'Validation…' : 'Valider'}</SoftBtn>}
              {pt && canIssue && <SoftBtn tone="gold" icon={<SealCheck size={13} />} disabled={!ixReady || !!busy} onClick={() => run('issue', 'invoice.issue', { id: inv.id }, 'Facture émise via InvoiceXpress : numéro légal et ATCUD reçus')}>{busy === 'issue' ? 'Émission…' : inv.legal?.state === 'draft' ? 'Finaliser via InvoiceXpress' : 'Émettre via InvoiceXpress'}</SoftBtn>}
              {!pt && !draft && inv.status !== 'annulée' && <SoftBtn tone={issued ? 'gold' : 'ghost'} icon={<DownloadSimple size={13} />} disabled={!!busy} onClick={facturx}>{busy === 'fx' ? 'Préparation…' : 'Télécharger le Factur-X'}</SoftBtn>}
              {!pt && canIssue && <SoftBtn tone="gold" icon={<Lock size={13} />} disabled={!!busy} onClick={() => run('issue', 'invoice.issue', { id: inv.id }, 'Factur-X figé : à déposer sur votre plateforme agréée')}>{busy === 'issue' ? 'Génération…' : 'Figer le Factur-X'}</SoftBtn>}
              {inv.status === 'validée' && <SoftBtn icon={<PaperPlaneTilt size={13} />} disabled={!!busy} onClick={() => run('send', 'invoice.send', { id: inv.id }, 'Envoi consigné (connecteur e-mail non configuré)', 'info')}>{busy === 'send' ? 'Envoi…' : 'Envoyer'}</SoftBtn>}
              {(inv.status === 'validée' || inv.status === 'envoyée') && <SoftBtn tone={inv.status === 'envoyée' ? 'gold' : 'ghost'} icon={<Coins size={13} />} disabled={!!busy} onClick={() => run('paid', 'invoice.paid', { id: inv.id }, 'Commission encaissée')}>{busy === 'paid' ? 'Mise à jour…' : 'Marquer payée'}</SoftBtn>}
              <SoftBtn icon={<Printer size={13} />} onClick={print}>Imprimer / PDF</SoftBtn>
              {inv.status !== 'annulée' && inv.status !== 'payée' && <SoftBtn icon={<Trash size={13} />} disabled={!!busy} onClick={onCancel}>{draft ? 'Supprimer le brouillon' : 'Annuler'}</SoftBtn>}
            </div>
            {draft && dirty && <p className="mt-2 text-[11.5px] text-mist">Enregistrez les modifications avant de valider.</p>}
            {draft && <p className="mt-2 text-[11.5px] text-mist">Validez la facture pour l’émettre {pt ? 'via InvoiceXpress' : 'en Factur-X'}.</p>}
            {pt && canIssue && !ixReady && <p className="mt-2 text-[11.5px] text-mist">Connecteur InvoiceXpress non configuré : la facture reste un document de préparation.</p>}
          </Card>
        </div>

        <InvoicePaper inv={inv} v={v} ht={ht} vat={vat} ttc={ttc} />
        {createPortal(<div id="invoice-print" className="hidden"><InvoicePaper inv={inv} v={v} ht={ht} vat={vat} ttc={ttc} print /></div>, document.body)}
        {pt && <p className="flex items-start gap-1.5 text-[11.5px] leading-snug text-mist print:hidden"><ArrowRight size={11} className="mt-0.5 shrink-0" />{issued ? 'Facture légale émise par InvoiceXpress (logiciel certifié AT) : le PDF officiel fait foi, ce document en est l’aperçu.' : 'Portugal : ce document prépare la facture ; l’émission légale (numéro, ATCUD, QR) se fait dans InvoiceXpress.'}</p>}
        {!pt && <p className="flex items-start gap-1.5 text-[11.5px] leading-snug text-mist print:hidden"><Receipt size={12} className="mt-0.5 shrink-0" />XML Factur-X à joindre via votre plateforme agréée (PA) : Jaspe fournit le fichier, pas la transmission (obligatoire pour les TPE-PME au 1er septembre 2027). Le PDF imprimé est une version lisible, pas un PDF/A-3 hybride.</p>}
      </Stagger>
    </>
  )
}

function LegalBlock({ inv }: { inv: Invoice }) {
  const l = inv.legal
  if (!l) return null
  if (l.provider === 'invoicexpress' && l.state === 'draft') return <p className="mt-3 rounded-lg bg-white/[0.04] px-3 py-2 text-[12px] text-bone/70 ring-1 ring-white/[0.08]">Brouillon créé chez InvoiceXpress (n° interne {l.externalId}) : relancez l’émission pour le finaliser.</p>
  return (
    <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 rounded-xl bg-sage/[0.08] px-3.5 py-3 text-[12.5px] ring-1 ring-sage/25 sm:grid-cols-2">
      <div className="min-w-0"><dt className="text-[10.5px] uppercase tracking-eyebrow text-mist">{l.provider === 'invoicexpress' ? 'Numéro légal' : 'Factur-X figé'}</dt><dd className="num mt-0.5 break-all text-bone">{l.legalNumber ?? '—'}</dd></div>
      {l.provider === 'invoicexpress'
        ? <div className="min-w-0"><dt className="text-[10.5px] uppercase tracking-eyebrow text-mist">ATCUD</dt><dd className="num mt-0.5 break-all text-bone">{l.atcud ?? 'non communiqué'}</dd></div>
        : <div className="min-w-0"><dt className="text-[10.5px] uppercase tracking-eyebrow text-mist">Fichier</dt><dd className="num mt-0.5 break-all text-bone">{l.filename}</dd></div>}
      <div className="min-w-0"><dt className="text-[10.5px] uppercase tracking-eyebrow text-mist">Émise le</dt><dd className="mt-0.5 text-bone">{fdate(l.issuedAt)}{l.provider === 'invoicexpress' ? ' · InvoiceXpress' : ` · ${l.transmission ?? ''}`}</dd></div>
      {l.provider === 'invoicexpress' && (
        <div className="min-w-0"><dt className="text-[10.5px] uppercase tracking-eyebrow text-mist">PDF officiel</dt><dd className="mt-0.5">{l.pdfUrl ? <a href={l.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-champagne underline-offset-2 hover:underline">{l.pdfPending ? 'Ouvrir le document' : 'Télécharger le PDF'}<ArrowSquareOut size={12} /></a> : <span className="text-mist">en cours de génération</span>}</dd></div>
      )}
      {l.note && <p className="text-[11.5px] text-mist sm:col-span-2">{l.note}</p>}
    </dl>
  )
}

function InvoicePaper({ inv, v, ht, vat, ttc, print }: { inv: Invoice; v: { client: string; object: string; due: string }; ht: number; vat: number; ttc: number; print?: boolean }) {
  const pt = inv.country === 'PT'
  const mand = inv.template === 'mandataire'
  const exempt = !(inv.vatRate > 0)
  const ix = inv.legal?.provider === 'invoicexpress' && inv.legal.state === 'final' ? inv.legal : null
  const role = inv.payerRole === 'réseau' ? (pt ? 'Rede / agência mandante, devedora da comissão' : 'Réseau / agence mandante, débiteur de la commission') : inv.payerRole === 'vendeur' ? 'Vendeur, débiteur des honoraires' : 'Acquéreur, débiteur des honoraires'
  const vatLabel = exempt ? (pt ? 'IVA isento (art. 53.º CIVA)' : 'TVA non applicable (art. 293 B du CGI)') : `${pt ? 'IVA' : 'TVA'} ${pct(inv.vatRate)}`
  return (
          <Paper className={clsx('p-5 md:p-8', print && '!rounded-none !shadow-none')}>
            <div className="flex flex-col gap-3 border-b border-ink/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="font-serif text-2xl italic">{inv.issuer.name}</div>
                <p className="mt-1 max-w-sm font-sans text-[11.5px] leading-relaxed text-ink/55">{inv.issuer.legal}</p>
              </div>
              <div className="min-w-0 font-sans sm:text-right">
                <div className="text-[10.5px] uppercase tracking-eyebrow text-ink/50">{pt ? (ix ? 'Fatura · aperçu' : 'Documento de preparação') : 'Facture'}</div>
                <div className={clsx('num mt-1 break-all text-[15px]', !inv.number && 'italic text-ink/50')}>{ix?.legalNumber ?? inv.number ?? 'Brouillon — numéro attribué à la validation'}</div>
                {ix?.atcud && <div className="num mt-1 text-[11.5px] text-ink/55">ATCUD : {ix.atcud}</div>}
                {ix && inv.number && <div className="mt-0.5 text-[11px] text-ink/45">Réf. Jaspe {inv.number}</div>}
                <div className="mt-1 text-[11.5px] text-ink/55">Date : {fdate(inv.validatedAt ?? inv.createdAt)}</div>
              </div>
            </div>

            {inv.status === 'annulée' && <div className="mt-4 rounded-lg bg-coral/10 px-3 py-2 font-sans text-[12px] text-coral">ANNULÉE — {inv.cancelNote ?? 'émettre un avoir du même montant'}</div>}

            <div className="mt-5 grid gap-5 text-[13px] leading-relaxed text-ink/80 sm:grid-cols-2">
              <div className="min-w-0"><Eyebrow className="!text-ink/50">Facturé à</Eyebrow><p className="mt-1 break-words">{v.client}<br /><span className="text-ink/55">{role}</span></p></div>
              <div className="min-w-0"><Eyebrow className="!text-ink/50">Échéance</Eyebrow><p className="mt-1">{v.due}</p></div>
              <div className="min-w-0 sm:col-span-2"><Eyebrow className="!text-ink/50">Objet</Eyebrow><p className="mt-1 break-words">{v.object}</p></div>
            </div>

            <table className="mt-6 w-full font-sans text-[13px] text-ink/80">
              <tbody>
                <tr className="border-t border-ink/10"><td className="py-2">Prix de vente</td><td className="num py-2 text-right text-ink/55">{money(inv.price)}</td></tr>
                {mand && inv.share && <tr className="border-t border-ink/10"><td className="py-2">Honoraires HT de l’agence</td><td className="num py-2 text-right text-ink/55">{money(inv.share.base)}</td></tr>}
                <tr className="border-t border-ink/10"><td className="py-2">{mand && inv.share ? `Commission du mandataire (${inv.share.pct.toLocaleString('fr-FR')} %) HT` : 'Honoraires HT'}</td><td className="num py-2 text-right">{money(ht)}</td></tr>
                <tr className="border-t border-ink/10"><td className="py-2">{vatLabel}</td><td className="num py-2 text-right">{money(vat)}</td></tr>
                <tr className="border-y border-ink/20 font-medium text-ink"><td className="py-2.5">{exempt ? 'Net à payer' : 'Total TTC'}</td><td className="num py-2.5 text-right text-[15px]">{money(ttc)}</td></tr>
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
