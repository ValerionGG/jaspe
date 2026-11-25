// Import des biens et contacts exportés d'eGO Real Estate (PT) ou d'Hektor (FR) : dépôt du CSV, mapping guidé, aperçu, import sans doublons.
import { Link } from 'react-router-dom'
import { useRef, useState, type DragEvent } from 'react'
import clsx from 'clsx'
import { UploadSimple, FileCsv, CheckCircle, WarningCircle, ArrowRight, Info, ArrowCounterClockwise } from '@phosphor-icons/react'
import { PageHeader, Card, Tabs, SoftBtn, Stagger } from '../ui'
import { Select, toast, errText } from '../forms'
import { action } from '../../data/store'

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
const LINK: Record<Kind, { to: string; l: string }> = { properties: { to: '/app/biens', l: 'Voir les biens' }, contacts: { to: '/app/contacts', l: 'Voir les contacts' } }
const NOUN: Record<Kind, [string, string]> = { properties: ['bien', 'biens'], contacts: ['contact', 'contacts'] }
const plural = (n: number, k: Kind) => `${n.toLocaleString('fr-FR')} ${NOUN[k][n > 1 ? 1 : 0]}`
const money = (n: unknown) => (typeof n === 'number' && n > 0 ? `${n.toLocaleString('fr-FR')} €` : 'Prix à compléter')

