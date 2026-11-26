// Temps gagné, conformité, factures de commissions, veille réglementaire, retours bêta.
// La logique métier vit dans server/assist.js (partagée avec le moteur embarqué) ; ici : types et amorces.
import { BASELINES, KIND_LABELS, COMPLIANCE } from '../../../server/assist.js'

export { BASELINES, KIND_LABELS, COMPLIANCE }
export type TimeKind = keyof typeof BASELINES

export type TimeEntry = { id: string; at: string; kind: string; label: string; dossierId?: string; ref?: string; baseline: number; spent: number; net: number; corrections: number; demo?: boolean }
export type CmpState = 'ok' | 'todo' | 'blocked' | 'na'
export type CmpItem = { id: string; phase: string; side: string; label: string; law: string; required: boolean; state: CmpState; auto: boolean; evidence: string; due: boolean; by?: string; updatedAt?: string; proofs?: { id: string; kind: 'file' | 'declaration'; name: string; at: string; sha256: string; fileId?: string; by: string }[] }
export type Compliance = { id: string; dossierId: string; country: 'FR' | 'PT'; stage: string; items: CmpItem[]; score: number; blocking: number; at: string }
export type InvoiceStatus = 'brouillon' | 'validée' | 'envoyée' | 'payée' | 'annulée'
export type Invoice = {
  id: string; txId: string; dossierId?: string; country: 'FR' | 'PT'; number: string | null; status: InvoiceStatus; createdAt: string
  client: string; payerRole: string; object: string; price: number; ht: number; vatRate: number; vat: number; ttc: number; due: string
  split: { agency: string; pct: number; role?: string; amount: number }[]; issuer: { name: string; legal: string }; mentions: string[]
  validatedAt?: string; sentAt?: string; paidAt?: string; sendNote?: string; cancelNote?: string
  /** « agence » : agence → client ; « mandataire » : agent commercial / consultor → réseau ou agence. */
  template?: InvoiceTemplate; share?: { pct: number; base: number; from: string | null }
  vatRegime?: 'normal' | 'franchise' | 'isencao53'; regimeToConfirm?: boolean
  /** Émission par un logiciel certifié (PT) ou Factur-X figé (FR). */
  legal?: InvoiceLegal; facturx?: { xml: string; filename: string }
}
export type InvoiceTemplate = 'agence' | 'mandataire'
export type InvoiceLegal = {
  provider: 'invoicexpress' | 'facturx'; state?: 'draft' | 'final'; externalId?: number; legalNumber?: string | null; atcud?: string | null
  pdfUrl?: string | null; permalink?: string | null; pdfPending?: boolean; issuedAt?: string; note?: string; filename?: string; format?: string; transmission?: string
}
export type BillingParty = { name?: string; siren?: string; vatId?: string; address?: string; postcode?: string; city?: string; nif?: string; rsac?: string; vatRegime?: 'franchise' | 'assujetti'; ptVatRegime?: 'isencao53' | 'normal' }
export type InvoicingConnector = {
  country: 'FR' | 'PT'
  invoicexpress: { configured: boolean; account: string | null; note: string }
  facturx: { profile: string; note: string }
  settings: { seller?: BillingParty; agent?: BillingParty; network?: BillingParty }
}
export type RegWatch = { id: string; country: 'FR' | 'PT' | 'UE'; date: string; title: string; summary: string; impact: string; action: string; source: string; sourceLabel: string; status: 'en vigueur' | 'à venir' | 'à surveiller'; verified: string }
export type Feedback = { id: string; text: string; page?: string; mood?: string; at: string; by: string }
export type PlanItem = { id: string; type: 'relance' | 'document' | 'veille' | 'point' | 'facture' | 'conformite' | 'tache'; label: string; code?: string; due?: string | null; source: string; selected: boolean; result?: string }

