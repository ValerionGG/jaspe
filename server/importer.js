// Import CSV des biens et contacts exportés d'eGO Real Estate (Portugal) et d'Hektor (France), avec mapping guidé.
// Code pur (aucune API Node) : il tourne aussi dans le navigateur (aperçu local et moteur embarqué).
//
// ⚠ Les noms exacts des colonnes d'export eGO / Hektor ne sont pas publics : les PRESETS ci-dessous
// sont des en-têtes typiques, à confirmer sur un vrai export d'agence. La détection est volontairement
// tolérante (casse, accents, ponctuation, synonymes) et le conseiller corrige le mapping dans l'aperçu.

/* ——— CSV ——— */

/** Normalise un en-tête ou une valeur pour comparaison : minuscules, sans accents ni ponctuation. */
export const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** Choisit le séparateur sur la première ligne logique (hors guillemets) : `;`, tabulation ou `,`. */
function sniff(text) {
  const n = { ';': 0, '\t': 0, ',': 0 }
  let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') q = !q
    else if (!q && (c === '\n' || c === '\r')) { if (n[';'] + n['\t'] + n[','] > 0) break }
    else if (!q && c in n) n[c]++
  }
  return n[';'] >= n['\t'] && n[';'] >= n[','] && n[';'] > 0 ? ';' : n['\t'] >= n[','] && n['\t'] > 0 ? '\t' : ','
}

/**
 * CSV robuste : BOM, ligne Excel `sep=;`, séparateur auto, guillemets doublés, retours à la ligne entre guillemets,
 * CRLF / LF / CR, lignes vides ignorées, en-têtes en double suffixés « (2) ». Le texte est déjà décodé.
 * @returns {{ headers: string[], rows: Record<string, string>[], separator: string }}
 */
export function parseCsv(text) {
  let t = String(text ?? '').replace(/^﻿/, '')
  let sep = null
  const m = /^sep=(.)\r?\n/i.exec(t)
  if (m) { sep = m[1]; t = t.slice(m[0].length) }
  sep ??= sniff(t)
  const lines = []
  let row = [], cell = '', q = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (q) {
      if (c === '"') { if (t[i + 1] === '"') { cell += '"'; i++ } else q = false }
      else if (c === '\r') { cell += '\n'; if (t[i + 1] === '\n') i++ }
      else cell += c
    } else if (c === '"' && cell.trim() === '') { cell = ''; q = true }
    else if (c === sep) { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++
      row.push(cell); lines.push(row); row = []; cell = ''
    } else cell += c
  }
  if (cell !== '' || row.length) { row.push(cell); lines.push(row) }
  const filled = lines.filter((r) => r.some((x) => x.trim() !== ''))
  if (!filled.length) return { headers: [], rows: [], separator: sep }
  const seen = {}
  const headers = filled[0].map((h, i) => {
    const b = h.trim() || `Colonne ${i + 1}`
    seen[b] = (seen[b] ?? 0) + 1
    return seen[b] > 1 ? `${b} (${seen[b]})` : b
  })
  const rows = filled.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])))
  return { headers, rows, separator: sep }
}

/* ——— Champs Jaspe et presets ——— */

