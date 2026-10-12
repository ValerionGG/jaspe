# Brief phase 3 — enrichissement complet, messagerie, stepper vendeur, tutoriels, version commerciale

Lis dans l'ordre : `BRIEF-AGENTS.md` (direction artistique), `BRIEF-V3.md` (données vivantes, actions serveur, double thème — toujours valable), puis ce document qui prime.

Exigence du client, mot pour mot : « chacune des sections doit être enrichie, représentative de ce que j'ai demandé, finie et enrichie ; tu dois finir tes tâches et ne plus te tromper ou oublier ». Donc : aucune section maigre, aucun bouton mort, aucun texte « à venir », aucune incohérence de données, double thème vérifié, mobile vérifié.

## Nouveautés côté données (lis ces fichiers)
- `src/data/messaging.ts` : conversations (WhatsApp, e-mail, SMS, portails, canaux internes #équipe), messages, modèles approuvés (variables `{{prenom}}`, `{{date}}`, `{{heure}}`, `{{lieu}}`, `{{bien}}`, `{{conseiller}}`), rappels programmés, tags suggérés. Hooks dans `collections.ts` : `useConversations`, `useMessages`, `useTemplates`, `useReminders`.
- `src/data/dossier.ts` : modèle enrichi du parcours vendeur stocké sur le dossier (`journey`) : découverte D5 en 5 blocs (`DISCOVERY_BLOCKS`), débrief vocal, photos, coaching, mandat, diffusion, visites et retours, bilans vendeur J+7/J+21/J+42, offres, compromis/acte (checklist), après-vente. Amorces riches : d1 (complet), d3, d4, d6, d8.
- `src/crm/dossier/` : `Stepper.tsx` (stepper 8 étapes, avancement calculé), `index.tsx` (`StepView` + type `StepProps` : `dossier`, `journey`, `save(patch, extra?)`, `openDeliverable(code)`, `goTo(step)`), `useJourney.ts`, et un fichier par étape à remplir.
- Actions serveur nouvelles (`action(name, payload)`) :
  - `message.send {conversationId, text, template?, attachments?, scheduleAt?}` — WhatsApp : refus 409 sans consentement (`optIn:false`) ou hors fenêtre 24 h sans modèle approuvé ; externe = « consigné · connecteur … non configuré » ; interne = « distribué » ; mentions @Prénom notifiées.
  - `message.receive {conversationId, text}` (simulation d'entrant : classement auto des tags AUT-112 + notification), `message.suggest {conversationId}` → `{suggestions: string[]}`, `conversation.read {id}`.
  - `reminders.scheduleEvent {eventId}` (J-1 18:00 + H-2 via modèle), `reminder.cancel {id}`. Routine AUT-110 traite les rappels échus chaque minute (message consigné dans la conversation WhatsApp), AUT-111 alerte si client sans réponse > 2 h.
- Collections serveur autorisées en plus : conversations, messages, reminders, templates, tutorials.

## Date de démonstration
L'ancrage de démo devient **lundi 12 octobre 2026, 10:36** (le 11/10/2026 est un dimanche : erreur à supprimer partout). Seul l'agent « coherence » modifie les données de dates ; les autres n'écrivent jamais « samedi 11 octobre ».

## Images
Utilise les images existantes de `/img`. Une banque enrichie arrive en parallèle (mêmes noms conservés + nouveaux) : ne code pas en dur des URL externes.

## Vérifications (obligatoires, comme V3)
`npx tsc -b` propre sur tes fichiers ; captures 1440×900 clair ET sombre + 390×844 ; persistance testée (recharger) ; données de test nettoyées ; rapport final ≤ 15 lignes.
