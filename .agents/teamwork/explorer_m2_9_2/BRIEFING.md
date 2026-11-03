# BRIEFING — 2026-11-02T09:10:00Z

## Mission
Investigate MyDeck Section & Slot Editing (`src/landing/views/MyDeckSection.tsx`, `src/landing/services/cardNurtureStore.ts`, and `src/views/DeckView.tsx`) to provide a complete, drop-in implementation plan for slot editing, card replacement drawer, TP recalculation, duplicate prevention, and legacy `hero_deck` dual-sync.

## 🔒 My Identity
- Archetype: explorer
- Roles: read-only investigation, code analysis, drop-in plan formulation
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_9_2
- Original parent: 21826d14-7bc9-4995-866c-cbb42a941789
- Milestone: M2-9-2

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Strictly read-only on project source files
- Deliver findings and code proposal to `handoff.md`
- Report to parent via `send_message`

## Current Parent
- Conversation ID: 21826d14-7bc9-4995-866c-cbb42a941789
- Updated: 2026-11-02T09:09:26Z

## Investigation State
- **Explored paths**:
  - `src/landing/views/MyDeckSection.tsx`
  - `src/landing/services/cardNurtureStore.ts`
  - `src/views/MyDeckView.tsx`
  - `src/landing/types.ts`
  - `src/landing/index.ts`
  - `src/App.tsx`
  - `src/constants.ts`
- **Key findings**:
  - `MyDeckSection.tsx` previously hardcoded `ownedCardIds.slice(0, 5)` with no drawer or swap trigger.
  - `cardNurtureStore.ts` lacked `deckCardIds`, `getDeckCardIds()`, `getOwnedCards()`, `setDeckCard()`, and legacy `hero_deck` sync.
  - Legacy `hero_deck` format uses `CardData[]` with `imageIndex` and season keys (`hero_deck_${season}`).
  - Formulated complete, drop-in code recommendations for `types.ts`, `cardNurtureStore.ts`, `MyDeckSection.tsx`, and `index.ts`.
- **Unexplored areas**: None (exploration scope fully covered).

## Key Decisions Made
- `deckCardIds` tracks 5 distinct slots (0..4).
- Duplicate prevention: cards in other squad slots are disabled in UI and rejected by store.
- Interactive drawer opens on slot click / swap button, styled with DESIGN.md terminal-flat rules and 44px+ touch targets.
- Real-time Deck TP sums 5 active cards, Total TP sums all owned cards.
- Dual-sync writes `hero_deck` in `CardData[]` format and dispatches `snshero_deck_updated`.

## Artifact Index
- `BRIEFING.md` — persistent working memory
- `progress.md` — liveness heartbeat
- `DISPATCH.md` — incoming task logs
- `handoff.md` — final 5-component handoff report with drop-in code blocks
