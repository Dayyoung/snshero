## 2026-10-18T04:44:10Z
You are Worker 2 (Manifest, UI & SW Synchronization Worker).
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_worker_m2/
You must first read: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusive Write Ownership:
You EXCLUSIVELY own the following files:
- `src/content/webtoonEpisodeManifest.json`
- `src/content/webtoonEpisodes.ts`
- `src/views/NovelView.tsx`
- `src/views/MobileCardPlayScreen.tsx`
- `src/components/movie/CinematicMoviePlayer.tsx`
- `public/sw.js`
Do NOT modify files in `public/images/webtoon/` or `public/seat/`.

Reference Materials to Read First:
- `/Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_3/PROJECT.md`
- `/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_1/survey_scenario_manifest.md`
- `/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_3/survey_ui_verification.md`

Task:
1. Update `src/content/webtoonEpisodeManifest.json`:
   - For all 40 episodes and all 21 scenes per episode (840 scenes total):
     * Set `localArtUrl`: `"/images/webtoon/episode_XX/scene_YY.webp"` (e.g. `"/images/webtoon/episode_01/scene_00.webp"`)
     * Set `imageUrl`: `"/images/webtoon/episode_XX/scene_YY.webp"`
     * Set `fileName`: `"scene_YY.webp"`
     * In `dialogues`, inject `characterCardId` (1 to 110) matching the speaker name per the mapping in `survey_scenario_manifest.md` (e.g. Kadan/카단 -> 41, Celia/실리아 -> 62, Aleksandar/알렉산다르 -> 50, Ignis/이그니스 -> 11, Balian/발리안 -> 43, etc.) so speech bubbles display the 16x16 hero badge.
     * In title cards (`index: 0`), ensure `characters` is populated with the episode hero(es).
2. Update `src/content/webtoonEpisodes.ts`:
   - Replace dummy formulas in `buildSeasonEpisodes()`: set accurate `focusCardId` and `characterIds` per episode based on `survey_scenario_manifest.md`.
   - Update fallback / default panel image URLs to `/images/webtoon/episode_${pad}/scene_00.webp`.
3. Eliminate all hardcoded external CDN URLs (`https://dayyoung.github.io/image/cartoon/...`):
   - In `src/views/NovelView.tsx` (line ~258: update `getCartoonSceneUrl` to return local path `/images/webtoon/episode_${epPad}/${scPad}.webp`).
   - In `src/views/MobileCardPlayScreen.tsx` (line ~693: fallbackImg to `/images/webtoon/episode_${pad}/scene_00.webp`).
   - In `src/components/movie/CinematicMoviePlayer.tsx` (ensure `img.localArtUrl || img.imageUrl` is used and fallback to local `/images/webtoon/...`).
4. Update `public/sw.js`:
   - Bump `MEDIA_CACHE_NAME` from `'snshero-media-v3-banana2026'` to `'snshero-media-v4-webtoon2026'` so browsers purge stale cached CDN images and load the new local WebP assets.
5. Verification:
   - Run `npx tsc --noEmit` (must pass with 0 errors).
   - Check that `grep -rn "dayyoung.github.io" src/` returns 0 hits in webtoon/novel/movie views.

Write your detailed implementation and verification report in:
`/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_worker_m2/handoff.md`.
Send a completion message back when done.
