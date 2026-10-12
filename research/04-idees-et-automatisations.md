# 04 — Idées produit et automatisations NXT Agent

*Version du 11/10/2026. 398 idées (`src/data/ideas.json`), 100 routines (`routines.json` + `routines-extra.json`). Sources : audit documentaire (§ 4–8), backlog des 240 idées, catalogue des 60 routines, benchmark v2, recherches design et motion.*

Conventions : **Phase** P0 pilote → P3 expansion · **Effort** S < 1 sem., M 1–3 sem., L 1–2 mois, XL > 2 mois · **Impact** 1–5 · **Statut** « maquette » = visible dans la maquette actuelle (landing + CRM), sinon « proposé ». Numérotation L1–L9 alignée sur la maquette (L3 acquéreurs, L4 social, L5 voisinage).

## 1. Synthèse

- **Volume** : 398 idées sur 21 thèmes ; P0 : 104, P1 : 170, P2 : 104, P3 : 20 ; 56 déjà maquettées, 342 proposées.
- **Fil rouge** : NXT est l’agent du mandat vendeur — il prépare, produit les livrables qui font signer, prouve leur conformité et s’installe au-dessus du CRM existant.
- **Ce qui a changé en 2026** : démarchage téléphonique opt-in depuis le 11/08/2026 (le courrier, le contenu et l’inbound deviennent les canaux principaux) ; AI Act art. 50 depuis le 02/08/2026 (étiquetage des images virtuelles et des assistants IA) ; DPE 2026 (coefficient 1,9) ; facturation électronique.

### 1.1 Top 25 : fort impact, faible effort (P0–P1, effort S/M, 3 max par thème)

| # | ID | Idée | Thème | Phase | Effort | Impact |
|---|---|---|---|---|---|---|
| 1 | NX-005 | Simulation de reclassement DPE 2026 | Parcours vendeur D1–D5 | P0 | S | 5 |
| 2 | NX-007 | Pack « RDV prêt » envoyé la veille à 18 h | Parcours vendeur D1–D5 | P0 | S | 5 |
| 3 | NX-017 | Engagements pris pendant le RDV listés | Parcours vendeur D1–D5 | P0 | S | 5 |
| 4 | NX-026 | L1 remerciement prêt dans l’heure | Livrables L1–L9 | P0 | S | 5 |
| 5 | NX-041 | L9 statuts absent, non applicable, expiré | Livrables L1–L9 | P0 | S | 5 |
| 6 | NX-055 | Financement déclaré, vérifié et daté | Acquéreurs & matching | P0 | S | 5 |
| 7 | NX-114 | Bascule de la pige téléphonique vers le courrier | Prospection & territoire | P0 | S | 5 |
| 8 | NX-152 | Dépôt de pièces par lien ciblé | Portail client | P0 | S | 5 |
| 9 | NX-186 | Mandats proches d’expiration | Pilotage agence & réseau | P0 | S | 5 |
| 10 | NX-205 | Niveaux d’autonomie A / V / P visibles | Automatisations | P0 | S | 5 |
| 11 | NX-208 | Fenêtres calmes et horaires métier | Automatisations | P0 | S | 5 |
| 12 | NX-210 | Conditions d’arrêt métier | Automatisations | P0 | S | 5 |
| 13 | NX-224 | Exécution en un geste après validation | IA & copilote | P0 | S | 5 |
| 14 | NX-238 | Distinction visuelle fait / suggestion IA | IA & copilote | P0 | S | 5 |
| 15 | NX-285 | Créneaux légaux d’appel et compteur 4/30 jours | Conformité | P0 | S | 5 |
| 16 | NX-286 | Retrait de consentement en un geste | Conformité | P0 | S | 5 |
| 17 | NX-288 | Étiquette « image virtuelle » incrustée | Conformité | P0 | S | 5 |
| 18 | NX-334 | Palette de commandes ⌘K | UX, design & motion | P0 | S | 5 |
| 19 | NX-345 | Annulation possible pendant 6 secondes | UX, design & motion | P0 | S | 5 |
| 20 | NX-359 | Pilote Antibes de 60 jours mesuré | Croissance & monétisation | P0 | S | 5 |
| 21 | NX-360 | Offre Surcouche à 49 € par siège | Croissance & monétisation | P0 | S | 5 |
| 22 | NX-376 | Authentification forte obligatoire | Sécurité | P0 | S | 5 |
| 23 | NX-383 | Révocation immédiate au départ d’un conseiller | Sécurité | P0 | S | 5 |
| 24 | NX-390 | Signalement d’erreur factuelle en un clic | Observabilité | P0 | S | 5 |
| 25 | NX-060 | Alerte nouvelle opportunité sous 10 minutes | Acquéreurs & matching | P1 | S | 5 |

### 1.2 Dix paris différenciants

1. **Agent post-RDV** (NX-229) — Aucun concurrent public ne produit L1–L9 depuis un dossier unique ; c’est la promesse « dans l’heure » qui fait signer.
2. **Contrôle de cohérence inter-livrables** (NX-042) — Rend vérifiable ce que les autres génèrent : une surface, un prix, un DPE identiques partout.
3. **Bascule de la pige téléphonique vers le courrier** (NX-114) — Transforme l’interdiction du 11/08/2026 en opportunité commerciale immédiate pour les agences.
4. **Campagnes voisinage déclenchées par événement** (NX-111) — Le courrier licite devient le canal principal ; NXT l’automatise à partir des jalons réels.
5. **Simulation de reclassement DPE 2026** (NX-005) — ~850 000 logements F/G peuvent gagner une classe : argument de RDV et de prospection unique.
6. **Mode surcouche Hektor, Modelo, Apimo** (NX-264) — Lève le premier frein des réseaux (migration) et positionne NXT en couche neutre face aux bundles.
7. **L9 extraction des PV d’AG avec citation de page** (NX-040) — La preuve page par page crée la confiance du vendeur et du notaire, là où l’IA générique hallucine.
8. **Audit « ventes manquées » à l’onboarding** (NX-116) — Démontre la valeur dès la première heure en chiffrant le manque à gagner caché du fichier.
9. **Simulation vocale D4 liée au dossier** (NX-166) — Le coaching sur le vrai dossier du lendemain n’existe nulle part en France.
10. **Aucun chiffre sans source calculée** (NX-242) — Garantie anti-hallucination opposable : chaque nombre est tracé jusqu’à sa source et son millésime.

### 1.3 Dix quick wins design

1. **Palette de commandes ⌘K** (NX-334) — déjà maquettée : ajouter le mode « Demander à NXT » et les actions récentes.
2. **Annulation possible pendant 6 secondes** (NX-345) — toast avec compte à rebours sur toute action automatique ; rassure sur l’autonomie.
3. **États vides qui proposent l’action suivante** (NX-344) — une phrase + un bouton par écran ; zéro écran mort pendant le pilote.
4. **Respect de la préférence « réduire les animations »** (NX-342) — un `@media (prefers-reduced-motion)` global et une bascule dans Réglages.
5. **Microcopie précise et bienveillante** (NX-351) — réécrire erreurs et confirmations ; gain de confiance immédiat.
6. **Squelette IA révélé champ par champ** (NX-339) — déjà maquetté : généraliser à tous les livrables du studio.
7. **Curseur avant/après accessible au clavier** (NX-341) — flèches gauche/droite, rôle `slider`, étiquette AI Act toujours visible.
8. **Navigation clavier j/k entre fiches** (NX-338) — glissement vertical de 120 ms entre dossiers, à la Linear.
9. **Thème Nuit avec transition circulaire** (NX-337) — View Transitions API, 600 ms, tokens Calcaire/Nuit déjà définis.
10. **« Pourquoi ce score » sur chaque indicateur** (NX-247) — un popover standard réutilisé par chaleur, matching et potentiel.

## 2. Catalogue par thème

### Parcours vendeur D1–D5 (25)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-001 | Brief relationnel D1 sourcé et daté | Le conseiller arrive au RDV avec les faits utiles, leurs sources et les homonymes écartés. | P0 | M | 5 | feature | maquette |
| NX-002 | Détection et levée d’homonymie | Évite de préparer un rendez-vous sur le profil public d’une autre personne. | P0 | S | 4 | compliance | proposé |
| NX-003 | Étude marché D2 avec millésime DVF visible | Chaque comparable affiche date, source et motif d’inclusion ou d’exclusion. | P0 | M | 5 | data | maquette |
| NX-004 | Radar quartier D3 avec statut des projets | Distingue projet annoncé, autorisé et livré pour ne rien promettre de faux au vendeur. | P1 | M | 4 | data | maquette |
| NX-005 | Simulation de reclassement DPE 2026 | Montre au vendeur si son DPE F ou G peut gagner une classe avec le coefficient 1,9. | P0 | S | 5 | feature | proposé |
| NX-006 | État des risques Géorisques pré-rempli | L’ERP est prêt avant le RDV, avec lien vers la source officielle et date de consultation. | P1 | S | 4 | data | proposé |
| NX-007 | Pack « RDV prêt » envoyé la veille à 18 h | Brief, carte, comparables et liste des manques arrivent en un seul écran. | P0 | S | 5 | automation | proposé |
| NX-008 | Check-list conditionnelle SCI, indivision, succession, viager | Les bonnes questions et pièces apparaissent selon la situation juridique du vendeur. | P0 | M | 5 | feature | proposé |
| NX-009 | Questionnaire préparatoire rempli par le vendeur | Le vendeur renseigne surfaces, travaux et contraintes avant la visite, sans ressaisie. | P1 | S | 4 | feature | proposé |
| NX-010 | Trois objectifs d’entretien proposés par RDV | Exclusivité, prix et calendrier guident la conversation et se mesurent ensuite. | P1 | S | 3 | feature | proposé |
| NX-011 | Banque d’objections préparée par dossier | Le conseiller révise les 5 objections probables et les réponses validées par l’agence. | P1 | S | 4 | feature | proposé |
| NX-012 | Découverte D5 progressive par niveaux de complétude | Les livrables se débloquent au fil de la saisie au lieu d’exiger une fiche complète. | P0 | M | 5 | ux | maquette |
| NX-013 | Débrief vocal structuré en champs validables | Deux minutes de dictée deviennent une fiche vendeur à valider champ par champ. | P0 | M | 5 | feature | maquette |
| NX-014 | Niveau de confiance par champ du dossier | Chaque donnée affiche vérifiée, déclarée ou à confirmer avant d’être partagée. | P0 | S | 4 | data | proposé |
| NX-015 | Capture photo guidée pièce par pièce | Une liste de prises de vue évite de revenir chez le vendeur pour une photo manquante. | P1 | S | 4 | feature | proposé |
| NX-016 | Relevé de surfaces avec contrôle Carrez | Alerte si la somme des pièces diverge de la surface déclarée au mandat. | P1 | M | 4 | feature | proposé |
| NX-017 | Engagements pris pendant le RDV listés | Chaque promesse orale devient une tâche datée visible du vendeur et du conseiller. | P0 | S | 5 | feature | proposé |
| NX-018 | Motivation et calendrier déclarés, jamais déduits | Le projet vendeur repose sur ses propres mots, sans profilage psychologique. | P0 | S | 4 | compliance | proposé |
| NX-019 | Décideurs et co-vendeurs identifiés dès le RDV | Aucun mandat ne bloque faute d’avoir associé l’indivisaire ou l’usufruitier. | P0 | S | 4 | feature | proposé |
| NX-020 | Score de complétude du dossier vendeur | Une jauge indique ce qui manque encore pour produire L6, L7 et L9. | P0 | S | 4 | ux | maquette |
| NX-021 | Comparaison des préparations successives | Le second RDV montre ce qui a changé depuis le premier : prix, marché, pièces. | P2 | S | 3 | feature | proposé |
| NX-022 | Dossier vente-achat lié | Relie la vente et le projet d’achat du même foyer pour synchroniser les calendriers. | P1 | M | 4 | feature | proposé |
| NX-023 | Préparation vendeur non résident | Prévoit visio, procuration, fuseau horaire et langue pour les propriétaires à l’étranger. | P1 | S | 4 | feature | proposé |
| NX-024 | Rail visuel du parcours D1→L9 | Le conseiller voit l’étape, le livrable en attente et le prochain geste en un coup d’œil. | P0 | M | 5 | ux | maquette |
| NX-025 | Fiche bien structurée avec DPE et caractéristiques | Surfaces, DPE, exposition et équipements sont saisis une fois et réutilisés partout. | P0 | M | 4 | feature | maquette |

