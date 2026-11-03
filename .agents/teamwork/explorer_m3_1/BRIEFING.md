# BRIEFING — 2026-11-02T05:58:00Z

## Mission
Investigate and design complete specifications and code for Milestone 3: HomeSection.tsx and MyDeckSection.tsx.

## 🔒 My Identity
- Archetype: explorer
- Roles: explorer, analyst
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_1
- Original parent: 7b342c7a-1d74-43d7-a388-5ffc926b3969
- Milestone: Milestone 3

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Design complete specifications and code for HomeSection.tsx and MyDeckSection.tsx
- Conformance to DESIGN.md OpenCode Terminal-Flat design system (font-mono, rounded-none containers, rounded-sm buttons, 1px hairlines)
- Adherence to TEST_INFRA.md contracts and PROJECT.md requirements
- Files for content delivery, Messages for coordination

## Current Parent
- Conversation ID: 7b342c7a-1d74-43d7-a388-5ffc926b3969
- Updated: 2026-11-02T05:58:00Z

## Investigation State
- **Explored paths**:
  - `src/landing/views/HomeSection.tsx`
  - `src/landing/index.ts`
  - `src/landing/types.ts`
  - `src/landing/services/assetCatalog.ts`
  - `src/cardDatabase.ts`
  - `tests/e2e/tier1_feature_coverage.ts` (T1.HOME.1~5, T1.DECK.1~5)
  - `tests/e2e/helpers.ts` (ReferenceNurtureStore, MockLocalStorage)
  - `tests/e2e/tier2_boundary_corner.ts`, `tier3_cross_feature.ts`, `tier4_realworld_workload.ts`
- **Key findings**:
  1. `HomeSection.tsx` exists (13.7 KB) but currently has only 3 media pillars (novel, game, anime); the 4th pillar (webtoon) is missing from the pillars grid. External links are present, but badges should explicitly display `[절찬 연재중]`.
  2. `MyDeckSection.tsx` does NOT exist yet. This causes `T1.DECK.1`, `T1.DECK.4`, `T1.DECK.5` to fail.
  3. Base starter cards are IDs 1, 2, 3, 4, 5. Their base powers are 11, 12, 17, 18, 22. Sum = 80 (matches Deck TP and Total TP oracle).
  4. LocalStorage key is `'hero_card_nurturing'`. MyDeckSection must read active deck cards and bonus stats from localStorage with clean fallback to defaults.
  5. Minimalist requirement: No `BattleHUD`, no `Joystick`.
  6. Interaction requirement: Must contain `'onClick'`, `'selected'`, `'card'` for card slot inspection.
- **Unexplored areas**: None for M3 HomeSection & MyDeckSection scope.

## Key Decisions Made
- Designed complete replacement code for `HomeSection.tsx` expanding media pillars to 4 (웹소설, 웹게임, 웹툰, 애니메이션) in a 4-column responsive grid and ensuring `[절찬 연재중]` badges.
- Designed complete production-ready code for `MyDeckSection.tsx` adhering to pure TypeScript template string architecture (zero React runtime), dynamic TP calculation, 3-tier visual asset rendering, 5 active deck slots, and interactive card inspection modal/drawer.
- Detailed step-by-step integration instructions for `src/landing/index.ts`.

## Artifact Index
- DISPATCH.md — Parent assignment and mission context
- BRIEFING.md — Persistent working memory
- progress.md — Liveness heartbeat
- handoff.md — Complete 5-component handoff report
