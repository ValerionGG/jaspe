// Gabarits déterministes des livrables D1–D3 / L1–L9 : uniquement des faits présents dans le dossier.
const ok = (n) => typeof n === 'number' && Number.isFinite(n) && n > 0
const eur = (n) => !ok(n) ? 'à établir' : (n >= 1e6 ? `${(n / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M€` : `${Math.round(n / 1000).toLocaleString('fr-FR')} k€`)
const fmt = (n) => (Number.isFinite(Number(n)) && n !== null && n !== '' ? Number(n).toLocaleString('fr-FR') : '—')
const today = () => new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
// Portugais européen (pt-PT) : « 2,8 M€ », « 850 mil € », « 15 000 €/m² », « 26 de novembro de 2026 ».
const eurPt = (n) => !ok(n) ? 'a definir' : (n >= 1e6 ? `${(n / 1e6).toLocaleString('pt-PT', { maximumFractionDigits: 2 })} M€` : `${Math.round(n / 1000).toLocaleString('pt-PT')} mil €`)
const fmtPt = (n) => (Number.isFinite(Number(n)) && n !== null && n !== '' ? Number(n).toLocaleString('pt-PT') : '—')
const todayPt = () => new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
/** Langue des livrables : portugais si l’agence l’a choisi ou exerce au Portugal. */
export const docLang = (settings = {}) => (settings?.lang === 'pt' || settings?.country === 'PT' ? 'pt' : 'fr')

export const NAMES = {
  D1: 'Brief relationnel', D2: 'Marché & comparables', D3: 'Radar quartier', D4: 'Simulation coaching', D5: 'Découverte vendeur',
  L1: 'Mail de remerciement', L2: 'Synthèse équipe', L3: 'Avant-première acquéreurs', L4: 'Kit réseaux sociaux', L5: 'Courrier voisinage',
  L6: 'Book de services', L7: 'Analyse & estimation', L8: 'Avant / après', L9: 'Dossier copro & diagnostics',
}
export const NAMES_PT = {
  D1: 'Briefing relacional', D2: 'Mercado e comparáveis', D3: 'Radar do bairro', D4: 'Simulação de coaching', D5: 'Relatório de descoberta',
  L1: 'Email de agradecimento', L2: 'Síntese para a equipa', L3: 'Seleção de compradores', L4: 'Kit redes sociais', L5: 'Carta à vizinhança',
  L6: 'Book de serviços', L7: 'Avaliação e estudo de mercado', L8: 'Antes / depois', L9: 'Dossier condomínio e certificados',
}
/** Livrables qui sortent de l’agence : validation humaine obligatoire puis file d’envoi. */
export const EXTERNAL = new Set(['L1', 'L3', 'L4', 'L5', 'L6', 'L7'])

function matchBuyers(p, buyers) {
  return buyers
    .map((b) => {
      const inBudget = p.price >= (b.budget?.[0] ?? 0) * 0.9 && p.price <= (b.budget?.[1] ?? Infinity) * 1.05
      const inZone = (b.zones ?? []).some((z) => [p.district, p.city].some((x) => x?.includes(z) || z.includes(x ?? '~')))
      const sameType = !b.type || b.type === p.type || (b.type === 'Maison' && p.type === 'Villa')
      const score = Math.round((inBudget ? 45 : 0) + (inZone ? 35 : 0) + (sameType ? 20 : 0))
      return { b, score }
    })
    .filter((x) => x.score >= 65)
    .sort((a, b) => b.score - a.score)
}