/** Historique de démonstration (4 semaines), marqué `demo` : la page permet de l’exclure des calculs. */
export const TIMELOG_SEED: TimeEntry[] = (() => {
  const plan: [number, string, number, number][] = [ // [jours en arrière, type, minutes passées, corrections]
    [1, 'L1', 3, 0], [1, 'relance', 1, 0], [2, 'L7', 14, 2], [2, 'D1', 4, 0], [3, 'D5', 9, 1], [3, 'brief', 2, 0], [4, 'L3', 5, 0], [6, 'relance', 1, 0],
    [8, 'L7', 11, 1], [8, 'D2', 6, 0], [9, 'L9', 12, 1], [10, 'L1', 2, 0], [10, 'rappel', 0, 0], [11, 'facture', 6, 1], [13, 'D1', 5, 1],
    [15, 'L7', 18, 3], [15, 'D5', 11, 2], [16, 'L4', 9, 1], [17, 'relance', 2, 0], [18, 'L3', 6, 1],
    [22, 'L7', 22, 3], [22, 'D1', 8, 1], [23, 'D5', 14, 2], [24, 'L1', 4, 1], [25, 'L9', 20, 2],
  ]
  const base = BASELINES as Record<string, number>, names = KIND_LABELS as Record<string, string>
  return plan.map(([days, kind, spent, corrections], i) => {
    const at = new Date(Date.now() - days * 864e5 - (i % 5) * 3600e3).toISOString()
    return { id: `tl-demo-${i}`, at, kind, label: names[kind], baseline: base[kind], spent, net: Math.max(0, base[kind] - spent), corrections, demo: true }
  })
})()

