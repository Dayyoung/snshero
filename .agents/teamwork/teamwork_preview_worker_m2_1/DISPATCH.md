## 2026-10-18T20:41:10Z

You are Worker 2 for Milestone 2 (Interactive Dialogue Choices & Countdown Timer UI) of SNSHero RPG mode overhaul.
Your working directory is:
/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_worker_m2_1/

MANDATORY: Read the original user request first:
/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md

Reference files to read:
- /Users/dayyoung/project/snshero/PROJECT.md
- /Users/dayyoung/project/snshero/DESIGN.md
- /Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_2/survey_report.md
- /Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_2/handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File ownership:
1. `src/components/rpg/KadanNpcDialog.tsx`
2. `src/views/KadanRpgView.tsx` (specifically wiring `onRewardSns`, `onApplyBuff`, and buff storage)
Do NOT modify files outside your ownership.

Your tasks:
1. In `src/components/rpg/KadanNpcDialog.tsx`:
   - Inspect `KadanRpgNovelScriptLine` and `KadanRpgDialogueChoice` from `src/content/kadanRpgNovelScript.ts`.
   - Implement interactive choice branching:
     - When the current line has `choices` or `speaker === 'choice'`, render the choice buttons.
     - Display attitude badges (`[결의/돌파]`, `[신중/통찰]`, `[성진호흡/공명]` or English equivalents).
     - Implement visible countdown timer progress bar (5.0s in manual mode, 1.5s in autoMode).
     - When timer runs out, auto-select the default choice (`isDefault: true` or `choices[0]`).
     - When a choice is selected, immediately display the follow-up reaction text, emit `onRewardSns` and `onApplyBuff`, and then proceed with the conversation.
   - Multilingual support:
     - Remove the `language === 'ko'` limitation that dropped `KADAN_RPG_NOVEL_SCRIPTS`. When `language !== 'ko'`, use `line.textEn || line.text`, `choice.labelEn || choice.labelKo`, etc.
   - DESIGN.md strict terminal-flat compliance:
     - Fix `min-min-h-[44px]` typos to `min-h-[44px]`.
     - Replace `rounded-md` and `rounded-full` with `rounded-none` (containers/modals) and `rounded-sm` (buttons/badges).
     - Remove `background: radial-gradient(...)`, `animate-pulse`, and drop shadows. Use flat surfaces, 1px hairlines (`border border-slate-700/80` or `border-amber-500/80`), and `font-mono`.
     - Ensure all choice buttons and interactive targets have `min-h-[44px]` touch targets.

2. In `src/views/KadanRpgView.tsx`:
   - Connect `<KadanNpcDialog>` props:
     - `onRewardSns={(amount, reason) => updateSns(amount)}`
     - `onApplyBuff={(buff) => { localStorage.setItem('hero_kadan_active_buff', JSON.stringify(buff)); }}`

3. Verification:
   - `python3 tests/e2e_rpg/run_rpg_e2e_tests.py` (Must pass 51/51)
   - `python3 tests/e2e_design_system/run_all_e2e_tests.py` (Must pass 377/377)
   - `npx tsc --noEmit` (Exit code 0)
   - `npm run build` (Exit code 0)

Write your handoff to:
/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_worker_m2_1/handoff.md
Send a completion message back to orchestrator_6 when finished.