/** Champs Jaspe proposés au mapping, dans l'ordre d'affichage. `req` : utile au dédoublonnage ou à la fiche. */
export const FIELDS = {
  properties: [
    { k: 'ref', l: 'Référence', req: true }, { k: 'title', l: 'Titre de l’annonce' }, { k: 'type', l: 'Type de bien', req: true },
    { k: 'transaction', l: 'Nature (vente / location)' }, { k: 'price', l: 'Prix', req: true }, { k: 'surface', l: 'Surface habitable (m²)', req: true },
    { k: 'surfaceGross', l: 'Surface brute / totale (m²)' }, { k: 'land', l: 'Terrain (m²)' }, { k: 'typology', l: 'Typologie (T0…T5)' },
    { k: 'rooms', l: 'Nombre de pièces' }, { k: 'bedrooms', l: 'Chambres' }, { k: 'address', l: 'Adresse', req: true },
    { k: 'postalCode', l: 'Code postal' }, { k: 'district', l: 'Quartier / freguesia' }, { k: 'city', l: 'Ville / concelho', req: true },
    { k: 'region', l: 'Département / distrito' }, { k: 'dpe', l: 'DPE / certificat énergétique' }, { k: 'status', l: 'Statut / estado' },
    { k: 'year', l: 'Année de construction' }, { k: 'description', l: 'Description' }, { k: 'features', l: 'Équipements / caractéristiques' },
    { k: 'photos', l: 'Photos (URL)' }, { k: 'lat', l: 'Latitude' }, { k: 'lng', l: 'Longitude' },
  ],
  contacts: [
    { k: 'ref', l: 'Référence / n° client' }, { k: 'name', l: 'Nom complet', req: true }, { k: 'lastName', l: 'Nom de famille' },
    { k: 'firstName', l: 'Prénom' }, { k: 'email', l: 'E-mail', req: true }, { k: 'phone', l: 'Mobile', req: true },
    { k: 'phone2', l: 'Téléphone fixe' }, { k: 'role', l: 'Type de contact' }, { k: 'org', l: 'Société' },
    { k: 'taxId', l: 'NIF / n° fiscal' }, { k: 'address', l: 'Adresse' }, { k: 'postalCode', l: 'Code postal' },
    { k: 'city', l: 'Ville / concelho' }, { k: 'lang', l: 'Langue' }, { k: 'notes', l: 'Notes' },
  ],
}

/**
 * Synonymes d'en-têtes par source (comparés après `norm`). Ordre = priorité. À confirmer sur de vrais exports :
 * eGO Real Estate (PT) en portugais, Hektor (FR, La Boîte Immo) en français.
 */
export const PRESETS = {
  ego: {
    label: 'eGO Real Estate',
    country: 'PT',
    properties: {
      ref: ['referencia', 'ref', 'referencia interna', 'codigo', 'id imovel'],
      title: ['titulo', 'titulo do anuncio', 'nome do imovel'],
      type: ['tipo de imovel', 'tipo imovel', 'tipo', 'categoria'],
      transaction: ['natureza', 'negocio', 'tipo de negocio', 'finalidade'],
      price: ['preco', 'preco de venda', 'valor', 'preco pedido'],
      surface: ['area util', 'area habitavel', 'area'],
      surfaceGross: ['area bruta', 'area bruta privativa', 'area total'],
      land: ['area terreno', 'area do terreno', 'terreno'],
      typology: ['tipologia'],
      bedrooms: ['quartos', 'n quartos', 'numero de quartos'],
      rooms: ['divisoes', 'assoalhadas'],
      address: ['morada', 'endereco', 'rua'],
      postalCode: ['codigo postal', 'cp'],
      district: ['freguesia', 'zona', 'localidade'],
      city: ['concelho', 'cidade', 'municipio'],
      region: ['distrito', 'regiao'],
      dpe: ['certificado energetico', 'classe energetica', 'certificacao energetica'],
      status: ['estado', 'estado do imovel', 'situacao'],
      year: ['ano de construcao', 'ano construcao', 'ano'],
      description: ['descricao', 'descricao do imovel', 'observacoes'],
      features: ['caracteristicas', 'extras', 'equipamentos'],
      photos: ['fotos', 'imagens', 'url fotos', 'fotografias'],
      lat: ['latitude', 'lat'], lng: ['longitude', 'lng', 'lon'],
    },
    contacts: {
      ref: ['referencia', 'codigo', 'n cliente', 'id contacto', 'id cliente'],
      name: ['nome', 'nome completo', 'cliente'],
      lastName: ['apelido', 'sobrenome'],
      firstName: ['primeiro nome'],
      email: ['email', 'e mail', 'correio eletronico'],
      phone: ['telemovel', 'tlm', 'telemovel 1', 'movel'],
      phone2: ['telefone', 'telefone fixo', 'tel', 'telefone 1'],
      role: ['tipo de contacto', 'tipo de cliente', 'tipo contacto', 'tipo cliente', 'tipo', 'categoria'],
      org: ['empresa', 'entidade'],
      taxId: ['nif', 'contribuinte', 'n contribuinte'],
      address: ['morada', 'endereco'],
      postalCode: ['codigo postal', 'cp'],
      city: ['concelho', 'localidade', 'cidade'],
      lang: ['idioma', 'lingua'],
      notes: ['observacoes', 'notas', 'comentarios'],
    },
  },
  hektor: {
    label: 'Hektor',
    country: 'FR',
    properties: {
      ref: ['reference', 'ref', 'reference mandat', 'n mandat', 'numero de mandat', 'no mandat'],
      title: ['titre', 'titre annonce', 'libelle'],
      type: ['type de bien', 'type bien', 'type', 'categorie'],
      transaction: ['transaction', 'type de transaction', 'type de mandat', 'nature'],
      price: ['prix', 'prix de vente', 'prix fai', 'prix net vendeur', 'loyer'],
      surface: ['surface habitable', 'surface', 'surface carrez', 'surf habitable'],
      surfaceGross: ['surface totale', 'surface utile'],
      land: ['surface terrain', 'terrain'],
      typology: ['typologie'],
      rooms: ['nb pieces', 'nombre de pieces', 'pieces', 'nb de pieces'],
      bedrooms: ['nb chambres', 'nombre de chambres', 'chambres', 'nb de chambres'],
      address: ['adresse', 'adresse du bien', 'rue'],
      postalCode: ['code postal', 'cp'],
      district: ['quartier', 'secteur'],
      city: ['ville', 'commune', 'localite'],
      region: ['departement', 'region'],
      dpe: ['dpe', 'classe energie', 'dpe classe', 'etiquette energie', 'classe dpe'],
      status: ['statut', 'etat du mandat', 'etat'],
      year: ['annee de construction', 'annee construction', 'annee'],
      description: ['descriptif', 'description', 'texte annonce'],
      features: ['equipements', 'prestations', 'caracteristiques'],
      photos: ['photos', 'url photos', 'images'],
      lat: ['latitude', 'lat'], lng: ['longitude', 'lng', 'lon'],
    },
    contacts: {
      ref: ['reference', 'ref', 'n client', 'id contact', 'code client'],
      name: ['nom complet', 'contact', 'nom et prenom'],
      lastName: ['nom', 'nom de famille'],
      firstName: ['prenom'],
      email: ['email', 'e mail', 'mail', 'adresse email'],
      phone: ['portable', 'mobile', 'tel portable', 'telephone portable', 'gsm'],
      phone2: ['telephone', 'tel', 'telephone fixe', 'tel fixe', 'fixe'],
      role: ['type', 'type de contact', 'categorie', 'qualite', 'statut'],
      org: ['societe', 'entreprise', 'raison sociale'],
      taxId: ['siret', 'n fiscal'],
      address: ['adresse', 'rue'],
      postalCode: ['code postal', 'cp'],
      city: ['ville', 'commune'],
      lang: ['langue'],
      notes: ['commentaire', 'commentaires', 'notes', 'remarques'],
    },
  },
}

