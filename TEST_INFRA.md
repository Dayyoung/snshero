# SNSHero IP Trilogy Dual-Track E2E Test Infrastructure (TEST_INFRA.md)

## 1. Overview & Strategy

This document establishes the comprehensive test infrastructure for the commercial-grade remake of the **SNSHero 40-Episode IP Trilogy** — spanning the **Web Novel**, **Webtoon**, and **Full Movie** subsystems within the SNSHero application (`snshero.com`).

The testing strategy employs a **Dual-Track 4-Tier Verification Framework**:
- **Track A (Continuous Automated Harness)**: High-speed, deterministic verification executed programmatically via `npx tsx scripts/verify_ip_trilogy.ts`. Verifies structural integrity, content volume, schema compliance, metadata synchronization, build cleanliness, and DESIGN.md constraints in seconds.
- **Track B (E2E Scenario & Quality Audit)**: Interactive workflow simulation, literary immersion grading (Agent-as-Judge), visual direction verification, and real-world persistence validation across devices and seasons.

```
+-----------------------------------------------------------------------------------+
|                        SNSHero IP Trilogy Test Infrastructure                     |
+-----------------------------------------------------------------------------------+
|  Tier 1: Feature Coverage (Unit / Contract / Asset Integrity / Build)             |
|  - Novel: 40 Korean/English eps, ≥3500 chars, ≥8 dialogues, lore keywords, sync   |
|  - Webtoon: 40 manifest eps, 40 narrations, valid URLs, speech bubbles, SFX cues  |
|  - Movie: 40 eps unlocked (0 blocked), movieEpisodeMapping, Cinematic Player      |
|  - Persistence: webtoonProgress argument order agnostic, season isolation         |
|  - Build & Design: tsc 0-error, vite build 0-error, font-mono, ≥44px touch targets |
+-----------------------------------------------------------------------------------+
|  Tier 2: Boundary & Corner Cases                                                  |
|  - Episode out-of-bounds (ep < 1, ep > 40, non-numeric query params)              |
|  - Missing dialogue/SFX fallback in Webtoon panel rendering                       |
|  - Movie fallback from missing YouTube videoId to in-app Generative Player         |
|  - LocalStorage corrupted JSON recovery, quota limit handling                     |
+-----------------------------------------------------------------------------------+
|  Tier 3: Cross-Feature Interactions & Data Pipeline                               |
|  - Trilogy Title & Arc Synchronicity (Novel == Webtoon == Movie across all 40)    |
|  - Lore Keyword Bridge (Novel keywords -> TacticalLoreDock / SSR Kadan recruitment)|
|  - Unified Progress Sync (read/watch state propagation, reward claiming)         |
|  - Deep-link URL Routing (?view=novel&ep=N, ?view=movie&ep=N, ?tab=cartoon)       |
+-----------------------------------------------------------------------------------+
|  Tier 4: Real-World Scenarios (End-to-End User Journeys)                          |
|  - Journey 1: Novel Reader -> TTS playback -> 85%+ scroll -> Reward claim         |
|  - Journey 2: Webtoon Comic -> Speech bubble toggle -> Vertical & Slide nav       |
|  - Journey 3: Theatrical Movie -> 20-scene playback -> Ken Burns + VFX + Synth SFX|
|  - Journey 4: Season Transition & Zero-Data-Loss Multi-Session Survival           |
+-----------------------------------------------------------------------------------+
```

---

## 2. 4-Tier Test Suite Specification

### Tier 1: Feature Coverage & Contract Verification

#### T1.1 Web Novel Literary Expansion & Contract
- **Objective**: Verify that all 40 Korean episodes (`public/book/episode_01.md` through `episode_40.md`) and their English counterparts (`src/content/englishNovelMapping.ts`) exist, have valid markdown structure, meet the commercial volume threshold, and preserve core lore keywords.
- **Authoritative Requirements**: `ORIGINAL_REQUEST.md` R1 & Acceptance Criteria, `PROJECT.md` Features 1, 2, 3, 4, 5.
- **Assertions**:
  1. **File Existence**: Exactly 40 Korean files (`public/book/episode_01.md` ... `episode_40.md`) exist and are non-empty.
  2. **Header Syntax**: Each file starts with valid markdown header `# 눈히어로 {N}화 - {제목}` where `N` matches 1..40.
  3. **Character Volume**: Every Korean episode contains at least 3,500+ characters (Korean text length ≥ 3,500 chars).
  4. **Dialogue Dramatization**: Every episode contains at least 8+ distinct direct character dialogue lines enclosed in quotation marks (`“...”` or `"..."`).
  5. **Lore Keyword Preservation**: Across designated chapters, verify presence of core SSR Kadan recruitment lore keywords:
     - `은빛 단검` (Silver Dagger)
     - `알렉산다르` (Aleksandar)
     - `발리안` (Balian)
     - `이그니스` (Ignis)
     - `실리아` (Celia)
  6. **Metadata Synchronization**: `public/book/index.json` episode titles, numbers, and character counts match the markdown files and `src/content/englishNovelMapping.ts`.

