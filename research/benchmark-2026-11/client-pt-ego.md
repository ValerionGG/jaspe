# Verdict client : Francisca, directrice d’une agence de 8 conseillers à Lisbonne (Cascais/Estoril, biens 800 k€–3 M€), cliente eGO depuis 6 ans, paie eGO Pro + Imovirtual, très attentive au BCFT et au reporte IMPIC, langue de travail portugais.

**Achète : non** · prix max 99 €/mois · notes {"utilite": 5, "gainTempsCredible": 3, "conformite": 6, "ux": 4, "prix": 7, "global": 4}

**Bloquants :**
- Brief en portugais : assistant.plan renvoie {"items":[]} (parseur en regex françaises uniquement)
- Interface et livrables en français, pas de pt-PT
- « Fonds venant d'Angola » ne déclenche aucun contrôle BCFT : la détection repose sur des mots-clés exacts
- Offre et échéance (1,65 M€ avant vendredi) non détectées dans le brief
- Timelog : spent=0 et corrections=0, le « gain net » est un forfait et non une mesure
- Ni authentification ni multi-utilisateur : inutilisable pour une agence de 8
- Pas d'import eGO
- Pas d'anexo B IMPIC ni d'export de contrôle BCFT horodaté
- Aucun envoi réel, aucune donnée de marché réelle pour Cascais

# Verdict de Francisca : agence de 8 conseillers, Cascais/Estoril, cliente eGO Pro depuis 6 ans

Je n'ai pas évalué une plaquette, j'ai testé votre produit. J'ai lu le README et parcouru `Conformite.tsx` et `server/assist.js`. J'ai aussi envoyé deux briefs à `assistant.plan` et lu `/api/timelog`. Voici ce que j'en retiens.

## Le test qui m'a refroidie

J'ai dicté un brief comme je le fais tous les jours, en portugais : « Visita hoje com o casal Almeida em Cascais, moradia T4 de 1,8 milhões. Querem fazer proposta de 1,65 M até sexta. Pagamento parcial com fundos vindos de Angola. Enviar resumo ao vendedor amanhã e lembrar o CPCV. »

L'API a répondu `{"items":[]}`. Il n'y avait rien : aucune relance, aucune alerte BCFT, aucun brouillon. Votre fonction phare ne comprend pas la langue de travail de mon agence.

J'ai recommencé avec le même texte en français. Le plan contenait trois actions : organiser la visite, relancer le notaire, préparer le mail de remerciement (L1). En revanche :
- « Fonds venant d'Angola » n'a déclenché **aucun** contrôle de conformité. Le parseur ne réagit qu'aux mots exacts « origine des fonds », « LCB », « KYC ». Or, pour moi, des fonds venus d'Angola sur une villa à 1,8 M€, c'est précisément l'alerte BCFT n° 1.
- L'offre à 1,65 M€ avant vendredi est passée inaperçue. Elle n'a produit ni échéance ni tâche « offre ».

Ce ne sont pas des détails. C'est le cœur de mon métier sur ce segment.

## Ce qui me plaît vraiment

- **La checklist PT de `assist.js` est sérieuse.** Elle cite le contrato de mediação au modèle IMPIC (Lei 15/2013, art. 16.º), les bénéficiaires effectifs, l'origine des fonds (Lei 83/2017, art. 27.º), les PEP et sanctions (art. 39.º) et le reporte trimestral IMPIC. Elle bloque l'étape tant que la preuve manque. eGO ne me donne rien de tel : aujourd'hui je tiens tout cela dans un Excel et un classeur pour l'inspection.
- **Chaque action cite sa phrase source et ne part que cochée.** C'est exactement le niveau de contrôle que j'exige de mes conseillers.
- **Les factures** : la préparation de l'IVA à 23 % envoyée vers un logiciel certifié AT, c'est honnête. Je ne veux pas d'un éditeur qui joue au logiciel de facturation.
- **Le prix public et sans engagement** me change d'eGO et d'Imovirtual.

## Ce qui me fait fuir

