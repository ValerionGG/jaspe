# Audit Jaspe — test réel en mode comptes (26 novembre 2026)

**Note : 53/100 avant corrections, 75/100 après.**

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

| Critère | Poids | Avant | Après | Ce qui manque encore |
|---|---|---|---|---|
| Vérité des données (rien d’inventé) | 20 | 6 | 15 | Liste « Pièces » figée à 11 éléments, comparables D2/L7 synthétiques, écrans du mode complet |
| Premier jour d’un vrai compte | 15 | 8 | 12 | Visite guidée pensée pour la démo |
| Mesure du temps gagné | 15 | 7 | 12 | Références non encore calibrées par de vrais conseillers |
| Conformité et légal | 15 | 8 | 10 | Relecture par un avocat FR/PT toujours à faire |
| Import depuis eGO / Hektor | 10 | 8 | 8 | Test sur un vrai export |
| Portugais | 8 | 4 | 5 | Intérieur des dossiers encore en français |
| Ergonomie, vitesse, mobile | 10 | 6 | 7 | Entrée des pages lente ; à mesurer sur un serveur réel |
| Sécurité et socle technique | 7 | 6 | 6 | Hébergement de production non choisi |
| **Total** | **100** | **53** | **75** | |

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

## Ce qui reste (prochaine vague)

1. **Écrans du mode complet** (Pilotage, Messagerie, Studio, Agenda, Coaching) : encore peuplés de données de démo en compte réel. À traiter comme les écrans du mode simple, avec états vides.
2. **Intérieur des dossiers en portugais :** parcours, livrables, points à confirmer. Ces points sont aujourd’hui français (taxe foncière, ASL) ; prévoir IMI, condomínio, caderneta predial.
3. **Comparables D2/L7 :** les brancher sur les vraies données (DVF déjà en place pour la France, Casafari ou INE pour le Portugal) au lieu de séries synthétiques.
4. **Liste « Pièces » :** la générer selon le pays et le type de bien.
5. **Calibrage du temps gagné** avec 3 à 5 bêta-testeurs (chronomètre réel).
6. **Relecture juridique FR/PT** des listes de conformité, de la grille LCB-FT et des mentions de facture.
7. **Test sur un vrai export eGO** (et Hektor) fourni par une agence.
8. **Choix de l’hébergeur de production :** l’Europe est promise sur le site.
