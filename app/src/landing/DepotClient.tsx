// Page publique /depot/:token — sans compte : le client voit les pièces demandées et le texte légal,
// dépose ses fichiers (PDF, JPG, PNG, 10 Mo max) et coche une déclaration. Français ou portugais selon la demande.
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShieldCheck, UploadSimple, CheckCircle, WarningCircle, FileText, Lock } from '@phosphor-icons/react'
import type { DepotRequest } from '../data/evidence'

type Lang = 'fr' | 'pt'
const T = {
  fr: {
    loading: 'Chargement de la demande…', invalid: 'Lien indisponible', intro: (a: string) => `${a} vous demande les documents ci-dessous pour votre dossier.`,
    until: 'Lien valable jusqu’au', pieces: 'Documents demandés', add: 'Ajouter un fichier', sending: 'Envoi…', received: 'Reçu', formats: (n: number) => `PDF, JPG ou PNG · ${n} Mo maximum par fichier`,
    tooBig: (n: number) => `Fichier trop volumineux (${n} Mo maximum)`, badType: 'Formats acceptés : PDF, JPG, PNG', sent: 'Fichier reçu, merci.',
    declTitle: 'Déclaration', origin: 'Origine principale des fonds', choose: 'Choisir…', yes: 'Oui', no: 'Non', submit: 'Valider la déclaration', declared: 'Déclaration enregistrée le',
    done: 'C’est tout : votre conseiller est prévenu et reviendra vers vous si un document manque.', privacy: 'Vos données', remaining: (n: number) => `${n} dépôt(s) restant(s)`, error: 'Une erreur est survenue, réessayez.',
  },
  pt: {
    loading: 'A carregar o pedido…', invalid: 'Ligação indisponível', intro: (a: string) => `${a} pede-lhe os documentos abaixo para o seu processo.`,
    until: 'Ligação válida até', pieces: 'Documentos pedidos', add: 'Adicionar ficheiro', sending: 'A enviar…', received: 'Recebido', formats: (n: number) => `PDF, JPG ou PNG · máximo ${n} MB por ficheiro`,
    tooBig: (n: number) => `Ficheiro demasiado grande (máximo ${n} MB)`, badType: 'Formatos aceites : PDF, JPG, PNG', sent: 'Ficheiro recebido, obrigado.',
    declTitle: 'Declaração', origin: 'Origem principal dos fundos', choose: 'Escolher…', yes: 'Sim', no: 'Não', submit: 'Validar a declaração', declared: 'Declaração registada em',
    done: 'É tudo : o seu consultor foi avisado e contacta-o se faltar algum documento.', privacy: 'Os seus dados', remaining: (n: number) => `${n} envio(s) restante(s)`, error: 'Ocorreu um erro, tente novamente.',
  },
}

async function call<R>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<R> {
  const r = await fetch(`/api/public/depot/${path}`, { method, headers: body ? { 'content-type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error((j as { error?: string }).error ?? `Erreur ${r.status}`)
  return j as R
}
const toB64 = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] ?? ''); r.onerror = rej; r.readAsDataURL(f) })

