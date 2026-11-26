// Lecture d'un compromis FR / CPCV PT : règles (≥ 90 % des dates exactes), mode Claude simulé, application sélective.
// Aucun appel réseau : le texte est injecté (`extractText`) et le client Anthropic est factice.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openDb } from './db.js'
import { HttpError } from './engine.js'
import { createContractReader, extractByRules, pdfText } from './contract.js'

const COMPROMIS_FR = `COMPROMIS DE VENTE
ENTRE LES SOUSSIGNÉS
VENDEUR : M. Jean Dupont, né le 3 mars 1960 à Nice, demeurant 12 chemin des Mimosas, 06600 Antibes.
ACQUÉREUR : Mme Sophie Martin, née le 8 juillet 1982 à Lyon, demeurant 4 rue Garibaldi, 69006 Lyon.
Article 1 — Prix
La vente est consentie et acceptée moyennant le prix de 1 250 000 € (un million deux cent cinquante mille euros), payable comptant le jour de l'acte.
Article 2 — Dépôt de garantie
L'acquéreur versera un dépôt de garantie de 62 500 € entre les mains de Maître Claire Faure, notaire à Antibes, séquestre, dans un délai de dix jours à compter de la signature des présentes.
Article 3 — Conditions suspensives
La présente vente est conclue sous la condition suspensive de l'obtention par l'acquéreur d'un ou plusieurs prêts d'un montant maximum de 900 000 € sur 20 ans, au plus tard le 15 mars 2027.
L'acquéreur s'engage à déposer ses demandes de prêt dans un délai de quinze jours à compter de la signature des présentes et à en justifier au notaire.
Elle est également conclue sous la condition suspensive de non-exercice du droit de préemption urbain, dont la renonciation devra être obtenue au plus tard le 10 avril 2027.
Elle est enfin conclue sous la condition suspensive d'obtention d'une note de renseignements d'urbanisme ne révélant aucune servitude grave, au plus tard le 1er avril 2027.
Article 4 — Rétractation
Conformément à l'article L. 271-1 du Code de la construction et de l'habitation, l'acquéreur dispose d'un délai de rétractation de dix jours à compter de la signature des présentes, remises en main propre.
Article 5 — Pièces
Le vendeur remettra au notaire, avant la réitération, le titre de propriété, l'état daté du syndic, le dossier de diagnostics techniques comprenant le DPE, ainsi que les procès-verbaux des trois dernières assemblées générales.
Article 6 — Réitération
La réitération par acte authentique sera reçue par Maître Claire Faure, notaire à Antibes, au plus tard le 30 avril 2027.
Fait à Antibes, le 12 janvier 2027, en trois exemplaires.`

const CPCV_PT = `CONTRATO-PROMESSA DE COMPRA E VENDA
PROMITENTE VENDEDOR: António Manuel Silva, NIF 123456789, residente na Rua das Flores, 10, Lisboa.
PROMITENTE COMPRADORA: Maria João Ferreira, NIF 987654321, residente em Cascais.
Cláusula Primeira
O preço da venda é de 450.000,00 € (quatrocentos e cinquenta mil euros).
Cláusula Segunda
A título de sinal e princípio de pagamento, a promitente compradora entrega nesta data a quantia de 45.000,00 € (quarenta e cinco mil euros), de que se dá quitação.
Até 28 de fevereiro de 2027, a promitente compradora entregará um reforço de sinal de 20.000,00 €.
Cláusula Terceira
O pedido de crédito deverá ser apresentado pela promitente compradora no prazo de 15 dias a contar da assinatura do presente contrato.
O presente contrato fica sujeito à condição de a promitente compradora obter financiamento bancário de 300.000,00 € até 31 de março de 2027.
O promitente vendedor obriga-se a obter a renúncia ao direito de preferência do Município até 15 de abril de 2027.
Cláusula Quarta
O promitente vendedor entregará a certidão permanente do registo predial, a caderneta predial, a licença de utilização e o certificado energético.
Cláusula Quinta
A escritura pública de compra e venda será celebrada no Cartório Notarial da Dra. Ana Costa, em Lisboa, até ao dia 30 de junho de 2027.
Feito em Lisboa, aos 15 de janeiro de 2027, em dois exemplares.`

