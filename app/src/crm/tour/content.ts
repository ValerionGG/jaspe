// Contenu éditorial du centre d’aide : leçons, glossaire, FAQ, raccourcis, journal des versions.
export type Role = 'Conseiller' | 'Manager' | 'Coordinatrice' | 'Marketing'
export type Level = 'Essentiel' | 'Intermédiaire' | 'Avancé'
export type ShotKind = 'palette' | 'kanban' | 'stepper' | 'paper' | 'chat' | 'calendar' | 'routine' | 'kpi'
export type Lesson = { id: string; title: string; summary: string; img: string; minutes: number; level: Level; role: Role; link: string; tour?: string; tip: string; steps: { t: string; d: string; shot: ShotKind }[] }

export const LESSONS: Lesson[] = [
  { id: 'premiers-pas', title: 'Prendre en main son cockpit', summary: 'Brief du matin, palette ⌘K, copilote et file de décision.', img: 'villa-pool', minutes: 4, level: 'Essentiel', role: 'Conseiller', link: '/app', tour: 'onboarding',
    tip: 'Commencez chaque journée par le brief : il est régénéré à 07:30 à partir de l’agenda et des dossiers vivants.',
    steps: [
      { t: 'Lire le brief du copilote', d: 'En haut de « Aujourd’hui », le brief résume les décisions en attente et ce qui compte avant 14 h. Chaque affirmation renvoie à sa source.', shot: 'kpi' },
      { t: 'Chercher ou agir avec ⌘K', d: 'La palette ouvre un bien, un contact ou un dossier, et lance une action (« nouveau dossier », « générer L7 »). Flèches pour choisir, Entrée pour valider.', shot: 'palette' },
      { t: 'Traiter la file de décision', d: 'Les livrables à relire et les offres à traiter sont regroupés dans « Tâches & validations », triés par échéance.', shot: 'routine' },
    ] },
  { id: 'dossier-vendeur', title: 'Ouvrir un dossier vendeur de A à Z', summary: 'Création, préparation D1–D4 et passage aux livrables.', img: 'villa-sunset', minutes: 6, level: 'Essentiel', role: 'Conseiller', link: '/app/dossiers', tour: 'dossier',
    tip: 'Glissez la carte du dossier vers « Après RDV » dès la découverte terminée : les neuf livrables partent en parallèle.',
    steps: [
      { t: 'Créer le dossier', d: '« Nouveau dossier » : vendeur, bien, conseiller et motivation. Le dossier apparaît en colonne « Préparation ».', shot: 'kanban' },
      { t: 'Préparer le rendez-vous', d: 'D1 brief relationnel, D2 comparables DVF, D3 radar quartier et D4 simulation : visez 100 % de préparation.', shot: 'stepper' },
      { t: 'Faire avancer le pipeline', d: 'Le glisser-déposer change l’étape et l’enregistre. Le passage en « Après RDV » déclenche AUT-024.', shot: 'kanban' },
      { t: 'Suivre l’avancement', d: 'Le stepper du dossier calcule l’avancement des huit étapes à partir des données réelles.', shot: 'stepper' },
    ] },
  { id: 'decouverte-d5', title: 'Mener la découverte D5 et le débrief vocal', summary: 'Cinq blocs pour ne rien oublier, deux minutes de débrief.', img: 'int-living', minutes: 5, level: 'Intermédiaire', role: 'Conseiller', link: '/app/dossiers/d1',
    tip: 'Dictez le débrief dans la voiture : le copilote structure projet, calendrier, prix et objections.',
    steps: [
      { t: 'Suivre les cinq blocs', d: 'Projet, bien, calendrier, prix, décision : chaque bloc se coche pendant l’échange.', shot: 'stepper' },
      { t: 'Enregistrer le débrief', d: 'Le débrief vocal est transcrit puis résumé ; vous le validez avant qu’il n’alimente les livrables.', shot: 'chat' },
      { t: 'Valider D5', d: 'Une fois D5 validée, L1 à L9 peuvent être générés.', shot: 'paper' },
    ] },
  { id: 'valider-livrables', title: 'Relire et valider un livrable', summary: 'Aperçu papier, sources datées, versions et motif de rejet.', img: 'int-dining', minutes: 4, level: 'Essentiel', role: 'Conseiller', link: '/app/studio', tour: 'livrables',
    tip: 'Un rejet avec motif précis améliore la génération suivante : « ton trop commercial » vaut mieux que « à refaire ».',
    steps: [
      { t: 'Ouvrir l’aperçu', d: 'Le document s’affiche tel qu’il sera reçu. Les chiffres portent leur source et leur date.', shot: 'paper' },
      { t: 'Modifier si besoin', d: 'Chaque modification crée une nouvelle version ; les précédentes restent consultables.', shot: 'paper' },
      { t: 'Valider ou rejeter', d: 'Valider programme l’envoi (consigné tant qu’aucun connecteur n’est configuré). Rejeter demande un motif.', shot: 'routine' },
    ] },
  { id: 'whatsapp', title: 'Rappels WhatsApp conformes', summary: 'Opt-in, fenêtre de 24 h et modèles approuvés.', img: 'int-lounge', minutes: 5, level: 'Essentiel', role: 'Coordinatrice', link: '/app/messages', tour: 'messagerie',
    tip: 'Hors fenêtre de 24 h, choisissez un modèle approuvé : il rouvre la conversation sans risque de refus.',
    steps: [
      { t: 'Vérifier le consentement', d: 'Le bandeau de conversation indique l’opt-in. Sans lui, l’envoi WhatsApp est bloqué.', shot: 'chat' },
      { t: 'Choisir un modèle', d: 'Les variables {{prenom}}, {{date}}, {{heure}}, {{lieu}} sont remplies depuis l’agenda.', shot: 'chat' },
      { t: 'Programmer J-1 et H-2', d: 'Depuis le rendez-vous, un clic programme les deux rappels ; AUT-110 les traite à l’échéance.', shot: 'calendar' },
    ] },
  { id: 'agenda', title: 'Organiser l’agenda et les visites', summary: 'Rendez-vous, préparation et rappels automatiques.', img: 'house-garden', minutes: 4, level: 'Intermédiaire', role: 'Coordinatrice', link: '/app/agenda',
    tip: 'La jauge de préparation d’un rendez-vous passe au vert quand D1 à D4 sont prêts.',
    steps: [
      { t: 'Planifier', d: 'Créez rendez-vous, visites et signatures ; reliez-les au dossier.', shot: 'calendar' },
      { t: 'Préparer', d: 'Chaque rendez-vous vendeur affiche sa préparation D1–D4.', shot: 'stepper' },
      { t: 'Rappeler', d: 'Programmez les rappels clients depuis la fiche de l’événement.', shot: 'chat' },
    ] },
  { id: 'kit-social', title: 'Publier un kit social L4 conforme', summary: 'Posts par réseau, étiquetage AI Act, original conservé.', img: 'villa-palm', minutes: 5, level: 'Intermédiaire', role: 'Marketing', link: '/app/studio',
    tip: 'Vérifiez la mention « image retouchée par IA » sur chaque visuel avant validation.',
    steps: [
      { t: 'Relire chaque post', d: 'L4 propose un texte par réseau ; adaptez le ton à votre agence.', shot: 'paper' },
      { t: 'Contrôler les visuels', d: 'Les images retouchées portent l’étiquette AI Act ; l’original reste dans la photothèque.', shot: 'paper' },
      { t: 'Valider', d: 'La publication est programmée ; sans connecteur réseau, elle est consignée.', shot: 'routine' },
    ] },
  { id: 'prospection', title: 'Prospecter sans démarchage illicite', summary: 'Registre des consentements et campagnes ciblées.', img: 'medit-street', minutes: 6, level: 'Avancé', role: 'Marketing', link: '/app/prospection',
    tip: 'Le courrier voisinage L5 reste un canal sûr : il ne nécessite pas de consentement préalable.',
    steps: [
      { t: 'Lire le registre', d: 'Chaque contact affiche ses consentements par canal et par finalité, avec preuve et date.', shot: 'routine' },
      { t: 'Cibler une zone', d: 'Les campagnes se construisent sur la carte, à partir des biens vendus récemment.', shot: 'kpi' },
      { t: 'Choisir le bon canal', d: 'Sans consentement, pas d’appel : privilégiez le courrier L5 ou l’e-mail avec opt-in.', shot: 'paper' },
    ] },
  { id: 'routines', title: 'Composer ses automatisations', summary: 'Déclencheurs, autonomie A/V/P, journal d’exécution.', img: 'villa-night', minutes: 7, level: 'Avancé', role: 'Manager', link: '/app/automatisations', tour: 'automatisations',
    tip: 'Démarrez une nouvelle routine en autonomie V : vous validerez ses premières exécutions avant de la passer en A.',
    steps: [
      { t: 'Parcourir le catalogue', d: 'Chaque routine décrit déclencheur, conditions, action, critère de succès et repli.', shot: 'routine' },
      { t: 'Régler l’autonomie', d: 'A automatique, V après validation, P proposition seule.', shot: 'routine' },
      { t: 'Lire le journal', d: 'Statut, durée et coût de chaque exécution ; une erreur ouvre une notification.', shot: 'kpi' },
    ] },
  { id: 'pilotage', title: 'Piloter l’agence et le réseau', summary: 'Indicateurs vivants, écarts et coaching.', img: 'nice-riviera', minutes: 6, level: 'Intermédiaire', role: 'Manager', link: '/app/pilotage', tour: 'pilotage',
    tip: 'Comparez le délai de vente par conseiller : c’est le meilleur signal pour cibler le coaching.',
    steps: [
      { t: 'Lire les indicateurs', d: 'CA, mandats, délais et transformation, par agence et par conseiller.', shot: 'kpi' },
      { t: 'Repérer les écarts', d: 'Un écart renvoie au dossier ou au conseiller concerné.', shot: 'kanban' },
      { t: 'Planifier le coaching', d: 'Les axes de progrès sont proposés à partir des débriefs.', shot: 'stepper' },
    ] },
  { id: 'transactions', title: 'Suivre une offre jusqu’à l’acte', summary: 'Offres, compromis, conditions suspensives, notaire.', img: 'house-dusk', minutes: 5, level: 'Intermédiaire', role: 'Coordinatrice', link: '/app/transactions',
    tip: 'Le délai de rétractation SRU de 10 jours court à partir de la notification du compromis à l’acquéreur.',
    steps: [
      { t: 'Enregistrer l’offre', d: 'Montant, conditions, expiration : l’offre remonte dans la file de décision.', shot: 'routine' },
      { t: 'Suivre les conditions', d: 'Prêt, DIA, diagnostics : chaque condition a son échéance et son état.', shot: 'stepper' },
      { t: 'Préparer l’acte', d: 'La checklist notaire liste les pièces manquantes.', shot: 'calendar' },
    ] },
  { id: 'estimation', title: 'Construire une estimation L7 sourcée', summary: 'Comparables DVF, fourchette et argumentaire.', img: 'villa-modern', minutes: 6, level: 'Avancé', role: 'Conseiller', link: '/app/marche',
    tip: 'Écartez les comparables de plus de 24 mois ou hors micro-marché : la fourchette se resserre.',
    steps: [
      { t: 'Sélectionner les comparables', d: 'Ventes DVF proches en surface, typologie et date ; chacune est datée.', shot: 'kpi' },
      { t: 'Ajuster la fourchette', d: 'Vue, état, DPE et terrain pondèrent le prix au m².', shot: 'kpi' },
      { t: 'Valider L7', d: 'L’estimation part au vendeur après votre relecture.', shot: 'paper' },
    ] },
]

