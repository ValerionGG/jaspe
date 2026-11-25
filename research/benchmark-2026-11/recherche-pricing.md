# Jaspe : benchmark des prix et des modèles économiques (25/11/2026)

Ce document complète `D:\Jaspe\research\05-etude-concurrentielle-2026-11.md` sans le refaire. Légende : **[V]** vérifié sur la page de l'éditeur (lue via r.jina.ai ou la documentation officielle), **[T]** source tierce (comparateur, agrégateur), **[S]** supposition ou calcul de l'auteur. Les prix sont HT sauf mention contraire. Hypothèse de change : 1 $ = 0,90 € [S].

## 0. Corrections à apporter à l'étude 05

- **Inmovilla.** L'étude 05 indique « environ 45 € par utilisateur » [T]. La page officielle affiche une **Full Edition à 79 €/mois ou 790 €/an**, avec une promotion la première année à 632 € + TVA, canal de signalement inclus [V] (https://www.inmovilla.com/precios). Le tarif est donc presque le double de celui retenu dans 05.
- **Witei.** Le chiffre « environ 25 € par module » est confirmé, et la page officielle donne la grille complète : **25 / 45 / 65 €/mois + TVA**, pas de frais d'inscription, pas d'engagement, et **15 jours satisfait ou remboursé** [T, citant https://get.witei.com/en/prices-crm]. C'est le seul CRM immobilier du panel dont la page tarifaire est entièrement self-serve.
- **Apimo.** L'étude 05 indique 89 à 139 €. Hackceleration confirme 89 €/mois, mais avec **un engagement de 12 mois et des frais de mise en route** [T] (https://www.hackceleration.com/fr/labs/meilleur/logiciel-agence-immobiliere). Ce coût de sortie élevé est un argument pour Jaspe.
- **Hektor.** Le « dès 79 € HT » est confirmé [T], mais il n'existe aucune grille officielle publique. Kolonell évoque une mise en service de 1 500 à 5 000 € [T, source intéressée : l'auteur vend du sur-mesure] (https://kolonell.com/fr/blog/prix-logiciel-gestion-agence-immobiliere-2026).
- **InvoiceXpress.** Il existe désormais un **plan gratuit**, les plans payants démarrent à 3 €/mois [T] (https://www.e-konomista.pt/invoicexpress-lanca-plano-gratuito/), et le X10 est à 4,50 €/mois en promotion annuelle [T].
- **Code de Jaspe.** `D:\Jaspe\server\copilot.js` appelle `claude-opus-5-5` avec `max_tokens: 16000` pour toutes les questions [V, lecture du dépôt]. Si on garde ce routage tel quel, l'offre à 10 € n'est pas rentable (voir §4).

## 1. Tableau des prix : 30 outils

| # | Outil (pays) | Catégorie | Prix public /utilisateur/mois | Engagement | Mise en service | Options payantes | Essai | Tag |
|---|---|---|---|---|---|---|---|---|
| 1 | Follow Up Boss (US) | CRM immo | 69 $ ; 499 $ pour 10 utilisateurs ; 1 000 $ pour 30 | Aucun | 0 (« enhanced onboarding » sur le plan haut) | Appels +39 $/utilisateur | Oui ; 2 mois offerts en annuel | [V] |
| 2 | Wise Agent (US) | CRM immo | 49 $ (42 $ en annuel), forfait jusqu'à 5 membres | Mensuel | 80 $ unique sur une option | Modules à 5, 11 ou 20 $ | Oui | [V] |
| 3 | BoldTrail, ex-kvCORE (US) | Plateforme immo | Environ 300 à 500 $ pour un agent seul | Annuel | Sur devis | Nombreuses | Démo | [T] |
| 4 | Lofty (US) | Plateforme immo | Sur devis (environ 700 $ en Premier) | Annuel | 299 à 500 $ | Appels 79 $, SEO, frais publicitaires de 20 % | Non | [T] |
| 5 | Hektor (FR) | Logiciel d'agence | À partir de 79 € par agence (45 à 79 € par utilisateur) | Variable | 1 500 à 5 000 € | Modules | Démo | [T] |
| 6 | Apimo (FR/PT) | Logiciel d'agence | 89 € | 12 mois | Oui | Portails | 7 jours | [T] |
| 7 | Netty / Modelo (FR) | Logiciel d'agence | 49 € (Essentiel), 69 à 89 € (Boost) | Aucun | Non mentionnée | Boost | Oui | [T] |
| 8 | Avest (FR) | CRM + IA | 69 € | Sur devis | Non publiée | MCP, API | Non | [T, étude 05] |
| 9 | Witei (ES) | CRM immo | 25, 45 ou 65 € | Aucun | 0 | Imports 15 à 40 €, utilisateurs supplémentaires | Plan gratuit (500 contacts) + 15 jours remboursés | [T/V] |
| 10 | Inmovilla, groupe idealista (ES/PT) | CRM immo | 79 € (790 €/an) | Annuel conseillé | Non | Canal de signalement | Non | [V] |
| 11 | eGO Real Estate (PT) | CRM + site | Sur devis | SaaS périodique | Sur devis | Site, portails | Non | [T] |
| 12 | HCPro / idealista tools (PT/ES) | CRM | Sur devis | Non précisé | Non précisée | Non précisées | Non | [T] |
| 13 | Casafari (PT) | Données marché | Sur devis | Annuel | Non précisée | Non précisées | Démo | [T] |
| 14 | Clientify (ES) | CRM | 39 € (en annuel), 65 € (en mensuel) | Annuel | Non précisée | Non précisées | Non précisé | [T] |
| 15 | Mobilia (ES) | CRM immo | 49 € puis +20 € par utilisateur | Non précisé | Non précisée | Utilisateurs supplémentaires | Non précisé | [T] |
| 16 | Pipedrive | CRM générique | 14, 39, 59 ou 79 $ | Annuel ou mensuel | 0 | Add-ons | 14 jours sans carte | [V] |
| 17 | folk | CRM générique | 24, 48 ou 80 $ | Annuel ou mensuel | 0 | Quotas IA | Oui | [V] |
| 18 | Otter.ai | Prise de notes IA | 8,33 $ (annuel) ; 16,99 $ ; 24 à 30 $ | Mensuel | 0 | Non | Plan gratuit | [V] |
| 19 | Fireflies | Prise de notes IA | 10 $ ou 19 $ en annuel (18 $ ou 29 $ en mensuel) ; 39 $ | Mensuel | 0 | Non | Plan gratuit | [V] |
| 20 | tl;dv | Prise de notes IA | 0, 18 ou 29 $ | Mensuel | 0 | Non | Plan gratuit | [V] |
| 21 | Noota (FR) | Prise de notes IA | 19 € (Pro), 39 à 49 € (Business) | Annuel | 0 | Non | Oui | [T/V] |
| 22 | Leexi (BE/FR) | Prise de notes IA | 12, 23 ou 39 € ; Coach +16 € | Annuel ou mensuel | 0 | Coach | Oui | [T] |
| 23 | Plaud (matériel + abonnement) | Dictée | Starter gratuit (300 min), Pro (1 200 min), Unlimited | Annuel | Achat de l'appareil | Recharges de 600 à 6 000 min | Oui | [V], montants non lus |
| 24 | Yousign (FR) | Signature électronique | Gratuit (2 envois), One 9 €, Plus 23 €, Pro 38 € | Annuel | 0 | API | Oui | [T] (https://yousign.com/fr-fr/prix) |
| 25 | Galian, outil LCB-FT (FR) | Conformité | 50 € TTC par agence (25 € pour les abonnés) | Non précisé | Non précisée | Non précisées | Non | [T] (https://api-minio.galian.fr/galianfr/s3fs-public/2026-06/fiche-produit-lcbft-4.pdf) |
| 26 | Abby (FR) | Facturation | 0 ; 7,20, 11,25 ou 24,75 € (prix barrés à 9, 15 et 33 €) | Mensuel | 0 | Paiement de 1,5 à 3,4 % + frais fixe | Plan gratuit | [V] |
| 27 | Henrri (FR) | Facturation | 0 ; 5, 17 ou 39 € | Annuel ou mensuel | 0 | 1,2 % + 0,15 € par transaction | Plan gratuit | [V] |
| 28 | Indy (FR) | Facturation et comptabilité | 12 € (108 €/an) à 179 € | Annuel ou mensuel | 0 | Formule « Autonomie » de 15 à 49 € | Oui | [V] |
| 29 | InvoiceXpress (PT) | Facturation certifiée par l'administration fiscale | 0, puis 3 à 4,50 € | Annuel | 0 | API, MCP | Plan gratuit | [T] |
| 30 | Moloni (PT) | Facturation certifiée | 6,49, 10,90 ou 15,90 € ; +1 € par utilisateur | Mensuel | 0 | Utilisateurs | Oui | [T] |

Sources : https://followupboss.com/pricing, https://www.wiseagent.com/pricing/, https://www.pipedrive.com/fr/pricing, https://www.folk.app/pricing, https://otter.ai/pricing, https://fireflies.ai/pricing, https://www.tldv.io/pricing/, https://www.abby.fr/tarifs/, https://www.henrri.com/tarifs, https://www.indy.fr/tarifs/, https://www.logiciels.pro/netty/, https://www.luxurypresence.com/blogs/lofty-pricing/, https://aitoolsbakery.com/blog/boldtrail-pricing-2026/, https://www.lafabriquedunet.fr/logiciel/leexi, https://www.noota.io/fr/pricing-2026, https://www.g2.com/products/moloni/pricing, https://clientify.com/blog/crm/mejores-crm-inmobiliarias.

## 2. Plancher, médiane et plafond

| Catégorie | Plancher | Médiane | Plafond | Commentaire |
|---|---|---|---|---|
| CRM et logiciels d'agence FR/PT/ES (n = 10 prix connus) | 25 € (Witei) | **environ 69 à 79 €** | environ 89 € public, 450 € et plus pour les plateformes US | Les prix PT sont presque tous sur devis (eGO, HCPro, Casafari), donc opaques [T] |
| CRM immobiliers US (n = 4) | 42 $ | environ 69 $ | 500 à 700 $ | Les éditeurs US vendent des leads, pas du temps gagné |
| CRM génériques | 14 $ | environ 40 $ | 80 $ | Tous self-serve avec essai |
| Prise de notes IA (n = 6) | 8 $ | **environ 18 €** | 39 à 49 € | C'est la catégorie de prix à laquelle Jaspe sera comparé pour la dictée |
| Signature et conformité | 9 € | environ 23 € | 50 € TTC par agence (LCB-FT) | La conformité se vend par agence |
| Facturation | **0 €** (Abby, Henrri, InvoiceXpress) | environ 11 € | 39 € (hors comptabilité) | Le freemium est la norme. Les éditeurs PT sont environ deux fois moins chers que les FR |

Par pays [S, à partir du tableau] :
- **France** : les CRM sont entre 49 et 89 €, souvent avec engagement et frais de mise en service.
- **Portugal** : les CRM sont sur devis, mais la facturation y est très bon marché (0 à 16 €).
- **Espagne**, utile comme point d'entrée vers le PT : 25 à 79 €, transparent.

À **10 €**, Jaspe se situe sous le plancher des CRM et sous la médiane des outils de prise de notes. C'est un prix d'impulsion, mais pas un prix ancré sur la valeur.

## 3. Quels modèles fonctionnent sans service client ?

1. **Freemium à quota** (Abby, Henrri, InvoiceXpress, tl;dv, Witei avec 500 contacts) [V]. Le support est absorbé par la documentation et le plan gratuit. Le risque est la fraction d'utilisateurs gratuits qui consomment de l'IA.
2. **Abonnement par siège avec rabais annuel** (Pipedrive, folk, Follow Up Boss : « 2 mois offerts ») [V]. C'est le standard. Follow Up Boss inclut le support téléphonique 7 jours sur 7 [V], donc ce n'est pas un modèle « zéro support ».
3. **Usage, en minutes** : Plaud et Otter vendent des recharges de 600 à 6 000 minutes [V]. C'est adapté à la dictée, dont le coût est variable.
4. **Par transaction** : Henrri et Abby prennent 1,2 à 3,4 % des paiements encaissés [V]. Pour Jaspe, l'équivalent serait un prix par dossier.
5. **Contre-modèle** : Apimo, Hektor, eGO, BoldTrail et Lofty imposent devis, engagement et mise en service [T]. Ce modèle ne peut pas fonctionner sans équipe commerciale, et c'est précisément le terrain que Jaspe peut prendre.

**Élasticité et ancrage** [S] :
- La commission vendeur moyenne en France est de plusieurs milliers d'euros par vente. Trois heures gagnées par mois à 40 € de l'heure valent 120 €. À 10 €, Jaspe capte environ 8 % de cette valeur, alors que les SaaS B2B en captent habituellement 10 à 20 %.
- La demande est peu élastique au-dessus de 10 € chez les indépendants, à condition que le **temps gagné soit affiché en euros**.
- Les ancrages observés sont efficaces : prix barrés (Abby, Fireflies) [V], écart entre mensuel et annuel (Indy : 12 € par mois contre 108 € par an) [V], plan « équipe » cher placé à côté du plan solo pour le faire paraître bon marché (Follow Up Boss : 69 $ contre 499 $) [V].

## 4. L'équation du coût IA

**Prix API** [V, documentation Anthropic en cache au 03/11/2026, lue via le skill claude-api] :

| Modèle | Entrée ($/M tokens) | Sortie ($/M tokens) | Lecture de cache |
|---|---|---|---|
| Opus 5.5 | 4 | 20 | 0,20 |
| Sonnet 5.5 | 2 | 10 | 0,10 |
| Haiku 5.5 | 0,10 | 0,50 | — |

Le traitement par lots (Batch) coûte environ 50 % de moins. Opus 5.5 réfléchit toujours, avec un niveau d'effort `medium` par défaut.

Comparatifs :
- GPT-5 mini : 0,25 $ / 2 $ [T] (https://developers.openai.com/api/docs/pricing).
- Mistral Medium 3.5 : 1,50 $ / 7,50 $ [T] (https://mistral.ai/pricing/api/).
- Transcription : environ 0,003 $/min (gpt-4o-mini-transcribe, Voxtral) [T] (https://startupik.com/speech-to-text-api-pricing-2026/).

**Tokens consommés par dossier vendeur** (du brief jusqu'à l'acte) [S] :

| Étape | Appels | Entrée par appel | Sortie par appel |
|---|---|---|---|
| Débrief dicté (15 min, environ 3 000 tokens de transcription) | 1 | 6 000 | 1 500 |
| Documents FR/PT (mandat, courriers, annonce) | 5 | 8 000 | 2 000 |
| Relances | 10 | 3 000 | 400 |
| Veille marché | 4 | 10 000 | 1 000 |
| Offre, compromis et audit de conformité | 3 | 15 000 | 3 000 |
| Questions au copilote | 20 | 6 000 | 600 |
| **Total** | | **environ 281 000 en entrée** | **environ 40 000 en sortie, environ 60 000 avec la réflexion** |

**Coût par dossier selon le routage** [S] :

| Routage | Coût par dossier |
|---|---|
| Tout en Opus 5.5, sans cache | 1,12 + 1,20 = **2,32 $** |
| Tout en Opus 5.5, 60 % du contexte en cache | **environ 1,70 $** |
| Tout en Sonnet 5.5, avec cache | **environ 0,90 $** |
| Routage mixte : Haiku pour relances, extraction et classification ; Sonnet pour documents et offre ; Opus seulement pour l'audit du compromis | **environ 0,40 à 0,45 $** |

À cela s'ajoute la transcription, environ 0,05 $ par dossier.

**Coût par utilisateur et par mois** [S], avec 3 dossiers actifs et environ 60 questions au copilote :
- Opus seul : environ **5,5 à 7 €**. Ce n'est **pas viable à 10 €**.
- Routage mixte : environ **1,4 €**.

**Coût variable total par utilisateur à 10 €** [S] :

| Poste | Coût |
|---|---|
| IA | 1,4 € |
| Stripe (1,5 % + 0,25 €) | 0,40 € |
| Hébergement et stockage chiffré dans l'UE | 0,30 € |
| **Total** | **environ 2,1 €** |

La marge sur coût variable est donc de **7,9 €, soit environ 79 %**.

**Point mort** [S]. Coûts fixes retenus : 3 000 €/mois en version lean (infrastructure de base, assurance RC, comptabilité, acquisition minimale) ou 12 000 €/mois avec deux salaires. À 10 000 utilisateurs, les coûts fixes passent à 25 000 €.

| Utilisateurs | Chiffre d'affaires (10 €) | Marge sur coûts variables | Résultat (version lean) | Résultat (avec 2 salaires) |
|---|---|---|---|---|
| 100 | 1 000 € | 790 € | **−2 210 €** | −11 210 € |
| 1 000 | 10 000 € | 7 900 € | **+4 900 €** | −4 100 € |
| 10 000 | 100 000 € | 79 000 € | **+54 000 €** | +54 000 € |

Le point mort est à **380 utilisateurs** en version lean et à **1 520 utilisateurs** avec deux salaires. Avec un revenu moyen de 18 € grâce aux options, ces seuils tombent à environ 190 et 760 utilisateurs.

## 5. Trois grilles tarifaires pour Jaspe

### Grille A : « 10 € d'ancrage » (recommandée pour le lancement)
- **Gratuit** : 1 dossier actif, 30 minutes de dictée, factures illimitées en filigrane. C'est le modèle de Henrri et InvoiceXpress.
- **Solo : 9,90 €/mois, ou 99 €/an (2 mois offerts)**. Comprend 5 dossiers actifs, 300 minutes de dictée, les relances et le tableau de bord du temps gagné.
- Options :
  - Pack conformité FR/PT (LCB-FT, diagnostics, checklist compromis/CPCV) : **+6 €**, soit moins que Galian à 50 € TTC.
  - Facturation des commissions, au format Factur-X en France et via InvoiceXpress au Portugal : **+3 €**.
  - Veille marché enrichie : **+9 €**.
  - Dictée illimitée : **+5 €**.
  - Signature électronique : **1,50 € l'enveloppe**, refacturée avec marge.
- Revenu moyen visé : environ **17 €**.

### Grille B : « par dossier », aligné sur la commission
- **0 € d'abonnement**.
- **19 € par dossier** conduit jusqu'au mandat signé, plafonné à **49 €/mois**. Le premier dossier est gratuit.
- La conformité et la facturation sont incluses dans le dossier.
- Logique : moins de 1 % de la commission, et paiement uniquement quand le dossier avance. Les coûts IA restent couverts plus de 40 fois.

### Grille C : « bon / mieux / meilleur » pour le haut de gamme
- **Essentiel à 12 €**.
- **Pro à 29 €** : dossiers et dictée illimités, conformité, facturation, veille.
- **Agence à 19 € par siège, 3 sièges minimum**, avec tableau de bord direction et export du temps gagné.
- Affichage en ancrage : « Hektor/Apimo : environ 79 à 89 € + engagement 12 mois + mise en service ».
- **Garantie « 2 h gagnées »** : si le temps gagné mesuré est inférieur à 2 heures dans le mois, le mois est remboursé automatiquement.

Règles valables pour les trois grilles :
- Paiement par carte uniquement, sans engagement, remboursement en libre-service.
- Plafond d'usage IA par plan, avec dégradation vers Haiku au-delà au lieu d'une facture surprise.

## Idées à voler pour Jaspe

- **Garantie de remboursement de 15 jours, sans frais d'inscription ni engagement** affichée en tête de la page tarifaire. Inspiré de Witei.
- **Le prix barré et les « 2 mois offerts » en annuel** comme ancrage systématique. Inspiré d'Abby, Fireflies et Follow Up Boss.
- **Un plan gratuit qui facture déjà**, avec frais au pourcentage sur les commissions encaissées si le paiement en ligne est activé. Inspiré de Henrri (1,2 % + 0,15 €) et d'Abby.
- **Des recharges de minutes de dictée** (600, 3 000 ou 6 000 minutes) au lieu de quotas cachés. Inspiré de Plaud.
- **Un comparatif chiffré « engagement + mise en service » face aux leaders français** sur la page prix. Ce sont les points faibles d'Apimo (12 mois) et de Hektor (setup de 1 500 à 5 000 € [T]).
- **Une option conformité LCB-FT à prix agressif** (6 € contre 50 € TTC). Inspiré de Galian.
- **Un forfait équipe à coût marginal par siège dégressif** pour monter vers les agences. Inspiré de Follow Up Boss (49 $ puis 20 $ par utilisateur supplémentaire) et de Wise Agent (5 membres inclus).
- **Facturation au Portugal déléguée à un éditeur certifié bon marché** plutôt que développée en interne. Inspiré d'InvoiceXpress (gratuit à partir de 3 €) et de Moloni (6,49 €).
- **Des quotas IA visibles par plan** (champs IA, envois d'emails, automatisations). Inspiré de folk (2 000 « AI fields » par mois).
- **Un routage multi-modèles dans `server/copilot.js`** : Haiku 5.5 par défaut, Sonnet 5.5 pour les documents, Opus 5.5 réservé à l'audit du compromis, avec cache du prompt système. C'est la condition pour que la marge à 10 € existe.
