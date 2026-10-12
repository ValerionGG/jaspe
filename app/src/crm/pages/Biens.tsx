import { motion, AnimatePresence } from 'motion/react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Plus, SquaresFour, MapTrifold, Columns, Eye, ChatCircleDots, DoorOpen, X, MapPin, Ruler, Bed, Tree, CaretDown, CheckCircle, Warning, XCircle, Clock, Sparkle, ArrowsClockwise, Cube, ImageSquare, SlidersHorizontal, ArrowUpRight, Broadcast, PencilSimple, Trash, UploadSimple, Prohibit, Archive } from '@phosphor-icons/react'
import { PageHeader, Card, Stat, Tabs, SoftBtn, IconBtn, Stagger, Empty } from '../ui'
import { Pill, Ring, Avatar, EXPO } from '../../ui/kit'
import { eur, fmt, agent, img, me } from '../../data/mock'
import { PORTALS, QUALITY_CHECKS, DPE_C, ZONES, type Listing, type ListingStatus, type Portal, type PortalState, type CheckKey } from '../../data/geo'
import { useProperties, useDossiers, useAgents, useActivity, useTasks } from '../../data/collections'
import { uploadFile } from '../../data/store'
import { Modal, Field, Input, Select, Textarea, AsyncForm, toast, errText } from '../forms'
import { GeoMap, ANTIBES } from '../GeoMap'

const STATUSES: ListingStatus[] = ['Diffusé', 'Avant-première', 'Sous offre', 'Compromis', 'Brouillon']
const STATUS_TONE: Record<ListingStatus, 'green' | 'gold' | 'blue' | 'neutral' | 'red'> = { Diffusé: 'green', 'Avant-première': 'gold', 'Sous offre': 'blue', Compromis: 'neutral', Brouillon: 'neutral' }
const PORTAL_STATE: Record<PortalState, { l: string; dot: string; tone: 'green' | 'red' | 'blue' | 'neutral' | 'gold' }> = {
  publiee: { l: 'Publiée', dot: 'bg-sage', tone: 'green' },
  rejetee: { l: 'Rejetée', dot: 'bg-coral', tone: 'red' },
  attente: { l: 'En attente', dot: 'bg-sea', tone: 'blue' },
  consigne: { l: 'Consignée', dot: 'bg-champagne', tone: 'gold' },
  off: { l: 'Non diffusée', dot: 'bg-white/15', tone: 'neutral' },
}
const MONO: Record<Portal, string> = { SeLoger: 'SL', Leboncoin: 'lbc', 'Bien’ici': 'Bi', 'Belles Demeures': 'BD', 'Figaro Prestige': 'FP' }
const PRICE = { all: 'Tous les prix', lt15: '< 1,5 M€', mid: '1,5 – 3 M€', gt3: '> 3 M€' } as const
const inPrice = (k: keyof typeof PRICE, p: number) => k === 'all' || (k === 'lt15' ? p < 1.5e6 : k === 'mid' ? p >= 1.5e6 && p <= 3e6 : p > 3e6)
const NOT_WIRED = 'Consigné — connecteur portail non configuré'
const hhmm = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

/* ——— Qualité recalculée depuis les champs réels (les amorces sans champ retombent sur `checks`) ——— */
function realChecks(p: Listing): Record<CheckKey, boolean> {
  const c = (p.checks ?? {}) as Partial<Record<CheckKey, boolean>>
  return {
    photos: (p.photoCount ?? (c.photos ? 16 : p.gallery?.length ?? 0)) >= 15,
    plan: p.plan ?? !!c.plan,
    visite3d: p.tour3d !== undefined ? !!p.tour3d.trim() : !!c.visite3d,
    dpe: !!p.dpe && (p.energyCost !== undefined ? !!p.energyCost.trim() : !!c.dpe),
    honoraires: p.fees !== undefined ? !!p.fees.trim() : !!c.honoraires,
    carrez: (p.surface ?? 0) > 0,
    texte: p.description !== undefined ? p.description.trim().length >= 1200 : !!c.texte,
  }
}
const blankPortals = () => Object.fromEntries(PORTALS.map((p) => [p, { state: 'off', views: 0 }])) as Listing['portals']
/** Fiche vivante complétée de valeurs neutres (biens créés ailleurs avec moins de champs). */
function norm(p: Listing): Listing {
  const checks = realChecks(p)
  return {
    ...p, ref: p.ref ?? '—', status: p.status ?? 'Brouillon', agentId: p.agentId ?? 'a1', days: p.days ?? 0, views: p.views ?? 0, contacts: p.contacts ?? 0, visits: p.visits ?? 0, offers: p.offers ?? 0,
    features: p.features ?? [], gallery: p.gallery?.length ? p.gallery : [p.photo], daily: p.daily?.length ? p.daily : Array(14).fill(0),
    portals: { ...blankPortals(), ...(p.portals ?? {}) }, checks, quality: QUALITY_CHECKS.reduce((s, q) => s + (checks[q.k] ? q.w : 0), 0),
  }
}

function FilterSelect<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: [T, string][]; label: string }) {
  return (
    <label className="relative flex items-center gap-2 rounded-full bg-white/[0.03] py-1.5 pl-3.5 pr-8 text-[12.5px] ring-1 ring-white/[0.07] transition hover:bg-white/[0.06]">
      <span className="text-mist">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className="cursor-pointer appearance-none bg-transparent text-bone outline-none">
        {options.map(([v, l]) => <option key={v} value={v} className="bg-ink-800">{l}</option>)}
      </select>
      <CaretDown size={11} className="pointer-events-none absolute right-3 text-mist" />
    </label>
  )
}

