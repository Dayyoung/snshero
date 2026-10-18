## 2026-10-18T06:03:55Z
You are explorer_movie_2, a teamwork_preview_explorer for the SNSHero project.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_movie_2/

Scope & Boundaries:
- READ-ONLY exploration. DO NOT modify any code or assets.
- Your mission is to investigate the Movie Theater UI player, Web Audio synthesizer, English TTS voiceover, character portrait highlighting, combat SFX onomatopoeia, and multi-language subtitle system.

Input Reference:
- Read /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (specifically the latest section ## 2026-10-18T06:00:31Z).
- Inspect:
  1. src/views/MovieView.tsx
  2. src/components/movie/CinematicMoviePlayer.tsx
  3. src/lib/MovieAudioSynthesizer.ts
  4. src/content/movieEpisodeMapping.ts
  5. i18n support in src/lib/i18n.ts and subtitle rendering

Key Questions to Answer:
1. Current Movie Player state: how are scenes loaded, timed, and advanced? How to support all 2,049 cutscenes smoothly across all 40 episodes?
2. Web Audio Synthesizer: why might BGM cut out during scene transitions or audio context autoplay policies? How to ensure reliable initialization on Play and uninterrupted continuous playback of episode-matched BGM themes?
3. English-Base Cutscene & English TTS Voiceover: how to implement reliable English SpeechSynthesis (en-US/en-GB) reading narrationEn and English dialogues aloud when TTS is enabled, regardless of user UI language?
4. Speaking Character Highlight & Dialogue Overlay: how to render speaking portraits (public/seat/*.png) with active glowing frame, aura pulse, and speaker badge while dimming non-speaking characters on the movie stage?
5. Combat Onomatopoeia (SFX) Visuals: how to dynamically render visual comic/webtoon sound effect overlays (from sfxCues, e.g., CLANG!, SLASH!, BOOM!) on the canvas/stage with punchy animations and synchronized procedural audio SFX?
6. Multi-Language Subtitles & CC ON/OFF Toggle: how to provide synchronized subtitle overlays (English when language==='en', selected language when language!=='en') with an intuitive CC ON/OFF toggle in both Interactive Cutscene Mode and MP4 Video Mode?
7. MP4 Video Mode UI: how to toggle between Interactive Cutscene Mode and MP4 Video Mode, including playback controls and an MP4 download button?
