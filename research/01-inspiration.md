# Jaspe: Visual Research Sprint 01 (Inspiration)

Date: 2026-10-11. Scope: landing page plus the CRM/app for an AI-first, proactive platform for French real-estate agents and networks. Positioning: Côte d'Azur luxury meets top-tier AI SaaS.

## Method and honesty notes

- **Inspected:** 55+ references in total: 16 Dribbble shots looked at in hi-res (from about 60 search results across 6 queries), 9 Behance projects, 7 Awwwards entries, 3 Land-book entries, the Lapa real-estate category, and 20 live sites (17 captured at 1440x900; 3 measured for tokens only).
- **Measured tokens (not guessed):** on every live site I ran a script that read the computed fonts, the most-used colors, the CTA radius, the CSS easing curves and the animation libraries in use. Where this doc quotes hex values, fonts or easings for live sites, they come from that script.
- **Pinterest:** `pinterest.com/search/pins/?q=...` rendered an empty `<body>` (no pins, no text; it looks like a login or bot wall). I used nothing from Pinterest.
- **Godly** (`godly.website`) now redirects to `recent.design`. The search came back with no site list, so I used nothing from it.
- **SaaSframe** `/categories/crm` returned 404. For CRM patterns I used the live sites (Linear, Attio, Twenty, Folk) instead.
- **Lapa Ninja** real-estate category: I reviewed it, but it is mostly illustrative or non-luxury (Huts, Elevate). Nothing from it made the top 30.
- **Screenshots:** the in-app browser pane was hidden, which blocks its screenshot function. Instead:
  - Live sites were captured with Chrome DevTools in an isolated profile.
  - Dribbble, Behance, Awwwards and Land-book images were saved from their public CDNs.
- **Cookie banners:** some were hidden with CSS for the captures. None were accepted.
- **Sotheby's** showed a human-verification page in the DevTools browser. I did not bypass it; its tokens come from the in-app browser.
- **Saved files:** 46 useful images are in `research/shots/`; weak and duplicate ones were deleted. Prefixes: `drb-` Dribbble, `be-` Behance, `aw-` Awwwards, `lb-` Land-book, `site-` live capture. Files starting `ms-` were written by a parallel task and are not part of this index.

---

## 1. Top 30 references

