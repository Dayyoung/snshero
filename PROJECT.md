# Project: SNSHero Movie Theater Upgrade & 40-Episode Standalone MP4 Video Generation

## Architecture
- **Domain**: Movie Theater, Webtoon Cutscenes, Web Audio Synthesizer, English TTS SpeechSynthesis, Character Portraits & SFX Overlays, FFmpeg Video Generation, Multi-Language Subtitles.
- **Data Flow**:
  1. Manifest & Cutscenes: `src/content/webtoonEpisodeManifest.json` (40 episodes, 2,049 cutscenes: `scene_00.webp` title card + `scene_01.webp`..`scene_XX.webp` story scenes) stored in `public/images/webtoon/episode_01~40/`.
  2. Character Portraits & Database: `src/cardDatabase.ts` and `public/seat/*.png` (110 hero cards).
  3. Interactive Movie Player: `src/components/movie/CinematicMoviePlayer.tsx` and `src/views/MovieView.tsx` with dynamic reading/speech timing, active speaker highlight dock, canvas SFX animations, and multi-language subtitle overlay.
  4. Audio Engine: `src/lib/MovieAudioSynthesizer.ts` providing uninterrupted procedural BGM anchored to episode lifecycle and speech synthesis voiceover.
  5. Video Generation Pipeline: Python Pillow frame compositing + NumPy procedural AAC audio synthesis + `/opt/homebrew/bin/ffmpeg` concat demuxer generating 40 browser-compatible MP4 files (`public/videos/episodes/episode_01.mp4`..`episode_40.mp4`).
  6. Subtitle & Internationalization: Multi-language subtitles (`en` -> `narrationEn`/`textEn`; other -> `narrationKo`/`textKo` or localized) with `[CC ON/OFF]` toggle for both Interactive Cutscene Mode and MP4 Video Mode.
- **Dual Track Organization**:
  - **E2E Testing Track**: Autonomous requirement-driven test harness, verifying all 40 MP4 videos, cutscenes, BGM playback, TTS voiceover, character highlights, SFX overlays, subtitles, and CC controls across Tiers 1–4. Publishes `TEST_READY.md`.
  - **Implementation Track**: Executes M1 -> M2 -> M3 -> M4 (Final Milestone: E2E Pass + Tier 5 Adversarial Hardening + Project Hygiene).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 2,049 Webtoon Cutscenes Integration | Load and play all 2,049 cutscenes across all 40 episodes (including `scene_00.webp` title cards) with dynamic timing | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Continuous Episode BGM on Play | Reliable initialization/resumption of `MovieAudioSynthesizer.ts` on Play; continuous BGM anchored to episode lifecycle without scene-transition cutouts | M1 | ORIGINAL_REQUEST §R1 |
| 3 | English-Base Cutscene & TTS Voiceover | Display English dialogues (`textEn`, `speakerEn`); read `narrationEn` and English dialogues aloud via `en-US`/`en-GB` SpeechSynthesis when TTS enabled | M1 | ORIGINAL_REQUEST §R2 |
| 4 | Speaking Character Highlight | Render active speaking character's remastered portrait (`public/seat/*.png`) with glowing frame, aura pulse, and speaker badge while dimming non-speakers | M1 | ORIGINAL_REQUEST §R2 |
| 5 | Animated Combat SFX Onomatopoeia | Prominently display animated comic/webtoon sound effects (`sfxCues`) on movie canvas/stage alongside procedural combat audio SFX | M1 | ORIGINAL_REQUEST §R2 |
| 6 | Multi-Language Subtitle System & CC Toggle | Synchronized subtitle overlay (English when `language==='en'`, selected language when not) with intuitive `[CC ON/OFF]` toggle button in both modes | M1 | ORIGINAL_REQUEST §R4 |
| 7 | Standalone 40-Episode MP4 Video Generation | Generate 40 browser-compatible MP4 files (`public/videos/episodes/episode_01.mp4`..`episode_40.mp4`) with all cutscenes, burned-in English styling/SFX, and embedded AAC BGM | M2 | ORIGINAL_REQUEST §R3 |
| 8 | MP4 Player Mode & Download Integration | Integrate MP4 video playback and direct download support into `CinematicMoviePlayer.tsx` / `MovieView.tsx` with seamless mode toggle | M2 | ORIGINAL_REQUEST §R3 |
| 9 | Dual-Track Requirement-Driven E2E Test Suite | Autonomous E2E test harness covering Tiers 1–4 across all features, producing `TEST_READY.md` | E2E-Track | Dual Track Architecture |
| 10 | 100% E2E Test Suite Pass | Verification that 100% of Tiers 1–4 E2E tests pass without regressions | M3 | Dual Track Architecture |
| 11 | Tier 5 Adversarial Coverage Hardening | White-box adversarial testing, edge case torture tests, and stress tests | M4 | Project Pattern §Dual Track |
| 12 | Project Hygiene, Lint, Build & Google Form Report | `npm run lint` & `npm run build` pass with 0 errors, local git commit, `WORK_LOGS.md`, and Google Form report | M4 | ORIGINAL_REQUEST §R5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Suite | Requirements-driven test suite (Tiers 1–4) & runner publishing `TEST_READY.md` | Survey | DONE (`TEST_READY.md`, 59/59 passing) |
| M1 | Movie Player Engine & Audio/Subtitles | 2,049 cutscenes, continuous BGM, English TTS, character highlight, SFX onomatopoeia, subtitles & CC toggle | Survey | DONE (CinematicMoviePlayer.tsx, MovieAudioSynthesizer.ts, MovieView.tsx) |
| M2 | 40-Episode MP4 Generation & Player Hookup | Generate 40 MP4 videos via FFmpeg+Pillow+NumPy BGM, browser-compatible flags, player MP4 mode & download | M1 | DONE (40/40 MP4s in public/videos/episodes/, 187.8MB, Faststart) |
| M3 | E2E Test Suite Pass (Tiers 1–4) | Pass 100% of E2E tests from `TEST_READY.md` | M1, M2, E2E | DONE (59/59 Assertions Passed, Exit Code 0) |
| M4 | Final Milestone & Project Hygiene | Tier 5 adversarial hardening, lint/build 0 errors, local commit, WORK_LOGS.md, Google Form report | M3 | DONE (Gate Passed: Reviewers APPROVE, Challengers APPROVE, Auditor CLEAN) |

