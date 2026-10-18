## 2026-10-18T06:26:14Z
You are worker_movie_m2, a teamwork_preview_worker for the SNSHero project.
Your working directory is: /Users/dayyoung/project/snshero/.agents/teamwork/worker_movie_m2/

Scope & Write Ownership:
- You exclusively own:
  - scripts/generate_all_40_episode_videos.py (and any auxiliary video helper scripts)
  - public/videos/episodes/episode_01.mp4 through episode_40.mp4
  - Verifying the MP4 player hookup in CinematicMoviePlayer.tsx / MovieView.tsx

Input Reference:
- Read /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (specifically ## 2026-10-18T06:00:31Z).
- Read /Users/dayyoung/project/snshero/PROJECT.md.
- Read /Users/dayyoung/project/snshero/.agents/teamwork/explorer_movie_3/handoff.md and /Users/dayyoung/project/snshero/.agents/teamwork/explorer_movie_3/proposed_generate_all_40_episode_videos.py.
- Read TEST_READY.md and tests/e2e_movie_theater/run_movie_e2e_tests.py.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Core Requirements to Implement for M2:
1. Batch Generation Pipeline:
   - Implement scripts/generate_all_40_episode_videos.py using the verified pipeline from explorer_movie_3 (Python Pillow frame compositing + NumPy procedural AAC stereo BGM audio synthesis + /opt/homebrew/bin/ffmpeg concat demuxer).
   - Generate all 40 standalone .mp4 video files: public/videos/episodes/episode_01.mp4 through episode_40.mp4.
   - Ensure each video includes:
     a) All cutscenes of that episode (scene_00.webp title card through scene_XX.webp) in sequence.
     b) Overlaid / burned-in English cutscene presentation: narration box, active speaking character portrait (from public/seat/*.png), English dialogue line, and animated combat SFX badge (sfxCues).
     c) Embedded procedural/synthesized episode BGM audio track (AAC) matching the episode theme with smooth fade-in and fade-out.
     d) Universal browser encoding: -c:v libx264 -pix_fmt yuv420p -movflags +faststart -c:a aac.
2. Verification:
   - Verify all 40 MP4 files exist on disk, are valid H.264/AAC containers via ffprobe, have non-zero durations, faststart moov placement, compact file sizes (<= 25MB each).
   - Run the automated test runner:
     python3 tests/e2e_movie_theater/run_movie_e2e_tests.py --milestone M2
     and
     python3 tests/e2e_movie_theater/run_movie_e2e_tests.py
     Ensure that all tests pass!
   - Run npm run lint (tsc --noEmit) and npm run build to verify 0 errors.
   - Document commands, generation metrics, ffprobe outputs, and test results in /Users/dayyoung/project/snshero/.agents/teamwork/worker_movie_m2/handoff.md.
   - Send completion message to parent orchestrator when done.