/** Lit le fichier en UTF-8, puis en Windows-1252 si des caractères de remplacement apparaissent (exports Excel). */
async function readText(file: File): Promise<{ text: string; encoding: string }> {
  const buf = await new Promise<ArrayBuffer>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as ArrayBuffer)
    r.onerror = () => reject(new Error('Lecture du fichier impossible'))
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
    if (!/\.(csv|txt|tsv)$/i.test(f.name) && !/csv|text/.test(f.type)) { setErr('Déposez un fichier CSV (.csv). Depuis Excel : Enregistrer sous → CSV.'); return }
    if (f.size > MAX_BYTES) { setErr('Fichier trop volumineux (8 Mo maximum) : exportez par lots.'); return }
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
      toast(r.created ? `${plural(r.created, kind)} importé${r.created > 1 ? 's' : ''}${r.skipped ? ` · ${r.skipped} ignoré${r.skipped > 1 ? 's' : ''}` : ''}` : 'Rien de nouveau : tout existait déjà', r.created ? 'ok' : 'info')
      await runPreview(kind, file, mapping)
    } catch (e) { setErr(errText(e)); toast(errText(e), 'error') }
    finally { setBusy('') }
  }

  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); void pick(e.dataTransfer.files?.[0]) }

  return (
    <div className="min-w-0">
      <PageHeader kicker="Reprise de données" title="Importer depuis votre CRM"
        sub="Reprenez vos biens et contacts exportés d’eGO Real Estate ou d’Hektor : Jaspe reconnaît les colonnes, vous corrigez si besoin, et rien n’est importé deux fois."
        actions={file ? <SoftBtn onClick={reset} icon={<ArrowCounterClockwise size={14} />}>Autre fichier</SoftBtn> : undefined} />

      <Stagger i={0} className="mb-5">
        <Tabs id="import-kind" value={kind} onChange={switchKind} items={[{ id: 'properties', label: 'Biens' }, { id: 'contacts', label: 'Contacts' }]} />
      </Stagger>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <Stagger i={1}>
            <label onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={onDrop}
              className={clsx('flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.4rem] border border-dashed px-5 py-10 text-center transition', over ? 'border-champagne/60 bg-champagne/[0.06]' : 'border-white/15 bg-white/[0.02] hover:bg-white/[0.04]')}>
              <input ref={input} type="file" accept=".csv,.tsv,.txt,text/csv" className="sr-only" onChange={(e) => void pick(e.target.files?.[0])} />
              {file ? <FileCsv size={30} className="text-champagne-300" /> : <UploadSimple size={30} className="text-mist" />}
              <div className="max-w-full break-words text-[14px] text-bone/85">
                {busy === 'read' ? 'Lecture du fichier…' : file ? <><span className="font-medium">{file.name}</span> <span className="text-mist">· {file.encoding}</span></> : <>Déposez l’export CSV des {kind === 'properties' ? 'biens' : 'contacts'} ici, ou <span className="text-champagne-300 underline underline-offset-2">choisissez un fichier</span></>}
              </div>
              <div className="text-[11.5px] text-mist">Séparateur ; , ou tabulation détecté automatiquement · 8 Mo maximum</div>
            </label>
          </Stagger>

          {err && <p role="alert" className="rounded-xl bg-coral/10 px-3.5 py-2.5 text-[12.5px] text-coral ring-1 ring-coral/20">{err}</p>}

          {done && (
            <Card>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2.5">
                  <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-sage" />
                  <div>
                    <div className="text-[14px] font-medium">{done.created ? `${plural(done.created, done.kind)} importé${done.created > 1 ? 's' : ''}` : 'Aucun nouvel élément'}</div>
                    <div className="text-[12px] text-bone/55">{done.skipped ? `${done.skipped} ligne${done.skipped > 1 ? 's' : ''} ignorée${done.skipped > 1 ? 's' : ''} (doublons ou lignes vides)` : 'Aucune ligne ignorée'}{done.kind === 'contacts' ? ' · consentements à recueillir dans Jaspe' : ' · biens en brouillon, à contrôler avant diffusion'}</div>
                  </div>
                </div>
                <Link to={LINK[done.kind].to}><SoftBtn tone="gold" icon={<ArrowRight size={14} />}>{LINK[done.kind].l}</SoftBtn></Link>
              </div>
            </Card>
          )}

          {preview && mapping && (
            <>
              <Card kicker="Étape 1" title="Correspondance des colonnes"
                action={<span className={clsx('shrink-0 rounded-full px-2.5 py-1 text-[11px] ring-1', preview.source === 'inconnu' ? 'bg-white/[0.04] text-bone/60 ring-white/10' : 'bg-sea/15 text-sea ring-sea/25')}>{preview.source === 'inconnu' ? 'Source non reconnue' : `Export ${preview.sourceLabel} détecté`}</span>}>
                <p className="mb-4 text-[12.5px] text-bone/55">
                  {preview.headers.length} colonnes, {preview.rows.toLocaleString('fr-FR')} lignes. Vérifiez chaque correspondance : les noms de colonnes varient selon la version et le paramétrage du logiciel.
                </p>
                {preview.missing.length > 0 && (
                  <p className="mb-4 flex items-start gap-2 rounded-xl bg-champagne/10 px-3.5 py-2.5 text-[12.5px] text-champagne-300 ring-1 ring-champagne/20">
                    <WarningCircle size={16} className="mt-0.5 shrink-0" />Non trouvé dans le fichier : {preview.missing.join(', ')}. Choisissez la colonne si elle existe sous un autre nom.
                  </p>
                )}
                <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
                  {preview.fields.map((f) => (
                    <label key={f.k} className="block min-w-0">
                      <span className="mb-1 block truncate text-[11px] uppercase tracking-eyebrow text-mist">{f.l}{f.req && <span className="text-champagne-300"> ·</span>}</span>
                      <Select value={mapping[f.k] ?? ''} onChange={(e) => remap(f.k, e.target.value)} disabled={busy !== ''} className={clsx('truncate', !mapping[f.k] && 'text-bone/45')}>
                        <option value="">— Ne pas importer —</option>
                        {preview.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                      </Select>
                    </label>
                  ))}
                </div>
              </Card>

              <Card kicker="Étape 2" title="Aperçu converti" action={<span className="num shrink-0 text-[11.5px] text-mist">{Math.min(5, preview.count)} / {preview.count}</span>}>
                {preview.sample.length === 0
                  ? <p className="text-[13px] text-bone/55">Aucune nouvelle ligne à importer{preview.duplicateCount ? ' : tout existe déjà dans Jaspe.' : '.'}</p>
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
                                <span>{money(d.price)}</span>
                                <span>{Number(d.surface) ? `${d.surface} m²` : '— m²'}</span>
                                <span>{Number(d.rooms) ? `${d.rooms} p.` : '— p.'}</span>
                                <span>DPE {String(d.dpe ?? '—')}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="min-w-0">
                                <div className="truncate text-[13.5px] font-medium">{String(d.name ?? '')}</div>
                                <div className="truncate text-[12px] text-bone/55">{[d.email, d.phone].filter(Boolean).map(String).join(' · ') || 'Ni e-mail ni téléphone'}</div>
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
                <Card kicker="Étape 3" title="À vérifier">
                  {preview.duplicateCount > 0 && (
                    <details className="mb-3">
                      <summary className="cursor-pointer text-[13px] text-bone/85">{preview.duplicateCount} doublon{preview.duplicateCount > 1 ? 's' : ''} ignoré{preview.duplicateCount > 1 ? 's' : ''}</summary>
                      <ul className="thin-scroll mt-2 max-h-56 space-y-1 overflow-y-auto text-[12px] text-bone/60">
                        {preview.duplicates.map((x, i) => <li key={i} className="break-words"><span className="num text-mist">L{x.row}</span> {x.label} — {x.reason}</li>)}
                      </ul>
                    </details>
                  )}
                  {preview.issues.length > 0 && (
                    <details open={preview.issues.length <= 5}>
                      <summary className="cursor-pointer text-[13px] text-bone/85">{preview.issues.length} remarque{preview.issues.length > 1 ? 's' : ''} sur les lignes</summary>
                      <ul className="thin-scroll mt-2 max-h-56 space-y-1 overflow-y-auto text-[12px]">
                        {preview.issues.map((x, i) => <li key={i} className={clsx('break-words', x.level === 'erreur' ? 'text-coral' : 'text-bone/60')}><span className="num text-mist">L{x.row}</span> {x.problem}</li>)}
                      </ul>
                    </details>
                  )}
                </Card>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11.5px] text-mist">{kind === 'contacts' ? 'Aucun consentement n’est importé ni présumé : recueillez-les dans Jaspe avant toute prospection.' : 'Les biens arrivent en brouillon, sans diffusion portail ; la position sur la carte est approchée.'}</p>
                <SoftBtn tone="gold" onClick={run} disabled={busy !== '' || preview.count === 0} icon={<CheckCircle size={15} />}>
                  {busy === 'run' ? 'Import en cours…' : busy === 'preview' ? 'Mise à jour…' : `Importer ${plural(preview.count, kind)}`}
                </SoftBtn>
              </div>
            </>
          )}
        </div>

        <Stagger i={2} className="min-w-0">
          <Card kicker="Guide" title="Comment exporter depuis eGO / Hektor">
            <div className="space-y-4 text-[12.5px] leading-relaxed text-bone/70">
              <div>
                <div className="mb-1 font-medium text-bone">eGO Real Estate (Portugal)</div>
                <p>Dans la liste des imóveis ou des contactos, filtrez si besoin, sélectionnez les lignes puis cherchez l’action d’export (souvent « Exportar » → Excel ou CSV). Si seul Excel est proposé, ouvrez le fichier et enregistrez-le en CSV.</p>
              </div>
              <div>
                <div className="mb-1 font-medium text-bone">Hektor (France)</div>
                <p>Depuis la liste des biens ou des contacts, utilisez la fonction d’export ou d’extraction proposée par votre version (CSV ou Excel). Selon votre abonnement, l’export peut devoir être demandé au support Hektor.</p>
              </div>
              <p className="flex items-start gap-2 rounded-xl bg-white/[0.03] p-3 text-[12px] text-bone/60 ring-1 ring-white/[0.06]">
                <Info size={15} className="mt-0.5 shrink-0 text-champagne-300" />
                Les intitulés de menus et de colonnes ci-dessus sont indicatifs et à confirmer sur votre logiciel. Exportez biens et contacts dans deux fichiers séparés ; vous pouvez réimporter le même fichier sans créer de doublons.
              </p>
            </div>
          </Card>
        </Stagger>
      </div>
    </div>
  )
}