const EXPECTED_FR = { signature: '2027-01-12', retractation: '2027-01-22', depot: '2027-01-22', 'pret-depot': '2027-01-27', pret: '2027-03-15', preemption: '2027-04-10', urbanisme: '2027-04-01', acte: '2027-04-30' }
const EXPECTED_PT = { signature: '2027-01-15', depot: '2027-02-28', 'pret-depot': '2027-01-30', pret: '2027-03-31', preemption: '2027-04-15', acte: '2027-06-30' }
const accuracy = (r, exp) => Object.entries(exp).filter(([k, d]) => r.dates.some((x) => x.k === k && x.date === d)).length / Object.keys(exp).length

function setup({ text, client = null, today = '2027-01-13' } = {}) {
  const db = openDb(':memory:')
  const put = (c, d, o) => db.put(c, d, o), patch = (c, id, p) => db.patch(c, id, p)
  const log = []
  db.put('dossiers', { id: 'd9', seller: 'M. Dupont', stage: 'compromis', propertyId: 'p1' })
  db.put('transactions', { id: 'tx9', dossier: 'd9', stage: 'compromis', price: 1200000, seller: 'M. Dupont', buyer: 'Mme Martin', notaries: '—', milestones: [{ l: 'Offre acceptée', d: '2 janv.', s: 'done' }], conditions: [], pieces: [], fees: 50000, feePayer: 'acquéreur', split: [], deposit: 0, sign: { m: 0, d: 1, h: 10, label: '—', place: 'Étude' } })
  db.put('files', { id: 'f1', name: 'compromis.pdf', type: 'application/pdf', size: 100, dossierId: 'd9' })
  const reader = createContractReader({ db, put, patch, activity: (...a) => log.push(a), HttpError, client, extractText: async () => text, readFileBytes: async () => new Uint8Array([1]), today: () => today })
  return { db, reader, log }
}

test('règles FR : ≥ 90 % des dates exactes, citations exactes, conditions, pièces, notaire, montants', () => {
  const r = extractByRules(COMPROMIS_FR, { today: '2027-01-13' })
  const acc = accuracy(r, EXPECTED_FR)
  assert.ok(acc >= 0.9, `exactitude FR ${Math.round(acc * 100)} % : ${JSON.stringify(r.dates.map((d) => [d.k, d.date]))}`)
  for (const d of r.dates) assert.ok(COMPROMIS_FR.includes(d.quote), `citation exacte pour ${d.label}`)
  assert.deepEqual(new Set(r.conditions.map((c) => c.k)), new Set(['Prêt', 'Préemption (DIA)', 'Urbanisme']))
  assert.equal(r.conditions.find((c) => c.k === 'Prêt').echeance, '2027-03-15')
  assert.equal(r.prix.value, 1250000)
  assert.equal(r.depot.value, 62500)
  assert.equal(r.notaire.name, 'Me Claire Faure')
  assert.deepEqual(r.parties.map((p) => [p.role, p.name]), [['vendeur', 'M. Jean Dupont'], ['acquéreur', 'Mme Sophie Martin']])
  for (const l of ['Titre de propriété', 'État daté', 'DPE', 'PV des trois dernières AG']) assert.ok(r.pieces.some((p) => p.label === l), l)
  assert.equal(r.lang, 'fr')
})

test('règles PT (CPCV) : ≥ 90 % des dates exactes, sinal, notária, peças', () => {
  const r = extractByRules(CPCV_PT, { today: '2027-01-16' })
  const acc = accuracy(r, EXPECTED_PT)
  assert.ok(acc >= 0.9, `exactitude PT ${Math.round(acc * 100)} % : ${JSON.stringify(r.dates.map((d) => [d.k, d.date]))}`)
  assert.equal(r.lang, 'pt')
  assert.equal(r.prix.value, 450000)
  assert.equal(r.depot.value, 45000)
  assert.equal(r.notaire.name, 'Ana Costa')
  assert.ok(r.conditions.some((c) => c.k === 'Prêt' && c.echeance === '2027-03-31'))
  for (const l of ['Certidão permanente do registo predial', 'Caderneta predial', 'Licença de utilização', 'Certificado energético']) assert.ok(r.pieces.some((p) => p.label === l), l)
  assert.deepEqual(r.parties.map((p) => p.role), ['vendeur', 'acquéreur'])
})

