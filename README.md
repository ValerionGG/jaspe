# Jaspe — v2 fonctionnelle

**En ligne :** https://valeriongg.github.io/jaspe/ — portail de tous les accès : https://valeriongg.github.io/jaspe/#/portail

Landing animée + CRM/back-office complet, branchés sur une vraie API (Node 24 + SQLite natif), en mode **clair « Calcaire & Azur »** et **sombre « Nocturne Riviera »**. Aucun code repris des anciens ZIP ni de la v0.23.

## Lancer

Première fois : `npm run install:all` (depuis `design-v2/`).

| Usage | Commande | Adresse |
|---|---|---|
| Production locale (build + serveur) | `npm start` | http://127.0.0.1:5318 |
| Développement : API | `npm run api` | :5318 |
| Développement : front (HMR, proxy /api) | `npm run dev` | http://127.0.0.1:5317 |
| Tests serveur (parcours métier) | `npm test` | — |

Landing sur `/`, portail des raccourcis sur `/portail`, offre commerciale sur `/essentiel`, CRM complet sur `/app`, CRM Essentiel sur `/essentiel/app`. Base : `server/data/jaspe.sqlite` (supprimer le fichier pour repartir des données de démonstration). Copilote en langage libre : définir `ANTHROPIC_API_KEY` avant `npm start` (modèle `claude-opus-5-5`, repli serveur activé) ; sans clé, il répond par règles sur les données réelles.

## Architecture

- `server/` — zéro framework : `node:http`, `node:sqlite`.
  - `db.js` : magasin de documents JSON par collection, amorçage unique par collection.
  - `index.js` : REST générique (`/api/:collection[/:id]`), actions métier (`/api/actions/:nom`), flux temps réel SSE (`/api/stream`), fichiers (`/api/files`), sert `app/dist`.
  - `engine.js` : actions (génération/validation/édition des livrables, déplacement de dossier, file de validation, leads, envois consignés, routines) et **moteur de routines** exécuté chaque minute (AUT-046 brief du matin, AUT-033 pièces L9, AUT-039 bilan vendeur, AUT-042 offres, AUT-010 préparation RDV, AUT-004 leads en retard ; AUT-024/058/001/003/037 déclenchées par les actions). Chaque exécution est journalisée.
  - `templates.js` : livrables D1–D3 / L1–L9 générés uniquement à partir des faits du dossier, sources citées, contrôle qualité AUT-058.
  - `copilot.js` : Claude via le SDK officiel si une clé est configurée, sinon règles.
- `app/` — React 19, Tailwind (jetons en variables CSS), motion, GSAP/Lenis, MapLibre.
  - `src/data/store.ts` : cache par collection, mutations optimistes, temps réel, repli hors ligne (localStorage).
  - `src/data/collections.ts` : un hook par collection avec son amorce.
  - `src/ui/theme.tsx` : clair / sombre / système, sans flash au chargement.

## Version en ligne (GitHub Pages)
`npm --prefix app run build:static` produit `app/dist-static` : routes par ancre (`#/app`), chemins relatifs, et **moteur métier embarqué** (le même `server/engine.js` exécuté dans le navigateur) avec stockage local. Le copilote y répond par réponses préparées ; les fichiers déposés sont limités à 1,5 Mo.

## Ce qui fonctionne réellement
Création/édition/suppression persistées sur toutes les pages (dossiers, biens, acquéreurs, contacts et consentements, agenda, tâches, transactions et conditions, campagnes, routines, idées, réglages, équipe, coaching) ; glisser-déposer du pipeline ; génération, édition, versions, validation et programmation des livrables ; dépôt de pièces ; notes et journal ; notifications et exécutions de routines en direct ; formulaire de démo → lead + contact + tâche ; palette ⌘K sur les données vivantes ; impression PDF des livrables.

## Nouveautés (phase 3)
- Messagerie unifiée : WhatsApp (consentement, fenêtre 24 h, modèles approuvés), e-mail, SMS, leads portails, canaux d’équipe (mentions, réactions, épinglage), tags + classement automatique (AUT-112), suggestions de réponse, modèles, rappels WhatsApp J-1/H-2 automatiques (AUT-110), alerte client sans réponse (AUT-111).
- Dossier vendeur en stepper 8 étapes : préparation D1–D4 (carte quartier), découverte D5 en 5 blocs avec mode entretien et extraction du débrief, livrables L1–L9 enrichis, mandat, commercialisation (visites, bilans J+7/J+21/J+42), offres, compromis & acte, après-vente.
- Aide & tutoriels : visite guidée interactive (6 parcours), leçons, glossaire, FAQ, checklist de prise en main.
- Offre Essentiel (page commerciale + calculateur), édition CRM Essentiel, mode simple, portail des raccourcis.

## Nouveautés (phase 4 — retours bêta, novembre 2026)
Réponse aux retours des testeurs (étude complète : `research/05-etude-concurrentielle-2026-11.md`, aussi dans le CRM, page « Étude & benchmark »).
- **Temps gagné** (`/app/temps`) : gain net = référence manuelle − (relecture + corrections), par semaine et par type, calibrage au chrono, valeur en €, export CSV. Journalisé par le moteur (`server/assist.js`, collection `timelog`).
- **Conformité & veille légale** (`/app/conformite`) : checklists FR (Hoguet, LCB-FT, DPE, ERP…) et PT (Lei 15/2013, Lei 83/2017, IMPIC…), points bloquants par étape, preuve obligatoire, veille sourcée ; routine AUT-122.
- **Brief → plan d’action** (bouton « Brief ») : texte ou dictée → relances datées, brouillons, veille (AUT-121), facture, contrôles ; chaque action cite sa phrase et n’est lancée qu’une fois cochée (AUT-120).
- **Factures & commissions** (`/app/factures`) : brouillon depuis la transaction, validation (numéro FA-AAAA-NNNN figé), envoi consigné, encaissement ; TVA 20 % (FR) ou IVA 23 % (PT, document de préparation à émettre dans un logiciel certifié AT).
- **Retours bêta** : bouton bulle sur chaque écran, lecture et export dans Réglages ; pays d’exercice et mentions légales dans Réglages › Agence & réseau.

