# DISPATCH — reviewer_m2_9_1

## Objective
Review Milestone 2 implementation for correctness, completeness, robustness, interface conformance, and regressions.

## Relevant Documents
- ORIGINAL_REQUEST.md: `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (MUST READ VERBATIM)
- PROJECT.md: `/Users/dayyoung/project/snshero/PROJECT.md`
- Worker Handoff: `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m2_9/handoff.md`
- TEST_READY.md: `/Users/dayyoung/project/snshero/TEST_READY.md`

## Milestone 2 Review Focus
1. Home Section (`src/landing/views/HomeSection.tsx`):
   - Official SNS Hero logo `/logo-ko.png` rendered with `min-h-[44px]` and anchor to `#home`
   - Cool Card Deck 5-card fan-folded interactive squad preview (-12deg to +12deg) with glowing rarity borders (`.rarity-glow-bronze/silver/gold/boss`), name, stats, Total Deck CP, win streak flame badge, and link to `#deck`
   - Click-to-inspect card popup modal with 7-head character cutout, stats, ability, and close button
   - Preservation of 4 media pillars (웹소설, 웹게임, 웹툰, 애니메이션) and 3 serialization links (Naver Web Novel, Naver Webtoon, Munpia) with `[절찬 연재중]` badges
2. MyDeck Section (`src/landing/views/MyDeckSection.tsx`):
   - 5 active deck slots (SLOT 01..05) with compass stats (N, E, S, W)
   - Unspent point red dot indicator (`+pt`)
   - `[영웅 교체]` button triggering owned card replacement drawer
   - Owned card replacement drawer listing owned cards, disabling cards already in squad, and card swap functionality
   - Invariant: `Set(activeDeckIds).size === 5` (no duplicates in squad)
   - Real-time Deck TP (sum of 5 active card powers) and Total TP display
3. Store & LocalStorage Sync (`src/landing/services/cardNurtureStore.ts`):
   - LocalStorage key `hero_deck` synchronized on deck change
   - Dual-format load support (array of IDs or array of legacy Card objects)
   - Non-browser environment guard for Node.js test runners (`typeof window !== 'undefined'`)
4. Verification & Testing:
   - Run `npx tsc --noEmit`
   - Run `npm run build`
   - Run `npx tsx tests/adversarial_m2_home_deck.ts`
   - Run `npx tsx tests/challenger_m2_adversarial.ts`
   - Run `npx tsx tests/e2e/run_all.ts --milestone M2`
   - Run `npx tsx tests/adversarial_route_edge_cases.ts`
   - Run `npx tsx tests/adversarial_m1_build_pipeline.ts`

## Deliverables
Write your review report to `/Users/dayyoung/project/snshero/.agents/teamwork/reviewer_m2_9_1/handoff.md` with:
- Verdict: **APPROVE** or **REQUEST_CHANGES**
- Detailed verification commands and outputs
- Analysis of findings
Send completion message to orchestrator with verdict.

## 2026-11-02T09:35:59Z
You are Reviewer 1 for Milestone 2 (#home Logos & #deck Editing Parity).
Your working directory is `/Users/dayyoung/project/snshero/.agents/teamwork/reviewer_m2_9_1/`.
Your dispatch instructions are at `/Users/dayyoung/project/snshero/.agents/teamwork/reviewer_m2_9_1/DISPATCH.md`.

MANDATORY FIRST STEP: Read `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` verbatim before starting any work.
Also read `/Users/dayyoung/project/snshero/PROJECT.md` and `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m2_9/handoff.md`.

Perform comprehensive code and behavioral review of Home logo (/logo-ko.png), 5-card fan deck interactive preview (-12deg to +12deg), card inspect modal, 4 media pillars, 3 serialization links with [절찬 연재중] badges, MyDeck 5 active slots (SLOT 01..05) with compass stats, unspent point red dot, slot card replacement drawer, slot swapping deduplication, real-time Deck TP, and LocalStorage `hero_deck` dual-sync.

Run builds and tests:
- `npx tsc --noEmit`
- `npm run build`
- `npx tsx tests/adversarial_m2_home_deck.ts`
- `npx tsx tests/challenger_m2_adversarial.ts`
- `npx tsx tests/e2e/run_all.ts --milestone M2`
- `npx tsx tests/adversarial_route_edge_cases.ts`
- `npx tsx tests/adversarial_m1_build_pipeline.ts`

Write your complete review report to `/Users/dayyoung/project/snshero/.agents/teamwork/reviewer_m2_9_1/handoff.md` with explicit verdict: **APPROVE** or **REQUEST_CHANGES**.
Then send a completion message to the caller with your verdict.
