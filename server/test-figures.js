// Chaque chiffre d’un livrable porte sa source ; un chiffre sans source datée est « non vérifié ».
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDocument, qualityCheck, unverifiedFigures } from './templates.js'

const property = { id: 'p1', title: 'Villa vue mer', type: 'Villa', address: '1 ch. des Nielles', district: 'Cap d’Antibes', city: 'Antibes', surface: 200, rooms: 6, price: 3e6, estimateLow: 2.8e6, estimateHigh: 3.1e6, dpe: 'B', features: ['Piscine'] }
const dossier = { id: 'd1', seller: 'Famille Test', propertyId: 'p1', agentId: 'a1', tags: [], motivation: 'Départ', timeline: '3 mois', mandate: 'Exclusif' }
const ctx = (extra = {}) => ({ dossier, property, agent: { name: 'Claire Delmas', role: 'Conseillère' }, ...extra })

test('L7 et D2 listent leurs chiffres avec une source', () => {
  for (const code of ['L7', 'D2']) {
    const doc = buildDocument(code, ctx())
    assert.ok(doc.figures.length >= 3, `${code} : chiffres listés`)
    for (const f of doc.figures) {
      assert.ok(f.label && f.value && f.source, `${code} · ${f.label} : valeur et source`)
      assert.equal(typeof f.verified, 'boolean')
    }
    const price = doc.figures.find((f) => f.label === 'Prix de présentation')
    assert.equal(price.verified, true)
    assert.match(price.source, /Mandat exclusif/)
  }
  const l7 = buildDocument('L7', ctx())
  assert.ok(l7.figures.some((f) => f.label === 'Surface' && f.value === '200 m²' && f.source === 'Fiche du bien'))
})

test('une estimation sans source datée est « non vérifiée » et remonte dans le contrôle', () => {
  const doc = buildDocument('L7', ctx())
  const range = doc.figures.find((f) => f.label === 'Fourchette d’estimation')
  assert.equal(range.verified, false)
  assert.equal(range.date, undefined)
  const n = unverifiedFigures(doc).length
  assert.equal(n, 2, 'fourchette et fourchette au m²')
  assert.deepEqual(qualityCheck(doc), [], 'non bloquant par défaut')
  assert.ok(qualityCheck(doc, { figures: true }).includes('2 chiffres non vérifiés'))
})

test('des comparables datés rendent la fourchette vérifiée', () => {
  const doc = buildDocument('D2', ctx({ comparables: [{ date: '2026-03-12' }, { date: '2026-06-02' }] }))
  assert.equal(unverifiedFigures(doc).length, 0)
  const range = doc.figures.find((f) => f.label === 'Fourchette d’estimation')
  assert.equal(range.verified, true)
  assert.match(range.source, /2 comparable\(s\) DVF/)
  assert.ok(range.date)
  assert.ok(doc.figures.some((f) => f.label === 'Comparables retenus' && f.value === '2'))
  assert.deepEqual(qualityCheck(doc, { figures: true }), [])
})

test('une valeur absente est signalée, jamais inventée', () => {
  const doc = buildDocument('L7', ctx({ property: { ...property, estimateLow: undefined, estimateHigh: undefined } }))
  const range = doc.figures.find((f) => f.label === 'Fourchette d’estimation')
  assert.deepEqual([range.value, range.verified], ['—', false])
  assert.equal(range.source, 'Non renseigné au dossier')
})
