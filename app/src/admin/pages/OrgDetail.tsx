import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { ArrowLeft, ArrowsClockwise, CheckCircle, XCircle, WarningCircle, DownloadSimple, ArrowSquareOut, SealCheck, Prohibit, Pause, ArrowCounterClockwise } from '@phosphor-icons/react'
import { authCall, type VerificationState } from '../../data/store'
import { Card, PageHeader, SoftBtn, Stagger } from '../../crm/ui'
import { AsyncForm, Field, Input, Modal, Select, Textarea, errText, toast } from '../../crm/forms'
import {
  useAdminGet, PLAN_LABEL, STATUS_LABEL, COUNTRY_LABEL, USAGE_LABEL, bytes, dateShort, dateTime, isUrl,
  type Config, type KycCheck, type OrgDetail, type Usage,
} from '../shared'
import { ErrorBox, Loading, LogList, TriState, VerifBadge } from '../widgets'

const CHECK_STYLE = {
  ok: { icon: CheckCircle, c: 'text-sage', ring: 'ring-sage/20 bg-sage/[0.06]', l: 'Conforme' },
  ko: { icon: XCircle, c: 'text-coral', ring: 'ring-coral/25 bg-coral/[0.06]', l: 'En échec' },
  manuel: { icon: WarningCircle, c: 'text-champagne-300', ring: 'ring-champagne/25 bg-champagne/[0.06]', l: 'À vérifier à la main' },
} as const

function Check({ c }: { c: KycCheck }) {
  const s = CHECK_STYLE[c.status]
  return (
    <li className={clsx('flex gap-3 rounded-xl p-3 ring-1', s.ring)}>
      <s.icon size={18} weight="fill" className={clsx('mt-0.5 shrink-0', s.c)} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[13.5px]"><span className="font-medium">{c.label}</span><span className={clsx('text-[11px]', s.c)}>{s.l}</span></div>
        <div className="mt-0.5 break-words text-[12.5px] text-bone/65">{c.detail}</div>
        {c.source && (isUrl(c.source)
          ? <a href={c.source} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12px] text-champagne-300 hover:underline">Vérifier sur le registre <ArrowSquareOut size={12} /></a>
          : <div className="mt-1 text-[11.5px] text-mist">Source : {c.source}</div>)}
      </div>
    </li>
  )
}

