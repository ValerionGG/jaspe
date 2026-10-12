// D3 · Radar quartier : carte centrée sur le bien, POI, projets et zonages ; faits établis et impacts supposés séparés.
import { useMemo, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { GraduationCap, Bus, Waves, Storefront, Crane, Warning, CheckCircle, Question } from '@phosphor-icons/react'
import { GeoMap, circle, type GeoMarker, type GeoShape, type GeoTone } from '../GeoMap'
import { prop, eur, type Dossier } from '../../data/mock'
import { compsFor, dist, meters, rng } from '../../data/geo'
import { Sub, todayFr } from './prep-ui'

type Cat = 'ecole' | 'transport' | 'plage' | 'commerce' | 'projet'
const CATS: { id: Cat; label: string; tone: GeoTone; icon: typeof Bus; names: string[] }[] = [
  { id: 'ecole', label: 'Écoles', tone: 'sea', icon: GraduationCap, names: ['École élémentaire des Semboules', 'Collège Roustan', 'Lycée Audiberti', 'École maternelle de la Fontonne'] },
  { id: 'transport', label: 'Transports', tone: 'mist', icon: Bus, names: ['Gare SNCF d’Antibes', 'Arrêt Envibus — ligne 2', 'Bus-tram Antibes ↔ Sophia', 'Gare de Juan-les-Pins'] },
  { id: 'plage', label: 'Plages', tone: 'gold', icon: Waves, names: ['Plage de la Garoupe', 'Plage de la Salis', 'Plage du Ponteil', 'Plage de Juan-les-Pins'] },
  { id: 'commerce', label: 'Commerces', tone: 'sage', icon: Storefront, names: ['Marché provençal', 'Commerces boulevard Wilson', 'Supérette de proximité', 'Boulangerie & primeur'] },
  { id: 'projet', label: 'Projets', tone: 'coral', icon: Crane, names: ['Requalification du front de mer', 'Permis — 12 logements collectifs', 'Piste cyclable littorale'] },
]
const PROJECT_STATUS = ['travaux annoncés pour 2027 (délibération du 24/06/2026)', 'permis autorisé le 12/05/2026, recours purgé', 'livrée en septembre 2026']
const seedOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 11)

