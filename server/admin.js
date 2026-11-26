// Back-office de la plateforme Jaspe (mode comptes) : tarifs, modules, validation des agences, KYC, données.
// Réservé aux administrateurs de la plateforme : e-mails listés dans JASPE_ADMIN_EMAILS, ou promus par un administrateur.
// Toute action d’administration est journalisée (table adminlog). Rien n’est supprimé sans trace.
import { randomUUID } from 'node:crypto'
import { statSync } from 'node:fs'
import { COLLECTIONS } from './db.js'
import { HttpError } from './engine.js'

const iso = (ms = Date.now()) => new Date(ms).toISOString()

/** Modules activables. `actions` : préfixes d’actions serveur coupées quand le module est désactivé. */
export const MODULES = {
  copilote: { label: 'Copilote et brief → plan d’action', actions: ['assistant.', 'copilot.'], core: true },
  documents: { label: 'Documents à relire (brief, compte rendu, estimation…)', actions: ['deliverable.'], core: true },
  conformite: { label: 'Conformité et veille légale FR / PT', actions: ['compliance.'] },
  preuves: { label: 'Pack Preuves LCB-FT et lien de dépôt client', actions: ['evidence.', 'risk.'] },
  factures: { label: 'Factures de commission (InvoiceXpress au Portugal)', actions: ['invoice.'] },
  import: { label: 'Import CSV eGO / Hektor', actions: ['import.'] },
  marche: { label: 'Ventes réelles comparables (DVF)', actions: ['market.'] },
  whatsapp: { label: 'Débrief par WhatsApp', actions: ['waplan.', 'whatsapp.'] },
  mcp: { label: 'Claude / Codex / ChatGPT (MCP)', actions: ['apitoken.', 'mcp.'] },
  envois: { label: 'Envois réels d’e-mails', actions: ['outbox.send', 'mail.'] },
  temps: { label: 'Temps gagné mesuré', actions: ['time.'] },
  contrat: { label: 'Lecture des compromis PDF', actions: ['contract.'] },
}
export const VERIFICATION = { en_attente: 'En attente', valide: 'Validée', refuse: 'Refusée', suspendu: 'Suspendue' }
const BLOCKED = new Set(['refuse', 'suspendu'])
const PLAN_FIELDS = ['label', 'price', 'priceYear', 'dossiers', 'seats', 'seatPrice', 'visible']

/* ——— Contrôles KYC ——— */
const luhn = (s) => { let sum = 0; for (let i = 0; i < s.length; i++) { let d = Number(s[s.length - 1 - i]); if (i % 2) { d *= 2; if (d > 9) d -= 9 } sum += d } return sum % 10 === 0 }
/** NIF / NIPC portugais : 9 chiffres, clé modulo 11. */
export const nifPtValid = (v) => {
  const s = String(v ?? '').replace(/\D/g, '')
  if (!/^[1-35689]\d{8}$/.test(s) && !/^(45|70|71|72|74|75|77|79|90|91|98|99)\d{7}$/.test(s)) return false
  const sum = [...s.slice(0, 8)].reduce((n, c, i) => n + Number(c) * (9 - i), 0)
  const check = 11 - (sum % 11)
  return (check >= 10 ? 0 : check) === Number(s[8])
}
/** SIREN (9 chiffres) ou SIRET (14 chiffres), clé de Luhn ; La Poste (356000000) fait exception. */
export const sirenValid = (v) => { const s = String(v ?? '').replace(/\D/g, ''); return (s.length === 9 || s.length === 14) && (luhn(s) || s.startsWith('356000000')) }
/** Carte professionnelle française (CCI) : CPI + 4 chiffres (département) + 4 (année) + 9 chiffres. */
export const cartePro = (v) => /^CPI\s?\d{4}\s?\d{4}\s?\d{3}\s?\d{3}\s?\d{3}$/i.test(String(v ?? '').trim())
/** Licence AMI (IMPIC) : numéro de licence, souvent écrit « AMI 12345 ». */
export const licencaAmi = (v) => /^(AMI\s*[-n.º°]*\s*)?\d{3,6}(\s*-\s*AMI)?$/i.test(String(v ?? '').trim())

