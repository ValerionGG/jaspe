// Lecture d'un compromis (FR) ou d'un CPCV / contrato-promessa (PT) en PDF : dates, conditions suspensives,
// pièces, notaire, prix et dépôt — chaque valeur cite l'extrait exact du contrat qui la justifie.
// Deux modes : Claude Opus 5.5 (palier « auditer », structured outputs) si un client est configuré, sinon règles FR/PT.
// `contract.extract` ne modifie jamais le dossier : le résultat va dans `extractions`. `contract.apply` n'applique
// que les éléments cochés par le conseiller (transaction + tâches de relance J-7).
// Aide à la lecture, pas un avis juridique : le conseiller et le notaire restent seuls juges du contrat.
import Anthropic from '@anthropic-ai/sdk'
import { callCost, TIERS } from './copilot.js'

/* ——— Dates ——— */
const MONTHS = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
  janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, dezembro: 12,
}
const NUMS = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, quinze: 15, vingt: 20, trente: 30, quarante: 40, 'quarante-cinq': 45, soixante: 60, quatrevingt: 80, 'quatre-vingt-dix': 90,
  um: 1, dois: 2, 'três': 3, tres: 3, quatro: 4, cinco: 5, seis: 6, oito: 8, nove: 9, dez: 10, doze: 12, quinze_pt: 15, vinte: 20, trinta: 30, quarenta: 40, sessenta: 60, noventa: 90, cento_e_vinte: 120 }
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const pad = (n) => String(n).padStart(2, '0')
const isoOf = (y, m, d) => {
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? `${y}-${pad(m)}-${pad(d)}` : null
}
export const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const addMonths = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10) }

const MONTH_RX = '(janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[ûu]t|septembre|octobre|novembre|d[ée]cembre|janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|dezembro)'
const DATE_RX = new RegExp(`(\\d{1,2})(?:er|º|\\.º)?\\s+(?:de\\s+)?${MONTH_RX}\\s+(?:de\\s+)?(\\d{4})|(\\d{1,2})[/.](\\d{1,2})[/.](\\d{4})|(\\d{4})-(\\d{2})-(\\d{2})`, 'giu')
/** Toutes les dates absolues d'une phrase, dans l'ordre. */
export function findDates(s) {
  const out = []
  for (const m of s.matchAll(DATE_RX)) {
    let iso = null
    if (m[1]) iso = isoOf(+m[3], MONTHS[fold(m[2])], +m[1])
    else if (m[4]) iso = isoOf(+m[6], +m[5], +m[4])
    else if (m[7]) iso = isoOf(+m[7], +m[8], +m[9])
    if (iso) out.push({ iso, index: m.index, text: m[0] })
  }
  return out
}
const NUM_ALT = Object.keys(NUMS).filter((w) => !w.includes('_')).sort((a, b) => b.length - a.length).join('|')
const REL_RX = new RegExp(String.raw`(?:^|[^\p{L}\d])(\d{1,3}|${NUM_ALT})\s*(?:\(\s*[\p{L}\d\s-]+\s*\)\s*)?(jours?|mois|semaines?|dias?|meses|m[êe]s|semanas?)(?![\p{L}])`, 'iu')
const toNum = (w) => (/^\d+$/.test(w) ? +w : NUMS[fold(w)] ?? NUMS[w.toLowerCase()] ?? null)
/** Délai relatif (« dans un délai de dix jours », « prazo de 15 dias ») : seulement s'il est introduit par un mot de délai. */
function relDelay(s) {
  const m = s.match(REL_RX)
  if (!m) return null
  if (!/d[ée]lai|prazo|\bsous\b|\bdans\b|dentro de|\bat[ée]\b|au plus tard|no m[áa]ximo/i.test(s.slice(Math.max(0, m.index - 60), m.index + 1))) return null
  const n = toNum(m[1])
  if (!n) return null
  const u = fold(m[2])
  return { n, unit: /^mo|^mes/.test(u) ? 'month' : /^sem/.test(u) ? 'week' : 'day', text: m[0].replace(/^[^\p{L}\d]/u, '') }
}

