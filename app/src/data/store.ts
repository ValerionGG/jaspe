// Couche de données : cache partagé par collection, API REST, temps réel (SSE) et repli hors ligne.
// Chaque collection est amorcée par le premier client qui la lit (POST /api/seed/:col), puis la base fait foi.
import { useEffect, useSyncExternalStore } from 'react'
import { live } from './live'
import { localEngine } from './localEngine'

export type Doc = { id: string } & Record<string, unknown>
type Status = 'connecting' | 'online' | 'offline'

const cache = new Map<string, Doc[]>()
const subs = new Map<string, Set<() => void>>()
const loading = new Map<string, Promise<void>>()
const seeds = new Map<string, Doc[]>()
/** Version statique en ligne : pas d’API, tout tourne dans le navigateur (moteur embarqué + stockage local). */
const STATIC = import.meta.env.VITE_STATIC === '1'
let status: Status = STATIC ? 'offline' : 'connecting'
const statusSubs = new Set<() => void>()

const LS = (col: string) => `nxt:col:${col}`
const notify = (col: string) => { live[col] = cache.get(col); subs.get(col)?.forEach((f) => f()) }
const setStatus = (s: Status) => { if (s !== status) { status = s; statusSubs.forEach((f) => f()) } }
const saveLocal = (col: string) => { try { localStorage.setItem(LS(col), JSON.stringify(cache.get(col))) } catch { /* quota */ } }
const readLocal = (col: string): Doc[] | null => { try { const v = localStorage.getItem(LS(col)); return v ? JSON.parse(v) : null } catch { return null } }

export class ApiError extends Error { status: number; constructor(status: number, message: string) { super(message); this.status = status } }