/** Veille réglementaire : textes cités, date de vérification. Aide à la décision, pas un avis juridique. */
export const REGWATCH_SEED: RegWatch[] = [
  { id: 'rw-fr-audit-e', country: 'FR', date: '2025-01-01', title: 'Audit énergétique étendu aux maisons classées E', summary: 'La vente d’une maison individuelle ou d’un immeuble en monopropriété classé E exige un audit énergétique, comme pour F et G depuis avril 2023. Les classes D suivront en 2034.', impact: 'Mandats de maisons E : l’audit doit être disponible dès la première visite.', action: 'Vérifier la classe DPE à la prise de mandat et commander l’audit si besoin.', source: 'https://www.ecologie.gouv.fr/politiques-publiques/audit-energetique-reglementaire', sourceLabel: 'Ministère de la Transition écologique', status: 'en vigueur', verified: 'à confirmer' },
  { id: 'rw-fr-g-location', country: 'FR', date: '2025-01-01', title: 'Logements classés G : non décents à la location', summary: 'Depuis 2025, les logements G ne peuvent plus être proposés à la location ; les F suivront en 2028 et les E en 2034.', impact: 'Argument et décote pour les acquéreurs investisseurs.', action: 'Signaler la classe et le calendrier dans l’estimation et l’annonce.', source: 'https://www.service-public.fr/particuliers/vosdroits/F2042', sourceLabel: 'Service-public.fr', status: 'en vigueur', verified: 'à confirmer' },
  { id: 'rw-fr-erp', country: 'FR', date: '2023-01-01', title: 'État des risques remis dès la première visite', summary: 'La loi Climat et résilience impose d’informer l’acquéreur des risques (ERP) dès la première visite et de mentionner Géorisques dans l’annonce.', impact: 'Toute visite sans ERP est une non-conformité.', action: 'Joindre l’ERP au dossier de visite.', source: 'https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000043975400', sourceLabel: 'Code de l’environnement, art. L125-5', status: 'en vigueur', verified: 'à confirmer' },
  { id: 'rw-fr-efacture', country: 'FR', date: '2027-09-01', title: 'Facturation électronique : émission obligatoire pour les TPE-PME', summary: 'Réception des factures électroniques obligatoire pour toutes les entreprises depuis le 1er septembre 2026 ; émission obligatoire pour les PME et micro-entreprises au 1er septembre 2027.', impact: 'Les factures de commissions devront passer par une plateforme agréée.', action: 'Choisir une plateforme agréée et prévoir l’export des factures Jaspe.', source: 'https://economie.gouv.fr/actualites/facturation-electronique-entre-entreprises-coup-denvoi-de-la-reforme', sourceLabel: 'economie.gouv.fr', status: 'à venir', verified: '25/11/2026' },
  { id: 'rw-fr-lcbft', country: 'FR', date: '2026-11-01', title: 'LCB-FT : contrôles DGCCRF des agents immobiliers', summary: 'Les agents immobiliers sont assujettis au dispositif anti-blanchiment : identification des clients, origine des fonds, déclaration de soupçon à Tracfin, procédures écrites.', impact: 'Un dossier sans contrôle documenté expose l’agence à une sanction de la Commission nationale des sanctions.', action: 'Compléter la checklist de conformité à chaque offre.', source: 'https://www.economie.gouv.fr/dgccrf/lutte-contre-le-blanchiment-de-capitaux-et-le-financement-du-terrorisme', sourceLabel: 'DGCCRF', status: 'en vigueur', verified: 'à confirmer' },
  { id: 'rw-ue-amlr', country: 'UE', date: '2027-07-10', title: 'Règlement européen anti-blanchiment (AMLR)', summary: 'Le règlement (UE) 2024/1624 s’appliquera directement dans tous les États membres, avec un plafond de 10 000 € pour les paiements en espèces et des règles de vigilance harmonisées.', impact: 'Mêmes obligations en France et au Portugal : une checklist commune devient possible.', action: 'Prévoir la mise à jour des procédures avant juillet 2027.', source: 'https://eur-lex.europa.eu/eli/reg/2024/1624/oj', sourceLabel: 'EUR-Lex, règlement (UE) 2024/1624', status: 'à venir', verified: '25/11/2026' },
  { id: 'rw-pt-mediacao', country: 'PT', date: '2013-02-08', title: 'Contrato de mediação imobiliária escrito', summary: 'A Lei n.º 15/2013 exige contrato escrito com identificação das partes, número da licença AMI, condições de remuneração e eventual regime de exclusividade.', impact: 'Sem contrato conforme, a comissão pode ser contestada.', action: 'Gerar o contrato a partir do dossier e conservar a versão assinada.', source: 'https://diariodarepublica.pt/dr/detalhe/lei/15-2013-257806', sourceLabel: 'Diário da República, Lei n.º 15/2013', status: 'en vigueur', verified: '25/11/2026' },
  { id: 'rw-pt-bcft', country: 'PT', date: '2017-08-18', title: 'Branqueamento de capitais : obrigações dos mediadores', summary: 'A Lei n.º 83/2017 obriga os mediadores imobiliários a identificar clientes, verificar a origem dos fundos e reportar trimestralmente ao IMPIC as transações (e arrendamentos acima de 2 500 €/mês).', impact: 'Falta de reporte = contraordenação especialmente grave.', action: 'Preparar o reporte trimestral a partir das escrituras do trimestre.', source: 'https://www.impic.pt/impic/pt-pt/branqueamento-de-capitais', sourceLabel: 'IMPIC', status: 'en vigueur', verified: 'à confirmer' },
  { id: 'rw-pt-simplex', country: 'PT', date: '2024-01-01', title: 'Simplex urbanístico : documentos na escritura', summary: 'O Decreto-Lei n.º 10/2024 deixou de exigir a apresentação da autorização de utilização e da ficha técnica da habitação em várias escrituras.', impact: 'Menos documentos a recolher, mas o comprador pode continuar a pedi-los.', action: 'Confirmar com o notário a lista exata antes da promessa.', source: 'https://diariodarepublica.pt/dr/detalhe/decreto-lei/10-2024-836222410', sourceLabel: 'Diário da República, DL n.º 10/2024', status: 'à surveiller', verified: '25/11/2026' },
  { id: 'rw-pt-ce', country: 'PT', date: '2021-07-01', title: 'Certificado energético obrigatório nos anúncios', summary: 'O Decreto-Lei n.º 101-D/2020 exige certificado energético válido para venda e a classe energética em qualquer anúncio.', impact: 'Anúncio sem classe energética = coima.', action: 'Bloquear a publicação sem classe energética.', source: 'https://diariodarepublica.pt/dr/detalhe/decreto-lei/101-d-2020-150570704', sourceLabel: 'Diário da República, DL n.º 101-D/2020', status: 'en vigueur', verified: 'à confirmer' },
  { id: 'rw-fr-formation-lcbft', country: 'FR', date: '2026-04-24', title: 'Formation LCB-FT obligatoire pour les agents immobiliers', summary: 'Un décret d’avril 2026 impose une formation anti-blanchiment dès l’embauche puis régulière, avec attestations conservées pendant la durée d’emploi et cinq ans après.', impact: 'Chaque collaborateur doit pouvoir produire son attestation lors d’un contrôle DGCCRF.', action: 'Recenser les attestations de l’équipe et planifier les sessions manquantes.', source: 'https://monimmeuble.com/actualite/lutte-contre-le-blanchiment-formation-et-registre-imposes-aux-agents-immobiliers', sourceLabel: 'Décret n° 2026-310 (via monimmeuble.com)', status: 'en vigueur', verified: 'à confirmer sur Légifrance' },
  { id: 'rw-pt-impic-trim', country: 'PT', date: '2026-10-01', title: 'Reporte trimestral ao IMPIC', summary: 'Os mediadores comunicam ao IMPIC, por trimestre, as transações intermediadas e os arrendamentos de renda mensal superior a 2 500 €.', impact: 'O Jaspe pode pré-preencher o reporte a partir dos dossiers fechados no trimestre.', action: 'Verificar as escrituras do trimestre antes do fim do prazo.', source: 'https://www.idealista.pt/news/node/46809', sourceLabel: 'idealista.pt', status: 'en vigueur', verified: 'à confirmer auprès de l’IMPIC' },
]
