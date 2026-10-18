# TEST_READY: SNSHero Movie Theater 40-Episode E2E Test Infrastructure

## 1. Readiness Declaration

The Dual-Track 4-Tier E2E Test Suite and Autonomous Verification Harness for the **SNSHero Movie Theater Upgrade & 40-Episode Standalone MP4 Video Generation** are **fully established, operational, and verified**.

- **Verification Harness Script**: `tests/e2e_movie_theater/run_movie_e2e_tests.py` (executable Python 3 + `ffprobe` CLI)
- **Specification Document**: `TEST_INFRA.md`
- **Modular Test Suites**:
  - `tests/e2e_movie_theater/tier1_feature_coverage.py` (35 assertions across 8 features)
  - `tests/e2e_movie_theater/tier2_boundary_corner.py` (10 assertions across 5 boundaries)
  - `tests/e2e_movie_theater/tier3_cross_feature.py` (8 assertions across 5 cross-feature interactions)
  - `tests/e2e_movie_theater/tier4_real_world.py` (6 assertions across 4 real-world user scenarios)
  - `tests/e2e_movie_theater/helpers.py` (ffprobe probe runner, manifest & episode loaders, card database resolver)
- **Baseline Execution Result**:
  - **47 / 59 Assertions Passed** (79.7% baseline pass rate).
  - **16 / 16 Current Scope Assertions Passed** (`--milestone E2E`, 100% PASS, Exit Code 0).
  - 12 Pending Milestone Deliverables (M1 player speaker dimming; M2 40-episode MP4 video generation via FFmpeg & download integration).
  - **0 Unhandled Exceptions / Crashes**.

---

## 2. Test Execution Harness Guide

All implementing agents (`worker_m1`, `worker_m2`, `sentinel`) and the Orchestrator can execute the test harness directly:

### Standard Invocations

```bash
# Full Automated Verification (All 4 Tiers, 59 Assertions)
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py

# Tier-Specific Invocations
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --tier 1   # Feature coverage (Cutscenes, MP4, BGM, TTS, Subtitles)
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --tier 2   # Boundary & Corner cases (Empty subtitles, Skipping, Autoplay)
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --tier 3   # Cross-feature combinations (Mode switch, CC state, Continuity)
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --tier 4   # Real-world scenarios (Full playthrough, MP4 download, 40-ep catalog)

# Progressive Milestone Verification
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --milestone E2E  # 100% PASS on current cutscenes/baseline (Exit Code 0)
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --milestone M1   # Milestone 1 Scope Verification (Player, BGM, Subtitles)
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --milestone M2   # Milestone 2 Scope Verification (MP4 Generation, Download)

# Feature-Specific Filtering
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --feature cutscenes  # Verify 2,049 cutscene files & manifest (Exit Code 0)
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --feature bgm        # Verify BGM synthesizer engine
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --feature mp4        # Verify MP4 assets via ffprobe

# Baseline Audit Mode (exits with code 0 even when milestone deliverables are pending)
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --allow-fail

# Detailed Diagnostics
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --verbose

# Machine-Readable JSON Output (for CI/CD pipelines & orchestrators)
python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --json
```

### Exit Codes
- `0`: 100% of tested assertions passed.
- `1`: One or more assertions failed (indicates pending milestone requirements or regressions).

---

## 3. 4-Tier Architecture & Coverage Matrix