### Livrables L1–L9 (26)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-026 | L1 remerciement prêt dans l’heure | Le vendeur reçoit un mail personnalisé avant d’avoir appelé une agence concurrente. | P0 | S | 5 | feature | maquette |
| NX-027 | L1 avec prochaines étapes tirées de l’agenda | Les dates citées viennent du calendrier réel, jamais de la génération. | P0 | S | 4 | feature | proposé |
| NX-028 | L2 synthèse équipe en six lignes | L’équipe connaît le bien, le prix visé et les points sensibles sans ouvrir le dossier. | P0 | S | 4 | feature | maquette |
| NX-029 | L2 avis de valeur croisé à l’aveugle | Deux collègues donnent leur fourchette sans voir celle du conseiller avant validation de L7. | P1 | S | 4 | feature | proposé |
| NX-030 | L3 avant-première acquéreurs off-market | Les meilleurs acquéreurs voient le bien 72 h avant les portails, avec accord du vendeur. | P1 | M | 5 | feature | maquette |
| NX-031 | L4 kit social par jalon du mandat | Posts prêts pour nouveau mandat, baisse de prix, visite ouverte, compromis et vendu. | P1 | M | 4 | feature | maquette |
| NX-032 | L5 courrier voisinage « Aux occupants » | Lettre conforme avec QR d’opposition, prête à imprimer ou à router. | P1 | M | 5 | feature | maquette |
| NX-033 | L6 book de services modulaire | Le book n’assemble que les services réellement disponibles dans l’agence. | P0 | M | 5 | feature | maquette |
| NX-034 | L6 preuves locales automatiques | Le book cite les ventes de l’agence dans le secteur, avec délai et écart au prix affiché. | P1 | M | 5 | data | proposé |
| NX-035 | L7 estimation à fourchette et incertitude | Le vendeur comprend pourquoi la fourchette est large ou étroite et sur quels comparables. | P0 | M | 5 | feature | maquette |
| NX-036 | L7 scénarios de mise en vente | Compare prix ambitieux, prix marché et vente rapide avec un délai probable pour chacun. | P1 | M | 5 | feature | proposé |
| NX-037 | L7 trace des désaccords sur le prix | Le prix souhaité par le vendeur et l’avis de l’agent coexistent, motivés et datés. | P1 | S | 4 | feature | proposé |
| NX-038 | L8 home staging multi-styles respectant la structure | Trois styles proposés sans toucher aux ouvertures, aux volumes ni aux vues. | P0 | M | 5 | feature | maquette |
| NX-039 | L8 liste de travaux chiffrée et datée | Le vendeur voit le coût estimé des interventions simulées, avec la date des prix. | P2 | M | 3 | feature | proposé |
| NX-040 | L9 extraction des PV d’AG avec citation de page | Chaque point de vigilance renvoie à la page exacte du document source. | P0 | L | 5 | feature | maquette |
| NX-041 | L9 statuts absent, non applicable, expiré | Un document manquant n’est jamais présenté comme « aucun point bloquant ». | P0 | S | 5 | compliance | maquette |
| NX-042 | Contrôle de cohérence inter-livrables | Surface, prix, DPE et honoraires sont identiques dans les neuf livrables. | P0 | M | 5 | feature | proposé |
| NX-043 | Invalidation ciblée des livrables périmés | Modifier la surface ne régénère que les livrables qui en dépendent. | P1 | M | 4 | automation | proposé |
| NX-044 | Validation par lot dans le studio | Le conseiller approuve cinq livrables en une seule passe, champ par champ. | P0 | M | 4 | ux | maquette |
| NX-045 | Versions et différences de chaque livrable | On voit ce que l’IA a proposé et ce que le conseiller a corrigé. | P1 | S | 3 | feature | proposé |
| NX-046 | Traduction premium EN, IT, DE, RU | Les livrables partent dans la langue du vendeur ou de l’acquéreur international. | P0 | M | 5 | feature | proposé |
| NX-047 | Suivi d’ouverture des livrables | Le conseiller sait si le vendeur a ouvert l’estimation avant de l’appeler. | P1 | S | 4 | data | proposé |
| NX-048 | Gabarits de marque verrouillés par réseau | Logo, typographie et mentions légales ne peuvent pas être altérés localement. | P1 | M | 4 | feature | proposé |
| NX-049 | Book imprimé haut de gamme à la demande | Un book relié est commandé en un clic pour le second RDV d’une villa. | P2 | M | 3 | growth | proposé |
| NX-050 | Mini-site privé par dossier vendeur | Tous les livrables sont réunis sur une page élégante protégée par lien. | P1 | M | 4 | feature | proposé |
| NX-051 | Rapport vendeur hebdomadaire factuel | Visites, retours, vues portails et recommandations, sans aucun chiffre inventé. | P1 | M | 5 | automation | proposé |

### Acquéreurs & matching (21)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-052 | Projet acquéreur indispensable / souhaité | Les critères non négociables filtrent, les critères souhaités ne font que classer. | P0 | M | 5 | feature | maquette |
| NX-053 | Score de matching expliqué par critère | L’agent voit pourquoi un acquéreur correspond à 87 % et ce qui manque. | P0 | M | 5 | feature | maquette |
| NX-054 | Zones de recherche dessinées sur carte | L’acquéreur trace son périmètre (Cap d’Antibes, Juan-les-Pins) au lieu de lister des communes. | P1 | M | 4 | ux | proposé |
| NX-055 | Financement déclaré, vérifié et daté | Une attestation de financement expirée fait baisser la priorité de l’acquéreur. | P0 | S | 5 | feature | proposé |
| NX-056 | Profil acquéreur international | Pays, devise, conseil fiscal et besoin de traduction sont notés dès la découverte. | P1 | S | 4 | feature | proposé |
| NX-057 | Requalification acquéreur tous les 60 jours | L’acquéreur confirme ou ajuste son projet en un clic, la base reste fraîche. | P1 | S | 4 | automation | proposé |
| NX-058 | Apprentissage des motifs de refus | Un acquéreur qui refuse trois biens avec vis-à-vis se voit proposer ce critère. | P2 | M | 4 | feature | proposé |
| NX-059 | Sélection collaborative entre co-acquéreurs | Le couple commente et classe les biens dans le même espace partagé. | P2 | M | 3 | feature | proposé |
| NX-060 | Alerte nouvelle opportunité sous 10 minutes | Les acquéreurs chauds sont prévenus avant la concurrence. | P1 | S | 5 | automation | proposé |
| NX-061 | Anti-doublon de sollicitation inter-agences | Un acquéreur n’est pas contacté trois fois pour le même bien par le réseau. | P1 | M | 4 | compliance | proposé |
| NX-062 | Propriétaire du contact et partage tracé | Le partage d’un acquéreur entre agences suit une règle visible et journalisée. | P1 | M | 4 | feature | proposé |
| NX-063 | Comparateur de biens favoris | Prix au m², charges, DPE et distance à la mer côte à côte. | P2 | S | 3 | ux | proposé |
| NX-064 | Recherche inversée pour un acquéreur VIP | Le copilote fouille stock, off-market et mandats à venir pour un acquéreur prioritaire. | P1 | M | 5 | feature | proposé |
| NX-065 | Chasse off-market pour un acquéreur | Propose une lettre ciblée aux propriétaires du secteur recherché, dans le respect du RGPD. | P2 | L | 4 | growth | proposé |
| NX-066 | Suspension et réactivation d’une recherche | Une recherche en pause ne déclenche plus d’envoi mais reste en mémoire. | P1 | S | 3 | feature | proposé |
| NX-067 | Score de chaleur acquéreur explicable | Activité récente, visites et financement composent un score lisible. | P1 | S | 4 | data | maquette |
| NX-068 | Fiche projet acquéreur anonymisée | Présente le projet au vendeur sans divulguer l’identité de l’acquéreur. | P2 | S | 3 | feature | proposé |
| NX-069 | Pipeline acquéreurs par étape | Découverte, visites, offre, financement et acte affichés en colonnes. | P1 | S | 3 | ux | proposé |
| NX-070 | Références de ventes récentes dans le budget | Montre à l’acquéreur ce qui s’est vendu dans sa gamme et à quel prix. | P2 | S | 3 | data | proposé |
| NX-071 | Services d’installation pour acquéreurs étrangers | Propose écoles internationales, conciergerie et gestion de résidence secondaire. | P3 | M | 3 | growth | proposé |
| NX-072 | Fiche contact unifiée multi-rôles | Une même personne peut être vendeur, acquéreur et prescripteur sans doublon. | P0 | M | 5 | feature | maquette |

### Visites (16)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-073 | Agenda équipe avec types de RDV métier | Estimation, visite, signature et prospection sont colorées et filtrables. | P0 | M | 4 | ux | maquette |
| NX-074 | Prise de RDV de visite en libre-service | L’acquéreur choisit un créneau parmi les disponibilités du conseiller et du vendeur. | P1 | M | 4 | feature | proposé |
| NX-075 | Confirmation et rappel J-1 multilingue | Moins de visites manquées grâce à un rappel avec itinéraire et consignes d’accès. | P1 | S | 4 | automation | proposé |
| NX-076 | Bon de visite signé électroniquement | Le bon est signé sur mobile avant d’entrer, avec preuve horodatée. | P1 | S | 5 | compliance | proposé |
| NX-077 | Tournée de visites optimisée | Ordonne quatre visites selon le trafic et les contraintes des vendeurs. | P2 | M | 3 | feature | proposé |
| NX-078 | Compte rendu de visite vocal en 60 secondes | Le retour acquéreur est saisi en sortant, structuré en points forts et freins. | P1 | S | 5 | feature | proposé |
| NX-079 | Retour vendeur anonymisé et validé | Le vendeur reçoit la synthèse des visites sans données personnelles d’acquéreur. | P1 | S | 5 | feature | proposé |
| NX-080 | Visite à distance guidée en direct | Un acquéreur à Londres visite en visio avec l’agent sur place. | P2 | M | 4 | feature | proposé |
| NX-081 | Gestion des clés et des accès | Qui détient les clés, codes portail et alarme, avec historique de remise. | P2 | S | 3 | feature | proposé |
| NX-082 | Journée portes ouvertes avec inscriptions | Inscriptions, contrôle du financement et liste d’attente gérés automatiquement. | P2 | M | 3 | feature | proposé |
| NX-083 | Questionnaire acquéreur 2 h après la visite | Trois questions récoltent un avis sincère pendant que le souvenir est frais. | P1 | S | 4 | automation | proposé |
| NX-084 | Fiche visite consultable hors ligne | Plans, diagnostics et points clés restent disponibles sans réseau dans la villa. | P1 | S | 4 | feature | proposé |
| NX-085 | Détection des visites non débriefées | Une visite sans compte rendu sous 24 h crée automatiquement une tâche. | P1 | S | 4 | automation | proposé |
| NX-086 | Synthèse des objections récurrentes | Après cinq visites, le copilote dégage les objections dominantes et propose une action. | P1 | S | 5 | feature | proposé |
| NX-087 | Vérification d’identité pour biens prestige | L’identité du visiteur est contrôlée avant une visite de villa à plus de 3 M€. | P2 | M | 4 | compliance | proposé |
| NX-088 | Créneaux de visite approuvés par le vendeur | Le vendeur voit et accepte les créneaux sans appeler l’agence. | P1 | S | 4 | feature | proposé |

### Offres, compromis & acte (20)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-089 | Rédaction d’offre selon modèle approuvé | L’offre d’achat est générée avec conditions, validité et financement. | P1 | M | 5 | feature | proposé |
| NX-090 | Registre des offres horodaté | Chaque offre, contre-offre et décision garde son auteur et son heure. | P1 | S | 5 | compliance | maquette |
| NX-091 | Comparateur d’offres pour le vendeur | Prix net, conditions suspensives, financement et délai présentés côte à côte. | P1 | M | 5 | feature | proposé |
| NX-092 | Preuve de transmission de toutes les offres | Trace que chaque offre reçue a bien été présentée au vendeur. | P1 | S | 4 | compliance | proposé |
| NX-093 | Alerte offre proche d’expiration | Le conseiller est prévenu 24 h avant la fin de validité d’une offre. | P1 | S | 4 | automation | proposé |
| NX-094 | Pipeline transaction mandat → acte | Jalons, responsables et échéances visibles par toutes les parties. | P0 | M | 5 | feature | maquette |
| NX-095 | Conditions suspensives avec compte à rebours | Prêt, permis, préemption : chaque échéance a un propriétaire et une date. | P1 | S | 5 | feature | proposé |
| NX-096 | Espace partagé avec le notaire | Le notaire accède aux seules pièces utiles et dépose le projet d’acte. | P1 | M | 5 | feature | proposé |
| NX-097 | Check-list avant signature du compromis | Diagnostics, pièces copro et état civil sont complets le jour J. | P1 | S | 5 | feature | proposé |
| NX-098 | Suivi du délai de rétractation SRU | Les 10 jours sont calculés à partir de la notification réelle. | P1 | S | 4 | compliance | proposé |
| NX-099 | Suivi du prêt avec le courtier invité | Le courtier met à jour l’avancement du financement directement dans le dossier. | P2 | M | 4 | feature | proposé |
| NX-100 | Suivi du droit de préemption urbain | La DIA et son délai de deux mois sont surveillés automatiquement. | P1 | S | 4 | feature | proposé |
| NX-101 | Questionnaire notaire pré-rempli | Le dossier transmis au notaire est complet dès le premier envoi. | P1 | M | 4 | feature | proposé |
| NX-102 | Prévision probabiliste de la date d’acte | Estime la date réelle de signature selon l’avancement des jalons. | P2 | M | 3 | data | proposé |
| NX-103 | Transactions en danger | Signale les dossiers dont un jalon glisse de plus de 7 jours. | P1 | S | 5 | automation | proposé |
| NX-104 | Analyse des ventes abandonnées | Classe les causes d’échec : financement, diagnostic, rétractation, prix. | P2 | S | 3 | data | proposé |
| NX-105 | Créneau de signature commun à toutes les parties | Trouve un rendez-vous compatible vendeur, acquéreur et deux notaires. | P2 | M | 3 | feature | proposé |
| NX-106 | Check-list de remise des clés | Relevés de compteurs, clés et documents remis sont tracés à l’acte. | P2 | S | 3 | feature | proposé |
| NX-107 | Demande d’avis et de recommandation J+30 | Un mois après l’acte, le client satisfait est invité à recommander l’agence. | P1 | S | 4 | growth | proposé |
| NX-108 | Archivage probatoire du dossier clôturé | Le dossier est scellé, horodaté et conservé selon la durée légale. | P1 | M | 4 | compliance | proposé |

