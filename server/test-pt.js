// Livrables en portugais européen (pt-PT) quand l’agence exerce au Portugal ou a choisi le portugais.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDocument, qualityCheck, docLang } from './templates.js'

const property = { id: 'p1', title: 'Moradia T4 com vista mar', type: 'Villa', address: 'Rua das Flores 12', district: 'Estoril', city: 'Cascais', surface: 200, rooms: 5, price: 2.85e6, estimateLow: 2.6e6, estimateHigh: 2.9e6, dpe: 'A', features: ['Piscina', 'Jardim'] }
const dossier = { id: 'd1', seller: 'Família Silva', propertyId: 'p1', agentId: 'a1', tags: [], motivation: 'Mudança para Lisboa', timeline: '3 meses', mandate: 'Exclusif' }
const agent = { name: 'Francisca Lopes', role: 'Consultora' }
const ctx = (settings) => ({ dossier, property, agent, buyers: [], settings })
const nf = (n) => n.toLocaleString('pt-PT')

test('langue des livrables : portugais si pays PT ou langue pt, sinon français', () => {
  assert.equal(docLang({ country: 'PT' }), 'pt')
  assert.equal(docLang({ lang: 'pt' }), 'pt')
  assert.equal(docLang({ country: 'FR' }), 'fr')
  assert.equal(docLang(undefined), 'fr')
})

test('L1 en portugais quand le pays est PT', () => {
  const doc = buildDocument('L1', ctx({ country: 'PT', agencyName: 'Agência Cascais' }))
  assert.equal(doc.lang, 'pt')
  assert.equal(doc.title, 'Email de agradecimento')
  assert.match(doc.subject, /^Obrigado pela receção — /)
  assert.equal(doc.body[0], 'Cara família Silva,')
  assert.ok(doc.body.some((l) => /estudo de mercado/.test(l)))
  assert.ok(doc.body.at(-1).includes('Agência Cascais'))
  assert.ok(doc.sources.every((s) => / de \w+ de \d{4}$/.test(s.date)), 'dates au format pt-PT')
  assert.deepEqual(qualityCheck(doc), [])
  assert.doesNotMatch(doc.body.join(' '), /Merci|Madame|conseiller/)
})

test('L7 en portugais, montants formatés pt-PT, chiffres sourcés', () => {
  const doc = buildDocument('L7', ctx({ country: 'PT' }))
  assert.equal(doc.lang, 'pt')
  assert.equal(doc.title, 'Avaliação e estudo de mercado')
  const text = doc.body.join('\n')
  assert.match(text, /2,6 M€ – 2,9 M€/)
  assert.ok(text.includes(`${nf(13000)} a ${nf(14500)} €/m²`), 'prix au m² avec séparateur pt-PT')
  assert.match(text, /Preço de apresentação previsto: 2,85 M€/)
  const price = doc.figures.find((f) => f.label === 'Preço de apresentação')
  assert.equal(price.value, '2,85 M€')
  assert.match(price.source, /Contrato de mediação exclusivo/)
  const area = doc.figures.find((f) => f.label === 'Área')
  assert.equal(area.value, '200 m²')
  assert.equal(area.source, 'Ficha do imóvel')
  const range = doc.figures.find((f) => f.label === 'Intervalo de valor')
  assert.equal(range.verified, false, 'estimation sans comparables datés : non verificada')
  assert.deepEqual(qualityCheck(doc), [])
})

test('montant inférieur au million : « mil € »', () => {
  const doc = buildDocument('L7', { ...ctx({ lang: 'pt' }), property: { ...property, price: 850000, estimateLow: 800000, estimateHigh: 880000 } })
  assert.match(doc.body.join(' '), /800 mil € – 880 mil €/)
})

test('livrable sans gabarit portugais : repli français signalé', () => {
  const doc = buildDocument('L5', ctx({ country: 'PT' }))
  assert.equal(doc.lang, 'fr')
  assert.equal(doc.langFallback, true)
  assert.match(doc.langNote, /português/)
})

test('France : rien ne change', () => {
  const doc = buildDocument('L7', ctx({ country: 'FR' }))
  assert.equal(doc.lang, undefined)
  assert.equal(doc.title, 'Analyse & estimation')
})
