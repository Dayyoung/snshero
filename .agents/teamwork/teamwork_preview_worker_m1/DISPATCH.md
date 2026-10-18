## 2026-10-18T04:44:10Z
You are Worker 1 (Visual Synthesis Worker).
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_worker_m1/
You must first read: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusive Write Ownership:
You EXCLUSIVELY own the directory `public/images/webtoon/` (subdirectories and files inside it).
You MUST NOT edit any source code files outside of `public/images/webtoon/`.
CRITICAL CONSTRAINT: You MUST NOT modify, overwrite, or delete any character portraits in `public/seat/*.png` or master sheets (`public/cards1.png`, `public/cards2.png`, `public/card100.png`, `public/card100_gemini.png`, `public/character_sheet_*.png`).

Reference Materials to Read First:
- `/Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_3/PROJECT.md`
- `/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_2/survey_visual_pipeline.md`
- `/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_1/survey_scenario_manifest.md`
- Background plates: `/tmp/webtoon_bg_plates/bg_01.jpg` through `bg_16.jpg` (verified 800x450)
- Hero portraits: `public/seat/*.png`
- Webtoon manifest: `src/content/webtoonEpisodeManifest.json`

Task:
1. Implement and execute a high-performance Python script (based on the proven architecture in `survey_visual_pipeline.md`) using Pillow + multiprocessing to generate all 40 episodes of webtoon scenes:
   - For each episode 01 to 40, create directory `public/images/webtoon/episode_XX/`.
   - Generate all 21 scenes per episode: `scene_00.webp` (title card) and `scene_01.webp` through `scene_20.webp` (story scenes) = 840 scene panels total.
   - For story scenes: dynamically composite the assigned background plate (from `bg_01.jpg`..`bg_16.jpg` matched to the narrative arc / setting) with the remastered V2 hero portraits from `public/seat/*.png` appearing in that scene (with alpha transparency, depth-of-field, rim lighting/aura, and atmospheric VFX per arc), encased in a 1px terminal hairline dark-fantasy border.
   - For title cards (`scene_00.webp`): generate a cinematic title card with dark parchment motif, episode title (EN/KO), and arc insignia.
   - Also update the climax hero images directly under `public/images/webtoon/`:
     `ep01_blizzard_vow.webp`, `ep08_crimson_mane.webp`, `ep15_shadow_duel.webp`, `ep25_assassin_ambush.webp`, `ep40_eternal_shield.webp` (optimized WebP <= 75 KB).
2. Quality & Budget Requirements:
   - Dimensions: exact `800x450` px.
   - WebP format.
   - Strict size bounds: every single image MUST be between `4,096 bytes` (4 KB) and `76,800 bytes` (75 KB), with target mean 25–55 KB.
   - All 840 files MUST yield 840 distinct SHA-256 hashes (zero duplicate or blank images).
3. Verification:
   - Run an automated check on all 840 files in `public/images/webtoon/`: verify file count (840), format (WebP), dimensions (800x450), min/max/average file size, and unique SHA-256 hash count (840).
   - Verify character assets in `public/seat/*.png` remain 100% untouched (`git status -- public/seat/`).

Write your detailed implementation and verification report in:
`/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_worker_m1/handoff.md`.
Send a completion message back when done.
