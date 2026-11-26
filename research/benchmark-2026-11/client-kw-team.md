# Verdict client : Tiago, team leader Keller Williams à Porto (12 agents), utilise KW Command imposé par le réseau, cherche un outil qui se pose PAR-DESSUS sans remplacer Command, très sensible au prix par siège et à l’onboarding sans formation.

**Achète : non** · prix max 90 €/mois · notes {"utilite": 6, "gainTempsCredible": 3, "conformite": 6, "ux": 4, "prix": 7, "global": 4}

**Bloquants :**
- Brief et extraction incapables de lire le portugais : plan vide sur un brief PT, y compris un paiement en numerario (signal BCFT)
- Dates de relance décalées d'un jour (ymd en UTC dans server/assist.js) : vendredi donne jeudi, ce soir donne hier
- Temps gagné surévalué : les entrées réelles du timelog ont spent=0 et comptent 100 % de gain sur des livrables non relus
- Pas d'authentification ni de multi-utilisateur : inutilisable pour une équipe de 12 agents
- Aucun envoi réel et aucun import depuis KW Command : double saisie
- Interface trop large (23 pages, stepper 8 étapes) qui double Command au lieu de se poser par-dessus ; onboarding impossible sans formation
- Pack conformité PT (IMPIC, BCFT) non relu par un juriste et sans export de contrôle

# Verdict de Tiago, team leader KW Porto (12 agents)

Je l'ai testé. Je ne me suis pas contenté de lire la promesse. J'ai lu le README, j'ai parcouru les écrans (23 pages, plus de 8 700 lignes de TSX) et j'ai envoyé de vrais briefs à l'API locale. Mon avis est simple : **l'intention est bonne, mais je ne peux pas déployer ça demain chez mes 12 agents.**

## Ce qui m'a plu

- **Le temps gagné mesuré net des corrections.** Personne ne me montre ça, ni Command, ni Casafari. Command me dit combien de leads mes agents ont, jamais combien d'heures ils ont perdues à écrire des e-mails. Avec un vrai chiffre « minutes nettes par agent et par semaine », j'aurais un argument de recrutement et de coaching.
- **La conformité avec preuve.** En PT, le BCFT (Lei 83/2017) et la communication trimestrielle IMPIC, c'est aujourd'hui un fichier Excel et des photocopies. Si Jaspe me sortait un dossier de contrôle horodaté par transaction, je paierais pour ça seul.
- **Le principe « rien ne part sans validation »** avec la phrase source citée sous chaque action. C'est rassurant pour un team leader qui ne veut pas qu'un agent junior envoie n'importe quoi à un vendeur.
- **Le positionnement « à côté du CRM ».** C'est exactement ce que je cherche, puisque Command m'est imposé par le réseau.

## Ce qui me fait fuir (constaté, pas supposé)

1. **Le Brief ne comprend pas le portugais.** J'ai envoyé « Angariação T2 Bonfim, proprietária Ana Sousa, ligar sexta, enviar CMA amanhã, comprador estrangeiro paga em numerário 300 mil ». Réponse : `{"items":[]}`. Rien. Même pas le paiement en espèces, qui est un signal BCFT évident. Mes agents parlent portugais. À Porto, c'est éliminatoire.
2. **Les dates sont fausses.** « Rappeler le vendeur vendredi » donne le 26/11, qui est jeudi. « Ce soir » donne le 25/11, donc hier. « Relance jeudi » donne le 02/12, un mercredi. La cause est dans `server/assist.js` : `ymd()` utilise `toISOString()`, en UTC, ce qui décale d'un jour le soir. Une relance datée faux, c'est pire que pas de relance.
3. **L'extraction est naïve.** Dans mon brief FR mélangé, le vendeur devient « le acquéreur ». « Sr. » coupe la phrase. Le prix de 450 000 €, le nom et l'adresse ne sont pas extraits. « Envoyer le compte rendu » génère deux actions en doublon. C'est du regex (pas de clé IA chez moi), et ça se voit.
4. **Le temps gagné est gonflé.** Dans `/api/timelog`, les 5 entrées réelles ont toutes `spent: 0`. Des livrables générés par routine, que personne n'a relus, comptent 100 % de gain : 25 min pour un brief, 30 min pour des comparables. Les 25 autres entrées sont des `demo`. Votre meilleur argument, c'est la mesure. Si elle compte ce que personne n'a lu, je la démonte en cinq minutes devant mon broker.
5. **Les bases manquent.** Il n'y a ni authentification ni multi-utilisateur. C'est un poste de démo au nom de « Claire Delmas ». Il n'y a aucun envoi réel et aucun import. Pour une équipe de 12 agents, ça ne passe pas.
6. **Trop d'écrans.** 23 pages, un stepper en 8 étapes, L1 à L9, plus de 100 routines, une page « Étude & benchmark » dans le produit. Mes agents ont déjà Command, avec ses SmartPlans et Opportunities. Ils ne vont pas apprendre un deuxième CRM. Ce que je veux, c'est 3 écrans, pas 23.

