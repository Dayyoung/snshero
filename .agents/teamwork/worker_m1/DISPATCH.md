## 2026-10-18T01:45:05Z
You are Worker M1 for the SNSHero 110-Hero Character Illustration Remaster project.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1/
You MUST read:
1. /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (under ## 2026-10-18T01:34:39Z)
2. /Users/dayyoung/project/snshero/PROJECT.md
3. /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/handoff.md and /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/cards_dataset.json
4. /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_2/handoff.md
5. /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/handoff.md

Write Ownership:
You exclusively own:
- /Users/dayyoung/project/snshero/public/seat/*.png (all 110 individual portrait files)
- Scratch scripts and tools within your working directory /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1/
You MUST NOT modify source code files in src/ or tests/.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Mission (Milestone 1):
1. Recover clean original baseline assets:
   - For the 3 corrupted files (Celia.png, Hyperion_Prime.png, Sentinel.png), retrieve their intact base versions from git commit 94a5ac5b (e.g., via `git show 94a5ac5b:public/seat/Celia.png > ...`).
2. Implement high-density fantasy TCG remastering across all 110 hero characters:
   - For each card (IDs 1–110 across all 11 factions):
     * Preserve original silhouette, character posture, facial structure, racial/elemental motif, and core color palette.
     * Apply high-density visual remastering: multi-pass edge sharpening, contrast enhancement, dynamic tonal curve mapping, specular lighting accentuation, elemental glow/aura rendering tailored to the card's rarity tier (Bronze: grounded natural glow; Silver: refined metallic luster; Gold: luminous arcane resonance; Boss at IDs 10, 20, ..., 110: supreme elemental aura).
     * Ensure each output portrait is exactly 256x296 px RGBA PNG.
3. Optimize portrait file sizes:
   - Apply PNG palette optimization/quantization (using Pillow or Pillow FASTOCTREE) so that EVERY file in public/seat/*.png is <= 35,840 bytes (35 KB) and >= 4,096 bytes (4 KB).
4. Verify results:
   - Ensure all 110 files exist in public/seat/ matching the exact filename convention `${title_en.replace(' ', '_')}.png`.
   - Ensure all 110 files decode as valid PNGs with exact dimensions 256x296.
   - Verify 110 unique SHA-256 hashes (0 duplicates, 0 blank/uniform images).
   - Verify every file is between 4,096 bytes and 35,840 bytes.
5. Write your handoff report to /Users/dayyoung/project/snshero/.agents/teamwork/worker_m1/handoff.md detailing all executed steps, sample cards remastered, file size stats, and verification results.
6. Notify your caller using send_message with a concise summary and report path.
