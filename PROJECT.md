# Project: SNSHero 40-Episode IP Trilogy Full-scale Commercial Remake (Web Novel, Webtoon, Full Movie)

## Architecture
The SNSHero media subsystem consists of three integrated creative experiences powered by React 19, TypeScript 5.8, Tailwind CSS 4.1, and client-side web APIs:
1. **Web Novel Engine (`NovelView.tsx`)**: Renders high-fantasy literary prose across 40 episodes (`public/book/episode_01.md`–`episode_40.md`) and English adaptations (`englishNovelMapping.ts`), supporting paragraph-level Web SpeechSynthesis TTS, font-mono typography, interactive lore keyword inspection (`loreRecruitmentStore.ts`), and LocalStorage progress persistence.
2. **Webtoon Comic Reader (`NovelView.tsx` cartoon mode)**: Renders 40 episodes (840 panels) in vertical scroll and slide modes, enriched with structured comic direction (`WebtoonSpeechBubble`, `WebtoonSfxOverlay`, `WebtoonMonologueBox`, `WebtoonPanelCard`), generative dark-fantasy key illustrations (`generate_image`), and speaker-attributed dialogue datasets (`webtoonEpisodeManifest.json`, `image_narrations/*.json`).
3. **In-App Theatrical Movie Engine (`MovieView.tsx`)**: Unlocks all 40 episodes (episodes 1–40, 0 episodes blocked), providing dual playback capability: official YouTube streams for episodes 1–8 and an in-app Generative Cinematic Movie Player (`CinematicMoviePlayer.tsx`) for all 40 episodes. The player renders 20-scene animated storyboards with Ken Burns multi-plane camera motion (pan/zoom/shake), procedural particle VFX (snow, embers, runes, slashes), procedural Web Audio API soundtrack & battle SFX synthesis (`MovieAudioSynthesizer.ts`), synchronized bilingual voiceover narration, and theatrical subtitles.
4. **App Shell & Persistence (`HomeView.tsx`, `webtoonProgress.ts`, `App.tsx`)**: Provides 1-click media shortcuts from the home dashboard, argument-order-agnostic season-isolated LocalStorage state (`hero_novel_progress_{season}`, `hero_movie_progress_{season}`), and 100% adherence to `DESIGN.md` (font-mono, 0px/4px border radii, 44px+ mobile touch targets).

