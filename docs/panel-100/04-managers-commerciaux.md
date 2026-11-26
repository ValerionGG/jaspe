# Panel 100 — lot 04 : managers et fonctions commerciales (25 personas)

Simulation du 26 novembre 2026, faite à partir de l’état réel du dépôt : `docs/sources/attentes-client.md`, `docs/audit-2026-11/AUDIT.md` (84/100, captures 20 à 26), `app/src/data/plans.ts`, `server/auth.js`, `app/src/landing/Tarifs.tsx`, `README.md`, les pages `Pilotage`, `Taches`, `TempsGagne`, `Conformite`, `Factures`, `Reglages`, `Coaching`, `server/mcp.js` et `docs/juridique/RELECTURE.md`.

## Ce que l’acheteur voit, et ce qu’il ne trouve pas

**Offre affichée.** Découverte à 0 € (1 dossier actif), Solo à 9,90 €/mois ou 99 €/an (8 dossiers actifs), Agence à 49 €/mois pour 7 conseillers puis 6 € par siège. Options : Pack Preuves (+6 €/mois), Données marché (+9 €/mois). Sans Stripe, l’app passe en « Bêta gratuite » : dossiers illimités, 7 conseillers. Garantie « 2 h gagnées ou mois remboursé », traitée à la main.

**Coût réel pour un réseau, selon la grille.** 20 conseillers : 127 €/mois. 50 : 307 €/mois. 200 : 1 207 €/mois. Les options sont facturées par agence.

**Points forts vérifiés.**
- Comptes réels propres depuis l’audit : vraie identité, états vides honnêtes, sources vraies.
- Pièces du dossier générées par pays (FR et PT).
- Conformité FR/PT avec preuves, grille LCB-FT, lien de dépôt client, récapitulatif IMPIC.
- Temps gagné net, corrections déduites.
- Factures (InvoiceXpress au Portugal, Factur-X en France).
- Lecture du compromis ou du CPCV, avec relances J-7.
- Débrief par WhatsApp ; serveur MCP (5 outils de lecture, 4 de préparation qui ne font que proposer).
- Coaching par simulation de vendeur.

**Manques qui pèsent pour ce segment.**
- **Rôles.** Seulement `owner` et `conseiller` (`server/auth.js`). Il n’y a pas de rôle assistante, directeur régional ou lecture seule.
- **Réseau.** En compte réel, Réglages › Agence & réseau affiche « Votre agence n’est rattachée à aucun réseau ». La hiérarchie réseau → agences n’existe qu’en démo.
- **Temps gagné.** La page mesure le compte, pas l’équipe : aucune ventilation par conseiller. Le taux horaire est stocké dans le navigateur (`localStorage`).
- **Coaching.** Les scénarios sont situés à Antibes et en français. Le partage indique « Partagé avec Marc O. » en dur dans l’onglet (le message de confirmation, lui, est corrigé en compte réel).
- **Envois.** SMS, WhatsApp sortant, signature et portails sont consignés, pas envoyés. L’e-mail ne part que si un SMTP est configuré.
- **Portugais.** Le mode complet et une partie des livrables (L4 à L6, L8, L9, D2 à D4) restent en français.
- **Juridique et hébergement.** Pas de relecture par un avocat (213 lignes, 19 incertaines). Hébergeur de production non choisi.
- **Pays.** Pas de Belgique ni de Suisse.
- **Métiers non couverts.** Rien pour l’immobilier neuf (lots, réservations, appels de fonds) ni pour la location saisonnière.
- **eGO.** Import CSV seulement, jamais testé sur un vrai export.

## Les 25 personas

Unité de prix : **€ HT par siège (conseiller ou poste) et par mois**, sauf mention contraire. « Prix » est ce que la personne paierait réellement, pas le prix affiché.

### Managers et directeurs commerciaux (8)