function DpeBadge({ c, size = 'md' }: { c: keyof typeof DPE_C; size?: 'sm' | 'md' }) {
  return <span className={clsx('num inline-flex items-center justify-center rounded-md font-semibold', size === 'sm' ? 'h-5 w-5 text-[10.5px]' : 'h-6 w-6 text-[12px]')} style={{ background: DPE_C[c] ?? DPE_C.D, color: '#141210' }} title={`DPE ${c}`}>{c}</span>
}

function Metric({ icon, v, label }: { icon: ReactNode; v: number; label: string }) {
  return <span className="flex items-center gap-1.5 text-bone/70" title={label}>{icon}<span className="num text-[12px]">{fmt(v)}</span></span>
}

const qTone = (q: number) => (q >= 85 ? 'bg-sage/10 text-sage ring-sage/25' : q >= 65 ? 'bg-champagne/10 text-champagne-300 ring-champagne/25' : 'bg-coral/10 text-coral ring-coral/25')

function ListingCard({ l, active, onHover, onOpen, big }: { l: Listing; active: boolean; onHover: (id: string | null) => void; onOpen: () => void; big?: boolean }) {
  return (
    <motion.article layout transition={{ duration: 0.6, ease: EXPO }} onMouseEnter={() => onHover(l.id)} onMouseLeave={() => onHover(null)} onClick={onOpen}
      className={clsx('group cursor-pointer rounded-[1.4rem] bg-white/[0.02] p-1 ring-1 transition-all duration-500 ease-silk hover:-translate-y-0.5 hover:shadow-float', active ? 'ring-champagne/40' : 'ring-white/[0.06] hover:ring-champagne/25', big && 'sm:col-span-2')}>
      <div className={clsx('theme-dark relative overflow-hidden rounded-[1.15rem]', big ? 'aspect-[4/3] sm:aspect-[16/8.6]' : 'aspect-[4/3]')}>
        <img src={l.photo} alt={l.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.8s] ease-silk group-hover:scale-[1.07]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5"><span className="rounded-full bg-ink/75 backdrop-blur-md"><Pill tone={STATUS_TONE[l.status]}>{l.status}</Pill></span>{l.status === 'Diffusé' && <span className="num rounded-full bg-ink/60 px-2 py-[3px] text-[10.5px] text-bone/70 backdrop-blur-md">J+{l.days}</span>}</div>
        <div className="absolute right-3 top-3"><DpeBadge c={l.dpe} /></div>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="text-[10.5px] uppercase tracking-eyebrow text-bone/60">{l.district} · {l.city}</div>
            <h3 className={clsx('display mt-1 truncate text-bone', big ? 'text-3xl md:text-[2.4rem]' : 'text-[1.6rem]')}>{l.title}</h3>
          </div>
          <div className="shrink-0 text-right"><div className={clsx('num text-bone', big ? 'text-xl' : 'text-[17px]')}>{eur(l.price)}</div><div className="num text-[10.5px] text-bone/50">{l.surface ? fmt(Math.round(l.price / l.surface)) : '—'} €/m²</div></div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 px-3.5 py-3">
        <div className="flex items-center gap-4">
          <Metric icon={<Eye size={14} weight="light" />} v={l.views} label="Vues" />
          <Metric icon={<ChatCircleDots size={14} weight="light" />} v={l.contacts} label="Contacts" />
          <Metric icon={<DoorOpen size={14} weight="light" />} v={l.visits} label="Visites" />
        </div>
        <div className="flex items-center gap-3">
          <span className="flex gap-1" title="Diffusion portails">{PORTALS.map((p) => <span key={p} title={`${p} · ${PORTAL_STATE[l.portals[p].state].l}`} className={clsx('h-1.5 w-1.5 rounded-full', PORTAL_STATE[l.portals[p].state].dot)} />)}</span>
          <span className={clsx('num rounded-full px-2 py-0.5 text-[10.5px] ring-1', qTone(l.quality))} title="Qualité d’annonce">{l.quality}</span>
        </div>
      </div>
    </motion.article>
  )
}