| # | Reference | Platform | What's exceptional | Steal for the landing page | Steal for the CRM |
|---|---|---|---|---|---|
| 1 | **Loam House**: https://residences.loamhouse.com.au · `site-loamhouse.jpeg`, `aw-loam-house.jpg` | Awwwards nominee, live | Cormorant Garamond 300 at 122px with -5.5px tracking; second line in gold italic ("Bayside living"); DM Sans 300 body; dark glass lead panel over golden-hour render; 3-up stat row "88 · 86–275 m² · 3 min". Measured eases `cubic-bezier(.76,0,.24,1)` (in-out) and `(.3,1.4,.4,1)` (overshoot). GSAP + ScrollTrigger + three.js. | Serif/italic hero pairing; glass "Recevoir l'estimation" side panel; pill CTAs with an icon disc | Big serif numerals for KPI triads; the overshoot ease for confirmations |
| 2 | **Vestris** (AI agents for real-estate closing): `lb-vestris.webp` | Land-book | Editorial serif with an italic half and giant parentheses: "( The file *moves itself* )". Painterly olive foliage frames a real product UI. "Hours of work, *done in minutes*". A "human checkpoint" promise. Incoming documents feed with "Routed to Order #432". | Closest positioning match. Copy structure: claim, product, proof, then "try with a sample file" | Automation feed card: incoming item, AI action, routed destination, human-approve chip |
| 3 | **Lev** (AI platform for CRE): https://www.lev.com · `site-lev.jpeg`, `aw-lev.jpg` | Awwwards, live | Full-bleed dusk skyline video; IBM Plex Sans 500 at 80px, -3.6px; near-black green `#0F1716`-ish bg; mint CTA `oklch(.874 .126 166)` (about `#6FE3B5`). Product panel shows an AI "Screen result" with skeleton shimmer rows while it reasons. | Video hero with a short two-line promise ("Do less work. Close more deals.") | AI "thinking" skeleton that resolves into fields: use it for the pre-appointment brief |
| 4 | **Lenval Properties**: https://lenvalproperties.com · `site-lenval.jpeg`, `aw-lenval.jpg` | Awwwards, live | Financier Display (serif) + Helvetica Now; espresso `#211A19` / cream `#F9F4EE`; macro-texture video (sand, shells); live local clock "19:18 UAE"; tiny project index "P3 · Project J". Lenis + GSAP + Barba page transitions. Ease `(.25,1,.5,1)`. Awwwards thumb shows "( Refined Living )" in parentheses. | Live "Antibes 18:42" clock in the nav; macro material textures (limestone, sea) as section dividers; Barba-style transitions | Project codes (P3) as a quiet meta language for mandates |
| 5 | **Mejuma Tuscany**: https://mejuma-tuscany.com · `aw-mejuma.jpg` | Awwwards, live | 406px "Roxale Story" wordmark over aerial video inside a rounded inset frame; Golos Text body; ink `#38352C` on `#F1F1F1`; saffron pill CTA `#FFCA4F`. Ease `(.625,.05,0,1)`. Lenis/Locomotive. | Inset rounded video frame (16px margin) with the giant wordmark | The single-saffron-accent discipline: one warm accent only |
| 6 | **111 West 57th**: https://111w57.com · `site-111w57.jpeg` | Lapa, live | Taupe field, stacked numerals "111 / W / 57" in a light serif, bronze-grey meta `#7C7262`, ghost INQUIRE button. Expo eases `(.19,1,.22,1)` and `(.23,1,.32,1)`. | Typographic preloader: stack "N / X / T" then morph to the hero | Monochrome taupe/bronze neutral ramp for premium tables |
| 7 | **Sobha Privy Collection**: `aw-sobha-privy.jpg` | Awwwards | "*The art* / OF THE SUBLIME": script italic over spaced caps (TT Ramillas 300); B&W portrait; a "3D Map" link in the header. Ease `(.7,0,.3,1)`. | Script-italic plus caps lockup for section openers ("*L'art* DE LA VENTE") | "3D Map" entry point, which becomes the neighborhood radar |
| 8 | **Aman**: https://www.aman.com · `site-aman.jpeg` | Live | Limestone page `#F3EEE7`, Lyon Display/Text, zero radius, video inset with a 25px margin, a single dark "Reserve" block. Almost no color. | Restraint benchmark: one CTA and a lot of air | Limestone surfaces and zero noise: CRM calm |
| 9 | **Michaël Zingraf (Christie's, Côte d'Azur)**: https://www.michaelzingraf.com · `site-zingraf.jpeg` | Live (local competitor) | Aerial Villefranche-sur-Mer video; red square logo `#CF282A`; ivory `#FFFDF8`; a script "Collection" nav item; **"Livie AI" chat widget already live**. | Riviera palette from the imagery: azur sea, terracotta roofs, umbrella pine, limestone | Proof that luxury agencies already run AI concierges, so ours must feel more native and proactive |
| 10 | **Barnes**: https://www.barnes-international.com · `site-barnes.jpeg` | Live (French incumbent) | Raleway caps with 2px tracking; crimson `#C70A33`; sand `#EAE6DD`; segmented search pill over the villa hero. | Counter-reference: avoid the red, caps and search-bar codes of incumbents. Keep the warm sand. | Segmented control style (Acheter / Louer / Saisonnier) for CRM view switchers |
| 11 | **Daniel Féau (Christie's)**: https://danielfeau.com · `site-feau.jpeg` | Live | Helvetica Neue Light Condensed caps; Haussmann interiors with an Eiffel view; red CTA; dense filter bar. | Counter-reference for density. Keep the photographic standard (bright, architectural). | — |
| 12 | **Sotheby's International Realty** (`sothebysrealty.com`) | Live (tokens only) | Navy `#002349` / `#001731`, gold `#C29B40`; Freight Big + Benton Sans + Mercury Display Italic. | Navy plus gold as a trust code. Reinterpret it as Azur plus Champagne rather than copying it. | — |
| 13 | **Knight Frank**: https://www.knightfrank.com · `site-knightfrank.jpeg` | Live | Tiempos Headline + Suisse Intl; illustrated editorial cover for "The Residence Report"; huge numerals "130 · 600+ · 20,000+". | Big-number social-proof band | **The valuation report as an editorial magazine cover**: a model for the deliverables |
| 14 | **The Agency**: https://www.theagencyre.com · `site-theagency.jpeg` | Live | Playfair with an italic emphasis word ("world's *finest*"); red block logo; full video. | Italic emphasis word in the headline (one word only) | — |
| 15 | **Linear**: https://linear.app · `site-linear.jpeg` | Live | `#08090A` bg; Inter Variable at weight 510, -1.4px; product UI is the hero; Berkeley Mono; pill CTAs. Ease `(.25,.46,.45,.94)`. | Product-as-hero framed in a 1px-border window with a soft glow | Sidebar IA, activity timeline ("Triage Intelligence added labels…"), keyboard-first, 1/84 record navigator |
| 16 | **Attio**: https://attio.com · `site-attio.jpeg` | Live | Inter Display 600/64px, -1.28px; a Tiempos serif for accents; JetBrains Mono; "Ask Attio" button; workflow runs with Running/Paused/Done states; dotted canvas; Live toggle. | "Welcome to agentic revenue." Short, declarative, product right below | Automation builder on a dotted canvas plus a run-history list; "Ask Jaspe" global button |
| 17 | **Twenty CRM**: https://twenty.com · `site-twenty.jpeg` | Live | Aleo Light serif mixed with bold Host Grotesk in the same line ("CRM **at AI Speed**"); notched cut-corner buttons; pixel-bar side ornament; a dense, clean table with chip cells. | Mixed serif/sans inside one headline | Record table: chip cells, avatar owners, checkbox column, "New Record" CTA |
| 18 | **Folk**: https://www.folk.app/fr · `site-folk.jpeg` | Live (French UI) | Uxum Grotesque 72px, -1.8px; bracketed mono eyebrow "[ PRÉSENTATION … ]"; grainy grey gradient behind the product; kanban stages with totals ("Proposition envoyée 2 · 118 000 $"). | Bracketed mono eyebrows; grain-gradient stage behind the product shot | Kanban column headers with count and € total; French microcopy tone |
| 19 | **Vercel**: https://vercel.com · `site-vercel.jpeg` | Live | Geist Sans 64px, -3.84px; `#FAFAFA`; one object with a soft drop shadow; logo marquee. | Network-logo marquee; one hero object with a contact shadow | — |
| 20 | **Clay**: https://www.clay.com · `site-clay.jpeg` | Live | Roobert + Canela; tactile claymation 3D; ⌘K search in the marketing nav. | ⌘K shown in the landing nav as a "this is a power tool" signal | Command palette |
| 21 | **Nixtio "Planetvision"**: dribbble.com/shots/27353125 · `drb-nixtio-luxury.webp` | Dribbble | Giant condensed caps placed partly behind the house (depth masking); blueprint plus a black spec block "Q4 2026 · 0.12 HA · 450 M²"; day/night toggle. | Text-behind-subject masking in the hero | Day/night toggle, reused as a **before/after virtual staging** switch |
| 22 | **Phenomenon "Elyse Residence"**: dribbble.com/shots/25815603 · `drb-elyse-phenomenon.webp` | Dribbble | Didone giant "ELYSE" overlapping the photo; italic-caps eyebrow "HOLISTIC LUXURY"; numbered sections (3)(4)(5); green-black tiles; translucent vertical pillars over the interior. | Numbered section indices (01)–(09) for the 9 deliverables | — |
| 23 | **Lumios "Cala Mira"**: dribbble.com/shots/27409474 · `drb-lumios-editorial.webp` | Dribbble | Split layout: left frosted sidebar with spec table (Interior 620 m², Completion, Architect), floor-plan level switcher, right hero photo; GPS coordinates "36°01′12″N — 5°36′18″W" in the footer; bronze monochrome. | Coordinates as ornament (Antibes 43°34′N 7°07′E) | **Property detail template**: spec table, plan switcher, gallery counter 01/06 |
| 24 | **Serhii Yurkovskyi, minimal premium**: dribbble.com/shots/26974437 · `drb-serhii-minimal.webp` | Dribbble | An amber bar-chart **skyline mask** cut into the photo; amber monochrome type; live clock. | Signature idea: market data bars that double as a skyline mask | Market-data sparkbars in the same "cut-out" style |
| 25 | **Minhaj "A Modern Heirloom"**: dribbble.com/shots/27718992 · `drb-minhaj-editorial.webp` | Dribbble | Geometric sans with a swashy italic serif second line; dusk gradient (navy to apricot); cascading collage of image cards. | Cascading card collage revealing the 9 deliverables | — |
| 26 | **RonDesignLab "Onero"**: dribbble.com/shots/26761941 · `drb-onero-crm.webp` | Dribbble | A blurred 3D building as the backdrop with floating glass panels (occupancy, unpaid rent, a "Fix window handle" task); spatial, visionOS-like. | — | **Property "digital twin" view**: blurred hero photo with glass widgets for the mandate cockpit |
| 27 | **RonDesignLab "Palco CRM"**: dribbble.com/shots/25472601 · `drb-palco-crm.webp` | Dribbble | Frosted pastel cards; hatched (diagonal-stripe) projected bars versus solid actuals; property photo card with timestamp; dashed-outline hovered table row. | — | Hatched = projected / AI forecast, solid = real. A clean, honest data language |
| 28 | **Nixtio smart dashboard**: dribbble.com/shots/26522978 · `drb-nixtio-dashboard.webp` | Dribbble | Desaturated map with halo pins; black capsule cluster "15 · $4,954,380 · 5Y" anchored to the selected pin. | Animated map pins in the "Radar quartier" section | **Neighborhood radar**: halo pins plus a black stat capsule |
| 29 | **Hilf "NexusAI" dark CRM**: dribbble.com/shots/27558036 · `drb-nexusai-dark.webp` | Dribbble | Right rail: "Good morning, Alex · Live", a list of proactive bullets ("7 deals require attention"), a 2x2 quick-action grid (Generate follow-up email, Create proposal…), a chat; barcode-style meters. | — | **Daily proactive brief rail**: greeting, bullet insights, one-tap actions |
| 30 | **Behance "Agentic AI Real Estate CRM"**: behance.net/gallery/251823875 · `be-agentic-ai-crm.jpg` | Behance | The dashboard headline is a sentence: "You have 3 hot buyers ready to close"; hot-buyers list with match bars; live activity feed; aerial render as the header. | — | **Headline-as-insight** at the top of the CRM home |

**Also inspected (moodboard support, not in the top 30):**
- Brand and print mood:
  - Behance *Lunáre* (`be-lunare.png`): chocolate leather and spaced display caps.
  - *The Blumont* (`be-blumont.jpg`): navy card stock with gold foil on a silver tray; this is the prospect-letter and services-book print feel.
  - *Jawhara* (`be-jawhara.jpg`): an embossed champagne monogram on `#0E2630`.
- Real-estate SaaS UI:
  - *Real Estate Platform UX/UI* by Nixtio (`be-re-platform.jpg`).
  - *Propflow* (`be-propflow.png`).
  - *Gudrix* investment (`be-re-investment.png`): a lime band chart with italic light numerals, a good model for the valuation curve.
  - *PropValue* (`be-valuation.png`).
- Landing references:
  - Land-book *Chisel Industries* (`lb-chisel.webp`): thin line-diagram connectors drawn over photography with glass captions. **Ideal for explaining the AI pipeline.**
  - *Flamingo Estate* (`lb-flamingo.webp`).
  - Awwwards *Mr. C Residences Boca* (`aw-mrc-boca.png`): Riviera boat lifestyle.
  - *Rialto* (`aw-rialto.jpg`).
  - Dribbble *Eloria* (`drb-eloria-orbix.webp`): split CTA, label plus a square arrow.
  - *Estateo* (`drb-estateo-outcrowd.webp`): segmented agent progress bars, status chips on property cards.
  - *Arc* (`site-arc.jpeg`): cream `#FFFCEC` plus a single electric blue `#3139FB`.

**Anti-patterns seen (do not do):**
- Generic lavender/indigo dashboards (Delisas *Proptee*, Hexcode *Estatehub*).
- Gold-baroque "luxury" (Peno Lab *Lustra*).
- Sky-blue stock-tower templates (Olack).
- Rainbow donut KPIs (Estateo colors).
- Playfair plus red as a default luxury cliché.

---

## 2. Three design directions

All three use:
- A 12-column grid, max content width 1320px, gutter 24px, outer margin `clamp(20px, 5vw, 80px)`.
- A 4px spacing base: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 192.
- CRM density at 8/12/16. Landing section rhythm at 128–192px.
- `prefers-reduced-motion`: all transforms collapse to 150ms opacity fades.

### Direction A: "Riviera Noir" (dark nocturnal luxury)

**Mood:** Antibes after sunset. Cap d'Antibes villa lit from inside, Lenval and Loam House nocturne, Lev's cinematic dark. Warm blacks, never blue-black. Champagne used like jewellery.

**Palette**

| Token | Hex | Role |
|---|---|---|
| `--noir` | `#0D0C0A` | page background |
| `--graphite` | `#161512` | cards, sidebar |
| `--smoke` | `#211F1B` | elevated, hover, inputs |
| `--hairline` | `#F4EFE6` at 8% | borders, dividers |
| `--ivory` | `#F4EFE6` | primary text |
| `--stone` | `#A39B8B` | secondary text, meta |
| `--champagne` | `#C9A96E` | accent: key CTA, active state, AI signature |
| `--champagne-deep` | `#9C7E47` | pressed, focus ring at 40% |
| `--azur-night` | `#6FA3B8` | links, info, AI-generated highlights |
| `--sage` | `#86A98C` | success / signed |
| `--ochre` | `#D6A157` | warning / follow-up due |
| `--rouge` | `#C25A4A` | danger / lost |

**Type**
- Display: **Cormorant Garamond** 300/300-italic (Google). Fallback: `Georgia, 'Times New Roman', serif`. Alternative: **Gambetta** (Fontshare).
- UI: **Inter Tight** 400/500/600 (Google). Fallback: `system-ui, -apple-system, 'Segoe UI', sans-serif`. Alternative: **Switzer** (Fontshare).
- Data/meta: **JetBrains Mono** 400 (Google). Fallback: `ui-monospace, SFMono-Regular, Menlo, monospace`.
- Scale: hero 112–128px, tracking -4.5%, line-height 0.92; H2 64px; H3 32px; body 16/26; UI 13–14; mono meta 11px, +6% tracking, uppercase.

**Shape and depth**
- Radius: 2px on buttons and inputs (architectural), 14px on cards, 999px only for status pills.
- Shadows: none on dark surfaces. Depth comes from an inner 1px top highlight `inset 0 1px 0 rgba(244,239,230,.06)` plus a champagne glow on focus `0 0 0 1px #C9A96E66, 0 0 24px #C9A96E22`.
- Glass: `rgba(22,21,18,.62)` + `backdrop-filter: blur(20px) saturate(140%)` + hairline border, used only over photography or video.

**Motion**
- Slow, cinematic, weighted.
- Reveals: 900ms `cubic-bezier(.76,0,.24,1)` (Loam). Text line masks staggered 70ms.
- Hover: 240ms `cubic-bezier(.25,1,.5,1)` (Lenval).
- Page transitions: 1100ms curtain wipe with `(.7,0,.3,1)`.
- Lenis smooth scroll, lerp 0.08.

**Signature hero:** "Nocturne". A full-bleed slow dolly video of a Cap d'Antibes villa at blue hour inside a 16px inset rounded frame.
- Headline in Cormorant 300: "L'immobilier d'exception," with "*orchestré.*" in champagne italic.
- As the user scrolls, the windows of the villa light up one by one, each window labelled with a deliverable (Brief, Radar, Estimation…).
- Live clock "Antibes 21:14 · 43°34′N 7°07′E" bottom-left in mono.

**Signature CRM:** "Salon". A graphite three-pane app (nav · list · record).
- The home opens on a Cormorant sentence: "3 vendeurs à rappeler, 1 estimation prête à envoyer." Each phrase is a clickable chip.
- The right rail is the "Majordome" AI brief with champagne-edged quick actions.
- Projected data is drawn hatched, real data solid.

### Direction B: "Calcaire & Azur" (light Mediterranean editorial) ★

**Mood:** Antibes at 10am. Old-town limestone, Mediterranean blue, terracotta roofs, umbrella pines. Editorial like Aman and Vestris, precise like Linear and Attio. Warm paper, ink-blue AI. Feels like a printed dossier from a great agency.

**Palette**

| Token | Hex | Role |
|---|---|---|
| `--calcaire` | `#F2EDE4` | page background (limestone) |
| `--papier` | `#FBF8F3` | cards, panels, documents |
| `--craie` | `#E8E1D4` | sunken, hover rows, skeletons |
| `--trait` | `#DCD3C3` | hairlines, table borders |
| `--encre` | `#191815` | primary text |
| `--encre-2` | `#4A463F` | secondary text |
| `--pierre` | `#8A8274` | meta, placeholders |
| `--azur` | `#1D4A63` | primary brand, primary CTA, AI voice, links |
| `--azur-deep` | `#123346` | CTA hover/pressed, dark sections |
| `--azur-mist` | `#DCE7EC` | AI-suggestion background, selected rows |
| `--mer` | `#4C8DA8` | charts (series 1), focus ring |
| `--terracotta` | `#B4593A` | accent: "hot" signals, highlights, the one warm spark per screen |
| `--pin` | `#3E5641` | success / mandat signé, charts (series 2) |
| `--ocre` | `#C4943F` | warning / relance, gold detail on print deliverables |
| `--bordeaux` | `#8E2F2B` | danger / perdu |

Night mode for the CRM "focus" theme: `--nuit #0F1315`, `--nuit-2 #161C1F`, `--nuit-3 #1F272B`, text `#EDE7DC`, meta `#8E968F`, azur becomes `#7FB1C9`, terracotta becomes `#D07A5A`.

**Type**
- Display: **Instrument Serif** 400 + italic (Google; Latin-Ext, French accents OK). Fallback: `'Iowan Old Style', Georgia, serif`. Alternative: **Erode** or **Zodiak** (Fontshare).
- UI: **Geist** 400/500/600 (Google). Fallback: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`. Alternative: **General Sans** (Fontshare).
- Data, coordinates, prices: **Geist Mono** 400/500 with tabular figures. Fallback: `ui-monospace, Menlo, monospace`.
- Scale:
  - Hero 104–120px, -3% tracking, line-height 0.95.
  - Italic on one phrase only, always in `--azur` or `--terracotta`.
  - H2 56px, H3 28px.
  - Body 17/28 on the landing page; CRM UI 13.5/20.
  - Mono eyebrows 11px uppercase, +8% tracking, bracketed: `[ 03 — RADAR QUARTIER ]`.

**Shape and depth**
- Radius: 10px on buttons and inputs, 18px on cards, 28px on hero media frames, 999px on chips.
- Shadows, warm-tinted and never grey:
  - Resting: `0 1px 0 rgba(25,24,21,.04), 0 8px 24px -12px rgba(60,45,25,.18)`.
  - Lifted: `0 24px 60px -24px rgba(60,45,25,.28)`.
- Glass: `rgba(251,248,243,.72)` + `blur(18px) saturate(120%)` + 1px `rgba(255,255,255,.6)` top edge, used only over photos.
- Paper grain overlay at 3% opacity on `--calcaire` sections.

**Motion**
- Mediterranean: calm, light, a little buoyancy.
- Reveals: 700ms `cubic-bezier(.65,.05,0,1)` (Mejuma's signature curve). Line-mask stagger 60ms.
- UI hover/press: 180ms `cubic-bezier(.25,1,.5,1)`.
- Success and confirm: 420ms `cubic-bezier(.3,1.4,.4,1)` (Loam overshoot), used sparingly.
- Number tickers: 1200ms `cubic-bezier(.19,1,.22,1)` (111W57 expo-out).
- Lenis lerp 0.1.

**Signature hero:** "Fenêtre sur la mer".
- Layout: limestone page; left, a 9-column headline in Instrument Serif: "Chaque vendeur mérite *un dossier d'exception*." (italic in azur).
- Right, a 28px-radius arched window frame (Provençal arch top) showing a slow video of the Antibes coastline.
- On scroll, the arch pins and the view inside it cross-fades, through a sliding mask, into the actual Jaspe seller cockpit, so the product appears inside the window.
- Under the arch: a Chisel-style thin azur line diagram that connects "RDV" to "9 livrables". Each node pops in as the user scrolls.
- Coordinates and live clock in Geist Mono.

**Signature CRM:** "Le Dossier". Each seller is a document-like workspace on `--papier`.
- A left vertical journey rail (Brief → Marché → Radar → Découverte → Livrables) fills with an azur ink line as steps complete.
- The top line is a sentence: "Mme Laurent est prête pour l'estimation, *2 comparables* changent votre fourchette."
- The 9 deliverables appear as a fanned stack of paper cards. Hover lifts a card, click opens it full-bleed.
- Projected values are hatched azur; real values are solid ink.
- A night-mode toggle ("Mode nuit") switches to Nuit for late sessions.

### Direction C: "Atelier Monolithe" (architectural, taupe and bronze)

**Mood:** a 111W57 and Elyse gallery. Stone, bronze, blueprint. Condensed numerals like Nixtio's spec blocks, Didone display like Elyse. Feels like an architect's portfolio: severe, quiet, very confident.

**Palette**

| Token | Hex | Role |
|---|---|---|
| `--taupe` | `#5E5648` | hero and feature fields |
| `--os` | `#ECE6DB` | page background (bone) |
| `--lin` | `#F7F3EC` | cards |
| `--grege` | `#CFC6B7` | lines, disabled |
| `--anthracite` | `#151412` | text, spec blocks (black panels) |
| `--bronze` | `#8C6A43` | accent, active, CTA |
| `--bronze-clair` | `#B8946A` | hover, chart highlight |
| `--blueprint` | `#2F4A5C` | AI, links, plan lines |
| `--olive` | `#5F6B4E` | success |
| `--ambre` | `#C08A3E` | warning |
| `--brique` | `#9A3F33` | danger |

**Type**
- Display: **Bodoni Moda** (Google, optical-size axis) 400/italic. Fallback: `'Didot', 'Bodoni 72', Georgia, serif`. Alternative: **Boska** (Fontshare).
- UI and condensed numerals: **Archivo** variable (Google, wdth 62–125). wdth 100 for UI, wdth 62 weight 700 for big spec numerals ("450 M²"). Fallback: `'Arial Narrow', system-ui, sans-serif`. Alternative: **Cabinet Grotesk** (Fontshare).
- Mono: **IBM Plex Mono** (Google). Fallback: `ui-monospace, monospace`.
- Scale: hero 140px Didone with tight leading; spec numerals 72px condensed; body 16/26; meta mono 11px.

**Shape and depth**
- Radius: 0 everywhere (Aman, Barnes, Knight Frank), with 999px only on round icon buttons.
- Shadows: none. Hierarchy comes from black spec slabs, 1px `--grege` rules, and blueprint line drawings.
- Glass: not used. Use solid taupe overlays at 88% instead.

**Motion**
- Mechanical and precise, like sliding stone panels.
- Reveals: 800ms `cubic-bezier(.7,0,.3,1)` (Sobha), wipe-from-edge clip-path.
- Hover: 200ms linear-ish `(.4,0,.2,1)`.
- Numerals roll digit by digit with a 40ms stagger.
- Page transitions: vertical panel slide over 900ms.

**Signature hero:** "Monolithe".
- A taupe full-screen field with "N / X / T" stacked as in the 111W57 preloader.
- The letters slide apart like doors to reveal a nocturnal villa photo, with "AGENT" in giant condensed Archivo masked behind the roofline (Nixtio depth).
- Blueprint plan lines draw themselves over the facade.

**Signature CRM:** "Planche". Each mandate is an architect's board:
- Floor-plan thumbnail.
- Black spec slab (Prix · Surface · DPE · Délai).
- Condensed numerals.
- A blueprint-line timeline.
- The network console as a taupe "atlas" map with bronze pins.

---

## 3. Recommendation: Direction B, "Calcaire & Azur", with A's Nuit as the CRM dark theme

**Why B:**
1. **It is ownable.** The AI-SaaS references (Lev, NexusAI, Linear, the Dribbble CRMs) are almost all near-black with a neon accent, and the French luxury incumbents (Barnes, Féau, The Agency, Zingraf) are all white plus red plus caps. A limestone and azur system belongs to neither camp, and it is literally the colour of Antibes (old-town stone, Baie des Anges).
2. **It is where 2026 winners are converging.** Every top-scoring site I measured pairs an elegant serif, often with an italic accent phrase, with a precise grotesk: Loam (Cormorant + DM Sans), Vestris, Lenval (Financier + Helvetica Now), Twenty (Aleo + Host Grotesk), Attio (Inter Display + Tiempos), Knight Frank (Tiempos + Suisse). Instrument Serif plus Geist is the free, Google-hosted version of that pairing.
3. **It works for the product, not only the hero.** Agents spend hours in the CRM. Warm light paper with ink-blue reads better and feels less "gamer" than dark mode. The Nuit theme (warm/azur-tinted black, champagne accent) still covers evening use and showroom demos.
4. **The 9 deliverables are print-like** (letters, services book, valuation report, condo dossier). B's paper/ink/ochre-gold system carries over directly to PDF and print. Knight Frank's report covers and The Blumont's stationery show how premium that can look.
5. **AI gets one consistent voice.** Azur means "Jaspe did this": AI suggestions sit on `--azur-mist`, AI-written text carries an azur hairline, projections are hatched azur. That consistency is what makes a proactive AI trustworthy (Vestris's "human checkpoint", Palco's hatched forecasts).
6. **It is cheap to build.** Every font is on Google Fonts, and the motion runs on GSAP, Lenis and CSS: no WebGL dependency for the core experience. A's Nocturne video and C's blueprint line-draw can still appear as single moments (the case-study section, the valuation report page).

**Guardrails:**
- One italic phrase per headline.
- One terracotta spark per screen.
- Champagne/ochre only on print and premium moments.
- No gradients except the paper grain and photographic light.
- No purple, anywhere.

---

## 4. Forty micro-interactions and animated components

| # | Component | Spec (B timings unless noted) | Inspired by |
|---|---|---|---|
| 1 | Line-mask headline reveal | Each line slides up from `overflow:hidden`, 700ms `(.65,.05,0,1)`, 60ms stagger; the italic phrase lands last with a 1° skew settle | Loam House, Lenval |
| 2 | Typographic preloader "N/X/T" | Stacked letters, then doors part to reveal the hero (Direction C) or fade (B); 1.4s total; skipped on revisit | 111 West 57th |
| 3 | Arched "window" scroll-pin morph | Arch frame pins; the coastline video cross-masks into the product UI over 150vh of scroll | Lev (video), Vestris (product framed in scenery) |
| 4 | Text-behind-subject depth mask | Wordmark sits between the photo background and a cut-out foreground layer; parallax 0.85 vs 1.0 | Nixtio Planetvision |
| 5 | Market-bar skyline mask | Hero photo revealed through animated bars of real DVF price data, so the skyline is a chart | Serhii Yurkovskyi minimal |
| 6 | Live local clock + coordinates | "Antibes 10:42 · 43°34′N 7°07′E" in mono, ticking each minute with a digit roll | Lenval, Cala Mira, Serhii |
| 7 | Magnetic pill CTA with icon disc | Disc translates 6px toward the cursor; the label shifts 2px; 180ms `(.25,1,.5,1)` | Loam House buttons |
| 8 | Split CTA (label + square arrow) | The arrow square slides right 4px and swaps the arrow on hover | Eloria (Orbix), 111W57 Inquire |
| 9 | Inset rounded video frame that expands | 16px inset frame grows to full-bleed as the hero scrolls out (radius 28 to 0) | Mejuma, Aman |
| 10 | Chisel-style line-diagram pipeline | SVG path draws RDV → Brief → Radar → Découverte → 9 livrables with `stroke-dashoffset` on scroll; nodes pop with overshoot | Chisel Industries |
| 11 | Fanned deliverables stack | 9 paper cards fan out (rotate -6° to +6°); hover lifts 12px with a warm shadow; click flips to full preview | Minhaj collage, Blumont stationery |
| 12 | Sticky stacked section cards | Each of the 9 deliverables pins, then the next card slides over at 96% scale | Elyse numbered sections, Linear |
| 13 | Numbered bracket eyebrows | `[ 04 — RAPPORT D'ESTIMATION ]` types in character by character (24ms/char) on enter | Folk, Elyse (3)(4)(5) |
| 14 | Big-number ticker band | "+38 % de mandats exclusifs" counts up in 1200ms expo-out, tabular figures | Knight Frank 130 / 600+ / 20,000+ |
| 15 | Network-logo marquee | Agency logos scroll continuously; hover pauses and desaturates the others | Vercel |
| 16 | Before/after virtual staging slider | Draggable divider with spring physics plus a day/night style toggle; keyboard arrows supported | Nixtio day/night toggle |
| 17 | Cursor-follow listing preview | Hovering a mandate row in the landing demo shows a floating 240px photo that lerps to the cursor (0.15), with a slight tilt from velocity | Elyse / Lenval galleries |
| 18 | 3D tilt property cards | ±6° tilt toward the pointer, a sheen gradient follows, 300ms settle | Estateo property cards, Onero |
| 19 | Glass lead-capture panel | "Recevez un exemple de dossier": blurred glass over the hero, fields underline-animate on focus | Loam House brochure panel |
| 20 | Page-curtain transitions | Barba/View-Transitions wipe in `--azur-deep`, 900ms `(.7,0,.3,1)` | Lenval (Barba), Sobha |
| 21 | AI streaming skeleton → content | Skeleton rows shimmer (1.6s loop), then resolve field by field with a 40ms stagger as the brief is written | Lev "Screen result" |
| 22 | Headline-as-insight | The CRM home H1 is a generated sentence; key nouns are chips that open the record | Behance Agentic AI CRM |
| 23 | Proactive brief rail | Greeting, 3–5 bullet insights, a 2x2 one-tap action grid; new insights slide in from the top with a soft azur flash | NexusAI right rail |
| 24 | Command palette ⌘K | Fuzzy search across sellers, properties and actions; AI "Ask Jaspe" mode; 160ms scale-in from 0.98 | Clay nav ⌘K, Linear, Attio "Ask" |
| 25 | Kanban with drag physics | Cards lift (scale 1.03, shadow lifted), rotate ±2° by drag velocity, spring-drop (stiffness 380, damping 30); column header € totals tick | Folk pipeline |
| 26 | Seller journey ink rail | A vertical azur line fills between steps as each completes; the completed node gets an overshoot check | Linear activity timeline, Vestris steps |
| 27 | Hatched forecast vs solid actual | Projected bars and lines drawn with an animated diagonal hatch pattern; real values morph solid when confirmed | Palco CRM |
| 28 | Neighborhood radar map | Desaturated map; pins appear with a halo pulse (2s loop); the selected pin anchors a black stat capsule cluster | Nixtio smart dashboard |
| 29 | Radar sweep | A conic-gradient sweep rotates once on load over the comparables map; each comparable pings as the beam passes | Sobha "3D Map", Nixtio pins |
| 30 | Automation canvas with run history | Dotted-grid node editor; a live run animates a pulse along the edges; run list items show Running → Done | Attio Workflows |
| 31 | Incoming-document auto-routing feed | A new item slides in, an AI badge "Classé → Dossier Laurent" morphs with a check, an undo chip stays 6s | Vestris document feed |
| 32 | Segmented progress meters | Agent or network goals as 20-segment bars that fill segment by segment | Estateo agents, NexusAI barcode meters |
| 33 | Property digital-twin cockpit | Blurred hero photo of the property; glass widgets (visits, offers, DPE, tasks) float with gentle parallax on pointer | Onero |
| 34 | Spec slab with condensed numerals | Black block "Prix · Surface · Délai"; digits roll in individually | Nixtio Planetvision spec block |
| 35 | Floor-plan level switcher | Arrows cross-fade plan levels with a 12px slide; the plan's lines draw in | Cala Mira (Lumios) |
| 36 | Record navigator "1 / 84" | j/k keys move through sellers with a 120ms vertical slide of the detail pane | Linear |
| 37 | Chip-cell data table | Inline-editable chip cells; row hover shows a dashed outline and quick actions; sticky first column | Twenty CRM, Palco hovered row |
| 38 | Live toggle and status pills | iOS-style toggle with a spring thumb; the "Live" pill breathes (opacity .6 to 1, 2s) | Attio, NexusAI "Live" |
| 39 | Deliverable "generated" reveal | A paper sheet rises from the card, the text writes in (typewriter mask), then an ochre seal stamp scales from 1.4 to 1 with overshoot | Blumont foil, Loam overshoot |
| 40 | Night-mode transition | A circular reveal from the toggle position (View Transitions API, 600ms) between Calcaire and Nuit | Lenval light/dark sections, Nixtio day/night |

---

## Saved files index (`research/shots/`)

- **Live captures (1440x900):** `site-loamhouse.jpeg`, `site-lenval.jpeg`, `site-111w57.jpeg`, `site-aman.jpeg`, `site-zingraf.jpeg`, `site-barnes.jpeg`, `site-feau.jpeg`, `site-knightfrank.jpeg`, `site-theagency.jpeg`, `site-lev.jpeg`, `site-linear.jpeg`, `site-attio.jpeg`, `site-twenty.jpeg`, `site-folk.jpeg`, `site-vercel.jpeg`, `site-clay.jpeg`, `site-arc.jpeg`.
- **Awwwards:** `aw-lev.jpg`, `aw-lenval.jpg`, `aw-loam-house.jpg`, `aw-mejuma.jpg`, `aw-sobha-privy.jpg`, `aw-mrc-boca.png`, `aw-rialto.jpg`.
- **Dribbble (1600x1200):** `drb-nixtio-luxury.webp`, `drb-elyse-phenomenon.webp`, `drb-lumios-editorial.webp`, `drb-serhii-minimal.webp`, `drb-minhaj-editorial.webp`, `drb-eloria-orbix.webp`, `drb-onero-crm.webp`, `drb-palco-crm.webp`, `drb-nixtio-dashboard.webp`, `drb-nexusai-dark.webp`, `drb-estateo-outcrowd.webp`.
- **Behance:** `be-agentic-ai-crm.jpg`, `be-re-platform.jpg`, `be-propflow.png`, `be-re-investment.png`, `be-valuation.png`, `be-lunare.png`, `be-blumont.jpg`, `be-jawhara.jpg`.
- **Land-book:** `lb-vestris.webp`, `lb-chisel.webp`, `lb-flamingo.webp`.
