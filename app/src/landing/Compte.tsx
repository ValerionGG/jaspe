import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { CircleNotch, WarningCircle, Info } from '@phosphor-icons/react'
import { Eyebrow } from '../ui/kit'
import { PublicShell } from './public-shell'
import { card } from './essentiel-sections'
import { Field, Input, Select, errText } from '../crm/forms'
import { authCall, refreshMe, resetLocalData, useMe } from '../data/store'

/** Destination après connexion : uniquement un chemin interne. */
const safeNext = (v: string | null) => (v && v.startsWith('/') && !v.startsWith('//') ? v : '/app')

function Panel({ kicker, title, accent, sub, children }: { kicker: string; title: string; accent: string; sub?: ReactNode; children: ReactNode }) {
  return (
    <section className="px-5 pb-10 pt-14 md:pt-20">
      <div className="mx-auto max-w-[480px]">
        <Eyebrow>{kicker}</Eyebrow>
        <h1 className="display mt-5 text-[2.4rem] leading-[1.05] sm:text-5xl">{title} <span className="italic text-champagne-300">{accent}</span></h1>
        {sub && <p className="mt-4 text-[14.5px] leading-relaxed text-bone/65">{sub}</p>}
        <div className={clsx(card, 'mt-8 p-6 sm:p-7')}>{children}</div>
      </div>
    </section>
  )
}

/** Comptes indisponibles : version statique en ligne ou serveur sans JASPE_AUTH=1. */
function NoAccounts() {
  const me = useMe()
  if (!me || (me.mode !== 'static' && me.mode !== 'demo')) return null
  return (
    <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-sea/10 p-3.5 text-[13px] text-bone/80 ring-1 ring-sea/20">
      <Info size={16} className="mt-0.5 shrink-0 text-sea" />
      <span>{me.mode === 'static' ? 'Version de démonstration en ligne : les comptes ne sont pas disponibles ici.' : 'Ce serveur tourne en mode démonstration : les comptes ne sont pas activés.'} <Link to="/app" className="text-champagne-300 underline-offset-2 hover:underline">Ouvrir la démo</Link></span>
    </div>
  )
}

function useSubmit(fn: (v: Record<string, string>) => Promise<void>) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try { await fn(Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>) }
    catch (x) { setError(errText(x)) }
    finally { setBusy(false) }
  }
  return { busy, error, onSubmit }
}

function Submit({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-champagne px-5 py-3 text-[14px] font-medium text-ink transition hover:bg-champagne-300 disabled:opacity-60">
      {busy && <CircleNotch size={15} className="animate-spin" />}{children}
    </button>
  )
}
const ErrorLine = ({ error }: { error: string | null }) => (error ? <p role="alert" className="flex items-start gap-2 rounded-xl bg-coral/10 p-3 text-[13px] text-coral ring-1 ring-coral/20"><WarningCircle size={15} className="mt-0.5 shrink-0" />{error}</p> : null)

async function enter(go: (p: string) => void, next: string) {
  resetLocalData()
  await refreshMe()
  go(next)
}

export function Connexion() {
  const go = useNavigate()
  const [params] = useSearchParams()
  const { busy, error, onSubmit } = useSubmit(async (v) => {
    await authCall('POST', 'auth/login', { email: v.email, password: v.password })
    await enter((p) => go(p, { replace: true }), safeNext(params.get('next')))
  })
  return (
    <PublicShell title="Connexion">
      <Panel kicker="Connexion" title="Bon retour" accent="sur Jaspe." sub={<>Pas encore de compte ? <Link to="/inscription" className="text-champagne-300 hover:underline">Créez-le gratuitement</Link>.</>}>
        <NoAccounts />
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Adresse e-mail"><Input name="email" type="email" autoComplete="email" required autoFocus /></Field>
          <Field label="Mot de passe"><Input name="password" type="password" autoComplete="current-password" required /></Field>
          <ErrorLine error={error} />
          <Submit busy={busy}>Se connecter</Submit>
        </form>
        <p className="mt-4 text-[12px] text-mist">Mot de passe oublié : la réinitialisation par e-mail n’est pas encore disponible. Le responsable de votre agence peut vous renvoyer une invitation.</p>
      </Panel>
    </PublicShell>
  )
}

