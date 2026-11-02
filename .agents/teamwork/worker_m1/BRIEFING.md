# BRIEFING — 2026-11-02T03:52:00Z

## Mission
Milestone 1 Implementation: Static Architecture & MPA Decoupling (Features 1–5). Create home.html, refactor index.html for ultra-light static landing, create src/landing/index.ts and landing.css, configure vite.config.ts MPA dual entry and dev rewrites, update scripts/post-build.js to preserve dist/index.html and generate SPA routes from home.html, and update src/routes.ts.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1/
- Original parent: f84aca46-e09f-4967-b5d1-281f855a924e
- Milestone: Milestone 1 (110-Hero Character Illustration Remaster)
- Current Parent: 3a464f6d-bcf9-4b99-af07-b0e05ceb817a
- Milestone 1 Update: Core Gameplay & Battle Views UI/UX Visual Unification (Features 1–17)
- 2026-11-02 Milestone 1: Static Architecture & MPA Decoupling (Features 1–5)
- Current Parent: 7b342c7a-1d74-43d7-a388-5ffc926b3969

## 🔒 Key Constraints
- Exclusively own `/Users/dayyoung/project/snshero/public/seat/*.png` (all 110 individual portrait files) and scratch scripts in `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m1/`.
- MUST NOT modify source code files in `src/` or `tests/`.
- Integrity Mandate: DO NOT cheat, fake, hardcode, or create dummy implementations. Genuine visual processing only.
- Output requirements:
  * Exactly 110 PNG files in `public/seat/` matching `${title_en.replace(' ', '_')}.png`.
  * Dimensions: exactly 256x296 px RGBA PNG.
  * Size constraints: 4,096 bytes <= size <= 35,840 bytes for EVERY file.
  * 110 unique SHA-256 hashes (0 duplicates, 0 blank/uniform images).
  * Tier-based visual remastering (Bronze, Silver, Gold, Boss).
  * Recover 3 corrupted files (Celia.png, Hyperion_Prime.png, Sentinel.png) from git commit 94a5ac5b.
- [2026-10-18T10:25:54Z Dispatch Assignment Constraints]:
  * Exclusive Write Ownership:
    `src/views/HomeView.tsx`
    `src/views/MobileCardPlayScreen.tsx`
    `src/views/MyDeckView.tsx`
    `src/views/PlayGameView.tsx`
    `src/components/battle/TacticalCommandHUD.tsx`
    `src/components/battle/TacticalSynergyMatrix.tsx`
    `src/components/battle/StarBreathingUltimateWidget.tsx`
    `src/components/battle/ElementalTempestWidget.tsx`
    `src/components/MinimalistMissionHUD.tsx`
    `src/components/ResponsiveCleanHUD.tsx`
    `src/components/DemoPlayHUD.tsx`
    `src/components/BattleBossHUD.tsx`
    `src/components/MissionGameCardHUD.tsx`
  * MUST NOT modify any file outside exclusive write ownership.
  * 100% adherence to DESIGN.md: Monospace typography, 2-tier border radius (`rounded-none` containers/modals, `rounded-sm` buttons/inputs/badges), flat warm cream/ink surfaces, 1px hairlines, zero gradients, zero shadows (`shadow-md/lg/xl/2xl`), zero `animate-ping`/`animate-bounce`.
  * Minimum 44px (`min-h-[44px]`) touch targets for all interactive buttons.
  * Zero viewport intrusion on 3x3 battle board, hand, and game canvas.
  * LocalStorage keys strictly `hero_*`, 100% data persistence preserved.
  * 0 TypeScript errors on `npx tsc --noEmit`.
  * Mandatory Google Form report submission upon completion.
- [2026-11-02T03:41:14Z Milestone 1 Dual Entry Constraints]:
  * Exclusive Write Ownership:
    `index.html`
    `home.html`
    `vite.config.ts`
    `scripts/post-build.js`
    `src/routes.ts`
    `src/landing/index.ts`
    `src/landing/styles/landing.css`
  * DO NOT CHEAT. All implementations must be genuine.
  * `index.html`: ultra-lightweight standalone static landing web service entry point loading `src/landing/index.ts`, 0 heavy runtime dependencies.
  * `home.html`: rich game SPA entry loading `src/main.tsx`.
  * `vite.config.ts`: rollup inputs `{ main: 'index.html', home: 'home.html' }` and dev/preview `/home` rewrite middleware.
  * `scripts/post-build.js`: preserve `dist/index.html` as static landing, generate SPA routes from `dist/home.html`.
  * `src/routes.ts`: `home.path = '/home'`, cleanPath decoupled from `/`.

## Current Parent
- Conversation ID: 7b342c7a-1d74-43d7-a388-5ffc926b3969
- Updated: 2026-11-02T03:41:14Z

## Task Summary
- **What to build**: Milestone 1 Static Architecture & MPA Decoupling:
  1. Create `home.html` — complete SPA entry point
  2. Refactor `index.html` — ultra-light static landing entry
  3. Create `src/landing/index.ts` and `src/landing/styles/landing.css`
  4. Update `vite.config.ts` — MPA inputs `{ main, home }` & dev rewrite
  5. Update `scripts/post-build.js` — preserve `dist/index.html` & generate SPA routes from `dist/home.html`
  6. Update `src/routes.ts` — `home.path = '/home'`, decoupled `/`
  7. Verify build (`npx tsc --noEmit` & `npm run build`)
- **Success criteria**: 0 TS errors, build exits 0, `dist/index.html` and `dist/home.html` exist, `dist/index.html` has no React vendor chunks. (100% ACHIEVED)
- **Interface contracts**: PROJECT.md
- **Code layout**: PROJECT.md § Code Layout

## Key Decisions Made
- Used process.cwd() in vite.config.ts for ESM path resolution.
- Added mpa-dev-rewrite-plugin for transparent dev & preview server /home handling.
- Ensured dist/index.html is untouched by post-build.js and dist/home.html is used as base for all 59 SPA routes and 404.html.

## Artifact Index
- `.agents/teamwork/worker_m1/DISPATCH.md` — Dispatch assignment
- `.agents/teamwork/worker_m1/BRIEFING.md` — Situational awareness
- `.agents/teamwork/worker_m1/progress.md` — Progress tracker
- `.agents/teamwork/worker_m1/handoff.md` — Milestone 1 handoff report

## Change Tracker
- **Files modified**:
  * `index.html` — Replaced React main.tsx/watchdog/Leaflet with landing entry and landing-root
  * `home.html` — Created rich game SPA HTML entry
  * `src/landing/index.ts` — Created static landing bootstrap script
  * `src/landing/styles/landing.css` — Created terminal-flat landing styles
  * `vite.config.ts` — Added rollupOptions.input { main, home } and mpa-dev-rewrite-plugin
  * `scripts/post-build.js` — Preserved dist/index.html, used dist/home.html as SPA base template
  * `src/routes.ts` — Updated home.path to '/home' and cleanPath mapping
- **Build status**: PASS (`npx tsc --noEmit` 0 errors, `npm run build` exit code 0)
- **Pending issues**: None (Milestone 1 complete)

## Quality Status
- **Build/test result**: PASS (0 errors)
- **Lint status**: PASS
- **Tests added/modified**: Verified via bundle asset checks and build pipeline

## Loaded Skills
- None
