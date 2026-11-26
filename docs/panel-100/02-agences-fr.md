# Panel 100 — Segment 2 : agences immobilières en France (25 personas)

Simulation du 26 novembre 2026, sur l’état réel de Jaspe après l’audit du même jour (84/100, captures 20 à 26).

**Ce que les personas ont vu :**
- l’app en mode comptes ;
- la page `/tarifs` (Découverte 0 €, Solo 9,90 €, Agence 49 € jusqu’à 7 conseillers puis 6 € le siège, options Preuves +6 € et Données marché +9 €) ;
- la page d’accueil.

**Ce qu’ils ont constaté eux-mêmes :**
- **Trois grilles de prix différentes.**
  - `/tarifs` : 49 € par agence.
  - Accueil (`Closing.tsx`) : « Overlay 49 € / siège », Agence 249 €, Réseau 990 €.
  - `/essentiel` : 49 € par siège.
- **Des promesses d’intégration plus larges que le produit.**
  - Promis : « Synchronisation CRM existant » et « se branche sur Apimo, Hektor, Modelo » ; bandeau de logos Yousign, DocuSign, SeLoger, Leboncoin.
  - Réel : un import CSV, avec des colonnes Hektor devinées et pas encore confirmées sur un vrai export. Rien pour Apimo, AC3, Netty ou Immo-facile. Les envois sont consignés tant que le SMTP n’est pas configuré.
- **Une conformité FR utile mais pas encore relue par un avocat.**
  - Elle couvre Hoguet, LCB-FT, DPE, ERP et DDT selon l’année.
  - `docs/juridique/RELECTURE.md` compte 213 lignes, dont 19 marquées incertaines.
- **Un hébergement de production pas encore choisi**, alors que le site promet l’Europe.

Comparaisons systématiques avec :
- leur logiciel actuel (Hektor, Apimo, AC3, Netty, Immo-facile, ou l’outil imposé par la tête de réseau) ;
- ChatGPT (gratuit ou Plus, environ 23 € TTC par mois).

---

## Les 25 personas

Prix : montant mensuel HT maximum accepté. « /agence » = payé par la direction pour toute l’agence ; « /conseiller » = payé par siège ou de sa poche.

