# BRIEFING — 2026-11-02T11:53:00Z

## Mission
Implement Milestone 4: `#card` Character Nurturing Strictly Restricted to Owned Characters, Elimination of Free EXP Cheat Buttons, Battle Victory EXP Hook (+50 EXP to active deck cards on battle victory), and Repeat Hunting (`[🔁 반복 사냥]`) Auto-Loop.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m4_9
- Original parent: 21826d14-7bc9-4995-866c-cbb42a941789
- Milestone: Milestone 4

## 🔒 Key Constraints
- Never run `git push`. Only local commits (`git commit`) are permitted.
- Adhere 100% to OpenCode.ai terminal flat design: font-mono, 0px/4px border radius, single flat surfaces, >=44px touch targets.
- LocalStorage only (`hero_xxx`).
- Mandatory Integrity: No cheats, genuine implementations, maintain real state.

## Current Parent
- Conversation ID: 21826d14-7bc9-4995-866c-cbb42a941789
- Updated: 2026-11-02T11:40:00Z

## Task Summary
- **What to build**: Milestone 4 owned-only character nurturing, removal of free EXP buttons, battle EXP award hook, repeat hunting auto-loop.
- **Success criteria**: All 44 assertions in adversarial_m4_card_nurturing.ts pass, all 76 E2E assertions pass, M1-M3 regressions pass, tsc --noEmit passes, npm run build passes with bundle size < 50 KB, Google Form report submitted.
- **Interface contracts**: PROJECT.md & explorer handoffs.
- **Code layout**: src/landing/services/cardNurtureStore.ts, src/landing/views/CardSection.tsx, src/landing/index.ts, src/landing/services/playRpgEngine.ts, src/views/MobileCardPlayScreen.tsx, tests/adversarial_m4_card_nurturing.ts.

## Key Decisions Made
- Added strict bounds and `isCardOwned(cardId)` verification to `nurtureCard`, `allocateStat`, and `hasUnspentPoints` in `cardNurtureStore.ts`.
- Implemented first-class native `awardBattleVictoryExp(expGain: number = 50)` on `CardNurtureStore` class.
- Synchronized repeat hunting toggle state using `hero_repeat_hunting` across `cardNurtureStore.ts`, `playRpgEngine.ts`, and `MobileCardPlayScreen.tsx`.
- Completely excised cheat buttons (`+50 EXP`, `+500 EXP`, `data-action="nurture-card"`) and substituted with terminal-flat battle victory guide banner.
- Sanitized `ownedCardIds` in `loadFromStorage()` using `Number.isInteger(id)`.
- Dual-written card additions to `hero_inventory` on `addCard(cardId)`.

## Artifact Index
- `src/landing/services/cardNurtureStore.ts` — Store validation, victory hook, repeat hunting
- `src/landing/views/CardSection.tsx` — Nurturing UI gated on ownership, removal of cheat buttons
- `src/landing/index.ts` — Event delegation protection against cheat injection
- `src/landing/services/playRpgEngine.ts` — Battle victory hook & repeat hunting auto-rematch
- `src/views/MobileCardPlayScreen.tsx` — Victory EXP hook & repeat hunting toggle button
- `src/landing/types.ts` — NurtureState interface expansion
- `tests/adversarial_m4_card_nurturing.ts` — 44-assertion adversarial test harness

## Change Tracker
- **Files modified**:
  - `src/landing/services/cardNurtureStore.ts`: Added ownership guards, bounds checking, integer validation, `awardBattleVictoryExp`, `repeatHunting` methods, and inventory dual-write.
  - `src/landing/views/CardSection.tsx`: Ownership-gated UI, removed cheat buttons, added battle victory notice, locked notice for unowned cards, disabled stat buttons for unowned cards.
  - `src/landing/index.ts`: Neutralized `nurture-card` action, added ownership guard on `allocate-stat`.
  - `src/landing/services/playRpgEngine.ts`: Auto-rematch on repeat hunting, native store call.
  - `src/views/MobileCardPlayScreen.tsx`: Integrated repeat hunting state, auto-rematch hook, result toggle button, and battle victory EXP hook.
  - `src/landing/types.ts`: Added optional M4 methods to `NurtureState`.
- **Build status**: PASS (`tsc --noEmit` 0 errors, `npm run build` code 0, bundle < 50 KB).
- **Pending issues**: None.

## Quality Status
- **Build/test result**: PASS (44/44 adversarial assertions, 76/76 E2E assertions, 64/64 M1 pipeline, 18/18 M2 challenger, 28/28 M3 adversarial, 21/21 M3 stress).
- **Lint status**: 0 TypeScript errors.
- **Tests added/modified**: `tests/adversarial_m4_card_nurturing.ts` (44 new assertions).

## Loaded Skills
- none required
