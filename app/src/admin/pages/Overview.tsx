import { Link } from 'react-router-dom'
import { Card, PageHeader, Stat, Stagger } from '../../crm/ui'
import { useAdminGet, PLAN_LABEL, COUNTRY_LABEL, VERIF_LABEL, type Overview as O, type OrgSummary } from '../shared'
import { Bars, ErrorBox, Loading, LogList } from '../widgets'

export default function Overview() {
  const { data, error, reload } = useAdminGet<O>('admin/overview')
  const orgs = useAdminGet<{ orgs: OrgSummary[] }>('admin/orgs').data
  const names = Object.fromEntries((orgs?.orgs ?? []).map((o) => [o.id, o.name]))
  return (
    <div>
      <PageHeader kicker="Plateforme" title="Vue d’ensemble" sub="L’état des agences inscrites sur Jaspe et les dernières actions de l’équipe." />
      {error && <ErrorBox onRetry={reload}>{error}</ErrorBox>}
      {!data && !error && <Loading />}
      {data && (
        <div className="space-y-5">
          <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Agences" value={data.orgs} />
            <Stat label="Utilisateurs" value={data.users} />
            <Stat label="Nouvelles sur 7 j" value={data.newOrgs7d} />
            <Stat label="Demandes en attente" value={data.pending} hint="Dossier de vérification déposé">
              {data.pending > 0 && <Link to="/admin/verifications" className="text-[12px] text-champagne-300 hover:underline">Traiter</Link>}
            </Stat>
          </Stagger>
          <Stagger i={1} className="grid gap-4 lg:grid-cols-3">
            <Card title="Par offre"><Bars data={data.byPlan} labels={PLAN_LABEL} /></Card>
            <Card title="Par pays"><Bars data={data.byCountry} labels={COUNTRY_LABEL} /></Card>
            <Card title="Par statut de vérification"><Bars data={data.byVerification} labels={VERIF_LABEL} /></Card>
          </Stagger>
          <Stagger i={2}>
            <Card title="Dernières actions" action={<Link to="/admin/journal" className="text-[12.5px] text-champagne-300 hover:underline">Tout le journal</Link>}>
              <LogList log={data.recent} orgNames={names} />
            </Card>
          </Stagger>
        </div>
      )}
    </div>
  )
}
