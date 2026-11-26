# Panel 03 : 25 consultores imobiliários au Portugal

*Simulation du 26/11/2026. Segment : consultants de réseau (RE/MAX, KW, ERA, Century 21, Zome, iad Portugal) et petites agences indépendantes sous eGO Real Estate, à Lisbonne, Cascais, Porto et en Algarve. C'est le terrain des bêta-testeurs de Christophe.*

**Base de l'évaluation : ce que Jaspe fait aujourd'hui, pas ce qu'il promet.**
- Audit du 26/11 (84/100) et captures 20, 23 et 26.
- Tarifs : Découverte 0 € (1 dossier), Solo 9,90 €/mois ou 99 €/an (8 dossiers), Agence 49 €/mois (7 conseillers, puis 6 €/siège). Options : Preuves +6 €, Données marché +9 €.
- Import eGO en CSV, ponctuel et sans synchronisation. Les en-têtes n'ont pas été testés sur un vrai export.
- Débrief WhatsApp : il faut un compte Meta WhatsApp Business et un service de transcription configurés côté serveur.
- Factures : émission via InvoiceXpress. Les constantes fiscales sont « à confirmer ».
- Pièces PT, IMPIC trimestral, grille BCFT : présents, avec la mention « à confirmer par votre juriste ».
- Comparables PT : état vide (Casafari ou INE non branchés).
- Portugais : mode simple traduit ; mode complet, livrables L4 à L9, D3 et D4, page Tarifs encore en français.
- Envois : e-mail réel si SMTP configuré, le reste est consigné.

**Hypothèse de départ, imposée par le brief :** ils ont tous eGO ou l'outil de leur réseau (« y'a tout »), et tous ont déjà essayé ChatGPT.

---

## Les 25 fiches

### 1. Rita Fonseca, RE/MAX Cascais
*Top 10 de son agence. 38 angariações par an, MAXWORK imposé, tout passe par WhatsApp.*
- **Ce qui la ferait payer :**
  - dicter dans la voiture après la visite d'évaluation, et retrouver le compte rendu vendeur et la relance de vendredi prêts à valider ;
  - c'est exactement le fil rouge du PDF.
- **Ce qui la bloque :**
  - le débrief WhatsApp demande une configuration Meta que son agence ne fera pas ;
  - l'appli web ne lui suffit pas : « Se não for no WhatsApp, não uso. »
- **Décision :** à l'essai. **Prix max :** 15 €/mois. **Note : 62/100.**

### 2. Tiago Marques, KW Lisboa (Avenidas Novas)
*33 ans, très à l'aise en technologie. Utilise Command et un GPT personnalisé pour ses comptes rendus.*
- **Ce qui le ferait payer :** une app qui *agit* dans Command (MarketPlace KW), pas une deuxième fenêtre.
- **Ce qui le bloque :**
  - « O ChatGPT já me faz o resumo em 30 segundos, de graça. » ;
  - il ne voit pas la mémoire du dossier tant qu'il n'a pas importé ses biens ;
  - l'import CSV depuis Command n'existe pas.
- **Décision :** non. **Prix max :** 0 €. **Note : 44/100.**

### 3. Ana Pires, gérante d'une agence indépendante, Porto (Boavista)
*6 consultants, eGO Pro, licence AMI à son nom.*
- **Ce qui la ferait payer :**
  - la déclaration IMPIC trimestrielle préremplie (anexo B) ;
  - le dossier BCFT par client ;
  - les factures de commission via InvoiceXpress, qu'elle utilise déjà ;
  - « Isto o eGO não faz. »
- **Ce qui la bloque :**
  - « a confirmar pelo seu jurista » sur la liste des pièces et sur l'échéance IMPIC : elle veut un outil relu, pas un brouillon juridique ;
  - réimporter les biens chaque semaine.
- **Décision :** oui (Agence). **Prix max :** 49 €/mois. **Note : 70/100.**

### 4. João Carvalho, ERA Lagos (Algarve)
*70 % d'acheteurs britanniques et français, appels WhatsApp en anglais.*
- **Ce qui le ferait payer :** des relances et une sélection de biens en anglais, générées depuis le dossier.
- **Ce qui le bloque :**
  - pas de livrables en anglais ;
  - le parcours est vendeur d'abord, alors que son métier, ce sont les acheteurs étrangers ;
  - le rapprochement acheteurs d'eGO est meilleur.
- **Décision :** à l'essai. **Prix max :** 10 €/mois. **Note : 58/100.**