export default function RadarPanel({ d, head, foot }: { d: Dossier; head: ReactNode; foot: ReactNode }) {
  const p = prop(d.propertyId)
  const [off, setOff] = useState<Cat[]>([])
  const [active, setActive] = useState<string | null>(null)
  // ponytail: POI de démonstration posés sur les cellules terrestres des comparables (jamais en mer) ; brancher OSM/BPE quand l’API sera disponible.
  const pois = useMemo(() => {
    const cells = compsFor(p), r = rng(seedOf(p.id))
    const counts: Record<Cat, number> = { ecole: 3, transport: 3, plage: 2, commerce: 3, projet: 3 }
    let i = 0
    return CATS.flatMap((c) => Array.from({ length: counts[c.id] }, (_, k) => {
      const cell = cells[(i++ * 5 + Math.floor(r() * 3)) % cells.length]
      return { id: `${c.id}${k}`, cat: c.id, name: c.id === 'projet' ? c.names[k] : c.names[(k + Math.floor(r() * c.names.length)) % c.names.length], lng: cell.lng, lat: cell.lat, d: dist([p.lng, p.lat], [cell.lng, cell.lat]), status: c.id === 'projet' ? PROJECT_STATUS[k % 3] : undefined }
    })).filter((x, k, a) => a.findIndex((y) => y.name === x.name) === k)
  }, [p])
  const shown = pois.filter((x) => !off.includes(x.cat))
  const markers: GeoMarker[] = [{ id: 'bien', lng: p.lng, lat: p.lat, label: eur(p.price), tone: 'gold', title: p.title }, ...shown.map((x) => ({ id: x.id, lng: x.lng, lat: x.lat, tone: CATS.find((c) => c.id === x.cat)!.tone, title: `${x.name} · ${meters(x.d)}` }))]
  const shapes: GeoShape[] = useMemo(() => [
    circle([p.lng, p.lat], 500, { id: 'r500', color: 'rgb(var(--acc-500))', opacity: 0.05, dashed: true }),
    circle([p.lng, p.lat], 1000, { id: 'r1000', color: 'rgb(var(--tint) / .5)', opacity: 0, dashed: true, width: 0.8 }),
    ...(off.includes('projet') ? [] : pois.filter((x) => x.cat === 'projet').map((x) => circle([x.lng, x.lat], 160, { id: `z-${x.id}`, color: 'rgb(var(--coral))', opacity: 0.16 }))),
  ], [p, pois, off])
  const near = (c: Cat) => pois.filter((x) => x.cat === c).sort((a, b) => a.d - b.d)[0]
  const facts = [
    `Zonage PLU : ${p.land ? 'zone UD — habitat individuel, emprise au sol limitée' : 'zone UA — tissu urbain dense'} (GPU, consulté le ${todayFr()}).`,
    ...(['ecole', 'transport', 'plage', 'commerce'] as Cat[]).map((c) => { const n = near(c); return n ? `${CATS.find((x) => x.id === c)!.label.slice(0, -1)} la plus proche : ${n.name}, ${meters(n.d)} à vol d’oiseau.` : '' }).filter(Boolean),
    ...pois.filter((x) => x.cat === 'projet').map((x) => `${x.name} — ${x.status}, à ${meters(x.d)}.`),
  ]
  const impacts = [
    'Le projet de front de mer pourrait améliorer l’attractivité à moyen terme — non chiffrable, ne pas l’intégrer à l’estimation.',
    'Le chantier collectif peut générer des nuisances temporaires (12 à 18 mois) : à présenter honnêtement aux acquéreurs.',
    'La proximité de la piste cyclable est un argument de vie quotidienne, pas de valeur.',
  ]
  const vigilances = [
    p.district.includes('Cap') ? 'Site inscrit du Cap d’Antibes : avis de l’Architecte des Bâtiments de France pour tout projet extérieur.' : 'Vérifier les servitudes de vue et de passage au titre de propriété.',
    'Risque feux de forêt (obligation légale de débroussaillement — OLD) : attestation à demander.',
    'Géorisques : aléa submersion marine faible sur le littoral voisin, à mentionner dans l’ERP.',
  ]
  return (
    <div className="space-y-5">
      {head}
      <div className="overflow-hidden rounded-[1.2rem] ring-1 ring-white/[0.06]">
        <GeoMap className="h-[340px] md:h-[420px]" markers={markers} shapes={shapes} center={[p.lng, p.lat]} zoom={14} activeId={active ?? 'bien'} onHover={setActive}>
          <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-ink/75 px-3 py-1.5 text-[11px] text-bone/80 ring-1 ring-white/10 backdrop-blur-md">Cercles : 500 m · 1 km</div>
        </GeoMap>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CATS.map((c) => {
          const on = !off.includes(c.id), I = c.icon, n = pois.filter((x) => x.cat === c.id).length
          return <button key={c.id} onClick={() => setOff((o) => (on ? [...o, c.id] : o.filter((x) => x !== c.id)))} aria-pressed={on} className={clsx('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] ring-1 transition', on ? 'bg-white/[0.06] text-bone ring-white/[0.12]' : 'text-bone/45 ring-white/[0.06] hover:text-bone/70')}><I size={14} weight="light" />{c.label}<span className="num text-[10.5px] text-mist">{n}</span></button>
        })}
      </div>
      <Sub kicker="À proximité" title={`${shown.length} points d’intérêt · distances à vol d’oiseau`}>
          <ul className="grid gap-x-4 gap-y-0.5 sm:grid-cols-2 lg:grid-cols-3">
            {[...shown].sort((a, b) => a.d - b.d).map((x) => { const c = CATS.find((k) => k.id === x.cat)!, I = c.icon; return (
              <li key={x.id} onMouseEnter={() => setActive(x.id)} onMouseLeave={() => setActive(null)} className={clsx('flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[12.5px] transition', active === x.id && 'bg-white/[0.05]')}><I size={14} weight="light" className="shrink-0 text-bone/50" /><span className="min-w-0 flex-1 truncate">{x.name}</span><span className="num shrink-0 text-[11px] text-mist">{meters(x.d)}</span></li>
            ) })}
          </ul>
      </Sub>
      <div className="grid gap-4 md:grid-cols-2">
        <Sub kicker="Faits établis" title="Sources primaires, datées">
          <ul className="space-y-2">{facts.map((f) => <li key={f} className="flex gap-2 text-[12.5px] text-bone/80"><CheckCircle size={14} weight="fill" className="mt-0.5 shrink-0 text-sage" />{f}</li>)}</ul>
        </Sub>
        <Sub kicker="Impacts supposés" title="Hypothèses — jamais présentées comme des faits">
          <ul className="space-y-2">{impacts.map((f) => <li key={f} className="flex gap-2 text-[12.5px] text-bone/70"><Question size={14} className="mt-0.5 shrink-0 text-champagne-300" />{f}</li>)}</ul>
        </Sub>
      </div>
      <Sub kicker="Vigilances" title="À vérifier avant l’entretien">
        <ul className="grid gap-2 md:grid-cols-3">{vigilances.map((v) => <li key={v} className="flex gap-2 rounded-xl bg-coral/[0.05] p-3 text-[12.5px] text-bone/80 ring-1 ring-coral/15"><Warning size={15} weight="light" className="mt-0.5 shrink-0 text-coral" />{v}</li>)}</ul>
      </Sub>
      {foot}
    </div>
  )
}
