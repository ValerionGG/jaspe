// Serveur Jaspe : API REST + actions métier + flux SSE + fichiers + application compilée.
import { createServer } from 'node:http'
import { readFile, writeFile, stat, mkdir } from 'node:fs/promises'
import { join, extname, normalize, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID, createHash, createHmac } from 'node:crypto'
import { openDb, COLLECTIONS } from './db.js'
import { createEngine, HttpError } from './engine.js'
import { createCopilot } from './copilot.js'
import { createAccounts, createGate, demoRoute, orgPaths } from './auth.js'
import { createBilling } from './billing.js'
import { createEvidence } from './evidence.js'
import { createMailer, sendOutbox, sendDueOutbox, createMailActions } from './mailer.js'
import { mcpActions, handleMcpHttp } from './mcp.js'
import { createContractReader } from './contract.js'
import { createMarket } from './market.js'
import { createWhatsApp } from './whatsapp.js'
import Anthropic from '@anthropic-ai/sdk'

const here = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 5318)
const DIST = join(here, '..', 'app', 'dist')
const FILES = join(here, 'data', 'files')
// 10 Mo de pièce client encodés en base64 ≈ 13,4 Mo.
const MAX_BODY = 15 * 1024 * 1024
const TICK_MS = Number(process.env.NXT_TICK_MS ?? 60_000)