| # | Prénom et profil | Ce qui le ferait payer | Ce qui le bloque | Achat | Prix max | Note |
|---|---|---|---|---|---|---|
| 1 | **Sandrine**, 52 ans, directrice d’une agence indépendante à Lyon 6e, 6 collaborateurs, Hektor | Le compte rendu vendeur en moins de 24 h, mesuré sur la page Temps gagné ; 49 € pour toute l’agence | Import CSV seulement, donc double saisie avec Hektor ; colonnes « à confirmer » | À l’essai | 79 € /agence | 64 |
| 2 | **Mathieu**, 29 ans, négociateur salarié Orpi à Nantes, enthousiaste | Dicter le débrief dans la voiture et retrouver relances et brouillons prêts | Il ne décide pas des outils de l’agence ; payer de sa poche un outil hors réseau le gêne | À l’essai (Solo, à titre perso) | 15 € /conseiller | 68 |
| 3 | **Gérard**, 63 ans, directeur Century 21 à Perpignan, 12 collaborateurs, sceptique | Rien tant que le réseau ne l’a pas référencé | Contrat de franchise, outils et données encadrés par la tête de réseau ; « l’IA, on verra quand le siège le dira » | Non | 0 € | 28 |
| 4 | **Nadia**, 41 ans, directrice Guy Hoquet à Lille, 9 collaborateurs, AC3 | La grille de risque LCB-FT par partie et l’export de preuves, après un contrôle DGCCRF difficile | Pas d’import AC3 ; une grille LCB-FT non relue par un juriste reste inutilisable face à un contrôleur | À l’essai | 120 € /agence | 58 |
| 5 | **Thomas**, 35 ans, négociateur Laforêt à Bordeaux, utilise déjà ChatGPT Plus | Les comparables DVF réels et les chiffres sourcés, que ChatGPT invente | « ChatGPT me fait déjà mes comptes rendus. » Aucune relance ne part vraiment (envois consignés) | À l’essai | 12 € /conseiller | 55 |
| 6 | **Isabelle**, 47 ans, directrice d’une agence indépendante à Annecy, 3 collaborateurs, Apimo | La relance du vendeur au bon moment | L’accueil promet la synchronisation Apimo : elle ne la trouve pas et se sent trompée | Non | 30 € /agence (si Apimo marchait) | 42 |
| 7 | **Karim**, 38 ans, directeur de 2 agences Era à Marseille, 15 collaborateurs | Les factures de commission mandataire → agence, et le pilotage équipe | Trois prix différents sur le site (49 € par agence, 49 € par siège, 249 €) : il ne sait pas ce qu’il paiera | À l’essai | 150 € /agence | 61 |
| 8 | **Hélène**, 58 ans, directrice d’une agence indépendante à Tours, 4 collaborateurs, Netty, ancienne juriste | La liste des pièces selon le type de bien et l’année | Relecture juridique non faite, « à confirmer par votre juriste », hébergeur non choisi, sous-traitant IA hors UE sans DPA : « je ne mets pas mes vendeurs là-dedans » | Non | 25 € /agence | 35 |
| 9 | **Julien**, 33 ans, négociateur dans une agence indépendante à Montpellier, 5 collaborateurs, Immo-facile, enthousiaste | Le brief avant rendez-vous avec questions à poser et points à confirmer (capture 22) | Pas d’import Immo-facile ; c’est son patron qui paie | À l’essai | 10 € /conseiller | 66 |
| 10 | **Patricia**, 55 ans, directrice Orpi à Rennes, 8 collaborateurs | Le compte rendu vendeur hebdomadaire comme argument pour décrocher l’exclusivité | Pas de service client ; l’envoi réel des e-mails dépend d’un SMTP à configurer : « qui le fait ? » | Oui (Agence) | 99 € /agence | 72 |
| 11 | **Benoît**, 44 ans, directeur adjoint d’une agence indépendante à Paris 15e, 18 collaborateurs, Apimo | Le temps gagné par conseiller, pour piloter et former | Apimo absent ; il veut une preuve sur 3 conseillers avant de déployer, sans accompagnement prévu | À l’essai | 200 € /agence | 63 |
| 12 | **Chloé**, 26 ans, négociatrice Guy Hoquet à Toulouse, très mobile | Dicter en sortant du rendez-vous, sur téléphone, et valider la relance | Le débrief WhatsApp demande une configuration Meta côté agence ; seul le mode simple est vraiment pensé mobile | Oui (Solo, à titre perso) | 15 € /conseiller | 74 |
| 13 | **Alain**, 67 ans, directeur d’une agence indépendante à Vichy, 2 collaborateurs, AC3 | Rien | « Encore un logiciel à remplir. » Il ne lit pas d’écran au-delà de son agenda papier | Non | 0 € | 22 |
| 14 | **Sophie**, 39 ans, directrice Laforêt à Grenoble, 7 collaborateurs, Hektor | Les factures de commission prêtes pour la réforme de la facturation électronique | Factur-X en XML seul, sans PDF/A-3 ni plateforme agréée branchée ; registre des mandats déjà tenu dans Hektor | À l’essai | 79 € /agence | 60 |
| 15 | **Romain**, 31 ans, négociateur Era à Lille, ex-commercial terrain | Le résumé de l’offre et la contre-proposition préparée | Il doit tout relire : « est-ce vraiment plus court ? » Les références de temps ne sont pas calibrées | À l’essai | 12 € /conseiller | 57 |
| 16 | **Martine**, 60 ans, directrice d’une agence indépendante à Vannes, 3 collaborateurs, Netty | La liste des diagnostics selon l’année de construction (DDT, assainissement) | Pas d’import Netty ; peu de dossiers, l’offre Découverte à 1 dossier lui suffirait presque | À l’essai | 39 € /agence | 52 |
| 17 | **Yann**, 46 ans, directeur Century 21 à Strasbourg, 10 collaborateurs | Le suivi des échéances du compromis | Le droit local d’Alsace-Moselle (Livre foncier) n’est pas couvert ; outil réseau imposé | Non | 0 € | 38 |
| 18 | **Laure**, 36 ans, directrice d’une agence indépendante à Bordeaux Chartrons, 5 collaborateurs, Apimo, déjà sur ChatGPT Team | Les chiffres marqués « non vérifié » et la validation obligatoire : ce que ChatGPT ne donne pas | Apimo absent : elle accepte l’import CSV, à condition qu’il marche du premier coup | Oui (Agence) | 89 € /agence | 70 |
| 19 | **Victoria**, 48 ans, directrice d’une agence prestige au Cap d’Antibes, 6 collaborateurs, Apimo, clientèle internationale | La grille LCB-FT (personnes politiquement exposées, gel des avoirs, origine des fonds) et le Pack Preuves | Pas de livrables en anglais, en italien ou en russe ; discrétion sur l’off-market ; hébergement non choisi | À l’essai | 250 € /agence | 60 |
| 20 | **Marc**, 57 ans, fondateur d’une agence de luxe à Saint-Jean-Cap-Ferrat, 4 collaborateurs, sceptique | Aucun gain perçu : il écrit lui-même à chaque client | Un prix de 9,90 € inspire de la méfiance pour des clients très fortunés ; données envoyées à une IA américaine ; « où est le contrat de traitement ? » | Non | 0 € | 33 |
| 21 | **Elena**, 42 ans, directrice d’une agence à Cannes Croisette, 12 collaborateurs, Apimo, trilingue | La lecture du compromis PDF avec extraits cités ; le brief acquéreur étranger ; les structures SCI et offshore dans la grille de risque | Livrables en français uniquement ; page Marché encore simulée ; synchronisation Apimo promise mais absente | À l’essai | 300 € /agence | 62 |
| 22 | **Philippe**, 51 ans, négociateur senior d’une agence prestige à Saint-Tropez, 5 collaborateurs | Les relances de vendeurs absents (résidences secondaires) et le bilan J+7, J+21, J+42 | DVF quasi vide pour des villas à plus de 5 M€ ; Marché simulé ; aucune estimation crédible sur son marché | À l’essai | 30 € /conseiller | 58 |
| 23 | **Camille**, 34 ans, directrice d’une agence de luxe à Nice Mont Boron, 8 collaborateurs, Hektor, enthousiaste | Le brief du matin calculé sur ses vraies données ; une identité « Riviera » qui lui parle | Doublon de grilles de prix ; « se branche sur Hektor » se révèle un import CSV | Oui (Agence) | 150 € /agence | 73 |
| 24 | **Olivier**, 49 ans, gérant Era à Aix-en-Provence, 14 collaborateurs, ancien banquier | Le Pack Preuves : export horodaté avec empreinte, à montrer en contrôle LCB-FT | Il exige une grille validée par un avocat avant de la présenter à un contrôleur | Oui (Agence + Preuves) | 180 € /agence | 69 |
| 25 | **Fabienne**, 45 ans, négociatrice dans une agence indépendante à Dijon, AC3, sceptique | Rien que ChatGPT gratuit ne fasse déjà, selon elle | Pas d’import AC3 ; elle ne voit pas la différence sans démonstration sur un de ses dossiers | Non | 5 € /conseiller | 40 |

