// Comptes, sessions, agences et offres (mode JASPE_AUTH=1). Une base SQLite par agence, une base des comptes.
import { DatabaseSync } from 'node:sqlite'
import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { COLLECTIONS } from './db.js'
import { HttpError } from './engine.js'

const scryptAsync = promisify(scrypt)
export const AUTH_COOKIE = 'jaspe_sid'
const SESSION_DAYS = 30
const INVITE_DAYS = 7
const RESET_MS = 3600e3
const FORGOT = { perKey: 3, perIp: 10, windowMs: 15 * 60_000 }
const ATTEMPTS = { max: 5, windowMs: 15 * 60_000 }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
/** Collections gardées à l’amorçage d’une base vide : routines, modèles, tutoriels et veille légale restent utiles. */
const KEEP_SEEDED = new Set(['routines', 'templates', 'tutorials', 'regwatch'])
const INACTIVE = new Set(['acte', 'archive', 'archivé', 'archived'])

/** Grille fixée par la stratégie. `dossiers` : dossiers actifs simultanés (null = illimité). */
export const PLANS = {
  decouverte: { label: 'Découverte', dossiers: 1, seats: 1, price: 0 },
  solo: { label: 'Solo', dossiers: 8, seats: 1, price: 9.9, priceYear: 99 },
  agence: { label: 'Agence', dossiers: null, seats: 7, price: 49, seatPrice: 6 },
  /** Bêta sans paiement (aucune clé Stripe) : tout ouvert, gratuit, jusqu’à l’ouverture des abonnements. */
  beta: { label: 'Bêta gratuite', dossiers: null, seats: 7, price: 0 },
}
export const OPTIONS = { preuves: { label: 'Pack Preuves', price: 6 }, donnees: { label: 'Données marché', price: 9 } }
const PAID_STATUS = new Set(['active', 'trialing'])

/** Abonnement impayé ou résilié → Découverte (données conservées). */
export const effectivePlan = (org) => (org && PAID_STATUS.has(org.status) && PLANS[org.plan] && org.plan !== 'decouverte' ? org.plan : 'decouverte')
export function limitsFor(org) {
  const p = effectivePlan(org)
  return { dossiers: PLANS[p].dossiers, seats: p === 'agence' ? Math.max(PLANS.agence.seats, Number(org.seats) || 0) : PLANS[p].seats }
}
export const isActiveDossier = (d) => !INACTIVE.has(String(d.stage ?? '').toLowerCase()) && !d.archived && !d.afterSale?.archive

const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const hashToken = (t) => createHash('sha256').update(t).digest('hex')
const token = () => randomBytes(32).toString('base64url')
const iso = (ms = Date.now()) => new Date(ms).toISOString()

