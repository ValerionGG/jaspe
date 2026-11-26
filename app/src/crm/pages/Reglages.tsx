import { motion, AnimatePresence } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import {
  UserCircle, TreeStructure, UsersThree, PaintBrush, PlugsConnected, ShieldCheck, BellSimple, CreditCard, LockKey,
  Lock, LockOpen, CaretRight, Plus, EnvelopeSimple, CheckCircle, Warning, ArrowsClockwise, DownloadSimple, UploadSimple,
  Sparkle, Moon, Sun, Desktop, DeviceMobile, SignOut, Key, Fingerprint, Buildings, Globe, X, Info, Scales, Trash, FloppyDisk, Plugs, ChatTeardropText,
} from '@phosphor-icons/react'
import { PageHeader, Card, Tabs, SoftBtn, Stagger, IconBtn, Empty } from '../ui'
import { Avatar, EXPO } from '../../ui/kit'
import { me, img, type Agent } from '../../data/mock'
import { useSettings, useAgents, useIntegrations, useConsents, useActivity, useFeedback, type Activity } from '../../data/collections'
import { uploadFile, action, type Doc, useMe, authCall, refreshMe, resetLocalData, type Me } from '../../data/store'
import { PLANS, PLAN_OPTIONS } from '../../data/plans'
import { useTheme } from '../../ui/theme'
import { Modal, Field, Input, Select, AsyncForm, toast, errText } from '../forms'
import { MailSettings } from '../MailSettings'
import { WhatsAppSettings } from '../WhatsAppSettings'
import { LangPanel } from '../../i18n/LangSwitch'
import { useIdentity } from '../../data/identity'
import {
  NETWORK, INHERITED, ROLES, PERMS, PERM_MATRIX, RETENTION, SESSIONS, download, csv,
  type Integration,
} from '../../data/pilot'

type Section = 'profil' | 'reseau' | 'equipe' | 'marque' | 'integrations' | 'conformite' | 'notifications' | 'facturation' | 'securite' | 'beta'
const SECTIONS: { id: Section; label: string; icon: typeof UserCircle; hint: string }[] = [
  { id: 'profil', label: 'Profil', icon: UserCircle, hint: 'Identité, thème, copilote' },
  { id: 'reseau', label: 'Agence & réseau', icon: TreeStructure, hint: 'Hiérarchie et héritage' },
  { id: 'equipe', label: 'Équipe & rôles', icon: UsersThree, hint: 'Invitations, droits' },
  { id: 'marque', label: 'Marque', icon: PaintBrush, hint: 'Charte et modèles' },
  { id: 'integrations', label: 'Intégrations', icon: PlugsConnected, hint: 'Connecteurs' },
  { id: 'conformite', label: 'Conformité', icon: ShieldCheck, hint: 'RGPD, AI Act, audit' },
  { id: 'notifications', label: 'Notifications', icon: BellSimple, hint: 'Canaux, horaires calmes' },
  { id: 'facturation', label: 'Facturation', icon: CreditCard, hint: 'Offre, quotas, paiement' },
  { id: 'securite', label: 'Sécurité', icon: LockKey, hint: 'MFA, SSO, sessions' },
  { id: 'beta', label: 'Retours bêta', icon: ChatTeardropText, hint: 'Ce que disent les testeurs' },
]
const HOME = 'Antibes Vieille-Ville'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const hhmm = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
const run = (p: Promise<unknown>, ok?: string, tone: 'ok' | 'info' = 'ok') => p.then(() => { if (ok) toast(ok, tone) }, (e) => toast(errText(e), 'error'))

/* ——— Données : réglages persistés + journal d’audit ——— */
/** Document de réglages : lu depuis la collection `settings`, créé au premier enregistrement s’il n’existe pas. */
function useSetting<T extends Record<string, unknown>>(id: string, defaults: T) {
  const [docs, ops] = useSettings()
  const doc = docs.find((d) => d.id === id)
  const value = { ...defaults, ...(doc ?? {}) } as T
  const save = async (patch: Partial<T>, ok?: string) => {
    try {
      if (doc) await ops.update(id, patch as Partial<Doc>)
      else await ops.create({ ...defaults, ...patch, id } as unknown as Partial<Doc>)
      if (ok) toast(ok)
      return true
    } catch (e) { toast(errText(e), 'error'); return false }
  }
  return [value, save, !!doc] as const
}
function useAudit() {
  const [, ops] = useActivity()
  const who = useIdentity()
  return (what: string, tone = 'neutral') => { ops.create({ t: hhmm(), at: new Date().toISOString(), who: who.name, what, tone }).catch(() => {}) }
}

/* ——— Primitives locales ——— */
function Toggle({ on, onChange, label, disabled }: { on: boolean; onChange?: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange?.(!on)}
      className={clsx('relative h-6 w-11 shrink-0 rounded-full ring-1 transition-colors duration-300 ease-silk disabled:cursor-not-allowed disabled:opacity-50', on ? 'bg-champagne ring-champagne' : 'bg-white/[0.06] ring-white/10')}>
      <motion.span className={clsx('absolute top-[3px] h-[18px] w-[18px] rounded-full shadow', on ? 'bg-ink' : 'bg-bone/70')} animate={{ left: on ? 23 : 3 }} transition={{ duration: 0.4, ease: EXPO }} />
    </button>
  )
}
function Row({ title, desc, children, tag }: { title: ReactNode; desc?: ReactNode; children?: ReactNode; tag?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/[0.05] py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-[13.5px]">{title}{tag}</div>{desc && <div className="mt-0.5 text-[12px] text-bone/50">{desc}</div>}</div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  )
}
function Pill({ value, options, onChange, label }: { value: string; options: readonly string[]; onChange: (v: string) => void; label: string }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-full bg-white/[0.04] px-3.5 py-1.5 text-[12.5px] text-bone outline-none ring-1 ring-white/[0.08] focus:ring-champagne/40 [&>option]:bg-ink-800">
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  )
}
const Tag = ({ tone, children }: { tone: 'sage' | 'sea' | 'champagne' | 'coral' | 'mute'; children: ReactNode }) => (
  <span className={clsx('whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] ring-1', { sage: 'bg-sage/10 text-sage ring-sage/25', sea: 'bg-sea/10 text-sea ring-sea/20', champagne: 'bg-champagne/10 text-champagne-300 ring-champagne/25', coral: 'bg-coral/10 text-coral ring-coral/25', mute: 'bg-white/[0.04] text-mist ring-white/10' }[tone])}>{children}</span>
)
function Initials({ name, size = 34 }: { name: string; size?: number }) {
  const ini = name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
  return <span className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ink-500 to-ink-700 font-serif italic text-champagne-300 ring-2 ring-ink-800" style={{ width: size, height: size, fontSize: size * 0.4 }}>{ini}</span>
}
const Face = ({ a, size = 34 }: { a: { name: string; photo?: string }; size?: number }) => (a.photo ? <Avatar src={a.photo} size={size} /> : <Initials name={a.name} size={size} />)
const MONO_TONE = ['bg-champagne/15 text-champagne-300', 'bg-sea/15 text-sea', 'bg-sage/15 text-sage', 'bg-coral/15 text-coral']
const Mono = ({ i }: { i: Integration }) => (
  <span className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-serif text-[18px] italic ring-1 ring-white/10', MONO_TONE[[...i.name].reduce((s, c) => s + c.charCodeAt(0), 0) % 4])}>{i.mono}</span>
)
/** Sauvegarde différée d’un brouillon : bouton actif seulement s’il y a des changements. */
function SaveBar({ dirty, onSave, onReset, saving, idle = 'Enregistré' }: { dirty: boolean; onSave: () => void; onReset: () => void; saving?: boolean; idle?: string }) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.05] pt-4">
      <span className={clsx('mr-auto flex w-full items-center gap-1.5 text-[11.5px] 2xl:w-auto', dirty ? 'text-champagne-300' : 'text-sage')}><span className={clsx('h-1.5 w-1.5 rounded-full', dirty ? 'bg-champagne' : 'bg-sage')} />{dirty ? 'Modifications non enregistrées' : idle}</span>
      {dirty && <SoftBtn onClick={onReset}>Annuler</SoftBtn>}
      <button onClick={onSave} disabled={!dirty || saving} className="inline-flex items-center gap-2 rounded-full bg-champagne px-5 py-2 text-[13px] font-medium text-ink transition hover:bg-champagne-300 disabled:opacity-40"><FloppyDisk size={14} />{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
    </div>
  )
}

