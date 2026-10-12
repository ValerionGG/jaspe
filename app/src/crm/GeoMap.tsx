import maplibregl, { type GeoJSONSource } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { Plus, Minus } from '@phosphor-icons/react'
import { useTheme, type Theme } from '../ui/theme'

export type GeoTone = 'gold' | 'sea' | 'sage' | 'coral' | 'mist'
export type GeoMarker = { id: string; lng: number; lat: number; label?: string; tone?: GeoTone; title?: string }
export type ShapeProps = { id: string; color: string; opacity?: number; dashed?: boolean; width?: number }
export type GeoShape = GeoJSON.Feature<GeoJSON.Polygon, ShapeProps>
export type LngLat = [number, number]

export const ANTIBES: LngLat = [7.12, 43.58]
// ponytail: les tuiles raster CARTO `dark_all` renvoient désormais « API KEY REQUIRED » ;
// les styles vectoriels CARTO (Dark Matter / Positron) restent libres d'accès, on suit le thème.
const STYLE: Record<Theme, string> = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
}
/** MapLibre ne lit pas les variables CSS : `rgb(var(--acc-500) / .4)` → `rgba(206,176,124,.4)` selon le thème courant. */
export function tokenColor(c: string) {
  const m = c.match(/var\((--[\w-]+)\)(?:\s*\/\s*([\d.]+))?/)
  if (!m) return c
  const rgb = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim().split(/\s+/).join(',')
  return m[2] ? `rgba(${rgb},${m[2]})` : `rgb(${rgb})`
}
const resolve = (shapes: GeoShape[]): GeoJSON.FeatureCollection => ({ type: 'FeatureCollection', features: shapes.map((f) => ({ ...f, properties: { ...f.properties, color: tokenColor(f.properties.color) } })) })
const DOT: Record<GeoTone, string> = { gold: 'bg-champagne', sea: 'bg-sea', sage: 'bg-sage', coral: 'bg-coral', mist: 'bg-mist' }
const expo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

/** Polygone circulaire (rayon en mètres) pour zones et rayons de recherche. */
export function circle(center: LngLat, radiusM: number, props: ShapeProps, steps = 72): GeoShape {
  const [lng, lat] = center, dLat = radiusM / 111320, dLng = radiusM / (111320 * Math.cos((lat * Math.PI) / 180))
  const ring = Array.from({ length: steps + 1 }, (_, i) => { const a = (i / steps) * Math.PI * 2; return [lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)] })
  return { type: 'Feature', properties: props, geometry: { type: 'Polygon', coordinates: [ring] } }
}
export const polygon = (coords: LngLat[], props: ShapeProps): GeoShape => ({ type: 'Feature', properties: props, geometry: { type: 'Polygon', coordinates: [[...coords, coords[0]]] } })

function markerEl(m: GeoMarker) {
  const el = document.createElement('div')
  el.className = 'group cursor-pointer'
  el.dataset.active = 'false'
  if (m.title) el.title = m.title
  const tone = DOT[m.tone ?? 'gold']
  if (!m.label) {
    el.innerHTML = `<span class="relative flex h-3.5 w-3.5 items-center justify-center transition-transform duration-500 ease-expo group-data-[active=true]:scale-[1.6]"><span class="absolute inset-0 rounded-full ${tone} opacity-25"></span><span class="h-2 w-2 rounded-full ${tone} ring-2 ring-ink"></span></span>`
    return el
  }
  const pill = document.createElement('div')
  pill.className = 'flex origin-bottom flex-col items-center transition-transform duration-500 ease-expo group-hover:scale-105 group-data-[active=true]:scale-[1.12]'
  const body = document.createElement('div')
  body.className = 'num flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ink/85 px-2.5 py-[5px] text-[11px] text-bone shadow-float ring-1 ring-white/15 backdrop-blur-md transition-colors duration-300 group-data-[active=true]:bg-champagne group-data-[active=true]:text-ink group-data-[active=true]:ring-champagne'
  const dot = document.createElement('span')
  dot.className = `h-1.5 w-1.5 rounded-full ${tone} group-data-[active=true]:bg-ink`
  const txt = document.createElement('span')
  txt.textContent = m.label
  body.append(dot, txt)
  const stem = document.createElement('span')
  stem.className = 'h-2 w-px bg-white/30 group-data-[active=true]:bg-champagne'
  pill.append(body, stem)
  el.append(pill)
  return el
}

type Props = {
  markers?: GeoMarker[]; shapes?: GeoShape[]; activeId?: string | null
  onHover?: (id: string | null) => void; onSelect?: (id: string) => void; onShapeClick?: (id: string) => void
  center?: LngLat; zoom?: number; focus?: { center: LngLat; zoom?: number } | null; fit?: boolean
  className?: string; children?: ReactNode; controls?: boolean
}

