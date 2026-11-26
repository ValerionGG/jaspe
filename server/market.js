// Données de marché réelles. Code pur (aucune API Node) : `fetch` est injecté, ce module peut donc tourner
// aussi dans le navigateur. Stratégie (research/benchmark-2026-11/strategie.md) : DVF (données ouvertes) d'abord,
// Casafari seulement si le client a déjà un compte. Jamais de base de comparables maison, jamais de scraping.
//
// France — DVF géolocalisées (Etalab, d'après les demandes de valeurs foncières DGFiP), fichiers CSV par commune et par année :
//   jeu de données : https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres-geolocalisees/
//   fichiers       : https://files.data.gouv.fr/geo-dvf/latest/csv/<année>/communes/<département>/<code INSEE>.csv
//   (vérifié le 26/11/2026 : millésimes 2021 à 2025, 2025 couvert jusqu'au 31/12/2025 ; 2026 pas encore publié → 404)
// Code INSEE : API Géo de l'État (données ouvertes), https://geo.api.gouv.fr/communes
// L'API DVF+ du Cerema (apidf.cerema.fr) répondait 502/503 lors de la vérification : non retenue.
// Portugal — Casafari : connecteur optionnel (CASAFARI_API_KEY + CASAFARI_COMPARABLES_URL tirée de la documentation
// du compte client ; format de réponse à confirmer). Sans clé : « non configuré ».

export const DVF = {
  label: 'DVF géolocalisées — Etalab / DGFiP (données ouvertes)',
  dataset: 'https://www.data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres-geolocalisees/',
  files: 'https://files.data.gouv.fr/geo-dvf/latest/csv',
  geo: 'https://geo.api.gouv.fr/communes',
  explorer: 'https://app.dvf.etalab.gouv.fr/',
}
export const CACHE_DAYS = 7
const PLM = new Set(['75056', '69123', '13055']) // Paris, Lyon, Marseille : DVF par arrondissement

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
export const median = (a) => {
  const s = a.filter((x) => Number.isFinite(x)).sort((x, y) => x - y)
  if (!s.length) return 0
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
/** Maison ou Appartement (libellés DVF `type_local`) à partir du type de la fiche. */
export const dvfType = (t) => (/appart|penthouse|studio|duplex|triplex|loft|\bt\d\b|\bf\d\b|r[ée]sidence/i.test(String(t ?? '')) ? 'Appartement' : 'Maison')

/** CSV RFC 4180 (séparateur virgule, guillemets doublés). */
export function parseCsv(text) {
  const rows = []
  let row = [], cell = '', q = false
  const s = String(text ?? '').replace(/^﻿/, '')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) {
      if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++ } else q = false } else cell += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  const [head = [], ...body] = rows.filter((r) => r.length > 1 || r[0])
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])))
}

/**
 * Ventes simples d'un logement : mutation « Vente », un seul local Maison/Appartement distinct
 * (les dépendances sont ignorées ; les ventes en bloc de plusieurs logements sont écartées, leur prix n'étant pas ventilé).
 */
export function dvfSales(records) {
  const byId = new Map()
  for (const r of records) { if (!byId.has(r.id_mutation)) byId.set(r.id_mutation, []); byId.get(r.id_mutation).push(r) }
  const out = []
  for (const [id, rs] of byId) {
    const r0 = rs[0]
    if (r0.nature_mutation !== 'Vente') continue
    const homes = new Map()
    for (const r of rs) if (r.type_local === 'Maison' || r.type_local === 'Appartement') homes.set(`${r.type_local}|${r.surface_reelle_bati}|${r.adresse_numero}|${r.adresse_nom_voie}`, r)
    if (homes.size !== 1) continue
    const h = [...homes.values()][0]
    const price = Number(r0.valeur_fonciere), surface = Number(h.surface_reelle_bati)
    if (!(price > 0 && surface > 0)) continue
    out.push({
      id, date: r0.date_mutation, price, surface, type: h.type_local, rooms: Number(h.nombre_pieces_principales) || null,
      address: [h.adresse_numero, h.adresse_suffixe, h.adresse_nom_voie].filter(Boolean).join(' ').trim(),
      postalCode: h.code_postal, commune: h.nom_commune, insee: h.code_commune,
      lat: h.latitude ? Number(h.latitude) : null, lng: h.longitude ? Number(h.longitude) : null,
    })
  }
  return out
}

