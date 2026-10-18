# BRIEFING — 2026-10-18T01:42:00Z

## Mission
Investigate and document all sprite coordinates, rendering math, and asset sheet architectures across SNSHero codebase for the 110-Hero Character Illustration Remaster.

## 🔒 My Identity
- Archetype: explorer
- Roles: Sprite Architecture & Coordinates Explorer
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_2
- Original parent: f84aca46-e09f-4967-b5d1-281f855a924e
- Milestone: 110-Hero Remaster Survey Phase

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify source code outside working directory
- Focus strictly on sprite coordinates, rendering math, asset sheet architectures, slicing logic, and compositing transformations
- Produce self-contained 5-component handoff.md and notify parent agent

## Current Parent
- Conversation ID: f84aca46-e09f-4967-b5d1-281f855a924e
- Updated: 2026-10-18T01:36:37Z

## Investigation State
- **Explored paths**:
  - `src/lib/utils.ts` (`getCardSpriteCoords`, `getCardSpriteStyle`, `getCardSpriteAsset`, `isSpriteSheet`)
  - `src/lib/canvasCardRenderer.ts` (`drawCardSprite`, image caching, canvas math)
  - `src/content/characterAssetManifest.ts` & `src/content/cardImageVariants.ts`
  - `src/components/CardItem.tsx` (CSS background vs <img> rendering, 19/20 aspect ratio)
  - `public/seat/*.png` (110 files, naming: `title_en.replace(' ', '_') + '.png'`, 256x296)
  - `public/cards1.png` (1000x1000, 10x10 grid, IDs 1–100, 100x100 cells)
  - `public/cards2.png` (1000x1000, 10x10 grid, IDs 101–110 in Row 0, Rows 1–9 legacy)
  - `public/card100.png` (1135x1315, 10x11 grid, IDs 1–110, float cells 113.5 x 119.545)
  - `public/card100_gemini.png` (1024x1024, 10x11 grid, IDs 1–110, currently JPEG disguised as PNG)
  - `public/character_sheet_*.png` (11 files, 2560x296, 10 chars per sheet, 1:1 concatenation of seat portraits)
- **Key findings**:
  - 3 files in `public/seat/` (`Celia.png`, `Hyperion_Prime.png`, `Sentinel.png`) and 3 faction sheets (`fire`, `hobbit`, `mecha`) have corrupted headers with `\xef\xbf\xbdPNG` instead of `\x89PNG`.
  - `card100_gemini.png` is currently an RGB JPEG file with a `.png` extension and no alpha channel; must be converted to true RGBA PNG.
  - Faction sheet filenames use `hobbit` (dwarf), `beast` (monster), `mecha` (robot).
  - PIL RGBA quantization must use `method=Image.Quantize.FASTOCTREE` (method=2) to reduce 2.0MB+ sheets down to ~420KB (<= 800KB budget).
- **Unexplored areas**: None. All 6 target asset groups, rendering paths, and mathematical formulas completely documented.

## Key Decisions Made
- Standardize mathematical formulas for all 6 surfaces.
- Document exact integer/floating cell coordinate formulas and recommend safety padding to eliminate sub-pixel sampling artifacts in Canvas and CSS.
- Provide ready-to-use Python compositing algorithms for downstream worker agents.

## Artifact Index
- `.agents/teamwork/explorer_survey_2/DISPATCH.md` — Received task dispatch
- `.agents/teamwork/explorer_survey_2/BRIEFING.md` — Agent state and working memory
- `.agents/teamwork/explorer_survey_2/progress.md` — Liveness heartbeat
- `.agents/teamwork/explorer_survey_2/handoff.md` — Final structured report
