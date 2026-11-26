// Fournisseur d’IA du serveur : Anthropic en direct (prioritaire) ou OpenRouter.
// Le reste du code appelle toujours `client.beta.messages.create(...)` ; avec OpenRouter, un adaptateur
// traduit cet appel vers l’API compatible OpenAI d’OpenRouter (https://openrouter.ai/api/v1/chat/completions).
import Anthropic from '@anthropic-ai/sdk'

/** `claude-sonnet-5-5` → `anthropic/claude-sonnet-5.5` (identifiants OpenRouter). */
export function openRouterModel(model, env = process.env) {
  if (env.OPENROUTER_MODEL) return env.OPENROUTER_MODEL
  if (!model || model.includes('/')) return model
  return `anthropic/${model.replace(/-(\d+)-(\d+)$/, '-$1.$2')}`
}

/** Erreur d’API OpenRouter, avec le statut HTTP (401 clé invalide, 429 limite, …). */
export class LlmApiError extends Error {
  constructor(status, message) { super(message); this.status = status; this.provider = 'openrouter' }
}

const STOP = { stop: 'end_turn', length: 'max_tokens', content_filter: 'refusal', tool_calls: 'tool_use' }
const textOf = (c) => typeof c === 'string' ? c : (c ?? []).filter((b) => b.type === 'text').map((b) => b.text).join('\n')

export function createOpenRouterClient({ apiKey, env = process.env, fetch = globalThis.fetch, baseUrl = env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1' }) {
  async function create(params) {
    const system = Array.isArray(params.system) ? textOf(params.system) : params.system
    const format = params.output_config?.format
    const body = {
      model: openRouterModel(params.model, env),
      max_tokens: params.max_tokens,
      messages: [...(system ? [{ role: 'system', content: system }] : []), ...params.messages.map((m) => ({ role: m.role, content: textOf(m.content) }))],
      ...(format?.type === 'json_schema' ? { response_format: { type: 'json_schema', json_schema: { name: 'reponse', strict: true, schema: format.schema } } } : {}),
      usage: { include: true },
    }
    let r
    try {
      r = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json', ...(env.JASPE_PUBLIC_URL ? { 'HTTP-Referer': env.JASPE_PUBLIC_URL } : {}), 'X-Title': 'Jaspe' },
        body: JSON.stringify(body),
      })
    } catch (e) { throw new LlmApiError(0, `OpenRouter injoignable : ${e.message}`) }
    const data = await r.json().catch(() => ({}))
    if (!r.ok || data.error) throw new LlmApiError(data.error?.code ?? r.status, data.error?.message ?? `HTTP ${r.status}`)
    const choice = data.choices?.[0] ?? {}
    const u = data.usage ?? {}
    return {
      // On garde l’identifiant Claude demandé pour le calcul du coût ; le modèle réel servi reste visible.
      model: params.model,
      servedBy: data.model,
      provider: 'openrouter',
      stop_reason: STOP[choice.finish_reason] ?? choice.finish_reason ?? 'end_turn',
      content: [{ type: 'text', text: choice.message?.content ?? '' }],
      usage: { input_tokens: u.prompt_tokens ?? 0, output_tokens: u.completion_tokens ?? 0, cache_read_input_tokens: u.prompt_tokens_details?.cached_tokens ?? 0, cache_creation_input_tokens: 0 },
      cost: typeof u.cost === 'number' ? u.cost : undefined,
    }
  }
  return { provider: 'openrouter', beta: { messages: { create } }, messages: { create } }
}

/** Client IA selon les clés présentes : ANTHROPIC_API_KEY d’abord, sinon OPENROUTER_API_KEY, sinon rien (mode règles). */
export function createLlmClient(env = process.env, opts = {}) {
  if (env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN) return new Anthropic()
  if (env.OPENROUTER_API_KEY) return createOpenRouterClient({ apiKey: env.OPENROUTER_API_KEY, env, ...opts })
  return null
}

export const providerOf = (client) => !client ? 'aucun' : client.provider ?? 'anthropic'

/** Vrai si l’erreur vient de l’API (Anthropic ou OpenRouter) ; donne son statut. */
export const apiStatus = (e) => e instanceof Anthropic.APIError || e instanceof LlmApiError ? (e.status ?? 0) : null
