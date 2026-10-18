# BRIEFING — 2026-10-18T21:54:00Z

## Mission
Investigate and formulate the fix strategy for Ambush Alert Countdown state updater side-effects in src/views/KadanRpgView.tsx (lines 453-480), referencing KadanNpcDialog.tsx, to prevent double invocations and state tearing in React 19.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigator, analyzer, synthesizer
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_m4_r2_2
- Original parent: 0841dceb-1ed6-4895-a369-d9b2f167a28c
- Milestone: Milestone 4 Iteration 2 (Ambush Alert Countdown State Updater Fix)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Analyze lines 453-480 in src/views/KadanRpgView.tsx
- Compare with KadanNpcDialog.tsx clean timer pattern
- Formulate exact fix strategy to extract handleEngageAmbush() outside setAmbushCountdown updater
- Provide concrete recommendations for Worker 4
- Deliver self-contained 5-component handoff.md

## Current Parent
- Conversation ID: 0841dceb-1ed6-4895-a369-d9b2f167a28c
- Updated: 2026-10-18T21:54:00Z

## Investigation State
- **Explored paths**:
  - `src/views/KadanRpgView.tsx` (lines 437–480, 820–895)
  - `src/components/rpg/KadanNpcDialog.tsx` (lines 265–291)
  - `tests/e2e_rpg/` and `tests/adversarial_challenger2_m4_rebirth_retreat.ts`
- **Key findings**:
  - `KadanRpgView.tsx` lines 467-475 executes side effects (`handleEngageAmbush()`, `window.clearInterval(timer)`) inside pure `setAmbushCountdown((prev) => ...)` functional updater.
  - In React 19 / StrictMode, pure updaters can be invoked multiple times, causing double execution of `handleEngageAmbush()` and nested state updates (`setAmbushBattle`, `setAmbushAlert`).
  - Arithmetic delta subtraction (`prev - intervalMs / 1000`) is subject to frame throttling and timer drift.
  - `KadanNpcDialog.tsx` uses a wall-clock deadline pattern (`deadline = Date.now() + duration`) and evaluates timer completion outside `setState`.
- **Unexplored areas**:
  - None within scope. Complete analysis of lines 453-480 and interaction with parent view state machine achieved.

## Key Decisions Made
- Recommend Strategy 1 (Deadline-based Interval with Boolean Guard) matching `KadanNpcDialog.tsx`.
- Interval frequency upgraded from 100ms to 50ms (20fps smooth animation).
- Action invocation moved to interval tick callback body with `triggered` guard.

## Artifact Index
- `DISPATCH.md` — Inbound mission instructions
- `BRIEFING.md` — Working memory and status
- `progress.md` — Execution tracking and heartbeat
- `handoff.md` — 5-component handoff report for Worker 4 and orchestrator
