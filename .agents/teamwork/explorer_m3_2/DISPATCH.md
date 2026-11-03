# Dispatch Assignment: explorer_m3_2

## Mission
Investigate and design complete specifications and code for Milestone 3:
`src/landing/views/PlaySection.tsx`:
1. Control Bar with exact 5 buttons:
   - `닫기` (Close / return to home)
   - `이전` (Previous episode/cut)
   - `다음` (Next episode/cut)
   - `나레이션` (Toggle narration text overlay / subtitle)
   - `TTS` (Audio narration toggle)
2. Strict TTS Contract:
   - Initial state MUST be `isTtsActive: false` (TTS default OFF).
   - Audio playback or speech synthesis MUST only trigger upon explicit user click on the TTS button.
3. 40-Episode Webtoon Scene Viewer:
   - Episode selector / scene carousel for episodes 1 to 40.
   - Scene illustration rendering (using `/anime-character-sheets/`, `/seat/`, or webtoon cut scenes).
   - Episode title, summary text, and character narration quotes.
   - 44px+ mobile touch targets on all buttons and controls.
   - Terminal-flat aesthetics (`font-mono`, 0px panel radius, 4px button radius, 1px hairlines).

## Authoritative Inputs
- `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (lines 65–72, R4)
- `/Users/dayyoung/project/snshero/PROJECT.md` (§ Feature Inventory Feature 14)
- `/Users/dayyoung/project/snshero/TEST_INFRA.md` (T1.SEC.3, T2.B5.1, T3.C2.2)

## Output Requirements
Write your handoff report to:
`/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_2/handoff.md`
Report back via send_message.

## 2026-11-02T05:49:11Z
Investigate and design complete specifications and code for Milestone 3:
`src/landing/views/PlaySection.tsx`:
1. Control bar with exact 5 buttons: 닫기, 이전, 다음, 나레이션, TTS.
2. Strict TTS contract: initial state isTtsActive: false (TTS default OFF), audio triggered only upon explicit user click.
3. 40-episode webtoon scene viewer with episode selector/carousel and scene illustrations.
4. 44px+ mobile touch targets and OpenCode Terminal-Flat styling.

Write your report to:
/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_2/handoff.md
Send a completion message when finished.
