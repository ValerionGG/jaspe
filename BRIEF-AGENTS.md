# Brief commun — CRM Jaspe (design-v2)

Projet : `D:/Immo_Agent/design-v2/app` (Vite + React 19 + TS strict + Tailwind 3.4 + motion 11 (`motion/react`) + @phosphor-icons/react + maplibre-gl 4.7). Dev server déjà lancé : http://127.0.0.1:5317 (HMR). Ne lance PAS d'autre serveur, n'installe AUCUN paquet.

Produit : Jaspe — copilote proactif pour agences/réseaux immobiliers de luxe (Côte d'Azur). Parcours vendeur D1 brief, D2 marché, D3 quartier, D4 coaching, D5 découverte, livrables L1 remerciement, L2 synthèse équipe, L3 avant-première acquéreurs, L4 kit social, L5 courrier voisinage, L6 book services, L7 estimation, L8 avant/après, L9 copro & diagnostics. Règles métier clés : chaque chiffre sourcé et daté ; validation humaine avant tout envoi externe ; original conservé et images IA étiquetées (AI Act, août 2026) ; démarchage téléphonique sans consentement interdit en France depuis le 11/08/2026 → registre des consentements ; RGPD.

## Direction artistique « Nocturne Riviera » (OBLIGATOIRE)
LIS D'ABORD : `tailwind.config.js`, `src/index.css`, `src/ui/kit.tsx`, `src/crm/ui.tsx`, `src/data/mock.ts`, et les pages de référence `src/crm/pages/Today.tsx`, `Dossiers.tsx`, `DossierDetail.tsx`. Copie leur langage visuel exactement.
- Fond `bg-ink`, cartes via `<Card>` (double-bezel), texte `text-bone`, secondaire `text-bone/55` ou `text-mist`, accent `champagne`, états : `sage` (ok), `coral` (alerte), `sea` (en cours/info).
- Titres : `display` (Instrument Serif) ; un mot en `italic text-champagne-300`. Chiffres : classe `num` (Geist Mono) ou `display` pour les gros KPI.
- Micro-libellés : `text-[10.5px] uppercase tracking-eyebrow text-mist`.
- Hairlines : `ring-1 ring-white/[0.06]`, jamais de bordure grise épaisse, jamais d'ombre dure. Rayons généreux (rounded-2xl / rounded-[1.4rem]).
- Icônes Phosphor `weight="light"` (taille 14–18). Pas de lucide.
- Mouvement : `Stagger` pour l'entrée des blocs (i croissant), `motion` + `EXPO` pour transitions, `layoutId` pour onglets/pilules actives (`Tabs`). Jamais `ease-in-out` ni linear sur UI.
- Photos : `img('nom')` depuis mock (`/img/*.webp` : villa-pool, villa-night, villa-white, villa-modern, villa-palm, villa-sunset, house-dusk, house-dusk2, house-dusk3, house-pool, house-white, house-wood, house-garden, medit-street, nice-riviera, int-living, int-lounge, int-dining, int-boho, int-loft, int-glass, int-bedroom, int-bath, int-chair, int-kitchen, int-family ; portraits p-claire, p-marc, p-sofia, p-julien, p-ines, p-lea, p-paul, p-thomas).
- Langue : français impeccable (espaces insécables avant : ; ? ! acceptées en espace simple), ton premium sobre. Données synthétiques réalistes Antibes/Juan-les-Pins/Cap d'Antibes/Biot/Valbonne/Cannes/Mougins.
- Responsive : mobile 390 px correct (grilles qui s'empilent, tableaux en overflow-x-auto).
- Chaque page commence par `<PageHeader kicker title sub actions />`, est riche, interactive (filtres, onglets, sélection, tiroirs, états), jamais un placeholder. Niveau attendu : Dribbble/Awwwards, CRM type Attio/Linear version luxe.

## Contraintes de code
- Tu ne modifies QUE les fichiers qui te sont attribués (+ tes nouveaux fichiers `src/data/<ton-domaine>.ts` ou `src/crm/<composant>.tsx` préfixés par ton domaine). NE TOUCHE PAS à kit.tsx, ui.tsx, mock.ts, CrmApp.tsx, index.css, tailwind.config.js, landing/*. Si un composant partagé te manque, crée-le dans ton propre fichier.
- Chaque page : `export default function X()`.
- TypeScript strict (noUnusedLocals) : `npx tsc -b` doit passer sans erreur sur tes fichiers avant de finir (d'autres agents travaillent en parallèle : ignore les erreurs dans des fichiers qui ne sont pas les tiens).
- Vérifie visuellement : outils `mcp__plugin_chrome-devtools-mcp_chrome-devtools__*` (charge via ToolSearch). Ouvre ta page avec `new_page` (isolatedContext = ton nom d'agent), `emulate` viewport `1440x900x1`, `select_page` bringToFront avant `take_screenshot` (sinon timeout), attends ~2 s les animations. Corrige ce qui est laid ou cassé. Vérifie aussi 390x844. Ferme tes pages à la fin.
- Carte : MapLibre GL avec tuiles raster CARTO sombres `https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png` (+ b, c), attribution « © OpenStreetMap © CARTO », `import 'maplibre-gl/dist/maplibre-gl.css'`, marqueurs HTML personnalisés (pastille champagne + prix), centre Antibes [7.12, 43.58].
- Rapport final : liste des fichiers créés/modifiés + ce que fait chaque page, en 15 lignes max.
