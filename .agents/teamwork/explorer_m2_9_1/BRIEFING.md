# BRIEFING — 2026-11-02T09:08:00Z

## Mission
Investigate `#home` section (`src/landing/views/HomeSection.tsx`, `src/landing/index.ts`, `src/landing/components/`, `src/components/LobbyInteractiveCard.tsx`, `src/landing/services/cardNurtureStore.ts`) to produce a drop-in implementation plan for:
1. Prominently displaying the official SNS Hero logo (`/logo-ko.png`) in `#home`.
2. Implementing the Cool Card Deck logo/display (fan-folded 5-card active squad preview with rotational offsets, glowing rarity borders, stats, inspect modal on click, deck CP calculation, and win streak badge).
3. Preserving 4 media pillars (웹소설, 웹툰, 영화, 게임), serialization links with "[절찬 연재중]", and 3-tier character visuals.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_9_1/
- Original parent: 21826d14-7bc9-4995-866c-cbb42a941789
- Milestone: M2 (#home Logos & Deck Preview)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify production files directly
- Write all findings and proposed code in `handoff.md` within working directory
- Monospace font (`font-mono`), terminal-flat aesthetic (`DESIGN.md`), 1px hairline borders
- Comply with responsive layout and mobile ergonomics (min 44px touch targets)

## Current Parent
- Conversation ID: 21826d14-7bc9-4995-866c-cbb42a941789
- Updated: 2026-11-02T09:08:00Z

## Investigation State
- **Explored paths**:
  - `src/landing/views/HomeSection.tsx` (template string layout, media pillars, links, 3-tier assets)
  - `src/landing/index.ts` (DOM event delegation, modals, routing)
  - `src/landing/components/` (Header, Sidebar, Modals, Footer)
  - `src/components/LobbyInteractiveCard.tsx` (fan-folded math, rotational offsets -12deg to +12deg)
  - `src/landing/services/cardNurtureStore.ts` (deck management gaps, getDeckTP formula)
  - `public/logo-ko.png` (physical asset on disk)
  - `tests/e2e/tier1_feature_coverage.ts` (T1.HOME.1~5 assertions)
  - `tests/challenger_m2_adversarial.ts` (responsive & serialization invariant assertions)
- **Key findings**:
  - `HomeSection.tsx` currently lacks `/logo-ko.png` and active squad 5-card fan-folded preview.
  - `cardNurtureStore.ts` needs `getDeckCardIds()`, `setDeckCard(slot, id)`, and `getWinStreak()`.
  - Rotational offsets for 5 cards: `[-12deg, -6deg, 0deg, 6deg, 12deg]` (`(index - 2) * 6`).
  - Card click inspect modal can be driven by `inspectedHomeCardId` state in `HomeSection.tsx` with delegation in `index.ts`.
  - Invariants: `md:py-20`, `lg:flex-row`, `md:grid-cols-3`, `max-w-7xl`, `mx-auto`, and `span:contains("절찬 연재중")` must be preserved.
- **Unexplored areas**: None for M2 scope; all investigation completed.

## Key Decisions Made
- Formulated complete drop-in implementation plan in `handoff.md` covering all 4 target files.

## Artifact Index
- `.agents/teamwork/explorer_m2_9_1/DISPATCH.md` — Incoming task prompt and instructions
- `.agents/teamwork/explorer_m2_9_1/progress.md` — Liveness and progress tracking
- `.agents/teamwork/explorer_m2_9_1/handoff.md` — 5-component report with drop-in code recommendations