#### T1.2 Webtoon Comic Manifest & Asset Integrity
- **Objective**: Verify that the 40-episode Webtoon dataset has full panel coverage, valid asset URLs, and structured comic direction data.
- **Authoritative Requirements**: `ORIGINAL_REQUEST.md` R2, `PROJECT.md` Features 6, 7, 8, 9, 10, 11.
- **Assertions**:
  1. **Manifest Coverage**: `src/content/webtoonEpisodeManifest.json` contains entries for all 40 episodes (keys `1` through `40`).
  2. **Narration Datasets**: 40 narration files exist in `public/book/image_narrations/episode_01_narrations.json` through `episode_40_narrations.json`.
  3. **Panel Count & Asset URLs**: Total panel count equals 840 (average 21 panels/episode: 1 title card + 20 scene panels). All `imageUrl` fields are non-empty, well-formed valid URLs (HTTPS or valid relative asset paths).
  4. **Structured Comic Direction**:
     - `dialogues` field on scene panels: array of `{ speakerKo, speakerEn, textKo, textEn, bubbleType?, position? }`.
     - `sfxCues` field on scene panels: array of `{ textKo, textEn, style?, position? }`.
  5. **Component Integration**: Verify that `WebtoonSpeechBubble`, `WebtoonSfxOverlay`, `WebtoonMonologueBox` components are integrated in `NovelView.tsx`.

#### T1.3 Movie 40-Episode Playability & Cinematic Engine
- **Objective**: Verify all 40 movie episodes are unlocked, with complete metadata and in-app generative cinematic player capabilities.
- **Authoritative Requirements**: `ORIGINAL_REQUEST.md` R3, `PROJECT.md` Features 12, 13, 14, 15, 16, 17, 18, 19.
- **Assertions**:
  1. **40 Episode Unlocking**: `MovieView.tsx` default `releasedCount` is 40 (`DEFAULT_RELEASED_COUNT = 40`), with 0 episodes blocked by "Coming Soon" or alert modals.
  2. **Mapping Completeness**: `src/content/movieEpisodeMapping.ts` contains all 40 episode definitions (1..40) with `titleKo`, `titleEn`, `titleJa`.
  3. **Generative Cinematic Movie Player**: `src/components/movie/CinematicMoviePlayer.tsx` exists, accepting `CinematicMoviePlayerProps`, rendering 20 scenes per episode.
  4. **VFX & Audio Synthesis**: Procedural canvas VFX engine (`MovieVfxCanvas.tsx`) supports snow, embers, runes, slashes. `MovieAudioSynthesizer.ts` provides procedural Web Audio BGM and battle SFX without external audio file dependencies.

#### T1.4 LocalStorage & State Persistence Contracts
- **Objective**: Verify parameter-order-agnostic persistence and state integrity across seasons.
- **Authoritative Requirements**: `PROJECT.md` Feature 18, `src/lib/webtoonProgress.ts`.
- **Assertions**:
  1. `setSeasonItem(key, season, value)` sets `key_season` in localStorage.
  2. `setSeasonItem(key, value, season)` correctly identifies `season` and sets `key_season` identically.
  3. `getSeasonItem(key, season)` retrieves saved state, falling back to season1 un-suffixed key for backward compatibility.
  4. `loadWebtoonProgress` and `saveWebtoonProgress` serialize and deserialize `readEpisodeIds`, `claimedRewardEpisodeIds`, and `lastReadPanelIndex` cleanly.

#### T1.5 Build & Type Safety
- **Objective**: Ensure the entire repository builds cleanly without errors.
- **Assertions**:
  1. `npx tsc --noEmit` exits with code 0 (0 TypeScript diagnostics).
  2. `npm run build` (`vite build && node scripts/post-build.js`) finishes with code 0 and bundles `dist/`.

#### T1.6 DESIGN.md Aesthetic & Mobile Ergonomics
- **Objective**: Enforce the OpenCode terminal-flat design standard.
- **Authoritative Requirements**: `DESIGN.md`, `AGENTS.md`, `GEMINI.md`.
- **Assertions**:
  1. **Typography**: UI uses `font-mono` exclusively; no sans-serif/serif display fonts.
  2. **Surfaces**: Flat cream (`#fdfcfc`) / ink dark (`#201d1d`) surfaces with 1px hairline borders (`border-[#646262]/30`, `border-stone-800`, `border-white/10`). Zero box-shadows, zero multi-color gradient backgrounds.
  3. **Touch Targets**: All interactive buttons, tabs, and toggles in `NovelView.tsx` and `MovieView.tsx` have `min-h-[44px]` (or equivalent tappable bounds). No 28px (`w-7 h-7`) or 36px (`min-h-[36px]`) controls.
  4. **Corner Radii**: Containers are `rounded-none` (0px); buttons and badges are `rounded-sm` (4px).

