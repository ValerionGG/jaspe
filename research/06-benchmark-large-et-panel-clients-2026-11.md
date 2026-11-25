# Benchmark large, stratégie et verdict de 4 clients simulés (novembre 2026)

**Méthode.** Le benchmark a mobilisé dix agents :
- **cinq chercheurs** en parallèle : Portugal, France et Europe, assistants IA dans le monde, prix et modèles économiques, voix des agents immobiliers ;
- **un directeur produit**, qui a synthétisé leurs travaux ;
- **quatre clients simulés**, qui ont lu le code et testé l'API de l'application en marche.

Les sources sont publiques : web, avis clients, presse, Reddit et forums lus via le lecteur Agent Reach (Jina). Aucun compte n'a été utilisé. Marqueurs : **[V]** vérifié, **[T]** source tierce, **[S]** supposition.

Les rapports complets sont dans `research/benchmark-2026-11/` :
- `recherche-pt.md`, `recherche-fr-eu.md`, `recherche-ai.md`, `recherche-pricing.md`, `recherche-voice.md` (les cinq volets de recherche) ;
- `strategie.md` (la synthèse du directeur produit) ;
- `client-*.md` (les quatre verdicts clients).

---

## 1. Ce qui change par rapport à l'étude 05

- **La dictée du compte rendu est devenue le minimum attendu.** Capifrance et Optimhome la proposent (nov. 2026) [V], comme efficity LYA [V], Inmovilla « WhatsApp + IA » [T] et Rechat AI Memo [V]. Jaspe doit se distinguer ailleurs.
- **Casafari est un concurrent direct, pas seulement une source de données.** Il propose un AI Presentation Builder, un CRM gratuit à vie, et met en avant un témoignage chez Christie's : « 4 heures → 5 minutes » [V, déclaratif].
- **eGO** revendique 4 500 entreprises et 40 000 utilisateurs [V, déclaratif]. Son app ChatGPT reste **en lecture seule** [V]. Ses prix ne sont toujours pas publiés [V].
- **Portugal**
  - Le pays compte 11 574 licences AMI, soit des entreprises et non des personnes [T].
  - Les 5 premiers réseaux réunissent 24 825 consultants [V].
  - Environ 60 % des consultants de réseau ne choisissent pas leur CRM [S]. Il faut donc **vendre au consultant et cohabiter avec l'outil du réseau**.
- **Les trous de marché sont confirmés** :
  - aucun outil anti-blanchiment pour l'immobilier, en France comme au Portugal ;
  - aucune déclaration IMPIC préremplie ;
  - aucune mesure du temps gagné **nette des corrections**.

## 2. Positionnement recommandé

> **Jaspe envoie votre compte rendu vendeur le jour même, avec les relances, le contrôle légal FR/PT et la facture de commission. Il affiche les minutes nettes récupérées. 9,90 € par mois, à côté du CRM que vous avez déjà.**

Ce n'est pas un CRM de plus : c'est un assistant qui se branche sur eGO, Hektor, KW Command ou Casafari.

## 3. Prix recommandés

| Plan | Prix HT | Contenu |
|---|---|---|
| Découverte | 0 € à vie | 1 dossier actif, 30 min de dictée par mois, temps gagné, factures avec filigrane |
| **Solo** | **9,90 €/mois ou 99 €/an** | 8 dossiers, 300 min de dictée, relances, conformité FR ou PT, factures, export |
| Agence | 49 €/mois jusqu'à 7 conseillers, puis 6 € par siège | Tableau de direction, export hebdomadaire |

**Options :**
- **Pack Preuves** à +6 € : export de contrôle LCB-FT, lien client « origine des fonds », IMPIC anexo B ;
- **Données marché** à +9 € ;
- recharges de dictée et de documents.

**Règles commerciales :** sans engagement, 15 jours remboursés. **Garantie « 2 h »** : un mois mesuré sous 2 h nettes gagnées est remboursé.

**Rentabilité.**

| Routage des modèles d'IA | Coût IA par utilisateur et par mois | Marge Solo |
|---|---|---|
| Tout sur Opus | 5,5 à 7 € | quasi nulle |
| Routage Haiku / Sonnet / Opus | environ 1,4 € | **environ 79 %** (coût variable total environ 2,1 €) |

Le point mort est atteint vers **380 abonnés payants**, ou environ 200 si les options portent le revenu moyen à 17 € [S].

## 4. Verdict du panel clients (application testée réellement)

