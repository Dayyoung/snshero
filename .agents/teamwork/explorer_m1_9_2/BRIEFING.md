# BRIEFING — 2026-11-02T08:02:00Z

## Mission
Investigate and produce an exact, line-by-line migration specification for Milestone 1: Legacy Route Elimination (`/home`, `/deck`, `/play`, `/main`, `/shop`, `/card`) and Internal Link Migration to hash routes (`#home`, `#deck`, `#play`, `#card`, `#shop`), including redirect logic and exact code replacements across the codebase.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigator, synthesizer
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_9_2
- Original parent: 21826d14-7bc9-4995-866c-cbb42a941789
- Milestone: Milestone 1 (Legacy Route Elimination & Link Migration)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement / do NOT modify source code files
- Output path discipline: Write reports only to `.agents/teamwork/explorer_m1_9_2/`
- Every finding must have complete evidence chain (file path, line number, exact snippet)
- Exact before/after code replacement details required

## Current Parent
- Conversation ID: 21826d14-7bc9-4995-866c-cbb42a941789
- Updated: 2026-11-02T08:02:00Z

## Investigation State
- **Explored paths**:
  - `ORIGINAL_REQUEST.md`, `PROJECT.md`, `explorer_survey_9_1/report.md`
  - `src/landing/components/Header.tsx`, `Sidebar.tsx`, `Footer.tsx`, `Modals.tsx`
  - `src/landing/views/HomeSection.tsx`, `MyDeckSection.tsx`, `PlaySection.tsx`, `CardSection.tsx`, `ShopSection.tsx`
  - `src/landing/index.ts`, `src/routes.ts`, `src/App.tsx`, `src/views/HomeView.tsx`, `src/views/PlayGameView.tsx`, `src/views/KadanRpgView.tsx`
  - `src/components/PageHeader.tsx`, `src/components/reddit/*`, `src/views/ShareView.tsx`, `src/views/ShopView.tsx`
  - `vite.config.ts`, `scripts/post-build.js`, `index.html`, `home.html`
  - E2E tests: `tests/e2e/run_all.ts` (16/16 tests passing)
- **Key findings**:
  - Identified 7 explicit `/home` escape links in `src/landing/` (`Header.tsx:97`, `Sidebar.tsx:140`, `Footer.tsx:50`, `Modals.tsx:161`, `HomeSection.tsx:41`, `MyDeckSection.tsx:131, 398`).
  - Identified card nav label change ('미션' -> '카드') in `Header.tsx:29` and `Sidebar.tsx:31`.
  - Identified `App.tsx` and `routes.ts` reliance on `pathname` and absence of `hashchange` listeners.
  - Designed triple-layer redirect architecture (Layer 1: Vite 302 middleware, Layer 2: static HTML redirect stubs, Layer 3: client `<head>` script).
- **Unexplored areas**: None for M1. All files and line numbers mapped.

## Key Decisions Made
- Replace all 7 `/home` links in `src/landing/` with `href="#play"` (with `data-nav="play"`).
- Update `routes.ts` with `HASH_VIEW_MAP` and hash-priority resolution in `getViewFromPath`.
- Add `hashchange` listeners to `App.tsx` and `src/landing/index.ts` with query string splitting (`.split('?')[0]`).
- Formulated the triple-layer redirect architecture for dev, static hosting, and browser runtime.

## Artifact Index
- `.agents/teamwork/explorer_m1_9_2/DISPATCH.md` — Inbound instructions log
- `.agents/teamwork/explorer_m1_9_2/BRIEFING.md` — Situational awareness
- `.agents/teamwork/explorer_m1_9_2/progress.md` — Heartbeat log
- `.agents/teamwork/explorer_m1_9_2/report.md` — Detailed analysis report
- `.agents/teamwork/explorer_m1_9_2/handoff.md` — 5-component handoff report
