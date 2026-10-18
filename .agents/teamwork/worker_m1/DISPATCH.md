# DISPATCH: worker_m1

- **Role**: Implementation Worker (Milestone 1 — Core Gameplay & Battle Views)
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m1/`
- **Scope**: Features 1–17 in `PROJECT.md`
- **Exclusive Write Ownership**:
  - `src/views/HomeView.tsx`
  - `src/views/MobileCardPlayScreen.tsx`
  - `src/views/MyDeckView.tsx`
  - `src/views/PlayGameView.tsx`
  - `src/components/battle/TacticalCommandHUD.tsx`
  - `src/components/battle/TacticalSynergyMatrix.tsx`
  - `src/components/battle/StarBreathingUltimateWidget.tsx`
  - `src/components/battle/ElementalTempestWidget.tsx`
  - `src/components/MinimalistMissionHUD.tsx`
  - `src/components/ResponsiveCleanHUD.tsx`
  - `src/components/DemoPlayHUD.tsx`
  - `src/components/BattleBossHUD.tsx`
  - `src/components/MissionGameCardHUD.tsx`
- **Inputs**:
  - `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (specifically ## 2026-10-18T10:08:37Z)
  - `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/handoff.md` (Detailed line numbers & fix recipes)
  - `/Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/PROJECT.md`
  - `/Users/dayyoung/project/snshero/DESIGN.md`
  - `/Users/dayyoung/project/snshero/AGENTS.md` & `/Users/dayyoung/project/snshero/GEMINI.md`
- **Mandatory Integrity Warning**:
  DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-10-18T10:25:54Z
You are Implementation Worker 1 (Milestone 1 — Core Gameplay & Battle Views) for SNSHero Revolution.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1/
You MUST read the authoritative user request at:
/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (specifically the latest request under ## 2026-10-18T10:08:37Z).

Reference specifications:
- /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/handoff.md (Detailed line-by-line fix recipes)
- /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/PROJECT.md (Features 1–17)
- /Users/dayyoung/project/snshero/DESIGN.md
- /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1/DISPATCH.md

Your Exclusive Write Ownership:
- `src/views/HomeView.tsx`
- `src/views/MobileCardPlayScreen.tsx`
- `src/views/MyDeckView.tsx`
- `src/views/PlayGameView.tsx`
- `src/components/battle/TacticalCommandHUD.tsx`
- `src/components/battle/TacticalSynergyMatrix.tsx`
- `src/components/battle/StarBreathingUltimateWidget.tsx`
- `src/components/battle/ElementalTempestWidget.tsx`
- `src/components/MinimalistMissionHUD.tsx`
- `src/components/ResponsiveCleanHUD.tsx`
- `src/components/DemoPlayHUD.tsx`
- `src/components/BattleBossHUD.tsx`
- `src/components/MissionGameCardHUD.tsx`

Your Task:
Implement Features 1–17 according to DESIGN.md and `explorer_survey_1/handoff.md`:
1. `MobileCardPlayScreen.tsx`:
   - Enforce `min-h-[44px] h-11 px-2.5` on the 4 battle skill action buttons (Power Boost, Shield, Burst, Auto Battle Toggle at lines 1950–2023).
   - Upgrade Smart LifeCycle toggle to `min-h-[44px] min-w-[44px]` (lines 1657–1674).
   - Change `rounded-b-lg` to `rounded-none` on line 2117 (`TacticalCommandHUD` wrapper).
   - Remove `shadow-sm` on line 2065.
2. `PlayGameView.tsx`:
   - Systematically replace all 68 gradients with solid `#fdfcfc` (light) or `#201d1d` (dark) flat surfaces with 1px hairline borders (`border-[rgba(15,0,0,0.12)]` or `border-[#201d1d]`).
   - Convert all 248 forbidden radii (`rounded-3xl/2xl/xl/lg`) to `rounded-none` (containers/modals/panels) and `rounded-sm` (buttons/inputs).
   - Eliminate all 134 drop shadows (`shadow-md/lg/xl/2xl/sm`).
   - Eliminate all 134 animations (`animate-ping`, `animate-bounce`).
   - Replace all 40 instances of `font-sans` with `font-mono`.
   - Convert floating robot auto-battle & circular skill controls (lines 15143–15345) to a clean docked terminal toolbar with `min-h-[44px]` buttons and zero playfield obstruction.
   - Upgrade all buttons across BossCardItem, Dungeon Results, GPS HUD, Final Results, Rules Modal, Versus Matchup, and Guardian Mission list to `min-h-[44px]`.
3. Shared Battle HUDs:
   - Strip `shadow-xl/2xl` from `StarBreathingUltimateWidget`, `ElementalTempestWidget`, `MinimalistMissionHUD`, `ResponsiveCleanHUD`, `DemoPlayHUD`.
   - Ensure all exit, help, pause, and action buttons enforce `min-h-11` (44px+).
4. Verify your work with `npx tsc --noEmit` to ensure 0 TypeScript errors.
5. Produce your handoff report in `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m1/handoff.md`.
6. Send a message to parent reporting completion and build verification results.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