| Client simulé | Outil actuel | Achète ? | Prix max | Note globale |
|---|---|---|---|---|
| Francisca, agence de 8 conseillers, Cascais | eGO Pro | **Non** | 99 €/mois (agence) | 4/10 |
| Karim, mandataire indépendant, Nice | Outil du réseau | **Oui sous conditions** | 15 €/mois | 5/10 |
| Hélène, prestige, Antibes (22 personnes) | Hektor | **Non** | 250 €/mois (agence) | 4,5/10 |
| Tiago, team leader KW, Porto (12 agents) | KW Command | **Non** | 90 €/mois (équipe) | 4/10 |

**Le panel valide :**
- le prix (7 à 9/10) ;
- l'idée de la mesure du temps ;
- le plan d'action à valider case par case ;
- la conformité sourcée.

**Ce qu'il sanctionne** concerne la fiabilité et le monde réel, pas le concept.

## 5. Corrigé immédiatement, après le panel

Ces corrections font partie de cette PR. Chacune est couverte par un test serveur ; les 4 tests passent.

1. **Dates décalées d'un jour.** Les dates étaient calculées en UTC : près de minuit, « vendredi » devenait jeudi et « ce soir » devenait hier. Elles sont désormais calculées en heure locale.
2. **Temps gagné surestimé.** Un brouillon généré ne compte plus aucun gain tant qu'il n'est pas relu et validé (statut `pending`). Le gain devient net de la relecture et des corrections au moment de la validation. Même règle pour les factures.
3. **Brief en portugais.** Jaspe comprend maintenant :
   - les verbes et les jours (*ligar*, *telefonar*, *sexta-feira*, *amanhã*, *daqui a 3 dias*) ;
   - les documents (*avaliação*, *relatório*, *certificado energético*) ;
   - les mots *proposta* et *numerário*.
4. **Offres détectées dans le brief.** Une offre ou contre-offre devient une tâche « Traiter l'offre de 1,65 milhões… », avec son échéance.
5. **Signaux d'alerte anti-blanchiment (LCB-FT/BCFT).** Ils proposent un contrôle de vigilance : espèces, *numerário*, offshore, BVI, société écran, paiement par un tiers, crypto, pays à risque, personne politiquement exposée (PEP).
6. **Faux positif supprimé.** « Appartement de 4 pièces » ne déclenche plus la demande de pièces de copropriété (L9).
7. **Coût de l'IA.** Le copilote passe de Opus (16 000 tokens) à Sonnet (4 000 tokens). Les deux valeurs sont réglables par variables d'environnement.

## 6. Ce qui reste bloquant pour signer (feuille de route)

**Vague 1, 2 semaines : rendre la bêta mesurable et rentable.**
1. Routage complet Haiku / Sonnet / Opus, avec journal du coût par appel.
2. **Import CSV eGO et Hektor** (biens, contacts). C'est la douleur n° 1, la double saisie [V Zillow].
3. Indicateur « compte rendu vendeur envoyé en moins de 24 h » et rapport hebdomadaire de valeur rendue.
4. Source affichée sur chaque chiffre des livrables, et pastille « non vérifié ».
5. Premier jour en 3 écrans : Brief, Débrief, Temps gagné. Le stepper complet est masqué en mode simple.

**Vague 2, 6 semaines : pouvoir vendre sans service client.**
6. Comptes, multi-utilisateur, paiement Stripe en libre-service, page de prix publique. **Sans cela, aucun revenu.**
7. **Pack Preuves** : export de contrôle LCB-FT horodaté et lien client « origine des fonds ». Faire relire les checklists par un juriste FR et un juriste PT.
8. Émission déléguée des factures : InvoiceXpress au Portugal, Factur-X en France. Deux modèles : agence → client, mandataire → réseau.

**Vague 3, 3 mois : se brancher partout.**
9. **Serveur MCP Jaspe** (8 à 10 outils) avec validation obligatoire. Il agira là où l'app ChatGPT d'eGO ne fait que consulter.
10. Extraction du PDF de compromis ou de CPCV : dates, conditions suspensives, pièces bloquantes.
11. **IMPIC anexo B prérempli** et rappel avant l'échéance.
12. Débrief par message vocal WhatsApp.

**Également demandé par le panel :** interface et livrables en portugais (pt-PT) ; envoi réel des e-mails après validation ; vraies données de marché (DVF en France, Casafari au Portugal).

## 7. À ne pas faire

- Aucun CRM concurrent : pas de portails, de site d'agence ni de diffusion d'annonces.
- Aucun agent vocal de qualification de leads.
- Pas de home staging.
- Pas de base de comparables construite en interne, pas de scraping.
- Aucun enregistrement du client par défaut.
- Aucun envoi sans validation.
- Pas de mise en service payante, d'engagement ni de devis.
- Pas d'émission de factures certifiées en interne.
- Pas de nouvelles routines : il y en a déjà plus de 100.
