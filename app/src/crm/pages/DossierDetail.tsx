import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { Sparkle, MapPin, Ruler, Bed, Tree, Lightning, CheckCircle, Warning, FileText, Phone, EnvelopeSimple, ShareNetwork, DotsThree, X, ArrowsClockwise, Eye, PencilSimple, Printer, UploadSimple, Link as LinkIcon } from '@phosphor-icons/react'
import { Card, Tabs, SoftBtn, Stagger, DELIV_TONE, IconBtn } from '../ui'
import { Avatar, Ring, EXPO } from '../../ui/kit'
import { DOSSIERS, DELIVERABLES, prop, agent, eur, fmt, type DelivState } from '../../data/mock'
import { useDossiers, useFiles, useActivity, useNotes, type DocumentDoc } from '../../data/collections'
import { useDoc, action, uploadFile, type Doc } from '../../data/store'
import { AsyncForm, Field, Input, Textarea, toast, errText } from '../forms'
import { JourneyStepper, currentStep, type StepId } from '../dossier/Stepper'
import { StepView } from '../dossier'
import { useJourney } from '../dossier/useJourney'

const DPE_C = { A: '#3F8F5A', B: '#6BAF5B', C: '#B8C94A', D: '#F2D43A', E: '#F0A43A', F: '#E86F3A', G: '#D4402F' }

