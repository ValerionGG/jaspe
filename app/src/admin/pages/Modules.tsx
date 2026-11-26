import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { FloppyDisk } from '@phosphor-icons/react'
import { authCall } from '../../data/store'
import { Card, PageHeader, SoftBtn, Stagger } from '../../crm/ui'
import { errText, toast } from '../../crm/forms'
import { Pill } from '../../ui/kit'
import { useAdminGet, type Config } from '../shared'
import { ErrorBox, Loading, Toggle } from '../widgets'

type ModForm = { enabled: boolean; plans: string[] }

export default function Modules() {
  const { data, error, reload, setData } = useAdminGet<Config>('admin/config')
  const [mods, setMods] = useState<Record<string, ModForm>>({})
  const [requireVerif, setRequireVerif] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!data) return
    setMods(Object.fromEntries(Object.entries(data.modules).map(([k, m]) => [k, { enabled: m.enabled, plans: m.plans ?? [] }])))
    setRequireVerif(data.settings.requireVerification)
  }, [data])

  const planIds = Object.keys(data?.plans ?? {})
  const changedMods = data ? Object.fromEntries(Object.entries(mods).filter(([k, f]) => {
    const o = data.modules[k]
    return f.enabled !== o.enabled || [...f.plans].sort().join() !== [...(o.plans ?? [])].sort().join()
  }).map(([k, f]) => [k, { enabled: f.enabled, plans: f.plans.length ? f.plans : null }])) : {}
  const settingsChanged = !!data && requireVerif !== data.settings.requireVerification
  const dirty = Object.keys(changedMods).length > 0 || settingsChanged

  const set = (k: string, patch: Partial<ModForm>) => setMods((s) => ({ ...s, [k]: { ...s[k], ...patch } }))
  const togglePlan = (k: string, p: string) => set(k, { plans: mods[k].plans.includes(p) ? mods[k].plans.filter((x) => x !== p) : [...mods[k].plans, p] })
  const save = () => {
    setBusy(true)
    const body: Record<string, unknown> = {}
    if (Object.keys(changedMods).length) body.modules = changedMods
    if (settingsChanged) body.settings = { requireVerification: requireVerif }
    authCall<Config>('PUT', 'admin/config', body).then((c) => { setData(c); toast('Modules enregistrés') }, (e) => toast(errText(e), 'error')).finally(() => setBusy(false))
  }

  return (
    <div>
      <PageHeader kicker="Plateforme" title="Modules" sub="Activez ou coupez chaque fonction pour toutes les agences, ou réservez-la à certaines offres. Une agence peut être réglée à part depuis sa fiche."
        actions={<SoftBtn tone="gold" icon={<FloppyDisk size={15} />} disabled={!dirty || busy} onClick={save}>{busy ? 'Enregistrement…' : 'Enregistrer'}</SoftBtn>} />
      {error && <ErrorBox onRetry={reload}>{error}</ErrorBox>}
      {!data && !error && <Loading />}
      {data && (
        <div className="space-y-5">
          <Stagger>
            <Card title="Vérification des agences">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[13.5px]">Exiger la vérification de l’agence avant les envois, WhatsApp, MCP et factures</div>
                  <div className="mt-0.5 text-[12px] text-bone/50">Tant que l’équipe Jaspe n’a pas validé l’agence, ces fonctions restent bloquées. Le reste de l’application fonctionne.</div>
                </div>
                <Toggle on={requireVerif} onChange={setRequireVerif} label="Exiger la vérification de l’agence" />
              </div>
            </Card>
          </Stagger>
          <Stagger i={1}>
            <Card title="Modules" pad>
              <ul className="divide-y divide-white/[0.05]">
                {Object.entries(mods).map(([k, f]) => {
                  const m = data.modules[k]
                  return (
                    <li key={k} className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[13.5px]">{m.label}{m.core && <Pill tone="gold">Socle</Pill>}<span className="text-[11px] text-mist">{k}</span></div>
                          <div className="mt-0.5 text-[12px] text-bone/50">{!f.enabled ? 'Coupé pour toutes les agences (sauf forçage sur une fiche).' : f.plans.length ? `Réservé aux offres cochées.` : 'Actif pour toutes les offres.'}</div>
                        </div>
                        <Toggle on={f.enabled} onChange={(v) => set(k, { enabled: v })} label={`Activer ${m.label}`} />
                      </div>
                      <div className={clsx('mt-3 flex flex-wrap items-center gap-2', !f.enabled && 'pointer-events-none opacity-40')}>
                        <span className="text-[11px] uppercase tracking-eyebrow text-mist">Limiter à</span>
                        {planIds.map((p) => {
                          const on = f.plans.includes(p)
                          return (
                            <label key={p} className={clsx('flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-[12px] ring-1 transition', on ? 'bg-champagne/15 text-champagne-300 ring-champagne/30' : 'bg-white/[0.03] text-bone/60 ring-white/[0.08] hover:text-bone')}>
                              <input type="checkbox" className="accent-[rgb(var(--acc-500))]" checked={on} disabled={!f.enabled} onChange={() => togglePlan(k, p)} />
                              {data.plans[p]?.label ?? p}
                            </label>
                          )
                        })}
                        {!f.plans.length && <span className="text-[11.5px] text-mist">aucune case : toutes les offres</span>}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Card>
          </Stagger>
        </div>
      )}
    </div>
  )
}
