# Verdict client : Karim, agent commercial indépendant en réseau mandataire (SAFTI) près de Nice, 25 ventes/an, travaille seul depuis sa voiture et son téléphone, budget outils serré, déteste la saisie, utilise déjà l’outil du réseau.

**Achète : oui sous conditions** · prix max 15 €/mois · notes {"utilite": 6, "gainTempsCredible": 3, "conformite": 6, "ux": 4, "prix": 9, "global": 5}

**Bloquants :**
- Aucun envoi réel : e-mails, SMS et WhatsApp sont seulement consignés, l'agent doit copier-coller
- L'extraction du brief (assistant.plan) repose sur des mots-clés : sur un débrief de visite réaliste, elle rate le retour vendeur, la contre-visite et l'offre (1 action sur 4 attendues)
- Faux positifs : « 4 pièces » déclenche L9 « Pièces copro & diagnostics » ; « compte rendu » produit un mail de remerciement ; prix, mandat et DPE ignorés
- parseDue convertit l'heure locale en UTC (toISOString) : près de minuit, « mardi » devient le lundi 30/11
- Le temps gagné est gonflé : les livrables D1 à D3 générés automatiquement comptent spent: 0, donc net = référence, sans relecture ni donnée réelle
- Pas d'authentification ni de compte personnel (poste de démonstration unique)
- Aucun import depuis l'outil réseau SAFTI : double saisie
- Pas de modèle de facture mandataire vers réseau
- Pas de vraie donnée de comparables (DVF), veille de démonstration
- Interface trop lourde pour un usage mobile en voiture (23 pages, parcours en 8 étapes)

# Verdict de Karim, mandataire SAFTI près de Nice (25 ventes par an)

Je ne vais pas noter la stratégie. Je note ce que j'ai eu entre les mains : le README, les écrans, et l'API `assistant.plan` testée en vrai. Je suis seul, souvent dans ma voiture, et j'ai déjà l'outil SAFTI. Pour que je paie un deuxième abonnement, il faut qu'il m'enlève de la saisie, pas qu'il m'en rajoute.

## Ce que j'ai testé, et ce qui s'est passé

**Premier test.** J'ai dicté comme je parle en sortant d'un rendez-vous : *« RDV chez Mme Rossi villa Cimiez 4 pièces, elle veut 850000, mandat simple, DPE E, rappeler le notaire mardi, envoyer compte rendu, facture commission 3% vente Dupont »*. Jaspe m'a proposé quatre actions :
- **Relancer le notaire** : correct.
- **Mail de remerciement (L1)** : ce n'est pas ce que j'ai demandé. Je voulais un compte rendu vendeur.
- **Pièces copro et diagnostics (L9)** : « 4 pièces » a été pris pour des pièces justificatives. C'est un faux positif sur un mot de base du métier.
- **Facture de commission** : correct.

Ce qu'il a raté sur ce premier test :
- Le prix de 850 000 n'est pas relevé.
- Le mandat simple et le DPE E ne déclenchent rien. Pour un DPE E, j'attendais au moins un rappel sur le gel des loyers et l'audit énergétique à la vente.
- « Mardi » est devenu le 30/11, un lundi. En lisant `parseDue` dans `server/assist.js`, j'ai vu que la date est calculée en heure locale puis convertie en UTC par `toISOString()`. Près de minuit, l'échéance recule donc d'un jour.
- Comme tout tenait en une seule phrase, les quatre actions héritent de la même échéance.
- Le champ « source » contient toute la phrase, pas le bout qui justifie chaque action.

**Deuxième test.** J'ai dicté un débrief de visite réaliste : *« Les Martin hésitent, veulent revoir samedi. Le vendeur M. Bianchi attend un retour demain. Offre possible à 410000. Penser au justificatif origine des fonds. »*. Jaspe n'a sorti **qu'une seule action**, la conformité. Il a raté la contre-visite de samedi, le retour au vendeur demain et l'offre probable. Pourtant, c'est exactement le quotidien d'un agent.

En lisant le code, j'ai compris pourquoi. Le « plan » est une série de mots-clés à repérer (`rappel|relanc|appeler…`, `visite|rdv` seulement avec une date). « Attend un retour » ne contient aucun de ces mots. Ce n'est pas de l'IA, c'est du filtrage par mots-clés. Le brief reste utile en démonstration, mais il n'est pas fiable sur le terrain.