async function raw(method: string, path: string, body?: unknown) {
  if (STATIC) throw new TypeError('Version statique : pas de serveur')
  const r = await fetch(`/api/${path}`, { method, headers: body === undefined ? undefined : { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
  const json = await r.json().catch(() => ({}))
  if (!r.ok) throw new ApiError(r.status, (json as { error?: string }).error ?? `Erreur ${r.status}`)
  setStatus('online')
  return { json, seeded: r.headers.get('x-nxt-seeded') !== '0' }
}
async function http<T>(method: string, path: string, body?: unknown): Promise<T> { return (await raw(method, path, body)).json as T }

async function load(col: string) {
  try {
    const r = await raw('GET', col)
    let docs = r.json as Doc[]
    const seed = seeds.get(col)
    if (!r.seeded && seed?.length) docs = await http<Doc[]>('POST', `seed/${col}`, seed)
    cache.set(col, docs)
  } catch (e) {
    if (e instanceof ApiError) throw e
    setStatus('offline')
    cache.set(col, readLocal(col) ?? cache.get(col) ?? seeds.get(col) ?? [])
  }
  notify(col)
}
const ensure = (col: string) => { if (!loading.has(col)) loading.set(col, load(col).catch(() => {})); return loading.get(col)! }

/** Temps réel : le serveur signale chaque écriture, on recharge la collection concernée. */
let stream: EventSource | null = null
function connect() {
  if (STATIC || stream || typeof EventSource === 'undefined') return
  stream = new EventSource('/api/stream')
  stream.onopen = () => { setStatus('online'); for (const col of cache.keys()) loading.set(col, load(col)) }
  stream.onerror = () => setStatus(navigator.onLine ? 'connecting' : 'offline')
  let pending = new Set<string>(), timer = 0
  stream.onmessage = (ev) => {
    const { col } = JSON.parse(ev.data) as { col: string }
    if (!cache.has(col)) return
    pending.add(col)
    clearTimeout(timer)
    timer = window.setTimeout(() => { const cols = pending; pending = new Set(); cols.forEach((c) => loading.set(c, load(c))) }, 120)
  }
}

function mutateLocal(col: string, fn: (docs: Doc[]) => Doc[]) {
  cache.set(col, fn(cache.get(col) ?? seeds.get(col) ?? []))
  notify(col)
  if (status !== 'online') saveLocal(col)
}

export type Ops<T> = {
  create: (doc: Partial<T>) => Promise<T>
  update: (id: string, patch: Partial<T>) => Promise<void>
  remove: (id: string) => Promise<void>
  reload: () => Promise<void>
}

export function opsFor<T extends Doc>(col: string): Ops<T> {
  return {
    async create(doc) {
      const tmp = { ...doc, id: (doc.id as string) ?? `tmp_${Math.random().toString(36).slice(2, 9)}` } as T
      mutateLocal(col, (d) => [tmp, ...d])
      if (status === 'offline') return tmp
      try { const saved = await http<T>('POST', col, doc); mutateLocal(col, (d) => d.map((x) => (x.id === tmp.id ? saved : x))); return saved }
      catch (e) { if (e instanceof ApiError) { mutateLocal(col, (d) => d.filter((x) => x.id !== tmp.id)); throw e } setStatus('offline'); saveLocal(col); return tmp }
    },
    async update(id, patch) {
      const before = cache.get(col)
      mutateLocal(col, (d) => d.map((x) => (x.id === id ? { ...x, ...patch } : x)))
      if (status === 'offline') return
      try { await http('PATCH', `${col}/${encodeURIComponent(id)}`, patch) }
      catch (e) { if (e instanceof ApiError) { cache.set(col, before ?? []); notify(col); throw e } setStatus('offline'); saveLocal(col) }
    },
    async remove(id) {
      mutateLocal(col, (d) => d.filter((x) => x.id !== id))
      if (status === 'offline') return
      try { await http('DELETE', `${col}/${encodeURIComponent(id)}`) } catch (e) { if (!(e instanceof ApiError)) { setStatus('offline'); saveLocal(col) } }
    },
    reload: () => load(col),
  }
}

/**
 * Collection vivante. `seed` sert d’amorce (base vide) et d’affichage immédiat avant la réponse du serveur.
 * Retourne [documents, opérations].
 */
export function useCollection<T extends Doc>(col: string, seed: readonly T[] = []): [T[], Ops<T>] {
  if (!seeds.has(col) && seed.length) seeds.set(col, seed as unknown as Doc[])
  const docs = useSyncExternalStore(
    (f) => { if (!subs.has(col)) subs.set(col, new Set()); subs.get(col)!.add(f); return () => subs.get(col)!.delete(f) },
    () => (cache.get(col) ?? (seed as unknown as Doc[])),
  ) as unknown as T[]
  useEffect(() => { connect(); ensure(col) }, [col])
  return [docs, opsFor<T>(col)]
}

export function useDoc<T extends Doc>(col: string, id: string | undefined, seed: readonly T[] = []): T | undefined {
  const [docs] = useCollection<T>(col, seed)
  return docs.find((d) => d.id === id)
}

/** Moteur embarqué (même code que le serveur) branché sur le cache local. */
const embedded = () => localEngine({
  read: (col) => cache.get(col) ?? readLocal(col) ?? seeds.get(col) ?? [],
  write: (col, docs) => { cache.set(col, docs); notify(col); saveLocal(col) },
})

/** Action métier : serveur si joignable, sinon moteur embarqué dans le navigateur. */
export async function action<R = unknown>(name: string, payload: Record<string, unknown> = {}): Promise<R> {
  if (status !== 'offline') {
    try { return await http<R>('POST', `actions/${name}`, payload) }
    catch (e) { if (e instanceof ApiError) throw e; setStatus('offline') }
  }
  const fn = embedded().actions[name]
  if (!fn) throw new ApiError(404, `Action inconnue : ${name}`)
  try { return (await fn(payload)) as R }
  catch (e) { const err = e as { status?: number; message?: string }; throw new ApiError(err.status ?? 500, err.message ?? 'Erreur') }
}

export async function askCopilot(question: string, history: { from: string; text: string }[]) {
  return http<{ text: string; cites?: string[]; actions?: string[]; link?: string; mode: string; warning?: string }>('POST', 'copilot', { question, history })
}

export async function uploadFile(file: File, dossierId?: string) {
  const data = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] ?? ''); r.onerror = rej; r.readAsDataURL(file) })
  try { return await http<Doc>('POST', 'files', { name: file.name, type: file.type, data, dossierId }) }
  catch (e) {
    if (e instanceof ApiError) throw e
    // Sans serveur : le fichier reste dans ce navigateur (limite 1,5 Mo pour le stockage local).
    if (file.size > 1.5e6) throw new ApiError(413, 'Sans serveur, les fichiers sont limités à 1,5 Mo')
    const doc = { id: `f_${Math.random().toString(36).slice(2, 10)}`, name: file.name, type: file.type, size: file.size, dossierId, at: new Date().toISOString(), url: `data:${file.type};base64,${data}` }
    mutateLocal('files', (d) => [doc, ...d])
    return doc as Doc
  }
}

export function useApiStatus(): Status {
  useEffect(() => { connect() }, [])
  return useSyncExternalStore((f) => { statusSubs.add(f); return () => statusSubs.delete(f) }, () => status)
}
