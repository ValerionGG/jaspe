// Pack Preuves : types partagés (logique dans server/evidence.js, servie par les actions evidence.* / risk.* / impic.*).
export type Party = 'vendeur' | 'acquereur'
export type RiskLevel = 'faible' | 'moyen' | 'eleve'
export type Suggestable<T> = { value: T; suggested?: boolean; source?: string; by?: 'conseiller' | 'suggestion'; at?: string }
export type FactorState = { on: boolean; suggested?: boolean; source?: string; by?: 'conseiller' | 'suggestion'; at?: string }
export type RiskDecision = { decision: string; label: string; justification: string; by: string; at: string; level: RiskLevel; score: number; reasons: string[] }
export type PieceDef = { id: string; itemId: string; fr: [string, string]; pt: [string, string] }
export type RiskGrid = {
  id: string; dossierId: string; party: Party; country: 'FR' | 'PT'; name: string
  clientType: Suggestable<'pp' | 'pm' | 'offshore'>; residence: Suggestable<string>; funds: Suggestable<string>
  factors: Record<string, FactorState>; amount: number
  score: number; level: RiskLevel; vigilance: string; floored: boolean; reasons: { id: string; label: string; points: number }[]
  measures: string[]; pieces: PieceDef[]; decision: RiskDecision | null; decisionStale: boolean; suggestions: number; updatedAt: string
}
export type DepotLink = { id: string; dossierId: string; party: Party; lang: 'fr' | 'pt'; tokenHint: string; createdAt: string; expiresAt: string; createdBy: string; partyName: string; pieces: PieceDef[]; uses: number; maxUses: number; declaredAt: string | null; revokedAt: string | null; lastUseAt?: string }
export type Proof = { id: string; dossierId: string; linkId: string; party: Party; kind: 'file' | 'declaration'; pieceId?: string; itemId: string; fileId?: string; name: string; type?: string; size?: number; sha256: string; at: string; by: string; origin?: string; pep?: string }
export type LogEntry = { id: string; dossierId: string; at: string; by: string; kind: string; what: string }
export type ExportRec = { id: string; dossierId: string; at: string; by: string; sha256: string; proofs: number; events: number }
export type Country = { code: string; fr: string; pt: string }
export type EvidenceState = {
  dossierId: string; country: 'FR' | 'PT'
  fatf: { asOf: string; source: string; verified: string; call: Country[]; grey: Country[] }
  parties: Record<Party, RiskGrid>; links: DepotLink[]; proofs: Proof[]; log: LogEntry[]; exports: ExportRec[]
  catalog: {
    factors: { id: string; label: string; points: number; floor?: string; law: Record<'FR' | 'PT', string> }[]
    clientTypes: Record<string, { label: string; points: number }>; decisions: Record<string, string>; levels: Record<RiskLevel, string>
  }
}
export type ExportResult = { json: unknown; html: string; sha256: string; exportId: string; filename: string }
export type ImpicResult = { period: string; from: string; to: string; rows: Record<string, string | number>[]; fields: { key: string; label: string; confirm?: boolean }[]; csv: string; filename: string; note: string }

/** Page publique /depot/:token */
export type DepotRequest = {
  lang: 'fr' | 'pt'; party: Party; agency: string; city: string; expiresAt: string
  pieces: { id: string; label: string; hint: string; received: { name: string; at: string }[] }[]
  declaration: { done: boolean; at: string | null; text: string; pep: string; askOrigin: boolean; origins: { id: string; label: string }[] }
  legal: { title: string; body: string[]; privacy: string[]; declare: string; declareSeller: string; pep: string; review: string }
  remaining: number; maxFileMb: number; accept: string[]
}
