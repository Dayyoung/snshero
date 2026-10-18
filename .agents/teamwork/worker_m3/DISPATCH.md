# DISPATCH: worker_m3

- **Role**: Implementation Worker (Milestone 3 — Systems, Progression, Codex & Global App Chrome)
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m3/`
- **Scope**: Features 29–50 in `PROJECT.md`
- **Exclusive Write Ownership**:
  - `src/views/ProfileView.tsx`
  - `src/views/SettingView.tsx`
  - `src/views/SeasonHubView.tsx`
  - `src/views/CompanionView.tsx`
  - `src/views/EventView.tsx`
  - `src/views/StockMarketView.tsx`
  - `src/views/PredictionMarketView.tsx`
  - `src/views/WikiCardView.tsx`
  - `src/views/WorldCodexView.tsx`
  - `src/App.tsx`
- **Inputs**:
  - `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (specifically ## 2026-10-18T10:08:37Z)
  - `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/handoff.md` (Detailed line numbers & fix recipes)
  - `/Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/PROJECT.md`
  - `/Users/dayyoung/project/snshero/DESIGN.md`
  - `/Users/dayyoung/project/snshero/AGENTS.md` & `/Users/dayyoung/project/snshero/GEMINI.md`
- **Mandatory Integrity Warning**:
  DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
## 2026-10-18T10:25:54Z
You are Implementation Worker 3 (Milestone 3 — Systems, Progression, Codex & Global App Chrome) for SNSHero Revolution.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m3/
You MUST read the authoritative user request at:
/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (specifically the latest request under ## 2026-10-18T10:08:37Z).

Reference specifications:
- /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/handoff.md (Detailed line-by-line fix recipes)
- /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/PROJECT.md (Features 29–50)
- /Users/dayyoung/project/snshero/DESIGN.md
- /Users/dayyoung/project/snshero/.agents/teamwork/worker_m3/DISPATCH.md

Your Exclusive Write Ownership:
- `src/views/ProfileView.tsx`
- `src/views/SettingView.tsx`
- `src/views/SeasonHubView.tsx`
- `src/views/CompanionView.tsx`
- `src/views/EventView.tsx`
- `src/views/StockMarketView.tsx`
- `src/views/PredictionMarketView.tsx`
- `src/views/WikiCardView.tsx`
- `src/views/WorldCodexView.tsx`
- `src/App.tsx`

Your Task:
Implement Features 29–50 according to DESIGN.md and `explorer_survey_3/handoff.md`:
1. `ProfileView.tsx`:
   - Change root to `font-mono bg-[#fdfcfc] text-[#201d1d]`; convert cards to `rounded-none border border-[rgba(15,0,0,0.12)]`; upgrade help button and modal controls to `min-w-[44px] min-h-[44px] rounded-sm`.
2. `SettingView.tsx`:
   - Refactor toggle switches from `rounded-full` to `rounded-sm` flat switches or ASCII `[ON]` / `[OFF]`; slider tracks to `rounded-none`; remove 51 shadows and 4 `animate-bounce`; flatten Strategy Simulator and Season Change modals to `rounded-none` with 44px CTAs; migrate `firebase_db_mode` to `hero_firebase_db_mode` (with fallback).
3. `SeasonHubView.tsx`:
   - Convert hero banner to `rounded-none border border-[rgba(15,0,0,0.12)] bg-[#201d1d] text-[#fdfcfc]`; remove decorative blur blobs; upgrade season pass action buttons to `min-h-[44px] rounded-sm`.
4. `CompanionView.tsx`:
   - Convert root to `font-mono`; sub-tabs to `rounded-none`; companion slot buttons to `min-w-[44px] min-h-[44px] rounded-sm`; equipment & skill modals to `rounded-none` with 44px `[x]` buttons.
5. `EventView.tsx`:
   - Convert root to `font-mono`; balance and banner cards to `rounded-none border border-[#201d1d] bg-[#fdfcfc]`; nine-slot and diorama modals to `rounded-none font-mono` with 44px `[x]` buttons.
6. `StockMarketView.tsx`:
   - Upgrade trade modal close button to `min-h-[44px] min-w-[44px]`.
7. `PredictionMarketView.tsx`:
   - Flatten cards to `rounded-none border border-[rgba(15,0,0,0.12)]`; upgrade bet option buttons to `rounded-sm min-h-[44px]`; remove 6 gradients, 37 shadows, and 3 bounces; flatten bet and history dialogs to `rounded-none font-mono`.
8. `WikiCardView.tsx`:
   - Change root to `font-mono`; filters and cards to `rounded-none`; progress bar to solid `bg-[#201d1d] rounded-none`; upgrade help button to `min-w-[44px] min-h-[44px]`.
9. `WorldCodexView.tsx`:
   - Convert help and detail modal to `rounded-none` with `min-h-[44px] min-w-[44px]` controls.
10. `src/App.tsx`:
    - Drawer header icons: upgrade to `min-h-[44px] min-w-[44px] rounded-sm`.
    - Drawer menu items: enforce `font-mono rounded-none min-h-[44px] border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc]`.
    - Global floating chat window: convert to `rounded-none border border-[#201d1d] bg-[#090d16]`; remove ping/bounce animations.
    - Welcome and gacha reward modals: refactor to `rounded-none font-mono` with 44px primary CTAs.
    - Migrate `snshero_audio_settings` to `hero_audio_settings` (with fallback).
    - Ensure 100% `safeLazy` dynamic glob imports are preserved.
11. Verify your work with `npx tsc --noEmit` to ensure 0 TypeScript errors.
12. Produce your handoff report in `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m3/handoff.md`.
13. Send a message to parent reporting completion and build verification results.
