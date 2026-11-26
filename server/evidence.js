// Pack Preuves : grille de risque LCB-FT / BCFT par partie, lien client « pièces et origine des fonds »,
// export de contrôle horodaté (HTML imprimable + JSON avec empreintes SHA-256), récapitulatif trimestriel IMPIC.
// Code pur (aucune API Node) : l'empreinte et l'écriture des fichiers sont injectées (`sha256`, `saveFile`).
// Aide à la conformité, pas un conseil juridique : le conseiller décide et motive ; les règles restent à relire par un juriste.

/* ——— Listes GAFI (données datées et sourcées) ——— */
// État publié par le GAFI à l'issue de la plénière d'octobre 2025. Les plénières suivantes (février, juin, octobre)
// ne sont PAS intégrées : à mettre à jour à chaque publication avant usage en production.
export const FATF = {
  asOf: '2025-10-24',
  source: 'https://www.fatf-gafi.org/en/countries/black-and-grey-lists.html',
  sourceLabel: 'GAFI / FATF — « High-risk jurisdictions subject to a call for action » et « Jurisdictions under increased monitoring »',
  verified: 'à vérifier sur le site du GAFI (dernière plénière non intégrée)',
  call: [
    { code: 'KP', fr: 'Corée du Nord', pt: 'Coreia do Norte', alias: 'cor[ée]e du nord|coreia do norte|north korea' },
    { code: 'IR', fr: 'Iran', pt: 'Irão', alias: 'iran|ir[ãa]o|irã' },
    { code: 'MM', fr: 'Myanmar', pt: 'Myanmar', alias: 'myanmar|birmanie|birm[âa]nia' },
  ],
  grey: [
    { code: 'DZ', fr: 'Algérie', pt: 'Argélia', alias: 'alg[ée]rie|arg[ée]lia|alg[ée]rien' },
    { code: 'AO', fr: 'Angola', pt: 'Angola', alias: 'angola|angolais|angolano' },
    { code: 'BO', fr: 'Bolivie', pt: 'Bolívia', alias: 'bolivie|bol[íi]via' },
    { code: 'BG', fr: 'Bulgarie', pt: 'Bulgária', alias: 'bulgarie|bulg[áa]ria' },
    { code: 'CM', fr: 'Cameroun', pt: 'Camarões', alias: 'cameroun|camar[õo]es' },
    { code: 'CI', fr: 'Côte d’Ivoire', pt: 'Costa do Marfim', alias: 'c[ôo]te d.ivoire|costa do marfim' },
    { code: 'CD', fr: 'République démocratique du Congo', pt: 'República Democrática do Congo', alias: 'r[ée]publique d[ée]mocratique du congo|\\brdc\\b|congo[- ]kinshasa|rep[úu]blica democr[áa]tica do congo' },
    { code: 'HT', fr: 'Haïti', pt: 'Haiti', alias: 'ha[ïi]ti' },
    { code: 'KE', fr: 'Kenya', pt: 'Quénia', alias: 'kenya|qu[ée]nia' },
    { code: 'LA', fr: 'Laos', pt: 'Laos', alias: '\\blaos\\b' },
    { code: 'LB', fr: 'Liban', pt: 'Líbano', alias: 'liban|l[íi]bano' },
    { code: 'MC', fr: 'Monaco', pt: 'Mónaco', alias: 'monaco|m[óo]naco|mon[ée]gasque' },
    { code: 'NA', fr: 'Namibie', pt: 'Namíbia', alias: 'namibie|nam[íi]bia' },
    { code: 'NP', fr: 'Népal', pt: 'Nepal', alias: 'n[ée]pal' },
    { code: 'SS', fr: 'Soudan du Sud', pt: 'Sudão do Sul', alias: 'soudan du sud|sud[ãa]o do sul' },
    { code: 'SY', fr: 'Syrie', pt: 'Síria', alias: 'syrie|s[íi]ria' },
    { code: 'VE', fr: 'Venezuela', pt: 'Venezuela', alias: 'venezuela' },
    { code: 'VN', fr: 'Vietnam', pt: 'Vietname', alias: 'vi[eê]t ?nam' },
    { code: 'VG', fr: 'Îles Vierges britanniques', pt: 'Ilhas Virgens Britânicas', alias: '[îi]les vierges|ilhas virgens|\\bbvi\\b|british virgin' },
    { code: 'YE', fr: 'Yémen', pt: 'Iémen', alias: 'y[ée]men|i[ée]men' },
  ],
}
const COUNTRIES = [...FATF.call.map((c) => ({ ...c, list: 'call' })), ...FATF.grey.map((c) => ({ ...c, list: 'grey' }))]
export const countryRisk = (code) => COUNTRIES.find((c) => c.code === String(code ?? '').toUpperCase()) ?? null

/* ——— Grille de risque ——— */
export const CLIENT_TYPES = {
  pp: { label: 'Personne physique', points: 0 },
  pm: { label: 'Personne morale (SCI, société)', points: 2 },
  offshore: { label: 'Structure offshore, trust ou fiducie', points: 4 },
}
/** Facteurs cochables. `floor` : niveau minimal imposé quel que soit le score. */
export const FACTORS = [
  { id: 'pep', label: 'Personne politiquement exposée (ou proche)', points: 4, floor: 'eleve', law: { FR: 'CMF art. L561-10', PT: 'Lei n.º 83/2017, art. 39.º' } },
  { id: 'cash', label: 'Paiement en espèces, même partiel', points: 4, law: { FR: 'CMF art. L561-10-2 · plafond espèces C. mon. fin. D112-3', PT: 'Lei n.º 83/2017, art. 36.º (a confirmar)' } },
  { id: 'thirdParty', label: 'Paiement par un tiers sans lien évident', points: 3, law: { FR: 'CMF art. L561-6', PT: 'Lei n.º 83/2017, art. 27.º' } },
  { id: 'complex', label: 'Montage complexe, prête-nom, interposition de sociétés', points: 3, law: { FR: 'CMF art. L561-10-2', PT: 'Lei n.º 83/2017, art. 36.º (a confirmar)' } },
  { id: 'priceGap', label: 'Prix incohérent avec le marché (± 20 % de l’estimation)', points: 2, law: { FR: 'Lignes directrices DGCCRF / Tracfin', PT: 'Orientações IMPIC' } },
  { id: 'urgency', label: 'Urgence inhabituelle, pression sur le délai', points: 2, law: { FR: 'Lignes directrices DGCCRF / Tracfin', PT: 'Orientações IMPIC' } },
]
export const LEVELS = { faible: 'Faible', moyen: 'Moyen', eleve: 'Élevé' }
const RANK = { faible: 0, moyen: 1, eleve: 2 }
const maxLevel = (a, b) => (RANK[a] >= RANK[b] ? a : b)
export const VIGILANCE = { faible: 'simplifiée', moyen: 'standard', eleve: 'renforcée' }
export const MEASURES = {
  FR: {
    faible: ['Identifier la partie et vérifier sa pièce d’identité au plus tard à la signature (CMF L561-5)', 'Conserver la copie des pièces 5 ans après la fin de la relation (CMF L561-12)', 'Vigilance simplifiée seulement si le risque faible est justifié (CMF L561-9) ; à défaut, appliquer la vigilance standard'],
    moyen: ['Identifier et vérifier l’identité de la partie et du bénéficiaire effectif (CMF L561-5)', 'Recueillir l’objet de l’opération et documenter l’origine des fonds (CMF L561-5-1, L561-6)', 'Vigilance constante jusqu’à l’acte ; conserver les pièces 5 ans (CMF L561-12)'],
    eleve: ['Mesures standard, plus justificatifs détaillés de l’origine des fonds et du patrimoine (relevés, actes)', 'Examen renforcé de l’opération et validation écrite par le responsable LCB-FT ou la direction (CMF L561-10, L561-10-2)', 'En cas de soupçon persistant : déclaration à Tracfin avant l’acte (CMF L561-15), sans en informer le client (CMF L561-18)'],
  },
  PT: {
    faible: ['Identificar a parte e verificar o documento de identificação (Lei n.º 83/2017, art. 23.º e 24.º)', 'Medidas simplificadas apenas com risco baixo comprovado (art. 35.º, a confirmar)', 'Conservar os documentos durante o prazo legal (art. 51.º)'],
    moyen: ['Identificar a parte e o beneficiário efetivo, com verificação documental (art. 23.º a 32.º)', 'Documentar a natureza da operação e a origem dos fundos', 'Acompanhamento contínuo até à escritura ; conservar os documentos (art. 51.º)'],
    eleve: ['Medidas reforçadas : comprovativos detalhados da origem dos fundos e do património (art. 36.º, a confirmar)', 'Aprovação pela direção ou pelo responsável pelo cumprimento normativo', 'Em caso de suspeita : comunicação ao DCIAP e à UIF (art. 43.º), sem informar o cliente (art. 54.º, a confirmar)'],
  },
}
export const DECISIONS = {
  accepter: 'Accepter la relation (vigilance du niveau)',
  'accepter-renforcee': 'Accepter sous vigilance renforcée',
  suspendre: 'Suspendre en attente de pièces',
  refuser: 'Refuser ou mettre fin à la relation',
  declarer: 'Analyse de soupçon : déclaration à la cellule de renseignement financier',
}
export const PARTIES = { vendeur: 'Vendeur', acquereur: 'Acquéreur' }

