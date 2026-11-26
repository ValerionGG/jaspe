// Types, libellés et accès API du back-office plateforme (routes /api/admin/*).
import { useCallback, useEffect, useState } from 'react'
import { authCall, type PlanId, type VerificationState } from '../data/store'
import { errText } from '../crm/forms'

export type CheckStatus = 'ok' | 'ko' | 'manuel'
export type KycCheck = { id: string; label: string; status: CheckStatus; detail: string; source: string }
export type Kyc = {
  companyId?: string; legalName?: string; cardNumber?: string; managerName?: string; address?: string
  submittedAt?: string; submittedBy?: string
  result?: { at: string; checks: KycCheck[]; score: Score }
}
export type Score = { ok: number; ko: number; manuel: number }
export type Usage = Record<'dossiers' | 'properties' | 'contacts' | 'buyers' | 'documents' | 'tasks' | 'invoices' | 'files' | 'timelog' | 'proofs', number>
export type OrgSummary = {
  id: string; name: string; country: string; plan: PlanId; status: string; createdAt: string
  verification: VerificationState; kycSubmitted: boolean; kycScore: Score | null
  members: number; usage: Usage; sizeBytes: number | null
}
export type LogEntry = { id: string; at: string; admin: string; orgId: string | null; action: string; detail: string | null }
export type Member = { id: string; email: string; name: string; role: string; createdAt: string }
export type Invite = { id: string; role: string; expiresAt: string; createdAt: string }
export type OrgDetail = OrgSummary & {
  org: { id: string; name: string; country: string; plan: PlanId; status: string; seats: number; period?: string | null; options: string[]; periodEnd?: string | null; createdAt: string }
  kyc: Kyc; modules: Record<string, boolean>; moduleOverrides: Record<string, boolean>; adminNote: string | null
  membersList: Member[]; invites: Invite[]; log: LogEntry[]
}
export type Overview = {
  orgs: number; users: number; newOrgs7d: number; pending: number
  byPlan: Record<string, number>; byCountry: Record<string, number>; byVerification: Record<string, number>; recent: LogEntry[]
}
export type PlanCfg = { label: string; price: number; priceYear?: number | null; dossiers: number | null; seats: number; seatPrice?: number | null; visible?: boolean }
export type ModuleCfg = { label: string; core: boolean; enabled: boolean; plans: string[] | null }
export type Config = {
  plans: Record<string, PlanCfg>; options: Record<string, { label: string; price: number }>
  modules: Record<string, ModuleCfg>; settings: { requireVerification: boolean }
}

export const VERIF_LABEL: Record<VerificationState, string> = { en_attente: 'En attente', valide: 'Validée', refuse: 'Refusée', suspendu: 'Suspendue' }
export const VERIF_TONE: Record<VerificationState, 'gold' | 'green' | 'red' | 'neutral'> = { en_attente: 'gold', valide: 'green', refuse: 'red', suspendu: 'red' }
export const PLAN_LABEL: Record<string, string> = { decouverte: 'Découverte', solo: 'Solo', agence: 'Agence', beta: 'Bêta' }
export const STATUS_LABEL: Record<string, string> = { active: 'Active', trialing: 'Essai', none: 'Sans abonnement', canceled: 'Résiliée', past_due: 'Impayée' }
export const COUNTRY_LABEL: Record<string, string> = { FR: 'France', PT: 'Portugal' }
export const USAGE_LABEL: Record<keyof Usage, string> = {
  dossiers: 'Dossiers', properties: 'Biens', contacts: 'Contacts', buyers: 'Acquéreurs', documents: 'Documents',
  tasks: 'Tâches', invoices: 'Factures', files: 'Fichiers', timelog: 'Temps mesuré', proofs: 'Preuves',
}
const ACTION_LABEL: Record<string, string> = {
  'verification:en_attente': 'Remise en attente', 'verification:valide': 'Agence validée', 'verification:refuse': 'Agence refusée', 'verification:suspendu': 'Agence suspendue',
  'kyc:controle': 'Contrôles relancés', 'kyc:depot': 'Dossier de vérification déposé', modules: 'Modules de l’agence', offre: 'Changement d’offre',
  export: 'Export des données', note: 'Note interne', configuration: 'Configuration de la plateforme', 'admin:ajoute': 'Administrateur ajouté', 'admin:retire': 'Administrateur retiré',
}
export const actionLabel = (a: string) => ACTION_LABEL[a] ?? a

/** Détail JSON d’une entrée du journal rendu en texte lisible. */
export function detailText(entry: LogEntry): string {
  if (!entry.detail) return ''
  let d: unknown
  try { d = JSON.parse(entry.detail) } catch { return entry.detail }
  if (d === null || d === undefined) return ''
  if (typeof d !== 'object') return String(d)
  const o = d as Record<string, unknown>
  if (entry.action.startsWith('kyc:') && 'ok' in o) return `${o.ok} conforme(s), ${o.ko} en échec, ${o.manuel} à vérifier à la main`
  if (entry.action.startsWith('verification:')) return o.note ? `Motif : ${String(o.note)}` : ''
  if (entry.action === 'offre') return `${PLAN_LABEL[String(o.plan)] ?? String(o.plan)} · ${STATUS_LABEL[String(o.status)] ?? String(o.status)}${o.seats ? ` · ${String(o.seats)} siège(s)` : ''}`
  if (entry.action === 'modules') { const e = Object.entries(o); return e.length ? e.map(([k, v]) => `${k} ${v ? 'forcé oui' : 'forcé non'}`).join(', ') : 'Tous les modules suivent le réglage global' }
  if (entry.action.startsWith('admin:')) return String(o.email ?? '')
  if (entry.action === 'configuration') return Object.keys(o).map((k) => ({ plans: 'tarifs', options: 'options', modules: 'modules', settings: 'réglages' })[k] ?? k).join(', ') + ' modifié(s)'
  return Object.entries(o).map(([k, v]) => `${k} : ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`).join(' · ')
}

export const dateTime = (iso: string) => new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
export const dateShort = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
export const bytes = (n: number | null) => n === null ? '—' : n < 1024 ? `${n} o` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1).replace('.', ',')} Ko` : `${(n / 1024 ** 2).toFixed(1).replace('.', ',')} Mo`
export const isUrl = (s: string) => /^https?:\/\//.test(s)

/** Lecture d’une route d’administration, avec rechargement. `path` sans le préfixe /api. */
export function useAdminGet<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!path) return
    let off = false
    authCall<T>('GET', path).then((d) => { if (!off) { setData(d); setError('') } }, (e) => { if (!off) setError(errText(e)) })
    return () => { off = true }
  }, [path, tick])
  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, error, reload, setData }
}