---

## Synthèse du segment

| Indicateur | Résultat |
|---|---|
| Achat ferme | **5 / 25 (20 %)** : Patricia, Chloé, Laure, Camille, Olivier |
| À l’essai (gratuit ou Bêta, décision après mesure) | 13 / 25 (52 %) |
| Non | 7 / 25 (28 %) |
| Prix médian acceptable, par agence (14 réponses) | **≈ 110 € HT / mois** (de 25 à 300 €) |
| Prix médian acceptable, par conseiller (7 réponses) | **12 € HT / mois** (de 5 à 30 €) |
| Note moyenne | **55 / 100** |

**Lecture du prix :**
- **Solo à 9,90 €** correspond au consentement à payer d’un négociateur.
- **Agence à 49 €** est sous le prix médian accepté (environ 110 €). Pour plusieurs directeurs, ce prix inspire même la méfiance (Marc, Victoria).
- **Haut de gamme Côte d’Azur** : la médiane monte à 250–300 € par agence, à condition d’avoir des livrables multilingues et une grille LCB-FT relue.

### Top 5 objections

1. **« Ça ne se branche pas sur mon logiciel. »** (14 personas)
   - Aujourd’hui : import CSV seul, colonnes Hektor non confirmées ; rien pour Apimo, AC3, Netty ou Immo-facile.
   - L’accueil promet une « synchronisation » Apimo, Hektor et Modelo. L’écart entre la promesse et le produit coûte plus cher que le manque lui-même.