## Vague 1 (benchmark & panel clients, novembre 2026)
- **Routage IA** (`server/copilot.js`) : Haiku 5.5 pour lire, Sonnet 5.5 pour rédiger, Opus 5.5 pour auditer (compromis, conformité) ; prompt système en cache ; coût de chaque appel journalisé (collection `aicalls`). Modèles surchargeables : `JASPE_MODEL_LIRE`, `JASPE_MODEL_REDIGER`, `JASPE_MODEL_AUDITER`.
- **Import CSV eGO / Hektor** (`/app/import`, `server/importer.js`) : séparateur et source détectés, colonnes devinées puis corrigeables, prix/surfaces/typologies nettoyés, aucun doublon même en réimportant. Les en-têtes des exports réels restent à confirmer.
- **Compte rendu vendeur < 24 h** : délai entre la fin du RDV (dossier passé en « post ») et la validation de L1, suivi sur la page Temps gagné, avec la carte « Valeur rendue cette semaine » à copier ou imprimer.
- **Chiffres sourcés** : chaque livrable liste ses chiffres et leur source ; un chiffre sans source porte « non vérifié » et la validation d’un document client demande confirmation.
- **Premier jour en 3 écrans** : mode simple par défaut (Aujourd’hui, Tâches, Dossiers, Temps gagné, Import, Aide), carte « Premier jour » (brief → débrief → temps gagné) et stepper compact.
- Tests serveur : `npm test` (15 tests).

## Limites assumées
- Aucun envoi externe réel : e-mails, SMS, courriers, portails, signature, synchro agendas sont **consignés** (« connecteur non configuré »).
- Sans `JASPE_AUTH=1` : pas d’authentification ni de multi-utilisateur, poste local de démonstration (Claire Delmas).
- Données de démonstration synthétiques ; certaines séries historiques (pilotage) sont des amorces étiquetées.
- Pinterest inaccessible sans compte pendant la recherche visuelle.
- Contenus juridiques (checklists, grille LCB-FT, listes GAFI d’octobre 2025, mentions de facture, durées de conservation) : aide, pas un avis ; à faire relire par un juriste FR et un juriste PT.

## Pack Preuves (vague 2)
`server/evidence.js`, page Conformité › Preuves. Grille de risque LCB-FT/BCFT par partie (facteurs expliqués, signaux du brief pré-cochés, décision et justification du conseiller), lien client sans compte `/depot/:jeton` (14 jours, PDF/JPG/PNG vérifiés, 10 Mo, empreinte SHA-256, rattachement au point de checklist, déclaration d’origine des fonds), export de contrôle horodaté (HTML imprimable + JSON + empreinte), récapitulatif trimestriel IMPIC (Portugal, champs à confirmer). Avec les comptes, le jeton porte l’agence (`orgId.jeton`).

## Factures émises par un logiciel certifié (vague 2)
`server/invoicing.js`, page Factures. Deux modèles : agence → client et mandataire → réseau (franchise 293 B, recibo verde / art. 53.º CIVA selon réglage). Portugal : émission via l’API InvoiceXpress (`INVOICEXPRESS_API_KEY`, `INVOICEXPRESS_ACCOUNT`) qui renvoie numéro légal, ATCUD et PDF ; constantes de taxe marquées « à confirmer ». France : XML Factur-X EN 16931 (CII) à transmettre via une plateforme agréée ; pas de PDF/A-3 hybride.

## Comptes et paiement (vague 2)
Activer : `JASPE_AUTH=1` (comptes, une base par agence dans `server/data/orgs/<orgId>.sqlite`, comptes et abonnements dans `server/data/accounts.sqlite`). Paiement : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_SOLO_MONTH`, `STRIPE_PRICE_SOLO_YEAR`, `STRIPE_PRICE_AGENCE`, `STRIPE_PRICE_SEAT`, `STRIPE_PRICE_PREUVES`, `STRIPE_PRICE_DONNEES` ; option `JASPE_PUBLIC_URL` pour les URL de retour. Webhook Stripe : `POST /api/billing/webhook` (événements checkout.session.completed, customer.subscription.updated/deleted, invoice.payment_failed). Sans clé : 503 « Paiement non configuré ». Pages publiques `/tarifs`, `/connexion`, `/inscription`, `/invitation/:token`. Remboursement 15 jours et garantie « 2 h gagnées » : traités à la main. Pas de réinitialisation de mot de passe par e-mail (aucun envoi réel).

Tests serveur : `npm test` (41 tests, aucun appel réseau réel : Stripe et InvoiceXpress sont simulés).

## Recherche
`research/` : inspiration (Dribbble/Behance/Awwwards/sites), motion (MotionSites & co), benchmark de ~55 acteurs, 398 idées + 100 routines — consultables dans le CRM, page « Étude & benchmark ».
