// Import CSV eGO / Hektor : parse, mapping deviné, conversion, dédoublonnage (sans serveur, base en mémoire).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCsv, detectSource, guessMapping, toDocs, convert, num, typology, phone, dpeClass, createImporter } from './importer.js'

// Exports fictifs : les en-têtes réels d'eGO et d'Hektor sont à confirmer sur un vrai fichier d'agence.
const EGO_PROPS = '﻿Referência;Tipo de Imóvel;Natureza;Preço;Área Útil;Área Bruta;Tipologia;Quartos;Concelho;Freguesia;Distrito;Morada;Certificado Energético;Estado;Descrição\r\n'
  + 'EGO-001;Apartamento;Venda;"1.250.000 €";"120 m²";145;T3;3;Lisboa;Santo António;Lisboa;"Rua Castilho, 12";A+;Usado;"Vista rio,\r\nterraço ""amplo"""\r\n'
  + 'EGO-002;Moradia;Venda;"890 000";"210,5 m²";;T4;;Cascais;Estoril;Lisboa;Av. Marginal 300;B-;Reservado;\r\n'
  + 'EGO-003;Terreno;Venda;sob consulta;;;;;Sintra;Colares;Lisboa;;Isento;Ativo;\r\n'
  + ';;;;;;;;;;;;;;\r\n'

const EGO_CONTACTS = 'Nome;Email;Telemóvel;Telefone;NIF;Tipo de Contacto;Concelho\n'
  + 'Ana Sousa;ANA.SOUSA@exemplo.pt;912 345 678;;123456789;Proprietário;Lisboa\n'
  + 'João Pires;joao@exemplo;;213 456 789;;Comprador;Cascais\n'

const HEKTOR_PROPS = 'Référence,Type de bien,Prix,Surface habitable,Nb pièces,Nb chambres,Ville,Code postal,Adresse,DPE\n'
  + 'HK-10,Appartement,"985 000",112,4,2,Antibes,06600,5 place Masséna,D\n'
  + 'HK-11,Maison,"1 640 000 €","192,0",5,3,Biot,06410,8 impasse des Pins,A\n'

const HEKTOR_CONTACTS = 'Nom\tPrénom\tEmail\tTéléphone\tPortable\tVille\tType\n'
  + 'MARTIN\thélène\th.martin@orange.fr\t04 93 00 00 00\t06 12 48 77 03\tAntibes\tVendeur\n'
  + 'Durand\tPaul\tpaul.durand@gmail.com\t\t0671205498\tNice\tAcquéreur\n'

/** Faux db minimal : list / get / put, ids générés comme db.js. */
function memDb() {
  const cols = {}
  let n = 0
  const list = (c) => [...(cols[c] ?? new Map()).values()]
  const get = (c, id) => cols[c]?.get(id) ?? null
  const put = (c, d) => { d.id ??= `${c.slice(0, 3)}_${++n}`; (cols[c] ??= new Map()).set(d.id, d); return d }
  return { list, get, put }
}
const setup = () => {
  const db = memDb(), log = []
  class HttpError extends Error { constructor(status, message) { super(message); this.status = status } }
  const { actions } = createImporter(db, { put: db.put, activity: (...a) => log.push(a), HttpError })
  return { db, log, actions }
}

test('nettoyage : prix, surfaces, typologie, téléphones, DPE', () => {
  assert.equal(num('1.250.000 €'), 1250000)
  assert.equal(num('1 250 000'), 1250000)
  assert.equal(num('1,250,000'), 1250000)
  assert.equal(num('980 000,00 €'), 980000)
  assert.equal(num('120 m²'), 120)
  assert.equal(num('210,5 m2'), 210.5)
  assert.equal(num('sob consulta'), null)
  assert.deepEqual(typology('T3'), { rooms: 4, bedrooms: 3 })
  assert.deepEqual(typology('T0'), { rooms: 1, bedrooms: 0 })
  assert.deepEqual(typology('T3+1'), { rooms: 5, bedrooms: 4 })
  assert.equal(phone('912 345 678', 'PT'), '+351 912 345 678')
  assert.equal(phone('06.12.48.77.03', 'FR'), '+33 6 12 48 77 03')
  assert.equal(phone('0033 6 12 48 77 03', 'PT'), '+33 6 12 48 77 03')
  assert.equal(dpeClass('A+'), 'A')
  assert.equal(dpeClass('B-'), 'B')
  assert.equal(dpeClass('Classe D'), 'D')
  assert.equal(dpeClass('Isento'), null)
  assert.equal(dpeClass('NC'), null)
})