test('taux global sur les deux contrats ≥ 90 % (14 dates attendues)', () => {
  const fr = extractByRules(COMPROMIS_FR), pt = extractByRules(CPCV_PT)
  const ok = accuracy(fr, EXPECTED_FR) * 8 + accuracy(pt, EXPECTED_PT) * 6
  assert.ok(ok / 14 >= 0.9, `${ok}/14`)
})

test('extract : stocké dans « extractions », rien appliqué au dossier', async () => {
  const { db, reader, log } = setup({ text: COMPROMIS_FR })
  const ex = await reader.actions['contract.extract']({ dossierId: 'd9', fileId: 'f1' })
  assert.equal(ex.mode, 'rules')
  assert.equal(db.get('extractions', ex.id).status, 'à valider')
  const tx = db.get('transactions', 'tx9')
  assert.equal(tx.conditions.length, 0)
  assert.equal(tx.milestones.length, 1)
  assert.equal(db.list('tasks').length, 0)
  assert.equal(log.length, 1)
  await assert.rejects(reader.actions['contract.extract']({ dossierId: 'd9', fileId: 'nope' }), (e) => e.status === 404)
})

test('apply : seuls les éléments acceptés, relances J-7', async () => {
  const { db, reader } = setup({ text: COMPROMIS_FR })
  const ex = await reader.actions['contract.extract']({ dossierId: 'd9', fileId: 'f1' })
  const pret = ex.conditions.find((c) => c.k === 'Prêt')
  const acte = ex.dates.find((d) => d.k === 'acte')
  const dpe = ex.pieces.find((p) => p.label === 'DPE')
  const r = reader.actions['contract.apply']({ extractionId: ex.id, accept: [pret.id, acte.id, dpe.id, 'notaire'] })
  const tx = db.get('transactions', 'tx9')
  assert.deepEqual(tx.conditions.map((c) => c.k), ['Prêt'])
  assert.equal(tx.conditions[0].dueDate, '2027-03-15')
  assert.deepEqual(tx.pieces.map((p) => p.l), ['DPE'])
  assert.deepEqual(tx.milestones.map((m) => m.l), ['Offre acceptée', acte.label])
  assert.equal(tx.sign.date, '2027-04-30')
  assert.equal(tx.sign.m, 3)
  assert.equal(tx.sign.d, 30)
  assert.equal(tx.notaries, 'Me Claire Faure')
  assert.equal(tx.deposit, 0, 'dépôt non accepté → inchangé')
  assert.equal(tx.price, 1200000, 'prix non accepté → inchangé')
  const tasks = db.list('tasks')
  assert.equal(tasks.length, 2)
  assert.deepEqual(tasks.map((t) => t.dueDate).sort(), ['2027-03-08', '2027-04-23'])
  assert.deepEqual(r.closing, { acteDate: '2027-04-30', notary: 'Me Claire Faure' })
  assert.equal(db.get('extractions', ex.id).status, 'appliquée')
  // Réappliquer ne duplique pas les relances.
  reader.actions['contract.apply']({ extractionId: ex.id, accept: [pret.id, acte.id] })
  assert.equal(db.list('tasks').length, 2)
  assert.equal(db.get('transactions', 'tx9').conditions.length, 1)
})

