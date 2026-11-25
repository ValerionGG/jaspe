# Verdict client : Hélène, fondatrice d’une agence de prestige à Antibes (3 agences, 22 personnes), utilise Hektor, exige image haut de gamme, peur du risque Tracfin et des contrôles DGCCRF, veut mesurer la productivité de son équipe.

**Achète : non** · prix max 250 €/mois · notes {"utilite": 7, "gainTempsCredible": 4, "conformite": 3, "ux": 6, "prix": 7, "global": 4.5}

**Bloquants :**
- assistant.plan ne détecte pas les signaux LCB-FT réels (espèces, société offshore BVI, pression sur le délai) : seuls les mots-clés explicites (origine des fonds, tracfin, kyc) déclenchent un contrôle, et seule la phrase qui les contient est analysée
- Dates décalées d'un jour (probablement UTC) : 'jeudi' donne le mercredi 02/12, 'lundi' le dimanche 29/11, 'ce soir' le 25/11 (hier)
- Temps gagné gonflé : les livrables générés sont enregistrés avec spent 0, donc le gain net est égal à la référence avant toute relecture (server/assist.js, logTime)
- Pas d'authentification ni de multi-utilisateur : impossible de mesurer la productivité de 22 personnes, et le Pilotage repose sur des données d'amorce
- Aucun import ni aucune synchro Hektor ; aucun envoi réel (tout est consigné)
- Checklists non relues par un juriste et pas d'export de contrôle horodaté
- Fautes visibles qui nuisent à l'image haut de gamme ('Relancer le acquéreur', compte rendu transformé en 'Mail de remerciement')

# Verdict d'Hélène, agence de prestige, Antibes (3 agences, 22 personnes, sous Hektor)

J'ai ouvert le README, parcouru les écrans (Temps gagné, Conformité, Factures, Pilotage) et `server/assist.js`. J'ai aussi testé l'API en marche, en lecture seule. Je vous dis franchement ce que j'ai vu, pas ce que la stratégie promet.

## Ce qui me ferait acheter

- **La mesure du temps gagné, net des corrections.** Aucun de mes outils ne me la donne. Hektor me dit combien de mandats nous avons, jamais combien d'heures mon équipe perd à rédiger. Le principe « référence moins relecture moins corrections », avec calibrage au chrono et export CSV, est exactement ce que je veux montrer en réunion de direction.
- **La checklist LCB-FT avec preuve obligatoire.** J'y ai trouvé les PPE, les listes de gel et la déclaration Tracfin (L561-15), chaque point rattaché à son article et à une étape bloquante. C'est la réponse au constat de la DGCCRF : « aucune trace » de la vigilance. Si un contrôleur entre demain, c'est ce dossier que je veux lui tendre.
- **Le principe « rien ne part sans être coché ».** Chez nous, un e-mail mal tourné à un vendeur à 4 M€ coûte plus cher qu'une heure perdue.

## Ce qui me fait fuir, testé sur l'API

1. **Le contrôle LCB-FT rate les vrais signaux d'alerte.** Premier test : « paiement via société offshore aux BVI, il veut signer vite ». Le plan n'a vu que la dernière phrase et m'a proposé de « compléter les contrôles d'identité ». Il ne signale ni vigilance renforcée ni risque pays, et ne parle pas de déclaration de soupçon. Deuxième test : « le client paie en espèces une partie ». **Rien du tout.** Le moteur ne repère que les mots « origine des fonds », « tracfin » ou « kyc » écrits en toutes lettres. Or mes conseillers n'écrivent pas « tracfin », ils écrivent « espèces ». Sur le seul sujet qui peut me valoir une sanction, l'outil me donne une fausse impression de sécurité. C'est pire que de ne rien avoir.
2. **Les dates sont fausses d'un jour.** Nous sommes le jeudi 26 novembre. L'API a placé « jeudi » au mercredi 2 décembre, « lundi » au dimanche 29 novembre, et « ce soir » au 25 novembre, c'est-à-dire hier. Le décalage est systématique, sans doute un problème de fuseau horaire (UTC). Une relance notaire posée le mauvais jour, dans mon métier, c'est un compromis qui glisse.
3. **Le temps gagné est flatteur.** Dans `timelog`, les livrables générés automatiquement (D1, D2, D3, brief du matin) sont enregistrés avec `spent: 0`. Le gain net est donc égal au temps de référence, alors que personne n'a encore relu le document. Votre seul argument différenciant, la mesure nette, est gonflé dans les données que j'ai vues.
4. **Aucun usage en équipe.** Pas d'authentification, un seul poste (« Claire Delmas »), un Pilotage alimenté par des données d'amorce. Or je veux justement mesurer la productivité de 22 personnes. Aujourd'hui, c'est impossible.
5. **Rien ne part réellement**, et il n'y a pas d'import Hektor. Si je dois ressaisir mes mandats, la réponse est non.
6. **Des fautes qui cassent l'image.** J'ai lu « Relancer le acquéreur », et « Envoyer le compte rendu » devient « Mail de remerciement ». Ma clientèle remarque ce genre de détail.

## Comparaison avec Hektor

Hektor est mon socle : biens, diffusion, contacts. Il est lourd, mais il est fiable et multi-utilisateur. Jaspe ne le remplace pas, et je suis d'accord avec votre « pas de CRM concurrent ». En revanche, comme couche par-dessus Hektor, il ne vaut quelque chose que si trois conditions sont réunies : il lit Hektor, il travaille pour toute l'équipe, et sa conformité ne laisse pas passer des espèces. Aucune des trois n'est remplie aujourd'hui.

## Sur votre grille de prix

Le prix de 9,90 € ne me parle pas, et il me dérange presque : pour une agence de prestige, « pas cher » sonne « pas sérieux » en matière de conformité. Le plan Agence à 49 € jusqu'à 7 conseillers ne correspond pas à ma taille. Avec 22 personnes, je suis à 49 + 15 × 6 = 139 €/mois, ce qui reste raisonnable. Je paierais **jusqu'à 250 €/mois pour les trois agences**, Pack Preuves compris, à condition que :

- l'export de contrôle soit relu et daté par un juriste ;
- le gain de temps soit prouvé sur ma propre équipe.

Votre garantie « 2 h nettes ou remboursé » est une bonne idée, mais elle ne tient que si la mesure est honnête (voir le point 3).

## Les 5 changements qui me feraient signer

1. **Une détection LCB-FT sérieuse** : espèces, société offshore, pays à risque, pression sur le délai, PPE, prix incohérent. Chaque signal déclenche une vigilance renforcée et propose une analyse de soupçon tracée. Chaque règle est relue par un juriste.
2. **Des comptes multi-utilisateurs avec rôles** (direction, responsable d'agence, conseiller) et un tableau de productivité par agence et par conseiller, alimenté par de vraies données.
3. **Un import ou une synchro Hektor** des biens, contacts et mandats, sans double saisie.
4. **Une mesure du temps qui ne compte un gain qu'après validation humaine**, et des dates calculées sur le fuseau Europe/Paris.
5. **Une finition haut de gamme** : documents aux couleurs de l'agence, français irréprochable, export PDF du dossier de contrôle horodaté, hébergement UE.

## Ce que je dirais à un confrère

« L'idée est la bonne : mesurer le temps et garder la preuve de conformité, personne d'autre ne le fait. Mais n'y mets pas encore ta conformité. J'ai écrit "paiement en espèces" et l'outil n'a rien vu. Les dates sont décalées d'un jour, et c'est mono-poste. Repasse dans six mois, quand il sera branché sur Hektor et relu par un juriste. À ce moment-là, je serai probablement la première à signer. »