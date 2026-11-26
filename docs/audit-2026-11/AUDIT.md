# Audit Jaspe — test réel en mode comptes (26 novembre 2026)

**Note : 53/100 au départ, 75/100 après la première vague, 84/100 après la deuxième.**

## Méthode

Test de bout en bout sur une copie locale en **mode comptes** (`JASPE_AUTH=1`, sans Stripe), comme un vrai bêta-testeur :

1. Inscription d’une agence française « base vide », puis d’une agence portugaise.
2. Import d’un export eGO (CSV, colonnes portugaises).
3. Création d’un dossier vendeur à partir d’un bien importé.
4. Passage sur tous les écrans du mode simple : Aujourd’hui, Tâches, Dossiers, Temps gagné, Conformité, Réglages.
5. Vérification en mobile (375 px).

Captures dans `captures/` : `01` à `11` avant corrections, `20` à `23` après.

Limites du test :
- **Back-office eGO réel non ouvert.** Je ne saisis pas de mot de passe à la place de l’utilisateur, et le compte fourni semble appartenir à un tiers (imonovo.pt).
- **Export eGO.** L’import a été testé avec un fichier construit sur le modèle d’un export eGO, pas avec un export réel.

## Grille de notation

| Critère | Poids | Départ | Vague 1 | Vague 2 | Ce qui manque encore |
|---|---|---|---|---|---|
| Vérité des données (rien d’inventé) | 20 | 6 | 15 | 18 | Page Marché : comparables encore simulés (étiquetés) ; bref affichage de la démo au tout premier chargement |
| Premier jour d’un vrai compte | 15 | 8 | 12 | 13 | Visite guidée pensée pour la démo |
| Mesure du temps gagné | 15 | 7 | 12 | 13 | Références à calibrer avec de vrais conseillers |
| Conformité et légal | 15 | 8 | 10 | 11 | Relecture par un avocat (dossier prêt : `docs/juridique/RELECTURE.md`) |
| Import depuis eGO / Hektor | 10 | 8 | 8 | 8 | Test sur un vrai export |
| Portugais | 8 | 4 | 5 | 7 | Écrans du mode complet et livrables L1–L9 encore en français |
| Ergonomie, vitesse, mobile | 10 | 6 | 7 | 7 | À mesurer sur un serveur réel |
| Sécurité et socle technique | 7 | 6 | 6 | 7 | Hébergement de production non choisi |
| **Total** | **100** | **53** | **75** | **84** | |

## Défauts trouvés et corrigés

### 1. Un compte réel affichait la démo (bloquant)

C’est ce qui ruinait la confiance, au cœur des retours de Christophe. Sur une agence neuve et vide (captures 03, 10) :

**Avant**
- Le nom affiché était « Antibes Vieille-Ville, Réseau Riviera · 6 agences » et l’utilisatrice « Claire Delmas ».
- La date était figée au « lundi 12 octobre », avec « Antibes 19° ».
- Le brief citait la Villa Martin, M. Haddad et la contre-offre Dubreuil.
- Les indicateurs étaient inventés : CA 168 k€, temps gagné 7 h 40, transformation 38 %, « 3 collègues en ligne ».
- La fiche dossier listait de faux acquéreurs (« Family Office L. 97 », M. Keller…) et de fausses personnes (Inès Morel, Me Faure).

**Après** (captures 20, 22, 23)
- Identité, agence, date et heure sont les vraies.
- Le brief est calculé sur les vraies données. Sur une base vide, il propose d’importer depuis eGO ou Hektor.
- Les indicateurs sont réels.
- Les personnes et acquéreurs viennent de la base, avec un état vide honnête.
- Nouveau point d’entrée commun : `useIdentity()` dans `app/src/data/identity.ts`.

### 2. Le temps gagné se contredisait (bloquant pour la promesse n°1)

**Avant**
- La carte « 7 h 40 cette semaine » était écrite en dur, à côté de « 0 h 00 gagnées » calculé juste en dessous.
- La file des tâches ajoutait 7 h 40 fictives.
- Un brief du matin sur une base vide comptait 15 min de gain.
- L’abonnement était affiché à « 10 €/mois » et à « 9,90 €/mois » sur la même page.

**Après**
- Une seule source de vérité : le journal des gains nets validés.
- Un brief sans rien à résumer ne compte pas de gain.
- L’abonnement est affiché à 9,90 € partout.

### 3. Sources inventées sur les faits du dossier (risque légal)

**Avant**
- Surface « Plan géomètre », année « Acte de propriété » (affichée « undefined »), DPE « Observatoire ADEME », pour un bien simplement importé.
- Estimation « NaN k€ – NaN k€ », et « 5 comparables » alors qu’il n’y en avait aucun.
- Le paragraphe « plusieurs homonymes dans les annuaires publics » était affirmé pour tout vendeur.
- Un bien créé à la main recevait une photo de démo et une année de construction « 2000 ».

