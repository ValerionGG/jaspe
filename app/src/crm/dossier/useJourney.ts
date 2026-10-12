import { useDossiers } from '../../data/collections'
import { journeyOf, type Journey } from '../../data/dossier'
import type { Dossier } from '../../data/mock'

/** Parcours vendeur d’un dossier + enregistrement partiel persistant (fusion superficielle par section). */
export function useJourney(dossierId: string) {
  const [dossiers, ops] = useDossiers()
  const d = dossiers.find((x) => x.id === dossierId) as (Dossier & { journey?: Journey }) | undefined
  const journey = d ? journeyOf(d) : undefined
  const save = async (patch: Partial<Journey>, extra: Partial<Dossier> = {}) => {
    if (!d || !journey) return
    await ops.update(d.id, { ...extra, journey: { ...journey, ...patch } } as never)
  }
  return { dossier: d, journey, save, update: ops.update }
}
