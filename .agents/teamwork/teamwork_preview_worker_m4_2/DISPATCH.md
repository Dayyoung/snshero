## 2026-10-18T21:56:15Z
You are Worker 4 (Iteration 2) for Milestone 4 (100% Hands-Free Auto-Progression Mode & Contract Fixes) of SNSHero RPG mode overhaul.
Your working directory is:
/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_worker_m4_2/

MANDATORY: Read the original user request first:
/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md

Reference files:
- /Users/dayyoung/project/snshero/PROJECT.md
- /Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_reviewer_m4_2/handoff.md
- /Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_m4_r2_1/handoff.md
- /Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_m4_r2_2/handoff.md
- /Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_m4_r2_3/handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File ownership:
1. `src/views/MobileCardPlayScreen.tsx` (update onBack prop signature and pass isMatchCompleted)
2. `src/views/KadanRpgView.tsx` (update onBack in MobileCardPlayScreen mounts; refactor ambushCountdown interval to pure deadline loop)
3. `tests/e2e_rpg/tier1_feature_coverage.py` (upgrade T1.F12.4 and add T1.F12.6)
4. `tests/e2e_rpg/helpers.py` (upgrade RpgPlaythroughSimulator to track auto_mode with onBack contract)
5. `tests/adversarial_challenger_m4_empirical.ts` (add contract assertions in Section 7)
