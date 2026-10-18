## 2026-10-18T10:25:54Z
You are Implementation Worker 2 (Milestone 2 — Economy, Social & Content Views) for SNSHero Revolution.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m2/
You MUST read the authoritative user request at:
/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (specifically the latest request under ## 2026-10-18T10:08:37Z).

Reference specifications:
- /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_2/handoff.md (Detailed line-by-line fix recipes)
- /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_4/PROJECT.md (Features 18–28)
- /Users/dayyoung/project/snshero/DESIGN.md
- /Users/dayyoung/project/snshero/.agents/teamwork/worker_m2/DISPATCH.md

Your Exclusive Write Ownership:
- `src/views/ShopView.tsx`
- `src/views/CardMarketplaceView.tsx`
- `src/views/NovelView.tsx`
- `src/views/MovieView.tsx`
- `src/views/RankingView.tsx`
- `src/views/GuildListView.tsx`
- `src/views/GuildDetailView.tsx`
- `src/views/CommunityView.tsx`
- `src/views/RedditCommunityView.tsx`
- `src/components/movie/CinematicMoviePlayer.tsx`
- `src/components/reddit/*`

Your Task:
Implement Features 18–28 according to DESIGN.md and `explorer_survey_2/handoff.md`:
1. `ShopView.tsx`:
   - Cleanse all 289 banned classes: replace gradients with solid `#fdfcfc` / `#201d1d` surfaces; convert `rounded-3xl/2xl/xl/lg` to `rounded-none` containers and `rounded-sm` buttons; strip all drop shadows (`shadow-*`); remove bounce/ping animations; replace `font-sans` with `font-mono`.
   - Upgrade all 39 sub-44px buttons and modal close buttons to `min-h-[44px] min-w-[44px]`.
2. `CardMarketplaceView.tsx`:
   - Upgrade all 13 sub-44px buttons (including toast dismiss `[x]` at lines 951–1023 and action buttons at lines 1147, 1156, 1546) to `min-h-[44px]`.
3. `NovelView.tsx`:
   - Add `min-h-[44px] min-w-[44px]` to chapter drawer close `[X]` (line 1072); upgrade episode card buttons (line 1087) to `min-h-[48px]`; upgrade prompt copy buttons to 44px tap area.
4. `MovieView.tsx` & `CinematicMoviePlayer.tsx`:
   - Remove `shadow-2xl` from `CinematicMoviePlayer.tsx` line 687; maintain 100% 44px+ buttons.
5. `RankingView.tsx`:
   - Cleanse all 147 banned classes: replace gradients and `font-sans` with solid `#201d1d` / `font-mono`; convert `rounded-3xl/2xl/xl` to `rounded-none`; upgrade all 30 sub-44px buttons and modal close buttons to `min-h-[44px]`.
6. `GuildListView.tsx`:
   - Cleanse all 54 banned classes: replace `font-sans` with `font-mono`; convert `rounded-3xl/2xl` to `rounded-none`; upgrade all 17 sub-44px buttons to `min-h-[44px]`; match `GuildDetailView.tsx` standard.
7. `CommunityView.tsx`:
   - Cleanse all 82 banned classes: flatten carousel cards to `rounded-none border-[rgba(15,0,0,0.12)] bg-[#f8f7f7]`; upgrade all 68 reaction/comment buttons to `min-h-[44px] rounded-sm`; remove bounce/ping animations.
8. `RedditCommunityView.tsx` & `src/components/reddit/*`:
   - Replace root `font-sans` with `font-mono`; convert pill buttons (`rounded-full`) to `rounded-sm min-h-[44px]`; eliminate drop shadows across Reddit subcomponents.
9. Verify your work with `npx tsc --noEmit` to ensure 0 TypeScript errors.
10. Produce your handoff report in `/Users/dayyoung/project/snshero/.agents/teamwork/worker_m2/handoff.md`.
11. Send a message to parent reporting completion and build verification results.
