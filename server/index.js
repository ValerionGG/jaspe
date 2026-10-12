// Serveur NXT Agent : API REST + actions métier + flux SSE + fichiers + application compilée.
import { createServer } from 'node:http'
import { readFile, writeFile, stat, mkdir } from 'node:fs/promises'
import { join, extname, normalize, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { openDb, COLLECTIONS } from './db.js'
import { createEngine, HttpError } from './engine.js'
import { createCopilot } from './copilot.js'

const here = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 5318)
const DIST = join(here, '..', 'app', 'dist')
const FILES = join(here, 'data', 'files')
const MAX_BODY = 12 * 1024 * 1024
const TICK_MS = Number(process.env.NXT_TICK_MS ?? 60_000)

export function createApp({ dbPath = join(here, 'data', 'nxt.sqlite'), filesDir = FILES, delay } = {}) {
  const db = openDb(dbPath)
  const clients = new Set()
  const emit = (col, id, op = 'put') => { const msg = `data: ${JSON.stringify({ col, id, op })}\n\n`; for (const c of clients) c.write(msg) }
  const engine = createEngine(db, emit, delay ? { delay } : undefined)
  const copilot = createCopilot(db)

  const send = (res, status, body, headers = {}) => {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers })
    res.end(body === undefined ? '' : JSON.stringify(body))
  }
  const readBody = (req) => new Promise((resolve, reject) => {
    let size = 0; const chunks = []
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(new HttpError(413, 'Corps trop volumineux')); req.destroy() } else chunks.push(c) })
    req.on('end', () => { if (!chunks.length) return resolve({}); try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) } catch { reject(new HttpError(400, 'JSON invalide')) } })
    req.on('error', reject)
  })
  const col = (name) => { if (!COLLECTIONS.has(name)) throw new HttpError(404, `Collection inconnue : ${name}`); return name }

  async function api(req, res, parts) {
    const [head, a, b] = parts
    const m = req.method
    if (head === 'health') return send(res, 200, { ok: true, copilot: copilot.mode, engine: engine.ENGINE_IDS, clients: clients.size })
    if (head === 'stream') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' })
      res.write('retry: 3000\n\n'); clients.add(res)
      const ping = setInterval(() => res.write(': ping\n\n'), 25_000)
      req.on('close', () => { clearInterval(ping); clients.delete(res) })
      return
    }
    if (head === 'copilot' && m === 'POST') { const { question, history } = await readBody(req); if (!question?.trim()) throw new HttpError(400, 'Question vide'); return send(res, 200, await copilot.ask(String(question).slice(0, 2000), history)) }
    if (head === 'actions' && m === 'POST') {
      const fn = engine.actions[a]
      if (!fn) throw new HttpError(404, `Action inconnue : ${a}`)
      return send(res, 200, (await fn(await readBody(req))) ?? { ok: true })
    }
    if (head === 'seed' && m === 'POST') {
      const docs = await readBody(req)
      if (!Array.isArray(docs)) throw new HttpError(400, 'Tableau attendu')
      const seeded = db.seed(col(a), docs)
      if (seeded) emit(a, '*', 'seed')
      return send(res, 200, db.list(a))
    }
    if (head === 'files') {
      if (m === 'POST' && !a) {
        const { name, type, data, dossierId } = await readBody(req)
        if (!name || !data) throw new HttpError(400, 'Fichier incomplet')
        const id = `f_${randomUUID().slice(0, 10)}`
        await mkdir(filesDir, { recursive: true })
        const buf = Buffer.from(String(data), 'base64')
        await writeFile(join(filesDir, id), buf)
        const doc = db.put('files', { id, name: String(name).slice(0, 200), type: type || 'application/octet-stream', size: buf.length, dossierId, at: new Date().toISOString() }, { front: true })
        emit('files', id)
        return send(res, 201, doc)
      }
      if (m === 'GET' && a && b === 'raw') {
        const f = db.get('files', a)
        if (!f) throw new HttpError(404, 'Fichier introuvable')
        const buf = await readFile(join(filesDir, f.id))
        res.writeHead(200, { 'content-type': f.type, 'content-disposition': `inline; filename*=UTF-8''${encodeURIComponent(f.name)}` })
        return res.end(buf)
      }
    }
    if (head && !a) {
      if (m === 'GET') return send(res, 200, db.list(col(head)), { 'x-nxt-seeded': db.isSeeded(head) ? '1' : '0' })
      if (m === 'POST') { const doc = await readBody(req); if (typeof doc !== 'object' || Array.isArray(doc)) throw new HttpError(400, 'Objet attendu'); const d = db.put(col(head), doc, { front: true }); emit(head, d.id); return send(res, 201, d) }
    }
    if (head && a) {
      col(head)
      if (m === 'GET') { const d = db.get(head, a); return d ? send(res, 200, d) : send(res, 404, { error: 'Introuvable' }) }
      if (m === 'PATCH') { const d = db.patch(head, a, await readBody(req)); if (!d) throw new HttpError(404, 'Introuvable'); emit(head, a); return send(res, 200, d) }
      if (m === 'PUT') { const d = db.put(head, { ...(await readBody(req)), id: a }); emit(head, a); return send(res, 200, d) }
      if (m === 'DELETE') { const ok = db.remove(head, a); emit(head, a, 'delete'); return send(res, ok ? 200 : 404, { ok }) }
    }
    throw new HttpError(405, 'Méthode non prise en charge')
  }

  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
  async function staticFile(req, res, path) {
    const safe = normalize(decodeURIComponent(path)).replace(/^([/\\])+/, '')
    let file = join(DIST, safe)
    if (!file.startsWith(DIST)) return send(res, 403, { error: 'Interdit' })
    try { if (!(await stat(file)).isFile()) throw 0 } catch { file = join(DIST, 'index.html') }
    try {
      const buf = await readFile(file)
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': file.includes('assets') ? 'public, max-age=31536000, immutable' : 'no-cache' })
      res.end(buf)
    } catch { send(res, 404, { error: 'Application non compilée — lancez npm run build dans app/' }) }
  }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost')
    try {
      if (url.pathname.startsWith('/api/')) return await api(req, res, url.pathname.slice(5).split('/').filter(Boolean).map((x) => decodeURIComponent(x)))
      return await staticFile(req, res, url.pathname)
    } catch (e) {
      const status = e instanceof HttpError ? e.status : Number.isInteger(e?.status) ? e.status : 500
      if (status === 500) console.error(e)
      if (!res.headersSent) send(res, status, { error: e.message ?? 'Erreur serveur' })
    }
  })
  return { server, db, engine, copilot }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1])) {
  const { server, engine, copilot } = createApp()
  server.listen(PORT, '127.0.0.1', () => console.log(`NXT Agent — API sur http://127.0.0.1:${PORT} · copilote : ${copilot.mode}`))
  setTimeout(() => engine.tick(), 5000)
  setInterval(() => engine.tick(), TICK_MS)
}
