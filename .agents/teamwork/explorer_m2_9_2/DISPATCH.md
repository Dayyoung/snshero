# Dispatch: Explorer M2-9-2 (MyDeck Section & Slot Editing Explorer)

## Objective
Investigate `#deck` section (`src/landing/views/MyDeckSection.tsx`, `src/landing/services/cardNurtureStore.ts`, `src/views/DeckView.tsx`) to plan:
1. Interactive deck slot selection (slots 0..4) opening an owned-card selection drawer/modal.
2. Swapping an owned card into the selected slot, updating `hero_deck` in LocalStorage and `cardNurtureStore`.
3. Real-time recalculation of Deck TP (sum of 5 active card TPs) and Total TP (sum of all owned card TPs).
4. Preventing duplicate cards in the active deck.
5. Dual-sync with legacy `DeckView.tsx` / `hero_deck` LocalStorage format.

Read:
- `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md`
- `/Users/dayyoung/project/snshero/PROJECT.md`
- `src/landing/views/MyDeckSection.tsx`
- `src/landing/services/cardNurtureStore.ts`
- `src/views/DeckView.tsx`

Deliver `handoff.md` with: Observation, Logic Chain, Caveats, Conclusion (with exact code diffs), Verification Method.

## 2026-11-02T09:00:37Z
Sender: 21826d14-7bc9-4995-866c-cbb42a941789
Content:
You are explorer_m2_9_2 (MyDeck Section & Slot Editing Explorer).
Your working directory is /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_9_2/.

MANDATORY INSTRUCTIONS:
1. First, read /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md verbatim.
2. Read /Users/dayyoung/project/snshero/PROJECT.md and /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_9_2/DISPATCH.md.
3. Investigate `src/landing/views/MyDeckSection.tsx`, `src/landing/services/cardNurtureStore.ts`, and `src/views/DeckView.tsx`.
4. Formulate an exact, drop-in implementation plan for:
   - Full My Deck editing parity: selecting a deck slot (0..4) opens an interactive card selection drawer/modal showing owned cards (`cardNurtureStore.getOwnedCards()`).
   - Selecting an owned card swaps it into the slot, updating `hero_deck` in LocalStorage and `cardNurtureStore`.
   - Real-time recalculation and display of Deck TP (sum of 5 active card TPs) and Total TP (sum of all owned card TPs).
   - Duplicate prevention in active squad (cannot select a card already in another slot).
   - Dual-sync with legacy `DeckView.tsx` / `hero_deck` LocalStorage format.
5. Write your findings and drop-in code recommendations to `handoff.md` in your working directory.
6. Send a message to the orchestrator when finished.

## 2026-11-02T09:09:26Z
Sender: 21826d14-7bc9-4995-866c-cbb42a941789
Content:
**Context**: Milestone 2 Exploration
**Content**: Status check on MyDeck Section & Slot Editing exploration report.
**Action**: Please deliver your handoff.md report when ready.
