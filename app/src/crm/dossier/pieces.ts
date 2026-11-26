// Pièces du dossier vendeur, générées selon le pays et le type de bien (comptes réels).
// La démonstration garde sa liste historique (DEMO_PIECES) et ses états figés.
// ponytail: règles simplifiées (année de construction comme proxy de l’âge des installations, zones termites non
// géolocalisées) — liste indicative, la note de bas de liste renvoie au juriste ; brancher Géorisques/arrêtés si besoin.
import type { LooseProperty } from './facts'

export type PieceState = 'ok' | 'missing' | 'check'
export type Piece = { key: string; label: string; ref?: string; when?: string }

/** Liste historique de la démonstration : [libellé, état, référence]. Clés = libellés (inchangées). */
export const DEMO_PIECES: [string, PieceState, string][] = [
  ['Titre de propriété', 'ok', 'p.1-14'], ['DPE', 'ok', 'p.2'], ['Diagnostic amiante', 'ok', 'p.1'], ['Électricité / gaz', 'ok', 'p.3'], ['Termites', 'ok', 'p.1'],
  ['ERP · risques', 'ok', 'Géorisques'], ['Taxe foncière 2025', 'ok', 'p.1'], ['PV d’AG 2025', 'missing', '—'], ['Règlement ASL', 'check', 'à vérifier'], ['Plans', 'ok', '3 pages'], ['Permis piscine', 'check', 'à vérifier'],
]

const isFlat = (p: LooseProperty) => /appart|apartamento|flat|studio|t\d/i.test(p.type ?? '')

/** Liste conditionnelle : FR (vente) ou PT (venda). `regime` : réponse D5 (copro, ASL, propriedade horizontal…). */
export function piecesFor(country: 'FR' | 'PT', p: LooseProperty, regime = ''): Piece[] {
  const y = typeof p.year === 'number' && p.year > 1000 ? p.year : null
  const now = new Date().getFullYear()
  const out: Piece[] = []
  const add = (key: string, label: string, ref?: string, when?: string) => out.push({ key, label, ref, when })
  if (country === 'PT') {
    const condo = isFlat(p) || /condom|horizontal|copro/i.test(regime)
    add('pt.caderneta', 'Caderneta predial urbana', 'Finanças · CIMI art. 93.º')
    add('pt.certidao', 'Certidão permanente do registo predial', 'Código do Registo Predial')
    add('pt.ce', 'Certificado energético (SCE / ADENE)', 'DL 101-D/2020')
    if (y !== null && y < 1951) add('pt.isencao', 'Certidão de isenção de licença de utilização', 'RGEU · imóvel anterior a 1951', `construído em ${y}`)
    else add('pt.licenca', y === null ? 'Licença de utilização (ou isenção se anterior a 1951)' : 'Licença de utilização', 'RJUE · DL 555/99')
    if (y === null || y >= 2004) add('pt.ficha', 'Ficha técnica da habitação', 'DL 68/2004', y === null ? 'se posterior a 2004' : undefined)
    add('pt.planta', 'Planta do imóvel', 'Câmara Municipal')
    add('pt.imi', 'IMI — último comprovativo de pagamento', 'CIMI')
    if (condo) add('pt.condominio', 'Declaração de não dívida ao condomínio', 'Código Civil art. 1424.º-A')
    add('pt.id', 'Documento de identificação e NIF dos vendedores')
    return out
  }
  const copro = isFlat(p) || /copro/i.test(regime)
  const old = (limit: number) => y === null || y < limit
  add('fr.titre', 'Titre de propriété', 'Acte notarié')
  add('fr.dpe', 'DPE', 'CCH L.126-26')
  if (old(1997)) add('fr.amiante', 'Diagnostic amiante', 'CSP L.1334-13', y === null ? 'si permis avant juillet 1997' : `permis avant 1997 (${y})`)
  if (old(1949)) add('fr.plomb', 'Constat de risque d’exposition au plomb (CREP)', 'CSP L.1334-6', y === null ? 'si construit avant 1949' : `construit en ${y}`)
  if (old(now - 15)) {
    add('fr.elec', 'Diagnostic électricité', 'CCH L.271-4', 'installation de plus de 15 ans')
    add('fr.gaz', 'Diagnostic gaz (si installation)', 'CCH L.271-4', 'installation de plus de 15 ans')
  }
  add('fr.termites', 'État relatif aux termites', 'CCH L.271-4', 'si zone délimitée par arrêté préfectoral')
  add('fr.erp', 'État des risques (ERP)', 'C. env. L.125-5')
  if (!copro && (p.land || !isFlat(p))) add('fr.assain', 'Contrôle de l’assainissement non collectif', 'CSP L.1331-11-1', 'si non raccordé au tout-à-l’égout')
  add('fr.tf', 'Dernier avis de taxe foncière')
  add('fr.id', 'Pièce d’identité des vendeurs')
  if (copro) {
    add('fr.reglement', 'Règlement de copropriété et état descriptif de division', 'Loi 65-557')
    add('fr.pvag', 'PV des 3 dernières assemblées générales', 'CCH L.721-2')
    add('fr.carnet', 'Carnet d’entretien de l’immeuble', 'CCH L.721-2')
    add('fr.preetat', 'Pré-état daté et fiche synthétique', 'CCH L.721-2')
    add('fr.carrez', 'Plans et mesurage loi Carrez', 'Loi 65-557 art. 46')
  }
  if (/ASL/i.test(regime)) add('fr.asl', 'Statuts et budget de l’ASL')
  return out
}
