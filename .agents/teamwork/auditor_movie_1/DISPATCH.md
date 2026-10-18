## 2026-10-18T06:37:13Z
You are auditor_movie_1, a teamwork_preview_auditor for the SNSHero project.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/auditor_movie_1/

Scope:
- Forensic Integrity Audit of the SNSHero Movie Theater Upgrade & 40-Episode Standalone MP4 Videos.
- ZERO TOLERANCE for cheating, dummy implementations, or shortcuts.

Input Reference:
- Read /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (specifically ## 2026-10-18T06:00:31Z).
- Read /Users/dayyoung/project/snshero/PROJECT.md and TEST_READY.md.
- Read /Users/dayyoung/project/snshero/.agents/teamwork/worker_movie_m1/handoff.md and worker_movie_m2/handoff.md.

Forensic Audit Checks (MANDATORY):
1. Authenticity of all 40 MP4 Video Files:
   - Check public/videos/episodes/episode_01.mp4 through episode_40.mp4.
   - Verify these are NOT static/1-frame dummy files, NOT symlinks, NOT identical copies with fake names (verify distinct SHA-256 hashes across episodes).
   - Verify videos have genuine non-zero duration (~140s–176s) matching the actual cutscenes of each episode.
   - Verify genuine procedural AAC audio tracks with non-silent audio waveforms.
2. Authenticity of Video Generation Engine:
   - Check scripts/generate_all_40_episode_videos.py: verify it actually reads the 2,049 cutscene files, composites frames with Pillow, synthesizes procedural stereo audio with NumPy, and encodes via FFmpeg.
3. Authenticity of Movie Player Engine & Audio Synthesizer:
   - Check src/components/movie/CinematicMoviePlayer.tsx, src/views/MovieView.tsx, and src/lib/MovieAudioSynthesizer.ts.
   - Verify genuine implementation of 2,049 cutscene rendering, continuous BGM playback, English TTS voiceover, glowing speaker portraits, combat SFX onomatopoeia, and multi-language subtitles with CC toggle.
   - Verify NO test-specific hardcoding, NO dummy bypasses, NO mock assertions that artificially pass test suites.
4. Deliver your forensic audit verdict:
   - Must be either CLEAN or INTEGRITY VIOLATION.
   - If ANY cheating or shortcut is detected, report INTEGRITY VIOLATION with full forensic evidence.
   - Write your report in /Users/dayyoung/project/snshero/.agents/teamwork/auditor_movie_1/handoff.md and notify parent orchestrator.