export async function hashPassword(pw) {
  const salt = randomBytes(16)
  const key = await scryptAsync(String(pw).normalize('NFKC'), salt, 64)
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`
}
export async function verifyPassword(pw, stored) {
  const [kind, saltHex, keyHex] = String(stored ?? '').split('$')
  if (kind !== 'scrypt' || !saltHex || !keyHex) return false
  const key = await scryptAsync(String(pw).normalize('NFKC'), Buffer.from(saltHex, 'hex'), 64)
  const ref = Buffer.from(keyHex, 'hex')
  return ref.length === key.length && timingSafeEqual(ref, key)
}

/** Base des comptes : utilisateurs, agences (offre, statut Stripe), sessions, invitations. */
export function createAccounts(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS orgs (id TEXT PRIMARY KEY, name TEXT NOT NULL, country TEXT NOT NULL, plan TEXT NOT NULL DEFAULT 'decouverte', status TEXT NOT NULL DEFAULT 'none',
      period TEXT, options TEXT NOT NULL DEFAULT '[]', seats INTEGER NOT NULL DEFAULT 0, customerId TEXT, subscriptionId TEXT, periodEnd TEXT, cancelAtPeriodEnd INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, pass TEXT NOT NULL, orgId TEXT NOT NULL, role TEXT NOT NULL, createdAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (tokenHash TEXT PRIMARY KEY, userId TEXT NOT NULL, expiresAt TEXT NOT NULL, createdAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS invites (id TEXT PRIMARY KEY, tokenHash TEXT NOT NULL UNIQUE, orgId TEXT NOT NULL, role TEXT NOT NULL, createdBy TEXT NOT NULL, expiresAt TEXT NOT NULL, usedAt TEXT, createdAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, type TEXT NOT NULL, at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS resets (tokenHash TEXT PRIMARY KEY, userId TEXT NOT NULL, expiresAt TEXT NOT NULL, usedAt TEXT, createdAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS waroutes (phone TEXT PRIMARY KEY, orgId TEXT NOT NULL, createdAt TEXT NOT NULL);`)
  const orgRow = (r) => (r ? { ...r, options: JSON.parse(r.options || '[]'), cancelAtPeriodEnd: !!r.cancelAtPeriodEnd } : null)
  const q = (sql) => db.prepare(sql)
  const ORG_FIELDS = ['name', 'country', 'plan', 'status', 'period', 'options', 'seats', 'customerId', 'subscriptionId', 'periodEnd', 'cancelAtPeriodEnd']
  const api = {
    db,
    /**
     * Débrief WhatsApp en mode comptes : un numéro de conseiller appartient à une seule agence.
     * Remplace les numéros de l’agence ; refuse (409) un numéro déjà rattaché à une autre agence,
     * sinon une agence pourrait recevoir les débriefs d’une autre.
     */
    claimWaPhones(orgId, phones) {
      const list = [...new Set(phones.map((p) => String(p ?? '').replace(/\D/g, '').replace(/^00/, '')).filter((p) => p.length >= 8))]
      const taken = list.filter((p) => { const r = q('SELECT orgId FROM waroutes WHERE phone = ?').get(p); return r && r.orgId !== orgId })
      if (taken.length) { const e = new Error(`Numéro déjà rattaché à une autre agence : …${taken[0].slice(-4)}`); e.status = 409; throw e }
      db.exec('BEGIN')
      try {
        q('DELETE FROM waroutes WHERE orgId = ?').run(orgId)
        for (const p of list) q('INSERT INTO waroutes (phone, orgId, createdAt) VALUES (?, ?, ?)').run(p, orgId, iso())
        db.exec('COMMIT')
      } catch (e) { db.exec('ROLLBACK'); throw e }
      return list.length
    },
    waOrgFor(phone) { const d = String(phone ?? '').replace(/\D/g, '').replace(/^00/, ''); return d ? q('SELECT orgId FROM waroutes WHERE phone = ?').get(d)?.orgId ?? null : null },
    createOrg({ name, country }) {
      const id = `org_${randomUUID().replace(/-/g, '').slice(0, 12)}`
      q('INSERT INTO orgs (id, name, country, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)').run(id, name, country, iso(), iso())
      return api.getOrg(id)
    },
    getOrg: (id) => orgRow(q('SELECT * FROM orgs WHERE id = ?').get(id)),
    findOrg({ customerId, subscriptionId }) {
      const r = (subscriptionId && q('SELECT * FROM orgs WHERE subscriptionId = ?').get(subscriptionId)) || (customerId && q('SELECT * FROM orgs WHERE customerId = ?').get(customerId))
      return orgRow(r || null)
    },
    updateOrg(id, patch) {
      const keys = Object.keys(patch).filter((k) => ORG_FIELDS.includes(k) && patch[k] !== undefined)
      if (!keys.length) return api.getOrg(id)
      const vals = keys.map((k) => (k === 'options' ? JSON.stringify(patch[k] ?? []) : k === 'cancelAtPeriodEnd' ? (patch[k] ? 1 : 0) : patch[k]))
      q(`UPDATE orgs SET ${keys.map((k) => `${k} = ?`).join(', ')}, updatedAt = ? WHERE id = ?`).run(...vals, iso(), id)
      return api.getOrg(id)
    },
    createUser({ email, name, pass, orgId, role }) {
      const id = `usr_${randomUUID().replace(/-/g, '').slice(0, 12)}`
      q('INSERT INTO users (id, email, name, pass, orgId, role, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, email, name, pass, orgId, role, iso())
      return api.getUser(id)
    },
    getUser: (id) => q('SELECT * FROM users WHERE id = ?').get(id) ?? null,
    userByEmail: (email) => q('SELECT * FROM users WHERE email = ?').get(email) ?? null,
    members: (orgId) => q('SELECT id, email, name, role, createdAt FROM users WHERE orgId = ? ORDER BY createdAt').all(orgId),
    removeUser(id) { q('DELETE FROM sessions WHERE userId = ?').run(id); return q('DELETE FROM users WHERE id = ?').run(id).changes > 0 },
    createSession(userId) {
      const t = token()
      q('INSERT INTO sessions (tokenHash, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?)').run(hashToken(t), userId, iso(Date.now() + SESSION_DAYS * 864e5), iso())
      return t
    },
    session(t) {
      if (!t) return null
      const s = q('SELECT * FROM sessions WHERE tokenHash = ?').get(hashToken(t))
      if (!s) return null
      if (Date.parse(s.expiresAt) <= Date.now()) { q('DELETE FROM sessions WHERE tokenHash = ?').run(s.tokenHash); return null }
      const user = api.getUser(s.userId)
      const org = user && api.getOrg(user.orgId)
      return user && org ? { user, org } : null
    },
    endSession: (t) => { if (t) q('DELETE FROM sessions WHERE tokenHash = ?').run(hashToken(t)) },
    activeOrgIds: () => q('SELECT DISTINCT u.orgId AS id FROM sessions s JOIN users u ON u.id = s.userId WHERE s.expiresAt > ?').all(iso()).map((r) => r.id),
    createInvite({ orgId, role = 'conseiller', createdBy }) {
      const t = token(), id = `inv_${randomUUID().replace(/-/g, '').slice(0, 10)}`
      const expiresAt = iso(Date.now() + INVITE_DAYS * 864e5)
      q('INSERT INTO invites (id, tokenHash, orgId, role, createdBy, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, hashToken(t), orgId, role, createdBy, expiresAt, iso())
      return { id, token: t, expiresAt, role }
    },
    invite: (t) => q('SELECT * FROM invites WHERE tokenHash = ?').get(hashToken(String(t ?? ''))) ?? null,
    pendingInvites: (orgId) => q('SELECT id, role, expiresAt, createdAt FROM invites WHERE orgId = ? AND usedAt IS NULL AND expiresAt > ? ORDER BY createdAt').all(orgId, iso()),
    useInvite: (id) => q('UPDATE invites SET usedAt = ? WHERE id = ? AND usedAt IS NULL').run(iso(), id).changes > 0,
    revokeInvite: (orgId, id) => q('DELETE FROM invites WHERE orgId = ? AND id = ? AND usedAt IS NULL').run(orgId, id).changes > 0,
    /** Réinitialisation du mot de passe : un seul jeton actif par compte (haché, 1 h, usage unique). */
    createReset(userId) {
      const t = token()
      q('DELETE FROM resets WHERE userId = ? AND usedAt IS NULL').run(userId)
      q('INSERT INTO resets (tokenHash, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?)').run(hashToken(t), userId, iso(Date.now() + RESET_MS), iso())
      return t
    },
    reset: (t) => q('SELECT * FROM resets WHERE tokenHash = ?').get(hashToken(String(t ?? ''))) ?? null,
    useReset: (tokenHash) => q('UPDATE resets SET usedAt = ? WHERE tokenHash = ? AND usedAt IS NULL').run(iso(), tokenHash).changes > 0,
    setPassword(userId, pass) {
      q('UPDATE users SET pass = ? WHERE id = ?').run(pass, userId)
      q('DELETE FROM sessions WHERE userId = ?').run(userId)
      q('DELETE FROM resets WHERE userId = ? AND usedAt IS NULL').run(userId)
    },
    /** Idempotence des webhooks : vrai si l’événement est nouveau. */
    markEvent: (id, type) => q('INSERT OR IGNORE INTO events (id, type, at) VALUES (?, ?, ?)').run(id, type, iso()).changes > 0,
  }
  return api
}

const parseCookies = (h = '') => Object.fromEntries(h.split(';').map((p) => p.trim().split('=')).filter(([k, v]) => k && v !== undefined).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]))
const isHttps = (req) => !!req.socket?.encrypted || String(req.headers['x-forwarded-proto'] ?? '').split(',')[0].trim() === 'https'
const cookie = (req, value, maxAge) => `${AUTH_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isHttps(req) ? '; Secure' : ''}`
export const readRaw = (req, max = 1024 * 1024) => new Promise((resolve, reject) => {
  let size = 0; const chunks = []
  req.on('data', (c) => { size += c.length; if (size > max) { reject(new HttpError(413, 'Corps trop volumineux')); req.destroy() } else chunks.push(c) })
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  req.on('error', reject)
})

