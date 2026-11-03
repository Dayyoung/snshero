# BRIEFING — 2026-11-02T03:33:00Z

## Mission
Investigate R1 (Static Architecture, Routing, Decoupling) and R5 (Static Build & Automated Verification) for SNSHero.com.
Propose how to implement a standalone pure static landing page for `/` and `/index.html` with zero external server runtime dependency, route the existing app to `/home`, design clear file/build separation, and establish an automated verification harness.

## 🔒 My Identity
- Archetype: explorer (Specification Miner)
- Roles: Spec Miner, Survey Explorer
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1
- Original parent: f84aca46-e09f-4967-b5d1-281f855a924e
- Milestone: Full-Screen Terminal-Flat Visual Unification & Ergonomics Overhaul
- Roles: Explorer (Architecture & Routing Specialist) [Added 2026-11-02]
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/ [Preserved]
- Original parent: 7b342c7a-1d74-43d7-a388-5ffc926b3969 [Added 2026-11-02]
- Milestone: Standalone Static Landing Page & /home Decoupling (R1 & R5) [Added 2026-11-02]

## 🔒 Key Constraints
- Read-only on production source code (do not implement changes, only survey/mine specifications)
- Comprehensive coverage of all 110 hero cards across 11 factions (no skipping)
- Adhere to DESIGN.md and AGENTS.md guidelines
- Write handoff.md with 5 required sections (Observation, Logic Chain, Caveats, Conclusion, Verification Method)
- Communicate with parent agent via send_message
- Read-only investigation: analyze problems, synthesize findings, produce structured reports [Added 2026-11-02]
- Zero server runtime dependency for the standalone static landing page [Added 2026-11-02]
- Zero regression on existing SPA app features when relocated to /home [Added 2026-11-02]

## Current Parent
- Conversation ID: 7b342c7a-1d74-43d7-a388-5ffc926b3969
- Updated: 2026-11-02T03:22:00Z

## Task Summary
- Target areas:
  1. `vite.config.ts`, `package.json`, project build scripts
  2. `index.html`, `src/main.tsx`, `src/App.tsx`, and client routing mechanism
  3. Static landing page architecture (pure static HTML/CSS/JS/images vs Vite multi-page app vs standalone sub-build)
  4. Decoupling plan for `/` (static landing) vs `/home` (existing rich game application)
  5. Automated verification harness (build integrity, headless browser rendering, interaction, localStorage persistence test)
- Deliverables:
  - `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/survey_report.md` [COMPLETED]
  - `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/handoff.md` [COMPLETED]
  - Notification to parent agent via `send_message` [NOW EXECUTING]

## Investigation State
- **Explored paths**: `index.html`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/routes.ts`, `scripts/post-build.js`, `scripts/watch-build.js`, `scripts/start-server.sh`, character assets in `public/anime-character-sheets/cutouts/`, `public/seat/`, `public/cards1.png`, and webtoon assets in `public/images/webtoon/episode_01/`.
- **Key findings**:
  - Confirmed Vite MPA dual-entry (`rollupOptions.input: { main: 'index.html', home: 'home.html' }`) is the optimal architecture with zero external server runtime dependency for `/` and seamless `/home` routing for the SPA.
  - Designed the complete `src/landing/` directory structure and state machines (110 cards, 1~100 level-up, EXP, stat points, red dot indicator, 100% localStorage persistence, Play section webtoon viewer + TTS, Shop 8 items, Top 6 / Side 8 menus, 0% popups).
  - Confirmed Python Playwright Chromium operates out-of-the-box for headless E2E verification.
- **Unexplored areas**: None within R1 & R5 scope.

## Key Decisions Made
- Confirmed Vite MPA architecture with `home.html` entry point for the SPA and `index.html` for the standalone static landing page.
- Designed dual verification harness: `scripts/verify-static-build.ts` (static integrity) and `scripts/test-static-landing-e2e.py` (Playwright browser E2E).

## Artifact Index
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/DISPATCH.md` — Incoming dispatch log
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/BRIEFING.md` — Agent memory
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/progress.md` — Heartbeat tracker
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/survey_report.md` — Deep technical survey report (Complete)
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/handoff.md` — 5-component handoff report (Complete)
