# 02 — Benchmark motion : landing Jaspe (animée, dynamique, interactive, luxe)

**Date de recherche : 11 octobre 2026.** Sources : navigation de motionsites.ai dans le navigateur intégré (sans compte, aucune connexion), lecture complète de 3 prompts gratuits (Agent Wave, Space Voyage, Monolith Hero), détection des librairies sur 3 sites Awwwards immobilier, sources GitHub et registre npm, WebSearch/WebFetch. Captures dans `shots/ms-*.jpg`.

**Contexte stack :** `nxt-agent` tourne sur un serveur Node simple (`server.mjs`, pas de bundler). Toutes les recommandations ci-dessous marchent donc **en vanilla JS + CDN** (ESM ou UMD). Les librairies React (React Bits, Aceternity, Magic UI) servent de **références à porter**, pas de dépendances.

---

## 0. Ce qu'il faut retenir (TL;DR)

1. **Le « wow » des meilleurs sites MotionSites ne vient pas surtout du WebGL.** Il vient de la combinaison suivante : une **vidéo IA cinématographique** plein écran (générée avec Higgsfield/Kling, hébergée sur CloudFront), une **typographie retenue** (Inter + un mot en *Instrument Serif italic*), une **chorégraphie d'entrée en CSS** (lignes masquées qui montent, flou → net, délais échelonnés), du **grain**, des **boutons « liquid glass / liquid metal »** avec un reflet qui balaie le bouton au survol, et un **parallax souris amorti**. Le prompt Agent Wave interdit même explicitement vidéo/WebGL/Three/Lottie pour la page elle-même : la vidéo y sert de fond, rien de plus.
2. **Les sites immobiliers primés en 2026 utilisent GSAP + Lenis.** ERA Residence (Awwwards Site of the Month, août 2026) charge `gsap@3.15` + ScrollTrigger + SplitText + CustomEase, `lenis@1.3.21`, Barba et Lottie. Sobha Privy Collection (SOTD, sept. 2026) utilise Three.js, Barba, ScrollTrigger, des transitions vidéo en `clip-path` et 12 vidéos sur la page.
3. **Stack recommandée pour Jaspe :**
   - GSAP 3.15.0 (ScrollTrigger, SplitText, Flip, Draggable, CustomEase, tous gratuits depuis 3.13) ;
   - Lenis 1.3.26 ;
   - `motion` 13.4.4 en vanilla pour les micro-interactions ;
   - `@paper-design/shaders` 0.0.81 pour un mesh gradient ou un grain très léger ;
   - OGL 1.0.11 seulement si un shader sur mesure est nécessaire.
   - À éviter : Spline ou Three.js pour un « bâtiment 3D » (lourd et gadget pour du B2B luxe).
4. **Signature visuelle proposée :**
   - Hero : vidéo IA d'une villa de la Riviera à l'heure dorée (Antibes, donc ancrée dans le pilote), titre en lignes masquées avec l'accent serif italique.
   - Parcours produit : un **rail de chapitres** inspiré de Stratum (BRIEF → MARCHÉ → QUARTIER → PRÉPARATION → ENTRETIEN → LIVRABLES) épinglé au scroll.
   - Final : les **9 livrables L1–L9** se déploient en éventail puis en grille (GSAP Flip, à la manière de « Book Hero »).

---

## 1. motionsites.ai : exploration

### 1.1 Ce qu'est le site
- **Bibliothèque de prompts payante** de Viktor Oddy (YouTube @ViktorOddy). Elle revendique « 500+ premium website design prompts ». Chaque carte ouvre `/?prompt=<slug>` : aperçu vidéo (MP4 sur R2 ou HLS) et bouton « Copy full prompt » (gratuit, **3 copies max sans compte**) ou « Go Unlimited » (premium, verrouillé). « Copy source code » est toujours verrouillé.
- **Catégories (filtres) :** All, Recent, Apps, Sections, Hero, Landing Page, SaaS, Creative, Agency, Portfolio, 3D, AI, Fintech, Technology, Travel, Wellness, 3D Website, Ecommerce, Carousel. Tri Popular / Pricing.
- **Autres rubriques :**
  - `/backgrounds` : vidéos de fond animées, « Copy URL » ;
  - `/mcp` : serveur MCP pour Claude, Cursor et Codex qui injecte les prompts dans l'agent, réservé aux plans payants ;
  - `/restyle`, `/academy` ;
  - « Explore the Full Library » renvoie vers designrocket.io.