/** Mots-clés distinctifs pour reconnaître la source à partir des en-têtes. */
const MARKERS = {
  ego: ['referencia', 'tipologia', 'concelho', 'freguesia', 'distrito', 'morada', 'preco', 'quartos', 'natureza', 'certificado energetico', 'telemovel', 'nif', 'nome', 'area util', 'area bruta', 'tipo de imovel', 'tipo de contacto', 'estado'],
  hektor: ['reference', 'type de bien', 'prix', 'surface habitable', 'nb pieces', 'nb chambres', 'ville', 'code postal', 'adresse', 'dpe', 'prenom', 'nom', 'portable', 'telephone', 'mandat'],
}

/** 'ego' | 'hektor' | 'inconnu' selon les en-têtes (portugais typiques d'eGO, français typiques d'Hektor). */
export function detectSource(headers) {
  const hs = (headers ?? []).map(norm)
  const score = (k) => MARKERS[k].filter((m) => hs.some((h) => h === m || ` ${h} `.includes(` ${m} `))).length
  const e = score('ego'), h = score('hektor')
  if (Math.max(e, h) < 2 || e === h) return 'inconnu'
  return e > h ? 'ego' : 'hektor'
}

/**
 * Devine le mapping champ Jaspe → colonne source. Égalité exacte (normalisée) avant inclusion par mots ;
 * synonymes de la source détectée en premier ; une colonne n'est attribuée qu'une fois.
 * @returns {Record<string, string|null>}
 */
