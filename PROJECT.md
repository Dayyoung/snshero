# Project: SNSHero 110-Hero Character Illustration Remaster & Asset Synchronization

## Architecture
- **Domain**: Visual Assets, TCG Artwork, Sprite Sheets, Image Optimization & Frontend Rendering.
- **Data Flow**:
  1. Base Character Specifications & Lore (`src/cardDatabase.ts`, `src/content/characterIp.ts`, and `cards_dataset.json`).
  2. High-Density Fantasy TCG Remastering & Portrait Generation (`public/seat/*.png`, 256x296 px, 110 files).
  3. Multi-Surface Sprite Sheet Assembly (`public/cards1.png`, `public/cards2.png`, `public/card100.png`, `public/card100_gemini.png`, `public/character_sheet_*.png`).
  4. Compression Pipeline: Pillow FASTOCTREE 256-color palette quantization + `compress_level=9` to meet strict file size budgets.
  5. UI Coordinate Verification: `src/lib/utils.ts` (`getCardSpriteCoords`), `src/lib/canvasCardRenderer.ts`, `src/components/CardItem.tsx`.
- **Dual Track Organization**:
  - **E2E Testing Track**: Autonomous requirement-driven test harness, verifying all 110 seat files, master sheets, faction sheets, coordinates, file sizes, hashes, and decoding. Publishes `TEST_READY.md`.
  - **Implementation Track**: Executes M1 -> M2 -> M3 -> M4 (Final Milestone: E2E Pass + Tier 5 Adversarial Hardening + Project Hygiene).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 110-Hero Design Remastering & Lore Preservation | Visual remaster of IDs 1–110 across 11 factions with high-density fantasy TCG detail, palette, silhouette, and aura preservation | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Individual Seat Portraits Synchronization | All 110 individual portrait files in `public/seat/*.png` at exact 256x296 px, repairing corrupted legacy files (`Celia`, `Hyperion_Prime`, `Sentinel`) | M1 | ORIGINAL_REQUEST §R1, §R2 |
| 3 | Primary 10x10 Sprite Sheets Assembly | `public/cards1.png` (IDs 1–100) and `public/cards2.png` (IDs 101–110 in Row 0) at 1000x1000 px with exact 100x100 cells | M2 | ORIGINAL_REQUEST §R2 |
| 4 | Legacy Master 10x11 Sheets Assembly | `public/card100.png` (1135x1315 px) and `public/card100_gemini.png` (1024x1024 px true RGBA PNG) covering IDs 1–110 | M2 | ORIGINAL_REQUEST §R2 |
| 5 | Faction Horizontal Sheets Assembly | All 11 `public/character_sheet_*.png` files at 2560x296 px with 10 horizontal cards per faction, correcting aliases (`hobbit`, `beast`, `mecha`) | M2 | ORIGINAL_REQUEST §R2 |
| 6 | Sprite Grid & Coordinate Alignment | Exact coordinate alignment per `getCardSpriteCoords` and `canvasCardRenderer.ts` with sub-pixel padding to prevent bleeding | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Web Traffic & File Size Optimization | Strict size budgets: seat <= 35 KB (4KB–35KB), master sheets <= 800 KB, faction sheets <= 300 KB via FASTOCTREE quantization | M3 | ORIGINAL_REQUEST §R3 |
| 8 | E2E Requirement-Driven Testing Track | Autonomous E2E test suite across Tiers 1–4 testing file validity, dimensions, hashes, budgets, coordinates; produces `TEST_READY.md` | E2E-Track | Dual Track Architecture |
| 9 | Final E2E Pass & Adversarial Hardening | 100% pass on Tiers 1–4, Tier 5 white-box adversarial stress tests, lint & build pass, git commit, WORK_LOGS.md, and Google Form report | M4 | ORIGINAL_REQUEST §R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Suite | Requirements-driven test suite (Tiers 1–4) & runner publishing `TEST_READY.md` | Survey | IN_PROGRESS |
| M1 | 110-Hero Portrait Remastering | Remaster all 110 characters, generate 256x296 RGBA portraits in `public/seat/*.png`, fix corrupted headers | Survey | PLANNED |
| M2 | Sprite Sheet Synchronization | Assemble `cards1.png`, `cards2.png`, `card100.png`, `card100_gemini.png`, and 11 faction sheets with exact grid alignment | M1 | PLANNED |
| M3 | Traffic & Size Optimization | Apply FASTOCTREE quantization to all assets, verifying seat <= 35KB, master <= 800KB, faction <= 300KB | M2 | PLANNED |
| M4 | Final E2E Pass & Hardening | Pass 100% E2E tests, Tier 5 adversarial testing, `npm run lint` & `build`, git commit, WORK_LOGS.md, Google Form | M3, E2E | PLANNED |