- **Environ 330 cartes** chargées en scroll infini. Celles qui touchent notre sujet : *Sky Estate [Real Estate], Luxury Real Estate, Zenith Realty, Monolith Hero [Architecture], Monolithic [Luxury], Custom Spaces, Mountain Retreat, Investment Gate, Wealthcore, Golden Identity, Liquid Glass Agency, Layered Depth, Scroll Landing Page, Kairo Studio [Reveal], Particle Field [WebGL], Book Hero*.

### 1.2 Recettes techniques décodées (3 prompts gratuits lus en entier)

**A. Agent Wave / « Vesper.ai » (hero SaaS IA, 16 675 caractères).**
- Une seule page HTML, CSS inline et un petit IIFE ; fond `#000`.
- Fond : vidéo MP4 CloudFront (`hf_2026…` = sortie Higgsfield) à 100 % d'opacité, avec un scrim `::after` et une couche `.grain` en `z-index:100`.
- **Typo :** Inter 100–900 ; *Instrument Serif italic* **uniquement** sur les mots « AI agents », en gris `#9a9a9a`, `1.08em`, entrée `blur(4px)` → net.
- **H1 en deux lignes masquées :** `.headline-line{overflow:hidden}`, keyframe `translateY(40%)` → 0.
- **Entrées CSS :** `cubic-bezier(0.16,1,0.3,1)`, 1.05 s, `--d` échelonné de 0.08 à 1.44 s. Sept variantes : scale 0.84, soft +14 px, mask, pop 0.9 → 1.03 → 1, btn, side +22 px, stat.
  - Garde-fou utile : opacité de repos à 1, `animationend` ajoute `.is-in`, et un fallback JS après deux `requestAnimationFrame` si aucune animation ne tourne. La page n'est jamais blanche.
- **Boutons liquid-metal :**
  - fond `linear-gradient(105deg,#050505,#2a2a2a 48%,#4a4a4a)` ;
  - bordure `rgba(198,198,198,.55)` ;
  - reflet `::before` qui passe de `translateX(-120%)` à `120%` en 0.6 s au survol ;
  - lueur au survol `0 0 18px rgba(200,210,230,.18)`.
  - Le ghost CTA a un `backdrop-filter: blur(16px)`.
- **Mise en page :** hero aligné **en bas** (pas centré verticalement) et footer de 3 stats avec icônes SVG.
- **Accessibilité :** `prefers-reduced-motion` neutralise tout.

**B. Space Voyage / « Planet Jumping » (23 849 caractères).**
- Aucune librairie externe. **Préchargeur vidéo** avec compteur `0 → 100 %`, sortie en `blur(7px)` et translation.
- Le logo glisse du centre vers le header en 2 s.
- **Portail canvas** (masque animé `maskScale 0 → 1` sur 1050 ms) qui révèle la scène, tilt 3D au pointeur, **curseur custom** (point de 12 px + anneau de 36 px amorti) qui affiche « Enter ».
- Transitions vidéo de planète en planète : `TO_EARTH.mp4`, etc.

**C. Monolith Hero / « Stratum » (68 381 caractères), le plus pertinent : c'est un site de promoteur immobilier.**
- **Cadre** hairline à 30 u avec chanfreins de 26 u aux coins.
- **Rail d'index vertical** à 6 chapitres (VISION, EXPRESSION, CRAFTSMANSHIP, REFINEMENT, BALANCE, ORIGIN). Chaque chapitre a sa **vidéo de scène** (8–16 s, encodée en ping-pong avant/arrière, CRF 20–23) : fondu d'opacité de 0.9 s, chargement paresseux via `data-src`, pause 950 ms après sortie.
- **Changement de texte :** chaque ligne du titre redescend dans son masque (`translateY(112%)`, 0.5 s `cubic-bezier(.16,1,.3,1)`), on change le texte, puis la ligne remonte. Les libellés se **« décodent »** façon scramble au changement d'état.
- **Parallax souris :** lerp de 0.045 par frame, décalage de ±1.5 % et léger zoom vers le bas ; la boucle rAF s'arrête quand la cible est atteinte.
- **Système d'unités :** `--u: clamp(.68px, min(100vw/1280, 100dvh/800), 1.72px)`, donc tout est mis à l'échelle d'un canvas de 1280×800. Polices auto-hébergées en sous-ensemble ASCII (~7 Ko chacune).
- Dock bas : AUDIO ON/OFF, SCROLL TO UNCOVER, TALK WITH US.

