import { motion, AnimatePresence } from 'motion/react'
import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Plus, EnvelopeSimple, Scales, Phone, Lock, Scan, CheckCircle, Printer, Truck, MapPin, Sparkle, Camera, PaperPlaneTilt, Warning, Footprints, ArrowRight, ListChecks, PencilSimple, Trash, DownloadSimple } from '@phosphor-icons/react'
import { PageHeader, Card, Stat, Tabs, SoftBtn, IconBtn, Stagger, Empty } from '../ui'
import { Pill, Avatar, EXPO } from '../../ui/kit'
import { agent, fmt, img, me } from '../../data/mock'
import { SECTORS, SIGNALS, SIGNAL_META, type SignalKind, type Campaign, type Consent, type Signal } from '../../data/geo'
import { useCampaigns, useConsents, useTasks, useNotes, useAgents } from '../../data/collections'
import { uploadFile, type Doc } from '../../data/store'
import { Modal, Field, Input, Select, AsyncForm, toast, errText } from '../forms'
import { GeoMap, polygon } from '../GeoMap'

const SHORT: Record<string, string> = { s1: 'Vieil Antibes', s2: 'La Salis', s3: 'Cap Ouest', s4: 'Juan centre', s5: 'Les Combes' }
const DOT = { coral: 'bg-coral', gold: 'bg-champagne', sea: 'bg-sea', sage: 'bg-sage' } as const
const LAW_DATE = new Date('2026-08-11'), TODAY = new Date('2026-10-11')
const sinceLaw = Math.round((TODAY.getTime() - LAW_DATE.getTime()) / 86400000)
const CONSENT_TONE: Record<Consent['status'], 'green' | 'red' | 'gold' | 'neutral'> = { Exprès: 'green', Refus: 'red', Expiré: 'gold', 'À recueillir': 'neutral' }
const STATUSES: Consent['status'][] = ['Exprès', 'À recueillir', 'Refus', 'Expiré']
const CHANNELS: Consent['channel'][] = ['Téléphone', 'SMS', 'E-mail', 'Courrier']
const PRINT: Campaign['print'][] = ['BAT à valider', 'Chez l’imprimeur', 'Imprimé']
const DIST: Campaign['dist'][] = ['Planifiée', 'En cours', 'Distribuée']
// ponytail: historique antérieur au CRM, en lecture seule ; les nouvelles tournées vivent dans la collection notes
const HISTORY = [
  { d: 'Sam. 4 oct.', a: 'a1', s: 's1', streets: 'Rue Vauban, rue Fersen, rue de la Tourraque', boxes: 312, read: 286 },
  { d: 'Mer. 1 oct.', a: 'a4', s: 's3', streets: 'Chemin de la Garoupe, boulevard du Cap', boxes: 148, read: 139 },
  { d: 'Sam. 27 sept.', a: 'a3', s: 's4', streets: 'Boulevard Wilson, avenue Saramartel', boxes: 405, read: 371 },
]
const MONTHS = [['mai', 42, 9, 2], ['juin', 51, 12, 3], ['juil.', 38, 8, 2], ['août', 29, 6, 1], ['sept.', 64, 15, 4], ['oct.', 47, 11, 3]] as const

type C = Consent & Doc & { phone?: string; requestedAt?: string }
type Tour = Doc & { kind: 'tour'; text: string; at: string; by: string; date: string; agentId: string; sector: string; streets: string; boxes: number; read: number; photo?: string }
type TaskLink = Doc & { signalId?: string }

const frDate = (d = new Date()) => d.toLocaleDateString('fr-FR')
const parseFr = (s: string) => { const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null }
const plus3y = () => { const d = new Date(); d.setFullYear(d.getFullYear() + 3); return frDate(d) }
const isExpired = (c: C) => { const e = parseFr(c.expires); return !!e && e < new Date() }
const canCall = (c: C) => c.channel === 'Téléphone' && c.status === 'Exprès' && !isExpired(c)
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/^./, (x) => x.toUpperCase())

function CampaignForm({ initial, sector, onClose }: { initial?: Campaign & Doc; sector?: string; onClose: () => void }) {
  const [, ops] = useCampaigns()
  const i = initial
  return (
    <AsyncForm submitLabel={i ? 'Enregistrer' : 'Créer la campagne'} success={i ? 'Campagne mise à jour' : 'Campagne créée — BAT à valider'} onCancel={onClose} onSubmit={async (v) => {
      if (!v.name?.trim() || !v.hook?.trim()) throw new Error('Nom et accroche obligatoires')
      const volume = Number(v.volume) || 0
      if (volume <= 0) throw new Error('Volume de courriers à renseigner')
      const progress = v.dist === 'Distribuée' ? 100 : v.dist === 'Planifiée' ? 0 : Math.min(99, Math.max(1, Number(v.progress) || 10))
      const patch = { name: v.name.trim(), sector: v.sector, volume, hook: v.hook.trim(), date: v.date.trim() || 'À planifier', print: v.print as Campaign['print'], dist: v.dist as Campaign['dist'], progress }
      if (i) await ops.update(i.id, patch); else await ops.create({ ...patch, returns: 0 })
      onClose()
    }}>
      <Field label="Nom de la campagne"><Input name="name" required defaultValue={i?.name} placeholder="Vendu chemin de la Garoupe" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Secteur"><Select name="sector" defaultValue={i?.sector ?? sector ?? 's1'}>{SECTORS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        <Field label="Volume (courriers)"><Input name="volume" type="number" min={1} required defaultValue={i?.volume ?? SECTORS.find((s) => s.id === (sector ?? 's1'))?.homes} inputMode="numeric" /></Field>
        <Field label="Accroche" className="sm:col-span-2"><Input name="hook" required defaultValue={i?.hook} placeholder="Prix au m² 2026 de votre rue" /></Field>
        <Field label="Date de dépôt"><Input name="date" defaultValue={i?.date} placeholder="20 oct." /></Field>
        <Field label="Impression"><Select name="print" defaultValue={i?.print ?? 'BAT à valider'}>{PRINT.map((p) => <option key={p}>{p}</option>)}</Select></Field>
        <Field label="Distribution"><Select name="dist" defaultValue={i?.dist ?? 'Planifiée'}>{DIST.map((p) => <option key={p}>{p}</option>)}</Select></Field>
        <Field label="Avancement (%)" hint="Utilisé si « En cours »"><Input name="progress" type="number" min={0} max={100} defaultValue={i?.progress ?? 0} /></Field>
      </div>
      <p className="text-[11.5px] text-bone/45">Courrier postal : hors champ du consentement préalable, mentions d’opposition incluses au verso.</p>
    </AsyncForm>
  )
}

