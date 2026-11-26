// Ventes réelles d’un bien (server/market.js, action « market.comparables ») : DVF en France, Casafari si le compte
// client est branché au Portugal. Même appel que la page Marché ; jamais de comparables simulés hors démonstration.
import { useCallback, useEffect, useState } from 'react'
import { action } from '../../data/store'
import { toast, errText } from '../forms'

export type RealComp = { id: string; date: string; address: string; commune?: string; surface: number; price: number; ppm: number; type?: string; source: string; sourceUrl: string }
export type RealMarket = {
  status: string; country?: 'FR' | 'PT'; source?: string; sourceUrl?: string; commune?: string; count: number; medianPpm?: number
  lastDate?: string | null; period?: { from: string; to: string }; fetchedAt?: string; note?: string; comparables: RealComp[]
}

const ok = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0

/** Lecture en cache au montage (aucun appel réseau sortant), relecture de la source à la demande. */
export function useRealMarket(propertyId: string, enabled = true) {
  const [m, setM] = useState<RealMarket | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!enabled) return
    let live = true
    setM(null); setLoading(true)
    action<RealMarket>('market.comparables', { propertyId, cachedOnly: true })
      .then((r) => { if (live) setM(r) })
      .catch(() => { if (live) setM(null) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [propertyId, enabled])
  const load = useCallback(async (refresh = false) => {
    setBusy(true)
    try {
      const r = await action<RealMarket>('market.comparables', { propertyId, refresh })
      setM(r)
      if (r.status !== 'ok' && r.note) toast(r.note, 'info')
    } catch (e) { toast(errText(e), 'error') } finally { setBusy(false) }
  }, [propertyId])
  // Ne garde que les ventes exploitables : jamais de NaN dans les calculs en aval.
  const comps = (m?.comparables ?? []).filter((c) => ok(c.price) && ok(c.surface) && ok(c.ppm))
  return { m, comps, loading, busy, load }
}

/** Médiane (0 si vide). */
export const median = (xs: number[]) => { const s = xs.filter(Number.isFinite).sort((a, b) => a - b), k = s.length >> 1; return s.length ? (s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2) : 0 }
export const finitePos = ok
