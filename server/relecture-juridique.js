// Génère le dossier de relecture juridique à partir des règles réellement codées dans Jaspe.
// Usage : node relecture-juridique.js > ../docs/juridique/RELECTURE.md
// Rien n’est réécrit à la main : si le code change, on régénère, et le juriste relit la même chose que ce que l’app applique.
import { COMPLIANCE } from './assist.js'
import { FATF, CLIENT_TYPES, FACTORS, MEASURES, DECISIONS, LEGAL, IMPIC_DEADLINE, IMPIC_FIELDS, LINK_DAYS } from './evidence.js'

const flag = (s) => (/(a confirmar|à confirmer|à vérifier)/i.test(String(s)) ? ' ⚠️' : '')
const box = '- [ ]'
const out = []
const p = (...l) => out.push(...l)

p('# Dossier de relecture juridique — Jaspe', '')
p(`Généré depuis le code le ${new Date().toISOString().slice(0, 10)} (\`server/relecture-juridique.js\`). Chaque ligne est une règle que l’application applique ou un texte qu’elle montre à un client.`, '')
p('**Comment relire :**', '')
p('1. Cochez une case si la règle et sa référence sont exactes.')
p('2. Sinon, écrivez la correction en dessous.')
p('3. Les lignes marquées ⚠️ sont celles que nous savons incertaines : à traiter en priorité.', '')
p('Jaspe se présente comme une **aide à la conformité**, pas comme un conseil juridique. Ce dossier sert à vérifier que l’aide ne dit rien de faux.', '')

for (const [country, title] of [['FR', 'France — contrôle du dossier de vente'], ['PT', 'Portugal — controlo do processo de venda']]) {
  p(`## ${title}`, '')
  let phase = ''
  for (const it of COMPLIANCE[country]) {
    if (it.phase !== phase) { phase = it.phase; p('', `### ${phase}`, '') }
    p(`${box} **${it.label}**${it.required ? '' : ' *(recommandé)*'} — ${it.law}${flag(it.law + it.label)}`)
  }
  p('')
}

p('## LCB-FT — grille de risque (FR et PT)', '')
p('Type de client (points) :', '')
for (const [, c] of Object.entries(CLIENT_TYPES)) p(`${box} ${c.label} : ${c.points} pt`)
p('', 'Facteurs de risque :', '')
for (const f of FACTORS) p(`${box} ${f.label} : ${f.points} pt${f.floor ? ` (niveau minimal : ${f.floor})` : ''} — FR : ${f.law.FR} · PT : ${f.law.PT}${flag(f.law.FR + f.law.PT)}`)
p('', `${box} Seuils : le score donne le niveau faible / moyen / élevé (voir \`evidence.js\`, fonction de calcul) — à valider comme proportionné.`, '')
p('Mesures de vigilance affichées selon le niveau :', '')
for (const c of ['FR', 'PT']) for (const [lvl, list] of Object.entries(MEASURES[c])) for (const m of list) p(`${box} ${c} · ${lvl} — ${m}${flag(m)}`)
p('', 'Décisions proposées au conseiller :', '')
for (const d of Object.values(DECISIONS)) p(`${box} ${d}`)

p('', '## Pays à risque (listes GAFI)', '')
p(`${box} Listes intégrées au ${FATF.asOf} (${FATF.sourceLabel}). ${FATF.verified} ⚠️`)
p(`- Liste noire : ${FATF.call.map((c) => c.fr).join(', ')}`)
p(`- Liste grise : ${FATF.grey.map((c) => c.fr).join(', ')}`)
p(`- Source : ${FATF.source}`, '')

p('## Textes montrés au client (lien de dépôt des pièces)', '')
p(`Le lien est valable ${LINK_DAYS} jours.`, '')
for (const [lang, t] of Object.entries(LEGAL)) {
  p(`### ${lang === 'fr' ? 'Français' : 'Português'} — « ${t.title} »`, '')
  for (const x of [...t.body, ...t.privacy]) p(`${box} ${x}${flag(x)}`)
  p(`${box} Attestation acquéreur : ${t.declare}`)
  p(`${box} Attestation vendeur : ${t.declareSeller}`)
  p(`${box} Question PPE : ${t.pep}`, '')
}

p('## Portugal — communication trimestrielle à l’IMPIC', '')
p(`${box} Délai appliqué : ${IMPIC_DEADLINE.rule} (statut : ${IMPIC_DEADLINE.status}) ⚠️ — rappels à J-${IMPIC_DEADLINE.remindDays.join(' et J-')}`)
p(`- À vérifier sur : ${IMPIC_DEADLINE.verifyAt}`)
for (const s of IMPIC_DEADLINE.sources) p(`- Source secondaire : ${s}`)
p('', 'Champs de l’export (anexo B) :', '')
for (const f of IMPIC_FIELDS) p(`${box} ${f.label}${f.confirm ? ' ⚠️ (format à confirmer)' : ''}`)

p('', '## Factures de commission', '')
p(`${box} Portugal : TVA 23 % (IVA23) ou exonération art. 53.º CIVA (code M10) ; retenue IRS art. 101.º CIRS (taux selon la situation du consultor) ⚠️`)
p(`${box} France : franchise en base de TVA par défaut (mention art. 293 B du CGI) ; code VATEX-FR-FRANCHISE pour la facture électronique non émis ⚠️`)
p(`${box} Les factures sont émises par le logiciel certifié de l’agence (InvoiceXpress au Portugal) ; Jaspe prépare, ne certifie pas.`, '')

p('## Questions ouvertes pour le juriste', '')
p('1. Durée de conservation des pièces LCB-FT au Portugal : 7 ans (art. 51.º Lei 83/2017) — confirmé ?')
p('2. Délai IMPIC : fin du trimestre suivant — confirmé par le Regulamento n.º 603/2021 ?')
p('3. Le calcul de score (points et seuils) est-il défendable lors d’un contrôle DGCCRF / ASAE-IMPIC ?')
p('4. Une agence peut-elle s’appuyer sur une attestation sur l’honneur pour l’origine des fonds en vigilance standard ?')
p('5. Mentions obligatoires manquantes sur les factures FR (pénalités de retard, indemnité de 40 €) pour un mandataire ?')
process.stdout.write(out.join('\n') + '\n')