**Après**
- Badges vrais (« Import eGO », « Saisi par le conseiller »), et seuls les faits présents sont comptés.
- « Estimation à préparer » et « Aucun comparable pour l’instant ».
- Plus d’homonymie inventée.
- Plus de valeur fabriquée à la création d’un bien.

### 4. Allégation d’hébergement fausse

**Avant :** « Données hébergées en France (Scaleway, Paris) ».

**Après :** la mention décrit ce qui est vrai (base séparée par agence, mots de passe hachés, cookie sécurisé) et indique que l’hébergement de production est à confirmer.

### 5. Sans Stripe, un compte restait bloqué à 1 dossier

**Avant :** l’offre Découverte, sans paiement possible, bloquait le bêta-testeur au deuxième dossier.

**Après :** mode **« Bêta gratuite »** automatique quand Stripe n’est pas configuré :
- dossiers illimités, jusqu’à 7 conseillers ;
- bandeau clair dans Réglages › Facturation ;
- `JASPE_BETA=0` force les quotas ;
- test automatique ajouté.

### 6. Autres corrections

- **Profil :** créé au nom du compte à l’inscription (avant, Réglages affichait Claire Delmas, son téléphone et sa carte pro).
- **Conseiller :** la liste du formulaire « Nouveau dossier » était vide sur un compte neuf. Elle propose maintenant le compte lui-même.
- **Numérotation :** les dossiers d’un compte réel commencent à `VND-2026-0001`, et non à la suite de la démo.
- **Adresse :** plus de virgule orpheline (« , Cascais ») quand l’adresse est vide.
- **Photo absente :** un visuel « Aucune photo pour l’instant » remplace l’image cassée.
- **Avatars :** initiales quand il n’y a pas de photo.
- **Import eGO :** titres générés en portugais pour une agence portugaise (« Moradia T5 — Alcabideche »).
- **Page d’accueil :** compteurs cohérents (« 9 livrables après chaque RDV », au lieu de « 14 » à côté de « neuf livrables »).
- **Animation d’entrée :** plus courte et sans flou, qui coûte cher sur mobile.

## Deuxième vague (même jour)

- **Écrans du mode complet** : Pilotage, Agenda, Messagerie, Studio, Coaching, Biens, Contacts, Acquéreurs, Transactions, Prospection, Réglages (Agence, Équipe, Marque, Sécurité), palette de commandes et copilote. En compte réel : uniquement l’agence du compte, la vraie date, des états vides honnêtes ; la démo est inchangée (captures 24, 25).
- **Dossier selon le pays** :
  - liste des pièces générée par pays et type de bien, avec référence légale courte et note « à confirmer par votre juriste » (capture 26). Pour la France : DDT selon l’année, copropriété, ASL. Pour le Portugal : caderneta, certidão permanente, licença de utilização, ficha técnica, IMI, não dívida ao condomínio ;
  - points à confirmer et questions adaptés au Portugal (IMI, condomínio, licença de utilização) ;
  - préparation et colonne de droite traduites en portugais.
- **Comparables réels** : D2 et L7 utilisent les ventes DVF réelles en France ; au Portugal, état vide expliqué (Casafari ou INE). Plus aucun NaN.
- **Débrief WhatsApp en mode comptes** : un seul webhook, chaque numéro de conseiller rattaché à une seule agence. Un numéro déjà pris par une autre agence est refusé (409) ; un numéro inconnu est ignoré. Test de bout en bout ajouté.
- **Auteur réel des actions côté serveur** : journal, validations, conformité, factures, jetons MCP. Avant, tout était signé « Claire Delmas » ; c’est maintenant l’utilisateur connecté, ou « Jaspe » pour les routines. Test ajouté.
- **Bug trouvé pendant le test** : la routine AUT-010 régénérait D1 à D3 toutes les minutes (v22 en 20 minutes). Elle écrasait les brouillons « à valider » et réessayait sans fin un livrable bloqué. Corrigé, avec un test de non-régression.
- **Dossier de relecture juridique** généré depuis le code (`server/relecture-juridique.js` vers `docs/juridique/RELECTURE.md`) : 213 lignes à cocher, 19 points incertains signalés, 5 questions ouvertes.

## Ce qui reste (prochaine vague)

1. **Page Marché** : brancher l’estimation et la carte sur les ventes DVF réelles (aujourd’hui simulées, étiquetées comme telles).
2. **Portugais** : écrans du mode complet, livrables L1–L9, D3/D4.
3. **Premier chargement** : ne plus afficher la démo une fraction de seconde avant la réponse du serveur en compte réel.
4. **Calibrage du temps gagné** avec 3 à 5 bêta-testeurs (chronomètre réel).
5. **Relecture juridique FR/PT** : remettre `docs/juridique/RELECTURE.md` à un avocat.
6. **Test sur un vrai export eGO** (et Hektor) fourni par une agence.
7. **Choix de l’hébergeur de production :** l’Europe est promise sur le site.