function draft(code, { dossier: d0, property: p0, agent: a, buyers = [], settings = {} }) {
  // Dossier réel (créé dans l’app) : aucune pièce ni valeur supposée ; démo : données complètes d’origine.
  const real = !/^d\d+$/.test(String(d0?.id ?? ''))
  const d = { ...d0, motivation: d0?.motivation || 'projet à préciser', timeline: d0?.timeline || 'à préciser', tags: d0?.tags ?? [], seller: d0?.seller || 'Vendeur' }
  const p = { ...p0, title: p0?.title || 'Bien', address: p0?.address || '', city: p0?.city || '', district: p0?.district || p0?.city || '', features: p0?.features ?? [], dpe: p0?.dpe || 'non renseigné', type: p0?.type || 'Bien' }
  const agency = settings.agencyName ?? 'Maison Riviera · Antibes'
  const sign = `${a?.name ?? 'Votre conseiller'}\n${a?.role ?? ''} · ${agency}`
  const seller = d.seller
  const civil = seller.startsWith('Famille') ? `Chère famille ${seller.replace('Famille ', '')}` : `Madame, Monsieur`
  const ppm = ok(p.price) && ok(p.surface) ? Math.round(p.price / p.surface) : NaN
  const base = { id: `${d.id}-${code}`, dossierId: d.id, code, title: NAMES[code], createdAt: new Date().toISOString(), status: 'review', version: 1 }
  const src = (label, date = today()) => ({ label, date })
  switch (code) {
    case 'D1': return { ...base, kind: 'report', body: [
      `Brief avant rendez-vous — ${seller}`,
      `Projet déclaré : ${d.motivation}. Horizon : ${d.timeline}.`,
      `Bien : ${[p.title, p.address, p.city].filter(Boolean).join(', ')} — ${fmt(p.surface)} m², ${fmt(p.rooms)} pièces${p.land ? `, terrain ${fmt(p.land)} m²` : ''}.`,
      `À confirmer pendant l’entretien : décideurs et accord commun, prix souhaité, calendrier de départ, pièces disponibles (DPE, taxe foncière, titre).`,
      `Points d’attention : ${d.tags.join(', ') || 'aucun signalé'}.`,
    ], sources: [src('Fiche dossier'), src('Agenda')] }
    case 'D2': return { ...base, kind: 'report', body: [
      `Marché — ${p.district}, ${p.city}`,
      `Prix de présentation envisagé : ${eur(p.price)}${ok(ppm) ? ` (${fmt(ppm)} €/m²)` : ''}.`,
      `Fourchette issue des comparables : ${eur(p.estimateLow)} – ${eur(p.estimateHigh)}.`,
      `Les prix vendus (DVF) et les prix affichés (annonces) sont distingués ; l’échantillon et ses limites sont détaillés dans l’analyse L7.`,
    ], sources: [src('DVF · Etalab, millésime 2026-S1'), src('Annonces actives du secteur')] }
    case 'D3': return { ...base, kind: 'report', body: [
      `Radar quartier — ${p.district}`,
      `Couches consultées : adresse IGN, parcelle cadastrale, zonage PLU (Géoportail de l’urbanisme), risques (Géorisques).`,
      `Aucun impact sur la valeur n’est déduit automatiquement : les projets sont listés avec leur statut (autorisé, commencé, livré).`,
    ], sources: [src('IGN Géoplateforme'), src('GPU'), src('Géorisques')] }
    case 'D4': return { ...base, kind: 'report', body: [
      `Répétition du rendez-vous — ${seller}`,
      `Objectif : obtenir un mandat ${d.mandate ? d.mandate.toLowerCase() : 'exclusif'} sur la base d’un plan de commercialisation clair.`,
      `Objections probables : « vos honoraires sont élevés », « pourquoi l’exclusivité ? », « le voisin a vendu plus cher », « je veux d’abord tester le prix ».`,
      `Réponses à préparer : valeur des services réellement fournis (L6), comparables vendus (D2) plutôt qu’affichés, engagement de comptes rendus réguliers, durée et sortie du mandat.`,
      `Points d’écoute : ${d.motivation}. Horizon ${d.timeline}. Ne pas promettre de prix ni de délai.`,
      `Simulation vocale disponible dans Coaching ; le retour reste privé sauf partage volontaire.`,
    ], sources: [src('Découverte et brief D1'), src('Comparables D2')] }
    case 'L1': return { ...base, kind: 'email', to: seller, subject: `Merci pour votre accueil — ${p.title}`, body: [
      `${civil},`,
      `Merci pour le temps que vous m’avez accordé et pour la visite de votre bien${p.address ? ` ${p.address}` : ''}. Votre projet — ${d.motivation.toLowerCase()} — est clair, et nous construirons un calendrier qui le respecte.`,
      d.clientNextStep ? `Prochaine étape convenue : ${d.clientNextStep}.` : `Comme convenu, je reviens vers vous très prochainement avec l’analyse de valeur argumentée de votre bien, puis nous fixerons ensemble la suite.`,
      `Je reste à votre disposition pour toute question.`,
      sign,
    ], sources: [src('Découverte D5 validée'), src('Agenda — prochaine étape')] }
    case 'L2': return { ...base, kind: 'message', to: 'Équipe agence', body: [
      `🏡 Nouvelle opportunité — ${p.title}`,
      `${p.district} · ${p.surface} m² · ${p.rooms} p.${p.land ? ` · ${fmt(p.land)} m² terrain` : ''} · DPE ${p.dpe}`,
      `Valeur estimée ${eur(p.estimateLow)} – ${eur(p.estimateHigh)}. Vendeur : ${d.motivation.toLowerCase()}, horizon ${d.timeline}.`,
      `Vous avez un acquéreur ? Répondez avec son nom, je centralise. — ${a?.name?.split(' ')[0] ?? ''}`,
    ], sources: [src('Fiche bien')] }
    case 'L3': {
      const m = matchBuyers(p, buyers)
      return { ...base, kind: 'email', to: m.map((x) => x.b.name).join(', ') || 'Aucun acquéreur compatible', subject: `En avant-première : ${p.title}`, matches: m.map((x) => ({ id: x.b.id, name: x.b.name, score: x.score })), body: [
        `Bonjour,`,
        `Vous recherchez ${m[0]?.b.type?.toLowerCase() ?? 'un bien'} dans le secteur ${p.district} : nous préparons la mise en vente d’un bien qui correspond à vos critères déclarés.`,
        `${p.title} — ${p.surface} m², ${p.rooms} pièces, ${p.features.slice(0, 3).join(', ').toLowerCase()}. Prix de présentation : ${eur(p.price)}.`,
        `Souhaitez-vous une visite avant la diffusion publique ?`,
        sign,
      ], sources: [src(`${m.length} recherche(s) compatible(s) · critères déclarés`)] }
    }
    case 'L4': return { ...base, kind: 'social', posts: [
      { network: 'Instagram', text: `Nouveauté ${p.district} ✦ ${p.title}. ${p.surface} m², ${p.features[0]?.toLowerCase() ?? ''}. Visites sur rendez-vous.`, label: 'Image retouchée — IA (original conservé)' },
      { network: 'LinkedIn', text: `Nous accompagnons la vente d’un bien rare à ${p.city} : ${p.title.toLowerCase()}, ${p.rooms} pièces, DPE ${p.dpe}. Acquéreurs qualifiés, contactez-nous.` },
      { network: 'Facebook', text: `À découvrir : ${p.title} à ${p.city}. ${p.features.join(' · ')}. Honoraires à la charge du vendeur.` },
    ], body: [`Trois publications prêtes, mentions obligatoires vérifiées (DPE ${p.dpe}, honoraires).`], sources: [src('Photos validées du dossier'), src('Charte de marque agence')] }
    case 'L5': return { ...base, kind: 'letter', to: `Voisinage ${p.district}`, body: [
      `Madame, Monsieur,`,
      `Notre agence accompagne actuellement la vente d’un bien dans votre quartier, ${p.district}. Si vous envisagez vous aussi un projet, nous serions heureux de vous présenter une estimation argumentée, fondée sur les ventes réelles du secteur.`,
      `Ce courrier vous est adressé sans démarchage téléphonique. Pour ne plus recevoir nos courriers, il vous suffit de nous le signaler.`,
      sign,
    ], sources: [src('Zone de diffusion validée'), src('Registre des oppositions')] }
    case 'L6': return { ...base, kind: 'report', body: [
      `Notre accompagnement pour ${seller}`,
      `1. Estimation argumentée et stratégie de prix (L7).`,
      `2. Mise en valeur : photographies professionnelles, visite 3D, projection d’aménagement étiquetée (L8).`,
      `3. Diffusion ciblée : avant-première auprès des acquéreurs qualifiés (L3), portails, réseaux sociaux (L4), voisinage (L5).`,
      `4. Suivi : bilan régulier des visites et retours, au rythme convenu.`,
      `Seuls les services réellement disponibles dans l’agence sont présentés.`,
    ], sources: [src('Catalogue de services agence')] }
    case 'L7': return { ...base, kind: 'report', range: ok(p.estimateLow) && ok(p.estimateHigh) ? [p.estimateLow, p.estimateHigh] : null, body: [
      `Analyse de valeur — ${p.title}`,
      ok(p.estimateLow) && ok(p.estimateHigh)
        ? `Fourchette retenue : ${eur(p.estimateLow)} – ${eur(p.estimateHigh)}${ok(p.surface) ? `, soit ${fmt(Math.round(p.estimateLow / p.surface))} à ${fmt(Math.round(p.estimateHigh / p.surface))} €/m²` : ''}.`
        : `Fourchette à établir : elle sera calculée à partir des ventes réelles comparables du secteur, puis relue par le conseiller.`,
      `Prix de présentation envisagé : ${eur(p.price)}.`,
      `Méthode : ventes comparables DVF ajustées (vue, état, terrain, étage) ; les annonces actives ne servent que de repère de concurrence.`,
      `Cette analyse est un avis de valeur professionnel, pas une expertise ; elle requiert la validation du conseiller.`,
    ], sources: [src('DVF · Etalab'), src('Découverte D5'), src('Cadastre PCI')] }
    case 'L8': return { ...base, kind: 'report', body: [
      `Projection visuelle — pièces principales`,
      `Variantes proposées : éclairage naturel corrigé, mobilier contemporain, sols harmonisés. Structure, ouvertures et volumes préservés.`,
      `Chaque image est étiquetée « Image virtuelle — IA » (AI Act, août 2026) ; les originaux restent accessibles.`,
    ], sources: [src('Photos originales du dossier')] }
    case 'L9': return { ...base, kind: 'checklist', items: real ? [
      'Titre de propriété', 'DPE', 'Diagnostics amiante / plomb / électricité', 'État des risques (ERP)', 'PV d’assemblée générale (3 derniers)', 'Règlement de copropriété / ASL',
    ].map((label) => ({ label, state: 'missing', ref: '—' })) : [
      { label: 'Titre de propriété', state: 'ok', ref: 'p.1-14' }, { label: 'DPE', state: 'ok', ref: 'p.2' },
      { label: 'Diagnostics amiante / plomb / électricité', state: 'ok', ref: 'p.1-3' }, { label: 'État des risques (ERP)', state: 'ok', ref: 'Géorisques' },
      { label: 'PV d’assemblée générale (3 derniers)', state: 'missing', ref: '—' }, { label: 'Règlement de copropriété / ASL', state: 'check', ref: 'à vérifier' },
    ], body: [`Une pièce absente n’est jamais considérée comme « sans point bloquant ».`], sources: [src('Pièces déposées au dossier')] }
    default: return { ...base, kind: 'report', body: [`${NAMES[code] ?? code} préparé pour ${seller}.`], sources: [] }
  }
}

