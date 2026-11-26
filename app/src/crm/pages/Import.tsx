// Import des biens et contacts exportés d'eGO Real Estate (PT) ou d'Hektor (FR) : dépôt du CSV, mapping guidé, aperçu, import sans doublons.
import { Link } from 'react-router-dom'
import { useRef, useState, type DragEvent } from 'react'
import clsx from 'clsx'
import { UploadSimple, FileCsv, CheckCircle, WarningCircle, ArrowRight, Info, ArrowCounterClockwise } from '@phosphor-icons/react'
import { PageHeader, Card, Tabs, SoftBtn, Stagger } from '../ui'
import { Select, toast, errText } from '../forms'
import { action } from '../../data/store'
import { useT, translate, getLang, type Lang } from '../../i18n'

type Kind = 'properties' | 'contacts'
type Mapping = Record<string, string | null>
type Issue = { row: number; problem: string; level?: 'erreur' | 'alerte' }
type Dup = { row: number; label?: string; reason: string; existingId?: string | null }
type Sample = Record<string, unknown> & { importedFrom?: { ref?: string | null } }
type Preview = {
  source: 'ego' | 'hektor' | 'inconnu'; sourceLabel: string; headers: string[]; mapping: Mapping; fields: { k: string; l: string; req?: boolean }[]
  missing: string[]; rows: number; count: number; sample: Sample[]; issues: Issue[]; duplicates: Dup[]; duplicateCount: number
}
type RunResult = { created: number; skipped: number; issues: Issue[]; duplicates: Dup[] }

const MAX_BYTES = 8 * 1024 * 1024
const LINK: Record<Kind, { to: string; l: 'imp.seeProperties' | 'imp.seeContacts' }> = { properties: { to: '/app/biens', l: 'imp.seeProperties' }, contacts: { to: '/app/contacts', l: 'imp.seeContacts' } }
const LOC: Record<Lang, string> = { fr: 'fr-FR', pt: 'pt-PT' }
const plural = (lang: Lang, n: number, k: Kind) => translate(lang, k === 'properties' ? 'imp.nProperties' : 'imp.nContacts', { n, num: n.toLocaleString(LOC[lang]) })
const money = (lang: Lang, n: unknown) => (typeof n === 'number' && n > 0 ? `${n.toLocaleString(LOC[lang])} €` : translate(lang, 'imp.priceMissing'))

/** Lit le fichier en UTF-8, puis en Windows-1252 si des caractères de remplacement apparaissent (exports Excel). */
async function readText(file: File): Promise<{ text: string; encoding: string }> {
  const buf = await new Promise<ArrayBuffer>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as ArrayBuffer)
    r.onerror = () => reject(new Error(translate(getLang(), 'imp.readFail')))
    r.readAsArrayBuffer(file)
  })
  const utf8 = new TextDecoder('utf-8').decode(buf)
  if (!utf8.includes('�')) return { text: utf8, encoding: 'UTF-8' }
  return { text: new TextDecoder('windows-1252').decode(buf), encoding: 'Windows-1252' }
}

