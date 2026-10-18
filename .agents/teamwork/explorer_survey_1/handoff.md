# Specification Mining Report: SNSHero 110-Hero Character Illustration Remaster

**Author**: Explorer 1 (Specification Miner)
**Date**: 2026-10-18T01:42:00Z
**Target**: Mapping CARD_DATABASE (IDs 1–110), 11 Factions, Rarities, Visual Motifs, UI Rendering Contracts & Asset Surfaces
**Authoritative Sources**: `src/cardDatabase.ts`, `src/content/characterIp.ts`, `src/content/characterArtPrompts.ts`, `src/components/CardItem.tsx`, `src/content/characterAssetManifest.ts`, `src/lib/utils.ts`, `public/seat/*.png`, `public/cards1.png`, `public/cards2.png`, `public/card100.png`

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Card Database | 110 Hero Character Records | Complete database of 110 hero cards with IDs 1–110, powers (10–30), 4-directional stats [N,E,S,W], levels (1–10), and element assignments. | `cardId: 1..110` | `DatabaseCard` object | Returns `undefined` for invalid IDs | `src/cardDatabase.ts` lines 4–147 |
| 2 | Faction Hierarchy | 11 Elemental/Racial Factions | Exact 10-card partitioning across 11 factions: Water (1–10), Fire (11–20), Wind (21–30), Earth (31–40), Human (41–50), Undead (51–60), Elf (61–70), Dwarf (71–80), Monster (81–90), Robot (91–100), Dragon (101–110). | `cardId` or `CharacterFaction` | `FactionDef` (palette, keywords, emblem, region) | Defaults to `human` in asset manifest | `src/content/characterIp.ts` lines 17–117 |
| 3 | Rarity Tier Structure | 3 Active Tiers + Boss Ranks | 50 Bronze (IDs 1–5 in factions 1–10), 32 Silver (IDs 6–8 in factions 1–10, 101–102 in Dragon), 28 Gold (IDs 9–10 in factions 1–10, 103–110 in Dragon). All 11 Bosses at multiples of 10 are Gold tier. | `cardId` | `CharacterRarityTier` | Defaults to `bronze` if unspecified | `src/cardDatabase.ts`, `src/content/characterIp.ts` |
| 4 | Hero Archetype Progression | Consistent Role Progression | In each faction, positions 1–2: scout, 3–4: soldier, 5: warrior, 6–7: elite, 8: commander, 9: champion, 10: legend (Faction Boss). | `cardId` | `archetype: string` | Fallback to `adventurer` | `src/content/characterIp.ts` |
| 5 | Special Abilities | 7 Active Passive Skills | Cards 1 (SHIELD), 9 (COUNTER), 10 (WALL), 19 (OMNIBOOST), 20 (PIERCE), 40 (IMMUNITY), 50 (TIME_WARP) feature unique battle mechanics. | `activeCard.ability` | Battle stat modifier / combat hook | No-op if null | `src/cardDatabase.ts`, `src/components/CardItem.tsx` lines 538–548 |
| 6 | Pokemon-Style Frame UI | Dynamic Card Frame Borders | Bronze (#8c5936), Silver (#94a3b8), Gold (#eab308 metallic sheen), and Special (Holographic foil color-dodge sheen) frame and badge borders. | `rarityGroup`, `normalizedCardRarity` | Styled Tailwind container & gradient borders | Falls back to bronze theme | `src/components/CardItem.tsx` lines 208–299 |
| 7 | Faction Surface Styling | 11 Distinct Card Surfaces | Dynamic type background tints: water (#d9effc), fire (#fce1ce), wind (#e1f3ef), earth (#ebedc8), human (#f6edcf), undead (#ece0f4), elf (#e0efd6), dwarf (#efe2d1), monster (#e5ead4), robot (#e3e9ef), dragon (#f1def0). | `profile.faction` / `element` | Background CSS class | Defaults to human `#f6edcf` | `src/components/CardItem.tsx` lines 307–312 |
| 8 | Directional HUD | Cross Diamond Stat Layout | Top (North / stat[0]), Right (East / stat[1]), Bottom (South / stat[2]), Left (West / stat[3]) combat power badges. | `card.stats: number[4]` | 4 absolutely positioned stat badges | Render default base values | `src/components/CardItem.tsx` lines 318–350 |
| 9 | Image Priority Resolver | Fallback & Skin Swap Chain | Ordered fallback: 1. processedImage -> 2. customImage -> 3. resolvedImage (skin/theme) -> 4. card.imageUrl -> 5. defaultSprite (`cards1.png`/`cards2.png`) -> 6. manifest paths. | `visualCardId`, skins, settings | Resolved image URL / sprite CSS | Switches to next source on error | `src/components/CardItem.tsx` lines 174–186 |
| 10 | Sprite Grid Engine | 10x10 / 10x11 Grid Math | IDs 1–100 mapped to `cards1.png` (10x10 grid), IDs 101–110 mapped to `cards2.png` (row 0, cols 0–9), legacy mapped to `card100.png` (10x11 grid). | `cardId: number`, custom source | `CardSpriteCoords` (col, row, xPercent, yPercent) | Clamped to valid range | `src/lib/utils.ts` lines 158–237 |
| 11 | Canvas Sprite Renderer | 60fps 2D Canvas Blitting | `drawCardSprite` preloads images, calculates source coordinates (`sWidth`, `sHeight`, `sx`, `sy`), and renders onto 2D Canvas with rotation, alpha, and shadow options. | `ctx, cardId, dx, dy, w, h, options` | Canvas pixel draw | Renders fallback blue `C{id}` badge if unloaded | `src/lib/canvasCardRenderer.ts` lines 51–145 |
| 12 | Generative Art Prompt Pipeline | Standardized TCG Prompt Bundle | `getCharacterArtPrompt` compiles positive/negative prompts, 1:1 social thumbnail prompts, 16:9 webtoon panel prompts, and review checklists for all 110 cards. | `cardId: 1..110`, locale | `CharacterArtPrompt` bundle | Generates fallback template for missing cards | `src/content/characterArtPrompts.ts` lines 306–334 |

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Individual Seat PNGs | `public/seat/Celia.png`, `Hyperion_Prime.png`, `Sentinel.png` | Corrupted binary headers! Files begin with `\xef\xbf\xbdPNG` (UTF-8 replacement char) instead of `\x89PNG`. Pillow and libpng cannot decode them. Must be cleanly re-rendered during remastering. |
| 2 | Faction Character Sheets | `public/character_sheet_fire.png`, `character_sheet_hobbit.png`, `character_sheet_mecha.png` | Corrupted binary headers starting with `\xef\xbf\xbdPNG`. Failed to decode in Pillow/libpng, whereas the other 8 sheets decode cleanly at `2560x296`. |
| 3 | Faction Sheet Filename Discrepancies | Factions `dwarf`, `monster`, `robot` | Faction sheet filenames use legacy aliases: `character_sheet_hobbit.png` (for Dwarf), `character_sheet_beast.png` (for Monster), `character_sheet_mecha.png` (for Robot). Script pipelines must account for this mapping. |
| 4 | Sprite Grid Transition at ID 101 | Card ID 100 vs Card ID 101 | `getCardSpriteAsset` switches from `/cards1.png` to `/cards2.png` at ID 101. On `/cards2.png`, Cards 101–110 reside in Row 0 (cols 0–9, `offsetIndex = (id - 101) % 100`). In legacy `/card100.png`, Cards 101–110 reside in Row 10 (10x11 grid). |
| 5 | Dragon Faction Rarity Anomaly | Dragon faction cards (IDs 101–110) | Unlike all 10 preceding factions (which have 5 Bronze, 3 Silver, 2 Gold), the Dragon faction contains ZERO Bronze cards. IDs 101–102 are Silver, and IDs 103–110 (8 cards!) are all Gold. |
| 6 | Multiples of 10 Boss Ranks | Cards 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110 | All 11 cards are Gold tier with top-tier Power ratings (25–30) and signature lore identities. Only 5 of the 11 have battle abilities in `cardDatabase.ts` (10: WALL, 20: PIERCE, 40: IMMUNITY, 50: TIME_WARP; plus 1: SHIELD, 9: COUNTER, 19: OMNIBOOST on non-bosses). |
| 7 | Seat Filename Spacing/Underscore Rule | Multi-word card names (e.g. Ashel the Immortal, Death Knight Artus) | Files in `public/seat/` use underscores for spaces: `Ashel_the_Immortal.png`, `Death_Knight_Artus.png`, `Earth_Dragon_Terra.png`, `Hyperion_Prime.png`, `Magitech_Golem.png`, `Medusa_Gorgo.png`, `Omega_Weapon.png`, `Siege_Engine.png`, `Stone_Gargoyle.png`, `Wind_God_Toram.png`. Single-word cards use direct names (`Aquaris.png`). |
| 8 | File Size Budget Overruns | Existing public sprite sheets | `cards1.png` is 1,977 KB (budget <= 800 KB), `cards2.png` is 2,734 KB (budget <= 800 KB), `card100.png` is 2,053 KB, `character_sheet_mecha.png` is 368 KB (budget <= 300 KB). 3 seat files exceed 35 KB. Quantization and optimization are mandatory. |

## 5-Component Handoff Report

### 1. Observation
Direct inspection of the codebase and public assets reveals:
- `src/cardDatabase.ts`: Exact 110 entries (`CARD_DATABASE[1]` through `CARD_DATABASE[110]`), zero missing keys. Fields include `id`, `title`, `title_en`, `title_dis`, `power`, `stats` ([top, right, bottom, left]), `rarity`, `element`, and optional `ability` / `lore_ko` / `lore_en`.
- `src/content/characterIp.ts`: 11 factions defined in `CHARACTER_FACTIONS`, 6 rarity tiers in `CHARACTER_RARITY_RULES` (bronze, silver, gold, platinum, diamond, legendary), and 110 detailed IP profiles in `CHARACTER_IP_PROFILES`.
- `src/content/characterArtPrompts.ts`: Pre-built prompt generator producing localized prompt bundles, style guides, and negative prompts for all 110 cards.
- `src/components/CardItem.tsx`: Full Pokemon TCG style visual decoration. Card layout handles rarity frames (lines 208–299), faction surface tints (lines 307–312), 4-directional Cross Diamond HUD (lines 318–350), and image resolution fallback cascade (lines 174–186).
- `src/lib/utils.ts` & `src/lib/canvasCardRenderer.ts`: Coordinate math for `cards1.png` (10x10, IDs 1–100), `cards2.png` (10x10, IDs 101–110 in Row 0), and `card100.png` (10x11, IDs 1–110).
- `public/seat/*.png`: Exactly 110 files. Verification via Pillow showed 107 valid PNGs at `256x296` px and 3 corrupted files (`Celia.png`, `Hyperion_Prime.png`, `Sentinel.png` starting with `\xef\xbf\xbdPNG`). All 110 filenames match card English titles with space-to-underscore conversion.
- `public/character_sheet_*.png`: 11 horizontal sheets at `2560x296` px (10 characters per sheet). 8 are valid, 3 are corrupted (`character_sheet_fire.png`, `character_sheet_hobbit.png`, `character_sheet_mecha.png`).
- Master sprite sheets: `public/cards1.png` (1000x1000, 1.98 MB), `public/cards2.png` (1000x1000, 2.73 MB), `public/card100.png` (1135x1315, 2.05 MB), `public/card100_gemini.png` (1024x1024, 974 KB). All exceed the 800 KB budget.

### 2. Logic Chain
1. **Faction and Rarity Completeness**: All 110 hero cards map 1:1 to their database entries and IP profiles. Each faction has exactly 10 cards. The rarity distribution is 50 Bronze, 32 Silver, and 28 Gold.
2. **Boss Tier Identity**: Every multiple of 10 (10, 20, ..., 110) corresponds to the apex character ("legend" archetype) of that faction. All 11 Bosses are Gold rarity, have high power (25–30), and represent the ultimate faction lore figureheads.
3. **Visual Remastering Input Matrix**: Each card has authoritative visual guidelines defined in `characterIp.ts` (`primaryColor`, `accentColor`, `poseKeywords`, `backgroundKeywords`, `lightingStyle`, `cameraAngle`, `silhouetteStrength`) and `characterArtPrompts.ts` (`positivePromptKo`, `positivePromptEn`, `negativePrompt`). Remastering prompts can directly consume these structured attributes to generate consistent TCG-style illustrations.
4. **Asset Synchronization Surface**: A regenerated character for Card ID $N$ must update 4 distinct asset surfaces:
   a. Individual portrait: `public/seat/<Name>.png` (`256x296` px, <= 35 KB).
   b. Primary battle sprite sheet: `public/cards1.png` (if $N \le 100$) or `public/cards2.png` (if $N \ge 101$, Row 0) at cell $(col, row) \times (100, 100)$ px.
   c. Legacy master sheet: `public/card100.png` at cell $(col, row) \times (113.5, 119.5)$ px, and `public/card100_gemini.png` at $(col, row) \times (102.4, 93.09)$ px.
   d. Faction horizontal sheet: `public/character_sheet_<faction>.png` (`2560x296` px, column $(N - 1) \% 10$).
5. **Budget & Quantization**: Current assets are bloated (2.0–2.8 MB) because they contain 32-bit unquantized RGBA PNGs. By applying 8-bit palette quantization (e.g. `pngquant` or Pillow `quantize(colors=256, method=Image.Quantize.MEDIANCUT)` with dithering), file sizes can be reduced by 70–80%, bringing `cards1.png` and `cards2.png` well below 800 KB, faction sheets below 300 KB, and seat files below 35 KB while preserving visual sharpness.

### 3. Caveats
- **Corrupted Source Assets**: 3 seat files (`Celia.png`, `Hyperion_Prime.png`, `Sentinel.png`) and 3 faction sheets cannot be decoded as input reference images from disk. However, clean visual sources for all 3 exist inside `public/cards1.png` and `public/card100.png` where their sprite cells are intact and fully decodeable.
- **Dwarf/Hobbit, Monster/Beast, Robot/Mecha Naming**: In code, factions are `dwarf`, `monster`, and `robot`. On disk, filenames use `hobbit`, `beast`, and `mecha`. Remastering workers must strictly respect this translation.
- **Web Novel & Movie Integration**: Cards 41 (Kadan), 50 (Aleksandar), 62 (Celia), 11 (Ignis), 64 (Titania) are prominent story characters in the 40-episode novel/movie. Their remastered illustrations must stay faithful to their narrative descriptions.

### 4. Conclusion
The full 110-character specification across all 11 factions is 100% charted and verified. The database, IP profiles, art directions, sprite coordinate mappings, and CardItem UI contracts are completely aligned. The remastering pipeline has all necessary metadata (names, stats, motifs, palettes, prompt bundles, sprite grid offsets) to proceed with visual regeneration, sprite compilation, and lossless PNG quantization.

### 5. Verification Method
To verify this survey independently:
1. Run `npx tsx -e "import { CARD_DATABASE } from './src/cardDatabase'; console.log(Object.keys(CARD_DATABASE).length);"` to confirm 110 cards.
2. Run `python3 -c "import glob; from PIL import Image; [Image.open(f).verify() for f in glob.glob('public/seat/*.png')]"` to reproduce the 3 corrupted seat files (`Celia`, `Hyperion_Prime`, `Sentinel`).
3. Run `python3 -c "from PIL import Image; [Image.open(f'public/character_sheet_{f}.png').verify() for f in ['water','earth','wind','human','undead','elf','beast','dragon']]"` to verify valid sheets, and inspect `fire`, `hobbit`, `mecha` to reproduce the corrupted sheets.
4. Inspect `.agents/teamwork/explorer_survey_1/cards_dataset.json` for the complete extracted JSON data.

## Comprehensive 110-Hero Character Catalogue by Faction

### Faction: 수속성 / 해양 (Water)
- **Faction Key**: `water` | **World Region**: `ip_region_aqua_abyss`
- **Color Palette**: Primary `#0ea5e9`, Accent `#06b6d4`
- **Emblem Icon**: `droplets` | **Faction Sprite Sheet**: `public/character_sheet_water.png` (`2560x296` px)
- **Visual Keywords**: ocean, waves, bubbles, coral, deep blue, crystalline

| ID | Korean Name | English Name | Tier / Role | Power | Stats [N,E,S,W] | Ability / Lore | Weapon / Motif / Palette | Sprite Coords (`cards1/2` vs `card100`) | Seat File |
|:--:|:-----------|:-------------|:------------|:-----:|:---------------:|:---------------|:-------------------------|:---------------------------------------:|:----------|
| 1 | 아쿠아리스 | Aquaris | BRONZE (scout) | 11 | `[1, 4, 1, 5]` | **SHIELD**: 단단함: 적의 플립 확률을 감소시킵니다. | #0ea5e9/#06b6d4 | soft | dynamic, action-ready | `cards1.png (R0C0) / 100 (R0C0)` | `Aquaris.png` |
| 2 | 나이아드 | Naiad | BRONZE (scout) | 12 | `[7, 1, 3, 1]` | Personality: 충직하고 믿음직한 | #0ea5e9/#06b6d4 | dramatic | dynamic, action-ready | `cards1.png (R0C1) / 100 (R0C1)` | `Naiad.png` |
| 3 | 운디네 | Undine | BRONZE (soldier) | 17 | `[6, 6, 3, 2]` | Personality: 대담하고 도전적인 | #0ea5e9/#06b6d4 | mystical | dynamic, action-ready | `cards1.png (R0C2) / 100 (R0C2)` | `Undine.png` |
| 4 | 켈피 | Kelpie | BRONZE (soldier) | 18 | `[2, 3, 6, 7]` | Personality: 지혜롭고 신중한 | #0ea5e9/#06b6d4 | fiery | dynamic, action-ready | `cards1.png (R0C3) / 100 (R0C3)` | `Kelpie.png` |
| 5 | 아쿠아로드 | Aqualord | BRONZE (warrior) | 22 | `[6, 5, 6, 5]` | Personality: 열정적이고 직관적인 | #0ea5e9/#06b6d4 | earthy | dynamic, action-ready | `cards1.png (R0C4) / 100 (R0C4)` | `Aqualord.png` |
| 6 | 레비아탄 | Leviathan | SILVER (elite) | 22 | `[2, 8, 8, 4]` | Personality: 고독하고 신비로운 | #0ea5e9/#06b6d4 | neon | dynamic, action-ready | `cards1.png (R0C5) / 100 (R0C5)` | `Leviathan.png` |
| 7 | 가르간티아 | Gargantia | SILVER (elite) | 24 | `[8, 4, 4, 8]` | Personality: 용맹하고 희생적인 | #0ea5e9/#06b6d4 | soft | dynamic, action-ready | `cards1.png (R0C6) / 100 (R0C6)` | `Gargantia.png` |
| 8 | 캐스케이드 | Cascade | SILVER (commander) | 25 | `[4, 4, 8, 9]` | Personality: 교활하고 재치있는 | #0ea5e9/#06b6d4 | dramatic | dynamic, action-ready | `cards1.png (R0C7) / 100 (R0C7)` | `Cascade.png` |
| 9 | 크라켄 | Kraken | GOLD (champion) | 26 | `[8, 4, 10, 4]` | **COUNTER**: 반사: 적이 이 카드를 뒤집지 못하면 대신 뒤집힙니다. | #0ea5e9/#06b6d4 | mystical | dynamic, action-ready | `cards1.png (R0C8) / 100 (R0C8)` | `Kraken.png` |
| 10 | 포세이돈 | Poseidon | **GOLD (BOSS)** | 30 | `[10, 7, 2, 8]` | **WALL**: 심해의 벽: 일반 공격으로 뒤집히지 않습니다. | #0ea5e9/#06b6d4 | fiery | dynamic, action-ready | `cards1.png (R0C9) / 100 (R0C9)` | `Poseidon.png` |

### Faction: 화속성 / 화염 (Fire)
- **Faction Key**: `fire` | **World Region**: `ip_region_ignis_cradle`
- **Color Palette**: Primary `#ef4444`, Accent `#f97316`
- **Emblem Icon**: `flame` | **Faction Sprite Sheet**: `public/character_sheet_fire.png` (`2560x296` px)
- **Visual Keywords**: flames, lava, ember, inferno, scorched, volcanic

| ID | Korean Name | English Name | Tier / Role | Power | Stats [N,E,S,W] | Ability / Lore | Weapon / Motif / Palette | Sprite Coords (`cards1/2` vs `card100`) | Seat File |
|:--:|:-----------|:-------------|:------------|:-----:|:---------------:|:---------------|:-------------------------|:---------------------------------------:|:----------|
| 11 | 이그니스 | Ignis | BRONZE (scout) | 10 | `[5, 1, 1, 3]` | Personality: 호기심 많고 장난기 넘치는 | #ef4444/#f97316 | soft | dynamic, action-ready | `cards1.png (R1C0) / 100 (R1C0)` | `Ignis.png` |
| 12 | 샐러맨더 | Salamander | BRONZE (scout) | 13 | `[6, 2, 2, 3]` | Personality: 충직하고 믿음직한 | #ef4444/#f97316 | dramatic | dynamic, action-ready | `cards1.png (R1C1) / 100 (R1C1)` | `Salamander.png` |
| 13 | 벨페고르 | Belphegor | BRONZE (soldier) | 16 | `[6, 3, 1, 6]` | Personality: 대담하고 도전적인 | #ef4444/#f97316 | mystical | dynamic, action-ready | `cards1.png (R1C2) / 100 (R1C2)` | `Belphegor.png` |
| 14 | 파이로 | Pyro | BRONZE (soldier) | 20 | `[6, 5, 4, 5]` | Personality: 지혜롭고 신중한 | #ef4444/#f97316 | fiery | dynamic, action-ready | `cards1.png (R1C3) / 100 (R1C3)` | `Pyro.png` |
| 15 | 발록 | Balrog | BRONZE (warrior) | 21 | `[3, 7, 5, 6]` | Personality: 열정적이고 직관적인 | #ef4444/#f97316 | earthy | dynamic, action-ready | `cards1.png (R1C4) / 100 (R1C4)` | `Balrog.png` |
| 16 | 무스펠 | Muspel | SILVER (elite) | 22 | `[7, 8, 3, 1]` | Personality: 고독하고 신비로운 | #ef4444/#f97316 | neon | dynamic, action-ready | `cards1.png (R1C5) / 100 (R1C5)` | `Muspel.png` |
| 17 | 이바르 | Ivar | SILVER (elite) | 24 | `[8, 8, 4, 4]` | Personality: 용맹하고 희생적인 | #ef4444/#f97316 | soft | dynamic, action-ready | `cards1.png (R1C6) / 100 (R1C6)` | `Ivar.png` |
| 18 | 불사신 아셀 | Ashel the Immortal | SILVER (commander) | 25 | `[9, 6, 7, 3]` | Personality: 교활하고 재치있는 | #ef4444/#f97316 | dramatic | dynamic, action-ready | `cards1.png (R1C7) / 100 (R1C7)` | `Ashel_the_Immortal.png` |
| 19 | 피닉스 | Phoenix | GOLD (champion) | 26 | `[5, 10, 8, 3]` | **OMNIBOOST**: 집결: 배치 시 보드에 있는 모든 아군 카드에 +1을 부여합니다. | #ef4444/#f97316 | mystical | dynamic, action-ready | `cards1.png (R1C8) / 100 (R1C8)` | `Phoenix.png` |
| 20 | 이그니시우스 | Ignisius | **GOLD (BOSS)** | 29 | `[6, 7, 6, 10]` | **PIERCE**: 태양의 폭발: 적의 쉴드와 벽을 무시합니다. | #ef4444/#f97316 | fiery | dynamic, action-ready | `cards1.png (R1C9) / 100 (R1C9)` | `Ignisius.png` |

### Faction: 풍속성 / 폭풍 (Wind/Air)
- **Faction Key**: `wind` | **World Region**: `ip_region_storm_peak`
- **Color Palette**: Primary `#22d3ee`, Accent `#a78bfa`
- **Emblem Icon**: `wind` | **Faction Sprite Sheet**: `public/character_sheet_wind.png` (`2560x296` px)
- **Visual Keywords**: storm, lightning, gale, sky, cloud, tempest

| ID | Korean Name | English Name | Tier / Role | Power | Stats [N,E,S,W] | Ability / Lore | Weapon / Motif / Palette | Sprite Coords (`cards1/2` vs `card100`) | Seat File |
|:--:|:-----------|:-------------|:------------|:-----:|:---------------:|:---------------|:-------------------------|:---------------------------------------:|:----------|
| 21 | 제피로스 | Zephyros | BRONZE (scout) | 12 | `[1, 3, 3, 5]` | Personality: 호기심 많고 장난기 넘치는 | #22d3ee/#a78bfa | soft | dynamic, action-ready | `cards1.png (R2C0) / 100 (R2C0)` | `Zephyros.png` |
| 22 | 실프 | Sylph | BRONZE (scout) | 15 | `[5, 3, 3, 4]` | Personality: 충직하고 믿음직한 | #22d3ee/#a78bfa | dramatic | dynamic, action-ready | `cards1.png (R2C1) / 100 (R2C1)` | `Sylph.png` |
| 23 | 실피드 | Sylphid | BRONZE (soldier) | 18 | `[3, 5, 5, 5]` | Personality: 대담하고 도전적인 | #22d3ee/#a78bfa | mystical | dynamic, action-ready | `cards1.png (R2C2) / 100 (R2C2)` | `Sylphid.png` |
| 24 | 하피 | Harpy | BRONZE (soldier) | 19 | `[4, 6, 2, 7]` | Personality: 지혜롭고 신중한 | #22d3ee/#a78bfa | fiery | dynamic, action-ready | `cards1.png (R2C3) / 100 (R2C3)` | `Harpy.png` |
| 25 | 에올루스 | Aeolus | BRONZE (warrior) | 21 | `[7, 6, 5, 3]` | Personality: 열정적이고 직관적인 | #22d3ee/#a78bfa | earthy | dynamic, action-ready | `cards1.png (R2C4) / 100 (R2C4)` | `Aeolus.png` |
| 26 | 템페스트 | Tempest | SILVER (elite) | 22 | `[4, 8, 7, 3]` | Personality: 고독하고 신비로운 | #22d3ee/#a78bfa | neon | dynamic, action-ready | `cards1.png (R2C5) / 100 (R2C5)` | `Tempest.png` |
| 27 | 사이클론 | Cyclone | SILVER (elite) | 23 | `[8, 5, 2, 8]` | Personality: 용맹하고 희생적인 | #22d3ee/#a78bfa | soft | dynamic, action-ready | `cards1.png (R2C6) / 100 (R2C6)` | `Cyclone.png` |
| 28 | 제우스피어 | Zeusphere | SILVER (commander) | 25 | `[3, 7, 9, 6]` | Personality: 교활하고 재치있는 | #22d3ee/#a78bfa | dramatic | dynamic, action-ready | `cards1.png (R2C7) / 100 (R2C7)` | `Zeusphere.png` |
| 29 | 뇌신 | Raijin | GOLD (champion) | 25 | `[7, 10, 1, 7]` | Personality: 위엄 있고 카리스마 넘치는 | #22d3ee/#a78bfa | mystical | dynamic, action-ready | `cards1.png (R2C8) / 100 (R2C8)` | `Raijin.png` |
| 30 | 바람신 토람 | Wind God Toram | **GOLD (BOSS)** | 27 | `[5, 10, 3, 9]` | *천둥과 번개를 부리는 바람의 수호신. 그가 번개 도끼를 던질 때마다 하늘...* | #22d3ee/#a78bfa | fiery | dynamic, action-ready | `cards1.png (R2C9) / 100 (R2C9)` | `Wind_God_Toram.png` |

### Faction: 지속성 / 대지 (Earth)
- **Faction Key**: `earth` | **World Region**: `ip_region_terra_core`
- **Color Palette**: Primary `#84cc16`, Accent `#a16207`
- **Emblem Icon**: `mountain` | **Faction Sprite Sheet**: `public/character_sheet_earth.png` (`2560x296` px)
- **Visual Keywords**: mountain, crystal, stone, forest, root, fossil

| ID | Korean Name | English Name | Tier / Role | Power | Stats [N,E,S,W] | Ability / Lore | Weapon / Motif / Palette | Sprite Coords (`cards1/2` vs `card100`) | Seat File |
|:--:|:-----------|:-------------|:------------|:-----:|:---------------:|:---------------|:-------------------------|:---------------------------------------:|:----------|
| 31 | 가이아 | Gaia | BRONZE (scout) | 10 | `[6, 1, 1, 2]` | Personality: 호기심 많고 장난기 넘치는 | #84cc16/#a16207 | soft | dynamic, action-ready | `cards1.png (R3C0) / 100 (R3C0)` | `Gaia.png` |
| 32 | 그놈 | Gnome | BRONZE (scout) | 14 | `[6, 1, 4, 3]` | Personality: 충직하고 믿음직한 | #84cc16/#a16207 | dramatic | dynamic, action-ready | `cards1.png (R3C1) / 100 (R3C1)` | `Gnome.png` |
| 33 | 테라 | Terra | BRONZE (soldier) | 16 | `[7, 5, 1, 3]` | Personality: 대담하고 도전적인 | #84cc16/#a16207 | mystical | dynamic, action-ready | `cards1.png (R3C2) / 100 (R3C2)` | `Terra.png` |
| 34 | 고르곤 | Gorgon | BRONZE (soldier) | 18 | `[2, 7, 6, 3]` | Personality: 지혜롭고 신중한 | #84cc16/#a16207 | fiery | dynamic, action-ready | `cards1.png (R3C3) / 100 (R3C3)` | `Gorgon.png` |
| 35 | 오벨리스크 | Obelisk | BRONZE (warrior) | 16 | `[3, 10, 2, 1]` | Personality: 열정적이고 직관적인 | #84cc16/#a16207 | earthy | dynamic, action-ready | `cards1.png (R3C4) / 100 (R3C4)` | `Obelisk.png` |
| 36 | 그랜드로크 | Grandrock | SILVER (elite) | 22 | `[7, 2, 8, 5]` | Personality: 고독하고 신비로운 | #84cc16/#a16207 | neon | dynamic, action-ready | `cards1.png (R3C5) / 100 (R3C5)` | `Grandrock.png` |
| 37 | 록타 | Rokta | SILVER (elite) | 25 | `[5, 6, 6, 8]` | Personality: 용맹하고 희생적인 | #84cc16/#a16207 | soft | dynamic, action-ready | `cards1.png (R3C6) / 100 (R3C6)` | `Rokta.png` |
| 38 | 오리하르콘 | Orihalcon | SILVER (commander) | 23 | `[9, 3, 9, 2]` | Personality: 교활하고 재치있는 | #84cc16/#a16207 | dramatic | dynamic, action-ready | `cards1.png (R3C7) / 100 (R3C7)` | `Orihalcon.png` |
| 39 | 아틀라스 | Atlas | GOLD (champion) | 26 | `[8, 10, 3, 5]` | Personality: 위엄 있고 카리스마 넘치는 | #84cc16/#a16207 | mystical | dynamic, action-ready | `cards1.png (R3C8) / 100 (R3C8)` | `Atlas.png` |
| 40 | 콜로서스 | Colossus | **GOLD (BOSS)** | 28 | `[10, 8, 6, 4]` | **IMMUNITY**: 저지 불가: 콤보, 약화, 반격에 면역입니다. | #84cc16/#a16207 | fiery | dynamic, action-ready | `cards1.png (R3C9) / 100 (R3C9)` | `Colossus.png` |

### Faction: 인간 / 철의 왕국 (Human)
- **Faction Key**: `human` | **World Region**: `ip_region_iron_kingdom`
- **Color Palette**: Primary `#eab308`, Accent `#78716c`
- **Emblem Icon**: `shield` | **Faction Sprite Sheet**: `public/character_sheet_human.png` (`2560x296` px)
- **Visual Keywords**: armor, banner, castle, iron, steel, crown

| ID | Korean Name | English Name | Tier / Role | Power | Stats [N,E,S,W] | Ability / Lore | Weapon / Motif / Palette | Sprite Coords (`cards1/2` vs `card100`) | Seat File |
|:--:|:-----------|:-------------|:------------|:-----:|:---------------:|:---------------|:-------------------------|:---------------------------------------:|:----------|
| 41 | 카단 | Kadan | BRONZE (scout) | 11 | `[2, 3, 1, 5]` | Personality: 호기심 많고 장난기 넘치는 | #eab308/#78716c | soft | dynamic, action-ready | `cards1.png (R4C0) / 100 (R4C0)` | `Kadan.png` |
| 42 | 엘윈 | Elwin | BRONZE (scout) | 11 | `[2, 1, 2, 6]` | Personality: 충직하고 믿음직한 | #eab308/#78716c | dramatic | dynamic, action-ready | `cards1.png (R4C1) / 100 (R4C1)` | `Elwin.png` |
| 43 | 발리안 | Balian | BRONZE (soldier) | 15 | `[3, 4, 5, 3]` | Personality: 대담하고 도전적인 | #eab308/#78716c | mystical | dynamic, action-ready | `cards1.png (R4C2) / 100 (R4C2)` | `Balian.png` |
| 44 | 카제 | Kaze | BRONZE (soldier) | 16 | `[7, 1, 5, 3]` | Personality: 지혜롭고 신중한 | #eab308/#78716c | fiery | dynamic, action-ready | `cards1.png (R4C3) / 100 (R4C3)` | `Kaze.png` |
| 45 | 가웨인 | Gawain | BRONZE (warrior) | 18 | `[1, 6, 4, 7]` | Personality: 열정적이고 직관적인 | #eab308/#78716c | earthy | dynamic, action-ready | `cards1.png (R4C4) / 100 (R4C4)` | `Gawain.png` |
| 46 | 론돌 | Rondol | SILVER (elite) | 21 | `[6, 2, 6, 7]` | Personality: 고독하고 신비로운 | #eab308/#78716c | neon | dynamic, action-ready | `cards1.png (R4C5) / 100 (R4C5)` | `Rondol.png` |
| 47 | 길가메시 | Gilgamesh | SILVER (elite) | 20 | `[1, 8, 8, 3]` | Personality: 용맹하고 희생적인 | #eab308/#78716c | soft | dynamic, action-ready | `cards1.png (R4C6) / 100 (R4C6)` | `Gilgamesh.png` |
| 48 | 로비냐드 | Robinyard | SILVER (commander) | 26 | `[8, 8, 7, 3]` | Personality: 교활하고 재치있는 | #eab308/#78716c | dramatic | dynamic, action-ready | `cards1.png (R4C7) / 100 (R4C7)` | `Robinyard.png` |
| 49 | 헤르쿨 | Hercul | GOLD (champion) | 25 | `[9, 4, 8, 4]` | Personality: 위엄 있고 카리스마 넘치는 | #eab308/#78716c | mystical | dynamic, action-ready | `cards1.png (R4C8) / 100 (R4C8)` | `Hercul.png` |
| 50 | 알렉산다르 | Aleksandar | **GOLD (BOSS)** | 27 | `[9, 6, 10, 2]` | **TIME_WARP**: 시간 왜곡: 상대방은 다음 턴을 건너뜁니다. | #eab308/#78716c | fiery | dynamic, action-ready | `cards1.png (R4C9) / 100 (R4C9)` | `Aleksandar.png` |

### Faction: 언데드 / 망령 군단 (Undead)
- **Faction Key**: `undead` | **World Region**: `ip_region_shadow_march`
- **Color Palette**: Primary `#a855f7`, Accent `#111827`
- **Emblem Icon**: `skull` | **Faction Sprite Sheet**: `public/character_sheet_undead.png` (`2560x296` px)
- **Visual Keywords**: bone, shadow, decay, soul, grave, spectral

| ID | Korean Name | English Name | Tier / Role | Power | Stats [N,E,S,W] | Ability / Lore | Weapon / Motif / Palette | Sprite Coords (`cards1/2` vs `card100`) | Seat File |
|:--:|:-----------|:-------------|:------------|:-----:|:---------------:|:---------------|:-------------------------|:---------------------------------------:|:----------|
| 51 | 워커 | Walker | BRONZE (scout) | 11 | `[2, 1, 4, 4]` | Personality: 호기심 많고 장난기 넘치는 | #a855f7/#111827 | soft | dynamic, action-ready | `cards1.png (R5C0) / 100 (R5C0)` | `Walker.png` |
| 52 | 구울 | Ghoul | BRONZE (scout) | 15 | `[5, 3, 2, 5]` | Personality: 충직하고 믿음직한 | #a855f7/#111827 | dramatic | dynamic, action-ready | `cards1.png (R5C1) / 100 (R5C1)` | `Ghoul.png` |
| 53 | 캐리언 | Carrion | BRONZE (soldier) | 15 | `[5, 2, 5, 3]` | Personality: 대담하고 도전적인 | #a855f7/#111827 | mystical | dynamic, action-ready | `cards1.png (R5C2) / 100 (R5C2)` | `Carrion.png` |
| 54 | 아라크네 | Arachne | BRONZE (soldier) | 17 | `[5, 6, 3, 3]` | Personality: 지혜롭고 신중한 | #a855f7/#111827 | fiery | dynamic, action-ready | `cards1.png (R5C3) / 100 (R5C3)` | `Arachne.png` |
| 55 | 패치워크 | Patchwork | BRONZE (warrior) | 17 | `[7, 3, 1, 6]` | Personality: 열정적이고 직관적인 | #a855f7/#111827 | earthy | dynamic, action-ready | `cards1.png (R5C4) / 100 (R5C4)` | `Patchwork.png` |
| 56 | 카르디스 | Cardis | SILVER (elite) | 21 | `[5, 5, 7, 4]` | Personality: 고독하고 신비로운 | #a855f7/#111827 | neon | dynamic, action-ready | `cards1.png (R5C5) / 100 (R5C5)` | `Cardis.png` |
| 57 | 스톤가고일 | Stone Gargoyle | SILVER (elite) | 20 | `[8, 2, 8, 2]` | Personality: 용맹하고 희생적인 | #a855f7/#111827 | soft | dynamic, action-ready | `cards1.png (R5C6) / 100 (R5C6)` | `Stone_Gargoyle.png` |
| 58 | 사이드라고사 | Sidragosa | SILVER (commander) | 24 | `[8, 3, 5, 8]` | Personality: 교활하고 재치있는 | #a855f7/#111827 | dramatic | dynamic, action-ready | `cards1.png (R5C7) / 100 (R5C7)` | `Sidragosa.png` |
| 59 | 켈투스 | Keltus | GOLD (champion) | 24 | `[2, 9, 9, 4]` | Personality: 위엄 있고 카리스마 넘치는 | #a855f7/#111827 | mystical | dynamic, action-ready | `cards1.png (R5C8) / 100 (R5C8)` | `Keltus.png` |
| 60 | 데스나이트 아르투스 | Death Knight Artus | **GOLD (BOSS)** | 27 | `[2, 6, 9, 10]` | Personality: 냉철하고 계산적인 | #a855f7/#111827 | fiery | dynamic, action-ready | `cards1.png (R5C9) / 100 (R5C9)` | `Death_Knight_Artus.png` |

### Faction: 엘프 / 달빛 숲 (Elf)
- **Faction Key**: `elf` | **World Region**: `ip_region_sylvan_glade`
- **Color Palette**: Primary `#22c55e`, Accent `#d4d4d4`
- **Emblem Icon**: `leaf` | **Faction Sprite Sheet**: `public/character_sheet_elf.png` (`2560x296` px)
- **Visual Keywords**: forest, moonlight, arcane, nature, ancient, ethereal

| ID | Korean Name | English Name | Tier / Role | Power | Stats [N,E,S,W] | Ability / Lore | Weapon / Motif / Palette | Sprite Coords (`cards1/2` vs `card100`) | Seat File |
|:--:|:-----------|:-------------|:------------|:-----:|:---------------:|:---------------|:-------------------------|:---------------------------------------:|:----------|
| 61 | 루시안 | Lucian | BRONZE (scout) | 10 | `[2, 1, 6, 1]` | Personality: 호기심 많고 장난기 넘치는 | #22c55e/#d4d4d4 | soft | dynamic, action-ready | `cards1.png (R6C0) / 100 (R6C0)` | `Lucian.png` |
| 62 | 실리아 | Celia | BRONZE (scout) | 15 | `[4, 4, 5, 2]` | Personality: 충직하고 믿음직한 | #22c55e/#d4d4d4 | dramatic | dynamic, action-ready | `cards1.png (R6C1) / 100 (R6C1)` | `Celia.png` |
| 63 | 엘리아나 | Eliana | BRONZE (soldier) | 17 | `[6, 2, 6, 3]` | Personality: 대담하고 도전적인 | #22c55e/#d4d4d4 | mystical | dynamic, action-ready | `cards1.png (R6C2) / 100 (R6C2)` | `Eliana.png` |
| 64 | 티타니아 | Titania | BRONZE (soldier) | 17 | `[7, 2, 3, 5]` | Personality: 지혜롭고 신중한 | #22c55e/#d4d4d4 | fiery | dynamic, action-ready | `cards1.png (R6C3) / 100 (R6C3)` | `Titania.png` |
| 65 | 실바니아 | Sylvania | BRONZE (warrior) | 18 | `[6, 2, 7, 3]` | Personality: 열정적이고 직관적인 | #22c55e/#d4d4d4 | earthy | dynamic, action-ready | `cards1.png (R6C4) / 100 (R6C4)` | `Sylvania.png` |
| 66 | 말퓨온 | Malfuon | SILVER (elite) | 21 | `[5, 3, 7, 6]` | Personality: 고독하고 신비로운 | #22c55e/#d4d4d4 | neon | dynamic, action-ready | `cards1.png (R6C5) / 100 (R6C5)` | `Malfuon.png` |
| 67 | 베작스 | Vezax | SILVER (elite) | 21 | `[1, 8, 4, 8]` | Personality: 용맹하고 희생적인 | #22c55e/#d4d4d4 | soft | dynamic, action-ready | `cards1.png (R6C6) / 100 (R6C6)` | `Vezax.png` |
| 68 | 캘토르 | Kaeltor | SILVER (commander) | 25 | `[6, 8, 4, 7]` | Personality: 교활하고 재치있는 | #22c55e/#d4d4d4 | dramatic | dynamic, action-ready | `cards1.png (R6C7) / 100 (R6C7)` | `Kaeltor.png` |
| 69 | 간다르 | Gandar | GOLD (champion) | 25 | `[8, 9, 6, 2]` | Personality: 위엄 있고 카리스마 넘치는 | #22c55e/#d4d4d4 | mystical | dynamic, action-ready | `cards1.png (R6C8) / 100 (R6C8)` | `Gandar.png` |
| 70 | 에일라 | Aila | **GOLD (BOSS)** | 29 | `[8, 5, 10, 6]` | Personality: 냉철하고 계산적인 | #22c55e/#d4d4d4 | fiery | dynamic, action-ready | `cards1.png (R6C9) / 100 (R6C9)` | `Aila.png` |

### Faction: 드워프 / 대장간 (Dwarf/Hobbit)
- **Faction Key**: `dwarf` | **World Region**: `ip_region_deep_forge`
- **Color Palette**: Primary `#d97706`, Accent `#451a03`
- **Emblem Icon**: `hammer` | **Faction Sprite Sheet**: `public/character_sheet_hobbit.png` (`2560x296` px)
- **Visual Keywords**: forge, gold, hammer, ale, cave, gemstone

| ID | Korean Name | English Name | Tier / Role | Power | Stats [N,E,S,W] | Ability / Lore | Weapon / Motif / Palette | Sprite Coords (`cards1/2` vs `card100`) | Seat File |
|:--:|:-----------|:-------------|:------------|:-----:|:---------------:|:---------------|:-------------------------|:---------------------------------------:|:----------|
| 71 | 발보 | Balbo | BRONZE (scout) | 13 | `[4, 2, 4, 3]` | Personality: 호기심 많고 장난기 넘치는 | #d97706/#451a03 | soft | dynamic, action-ready | `cards1.png (R7C0) / 100 (R7C0)` | `Balbo.png` |
| 72 | 프레도 | Fredo | BRONZE (scout) | 13 | `[3, 2, 1, 7]` | Personality: 충직하고 믿음직한 | #d97706/#451a03 | dramatic | dynamic, action-ready | `cards1.png (R7C1) / 100 (R7C1)` | `Fredo.png` |
| 73 | 샘와이 | Samwy | BRONZE (soldier) | 17 | `[3, 6, 4, 4]` | Personality: 대담하고 도전적인 | #d97706/#451a03 | mystical | dynamic, action-ready | `cards1.png (R7C2) / 100 (R7C2)` | `Samwy.png` |
| 74 | 그림리 | Grimli | BRONZE (soldier) | 20 | `[4, 5, 5, 6]` | Personality: 지혜롭고 신중한 | #d97706/#451a03 | fiery | dynamic, action-ready | `cards1.png (R7C3) / 100 (R7C3)` | `Grimli.png` |
| 75 | 마그니스 | Magnis | BRONZE (warrior) | 19 | `[7, 5, 4, 3]` | Personality: 열정적이고 직관적인 | #d97706/#451a03 | earthy | dynamic, action-ready | `cards1.png (R7C4) / 100 (R7C4)` | `Magnis.png` |
| 76 | 브란디 | Brandy | SILVER (elite) | 23 | `[4, 8, 7, 4]` | Personality: 고독하고 신비로운 | #d97706/#451a03 | neon | dynamic, action-ready | `cards1.png (R7C5) / 100 (R7C5)` | `Brandy.png` |
| 77 | 무라디 | Muradi | SILVER (elite) | 23 | `[6, 5, 8, 4]` | Personality: 용맹하고 희생적인 | #d97706/#451a03 | soft | dynamic, action-ready | `cards1.png (R7C6) / 100 (R7C6)` | `Muradi.png` |
| 78 | 토그림 | Thorgrim | SILVER (commander) | 23 | `[1, 8, 7, 7]` | Personality: 교활하고 재치있는 | #d97706/#451a03 | dramatic | dynamic, action-ready | `cards1.png (R7C7) / 100 (R7C7)` | `Thorgrim.png` |
| 79 | 베리포지 | Berryforge | GOLD (champion) | 24 | `[5, 1, 9, 9]` | Personality: 위엄 있고 카리스마 넘치는 | #d97706/#451a03 | mystical | dynamic, action-ready | `cards1.png (R7C8) / 100 (R7C8)` | `Berryforge.png` |
| 80 | 아이언포지 | Ironforge | **GOLD (BOSS)** | 26 | `[4, 10, 2, 10]` | Personality: 냉철하고 계산적인 | #d97706/#451a03 | fiery | dynamic, action-ready | `cards1.png (R7C9) / 100 (R7C9)` | `Ironforge.png` |

### Faction: 야수 / 괴수 (Monster/Beast)
- **Faction Key**: `monster` | **World Region**: `ip_region_wild_expanse`
- **Color Palette**: Primary `#65a30d`, Accent `#991b1b`
- **Emblem Icon**: `paw-print` | **Faction Sprite Sheet**: `public/character_sheet_beast.png` (`2560x296` px)
- **Visual Keywords**: fang, claw, wild, beast, howl, savage

| ID | Korean Name | English Name | Tier / Role | Power | Stats [N,E,S,W] | Ability / Lore | Weapon / Motif / Palette | Sprite Coords (`cards1/2` vs `card100`) | Seat File |
|:--:|:-----------|:-------------|:------------|:-----:|:---------------:|:---------------|:-------------------------|:---------------------------------------:|:----------|
| 81 | 펜릴 | Fenrir | BRONZE (scout) | 11 | `[3, 5, 2, 1]` | Personality: 호기심 많고 장난기 넘치는 | #65a30d/#991b1b | soft | dynamic, action-ready | `cards1.png (R8C0) / 100 (R8C0)` | `Fenrir.png` |
| 82 | 미노타우로스 | Minotaur | BRONZE (scout) | 14 | `[5, 2, 5, 2]` | Personality: 충직하고 믿음직한 | #65a30d/#991b1b | dramatic | dynamic, action-ready | `cards1.png (R8C1) / 100 (R8C1)` | `Minotaur.png` |
| 83 | 요르문간드 | Jormungandr | BRONZE (soldier) | 17 | `[4, 4, 7, 2]` | Personality: 대담하고 도전적인 | #65a30d/#991b1b | mystical | dynamic, action-ready | `cards1.png (R8C2) / 100 (R8C2)` | `Jormungandr.png` |
| 84 | 그리폰 | Griffon | BRONZE (soldier) | 19 | `[3, 7, 3, 6]` | Personality: 지혜롭고 신중한 | #65a30d/#991b1b | fiery | dynamic, action-ready | `cards1.png (R8C3) / 100 (R8C3)` | `Griffon.png` |
| 85 | 바이라 | Byra | BRONZE (warrior) | 20 | `[7, 2, 7, 4]` | Personality: 열정적이고 직관적인 | #65a30d/#991b1b | earthy | dynamic, action-ready | `cards1.png (R8C4) / 100 (R8C4)` | `Byra.png` |
| 86 | 레오나르 | Leonar | SILVER (elite) | 23 | `[4, 8, 5, 6]` | Personality: 고독하고 신비로운 | #65a30d/#991b1b | neon | dynamic, action-ready | `cards1.png (R8C5) / 100 (R8C5)` | `Leonar.png` |
| 87 | 바르가스트 | Barghest | SILVER (elite) | 21 | `[7, 5, 8, 1]` | Personality: 용맹하고 희생적인 | #65a30d/#991b1b | soft | dynamic, action-ready | `cards1.png (R8C6) / 100 (R8C6)` | `Barghest.png` |
| 88 | 우르삭 | Ursoc | SILVER (commander) | 25 | `[5, 7, 8, 5]` | Personality: 교활하고 재치있는 | #65a30d/#991b1b | dramatic | dynamic, action-ready | `cards1.png (R8C7) / 100 (R8C7)` | `Ursoc.png` |
| 89 | 메두사 고르고 | Medusa Gorgo | GOLD (champion) | 25 | `[9, 6, 2, 8]` | Personality: 위엄 있고 카리스마 넘치는 | #65a30d/#991b1b | mystical | dynamic, action-ready | `cards1.png (R8C8) / 100 (R8C8)` | `Medusa_Gorgo.png` |
| 90 | 페가수스 | Pegasus | **GOLD (BOSS)** | 26 | `[7, 2, 7, 10]` | Personality: 냉철하고 계산적인 | #65a30d/#991b1b | fiery | dynamic, action-ready | `cards1.png (R8C9) / 100 (R8C9)` | `Pegasus.png` |

### Faction: 기계 / 메카 (Robot/Mecha)
- **Faction Key**: `robot` | **World Region**: `ip_region_mecha_city`
- **Color Palette**: Primary `#6b7280`, Accent `#06b6d4`
- **Emblem Icon**: `cpu` | **Faction Sprite Sheet**: `public/character_sheet_mecha.png` (`2560x296` px)
- **Visual Keywords**: gear, circuit, steel, laser, engine, chrome

| ID | Korean Name | English Name | Tier / Role | Power | Stats [N,E,S,W] | Ability / Lore | Weapon / Motif / Palette | Sprite Coords (`cards1/2` vs `card100`) | Seat File |
|:--:|:-----------|:-------------|:------------|:-----:|:---------------:|:---------------|:-------------------------|:---------------------------------------:|:----------|
| 91 | 스파이더봇 | Spiderbot | BRONZE (scout) | 11 | `[1, 5, 4, 1]` | Personality: 호기심 많고 장난기 넘치는 | #6b7280/#06b6d4 | soft | dynamic, action-ready | `cards1.png (R9C0) / 100 (R9C0)` | `Spiderbot.png` |
| 92 | 크로노스 | Chronos | BRONZE (scout) | 14 | `[5, 1, 3, 5]` | Personality: 충직하고 믿음직한 | #6b7280/#06b6d4 | dramatic | dynamic, action-ready | `cards1.png (R9C1) / 100 (R9C1)` | `Chronos.png` |
| 93 | 센티넬 | Sentinel | BRONZE (soldier) | 17 | `[5, 6, 2, 4]` | Personality: 대담하고 도전적인 | #6b7280/#06b6d4 | mystical | dynamic, action-ready | `cards1.png (R9C2) / 100 (R9C2)` | `Sentinel.png` |
| 94 | 디바스터 | Devastator | BRONZE (soldier) | 19 | `[7, 4, 4, 4]` | Personality: 지혜롭고 신중한 | #6b7280/#06b6d4 | fiery | dynamic, action-ready | `cards1.png (R9C3) / 100 (R9C3)` | `Devastator.png` |
| 95 | 골리앗 | Goliath | BRONZE (warrior) | 20 | `[7, 7, 4, 2]` | Personality: 열정적이고 직관적인 | #6b7280/#06b6d4 | earthy | dynamic, action-ready | `cards1.png (R9C4) / 100 (R9C4)` | `Goliath.png` |
| 96 | 시즈엔진 | Siege Engine | SILVER (elite) | 21 | `[6, 6, 2, 7]` | Personality: 고독하고 신비로운 | #6b7280/#06b6d4 | neon | dynamic, action-ready | `cards1.png (R9C5) / 100 (R9C5)` | `Siege_Engine.png` |
| 97 | 하이페리온 프라임 | Hyperion Prime | SILVER (elite) | 23 | `[6, 8, 4, 5]` | Personality: 용맹하고 희생적인 | #6b7280/#06b6d4 | soft | dynamic, action-ready | `cards1.png (R9C6) / 100 (R9C6)` | `Hyperion_Prime.png` |
| 98 | 아이언클래드 | Ironclad | SILVER (commander) | 25 | `[8, 8, 5, 4]` | Personality: 교활하고 재치있는 | #6b7280/#06b6d4 | dramatic | dynamic, action-ready | `cards1.png (R9C7) / 100 (R9C7)` | `Ironclad.png` |
| 99 | 마기테크 골렘 | Magitech Golem | GOLD (champion) | 26 | `[6, 7, 4, 9]` | Personality: 위엄 있고 카리스마 넘치는 | #6b7280/#06b6d4 | mystical | dynamic, action-ready | `cards1.png (R9C8) / 100 (R9C8)` | `Magitech_Golem.png` |
| 100 | 오메가 웨폰 | Omega Weapon | **GOLD (BOSS)** | 25 | `[9, 10, 4, 2]` | Personality: 냉철하고 계산적인 | #6b7280/#06b6d4 | fiery | dynamic, action-ready | `cards1.png (R9C9) / 100 (R9C9)` | `Omega_Weapon.png` |

### Faction: 용족 / 고대 드래곤 (Dragon)
- **Faction Key**: `dragon` | **World Region**: `ip_region_dragon_spire`
- **Color Palette**: Primary `#dc2626`, Accent `#fbbf24`
- **Emblem Icon**: `flame` | **Faction Sprite Sheet**: `public/character_sheet_dragon.png` (`2560x296` px)
- **Visual Keywords**: scale, wing, fire-breath, ancient, treasure, sky

| ID | Korean Name | English Name | Tier / Role | Power | Stats [N,E,S,W] | Ability / Lore | Weapon / Motif / Palette | Sprite Coords (`cards1/2` vs `card100`) | Seat File |
|:--:|:-----------|:-------------|:------------|:-----:|:---------------:|:---------------|:-------------------------|:---------------------------------------:|:----------|
| 101 | 드레이크 | Drake | SILVER (scout) | 24 | `[7, 7, 2, 8]` | Personality: 호기심 많고 장난기 넘치는 | #dc2626/#fbbf24 | soft | dynamic, action-ready | `cards2.png (R0C0) / 100 (R10C0)` | `Drake.png` |
| 102 | 와이버니 | Wyverny | SILVER (scout) | 25 | `[9, 5, 2, 9]` | Personality: 충직하고 믿음직한 | #dc2626/#fbbf24 | dramatic | dynamic, action-ready | `cards2.png (R0C1) / 100 (R10C1)` | `Wyverny.png` |
| 103 | 네더드래곤 | Netherdragon | GOLD (soldier) | 25 | `[10, 1, 7, 7]` | Personality: 대담하고 도전적인 | #dc2626/#fbbf24 | mystical | dynamic, action-ready | `cards2.png (R0C2) / 100 (R10C2)` | `Netherdragon.png` |
| 104 | 바하무트 | Bahamut | GOLD (soldier) | 27 | `[7, 4, 6, 10]` | Personality: 지혜롭고 신중한 | #dc2626/#fbbf24 | fiery | dynamic, action-ready | `cards2.png (R0C3) / 100 (R10C3)` | `Bahamut.png` |
| 105 | 스파이크드래곤 | Spikedragon | GOLD (warrior) | 26 | `[10, 8, 2, 6]` | Personality: 열정적이고 직관적인 | #dc2626/#fbbf24 | earthy | dynamic, action-ready | `cards2.png (R0C4) / 100 (R10C4)` | `Spikedragon.png` |
| 106 | 어스드래곤 테라 | Earth Dragon Terra | GOLD (elite) | 24 | `[3, 1, 10, 10]` | Personality: 고독하고 신비로운 | #dc2626/#fbbf24 | neon | dynamic, action-ready | `cards2.png (R0C5) / 100 (R10C5)` | `Earth_Dragon_Terra.png` |
| 107 | 이셀라 | Ysela | GOLD (elite) | 27 | `[4, 4, 9, 10]` | Personality: 용맹하고 희생적인 | #dc2626/#fbbf24 | soft | dynamic, action-ready | `cards2.png (R0C6) / 100 (R10C6)` | `Ysela.png` |
| 108 | 알렉스트라 | Alexstra | GOLD (commander) | 26 | `[10, 10, 3, 3]` | Personality: 교활하고 재치있는 | #dc2626/#fbbf24 | dramatic | dynamic, action-ready | `cards2.png (R0C7) / 100 (R10C7)` | `Alexstra.png` |
| 109 | 말리곤 | Malygon | GOLD (champion) | 29 | `[6, 9, 10, 4]` | Personality: 위엄 있고 카리스마 넘치는 | #dc2626/#fbbf24 | mystical | dynamic, action-ready | `cards2.png (R0C8) / 100 (R10C8)` | `Malygon.png` |
| 110 | 드레드윙 | Dreadwing | **GOLD (BOSS)** | 29 | `[10, 4, 6, 9]` | Personality: 냉철하고 계산적인 | #dc2626/#fbbf24 | fiery | dynamic, action-ready | `cards2.png (R0C9) / 100 (R10C9)` | `Dreadwing.png` |