### Prospection & territoire (22)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-109 | Carte de prospection DVF et mandats agence | Visualise les rues à forte rotation et les ventes réalisées par l’agence. | P1 | M | 5 | feature | maquette |
| NX-110 | Signaux vendeurs licites et expliqués | Durée de détention, DPE reclassé et ventes voisines créent une piste motivée. | P1 | M | 5 | feature | maquette |
| NX-111 | Campagnes voisinage déclenchées par événement | Nouveau mandat, vente ou DPE publié génèrent une lettre de quartier. | P1 | M | 5 | automation | proposé |
| NX-112 | Routage postal intégré avec coût affiché | Impression, affranchissement et suivi sans quitter l’application. | P2 | L | 4 | feature | proposé |
| NX-113 | Liste d’opposition réseau partagée | Une opposition reçue par une agence s’applique immédiatement à toutes. | P0 | M | 5 | compliance | proposé |
| NX-114 | Bascule de la pige téléphonique vers le courrier | Les fichiers de pige sans consentement deviennent des campagnes postales licites. | P0 | S | 5 | growth | proposé |
| NX-115 | Page d’estimation en ligne de l’agence | Capte des vendeurs entrants avec une estimation honnête et une prise de RDV. | P1 | M | 5 | growth | proposé |
| NX-116 | Audit « ventes manquées » à l’onboarding | Croise DVF et CRM pour montrer les vendeurs connus partis chez un concurrent. | P1 | M | 5 | growth | proposé |
| NX-117 | Journée sans RDV transformée en plan d’action | Propose une tournée de boîtage et cinq relances consenties prioritaires. | P1 | S | 4 | automation | proposé |
| NX-118 | Boîtage terrain avec suivi volontaire | Rues couvertes, nombre de lettres et retours sont mesurés. | P2 | M | 3 | feature | proposé |
| NX-119 | Veille des nouveaux DPE ADEME du secteur | Repère les DPE F ou G récemment établis, souvent signe d’un projet de vente. | P2 | M | 4 | data | proposé |
| NX-120 | Veille des permis de construire et divisions | Les permis déposés signalent des projets de vente ou d’achat dans le secteur. | P2 | M | 3 | data | proposé |
| NX-121 | Anniversaire d’achat des anciens clients | Rappelle aux anciens acquéreurs l’évolution de leur quartier 5 ans après. | P1 | S | 4 | automation | proposé |
| NX-122 | Suivi des prescripteurs locaux | Notaires, gardiens et conciergeries : apports d’affaires et remerciements tracés. | P1 | S | 4 | feature | proposé |
| NX-123 | Cercle de propriétaires prestige sur consentement | Fiches relationnelles de propriétaires alimentées uniquement par leur accord. | P2 | M | 4 | feature | proposé |
| NX-124 | Secteurs attribués par conseiller | Chaque rue a un responsable, ce qui évite la double prospection. | P1 | S | 4 | feature | proposé |
| NX-125 | Pages quartier SEO mises à jour automatiquement | Une page par quartier reprend les ventes et projets récents de l’agence. | P2 | M | 4 | growth | proposé |
| NX-126 | Visibilité dans les assistants IA (GEO, llms.txt) | Les biens et l’agence deviennent citables par ChatGPT, Claude et Gemini. | P2 | M | 4 | growth | proposé |
| NX-127 | Réponses aux avis Google proposées | Le conseiller valide une réponse personnalisée à chaque nouvel avis. | P1 | S | 4 | growth | proposé |
| NX-128 | Score de potentiel par rue | Combine rotation, prix et ancienneté de détention pour prioriser la prospection. | P2 | M | 4 | data | proposé |
| NX-129 | Événements privés de l’agence | Invitations, inscriptions et suivi des contacts d’une soirée vernissage. | P3 | M | 2 | growth | proposé |
| NX-130 | Partenariats yachting, golf et conciergerie | Suivi des contacts apportés par les partenaires du luxe local. | P3 | S | 3 | growth | proposé |

### Marketing & diffusion (19)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-131 | Annonce maître déclinée par portail | Une seule source de vérité adaptée à chaque portail généraliste et luxe. | P1 | M | 5 | feature | proposé |
| NX-132 | Multidiffusion via passerelle | Publication et retrait sur tous les portails en un clic. | P2 | L | 4 | feature | proposé |
| NX-133 | Diffusion sur portails internationaux luxe | Les villas atteignent les acheteurs étrangers via les portails spécialisés. | P2 | M | 4 | growth | proposé |
| NX-134 | Retouche photo technique sans tromperie | Redressement, lumière et ciel corrigés sans modifier les caractéristiques du bien. | P1 | M | 4 | feature | proposé |
| NX-135 | Vidéo verticale automatique de 30 secondes | Une vidéo prête pour Reels et Stories est générée depuis photos et annonce. | P1 | M | 4 | feature | proposé |
| NX-136 | Brochure et fiche vitrine imprimables | Fiche vitrine et brochure A4 sont produites depuis le même dossier. | P1 | S | 4 | feature | proposé |
| NX-137 | Calendrier éditorial social de l’agence | Planifie un mois de posts biens, quartier et ventes réalisées. | P2 | M | 3 | feature | proposé |
| NX-138 | Publicité sociale ciblée avec rapport vendeur | Une campagne lancée sur un bien montre ses résultats réels au vendeur. | P2 | M | 4 | growth | proposé |
| NX-139 | Newsletter acquéreurs segmentée | Envoi mensuel des nouveautés selon les critères de chaque abonné. | P2 | M | 3 | feature | proposé |
| NX-140 | Attribution des contacts aux annonces | Chaque lead entrant est rattaché à son portail et à son annonce. | P1 | S | 4 | data | proposé |
| NX-141 | Statistiques portails réellement connectées | Vues, contacts et favoris sont importés, jamais estimés. | P1 | M | 4 | data | proposé |
| NX-142 | Arrêt coordonné des supports après compromis | Tous les supports passent « sous compromis » le même jour. | P1 | S | 4 | automation | proposé |
| NX-143 | Visite 3D et plans liés à l’annonce | Matterport et plans sont rattachés au bien et repris dans chaque support. | P2 | S | 3 | feature | proposé |
| NX-144 | Textes alternatifs des photos publiées | Chaque photo diffusée a une description lisible par les lecteurs d’écran. | P2 | S | 2 | ux | proposé |
| NX-145 | Diffusion discrète off-market par lien nominatif | Partage restreint, filigrané au nom du destinataire et expirant. | P1 | M | 5 | feature | proposé |
| NX-146 | Filigrane et protection des photos | Limite la réutilisation des photos par des concurrents ou des fraudeurs. | P2 | S | 3 | feature | proposé |
| NX-147 | Test A/B des titres d’annonce | Compare deux accroches sur un même bien et mesure les contacts obtenus. | P3 | M | 3 | growth | proposé |
| NX-148 | Bibliothèque de campagnes réseau | Les agences reprennent une campagne validée par le siège en quelques clics. | P2 | M | 3 | feature | proposé |
| NX-149 | Panneau « À vendre » avec QR traçable | Le panneau renvoie vers le mini-site du bien et compte les scans. | P2 | S | 3 | growth | proposé |

### Portail client (16)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-150 | Portail vendeur sous marque agence | Le vendeur suit visites, offres, documents et actions en temps réel. | P1 | L | 5 | feature | proposé |
| NX-151 | Fil d’activité vendeur avec preuves | Chaque action de l’agence apparaît avec sa date et sa preuve. | P1 | M | 5 | feature | proposé |
| NX-152 | Dépôt de pièces par lien ciblé | Le vendeur dépose le PV d’AG demandé sans créer de compte. | P0 | S | 5 | feature | proposé |
| NX-153 | Validation vendeur des médias et textes | Le vendeur approuve photos et annonce avant toute diffusion. | P1 | S | 4 | feature | proposé |
| NX-154 | Signature électronique dans le portail | Mandat, avenant de prix et bons sont signés sans déplacement. | P1 | M | 5 | feature | proposé |
| NX-155 | Portail acquéreur de la sélection à l’acte | L’acquéreur suit sélection, visites, offres et étapes jusqu’à la signature. | P2 | L | 4 | feature | proposé |
| NX-156 | Accès invités notaire, courtier, diagnostiqueur | Accès limité dans le temps et au seul périmètre utile. | P1 | M | 4 | feature | proposé |
| NX-157 | Messagerie sécurisée par dossier | Les échanges restent au dossier au lieu d’être dispersés dans les messageries. | P2 | M | 4 | feature | proposé |
| NX-158 | Portail vendeur multilingue | Le vendeur suisse ou britannique suit sa vente dans sa langue. | P1 | S | 4 | feature | proposé |
| NX-159 | Journal des preuves de diffusion | Le vendeur voit captures d’annonces publiées, dates et portails. | P1 | S | 4 | feature | proposé |
| NX-160 | Réservation d’un point d’étape par le vendeur | Le vendeur réserve un créneau dans l’agenda du conseiller. | P2 | S | 3 | feature | proposé |
| NX-161 | Correction des données par le client | Le client signale une erreur, tracée puis validée par le conseiller. | P1 | S | 3 | compliance | proposé |
| NX-162 | Droits différenciés par co-vendeur | Chaque indivisaire accède au dossier avec ses propres droits. | P1 | M | 4 | feature | proposé |
| NX-163 | Notifications client configurables | Le client choisit canal et fréquence : email, SMS ou WhatsApp. | P1 | S | 3 | ux | proposé |
| NX-164 | Satisfaction mesurée à chaque étape | Mesure la satisfaction après estimation, mandat et acte. | P2 | S | 3 | data | proposé |
| NX-165 | Portail installable en application web | Le portail s’installe sur le téléphone sans passer par un store. | P2 | M | 3 | ux | proposé |

### Coaching & formation (16)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-166 | Simulation vocale D4 liée au dossier | Le conseiller répète son RDV face à un vendeur simulé avec les vraies objections. | P1 | L | 5 | feature | maquette |
| NX-167 | Grille de feedback publiée et observable | Le feedback évalue des comportements, jamais la personnalité. | P1 | S | 4 | feature | maquette |
| NX-168 | Feedback cité dans la transcription | Chaque conseil renvoie au passage exact de la simulation. | P1 | M | 4 | feature | proposé |
| NX-169 | Simulations privées par défaut | Les entraînements restent privés sauf partage volontaire au manager. | P0 | S | 4 | compliance | proposé |
| NX-170 | Parcours d’intégration du nouveau conseiller | Trente jours de modules, simulations et premiers dossiers accompagnés. | P2 | M | 4 | feature | proposé |
| NX-171 | Scénarios réseau avec variantes locales | Le siège publie les scénarios, l’agence les adapte au marché d’Antibes. | P2 | M | 3 | feature | proposé |
| NX-172 | Micro-entraînement de 5 minutes avant RDV | Une objection ciblée à répéter juste avant d’entrer chez le vendeur. | P1 | S | 4 | feature | proposé |
| NX-173 | Analyse des appels enregistrés avec accord | Les appels consentis donnent un retour sur l’écoute et la qualité des questions. | P2 | L | 4 | feature | proposé |
| NX-174 | Plan de progression personnel | Trois axes, exercices et date de revue choisis par le conseiller. | P2 | S | 3 | feature | proposé |
| NX-175 | Bibliothèque d’extraits de RDV réussis | Des moments clés anonymisés et approuvés servent d’exemples au réseau. | P2 | M | 3 | feature | proposé |
| NX-176 | Coaching manager suggéré par les tendances | Propose une session quand le taux d’exclusivité baisse sur 8 semaines. | P2 | S | 4 | automation | proposé |
| NX-177 | Entraînement en langue étrangère | Simulations en anglais ou en italien pour la clientèle internationale. | P2 | M | 4 | feature | proposé |
| NX-178 | Quiz réglementaire ALUR, LCB-FT, démarchage | Valide les connaissances exigées avant les situations à risque. | P2 | S | 3 | compliance | proposé |
| NX-179 | Suivi des heures de formation continue | Compte les 42 heures sur 3 ans exigées pour le renouvellement de la carte. | P2 | S | 3 | compliance | proposé |
| NX-180 | Contestation du feedback par le conseiller | Le conseiller peut annoter ou contester une évaluation. | P2 | S | 2 | feature | proposé |
| NX-181 | Défis d’équipe hebdomadaires | Un objectif collectif, par exemple cinq exclusivités, avec progression visible. | P3 | S | 2 | growth | proposé |

