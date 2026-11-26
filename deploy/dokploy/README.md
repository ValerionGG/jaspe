# Jaspe sur Dokploy

Jaspe en production réelle sur le Dokploy partagé de M3 (https://dokploy.m3.games), projet **Jaspe**, application **app**.
Comptes réels (`JASPE_AUTH=1`), une base SQLite par agence, bêta gratuite tant que Stripe n’est pas configuré.
Le serveur est partagé avec d’autres projets : ne toucher qu’au projet Jaspe.

| Réglage | Valeur |
|---|---|
| Type | Application, source **Git** publique `https://github.com/ValerionGG/jaspe.git` |
| Branche | `main` (déploiement automatique à chaque push) |
| Build | **Dockerfile**, chemin `deploy/dokploy/Dockerfile`, contexte `.` (racine) |
| Port du conteneur | `5318` |
| Domaine | `jaspe.217-160-124-232.nip.io`, HTTPS Let’s Encrypt (nip.io : pas de DNS à créer) |
| Volume (obligatoire) | volume nommé `jaspe-data` monté sur `/app/server/data` : comptes, bases des agences, pièces déposées |
| Environment | `JASPE_PUBLIC_URL=https://jaspe.217-160-124-232.nip.io` (+ clés facultatives ci-dessous) |

Sans le volume, chaque redéploiement efface les comptes. Ne jamais supprimer le volume sans sauvegarde.

## Clés facultatives (Environment de Dokploy, jamais dans Git)

| Fonction | Variables | Sans la clé |
|---|---|---|
| Copilote en langage libre, lecture des compromis PDF | `ANTHROPIC_API_KEY` | réponses et extraction par règles |
| Envoi réel des e-mails (comptes rendus, invitations, mot de passe oublié) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_SECURE` | envois consignés, pas émis |
| Débrief WhatsApp | `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` ; webhook Meta : `https://<domaine>/api/whatsapp/webhook` | débrief dans l’app seulement |
| Transcription des vocaux | `JASPE_STT_URL`, `JASPE_STT_KEY`, `JASPE_STT_MODEL` | vocaux refusés poliment |
| Factures certifiées Portugal | réglage par agence dans l’app (InvoiceXpress) | facture préparée, à émettre dans le logiciel certifié |
| Paiement | `STRIPE_*` (voir README principal) | **bêta gratuite** automatique |
| Comparables Portugal | `CASAFARI_API_KEY`, `CASAFARI_COMPARABLES_URL` | « aucune source publique » affiché |

Les ventes réelles en France (DVF) fonctionnent sans clé.

## Brancher Claude ou Codex (MCP)

Dans l’app : Réglages › Intégrations › « Créer un jeton », puis copier la configuration affichée.

- **Claude Code** : `claude mcp add --transport http jaspe https://<domaine>/mcp --header "Authorization: Bearer <jeton>"`
- **Codex** : `codex mcp add jaspe --url https://<domaine>/mcp --bearer-token-env-var JASPE_TOKEN`, avec le jeton dans la variable `JASPE_TOKEN`.

12 outils : 8 pour lire (dossiers, dossier, tâches du jour, validations en attente, temps gagné, conformité, ventes réelles comparables, recherche) et 4 pour préparer (plan depuis un brief, relance, document, facture). Les outils de préparation déposent une proposition dans « Tâches & validations » : rien n’est modifié ni envoyé sans le conseiller.

## Mettre à jour et vérifier

Pousser sur la branche suivie, puis *Deploy* dans Dokploy. Un 502 juste après le déploiement = conteneur qui démarre (~30 s). Ensuite :

```
node server/verifier-en-ligne.js https://jaspe.217-160-124-232.nip.io
```

La vérification crée un compte de test jetable, un dossier, un jeton MCP, appelle les outils comme Claude ou Codex, puis révoque le jeton.
