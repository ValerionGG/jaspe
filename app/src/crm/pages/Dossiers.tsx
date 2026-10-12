import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { Plus, Kanban, Rows, FunnelSimple, Sparkle, Clock } from '@phosphor-icons/react'
import { PageHeader, Tabs, SoftBtn, Heat, Stagger, Card, DELIV_TONE } from '../ui'
import { Avatar, EXPO } from '../../ui/kit'
import { STAGES, prop, agent, eur, DELIVERABLES, type Dossier, type Stage } from '../../data/mock'
import { useDossiers, useProperties, useAgents } from '../../data/collections'
import { action } from '../../data/store'
import { Modal, Field, Input, Select, Textarea, AsyncForm, toast, errText } from '../forms'

function DossierCard({ d, onDragStart }: { d: Dossier; onDragStart: (id: string) => void }) {
  const p = prop(d.propertyId), a = agent(d.agentId)
  const ready = Object.values(d.deliverables).filter((s) => s === 'done').length
  return (
    <motion.div layout layoutId={d.id} transition={{ duration: 0.5, ease: EXPO }}>
      <Link to={`/app/dossiers/${d.id}`} draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', d.id); onDragStart(d.id) }} className="group block overflow-hidden rounded-2xl bg-ink-700/70 ring-1 ring-white/[0.06] transition-all duration-500 ease-silk hover:-translate-y-0.5 hover:ring-champagne/30 hover:shadow-float">
        <div className="relative h-28 overflow-hidden">
          <img src={p.photo} alt="" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-silk group-hover:scale-[1.06]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-700 via-ink-700/20 to-transparent" />
          <div className="absolute left-3 top-3 flex gap-1.5">{d.mandate && <span className="rounded-full bg-ink/70 px-2 py-0.5 text-[10.5px] text-champagne-300 backdrop-blur">{d.mandate}</span>}</div>
          <div className="absolute right-3 top-3"><Heat n={d.heat} /></div>
          <div className="num absolute bottom-2 left-3 text-[15px] text-bone">{eur(p.price)}</div>
        </div>
        <div className="p-3.5">
          <div className="truncate text-[13.5px] font-medium">{p.title}</div>
          <div className="truncate text-[12px] text-bone/50">{d.seller} · {p.district}</div>
          <div className="mt-3 flex gap-[3px]">{DELIVERABLES.map((x) => { const s = d.deliverables[x.code]; return <span key={x.code} title={`${x.code} · ${DELIV_TONE[s].l}`} className={`h-1 flex-1 rounded-full ${s === 'done' ? 'bg-sage' : s === 'review' ? 'bg-champagne' : s === 'running' ? 'bg-sea' : s === 'blocked' ? 'bg-coral' : 'bg-white/10'}`} /> })}</div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-bone/70"><Sparkle size={11} weight="fill" className="shrink-0 text-champagne" /><span className="truncate">{d.next}</span></span>
            <Avatar src={a.photo} size={22} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-mist"><span className="flex items-center gap-1"><Clock size={10} />{d.due}</span><span className="num">{ready}/14</span></div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function Dossiers() {
  const [view, setView] = useState<'board' | 'table'>('board')
  const [items, ops] = useDossiers()
  const [properties, propOps] = useProperties()
  const [agents] = useAgents()
  const [creating, setCreating] = useState(false)
  const [drag, setDrag] = useState<string | null>(null)
  const [over, setOver] = useState<Stage | null>(null)
  const [scope, setScope] = useState<'mine' | 'agency'>('agency')
  const nav = useNavigate()
  const list = scope === 'mine' ? items.filter((d) => d.agentId === 'a1') : items
  const total = list.reduce((s, d) => s + prop(d.propertyId).price, 0)

  return (
    <div>
      <PageHeader
        kicker="Portefeuille vendeur"
        title={<>Dossiers <span className="italic text-champagne-300">vendeurs</span></>}
        sub={<>{list.length} dossiers actifs · {eur(total)} en portefeuille · glissez une carte pour changer d’étape.</>}
        actions={<>
          <Tabs id="scope" value={scope} onChange={setScope} items={[{ id: 'agency', label: 'Agence' }, { id: 'mine', label: 'Mes dossiers' }]} />
          <Tabs id="view" value={view} onChange={setView} items={[{ id: 'board', label: <span className="flex items-center gap-1.5"><Kanban size={14} />Tableau</span> }, { id: 'table', label: <span className="flex items-center gap-1.5"><Rows size={14} />Liste</span> }]} />
          <SoftBtn icon={<FunnelSimple size={14} />}>Filtres</SoftBtn>
          <SoftBtn tone="gold" icon={<Plus size={14} />} onClick={() => setCreating(true)}>Nouveau dossier</SoftBtn>
        </>}
      />
      <AnimatePresence mode="wait">
        {view === 'board' ? (
          <motion.div key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="-mx-4 overflow-x-auto px-4 pb-4 thin-scroll md:-mx-8 md:px-8">
            <div className="flex gap-4" style={{ width: 'max-content' }}>
              {STAGES.map((s, i) => {
                const col = list.filter((d) => d.stage === s.id)
                return (
                  <Stagger key={s.id} i={i} className="w-[288px] shrink-0">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setOver(s.id) }} onDragLeave={() => setOver(null)}
                      onDrop={async (e) => {
                        e.preventDefault(); setOver(null); setDrag(null)
                        const id = e.dataTransfer.getData('text/plain') || drag
                        const cur = items.find((d) => d.id === id)
                        if (!id || !cur || cur.stage === s.id) return
                        try { await action('dossier.move', { id, stage: s.id }); toast(s.id === 'post' ? `${cur.seller} → livrables L1–L9 lancés` : `${cur.seller} → ${s.label}`) } catch (x) { toast(errText(x), 'error') }
                      }}
                      className={`min-h-[60vh] rounded-[1.4rem] p-2 ring-1 transition-colors duration-300 ${over === s.id ? 'bg-champagne/[0.06] ring-champagne/30' : 'bg-white/[0.015] ring-white/[0.05]'}`}
                    >
                      <div className="mb-2 flex items-center justify-between px-2 py-1.5">
                        <div className="flex items-center gap-2"><span className="num text-[10.5px] text-mist">{String(i + 1).padStart(2, '0')}</span><span className="text-[13px] font-medium">{s.label}</span></div>
                        <span className="num rounded-full bg-white/[0.05] px-2 text-[11px] text-bone/60">{col.length}</span>
                      </div>
                      <div className="space-y-2.5">{col.map((d) => <DossierCard key={d.id} d={d} onDragStart={setDrag} />)}</div>
                      {!col.length && <div className="mx-1 rounded-xl border border-dashed border-white/[0.08] p-6 text-center text-[11.5px] text-mist">Déposez un dossier ici</div>}
                    </div>
                  </Stagger>
                )
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card pad={false}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-[13px]">
                  <thead className="text-[10.5px] uppercase tracking-eyebrow text-mist"><tr className="border-b border-white/[0.06]">{['Bien', 'Vendeur', 'Étape', 'Livrables', 'Prix', 'Prochaine action', 'Conseiller', ''].map((h) => <th key={h} className="px-5 py-3.5 font-normal">{h}</th>)}</tr></thead>
                  <tbody>
                    {list.map((d) => {
                      const p = prop(d.propertyId), a = agent(d.agentId)
                      const ready = Object.values(d.deliverables).filter((s) => s === 'done').length
                      return (
                        <tr key={d.id} onClick={() => nav(`/app/dossiers/${d.id}`)} className="cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.025]">
                          <td className="px-5 py-3"><div className="flex items-center gap-3"><img src={p.photo} alt="" className="h-10 w-14 rounded-lg object-cover" /><div><div>{p.title}</div><div className="num text-[11px] text-mist">{d.ref}</div></div></div></td>
                          <td className="px-5 py-3 text-bone/75">{d.seller}</td>
                          <td className="px-5 py-3"><span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11.5px] ring-1 ring-white/[0.07]">{STAGES.find((s) => s.id === d.stage)!.label}</span></td>
                          <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="h-1 w-20 rounded-full bg-white/10"><div className="h-1 rounded-full bg-champagne" style={{ width: `${(ready / 14) * 100}%` }} /></div><span className="num text-[11px] text-mist">{ready}/14</span></div></td>
                          <td className="num px-5 py-3">{eur(p.price)}</td>
                          <td className="px-5 py-3"><div className="text-bone/80">{d.next}</div><div className="text-[11px] text-mist">{d.due}</div></td>
                          <td className="px-5 py-3"><div className="flex items-center gap-2"><Avatar src={a.photo} size={24} /><span className="text-[12px] text-bone/60">{a.name.split(' ')[0]}</span></div></td>
                          <td className="px-5 py-3"><Heat n={d.heat} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      <Modal open={creating} onClose={() => setCreating(false)} title={<>Nouveau dossier <span className="italic text-champagne-300">vendeur</span></>} kicker="Portefeuille">
        <AsyncForm submitLabel="Créer le dossier" success="Dossier créé — préparation D1–D3 planifiée" onCancel={() => setCreating(false)} onSubmit={async (v) => {
          let propertyId = v.propertyId
          if (propertyId === 'new') {
            if (!v.title || !v.address) throw new Error('Titre et adresse du bien requis')
            const price = Number(v.price) || 0, surface = Number(v.surface) || 0
            const p = await propOps.create({ title: v.title, type: v.type, address: v.address, district: v.district || v.city, city: v.city || 'Antibes', surface, rooms: Number(v.rooms) || 0, price, estimateLow: Math.round(price * 0.94), estimateHigh: Math.round(price * 1.04), dpe: (v.dpe || 'D') as 'D', photo: '/img/house-garden.webp', gallery: ['/img/house-garden.webp'], lat: 43.58, lng: 7.12, features: [], year: 2000, status: 'Brouillon', portals: {}, stats: { views: 0, contacts: 0, visits: 0 } } as never)
            propertyId = p.id
          }
          const n = items.length + 1
          await ops.create({ ref: `VND-2026-${String(430 + n).padStart(4, '0')}`, seller: v.seller, propertyId, agentId: v.agentId, stage: 'prep', next: 'Préparer le rendez-vous de découverte', due: v.due || 'À planifier', heat: 2, progress: 5, deliverables: Object.fromEntries(DELIVERABLES.map((d) => [d.code, 'waiting'])), motivation: v.motivation || 'À préciser en découverte', timeline: v.timeline || 'À préciser', tags: [] } as never)
          setCreating(false)
        }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vendeur(s)"><Input name="seller" required placeholder="Famille Dupont" /></Field>
            <Field label="Conseiller"><Select name="agentId" defaultValue="a1">{agents.filter((a) => a.mandats > 0).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field>
          </div>
          <Field label="Bien"><Select name="propertyId" defaultValue="new" onChange={(e) => e.currentTarget.form?.querySelector<HTMLElement>('[data-newprop]')?.toggleAttribute('hidden', e.currentTarget.value !== 'new')}>
            <option value="new">+ Nouveau bien</option>{properties.map((p) => <option key={p.id} value={p.id}>{p.title} — {p.district}</option>)}
          </Select></Field>
          <div data-newprop className="grid gap-4 rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06] sm:grid-cols-2">
            <Field label="Titre du bien" className="sm:col-span-2"><Input name="title" placeholder="Villa contemporaine vue mer" /></Field>
            <Field label="Adresse" className="sm:col-span-2"><Input name="address" placeholder="14 chemin des Nielles" /></Field>
            <Field label="Ville"><Input name="city" defaultValue="Antibes" /></Field>
            <Field label="Quartier"><Input name="district" placeholder="Cap d’Antibes" /></Field>
            <Field label="Type"><Select name="type" defaultValue="Villa">{['Villa', 'Maison', 'Appartement'].map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="DPE"><Select name="dpe" defaultValue="C">{'ABCDEFG'.split('').map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="Surface (m²)"><Input name="surface" type="number" min={0} inputMode="numeric" /></Field>
            <Field label="Pièces"><Input name="rooms" type="number" min={0} inputMode="numeric" /></Field>
            <Field label="Prix envisagé (€)" className="sm:col-span-2"><Input name="price" type="number" min={0} step={1000} inputMode="numeric" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rendez-vous de découverte"><Input name="due" placeholder="Mar. 14 oct. 10:00" /></Field>
            <Field label="Horizon"><Input name="timeline" placeholder="3 à 6 mois" /></Field>
          </div>
          <Field label="Motivation déclarée"><Textarea name="motivation" rows={2} placeholder="Ce que le vendeur a dit de son projet, sans interprétation" /></Field>
        </AsyncForm>
      </Modal>
    </div>
  )
}
