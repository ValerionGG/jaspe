// Types minimaux du moteur partagé avec le serveur (server/engine.js, JavaScript pur).
declare module '*/server/engine.js' {
  type AnyDoc = { id: string } & Record<string, unknown>
  export function createEngine(
    db: unknown,
    emit: (col: string, id: string) => void,
    opts?: { delay?: (ms: number) => Promise<void> },
  ): {
    actions: Record<string, (payload: Record<string, unknown>) => unknown>
    tick: (only?: string[], manual?: boolean) => Promise<AnyDoc[]>
    ENGINE_IDS: string[]
  }
}

declare module '*/server/assist.js' {
  export const BASELINES: Record<'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8' | 'L9' | 'relance' | 'rappel' | 'brief' | 'veille' | 'facture' | 'conformite' | 'tache', number>
  export const KIND_LABELS: Record<string, string>
  export const REVIEW_MIN: number
  export const CORRECTION_MIN: number
  export const COMPLIANCE: Record<'FR' | 'PT', { id: string; phase: string; side: string; label: string; law: string; required: boolean }[]>
}