export type Term = { term: string; cat: 'Parcours' | 'Livrables' | 'Réglementation' | 'Marché' | 'Messagerie' | 'Produit'; def: string }
export const GLOSSARY: Term[] = [
  { term: 'D1 · Brief relationnel', cat: 'Parcours', def: 'Profil du vendeur, historique des échanges et points d’attention, préparé avant le premier rendez-vous.' },
  { term: 'D2 · Marché & comparables', cat: 'Parcours', def: 'Ventes comparables récentes (DVF) et annonces concurrentes, chacune sourcée et datée.' },
  { term: 'D3 · Radar quartier', cat: 'Parcours', def: 'Écoles, commerces, transports, projets urbains et nuisances autour du bien.' },
  { term: 'D4 · Simulation coaching', cat: 'Parcours', def: 'Répétition du rendez-vous : objections probables et réponses suggérées.' },
  { term: 'D5 · Découverte vendeur', cat: 'Parcours', def: 'Entretien structuré en cinq blocs (projet, bien, calendrier, prix, décision) et débrief vocal.' },
  { term: 'L1 · Mail de remerciement', cat: 'Livrables', def: 'Message personnalisé envoyé au vendeur après le rendez-vous, après validation.' },
  { term: 'L2 · Synthèse équipe', cat: 'Livrables', def: 'Note interne partagée avec l’agence : enjeux, prix, prochaines étapes.' },
  { term: 'L3 · Avant-première acquéreurs', cat: 'Livrables', def: 'Présentation du bien aux acquéreurs compatibles avant la diffusion publique.' },
  { term: 'L4 · Kit réseaux sociaux', cat: 'Livrables', def: 'Posts adaptés à chaque réseau, visuels étiquetés lorsqu’ils sont retouchés par IA.' },
  { term: 'L5 · Courrier voisinage', cat: 'Livrables', def: 'Lettre aux riverains annonçant la mise en vente ; canal de prospection sans consentement préalable.' },
  { term: 'L6 · Book de services', cat: 'Livrables', def: 'Document de présentation de l’agence et du plan de commercialisation.' },
  { term: 'L7 · Analyse & estimation', cat: 'Livrables', def: 'Fourchette de prix argumentée à partir des comparables et des caractéristiques du bien.' },
  { term: 'L8 · Avant / après', cat: 'Livrables', def: 'Projection de rénovation ou home staging virtuel ; l’original est conservé et l’image étiquetée.' },
  { term: 'L9 · Copro & diagnostics', cat: 'Livrables', def: 'Liste des pièces de copropriété et diagnostics obligatoires, avec les manquants signalés.' },
  { term: 'DVF', cat: 'Marché', def: 'Demandes de valeurs foncières : base publique des ventes immobilières publiée par la DGFiP, mise à jour semestriellement.' },
  { term: 'ALUR', cat: 'Réglementation', def: 'Loi du 24 mars 2014 : mentions obligatoires des annonces (honoraires, surface, copropriété) et documents à fournir avant la promesse.' },
  { term: 'SRU', cat: 'Réglementation', def: 'Loi du 13 décembre 2000 : instaure notamment le délai de rétractation de l’acquéreur non professionnel, aujourd’hui de 10 jours.' },
  { term: 'DIA', cat: 'Réglementation', def: 'Déclaration d’intention d’aliéner : adressée à la mairie titulaire du droit de préemption, qui dispose de deux mois pour répondre.' },
  { term: 'DPE', cat: 'Réglementation', def: 'Diagnostic de performance énergétique, classes A à G, opposable depuis le 1er juillet 2021 et obligatoire dans l’annonce.' },
  { term: 'Loi Hoguet', cat: 'Réglementation', def: 'Loi du 2 janvier 1970 encadrant l’activité d’agent immobilier : carte professionnelle et mandat écrit obligatoires.' },
  { term: 'Loi Carrez', cat: 'Réglementation', def: 'Surface privative d’un lot de copropriété ; une erreur de plus de 5 % ouvre droit à une diminution de prix.' },
  { term: 'AI Act', cat: 'Réglementation', def: 'Règlement européen 2024/1689 sur l’IA. Les obligations de transparence s’appliquent dès août 2026 : tout contenu généré ou retouché doit être signalé.' },
  { term: 'Démarchage téléphonique', cat: 'Réglementation', def: 'Interdit en France sans consentement préalable depuis le 11/08/2026 : le registre des consentements fait foi.' },
  { term: 'RGPD', cat: 'Réglementation', def: 'Règlement général sur la protection des données : base légale, minimisation, droit d’accès et d’effacement.' },
  { term: 'Opt-in WhatsApp', cat: 'Messagerie', def: 'Consentement explicite et horodaté du client à recevoir des messages WhatsApp de l’agence.' },
  { term: 'Fenêtre de 24 h', cat: 'Messagerie', def: 'Période après le dernier message du client pendant laquelle un message libre est permis ; au-delà, un modèle approuvé est obligatoire.' },
  { term: 'Modèle approuvé', cat: 'Messagerie', def: 'Message type validé, avec variables ({{prenom}}, {{date}}…), utilisable hors fenêtre de 24 h.' },
  { term: 'Mandat exclusif', cat: 'Marché', def: 'Le vendeur confie la vente à une seule agence pour une durée définie.' },
  { term: 'Condition suspensive', cat: 'Marché', def: 'Événement dont dépend la vente (obtention du prêt, purge de la DIA) ; généralement 45 à 60 jours pour le prêt.' },
  { term: 'Off-market', cat: 'Marché', def: 'Bien proposé discrètement à une sélection d’acquéreurs, sans diffusion publique.' },
  { term: 'Autonomie A / V / P', cat: 'Produit', def: 'Niveau d’une routine : automatique, après validation humaine, ou simple proposition.' },
  { term: 'Consigné', cat: 'Produit', def: 'Action enregistrée et tracée, mais pas transmise faute de connecteur configuré. Jamais affichée comme « envoyée ».' },
]

