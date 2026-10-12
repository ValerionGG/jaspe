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
