// Moteur métier embarqué : le même code que le serveur (server/engine.js), exécuté dans le navigateur
// quand aucune API n’est joignable (version en ligne statique, mode hors connexion).
import { createEngine } from '../../../server/engine.js'

type Doc = { id: string } & Record<string, unknown>
export type LocalStore = {
  read: (col: string) => Doc[]
  write: (col: string, docs: Doc[]) => void
}

let engine: ReturnType<typeof createEngine> | null = null
let timer = 0

export function localEngine(store: LocalStore) {
  if (engine) return engine
  const uid = (col: string) => `${col.slice(0, 3)}_${Math.random().toString(36).slice(2, 10)}`
  const db = {
    list: (col: string) => store.read(col),
    get: (col: string, id: string) => store.read(col).find((d) => d.id === id) ?? null,
    count: (col: string) => store.read(col).length,
    put(col: string, doc: Doc, { front = false } = {}) {
      if (!doc.id) doc.id = uid(col)
      const docs = store.read(col)
      const i = docs.findIndex((d) => d.id === doc.id)
      store.write(col, i >= 0 ? docs.map((d, k) => (k === i ? doc : d)) : front ? [doc, ...docs] : [...docs, doc])
      return doc
    },
    patch(col: string, id: string, patch: Record<string, unknown>) {
      const cur = store.read(col).find((d) => d.id === id)
      if (!cur) return null
      const next = { ...cur, ...patch, id }
      store.write(col, store.read(col).map((d) => (d.id === id ? next : d)))
      return next
    },
    remove(col: string, id: string) { const docs = store.read(col); store.write(col, docs.filter((d) => d.id !== id)); return docs.some((d) => d.id === id) },
    isSeeded: () => true,
    seed: () => false,
  }
  engine = createEngine(db, () => { /* la mise à jour du cache notifie déjà les vues */ })
  // Routines : même cadence que le serveur.
  timer = window.setInterval(() => { engine?.tick() }, 60_000)
  setTimeout(() => engine?.tick(), 4000)
  return engine
}

export const stopLocalEngine = () => { clearInterval(timer); engine = null }
