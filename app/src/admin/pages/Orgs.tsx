import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Card, Empty, PageHeader, Stagger } from '../../crm/ui'
import { Input, Select } from '../../crm/forms'
import { Pill } from '../../ui/kit'
import { useAdminGet, PLAN_LABEL, COUNTRY_LABEL, VERIF_LABEL, STATUS_LABEL, bytes, dateShort, type OrgSummary } from '../shared'
import { ErrorBox, Loading, VerifBadge } from '../widgets'

export default function Orgs({ pendingOnly = false }: { pendingOnly?: boolean }) {
  const { data, error, reload } = useAdminGet<{ orgs: OrgSummary[] }>('admin/orgs')
  const [q, setQ] = useState('')
  const [country, setCountry] = useState('')
  const [verif, setVerif] = useState('')
  const [plan, setPlan] = useState('')
  const go = useNavigate()
  const all = useMemo(() => data?.orgs ?? [], [data])
  const countries = useMemo(() => [...new Set(all.map((o) => o.country))].sort(), [all])
  const rows = all.filter((o) =>
    (pendingOnly ? o.verification === 'en_attente' && o.kycSubmitted : true)
    && (!q || `${o.name} ${o.id}`.toLowerCase().includes(q.trim().toLowerCase()))
    && (!country || o.country === country) && (!verif || o.verification === verif) && (!plan || o.plan === plan))
  return (
    <div>
      <PageHeader kicker="Plateforme" title={pendingOnly ? 'Vérifications' : 'Agences'}
        sub={pendingOnly ? 'Agences en attente qui ont déposé leur dossier de vérification : ouvrez la fiche pour contrôler et décider.' : 'Toutes les agences inscrites. Cliquez sur une ligne pour ouvrir sa fiche.'} />
      {error && <ErrorBox onRetry={reload}>{error}</ErrorBox>}
      {!data && !error && <Loading />}
      {data && (
        <Stagger className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <label className="relative block">
              <MagnifyingGlass size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une agence…" aria-label="Rechercher une agence" className="pl-9" />
            </label>
            <Select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Pays">
              <option value="">Tous les pays</option>{countries.map((c) => <option key={c} value={c}>{COUNTRY_LABEL[c] ?? c}</option>)}
            </Select>
            {!pendingOnly && (
              <Select value={verif} onChange={(e) => setVerif(e.target.value)} aria-label="Statut de vérification">
                <option value="">Toute vérification</option>{Object.entries(VERIF_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </Select>
            )}
            <Select value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Offre">
              <option value="">Toutes les offres</option>{Object.entries(PLAN_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select>
          </div>
          {!rows.length ? (
            <Empty title={pendingOnly ? 'Aucune demande en attente' : 'Aucune agence'}>{pendingOnly ? 'Les dossiers déposés par les agences apparaîtront ici.' : 'Aucune agence ne correspond à ces filtres.'}</Empty>
          ) : (
            <Card pad={false}>
              <div className="thin-scroll overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-[13px]">
                  <thead className="text-[10.5px] uppercase tracking-eyebrow text-mist">
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-5 py-3 font-normal">Agence</th><th className="px-3 py-3 font-normal">Pays</th><th className="px-3 py-3 font-normal">Offre</th>
                      <th className="px-3 py-3 font-normal">Vérification</th><th className="px-3 py-3 font-normal">Contrôles</th><th className="px-3 py-3 text-right font-normal">Membres</th>
                      <th className="px-3 py-3 text-right font-normal">Dossiers</th><th className="px-3 py-3 text-right font-normal">Taille</th><th className="px-5 py-3 font-normal">Inscrite le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((o) => (
                      <tr key={o.id} tabIndex={0} onClick={() => go(`/admin/agences/${o.id}`)} onKeyDown={(e) => { if (e.key === 'Enter') go(`/admin/agences/${o.id}`) }}
                        className="cursor-pointer border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.03] focus:bg-white/[0.04] focus:outline-none">
                        <td className="px-5 py-3"><div className="font-medium">{o.name}</div><div className="text-[11px] text-mist">{o.id}</div></td>
                        <td className="px-3 py-3 text-bone/70">{COUNTRY_LABEL[o.country] ?? o.country}</td>
                        <td className="px-3 py-3"><div>{PLAN_LABEL[o.plan] ?? o.plan}</div><div className="text-[11px] text-mist">{STATUS_LABEL[o.status] ?? o.status}</div></td>
                        <td className="px-3 py-3"><VerifBadge state={o.verification} submitted={o.kycSubmitted} /></td>
                        <td className="px-3 py-3">{o.kycScore ? (
                          <span className="flex gap-1">
                            <Pill tone="green">{o.kycScore.ok} ok</Pill>
                            {o.kycScore.ko > 0 && <Pill tone="red">{o.kycScore.ko} ko</Pill>}
                            {o.kycScore.manuel > 0 && <Pill tone="gold">{o.kycScore.manuel} à vérifier</Pill>}
                          </span>
                        ) : <span className="text-mist">—</span>}</td>
                        <td className="num px-3 py-3 text-right">{o.members}</td>
                        <td className="num px-3 py-3 text-right">{o.usage.dossiers}</td>
                        <td className="num px-3 py-3 text-right text-bone/70">{bytes(o.sizeBytes)}</td>
                        <td className="px-5 py-3 text-bone/70">{dateShort(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
          <p className="text-[12px] text-mist">{rows.length} agence{rows.length > 1 ? 's' : ''} affichée{rows.length > 1 ? 's' : ''} sur {all.length}.</p>
        </Stagger>
      )}
    </div>
  )
}