/* ——— Découpage en phrases (la citation = la phrase exacte du texte) ——— */
export function sentences(text) {
  const t = text.replace(/\r/g, '')
  const out = []
  // Coupe sur « . » (sauf dans un nombre 1.250.000 ou après une abréviation M., Me, Dra., art., L.) et sur les sauts de ligne
  // qui ouvrent une nouvelle ligne (majuscule, puce). Un saut au milieu d'une phrase (« au plus tard le⏎15 mars ») est gardé.
  let start = 0
  for (let i = 0; i <= t.length; i++) {
    const ch = t[i], prev = t[i - 1] ?? '', nxt = t[i + 1] ?? ''
    const end = i === t.length
      || (ch === '\n' && (nxt === '\n' || /[\p{Lu}•\-–—*(]/u.test(nxt) || /[.:;!?]/.test(prev)))
      || (ch === '.' && !/\d/.test(nxt) && !/\.$/.test(t.slice(i + 1, i + 2)) && !/(?:^|[\s(])(?:M|Me|Mme|Mmes|MM|Dr|Dra|Sr|Sra|art|n|nº|al|cf|p|L|R|S\.A|Lda|Exmo|Exma)$/i.test(t.slice(Math.max(0, i - 6), i)))
    if (!end) continue
    const raw = t.slice(start, ch === '.' ? i + 1 : i)
    const q = raw.trim()
    if (q) out.push({ q, i: start + raw.indexOf(q) })
    start = i + 1
  }
  return out
}

/* ——— Montants ——— */
const AMOUNT_RX = /(\d{1,3}(?:[   .]\d{3})+|\d+)(?:,(\d{2}))?\s*(?:€|euros?|EUR)/i
const amount = (s) => { const m = s.match(AMOUNT_RX); return m ? { value: Number(m[1].replace(/[   .]/g, '')) + (m[2] ? +m[2] / 100 : 0), text: m[0] } : null }

/* ——— Repères FR / PT ——— */
const KINDS = [
  // k = clé de condition / jalon ; ordre = priorité de classement d'une phrase.
  { k: 'retractation', label: 'Fin du délai de rétractation (SRU)', rx: /r[ée]tractation|L\.?\s?271-1|arrependimento/i },
  { k: 'pret-depot', label: 'Dépôt des demandes de prêt', rx: /(d[ée]poser|d[ée]p[ôo]t)[^.]{0,60}demandes? de pr[êe]t|pedido de (cr[ée]dito|financiamento)/i },
  { k: 'pret', label: 'Condition suspensive de prêt', rx: /pr[êe]t|financement|cr[ée]dito|financiamento|empr[ée]stimo|m[úu]tuo/i },
  { k: 'preemption', label: 'Droit de préemption (DIA)', rx: { test: (q) => /pr[ée]emption|prefer[êe]ncia/i.test(q) || /\bDIA\b/.test(q) } },
  { k: 'urbanisme', label: 'Urbanisme', rx: /urbanisme|urban[íi]stic|licen[çc]a de (utiliza|constru)/i },
  { k: 'depot', label: 'Versement du dépôt de garantie', rx: /d[ée]p[ôo]t de garantie|s[ée]questre|\bsinal\b|refor[çc]o/i },
  { k: 'acte', label: 'Signature de l’acte authentique', rx: /r[ée]it[ée]ration|acte authentique|escritura|contrato definitivo/i },
  { k: 'cles', label: 'Remise des clés', rx: /remise des cl[ée]s|entrega (das chaves|do im[óo]vel)|jouissance/i },
  { k: 'signature', label: 'Signature du compromis', rx: /fait [àa] .{0,40}\ble\b|sign[ée] le|celebrado (em|aos)|feito em|assinado (em|aos)|em .{0,30}, aos|en date du/i },
]
const PT_LABEL = { retractation: 'Fin du délai de rétractation', 'pret-depot': 'Pedido de crédito', pret: 'Condição de financiamento', preemption: 'Direito de preferência', urbanisme: 'Licença / urbanismo', depot: 'Sinal / reforço do sinal', acte: 'Escritura pública', cles: 'Entrega das chaves', signature: 'Assinatura do CPCV' }
const COND_LABEL = { pret: 'Prêt', preemption: 'Préemption (DIA)', urbanisme: 'Urbanisme', vente: 'Vente préalable', servitude: 'Absence de servitude' }
const PIECES = [
  ['Titre de propriété', /titre de propri[ée]t[ée]/i], ['Dossier de diagnostics techniques (DDT)', /diagnostics? techniques?|\bDDT\b/i], ['DPE', /\bDPE\b|performance [ée]nerg[ée]tique/i],
  ['État daté', /(?<!pr[ée]-)[ée]tat dat[ée]/i], ['Pré-état daté', /pr[ée]-[ée]tat dat[ée]/i], ['Règlement de copropriété', /r[èe]glement de copropri[ée]t[ée]/i],
  ['PV des trois dernières AG', /proc[èe]s-verbaux|\bPV\b[^.]{0,20}assembl/i], ['Offre de prêt', /offre de pr[êe]t/i], ['Attestation de financement', /attestation de financement/i],
  ['Note de renseignements d’urbanisme', /note de renseignements d.urbanisme|certificat d.urbanisme/i], ['DAACT / conformité des travaux', /\bDAACT\b|conformit[ée] des travaux/i],
  ['Certidão permanente do registo predial', /certid[ãa]o permanente|registo predial/i], ['Caderneta predial', /caderneta predial/i], ['Licença de utilização', /licen[çc]a de utiliza[çc][ãa]o/i],
  ['Certificado energético', /certificado energ[ée]tico/i], ['Ficha técnica da habitação', /ficha t[ée]cnica/i], ['Declaração de não dívida (condomínio)', /n[ãa]o d[íi]vida/i],
  ['Distrate / cancelamento da hipoteca', /distrate|cancelamento da hipoteca/i],
]
const isPT = (t) => /promitente|contrato-promessa|cpcv|escritura|outorgante|sinal/i.test(t)

/* ——— Extraction par règles ——— */
export function extractByRules(text, { today } = {}) {
  const pt = isPT(text)
  const S = sentences(text)
  const dates = [], conditions = [], pieces = [], parties = [], alertes = []
  let prix = null, depot = null, notaire = null
  const seen = new Set()
  const pushDate = (k, label, date, quote, confidence, extra = {}) => {
    const key = `${k}|${date}`
    if (seen.has(key)) return
    seen.add(key)
    dates.push({ id: `d${dates.length + 1}`, k, label, date, quote, confidence, ...extra })
  }
  const lbl = (k) => (pt ? PT_LABEL[k] : KINDS.find((x) => x.k === k).label)

  // 1) Signature : date absolue dans une phrase de clôture (« Fait à … le », « Feito em … aos »).
  let signDate = null
  // Formule de clôture d'abord (« Fait à … le », « Feito em … aos »), puis toute mention de signature datée.
  for (const rx of [/fait [àa] |feito em|celebrado (em|aos)|, aos \d/i, KINDS.at(-1).rx]) {
    for (const { q } of S) {
      if (!rx.test(q)) continue
      const d = findDates(q)
      if (d.length) { signDate = d.at(-1).iso; pushDate('signature', lbl('signature'), signDate, q, 0.9); break }
    }
    if (signDate) break
  }
  // 2) Dates absolues et délais relatifs, classés par mot-clé.
  for (const { q } of S) {
    const kind = KINDS.slice(0, -1).find((x) => x.rx.test(q))
    if (!kind) continue
    const abs = findDates(q)
    if (abs.length) {
      // Plusieurs dates dans la phrase : la dernière est en général l'échéance (« … signé le X, au plus tard le Y »).
      pushDate(kind.k, lbl(kind.k), abs.at(-1).iso, q, 0.9)
      continue
    }
    const rel = relDelay(q)
    if (rel && signDate && !abs.length) {
      const date = rel.unit === 'month' ? addMonths(signDate, rel.n) : addDays(signDate, rel.unit === 'week' ? rel.n * 7 : rel.n)
      const fromNotif = /premi[èe]re pr[ée]sentation|notification|lendemain|r[ée]ception/i.test(q)
      pushDate(kind.k, lbl(kind.k), date, q, fromNotif ? 0.6 : 0.75, { computed: `${rel.text} à compter du ${signDate}` })
      if (fromNotif) alertes.push({ level: 'warn', text: `${lbl(kind.k)} : délai compté à partir d'une notification, date estimée depuis la signature (${date}) — à confirmer.`, quote: q })
    }
  }
  // 3) Conditions suspensives.
  for (const { q } of S) {
    if (!/conditions?\s+suspensives?|condi[çc][ãa]o\s+(suspensiva|resolutiva)|sous r[ée]serve|condicionad[oa]|sujeit[oa]s?\s+[àa]\s+condi[çc][ãa]o/i.test(q)) continue
    const tags = []
    if (/pr[êe]t|financement|cr[ée]dito|financiamento|empr[ée]stimo/i.test(q)) tags.push('pret')
    if (/pr[ée]emption|prefer[êe]ncia/i.test(q) || /\bDIA\b/.test(q)) tags.push('preemption')
    if (/urbanisme|urban[íi]stic|licen[çc]a/i.test(q)) tags.push('urbanisme')
    if (/vente pr[ée]alable|venda (pr[ée]via|de outro)/i.test(q)) tags.push('vente')
    if (/servitude/i.test(q) && !tags.includes('urbanisme')) tags.push('servitude')
    for (const k of tags) {
      if (conditions.some((c) => c.k === COND_LABEL[k])) continue
      const due = dates.find((d) => d.k === k)?.date ?? findDates(q).at(-1)?.iso ?? null
      conditions.push({ id: `c${conditions.length + 1}`, k: COND_LABEL[k], label: q.length > 140 ? `${q.slice(0, 137)}…` : q, echeance: due, quote: q })
    }
  }
  // 4) Pièces mentionnées.
  for (const [label, rx] of PIECES) {
    const s = S.find(({ q }) => rx.test(q))
    if (s) pieces.push({ id: `p${pieces.length + 1}`, label, quote: s.q })
  }
  // 5) Prix, dépôt / sinal, notaire, parties.
  for (const { q } of S) {
    const a = amount(q)
    if (!prix && a && /\bprix\b|pre[çc]o/i.test(q) && !/d[ée]p[ôo]t de garantie|sinal/i.test(q)) prix = { value: a.value, quote: q }
    if (!depot && a && /d[ée]p[ôo]t de garantie|s[ée]questre|\bsinal\b/i.test(q)) depot = { value: a.value, quote: q }
    if (!notaire) {
      const m = q.match(/\b(?:Ma[îi]tre|Me)\s+([A-ZÉÈ][\p{L}'’-]+(?:\s+[A-ZÉÈ][\p{L}'’-]+)?)[^.;]{0,40}notaire|notaire[^.;]{0,30}\b(?:Ma[îi]tre|Me)\s+([A-ZÉÈ][\p{L}'’-]+(?:\s+[A-ZÉÈ][\p{L}'’-]+)?)|(?:not[áa]ri[oa]|Cart[óo]rio Notarial)[^.;]{0,20}?\b(?:Dr\.?ª?|Dra\.?|Lic\.?ª?)\s+([A-ZÁÉÍÓÚ][\p{L}-]+(?:\s+[A-ZÁÉÍÓÚ][\p{L}-]+)?)|\b(?:Dr\.?ª?|Dra\.?)\s+([A-ZÁÉÍÓÚ][\p{L}-]+(?:\s+[A-ZÁÉÍÓÚ][\p{L}-]+)?)[^.;]{0,30}not[áa]ri[oa]/u)
      if (m) notaire = { name: `${pt ? '' : 'Me '}${m[1] ?? m[2] ?? m[3] ?? m[4]}`.trim(), quote: q }
    }
    const p = q.match(/^(?:LE |LA |LES )?(VENDEURS?|ACQU[ÉE]REURS?|PROMITENTES? VENDEDOR(?:ES|A)?|PROMITENTES? COMPRADOR(?:ES|A)?)\s*[:—–-]\s*(.+)$/i)
    if (p) parties.push({ role: /VEND/i.test(p[1]) ? 'vendeur' : 'acquéreur', name: p[2].replace(/[,.;]\s*$/, '').split(/,\s*(?:n[ée]e?|demeurant|residente|portador|NIF|né le)/i)[0].trim(), quote: q })
  }
  // 6) Contrôles.
  alertes.push(...checks({ dates, conditions, pieces, notaire, pt, today }))
  return { lang: pt ? 'pt' : 'fr', parties, prix, depot, dates, conditions, pieces, notaire, alertes }
}

