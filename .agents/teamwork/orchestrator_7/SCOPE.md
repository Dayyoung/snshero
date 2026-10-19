# Scope: Live-Action Cinema Episodes 02–40 Full Production

## Architecture
- **Pipeline Engine**: `scripts/build_cinema_episodes.py` parameterized batch renderer scaling `build_ep01_acting_cinema.py` across Episodes 02–40.
- **Visual Synthesis**: 8-head-tall adult human reference sheets translated from card characters (`public/seat/*.png` and `src/cardDatabase.ts`), avoiding chibi distortions; 8 sequential 3x3 keyframe sheets per episode sliced to 72 WebP frames (`public/images/cinema/episode_XX_acting/seq_XX_frame_XX.webp`).
- **Audio & Video Synthesis**: English opening title card (~4.0s, zero Korean), English (`en`, `say -v Daniel`) TTS narration, D-minor procedural BGM with dynamic voice ducking, PyTorch Apple Silicon MPS GPU optical-flow warping, 24fps H.264/AAC MP4 (`public/videos/cinema/episode_XX.mp4`, 800x450, >=60s, >3MB). Zero subtitles on acting frames.
- **Frontend Integration**: `src/views/CinemaView.tsx` and `src/components/movie/LiveActionCinemaPlayer.tsx` generalized for 1..40 episodes with `[★] 100% 실사 마스터 촬영본 (72프레임 연속 연기)` badge and continuous 72-frame flipbook mode.
- **Verification Harness**: `tests/verify_cinema_40_episodes.py` verifying all 40 MP4s (ffprobe, duration, bitrate, resolution) and 2,880 WebP frames (SHA-256 uniqueness).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Reference Scaler & Verifier Script | Batch generator script & automated 40-episode verification test harness | M1 | Survey 1,3 |
| 2 | Batch Production Act I & II (Ep02–20) | 19 episodes generated: 19 MP4s + 1,368 WebP frames + English TTS & title cards | M2 | Survey 1,2 |
| 3 | Batch Production Act III & IV (Ep21–40) | 20 episodes generated: 20 MP4s + 1,440 WebP frames + English TTS & title cards | M3 | Survey 1,2 |
| 4 | Frontend UI & Player Integration | Update `CinemaView.tsx` and `LiveActionCinemaPlayer.tsx` for all 40 episodes + badges | M4 | Survey 3 |
| 5 | Full Verification & Forensic Audit | Run test harness, tsc, build, challenger, and forensic integrity audit | M5 | Req & Survey |
| 6 | Mandatory Report & Commit | Submit Google Form, update `WORK_LOGS.md`, local git commit | M6 | GEMINI.md |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Pipeline & Verification Harness | `scripts/build_cinema_episodes.py` & `tests/verify_cinema_40_episodes.py` | none | IN_PROGRESS (53b8ef1e-7b09-4b9f-90e1-8aaebcceff8a) |
| M2 | Batch Generation Ep02–20 (Act I & II) | Generate 1,368 frames & 19 MP4s (Episodes 02–20) | M1 | PLANNED |
| M3 | Batch Generation Ep21–40 (Act III & IV) | Generate 1,440 frames & 20 MP4s (Episodes 21–40) | M2 | PLANNED |
| M4 | Frontend CinemaView Integration | Update CinemaView & LiveActionCinemaPlayer for 40 episodes & badges | M3 | PLANNED |
| M5 | Comprehensive Testing & Integrity Audit | Reviewers, Challengers, and Forensic Auditor verification | M4 | PLANNED |
| M6 | Operational Completion & Google Form | `WORK_LOGS.md`, `submit_report.py`, local `git commit` | M5 | PLANNED |

## Interface Contracts
### Generator ↔ File System
- Output MP4: `public/videos/cinema/episode_XX.mp4` (XX = 01..40, 800x450, 24fps, H.264 / AAC, >=60.0s, > 3.0MB)
- Output Frames: `public/images/cinema/episode_XX_acting/seq_YY_frame_ZZ.webp` (YY = 01..08, ZZ = 01..09, 72 frames per episode, distinct SHA-256)

### Player ↔ Video/Frame URLs
- URL Pattern: `/videos/cinema/episode_${padEp}.mp4`
- Frame Pattern: `/images/cinema/episode_${padEp}_acting/seq_${padSeq}_frame_${padFrm}.webp`
- Normalized progress formula: `storyProg = (currentSceneIdx - 1 + sceneProgress) / numStoryScenes` -> `globalFrame = floor(storyProg * 72)`

### Verification Harness ↔ CI / Gate
- Returns exit code 0 if and only if all 40 episodes pass ffprobe and SHA-256 uniqueness checks.
