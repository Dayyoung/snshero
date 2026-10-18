# DISPATCH: explorer_survey_3

- **Role**: Survey Explorer 3 (Progression, Systems, Codex & App Chrome)
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/`
- **Target Views**:
  - `src/views/ProfileView.tsx`
  - `src/views/SettingView.tsx`
  - `src/views/SeasonHubView.tsx`
  - `src/views/CompanionView.tsx`
  - `src/views/EventView.tsx`
  - `src/views/StockMarketView.tsx`
  - `src/views/PredictionMarketView.tsx`
  - `src/views/WikiCardView.tsx`
  - `src/views/WorldCodexView.tsx`
  - `src/App.tsx` (top navigation, bottom dock, drawer modals)
- **References**:
  - `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (specifically ## 2026-10-18T10:08:37Z)
  - `/Users/dayyoung/project/snshero/DESIGN.md`
  - `/Users/dayyoung/project/snshero/AGENTS.md` & `/Users/dayyoung/project/snshero/GEMINI.md`

## 2026-10-18T10:12:47Z
You are Survey Explorer 3 (Progression, Systems, Codex & App Chrome) for SNSHero Revolution.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/
You MUST read the authoritative user request at:
/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (specifically the latest request under ## 2026-10-18T10:08:37Z).

Reference specifications:
- /Users/dayyoung/project/snshero/DESIGN.md (Canonical OpenCode Terminal-Flat Design System)
- /Users/dayyoung/project/snshero/AGENTS.md & /Users/dayyoung/project/snshero/GEMINI.md
- /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/DISPATCH.md

Your Assigned Scope:
Investigate and survey the following views and app chrome:
1. `src/views/ProfileView.tsx`
2. `src/views/SettingView.tsx`
3. `src/views/SeasonHubView.tsx`
4. `src/views/CompanionView.tsx`
5. `src/views/EventView.tsx`
6. `src/views/StockMarketView.tsx`
7. `src/views/PredictionMarketView.tsx`
8. `src/views/WikiCardView.tsx`
9. `src/views/WorldCodexView.tsx`
10. `src/App.tsx` (navigation bar, drawer menus, floating dock, modal containers)

Your Task:
1. Conduct an exhaustive visual and architectural survey of these 10 targets against DESIGN.md:
   - Identify all legacy non-compliant classes: `bg-gradient-to-*`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full`, `shadow-*`, `animate-ping`, `animate-bounce`, non-mono font usage.
   - Audit touch targets: measure/check button heights, interactive tabs, navigation icons (must be >= 44px / `min-h-[44px]`).
   - Audit progressive disclosure & spatial layout: check bottom navigation dock clearance, drawer toggles, modal wrappers.
   - Check modal/overlay close buttons: presence of top-layer [x] close / [SKIP] buttons.
   - Check LocalStorage keys (`hero_*`), i18n keys, and safeLazy imports in `App.tsx`.
2. Produce a comprehensive survey and specification report in:
   `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/handoff.md`
   and update `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/progress.md`.
3. Conclude with a structured Feature Inventory list (Feature Name, Target File, Current Violations, Recommended Design-Compliant Fix, Dependencies).
4. Send a message to parent reporting completion and pointing to your handoff.md.

HARD CONSTRAINT: You are a read-only Explorer. NEVER edit source files. Write ONLY to your directory `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/`.