/* ——— Profil ——— */
type ThemeMode = 'light' | 'dark' | 'system'
const storedTheme = () => { try { return localStorage.getItem('nxt-theme') } catch { return null } }
const sysTheme = () => (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
const TONES = { chaleureux: 'Chaleureux', sobre: 'Sobre', factuel: 'Factuel' } as const
const PROFILE = { name: me.name, role: me.role, email: 'claire.delmas@maison-riviera.fr', phone: '+33 6 11 22 33 44', card: 'CPI 0605 2024 000 041 872', agency: HOME, photo: me.photo, copilotTone: 'sobre', briefTime: '07:30', prefs: { brief: true, relances: true, voice: true, weekly: false } as Record<string, boolean>, themeMode: 'system' as ThemeMode }

function Profil() {
  const who = useIdentity()
  // Compte réel sans profil enregistré : partir de l’identité du compte, jamais du personnage de démo.
  const [p, save] = useSetting('profile', who.real ? { ...PROFILE, name: who.name, role: who.role, email: '', phone: '', card: '', agency: who.orgName, photo: '' } : PROFILE)
  const { theme, setTheme } = useTheme()
  const audit = useAudit()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const mode: ThemeMode = storedTheme() ? theme : 'system'
  const prefs = { ...PROFILE.prefs, ...(p.prefs ?? {}) }
  const pickTheme = (m: ThemeMode) => {
    if (m === 'system') { setTheme(sysTheme()); try { localStorage.removeItem('nxt-theme') } catch { /* indisponible */ } }
    else setTheme(m)
    save({ themeMode: m }, m === 'system' ? 'Thème : suit le réglage de l’appareil' : `Thème ${m === 'light' ? 'clair' : 'sombre'} appliqué`)
  }
  const onPhoto = async (f?: File) => {
    if (!f) return
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) return toast('Format accepté : PNG, JPEG ou WebP', 'error')
    if (f.size > 3e6) return toast('Image trop lourde (3 Mo maximum)', 'error')
    setUploading(true)
    try { const d = await uploadFile(f); await save({ photo: `/api/files/${d.id}/raw` }, 'Photo de profil mise à jour') }
    catch (e) { toast(errText(e), 'error') } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }
  return (
    <div className="space-y-6">
      <Card title="Identité" kicker="Visible sur vos livrables">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-3">
            <div className="relative"><Face a={p} size={96} /><span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-sage ring-4 ring-ink-800" /></div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
            <SoftBtn icon={<UploadSimple size={13} />} onClick={() => fileRef.current?.click()}>{uploading ? 'Envoi…' : 'Changer'}</SoftBtn>
          </div>
          <div className="flex-1">
            <AsyncForm key={`${p.name}|${p.email}|${p.phone}|${p.role}|${p.card}`} submitLabel="Enregistrer l’identité" success="Identité enregistrée"
              onSubmit={async (v) => {
                if (!v.name?.trim()) throw new Error('Le nom est obligatoire')
                if (!EMAIL.test(v.email ?? '')) throw new Error('Courriel professionnel invalide')
                if (v.phone && !/^[+\d][\d\s.]{7,}$/.test(v.phone)) throw new Error('Téléphone invalide')
                if (!(await save({ name: v.name.trim(), role: v.role.trim(), email: v.email.trim(), phone: v.phone.trim(), card: v.card.trim() }))) throw new Error('Enregistrement impossible')
                audit('a mis à jour son profil')
              }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom complet *"><Input name="name" defaultValue={p.name} required /></Field>
                <Field label="Fonction"><Input name="role" defaultValue={p.role} /></Field>
                <Field label="Courriel professionnel *"><Input name="email" type="email" defaultValue={p.email} required /></Field>
                <Field label="Téléphone"><Input name="phone" type="tel" defaultValue={p.phone} /></Field>
                <Field label="Carte professionnelle"><Input name="card" defaultValue={p.card} /></Field>
                <Field label="Agence de rattachement" hint="Modifiable par le directeur d’agence"><Input defaultValue={p.agency} disabled className="opacity-60" /></Field>
              </div>
            </AsyncForm>
          </div>
        </div>
      </Card>
      <Card title="Apparence" kicker="Sur cet appareil">
        <div className="grid grid-cols-3 gap-3">
          {([['light', 'Clair', Sun, 'Calcaire & azur'], ['dark', 'Sombre', Moon, 'Nocturne Riviera'], ['system', 'Système', Desktop, 'Suit l’appareil']] as const).map(([id, l, I, d]) => (
            <button key={id} onClick={() => pickTheme(id)} aria-pressed={mode === id}
              className={clsx('relative rounded-2xl p-3 text-left ring-1 transition', mode === id ? 'bg-champagne/[0.07] ring-champagne/40' : 'bg-white/[0.02] ring-white/[0.06] hover:ring-white/15')}>
              <span className={clsx('mb-3 flex h-14 overflow-hidden rounded-xl ring-1 ring-white/10', id === 'light' && 'theme-light', id === 'dark' && 'theme-dark')}>
                {id === 'system' ? <><span className="theme-dark flex flex-1 items-end bg-ink-900 p-1.5"><span className="h-1.5 w-6 rounded-full bg-champagne" /></span><span className="theme-light flex flex-1 items-end bg-ink-900 p-1.5"><span className="h-1.5 w-6 rounded-full bg-champagne" /></span></>
                  : <span className="flex flex-1 flex-col justify-end gap-1 bg-ink-900 p-1.5"><span className="h-1 w-10 rounded-full bg-bone/40" /><span className="h-1.5 w-6 rounded-full bg-champagne" /></span>}
              </span>
              <span className="flex items-center gap-1.5 text-[13px]"><I size={14} weight="light" />{l}{mode === id && <CheckCircle size={14} weight="fill" className="ml-auto text-champagne" />}</span>
              <span className="mt-0.5 block text-[11px] text-mist">{d}</span>
            </button>
          ))}
        </div>
      </Card>
      <LangPanel />
      <Card title="Préférences du copilote" kicker="Comment il travaille pour vous">
        <Row title="Ton des livrables" desc="Appliqué aux mails L1, avant-premières L3 et courriers L5">
          <Tabs id="rg-tone" value={TONES[p.copilotTone as keyof typeof TONES] ?? 'Sobre'} onChange={(v) => save({ copilotTone: v.toLowerCase() }, `Ton « ${v} » enregistré`)} items={Object.values(TONES).map((t) => ({ id: t, label: t }))} />
        </Row>
        <Row title="Heure du brief du matin" desc="Synthèse de la journée, décisions prioritaires, RDV prêts">
          <div className="flex items-center gap-3">
            <input type="time" aria-label="Heure du brief" defaultValue={p.briefTime} key={p.briefTime} onBlur={(e) => e.target.value && e.target.value !== p.briefTime && save({ briefTime: e.target.value }, `Brief programmé à ${e.target.value}`)} className="num rounded-xl bg-white/[0.03] px-3 py-1.5 text-[13px] outline-none ring-1 ring-white/[0.08] focus:ring-champagne/40" />
            <Toggle label="Brief du matin" on={prefs.brief} onChange={(v) => save({ prefs: { ...prefs, brief: v } }, v ? 'Brief du matin activé' : 'Brief du matin désactivé')} />
          </div>
        </Row>
        <Row title="Préparer les relances automatiquement" desc="Toujours soumises à votre validation avant envoi"><Toggle label="Relances" on={prefs.relances} onChange={(v) => save({ prefs: { ...prefs, relances: v } }, 'Préférence enregistrée')} /></Row>
        <Row title="Débrief vocal après chaque RDV" desc="Transcription, 12 champs proposés, audio supprimé sous 90 jours"><Toggle label="Vocal" on={prefs.voice} onChange={(v) => save({ prefs: { ...prefs, voice: v } }, 'Préférence enregistrée')} /></Row>
        <Row title="Bilan personnel du vendredi" desc="Votre progression comparée à vous-même, jamais aux autres"><Toggle label="Bilan" on={prefs.weekly} onChange={(v) => save({ prefs: { ...prefs, weekly: v } }, 'Préférence enregistrée')} /></Row>
      </Card>
    </div>
  )
}

/* ——— Agence & réseau ——— */
const AGENCY = { agencyName: 'Maison Riviera · Antibes', signature: 'Claire Delmas — Conseillère senior', quietFrom: '20:00', quietTo: '08:00', overrides: { ai: true } as Record<string, boolean>, extraTeams: {} as Record<string, string[]>, retention: {} as Record<string, number>, aiAct: { label: true, c2pa: true } as Record<string, boolean>, billingLog: [] as { at: string; what: string }[] }
/** Valeurs par défaut du document « agency » : en compte réel, nom de l’agence et signature de la personne connectée. */
function useAgencyDefaults(): typeof AGENCY {
  const who = useIdentity()
  return who.real ? { ...AGENCY, agencyName: who.orgName, signature: `${who.name} — ${who.role}` } : AGENCY
}

type KycCheck = { id: string; label: string; status: 'ok' | 'ko' | 'manuel'; detail: string; source: string }
type KycState = { verification: 'en_attente' | 'valide' | 'refuse' | 'suspendu'; note: string | null; kyc: { companyId?: string; legalName?: string; cardNumber?: string; managerName?: string; address?: string; submittedAt?: string; result?: { checks: KycCheck[] } } }
const VERIF_LABEL = { en_attente: 'En attente', valide: 'Agence vérifiée', refuse: 'Refusée', suspendu: 'Suspendue' } as const
const VERIF_TONE = { en_attente: 'bg-champagne/10 text-champagne-300 ring-champagne/25', valide: 'bg-sage/10 text-sage ring-sage/25', refuse: 'bg-coral/10 text-coral ring-coral/25', suspendu: 'bg-coral/10 text-coral ring-coral/25' } as const
const CHECK_TONE = { ok: 'text-sage', ko: 'text-coral', manuel: 'text-champagne-300' } as const
const CHECK_LABEL = { ok: 'Vérifié', ko: 'À corriger', manuel: 'Vérifié à la main par Jaspe' } as const

/** Vérification de l’agence (KYC) : identifiants contrôlés automatiquement, puis validation par l’équipe Jaspe. */
function Verification() {
  const account = useMe()
  const [st, setSt] = useState<KycState | null>(null)
  const auth = account?.mode === 'auth'
  const owner = auth && account.user.role === 'owner'
  const pt = auth && account.org.country === 'PT'
  useEffect(() => { if (auth) authCall<KycState>('GET', 'kyc').then(setSt, () => setSt(null)) }, [auth])
  if (!auth) return null
  const k = st?.kyc ?? {}
  return (
    <Card title="Vérification de l’agence" kicker={pt ? 'NIF, licença AMI et responsável' : 'SIREN, carte professionnelle T et responsable'}>
      {st && <div className="mb-4 flex flex-wrap items-center gap-2"><span className={clsx('rounded-full px-2.5 py-1 text-[12px] ring-1', VERIF_TONE[st.verification])}>{VERIF_LABEL[st.verification]}</span>{st.note && <span className="text-[12px] text-bone/60">{st.note}</span>}{k.submittedAt && <span className="text-[11.5px] text-mist">Demande déposée le {new Date(k.submittedAt).toLocaleDateString('fr-FR')}</span>}</div>}
      <p className="mb-4 text-[12.5px] leading-relaxed text-bone/60">Jaspe vérifie que l’agence existe et exerce légalement avant d’ouvrir les envois réels, WhatsApp, Claude/Codex et les factures. {pt ? 'Le NIF est contrôlé automatiquement ; la licence AMI est vérifiée sur le registre de l’IMPIC.' : 'Le SIREN est contrôlé dans le registre national des entreprises ; la carte T est vérifiée auprès de la CCI.'}</p>
      {owner ? (
        <AsyncForm key={k.submittedAt ?? 'new'} submitLabel={k.submittedAt ? 'Mettre à jour et revérifier' : 'Demander la vérification'} success="Demande envoyée : contrôles faits, l’équipe Jaspe valide sous 48 h" onSubmit={async (v) => {
          if (!v.companyId?.trim() || !v.cardNumber?.trim() || !v.managerName?.trim()) throw new Error('Identifiant de l’entreprise, carte ou licence et responsable sont obligatoires')
          setSt(await authCall<KycState>('POST', 'kyc', v)); await refreshMe()
        }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={pt ? 'NIF / NIPC de l’entreprise *' : 'SIREN ou SIRET *'}><Input name="companyId" defaultValue={k.companyId} placeholder={pt ? '501442600' : '552 100 554'} inputMode="numeric" /></Field>
            <Field label="Raison sociale"><Input name="legalName" defaultValue={k.legalName} placeholder={pt ? 'Mediação Imobiliária, Lda' : 'Agence du Port SARL'} /></Field>
            <Field label={pt ? 'Licença AMI *' : 'Carte professionnelle T *'} hint={pt ? 'Ex. AMI 12345' : 'Ex. CPI 0605 2024 000 041 872'}><Input name="cardNumber" defaultValue={k.cardNumber} /></Field>
            <Field label="Responsable légal *"><Input name="managerName" defaultValue={k.managerName} /></Field>
            <Field label="Adresse du siège" className="sm:col-span-2"><Input name="address" defaultValue={k.address} /></Field>
          </div>
        </AsyncForm>
      ) : <p className="text-[12.5px] text-mist">Seul le responsable de l’agence peut demander la vérification.</p>}
      {!!k.result?.checks?.length && (
        <ul className="mt-4 divide-y divide-white/[0.05] rounded-xl ring-1 ring-white/[0.06]">
          {k.result.checks.map((c) => (
            <li key={c.id} className="flex items-start gap-3 p-3 text-[12.5px]">
              <span className={clsx('mt-0.5 w-24 shrink-0 text-[11px]', CHECK_TONE[c.status])}>{CHECK_LABEL[c.status]}</span>
              <span className="min-w-0 flex-1"><span className="block text-bone">{c.label}</span><span className="block text-bone/55">{c.detail}</span></span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function Reseau() {
  const who = useIdentity()
  const [ag, save] = useSetting('agency', useAgencyDefaults())
  const audit = useAudit()
  // Compte réel : une seule agence (la sienne), sans réseau ni équipes de démonstration.
  const agencies = who.real ? [{ name: who.orgName, city: '', teams: [] as string[], members: 0, overrides: 0 }] : NETWORK.agencies
  const [sel, setSel] = useState(agencies[0].name)
  const [open, setOpen] = useState<string[]>([agencies[0].name])
  const [adding, setAdding] = useState<string | null>(null)
  const over = { ...AGENCY.overrides, ...(ag.overrides ?? {}) }
  const extra = ag.extraTeams ?? {}
  const a = agencies.find((x) => x.name === sel) ?? agencies[0]
  const removeTeam = (agName: string, t: string) => save({ extraTeams: { ...extra, [agName]: (extra[agName] ?? []).filter((x) => x !== t) } }, `Équipe ${t} retirée`).then((ok) => ok && audit(`a retiré l’équipe ${t} · ${agName}`))
  return (
    <div className="space-y-6">
      <Card title="Identité de l’agence" kicker="Nom commercial affiché sur les documents">
        <AsyncForm key={ag.agencyName} submitLabel="Enregistrer" success="Nom de l’agence enregistré" onSubmit={async (v) => {
          if (!v.agencyName?.trim()) throw new Error('Le nom de l’agence est obligatoire')
          if (!(await save({ agencyName: v.agencyName.trim() }))) throw new Error('Enregistrement impossible')
          audit(`a renommé l’agence en « ${v.agencyName.trim()} »`)
        }}>
          <Field label="Nom commercial *"><Input name="agencyName" defaultValue={ag.agencyName} maxLength={80} /></Field>
        </AsyncForm>
      </Card>
      <Verification />
      <Card title="Pays et mentions légales" kicker="Checklists de conformité, TVA et mentions des factures">
        <div className="space-y-4">
          <Field label="Pays d’exercice" hint="Change la checklist de conformité (France ou Portugal), le taux de TVA/IVA et les mentions des factures">
            <Select value={(ag as { country?: string }).country ?? 'FR'} onChange={(e) => action('settings.country', { country: e.target.value }).then(() => { toast(e.target.value === 'PT' ? 'Pays : Portugal' : 'Pays : France'); audit(`a changé le pays d’exercice (${e.target.value})`) }, (x) => toast(errText(x), 'error'))}>
              <option value="FR">France</option><option value="PT">Portugal</option>
            </Select>
          </Field>
          <AsyncForm key={`${(ag as { carte?: string }).carte}-${(ag as { ami?: string }).ami}`} submitLabel="Enregistrer les mentions" success="Mentions légales enregistrées" onSubmit={async (v) => {
            if (!(await save({ carte: v.carte?.trim(), ami: v.ami?.trim() } as Partial<typeof AGENCY>))) throw new Error('Enregistrement impossible')
            audit('a mis à jour les mentions légales des factures')
          }}>
            <Field label="France : carte professionnelle, garantie, RCS" hint="Reporté sur chaque facture de commission"><Input name="carte" defaultValue={(ag as { carte?: string }).carte ?? ''} placeholder="Carte T n° CPI 0601 2026 000 000 000 · Garantie Galian 120 000 € · RCS Antibes 000 000 000" maxLength={200} /></Field>
            <Field label="Portugal : licence AMI, NIF"><Input name="ami" defaultValue={(ag as { ami?: string }).ami ?? ''} placeholder="Licença AMI n.º 00000 · NIF 500 000 000" maxLength={200} /></Field>
          </AsyncForm>
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card title="Hiérarchie" kicker={who.real ? 'Agence → équipes' : 'Réseau → agences → équipes'}>
          {who.real ? (
            <p className="flex items-start gap-2 rounded-2xl bg-white/[0.02] p-3 text-[12px] text-bone/55 ring-1 ring-white/[0.05]"><Info size={14} className="mt-0.5 shrink-0" />Votre agence n’est rattachée à aucun réseau. Les autres agences apparaîtront ici lorsqu’elles existeront.</p>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl bg-champagne/[0.07] p-3 ring-1 ring-champagne/20">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-champagne to-champagne-700 font-serif text-[16px] italic text-ink">R</span>
              <div className="flex-1"><div className="text-[13.5px] font-medium">{NETWORK.name}</div><div className="text-[11px] text-mist">6 agences · 39 membres · Siège Sophia Antipolis</div></div>
              <Globe size={16} weight="light" className="text-champagne-300" />
            </div>
          )}
          <div className="ml-[1.1rem] border-l border-white/[0.08] pl-4 pt-2">
            {agencies.map((x) => {
              const isOpen = open.includes(x.name)
              const mine = extra[x.name] ?? []
              return (
                <div key={x.name} className="relative py-1">
                  <span className="absolute -left-4 top-6 h-px w-3 bg-white/[0.08]" />
                  <button onClick={() => { setSel(x.name); setOpen(isOpen ? open.filter((o) => o !== x.name) : [...open, x.name]) }}
                    className={clsx('flex w-full items-center gap-3 rounded-xl p-2.5 text-left ring-1 transition', sel === x.name ? 'bg-white/[0.05] ring-white/10' : 'ring-transparent hover:bg-white/[0.03]')}>
                    <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.35, ease: EXPO }}><CaretRight size={12} className="text-mist" /></motion.span>
                    <Buildings size={16} weight="light" className="text-bone/60" />
                    <span className="flex-1 text-[13px]">{x.name}</span>
                    {x.overrides > 0 && <Tag tone="sea">{x.overrides} dérog.</Tag>}
                    {!who.real && <span className="num text-[11px] text-mist">{x.members}</span>}
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EXPO }} className="overflow-hidden">
                        <div className="ml-[1.4rem] space-y-1 border-l border-white/[0.06] py-1 pl-4">
                          {x.teams.map((t) => <div key={t} className="flex items-center gap-2 py-1 text-[12px] text-bone/60"><UsersThree size={13} weight="light" />Équipe {t}</div>)}
                          {mine.map((t) => (
                            <div key={t} className="group flex items-center gap-2 py-1 text-[12px] text-bone/80"><UsersThree size={13} weight="light" className="text-champagne-300" />Équipe {t}<Tag tone="champagne">ajoutée</Tag>
                              <button onClick={() => removeTeam(x.name, t)} aria-label={`Retirer l’équipe ${t}`} className="ml-auto text-mist opacity-60 hover:text-coral group-hover:opacity-100"><X size={12} /></button></div>
                          ))}
                          <button onClick={() => setAdding(x.name)} className="flex items-center gap-1.5 py-1 text-[11.5px] text-mist hover:text-champagne-300"><Plus size={11} />Ajouter une équipe</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </Card>
        <Card title={a.name} kicker="Réglages hérités" action={a.city ? <span className="text-[11.5px] text-mist">{a.city}</span> : undefined}>
          {who.real ? <Empty title="Aucun réglage hérité">Les réglages imposés par un réseau apparaissent ici lorsque l’agence est rattachée à un réseau.</Empty> : <>
          <p className="mb-3 flex items-start gap-2 rounded-xl bg-white/[0.02] p-3 text-[12px] text-bone/55 ring-1 ring-white/[0.05]"><Info size={14} className="mt-0.5 shrink-0" />Un réglage verrouillé par le réseau s’applique à toutes les agences. Les autres peuvent être adaptés localement.</p>
          {INHERITED.map((r) => (
            <Row key={r.id} title={r.label} tag={r.locked ? <Tag tone="mute">Verrouillé · {r.from}</Tag> : over[r.id] ? <Tag tone="sea">Dérogation locale</Tag> : <Tag tone="champagne">Hérité · {r.from}</Tag>}>
              {r.locked ? <Lock size={16} weight="light" className="text-mist" /> : <Toggle label={`Dérogation · ${r.label}`} on={!!over[r.id]} onChange={(v) => save({ overrides: { ...over, [r.id]: v } }, v ? 'Dérogation locale activée' : 'Réglage hérité rétabli').then((ok) => ok && audit(`${v ? 'a activé' : 'a retiré'} la dérogation « ${r.label} »`))} />}
            </Row>
          ))}
          </>}
        </Card>
      </div>
      <Modal open={!!adding} onClose={() => setAdding(null)} title="Nouvelle équipe" kicker={adding ?? ''} width={460}>
        <AsyncForm submitLabel="Ajouter l’équipe" onCancel={() => setAdding(null)} success="Équipe ajoutée" onSubmit={async (v) => {
          const name = v.name?.trim()
          if (!name) throw new Error('Le nom de l’équipe est obligatoire')
          const agName = adding!, cur = [...(agencies.find((x) => x.name === agName)?.teams ?? []), ...(extra[agName] ?? [])]
          if (cur.some((t) => t.toLowerCase() === name.toLowerCase())) throw new Error('Cette équipe existe déjà')
          if (!(await save({ extraTeams: { ...extra, [agName]: [...(extra[agName] ?? []), name] } }))) throw new Error('Enregistrement impossible')
          audit(`a créé l’équipe ${name} · ${agName}`); setAdding(null)
        }}>
          <Field label="Nom de l’équipe *"><Input name="name" placeholder="Prestige, Location, International…" maxLength={40} autoFocus /></Field>
        </AsyncForm>
      </Modal>
    </div>
  )
}

/* ——— Équipe ——— */
type Member = Agent & Doc & { email?: string; access?: string; status?: string; invitedAt?: string }
const defaultAccess = (a: Member) => a.access ?? (a.id === 'a8' ? ROLES[0] : a.id === 'a2' ? ROLES[1] : a.id === 'a5' ? ROLES[3] : a.id === 'a6' ? ROLES[4] : ROLES[2])
const SECURITY = { mfa: true, mfaAll: true, ip: false, timeout: '8 heures', sso: { Google: true, Microsoft: false, SAML: false } as Record<string, boolean>, revoked: [] as string[], perms: PERM_MATRIX }

function Equipe() {
  const who = useIdentity()
  const home = who.real ? who.orgName : HOME
  const [agents, ops] = useAgents() as unknown as [Member[], ReturnType<typeof useAgents>[1]]
  const [sec, saveSec] = useSetting('security', SECURITY)
  const [profile] = useSetting('profile', PROFILE)
  const audit = useAudit()
  const [inviting, setInviting] = useState(false)
  const [confirm, setConfirm] = useState<string | null>(null)
  const members = agents.filter((a) => a.status !== 'invité')
  const invites = agents.filter((a) => a.status === 'invité')
  const m = { ...PERM_MATRIX, ...(sec.perms ?? {}) }
  const taken = new Set([profile.email, ...agents.map((a) => a.email)].filter(Boolean).map((e) => String(e).toLowerCase()))
  const remove = (a: Member, label: string) => run(ops.remove(a.id).then(() => audit(`${label} ${a.name}`, 'warn')), a.status === 'invité' ? 'Invitation annulée' : `${a.name} retiré de l’équipe`).finally(() => setConfirm(null))
  const account = useMe()
  return (
    <div className="space-y-6">
      {account?.mode === 'auth' && <AccountTeam me={account} />}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card title="Membres" kicker={`${members.length} actifs · ${invites.length} invitation${invites.length > 1 ? 's' : ''}`} pad={false} action={<SoftBtn tone="gold" icon={<Plus size={13} />} onClick={() => setInviting(true)}>Inviter</SoftBtn>}>
          <div className="divide-y divide-white/[0.04] px-5 pb-3">
            {members.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <Face a={a} />
                <div className="min-w-0 flex-1 basis-[11rem]"><div className="flex items-center gap-2 truncate text-[13px]">{a.name}{a.id === who.userId && <Tag tone="champagne">Vous</Tag>}</div><div className="truncate text-[11px] text-mist">{a.role} · {a.agency}</div></div>
                <Pill label={`Rôle de ${a.name}`} value={defaultAccess(a)} options={ROLES} onChange={(v) => run(ops.update(a.id, { access: v } as Partial<Member>).then(() => audit(`a attribué le rôle « ${v} » à ${a.name}`)), `${a.name.split(' ')[0]} : ${v}`)} />
                {a.id !== who.userId && (confirm === a.id
                  ? <span className="flex items-center gap-1"><button onClick={() => remove(a, 'a retiré')} className="rounded-full bg-coral/15 px-3 py-1.5 text-[11.5px] text-coral ring-1 ring-coral/25">Confirmer</button><IconBtn label="Annuler" onClick={() => setConfirm(null)}><X size={13} /></IconBtn></span>
                  : <IconBtn label={`Retirer ${a.name}`} onClick={() => setConfirm(a.id)}><Trash size={14} /></IconBtn>)}
              </div>
            ))}
          </div>
        </Card>
        <Card title="Invitations en attente" kicker="Lien valable 7 jours">
          <p className="mb-3 flex items-start gap-2 rounded-xl bg-white/[0.02] p-3 text-[11.5px] text-bone/55 ring-1 ring-white/[0.05]"><Info size={14} className="mt-0.5 shrink-0" />L’invité est créé dans l’équipe. L’e-mail d’invitation est consigné : connecteur d’envoi non configuré.</p>
          <div className="space-y-1.5">
            <AnimatePresence initial={false}>
              {invites.map((iv) => (
                <motion.div key={iv.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: EXPO }} className="overflow-hidden">
                  <div className="flex items-center gap-2 rounded-xl bg-white/[0.02] px-3 py-2 ring-1 ring-white/[0.05]">
                    <EnvelopeSimple size={14} className="shrink-0 text-mist" /><div className="min-w-0 flex-1"><div className="truncate text-[12.5px]">{iv.name} · <span className="text-bone/60">{iv.email}</span></div><div className="text-[10.5px] text-mist">{defaultAccess(iv)} · consignée {iv.invitedAt ? new Date(iv.invitedAt).toLocaleDateString('fr-FR') : ''}</div></div>
                    <IconBtn label="Annuler l’invitation" onClick={() => remove(iv, 'a annulé l’invitation de')}><X size={13} /></IconBtn>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {!invites.length && <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-[12px] text-mist">Aucune invitation en attente.</div>}
          </div>
          <div className="mt-4"><SoftBtn icon={<EnvelopeSimple size={14} />} onClick={() => setInviting(true)}>Inviter un conseiller</SoftBtn></div>
        </Card>
      </div>
      <Card title="Matrice des droits" kicker="Par rôle · le directeur réseau a tous les droits" pad={false}>
        <div className="overflow-x-auto thin-scroll px-2 pb-3">
          <table className="w-full min-w-[760px] text-[12.5px]">
            <thead><tr className="text-[10.5px] uppercase tracking-eyebrow text-mist"><th className="px-3 py-3 text-left font-normal">Permission</th>{ROLES.map((r) => <th key={r} className="px-2 py-3 font-normal">{r}</th>)}</tr></thead>
            <tbody>
              {PERMS.map((p, pi) => (
                <tr key={p.id} className="border-t border-white/[0.04]">
                  <td className="px-3 py-2.5">{(pi === 0 || PERMS[pi - 1].group !== p.group) && <div className="text-[10px] uppercase tracking-eyebrow text-champagne-300/80">{p.group}</div>}<span className="text-bone/80">{p.label}</span></td>
                  {ROLES.map((r, ri) => {
                    const on = m[p.id][ri], locked = ri === 0
                    return (
                      <td key={r} className="px-2 py-2.5 text-center">
                        <button disabled={locked} aria-label={`${p.label} · ${r}`} aria-pressed={on} onClick={() => saveSec({ perms: { ...m, [p.id]: m[p.id].map((v, j) => (j === ri ? !v : v)) } }, `${r} : droit ${on ? 'retiré' : 'accordé'}`).then((ok) => ok && audit(`a ${on ? 'retiré' : 'accordé'} « ${p.label} » au rôle ${r}`))}
                          className={clsx('inline-flex h-7 w-7 items-center justify-center rounded-full ring-1 transition', on ? 'bg-champagne/15 text-champagne-300 ring-champagne/30' : 'bg-white/[0.02] text-transparent ring-white/[0.07] hover:ring-white/20', locked && 'cursor-not-allowed opacity-70')}>
                          <CheckCircle size={15} weight={on ? 'fill' : 'light'} />
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={inviting} onClose={() => setInviting(false)} title="Inviter un conseiller" kicker={`Équipe · ${home}`} width={500}>
        <AsyncForm submitLabel="Créer et consigner l’invitation" onCancel={() => setInviting(false)} onSubmit={async (v) => {
          const name = v.name?.trim(), email = v.email?.trim().toLowerCase()
          if (!name) throw new Error('Le nom est obligatoire')
          if (!EMAIL.test(email ?? '')) throw new Error('Adresse e-mail invalide')
          if (taken.has(email)) throw new Error('Cette adresse appartient déjà à un membre ou à une invitation')
          await ops.create({ name, email, access: v.access, role: v.access === ROLES[2] ? 'Conseiller' : v.access, agency: v.agency || home, photo: '', mandats: 0, ca: 0, score: 0, status: 'invité', invitedAt: new Date().toISOString() } as Partial<Member>)
          audit(`a invité ${name} (${email}) · ${v.access}`)
          toast('Invitation consignée — envoi d’e-mail non configuré', 'info'); setInviting(false)
        }}>
          <Field label="Nom complet *"><Input name="name" placeholder="Prénom Nom" maxLength={60} autoFocus /></Field>
          <Field label="Adresse e-mail *" hint="Contrôle de format et de doublon"><Input name="email" type="email" placeholder={who.real ? 'prenom.nom@agence.fr' : 'prenom.nom@maison-riviera.fr'} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rôle"><Select name="access" defaultValue={ROLES[2]}>{ROLES.map((r) => <option key={r}>{r}</option>)}</Select></Field>
            <Field label="Agence"><Select name="agency" defaultValue={home}>{(who.real ? [{ name: who.orgName }] : NETWORK.agencies).map((a) => <option key={a.name}>{a.name}</option>)}</Select></Field>
          </div>
        </AsyncForm>
      </Modal>
    </div>
  )
}

/* ——— Marque ——— */
const FONTS = { 'Instrument Serif': '"Instrument Serif", Georgia, serif', 'Georgia': 'Georgia, serif', 'Geist': 'Geist, system-ui, sans-serif' } as const
type FontName = keyof typeof FONTS
const TEMPLATES = ['Estimation argumentée L7', 'Mail de remerciement L1', 'Avant-première acquéreurs L3', 'Courrier voisinage L5', 'Book de services L6', 'Kit réseaux sociaux L4']
// Couleurs de charte : contenu de document imprimable (exception autorisée aux jetons de thème).
const BRAND = { primary: '#1C4C66', accent: '#C9A97C', paper: '#FBF9F5', titleFont: 'Instrument Serif' as FontName, bodyFont: 'Geist' as FontName, signature: 'Claire Delmas · Conseillère senior\nMaison Riviera · +33 6 11 22 33 44', logo: '', templates: { 'Estimation argumentée L7': true, 'Courrier voisinage L5': true, 'Book de services L6': true } as Record<string, boolean> }
type BrandDraft = Pick<typeof BRAND, 'primary' | 'accent' | 'paper' | 'titleFont' | 'bodyFont' | 'signature' | 'logo'>
const pick = (b: typeof BRAND): BrandDraft => ({ primary: b.primary, accent: b.accent, paper: b.paper, titleFont: b.titleFont, bodyFont: b.bodyFont, signature: b.signature, logo: b.logo })

function Marque() {
  const who = useIdentity()
  const [agency] = useSetting('agency', useAgencyDefaults())
  const brand = who.real ? { ...BRAND, signature: `${who.name} · ${who.role}\n${who.orgName}` } : BRAND
  const mono = who.real ? (String(agency.agencyName || who.orgName).trim()[0] ?? 'J').toUpperCase() : 'R'
  const [b, save, exists] = useSetting('brand', { ...brand, primary: String((agency as Record<string, unknown>).primary ?? BRAND.primary), accent: String((agency as Record<string, unknown>).accent ?? BRAND.accent) })
  const audit = useAudit()
  const saved = pick(b)
  const [c, setC] = useState<BrandDraft>(saved)
  const [saving, setSaving] = useState(false)
  const savedKey = JSON.stringify(saved)
  useEffect(() => { setC(JSON.parse(savedKey)) }, [savedKey])
  const dirty = JSON.stringify(c) !== savedKey
  const tpl = { ...BRAND.templates, ...(b.templates ?? {}) }
  const onLogo = async (f?: File) => {
    if (!f) return
    if (!/^image\/(svg\+xml|png)$/.test(f.type)) return toast('Logo attendu : SVG ou PNG transparent', 'error')
    if (f.size > 2e6) return toast('Logo trop lourd (2 Mo maximum)', 'error')
    try { const d = await uploadFile(f); setC((x) => ({ ...x, logo: `/api/files/${d.id}/raw` })); toast('Logo déposé — pensez à enregistrer', 'info') } catch (e) { toast(errText(e), 'error') }
  }
  const submit = async () => { setSaving(true); if (await save(c, 'Charte enregistrée')) audit('a mis à jour la charte graphique'); setSaving(false) }
  const hex = (v: string) => /^#[0-9a-f]{6}$/i.test(v)
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.05fr]">
      <div className="space-y-6">
        <Card title="Identité visuelle" kicker={who.real ? 'Charte de l’agence' : 'Héritée du réseau, adaptable'}>
          <div className="flex items-center gap-4">
            {c.logo ? <img src={c.logo} alt="Logo de l’agence" className="h-16 w-16 rounded-2xl bg-white/[0.04] object-contain p-2 ring-1 ring-white/10" />
              : <span className="flex h-16 w-16 items-center justify-center rounded-2xl font-serif text-3xl italic" style={{ background: c.accent, color: c.primary }}>{mono}</span>}
            <label className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.12] px-4 py-4 text-center text-[12px] text-mist transition hover:border-champagne/40 hover:text-bone">
              <UploadSimple size={18} weight="light" /><span className="mt-1">Déposer un logo · SVG ou PNG transparent</span><input type="file" accept="image/svg+xml,image/png" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
            </label>
            {c.logo && <IconBtn label="Retirer le logo" onClick={() => setC({ ...c, logo: '' })}><X size={13} /></IconBtn>}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {([['primary', 'Encre'], ['accent', 'Accent'], ['paper', 'Papier']] as const).map(([k, l]) => (
              <div key={k} className="rounded-2xl bg-white/[0.02] p-2.5 ring-1 ring-white/[0.06] transition hover:ring-white/15">
                <label className="relative block h-12 cursor-pointer overflow-hidden rounded-xl ring-1 ring-white/10" style={{ background: c[k] }}><input type="color" value={hex(c[k]) ? c[k] : '#000000'} onChange={(e) => setC({ ...c, [k]: e.target.value.toUpperCase() })} className="absolute inset-0 cursor-pointer opacity-0" aria-label={`Couleur ${l}`} /></label>
                <span className="mt-2 block text-[11.5px]">{l}</span>
                <input value={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.value })} aria-label={`Code ${l}`} maxLength={7} className={clsx('num mt-0.5 w-full bg-transparent text-[10.5px] uppercase outline-none', hex(c[k]) ? 'text-mist' : 'text-coral')} />
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 2xl:grid-cols-2">
            <div className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.02] px-3 py-2 ring-1 ring-white/[0.05]"><span className="text-[12px] text-mist">Titres</span><Pill label="Police des titres" value={c.titleFont} options={Object.keys(FONTS)} onChange={(v) => setC({ ...c, titleFont: v as FontName })} /></div>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.02] px-3 py-2 ring-1 ring-white/[0.05]"><span className="text-[12px] text-mist">Texte</span><Pill label="Police du texte" value={c.bodyFont} options={Object.keys(FONTS)} onChange={(v) => setC({ ...c, bodyFont: v as FontName })} /></div>
          </div>
          <label className="mt-5 block"><span className="mb-1.5 block text-[10.5px] uppercase tracking-eyebrow text-mist">Signature</span>
            <textarea value={c.signature} onChange={(e) => setC({ ...c, signature: e.target.value })} rows={2} maxLength={240} className="w-full resize-none rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-[13px] text-bone outline-none ring-1 ring-white/[0.07] focus:ring-champagne/40" /></label>
          <SaveBar dirty={dirty} saving={saving} idle={exists ? 'Charte enregistrée' : who.real ? 'Charte par défaut' : 'Charte héritée du réseau'} onReset={() => setC(saved)} onSave={() => { if (![c.primary, c.accent, c.paper].every(hex)) return toast('Couleur invalide : format #RRGGBB attendu', 'error'); submit() }} />
        </Card>
        <Card title="Modèles de documents" kicker="Verrouillés par le réseau ou personnalisables">
          {TEMPLATES.map((n) => {
            const locked = !!tpl[n]
            return (
              <Row key={n} title={n} tag={locked ? <Tag tone="mute">Verrouillé</Tag> : <Tag tone="sage">Personnalisable</Tag>}>
                <IconBtn label={locked ? 'Déverrouiller' : 'Verrouiller'} active={locked} onClick={() => save({ templates: { ...tpl, [n]: !locked } }, `${n} ${locked ? 'déverrouillé' : 'verrouillé'}`).then((ok) => ok && audit(`a ${locked ? 'déverrouillé' : 'verrouillé'} le modèle « ${n} »`))}>{locked ? <Lock size={15} /> : <LockOpen size={15} />}</IconBtn>
              </Row>
            )
          })}
        </Card>
      </div>
      <div className="xl:sticky xl:top-24 xl:self-start">
        <div className="mb-2 flex items-center justify-between"><span className="text-[10.5px] uppercase tracking-eyebrow text-mist">Aperçu en direct · L7</span><span className={clsx('flex items-center gap-1.5 text-[11px]', dirty ? 'text-champagne-300' : 'text-sage')}><span className={clsx('h-1.5 w-1.5 rounded-full', dirty ? 'bg-champagne' : 'animate-pulse bg-sage')} />{dirty ? 'Brouillon' : exists ? 'Charte enregistrée' : who.real ? 'Charte par défaut' : 'Charte du réseau'}</span></div>
        <motion.div layout className="overflow-hidden rounded-[1.4rem] shadow-float ring-1 ring-white/10" style={{ background: c.paper, color: c.primary, fontFamily: FONTS[c.bodyFont] }}>
          <div className="relative h-40"><img src={img('villa-pool')} alt="" className="h-full w-full object-cover" /><span className="theme-dark absolute bottom-2 right-2 rounded-full bg-ink/70 px-2 py-0.5 text-[9.5px] text-bone backdrop-blur">Image retouchée par IA · original conservé</span></div>
          <div className="p-7">
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: c.primary + '1f' }}>
              <span className="flex min-w-0 items-center gap-2">{c.logo ? <img src={c.logo} alt="" className="h-7 w-7 object-contain" /> : <span className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px] italic" style={{ background: c.accent, fontFamily: FONTS[c.titleFont] }}>{mono}</span>}<span className="truncate text-[11px] uppercase tracking-[0.2em]" style={{ opacity: 0.6 }}>{agency.agencyName}</span></span>
              <span className="shrink-0 pl-3 text-[10px] uppercase tracking-[0.2em]" style={{ opacity: 0.45 }}>Analyse de valeur</span>
            </div>
            <h3 className="mt-5 text-[2.1rem] leading-[1.02]" style={{ fontFamily: FONTS[c.titleFont] }}>{who.real ? <>Villa contemporaine, <span style={{ color: c.accent, fontStyle: 'italic' }}>exemple</span></> : <>Villa contemporaine, <span style={{ color: c.accent, fontStyle: 'italic' }}>Cap d’Antibes</span></>}</h3>
            <div className="mt-4 flex items-baseline justify-between"><span className="text-[10px] uppercase tracking-[0.2em]" style={{ opacity: 0.5 }}>Fourchette retenue</span><span className="text-[1.7rem]" style={{ fontFamily: FONTS[c.titleFont] }}>{who.real ? '— €' : '4,60 – 5,15 M€'}</span></div>
            <div className="relative mt-2 h-1.5 rounded-full" style={{ background: c.primary + '14' }}><div className="absolute inset-y-0 left-[28%] right-[18%] rounded-full" style={{ background: c.accent }} /></div>
            <p className="mt-4 text-[12.5px] leading-relaxed" style={{ opacity: 0.72 }}>{who.real ? 'Aperçu de mise en page : le texte, la fourchette et les comparables viendront de vos dossiers.' : 'Cinq ventes comparables DVF (sept. 2025 – mars 2026) dans un rayon de 900 m, ajustées pour la vue mer, l’état et le terrain.'}</p>
            <div className="mt-6 whitespace-pre-line border-t pt-4 text-[11.5px]" style={{ borderColor: c.primary + '1f', opacity: 0.75 }}>{c.signature}</div>
            <div className="mt-3 text-[9.5px]" style={{ opacity: 0.4 }}>{who.real ? 'Sources citées sur chaque document' : 'Sources : DVF/Etalab au 01/10/2026'} · document validé par un professionnel avant envoi.</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

/* ——— Intégrations ——— */
const ST = { connecte: { l: 'Connecté', t: 'sage' }, a_connecter: { l: 'À connecter', t: 'mute' }, erreur: { l: 'Erreur', t: 'coral' } } as const
function Integrations() {
  const [items, ops] = useIntegrations()
  const audit = useAudit()
  const [cat, setCat] = useState('Toutes')
  const [busy, setBusy] = useState<string | null>(null)
  const cats = ['Toutes', ...new Set(items.map((i) => i.cat))]
  const list = items.filter((i) => cat === 'Toutes' || i.cat === cat)
  const act = async (i: Integration & Doc, kind: 'connect' | 'disconnect' | 'sync') => {
    setBusy(i.id)
    try {
      if (kind === 'disconnect') { await ops.update(i.id, { status: 'a_connecter', sync: '', objects: '', simulated: false }); audit(`a déconnecté ${i.name}`); toast(`${i.name} déconnecté`) }
      else if (kind === 'sync') { await ops.update(i.id, { sync: `synchronisation simulée · ${hhmm()}` }); toast(`${i.name} : jeton non configuré — synchronisation simulée`, 'info') }
      else { await ops.update(i.id, { status: 'connecte', simulated: true, sync: `connexion simulée · ${new Date().toLocaleDateString('fr-FR')} ${hhmm()}`, objects: i.objects || 'Aucune donnée importée' }); audit(`a connecté ${i.name} (simulé)`); toast(`${i.name} : jeton non configuré — connexion simulée`, 'info') }
    } catch (e) { toast(errText(e), 'error') } finally { setBusy(null) }
  }
  const count = (s: string) => items.filter((i) => i.status === s).length
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-[1.3rem] bg-sea/[0.06] p-4 text-[12.5px] text-bone/70 ring-1 ring-sea/20"><Info size={18} weight="light" className="mt-0.5 shrink-0 text-sea" /><span>Aucun jeton d’API n’est configuré sur ce serveur : les connexions et synchronisations sont <span className="text-bone">simulées et consignées</span> (statut, journal d’audit). Aucune donnée n’est échangée avec les services tiers.</span></div>
      <MailSettings />
      <WhatsAppSettings />
      <div className="grid grid-cols-3 gap-3">
        {([['connecte', 'Connectées', 'text-sage'], ['erreur', 'À réparer', 'text-coral'], ['a_connecter', 'Disponibles', 'text-bone']] as const).map(([s, l, c]) => (
          <Card key={s}><div className="text-[11.5px] text-mist">{l}</div><div className={clsx('display mt-1 text-[2.2rem] leading-none', c)}>{count(s)}</div></Card>
        ))}
      </div>
      <Tabs id="rg-cat" value={cat} onChange={setCat} items={cats.map((c) => ({ id: c, label: c, count: c === 'Toutes' ? items.length : items.filter((i) => i.cat === c).length }))} />
      <motion.div layout className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((i) => (
            <motion.div layout key={i.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.4, ease: EXPO }}>
              <div className={clsx('flex h-full flex-col rounded-[1.3rem] bg-ink-800/80 p-4 ring-1 transition hover:ring-white/15', i.status === 'erreur' ? 'ring-coral/25' : 'ring-white/[0.06]')}>
                <div className="flex items-start gap-3">
                  <Mono i={i} />
                  <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-[14px] font-medium">{i.name}</span><Tag tone={ST[i.status].t}>{ST[i.status].l}</Tag></div><div className="text-[11px] text-mist">{i.cat}</div></div>
                </div>
                <p className="mt-3 flex-1 text-[12.5px] leading-relaxed text-bone/60">{i.desc}</p>
                {i.status !== 'a_connecter' && (
                  <div className="mt-3 space-y-1 rounded-xl bg-white/[0.02] p-2.5 text-[11px] ring-1 ring-white/[0.04]">
                    {i.sync && <div className="flex items-center gap-1.5 text-bone/60"><ArrowsClockwise size={11} />{i.sync}</div>}
                    {i.objects && <div className="num text-mist">{i.objects}</div>}
                    <div className="flex items-center gap-1.5 text-champagne-300"><Key size={11} />Jeton non configuré — connexion simulée</div>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {i.status === 'connecte' ? <>
                    <SoftBtn icon={<ArrowsClockwise size={13} className={clsx(busy === i.id && 'animate-spin')} />} onClick={() => act(i, 'sync')}>Synchroniser</SoftBtn>
                    <IconBtn label={`Déconnecter ${i.name}`} onClick={() => act(i, 'disconnect')}><Plugs size={14} /></IconBtn>
                  </> : <SoftBtn tone={i.status === 'erreur' ? 'light' : 'gold'} icon={busy === i.id ? <ArrowsClockwise size={13} className="animate-spin" /> : <PlugsConnected size={13} />} onClick={() => act(i, 'connect')}>{busy === i.id ? 'Connexion…' : i.status === 'erreur' ? 'Reconnecter' : 'Connecter'}</SoftBtn>}
                  {i.status === 'erreur' && <SoftBtn onClick={() => act(i, 'disconnect')}>Retirer</SoftBtn>}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      <AiEngine />
      <McpAccess />
    </div>
  )
}

/* ——— Moteur d’IA du serveur : Anthropic (Claude) en direct ou OpenRouter ——— */
const IA_LABEL: Record<string, string> = { anthropic: 'Claude, clé Anthropic directe', openrouter: 'OpenRouter (Claude par défaut)', aucun: 'Aucun — mode règles locales' }
function AiEngine() {
  const [ia, setIa] = useState<string | null>(null)
  useEffect(() => { fetch('/api/health').then((r) => r.json()).then((h) => setIa(h.ia ?? 'aucun'), () => setIa(null)) }, [])
  return (
    <Card>
      <div className="flex items-start gap-3">
        <Sparkle size={20} weight="light" className="mt-0.5 shrink-0 text-champagne" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[15px] font-medium">Moteur d’IA de Jaspe{ia && <span className={clsx('rounded-full px-2 py-0.5 text-[11px] ring-1', ia === 'aucun' ? 'text-mist ring-white/10' : 'text-sage ring-sage/30')}>{IA_LABEL[ia] ?? ia}</span>}</div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-bone/60">Le copilote et la lecture des compromis utilisent Claude. Deux façons de le brancher, côté hébergement (Dokploy › Environment) : <code className="num text-bone">ANTHROPIC_API_KEY</code> (clé Anthropic, prioritaire) ou <code className="num text-bone">OPENROUTER_API_KEY</code> (une seule clé OpenRouter, facturée par OpenRouter). Option : <code className="num text-bone">OPENROUTER_MODEL</code> pour imposer un autre modèle (ex. <code className="num">openai/gpt-5</code>). Sans clé, Jaspe répond en mode règles, sans IA.</p>
        </div>
      </div>
    </Card>
  )
}

/* ——— Jaspe dans Claude ou ChatGPT (MCP) ——— */
type ApiToken = { id: string; name: string; hint: string; createdAt: string; lastUsedAt?: string | null; revokedAt?: string | null }
function McpAccess() {
  const account = useMe()
  const audit = useAudit()
  const [tokens, setTokens] = useState<ApiToken[] | null>(null)
  const [fresh, setFresh] = useState<string | null>(null)
  const [name, setName] = useState('Claude Desktop')
  const [busy, setBusy] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const load = () => action<{ tokens: ApiToken[] }>('apitoken.list').then((r) => { setTokens(r.tokens); setUnavailable(false) }, () => { setTokens([]); setUnavailable(true) })
  useEffect(() => { load() }, [])
  const url = `${window.location.origin}/mcp`
  const orgId = account?.mode === 'auth' ? account.org.id : null
  const token = fresh ?? 'jsp.…'
  const stdioCfg = JSON.stringify({ mcpServers: { jaspe: { command: 'node', args: ['C:\\chemin\\vers\\Jaspe\\server\\mcp-stdio.js'], ...(orgId ? { env: { JASPE_ORG: orgId } } : {}) } } }, null, 2)
  const httpCfg = JSON.stringify({ mcpServers: { jaspe: { command: 'npx', args: ['-y', 'mcp-remote', url, '--header', 'Authorization:${JASPE_AUTH}'], env: { JASPE_AUTH: `Bearer ${token}` } } } }, null, 2)
  const cliCmd = `claude mcp add --transport http jaspe ${url} --header "Authorization: Bearer ${token}"`
  // Codex (CLI, app, extension) : le jeton reste dans une variable d’environnement, jamais dans le fichier.
  const codexCmd = `codex mcp add jaspe --url ${url} --bearer-token-env-var JASPE_TOKEN`
  const codexToml = `# ~/.codex/config.toml
[mcp_servers.jaspe]
url = "${url}"
bearer_token_env_var = "JASPE_TOKEN"`
  const codexEnv = `# Windows (PowerShell)
setx JASPE_TOKEN "${token}"
# macOS / Linux
export JASPE_TOKEN="${token}"`
  const copy = (t: string, what: string) => navigator.clipboard.writeText(t).then(() => toast(`${what} copié`), () => toast('Copie impossible : sélectionnez le texte', 'error'))
  const create = async () => {
    setBusy(true)
    try { const r = await action<{ token: string; name: string }>('apitoken.create', { name }); setFresh(r.token); audit(`a créé le jeton d’API « ${r.name} » (MCP)`, 'warn'); await load() }
    catch (e) { toast(errText(e), 'error') } finally { setBusy(false) }
  }
  const revoke = async (t: ApiToken) => {
    try { await action('apitoken.revoke', { id: t.id }); audit(`a révoqué le jeton d’API « ${t.name} »`, 'warn'); toast(`Jeton « ${t.name} » révoqué`); await load() }
    catch (e) { toast(errText(e), 'error') }
  }
  const active = (tokens ?? []).filter((t) => !t.revokedAt)
  const Code = ({ label, value }: { label: string; value: string }) => (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2"><span className="text-[11.5px] text-mist">{label}</span><SoftBtn onClick={() => copy(value, label)}>Copier</SoftBtn></div>
      <pre className="thin-scroll overflow-x-auto rounded-xl bg-ink-900/60 p-3 text-[11.5px] leading-relaxed text-bone/80 ring-1 ring-white/[0.06]">{value}</pre>
    </div>
  )
  return (
    <Card>
      <div className="flex items-start gap-3">
        <PlugsConnected size={20} weight="light" className="mt-0.5 shrink-0 text-champagne" />
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-medium">Jaspe dans Claude, Codex ou ChatGPT (MCP)</div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-bone/60">12 outils : lire vos dossiers, tâches du jour, validations en attente, temps gagné, conformité, ventes réelles comparables, et rechercher dans l’agence ; préparer un plan depuis un brief, une relance, un livrable ou une facture. <span className="text-bone">Rien n’est écrit sans vous</span> : chaque préparation arrive dans Tâches &amp; validations, à valider ou refuser.</p>
        </div>
      </div>
      {unavailable && <div className="mt-4 flex items-start gap-2 rounded-xl bg-champagne/[0.06] p-3 text-[12px] text-champagne-300 ring-1 ring-champagne/20"><Info size={14} className="mt-0.5 shrink-0" />Serveur MCP non disponible sur cette version (hors ligne ou démo statique) : lancez le serveur Jaspe pour créer un jeton.</div>}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="text-[11.5px] text-mist">Adresse du serveur (Streamable HTTP)</div>
          <div className="flex items-center gap-2"><code className="num min-w-0 flex-1 truncate rounded-xl bg-white/[0.03] px-3 py-2 text-[12.5px] ring-1 ring-white/[0.06]">{url}</code><SoftBtn onClick={() => copy(url, 'Adresse')}>Copier</SoftBtn></div>
          <div className="text-[11.5px] text-mist">Jetons d’API de l’agence</div>
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du jeton (ex. Claude Desktop)" aria-label="Nom du jeton" />
            <SoftBtn tone="gold" icon={<Key size={13} />} onClick={() => !busy && create()}>{busy ? 'Création…' : 'Créer un jeton'}</SoftBtn>
          </div>
          {fresh && (
            <div className="rounded-xl bg-sage/[0.07] p-3 ring-1 ring-sage/25">
              <div className="flex items-center gap-1.5 text-[12px] text-sage"><Warning size={13} />Copiez ce jeton maintenant : il ne sera plus affiché.</div>
              <div className="mt-2 flex items-center gap-2"><code className="num min-w-0 flex-1 break-all text-[12px] text-bone">{fresh}</code><SoftBtn onClick={() => copy(fresh, 'Jeton')}>Copier</SoftBtn><IconBtn label="Masquer le jeton" onClick={() => setFresh(null)}><X size={13} /></IconBtn></div>
            </div>
          )}
          <div className="divide-y divide-white/[0.05] rounded-xl ring-1 ring-white/[0.06]">
            {active.length === 0 ? <div className="p-3 text-[12px] text-mist">Aucun jeton actif.</div> : active.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 text-[12.5px]">
                <Key size={14} className="shrink-0 text-mist" />
                <div className="min-w-0 flex-1"><div className="truncate">{t.name} <span className="num text-mist">{t.hint}</span></div><div className="text-[11px] text-mist">Créé le {new Date(t.createdAt).toLocaleDateString('fr-FR')} · {t.lastUsedAt ? `utilisé le ${new Date(t.lastUsedAt).toLocaleString('fr-FR')}` : 'jamais utilisé'}</div></div>
                <IconBtn label={`Révoquer ${t.name}`} onClick={() => revoke(t)}><Trash size={14} /></IconBtn>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Code label="Claude Desktop · local (stdio)" value={stdioCfg} />
          <Code label="Claude Desktop · serveur (HTTP + jeton)" value={httpCfg} />
          <Code label="Claude Code" value={cliCmd} />
          <Code label="Codex · commande" value={codexCmd} />
          <Code label="Codex · ou à la main (config.toml)" value={codexToml} />
          <Code label="Codex · jeton dans une variable d’environnement" value={codexEnv} />
          <p className="text-[11px] leading-relaxed text-mist">ChatGPT : ajoutez un connecteur MCP personnalisé avec l’adresse ci-dessus et l’en-tête Authorization: Bearer &lt;jeton&gt;. L’adresse doit être joignable depuis Internet (HTTPS).</p>
        </div>
      </div>
    </Card>
  )
}

/* ——— Conformité ——— */
const CS: Record<string, 'sage' | 'coral' | 'mute' | 'sea'> = { 'Exprès': 'sage', 'Refus': 'coral', 'Expiré': 'mute', 'À recueillir': 'sea' }
const CS_TABS = ['tous', 'Exprès', 'À recueillir', 'Refus', 'Expiré'] as const
const sortActivity = (list: Activity[]) => [...list].sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''))
function Conformite() {
  const [consents] = useConsents()
  const [activity] = useActivity()
  const [ag, save] = useSetting('agency', useAgencyDefaults())
  const audit = useAudit()
  const [f, setF] = useState<(typeof CS_TABS)[number]>('tous')
  const [limit, setLimit] = useState(10)
  const savedRet = Object.fromEntries(RETENTION.map((r) => [r.id, ag.retention?.[r.id] ?? r.months])) as Record<string, number>
  const [ret, setRet] = useState(savedRet)
  const retKey = JSON.stringify(savedRet)
  useEffect(() => { setRet(JSON.parse(retKey)) }, [retKey])
  const aiAct = { ...AGENCY.aiAct, ...(ag.aiAct ?? {}) }
  const list = consents.filter((c) => f === 'tous' || c.status === f)
  const log = sortActivity(activity)
  const commitRet = (id: string, label: string) => { if (ret[id] !== savedRet[id]) save({ retention: { ...savedRet, [id]: ret[id] } }, `${label} : ${ret[id]} mois`).then((ok) => ok && audit(`a fixé la conservation « ${label} » à ${ret[id]} mois`)) }
  const phoneBlocked = consents.filter((c) => c.channel === 'Téléphone' && c.status !== 'Exprès').length
  const exportConsents = () => { download(`registre-consentements-${new Date().toISOString().slice(0, 10)}.csv`, csv([['Contact', 'Canal', 'Statut', 'Date', 'Expiration', 'Origine', 'Preuve'], ...consents.map((c) => [c.name, c.channel, c.status, c.date, c.expires, c.origin, c.proof])]), 'text/csv'); audit('a exporté le registre des consentements (CSV)', 'warn'); toast('Registre exporté (.csv)') }
  const exportAudit = () => { download(`journal-audit-${new Date().toISOString().slice(0, 10)}.csv`, csv([['Horodatage', 'Acteur', 'Action'], ...log.map((a) => [a.at ? new Date(a.at).toLocaleString('fr-FR') : a.t, a.who, a.what])]), 'text/csv'); toast('Journal exporté (.csv)') }
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-[1.3rem] bg-champagne/[0.06] p-4 ring-1 ring-champagne/20">
        <Scales size={20} weight="light" className="mt-0.5 shrink-0 text-champagne-300" />
        <div className="text-[12.5px] text-bone/75"><span className="text-bone">Depuis le 11 août 2026</span>, le démarchage téléphonique sans consentement préalable est interdit. Jaspe bloque tout appel ou SMS sortant vers un contact sans consentement valide et trace chaque preuve ci-dessous.</div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {([['Consentements exprès', consents.filter((c) => c.status === 'Exprès').length, 'text-sage'], ['À recueillir', consents.filter((c) => c.status === 'À recueillir').length, 'text-sea'], ['Refus & expirés', consents.filter((c) => c.status === 'Refus' || c.status === 'Expiré').length, 'text-coral'], ['Téléphone non appelable', phoneBlocked, 'text-bone']] as const).map(([l, v, c]) => <Card key={l}><div className="text-[11.5px] text-mist">{l}</div><div className={clsx('display mt-1 text-[2rem] leading-none', c)}>{v}</div></Card>)}
      </div>
      <Card title="Registre des consentements" kicker="Lecture seule · géré depuis Prospection" pad={false}
        action={<SoftBtn icon={<DownloadSimple size={13} />} onClick={exportConsents}>CSV</SoftBtn>}>
        <div className="px-5 pb-3"><Tabs id="rg-cs" value={f} onChange={setF} items={CS_TABS.map((s) => ({ id: s, label: s === 'tous' ? 'Tous' : s, count: s === 'tous' ? consents.length : consents.filter((c) => c.status === s).length }))} /></div>
        {!list.length ? <div className="px-5 pb-5"><Empty title="Aucun consentement">Aucun contact dans ce statut.</Empty></div> : (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full min-w-[820px] text-left text-[12.5px]">
              <thead className="text-[10.5px] uppercase tracking-eyebrow text-mist"><tr className="border-b border-white/[0.06]">{['Contact', 'Canal', 'Statut', 'Date', 'Expiration', 'Origine', 'Preuve'].map((h) => <th key={h} className="px-5 py-3 font-normal">{h}</th>)}</tr></thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="whitespace-nowrap px-5 py-3">{c.name}</td><td className="px-5 py-3 text-bone/70">{c.channel}</td>
                    <td className="px-5 py-3"><Tag tone={CS[c.status] ?? 'mute'}>{c.status}</Tag></td>
                    <td className="num px-5 py-3 text-bone/70">{c.date}</td><td className="num px-5 py-3 text-bone/70">{c.expires}</td><td className="px-5 py-3 text-bone/60">{c.origin}</td><td className="px-5 py-3 text-[11.5px] text-mist">{c.proof}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Durées de conservation" kicker="Purge automatique, journalisée">
          {RETENTION.map((r) => (
            <Row key={r.id} title={r.label} desc={r.legal}>
              <div className="flex items-center gap-3"><input type="range" min={1} max={72} value={ret[r.id]} onChange={(e) => setRet({ ...ret, [r.id]: +e.target.value })} onPointerUp={() => commitRet(r.id, r.label)} onKeyUp={() => commitRet(r.id, r.label)} className="w-28 accent-[rgb(var(--acc-500))]" aria-label={r.label} /><span className="num w-14 text-right text-[12px]">{ret[r.id]} mois</span></div>
            </Row>
          ))}
        </Card>
        <Card title="AI Act · transparence" kicker="Obligations applicables depuis août 2026">
          <Row title="Étiqueter automatiquement les images IA" desc="Mention visible sur chaque visuel retouché ou généré"><Toggle label="Étiquetage" on={aiAct.label} onChange={(v) => save({ aiAct: { ...aiAct, label: v } }, v ? 'Étiquetage IA activé' : 'Étiquetage IA désactivé').then((ok) => ok && audit(`${v ? 'a activé' : 'a désactivé'} l’étiquetage des images IA`, v ? 'neutral' : 'warn'))} /></Row>
          <Row title="Conserver l’original de chaque photo" desc="Restauration en un clic, preuve en cas de litige" tag={<Lock size={12} className="text-mist" />}><Toggle label="Original" on disabled /></Row>
          <Row title="Métadonnées de provenance C2PA" desc="Intégrées aux fichiers diffusés sur les portails"><Toggle label="C2PA" on={aiAct.c2pa} onChange={(v) => save({ aiAct: { ...aiAct, c2pa: v } }, 'Préférence C2PA enregistrée').then((ok) => ok && audit(`${v ? 'a activé' : 'a désactivé'} les métadonnées C2PA`))} /></Row>
          <Row title="Bloquer l’envoi sans validation humaine" desc="Règle verrouillée par le réseau" tag={<Lock size={12} className="text-mist" />}><Toggle label="Validation" on disabled /></Row>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/[0.05]">
            <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg"><img src={img('int-living')} alt="" className="h-full w-full object-cover" />{aiAct.label && <span className="theme-dark absolute bottom-1 left-1 rounded bg-ink/70 px-1 text-[7.5px] text-bone">IA</span>}</div>
            <div className="text-[11.5px] text-bone/55">Aperçu : « Image retouchée par intelligence artificielle, original disponible sur demande ».</div>
          </div>
        </Card>
      </div>
      <Card title="Journal d’audit" kicker={`${log.length} événements · conservé 5 ans`} action={<SoftBtn icon={<DownloadSimple size={13} />} onClick={exportAudit}>Exporter</SoftBtn>}>
        {!log.length ? <Empty title="Journal vide" /> : (
          <div className="relative space-y-3 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-white/[0.07]">
            {log.slice(0, limit).map((a) => (
              <div key={a.id} className="relative flex gap-4 pl-6">
                <span className={clsx('absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full ring-4 ring-ink-800', a.tone === 'warn' ? 'bg-coral' : a.tone === 'ai' ? 'bg-champagne' : a.tone === 'win' ? 'bg-sage' : 'bg-mist')} />
                <div className="min-w-0 flex-1 text-[12.5px]"><span className="font-medium">{a.who}</span> <span className="text-bone/60">{a.what}</span></div>
                <span className="num shrink-0 text-[11px] text-mist">{a.at ? new Date(a.at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : a.t}</span>
              </div>
            ))}
          </div>
        )}
        {log.length > limit && <div className="mt-4 flex justify-center"><SoftBtn onClick={() => setLimit(limit + 20)}>Afficher {Math.min(20, log.length - limit)} de plus</SoftBtn></div>}
      </Card>
    </div>
  )
}

/* ——— Notifications ——— */
const EVENTS = ['Livrable prêt à valider', 'Offre reçue', 'Nouveau lead vendeur', 'Dossier bloqué > 7 j', 'Routine terminée', 'Synthèse hebdomadaire']
const CHANNELS = [{ id: 'app', l: 'App', i: Desktop }, { id: 'push', l: 'Mobile', i: DeviceMobile }, { id: 'mail', l: 'Courriel', i: EnvelopeSimple }]
const NOTIF = { matrix: Object.fromEntries(EVENTS.flatMap((e, ei) => CHANNELS.map((c, ci) => [`${e}|${c.id}`, ci === 0 || (ci === 1 && ei < 4) || (ci === 2 && ei === 5)]))) as Record<string, boolean>, quietFrom: '20:00', quietTo: '08:00', weekend: true, urgent: true, digest: false }
function Notifications() {
  const [agency] = useSetting('agency', useAgencyDefaults())
  const [n, save] = useSetting('notifications', { ...NOTIF, quietFrom: agency.quietFrom, quietTo: agency.quietTo })
  const m = { ...NOTIF.matrix, ...(n.matrix ?? {}) }
  const h = (s: string) => { const [a, b] = s.split(':').map(Number); return a + (b || 0) / 60 }
  const f = h(n.quietFrom), tt = h(n.quietTo)
  const segs = f > tt ? [[f, 24], [0, tt]] : [[f, tt]]
  const time = (k: 'quietFrom' | 'quietTo', v: string) => { if (v && v !== n[k]) save({ [k]: v } as Partial<typeof NOTIF>, `Horaires calmes : ${k === 'quietFrom' ? v : n.quietFrom} → ${k === 'quietTo' ? v : n.quietTo}`) }
  return (
    <div className="space-y-6">
      <Card title="Canaux par événement" pad={false} kicker="Enregistré à chaque changement">
        <div className="overflow-x-auto thin-scroll px-2 pb-3">
          <table className="w-full min-w-[520px] text-[13px]">
            <thead><tr className="text-[10.5px] uppercase tracking-eyebrow text-mist"><th className="px-3 py-3 text-left font-normal">Événement</th>{CHANNELS.map((c) => <th key={c.id} className="px-3 py-3 font-normal"><span className="inline-flex items-center gap-1.5"><c.i size={13} />{c.l}</span></th>)}</tr></thead>
            <tbody>{EVENTS.map((e) => <tr key={e} className="border-t border-white/[0.04]"><td className="px-3 py-3 text-bone/80">{e}</td>{CHANNELS.map((c) => <td key={c.id} className="px-3 py-3"><div className="flex justify-center"><Toggle label={`${e} · ${c.l}`} on={!!m[`${e}|${c.id}`]} onChange={(v) => save({ matrix: { ...m, [`${e}|${c.id}`]: v } }, `${e} · ${c.l} ${v ? 'activé' : 'coupé'}`)} /></div></td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="px-5 pb-4 text-[11.5px] text-mist">Mobile et courriel : préférences consignées, connecteurs d’envoi non configurés sur ce serveur.</p>
      </Card>
      <Card title={<span className="flex items-center gap-2"><Moon size={16} weight="light" className="text-champagne-300" />Horaires calmes</span>} kicker="Aucune notification, aucun envoi client programmé">
        <div className="flex flex-wrap items-end gap-4">
          {(['quietFrom', 'quietTo'] as const).map((k) => (
            <label key={k}><span className="mb-1.5 block text-[10.5px] uppercase tracking-eyebrow text-mist">{k === 'quietFrom' ? 'De' : 'À'}</span><input type="time" key={n[k]} defaultValue={n[k]} onBlur={(e) => time(k, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} className="num rounded-xl bg-white/[0.03] px-3 py-2 text-[14px] text-bone outline-none ring-1 ring-white/[0.08] focus:ring-champagne/40" /></label>
          ))}
          <span className="pb-2 text-[12px] text-bone/50">Fuseau Europe/Paris · enregistré à la sortie du champ</span>
        </div>
        <div className="relative mt-6 h-10 rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06]">
          {segs.map(([a, b], i) => <motion.div key={i} layout className="absolute inset-y-1 rounded-lg bg-gradient-to-r from-sea/30 to-sea/10 ring-1 ring-sea/30" style={{ left: `${(a / 24) * 100}%`, width: `${((b - a) / 24) * 100}%` }} transition={{ duration: 0.5, ease: EXPO }} />)}
          <div className="absolute inset-x-0 -bottom-5 flex justify-between px-0.5">{[0, 6, 12, 18, 24].map((x) => <span key={x} className="num text-[9.5px] text-mist">{x}h</span>)}</div>
        </div>
        <div className="mt-8">
          <Row title="Week-end entier en mode calme" desc="Sauf RDV et visites inscrits à l’agenda"><Toggle label="Week-end" on={n.weekend} onChange={(v) => save({ weekend: v }, 'Préférence enregistrée')} /></Row>
          <Row title="Laisser passer les urgences" desc="Offre reçue, expiration imminente, signature du jour"><Toggle label="Urgences" on={n.urgent} onChange={(v) => save({ urgent: v }, 'Préférence enregistrée')} /></Row>
          <Row title="Résumé groupé au réveil" desc="Tout ce qui est arrivé pendant les horaires calmes, en une notification"><Toggle label="Résumé" on={n.digest} onChange={(v) => save({ digest: v }, 'Préférence enregistrée')} /></Row>
        </div>
      </Card>
    </div>
  )
}

/* ——— Facturation ——— */
type AuthMe = Extract<Me, { mode: 'auth' }>
const STATUS: Record<string, [string, 'sage' | 'sea' | 'champagne' | 'coral' | 'mute']> = {
  none: ['Gratuit, à vie', 'mute'], active: ['Abonnement actif', 'sage'], trialing: ['Période d’essai', 'sea'],
  past_due: ['Paiement en échec', 'coral'], unpaid: ['Impayé', 'coral'], canceled: ['Résilié', 'mute'], incomplete: ['Paiement à finaliser', 'coral'],
}
const dateFr = (s?: string) => (s ? new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '')

function Gauge({ label, used, max }: { label: string; used: number; max: number | null }) {
  const pct = max ? Math.min(100, (used / max) * 100) : 12
  return (
    <div>
      <div className="flex justify-between text-[12.5px]"><span className="text-bone/65">{label}</span><span className="num">{used}{max ? ` / ${max}` : ' · illimité'}</span></div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: EXPO }} className={clsx('h-full rounded-full', max && used > max ? 'bg-coral' : max && used >= max ? 'bg-champagne-300' : 'bg-champagne/70')} /></div>
      {max !== null && used > max && <p className="mt-1.5 text-[11.5px] text-coral">Au-delà du quota : les éléments en trop restent consultables, en lecture seule.</p>}
    </div>
  )
}

function Facturation() {
  const me = useMe()
  const [params, setParams] = useSearchParams()
  const [busy, setBusy] = useState<string | null>(null)
  const [period, setPeriod] = useState<'month' | 'year'>('month')
  const [opts, setOpts] = useState<string[]>([])
  const [seats, setSeats] = useState(7)
  useEffect(() => {
    const p = params.get('paiement')
    if (!p) return
    refreshMe()
    toast(p === 'ok' ? 'Paiement reçu : l’offre s’active dès la confirmation de Stripe' : 'Paiement annulé : rien n’a été prélevé', p === 'ok' ? 'ok' : 'info')
    const next = new URLSearchParams(params); next.delete('paiement'); setParams(next, { replace: true })
  }, [params, setParams])
  const a: AuthMe | null = me?.mode === 'auth' ? me : null
  const go = (key: string, path: string, body?: unknown) => {
    setBusy(key)
    authCall<{ url: string }>('POST', path, body).then((r) => { window.location.href = r.url }, (e) => { toast(errText(e), 'error'); setBusy(null) })
  }
  const owner = a?.user.role === 'owner'
  const subscribed = !!a && a.plan.customer && ['active', 'trialing', 'past_due'].includes(a.plan.status)
  const canPay = !!a?.billing.configured && owner
  const [statusLabel, statusTone]: [string, 'sage' | 'sea' | 'champagne' | 'coral' | 'mute'] = a ? STATUS[a.plan.status] ?? [a.plan.status, 'mute'] : ['Démonstration', 'mute']
  return (
    <div className="space-y-6">
      {!a && (
        <div className="flex items-start gap-3 rounded-2xl bg-sea/10 p-4 text-[13px] text-bone/80 ring-1 ring-sea/20">
          <Info size={17} className="mt-0.5 shrink-0 text-sea" />
          <span><strong className="font-medium">Mode démonstration : paiement non actif.</strong> Aucun compte ni abonnement sur ce poste. Les comptes et le paiement Stripe s’activent sur un serveur lancé avec <code className="num">JASPE_AUTH=1</code>. <a href="/tarifs" className="text-champagne-300 hover:underline">Voir les tarifs</a></span>
        </div>
      )}
      {a && !a.billing.configured && (a.billing.beta ? (
        <div className="flex items-start gap-3 rounded-2xl bg-sage/10 p-4 text-[13px] text-bone/80 ring-1 ring-sage/25">
          <Info size={17} className="mt-0.5 shrink-0 text-sage" />
          <span><strong className="font-medium">Bêta gratuite.</strong> Tout est ouvert pendant la bêta : dossiers illimités, jusqu’à 7 conseillers, aucune carte demandée. Les abonnements ouvriront plus tard ; vous serez prévenu avant tout prélèvement.</span>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-2xl bg-coral/10 p-4 text-[13px] text-bone/80 ring-1 ring-coral/20">
          <Warning size={17} className="mt-0.5 shrink-0 text-coral" />
          <span><strong className="font-medium">Paiement non configuré sur ce serveur.</strong> Aucune somme ne peut être prélevée tant que la clé Stripe n’est pas renseignée. Vous restez sur votre offre actuelle.</span>
        </div>
      ))}
      {a && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
          <div className="relative overflow-hidden rounded-[1.4rem] p-px">
            <div className="absolute inset-0 rounded-[1.4rem] bg-[conic-gradient(from_200deg_at_50%_50%,rgb(var(--acc-500)_/_.55),rgb(var(--acc-500)_/_.05),rgb(var(--sea)_/_.3),rgb(var(--acc-500)_/_.05),rgb(var(--acc-500)_/_.55))]" />
            <div className="relative h-full rounded-[calc(1.4rem-1px)] bg-ink-800 p-6">
              <div className="flex items-center justify-between gap-3"><div className="text-[10.5px] uppercase tracking-eyebrow text-mist">Offre actuelle · {a.org.name}</div><Tag tone={statusTone}>{statusLabel}</Tag></div>
              <div className="display mt-2 text-[2.6rem]">{a.plan.label}</div>
              <div className="mt-1 text-[12.5px] text-bone/60">
                {a.plan.status === 'past_due' || a.plan.status === 'unpaid' ? 'Le dernier paiement a échoué : l’offre Découverte s’applique jusqu’au règlement. Vos données sont conservées.'
                  : a.plan.status === 'canceled' ? 'Abonnement résilié : retour à Découverte. Vos données sont conservées.'
                  : a.plan.cancelAtPeriodEnd ? `Résiliation enregistrée : l’offre reste active jusqu’au ${dateFr(a.plan.periodEnd)}.`
                  : a.plan.periodEnd ? `${a.plan.period === 'year' ? 'Annuel' : 'Mensuel'} · renouvellement le ${dateFr(a.plan.periodEnd)}` : 'Sans engagement, sans carte bancaire.'}
              </div>
              {a.plan.options.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{a.plan.options.map((o) => <Tag key={o} tone="champagne">{PLAN_OPTIONS.find((x) => x.id === o)?.name ?? o}</Tag>)}</div>}
              <div className="mt-6 flex flex-wrap gap-2">
                {a.plan.customer && owner && <SoftBtn tone="gold" onClick={() => go('portal', 'billing/portal')}>{busy === 'portal' ? 'Ouverture…' : 'Gérer ou résilier'}</SoftBtn>}
                <a href="/tarifs" className="rounded-full px-3 py-1.5 text-[12.5px] text-bone/60 ring-1 ring-white/10 hover:text-bone">Comparer les offres</a>
              </div>
              {a.plan.customer && owner && <p className="mt-3 text-[11.5px] text-mist">Portail Stripe : factures, moyen de paiement, sièges, résiliation en un clic.</p>}
            </div>
          </div>
          <Card title="Quotas" kicker="Selon votre offre">
            <div className="space-y-5">
              <Gauge label="Dossiers actifs" used={a.usage.dossiers} max={a.limits.dossiers} />
              <Gauge label="Sièges" used={a.usage.seats} max={a.limits.seats} />
            </div>
            <p className="mt-4 text-[11.5px] text-mist">Un dossier arrivé à l’acte ou archivé ne compte plus. Les invitations en attente occupent un siège.</p>
          </Card>
        </div>
      )}
      <Card title={subscribed ? 'Changer d’offre' : 'Passer à une offre payante'} kicker="Sans engagement · 15 jours remboursés">
        {a && !owner && <p className="mb-4 text-[12.5px] text-bone/60">Seul le responsable de l’agence gère l’abonnement.</p>}
        {subscribed && owner && <p className="mb-4 text-[12.5px] text-bone/60">Un abonnement est en cours : changez d’offre, de sièges ou d’options depuis « Gérer ou résilier ».</p>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((p) => {
            const current = a?.plan.id === p.id
            return (
              <div key={p.id} className={clsx('flex flex-col rounded-2xl p-4 ring-1', current ? 'bg-champagne/[0.07] ring-champagne/30' : 'bg-white/[0.02] ring-white/[0.06]')}>
                <div className="flex items-center justify-between"><span className="text-[14.5px] font-medium">{p.name}</span>{current && <Tag tone="champagne">Actuelle</Tag>}</div>
                <div className="mt-2"><span className="num text-[1.5rem]">{p.id === 'solo' && period === 'year' ? '99' : p.price}</span> <span className="text-[12px] text-mist">{p.id === 'solo' && period === 'year' ? '€ / an' : p.unit}</span></div>
                <div className="mt-1 text-[12px] text-bone/60">{p.dossiers} · {p.seats}</div>
                {p.id === 'solo' && <div className="mt-3 flex gap-1">{(['month', 'year'] as const).map((v) => <button key={v} onClick={() => setPeriod(v)} aria-pressed={period === v} className={clsx('rounded-full px-2.5 py-1 text-[11.5px] ring-1', period === v ? 'bg-bone text-ink ring-bone' : 'text-bone/60 ring-white/10')}>{v === 'month' ? 'Mensuel' : 'Annuel'}</button>)}</div>}
                {p.id === 'agence' && <label className="mt-3 flex items-center gap-2 text-[12px] text-bone/60">Sièges <input type="number" min={7} max={200} value={seats} onChange={(e) => setSeats(Math.max(7, Math.min(200, Number(e.target.value) || 7)))} className="w-16 rounded-lg bg-white/[0.04] px-2 py-1 text-bone ring-1 ring-white/10" />{seats > 7 && <span className="num">+{(seats - 7) * 6} € / mois</span>}</label>}
                <div className="mt-auto pt-4">
                  {p.id !== 'decouverte' && !current && (
                    canPay && !subscribed
                      ? <SoftBtn tone="gold" onClick={() => !busy && go(p.id, 'billing/checkout', { plan: p.id, period: p.id === 'solo' ? period : 'month', options: opts, seats })}>{busy === p.id ? 'Redirection vers Stripe…' : `Passer à ${p.name}`}</SoftBtn>
                      : <span className="text-[11.5px] text-mist">{!a ? 'Paiement non actif en démonstration' : !owner ? 'Réservé au responsable' : subscribed ? 'Via « Gérer ou résilier »' : a.billing.beta ? 'Inclus pendant la bêta' : 'Paiement non configuré'}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {PLAN_OPTIONS.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/[0.06]">
              <input type="checkbox" className="mt-1" checked={opts.includes(o.id)} onChange={(e) => setOpts((x) => (e.target.checked ? [...x, o.id] : x.filter((y) => y !== o.id)))} />
              <span><span className="text-[13px]">{o.name} <span className="num text-champagne-300">{o.price}</span></span><span className="block text-[11.5px] text-mist">{o.desc}</span></span>
            </label>
          ))}
        </div>
        <p className="mt-4 flex items-start gap-2 text-[11.5px] text-mist"><Info size={13} className="mt-0.5 shrink-0" />Paiement par Stripe : Jaspe ne voit pas votre carte. Remboursement sous 15 jours et garantie « 2 h gagnées ou mois remboursé » : traités à la main pour l’instant, demande via le bouton retour de l’application.</p>
      </Card>
    </div>
  )
}

/** Comptes réels (JASPE_AUTH=1) : membres, invitations par lien à usage unique. */
type TeamState = { members: { id: string; name: string; email: string; role: string }[]; invites: { id: string; expiresAt: string }[]; limits: { seats: number }; usage: { seats: number } }
function AccountTeam({ me: a }: { me: AuthMe }) {
  const [team, setTeam] = useState<TeamState | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const load = () => authCall<TeamState>('GET', 'team').then(setTeam, (e) => toast(errText(e), 'error'))
  useEffect(() => { load() }, [])
  const owner = a.user.role === 'owner'
  const invite = () => {
    setBusy(true)
    authCall<{ path: string }>('POST', 'team/invite').then((r) => { setLink(`${window.location.origin}${r.path}`); load(); refreshMe() }, (e) => toast(errText(e), 'error')).finally(() => setBusy(false))
  }
  const copy = () => { if (link) navigator.clipboard?.writeText(link).then(() => toast('Lien copié'), () => toast('Copie impossible : sélectionnez le lien', 'info')) }
  const drop = (path: string, ok: string) => authCall('DELETE', path).then(() => { toast(ok); load(); refreshMe() }, (e) => toast(errText(e), 'error'))
  return (
    <Card title="Comptes de l’agence" kicker={team ? `${team.usage.seats} siège${team.usage.seats > 1 ? 's' : ''} occupé${team.usage.seats > 1 ? 's' : ''} sur ${team.limits.seats}` : 'Chargement…'}
      action={owner && <SoftBtn tone="gold" icon={<Plus size={13} />} onClick={() => !busy && invite()}>{busy ? 'Création…' : 'Inviter un conseiller'}</SoftBtn>}>
      {link && (
        <div className="mb-4 rounded-xl bg-champagne/[0.07] p-3 ring-1 ring-champagne/25">
          <div className="text-[12px] text-bone/75">Lien d’invitation à usage unique, valable 7 jours. Aucun e-mail n’est envoyé : copiez-le et transmettez-le au conseiller.</div>
          <div className="mt-2 flex items-center gap-2"><input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-lg bg-white/[0.04] px-3 py-2 text-[12px] text-bone ring-1 ring-white/10" /><SoftBtn onClick={copy}>Copier</SoftBtn></div>
        </div>
      )}
      <div className="divide-y divide-white/[0.04]">
        {team?.members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 py-2.5">
            <Initials name={m.name} />
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2 truncate text-[13px]">{m.name}{m.id === a.user.id && <Tag tone="champagne">Vous</Tag>}</div><div className="truncate text-[11px] text-mist">{m.email} · {m.role === 'owner' ? 'Responsable' : 'Conseiller'}</div></div>
            {owner && m.role !== 'owner' && <IconBtn label={`Retirer ${m.name}`} onClick={() => drop(`team/members/${m.id}`, `${m.name} n’a plus accès à l’agence`)}><Trash size={14} /></IconBtn>}
          </div>
        ))}
        {team?.invites.map((iv) => (
          <div key={iv.id} className="flex items-center gap-3 py-2.5">
            <EnvelopeSimple size={16} className="mx-2 shrink-0 text-mist" />
            <div className="min-w-0 flex-1 text-[12.5px] text-bone/70">Invitation en attente · expire le {new Date(iv.expiresAt).toLocaleDateString('fr-FR')}</div>
            {owner && <IconBtn label="Annuler l’invitation" onClick={() => drop(`team/invites/${iv.id}`, 'Invitation annulée')}><X size={13} /></IconBtn>}
          </div>
        ))}
      </div>
      {!owner && <p className="mt-3 text-[11.5px] text-mist">Seul le responsable de l’agence invite ou retire des conseillers.</p>}
    </Card>
  )
}

/* ——— Sécurité ——— */
function Securite() {
  const who = useIdentity()
  const [s, save] = useSetting('security', SECURITY)
  const audit = useAudit()
  const sso = { ...SECURITY.sso, ...(s.sso ?? {}) }
  const revoked = s.revoked ?? []
  // Compte réel : seul l’appareil courant est connu (pas de liste d’appareils de démonstration).
  const allSessions = who.real ? [{ device: 'Ce navigateur', place: Intl.DateTimeFormat().resolvedOptions().timeZone, last: 'Session actuelle', current: true }] : SESSIONS
  const sessions = allSessions.filter((x) => !revoked.includes(x.device))
  const set = (patch: Partial<typeof SECURITY>, ok: string, log: string) => save(patch, ok).then((v) => v && audit(log, 'warn'))
  const account = useMe()
  const logout = () => authCall('POST', 'auth/logout').then(() => { resetLocalData(); window.location.href = '/connexion' }, (e) => toast(errText(e), 'error'))
  return (
    <div className="space-y-6">
      {account?.mode === 'auth' && (
        <Card title="Votre compte" kicker={`${account.user.email} · ${account.org.name}`}>
          <Row title="Se déconnecter de cet appareil" desc="La session expire de toute façon après 30 jours."><SoftBtn icon={<SignOut size={13} />} onClick={logout}>Se déconnecter</SoftBtn></Row>
        </Card>
      )}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Authentification" kicker="Double facteur">
          <Row title={<span className="flex items-center gap-2"><Fingerprint size={16} weight="light" className="text-champagne-300" />Double authentification</span>} desc={who.real ? 'Clé d’accès (passkey) ou code à usage unique' : 'Clé d’accès (passkey) sur ce Mac et l’iPhone'} tag={s.mfa ? <Tag tone="sage">Active</Tag> : <Tag tone="coral">Inactive</Tag>}><Toggle label="MFA" on={s.mfa} onChange={(v) => set({ mfa: v }, v ? 'Double authentification activée' : 'Double authentification désactivée', `${v ? 'a activé' : 'a désactivé'} sa double authentification`)} /></Row>
          <Row title="Imposer la double authentification à toute l’agence" desc="Les membres sans MFA seront invités à l’activer à la prochaine connexion"><Toggle label="MFA agence" on={s.mfaAll} onChange={(v) => set({ mfaAll: v }, 'Politique MFA enregistrée', `${v ? 'a imposé' : 'n’impose plus'} la MFA à l’agence`)} /></Row>
          <Row title="Restreindre aux adresses IP des agences" desc="Accès mobile toujours autorisé avec MFA"><Toggle label="IP" on={s.ip} onChange={(v) => set({ ip: v }, 'Restriction IP enregistrée', `${v ? 'a activé' : 'a désactivé'} la restriction IP`)} /></Row>
          <Row title="Déconnexion après inactivité"><Pill label="Délai" value={s.timeout} options={['1 heure', '4 heures', '8 heures', '24 heures']} onChange={(v) => set({ timeout: v }, `Déconnexion après ${v}`, `a fixé la déconnexion automatique à ${v}`)} /></Row>
        </Card>
        <Card title="Authentification unique (SSO)" kicker="Annuaire d’entreprise">
          {([['Google', 'Google Workspace', who.real ? 'Comptes Google de l’agence' : 'maison-riviera.fr · 34 comptes'], ['Microsoft', 'Microsoft Entra ID', who.real ? 'Comptes Microsoft de l’agence' : 'Pour Cannes et Mougins'], ['SAML', 'SAML 2.0 personnalisé', 'Okta, JumpCloud…']] as const).map(([k, l, d]) => (
            <Row key={k} title={<span className="flex items-center gap-2"><Key size={15} weight="light" className="text-bone/60" />{l}</span>} desc={d}
              tag={sso[k] ? <Tag tone="sage">Configuré · simulé</Tag> : undefined}>
              <SoftBtn tone={sso[k] ? 'ghost' : 'gold'} onClick={() => save({ sso: { ...sso, [k]: !sso[k] } }).then((ok) => { if (!ok) return; audit(`${sso[k] ? 'a désactivé' : 'a configuré'} le SSO ${l}`, 'warn'); toast(sso[k] ? `${l} désactivé` : `${l} : fournisseur d’identité non configuré — réglage consigné`, sso[k] ? 'ok' : 'info') })}>{sso[k] ? 'Désactiver' : 'Configurer'}</SoftBtn>
            </Row>
          ))}
        </Card>
      </div>
      <Card title="Sessions actives" kicker={`${sessions.length} appareil${sessions.length > 1 ? 's' : ''}`} action={<div className="flex gap-2">{revoked.length > 0 && <SoftBtn onClick={() => save({ revoked: [] }, 'Liste des sessions réinitialisée (démo)')}>Réinitialiser</SoftBtn>}{sessions.length > 1 && <SoftBtn icon={<SignOut size={13} />} onClick={() => set({ revoked: allSessions.filter((x) => !x.current).map((x) => x.device) }, 'Autres sessions révoquées', 'a révoqué toutes ses autres sessions')}>Déconnecter les autres</SoftBtn>}</div>}>
        <AnimatePresence initial={false}>
          {sessions.map((x) => (
            <motion.div key={x.device} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: EXPO }} className="overflow-hidden">
              <Row title={<span className="flex items-center gap-2">{x.device.includes('iPhone') ? <DeviceMobile size={16} weight="light" /> : <Desktop size={16} weight="light" />}{x.device}</span>} desc={`${x.place} · ${x.last}`}
                tag={x.current ? <Tag tone="champagne">Cet appareil</Tag> : undefined}>
                {!x.current && <SoftBtn onClick={() => set({ revoked: [...revoked, x.device] }, `Session ${x.device} révoquée`, `a révoqué la session ${x.device}`)}>Révoquer</SoftBtn>}
              </Row>
            </motion.div>
          ))}
        </AnimatePresence>
      </Card>
    </div>
  )
}

const MOOD: Record<string, string> = { bloque: 'Bloqué', lent: 'Trop long', idee: 'Idée', top: 'Ça aide' }
function Beta() {
  const [items] = useFeedback()
  const exp = () => download('retours-beta-jaspe.csv', csv([['Date', 'Ressenti', 'Page', 'Retour'], ...items.map((f) => [new Date(f.at).toLocaleString('fr-FR'), MOOD[f.mood ?? ''] ?? '', f.page ?? '', f.text])]))
  return (
    <div className="space-y-6">
      <Card title="Retours des bêta-testeurs" kicker="Bouton bulle en haut de chaque écran" action={items.length > 0 && <SoftBtn icon={<DownloadSimple size={14} />} onClick={exp}>Exporter CSV</SoftBtn>}>
        {items.length === 0 ? <Empty title="Aucun retour pour l’instant">Les testeurs envoient un retour depuis l’icône bulle de la barre du haut ; il est rattaché à l’écran utilisé.</Empty> : (
          <ul className="divide-y divide-white/[0.06]">
            {items.map((f) => (
              <li key={f.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:gap-4">
                <span className="num w-36 shrink-0 text-[11.5px] text-mist">{new Date(f.at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="w-24 shrink-0 text-[12px] text-champagne-300">{MOOD[f.mood ?? ''] ?? '—'}</span>
                <span className="min-w-0 flex-1 text-[13.5px] text-bone/85">{f.text}<span className="block text-[11px] text-mist">{f.page}</span></span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

const VIEWS: Record<Section, () => ReactNode> = {
  profil: Profil, reseau: Reseau, equipe: Equipe, marque: Marque, integrations: Integrations, conformite: Conformite, notifications: Notifications, facturation: Facturation, securite: Securite, beta: Beta,
}

export default function Reglages() {
  const [params, setParams] = useSearchParams()
  const sec = (SECTIONS.some((s) => s.id === params.get('s')) ? params.get('s') : 'profil') as Section
  const setSec = (s: Section) => setParams(s === 'profil' ? {} : { s }, { replace: true })
  const cur = SECTIONS.find((s) => s.id === sec)!
  const View = VIEWS[sec]
  const [integrations] = useIntegrations()
  const { setTheme } = useTheme()
  const errors = integrations.filter((i) => i.status === 'erreur').length
  // Mode « Système » : sans préférence mémorisée, le thème suit l’appareil en direct.
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: light)')
    const on = () => { if (!storedTheme()) { setTheme(mq.matches ? 'light' : 'dark'); try { localStorage.removeItem('nxt-theme') } catch { /* indisponible */ } } }
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [setTheme])
  return (
    <div>
      <PageHeader kicker="Compte, agence & réseau" title={<>Vos <span className="italic text-champagne-300">réglages</span></>}
        sub="Chaque modification est enregistrée en base et les changements sensibles sont tracés dans le journal d’audit. Les réglages verrouillés par le réseau s’affichent avec un cadenas."
        actions={<SoftBtn icon={<Sparkle size={13} weight="fill" className="text-champagne" />} onClick={() => window.dispatchEvent(new Event('nxt:copilot'))}>Demander au copilote</SoftBtn>} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[236px_1fr]">
        <Stagger>
          <nav className="lg:sticky lg:top-24">
            <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 scrollbar-none lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
              {SECTIONS.map((s) => (
                <button key={s.id} onClick={(e) => { setSec(s.id); e.currentTarget.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }) }} className={clsx('relative flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13.5px] transition-colors', sec === s.id ? 'text-bone' : 'text-bone/55 hover:text-bone')}>
                  {sec === s.id && <motion.span layoutId="rg-nav" className="absolute inset-0 rounded-xl bg-white/[0.06] ring-1 ring-white/[0.08]" transition={{ duration: 0.5, ease: EXPO }} />}
                  <s.icon size={17} weight={sec === s.id ? 'regular' : 'light'} className={clsx('relative', sec === s.id && 'text-champagne-300')} />
                  <span className="relative flex-1 whitespace-nowrap">{s.label}</span>
                  {s.id === 'integrations' && errors > 0 && <span className="relative flex items-center gap-1 text-[10.5px] text-coral"><Warning size={12} weight="fill" />{errors}</span>}
                </button>
              ))}
            </div>
            <div className="mt-6 hidden rounded-2xl bg-white/[0.02] p-4 text-[11.5px] text-bone/50 ring-1 ring-white/[0.05] lg:block"><ShieldCheck size={16} weight="light" className="mb-2 text-sage" />Données de l’agence dans une base séparée, mots de passe chiffrés (scrypt), session en cookie sécurisé. Hébergement de production : à confirmer avant ouverture.</div>
          </nav>
        </Stagger>
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key={sec} initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5, ease: EXPO }}>
              <div className="mb-5 flex items-baseline gap-3"><h2 className="display text-[2rem]">{cur.label}</h2><span className="text-[12.5px] text-mist">{cur.hint}</span></div>
              <View />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