| Tier | Focus Area | Scope & Assertions | Count | Current Status |
|---|---|---|---|---|
| **Tier 1** | **Feature Coverage & Asset Integrity** | **2,049 Cutscenes**: Manifest 40 eps, 2,049 count, files exist on disk in `public/images/webtoon/episode_XX/`, WebP headers, title cards.<br>**MP4 Video Assets**: 40 MP4 files, `ffprobe` H.264 video, AAC audio ($\ge 44.1$kHz), duration $> 0.0$s, faststart `moov` atom placement, payload $\le 25$MB.<br>**Continuous BGM**: `MovieAudioSynthesizer` singleton, `initAudio()`, `startEpisodeBgm()`, `stopEpisodeBgm()`, 6 themes.<br>**English TTS**: Narration voiceover method, `en-US`/`en-GB` voice matching, `narrationEn` binding, mute respect.<br>**Speaker Highlight**: Card database mapping, portrait file resolution, glowing border/badge, inactive dimming.<br>**Combat SFX**: Structured `sfxCues`, visual onomatopoeia overlays, synchronized procedural audio.<br>**Subtitles & CC**: English for `en`, localized for others, `[CC ON/OFF]` toggle button, visibility control.<br>**MP4 Mode & Download**: Mode switcher, `<video>` element, formatted download link. | **35** | **25 / 35 Passing**<br>(7 MP4 video assertions & 2 player download assertions pending M2; inactive dimming pending M1) |
| **Tier 2** | **Boundary & Corner Cases** | **Subtitle Fallbacks**: Zero `undefined` text, safe dialogues navigation.<br>**Rapid Skipping**: Prior speech cancelled, interval timers cleared cleanly, index clamped $[0, \text{totalScenes}-1]$.<br>**AudioContext Autoplay**: Resume promise rejection handled, user-gesture retry.<br>**Mobile Viewport**: 44px+ touch targets (`min-h-[44px]`), responsive subtitle text wrapping.<br>**Episode Clamping**: Strict episode index clamp $[1, 40]$. | **10** | **10 / 10 Passing**<br>(100% PASS) |
| **Tier 3** | **Cross-Feature Interactions** | **Mode Switch Audio Isolation**: Cutscene $\leftrightarrow$ MP4 switching halts previous audio, eliminates double-audio echo.<br>**CC & Language Continuity**: CC toggle state preserved across language changes; active subtitle updates reactively.<br>**TTS Queue Flush**: Rapid skipping cancels pending SpeechSynthesis utterances.<br>**BGM Continuity**: Same-theme scenes sustain audio without restarting oscillators; cross-fade on theme change.<br>**Stacking Order**: Strict fullscreen z-index hierarchy (canvas < dock < subtitles < controls). | **8** | **8 / 8 Passing**<br>(100% PASS) |
| **Tier 4** | **Real-World Scenarios** | **Full Playthrough**: Episode 1 plays start to end, triggers `onEpisodeComplete`, reward (100 SNS) saved in `hero_movie_claimed_episodes`.<br>**MP4 Stream & Download**: All 40 episodes streamable via URL and downloadable as `SNSHero_Episode_XX.mp4`.<br>**40-Episode Catalog**: All 40 episodes unlocked in `MOVIE_EPISODES` with complete metadata.<br>**Fallback Resiliency**: Graceful visual playback when browser lacks Web Speech / Audio. | **6** | **4 / 6 Passing**<br>(MP4 streaming URLs and download link pending M2) |
| **TOTAL** | | | **59** | **47 / 59 Passing** (79.7%) |

---

## 4. Current Baseline Verification Report

