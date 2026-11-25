# Assistants IA pour agents immobiliers (2025-2026) : benchmark approfondi pour Jaspe

*Complète et corrige `research/05-etude-concurrentielle-2026-11.md`. Relevé du 25/11/2026. [V] vérifié sur la source, [T] source tierce ou éditeur cité par un tiers, [S] supposition.*

## 0. Corrections à apporter à l'étude 05

| Point de l'étude 05 | Correction | Statut |
|---|---|---|
| Fyxer « 22,50 à 30 $ » | Le plan **Pro coûte 37 $ par personne et par mois**. Il existe un plan gratuit (400 crédits, environ 20 messages) et des plans Team et Enterprise. Le plan Pro inclut des **analytics des heures et de la valeur rendues** ([fyxer.com/pricing](https://www.fyxer.com/pricing)) | [V] |
| Lofty « Copilote » | Le produit agentique s'appelle désormais **Cowork**. Il « exécute de bout en bout » dans le CRM et « vous sollicite quand une décision demande votre jugement ». La page promet « 20 h gagnées par mois » ([lofty.com/ai/copilot](https://lofty.com/ai/copilot)) | [V] |
| Lofty AI Index | Octobre 2026 : **1,13 million de tâches et 131 248 h gagnées**, soit **environ 7 min par tâche** en moyenne. Le gain vient surtout des relances, des posts sociaux, des contacts avec les anciens clients et des mises à jour du CRM, pas des documents ([RISMedia](https://www.rismedia.com/2026/11/13/lofty-releases-industrys-first-ai-index-to-measure-the-impact-of-ai-on-real-estate/)) | [V], calcul [S] |
| Follow Up Boss « dès 69 $ » | Plan Grow à 69 $ par utilisateur. Les fonctions IA sont incluses, mais **plusieurs dépendent de l'option Calling à 39 $ par utilisateur**. Le plan Pro coûte 499 $ pour 10 utilisateurs et inclut résumés, messages intelligents, tâches suggérées et priorisation prédictive des leads ([followupboss.com/pricing](https://www.followupboss.com/pricing)) | [V] |
| Rechat Lucy « notes de rendez-vous » | Précision : **AI Memo** enregistre l'échange (avec la permission du client) **ou** prend une dictée après coup. Il produit un résumé, les points clés et les actions de suivi suggérées, rattachés au contact et au dossier ([help.rechat.com](https://help.rechat.com/guides/lucy-your-ai-assistant)) | [V] |
| Hektor | La Boîte Immo a **racheté HOQI** (home staging par IA) en décembre 2025. L'offre Hektor regroupe donc Voice, Smartpix et le staging ([MySweetImmo](https://www.mysweetimmo.com/2025/12/04/immobilier-la-boite-immo-rachete-hoqi-startup-specialiste-du-home-staging-assiste-par-ia/)) | [T] |

## 1. Fiches par acteur

Pour chaque acteur : ce que fait l'IA, son niveau d'autonomie (C = consulte, R = rédige, A = agit), son prix, les preuves de gain de temps publiées et les garde-fous humains.

### Assistants intégrés au CRM (États-Unis)

**Rechat Lucy** (CRM de luxe)
- **Ce que fait l'IA** : un copilote conversationnel.
  - Rédige la communication : campagnes email, réseaux sociaux, flyers, descriptions d'annonce, sites d'annonce créés à partir d'un numéro MLS.
  - Prépare les CMA (analyses comparatives de marché) et des statistiques de marché par code postal, « avant les rendez-vous clients ».
  - Gère les contacts : création, tags, notes.
  - Crée les tâches et interroge les dossiers par date de contrat ou de clôture [V].
  - Connexion possible à Claude ou ChatGPT par MCP [T] ([sagnikbhattacharya.com](https://sagnikbhattacharya.com/blog/brokerage-rechat-ai-lucy-cost)).
- **Autonomie** : C, R et A (écritures dans le CRM).
- **Prix** : aucun prix public, uniquement sur démo [T] ([Luxury Presence](https://www.luxurypresence.com/?p=61347)).
- **Preuve de gain** : aucune chiffrée.
- **Garde-fous** : enregistrement « avec permission ». Les rôles et permissions ne sont pas documentés [T].
- **Verdict** : référence pour le débrief et la préparation de rendez-vous, mais aucune mesure du temps gagné.

**Lofty Cowork, AI Sales Agent et AI Index** (équipes)
- **Ce que fait l'IA**
  - **Sales Agent** : un ISA virtuel (assistant de prospection) actif 24 h sur 24, sur trois canaux à la fois. Il qualifie les leads, réserve les rendez-vous dans l'agenda et transfère au moment clé. Il s'appuie sur des « skills » chargés selon la situation (règles de rappel, présentation de l'agent, conformité), construits à partir de plus de 400 000 conversations [V] ([lofty.com/ai/sales-agent](https://lofty.com/ai/sales-agent)).
  - **Cowork** : liste priorisée « What needs you now » avec actions en un geste, brouillons dans la voix de l'agent, extraction des données d'un contrat chargé, réponses de marché avec citations sourcées, tâches planifiées [V].
- **Autonomie** : A (exécute via la CLI Lofty).
- **Prix** : environ 449 $ selon l'étude 05 [T]. Un « AI Assistant » à 9,99 $ par mois est cité, mais les sources se contredisent [T].
- **Preuve de gain** : le seul indice mensuel public du marché, déclaratif (barème en minutes par tâche).
- **Garde-fous** : escalade vers l'humain sur décision.
- **Verdict** : meilleur de la classe pour les relances et la mesure du temps gagné.

**Follow Up Boss** (Zillow)
- **Ce que fait l'IA** : résumés d'appels automatiques (depuis juillet 2024), messages intelligents, tâches suggérées, priorisation des leads [V] ([changelog](https://updates.followupboss.com/en/introducing-ai-call-summaries-your-conversations-summarized)).
- **Autonomie** : R et suggestions.
- **Prix** : IA incluse, mais la valeur dépend de la téléphonie payante [V].
- **Garde-fous** : l'humain valide tout. Un tiers affirme que les résumés intelligents sont en « bêta suspendue », ce qui n'est pas confirmé [T] ([followupace.com](https://followupace.com/blog/follow-up-boss-ai-tools-complete-guide)).
- **Écosystème** : des assistants tiers se greffent dessus (Follow Up Ace, Ylopo).

**BoldTrail** (ex-kvCORE, Inside Real Estate)
- **Ce que fait l'IA** : CORE AI pour les campagnes, HomeSearch AI pour les alertes et la réactivation des leads, et une offre payante « AI Premium » [T] ([Real Estate News](https://www.realestatenews.com/2025/08/21/boldtrail-unveils-ai-home-search-lone-wolf-debuts-agent-dashboard)).
- **Autonomie** : A sur le nurturing, avec une logique surtout à base de règles selon Lofty, source concurrente [T].
- **Preuve de gain** : aucune. Les avis G2 mentionnent une courbe d'apprentissage raide [T].

**Real Brokerage Leo Pro** (octobre 2026, nouvel entrant)
- **Ce que fait l'IA** [V] ([Real Estate News](https://www.realestatenews.com/2026/10/20/real-brokerages-latest-ai-tech-targets-agent-busywork)) :
  - une bibliothèque de plus de trois douzaines d'agents IA, avec un **AI Builder** pour créer les siens ;
  - photos transformées en visite vidéo ;
  - relances des leads froids, envoi de biens correspondant aux critères de l'acheteur ;
  - **extraction des dates d'un contrat, création du calendrier et coordination des signatures** [T] ([Inman](https://www.inman.com/2026/10/20/real-brokerage-leo-pro/)).
- **Autonomie** : A.
- **Prix** : **facturé au token** [T], réservé aux agents Real.
- **Preuve de gain** : 700 000 interactions depuis 2023, mais aucune mesure de temps.
- **Verdict** : meilleur de la classe pour l'étape offre → compromis → acte.

### Qualification et accueil vocal

**Ylopo** (AI Text et AI Voice)
- **Ce que fait l'IA** : SMS et appels vocaux pour qualifier les leads, puis transfert en direct de l'appel à l'agent ou au premier agent disponible d'un pool. Les notes d'appel vont dans le CRM [T] ([ylopo.com](https://www.ylopo.com/ylopo-ai-voice)).
- **Autonomie** : A.
- **Prix** : non publié. La suite est estimée entre 295 et 500 $ par mois. **AI Voice ne fonctionne qu'avec Follow Up Boss** [T] ([aitoolsbakery](https://aitoolsbakery.com/blog/ylopo-pricing-2026/)).
- **Preuves publiées par l'éditeur** : 48 % de taux de réponse aux SMS, **1,7 % des appels aboutissent à un rendez-vous**, 1,9 % à un transfert [T]. Des taux de conversion aussi bas sont honnêtes, mais modestes.

**Structurely** (Aisa Holmes)
- **Ce que fait l'IA** : un ISA conversationnel qui alterne campagnes IA et humaines, avec transfert en direct et filtrage des appels [V].
- **Prix**, facturé à l'usage en tokens :
  - voix à partir de **0,07 $ la minute**, SMS et email à partir de 0,02 $ [V] ([structurely.com/pricing](https://www.structurely.com/pricing)) ;
  - abonnement plateforme de 499 $ par mois et **2 000 $ de mise en service** [T] ([aitoolsbakery](https://aitoolsbakery.com/blog/structurely-pricing-2026/)).
- **Actualité** : racheté par CapStone en janvier 2026 [T].

**PriceHubble** (Europe, présent en France)
- Agent vocal de qualification des leads (septembre 2025) [T] ([PR Newswire](https://www.prnewswire.com/fr/press-releases/pricehubble-lance-un-agent-ia-vocal-pour-automatiser-la-qualification-des-leads-immobiliers-302541279.html)).
- Suite d'agents **Companion, Copilot et Analyst** (octobre 2025). Copilot prépare l'argumentaire de rendez-vous, l'estimation et les rapports [T] ([pricehubble.com](https://www.pricehubble.com/uk/solution/ai-agents-suite)).
- **Serveur MCP d'estimation** (décembre 2025) [T] ([pricehubble.com](https://www.pricehubble.com/pricehubble-news/pricehubble-launches-model-context-protocol)).
- Prix non publié.
- **Verdict** : meilleur de la classe européenne pour le brief et l'estimation, et une source de données branchable.

**Accueil téléphonique en France**
- **Fonio Solo** : 119 € HT par mois, ou 99 € en annuel, pour 1 000 minutes [T] ([Hackceleration](https://hackceleration.com/fr/labs/meilleur/agent-vocal-ia-immobilier)).
- **Scout Lead (Joe AI)** : crée les fiches dans Immofacile et organise les rendez-vous [T] ([FrenchWeb](https://www.frenchweb.fr/immobilier-qui-controlera-l-agence-a-l-heure-de-l-ia/900000027)).
- **Usage conseillé** : seulement les appels qui tombent aujourd'hui sur messagerie (appels de panneaux, appels pendant les visites, hors horaires) [T] ([eesel](https://www.eesel.ai/fr/blog/receptionniste-ia-immobilier)).
- **Obligation probable** : indiquer qu'on est une IA (AI Act, article 50, applicable en août 2026) [S, à vérifier par un juriste].

### Réseaux et plateformes : faux concurrents à corriger

- **Epique AI** : le site epique.ai affiche « In private beta, Coming soon » [V]. Le réseau Epique Realty offre ses outils IA gratuitement à ses agents et a lancé **Epique OS** en juillet 2026 (CRM, assistant, suivi de l'activité) [T] ([Newswire](https://www.newswire.com/news/epique-realty-launches-epique-labs-and-unveils-epique-os-the-all-in-one)). Ce n'est pas un produit vendu.
- **REAi** : **ce n'est pas un outil pour agents**. C'est une plateforme grand public de vente sans agent (« DIY », économie de 23 000 $ revendiquée) ou avec un « AiBroker » [V] ([reai.co](https://www.reai.co/)). C'est une menace de désintermédiation, à retirer de la liste des concurrents.
- **RealScout** : outil de recherche de biens partagée entre acheteur et agent, hors du parcours vendeur de Jaspe. Non vérifié en détail [S].

### Outils génériques et matériel de dictée

| Outil | Prix | Ce qui est utile pour Jaspe | Statut |
|---|---|---|---|
| **Fyxer** | 0 / 37 $ | Brouillons dans le ton de l'utilisateur, liste de relances, « promesses faites » en réunion, analytics heures et valeur, MCP | [V] |
| **Fathom** (racheté par Superhuman en septembre 2026 [T]) | 15 à 19 $ (Premium), 25 à 34 $ (Team et Business) | Notes de réunion visio, peu adapté au rendez-vous physique | [V] [fathom.ai/pricing](https://www.fathom.ai/pricing) |
| **Otter** | environ 8,33 $ par mois en annuel | Transcription brute | [T] [tldv](https://tldv.io/blog/otter-pricing/) |
| **Plaud NotePin** | 159 à 179 $ pour l'objet, plus environ 100 $ par an | Enregistreur porté : préférences de l'acheteur, retours sur le bien, prochaines étapes | [T] [plaud.ai](https://www.plaud.ai/pages/real-estate-solution) |
| **Saleswise** (US) | 39 $ par mois forfaitaire, illimité | Contenus marketing | [T] [toolmage](https://www.toolmage.com/fr/tool/saleswise/) |
| **Jasper, GPTs immobiliers, ChatGPT** | 20 $ et plus | Rédaction générique, sans CRM ni preuve | [S] |

**Dictée de débrief en France**
- **ViziNote** : dictée transformée en **PDF à envoyer au vendeur**, avec suivi client [T].
- **Speakwise** (iPhone) : sépare le bien, le vendeur et les actions [T] ([speakwiseapp](https://speakwiseapp.com/fr/blog/meilleure-app-notes-vocales-agents-immobiliers)).
- **Adapt Immo** : dictée intégrée à l'application mobile [T].
- **Tensoria** : génère deux documents, un pour le propriétaire et un pour le CRM, relus avant envoi. Il recommande, pour la conformité, que **l'agent dicte seul plutôt que d'enregistrer le client** [T] ([tensoria.fr](https://tensoria.fr/blog/automatiser-compte-rendu-visite-immobiliere)).

**Hektor Voice** : commande vocale pour créer un bien, une annonce ou un contact, gérer les rendez-vous et les emails, et répondre aux questions juridiques avec des réponses « vérifiées » selon l'éditeur [T] ([MySweetImmo](https://www.mysweetimmo.com/2024/12/28/agents-immobiliers-hector-voice-lassistant-vocal-qui-revolutionne-votre-quotidien-olivier-bugette-la-boite-immo/)). Prix non publié. Plus de 45 000 utilisateurs de Hektor [T].

### Home staging virtuel et visuels

- **Virtual Staging AI** (application de Zillow [T]) : 16 $ pour 6 photos, 19 $ pour 20, 39 $ pour 60, 79 $ pour 150. Soit **0,53 à 2,67 $ par photo**, régénérations illimitées [V] ([virtualstagingai.app/prices](https://www.virtualstagingai.app/prices)).
- **Concurrents de staging** : Collov à 19 $ pour 60 crédits, IACrea à 29 € HT pour 50 crédits [T]. Un staging fait par un humain coûte 16 à 39 $ par image [T].
- **HOQI** : application gratuite avec achats intégrés, désormais intégrée à l'offre Hektor [T].
- **Conclusion** : un produit banalisé, à environ 1 $ la photo. Jaspe ne doit pas le construire, au mieux s'y brancher.

## 2. Meilleur de la classe à chaque étape du parcours Jaspe

| Étape | Meilleur de la classe | Pourquoi | Écart à combler par Jaspe |
|---|---|---|---|
| Brief avant rendez-vous | **Rechat Lucy**, **PriceHubble Copilot** | CMA et statistiques de marché en langage naturel, argumentaire préparé | Comparables du Portugal et de la France via Casafari ou PriceHubble (MCP) |
| Débrief dicté | **Rechat AI Memo** ; en France, **ViziNote** | Dictée transformée en résumé, actions et fiche rattachée | Dictée seule, sans enregistrer le client (RGPD), sortie en FR et en PT |
| Documents après rendez-vous | **Lucy**, **Fyxer** | Brouillons dans le ton de l'agent, PDF pour le vendeur | Compte rendu pour le vendeur et avis de valeur conformes |
| Relances | **Lofty Cowork et Sales Agent** | Liste « What needs you now », action en un geste, skills de conformité | Relances **proposées puis validées**, jamais envoyées seules |
| Veille marché | **Lofty Cowork** (citations sourcées), **PriceHubble** | Réponses sourcées | Toujours afficher la source et la date |
| Offre → compromis → acte | **Leo Pro** | Extraction des dates du contrat, calendrier, signatures | Calendrier du compromis et de l'acte, CPCV au Portugal, pièces bloquantes |
| Mesure du temps gagné | **Lofty AI Index**, **Fyxer analytics** | Barème en minutes par tâche et valeur en euros | Gain **net** des corrections (déjà prévu, à mettre en avant) |
| Accueil vocal | **Ylopo** (US), **Fonio** et **PriceHubble** (FR) | Transfert en direct, notes dans le CRM | Hors périmètre pour la bêta, au mieux une intégration |
| Home staging | **Virtual Staging AI** | Environ 1 $ par photo | Ne pas construire |

## 3. Lecture des prix

- **Le prix de 10 € par mois place Jaspe dans la tranche des preneurs de notes** : Otter à environ 8 $, Lofty AI Assistant à 9,99 $ [T], Fathom à 15 $. Les assistants verticaux sont bien plus chers : Saleswise à 39 $, Fyxer à 37 $, Follow Up Boss à 69 $ plus 39 $, Structurely à 499 $ plus l'usage.
- **Aucun assistant vertical immobilier n'a de prix public à moins de 39 $** [V et T, à partir des sources ci-dessus]. C'est un argument fort, si la valeur est prouvée.
- **La facturation à l'usage s'impose** : tokens chez Leo Pro et Structurely, crédits chez Fyxer. Le meilleur modèle pour Jaspe [S] : 10 € par mois avec un quota inclus, puis des packs de crédits (estimations PriceHubble, staging, minutes vocales). Fyxer donne l'exemple : **crédits illimités les trois premiers mois**, puis alerte à 80 % et à 100 % [V].
- **Les preuves de gain sont rares et déclaratives** : Lofty donne environ 7 min par tâche, Ylopo 1,7 % de rendez-vous par appel. Aucun acteur ne retranche le temps de relecture. Le gain net de Jaspe est un vrai différenciateur, à condition d'être **public et vérifiable**.

## 4. Garde-fous observés

| Garde-fou | Qui le pratique |
|---|---|
| Enregistrement seulement avec la permission du client | Rechat |
| Escalade vers l'humain quand une décision demande son jugement | Lofty Cowork |
| Transfert en direct de l'appel à l'agent | Ylopo, Structurely |
| Brouillon jamais envoyé sans validation | Fyxer, Follow Up Boss, Tensoria |
| Skills « compliance situations » chargés selon le contexte | Lofty |
| Rôles et permissions documentés | Personne sur le marché américain (lacune relevée chez Rechat [T]) |

## Idées à voler pour Jaspe

1. **Liste « Ce qui a besoin de vous maintenant »** à l'ouverture de l'application, une action en un geste par ligne : relance, pièce manquante, échéance du compromis (inspirée de **Lofty Cowork**).
2. **Débrief deux en un** : une dictée produit le compte rendu pour le vendeur (PDF à son nom) et la fiche CRM avec ses actions. Par défaut, dictée de l'agent seul, sans enregistrer le client (inspirée de **Rechat AI Memo**, **ViziNote** et **Tensoria**).
3. **Indice public mensuel « Jaspe Time Index »** : minutes nettes gagnées par tâche, **après relecture**, avec la méthode publiée. Il répond aux environ 7 min par tâche de Lofty, qui ne retranchent pas les corrections (inspiré du **Lofty AI Index**).
4. **Carte « Valeur rendue »** : heures et euros rendus face aux 10 € d'abonnement, affichée dans l'application et dans un email hebdomadaire (inspirée des analytics de **Fyxer**).
5. **Extraction de l'offre et du compromis** : charger le PDF pour obtenir les dates clés, le calendrier jusqu'à l'acte, les conditions suspensives et les pièces bloquantes (CPCV au Portugal) (inspirée de **Leo Pro** et de l'extraction de contrats de Lofty).
6. **Skills de conformité chargés selon le contexte** : quand un client parle de financement, d'origine des fonds ou de diagnostics, Jaspe charge la règle FR ou PT et l'affiche avant le brouillon (inspiré des skills du Sales Agent **Lofty**).
7. **Packs de crédits pour les options** (estimations, staging à environ 1 $ par photo par intégration, minutes vocales), avec **trois mois d'usage illimité** en lancement (inspirés de **Fyxer** et **Structurely**).
8. **Serveur MCP Jaspe** : le conseiller pilote Jaspe depuis Claude ou ChatGPT, et Jaspe consomme les MCP de PriceHubble et Casafari pour le brief (inspiré de **Rechat**, **PriceHubble** et **Fyxer**).
9. **Commande vocale qui déclenche une tâche** (« crée le bien, relance M. Silva vendredi ») en français et en portugais, dans la voiture après le rendez-vous (inspirée de **Hektor Voice** et de la voix de **Leo CoPilot**).
10. **Ne pas construire un ISA vocal** : les conversions publiées sont faibles (1,7 % de rendez-vous) et l'obligation de transparence de l'AI Act s'applique. Proposer plutôt une intégration de Fonio ou de PriceHubble (leçon tirée d'**Ylopo** et **Structurely**).
