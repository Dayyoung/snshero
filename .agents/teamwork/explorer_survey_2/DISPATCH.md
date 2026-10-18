# DISPATCH: explorer_survey_2

- **Role**: Survey Explorer 2 (Economy, Social & Content Views)
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_2/`
- **Target Views**:
  - `src/views/ShopView.tsx`
  - `src/views/CardMarketplaceView.tsx`
  - `src/views/NovelView.tsx`
  - `src/views/MovieView.tsx`
  - `src/views/RankingView.tsx`
  - `src/views/GuildListView.tsx` & `src/views/GuildDetailView.tsx`
  - `src/views/CommunityView.tsx` & `src/views/RedditCommunityView.tsx`
- **References**:
  - `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (specifically ## 2026-10-18T10:08:37Z)
  - `/Users/dayyoung/project/snshero/DESIGN.md`
  - `/Users/dayyoung/project/snshero/AGENTS.md` & `/Users/dayyoung/project/snshero/GEMINI.md`


## 2026-10-18T10:12:47Z
Sender: 3a464f6d-bcf9-4b99-af07-b0e05ceb817a
Priority: MESSAGE_PRIORITY_HIGH
Content:
You are Survey Explorer 2 (Economy, Social & Content Views) for SNSHero Revolution.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_2/
You MUST read the authoritative user request at:
/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (specifically the latest request under ## 2026-10-18T10:08:37Z).

Reference specifications:
- /Users/dayyoung/project/snshero/DESIGN.md (Canonical OpenCode Terminal-Flat Design System)
- /Users/dayyoung/project/snshero/AGENTS.md & /Users/dayyoung/project/snshero/GEMINI.md
- /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_2/DISPATCH.md

Your Assigned Scope:
Investigate and survey the following views:
1. `src/views/ShopView.tsx`
2. `src/views/CardMarketplaceView.tsx`
3. `src/views/NovelView.tsx`
4. `src/views/MovieView.tsx`
5. `src/views/RankingView.tsx`
6. `src/views/GuildListView.tsx` & `src/views/GuildDetailView.tsx`
7. `src/views/CommunityView.tsx` & `src/views/RedditCommunityView.tsx`

Your Task:
1. Conduct an exhaustive visual and architectural survey of these 9 targets against DESIGN.md:
   - Identify all legacy non-compliant classes: `bg-gradient-to-*`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full`, `shadow-*`, `animate-ping`, `animate-bounce`, non-mono font usage.
   - Audit touch targets: measure/check button heights, interactive tabs, pagination controls (must be >= 44px / `min-h-[44px]`).
   - Audit progressive disclosure & spatial layout: check category grouping, tab segmentation, zero intrusion over novel/webtoon panels and movie theater canvas.
   - Check modal/overlay close buttons: presence of top-layer [x] close / [SKIP] buttons.
   - Check LocalStorage keys (`hero_*`), i18n keys, and safeLazy imports.
2. Produce a comprehensive survey and specification report in:
   `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_2/handoff.md`
   and update `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_2/progress.md`.
3. Conclude with a structured Feature Inventory list (Feature Name, Target File, Current Violations, Recommended Design-Compliant Fix, Dependencies).
4. Send a message to parent reporting completion and pointing to your handoff.md.

HARD CONSTRAINT: You are a read-only Explorer. NEVER edit source files. Write ONLY to your directory `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_2/`.