**Conclusion méthode :**
- Visuel = vidéo IA de qualité + typographie + timing. Code = CSS keyframes + un peu de JS.
- Pour Jaspe, on garde cette base légère et on ajoute **GSAP ScrollTrigger** pour la partie storytelling, absente de ces prompts mono-écran.

### 1.3 Top 15 des exemples MotionSites (URL = `https://motionsites.ai/?prompt=<slug>`)

Slugs vérifiés quand indiqués. Pour les autres, ouvrir la carte depuis la home : le slug suit le titre.

| # | Exemple (catégorie) | URL | Ce qui le rend impressionnant / réutilisable pour Jaspe |
|---|---|---|---|
| 1 | **Monolith Hero** (Architecture, gratuit) | `?prompt=monolith-hero` | Promoteur immobilier : rail de 6 chapitres, une vidéo par chapitre en fondu, titre masqué qui se remplace, libellés « décodés », parallax souris amorti, cadre chanfreiné. **Modèle direct du parcours D1 → L9.** |
| 2 | **Luxury Hero** (Hero) | `?prompt=luxury-hero` | Villa méditerranéenne à l'heure dorée en vidéo, titre en capitales serif, nav pill en verre, CTA « Book a tour ». C'est le ton visuel visé (Riviera). |
| 3 | **Sky Estate** (Real Estate) | `?prompt=sky-estate` | Titre géant placé **derrière** le sujet (tour dans les nuages) : effet de profondeur par calques et détourage. Nav glass. |
| 4 | **Zenith Realty** (Landing Page) | `?prompt=zenith-realty-landing` | Landing immobilière éditoriale : hero maison d'architecte, cartes de biens, bloc « Exclusive collection ». Bonne référence de grille et de rythme. |
| 5 | **Luxury Real Estate** (Landing Page) | `?prompt=luxury-real-estate` | Plans architecturaux serrés (aplats rouges, ciel), minimalisme et vidéo lente : « l'architecture comme texture ». |
| 6 | **Custom Spaces** (Design) | home → « Custom Spaces » | « Bespoke Architecture Studio » : bande d'intérieurs en accordéon horizontal qui s'élargit au survol. |
| 7 | **Agent Wave** (AI, gratuit) | `?prompt=agent-wave` | Hero SaaS IA : onde de particules N&B, accent serif italique gris, boutons liquid-metal, stats en bas. **Spécification complète lue** (§1.2 A). |
| 8 | **AI Runtime** (AI, gratuit) | home → « AI Runtime » | « Intelligence designed to evolve » : arc d'horizon lumineux, typographie mono espacée, stats. Ton IA premium sans cliché robot. |
| 9 | **Anchor AI** (Portfolio) | home → « Anchor AI » | Arbre de particules bleues (« Streamlined Insurance Operations ») : métaphore de données organiques pour du B2B. |
| 10 | **Neuralyn** (SaaS, gratuit) | home → « Neuralyn » | Hero dashboard en surimpression sur une scène (« Your insights, one clear view ») : maquette produit mise en scène. |
| 11 | **Space Voyage** (Creative, gratuit) | `?prompt=space-voyage` | Préchargeur à compteur %, révélation par masque canvas, curseur custom, transitions vidéo. |
| 12 | **Golden Portal** (Landing Page) | `?prompt=golden-portal` | Ciel peint doré en vidéo, colombes, mélange serif/sans « DIGITAL ARCHIVE ». Palette or/ivoire transposable. |
| 13 | **Scroll Landing Page** (Interactive) | `?prompt=scroll-landing` | Storytelling cinématique piloté par le scroll (« Championing the pitch of legends ») : séquence vidéo scrubbée. |
| 14 | **Interactive Discovery** (Hero, gratuit) | `?prompt=interactive-discovery` | Strates 3D de terrain (« Layers hold tales of time ») et serif italique : métaphore « couches de données du quartier » (D2/D3). |
| 15 | **Book Hero** (Hero) | home → « Book Hero » | Livres en éventail 3D (« Foliom ») : **métaphore exacte pour présenter les 9 livrables** en pile ou éventail. |