### 5. Marta Sousa, Century 21 Porto (Bonfim)
*2 ans d'expérience, recibo verde, régime d'isenção art. 53.º.*
- **Ce qui la ferait payer :**
  - la page Temps poupado : enfin un chiffre pour savoir si ses soirées servent à quelque chose ;
  - la facture de commission au réseau avec le bon régime d'IVA.
- **Ce qui la bloque :**
  - les références du temps gagné ne sont pas calibrées sur le Portugal (« 45 min para um relatório ? Eu demoro 20. ») ;
  - elle ne sait pas si les 9,90 € s'entendent TTC.
- **Décision :** oui (Solo). **Prix max :** 9,90 €/mois. **Note : 66/100.**

### 6. Ricardo Almeida, team leader Zome Lisboa (Alvalade)
*Équipe de 4 consultants. Le suivi se perd entre collègues.*
- **Ce qui le ferait payer :**
  - voir quel engagement a été pris, par qui et pour quand ;
  - la file « Tarefas e validações » partagée.
- **Ce qui le bloque :**
  - l'outil Zome fait déjà le pipeline ;
  - l'offre Agence est pensée pour une agence, pas pour une équipe dans un réseau ;
  - la facturation passe par la franchise.
- **Décision :** à l'essai. **Prix max :** 30 €/mois pour l'équipe. **Note : 60/100.**

### 7. Helena Costa, iad Portugal, Almada
*Indépendante pure, pas d'agence physique, travaille seule depuis son téléphone.*
- **Ce qui la ferait payer :**
  - un assistant qui garde la mémoire de ses 10 dossiers ;
  - les pièces PT par type de bien (caderneta, certidão permanente, licença) : « Sempre me esqueço da ficha técnica. »
- **Ce qui la bloque :**
  - l'outil iad couvre déjà les annonces ;
  - elle a peur de payer deux fois pour la même chose.
- **Décision :** oui (Solo). **Prix max :** 12 €/mois. **Note : 68/100.**

### 8. Paulo Rodrigues, agence familiale de 2 personnes, Faro
*58 ans, eGO Base, tout au téléphone fixe et portable.*
- **Ce qui le ferait payer :** rien d'écrit. Peut-être un rappel de l'échéance IMPIC.
- **Ce qui le bloque :**
  - « Não tenho tempo para aprender outra aplicação. » ;
  - il n'écrit pas de comptes rendus et n'en veut pas ;
  - l'eGO lui a déjà coûté une formation.
- **Décision :** non. **Prix max :** 0 €. **Note : 35/100.**

### 9. Sofia Ribeiro, RE/MAX Porto (Foz)
*Haut de gamme, abonnée Casafari.*
- **Ce qui la ferait payer :** le débrief et les relances, que Casafari ne fait pas.
- **Ce qui le bloque :**
  - l'AI Presentation Builder de Casafari fait déjà l'étude de marché aux couleurs de l'agence ;
  - dans Jaspe, « Nenhum comparável por agora » : la carte Avaliação est vide au Portugal ;
  - Casafari n'est pas branché.
- **Décision :** à l'essai. **Prix max :** 20 €/mois (avec données). **Note : 55/100.**

### 10. Miguel Ferreira, directeur d'agence indépendante, Lisbonne (Campo de Ourique)
*10 consultants, eGO Start. Inspection IMPIC en 2025.*
- **Ce qui le ferait payer :**
  - le Pack Preuves : grille BCFT par partie, lien de dépôt client, export de contrôle horodaté ;
  - « Uma coima de 5 000 € paga dez anos disto. »
