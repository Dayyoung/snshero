# DISPATCH: orchestrator_5

- **Role**: Project Orchestrator Generation 5 (Codebase-Wide UI/UX Terminal-Flat Overhaul)
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_5/`
- **Parent Conversation ID**: `06ec2af7-6731-4ed1-947e-46846e885942` (Sentinel)
- **Predecessor Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/`
- **Reference Documents**:
  - `/Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/handoff.md` (Soft handoff from Orchestrator 4)
  - `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (specifically ## 2026-10-18T12:11:07Z — Codebase-wide expansion to all 47 views and 620 components)
  - `/Users/dayyoung/project/snshero/DESIGN.md` (Canonical OpenCode Terminal-Flat Design System)
  - `/Users/dayyoung/project/snshero/TEST_READY.md` (E2E Test Suite documentation)
  - `/Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/PROJECT.md`
- **Mission**:
  Execute the codebase-wide UI/UX overhaul across all 47 views and all 620 components in `src/components/` (including 229+ modals/popups/drawers) and `src/App.tsx`, expand the E2E test suite to cover all views/components, achieve 100% pass rate, run gate verification, and report victory to the Sentinel.


## 2026-10-18T12:21:21Z
You are the Project Orchestrator Generation 5 for SNSHero Revolution.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_5/
You MUST read the authoritative user request at:
/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (specifically the latest request under ## 2026-10-18T12:11:07Z).

Reference documents:
- /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/handoff.md (Detailed soft handoff report from Orchestrator 4)
- /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/PROJECT.md
- /Users/dayyoung/project/snshero/DESIGN.md
- /Users/dayyoung/project/snshero/TEST_READY.md
- /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_5/DISPATCH.md

Your Parent Agent:
- Conversation ID: 06ec2af7-6731-4ed1-947e-46846e885942 (Sentinel)
- Use this ID for all escalation, status reporting, and final victory claiming via send_message.

Your Mission:
Execute the codebase-wide UI/UX expansion overhaul across ALL 47 views (`src/views/**/*.tsx`), ALL 620 components (`src/components/**/*.tsx`) including all 229+ modals/popups/drawers, and `src/App.tsx` strictly under DESIGN.md terminal-flat design system, mobile 44px+ ergonomics, and zero viewport intrusion:
1. Status of Initial 22 Core Views: Orchestrator 4 has 100% completed, verified, and locked the initial 22 views with 188/188 E2E tests passing, 764/764 buttons meeting 44px+, build exit 0, and a CLEAN forensic audit. Strictly PRESERVE all completed work in these views!
2. Scope of Expansion:
   - Remaining 25 views in `src/views/` (e.g., admin, debug, sub-screens, auth, auxiliary views).
   - All 620 component files under `src/components/`, with special focus on all 229+ modals, popups, drawers, and floating widgets.
   - Enforce 100% `font-mono`, 2-tier border radius (`rounded-none` containers/modals, `rounded-sm` buttons), flat surfaces (`#fdfcfc` / `#201d1d`), 1px hairlines, 0 gradients, 0 drop shadows, 0 bounce/ping animations.
   - Enforce 44px+ touch targets on all interactive `<button>` elements.
   - Enforce top-layer visible `[x]` or `[SKIP]` dismiss controls on all modals and popups.
3. Testing & Verification:
   - Expand `tests/e2e_design_system/` or run codebase-wide audits to verify 100% compliance across all 47 views and 620 components.
   - Verify `npx tsc --noEmit` exits code 0.
   - Verify `npm run build` exits code 0.
4. Hygiene & Reporting:
   - Local git commit only (NEVER git push to origin).
   - Update `WORK_LOGS.md` and submit the Google Form completion report via `python3 skills/report-ex/scripts/submit_report.py`.
   - Send final handoff and victory claim directly to Sentinel `06ec2af7-6731-4ed1-947e-46846e885942`.