export function Inscription() {
  const go = useNavigate()
  const [start, setStart] = useState<'demo' | 'vide'>('vide')
  const { busy, error, onSubmit } = useSubmit(async (v) => {
    if ((v.password ?? '').length < 10) throw new Error('Mot de passe trop court : 10 caractères minimum')
    await authCall('POST', 'auth/register', { name: v.name, email: v.email, password: v.password, orgName: v.orgName, country: v.country, start })
    await enter((p) => go(p, { replace: true }), '/app')
  })
  return (
    <PublicShell title="Créer un compte">
      <Panel kicker="Offre Découverte" title="Créez votre compte," accent="gratuitement." sub="Un dossier actif, sans limite de durée et sans carte bancaire. Vous passerez à Solo ou Agence quand vous le voudrez.">
        <NoAccounts />
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Nom complet"><Input name="name" autoComplete="name" required maxLength={80} autoFocus /></Field>
          <Field label="Adresse e-mail"><Input name="email" type="email" autoComplete="email" required /></Field>
          <Field label="Mot de passe" hint="10 caractères minimum"><Input name="password" type="password" autoComplete="new-password" minLength={10} required /></Field>
          <Field label="Nom de l’agence"><Input name="orgName" autoComplete="organization" required maxLength={120} placeholder="ex. Agence du Port" /></Field>
          <Field label="Pays d’exercice"><Select name="country" defaultValue="FR"><option value="FR">France</option><option value="PT">Portugal</option></Select></Field>
          <fieldset>
            <legend className="mb-1.5 block text-[11px] uppercase tracking-eyebrow text-mist">Pour commencer</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {([['vide', 'Base vide', 'Vous saisissez ou importez vos propres dossiers.'], ['demo', 'Données de démonstration', 'Un portefeuille fictif pour explorer, à effacer ensuite.']] as const).map(([k, l, d]) => (
                <label key={k} className={clsx('cursor-pointer rounded-xl p-3 ring-1 transition', start === k ? 'bg-champagne/10 ring-champagne/40' : 'bg-white/[0.02] ring-white/10 hover:ring-white/20')}>
                  <input type="radio" name="start" value={k} checked={start === k} onChange={() => setStart(k)} className="sr-only" />
                  <span className="block text-[13.5px]">{l}</span><span className="mt-0.5 block text-[12px] text-mist">{d}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <ErrorLine error={error} />
          <Submit busy={busy}>Créer mon compte</Submit>
          <p className="text-[12px] text-mist">Déjà inscrit ? <Link to="/connexion" className="text-champagne-300 hover:underline">Se connecter</Link></p>
        </form>
      </Panel>
    </PublicShell>
  )
}

export function Invitation() {
  const { token = '' } = useParams()
  const go = useNavigate()
  const [info, setInfo] = useState<{ org?: string; expiresAt?: string } | null>(null)
  const [fail, setFail] = useState<string | null>(null)
  useEffect(() => { authCall<{ org: string; expiresAt: string }>('GET', `auth/invite/${encodeURIComponent(token)}`).then(setInfo, (e) => setFail(errText(e))) }, [token])
  const { busy, error, onSubmit } = useSubmit(async (v) => {
    await authCall('POST', 'auth/accept', { token, name: v.name, email: v.email, password: v.password })
    await enter((p) => go(p, { replace: true }), '/app')
  })
  return (
    <PublicShell title="Invitation">
      <Panel kicker="Invitation" title="Rejoignez" accent={info?.org ?? 'votre agence'} sub={info?.expiresAt ? `Lien à usage unique, valable jusqu’au ${new Date(info.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.` : undefined}>
        <NoAccounts />
        {fail ? <ErrorLine error={fail} /> : !info ? <div className="flex justify-center py-6 text-mist"><CircleNotch size={20} className="animate-spin" /></div> : (
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Nom complet"><Input name="name" autoComplete="name" required maxLength={80} autoFocus /></Field>
            <Field label="Adresse e-mail"><Input name="email" type="email" autoComplete="email" required /></Field>
            <Field label="Mot de passe" hint="10 caractères minimum"><Input name="password" type="password" autoComplete="new-password" minLength={10} required /></Field>
            <ErrorLine error={error} />
            <Submit busy={busy}>Rejoindre l’agence</Submit>
          </form>
        )}
      </Panel>
    </PublicShell>
  )
}
