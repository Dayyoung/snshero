## 2026-10-18T06:13:34Z
You are worker_movie_m1, a teamwork_preview_worker for the SNSHero project.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/worker_movie_m1/

Scope & Write Ownership:
- You exclusively own:
  - src/components/movie/CinematicMoviePlayer.tsx
  - src/views/MovieView.tsx
  - src/lib/MovieAudioSynthesizer.ts
  - src/content/movieEpisodeMapping.ts
- DO NOT edit tests in tests/ or video generation scripts.

Input Reference:
- Read /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (specifically ## 2026-10-18T06:00:31Z).
- Read /Users/dayyoung/project/snshero/PROJECT.md.
- Read /Users/dayyoung/project/snshero/.agents/teamwork/explorer_movie_1/handoff.md and explorer_movie_2/handoff.md for exact blueprints, root causes, and schemas.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Core Requirements to Implement for M1:
1. 2,049 Webtoon Cutscenes Integration:
   - Update CinematicMoviePlayer.tsx to include scene_00.webp (index: 0 title card) and all story scenes from webtoonEpisodeManifest.json for all 40 episodes.
   - Replace fixed 6.5s scene timer with dynamic timing based on narration word count / speech duration.
   - Refactor bottom scrubber to handle 40-55 scenes gracefully without visual overflow.
2. Continuous Episode BGM on Play:
   - In MovieAudioSynthesizer.ts and CinematicMoviePlayer.tsx: reliably resume/initialize AudioContext on Play button user gesture.
   - Anchor BGM to episode lifecycle: BGM starts on Play and plays continuously across scene transitions without restarting or cutting out.
   - Provide proper unmount cleanup stopping all oscillators/intervals when leaving player or switching modes.
3. English-Base Cutscene & TTS Voiceover:
   - Display cutscene spoken dialogue in English (textEn, speakerEn) on the movie stage.
   - When TTS is enabled, read narrationEn and English dialogues aloud using English SpeechSynthesis (en-US / en-GB voice priority) regardless of user UI language.
4. Speaking Character Highlight:
   - Render active speaking character's remastered portrait (public/seat/*.png mapped via characterCardId or character name) on the movie stage with glowing active frame, aura pulse, and speaker badge while dimming non-speakers.
5. Animated Combat SFX Onomatopoeia:
   - Prominently display animated comic sound effect overlays (sfxCues, e.g. CLANG!, SLASH!, BOOM!) on the canvas/stage with dynamic animations and synchronized procedural audio SFX.
6. Multi-Language Subtitles & CC Toggle:
   - Provide synchronized subtitle overlay: English when user language is 'en', selected language (narrationKo/textKo or translated) when language is not 'en'.
   - Add intuitive [CC ON/OFF] toggle button in player control bar working in both modes.
7. Mode Switcher & MP4 UI Hook:
   - Add UI toggle between Interactive Cutscene Mode and MP4 Video Mode, including playback controls and an MP4 download button linking to /videos/episodes/episode_XX.mp4.
8. Verification:
   - Run npm run lint (tsc --noEmit) and confirm 0 errors.
   - Document commands, code changes, and test results in /Users/dayyoung/project/snshero/.agents/teamwork/worker_movie_m1/handoff.md.
   - Send completion message to parent orchestrator when done.
