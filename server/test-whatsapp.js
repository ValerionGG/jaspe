// Débrief par WhatsApp : vérification Meta, signature, numéros autorisés, texte/vocal → plan en file, validation.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { openDb } from './db.js'
import { createEngine, HttpError } from './engine.js'
import { createWhatsApp, guessDossier, safeEqual } from './whatsapp.js'

const SECRET = 'app-secret-test'
const hmac = (key, body) => createHmac('sha256', key).update(body).digest('hex')
const sign = (body) => `sha256=${hmac(SECRET, body)}`
const NOW = Date.parse('2026-11-26T09:00:00Z')

function setup({ env = {}, transcribe, fetch } = {}) {
  const db = openDb(':memory:')
  const engine = createEngine(db, () => {})
  db.put('dossiers', { id: 'd1', ref: 'VND-1', seller: 'Famille Martin', propertyId: 'p1', agentId: 'a1', stage: 'post', tags: [], deliverables: {} })
  db.put('dossiers', { id: 'd2', ref: 'VND-2', seller: 'Mme Duval', propertyId: 'p2', agentId: 'a2', stage: 'post', tags: [], deliverables: {} })
  db.put('settings', { id: 'whatsapp-agents', jaspeNumber: '+33 7 00 00 00 00', agents: { '+33 6 12 34 56 78': { agentId: 'a1', name: 'Claire Delmas' } } })
  const calls = []
  const wa = createWhatsApp({
    db, HttpError, hmac, now: () => NOW,
    put: (c, d, o) => db.put(c, d, o), patch: (c, i, p) => db.patch(c, i, p),
    activity: (who, what, tone) => db.put('activity', { who, what, tone }, { front: true }),
    notify: (title, body) => db.put('notifications', { title, body }, { front: true }),
    apply: (p) => engine.actions['assistant.apply'](p),
    env: { WHATSAPP_VERIFY_TOKEN: 'verif', WHATSAPP_APP_SECRET: SECRET, ...env },
    transcribe,
    fetch: fetch ?? (async (url, init) => { calls.push({ url, init }); throw new Error('aucun appel réseau dans les tests') }),
  })
  return { db, engine, wa, calls }
}
const payload = (msg, from = '33612345678') => JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [{ id: 'WABA', changes: [{ field: 'messages', value: { messaging_product: 'whatsapp', metadata: { display_phone_number: '33700000000', phone_number_id: 'PNID' }, contacts: [{ profile: { name: 'Claire' }, wa_id: from }], messages: [{ from, id: `wamid.${Math.random().toString(36).slice(2)}`, timestamp: String(NOW / 1000 - 60), ...msg }] } }] }],
})
const post = async (wa, body, sig = sign(body)) => { const r = await wa.handleWebhook({ method: 'POST', headers: { 'x-hub-signature-256': sig } }, Buffer.from(body), {}); return { ...r, out: r.done ? await r.done : null } }
const TEXT = 'RDV avec la famille Martin terminé. Je rappelle le vendeur vendredi après le diagnostic. Préparer l’estimation.'

test('vérification GET : renvoie hub.challenge seulement avec le bon jeton', async () => {
  const { wa } = setup()
  const ok = await wa.handleWebhook({ method: 'GET' }, '', new URLSearchParams('hub.mode=subscribe&hub.verify_token=verif&hub.challenge=1158201444'))
  assert.equal(ok.status, 200); assert.equal(ok.body, '1158201444')
  const ko = await wa.handleWebhook({ method: 'GET' }, '', { 'hub.mode': 'subscribe', 'hub.verify_token': 'faux', 'hub.challenge': '1' })
  assert.equal(ko.status, 403)
})

test('signature X-Hub-Signature-256 : valide acceptée, invalide ou absente refusée', async () => {
  const { wa, db } = setup()
  const body = payload({ type: 'text', text: { body: TEXT } })
  assert.equal((await post(wa, body)).status, 200)
  assert.equal((await post(wa, body, 'sha256=' + '0'.repeat(64))).status, 401)
  assert.equal((await post(wa, body, '')).status, 401)
  assert.equal((await post(wa, body.replace('Martin', 'Mart1n'), sign(body))).status, 401, 'corps modifié après signature')
  assert.equal(db.get('settings', 'whatsapp-stats').badSignature, 3)
  assert.ok(safeEqual('abc', 'abc')); assert.ok(!safeEqual('abc', 'abd')); assert.ok(!safeEqual('', ''))
})

test('numéro inconnu : ignoré et journalisé, aucun plan', async () => {
  const { wa, db } = setup()
  const r = await post(wa, payload({ type: 'text', text: { body: TEXT } }, '351910000000'))
  assert.deepEqual(r.out, [{ ignored: true }])
  assert.equal(db.list('waplans').length, 0); assert.equal(db.list('queue').length, 0)
  assert.match(db.list('activity')[0].what, /non enregistré \(…0000\)/)
  assert.equal(db.get('settings', 'whatsapp-stats').ignored, 1)
})

