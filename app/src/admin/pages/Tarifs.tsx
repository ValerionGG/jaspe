import { useEffect, useState } from 'react'
import { FloppyDisk, Info } from '@phosphor-icons/react'
import { authCall } from '../../data/store'
import { Card, PageHeader, SoftBtn, Stagger } from '../../crm/ui'
import { Field, Input, errText, toast } from '../../crm/forms'
import { useAdminGet, type Config, type PlanCfg } from '../shared'
import { ErrorBox, Loading, Toggle } from '../widgets'

type PlanForm = { label: string; price: string; priceYear: string; dossiers: string; seats: string; seatPrice: string; visible: boolean }
type OptForm = { label: string; price: string }
const str = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n))
const num = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')))
const toForm = (p: PlanCfg): PlanForm => ({ label: p.label, price: str(p.price), priceYear: str(p.priceYear), dossiers: str(p.dossiers), seats: str(p.seats), seatPrice: str(p.seatPrice), visible: p.visible !== false })

export default function Tarifs() {
  const { data, error, reload, setData } = useAdminGet<Config>('admin/config')
  const [plans, setPlans] = useState<Record<string, PlanForm>>({})
  const [opts, setOpts] = useState<Record<string, OptForm>>({})
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!data) return
    setPlans(Object.fromEntries(Object.entries(data.plans).map(([k, p]) => [k, toForm(p)])))
    setOpts(Object.fromEntries(Object.entries(data.options).map(([k, o]) => [k, { label: o.label, price: str(o.price) }])))
  }, [data])

  const setP = (id: string, patch: Partial<PlanForm>) => setPlans((s) => ({ ...s, [id]: { ...s[id], ...patch } }))
  const setO = (id: string, patch: Partial<OptForm>) => setOpts((s) => ({ ...s, [id]: { ...s[id], ...patch } }))

  /** Seuls les champs modifiés partent au serveur. */
  const diff = () => {
    if (!data) return {}
    const body: { plans?: Record<string, Record<string, unknown>>; options?: Record<string, Record<string, unknown>> } = {}
    for (const [id, f] of Object.entries(plans)) {
      const o = toForm(data.plans[id]), ch: Record<string, unknown> = {}
      if (f.label.trim() !== o.label) ch.label = f.label.trim()
      for (const k of ['price', 'priceYear', 'dossiers', 'seats', 'seatPrice'] as const) if (f[k].trim() !== o[k]) ch[k] = k === 'price' || k === 'seats' ? num(f[k]) ?? 0 : num(f[k])
      if (f.visible !== o.visible) ch.visible = f.visible
      if (Object.keys(ch).length) (body.plans ??= {})[id] = ch
    }
    for (const [id, f] of Object.entries(opts)) {
      const o = data.options[id], ch: Record<string, unknown> = {}
      if (f.label.trim() && f.label.trim() !== o.label) ch.label = f.label.trim()
      if (f.price.trim() !== str(o.price)) ch.price = num(f.price) ?? 0
      if (Object.keys(ch).length) (body.options ??= {})[id] = ch
    }
    return body
  }
  const changes = diff()
  const dirty = Object.keys(changes).length > 0
  const invalid = Object.values(plans).some((f) => [f.price, f.priceYear, f.dossiers, f.seats, f.seatPrice].some((v) => v.trim() !== '' && !Number.isFinite(Number(v.replace(',', '.')))))
    || Object.values(opts).some((f) => f.price.trim() !== '' && !Number.isFinite(Number(f.price.replace(',', '.'))))

  const save = () => {
    setBusy(true)
    authCall<Config>('PUT', 'admin/config', changes).then((c) => { setData(c); toast('Tarifs enregistrés') }, (e) => toast(errText(e), 'error')).finally(() => setBusy(false))
  }

  return (
    <div>
      <PageHeader kicker="Plateforme" title="Tarifs & offres" sub="Prix, limites et visibilité de chaque offre. Les limites s’appliquent immédiatement aux agences."
        actions={<SoftBtn tone="gold" icon={<FloppyDisk size={15} />} disabled={!dirty || invalid || busy} onClick={save}>{busy ? 'Enregistrement…' : 'Enregistrer'}</SoftBtn>} />
      {error && <ErrorBox onRetry={reload}>{error}</ErrorBox>}
      {!data && !error && <Loading />}
      {data && (
        <div className="space-y-5">
          <p className="flex items-start gap-2 rounded-2xl bg-champagne/[0.07] px-4 py-3 text-[13px] text-bone/75 ring-1 ring-champagne/20">
            <Info size={16} className="mt-0.5 shrink-0 text-champagne-300" />
            Le site public (page Tarifs) lit ces valeurs : toute modification enregistrée y apparaît aussitôt. Une offre masquée reste attribuable depuis la fiche d’une agence.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {Object.entries(plans).map(([id, f], i) => (
              <Stagger key={id} i={i}>
                <Card kicker={id} title={f.label || id} action={<label className="flex items-center gap-2 text-[12px] text-mist">Visible sur le site<Toggle on={f.visible} label={`Afficher l’offre ${f.label} sur le site`} onChange={(v) => setP(id, { visible: v })} /></label>}>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Libellé" className="sm:col-span-3"><Input value={f.label} maxLength={40} onChange={(e) => setP(id, { label: e.target.value })} /></Field>
                    <Field label="Prix mensuel (€ HT)"><Input inputMode="decimal" value={f.price} onChange={(e) => setP(id, { price: e.target.value })} /></Field>
                    <Field label="Prix annuel (€ HT)" hint="Vide : pas d’annuel"><Input inputMode="decimal" value={f.priceYear} onChange={(e) => setP(id, { priceYear: e.target.value })} /></Field>
                    <Field label="Dossiers actifs" hint="Vide : illimité"><Input inputMode="numeric" value={f.dossiers} placeholder="Illimité" onChange={(e) => setP(id, { dossiers: e.target.value })} /></Field>
                    <Field label="Sièges inclus"><Input inputMode="numeric" value={f.seats} onChange={(e) => setP(id, { seats: e.target.value })} /></Field>
                    <Field label="Siège supplémentaire (€)" hint="Vide : non proposé"><Input inputMode="decimal" value={f.seatPrice} onChange={(e) => setP(id, { seatPrice: e.target.value })} /></Field>
                  </div>
                </Card>
              </Stagger>
            ))}
          </div>
          <Stagger i={4}>
            <Card title="Options" kicker="Ajouts à l’abonnement">
              <div className="space-y-3">
                {Object.entries(opts).map(([id, f]) => (
                  <div key={id} className="grid gap-3 sm:grid-cols-[1fr_12rem]">
                    <Field label={`Libellé (${id})`}><Input value={f.label} maxLength={40} onChange={(e) => setO(id, { label: e.target.value })} /></Field>
                    <Field label="Prix mensuel (€ HT)"><Input inputMode="decimal" value={f.price} onChange={(e) => setO(id, { price: e.target.value })} /></Field>
                  </div>
                ))}
              </div>
            </Card>
          </Stagger>
          {invalid && <ErrorBox>Certains montants ne sont pas des nombres valides.</ErrorBox>}
        </div>
      )}
    </div>
  )
}
