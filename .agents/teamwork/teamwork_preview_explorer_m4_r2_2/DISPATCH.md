## 2026-10-18T21:50:02Z
You are Explorer 2 for Milestone 4 Iteration 2 (Ambush Alert Countdown State Updater Fix) of SNSHero RPG mode overhaul.
Your working directory is:
/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_m4_r2_2/

MANDATORY: Read the original user request first:
/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md

Failure Context from Reviewer 2:
In Milestone 4 Gate (Iteration 1), Reviewer 2 reported Finding 2:
"In src/views/KadanRpgView.tsx (lines 467–475):
setAmbushCountdown((prev) => {
  const next = Math.max(0, prev - intervalMs / 1000);
  if (next <= 0.05) {
    window.clearInterval(timer);
    handleEngageAmbush();
    return 0;
  }
  return next;
});
Calling handleEngageAmbush() (which triggers state setters setAmbushBattle and setAmbushAlert) inside the pure state updater function setAmbushCountdown risks double invocations and state tearing under React 19 concurrent features."

Reference files:
- /Users/dayyoung/project/snshero/PROJECT.md
- /Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_reviewer_m4_2/handoff.md
- /Users/dayyoung/project/snshero/src/views/KadanRpgView.tsx
- /Users/dayyoung/project/snshero/src/components/rpg/KadanNpcDialog.tsx (lines 265–291 for clean timer interval pattern)

Your mission:
Analyze lines 453–480 in `src/views/KadanRpgView.tsx`:
1. Inspect the interval timer and compare with the clean pattern in `KadanNpcDialog.tsx` (which tracks remaining time or uses deadline without side-effects inside setState).
2. Formulate the exact fix strategy to extract `handleEngageAmbush()` outside the `setAmbushCountdown` updater.
3. Provide concrete recommendations for Worker 4.
Write your handoff to:
/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_m4_r2_2/handoff.md
Send a completion message back to orchestrator_6 when finished.
