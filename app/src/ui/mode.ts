// Mode simple : premier jour en 3 écrans (Brief, Débrief, Temps gagné). Actif par défaut tant que le conseiller n’a pas choisi.
const KEY = 'nxt-simple'
export const isSimpleMode = () => { try { const v = localStorage.getItem(KEY); return v === null ? true : v === '1' } catch { return true } }
export const setSimpleMode = (on: boolean) => { try { localStorage.setItem(KEY, on ? '1' : '0') } catch { /* indisponible */ } window.dispatchEvent(new Event('nxt:simple')) }

/** Progression du premier jour, mémorisée localement. */
const DAY1 = 'nxt-day1'
export type Day1 = { brief?: boolean; debrief?: boolean; temps?: boolean; dismissed?: boolean }
export const readDay1 = (): Day1 => { try { return JSON.parse(localStorage.getItem(DAY1) ?? '{}') as Day1 } catch { return {} } }
export const markDay1 = (k: keyof Day1) => { try { localStorage.setItem(DAY1, JSON.stringify({ ...readDay1(), [k]: true })) } catch { /* indisponible */ } window.dispatchEvent(new Event('nxt:day1')) }
