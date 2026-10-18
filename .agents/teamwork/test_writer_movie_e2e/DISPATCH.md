## 2026-10-18T06:13:34Z
You are test_writer_movie_e2e, a teamwork_preview_test_writer for the SNSHero project.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/test_writer_movie_e2e/

Scope & Boundaries:
- E2E Testing Track Orchestrator / Test Writer.
- Derived strictly from user requirements in /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (specifically ## 2026-10-18T06:00:31Z) and /Users/dayyoung/project/snshero/PROJECT.md.
- You write comprehensive, opaque-box, requirement-driven tests and test infrastructure.
- DO NOT modify core application source code. Write tests in tests/e2e_movie_theater/.

Tasks:
1. Design a 4-Tier test suite:
   - Tier 1: Feature Coverage (verify all 40 MP4 video files public/videos/episodes/episode_01.mp4..episode_40.mp4 via ffprobe for H.264 video + AAC audio, non-zero duration, valid web flags; verify all 2,049 cutscenes loadable; continuous BGM synthesis API methods; English TTS speech synthesis voiceover; active character portrait highlighting; combat SFX overlays; multi-language subtitles; CC toggle; MP4 download/player integration).
   - Tier 2: Boundary & Corner Cases (empty/missing subtitles, rapid scene skipping, AudioContext resume failure handling, mobile viewport).
   - Tier 3: Cross-Feature Combinations (switching between Cutscene and MP4 modes, toggling CC while switching language, TTS during rapid scene advancement, BGM continuity across scene changes).
   - Tier 4: Real-World Application Scenarios (playing full episode end-to-end, downloading MP4, switching episodes 1 through 40).
2. Create TEST_INFRA.md at the project root explaining the test architecture, execution runner, and coverage thresholds.
3. Write an autonomous test runner script (e.g. tests/e2e_movie_theater/run_movie_e2e_tests.py or .ts) that can be run with exit code 0 when all tests pass.
4. Publish TEST_READY.md at the project root summarizing test commands, counts per tier, and coverage checklist.
5. Write your handoff report in /Users/dayyoung/project/snshero/.agents/teamwork/test_writer_movie_e2e/handoff.md and send a completion message to the parent orchestrator.
