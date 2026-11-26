// i18n légère, sans dépendance : français (fr) et portugais européen (pt-PT).
// Langue : réglage de l’agence (settings/agency.lang), sinon pays d’exercice PT → pt, sinon dernière langue
// mémorisée ou langue du navigateur. La langue retenue est mémorisée en localStorage (évite un flash au chargement).
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import fr from './fr'
import pt from './pt'
import { useSettings } from '../data/collections'

export type Lang = 'fr' | 'pt'
export type TKey = keyof typeof fr
export type Vars = Record<string, string | number>
export type TFn = (key: TKey, vars?: Vars) => string

const DICTS: Record<Lang, Record<TKey, string>> = { fr, pt }
export const LOCALE: Record<Lang, string> = { fr: 'fr-FR', pt: 'pt-PT' }
export const LANGS: { id: Lang; label: string; short: string }[] = [{ id: 'fr', label: 'Français', short: 'FR' }, { id: 'pt', label: 'Português', short: 'PT' }]

const STORE = 'nxt-lang'
const isLang = (v: unknown): v is Lang => v === 'fr' || v === 'pt'

function initial(): Lang {
  try { const v = localStorage.getItem(STORE); if (isLang(v)) return v } catch { /* stockage indisponible */ }
  try { if (/^pt\b/i.test(navigator.language)) return 'pt' } catch { /* hors navigateur */ }
  return 'fr'
}

let current: Lang = initial()
const subs = new Set<() => void>()
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }
const setHtmlLang = (l: Lang) => { try { document.documentElement.lang = l === 'pt' ? 'pt-PT' : 'fr' } catch { /* hors navigateur */ } }
setHtmlLang(current)

export const getLang = () => current
/** Applique une langue (mémorisée localement) et prévient les composants abonnés. */
export function applyLang(l: Lang) {
  try { localStorage.setItem(STORE, l) } catch { /* stockage indisponible : non mémorisée */ }
  if (l === current) return
  current = l
  setHtmlLang(l)
  subs.forEach((f) => f())
}

/** Langue imposée par l’agence : réglage explicite, sinon pays d’exercice Portugal. `null` : rien d’imposé. */
export function agencyLang(agency?: { lang?: unknown; country?: unknown }): Lang | null {
  if (isLang(agency?.lang)) return agency.lang
  if (agency?.country === 'PT') return 'pt'
  return null
}

/** Traduit une clé. `{var}` est remplacé ; avec `n`, « singulier|pluriel » est choisi selon les règles de la langue. */
export function translate(lang: Lang, key: TKey, vars?: Vars): string {
  let s = DICTS[lang][key] ?? DICTS.fr[key] ?? String(key)
  if (vars) {
    if (typeof vars.n === 'number' && s.includes('|')) {
      const [one, other] = s.split('|')
      s = new Intl.PluralRules(LOCALE[lang]).select(vars.n) === 'one' ? one : other
    }
    s = s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))
  }
  return s
}

/** Formats de dates, nombres et montants en euros selon la langue. */
export function formatters(lang: Lang) {
  const loc = LOCALE[lang]
  return {
    num: (n: number, o?: Intl.NumberFormatOptions) => new Intl.NumberFormat(loc, o).format(n),
    eur: (n: number, o?: Intl.NumberFormatOptions) => new Intl.NumberFormat(loc, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, ...o }).format(n),
    date: (d: Date | string | number, o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) => new Date(d).toLocaleDateString(loc, o),
    time: (d: Date | string | number, o: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }) => new Date(d).toLocaleTimeString(loc, o),
  }
}

/** `const { t, lang, num, eur, date } = useT()` */
export function useT() {
  const lang = useSyncExternalStore(subscribe, getLang, getLang)
  const t = useCallback<TFn>((key, vars) => translate(lang, key, vars), [lang])
  return useMemo(() => ({ t, lang, locale: LOCALE[lang], ...formatters(lang) }), [t, lang])
}

/** À monter une fois (CrmApp) : suit le réglage de l’agence. */
export function useLangSync() {
  const [settings] = useSettings()
  const forced = agencyLang(settings.find((s) => s.id === 'agency') as { lang?: unknown; country?: unknown } | undefined)
  useEffect(() => { if (forced) applyLang(forced) }, [forced])
}

/** Change la langue : immédiatement dans ce navigateur, puis dans le réglage de l’agence (livrables compris). */
export function useSetLang() {
  const [settings, ops] = useSettings()
  return async (l: Lang) => {
    applyLang(l)
    try {
      if (settings.some((s) => s.id === 'agency')) await ops.update('agency', { lang: l } as never)
      else await ops.create({ id: 'agency', lang: l } as never)
    } catch { /* hors ligne : la langue reste mémorisée localement */ }
  }
}