test('mode Claude simulé : Opus 5.5, structured output, repli serveur, coût journalisé, citations vérifiées', async () => {
  const sent = []
  const out = {
    lang: 'fr',
    parties: [{ role: 'vendeur', name: 'M. Jean Dupont', quote: 'VENDEUR : M. Jean Dupont, né le 3 mars 1960 à Nice, demeurant 12 chemin des Mimosas, 06600 Antibes.' }],
    prix: { value: 1250000, quote: 'moyennant le prix de 1 250 000 €' },
    depot: { value: 62500, quote: 'un dépôt de garantie de 62 500 €' },
    dates: [
      { k: 'pret', label: 'Condition de prêt', date: '2027-03-15', confidence: 0.95, quote: 'au plus tard le 15 mars 2027' },
      { k: 'acte', label: 'Acte authentique', date: '2027-04-30', confidence: 0.95, quote: 'La réitération par acte authentique sera reçue par Maître Claire Faure, notaire à Antibes, au plus tard le 30 avril 2027.' },
      { k: 'autre', label: 'Inventée', date: '2027-05-01', confidence: 0.9, quote: 'cette phrase n’existe pas dans le contrat' },
    ],
    conditions: [{ k: 'Prêt', label: 'Prêt 900 k€ / 20 ans', echeance: '2027-03-15', quote: 'au plus tard le 15 mars 2027' }],
    pieces: [{ label: 'DPE', quote: 'le DPE' }],
    notaire: { name: 'Me Claire Faure', quote: 'Maître Claire Faure, notaire à Antibes' },
    alertes: [],
  }
  const client = { beta: { messages: { create: async (req) => { sent.push(req); return { model: req.model, stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(out) }], usage: { input_tokens: 6000, output_tokens: 1500, cache_read_input_tokens: 0, cache_creation_input_tokens: 400 } } } } } }
  const { db, reader } = setup({ text: COMPROMIS_FR, client })
  const ex = await reader.actions['contract.extract']({ dossierId: 'd9', fileId: 'f1' })
  const req = sent[0]
  assert.equal(req.model, 'claude-opus-5-5')
  assert.deepEqual(req.betas, ['server-side-fallback-2026-07-01'])
  assert.equal(req.fallbacks, 'default')
  assert.equal(req.output_config.effort, 'medium')
  assert.equal(req.output_config.format.type, 'json_schema')
  assert.equal(req.output_config.format.schema.additionalProperties, false)
  assert.ok(req.output_config.format.schema.properties.dates.items.required.includes('quote'))
  assert.equal(req.temperature, undefined)
  assert.ok(req.messages[0].content.includes('15 mars 2027'))
  assert.equal(ex.mode, 'claude')
  assert.equal(ex.model, 'claude-opus-5-5')
  const calls = db.list('aicalls')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].tier, 'auditer')
  // 6000 × 4 + 1500 × 20 + 400 × 5 = 56 000 → 0,056 $
  assert.equal(calls[0].cost, 0.056)
  assert.equal(ex.cost, calls[0].cost)
  const fake = ex.dates.find((d) => d.label === 'Inventée')
  assert.ok(fake.unverified && fake.confidence <= 0.4, 'citation absente du texte → signalée')
  assert.ok(ex.alertes.some((a) => /Citation introuvable/.test(a.text)))
  assert.equal(db.get('transactions', 'tx9').conditions.length, 0, 'rien appliqué')
})

test('mode Claude : erreur API → repli par règles', async () => {
  const client = { beta: { messages: { create: async () => { throw new Error('réseau') } } } }
  const { reader } = setup({ text: CPCV_PT, client })
  const ex = await reader.actions['contract.extract']({ dossierId: 'd9', fileId: 'f1' })
  assert.equal(ex.mode, 'rules')
  assert.ok(ex.dates.length >= 5)
  assert.ok(ex.alertes[0].text.includes('mode règles'))
})

/** PDF minimal écrit à la main (police standard Helvetica, une page), offsets xref calculés. */
function tinyPdf(lines) {
  const esc = (s) => s.replace(/[\\()]/g, (c) => `\\${c}`)
  const stream = `BT /F1 11 Tf 50 780 Td 14 TL ${lines.map((l) => `(${esc(l)}) Tj T*`).join(' ')} ET`
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ]
  let body = '%PDF-1.4\n'
  const offs = []
  objs.forEach((o, i) => { offs.push(Buffer.byteLength(body, 'latin1')); body += `${i + 1} 0 obj\n${o}\nendobj\n` })
  const xref = Buffer.byteLength(body, 'latin1')
  body += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return new Uint8Array(Buffer.from(body, 'latin1'))
}

test('unpdf : texte extrait d’un vrai PDF, puis lecture par règles', async () => {
  const bytes = tinyPdf([
    'La condition suspensive de pret devra etre realisee au plus tard le 15/03/2027.',
    'La reiteration par acte authentique interviendra au plus tard le 30/04/2027.',
    'Fait a Antibes, le 12/01/2027.',
  ])
  const text = await pdfText(bytes)
  assert.match(text, /15\/03\/2027/)
  const r = extractByRules(text)
  assert.ok(r.dates.some((d) => d.k === 'pret' && d.date === '2027-03-15'), JSON.stringify(r.dates))
  assert.ok(r.dates.some((d) => d.k === 'acte' && d.date === '2027-04-30'))
  assert.ok(r.dates.some((d) => d.k === 'signature' && d.date === '2027-01-12'))
})
