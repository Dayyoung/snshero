# BRIEFING — 2026-11-02T09:56:00Z

## Mission
Investigate event delegation and backdrop click handling in `src/landing/index.ts`, analyzing `handleEventDelegation` and formulating a dual-defense strategy so that backdrop clicks on `#home-card-inspect-modal` and `#deck-swap-drawer-backdrop` cleanly dismiss overlays while preserving clicks inside inner dialogs.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_it2_2
- Original parent: 21826d14-7bc9-4995-866c-cbb42a941789
- Milestone: M2 Iteration 2 (#home & #deck Backdrop Click Dismissal)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Produce a structured analysis and drop-in recommendation in `handoff.md`
- Provide dual-defense strategy
- Communicate results back to caller via `send_message`

## Current Parent
- Conversation ID: 21826d14-7bc9-4995-866c-cbb42a941789
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `ORIGINAL_REQUEST.md` (read verbatim)
  - `PROJECT.md` (read)
  - `challenger_m2_9_2/handoff.md` (read)
  - `DISPATCH.md` (read and updated)
  - `src/landing/index.ts:219-357` (`handleEventDelegation` & `handleGlobalKeydown`)
  - `src/landing/views/HomeSection.tsx:470-520` (`#home-card-inspect-modal`)
  - `src/landing/views/MyDeckSection.tsx:120-160` (`#deck-swap-drawer-backdrop`)
  - `src/landing/components/Sidebar.tsx:84-100` (`#sidebar-backdrop` reference pattern)
  - `src/landing/components/Modals.tsx:180-192` (`#landing-modal-overlay`)
  - `tests/adversarial_m2_user_interaction.ts` (reproduced verbatim failures)
  - `tests/adversarial_m2_home_deck.ts` (verified 28/28 pass)
  - `tests/challenger_m2_adversarial.ts` (verified 30/30 pass)
  - `tests/challenger_m2_deep_stress.ts` (verified 29/29 pass)
  - `tests/adversarial_tier5_dom_assets_challenger2.ts` (verified 25/25 pass)
  - `tests/e2e/run_all.ts --milestone M2` (verified 11/11 pass)
  - `npm run lint` & `npm run build` (verified 0 errors)
- **Key findings**:
  - Gate failure root cause: `handleEventDelegation` filters targets via `.closest('[data-nav], [data-modal], [data-action], a[href^="#"], a[href="/home"]')`. Outer containers lack `data-action` and dedicated backdrop elements.
  - Critical Pitfall: Placing `data-action` directly on the outer container causes `el.closest(...)` to match when clicking *inside* the dialog content (e.g. `<h3>`), violating `CH2.HOME.INSIDE_CLICK_PRESERVED`.
  - Dual-Defense Solution:
    - Defense Layer 1 (DOM Template): Sibling backdrops (`#home-card-inspect-backdrop`, `#deck-swap-backdrop`) with `data-action` and `fixed` classes.
    - Defense Layer 2 (Event Delegation): Direct ID checks in `handleEventDelegation` for outer containers and backdrops before `.closest()`.
- **Unexplored areas**:
  - None within M2 scope.

## Key Decisions Made
- Confirmed Sibling Backdrop Pattern (`Sidebar.tsx` model) as the safest DOM architecture.
- Confirmed Direct ID check in `handleEventDelegation` as robust defense-in-depth.

## Artifact Index
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_it2_2/DISPATCH.md` — Incoming dispatch log
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_it2_2/progress.md` — Liveness heartbeat
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_it2_2/BRIEFING.md` — Persistent awareness index
- `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m2_it2_2/handoff.md` — 5-component handoff report
