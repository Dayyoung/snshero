# Soft Handoff: orchestrator_6 -> Successor (gen2)

**Mission**: Overhaul the `/main` RPG mode (`src/views/KadanRpgView.tsx`, `src/content/kadanRpgStory.ts`, `src/content/kadanRpgNovelScript.ts`, `src/components/rpg/KadanNpcDialog.tsx`, and related RPG hooks/i18n) so that all 40 chapters follow the updated SNSHero webnovel/webtoon storyline, featuring interactive protagonist (Kadan) dialogue choices with tailored follow-up reactions, micro-bonuses, and a countdown auto-select timer, occasional random field encounters against Bandit and Thief decks during tile movement, and 100% hands-free progression across all phases when Auto-Play is active.

**Authoritative User Request**: `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (dated ## 2026-10-18T20:02:04Z)
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_6/`
**Parent Conversation ID**: `ff349f79-2c06-495e-9d17-dabd903b8544`

---

## 1. Milestone State

| # | Milestone Name | Scope | Dependencies | Status | Output Artifacts / Notes |
|---|----------------|-------|--------------|--------|--------------------------|
| M0 | Phase 0: Survey | Codebase, canonical storyline, scripts, dialog, encounters | none | **DONE** | Survey reports in `teamwork_preview_explorer_survey_1..3/`, `PROJECT.md` created with 14 features |
| E2E | E2E Testing Track | `tests/e2e_rpg/`, `TEST_INFRA.md`, `TEST_READY.md` | none | **DONE** | 4-Tier test runner `tests/e2e_rpg/run_rpg_e2e_tests.py` (51/51 PASS 100%), `TEST_READY.md` published |
| M1 | Storyline & Script Content Synchronization | `kadanRpgStory.ts`, `kadanRpgNovelScript.ts`, `i18n.ts` | none | **DONE** | Gate passed 5/5 (Reviewers 1-2 APPROVE, Challengers 1-2 APPROVE, Auditor CLEAN). 40 chapters synchronized with 120 choices, 208 lines. |
| M2 | Interactive Dialogue Choices & Countdown Timer UI | `KadanNpcDialog.tsx`, `KadanRpgView.tsx` | M1 | **DONE** | Gate passed 5/5 (Reviewers 1-2 APPROVE, Challengers 1-2 APPROVE, Auditor CLEAN). 5s/1.5s countdown bar, 44px+ touch targets, flat DESIGN.md compliance. |
| M3 | Random Field Encounters & Deck Scaling | `KadanRpgView.tsx`, `src/lib/rpg/kadanRpgAmbush.ts` | M1, M2 | **PLANNED** (Next up for successor) | 14% step roll, Bandit & Thief decks scaled to chapter, max 1 ambush/leg, 3-step cooldown, safe retreat on defeat. |
| M4 | 100% Hands-Free Auto-Progression | Auto-runner loop, end-to-end integration | M1, M2, M3 | **PLANNED** | Seamless hands-free execution across navigation, dialogues, timed choices, ambushes, boss battles. |
| M5 | Final Verification, Commit & Report | Git commit, `WORK_LOGS.md`, Google Form report | M1..M4 | **PLANNED** | Regression test, `submit_report.py`, final message to Sentinel/parent. |

---

## 2. Active Subagents
- **None**: All 16 subagents spawned in generation 1 have completed and reported.
- Spawn count: 16 / 16 (threshold reached).

---

## 3. Pending Decisions & Technical Context for Successor

### Milestone 3 Implementation Details (Immediate Next Step)
1. **Module to Create / Update**:
   - Create `src/lib/rpg/kadanRpgAmbush.ts` (or place directly in `src/lib/rpg/`):
     - `generateAmbushEncounter(chapterNumber: number, rebirthCount: number, regionId: string)`:
       - Bandit Deck (황야 산적단): Minotaur (82), Fenrir (81), Obelisk (35), Balrog (15), Byra (85) with aggressive AI.
       - Thief Deck (그림자 도둑단): Arachne (54), Walker (51), Celia (62), Carrion (53), Stone Gargoyle (57) with balanced AI.
       - Card stats scaled with procedural bonus $\Delta \in [0, 3]$ and power scaling.
       - Spoils: $(15 + \lfloor C \times 1.2 \rfloor) \times (1 + R \times 0.25)$ SNS coins + 25% card drop + 15% item drop.
     - Step movement trigger in `src/views/KadanRpgView.tsx` (`stepToward`):
       - 14% chance per intermediate tile step (`Math.random() < 0.14`).
       - Guard 1: At most 1 ambush per chapter leg (`lastAmbushChapterId !== nextEvent?.id`).
       - Guard 2: At least 3 steps minimum cooldown (`stepsSinceLastAmbush >= 3`).
       - Guard 3: Destination tile (`sameTile(next, targetTile)`) and start tile excluded.
       - Guard 4: Cannot trigger if already in dialogue, battle, or modal.
     - Ambush Alert Banner:
       - Monospace terminal-flat banner with 1.0s auto-engagement countdown in autoMode (or immediate button).
     - Battle Entry & Defeat Handling:
       - Opens `MobileCardPlayScreen` with Bandit or Thief deck.
       - Defeat has `allowLossProgress = true` (player retreats safely to previous step with zero penalty, never blocks story progression).
       - Apply combat buff from `hero_kadan_active_buff` to `playerDeck`.
       - In autoMode, `initialAutoBattle={true}` and `autoCloseOnComplete={true}` ensures 100% hands-free battle resolution.

### Milestone 4 & 5
- Once Milestone 3 is complete and passes its gate, execute Milestone 4 (verify full hands-free auto-progression loop across all 40 chapters using `tests/e2e_rpg/run_rpg_e2e_tests.py` and real-world simulation).
- Milestone 5: Local git commit only (never git push), update `WORK_LOGS.md`, submit Google Form report via `python3 skills/report-ex/scripts/submit_report.py`, and notify parent Sentinel (`ff349f79-2c06-495e-9d17-dabd903b8544`).

---

## 4. Key Artifacts
- Global project plan: `/Users/dayyoung/project/snshero/PROJECT.md`
- E2E test signal: `/Users/dayyoung/project/snshero/TEST_READY.md`
- Gate tracking: `/Users/dayyoung/project/snshero/.agents/teamwork/orchestrator_6/GATE_STATUS.md`
- Original request: `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md`
- Survey reports:
  - Storyline: `/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_1/survey_report.md`
  - Dialog choices & timers: `/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_2/survey_report.md`
  - Encounters & auto-play: `/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_3/survey_report.md`
- Milestone 1 handoff: `/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_worker_m1_1/handoff.md`
- Milestone 2 handoff: `/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_worker_m2_1/handoff.md`

---

## 5. Instructions for Successor (gen2)
1. Read `handoff.md`, `BRIEFING.md`, `ORIGINAL_REQUEST.md`, `PROJECT.md`, `GATE_STATUS.md`, and `progress.md`.
2. Start your own recurring heartbeat cron: `schedule(CronExpression="*/10 * * * *")`.
3. Dispatch Worker 3 for Milestone 3 (Random Field Encounters & Deck Scaling).
4. Run Milestone 3 Gate check (Reviewers, Challengers, Auditor).
5. Complete Milestone 4 & Milestone 5.
6. Your parent conversation ID is `ff349f79-2c06-495e-9d17-dabd903b8544`.
