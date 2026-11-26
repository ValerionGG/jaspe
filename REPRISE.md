# Reprendre Jaspe — guide pour les développeurs

À jour au 26 novembre 2026. Lire ce fichier en premier, puis `README.md` (fonctions détaillées) et `deploy/dokploy/README.md` (mise en ligne).

## 1. Le produit en une minute

Jaspe est l’**assistant du conseiller immobilier**, France et Portugal. Il ne remplace pas le CRM de l’agence (eGO, Hektor…) : il rend **le temps d’après rendez-vous** et le **mesure**, corrections comprises.

Parcours suivi (fiche parcours, `docs/sources/attentes-client.md`), en 7 moments :
1. Préparer le rendez-vous.
2. Dicter le débrief.
3. Éditer les documents.
4. Relancer.
5. Suivre le marché.
6. Négocier.
7. Finaliser la vente.

Règle d’or : **rien ne part sans validation du conseiller**. Tout ce que l’IA, les routines ou Claude/Codex préparent arrive dans « Tâches & validations ».

Positionnement retenu (retours terrain de Christophe) : « Votre CRM fait tourner l’agence. Jaspe vous rend le temps d’après rendez-vous — et vous montre combien, corrections comprises. » Prix : bêta gratuite ; puis Solo 9,90 €/mois, Agence 49 €/mois.

## 2. Où c’est

| Quoi | Où |
|---|---|
| Code | GitHub `ValerionGG/jaspe` (public) |
| Travail récent | branche `fix/audit-compte-reel-beta`, **PR #2 ouverte** (https://github.com/ValerionGG/jaspe/pull/2) : à relire puis fusionner dans `main` |
| Production réelle | https://jaspe.217-160-124-232.nip.io (Dokploy M3, projet « Jaspe », application « app ») |
| Démo statique | https://valeriongg.github.io/jaspe/ (branche `gh-pages`, données dans le navigateur) |

Après la fusion de la PR #2 : dans Dokploy › Jaspe › app › General, passer la branche à `main`.

## 3. Démarrer en local

Prérequis : Node **22.13 ou plus** (utilise `node:sqlite`), npm.

```
npm run install:all          # dépendances app + serveur
npm start                    # build + serveur démo sur http://127.0.0.1:5318
npm test                     # 89 tests serveur, aucun appel réseau réel
```

- **Mode démo** (par défaut) : une base unique avec données fictives (`server/data/jaspe.sqlite`, supprimer pour repartir à zéro).
- **Mode comptes**, comme en production : `JASPE_AUTH=1 npm --prefix server start`. Une base par agence dans `server/data/orgs/`, comptes dans `server/data/accounts.sqlite`.
- **Développement front** avec rechargement : `npm run dev` (port 5317, API proxifiée vers 5318).
- **Image de production** : `docker build -f deploy/dokploy/Dockerfile -t jaspe .`, puis `docker run -p 5318:5318 -v jaspe-data:/app/server/data jaspe`.

## 4. Architecture

```
app/      React 19 + Vite + Tailwind + motion (TypeScript strict)
  src/landing/     site public (accueil, tarifs, inscription…)
  src/crm/         l’application (/app) : pages/, dossier/ (fiche vendeur), messages/
  src/data/        store.ts (collections synchronisées, SSE), identity.ts (qui est connecté), plans.ts (prix)
  src/i18n/        fr.ts / pt.ts (useT) — toute nouvelle clé dans les DEUX fichiers
server/   Node 22 sans framework (node:http) + node:sqlite (magasin de documents JSON)
  index.js         serveur HTTP, routes, câblage par agence (makeCtx)
  engine.js        actions métier + routines (moteur) — PUR JS, aussi exécuté dans le navigateur (démo statique)
  assist.js        temps gagné, conformité FR/PT, brief → plan d’action, factures
  auth.js          comptes, sessions, équipes, offres (bêta gratuite si Stripe absent)
  mcp.js           serveur MCP (Claude, Codex, ChatGPT) — 12 outils
  importer.js      import CSV eGO / Hektor ; market.js : ventes réelles DVF ; whatsapp.js ; mailer.js ; invoicing.js ; evidence.js (Pack Preuves LCB-FT) ; contract.js (lecture de compromis PDF)
deploy/dokploy/   Dockerfile et notice de production
docs/             audit, panel, simulation, relecture juridique, sources (voir §8)
research/         études concurrentielles et benchmarks
```

Conventions à respecter :
- **Modules partagés purs.** `engine.js`, `assist.js`, `templates.js`, `actor.js`… tournent aussi dans le navigateur : aucune API Node dedans. On injecte les dépendances Node depuis `index.js` (`engine.extend({ actions, rules })`).
- **Démo intacte.** En compte réel (`useIdentity().real`), jamais de donnée de démonstration (personnes, chiffres, dates). En démo, rien ne change.
- **Auteur des actions.** Côté serveur, utiliser `actor()` (utilisateur connecté, « Jaspe » pour les routines), jamais un nom écrit en dur.
- **Temps gagné.** Une entrée `timelog` ne compte qu’à la validation. Le gain vaut la référence manuelle (`BASELINES`) moins le temps de relecture et de correction.
- **Aucun chiffre inventé.** Une source absente s’affiche comme absente (« Estimation à préparer », « aucune source publique »), jamais en `NaN` ni avec une fausse source.
- **Textes en français**, apostrophes typographiques (’). Le portugais (pt-PT) passe par i18n.
- **Commits** signés avec `Co-Authored-By` quand ils sont faits avec Claude ; jamais de secret dans Git.