function ConsentForm({ initial, onClose }: { initial?: C; onClose: () => void }) {
  const [, ops] = useConsents()
  const i = initial
  return (
    <AsyncForm submitLabel={i ? 'Enregistrer' : 'Ajouter au registre'} success={i ? 'Registre mis à jour' : 'Contact ajouté au registre'} onCancel={onClose} onSubmit={async (v) => {
      if (!v.name?.trim()) throw new Error('Nom du contact obligatoire')
      const status = v.status as Consent['status']
      const proof = v.proof.trim()
      if (status === 'Exprès' && (!proof || proof === '—')) throw new Error('Un consentement exprès exige une preuve (formulaire, enregistrement, courrier…)')
      if (status === 'Exprès' && v.date && !parseFr(v.date)) throw new Error('Date au format JJ/MM/AAAA')
      const date = v.date.trim() || (status === 'Exprès' || status === 'Refus' ? frDate() : '—')
      const expires = v.expires.trim() || (status === 'Exprès' && v.channel !== 'Courrier' ? plus3y() : '—')
      const patch = { name: v.name.trim(), channel: v.channel as Consent['channel'], status, proof: proof || '—', date, expires, origin: v.origin.trim() || 'Saisie manuelle', phone: v.phone.trim() }
      if (i) await ops.update(i.id, patch); else await ops.create(patch)
      onClose()
    }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact" className="sm:col-span-2"><Input name="name" required defaultValue={i?.name} placeholder="Mme Hélène Vidal" /></Field>
        <Field label="Canal"><Select name="channel" defaultValue={i?.channel ?? 'Téléphone'}>{CHANNELS.map((p) => <option key={p}>{p}</option>)}</Select></Field>
        <Field label="Statut"><Select name="status" defaultValue={i?.status ?? 'À recueillir'}>{STATUSES.map((p) => <option key={p}>{p}</option>)}</Select></Field>
        <Field label="Preuve" className="sm:col-span-2" hint="Obligatoire pour un consentement exprès"><Input name="proof" defaultValue={i && i.proof !== '—' ? i.proof : ''} placeholder="Formulaire estimation · horodaté + IP" /></Field>
        <Field label="Recueilli le" hint="JJ/MM/AAAA · vide = aujourd’hui"><Input name="date" defaultValue={i && i.date !== '—' ? i.date : ''} /></Field>
        <Field label="Expire le" hint="Vide = 3 ans"><Input name="expires" defaultValue={i && i.expires !== '—' ? i.expires : ''} /></Field>
        <Field label="Téléphone"><Input name="phone" type="tel" defaultValue={i?.phone} placeholder="+33 6 …" /></Field>
        <Field label="Origine"><Input name="origin" defaultValue={i?.origin} placeholder="Site agence, boîtage…" /></Field>
      </div>
    </AsyncForm>
  )
}

function TourForm({ photo, sector, onClose }: { photo?: string; sector: string; onClose: () => void }) {
  const [, ops] = useNotes()
  const [agents] = useAgents()
  return (
    <AsyncForm submitLabel="Enregistrer la tournée" success="Tournée enregistrée" onCancel={onClose} onSubmit={async (v) => {
      const boxes = Number(v.boxes) || 0, read = Number(v.read) || 0
      if (!v.streets?.trim() || boxes <= 0) throw new Error('Rues et nombre de boîtes obligatoires')
      if (read > boxes) throw new Error('Les boîtes lues ne peuvent dépasser les boîtes visitées')
      const s = SECTORS.find((x) => x.id === v.sector)!
      const date = v.date ? new Date(v.date).toISOString() : new Date().toISOString()
      await ops.create({ kind: 'tour', text: `Tournée de boîtage — ${s.name} : ${v.streets.trim()} (${boxes} boîtes)`, at: new Date().toISOString(), by: me.name, date, agentId: v.agentId, sector: v.sector, streets: v.streets.trim(), boxes, read, photo } as never)
      onClose()
    }}>
      {photo && <img src={photo} alt="Photo de la tournée" className="h-32 w-full rounded-2xl object-cover" />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date"><Input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
        <Field label="Conseiller"><Select name="agentId" defaultValue={me.id}>{agents.filter((a) => a.mandats > 0).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field>
        <Field label="Secteur" className="sm:col-span-2"><Select name="sector" defaultValue={sector}>{SECTORS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
        <Field label="Rues parcourues" className="sm:col-span-2"><Input name="streets" required placeholder="Rue Vauban, rue Fersen" /></Field>
        <Field label="Boîtes visitées"><Input name="boxes" type="number" min={1} required inputMode="numeric" /></Field>
        <Field label="Noms relevés"><Input name="read" type="number" min={0} inputMode="numeric" /></Field>
      </div>
      <p className="text-[11.5px] text-bone/45">Fichier courrier uniquement (intérêt légitime). Aucun numéro de téléphone n’est recherché ni associé.</p>
    </AsyncForm>
  )
}

export default function Prospection() {
  const [camps, campOps] = useCampaigns()
  const [consentsRaw, consentOps] = useConsents()
  const [tasksRaw, taskOps] = useTasks()
  const [notes, noteOps] = useNotes()
  const [layers, setLayers] = useState<Record<SignalKind, boolean>>({ dpe: true, succession: true, stock: true, vente: true })
  const [sector, setSector] = useState('s1')
  const [hover, setHover] = useState<string | null>(null)
  const [focus, setFocus] = useState<{ center: [number, number]; zoom?: number } | null>(null)
  const [cf, setCf] = useState<'all' | 'ok' | 'todo' | 'no'>('all')
  const [campForm, setCampForm] = useState<{ id?: string; sector?: string } | null>(null)
  const [consentForm, setConsentForm] = useState<{ id?: string } | null>(null)
  const [tourForm, setTourForm] = useState<{ photo?: string } | null>(null)
  const [photo, setPhoto] = useState<{ state: 'idle' | 'up' | 'done'; url?: string }>({ state: 'idle' })
  const [confirm, setConfirm] = useState<string | null>(null)

  const consentsAll = consentsRaw as C[]
  const tasks = tasksRaw as unknown as TaskLink[]
  const tours = useMemo(() => (notes as unknown as Tour[]).filter((n) => n.kind === 'tour').sort((a, b) => b.date.localeCompare(a.date)), [notes])
  const sec = SECTORS.find((s) => s.id === sector)!
  const lastTour = tours.find((t) => t.sector === sector)
  const signals = SIGNALS.filter((s) => layers[s.kind])
  const secSignals = SIGNALS.filter((s) => s.sector === sector).sort((a, b) => b.score - a.score)
  const shapes = useMemo(() => SECTORS.map((s) => polygon(s.coords, { id: s.id, color: s.color, opacity: s.id === sector ? 0.2 : 0.06, width: s.id === sector ? 2 : 1, dashed: s.id !== sector })), [sector])
  const markers = signals.map((s) => ({ id: s.id, lng: s.lng, lat: s.lat, tone: SIGNAL_META[s.kind].tone, title: `${SIGNAL_META[s.kind].l} · ${s.addr}` }))
  const centroid = (c: [number, number][]) => [c.reduce((a, p) => a + p[0], 0) / c.length, c.reduce((a, p) => a + p[1], 0) / c.length] as [number, number]
  const pickSector = (id: string) => { setSector(id); setFocus({ center: centroid(SECTORS.find((s) => s.id === id)!.coords), zoom: 14.6 }) }
  const consents = consentsAll.filter((c) => cf === 'all' || (cf === 'ok' ? c.status === 'Exprès' : cf === 'todo' ? c.status === 'À recueillir' : c.status === 'Refus' || c.status === 'Expiré'))
  const maxM = Math.max(...MONTHS.map((m) => m[1]))
  const distributed = camps.reduce((s, c) => s + Math.round((c.volume * c.progress) / 100), 0)
  const returns = camps.reduce((s, c) => s + c.returns, 0)
  const taskOf = (sid: string) => tasks.find((t) => t.signalId === sid)
  const editingCamp = campForm?.id ? camps.find((c) => c.id === campForm.id) : undefined
  const editingConsent = consentForm?.id ? consentsAll.find((c) => c.id === consentForm.id) : undefined
  const run = async (f: () => Promise<unknown>, ok: string, tone: 'ok' | 'info' = 'ok') => { try { await f(); toast(ok, tone) } catch (e) { toast(errText(e), 'error') } }

  const advance = (c: Campaign & Doc) => {
    if (c.print === 'BAT à valider') return run(() => campOps.update(c.id, { print: 'Chez l’imprimeur' }), 'BAT validé — transmission imprimeur consignée (connecteur non configuré)', 'info')
    if (c.print === 'Chez l’imprimeur') return run(() => campOps.update(c.id, { print: 'Imprimé' }), 'Impression réceptionnée')
    if (c.dist === 'Planifiée') return run(() => campOps.update(c.id, { dist: 'En cours', progress: 10 }), 'Distribution lancée')
    if (c.dist === 'En cours') return run(() => campOps.update(c.id, c.progress >= 90 ? { dist: 'Distribuée', progress: 100 } : { progress: c.progress + 10 }), c.progress >= 90 ? 'Distribution terminée' : 'Avancement mis à jour')
  }
  const nextLabel = (c: Campaign) => c.print === 'BAT à valider' ? 'Valider le BAT' : c.print === 'Chez l’imprimeur' ? 'Marquer imprimé' : c.dist === 'Planifiée' ? 'Lancer la distribution' : c.dist === 'En cours' ? (c.progress >= 90 ? 'Terminer' : '+10 %') : null
  const createTask = (s: Signal) => run(() => taskOps.create({ title: `${SIGNAL_META[s.kind].l} — ${s.addr} : courrier personnalisé`, due: 'Cette semaine', prio: s.score >= 80 ? 'haute' : 'normale', kind: 'envoyer', ai: true, signalId: s.id } as never), 'Tâche créée dans votre liste')
  const setStatus = (c: C, status: Consent['status']) => {
    if (status === c.status) return
    if (status === 'Exprès' && (!c.proof || c.proof === '—')) { toast('Preuve requise pour un consentement exprès', 'error'); setConsentForm({ id: c.id }); return }
    const patch: Partial<C> = { status }
    if (status === 'Exprès') { patch.date = frDate(); if (c.channel !== 'Courrier') patch.expires = plus3y() }
    if (status === 'Refus') { patch.date = frDate(); patch.expires = '—' }
    run(() => consentOps.update(c.id, patch), `${c.name} : ${status.toLowerCase()}`)
  }
  const call = (c: C) => {
    if (!canCall(c)) return toast('Appel bloqué : aucun consentement exprès et valide', 'error')
    if (!c.phone) { toast('Aucun numéro renseigné pour ce contact', 'info'); setConsentForm({ id: c.id }); return }
    run(() => noteOps.create({ text: `Appel de prospection — ${c.name} · consentement ${c.channel.toLowerCase()} du ${c.date} (${c.proof})`, at: new Date().toISOString(), by: me.name }), 'Appel consigné au journal')
    window.location.href = `tel:${c.phone.replace(/\s/g, '')}`
  }
  const exportCsv = () => {
    const rows = [['Contact', 'Canal', 'Statut', 'Preuve', 'Recueilli', 'Expire', 'Origine'], ...consentsAll.map((c) => [c.name, c.channel, c.status, c.proof, c.date, c.expires, c.origin])]
    const csv = '﻿' + rows.map((r) => r.map((x) => `"${String(x ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `registre-consentements-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(a.href)
    toast(`Registre exporté · ${consentsAll.length} lignes`)
  }
  const pickPhoto = async (f?: File) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return toast('Choisissez une photo', 'error')
    setPhoto({ state: 'up' })
    try { const saved = await uploadFile(f); setPhoto({ state: 'done', url: `/api/files/${saved.id}/raw` }) } catch (e) { setPhoto({ state: 'idle' }); toast(errText(e), 'error') }
  }

  return (
    <div>
      <PageHeader
        kicker={`Territoire · ${SECTORS.length} secteurs · ${fmt(SECTORS.reduce((s, x) => s + x.homes, 0))} logements`}
        title={<>Prospection <span className="italic text-champagne-300">de terrain</span></>}
        sub="Signaux vendeurs croisés sur vos secteurs, courriers de voisinage L5, tournées de boîtage et registre des consentements."
        actions={<><SoftBtn icon={<Footprints size={14} />} onClick={() => setTourForm({})}>Nouvelle tournée</SoftBtn><SoftBtn tone="gold" icon={<Plus size={14} />} onClick={() => setCampForm({ sector })}>Campagne L5</SoftBtn></>}
      />

      <Stagger className="mb-6">
        <div className="flex flex-col gap-3 rounded-[1.4rem] bg-coral/[0.07] p-4 ring-1 ring-coral/25 md:flex-row md:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral/15 text-coral"><Scales size={18} weight="light" /></span>
          <div className="min-w-0 flex-1 text-[13px] leading-relaxed">
            <span className="font-medium text-bone">Démarchage téléphonique : consentement préalable obligatoire depuis le 11/08/2026.</span>{' '}
            <span className="text-bone/60">Tout appel de prospection sans accord exprès et prouvable est interdit. Le courrier postal reste autorisé. En vigueur depuis <span className="num text-coral">{sinceLaw} jours</span>.</span>
          </div>
          <a href="#registre" className="flex shrink-0 items-center gap-1.5 text-[12.5px] text-coral hover:underline">Registre des consentements <ArrowRight size={13} /></a>
        </div>
      </Stagger>

      <Stagger i={1} className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Signaux vendeurs actifs" value={SIGNALS.length} hint={`${tasks.filter((t) => t.signalId).length} transformé(s) en tâche`} />
        <Stat label="Courriers distribués" value={fmt(distributed)} hint={`${camps.filter((c) => c.dist !== 'Distribuée').length} campagne(s) L5 en cours ou planifiées`} />
        <Stat label="Taux de retour" value={distributed ? `${((returns / distributed) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %` : '—'} hint={`${returns} retours · QR code + appels entrants`} />
        <Stat label="Consentements exprès" value={`${consentsAll.filter((c) => c.status === 'Exprès' && !isExpired(c)).length}/${consentsAll.length}`} hint={`${consentsAll.filter((c) => c.status === 'À recueillir').length} à recueillir`} />
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-12">
        <Stagger i={2} className="min-w-0 lg:col-span-8">
          <Card pad={false} className="h-full">
            <GeoMap markers={markers} shapes={shapes} activeId={hover} onHover={setHover} onSelect={(id) => { const s = SIGNALS.find((x) => x.id === id)!; if (s.sector) setSector(s.sector) }} onShapeClick={pickSector} focus={focus} center={[7.116, 43.572]} zoom={13.2} className="h-[460px] rounded-[calc(1.4rem-0.25rem)] lg:h-full lg:min-h-[560px]">
              <div className="absolute inset-x-3 top-3 mr-12 flex flex-wrap gap-1.5">
                {(Object.keys(SIGNAL_META) as SignalKind[]).map((k) => {
                  const m = SIGNAL_META[k], on = layers[k]
                  return (
                    <button key={k} onClick={() => setLayers({ ...layers, [k]: !on })} title={m.hint} className={clsx('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ring-1 backdrop-blur-md transition-all duration-300', on ? 'bg-ink/80 text-bone ring-white/15' : 'bg-ink/50 text-bone/40 ring-white/[0.06]')}>
                      <span className={clsx('h-1.5 w-1.5 rounded-full transition-opacity', DOT[m.tone], !on && 'opacity-30')} />{m.l}<span className="num text-mist">{SIGNALS.filter((s) => s.kind === k).length}</span>
                    </button>
                  )
                })}
              </div>
              <AnimatePresence>
                {hover && (() => { const s = SIGNALS.find((x) => x.id === hover); if (!s) return null; const m = SIGNAL_META[s.kind]; return (
                  <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: EXPO }} className="pointer-events-none absolute bottom-4 left-4 max-w-[300px] rounded-2xl bg-ink-800/90 p-3 shadow-float ring-1 ring-white/10 backdrop-blur-xl">
                    <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-eyebrow text-mist"><span className={clsx('h-1.5 w-1.5 rounded-full', DOT[m.tone])} />{m.l}</div>
                    <div className="mt-1 text-[13px]">{s.addr}</div><div className="text-[11.5px] text-bone/55">{s.detail}</div>
                  </motion.div>
                ) })()}
              </AnimatePresence>
            </GeoMap>
          </Card>
        </Stagger>

        <Stagger i={3} className="min-w-0 lg:col-span-4">
          <Card className="h-full" kicker="Secteur sélectionné" title={sec.name} action={<span className="h-3 w-3 rounded-full ring-2 ring-white/10" style={{ background: sec.color }} />}>
            <div className="flex flex-wrap gap-1.5">
              {SECTORS.map((s) => <button key={s.id} onClick={() => pickSector(s.id)} className={clsx('relative rounded-full px-2.5 py-1 text-[11px] ring-1 transition-colors', s.id === sector ? 'text-bone ring-white/20' : 'text-bone/50 ring-white/[0.06] hover:text-bone')}>{s.id === sector && <motion.span layoutId="pro-sec" className="absolute inset-0 rounded-full bg-white/[0.08]" transition={{ duration: 0.5, ease: EXPO }} />}<span className="relative">{SHORT[s.id]}</span></button>)}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[[fmt(sec.homes), 'Logements'], [`${fmt(sec.ppm)} €`, 'Prix médian / m²'], [`${sec.rotation.toLocaleString('fr-FR')} %`, 'Rotation annuelle'], [`${Math.round(sec.share * 100)} %`, 'Notre part de marché']].map(([v, k]) => (
                <div key={k} className="rounded-xl bg-white/[0.025] p-3 ring-1 ring-white/[0.05]"><div className="display text-2xl">{v}</div><div className="text-[10.5px] text-mist">{k}</div></div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-white/[0.02] p-2.5 text-[12px] ring-1 ring-white/[0.05]"><Avatar src={agent(sec.agentId).photo} size={26} /><span className="flex-1">{agent(sec.agentId).name}</span><span className="text-[11px] text-mist">Dernier boîtage {lastTour ? shortDate(lastTour.date) : sec.lastDrop}</span></div>
            <div className="mt-4 text-[10.5px] uppercase tracking-eyebrow text-mist">Signaux du secteur · {secSignals.length}</div>
            <div className="thin-scroll mt-2 max-h-[208px] space-y-1.5 overflow-y-auto pr-1">
              {secSignals.length ? secSignals.map((s) => {
                const t = taskOf(s.id)
                return (
                  <div key={s.id} role="button" tabIndex={0} onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)} onClick={() => setFocus({ center: [s.lng, s.lat], zoom: 16 })} onKeyDown={(e) => e.key === 'Enter' && setFocus({ center: [s.lng, s.lat], zoom: 16 })} className={clsx('flex w-full cursor-pointer items-start gap-2.5 rounded-xl p-2.5 text-left ring-1 transition-colors', hover === s.id ? 'bg-white/[0.05] ring-white/10' : 'bg-white/[0.015] ring-white/[0.04]')}>
                    <span className={clsx('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', DOT[SIGNAL_META[s.kind].tone])} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px]">{s.addr}</span><span className="block truncate text-[11px] text-mist">{s.detail}</span></span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="num text-[11px] text-champagne-300">{s.score}</span>
                      {t ? <span className="flex items-center gap-1 text-[10.5px] text-sage"><CheckCircle size={11} weight="fill" />Tâche</span> : <button onClick={(e) => { e.stopPropagation(); createTask(s) }} className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2 py-0.5 text-[10.5px] text-bone/75 ring-1 ring-white/[0.08] transition hover:bg-champagne/15 hover:text-champagne-300"><ListChecks size={11} />Créer une tâche</button>}
                    </span>
                  </div>
                )
              }) : <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-[12px] text-mist">Aucun signal actif sur ce secteur.</div>}
            </div>
            <div className="mt-4"><SoftBtn tone="gold" icon={<EnvelopeSimple size={13} />} onClick={() => setCampForm({ sector })}>Courrier L5 sur ce secteur</SoftBtn></div>
          </Card>
        </Stagger>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <Stagger i={4} className="min-w-0 lg:col-span-7">
          <Card title="Campagnes de courrier voisinage" kicker="L5 · impression & distribution" action={<SoftBtn icon={<Plus size={13} />} onClick={() => setCampForm({ sector })}>Nouvelle</SoftBtn>}>
            {!camps.length && <Empty title="Aucune campagne">Lancez un premier courrier de voisinage sur un secteur.</Empty>}
            <div className="space-y-2.5">
              {camps.map((c) => {
                const s = SECTORS.find((x) => x.id === c.sector) ?? SECTORS[0], next = nextLabel(c)
                return (
                  <div key={c.id} className="rounded-2xl bg-white/[0.02] p-3.5 ring-1 ring-white/[0.05]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[13.5px] font-medium"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{c.name}</div>
                        <div className="mt-0.5 text-[11.5px] text-mist">{s.name} · accroche « {c.hook} » · {c.date}</div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div><div className="num text-[14px]">{fmt(c.volume)}</div><div className="text-[10px] uppercase tracking-eyebrow text-mist">Volume</div></div>
                        <div><div className="flex items-center justify-end gap-1"><span className="num text-[14px] text-champagne-300">{c.returns}</span>{c.progress > 0 && <button onClick={() => run(() => campOps.update(c.id, { returns: c.returns + 1 }), 'Retour enregistré')} title="Enregistrer un retour (QR, appel entrant)" className="flex h-4 w-4 items-center justify-center rounded-full bg-white/[0.06] text-[10px] text-bone/70 hover:bg-champagne/20">+</button>}</div><div className="text-[10px] uppercase tracking-eyebrow text-mist">Retours</div></div>
                        <div className="flex gap-1">
                          <button onClick={() => setCampForm({ id: c.id })} aria-label="Modifier la campagne" className="flex h-7 w-7 items-center justify-center rounded-full text-mist transition hover:bg-white/[0.06] hover:text-bone"><PencilSimple size={13} /></button>
                          {confirm === c.id ? <button onClick={() => { setConfirm(null); run(() => campOps.remove(c.id), 'Campagne supprimée') }} className="rounded-full bg-coral/15 px-2.5 text-[11.5px] font-medium text-coral ring-1 ring-coral/30">Confirmer</button> : <button onClick={() => setConfirm(c.id)} aria-label="Supprimer la campagne" className="flex h-7 w-7 items-center justify-center rounded-full text-mist transition hover:bg-coral/10 hover:text-coral"><Trash size={13} /></button>}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Pill tone={c.print === 'Imprimé' ? 'green' : c.print === 'BAT à valider' ? 'gold' : 'blue'}><Printer size={11} />{c.print}</Pill>
                      <Pill tone={c.dist === 'Distribuée' ? 'green' : c.dist === 'En cours' ? 'blue' : 'neutral'}><Truck size={11} />{c.dist}</Pill>
                      <div className="flex min-w-[120px] flex-1 items-center gap-2"><div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]"><motion.div className="h-full rounded-full bg-champagne" initial={{ width: 0 }} animate={{ width: `${c.progress}%` }} transition={{ duration: 1.2, ease: EXPO }} /></div><span className="num w-9 text-right text-[11px] text-mist">{c.progress} %</span></div>
                      {next && <SoftBtn tone={c.print === 'BAT à valider' ? 'gold' : 'ghost'} icon={c.print !== 'Imprimé' ? <CheckCircle size={13} /> : <Truck size={13} />} onClick={() => advance(c)}>{next}</SoftBtn>}
                    </div>
                    {c.print === 'Chez l’imprimeur' && <div className="mt-2 text-[11px] text-mist">Transmission imprimeur consignée — connecteur non configuré, envoi du fichier à faire manuellement.</div>}
                  </div>
                )
              })}
            </div>
          </Card>
        </Stagger>

        <Stagger i={5} className="min-w-0 lg:col-span-5">
          <Card title="Tournées de boîtage" kicker="Relevé des boîtes aux lettres" className="h-full" action={<SoftBtn icon={<Plus size={13} />} onClick={() => setTourForm({})}>Saisir</SoftBtn>}>
            <div className="theme-dark relative overflow-hidden rounded-2xl ring-1 ring-white/[0.06]">
              <img src={photo.url ?? img('medit-street')} alt="Façade photographiée pour le relevé" className={clsx('h-44 w-full object-cover transition-all duration-700', photo.state === 'idle' ? 'opacity-50 grayscale' : 'opacity-85')} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-800 via-ink-800/30 to-transparent" />
              {photo.state === 'up' && <div className="absolute inset-x-0 top-0 h-[10%] animate-scan bg-gradient-to-b from-transparent via-champagne/40 to-transparent" />}
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-3 p-3">
                <span className="text-[12px] text-bone/85">{photo.state === 'idle' ? 'Photographiez les boîtes pour garder la preuve du relevé' : photo.state === 'up' ? 'Import de la photo…' : 'Photo enregistrée · lecture automatique non configurée'}</span>
                {photo.state === 'done'
                  ? <SoftBtn tone="gold" icon={<Footprints size={13} />} onClick={() => setTourForm({ photo: photo.url })}>Saisir le relevé</SoftBtn>
                  : <label className={clsx('inline-flex cursor-pointer items-center gap-2 rounded-full bg-champagne px-4 py-2 text-[13px] font-medium text-ink transition hover:bg-champagne-300', photo.state === 'up' && 'pointer-events-none opacity-60')}>{photo.state === 'up' ? <Scan size={13} /> : <Camera size={13} />}Photographier<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} /></label>}
              </div>
            </div>
            <div className="mt-2.5 flex items-start gap-2 text-[11px] text-bone/50"><Warning size={13} className="mt-0.5 shrink-0 text-champagne" />Fichier courrier uniquement (intérêt légitime). Aucun numéro de téléphone n’est recherché ni associé.</div>
            <div className="mt-4 divide-y divide-white/[0.05]">
              {tours.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2.5">
                  <Avatar src={agent(t.agentId).photo} size={28} />
                  <div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-[12.5px]"><span className="num text-bone/70">{shortDate(t.date)}</span><span className="truncate">{SECTORS.find((s) => s.id === t.sector)?.name}</span>{t.photo && <Camera size={11} className="shrink-0 text-mist" />}</div><div className="truncate text-[11px] text-mist">{t.streets}</div></div>
                  <div className="text-right"><div className="num text-[12.5px]">{t.boxes}</div><div className="num text-[10px] text-mist">{t.boxes ? Math.round((t.read / t.boxes) * 100) : 0} % relevés</div></div>
                  {confirm === t.id ? <button onClick={() => { setConfirm(null); run(() => noteOps.remove(t.id), 'Tournée supprimée') }} className="rounded-full bg-coral/15 px-2.5 py-1 text-[11px] text-coral ring-1 ring-coral/30">Confirmer</button> : <button onClick={() => setConfirm(t.id)} aria-label="Supprimer la tournée" className="text-mist transition hover:text-coral"><Trash size={13} /></button>}
                </div>
              ))}
              {HISTORY.map((t) => (
                <div key={t.d} className="flex items-center gap-3 py-2.5 opacity-70">
                  <Avatar src={agent(t.a).photo} size={28} />
                  <div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-[12.5px]"><span className="num text-bone/70">{t.d}</span><span className="truncate">{SECTORS.find((s) => s.id === t.s)!.name}</span></div><div className="truncate text-[11px] text-mist">{t.streets} · historique</div></div>
                  <div className="text-right"><div className="num text-[12.5px]">{t.boxes}</div><div className="num text-[10px] text-mist">{Math.round((t.read / t.boxes) * 100)} % relevés</div></div>
                  <span className="w-[13px]" />
                </div>
              ))}
            </div>
          </Card>
        </Stagger>
      </div>

      <div id="registre" className="mt-6 grid scroll-mt-24 gap-6 lg:grid-cols-12">
        <Stagger i={6} className="min-w-0 lg:col-span-12">
          <Card pad={false}>
            <div className="flex flex-col gap-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-eyebrow text-mist">RGPD · Code de la consommation</div>
                  <h2 className="text-[15px] font-medium tracking-[-0.01em]">Registre des consentements</h2>
                  <p className="mt-1 max-w-lg text-[12px] text-bone/55">Preuve horodatée par contact et par canal. Sans consentement exprès et en cours de validité, l’appel est bloqué dans le CRM ; le courrier reste possible.</p>
                </div>
                <SoftBtn tone="gold" icon={<Plus size={13} />} onClick={() => setConsentForm({})}>Ajouter un contact</SoftBtn>
              </div>
              <Tabs id="pro-consent" value={cf} onChange={setCf} items={[{ id: 'all', label: 'Tous', count: consentsAll.length }, { id: 'ok', label: 'Exprès' }, { id: 'todo', label: 'À recueillir' }, { id: 'no', label: 'Refus · expirés' }]} />
            </div>
            {!consents.length ? <div className="px-5 pb-5"><Empty title="Aucun contact dans ce filtre" /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-[12.5px]">
                <thead className="text-[10px] uppercase tracking-eyebrow text-mist"><tr className="border-y border-white/[0.06]">{['Contact', 'Canal', 'Statut', 'Preuve', 'Recueilli · expire', '', ''].map((h, k) => <th key={k} className="px-4 py-3 font-normal">{h}</th>)}</tr></thead>
                <tbody>
                  {consents.map((c) => {
                    const expired = c.status === 'Exprès' && isExpired(c)
                    return (
                      <tr key={c.id} className="whitespace-nowrap border-b border-white/[0.04] transition hover:bg-white/[0.02]">
                        <td className="px-4 py-3"><div>{c.name}</div><div className="text-[10.5px] text-mist">{c.origin}{c.phone ? ` · ${c.phone}` : ''}</div></td>
                        <td className="px-4 py-3 text-bone/70">{c.channel}</td>
                        <td className="px-4 py-3">
                          <label className="relative inline-flex items-center">
                            <select value={c.status} onChange={(e) => setStatus(c, e.target.value as Consent['status'])} aria-label={`Statut du consentement de ${c.name}`} className="absolute inset-0 cursor-pointer opacity-0">{STATUSES.map((s) => <option key={s} className="bg-ink-800 text-bone">{s}</option>)}</select>
                            <Pill tone={expired ? 'gold' : CONSENT_TONE[c.status]}>{expired ? 'Expiré' : c.status}</Pill>
                          </label>
                        </td>
                        <td className="max-w-[240px] truncate px-4 py-3 text-[11.5px] text-bone/55" title={c.proof}>{c.proof}</td>
                        <td className="num px-4 py-3 text-bone/70">{c.date}<div className="text-[10.5px] text-mist">{c.expires !== '—' ? `→ ${c.expires}` : ''}</div></td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {canCall(c) ? <SoftBtn icon={<Phone size={13} />} onClick={() => call(c)}>Appeler</SoftBtn>
                            : c.status === 'À recueillir' ? (c.requestedAt ? <span className="inline-flex items-center justify-end gap-1 text-[11.5px] text-sea" title="Envoi réel non configuré"><PaperPlaneTilt size={12} />Demande consignée le {new Date(c.requestedAt).toLocaleDateString('fr-FR')}</span> : <SoftBtn icon={<EnvelopeSimple size={13} />} onClick={() => run(() => consentOps.update(c.id, { requestedAt: new Date().toISOString() } as Partial<C>), 'Demande d’accord consignée — envoi courrier/e-mail non configuré', 'info')}>Demander l’accord</SoftBtn>)
                            : c.channel === 'Téléphone' ? <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.03] px-3 py-1.5 text-[11.5px] text-bone/35 ring-1 ring-white/[0.06]" title="Appel interdit sans consentement exprès et valide"><Lock size={12} />Appel bloqué</span>
                            : <span className="text-[11.5px] text-mist">—</span>}
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex justify-end gap-1">
                            <IconBtn label={`Modifier ${c.name}`} onClick={() => setConsentForm({ id: c.id })}><PencilSimple size={13} /></IconBtn>
                            {confirm === c.id ? <button onClick={() => { setConfirm(null); run(() => consentOps.remove(c.id), 'Contact effacé du registre') }} className="rounded-full bg-coral/15 px-3 text-[11.5px] text-coral ring-1 ring-coral/30">Effacer</button> : <IconBtn label={`Effacer ${c.name}`} onClick={() => setConfirm(c.id)}><Trash size={13} /></IconBtn>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            )}
            <div className="flex flex-wrap items-center gap-4 p-5 text-[11.5px] text-mist">
              <span className="flex items-center gap-1.5"><CheckCircle size={13} weight="fill" className="text-sage" />{consentsAll.filter((c) => c.status === 'Exprès' && !isExpired(c)).length} consentements valides</span>
              <span className="flex items-center gap-1.5"><Lock size={13} className="text-coral" />{consentsAll.filter((c) => c.channel === 'Téléphone' && !canCall(c)).length} appels bloqués</span>
              <button onClick={exportCsv} className="flex items-center gap-1.5 transition hover:text-bone"><DownloadSimple size={13} />Exporter le registre (CSV)</button>
            </div>
          </Card>
        </Stagger>

        <Stagger i={7} className="min-w-0 lg:col-span-12">
          <Card title="KPI de prospection" kicker="6 derniers mois · historique importé" className="h-full">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <div className="flex h-44 items-end gap-3">
                  {MONTHS.map(([m, c, r, w], i) => (
                    <div key={m} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                      <div className="flex h-full w-full items-end justify-center gap-[3px]">
                        {[[c, 'bg-white/15'], [r * 3, 'bg-champagne/60'], [w * 10, 'bg-champagne']].map(([v, cl], k) => <motion.span key={k} title={['Contacts', 'RDV estimation', 'Mandats'][k] + ` : ${k === 0 ? c : k === 1 ? r : w}`} className={clsx('w-2 rounded-t-sm', cl as string)} initial={{ height: 0 }} whileInView={{ height: `${((v as number) / maxM) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.06 + k * 0.08, ease: EXPO }} />)}
                      </div>
                      <span className="text-[10px] text-mist">{m}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-[10.5px] text-mist">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-white/15" />Contacts</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-champagne/60" />RDV (×3)</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-champagne" />Mandats (×10)</span>
                </div>
              </div>
              <div className="space-y-2.5 md:border-l md:border-white/[0.06] md:pl-6">
                {[['Contact → RDV estimation', '22,5 %'], ['RDV → mandat', '25,8 %'], ['Coût par mandat (courrier)', '312 €'], ['Délai signal → RDV', '9 j']].map(([k, v]) => <div key={k} className="flex items-center justify-between text-[12.5px]"><span className="text-bone/60">{k}</span><span className="num">{v}</span></div>)}
                <div className="flex items-center justify-between text-[12.5px]"><span className="text-bone/60">Tournées enregistrées</span><span className="num">{tours.length + HISTORY.length}</span></div>
              </div>
              <div className="flex h-fit gap-2.5 rounded-2xl bg-champagne/[0.06] p-3.5 text-[12px] leading-relaxed text-bone/75 ring-1 ring-champagne/20"><Sparkle size={14} weight="fill" className="mt-0.5 shrink-0 text-champagne" /><span>Les signaux « succession » convertissent 2,3 fois mieux que la moyenne : 4 sont ouverts sur <span className="text-champagne-300">La Salis</span> et <span className="text-champagne-300">Les Combes</span>.<MapPin size={11} className="ml-1 inline text-mist" /></span></div>
            </div>
          </Card>
        </Stagger>
      </div>

      <Modal open={!!campForm} onClose={() => setCampForm(null)} kicker="Courrier voisinage L5" title={editingCamp ? <>Modifier <span className="italic text-champagne-300">la campagne</span></> : <>Nouvelle <span className="italic text-champagne-300">campagne</span></>}>
        {campForm && <CampaignForm key={campForm.id ?? 'new'} initial={editingCamp} sector={campForm.sector} onClose={() => setCampForm(null)} />}
      </Modal>
      <Modal open={!!consentForm} onClose={() => setConsentForm(null)} kicker="Registre des consentements" title={editingConsent ? <>Modifier <span className="italic text-champagne-300">{editingConsent.name}</span></> : <>Nouveau <span className="italic text-champagne-300">contact</span></>}>
        {consentForm && <ConsentForm key={consentForm.id ?? 'new'} initial={editingConsent} onClose={() => setConsentForm(null)} />}
      </Modal>
      <Modal open={!!tourForm} onClose={() => setTourForm(null)} kicker="Prospection terrain" title={<>Nouvelle <span className="italic text-champagne-300">tournée</span></>}>
        {tourForm && <TourForm photo={tourForm.photo} sector={sector} onClose={() => { setTourForm(null); if (tourForm.photo) setPhoto({ state: 'idle' }) }} />}
      </Modal>
    </div>
  )
}
