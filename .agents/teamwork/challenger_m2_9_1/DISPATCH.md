# DISPATCH — challenger_m2_9_1

## Objective
Empirically challenge Milestone 2 implementation with adversarial edge-case testing, verifying card swapping invariants, LocalStorage corrupted data recovery, and DOM element contracts.

## Relevant Documents
- ORIGINAL_REQUEST.md: `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (MUST READ VERBATIM)
- PROJECT.md: `/Users/dayyoung/project/snshero/PROJECT.md`
- Worker Handoff: `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m2_9/handoff.md`

## Challenge Tasks
1. Execute and verify `tests/adversarial_m2_home_deck.ts` (all 28 assertions).
2. Execute and verify `tests/challenger_m2_adversarial.ts` (all 30 assertions).
3. Test squad deduplication invariants:
   - What happens if slot card is replaced with a card already in another slot? (Must swap slots, `Set(activeDeckIds).size === 5`).
   - What happens if an unowned card ID is attempted to be put into a slot? (Must be rejected).
   - What happens if `hero_deck` in localStorage contains invalid JSON, strings, or numbers outside range?
4. Test DOM elements:
   - Logo: `/logo-ko.png` inside `a[href="#home"]`
   - Fan deck cards: rotations from -12deg to +12deg across 5 cards, rarity glowing borders
   - MyDeck: 5 active slots with `SLOT 01..05`, compass stats (N, E, S, W), unspent point red dot, `[영웅 교체]` buttons
   - Deck TP sum matches active squad cards
5. Run full test suites:
   - `npx tsx tests/adversarial_m2_home_deck.ts`
   - `npx tsx tests/challenger_m2_adversarial.ts`
   - `npx tsx tests/e2e/run_all.ts --milestone M2`
   - `npx tsx tests/adversarial_route_edge_cases.ts`
   - `npx tsx tests/adversarial_m1_build_pipeline.ts`

## Deliverables
Write your challenge report to `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m2_9_1/handoff.md` with:
- Verdict: **APPROVE** or **REQUEST_CHANGES**
- Empirical stress results
Send completion message to orchestrator with verdict.

## 2026-11-02T09:36:23Z
You are Challenger 1 for Milestone 2 (#home Logos & #deck Editing Parity).
Your working directory is `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m2_9_1/`.
Your dispatch instructions are at `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m2_9_1/DISPATCH.md`.

MANDATORY FIRST STEP: Read `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` verbatim before starting any work.
Also read `/Users/dayyoung/project/snshero/PROJECT.md` and `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m2_9/handoff.md`.

Empirically challenge Milestone 2 implementation:
- Execute and stress `tests/adversarial_m2_home_deck.ts` and `tests/challenger_m2_adversarial.ts`
- Challenge slot card replacement edge cases: swapping cards in active squad, unowned card swap rejection, duplicate card prevention (`Set(activeDeckIds).size === 5`), corrupted LocalStorage recovery.
- Validate DOM contracts: `/logo-ko.png` inside `a[href="#home"]`, fan deck rotations (-12deg to +12deg), rarity glowing borders, compass stats, unspent point red dot, `[영웅 교체]` buttons, real-time Deck TP.

Run builds and tests:
- `npx tsx tests/adversarial_m2_home_deck.ts`
- `npx tsx tests/challenger_m2_adversarial.ts`
- `npx tsx tests/e2e/run_all.ts --milestone M2`
- `npx tsx tests/adversarial_route_edge_cases.ts`
- `npx tsx tests/adversarial_m1_build_pipeline.ts`

Write your complete challenge report to `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m2_9_1/handoff.md` with explicit verdict: **APPROVE** or **REQUEST_CHANGES**.
Then send a completion message to the caller with your verdict.