## 5. État fonctionnel

| Fonction | État |
|---|---|
| Comptes, équipes, invitations, mot de passe oublié | fait (e-mails réels si SMTP configuré) |
| Bêta gratuite sans Stripe ; paiement Stripe prêt | fait (Stripe non branché, volontairement) |
| Brief / débrief → plan d’action (FR et PT), relances datées | fait |
| Documents (brief, compte rendu, estimation, sélection acquéreurs…) à relire et valider | fait (rédaction par règles ; IA si clé Anthropic) |
| Temps gagné mesuré, par type et par conseiller, export CSV | fait ; références **à calibrer** avec de vrais conseillers |
| Conformité FR/PT, Pack Preuves LCB-FT, lien de dépôt client, IMPIC | fait ; **relecture juridique à faire** |
| Import CSV eGO / Hektor | fait ; **à tester sur un vrai export** |
| Ventes réelles (DVF, France) | fait, en production ; Portugal : Casafari si clé |
| Débrief WhatsApp (multi-agences) | fait ; nécessite un compte WhatsApp Business |
| Factures (FR) et InvoiceXpress (PT) | fait ; émission certifiée via InvoiceXpress |
| MCP : Claude, Codex, ChatGPT | fait, testé en production (Réglages › Intégrations) |
| Portugais | écrans principaux et fiche dossier ; reste : mode complet, livrables L1–L9 |
| Page Marché | estimation et carte encore **simulées** (étiquetées comme telles) |

## 6. Clés à fournir (Dokploy › Jaspe › app › Environment)

Les clés sont saisies par le responsable du projet, jamais dans Git :
- `ANTHROPIC_API_KEY` : copilote et lecture des compromis.
- `SMTP_*` : envois d’e-mails réels.
- `WHATSAPP_*` et `JASPE_STT_*` : débrief WhatsApp et transcription des vocaux.
- `CASAFARI_*` : comparables au Portugal.
- `STRIPE_*` : paiement ; plus tard, à l’ouverture.

Détail dans `deploy/dokploy/README.md`. Sans clé, la fonction reste « consignée » (préparée, pas envoyée).

## 7. Priorités pour la suite

Issues du panel de 100 clients simulés et de l’audit :
1. **Prouver le temps gagné.** Calibrer avec 3 à 5 vrais conseillers (Temps gagné › Calibrer) ; faire une démo chronométrée face à ChatGPT sur un vrai dossier.
2. **Envois réels sans configuration.** E-mail de l’agence et numéro WhatsApp partagé Jaspe.
3. **Relecture juridique FR/PT.** Remettre `docs/juridique/RELECTURE.md` à un avocat, puis afficher la date de relecture dans l’app. Régénérer le document après chaque changement des règles : `node server/relecture-juridique.js > docs/juridique/RELECTURE.md`.
4. **Imports.** Tester sur de vrais exports eGO et Hektor, puis ajouter Apimo, AC3 et Netty ; prévoir un réimport régulier.
5. **Hébergement.** Choisir un hébergeur européen et signer le contrat de traitement (DPA) avant la vente ; le serveur Dokploy M3 actuel est partagé.
6. Portugais complet, livrables en anglais (haut de gamme), page Marché sur données réelles.

## 8. Documents à lire

| Document | Contenu |
|---|---|
| `docs/sources/attentes-client.md` | fiche parcours (PDF) et retours de Christophe : la référence produit |
| `docs/audit-2026-11/AUDIT.md` + `captures/` | test réel en compte, note 53 → 84/100, défauts corrigés et restants |
| `docs/panel-100/SYNTHESE.md` (+ 4 fichiers) | 100 clients simulés : achat, prix, objections |
| `docs/simulation/RESULTATS.md` | conseillers virtuels qui font tout le parcours (`node server/simulate-beta.js 12`) |
| `docs/juridique/RELECTURE.md` | toutes les règles légales appliquées, à faire valider |
| `research/05-*.md`, `research/06-*.md`, `research/benchmark-2026-11/` | études concurrentielles, prix, marché FR/PT |
| `deploy/dokploy/README.md` | production : réglages Dokploy, clés, vérification |

## 9. Vérifier qu’une version marche

```
npm test                                                        # 89 tests
npx --prefix app tsc -b --noEmit                                # types
node server/simulate-beta.js 6                                  # parcours complet de 6 conseillers virtuels
node server/verifier-en-ligne.js https://jaspe.217-160-124-232.nip.io   # production, comme Claude/Codex
```

## 10. Précautions

- **Dokploy est partagé** avec une trentaine d’autres projets M3 : ne toucher qu’au projet « Jaspe ». Ne jamais supprimer le volume `jaspe-data` (comptes et bases des agences) sans sauvegarde.
- **Accès eGO.** Des identifiants d’un compte eGO tiers ont circulé dans une conversation : ne pas les utiliser. Demander un export à une agence.
- **Comptes de test en production.** Deux agences « Vérification … » créées par le script de vérification peuvent être ignorées ou supprimées.
