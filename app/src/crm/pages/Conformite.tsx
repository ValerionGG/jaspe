import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { ShieldCheck, Warning, CheckCircle, Prohibit, ArrowCounterClockwise, Scales, ArrowSquareOut, Sparkle, Funnel, Info } from '@phosphor-icons/react'
import { PageHeader, Card, Tabs, SoftBtn, Stagger, Empty } from '../ui'
import { Pill, Ring } from '../../ui/kit'
import { STAGES } from '../../data/mock'
import { useCompliance, useRegwatch, useDossiers, useProperties, useSettings } from '../../data/collections'
import type { Compliance, CmpItem, CmpState, RegWatch } from '../../data/assist'
import { action } from '../../data/store'
import { Modal, Field, Textarea, toast, errText } from '../forms'
import { PreuvesPanel, ImpicPanel } from './conformite-preuves'

type Country = 'FR' | 'PT'
const STATE: Record<CmpState, { l: string; tone: 'green' | 'red' | 'neutral' | 'blue' }> = {
  ok: { l: 'Conforme', tone: 'green' },
  blocked: { l: 'Bloquant', tone: 'red' },
  todo: { l: 'À faire', tone: 'neutral' },
  na: { l: 'Non applicable', tone: 'blue' },
}
const WATCH_TONE: Record<RegWatch['status'], 'green' | 'gold' | 'blue'> = { 'en vigueur': 'green', 'à venir': 'gold', 'à surveiller': 'blue' }
const SIDE: Record<string, string> = { vendeur: 'Vendeur', 'acquéreur': 'Acquéreur', agence: 'Agence' }
const stageLabel = (s: string) => STAGES.find((x) => x.id === s)?.label ?? s
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export default function Conformite() {
  const [dossiers] = useDossiers()
  const [props] = useProperties()
  const [stored] = useCompliance()
  const [watch] = useRegwatch()
  const [settings] = useSettings()
  const [local, setLocal] = useState<Record<string, Compliance>>({})
  const [tab, setTab] = useState<'dossiers' | 'veille' | 'impic'>('dossiers')
  const [pane, setPane] = useState<'checklist' | 'preuves'>('checklist')
  const [selId, setSelId] = useState<string | null>(null)
  const [onlyDue, setOnlyDue] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [modal, setModal] = useState<{ item: CmpItem; mode: 'ok' | 'na' } | null>(null)
  const [evidence, setEvidence] = useState('')
  const [saving, setSaving] = useState(false)
  const ran = useRef(false)
  const detailRef = useRef<HTMLDivElement>(null)

  const agency = settings.find((s) => s.id === 'agency') as { country?: Country } | undefined
  const country: Country = agency?.country === 'PT' ? 'PT' : 'FR'

  /** Évalue chaque dossier en série ; les résultats sont gardés localement pour un affichage immédiat. */
  const evaluateAll = async (ids: string[]) => {
    setEvaluating(true)
    let failed = 0
    for (const id of ids) {
      try { const doc = await action<Compliance>('compliance.evaluate', { dossierId: id }); setLocal((m) => ({ ...m, [id]: doc })) }
      catch { failed++ }
    }
    setEvaluating(false)
    if (failed) toast(`${failed} dossier${failed > 1 ? 's' : ''} non évalué${failed > 1 ? 's' : ''}`, 'error')
  }

  useEffect(() => {
    if (ran.current || !dossiers.length) return
    ran.current = true
    void evaluateAll(dossiers.map((d) => d.id))
    // Une seule passe au montage, volontairement indépendante des rendus suivants.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossiers.length])

  const cmpOf = (dossierId: string): Compliance | undefined => {
    const a = local[dossierId], b = (stored as Compliance[]).find((c) => c.dossierId === dossierId)
    if (!a) return b
    if (!b) return a
    return new Date(b.at) > new Date(a.at) ? b : a
  }

  const rows = useMemo(() => dossiers
    .map((d) => ({ d, c: cmpOf(d.id), p: props.find((p) => p.id === d.propertyId) }))
    .sort((x, y) => (y.c?.blocking ?? 0) - (x.c?.blocking ?? 0) || (x.c?.score ?? 100) - (y.c?.score ?? 100)),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [dossiers, props, stored, local])

  const selected = rows.find((r) => r.d.id === selId) ?? null
  const totalBlocking = rows.reduce((n, r) => n + (r.c?.blocking ?? 0), 0)

  const switchCountry = async (c: Country) => {
    if (c === country || switching) return
    setSwitching(true)
    try {
      await action('settings.country', { country: c })
      toast(c === 'FR' ? 'Référentiel France appliqué' : 'Référentiel Portugal appliqué')
      await evaluateAll(dossiers.map((d) => d.id))
    } catch (e) { toast(errText(e), 'error') }
    finally { setSwitching(false) }
  }

  const setState = async (item: CmpItem, state: CmpState, ev: string) => {
    if (!selected) return false
    try {
      const doc = await action<Compliance>('compliance.set', { dossierId: selected.d.id, itemId: item.id, state, evidence: ev })
      setLocal((m) => ({ ...m, [selected.d.id]: doc }))
      toast(state === 'ok' ? 'Point validé' : state === 'na' ? 'Marqué non applicable' : 'Remis à faire')
      return true
    } catch (e) { toast(errText(e), 'error'); return false }
  }

  // Une pièce reçue par lien client pré-remplit la preuve : le conseiller la vérifie avant de valider.
  const proofText = (item: CmpItem) => (item.proofs?.length ? `Reçu par lien client : ${item.proofs.map((p) => `${p.name} (${new Date(p.at).toLocaleDateString('fr-FR')}, SHA-256 ${p.sha256.slice(0, 12)}…)`).join(' ; ')}` : '')
  const openModal = (item: CmpItem, mode: 'ok' | 'na') => { setEvidence(item.state === mode ? item.evidence : mode === 'ok' ? proofText(item) : ''); setModal({ item, mode }) }
  const refreshSelected = async () => {
    if (!selected) return
    try { const doc = await action<Compliance>('compliance.evaluate', { dossierId: selected.d.id }); setLocal((m) => ({ ...m, [selected.d.id]: doc })) } catch { /* affichage existant conservé */ }
  }
  const submitModal = async () => {
    if (!modal || !evidence.trim()) return
    setSaving(true)
    const ok = await setState(modal.item, modal.mode, evidence.trim())
    setSaving(false)
    if (ok) setModal(null)
  }

  const select = (id: string) => {
    setSelId(id)
    requestAnimationFrame(() => { if (window.innerWidth < 1024) detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) })
  }

  const watchList = (watch as RegWatch[]).filter((w) => w.country === country || w.country === 'UE').sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <PageHeader
        kicker="Légal"
        title="Conformité & veille légale"
        sub="Le contrôle dossier par dossier des obligations de l’agent, et le suivi des textes qui changent."
        actions={
          <div role="radiogroup" aria-label="Pays du référentiel" className="flex gap-1 rounded-full bg-white/[0.03] p-1 ring-1 ring-white/[0.06]">
            {(['FR', 'PT'] as const).map((c) => (
              <button key={c} role="radio" aria-checked={country === c} disabled={switching} onClick={() => switchCountry(c)}
                className={clsx('rounded-full px-3.5 py-1.5 text-[13px] transition', country === c ? 'bg-white/[0.09] text-bone ring-1 ring-white/10' : 'text-bone/55 hover:text-bone', switching && 'opacity-60')}>
                {c === 'FR' ? 'France' : 'Portugal'}
              </button>
            ))}
          </div>
        }
      />

      <Stagger className="mb-6 flex items-start gap-3 rounded-2xl bg-white/[0.02] px-4 py-3 text-[12.5px] text-bone/60 ring-1 ring-white/[0.06]">
        <Info size={16} className="mt-0.5 shrink-0 text-mist" />
        <p>Aide à la conformité : chaque point cite son texte ; validez avec votre juriste ou votre réseau. Ces informations ne constituent pas un conseil juridique.</p>
      </Stagger>

      <div className="mb-6">
        <Tabs id="conformite" value={tab} onChange={setTab} items={[
          { id: 'dossiers', label: 'Dossiers', count: totalBlocking || undefined },
          { id: 'veille', label: 'Veille réglementaire', count: watchList.length },
          ...(country === 'PT' ? [{ id: 'impic' as const, label: 'IMPIC trimestral' }] : []),
        ]} />
      </div>

      {tab === 'dossiers' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] [&>*]:min-w-0">
          <Card pad={false} title="Dossiers" kicker={evaluating ? 'Évaluation en cours…' : `Référentiel ${country === 'FR' ? 'France' : 'Portugal'}`}>
            {!rows.length ? <div className="p-5"><Empty title="Aucun dossier">Créez un dossier pour suivre sa conformité.</Empty></div> : (
              <ul className="space-y-1 px-2 pb-2">
                {rows.map(({ d, c, p }) => (
                  <li key={d.id}>
                    <button onClick={() => select(d.id)} aria-pressed={selId === d.id}
                      className={clsx('flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ring-1 transition', selId === d.id ? 'bg-champagne/[0.06] ring-champagne/25' : 'ring-transparent hover:bg-white/[0.03]')}>
                      <Ring value={c?.score ?? 0} size={42}><span className="num text-[11px]">{c ? c.score : '–'}</span></Ring>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-medium">{d.seller}</div>
                        <div className="truncate text-[11.5px] text-mist">{p ? `${p.title} · ${p.city}` : d.ref} · {stageLabel(d.stage)}</div>
                      </div>
                      {c ? (c.blocking ? <Pill tone="red"><Warning size={11} weight="bold" />{c.blocking}</Pill> : <Pill tone="green"><CheckCircle size={11} weight="bold" />OK</Pill>) : <Pill>…</Pill>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div ref={detailRef} className="scroll-mt-6 space-y-4">
            {selected && (
              <div role="tablist" aria-label="Vue du dossier" className="flex gap-1 rounded-full bg-white/[0.03] p-1 ring-1 ring-white/[0.06] sm:w-max">
                {([['checklist', 'Checklist'], ['preuves', 'Preuves']] as const).map(([k, l]) => (
                  <button key={k} role="tab" aria-selected={pane === k} onClick={() => setPane(k)}
                    className={clsx('flex-1 rounded-full px-4 py-1.5 text-[13px] transition', pane === k ? 'bg-white/[0.09] text-bone ring-1 ring-white/10' : 'text-bone/55 hover:text-bone')}>
                    {l}{k === 'preuves' && <span className="ml-1.5 text-[10.5px] text-champagne-300">Pack Preuves</span>}
                  </button>
                ))}
              </div>
            )}
            {selected && pane === 'preuves' ? (
              <PreuvesPanel dossierId={selected.d.id} onChecklistChange={() => void refreshSelected()} />
            ) : !selected ? (
              <Card><Empty title="Choisissez un dossier">Le détail des points de contrôle s’affiche ici, groupé par phase.</Empty></Card>
            ) : !selected.c ? (
              <Card><Empty title="Évaluation en cours">Le dossier {selected.d.ref} est en cours d’analyse.</Empty></Card>
            ) : (
              <Detail cmp={selected.c} title={selected.d.seller} sub={`${selected.d.ref} · ${stageLabel(selected.d.stage)}`} onlyDue={onlyDue} setOnlyDue={setOnlyDue}
                onValidate={(i) => openModal(i, 'ok')} onNa={(i) => openModal(i, 'na')} onTodo={(i) => void setState(i, i.due && i.required ? 'blocked' : 'todo', '')} />
            )}
          </div>
        </div>
      )}

      {tab === 'impic' && country === 'PT' && <ImpicPanel />}

      {tab === 'veille' && (
        <div className="space-y-4">
          {!watchList.length && <Empty title="Aucun texte suivi">Aucune entrée de veille pour ce pays.</Empty>}
          {watchList.map((w, i) => (
            <Stagger key={w.id} i={i}>
              <Card>
                <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-mist">
                  <Pill tone={WATCH_TONE[w.status]}>{w.status}</Pill>
                  <Pill>{w.country === 'UE' ? 'Union européenne' : w.country === 'FR' ? 'France' : 'Portugal'}</Pill>
                  <span>{fmtDate(w.date)}</span>
                </div>
                <h3 className="mt-3 text-[15.5px] font-medium tracking-[-0.01em]">{w.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-bone/70">{w.summary}</p>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/[0.06]"><dt className="text-[10.5px] uppercase tracking-eyebrow text-mist">Impact</dt><dd className="mt-1 text-[13px] text-bone/80">{w.impact}</dd></div>
                  <div className="rounded-xl bg-white/[0.02] p-3 ring-1 ring-white/[0.06]"><dt className="text-[10.5px] uppercase tracking-eyebrow text-mist">Action recommandée</dt><dd className="mt-1 text-[13px] text-bone/80">{w.action}</dd></div>
                </dl>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12px]">
                  <a href={w.source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-champagne-300 hover:underline"><ArrowSquareOut size={13} />{w.sourceLabel}</a>
                  <span className="text-mist">Vérifié : {w.verified}</span>
                </div>
              </Card>
            </Stagger>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} kicker={modal?.item.law} title={modal?.mode === 'ok' ? 'Valider le point' : 'Non applicable'}>
        {modal && (
          <form onSubmit={(e) => { e.preventDefault(); void submitModal() }} className="space-y-5">
            <p className="text-[13.5px] leading-relaxed text-bone/75">{modal.item.label}</p>
            <Field label={modal.mode === 'ok' ? 'Preuve ou référence du document' : 'Motif'} hint={modal.mode === 'ok' ? 'Obligatoire : numéro, date, nom du fichier ou du document conservé.' : 'Obligatoire : pourquoi ce point ne s’applique pas à ce dossier.'}>
              <Textarea autoFocus required rows={3} value={evidence} onChange={(e) => setEvidence(e.target.value)}
                placeholder={modal.mode === 'ok' ? 'Ex. : registre des mandats n° 2026-041, signé le 12/11' : 'Ex. : bien hors copropriété'} />
            </Field>
            <div className="flex flex-wrap justify-end gap-2">
              <SoftBtn onClick={() => setModal(null)}>Annuler</SoftBtn>
              <SoftBtn type="submit" tone="gold" disabled={saving || !evidence.trim()}>{saving ? 'Enregistrement…' : modal.mode === 'ok' ? 'Valider' : 'Enregistrer'}</SoftBtn>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

function Detail({ cmp, title, sub, onlyDue, setOnlyDue, onValidate, onNa, onTodo }: {
  cmp: Compliance; title: string; sub: string; onlyDue: boolean; setOnlyDue: (v: boolean) => void
  onValidate: (i: CmpItem) => void; onNa: (i: CmpItem) => void; onTodo: (i: CmpItem) => void
}) {
  const items = cmp.items.filter((i) => !onlyDue || i.due)
  const urgent = cmp.items.filter((i) => i.due && i.required && i.state === 'blocked')
  const phases = [...new Set(items.map((i) => i.phase))]
  const done = cmp.items.filter((i) => i.state === 'ok' || i.state === 'na').length

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Ring value={cmp.score} size={56} stroke={4}><span className="num text-[13px]">{cmp.score}</span></Ring>
          <div>
            <h2 className="text-[16px] font-medium tracking-[-0.01em]">{title}</h2>
            <div className="text-[12px] text-mist">{sub}</div>
            <div className="mt-1 text-[12px] text-bone/55">{done} / {cmp.items.length} points traités · {cmp.country === 'FR' ? 'France' : 'Portugal'}</div>
          </div>
        </div>
        <button onClick={() => setOnlyDue(!onlyDue)} aria-pressed={onlyDue}
          className={clsx('inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] ring-1 transition', onlyDue ? 'bg-champagne/15 text-champagne-300 ring-champagne/30' : 'bg-white/[0.03] text-bone/70 ring-white/[0.08] hover:text-bone')}>
          <Funnel size={13} />Seulement l’exigible maintenant
        </button>
      </div>

      {urgent.length > 0 && (
        <div className="mt-5 rounded-2xl bg-coral/[0.06] p-4 ring-1 ring-coral/25">
          <div className="flex items-center gap-2 text-[13px] font-medium text-coral"><Warning size={15} weight="bold" />{urgent.length} point{urgent.length > 1 ? 's' : ''} exigible{urgent.length > 1 ? 's' : ''} à cette étape</div>
          <ul className="mt-2 space-y-1.5">
            {urgent.map((i) => (
              <li key={i.id} className="flex flex-col gap-2 text-[12.5px] sm:flex-row sm:items-center sm:justify-between">
                <span className="text-bone/80">{i.label}</span>
                <SoftBtn onClick={() => onValidate(i)} icon={<CheckCircle size={13} />}>Valider</SoftBtn>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!items.length && <div className="mt-6"><Empty title="Rien d’exigible">Aucun point n’est exigible à l’étape actuelle du dossier.</Empty></div>}

      <div className="mt-6 space-y-6">
        {phases.map((ph) => (
          <section key={ph}>
            <h3 className="mb-2 text-[10.5px] uppercase tracking-eyebrow text-mist">{ph}</h3>
            <ul className="space-y-2">
              {items.filter((i) => i.phase === ph).map((i) => {
                const st = STATE[i.state]
                const hot = i.due && i.required && i.state === 'blocked'
                return (
                  <li key={i.id} className={clsx('rounded-2xl p-3.5 ring-1', hot ? 'bg-coral/[0.04] ring-coral/25' : 'bg-white/[0.02] ring-white/[0.06]')}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Pill tone={st.tone}>{st.l}</Pill>
                      <Pill>{SIDE[i.side] ?? i.side}</Pill>
                      {!i.required && <Pill>Selon le bien</Pill>}
                      {i.auto && <Pill tone="gold"><Sparkle size={10} weight="fill" />Déduit du dossier</Pill>}
                    </div>
                    <p className="mt-2 text-[13.5px] leading-snug">{i.label}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-mist"><Scales size={12} />{i.law}</p>
                    {i.proofs && i.proofs.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {i.proofs.map((p) => (
                          <li key={p.id} className="flex flex-wrap items-center gap-1.5 text-[11.5px] text-bone/70">
                            <Pill tone="gold">{p.kind === 'file' ? 'Pièce reçue' : 'Déclaration'}</Pill>
                            {p.fileId ? <a href={`/api/files/${p.fileId}/raw`} target="_blank" rel="noreferrer" className="break-all hover:underline">{p.name}</a> : <span>{p.name}</span>}
                            <span className="text-mist">· {new Date(p.at).toLocaleDateString('fr-FR')} · SHA-256 {p.sha256.slice(0, 10)}…</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {i.evidence && <p className="mt-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5 text-[12px] text-bone/70 ring-1 ring-white/[0.05]"><span className="text-mist">{i.state === 'na' ? 'Motif' : 'Preuve'} : </span>{i.evidence}{i.by && !i.auto && <span className="text-mist"> · {i.by}{i.updatedAt ? `, ${new Date(i.updatedAt).toLocaleDateString('fr-FR')}` : ''}</span>}</p>}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {i.state !== 'ok' && <SoftBtn onClick={() => onValidate(i)} icon={<ShieldCheck size={13} />}>Valider</SoftBtn>}
                      {i.state !== 'na' && <SoftBtn onClick={() => onNa(i)} icon={<Prohibit size={13} />}>Non applicable</SoftBtn>}
                      {(i.state === 'ok' || i.state === 'na') && <SoftBtn onClick={() => onTodo(i)} icon={<ArrowCounterClockwise size={13} />}>À faire</SoftBtn>}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </Card>
  )
}