test('texte → plan en file (dossier deviné), timelog en attente, réponse consignée', async () => {
  const { wa, db } = setup()
  const r = await post(wa, payload({ type: 'text', text: { body: TEXT } }))
  const id = r.out[0].id
  const plan = db.get('waplans', id)
  assert.equal(plan.status, 'en attente'); assert.equal(plan.dossierId, 'd1')
  assert.ok(plan.items.some((i) => i.type === 'relance') && plan.items.some((i) => i.code === 'L7'))
  const q = db.get('queue', `q-${id}`)
  assert.equal(q.kind, 'whatsapp'); assert.equal(q.safe, false); assert.equal(q.items.length, plan.items.length)
  const t = db.list('timelog').find((x) => x.ref === id)
  assert.equal(t.kind, 'brief'); assert.equal(t.pending, true); assert.equal(t.net, 0)
  const o = db.list('outbox')[0]
  assert.match(o.status, /consigné/); assert.match(o.body, /Famille Martin/); assert.match(o.body, /\/app\/taches/)
  assert.equal(db.list('tasks').length, 0, 'rien n’est lancé sans validation')
  assert.equal(guessDossier('vu Mme Duval ce matin', db.list('dossiers'))?.id, 'd2')
  assert.equal(guessDossier('rien à signaler', db.list('dossiers')), null)
})

test('relivraison du même message : ignorée', async () => {
  const { wa, db } = setup()
  const body = payload({ type: 'text', text: { body: TEXT } })
  await post(wa, body); const r = await post(wa, body)
  assert.equal(r.out[0].duplicate, true); assert.equal(db.list('waplans').length, 1)
})

test('vocal : média récupéré avec le jeton, transcription simulée, plan proposé', async () => {
  const seen = []
  const fetch = async (url, init) => {
    seen.push({ url: String(url), auth: init?.headers?.authorization })
    if (String(url).includes('/v23.0/MEDIA1')) return new Response(JSON.stringify({ url: 'https://lookaside.example/media1', mime_type: 'audio/ogg; codecs=opus', id: 'MEDIA1' }))
    if (String(url) === 'https://lookaside.example/media1') return new Response(new Uint8Array([1, 2, 3]))
    if (String(url).includes('/PNID/messages')) return new Response('{}')
    throw new Error(`appel inattendu ${url}`)
  }
  let got
  const { wa, db } = setup({ env: { WHATSAPP_TOKEN: 'tok' }, fetch, transcribe: async (a) => { got = a; return 'Famille Martin : relancer l’acquéreur demain pour l’offre de 450 000 €.' } })
  const r = await post(wa, payload({ type: 'audio', audio: { id: 'MEDIA1', mime_type: 'audio/ogg; codecs=opus', voice: true } }))
  const plan = db.get('waplans', r.out[0].id)
  assert.equal(plan.source, 'audio'); assert.equal(plan.dossierId, 'd1'); assert.ok(plan.items.length >= 2)
  assert.deepEqual([...got.bytes], [1, 2, 3]); assert.equal(got.language, 'fr')
  assert.ok(seen.slice(0, 2).every((s) => s.auth === 'Bearer tok'))
  assert.equal(db.list('outbox')[0].status, 'envoyé')
  assert.equal(db.get('settings', 'whatsapp-stats').voice, 1)
})

test('vocal sans transcription configurée : consigné et message clair au conseiller', async () => {
  const { wa, db } = setup()
  const r = await post(wa, payload({ type: 'audio', audio: { id: 'M2', mime_type: 'audio/ogg', voice: true } }))
  assert.equal(r.out[0].status, 'transcription non configurée')
  assert.equal(db.list('queue').length, 0)
  assert.match(db.list('outbox')[0].body, /transcription n’est pas encore configurée.*écrire/s)
  assert.equal(wa.actions['whatsapp.status']().transcription.configured, false)
})

test('approve applique uniquement les actions cochées ; reject écarte', async () => {
  const { wa, db } = setup()
  const id = (await post(wa, payload({ type: 'text', text: { body: TEXT } }))).out[0].id
  const relance = db.get('waplans', id).items.find((i) => i.type === 'relance')
  const r = await wa.actions['waplan.approve']({ id, items: [relance.id] })
  assert.equal(r.done.length, 1); assert.equal(r.done[0].result, 'tâche créée')
  assert.equal(db.list('tasks').length, 1); assert.equal(db.list('documents').length, 0, 'estimation décochée : non générée')
  assert.equal(db.get('waplans', id).status, 'validé'); assert.equal(db.get('queue', `q-${id}`), null)
  const t = db.list('timelog').find((x) => x.ref === id)
  assert.equal(t.pending, false); assert.ok(t.net > 0)
  await assert.rejects(() => wa.actions['waplan.approve']({ id }), (e) => e.status === 409)

  const id2 = (await post(wa, payload({ type: 'text', text: { body: 'Famille Martin : rappeler le notaire lundi.' } }))).out[0].id
  wa.actions['waplan.reject']({ id: id2 })
  assert.equal(db.get('waplans', id2).status, 'refusé'); assert.equal(db.get('queue', `q-${id2}`), null)
  assert.equal(db.list('tasks').length, 1)
  assert.equal(db.list('timelog').find((x) => x.ref === id2).rejected, true)
  const s = wa.actions['whatsapp.status']()
  assert.equal(s.stats.briefs, 2); assert.equal(s.stats.approved, 1); assert.equal(s.stats.rejected, 1); assert.equal(s.share, 100)
})