## Feature Inventory
Every feature from the Survey phase is mapped to a milestone below.
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | 40-Episode Korean Literary Prose Rewrite | Expand public/book/episode_01.md–40.md to ≥ 3,500+ Korean characters each with rich worldbuilding across 11 races | M1 | Survey Ep 1 |
| 2 | Character Dialogue Dramatization | Ensure every Korean episode features ≥ 8+ distinct lines of dialogue (“...”) with authentic character voices | M1 | Survey Ep 1 |
| 3 | Core Lore Keyword Preservation | Preserve keywords (은빛 단검, 알렉산다르, 발리안, 이그니스, 실리아) in prose for SSR Kadan recruitment integration | M1 | Survey Ep 1 |
| 4 | English Novel Commercial Adaptation | Clean 40 English chapters in englishNovelMapping.ts and image_narrations/english_txt/, removing raw image tags and translation glitches | M1 | Survey Ep 1 |
| 5 | Metadata Synchronization | Synchronize episode titles, character counts, and totals in public/book/index.json and englishNovelMapping.ts | M1 | Survey Ep 1 |
| 6 | Generative Dark-Fantasy Art Assets | Generate high-impact key illustrations via generative image tool for key title cards and climax scenes | M2 | Survey Ep 2 |
| 7 | Webtoon Structured Comic Manifest | Enrich webtoonEpisodeManifest.json with speaker-attributed dialogues, monologue cards, and dramatic SFX cues | M2 | Survey Ep 2 |
| 8 | 40-Episode Image Narration Datasets | Enrich public/book/image_narrations/episode_01_narrations.json–episode_40_narrations.json with comic dialogue and SFX tags | M2 | Survey Ep 2 |
| 9 | Comic Direction UI Components | Implement WebtoonSpeechBubble, WebtoonSfxOverlay, WebtoonMonologueBox, and WebtoonPanelCard in DESIGN.md style | M2 | Survey Ep 2 |
| 10 | NovelView Webtoon Reader Refactor | Integrate comic components into vertical scroll and slide modes, fix 5-scene hardcoded scroll bug, and add speech bubble toggle | M2 | Survey Ep 2 |
| 11 | Webtoon Slide Touch Target Fix | Replace 28px (w-7 h-7) buttons with 44px+ mobile touch-compliant buttons in NovelView.tsx slide mode | M2 | Survey Ep 2 |
| 12 | 40-Episode Full Movie Unlocking | Unlock all 40 episodes in MovieView.tsx (default releasedCount = 40, eliminate Coming Soon alert block) | M3 | Survey Ep 3 |
| 13 | Movie Episode Mapping Completion | Populate all 40 episode entries with full metadata in src/content/movieEpisodeMapping.ts | M3 | Survey Ep 3 |
| 14 | In-App Generative Cinematic Movie Player | Implement CinematicMoviePlayer.tsx rendering 20-scene sequences with Ken Burns camera motion and timeline scrub controls | M3 | Survey Ep 3 |
| 15 | Atmospheric Particle VFX Engine | Implement HTML5 canvas particle VFX (snow, embers, runes, combat slashes) with low-spec graceful degradation | M3 | Survey Ep 3 |
| 16 | Procedural Audio Synthesizer & Voiceover | Implement MovieAudioSynthesizer.ts for Web Audio BGM themes & battle SFX, coupled with SpeechSynthesis voiceover | M3 | Survey Ep 3 |
| 17 | Theatrical Subtitles & Playback Controls | Add synchronized bilingual subtitles, play/pause/restart/fullscreen/scrubbing controls with 44px+ touch targets | M3 | Survey Ep 3 |
| 18 | LocalStorage Parameter-Order Agnostic Fix | Update src/lib/webtoonProgress.ts setSeasonItem to be argument-order agnostic, fixing broken persistence | M3 | Survey Ep 3 |
| 19 | MovieView DESIGN.md Touch Target Fix | Upgrade 36px filter tabs and small action buttons in MovieView.tsx to min-h-[44px] | M3 | Survey Ep 3 |
| 20 | Dual-Track E2E Test Suite & Script | Implement scripts/verify_ip_trilogy.ts verifying all 40 episodes of Novel, Webtoon, and Movie | M4 | Survey Ep 3 |
| 21 | Agent-as-Judge Literary Quality Audit | Audit representative sample of early, mid, and late episodes for prose depth, dialogue, and zero AI summary clichés | M4 | Authoritative Spec |
| 22 | 0 TypeScript Errors & Build Cleanliness | Verify npm run lint (tsc --noEmit) and npm run build succeed with 0 errors | M4 | Authoritative Spec |
| 23 | Mandatory Google Form Report Submission | Submit automated completion report to Google Form endpoint upon successful verification | M4 | AGENTS.md / GEMINI.md |

## Milestones
| # | Name | Scope | Dependencies | Status | Agent Conv ID |
|---|------|-------|-------------|--------|---------------|
| M1 | Web Novel Literary Adaptation | Features 1, 2, 3, 4, 5: 40 Korean episodes rewrite (≥3,500 chars, ≥8 dialogues), 40 English chapters adaptation, index.json & englishNovelMapping sync | None | DONE (Gate 3 PASS: Authentic authoring, 0 fillers, 0 duplicate dialogues, Auditor CLEAN) | b716401f-78a4-4740-9b6c-1dc59031606e |
| M2 | Webtoon Remake & Comic Direction | Features 6, 7, 8, 9, 10, 11: Generative dark fantasy illustrations, comic manifest & narrations enrichment, speech bubble & SFX overlay components, NovelView reader refactor, 44px touch targets | None | DONE (Gate 3 PASS: Reviewer 3-1 APPROVE, Auditor CLEAN) | a634589c-3756-4b20-bf6b-8c88452d93e4 |
| M3 | Full Movie Theater & Cinematic Engine | Features 12, 13, 14, 15, 16, 17, 18, 19: All 40 episodes unlocked, CinematicMoviePlayer with Ken Burns camera & particle VFX, MovieAudioSynthesizer procedural BGM/SFX/TTS, setSeasonItem fix, 44px tabs | None | DONE (Gate 3 PASS: Reviewer 3-2 APPROVE, Auditor CLEAN) | 11b3d25f-d7a2-4c84-8cdb-91fefb0f900b |
| M4 | E2E Testing, Audit & Verification | Features 20, 21, 22, 23: Test infrastructure, scripts/verify_ip_trilogy.ts (38/38), challenger stress tests (58/58), Agent-as-Judge (9.64/10), tsc (0 errors), npm run build (clean), Google Form report | M1, M2, M3 | DONE (Gate 3 PASS: 100% Tests Pass, Challenger 3-1 & 3-2 APPROVE) | fdfc9478-8e8e-4ad8-89b0-732e8ff6364f |

