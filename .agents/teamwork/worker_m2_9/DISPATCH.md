# Dispatch: Worker M2-9 (Home Section Logos & MyDeck Editing Implementation)

## 2026-11-02T09:10:31Z

## Objective
Implement Milestone 2 requirements based on the synthesized Explorer handoffs:
1. `src/landing/services/cardNurtureStore.ts`:
   - Add `deckCardIds: number[] = [1, 2, 3, 4, 5]`
   - Implement `getDeckCardIds(): number[]`
   - Implement `setDeckCard(slotIndex: number, cardId: number): boolean` with deduplication / slot swapping
   - Implement `getOwnedCards(): OwnedCardInfo[]` and `isCardInDeck(cardId: number): boolean`
   - Implement `getWinStreak(): number`
   - Update `getDeckTP()` to compute sum over `this.getDeckCardIds()`
   - Dual-write active deck to `hero_deck` in LocalStorage on save/mutation and dispatch `snshero_deck_updated` event.
   - Dual-format load support in `loadFromStorage()` for number arrays and object arrays.
2. `src/landing/views/HomeSection.tsx`:
   - Prominently display official SNS Hero logo (`/logo-ko.png`) in brand header with `#home` link and `min-h-[44px]`.
   - Implement Cool Card Deck 5-card fan-folded active squad preview (-12deg to +12deg rotations, glowing rarity borders, stats, deck CP, win streak flame badge).
   - Implement click-to-inspect card modal (`data-action="inspect-home-card"`).
   - Preserve 4 media pillars (웹소설, 웹게임, 웹툰, 애니메이션) and 3 serialization links with `[절찬 연재중]` badges and `md:grid-cols-3`.
3. `src/landing/views/MyDeckSection.tsx`:
   - Render 5 active deck slots with `SLOT 01..05`, compass stats (N, E, S, W), unspent point red dot, and `[교체]` button.
   - Implement owned card replacement drawer/modal displaying all owned cards, highlighting active squad cards with `[출격 중]`.
   - Allow swapping cards into slots via `swap-deck-card` action.
   - Display real-time Deck TP and Total TP.
4. `src/landing/index.ts`:
   - Add event delegation handlers for `inspect-home-card`, `close-home-card-inspector`, `open-deck-swap-drawer`, `close-deck-swap-drawer`, and `swap-deck-card`.
   - Support Escape key closing of inspector modal and swap drawer.
5. `tests/adversarial_m2_home_deck.ts`:
   - Create the 6-suite, 28-assertion empirical adversarial test harness from `explorer_m2_9_3/handoff.md`.
6. Downstream SEO generator clean .html generation:
   - Ensure `scripts/generate-video-seo.ts` and `scripts/generate-news-seo.ts` write flat `.html` files alongside directory `index.html`.

## Verification Commands
```bash
npx tsc --noEmit
npm run build
npx tsx tests/adversarial_m2_home_deck.ts
npx tsx tests/adversarial_route_edge_cases.ts
npx tsx tests/adversarial_m1_build_pipeline.ts
npx tsx tests/e2e/run_all.ts --milestone M2
```

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