export function guessMapping(headers, kind, source = detectSource(headers)) {
  const fields = FIELDS[kind]
  if (!fields) throw new Error(`Type d’import inconnu : ${kind}`)
  const order = source === 'hektor' ? ['hektor', 'ego'] : ['ego', 'hektor']
  const cands = []
  for (const f of fields) {
    const syns = order.flatMap((s) => PRESETS[s][kind][f.k] ?? []).filter((s, i, a) => a.indexOf(s) === i)
    headers.forEach((h, hi) => {
      const n = norm(h)
      syns.forEach((s, si) => {
        const exact = n === s
        if (exact || ` ${n} `.includes(` ${s} `)) cands.push({ f: f.k, h, score: (exact ? 1000 : 500 - (n.length - s.length)) - si * 5 - hi * 0.01 })
      })
    })
  }
  cands.sort((a, b) => b.score - a.score)
  const out = Object.fromEntries(fields.map((f) => [f.k, null]))
  const used = new Set()
  for (const c of cands) if (out[c.f] === null && !used.has(c.h)) { out[c.f] = c.h; used.add(c.h) }
  // « Nom » seul sans prénom : c'est le nom complet.
  if (kind === 'contacts' && !out.name && out.lastName && !out.firstName) { out.name = out.lastName; out.lastName = null }
  return out
}

/* ——— Nettoyage des valeurs ——— */

/**
 * Nombre depuis un texte d'export : « 1.250.000 € », « 1 250 000 », « 1,250,000 », « 120,5 m² », « 980 000,00 ».
 * Un séparateur unique suivi d'exactement 3 chiffres est un séparateur de milliers. Renvoie null si illisible.
 */
