# TEST_READY: SNSHero 110-Hero Character Remaster Test Infrastructure

## 1. Readiness Declaration

The Dual-Track 4-Tier E2E Test Suite and Automated Verification Harness for the **SNSHero 110-Hero Character Illustration Remaster** (`CARD_DATABASE` IDs 1–110 across 11 elemental/racial factions) are **fully established, operational, and verified**.

- **Verification Harness Script**: `tests/e2e_character_assets/runner.py` (executable Python 3 + Pillow CLI)
- **Specification Document**: `TEST_INFRA.md`
- **Modular Test Suites**:
  - `tests/e2e_character_assets/tier1_feature_coverage.py`
  - `tests/e2e_character_assets/tier2_boundary_corner.py`
  - `tests/e2e_character_assets/tier3_coordinate_alignment.py`
  - `tests/e2e_character_assets/tier4_real_world.py`
  - `tests/e2e_character_assets/helpers.py`
- **Initial Baseline Execution**: Established on 2026-10-18.
- **Current Baseline Status**: **39 / 50 Assertions Passed** (78.0% pass rate), 11 Pending Milestone Deliverables (M2 sprite sheet synchronization, M3 palette quantization), **0 Unhandled Crashes**.

---

## 2. Test Execution Harness Guide

All workers (`worker_m1`, `worker_m2`, `worker_m3`, `sentinel`) and the Orchestrator can execute the test harness directly using Python 3:

### Standard Invocations

```bash
# Full Automated Verification (All 4 Tiers, 50 Assertions)
python3 tests/e2e_character_assets/runner.py

# Tier-Specific Execution
python3 tests/e2e_character_assets/runner.py --tier 1   # Feature coverage & asset integrity
python3 tests/e2e_character_assets/runner.py --tier 2   # Size budgets, magic bytes & boundaries
python3 tests/e2e_character_assets/runner.py --tier 3   # Mathematical coordinates & pixel sync
python3 tests/e2e_character_assets/runner.py --tier 4   # Real-world rendering & payload audit

# Feature & Milestone Filtering (Progressive Testability)
python3 tests/e2e_character_assets/runner.py --tier 1 --feature 2  # 100% PASS on M1 Seat Portraits (Exit Code 0)
python3 tests/e2e_character_assets/runner.py --milestone 1          # Milestone 1 Scope Verification

# Verbose Mode (Shows per-card coordinates, failure details, and file size breakdowns)
python3 tests/e2e_character_assets/runner.py --verbose

# Machine-Readable JSON Output (for CI/CD and automation tools)
python3 tests/e2e_character_assets/runner.py --json

# Baseline Audit Mode (exits with code 0 even when milestone requirements are still pending)
python3 tests/e2e_character_assets/runner.py --allow-fail
```

### Exit Codes
- `0`: All assertions in the executed tier(s) passed 100%.
- `1`: One or more assertions failed (indicates unmet milestone requirements or visual regressions).

---

## 3. 4-Tier Architecture & Coverage Matrix

| Tier | Focus | Scope & Assertions | Status |
|---|---|---|---|
| **Tier 1** | Feature Coverage | **Seat Portraits**: 110 files exist, 110 decode cleanly, exact 256x296 dimensions, 110 distinct SHA-256 hashes, zero blank/uniform images, alpha transparency.<br>**Primary Sheets**: `cards1.png` (1000x1000) & `cards2.png` (1000x1000) exist, decode, 10x10 cells populated.<br>**Master Sheets**: `card100.png` (1135x1315) & `card100_gemini.png` (1024x1024) exist, genuine PNG format (rejects legacy JPEG disguise), alpha preserved.<br>**Faction Sheets**: All 11 sheets exist (with aliases `hobbit`, `beast`, `mecha`), decode, exact 2560x296, alpha support, non-blank cells. | **Operational**<br>Baseline: 22 / 25 Passing<br>(Feature 2 Seat Portraits 6/6 100% PASS; card100_gemini JPEG & 3 corrupt faction sheets pending M2) |
| **Tier 2** | Boundary & Corner Cases | **File Size Budgets**: Seat files in [4 KB, 35 KB]; Master sheets $\le 800$ KB; Faction sheets $\le 300$ KB; Aggregate payload $\le 10.11$ MB.<br>**Magic Headers**: 8-byte PNG magic header (`\x89PNG\r\n\x1a\n`) verification on all 125 PNG files (catches UTF-8 replacement byte `\xef\xbf\xbdPNG`); IHDR chunk validation.<br>**Grid Boundaries**: Transition at ID 100 vs 101; ID 110 terminal alignment; Rows 1-9 preservation in `cards2.png`; Boss multiples of 10 apex column 9 alignment; OOB/negative ID clamping. | **Operational**<br>Baseline: 10 / 15 Passing<br>(Bloated sheets pending M3 quantization; header corruption pending M2) |
| **Tier 3** | Cross-Feature Interactions | **Coordinate Math**: All 110 card IDs verified against `getCardSpriteCoords` formulas in `src/lib/utils.ts` for `cards1`/`cards2` (10x10), `card100` (10x11), and `card100_gemini` (10x11).<br>**Faction Horizontal Placement**: Exact $x = ((id - 1) \% 10) \times 256$ px mapping.<br>**Pixel Synchronization**: Visual similarity between `public/seat/<Card>.png` and sliced cells from faction and master sheets.<br>**Sub-Pixel Integrity**: Zero inter-cell margin bleeding / ghosting. | **Operational**<br>Baseline: 4 / 6 Passing<br>(Sprite sheet cell synchronization pending M2 sheet assembly) |
| **Tier 4** | Real-World Scenarios | **CardItem Simulation**: Faction surface background tints and emblems across all 11 factions; Rarity tier hierarchy (50 Bronze, 32 Silver, 28 Gold with 11 Bosses at Gold apex).<br>**CanvasCardRenderer Blitting**: Slicing geometry verified at 32px (mini), 80x92px (hand), 120x140px (board), and 256x296px (zoom).<br>**Fallback Cascade**: Priority resolver cascade simulation.<br>**Web Payload Audit**: Comprehensive traffic reduction benchmark. | **Operational**<br>Baseline: 4 / 5 Passing<br>(Total payload budget pending M3 quantization) |