1. **Le portugais.** L'interface, le parseur et les livrables sont en français. Mes 8 conseillers ne l'utiliseront pas, point.
2. **Le « temps gagné » n'est pas mesuré.** Dans `/api/timelog`, chaque ligne affiche `spent: 0`, `corrections: 0`, `net = baseline`. Ce sont des forfaits (25 min pour un brief, 30 min pour des comparables), pas une mesure. Votre argument n° 1 et votre « garantie 2 h » reposent donc sur un barème que vous fixez vous-mêmes. Mon associé le verrait en 30 secondes.
3. **Pas de comptes, pas de multi-utilisateur, aucun envoi réel.** Pour une agence, c'est rédhibitoire : je ne peux ni voir le pipeline d'un conseiller, ni retirer un accès quand quelqu'un part.
4. **Aucun import eGO.** Je ne ressaisis pas 6 ans de biens et de contacts.
5. **Pas d'anexo B IMPIC, pas de lien client « origem dos fundos ».** C'est dans la feuille de route en vague 2 ou 3, mais c'est justement ce qui m'aurait fait payer dès demain.
6. **Aucune donnée de marché réelle.** Sur Cascais, sans Casafari ou SIR/Confidencial Imobiliário, une fiche « comparables » est dangereuse devant un vendeur à 2 M€.

## Comparaison avec mon outil actuel

| | eGO Pro (+ Imovirtual) | Jaspe aujourd'hui |
|---|---|---|
| CRM, diffusion, équipe | Complet, multi-utilisateur | Mono-utilisateur, pas d'authentification |
| Portugais | Natif | Absent (le brief PT renvoie un plan vide) |
| BCFT, IMPIC | Rien de structuré | Checklist juste et preuve obligatoire, mais pas d'export ni d'anexo B |
| Compte rendu vendeur | Manuel | Brouillon L1 sourcé, non envoyé |
| Mesure du temps | Aucune | Forfaits présentés comme une mesure |

Jaspe ne remplace pas eGO, et votre stratégie a raison de ne pas le tenter. Mais comme couche « conformité + débrief » à côté d'eGO, il n'est pas encore utilisable au Portugal.

## Ce que je paierais

- **Le prix Solo à 9,90 €** est fait pour un mandataire français, pas pour moi.
- **Pour l'agence**, une fois le produit en portugais, multi-utilisateur, avec import eGO, anexo B IMPIC et export de contrôle BCFT, je paierais **79 à 99 €/mois** pour 8 conseillers, Pack Preuves compris. 49 € + 6 € pour le 8e siège + 6 € d'option, c'est presque trop bas : sur ce segment, un prix aussi bas fait douter du sérieux juridique.
- **Ce qui justifie le prix**, c'est d'éviter une amende IMPIC ou un dossier BCFT incomplet lors d'une inspection, pas les minutes gagnées.
- **Aujourd'hui, en l'état : 0 €.**

## Les 5 changements qui me feraient signer

1. **Le portugais (pt-PT) de bout en bout** : interface, parseur du brief (« lembrar », « proposta », « CPCV », « escritura », « fundos ») et livrables. Il faut un test automatisé avec 20 briefs PT réels.
2. **Une détection BCFT par le sens et non par mots-clés** : pays tiers à risque, paiement partiel en espèces, société écran, PEP. Chaque alerte doit citer l'article de la Lei 83/2017.
3. **Un export de contrôle horodaté et l'anexo B IMPIC prérempli** depuis les affaires closes, avec rappel à J-15. La checklist doit avoir été relue et datée par un juriste portugais nommé.
4. **Des comptes, des rôles (directrice / conseiller) et un import CSV eGO** de biens et contacts en moins de 10 minutes.
5. **Un temps gagné réellement mesuré** (temps d'édition, corrections comptées), ou alors l'écrire honnêtement : « estimation forfaitaire ».

## Ce que je dirais à un confrère

« L'idée est la bonne. C'est le seul outil que j'ai vu qui traite le BCFT et l'IMPIC comme des preuves à produire, et pas comme une case à cocher. Mais aujourd'hui il parle français, il ne gère pas d'équipe et il ne comprend pas un brief en portugais. Il ne voit même pas des fonds venus d'Angola. Garde ton eGO, mets-les dans ta liste et reteste dans six mois. S'ils livrent le portugais, l'anexo B et l'export d'inspection, c'est 80 € par mois bien placés. »