/** Calcul pur et explicable : chaque point vient d'un facteur nommé. */
export function scoreRisk(grid) {
  const reasons = []
  const ct = CLIENT_TYPES[grid.clientType?.value] ?? CLIENT_TYPES.pp
  if (ct.points) reasons.push({ id: 'clientType', label: ct.label, points: ct.points })
  let floor = grid.clientType?.value === 'offshore' ? 'moyen' : 'faible'
  for (const [key, what] of [['country', 'Pays de résidence'], ['fundsCountry', 'Origine des fonds']]) {
    const c = countryRisk(grid[key]?.value)
    if (!c) continue
    const call = c.list === 'call'
    reasons.push({ id: key, label: `${what} : ${c.fr} (GAFI ${call ? '« appel à l’action »' : '« surveillance renforcée »'}, ${FATF.asOf})`, points: call ? 5 : 3 })
    if (call) floor = 'eleve'
  }
  for (const f of FACTORS) {
    if (!grid.factors?.[f.id]?.on) continue
    reasons.push({ id: f.id, label: f.label, points: f.points })
    if (f.floor) floor = maxLevel(floor, f.floor)
  }
  const amt = Number(grid.amount ?? 0)
  if (amt >= 3e6) reasons.push({ id: 'amount', label: `Montant ${amt.toLocaleString('fr-FR')} € (≥ 3 M€)`, points: 2 })
  else if (amt >= 1e6) reasons.push({ id: 'amount', label: `Montant ${amt.toLocaleString('fr-FR')} € (≥ 1 M€)`, points: 1 })
  const score = reasons.reduce((n, r) => n + r.points, 0)
  const byScore = score >= 6 ? 'eleve' : score >= 3 ? 'moyen' : 'faible'
  const level = maxLevel(byScore, floor)
  return { score, level, vigilance: VIGILANCE[level], reasons, floored: level !== byScore }
}

/* ——— Signaux du brief et des notes → facteurs suggérés (jamais une décision) ——— */
const SIGNALS = [
  ['cash', /esp[èe]ces|\bcash\b|numer[áa]rio|dinheiro vivo|em dinheiro/i],
  ['thirdParty', /pay[ée]e? par (?:un |une |son |sa )?(?:tiers|ami|parent|soci[ée]t[ée]|cousin|oncle)|tiers payeur|par un tiers|pago por (?:um )?terceiro|por terceiros/i],
  ['complex', /soci[ée]t[ée] [ée]cran|sociedade[- ]ecr[ãa]|pr[êe]te-nom|testa de ferro|montage|\bholding|\btrust\b|fiducie|nominee|cascade de soci/i],
  ['pep', /\bpep\b|\bppe\b|politiquement expos|politicamente expost|\bministre|d[ée]put[ée]|\bministro|deputad[oa]|ambassadeur|embaixador/i],
  ['urgency', /signer vite|tr[èe]s press[ée]|\burgent|au plus vite|sans d[ée]lai|tout de suite|rapidamente|com urg[êe]ncia|urgente|o mais r[áa]pido/i],
  ['priceGap', /au-dessus du prix|bien au-dessus|surpay|sous[- ][ée]valu|prix anormal|acima do pre[çc]o|abaixo do valor/i],
]
const OFFSHORE = /offshore|\bbvi\b|[îi]les vierges|ilhas virgens|panama|seychelles|ca[ïi]man|cayman|delaware|jersey|guernesey|guernsey/i
const COMPANY = /\bsci\b|soci[ée]t[ée]|\bsarl\b|\bsas\b|\blda\b|sociedade|empresa|\bholding/i
const FUNDS_CTX = /fonds|fundos|virement|paiement|pagamento|transfer|provenan|vindos?|venant|origine|origem|compte|conta/i
const RESIDENCE_CTX = /r[ée]sid|nationalit|reside|nacionalidade|vit [àa]|vive em/i
const SELLER_CTX = /vendeur|vendedor|propri[ée]taire|propriet[áa]rio/i
const sentencesOf = (text) => String(text ?? '').split(/(?<=[.!?;\n])\s+|\n+/).map((s) => s.trim()).filter(Boolean)

/** Repère les signaux par partie. Chaque suggestion garde la phrase qui l'a déclenchée. */
export function detectSignals(texts) {
  const out = { vendeur: {}, acquereur: {} }
  for (const s of texts.flatMap(sentencesOf)) {
    const party = SELLER_CTX.test(s) && !/acqu[ée]reur|acheteur|comprador/i.test(s) ? 'vendeur' : 'acquereur'
    const keep = (key, value) => { if (!out[party][key]) out[party][key] = { value, source: s.slice(0, 240) } }
    for (const [id, re] of SIGNALS) if (re.test(s)) keep(id, true)
    if (OFFSHORE.test(s)) keep('clientType', 'offshore')
    else if (COMPANY.test(s)) keep('clientType', 'pm')
    for (const c of COUNTRIES) {
      if (!new RegExp(c.alias, 'i').test(s)) continue
      keep(RESIDENCE_CTX.test(s) && !FUNDS_CTX.test(s) ? 'country' : 'fundsCountry', c.code)
    }
  }
  return out
}

