# Explorer Survey 2 Dispatch
Target: Map Sprite Coordinates, getCardSpriteCoords, Canvas Card Renderer, Grid Offsets, and Sheet Layouts

## 2026-10-18T01:36:37Z
You are Explorer 2 (Sprite Architecture & Coordinates Explorer) for the SNSHero 110-Hero Character Illustration Remaster project.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_2/
You MUST read: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (under ## 2026-10-18T01:34:39Z).

Your mission:
Investigate and document all sprite coordinates, rendering math, and asset sheet architectures:
1. Examine src/lib/utils.ts (specifically getCardSpriteCoords, getCardSpriteStyle) and src/lib/canvasCardRenderer.ts.
2. Determine exact coordinate formulas, offsets, cell dimensions, and layout rules for:
   - public/seat/*.png (256x296 px, IDs 1–110 naming convention and dimensions)
   - public/cards1.png (1000x1000 px, 10x10 grid for IDs 1–100, exact cell width/height, x/y offsets)
   - public/cards2.png (1000x1000 px, 10x10 grid with IDs 101–110 in row 0, check other rows)
   - public/card100.png (1135x1315 px, 10x11 grid for IDs 1–110)
   - public/card100_gemini.png (1024x1024 px, 10x11 grid for IDs 1–110)
   - All 11 faction horizontal sheets: public/character_sheet_*.png (2560x296 px, 10 characters per sheet)
3. Detail any discrepancies or quirks between how CardItem.tsx, canvasCardRenderer.ts, and other UI components load or slice these sprite sheets.
4. Formulate the exact mathematical transformation required to composite individual 256x296 portraits into each of these sprite sheets without coordinate drift or clipping.
5. Write a comprehensive, structured handoff report to: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_2/handoff.md
6. Notify your caller using send_message with a summary and the path to your handoff report.