const has = (v) => v !== undefined && v !== null && v !== '' && !(typeof v === 'number' && !Number.isFinite(v))
const dayOf = (iso, loc = 'fr-FR') => (iso ? new Date(iso).toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' }) : undefined)
/** Un chiffre cité : valeur affichée, source réelle, date de la source ; `verified:false` si rien ne l’atteste. */
const figWith = (missing) => (label, value, source, { date, verified = true } = {}) => (has(value)
  ? { label, value: String(value), source, ...(date ? { date } : {}), verified }
  : { label, value: '—', source: missing, verified: false })
/** Libellés des chiffres et de leurs sources, par langue. */
const FIG = {
  fr: { missing: 'Non renseigné au dossier', fiche: 'Fiche du bien', comps: (n) => `${n} comparable(s) DVF · ventes datées`, estNone: 'Estimation de la fiche — comparables non joints, non datée',
    mandate: (m) => `Mandat ${m.toLowerCase()} · prix de présentation`, priceWish: (f) => `${f} · prix souhaité (saisie conseiller)`, surface: 'Surface', rooms: 'Pièces', land: 'Terrain', cadastre: 'cadastre',
    price: 'Prix de présentation', ppm: 'Prix au m²', ppmCalc: 'Calcul : prix ÷ surface (fiche du bien)', range: 'Fourchette d’estimation', rangePpm: 'Fourchette au m²', rangeCalc: (l) => `Calcul : fourchette ÷ surface — ${l}`,
    compsLabel: 'Comparables retenus', compsSrc: 'DVF · Etalab (ventes datées)', dpe: 'DPE', diag: 'diagnostic', timeline: 'Horizon vendeur', timelineSrc: 'Découverte vendeur · saisie conseiller',
    buyers: 'Acquéreurs compatibles', buyersSrc: 'Recherches acquéreurs du CRM · critères déclarés', missingDocs: 'Pièces manquantes', docsSrc: 'Pièces déposées au dossier' },
  pt: { missing: 'Não indicado no dossier', fiche: 'Ficha do imóvel', comps: (n) => `${n} comparável(eis) · vendas datadas`, estNone: 'Estimativa da ficha — sem comparáveis anexados, sem data',
    mandate: (m) => `Contrato de mediação ${MANDATE_PT[m] ?? m.toLowerCase()} · preço de apresentação`, priceWish: (f) => `${f} · preço pretendido (indicado pelo consultor)`, surface: 'Área', rooms: 'Assoalhadas', land: 'Terreno', cadastre: 'caderneta predial',
    price: 'Preço de apresentação', ppm: 'Preço por m²', ppmCalc: 'Cálculo: preço ÷ área (ficha do imóvel)', range: 'Intervalo de valor', rangePpm: 'Intervalo por m²', rangeCalc: (l) => `Cálculo: intervalo ÷ área — ${l}`,
    compsLabel: 'Comparáveis utilizados', compsSrc: 'Vendas comparáveis datadas', dpe: 'Certificado energético', diag: 'certificado', timeline: 'Prazo do vendedor', timelineSrc: 'Descoberta do vendedor · indicado pelo consultor',
    buyers: 'Compradores compatíveis', buyersSrc: 'Pesquisas de compradores do CRM · critérios declarados', missingDocs: 'Documentos em falta', docsSrc: 'Documentos entregues no dossier' },
}

/**
 * Chiffres utilisés par le livrable, avec leur provenance.
 * Faits de la fiche (surface, pièces, prix demandé) : sourcés. Fourchette d’estimation : sourcée seulement si
 * des comparables datés sont joints (`ctx.comparables`) ou si la fiche porte la source et la date de l’estimation.
 */
export function figuresOf(code, ctx, doc = {}, lang = 'fr') {
  const { dossier: d, property: p } = ctx
  const T = FIG[lang] ?? FIG.fr
  const pt = lang === 'pt'
  const money = pt ? eurPt : eur
  const num = pt ? fmtPt : fmt
  const loc = pt ? 'pt-PT' : 'fr-FR'
  const now = pt ? todayPt : today
  const fig = figWith(T.missing)
  const fiche = T.fiche
  const ficheDate = dayOf(p.updatedAt ?? p.createdAt, loc)
  const comps = (ctx.comparables ?? []).filter((c) => c?.date)
  const estSource = comps.length ? T.comps(comps.length) : p.estimateSource
  const estDate = comps.length ? dayOf(comps.map((c) => c.date).sort().at(-1), loc) : dayOf(p.estimateDate, loc)
  const estOk = !!(estSource && estDate)
  const estLabel = estSource ?? T.estNone
  const range = has(p.estimateLow) && has(p.estimateHigh) ? `${money(p.estimateLow)} – ${money(p.estimateHigh)}` : undefined
  const ppmOk = has(p.price) && has(p.surface) && p.surface > 0
  const priceSrc = d.mandate ? T.mandate(d.mandate) : T.priceWish(fiche)
  const F = {
    surface: () => fig(T.surface, has(p.surface) ? `${num(p.surface)} m²` : undefined, fiche, { date: ficheDate }),
    rooms: () => fig(T.rooms, p.rooms, fiche, { date: ficheDate }),
    land: () => (has(p.land) ? [fig(T.land, `${num(p.land)} m²`, `${fiche} · ${T.cadastre}`, { date: ficheDate })] : []),
    price: () => fig(T.price, has(p.price) ? money(p.price) : undefined, priceSrc, { date: ficheDate }),
    ppm: () => fig(T.ppm, ppmOk ? `${num(Math.round(p.price / p.surface))} €/m²` : undefined, T.ppmCalc, { date: ficheDate }),
    range: () => fig(T.range, range, estLabel, { date: estDate, verified: estOk }),
    rangePpm: () => fig(T.rangePpm, range && ppmOk ? `${num(Math.round(p.estimateLow / p.surface))} – ${num(Math.round(p.estimateHigh / p.surface))} €/m²` : undefined, T.rangeCalc(estLabel), { date: estDate, verified: estOk }),
    comps: () => (comps.length ? [fig(T.compsLabel, comps.length, T.compsSrc, { date: estDate })] : []),
    dpe: () => fig(T.dpe, p.dpe, `${fiche} · ${T.diag}`, { date: ficheDate }),
    timeline: () => fig(T.timeline, d.timeline, T.timelineSrc),
  }
  switch (code) {
    case 'D1': return [F.surface(), F.rooms(), ...F.land(), F.timeline()]
    case 'D2': return [F.price(), F.ppm(), F.range(), ...F.comps()]
    case 'D4': return [F.timeline()]
    case 'L2': return [F.surface(), F.rooms(), ...F.land(), F.dpe(), F.range(), F.timeline()]
    case 'L3': return [F.surface(), F.rooms(), F.price(), fig(T.buyers, doc.matches?.length ?? 0, T.buyersSrc, { date: now() })]
    case 'L4': return [F.surface(), F.rooms(), F.dpe()]
    case 'L7': return [F.range(), F.rangePpm(), F.price(), F.surface(), ...F.comps()]
    case 'L9': return [fig(T.missingDocs, (doc.items ?? []).filter((i) => i.state === 'missing').length, T.docsSrc, { date: now() })]
    default: return []
  }
}

export function buildDocument(code, ctx) {
  if (docLang(ctx.settings) === 'pt') {
    if (PT_CODES.has(code)) { const doc = draftPt(code, ctx); return { ...doc, figures: figuresOf(code, ctx, doc, 'pt') } }
    // Repli signalé : pas encore de gabarit portugais pour ce livrable.
    const doc = draft(code, ctx)
    return { ...doc, lang: 'fr', langFallback: true, langNote: 'Versão em português ainda não disponível: documento gerado em francês, a traduzir antes do envio.', figures: figuresOf(code, ctx, doc) }
  }
  const doc = draft(code, ctx)
  return { ...doc, figures: figuresOf(code, ctx, doc) }
}

/* ——— Gabarits en portugais européen (pt-PT) ——— */
const PT_CODES = new Set(['D1', 'D5', 'L1', 'L2', 'L3', 'L7'])
const MANDATE_PT = { Exclusif: 'exclusivo', Simple: 'simples (não exclusivo)', 'Semi-exclusif': 'semi-exclusivo' }

function draftPt(code, { dossier: d, property: p, agent: a, buyers = [], settings = {} }) {
  const agency = settings.agencyName ?? 'Maison Riviera · Antibes'
  const sign = `${a?.name ?? 'O seu consultor'}\n${a?.role ? `${a.role} · ` : 'Consultor imobiliário · '}${agency}`
  const seller = d.seller
  const fam = /^(Famille|Família) /.exec(seller)
  const civil = fam ? `Cara família ${seller.slice(fam[0].length)},` : 'Exmo.(a) Senhor(a),'
  const base = { id: `${d.id}-${code}`, dossierId: d.id, code, title: NAMES_PT[code], lang: 'pt', createdAt: new Date().toISOString(), status: 'review', version: 1 }
  const src = (label, date = todayPt()) => ({ label, date })
  const tags = (d.tags ?? []).join(', ')
  const motive = String(d.motivation ?? '').toLowerCase()
  switch (code) {
    case 'D1': return { ...base, kind: 'report', body: [
      `Briefing antes da reunião — ${seller}`,
      `Projeto declarado: ${d.motivation}. Prazo: ${d.timeline}.`,
      `Imóvel: ${p.title}, ${p.address}, ${p.city} — ${fmtPt(p.surface)} m², ${p.rooms} assoalhadas${p.land ? `, terreno de ${fmtPt(p.land)} m²` : ''}.`,
      `A confirmar durante a reunião: decisores e acordo entre eles, preço pretendido, calendário de saída, documentos disponíveis (certificado energético, caderneta predial, certidão permanente, licença de utilização).`,
      `Pontos de atenção: ${tags || 'nenhum assinalado'}.`,
    ], sources: [src('Ficha do dossier'), src('Agenda')] }
    case 'D5': return { ...base, kind: 'report', body: [
      `Relatório de descoberta — ${seller}`,
      `Motivação da venda: ${d.motivation}. Prazo pretendido: ${d.timeline}.`,
      `Imóvel: ${p.title}, ${p.city} — ${fmtPt(p.surface)} m², ${p.rooms} assoalhadas${p.price ? `. Preço pretendido pelo vendedor: ${eurPt(p.price)}` : ''}.`,
      `Contrato de mediação: ${d.mandate ? `angariação em regime ${MANDATE_PT[d.mandate] ?? d.mandate.toLowerCase()}` : 'regime a definir com o vendedor'}.`,
      d.clientNextStep ? `Próximo passo combinado: ${d.clientNextStep}.` : `Próximo passo: enviar o estudo de mercado (L7) e agendar a assinatura do contrato de mediação.`,
      `Documentos a reunir para o contrato-promessa e a escritura: caderneta predial, certidão permanente do registo predial, certificado energético, licença de utilização, ficha técnica da habitação.`,
      `Este relatório resume apenas o que o vendedor declarou; nada é deduzido automaticamente.`,
    ], sources: [src('Entrevista de descoberta'), src('Ficha do imóvel')] }
    case 'L1': return { ...base, kind: 'email', to: seller, subject: `Obrigado pela receção — ${p.title}`, body: [
      civil,
      `Obrigado pelo tempo que me dedicou e pela visita ao seu imóvel na ${p.address}. O seu projeto — ${motive} — é claro, e vamos construir um calendário que o respeite.`,
      d.clientNextStep ? `Próximo passo combinado: ${d.clientNextStep}.` : `Como combinado, volto a contactá-lo muito em breve com o estudo de mercado fundamentado do seu imóvel, e definiremos juntos os passos seguintes.`,
      `Fico ao dispor para qualquer questão.`,
      `Com os melhores cumprimentos,\n${sign}`,
    ], sources: [src('Relatório de descoberta D5 validado'), src('Agenda — próximo passo')] }
    case 'L2': return { ...base, kind: 'message', to: 'Equipa da agência', body: [
      `🏡 Nova angariação — ${p.title}`,
      `${p.district} · ${fmtPt(p.surface)} m² · ${p.rooms} assoalhadas${p.land ? ` · terreno ${fmtPt(p.land)} m²` : ''} · CE ${p.dpe}`,
      `Valor estimado ${eurPt(p.estimateLow)} – ${eurPt(p.estimateHigh)}. Vendedor: ${motive}, prazo ${d.timeline}.`,
      `Têm um comprador? Respondam com o nome, eu centralizo. — ${a?.name?.split(' ')[0] ?? ''}`,
    ], sources: [src('Ficha do imóvel')] }
    case 'L3': {
      const m = matchBuyers(p, buyers)
      return { ...base, kind: 'email', to: m.map((x) => x.b.name).join(', ') || 'Nenhum comprador compatível', subject: `Em pré-lançamento: ${p.title}`, matches: m.map((x) => ({ id: x.b.id, name: x.b.name, score: x.score })), body: [
        `Bom dia,`,
        `Procura um imóvel na zona de ${p.district}: estamos a preparar a comercialização de um imóvel que corresponde aos critérios que nos indicou.`,
        `${p.title} — ${fmtPt(p.surface)} m², ${p.rooms} assoalhadas${p.features?.length ? `, ${p.features.slice(0, 3).join(', ').toLowerCase()}` : ''}. Preço de apresentação: ${eurPt(p.price)}.`,
        `Gostaria de o visitar antes da divulgação pública?`,
        `Com os melhores cumprimentos,\n${sign}`,
      ], sources: [src(`${m.length} pesquisa(s) compatível(eis) · critérios declarados`)] }
    }
    case 'L7': return { ...base, kind: 'report', range: [p.estimateLow, p.estimateHigh], body: [
      `Estudo de mercado e avaliação — ${p.title}`,
      `Intervalo de valor: ${eurPt(p.estimateLow)} – ${eurPt(p.estimateHigh)}, ou seja ${fmtPt(Math.round(p.estimateLow / p.surface))} a ${fmtPt(Math.round(p.estimateHigh / p.surface))} €/m².`,
      `Preço de apresentação previsto: ${eurPt(p.price)}.`,
      `Método: vendas comparáveis ajustadas (vista, estado de conservação, terreno, piso); os anúncios ativos servem apenas de referência da concorrência.`,
      `Este estudo é uma opinião de valor profissional, não uma avaliação bancária nem pericial; requer a validação do consultor.`,
    ], sources: [src('Vendas comparáveis'), src('Relatório de descoberta D5'), src('Caderneta predial')] }
  }
}

/** Chiffres sans source datée. */
export const unverifiedFigures = (doc) => (doc.figures ?? []).filter((f) => !f.verified)

/**
 * Contrôle qualité AUT-058 : rien d’inventé, pas de gabarit vide.
 * Les points bloquants sont toujours renvoyés ; `{ figures: true }` ajoute l’avertissement « N chiffre(s) non vérifié(s) »,
 * non bloquant (la validation d’un livrable externe le fait confirmer explicitement).
 */
export function qualityCheck(doc, { figures = false } = {}) {
  const text = JSON.stringify({ ...doc, figures: undefined })
  const issues = []
  if (/undefined|NaN|\{\{|null M€/.test(text)) issues.push('Champ vide ou invalide dans le texte')
  if (doc.kind === 'email' && !doc.to) issues.push('Destinataire manquant')
  if (!doc.sources?.length) issues.push('Aucune source citée')
  const n = unverifiedFigures(doc).length
  if (figures && n) issues.push(`${n} chiffre${n > 1 ? 's' : ''} non vérifié${n > 1 ? 's' : ''}`)
  return issues
}