/* ——— Lien client : pièces demandées ——— */
const ITEM_MAP = {
  FR: { vendeur: { id: 'id-vendeur', title: 'titre', pep: 'ppe' }, acquereur: { id: 'id-acquereur', funds: 'fonds', pep: 'ppe' } },
  PT: { vendeur: { id: 'id-vendeur', title: 'caderneta', pep: 'pep' }, acquereur: { id: 'id-comprador', funds: 'fundos', pep: 'pep' } },
}
const PIECES = {
  identite: { slot: 'id', fr: ['Pièce d’identité en cours de validité', 'Carte d’identité ou passeport, recto et verso.'], pt: ['Documento de identificação válido', 'Cartão de cidadão ou passaporte, frente e verso.'] },
  domicile: { slot: 'id', fr: ['Justificatif de domicile de moins de 3 mois', 'Facture d’énergie, avis d’imposition ou attestation d’assurance habitation.'], pt: ['Comprovativo de morada com menos de 3 meses', 'Fatura de serviços, declaração fiscal ou equivalente.'] },
  societe: { slot: 'id', fr: ['Extrait Kbis, statuts et liste des bénéficiaires effectifs', 'Pour une société ou une SCI : documents de moins de 3 mois.'], pt: ['Certidão permanente, estatutos e declaração RCBE', 'Para uma sociedade : beneficiários efetivos registados no RCBE.'] },
  titre: { slot: 'title', fr: ['Titre de propriété ou attestation notariée', 'Le document qui prouve que vous êtes propriétaire du bien.'], pt: ['Caderneta predial e certidão do registo predial', 'Documentos que comprovam a titularidade do imóvel.'] },
  fonds: { slot: 'funds', fr: ['Justificatif de l’origine des fonds', 'Offre ou accord de prêt, relevé d’épargne, acte de vente d’un bien, donation ou succession.'], pt: ['Comprovativo da origem dos fundos', 'Aprovação de crédito, extrato de poupança, escritura de venda de outro imóvel, doação ou herança.'] },
  releves: { slot: 'funds', fr: ['Relevés bancaires des 3 derniers mois (compte d’où partent les fonds)', 'Vous pouvez masquer les opérations sans rapport avec l’achat.'], pt: ['Extratos bancários dos últimos 3 meses (conta de origem dos fundos)', 'Pode ocultar os movimentos sem relação com a compra.'] },
  patrimoine: { slot: 'funds', fr: ['Justificatif de la constitution de l’apport', 'Par exemple : acte de cession, contrat de donation, déclaration de succession.'], pt: ['Comprovativo da constituição do capital próprio', 'Por exemplo : contrato de venda, escritura de doação, habilitação de herdeiros.'] },
}
/** Liste des pièces selon la partie, le type de client et le niveau de vigilance. */
export function piecesFor(country, party, clientType = 'pp', level = 'moyen') {
  const ids = ['identite']
  if (level !== 'faible') ids.push('domicile')
  if (clientType !== 'pp') ids.push('societe')
  if (party === 'vendeur') ids.push('titre')
  if (party === 'acquereur') { ids.push('fonds'); if (level === 'eleve') ids.push('releves', 'patrimoine') }
  const map = ITEM_MAP[country][party]
  return ids.map((id) => ({ id, itemId: map[PIECES[id].slot], fr: PIECES[id].fr, pt: PIECES[id].pt }))
}
export const ORIGINS = {
  pret: ['Prêt immobilier', 'Crédito à habitação'], epargne: ['Épargne personnelle', 'Poupanças pessoais'], vente: ['Vente d’un autre bien', 'Venda de outro imóvel'],
  donation: ['Donation ou succession', 'Doação ou herança'], activite: ['Revenus d’activité ou cession d’entreprise', 'Rendimentos ou venda de empresa'], autre: ['Autre (précisé au conseiller)', 'Outra (indicada ao consultor)'],
}
export const ACCEPTED_TYPES = { 'application/pdf': [0x25, 0x50, 0x44, 0x46], 'image/jpeg': [0xff, 0xd8, 0xff], 'image/png': [0x89, 0x50, 0x4e, 0x47] }
export const MAX_FILE = 10 * 1024 * 1024
export const LINK_DAYS = 14
export const MAX_UPLOADS = 25

/** Texte légal affiché au client (FR / PT). Les références marquées « à confirmer » doivent être relues par un juriste. */
export const LEGAL = {
  fr: {
    title: 'Pourquoi ces documents vous sont demandés',
    body: [
      'En tant qu’agent immobilier, nous sommes soumis aux obligations de lutte contre le blanchiment de capitaux et le financement du terrorisme (articles L561-2 et suivants du Code monétaire et financier).',
      'La loi nous impose d’identifier chaque partie à la vente et de vérifier son identité (art. L561-5), de connaître l’objet de l’opération et l’origine des fonds (art. L561-5-1 et L561-6). Cette demande est la même pour tous nos clients ; elle ne présume rien de votre situation.',
    ],
    privacy: [
      'Finalité : respect de nos obligations légales LCB-FT (base légale : obligation légale, RGPD art. 6.1.c). Les documents sont consultés uniquement par l’agence et, sur demande, par les autorités de contrôle.',
      'Durée de conservation : 5 ans à compter de la fin de notre relation (art. L561-12 du Code monétaire et financier).',
      'Ne transmettez que les documents demandés : aucune donnée de santé, d’opinion ou de religion n’est nécessaire. Vous disposez d’un droit d’accès (art. L561-45 : accès indirect via la CNIL pour certaines données).',
    ],
    declare: 'Je déclare sur l’honneur que les informations et documents transmis sont exacts et que les fonds utilisés ont l’origine indiquée.',
    declareSeller: 'Je déclare sur l’honneur que les informations et documents transmis sont exacts.',
    pep: 'Exercez-vous, ou avez-vous exercé depuis moins d’un an, une fonction politique, juridictionnelle ou administrative importante (ou êtes-vous un proche d’une telle personne) ?',
    review: 'Relu par un juriste : à confirmer',
  },
  pt: {
    title: 'Porque lhe pedimos estes documentos',
    body: [
      'Enquanto mediadora imobiliária, a agência está sujeita às obrigações de prevenção do branqueamento de capitais e do financiamento do terrorismo (Lei n.º 83/2017, de 18 de agosto).',
      'A lei obriga-nos a identificar cada parte na transação e a verificar a sua identidade (art. 23.º e 24.º), bem como a conhecer a natureza da operação e a origem dos fundos. Este pedido é igual para todos os clientes e não pressupõe nada sobre a sua situação.',
    ],
    privacy: [
      'Finalidade : cumprimento das obrigações legais de prevenção do branqueamento (fundamento : obrigação legal, RGPD art. 6.º, n.º 1, al. c)). Os documentos são consultados apenas pela agência e, a pedido, pelas autoridades de supervisão (IMPIC).',
      'Prazo de conservação : 7 anos após o termo da relação de negócio (Lei n.º 83/2017, art. 51.º — prazo a confirmar por um jurista).',
      'Envie apenas os documentos pedidos : não são necessários dados de saúde, opiniões ou religião. Pode exercer os seus direitos de acesso e retificação junto da agência.',
    ],
    declare: 'Declaro sob compromisso de honra que as informações e documentos enviados são verdadeiros e que os fundos utilizados têm a origem indicada.',
    declareSeller: 'Declaro sob compromisso de honra que as informações e documentos enviados são verdadeiros.',
    pep: 'Exerce, ou exerceu há menos de um ano, um cargo político ou público relevante (ou é familiar ou pessoa próxima de alguém nessa situação) ?',
    review: 'Revisto por um jurista : a confirmar',
  },
}

