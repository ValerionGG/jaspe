// Émission déléguée des factures de commission : Jaspe prépare, un logiciel certifié émet.
// - Portugal : API InvoiceXpress (logiciel certifié AT) → numéro légal, ATCUD, PDF.
// - France : fichier Factur-X (XML CII, profil EN 16931) à déposer sur une plateforme agréée (PA).
// Code pur, `fetch` injecté : aucune API Node, il tourne aussi dans le navigateur (build statique).
//
// Sources vérifiées le 26/11/2026 (documentation publique InvoiceXpress v3, version 3.2.0) :
//   Authentification et hôte : https://docs.invoicexpress.com/v3#section/Authentication
//     « Send your api_key as a query parameter » · serveur de production https://api-v3.app.invoicexpress.com/
//   Clients (liste, recherche `term`)   : https://docs.invoicexpress.com/v3/clients/listv3clients.md
//   Clients (création)                  : https://docs.invoicexpress.com/v3/clients/createv3client.md
//   Facture (création en brouillon)     : https://docs.invoicexpress.com/v3/invoices/createv3invoice.md
//   Changement d'état (draft → final)   : https://docs.invoicexpress.com/v3/invoices/changev3invoicedocumentstate.md
//   PDF (200 { pdf.url } ou 202 en cours) : https://docs.invoicexpress.com/v3/invoices/getv3documentpdf.md
// Factur-X / CII : https://fnfe-mpe.org/factur-x/ · norme EN 16931-1 · syntaxe UN/CEFACT CII D16B.

/* ——— InvoiceXpress : constantes ——— */
/** Hôte v3 documenté. Surchargeable par INVOICEXPRESS_BASE_URL (bac à sable, proxy). */
export const IX_BASE = 'https://api-v3.app.invoicexpress.com'
/** À confirmer : la doc v3 n'utilise plus le compte dans l'hôte (l'api_key identifie le compte).
 *  L'ancienne API v2 utilisait https://{compte}.app.invoicexpress.com ; on garde INVOICEXPRESS_ACCOUNT
 *  pour l'identification et l'affichage, et pour ce repli si InvoiceXpress le réclame. */
export const IX_LEGACY_HOST = (account) => `https://${account}.app.invoicexpress.com`
/** Type de document : « invoices » = fatura (FT). La fatura-recibo serait « invoice_receipts ». */
export const IX_DOC_TYPE = 'invoices'
/** À confirmer : noms des taxes tels que configurés dans le compte (exemple documenté : « IVA23 »).
 *  La liste réelle se lit par GET /api/v3/taxes. */
export const IX_TAX = { normal: 'IVA23', exempt: 'IVA0' }
/** À confirmer : code d'exonération AT du régime particulier d'isenção (art. 53.º CIVA) — M10 dans la table AT. */
export const IX_EXEMPTION_ART53 = 'M10'
/** Unité d'une prestation (exemple documenté : « service »). */
export const IX_UNIT = 'service'
/** Format de date accepté à la création (exemple documenté v3 : « 2024-01-15 » ; la v2 attendait jj/mm/aaaa). À confirmer. */
const ixDate = (d) => isoDay(d)

