// Vérifie une instance Jaspe en ligne de bout en bout, comme un vrai utilisateur puis comme Claude ou Codex (MCP).
// Usage : node verifier-en-ligne.js https://jaspe.exemple.io
// Crée un compte de test jetable (verif-<horodatage>@jaspe.test), un dossier, un jeton MCP, puis appelle les outils MCP.
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { randomBytes } from 'node:crypto'

const base = String(process.argv[2] ?? 'http://127.0.0.1:5318').replace(/\/+$/, '')
let cookie = ''
const call = async (method, path, body) => {
  const r = await fetch(`${base}/api${path}`, { method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
  const set = r.headers.get('set-cookie'); if (set) cookie = set.split(';')[0]
  const json = await r.json().catch(() => ({}))
  if (r.status >= 400) throw new Error(`${method} ${path} → ${r.status} ${json.error ?? ''}`)
  return json
}
const ok = (m) => console.log(`✔ ${m}`)
const stamp = Date.now()

const health = await call('GET', '/health'); ok(`serveur joignable, comptes ${health.auth ? 'actifs' : 'INACTIFS'}`)
const me = await call('POST', '/auth/register', { name: 'Vérification Jaspe', email: `verif-${stamp}@jaspe.test`, password: randomBytes(12).toString('hex'), orgName: `Vérification ${stamp}`, country: 'FR', start: 'vide' })
ok(`compte créé : ${me.org.name} · offre ${me.plan.label}`)
const prop = await call('POST', '/properties', { title: 'Appartement T3', type: 'Appartement', city: 'Antibes', surface: 68, price: 280000, dpe: 'D', source: 'saisie' })
const d = await call('POST', '/dossiers', { seller: 'Famille Test', propertyId: prop.id, agentId: me.user.id, stage: 'prep', deliverables: {}, tags: [] })
ok(`dossier créé : ${d.ref ?? d.id}`)
const plan = await call('POST', '/actions/assistant.plan', { text: 'Je rappelle le vendeur vendredi après le diagnostic.' })
ok(`débrief → plan : ${plan.items.map((i) => i.label).join(' · ')}`)
const tok = await call('POST', '/actions/apitoken.create', { name: 'Vérification MCP' })
ok('jeton MCP créé')

const client = new Client({ name: 'verification-jaspe', version: '1.0.0' })
await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`), { requestInit: { headers: { Authorization: `Bearer ${tok.token}` } } }))
const { tools } = await client.listTools()
ok(`MCP : ${tools.length} outils (${tools.map((t) => t.name.replace('jaspe_', '')).join(', ')})`)
const txt = (r) => JSON.parse(r.content[0].text)
const list = txt(await client.callTool({ name: 'jaspe_dossiers', arguments: {} }))
ok(`MCP lecture : ${list.total} dossier(s) — ${list.dossiers.map((x) => x.vendeur).join(', ')}`)
const prop2 = txt(await client.callTool({ name: 'jaspe_proposer_relance', arguments: { dossierId: d.id, destinataire: 'vendeur', objet: 'retour après le diagnostic', message: 'Bonjour, je reviens vers vous après le diagnostic comme convenu.' } }))
ok(`MCP proposition : ${prop2.statut}`)
const market = txt(await client.callTool({ name: 'jaspe_marche', arguments: { dossierId: d.id } }))
ok(`MCP marché : ${market.ventes} vente(s) réelle(s)${market.mediane_eur_m2 ? `, médiane ${market.mediane_eur_m2} €/m²` : ''}${market.note ? ` (${market.note})` : ''}`)
await client.close()
await call('POST', '/actions/apitoken.revoke', { id: (await call('POST', '/actions/apitoken.list', {})).tokens.find((t) => t.name === 'Vérification MCP').id })
ok('jeton de vérification révoqué')
console.log(`\nTout fonctionne sur ${base}`)
