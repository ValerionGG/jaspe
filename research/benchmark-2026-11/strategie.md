# Jaspe : stratégie produit et prix (25/11/2026)

*Synthèse du directeur produit. Elle s'appuie sur les cinq volets d'analystes (Portugal, France-Europe, assistants IA, prix, voix des agents), sur l'étude 05, sur le README et sur `server/`. Elle complète l'étude 05 sans la refaire. [V] vérifié sur la source, [T] tiers, [S] supposition. Les URLs sont celles des volets, rappelées quand elles portent une décision.*

**Deux corrections à intégrer à l'étude 05 :**
- **La dictée de compte rendu est devenue le minimum attendu**, ce n'est plus un avantage. Capifrance et Optimhome la proposent ([MySweetImmo 12/11/2026](https://www.mysweetimmo.com/2026/11/12/ia-immobiliere-mandataires-capifrance-optimhome/)) [V], comme efficity LYA [V], Inmovilla « WhatsApp + IA » ([idealista](https://www.idealista.pt/news/node/75745)) [T] et Rechat AI Memo [V].
- **Casafari est un concurrent direct**, pas seulement une source de données. Il propose un AI Presentation Builder, un CRM gratuit à vie ([casafari.com](https://www.casafari.com/insights/casafari-crm-get-to-know-the-free-plan/)) [V] et revendique « 4 h → 5 min » chez Porta da Frente Christie's (déclaratif) [V].

**Ce que Jaspe a déjà** (lecture du dépôt) [V] :
- débrief dicté et extraction D5 ;
- livrables L1 à L9 sourcés ;
- relances et routines AUT ;
- temps gagné net (`server/assist.js`, collection `timelog`) ;
- conformité FR/PT avec preuve obligatoire ;
- Brief → plan d'action ;
- factures FA-AAAA-NNNN ;
- retours bêta.

**Ce qui lui manque** [V] :
- authentification et multi-utilisateur ;
- tout envoi réel (tout est « consigné ») ;
- import CRM ;
- source de comparables ;
- paiement.

**Point de coût bloquant :** `server/copilot.js` envoie tout vers `claude-opus-5-5` avec `max_tokens: 16000`. Ce choix est **incompatible avec un prix de 10 €** (voir § 3).

---

## 1. Positionnement

> **Jaspe envoie votre compte rendu vendeur le jour même, avec les relances, le contrôle légal FR/PT et la facture de commission. Il affiche les minutes nettes récupérées. 9,90 € par mois, à côté du CRM que vous avez déjà.**

**Trois preuves :**

1. **Le temps gagné est mesuré, net des corrections.**
   - Lofty affiche environ 7 min par tâche (131 248 h pour 1,13 M de tâches), sans retrancher la relecture ([RISMedia](https://www.rismedia.com/2026/11/13/lofty-releases-industrys-first-ai-index-to-measure-the-impact-of-ai-on-real-estate/)) [V].
   - Aucun acteur français ou portugais n'affiche de mesure [V, absence].
   - 35 % des agents ne voient aucun impact de l'IA (NAR 2026) [T].
2. **La conformité laisse une preuve.**
   - La DGCCRF relève plus de 60 % d'établissements en anomalie, et des dossiers qui ne gardent « aucune trace » de la vigilance ([economie.gouv.fr](https://www.economie.gouv.fr/dgccrf/blanchiment-de-capitaux-et-financement-du-terrorisme-les-secteurs-du-luxe-de-limmobilier-et)) [V].
   - Au Portugal, aucun éditeur n'outille le BCFT ni la communication IMPIC [V, absence].
3. **Le prix est public, sans engagement, et 4 fois sous le plancher des assistants verticaux.**
   - Aucun assistant immobilier vertical n'a de prix public sous 39 $ : Fyxer coûte 37 $ ([fyxer.com/pricing](https://www.fyxer.com/pricing)) [V], Follow Up Boss 69 $ plus 39 $ [V].
   - Apimo impose 12 mois d'engagement [T] ; Hektor annonce 1 500 à 5 000 € de mise en service [T, source intéressée].

**Cible prioritaire :**
- les agents commerciaux et mandataires hors réseau outillé (eXp, petits réseaux), soit une partie des environ 94 000 conseillers en transaction en France [S] ;
- le haut de gamme au Portugal, vendu au consultant plutôt qu'à l'agence, car environ 60 % des consultants de réseau ne choisissent pas leur CRM [S].

**Argument pour le haut de gamme :** « zéro apprentissage », pas « pas cher ». Zillow classe la facilité d'usage avant le coût [V].

---

## 2. Matrice « meilleur de la classe »

| Étape ou capacité | Meilleur aujourd'hui | Ce que Jaspe a | Écart | Fonction qui fait passer Jaspe devant |
|---|---|---|---|---|
| Brief avant rendez-vous | Rechat Lucy (CMA en langage naturel) [V], PriceHubble Copilot [T] | D1 à D4, carte du quartier, AUT-010 | Aucune vraie donnée de prix | **Fiche « 3 chiffres sourcés »** : DVF (FR, données ouvertes) ou import Casafari (PT), avec date et source sur chaque chiffre |
| Débrief dicté | Rechat AI Memo [V], Inmovilla WhatsApp [T], efficity [V] | Dictée, extraction D5 | Uniquement dans l'app, pas en mobilité | **Débrief deux en un** : une dictée de l'agent seul (sans enregistrer le client, pour le RGPD) produit le compte rendu vendeur et les actions CRM. WhatsApp en vague 3 |
| Documents après rendez-vous | Casafari Presentation Builder [V], Fyxer (ton de l'agent) [V] | L1 à L9 sourcés, AUT-058 | Chiffres sans source visible, pas de marque agence | **Pastille « non vérifié » en rouge** sur tout chiffre sans source, PDF aux couleurs de l'agence |
| Relances | Lofty Cowork « What needs you now » [V] | Relances datées, AUT-046 | Rien n'est réellement envoyé | Liste « à valider » avec **une action en un geste**, envoi e-mail réel. Rien ne part sans validation |
| Veille marché | Casafari (données notariales) [V], Lofty (citations sourcées) [V] | Veille de démonstration | Aucune source réelle | Brancher DVF et Casafari. **Ne jamais construire de base de comparables** |
| Offre → compromis → acte | Real Leo Pro (extraction des dates, calendrier) [V/T] | Étape compromis, conditions | Saisie manuelle | **PDF du compromis ou du CPCV → dates, conditions suspensives, pièces bloquantes**, calendrier jusqu'à l'acte |
| Mesure du temps | Lofty AI Index (déclaratif), Fyxer analytics [V] | Gain net, calibrage au chrono, export CSV | Pas d'indicateur côté vendeur | Ajouter **« compte rendu envoyé en moins de 24 h »** et appels vendeur évités. Carte « valeur rendue » hebdomadaire face aux 9,90 € |
| Légal FR/PT | Hektor Voice (questions-réponses) [T], Galian LCB-FT à 50 € TTC [T] | Checklists, points bloquants, preuves | Pas relu par un juriste, pas d'export de contrôle, rien d'IMPIC | **Dossier de contrôle LCB-FT en un clic**, **lien client « origine des fonds »**, IMPIC anexo B prérempli |
| Factures de commissions | Inmovilla (intégré) [V], InvoiceXpress (API, IA) [V] | Brouillon, numérotation figée, TVA/IVA | Aucune émission certifiée, un seul modèle | **Deux modèles** (agence → client, mandataire → réseau). Émission déléguée à InvoiceXpress (PT) ; export Factur-X (FR) |
| Brief libre → plan | Lofty Cowork (exécute, escalade à l'humain) [V] | Bouton Brief, AUT-120/121, action cochée | Concept encore « Star Trek » | **Démo de 60 secondes** préchargée, avec trois exemples réels de testeurs |
| Import CRM | Avest (API publique) [T], MeilleursBiens Neo (MCP, 32 outils) [V] | Rien | Double saisie, douleur n° 1 [V Zillow] | **Import CSV eGO et Hektor** (biens, contacts), puis serveur MCP Jaspe de 8 à 10 outils |

**Lecture :** Jaspe est déjà en tête sur la mesure du temps, le légal sourcé et le plan d'action coché. Il perd sur tout ce qui touche au monde réel : envoi, import, données, émission. La feuille de route ne doit donc pas ajouter de fonctions. Elle doit **brancher ce qui existe**.

---

## 3. Grille tarifaire recommandée

| Plan | Prix HT | Contenu | Pour qui |
|---|---|---|---|
| **Découverte** | 0 € à vie | 1 dossier actif, 30 min de dictée par mois, temps gagné, factures avec filigrane | Contre le CRM gratuit de Casafari et le plan gratuit d'InvoiceXpress |
| **Solo** | **9,90 €/mois** ou **99 €/an** (2 mois offerts) | 8 dossiers actifs, 300 min de dictée, relances, conformité FR ou PT de base, factures, export du temps | Indépendant, mandataire |
| **Agence** | **49 €/mois jusqu'à 7 conseillers**, puis 6 € par siège | Solo pour tous, tableau de direction, export hebdomadaire du temps | Contre Inmovilla à 79 € pour 7 utilisateurs [V] et Witei à 25 € pour 10 [V] |

**Options :**
- **Pack Preuves** à **+6 €** : export de contrôle LCB-FT, lien client « origine des fonds », procédure interne et grille de risque, IMPIC anexo B. Galian vend 50 € TTC [T].
- **Données marché** à **+9 €** : DVF enrichi, connecteur Casafari si l'utilisateur a déjà un compte.
- **Recharges** : 600 min de dictée pour 4 € ; 50 documents IA supplémentaires pour 5 €.
- **Signature électronique** : 1,50 € l'enveloppe, refacturée.

**Règles :**
- carte bancaire uniquement, résiliation en un clic ;
- 15 jours remboursés (modèle Witei) ;
- au-delà du quota, **le service passe sur un modèle moins cher** au lieu d'envoyer une facture surprise ;
- **garantie « 2 h »** : un mois mesuré sous 2 h nettes gagnées est remboursé automatiquement. Comme le gain est déjà mesuré, cette garantie ne coûte presque rien en support.

**Équation de coût** (prix API au 03/11/2026 [V via le skill claude-api], volumes [S]) :

| Routage par dossier | Coût |
|---|---|
| Tout en Opus 5.5 | 1,70 à 2,32 $ par dossier ; **5,5 à 7 € par utilisateur et par mois → marge quasi nulle** |
| Mixte : Haiku pour relances, extraction et classement ; Sonnet pour documents et offres ; Opus seulement pour l'audit du compromis ; prompt système en cache | **0,40 à 0,45 $ par dossier, environ 1,4 € par utilisateur et par mois** |

**Coût variable total par utilisateur Solo :**

| Poste | Coût mensuel |
|---|---|
| IA | 1,4 € |
| Stripe | 0,40 € |
| Hébergement UE | 0,30 € |
| **Total** | **environ 2,1 €** |

**Marges :**
- **Solo : environ 7,8 € de marge, soit 79 %** ;
- **Agence** pleine (7 sièges) : environ 14,7 € de coût, soit **70 % de marge** ;
- **Découverte** : environ 0,3 € par utilisateur, absorbable tant que le taux de conversion dépasse environ 5 % [S].

**Point mort :**
- 380 utilisateurs payants avec des coûts fixes de 3 000 €/mois ;
- environ 200 si le revenu moyen atteint 17 € grâce aux options [S].

**Pourquoi pas 19 ou 29 € d'emblée :** 9,90 € est un prix d'impulsion sans arbitrage budgétaire. Il représente moins de 5 % de la dépense d'une agence portugaise (250 à 500 €/mois) [S]. La montée du revenu passe par les options Preuves et Données, qui sont ancrées sur un risque d'amende et non sur une fonction.

---

## 4. Feuille de route : 12 items

### Vague 1 (2 semaines) : rendre la bêta mesurable et rentable

| # | Item | Effort | Impact | Preuve attendue en bêta |
|---|---|---|---|---|
| 1 | **Routage multi-modèles** dans `copilot.js` : Haiku par défaut, Sonnet pour les documents, Opus pour l'audit ; cache du prompt système ; plafond par plan ; journal du coût par appel | S | Marge 79 % au lieu de ~0 | Coût moyen journalisé < 1,5 € par utilisateur et par mois ; taux de correction stable |
| 2 | **Import CSV eGO et Hektor** (biens, contacts), avec un mapping guidé | M | Supprime la douleur n° 1 | ≥ 4 agences sur 6 importent en moins de 10 min |
| 3 | **Compte rendu vendeur le jour même** : indicateur « < 24 h » et appels vendeur évités, rapport hebdomadaire | S | Une promesse visible pour le vendeur | Délai médian entre rendez-vous et envoi < 4 h ; moins d'appels « où en est-on » déclarés |
| 4 | **Source sur chaque chiffre** des livrables et pastille « non vérifié » | S | Répond aux 63 % d'agents qui doutent de l'exactitude [V RPR] | Taux de correction des chiffres en baisse ; aucun chiffre non sourcé envoyé |
| 5 | **Premier jour en 3 écrans** (Brief, Débrief, Temps gagné) ; le stepper complet est masqué en mode simple | S | Zillow : la facilité d'usage passe en n° 1 | Premier débrief réalisé en moins de 5 min après l'inscription |

### Vague 2 (6 semaines) : pouvoir vendre sans service client

| # | Item | Effort | Impact | Preuve attendue en bêta |
|---|---|---|---|---|
| 6 | **Comptes, multi-utilisateur, Stripe en libre-service, page de prix publique** et résiliation en un clic | L | Sans cet item, aucun revenu | Premiers paiements ; zéro ticket de facturation |
| 7 | **Pack Preuves** : export de contrôle LCB-FT horodaté, lien client « pièces et origine des fonds » avec un texte légal explicatif, grille de risque | M | Différenciateur n° 1 auprès des indépendants | ≥ 50 % des dossiers bêta portent un export complet ; ≥ 2 juristes valident les checklists |
| 8 | **Émission déléguée des factures** : API InvoiceXpress (PT), export Factur-X (FR), deux modèles agence et mandataire | M | Ferme la boucle jusqu'à l'encaissement | Factures réellement émises par ≥ 3 testeurs |

### Vague 3 (3 mois) : se brancher partout

| # | Item | Effort | Impact | Preuve attendue en bêta |
|---|---|---|---|---|
| 9 | **Serveur MCP Jaspe**, 8 à 10 outils (débrief, relance, checklist, facture, temps), avec validation obligatoire avant toute écriture | M | Usage depuis Claude ou ChatGPT, là où l'app d'eGO ne fait que consulter | Part des actions venues du MCP ; aucune écriture sans validation |
| 10 | **Extraction du compromis ou du CPCV** en PDF : dates, conditions suspensives, calendrier, pièces bloquantes | M | Meilleur de la classe sur l'étape la plus risquée | ≥ 90 % des dates exactes sur 20 actes réels anonymisés |
| 11 | **IMPIC anexo B prérempli** depuis les affaires closes, rappel à J-15 | M | Trou de marché au Portugal | Toutes les agences PT de la bêta exportent leur trimestre |
| 12 | **Débrief par message vocal WhatsApp** vers un numéro Jaspe | M | Pas d'application à ouvrir sur le parking | ≥ 40 % des débriefs arrivent par WhatsApp |

---

## 5. Ce qu'il ne faut PAS faire

- **Pas de CRM concurrent** : ni portails, ni site d'agence, ni diffusion d'annonces. « Pour le CRM, tu prends eGO. »
- **Pas d'agent vocal de qualification des leads** : chez Ylopo, 1,7 % des appels aboutissent à un rendez-vous [T], et l'article 50 de l'AI Act impose la transparence [S]. Intégrer un outil tiers, au mieux.
- **Pas de home staging** : c'est un produit banalisé, autour de 1 $ la photo [V].
- **Pas de base de comparables maison ni de scraping** : brancher DVF ou Casafari.
- **Pas d'enregistrement du client par défaut** : l'agent dicte seul (RGPD) ; voir Tensoria [T].
- **Pas d'envoi automatique sans validation**, même dans le MCP.
- **Pas de MCP à 32 outils** ni d'« AI Builder » : 10 outils qui marchent valent mieux.
- **Pas de devis, d'engagement ni de mise en service payante** : c'est le modèle commercial des concurrents, et il exige une force de vente.
- **Pas d'émission de factures certifiées en interne** : déléguer aux logiciels certifiés.
- **Pas de nouvelles routines** : il y en a déjà plus de 100. En masquer plutôt que d'en ajouter.

---

## 6. Risques et parades

| Risque | Parade |
|---|---|
| **Juridique** : checklists non relues ; conseil légal implicite ; facturation PT non certifiée ; données sensibles (pièces d'identité, origine des fonds) | Relecture par un juriste FR et un juriste PT avant la vente, badge « vérifié le… » par point ; mention « aide à la conformité, pas un conseil juridique » ; Jaspe prépare, le logiciel certifié émet ; hébergement UE chiffré, durée de conservation LCB-FT paramétrée (5 ans en France [T]) |
| **Dépendance à l'IA** : prix, disponibilité, dérive de qualité | Routage abstrait (item 1) ; le mode règles existe déjà en repli ; tests de non-régression sur les livrables (`server/test.js`) ; plafond par plan |
| **Dépendance aux données et aux portails** : Casafari sur devis, renouvellements contestés [T] | DVF d'abord (ouvert) ; Casafari seulement si le client a déjà un compte ; aucune fonction cœur ne dépend d'un portail |
| **eGO** ajoute l'écriture à son app ChatGPT | Jaspe vend la mesure et la preuve, qu'eGO n'affiche pas ; un MCP multi-CRM ; vente au consultant, pas à l'agence |
| **idealista et Inmovilla** (portail, CRM et dictée WhatsApp) | Prix par agence aligné (49 € contre 79 €) ; Pack Preuves PT (IMPIC, BCFT) qu'Inmovilla n'a pas ; WhatsApp en vague 3 |
| **Outils maison des réseaux** (Capifrance en janvier 2027, efficity, MeilleursBiens) | Viser les réseaux sans outil maison (eXp : « assistant de son choix » [T]) ; kit d'import ; plus tard, proposer Jaspe comme brique de réseau |
| **Casafari** (présentation IA et CRM gratuit) | Se brancher sur Casafari au lieu de l'affronter ; Jaspe couvre ce qu'il ne fait pas : débrief, relances, légal, factures, temps |
| **Surcharge de l'interface** (8 étapes, L1 à L9) | Item 5, puis mesure de l'abandon par écran via le bouton de retour bêta |

---

## Idées à voler pour Jaspe

- **Liste « Ce qui a besoin de vous maintenant »** avec une action en un geste par ligne, construite sur AUT-046 (Lofty Cowork).
- **Indice public « Jaspe Time Index »** des minutes nettes gagnées, méthode publiée, qui répond aux ~7 min déclaratives de Lofty (Lofty AI Index).
- **Page vendeur en lecture seule** (visites, retours, offres, prochaine étape) envoyée par lien après chaque rendez-vous (Reapit Vendor Experience).
- **Dossier vendeur aux couleurs de l'agence, ton ajustable, prix modifiables à la main**, généré depuis le débrief (Casafari AI Presentation Builder).
- **Débrief par vocal WhatsApp** (Inmovilla « WhatsApp + IA »).
- **MCP qui agit, avec validation obligatoire** (MeilleursBiens Neo ; contre-modèle : l'app ChatGPT d'eGO, en lecture seule).
- **Extraction des dates du compromis ou du CPCV vers un calendrier de signatures** (Real Leo Pro).
- **Grille publique avec quotas visibles, 15 jours remboursés, aucun frais d'inscription** (Witei, Fyxer, folk).
- **Pack agence forfaitaire jusqu'à 7 conseillers** (Inmovilla, InvoiceXpress avec utilisateurs illimités).
- **Lien client « origine des fonds » précédé d'un texte de loi**, pour que l'agent n'ait plus à justifier une demande jugée intrusive. Il répond au constat « aucune trace » de la DGCCRF (parcours client de Rechat ; trou laissé par Galian et eGO).

*Fichiers lus : `D:\Jaspe\README.md`, `D:\Jaspe\research\05-etude-concurrentielle-2026-11.md`, `D:\Jaspe\server\copilot.js` (Opus en dur, l.57-58).*
