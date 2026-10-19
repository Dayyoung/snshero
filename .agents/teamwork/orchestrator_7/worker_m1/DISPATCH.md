## 2026-10-19T06:41:09Z
[Message] timestamp=2026-10-19T06:41:09Z sender=80e1d883-bfe3-4cb4-8345-3b1dd0b15b1d priority=MESSAGE_PRIORITY_HIGH content=You are Worker M1 for orchestrator_7.
Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_7/worker_m1/
Read ORIGINAL_REQUEST.md at: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (latest section ## 2026-10-19T06:29:23Z).
Read Worker Context at: /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_7/worker_m1/context.md
Read Explorer Survey 1 handoff: /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_7/explorer_survey_1/handoff.md
Read Explorer Survey 2 handoff: /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_7/explorer_survey_2/handoff.md
Read Explorer Survey 3 handoff: /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_7/explorer_survey_3/handoff.md
Manifest JSON: /tmp/all_episodes_survey_02_40.json

Write ownership:
You own exclusively:
- `scripts/build_cinema_episodes.py`
- `tests/verify_cinema_40_episodes.py`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Task for Milestone 1:
1. Create `scripts/build_cinema_episodes.py`:
   - Based on the rock-solid reference implementation in `scripts/build_ep01_acting_cinema.py` and the complete 39-episode manifest `/tmp/all_episodes_survey_02_40.json`.
   - Support CLI arguments: `--start <N> --end <M>`, `--episodes 2,3,4`, `--force`, `--dry-run`.
   - Ensure the pipeline establishes 8-head-tall adult human proportions for the featured card characters, crops and renders 8 3x3 keyframe sheets into 72 WebP frames (`public/images/cinema/episode_XX_acting/seq_01_frame_01.webp` .. `seq_08_frame_09.webp`), renders ~4.0s English-only opening title card (zero Korean, zero subtitles), synthesizes English TTS narration (`say -v Daniel -r 170`), synthesizes/mixes cinematic BGM with voice ducking, and encodes 800x450 24fps MP4 with PyTorch MPS optical flow warping (`public/videos/cinema/episode_XX.mp4`).
   - Zero-cost: Use only local Apple Silicon PyTorch MPS, Pillow, macOS `say`, and FFmpeg.
2. Create `tests/verify_cinema_40_episodes.py`:
   - Checks presence and ffprobe validation for MP4s (h264, 800x450, 24fps, aac stereo 44.1kHz, duration >= 60s, size > 3MB).
   - Checks presence and SHA-256 uniqueness of all 72 WebP frames per episode.
   - Accepts arguments like `--episodes 1,2` or `--all` or `--range 1 40`.
3. Test your pipeline by generating Episode 02 (`python3 scripts/build_cinema_episodes.py --episodes 2`) and verifying it with `python3 tests/verify_cinema_40_episodes.py --episodes 1,2`.
4. Document all build/test execution outputs in `handoff.md` in your working directory and notify the caller.
