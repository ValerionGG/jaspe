// Émission déléguée : modèle mandataire, Factur-X (CII), InvoiceXpress avec fetch simulé. Aucun appel réseau réel.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from './index.js'
import { HttpError } from './engine.js'
import { createInvoicing, NOT_CONFIGURED, IX_BASE } from './invoicing.js'

const setup = ({ country = 'FR', env = {}, fetch } = {}) => {
  const { db, engine } = createApp({ dbPath: ':memory:', delay: () => Promise.resolve() })
  const put = (c, d, o) => db.put(c, d, o), patch = (c, id, p) => db.patch(c, id, p)
  const inv = createInvoicing(db, { put, patch, activity: () => {}, HttpError, fetch: fetch ?? (() => { throw new Error('réseau interdit en test') }), env })
  const A = { ...engine.actions, ...inv.actions }
  db.put('settings', { id: 'agency', country, agencyName: 'Maison Riviera' })
  db.put('properties', { id: 'p1', title: 'Villa', type: 'Villa', city: 'Antibes', price: 3e6 })
  db.put('dossiers', { id: 'd1', seller: 'Famille Test', propertyId: 'p1', agentId: 'a1', stage: 'compromis', deliverables: {} })
  db.put('transactions', { id: 'tx1', dossier: 'd1', propertyId: 'p1', price: 3e6, seller: 'Famille Test', buyer: 'M. Achat', fees: 120000, feePayer: 'acquéreur', split: [{ agency: 'Antibes', pct: 60, role: 'Mandat' }, { agency: 'Biot', pct: 40, role: 'Mandataire' }], pieces: [] })
  return { db, A }
}

/** Contrôle de forme sans dépendance : balises équilibrées, une racine, entités valides. */
function wellFormed(xml) {
  const body = xml.replace(/^<\?xml[^>]*\?>\s*/, '')
  assert.ok(!/&(?!amp;|lt;|gt;|quot;|apos;)/.test(body), 'entités échappées')
  const stack = []; let roots = 0
  for (const m of body.matchAll(/<(\/?)([\w:]+)([^>]*?)(\/?)>/g)) {
    const [, close, name, , self] = m
    if (self) { if (!stack.length) roots++; continue }
    if (close) assert.equal(stack.pop(), name, `fermeture de ${name}`)
    else { if (!stack.length) roots++; stack.push(name) }
  }
  assert.equal(stack.length, 0, 'toutes les balises fermées'); assert.equal(roots, 1, 'une seule racine')
}
const tag = (xml, name) => [...xml.matchAll(new RegExp(`<ram:${name}(?: [^>]*)?>([^<]*)</ram:${name}>`, 'g'))].map((m) => m[1])

test('modèle mandataire : quote-part depuis la répartition, franchise en base (art. 293 B)', () => {
  const { db, A } = setup()
  A['invoice.settings']({ agent: { name: 'Karim B.', rsac: 'Nice n° 912 345 678', siren: '912345678', vatRegime: 'franchise' }, network: { name: 'Réseau Sud', siren: '552100554' } })
  const agency = A['invoice.fromTransaction']({ txId: 'tx1' })
  const m = A['invoice.fromTransaction']({ txId: 'tx1', template: 'mandataire' })
  assert.notEqual(agency.id, m.id, 'les deux modèles coexistent sur une transaction')
  assert.equal(A['invoice.fromTransaction']({ txId: 'tx1', template: 'mandataire' }).id, m.id, 'pas de doublon du même modèle')
  assert.equal(m.share.pct, 40, 'ligne « Mandataire » de la répartition')
  assert.equal(m.ht, 40000); assert.equal(m.vatRate, 0); assert.equal(m.vat, 0); assert.equal(m.ttc, 40000)
  assert.equal(m.client, 'Réseau Sud'); assert.equal(m.payerRole, 'réseau')
  assert.ok(m.mentions.includes('TVA non applicable, art. 293 B du CGI.'))
  assert.ok(m.mentions.some((x) => /RSAC de Nice/.test(x)))
  assert.equal(m.regimeToConfirm, false)
  const custom = (db.remove('invoices', m.id), A['invoice.fromTransaction']({ txId: 'tx1', template: 'mandataire', agentShare: 70 }))
  assert.equal(custom.ht, 70000)
  assert.throws(() => A['invoice.fromTransaction']({ txId: 'tx1', template: 'autre' }), /agence ou mandataire/)
})

