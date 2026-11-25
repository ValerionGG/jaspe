// Assistant mesurable : temps gagné (corrections comprises), conformité FR/PT, factures de commissions,
// plan d'action depuis un brief libre, veille marché. Code pur (aucune API Node) : il tourne aussi dans le navigateur.

/** Temps manuel de référence (minutes) par type de travail. Modifiable et recalibré par le conseiller (chrono réel). */
export const BASELINES = {
  D1: 25, D2: 30, D3: 20, D4: 15, D5: 30,
  L1: 10, L2: 15, L3: 25, L4: 30, L5: 20, L6: 25, L7: 45, L8: 20, L9: 40,
  relance: 6, rappel: 4, brief: 15, veille: 20, facture: 20, conformite: 15, tache: 3,
}
export const KIND_LABELS = {
  D1: 'Brief de RDV', D2: 'Comparables', D3: 'Radar quartier', D4: 'Préparation objections', D5: 'Compte rendu de découverte',
  L1: 'Mail de remerciement', L2: 'Synthèse équipe', L3: 'Sélection acquéreurs', L4: 'Kit réseaux sociaux', L5: 'Courrier voisinage',
  L6: 'Book de services', L7: 'Estimation', L8: 'Avant / après', L9: 'Pièces copro & diagnostics',
  relance: 'Relance client', rappel: 'Rappel RDV', brief: 'Brief du matin', veille: 'Veille marché', facture: 'Facture de commission', conformite: 'Contrôle conformité', tache: 'Tâche créée',
}
/** Coût par défaut d'une relecture et d'une correction quand aucun chrono n'est transmis. */
export const REVIEW_MIN = 3
export const CORRECTION_MIN = 5