/** Mode démonstration (sans JASPE_AUTH) : l’interface apprend qu’aucun compte ni paiement n’est actif. */
export function demoRoute(req, res, parts, send) {
  const [head] = parts
  if (head === 'me') return send(res, 200, { mode: 'demo' }), true
  if (head === 'billing') return send(res, 503, { error: 'Paiement non configuré : mode démonstration (comptes désactivés)' }), true
  if (head === 'auth' || head === 'team') return send(res, 409, { error: 'Comptes non activés sur ce serveur (variable JASPE_AUTH=1)' }), true
  return false
}

/**
 * Passerelle du mode comptes : traite /api/auth, /api/me, /api/team, /api/billing ;
 * pour le reste, résout l’agence de la session et renvoie son contexte {db, engine, copilot, clients, emit, filesDir}.
 */
export function createGate({ accounts, billing, openOrg, send, readBody, mailer = null, publicUrl, beta: betaOpt }) {
  // Bêta : sans paiement configuré, les quotas ne s’appliquent pas (JASPE_BETA=0 pour les forcer).
  const beta = () => (betaOpt ?? !billing.configured())
  const planOf = (org) => (beta() ? 'beta' : effectivePlan(org))
  const limits = (org) => (beta() ? { dossiers: null, seats: PLANS.beta.seats } : limitsFor(org))
  const attempts = new Map()
  const forgotHits = new Map()
  const base = String(publicUrl ?? mailer?.publicUrl ?? process.env.JASPE_PUBLIC_URL ?? 'http://127.0.0.1:5318').replace(/\/+$/, '')
  const mailOn = () => !!mailer?.configured
  /** Fenêtre glissante : vrai si la clé a dépassé `max` demandes. */
  const tooMany = (key, max) => {
    const now = Date.now()
    const list = (forgotHits.get(key) ?? []).filter((t) => now - t < FORGOT.windowMs)
    list.push(now); forgotHits.set(key, list)
    return list.length > max
  }
  const ipOf = (req) => req.socket?.remoteAddress ?? '?'
  const sid = (req) => parseCookies(req.headers.cookie)[AUTH_COOKIE]
  const pub = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role })

  function limited(key) {
    const now = Date.now()
    const list = (attempts.get(key) ?? []).filter((t) => now - t < ATTEMPTS.windowMs)
    attempts.set(key, list)
    if (list.length >= ATTEMPTS.max) {
      const wait = Math.max(1, Math.ceil((ATTEMPTS.windowMs - (now - list[0])) / 60_000))
      throw new HttpError(429, `Trop de tentatives de connexion. Réessayez dans ${wait} min.`)
    }
    return list
  }

  function usage(org, ctx = openOrg(org.id)) {
    return {
      dossiers: ctx.db.list('dossiers').filter(isActiveDossier).length,
      seats: accounts.members(org.id).length + accounts.pendingInvites(org.id).length,
    }
  }
  function me(user, org) {
    const p = planOf(org)
    return {
      mode: 'auth', user: pub(user), org: { id: org.id, name: org.name, country: org.country },
      plan: { id: p, label: PLANS[p].label, subscribed: org.plan, status: org.status, period: org.period, options: org.options, seats: org.seats, periodEnd: org.periodEnd, cancelAtPeriodEnd: org.cancelAtPeriodEnd, customer: !!org.customerId },
      limits: limits(org), usage: usage(org), billing: { configured: billing.configured(), beta: beta() },
    }
  }
  const start = (req, res, user, status = 200) => {
    const t = accounts.createSession(user.id)
    return send(res, status, me(user, accounts.getOrg(user.orgId)), { 'set-cookie': cookie(req, t, SESSION_DAYS * 86400) })
  }
  const credentials = (b) => {
    const email = String(b.email ?? '').trim().toLowerCase(), name = String(b.name ?? '').trim().slice(0, 80), password = String(b.password ?? '')
    if (!name) throw new HttpError(400, 'Le nom est obligatoire')
    if (!EMAIL.test(email) || email.length > 160) throw new HttpError(400, 'Adresse e-mail invalide')
    if (password.length < 10) throw new HttpError(400, 'Mot de passe trop court : 10 caractères minimum')
    if (password.length > 200) throw new HttpError(400, 'Mot de passe trop long')
    if (accounts.userByEmail(email)) throw new HttpError(409, 'Un compte existe déjà avec cette adresse')
    return { email, name, password }
  }
  const ownerOnly = (s) => { if (s.user.role !== 'owner') throw new HttpError(403, 'Réservé au responsable de l’agence') }

  async function authRoute(req, res, [, a, b]) {
    const m = req.method
    if (a === 'register' && m === 'POST') {
      const body = await readBody(req)
      const { email, name, password } = credentials(body)
      const orgName = String(body.orgName ?? '').trim().slice(0, 120)
      const country = body.country === 'PT' ? 'PT' : body.country === 'FR' || body.country === undefined ? 'FR' : null
      if (!orgName) throw new HttpError(400, 'Le nom de l’agence est obligatoire')
      if (!country) throw new HttpError(400, 'Pays FR ou PT')
      const org = accounts.createOrg({ name: orgName, country })
      const user = accounts.createUser({ email, name, pass: await hashPassword(password), orgId: org.id, role: 'owner' })
      const { db } = openOrg(org.id)
      if (body.start === 'vide') for (const col of COLLECTIONS) if (!KEEP_SEEDED.has(col)) db.seed(col, [])
      db.put('settings', { ...(db.get('settings', 'agency') ?? {}), id: 'agency', agencyName: orgName, country, signature: `${name} — ${orgName}` })
      // Profil du compte : jamais celui de la démo (nom, courriel, téléphone).
      db.put('settings', { ...(db.get('settings', 'profile') ?? {}), id: 'profile', name, email, phone: '', role: 'Responsable d’agence' })
      db.put('agents', { id: user.id, name, email, role: 'Responsable d’agence', agency: orgName, photo: '', mandats: 0, ca: 0, score: 0, status: 'actif' })
      return start(req, res, user, 201)
    }
    if (a === 'login' && m === 'POST') {
      const body = await readBody(req)
      const email = String(body.email ?? '').trim().toLowerCase()
      const key = `${email}|${ipOf(req)}`
      const list = limited(key)
      const user = accounts.userByEmail(email)
      // Toujours un calcul scrypt, même sans compte : pas d’indice sur l’existence de l’adresse.
      const ok = await verifyPassword(String(body.password ?? ''), user?.pass ?? 'scrypt$00$00')
      if (!user || !ok) { list.push(Date.now()); throw new HttpError(401, 'E-mail ou mot de passe incorrect') }
      attempts.delete(key)
      return start(req, res, user)
    }
    if (a === 'logout' && m === 'POST') {
      accounts.endSession(sid(req))
      return send(res, 200, { ok: true }, { 'set-cookie': cookie(req, '', 0) })
    }
    if (a === 'forgot' && m === 'POST') {
      const body = await readBody(req)
      const email = String(body.email ?? '').trim().toLowerCase().slice(0, 160)
      // Limite par adresse et par IP, appliquée que le compte existe ou non.
      if (tooMany(`f|${email}|${ipOf(req)}`, FORGOT.perKey) || tooMany(`ip|${ipOf(req)}`, FORGOT.perIp)) throw new HttpError(429, 'Trop de demandes de réinitialisation. Réessayez dans 15 min.')
      const user = EMAIL.test(email) ? accounts.userByEmail(email) : null
      if (user && mailOn()) {
        const t = accounts.createReset(user.id)
        const link = `${base}/reinitialiser/${t}`
        // Envoi non attendu : même délai de réponse que l’adresse existe ou non.
        mailer.send({ to: user.email, subject: 'Jaspe — réinitialisation de votre mot de passe', text: `Bonjour ${user.name},

Pour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure, utilisable une seule fois) :
${link}

Si vous n’êtes pas à l’origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.`, html: `<p>Bonjour ${escHtml(user.name)},</p><p>Pour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure, utilisable une seule fois) :</p><p><a href="${escHtml(link)}">${escHtml(link)}</a></p><p>Si vous n’êtes pas à l’origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.</p>` }).catch((e) => console.error('Réinitialisation : échec de l’envoi', e?.message ?? e))
      }
      return send(res, 200, { ok: true, mail: mailOn(), message: 'Si un compte existe avec cette adresse, un e-mail de réinitialisation vient d’être envoyé (lien valable 1 heure).' })
    }
    if (a === 'reset' && m === 'POST') {
      const body = await readBody(req)
      const r = accounts.reset(body.token)
      if (!r || r.usedAt) throw new HttpError(404, 'Lien de réinitialisation invalide ou déjà utilisé')
      if (Date.parse(r.expiresAt) <= Date.now()) throw new HttpError(410, 'Lien de réinitialisation expiré : refaites une demande')
      const password = String(body.password ?? '')
      if (password.length < 10) throw new HttpError(400, 'Mot de passe trop court : 10 caractères minimum')
      if (password.length > 200) throw new HttpError(400, 'Mot de passe trop long')
      if (!accounts.useReset(r.tokenHash)) throw new HttpError(404, 'Lien de réinitialisation déjà utilisé')
      accounts.setPassword(r.userId, await hashPassword(password))
      return send(res, 200, { ok: true }, { 'set-cookie': cookie(req, '', 0) })
    }
    if (a === 'invite' && b && m === 'GET') {
      const inv = accounts.invite(b)
      if (!inv || inv.usedAt) throw new HttpError(404, 'Invitation introuvable ou déjà utilisée')
      if (Date.parse(inv.expiresAt) <= Date.now()) throw new HttpError(410, 'Invitation expirée : demandez un nouveau lien')
      return send(res, 200, { org: accounts.getOrg(inv.orgId)?.name, role: inv.role, expiresAt: inv.expiresAt })
    }
    if (a === 'accept' && m === 'POST') {
      const body = await readBody(req)
      const inv = accounts.invite(body.token)
      if (!inv || inv.usedAt) throw new HttpError(404, 'Invitation introuvable ou déjà utilisée')
      if (Date.parse(inv.expiresAt) <= Date.now()) throw new HttpError(410, 'Invitation expirée : demandez un nouveau lien')
      const { email, name, password } = credentials(body)
      const org = accounts.getOrg(inv.orgId)
      const lim = limits(org).seats
      // L’invitation en cours compte déjà dans les sièges : on vérifie les seuls membres.
      if (accounts.members(org.id).length >= lim) throw new HttpError(402, `Tous les sièges de l’offre ${PLANS[planOf(org)].label} sont occupés (${lim}).`)
      if (!accounts.useInvite(inv.id)) throw new HttpError(404, 'Invitation déjà utilisée')
      const user = accounts.createUser({ email, name, pass: await hashPassword(password), orgId: org.id, role: inv.role === 'owner' ? 'conseiller' : inv.role })
      openOrg(org.id).db.put('agents', { id: user.id, name, email, role: 'Conseiller', agency: org.name, photo: '', mandats: 0, ca: 0, score: 0, status: 'actif' })
      return start(req, res, user, 201)
    }
    throw new HttpError(404, 'Route inconnue')
  }

  async function teamRoute(req, res, s, [, a, b]) {
    const m = req.method
    if (!a && m === 'GET') return send(res, 200, { members: accounts.members(s.org.id), invites: accounts.pendingInvites(s.org.id), limits: limits(s.org), usage: usage(s.org) })
    ownerOnly(s)
    if (a === 'invite' && m === 'POST') {
      const lim = limits(s.org).seats, used = usage(s.org).seats
      if (used >= lim) throw new HttpError(402, lim <= 1
        ? `L’offre ${PLANS[planOf(s.org)].label} comprend un seul siège. Passez à l’offre Agence pour inviter des conseillers.`
        : `Les ${lim} sièges de votre offre sont occupés ou réservés. Ajoutez des sièges dans Réglages › Facturation.`)
      // Avec SMTP : l’invitation part aussi par e-mail si une adresse est fournie ; sinon lien à copier.
      const to = String((await readBody(req))?.email ?? '').trim().toLowerCase()
      if (to && !EMAIL.test(to)) throw new HttpError(400, 'Adresse e-mail invalide')
      const inv = accounts.createInvite({ orgId: s.org.id, role: 'conseiller', createdBy: s.user.id })
      const path = `/invitation/${inv.token}`
      let emailed = false, mailError
      if (to && mailOn()) {
        const link = `${base}${path}`
        try {
          await mailer.send({ to, replyTo: s.user.email, subject: `${s.user.name} vous invite sur Jaspe — ${s.org.name}`, text: `Bonjour,

${s.user.name} vous invite à rejoindre l’agence ${s.org.name} sur Jaspe.
Créez votre compte avec ce lien (usage unique, valable ${INVITE_DAYS} jours) :
${link}`, html: `<p>Bonjour,</p><p>${escHtml(s.user.name)} vous invite à rejoindre l’agence ${escHtml(s.org.name)} sur Jaspe.</p><p>Créez votre compte avec ce lien (usage unique, valable ${INVITE_DAYS} jours) :<br><a href="${escHtml(link)}">${escHtml(link)}</a></p>` })
          emailed = true
        } catch (e) { mailError = `Invitation créée mais e-mail non envoyé : ${e?.message ?? e}` }
      }
      return send(res, 201, { ...inv, path, emailed, ...(mailError ? { mailError } : {}) })
    }
    if (a === 'invites' && b && m === 'DELETE') return send(res, 200, { ok: accounts.revokeInvite(s.org.id, b) })
    if (a === 'members' && b && m === 'DELETE') {
      const u = accounts.getUser(b)
      if (!u || u.orgId !== s.org.id) throw new HttpError(404, 'Membre introuvable')
      if (u.role === 'owner') throw new HttpError(409, 'Le responsable de l’agence ne peut pas être retiré')
      return send(res, 200, { ok: accounts.removeUser(u.id) })
    }
    throw new HttpError(404, 'Route inconnue')
  }

  /** Quota de dossiers : création refusée au-delà, dossiers en trop en lecture seule. */
  async function guard(req, [head, a], org, ctx) {
    const lim = limits(org).dossiers
    if (lim == null) return
    const m = req.method
    const active = ctx.db.list('dossiers').filter(isActiveDossier)
    const label = PLANS[planOf(org)].label
    const hint = 'Passez à une offre supérieure dans Réglages › Facturation, ou archivez un dossier terminé.'
    if (head === 'dossiers' && !a && m === 'POST' && active.length >= lim) throw new HttpError(402, `Votre offre ${label} comprend ${lim} dossier${lim > 1 ? 's' : ''} actif${lim > 1 ? 's' : ''} (${active.length} en cours). ${hint}`)
    if (active.length <= lim) return
    const over = new Set(active.slice(lim).map((d) => d.id))
    let target = null
    if (head === 'dossiers' && a && (m === 'PATCH' || m === 'PUT')) {
      const body = (req._jaspeBody = await readBody(req))
      target = INACTIVE.has(String(body?.stage ?? '')) ? null : a
    } else if (head === 'actions' && m === 'POST') {
      const body = (req._jaspeBody = await readBody(req))
      target = body?.dossierId ?? (String(a).startsWith('dossier.') ? body?.id : null) ?? null
      if (a === 'dossier.move' && INACTIVE.has(String(body?.stage ?? ''))) target = null
    }
    if (target && over.has(target)) throw new HttpError(402, `Dossier en lecture seule : votre offre ${label} comprend ${lim} dossier${lim > 1 ? 's' : ''} actif${lim > 1 ? 's' : ''}. Vos données sont conservées. ${hint}`)
  }

  /** Retourne le contexte de l’agence, ou null si la réponse a déjà été envoyée. */
  async function handle(req, res, parts) {
    const [head, a] = parts
    if (head === 'health') { send(res, 200, { ok: true, auth: true, billing: billing.configured() }); return null }
    if (head === 'auth') { await authRoute(req, res, parts); return null }
    if (head === 'billing' && a === 'webhook') { await billing.webhook(req, res, send); return null }
    const s = accounts.session(sid(req))
    if (!s) throw new HttpError(401, 'Connexion requise')
    if (head === 'me') { send(res, 200, me(s.user, s.org)); return null }
    if (head === 'team') { await teamRoute(req, res, s, parts); return null }
    if (head === 'billing') {
      ownerOnly(s)
      if (a === 'checkout' && req.method === 'POST') { send(res, 200, await billing.checkout(req, s, await readBody(req))); return null }
      if (a === 'portal' && req.method === 'POST') { send(res, 200, await billing.portal(req, s)); return null }
      throw new HttpError(404, 'Route inconnue')
    }
    const ctx = openOrg(s.org.id)
    await guard(req, parts, s.org, ctx)
    return { ...ctx, user: s.user }
  }

  return { handle, accounts, tick: async () => { for (const id of accounts.activeOrgIds()) await openOrg(id).engine.tick() } }
}

/** Chemins des bases : une par agence sous data/orgs. */
export const orgPaths = (dataDir, filesDir, orgId) => {
  if (!/^org_[a-z0-9]{6,32}$/.test(orgId)) throw new HttpError(400, 'Agence invalide')
  return dataDir === ':memory:'
    ? { dbPath: ':memory:', filesDir: join(filesDir, orgId) }
    : { dbPath: join(dataDir, 'orgs', `${orgId}.sqlite`), filesDir: join(dataDir, 'orgs', `${orgId}-files`) }
}