test('mandataire assujetti, régime non réglé → « à confirmer »', () => {
  const { A } = setup()
  const m = A['invoice.fromTransaction']({ txId: 'tx1', template: 'mandataire', agentShare: 50 })
  assert.equal(m.regimeToConfirm, true); assert.ok(m.mentions.some((x) => /à confirmer/.test(x)))
  const { A: B } = setup()
  B['invoice.settings']({ agent: { vatRegime: 'assujetti', vatId: 'FR12912345678' } })
  const t = B['invoice.fromTransaction']({ txId: 'tx1', template: 'mandataire', agentShare: 50 })
  assert.equal(t.vat, 10000); assert.equal(t.ttc, 60000)
  assert.throws(() => B['invoice.settings']({ agent: { vatRegime: 'micro' } }), /franchise ou assujetti/)
})

test('Factur-X : XML CII bien formé, éléments obligatoires, HT + TVA = TTC, figé à l’émission', async () => {
  const { A } = setup()
  A['invoice.settings']({ seller: { name: 'Maison Riviera SAS', siren: '123456789', vatId: 'FR40123456789', address: '1 rue du Port', postcode: '06600', city: 'Antibes' } })
  const inv = A['invoice.fromTransaction']({ txId: 'tx1' })
  assert.throws(() => A['invoice.facturx']({ id: inv.id }), /Validez/)
  A['invoice.validate']({ id: inv.id })
  const { xml, filename, missing } = A['invoice.facturx']({ id: inv.id })
  assert.match(filename, /^factur-x_FA-\d{4}-\d{4}\.xml$/); assert.deepEqual(missing, [])
  wellFormed(xml)
  assert.match(xml, /<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"/)
  assert.deepEqual(tag(xml, 'ID').slice(0, 2), ['urn:cen.eu:en16931:2017', A['invoice.facturx']({ id: inv.id }).filename.slice(9, -4)])
  for (const t of ['TypeCode', 'SellerTradeParty', 'BuyerTradeParty', 'InvoiceCurrencyCode', 'ApplicableTradeTax', 'GrandTotalAmount', 'DuePayableAmount', 'RateApplicablePercent']) assert.ok(xml.includes(`<ram:${t}`), `${t} présent`)
  assert.match(xml, /<udt:DateTimeString format="102">\d{8}<\/udt:DateTimeString>/)
  const [ht] = tag(xml, 'TaxBasisTotalAmount').map(Number), [vat] = tag(xml, 'TaxTotalAmount').map(Number), [ttc] = tag(xml, 'GrandTotalAmount').map(Number)
  assert.equal(ht, 100000); assert.equal(vat, 20000); assert.equal(ttc, 120000); assert.equal(Math.round((ht + vat) * 100), Math.round(ttc * 100))
  assert.equal(Number(tag(xml, 'LineTotalAmount')[0]), ht, 'ligne = total HT')
  assert.equal(tag(xml, 'CategoryCode')[0], 'S')
  const out = await A['invoice.issue']({ id: inv.id })
  assert.equal(out.legal.provider, 'facturx'); assert.equal(out.facturx.xml, xml)
  await assert.rejects(A['invoice.issue']({ id: inv.id }), /déjà émise/)
})

test('Factur-X mandataire en franchise : catégorie E, motif 293 B, TVA 0 ; champs manquants bloquent l’émission', async () => {
  const { A } = setup()
  A['invoice.settings']({ agent: { name: 'Karim B. & fils', siren: '912345678', rsac: 'Nice', vatRegime: 'franchise' } })
  const m = A['invoice.fromTransaction']({ txId: 'tx1', template: 'mandataire' })
  A['invoice.validate']({ id: m.id })
  const r = A['invoice.facturx']({ id: m.id })
  wellFormed(r.xml)
  assert.ok(r.xml.includes('Karim B. &amp; fils'))
  assert.equal(tag(r.xml, 'CategoryCode')[0], 'E'); assert.equal(tag(r.xml, 'ExemptionReason')[0], 'TVA non applicable, art. 293 B du CGI')
  assert.equal(Number(tag(r.xml, 'TaxTotalAmount')[0]), 0); assert.equal(Number(tag(r.xml, 'GrandTotalAmount')[0]), 40000)
  assert.ok(r.missing.some((x) => /adresse du vendeur/.test(x)) && r.missing.some((x) => /SIREN du réseau/.test(x)))
  await assert.rejects(A['invoice.issue']({ id: m.id }), /Factur-X incomplet/)
})

test('InvoiceXpress : client créé, brouillon, finalisation, numéro légal + ATCUD + PDF stockés ; jamais ré-émise', async () => {
  const calls = []
  const reply = (status, json) => ({ ok: status < 300, status, json: async () => json })
  const fetch = async (url, init) => {
    const u = new URL(url); calls.push({ method: init.method, path: u.pathname, key: u.searchParams.get('api_key'), body: init.body && JSON.parse(init.body) })
    if (init.method === 'GET' && u.pathname === '/api/v3/clients') return reply(200, { clients: [], pagination: { total_entries: 0 } })
    if (init.method === 'POST' && u.pathname === '/api/v3/clients') return reply(201, { client: { id: 777, name: 'M. Achat' } })
    if (init.method === 'POST' && u.pathname === '/api/v3/invoices') return reply(201, { invoice: { id: 4242, status: 'draft' } })
    if (init.method === 'PUT' && u.pathname === '/api/v3/invoices/4242/change-state.json') return reply(200, { invoice: { id: 4242, status: 'final', sequence_number: '12/FT2026', atcud: 'JFQ3KX7P-12', permalink: 'https://web.invoicexpress.com/documents/tok' } })
    if (init.method === 'GET' && u.pathname === '/api/v3/invoices/4242/pdf') return reply(200, { pdf: { url: 'https://s3.example/ft-12.pdf' } })
    return reply(404, { errors: [{ error: 'Resource not found' }] })
  }
  const { db, A } = setup({ country: 'PT', env: { INVOICEXPRESS_ACCOUNT: 'riviera', INVOICEXPRESS_API_KEY: 'k-test' }, fetch })
  assert.equal(A['invoice.connector']().invoicexpress.configured, true)
  assert.equal(JSON.stringify(A['invoice.connector']()).includes('k-test'), false, 'la clé ne sort jamais')
  const inv = A['invoice.fromTransaction']({ txId: 'tx1' })
  await assert.rejects(A['invoice.issue']({ id: inv.id }), /Validez/)
  A['invoice.validate']({ id: inv.id })
  const out = await A['invoice.issue']({ id: inv.id })
  assert.deepEqual(calls.map((c) => `${c.method} ${c.path}`), [
    'GET /api/v3/clients', 'POST /api/v3/clients', 'POST /api/v3/invoices', 'PUT /api/v3/invoices/4242/change-state.json', 'GET /api/v3/invoices/4242/pdf',
  ])
  assert.ok(calls.every((c) => c.key === 'k-test'), 'api_key en paramètre de requête')
  assert.ok(new URL(IX_BASE).host === 'api-v3.app.invoicexpress.com')
  const body = calls[2].body
  assert.equal(body.invoice.client_id, 777); assert.equal(body.invoice.items[0].unit_price, 120000); assert.equal(body.invoice.items[0].tax.name, 'IVA23')
  assert.equal(body.proprietary_uid, `jaspe-${inv.id}`); assert.equal(body.invoice.reference, db.get('invoices', inv.id).number)
  assert.ok(body.invoice.items[0].name.length <= 60 && body.invoice.observations.length <= 400)
  assert.deepEqual(calls[3].body, { invoice: { state: 'finalized' } })
  const saved = db.get('invoices', inv.id).legal
  assert.equal(saved.provider, 'invoicexpress'); assert.equal(saved.externalId, 4242); assert.equal(saved.legalNumber, '12/FT2026'); assert.equal(saved.atcud, 'JFQ3KX7P-12'); assert.equal(saved.pdfUrl, 'https://s3.example/ft-12.pdf'); assert.ok(saved.issuedAt)
  assert.equal(out.legal.legalNumber, '12/FT2026')
  const n = calls.length
  await assert.rejects(A['invoice.issue']({ id: inv.id }), /déjà émise : 12\/FT2026/)
  assert.equal(calls.length, n, 'aucun appel pour une facture déjà émise')
  assert.throws(() => A['invoice.facturx']({ id: inv.id }), /InvoiceXpress/)
})

test('InvoiceXpress : client existant réutilisé, mandataire en isenção art. 53.º, reprise après échec de finalisation', async () => {
  const calls = []; let failFinalize = true
  const reply = (status, json) => ({ ok: status < 300, status, json: async () => json })
  const fetch = async (url, init) => {
    const u = new URL(url); calls.push(`${init.method} ${u.pathname}`); const body = init.body && JSON.parse(init.body)
    if (u.pathname === '/api/v3/clients') return reply(200, { clients: [{ id: 55, name: 'Rede Lisboa', fiscal_id: '509999999' }] })
    if (u.pathname === '/api/v3/invoices') { assert.equal(body.invoice.tax_exemption, 'M10'); assert.equal(body.invoice.items[0].tax.name, 'IVA0'); assert.equal(body.invoice.client_id, 55); return reply(201, { invoice: { id: 9 } }) }
    if (u.pathname.endsWith('change-state.json')) { if (failFinalize) { failFinalize = false; return reply(422, { errors: [{ error: 'Sequence not registered at AT' }] }) } return reply(200, { invoice: { id: 9, sequence_number: '1/FR2026', atcud: 'ABCD-1', permalink: 'https://web.invoicexpress.com/documents/x' } }) }
    if (u.pathname.endsWith('/pdf')) return reply(202, { pdf: { message: 'PDF file is being generated' } })
    return reply(404, {})
  }
  const { db, A } = setup({ country: 'PT', env: { INVOICEXPRESS_ACCOUNT: 'consultor', INVOICEXPRESS_API_KEY: 'k' }, fetch })
  A['invoice.settings']({ agent: { name: 'Ana Costa', nif: '245000000', ptVatRegime: 'isencao53' }, network: { name: 'Rede Lisboa', nif: '509999999' } })
  const m = A['invoice.fromTransaction']({ txId: 'tx1', template: 'mandataire' })
  assert.equal(m.vatRate, 0); assert.ok(m.mentions.some((x) => /art\. 53\.º do CIVA/.test(x)))
  A['invoice.validate']({ id: m.id })
  await assert.rejects(A['invoice.issue']({ id: m.id }), (e) => e.status === 502 && /Sequence not registered at AT/.test(e.message) && !e.message.includes('api_key'))
  assert.equal(db.get('invoices', m.id).legal.externalId, 9, 'brouillon InvoiceXpress mémorisé')
  const out = await A['invoice.issue']({ id: m.id })
  assert.equal(calls.filter((c) => c === 'POST /api/v3/invoices').length, 1, 'pas de second brouillon à la reprise')
  assert.equal(out.legal.legalNumber, '1/FR2026'); assert.equal(out.legal.pdfPending, true); assert.equal(out.legal.pdfUrl, 'https://web.invoicexpress.com/documents/x')
})

test('connecteur absent → erreur claire, facture inchangée', async () => {
  const { db, A } = setup({ country: 'PT' })
  const c = A['invoice.connector']()
  assert.equal(c.invoicexpress.configured, false); assert.equal(c.invoicexpress.note, NOT_CONFIGURED)
  const inv = A['invoice.fromTransaction']({ txId: 'tx1' })
  A['invoice.validate']({ id: inv.id })
  await assert.rejects(A['invoice.issue']({ id: inv.id }), (e) => e.status === 409 && /non configuré/.test(e.message) && /document de préparation/.test(e.message))
  assert.equal(db.get('invoices', inv.id).legal, undefined)
})