/* ——— Conformité ——— */
// Aide à la conformité, pas un conseil juridique : chaque point cite son texte ; le conseiller reste responsable.
export const COMPLIANCE = {
  FR: [
    { id: 'carte', phase: 'Agence', side: 'agence', label: 'Carte professionnelle T valide et garantie financière en cours', law: 'Loi Hoguet n° 70-9, art. 3', required: true },
    { id: 'mandat', phase: 'Mandat', side: 'vendeur', label: 'Mandat écrit signé avant toute diffusion', law: 'Loi Hoguet art. 6 · décret 72-678 art. 72', required: true },
    { id: 'registre', phase: 'Mandat', side: 'vendeur', label: 'Mandat inscrit au registre des mandats (numéro reporté sur le mandat et les annonces)', law: 'Décret 72-678 art. 72', required: true },
    { id: 'id-vendeur', phase: 'Mandat', side: 'vendeur', label: 'Identité du vendeur vérifiée (pièce d’identité, Kbis pour une SCI, bénéficiaires effectifs)', law: 'LCB-FT · CMF art. L561-5', required: true },
    { id: 'titre', phase: 'Mandat', side: 'vendeur', label: 'Titre de propriété ou attestation notariée obtenu', law: 'Bonne pratique · vérification du pouvoir de vendre', required: true },
    { id: 'dpe', phase: 'Commercialisation', side: 'vendeur', label: 'DPE valide, classes énergie et climat affichées dans l’annonce', law: 'CCH art. L126-33 · décret 2022-780', required: true },
    { id: 'audit', phase: 'Commercialisation', side: 'vendeur', label: 'Audit énergétique pour une maison ou un immeuble en monopropriété classé E, F ou G', law: 'CCH art. L126-28-1 (E depuis le 1er janvier 2025)', required: false },
    { id: 'erp', phase: 'Commercialisation', side: 'vendeur', label: 'État des risques (ERP) remis dès la première visite', law: 'C. env. art. L125-5 (loi Climat et résilience)', required: true },
    { id: 'honoraires', phase: 'Commercialisation', side: 'vendeur', label: 'Honoraires TTC et partie qui les paie affichés dans l’annonce et en agence', law: 'Arrêté du 10 janvier 2017', required: true },
    { id: 'ddt', phase: 'Compromis', side: 'vendeur', label: 'Dossier de diagnostic technique complet (amiante, plomb, termites, gaz, électricité, assainissement selon le bien)', law: 'CCH art. L271-4', required: true },
    { id: 'copro', phase: 'Compromis', side: 'vendeur', label: 'Documents de copropriété remis à l’acquéreur (règlement, PV d’AG, fiche synthétique, pré-état daté)', law: 'CCH art. L721-2', required: false },
    { id: 'id-acquereur', phase: 'Offre', side: 'acquéreur', label: 'Identité de l’acquéreur vérifiée', law: 'LCB-FT · CMF art. L561-5', required: true },
    { id: 'fonds', phase: 'Offre', side: 'acquéreur', label: 'Origine des fonds documentée (apport, prêt, vente préalable)', law: 'LCB-FT · CMF art. L561-6', required: true },
    { id: 'ppe', phase: 'Offre', side: 'acquéreur', label: 'Personne politiquement exposée et listes de gel des avoirs vérifiées', law: 'CMF art. L561-10 · registre national des gels', required: true },
    { id: 'tracfin', phase: 'Compromis', side: 'agence', label: 'Analyse de risque LCB-FT consignée ; déclaration à Tracfin en cas de soupçon', law: 'CMF art. L561-15', required: true },
    { id: 'rgpd', phase: 'Agence', side: 'agence', label: 'Consentements et durées de conservation des données clients tenus à jour', law: 'RGPD art. 6 et 30', required: true },
  ],
  PT: [
    { id: 'ami', phase: 'Agência', side: 'agence', label: 'Licença AMI válida e seguro de responsabilidade civil em vigor', law: 'Lei n.º 15/2013, art. 5.º e 7.º', required: true },
    { id: 'contrato', phase: 'Mandato', side: 'vendeur', label: 'Contrato de mediação escrito (modelo IMPIC) : partes, imóvel, preço, remuneração, duração, regime de exclusividade', law: 'Lei n.º 15/2013, art. 16.º · Portaria n.º 228/2018', required: true },
    { id: 'id-vendeur', phase: 'Mandato', side: 'vendeur', label: 'Identificação do vendedor e dos beneficiários efetivos', law: 'Lei n.º 83/2017 (BCFT), art. 23.º e ss.', required: true },
    { id: 'caderneta', phase: 'Mandato', side: 'vendeur', label: 'Caderneta predial e certidão permanente do registo predial obtidas', law: 'Boas práticas · prova da titularidade', required: true },
    { id: 'ce', phase: 'Comercialização', side: 'vendeur', label: 'Certificado energético válido, classe indicada nos anúncios', law: 'Decreto-Lei n.º 101-D/2020', required: true },
    { id: 'licenca', phase: 'Comercialização', side: 'vendeur', label: 'Autorização de utilização e ficha técnica : já não exigidas na escritura, recomendadas para o comprador e o banco', law: 'Decreto-Lei n.º 10/2024', required: false },
    { id: 'condominio', phase: 'Promessa', side: 'vendeur', label: 'Declaração de encargos do condomínio', law: 'Código Civil, art. 1424.º-A', required: false },
    { id: 'id-comprador', phase: 'Proposta', side: 'acquéreur', label: 'Identificação do comprador verificada', law: 'Lei n.º 83/2017, art. 24.º', required: true },
    { id: 'fundos', phase: 'Proposta', side: 'acquéreur', label: 'Origem dos fundos documentada', law: 'Lei n.º 83/2017, art. 27.º', required: true },
    { id: 'pep', phase: 'Proposta', side: 'acquéreur', label: 'Pessoa politicamente exposta e listas de sanções verificadas', law: 'Lei n.º 83/2017, art. 39.º', required: true },
    { id: 'impic', phase: 'Escritura', side: 'agence', label: 'Transação incluída no reporte trimestral ao IMPIC', law: 'Lei n.º 83/2017 · reporte trimestral IMPIC', required: true },
    { id: 'rgpd', phase: 'Agência', side: 'agence', label: 'Consentimentos e prazos de conservação dos dados atualizados', law: 'RGPD, art. 6.º e 30.º', required: true },
  ],
}
const STAGE_ORDER = ['prep', 'rdv', 'post', 'mandat', 'commercial', 'offre', 'compromis', 'acte']
const PHASE_STAGE = {
  Agence: 'prep', 'Agência': 'prep', Mandat: 'mandat', Mandato: 'mandat', Commercialisation: 'commercial', 'Comercialização': 'commercial',
  Offre: 'offre', Proposta: 'offre', Compromis: 'compromis', Promessa: 'compromis', Escritura: 'acte',
}
/** Un point devient exigible quand le dossier atteint sa phase. */
export const isDue = (item, stage) => STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf(PHASE_STAGE[item.phase] ?? 'prep')

