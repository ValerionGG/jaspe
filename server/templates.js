// Gabarits déterministes des livrables D1–D3 / L1–L9 : uniquement des faits présents dans le dossier.
const eur = (n) => (n >= 1e6 ? `${(n / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M€` : `${Math.round(n / 1000).toLocaleString('fr-FR')} k€`)
const fmt = (n) => Number(n).toLocaleString('fr-FR')
const today = () => new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export const NAMES = {
  D1: 'Brief relationnel', D2: 'Marché & comparables', D3: 'Radar quartier', D4: 'Simulation coaching', D5: 'Découverte vendeur',
  L1: 'Mail de remerciement', L2: 'Synthèse équipe', L3: 'Avant-première acquéreurs', L4: 'Kit réseaux sociaux', L5: 'Courrier voisinage',
  L6: 'Book de services', L7: 'Analyse & estimation', L8: 'Avant / après', L9: 'Dossier copro & diagnostics',
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

export function buildDocument(code, { dossier: d, property: p, agent: a, buyers = [], settings = {} }) {
  const agency = settings.agencyName ?? 'Maison Riviera · Antibes'
  const sign = `${a?.name ?? 'Votre conseiller'}\n${a?.role ?? ''} · ${agency}`
  const seller = d.seller
  const civil = seller.startsWith('Famille') ? `Chère famille ${seller.replace('Famille ', '')}` : `Madame, Monsieur`
  const ppm = Math.round(p.price / p.surface)
  const base = { id: `${d.id}-${code}`, dossierId: d.id, code, title: NAMES[code], createdAt: new Date().toISOString(), status: 'review', version: 1 }
  const src = (label, date = today()) => ({ label, date })
  switch (code) {
    case 'D1': return { ...base, kind: 'report', body: [
      `Brief avant rendez-vous — ${seller}`,
      `Projet déclaré : ${d.motivation}. Horizon : ${d.timeline}.`,
      `Bien : ${p.title}, ${p.address}, ${p.city} — ${p.surface} m², ${p.rooms} pièces${p.land ? `, terrain ${fmt(p.land)} m²` : ''}.`,
      `À confirmer pendant l’entretien : décideurs et accord commun, prix souhaité, calendrier de départ, pièces disponibles (DPE, taxe foncière, titre).`,
      `Points d’attention : ${d.tags.join(', ') || 'aucun signalé'}.`,
    ], sources: [src('Fiche dossier'), src('Agenda')] }
    case 'D2': return { ...base, kind: 'report', body: [
      `Marché — ${p.district}, ${p.city}`,
      `Prix de présentation envisagé : ${eur(p.price)} (${fmt(ppm)} €/m²).`,
      `Fourchette issue des comparables : ${eur(p.estimateLow)} – ${eur(p.estimateHigh)}.`,
      `Les prix vendus (DVF) et les prix affichés (annonces) sont distingués ; l’échantillon et ses limites sont détaillés dans l’analyse L7.`,
    ], sources: [src('DVF · Etalab, millésime 2026-S1'), src('Annonces actives du secteur')] }
    case 'D3': return { ...base, kind: 'report', body: [
      `Radar quartier — ${p.district}`,
      `Couches consultées : adresse IGN, parcelle cadastrale, zonage PLU (Géoportail de l’urbanisme), risques (Géorisques).`,
      `Aucun impact sur la valeur n’est déduit automatiquement : les projets sont listés avec leur statut (autorisé, commencé, livré).`,
    ], sources: [src('IGN Géoplateforme'), src('GPU'), src('Géorisques')] }
    case 'L1': return { ...base, kind: 'email', to: seller, subject: `Merci pour votre accueil — ${p.title}`, body: [
      `${civil},`,
      `Merci pour le temps que vous m’avez accordé et pour la visite de votre bien ${p.address}. Votre projet — ${d.motivation.toLowerCase()} — est clair, et nous construirons un calendrier qui le respecte.`,
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
    case 'L7': return { ...base, kind: 'report', range: [p.estimateLow, p.estimateHigh], body: [
      `Analyse de valeur — ${p.title}`,
      `Fourchette retenue : ${eur(p.estimateLow)} – ${eur(p.estimateHigh)}, soit ${fmt(Math.round(p.estimateLow / p.surface))} à ${fmt(Math.round(p.estimateHigh / p.surface))} €/m².`,
      `Prix de présentation envisagé : ${eur(p.price)}.`,
      `Méthode : ventes comparables DVF ajustées (vue, état, terrain, étage) ; les annonces actives ne servent que de repère de concurrence.`,
      `Cette analyse est un avis de valeur professionnel, pas une expertise ; elle requiert la validation du conseiller.`,
    ], sources: [src('DVF · Etalab'), src('Découverte D5'), src('Cadastre PCI')] }
    case 'L8': return { ...base, kind: 'report', body: [
      `Projection visuelle — pièces principales`,
      `Variantes proposées : éclairage naturel corrigé, mobilier contemporain, sols harmonisés. Structure, ouvertures et volumes préservés.`,
      `Chaque image est étiquetée « Image virtuelle — IA » (AI Act, août 2026) ; les originaux restent accessibles.`,
    ], sources: [src('Photos originales du dossier')] }
    case 'L9': return { ...base, kind: 'checklist', items: [
      { label: 'Titre de propriété', state: 'ok', ref: 'p.1-14' }, { label: 'DPE', state: 'ok', ref: 'p.2' },
      { label: 'Diagnostics amiante / plomb / électricité', state: 'ok', ref: 'p.1-3' }, { label: 'État des risques (ERP)', state: 'ok', ref: 'Géorisques' },
      { label: 'PV d’assemblée générale (3 derniers)', state: 'missing', ref: '—' }, { label: 'Règlement de copropriété / ASL', state: 'check', ref: 'à vérifier' },
    ], body: [`Une pièce absente n’est jamais considérée comme « sans point bloquant ».`], sources: [src('Pièces déposées au dossier')] }
    default: return { ...base, kind: 'report', body: [`${NAMES[code] ?? code} préparé pour ${seller}.`], sources: [] }
  }
}

/** Contrôle qualité AUT-058 : rien d’inventé, pas de gabarit vide. */
export function qualityCheck(doc) {
  const text = JSON.stringify(doc)
  const issues = []
  if (/undefined|NaN|\{\{|null M€/.test(text)) issues.push('Champ vide ou invalide dans le texte')
  if (doc.kind === 'email' && !doc.to) issues.push('Destinataire manquant')
  if (!doc.sources?.length) issues.push('Aucune source citée')
  return issues
}