```
======================================================================
  SNSHero Movie Theater 4-Tier Dual-Track E2E Test Runner             
======================================================================
Working Directory : /Users/dayyoung/project/snshero
Target Scope      : 40 Episodes (2,049 Cutscenes, 40 MP4s, BGM, TTS, CC)
Execution Tier    : ALL
Verbose Logging   : False

=== [TIER 1] Feature Coverage & Asset Integrity (Cutscenes, MP4, BGM, TTS, Portraits, SFX, Subtitles) ===
  ✓ PASS [T1.F1.1] Manifest Contains All 40 Episodes (1..40) (19.8ms)
  ✓ PASS [T1.F1.2] Manifest Exact Cutscene Count Equals 2,049 (24.7ms)
  ✓ PASS [T1.F1.3] All 2,049 Cutscene WebP Files Exist on Disk (97.1ms)
  ✓ PASS [T1.F1.4] All Cutscenes Have Valid WebP Magic Header (RIFF..WEBP) (0.0ms)
  ✓ PASS [T1.F1.5] Every Episode Has Title Card (Scene 0) + Sequential Scenes (19.0ms)
  ✗ FAIL [T1.F2.1] All 40 MP4 Video Files Exist on Disk (0.3ms)
    Message: Missing 40 / 40 MP4 video files (pending Milestone M2 video generation)
  ✗ FAIL [T1.F2.2] ffprobe Validates Container Format (MP4) (0.3ms)
    Message: Zero MP4 files exist to probe (pending Milestone M2 video generation)
  ✗ FAIL [T1.F2.3] ffprobe Validates Video Stream (H.264, >=20 fps) 
  ✗ FAIL [T1.F2.4] ffprobe Validates Audio Stream (AAC, >=44.1 kHz) 
  ✗ FAIL [T1.F2.5] ffprobe Validates Non-Zero Video Duration (> 0.0s) 
  ✗ FAIL [T1.F2.6] Faststart Web Optimization (moov atom before mdat) 
  ✗ FAIL [T1.F2.7] Video Payload Budget Sanity (<= 25 MB per episode) 
  ✓ PASS [T1.F3.1] MovieAudioSynthesizer Exports Singleton & movieAudio Instance (0.1ms)
  ✓ PASS [T1.F3.2] API Method initAudio(): Promise<boolean> Implemented 
  ✓ PASS [T1.F3.3] API Method startEpisodeBgm(episodeId, theme?) Implemented 
  ✓ PASS [T1.F3.4] API Method stopEpisodeBgm() Implemented 
  ✓ PASS [T1.F3.5] Supported BGM Themes Include 6 Core Thematic Presets 
  ✓ PASS [T1.F4.1] Synthesizer Implements English TTS Voiceover Method (0.1ms)
  ✓ PASS [T1.F4.2] TTS Configured with English Voice Matching (en-US / en-GB) 
  ✓ PASS [T1.F4.3] CinematicMoviePlayer Binds English TTS to narrationEn 
  ✓ PASS [T1.F4.4] TTS Voiceover Respects Mute and isTtsEnabled Toggles 
  ✓ PASS [T1.F5.1] Cutscene Dialogues Map to Valid CARD_DATABASE IDs (1..110) (19.9ms)
  ✓ PASS [T1.F5.2] All Referenced Hero Character Portraits Exist in public/seat/ 
  ✓ PASS [T1.F5.3] Active Speaking Character Receives Glowing Highlight & Badge 
  ✗ FAIL [T1.F5.4] Inactive Characters Are Dimmed (Opacity/Grayscale/Scale) 
    Message: Non-speaker dimming missing in player (pending Milestone M1)
  ✓ PASS [T1.F6.1] Webtoon Cutscenes Define Structured Combat sfxCues (18.7ms)
  ✓ PASS [T1.F6.2] CinematicMoviePlayer Renders Visual SFX Onomatopoeia 
  ✓ PASS [T1.F6.3] Procedural Combat Audio SFX Triggered Synchronously 
  ✓ PASS [T1.F7.1] Subtitles Display English Narration/Text for English Viewers (0.1ms)
  ✓ PASS [T1.F7.2] Subtitles Display Localized Text for Non-English Viewers 
  ✓ PASS [T1.F7.3] Subtitle CC Toggle Button Present in Player Control Bar 
  ✓ PASS [T1.F7.4] CC Toggle State Controls Subtitle Visibility Cleanly 
  ✓ PASS [T1.F8.1] Player Mode Switcher Between Cutscene and MP4 Stream (0.2ms)
  ✗ FAIL [T1.F8.2] Native MP4 <video> Playback Element Integrated 
    Message: HTML5 <video> element integration missing for MP4 stream (pending Milestone M2)
  ✗ FAIL [T1.F8.3] Direct MP4 Episode Download Link/Button Integrated 
    Message: Direct MP4 download button missing (pending Milestone M2)

=== [TIER 2] Boundary & Corner Cases (Empty Subtitles, Rapid Skipping, AudioContext, Viewport) ===
  ✓ PASS [T2.B1.1] Empty / Missing Subtitle Graceful Degradation (Zero 'undefined' Text) (0.1ms)
  ✓ PASS [T2.B1.2] Empty Dialogues Handled Without Uncaught TypeError 
  ✓ PASS [T2.B2.1] Rapid Scene Skipping Immediately Cancels Prior TTS Speech (0.1ms)
  ✓ PASS [T2.B2.2] Scene Progress Timers Properly Cleared on Skip (Zero Leaks) 
  ✓ PASS [T2.B2.3] Scene Index Strictly Clamped to [0, totalScenes - 1] 
  ✓ PASS [T2.B3.1] AudioContext.resume() Block Handled Without Uncaught Rejection (0.0ms)
  ✓ PASS [T2.B3.2] Audio Initialization Retried Upon User Gesture (Play / Unmute) 
  ✓ PASS [T2.B4.1] Interactive Controls Meet DESIGN.md 44px+ Touch Target Standard (0.3ms)
  ✓ PASS [T2.B4.2] Subtitle Overlay Wraps Cleanly Without Mobile Overflow 
  ✓ PASS [T2.B5.1] Episode Selection Strictly Clamped to [1, 40] (0.1ms)

=== [TIER 3] Cross-Feature Combinations & State Machine (Mode Switching, CC/Language, TTS Flush, BGM Continuity) ===
  ✓ PASS [T3.X1.1] Switching to MP4 Video Halts Procedural BGM & TTS Voiceover (0.1ms)
  ✓ PASS [T3.X1.2] Switching from MP4 Back to Cutscene Restores Interactive Theater 
  ✓ PASS [T3.X2.1] CC Toggle State Preserved When UI / Subtitle Language Changes (0.0ms)
  ✓ PASS [T3.X2.2] Reactive Subtitle Stream Updates Instantly on Language Selection 
  ✓ PASS [T3.X3.1] TTS Speech Utterance Cleanly Flushed on Rapid Scene Skipping (0.1ms)
  ✓ PASS [T3.X4.1] BGM Maintained Without Glitch/Restart Across Same-Theme Scenes (0.0ms)
  ✓ PASS [T3.X4.2] BGM Theme Transitions Cross-Fade Smoothly (Fade Duration >= 0.5s) 
  ✓ PASS [T3.X5.1] Fullscreen Visual Layers Follow Proper Z-Index Stacking (0.1ms)

=== [TIER 4] Real-World Application Scenarios (Full Playthrough & Reward, MP4 Stream, 40-Ep Catalog, Resiliency) ===
  ✓ PASS [T4.S1.1] Episode Playthrough Completes with onEpisodeComplete Trigger (0.1ms)
  ✓ PASS [T4.S1.2] Viewing Reward (100 SNS) Persisted in LocalStorage (hero_movie_claimed_episodes) 
  ✗ FAIL [T4.S2.1] All 40 Episodes Map to Direct Streaming URL (/videos/episodes/episode_XX.mp4) (0.2ms)
    Message: Missing 40 MP4 files on disk (pending Milestone M2)
  ✗ FAIL [T4.S2.2] Download Links Formatted as SNSHero_Episode_XX.mp4 
    Message: Episode download link and formatted filename supported
  ✓ PASS [T4.S3.1] All 40 Episodes Unlocked with Complete Metadata (0 Blockers) (0.6ms)
  ✓ PASS [T4.S4.1] Player Operates Resiliently Without SpeechSynthesis or WebAudio (0.1ms)

----------------------------------------------------------------------
  SNSHero Movie Theater E2E Test Execution Summary (0.21s)
----------------------------------------------------------------------
  Total Assertions   : 59
  Passed Assertions  : 47
  Failed Assertions  : 12
  Warnings           : 0
  Pass Rate          : 79.7%

STATUS: UNMET MILESTONE REQUIREMENTS DETECTED (12 failures).
Implementation milestones M1 (Player Engine & Audio/Subtitles) and M2 (MP4 Generation) required.
```

---

## 5. Escalation & Handover to Implementation Track

The test suite is complete and ready to validate M1 and M2 implementations:

1. **For Milestone M1 (`worker_m1`)**:
   - Deliver `T1.F5.4`: Non-speaker dimming in `CinematicMoviePlayer.tsx` (`opacity-40`, `grayscale-50`, `scale-95`).
   - Run `python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --milestone M1` to verify M1 completion.

2. **For Milestone M2 (`worker_m2`)**:
   - Generate all 40 MP4 files in `public/videos/episodes/episode_01.mp4`..`episode_40.mp4` via `scripts/generate_all_40_episode_videos.py` using `ffmpeg` with `-pix_fmt yuv420p -movflags +faststart`.
   - Hook up HTML5 `<video>` player and direct MP4 download link formatted as `SNSHero_Episode_XX.mp4`.
   - Run `python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --milestone M2` to verify M2 completion.

3. **For Milestone M3 (Orchestrator)**:
   - Run `python3 tests/e2e_movie_theater/run_movie_e2e_tests.py` with 0 failures to achieve 100% test pass rate across all 59 assertions!