/** Contrôles automatiques d’une demande de vérification. `fetch` : registre public (France) ; absent ou coupé → contrôle de format seul. */
export async function runKycChecks(kyc, country, { fetch, offline = false } = {}) {
  const checks = []
  const add = (id, label, status, detail, source) => checks.push({ id, label, status, detail, source })
  if (country === 'PT') {
    const nif = String(kyc.companyId ?? '').replace(/\D/g, '')
    add('nif', 'NIF / NIPC de l’entreprise', nifPtValid(nif) ? 'ok' : 'ko', nifPtValid(nif) ? `NIF ${nif} valide (clé de contrôle)` : `NIF « ${kyc.companyId ?? ''} » invalide`, 'Clé modulo 11 (AT)')
    add('ami', 'Licence AMI (IMPIC)', licencaAmi(kyc.cardNumber) ? 'manuel' : 'ko', licencaAmi(kyc.cardNumber) ? `Licence « ${kyc.cardNumber} » : format correct, à confirmer sur le registre de l’IMPIC` : `Licence « ${kyc.cardNumber ?? ''} » absente ou mal formée`, 'https://www.impic.pt/impic/pt-pt/consultar/empresas-de-mediacao-imobiliaria')
  } else {
    const siren = String(kyc.companyId ?? '').replace(/\D/g, '')
    const valid = sirenValid(siren)
    add('siren', 'SIREN / SIRET de l’entreprise', valid ? 'ok' : 'ko', valid ? `${siren.length === 14 ? 'SIRET' : 'SIREN'} ${siren} : clé valide` : `Numéro « ${kyc.companyId ?? ''} » invalide`, 'Clé de Luhn (INSEE)')
    if (valid && fetch && !offline) {
      try {
        const r = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${siren.slice(0, 9)}&page=1&per_page=1`, { headers: { accept: 'application/json' } })
        const j = r.ok ? await r.json() : null
        const e = j?.results?.find((x) => x.siren === siren.slice(0, 9))
        if (!e) add('registre', 'Registre national des entreprises', 'ko', `SIREN ${siren.slice(0, 9)} introuvable dans le registre`, 'recherche-entreprises.api.gouv.fr')
        else {
          const active = e.etat_administratif === 'A'
          const naf = e.activite_principale ?? e.siege?.activite_principale ?? ''
          add('registre', 'Registre national des entreprises', active ? 'ok' : 'ko', `${e.nom_complet ?? e.nom_raison_sociale ?? '—'} · ${active ? 'active' : 'cessée'} · ${e.siege?.adresse ?? ''}`, 'recherche-entreprises.api.gouv.fr')
          add('naf', 'Activité immobilière (code NAF 68.31Z)', /^68\.?31/.test(naf) ? 'ok' : 'manuel', naf ? `Code NAF ${naf}${/^68\.?31/.test(naf) ? ' : agence immobilière' : ' : autre activité, à vérifier'}` : 'Code NAF inconnu', 'INSEE / registre')
          if (kyc.legalName && e.nom_complet) {
            const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
            const match = norm(e.nom_complet).includes(norm(kyc.legalName)) || norm(kyc.legalName).includes(norm(e.nom_raison_sociale ?? e.nom_complet))
            add('nom', 'Raison sociale déclarée', match ? 'ok' : 'manuel', match ? 'Correspond au registre' : `Déclaré « ${kyc.legalName} », registre « ${e.nom_complet} »`, 'recherche-entreprises.api.gouv.fr')
          }
        }
      } catch (err) { add('registre', 'Registre national des entreprises', 'manuel', `Registre injoignable (${err.message}) : vérifier à la main`, 'recherche-entreprises.api.gouv.fr') }
    } else if (valid) add('registre', 'Registre national des entreprises', 'manuel', 'Consultation du registre désactivée sur ce serveur : vérifier à la main', 'https://annuaire-entreprises.data.gouv.fr')
    add('carte', 'Carte professionnelle T (CCI)', cartePro(kyc.cardNumber) ? 'manuel' : 'ko', cartePro(kyc.cardNumber) ? `Carte « ${kyc.cardNumber} » : format correct, à confirmer sur le fichier des cartes (CCI)` : `Carte « ${kyc.cardNumber ?? ''} » absente ou mal formée (attendu : CPI dddd aaaa ddd ddd ddd)`, 'https://www.cci.fr/agent-immobilier')
  }
  add('responsable', 'Responsable légal déclaré', kyc.managerName && String(kyc.managerName).trim().length >= 3 ? 'ok' : 'ko', kyc.managerName ? `${kyc.managerName}` : 'Nom du responsable manquant', 'Déclaration de l’agence')
  const score = { ok: checks.filter((c) => c.status === 'ok').length, ko: checks.filter((c) => c.status === 'ko').length, manuel: checks.filter((c) => c.status === 'manuel').length }
  return { at: iso(), checks, score }
}

/** Couche plateforme : migrations, configuration (tarifs, modules), vérification des agences, journal. */
export function createPlatform(accounts, { env = {}, plans, options, fetch } = {}) {
  const db = accounts.db
  const cols = new Set(db.prepare('PRAGMA table_info(orgs)').all().map((c) => c.name))
  for (const [c, def] of [['verification', "TEXT NOT NULL DEFAULT 'en_attente'"], ['kyc', "TEXT NOT NULL DEFAULT '{}'"], ['modules', "TEXT NOT NULL DEFAULT '{}'"], ['adminNote', 'TEXT']]) if (!cols.has(c)) db.exec(`ALTER TABLE orgs ADD COLUMN ${c} ${def}`)
  const ucols = new Set(db.prepare('PRAGMA table_info(users)').all().map((c) => c.name))
  if (!ucols.has('platformAdmin')) db.exec('ALTER TABLE users ADD COLUMN platformAdmin INTEGER NOT NULL DEFAULT 0')
  db.exec(`CREATE TABLE IF NOT EXISTS platform (key TEXT PRIMARY KEY, value TEXT NOT NULL, updatedAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS adminlog (id TEXT PRIMARY KEY, at TEXT NOT NULL, admin TEXT NOT NULL, orgId TEXT, action TEXT NOT NULL, detail TEXT);`)
  const q = (sql) => db.prepare(sql)
  const DEFAULT_PLANS = JSON.parse(JSON.stringify(plans))
  const DEFAULT_OPTIONS = JSON.parse(JSON.stringify(options))
  const getKey = (k, fallback) => { const r = q('SELECT value FROM platform WHERE key = ?').get(k); return r ? JSON.parse(r.value) : fallback }
  const setKey = (k, v) => q('INSERT INTO platform (key, value, updatedAt) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt').run(k, JSON.stringify(v), iso())

  /** Applique les tarifs enregistrés sur les objets PLANS / OPTIONS partagés (les limites suivent immédiatement). */
  const applyPlans = () => {
    const saved = getKey('plans', {})
    for (const [id, base] of Object.entries(DEFAULT_PLANS)) plans[id] = { ...base, ...(saved[id] ?? {}) }
    const savedOpt = getKey('options', {})
    for (const [id, base] of Object.entries(DEFAULT_OPTIONS)) options[id] = { ...base, ...(savedOpt[id] ?? {}) }
  }
  applyPlans()
  const moduleDefaults = () => {
    const saved = getKey('modules', {})
    return Object.fromEntries(Object.entries(MODULES).map(([k, m]) => [k, { label: m.label, core: !!m.core, enabled: saved[k]?.enabled ?? true, plans: saved[k]?.plans ?? null }]))
  }
  const config = () => ({ plans, options, modules: moduleDefaults(), settings: { requireVerification: getKey('requireVerification', false) } })

  const parse = (s, f) => { try { return JSON.parse(s ?? '') ?? f } catch { return f } }
  const orgExtra = (orgId) => { const r = q('SELECT verification, kyc, modules, adminNote FROM orgs WHERE id = ?').get(orgId); return r ? { verification: r.verification, kyc: parse(r.kyc, {}), modules: parse(r.modules, {}), adminNote: r.adminNote ?? null } : null }
  const setExtra = (orgId, patch) => {
    const sets = [], vals = []
    for (const [k, v] of Object.entries(patch)) { sets.push(`${k} = ?`); vals.push(typeof v === 'object' && v !== null ? JSON.stringify(v) : v) }
    q(`UPDATE orgs SET ${sets.join(', ')}, updatedAt = ? WHERE id = ?`).run(...vals, iso(), orgId)
  }
  /** Modules effectifs d’une agence : réglage de l’agence > réglage global (et offre) > activé. */
  const modulesFor = (org) => {
    const defs = moduleDefaults(), own = orgExtra(org.id)?.modules ?? {}
    return Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, own[k] ?? (d.enabled && (!d.plans || d.plans.includes(org.plan)))]))
  }
  const moduleOfAction = (name) => Object.entries(MODULES).find(([, m]) => m.actions.some((p) => (p.endsWith('.') ? name.startsWith(p) : name === p)))?.[0] ?? null
  const isAdmin = (user) => !!user && (!!user.platformAdmin || String(env.JASPE_ADMIN_EMAILS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).includes(String(user.email).toLowerCase()))
  const log = (admin, orgId, action, detail) => q('INSERT INTO adminlog (id, at, admin, orgId, action, detail) VALUES (?, ?, ?, ?, ?, ?)').run(`log_${randomUUID().slice(0, 12)}`, iso(), admin, orgId ?? null, action, detail ? JSON.stringify(detail) : null)

  /** Garde appelée pour chaque requête d’une agence : agence bloquée, module coupé, vérification exigée. */
  const guard = (org, parts, method) => {
    const ex = orgExtra(org.id)
    if (ex && BLOCKED.has(ex.verification)) throw new HttpError(403, `Agence ${VERIFICATION[ex.verification].toLowerCase()} par l’équipe Jaspe${ex.adminNote ? ` : ${ex.adminNote}` : ''}. Contactez le support.`)
    const [head, a] = parts
    if (head === 'actions' && a && method === 'POST') {
      const mod = moduleOfAction(a)
      if (mod && !modulesFor(org)[mod]) throw new HttpError(403, `Module « ${MODULES[mod].label} » non activé pour votre agence.`)
      if (getKey('requireVerification', false) && ex?.verification !== 'valide' && ['envois', 'mcp', 'whatsapp', 'factures'].includes(mod)) throw new HttpError(403, 'Fonction disponible une fois votre agence vérifiée (Réglages › Agence › Vérification).')
    }
  }

  const orgFile = (dataDir, orgId) => { try { return statSync(`${dataDir}/orgs/${orgId}.sqlite`).size } catch { return null } }
  const usageOf = (openOrg, orgId) => {
    const ctx = openOrg(orgId), counts = {}
    for (const c of ['dossiers', 'properties', 'contacts', 'buyers', 'documents', 'tasks', 'invoices', 'files', 'timelog', 'proofs']) { try { counts[c] = ctx.db.list(c).length } catch { counts[c] = 0 } }
    return counts
  }
  const summary = (org, { openOrg, dataDir }) => {
    const ex = orgExtra(org.id)
    return {
      id: org.id, name: org.name, country: org.country, plan: org.plan, status: org.status, createdAt: org.createdAt,
      verification: ex.verification, kycSubmitted: !!ex.kyc?.submittedAt, kycScore: ex.kyc?.result?.score ?? null,
      members: accounts.members(org.id).length, usage: usageOf(openOrg, org.id), sizeBytes: dataDir === ':memory:' ? null : orgFile(dataDir, org.id),
    }
  }

  /** Routes /api/admin/* (administrateur seulement). */
  async function route(req, res, parts, s, { send, readBody, openOrg, dataDir }) {
    if (!isAdmin(s.user)) throw new HttpError(403, 'Réservé aux administrateurs de la plateforme Jaspe')
    const [, a, b, c] = parts, m = req.method, who = s.user.email
    const orgs = () => q('SELECT * FROM orgs ORDER BY createdAt DESC').all().map((r) => accounts.getOrg(r.id))
    if (a === 'overview' && m === 'GET') {
      const all = orgs(), week = Date.now() - 7 * 864e5
      const users = q('SELECT COUNT(*) AS n FROM users').get().n
      const by = (k) => all.reduce((acc, o) => { const v = k === 'verification' ? orgExtra(o.id).verification : o[k]; acc[v] = (acc[v] ?? 0) + 1; return acc }, {})
      return send(res, 200, { orgs: all.length, users, newOrgs7d: all.filter((o) => Date.parse(o.createdAt) > week).length, byPlan: by('plan'), byCountry: by('country'), byVerification: by('verification'), pending: all.filter((o) => orgExtra(o.id).verification === 'en_attente' && orgExtra(o.id).kyc?.submittedAt).length, recent: q('SELECT * FROM adminlog ORDER BY at DESC LIMIT 15').all() })
    }
    if (a === 'orgs' && !b && m === 'GET') return send(res, 200, { orgs: orgs().map((o) => summary(o, { openOrg, dataDir })) })
    if (a === 'orgs' && b) {
      const org = accounts.getOrg(b)
      if (!org) throw new HttpError(404, 'Agence introuvable')
      if (!c && m === 'GET') {
        const ex = orgExtra(b)
        return send(res, 200, { ...summary(org, { openOrg, dataDir }), org, kyc: ex.kyc, modules: modulesFor(org), moduleOverrides: ex.modules, adminNote: ex.adminNote, membersList: accounts.members(b), invites: accounts.pendingInvites(b), log: q('SELECT * FROM adminlog WHERE orgId = ? ORDER BY at DESC LIMIT 50').all(b) })
      }
      const body = m === 'GET' ? {} : await readBody(req)
      if (c === 'verify' && m === 'POST') {
        if (!VERIFICATION[body.decision]) throw new HttpError(400, 'Décision : en_attente, valide, refuse ou suspendu')
        if ((body.decision === 'refuse' || body.decision === 'suspendu') && !String(body.note ?? '').trim()) throw new HttpError(400, 'Motif obligatoire pour refuser ou suspendre')
        setExtra(b, { verification: body.decision, adminNote: String(body.note ?? '').trim() || null })
        log(who, b, `verification:${body.decision}`, { note: body.note })
        return send(res, 200, { ok: true, verification: body.decision })
      }
      if (c === 'kyc' && m === 'POST') {
        const ex = orgExtra(b)
        const kyc = { ...ex.kyc, ...pickKyc(body.kyc ?? ex.kyc ?? {}) }
        kyc.result = await runKycChecks(kyc, org.country, { fetch, offline: env.JASPE_KYC === 'off' })
        setExtra(b, { kyc })
        log(who, b, 'kyc:controle', kyc.result.score)
        return send(res, 200, { kyc })
      }
      if (c === 'modules' && m === 'PUT') {
        const own = {}
        for (const [k, v] of Object.entries(body.modules ?? {})) if (MODULES[k] && (v === true || v === false)) own[k] = v
        setExtra(b, { modules: own })
        log(who, b, 'modules', own)
        return send(res, 200, { modules: modulesFor(accounts.getOrg(b)), moduleOverrides: own })
      }
      if (c === 'plan' && m === 'PUT') {
        if (!plans[body.plan]) throw new HttpError(400, 'Offre inconnue')
        const status = ['active', 'trialing', 'none', 'canceled', 'past_due'].includes(body.status) ? body.status : 'active'
        accounts.updateOrg(b, { plan: body.plan, status, seats: Number(body.seats) || org.seats })
        log(who, b, 'offre', { plan: body.plan, status, seats: body.seats })
        return send(res, 200, { org: accounts.getOrg(b) })
      }
      if (c === 'export' && m === 'GET') {
        const ctx = openOrg(b), data = {}
        for (const col of COLLECTIONS) { try { data[col] = ctx.db.list(col) } catch { /* collection absente */ } }
        log(who, b, 'export', null)
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'content-disposition': `attachment; filename="jaspe-${b}-${iso().slice(0, 10)}.json"` })
        return res.end(JSON.stringify({ org, members: accounts.members(b), exportedAt: iso(), data }, null, 2))
      }
      if (c === 'note' && m === 'PUT') { setExtra(b, { adminNote: String(body.note ?? '').slice(0, 1000) || null }); log(who, b, 'note', null); return send(res, 200, { ok: true }) }
    }
    if (a === 'config' && m === 'GET') return send(res, 200, config())
    if (a === 'config' && m === 'PUT') {
      const body = await readBody(req)
      if (body.plans) {
        const saved = getKey('plans', {})
        for (const [id, p] of Object.entries(body.plans)) {
          if (!DEFAULT_PLANS[id]) continue
          const clean = {}
          for (const f of PLAN_FIELDS) if (p[f] !== undefined) clean[f] = f === 'label' ? String(p[f]).slice(0, 40) : f === 'visible' ? !!p[f] : p[f] === null ? null : Math.max(0, Number(p[f]))
          saved[id] = { ...(saved[id] ?? {}), ...clean }
        }
        setKey('plans', saved)
      }
      if (body.options) { const saved = getKey('options', {}); for (const [id, o] of Object.entries(body.options)) if (DEFAULT_OPTIONS[id]) saved[id] = { ...(saved[id] ?? {}), ...(o.price !== undefined ? { price: Math.max(0, Number(o.price)) } : {}), ...(o.label ? { label: String(o.label).slice(0, 40) } : {}) }; setKey('options', saved) }
      if (body.modules) { const saved = getKey('modules', {}); for (const [k, v] of Object.entries(body.modules)) if (MODULES[k]) saved[k] = { enabled: v.enabled !== false, plans: Array.isArray(v.plans) && v.plans.length ? v.plans.filter((p) => plans[p]) : null }; setKey('modules', saved) }
      if (body.settings && 'requireVerification' in body.settings) setKey('requireVerification', !!body.settings.requireVerification)
      applyPlans()
      log(who, null, 'configuration', body)
      return send(res, 200, config())
    }
    if (a === 'admins' && m === 'GET') return send(res, 200, { admins: q('SELECT id, email, name FROM users WHERE platformAdmin = 1').all(), fromEnv: String(env.JASPE_ADMIN_EMAILS ?? '').split(',').map((s) => s.trim()).filter(Boolean) })
    if (a === 'admins' && m === 'POST') {
      const body = await readBody(req)
      const u = accounts.userByEmail(String(body.email ?? '').trim().toLowerCase())
      if (!u) throw new HttpError(404, 'Aucun compte avec cet e-mail')
      q('UPDATE users SET platformAdmin = ? WHERE id = ?').run(body.admin === false ? 0 : 1, u.id)
      log(who, u.orgId, body.admin === false ? 'admin:retire' : 'admin:ajoute', { email: u.email })
      return send(res, 200, { ok: true })
    }
    if (a === 'log' && m === 'GET') return send(res, 200, { log: q('SELECT * FROM adminlog ORDER BY at DESC LIMIT 200').all() })
    throw new HttpError(404, 'Route d’administration inconnue')
  }

  const pickKyc = (k) => ({ companyId: String(k.companyId ?? '').slice(0, 20), legalName: String(k.legalName ?? '').slice(0, 120), cardNumber: String(k.cardNumber ?? '').slice(0, 40), managerName: String(k.managerName ?? '').slice(0, 80), address: String(k.address ?? '').slice(0, 200) })
  /** Côté agence (responsable) : dépôt de la demande de vérification, contrôles automatiques immédiats. */
  async function submitKyc(org, user, body) {
    const ex = orgExtra(org.id)
    const kyc = { ...pickKyc(body), submittedAt: iso(), submittedBy: user.email }
    kyc.result = await runKycChecks(kyc, org.country, { fetch, offline: env.JASPE_KYC === 'off' })
    setExtra(org.id, { kyc, ...(ex.verification === 'valide' ? {} : { verification: 'en_attente' }) })
    log(user.email, org.id, 'kyc:depot', kyc.result.score)
    return { verification: ex.verification === 'valide' ? 'valide' : 'en_attente', kyc }
  }
  const publicPlans = () => ({ plans: Object.fromEntries(Object.entries(plans).filter(([, p]) => p.visible !== false)), options })

  return { config, modulesFor, isAdmin, guard, route, submitKyc, orgExtra, publicPlans, moduleOfAction, log }
}
