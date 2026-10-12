# NXT Agent — v2 fonctionnelle

**En ligne :** https://valeriongg.github.io/nxt-agent/ — portail de tous les accès : https://valeriongg.github.io/nxt-agent/#/portail

Landing animée + CRM/back-office complet, branchés sur une vraie API (Node 24 + SQLite natif), en mode **clair « Calcaire & Azur »** et **sombre « Nocturne Riviera »**. Aucun code repris des anciens ZIP ni de la v0.23.

## Lancer

Première fois : `npm run install:all` (depuis `design-v2/`).

| Usage | Commande | Adresse |
|---|---|---|
| Production locale (build + serveur) | `npm start` | http://127.0.0.1:5318 |
| Développement : API | `npm run api` | :5318 |
| Développement : front (HMR, proxy /api) | `npm run dev` | http://127.0.0.1:5317 |
| Tests serveur (parcours métier) | `npm test` | — |

Landing sur `/`, portail des raccourcis sur `/portail`, offre commerciale sur `/essentiel`, CRM complet sur `/app`, CRM Essentiel sur `/essentiel/app`. Base : `server/data/nxt.sqlite` (supprimer le fichier pour repartir des données de démonstration). Copilote en langage libre : définir `ANTHROPIC_API_KEY` avant `npm start` (modèle `claude-opus-5-5`, repli serveur activé) ; sans clé, il répond par règles sur les données réelles.

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

## Limites assumées
- Aucun envoi externe réel : e-mails, SMS, courriers, portails, signature, synchro agendas sont **consignés** (« connecteur non configuré »).
- Pas d’authentification ni de multi-utilisateur : poste local de démonstration (Claire Delmas).
- Données de démonstration synthétiques ; certaines séries historiques (pilotage) sont des amorces étiquetées.
- Pinterest inaccessible sans compte pendant la recherche visuelle.

## Recherche
`research/` : inspiration (Dribbble/Behance/Awwwards/sites), motion (MotionSites & co), benchmark de ~55 acteurs, 398 idées + 100 routines — consultables dans le CRM, page « Étude & benchmark ».
