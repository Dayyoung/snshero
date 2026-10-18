## 2026-10-17T21:46:01Z

You are the Project Orchestrator (teamwork_preview_orchestrator) for the SNSHero project.

Working Directory: /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_1/
Project Root: /Users/dayyoung/project/snshero
Authoritative Request: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md

Your mission is to orchestrate and execute the complete, full-scale commercial-grade remake of the 40-episode SNSHero IP trilogy — Web Novel, Webtoon, and Full Movie — in the SNSHero web application, strictly adhering to all requirements and acceptance criteria specified in ORIGINAL_REQUEST.md.

Key Responsibilities & Deliverables:
1. R1. 40-Episode Web Novel Full Literary Adaptation (KO & EN):
   - Rewrite and expand all 40 episodes (public/book/episode_01.md - episode_40.md and English counterparts).
   - Rich fantasy literary prose: ≥ 3,500+ Korean characters per episode, ≥ 8+ lines of character dialogue (“...”), zero repetitive AI clichés.
   - Synchronized metadata in public/book/index.json and src/content/englishNovelMapping.ts.
   - Automated verification script and high literary audit standards.

2. R2. 40-Episode Webtoon Remake with Generative Visuals & Comic Direction:
   - Upgrade NovelView cartoon mode, src/content/webtoonEpisodeManifest.json, and public/book/image_narrations/episode_01_narrations.json–episode_40_narrations.json.
   - Generative dark-fantasy visuals / key art / climax panels, structured comic direction (speech bubbles, thoughts, dramatic SFX typography overlays, cinematic framing).
   - Clean vertical scroll and slide modes on mobile and desktop.

3. R3. 40-Episode Full Movie Theater & In-App Cinematic Engine:
   - Remake MovieView.tsx and src/content/movieEpisodeMapping.ts so all 40 episodes are immediately unlocked and playable end-to-end.
   - In-app Generative Cinematic Movie Player rendering full animated theatrical sequences with multi-plane camera motion (Ken Burns pan/zoom/shake), particle VFX (blizzard, embers, runes, slashes), procedural/synthesized soundtrack & SFX, synchronized bilingual voiceover narration, theatrical subtitles, and playback controls.

4. R4. Seamless Main App Integration & LocalStorage Persistence:
   - Clean integration with HomeView.tsx shortcuts, season-isolated localStorage progress tracking (hero_novel_progress_{season}, hero_movie_progress_{season}).
   - Strict DESIGN.md compliance (font-mono, rounded-none containers, rounded-sm interactive elements, 44px+ mobile touch targets).
   - 0 TypeScript errors (npm run lint / tsc --noEmit) and 0 build errors (npm run build).
   - Mandatory Google Form completion reporting as required by AGENTS.md / GEMINI.md.


## 2026-10-18T06:02:02Z

You are the Project Orchestrator for SNSHero.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_1/
The project root is: /Users/dayyoung/project/snshero

Please read the user's latest request in:
/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (under section ## 2026-10-18T06:00:31Z)

Key Requirements:
1. Updated Webtoon Cutscene Integration & Continuous Episode BGM on Play:
   - Update `CinematicMoviePlayer.tsx` and `MovieView.tsx` to play all 40 episodes using all newly expanded 2,049 webtoon cutscenes (`scene_00.webp` through `scene_XX.webp` from `webtoonEpisodeManifest.json`).
   - Reliable initialization/resumption of Web Audio synthesizer (`MovieAudioSynthesizer.ts`) when Play is pressed; plays continuous episode-matched BGM throughout movie playback and across scene transitions without cutting out.
2. English-Base Cutscene Display, English TTS Voiceover & Highlighted Character Dialogue:
   - English TTS voiceover: read `narrationEn` and English dialogue lines aloud using English TTS (`en-US`/`en-GB` SpeechSynthesis) when enabled, regardless of user UI language.
   - Display cutscene spoken dialogue in English (`textEn`, `speakerEn`) on the movie stage; highlight speaking character by rendering remastered portrait (`public/seat/*.png`) with active glowing frame, aura pulse, and speaker badge while dimming non-speaking characters.
   - Animated combat onomatopoeia (SFX) visuals (`sfxCues`) on the movie canvas/stage alongside procedural combat audio SFX.
3. Per-Episode MP4 Video Generation Across All 40 Episodes:
   - Generate standalone `.mp4` video files (`public/videos/episodes/episode_01.mp4` through `public/videos/episodes/episode_40.mp4`) using `/opt/homebrew/bin/ffmpeg`.
   - Each MP4 must include all cutscenes of that episode in sequence, overlaid/burned-in cutscene presentation/SFX styling, and embedded procedural/synthesized episode BGM audio track (`aac`).
   - Browser-compatible web encoding (`-pix_fmt yuv420p -movflags +faststart`).
   - Integrate MP4 playback and download support into `CinematicMoviePlayer.tsx` / `MovieView.tsx`.
4. Multi-Language Subtitle System & Subtitle ON/OFF Toggle:
   - Synchronized subtitle overlay in movie player for both Interactive Cutscene Mode and MP4 Video Mode.
   - When language is 'en', display English subtitles (`narrationEn` / `textEn`).
   - When language is other ('ko', etc.), display subtitles in that selected language (`narrationKo` / `textKo`, etc.).
   - Intuitive Subtitle ON/OFF toggle button (`CC / 자막 ON·OFF`).
5. Quality & Compliance:
   - Strict adherence to DESIGN.md.
   - Zero errors on `npm run lint` (`tsc --noEmit`) and `npm run build`.
   - Local git commit only (never git push unless requested).
   - Log to `WORK_LOGS.md` and submit Google Form report (`python3 skills/report-ex/scripts/submit_report.py`).