function Info({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt className="text-[10.5px] uppercase tracking-eyebrow text-mist">{label}</dt><dd className="mt-0.5 break-words text-[13.5px]">{children || <span className="text-mist">—</span>}</dd></div>
}

export default function OrgPage() {
  const { id = '' } = useParams()
  const { data: d, error, reload } = useAdminGet<OrgDetail>(`admin/orgs/${encodeURIComponent(id)}`)
  const cfg = useAdminGet<Config>('admin/config').data
  const [ask, setAsk] = useState<null | 'refuse' | 'suspendu'>(null)
  const [busy, setBusy] = useState('')
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  const [note, setNote] = useState('')
  useEffect(() => { if (d) { setOverrides(d.moduleOverrides ?? {}); setNote(d.adminNote ?? '') } }, [d])

  const run = (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key)
    fn().then(() => { toast(ok); reload() }, (e) => toast(errText(e), 'error')).finally(() => setBusy(''))
  }
  const base = `admin/orgs/${encodeURIComponent(id)}`
  const decide = (decision: VerificationState, n?: string) => authCall('POST', `${base}/verify`, { decision, note: n ?? '' })

  if (error) return <div><BackLink /><ErrorBox onRetry={reload}>{error}</ErrorBox></div>
  if (!d) return <div><BackLink /><Loading /></div>

  const kyc = d.kyc ?? {}
  const checks = kyc.result?.checks ?? []
  const inherited = (k: string) => { const m = cfg?.modules[k]; return !!m && m.enabled && (!m.plans || m.plans.includes(d.plan)) }
  const modKeys = Object.keys(cfg?.modules ?? d.modules)
  const dirtyMods = JSON.stringify(overrides) !== JSON.stringify(d.moduleOverrides ?? {})

  return (
    <div>
      <BackLink />
      <PageHeader kicker={`${COUNTRY_LABEL[d.country] ?? d.country} · ${PLAN_LABEL[d.plan] ?? d.plan}`} title={d.name}
        sub={<span className="flex flex-wrap items-center gap-2"><VerifBadge state={d.verification} submitted={d.kycSubmitted} /><span className="text-mist">Inscrite le {dateShort(d.createdAt)} · {d.id}</span></span>}
        actions={<a href={`/api/admin/orgs/${encodeURIComponent(d.id)}/export`} download className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-bone/85 ring-1 ring-white/[0.08] transition hover:bg-white/[0.08]"><DownloadSimple size={15} />Exporter les données (JSON)</a>} />

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <Stagger>
            <Card title="Décision de vérification" kicker="Validation de l’agence">
              {d.adminNote && <p className="mb-4 rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-[12.5px] text-bone/70 ring-1 ring-white/[0.06]">Note ou motif actuel : {d.adminNote}</p>}
              <div className="flex flex-wrap gap-2">
                <SoftBtn tone="gold" icon={<SealCheck size={15} />} disabled={!!busy || d.verification === 'valide'} onClick={() => run('valide', () => decide('valide'), 'Agence validée')}>Valider</SoftBtn>
                <SoftBtn icon={<Prohibit size={15} />} disabled={!!busy} onClick={() => setAsk('refuse')}>Refuser</SoftBtn>
                <SoftBtn icon={<Pause size={15} />} disabled={!!busy} onClick={() => setAsk('suspendu')}>Suspendre</SoftBtn>
                <SoftBtn icon={<ArrowCounterClockwise size={15} />} disabled={!!busy || d.verification === 'en_attente'} onClick={() => run('attente', () => decide('en_attente'), 'Agence remise en attente')}>Remettre en attente</SoftBtn>
              </div>
              <p className="mt-3 text-[12px] text-mist">Une agence refusée ou suspendue ne peut plus utiliser Jaspe : le motif lui est affiché.</p>
            </Card>
          </Stagger>

          <Stagger i={1}>
            <Card title="Dossier de vérification (KYC)" action={<SoftBtn icon={<ArrowsClockwise size={14} className={busy === 'kyc' ? 'animate-spin' : ''} />} disabled={!!busy} onClick={() => run('kyc', () => authCall('POST', `${base}/kyc`, {}), 'Contrôles relancés')}>Relancer les contrôles</SoftBtn>}>
              {!kyc.submittedAt && <p className="mb-4 text-[13px] text-mist">L’agence n’a pas encore déposé sa demande (Réglages › Agence).</p>}
              <dl className="grid gap-4 sm:grid-cols-2">
                <Info label={d.country === 'PT' ? 'NIF / NIPC' : 'SIREN / SIRET'}>{kyc.companyId}</Info>
                <Info label="Raison sociale">{kyc.legalName}</Info>
                <Info label={d.country === 'PT' ? 'Licence AMI' : 'Carte professionnelle'}>{kyc.cardNumber}</Info>
                <Info label="Responsable légal">{kyc.managerName}</Info>
                <Info label="Adresse">{kyc.address}</Info>
                <Info label="Déposé">{kyc.submittedAt ? `${dateTime(kyc.submittedAt)}${kyc.submittedBy ? ` par ${kyc.submittedBy}` : ''}` : ''}</Info>
              </dl>
              {checks.length > 0 && (
                <>
                  <div className="mb-2 mt-5 flex items-center justify-between text-[12px] text-mist">
                    <span>Contrôles automatiques</span>{kyc.result && <span>{dateTime(kyc.result.at)}</span>}
                  </div>
                  <ul className="space-y-2">{checks.map((c) => <Check key={c.id} c={c} />)}</ul>
                </>
              )}
            </Card>
          </Stagger>

          <Stagger i={2}>
            <Card title="Modules de l’agence" action={<SoftBtn tone="gold" disabled={!dirtyMods || !!busy} onClick={() => run('mods', () => authCall('PUT', `${base}/modules`, { modules: overrides }), 'Modules enregistrés')}>Enregistrer</SoftBtn>}>
              <p className="mb-3 text-[12px] text-mist">« Global » suit le réglage de la page Modules (et l’offre de l’agence). « Oui » ou « Non » force le module pour cette agence seulement.</p>
              <ul className="divide-y divide-white/[0.05]">
                {modKeys.map((k) => (
                  <li key={k} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-[13.5px]">{cfg?.modules[k]?.label ?? k}</div>
                      <div className="text-[11.5px] text-mist">Actuellement {d.modules[k] ? 'actif' : 'coupé'}</div>
                    </div>
                    <TriState label={cfg?.modules[k]?.label ?? k} value={overrides[k]} inherited={inherited(k)}
                      onChange={(v) => setOverrides((o) => { const n = { ...o }; if (v === undefined) delete n[k]; else n[k] = v; return n })} />
                  </li>
                ))}
              </ul>
            </Card>
          </Stagger>

          <Stagger i={3}><Card title="Journal de l’agence"><LogList log={d.log} showOrg={false} /></Card></Stagger>
        </div>

        <div className="space-y-5">
          <Stagger i={1}>
            <Card title="Identité">
              <dl className="grid grid-cols-2 gap-4">
                <Info label="Identifiant">{d.id}</Info>
                <Info label="Pays">{COUNTRY_LABEL[d.country] ?? d.country}</Info>
                <Info label="Offre">{PLAN_LABEL[d.plan] ?? d.plan}</Info>
                <Info label="Abonnement">{STATUS_LABEL[d.status] ?? d.status}</Info>
                <Info label="Sièges">{String(d.org.seats ?? '')}</Info>
                <Info label="Échéance">{d.org.periodEnd ? dateShort(d.org.periodEnd) : ''}</Info>
              </dl>
            </Card>
          </Stagger>

          <Stagger i={2}>
            <Card title="Changer d’offre">
              <AsyncForm submitLabel="Appliquer" success="Offre mise à jour"
                onSubmit={async (v) => { await authCall('PUT', `${base}/plan`, { plan: v.plan, status: v.status, seats: Number(v.seats) }); reload() }}>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Offre"><Select name="plan" defaultValue={d.plan}>{Object.entries(cfg?.plans ?? PLAN_LABEL).map(([k, p]) => <option key={k} value={k}>{typeof p === 'string' ? p : p.label}</option>)}</Select></Field>
                  <Field label="Statut"><Select name="status" defaultValue={d.status}>{Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
                  <Field label="Sièges"><Input name="seats" type="number" min={1} defaultValue={d.org.seats || 1} /></Field>
                </div>
              </AsyncForm>
            </Card>
          </Stagger>

          <Stagger i={3}>
            <Card title="Usage des données" action={<span className="num text-[12px] text-mist">{bytes(d.sizeBytes)}</span>}>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                {(Object.keys(USAGE_LABEL) as (keyof Usage)[]).map((k) => (
                  <div key={k}><dt className="text-[11px] text-mist">{USAGE_LABEL[k]}</dt><dd className="num text-[20px] leading-tight">{d.usage[k] ?? 0}</dd></div>
                ))}
              </dl>
            </Card>
          </Stagger>

          <Stagger i={4}>
            <Card title={`Membres (${d.membersList.length})`}>
              <ul className="divide-y divide-white/[0.05]">
                {d.membersList.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0"><div className="truncate text-[13.5px]">{m.name}</div><a href={`mailto:${m.email}`} className="block truncate text-[12px] text-mist hover:text-bone">{m.email}</a></div>
                    <span className="shrink-0 text-[11.5px] text-bone/60">{m.role === 'owner' ? 'Responsable' : 'Conseiller'}</span>
                  </li>
                ))}
              </ul>
              {d.invites.length > 0 && <p className="mt-3 text-[12px] text-mist">{d.invites.length} invitation{d.invites.length > 1 ? 's' : ''} en attente.</p>}
            </Card>
          </Stagger>

          <Stagger i={5}>
            <Card title="Note interne" action={<SoftBtn disabled={!!busy || note === (d.adminNote ?? '')} onClick={() => run('note', () => authCall('PUT', `${base}/note`, { note }), 'Note enregistrée')}>Enregistrer</SoftBtn>}>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Visible par l’équipe Jaspe ; affichée à l’agence si elle est refusée ou suspendue." aria-label="Note interne" />
            </Card>
          </Stagger>
        </div>
      </div>

      <Modal open={!!ask} onClose={() => setAsk(null)} kicker={d.name} title={ask === 'refuse' ? 'Refuser l’agence' : 'Suspendre l’agence'}>
        <AsyncForm submitLabel={ask === 'refuse' ? 'Refuser' : 'Suspendre'} onCancel={() => setAsk(null)} success={ask === 'refuse' ? 'Agence refusée' : 'Agence suspendue'}
          onSubmit={async (v) => { if (!v.note?.trim()) throw new Error('Indiquez le motif : il sera affiché à l’agence.'); await decide(ask!, v.note.trim()); setAsk(null); reload() }}>
          <p className="text-[13px] text-bone/60">L’agence ne pourra plus utiliser Jaspe tant que cette décision est en place. Le motif lui sera affiché.</p>
          <Field label="Motif"><Textarea name="note" required defaultValue={d.adminNote ?? ''} placeholder="Ex. : numéro SIREN introuvable au registre, carte professionnelle expirée…" /></Field>
        </AsyncForm>
      </Modal>
    </div>
  )
}

function BackLink() {
  return <Link to="/admin/agences" className="mb-5 inline-flex items-center gap-2 text-[13px] text-mist hover:text-bone"><ArrowLeft size={14} />Toutes les agences</Link>
}