### Pilotage agence & réseau (22)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-182 | Tableau de bord du jour de l’agence | CA signé, mandats, temps gagné et transformation réunis en un écran. | P0 | M | 5 | feature | maquette |
| NX-183 | Entonnoir estimation → mandat → vente | Taux de passage par étape et par conseiller sur la période choisie. | P1 | M | 5 | data | maquette |
| NX-184 | Délai RDV → suivi validé, médiane et p90 | Mesure la réactivité réelle après chaque rendez-vous vendeur. | P1 | S | 5 | data | proposé |
| NX-185 | Prévision de CA pondérée | CA attendu par mois selon la probabilité de chaque transaction. | P1 | M | 5 | data | proposé |
| NX-186 | Mandats proches d’expiration | Liste des mandats à renouveler dans les 30 jours avec leur bilan. | P0 | S | 5 | automation | proposé |
| NX-187 | Taux d’exclusivité par conseiller | Suit la part de mandats exclusifs, levier clé du haut de gamme. | P1 | S | 4 | data | proposé |
| NX-188 | Réunion commerciale préparée | Ordre du jour, dossiers bloqués et décisions converties en tâches. | P1 | M | 4 | feature | proposé |
| NX-189 | Console réseau hiérarchique | Réseau, région, agence et équipe avec agrégats comparables. | P2 | L | 4 | feature | proposé |
| NX-190 | Comparaison contextualisée entre agences | Compare à marché équivalent pour éviter les jugements injustes. | P2 | M | 4 | data | proposé |
| NX-191 | Adoption par fonctionnalité et par cohorte | Montre quelles agences utilisent vraiment les livrables. | P1 | S | 4 | data | proposé |
| NX-192 | Qualité des dossiers par agence | Complétude, sources et pièces manquantes mesurées chaque semaine. | P1 | S | 4 | data | proposé |
| NX-193 | Objectifs négociés et suivis | Objectifs annuels déclinés par mois avec écart expliqué. | P2 | S | 3 | feature | proposé |
| NX-194 | Rapport de direction prêt à commenter | Un rapport mensuel avec faits, écarts et questions ouvertes. | P2 | M | 4 | feature | proposé |
| NX-195 | Stock et âge moyen des mandats | Repère les biens qui vieillissent et la cause probable. | P1 | S | 4 | data | proposé |
| NX-196 | Fil d’activité de l’agence | Succès et alertes de l’équipe s’affichent en temps réel. | P0 | S | 3 | ux | maquette |
| NX-197 | Coût et marge par dossier vendeur validé | Rapproche coûts IA, images, courrier et honoraires encaissés. | P1 | M | 4 | data | proposé |
| NX-198 | Valorisation des progrès plutôt que palmarès | Met en avant les progrès individuels au lieu d’un classement punitif. | P2 | S | 2 | ux | proposé |
| NX-199 | Part de marché locale de l’agence | Part de l’agence dans les ventes DVF de chaque secteur. | P2 | M | 4 | data | proposé |
| NX-200 | Délégation et intérim de direction | Un directeur absent délègue ses validations pour une période définie. | P1 | S | 3 | feature | proposé |
| NX-201 | Déploiement par vagues avec agences témoins | Mesure l’effet réel de NXT entre agences pilotes et témoins. | P2 | M | 4 | data | proposé |
| NX-202 | Alertes de dérive d’activité | Signale une baisse anormale d’activité ou de qualité sur 4 semaines. | P2 | S | 3 | automation | proposé |
| NX-203 | Export financier pour la direction | Honoraires encaissés, prévisionnels et rétrocessions exportés. | P2 | M | 3 | data | proposé |

### Automatisations (17)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-204 | Catalogue de 100 routines métier | Le conseiller active une routine éprouvée au lieu de la construire. | P0 | M | 5 | automation | maquette |
| NX-205 | Niveaux d’autonomie A / V / P visibles | Chaque routine indique si elle agit seule, attend validation ou propose. | P0 | S | 5 | ux | maquette |
| NX-206 | Constructeur de routine avec aperçu | Simule une routine sur un dossier réel avant de l’activer. | P1 | L | 4 | automation | proposé |
| NX-207 | Journal d’exécution par routine | Qui, quand, sur quel dossier et avec quel résultat. | P0 | M | 5 | automation | maquette |
| NX-208 | Fenêtres calmes et horaires métier | Aucune notification client le dimanche ou après 20 h. | P0 | S | 5 | automation | proposé |
| NX-209 | Déduplication des actions entre routines | Un même mail n’est jamais envoyé deux fois par deux routines. | P0 | M | 5 | automation | proposé |
| NX-210 | Conditions d’arrêt métier | Une relance s’arrête à la signature, au refus ou à l’opposition. | P0 | S | 5 | automation | proposé |
| NX-211 | Plafonds de coût et de volume | Une routine ne peut pas dépasser son budget mensuel. | P0 | S | 4 | automation | proposé |
| NX-212 | Centre des échecs et reprise sécurisée | Les exécutions bloquées se rejouent sans créer de doublon. | P0 | M | 4 | automation | proposé |
| NX-213 | Versions et retour arrière des routines | Une modification malheureuse se défait en un clic. | P1 | S | 3 | automation | proposé |
| NX-214 | Mesure d’utilité par routine | Temps gagné, taux d’acceptation et désactivations suivis par routine. | P1 | S | 4 | data | proposé |
| NX-215 | Routines héritées du réseau | Le siège publie, l’agence active et ajuste dans les limites permises. | P2 | M | 4 | automation | proposé |
| NX-216 | Déclencheurs géolocalisés volontaires | Le débrief démarre quand le conseiller quitte l’adresse du RDV. | P1 | M | 4 | automation | proposé |
| NX-217 | Routine décrite en langage naturel | « Relance les vendeurs sans nouvelles depuis 10 jours » devient une règle. | P2 | L | 4 | automation | proposé |
| NX-218 | Bac à sable sur données de démonstration | Teste une routine sans toucher aux vrais clients. | P1 | S | 3 | automation | proposé |
| NX-219 | Pause d’urgence de tous les envois | Un interrupteur arrête toutes les actions sortantes de l’agence. | P0 | S | 5 | automation | proposé |
| NX-220 | Suggestion de routine selon les gestes répétés | Propose une routine quand un geste manuel se répète chaque semaine. | P2 | M | 3 | automation | proposé |

### IA & copilote (27)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-221 | Brief du matin expliqué | Chaque action du jour est proposée avec son « pourquoi ». | P0 | M | 5 | feature | maquette |
| NX-222 | Copilote contextuel au dossier ouvert | Le copilote connaît le dossier affiché sans qu’on le lui décrive. | P0 | M | 5 | feature | maquette |
| NX-223 | File de validation unique | Tout ce que l’IA propose arrive au même endroit : approuver, modifier, rejeter. | P0 | M | 5 | ux | maquette |
| NX-224 | Exécution en un geste après validation | Le mail validé part, la tâche se crée, le livrable s’archive. | P0 | S | 5 | feature | maquette |
| NX-225 | Tâches générées et priorisées par l’IA | Les tâches créées par le copilote sont marquées et triées par échéance. | P0 | S | 4 | feature | maquette |
| NX-226 | Mémoire relationnelle par client | Le copilote retient les préférences déclarées : langue, canal, horaires. | P1 | M | 4 | feature | proposé |
| NX-227 | Mémoire des corrections du conseiller | Les reformulations récurrentes deviennent le style rédactionnel par défaut. | P2 | M | 4 | feature | proposé |
| NX-228 | Agent de préparation de RDV | Assemble D1–D3 seul dès qu’un RDV vendeur est créé. | P0 | L | 5 | automation | maquette |
| NX-229 | Agent post-RDV | Produit L1–L9 en parallèle et les présente prêts à valider. | P0 | L | 5 | automation | maquette |
| NX-230 | Agent transaction | Suit les jalons du compromis à l’acte et relance les pièces manquantes. | P1 | L | 5 | automation | proposé |
| NX-231 | Agent de qualification entrante 24/7 | Répond aux leads portails et WhatsApp puis passe la main à l’humain. | P1 | L | 4 | automation | proposé |
| NX-232 | Agent vocal entrant identifié comme IA | Prend les appels hors horaires en se présentant comme assistant IA. | P2 | L | 4 | feature | proposé |
| NX-233 | Détection des oublis | RDV sans suivi, mandat sans rapport, compromis sans pièce sont signalés. | P0 | M | 5 | automation | proposé |
| NX-234 | Résumé d’appel vers fiche et tâches | Un appel consenti devient une note structurée et deux tâches. | P1 | M | 4 | feature | proposé |
| NX-235 | Questions sur documents avec citations | Le copilote répond sur un règlement de copropriété en citant la page. | P1 | M | 5 | feature | proposé |
| NX-236 | Questions chiffrées sur ses propres données | « Combien de mandats exclusifs ce trimestre ? » est répondu avec le calcul visible. | P1 | M | 4 | feature | proposé |
| NX-237 | Dictée mains libres en voiture | Le conseiller dicte son débrief en conduisant, sans regarder l’écran. | P1 | M | 4 | feature | maquette |
| NX-238 | Distinction visuelle fait / suggestion IA | Les contenus générés restent marqués jusqu’à leur validation. | P0 | S | 5 | compliance | proposé |
| NX-239 | Serveur MCP NXT | Le conseiller interroge ses dossiers depuis Claude ou ChatGPT, sous contrôle. | P2 | L | 4 | data | proposé |
| NX-240 | Routage des modèles selon la tâche | Modèle rapide pour le tri, modèle expert pour l’estimation. | P1 | M | 3 | data | proposé |
| NX-241 | Évaluation sur dossiers de référence | Chaque nouvelle version IA est testée sur 50 dossiers témoins avant déploiement. | P1 | M | 4 | data | proposé |
| NX-242 | Aucun chiffre sans source calculée | Tout nombre d’un livrable provient d’un calcul déterministe tracé. | P0 | M | 5 | compliance | proposé |
| NX-243 | Copilote multilingue | Le copilote répond et rédige en anglais, italien, allemand et russe. | P1 | S | 4 | feature | proposé |
| NX-244 | Coût et délai affichés avant génération lourde | Staging, vidéo ou campagne : le prix est connu avant de lancer. | P1 | S | 4 | ux | proposé |
| NX-245 | Agent de veille marché hebdomadaire | Résume ventes, baisses de prix et nouveaux concurrents du secteur. | P2 | M | 4 | automation | proposé |
| NX-246 | Stratégie de contre-offre argumentée | Propose une réponse à une offre basse appuyée sur les comparables. | P2 | M | 4 | feature | proposé |
| NX-247 | « Pourquoi ce score » sur chaque indicateur | Tout score de chaleur, matching ou potentiel s’ouvre sur ses facteurs. | P1 | S | 4 | ux | proposé |

### Mobile terrain & hors ligne (16)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-248 | Application terrain utilisable à une main | Les actions clés restent accessibles au pouce pendant une visite. | P1 | L | 5 | ux | proposé |
| NX-249 | Dossiers du jour disponibles hors ligne | Les dossiers des RDV du jour sont téléchargés automatiquement le matin. | P1 | L | 5 | feature | proposé |
| NX-250 | Synchronisation avec résolution de conflits | Une donnée saisie hors ligne ne remplace pas en silence une valeur plus récente. | P1 | M | 4 | data | proposé |
| NX-251 | Scan de documents avec OCR | Taxe foncière ou DPE photographiés deviennent des champs à valider. | P1 | M | 4 | feature | proposé |
| NX-252 | Relevé des pièces par LiDAR | Les surfaces sont mesurées au téléphone et versées au dossier. | P3 | L | 3 | feature | proposé |
| NX-253 | Notes rapides datées et localisées | Une note prise devant la villa est rattachée au bon dossier. | P1 | S | 3 | feature | proposé |
| NX-254 | Widget « prochain RDV » sur l’écran d’accueil | Adresse, brief et itinéraire accessibles en un geste. | P2 | S | 3 | ux | proposé |
| NX-255 | Heure de départ conseillée selon le trafic | Prévient quand partir pour arriver à l’heure malgré les bouchons. | P2 | S | 3 | feature | proposé |
| NX-256 | Mode visite silencieux et confidentiel | Masque notifications et informations sensibles pendant une visite. | P1 | S | 4 | ux | proposé |
| NX-257 | Appareil photo avec gabarits de cadrage | Des guides de composition garantissent des photos homogènes. | P2 | M | 3 | feature | proposé |
| NX-258 | Débrief lancé depuis la montre | Le conseiller démarre la dictée du débrief depuis son poignet. | P3 | M | 2 | feature | proposé |
| NX-259 | Envoi d’un bien à un acquéreur en deux gestes | La fiche part depuis le terrain sans revenir au bureau. | P1 | S | 4 | feature | proposé |
| NX-260 | Signature du mandat sur tablette en RDV | Le mandat est signé sur place avec pièce d’identité scannée. | P1 | M | 5 | feature | proposé |
| NX-261 | Signalement d’incident dans un bien | Dégât ou alarme crée une alerte et prévient le propriétaire. | P2 | S | 3 | feature | proposé |
| NX-262 | Kilométrage et frais saisis à la voix | Les déplacements alimentent automatiquement la note de frais. | P3 | S | 2 | feature | proposé |
| NX-263 | Notifications push regroupées et utiles | Seules les alertes importantes passent, regroupées par dossier. | P1 | S | 4 | ux | proposé |