/** Contrôles communs aux deux modes : incohérences de calendrier, éléments attendus absents. */
function checks({ dates, conditions, notaire, pt, today }) {
  const a = []
  const get = (k) => dates.find((d) => d.k === k)?.date
  const acte = get('acte'), sign = get('signature')
  if (!acte) a.push({ level: 'warn', text: pt ? 'Date limite de l’escritura introuvable dans le contrat.' : 'Date de réitération / acte authentique introuvable.' })
  if (!sign) a.push({ level: 'warn', text: 'Date de signature introuvable : les délais relatifs n’ont pas pu être calculés.' })
  if (!pt && !dates.some((d) => d.k === 'retractation')) a.push({ level: 'info', text: 'Délai de rétractation SRU non repéré : vérifier la notification à l’acquéreur (art. L.271-1 CCH).' })
  if (!conditions.some((c) => /pr[êe]t/i.test(c.k))) a.push({ level: 'info', text: pt ? 'Aucune condition de financement repérée.' : 'Aucune condition suspensive de prêt repérée : vérifier la mention manuscrite de renonciation (art. L.313-42 C. conso).' })
  for (const d of dates) if (acte && d.k !== 'acte' && d.k !== 'cles' && d.date > acte) a.push({ level: 'risk', text: `${d.label} (${d.date}) est postérieure à l’acte (${acte}).`, quote: d.quote })
  for (const c of conditions) if (acte && c.echeance && c.echeance > acte) a.push({ level: 'risk', text: `Condition « ${c.k} » : échéance ${c.echeance} après l’acte (${acte}).`, quote: c.quote })
  if (today) for (const d of dates) if (d.k !== 'signature' && d.date < today) a.push({ level: 'info', text: `${d.label} : échéance du ${d.date} déjà passée.` })
  if (!notaire) a.push({ level: 'info', text: 'Notaire non identifié dans le texte.' })
  for (const d of dates) if (d.confidence < 0.7) a.push({ level: 'warn', text: `${d.label} : confiance faible (${Math.round(d.confidence * 100)} %), à relire.`, quote: d.quote })
  return a
}