/** Carte MapLibre : fond CARTO selon le thème (bascule à chaud), marqueurs HTML prix, polygones en jetons, flyTo. */
export function GeoMap({ markers = [], shapes = [], activeId, onHover, onSelect, onShapeClick, center = ANTIBES, zoom = 12, focus, fit = false, className, children, controls = true }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const els = useRef(new Map<string, { el: HTMLDivElement; mk: maplibregl.Marker }>())
  const cb = useRef({ onHover, onSelect, onShapeClick, markers, shapes })
  cb.current = { onHover, onSelect, onShapeClick, markers, shapes }
  const [loaded, setLoaded] = useState(false)
  const fitted = useRef(false)
  const { theme } = useTheme()
  const styleOf = useRef(theme)

  useEffect(() => {
    const m = new maplibregl.Map({ container: box.current!, style: STYLE[theme], center, zoom, attributionControl: false, dragRotate: false, pitchWithRotate: false, fadeDuration: 0 })
    m.touchZoomRotate.disableRotation()
    m.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    // Les couches de polygones vivent dans le style : on les rajoute à chaque chargement de style (initial ou bascule de thème).
    // Les marqueurs sont du DOM au-dessus du canvas : ils survivent au changement de style.
    m.on('style.load', () => {
      if (m.getSource('shapes')) return
      const below = m.getStyle().layers.find((l) => l.type === 'symbol')?.id
      m.addSource('shapes', { type: 'geojson', data: resolve(cb.current.shapes) })
      m.addLayer({ id: 'shapes-fill', type: 'fill', source: 'shapes', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['coalesce', ['get', 'opacity'], 0.1] } }, below)
      m.addLayer({ id: 'shapes-line', type: 'line', source: 'shapes', filter: ['!=', ['get', 'dashed'], true], paint: { 'line-color': ['get', 'color'], 'line-width': ['coalesce', ['get', 'width'], 1.2], 'line-opacity': 0.9 } }, below)
      m.addLayer({ id: 'shapes-dash', type: 'line', source: 'shapes', filter: ['==', ['get', 'dashed'], true], paint: { 'line-color': ['get', 'color'], 'line-width': ['coalesce', ['get', 'width'], 1.2], 'line-dasharray': [2, 2] } }, below)
    })
    m.on('click', 'shapes-fill', (e) => { const id = e.features?.[0]?.properties?.id; if (id) cb.current.onShapeClick?.(String(id)) })
    m.on('mouseenter', 'shapes-fill', () => { if (cb.current.onShapeClick) m.getCanvas().style.cursor = 'pointer' })
    m.on('mouseleave', 'shapes-fill', () => { m.getCanvas().style.cursor = '' })
    m.on('load', () => setLoaded(true))
    map.current = m
    const ro = new ResizeObserver(() => m.resize())
    ro.observe(box.current!)
    const store = els.current
    return () => { ro.disconnect(); store.clear(); m.remove(); map.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Bascule de thème : nouveau fond, polygones recolorés (style.load les rajoute), marqueurs intacts
  useEffect(() => {
    const m = map.current
    if (!m || styleOf.current === theme) return
    styleOf.current = theme
    m.setStyle(STYLE[theme], { diff: false })
  }, [theme])

  // Polygones
  useEffect(() => {
    if (!loaded) return
    ;(map.current?.getSource('shapes') as GeoJSONSource | undefined)?.setData(resolve(shapes))
  }, [loaded, shapes])

  // Marqueurs (recréés seulement si l'ensemble change)
  const shapeKey = shapes.map((s) => s.properties.id).join('|')
  const key = markers.map((m) => `${m.id}:${m.label ?? ''}:${m.tone ?? ''}:${m.lng}:${m.lat}`).join('|')
  useEffect(() => {
    const m = map.current
    if (!m) return
    els.current.forEach(({ mk }) => mk.remove())
    els.current.clear()
    for (const d of cb.current.markers) {
      const el = markerEl(d)
      el.addEventListener('mouseenter', () => cb.current.onHover?.(d.id))
      el.addEventListener('mouseleave', () => cb.current.onHover?.(null))
      el.addEventListener('click', (e) => { e.stopPropagation(); cb.current.onSelect?.(d.id) })
      const mk = new maplibregl.Marker({ element: el, anchor: d.label ? 'bottom' : 'center' }).setLngLat([d.lng, d.lat]).addTo(m)
      els.current.set(d.id, { el, mk })
    }
    if (fit && cb.current.markers.length + cb.current.shapes.length > 1) {
      const b = new maplibregl.LngLatBounds()
      cb.current.markers.forEach((d) => b.extend([d.lng, d.lat]))
      cb.current.shapes.forEach((sh) => sh.geometry.coordinates[0].forEach((c) => b.extend(c as [number, number])))
      const c = m.getContainer(), pad = Math.round(Math.min(70, 0.14 * Math.min(c.clientWidth, c.clientHeight)))
      m.fitBounds(b, { padding: { top: pad + 24, bottom: pad, left: pad, right: pad }, maxZoom: 14, duration: fitted.current ? 900 : 0, easing: expo })
      fitted.current = true
    }
  }, [key, shapeKey, fit, loaded])

  // État actif
  useEffect(() => {
    els.current.forEach(({ el }, id) => { const on = id === activeId; el.dataset.active = String(on); el.style.zIndex = on ? '10' : '' })
  }, [activeId, key, shapeKey, fit, loaded])

  // Vol vers un point
  useEffect(() => {
    if (focus) map.current?.flyTo({ center: focus.center, zoom: focus.zoom ?? map.current.getZoom(), duration: 1600, curve: 1.3, easing: expo, essential: true })
  }, [focus?.center[0], focus?.center[1], focus?.zoom]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={clsx('relative isolate overflow-hidden bg-ink-850', className)}>
      <div ref={box} style={{ position: 'absolute', inset: 0 }} />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_90px_rgb(var(--ink-900)/0.7)]" />
      {controls && (
        <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-full bg-ink/70 ring-1 ring-white/10 backdrop-blur-md">
          <button aria-label="Zoomer" onClick={() => map.current?.zoomIn({ easing: expo })} className="flex h-8 w-8 items-center justify-center text-bone/70 transition hover:bg-white/[0.06] hover:text-bone"><Plus size={14} weight="light" /></button>
          <span className="mx-2 h-px bg-white/10" />
          <button aria-label="Dézoomer" onClick={() => map.current?.zoomOut({ easing: expo })} className="flex h-8 w-8 items-center justify-center text-bone/70 transition hover:bg-white/[0.06] hover:text-bone"><Minus size={14} weight="light" /></button>
        </div>
      )}
      {children}
    </div>
  )
}
