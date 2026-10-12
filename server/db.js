// Magasin de documents JSON sur SQLite natif (node:sqlite) — une table, des collections.
import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export const COLLECTIONS = new Set([
  'dossiers', 'properties', 'buyers', 'contacts', 'events', 'queue', 'tasks', 'transactions', 'activity',
  'routines', 'runs', 'campaigns', 'consents', 'ideas', 'documents', 'settings', 'integrations', 'leads',
  'notifications', 'files', 'outbox', 'notes', 'agents', 'coaching',
  'conversations', 'messages', 'reminders', 'templates', 'tutorials',
])

export function openDb(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS docs (col TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, pos INTEGER NOT NULL, updated TEXT NOT NULL, PRIMARY KEY (col, id));
    CREATE INDEX IF NOT EXISTS docs_col ON docs(col, pos);
    CREATE TABLE IF NOT EXISTS seeded (col TEXT PRIMARY KEY, at TEXT NOT NULL);`)
  const q = {
    list: db.prepare('SELECT data FROM docs WHERE col = ? ORDER BY pos'),
    get: db.prepare('SELECT data FROM docs WHERE col = ? AND id = ?'),
    count: db.prepare('SELECT COUNT(*) AS n FROM docs WHERE col = ?'),
    maxPos: db.prepare('SELECT COALESCE(MAX(pos), 0) AS p, COALESCE(MIN(pos), 0) AS m FROM docs WHERE col = ?'),
    put: db.prepare('INSERT INTO docs (col, id, data, pos, updated) VALUES (?, ?, ?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data, updated = excluded.updated'),
    del: db.prepare('DELETE FROM docs WHERE col = ? AND id = ?'),
    isSeeded: db.prepare('SELECT 1 AS y FROM seeded WHERE col = ?'),
    markSeeded: db.prepare('INSERT OR IGNORE INTO seeded (col, at) VALUES (?, ?)'),
    insertIgnore: db.prepare('INSERT OR IGNORE INTO docs (col, id, data, pos, updated) VALUES (?, ?, ?, ?, ?)'),
  }
  const now = () => new Date().toISOString()
  const api = {
    list: (col) => q.list.all(col).map((r) => JSON.parse(r.data)),
    get: (col, id) => { const r = q.get.get(col, id); return r ? JSON.parse(r.data) : null },
    count: (col) => q.count.get(col).n,
    /** Insère ou remplace. `front` place le document en tête de liste (fils d’activité). */
    put(col, doc, { front = false } = {}) {
      if (!doc.id) doc.id = `${col.slice(0, 3)}_${randomUUID().slice(0, 8)}`
      const existing = q.get.get(col, doc.id)
      const { p, m } = q.maxPos.get(col)
      q.put.run(col, doc.id, JSON.stringify(doc), existing ? 0 : front ? m - 1 : p + 1, now())
      return doc
    },
    patch(col, id, patch) {
      const cur = api.get(col, id)
      if (!cur) return null
      const next = { ...cur, ...patch, id }
      q.put.run(col, id, JSON.stringify(next), 0, now())
      return next
    },
    remove: (col, id) => q.del.run(col, id).changes > 0,
    isSeeded: (col) => !!q.isSeeded.get(col),
    /** Amorce une collection une seule fois ; n’écrase jamais un document déjà créé (par le moteur ou un utilisateur). */
    seed(col, docs) {
      if (q.isSeeded.get(col)) return false
      const { p } = q.maxPos.get(col)
      db.exec('BEGIN')
      try {
        docs.forEach((d, i) => { const id = String(d.id ?? `${col}_${i}`); q.insertIgnore.run(col, id, JSON.stringify({ ...d, id }), p + i + 1, now()) })
        q.markSeeded.run(col, now())
        db.exec('COMMIT')
      } catch (e) { db.exec('ROLLBACK'); throw e }
      return true
    },
    db,
  }
  return api
}