2. **« Votre légal n’est pas validé. »** (9 personas)
   - Les checklists Hoguet, LCB-FT et DPE sont utiles, mais marquées « à confirmer par votre juriste ».
   - Une grille non relue ne protège pas en cas de contrôle DGCCRF ou Tracfin.
   - Le droit d’Alsace-Moselle n’est pas couvert.
3. **« ChatGPT le fait déjà. »** (7 personas)
   - Les différences ne sont pas montrées sur un vrai dossier : contexte du dossier, DVF sourcé, validation, relances datées.
   - Le gain n’est pas encore calibré (références de temps théoriques).
4. **« Où vont les données de mes vendeurs ? »** (6 personas, dont tout le haut de gamme)
   - Hébergeur de production non choisi.
   - Sous-traitant IA hors UE, sans DPA ni registre RGPD présentés.
5. **« Rien ne part vraiment, et je ne sais pas ce que je paierai. »** (6 personas)
   - Envois, signature et portails sont consignés ; l’envoi d’e-mails dépend d’un SMTP à configurer.
   - Trois grilles tarifaires se contredisent sur le site.
   - Côté réseaux, l’outil imposé par la tête de réseau bloque à lui seul 3 directeurs.

### Top 5 corrections ou ajouts, classés par impact sur la vente

1. **Aligner le site sur le produit.**
   - Une seule grille de prix ; retirer « synchronisation Apimo, Hektor, Modelo » et les logos Yousign, DocuSign, SeLoger et Leboncoin tant qu’ils ne sont pas branchés.
   - *Rattachement :* Christophe, « un truc qui tourne, bancal mais qui tourne », « plug and play à 10 € ». Sans confiance, aucun moment du parcours n’est testé.
2. **Un import qui marche du premier coup sur les 5 logiciels français.**
   - Hektor confirmé sur un vrai export, puis préréglages Apimo, AC3, Netty et Immo-facile ; ensuite, lecture API d’Apimo et d’Hektor.
   - *Rattachement :* Christophe, « un assistant IA qui se connecte à ta base ». Moment « Première rencontre : préparer le RDV » : le brief n’a de valeur que nourri par les faits du logiciel.
3. **Faire relire la conformité FR par un avocat, et l’afficher.**
   - Remettre `RELECTURE.md` avec ses 19 points incertains ; afficher la mention « relu par… le… ».
   - Ajouter le registre des mandats et l’Alsace-Moselle.
   - *Rattachement :* Christophe, « le légal est une grosse préoccupation ». Moment « Du compromis à l’acte » et « Une offre arrive » (identité, origine des fonds).
4. **Une démo de 10 minutes sur un vrai rendez-vous vendeur, chronométrée, face à ChatGPT.**
   - Dictée sur téléphone sans configuration Meta, puis compte rendu, relance « vendredi après le diagnostic » et alerte si un comparable DVF baisse.
   - Temps passé, corrections comprises, affiché à côté.
   - *Rattachement :* moments « À la sortie : dicter le débrief » et « Entre deux échanges : relancer » (le fil rouge du PDF). Christophe : « une fois le gain mesuré sur de vrais dossiers, corrections comprises ».
5. **Faire partir vraiment, en Europe.**
   - Envoi e-mail géré par Jaspe, sans SMTP à configurer.
   - Hébergeur UE choisi, DPA et liste des sous-traitants publiés.
   - Livrables en anglais pour la Côte d’Azur.
   - *Rattachement :* moment « Entre deux échanges : relancer » (« valide l’envoi au moment convenu »). Christophe, « zéro service client » : aucune configuration à faire par l’agence.

### 3 phrases d’argumentaire qui marchent

1. « Vous sortez du rendez-vous, vous dictez deux minutes, et le compte rendu au vendeur est prêt à valider avant ce soir. Vous ne le relisez qu’une fois. »
2. « ChatGPT invente vos comparables. Jaspe cite les ventes DVF réelles et marque “non vérifié” tout chiffre sans source : rien ne part sans votre validation. »
3. « Gardez Hektor ou Apimo pour diffuser. Jaspe vous rend le temps d’après rendez-vous, et la page Temps gagné vous le prouve chaque semaine, relecture déduite. »