/* ——— Brief libre → plan d'action (français et portugais) ——— */
const DAYS = [['dimanche', 'domingo'], ['lundi', 'segunda'], ['mardi', 'terça', 'terca'], ['mercredi', 'quarta'], ['jeudi', 'quinta'], ['vendredi', 'sexta'], ['samedi', 'sábado', 'sabado']]
const DOC_RULES = [
  [/estimation|avis de valeur|prix de vente|avalia[çc][ãa]o|estudo de mercado/i, 'L7'], [/compte[- ]rendu|remerci|relat[óo]rio|agradec/i, 'L1'], [/s[ée]lection|acqu[ée]reurs? (?:potentiels|compatibles)|avant-premi|sele[çc][ãa]o de (?:im[óo]veis|compradores)/i, 'L3'],
  [/voisin|vizinh/i, 'L5'], [/r[ée]seaux sociaux|redes sociais|instagram|facebook|linkedin/i, 'L4'],
  // « 4 pièces » décrit un bien : seules les pièces à obtenir déclenchent L9.
  [/diagnostic|copro|condom[íi]nio|pi[èe]ces (?:manquantes|à demander|a demander|justificatives|du dossier)|documentos? em falta|certificado energ/i, 'L9'], [/book|pr[ée]sentation agence|apresenta[çc][ãa]o da ag[êe]ncia/i, 'L6'],
]
/** Date locale AAAA-MM-JJ (pas d’UTC : près de minuit, toISOString décalait d’un jour). */
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
/** Date d'échéance tirée d'une phrase (« vendredi », « demain », « dans 3 jours », « J+7 », « sexta-feira », « amanhã »…). */
export function parseDue(text, now = new Date()) {
  const t = text.toLowerCase()
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12)
  const j = t.match(/j\s*\+\s*(\d+)/) ?? t.match(/dans (\d+) jours?/) ?? t.match(/(?:daqui a|em) (\d+) dias?/)
  if (j) { d.setDate(d.getDate() + Number(j[1])); return ymd(d) }
  if (/apr[èe]s-demain|depois de amanh[ãa]/.test(t)) { d.setDate(d.getDate() + 2); return ymd(d) }
  if (/demain|amanh[ãa]/.test(t)) { d.setDate(d.getDate() + 1); return ymd(d) }
  if (/semaine prochaine|pr[óo]xima semana/.test(t)) { d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return ymd(d) }
  if (/aujourd|ce soir|tout de suite|hoje|esta noite/.test(t)) return ymd(d)
  const day = DAYS.findIndex((alts) => new RegExp(`(?:^|[^a-zà-ÿ])(?:${alts.join('|')})(?:-feira)?(?![a-zà-ÿ])`).test(t))
  if (day >= 0) { d.setDate(d.getDate() + (((day - d.getDay()) + 7) % 7 || 7)); return ymd(d) }
  return null
}
const sentences = (text) => String(text).split(/(?<=[.!?;\n])\s+|\n+/).map((s) => s.trim()).filter(Boolean)
const who = (s) => (/notaire|not[áa]rio/i.test(s) ? 'notaire' : /acqu[ée]reur|acheteur|comprador/i.test(s) ? 'acquéreur' : /syndic|administra[çc][ãa]o do condom/i.test(s) ? 'syndic' : 'vendeur')
const amount = (s) => s.match(/\d[\d\s.,]*\s*(?:k€|m€|millions?|milh[õo]es|mil|€|euros?)/i)?.[0]
/** Signaux de vigilance anti-blanchiment (LCB-FT / BCFT) : un indice suffit à proposer le contrôle, le conseiller décide. */
const AML = /esp[èe]ces|\bcash\b|numer[áa]rio|dinheiro vivo|offshore|\bbvi\b|[îi]les vierges|panama|soci[ée]t[ée] [ée]cran|sociedade[- ]ecr[ãa]|pr[êe]te-nom|pay[ée] par un tiers|crypto|bitcoin|angola|pays (?:tiers|[àa] risque)|pa[íi]s de risco|origine des fonds|origem dos fundos|blanchiment|branqueamento|\blcb|tracfin|\baml\b|\bkyc\b|\bbcft\b|identit[ée]|identifica[çc][ãa]o|\bpep\b|politiquement expos|politicamente expost/i

