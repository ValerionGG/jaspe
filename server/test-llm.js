// OpenRouter comme moteur d’IA : choix du fournisseur, traduction de l’appel, erreurs, copilote branché dessus.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLlmClient, createOpenRouterClient, openRouterModel, providerOf, apiStatus } from './llm.js'
import { createCopilot } from './copilot.js'
import { openDb } from './db.js'

test('choix du fournisseur : Anthropic d’abord, puis OpenRouter, sinon mode règles', () => {
  assert.equal(createLlmClient({}), null)
  assert.equal(providerOf(createLlmClient({ OPENROUTER_API_KEY: 'sk-or-test' })), 'openrouter')
  assert.equal(providerOf(createLlmClient({ ANTHROPIC_API_KEY: 'sk-ant-test', OPENROUTER_API_KEY: 'sk-or-test' })), 'anthropic')
  assert.equal(openRouterModel('claude-sonnet-5-5', {}), 'anthropic/claude-sonnet-5.5')
  assert.equal(openRouterModel('claude-opus-5-5', { OPENROUTER_MODEL: 'openai/gpt-5' }), 'openai/gpt-5')
})

test('OpenRouter : requête au format OpenAI, réponse au format Claude', async () => {
  let sent
  const fetch = async (url, init) => {
    sent = { url, init, body: JSON.parse(init.body) }
    return { ok: true, status: 200, json: async () => ({ model: 'anthropic/claude-sonnet-5.5', choices: [{ finish_reason: 'stop', message: { content: '{"ok":true}' } }], usage: { prompt_tokens: 120, completion_tokens: 8, cost: 0.0004 } }) }
  }
  const c = createOpenRouterClient({ apiKey: 'sk-or-test', env: { JASPE_PUBLIC_URL: 'https://jaspe.test' }, fetch })
  const res = await c.beta.messages.create({ model: 'claude-sonnet-5-5', max_tokens: 100, system: [{ type: 'text', text: 'Tu es Jaspe.' }], output_config: { format: { type: 'json_schema', schema: { type: 'object' } } }, messages: [{ role: 'user', content: 'Bonjour' }] })
  assert.equal(sent.url, 'https://openrouter.ai/api/v1/chat/completions')
  assert.equal(sent.init.headers.authorization, 'Bearer sk-or-test')
  assert.equal(sent.body.model, 'anthropic/claude-sonnet-5.5')
  assert.deepEqual(sent.body.messages[0], { role: 'system', content: 'Tu es Jaspe.' })
  assert.equal(sent.body.response_format.type, 'json_schema')
  assert.equal(res.stop_reason, 'end_turn'); assert.equal(res.content[0].text, '{"ok":true}'); assert.equal(res.usage.input_tokens, 120)
})

test('OpenRouter : clé invalide → le copilote repasse en mode règles avec un avertissement', async () => {
  const fetch = async () => ({ ok: false, status: 401, json: async () => ({ error: { code: 401, message: 'No auth credentials found' } }) })
  const client = createOpenRouterClient({ apiKey: 'sk-or-faux', env: {}, fetch })
  await assert.rejects(client.beta.messages.create({ model: 'claude-haiku-5-5', max_tokens: 10, messages: [{ role: 'user', content: 'x' }] }), (e) => apiStatus(e) === 401)
  const db = openDb(':memory:')
  const r = await createCopilot(db, { client }).ask('Quelles sont mes priorités ?')
  assert.equal(r.mode, 'rules'); assert.match(r.warning, /Clé API invalide/)
})

test('OpenRouter : le copilote répond et journalise l’appel', async () => {
  const fetch = async () => ({ ok: true, status: 200, json: async () => ({ model: 'anthropic/claude-haiku-5.5', choices: [{ finish_reason: 'stop', message: { content: 'Trois priorités aujourd’hui.' } }], usage: { prompt_tokens: 500, completion_tokens: 20 } }) })
  const db = openDb(':memory:')
  const cop = createCopilot(db, { client: createOpenRouterClient({ apiKey: 'sk-or-test', env: {}, fetch }) })
  assert.equal(cop.provider, 'openrouter')
  const r = await cop.ask('Quelles sont mes priorités ?')
  assert.equal(r.mode, 'claude'); assert.equal(r.text, 'Trois priorités aujourd’hui.')
  const call = db.list('aicalls')[0]
  assert.equal(call.provider, 'openrouter'); assert.equal(call.input, 500)
})