## Comparaison avec mon outil actuel

KW Command me donne les contacts, le pipeline, les SmartPlans de relance et le marketing, et il est inclus dans mes frais de réseau. Jaspe double une partie de tout ça : contacts, biens, agenda, pipeline, messagerie. C'est exactement ce que je ne veux pas. Le vrai trou de Command, c'est :

- le compte rendu vendeur rédigé après le rendez-vous ;
- la conformité PT ;
- la préparation des factures ;
- la preuve du temps gagné.

Si Jaspe se limitait à ces quatre points, en portugais, il serait complémentaire. Aujourd'hui, il se présente comme un CRM concurrent.

## Ce que je paierais

Je veux un forfait d'équipe, pas un prix par siège. Pour 12 agents, avec votre grille « 49 € jusqu'à 7 puis 6 € par siège », j'arrive à 79 €/mois. C'est acceptable **si** le Pack Preuves PT est inclus, ou à +6 € par agence et non par siège. Mon plafond : **environ 90 €/mois pour l'équipe**, soit 7,50 € par agent. Au-delà, je dois justifier la dépense auprès du market center, et je n'ai pas de chiffre fiable à montrer. Le plan Découverte gratuit, je le donnerais à 2 agents pour un test.

Une remarque sur votre stratégie : 9,90 € par mois n'a aucun intérêt pour moi si l'outil ne parle pas portugais. Le prix n'est pas mon problème, l'adéquation l'est.

## Les 5 changements qui me feraient signer

1. **Le portugais (PT-PT) partout** : interface, Brief, dictée, livrables, et la détection des signaux BCFT (« numerário », comprador estrangeiro, procuração).
2. **Mode « par-dessus Command »** : un import CSV des contacts et listings exportés de Command, et un seul écran Débrief → compte rendu vendeur + relances à recopier ou envoyer. Masquer biens, pipeline, messagerie et agenda.
3. **Des dates justes et une mesure honnête** : corriger le fuseau horaire, et ne compter du temps gagné que pour un livrable ouvert, relu et validé. Afficher la méthode.
4. **Des comptes d'équipe** : 12 logins, une vue team leader (comptes rendus envoyés en moins de 24 h, temps gagné par agent, dossiers BCFT incomplets).
5. **Un Pack Preuves PT réel** : export IMPIC, dossier BCFT par transaction, relu par un jurista, avec un badge « vérifié le… ».

Et un envoi e-mail réel, sinon tout le reste n'est que de la préparation.

## Ce que je dirais à un confrère

« Regarde-le dans 3 mois. L'idée est la bonne : un assistant qui rédige, qui prouve la conformité et qui mesure le temps gagné, posé à côté de Command. Mais aujourd'hui, c'est une démo française, mono-poste. Le Brief ne comprend pas une phrase en portugais et décale les dates d'un jour. S'ils sortent la version PT, les comptes d'équipe et l'export IMPIC, je le teste avec deux agents. »

**Fichiers vérifiés :** `D:\Jaspe\README.md`, `D:\Jaspe\server\assist.js` (l.65-100 : `parseDue` / `ymd` en UTC, règles FR uniquement ; l.119-121 : `logTime` avec `spent = 0` par défaut), `D:\Jaspe\app\src\crm\pages\*.tsx`, `D:\Jaspe\app\src\crm\BriefComposer.tsx`. API testée : `assistant.plan` (FR et PT) et `GET /api/timelog`, en lecture seule.