export default function DepotClient() {
  const { token = '' } = useParams()
  const [req, setReq] = useState<DepotRequest | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null)
  const [origin, setOrigin] = useState('')
  const [pep, setPep] = useState<'' | 'oui' | 'non'>('')
  const [accepted, setAccepted] = useState(false)
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})
  const lang: Lang = req?.lang ?? (navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'fr')
  const t = T[lang]

  const load = () => call<DepotRequest>('GET', encodeURIComponent(token)).then((r) => { setReq(r); setErr('') }).catch((e: Error) => setErr(e.message))
  useEffect(() => { void load() }, [token]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { document.title = lang === 'pt' ? 'Envio de documentos' : 'Dépôt de documents' }, [lang])

  const upload = async (pieceId: string, f: File | undefined) => {
    if (!f || !req) return
    if (f.size > req.maxFileMb * 1024 * 1024) return setMsg({ id: pieceId, text: t.tooBig(req.maxFileMb), ok: false })
    if (!req.accept.includes(f.type)) return setMsg({ id: pieceId, text: t.badType, ok: false })
    setBusy(pieceId); setMsg(null)
    try {
      await call('POST', `${encodeURIComponent(token)}/file`, { pieceId, name: f.name, type: f.type, data: await toB64(f) })
      setMsg({ id: pieceId, text: t.sent, ok: true }); await load()
    } catch (e) { setMsg({ id: pieceId, text: (e as Error).message || t.error, ok: false }) }
    finally { setBusy(null); const el = inputs.current[pieceId]; if (el) el.value = '' }
  }
  const declare = async () => {
    setBusy('decl'); setMsg(null)
    try { await call('POST', `${encodeURIComponent(token)}/declaration`, { accepted, pep, origin: req?.declaration.askOrigin ? origin : undefined }); await load() }
    catch (e) { setMsg({ id: 'decl', text: (e as Error).message || t.error, ok: false }) }
    finally { setBusy(null) }
  }

  const shell = (children: React.ReactNode) => (
    <main lang={lang === 'pt' ? 'pt-PT' : 'fr'} className="min-h-screen bg-ink px-4 py-8 text-bone sm:py-14">
      <div className="mx-auto max-w-xl">{children}</div>
    </main>
  )
  if (err) return shell(
    <div className="rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/[0.08]">
      <WarningCircle size={28} className="text-coral" />
      <h1 className="mt-3 text-[20px] font-medium">{t.invalid}</h1>
      <p className="mt-2 text-[14px] text-bone/70">{err}</p>
    </div>,
  )
  if (!req) return shell(<p className="text-[14px] text-mist">{t.loading}</p>)

  const canDeclare = accepted && !!pep && (!req.declaration.askOrigin || !!origin)
  return shell(
    <>
      <header>
        <div className="flex items-center gap-2 text-[12px] uppercase tracking-eyebrow text-mist"><Lock size={13} />{req.agency}{req.city ? ` · ${req.city}` : ''}</div>
        <h1 className="mt-3 text-[24px] font-medium leading-tight tracking-[-0.01em]">{req.legal.title}</h1>
        <p className="mt-2 text-[14.5px] text-bone/75">{t.intro(req.agency)}</p>
        <p className="mt-1 text-[12.5px] text-mist">{t.until} {new Date(req.expiresAt).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </header>

      <section className="mt-6 space-y-2 rounded-2xl bg-white/[0.03] p-4 text-[13.5px] leading-relaxed text-bone/80 ring-1 ring-white/[0.08]">
        <ShieldCheck size={20} className="text-champagne-300" />
        {req.legal.body.map((p) => <p key={p}>{p}</p>)}
      </section>

      <section className="mt-8">
        <h2 className="text-[12px] uppercase tracking-eyebrow text-mist">{t.pieces}</h2>
        <p className="mt-1 text-[12px] text-mist">{t.formats(req.maxFileMb)} · {t.remaining(req.remaining)}</p>
        <ul className="mt-3 space-y-3">
          {req.pieces.map((p) => (
            <li key={p.id} className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.08]">
              <div className="flex items-start gap-3">
                {p.received.length ? <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-champagne-300" /> : <FileText size={20} className="mt-0.5 shrink-0 text-mist" />}
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-medium">{p.label}</div>
                  <div className="mt-0.5 text-[12.5px] text-bone/60">{p.hint}</div>
                  {p.received.map((r) => <div key={r.at} className="mt-1 break-all text-[12px] text-champagne-300">{t.received} : {r.name}</div>)}
                </div>
              </div>
              <input ref={(el) => { inputs.current[p.id] = el }} id={`f-${p.id}`} type="file" accept={req.accept.join(',')} className="sr-only" disabled={!!busy || !req.remaining} onChange={(e) => void upload(p.id, e.target.files?.[0])} />
              <label htmlFor={`f-${p.id}`} className={`mt-3 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white/[0.06] px-4 text-[14px] ring-1 ring-white/10 transition hover:bg-white/[0.1] ${busy || !req.remaining ? 'pointer-events-none opacity-50' : ''}`}>
                <UploadSimple size={16} />{busy === p.id ? t.sending : t.add}
              </label>
              {msg?.id === p.id && <p role="status" className={`mt-2 text-[12.5px] ${msg.ok ? 'text-champagne-300' : 'text-coral'}`}>{msg.text}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/[0.08]">
        <h2 className="text-[12px] uppercase tracking-eyebrow text-mist">{t.declTitle}</h2>
        {req.declaration.done ? (
          <p className="mt-3 flex items-start gap-2 text-[14px]"><CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-champagne-300" />{t.declared} {new Date(req.declaration.at!).toLocaleString(lang === 'pt' ? 'pt-PT' : 'fr-FR')}</p>
        ) : (
          <form className="mt-3 space-y-4" onSubmit={(e) => { e.preventDefault(); void declare() }}>
            {req.declaration.askOrigin && (
              <label className="block text-[13.5px]">{t.origin}
                <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="mt-1.5 block min-h-11 w-full rounded-xl bg-white/[0.05] px-3 text-[14px] text-bone ring-1 ring-white/10">
                  <option value="">{t.choose}</option>
                  {req.declaration.origins.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </label>
            )}
            <fieldset className="text-[13.5px]">
              <legend className="leading-snug">{req.declaration.pep}</legend>
              <div className="mt-2 flex gap-2">
                {(['non', 'oui'] as const).map((v) => (
                  <label key={v} className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full ring-1 transition ${pep === v ? 'bg-champagne/15 ring-champagne/40' : 'bg-white/[0.04] ring-white/10'}`}>
                    <input type="radio" name="pep" value={v} checked={pep === v} onChange={() => setPep(v)} className="sr-only" />{v === 'oui' ? t.yes : t.no}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex cursor-pointer items-start gap-3 text-[13.5px] leading-snug">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[rgb(var(--acc-500))]" />
              {req.declaration.text}
            </label>
            <button type="submit" disabled={!canDeclare || busy === 'decl'} className="min-h-11 w-full rounded-full bg-champagne px-4 text-[14px] font-medium text-ink transition disabled:opacity-40">{busy === 'decl' ? t.sending : t.submit}</button>
            {msg?.id === 'decl' && <p role="alert" className="text-[12.5px] text-coral">{msg.text}</p>}
          </form>
        )}
      </section>

      {req.declaration.done && <p className="mt-6 text-[14px] text-bone/80">{t.done}</p>}

      <footer className="mt-10 border-t border-white/[0.08] pt-5 text-[12px] leading-relaxed text-mist">
        <h2 className="mb-2 uppercase tracking-eyebrow">{t.privacy}</h2>
        {req.legal.privacy.map((p) => <p key={p} className="mb-2">{p}</p>)}
      </footer>
    </>,
  )
}