const isoDay = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}` }
const r2 = (n) => Math.round(Number(n) * 100) / 100

export const NOT_CONFIGURED = 'Connecteur InvoiceXpress non configuré : définissez INVOICEXPRESS_ACCOUNT et INVOICEXPRESS_API_KEY côté serveur. La facture reste un document de préparation.'

export function ixConfig(env = {}) {
  const account = String(env.INVOICEXPRESS_ACCOUNT ?? '').trim()
  const apiKey = String(env.INVOICEXPRESS_API_KEY ?? '').trim()
  return { configured: !!(account && apiKey), account, apiKey, base: String(env.INVOICEXPRESS_BASE_URL ?? '').trim() || IX_BASE }
}

/** Client HTTP minimal. La clé ne sort jamais dans les messages d'erreur. */
export function ixClient({ apiKey, base = IX_BASE, fetch, HttpError = Error }) {
  return async (method, path, body, query = {}) => {
    const qs = new URLSearchParams({ ...query, api_key: apiKey }).toString()
    const res = await fetch(`${base}${path}?${qs}`, {
      method,
      headers: { accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
    let json = null
    try { json = await res.json() } catch { /* corps vide */ }
    if (!res.ok) {
      const why = json?.errors?.map((e) => e.error).filter(Boolean).join(' · ') || `HTTP ${res.status}`
      const e = new HttpError(502, `InvoiceXpress : ${why} (HTTP ${res.status}, ${method} ${path})`)
      e.status = e.status ?? 502
      throw e
    }
    return { status: res.status, json: json ?? {} }
  }
}

/** Corps de création d'une fatura, depuis la facture Jaspe. Aucun champ inventé : NIF absent = non transmis. */
export function ixInvoicePayload(inv, clientId) {
  const exempt = inv.vatRate === 0
  const name = (inv.template === 'mandataire' ? 'Comissão de mediação (consultor)' : 'Comissão de mediação imobiliária').slice(0, 60)
  return {
    proprietary_uid: `jaspe-${inv.id}`, // idempotence documentée : un renvoi rend le document déjà créé
    invoice: {
      date: ixDate(inv.validatedAt ?? inv.createdAt),
      due_date: ixDate(inv.validatedAt ?? inv.createdAt),
      reference: inv.number ?? undefined,
      observations: [inv.object, ...(inv.mentions ?? []).filter((m) => !/Documento de prepara/.test(m))].join(' · ').slice(0, 400),
      client_id: clientId,
      ...(exempt ? { tax_exemption: IX_EXEMPTION_ART53 } : {}),
      items: [{
        name, description: String(inv.object ?? '').slice(0, 200), unit_price: r2(inv.ht), quantity: '1.00', unit: IX_UNIT,
        tax: { name: exempt ? IX_TAX.exempt : IX_TAX.normal },
      }],
    },
  }
}

/** Séquence complète : client (trouvé ou créé) → brouillon → finalisation → PDF.
 *  Reprend là où un essai précédent s'est arrêté (`prev.externalId` : pas de second brouillon). */
export async function issueWithInvoiceXpress(inv, { call, client, prev = {}, onStep = () => {} }) {
  let externalId = prev.externalId ?? null
  let clientId = prev.clientId ?? null
  if (!externalId) {
    if (!clientId) {
      const term = client.fiscal_id || client.name
      const found = await call('GET', '/api/v3/clients', null, { term, status: 'all', per_page: '25' })
      const same = (found.json.clients ?? []).find((c) => (client.fiscal_id && c.fiscal_id === client.fiscal_id) || String(c.name ?? '').trim().toLowerCase() === client.name.trim().toLowerCase())
      if (same) clientId = same.id
      else {
        const created = await call('POST', '/api/v3/clients', { client: Object.fromEntries(Object.entries(client).filter(([, v]) => v != null && v !== '')) })
        clientId = created.json.client?.id
      }
      if (!clientId) throw new Error('InvoiceXpress : identifiant client absent de la réponse')
    }
    const draft = await call('POST', `/api/v3/${IX_DOC_TYPE}`, ixInvoicePayload(inv, clientId))
    externalId = draft.json.invoice?.id
    if (!externalId) throw new Error('InvoiceXpress : identifiant de facture absent de la réponse')
    onStep({ provider: 'invoicexpress', externalId, clientId, state: 'draft' })
  }
  const fin = await call('PUT', `/api/v3/${IX_DOC_TYPE}/${externalId}/change-state.json`, { invoice: { state: 'finalized' } })
  const doc = fin.json.invoice ?? {}
  let pdfUrl = null
  try {
    const pdf = await call('GET', `/api/v3/${IX_DOC_TYPE}/${externalId}/pdf`)
    pdfUrl = pdf.status === 200 ? pdf.json.pdf?.url ?? null : null // 202 : PDF en cours de génération
  } catch { /* la facture est émise ; le PDF se récupère plus tard */ }
  const atcud = doc.atcud && doc.atcud !== 'N/D' ? doc.atcud : null
  return {
    provider: 'invoicexpress', externalId, clientId, state: 'final',
    legalNumber: doc.sequence_number ?? doc.inverted_sequence_number ?? null,
    atcud, pdfUrl: pdfUrl ?? doc.permalink ?? null, permalink: doc.permalink ?? null, pdfPending: !pdfUrl,
    issuedAt: new Date().toISOString(),
    ...(atcud ? {} : { note: 'ATCUD non communiqué par InvoiceXpress : vérifiez que la série est communiquée à l’AT.' }),
  }
}

/* ——— Factur-X (CII, profil EN 16931) ——— */
export const FACTURX_PROFILE = { id: 'urn:cen.eu:en16931:2017', label: 'Factur-X EN 16931 (XML CII)' }
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
const amt = (n) => r2(n).toFixed(2)
const d102 = (d) => isoDay(d).replace(/-/g, '')

/** Vendeur / acheteur selon le modèle, depuis les réglages. Renvoie aussi les champs manquants. */
export function facturxParties(db, inv) {
  const cfg = db.get('settings', 'invoicing') ?? {}
  const agency = db.get('settings', 'agency') ?? {}
  const mand = inv.template === 'mandataire'
  const seller = mand
    ? { name: cfg.agent?.name ?? inv.issuer?.name, siren: cfg.agent?.siren, vatId: cfg.agent?.vatId, address: cfg.agent?.address, postcode: cfg.agent?.postcode, city: cfg.agent?.city }
    : { name: cfg.seller?.name ?? agency.agencyName ?? inv.issuer?.name, siren: cfg.seller?.siren, vatId: cfg.seller?.vatId, address: cfg.seller?.address, postcode: cfg.seller?.postcode, city: cfg.seller?.city }
  const buyer = mand
    ? { name: cfg.network?.name ?? inv.client, siren: cfg.network?.siren, vatId: cfg.network?.vatId, address: cfg.network?.address, postcode: cfg.network?.postcode, city: cfg.network?.city }
    : { name: inv.client }
  const missing = []
  if (!seller.name) missing.push('nom du vendeur')
  if (!/^\d{9}$/.test(String(seller.siren ?? '').replace(/\s/g, ''))) missing.push('SIREN du vendeur (9 chiffres)')
  if (inv.vatRate > 0 && !seller.vatId) missing.push('n° de TVA intracommunautaire du vendeur')
  if (!seller.address || !seller.postcode || !seller.city) missing.push('adresse du vendeur')
  if (!inv.number) missing.push('numéro de facture (validez la facture)')
  if (mand && !/^\d{9}$/.test(String(buyer.siren ?? '').replace(/\s/g, ''))) missing.push('SIREN du réseau / de l’agence facturé(e)')
  return { seller, buyer, missing }
}

function party(tag, p) {
  const siren = String(p.siren ?? '').replace(/\s/g, '')
  return `<ram:${tag}>
        <ram:Name>${esc(p.name)}</ram:Name>${siren ? `
        <ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${esc(siren)}</ram:ID></ram:SpecifiedLegalOrganization>` : ''}
        <ram:PostalTradeAddress>${p.postcode ? `
          <ram:PostcodeCode>${esc(p.postcode)}</ram:PostcodeCode>` : ''}${p.address ? `
          <ram:LineOne>${esc(p.address)}</ram:LineOne>` : ''}${p.city ? `
          <ram:CityName>${esc(p.city)}</ram:CityName>` : ''}
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>${p.vatId ? `
        <ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(p.vatId)}</ram:ID></ram:SpecifiedTaxRegistration>` : tag === 'SellerTradeParty' && siren ? `
        <ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${esc(siren)}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
      </ram:${tag}>`
}

