# BRIEFING — 2026-10-18T06:09:00Z

## Mission
Investigate Movie Theater UI player, Web Audio synthesizer, English TTS voiceover, character portrait highlighting, combat SFX onomatopoeia, and multi-language subtitle system for SNSHero.

## 🔒 My Identity
- Archetype: explorer
- Roles: teamwork_preview_explorer
- Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_movie_2/
- Original parent: 96a5db53-d59f-4183-b06a-28ab995854d3
- Milestone: movie_theater_investigation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Scope: Movie Theater UI player, Web Audio synthesizer, English TTS voiceover, character portrait highlighting, combat SFX onomatopoeia, and multi-language subtitle system.

## Current Parent
- Conversation ID: 96a5db53-d59f-4183-b06a-28ab995854d3
- Updated: 2026-10-18T06:09:00Z

## Investigation State
- **Explored paths**:
  - `ORIGINAL_REQUEST.md`: latest section `## 2026-10-18T06:00:31Z` (R1-R5)
  - `src/views/MovieView.tsx`: state management, episode navigation, player mode toggle
  - `src/components/movie/CinematicMoviePlayer.tsx`: cutscene rendering, Ken Burns motion, subtitle overlay, timeline controls
  - `src/lib/MovieAudioSynthesizer.ts`: Web Audio procedural BGM themes & battle SFX, SpeechSynthesis engine
  - `src/content/webtoonEpisodeManifest.json`: 40 episodes, 2,049 cutscenes, dialogues, sfxCues
  - `src/content/movieEpisodeMapping.ts`: 40 episode metadata, BGM themes, VFX presets
  - `public/seat/*.png`: 111 character portraits, 100% matched to scene characters/speakers
  - `src/lib/i18n.ts`: 13 supported languages
  - System tools: FFmpeg 8.0.1 and ffprobe
- **Key findings**:
  1. All 2,049 cutscene files exist locally in `public/images/webtoon/episode_01~40/scene_00~XX.webp`. Current `CinematicMoviePlayer` erroneously filters out `img.index === 0` (`scene_00.webp` title card) and assumes 20 scenes per episode.
  2. BGM cuts out due to: (a) autoplay blocking AudioContext on mount when `isPlaying: true` defaults without gesture; (b) per-scene BGM restart inside scene-change useEffect; (c) absence of unmount cleanup causing stale `currentTheme` locks.
  3. English TTS is currently disabled when `language !== 'en'`, speaking Korean instead of the required English-base voiceover. Character dialogues are omitted from TTS.
  4. Character portraits in `public/seat/*.png` are 100% mapped (33/33 characters, 28/28 speakers), but currently not rendered at all on the movie stage.
  5. 2,589 comic SFX cues exist in manifest (`slash`, `magic`, `impact`, `rumble`), but are completely ignored by `CinematicMoviePlayer`.
  6. Subtitle mode is currently hardcoded dual/primary cycling without a clean CC ON/OFF toggle, and collapses non-EN/JA languages to Korean.
  7. No MP4 video player or download button currently exists in `MovieView.tsx` or `CinematicMoviePlayer.tsx`.
- **Unexplored areas**: None. All 7 research questions thoroughly analyzed.

## Key Decisions Made
- Fully documented evidence-based solutions, proposed code changes, timing models, and verification methods in `handoff.md`.

## Artifact Index
- /Users/dayyoung/project/snshero/.agents/teamwork/explorer_movie_2/handoff.md — Final investigation report