---

## 4. Current Baseline Verification Report

```
======================================================================
  SNSHero 110-Hero Character Remaster Dual-Track E2E Test Runner      
======================================================================
Working Directory : /Users/dayyoung/project/snshero
Target Scope      : 110 Heroes across 11 Factions (public/seat, sprite sheets)
Execution Tier    : ALL
Verbose Logging   : False

=== [TIER 1] Feature Coverage & Asset Integrity (public/seat, master, faction sheets) ===
  ✓ PASS [T1.F2.1] All 110 Seat Files Exist on Disk (0.9ms)
  ✓ PASS [T1.F2.2] All 110 Seat Files Decode Validly (90.2ms)
  ✓ PASS [T1.F2.3] All 110 Seat Files Exact 256x296 Dimensions (0.0ms)
  ✓ PASS [T1.F2.4] 110 Distinct SHA-256 Hashes Across Seat Portraits (1.5ms)
  ✓ PASS [T1.F2.5] Zero Blank or Uniform Color Images in Seat Portraits (137.9ms)
  ✓ PASS [T1.F2.6] Alpha Transparency Preserved Across Seat Portraits (0.0ms)
  ✓ PASS [T1.F3.1] public/cards1.png Exists (0.0ms)
  ✓ PASS [T1.F3.2] public/cards1.png Decodes as Valid PNG (16.2ms)
  ✓ PASS [T1.F3.3] public/cards1.png Exact Dimensions (1000x1000) (0.0ms)
  ✓ PASS [T1.F3.4] public/cards2.png Exists (0.0ms)
  ✓ PASS [T1.F3.5] public/cards2.png Decodes as Valid PNG (21.9ms)
  ✓ PASS [T1.F3.6] public/cards2.png Exact Dimensions (1000x1000) (0.0ms)
  ✓ PASS [T1.F3.7] Primary Sheets Cell Content Populated & Non-Blank (1.5ms)
  ✓ PASS [T1.F4.1] public/card100.png Exists (0.0ms)
  ✓ PASS [T1.F4.2] public/card100.png Decodes as Valid PNG (19.4ms)
  ✓ PASS [T1.F4.3] public/card100.png Exact Dimensions (1135x1315) (0.0ms)
  ✓ PASS [T1.F4.4] public/card100_gemini.png Exists (0.0ms)
  ✗ FAIL [T1.F4.5] public/card100_gemini.png Decodes as Valid PNG Format (Not JPEG) (1.2ms)
  ✓ PASS [T1.F4.6] public/card100_gemini.png Exact Dimensions (1024x1024) (0.0ms)
  ✗ FAIL [T1.F4.7] public/card100_gemini.png True RGBA Alpha Mode (0.0ms)
  ✓ PASS [T1.F5.1] All 11 Faction Sheets Exist on Disk (0.1ms)
  ✗ FAIL [T1.F5.2] All 11 Faction Sheets Decode as Valid PNGs (96.0ms)
  ✓ PASS [T1.F5.3] All 11 Faction Sheets Exact Dimensions (2560x296) (0.0ms)
  ✓ PASS [T1.F5.4] All 11 Faction Sheets Have RGBA Alpha Support (0.0ms)
  ✓ PASS [T1.F5.5] All Faction Sheet Cells Contain Non-Blank Character Artwork (52.3ms)

=== [TIER 2] Boundary & Corner Cases (Size Budgets, Header Magic Bytes, Grid Boundaries) ===
  ✓ PASS [T2.F7.1] Seat File Size Upper Bound Budget (<= 35 KB) (0.9ms)
  ✓ PASS [T2.F7.2] Seat File Size Lower Bound Budget (>= 4 KB) (0.8ms)
  ✗ FAIL [T2.F7.3] Master Sprite Sheets Size Budget (<= 800 KB) (0.0ms)
  ✗ FAIL [T2.F7.4] Faction Horizontal Sheets Size Budget (<= 300 KB) (0.1ms)
  ✗ FAIL [T2.F7.5] Total Character Asset Aggregate Payload Budget (1.2ms)
  ✓ PASS [T2.F2.1] PNG 8-Byte Magic Header Integrity on All 110 Seat Files (2.7ms)
  ✗ FAIL [T2.F2.2] PNG 8-Byte Magic Header Integrity on Master Sheets (0.1ms)
  ✗ FAIL [T2.F2.3] PNG 8-Byte Magic Header Integrity on Faction Sheets (0.4ms)
  ✓ PASS [T2.F2.4] IHDR Chunk Structure Validation on Sprite Sheets (0.4ms)
  ✓ PASS [T2.F6.1] Boundary ID 100 to 101 Sprite Sheet Transition (0.0ms)
  ✓ PASS [T2.F6.2] Boundary Card ID 110 Terminal Grid Alignment (0.0ms)
  ✓ PASS [T2.F6.3] Non-Character Rows 1-9 Preservation in cards2.png (27.6ms)
  ✓ PASS [T2.F6.4] All 11 Faction Bosses (Multiples of 10) Apex Column 9 Alignment (0.0ms)
  ✓ PASS [T2.F6.5] Out-of-Bounds & Negative Card ID Parameter Clamping (0.0ms)

=== [TIER 3] Cross-Feature Interactions & Coordinate Alignment (Math & Pixel Parity) ===
  ✓ PASS [T3.F6.1] All 110 Card IDs Coordinate Math Match cards1/cards2 Specification (0.1ms)
  ✓ PASS [T3.F6.2] All 110 Card IDs Coordinate Math Match card100.png (10x11 Grid) (0.1ms)
  ✓ PASS [T3.F6.3] All 110 Cards Map to Correct Faction Sheet Horizontal Slots (0.0ms)
  ✗ FAIL [T3.F6.4] Pixel Synchronization: Faction Sheets vs Individual Portraits (87.8ms)
  ✗ FAIL [T3.F6.5] Pixel Correspondence: cards1/cards2 Cells vs Seat Portraits (63.4ms)
  ✓ PASS [T3.F6.6] Sub-Pixel Boundary & Edge Bleeding Integrity (0.0ms)

=== [TIER 4] Real-World Scenarios (CardItem Tints/Frames, Canvas Slicing, Payload Audit) ===
  ✓ PASS [T4.F1.1] CardItem Rendering Simulation Across All 11 Factions (0.1ms)
  ✓ PASS [T4.F1.2] CardItem Rarity Tier Hierarchy Simulation (50 Bronze, 32 Silver, 28 Gold) (0.0ms)
  ✓ PASS [T4.F1.3] CanvasCardRenderer Blitting & Slicing Geometry Simulation (0.0ms)
  ✓ PASS [T4.F1.4] Image Resolution Priority & Fallback Cascade Simulation (0.1ms)
  ✗ FAIL [T4.F1.5] Total Character Web Traffic Payload Reduction Audit (1.7ms)

----------------------------------------------------------------------
  E2E Test Execution Summary (0.51s)
----------------------------------------------------------------------
  Total Assertions   : 50
  Passed Assertions  : 39
  Failed Assertions  : 11
  Warnings           : 0
  Pass Rate          : 78.0%

STATUS: UNMET MILESTONE REQUIREMENTS DETECTED (11 failures).
Implementation milestones M1 (portraits), M2 (sheets), M3 (budgets) required.
```