| # | Persona | Ce qui le ferait payer | Ce qui le bloque | Achète ? | Prix | Note |
|---|---|---|---|---|---|---|
| 1 | **Hélène**, directrice commerciale d’un réseau de mandataires FR (Lyon, ~200 conseillers), pragmatique | Comptes rendus vendeur en moins de 24 h partout dans le réseau. Une preuve chiffrée du temps gagné à présenter en convention. | Pas de vue réseau ni de temps gagné par conseiller. Rôles limités à owner/conseiller. Juridique non relu, hébergeur non choisi. Rien pour le pilotage (SSO, facture unique). | À l’essai (pilote de 10 conseillers) | 4 €/conseiller/mois en volume (la grille donnerait 1 207 €/mois) | 58 |
| 2 | **Rui**, diretor comercial d’une franchise PT (Lisbonne, 60 consultores sur eGO), curieux | Débrief vocal par WhatsApp. Pièces PT (caderneta, certidão, licença). Rappels IMPIC. Facture via InvoiceXpress. | Mode complet et livrables L4 à L9 encore en français. Pas de synchro eGO, CSV seulement. « eGO a déjà tout » chez ses consultores. | À l’essai | 5 €/consultor/mois | 62 |
| 3 | **Marc**, directeur d’agence en franchise FR (Aix, 12 conseillers), enthousiaste | 7 €/conseiller contre 50 à 150 € pour un CRM. Coaching pour les nouveaux. Pilotage avec les dossiers bloqués. | Aucun envoi réel de SMS ou de signature. Aucun suivi par conseiller du temps gagné, alors qu’il veut récompenser ceux qui adoptent l’outil. | Oui | 79 €/mois pour l’agence (49 € + 5 × 6 €), soit 6,6 €/conseiller | 74 |
| 4 | **Sofia**, team leader d’une équipe de 25 agents à Porto, orientée chiffres | Prix par siège très bas. Lecture du CPCV avec les échéances. Débrief WhatsApp. | Ne peut pas voir qui utilise l’outil ni combien chacun gagne. Coaching en français. | Oui | 157 €/mois (grille), soit 6,3 €/agent | 70 |
| 5 | **Bertrand**, directeur d’un réseau à Bruxelles (40 agents), sceptique | Rien de décisif, en dehors des comptes rendus. | Aucun référentiel belge (PEB, attestation de sol, renseignements urbanistiques). Pas de néerlandais. « Votre conformité ne vaut rien chez moi. » | Non | 0 € | 35 |
| 6 | **Nathalie**, directrice commerciale d’une agence de courtage à Genève (15 courtiers) | La rédaction des livrables. | Suisse non couverte : droit, LPD, hébergement non confirmé, facturation en CHF. | Non | 0 € | 38 |
| 7 | **Joaquim**, director regional d’une rede PT (120 consultores), très sceptique | Il ne paierait qu’une couche IA branchée sur eGO, sans double saisie. | Aucun connecteur eGO. Gain non prouvé sur de vrais dossiers. « Dans le formulaire, ils ne saisiront rien deux fois. » | Non (pour l’instant) | Plafond annoncé : 3 €/consultor/mois | 45 |
| 8 | **Claire-Anne**, directrice commerciale d’une franchise FR (80 conseillers), marquée par un contrôle DGCCRF/Tracfin | Pack Preuves : grille LCB-FT, export de contrôle horodaté, dépôt client avec empreinte. | Elle n’engage pas sa responsabilité sur une checklist qu’aucun avocat n’a relue. Pas de consolidation des preuves au niveau du réseau. | À l’essai | 5 €/conseiller/mois, plus les Preuves en forfait réseau (~150 €/mois) | 64 |

### Assistantes et coordinatrices de transaction (6)

| # | Persona | Ce qui la ferait payer | Ce qui la bloque | Achète ? | Prix | Note |
|---|---|---|---|---|---|---|
| 9 | **Laëtitia**, assistante de transaction FR (Nantes, agence de 9 conseillers), enthousiaste | Pièces DDT selon l’année du bien. Lecture du compromis avec relances J-7. Liste des pièces jusqu’à l’acte. | Pas de rôle « assistante » : elle serait owner ou conseillère. Pas de vue « mes dossiers à coordonner, toutes échéances ». | Oui (convainc son patron) | 61 €/mois pour l’agence (49 € + 2 × 6 €) | 72 |
| 10 | **Inês**, coordenadora processual à Lisbonne (préparation de l’escritura) | Liste PT : certidão permanente, licença de utilização, ficha técnica, IMI, não dívida ao condomínio. | L9 (dossier de vente) en français. Rien vers le notaire ni Casa Pronta. Échéance IMPIC « a confirmar ». | À l’essai | 10 €/poste/mois | 66 |
| 11 | **Sandrine**, secrétaire d’agence à Liège | — | Référentiel belge absent. Elle ne voit pas l’intérêt d’une checklist française. | Non | 0 € | 30 |
| 12 | **Patrícia**, assistente comercial en Algarve (clientèle étrangère) | Interface FR et PT pour les acheteurs francophones. Factures IVA. | Traduction partielle. Régime d’IVA « a confirmar ». Pas d’anglais. | À l’essai | 8 €/poste/mois | 60 |
| 13 | **Myriam**, coordinatrice transactions d’une franchise FR (30 dossiers en cours) | Brouillons de facture de commission. Dossier de vente rassemblé. File de validations. | Le plafond Solo de 8 dossiers actifs l’oblige à prendre Agence. Pas d’envoi pour signature. Pas de dossier notaire exportable d’un clic. | Oui | 15 €/poste/mois | 70 |
| 14 | **Corinne**, assistante à Lausanne, sceptique | — | Suisse non couverte. « Encore un outil à remplir. » | Non | 0 € | 34 |

