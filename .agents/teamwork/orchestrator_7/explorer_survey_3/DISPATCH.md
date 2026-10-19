## 2026-10-19T06:32:44Z
You are Explorer Survey 3 for orchestrator_7.
Working directory: /Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_7/explorer_survey_3/
Read ORIGINAL_REQUEST.md at: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md (specifically the latest section ## 2026-10-19T06:29:23Z).

Your mission is to investigate the frontend integration and verification setup for all 40 episodes:
1. Examine `src/views/CinemaView.tsx` and `src/components/movie/LiveActionCinemaPlayer.tsx`. How do they currently handle Episode 01 vs episodes 02–40? What changes are required to support full 40-episode playback in both MP4 mode and interactive flipbook mode?
2. Check how the `[★] 100% 실사 마스터 촬영본 (72프레임 연속 연기)` badge is displayed and what criteria enable it.
3. Identify verification requirements: programmatic ffprobe checks, SHA-256 uniqueness across 72 frames per episode, TypeScript lint (`npx tsc --noEmit`), and production build (`npm run build`).
4. Detail the exact frontend edits needed and potential pitfalls.
5. Write your findings to `handoff.md` in your working directory and notify the caller.