---

### Tier 2: Boundary & Corner Cases

- **T2.1 Out-of-Bounds & Malformed Route Parameters**:
  - `?ep=0`, `?ep=41`, `?ep=-1`, `?ep=abc`, `?ep=9999`: Handled gracefully by clamping to valid episode range `[1, 40]`, never crashing or throwing unhandled exceptions.
- **T2.2 Graceful Degradation on Incomplete Panel Annotations**:
  - Panels without `dialogues` or `sfxCues` render normal narration box cleanly without throwing null reference errors.
- **T2.3 Fallback from Missing YouTube Video ID**:
  - Movie episodes 9..40 without official YouTube embed IDs automatically switch to the in-app Generative Cinematic Movie Player (`CinematicMoviePlayer.tsx`), providing an uninterrupted 20-scene watchable experience.
- **T2.4 LocalStorage Resilience**:
  - Corrupted JSON in `hero_webtoon_progress` or `hero_novel_progress` falls back to default empty state without crashing the reader.
  - Storage quota exceptions (`QuotaExceededError`) are caught gracefully.
- **T2.5 Extreme Viewport & Low-Spec Mode**:
  - Ultra-narrow mobile viewports (320px width) maintain readable typography and accessible 44px+ touch targets without horizontal clipping.
  - `lowSpecMode: true` throttles canvas particle VFX to zero or low count to preserve 60fps interaction on mobile browsers.

---

### Tier 3: Cross-Feature Interactions & Data Pipeline

- **T3.1 Trilogy Title & Arc Synchronicity**:
  - Cross-verifies that for every episode $i \in [1, 40]$:
    - Korean title in `public/book/episode_{i}.md` == `public/book/index.json` == `webtoonEpisodeManifest.json` == `movieEpisodeMapping.ts`.
    - English title in `englishNovelMapping.ts` == `webtoonEpisodeManifest.json` == `movieEpisodeMapping.ts`.
- **T3.2 Lore Keyword Integration (Novel -> RPG Integration)**:
  - Reading episodes containing lore keywords (`은빛 단검`, `알렉산다르`, `발리안`, `이그니스`, `실리아`) activates lore inspection cards via `TacticalLoreAnnotation` and unlocks recruitment clues for SSR Kadan (`loreRecruitmentStore.ts`).
- **T3.3 Unified Cross-Media Progress Persistence**:
  - Reading a novel episode to 85%+ scroll marks the episode read, saves max reading percentage in `hero_max_read_pct_{season}_ep{N}`, and synchronizes read status with webtoon episode progress.
  - Completing a movie episode triggers `onEpisodeComplete`, updating `hero_movie_progress_{season}` and enabling SNS reward claiming without state collisions.
- **T3.4 Home Dashboard Shortcuts & Deep-Linking**:
  - Direct URL deep-links (`/?view=novel&ep=12`, `/?view=movie&ep=25`, `/?view=novel&tab=cartoon&ep=7`) navigate directly to the targeted episode in the specified tab mode.

---

### Tier 4: Real-World Scenarios (End-to-End User Journeys)

- **T4.1 Journey 1: Immersive Novel Reading to Webtoon Transition**:
  1. User enters NovelView at Episode 1.
  2. TTS speech synthesis plays Korean voiceover paragraph by paragraph.
  3. User toggles to Webtoon mode (`tab=cartoon`).
  4. Reader renders generative dark-fantasy panels with comic speech bubbles and SFX overlays.
  5. User scrolls past 85% depth -> automatic read completion recorded in LocalStorage.
  6. Reading reward modal triggers with haptic vibration; user claims SNS reward.
  7. User clicks Next Episode -> transitions smoothly to Episode 2.
- **T4.2 Journey 2: 40-Episode Theatrical Movie Experience**:
  1. User enters MovieView.
  2. Selects Episode 20 from drawer / grid (verified unlocked, not blocked).
  3. Generative Cinematic Movie Player mounts and begins 20-scene sequence.
  4. Procedural BGM theme plays via Web Audio API, paired with ambient particle effects (embers/runes) and Ken Burns camera pan/zoom.
  5. User scrubs the playback timeline slider, toggles bilingual subtitles between KO and EN.
  6. Playback completes -> episode marked watched in `hero_movie_progress`.
- **T4.3 Journey 3: Low-End Smartphone Experience**:
  1. Emulated mobile viewport (390x844).
  2. Touch targets on slide arrows, menu drawers, and tab switchers are all ≥44px.
  3. Fast touch response (<50ms) without ghost taps or double-zoom interference.