Mentions : *Dream Garden* (éditorial mode, vidéo), *Atrium MTL* (éditorial N&B et couleurs), *Monolithic* [Luxury], *Investment Gate*, *Wealthcore*, *Liquid Glass Agency*, *Layered Depth* (tous premium, non ouverts en détail).

---

## 2. Galeries, bibliothèques et outils similaires (20)

| # | Site | Ce qu'il offre | 2–3 composants/effets à prendre pour Jaspe (luxe immo + IA) |
|---|---|---|---|
| 1 | **React Bits** (reactbits.dev, GitHub DavidHDev/react-bits) | Plus de 130 composants open source (JS/TS × CSS/Tailwind), CLI. Fonds en OGL ou WebGL brut, texte en GSAP/Motion. | **Grainient** (OGL, dégradé granuleux) ou **Silk** (three + R3F) pour le hero et le CTA ; **SplitText** et **ScrollReveal** (GSAP + ScrollTrigger) ; **Magic Bento** (GSAP, halo qui suit le curseur). Aussi : DecryptedText, CountUp, GradualBlur, GlassSurface, ScrollStack, Stepper. |
| 2 | **Aceternity UI** (ui.aceternity.com) | Composants Tailwind + Motion, blocs payants. | **Sticky Scroll Reveal** (texte à gauche, visuel collant à droite : parcours produit) ; **Animated Testimonials** (pile de portraits + texte mot à mot) ; **Container Scroll Animation / Macbook Scroll** (démo CRM qui se redresse au scroll). Aussi : Timeline, Bento Grid, SVG Mask Effect, Spotlight. |
| 3 | **Magic UI** (magicui.design) | Plus de 150 composants shadcn + Motion. | **Animated Beam** (sources DVF/INSEE/cadastre reliées au cœur IA) ; **Number Ticker** (KPIs) ; **Safari / iPhone mocks** + **Border Beam** (cadre de démo CRM). Aussi : Bento Grid, Marquee, Blur Fade, Progressive Blur. |
| 4 | **Cult UI** (cult-ui.com) | shadcn, orienté IA et landing. | **Dynamic Island** (notifications d'agent IA dans la démo CRM) ; **Agent Suggest Card Stack** ; **Hero Liquid Metal / Hero Dithering** (Paper Shaders). Aussi : Texture Card, Fluted Glass, Rolling Number. |
| 5 | **21st.dev** | Catalogue communautaire (heroes, pricing, testimonials, shaders) en registre shadcn, avec « Copy prompt » pour agent. | Sections pricing à bascule, testimonials marquee, heroes shader. À parcourir par recherche « pricing », « testimonial », « shader ». |
| 6 | **Paper Shaders** (shaders.paper.design) | Shaders canvas **sans dépendance**, vanilla ou React. | **Mesh Gradient** (encre / champagne / ivoire, très lent) ; **Grain Gradient** ou **Paper Texture** (matière luxe) ; **Liquid Metal** (logo Jaspe au CTA) ; **God Rays** (CTA final). Aussi : Fluted Glass (filtre image), Dithering. |
| 7 | **Unicorn Studio** (unicorn.studio) | Éditeur no-code de scènes WebGL, embed `data-us-project` + `unicornStudio.umd.js`. | Fond de hero interactif (lumière qui suit la souris sur du marbre ou un plan) produit sans code ; à réserver à une variante A/B. Badge sur le plan gratuit. |
| 8 | **ShaderGradient** (shadergradient.co, `@shadergradient/react` 2.4.20) | Dégradés 3D animés configurables (R3F). | Bloc « aurore » doux derrière le pricing ; trop « startup » s'il est saturé, à garder désaturé. |
| 9 | **Spline Community** (spline.design/community) | Scènes 3D remixables, runtime `@splinetool/runtime`. | Possible : maquette architecturale low-poly en rotation lente. **Déconseillé** en hero (runtime lourd, look jouet). |
| 10 | **Motion.dev examples** (motion.dev/examples) | Plus de 470 exemples React, JS et Vue. | **Price switcher** + **Number counter** (pricing) ; **Scroll Zoom Hero** et **Scroll Text Lines** ; **Shared layout** (cartes de livrables qui s'ouvrent en modal). Aussi : Scramble text, Ticker. |
| 11 | **GSAP Showcase** (gsap.com/showcase) | Vitrine des sites GSAP (A24, Illoca by Unseen, Guillaume Colombel…). | Patterns d'épinglage et de scrub, SplitText, Flip. Référence de qualité pour le timing. |
| 12 | **Codrops** (tympanus.net/codrops) | Tutoriels et démos open source (GitHub org codrops). | **SVG mask transitions on scroll** (mars 2026 : grille et stores qui révèlent des photos plein écran) ; **Cinematic 3D scroll with GSAP** (nov. 2025) ; **Horizontal parallax gallery DOM → WebGL** (fév. 2026). |
| 13 | **Awwwards, catégorie Real Estate** | Sites primés 2026. | ERA Residence (SOTM, GSAP + Lenis + SplitText) ; Sobha Privy Collection (Three + clip-path vidéo) ; Hubtown (Unseen Studio, canvas WebGL) ; LIKOVA, Realevate, 360 Lexington. |
| 14 | **Recent** (recent.design, anciennement godly.website, qui redirige en 301) | Inspiration web, motion et 3D filtrable. | Filtres Motion, Web, 3D, Editorial pour les micro-interactions (sliders, sélecteurs). |
| 15 | **Lapa Ninja** (lapa.ninja) | Galerie gratuite de landing pages par catégorie (dont Real Estate et AI). | Structure de sections SaaS IA (preuves, intégrations, FAQ). |
| 16 | **Framer Marketplace** (templates immo) | Templates luxe animés : **VELLUME** (hero cinématique au scroll), **Haven Noir** (masterplan architectural animé), ROYAL, Aurelia, Lume States (stats animées). | Hero scrubbé (Vellume) ; masterplan interactif (Haven Noir, à transposer en « carte des livrables ») ; stats animées. |
| 17 | **Uiverse** (uiverse.io) | Plus de 6000 éléments CSS/Tailwind open source. | Boutons shine/metal, toggles, loaders sans JS. |
| 18 | **Rive Community** (rive.app/community) | Animations à états interactives et très légères. | Micro-illustration « agent qui écoute » (onde vocale pendant l'entretien D5) avec état idle/talking. |
| 19 | **LottieFiles** (dotLottie) | Animations vectorielles. | Icônes animées des 9 livrables (mail, WhatsApp, réseaux sociaux…). ERA Residence utilise lottie-web 5.12.2. |
| 20 | **MotionSites `/backgrounds`** | Vidéos de fond IA « Copy URL ». | Source d'inspiration pour briefer la génération de notre propre vidéo (Higgsfield, Kling, Veo). |

---

## 3. Effets à construire, section par section (implémentables)

### 3.0 Versions épinglées (vérifiées sur npm le 11/10/2026, toutes publiées depuis plus de 2 semaines)

| Lib | Version | Publiée | CDN |
|---|---|---|---|
| gsap (+ScrollTrigger, SplitText, Flip, Draggable, CustomEase) | **3.15.0** | 2026-04-13 | `https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js` (+ `/dist/ScrollTrigger.min.js`, `/SplitText.min.js`, `/Flip.min.js`, `/Draggable.min.js`, `/CustomEase.min.js`) |
| lenis | **1.3.26** | 2026-08-05 | `https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js` + `lenis.css` |
| motion (vanilla : animate, scroll, inView) | **13.4.4** | 2026-09-25 | `https://cdn.jsdelivr.net/npm/motion@13.4.4/+esm` (la 14.x est sortie le 2 oct., trop récente) |
| @paper-design/shaders (vanilla) / -react | **0.0.81** | 2026-09-17 | `https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.81/+esm` (**épingler** : changements cassants possibles en 0.0.x) |
| ogl | **1.0.11** | 2025-01-27 | `https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm` |
| three (seulement si nécessaire) | **0.186.0** | 2026-09-08 | `https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.min.js` |
| unicornstudio.js (option) | **v2.2.14** | 2026-09-12 | `https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.2.14/dist/unicornStudio.umd.js` |

Polices (Google Fonts ou auto-hébergées en sous-ensemble) : **Inter** (UI) et **Instrument Serif italic** (accent), ou un serif display plus « maison » (Cormorant, Fraunces) pour les titres.

### 3.1 Socle global
- **Smooth scroll Lenis synchronisé avec GSAP :**
  ```js
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  ```
  Désactiver Lenis si `prefers-reduced-motion`.
- **Préchargeur sobre** (Space Voyage) : compteur 0 → 100 % lié au `canplaythrough` de la vidéo hero et à `document.fonts.ready`. Le logo Jaspe glisse ensuite vers le header (GSAP Flip). **Plafonner à 1.2 s** ; ne pas l'afficher aux visites suivantes (`sessionStorage`, dans un try/catch).
- **Grain global :** `.grain` fixe, SVG `feTurbulence` en data-URI, `opacity:.06`, `mix-blend-mode:overlay`.
- **Chorégraphie d'entrée** (recette Agent Wave) : `cubic-bezier(0.16,1,0.3,1)`, délais échelonnés via `--d`, opacité de repos à 1 et fallback `.is-in`.
- **Curseur custom** (desktop, `pointer:fine` uniquement) : point + anneau amortis, l'anneau grossit sur les éléments interactifs.
- **Libellés « décodés »** (Stratum) : scramble sur la nav et les chapitres, avec `motion` ou 20 lignes de JS.
- **Accessibilité :** `prefers-reduced-motion` coupe pin et scrub et affiche les états finaux ; focus visibles ; vidéos `muted playsinline` avec poster.

### 3.2 Hero
- **Recommandé, « Riviera cinématique » :**
  - **Vidéo :** villa contemporaine sur la côte d'Antibes à l'heure dorée, travelling très lent, 8–10 s, **encodée en ping-pong** (boucle sans saut, technique Stratum).
    - Formats : H.264 CRF 23 (~2–3 Mo) + AV1/WebM, poster WebP < 60 Ko.
    - Chargement : `preload="metadata"`, puis `src` posé après le premier rendu.
  - **Titre :** GSAP **SplitText** avec masque de lignes et un mot en *serif italique* champagne qui passe de `blur(4px)` à net :
    ```js
    SplitText.create('.hero h1', {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: s => gsap.from(s.lines, { yPercent: 110, duration: 1.1, stagger: .08, ease: 'expo.out' })
    });
    ```
  - **Profondeur :** parallax souris lerp 0.045 sur la vidéo (Stratum) et léger `scale` au scroll (ScrollTrigger `scrub`).
  - **CTA :** « Demander une démo » en liquid-glass (dégradé champagne → ivoire, reflet `::after` de -130 % à 130 % en 0.65 s) + bouton ghost « Voir le parcours » en `backdrop-filter: blur(16px)`.
  - **Bas de hero** (aligné en bas comme Agent Wave) : 3 stats (« 9 livrables générés », « 1 h → 5 min », « Antibes · pilote »), en Number Ticker.
- **Variante B (sans vidéo) :** Paper Shaders **MeshGradient** en encre `#0E1116`, bronze `#8C6A43`, champagne `#D9C7A3` et ivoire `#F4EFE6`, `speed: .08`, `distortion: .6`, `swirl: .2`, plus GrainGradient en overlay. Option : **texte derrière le sujet** (Sky Estate) avec une photo de villa détourée (PNG/WebP alpha) au-dessus d'un titre géant.
- **Variante C :** scène Unicorn Studio (lumière rasante sur du travertin qui suit la souris). Test A/B uniquement.
- **À éviter :** bâtiment 3D Spline ou Three.js (poids, LCP, rendu « jouet »).

### 3.3 Storytelling du flux produit : brief → entretien → 9 livrables
- **Structure « rail de chapitres » (Stratum) :** section épinglée par `ScrollTrigger.create({ pin: true, scrub: 1, end: '+=400%' })` avec un timeline maître. **Rail vertical à gauche :** D1 BRIEF · D2 MARCHÉ · D3 QUARTIER · D4 PRÉPARATION · D5 ENTRETIEN · L1–L9 LIVRABLES. L'item actif reçoit un marqueur et son libellé est « décodé ».
- **Scène à droite, qui change par chapitre :**
  1. **Brief (D1) :** carte de fiche vendeur qui se remplit champ par champ (texte « tapé », DecryptedText).
  2. **Marché et quartier (D2/D3) :** carte d'Antibes en SVG (tracé `stroke-dashoffset` scrubé) avec points DVF qui apparaissent et **Animated Beam** des sources vers le cœur Jaspe.
  3. **Entretien (D5) :** transcript qui défile, onde vocale (Rive ou SVG animé) et puces « insights » extraites qui se détachent et vont se ranger (GSAP Flip).
  4. **Livrables :** pile de 9 documents (vignettes réelles L1…L9 depuis les PDF du dossier) qui **s'ouvre en éventail 3D** (`rotateY`, `perspective`, à la manière de Book Hero), puis se **réorganise en grille 3×3** avec `Flip.from(state, { stagger: .05, ease: 'power3.inOut' })`. Compteur 0 → 9.
- **Changement de texte entre chapitres :** lignes masquées qui descendent puis remontent (`yPercent: 112`), 0.5 s.
- **Option vidéo scrubbée :** séquence d'images WebP (~90–120 frames, 1280 px) dessinée sur `<canvas>` selon la progression ScrollTrigger (méthode Apple). Plus fiable que `video.currentTime` ; sinon, encoder la vidéo avec une image clé à chaque frame (`ffmpeg -g 1`).
- **Amélioration progressive gratuite :** CSS `animation-timeline: view()` pour les apparitions simples hors section épinglée.
- **Mobile :** pas de pin ; chapitres empilés avec reveals `inView` (motion) ; éventail remplacé par un carrousel horizontal `scroll-snap`.

### 3.4 Bento des fonctionnalités
- Grille 4×3 irrégulière : CRM, Automatisations, Console multi-agences, Conformité, Données sourcées, Kit réseaux sociaux.
- **Halo de bordure qui suit le curseur** (Magic Bento) : variables CSS `--mx/--my` sur `pointermove` et `radial-gradient(400px at var(--mx) var(--my), rgba(217,199,163,.18), transparent)` sur un pseudo-élément masqué en bordure (`mask-composite`). Tilt léger (±4°) avec `gsap.quickTo`.
- **Micro-démos dans les cartes :** Number Ticker, **Border Beam** sur la carte phare, mini-graphe SVG tracé au scroll, marquee de logos de portails/outils.
- **Apparition :** `ScrollTrigger.batch('.bento-card', { onEnter: b => gsap.from(b, { y: 40, opacity: 0, stagger: .08 }) })`.

### 3.5 Démo interactive du CRM
- **DOM réel, pas une vidéo :** un mock du CRM Jaspe dans un cadre navigateur (Magic UI Safari mock + Border Beam), qui **se redresse au scroll** (Aceternity Container Scroll : `rotateX 20° → 0`, `scale .9 → 1`, scrub).
- **Interactions jouables :**
  - **Kanban** des mandats déplaçable : GSAP **Draggable** + **Flip** pour réordonner les colonnes « Estimation → Mandat → Vente ».
  - **Palette Ctrl+K** : taper « Prépare le RDV MARTIN » déclenche un streaming de texte (scramble puis typewriter) et génère les cartes L1–L9 avec des toasts **Dynamic Island** (Cult UI) du type « L7 Analyse de valeur prête ».
  - **Onglets animés** (indicateur partagé, layout animation de motion) : Pipeline / Agenda / Livrables / Équipe.
- Données factices réalistes : Antibes, biens, noms fictifs. Aucune donnée réelle.

### 3.6 Témoignages
- **Animated Testimonials** (Aceternity) : pile de portraits d'agents (rotation aléatoire ±8°, l'actif passe devant) avec citation en *Instrument Serif* révélée mot à mot (blur → net). Autoplay 6 s avec pause au survol.
- Variante : marquee double sens à masque de bord (`mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)`), vitesse modulée par la vélocité de scroll (React Bits ScrollVelocity / Motion Ticker).
- Logos d'agences et réseaux en LogoLoop grisé, en couleur au survol.

### 3.7 Pricing
- **Bascule mensuel/annuel** : chiffres animés (Motion « Price switcher » ou `gsap.to(obj, { val, snap: { val: 1 } })`).
- Carte recommandée avec **Shine/Border Beam** champagne et fond **GlassSurface** ; les autres cartes sont mates.
- Bascule Agence / Réseau (multi-agences) avec indicateur partagé animé.
- Lignes de fonctionnalités en `stagger` au premier passage uniquement (`once: true`).

### 3.8 CTA final et footer
- **Retour du hero :** la vidéo Riviera revient dans un `clip-path: inset(20% 30% round 24px)` qui s'ouvre en plein écran au scroll (ScrollTrigger scrub, technique Sobha Privy), avec le titre CTA en SplitText.
- **Bouton magnétique** (attraction de ±12 px, `gsap.quickTo`) et logo Jaspe en **Liquid Metal** (Paper Shaders) ou **God Rays** très discrets.
- **Footer :** wordmark « JASPE » géant révélé par masque (`yPercent: 100 → 0`) en bas de page.

### 3.9 Budget performance (garde-fous)
- LCP < 2.5 s : le poster de la vidéo hero est l'élément LCP, préchargé avec `<link rel="preload" as="image">`.
- JS motion ≤ ~90 Ko gzip au total (gsap ~28, ScrollTrigger ~18, SplitText ~8, Flip ~7, Lenis ~4, Paper Shaders ~15).
- Un seul contexte WebGL actif à la fois ; mettre en pause shaders et vidéos hors écran (IntersectionObserver).
- Vidéos chargées en différé par chapitre (`data-src`, méthode Stratum) et mises en pause 950 ms après sortie.

---

## 4. URLs de référence prioritaires

1. https://motionsites.ai/?prompt=monolith-hero : rail de chapitres immobilier (modèle du parcours)
2. https://motionsites.ai/?prompt=luxury-hero : ton visuel villa Riviera
3. https://motionsites.ai/?prompt=agent-wave : recette hero IA (typo, boutons, entrées)
4. https://motionsites.ai/?prompt=sky-estate : titre derrière le sujet
5. https://www.era-residence.com/ : GSAP 3.15 + SplitText + Lenis en production (SOTM août 2026)
6. https://sobha-privy-collection.com/ : transitions vidéo en clip-path + Three (SOTD sept. 2026)
7. https://reactbits.dev/components/magic-bento (+ `/backgrounds/grainient`, `/text-animations/split-text`)
8. https://ui.aceternity.com/components/sticky-scroll-reveal (+ animated-testimonials, container-scroll-animation)
9. https://shaders.paper.design/ : Mesh Gradient, Grain Gradient, Liquid Metal
10. https://magicui.design/docs/components/animated-beam (+ number-ticker, safari)
11. https://motion.dev/examples : price switcher, scroll zoom hero
12. https://tympanus.net/codrops/ : SVG mask transitions on scroll (mars 2026), cinematic 3D scroll (nov. 2025)
13. https://www.awwwards.com/inspiration_search/real-estate/
14. https://www.framer.com/marketplace/templates/vellume/ : hero luxe scrubbé
15. https://cult-ui.com/docs : Dynamic Island, Agent Suggest Card Stack, Hero Liquid Metal

## 5. Limites
- Prompts premium MotionSites non lus (paywall). Seuls 3 prompts gratuits ont été décodés intégralement, et la limite de 3 copies sans compte est atteinte. Aucun compte créé, aucune connexion.
- Les cookies d'ERA Residence n'ont pas été acceptés : le bandeau était hors écran.
- Détection de librairies sur Hubtown non concluante (bundle minifié, 1 canvas WebGL).
- Versions de `@splinetool/runtime`, `@rive-app/*` et `@lottiefiles/dotlottie-web` non datées : à vérifier avant usage.