### Données & intégrations (20)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-264 | Mode surcouche Hektor, Modelo, Apimo | NXT s’ajoute au CRM existant sans double saisie. | P0 | XL | 5 | data | proposé |
| NX-265 | Import CRM avec correspondance des champs | Migration assistée champ par champ avec rapport d’écarts. | P0 | L | 5 | data | proposé |
| NX-266 | Synchronisation agenda Google et Outlook | Un RDV créé dans l’agenda déclenche automatiquement la préparation. | P0 | M | 5 | data | maquette |
| NX-267 | Messagerie Gmail et Outlook reliée | Les mails clients sont rattachés au bon dossier automatiquement. | P1 | M | 4 | data | proposé |
| NX-268 | WhatsApp Business avec coût par message | Les échanges sont archivés au dossier et leur coût suivi. | P1 | M | 4 | data | proposé |
| NX-269 | DVF, cadastre et INSEE intégrés | Comparables et parcelles sont disponibles sans abonnement tiers. | P0 | M | 5 | data | maquette |
| NX-270 | DPE officiel ADEME retrouvé par adresse | Le DPE enregistré est rattaché au bien et à sa date de validité. | P0 | S | 4 | data | proposé |
| NX-271 | Urbanisme PLU et zonage consultés | Zonage et servitudes affichés avec la date de consultation. | P1 | M | 4 | data | proposé |
| NX-272 | Connecteur de signature électronique | Envoi, relance et récupération des documents signés sans ressaisie. | P1 | M | 5 | data | proposé |
| NX-273 | API publique documentée et webhooks | Le réseau connecte ses propres outils de manière fiable. | P2 | L | 4 | data | proposé |
| NX-274 | Connecteur téléphonie d’entreprise | Les appels sont journalisés au dossier, avec consentement. | P2 | M | 3 | data | proposé |
| NX-275 | Connecteur logiciel comptable | Les factures d’honoraires partent vers la comptabilité sans ressaisie. | P2 | M | 3 | data | proposé |
| NX-276 | Centre des connexions par agence | État, dernier succès et erreurs de chaque intégration. | P1 | S | 4 | data | maquette |
| NX-277 | Journal des conflits de synchronisation | Montre les écarts entre NXT et le CRM et qui doit trancher. | P1 | M | 4 | data | proposé |
| NX-278 | Export complet en formats ouverts | L’agence récupère toutes ses données à tout moment. | P0 | S | 4 | data | proposé |
| NX-279 | Dictionnaire métier partagé | Une seule définition de « mandat actif » pour tout le réseau. | P1 | S | 3 | data | proposé |
| NX-280 | Annonces concurrentes du secteur | Les biens en vente ailleurs alimentent l’analyse de positionnement. | P2 | M | 4 | data | proposé |
| NX-281 | Registre national des copropriétés | Numéro d’immatriculation et données du registre repris automatiquement. | P1 | S | 4 | data | proposé |
| NX-282 | Import Excel d’acquéreurs dédoublonné | Un fichier d’acquéreurs est fusionné sans créer de doublons. | P0 | S | 4 | data | proposé |
| NX-283 | Calendrier des jours fériés et vacances | Les routines respectent jours ouvrés et périodes locales. | P1 | S | 2 | data | proposé |

### Conformité (24)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-284 | Registre de consentement par contact et canal | Preuve, finalité, date et expiration à un an conservées trois ans. | P0 | M | 5 | compliance | proposé |
| NX-285 | Créneaux légaux d’appel et compteur 4/30 jours | Le bouton d’appel se grise hors créneau légal ou quota atteint. | P0 | S | 5 | compliance | proposé |
| NX-286 | Retrait de consentement en un geste | Un « stop » oral saisi en une touche arrête toutes les sollicitations. | P0 | S | 5 | compliance | proposé |
| NX-287 | Contrôleur de mentions d’annonce bloquant | Honoraires TTC en %, DPE/GES et mention F/G vérifiés avant tout export. | P0 | M | 5 | compliance | proposé |
| NX-288 | Étiquette « image virtuelle » incrustée | L’étiquette AI Act est apposée sur chaque visuel généré ou modifié. | P0 | S | 5 | compliance | maquette |
| NX-289 | Métadonnées C2PA et IPTC sur les médias générés | Le marquage machine-lisible est intégré aux fichiers diffusés. | P1 | M | 4 | compliance | proposé |
| NX-290 | Mention « assistant IA » sur tout agent conversationnel | Le client sait toujours qu’il échange avec une IA. | P0 | S | 5 | compliance | proposé |
| NX-291 | Règles anti-tromperie du staging | Interdit d’effacer fissures et vis-à-vis ou de modifier les volumes. | P0 | M | 5 | compliance | proposé |
| NX-292 | Vigilance LCB-FT et déclaration Tracfin | Identification, évaluation du risque et alerte avant le compromis. | P1 | L | 5 | compliance | proposé |
| NX-293 | Contrôle PPE et gels d’avoirs | Les parties sont vérifiées contre les listes officielles. | P1 | M | 5 | compliance | proposé |
| NX-294 | Origine des fonds documentée | Les justificatifs d’apport sont demandés et conservés pour les montants élevés. | P1 | M | 5 | compliance | proposé |
| NX-295 | Registre des mandats électronique | Numérotation continue et inaltérable conforme à la loi Hoguet. | P0 | M | 5 | compliance | proposé |
| NX-296 | Durées de conservation et purge automatique | Les prospects inactifs depuis trois ans sont anonymisés. | P0 | M | 4 | compliance | proposé |
| NX-297 | Demandes de droits RGPD outillées | Accès, rectification et effacement traités dans le délai d’un mois. | P0 | M | 4 | compliance | proposé |
| NX-298 | Registre des traitements généré par agence | Le registre RGPD se construit à partir des usages réels. | P1 | S | 3 | compliance | proposé |
| NX-299 | Provenance de chaque fait au survol | Source, date, version et validateur s’affichent sur chaque donnée clé. | P0 | M | 5 | compliance | proposé |
| NX-300 | Validité des diagnostics recalculée | DPE, amiante, plomb et termites avec date d’expiration selon le type. | P0 | S | 5 | compliance | proposé |
| NX-301 | Information RGPD sur chaque courrier | Chaque lettre indique l’émetteur, l’origine des données et un QR d’opposition. | P0 | S | 5 | compliance | proposé |
| NX-302 | Mentions des annonces locatives | Les annonces de location respectent encadrement des loyers et arrêté de 2022. | P2 | S | 3 | compliance | proposé |
| NX-303 | Journal d’audit inaltérable | Toute décision assistée par l’IA peut être reconstituée. | P1 | M | 4 | compliance | proposé |
| NX-304 | Hébergement UE et sous-traitants IA déclarés | Données en UE, sans entraînement des modèles sur les données clients. | P0 | M | 5 | compliance | proposé |
| NX-305 | Carte professionnelle et garantie sur tous supports | Les mentions légales de l’agence sont à jour dans chaque livrable. | P1 | S | 3 | compliance | proposé |
| NX-306 | Analyse d’impact pour les traitements IA | Le dossier de conformité est prêt en cas de contrôle CNIL. | P1 | M | 3 | compliance | proposé |
| NX-307 | Facturation électronique conforme | Réception et émission des factures via une plateforme agréée. | P2 | M | 4 | compliance | proposé |

### Facturation & commissions (14)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-308 | Prévision d’honoraires par transaction | Montant, répartition et date probable d’encaissement visibles. | P1 | S | 4 | feature | proposé |
| NX-309 | Partage de commission inter-agences | La clé de répartition est tracée quand deux agences coopèrent. | P2 | M | 4 | feature | proposé |
| NX-310 | Rétrocession des agents commerciaux | Calcule la part du mandataire selon son barème. | P2 | M | 4 | feature | proposé |
| NX-311 | Facture d’honoraires émise à l’acte | La facture part dès la confirmation de signature. | P2 | M | 4 | automation | proposé |
| NX-312 | Relance des honoraires impayés | Rappels progressifs au notaire ou au client. | P2 | S | 3 | automation | proposé |
| NX-313 | Barème d’honoraires versionné | Le barème affiché correspond toujours au barème appliqué. | P1 | S | 4 | compliance | proposé |
| NX-314 | Simulateur net vendeur | Le vendeur voit son net après honoraires et frais. | P1 | S | 4 | feature | proposé |
| NX-315 | Abonnement géré en libre-service | L’agence change d’offre, ajoute des sièges et télécharge ses factures. | P1 | M | 4 | growth | proposé |
| NX-316 | Facturation au dossier vendeur validé | Les volumes lourds sont facturés au résultat, pas au jeton. | P1 | M | 4 | growth | proposé |
| NX-317 | Crédits restitués en cas d’échec technique | Une génération ratée ne coûte rien à l’agence. | P1 | S | 3 | growth | proposé |
| NX-318 | Frais de campagne affectés au dossier | Affranchissement et publicité sont imputés au bien concerné. | P2 | S | 3 | feature | proposé |
| NX-319 | Tableau de commissions par conseiller | Chacun voit son CA, ses encaissements et sa part. | P2 | S | 3 | feature | proposé |
| NX-320 | Notes de frais rattachées aux dossiers | Kilométrage et dépenses sont liés au bien qui les a occasionnés. | P3 | S | 2 | feature | proposé |
| NX-321 | Export pour l’expert-comptable | Écritures d’honoraires prêtes à importer. | P2 | S | 3 | data | proposé |

### Gestion locative & syndic (option) (12)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-322 | Location saisonnière haut de gamme | Calendrier, contrats et arrivées pour les villas louées à la semaine. | P3 | L | 3 | feature | proposé |
| NX-323 | Mandat de gestion locative | Baux, quittances et révisions de loyer suivis. | P3 | XL | 3 | feature | proposé |
| NX-324 | Numéro d’enregistrement meublé de tourisme | Le numéro est vérifié avant toute annonce saisonnière. | P3 | S | 3 | compliance | proposé |
| NX-325 | État des lieux numérique | Photos horodatées et signature sur tablette. | P3 | M | 3 | feature | proposé |
| NX-326 | Bailleur vendeur signalé au transactionnaire | Un propriétaire géré qui veut vendre est transmis à l’équipe vente. | P2 | S | 4 | growth | proposé |
| NX-327 | Alerte logements interdits à la location | Le bailleur d’un bien G ou F est prévenu, avec options travaux ou vente. | P2 | S | 4 | compliance | proposé |
| NX-328 | Portail propriétaire bailleur | Loyers, travaux et documents fiscaux en ligne. | P3 | L | 3 | feature | proposé |
| NX-329 | Demande du pré-état daté au syndic | Les pièces de copropriété sont réclamées automatiquement. | P2 | M | 4 | feature | proposé |
| NX-330 | Travaux votés et appels de fonds | Les travaux votés en AG sont reportés dans le dossier de vente. | P2 | S | 4 | data | proposé |
| NX-331 | Demandes d’intervention des locataires | Le locataire signale un incident, le gestionnaire assigne un artisan. | P3 | M | 2 | feature | proposé |
| NX-332 | Gardiennage de résidences secondaires | Passages, rapports photo et alertes pour propriétaires absents. | P3 | M | 3 | growth | proposé |
| NX-333 | Annuaire d’artisans et prestataires évalués | Les prestataires de confiance de l’agence sont centralisés. | P3 | S | 2 | feature | proposé |