/** Lit un brief ou un débrief libre (FR ou PT) et propose des actions, chacune expliquée par la phrase qui l'a déclenchée. Rien n'est exécuté ici. */
export function planFromBrief(text, now = new Date()) {
  const items = []
  const add = (it) => items.push({ id: `pl${items.length + 1}`, selected: true, ...it })
  const later = (n) => ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n, 12))
  for (const s of sentences(text)) {
    const due = parseDue(s, now)
    const offer = /\boffre|contre-offre|proposta|contraproposta|\boferta/i.test(s)
    if (/rappel|relanc|recontact|appeler|t[ée]l[ée]phoner|revenir vers|ligar|telefonar|contactar|voltar a falar/i.test(s)) {
      const cond = s.match(/(?:apr[èe]s|depois d[oa]s?) (?:le |la |l’|l'|les )?([^,.]+)/i)?.[1]
      add({ type: 'relance', label: `Relancer le ${who(s)}${cond ? ` après ${cond.trim()}` : ''}`, due: due ?? later(2), source: s })
    }
    if (offer) {
      const a = amount(s)
      add({ type: 'tache', label: `Traiter l’offre${a ? ` de ${a.trim()}` : ''} : résumer prix, conditions et échéance, préparer la réponse au vendeur`, due: due ?? later(1), source: s })
    }
    for (const [re, code] of DOC_RULES) if (re.test(s) && /pr[ée]par|envoy|r[ée]dig|faire|refaire|mettre [àa] jour|transmettre|demander|monter|preparar|enviar|fazer|pedir|atualizar/i.test(s) && !items.some((x) => x.code === code)) {
      add({ type: 'document', code, label: `Préparer : ${KIND_LABELS[code]}`, due, source: s })
    }
    if (/veille|surveill|comparable|baisse de prix|concurren|march[ée]|compar[áa]veis|baixa de pre[çc]o|acompanhar o mercado/i.test(s)) add({ type: 'veille', label: 'Activer la veille comparables et baisses de prix', source: s })
    if (/(prix|montant|surface|date|pre[çc]o|valor|área).{0,25}(confirmer|v[ée]rifier|valider|confirmar|validar)|(confirmer|v[ée]rifier|confirmar).{0,25}(prix|montant|surface|pre[çc]o|valor)/i.test(s)) add({ type: 'point', label: `Point ouvert : ${s.replace(/\s+/g, ' ').slice(0, 120)}`, source: s })
    if (/factur|commission|honoraires? (?:à|a) encaisser|fatura|comiss[ãa]o/i.test(s)) add({ type: 'facture', label: 'Préparer la facture de commission', source: s })
    if (AML.test(s) && !items.some((x) => x.type === 'conformite')) add({ type: 'conformite', label: 'Vigilance LCB-FT : vérifier identité, bénéficiaire effectif et origine des fonds, consigner l’analyse de risque', source: s })
    if (/visite|rendez-vous|\brdv|visita|reuni[ãa]o|contre-visite/i.test(s) && due && !/rappel|relanc|ligar|telefonar/i.test(s) && !offer) add({ type: 'tache', label: `Organiser : ${s.replace(/\s+/g, ' ').slice(0, 90)}`, due, source: s })
  }
  return items
}

/* ——— Veille de démonstration ——— */
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0 }

