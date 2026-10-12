import { motion, AnimatePresence } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { Plus, CheckCircle, XCircle, PaperPlaneTilt, CalendarPlus, MapPin, Bell, Sparkle, Bank, Ruler, House, ShieldCheck, Clock, Lightning, PencilSimple, Trash, Warning, ArrowUpRight, CalendarX } from '@phosphor-icons/react'
import { PageHeader, Card, Stat, Tabs, SoftBtn, IconBtn, Stagger, Heat, Empty } from '../ui'
import { Pill, Ring, EXPO } from '../../ui/kit'
import { eur, me, type Buyer } from '../../data/mock'
import { ZONES, WISHES, dist, type Listing } from '../../data/geo'
import { useBuyers, useProperties, useDossiers, useEvents, type DocumentDoc } from '../../data/collections'
import { action, useDoc, type Doc } from '../../data/store'
import { Modal, Field, Input, Select, AsyncForm, toast, errText } from '../forms'
import { GeoMap, circle, type GeoShape } from '../GeoMap'
import { DocPaper } from './DossierDetail'

type AlertMode = 'instant' | 'daily' | 'off'
type B = Buyer & Doc & { wishes?: string[]; alert?: AlertMode; l3?: Record<string, string>; dismissed?: string[] }
type Visit = Doc & { day: number; start: string; buyerId?: string; propertyId?: string }

const FIN = { Validé: { tone: 'green', icon: ShieldCheck }, 'En cours': { tone: 'blue', icon: Clock }, 'À vérifier': { tone: 'red', icon: Bank } } as const
const aLieu = (d: string) => (d.startsWith('Les ') ? `aux ${d.slice(4)}` : d.startsWith('La ') ? `à la ${d.slice(3)}` : d.startsWith('Le ') ? `au ${d.slice(3)}` : `à ${d}`)
const initials = (n: string) => n.replace(/^(M\.|Mme|Dr\.)\s*(&\s*(Mme|M\.)\s*)?/, '').split(/\s+/).map((w) => w[0]).slice(0, 2).join('')
const wishesOf = (b: B) => b.wishes ?? WISHES[b.id] ?? []
const modeOf = (b: B): AlertMode => b.alert ?? (b.heat === 3 ? 'instant' : 'daily')
// ponytail: créneaux fixes de la semaine prochaine ; brancher l'agenda Google pour de vraies disponibilités vendeur
const SLOTS = [{ l: 'Mar. 14 oct. · 10:00', day: 14, start: '10:00', end: '11:00' }, { l: 'Mer. 15 oct. · 17:30', day: 15, start: '17:30', end: '18:30' }, { l: 'Sam. 18 oct. · 11:00', day: 18, start: '11:00', end: '12:00' }]

type Crit = { l: string; ok: boolean; d: string }
/** Matching recalculé à chaque rendu sur les biens vivants : 90 pts de critères durs + 10 pts de souhaits. */
function criteria(b: B, p: Listing): { crit: Crit[]; score: number } {
  const inZone = b.zones.some((z) => z === p.district || z === p.city || (ZONES[z] && dist(ZONES[z].c, [p.lng, p.lat]) <= ZONES[z].r * 1.25))
  const typeOk = b.type === p.type || (b.type !== 'Appartement' && p.type !== 'Appartement')
  const hay = ((p.features ?? []).join(' ') + ' ' + p.title).toLowerCase()
  const wishes = wishesOf(b).map((w) => ({ l: w, ok: hay.includes(w.toLowerCase()) }))
  const crit: Crit[] = [
    { l: 'Budget', ok: p.price >= b.budget[0] * 0.85 && p.price <= b.budget[1] * 1.05, d: `${eur(p.price)} pour ${eur(b.budget[0])} – ${eur(b.budget[1])}` },
    { l: 'Zone', ok: inZone, d: inZone ? p.district : `${p.district}, hors zones` },
    { l: 'Type', ok: typeOk, d: `${p.type} · recherché : ${b.type.toLowerCase()}` },
    { l: 'Surface', ok: p.surface >= b.surface * 0.95, d: `${p.surface} m² pour ${b.surface} m² min.` },
    ...wishes.map((w) => ({ l: w.l, ok: w.ok, d: w.ok ? 'Présent' : 'Absent de la fiche' })),
  ]
  const w = [30, 25, 20, 15]
  const base = crit.slice(0, 4).reduce((s, c, i) => s + (c.ok ? w[i] : 0), 0)
  const extra = wishes.length ? (wishes.filter((x) => x.ok).length / wishes.length) * 10 : 10
  return { crit, score: Math.round(base + extra) }
}
const matchesFor = (b: B, props: Listing[], min = 60) => props.filter((p) => p.status !== 'Compromis').map((p) => ({ p, ...criteria(b, p) })).filter((m) => m.score >= min).sort((x, y) => y.score - x.score)