### UX, design & motion (25)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-334 | Palette de commandes ⌘K | Accès instantané à tout dossier, bien ou action au clavier. | P0 | S | 5 | ux | maquette |
| NX-335 | Titre d’accueil généré et cliquable | La phrase du jour résume la situation, chaque nom ouvre sa fiche. | P1 | S | 4 | ux | maquette |
| NX-336 | Kanban des dossiers en glisser-déposer | Faire avancer un dossier d’étape en un geste. | P0 | M | 4 | ux | maquette |
| NX-337 | Thème Nuit avec transition circulaire | Confort visuel en soirée pour le travail de back-office. | P1 | S | 3 | ux | proposé |
| NX-338 | Navigation clavier j/k entre fiches | Parcourir 80 dossiers sans toucher la souris. | P1 | S | 3 | ux | proposé |
| NX-339 | Squelette IA révélé champ par champ | L’attente d’une génération devient lisible et rassurante. | P0 | S | 4 | ux | maquette |
| NX-340 | Révélation sobre d’un livrable validé | La validation d’un livrable est marquée par un sceau discret. | P2 | S | 2 | ux | proposé |
| NX-341 | Curseur avant/après accessible au clavier | Le staging se compare à la souris, au doigt ou aux flèches. | P1 | S | 4 | ux | maquette |
| NX-342 | Respect de la préférence « réduire les animations » | Toutes les animations se désactivent proprement. | P0 | S | 4 | ux | proposé |
| NX-343 | Cellules éditables dans les listes | Statut ou prix se modifient directement dans le tableau. | P1 | M | 4 | ux | proposé |
| NX-344 | États vides qui proposent l’action suivante | Chaque écran vide indique le premier geste utile. | P0 | S | 4 | ux | proposé |
| NX-345 | Annulation possible pendant 6 secondes | Chaque action automatique est annulable depuis la notification. | P0 | S | 5 | ux | proposé |
| NX-346 | Densité d’affichage réglable | Confortable pour le terrain, compacte pour le back-office. | P2 | S | 2 | ux | proposé |
| NX-347 | Accessibilité WCAG 2.2 AA | Contrastes, focus visibles et lecteurs d’écran pris en charge. | P0 | M | 4 | ux | proposé |
| NX-348 | Carte radar des comparables | Les comparables s’allument au passage d’un balayage sur la carte. | P2 | M | 2 | ux | proposé |
| NX-349 | Fiche bien en cockpit visuel | Visites, offres, DPE et tâches flottent sur la photo du bien. | P2 | M | 3 | ux | proposé |
| NX-350 | Jauges segmentées d’objectifs | Les objectifs se remplissent segment par segment. | P2 | S | 2 | ux | proposé |
| NX-351 | Microcopie précise et bienveillante | Les messages disent quoi faire, jamais « erreur inconnue ». | P0 | S | 4 | ux | proposé |
| NX-352 | Onboarding par rôle en 5 minutes | Chaque rôle découvre ses trois gestes clés dès la première connexion. | P1 | M | 4 | ux | proposé |
| NX-353 | Espace de démonstration réaliste | Des dossiers fictifs d’Antibes permettent d’essayer sans risque. | P1 | S | 4 | growth | proposé |
| NX-354 | Landing animée « RDV → 9 livrables » | Le visiteur comprend le produit en 20 secondes de défilement. | P0 | M | 5 | ux | maquette |
| NX-355 | Démo interactive du CRM sur la landing | Le prospect manipule un vrai écran avant de demander une démo. | P1 | M | 4 | growth | maquette |
| NX-356 | Transitions de page qui gardent le contexte | Le passage d’une liste à une fiche conserve les repères visuels. | P2 | S | 2 | ux | proposé |
| NX-357 | Tableau de bord personnalisable | Chaque conseiller choisit ses widgets et leur ordre. | P2 | M | 3 | ux | proposé |
| NX-358 | Journal chronologique du dossier | Chaque action humaine ou IA apparaît dans l’historique du dossier. | P0 | S | 4 | ux | maquette |

### Croissance & monétisation (16)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-359 | Pilote Antibes de 60 jours mesuré | Prouve le temps gagné et la conversion sur trois à cinq agences. | P0 | S | 5 | growth | proposé |
| NX-360 | Offre Surcouche à 49 € par siège | Permet d’entrer chez une agence sans migration de CRM. | P0 | S | 5 | growth | proposé |
| NX-361 | Calculateur de retour sur investissement | Le prospect saisit ses volumes et voit temps et CA gagnés. | P1 | S | 4 | growth | proposé |
| NX-362 | Parrainage entre agences | Un mois offert pour chaque agence parrainée qui démarre. | P2 | S | 3 | growth | proposé |
| NX-363 | Témoignages vidéo des agences pilotes | Une preuve sociale locale pour la Côte d’Azur. | P1 | S | 4 | growth | proposé |
| NX-364 | Place de marché de modèles et routines | Les réseaux partagent ou vendent leurs gabarits. | P3 | L | 3 | growth | proposé |
| NX-365 | Packs à l’usage pour vidéo, courrier et voix | L’agence paie les volumes lourds seulement quand elle en a besoin. | P2 | M | 3 | growth | proposé |
| NX-366 | Offre réseau avec console et SSO | Monétise la gouvernance auprès des franchises et groupes. | P2 | M | 5 | growth | proposé |
| NX-367 | Essai guidé sur un dossier réel | Le premier dossier vendeur est produit en 30 minutes. | P1 | M | 5 | growth | proposé |
| NX-368 | Programme d’ambassadeurs conseillers | Les meilleurs utilisateurs forment leurs pairs et sont reconnus. | P3 | S | 2 | growth | proposé |
| NX-369 | Extension Monaco et Riviera italienne | Multilingue et règles locales pour Menton, Monaco et la Ligurie. | P3 | XL | 3 | growth | proposé |
| NX-370 | Guides « vendre en 2026 » | Les guides démarchage et AI Act attirent les agences inquiètes. | P1 | S | 4 | growth | proposé |
| NX-371 | Présence aux salons et fédérations | Visibilité auprès des réseaux au moment du choix des outils. | P2 | S | 3 | growth | proposé |
| NX-372 | Score de santé client anti-résiliation | Détecte une agence qui décroche avant qu’elle ne résilie. | P2 | M | 4 | growth | proposé |
| NX-373 | Prix annoncé avant chaque génération payante | La confiance naît d’un coût connu à l’avance. | P1 | S | 3 | growth | proposé |
| NX-374 | Rapport de valeur trimestriel à l’agence | Temps gagné, mandats signés et livrables produits grâce à NXT. | P1 | S | 4 | growth | proposé |

### Sécurité (12)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-375 | SSO et provisionnement SCIM | Les réseaux gèrent comptes et départs depuis leur annuaire. | P2 | M | 4 | compliance | proposé |
| NX-376 | Authentification forte obligatoire | Passkeys ou code à usage unique pour tous les comptes. | P0 | S | 5 | compliance | proposé |
| NX-377 | Permissions par action et par périmètre | Un assistant voit les pièces sans pouvoir exporter les contacts. | P0 | M | 5 | feature | proposé |
| NX-378 | Cloisonnement testé entre agences | Des tests automatiques garantissent qu’aucune agence ne voit les données d’une autre. | P0 | M | 5 | compliance | proposé |
| NX-379 | Chiffrement des pièces sensibles | Pièces d’identité et avis d’imposition sont chiffrés au repos. | P0 | M | 5 | compliance | proposé |
| NX-380 | Liens de partage expirants et révocables | Un lien envoyé au notaire cesse de fonctionner après 30 jours. | P0 | S | 4 | compliance | proposé |
| NX-381 | Journal des accès administratifs | Toute consultation par le support est tracée et visible du client. | P1 | S | 4 | compliance | proposé |
| NX-382 | Détection des connexions anormales | Alerte sur une connexion depuis un pays ou un appareil inhabituel. | P1 | M | 4 | compliance | proposé |
| NX-383 | Révocation immédiate au départ d’un conseiller | Accès coupés et dossiers réaffectés le jour même. | P0 | S | 5 | compliance | proposé |
| NX-384 | Protection contre l’injection de consignes | Un document déposé ne peut pas détourner le comportement du copilote. | P0 | M | 5 | compliance | proposé |
| NX-385 | Sauvegardes testées par restauration | Une restauration mensuelle est vérifiée sur un environnement isolé. | P0 | M | 4 | compliance | proposé |
| NX-386 | Test d’intrusion annuel et programme de signalement | Les failles sont trouvées avant les attaquants. | P2 | M | 3 | compliance | proposé |

### Observabilité (12)

| ID | Titre | Bénéfice | Phase | Effort | Impact | Type | Statut |
|---|---|---|---|---|---|---|---|
| NX-387 | Tableau de santé des connecteurs | Le support voit en temps réel quelle intégration échoue. | P0 | M | 4 | data | proposé |
| NX-388 | Traçage de bout en bout des générations | Chaque livrable est relié à son modèle, sa consigne et ses sources. | P1 | M | 4 | data | proposé |
| NX-389 | Taux de livrables modifiés ou rejetés | Mesure la qualité réelle de l’IA par type de livrable. | P1 | S | 5 | data | proposé |
| NX-390 | Signalement d’erreur factuelle en un clic | Le conseiller marque une erreur qui alimente l’évaluation. | P0 | S | 5 | feature | proposé |
| NX-391 | Budget IA par agence avec alertes | Aucune surprise de coût en fin de mois. | P0 | S | 4 | data | proposé |
| NX-392 | Page de statut publique | Les agences savent immédiatement si un incident est en cours. | P1 | S | 3 | feature | proposé |
| NX-393 | Réconciliation des actions externes | Un message à l’état inconnu est vérifié avant tout renvoi. | P0 | M | 4 | automation | proposé |
| NX-394 | Suivi de la latence des générations | Alerte si un livrable met plus de 3 minutes à être produit. | P1 | S | 3 | data | proposé |
| NX-395 | Reprise sans doublon après panne | Aucun traitement perdu ni dupliqué après un incident. | P0 | M | 4 | data | proposé |
| NX-396 | Retour utilisateur relié à l’écran | Un avis envoyé capture automatiquement le contexte de l’écran. | P1 | S | 3 | ux | proposé |
| NX-397 | Mesure d’usage sans traqueur tiers | L’usage est mesuré de façon agrégée, hébergé en UE. | P1 | S | 3 | data | proposé |
| NX-398 | Revue hebdomadaire de la qualité IA | Un échantillon de livrables est relu par un humain chaque semaine. | P1 | S | 4 | data | proposé |

## 3. Les 100 routines

Autonomie : **A** agit seule dans un cadre validé · **V** prépare et attend validation · **P** propose seulement. Chaque routine porte déclencheur, conditions, action, critère de succès et règle d’arrêt ou de repli ; fenêtres calmes, déduplication, journal et budget s’appliquent à toutes.

### 3.1 Les 60 routines existantes (résumé)

| ID | Famille | Routine | Déclencheur | Autonomie | Phase |
|---|---|---|---|---|---|
| AUT-001 | Acquisition | Réception d’un lead | Webhook formulaire ou import CRM | A | P0 |
| AUT-002 | Acquisition | Recherche de doublon | Nouvelle entrée de réception | V | P0 |
| AUT-003 | Acquisition | Affectation au bon secteur | Lead validé | A | P0 |
| AUT-004 | Acquisition | Prise en charge tardive | Délai configurable dépassé | A | P0 |
| AUT-005 | Acquisition | Permission de contact | Action externe proposée | A | P0 |
| AUT-006 | Acquisition | Demande de RDV entrant | Créneau choisi par prospect | P | P1 |
| AUT-007 | Acquisition | Qualification incomplète | Lead traité sans critères essentiels | V | P0 |
| AUT-008 | Acquisition | Campagne locale de prospection | Campagne agence approuvée | V | P2 |
| AUT-009 | Acquisition | Réactivation de projet dormant | Échéance choisie avec le contact | V | P1 |
| AUT-010 | Préparation | Préparer le dossier avant RDV | RDV créé à plus de 24 heures | A | P0 |
| AUT-011 | Préparation | RDV imminent | RDV créé à moins de 24 heures | A | P0 |
| AUT-012 | Préparation | Brief relationnel D1 | Lancement préparation | A | P0 |
| AUT-013 | Préparation | Analyse marché D2 | Adresse validée | A | P0 |
| AUT-014 | Préparation | Radar quartier D3 | Préparation ou source actualisée | A | P1 |
| AUT-015 | Préparation | Contrôle H-2 | Échéance avant RDV | A | P0 |
| AUT-016 | Préparation | Rendez-vous déplacé | Modification horaire validée | A | P0 |
| AUT-017 | Préparation | Rendez-vous annulé | Annulation explicite | A | P0 |
| AUT-018 | Préparation | Coaching D4 volontaire | Agent choisit une simulation | A | P1 |
| AUT-019 | Terrain | Dictée de découverte | Action volontaire de l’agent | V | P0 |
| AUT-020 | Terrain | Capture photo du bien | Photo ajoutée au dossier | A | P1 |
| AUT-021 | Terrain | Complétude avant clôture | Agent termine RDV | A | P0 |
| AUT-022 | Terrain | Conflit de données terrain | Nouvelle surface ou prix saisi | V | P0 |
| AUT-023 | Terrain | Reprise mobile hors connexion | Connexion rétablie | V | P1 |
| AUT-024 | Terrain | Préparation post-RDV | Découverte validée | A | P0 |
| AUT-025 | Livrables | L1 remerciement vendeur | Découverte validée | V | P0 |
| AUT-026 | Livrables | L2 synthèse équipe | Dossier post-RDV prêt | V | P0 |
| AUT-027 | Livrables | L3 avant-première acquéreur | Bien partageable et liste validée | V | P1 |
| AUT-028 | Livrables | L4 kit réseaux sociaux | Bien et médias validés | V | P1 |
| AUT-029 | Livrables | L5 courrier voisinage | Campagne locale autorisée | V | P2 |
| AUT-030 | Livrables | L6 présentation des services | Besoin vendeur confirmé | V | P0 |
| AUT-031 | Livrables | L7 estimation argumentée | Comparables et découverte disponibles | V | P0 |
| AUT-032 | Livrables | L8 projection visuelle | Photo et demande de staging approuvées | V | P2 |
| AUT-033 | Livrables | L9 dossier copro diagnostics | Nature du bien et pièces connues | V | P0 |
| AUT-034 | Mandat | Préparer un mandat | Accord commercial confirmé | V | P1 |
| AUT-035 | Mandat | Suivre la signature | Webhook prestataire signature | A | P1 |
| AUT-036 | Mandat | Rappel échéance mandat | Date configurable avant expiration | A | P1 |
| AUT-037 | Mandat | Publication multiportail | Annonce explicitement validée | V | P2 |
| AUT-038 | Mandat | Modification du prix | Décision vendeur enregistrée | V | P1 |
| AUT-039 | Mandat | Bilan hebdomadaire vendeur | Cadence convenue atteinte | V | P1 |
| AUT-040 | Transaction | Planifier visite acquéreur | Créneau choisi | P | P1 |
| AUT-041 | Transaction | Retour de visite | Visite marquée tenue | V | P1 |
| AUT-042 | Transaction | Offre reçue | Document offre ajouté | V | P1 |
| AUT-043 | Transaction | Échéance condition suspensive | Date approche | V | P1 |
| AUT-044 | Transaction | Transmission au notaire | Jalon de dossier atteint | V | P1 |
| AUT-045 | Transaction | Suivi après acte | Acte confirmé | V | P2 |
| AUT-046 | Réseau | Brief agent du matin | 07:30 jour ouvré local | A | P0 |
| AUT-047 | Réseau | Revue quotidienne agence | 08:00 jour ouvré local | A | P0 |
| AUT-048 | Réseau | Revue pipeline hebdomadaire | Début de semaine agence | A | P1 |
| AUT-049 | Réseau | Revue adoption mensuelle | Fin de mois | A | P1 |
| AUT-050 | Réseau | Version de modèle réseau | Modèle prêt à déployer | V | P1 |
| AUT-051 | Réseau | Réaffectation lors d’absence | Absence ou départ déclaré | V | P0 |
| AUT-052 | Exploitation | Santé des connecteurs | Échec ou contrôle périodique | A | P0 |
| AUT-053 | Exploitation | Nouveau millésime data | Publication source confirmée | A | P1 |
| AUT-054 | Exploitation | Document proche expiration | Échéance calculée selon type | A | P0 |
| AUT-055 | Exploitation | Retrait de permission | Opposition enregistrée | A | P0 |
| AUT-056 | Exploitation | Demande de droits données | Demande reçue | V | P0 |
| AUT-057 | Exploitation | Alerte budget IA | Seuil défini atteint | A | P0 |
| AUT-058 | Exploitation | Contrôle qualité livrables | Sortie générée | A | P0 |
| AUT-059 | Exploitation | Réconciliation action externe | État de livraison inconnu | A | P0 |
| AUT-060 | Exploitation | Sauvegarde et exercice restauration | Cadence exploitation définie | A | P0 |