## Interface Contracts
### Web Novel ↔ NovelView Reader
- Path: `public/book/episode_${epPad}.md`
- Header: `# 눈히어로 {N}화 - {제목}`
- Lore keywords: Must contain `은빛 단검`, `알렉산다르`, `발리안`, `이그니스`, `실리아` across designated chapters.
- Formatting: Empty line between paragraphs for optimal Web SpeechSynthesis TTS and smooth scrolling.

### Webtoon Manifest ↔ NovelView Cartoon Reader
- Interface: `WebtoonEpisodeManifest` in `src/content/webtoonEpisodeManifest.json`
- Item Schema:
  ```ts
  interface WebtoonSceneImage {
    index: number;
    fileName: string;
    imageUrl: string;
    type: 'title_card' | 'scene';
    narrationEn: string;
    narrationKo: string;
    background: string;
    characters: string[];
    dialogues?: Array<{
      speakerKo: string;
      speakerEn: string;
      textKo: string;
      textEn: string;
      bubbleType?: 'speech' | 'shout' | 'thought' | 'whisper';
      position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    }>;
    sfxCues?: Array<{
      textKo: string;
      textEn: string;
      style?: 'slash' | 'impact' | 'magic' | 'rumble';
      position?: 'center' | 'top-right' | 'bottom-left';
    }>;
  }
  ```

### Movie Player ↔ MovieView
- Interface: `CinematicMoviePlayerProps`
  ```ts
  interface CinematicMoviePlayerProps {
    episodeNumber: number;
    titleKo: string;
    titleEn: string;
    scenes: Array<{
      sceneNumber: number;
      imageUrl: string;
      narrationKo: string;
      narrationEn: string;
      dialogues?: Array<{ speaker: string; text: string }>;
      vfxType?: 'snow' | 'embers' | 'runes' | 'slash' | 'none';
      cameraMotion?: 'pan-left' | 'pan-right' | 'zoom-in' | 'zoom-out' | 'shake';
    }>;
    language: 'ko' | 'en';
    onClose?: () => void;
    onEpisodeComplete?: (epNum: number) => void;
  }
  ```

### LocalStorage Contract (`webtoonProgress.ts`)
- Functions:
  - `getSeasonItem(key: string, season: string): string | null`
  - `setSeasonItem(key: string, arg2: string, arg3: string): void` (must handle both `(key, season, value)` and `(key, value, season)` to support legacy callers).

## Code Layout
- `public/book/`: 40 Korean markdown episode files + `index.json`.
- `public/book/image_narrations/`: 40 scene narration JSONs + `english_txt/`.
- `public/images/webtoon/`: Generated dark-fantasy key art illustrations.
- `src/components/webtoon/`: `WebtoonSpeechBubble.tsx`, `WebtoonSfxOverlay.tsx`, `WebtoonMonologueBox.tsx`.
- `src/components/movie/`: `CinematicMoviePlayer.tsx`, `MovieVfxCanvas.tsx`.
- `src/lib/`: `MovieAudioSynthesizer.ts`, `webtoonProgress.ts`.
- `src/content/`: `webtoonEpisodeManifest.json`, `movieEpisodeMapping.ts`, `englishNovelMapping.ts`.
- `src/views/`: `NovelView.tsx`, `MovieView.tsx`, `HomeView.tsx`.
- `scripts/`: `verify_ip_trilogy.ts`.