### Commerciaux en immobilier neuf ou en location saisonnière (5)

| # | Persona | Ce qui le ferait payer | Ce qui le bloque | Achète ? | Prix | Note |
|---|---|---|---|---|---|---|
| 15 | **Thomas**, commercial chez un promoteur VEFA (Bordeaux) | Les relances des acquéreurs. | Parcours pensé pour un vendeur dans l’ancien : pas de lots, de grille de prix, de contrat de réservation ni d’appels de fonds. | Non | 0 € | 28 |
| 16 | **Ana**, comercial en empreendimentos novos (Porto) | Messages de suivi en PT. | Même vide sur le neuf. Pas de lien avec le logiciel du promoteur. | Non | 0 € | 30 |
| 17 | **Julien**, gestionnaire en location saisonnière sur la Côte d’Azur | — | Aucun module location : calendrier, Airbnb/Booking, ménage, taxe de séjour. | Non | 0 € | 22 |
| 18 | **Beatriz**, agente qui vend des biens en alojamento local (Algarve) | Estimation, compte rendu vendeur, pièces PT. | Aucune pièce propre à l’AL (registo AL, transmissibilité). Comparables PT vides sans Casafari. | À l’essai | 9,90 €/mois (Solo) | 48 |
| 19 | **Kevin**, commercial dans le neuf à Lille, fan d’IA | Le serveur MCP pour piloter ses relances depuis Claude. | Hors cœur de métier. Il l’utiliserait seulement pour le suivi acquéreur. | À l’essai | 9,90 €/mois (Solo) | 46 |

### Chasseurs immobiliers et home stagers (3)

| # | Persona | Ce qui le ferait payer | Ce qui le bloque | Achète ? | Prix | Note |
|---|---|---|---|---|---|---|
| 20 | **Élodie**, chasseuse immobilière à Paris (côté acquéreur) | Préparation des RDV acquéreur, sélection de biens, offre résumée. | Le dossier type est un dossier vendeur. Pas de mandat de recherche ni de suivi des honoraires acquéreur. | À l’essai | 9,90 €/mois (Solo) | 52 |
| 21 | **Pedro**, personal shopper imobiliário à Lisbonne pour expatriés français | Seul outil FR et PT à comprendre les pièces portugaises. Comptes rendus en français pour ses clients. | Mêmes limites côté acquéreur. Pas d’anglais. | Oui | 9,90 €/mois (Solo) | 65 |
| 22 | **Valérie**, home stager à Bruxelles | Elle cherchait un outil photo avant/après (le Studio existe, mais il est noyé dans un CRM). | Pas son métier, et la Belgique n’est pas couverte. | Non | 0 € | 25 |

### Conseillers débutants, moins d’un an (3)

| # | Persona | Ce qui le ferait payer | Ce qui le bloque | Achète ? | Prix | Note |
|---|---|---|---|---|---|---|
| 23 | **Lucas**, mandataire depuis 4 mois (Montpellier) | Brief avant RDV (questions à poser). Coaching « exclusivité ». Checklist légale qui le rassure. | Peur que l’IA écrive une erreur juridique en son nom. Il veut la garantie « 2 h » automatisée, pas « à la main ». | Oui | 9,90 €/mois (Solo) | 76 |
| 24 | **Mariana**, consultora júnior depuis 7 mois (Braga) | Débrief WhatsApp. Questions IMI et condomínio. Compte rendu en pt-PT. | Coaching en français, scénarios à Antibes. Mode complet en français. | Oui (annuel) | 99 €/an, soit 8,25 €/mois | 71 |
| 25 | **Chloé**, débutante depuis 3 mois à Genève, sceptique | Le brief de préparation. | Suisse non couverte. Elle reste sur Découverte tant que son réseau ne paie pas. | À l’essai | 5 €/mois au plus | 44 |

## Synthèse

| Indicateur | Valeur |
|---|---|
| Achat ferme | **7 / 25 = 28 %** |
| Achat ferme ou à l’essai | **16 / 25 = 64 %** |
| Refus | 9 / 25 (dont 6 hors périmètre : BE/CH, neuf, saisonnier, home staging) |
| Prix médian (16 acheteurs ou testeurs) | **≈ 8,10 € par siège et par mois** |
| Prix médian des seuls managers acheteurs ou testeurs (5) | **5 € par conseiller et par mois** (4 à 6,6 €) : en dessous des 6 € par siège affichés au-delà de 7 |
| Note moyenne | **51,4 / 100** (managers 55,8 ; assistantes 55,3 ; neuf et saisonnier 34,8 ; chasseurs et stagers 47,3 ; débutants 63,7) |