### 3.2 Les 40 nouvelles routines (détail)

Répartition : Conformité 10, Marketing 8, Relation client 9, Transaction 4, Mandat 1, Terrain 2, Préparation 1, Réseau 2, Exploitation 2, Livrables 1.

#### AUT-061 · Contrôle du consentement avant appel — Conformité · A · P0

- **Déclencheur** : Clic sur « Appeler » depuis une fiche contact
- **Conditions** : Consentement valide de moins de 12 mois pour ce professionnel ; lun.–ven. 10:00–13:00 ou 14:00–20:00 ; moins de 4 appels sur 30 jours glissants
- **Action** : Autoriser l’appel et journaliser la preuve ; sinon griser le bouton et afficher le motif exact
- **Succès** : Aucun appel passé hors du cadre légal
- **Arrêt / repli** : Proposer courrier ou email consenti ; arrêt définitif si opposition enregistrée

#### AUT-062 · Renouvellement de consentement J-30 — Conformité · V · P0

- **Déclencheur** : Contrôle quotidien 06:00 : consentement expirant dans 30 jours
- **Conditions** : Contact avec projet ouvert et non opposé
- **Action** : Préparer une demande de renouvellement par le canal d’origine, à valider par le conseiller
- **Succès** : Consentement renouvelé ou contact basculé en canal courrier
- **Arrêt / repli** : Une seule demande ; aucune relance après refus ou silence de 15 jours

#### AUT-063 · Retrait de consentement immédiat — Conformité · A · P0

- **Déclencheur** : Mot-clé STOP reçu, lien de désinscription ou « stop » oral saisi
- **Conditions** : Aucune
- **Action** : Révoquer les canaux concernés, annuler les envois planifiés et propager la liste d’opposition réseau sous 5 minutes
- **Succès** : Zéro sollicitation après le retrait
- **Arrêt / repli** : Si un envoi est déjà chez le prestataire, tenter l’annulation et tracer l’échec pour le DPO

#### AUT-064 · Contrôle des mentions avant diffusion — Conformité · A · P0

- **Déclencheur** : Export d’une annonce, d’un post, d’une lettre ou d’un book citant un prix
- **Conditions** : Bien sous mandat
- **Action** : Vérifier honoraires TTC en %, charge des honoraires, classes DPE/GES, mention F/G, carte professionnelle ; bloquer si manquant
- **Succès** : 100 % des supports diffusés comportent les mentions obligatoires
- **Arrêt / repli** : Blocage avec liste des champs à compléter ; aucune diffusion partielle

#### AUT-065 · Étiquetage AI Act des images — Conformité · A · P0

- **Déclencheur** : Image générée ou modifiée par IA validée pour diffusion
- **Conditions** : Image destinée à un support externe
- **Action** : Incruster l’étiquette « Image virtuelle », ajouter métadonnées C2PA/IPTC, lier l’original, journaliser modèle et consigne
- **Succès** : Aucune image virtuelle publiée sans étiquette ni original
- **Arrêt / repli** : Diffusion bloquée si le marquage échoue ; alerte au conseiller

#### AUT-066 · Vigilance LCB-FT avant compromis — Conformité · V · P1

- **Déclencheur** : Offre acceptée enregistrée
- **Conditions** : Montant supérieur au seuil agence, paiement depuis l’étranger, société écran ou PPE détectée
- **Action** : Ouvrir la fiche de vigilance, demander identité et origine des fonds, interroger les listes de gels d’avoirs et PPE
- **Succès** : Fiche complète et signée avant la date de compromis
- **Arrêt / repli** : Escalade au responsable conformité ; jalon compromis bloqué tant qu’un risque élevé n’est pas levé

#### AUT-067 · Purge des prospects inactifs — Conformité · V · P0

- **Déclencheur** : Mensuel, 1er du mois 03:00
- **Conditions** : Aucun contact ni projet depuis 36 mois et aucune obligation légale de conservation
- **Action** : Présenter la liste au responsable puis anonymiser les fiches validées
- **Succès** : Base alignée sur les durées de conservation
- **Arrêt / repli** : Report de 30 jours sur contestation ; dossiers en litige exclus

#### AUT-068 · Inscription au registre des mandats — Conformité · A · P1

- **Déclencheur** : Mandat signé reçu du prestataire de signature
- **Conditions** : Toutes les signatures requises vérifiées
- **Action** : Attribuer le numéro d’ordre suivant et sceller l’entrée horodatée
- **Succès** : Numérotation continue, sans trou ni doublon
- **Arrêt / repli** : Signature incomplète : aucune réservation de numéro, tâche au conseiller

#### AUT-069 · Filtrage des oppositions avant routage — Conformité · A · P1

- **Déclencheur** : Campagne courrier validée, avant envoi au routeur
- **Conditions** : Liste d’adresses calculée
- **Action** : Retirer adresses en opposition réseau et contacts ayant refusé, afficher le nombre retiré et le coût final
- **Succès** : Aucun courrier adressé à un opposant
- **Arrêt / repli** : Routage bloqué si la liste d’opposition date de plus de 24 h

#### AUT-070 · Annonce « assistant IA » — Conformité · A · P0

- **Déclencheur** : Ouverture d’une conversation avec un agent IA (chat, WhatsApp, voix)
- **Conditions** : Aucune
- **Action** : Se présenter comme assistant IA dès le premier message et proposer un humain à tout moment
- **Succès** : 100 % des conversations IA identifiées comme telles
- **Arrêt / repli** : Si le canal ne permet pas la mention, l’agent n’est pas activé sur ce canal

#### AUT-071 · Kit social nouveau mandat — Marketing · V · P1

- **Déclencheur** : Mandat activé et médias validés par le vendeur
- **Conditions** : Diffusion autorisée au mandat ; pas d’option discrétion
- **Action** : Préparer 3 posts et 1 story, planifier mardi et jeudi 18:30
- **Succès** : Publication sous 48 h après activation
- **Arrêt / repli** : Aucun post si le vendeur demande la discrétion ; report si mentions bloquantes

#### AUT-072 · Lettre « Vendu dans votre rue » — Marketing · V · P1

- **Déclencheur** : Acte authentique confirmé
- **Conditions** : Accord vendeur et acquéreur sur la mention ; adresse non identifiante
- **Action** : Préparer une lettre « Aux occupants » pour les 150 adresses les plus proches avec aperçu du coût
- **Succès** : Campagne validée sous 7 jours
- **Arrêt / repli** : Annulée si refus de confidentialité ; oppositions exclues

#### AUT-073 · Baisse de prix coordonnée — Marketing · V · P1

- **Déclencheur** : Avenant de prix signé
- **Conditions** : Mandat actif
- **Action** : Mettre à jour portails, mini-site et kit social, puis alerter les acquéreurs compatibles
- **Succès** : Prix identique sur tous les supports sous 2 h
- **Arrêt / repli** : Si un portail refuse la mise à jour, tâche manuelle et alerte ; pas de publication partielle des alertes

#### AUT-074 · Passage sous compromis — Marketing · V · P1

- **Déclencheur** : Compromis signé
- **Conditions** : Supports actifs
- **Action** : Bandeau « sous compromis », suspension de la publicité payante, post facultatif
- **Succès** : Aucune dépense publicitaire après le compromis
- **Arrêt / repli** : Portail injoignable : tâche manuelle ; réactivation si rétractation

#### AUT-075 · Annonce sans contact depuis 10 jours — Marketing · P · P1

- **Déclencheur** : Contrôle quotidien 07:00
- **Conditions** : Annonce en ligne depuis 10 jours, zéro contact, statistiques portails connectées
- **Action** : Diagnostic photos, titre, prix vs comparables et proposition de 3 corrections
- **Succès** : Nouveaux contacts sous 7 jours
- **Arrêt / repli** : Jamais de baisse de prix automatique ; une proposition par période de 14 jours

#### AUT-076 · Note de marché au nouveau millésime DVF — Marketing · V · P2

- **Déclencheur** : Import d’un nouveau millésime DVF (avril ou octobre)
- **Conditions** : Secteurs de l’agence définis
- **Action** : Générer note de quartier, post et mise à jour de page locale
- **Succès** : Contenu publié sous 10 jours
- **Arrêt / repli** : Aucun chiffre publié si l’échantillon compte moins de 10 ventes

#### AUT-077 · Campagne « Votre DPE a peut-être changé » — Marketing · V · P2

- **Déclencheur** : Simulation DPE 2026 favorable sur un secteur
- **Conditions** : Adresses non opposées ; information RGPD et QR d’opposition prêts
- **Action** : Proposer une lettre pédagogique avec simulation générique et invitation à un avis de valeur
- **Succès** : Taux de prise de RDV mesuré par campagne
- **Arrêt / repli** : Une campagne par secteur et par semestre ; arrêt si opposition

#### AUT-078 · Réponse à un avis Google — Marketing · V · P1

- **Déclencheur** : Nouvel avis reçu (webhook Google Business)
- **Conditions** : Fiche agence connectée
- **Action** : Proposer une réponse personnalisée sous 24 h ; alerter le manager si la note est inférieure ou égale à 2
- **Succès** : 100 % des avis répondus sous 48 h
- **Arrêt / repli** : Aucune publication sans validation humaine

#### AUT-079 · Mandat sans visite depuis 14 jours — Relation client · P · P1

- **Déclencheur** : Contrôle quotidien 07:15
- **Conditions** : Mandat actif, aucune visite tenue depuis 14 jours, hors congés du vendeur
- **Action** : Préparer un diagnostic prix, exposition et qualité d’annonce et proposer un point vendeur
- **Succès** : Point vendeur tenu sous 7 jours
- **Arrêt / repli** : Pas de baisse de prix automatique ; seuil configurable selon typologie et saison

#### AUT-080 · Anniversaire d’achat — Relation client · V · P2

- **Déclencheur** : Date anniversaire de l’acte (1, 3, 5 ans) à 09:00
- **Conditions** : Consentement de communication valide, client non opposé
- **Action** : Préparer une note sur l’évolution du quartier avec offre d’avis de valeur
- **Succès** : Taux de réponse et avis de valeur demandés
- **Arrêt / repli** : Un envoi par an maximum ; arrêt définitif sur opposition

#### AUT-081 · Requalification acquéreur à 60 jours — Relation client · A · P1

- **Déclencheur** : 60 jours sans activité sur un projet acquéreur
- **Conditions** : Projet actif, consentement valide, modèle de message pré-validé par l’agence
- **Action** : Envoyer « votre projet a-t-il changé ? » avec boutons confirmer, modifier, suspendre
- **Succès** : Projet confirmé, mis à jour ou suspendu
- **Arrêt / repli** : Deux relances maximum à 7 jours d’intervalle, puis suspension automatique

