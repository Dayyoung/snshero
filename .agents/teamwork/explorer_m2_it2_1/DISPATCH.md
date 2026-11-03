# DISPATCH — explorer_m2_it2_1

## Objective
Investigate DOM backdrop structure and click dismissal architecture in `src/landing/views/HomeSection.tsx` and `src/landing/views/MyDeckSection.tsx`.

## Context & Gate Failure
Milestone 2 Iteration 1 Gate failed on `challenger_m2_9_2`'s `tests/adversarial_m2_user_interaction.ts`:
1. `[CH2.HOME.BACKDROP_CLICK]`: Clicking `#home-card-inspect-modal` outer backdrop fails to dismiss the home card inspect modal.
2. `[CH2.DECK.BACKDROP_CLICK]`: Clicking `#deck-swap-drawer-backdrop` outer backdrop fails to dismiss the deck swap drawer.

Challenger 2 handoff report: `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m2_9_2/handoff.md`.

## Required Analysis
1. Compare modal and drawer structures against `Sidebar.tsx` (which has a dedicated backdrop element `<div id="sidebar-backdrop" data-action="close-sidebar" ...>`).
2. Propose exact HTML modifications for `HomeSection.tsx` (`#home-card-inspect-modal`) and `MyDeckSection.tsx` (`#deck-swap-drawer-backdrop`) to provide dedicated backdrop elements with `data-action="close-home-card-inspector"` and `data-action="close-deck-swap-drawer"`, while ensuring inner content clicks never inadvertently dismiss the overlay.
3. Verify accessibility attributes (`role="dialog"`, `aria-modal="true"`).

## Deliverables
Write structured analysis to `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_it2_1/handoff.md`.
Send completion message when done.


## 2026-11-02T09:47:33Z
You are Explorer 1 for Milestone 2 Iteration 2 (#home & #deck Backdrop Click Dismissal).
Your working directory is `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_it2_1/`.
Your dispatch instructions are at `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_it2_1/DISPATCH.md`.

MANDATORY FIRST STEP: Read `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` verbatim before starting work.
Also read `/Users/dayyoung/project/snshero/PROJECT.md` and `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_m2_9_2/handoff.md`.

Investigate the DOM structure in `src/landing/views/HomeSection.tsx` and `src/landing/views/MyDeckSection.tsx`.
Determine the cleanest and most robust way to add backdrop click dismissal for `#home-card-inspect-modal` and `#deck-swap-drawer-backdrop` without causing accidental dismissals from inner dialog content clicks.

Do NOT implement any changes yourself. Provide a structured analysis and drop-in recommendation in your report at `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_it2_1/handoff.md`.
Send a completion message to the caller when finished.