export default function Import() {
  const [kind, setKind] = useState<Kind>('properties')
  const [file, setFile] = useState<{ name: string; text: string; encoding: string } | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [mapping, setMapping] = useState<Mapping | null>(null)
  const [busy, setBusy] = useState<'' | 'read' | 'preview' | 'run'>('')
  const [err, setErr] = useState('')
  const [done, setDone] = useState<(RunResult & { kind: Kind }) | null>(null)
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const { t, lang, locale } = useT()

  const runPreview = async (k: Kind, f: { name: string; text: string }, m: Mapping | null) => {
    setBusy('preview'); setErr('')
    try {
      const p = await action<Preview>('import.preview', { kind: k, text: f.text, file: f.name, ...(m ? { mapping: m } : {}) })
      setPreview(p); setMapping(p.mapping)
    } catch (e) { setPreview(null); setErr(errText(e)) }
    finally { setBusy('') }
  }

  const pick = async (f: File | undefined) => {
    if (!f) return
    setDone(null); setErr('')
    if (!/\.(csv|txt|tsv)$/i.test(f.name) && !/csv|text/.test(f.type)) { setErr(t('imp.errCsv')); return }
    if (f.size > MAX_BYTES) { setErr(t('imp.errSize')); return }
    setBusy('read')
    try {
      const r = await readText(f)
      const next = { name: f.name, ...r }
      setFile(next)
      await runPreview(kind, next, null)
    } catch (e) { setErr(errText(e)); setBusy('') }
  }

  const switchKind = (k: Kind) => {
    setKind(k); setDone(null)
    if (file) void runPreview(k, file, null)
  }
  const remap = (field: string, col: string) => {
    if (!file || !mapping) return
    const m = { ...mapping, [field]: col || null }
    setMapping(m)
    void runPreview(kind, file, m)
  }
  const reset = () => { setFile(null); setPreview(null); setMapping(null); setErr(''); setDone(null); if (input.current) input.current.value = '' }

  const run = async () => {
    if (!file || !preview || !mapping) return
    setBusy('run'); setErr('')
    try {
      const r = await action<RunResult>('import.run', { kind, text: file.text, mapping, file: file.name })
      setDone({ ...r, kind })
      toast(r.created ? `${t('imp.imported', { n: r.created, what: plural(lang, r.created, kind) })}${r.skipped ? ` · ${t('imp.ignored', { n: r.skipped })}` : ''}` : t('imp.nothingNew'), r.created ? 'ok' : 'info')
      await runPreview(kind, file, mapping)
    } catch (e) { setErr(errText(e)); toast(errText(e), 'error') }
    finally { setBusy('') }
  }

  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); void pick(e.dataTransfer.files?.[0]) }

  return (
    <div className="min-w-0">
      <PageHeader kicker={t('imp.kicker')} title={t('imp.title')}
        sub={t('imp.sub')}
        actions={file ? <SoftBtn onClick={reset} icon={<ArrowCounterClockwise size={14} />}>{t('imp.otherFile')}</SoftBtn> : undefined} />

      <Stagger i={0} className="mb-5">
        <Tabs id="import-kind" value={kind} onChange={switchKind} items={[{ id: 'properties', label: t('imp.properties') }, { id: 'contacts', label: t('imp.contacts') }]} />
      </Stagger>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <Stagger i={1}>
            <label onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={onDrop}
              className={clsx('flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.4rem] border border-dashed px-5 py-10 text-center transition', over ? 'border-champagne/60 bg-champagne/[0.06]' : 'border-white/15 bg-white/[0.02] hover:bg-white/[0.04]')}>
              <input ref={input} type="file" accept=".csv,.tsv,.txt,text/csv" className="sr-only" onChange={(e) => void pick(e.target.files?.[0])} />
              {file ? <FileCsv size={30} className="text-champagne-300" /> : <UploadSimple size={30} className="text-mist" />}
              <div className="max-w-full break-words text-[14px] text-bone/85">
                {busy === 'read' ? t('imp.reading') : file ? <><span className="font-medium">{file.name}</span> <span className="text-mist">· {file.encoding}</span></> : <>{kind === 'properties' ? t('imp.dropProperties') : t('imp.dropContacts')} <span className="text-champagne-300 underline underline-offset-2">{t('imp.choose')}</span></>}
              </div>
              <div className="text-[11.5px] text-mist">{t('imp.sepHint')}</div>
            </label>
          </Stagger>

          {err && <p role="alert" className="rounded-xl bg-coral/10 px-3.5 py-2.5 text-[12.5px] text-coral ring-1 ring-coral/20">{err}</p>}

          {done && (
            <Card>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2.5">
                  <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-sage" />
                  <div>
                    <div className="text-[14px] font-medium">{done.created ? t('imp.imported', { n: done.created, what: plural(lang, done.created, done.kind) }) : t('imp.noNew')}</div>
                    <div className="text-[12px] text-bone/55">{done.skipped ? t('imp.linesIgnored', { n: done.skipped }) : t('imp.noLineIgnored')}{done.kind === 'contacts' ? t('imp.consentNote') : t('imp.draftNote')}</div>
                  </div>
                </div>
                <Link to={LINK[done.kind].to}><SoftBtn tone="gold" icon={<ArrowRight size={14} />}>{t(LINK[done.kind].l)}</SoftBtn></Link>
              </div>
            </Card>
          )}

          {preview && mapping && (
            <>
              <Card kicker={t('imp.step', { n: 1 })} title={t('imp.mapping')}
                action={<span className={clsx('shrink-0 rounded-full px-2.5 py-1 text-[11px] ring-1', preview.source === 'inconnu' ? 'bg-white/[0.04] text-bone/60 ring-white/10' : 'bg-sea/15 text-sea ring-sea/25')}>{preview.source === 'inconnu' ? t('imp.unknownSource') : t('imp.detected', { src: preview.sourceLabel })}</span>}>
                <p className="mb-4 text-[12.5px] text-bone/55">
                  {t('imp.colsRows', { c: preview.headers.length, r: preview.rows.toLocaleString(locale) })}
                </p>
                {preview.missing.length > 0 && (
                  <p className="mb-4 flex items-start gap-2 rounded-xl bg-champagne/10 px-3.5 py-2.5 text-[12.5px] text-champagne-300 ring-1 ring-champagne/20">
                    <WarningCircle size={16} className="mt-0.5 shrink-0" />{t('imp.notFound', { list: preview.missing.join(', ') })}
                  </p>
                )}
                <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
                  {preview.fields.map((f) => (
                    <label key={f.k} className="block min-w-0">
                      <span className="mb-1 block truncate text-[11px] uppercase tracking-eyebrow text-mist">{f.l}{f.req && <span className="text-champagne-300"> ·</span>}</span>
                      <Select value={mapping[f.k] ?? ''} onChange={(e) => remap(f.k, e.target.value)} disabled={busy !== ''} className={clsx('truncate', !mapping[f.k] && 'text-bone/45')}>
                        <option value="">{t('imp.dontImport')}</option>
                        {preview.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                      </Select>
                    </label>
                  ))}
                </div>
              </Card>

              <Card kicker={t('imp.step', { n: 2 })} title={t('imp.preview')} action={<span className="num shrink-0 text-[11.5px] text-mist">{Math.min(5, preview.count)} / {preview.count}</span>}>
                {preview.sample.length === 0
                  ? <p className="text-[13px] text-bone/55">{preview.duplicateCount ? t('imp.noNewLinesDup') : t('imp.noNewLines')}</p>
                  : (
                    <ul className="divide-y divide-white/[0.06]">
                      {preview.sample.map((d, i) => (
                        <li key={i} className="flex min-w-0 flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                          {kind === 'properties' ? (
                            <>
                              <div className="min-w-0">
                                <div className="truncate text-[13.5px] font-medium">{String(d.title ?? '')}</div>
                                <div className="truncate text-[12px] text-bone/55">{[d.ref, d.address, d.postalCode, d.city].filter(Boolean).map(String).join(' · ')}</div>
                              </div>
                              <div className="num flex shrink-0 flex-wrap gap-x-3 text-[12px] text-bone/70">
                                <span>{money(lang, d.price)}</span>
                                <span>{Number(d.surface) ? `${d.surface} m²` : '— m²'}</span>
                                <span>{Number(d.rooms) ? `${d.rooms} ${t('imp.roomsShort')}` : `— ${t('imp.roomsShort')}`}</span>
                                <span>{t('imp.dpe')} {String(d.dpe ?? '—')}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="min-w-0">
                                <div className="truncate text-[13.5px] font-medium">{String(d.name ?? '')}</div>
                                <div className="truncate text-[12px] text-bone/55">{[d.email, d.phone].filter(Boolean).map(String).join(' · ') || t('imp.noContactInfo')}</div>
                              </div>
                              <div className="flex shrink-0 flex-wrap gap-x-3 text-[12px] text-bone/70">
                                <span>{(d.roles as string[] | undefined)?.join(', ')}</span>
                                {d.city ? <span>{String(d.city)}</span> : null}
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
              </Card>

              {(preview.issues.length > 0 || preview.duplicateCount > 0) && (
                <Card kicker={t('imp.step', { n: 3 })} title={t('imp.toCheck')}>
                  {preview.duplicateCount > 0 && (
                    <details className="mb-3">
                      <summary className="cursor-pointer text-[13px] text-bone/85">{t('imp.dupIgnored', { n: preview.duplicateCount })}</summary>
                      <ul className="thin-scroll mt-2 max-h-56 space-y-1 overflow-y-auto text-[12px] text-bone/60">
                        {preview.duplicates.map((x, i) => <li key={i} className="break-words"><span className="num text-mist">L{x.row}</span> {x.label} — {x.reason}</li>)}
                      </ul>
                    </details>
                  )}
                  {preview.issues.length > 0 && (
                    <details open={preview.issues.length <= 5}>
                      <summary className="cursor-pointer text-[13px] text-bone/85">{t('imp.remarks', { n: preview.issues.length })}</summary>
                      <ul className="thin-scroll mt-2 max-h-56 space-y-1 overflow-y-auto text-[12px]">
                        {preview.issues.map((x, i) => <li key={i} className={clsx('break-words', x.level === 'erreur' ? 'text-coral' : 'text-bone/60')}><span className="num text-mist">L{x.row}</span> {x.problem}</li>)}
                      </ul>
                    </details>
                  )}
                </Card>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11.5px] text-mist">{kind === 'contacts' ? t('imp.consentFoot') : t('imp.draftFoot')}</p>
                <SoftBtn tone="gold" onClick={run} disabled={busy !== '' || preview.count === 0} icon={<CheckCircle size={15} />}>
                  {busy === 'run' ? t('imp.running') : busy === 'preview' ? t('imp.updating') : t('imp.importN', { what: plural(lang, preview.count, kind) })}
                </SoftBtn>
              </div>
            </>
          )}
        </div>

        <Stagger i={2} className="min-w-0">
          <Card kicker={t('imp.guide')} title={t('imp.guideTitle')}>
            <div className="space-y-4 text-[12.5px] leading-relaxed text-bone/70">
              <div>
                <div className="mb-1 font-medium text-bone">eGO Real Estate (Portugal)</div>
                <p>{t('imp.egoText')}</p>
              </div>
              <div>
                <div className="mb-1 font-medium text-bone">Hektor (France)</div>
                <p>{t('imp.hektorText')}</p>
              </div>
              <p className="flex items-start gap-2 rounded-xl bg-white/[0.03] p-3 text-[12px] text-bone/60 ring-1 ring-white/[0.06]">
                <Info size={15} className="mt-0.5 shrink-0 text-champagne-300" />
                {t('imp.guideNote')}
              </p>
            </div>
          </Card>
        </Stagger>
      </div>
    </div>
  )
}