export const FAQ: { q: string; a: string; tour?: string; link?: string }[] = [
  { q: 'Le copilote peut-il envoyer un document sans moi ?', a: 'Non. Tout envoi externe passe par votre validation dans « Tâches & validations ». Seuls les documents internes comme L2 peuvent être partagés sans relecture individuelle.', tour: 'livrables' },
  { q: 'Pourquoi mon message WhatsApp est-il refusé ?', a: 'Deux causes possibles : le client n’a pas donné son opt-in, ou la fenêtre de 24 h est fermée. Dans le second cas, choisissez un modèle approuvé.', tour: 'messagerie' },
  { q: 'Que signifie « consigné — connecteur non configuré » ?', a: 'L’action est enregistrée et horodatée, mais aucun service externe (e-mail, SMS, portail) n’est encore branché. Elle part dès que le connecteur est activé dans Réglages.', link: '/app/reglages' },
  { q: 'D’où viennent les chiffres des livrables ?', a: 'Des ventes DVF, des annonces et de vos dossiers. Chaque chiffre porte sa source et sa date ; le contrôle qualité bloque un document dont un chiffre n’est pas sourcé.' },
  { q: 'Puis-je modifier un livrable généré ?', a: 'Oui. Chaque modification crée une version ; l’historique reste consultable depuis le dossier.', link: '/app/studio' },
  { q: 'Comment sont traitées les images retouchées par IA ?', a: 'L’original est conservé et chaque image modifiée porte une mention visible, conformément à l’AI Act applicable depuis août 2026.' },
  { q: 'Que se passe-t-il hors connexion ?', a: 'Vos modifications sont enregistrées sur l’appareil puis synchronisées au retour du réseau. L’indicateur en haut à droite affiche l’état.' },
  { q: 'Comment relancer la visite guidée ?', a: 'Depuis cette page, bouton « Lancer la visite », ou depuis n’importe quel tutoriel associé.', tour: 'onboarding' },
  { q: 'À quoi sert le mode simple ?', a: 'Il réduit la navigation aux écrans du quotidien (Aujourd’hui, messagerie, agenda, dossiers, biens, studio). Le choix est mémorisé sur l’appareil.' },
  { q: 'Puis-je appeler un prospect sans son accord ?', a: 'Non : depuis le 11/08/2026, le démarchage téléphonique sans consentement préalable est interdit. Consultez le registre avant tout appel.', link: '/app/prospection' },
]