/* ——— Mode Claude : schéma de sortie structurée ——— */
const quoted = (props) => ({ type: 'object', additionalProperties: false, required: [...Object.keys(props), 'quote'], properties: { ...props, quote: { type: 'string', description: 'Extrait exact, mot pour mot, du texte du contrat.' } } })
export const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['lang', 'parties', 'prix', 'depot', 'dates', 'conditions', 'pieces', 'notaire', 'alertes'],
  properties: {
    lang: { type: 'string', enum: ['fr', 'pt'] },
    parties: { type: 'array', items: quoted({ role: { type: 'string', enum: ['vendeur', 'acquéreur'] }, name: { type: 'string' } }) },
    prix: { anyOf: [{ type: 'null' }, quoted({ value: { type: 'number' } })] },
    depot: { anyOf: [{ type: 'null' }, quoted({ value: { type: 'number' } })] },
    dates: { type: 'array', items: quoted({ k: { type: 'string', enum: ['signature', 'retractation', 'pret-depot', 'pret', 'preemption', 'urbanisme', 'depot', 'acte', 'cles', 'autre'] }, label: { type: 'string' }, date: { type: 'string', description: 'AAAA-MM-JJ ; délai relatif converti depuis la date de départ indiquée dans le texte.' }, confidence: { type: 'number' } }) },
    conditions: { type: 'array', items: quoted({ k: { type: 'string', description: 'Prêt, Préemption (DIA), Urbanisme, Vente préalable…' }, label: { type: 'string' }, echeance: { anyOf: [{ type: 'string' }, { type: 'null' }] } }) },
    pieces: { type: 'array', items: quoted({ label: { type: 'string' } }) },
    notaire: { anyOf: [{ type: 'null' }, quoted({ name: { type: 'string' } })] },
    alertes: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['level', 'text'], properties: { level: { type: 'string', enum: ['info', 'warn', 'risk'] }, text: { type: 'string' } } } },
  },
}
const SYSTEM = `Tu lis des avant-contrats immobiliers : compromis / promesse de vente (France) et contrato-promessa de compra e venda (CPCV, Portugal).
Extrais uniquement ce qui est écrit. Pour chaque valeur, "quote" est la phrase exacte copiée du texte (même casse, même ponctuation), sans reformulation.
Dates au format AAAA-MM-JJ. Un délai relatif (« dans un délai de 10 jours », « prazo de 30 dias ») est converti depuis la date de départ écrite dans le texte ; confidence ≤ 0,7 si le point de départ est une notification ou n'est pas daté.
N'invente aucune condition, pièce ni date. Signale dans "alertes" les incohérences (échéance après l'acte, condition de prêt absente, délai de rétractation absent, montant de dépôt inhabituel).
Tu aides le conseiller ; tu ne donnes pas d'avis juridique.`

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()
/** Vérifie que chaque citation figure bien dans le texte ; sinon confiance abaissée et alerte. */
function verifyQuotes(r, text) {
  const T = norm(text)
  const miss = []
  const chk = (o, what) => { if (o && o.quote && !T.includes(norm(o.quote))) { miss.push(what); if (typeof o.confidence === 'number') o.confidence = Math.min(o.confidence, 0.4); o.unverified = true } }
  for (const p of r.parties ?? []) chk(p, `partie ${p.name}`)
  chk(r.prix, 'prix'); chk(r.depot, 'dépôt'); chk(r.notaire, 'notaire')
  for (const d of r.dates ?? []) chk(d, d.label)
  for (const c of r.conditions ?? []) chk(c, `condition ${c.k}`)
  for (const p of r.pieces ?? []) chk(p, p.label)
  if (miss.length) r.alertes.push({ level: 'warn', text: `Citation introuvable mot pour mot dans le PDF : ${miss.join(', ')} — à vérifier.` })
  return r
}

