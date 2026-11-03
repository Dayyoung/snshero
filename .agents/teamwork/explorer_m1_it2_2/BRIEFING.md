# BRIEFING — 2026-11-02T08:41:30Z

## Mission
Investigate dead code / route shadowing defect in `src/routes.ts` where `/play?ep=1` resolves to `'play'` instead of `'main'`, and provide an exact, clean drop-in code fix.

## 🔒 My Identity
- Archetype: explorer
- Roles: explorer, investigator
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it2_2/
- Original parent: 21826d14-7bc9-4995-866c-cbb42a941789
- Milestone: Milestone 1 Iteration 2 Remediation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Strictly read-only on source files
- Write metadata/reports only to .agents/teamwork/explorer_m1_it2_2/

## Current Parent
- Conversation ID: 21826d14-7bc9-4995-866c-cbb42a941789
- Updated: not yet

## Investigation State
- **Explored paths**: `src/routes.ts`, `src/App.tsx`, `src/hooks/useKadanRpgProgress.ts`, `tests/adversarial_route_edge_cases.ts`, `tests/unit_m1_idle_autoplay.ts`, `src/landing/index.ts`
- **Key findings**:
  1. In `src/routes.ts:486`, `if (cleanPath === '/play' || cleanPath === '/main') return 'play';` unconditionally matches and returns `'play'`, making lines 497–502 (`if (cleanPath === '/play' && (params.get('ep') ...)) return 'main';`) dead code.
  2. Deep links `/play?ep=1`, `/play?episode=40`, `/play?ch=5`, `/play?chapter=12` fail to route to Kadan RPG (`main`), failing assertions `EDGE-QUERY-5..8`.
  3. Secondary issue: hash routes (`#play?ep=1`) lacked query string extraction.
- **Unexplored areas**: `scripts/post-build.js` (assigned to Explorer 1)

## Key Decisions Made
- Confirmed reproduction via runtime one-liner and adversarial test runner.
- Prepared and tested two drop-in unified patches (`routes_precedence_fix.patch` and `routes_precedence_minimal.patch`), both passing `git apply --check` with 0 errors.
- Documented findings in `report.md` and `handoff.md`.

## Artifact Index
- DISPATCH.md — incoming dispatch log
- BRIEFING.md — working memory and identity
- progress.md — liveness heartbeat
- report.md — detailed defect analysis and drop-in patches
- handoff.md — 5-component handoff report
- routes_precedence_fix.patch — comprehensive drop-in unified patch
- routes_precedence_minimal.patch — minimal drop-in unified patch
