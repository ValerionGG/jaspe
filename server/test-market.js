// Données de marché : DVF (France) et Casafari (Portugal). `fetch` est TOUJOURS simulé : aucun appel réseau.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openDb } from './db.js'
import { createMarket, parseCsv, dvfSales, median } from './market.js'
import { createAssist } from './assist.js'
import { createEvidence, impicDeadline } from './evidence.js'
import { HttpError } from './engine.js'

const NOW = Date.parse('2026-11-26T09:00:00Z')
const HEAD = 'id_mutation,date_mutation,numero_disposition,nature_mutation,valeur_fonciere,adresse_numero,adresse_suffixe,adresse_nom_voie,adresse_code_voie,code_postal,code_commune,nom_commune,code_departement,ancien_code_commune,ancien_nom_commune,id_parcelle,ancien_id_parcelle,numero_volume,lot1_numero,lot1_surface_carrez,lot2_numero,lot2_surface_carrez,lot3_numero,lot3_surface_carrez,lot4_numero,lot4_surface_carrez,lot5_numero,lot5_surface_carrez,nombre_lots,code_type_local,type_local,surface_reelle_bati,nombre_pieces_principales,code_nature_culture,nature_culture,code_nature_culture_speciale,nature_culture_speciale,surface_terrain,longitude,latitude'
const row = (id, date, nature, value, num, voie, type, surface, rooms = 3) => {
  const o = Object.fromEntries(HEAD.split(',').map((k) => [k, '']))
  Object.assign(o, { id_mutation: id, date_mutation: date, nature_mutation: nature, valeur_fonciere: value, adresse_numero: num, adresse_nom_voie: voie, code_postal: '06600', code_commune: '06004', nom_commune: 'Antibes', code_departement: '06', type_local: type, surface_reelle_bati: surface, nombre_pieces_principales: rooms, longitude: '7.12', latitude: '43.58' })
  return HEAD.split(',').map((k) => (/[,"]/.test(String(o[k])) ? `"${String(o[k]).replace(/"/g, '""')}"` : o[k])).join(',')
}
const CSV = {
  2024: [HEAD,
    row('2024-1', '2024-05-01', 'Vente', 300000, 1, 'AV DE NICE', 'Appartement', 60), // hors période (> 24 mois)
    row('2024-2', '2024-12-15', 'Vente', 330000, 5, 'BD WILSON', 'Appartement', 55), // 6 000 €/m²
  ].join('\n'),
  2025: [HEAD,
    row('2025-1', '2025-06-01', 'Vente', 300000, 51, 'AV DE NICE', 'Appartement', 60), // 5 000
    row('2025-1', '2025-06-01', 'Vente', 300000, 51, 'AV DE NICE', 'Dépendance', ''), // cave : ignorée
    row('2025-2', '2025-03-10', 'Vente', 420000, 3, 'RUE "DES" ROSES, BAT A', 'Appartement', 70), // 6 000, champ entre guillemets
    row('2025-3', '2025-09-15', 'Vente', 455000, 8, 'CH DES NIELLES', 'Appartement', 65), // 7 000
    row('2025-4', '2025-04-02', 'Vente', 900000, 2, 'CH DU CAP', 'Maison', 65), // autre type
    row('2025-5', '2025-05-02', 'Vente', 800000, 9, 'AV DE NICE', 'Appartement', 120), // surface hors ± 30 %
    row('2025-6', '2025-05-03', 'Echange', 300000, 9, 'AV DE NICE', 'Appartement', 60), // pas une vente
    row('2025-7', '2025-05-04', 'Vente', 700000, 1, 'RUE A', 'Appartement', 60), // vente en bloc
    row('2025-7', '2025-05-04', 'Vente', 700000, 2, 'RUE B', 'Appartement', 62),
  ].join('\r\n'),
}

function mockFetch() {
  const calls = []
  const fetch = async (url) => {
    calls.push(String(url))
    if (String(url).startsWith('https://geo.api.gouv.fr/communes')) return { ok: true, status: 200, json: async () => [{ code: '06004', nom: 'Antibes', codesPostaux: ['06160', '06600'], codeDepartement: '06' }] }
    const m = String(url).match(/geo-dvf\/latest\/csv\/(\d{4})\/communes\/06\/06004\.csv$/)
    if (m && CSV[m[1]]) return { ok: true, status: 200, text: async () => CSV[m[1]] }
    return { ok: false, status: 404, text: async () => 'NoSuchKey' }
  }
  return { fetch, calls }
}
const PROP = { id: 'p1', type: 'Appartement T3', address: '10 av. de Nice', city: 'Antibes', postalCode: '06600', surface: 62, price: 396000 }

test('CSV et regroupement des mutations DVF', () => {
  const recs = parseCsv(CSV[2025])
  assert.equal(recs[2].adresse_nom_voie, 'RUE "DES" ROSES, BAT A')
  const sales = dvfSales(recs)
  assert.deepEqual(sales.map((s) => s.id).sort(), ['2025-1', '2025-2', '2025-3', '2025-4', '2025-5'], 'échange et vente en bloc écartés')
  assert.equal(median([5000, 6000, 7000, 6000]), 6000)
})

test('DVF : filtres, médiane, source et date de chaque comparable, puis cache', async () => {
  const db = openDb(':memory:')
  const { fetch, calls } = mockFetch()
  const market = createMarket({ db, fetch, env: {}, now: () => NOW })
  const r = await market.comparables(PROP)
  assert.equal(r.status, 'ok')
  assert.equal(r.insee, '06004')
  assert.equal(r.type, 'Appartement')
  assert.deepEqual(r.surfaceRange, [43, 81])
  assert.deepEqual(r.period, { from: '2024-11-26', to: '2026-11-26' })
  assert.deepEqual(r.comparables.map((c) => c.id), ['2025-3', '2025-1', '2025-2', '2024-2'], 'même type, ± 30 %, 24 mois, du plus récent au plus ancien')
  assert.equal(r.count, 4)
  assert.equal(r.medianPpm, 6000)
  assert.equal(r.lastDate, '2025-09-15')
  for (const c of r.comparables) {
    assert.equal(c.source, 'DVF')
    assert.match(c.sourceUrl, /^https:\/\/files\.data\.gouv\.fr\/geo-dvf\/latest\/csv\/202[45]\/communes\/06\/06004\.csv$/)
    assert.match(c.date, /^\d{4}-\d{2}-\d{2}$/)
  }
  assert.equal(r.files.find((f) => f.year === 2026).published, false, '2026 pas encore publié (404)')
  assert.equal(calls.length, 4, 'API Géo + 3 millésimes')
  assert.equal(r.cached, false)

  const again = await market.comparables(PROP)
  assert.equal(calls.length, 4, 'second appel servi par le cache marketcache')
  assert.equal(again.cached, true)
  assert.equal(again.medianPpm, 6000)
  assert.ok(db.get('marketcache', 'dvf-06004-2025').sales.length)
  assert.equal(market.cached(PROP).count, 4, 'lecture synchrone pour ctx()')

  // Cache périmé (> 7 jours) : nouvelle lecture des fichiers
  const later = createMarket({ db, fetch, env: {}, now: () => NOW + 8 * 864e5 })
  await later.comparables(PROP)
  assert.ok(calls.length > 4)
})

test('Portugal : Casafari non configuré sans clé, aucun appel réseau', async () => {
  const db = openDb(':memory:')
  const { fetch, calls } = mockFetch()
  db.put('settings', { id: 'agency', country: 'PT' })
  const market = createMarket({ db, fetch, env: {}, now: () => NOW })
  const r = await market.comparables({ id: 'pt1', city: 'Lisboa', type: 'Apartamento', surface: 80, price: 5e5 })
  assert.equal(r.status, 'non configuré')
  assert.match(r.note, /CASAFARI_API_KEY/)
  assert.equal(calls.length, 0)
  assert.equal(market.status().PT.state, 'non configuré')
  const half = createMarket({ db, fetch, env: { CASAFARI_API_KEY: 'k' }, now: () => NOW })
  assert.equal((await half.comparables({ id: 'pt1', city: 'Lisboa', surface: 80 })).status, 'à configurer')
  assert.equal(calls.length, 0)
})

function assistWith(db, market) {
  const put = (c, d, o) => db.put(c, d, o)
  const patch = (c, id, p) => db.patch(c, id, p)
  const notify = (title, body, tone = 'info', link) => put('notifications', { at: new Date().toISOString(), title, body, tone, link, read: false }, { front: true })
  return createAssist(db, { put, patch, notify, activity: () => {}, run: () => {}, generate: async () => {}, HttpError, market })
}
function seedWatch(db) {
  db.put('properties', PROP)
  db.put('properties', { id: 'p2', city: 'Antibes', surface: 100, price: 2e6 })
  db.put('dossiers', { id: 'd1', ref: 'VND-1', seller: 'Famille Test', propertyId: 'p1', deliverables: {} })
  db.put('watches', { id: 'w-d1', dossierId: 'd1', active: true })
}

test('AUT-121 avec ventes DVF réelles (simulées) : source et date dans la notification', async () => {
  const db = openDb(':memory:')
  const { fetch } = mockFetch()
  seedWatch(db)
  const assist = assistWith(db, createMarket({ db, fetch, env: {}, now: () => NOW }))
  const [status, detail] = assist.rules['AUT-121']()
  assert.equal(status, 'ok')
  assert.match(detail, /ventes réelles/)
  await assist.rules['AUT-121'].pending
  const w = db.get('watches', 'w-d1')
  assert.equal(w.last.comps, 4)
  assert.equal(w.last.med, 6000)
  assert.equal(w.last.ppm, 6387)
  assert.equal(w.last.gap, 6)
  assert.equal(w.last.lastDate, '2025-09-15')
  const n = db.list('notifications').find((x) => x.title === 'Veille marché')
  assert.match(n.body, /4 vente\(s\) comparable\(s\) à Antibes/)
  assert.match(n.body, /DVF/)
  assert.match(n.body, /2024-11-26 au 2025-09-15/)
  // une seule exécution par jour et par dossier
  assert.equal(assist.rules['AUT-121']()[0], 'skip')
})

test('AUT-121 sans connecteur marché : comportement de démonstration conservé', () => {
  const db = openDb(':memory:')
  seedWatch(db)
  const assist = assistWith(db, undefined)
  assert.equal(assist.rules['AUT-121']()[0], 'ok')
  assert.match(db.list('notifications')[0].body, /biens de démonstration/)
})

test('IMPIC : échéance fin du trimestre suivant, rappels J-15 puis J-3 (Portugal)', () => {
  assert.equal(impicDeadline(2022, 4).deadlineIso, '2023-03-31')
  assert.equal(impicDeadline(2026, 3).deadlineIso, '2026-12-31')
  const db = openDb(':memory:')
  db.put('settings', { id: 'agency', country: 'PT' })
  let clock = Date.parse('2026-12-10T10:00:00')
  const ev = createEvidence(db, { HttpError, sha256: async () => '0'.repeat(64), now: () => clock })
  const impic = () => db.list('notifications').filter((x) => x.id.startsWith('n-impic-'))
  clock = Date.parse('2026-12-10T10:00:00'); ev.rules['AUT-123']() // J-21 : rien
  assert.equal(impic().length, 0)
  clock = Date.parse('2026-12-17T10:00:00'); ev.rules['AUT-123'](); ev.rules['AUT-123']() // J-14
  assert.deepEqual(impic().map((x) => x.id), ['n-impic-2026-12-31-j15'])
  clock = Date.parse('2026-12-29T10:00:00'); ev.rules['AUT-123']() // J-2
  assert.deepEqual(impic().map((x) => x.id).sort(), ['n-impic-2026-12-31-j15', 'n-impic-2026-12-31-j3'])
  assert.match(impic().find((x) => x.id.endsWith('j3')).body, /a confirmar/)
  assert.equal(ev.actions['impic.quarter']({ year: 2026, quarter: 3 }).deadline.date, '2026-12-31')
})
