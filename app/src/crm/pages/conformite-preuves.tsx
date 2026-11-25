// Pack Preuves (option +6 €/mois) : grille de risque LCB-FT/BCFT par partie, lien client, pièces reçues,
// historique horodaté, export de contrôle ; récapitulatif trimestriel IMPIC pour le Portugal.
import { useCallback, useEffect, useState } from 'react'
import clsx from 'clsx'
import { Sparkle, LinkSimple, Copy, Prohibit, FileText, Printer, DownloadSimple, ClockCounterClockwise, Fingerprint, Warning, Gavel, CheckCircle } from '@phosphor-icons/react'
import { Card, SoftBtn, Empty } from '../ui'
import { Pill } from '../../ui/kit'
import { action } from '../../data/store'
import { Field, Select, Textarea, toast, errText } from '../forms'
import type { EvidenceState, Party, RiskGrid, DepotLink, ExportResult, ImpicResult, RiskLevel } from '../../data/evidence'

const LEVEL_TONE: Record<RiskLevel, 'green' | 'amber' | 'red'> = { faible: 'green', moyen: 'amber', eleve: 'red' }
const PARTY_L: Record<Party, string> = { vendeur: 'Vendeur', acquereur: 'Acquéreur' }
const dt = (s: string) => new Date(s).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const depotUrl = (token: string) => (import.meta.env.VITE_STATIC === '1' ? `${location.origin}${location.pathname}#/depot/${token}` : `${location.origin}/depot/${token}`)
const download = (name: string, text: string, type: string) => {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const linkStatus = (l: DepotLink) => (l.revokedAt ? { l: 'Révoqué', tone: 'neutral' as const } : Date.parse(l.expiresAt) <= Date.now() ? { l: 'Expiré', tone: 'neutral' as const } : l.declaredAt ? { l: 'Déclaration reçue', tone: 'green' as const } : { l: 'Actif', tone: 'blue' as const })

export function PreuvesPanel({ dossierId, onChecklistChange }: { dossierId: string; onChecklistChange?: () => void }) {
  const [st, setSt] = useState<EvidenceState | null>(null)
  const [party, setParty] = useState<Party>('acquereur')
  const [busy, setBusy] = useState(false)
  const [fresh, setFresh] = useState<{ party: Party; url: string } | null>(null)
  const [decision, setDecision] = useState('')
  const [why, setWhy] = useState('')
  const [allLog, setAllLog] = useState(false)

  const load = useCallback(async () => {
    try { setSt(await action<EvidenceState>('evidence.state', { dossierId })) } catch (e) { toast(errText(e), 'error') }
  }, [dossierId])
  useEffect(() => { setSt(null); setFresh(null); void load() }, [load])

  const run = async (name: string, payload: Record<string, unknown>, ok?: string, checklist = false) => {
    setBusy(true)
    try { const r = await action(name, { dossierId, ...payload }); if (ok) toast(ok); await load(); if (checklist) onChecklistChange?.(); return r }
    catch (e) { toast(errText(e), 'error'); return null }
    finally { setBusy(false) }
  }

  if (!st) return <Card><Empty title="Chargement du Pack Preuves">Grille de risque, liens client et pièces reçues.</Empty></Card>
  const g: RiskGrid = st.parties[party]
  const links = st.links.filter((l) => l.party === party)
  const countries = [...st.fatf.call.map((c) => ({ ...c, list: 'appel à l’action' })), ...st.fatf.grey.map((c) => ({ ...c, list: 'surveillance renforcée' }))]
  const setFactor = (id: string, on: boolean) => run('risk.set', { party, factors: { [id]: on } })
  const createLink = async () => {
    const r = await run('evidence.link.create', { party }, 'Lien créé : copiez-le maintenant, il ne sera plus affiché') as { token: string } | null
    if (r) setFresh({ party, url: depotUrl(r.token) })
  }
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); toast('Lien copié') } catch { toast('Copie impossible : sélectionnez le lien', 'error') } }
  const doExport = async (kind: 'print' | 'json') => {
    const r = await run('evidence.export', {}, kind === 'json' ? 'Export JSON produit' : undefined) as ExportResult | null
    if (!r) return
    if (kind === 'json') return download(`${r.filename}.json`, JSON.stringify(r.json, null, 2), 'application/json')
    const w = window.open('', '_blank')
    if (!w) { download(`${r.filename}.html`, r.html, 'text/html'); return }
    w.document.write(r.html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300)
  }
  const decide = async () => {
    const r = await run('risk.decide', { party, decision, justification: why }, 'Décision consignée', true)
    if (r) { setDecision(''); setWhy('') }
  }
  const log = allLog ? st.log : st.log.slice(0, 8)

  return (
    <div className="space-y-5">
      <div role="radiogroup" aria-label="Partie" className="flex gap-1 rounded-full bg-white/[0.03] p-1 ring-1 ring-white/[0.06] sm:w-max">
        {(['vendeur', 'acquereur'] as const).map((p) => (
          <button key={p} role="radio" aria-checked={party === p} onClick={() => setParty(p)}
            className={clsx('flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-1.5 text-[13px] transition', party === p ? 'bg-white/[0.09] text-bone ring-1 ring-white/10' : 'text-bone/55 hover:text-bone')}>
            {PARTY_L[p]}<Pill tone={LEVEL_TONE[st.parties[p].level]}>{st.catalog.levels[st.parties[p].level]}</Pill>
          </button>
        ))}
      </div>

      <Card title={`Grille de risque — ${g.name}`} kicker={st.country === 'FR' ? 'LCB-FT · CMF L561-4-1 et s.' : 'BCFT · Lei n.º 83/2017'}>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={LEVEL_TONE[g.level]}>Risque {st.catalog.levels[g.level].toLowerCase()}</Pill>
          <Pill>Score {g.score}</Pill>
          <Pill>Vigilance {g.vigilance}</Pill>
          {g.floored && <Pill tone="red">Niveau minimal imposé</Pill>}
          {g.suggestions > 0 && <Pill tone="gold"><Sparkle size={10} weight="fill" />{g.suggestions} suggestion{g.suggestions > 1 ? 's' : ''} à confirmer</Pill>}
        </div>
        {g.reasons.length > 0 && (
          <ul className="mt-3 space-y-1 text-[12.5px] text-bone/75">
            {g.reasons.map((r) => <li key={r.id} className="flex justify-between gap-3"><span>{r.label}</span><span className="num text-mist">+{r.points}</span></li>)}
          </ul>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Field label="Type de client" hint={g.clientType.suggested ? `Suggéré : « ${g.clientType.source} »` : undefined}>
            <Select value={g.clientType.value} disabled={busy} onChange={(e) => void run('risk.set', { party, clientType: e.target.value })}>
              {Object.entries(st.catalog.clientTypes).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </Field>
          {(['residence', 'funds'] as const).map((k) => (
            <Field key={k} label={k === 'residence' ? 'Pays de résidence' : 'Origine des fonds'} hint={g[k].suggested ? `Suggéré : « ${g[k].source} »` : undefined}>
              <Select value={g[k].value} disabled={busy} onChange={(e) => void run('risk.set', { party, [k]: e.target.value })}>
                <option value="">Hors listes GAFI / non renseigné</option>
                {countries.map((c) => <option key={c.code} value={c.code}>{c.fr} — {c.list}</option>)}
              </Select>
            </Field>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-mist">Listes GAFI au {new Date(st.fatf.asOf).toLocaleDateString('fr-FR')} · <a href={st.fatf.source} target="_blank" rel="noopener noreferrer" className="underline">source</a> · {st.fatf.verified}</p>

        <ul className="mt-4 space-y-2">
          {st.catalog.factors.map((f) => {
            const s = g.factors[f.id] ?? { on: false }
            return (
              <li key={f.id} className={clsx('rounded-2xl p-3 ring-1', s.suggested ? 'bg-champagne/[0.05] ring-champagne/25' : 'bg-white/[0.02] ring-white/[0.06]')}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[rgb(var(--acc-500))]" checked={s.on} disabled={busy} onChange={(e) => void setFactor(f.id, e.target.checked)} />
                  <span className="min-w-0 flex-1">
                    <span className="text-[13px]">{f.label}</span> <span className="num text-[11px] text-mist">+{f.points}</span>
                    <span className="block text-[11px] text-mist">{f.law[st.country]}</span>
                    {s.suggested && <span className="mt-1 block text-[11.5px] text-champagne-300"><Sparkle size={10} weight="fill" className="mr-1 inline" />Pré-coché depuis : « {s.source} »</span>}
                  </span>
                </label>
                {s.suggested && (
                  <div className="mt-2 flex gap-1.5 pl-7">
                    <SoftBtn disabled={busy} onClick={() => void setFactor(f.id, true)}>Confirmer</SoftBtn>
                    <SoftBtn disabled={busy} onClick={() => void setFactor(f.id, false)}>Écarter</SoftBtn>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <div className="mt-5 rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06]">
          <h4 className="text-[10.5px] uppercase tracking-eyebrow text-mist">Mesures de vigilance {g.vigilance}</h4>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-[12.5px] text-bone/75">{g.measures.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>

        <div className="mt-5">
          <h4 className="mb-2 flex items-center gap-1.5 text-[10.5px] uppercase tracking-eyebrow text-mist"><Gavel size={12} />Décision du conseiller</h4>
          {g.decision && (
            <div className={clsx('mb-3 rounded-xl p-3 text-[12.5px] ring-1', g.decisionStale ? 'bg-coral/[0.05] ring-coral/25' : 'bg-white/[0.03] ring-white/[0.06]')}>
              <div className="font-medium">{g.decision.label}</div>
              <div className="mt-1 text-bone/75">{g.decision.justification}</div>
              <div className="mt-1 text-[11px] text-mist">{g.decision.by} · {dt(g.decision.at)} · risque {st.catalog.levels[g.decision.level].toLowerCase()} au moment de la décision</div>
              {g.decisionStale && <div className="mt-1 flex items-center gap-1 text-[11.5px] text-coral"><Warning size={12} />Le niveau a changé depuis : consignez une nouvelle décision.</div>}
            </div>
          )}
          <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); void decide() }}>
            <Select value={decision} onChange={(e) => setDecision(e.target.value)} aria-label="Décision">
              <option value="">Choisir une décision…</option>
              {Object.entries(st.catalog.decisions).filter(([k]) => !(g.level === 'eleve' && k === 'accepter')).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Textarea rows={2} value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Justification : pièces vues, cohérence de l’opération, validation obtenue…" aria-label="Justification" />
            <div className="flex justify-end"><SoftBtn type="submit" tone="gold" disabled={busy || !decision || why.trim().length < 10}>Consigner la décision</SoftBtn></div>
          </form>
        </div>
      </Card>

      <Card title="Lien client « pièces et origine des fonds »" kicker={`${PARTY_L[party]} · sans compte · 14 jours`}>
        <p className="text-[12.5px] text-bone/65">Le client voit la liste des pièces ({g.pieces.length}), le texte légal et une déclaration à cocher. Le niveau de risque ne lui est jamais montré.</p>
        <ul className="mt-2 flex flex-wrap gap-1.5">{g.pieces.map((p) => <li key={p.id}><Pill>{p.fr[0]}</Pill></li>)}</ul>
        {fresh?.party === party && (
          <div className="mt-4 rounded-xl bg-champagne/[0.06] p-3 ring-1 ring-champagne/25">
            <div className="text-[11px] text-mist">À copier maintenant (affiché une seule fois)</div>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 break-all text-[12px]">{fresh.url}</code>
              <SoftBtn icon={<Copy size={13} />} onClick={() => void copy(fresh.url)}>Copier</SoftBtn>
            </div>
          </div>
        )}
        <div className="mt-4"><SoftBtn tone="gold" icon={<LinkSimple size={13} />} disabled={busy} onClick={() => void createLink()}>Générer un lien</SoftBtn></div>
        {links.length > 0 && (
          <ul className="mt-4 space-y-2">
            {links.map((l) => {
              const s = linkStatus(l)
              return (
                <li key={l.id} className="flex flex-col gap-2 rounded-xl bg-white/[0.02] p-3 text-[12.5px] ring-1 ring-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5"><Pill tone={s.tone}>{s.l}</Pill><span className="text-mist">…{l.tokenHint} · {l.lang.toUpperCase()}</span></div>
                    <div className="mt-1 text-[11.5px] text-mist">Créé {dt(l.createdAt)} · expire {dt(l.expiresAt)} · {l.uses}/{l.maxUses} dépôt(s)</div>
                  </div>
                  {s.l !== 'Révoqué' && s.l !== 'Expiré' && <SoftBtn icon={<Prohibit size={13} />} disabled={busy} onClick={() => void run('evidence.link.revoke', { id: l.id }, 'Lien révoqué')}>Révoquer</SoftBtn>}
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card title="Pièces reçues" kicker={`${st.proofs.length} élément(s) · empreinte SHA-256`}>
        {!st.proofs.length ? <Empty title="Aucune pièce reçue">Les dépôts du client apparaissent ici et sur le point de la checklist correspondant.</Empty> : (
          <ul className="space-y-2">
            {st.proofs.map((p) => (
              <li key={p.id} className="rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/[0.06]">
                <div className="flex items-start gap-2">
                  {p.kind === 'file' ? <FileText size={16} className="mt-0.5 shrink-0 text-champagne-300" /> : <CheckCircle size={16} className="mt-0.5 shrink-0 text-champagne-300" />}
                  <div className="min-w-0 flex-1">
                    {p.fileId ? <a href={`/api/files/${p.fileId}/raw`} target="_blank" rel="noreferrer" className="break-all text-[13px] hover:underline">{p.name}</a> : <span className="text-[13px]">{p.name}</span>}
                    <div className="text-[11.5px] text-mist">{PARTY_L[p.party]} → point « {p.itemId} » · {dt(p.at)}{p.size ? ` · ${Math.max(1, Math.round(p.size / 1024))} Ko` : ''}</div>
                    <div className="mt-1 flex items-center gap-1 break-all font-mono text-[10.5px] text-mist"><Fingerprint size={11} className="shrink-0" />{p.sha256}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Historique horodaté" kicker="Qui · quand · quoi" action={st.log.length > 8 ? <SoftBtn onClick={() => setAllLog(!allLog)}>{allLog ? 'Réduire' : `Tout (${st.log.length})`}</SoftBtn> : undefined}>
        {!st.log.length ? <Empty title="Aucun événement">Chaque changement de la checklist, de la grille et des liens sera consigné ici.</Empty> : (
          <ol className="space-y-2">
            {log.map((e) => (
              <li key={e.id} className="flex gap-3 text-[12.5px]">
                <ClockCounterClockwise size={14} className="mt-0.5 shrink-0 text-mist" />
                <div className="min-w-0"><span className="text-mist">{dt(e.at)} · {e.by}</span><div className="text-bone/80">{e.what}</div></div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card title="Export de contrôle" kicker="DGCCRF · IMPIC · en 1 clic">
        <p className="text-[12.5px] text-bone/65">« Dossier de vigilance » : parties, grilles et décisions, pièces avec empreinte, historique, mentions, empreinte de l’export lui-même.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <SoftBtn tone="gold" icon={<Printer size={13} />} disabled={busy} onClick={() => void doExport('print')}>Imprimer / PDF</SoftBtn>
          <SoftBtn icon={<DownloadSimple size={13} />} disabled={busy} onClick={() => void doExport('json')}>Export JSON</SoftBtn>
        </div>
        {st.exports[0] && <p className="mt-3 break-all text-[11px] text-mist">Dernier export : {dt(st.exports[0].at)} · SHA-256 <span className="font-mono">{st.exports[0].sha256}</span></p>}
      </Card>
    </div>
  )
}

export function ImpicPanel() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1)
  const [res, setRes] = useState<ImpicResult | null>(null)
  useEffect(() => { action<ImpicResult>('impic.quarter', { year, quarter }).then(setRes).catch((e) => toast(errText(e), 'error')) }, [year, quarter])
  return (
    <Card title="Reporte trimestral IMPIC" kicker="Anexo B pré-preenchido · campos a confirmar">
      <div className="flex flex-wrap gap-3">
        <Field label="Ano"><Select value={year} onChange={(e) => setYear(Number(e.target.value))}>{[0, 1, 2].map((k) => <option key={k} value={now.getFullYear() - k}>{now.getFullYear() - k}</option>)}</Select></Field>
        <Field label="Trimestre"><Select value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}>{[1, 2, 3, 4].map((q) => <option key={q} value={q}>T{q}</option>)}</Select></Field>
      </div>
      {res && (
        <>
          <p className="mt-3 rounded-xl bg-white/[0.02] px-3 py-2 text-[12px] text-bone/65 ring-1 ring-white/[0.06]">{res.note}</p>
          {!res.rows.length ? <div className="mt-4"><Empty title="Nenhuma escritura">Nenhum dossier na fase « acte » com escritura entre {res.from} e {res.to}.</Empty></div> : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[12px]">
                <thead className="text-[10.5px] uppercase tracking-eyebrow text-mist"><tr>{['dossier', 'data_escritura', 'valor_eur', 'vendedor_nome', 'comprador_nome', 'meio_pagamento', 'campos_em_falta'].map((k) => <th key={k} className="px-2 py-2 font-normal">{res.fields.find((f) => f.key === k)?.label ?? k}</th>)}</tr></thead>
                <tbody>{res.rows.map((r) => (
                  <tr key={String(r.dossier)} className="border-t border-white/[0.06]">
                    {['dossier', 'data_escritura', 'valor_eur', 'vendedor_nome', 'comprador_nome', 'meio_pagamento', 'campos_em_falta'].map((k) => <td key={k} className={clsx('px-2 py-2', k === 'campos_em_falta' && 'text-coral')}>{k === 'valor_eur' && r[k] ? Number(r[k]).toLocaleString('pt-PT') + ' €' : String(r[k] || '—')}</td>)}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <div className="mt-4"><SoftBtn tone="gold" icon={<DownloadSimple size={13} />} disabled={!res.rows.length} onClick={() => download(res.filename, res.csv, 'text/csv;charset=utf-8')}>Exportar CSV</SoftBtn></div>
        </>
      )}
    </Card>
  )
}
