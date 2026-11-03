# BRIEFING — 2026-11-02T09:12:00Z

## Mission
Implement Milestone 2: Home Section official logos (/logo-ko.png), 5-card fan-folded active squad preview, MyDeck slot editing parity, LocalStorage hero_deck dual-sync, real-time Deck TP, and adversarial test harness.

## 🔒 My Identity
- Archetype: Worker
- Roles: implementer, qa, specialist
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m2_9/
- Original parent: 21826d14-7bc9-4995-866c-cbb42a941789
- Milestone: M2

## 🔒 Key Constraints
- OpenCode Terminal-Flat design system strictly enforced (font-mono, 0px containers, 4px buttons, 1px hairlines, 44px+ touch targets).
- Zero instances of prohibited classes (bg-gradient-to-, rounded-xl/2xl/3xl, animate-ping, animate-bounce).
- LocalStorage persistence (hero_deck, hero_card_nurturing) with dual-format load support and corruption recovery.
- Never git push! Only local git commit.
- Mandatory Google Form report submission upon completion.
- Integrity: no cheating, genuine implementation only.

## Current Parent
- Conversation ID: 21826d14-7bc9-4995-866c-cbb42a941789
- Updated: 2026-11-02T09:12:00Z

## Task Summary
- **What to build**:
  - `src/landing/services/cardNurtureStore.ts`: activeDeckIds, getDeckCardIds(), setDeckCard(slotIndex, cardId) with duplicate prevention, getOwnedCards(), isCardInDeck(), getWinStreak(), getDeckTP(), dual-sync to hero_deck.
  - `src/landing/views/HomeSection.tsx`: /logo-ko.png display, 5-card fan-folded preview (-12deg to +12deg), deck CP, win streak flame badge, card inspection modal, preserve 4 media pillars & 3 serializations.
  - `src/landing/views/MyDeckSection.tsx`: 5 active deck slots, N/E/S/W compass stats, unspent point red dot, [영웅 교체] button, card replacement drawer with duplicate guard, real-time Deck TP & Total TP.
  - `src/landing/index.ts`: Event delegation for inspection and slot drawer/swapping.
  - `src/landing/styles/landing.css`: Rarity glow and fan transform styles.
  - `tests/adversarial_m2_home_deck.ts`: 6 suites, 28 assertions.
  - `scripts/generate-video-seo.ts` & `scripts/generate-news-seo.ts`: Ensure flat .html clean URLs.
- **Success criteria**: All tests pass, build passes, 0 lint/tsc errors, git commit, Google Form submitted.
- **Interface contracts**: PROJECT.md § Interface Contracts
- **Code layout**: PROJECT.md § Code Layout

## Change Tracker
- **Files modified**:
  - `src/landing/views/HomeSection.tsx`: /logo-ko.png display, 5-card fan deck preview, inspection modal.
  - `src/landing/views/MyDeckSection.tsx`: 5 active slots, compass stats, unspent dot, card swap drawer.
  - `src/landing/services/cardNurtureStore.ts`: activeDeckIds, setDeckCard, getDeckTP, hero_deck sync, dual-format.
  - `src/landing/index.ts`: Action handlers for inspection and deck swap.
  - `src/landing/styles/landing.css`: Rarity glow and fan transforms.
  - `scripts/generate-video-seo.ts` & `scripts/generate-news-seo.ts`: Clean flat .html files.
  - `scripts/post-build.js`: Absolute asset paths written to dist/home.html and dist/404.html.
  - `tests/adversarial_m2_home_deck.ts`: 6 suites, 28 assertions.
- **Build status**: PASS (tsc: 0 errors, build: exit code 0).
- **Pending issues**: None.

## Quality Status
- **Build/test result**: PASS (209/209 assertions pass 100%).
  - tests/adversarial_m2_home_deck.ts: 28/28 PASS
  - tests/challenger_m2_adversarial.ts: 30/30 PASS
  - tests/e2e/run_all.ts --milestone M2: 11/11 PASS
  - tests/adversarial_route_edge_cases.ts: 76/76 PASS
  - tests/adversarial_m1_build_pipeline.ts: 64/64 PASS
- **Lint status**: PASS (0 errors).
- **Tests added/modified**: tests/adversarial_m2_home_deck.ts, tests/challenger_m2_adversarial.ts, tests/adversarial_route_edge_cases.ts, tests/adversarial_m1_build_pipeline.ts.

## Loaded Skills
- None in dispatch.
