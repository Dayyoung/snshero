# BRIEFING — 2026-11-02T18:00:00Z

## Mission
Investigate `scripts/post-build.js` lines 220-245 regarding nested route static file generation (`dist/[route].html` vs `dist/[route]/index.html`), ensuring all routes (flat & nested) are generated without trailing slash issues, while strictly protecting `dist/home.html` and `dist/index.html`.

## 🔒 My Identity
- Archetype: explorer
- Roles: read-only investigation, code synthesis, drop-in proposal
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_1/
- Original parent: 21826d14-7bc9-4995-866c-cbb42a941789
- Milestone: Milestone 1 Iteration 3

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Strictly read-only on project source code
- Write only to /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_1/
- Protect `dist/home.html` and `dist/index.html` strictly

## Current Parent
- Conversation ID: 21826d14-7bc9-4995-866c-cbb42a941789
- Updated: 2026-11-02T18:00:00Z

## Investigation State
- **Explored paths**:
  - `scripts/post-build.js` (lines 195–325, route loop, legacy redirects, cleanBaseHtml, 404.html)
  - `tests/adversarial_route_edge_cases.ts` (76 assertions, live HTTP probes, asset path audits)
  - `tests/challenger_m1_adversarial.ts` (52 probes, hash routing vs pre-hash expectations)
  - `tests/adversarial_m1_build_pipeline.ts` (64 assertions, DOM isolation, bundle footprints)
  - `vite.config.ts` (mpa-dev-rewrite-plugin, isSpaRoute, configurePreviewServer)
  - `src/routes.ts` (VIEW_ROUTES, hash paths `#home`, `#deck`, etc.)
  - `.agents/teamwork/orchestrator_9/GATE_STATUS.md`
  - `.agents/teamwork/challenger_m1_it2_2/handoff.md`
  - `.agents/teamwork/challenger_m1_it2_1/handoff.md`
- **Key findings**:
  1. In Iteration 1, `post-build.js` guarded flat HTML creation with `if (!route.includes('/'))`, which skipped generating `.html` files for all nested routes (`wiki/card`, `r/hanguk`, etc.).
  2. Static file servers receiving requests without trailing slashes (e.g. `/wiki/card`) could not find `dist/wiki/card.html` and fell back to `dist/index.html` (the static landing page `#landing-root`).
  3. Worker M1-it2 in commit `bfefd8c41` removed `if (!route.includes('/'))` and added flat file generation with directory creation for all routes, along with template protection guards.
  4. Live curl probe `curl -s http://localhost:3000/wiki/card | grep -o 'id="[^"]*"'` now correctly returns `id="root"`.
  5. Route normalization (`cleanRoute = route.replace(/^\/+/, '').replace(/\/+$/, '')`) and explicit multi-tier protection (`cleanRoute === 'home'`, `cleanRoute === 'index'`, absolute & relative path checks) provide foolproof defense.
  6. Normalizing `dist/home.html` and `dist/404.html` with `cleanBaseHtml` resolves relative asset path failures (`./assets/` vs `/assets/`).
- **Unexplored areas**: None. Root cause, mechanics, and exact drop-in code fully synthesized.

## Key Decisions Made
- Formulated the exact, clean drop-in replacement code for `scripts/post-build.js` lines 199–325.
- Documented edge cases: clean URL resolution, directory index vs flat file, multi-layer template protection for `home.html` and `index.html`, and asset path absolute normalization.

## Artifact Index
- DISPATCH.md — incoming instructions
- BRIEFING.md — persistent situational memory
- progress.md — liveness heartbeat
- report.md — comprehensive investigation report
- handoff.md — self-contained handoff