export const SHORTCUTS: { keys: string[]; label: string; where: string; demo?: 'palette' | 'help' | 'tour' }[] = [
  { keys: ['⌘', 'K'], label: 'Ouvrir la palette de recherche et d’actions (Ctrl K sous Windows)', where: 'Partout', demo: 'palette' },
  { keys: ['↑', '↓', 'Entrée'], label: 'Choisir et lancer un résultat de la palette', where: 'Palette' },
  { keys: ['Échap'], label: 'Fermer la palette, une fenêtre ou la visite guidée', where: 'Partout' },
  { keys: ['?'], label: 'Ouvrir l’aide et les tutoriels', where: 'Hors champ de saisie', demo: 'help' },
  { keys: ['←', '→'], label: 'Étape précédente ou suivante', where: 'Visite guidée', demo: 'tour' },
  { keys: ['Entrée'], label: 'Étape suivante, ou terminer la visite', where: 'Visite guidée' },
]

export const CHANGELOG: { v: string; date: string; title: string; items: string[]; tour?: string; link?: string }[] = [
  { v: '0.31', date: '12 oct. 2026', title: 'Messagerie unifiée, stepper vendeur et centre d’aide', items: ['WhatsApp, e-mail, SMS, portails et canaux d’équipe dans une seule boîte', 'Rappels J-1 et H-2 programmés depuis l’agenda (AUT-110)', 'Stepper vendeur en huit étapes avec avancement calculé', 'Visites guidées, tutoriels et glossaire métier'], tour: 'messagerie' },
  { v: '0.30', date: '5 oct. 2026', title: 'Double thème et mode simple', items: ['Thème clair « Calcaire & Azur » et thème sombre « Nocturne »', 'Mode simple : navigation réduite pour le terrain', 'Palette ⌘K enrichie d’actions'], tour: 'onboarding' },
  { v: '0.29', date: '28 sept. 2026', title: 'Données vivantes et temps réel', items: ['Toutes les pages lisent la base commune, mises à jour en direct entre onglets', 'Repli hors ligne avec synchronisation au retour du réseau', 'Validation, rejet et versions des livrables'], tour: 'livrables' },
  { v: '0.28', date: '21 sept. 2026', title: 'Conformité prospection', items: ['Registre des consentements par canal et finalité', 'Blocage des appels sans consentement (règle du 11/08/2026)', 'Étiquetage AI Act des visuels retouchés'], link: '/app/prospection' },
]
