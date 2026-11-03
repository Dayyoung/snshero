# DISPATCH — worker_m2_it2

## Objective
Implement Milestone 2 Iteration 2 remediation: add dedicated sibling backdrop overlays and dual-defense click handling to enable backdrop click dismissal for `#home-card-inspect-modal` and `#deck-swap-drawer-backdrop` while strictly preserving inner content clicks.

## Relevant Documents
- ORIGINAL_REQUEST.md: `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (MUST READ VERBATIM)
- PROJECT.md: `/Users/dayyoung/project/snshero/PROJECT.md`
- Gate Failure Report: `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m2_9_2/handoff.md`
- Explorer 1 Report (DOM Structure): `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_it2_1/handoff.md`
- Explorer 2 Report (Event Delegation): `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_it2_2/handoff.md`
- Explorer 3 Report (Verification Blueprint): `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_it2_3/handoff.md`

## Exclusive File Ownership
You have exclusive write access to:
1. `src/landing/views/HomeSection.tsx`
2. `src/landing/views/MyDeckSection.tsx`
3. `src/landing/index.ts`

## Implementation Tasks (Dual-Defense Architecture)
1. In `src/landing/views/HomeSection.tsx`:
   - Under `#home-card-inspect-modal`, add the dedicated sibling backdrop element:
     ```html
     <!-- Dedicated Backdrop Overlay Sibling -->
     <div
       id="home-card-inspect-backdrop"
       data-action="close-home-card-inspector"
       class="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer transition-opacity"
       aria-hidden="true"
     ></div>
     ```
   - Ensure the inner dialog card box has `relative z-10`.
   - Remove `bg-black/60 backdrop-blur-xs` from the outer `#home-card-inspect-modal` flex wrapper.
   - Retain `id="home-card-inspect-modal"` on the outer wrapper.
2. In `src/landing/views/MyDeckSection.tsx`:
   - Under `#deck-swap-drawer-backdrop`, add the dedicated sibling backdrop element:
     ```html
     <!-- Dedicated Drawer Backdrop Sibling -->
     <div
       id="deck-swap-backdrop"
       data-action="close-deck-swap-drawer"
       class="fixed inset-0 bg-black/60 cursor-pointer transition-opacity"
       aria-hidden="true"
     ></div>
     ```
   - Ensure the inner dialog content panel has `relative z-10`.
   - Remove `bg-black/60` from the outer `#deck-swap-drawer-backdrop` flex wrapper.
   - Retain `id="deck-swap-drawer-backdrop"` on the outer wrapper.
3. In `src/landing/index.ts`:
   - At the beginning of `handleEventDelegation(event: Event)`, add direct ID fallback checks:
     ```typescript
     const rawTarget = event.target as HTMLElement | null;
     if (!rawTarget) return;

     if (rawTarget.id === 'home-card-inspect-modal' || rawTarget.id === 'home-card-inspect-backdrop') {
       setInspectedHomeCardId(null);
       renderApp();
       return;
     }
     if (rawTarget.id === 'deck-swap-drawer-backdrop' || rawTarget.id === 'deck-swap-backdrop') {
       setEditingSlotIndex(null);
       renderApp();
       return;
     }
     if (rawTarget.id === 'landing-modal-overlay') {
       state.activeModal = null;
       renderApp();
       return;
     }
     ```

## Verification Checklist
Execute all commands and ensure 100% pass:
1. `npx tsx tests/adversarial_m2_user_interaction.ts` (Must pass 18/18, 100%)
2. `npx tsx tests/adversarial_m2_home_deck.ts` (Must pass 28/28, 100%)
3. `npx tsx tests/challenger_m2_adversarial.ts` (Must pass 30/30, 100%)
4. `npx tsx tests/challenger_m2_deep_stress.ts` (Must pass 29/29, 100%)
5. `npx tsx tests/e2e/run_all.ts --milestone M2` (Must pass 11/11, 100%)
6. `npx tsx tests/adversarial_route_edge_cases.ts` (Must pass 76/76, 100%)
7. `npx tsx tests/adversarial_m1_build_pipeline.ts` (Must pass 64/64, 100%)
8. `npx tsc --noEmit` (0 errors)
9. `npm run build` (Exit code 0)

## Mandatory Constraints
- DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
- Perform a local git commit (`git commit -m "..."`).
- NEVER execute `git push`.
- Submit completion report via Google Form (`skills/report-ex/scripts/submit_report.py`).
- Write full handoff report to `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m2_it2/handoff.md`.


## 2026-11-02T09:57:17Z
You are the Worker for Milestone 2 Iteration 2 (Remediation of Backdrop Click Dismissal).
Your working directory is `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m2_it2/`.
Your dispatch instructions are at `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m2_it2/DISPATCH.md`.

MANDATORY FIRST STEP: Read `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` verbatim before starting work.
Also read `/Users/dayyoung/project/snshero/PROJECT.md` and the 3 Explorer handoffs:
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_it2_1/handoff.md`
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_it2_2/handoff.md`
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_it2_3/handoff.md`
And the gate failure report:
- `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m2_9_2/handoff.md`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implement the Dual-Defense Sibling Backdrop Architecture across:
1. `src/landing/views/HomeSection.tsx`
2. `src/landing/views/MyDeckSection.tsx`
3. `src/landing/index.ts`

Verify all 9 test suites and build commands:
- `npx tsx tests/adversarial_m2_user_interaction.ts` (18/18 PASS)
- `npx tsx tests/adversarial_m2_home_deck.ts` (28/28 PASS)
- `npx tsx tests/challenger_m2_adversarial.ts` (30/30 PASS)
- `npx tsx tests/challenger_m2_deep_stress.ts` (29/29 PASS)
- `npx tsx tests/e2e/run_all.ts --milestone M2` (11/11 PASS)
- `npx tsx tests/adversarial_route_edge_cases.ts` (76/76 PASS)
- `npx tsx tests/adversarial_m1_build_pipeline.ts` (64/64 PASS)
- `npx tsc --noEmit`
- `npm run build`

Commit locally: `git commit -m "fix(m2): backdrop click dismissal for modal and drawer overlays"`.
NEVER run `git push`.
Submit Google Form report via `python3 skills/report-ex/scripts/submit_report.py`.
Write full handoff report to `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m2_it2/handoff.md`.
Send a completion message to the caller when finished.