/* ——— Avant-première L3 : génération dans le dossier, validation humaine ensuite ——— */
function L3Modal({ b, p, dossierId, onClose, onDone }: { b: B; p: Listing; dossierId?: string; onClose: () => void; onDone: (docId: string) => void }) {
  const [, ops] = useBuyers()
  const [ok, setOk] = useState([false, false, false, false])
  const [busy, setBusy] = useState(false)
  const all = ok.every(Boolean)
  const send = async () => {
    if (!dossierId) return
    setBusy(true)
    try {
      await action('deliverable.generate', { dossierId, code: 'L3' })
      await ops.update(b.id, { l3: { ...(b.l3 ?? {}), [p.id]: new Date().toISOString() } } as Partial<B>)
      toast('L3 générée — en file de validation, rien n’est envoyé')
      onDone(`${dossierId}-L3`)
    } catch (e) { toast(errText(e), 'error') } finally { setBusy(false) }
  }
  const checks = ['Accord du vendeur pour une diffusion confidentielle', `${b.name} consent aux envois par e-mail (registre)`, 'Aucune image IA non étiquetée', 'J’ai relu le message']
  return (
    <>
      <div className="flex items-center gap-2"><span className="num rounded-full bg-champagne/15 px-2.5 py-1 text-[12px] text-champagne-300">L3</span><span className="text-[12px] text-mist">Avant-première acquéreur · validation requise</span></div>
      <div className="theme-dark mt-5 overflow-hidden rounded-2xl bg-bone-50 text-ink shadow-float">
        <img src={p.photo} alt="" className="h-40 w-full object-cover" />
        <div className="space-y-2.5 p-5 text-[13px] leading-relaxed text-ink/75">
          <div className="flex items-baseline justify-between gap-3"><span className="font-serif text-xl italic text-ink">{p.title}</span><span className="font-serif text-xl text-ink">{eur(p.price)}</span></div>
          <p>Bonjour, avant sa mise en ligne, je souhaitais vous présenter en exclusivité ce bien de {p.surface} m² {aLieu(p.district)}, qui correspond à votre recherche. Je vous propose une visite privée cette semaine.</p>
          <p className="text-[11px] text-ink/45">Prix honoraires inclus · DPE {p.dpe} · {me.name}, {me.agency}</p>
        </div>
      </div>
      {!dossierId && <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-coral/10 px-3.5 py-3 text-[12.5px] text-coral ring-1 ring-coral/20"><Warning size={15} className="mt-0.5 shrink-0" /><span>Aucun dossier vendeur n’est rattaché à ce bien : le livrable L3 ne peut pas être généré. <Link to="/app/dossiers" className="underline underline-offset-2">Créer le dossier</Link></span></div>}
      <div className="mt-5 space-y-1.5">
        {checks.map((t, i) => (
          <label key={t} className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-white/[0.02] px-3 py-2.5 text-[12.5px] ring-1 ring-white/[0.05]">
            <input type="checkbox" checked={ok[i]} onChange={(e) => setOk(ok.map((v, k) => (k === i ? e.target.checked : v)))} className="h-4 w-4 accent-[rgb(var(--acc-500))]" />{t}
          </label>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button disabled={!all || !dossierId || busy} onClick={send} className={clsx('inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-300 ease-silk', all && dossierId ? 'bg-champagne text-ink hover:bg-champagne-300 active:scale-[0.97]' : 'cursor-not-allowed bg-white/[0.04] text-bone/35 ring-1 ring-white/[0.06]')}><PaperPlaneTilt size={14} />{busy ? 'Génération…' : 'Envoyer l’avant-première'}</button>
        <SoftBtn onClick={onClose}>Annuler</SoftBtn>
      </div>
      <p className="mt-3 text-[11px] text-bone/45">Le document est généré dans le dossier vendeur puis placé en file de validation ; l’envoi part seulement après votre validation.</p>
    </>
  )
}

function DocView({ id }: { id: string }) {
  const doc = useDoc<DocumentDoc & Doc>('documents', id)
  if (!doc) return <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-[13px] text-mist">Chargement du document…</div>
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-mist"><Pill tone="gold">À valider</Pill>Version {doc.version} · {new Date(doc.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</div>
      <DocPaper doc={doc} />
      <div className="mt-5 flex flex-wrap gap-2"><Link to={`/app/dossiers/${doc.dossierId}`}><SoftBtn tone="gold" icon={<ArrowUpRight size={13} />}>Valider dans le dossier</SoftBtn></Link></div>
    </>
  )
}

function BuyerForm({ initial, onClose, onSaved }: { initial?: B; onClose: () => void; onSaved: (id: string) => void }) {
  const [, ops] = useBuyers()
  const [zones, setZones] = useState<string[]>(initial?.zones ?? [])
  const toggle = (z: string) => setZones(zones.includes(z) ? zones.filter((x) => x !== z) : [...zones, z])
  const save = async (v: Record<string, string>) => {
    const lo = Number(v.min) || 0, hi = Number(v.max) || 0
    if (!v.name?.trim()) throw new Error('Nom de l’acquéreur obligatoire')
    if (hi <= 0 || lo > hi) throw new Error('Budget incohérent : le maximum doit dépasser le minimum')
    if (!zones.length) throw new Error('Choisissez au moins une zone')
    const patch: Partial<B> = { name: v.name.trim(), budget: [lo, hi], zones, type: v.type, surface: Number(v.surface) || 0, financing: v.financing as B['financing'], heat: Number(v.heat) as B['heat'], source: v.source.trim() || 'Saisie agence', wishes: v.wishes.split(',').map((x) => x.trim()).filter(Boolean) }
    if (initial) { await ops.update(initial.id, patch); onSaved(initial.id) }
    else { const c = await ops.create({ ...patch, match: {}, last: 'Créée aujourd’hui', alert: Number(v.heat) === 3 ? 'instant' : 'daily' }); onSaved(c.id) }
    onClose()
  }
  const i = initial
  return (
    <AsyncForm submitLabel={i ? 'Enregistrer' : 'Créer la recherche'} success={i ? 'Recherche mise à jour — matching recalculé' : 'Recherche créée — matching calculé'} onCancel={onClose} onSubmit={save}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Acquéreur" className="sm:col-span-2"><Input name="name" required defaultValue={i?.name} placeholder="M. & Mme Dupont" /></Field>
        <Field label="Budget minimum (€)"><Input name="min" type="number" min={0} step={10000} required defaultValue={i?.budget[0]} inputMode="numeric" /></Field>
        <Field label="Budget maximum (€)"><Input name="max" type="number" min={0} step={10000} required defaultValue={i?.budget[1]} inputMode="numeric" /></Field>
        <Field label="Type"><Select name="type" defaultValue={i?.type ?? 'Villa'}>{['Villa', 'Maison', 'Appartement'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Field label="Surface minimum (m²)"><Input name="surface" type="number" min={0} defaultValue={i?.surface ?? 120} inputMode="numeric" /></Field>
        <Field label="Financement"><Select name="financing" defaultValue={i?.financing ?? 'À vérifier'}>{['Validé', 'En cours', 'À vérifier'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Field label="Chaleur"><Select name="heat" defaultValue={String(i?.heat ?? 2)}><option value="3">Très chaude</option><option value="2">Active</option><option value="1">Tiède</option></Select></Field>
        <Field label="Source"><Input name="source" defaultValue={i?.source} placeholder="Site agence, recommandation…" /></Field>
        <Field label="Souhaits (virgules)"><Input name="wishes" defaultValue={i ? wishesOf(i).join(', ') : ''} placeholder="Piscine, Vue mer" /></Field>
      </div>
      <div>
        <div className="mb-1.5 text-[11px] uppercase tracking-eyebrow text-mist">Zones recherchées</div>
        <div className="flex flex-wrap gap-1.5">{Object.keys(ZONES).map((z) => <button type="button" key={z} onClick={() => toggle(z)} className={clsx('rounded-full px-3 py-1.5 text-[12px] ring-1 transition-colors', zones.includes(z) ? 'bg-champagne/15 text-champagne-300 ring-champagne/30' : 'bg-white/[0.03] text-bone/60 ring-white/[0.07] hover:text-bone')}>{z}</button>)}</div>
      </div>
    </AsyncForm>
  )
}

export default function Acquereurs() {
  const [buyers, ops] = useBuyers() as unknown as [B[], ReturnType<typeof useBuyers>[1]]
  const [rawProps] = useProperties()
  const [dossiers] = useDossiers()
  const [events, evOps] = useEvents()
  const [filter, setFilter] = useState<'all' | 'hot' | 'ok'>('all')
  const [sel, setSel] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const [l3, setL3] = useState<{ b: string; p: string } | null>(null)
  const [docId, setDocId] = useState<string | null>(null)
  const [slotFor, setSlotFor] = useState<string | null>(null)
  const [form, setForm] = useState<{ id?: string } | null>(null)
  const [rules, setRules] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const props = rawProps as Listing[]
  const b = buyers.find((x) => x.id === sel) ?? buyers[0]
  const list = buyers.filter((x) => filter === 'all' || (filter === 'hot' ? x.heat === 3 : x.financing === 'Validé'))
  const matches = useMemo(() => (b ? matchesFor(b, props).slice(0, 5) : []), [b, props])
  const shapes = useMemo<GeoShape[]>(() => (b ? b.zones.filter((z) => ZONES[z]).map((z) => circle(ZONES[z].c, ZONES[z].r, { id: z, color: 'rgb(var(--acc-500))', opacity: 0.1, dashed: true })) : []), [b])
  const markers = matches.map((m) => ({ id: m.p.id, lng: m.p.lng, lat: m.p.lat, label: `${m.score} %`, tone: m.score >= 90 ? 'sage' as const : 'gold' as const, title: m.p.title }))
  const visits = events as unknown as Visit[]
  const visitOf = (bid: string, pid: string) => visits.find((e) => e.buyerId === bid && e.propertyId === pid)
  const dossierOf = (pid: string) => dossiers.find((d) => d.propertyId === pid)?.id
  const l3Count = buyers.reduce((s, x) => s + Object.keys(x.l3 ?? {}).length, 0)
  const alerts = useMemo(() => buyers.filter((x) => modeOf(x) !== 'off').flatMap((x) => matchesFor(x, props, 80).slice(0, 2).filter((m) => !x.dismissed?.includes(m.p.id)).map((m) => ({ b: x, p: m.p, score: m.score, sent: !!x.l3?.[m.p.id] }))).sort((a, c) => Number(a.sent) - Number(c.sent) || c.score - a.score).slice(0, 8), [buyers, props])

  const plan = async (bid: string, p: Listing, s: (typeof SLOTS)[number]) => {
    const buyer = buyers.find((x) => x.id === bid)!
    try {
      await evOps.create({ day: s.day, start: s.start, end: s.end, title: `Visite — ${p.title}`, who: `${buyer.name} · acquéreur`, place: `${p.address}, ${p.city}`, kind: 'visite', dossier: dossierOf(p.id), source: 'nxt', buyerId: bid, propertyId: p.id } as never)
      await ops.update(bid, { last: `Visite planifiée ${s.l.split(' · ')[0]}` })
      setSlotFor(null); toast(`Visite ajoutée à l’agenda · ${s.l}`)
    } catch (e) { toast(errText(e), 'error') }
  }
  const cancelVisit = async (v: Visit) => { try { await evOps.remove(v.id); toast('Visite retirée de l’agenda') } catch (e) { toast(errText(e), 'error') } }
  const setMode = async (x: B, m: AlertMode) => { try { await ops.update(x.id, { alert: m } as Partial<B>); toast(m === 'off' ? `Alertes coupées · ${x.name}` : `Alerte ${m === 'instant' ? 'immédiate' : 'quotidienne'} · ${x.name}`) } catch (e) { toast(errText(e), 'error') } }
  const dismiss = async (x: B, pid: string) => { try { await ops.update(x.id, { dismissed: [...(x.dismissed ?? []), pid] } as Partial<B>); toast('Alerte ignorée') } catch (e) { toast(errText(e), 'error') } }
  const remove = async () => { if (!b) return; try { await ops.remove(b.id); setSel(null); setConfirmDel(false); toast('Recherche supprimée') } catch (e) { toast(errText(e), 'error') } }

  const l3b = l3 && buyers.find((x) => x.id === l3.b), l3p = l3 && props.find((x) => x.id === l3.p)
  const editing = form?.id ? buyers.find((x) => x.id === form.id) : undefined
  const F = b ? FIN[b.financing] ?? FIN['À vérifier'] : FIN['À vérifier']
  const busy = (s: (typeof SLOTS)[number]) => visits.some((e) => e.day === s.day && e.start === s.start)

  return (
    <div>
      <PageHeader
        kicker={`Demande · ${buyers.length} recherches actives`}
        title={<>Acquéreurs <span className="italic text-champagne-300">qualifiés</span></>}
        sub="Chaque correspondance est recalculée sur les biens en portefeuille et expliquée critère par critère. Les avant-premières partent uniquement après votre validation."
        actions={<><SoftBtn icon={<Bell size={14} />} onClick={() => setRules(true)}>Règles d’alerte</SoftBtn><SoftBtn tone="gold" icon={<Plus size={14} />} onClick={() => setForm({})}>Nouvelle recherche</SoftBtn></>}
      />

      <Stagger className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Recherches actives" value={buyers.length} hint={`${buyers.filter((x) => x.heat === 3).length} très chaudes`} />
        <Stat label="Budget cumulé" value={eur(buyers.reduce((s, x) => s + x.budget[1], 0))} hint="Haut de fourchette" />
        <Stat label="Financements validés" value={`${buyers.filter((x) => x.financing === 'Validé').length}/${buyers.length}`} hint="Attestation bancaire ou fonds propres" />
        <Stat label="Avant-premières L3" value={l3Count} hint={`${visits.filter((e) => e.buyerId).length} visite(s) planifiée(s) depuis cette page`} />
      </Stagger>

      {!b ? <Empty title="Aucune recherche acquéreur"><button onClick={() => setForm({})} className="text-champagne-300 hover:underline">Créer la première recherche</button></Empty> : (
      <div className="grid gap-6 lg:grid-cols-12">
        <Stagger i={1} className="min-w-0 lg:col-span-4">
          <Card title="Recherches" kicker="Triées par chaleur" className="h-full">
            <Tabs id="acq-filter" value={filter} onChange={setFilter} items={[{ id: 'all', label: 'Toutes', count: buyers.length }, { id: 'hot', label: 'Chaudes' }, { id: 'ok', label: 'Financées' }]} />
            <div className="mt-4 space-y-2">
              {!list.length && <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-[12px] text-mist">Aucune recherche dans ce filtre.</div>}
              {[...list].sort((x, y) => y.heat - x.heat).map((x) => {
                const on = x.id === b.id, Fi = FIN[x.financing] ?? FIN['À vérifier']
                return (
                  <button key={x.id} onClick={() => { setSel(x.id); setConfirmDel(false) }} className={clsx('relative block w-full rounded-2xl p-3.5 text-left ring-1 transition-colors duration-300', on ? 'ring-champagne/30' : 'bg-white/[0.015] ring-white/[0.05] hover:bg-white/[0.04]')}>
                    {on && <motion.span layoutId="acq-sel" className="absolute inset-0 rounded-2xl bg-champagne/[0.07]" transition={{ duration: 0.5, ease: EXPO }} />}
                    <div className="relative flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ink-600 to-ink-700 font-serif text-[16px] italic text-champagne-300 ring-1 ring-white/10">{initials(x.name)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2"><span className="truncate text-[13.5px] font-medium">{x.name}</span><Heat n={x.heat} /></div>
                        <div className="num mt-0.5 text-[12px] text-bone/70">{eur(x.budget[0])} – {eur(x.budget[1])}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Pill tone={Fi.tone}><Fi.icon size={11} />{x.financing}</Pill>
                          {x.zones.slice(0, 2).map((z) => <span key={z} className="rounded-full bg-white/[0.04] px-2 py-[3px] text-[10.5px] text-bone/60 ring-1 ring-white/[0.06]">{z}</span>)}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-mist"><span>{x.type} · {x.surface} m² min.</span><span>{x.last}</span></div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>
        </Stagger>

        <div className="min-w-0 space-y-6 lg:col-span-8">
          <Stagger i={2}>
            <Card pad={false}>
              <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <AnimatePresence mode="wait">
                  <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: EXPO }} className="p-5 md:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[10.5px] uppercase tracking-eyebrow text-mist">Recherche · source {b.source}</div>
                      <div className="flex shrink-0 gap-1.5">
                        <IconBtn label="Modifier la recherche" onClick={() => setForm({ id: b.id })}><PencilSimple size={14} /></IconBtn>
                        {confirmDel ? <button onClick={remove} className="rounded-full bg-coral/15 px-3 text-[12px] font-medium text-coral ring-1 ring-coral/30">Confirmer</button> : <IconBtn label="Supprimer la recherche" onClick={() => setConfirmDel(true)}><Trash size={14} /></IconBtn>}
                      </div>
                    </div>
                    <h2 className="display mt-1.5 text-4xl">{b.name}</h2>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {[[<Bank size={14} />, `${eur(b.budget[0])} – ${eur(b.budget[1])}`, 'Budget'], [<House size={14} />, b.type, 'Type'], [<Ruler size={14} />, `${b.surface} m² min.`, 'Surface'], [<F.icon size={14} />, b.financing, 'Financement']].map(([ic, v, k]) => (
                        <div key={k as string} className="rounded-xl bg-white/[0.025] p-2.5 ring-1 ring-white/[0.05]"><div className="flex items-center gap-1.5 text-[10px] uppercase tracking-eyebrow text-mist"><span className="text-champagne-300">{ic}</span>{k}</div><div className="num mt-1 text-[13px]">{v}</div></div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">{b.zones.map((z) => <span key={z} className="flex items-center gap-1 rounded-full bg-champagne/10 px-2.5 py-1 text-[11.5px] text-champagne-300 ring-1 ring-champagne/20"><MapPin size={11} />{z}</span>)}{wishesOf(b).map((w) => <span key={w} className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11.5px] text-bone/70 ring-1 ring-white/[0.06]">{w}</span>)}</div>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-4">
                      <span className="flex items-center gap-1.5 text-[12px] text-mist"><Bell size={13} />Alerte nouveaux biens</span>
                      <Tabs id="acq-alert" value={modeOf(b)} onChange={(v) => setMode(b, v)} items={[{ id: 'instant', label: 'Immédiate' }, { id: 'daily', label: 'Quotidienne' }, { id: 'off', label: 'Off' }]} />
                    </div>
                  </motion.div>
                </AnimatePresence>
                <GeoMap shapes={shapes} markers={markers} activeId={hover} onHover={setHover} fit zoom={11.5} className="h-64 rounded-b-[calc(1.4rem-0.25rem)] md:h-auto md:min-h-[340px] md:rounded-bl-none md:rounded-r-[calc(1.4rem-0.25rem)]">
                  <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[10.5px] text-bone/70 ring-1 ring-white/10 backdrop-blur-md">Zones recherchées · {b.zones.length}</span>
                </GeoMap>
              </div>
            </Card>
          </Stagger>

          <Stagger i={3}>
            <Card title="Biens compatibles" kicker={`Matching expliqué · ${matches.length} bien${matches.length > 1 ? 's' : ''} au-dessus de 60 %`} action={<span className="flex items-center gap-1.5 text-[11.5px] text-champagne-300"><Sparkle size={12} weight="fill" />Sur {props.length} biens vivants</span>}>
              {!matches.length && <Empty title="Aucun bien compatible">Élargissez le budget ou les zones de la recherche.</Empty>}
              <div className="space-y-3">
                {matches.map(({ p, crit, score }, i) => {
                  const k = `${b.id}:${p.id}`, miss = crit.filter((c) => !c.ok), v = visitOf(b.id, p.id), sentAt = b.l3?.[p.id]
                  return (
                    <motion.div key={k} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: i * 0.05, ease: EXPO }} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)}
                      className={clsx('rounded-2xl p-3 ring-1 transition-colors duration-300', hover === p.id ? 'bg-white/[0.04] ring-champagne/25' : 'bg-white/[0.015] ring-white/[0.05]')}>
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="theme-dark relative h-36 shrink-0 overflow-hidden rounded-xl sm:h-auto sm:w-40"><img src={p.photo} alt="" className="h-full w-full object-cover" /><span className="num absolute bottom-2 left-2 rounded-full bg-ink/70 px-2 py-0.5 text-[11.5px] text-bone backdrop-blur-md">{eur(p.price)}</span></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0"><div className="truncate text-[14px] font-medium">{p.title}</div><div className="truncate text-[12px] text-bone/50">{p.district} · {p.surface} m² · {p.rooms} pièces · {p.status}</div></div>
                            <Ring key={score} value={score} size={50} stroke={3} color={score >= 90 ? 'rgb(var(--sage))' : score >= 75 ? 'rgb(var(--acc-500))' : 'rgb(var(--coral))'}><span className="num text-[12px]">{score}</span></Ring>
                          </div>
                          <div className="mt-2.5 grid gap-x-4 gap-y-1 sm:grid-cols-2">
                            {crit.map((c) => <div key={c.l} className="flex items-center gap-2 text-[12px]" title={c.d}>{c.ok ? <CheckCircle size={14} weight="fill" className="shrink-0 text-sage" /> : <XCircle size={14} weight="fill" className="shrink-0 text-coral" />}<span className={c.ok ? 'text-bone/80' : 'text-bone/55'}>{c.l}</span><span className="truncate text-[11px] text-mist">{c.d}</span></div>)}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {sentAt ? <button onClick={() => { const d = dossierOf(p.id); if (d) setDocId(`${d}-L3`) }}><Pill tone="green"><CheckCircle size={11} weight="fill" />L3 générée le {new Date(sentAt).toLocaleDateString('fr-FR')} · voir</Pill></button> : <SoftBtn tone="gold" icon={<PaperPlaneTilt size={13} />} onClick={() => setL3({ b: b.id, p: p.id })}>Envoyer l’avant-première</SoftBtn>}
                            {v ? <span className="inline-flex items-center gap-1.5"><Pill tone="blue"><CalendarPlus size={11} />Visite le {v.day} oct. à {v.start}</Pill><button onClick={() => cancelVisit(v)} title="Annuler la visite" className="text-mist transition hover:text-coral"><CalendarX size={14} /></button></span> : <SoftBtn icon={<CalendarPlus size={13} />} onClick={() => setSlotFor(slotFor === k ? null : k)}>Planifier une visite</SoftBtn>}
                            {miss.length > 0 && <span className="text-[11px] text-mist">{miss.length} critère{miss.length > 1 ? 's' : ''} manquant{miss.length > 1 ? 's' : ''}</span>}
                          </div>
                          <AnimatePresence>
                            {slotFor === k && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: EXPO }} className="overflow-hidden">
                                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-sea/[0.06] p-2.5 ring-1 ring-sea/15">
                                  <span className="text-[11px] text-sea">Créneaux libres dans votre agenda :</span>
                                  {SLOTS.map((s) => <button key={s.l} disabled={busy(s)} onClick={() => plan(b.id, p, s)} className="num rounded-full bg-white/[0.04] px-3 py-1 text-[11.5px] ring-1 ring-white/10 transition enabled:hover:bg-sea/20 enabled:hover:ring-sea/40 disabled:cursor-not-allowed disabled:opacity-35" title={busy(s) ? 'Créneau déjà occupé' : undefined}>{s.l}</button>)}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </Card>
          </Stagger>

          <Stagger i={4}>
            <Card title="Alertes nouveaux biens" kicker="Recherches alertées · correspondances ≥ 80 %" action={<Lightning size={15} weight="fill" className="text-champagne" />}>
              {!alerts.length ? <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-[12px] text-mist">Aucune alerte en attente.</div> : (
                <div className="divide-y divide-white/[0.05]">
                  {alerts.map((a) => (
                    <div key={a.b.id + a.p.id} className="flex flex-wrap items-center gap-3 py-2.5">
                      <span className={clsx('h-2 w-2 shrink-0 rounded-full', a.sent ? 'bg-white/15' : 'bg-champagne')} />
                      <button onClick={() => setSel(a.b.id)} className="min-w-0 flex-1 text-left text-[12.5px]"><span className="font-medium">{a.p.title}</span> <span className="text-bone/55">compatible à</span> <span className="num text-champagne-300">{a.score} %</span> <span className="text-bone/55">pour {a.b.name}</span></button>
                      <span className="hidden text-[11px] text-mist sm:inline">{modeOf(a.b) === 'instant' ? 'Immédiate' : 'Quotidienne'}</span>
                      {a.sent ? <span className="text-[11px] text-mist">L3 générée</span> : <><button onClick={() => dismiss(a.b, a.p.id)} className="text-[11.5px] text-mist transition hover:text-bone">Ignorer</button><SoftBtn icon={<PaperPlaneTilt size={12} />} onClick={() => setL3({ b: a.b.id, p: a.p.id })}>Relire</SoftBtn></>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </Stagger>
        </div>
      </div>
      )}

      <Modal open={!!(l3b && l3p)} onClose={() => setL3(null)} title={l3b ? <>Envoyer à <span className="italic text-champagne-300">{l3b.name}</span></> : ''} kicker="Avant-première acquéreur">
        {l3b && l3p && <L3Modal b={l3b} p={l3p} dossierId={dossierOf(l3p.id)} onClose={() => setL3(null)} onDone={(id) => { setL3(null); setDocId(id) }} />}
      </Modal>
      <Modal open={!!docId} onClose={() => setDocId(null)} width={640} title={<>Avant-première <span className="italic text-champagne-300">L3</span></>} kicker="Document généré · validation humaine requise">
        {docId && <DocView id={docId} />}
      </Modal>
      <Modal open={!!form} onClose={() => setForm(null)} width={620} kicker="Demande" title={editing ? <>Modifier <span className="italic text-champagne-300">la recherche</span></> : <>Nouvelle <span className="italic text-champagne-300">recherche</span></>}>
        {form && <BuyerForm key={form.id ?? 'new'} initial={editing} onClose={() => setForm(null)} onSaved={(id) => setSel(id)} />}
      </Modal>
      <Modal open={rules} onClose={() => setRules(false)} kicker="Alertes" title={<>Règles <span className="italic text-champagne-300">d’alerte</span></>}>
        <p className="mb-4 text-[12.5px] text-bone/55">Seuil : correspondance d’au moins 80 % sur un bien en portefeuille. Les alertes préparent une avant-première, jamais d’envoi automatique.</p>
        <div className="space-y-2">
          {buyers.map((x) => (
            <div key={x.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/[0.02] px-3 py-2.5 ring-1 ring-white/[0.05]">
              <div className="min-w-0"><div className="truncate text-[13px]">{x.name}</div><div className="text-[11px] text-mist">{x.zones.join(' · ')}</div></div>
              <Tabs id={`rule-${x.id}`} value={modeOf(x)} onChange={(v) => setMode(x, v)} items={[{ id: 'instant', label: 'Immédiate' }, { id: 'daily', label: 'Quotidienne' }, { id: 'off', label: 'Off' }]} />
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