- **Ce qui le bloque :**
  - il exige une relecture par un avocat portugais avant de s'y fier ;
  - les mentions « à confirmer » doivent disparaître des points relus ;
  - l'hébergement de production n'est pas encore choisi (RGPD, données d'identité).
- **Décision :** oui (Agence + Preuves). **Prix max :** 79 €/mois. **Note : 74/100.**

### 11. Carla Mendes, KW Cascais
*Mélange de vente et d'arrendamento, beaucoup d'expatriés.*
- **Ce qui la ferait payer :** la liste des pièces par pays et le suivi des échéances du CPCV.
- **Ce qui le bloque :**
  - rien n'est prévu pour la location ;
  - pas d'anglais ;
  - elle a déjà testé ChatGPT pour lire un CPCV et trouve le résultat « parecido ».
- **Décision :** à l'essai. **Prix max :** 10 €/mois. **Note : 52/100.**

### 12. Bruno Teixeira, Century 21 Albufeira
*Ne tape rien : 30 notes vocales WhatsApp par jour.*
- **Ce qui le ferait payer :** envoyer un vocal à un numéro, recevoir un plan d'action et valider d'un clic.
- **Ce qui le bloque :**
  - aujourd'hui, il faut que son agence crée un compte Meta Business et configure la transcription : « Isso é para informáticos. » ;
  - c'est l'inverse du « plug and play » de Christophe.
- **Décision :** à l'essai. **Prix max :** 15 €/mois. **Note : 61/100.**

### 13. Inês Gomes, gestora processual d'une agence indépendante, Porto
*Back-office de 8 consultants. Prépare les CPCV et les escrituras.*
- **Ce qui la ferait payer :**
  - la lecture du CPCV avec les dates citées et les relances à J-7 ;
  - la liste des pièces PT conditionnelle ;
  - « Finalmente alguém pensou na ficha técnica e no não dívida ao condomínio. »
- **Ce qui le bloque :**
  - les livrables L4 à L9 sont encore en français ;
  - les pièces ne remontent pas dans eGO.
- **Décision :** oui (Agence). **Prix max :** 49 €/mois. **Note : 69/100.**

### 14. Duarte Lopes, ERA Lisboa (Parque das Nações)
*Ancien informaticien. A construit son propre flux ChatGPT + Notion.*
- **Ce qui le ferait payer :** le serveur MCP qui agit, mais il le reconstruirait lui-même.
- **Ce qui le bloque :**
  - « É um wrapper do Claude com formulários. » ;
  - aucune différence mesurée face à son propre flux ;
  - le prix n'est pas l'enjeu, la valeur ajoutée si.
- **Décision :** non. **Prix max :** 0 €. **Note : 40/100.**

### 15. Catarina Nunes, Zome Porto (Matosinhos)
*Mère de deux enfants. Ses comptes rendus vendeurs débordent sur ses soirées.*
- **Ce qui la ferait payer :**
  - le compte rendu vendeur en moins de 24 h, sans y passer la soirée ;
  - la carte « Valor entregue esta semana » à envoyer au vendeur ;
  - c'est la cible exacte de Christophe.
- **Ce qui le bloque :**
  - elle a peur d'une erreur de chiffre envoyée au client ;
  - elle est rassurée par le principe « rien ne part sans validation ».
- **Décision :** oui (Solo). **Prix max :** 9,90 €/mois. **Note : 71/100.**

### 16. Nuno Martins, propriétaire d'une franchise RE/MAX, Sintra
*35 consultants.*
- **Ce qui le ferait payer :** le temps gagné agrégé par consultant, s'il était prouvé.
- **Ce qui le bloque :**
  - MAXWORK est imposé et la politique de données du réseau interdit d'exporter les contacts ;
  - 35 × 6 € par siège, pour un outil non validé par le master franchise : « Não passa na RE/MAX Portugal. »
- **Décision :** non (en tant que franchise). **Prix max :** 0 €. **Note : 46/100.**

### 17. Joana Silva, iad Portugal, Tavira (Algarve)
*Clientèle étrangère, surtout des vendeurs non-résidents.*
- **Ce qui la ferait payer :** la liste des pièces et les questions spécifiques au Portugal (IMI, condomínio, licença) pour les vendeurs non-résidents.
- **Ce qui le bloque :**
  - pas de version anglaise des documents vendeur ;
  - rien sur le NIF de non-résident ou le représentant fiscal.
- **Décision :** à l'essai. **Prix max :** 10 €/mois. **Note : 57/100.**

### 18. Pedro Antunes, indépendant en société unipessoal AMI, Cascais
*Haut de gamme, eGO Base, 15 ventes par an.*
- **Ce qui le ferait payer :**
  - tout le parcours d'après rendez-vous : compte rendu, relance, facture InvoiceXpress avec ATCUD, IMPIC ;
  - « Sou eu a agência inteira. »
- **Ce qui le bloque :**
  - les 8 dossiers du Solo lui suffisent, mais pas l'absence de la page Marché PT ;
  - il veut la confirmation des codes IVA avant d'émettre.
- **Décision :** oui. **Prix max :** 25 €/mois. **Note : 72/100.**

### 19. Beatriz Correia, KW Porto
*6 mois de métier. Apprend à mener une évaluation.*
- **Ce qui la ferait payer :** le brief de préparation et les questions à poser au vendeur : un coach dans la poche.
- **Ce qui le bloque :**
  - un budget serré ;
  - elle attend la fin de la bêta gratuite.
- **Décision :** oui (Solo, annuel). **Prix max :** 9,90 €/mois. **Note : 63/100.**

### 20. Luís Oliveira, agence indépendante de 3 consultants, Lisbonne (Arroios)
*Spécialiste de l'arrendamento.*
- **Ce qui le ferait payer :** rien pour l'instant.
- **Ce qui le bloque :**
  - Jaspe est entièrement pensé pour la vente ;
  - eGO gère déjà ses contrats de location ;
  - « Não é para mim. »
- **Décision :** non. **Prix max :** 0 €. **Note : 38/100.**

### 21. Vera Santos, Century 21 Cascais
*20 ans de métier, tout au téléphone.*
- **Ce qui la ferait payer :** rien.
- **Ce qui le bloque :**
  - « O meu cliente não quer um relatório, quer uma chamada. » ;
  - elle se méfie de l'IA sur les données des clients.
- **Décision :** non. **Prix max :** 0 €. **Note : 33/100.**

### 22. Rui Cardoso, propriétaire d'une franchise ERA, Maia
*12 consultants, comptable interne.*
- **Ce qui le ferait payer :**
  - la facture de commission automatique, consultant vers agence puis agence vers client ;
  - le partage avec l'agence partenaire (50/50, 60/40).
- **Ce qui le bloque :**
  - aucune grille de partage inter-agences ;
  - aucune retenção na fonte ;
  - « Sem isso, a minha contabilista refaz tudo. »
- **Décision :** à l'essai. **Prix max :** 49 €/mois. **Note : 64/100.**

### 23. Filipa Moreira, Zome Loulé (Algarve)
*Résidences secondaires, acheteurs nordiques.*
- **Ce qui la ferait payer :**
  - les relances programmées entre deux échanges ;
  - le signal quand un comparable baisse de prix.
- **Ce qui le bloque :**
  - la veille marché PT est vide ;
  - pas d'anglais ;
  - ce n'est pas assez différent d'un rappel dans le calendrier.
- **Décision :** à l'essai. **Prix max :** 10 €/mois. **Note : 56/100.**

### 24. André Pinto, RE/MAX Lisboa (Lumiar)
*Pilote son activité au tableur.*
- **Ce qui le ferait payer :**
  - l'export CSV du temps gagné ;
  - le gain net, corrections déduites ;
  - « Isto é o que o eGO nunca me mostrou. »
- **Ce qui le bloque :**
  - il veut d'abord calibrer avec son propre chronomètre ;
  - il trouve les valeurs par défaut optimistes.
- **Décision :** oui (Solo). **Prix max :** 15 €/mois. **Note : 67/100.**

### 25. Teresa Machado, agence familiale de 4 personnes, Vila Nova de Gaia
*eGO Start. Peur des erreurs légales.*
- **Ce qui la ferait payer :** la veille légale PT par pays, en particulier la nouvelle lei da mediação et le registo de consultores.
- **Ce qui le bloque :**
  - les sources affichées n'ont pas de date de mise à jour visible ;
  - aucune garantie qu'un juriste suive le sujet ;
  - « Prefiro pagar mais e ter alguém responsável. »
- **Décision :** à l'essai. **Prix max :** 49 €/mois. **Note : 60/100.**

---

## Synthèse

| Indicateur | Résultat |
|---|---|
| Achèteraient (oui) | 9 sur 25, soit **36 %** |
| À l'essai | 10 sur 25, soit 40 % |
| Non | 6 sur 25, soit 24 % |
| Prix max médian, tout le panel | **10 €/mois** |
| Prix max médian hors « non » (19 personnes) | 15 €/mois |
| Prix max médian des consultants seuls (offre Solo) | 10 €/mois |
| Prix max médian des agences | 49 €/mois |
| Note moyenne | **57,6/100** |

**Lecture.**
- Le prix n'est pas le frein : 9,90 € passe chez tous ceux qui voient la valeur.
- Le frein, c'est la preuve :
  - preuve que c'est mieux que ChatGPT ;
  - preuve que le légal portugais est fiable ;
  - preuve que le temps gagné est réel.
- Le Portugal confirme Christophe : les gérants d'agence indépendante (Ana, Miguel, Inês, Pedro) paient pour **le légal et la facturation**. Les consultants de réseau paient, au mieux, pour le **débrief WhatsApp**.

### Top 5 des objections

1. **« Já tenho o eGO / MAXWORK / Command, tem tudo. »** (16 personnes sur 25)
   - L'import CSV est ponctuel et sans synchronisation : Jaspe devient une deuxième base à tenir à jour.
   - Les réseaux interdisent souvent l'export des contacts.
2. **« O ChatGPT faz isso de graça. »** (12 personnes sur 25)
   - La différence (mémoire du dossier, relance au bon moment, pièces PT, facture, IMPIC) ne se voit qu'après un dossier complet.
   - Le premier écran est vide.
3. **« Quanto tempo poupo, de verdade ? »** (11 personnes sur 25)
   - Les références par défaut ne sont pas calibrées sur le Portugal.
   - C'est le retour n°1 de Christophe : les testeurs n'arrivent pas à mesurer le gain.
4. **« A confirmar pelo seu jurista » : la promesse légale se retourne** (9 personnes sur 25, dont tous les gérants)
   - Pièces, échéance IMPIC et codes IVA ne sont pas relus.
   - La veille n'a pas de date visible.
   - L'hébergement n'est pas choisi.
5. **« Não é plug and play »** (9 personnes sur 25)
   - Le débrief WhatsApp demande Meta Business et un service de transcription.
   - Les pages Tarifs, mode complet et livrables L4 à L9 sont en français.
   - Pas d'anglais pour la clientèle étrangère (Algarve, Cascais).

### Top 5 à corriger ou ajouter, par impact sur la vente

1. **Débrief WhatsApp prêt à l'emploi.**
   - Un numéro Jaspe partagé, déjà configuré.
   - Le consultant enregistre son numéro, envoie un vocal, et reçoit en moins de 2 minutes un compte rendu et une relance à valider.
   - *Rattaché à :* moment PDF « À la sortie : dicter le débrief » ; Christophe : « plug and play à 10 €, zéro service client ».
2. **Légal PT relu par un avocat portugais, et visible comme tel.**
   - Remettre `docs/juridique/RELECTURE.md` à un avocat.
   - Afficher « revisto por advogado, data » sur chaque point relu.
   - Dater la veille : nova lei da mediação, registo de consultores, croisement IMPIC et AT.
   - Fiabiliser l'anexo B et la grille BCFT.
   - *Rattaché à :* moment PDF « Du compromis à l'acte » ; Christophe : « le légal est à créer entièrement, grosse préoccupation ».
3. **Temps gagné prouvé dès la première semaine.**
   - Chronomètre automatique, de la dictée à la validation.
   - Références calibrées par 5 bêta-testeurs portugais.
   - Rapport hebdomadaire « X h poupadas, correções incluídas » à partager.
   - *Rattaché à :* Christophe : « n'arrivent pas à le mesurer » et « une fois le gain mesuré sur de vrais dossiers, corrections comprises ».
4. **Se brancher sur eGO au lieu de le doubler.**
   - Tester l'import sur un vrai export eGO, y compris en xlsx.
   - Réimport incrémental programmé.
   - Copie du compte rendu et des tâches vers eGO (note ou e-mail entrant).
   - À terme, connecteur API ou MarketPlace KW.
   - *Rattaché à :* moment PDF « Première rencontre : préparer le RDV » (brief avec les faits connus) ; Christophe : « un assistant qui se connecte à ta base ».
5. **Tout en pt-PT, et en anglais pour les clients.**
   - Traduire la landing, les Tarifs avec le prix TTC et l'IVA, les livrables L4 à L9, D3 et D4.
   - Proposer les relances et les documents vendeur en EN.
   - Ajouter la grille de partage des commissions et la retenção na fonte dans les factures.
   - *Rattaché à :* moments PDF « Après l'échange : éditer les documents » et « Entre deux échanges : relancer ».

*Hors top 5, cité plusieurs fois : comparables PT (Casafari ou INE) pour le moment « Tout au long : suivre le marché », et un parcours location.*

### 3 phrases d'argumentaire qui marchent (pt-PT)

1. « O eGO gere a agência ; o Jaspe devolve-lhe a noite : dita o resumo no carro e o relatório ao vendedor, a mensagem de seguimento e a lista de documentos ficam prontos para validar. »
2. « Ao contrário do ChatGPT, o Jaspe lembra-se de cada processo : sabe que prometeu ligar ao vendedor na sexta, depois do certificado energético, e prepara a mensagem nesse dia. »
3. « Por 9,90 € por mês, sabe ao minuto quanto tempo poupou, correções incluídas — e, se não poupar 2 horas no primeiro mês, devolvemos o dinheiro. »