#### AUT-082 · Alerte nouvelle opportunité — Relation client · V · P1

- **Déclencheur** : Nouveau bien ou baisse de prix enregistrée
- **Conditions** : Score ≥ 80, acquéreur non sollicité depuis 72 h, bien autorisé à la présentation
- **Action** : Proposer un envoi groupé au conseiller avec explication du score
- **Succès** : Envoi sous 2 h
- **Arrêt / repli** : Maximum 3 alertes par semaine et par acquéreur

#### AUT-083 · Satisfaction après estimation — Relation client · A · P2

- **Déclencheur** : L7 remis depuis 3 jours
- **Conditions** : Vendeur non signataire, consentement email
- **Action** : Envoyer un questionnaire de 2 questions sur la clarté de l’estimation
- **Succès** : Taux de réponse ≥ 30 %
- **Arrêt / repli** : Un seul envoi ; note ≤ 6 crée une tâche manager

#### AUT-084 · Parrainage client satisfait — Relation client · V · P2

- **Déclencheur** : 90 jours après l’acte, 10:00
- **Conditions** : Satisfaction déclarée ≥ 8/10, consentement, aucun litige
- **Action** : Proposer une invitation au parrainage personnalisée
- **Succès** : Recommandations reçues par dossier clôturé
- **Arrêt / repli** : Pas d’envoi si litige ou note inférieure à 8 ; une seule sollicitation

#### AUT-085 · Point mensuel vendeur non résident — Relation client · V · P2

- **Déclencheur** : 1er lundi du mois, 09:00 heure locale du vendeur
- **Conditions** : Vendeur résidant à l’étranger avec mandat actif
- **Action** : Proposer un créneau visio et préparer le rapport dans sa langue
- **Succès** : Point tenu chaque mois
- **Arrêt / repli** : Arrêt à la signature du compromis ou sur demande

#### AUT-086 · Silence vendeur 10 jours — Relation client · P · P1

- **Déclencheur** : Aucun échange depuis 10 jours ouvrés
- **Conditions** : Mandat actif
- **Action** : Créer une tâche d’appel avec 3 sujets factuels à aborder
- **Succès** : Contact établi sous 3 jours
- **Arrêt / repli** : Pas de message automatique au vendeur ; tâche supprimée si échange enregistré

#### AUT-087 · Pièce demandée non déposée — Relation client · A · P0

- **Déclencheur** : Lien de dépôt envoyé, aucun dépôt à J+3
- **Conditions** : Pièce toujours requise et non marquée non applicable
- **Action** : Relance douce à J+3, puis tâche d’appel au conseiller à J+7
- **Succès** : Pièce reçue sous 10 jours
- **Arrêt / repli** : Deux relances maximum ; arrêt dès dépôt ou statut non applicable

#### AUT-088 · Délai de rétractation SRU — Transaction · A · P1

- **Déclencheur** : Accusé de notification du compromis reçu
- **Conditions** : Acquéreur non professionnel
- **Action** : Calculer la fin du délai de 10 jours et prévenir vendeur et notaire le lendemain
- **Succès** : Fin du délai connue et partagée
- **Arrêt / repli** : Date de notification inconnue : demande au notaire, aucun calcul supposé

#### AUT-089 · Délai du droit de préemption — Transaction · A · P1

- **Déclencheur** : DIA envoyée
- **Conditions** : Bien situé en zone de préemption
- **Action** : Suivre le délai de 2 mois et rappeler J-15 au conseiller et au notaire
- **Succès** : Purge confirmée avant la date d’acte
- **Arrêt / repli** : Décision de préemption : alerte immédiate et gel des jalons

#### AUT-090 · Financement qui glisse — Transaction · V · P1

- **Déclencheur** : Date limite d’obtention du prêt à J-10 sans attestation
- **Conditions** : Condition suspensive de prêt active
- **Action** : Alerter conseiller et courtier, préparer une demande de prorogation
- **Succès** : Attestation reçue ou prorogation signée avant l’échéance
- **Arrêt / repli** : Escalade au manager à J-3 ; jamais d’engagement envoyé sans validation

#### AUT-091 · Demande de pré-état daté — Transaction · V · P1

- **Déclencheur** : Compromis prévu dans moins de 30 jours
- **Conditions** : Bien en copropriété, pré-état daté absent
- **Action** : Préparer la demande au syndic avec les références du lot
- **Succès** : Pré-état daté reçu avant J-7
- **Arrêt / repli** : Relance à J+7 puis tâche d’appel ; arrêt dès réception

#### AUT-092 · Passage du mandat simple à l’exclusif — Mandat · P · P2

- **Déclencheur** : Mandat simple actif depuis 21 jours
- **Conditions** : Au moins 3 visites et un retour vendeur positif
- **Action** : Proposer au conseiller un argumentaire chiffré de passage en exclusivité
- **Succès** : Taux de conversion simple → exclusif
- **Arrêt / repli** : Une proposition par mandat ; arrêt si le vendeur refuse

#### AUT-093 · Mode visite silencieux — Terrain · A · P2

- **Déclencheur** : Début d’une visite inscrite à l’agenda
- **Conditions** : Application mobile installée
- **Action** : Activer le mode confidentialité : notifications masquées, données sensibles floutées
- **Succès** : Aucune notification affichée pendant la visite
- **Arrêt / repli** : Désactivation manuelle possible ; fin automatique à l’heure de fin + 15 min

#### AUT-094 · Téléchargement hors ligne du matin — Terrain · A · P1

- **Déclencheur** : Jours ouvrés à 06:30
- **Conditions** : RDV du jour planifiés et appareil sur réseau Wi-Fi ou batterie > 30 %
- **Action** : Télécharger dossiers, plans, diagnostics et briefs des RDV du jour
- **Succès** : Dossiers du jour disponibles hors ligne à 08:00
- **Arrêt / repli** : Nouvel essai à 07:30 ; alerte si échec au premier RDV

#### AUT-095 · Préparation d’un RDV vendeur en visio — Préparation · A · P2

- **Déclencheur** : RDV vendeur créé en visio avec fuseau horaire différent
- **Conditions** : Vendeur non résident
- **Action** : Convertir les horaires, envoyer le lien et préparer un brief bilingue
- **Succès** : Lien et brief prêts à J-1
- **Arrêt / repli** : Annulation ou report : retrait des envois planifiés

#### AUT-096 · Journée sans rendez-vous — Réseau · P · P1

- **Déclencheur** : Agenda vide sur 48 h ouvrées
- **Conditions** : Conseiller actif, hors congés
- **Action** : Proposer 5 relances consenties prioritaires et une tournée de boîtage
- **Succès** : Plan accepté ou ajusté par le conseiller
- **Arrêt / repli** : Une proposition par période de 48 h ; aucune interprétation managériale

#### AUT-097 · Coaching suggéré par tendance — Réseau · P · P2

- **Déclencheur** : Revue hebdomadaire lundi 07:00
- **Conditions** : Taux d’exclusivité ou de transformation en baisse sur 8 semaines, échantillon ≥ 10 dossiers
- **Action** : Proposer au manager une session de coaching ciblée
- **Succès** : Session planifiée sous 14 jours
- **Arrêt / repli** : Pas de suggestion si l’échantillon est insuffisant ; visibilité limitée au manager direct

#### AUT-098 · Isolement des consignes cachées — Exploitation · A · P0

- **Déclencheur** : Document déposé dans un dossier
- **Conditions** : Aucune
- **Action** : Détecter les instructions cachées ou inhabituelles et isoler le document du contexte IA
- **Succès** : Aucune action IA déclenchée par un document
- **Arrêt / repli** : Document mis en quarantaine et signalé ; reprise après revue humaine

#### AUT-099 · Pause d’urgence des envois — Exploitation · A · P0

- **Déclencheur** : Taux de rebond > 5 % sur 1 h ou plainte enregistrée
- **Conditions** : Aucune
- **Action** : Suspendre toutes les routines sortantes de l’agence et alerter l’administrateur
- **Succès** : Envois arrêtés en moins d’une minute
- **Arrêt / repli** : Reprise manuelle uniquement, routine par routine

#### AUT-100 · Invalidation des livrables dépendants — Livrables · V · P0

- **Déclencheur** : Champ source modifié : surface, prix, DPE ou honoraires
- **Conditions** : Livrable déjà validé utilisant ce champ
- **Action** : Marquer périmés uniquement les livrables dépendants et proposer leur régénération
- **Succès** : Aucun livrable diffusé avec une donnée périmée
- **Arrêt / repli** : Livrable déjà envoyé : tâche de correction au conseiller

## 4. Séquencement P0 → P3

### P0 — 104 idées, 44 routines

**Pilote Antibes (0–3 mois).** Le socle qui prouve la promesse : préparation D1–D3, découverte D5 vocale, livrables L1/L2/L6/L7/L9, file de validation, brief du matin, catalogue de routines avec autonomie A/V/P, garde-fous (consentement, mentions, étiquette AI Act, provenance, cloisonnement, purge) et intégrations minimales (agenda, DVF/ADEME, import CRM). Critère de sortie : délai RDV → suivi validé < 2 h en médiane, ≥ 70 % de livrables validés sans réécriture majeure.

Idées phares : NX-005 Simulation de reclassement DPE 2026 ; NX-007 Pack « RDV prêt » envoyé la veille à 18 h ; NX-017 Engagements pris pendant le RDV listés ; NX-026 L1 remerciement prêt dans l’heure ; NX-041 L9 statuts absent, non applicable, expiré ; NX-055 Financement déclaré, vérifié et daté ; NX-114 Bascule de la pige téléphonique vers le courrier ; NX-152 Dépôt de pièces par lien ciblé ; NX-186 Mandats proches d’expiration ; NX-205 Niveaux d’autonomie A / V / P visibles.

### P1 — 170 idées, 41 routines

**Extension agence (3–9 mois).** Tout le cycle commercial : acquéreurs et matching expliqué, visites et retours, offres et pipeline jusqu’à l’acte, portail vendeur, kit social et courrier voisinage, mobile hors ligne, coaching D4, pilotage agence (entonnoir, prévision, qualité), LCB-FT, surcouche CRM bidirectionnelle. Critère : 3 à 5 agences actives chaque semaine, taux d’exclusivité suivi et en hausse.

Idées phares : NX-060 Alerte nouvelle opportunité sous 10 minutes ; NX-076 Bon de visite signé électroniquement ; NX-078 Compte rendu de visite vocal en 60 secondes ; NX-079 Retour vendeur anonymisé et validé ; NX-086 Synthèse des objections récurrentes ; NX-090 Registre des offres horodaté ; NX-095 Conditions suspensives avec compte à rebours ; NX-097 Check-list avant signature du compromis ; NX-103 Transactions en danger ; NX-184 Délai RDV → suivi validé, médiane et p90.

### P2 — 104 idées, 15 routines

**Réseau (9–18 mois).** Gouvernance et échelle : console hiérarchique, routines et gabarits hérités, comparaisons contextualisées, API/MCP, multidiffusion et portails luxe internationaux, routage postal, commissions inter-agences, facturation électronique, SSO/SCIM. Critère : premier réseau multi-agences signé.

Idées phares : NX-366 Offre réseau avec console et SSO ; NX-176 Coaching manager suggéré par les tendances ; NX-326 Bailleur vendeur signalé au transactionnaire ; NX-327 Alerte logements interdits à la location ; NX-330 Travaux votés et appels de fonds ; NX-058 Apprentissage des motifs de refus ; NX-080 Visite à distance guidée en direct ; NX-087 Vérification d’identité pour biens prestige ; NX-099 Suivi du prêt avec le courtier invité ; NX-119 Veille des nouveaux DPE ADEME du secteur.

### P3 — 20 idées, 0 routines

**Paris d’expansion (18 mois et +).** Options et nouveaux marchés : gestion locative et saisonnière, gardiennage, LiDAR, place de marché de modèles, Monaco et Riviera italienne. À n’engager qu’après rétention prouvée sur P0–P2.

Idées phares : NX-130 Partenariats yachting, golf et conciergerie ; NX-324 Numéro d’enregistrement meublé de tourisme ; NX-071 Services d’installation pour acquéreurs étrangers ; NX-147 Test A/B des titres d’annonce ; NX-325 État des lieux numérique ; NX-332 Gardiennage de résidences secondaires ; NX-252 Relevé des pièces par LiDAR ; NX-322 Location saisonnière haut de gamme ; NX-328 Portail propriétaire bailleur ; NX-364 Place de marché de modèles et routines.

### Dépendances structurantes

1. Modèle de dossier unique et provenance par champ **avant** toute génération (sinon les livrables divergent).
2. Registre de consentement et liste d’opposition **avant** toute routine sortante (courrier, email, WhatsApp, appel).
3. File de validation et journal d’exécution **avant** de passer une routine de V à A.
4. Surcouche CRM ou import fiable **avant** le déploiement réseau ; console réseau **après** preuve sur 3 à 5 agences.
5. Étiquetage AI Act et règles anti-tromperie **avant** toute diffusion de visuel L8.