export function createMarket({ db, fetch, env = {}, now = () => Date.now() } = {}) {
  if (!db) throw new Error('createMarket : db requis')
  const nowMs = () => Number(new Date(now()))
  const iso = () => new Date(nowMs()).toISOString()
  const fresh = (doc) => doc && nowMs() - Date.parse(doc.at) < CACHE_DAYS * 864e5
  const cacheGet = (id) => db.get('marketcache', id)
  const cachePut = (doc) => db.put('marketcache', { ...doc, at: iso() })
  const getJson = async (url, init) => {
    const r = await fetch(url, init)
    if (!r.ok) { const e = new Error(`HTTP ${r.status} — ${url}`); e.status = r.status; throw e }
    return r.json()
  }

  /** Code INSEE de la commune du bien (API Géo). Mis en cache. */
  async function commune(property) {
    if (property.insee && property.codeDepartement) return { code: property.insee, nom: property.city, codeDepartement: property.codeDepartement }
    const cp = String(property.postalCode ?? property.zip ?? property.cp ?? '').trim()
    const key = `geo-${norm(property.city).replace(/ /g, '-')}-${cp}`
    const hit = cacheGet(key)
    if (fresh(hit)) return hit.commune
    const f = 'fields=code,nom,codesPostaux,codeDepartement'
    let list = []
    if (cp) list = await getJson(`${DVF.geo}?codePostal=${encodeURIComponent(cp)}&${f}`)
    if (!list.length && property.city) list = await getJson(`${DVF.geo}?nom=${encodeURIComponent(property.city)}&${f}&boost=population&limit=5`)
    let c = list.find((x) => norm(x.nom) === norm(property.city)) ?? list[0] ?? null
    if (c && PLM.has(c.code) && cp) c = (await getJson(`${DVF.geo}?codePostal=${encodeURIComponent(cp)}&type=arrondissement-municipal&${f}`))[0] ?? c
    if (!c) return null
    const out = { code: c.code, nom: c.nom, codeDepartement: c.codeDepartement }
    cachePut({ id: key, kind: 'geo', commune: out, source: DVF.geo })
    return out
  }

  /** Ventes d'une commune pour une année : fichier officiel, compacté et mis en cache 7 jours. */
  async function year(c, y) {
    const id = `dvf-${c.code}-${y}`
    const hit = cacheGet(id)
    if (fresh(hit)) return { ...hit, cached: true }
    const url = `${DVF.files}/${y}/communes/${c.codeDepartement}/${c.code}.csv`
    try {
      const r = await fetch(url)
      if (r.status === 404) return { ...cachePut({ id, kind: 'dvf', url, year: y, published: false, sales: [] }), cached: false }
      if (!r.ok) throw new Error(`HTTP ${r.status} — ${url}`)
      const sales = dvfSales(parseCsv(await r.text()))
      return { ...cachePut({ id, kind: 'dvf', url, year: y, published: true, sales }), cached: false }
    } catch (e) {
      if (hit) return { ...hit, cached: true, stale: true }
      throw e
    }
  }

  async function dvf(property, { months = 24, tolerance = 0.3 } = {}) {
    const base = { country: 'FR', source: DVF.label, sourceUrl: DVF.dataset }
    if (!property?.city && !property?.insee) return { ...base, status: 'incomplet', note: 'Commune du bien manquante', comparables: [], count: 0 }
    const c = await commune(property)
    if (!c) return { ...base, status: 'introuvable', note: `Commune « ${property.city} » introuvable dans l’API Géo`, comparables: [], count: 0 }
    const type = dvfType(property.type)
    const surface = Number(property.surface) || 0
    const end = new Date(nowMs()), start = new Date(nowMs()); start.setMonth(start.getMonth() - months)
    const from = start.toISOString().slice(0, 10), to = end.toISOString().slice(0, 10)
    const files = []
    for (let y = start.getFullYear(); y <= end.getFullYear(); y++) files.push(await year(c, y))
    const [sMin, sMax] = surface ? [Math.round(surface * (1 - tolerance)), Math.round(surface * (1 + tolerance))] : [0, Infinity]
    const comparables = files.flatMap((f) => f.sales.map((s) => ({ ...s, sourceUrl: f.url })))
      .filter((s) => s.type === type && s.surface >= sMin && s.surface <= sMax && s.date >= from && s.date <= to)
      .map((s) => ({ ...s, ppm: Math.round(s.price / s.surface), source: 'DVF', sourceLabel: `DVF ${s.date.slice(0, 4)} — data.gouv.fr`, explorer: DVF.explorer }))
      .sort((a, b) => b.date.localeCompare(a.date))
    const published = files.filter((f) => f.published)
    const lastDate = comparables[0]?.date ?? null
    return {
      ...base, status: comparables.length ? 'ok' : 'vide', insee: c.code, commune: c.nom, type, surfaceRange: [sMin, Number.isFinite(sMax) ? sMax : null], period: { from, to },
      count: comparables.length, medianPpm: Math.round(median(comparables.map((x) => x.ppm))), lastDate,
      files: files.map((f) => ({ year: f.year, url: f.url, published: f.published, fetchedAt: f.at, cached: !!f.cached, stale: !!f.stale })),
      fetchedAt: files.map((f) => f.at).sort()[0] ?? iso(), cached: files.every((f) => f.cached),
      comparables,
      note: `Ventes « ${type} » à ${c.nom} (${c.code}), ${sMin}–${Number.isFinite(sMax) ? sMax : '∞'} m², du ${from} au ${to}. Millésimes publiés : ${published.map((f) => f.year).join(', ') || 'aucun'} ; les ventes récentes paraissent avec ~6 mois de décalage.`,
    }
  }

  /** Portugal : Casafari via le compte existant du client. Endpoint et format à confirmer avec sa documentation API. */
  async function casafari(property, { months = 24, tolerance = 0.3 } = {}) {
    const base = { country: 'PT', source: 'Casafari (compte client)', sourceUrl: 'https://www.casafari.com/products/property-data-api', comparables: [], count: 0 }
    if (!env.CASAFARI_API_KEY) return { ...base, status: 'non configuré', note: 'Connecteur Casafari non configuré : renseignez CASAFARI_API_KEY (compte Casafari existant). Pas d’autre source au Portugal : ni base maison ni scraping.' }
    if (!env.CASAFARI_COMPARABLES_URL) return { ...base, status: 'à configurer', note: 'Clé Casafari présente : renseignez CASAFARI_COMPARABLES_URL (endpoint « comparables » de la documentation API de votre compte).' }
    const surface = Number(property.surface) || 0
    const key = `casafari-${property.id ?? norm(property.city)}-${surface}-${months}`
    const hit = cacheGet(key)
    if (fresh(hit)) return { ...hit.result, cached: true }
    const body = { location: property.city, address: property.address, type: dvfType(property.type) === 'Appartement' ? 'apartment' : 'house', area_min: Math.round(surface * (1 - tolerance)), area_max: Math.round(surface * (1 + tolerance)), months, lat: property.lat, lng: property.lng }
    const json = await getJson(env.CASAFARI_COMPARABLES_URL, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `${env.CASAFARI_AUTH_SCHEME ?? 'Token'} ${env.CASAFARI_API_KEY}` }, body: JSON.stringify(body) })
    const list = Array.isArray(json) ? json : json.results ?? json.data ?? json.comparables ?? []
    const comparables = list.map((x, i) => {
      const price = Number(x.sale_price ?? x.price ?? x.transaction_price), surf = Number(x.area ?? x.total_area ?? x.surface)
      return { id: String(x.id ?? i), date: String(x.sale_date ?? x.transaction_date ?? x.date ?? '').slice(0, 10), price, surface: surf, ppm: price && surf ? Math.round(price / surf) : null, address: x.address ?? x.location ?? '', commune: x.municipality ?? property.city, type: x.type ?? body.type, source: 'Casafari', sourceUrl: x.url ?? base.sourceUrl }
    }).filter((x) => x.price > 0 && x.surface > 0 && x.date)
    const result = { ...base, status: comparables.length ? 'ok' : 'vide', count: comparables.length, medianPpm: Math.round(median(comparables.map((x) => x.ppm))), lastDate: comparables.map((x) => x.date).sort().pop() ?? null, comparables, fetchedAt: iso(), note: 'Correspondance des champs Casafari à confirmer avec la documentation API du compte.' }
    cachePut({ id: key, kind: 'casafari', result })
    return { ...result, cached: false }
  }

  const countryOf = (property, opts) => String(opts?.country ?? property?.country ?? db.get('settings', 'agency')?.country ?? 'FR').toUpperCase() === 'PT' ? 'PT' : 'FR'

  /** Comparables vendus et datés pour un bien. Résultat mémorisé (`marketcache/comps-<id>`) pour `cached()`. */
  async function comparables(property, opts = {}) {
    if (!property) throw new Error('Bien requis')
    let res
    try {
      res = countryOf(property, opts) === 'PT' ? await casafari(property, opts) : await dvf(property, opts)
    } catch (e) {
      return { country: countryOf(property, opts), status: 'erreur', note: `Source indisponible : ${e.message}`, comparables: [], count: 0 }
    }
    if (property.id && ['ok', 'vide'].includes(res.status)) cachePut({ id: `comps-${property.id}`, kind: 'comps', propertyId: property.id, result: res })
    return res
  }
  /** Lecture synchrone du dernier résultat (pour `ctx()` du moteur, qui est synchrone). Aucun appel réseau. */
  const cached = (property) => (property?.id ? cacheGet(`comps-${property.id}`)?.result ?? null : null)

  const status = () => ({
    FR: { source: DVF.label, state: 'actif (données ouvertes, sans clé)', url: DVF.dataset },
    PT: { source: 'Casafari', state: !env.CASAFARI_API_KEY ? 'non configuré' : !env.CASAFARI_COMPARABLES_URL ? 'à configurer' : 'configuré' },
    cacheDays: CACHE_DAYS,
  })

  const actions = {
    /** payload : { propertyId | dossierId, refresh?, cachedOnly?, months?, tolerance? } */
    'market.comparables': async ({ propertyId, dossierId, cachedOnly = false, refresh = false, months, tolerance } = {}) => {
      const pid = propertyId ?? (dossierId ? db.get('dossiers', dossierId)?.propertyId : null)
      const p = pid ? db.get('properties', pid) : null
      if (!p) { const e = new Error('Bien introuvable'); e.status = 404; throw e }
      if (cachedOnly) return cached(p) ?? { status: 'absent', comparables: [], count: 0, country: countryOf(p) }
      if (refresh) for (const d of db.list('marketcache')) if (d.kind === 'dvf' || d.kind === 'casafari') db.patch('marketcache', d.id, { at: '1970-01-01T00:00:00.000Z' })
      return comparables(p, { months, tolerance })
    },
    'market.status': () => status(),
  }

  return { comparables, cached, status, actions }
}