Lecture honnête : le produit plaît d’abord **à celui qui l’utilise** (débutants, assistantes FR et PT, petite agence). Celui qui signe pour 50 à 200 sièges teste, mais n’achète pas. Il n’a aucun moyen de **voir et prouver** l’usage et le gain par conseiller, et il ne peut pas engager le réseau sur un juridique non relu.

### Top 5 des objections

1. **« Je ne vois rien de mon équipe. »** Temps gagné, comptes rendus de moins de 24 h et corrections ne sont pas ventilés par conseiller. La hiérarchie réseau n’existe qu’en démo. Rôles limités à owner/conseiller. Citée par 7 des 8 managers et par 4 assistantes.
2. **« Votre légal n’est relu par personne, et vous ne savez pas où sont mes données. »** 213 lignes à relire, 19 incertaines ; hébergeur de production non choisi. Bloquant pour toute direction de réseau ou de franchise.
3. **« Mes gens vivent dans eGO / Hektor : pas de double saisie. »** L’import est en CSV seulement, jamais testé sur un vrai export ; aucune synchro.
4. **« Ça prépare mais n’envoie pas. »** SMS, WhatsApp sortant et signature sont consignés seulement ; l’e-mail dépend du SMTP.
5. **« Pas pour mon pays ou mon métier. »** Belgique et Suisse absentes. Portugais incomplet (mode complet, L4 à L9, coaching). Neuf, location saisonnière et chasse côté acquéreur non couverts.

### Top 5 des choses à corriger ou ajouter (par impact sur la vente)

| # | Correction | Moment du PDF ou retour de Christophe | Impact |
|---|---|---|---|
| 1 | **Tableau « Temps gagné équipe »** : par conseiller, gain net, comptes rendus de moins de 24 h, taux de corrections, adoption hebdomadaire. Export CSV et PDF pour la réunion du lundi. Taux horaire enregistré côté agence, plus dans le navigateur. | Christophe : « n’arrivent pas à le mesurer » ; il choisirait Jaspe « une fois le gain mesuré sur de vrais dossiers ». Moment « À la sortie : dicter le débrief ». | Débloque les managers 1, 2, 7 et 8 (~460 sièges). |
| 2 | **Rôles et réseau réels** : responsable réseau → agences, rôle *assistante de transaction* (tous les dossiers de l’agence, pièces et échéances, sans les commissions), lecture seule. Facture unique pour le réseau et grille dégressive au-delà de 50 sièges (4 à 5 €). | Moment « Du compromis à l’acte : coordonne les parties, fait valider les pièces » ; cible « suivi qui se perd entre collègues ». | Convertit les assistantes en prescriptrices et rend les réseaux achetables. |
| 3 | **Relecture par un avocat FR et PT** de `RELECTURE.md`, et **choix d’un hébergeur UE** avec un DPA signable affiché sur /tarifs. | Christophe : « le légal est à créer entièrement : grosse préoccupation ». | Condition d’entrée pour toute franchise ; donne de la valeur au Pack Preuves. |
| 4 | **Branchement eGO** (API ou synchro planifiée), testé sur un vrai export d’agence. Portugais complet : mode complet, L4 à L9, scénarios de coaching portugais. | Christophe : « un assistant IA qui se connecte à ta base » ; benchmark eGO. | Lève l’objection « eGO a tout » du marché PT (managers 2 et 7, personas 10, 12 et 24). |
| 5 | **Relances réellement envoyées** depuis la file validée (e-mail en production, modèles WhatsApp approuvés), avec l’accusé visible dans le dossier. | Moment « Entre deux échanges : relancer » ; fil rouge « je rappelle le vendeur vendredi après le diagnostic ». | Fait passer le produit de « prépare » à « fait gagner du temps », et rend la garantie « 2 h » crédible. |

À noter, plus loin dans la liste : le libellé « Partagé avec Marc O. » est encore en dur dans l’onglet Coaching en compte réel. C’est un petit résidu de démo, mais il ruine la confiance d’un manager en démo.

### 3 phrases d’argumentaire pour un acheteur qui équipe une équipe

1. « Votre CRM fait tourner l’agence ; Jaspe rend à chaque conseiller le temps perdu après chaque rendez-vous vendeur. Compte rendu prêt à valider en moins de 24 h, et le gain mesuré chaque semaine, corrections déduites. »
2. « Pour le prix d’un café par conseiller et par mois (7 € pour une équipe de 7), sans engagement : si un mois payé affiche moins de 2 h gagnées, il est remboursé. »
3. « Rien ne part sans validation du conseiller, et chaque chiffre cite sa source. Chaque dossier porte sa checklist légale FR ou PT avec preuves horodatées : vous savez ce qui a été vérifié, par qui et quand. »

Mise en garde : la phrase 1 ne tiendra face à un directeur de réseau que lorsque la correction n° 1 (temps gagné par conseiller) existera. Aujourd’hui, il demandera « montrez-moi mon équipe », et l’écran ne le permet pas.