/* ——— Lecture du PDF ——— */
export async function pdfText(bytes) {
  const { extractText, getDocumentProxy } = await import('unpdf')
  const pdf = await getDocumentProxy(new Uint8Array(bytes))
  const { text } = await extractText(pdf, { mergePages: true })
  return text
}

export function createContractReader({ db, put, patch, activity, HttpError, client: injected, extractText = pdfText, readFileBytes, today = () => new Date().toISOString().slice(0, 10) }) {
  const client = injected !== undefined ? injected : (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN ? new Anthropic() : null)
  const tier = TIERS.auditer

  async function withClaude(text) {
    const res = await client.beta.messages.create({
      model: tier.model,
      max_tokens: tier.max_tokens,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: tier.effort, format: { type: 'json_schema', schema: SCHEMA } },
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: `Texte extrait du PDF (les sauts de ligne viennent de la mise en page) :\n<contrat>\n${text}\n</contrat>` }],
    })
    const model = res.model ?? tier.model
    const u = res.usage ?? {}
    const cost = callCost(model, u)
    put('aicalls', { at: new Date().toISOString(), tier: 'auditer', model, input: u.input_tokens ?? 0, output: u.output_tokens ?? 0, cacheRead: u.cache_read_input_tokens ?? 0, cacheWrite: u.cache_creation_input_tokens ?? 0, cost: Math.round(cost * 1e6) / 1e6, stop: res.stop_reason, purpose: 'contract.extract' }, { front: true })
    if (res.stop_reason === 'refusal') throw new Error('refusal')
    const raw = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
    const r = JSON.parse(raw)
    r.dates = (r.dates ?? []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date)).map((d, i) => ({ ...d, id: `d${i + 1}` }))
    r.conditions = (r.conditions ?? []).map((c, i) => ({ ...c, id: `c${i + 1}` }))
    r.pieces = (r.pieces ?? []).map((p, i) => ({ ...p, id: `p${i + 1}` }))
    r.alertes = r.alertes ?? []
    return { r: verifyQuotes(r, text), model, cost }
  }

  const actions = {
    /** Lit le PDF déposé au dossier et stocke une proposition d'extraction. N'applique rien. */
    'contract.extract': async ({ dossierId, fileId } = {}) => {
      const file = db.get('files', fileId)
      if (!file) throw new HttpError(404, 'Fichier introuvable')
      if (dossierId && file.dossierId && file.dossierId !== dossierId) throw new HttpError(409, 'Ce fichier appartient à un autre dossier')
      if (file.type && !/pdf/i.test(file.type) && !/\.pdf$/i.test(file.name ?? '')) throw new HttpError(415, 'Un PDF est attendu')
      if (!readFileBytes) throw new HttpError(503, 'Lecture des fichiers non configurée')
      let text
      try { text = await extractText(await readFileBytes(fileId)) } catch { throw new HttpError(422, 'Texte illisible dans ce PDF (scan sans OCR ?)') }
      text = Array.isArray(text) ? text.join('\n') : String(text ?? '')
      if (norm(text).length < 80) throw new HttpError(422, 'PDF sans texte exploitable (scan sans OCR ?) — saisissez les dates à la main')
      let result, mode = 'rules', model, cost = 0, warning
      if (client) {
        try { ({ r: result, model, cost } = await withClaude(text)); mode = 'claude' } catch (e) {
          warning = e?.message === 'refusal' ? 'Lecture refusée par le modèle — mode règles' : e instanceof Anthropic.APIError ? `Erreur API ${e.status} — mode règles` : 'Lecture IA indisponible — mode règles'
        }
      }
      if (!result) result = extractByRules(text, { today: today() })
      else result.alertes.push(...checks({ ...result, pt: result.lang === 'pt', today: today() }).filter((x) => !result.alertes.some((y) => y.text === x.text)))
      if (warning) result.alertes.unshift({ level: 'info', text: warning })
      const doc = put('extractions', { dossierId: dossierId ?? file.dossierId, fileId, fileName: file.name, at: new Date().toISOString(), mode, model, cost, status: 'à valider', chars: text.length, ...result }, { front: true })
      activity?.('Jaspe', `Compromis lu (${mode === 'claude' ? 'Opus' : 'règles'}) : ${result.dates.length} date(s), ${result.conditions.length} condition(s), ${result.pieces.length} pièce(s) — à valider`, 'info', doc.dossierId ? `/app/dossiers/${doc.dossierId}` : undefined)
      return doc
    },

    /** Applique à la transaction du dossier les seuls éléments cochés ; crée les relances J-7. */
    'contract.apply': ({ extractionId, accept = [] } = {}) => {
      const ex = db.get('extractions', extractionId)
      if (!ex) throw new HttpError(404, 'Extraction introuvable')
      const ok = new Set(accept)
      const tx = db.list('transactions').find((t) => t.dossier === ex.dossierId)
      const dossier = db.get('dossiers', ex.dossierId)
      const fd = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
      const dates = ex.dates.filter((d) => ok.has(d.id))
      const conds = ex.conditions.filter((c) => ok.has(c.id))
      const pieces = ex.pieces.filter((p) => ok.has(p.id))
      const now = today()
      const applied = { dates: dates.map((d) => d.id), conditions: conds.map((c) => c.id), pieces: pieces.map((p) => p.id), notaire: ok.has('notaire') && !!ex.notaire, prix: ok.has('prix') && !!ex.prix, depot: ok.has('depot') && !!ex.depot }
      const tasks = []
      let txOut = null
      if (tx) {
        const next = {}
        if (conds.length) {
          const cur = [...(tx.conditions ?? [])]
          for (const c of conds) {
            const i = cur.findIndex((x) => fold(x.k) === fold(c.k))
            const v = { k: c.k, l: c.label, owner: cur[i]?.owner ?? (c.k === 'Prêt' ? 'Acquéreur' : ex.notaire?.name ?? 'Notaire'), due: c.echeance ? fd(c.echeance) : (cur[i]?.due ?? 'à préciser'), dueDate: c.echeance ?? undefined, s: cur[i]?.s ?? (c.echeance && c.echeance < now ? 'en retard' : 'en cours'), source: `Compromis · « ${c.quote.slice(0, 120)} »` }
            if (i >= 0) cur[i] = { ...cur[i], ...v, proof: cur[i].proof }
            else cur.push(v)
          }
          next.conditions = cur
        }
        if (pieces.length) {
          const cur = [...(tx.pieces ?? [])]
          for (const p of pieces) if (!cur.some((x) => fold(x.l) === fold(p.label))) cur.push({ l: p.label, s: 'manquante', from: /pr[êe]t|financement|cr[ée]dito/i.test(p.label) ? 'Acquéreur' : 'Vendeur' })
          next.pieces = cur
        }
        if (dates.length) {
          const cur = [...(tx.milestones ?? [])]
          for (const d of [...dates].sort((a, b) => a.date.localeCompare(b.date))) {
            const i = cur.findIndex((x) => fold(x.l) === fold(d.label))
            const v = { l: d.label, d: fd(d.date), date: d.date, s: d.date < now ? 'done' : 'todo' }
            if (i >= 0) cur[i] = { ...cur[i], ...v }
            else cur.push(v)
          }
          cur.sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
          const firstTodo = cur.findIndex((x) => x.s !== 'done')
          next.milestones = cur.map((x, i) => (x.date ? { ...x, s: i === firstTodo ? 'now' : x.s === 'now' ? 'todo' : x.s } : x))
          const acte = dates.find((d) => d.k === 'acte')
          if (acte) {
            const [y, m, dd] = acte.date.split('-').map(Number)
            next.sign = { ...tx.sign, m: m - 1, d: dd, label: new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) + (tx.sign?.h ? ` · ${pad(tx.sign.h)}:00` : ''), date: acte.date }
          }
        }
        if (applied.notaire) next.notaries = ex.notaire.name
        if (applied.depot) next.deposit = ex.depot.value
        if (applied.prix) next.price = ex.prix.value
        txOut = Object.keys(next).length ? patch('transactions', tx.id, next) : tx
      }
      // Relances J-7 : une par échéance acceptée encore à venir (pas la signature, déjà passée par nature).
      const echeances = [
        ...dates.filter((d) => d.k !== 'signature').map((d) => ({ key: d.id, label: d.label, date: d.date })),
        ...conds.filter((c) => c.echeance && !dates.some((d) => d.date === c.echeance)).map((c) => ({ key: c.id, label: `Condition « ${c.k} »`, date: c.echeance })),
      ]
      for (const e of echeances) {
        if (e.date <= now) continue
        const id = `ctr-${ex.id}-${e.key}`
        if (db.get('tasks', id)) continue
        const remind = addDays(e.date, -7) < now ? now : addDays(e.date, -7)
        tasks.push(put('tasks', { id, title: `Relance J-7 — ${e.label} (échéance ${fd(e.date)})${dossier ? ` · ${dossier.seller}` : ''}`, dossier: ex.dossierId, due: fd(remind), dueDate: remind, deadline: e.date, prio: 'haute', kind: 'relance', ai: true, done: false, source: 'contract.apply' }, { front: true }))
      }
      // Dates clés pour l'étape « Compromis & acte » (le front les enregistre dans le parcours du dossier).
      const pick = (k) => dates.find((d) => d.k === k)?.date
      const closing = Object.fromEntries(Object.entries({ compromisDate: pick('signature'), loanDeadline: pick('pret'), acteDate: pick('acte'), sruEnd: pick('retractation'), notary: applied.notaire ? ex.notaire.name : undefined, deposit: applied.depot ? ex.depot.value : undefined }).filter(([, v]) => v !== undefined))
      patch('extractions', ex.id, { status: 'appliquée', appliedAt: new Date().toISOString(), applied, accepted: [...ok] })
      const n = dates.length + conds.length + pieces.length + ['notaire', 'prix', 'depot'].filter((k) => applied[k]).length
      activity?.('Vous', `Compromis appliqué au dossier : ${n} élément(s) validé(s), ${tasks.length} relance(s) J-7${tx ? '' : ' — aucune transaction ouverte, seules les dates du parcours sont proposées'}`, 'ok', ex.dossierId ? `/app/dossiers/${ex.dossierId}` : undefined)
      return { transaction: txOut, tasks, closing, applied, noTransaction: !tx }
    },
  }
  return { actions, mode: client ? 'claude' : 'rules' }
}