## Interface Contracts
### 1. Webtoon Cutscene Manifest ↔ CinematicMoviePlayer
- Manifest path: `src/content/webtoonEpisodeManifest.json`
- Episode IDs: `"1"` through `"40"`
- Image scenes: `images` array (`index: 0` title card to `index: XX` climax/conclusion)
- Scene schema:
  - `index`: number
  - `imageUrl`: string (e.g., `/images/webtoon/episode_01/scene_00.webp`)
  - `localArtUrl`: string
  - `narrationKo`: string
  - `narrationEn`: string
  - `characters`: string[]
  - `dialogues`: Array<{ speakerKo: string, speakerEn: string, textKo: string, textEn: string, bubbleType?: string, characterCardId?: number }>
  - `sfxCues`: Array<{ type: string, textKo: string, textEn: string, intensity?: string }>

### 2. Character Portrait Mapping ↔ Stage Dock
- Card Database: `src/cardDatabase.ts`
- Portrait directory: `public/seat/*.png`
- Mapping formula:
  - By `characterCardId`: `CARD_DATABASE[characterCardId]?.title_en` -> `/seat/${title_en.replace(/ /g, '_')}.png`
  - By `speakerEn` / `speakerKo`: lookup in character name alias map -> `/seat/${matchedTitleEn.replace(/ /g, '_')}.png`
- Visual styling:
  - Active speaker: glowing amber border (`border-amber-400`), pulse aura (`shadow-[0_0_15px_rgba(251,191,36,0.6)]`), scale-105, speaker badge `[SPEAKER]`
  - Non-speaker: opacity-40, grayscale-50, scale-95

### 3. Movie Audio Synthesizer ↔ Movie Player
- API methods in `MovieAudioSynthesizer.ts`:
  - `initAudio(): Promise<boolean>`: resumes AudioContext on user gesture
  - `startEpisodeBgm(episodeId: number, theme?: string): void`: starts continuous episode BGM without restarting on scene transitions
  - `stopEpisodeBgm(): void`: stops episode BGM on movie pause or exit
  - `speakEnglishNarration(text: string, onEnd?: () => void): void`: speaks narration via `en-US`/`en-GB` SpeechSynthesis
  - `playSfx(type: string): void`: triggers procedural combat sound effects

### 4. Standalone MP4 Videos ↔ Web Serving & Download
- Video directory: `public/videos/episodes/`
- Video naming: `episode_01.mp4` through `episode_40.mp4`
- Video container: MP4 (H.264 video + AAC stereo audio at 44.1kHz)
- Video dimensions: `800 x 450` px, 24 fps
- Flags: `-pix_fmt yuv420p -movflags +faststart`
- Serving URL: `/videos/episodes/episode_XX.mp4`
- Download filename: `SNSHero_Episode_XX.mp4`

## Code Layout
- Player UI: `src/components/movie/CinematicMoviePlayer.tsx`, `src/views/MovieView.tsx`
- Audio Engine: `src/lib/MovieAudioSynthesizer.ts`
- Manifest & Mapping: `src/content/webtoonEpisodeManifest.json`, `src/content/movieEpisodeMapping.ts`
- Video Generation Script: `scripts/generate_all_40_episode_videos.py`
- Video Assets: `public/videos/episodes/episode_01.mp4`..`episode_40.mp4`
- Cutscene Images: `public/images/webtoon/episode_01/`..`episode_40/`
- Hero Portraits: `public/seat/*.png`
- E2E Tests: `tests/e2e_movie_theater/`
- Agent Workspace: `.agents/teamwork/`
