// Données géographiques & commerciales de démonstration — synthétiques.
import { PROPERTIES, img, type Property } from './mock'

export const DPE_C = { A: '#3F8F5A', B: '#6BAF5B', C: '#B8C94A', D: '#F2D43A', E: '#F0A43A', F: '#E86F3A', G: '#D4402F' } as const
export type Dpe = keyof typeof DPE_C

/** Distance en mètres (haversine). */
export function dist(a: [number, number], b: [number, number]) {
  const R = 6371000, r = Math.PI / 180
  const dLat = (b[1] - a[1]) * r, dLng = (b[0] - a[0]) * r
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
export const meters = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`)

// PRNG déterministe (mulberry32) pour des données stables entre rendus.
export function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const seedOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)

// ——— Biens en diffusion ———
const EXTRA: Property[] = [
  { id: 'x1', title: 'Villa Art déco & jardin', type: 'Villa', address: '6 avenue du Roi Albert', district: 'Californie', city: 'Cannes', surface: 262, rooms: 7, land: 1300, price: 3450000, estimateLow: 3250000, estimateHigh: 3600000, dpe: 'D', photo: img('house-dusk3'), gallery: [img('house-dusk3'), img('int-lounge'), img('int-bedroom'), img('int-bath')], lat: 43.556, lng: 7.04, features: ['Jardin palmeraie', 'Vue baie de Cannes', 'Maison de gardien'], year: 1928 },
  { id: 'x2', title: 'Mas contemporain', type: 'Maison', address: '12 chemin de la Peyrière', district: 'Mougins', city: 'Mougins', surface: 210, rooms: 6, land: 2200, price: 1980000, estimateLow: 1850000, estimateHigh: 2080000, dpe: 'C', photo: img('house-garden'), gallery: [img('house-garden'), img('int-family'), img('int-kitchen')], lat: 43.6, lng: 6.997, features: ['Piscine', 'Terrain plat', 'Calme absolu'], year: 2012 },
  { id: 'x3', title: 'Appartement terrasse vue baie', type: 'Appartement', address: '9 avenue Docteur Dautheville', district: 'Juan-les-Pins', city: 'Antibes', surface: 96, rooms: 3, price: 1150000, estimateLow: 1060000, estimateHigh: 1190000, dpe: 'E', photo: img('nice-riviera'), gallery: [img('nice-riviera'), img('int-glass'), img('int-bedroom')], lat: 43.565, lng: 7.106, features: ['Terrasse 40 m²', 'Vue mer', 'Parking'], year: 1974 },
  { id: 'x4', title: 'Maison de village', type: 'Maison', address: '4 rue Saint-Sébastien', district: 'Biot village', city: 'Biot', surface: 104, rooms: 4, price: 790000, estimateLow: 720000, estimateHigh: 820000, dpe: 'F', photo: img('medit-street'), gallery: [img('medit-street'), img('int-boho'), img('int-chair')], lat: 43.6275, lng: 7.0985, features: ['Pierres apparentes', 'Terrasse tropézienne', 'Travaux énergétiques à prévoir'], year: 1850 },
]

export const PORTALS = ['SeLoger', 'Leboncoin', 'Bien’ici', 'Belles Demeures', 'Figaro Prestige'] as const
export type Portal = (typeof PORTALS)[number]
export type PortalState = 'publiee' | 'rejetee' | 'attente' | 'consigne' | 'off'
export type ListingStatus = 'Diffusé' | 'Avant-première' | 'Sous offre' | 'Compromis' | 'Brouillon'

export const QUALITY_CHECKS = [
  { k: 'photos', l: '15 photos HD minimum', w: 15 },
  { k: 'plan', l: 'Plan 2D coté', w: 15 },
  { k: 'visite3d', l: 'Visite virtuelle 3D', w: 15 },
  { k: 'dpe', l: 'Étiquettes DPE/GES et estimation des coûts énergétiques', w: 20, legal: true },
  { k: 'honoraires', l: 'Honoraires TTC et partie qui les supporte', w: 20, legal: true },
  { k: 'carrez', l: 'Surface habitable / Carrez', w: 5 },
  { k: 'texte', l: 'Description de 1 200 signes minimum', w: 10 },
] as const
export type CheckKey = (typeof QUALITY_CHECKS)[number]['k']

export type Listing = Property & {
  ref: string; status: ListingStatus; days: number; views: number; contacts: number; visits: number; offers: number
  daily: number[]; portals: Record<Portal, { state: PortalState; views: number; note?: string }>
  checks: Record<CheckKey, boolean>; quality: number; agentId: string
  // Champs réels de l'annonce (absents des amorces : on retombe alors sur `checks`)
  photoCount?: number; plan?: boolean; tour3d?: string; energyCost?: string; fees?: string; description?: string
  compsExcluded?: Record<string, string>; valuation?: { sea: boolean; cond: string; land: number; floor: string; radius: number; target: number | null }
}

const META: Record<string, Pick<Listing, 'status' | 'agentId'> & { missing: CheckKey[]; rejected?: [Portal, string]; waiting?: Portal[] }> = {
  p1: { status: 'Avant-première', agentId: 'a1', missing: ['visite3d'], waiting: ['Figaro Prestige'] },
  p2: { status: 'Brouillon', agentId: 'a1', missing: ['plan', 'visite3d', 'dpe'] },
  p3: { status: 'Diffusé', agentId: 'a3', missing: [] },
  p4: { status: 'Sous offre', agentId: 'a7', missing: ['visite3d'] },
  p5: { status: 'Diffusé', agentId: 'a4', missing: ['visite3d', 'plan'], waiting: ['Belles Demeures'] },
  p6: { status: 'Compromis', agentId: 'a3', missing: ['plan'] },
  p7: { status: 'Diffusé', agentId: 'a2', missing: ['honoraires'], rejected: ['SeLoger', 'Mention des honoraires absente'] },
  p8: { status: 'Compromis', agentId: 'a7', missing: [] },
  p9: { status: 'Diffusé', agentId: 'a3', missing: ['texte'] },
  p10: { status: 'Diffusé', agentId: 'a2', missing: ['visite3d'], waiting: ['Leboncoin'] },
  p11: { status: 'Avant-première', agentId: 'a4', missing: ['plan'] },
  p12: { status: 'Diffusé', agentId: 'a7', missing: ['visite3d', 'texte'] },
  x1: { status: 'Diffusé', agentId: 'a2', missing: ['texte'] },
  x2: { status: 'Diffusé', agentId: 'a4', missing: ['visite3d'] },
  x3: { status: 'Diffusé', agentId: 'a3', missing: ['dpe', 'plan'], rejected: ['Bien’ici', 'Estimation des coûts énergétiques manquante'] },
  x4: { status: 'Diffusé', agentId: 'a7', missing: ['photos', 'visite3d'] },
}

// ponytail: coordonnées de démo tombées en mer (vérifié sur les tuiles), recalées sur la terre la plus proche
const COORD_FIX: Record<string, [number, number]> = { p3: [7.1133, 43.5675], p9: [7.1066, 43.5694], x3: [7.1093, 43.5692] }

export const LISTINGS: Listing[] = [...PROPERTIES, ...EXTRA.filter((e) => !PROPERTIES.some((p) => p.id === e.id))].map((p, i) => {
  const m: (typeof META)[string] = META[p.id] ?? { status: 'Diffusé', agentId: 'a1', missing: ['visite3d'] }, r = rng(seedOf(p.id))
  const live = m.status !== 'Brouillon' && m.status !== 'Avant-première'
  const days = m.status === 'Brouillon' ? 0 : m.status === 'Avant-première' ? 3 + i : Math.round(18 + r() * 110)
  const daily = Array.from({ length: 14 }, (_, k) => (live ? Math.round(40 + r() * 90 + k * 3) : m.status === 'Avant-première' ? Math.round(r() * 12) : 0))
  const views = live ? Math.round(days * (55 + r() * 70)) : daily.reduce((s, x) => s + x, 0)
  const contacts = Math.round(views * (0.012 + r() * 0.01)), visits = Math.round(contacts * (0.28 + r() * 0.2))
  const lux = p.price >= 2000000
  const portals = Object.fromEntries(PORTALS.map((po) => {
    const premiumOnly = po === 'Belles Demeures' || po === 'Figaro Prestige'
    let state: PortalState = !live ? 'off' : premiumOnly && !lux ? 'off' : 'publiee'
    let note: string | undefined
    if (m.waiting?.includes(po)) { state = 'attente'; note = 'Modération en cours' }
    if (m.rejected?.[0] === po) { state = 'rejetee'; note = m.rejected[1] }
    return [po, { state, views: state === 'publiee' ? Math.round(views * (0.12 + r() * 0.3)) : 0, note }]
  })) as Listing['portals']
  const checks = Object.fromEntries(QUALITY_CHECKS.map((c) => [c.k, !m.missing.includes(c.k)])) as Listing['checks']
  const quality = QUALITY_CHECKS.reduce((s, c) => s + (checks[c.k] ? c.w : 0), 0)
  const [lng, lat] = COORD_FIX[p.id] ?? [p.lng, p.lat]
  return { ...p, lng, lat, ref: `MDT-26-${String(140 + i * 7).padStart(4, '0')}`, status: m.status, agentId: m.agentId, days, views, contacts, visits, offers: m.status === 'Sous offre' ? 1 : m.status === 'Compromis' ? 1 : 0, daily, portals, checks, quality }
})

// ——— Zones de recherche acquéreurs ———
export const ZONES: Record<string, { c: [number, number]; r: number }> = {
  'Juan-les-Pins': { c: [7.1105, 43.5735], r: 900 },
  'Cap d’Antibes': { c: [7.122, 43.552], r: 1500 },
  Biot: { c: [7.096, 43.628], r: 1600 },
  Valbonne: { c: [7.01, 43.641], r: 1800 },
  Antibes: { c: [7.118, 43.585], r: 2200 },
  'Super Antibes': { c: [7.11, 43.597], r: 1000 },
  'Vieil Antibes': { c: [7.126, 43.581], r: 500 },
  'Les Combes': { c: [7.103, 43.589], r: 800 },
  'La Salis': { c: [7.128, 43.571], r: 600 },
}
export const WISHES: Record<string, string[]> = {
  b1: ['Vue mer', 'Terrasse'], b2: ['Jardin', 'Bois'], b3: ['Piscine', 'Vue mer'], b4: ['Piscine', 'Garage'], b5: ['Moulures', 'Vue'], b6: ['Piscine', 'Oliviers'],
}

// ——— Marché : comparables autour d'un bien ———
const STREETS = ['Chemin de la Garoupe', 'Boulevard du Cap', 'Avenue Beau-Site', 'Chemin des Mougins', 'Avenue Mrs L. D. Beaumont', 'Chemin du Tamisier', 'Avenue de la Tour Gandolphe', 'Chemin de l’Ermitage', 'Boulevard Francis Meilland', 'Avenue des Chênes', 'Chemin du Crouton', 'Avenue Gimelli', 'Chemin des Contrebandiers', 'Avenue Guy de Maupassant', 'Chemin de la Pinède', 'Boulevard de la Garoupe', 'Avenue Saramartel', 'Chemin des Lauriers']
// Masque terre/mer (1 = terre) relevé sur les tuiles CARTO : pas 0,004° × 0,003°, origine 7,0 E / 43,53 N, ligne 0 au sud.
const LAND = [
  '00000000000000000000000000000000000000000',
  '00000000000000000000000000000000000000000',
  '00000000010000000000000000000000000000000',
  '00000000010000000000000000000000000000000',
  '00000000011000000000000000000000000000000',
  '00000000011100000000000000000010011000000',
  '00010000111111000000000000000011111000000',
  '11111111111111100000000000000011111100000',
  '11111111111111110000000000000001111100000',
  '11111111111111110000000000000001110000000',
  '11111111111111111000000000000011111000000',
  '11111111111111111100000000000111111000000',
  '11111111111111111110000000000111111000000',
  '11111111111111111111100000011111111100000',
  '11111111111111111111111111111111100000000',
  '11111111111111111111111111111111000000000',
  '11111111111111111111111111111111000000000',
  '11111111111111111111111111111111100000000',
  '11111111111111111111111111111111000000000',
  '11111111111111111111111111111110000000000',
  '11111111111111111111111111111111100000000',
  '11111111111111111111111111111111000000000',
  '11111111111111111111111111111111000000000',
  '11111111111111111111111111111111000000000',
  '11111111111111111111111111111111000000000',
  '11111111111111111111111111111111000000000',
  '11111111111111111111111111111111000000000',
  '11111111111111111111111111111111000000000',
  '11111111111111111111111111111111100000000',
  '11111111111111111111111111111111100000000',
  '11111111111111111111111111111111100000000',
  '11111111111111111111111111111111110000000',
  '11111111111111111111111111111111110000000',
  '11111111111111111111111111111111110000000',
  '11111111111111111111111111111111111000000',
  '11111111111111111111111111111111111000000',
  '11111111111111111111111111110111111100000',
  '11111111111111111111111111111111111100000',
  '11111111111111111111111111111111111110000',
  '11111111111111111111111111111111111011000',
  '11111111111111111111111111111111111111100',
]
const isLand = (i: number, j: number) => LAND[j]?.[i] === '1'
export type Comp = { id: string; addr: string; kind: 'dvf' | 'annonce'; date: string; t: number; surface: number; price: number; ppm: number; lng: number; lat: number; d: number; days?: number; seaView: boolean; condition: 'À rafraîchir' | 'Bon état' | 'Rénové' }
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
export function compsFor(p: Property): Comp[] {
  const r = rng(seedOf('c' + p.id)), base = p.price / p.surface
  // cellules terrestres entre 150 m et 1,9 km du bien
  const cells: [number, number][] = []
  for (let j = 0; j < LAND.length; j++) for (let i = 0; i < LAND[j].length; i++) {
    const dd = dist([p.lng, p.lat], [7 + i * 0.004, 43.53 + j * 0.003])
    if (isLand(i, j) && dd > 150 && dd < 1900) cells.push([i, j])
  }
  return Array.from({ length: 16 }, (_, i): Comp => {
    const ann = i % 4 === 3
    const [ci, cj] = cells.length ? cells.splice(Math.floor(r() * cells.length), 1)[0] : [Math.round((p.lng - 7) / 0.004), Math.round((p.lat - 43.53) / 0.003)], inner = isLand(ci - 1, cj) && isLand(ci + 1, cj) && isLand(ci, cj - 1) && isLand(ci, cj + 1)
    const jit = inner ? 0.8 : 0 // ne décale que les cellules entourées de terre
    const lng = 7 + (ci + (r() - 0.5) * jit) * 0.004, lat = 43.53 + (cj + (r() - 0.5) * jit) * 0.003
    const surface = Math.round(p.surface * (0.72 + r() * 0.6))
    const t = ann ? 2026.78 : 2024.3 + r() * 2.2 // années décimales
    const ppm = Math.round(base * (0.77 + r() * 0.24) * (ann ? 1.11 : 0.97 + (t - 2024.3) * 0.02))
    const mo = Math.floor((t % 1) * 12)
    return { id: `${p.id}-c${i}`, addr: `${Math.ceil(r() * 60)} ${STREETS[(i * 7 + Math.floor(r() * 5)) % STREETS.length]}`, kind: ann ? 'annonce' : 'dvf', date: ann ? 'en ligne' : `${MONTHS[mo]} ${Math.floor(t)}`, t, surface, ppm, price: Math.round((ppm * surface) / 1000) * 1000, lat, lng, d: dist([p.lng, p.lat], [lng, lat]), days: ann ? Math.round(20 + r() * 140) : undefined, seaView: r() > 0.55, condition: (['À rafraîchir', 'Bon état', 'Rénové'] as const)[Math.floor(r() * 3)] }
  }).sort((x, y) => x.d - y.d)
}

/** Indice €/m² trimestriel du secteur (réel puis projection), base = €/m² du bien. */
export function priceSeries(p: Property) {
  const base = p.price / p.surface, r = rng(seedOf('s' + p.id))
  const pts: { t: number; v: number; proj?: boolean }[] = []
  for (let q = 0; q < 19; q++) { const t = 2022 + q * 0.25; pts.push({ t, v: Math.round(base * (0.86 + q * 0.0085 + (q > 6 && q < 10 ? -0.025 : 0) + (r() - 0.5) * 0.025)) }) }
  const last = pts.at(-1)!.v
  for (let q = 1; q <= 4; q++) pts.push({ t: 2026.5 + q * 0.25, v: Math.round(last * (1 + q * 0.0075)), proj: true })
  return pts
}

export const DPE_STATS: { c: Dpe; ppm: number; n: number }[] = [
  { c: 'A', ppm: 9840, n: 38 }, { c: 'B', ppm: 9420, n: 112 }, { c: 'C', ppm: 8710, n: 341 }, { c: 'D', ppm: 8150, n: 486 }, { c: 'E', ppm: 7620, n: 274 }, { c: 'F', ppm: 6980, n: 131 }, { c: 'G', ppm: 6410, n: 64 },
]

// ——— Prospection ———
export type Sector = { id: string; name: string; color: string; coords: [number, number][]; homes: number; ppm: number; rotation: number; agentId: string; lastDrop: string; share: number }
export const SECTORS: Sector[] = [
  { id: 's1', name: 'Vieil Antibes & remparts', color: 'rgb(var(--acc-500))', coords: [[7.1288, 43.5815], [7.1274, 43.583], [7.1259, 43.584], [7.1238, 43.5837], [7.1225, 43.5843], [7.1197, 43.5864], [7.1173, 43.5852], [7.1157, 43.5835], [7.1152, 43.5815], [7.1157, 43.5795], [7.1173, 43.5778], [7.1197, 43.5766], [7.1225, 43.5762], [7.1253, 43.5766], [7.1263, 43.5788], [7.1274, 43.58]], homes: 3120, ppm: 7840, rotation: 6.1, agentId: 'a1', lastDrop: '28 sept.', share: 0.18 },
  { id: 's2', name: 'La Salis · Ponteil', color: 'rgb(var(--sea))', coords: [[7.128, 43.5705], [7.1272, 43.5713], [7.127, 43.5723], [7.1256, 43.5725], [7.1245, 43.5755], [7.1218, 43.5751], [7.1196, 43.5741], [7.1181, 43.5724], [7.1176, 43.5705], [7.1181, 43.5686], [7.1196, 43.5669], [7.1218, 43.5659], [7.1245, 43.5655], [7.1272, 43.5659], [7.1294, 43.5669], [7.1309, 43.5686]], homes: 2480, ppm: 8920, rotation: 5.4, agentId: 'a1', lastDrop: '12 sept.', share: 0.12 },
  { id: 's3', name: 'Cap d’Antibes Ouest', color: 'rgb(var(--sage))', coords: [[7.1392, 43.5535], [7.1337, 43.5554], [7.1357, 43.5595], [7.132, 43.5613], [7.1275, 43.5619], [7.123, 43.5613], [7.1228, 43.5569], [7.1222, 43.5551], [7.1228, 43.5535], [7.1222, 43.5519], [7.1196, 43.5478], [7.1238, 43.547], [7.1275, 43.5472], [7.132, 43.5457], [7.1357, 43.5475], [7.1383, 43.5503]], homes: 1460, ppm: 14600, rotation: 3.8, agentId: 'a4', lastDrop: '2 oct.', share: 0.24 },
  { id: 's4', name: 'Juan-les-Pins centre', color: 'rgb(var(--coral))', coords: [[7.1173, 43.5735], [7.1168, 43.5754], [7.1153, 43.577], [7.1131, 43.5781], [7.1105, 43.5784], [7.1079, 43.5781], [7.1057, 43.577], [7.1042, 43.5754], [7.1037, 43.5735], [7.1042, 43.5716], [7.1069, 43.5709], [7.1085, 43.5701], [7.1105, 43.5695], [7.1131, 43.5689], [7.1153, 43.57], [7.1168, 43.5716]], homes: 4210, ppm: 7310, rotation: 7.2, agentId: 'a3', lastDrop: '19 sept.', share: 0.09 },
  { id: 's5', name: 'Les Combes · Semboules', color: 'rgb(var(--mist-400))', coords: [[7.1059, 43.5965], [7.1051, 43.5994], [7.1029, 43.6018], [7.0995, 43.6035], [7.0955, 43.604], [7.0915, 43.6035], [7.0881, 43.6018], [7.0859, 43.5994], [7.0851, 43.5965], [7.0859, 43.5936], [7.0881, 43.5912], [7.0915, 43.5895], [7.0955, 43.589], [7.0995, 43.5895], [7.1029, 43.5912], [7.1051, 43.5936]], homes: 2890, ppm: 6620, rotation: 5.9, agentId: 'a7', lastDrop: '—', share: 0.06 },
]
export type SignalKind = 'dpe' | 'succession' | 'stock' | 'vente'
export const SIGNAL_META: Record<SignalKind, { l: string; tone: 'coral' | 'gold' | 'sea' | 'sage'; hint: string }> = {
  dpe: { l: 'DPE F/G', tone: 'coral', hint: 'G interdit à la location depuis 2025, F en 2028' },
  succession: { l: 'Successions', tone: 'gold', hint: 'Annonces légales & actes de notoriété' },
  stock: { l: 'En vente > 120 j', tone: 'sea', hint: 'Mandats concurrents qui s’essoufflent' },
  vente: { l: 'Ventes voisines', tone: 'sage', hint: 'DVF < 6 mois, argument de courrier' },
}
export type Signal = { id: string; kind: SignalKind; addr: string; detail: string; date: string; lng: number; lat: number; sector: string; score: number }
const SIG_RAW: [SignalKind, string, string, string, number, number][] = [
  ['dpe', '18 rue du Haut-Castelet', 'Appartement 62 m² · DPE G · loué', '3 oct.', 7.1262, 43.5818],
  ['dpe', '7 rue de la Tourraque', 'Studio 28 m² · DPE F · bailleur', '27 sept.', 7.1281, 43.5806],
  ['dpe', '41 boulevard Wilson', 'T3 71 m² · DPE G · vacant', '1 oct.', 7.1093, 43.5691],
  ['dpe', '12 avenue de Verdun', 'T2 44 m² · DPE F · bailleur', '22 sept.', 7.1229, 43.5838],
  ['dpe', '5 rue des Palmiers', 'T2 50 m² · DPE G', '9 oct.', 7.107, 43.5694],
  ['dpe', '23 chemin des Semboules', 'Maison 96 m² · DPE F', '30 sept.', 7.0935, 43.5992],
  ['succession', '9 chemin du Crouton', 'Villa 180 m² · acte de notoriété', '6 oct.', 7.1195, 43.5508],
  ['succession', '3 traverse du Barri', 'Maison de ville · indivision 3 héritiers', '2 oct.', 7.1266, 43.5788],
  ['succession', '27 avenue de la Salis', 'Appartement 110 m² · annonce légale', '25 sept.', 7.1296, 43.5682],
  ['succession', '14 chemin des Combes', 'Villa 210 m² · succession ouverte', '8 oct.', 7.1001, 43.5901],
  ['stock', '61 boulevard du Cap', 'Villa 4,2 M€ · 214 j en ligne · 2 baisses', '—', 7.1265, 43.5498],
  ['stock', '8 avenue Saramartel', 'T4 1,1 M€ · 168 j · mandat simple', '—', 7.1074, 43.5694],
  ['stock', '22 chemin du Puy', 'Maison 1,35 M€ · 143 j', '—', 7.0982, 43.5958],
  ['stock', '2 rue Fersen', 'T3 640 k€ · 131 j', '—', 7.1258, 43.5829],
  ['vente', '19 chemin de la Garoupe', 'Villa vendue 5,4 M€ · 17 420 €/m²', 'mars 2026', 7.1311, 43.5535],
  ['vente', '6 avenue Gimelli', 'Appartement vendu 920 k€ · 8 210 €/m²', 'juin 2026', 7.1171, 43.5735],
  ['vente', '33 rue Vauban', 'T2 vendu 365 k€ · 7 450 €/m²', 'juil. 2026', 7.1247, 43.5797],
  ['vente', '10 boulevard Baudoin', 'T4 vendu 1,62 M€ · 11 900 €/m²', 'mai 2026', 7.1125, 43.5679],
  ['vente', '4 allée des Lauriers', 'Villa vendue 1,48 M€ · 7 900 €/m²', 'août 2026', 7.0921, 43.5951],
]
const inPoly = (pt: [number, number], poly: [number, number][]) => {
  let ins = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) ins = !ins }
  return ins
}
export const SIGNALS: Signal[] = SIG_RAW.map(([kind, addr, detail, date, lng, lat], i) => ({ id: `sg${i}`, kind, addr, detail, date, lng, lat, sector: SECTORS.find((s) => inPoly([lng, lat], s.coords))?.id ?? '', score: 55 + ((i * 37) % 44) }))

export type Campaign = { id: string; name: string; sector: string; volume: number; print: 'BAT à valider' | 'Chez l’imprimeur' | 'Imprimé'; dist: 'Planifiée' | 'En cours' | 'Distribuée'; progress: number; returns: number; date: string; hook: string }
export const CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'Vendu chemin de la Garoupe', sector: 's3', volume: 420, print: 'Imprimé', dist: 'Distribuée', progress: 100, returns: 9, date: '2 oct.', hook: 'Vente récente 5,4 M€' },
  { id: 'c2', name: 'Estimation offerte · remparts', sector: 's1', volume: 1150, print: 'Imprimé', dist: 'En cours', progress: 62, returns: 4, date: '8 oct.', hook: 'Prix au m² 2026 de votre rue' },
  { id: 'c3', name: 'Propriétaires bailleurs DPE', sector: 's4', volume: 680, print: 'Chez l’imprimeur', dist: 'Planifiée', progress: 0, returns: 0, date: '15 oct.', hook: 'Loi Climat : vendre ou rénover ?' },
  { id: 'c4', name: 'La Salis · avant-première', sector: 's2', volume: 540, print: 'BAT à valider', dist: 'Planifiée', progress: 0, returns: 0, date: '20 oct.', hook: 'Acquéreurs qualifiés en attente' },
]

export type Consent = { id: string; name: string; channel: 'Téléphone' | 'SMS' | 'E-mail' | 'Courrier'; status: 'Exprès' | 'Refus' | 'Expiré' | 'À recueillir'; proof: string; date: string; expires: string; origin: string }
export const CONSENTS: Consent[] = [
  { id: 'k1', name: 'M. Bertrand Roux', channel: 'Téléphone', status: 'Exprès', proof: 'Formulaire estimation · horodaté + IP', date: '14/09/2026', expires: '14/09/2029', origin: 'Site agence' },
  { id: 'k2', name: 'Mme Hélène Vidal', channel: 'Téléphone', status: 'À recueillir', proof: '—', date: '—', expires: '—', origin: 'Boîtage remparts' },
  { id: 'k3', name: 'M. & Mme Cohen', channel: 'E-mail', status: 'Exprès', proof: 'Case cochée · double opt-in', date: '02/10/2026', expires: '02/10/2029', origin: 'Courrier L5 · QR code' },
  { id: 'k4', name: 'M. Pierre Lambert', channel: 'Téléphone', status: 'Refus', proof: 'Opposition orale consignée', date: '21/08/2026', expires: '—', origin: 'Appel entrant' },
  { id: 'k5', name: 'Mme Nadia Ferhat', channel: 'SMS', status: 'Expiré', proof: 'Mandat 2023 · clause contact', date: '05/03/2023', expires: '05/03/2026', origin: 'Ancien client' },
  { id: 'k6', name: 'Indivision Barri', channel: 'Courrier', status: 'Exprès', proof: 'Courrier postal · hors champ opt-in', date: '02/10/2026', expires: '—', origin: 'Signal succession' },
  { id: 'k7', name: 'M. Antoine Mercier', channel: 'Téléphone', status: 'Exprès', proof: 'Enregistrement appel entrant', date: '30/09/2026', expires: '30/09/2029', origin: 'Appel entrant' },
  { id: 'k8', name: 'Mme Sophie Garcia', channel: 'Téléphone', status: 'À recueillir', proof: '—', date: '—', expires: '—', origin: 'Signal DPE F' },
]