/* ——— Utilitaires purs ——— */
const enc = (s) => new TextEncoder().encode(s)
const b64ToBytes = (b64) => {
  const bin = atob(String(b64).replace(/^data:[^,]*,/, '').replace(/\s+/g, ''))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
const randomToken = () => {
  const b = new Uint8Array(32)
  globalThis.crypto.getRandomValues(b)
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const csvCell = (v) => { const s = String(v ?? ''); return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
/** JSON canonique (clés triées) : l'empreinte d'un export se recalcule à l'identique. */
export const canonical = (v) => (Array.isArray(v) ? `[${v.map(canonical).join(',')}]` : v && typeof v === 'object' ? `{${Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}` : JSON.stringify(v ?? null))

/* ——— Fabrique ——— */
export function createEvidence(db, deps = {}) {
  const { HttpError = class extends Error { constructor(status, m) { super(m); this.status = status } }, sha256, saveFile, evaluate, setCompliance, emit = () => {}, user = 'Claire Delmas' } = deps
  if (typeof sha256 !== 'function') throw new Error('createEvidence : fonction sha256(buffer) requise')
  const nowD = () => (deps.now ? new Date(deps.now()) : new Date())
  const iso = () => nowD().toISOString()
  const hash = async (bytes) => String(await sha256(bytes))
  const put = deps.put ?? ((col, doc, opts) => { const d = db.put(col, doc, opts); emit(col, d.id); return d })
  const patch = deps.patch ?? ((col, id, p) => { const d = db.patch(col, id, p); if (d) emit(col, id); return d })
  const notify = deps.notify ?? ((title, body, tone = 'info', link) => put('notifications', { at: iso(), title, body, tone, link, read: false }, { front: true }))
  const activity = deps.activity ?? ((who, what, tone = 'neutral', link) => put('activity', { t: nowD().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), at: iso(), who, what, tone, link }, { front: true }))

  const country = () => (db.get('settings', 'agency')?.country === 'PT' ? 'PT' : 'FR')
  const ctx = (dossierId) => {
    const dossier = db.get('dossiers', dossierId)
    if (!dossier) throw new HttpError(404, 'Dossier introuvable')
    const tx = db.list('transactions').find((t) => t.dossier === dossierId) ?? null
    const property = db.get('properties', dossier.propertyId) ?? {}
    return { dossier, tx, property, settings: db.get('settings', 'agency') ?? {}, country: country() }
  }
  const partyOf = (p) => { if (!PARTIES[p]) throw new HttpError(400, 'Partie : vendeur ou acquereur'); return p }
  const partyName = (c, party) => (party === 'vendeur' ? c.tx?.seller ?? c.dossier.seller : c.tx?.buyer ?? c.dossier.buyer ?? 'Acquéreur à identifier')

  /** Journal horodaté, en ajout seul : qui, quand, quoi. Partagé avec la checklist (compliance.set). */
  const log = (dossierId, kind, what, extra = {}) => put('cmplog', { dossierId, at: iso(), by: extra.by ?? user, kind, what, ...extra })

  /* ——— Grille de risque ——— */
  const texts = (c) => [
    ...db.list('notes').filter((n) => n.dossierId === c.dossier.id).map((n) => n.text),
    ...(c.dossier.tags ?? []), c.dossier.motivation,
    ...(c.tx?.conditions ?? []).map((x) => `${x.l} ${x.proof ?? ''}`),
  ].filter(Boolean)
  const priceGap = (c) => {
    const price = c.tx?.price, lo = c.property.estimateLow, hi = c.property.estimateHigh
    if (!price || !lo || !hi) return null
    if (price < lo * 0.8) return `Prix ${price.toLocaleString('fr-FR')} € < estimation basse ${lo.toLocaleString('fr-FR')} € − 20 %`
    if (price > hi * 1.2) return `Prix ${price.toLocaleString('fr-FR')} € > estimation haute ${hi.toLocaleString('fr-FR')} € + 20 %`
    return null
  }

  /** Construit ou rafraîchit la grille : les choix du conseiller ne sont jamais écrasés, seules les suggestions bougent. */
  function grid(dossierId, party) {
    const c = ctx(dossierId)
    const id = `risk-${dossierId}-${party}`
    const prev = db.get('risks', id)
    const sig = detectSignals(texts(c))[party]
    const gap = priceGap(c)
    if (gap && !sig.priceGap) sig.priceGap = { value: true, source: gap }
    const keepOrSuggest = (cur, s, empty) => (cur?.by === 'conseiller' ? cur : s ? { value: s.value, suggested: true, source: s.source, by: 'suggestion' } : empty)
    const factors = Object.fromEntries(FACTORS.map((f) => {
      const cur = prev?.factors?.[f.id]
      if (cur?.by === 'conseiller') return [f.id, cur]
      const s = sig[f.id]
      return [f.id, s ? { on: true, suggested: true, source: s.source, by: 'suggestion' } : { on: false }]
    }))
    const g = {
      id, dossierId, party, name: prev?.name ?? partyName(c, party),
      clientType: keepOrSuggest(prev?.clientType, sig.clientType, { value: 'pp' }),
      residence: keepOrSuggest(prev?.residence, sig.country, { value: '' }),
      funds: keepOrSuggest(prev?.funds, sig.fundsCountry, { value: '' }),
      factors, amount: c.tx?.price ?? c.property.price ?? 0,
    }
    const r = scoreRisk({ clientType: g.clientType, country: g.residence, fundsCountry: g.funds, factors, amount: g.amount })
    const decision = prev?.decision ?? null
    const out = {
      ...g, country: c.country, ...r, measures: MEASURES[c.country][r.level], pieces: piecesFor(c.country, party, g.clientType.value, r.level),
      decision, decisionStale: !!decision && decision.level !== r.level,
      suggestions: Object.values(factors).filter((f) => f.suggested).length + [g.clientType, g.residence, g.funds].filter((x) => x.suggested).length,
      updatedAt: prev?.updatedAt ?? iso(),
    }
    const changed = !prev || prev.level !== out.level || prev.score !== out.score || prev.suggestions !== out.suggestions
    if (changed) out.updatedAt = iso()
    put('risks', out)
    if (!prev || prev.level !== out.level) log(dossierId, 'risk', `Grille ${PARTIES[party].toLowerCase()} : niveau ${LEVELS[out.level].toLowerCase()} (score ${out.score})${prev ? ` — était ${LEVELS[prev.level].toLowerCase()}` : ''}`, { party, by: prev ? user : 'Jaspe (calcul)', to: out.level, from: prev?.level })
    return out
  }

  /* ——— Liens client ——— */
  const linkByToken = async (token) => {
    if (!/^[A-Za-z0-9_-]{20,128}$/.test(String(token ?? ''))) throw new HttpError(404, 'Lien inconnu')
    const h = await hash(enc(String(token)))
    const link = db.list('depotlinks').find((l) => l.tokenHash === h)
    if (!link) throw new HttpError(404, 'Lien inconnu')
    if (link.revokedAt) throw new HttpError(410, 'Ce lien a été révoqué par votre conseiller')
    if (Date.parse(link.expiresAt) <= nowD().getTime()) throw new HttpError(410, 'Ce lien a expiré : demandez-en un nouveau à votre conseiller')
    return link
  }
  const publicLink = (l) => { const { tokenHash: _h, ...rest } = l; return rest }
  const proofsOf = (dossierId) => db.list('proofs').filter((p) => p.dossierId === dossierId)

  const refreshChecklist = (dossierId) => { try { evaluate?.(dossierId) } catch { /* checklist indisponible */ } }

  const actions = {
    /** État complet du Pack Preuves pour un dossier (grilles, liens, pièces, journal, exports). */
    'evidence.state': ({ dossierId }) => {
      const c = ctx(dossierId)
      return {
        dossierId, country: c.country, fatf: { asOf: FATF.asOf, source: FATF.source, verified: FATF.verified, call: FATF.call, grey: FATF.grey },
        parties: { vendeur: grid(dossierId, 'vendeur'), acquereur: grid(dossierId, 'acquereur') },
        links: db.list('depotlinks').filter((l) => l.dossierId === dossierId).map(publicLink).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        proofs: proofsOf(dossierId).sort((a, b) => b.at.localeCompare(a.at)),
        log: db.list('cmplog').filter((e) => e.dossierId === dossierId).sort((a, b) => b.at.localeCompare(a.at)),
        exports: db.list('exports').filter((e) => e.dossierId === dossierId).sort((a, b) => b.at.localeCompare(a.at)),
        catalog: { factors: FACTORS, clientTypes: CLIENT_TYPES, decisions: DECISIONS, levels: LEVELS },
      }
    },
    'risk.get': ({ dossierId, party }) => grid(dossierId, partyOf(party)),
    /** Le conseiller confirme ou corrige des facteurs : ils deviennent siens et ne sont plus recalculés. */
    'risk.set': ({ dossierId, party, factors = {}, clientType, residence, funds, name }) => {
      partyOf(party)
      const cur = grid(dossierId, party)
      const at = iso()
      const changes = []
      const nextFactors = { ...cur.factors }
      for (const [k, on] of Object.entries(factors)) {
        if (!FACTORS.some((f) => f.id === k)) throw new HttpError(400, `Facteur inconnu : ${k}`)
        const was = cur.factors[k]
        nextFactors[k] = { on: !!on, by: 'conseiller', at, ...(was?.source ? { source: was.source } : {}) }
        if (!!was?.on !== !!on || was?.suggested) changes.push(`${FACTORS.find((f) => f.id === k).label} : ${on ? 'oui' : 'non'}${was?.suggested ? ` (suggestion ${on ? 'confirmée' : 'écartée'})` : ''}`)
      }
      const sel = (val, prevSel, label, valid) => {
        if (val === undefined) return prevSel
        if (!valid(val)) throw new HttpError(400, `${label} invalide`)
        if (val !== prevSel?.value || prevSel?.suggested) changes.push(`${label} : ${val || '—'}`)
        return { value: val, by: 'conseiller', at }
      }
      const next = {
        ...cur, factors: nextFactors, name: name ?? cur.name,
        clientType: sel(clientType, cur.clientType, 'Type de client', (v) => !!CLIENT_TYPES[v]),
        residence: sel(residence === undefined ? undefined : String(residence).toUpperCase(), cur.residence, 'Pays de résidence', (v) => v === '' || /^[A-Z]{2}$/.test(v)),
        funds: sel(funds === undefined ? undefined : String(funds).toUpperCase(), cur.funds, 'Pays d’origine des fonds', (v) => v === '' || /^[A-Z]{2}$/.test(v)),
      }
      put('risks', { ...next, updatedAt: at })
      if (changes.length) log(dossierId, 'risk', `Grille ${PARTIES[party].toLowerCase()} modifiée — ${changes.join(' · ')}`, { party })
      return grid(dossierId, party)
    },
    /** Décision et justification consignées par le conseiller, liées au niveau au moment de la décision. */
    'risk.decide': ({ dossierId, party, decision, justification, by = user }) => {
      partyOf(party)
      if (!DECISIONS[decision]) throw new HttpError(400, 'Décision inconnue')
      if (String(justification ?? '').trim().length < 10) throw new HttpError(400, 'Justifiez la décision (10 caractères au moins)')
      const g = grid(dossierId, party)
      if (g.level === 'eleve' && decision === 'accepter') throw new HttpError(409, 'Risque élevé : choisissez au moins « Accepter sous vigilance renforcée »')
      const d = { decision, label: DECISIONS[decision], justification: String(justification).trim().slice(0, 2000), by, at: iso(), level: g.level, score: g.score, reasons: g.reasons.map((r) => r.label) }
      put('risks', { ...g, decision: d, decisionStale: false })
      log(dossierId, 'decision', `Décision ${PARTIES[party].toLowerCase()} : ${d.label} (risque ${LEVELS[g.level].toLowerCase()}) — ${d.justification}`, { party, by, to: decision })
      if (decision === 'declarer') notify('Analyse de soupçon à traiter', `${g.name} : décision consignée, déclaration à préparer par le déclarant habilité`, 'warn', '/app/conformite')
      // Les deux parties décidées : l'analyse de risque est consignée (point « tracfin » en France).
      const other = db.get('risks', `risk-${dossierId}-${party === 'vendeur' ? 'acquereur' : 'vendeur'}`)
      if (other?.decision && g.country === 'FR' && setCompliance) {
        try { setCompliance({ dossierId, itemId: 'tracfin', state: 'ok', evidence: `Grille de risque consignée : vendeur ${LEVELS[(party === 'vendeur' ? d : other.decision).level].toLowerCase()}, acquéreur ${LEVELS[(party === 'acquereur' ? d : other.decision).level].toLowerCase()} — ${d.at.slice(0, 10)}` }) } catch { /* checklist indisponible */ }
      }
      activity(by, `a consigné la décision LCB-FT (${PARTIES[party].toLowerCase()}) : ${d.label}`, decision === 'declarer' || decision === 'refuser' ? 'warn' : 'neutral', '/app/conformite')
      return db.get('risks', g.id)
    },

    /** Crée un lien client (jeton aléatoire, seule son empreinte est stockée : le lien n'est montré qu'une fois). */
    'evidence.link.create': async ({ dossierId, party, lang, days = LINK_DAYS }) => {
      partyOf(party)
      const c = ctx(dossierId)
      const g = grid(dossierId, party)
      const token = deps.randomToken ? deps.randomToken() : randomToken()
      const created = nowD()
      const ttl = Math.min(LINK_DAYS, Math.max(1, Number(days) || LINK_DAYS))
      const link = put('depotlinks', {
        dossierId, party, lang: lang === 'pt' || lang === 'fr' ? lang : c.country === 'PT' ? 'pt' : 'fr', tokenHash: await hash(enc(token)), tokenHint: token.slice(-4),
        createdAt: created.toISOString(), expiresAt: new Date(created.getTime() + ttl * 864e5).toISOString(), createdBy: user,
        partyName: g.name, pieces: g.pieces, level: g.level, uses: 0, maxUses: MAX_UPLOADS, declaredAt: null, revokedAt: null,
      })
      log(dossierId, 'link', `Lien « pièces et origine des fonds » créé pour ${PARTIES[party].toLowerCase()} (${g.pieces.length} pièce(s), expire le ${link.expiresAt.slice(0, 10)})`, { party, linkId: link.id })
      return { link: publicLink(link), token, path: `/depot/${token}` }
    },
    'evidence.link.revoke': ({ id }) => {
      const l = db.get('depotlinks', id)
      if (!l) throw new HttpError(404, 'Lien introuvable')
      if (l.revokedAt) return publicLink(l)
      const d = patch('depotlinks', id, { revokedAt: iso(), revokedBy: user })
      log(l.dossierId, 'link', `Lien ${PARTIES[l.party].toLowerCase()} révoqué (…${l.tokenHint})`, { party: l.party, linkId: id })
      return publicLink(d)
    },

    /** Export de contrôle : contenu canonique + empreinte SHA-256 de l'export lui-même. */
    'evidence.export': async ({ dossierId, by = user }) => {
      const c = ctx(dossierId)
      const exportedAt = iso()
      refreshChecklist(dossierId)
      const cmp = db.get('compliance', `cmp-${dossierId}`)
      const parties = ['vendeur', 'acquereur'].map((p) => grid(dossierId, p))
      const content = {
        type: 'dossier-de-vigilance', version: 1, exportedAt, exportedBy: by, country: c.country,
        agency: { name: c.settings.agencyName ?? 'Agence', legal: c.country === 'PT' ? c.settings.ami ?? 'Licença AMI n.º a completar' : c.settings.carte ?? 'Carte professionnelle T n° à compléter' },
        dossier: { id: c.dossier.id, ref: c.dossier.ref, stage: c.dossier.stage, property: { title: c.property.title ?? '', address: c.property.address ?? '', city: c.property.city ?? '' }, price: c.tx?.price ?? c.property.price ?? null },
        fatf: { asOf: FATF.asOf, source: FATF.source },
        parties: parties.map((g) => ({ role: g.party, name: g.name, clientType: g.clientType.value, residence: g.residence.value || null, funds: g.funds.value || null, level: g.level, vigilance: g.vigilance, score: g.score, reasons: g.reasons, measures: g.measures, decision: g.decision, decisionStale: g.decisionStale, pendingSuggestions: g.suggestions })),
        checklist: (cmp?.items ?? []).map((i) => ({ id: i.id, phase: i.phase, label: i.label, law: i.law, state: i.state, evidence: i.evidence || null, by: i.auto ? 'déduit du dossier' : i.by ?? null, updatedAt: i.updatedAt ?? null })),
        proofs: proofsOf(dossierId).sort((a, b) => a.at.localeCompare(b.at)).map((p) => ({ kind: p.kind, party: p.party, itemId: p.itemId, pieceId: p.pieceId ?? null, name: p.name, type: p.type ?? null, size: p.size ?? null, at: p.at, sha256: p.sha256, fileId: p.fileId ?? null, origin: p.origin ?? null, pep: p.pep ?? null })),
        history: db.list('cmplog').filter((e) => e.dossierId === dossierId).sort((a, b) => a.at.localeCompare(b.at)).map((e) => ({ at: e.at, by: e.by, kind: e.kind, what: e.what })),
        links: db.list('depotlinks').filter((l) => l.dossierId === dossierId).map((l) => ({ party: l.party, createdAt: l.createdAt, expiresAt: l.expiresAt, revokedAt: l.revokedAt, declaredAt: l.declaredAt, uses: l.uses, hint: l.tokenHint })),
        mentions: c.country === 'PT'
          ? ['Documento gerado pelo Jaspe a partir dos registos do dossier. Ajuda ao cumprimento, não constitui parecer jurídico.', 'Conservação : Lei n.º 83/2017, art. 51.º (prazo a confirmar por um jurista).', `Listas GAFI em ${FATF.asOf} : verificar a publicação mais recente.`, 'Integridade : SHA-256 do JSON canónico do campo « content ».']
          : ['Document produit par Jaspe à partir des enregistrements du dossier. Aide à la conformité, ne constitue pas un avis juridique.', 'Conservation : 5 ans à compter de la fin de la relation d’affaires (CMF art. L561-12).', `Listes GAFI au ${FATF.asOf} : vérifier la publication la plus récente.`, 'Intégrité : SHA-256 du JSON canonique du champ « content ».'],
      }
      const sha = await hash(enc(canonical(content)))
      const json = { content, sha256: sha, algorithm: 'SHA-256 (JSON canonique, clés triées, UTF-8)' }
      const rec = put('exports', { dossierId, at: exportedAt, by, sha256: sha, proofs: content.proofs.length, events: content.history.length })
      log(dossierId, 'export', `Export de contrôle produit — empreinte ${sha.slice(0, 16)}…`, { by, exportId: rec.id })
      return { json, html: renderHtml(content, sha), sha256: sha, exportId: rec.id, filename: `dossier-vigilance-${c.dossier.ref}-${exportedAt.slice(0, 10)}` }
    },

    /** Portugal : récapitulatif trimestriel IMPIC pré-rempli depuis les dossiers à l'acte du trimestre. */
    'impic.quarter': ({ year, quarter } = {}) => {
      const now = nowD()
      const y = Number(year) || now.getFullYear()
      const q = Number(quarter) || Math.floor(now.getMonth() / 3) + 1
      if (q < 1 || q > 4) throw new HttpError(400, 'Trimestre 1 à 4')
      const from = new Date(y, (q - 1) * 3, 1), to = new Date(y, q * 3, 1)
      const acteDate = (d, tx) => {
        const raw = tx?.acteAt ?? d.acteAt ?? tx?.deedAt
        if (raw) return new Date(raw)
        if (tx?.sign && Number.isInteger(tx.sign.m)) return new Date(y, tx.sign.m, tx.sign.d ?? 1, 12)
        return null
      }
      const rows = []
      for (const d of db.list('dossiers')) {
        const tx = db.list('transactions').find((t) => t.dossier === d.id)
        if (!(d.stage === 'acte' || tx?.stage === 'acte')) continue
        const at = acteDate(d, tx)
        if (!at || at < from || at >= to) continue
        const p = db.get('properties', d.propertyId) ?? {}
        const rs = db.get('risks', `risk-${d.id}-vendeur`), ra = db.get('risks', `risk-${d.id}-acquereur`)
        const cash = !!(rs?.factors?.cash?.on || ra?.factors?.cash?.on)
        const row = {
          periodo: `${y}-T${q}`, dossier: d.ref, data_escritura: `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`,
          tipo_operacao: 'Compra e venda', valor_eur: tx?.price ?? p.price ?? '', meio_pagamento: cash ? 'Numerário (parcial) — a detalhar' : tx?.conditions?.some((x) => /pr[êe]t|cr[ée]dito/i.test(`${x.k} ${x.l}`)) ? 'Transferência + crédito bancário' : '',
          imovel_morada: [p.address, p.city].filter(Boolean).join(', '), imovel_tipo: p.type ?? '', artigo_matricial: p.matrix ?? '', descricao_predial: p.registry ?? '', concelho: p.city ?? '',
          vendedor_nome: tx?.seller ?? d.seller, vendedor_nif: tx?.sellerNif ?? '', vendedor_pais_residencia: rs?.residence?.value ?? '',
          comprador_nome: tx?.buyer ?? '', comprador_nif: tx?.buyerNif ?? '', comprador_pais_residencia: ra?.residence?.value ?? '',
          contrato_mediacao: d.journey?.mandate?.registry ?? '', grau_risco: [rs, ra].filter(Boolean).map((r) => `${r.party === 'vendeur' ? 'V' : 'C'}:${LEVELS[r.level]}`).join(' '),
        }
        row.campos_em_falta = Object.entries(row).filter(([k, v]) => v === '' && k !== 'campos_em_falta').map(([k]) => k).join(', ')
        rows.push(row)
      }
      const cols = IMPIC_FIELDS.map((f) => f.key)
      const csv = '﻿' + [cols.join(';'), ...rows.map((r) => cols.map((k) => csvCell(r[k])).join(';'))].join('\r\n')
      return {
        period: `${y}-T${q}`, from: from.toISOString().slice(0, 10), to: new Date(to.getTime() - 864e5).toISOString().slice(0, 10), rows, fields: IMPIC_FIELDS, csv, filename: `impic-${y}-T${q}.csv`,
        deadline: { date: impicDeadline(y, q).deadlineIso, rule: IMPIC_DEADLINE.rule, status: IMPIC_DEADLINE.status, sources: IMPIC_DEADLINE.sources, reminders: IMPIC_DEADLINE.remindDays.map((j) => `J-${j}`) },
        note: `Campos e formato do anexo B a confirmar com o regulamento e o formulário IMPIC em vigor ; NIF, artigo matricial e descrição predial a completar. Prazo : ${impicDeadline(y, q).deadlineIso} (${IMPIC_DEADLINE.rule.toLowerCase()}, a confirmar junto do IMPIC).`,
      }
    },
  }

  /* ——— Lien public (sans compte) ——— */
  const publicHandlers = {
    read: async (token) => {
      const l = await linkByToken(token)
      const c = ctx(l.dossierId)
      const received = proofsOf(l.dossierId).filter((p) => p.linkId === l.id)
      const lang = l.lang
      return {
        lang, party: l.party, agency: c.settings.agencyName ?? 'Agence', city: c.property.city ?? '', expiresAt: l.expiresAt,
        pieces: l.pieces.map((p) => ({ id: p.id, label: p[lang][0], hint: p[lang][1], received: received.filter((r) => r.pieceId === p.id).map((r) => ({ name: r.name, at: r.at })) })),
        declaration: { done: !!l.declaredAt, at: l.declaredAt, text: l.party === 'acquereur' ? LEGAL[lang].declare : LEGAL[lang].declareSeller, pep: LEGAL[lang].pep, askOrigin: l.party === 'acquereur', origins: Object.entries(ORIGINS).map(([id, v]) => ({ id, label: v[lang === 'pt' ? 1 : 0] })) },
        legal: LEGAL[lang], remaining: Math.max(0, l.maxUses - l.uses), maxFileMb: MAX_FILE / 1024 / 1024, accept: Object.keys(ACCEPTED_TYPES),
      }
    },
    /** payload : { pieceId, name, type, data (base64) } */
    upload: async (token, { pieceId, name, type, data } = {}) => {
      const l = await linkByToken(token)
      const piece = l.pieces.find((p) => p.id === pieceId)
      if (!piece) throw new HttpError(400, 'Pièce inconnue')
      if (l.uses >= l.maxUses) throw new HttpError(429, 'Nombre maximal de dépôts atteint pour ce lien')
      if (!ACCEPTED_TYPES[type]) throw new HttpError(415, 'Formats acceptés : PDF, JPG, PNG')
      if (!data) throw new HttpError(400, 'Fichier vide')
      let bytes
      try { bytes = b64ToBytes(data) } catch { throw new HttpError(400, 'Fichier illisible') }
      if (!bytes.length) throw new HttpError(400, 'Fichier vide')
      if (bytes.length > MAX_FILE) throw new HttpError(413, 'Fichier trop volumineux (10 Mo maximum)')
      if (!ACCEPTED_TYPES[type].every((b, i) => bytes[i] === b)) throw new HttpError(415, 'Le contenu du fichier ne correspond pas à son format (PDF, JPG ou PNG)')
      const sha = await hash(bytes)
      const at = iso()
      const fileId = `f_${(deps.randomToken ? deps.randomToken() : randomToken()).replace(/[-_]/g, '').slice(0, 10)}`
      if (saveFile) await saveFile(fileId, bytes)
      const safeName = String(name ?? 'document').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 120) || 'document'
      put('files', { id: fileId, name: safeName, type, size: bytes.length, dossierId: l.dossierId, at, sha256: sha, source: 'lien client', linkId: l.id }, { front: true })
      const proof = put('proofs', { dossierId: l.dossierId, linkId: l.id, party: l.party, kind: 'file', pieceId, itemId: piece.itemId, fileId, name: safeName, type, size: bytes.length, sha256: sha, at, by: `Client (${PARTIES[l.party].toLowerCase()})` })
      patch('depotlinks', l.id, { uses: l.uses + 1, lastUseAt: at })
      log(l.dossierId, 'depot', `Pièce reçue (${PARTIES[l.party].toLowerCase()}) : ${piece.fr[0]} — ${safeName}, ${Math.max(1, Math.round(bytes.length / 1024))} Ko, SHA-256 ${sha.slice(0, 16)}… → point « ${piece.itemId} »`, { by: `Client (${PARTIES[l.party].toLowerCase()})`, itemId: piece.itemId, proofId: proof.id })
      const d = db.get('dossiers', l.dossierId)
      notify('Pièce reçue par lien client', `${l.partyName ?? PARTIES[l.party]} — ${piece.fr[0]} (${d?.seller ?? l.dossierId})`, 'info', '/app/conformite')
      refreshChecklist(l.dossierId)
      return { ok: true, file: { name: safeName, size: bytes.length, at }, remaining: Math.max(0, l.maxUses - l.uses - 1) }
    },
    /** payload : { accepted: true, pep: 'oui' | 'non', origin? } — la déclaration n'est faite qu'une fois. */
    declare: async (token, { accepted, pep, origin } = {}) => {
      const l = await linkByToken(token)
      if (l.declaredAt) throw new HttpError(409, 'Déclaration déjà enregistrée')
      if (accepted !== true) throw new HttpError(400, 'Cochez la déclaration pour la valider')
      if (!['oui', 'non'].includes(pep)) throw new HttpError(400, 'Répondez à la question sur les fonctions exposées')
      if (l.party === 'acquereur' && !ORIGINS[origin]) throw new HttpError(400, 'Indiquez l’origine principale des fonds')
      const at = iso()
      const text = l.party === 'acquereur' ? LEGAL[l.lang].declare : LEGAL[l.lang].declareSeller
      const body = { linkId: l.id, party: l.party, text, pep, origin: origin ?? null, at }
      const sha = await hash(enc(canonical(body)))
      const map = ITEM_MAP[db.get('settings', 'agency')?.country === 'PT' ? 'PT' : 'FR'][l.party]
      const by = `Client (${PARTIES[l.party].toLowerCase()})`
      if (l.party === 'acquereur') put('proofs', { dossierId: l.dossierId, linkId: l.id, party: l.party, kind: 'declaration', itemId: map.funds, name: `Déclaration d’origine des fonds : ${ORIGINS[origin][0]}`, origin, at, sha256: sha, by, text })
      put('proofs', { dossierId: l.dossierId, linkId: l.id, party: l.party, kind: 'declaration', itemId: map.pep, name: `Déclaration PPE : ${pep}`, pep, at, sha256: sha, by, text })
      patch('depotlinks', l.id, { declaredAt: at })
      log(l.dossierId, 'declaration', `Déclaration sur l’honneur signée par le ${PARTIES[l.party].toLowerCase()} (PPE : ${pep}${origin ? `, fonds : ${ORIGINS[origin][0]}` : ''}) — SHA-256 ${sha.slice(0, 16)}…`, { by })
      if (pep === 'oui') notify('PPE déclarée par le client', `${l.partyName ?? PARTIES[l.party]} : vigilance renforcée à appliquer`, 'warn', '/app/conformite')
      else notify('Déclaration client reçue', `${l.partyName ?? PARTIES[l.party]} a signé la déclaration`, 'info', '/app/conformite')
      refreshChecklist(l.dossierId)
      return { ok: true, at }
    },
  }

  /* ——— Routine : expiration des liens, rappel IMPIC ——— */
  const rules = {
    'AUT-123': () => {
      const now = nowD()
      let n = 0
      for (const l of db.list('depotlinks')) {
        if (l.revokedAt || l.expiredLogged || Date.parse(l.expiresAt) > now.getTime()) continue
        patch('depotlinks', l.id, { expiredLogged: true })
        log(l.dossierId, 'link', `Lien ${PARTIES[l.party].toLowerCase()} expiré (…${l.tokenHint})`, { by: 'Jaspe (routine)' }); n++
      }
      if (country() === 'PT') {
        // Le trimestre écoulé se déclare au plus tard à la fin du trimestre en cours (IMPIC_DEADLINE, « a confirmar »).
        const cq = Math.floor(now.getMonth() / 3) + 1
        const ref = impicDeadline(cq === 1 ? now.getFullYear() - 1 : now.getFullYear(), cq === 1 ? 4 : cq - 1)
        const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const days = Math.round((ref.deadline - day0) / 864e5)
        const [jFar, jNear] = IMPIC_DEADLINE.remindDays // 15, 3
        // Une seule notification par palier : J-15 dans la fenêtre ]3 ; 15], J-3 dans [0 ; 3].
        const j = days < 0 ? null : days <= jNear ? jNear : days <= jFar ? jFar : null
        const key = j && `n-impic-${ref.deadlineIso}-j${j}`
        if (key && !db.get('notifications', key)) {
          put('notifications', { id: key, at: iso(), title: `Reporte trimestral IMPIC — ${ref.period} (J-${j})`, body: `Prazo em ${days} dia(s), ${ref.deadlineIso} (${IMPIC_DEADLINE.status}) : exporte o anexo B pré-preenchido (Conformidade › IMPIC)`, tone: 'warn', read: false, link: '/app/conformite' }, { front: true }); n++
        }
      }
      return [n ? 'ok' : 'skip', n ? `${n} événement(s) Pack Preuves` : 'Aucun lien expiré, aucun rappel IMPIC']
    },
  }
  if (!db.get('routines', 'AUT-123')) db.put('routines', { id: 'AUT-123', family: 'Conformité', name: 'Pack Preuves : liens client et rappel IMPIC', trigger: 'Chaque minute', conditions: 'Lien expiré ; agence au Portugal à J-15 et J-3 du reporte (fin du trimestre suivant, a confirmar)', action: 'Consigner l’expiration ; rappeler l’export anexo B', autonomy: 'A', success: 'Journal complet, reporte à temps', fallback: 'Alerte manager', phase: 'P0', enabled: true })

  return { actions, rules, publicHandlers }
}

/**
 * Échéance du reporte trimestral IMPIC (transactions immobilières, Lei n.º 83/2017 modifiée par la Lei n.º 58/2020 : périodicité trimestrielle).
 * Règle retenue : fin du trimestre qui suit le trimestre de référence (délai de 3 mois ; ex. T4 2022 → 31/03/2023).
 * NON vérifiée sur le texte du Regulamento IMPIC n.º 603/2021 (art. sur les prazos) : sources secondaires seulement → « a confirmar ».
 */
export const IMPIC_DEADLINE = {
  rule: 'Até ao fim do trimestre seguinte ao trimestre de referência',
  status: 'a confirmar',
  remindDays: [15, 3],
  sources: [
    'https://www.plmj.com/xms/files/03_Novidades_legislativas/2020/09_setembro/NI_Change_in_the_frequency_of_mandatory_communications_to_the_IMPIC.pdf',
    'https://www.imovirtual.com/noticias/imobiliario/imobiliarias-obrigadas-comunicar-transacoes-impic',
    'https://imojuris.vidaimobiliaria.com/actualidade/noticias/Reporte-de-transacoes-imobiliarias-ao-IMPIC-I-P-pa/',
  ],
  verifyAt: 'https://www.impic.pt · Regulamento n.º 603/2021 (Diário da República, 2.ª série, 2 de julho de 2021)',
}
export const impicDeadline = (year, quarter) => {
  const deadline = new Date(year, quarter * 3 + 3, 0) // dernier jour du trimestre suivant
  const deadlineIso = `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, '0')}-${String(deadline.getDate()).padStart(2, '0')}`
  return { period: `${year}-T${quarter}`, deadline, deadlineIso, rule: IMPIC_DEADLINE.rule, status: IMPIC_DEADLINE.status }
}

export const IMPIC_FIELDS = [
  { key: 'periodo', label: 'Período (trimestre)' }, { key: 'dossier', label: 'Referência interna' }, { key: 'data_escritura', label: 'Data da escritura' },
  { key: 'tipo_operacao', label: 'Tipo de operação' }, { key: 'valor_eur', label: 'Valor (EUR)' }, { key: 'meio_pagamento', label: 'Meio de pagamento', confirm: true },
  { key: 'imovel_morada', label: 'Morada do imóvel' }, { key: 'imovel_tipo', label: 'Tipo de imóvel' }, { key: 'artigo_matricial', label: 'Artigo matricial', confirm: true }, { key: 'descricao_predial', label: 'Descrição predial', confirm: true }, { key: 'concelho', label: 'Concelho' },
  { key: 'vendedor_nome', label: 'Vendedor — nome' }, { key: 'vendedor_nif', label: 'Vendedor — NIF', confirm: true }, { key: 'vendedor_pais_residencia', label: 'Vendedor — país de residência', confirm: true },
  { key: 'comprador_nome', label: 'Comprador — nome' }, { key: 'comprador_nif', label: 'Comprador — NIF', confirm: true }, { key: 'comprador_pais_residencia', label: 'Comprador — país de residência', confirm: true },
  { key: 'contrato_mediacao', label: 'Contrato de mediação n.º' }, { key: 'grau_risco', label: 'Grau de risco (interno)', confirm: true }, { key: 'campos_em_falta', label: 'Campos em falta' },
]

/* ——— Rendu imprimable ——— */
const STATE_FR = { ok: 'Conforme', todo: 'À faire', blocked: 'Bloquant', na: 'Non applicable' }
function renderHtml(c, sha) {
  const pt = c.country === 'PT'
  const T = pt
    ? { title: 'Dossier de vigilância BCFT', parties: 'Partes e grelha de risco', checklist: 'Lista de controlo', proofs: 'Documentos recebidos', history: 'Histórico', mentions: 'Menções', level: 'Risco', decision: 'Decisão', none: 'Nenhum', exported: 'Exportado em', by: 'por', hash: 'Impressão digital SHA-256 do export' }
    : { title: 'Dossier de vigilance LCB-FT', parties: 'Parties et grille de risque', checklist: 'Points de contrôle', proofs: 'Pièces reçues', history: 'Historique horodaté', mentions: 'Mentions', level: 'Risque', decision: 'Décision', none: 'Aucune', exported: 'Exporté le', by: 'par', hash: 'Empreinte SHA-256 de l’export' }
  const dt = (s) => (s ? new Date(s).toLocaleString(pt ? 'pt-PT' : 'fr-FR', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'UTC' }) + ' UTC' : '—')
  const parties = c.parties.map((p) => `<section class="party"><h3>${esc(PARTIES[p.role])} — ${esc(p.name)}</h3>
    <p><b>${T.level} : ${esc(LEVELS[p.level])}</b> (score ${p.score}) · vigilance ${esc(p.vigilance)} · ${esc(CLIENT_TYPES[p.clientType]?.label ?? '')}${p.residence ? ` · résidence ${esc(p.residence)}` : ''}${p.funds ? ` · fonds ${esc(p.funds)}` : ''}</p>
    <ul>${p.reasons.map((r) => `<li>${esc(r.label)} <span class="m">+${r.points}</span></li>`).join('') || `<li>${T.none}</li>`}</ul>
    <p class="m">Mesures : ${p.measures.map(esc).join(' ; ')}</p>
    <p>${T.decision} : ${p.decision ? `<b>${esc(p.decision.label)}</b> — ${esc(p.decision.justification)} <span class="m">(${esc(p.decision.by)}, ${dt(p.decision.at)}, risque ${esc(LEVELS[p.decision.level])})</span>${p.decisionStale ? ' <b class="warn">Niveau modifié depuis la décision</b>' : ''}` : '<b class="warn">non consignée</b>'}</p></section>`).join('')
  const rows = (arr, cols) => arr.length ? `<table><tbody>${arr.map((x) => `<tr>${cols.map((f) => `<td>${f(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : `<p class="m">${T.none}</p>`
  return `<!doctype html><html lang="${pt ? 'pt-PT' : 'fr'}"><head><meta charset="utf-8"><title>${esc(T.title)} — ${esc(c.dossier.ref)}</title>
<style>body{font:12px/1.45 system-ui,-apple-system,Segoe UI,sans-serif;color:#111;margin:24px;max-width:960px}h1{font-size:19px;margin:0}h2{font-size:14px;border-bottom:1px solid #999;padding-bottom:3px;margin-top:22px}h3{font-size:13px;margin:10px 0 4px}
table{border-collapse:collapse;width:100%}td{border-bottom:1px solid #ddd;padding:3px 5px;vertical-align:top}.m{color:#555}.warn{color:#a00}.hash{font-family:ui-monospace,Consolas,monospace;word-break:break-all}.party{page-break-inside:avoid}
header{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #111;padding-bottom:8px}@media print{body{margin:10mm}a{color:inherit}}</style></head><body>
<header><div><h1>${esc(T.title)}</h1><div>${esc(c.agency.name)} · ${esc(c.agency.legal)}</div></div><div style="text-align:right">${esc(c.dossier.ref)}<br>${esc(c.dossier.property.title)}${c.dossier.property.city ? `, ${esc(c.dossier.property.city)}` : ''}<br>${c.dossier.price ? `${Number(c.dossier.price).toLocaleString('fr-FR')} €` : ''}</div></header>
<p class="m">${T.exported} ${dt(c.exportedAt)} ${T.by} ${esc(c.exportedBy)} · GAFI ${esc(c.fatf.asOf)}</p>
<h2>${T.parties}</h2>${parties}
<h2>${T.checklist}</h2>${rows(c.checklist, [(i) => esc(STATE_FR[i.state] ?? i.state), (i) => `${esc(i.label)}<div class="m">${esc(i.law)}</div>`, (i) => `${esc(i.evidence ?? '')}<div class="m">${esc(i.by ?? '')}${i.updatedAt ? `, ${dt(i.updatedAt)}` : ''}</div>`])}
<h2>${T.proofs}</h2>${rows(c.proofs, [(p) => dt(p.at), (p) => `${esc(p.name)}<div class="m">${esc(PARTIES[p.party] ?? '')} → ${esc(p.itemId)}${p.size ? ` · ${Math.max(1, Math.round(p.size / 1024))} Ko` : ''}</div>`, (p) => `<span class="hash">${esc(p.sha256)}</span>`])}
<h2>${T.history}</h2>${rows(c.history, [(e) => dt(e.at), (e) => esc(e.by), (e) => esc(e.what)])}
<h2>${T.mentions}</h2><ul>${c.mentions.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
<p><b>${T.hash}</b><br><span class="hash">${esc(sha)}</span></p></body></html>`
}
