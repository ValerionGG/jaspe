# Panel de 100 clients simulés — synthèse (26/11/2026)

Quatre groupes de 25 personas, chacun jugeant l’app réelle (code, audit, captures) à l’aune de la fiche parcours (PDF) et des retours de Christophe. **Simulation** : utile pour prioriser, pas une étude de marché.

| Groupe | Achat ferme | À l’essai | Refus | Prix accepté (médiane) | Note |
|---|---|---|---|---|---|
| Indépendants et mandataires FR | 28 % | 40 % | 32 % | 10 €/mois (15 € chez les intéressés) | 58/100 |
| Agences FR | 20 % | 52 % | 28 % | 12 € par conseiller · ~110 € par agence | 55/100 |
| Consultants et agences PT | 36 % | 40 % | 24 % | 10 €/mois · 49 € par agence | 57,6/100 |
| Managers et commerciaux | 28 % | 36 % | 36 % | ~8 € par siège | 51,4/100 |
| **Ensemble** | **28 %** | **42 %** | **30 %** | **~10 € par conseiller** | **55,5/100** |

**Le prix n’est pas le frein** : 9,90 € passe chez tous ceux qui voient la valeur, ce qui confirme la cible de Christophe (« plug and play à 10 € »). **Le frein, ce sont les preuves.**

## Les objections qui reviennent dans les 4 groupes

1. **« Encore un outil à côté de mon CRM »** : seul un import CSV existe (eGO, Hektor), pas de synchronisation.
2. **« ChatGPT le fait gratuitement »** : la différence (mémoire du dossier, sources réelles, relances datées, mesure du gain) ne se voit qu’après un vrai dossier.
3. **« Prouvez le temps gagné »** : références par défaut, pas encore calibrées sur de vrais conseillers.
4. **Légal non relu par un avocat** et hébergeur non choisi.
5. **Jaspe prépare mais n’envoie pas** : sans configuration, relances, WhatsApp et e-mails sont seulement consignés.

## Corrigé tout de suite (même jour)

- **Site aligné sur le produit** :
  - une seule grille de prix partout (Découverte gratuite, Solo 9,90 €, Agence 49 €) ;
  - bêta gratuite affichée ;
  - plus de promesse de synchronisation Apimo / Hektor / Modelo ni de logos d’outils non branchés ;
  - plus de SMS ni de portails annoncés.
- **Positionnement de Christophe en accroche** : « Votre CRM fait tourner l’agence. Jaspe vous rend le temps d’après rendez-vous — et vous montre combien, corrections comprises. »
- **Les 7 moments du PDF** en page d’accueil, avec l’exemple « vendredi après le diagnostic ».
- **Exemples ordinaires** : T3 à 280 k€, Lisbonne. Codes D1–L9 remplacés par des noms.
- **Formule Solo** : passe de 8 à 20 dossiers actifs.
- **Temps gagné par conseiller** pour les managers : tableau et export CSV.
- **Exemple fil rouge du PDF** : en français comme en portugais, il donne la relance datée, le prix à confirmer et la veille des comparables proposée.
- **Résidus de démo** retirés (Coaching).

## Ce qu’il reste, par impact sur la vente

1. **Démo chronométrée face à ChatGPT** sur un vrai dossier, et calibrage du temps gagné avec 5 bêta-testeurs : c’est la preuve demandée par tous.
2. **Relances réellement envoyées sans configuration** (numéro WhatsApp Jaspe partagé, e-mail de l’agence).
3. **Relecture par un avocat FR et PT** (`docs/juridique/RELECTURE.md`), avec la date affichée dans l’app.
4. **Import testé sur un vrai export eGO et Hektor**, puis Apimo, AC3, Netty ; réimport régulier.
5. **Hébergeur européen et contrat de traitement (DPA)** ; livrables en anglais pour le haut de gamme.

Détail par groupe : `01-independants-fr.md`, `02-agences-fr.md`, `03-consultants-pt.md`, `04-managers-commerciaux.md`.
