## 2026-11-02T07:48:03Z
You are Explorer 3 for Milestone 1 (explorer_m1_9_3).
Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_9_3/
You are strictly READ-ONLY. DO NOT edit or write source code files. Write only metadata/reports in your directory.

MANDATORY FIRST STEP:
Read /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md completely.
Also read /Users/dayyoung/project/snshero/PROJECT.md and survey report /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_2/report.md.

Milestone 1 Scope: Global 15-Second Idle Auto-Play Transition
- Requirement: "On any screen, if user input is absent for 15 seconds or more, automatically navigate to #play (https://dayyoung-macbookpro.tail3717a4.ts.net/#play) and initiate auto-play. User interaction must reset the timer."
- Focus on designing `src/landing/services/idleAutoPlayManager.ts` (or equivalent global utility):
  1. What input events must be listened to? (`mousemove`, `mousedown`, `keydown`, `touchstart`, `touchmove`, `scroll`, `pointerdown`, `wheel`).
  2. How does the 15,000ms timer work, and how is it reset cleanly on any interaction?
  3. When the timer expires:
     - Set auto-mode flags in LocalStorage (`hero_kadan_rpg_auto_mode = 'true'`, etc.).
     - Check current URL: if already on `#play` and auto-play is running, avoid redundant reloads.
     - Navigate to `https://dayyoung-macbookpro.tail3717a4.ts.net/#play` (or relative `#play` with fallback).
     - Dispatch auto-play initiation events.
  4. Integration into app bootstrap (`src/landing/index.ts` and anywhere needed).
  5. Testability: how unit/E2E tests can verify timer expiration, reset, and navigation.
Write your report to /Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_9_3/report.md and handoff.md, and send a message back.
