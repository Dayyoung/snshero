## 2026-10-17T21:54:23Z
[Message] timestamp=2026-10-17T21:54:23Z sender=b25c9f85-c96b-42a7-bce3-42d8c13e23ed priority=MESSAGE_PRIORITY_HIGH content=You are worker_movie (teamwork_preview_worker).
Working Directory: /Users/dayyoung/project/snshero/.agents/teamwork/worker_movie/
Authoritative Request: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md
PROJECT Specification: /Users/dayyoung/project/snshero/PROJECT.md
Survey 3 Report: /Users/dayyoung/project/snshero/.agents/teamwork/survey_explorer_3/survey_report.md
Parent Orchestrator ID: b25c9f85-c96b-42a7-bce3-42d8c13e23ed

READ ORIGINAL_REQUEST.md AND PROJECT.md FIRST BEFORE STARTING.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Exclusively Owned Files:
- src/views/MovieView.tsx
- src/content/movieEpisodeMapping.ts
- src/components/movie/* (CinematicMoviePlayer.tsx, MovieVfxCanvas.tsx)
- src/lib/MovieAudioSynthesizer.ts
- src/lib/webtoonProgress.ts

Tasks:
1. Fix critical latent bug in src/lib/webtoonProgress.ts: make setSeasonItem argument-order agnostic so (key, value, season) and (key, season, value) both persist correctly to ${key}_${season}.
2. Unlock all 40 episodes in MovieView.tsx: set default releasedCount = 40 and remove the episode > 8 alert blocker completely so all 40 episodes are 100% playable end-to-end.
3. Complete all 40 episode entries in src/content/movieEpisodeMapping.ts with rich metadata.
4. Implement src/lib/MovieAudioSynthesizer.ts: Web Audio API procedural sound engine with fantasy ambient BGM themes, battle SFX, and SpeechSynthesis voiceover narration for each scene.
5. Implement src/components/movie/CinematicMoviePlayer.tsx: In-app Generative Cinematic Movie Player rendering 20-scene animated theatrical sequences with Ken Burns multi-plane camera motion (pan/zoom/shake), HTML5 particle VFX (snow/blizzard, embers, runes, slashes), synchronized bilingual voiceover & theatrical subtitles, timeline scrub controls, fullscreen mode, and 44px+ mobile touch targets.
6. Upgrade MovieView.tsx: Mount CinematicMoviePlayer, provide dual playback modes (In-App Cinematic Player vs YouTube Official Stream for 1-8), and upgrade filter tabs and action buttons to min-h-[44px].
7. Verify npx tsc --noEmit and npm run build pass with code 0.
8. Write your handoff report at /Users/dayyoung/project/snshero/.agents/teamwork/worker_movie/handoff.md and notify the parent orchestrator via send_message.
