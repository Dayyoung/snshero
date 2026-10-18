# Project: SNSHero 40-Episode Webtoon Artwork Remake & Scenario Synchronization

## Architecture
- **Domain**: Webtoon Visual Asset Generation, Multi-Plane Compositing, Scenario Manifest Synchronization, UI Reader/Player Integration & Zero-Regression Integrity.
- **Data Flow**:
  1. Scenario & IP Source: `public/book/episode_01.md`~`episode_40.md`, `src/content/englishNovelMapping.ts`, `src/cardDatabase.ts`, `src/content/characterIp.ts`.
  2. Visual Synthesis Pipeline: 16 Background Plates (`/tmp/webtoon_bg_plates/bg_01.jpg`..`bg_16.jpg`) + V2 Remastered 110 Hero Portraits (`public/seat/*.png`) composited with atmospheric lighting, depth-of-field, particle effects, and 1px terminal hairline framing.
  3. Image Optimization: WebP encoding at Quality 80–84 with adaptive compression loop ensuring each scene is between 4,096 bytes and 76,800 bytes (target 25–55 KB), producing 840 unique SHA-256 hashes across `public/images/webtoon/episode_01/` ~ `episode_40/`.
  4. Manifest & UI Synchronization: `src/content/webtoonEpisodeManifest.json`, `src/content/webtoonEpisodes.ts`, `src/views/NovelView.tsx`, `src/views/MobileCardPlayScreen.tsx`, `src/components/movie/CinematicMoviePlayer.tsx` updated to local `/images/webtoon/` paths, eliminating all `dayyoung.github.io` CDN dependencies.
  5. Service Worker Cache: `public/sw.js` bumped to `snshero-media-v4-webtoon2026` to purge stale CDN cache.
- **Dual Track Organization**:
  - **E2E Testing Track**: Autonomous test runner `verify_webtoon_assets.py` verifying 840 files, hashes, file size bounds, character non-regression vs `3f64397a`, manifest alignment, CDN removal, and build integrity. Publishes `TEST_READY.md`.
  - **Implementation Track**: Executes M1 (Artwork Generation) -> M2 (Manifest & UI Sync) -> M3 (Gate & Audit) -> M4 (Commit & Reporting).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 40-Episode Background Plates & Environment Mapping | Map 16 Gemini Nano Banana plates across 4 arcs to all 40 episodes / 840 scenes | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Remastered V2 Character Layering & Multi-Plane Compositing | Composite `public/seat/*.png` portraits with alpha transparency, rim light, and VFX | M1 | ORIGINAL_REQUEST §R1 |
