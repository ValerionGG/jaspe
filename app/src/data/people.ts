// Résolution d’un conseiller pour l’affichage. En compte réel, jamais de personnage de démo :
// on cherche dans la collection `agents` du compte, sinon on retombe sur l’utilisateur connecté.
import { useCallback } from 'react'
import { agent as demoAgent, prop as demoProp, img, type Property } from './mock'
import { useAgents, useProperties } from './collections'
import { useIdentity } from './identity'

export type Person = { id: string; name: string; photo?: string; role: string; agency: string }

export function useAgentOf(): (id?: string) => Person {
  const who = useIdentity()
  const [agents] = useAgents()
  return useCallback((id?: string) => {
    if (!who.real) { const a = demoAgent(id ?? ''); return { id: a.id, name: a.name, photo: a.photo, role: a.role, agency: a.agency } }
    const a = agents.find((x) => x.id === id)
    if (a) return { id: a.id, name: a.name, photo: a.photo || undefined, role: a.role, agency: a.agency || who.orgName }
    return { id: who.userId, name: who.name, photo: who.photo, role: who.role, agency: who.orgName }
  }, [who, agents])
}

/** Bien d’un dossier : en compte réel, `undefined` s’il n’existe pas dans le portefeuille (pas de bien de démo en repli). */
export function usePropOf(): (id?: string) => Property | undefined {
  const who = useIdentity()
  const [props] = useProperties()
  return useCallback((id?: string) => {
    if (!who.real) return demoProp(id ?? '')
    return (props as unknown as Property[]).find((p) => p.id === id)
  }, [who.real, props])
}

/** Variante qui renvoie toujours un bien : en compte réel, un bien neutre « non renseigné » au lieu du bien de démo. */
export function usePropOrBlank(): (id?: string) => Property {
  const find = usePropOf()
  return useCallback((id?: string) => find(id) ?? ({ id: id ?? '', title: 'Bien non renseigné', type: '', address: '', district: '', city: '', surface: 0, rooms: 0, price: 0, estimateLow: 0, estimateHigh: 0, dpe: '', photo: img('house-garden'), gallery: [], lat: 0, lng: 0, features: [], year: 0 } as unknown as Property), [find])
}