test('CSV eGO : séparateur ;, BOM, guillemets, retour à la ligne, mapping et conversion', () => {
  const { headers, rows, separator } = parseCsv(EGO_PROPS)
  assert.equal(separator, ';')
  assert.equal(headers[0], 'Referência')
  assert.equal(rows.length, 3, 'la ligne vide est ignorée')
  assert.equal(rows[0]['Descrição'], 'Vista rio,\nterraço "amplo"')
  assert.equal(detectSource(headers), 'ego')
  const m = guessMapping(headers, 'properties')
  assert.equal(m.ref, 'Referência')
  assert.equal(m.type, 'Tipo de Imóvel')
  assert.equal(m.price, 'Preço')
  assert.equal(m.surface, 'Área Útil')
  assert.equal(m.surfaceGross, 'Área Bruta')
  assert.equal(m.typology, 'Tipologia')
  assert.equal(m.bedrooms, 'Quartos')
  assert.equal(m.city, 'Concelho')
  assert.equal(m.district, 'Freguesia')
  assert.equal(m.region, 'Distrito')
  assert.equal(m.address, 'Morada')
  assert.equal(m.dpe, 'Certificado Energético')
  assert.equal(m.status, 'Estado')
  const [a, b, c] = toDocs(rows, m, 'properties', { source: 'ego', file: 'ego.csv', at: '2026-11-26T10:00:00Z' })
  assert.equal(a.price, 1250000)
  assert.equal(a.surface, 120)
  assert.equal(a.surfaceGross, 145)
  assert.equal(a.rooms, 4, 'T3 → 4 pièces')
  assert.equal(a.bedrooms, 3)
  assert.equal(a.type, 'Appartement')
  assert.equal(a.dpe, 'A')
  assert.equal(a.city, 'Lisboa')
  assert.equal(a.district, 'Santo António')
  assert.equal(a.condition, 'Usado')
  assert.equal(a.status, 'Brouillon')
  assert.equal(a.title, 'Apartamento T3 — Santo António')
  assert.deepEqual(a.importedFrom, { source: 'ego', file: 'ego.csv', at: '2026-11-26T10:00:00Z', ref: 'EGO-001' })
  assert.ok(Number.isFinite(a.lat) && Number.isFinite(a.lng) && a.geoApprox)
  assert.equal(b.surface, 210.5)
  assert.equal(b.rooms, 5)
  assert.equal(b.type, 'Maison')
  assert.equal(b.status, 'Sous offre')
  assert.equal(c.type, 'Terrain')
  assert.equal(c.price, 0)
  assert.equal(c.dpe, undefined)
  const { issues } = convert(rows, m, 'properties', { source: 'ego' })
  assert.ok(issues.some((i) => i.row === 4 && /Prix illisible/.test(i.problem)))
})

test('CSV eGO contacts et Hektor (virgule, tabulation, Nom + Prénom)', () => {
  const e = parseCsv(EGO_CONTACTS)
  assert.equal(detectSource(e.headers), 'ego')
  const me = guessMapping(e.headers, 'contacts')
  assert.equal(me.name, 'Nome'); assert.equal(me.phone, 'Telemóvel'); assert.equal(me.phone2, 'Telefone'); assert.equal(me.taxId, 'NIF'); assert.equal(me.role, 'Tipo de Contacto')
  const [ana, joao] = toDocs(e.rows, me, 'contacts', { source: 'ego' })
  assert.equal(ana.email, 'ana.sousa@exemplo.pt')
  assert.equal(ana.phone, '+351 912 345 678')
  assert.deepEqual(ana.roles, ['vendeur'])
  assert.deepEqual(ana.consents, [], 'aucun consentement inventé')
  assert.equal(ana.taxId, '123456789')
  assert.equal(joao.email, '', 'e-mail invalide non repris')
  assert.equal(joao.phone, '+351 213 456 789')
  assert.deepEqual(joao.roles, ['acquereur'])

  const hp = parseCsv(HEKTOR_PROPS)
  assert.equal(hp.separator, ',')
  assert.equal(detectSource(hp.headers), 'hektor')
  const mp = guessMapping(hp.headers, 'properties')
  assert.equal(mp.surface, 'Surface habitable'); assert.equal(mp.rooms, 'Nb pièces'); assert.equal(mp.bedrooms, 'Nb chambres'); assert.equal(mp.postalCode, 'Code postal')
  const [h1, h2] = toDocs(hp.rows, mp, 'properties', { source: 'hektor' })
  assert.equal(h1.price, 985000); assert.equal(h1.rooms, 4); assert.equal(h1.postalCode, '06600'); assert.equal(h1.dpe, 'D')
  assert.equal(h2.price, 1640000); assert.equal(h2.surface, 192)

  const hc = parseCsv(HEKTOR_CONTACTS)
  assert.equal(hc.separator, '\t')
  assert.equal(detectSource(hc.headers), 'hektor')
  const mc = guessMapping(hc.headers, 'contacts')
  assert.equal(mc.lastName, 'Nom'); assert.equal(mc.firstName, 'Prénom'); assert.equal(mc.phone, 'Portable'); assert.equal(mc.phone2, 'Téléphone'); assert.equal(mc.role, 'Type')
  const [helene, paul] = toDocs(hc.rows, mc, 'contacts', { source: 'hektor' })
  assert.equal(helene.name, 'Hélène Martin')
  assert.equal(helene.phone, '+33 6 12 48 77 03')
  assert.equal(helene.phone2, '+33 4 93 00 00 00')
  assert.deepEqual(helene.roles, ['vendeur'])
  assert.equal(paul.phone, '+33 6 71 20 54 98')
  assert.deepEqual(paul.roles, ['acquereur'])
})

