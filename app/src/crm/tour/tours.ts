// Parcours de visite guidée. Une étape cible un attribut `data-tour` ; sans cible (ou cible invisible), la bulle est centrée.
export type TourStep = { target?: string; route?: string; title: string; body: string; hint?: string }
export type Tour = { id: string; title: string; minutes: number; role: string; desc: string; img: string; steps: TourStep[] }

export const TOURS: Tour[] = [
  {
    id: 'onboarding', title: 'Prise en main', minutes: 3, role: 'Conseiller', img: 'villa-pool',
    desc: 'Le cockpit en dix arrêts : brief du matin, recherche, copilote, file de validation.',
    steps: [
      { route: '/app', title: 'Bienvenue dans Jaspe', body: 'En trois minutes, faisons le tour de votre cockpit : où regarder le matin, où décider, et où le copilote travaille pour vous.', hint: 'Flèches ← → pour naviguer, Échap pour quitter.' },
      { target: 'nav-today', route: '/app', title: 'Aujourd’hui, votre brief', body: 'Chaque matin à 07:30, le copilote résume l’agenda, les décisions en attente et vos priorités triées par impact.' },
      { target: 'search', title: 'Tout trouver, tout lancer', body: 'La palette ouvre biens, contacts et dossiers, mais aussi des actions comme « générer L7 » ou « nouveau dossier ».', hint: '⌘K ou Ctrl K, depuis n’importe quelle page.' },
      { target: 'copilot', title: 'Un copilote qui cite ses sources', body: 'Posez vos questions en langage naturel. Chaque chiffre cité est sourcé et daté ; rien ne part chez un client sans votre validation.' },
      { target: 'nav-messages', title: 'Une seule boîte de réception', body: 'WhatsApp, e-mail, SMS, portails et canaux d’équipe réunis. Le consentement et la fenêtre de 24 h sont contrôlés avant chaque envoi.' },
      { target: 'nav-agenda', title: 'Agenda et rappels', body: 'Rendez-vous, visites, signatures. Les rappels J-1 et H-2 se programment en un clic depuis l’événement.' },
      { target: 'nav-taches', title: 'La file de décision', body: 'Chaque livrable destiné à un client arrive ici avant tout envoi : valider, modifier ou rejeter avec un motif.' },
      { target: 'nav-dossiers', title: 'Vos dossiers vendeurs', body: 'Un pipeline en huit étapes, de la préparation à l’acte. Glissez une carte pour faire avancer un dossier.' },
      { target: 'nav-studio', title: 'Le Studio livrables', body: 'D1 à D5 avant et pendant le rendez-vous, L1 à L9 après : tous les documents produits, leur statut et leur version.' },
      { target: 'simple-mode', title: 'Mode simple', body: 'Réduit la navigation à l’essentiel du conseiller. Votre choix est mémorisé sur cet appareil.' },
      { target: 'nav-aide', title: 'L’aide reste à portée', body: 'Tutoriels, glossaire, FAQ et support. Vous pouvez relancer cette visite à tout moment.', hint: 'Touche « ? » pour ouvrir l’aide.' },
    ],
  },
  {
    id: 'dossier', title: 'Mon premier dossier vendeur', minutes: 4, role: 'Conseiller', img: 'villa-sunset',
    desc: 'Du rendez-vous de découverte aux neuf livrables : le parcours vendeur pas à pas.',
    steps: [
      { target: 'nav-dossiers', route: '/app/dossiers', title: 'Le pipeline vendeur', body: 'Huit colonnes : préparation, rendez-vous, après-rendez-vous, mandat, commercialisation, offre, compromis, acte. Le glisser-déposer est enregistré.' },
      { route: '/app/dossiers', title: 'Créer un dossier', body: 'Le bouton « Nouveau dossier » demande le vendeur, le bien et le conseiller. Le copilote prépare aussitôt le brief D1, le marché D2 et le radar quartier D3.' },
      { route: '/app/dossiers', title: 'Avant le rendez-vous', body: 'D1 à D4 arrivent prêts : profil relationnel, comparables DVF datés, environnement du quartier et simulation de coaching. Visez 100 % de préparation.' },
      { route: '/app/dossiers', title: 'Pendant : la découverte D5', body: 'Cinq blocs guident l’échange (projet, bien, calendrier, prix, décision). Un débrief vocal de deux minutes suffit : le copilote le structure.' },
      { route: '/app/dossiers', title: 'Après : neuf livrables en parallèle', body: 'Passer le dossier en « après-rendez-vous » déclenche la routine AUT-024 : L1 à L9 sont rédigés, contrôlés, puis placés dans votre file de validation.' },
      { target: 'nav-biens', title: 'Le bien rattaché', body: 'Fiche, DPE, photos : les originaux sont conservés et toute image retouchée par IA est étiquetée.' },
      { target: 'nav-acquereurs', title: 'Rapprocher les acquéreurs', body: 'Les acquéreurs compatibles sont scorés ; ils reçoivent l’avant-première L3 une fois que vous l’avez validée.' },
    ],
  },
  {
    id: 'livrables', title: 'Livrables & validation', minutes: 3, role: 'Conseiller', img: 'int-dining',
    desc: 'Relire, corriger, valider : aucun document ne part sans votre accord.',
    steps: [
      { target: 'nav-studio', route: '/app/studio', title: 'Le Studio', body: 'Tous les livrables de vos dossiers, filtrables par statut : en cours, à valider, prêts, bloqués.' },
      { route: '/app/studio', title: 'Lire avant de valider', body: 'L’aperçu papier montre le document final. Chaque chiffre porte sa source et sa date ; le contrôle qualité vérifie noms, montants et cohérence.' },
      { route: '/app/studio', title: 'Images IA étiquetées', body: 'Depuis août 2026, l’AI Act impose d’indiquer les contenus générés ou retouchés. L’original est conservé et la mention est ajoutée automatiquement.' },
      { target: 'nav-taches', route: '/app/taches', title: 'La file de validation', body: 'Valider, modifier ou rejeter avec motif. Les versions précédentes restent consultables.' },
      { route: '/app/taches', title: 'Après validation', body: 'L1, L3, L4, L5, L6 et L7 passent en envoi programmé. Sans connecteur configuré, l’envoi est consigné — jamais faussement marqué « envoyé ».' },
    ],
  },
  {
    id: 'messagerie', title: 'Messagerie & rappels WhatsApp', minutes: 3, role: 'Coordinatrice', img: 'int-lounge',
    desc: 'Consentement, fenêtre de 24 h, modèles approuvés et rappels automatiques.',
    steps: [
      { target: 'nav-messages', route: '/app/messages', title: 'La boîte unifiée', body: 'Filtrez par canal, par dossier ou par tag. Les messages entrants sont classés automatiquement (routine AUT-112).' },
      { route: '/app/messages', title: 'L’opt-in WhatsApp', body: 'Sans consentement explicite et horodaté du client, l’envoi WhatsApp est refusé. Le registre des consentements fait foi.' },
      { route: '/app/messages', title: 'La fenêtre de 24 h', body: 'Au-delà de 24 h après le dernier message du client, seul un modèle approuvé peut rouvrir la conversation.' },
      { route: '/app/messages', title: 'Modèles et variables', body: '{{prenom}}, {{date}}, {{heure}}, {{lieu}}, {{bien}}, {{conseiller}} : les variables sont remplies depuis le dossier et l’agenda.' },
      { target: 'nav-agenda', route: '/app/agenda', title: 'Rappels automatiques', body: 'Depuis un rendez-vous, programmez le rappel J-1 à 18:00 et H-2. La routine AUT-110 les traite chaque minute.' },
      { route: '/app/agenda', title: 'Personne ne reste sans réponse', body: 'La routine AUT-111 vous alerte quand un client attend depuis plus de deux heures.' },
    ],
  },
  {
    id: 'automatisations', title: 'Automatisations', minutes: 3, role: 'Manager', img: 'villa-night',
    desc: 'Routines, niveaux d’autonomie et journal d’exécution.',
    steps: [
      { target: 'nav-automatisations', route: '/app/automatisations', title: 'Le catalogue de routines', body: 'Brief du matin, relances, rappels, contrôle qualité : chaque routine a un déclencheur, des conditions, une action et un repli.' },
      { route: '/app/automatisations', title: 'Trois niveaux d’autonomie', body: 'A : automatique. V : exécutée après votre validation. P : simple proposition. Les envois externes ne sont jamais en A.' },
      { route: '/app/automatisations', title: 'Le journal d’exécution', body: 'Chaque exécution est tracée : statut, durée, coût et détail. Une erreur ouvre une notification.' },
      { route: '/app/automatisations', title: 'Activer, couper, lancer', body: 'L’interrupteur est enregistré pour toute l’agence ; « Exécuter » lance la routine à la demande.' },
      { target: 'copilot', title: 'Comprendre un échec', body: 'Demandez au copilote pourquoi une routine a échoué : il lit le journal et propose la correction.' },
    ],
  },
  {
    id: 'pilotage', title: 'Pilotage manager', minutes: 3, role: 'Manager', img: 'nice-riviera',
    desc: 'Agences, transactions, coaching et conformité de la prospection.',
    steps: [
      { target: 'nav-pilotage', route: '/app/pilotage', title: 'Agence & réseau', body: 'Chiffre d’affaires, mandats, délais de vente et taux de transformation, par agence et par conseiller.' },
      { route: '/app/pilotage', title: 'Lire les écarts', body: 'Les indicateurs sont recalculés depuis les dossiers vivants. Un écart signalé renvoie au dossier concerné.' },
      { target: 'nav-transactions', title: 'Transactions', body: 'Offres, compromis, conditions suspensives et actes : les échéances en retard remontent en tête.' },
      { target: 'nav-coaching', title: 'Coaching', body: 'Simulations de rendez-vous et axes de progrès par conseiller, construits à partir des débriefs.' },
      { target: 'nav-prospection', title: 'Prospection conforme', body: 'Depuis le 11/08/2026, le démarchage téléphonique sans consentement est interdit : la prospection s’appuie sur le registre des consentements.' },
      { target: 'nav-idees', title: 'Feuille de route', body: 'Votez pour les évolutions et suivez ce qui arrive au prochain sprint.' },
    ],
  },
]

/** Lance un parcours depuis n’importe quel écran. */
export const startTour = (id: string) => window.dispatchEvent(new CustomEvent('nxt:tour', { detail: id }))

/** Document persistant de la collection `tutorials` (visites, étapes de prise en main, leçons, demandes de support). */
export type TutDoc = { id: string; kind?: 'tour' | 'step' | 'lesson' | 'ticket'; done?: boolean; skipped?: boolean; at?: string; step?: number } & Record<string, unknown>