---

## 5. Implementation Roadmap & Unmet Requirements Assignment

The 11 failing assertions accurately isolate remaining project work across milestones:

1. **Milestone M2: Multi-Surface Sprite Sheet Assembly (`worker_m2`)**:
   - Re-assemble `cards1.png` (IDs 1–100) and `cards2.png` (Row 0, IDs 101–110) from remastered portraits.
   - Re-assemble `card100.png` (1135x1315) and generate true RGBA PNG `card100_gemini.png` (1024x1024) to resolve `T1.F4.5`, `T1.F4.7`, and `T2.F2.2`.
   - Assemble all 11 horizontal sheets (`character_sheet_*.png`) from remastered portraits, repairing the corrupted headers on `fire`, `hobbit`, and `mecha` to resolve `T1.F5.2`, `T2.F2.3`, and `T3.F6.4`.
   - Synchronize cell contents with remastered seat portraits to resolve `T3.F6.5`.

2. **Milestone M3: Web Traffic Optimization (`worker_m3`)**:
   - Apply Pillow `Image.quantize(colors=256, method=Image.Quantize.FASTOCTREE)` + `optimize=True` across all sheets.
   - Enforce master sheets $\le 800$ KB (resolving `T2.F7.3`).
   - Enforce faction sheets $\le 300$ KB (resolving `T2.F7.4`).
   - Reduce aggregate payload to $\le 10.11$ MB (resolving `T2.F7.5` and `T4.F1.5`).

3. **Milestone M4: Final E2E Pass & Hardening**:
   - Re-run `python3 tests/e2e_character_assets/runner.py` to confirm 50 / 50 (100%) assertions pass.
   - Run `npm run lint` and `npm run build` (confirmed clean, 0 errors).
   - Log completion in `WORK_LOGS.md` and submit Google Form report.
