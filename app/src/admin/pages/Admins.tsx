import { useState } from 'react'
import { UserMinus, LockSimple } from '@phosphor-icons/react'
import { authCall, useMe } from '../../data/store'
import { Card, Empty, PageHeader, SoftBtn, Stagger } from '../../crm/ui'
import { AsyncForm, Field, Input, errText, toast } from '../../crm/forms'
import { useAdminGet } from '../shared'
import { ErrorBox, Loading } from '../widgets'

type AdminsRes = { admins: { id: string; email: string; name: string }[]; fromEnv: string[] }

export default function Admins() {
  const { data, error, reload } = useAdminGet<AdminsRes>('admin/admins')
  const me = useMe()
  const myEmail = me?.mode === 'auth' ? me.user.email.toLowerCase() : ''
  const [busy, setBusy] = useState('')
  const [formKey, setFormKey] = useState(0)
  const remove = (email: string) => {
    if (!window.confirm(`Retirer les droits d’administration de ${email} ?`)) return
    setBusy(email)
    authCall('POST', 'admin/admins', { email, admin: false }).then(() => { toast('Administrateur retiré'); reload() }, (e) => toast(errText(e), 'error')).finally(() => setBusy(''))
  }
  const env = new Set((data?.fromEnv ?? []).map((e) => e.toLowerCase()))
  return (
    <div>
      <PageHeader kicker="Plateforme" title="Administrateurs" sub="Les comptes qui ont accès à ce back-office." />
      {error && <ErrorBox onRetry={reload}>{error}</ErrorBox>}
      {!data && !error && <Loading />}
      {data && (
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            <Stagger>
              <Card title="Promus depuis le back-office">
                {!data.admins.length ? <Empty title="Aucun">Ajoutez un compte existant avec le formulaire.</Empty> : (
                  <ul className="divide-y divide-white/[0.05]">
                    {data.admins.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0"><div className="truncate text-[13.5px]">{a.name}{a.email.toLowerCase() === myEmail && <span className="ml-2 text-[11px] text-mist">(vous)</span>}</div><div className="truncate text-[12px] text-mist">{a.email}</div></div>
                        <SoftBtn icon={<UserMinus size={14} />} disabled={!!busy} onClick={() => remove(a.email)}>Retirer</SoftBtn>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </Stagger>
            <Stagger i={1}>
              <Card title="Définis par JASPE_ADMIN_EMAILS">
                <p className="mb-3 text-[12px] text-mist">Ces e-mails sont fixés dans la configuration du serveur ; ils ne se modifient pas ici.</p>
                {!data.fromEnv.length ? <p className="text-[13px] text-mist">Aucun e-mail défini.</p> : (
                  <ul className="space-y-2">
                    {data.fromEnv.map((e) => <li key={e} className="flex items-center gap-2 text-[13.5px]"><LockSimple size={14} className="text-mist" />{e}</li>)}
                  </ul>
                )}
              </Card>
            </Stagger>
          </div>
          <Stagger i={1}>
            <Card title="Ajouter un administrateur">
              <AsyncForm key={formKey} submitLabel="Donner l’accès" success="Administrateur ajouté"
                onSubmit={async (v) => {
                  const email = v.email.trim().toLowerCase()
                  if (env.has(email)) throw new Error('Cet e-mail est déjà administrateur via JASPE_ADMIN_EMAILS.')
                  await authCall('POST', 'admin/admins', { email, admin: true }); setFormKey((k) => k + 1); reload()
                }}>
                <Field label="E-mail du compte" hint="Le compte doit déjà exister sur Jaspe."><Input name="email" type="email" required placeholder="prenom@agence.fr" /></Field>
              </AsyncForm>
            </Card>
          </Stagger>
        </div>
      )}
    </div>
  )
}