- **T4.4 Journey 4: Season Transition & Zero Data Loss**:
  1. Player progress stored in `season1`.
  2. Game updates to `season2`.
  3. Reading and movie states isolate under `hero_novel_progress_season2` without corrupting or deleting `season1` achievements.

---

## 3. Test Runner & Verification Script (`scripts/verify_ip_trilogy.ts`)

The project provides an automated TypeScript verification script executable in Node.js via `tsx`:

```bash
# Run full automated verification suite
npx tsx scripts/verify_ip_trilogy.ts

# Fast iteration mode (skips tsc and full vite build)
npx tsx scripts/verify_ip_trilogy.ts --skip-build

# Filter by tier (e.g., Tier 1 only)
npx tsx scripts/verify_ip_trilogy.ts --tier=1
```

### Output Diagnostics & Baseline Tracking
The script prints:
- Color-coded progress per tier and subsystem (Novel, Webtoon, Movie, Persistence, Build, Design).
- Diagnostic summary table with Passed, Failed, and Warning counts.
- Detailed listing of any failing assertion (e.g. specific episode numbers missing dialogues or under 3,500 chars).
- Exit code 0 on complete pass, non-zero on failure.

---

## 4. Verification & Baseline Matrix

| Requirement | Scope | Target Threshold | Verification Method | Status |
|---|---|---|---|---|
| R1. Novel 40 Eps | `public/book/episode_*.md` | 40 files exist, non-empty, valid `# 눈히어로 N화` header | T1.1 Automated Script | Baseline Verified |
| R1. Novel Chars | `public/book/episode_*.md` | ≥ 3,500 chars per episode | T1.1 Automated Script | In Progress (M1) |
| R1. Novel Dialogue | `public/book/episode_*.md` | ≥ 8 dialogue lines per episode | T1.1 Automated Script | In Progress (M1) |
| R1. Lore Keywords | `public/book/episode_*.md` | 은빛 단검, 알렉산다르, 발리안, 이그니스, 실리아 present | T1.1 Automated Script | Baseline Verified |
| R1. Metadata Sync | `public/book/index.json` | 40 eps synced with markdown titles & counts | T1.1 Automated Script | In Progress (M1) |
| R2. Webtoon Manifest | `webtoonEpisodeManifest.json` | 40 eps, 840 panels total | T1.2 Automated Script | Baseline Verified |
| R2. Webtoon Narrations| `image_narrations/*.json` | 40 narration files exist | T1.2 Automated Script | Baseline Verified |
| R2. Comic Dialogues | `webtoonEpisodeManifest.json` | Structured `dialogues` array present | T1.2 Automated Script | In Progress (M2) |
| R2. SFX Cues | `webtoonEpisodeManifest.json` | Structured `sfxCues` array present | T1.2 Automated Script | In Progress (M2) |
| R2. Webtoon UI | `NovelView.tsx` | Speech bubbles & SFX overlays integrated | T1.2 Automated Script | In Progress (M2) |
| R3. Movie 40 Unlocked | `MovieView.tsx` | All 40 unlocked (releasedCount = 40, 0 blocked) | T1.3 Automated Script | In Progress (M3) |
| R3. Movie Mapping | `movieEpisodeMapping.ts` | 40 episode definitions complete | T1.3 Automated Script | Baseline Verified |
| R3. Cinematic Player | `CinematicMoviePlayer.tsx` | In-app 20-scene player with camera & VFX | T1.3 Automated Script | In Progress (M3) |
| R4. Persistence | `webtoonProgress.ts` | Argument-order agnostic `setSeasonItem` | T1.4 Automated Script | Baseline Verified |
| R4. Type Safety | Whole repo | `tsc --noEmit` 0 errors | T1.5 Automated Script | Baseline Verified |
| R4. Bundling | Whole repo | `npm run build` succeeds | T1.5 Automated Script | Baseline Verified |
| R4. DESIGN.md Touch | `NovelView.tsx`, `MovieView.tsx` | All buttons/tabs ≥ 44px (no 28px/36px) | T1.6 Automated Script | In Progress (M2, M3) |
| R4. DESIGN.md Style | `NovelView.tsx`, `MovieView.tsx` | font-mono, flat cream/ink, rounded-none/sm | T1.6 Automated Script | Baseline Verified |

---

## 5. Ongoing Monitoring & Handoff Checklist
1. All changes committed locally (`git commit`).
2. Run `npx tsx scripts/verify_ip_trilogy.ts` after milestone code changes.
3. Verify 0 TypeScript errors (`npx tsc --noEmit`).
4. Ensure mandatory Google Form completion report submitted via `submit_report.py`.
