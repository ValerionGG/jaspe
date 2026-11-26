import { useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Card, PageHeader, Stagger } from '../../crm/ui'
import { Input } from '../../crm/forms'
import { useAdminGet, actionLabel, detailText, type LogEntry, type OrgSummary } from '../shared'
import { ErrorBox, Loading, LogList } from '../widgets'

export default function Journal() {
  const { data, error, reload } = useAdminGet<{ log: LogEntry[] }>('admin/log')
  const orgs = useAdminGet<{ orgs: OrgSummary[] }>('admin/orgs').data
  const names = Object.fromEntries((orgs?.orgs ?? []).map((o) => [o.id, o.name]))
  const [q, setQ] = useState('')
  const s = q.trim().toLowerCase()
  const rows = (data?.log ?? []).filter((e) => !s || [e.admin, e.orgId ? names[e.orgId] ?? e.orgId : '', actionLabel(e.action), detailText(e)].join(' ').toLowerCase().includes(s))
  return (
    <div>
      <PageHeader kicker="Plateforme" title="Journal" sub="Les 200 dernières actions d’administration. Rien n’est modifié sans trace." />
      {error && <ErrorBox onRetry={reload}>{error}</ErrorBox>}
      {!data && !error && <Loading />}
      {data && (
        <Stagger className="space-y-4">
          <label className="relative block max-w-md">
            <MagnifyingGlass size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer par admin, agence, action…" aria-label="Filtrer le journal" className="pl-9" />
          </label>
          <Card><LogList log={rows} orgNames={names} /></Card>
        </Stagger>
      )}
    </div>
  )
}
