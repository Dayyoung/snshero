# BRIEFING — 2026-11-02T09:56:30Z

## Mission
Investigate DOM backdrop structure and click dismissal architecture in `src/landing/views/HomeSection.tsx` and `src/landing/views/MyDeckSection.tsx` for Milestone 2 Iteration 2.

## 🔒 My Identity
- Archetype: Explorer
- Roles: Read-only investigator, DOM architecture analyst, synthesis reporter
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_it2_1
- Original parent: 21826d14-7bc9-4995-866c-cbb42a941789
- Milestone: Milestone 2 Iteration 2 (#home & #deck Backdrop Click Dismissal)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Investigate DOM structure in `src/landing/views/HomeSection.tsx` and `src/landing/views/MyDeckSection.tsx`
- Determine cleanest and most robust way to add backdrop click dismissal for `#home-card-inspect-modal` and `#deck-swap-drawer-backdrop` without accidental dismissals from inner clicks
- Write structured analysis to `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_it2_1/handoff.md`

## Current Parent
- Conversation ID: 21826d14-7bc9-4995-866c-cbb42a941789
- Updated: 2026-11-02T09:56:30Z

## Investigation State
- **Explored paths**:
  - `src/landing/views/HomeSection.tsx` (lines 473–569)
  - `src/landing/views/MyDeckSection.tsx` (lines 118–255, 620–628)
  - `src/landing/components/Sidebar.tsx` (lines 84–101)
  - `src/landing/index.ts` (lines 219–287)
  - `tests/adversarial_m2_user_interaction.ts` (full harness audit)
  - `tests/challenger_m2_deep_stress.ts`, `tests/adversarial_m2_home_deck.ts`
- **Key findings**:
  - `tests/adversarial_m2_user_interaction.ts` failed on `CH2.HOME.BACKDROP_CLICK` and `CH2.DECK.BACKDROP_CLICK` because outer containers lack dedicated backdrop siblings with `data-action`.
  - Placing `data-action` directly on outer containers causes event bubbling from inner dialog elements (e.g. `h3`), which would fail `CH2.HOME.INSIDE_CLICK_PRESERVED`.
  - Canonical solution is `Sidebar.tsx` pattern: a transparent outer container with a dedicated backdrop sibling (`<div id="home-card-inspect-backdrop" data-action="close-home-card-inspector" class="fixed inset-0 bg-black/60 ...">` and `<div id="deck-swap-backdrop" data-action="close-deck-swap-drawer" class="fixed inset-0 bg-black/60 ...">`) and a dialog content sibling with `relative z-10`.
  - This satisfies both `hasDedicatedBackdropOverlay` and `hasDedicatedDrawerBackdrop` in the test harness without risking false inner dismissal.
- **Unexplored areas**: None within the scope of M2 Iteration 2 backdrop investigation.

## Key Decisions Made
- Confirmed that dedicated sibling backdrop elements match both browser event bubbling requirements and Challenger 2's Cheerio selectors.
- Produced exact drop-in code recommendations for worker implementation in `handoff.md`.

## Artifact Index
- DISPATCH.md — Dispatch instructions and history
- BRIEFING.md — Persistent working memory
- progress.md — Liveness heartbeat
- handoff.md — Complete 5-component handoff report