| 3 | 840-Panel Webtoon Artwork Generation & WebP Optimization | Batch-generate 840 panels (`scene_00.webp`..`scene_20.webp`), 800x450 px, 4KB-75KB | M1 | ORIGINAL_REQUEST §R1, §R3 |
| 4 | Climax Scene Hero Artwork Upgrade | Generate updated WebP climax images <= 75 KB replacing legacy 1MB JPGs | M1 | ORIGINAL_REQUEST §R1, §R3 |
| 5 | Webtoon Manifest (`webtoonEpisodeManifest.json`) Synchronization | Update 840 scenes with local paths, `characterCardId` in dialogues, and clean schema | M2 | ORIGINAL_REQUEST §R2 |
| 6 | Webtoon Episodes Helper (`webtoonEpisodes.ts`) Alignment | Replace dummy `focusCardId` and `characterIds` with true episode metadata and local fallback URLs | M2 | ORIGINAL_REQUEST §R2 |
| 7 | UI CDN Removal (`NovelView`, `MobileCardPlayScreen`, `CinematicMoviePlayer`) | Eliminate 5 hardcoded `dayyoung.github.io` CDN references, route directly to local assets | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Service Worker Cache Version Upgrade (`sw.js`) | Bump to `snshero-media-v4-webtoon2026` to invalidate stale CDN cache | M2 | ORIGINAL_REQUEST §R3 |
| 9 | Autonomous E2E Test Suite & Infrastructure | Multi-tier test suite (`verify_webtoon_assets.py`) publishing `TEST_READY.md` | E2E-Track | Dual Track Architecture |
| 10 | Non-Regression Audit & Forensic Verification | Verify 110 hero portraits and master sheets match `3f64397a` 100%, 0 lint/build errors | M3 | ORIGINAL_REQUEST §R4 |
| 11 | Local Git Commit, WORK_LOGS & Google Form Reporting | Commit changes locally, log in `WORK_LOGS.md`, submit report via Python script | M4 | ORIGINAL_REQUEST §R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Suite | Multi-tier test suite & verification harness publishing `TEST_READY.md` | Survey | IN_PROGRESS |
| M1 | 840-Scene Artwork Generation & WebP Optimization | Generate all 840 scene panels and climax WebPs under `public/images/webtoon/` (<=75KB, unique hashes) | Survey | PLANNED |
| M2 | Manifest, UI & Service Worker Synchronization | Update `webtoonEpisodeManifest.json`, `webtoonEpisodes.ts`, UI readers, and `sw.js` | M1 | PLANNED |
| M3 | End-to-End Verification & Forensic Audit Gate | Run Reviewers, Challengers, Forensic Auditor on 840 assets, manifest, typecheck, and build | M1, M2, E2E | PLANNED |
| M4 | Commit, Logging & Mandatory Google Form Report | Local git commit, update `WORK_LOGS.md`, submit via `submit_report.py` | M3 | PLANNED |

## Interface Contracts
### 1. Webtoon Image Panels ↔ UI Readers
- Directory: `public/images/webtoon/episode_XX/` (where `XX` is 01 through 40)
- Filename format: `scene_YY.webp` (where `YY` is 00 through 20)
- Dimensions: `800 x 450` px (16:9 widescreen webtoon standard)
- Format: WebP (`image/webp`)
- File size bounds: `>= 4,096` bytes and `<= 76,800` bytes (75 KB)
- Content:
  - `scene_00.webp`: Title card with dark fantasy border, episode title, and arc motif.
  - `scene_01.webp`..`scene_20.webp`: Story scene panels with environment plate + V2 hero portraits + atmospheric lighting/particles.

### 2. Manifest Schema ↔ Readers & Movie Player
- `src/content/webtoonEpisodeManifest.json`:
  - `localArtUrl`: `/images/webtoon/episode_XX/scene_YY.webp`
  - `imageUrl`: `/images/webtoon/episode_XX/scene_YY.webp`
  - `fileName`: `scene_YY.webp`
  - `dialogues`: `characterCardId` (1 to 110) included for speaker avatar badges.
- `src/content/webtoonEpisodes.ts`:
  - `focusCardId`: Primary hero ID for the episode (1 to 110).
  - `characterIds`: Array of hero IDs appearing in the episode.
  - `imageUrl`: `/images/webtoon/episode_${pad}/scene_00.webp`.

### 3. Service Worker Cache Contract
- `public/sw.js`:
  - `MEDIA_CACHE_NAME = 'snshero-media-v4-webtoon2026'`
  - Purges any cache not matching `MEDIA_CACHE_NAME` on activate.

## Code Layout
- Scenario & Texts: `public/book/episode_01.md`~`episode_40.md`, `src/content/englishNovelMapping.ts`
- Character Sources: `public/seat/*.png` (IDs 1–110), `src/cardDatabase.ts`, `src/content/characterIp.ts`
- Webtoon Assets: `public/images/webtoon/episode_01/` ~ `episode_40/`
- Manifest & Data: `src/content/webtoonEpisodeManifest.json`, `src/content/webtoonEpisodes.ts`
- UI & Player: `src/views/NovelView.tsx`, `src/views/MobileCardPlayScreen.tsx`, `src/components/movie/CinematicMoviePlayer.tsx`
- Service Worker: `public/sw.js`
- Test Runner: `.agents/teamwork/teamwork_preview_explorer_survey_3/verify_webtoon_assets.py`
- Working Directory: `.agents/teamwork/orchestrator_3/`
