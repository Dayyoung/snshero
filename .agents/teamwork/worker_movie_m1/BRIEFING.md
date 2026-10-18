# BRIEFING — 2026-10-18T06:25:00Z

## Mission
Implement M1 requirements for CinematicMoviePlayer, MovieView, MovieAudioSynthesizer, and movieEpisodeMapping: 2,049 cutscenes integration, continuous BGM, English-base dialogues & TTS, speaking character highlights, animated SFX onomatopoeia, multi-language subtitles & CC toggle, mode switcher & MP4 hook.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/worker_movie_m1
- Original parent: 96a5db53-d59f-4183-b06a-28ab995854d3
- Milestone: M1

## 🔒 Key Constraints
- Exclusively own:
  - src/components/movie/CinematicMoviePlayer.tsx
  - src/views/MovieView.tsx
  - src/lib/MovieAudioSynthesizer.ts
  - src/content/movieEpisodeMapping.ts
- DO NOT edit tests in tests/ or video generation scripts.
- Zero lint/typecheck errors (npm run lint).
- No cheating, no facade implementations, genuine logic.
- LocalStorage only, no broken imports.

## Current Parent
- Conversation ID: 96a5db53-d59f-4183-b06a-28ab995854d3
- Updated: 2026-10-18T06:25:00Z

## Task Summary
- **What to build**: 2,049 cutscenes integration (including scene_00.webp title cards), dynamic timing based on English word count, continuous BGM across scenes without transition restarts, English dialog & TTS voiceover, active speaking character highlight with remastered portraits, comic SFX onomatopoeia with Web Audio SFX cues, CC toggle and multi-language subtitle overlay, interactive cutscene vs MP4 mode switcher and MP4 download hook.
- **Success criteria**: All M1 requirements fulfilled, tsc/lint pass with 0 errors, production build pass, self-contained handoff.md, Google Form reported.
- **Interface contracts**: PROJECT.md, ORIGINAL_REQUEST.md, explorer handoffs.
- **Code layout**: src/components/movie/, src/views/, src/lib/, src/content/.

## Key Decisions Made
- Anchored continuous BGM to episode lifecycle via `startEpisodeBgm(episodeNumber, theme)` so scene transitions never chop or reset BGM.
- Prioritized high-fidelity English voices ('Google US English', 'Samantha', 'Daniel', 'Alex', etc.) in `speakEnglishNarration()`.
- Implemented `getCharacterPortraitUrl` in `movieEpisodeMapping.ts` mapping both `characterCardId` and English/Korean speaker names into `public/seat/*.png`.
- Embedded Stage Character Dock: active speaker scaled with amber glowing ring and `[🎙️ SPEAKER]` badge while dimming non-speakers.
- Embedded Stage Dialogue Box rendering spoken text in English on stage.
- Integrated animated comic SFX cues (`sfxCues`) with interactive replay trigger and procedural Web Audio SFX.
- Designed continuous range scrubber for 40-55 scenes with no squishing/overflow on mobile devices.
- Added 3-way mode switch in `MovieView.tsx`: `[🎬 인터랙티브 영화관 (40부작)]` | `[🎞️ MP4 비디오 상영]` | `[📺 YouTube 오피셜]`.
- Added MP4 video player container and direct `[⬇️ MP4 다운로드]` action button.

## Artifact Index
- /Users/dayyoung/project/snshero/.agents/teamwork/worker_movie_m1/DISPATCH.md
- /Users/dayyoung/project/snshero/.agents/teamwork/worker_movie_m1/BRIEFING.md
- /Users/dayyoung/project/snshero/.agents/teamwork/worker_movie_m1/progress.md
- /Users/dayyoung/project/snshero/.agents/teamwork/worker_movie_m1/handoff.md

## Change Tracker
- **Files modified**:
  - `src/lib/MovieAudioSynthesizer.ts`: added `startEpisodeBgm`, `stopEpisodeBgm`, `speakEnglishNarration`, natural English voice priority, and audio context resume handling.
  - `src/content/movieEpisodeMapping.ts`: added `getCharacterPortraitUrl` mapping helper for `characterCardId` and speaker names to `public/seat/*.png`.
  - `src/components/movie/CinematicMoviePlayer.tsx`: loaded all 2,049 cutscenes with title cards, dynamic speech timing, active speaker highlight dock, comic SFX onomatopoeia overlays, multi-language subtitles with `[CC ON/OFF]` toggle, and responsive range scrubber.
  - `src/views/MovieView.tsx`: added 3-way mode switcher (Interactive Cutscene, MP4 Video, YouTube Stream), video player container, and MP4 download button linking to `/videos/episodes/episode_XX.mp4`.
- **Build status**: `npx tsc --noEmit` PASS (0 errors), `npm run build` PASS (16.27s bundle).
- **Pending issues**: none

## Quality Status
- **Build/test result**: PASS (TypeScript 0 errors, build 0 errors, automated verification script PASS).
- **Lint status**: PASS (npm run lint).
- **Tests added/modified**: none in tests/ (strictly preserved per scope rule).

## Loaded Skills
- None