export function createApp({ dbPath = join(here, 'data', 'jaspe.sqlite'), filesDir = FILES, delay, auth = process.env.JASPE_AUTH === '1', dataDir = join(here, 'data'), env = process.env, fetch: stripeFetch } = {}) {
  // SMTP (SMTP_HOST…) : sans configuration, les envois restent consignés comme avant.
  const mailer = createMailer({ env })
  // Client Claude partagé (lecture des compromis) ; sans clé, extraction par règles.
  const anthropic = env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN ? new Anthropic() : null
  // Un contexte = une base, son moteur, son copilote et ses clients SSE. Démo : un seul ; comptes : un par agence.
  const makeCtx = (dbFile, dir, orgId) => {
    const db = openDb(dbFile)
    const clients = new Set()
    const emit = (col, id, op = 'put') => { const msg = `data: ${JSON.stringify({ col, id, op })}\n\n`; for (const c of clients) c.write(msg) }
    // Données de marché réelles (DVF en France ; Casafari si l’agence a déjà un compte).
    // Jamais de réseau pendant les tests (node --test) ni si JASPE_MARKET=off : l’appel échoue proprement et la veille revient aux biens de démonstration.
    const offline = env.JASPE_MARKET === 'off' || !!process.env.NODE_TEST_CONTEXT
    const market = createMarket({ db, fetch: offline ? async () => { throw new Error('Données de marché désactivées (hors ligne)') } : globalThis.fetch, env })
    const engine = createEngine(db, emit, { ...(delay ? { delay } : {}), market })
    engine.extend({ actions: market.actions })
    // Pack Preuves : empreintes SHA-256 et fichiers déposés par le client, branchés ici (API Node).
    const evidence = createEvidence(db, {
      emit, HttpError,
      sha256: (b) => createHash('sha256').update(b).digest('hex'),
      saveFile: async (id, bytes) => { await mkdir(dir, { recursive: true }); await writeFile(join(dir, id), bytes) },
      evaluate: (id) => engine.actions['compliance.evaluate']({ dossierId: id }),
      setCompliance: (p) => engine.actions['compliance.set'](p),
    })
    const create = evidence.actions['evidence.link.create']
    // Avec les comptes, le lien porte l’agence (« orgId.jeton ») pour que la page publique sache quelle base ouvrir.
    const actions = orgId ? { ...evidence.actions, 'evidence.link.create': async (p) => { const r = await create(p); return { ...r, token: `${orgId}.${r.token}`, path: `/depot/${orgId}.${r.token}` } } } : evidence.actions
    engine.extend({ actions, rules: evidence.rules })
    // MCP : propositions dans la file de validation, exécutées seulement après accord du conseiller.
    engine.extend({ actions: mcpActions(engine, db, { orgId, emit }) })
    // E-mails réels des livrables validés (jamais sans validation), heures calmes respectées.
    const mp = (c, i, p) => { const d = db.patch(c, i, p); if (d) emit(c, i); return d }
    const act = (who, what, tone, link) => { const d = db.put('activity', { at: new Date().toISOString(), who, what, tone, link }, { front: true }); emit('activity', d.id) }
    // Compromis / CPCV en PDF → dates, conditions, pièces ; rien n’est appliqué sans validation.
    engine.extend({ actions: createContractReader({ db, put: (c, d, o2) => { const x = db.put(c, d, o2); emit(c, x.id); return x }, patch: mp, activity: act, HttpError, client: anthropic, readFileBytes: (id) => readFile(join(dir, id)) }).actions })
    // Débrief par WhatsApp (texte ou vocal) → plan proposé dans la file de validation.
    const wa = createWhatsApp({
      db, put: (c, d, o2) => { const x = db.put(c, d, o2); emit(c, x.id); return x }, patch: mp,
      remove: (c, i2) => { db.remove(c, i2); emit(c, i2, 'delete') }, activity: act,
      notify: (title, body, tone = 'info', link) => { const d = db.put('notifications', { at: new Date().toISOString(), title, body, tone, link, read: false }, { front: true }); emit('notifications', d.id); return d },
      HttpError, env, hmac: (k, b) => createHmac('sha256', k).update(b).digest('hex'), apply: (p) => engine.actions['assistant.apply'](p),
    })
    engine.extend({ actions: wa.actions })
    engine.extend({
      actions: { ...createMailActions(db, mailer), ...(mailer.configured ? { 'outbox.send': ({ id }) => sendOutbox(db, mailer, id, { patch: mp, activity: act }) } : {}) },
      rules: mailer.configured ? { 'AUT-MAIL': () => { sendDueOutbox(db, mailer, { patch: mp, activity: act }).catch(() => {}); return ['skip', 'Envois programmés traités'] } } : {},
    })
    return { db, clients, emit, engine, evidence, wa, copilot: createCopilot(db), filesDir: dir }
  }
  const main = auth ? null : makeCtx(dbPath, filesDir)
  const { db, engine, copilot } = main ?? {}
  const orgs = new Map()
  const openOrg = (orgId) => { if (!orgs.has(orgId)) { const p = orgPaths(dataDir, filesDir, orgId); orgs.set(orgId, makeCtx(p.dbPath, p.filesDir, orgId)) } return orgs.get(orgId) }

  /** Page publique de dépôt client (sans compte) : /api/public/depot/:jeton[/file|/declaration]. */
  async function publicDepot(req, res, [, , raw, sub]) {
    let ctx = main, token = String(raw ?? '')
    if (auth) {
      const i = token.indexOf('.')
      const orgId = i > 0 ? token.slice(0, i) : ''
      // Jamais d’ouverture de base pour un identifiant d’agence inconnu.
      if (!/^[A-Za-z0-9_-]{4,64}$/.test(orgId) || !accounts.getOrg(orgId)) throw new HttpError(404, 'Lien inconnu')
      ctx = openOrg(orgId); token = token.slice(i + 1)
    }
    const h = ctx.evidence.publicHandlers
    if (req.method === 'GET' && !sub) return send(res, 200, await h.read(token))
    if (req.method === 'POST' && sub === 'file') return send(res, 201, await h.upload(token, await readBody(req)))
    if (req.method === 'POST' && sub === 'declaration') return send(res, 200, await h.declare(token, await readBody(req)))
    throw new HttpError(405, 'Méthode non prise en charge')
  }

  const send = (res, status, body, headers = {}) => {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers })
    res.end(body === undefined ? '' : JSON.stringify(body))
  }
  const readBody = (req) => req._jaspeBody !== undefined ? Promise.resolve(req._jaspeBody) : new Promise((resolve, reject) => {
    let size = 0; const chunks = []
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(new HttpError(413, 'Corps trop volumineux')); req.destroy() } else chunks.push(c) })
    req.on('end', () => { if (!chunks.length) return resolve({}); try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) } catch { reject(new HttpError(400, 'JSON invalide')) } })
    req.on('error', reject)
  })
  const col = (name) => { if (!COLLECTIONS.has(name)) throw new HttpError(404, `Collection inconnue : ${name}`); return name }

  const accounts = auth ? createAccounts(dataDir === ':memory:' ? ':memory:' : join(dataDir, 'accounts.sqlite')) : null
  const billing = auth ? createBilling({ accounts, env, ...(stripeFetch ? { fetch: stripeFetch } : {}) }) : null
  const gate = auth ? createGate({ accounts, billing, openOrg, send, readBody, mailer, publicUrl: env.JASPE_PUBLIC_URL, beta: env.JASPE_BETA === '1' ? true : env.JASPE_BETA === '0' ? false : undefined }) : null

  async function api(req, res, parts, { db, engine, copilot, clients, emit, filesDir } = main) {
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
      // Webhook WhatsApp : corps BRUT pour vérifier la signature. Démo uniquement (le routage numéro → agence n’existe pas encore en mode comptes).
      if (url.pathname === '/api/whatsapp/webhook') {
        if (!main) throw new HttpError(501, 'Débrief WhatsApp non disponible en mode comptes pour l’instant')
        const raw = req.method === 'POST' ? await new Promise((resolve, reject) => { const c = []; let n = 0; req.on('data', (d) => { n += d.length; if (n > 1024 * 1024) { reject(new HttpError(413, 'Corps trop volumineux')); req.destroy() } else c.push(d) }); req.on('end', () => resolve(Buffer.concat(c))); req.on('error', reject) }) : Buffer.alloc(0)
        const r = await main.wa.handleWebhook(req, raw, url.searchParams)
        res.writeHead(r.status, { 'content-type': r.contentType ?? 'text/plain; charset=utf-8' }); res.end(r.body ?? '')
        r.done?.catch?.(console.error)
        return
      }
      if (url.pathname === '/mcp') return await handleMcpHttp(req, res, gate ? { openOrg, accounts } : main)
      if (url.pathname.startsWith('/api/')) {
        const parts = url.pathname.slice(5).split('/').filter(Boolean).map((x) => decodeURIComponent(x))
        if (parts[0] === 'public' && parts[1] === 'depot') return await publicDepot(req, res, parts)
        if (!gate) return demoRoute(req, res, parts, send) || await api(req, res, parts)
        const ctx = await gate.handle(req, res, parts)
        return ctx ? await api(req, res, parts, ctx) : undefined
      }
      return await staticFile(req, res, url.pathname)
    } catch (e) {
      const status = e instanceof HttpError ? e.status : Number.isInteger(e?.status) ? e.status : 500
      if (status === 500) console.error(e)
      if (!res.headersSent) send(res, status, { error: e.message ?? 'Erreur serveur' })
    }
  })
  // Routines : la base de démo, ou chaque agence ayant une session ouverte.
  const tick = () => (gate ? gate.tick() : engine.tick())
  return { server, db, engine, copilot, accounts, billing, openOrg, tick }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1])) {
  const { server, copilot, accounts, tick } = createApp()
  server.listen(PORT, '127.0.0.1', () => console.log(`Jaspe — API sur http://127.0.0.1:${PORT} · ${accounts ? 'comptes actifs (JASPE_AUTH=1)' : `démo locale · copilote : ${copilot.mode}`}`))
  setTimeout(() => tick().catch(console.error), 5000)
  setInterval(() => tick().catch(console.error), TICK_MS)
}