**Temps gagné.** C'est le concept qui me plaît le plus : référence manuelle moins le temps de relecture et de corrections. Mais dans `/api/timelog`, les documents D1, D2 et D3 générés automatiquement affichent `spent: 0`, donc tout le temps de référence compte comme gagné. Un D2 « Comparables » à 30 minutes gagnées, alors qu'aucune vraie donnée de comparables n'est branchée, c'est de l'autosatisfaction. Le jour où je vérifie au chrono, je n'y crois plus. Les lignes `demo: true`, qui comptent bien la relecture, sont plus honnêtes que les vraies.

## Ce qui me ferait acheter

- **La conformité avec preuve obligatoire**, LCB-FT en tête. Aujourd'hui, l'outil SAFTI me demande des pièces, mais je n'ai pas de dossier de contrôle propre à sortir en un clic. Le Pack Preuves (export horodaté, lien client « origine des fonds » avec le texte de loi) m'intéresse vraiment, parce que c'est moi qui risque l'amende, pas le réseau.
- **Le compte rendu vendeur le jour même.** Mes vendeurs m'appellent pour savoir « où on en est ». Si un seul message part depuis le parking, je gagne des appels.
- **Rien ne part sans ma validation.** Bon principe.
- **Le prix public** à 9,90 €, sans engagement.

## Ce qui me fait fuir

1. **Rien n'est réellement envoyé** : tout est « consigné ». Je devrais copier-coller dans mon téléphone, donc ressaisir. C'est rédhibitoire.
2. **Pas de comptes** : c'est un poste de démonstration au nom de « Claire Delmas ». Pas de vraie application mobile pensée pour le pouce non plus. J'ai vu 23 pages dans le CRM et un parcours en 8 étapes, alors qu'il me faut 3 écrans.
3. **Aucun import** depuis l'outil SAFTI. Je ne retape pas mes 40 mandats.
4. **La facture de commission ne colle pas à mon cas** : mandataire, je facture le réseau, pas le client. Le modèle « mandataire → réseau » est prévu, mais il n'existe pas encore.
5. **Aucune vraie donnée DVF** : la veille et les comparables sont des données de démonstration.

## Face à mon outil actuel

L'outil SAFTI a mes biens, la diffusion et le suivi, et je le paie déjà dans ma redevance. Jaspe ne le remplace pas, et c'est bien qu'il ne cherche pas à le faire. Mais un outil « à côté » n'a de valeur que s'il coûte moins de saisie qu'il n'en fait gagner. Aujourd'hui, sans import, sans envoi réel et avec une extraction qui rate la moitié d'un débrief, le bilan est **négatif** pour moi.

## Ce que je paierais

- **9,90 €/mois** : oui, si les 5 points ci-dessous sont réglés. C'est un prix d'impulsion et je ne me poserais pas la question.
- **Pack Preuves à +6 €** : oui, s'il est relu par un juriste et qu'il produit un vrai export de contrôle.
- **Plafond : 15 € par mois** au total.
- **Données marché à +9 €** : non. DVF est gratuit, je veux ça dans le Solo.

## Les 5 changements qui me feraient signer

1. **Un débrief vocal fiable**, par WhatsApp ou par un bouton unique sur mobile. L'extraction doit passer par un vrai modèle de langage plutôt que par des mots-clés : personnes, prix, prochaine étape, échéance par proposition. Et il faut corriger le décalage horaire des dates.
2. **Un envoi réel du compte rendu vendeur**, par e-mail et WhatsApp, en un geste après validation.
3. **Un temps gagné honnête** : relecture comptée par défaut, et aucun gain affiché sur un livrable sans donnée réelle.
4. **Un import CSV depuis mon outil réseau** (biens et contacts) en moins de 10 minutes, plus un modèle de facture mandataire → réseau.
5. **Un compte personnel et un mode mobile en 3 écrans** (Aujourd'hui, Débrief, À valider), avec la garantie « 2 h » activée.

## Ce que je dirais à un confrère

« L'idée est la bonne : un truc qui fait le compte rendu vendeur, les relances et la paperasse LCB-FT pendant que ton CRM réseau garde les annonces, et qui te montre les minutes gagnées. Mais aujourd'hui, c'est une belle démo, pas un outil. Il n'envoie rien, il n'importe rien, et quand je lui ai dicté une vraie visite, il a oublié le vendeur qui attendait mon appel. Inscris-toi sur la liste d'attente, mais ne mets pas ta carte avant la version avec envoi réel et dictée mobile. À 9,90 €, le jour où ça marche, je le prends sans hésiter. »