## Interface Contracts
### 1. Individual Seat Portraits ↔ Sprite Sheet Compositors
- Directory: `public/seat/`
- Filename format: `${CARD_DATABASE[id].title_en.replace(/ /g, '_')}.png`
- Dimensions: `256 x 296` px
- Format: 32-bit RGBA or 8-bit paletted RGBA PNG, alpha transparency preserved.

### 2. Primary Sprite Sheets ↔ Frontend CardItem & Canvas Renderer
- `public/cards1.png`:
  - Size: `1000 x 1000` px
  - Grid: 10 columns x 10 rows (100 cells, each `100 x 100` px)
  - Card IDs: 1 to 100. Index formula: `idx = id - 1`, `col = idx % 10`, `row = Math.floor(idx / 10)`
  - Coordinate: `x = col * 100`, `y = row * 100`
- `public/cards2.png`:
  - Size: `1000 x 1000` px
  - Grid: 10 columns x 10 rows (100 cells, each `100 x 100` px)
  - Card IDs: 101 to 110 in Row 0 (`row = 0`, `col = id - 101`). Rows 1–9 preserved.
- `public/card100.png`:
  - Size: `1135 x 1315` px
  - Grid: 10 columns x 11 rows (110 cells, each `113.5 x 119.545` px)
  - Card IDs: 1 to 110. Index: `idx = id - 1`, `col = idx % 10`, `row = Math.floor(idx / 10)`
- `public/card100_gemini.png`:
  - Size: `1024 x 1024` px
  - Grid: 10 columns x 11 rows (110 cells, each `102.4 x 93.091` px)
  - Format: True RGBA PNG (replacing old JPEG-in-PNG file)

### 3. Faction Sheets ↔ Faction Carousels
- Files: 11 sheets in `public/`:
  - `character_sheet_water.png` (IDs 1–10)
  - `character_sheet_fire.png` (IDs 11–20)
  - `character_sheet_wind.png` (IDs 21–30)
  - `character_sheet_earth.png` (IDs 31–40)
  - `character_sheet_human.png` (IDs 41–50)
  - `character_sheet_undead.png` (IDs 51–60)
  - `character_sheet_elf.png` (IDs 61–70)
  - `character_sheet_hobbit.png` (IDs 71–80, Dwarf/Hobbit faction)
  - `character_sheet_beast.png` (IDs 81–90, Monster/Beast faction)
  - `character_sheet_mecha.png` (IDs 91–100, Robot/Mecha faction)
  - `character_sheet_dragon.png` (IDs 101–110, Dragon faction)
- Dimensions: `2560 x 296` px (10 horizontal cells, each `256 x 296` px).

### 4. File Size Budgets
- `public/seat/*.png`: `>= 4,096` bytes and `<= 35,840` bytes (35 KB).
- `public/cards1.png`, `public/cards2.png`, `public/card100.png`, `public/card100_gemini.png`: `<= 819,200` bytes (800 KB).
- `public/character_sheet_*.png`: `<= 307,200` bytes (300 KB).

## Code Layout
- Metadata / Specs: `src/cardDatabase.ts`, `src/content/characterIp.ts`
- Rendering & Coords: `src/lib/utils.ts`, `src/lib/canvasCardRenderer.ts`, `src/components/CardItem.tsx`
- Asset Destination: `public/seat/*.png`, `public/cards1.png`, `public/cards2.png`, `public/card100.png`, `public/card100_gemini.png`, `public/character_sheet_*.png`
- Test Runner & Infra: `tests/e2e_character_assets/`
- Working Directory: `.agents/teamwork/`
