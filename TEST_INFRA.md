# SNSHero Movie Theater 40-Episode E2E Test Infrastructure (TEST_INFRA.md)

## 1. Overview & Architecture

This document establishes the comprehensive test architecture, methodology, and coverage criteria for the **SNSHero Movie Theater Upgrade & 40-Episode Standalone MP4 Video Generation** (`public/videos/episodes/episode_01.mp4`..`episode_40.mp4`, 2,049 webtoon cutscenes, Web Audio procedural BGM synthesis, English TTS voiceover, character portrait dock highlighting, animated combat SFX onomatopoeia overlays, multi-language subtitles, and CC toggle).

The testing strategy employs a **Dual-Track 4-Tier Automated Verification Framework** driven by a standalone, autonomous Python 3 test harness (`tests/e2e_movie_theater/run_movie_e2e_tests.py`):

```
+---------------------------------------------------------------------------------------------------+
|               SNSHero Movie Theater Dual-Track 4-Tier E2E Test Infrastructure                    |
+---------------------------------------------------------------------------------------------------+
|  Tier 1: Feature Coverage & Asset Integrity (35 Assertions across 8 Features)                     |
|  - Feature 1 (2,049 Cutscenes): All 40 episodes in manifest, exactly 2,049 cutscenes, all files  |
|    exist on disk in public/images/webtoon/episode_XX/, valid WebP RIFF headers, scene 0 title cards. |
|  - Feature 2 (MP4 Video Assets): All 40 MP4 files exist, probed via ffprobe for H.264 video,   |
|    AAC audio (>=44.1kHz), non-zero duration (>0.0s), faststart moov placement, <=25MB payload.     |
|  - Feature 3 (Continuous BGM Engine): MovieAudioSynthesizer singleton, initAudio(),              |
|    startEpisodeBgm(), stopEpisodeBgm(), and 6 core themes (arctic-blizzard, battle-march, etc.).  |
|  - Feature 4 (English TTS Voiceover): speakEnglishNarration/speakNarration, en-US/en-GB voices,   |
|    CinematicMoviePlayer narrationEn binding, mute and isTtsEnabled state respect.                |
|  - Feature 5 (Character Highlighting): Dialogues map to CARD_DATABASE (1..110), portraits exist  |
|    in public/seat/, active speaker glowing highlight & [SPEAKER] badge, non-speaker dimming.      |
|  - Feature 6 (Combat SFX Overlays): Manifest sfxCues schema, onomatopoeia visual rendering on     |
|    stage/canvas, synchronized procedural audio SFX (movieAudio.playSfx).                         |
|  - Feature 7 (Subtitles & CC Toggle): English for en viewers, localized text for others,         |
|    [CC ON/OFF] toggle button in control bar, clean overlay visibility toggle.                    |
|  - Feature 8 (MP4 Player & Download): Mode switcher between Cutscene & MP4, native <video> tag,  |
|    direct MP4 download link with formatted filename (SNSHero_Episode_XX.mp4).                    |
+---------------------------------------------------------------------------------------------------+
|  Tier 2: Boundary & Corner Cases (10 Assertions across 5 Boundaries)                              |
|  - Boundary 1 (Subtitle Fallback): Zero 'undefined'/null text printed, dialogues array safe nav.  |
|  - Boundary 2 (Rapid Skipping): Prior speech canceled immediately, interval timers cleared cleanly|
|    without leaks, scene index strictly clamped to [0, totalScenes - 1].                           |
|  - Boundary 3 (AudioContext Autoplay): Resume promise rejection caught, retry on user gesture.   |
|  - Boundary 4 (Mobile Viewport): Touch targets meet DESIGN.md min-h-[44px], subtitle text wraps.  |
|  - Boundary 5 (Episode Clamping): Episode parameter strictly clamped to [1, 40].                 |
+---------------------------------------------------------------------------------------------------+
|  Tier 3: Cross-Feature Combinations & State Machine (8 Assertions across 5 Interactions)          |
|  - Combination 1 (Mode Switch): Switching to MP4 halts Web Audio BGM & TTS; switching back restores|
|    interactive player state without double-audio echo.                                            |
|  - Combination 2 (CC & Language): CC toggle state preserved across language switches; active CC  |
|    updates subtitle text reactively on language change.                                           |
|  - Combination 3 (TTS Rapid Skip): Speech utterance flushed on rapid scene skipping (0 backlog).  |
|  - Combination 4 (BGM Continuity): Same-theme scenes maintain continuous audio without restarting;|
|    theme changes execute smooth >= 0.5s cross-fade.                                              |
|  - Combination 5 (Stacking Order): Fullscreen z-index hierarchy (canvas < dock < subtitles < bar).|
+---------------------------------------------------------------------------------------------------+
|  Tier 4: Real-World Application Scenarios (6 Assertions across 4 Scenarios)                       |
|  - Scenario 1 (Full Playthrough): Episode 1 plays start to end, triggers onEpisodeComplete,        |
|    viewing reward (100 SNS) saved in localStorage (hero_movie_claimed_episodes).                  |
|  - Scenario 2 (MP4 Stream & Download): All 40 episodes streamable via URL and downloadable with   |
|    SNSHero_Episode_XX.mp4 naming.                                                                 |
|  - Scenario 3 (40-Episode Catalog): All 40 episodes unlocked in MOVIE_EPISODES, 0 blockers.      |
|  - Scenario 4 (Fallback Resiliency): Graceful degradation when SpeechSynthesis/WebAudio missing.  |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. 4-Tier Test Suite Specification

### Tier 1: Feature Coverage & Asset Integrity (35 Tests)

#### T1.1 2,049 Webtoon Cutscenes Loadability (`src/content/webtoonEpisodeManifest.json`, `public/images/webtoon/`)
- **Objective**: Verify that all 40 episodes and 2,049 cutscenes exist on disk, decode as valid WebP images, and maintain sequential chapter storytelling.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R1 & §R3, `PROJECT.md` Feature 1.
- **Assertions**:
  1. `T1.F1.1` **Manifest Episodes**: Manifest contains all 40 episodes (`"1"` through `"40"`).
  2. `T1.F1.2` **Exact Cutscene Count**: Total cutscene count across all 40 episodes in manifest equals exactly 2,049.
  3. `T1.F1.3` **Filesystem Existence**: All 2,049 WebP image files exist on disk in `public/images/webtoon/episode_XX/`.
  4. `T1.F1.4` **WebP Magic Header**: All 2,049 cutscene files have valid WebP headers (`RIFF....WEBP`) and non-zero byte size.
  5. `T1.F1.5` **Sequential Storytelling**: Every episode contains `scene_00.webp` title card followed by sequential story panels (`scene_01.webp`..`scene_XX.webp`).

#### T1.2 40-Episode Standalone MP4 Video Assets (`public/videos/episodes/`, via `ffprobe`)
- **Objective**: Ensure all 40 episodes have standalone MP4 video files with valid H.264 video, AAC audio, positive duration, and browser-streaming flags.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R3, `PROJECT.md` Feature 7.
- **Assertions**:
  1. `T1.F2.1` **All 40 Files Exist**: `episode_01.mp4` through `episode_40.mp4` exist in `public/videos/episodes/`.
  2. `T1.F2.2` **Container Format**: `ffprobe` confirms format is `mp4` / `mov` with valid MP4 container structure.
  3. `T1.F2.3` **H.264 Video Stream**: Video stream encoded with `h264` (`avc1`) at $\ge 20$ fps.
  4. `T1.F2.4` **AAC Audio Stream**: Audio stream encoded with `aac` at $\ge 44.1$ kHz.
  5. `T1.F2.5` **Positive Duration**: Every episode video has non-zero duration ($> 0.0$s).
  6. `T1.F2.6` **Faststart Flag**: MP4 container places `moov` atom before `mdat` for instant browser streaming.
  7. `T1.F2.7` **Payload Budget**: Video file size is $\le 25$ MB per episode.

#### T1.3 Continuous BGM Synthesis Engine (`src/lib/MovieAudioSynthesizer.ts`)
- **Objective**: Ensure the procedural audio synthesizer maintains continuous BGM anchored to episode lifecycle without restarting across scene transitions.
- **Authoritative Sources**: `PROJECT.md` Feature 2 & Interface Contract 3.
- **Assertions**:
  1. `T1.F3.1` **Singleton & Instance Export**: `MovieAudioSynthesizer` singleton and `movieAudio` exported.
  2. `T1.F3.2` **initAudio()**: API method handles AudioContext initialization and user-gesture resumption.
  3. `T1.F3.3` **startEpisodeBgm()**: API method initiates continuous episode BGM across scene transitions.
  4. `T1.F3.4` **stopEpisodeBgm()**: API method cleanly fades out background music.
  5. `T1.F3.5` **Thematic Presets**: Implements 6 core BGM themes (`arctic-blizzard`, `battle-march`, `arcane-mystery`, `triumph-fanfare`, `dark-ominous`, `sorrow-lament`).

#### T1.4 English-Base Cutscene & TTS Voiceover (`src/components/movie/CinematicMoviePlayer.tsx`)
- **Objective**: Ensure the movie experience presents English dialogues and reads narration aloud via English TTS.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R2, `PROJECT.md` Feature 3.
- **Assertions**:
  1. `T1.F4.1` **TTS Voiceover Method**: Synthesizer implements English narration voiceover.
  2. `T1.F4.2` **Voice Selection**: TTS configures English voice matching (`en-US` / `en-GB`).
  3. `T1.F4.3` **Player Binding**: Player binds English TTS to `narrationEn` and English dialogues.
  4. `T1.F4.4` **Mute & Toggle State**: TTS respects `isTtsEnabled` and `isMuted` toggles.

#### T1.5 Speaking Character Portrait Highlighting
- **Objective**: Verify that speaking characters are highlighted with a glowing frame, pulse aura, and speaker badge while non-speakers are dimmed.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R2, `PROJECT.md` Feature 4.
- **Assertions**:
  1. `T1.F5.1` **Card Mapping**: Cutscene dialogues reference character IDs mapping to `CARD_DATABASE` (1..110).
  2. `T1.F5.2` **Portrait Existence**: Referenced hero portraits exist in `public/seat/*.png`.
  3. `T1.F5.3` **Active Highlighting**: Active speaking character receives glowing border (`border-amber-400`), aura, and `[SPEAKER]` badge.
  4. `T1.F5.4` **Inactive Dimming**: Non-speaking characters dimmed with opacity and scale reduction.

#### T1.6 Animated Combat SFX Onomatopoeia Overlays
- **Objective**: Verify animated sound effect typography and synchronized procedural audio SFX.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R2, `PROJECT.md` Feature 5.
- **Assertions**:
  1. `T1.F6.1` **Structured sfxCues**: Webtoon cutscenes define structured SFX cues with Korean and English text.
  2. `T1.F6.2` **Visual Onomatopoeia**: Player renders visual SFX overlays on movie stage.
  3. `T1.F6.3` **Synchronized Audio**: Procedural battle audio SFX (`movieAudio.playSfx`) triggered synchronously.

#### T1.7 Multi-Language Subtitles & Subtitle CC Toggle
- **Objective**: Verify synchronized subtitle overlay with viewer language selection and `[CC ON/OFF]` toggle.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R4, `PROJECT.md` Feature 6.
- **Assertions**:
  1. `T1.F7.1` **English Subtitles**: Displays English text for English viewers (`narrationEn`, `textEn`).
  2. `T1.F7.2` **Localized Subtitles**: Displays localized text for non-English viewers (`narrationKo`, `textKo`, etc.).
  3. `T1.F7.3` **CC Toggle Button**: Subtitle CC toggle button present in player control bar.
  4. `T1.F7.4` **Visibility Control**: CC toggle cleanly shows/hides subtitle overlay container.

#### T1.8 MP4 Player Mode & Download Integration
- **Objective**: Ensure seamless switching between interactive cutscene theater and MP4 stream, plus episode download.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R3, `PROJECT.md` Feature 8.
- **Assertions**:
  1. `T1.F8.1` **Player Mode Switcher**: Mode switcher between Cutscene Mode and MP4 Mode.
  2. `T1.F8.2` **HTML5 <video> Element**: Native video element integrated for MP4 playback.
  3. `T1.F8.3` **Direct Download Link**: Download link integrated with `SNSHero_Episode_XX.mp4` naming.

---

### Tier 2: Boundary & Corner Cases (10 Tests)

- `T2.B1.1` **Missing Subtitle Fallback**: Guards against `undefined` or `null` text.
- `T2.B1.2` **Empty Dialogues Safety**: Safe navigation when scenes have no dialogue lines.
- `T2.B2.1` **Rapid Skipping Speech Flush**: Cancels prior speech synthesis utterances immediately on skip.
- `T2.B2.2` **Progress Timer Isolation**: Interval timers cleanly cleared on scene change and unmount.
- `T2.B2.3` **Scene Index Clamping**: Index strictly clamped to $[0, \text{totalScenes} - 1]$.
- `T2.B3.1` **AudioContext Resume Rejection**: Autoplay policy blocks caught without unhandled rejection.
- `T2.B3.2` **User Gesture Retry**: Re-attempts audio initialization upon user interaction.
- `T2.B4.1` **44px+ Touch Target Compliance**: Interactive controls meet mobile touch target standards ($\ge 44$px).
- `T2.B4.2` **Subtitle Line Wrapping**: Subtitles wrap cleanly on narrow mobile viewports without clipping.
- `T2.B5.1` **Episode Number Clamping**: Episode selection parameters strictly clamped to $[1, 40]$.

---

### Tier 3: Cross-Feature Combinations & State Machine (8 Tests)

- `T3.X1.1` **Cutscene to MP4 Mode Audio Isolation**: Halts procedural Web Audio and TTS to prevent double-audio echo.
- `T3.X1.2` **MP4 Back to Cutscene Recovery**: Restores interactive player state without desynchronization.
- `T3.X2.1` **CC State Decoupling**: Subtitle CC state (ON/OFF) preserved across language switches.
- `T3.X2.2` **Reactive Subtitle Language Switch**: Active subtitles immediately update to newly selected language.
- `T3.X3.1` **Rapid Scene Advancement TTS Cancellation**: Prior scene utterances flushed; only active scene spoken.
- `T3.X4.1` **Continuous BGM Across Scenes**: Same-theme scene transitions do not restart audio oscillators.
- `T3.X4.2` **Smooth Theme Cross-Fade**: Theme changes execute $\ge 0.5$s smooth cross-fade.
- `T3.X5.1` **Fullscreen Z-Index Stacking**: Strict visual layering (canvas < portraits < subtitles < controls).

---

### Tier 4: Real-World Application Scenarios (6 Tests)

- `T4.S1.1` **End-to-End Episode Playthrough**: Full sequence playback to conclusion, firing `onEpisodeComplete`.
- `T4.S1.2` **LocalStorage Reward Persistence**: Viewing reward (100 SNS) saved in `hero_movie_claimed_episodes`.
- `T4.S2.1` **All 40 Streaming URLs Valid**: Every episode maps to `/videos/episodes/episode_XX.mp4`.
- `T4.S2.2` **Formatted Download Filenames**: Download links format filename as `SNSHero_Episode_XX.mp4`.
- `T4.S3.1` **40-Episode Catalog Progression**: All 40 episodes unlocked in `MOVIE_EPISODES` with complete metadata.
- `T4.S4.1` **SpeechSynthesis/WebAudio Resiliency**: Graceful visual playback when browser lacks Web Speech/Audio.

---

## 3. Test Runner CLI & Execution Guide

### Autonomous Python 3 Runner

```bash
# Full Verification across all 4 Tiers (59 Assertions)
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py

# Tier-Specific Invocations
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --tier 1   # Feature Coverage & Asset Integrity
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --tier 2   # Boundary & Corner Cases
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --tier 3   # Cross-Feature Combinations
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --tier 4   # Real-World Scenarios

# Progressive Milestone Filtering
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --milestone E2E  # 100% PASS on current cutscenes/baseline
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --milestone M1   # Milestone 1 Scope (Player, Audio, Subtitles)
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --milestone M2   # Milestone 2 Scope (MP4 Generation, Download)

# Feature Keyword Filtering
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --feature cutscenes
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --feature bgm
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --feature mp4

# Baseline Audit Mode (exits with code 0 even if pending milestone features fail)
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --allow-fail

# Machine-Readable JSON Output
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --json
```

### Exit Code Semantics
- `0`: All assertions in scope passed 100% (or `--allow-fail` specified).
- `1`: One or more assertions failed (indicates unmet milestone requirements or regressions).

---

## 4. Coverage Thresholds & Quality Gates

| Metric | Target Threshold | Validation Mechanism |
|---|---|---|
| Cutscene Loadability | **100%** (2,049 / 2,049 files) | `T1.F1.1`–`T1.F1.5` |
| MP4 Video Assets | **40 / 40 files** verified via `ffprobe` | `T1.F2.1`–`T1.F2.7` |
| Video Codec | **H.264** (`avc1`), $\ge 20$ fps | `T1.F2.3` |
| Audio Codec | **AAC**, $\ge 44.1$ kHz | `T1.F2.4` |
| Faststart Optimization | **100%** (`moov` before `mdat`) | `T1.F2.6` |
| Max Video Size | $\le 25$ MB per episode | `T1.F2.7` |
| BGM Engine API | 5 methods, 6 themes | `T1.F3.1`–`T1.F3.5` |
| English TTS | Voice matching, `narrationEn` binding | `T1.F4.1`–`T1.F4.4` |
| Speaker Highlighting | `CARD_DATABASE` mapping, glowing frame | `T1.F5.1`–`T1.F5.4` |
| Subtitle System | English / Localized dual mode, `[CC ON/OFF]` | `T1.F7.1`–`T1.F7.4` |
| Mobile Touch Target | $\ge 44$px (`min-h-[44px]`) | `T2.B4.1` |
| Catalog Unlock | **40 / 40 episodes** (0 blockers) | `T4.S3.1` |