function ListRow({ l, active, onHover, onOpen }: { l: Listing; active: boolean; onHover: (id: string | null) => void; onOpen: () => void }) {
  return (
    <div onMouseEnter={() => onHover(l.id)} onMouseLeave={() => onHover(null)} onClick={onOpen}
      className={clsx('group flex cursor-pointer gap-3 rounded-2xl p-2 ring-1 transition-all duration-300 ease-silk', active ? 'bg-champagne/[0.06] ring-champagne/30' : 'bg-white/[0.015] ring-white/[0.05] hover:bg-white/[0.04]')}>
      <div className="relative h-[84px] w-[118px] shrink-0 overflow-hidden rounded-xl"><img src={l.photo} alt="" className="h-full w-full object-cover transition-transform duration-[1.4s] ease-silk group-hover:scale-110" /><span className="absolute left-1.5 top-1.5"><DpeBadge c={l.dpe} size="sm" /></span></div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0"><div className="truncate text-[13.5px] font-medium">{l.title}</div><div className="truncate text-[11.5px] text-bone/50">{l.district} · {l.surface} m² · {l.rooms} p.</div></div>
          <span className="num shrink-0 text-[13.5px]">{eur(l.price)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3"><Metric icon={<Eye size={12} />} v={l.views} label="Vues" /><Metric icon={<ChatCircleDots size={12} />} v={l.contacts} label="Contacts" /><Metric icon={<DoorOpen size={12} />} v={l.visits} label="Visites" /></div>
          <Pill tone={STATUS_TONE[l.status]}>{l.status}</Pill>
        </div>
      </div>
    </div>
  )
}

/* ——— Modale création / édition ——— */
function BienForm({ initial, onClose, onSaved }: { initial?: Listing; onClose: () => void; onSaved: (id: string) => void }) {
  const [, ops] = useProperties()
  const [agents] = useAgents()
  const [photo, setPhoto] = useState(initial?.photo ?? img('house-garden'))
  const [uploading, setUploading] = useState(false)
  const pickPhoto = async (f?: File) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return toast('Choisissez une image (JPG, PNG, WebP)', 'error')
    setUploading(true)
    try { const saved = await uploadFile(f); setPhoto(`/api/files/${saved.id}/raw`); toast('Photo importée — original conservé') } catch (e) { toast(errText(e), 'error') } finally { setUploading(false) }
  }
  const save = async (v: Record<string, string>) => {
    const n = (k: string) => Number(String(v[k] ?? '').replace(/\s/g, '').replace(',', '.')) || 0
    if (!v.title?.trim() || !v.address?.trim() || !v.city?.trim()) throw new Error('Titre, adresse et ville sont obligatoires')
    if (n('price') <= 0 || n('surface') <= 0) throw new Error('Prix et surface doivent être renseignés')
    if (uploading) throw new Error('Import de la photo en cours, patientez')
    const district = v.district?.trim() || v.city.trim()
    let lng = n('lng'), lat = n('lat')
    if (!lng || !lat) {
      if (initial) { lng = initial.lng; lat = initial.lat }
      else { const z = ZONES[district] ?? ZONES[v.city.trim()]; const c = z?.c ?? ANTIBES; lng = c[0] + (Math.random() - 0.5) * 0.006; lat = c[1] + (Math.random() - 0.5) * 0.004 }
    }
    const gallery = initial ? (initial.gallery.includes(photo) ? initial.gallery : [photo, ...initial.gallery]) : [photo]
    const patch: Partial<Listing> = {
      title: v.title.trim(), type: v.type, status: v.status as ListingStatus, address: v.address.trim(), district, city: v.city.trim(),
      surface: n('surface'), rooms: n('rooms'), land: n('land'), price: n('price'), dpe: v.dpe as Listing['dpe'], year: n('year') || 2000, agentId: v.agentId, lng, lat,
      features: (v.features ?? '').split(',').map((x) => x.trim()).filter(Boolean), photo, gallery,
      photoCount: n('photoCount'), plan: v.plan === 'on', tour3d: (v.tour3d ?? '').trim(), energyCost: (v.energyCost ?? '').trim(), fees: (v.fees ?? '').trim(), description: (v.description ?? '').trim(),
    }
    const full = norm({ ...(initial ?? ({} as Listing)), ...patch } as Listing)
    patch.checks = full.checks; patch.quality = full.quality
    if (initial) { await ops.update(initial.id, patch); onSaved(initial.id) }
    else {
      const created = await ops.create({ ...patch, ref: `MDT-26-${String(Date.now()).slice(-4)}`, estimateLow: Math.round(patch.price! * 0.94 / 10000) * 10000, estimateHigh: Math.round(patch.price! * 1.04 / 10000) * 10000, days: 0, views: 0, contacts: 0, visits: 0, offers: 0, daily: Array(14).fill(0), portals: blankPortals() })
      onSaved(created.id)
    }
    onClose()
  }
  const i = initial
  return (
    <AsyncForm submitLabel={i ? 'Enregistrer les modifications' : 'Créer le bien'} success={i ? 'Fiche mise à jour — qualité recalculée' : 'Bien créé en brouillon'} onCancel={onClose} onSubmit={save}>
      <div className="flex items-center gap-4 rounded-2xl bg-white/[0.02] p-3 ring-1 ring-white/[0.06]">
        <img src={photo} alt="" className="h-20 w-28 shrink-0 rounded-xl object-cover" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px]">Photo principale</div>
          <div className="text-[11.5px] text-mist">L’original est conservé ; toute retouche IA sera étiquetée.</div>
          <label className={clsx('mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/[0.04] px-3.5 py-1.5 text-[12.5px] ring-1 ring-white/[0.08] transition hover:bg-white/[0.08]', uploading && 'pointer-events-none opacity-60')}>
            <UploadSimple size={13} />{uploading ? 'Import…' : 'Importer une photo'}
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} />
          </label>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Titre de l’annonce" className="sm:col-span-2"><Input name="title" required defaultValue={i?.title} placeholder="Villa contemporaine vue mer" /></Field>
        <Field label="Type"><Select name="type" defaultValue={i?.type ?? 'Villa'}>{['Villa', 'Maison', 'Appartement'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Field label="Statut"><Select name="status" defaultValue={i?.status ?? 'Brouillon'}>{STATUSES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Field label="Adresse" className="sm:col-span-2"><Input name="address" required defaultValue={i?.address} placeholder="14 chemin des Nielles" /></Field>
        <Field label="Ville"><Input name="city" required defaultValue={i?.city ?? 'Antibes'} /></Field>
        <Field label="Quartier"><Input name="district" defaultValue={i?.district} placeholder="Cap d’Antibes" list="bien-zones" /><datalist id="bien-zones">{Object.keys(ZONES).map((z) => <option key={z} value={z} />)}</datalist></Field>
        <Field label="Prix honoraires inclus (€)"><Input name="price" type="number" min={0} step={1000} required defaultValue={i?.price} inputMode="numeric" /></Field>
        <Field label="Surface habitable (m²)"><Input name="surface" type="number" min={1} required defaultValue={i?.surface} inputMode="numeric" /></Field>
        <Field label="Pièces"><Input name="rooms" type="number" min={0} defaultValue={i?.rooms} inputMode="numeric" /></Field>
        <Field label="Terrain (m²)"><Input name="land" type="number" min={0} defaultValue={i?.land} inputMode="numeric" /></Field>
        <Field label="DPE"><Select name="dpe" defaultValue={i?.dpe ?? 'C'}>{'ABCDEFG'.split('').map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Field label="Année de construction"><Input name="year" type="number" min={1500} max={2030} defaultValue={i?.year} inputMode="numeric" /></Field>
        <Field label="Conseiller" className="sm:col-span-2"><Select name="agentId" defaultValue={i?.agentId ?? me.id}>{agents.filter((a) => a.mandats > 0).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field>
        <Field label="Atouts (séparés par des virgules)" className="sm:col-span-2"><Input name="features" defaultValue={i?.features?.join(', ')} placeholder="Piscine, Vue mer, Garage" /></Field>
      </div>
      <div className="rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06]">
        <div className="mb-3 text-[11px] uppercase tracking-eyebrow text-mist">Qualité d’annonce · mentions</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Photos HD disponibles"><Input name="photoCount" type="number" min={0} defaultValue={i ? (i.photoCount ?? (i.checks.photos ? 16 : i.gallery.length)) : 1} inputMode="numeric" /></Field>
          <Field label="Visite 3D (lien)"><Input name="tour3d" type="url" defaultValue={i ? (i.tour3d ?? (i.checks.visite3d ? 'https://my.matterport.com/' : '')) : ''} placeholder="https://…" /></Field>
          <Field label="Coûts énergétiques estimés" hint="Obligatoire avec l’étiquette DPE"><Input name="energyCost" defaultValue={i ? (i.energyCost ?? (i.checks.dpe ? 'Entre 1 840 € et 2 490 € par an (prix 2021)' : '')) : ''} placeholder="Entre 1 840 € et 2 490 € par an" /></Field>
          <Field label="Honoraires TTC et charge" hint="Obligatoire"><Input name="fees" defaultValue={i ? (i.fees ?? (i.checks.honoraires ? '4 % TTC à la charge du vendeur' : '')) : ''} placeholder="4 % TTC à la charge du vendeur" /></Field>
          <label className="flex items-center gap-2.5 text-[13px] sm:col-span-2"><input type="checkbox" name="plan" defaultChecked={i ? (i.plan ?? i.checks.plan) : false} className="h-4 w-4 accent-[rgb(var(--acc-500))]" />Plan 2D coté disponible</label>
        </div>
      </div>
      <Field label="Description" hint="1 200 signes minimum pour une annonce complète"><Textarea name="description" rows={5} defaultValue={i?.description ?? ''} placeholder="Ce que l’on voit, ce que l’on vit, sans superlatif creux." /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Longitude" hint="Vide : déduite du quartier"><Input name="lng" type="number" step="any" defaultValue={i?.lng} /></Field>
        <Field label="Latitude"><Input name="lat" type="number" step="any" defaultValue={i?.lat} /></Field>
      </div>
    </AsyncForm>
  )
}

/* ——— Tiroir fiche ——— */
function Drawer({ l, dossierId, onClose, onEdit }: { l: Listing; dossierId?: string; onClose: () => void; onEdit: () => void }) {
  const [, ops] = useProperties()
  const [, actOps] = useActivity()
  const [, taskOps] = useTasks()
  const [photo, setPhoto] = useState(0)
  const [tab, setTab] = useState<'diffusion' | 'stats' | 'qualite'>('diffusion')
  const [confirmDel, setConfirmDel] = useState(false)
  const a = agent(l.agentId)
  const max = Math.max(...l.daily, 1)
  const missing = QUALITY_CHECKS.filter((c) => !l.checks[c.k])
  const legalMissing = missing.filter((c) => 'legal' in c)
  const aiIdx = l.gallery.length > 2 ? l.gallery.length - 1 : -1
  const funnel = [['Vues', l.views], ['Contacts', l.contacts], ['Visites', l.visits], ['Offres', l.offers]] as const
  const extra = (l.photoCount ?? (l.checks.photos ? 16 : 0)) - l.gallery.length

  const setPortal = async (p: Portal, state: PortalState, note: string | undefined, log: string) => {
    try {
      await ops.update(l.id, { portals: { ...l.portals, [p]: { ...l.portals[p], state, note, views: state === 'publiee' ? l.portals[p].views : 0 } } })
      actOps.create({ t: hhmm(), at: new Date().toISOString(), who: me.name, what: `${log} — ${l.title} · ${p}`, tone: 'neutral', link: '/app/biens' }).catch(() => {})
      toast(state === 'consigne' ? `${p} : ${NOT_WIRED.toLowerCase()}` : `${p} : ${PORTAL_STATE[state].l.toLowerCase()}`, state === 'consigne' ? 'info' : 'ok')
    } catch (e) { toast(errText(e), 'error') }
  }
  const diffuse = (p: Portal) => {
    if (legalMissing.length) return toast(`Diffusion bloquée : ${legalMissing.map((m) => m.l.split(' et ')[0].toLowerCase()).join(', ')} manquant(s)`, 'error')
    setPortal(p, 'consigne', NOT_WIRED, 'a demandé la diffusion (consignée, connecteur non configuré)')
  }
  const remove = async () => {
    if (dossierId) return toast('Ce bien est rattaché à un dossier vendeur : archivez-le plutôt que de le supprimer', 'error')
    try { await ops.remove(l.id); toast('Bien supprimé'); onClose() } catch (e) { toast(errText(e), 'error') }
  }
  const order3d = async () => {
    try { await taskOps.create({ title: `Commander la visite 3D — ${l.title}`, due: 'Cette semaine', prio: 'normale', kind: 'document' }); toast('Tâche créée — prestataire 3D non connecté, commande à passer') } catch (e) { toast(errText(e), 'error') }
  }

  return (
    <motion.div className="fixed inset-0 z-[70] flex justify-end bg-ink/55 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.aside onClick={(e) => e.stopPropagation()} initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 80, opacity: 0 }} transition={{ duration: 0.6, ease: EXPO }} className="thin-scroll h-full w-full max-w-[680px] overflow-y-auto border-l border-white/[0.07] bg-ink-850" aria-label={`Fiche ${l.title}`}>
        <div className="relative h-[340px] overflow-hidden">
          <AnimatePresence mode="popLayout"><motion.img key={photo} src={l.gallery[photo] ?? l.photo} alt={l.title} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1, ease: EXPO }} className="absolute inset-0 h-full w-full object-cover" /></AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-ink-850 via-ink-850/20 to-ink/30" />
          <div className="absolute right-4 top-4"><IconBtn label="Fermer" onClick={onClose}><X size={15} /></IconBtn></div>
          <div className="absolute left-4 top-4 flex gap-1.5"><span className="rounded-full bg-ink/75 backdrop-blur-md"><Pill tone={STATUS_TONE[l.status]}>{l.status}</Pill></span><span className="num rounded-full bg-ink/60 px-2 py-[3px] text-[10.5px] text-bone/70 backdrop-blur-md">{l.ref}</span></div>
          {photo === aiIdx && <span className="absolute bottom-[86px] left-5 flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 text-[10.5px] text-champagne-300 ring-1 ring-champagne/25 backdrop-blur-md"><Sparkle size={11} weight="fill" />Home staging IA · étiqueté · original conservé</span>}
          <div className="absolute inset-x-0 bottom-0 flex gap-2 overflow-x-auto p-5 scrollbar-none">
            {l.gallery.map((g, i) => (
              <button key={g + i} onClick={() => setPhoto(i)} className={clsx('relative h-14 w-20 shrink-0 overflow-hidden rounded-xl ring-2 transition-all duration-300', i === photo ? 'ring-champagne' : 'ring-transparent opacity-60 hover:opacity-100')}><img src={g} alt="" className="h-full w-full object-cover" /></button>
            ))}
            {extra > 0 && <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-[10.5px] text-mist ring-1 ring-white/10"><ImageSquare size={14} className="mr-1" />+{extra}</span>}
          </div>
        </div>

        <div className="p-6 md:p-7">
          <div className="flex items-start justify-between gap-3">
            <div className="text-[10.5px] uppercase tracking-eyebrow text-mist">{l.type} · {l.district}</div>
            <div className="flex gap-1.5">
              <SoftBtn icon={<PencilSimple size={13} />} onClick={onEdit}>Modifier</SoftBtn>
              {confirmDel
                ? <button onClick={remove} onMouseLeave={() => setConfirmDel(false)} className="inline-flex items-center gap-1.5 rounded-full bg-coral/15 px-3.5 py-2 text-[12.5px] font-medium text-coral ring-1 ring-coral/30">Confirmer la suppression</button>
                : <IconBtn label="Supprimer le bien" onClick={() => setConfirmDel(true)}><Trash size={14} /></IconBtn>}
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap items-end justify-between gap-3">
            <h2 className="display text-4xl md:text-[2.7rem]">{l.title}</h2>
            <div className="text-right"><div className="num text-2xl">{eur(l.price)}</div><div className="num text-[11px] text-mist">honoraires inclus · {l.surface ? fmt(Math.round(l.price / l.surface)) : '—'} €/m²</div></div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-bone/55"><MapPin size={13} />{l.address}, {l.city}</div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[[<Ruler size={15} />, `${l.surface} m²`, 'Surface'], [<Bed size={15} />, `${l.rooms} pièces`, 'Pièces'], [<Tree size={15} />, l.land ? `${fmt(l.land)} m²` : '—', 'Terrain'], [<DpeBadge c={l.dpe} size="sm" />, `Classe ${l.dpe}`, 'DPE']].map(([ic, v, k]) => (
              <div key={k as string} className="rounded-2xl bg-white/[0.025] p-3 ring-1 ring-white/[0.05]"><div className="flex items-center gap-2 text-champagne-300">{ic}</div><div className="mt-2 text-[13.5px]">{v}</div><div className="text-[10.5px] uppercase tracking-eyebrow text-mist">{k}</div></div>
            ))}
          </div>
          {l.features.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{l.features.map((f) => <span key={f} className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11.5px] text-bone/70 ring-1 ring-white/[0.06]">{f}</span>)}</div>}
          {l.description && <p className="mt-4 line-clamp-4 text-[13px] leading-relaxed text-bone/65">{l.description}</p>}
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/[0.02] p-3 ring-1 ring-white/[0.05]"><Avatar src={a.photo} size={30} /><div className="min-w-0 flex-1 text-[12.5px]"><div>{a.name}</div><div className="text-[11px] text-mist">{a.role} · {a.agency}</div></div>{dossierId ? <Link to={`/app/dossiers/${dossierId}`}><SoftBtn icon={<ArrowUpRight size={13} />}>Dossier vendeur</SoftBtn></Link> : <span className="text-[11px] text-mist">Aucun dossier lié</span>}</div>

          <div className="mt-7"><Tabs id="bien-drawer" value={tab} onChange={setTab} items={[{ id: 'diffusion', label: 'Diffusion' }, { id: 'stats', label: 'Statistiques' }, { id: 'qualite', label: 'Qualité', count: l.quality }]} /></div>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: EXPO }} className="mt-5">
              {tab === 'diffusion' && (
                <div className="space-y-2">
                  {legalMissing.length > 0 && <div className="flex items-start gap-2.5 rounded-2xl bg-coral/[0.07] p-3 text-[12.5px] text-bone/80 ring-1 ring-coral/20"><Prohibit size={15} className="mt-0.5 shrink-0 text-coral" /><span>Diffusion bloquée tant que manquent : {legalMissing.map((m) => m.l.toLowerCase()).join(' ; ')}. <button onClick={onEdit} className="text-coral underline-offset-2 hover:underline">Compléter la fiche</button></span></div>}
                  {PORTALS.map((p) => {
                    const s = l.portals[p], st = PORTAL_STATE[s.state]
                    return (
                      <div key={p} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white/[0.02] p-3 ring-1 ring-white/[0.05]">
                        <span className="num flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-[11px] text-bone/80 ring-1 ring-white/[0.08]">{MONO[p]}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-[13.5px]">{p}<Pill tone={st.tone}>{st.l}</Pill></div>
                          <div className="mt-0.5 truncate text-[11.5px] text-mist">{s.state === 'publiee' ? <><span className="num">{fmt(s.views)}</span> vues · dernière synchro importée</> : s.note ?? (s.state === 'off' ? 'Portail non activé pour ce bien' : '')}</div>
                        </div>
                        {s.state === 'rejetee' && <><SoftBtn icon={<PencilSimple size={13} />} onClick={onEdit}>Corriger la fiche</SoftBtn><SoftBtn tone="gold" icon={<Broadcast size={13} />} onClick={() => diffuse(p)}>Rediffuser</SoftBtn></>}
                        {s.state === 'attente' && <span className="flex items-center gap-1 text-[11.5px] text-sea"><Clock size={13} />Modération</span>}
                        {s.state === 'off' && <SoftBtn icon={<Broadcast size={13} />} onClick={() => diffuse(p)}>Diffuser</SoftBtn>}
                        {(s.state === 'publiee' || s.state === 'consigne') && <>
                          {s.state === 'publiee' && <CheckCircle size={18} weight="fill" className="shrink-0 text-sage" />}
                          <button onClick={() => setPortal(p, 'off', s.state === 'publiee' ? 'Retrait consigné — connecteur portail non configuré' : undefined, 'a retiré la diffusion')} className="text-[11.5px] text-mist transition hover:text-coral">Retirer</button>
                        </>}
                      </div>
                    )
                  })}
                  <p className="pt-2 text-[11.5px] text-bone/45">Aucune publication sans votre validation. Les connecteurs portails ne sont pas encore configurés : chaque demande est consignée au journal et reprise à la connexion.</p>
                </div>
              )}
              {tab === 'stats' && (
                <div className="space-y-5">
                  <div>
                    <div className="mb-3 flex items-center justify-between text-[11px] text-mist"><span className="uppercase tracking-eyebrow">Vues · 14 derniers jours</span><span className="num">{fmt(l.daily.reduce((s, x) => s + x, 0))} au total</span></div>
                    <div className="flex h-32 items-end gap-1.5">
                      {l.daily.map((v, i) => <motion.div key={i} title={`${v} vues`} initial={{ height: 0 }} animate={{ height: `${Math.max(4, (v / max) * 100)}%` }} transition={{ duration: 0.9, delay: i * 0.03, ease: EXPO }} className={clsx('flex-1 rounded-t-md', i === l.daily.length - 1 ? 'bg-champagne' : 'bg-champagne/30 hover:bg-champagne/60')} />)}
                    </div>
                    <div className="num mt-1.5 flex justify-between text-[10px] text-mist"><span>28 sept.</span><span>11 oct.</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {funnel.map(([k, v], i) => (
                      <div key={k} className="rounded-2xl bg-white/[0.025] p-3 ring-1 ring-white/[0.05]">
                        <div className="text-[10.5px] uppercase tracking-eyebrow text-mist">{k}</div>
                        <div className="display mt-1 text-3xl">{fmt(v)}</div>
                        {i > 0 && <div className="num text-[11px] text-champagne-300">{funnel[i - 1][1] ? ((v / funnel[i - 1][1]) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : 0} %</div>}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl bg-sea/[0.06] p-4 text-[12.5px] leading-relaxed text-bone/75 ring-1 ring-sea/20">
                    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-eyebrow text-sea"><Sparkle size={11} weight="fill" />Lecture du copilote</span>
                    <p className="mt-1.5">{l.views ? <>Taux de contact {((l.contacts / l.views) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} % pour une médiane de 1,6 % sur les biens comparables du secteur. </> : 'Pas encore de statistiques : le bien n’est diffusé sur aucun portail connecté. '}{l.checks.visite3d ? 'La visite 3D est en place.' : 'Ajouter une visite 3D augmente en moyenne les contacts de 22 % sur ce segment.'}</p>
                  </div>
                </div>
              )}
              {tab === 'qualite' && (
                <div>
                  <div className="flex items-center gap-5 rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.05]">
                    <Ring key={l.quality} value={l.quality} size={78} stroke={4} color={l.quality >= 85 ? 'rgb(var(--sage))' : l.quality >= 65 ? 'rgb(var(--acc-500))' : 'rgb(var(--coral))'}><span className="display text-2xl">{l.quality}</span></Ring>
                    <div><div className="text-[14px]">{l.quality >= 85 ? 'Annonce exemplaire' : l.quality >= 65 ? 'Bonne annonce, quelques manques' : 'Annonce à compléter avant diffusion'}</div><div className="mt-0.5 text-[12px] text-mist">{missing.length ? `${missing.length} élément${missing.length > 1 ? 's' : ''} manquant${missing.length > 1 ? 's' : ''}${legalMissing.length ? `, dont ${legalMissing.length} obligatoire${legalMissing.length > 1 ? 's' : ''}` : ', aucun obligatoire'}` : 'Tous les critères sont remplis'} · recalculé depuis la fiche</div></div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {QUALITY_CHECKS.map((c) => {
                      const ok = l.checks[c.k], legal = 'legal' in c
                      return (
                        <div key={c.k} className={clsx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] ring-1', ok ? 'bg-white/[0.015] ring-white/[0.04]' : legal ? 'bg-coral/[0.06] ring-coral/20' : 'bg-champagne/[0.04] ring-champagne/15')}>
                          {ok ? <CheckCircle size={16} weight="fill" className="shrink-0 text-sage" /> : legal ? <XCircle size={16} weight="fill" className="shrink-0 text-coral" /> : <Warning size={16} weight="fill" className="shrink-0 text-champagne" />}
                          <span className={clsx('flex-1', ok && 'text-bone/55')}>{c.l}</span>
                          {legal && <span className={clsx('text-[10px] uppercase tracking-eyebrow', ok ? 'text-mist' : 'text-coral')}>Obligatoire</span>}
                          <span className="num w-8 text-right text-[11px] text-mist">{c.w}</span>
                        </div>
                      )
                    })}
                  </div>
                  {missing.length > 0 && <div className="mt-4 flex flex-wrap gap-2"><SoftBtn tone="gold" icon={<PencilSimple size={13} />} onClick={onEdit}>Compléter la fiche</SoftBtn>{!l.checks.visite3d && <SoftBtn icon={<Cube size={13} />} onClick={order3d}>Commander la visite 3D</SoftBtn>}</div>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.aside>
    </motion.div>
  )
}

export default function Biens() {
  const [raw] = useProperties()
  const [dossiers] = useDossiers()
  const [view, setView] = useState<'grid' | 'map' | 'split'>('grid')
  const [type, setType] = useState<'all' | 'Villa' | 'Maison' | 'Appartement'>('all')
  const [price, setPrice] = useState<keyof typeof PRICE>('all')
  const [city, setCity] = useState('all')
  const [status, setStatus] = useState<'all' | ListingStatus>('all')
  const [sort, setSort] = useState<'recent' | 'price' | 'views' | 'quality'>('price')
  const [hover, setHover] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [form, setForm] = useState<{ id?: string } | null>(null)
  const [focus, setFocus] = useState<{ center: [number, number]; zoom?: number } | null>(null)

  const all = useMemo(() => raw.map((p) => norm(p as Listing)), [raw])
  const cities = useMemo(() => [...new Set(all.map((l) => l.city))], [all])
  const list = useMemo(() => {
    const f = all.filter((l) => (type === 'all' || l.type === type) && inPrice(price, l.price) && (city === 'all' || l.city === city) && (status === 'all' || l.status === status))
    const by = { recent: (a: Listing, b: Listing) => a.days - b.days, price: (a: Listing, b: Listing) => b.price - a.price, views: (a: Listing, b: Listing) => b.views - a.views, quality: (a: Listing, b: Listing) => a.quality - b.quality }[sort]
    return [...f].sort(by)
  }, [all, type, price, city, status, sort])
  const markers = useMemo(() => list.map((l) => ({ id: l.id, lng: l.lng, lat: l.lat, label: eur(l.price), tone: l.status === 'Diffusé' ? 'gold' as const : l.status === 'Avant-première' ? 'sage' as const : 'sea' as const, title: l.title })), [list])
  const hovered = list.find((l) => l.id === hover)
  const open = all.find((l) => l.id === openId)
  const editing = form?.id ? all.find((l) => l.id === form.id) : undefined
  const live = all.filter((l) => l.status === 'Diffusé').length
  const pubs = all.reduce((s, l) => s + PORTALS.filter((p) => l.portals[p].state === 'publiee').length, 0)
  const avgQ = all.length ? Math.round(all.reduce((s, l) => s + l.quality, 0) / all.length) : 0
  const filtered = type !== 'all' || price !== 'all' || city !== 'all' || status !== 'all'
  const openL = (l?: Listing) => { if (!l) return; setOpenId(l.id); setFocus({ center: [l.lng, l.lat], zoom: 14 }) }

  return (
    <div>
      <PageHeader
        kicker={`Portefeuille · ${all.length} biens sous mandat`}
        title={<>Biens <span className="italic text-champagne-300">en vitrine</span></>}
        sub={<>{live} diffusés · {pubs} publications portails · {fmt(all.reduce((s, l) => s + l.views, 0))} vues cumulées · qualité moyenne d’annonce {avgQ}/100.</>}
        actions={<>
          <Tabs id="biens-view" value={view} onChange={setView} items={[{ id: 'grid', label: <span className="flex items-center gap-1.5"><SquaresFour size={14} />Grille</span> }, { id: 'map', label: <span className="flex items-center gap-1.5"><MapTrifold size={14} />Carte</span> }, { id: 'split', label: <span className="flex items-center gap-1.5"><Columns size={14} />Split</span> }]} />
          <SoftBtn tone="gold" icon={<Plus size={14} />} onClick={() => setForm({})}>Nouveau bien</SoftBtn>
        </>}
      />

      <Stagger className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Biens diffusés" value={live} hint={`${all.filter((l) => l.status === 'Avant-première').length} en avant-première · ${all.filter((l) => l.status === 'Brouillon').length} brouillon(s)`} />
        <Stat label="Vues · 14 jours" value={fmt(all.reduce((s, l) => s + l.daily.reduce((a, b) => a + b, 0), 0))} hint="Tous portails confondus" />
        <Stat label="Contacts qualifiés" value={fmt(all.reduce((s, l) => s + l.contacts, 0))} hint={`${fmt(all.reduce((s, l) => s + l.visits, 0))} visites réalisées`} />
        <Stat label="Annonces à corriger" value={all.filter((l) => Object.values(l.portals).some((p) => p.state === 'rejetee') || l.quality < 65).length} hint="Rejets portail ou mentions manquantes" />
      </Stagger>

      <Stagger i={1} className="mb-5 flex flex-wrap items-center gap-2">
        <Tabs id="biens-type" value={type} onChange={setType} items={[{ id: 'all', label: 'Tous', count: all.length }, { id: 'Villa', label: 'Villas' }, { id: 'Maison', label: 'Maisons' }, { id: 'Appartement', label: 'Appartements' }]} />
        <FilterSelect label="Prix" value={price} onChange={setPrice} options={Object.entries(PRICE) as [keyof typeof PRICE, string][]} />
        <FilterSelect label="Secteur" value={city} onChange={setCity} options={[['all', 'Tous'], ...cities.map((c) => [c, c] as [string, string])]} />
        <FilterSelect label="Statut" value={status} onChange={setStatus} options={[['all', 'Tous'], ...STATUSES.map((s) => [s, s] as [ListingStatus, string])]} />
        <FilterSelect label="Tri" value={sort} onChange={setSort} options={[['recent', 'Plus récents'], ['price', 'Prix décroissant'], ['views', 'Plus vus'], ['quality', 'Qualité à revoir']]} />
        <span className="ml-auto flex items-center gap-2 text-[12px] text-mist"><SlidersHorizontal size={13} /><span className="num">{list.length}</span> résultat{list.length > 1 ? 's' : ''}{filtered && <button onClick={() => { setType('all'); setPrice('all'); setCity('all'); setStatus('all') }} className="text-champagne-300 hover:underline">Réinitialiser</button>}</span>
      </Stagger>

      {!list.length ? <Empty title={all.length ? 'Aucun bien ne correspond' : 'Aucun bien sous mandat'}>{all.length ? 'Élargissez le prix ou le secteur.' : <button onClick={() => setForm({})} className="text-champagne-300 hover:underline">Créer le premier bien</button>}</Empty> : (
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: EXPO }}>
            {view === 'grid' && (
              <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((l, i) => <ListingCard key={l.id} l={l} big={i === 0 && !filtered} active={hover === l.id} onHover={setHover} onOpen={() => openL(l)} />)}
              </div>
            )}
            {view === 'map' && (
              <Card pad={false} className="overflow-hidden">
                <GeoMap markers={markers} activeId={hover} onHover={setHover} onSelect={(id) => openL(list.find((l) => l.id === id))} focus={focus} fit className="h-[62vh] rounded-[calc(1.4rem-0.25rem)] md:h-[72vh]">
                  <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-1.5">
                    {[['bg-champagne', 'Diffusé'], ['bg-sage', 'Avant-première'], ['bg-sea', 'Offre · compromis · brouillon']].map(([c, l]) => <span key={l} className="flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] text-bone/75 ring-1 ring-white/10 backdrop-blur-md"><span className={clsx('h-1.5 w-1.5 rounded-full', c)} />{l}</span>)}
                  </div>
                  <AnimatePresence>
                    {hovered && (
                      <motion.div key={hovered.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.4, ease: EXPO }} className="pointer-events-none absolute bottom-4 left-4 flex w-[300px] gap-3 rounded-2xl bg-ink-800/90 p-2 shadow-float ring-1 ring-white/10 backdrop-blur-xl">
                        <img src={hovered.photo} alt="" className="h-20 w-24 rounded-xl object-cover" />
                        <div className="min-w-0 py-1"><div className="truncate text-[13px] font-medium">{hovered.title}</div><div className="truncate text-[11px] text-mist">{hovered.district} · {hovered.surface} m²</div><div className="num mt-1.5 text-[15px] text-champagne-300">{eur(hovered.price)}</div></div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GeoMap>
              </Card>
            )}
            {view === 'split' && (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                <div className="thin-scroll order-2 space-y-2 lg:order-1 lg:h-[72vh] lg:overflow-y-auto lg:pr-1">
                  {list.map((l) => <ListRow key={l.id} l={l} active={hover === l.id} onHover={(id) => { setHover(id); if (id) setFocus({ center: [l.lng, l.lat] }) }} onOpen={() => openL(l)} />)}
                </div>
                <Card pad={false} className="order-1 overflow-hidden lg:order-2 lg:sticky lg:top-20">
                  <GeoMap markers={markers} activeId={hover} onHover={setHover} onSelect={(id) => openL(list.find((l) => l.id === id))} focus={focus} fit className="h-[42vh] rounded-[calc(1.4rem-0.25rem)] lg:h-[72vh]" />
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <AnimatePresence>{open && <Drawer key={open.id} l={open} dossierId={dossiers.find((d) => d.propertyId === open.id)?.id} onClose={() => setOpenId(null)} onEdit={() => setForm({ id: open.id })} />}</AnimatePresence>
      <Modal open={!!form} onClose={() => setForm(null)} width={680} kicker={editing ? `${editing.ref} · ${editing.district}` : 'Portefeuille'} title={editing ? <>Modifier <span className="italic text-champagne-300">la fiche</span></> : <>Nouveau <span className="italic text-champagne-300">bien</span></>}>
        {form && <BienForm key={form.id ?? 'new'} initial={editing} onClose={() => setForm(null)} onSaved={(id) => { if (!editing) setOpenId(id) }} />}
      </Modal>
      {view === 'split' && <div className="mt-4 flex items-center gap-2 text-[11.5px] text-mist"><ArrowsClockwise size={12} />Survolez une ligne pour centrer la carte, cliquez pour ouvrir la fiche.</div>}
      {all.some((l) => l.status === 'Brouillon') && view === 'grid' && <div className="mt-4 flex items-center gap-2 text-[11.5px] text-mist"><Archive size={12} />Les brouillons ne sont visibles que par l’agence.</div>}
    </div>
  )
}