export function createAssist(db, { put, patch, activity, notify, run, generate, HttpError }) {
  const settings = () => db.get('settings', 'agency') ?? {}
  const country = () => (settings().country === 'PT' ? 'PT' : 'FR')
  const baselines = () => ({ ...BASELINES, ...(db.get('settings', 'time-baselines')?.values ?? {}) })

  /** Consigne un gain de temps : référence manuelle − temps réellement passé (relecture, corrections). */
  const logTime = ({ kind, dossierId, ref, spent = 0, label, demo, pending = false }) => {
    const baseline = baselines()[kind] ?? 5
    // `pending` : brouillon pas encore relu, le gain n’est compté qu’à la validation (relecture comprise).
    return put('timelog', { at: new Date().toISOString(), kind, label: label ?? KIND_LABELS[kind] ?? kind, dossierId, ref, baseline, spent, net: pending ? 0 : Math.max(0, baseline - spent), corrections: 0, demo, pending }, { front: true })
  }
  /** Ajoute du temps passé à la dernière entrée du même livrable (relecture, correction) : le gain net baisse. */
  const addSpent = (ref, minutes, correction = false, { settle = false } = {}) => {
    const e = db.list('timelog').find((x) => x.ref === ref)
    if (!e) return null
    const spent = Math.round((e.spent + minutes) * 10) / 10
    const pending = !!e.pending && !settle
    return patch('timelog', e.id, { spent, net: pending ? 0 : Math.max(0, e.baseline - spent), corrections: e.corrections + (correction ? 1 : 0), pending })
  }

  /* ——— Conformité ——— */
  function evaluate(dossierId) {
    const d = db.get('dossiers', dossierId)
    if (!d) throw new HttpError(404, 'Dossier introuvable')
    const c = country()
    const p = db.get('properties', d.propertyId) ?? {}
    const tx = db.list('transactions').find((t) => t.dossier === dossierId)
    const j = d.journey ?? {}
    const id = `cmp-${dossierId}`
    const prev = db.get('compliance', id)
    const manual = Object.fromEntries((prev?.country === c ? prev.items : []).filter((i) => !i.auto).map((i) => [i.id, i]))
    const piece = (re) => tx?.pieces?.find((x) => re.test(x.l))
    // Déductions explicables depuis les données du dossier ; tout le reste se coche à la main avec la preuve.
    const auto = {
      mandat: j.mandate?.signature === 'signé' || ['commercial', 'offre', 'compromis', 'acte'].includes(d.stage) && !!d.mandate ? 'Mandat signé dans le dossier' : null,
      contrato: j.mandate?.signature === 'signé' || ['commercial', 'offre', 'compromis', 'acte'].includes(d.stage) && !!d.mandate ? 'Contrato assinado no dossier' : null,
      registre: j.mandate?.registry ? `Registre ${j.mandate.registry}` : null,
      dpe: p.dpe ? `DPE classe ${p.dpe} renseigné sur le bien` : null,
      ce: p.dpe ? `Classe energética ${p.dpe} registada` : null,
      ddt: piece(/diagnostic|DDT/i)?.s === 'reçue' ? 'DDT reçu (transaction)' : null,
      titre: piece(/titre de propri/i)?.s === 'reçue' ? 'Titre reçu (transaction)' : null,
      honoraires: j.mandate?.feesPct ? `${j.mandate.feesPct} % TTC charge ${j.mandate.feesPayer}` : null,
    }
    const audit = p.dpe && /[EFG]/.test(p.dpe) && /maison|villa|mas|bastide/i.test(`${p.type ?? ''}`)
    const items = COMPLIANCE[c].map((def) => {
      const due = isDue(def, d.stage)
      if (def.id === 'audit' && p.dpe && !audit) return { ...def, state: 'na', auto: true, evidence: `Non requis (DPE ${p.dpe}, ${p.type ?? 'bien'})`, due }
      if (def.id === 'copro' && /villa|maison|mas|bastide/i.test(`${p.type ?? ''}`)) return { ...def, state: 'na', auto: true, evidence: 'Bien hors copropriété', due }
      if (manual[def.id]) return { ...def, ...manual[def.id], label: def.label, law: def.law, due }
      if (auto[def.id]) return { ...def, state: 'ok', auto: true, evidence: auto[def.id], due }
      return { ...def, state: due && def.required ? 'blocked' : 'todo', auto: false, evidence: '', due }
    })
    const blocking = items.filter((i) => i.state === 'blocked')
    const doc = put('compliance', { id, dossierId, country: c, stage: d.stage, items, score: Math.round((items.filter((i) => i.state === 'ok' || i.state === 'na').length / items.length) * 100), blocking: blocking.length, at: new Date().toISOString() })
    return doc
  }

  /* ——— Factures ——— */
  const nextNumber = () => {
    const y = new Date().getFullYear()
    const s = db.get('settings', 'invoice-seq')
    const n = s?.year === y ? s.n + 1 : 1
    put('settings', { id: 'invoice-seq', year: y, n })
    return `FA-${y}-${String(n).padStart(4, '0')}`
  }

  const actions = {
    'time.calibrate': ({ kind, minutes }) => {
      if (!BASELINES[kind] || !(minutes > 0)) throw new HttpError(400, 'Type de travail et minutes requis')
      const cur = db.get('settings', 'time-baselines') ?? { id: 'time-baselines', values: {}, samples: {} }
      const samples = { ...cur.samples, [kind]: [...(cur.samples?.[kind] ?? []), Number(minutes)].slice(-20) }
      const values = { ...cur.values, [kind]: median(samples[kind]) }
      const s = put('settings', { id: 'time-baselines', values, samples })
      activity('Claire Delmas', `a chronométré « ${KIND_LABELS[kind]} » fait à la main : ${minutes} min (référence ${values[kind]} min)`, 'neutral', '/app/temps')
      return s
    },
    'time.reset': ({ kind }) => {
      const cur = db.get('settings', 'time-baselines')
      if (!cur) return { ok: true }
      const { [kind]: _v, ...values } = cur.values ?? {}; const { [kind]: _s, ...samples } = cur.samples ?? {}
      return put('settings', { id: 'time-baselines', values, samples })
    },

    'compliance.evaluate': ({ dossierId }) => evaluate(dossierId),
    'compliance.set': ({ dossierId, itemId, state, evidence = '' }) => {
      if (!['ok', 'todo', 'na', 'blocked'].includes(state)) throw new HttpError(400, 'État inconnu')
      const cur = db.get('compliance', `cmp-${dossierId}`) ?? evaluate(dossierId)
      if (!cur.items.some((i) => i.id === itemId)) throw new HttpError(404, 'Point de contrôle inconnu')
      if (state === 'ok' && !String(evidence).trim()) throw new HttpError(400, 'Indiquez la preuve ou la référence du document')
      const items = cur.items.map((i) => (i.id === itemId ? { ...i, state, evidence, auto: false, by: 'Claire Delmas', updatedAt: new Date().toISOString() } : i))
      put('compliance', { ...cur, items })
      if (state === 'ok') logTime({ kind: 'conformite', dossierId, ref: `cmp-${dossierId}-${itemId}`, spent: 2, label: `Conformité : ${cur.items.find((i) => i.id === itemId).label.slice(0, 60)}` })
      return evaluate(dossierId)
    },
    'settings.country': ({ country: c }) => {
      if (!['FR', 'PT'].includes(c)) throw new HttpError(400, 'Pays FR ou PT')
      patch('settings', 'agency', { country: c }) ?? put('settings', { id: 'agency', country: c })
      db.list('compliance').forEach((x) => { try { evaluate(x.dossierId) } catch { /* dossier supprimé */ } })
      return { country: c }
    },

    'invoice.fromTransaction': ({ txId }) => {
      const tx = db.get('transactions', txId)
      if (!tx) throw new HttpError(404, 'Transaction introuvable')
      const existing = db.list('invoices').find((i) => i.txId === txId && i.status !== 'annulée')
      if (existing) return existing
      const c = country(), s = settings()
      const rate = c === 'PT' ? 0.23 : 0.2
      // FR : honoraires affichés TTC. PT : comissão + IVA à taxa normal.
      const ht = c === 'PT' ? tx.fees : Math.round((tx.fees / (1 + rate)) * 100) / 100
      const vat = Math.round(ht * rate * 100) / 100
      const ttc = Math.round((ht + vat) * 100) / 100
      const prop = db.get('properties', tx.propertyId) ?? {}
      const payer = tx.feePayer === 'vendeur' ? tx.seller : tx.buyer
      const inv = put('invoices', {
        txId, dossierId: tx.dossier, country: c, number: null, status: 'brouillon', createdAt: new Date().toISOString(),
        client: payer, payerRole: tx.feePayer, object: `Honoraires de négociation — vente ${prop.title ?? tx.propertyId}${prop.city ? `, ${prop.city}` : ''} (prix ${tx.price.toLocaleString('fr-FR')} €)`,
        price: tx.price, ht, vatRate: rate, vat, ttc, due: 'À réception, au plus tard à la signature de l’acte',
        split: (tx.split ?? []).map((x) => ({ ...x, amount: Math.round(ht * x.pct) / 100 })),
        issuer: { name: s.agencyName ?? 'Agence', legal: c === 'PT' ? (s.ami ?? 'Licença AMI n.º à compléter · NIF à compléter') : (s.carte ?? 'Carte professionnelle T n° à compléter · garantie financière à compléter · RCS à compléter') },
        mentions: c === 'PT'
          ? ['Documento de preparação : a fatura legal deve ser emitida num programa de faturação certificado pela AT (ATCUD e código QR).', `IVA à taxa normal de ${rate * 100} %.`]
          : ['Honoraires dus au titre du mandat, exigibles à la réalisation de la vente (loi Hoguet, art. 6).', `TVA ${rate * 100} % sur les encaissements.`, 'Facturation électronique : réception obligatoire depuis le 1er septembre 2026, émission obligatoire pour les TPE-PME au 1er septembre 2027.'],
      }, { front: true })
      logTime({ kind: 'facture', dossierId: tx.dossier, ref: `inv-${inv.id}`, pending: true })
      activity('Copilote', `a préparé la facture de commission — ${tx.seller} → ${tx.buyer}`, 'ai', '/app/factures')
      return inv
    },
    'invoice.update': ({ id, ...p }) => {
      const inv = db.get('invoices', id)
      if (!inv) throw new HttpError(404, 'Facture introuvable')
      if (inv.status !== 'brouillon') throw new HttpError(409, 'Facture validée : elle ne se modifie plus, émettez un avoir')
      const allowed = Object.fromEntries(Object.entries(p).filter(([k]) => ['client', 'object', 'due', 'ht'].includes(k)))
      if (allowed.ht != null) { const ht = Number(allowed.ht); allowed.ht = ht; allowed.vat = Math.round(ht * inv.vatRate * 100) / 100; allowed.ttc = Math.round((ht + allowed.vat) * 100) / 100; allowed.split = inv.split.map((x) => ({ ...x, amount: Math.round(ht * x.pct) / 100 })) }
      addSpent(`inv-${id}`, CORRECTION_MIN, true)
      return patch('invoices', id, allowed)
    },
    'invoice.validate': ({ id }) => {
      const inv = db.get('invoices', id)
      if (!inv) throw new HttpError(404, 'Facture introuvable')
      if (inv.status !== 'brouillon') return inv
      const number = nextNumber()
      addSpent(`inv-${id}`, REVIEW_MIN, false, { settle: true })
      activity('Claire Delmas', `a validé la facture ${number} (${inv.ttc.toLocaleString('fr-FR')} € TTC)`, 'win', '/app/factures')
      return patch('invoices', id, { number, status: 'validée', validatedAt: new Date().toISOString() })
    },
    'invoice.send': ({ id }) => {
      const inv = db.get('invoices', id)
      if (!inv || inv.status === 'brouillon') throw new HttpError(409, 'Validez la facture avant envoi')
      return patch('invoices', id, { status: 'envoyée', sentAt: new Date().toISOString(), sendNote: 'Envoi consigné · connecteur e-mail non configuré' })
    },
    'invoice.paid': ({ id }) => {
      const inv = db.get('invoices', id)
      if (!inv || !['validée', 'envoyée'].includes(inv.status)) throw new HttpError(409, 'Seule une facture validée peut être encaissée')
      notify('Commission encaissée', `${inv.number} · ${inv.ttc.toLocaleString('fr-FR')} € TTC`, 'win', '/app/factures')
      return patch('invoices', id, { status: 'payée', paidAt: new Date().toISOString() })
    },
    'invoice.cancel': ({ id }) => {
      const inv = db.get('invoices', id)
      if (!inv) throw new HttpError(404, 'Facture introuvable')
      if (inv.status === 'brouillon') { db.remove('invoices', id); return { ok: true, removed: true } }
      return patch('invoices', id, { status: 'annulée', cancelNote: 'Annulée : émettre un avoir du même montant' })
    },

    'assistant.plan': ({ text }) => {
      if (!String(text ?? '').trim()) throw new HttpError(400, 'Brief vide')
      return { items: planFromBrief(String(text).slice(0, 4000)) }
    },
    /** Exécute uniquement les actions cochées par le conseiller. Les envois restent à valider. */
    'assistant.apply': async ({ dossierId, items = [], text = '' }) => {
      const d = dossierId ? db.get('dossiers', dossierId) : null
      if (dossierId && !d) throw new HttpError(404, 'Dossier introuvable')
      const who = d?.seller ?? 'sans dossier'
      const done = []
      for (const it of items.filter((x) => x.selected !== false)) {
        if (it.type === 'relance' || it.type === 'tache') {
          const t = put('tasks', { title: `${it.label}${d ? ` — ${d.seller}` : ''}`, dossier: dossierId, due: it.due ?? 'Cette semaine', dueDate: it.due, prio: 'haute', kind: it.type === 'relance' ? 'appeler' : 'document', ai: true, done: false, source: it.source }, { front: true })
          logTime({ kind: it.type === 'relance' ? 'relance' : 'tache', dossierId, ref: `task-${t.id}` })
          done.push({ ...it, result: 'tâche créée' })
        } else if (it.type === 'document' && d) {
          await generate(dossierId, it.code, { quiet: true })
          done.push({ ...it, result: 'brouillon prêt à relire' })
        } else if (it.type === 'veille') {
          put('watches', { id: `w-${dossierId ?? 'global'}`, dossierId, at: new Date().toISOString(), criteria: 'Comparables du secteur, baisses de prix', active: true })
          logTime({ kind: 'veille', dossierId, ref: `w-${dossierId}` })
          done.push({ ...it, result: 'veille active' })
        } else if (it.type === 'point') {
          put('notes', { dossierId, text: it.label, at: new Date().toISOString(), by: 'Copilote' }, { front: true })
          done.push({ ...it, result: 'noté au dossier' })
        } else if (it.type === 'facture') {
          const tx = db.list('transactions').find((t) => t.dossier === dossierId)
          if (tx) { actions['invoice.fromTransaction']({ txId: tx.id }); done.push({ ...it, result: 'facture en brouillon' }) } else done.push({ ...it, result: 'aucune transaction sur ce dossier' })
        } else if (it.type === 'conformite' && d) {
          evaluate(dossierId)
          done.push({ ...it, result: 'checklist de conformité mise à jour' })
        }
      }
      if (text && d) put('notes', { dossierId, text: `Brief : ${String(text).slice(0, 600)}`, at: new Date().toISOString(), by: 'Claire Delmas' }, { front: true })
      activity('Copilote', `a lancé ${done.length} action(s) depuis un brief — ${who}`, 'ai', d ? `/app/dossiers/${dossierId}` : '/app/taches')
      run('AUT-120', 'ok', `${done.length} action(s) créée(s) depuis un brief — ${who}`)
      return { done }
    },

    'feedback.send': ({ text, page, mood }) => {
      if (!String(text ?? '').trim()) throw new HttpError(400, 'Retour vide')
      return put('feedback', { text: String(text).slice(0, 2000), page, mood, at: new Date().toISOString(), by: 'Claire Delmas' }, { front: true })
    },
  }

  const rules = {
    'AUT-121': () => { // veille marché sur les dossiers suivis (données de démonstration : annonces du secteur)
      const day = new Date().toISOString().slice(0, 10)
      let n = 0
      for (const w of db.list('watches').filter((x) => x.active && x.dossierId)) {
        if (w.lastDay === day) continue
        const d = db.get('dossiers', w.dossierId); const p = d && db.get('properties', d.propertyId)
        if (!p?.price || !p.surface) continue
        const comps = db.list('properties').filter((x) => x.id !== p.id && x.city === p.city && x.surface && x.price)
        const ppm = Math.round(p.price / p.surface), med = Math.round(median(comps.map((x) => x.price / x.surface)))
        const gap = med ? Math.round(((ppm - med) / med) * 100) : 0
        patch('watches', w.id, { lastDay: day, last: { comps: comps.length, ppm, med, gap } })
        notify('Veille marché', `${d.seller} : ${comps.length} comparable(s) à ${p.city}, ${ppm.toLocaleString('fr-FR')} €/m² contre ${med.toLocaleString('fr-FR')} €/m² médian (${gap > 0 ? '+' : ''}${gap} %)`, Math.abs(gap) > 10 ? 'warn' : 'info', `/app/dossiers/${d.id}`)
        logTime({ kind: 'veille', dossierId: d.id, ref: `w-${d.id}-${day}` }); n++
      }
      return [n ? 'ok' : 'skip', n ? `${n} signal(aux) de veille` : 'Aucune veille à rafraîchir']
    },
    'AUT-122': () => { // conformité : points bloquants des dossiers en offre / compromis / acte
      const hot = db.list('dossiers').filter((d) => ['offre', 'compromis', 'acte'].includes(d.stage))
      let n = 0
      for (const d of hot) {
        const c = evaluate(d.id)
        if (c.blocking && !db.get('notifications', `n-cmp-${d.id}-${c.blocking}`)) {
          put('notifications', { id: `n-cmp-${d.id}-${c.blocking}`, at: new Date().toISOString(), title: 'Conformité à compléter', body: `${d.seller} : ${c.blocking} point(s) bloquant(s) — ${c.items.filter((i) => i.state === 'blocked').slice(0, 2).map((i) => i.label.split(' (')[0]).join(' · ')}`, tone: 'warn', read: false, link: '/app/conformite' }, { front: true }); n++
        }
      }
      return [n ? 'ok' : 'skip', `${hot.length} dossier(s) avancé(s) contrôlé(s)`]
    },
  }
  const OWN = [
    { id: 'AUT-120', family: 'Copilote', name: 'Plan d’action depuis un brief', trigger: 'Brief ou débrief saisi', conditions: 'Actions cochées par le conseiller', action: 'Créer relances, brouillons, veille, facture, contrôles', autonomy: 'V', success: 'Chaque action relie la phrase qui l’a déclenchée', fallback: 'Aucune action sans validation', phase: 'P0', enabled: true },
    { id: 'AUT-121', family: 'Marché', name: 'Veille comparables du dossier', trigger: 'Chaque jour', conditions: 'Veille activée sur le dossier', action: 'Comparer le prix au m² aux biens du secteur, signaler un écart', autonomy: 'A', success: 'Un signal par jour et par dossier', fallback: 'Silence si moins de 2 comparables', phase: 'P0', enabled: true },
    { id: 'AUT-122', family: 'Conformité', name: 'Points de conformité bloquants', trigger: 'Dossier en offre, compromis ou acte', conditions: 'Checklist du pays de l’agence', action: 'Alerter sur les contrôles manquants', autonomy: 'A', success: 'Aucun compromis sans contrôle LCB-FT', fallback: 'Alerte manager', phase: 'P0', enabled: true },
  ]
  for (const r of OWN) if (!db.get('routines', r.id)) db.put('routines', r)

  return { actions, rules, logTime, addSpent, evaluate }
}
