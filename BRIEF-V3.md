# Brief phase 2 — rendre chaque page fonctionnelle + double thème

Lis d'abord `BRIEF-AGENTS.md` (direction artistique, contraintes de code) puis ce document, qui le complète et prime en cas de conflit.

## 1. Le produit est désormais réel
- API Node + SQLite : `D:/Immo_Agent/design-v2/server` (déjà lancée sur :5318, proxifiée par Vite sur http://127.0.0.1:5317/api). Ne relance pas le serveur, ne modifie aucun fichier de `server/`.
- Couche de données front : `src/data/store.ts` + `src/data/collections.ts`. **Lis ces deux fichiers en entier.**
  - Chaque page lit ses données via les hooks de `collections.ts` (`useDossiers()`, `useProperties()`, `useEvents()`, `useQueue()`, `useTasks()`, `useContacts()`, `useTransactions()`, `useBuyers()`, `useRoutines()`, `useRuns()`, `useDocuments()`, `useOutbox()`, `useIdeas()`, `useCampaigns()`, `useConsents()`, `useIntegrations()`, `useSettings()`, `useNotes()`, `useFiles()`, `useActivity()`, `useNotifications()`, `useLeads()`, `useAgents()`). Chaque hook renvoie `[docs, ops]` avec `ops.create(doc)`, `ops.update(id, patch)`, `ops.remove(id)` — optimistes, persistés en base, diffusés en temps réel aux autres onglets, avec repli localStorage hors ligne.
  - **Plus aucune constante brute** (`DOSSIERS`, `EVENTS`, `CONTACTS`, `TXS`, `LISTINGS`, `QUEUE`, `CAMPAIGNS`…) ne doit être lue directement dans une page pour afficher des données modifiables : passe par le hook. Les constantes de libellés/config (STAGES, KINDS, DPE_C, PORTALS…) restent importables.
  - `prop(id)` / `agent(id)` de `mock.ts` lisent l'état vivant.
  - Pour une collection ajoutée par toi, tu ne peux pas modifier `collections.ts` : utilise directement `useCollection('<col>', seed)` de `store.ts` avec une collection existante de la liste blanche serveur : dossiers, properties, buyers, contacts, events, queue, tasks, transactions, activity, routines, runs, campaigns, consents, ideas, documents, settings, integrations, leads, notifications, files, outbox, notes, agents, coaching.
- Actions métier serveur (`action(name, payload)` de `store.ts`) :
  - `deliverable.generate {dossierId, code}` → génère le document (collection `documents`, id `${dossierId}-${code}`), passe le livrable en `review`, l'ajoute à la file `queue`.
  - `deliverable.generateAll {dossierId, codes?}` → lance plusieurs livrables (progressifs, temps réel).
  - `deliverable.validate {dossierId, code}` → `done`, retire de la file, crée un envoi `outbox` « programmé » pour L1/L3/L4/L5/L6/L7.
  - `deliverable.reject {dossierId, code, reason}`, `deliverable.edit {dossierId, code, subject?, body: string[]}`.
  - `dossier.move {id, stage}` (passage à `post` déclenche AUT-024 = 9 livrables), `task.toggle {id}`, `queue.resolve {id, decision}`, `lead.create {name,email,org,size}`, `outbox.send {id}`, `routine.toggle {id}`, `routine.run {id}` (renvoie les exécutions), `notifications.readAll`.
  - Fichiers : `uploadFile(file, dossierId?)` → collection `files`, lien de téléchargement `/api/files/<id>/raw`.
- Composants partagés à utiliser : `src/crm/forms.tsx` → `Modal`, `Field`, `Input`, `Select`, `Textarea`, `AsyncForm` (gère envoi/erreur), `toast(text, 'ok'|'error'|'info')`, `errText(e)`. Le composant `DocPaper` (rendu d'un livrable généré) est exporté par `src/crm/pages/DossierDetail.tsx`.
- Références déjà branchées à imiter : `src/crm/pages/Today.tsx`, `Dossiers.tsx` (glisser-déposer persistant + modale « Nouveau dossier »), `DossierDetail.tsx` (aperçu réel, valider/modifier/régénérer, dépôt de pièces, journal + notes).

## 2. Exigence « tout fonctionne »
- Chaque bouton visible fait quelque chose de réel et persistant : créer, modifier, supprimer, changer un statut, assigner, reporter, valider… avec retour (`toast`) et gestion d'erreur. Les formulaires de création/édition utilisent `Modal` + `AsyncForm` avec validation des champs obligatoires.
- Ce qui dépend d'un service externe non configuré (envoi e-mail réel, SMS, portails, signature électronique, synchro Google) : l'action est **consignée** (outbox, statut, journal) et l'interface l'affiche honnêtement (« consigné — connecteur non configuré »). Jamais de faux « envoyé ».
- Les chiffres agrégés affichés (compteurs, KPI d'en-tête de page) se recalculent depuis les données vivantes quand c'est possible.
- États vides soignés (`Empty` de `ui.tsx` ou équivalent) quand une liste filtrée est vide.
- Vérifie la persistance : crée/modifie un élément, recharge la page, il doit être toujours là. Puis nettoie tes données de test via l'UI (supprimer) si elles polluent la démo.

## 3. Double thème clair / sombre (OBLIGATOIRE)
- Toutes les couleurs sont des variables CSS (voir `src/index.css` : `:root` = Nocturne, `[data-theme='light']` = Calcaire & Azur, `.theme-azur` = panneaux nuit azur en clair). Les classes Tailwind `ink/bone/mist/champagne/sea/sage/coral/white` s'inversent automatiquement. `white/[x]` = teinte de contraste (blanc en sombre, encre en clair).
- Interdit : couleurs hexadécimales ou rgba en dur (sauf échelle DPE et contenu de document imprimable) — utilise `rgb(var(--acc-500))`, `rgb(var(--tint) / .1)` etc. (dans une classe arbitraire Tailwind, remplace les espaces par `_`).
- Documents « papier » (aperçus de livrables, courriers) et textes posés sur photo qui doivent rester clairs : ajoute la classe `theme-dark` sur le conteneur (force les jetons sombres localement : papier `bg-bone-50` clair + texte `text-ink` foncé).
- Contrôle visuel obligatoire de chaque page : 1440×900 en **clair ET sombre**, puis 390×844 dans un thème. Pour basculer : `navigate_page` avec `initScript: "localStorage.setItem('nxt-theme','light')"` (ou 'dark'). Corrige tout contraste illisible, accent invisible, carte fantôme.

## 4. Vérifications
- `npx tsc -b` sans erreur sur tes fichiers.
- Outils `mcp__plugin_chrome-devtools-mcp_chrome-devtools__*` : `new_page` avec isolatedContext = ton nom d'agent, `emulate` viewport, `select_page` bringToFront avant chaque `take_screenshot`. Ferme tes pages à la fin.
- Rapport final ≤ 15 lignes : fichiers modifiés, ce qui est désormais persistant, ce qui reste consigné faute de connecteur.
