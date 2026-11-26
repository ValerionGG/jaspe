// Routage multi-modèles et journal du coût, avec un client factice (aucun appel réseau).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { openDb } from './db.js'
import { createCopilot, routeQuestion, callCost } from './copilot.js'

test('routage : lire → Haiku, rédiger → Sonnet, auditer → Opus ; coût journalisé', async () => {
  assert.equal(routeQuestion('Quelles sont mes priorités ?'), 'lire')
  assert.equal(routeQuestion('Rédige un mail au vendeur Martin'), 'rediger')
  assert.equal(routeQuestion('Audite ce compromis, clause par clause'), 'auditer')
  // 1 000 tokens d’entrée + 500 en sortie sur Sonnet 5.5 : 0,002 + 0,005 = 0,007 $
  assert.equal(Math.round(callCost('claude-sonnet-5-5', { input_tokens: 1000, output_tokens: 500 }) * 1e6) / 1e6, 0.007)

  const sent = []
  const client = { beta: { messages: { create: async (req) => { sent.push(req); return { model: req.model, stop_reason: 'end_turn', content: [{ type: 'text', text: 'ok' }], usage: { input_tokens: 2000, output_tokens: 100, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 } } } } } }
  const db = openDb(':memory:')
  const cp = createCopilot(db, { client })
  const r1 = await cp.ask('Quelles sont mes priorités ?')
  const r2 = await cp.ask('Audite le compromis Dubreuil')
  assert.equal(sent[0].model, 'claude-haiku-5-5')
  assert.equal(sent[0].fallbacks, undefined, 'pas de repli serveur sur Haiku')
  assert.equal(sent[1].model, 'claude-opus-5-5')
  assert.equal(sent[1].fallbacks, 'default')
  assert.equal(sent[0].system[0].cache_control.type, 'ephemeral')
  assert.equal(r1.tier, 'lire')
  assert.equal(r2.tier, 'auditer')
  const calls = db.list('aicalls')
  assert.equal(calls.length, 2)
  assert.ok(calls.every((c) => c.cost > 0))
})