/** XML CrossIndustryInvoice (une ligne : la commission). Lève si HT + TVA ≠ TTC. */
export function buildFacturX(inv, { seller, buyer }) {
  const ht = r2(inv.ht), vat = r2(inv.vat), ttc = r2(inv.ttc)
  if (Math.abs(r2(ht + vat) - ttc) > 0.005) throw new Error(`Montants incohérents : ${amt(ht)} + ${amt(vat)} ≠ ${amt(ttc)}`)
  const exempt = !(inv.vatRate > 0)
  const cat = exempt ? 'E' : 'S'
  const rate = r2((inv.vatRate ?? 0) * 100)
  // Franchise en base : catégorie E + motif en clair (BR-E-10). Code VATEX-FR-FRANCHISE à confirmer, non émis.
  const reason = exempt ? (inv.country === 'PT' ? 'IVA - regime de isenção, art. 53.º do CIVA' : 'TVA non applicable, art. 293 B du CGI') : null
  const issued = inv.validatedAt ?? inv.createdAt
  const notes = (inv.mentions ?? []).filter(Boolean)
  const line = inv.template === 'mandataire' ? 'Commission d’agent commercial' : 'Honoraires de négociation immobilière'
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>${FACTURX_PROFILE.id}</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${esc(inv.number)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">${d102(issued)}</udt:DateTimeString></ram:IssueDateTime>
    <ram:IncludedNote><ram:Content>${esc(inv.object)}</ram:Content></ram:IncludedNote>${notes.map((n) => `
    <ram:IncludedNote><ram:Content>${esc(n)}</ram:Content><ram:SubjectCode>${/pénalit|indemnit/i.test(n) ? 'PMT' : 'REG'}</ram:SubjectCode></ram:IncludedNote>`).join('')}
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument><ram:LineID>1</ram:LineID></ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct><ram:Name>${esc(line)}</ram:Name><ram:Description>${esc(String(inv.object ?? '').slice(0, 300))}</ram:Description></ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement><ram:NetPriceProductTradePrice><ram:ChargeAmount>${amt(ht)}</ram:ChargeAmount></ram:NetPriceProductTradePrice></ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="C62">1</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>${cat}</ram:CategoryCode><ram:RateApplicablePercent>${rate}</ram:RateApplicablePercent></ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>${amt(ht)}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
    <ram:ApplicableHeaderTradeAgreement>
      ${party('SellerTradeParty', seller)}
      ${party('BuyerTradeParty', buyer)}
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery>
      <ram:ActualDeliverySupplyChainEvent><ram:OccurrenceDateTime><udt:DateTimeString format="102">${d102(issued)}</udt:DateTimeString></ram:OccurrenceDateTime></ram:ActualDeliverySupplyChainEvent>
    </ram:ApplicableHeaderTradeDelivery>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${amt(vat)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>${reason ? `
        <ram:ExemptionReason>${esc(reason)}</ram:ExemptionReason>` : ''}
        <ram:BasisAmount>${amt(ht)}</ram:BasisAmount>
        <ram:CategoryCode>${cat}</ram:CategoryCode>${exempt ? '' : `
        <ram:DueDateTypeCode>72</ram:DueDateTypeCode>`}
        <ram:RateApplicablePercent>${rate}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradePaymentTerms><ram:Description>${esc(inv.due)}</ram:Description></ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${amt(ht)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${amt(ht)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${amt(vat)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${amt(ttc)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${amt(ttc)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
`
}

export const FACTURX_NOTE = 'XML Factur-X à joindre via votre plateforme agréée (PA). Jaspe fournit le fichier, pas la transmission : émission électronique obligatoire pour les TPE-PME au 1er septembre 2027 (réception depuis le 1er septembre 2026). Ce n’est pas un PDF/A-3 hybride : joignez le PDF imprimé si votre plateforme le demande.'

/* ——— Actions ——— */
const SETTINGS_KEYS = {
  seller: ['name', 'siren', 'vatId', 'address', 'postcode', 'city', 'nif'],
  agent: ['name', 'siren', 'rsac', 'vatId', 'address', 'postcode', 'city', 'nif', 'vatRegime', 'ptVatRegime'],
  network: ['name', 'siren', 'vatId', 'address', 'postcode', 'city', 'nif'],
}

export function createInvoicing(db, { put, patch, activity, HttpError, fetch = globalThis.fetch, env = globalThis.process?.env ?? {} }) {
  const cfg = () => ixConfig(env)
  const get = (id) => { const inv = db.get('invoices', id); if (!inv) throw new HttpError(404, 'Facture introuvable'); return inv }
  const issued = (inv) => inv.legal?.issuedAt && (inv.legal.provider === 'facturx' || inv.legal.state === 'final')

  const facturx = (inv) => {
    if (inv.legal?.provider === 'facturx' && inv.facturx?.xml) return { xml: inv.facturx.xml, filename: inv.facturx.filename, frozen: true, missing: [] }
    if (inv.country === 'PT') throw new HttpError(409, 'Factur-X : format français. Au Portugal, émettez via InvoiceXpress.')
    if (!inv.number) throw new HttpError(409, 'Validez la facture pour lui attribuer un numéro avant de produire le Factur-X')
    const parties = facturxParties(db, inv)
    return { xml: buildFacturX(inv, parties), filename: `factur-x_${inv.number}.xml`, frozen: false, missing: parties.missing }
  }

  const actions = {
    /** État des connecteurs pour l'écran Factures. Ne renvoie jamais la clé. */
    'invoice.connector': () => {
      const c = cfg()
      return {
        country: db.get('settings', 'agency')?.country === 'PT' ? 'PT' : 'FR',
        invoicexpress: { configured: c.configured, account: c.configured ? c.account : null, note: c.configured ? 'Le compte InvoiceXpress configuré doit être celui de l’émetteur (agence, ou consultant pour le modèle mandataire).' : NOT_CONFIGURED },
        facturx: { profile: FACTURX_PROFILE.label, note: FACTURX_NOTE },
        settings: db.get('settings', 'invoicing') ?? {},
      }
    },
    /** Coordonnées de facturation (vendeur, mandataire, réseau) et régimes de TVA. */
    'invoice.settings': (p = {}) => {
      const cur = db.get('settings', 'invoicing') ?? { id: 'invoicing' }
      const next = { ...cur, id: 'invoicing' }
      for (const [k, keys] of Object.entries(SETTINGS_KEYS)) if (p[k] && typeof p[k] === 'object') {
        next[k] = { ...(cur[k] ?? {}), ...Object.fromEntries(Object.entries(p[k]).filter(([f]) => keys.includes(f)).map(([f, v]) => [f, String(v ?? '').trim().slice(0, 200)])) }
      }
      if (next.agent?.vatRegime && !['franchise', 'assujetti'].includes(next.agent.vatRegime)) throw new HttpError(400, 'Régime FR : franchise ou assujetti')
      if (next.agent?.ptVatRegime && !['isencao53', 'normal'].includes(next.agent.ptVatRegime)) throw new HttpError(400, 'Regime PT : isencao53 ou normal')
      return put('settings', next)
    },
    'invoice.facturx': ({ id }) => { const r = facturx(get(id)); return { xml: r.xml, filename: r.filename, frozen: r.frozen, missing: r.missing, note: FACTURX_NOTE } },
    /** PT : émission InvoiceXpress. FR : Factur-X généré et figé. Une facture émise ne l'est jamais deux fois. */
    'invoice.issue': async ({ id }) => {
      const inv = get(id)
      if (issued(inv)) throw new HttpError(409, `Facture déjà émise${inv.legal.legalNumber ? ` : ${inv.legal.legalNumber}` : ''} — elle ne se ré-émet pas (annulez-la et émettez un avoir chez l’éditeur).`)
      if (inv.status === 'brouillon') throw new HttpError(409, 'Validez la facture (relecture) avant émission')
      if (inv.status === 'annulée') throw new HttpError(409, 'Facture annulée : rien à émettre')
      if (inv.country === 'PT') {
        const c = cfg()
        if (!c.configured) throw new HttpError(409, NOT_CONFIGURED)
        const call = ixClient({ apiKey: c.apiKey, base: c.base, fetch, HttpError })
        const s = db.get('settings', 'invoicing') ?? {}
        const mand = inv.template === 'mandataire'
        const client = { name: String(inv.client ?? '').trim() || 'Consumidor final', fiscal_id: mand ? s.network?.nif : undefined, address: mand ? s.network?.address : undefined, postal_code: mand ? s.network?.postcode : undefined, city: mand ? s.network?.city : undefined, country: 'Portugal', language: 'pt' }
        const legal = await issueWithInvoiceXpress(inv, { call, client, prev: inv.legal ?? {}, onStep: (partial) => patch('invoices', id, { legal: partial }) })
        activity('Claire Delmas', `a émis la facture ${legal.legalNumber ?? inv.number} via InvoiceXpress${legal.atcud ? ` (ATCUD ${legal.atcud})` : ''}`, 'win', '/app/factures')
        return patch('invoices', id, { legal })
      }
      const r = facturx(inv)
      if (r.missing.length) throw new HttpError(409, `Factur-X incomplet : ${r.missing.join(', ')}. Complétez les coordonnées de facturation.`)
      const legal = { provider: 'facturx', format: FACTURX_PROFILE.label, legalNumber: inv.number, filename: r.filename, issuedAt: new Date().toISOString(), transmission: 'à déposer sur votre plateforme agréée (PA)' }
      activity('Claire Delmas', `a figé le Factur-X de la facture ${inv.number}`, 'win', '/app/factures')
      return patch('invoices', id, { legal, facturx: { xml: r.xml, filename: r.filename } })
    },
  }
  return { actions }
}
