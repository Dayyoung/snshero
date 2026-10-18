# SNSHero 110-Hero Character Illustration Remaster E2E Test Infrastructure (TEST_INFRA.md)

## 1. Overview & Architecture

This document establishes the comprehensive test architecture, methodology, and coverage criteria for the visual remastering, multi-surface asset synchronization, and web payload optimization of all **110 hero characters** in **SNSHero** (`CARD_DATABASE` IDs 1–110 across 11 elemental/racial factions).

The testing strategy employs a **Dual-Track 4-Tier Automated Verification Framework** driven by a standalone, headless Python 3 test harness (`tests/e2e_character_assets/runner.py`):

```
+---------------------------------------------------------------------------------------------------+
|               SNSHero 110-Hero Character Remaster E2E Test Infrastructure                         |
+---------------------------------------------------------------------------------------------------+
|  Tier 1: Feature Coverage & Asset Integrity (>= 5 tests per feature)                              |
|  - Feature 2 (Seat Portraits): 110 files exist, 110 decode validly, exact 256x296, 110 distinct  |
|    SHA-256 hashes, zero blank/uniform images, alpha transparency preserved.                       |
|  - Feature 3 (Primary Sheets): cards1.png (1000x1000) & cards2.png (1000x1000) exist, decode    |
|    validly, exact dimensions, 10x10 cells populated.                                              |
|  - Feature 4 (Master Sheets): card100.png (1135x1315) & card100_gemini.png (1024x1024 true RGBA) |
|    exist, decode as genuine PNGs (reject JPEG disguise), exact dimensions, alpha preserved.      |
|  - Feature 5 (Faction Sheets): 11 horizontal sheets exist (with aliases hobbit/beast/mecha),      |
|    decode validly, exact 2560x296 dimensions, alpha channel, 10 cells contain rich art.           |
+---------------------------------------------------------------------------------------------------+
|  Tier 2: Boundary & Corner Cases (>= 5 tests per feature)                                         |
|  - Feature 7 (Size Budgets): Seat files in [4 KB, 35 KB]; Master sheets <= 800 KB;               |
|    Faction sheets <= 300 KB; Total aggregate payload <= 10.11 MB.                                 |
|  - Feature 2 & 5 (Header Integrity): 8-byte PNG magic header (\x89PNG\r\n\x1a\n) check on all     |
|    125 PNG assets to catch UTF-8 replacement byte corruptions (\xef\xbf\xbdPNG); IHDR structure. |
|  - Feature 3 & 6 (Grid Boundaries): Boundary ID 100 termination vs ID 101 origin transition;     |
|    Card ID 110 terminal alignment; Rows 1-9 preservation in cards2.png; Boss column 9 alignment; |
|    OOB & negative ID clamping.                                                                    |
+---------------------------------------------------------------------------------------------------+
|  Tier 3: Cross-Feature Combinations & Sprite Coordinate Alignment (Pairwise Coverage)             |
|  - Mathematical coordinate parity: All 110 card IDs verified against getCardSpriteCoords formulas |
|    for cards1/cards2 (10x10), card100 (10x11), and card100_gemini (10x11).                        |
|  - Faction horizontal placement: Exact x = ((id - 1) % 10) * 256, y = 0 mapping.                  |
|  - Pixel synchronization: Normalized visual similarity between public/seat/<Card>.png and sliced   |
|    cells from faction sheets and master sheets.                                                   |
|  - Sub-pixel boundary integrity: Zero edge bleeding / ghosting between adjacent sprite cells.    |
+---------------------------------------------------------------------------------------------------+
|  Tier 4: Real-World Scenarios                                                                     |
|  - CardItem rendering simulation: Surface tint classes and emblems across all 11 factions.         |
|  - Rarity frame & sheen simulation: 50 Bronze, 32 Silver, 28 Gold (11 Bosses at Gold apex).       |
|  - CanvasCardRenderer drawCardSprite blitting: Slicing geometry verified at mini (32px),          |
|    hand (80x92px), board (120x140px), and zoom (256x296px) viewports.                            |
|  - Priority resolver cascade: custom/processed -> default sprite -> seat fallback chain.          |
|  - Total web payload audit: Comprehensive payload benchmark demonstrating >= 50% traffic cut.     |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. 4-Tier Test Suite Specification

### Tier 1: Feature Coverage & Asset Integrity (>= 5 Tests per Feature)

#### T1.1 Individual Seat Portraits (`public/seat/*.png`, Feature 2)
- **Objective**: Ensure all 110 hero character portraits exist, decode cleanly without binary or raster corruption, maintain exact dimensions, have unique visual identity, and preserve alpha transparency.
- **Authoritative Sources**: `PROJECT.md` Feature 2, `ORIGINAL_REQUEST.md` R1 & R2, `cards_dataset.json`.
- **Assertions**:
  1. `T1.F2.1` **File Existence**: All 110 individual portrait files exist in `public/seat/` matching `${title_en.replace(/ /g, '_')}.png`.
  2. `T1.F2.2` **Raster Decode Validity**: All 110 files open and decode without syntax errors (PIL `UnidentifiedImageError`, truncated chunks, or bad CRC).
  3. `T1.F2.3` **Exact Dimensions**: All 110 portraits are exactly `256 x 296` px (width 256, height 296).
  4. `T1.F2.4` **110 Distinct SHA-256 Hashes**: Every portrait file yields a unique cryptographic hash; zero duplicate or clone files.
  5. `T1.F2.5` **Zero Blank / Uniform Images**: Entropy $\ge 2.0$ and pixel standard deviation $\ge 8.0$; zero solid color or empty transparent canvases.
  6. `T1.F2.6` **Alpha Transparency Support**: Image color mode is RGBA, LA, or paletted with alpha transparency enabled.

#### T1.2 Primary 10x10 Sprite Sheets (`public/cards1.png`, `public/cards2.png`, Feature 3)
- **Objective**: Verify standard battle sprite sheets covering IDs 1–100 (`cards1.png`) and IDs 101–110 (`cards2.png`).
- **Authoritative Sources**: `PROJECT.md` Feature 3, `src/lib/utils.ts` (`getCardSpriteCoords`).
- **Assertions**:
  1. `T1.F3.1` **cards1.png Existence**: `public/cards1.png` exists on disk.
  2. `T1.F3.2` **cards1.png Decode Validity**: Decodes cleanly as a genuine PNG image.
  3. `T1.F3.3` **cards1.png Exact Dimensions**: Exactly `1000 x 1000` px (10 rows $\times$ 10 cols of `100 x 100` px cells).
  4. `T1.F3.4` **cards2.png Existence**: `public/cards2.png` exists on disk.
  5. `T1.F3.5` **cards2.png Decode Validity**: Decodes cleanly as a genuine PNG image.
  6. `T1.F3.6` **cards2.png Exact Dimensions**: Exactly `1000 x 1000` px.
  7. `T1.F3.7` **Populated Cell Content**: Sampled cells across `cards1.png` (IDs 1–100) and Row 0 of `cards2.png` (IDs 101–110) contain non-blank artwork.

#### T1.3 Legacy Master 10x11 Sprite Sheets (`public/card100.png`, `public/card100_gemini.png`, Feature 4)
- **Objective**: Verify legacy master sheets covering all 110 characters, strictly enforcing true RGBA format for `card100_gemini.png` to eliminate legacy JPEG disguise.
- **Authoritative Sources**: `PROJECT.md` Feature 4, `ORIGINAL_REQUEST.md` R2.
- **Assertions**:
  1. `T1.F4.1` **card100.png Existence**: `public/card100.png` exists on disk.
  2. `T1.F4.2` **card100.png Decode Validity**: Decodes as valid PNG.
  3. `T1.F4.3` **card100.png Exact Dimensions**: Exactly `1135 x 1315` px (10 cols $\times$ 11 rows).
  4. `T1.F4.4` **card100_gemini.png Existence**: `public/card100_gemini.png` exists on disk.
  5. `T1.F4.5` **card100_gemini.png Genuine PNG Format**: Decodes as `PNG` format (fails if JPEG).
  6. `T1.F4.6` **card100_gemini.png Exact Dimensions**: Exactly `1024 x 1024` px.
  7. `T1.F4.7` **card100_gemini.png True RGBA Alpha**: Mode is `RGBA` or paletted with alpha; zero loss of transparency.

#### T1.4 Faction Horizontal Sheets (`public/character_sheet_*.png`, Feature 5)
- **Objective**: Verify all 11 faction horizontal sheets containing 10 characters per sheet.
- **Authoritative Sources**: `PROJECT.md` Feature 5, `explorer_survey_2/handoff.md`.
- **Assertions**:
  1. `T1.F5.1` **All 11 Sheets Exist**: Confirms files for water, fire, wind, earth, human, undead, elf, hobbit (dwarf), beast (monster), mecha (robot), and dragon.
  2. `T1.F5.2` **Decode Validity**: All 11 sheets decode as valid PNGs.
  3. `T1.F5.3` **Exact Dimensions**: Exactly `2560 x 296` px (10 horizontal cells of `256 x 296` px).
  4. `T1.F5.4` **Alpha Transparency Support**: Alpha channel present across all 11 sheets.
  5. `T1.F5.5` **Non-Blank Cells**: All 10 cells ($0..9$) in each faction sheet contain non-blank character artwork.

---

### Tier 2: Boundary & Corner Cases (>= 5 Tests per Feature)

#### T2.1 Web Traffic & File Size Budgets (Feature 7)
- **Objective**: Guarantee substantial web payload reduction via strict size budgets.
- **Assertions**:
  1. `T2.F7.1` **Seat Upper Budget**: Every `public/seat/*.png` $\le 35,840$ bytes (35 KB).
  2. `T2.F7.2` **Seat Lower Budget**: Every `public/seat/*.png` $\ge 4,096$ bytes (4 KB, preventing empty stubs).
  3. `T2.F7.3` **Master Sheets Budget**: `cards1.png`, `cards2.png`, `card100.png`, `card100_gemini.png` each $\le 819,200$ bytes (800 KB).
  4. `T2.F7.4` **Faction Sheets Budget**: Every `character_sheet_*.png` $\le 307,200$ bytes (300 KB).
  5. `T2.F7.5` **Aggregate Asset Payload Budget**: Total payload across all individual and sheet assets $\le 10,598,400$ bytes (~10.11 MB).

#### T2.2 Binary Header Integrity & Magic Bytes Verification (Features 2 & 5)
- **Objective**: Detect binary corruptions, notably the UTF-8 replacement byte sequence (`\xef\xbf\xbdPNG`) that historically corrupted `Celia.png`, `Hyperion_Prime.png`, `Sentinel.png`, `character_sheet_fire.png`, `character_sheet_hobbit.png`, and `character_sheet_mecha.png`.
- **Assertions**:
  1. `T2.F2.1` **Seat Magic Header**: All 110 seat files start with `\x89PNG\r\n\x1a\n` (`89 50 4E 47 0D 0A 1A 0A`).
  2. `T2.F2.2` **Master Sheets Magic Header**: All 4 master sheets start with valid PNG magic bytes.
  3. `T2.F2.3` **Faction Sheets Magic Header**: All 11 faction sheets start with valid PNG magic bytes.
  4. `T2.F2.4` **IHDR Chunk Validation**: First chunk is 13-byte `IHDR` with non-zero dimensions and valid bit depth.

#### T2.3 Grid Transitions & Boundary IDs (Features 3 & 6)
- **Objective**: Validate critical grid transition points and out-of-bounds safety.
- **Assertions**:
  1. `T2.F6.1` **ID 100 to 101 Transition**: ID 100 is terminal cell of `cards1.png` (col 9, row 9, coords 900,900); ID 101 is origin cell of `cards2.png` (col 0, row 0, coords 0,0).
  2. `T2.F6.2` **ID 110 Terminal Boundary**: ID 110 maps cleanly to `cards2.png` (col 9, row 0) and `card100.png` (col 9, row 10).
  3. `T2.F6.3` **cards2.png Rows 1–9 Preservation**: Rows 1–9 (y in [100, 1000]) are preserved or cleanly formatted without corruption.
  4. `T2.F6.4` **Boss Multiples of 10 Apex Alignment**: Cards 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110 align to apex column 9.
  5. `T2.F6.5` **Out-of-Bounds Clamping Safety**: IDs $\le 0$, $> 110$, or non-numeric clamp safely per `utils.ts` without throwing exceptions.

---

### Tier 3: Cross-Feature Combinations & Sprite Coordinate Alignment (Pairwise Coverage)

- **T3.F6.1 Exhaustive Coordinate Formula Parity (`cards1`/`cards2`)**:
  - For every $id \in [1, 110]$, verify `col`, `row`, `xPercent`, `yPercent` calculated by `getCardSpriteCoords` match formula:
    $$\text{idx} = id \le 100 \ ? \ (id - 1) : (id - 101), \quad \text{col} = \text{idx} \% 10, \quad \text{row} = \lfloor\text{idx} / 10\rfloor$$
- **T3.F6.2 Exhaustive Coordinate Formula Parity (`card100.png` 10x11 Grid)**:
  - For every $id \in [1, 110]$, verify `col = (id - 1) % 10`, `row = Math.floor((id - 1) / 10)`, `yPercent = row * 10%`.
- **T3.F6.3 Faction Horizontal Placement Mapping**:
  - Card $id$ maps to faction $\lfloor(id - 1) / 10\rfloor$ at horizontal offset $x = ((id - 1) \% 10) \times 256$ px, $y = 0$.
- **T3.F6.4 Pixel Synchronization: Faction Sheets vs Seat Portraits**:
  - Crop cell $x \in [c \times 256, (c + 1) \times 256]$ from `character_sheet_{faction}.png` and compute visual correlation against `public/seat/{Card}.png` (threshold $\ge 0.70$).
- **T3.F6.5 Pixel Correspondence: Master Sheets Cells vs Seat Portraits**:
  - Crop cell $(c \times 100, r \times 100)$ from `cards1.png` / `cards2.png` and verify visual correspondence with scaled seat portrait.
- **T3.F6.6 Sub-Pixel Margin Bleed Check**:
  - Verify that cell bounding margins have zero bleed or overlapping artifacts from adjacent cards.

---

### Tier 4: Real-World Scenarios & UI Simulation

- **T4.F1.1 CardItem Faction Surface Tint & Emblem Simulation**:
  - Simulates dynamic type surface background classes across all 11 factions:
    - Water (`bg-[#d9effc]`), Fire (`bg-[#fce1ce]`), Wind (`bg-[#e1f3ef]`), Earth (`bg-[#ebedc8]`)
    - Human (`bg-[#f6edcf]`), Undead (`bg-[#ece0f4]`), Elf (`bg-[#e0efd6]`), Dwarf (`bg-[#efe2d1]`)
    - Monster (`bg-[#e5ead4]`), Robot (`bg-[#e3e9ef]`), Dragon (`bg-[#f1def0]`)
- **T4.F1.2 CardItem Rarity Hierarchy & Boss Apex Verification**:
  - Simulates 50 Bronze, 32 Silver, and 28 Gold cards, confirming that all 11 Bosses at multiples of 10 occupy the Gold apex tier.
- **T4.F1.3 CanvasCardRenderer Slicing Geometry Simulation**:
  - Simulates `drawCardSprite` across 4 standard screen scales:
    - Mini Icon (`32 x 32` px)
    - Hand Card (`80 x 92` px)
    - Board Slot (`120 x 140` px)
    - Zoom / Inspection (`256 x 296` px)
- **T4.F1.4 Image Fallback Priority Cascade Simulation**:
  - Simulates fallback sequence: `customImage` $\to$ `processedImage` $\to$ `resolvedSkin` $\to$ `activeCard.imageUrl` $\to$ default sprite $\to$ individual portrait.
- **T4.F1.5 Total Web Traffic Payload Audit & Reduction Benchmark**:
  - Calculates total network payload across all 125 assets, benchmarking against the unoptimized baseline (~12.9 MB) and enforcing the $\le 10.11$ MB threshold.

---

## 3. Automated Test Runner (`tests/e2e_character_assets/runner.py`)

The test harness is implemented in Python 3 (using Pillow) for high-speed, headless, deterministic execution:

### Invocations

```bash
# Execute entire E2E test suite across all 4 tiers
python3 tests/e2e_character_assets/runner.py

# Execute specific tier
python3 tests/e2e_character_assets/runner.py --tier 1
python3 tests/e2e_character_assets/runner.py --tier 2
python3 tests/e2e_character_assets/runner.py --tier 3
python3 tests/e2e_character_assets/runner.py --tier 4

# Detailed verbose logging (outputs per-card metrics and coordinates)
python3 tests/e2e_character_assets/runner.py --verbose

# Machine-readable JSON output (for CI/CD pipelines)
python3 tests/e2e_character_assets/runner.py --json

# Baseline audit mode (exits with code 0 even if assertions fail)
python3 tests/e2e_character_assets/runner.py --allow-fail
```

### Exit Codes
- `0`: All executed test assertions passed 100%.
- `1`: One or more test assertions failed (unmet milestone requirement or regression detected).

---

## 4. Requirement Verification & Baseline Matrix

| Test ID | Scope | Requirement & Target Threshold | Verification Method | Current Baseline Status |
|---|---|---|---|---|
| **T1.F2.1** | `public/seat/*.png` | All 110 portrait files exist | `tier1_feature_coverage.py` | **PASS** (110/110 found) |
| **T1.F2.2** | `public/seat/*.png` | All 110 portrait files decode cleanly | `tier1_feature_coverage.py` | **PASS** (110/110 valid) |
| **T1.F2.3** | `public/seat/*.png` | Exact 256x296 dimensions | `tier1_feature_coverage.py` | **PASS** (110/110 matched) |
| **T1.F2.4** | `public/seat/*.png` | 110 distinct SHA-256 hashes | `tier1_feature_coverage.py` | **PASS** (110 unique hashes) |
| **T1.F2.5** | `public/seat/*.png` | Zero blank/uniform images | `tier1_feature_coverage.py` | **PASS** (entropy $\ge 2.0$) |
| **T1.F2.6** | `public/seat/*.png` | Alpha transparency preserved | `tier1_feature_coverage.py` | **PASS** (110/110 with alpha) |
| **T1.F3.1–3** | `public/cards1.png` | Exists, valid PNG, exact 1000x1000 | `tier1_feature_coverage.py` | **PASS** |
| **T1.F3.4–6** | `public/cards2.png` | Exists, valid PNG, exact 1000x1000 | `tier1_feature_coverage.py` | **PASS** |
| **T1.F3.7** | `cards1.png` / `cards2.png` | Cell content populated & non-blank | `tier1_feature_coverage.py` | **PASS** |
| **T1.F4.1–3** | `public/card100.png` | Exists, valid PNG, exact 1135x1315 | `tier1_feature_coverage.py` | **PASS** |
| **T1.F4.4–7** | `card100_gemini.png` | Exists, genuine PNG (not JPEG), 1024x1024 RGBA | `tier1_feature_coverage.py` | **FAIL** (legacy JPEG, RGB mode) [Pending M2] |
| **T1.F5.1–4** | `character_sheet_*.png` | All 11 sheets exist, decode, 2560x296, RGBA | `tier1_feature_coverage.py` | **FAIL** (3 sheets corrupt: fire, hobbit, mecha) [Pending M2] |
| **T1.F5.5** | `character_sheet_*.png` | All 10 cells per sheet contain rich art | `tier1_feature_coverage.py` | **FAIL** (low entropy in legacy sheets) [Pending M2] |
| **T2.F7.1–2** | `public/seat/*.png` | Size budget: 4 KB $\le$ file $\le$ 35 KB | `tier2_boundary_corner.py` | **PASS** (all 110 within budget) |
| **T2.F7.3** | Master Sheets (4 files) | File size budget: each $\le$ 800 KB | `tier2_boundary_corner.py` | **FAIL** (2.0–2.8 MB bloated) [Pending M3] |
| **T2.F7.4** | Faction Sheets (11 files) | File size budget: each $\le$ 300 KB | `tier2_boundary_corner.py` | **FAIL** (3 sheets $> 300$ KB) [Pending M3] |
| **T2.F7.5** | Aggregate Assets | Total payload $\le 10.11$ MB | `tier2_boundary_corner.py` | **FAIL** (10.64 MB total) [Pending M3] |
| **T2.F2.1** | `public/seat/*.png` | PNG 8-byte magic header (\x89PNG\r\n\x1a\n) | `tier2_boundary_corner.py` | **PASS** (110/110 valid) |
| **T2.F2.2** | Master Sheets | PNG 8-byte magic header verification | `tier2_boundary_corner.py` | **FAIL** (card100_gemini has JPEG SOI) [Pending M2] |
| **T2.F2.3** | Faction Sheets | PNG 8-byte magic header verification | `tier2_boundary_corner.py` | **FAIL** (fire, hobbit, mecha have \xef\xbf\xbd) [Pending M2] |
| **T2.F2.4** | All Sheets | IHDR chunk structure validation | `tier2_boundary_corner.py` | **PASS** |
| **T2.F6.1–5** | Coordinates & IDs | ID 100/101 boundary, ID 110, Rows 1-9, Bosses, OOB | `tier2_boundary_corner.py` | **PASS** (5/5 passed) |
| **T3.F6.1–3** | Math Verification | cards1/cards2, card100, faction horizontal formulas | `tier3_coordinate_alignment.py` | **PASS** (3/3 passed) |
| **T3.F6.4–5** | Pixel Synchronization | Faction & Master sheets cells vs Seat portraits | `tier3_coordinate_alignment.py` | **FAIL** (pending M2 sprite sheet assembly) |
| **T3.F6.6** | Edge Bleeding | Zero inter-cell sub-pixel bleed | `tier3_coordinate_alignment.py` | **PASS** |
| **T4.F1.1–4** | UI Simulation | 11 Factions, 4 Rarities, Canvas blitting, Fallback cascade | `tier4_real_world.py` | **PASS** (4/4 passed) |
| **T4.F1.5** | Payload Audit | Total web traffic reduction benchmark | `tier4_real_world.py` | **FAIL** (pending M3 quantization) |