/** Rendu fidèle d’un livrable généré, sur papier clair (thème forcé). */
export function DocPaper({ doc }: { doc: DocumentDoc }) {
  const kind = { email: 'E-mail', message: 'Message interne', letter: 'Courrier', social: 'Réseaux sociaux', checklist: 'Checklist', report: 'Document' }[doc.kind] ?? 'Document'
  return (
    <div className="theme-dark mt-6 rounded-2xl bg-bone-50 p-7 text-ink shadow-float">
      <div className="flex items-center justify-between border-b border-ink/10 pb-4"><span className="font-serif text-xl italic">Maison Riviera · Antibes</span><span className="text-[10px] uppercase tracking-eyebrow text-ink/50">{kind} · v{doc.version}</span></div>
      {doc.to && <div className="mt-4 text-[12px] text-ink/55">À : {doc.to}</div>}
      {doc.subject && <div className="mt-1 text-[14px] font-medium">{doc.subject}</div>}
      <div className="space-y-3 pt-4 text-[13.5px] leading-relaxed text-ink/80">{doc.body.map((b, i) => <p key={i} className="whitespace-pre-line">{b}</p>)}</div>
      {doc.range && <div className="mt-5"><div className="flex items-baseline justify-between"><span className="text-[11px] uppercase tracking-eyebrow text-ink/50">Fourchette</span><span className="font-serif text-3xl">{eur(doc.range[0])} – {eur(doc.range[1])}</span></div><div className="relative mt-2 h-2 rounded-full bg-ink/10"><div className="absolute inset-y-0 left-[22%] right-[18%] rounded-full bg-champagne-600" /></div></div>}
      {doc.posts && <div className="mt-5 grid gap-3 sm:grid-cols-3">{doc.posts.map((p) => <div key={p.network} className="rounded-xl bg-ink/[0.04] p-3 text-[12px]"><div className="mb-1 font-medium">{p.network}</div><p className="text-ink/70">{p.text}</p>{p.label && <div className="mt-2 inline-block rounded bg-ink px-1.5 py-0.5 text-[9.5px] text-bone">{p.label}</div>}</div>)}</div>}
      {doc.items && <ul className="mt-5 space-y-1.5">{doc.items.map((it) => <li key={it.label} className="flex items-center justify-between rounded-lg bg-ink/[0.04] px-3 py-2 text-[12.5px]"><span>{it.label}</span><span className={it.state === 'ok' ? 'text-sage-600' : it.state === 'missing' ? 'text-coral' : 'text-champagne-700'}>{it.state === 'ok' ? `Vérifié · ${it.ref}` : it.state === 'missing' ? 'Manquant' : 'À vérifier'}</span></li>)}</ul>}
      {doc.matches && doc.matches.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{doc.matches.map((m) => <span key={m.id} className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-[11px]">{m.name} · {m.score}</span>)}</div>}
      <div className="mt-6 border-t border-ink/10 pt-3 text-[10.5px] text-ink/50">Sources : {doc.sources.map((s) => `${s.label} (${s.date})`).join(' · ') || '—'}</div>
    </div>
  )
}

const EXTERNAL_CODES = ['L1', 'L3', 'L4', 'L5', 'L6', 'L7']

function Preview({ code, onClose, state, dossierId }: { code: string; onClose: () => void; state: DelivState; dossierId: string }) {
  const d = DELIVERABLES.find((x) => x.code === code)!
  const doc = useDoc<DocumentDoc & Doc>('documents', `${dossierId}-${code}`)
  const [busy, setBusy] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const run = async (k: string, f: () => Promise<unknown>, ok: string) => { setBusy(k); try { await f(); toast(ok) } catch (x) { toast(errText(x), 'error') } finally { setBusy(null) } }
  const checks: [string, boolean][] = doc?.checks?.length ? doc.checks.map((c) => [c, false]) : [['Chiffres et noms issus du dossier', true], ['Sources citées et datées', true], ['Marque et signature de l’agence', true]]
  return (
    <motion.div className="fixed inset-0 z-[70] flex justify-end bg-ink/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div onClick={(e) => e.stopPropagation()} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 60, opacity: 0 }} transition={{ duration: 0.5, ease: EXPO }} className="thin-scroll h-full w-full max-w-[640px] overflow-y-auto border-l border-white/[0.07] bg-ink-850 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><span className="num rounded-full bg-champagne/15 px-2.5 py-1 text-[12px] text-champagne-300">{code}</span><span className={`rounded-full px-2 py-0.5 text-[11px] ring-1 ${DELIV_TONE[state].c}`}>{DELIV_TONE[state].l}</span></div>
          <IconBtn label="Fermer" onClick={onClose}><X size={15} /></IconBtn>
        </div>
        <h2 className="display mt-5 text-4xl">{d.name}</h2>
        <div className="mt-2 text-[12px] text-mist">{doc ? `Version ${doc.version} · préparée le ${new Date(doc.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}${doc.edited ? ' · modifiée' : ''}${doc.validatedAt ? ' · validée' : ''}` : 'Pas encore généré.'}</div>
        {!doc && (
          <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <Sparkle size={22} className="mx-auto text-champagne" />
            <p className="mt-3 text-[13.5px] text-bone/60">Le copilote prépare ce livrable à partir des faits du dossier, avec ses sources.</p>
            <div className="mt-5"><SoftBtn tone="gold" icon={<Sparkle size={13} weight="fill" />} onClick={() => run('gen', () => action('deliverable.generate', { dossierId, code }), `${code} généré`)}>{busy === 'gen' ? 'Génération…' : 'Générer maintenant'}</SoftBtn></div>
          </div>
        )}
        {doc && editing && (
          <div className="mt-6">
            <AsyncForm submitLabel="Enregistrer la version" success="Nouvelle version enregistrée" onCancel={() => setEditing(false)} onSubmit={async (v) => { await action('deliverable.edit', { dossierId, code, subject: v.subject, body: v.body.split(/\n{2,}/) }); setEditing(false) }}>
              {doc.subject !== undefined && <Field label="Objet"><Input name="subject" defaultValue={doc.subject} /></Field>}
              <Field label="Texte (un paragraphe par bloc)"><Textarea name="body" rows={14} defaultValue={doc.body.join('\n\n')} /></Field>
            </AsyncForm>
          </div>
        )}
        {doc && !editing && (
          <>
            <DocPaper doc={doc} />
            <div className="mt-6 space-y-2">
              <div className="text-[11px] uppercase tracking-eyebrow text-mist">Contrôles avant envoi</div>
              {checks.map(([t, ok]) => <div key={t} className="flex items-center gap-2.5 rounded-xl bg-white/[0.02] px-3 py-2.5 text-[13px] ring-1 ring-white/[0.05]">{ok ? <CheckCircle size={16} weight="fill" className="text-sage" /> : <Warning size={16} weight="fill" className="text-coral" />}{t}</div>)}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {state !== 'done' && <SoftBtn tone="gold" icon={<CheckCircle size={14} />} onClick={() => run('ok', () => action('deliverable.validate', { dossierId, code }), EXTERNAL_CODES.includes(code) ? 'Validé — envoi programmé' : 'Validé')}>{busy === 'ok' ? 'Validation…' : 'Valider'}</SoftBtn>}
              <SoftBtn icon={<PencilSimple size={14} />} onClick={() => setEditing(true)}>Modifier</SoftBtn>
              <SoftBtn icon={<ArrowsClockwise size={14} />} onClick={() => run('re', () => action('deliverable.generate', { dossierId, code }), 'Nouvelle version générée')}>{busy === 're' ? 'Génération…' : 'Régénérer'}</SoftBtn>
              <SoftBtn icon={<Printer size={14} />} onClick={() => window.print()}>Imprimer / PDF</SoftBtn>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function DossierDetail() {
  const { id } = useParams()
  const [dossiers] = useDossiers()
  const d = dossiers.find((x) => x.id === id) ?? DOSSIERS.find((x) => x.id === id) ?? dossiers[0]
  const [files] = useFiles()
  const [activity] = useActivity()
  const [notes, noteOps] = useNotes()
  const [uploading, setUploading] = useState(false)
  const myFiles = files.filter((f) => f.dossierId === d.id)
  const myLog = [...notes.filter((n) => n.dossierId === d.id).map((n) => ({ t: new Date(n.at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }), who: n.by, what: n.text, tone: 'note' })), ...activity.filter((x) => x.link === `/app/dossiers/${d.id}`).map((x) => ({ t: x.t, who: x.who, what: x.what, tone: x.tone }))]
  const onUpload = async (list: FileList | null) => {
    if (!list?.length) return
    setUploading(true)
    try { for (const f of Array.from(list)) { if (f.size > 8e6) throw new Error(`${f.name} dépasse 8 Mo`); await uploadFile(f, d.id) } toast(`${list.length} pièce(s) déposée(s)`) } catch (x) { toast(errText(x), 'error') } finally { setUploading(false) }
  }
  const p = prop(d.propertyId), a = agent(d.agentId)
  const [tab, setTab] = useState<'parcours' | 'bien' | 'documents' | 'journal'>('parcours')
  const { journey, save } = useJourney(d.id)
  const [step, setStep] = useState<StepId>(() => currentStep(d))
  const [open, setOpen] = useState<string | null>(null)
  const [photo, setPhoto] = useState(0)
  const ready = Object.values(d.deliverables).filter((s) => s === 'done').length

  return (
    <div>
      {/* Bandeau photo */}
      <Stagger>
        <div className="theme-dark relative -mx-4 -mt-8 h-[46vh] min-h-[360px] overflow-hidden md:mx-0 md:mt-0 md:rounded-[2rem]">
          <AnimatePresence mode="popLayout"><motion.img key={photo} src={p.gallery[photo]} alt={p.title} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1, ease: EXPO }} className="absolute inset-0 h-full w-full object-cover" /></AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/10" />
          <div className="absolute right-5 top-5 flex gap-2"><IconBtn label="Partager"><ShareNetwork size={15} /></IconBtn><IconBtn label="Plus"><DotsThree size={15} weight="bold" /></IconBtn></div>
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-6 md:flex-row md:items-end md:justify-between md:p-8">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[11px]"><span className="num rounded-full bg-ink/60 px-2.5 py-1 backdrop-blur">{d.ref}</span>{d.mandate && <span className="rounded-full bg-champagne px-2.5 py-1 font-medium text-ink">Mandat {d.mandate.toLowerCase()}</span>}{d.tags.map((t) => <span key={t} className="rounded-full bg-white/10 px-2.5 py-1 backdrop-blur">{t}</span>)}</div>
              <h1 className="display mt-3 text-4xl md:text-6xl">{p.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-bone/70"><span className="flex items-center gap-1.5"><MapPin size={14} />{p.address}, {p.city}</span><span className="flex items-center gap-1.5"><Ruler size={14} />{p.surface} m²</span><span className="flex items-center gap-1.5"><Bed size={14} />{p.rooms} pièces</span>{p.land && <span className="flex items-center gap-1.5"><Tree size={14} />{fmt(p.land)} m²</span>}</div>
            </div>
            <div className="flex items-end gap-4">
              <div className="flex gap-1.5">{p.gallery.map((g, i) => <button key={g} onClick={() => setPhoto(i)} className={`h-12 w-16 overflow-hidden rounded-lg ring-2 transition ${i === photo ? 'ring-champagne' : 'ring-transparent opacity-60 hover:opacity-100'}`}><img src={g} alt="" className="h-full w-full object-cover" /></button>)}</div>
              <div className="text-right"><div className="text-[11px] text-mist">Prix de présentation</div><div className="display text-4xl">{eur(p.price)}</div></div>
            </div>
          </div>
        </div>
      </Stagger>

      {/* Parcours vendeur — stepper */}
      <Stagger i={1} className="mt-6">
        {journey && <JourneyStepper dossier={d} journey={journey} step={step} onStep={(x) => { setStep(x); setTab('parcours') }} />}
      </Stagger>

      <div className="mt-6 grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <Stagger i={2}><Tabs id="dossier" value={tab} onChange={setTab} items={[{ id: 'parcours', label: 'Parcours vendeur', count: ready }, { id: 'bien', label: 'Bien' }, { id: 'documents', label: 'Pièces', count: 11 + myFiles.length }, { id: 'journal', label: 'Journal', count: myLog.length }]} /></Stagger>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4, ease: EXPO }} className="space-y-6">
              {tab === 'parcours' && journey && <StepView step={step} dossier={d} journey={journey} save={save} openDeliverable={setOpen} goTo={setStep} />}
              {tab === 'bien' && (
                <div className="grid gap-6 md:grid-cols-2">
                  <Card title="Caractéristiques" kicker="Origine et validation par champ">
                    <dl className="space-y-2.5 text-[13px]">
                      {[['Type', p.type, 'Mandat'], ['Surface habitable', `${p.surface} m²`, 'Plan géomètre'], ['Terrain', p.land ? `${fmt(p.land)} m²` : '—', 'Cadastre PCI'], ['Pièces', String(p.rooms), 'Découverte'], ['Année', String(p.year), 'Acte'], ['Taxe foncière', '6 840 €', 'Avis 2025']].map(([k, v, s]) => <div key={k} className="flex items-center justify-between gap-4 border-b border-white/[0.04] pb-2.5 last:border-0"><dt className="text-mist">{k}</dt><dd className="flex items-center gap-2">{v}<span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-mist">{s}</span></dd></div>)}
                    </dl>
                  </Card>
                  <Card title="Performance énergétique" kicker="DPE · valide jusqu’au 03/2032">
                    <div className="space-y-1.5">{(Object.keys(DPE_C) as (keyof typeof DPE_C)[]).map((k, i) => <div key={k} className="flex items-center gap-3"><div className="flex h-7 items-center rounded-r-full pl-3 text-[12px] font-semibold text-ink" style={{ width: `${34 + i * 9}%`, background: DPE_C[k] }}>{k}</div>{p.dpe === k && <span className="num text-[12px] text-champagne-300">← 74 kWh/m²/an</span>}</div>)}</div>
                    <div className="mt-4 flex flex-wrap gap-1.5">{p.features.map((f) => <span key={f} className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11.5px] ring-1 ring-white/[0.07]">{f}</span>)}</div>
                  </Card>
                </div>
              )}
              {tab === 'documents' && (
                <Card title="Pièces du dossier" kicker="L9 · checklist conditionnelle" action={<label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[13px] font-medium ring-1 ring-white/[0.08] transition hover:bg-white/[0.08]"><UploadSimple size={14} />{uploading ? 'Dépôt…' : 'Déposer'}<input type="file" multiple className="sr-only" onChange={(e) => { onUpload(e.currentTarget.files); e.currentTarget.value = '' }} /></label>}>
                  {myFiles.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <div className="text-[10.5px] uppercase tracking-eyebrow text-mist">Déposées dans NXT</div>
                      {myFiles.map((f) => <a key={f.id} href={`/api/files/${f.id}/raw`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl bg-champagne/[0.06] px-3.5 py-3 ring-1 ring-champagne/20 transition hover:bg-champagne/10"><FileText size={18} weight="light" className="text-champagne-300" /><span className="flex-1 truncate text-[13px]">{f.name}</span><span className="num text-[11px] text-mist">{Math.max(1, Math.round(f.size / 1024))} Ko</span></a>)}
                    </div>
                  )}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[['Titre de propriété', 'ok', 'p.1-14'], ['DPE', 'ok', 'p.2'], ['Diagnostic amiante', 'ok', 'p.1'], ['Électricité / gaz', 'ok', 'p.3'], ['Termites', 'ok', 'p.1'], ['ERP · risques', 'ok', 'Géorisques'], ['Taxe foncière 2025', 'ok', 'p.1'], ['PV d’AG 2025', 'missing', '—'], ['Règlement ASL', 'check', 'à vérifier'], ['Plans', 'ok', '3 pages'], ['Permis piscine', 'check', 'à vérifier']].map(([n, s, r]) => (
                      <div key={n} className="flex items-center gap-3 rounded-xl bg-white/[0.02] px-3.5 py-3 ring-1 ring-white/[0.05]">
                        <FileText size={18} weight="light" className="text-bone/50" /><span className="flex-1 text-[13px]">{n}</span>
                        <span className="text-[11px] text-mist">{r}</span>
                        {s === 'ok' ? <CheckCircle size={16} weight="fill" className="text-sage" /> : s === 'missing' ? <span className="rounded-full bg-coral/15 px-2 py-0.5 text-[10.5px] text-coral">Manquant</span> : <span className="rounded-full bg-champagne/15 px-2 py-0.5 text-[10.5px] text-champagne-300">À vérifier</span>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {tab === 'journal' && (
                <Card title="Journal du dossier" kicker="Chaque action, sa source, son auteur">
                  <AsyncForm submitLabel="Ajouter la note" onSubmit={async (v) => { if (!v.text?.trim()) throw new Error('Note vide'); await noteOps.create({ dossierId: d.id, text: v.text.trim(), at: new Date().toISOString(), by: 'Claire Delmas' }); (document.getElementById('note-text') as HTMLTextAreaElement | null)?.form?.reset() }}>
                    <Textarea id="note-text" name="text" rows={2} placeholder="Consigner un échange, une décision du vendeur…" />
                  </AsyncForm>
                  <div className="mt-6">
                    {myLog.length === 0 && <p className="text-[13px] text-mist">Aucune entrée pour l’instant : les validations, générations et notes apparaîtront ici.</p>}
                    {myLog.map((x, i) => {
                      const I = x.tone === 'ai' ? Sparkle : x.tone === 'win' ? CheckCircle : x.tone === 'note' ? PencilSimple : Lightning
                      return <div key={i} className="flex gap-4 pb-5 last:pb-0"><div className="relative flex flex-col items-center"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] ring-1 ring-white/[0.08]"><I size={14} className="text-champagne-300" /></span><span className="mt-1 w-px flex-1 bg-white/[0.07]" /></div><div><div className="text-[13px]"><b className="font-medium">{x.who}</b> <span className="text-bone/65">{x.what}</span></div><div className="num mt-0.5 text-[11px] text-mist">{x.t}</div></div></div>
                    })}
                  </div>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6 xl:col-span-4">
          <Stagger i={3}>
            <Card>
              <div className="flex items-center gap-4"><Ring value={d.progress} size={64} stroke={4}><span className="num text-sm">{d.progress}%</span></Ring><div><div className="text-[11px] uppercase tracking-eyebrow text-mist">Prochaine action</div><div className="mt-1 text-[15px]">{d.next}</div><div className="text-[12px] text-champagne-300">{d.due}</div></div></div>
              <div className="mt-5 grid grid-cols-3 gap-2">{[[Phone, 'Appeler'], [EnvelopeSimple, 'Écrire'], [Eye, 'Portail']].map(([I, l]) => { const Ic = I as typeof Phone; return <button key={l as string} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/[0.03] py-3 text-[11.5px] text-bone/75 ring-1 ring-white/[0.06] transition hover:bg-white/[0.06]"><Ic size={17} weight="light" />{l as string}</button> })}</div>
            </Card>
          </Stagger>
          <Stagger i={4}>
            <Card title="Estimation" kicker="L7 · à valider">
              <div className="display text-4xl">{eur(p.estimateLow)} – {eur(p.estimateHigh)}</div>
              <div className="relative mt-4 h-1.5 rounded-full bg-white/10"><div className="absolute inset-y-0 rounded-full bg-gradient-to-r from-champagne-700 to-champagne" style={{ left: '20%', right: '15%' }} /><div className="absolute -top-1.5 h-4 w-0.5 rounded bg-bone" style={{ left: '58%' }} /></div>
              <div className="mt-2 flex justify-between text-[11px] text-mist"><span>Prix présenté {eur(p.price)}</span><span>5 comparables</span></div>
            </Card>
          </Stagger>
          <Stagger i={5}>
            <Card title="Personnes">
              {[[d.seller, 'Vendeurs · décideurs', '/img/p-paul.webp'], [a.name, `${a.role} · responsable`, a.photo], ['Inès Morel', 'Coordination transaction', '/img/p-ines.webp'], ['Me Faure', 'Notaire vendeur', '/img/p-marc.webp']].map(([n, r, ph]) => <div key={n} className="flex items-center gap-3 border-b border-white/[0.04] py-2.5 last:border-0"><Avatar src={ph} size={34} /><div className="min-w-0 flex-1"><div className="truncate text-[13px]">{n}</div><div className="text-[11px] text-mist">{r}</div></div><LinkIcon size={14} className="text-mist" /></div>)}
            </Card>
          </Stagger>
          <Stagger i={6}>
            <Card title="Acquéreurs compatibles" kicker="L3 · matching expliqué">
              {[['Family Office L.', 97], ['M. Keller', 81], ['M. Serrano', 64]].map(([n, v]) => <div key={n as string} className="flex items-center gap-3 py-2"><span className="flex-1 text-[13px]">{n}</span><div className="h-1 w-24 rounded-full bg-white/10"><div className="h-1 rounded-full bg-champagne" style={{ width: `${v}%` }} /></div><span className="num w-8 text-right text-[12px]">{v}</span></div>)}
              <Link to="/app/acquereurs" className="mt-3 block text-[12px] text-champagne-300">Voir le matching →</Link>
            </Card>
          </Stagger>
        </div>
      </div>
      <AnimatePresence>{open && <Preview code={open} state={d.deliverables[open]} dossierId={d.id} onClose={() => setOpen(null)} />}</AnimatePresence>
    </div>
  )
}
