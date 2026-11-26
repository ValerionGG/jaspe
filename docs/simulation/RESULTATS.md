# Bêta-test simulé — résultats

12 conseillers virtuels, une semaine de travail chacun, dans la vraie app (mode comptes, HTTP), selon la fiche parcours : préparer le RDV, dicter le débrief, relire et valider les documents, relancer.

**Chiffres simulés** : temps de relecture et taux de correction tirés au hasard selon le profil. Ils testent l’app et la mesure ; seuls de vrais conseillers donneront le vrai gain.

| Conseiller | Profil | Pays | RDV | Docs validés | Corrigés | Référence manuelle | Temps passé | Gain net | En attente |
|---|---|---|---|---|---|---|---|---|---|
| Claire Sim1 | Mandataire indépendant | FR | 5 | 15 | 5 | 9 h 35 | 0 h 44 | **8 h 51** | 30 |
| Hugo Sim2 | Négociateur en agence | FR | 9 | 27 | 6 | 17 h 19 | 0 h 47 | **16 h 32** | 54 |
| Sofia Sim3 | Agent haut de gamme | FR | 3 | 9 | 3 | 5 h 33 | 0 h 45 | **4 h 48** | 18 |
| Marc Sim4 | Consultor RE/MAX | PT | 8 | 24 | 5 | 14 h 24 | 0 h 55 | **13 h 29** | 48 |
| Inês Sim5 | Consultora agência eGO | PT | 6 | 18 | 4 | 10 h 48 | 0 h 55 | **9 h 53** | 36 |
| João Sim6 | Conseiller débutant | FR | 3 | 9 | 5 | 5 h 33 | 1 h 00 | **4 h 33** | 18 |
| Lucie Sim7 | Mandataire indépendant | FR | 5 | 15 | 4 | 10 h 35 | 0 h 40 | **9 h 55** | 30 |
| Rui Sim8 | Négociateur en agence | FR | 8 | 24 | 8 | 15 h 08 | 0 h 51 | **14 h 17** | 48 |
| Nadia Sim9 | Agent haut de gamme | FR | 3 | 9 | 1 | 5 h 33 | 0 h 39 | **4 h 54** | 18 |
| Tomás Sim10 | Consultor RE/MAX | PT | 6 | 18 | 2 | 10 h 54 | 0 h 40 | **10 h 14** | 36 |
| Élodie Sim11 | Consultora agência eGO | PT | 4 | 12 | 4 | 7 h 00 | 0 h 40 | **6 h 20** | 24 |
| Pedro Sim12 | Conseiller débutant | FR | 4 | 12 | 10 | 7 h 44 | 1 h 07 | **6 h 37** | 24 |

**Total** : 64 rendez-vous, 192 documents validés, 57 corrigés. Gain net moyen : **9 h 12 par conseiller et par semaine**, soit 2389 € par mois à 60 €/h pour un abonnement de 10 €.

## Comment le gain est calculé

- Chaque travail préparé par Jaspe a une **référence manuelle** (temps qu’il aurait pris à la main) : brief de RDV 25 min, compte rendu 10 min, estimation 45 min, sélection acquéreurs 25 min, relance 6 min, veille 20 min (`server/assist.js`, BASELINES).
- On retire le **temps réellement passé** à relire et corriger (chronométré dans l’app).
- Un brouillon ne compte **rien** tant qu’il n’est pas validé (colonne « En attente »).
- Ces références sont des valeurs par défaut : chaque conseiller peut les remplacer par son propre chrono (page Temps gagné › Calibrer). Avant de communiquer un chiffre, les calibrer avec 3 à 5 vrais conseillers.

## Problèmes rencontrés pendant la simulation

Aucun : tous les parcours sont allés au bout sans erreur.