export function num(v) {
  let s = String(v ?? '').replace(/m²|m2|sqm|€|eur|euros?/gi, '').replace(/[\s  ']/g, '')
  s = s.replace(/[^0-9.,-]/g, '')
  if (!/\d/.test(s)) return null
  const d = s.lastIndexOf(','), p = s.lastIndexOf('.')
  if (d >= 0 && p >= 0) {
    const dec = d > p ? ',' : '.'
    s = s.split(dec === ',' ? '.' : ',').join('').replace(dec, '.')
  } else if (d >= 0 || p >= 0) {
    const sep = d >= 0 ? ',' : '.'
    const parts = s.split(sep)
    s = parts.length > 2 || parts[parts.length - 1].length === 3 ? parts.join('') : parts.join('.')
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** T3 → { rooms: 4, bedrooms: 3 } (T0 = studio, 1 pièce ; « T3+1 » = 4 chambres). V3 (moradia) idem. */
export function typology(v) {
  const m = /^\s*[TV]\s*(\d+)\s*(?:\+\s*(\d+))?/i.exec(String(v ?? ''))
  if (!m) return null
  const bedrooms = Number(m[1]) + Number(m[2] ?? 0)
  return { rooms: bedrooms + 1, bedrooms }
}

/** Classe énergétique A–G (A+ → A, B- → B) ; null si exempté, vierge ou non communiqué. */
export function dpeClass(v) {
  const n = norm(v)
  if (!n || /\b(isento|vierge|nc|nd|non communique|non soumis|en cours|sem certificado|exempt\w*)\b/.test(n)) return null
  const m = /(?:^|\s|classe\s*)([a-g])(?:\s|$|\+|-)/i.exec(` ${String(v).trim()} `) ?? /^([a-g])/i.exec(n)
  return m ? m[1].toUpperCase() : null
}

/** Téléphone au format international lisible ; indicatif déduit du pays de la source si absent. */
export function phone(v, country = 'FR') {
  let s = String(v ?? '').replace(/[^\d+]/g, '')
  if (!s) return ''
  if (s.startsWith('00')) s = `+${s.slice(2)}`
  if (!s.startsWith('+')) {
    if (country === 'FR' && /^0\d{9}$/.test(s)) s = `+33${s.slice(1)}`
    else if (country === 'PT' && /^[29]\d{8}$/.test(s)) s = `+351${s}`
    else if (/^33\d{9}$/.test(s) || /^351\d{9}$/.test(s)) s = `+${s}`
    else return s
  }
  if (/^\+33\d{9}$/.test(s)) return `+33 ${s[3]} ${s.slice(4).match(/\d{2}/g).join(' ')}`
  if (/^\+351\d{9}$/.test(s)) return `+351 ${s.slice(4, 7)} ${s.slice(7, 10)} ${s.slice(10)}`
  return s
}
const phoneKey = (p) => String(p ?? '').replace(/\D/g, '').slice(-9)
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)

const TYPES = [
  [/apartamento|appartement|flat|duplex|penthouse|loft|studio|estudio/, (n) => (/penthouse/.test(n) ? 'Penthouse' : /loft/.test(n) ? 'Loft' : /duplex/.test(n) ? 'Duplex' : /studio|estudio/.test(n) ? 'Studio' : 'Appartement')],
  [/vivenda|villa/, () => 'Villa'],
  [/moradia|maison|casa|bastide|mas\b|chalet/, (n) => (/bastide/.test(n) ? 'Bastide' : /\bmas\b/.test(n) ? 'Mas' : 'Maison')],
  [/quinta|herdade|propriete|domaine|monte/, () => 'Propriété'],
  [/terreno|terrain|lote/, () => 'Terrain'],
  [/loja|local|commerce|boutique/, () => 'Local commercial'],
  [/escritorio|bureau/, () => 'Bureau'],
  [/armazem|entrepot|hangar/, () => 'Entrepôt'],
  [/garagem|garage|parking|estacionamento|box/, () => 'Parking'],
  [/predio|immeuble/, () => 'Immeuble'],
]
const propType = (v) => { const n = norm(v); if (!n) return ''; const t = TYPES.find(([re]) => re.test(n)); return t ? t[1](n) : String(v).trim() }
const transaction = (v) => { const n = norm(v); return !n ? 'vente' : /arrend|aluguer|location|loyer|louer|rent/.test(n) ? 'location' : 'vente' }
const CONDITION = /^(novo|usado|em construcao|para recuperar|renovado|recuperado|em projeto|neuf|ancien|a renover|renove|en construction)$/
/** Statut Jaspe prudent : rien n'est « Diffusé » tant que l'annonce n'a pas été contrôlée dans Jaspe. */
function status(v) {
  const n = norm(v)
  if (/reserv|sous offre|offre/.test(n)) return { status: 'Sous offre' }
  if (/compromis|cpcv|promessa/.test(n)) return { status: 'Compromis' }
  if (/vendid|vendu|arrendad|loue|retir|arquiv|archiv|suspens|inativ|inactif|expir/.test(n)) return { status: 'Brouillon', closed: true }
  return { status: 'Brouillon' }
}
const ROLES = [
  [/propriet|vendedor|vendeur|mandant|senhorio|bailleur/, 'vendeur'],
  [/comprador|acquer|acheteur|interessad|prospect|arrendatario|locataire|investidor|investisseur/, 'acquereur'],
  [/notari|notaire/, 'notaire'], [/diagnost|perito|certificador/, 'diagnostiqueur'], [/syndic|condominio|administra/, 'syndic'],
  [/courtier|intermediario de credito|credito|banc|banque/, 'courtier'], [/fotograf|photograph/, 'photographe'],
]
const roles = (v) => {
  const n = norm(v)
  const r = ROLES.filter(([re]) => re.test(n)).map(([, k]) => k)
  return r.length ? [...new Set(r)] : ['acquereur']
}
const LANGS = { pt: 'Português', portugues: 'Português', fr: 'Français', francais: 'Français', frances: 'Français', en: 'English', ingles: 'English', anglais: 'English', english: 'English', es: 'Español', espanhol: 'Español', espagnol: 'Español', de: 'Deutsch', alemao: 'Deutsch', allemand: 'Deutsch' }
const cap = (s) => String(s ?? '').trim().toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase())
/** Repli si ni `locate` ni centre d'agence : Lisbonne (PT), Antibes (FR, agence de démonstration). */
const COUNTRY_CENTER = { PT: [-9.1393, 38.7223], FR: [7.1256, 43.5804] }
const today = (at) => new Date(at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })

/* ——— Conversion ——— */

/**
 * Convertit les lignes en documents Jaspe et liste les problèmes (n° de ligne = ligne du tableur, en-tête = 1).
 * `meta` : { source, file, at, locate?(district, city) → [lng, lat] | null, center?: [lng, lat] }.
 * @returns {{ items: { row: number, doc: object }[], issues: { row: number, problem: string, level: 'erreur' | 'alerte' }[] }}
 */
export function convert(rows, mapping, kind, meta = {}) {
  if (!FIELDS[kind]) throw new Error(`Type d’import inconnu : ${kind}`)
  const source = meta.source ?? 'inconnu'
  const at = meta.at ?? new Date().toISOString()
  const country = source === 'ego' ? 'PT' : 'FR'
  const items = [], issues = []
  rows.forEach((r, i) => {
    const row = i + 2
    const g = (k) => (mapping?.[k] ? String(r[mapping[k]] ?? '').trim() : '')
    const warn = (problem) => issues.push({ row, problem, level: 'alerte' })
    const ref = g('ref')
    const importedFrom = { source, file: meta.file ?? '', at, ref: ref || null }
    if (kind === 'properties') {
      const address = g('address'), city = cap(g('city')), title0 = g('title')
      if (!ref && !address && !title0) { issues.push({ row, problem: 'Ligne ignorée : ni référence, ni adresse, ni titre', level: 'erreur' }); return }
      const price = num(g('price'))
      if (g('price') && price === null) warn(`Prix illisible « ${g('price')} »`)
      else if (!price) warn('Prix absent')
      const surface = num(g('surface')) ?? num(g('surfaceGross'))
      if (!surface) warn('Surface absente')
      const ty = typology(g('typology'))
      if (g('typology') && !ty && !/^\s*$/.test(g('typology'))) warn(`Typologie non reconnue « ${g('typology')} »`)
      const rooms = num(g('rooms')) ?? ty?.rooms ?? (num(g('bedrooms')) !== null ? num(g('bedrooms')) + 1 : 0)
      const bedrooms = num(g('bedrooms')) ?? ty?.bedrooms ?? null
      const type = propType(g('type')) || 'Bien'
      const rawStatus = g('status')
      const st = CONDITION.test(norm(rawStatus)) ? { status: 'Brouillon', condition: rawStatus } : status(rawStatus)
      if (st.closed) warn(`Bien marqué « ${rawStatus} » dans la source : importé en brouillon`)
      const dpe = dpeClass(g('dpe'))
      if (g('dpe') && !dpe && !/\b(isento|vierge|nc|nd|non|exempt\w*)\b/i.test(norm(g('dpe')))) warn(`Classe énergétique non reconnue « ${g('dpe')} »`)
      const district = cap(g('district')) || city
      let lat = num(g('lat')), lng = num(g('lng')), geoApprox = false
      if (lat === null || lng === null || !lat || !lng) {
        // Position approchée (marquée `geoApprox`) : la carte des biens exige des coordonnées.
        const c = meta.locate?.(district, city) ?? meta.center ?? COUNTRY_CENTER[country]
        lng = c[0]; lat = c[1]
        geoApprox = true
      }
      const photos = g('photos').split(/[|,;\s]+/).filter((u) => /^https?:\/\//i.test(u))
      const where = district || city
      const title = title0 || `${type}${ty ? ` T${ty.bedrooms}` : rooms ? ` ${rooms} pièces` : ''}${where ? ` — ${where}` : ''}`
      const doc = {
        ref: ref || `IMP-${String(row).padStart(4, '0')}`, title, type, transaction: transaction(g('transaction')), status: st.status,
        address, postalCode: g('postalCode'), district, city, region: cap(g('region')),
        surface: surface ?? 0, rooms, price: price ?? 0, dpe: dpe ?? undefined,
        photo: photos[0] ?? '', gallery: photos, features: g('features').split(/[|;,]\s*/).map((x) => x.trim()).filter(Boolean),
        year: num(g('year')) || undefined, description: g('description') || undefined, lat, lng, geoApprox,
        days: 0, views: 0, contacts: 0, visits: 0, offers: 0, daily: Array(14).fill(0), importedFrom,
      }
      const land = num(g('land')); if (land) doc.land = land
      const gross = num(g('surfaceGross')); if (gross && gross !== doc.surface) doc.surfaceGross = gross
      if (bedrooms !== null) doc.bedrooms = bedrooms
      if (st.condition) doc.condition = st.condition
      if (rawStatus) doc.sourceStatus = rawStatus
      for (const k of Object.keys(doc)) if (doc[k] === undefined) delete doc[k]
      items.push({ row, doc })
    } else {
      const first = cap(g('firstName')), last = g('lastName')
      const name = (g('name') || [first, last && (last === last.toUpperCase() ? cap(last) : last)].filter(Boolean).join(' ')).replace(/\s+/g, ' ').trim()
      let email = g('email').toLowerCase()
      const ph = phone(g('phone'), country) || phone(g('phone2'), country)
      if (!name && !email && !ph) { issues.push({ row, problem: 'Ligne ignorée : ni nom, ni e-mail, ni téléphone', level: 'erreur' }); return }
      if (email && !emailOk(email)) { warn(`E-mail invalide « ${email} » : non repris`); email = '' }
      if (ph && !ph.startsWith('+')) warn(`Téléphone sans indicatif pays « ${ph} »`)
      if (!name) warn('Nom absent : contact importé sous son e-mail ou téléphone')
      const lang = LANGS[norm(g('lang'))] ?? (g('lang') || (country === 'PT' ? 'Português' : 'Français'))
      const doc = {
        name: name || email || ph, email, phone: ph, roles: roles(g('role')), city: cap(g('city')),
        org: g('org') || undefined, taxId: g('taxId') || undefined, address: g('address') || undefined, postalCode: g('postalCode') || undefined,
        dossiers: [], score: 30, last: `${today(at)} · import ${PRESETS[source]?.label ?? 'CSV'}`,
        pref: { ch: email ? 'Email' : 'Téléphone', slot: '—', lang, note: g('notes') || undefined },
        consents: [], // aucun consentement n'est présumé : à recueillir dans Jaspe
        history: [{ d: today(at), ch: 'Email', dir: 'in', s: `Import ${PRESETS[source]?.label ?? 'CSV'}${meta.file ? ` (${meta.file})` : ''} · aucun consentement de prospection présumé` }],
        importedFrom,
      }
      if (g('phone2') && g('phone')) doc.phone2 = phone(g('phone2'), country)
      for (const k of Object.keys(doc)) if (doc[k] === undefined) delete doc[k]
      if (doc.pref.note === undefined) delete doc.pref.note
      items.push({ row, doc })
    }
  })
  return { items, issues }
}

/** Documents au format Jaspe (sans les problèmes) : voir `convert`. */
export const toDocs = (rows, mapping, kind, meta) => convert(rows, mapping, kind, meta).items.map((x) => x.doc)

/* ——— Dédoublonnage ——— */

const addrKey = (d) => (d.address ? `${norm(d.address)}|${Math.round(Number(d.price) || 0)}` : null)
const refKey = (d) => (d.importedFrom?.ref ? `${d.importedFrom.source}|${norm(d.importedFrom.ref)}` : null)

/** Index des existants : référence importée, référence, adresse+prix (biens) ; e-mail, téléphone (contacts). */
function indexOf(list, kind) {
  const idx = new Map()
  const add = (k, d, why) => { if (k && !idx.has(k)) idx.set(k, { id: d.id, label: kind === 'properties' ? d.title : d.name, why }) }
  for (const d of list) {
    add(refKey(d) && `i:${refKey(d)}`, d, 'même référence importée')
    if (kind === 'properties') {
      if (d.ref && d.ref !== '—') add(`r:${norm(d.ref)}`, d, 'même référence')
      add(addrKey(d) && `a:${addrKey(d)}`, d, 'même adresse et même prix')
    } else {
      if (d.email) add(`e:${String(d.email).toLowerCase()}`, d, 'même e-mail')
      if (phoneKey(d.phone).length >= 9) add(`p:${phoneKey(d.phone)}`, d, 'même téléphone')
    }
  }
  return idx
}
const keysOf = (d, kind) => [
  refKey(d) && `i:${refKey(d)}`,
  ...(kind === 'properties'
    ? [d.importedFrom?.ref && `r:${norm(d.importedFrom.ref)}`, addrKey(d) && `a:${addrKey(d)}`]
    : [d.email && `e:${d.email}`, phoneKey(d.phone).length >= 9 && `p:${phoneKey(d.phone)}`]),
].filter(Boolean)

/** Sépare nouveaux et doublons (base existante puis lignes précédentes du même fichier). */
export function dedupe(items, existing, kind) {
  const idx = indexOf(existing, kind)
  const fresh = [], duplicates = []
  for (const it of items) {
    const ks = keysOf(it.doc, kind)
    const hit = ks.map((k) => idx.get(k)).find(Boolean)
    if (hit) { duplicates.push({ row: it.row, label: kind === 'properties' ? it.doc.title : it.doc.name, reason: hit.id ? `${hit.why} que « ${hit.label} »` : `${hit.why} qu’une ligne précédente du fichier (ligne ${hit.row})`, existingId: hit.id ?? null }); continue }
    fresh.push(it)
    for (const k of ks) if (!idx.has(k)) idx.set(k, { row: it.row, why: k.startsWith('e:') ? 'même e-mail' : k.startsWith('p:') ? 'même téléphone' : k.startsWith('a:') ? 'même adresse et même prix' : 'même référence' })
  }
  return { fresh, duplicates }
}

/* ——— Actions ——— */

const COL = { properties: 'properties', contacts: 'contacts' }
const MAX_TEXT = 8 * 1024 * 1024

/**
 * Actions d'import à fusionner dans celles du moteur : `{ ...createImporter(db, { put, activity, HttpError }).actions }`.
 * `locate(district, city)` optionnel → [lng, lat] pour placer les biens sans coordonnées sur la carte.
 */
export function createImporter(db, { put, activity, HttpError, locate } = {}) {
  const Err = HttpError ?? class extends Error { constructor(status, message) { super(message); this.status = status } }
  function prepare({ kind, text, mapping, file }) {
    if (!COL[kind]) throw new Err(400, 'Choisissez « properties » (biens) ou « contacts »')
    if (!String(text ?? '').trim()) throw new Err(400, 'Fichier CSV vide')
    if (String(text).length > MAX_TEXT) throw new Err(413, 'Fichier trop volumineux (8 Mo maximum) : exportez par lots')
    const { headers, rows, separator } = parseCsv(text)
    if (headers.length < 2) throw new Err(400, 'Aucune colonne reconnue : vérifiez que le fichier est bien un export CSV')
    const source = detectSource(headers)
    const guessed = guessMapping(headers, kind, source)
    const map = mapping ? Object.fromEntries(Object.keys(guessed).map((k) => [k, mapping[k] && headers.includes(mapping[k]) ? mapping[k] : mapping[k] === undefined ? guessed[k] : null])) : guessed
    const agency = db.get?.('settings', 'agency') ?? {}
    const center = Array.isArray(agency.center) ? agency.center : null
    const at = new Date().toISOString()
    const { items, issues } = convert(rows, map, kind, { source, file: file ?? '', at, locate, center })
    const { fresh, duplicates } = dedupe(items, db.list(COL[kind]), kind)
    const missing = FIELDS[kind].filter((f) => f.req && !map[f.k] && !(kind === 'contacts' && f.k === 'name' && (map.lastName || map.firstName))).map((f) => f.l)
    return { source, sourceLabel: PRESETS[source]?.label ?? 'Source inconnue', separator, headers, mapping: map, fields: FIELDS[kind], rows: rows.length, fresh, duplicates, issues, missing }
  }
  return {
    actions: {
      'import.preview': (p = {}) => {
        const r = prepare(p)
        return { source: r.source, sourceLabel: r.sourceLabel, separator: r.separator, headers: r.headers, mapping: r.mapping, fields: r.fields, missing: r.missing,
          rows: r.rows, count: r.fresh.length, sample: r.fresh.slice(0, 5).map((x) => x.doc), issues: r.issues.slice(0, 200), duplicates: r.duplicates.slice(0, 200), duplicateCount: r.duplicates.length }
      },
      'import.run': (p = {}) => {
        const r = prepare(p)
        const ids = r.fresh.map(({ doc }) => put(COL[p.kind], doc).id)
        const what = p.kind === 'properties' ? `${ids.length} bien${ids.length > 1 ? 's' : ''}` : `${ids.length} contact${ids.length > 1 ? 's' : ''}`
        if (ids.length) activity?.('Import', `a importé ${what} depuis ${r.sourceLabel}${p.file ? ` (${p.file})` : ''}${r.duplicates.length ? ` · ${r.duplicates.length} doublon${r.duplicates.length > 1 ? 's' : ''} ignoré${r.duplicates.length > 1 ? 's' : ''}` : ''}`, 'neutral', p.kind === 'properties' ? '/app/biens' : '/app/contacts')
        const rejected = r.issues.filter((i) => i.level === 'erreur').length
        return { created: ids.length, ids, skipped: r.duplicates.length + rejected, duplicates: r.duplicates.slice(0, 200), issues: r.issues.slice(0, 200), source: r.source }
      },
    },
  }
}