test('aperçu puis deux imports successifs : aucun doublon', () => {
  const { db, log, actions } = setup()
  const pv = actions['import.preview']({ kind: 'properties', text: EGO_PROPS, file: 'ego.csv' })
  assert.equal(pv.source, 'ego')
  assert.equal(pv.count, 3)
  assert.equal(pv.sample.length, 3)
  assert.equal(pv.duplicates.length, 0)
  const r1 = actions['import.run']({ kind: 'properties', text: EGO_PROPS, mapping: pv.mapping, file: 'ego.csv' })
  assert.equal(r1.created, 3)
  assert.equal(db.list('properties').length, 3)
  assert.equal(log.length, 1)
  const r2 = actions['import.run']({ kind: 'properties', text: EGO_PROPS, mapping: pv.mapping, file: 'ego.csv' })
  assert.equal(r2.created, 0)
  assert.equal(r2.skipped, 3)
  assert.equal(db.list('properties').length, 3)

  // Même bien ressaisi sans référence : reconnu par adresse + prix.
  const again = 'Referência;Morada;Preço;Concelho\n;"Rua Castilho, 12";1250000;Lisboa\n'
  assert.equal(actions['import.preview']({ kind: 'properties', text: again }).duplicates[0].reason.startsWith('même adresse'), true)

  // Contacts : même e-mail ou même téléphone qu'un existant, et doublon interne au fichier.
  const c1 = actions['import.run']({ kind: 'contacts', text: HEKTOR_CONTACTS, file: 'hektor.csv' })
  assert.equal(c1.created, 2)
  const next = 'Nom;Prénom;Email;Portable;Ville\nMartin;H.;H.MARTIN@orange.fr;;Antibes\nDurand;P.;autre@x.fr;+33 6 71 20 54 98;Nice\nNeuf;Léa;lea@x.fr;0700000001;Nice\nNeuf;Léa;lea@x.fr;;Nice\n'
  const c2 = actions['import.run']({ kind: 'contacts', text: next, file: 'hektor-2.csv' })
  assert.equal(c2.created, 1)
  assert.equal(c2.skipped, 3)
  assert.deepEqual(c2.duplicates.map((d) => d.reason.split(' ').slice(0, 2).join(' ')), ['même e-mail', 'même téléphone', 'même e-mail'])
  assert.equal(db.list('contacts').length, 3)
  assert.ok(db.list('contacts').every((c) => Array.isArray(c.consents) && c.consents.length === 0 && c.importedFrom?.source === 'hektor'))
})

test('mapping corrigé par le conseiller et erreurs lisibles', () => {
  const { actions } = setup()
  const pv = actions['import.preview']({ kind: 'contacts', text: EGO_CONTACTS, mapping: { phone: null } })
  assert.equal(pv.mapping.phone, null)
  assert.equal(pv.mapping.name, 'Nome', 'champs non précisés : mapping deviné')
  assert.throws(() => actions['import.preview']({ kind: 'biens', text: EGO_CONTACTS }), /properties/)
  assert.throws(() => actions['import.preview']({ kind: 'contacts', text: '' }), (e) => e.status === 400)
})
