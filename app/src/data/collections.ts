// Accès typé à chaque collection, avec son amorce canonique. Les pages utilisent ces hooks, jamais les constantes brutes.
import { useCollection, type Doc } from './store'
import { DOSSIERS, AGENTS, BUYERS, TASKS, ACTIVITY, AGENCIES, type Dossier, type Agent, type Buyer, type Task } from './mock'
import { LISTINGS, CAMPAIGNS, CONSENTS, type Listing, type Campaign, type Consent as ProspectConsent } from './geo'
import { EVENTS, QUEUE, CONTACTS, TXS, type CalEvent, type QItem, type Contact, type Tx } from './ops'
import { INTEGRATIONS, type Integration } from './pilot'

const json = import.meta.glob<{ default: unknown[] }>('./{routines,routines-extra,ideas}.json', { eager: true })
const arr = (k: string) => ((json[k]?.default ?? []) as Record<string, unknown>[])

export type Routine = { id: string; family: string; name: string; trigger: string; conditions: string; action: string; autonomy: 'A' | 'V' | 'P'; success: string; fallback: string; phase: string; enabled?: boolean }
export type Run = { id: string; routineId: string; name: string; at: string; status: 'ok' | 'fail' | 'wait'; detail: string; ms: number; cost: number }
export type Activity = { id: string; t: string; at?: string; who: string; what: string; tone: string; link?: string }
export type Notification = { id: string; at: string; title: string; body: string; tone: string; read: boolean; link?: string }
export type DocumentDoc = { id: string; dossierId: string; code: string; title: string; kind: 'email' | 'message' | 'letter' | 'social' | 'report' | 'checklist'; to?: string; subject?: string; body: string[]; posts?: { network: string; text: string; label?: string }[]; items?: { label: string; state: string; ref: string }[]; matches?: { id: string; name: string; score: number }[]; range?: [number, number]; sources: { label: string; date: string }[]; checks?: string[]; status: string; version: number; createdAt: string; validatedAt?: string; edited?: boolean }
export type Outbox = { id: string; dossierId: string; code: string; to: string; subject: string; status: string; at: string; channel: string; sentAt?: string }
export type Lead = { id: string; name: string; email: string; org?: string; size?: string; at: string; status: string; source: string }
export type Idea = { id: string; theme: string; title: string; benefit: string; phase: string; effort: string; impact: number; kind: string; status: string; votes?: number; sprint?: boolean }
export type FileDoc = { id: string; name: string; type: string; size: number; dossierId?: string; at: string }
export type Note = { id: string; dossierId?: string; contactId?: string; text: string; at: string; by: string }
export type Settings = { id: string } & Record<string, unknown>

const ROUTINES: Routine[] = [...arr('./routines.json'), ...arr('./routines-extra.json')].map((r) => ({ ...(r as Routine), enabled: (r as Routine).phase !== 'P2' }))
const IDEAS = arr('./ideas.json') as Idea[]
const ACTIVITY_SEED: Activity[] = ACTIVITY.map((a, i) => ({ ...a, id: `act${i}` }))
const AGENCIES_SEED = AGENCIES.map((a, i) => ({ ...a, id: `ag${i}` }))
const SETTINGS: Settings[] = [
  { id: 'agency', agencyName: 'Maison Riviera · Antibes', signature: 'Claire Delmas — Conseillère senior', primary: '#1C4C66', accent: '#C9A97C', quietFrom: '20:00', quietTo: '08:00' },
  { id: 'profile', name: 'Claire Delmas', email: 'claire.delmas@maison-riviera.fr', phone: '+33 6 11 22 33 44', copilotTone: 'sobre', briefTime: '07:30' },
]

const c = <T extends Doc>(col: string, seed: readonly unknown[]) => () => useCollection<T>(col, seed as T[])
export const useDossiers = c<Dossier & Doc>('dossiers', DOSSIERS)
export const useProperties = c<Listing & Doc>('properties', LISTINGS)
export const useAgents = c<Agent & Doc>('agents', AGENTS)
export const useBuyers = c<Buyer & Doc>('buyers', BUYERS)
export const useTasks = c<Task & Doc>('tasks', TASKS)
export const useEvents = c<CalEvent & Doc>('events', EVENTS)
export const useQueue = c<QItem & Doc>('queue', QUEUE)
export const useContacts = c<Contact & Doc>('contacts', CONTACTS)
export const useTransactions = c<Tx & Doc>('transactions', TXS)
export const useActivity = c<Activity & Doc>('activity', ACTIVITY_SEED)
export const useRoutines = c<Routine & Doc>('routines', ROUTINES)
export const useRuns = c<Run & Doc>('runs', [])
export const useNotifications = c<Notification & Doc>('notifications', [])
export const useDocuments = c<DocumentDoc & Doc>('documents', [])
export const useOutbox = c<Outbox & Doc>('outbox', [])
export const useLeads = c<Lead & Doc>('leads', [])
export const useIdeas = c<Idea & Doc>('ideas', IDEAS)
export const useCampaigns = c<Campaign & Doc>('campaigns', CAMPAIGNS)
export const useConsents = c<ProspectConsent & Doc>('consents', CONSENTS)
export const useIntegrations = c<Integration & Doc>('integrations', INTEGRATIONS.map((x) => ({ ...x, id: x.name })))
export const useFiles = c<FileDoc & Doc>('files', [])
export const useNotes = c<Note & Doc>('notes', [])
export const useSettings = c<Settings & Doc>('settings', SETTINGS)
export const useAgencies = () => AGENCIES_SEED

// ——— Messagerie ———
import { CONVERSATIONS, MESSAGES, TEMPLATES, REMINDERS, type Conversation, type Message, type Template, type Reminder } from './messaging'
export const useConversations = c<Conversation & Doc>('conversations', CONVERSATIONS)
export const useMessages = c<Message & Doc>('messages', MESSAGES)
export const useTemplates = c<Template & Doc>('templates', TEMPLATES)
export const useReminders = c<Reminder & Doc>('reminders', REMINDERS)
