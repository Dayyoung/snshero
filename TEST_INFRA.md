# SNSHero Revolution 40-Chapter RPG Mode (/main) E2E Test Infrastructure (TEST_INFRA.md)

## 1. Overview & Architecture

This document establishes the comprehensive test architecture, methodology, and coverage criteria for the **SNSHero Revolution 40-Chapter RPG Mode Overhaul (`/main`)** (`src/views/KadanRpgView.tsx`, `src/content/kadanRpgStory.ts`, `src/content/kadanRpgNovelScript.ts`, `src/components/rpg/KadanNpcDialog.tsx`, and `src/hooks/useKadanRpgAutoRunner.ts`).

The testing strategy employs a **Dual-Track 4-Tier Automated Verification Framework** driven by a standalone, autonomous Python 3 test harness (`tests/e2e_rpg/run_rpg_e2e_tests.py`):

```
+---------------------------------------------------------------------------------------------------+
|               SNSHero Revolution 40-Chapter RPG Mode Master 4-Tier E2E Test Harness              |
+---------------------------------------------------------------------------------------------------+
|  Tier 1: Feature Coverage & Interface Contracts (36 Assertions across 7 Core Features)            |
|  - Feature 1 (Storyline Sync): 40 canonical titles (KO/EN), KADAN_RPG_EVENTS, 8 regions,         |
|    climax portal & epilogue reward, multilingual dictionaries in i18n.ts (kadan_rpg_chapter_01..40)|
|  - Feature 2 (Rich Scripts): All 40 chapters defined in KADAN_RPG_NOVEL_SCRIPTS, narrative lines  |
|    >= 4 per chapter, speaker name & CARD_DATABASE ID binding, direct speech quote formatting.     |
|  - Feature 3 (Choices Data): KadanRpgDialogueChoice interface contract, tri-attitude archetypes    |
|    ([결의/돌파], [신중/통찰], [성진호흡/공명]), single isDefault flag, valid micro-bonus schema.   |
|  - Feature 4 (Choices UI): min-h-[44px] touch targets, terminal-flat 2-tier radius (rounded-none   |
|    containers, rounded-sm buttons), attitude headers, follow-up reaction state machine, callbacks.|
|  - Feature 5 (Countdown Timers): 5.0s manual / 1.5s auto duration, hairline progress bar width    |
|    interpolation (100%->0%), timeout default resolution, manual tap cancellation, unmount cleanup.|
|  - Feature 8 (Random Encounters): 14% step roll (12-15% window), leg limit, 3-step cooldown,      |
|    Bandit & Thief decks with chapter/rebirth scaling, safe loss guarantee (allowLossProgress=true).|
|  - Feature 12 (Auto-Play): Autonomous tile navigation loop, dialogue auto-advance interval,        |
|    1.5s choice auto-selection, card battle auto-play & 1.6s auto-close, silent reward claims.     |
+---------------------------------------------------------------------------------------------------+
|  Tier 2: Boundary & Corner Cases (6 Assertions across 6 Boundaries)                               |
|  - Boundary 1 (Chapter 1 Init): Hero tile (1, 5), starting region elwin-wildland, safe loss grace.|
|  - Boundary 2 (Chapter 40 Climax): Epilogue reward (300 SNS), reincarnation reset to Ch 1.        |
|  - Boundary 3 (Missing Default): Safe fallback to choice index 0 when isDefault flag is omitted.  |
|  - Boundary 4 (Ambush Safe Loss): Defeat in ambush retains coins, inventory & progression state.   |
|  - Boundary 5 (0 Buff Combat): Clean 1.0x baseline power scaling when no dialogue buff is active.  |
|  - Boundary 6 (Extreme Inputs): Negative chapters, overflow rebirth, zero timer duration handled.  |
+---------------------------------------------------------------------------------------------------+
|  Tier 3: Cross-Feature Combinations & State Machine (5 Assertions across 5 Interactions)          |
|  - Combination 1 (Multi-Phase Pipeline): Navigation -> Ambush -> Choice -> Boss Victory loop.     |
|  - Combination 2 (Buff & Combat Synergy): Dialogue buff (+15%) multiplies player deck stats.      |
|  - Combination 3 (Choice Bonus & Economy): SNS coin bonus immediately credited to player balance. |
|  - Combination 4 (Dynamic Mode Switch): Mid-dialogue Auto-Play toggle rescales timer (5s -> 1.5s).|
|  - Combination 5 (Cross-Chapter Cooldown): 3-step cooldown guard preserved across chapter nodes.   |
+---------------------------------------------------------------------------------------------------+
|  Tier 4: Real-World Workload Scenarios (4 Assertions across 4 Scenarios)                           |
|  - Scenario 1 (Full 40-Chapter Playthrough): 100% hands-free completion with zero stalls.         |
|  - Scenario 2 (Reincarnation Loop): Full playthrough Ch 1..40 Rebirth 0 -> Reincarnation -> R1.  |
|  - Scenario 3 (Monte Carlo Audit): 10,000 movement steps audit confirming 0 cooldown violations.  |
|  - Scenario 4 (Safe Loss Recovery): Player defeated in ambush continues safely to boss victory.    |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. 4-Tier Test Suite Specification

### Tier 1: Feature Coverage & Interface Contracts (36 Tests)

#### T1.1 Canonical Storyline Synchronization (F1)
- **Objective**: Verify synchronization of all 40 chapters between `ENGLISH_NOVEL_MAP`, `public/book/index.json`, `kadanRpgStory.ts`, and `i18n.ts`.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R1, `PROJECT.md` Feature 1.
- **Assertions**:
  1. `T1.F1.1` **Canonical English Titles**: All 40 canonical titles match `ENGLISH_NOVEL_MAP` (Ep 1 *"Two Vows Beneath the Blizzard"* ~ Ep 40 *"One Who Is Not Called a Hero"*).
  2. `T1.F1.2` **Canonical Korean Titles**: All 40 canonical titles match `public/book/index.json` (Ep 1 *"눈보라 아래 두 서약"* ~ Ep 40 *"영웅이라 불리지 않는 자"*).
  3. `T1.F1.3` **Sequential Chapter Events**: Exactly 40 events defined in `KADAN_RPG_EVENTS` with unique IDs (`chapter-01` ~ `chapter-40`).
  4. `T1.F1.4` **Geographical Region Progression**: 8 canonical regions (`elwin-wildland`, `red-cliff`, `shadow-palace`, `mana-caves`, `southern-road`, `taiho-beastlands`, `wind-island`, `final-citadel`).
  5. `T1.F1.5` **Chapter 40 Ending Boundary**: `isEnding: true`, `kadan_rpg_objective_ending`, and `reward-ending` configured.
  6. `T1.F1.6` **Multilingual Dictionaries**: All 40 chapter titles mapped in `src/lib/i18n.ts` under both Korean and English dictionaries.

#### T1.2 40-Chapter Rich Novel Scripts (F2)
- **Objective**: Verify that `KADAN_RPG_NOVEL_SCRIPTS` contains multi-line dramatized narrative for all 40 chapters.
- **Authoritative Sources**: `ORIGINAL_REQUEST.md` §R1, `PROJECT.md` Feature 2.
- **Assertions**:
  1. `T1.F2.1` **All 40 Chapters Present**: All 40 chapter script keys (1 through 40) exist.
  2. `T1.F2.2` **Rich Narrative Depth**: Multi-line dramatic dialogues per chapter.
  3. `T1.F2.3` **Speaker Card Association**: Non-narrator speakers bound to valid `CARD_DATABASE` IDs.
  4. `T1.F2.4` **Literary Quotation Markup**: Direct character dialogue formatted with authentic quotation marks (`“...”` / `"..."`).
  5. `T1.F2.5` **Story Arc Fidelity**: Key characters (Aleksandar, Balian, Hercul, Kadan, Celia, Ignis) match novel storylines.

#### T1.3 Interactive Choice Data Structures (F3)
- **Objective**: Verify compliance of `KadanRpgDialogueChoice` with `PROJECT.md § Interface Contracts`.
- **Authoritative Sources**: `PROJECT.md` Feature 3 & Interface Contract 1.
- **Assertions**:
  1. `T1.F3.1` **Schema Compliance**: Properties include `id`, `attitude`, `labelKo`, `labelEn`, `followUpTextKo`, `followUpTextEn`, `bonusType`, `bonusValue`, `bonusDescKo`, `bonusDescEn`.
  2. `T1.F3.2` **Tri-Attitude Stances**: Options represent `[결의/돌파]`, `[신중/통찰]`, and `[성진호흡/공명]`.
  3. `T1.F3.3` **Single Default Flag**: Exactly one option per node flagged with `isDefault: true`.
  4. `T1.F3.4` **Micro-Bonus Schema**: `bonusType` is `'sns'`, `'buff'`, or `'item'` with positive value.
  5. `T1.F3.5` **Bilingual Reactions**: Both `followUpTextKo` and `followUpTextEn` contain non-empty reaction text.

#### T1.4 Interactive Choice UI & Attitude Badges (F4)
- **Objective**: Verify choice buttons, badges, and callbacks in `src/components/rpg/KadanNpcDialog.tsx`.
- **Authoritative Sources**: `PROJECT.md` Feature 4 & DESIGN.md.
- **Assertions**:
  1. `T1.F4.1` **Touch Ergonomics**: All choice buttons enforce `min-h-[44px]` touch target sizing.
  2. `T1.F4.2` **Terminal-Flat Geometry**: Containers use `rounded-none`, buttons use `rounded-sm`.
  3. `T1.F4.3` **Attitude Badges**: Monospace attitude badge visual differentiation.
  4. `T1.F4.4` **Follow-Up Insertion**: Selecting choice splices follow-up reaction into conversation lines.
  5. `T1.F4.5` **Callback Integration**: Dispatches reward callbacks (`onRewardSns`, `onApplyBuff`, `onClaimReward`).

#### T1.5 Dual-Mode Countdown Timer Bar (F5)
- **Objective**: Verify countdown duration, progress track rendering, and auto-select timeout behavior.
- **Authoritative Sources**: `PROJECT.md` Feature 5.
- **Assertions**:
  1. `T1.F5.1` **Dual Duration**: 5000ms in manual mode, 1500ms in auto mode.
  2. `T1.F5.2` **Visual Progress Track**: Hairline progress bar scaling from 100% down to 0%.
  3. `T1.F5.3` **Auto-Selection on Timeout**: Reaching 0s automatically selects default option.
  4. `T1.F5.4` **Manual Tap Cancellation**: User tap cancels timer to prevent double selection.
  5. `T1.F5.5` **Unmount Resilience**: Component unmount cleanly clears active timers without memory leaks.

#### T1.6 Random Field Encounters (F8)
- **Objective**: Verify intermediate encounter roll, cooldown guards, and deck compositions.
- **Authoritative Sources**: `PROJECT.md` Feature 8 & Interface Contract 3.
- **Assertions**:
  1. `T1.F8.1` **Probability Window**: 14% step roll satisfies 12–15% requirement.
  2. `T1.F8.2` **Anti-Spam Guards**: Chapter leg limit (max 1), 3-step cooldown, destination tile immunity.
  3. `T1.F8.3` **Scaled Decks**: Scaled Bandit (황야 산적단) and Thief (그림자 도둑단) 5-card decks.
  4. `T1.F8.4` **Safe Loss Protection**: `allowLossProgress = true` guarantees safe retreat on defeat.
  5. `T1.F8.5` **Spoils Formula**: $(15 + \lfloor \text{chapter} \times 1.2 \rfloor) \times (1 + \text{rebirth} \times 0.25)$ SNS coins.

#### T1.7 100% Hands-Free Auto-Play (F12)
- **Objective**: Verify seamless auto-play progression across navigation, dialogue, choices, ambushes, and bosses.
- **Authoritative Sources**: `PROJECT.md` Feature 12.
- **Assertions**:
  1. `T1.F12.1` **Tile Navigation**: Auto-runner loop coordinates hero step toward destination.
  2. `T1.F12.2` **Dialogue Auto-Advance**: Story dialogue lines auto-advance on interval.
  3. `T1.F12.3` **Timed Choice Auto-Selection**: Choices auto-resolve in 1.5s in auto mode.
  4. `T1.F12.4` **Battle Auto-Play**: 3x3 battles auto-play and auto-close on victory in 1.6s.
  5. `T1.F12.5` **Silent Reward Claims**: Rewards claimed and persisted to localStorage hands-free.

---

### Tier 2: Boundary & Corner Cases (6 Tests)
- `T2.B1.1` **Chapter 1 Initialization**: Hero starts at chapter 1, region `elwin-wildland`, tile `(1, 5)`, safe loss enabled.
- `T2.B1.2` **Chapter 40 Epilogue & Rebirth**: Climax epilogue awards 300 SNS, reincarnation increments rebirth level.
- `T2.B1.3` **Missing Default Flag Fallback**: Fallback to choice index 0 prevents undefined crash.
- `T2.B1.4` **Ambush Safe Loss**: Defeat retains coins, inventory, and allows continued travel without penalty.
- `T2.B1.5` **0 Buff Combat State**: Combat calculations evaluate cleanly with unaugmented 1.0x baseline power.
- `T2.B1.6` **Extreme & Negative Inputs**: Handles negative chapter numbers, overflow rebirth counts, and zero timer gracefully.

---

### Tier 3: Cross-Feature Combinations & State Machine (5 Tests)
- `T3.C1.1` **Multi-Phase Pipeline**: Navigating -> Ambush battle -> Story dialogue -> Timed choice -> Boss victory.
- `T3.C1.2` **Buff Acquisition & Combat Synergy**: Choice buff (+15%) multiplies card stats in battle, clears post-battle.
- `T3.C1.3` **Choice Bonus & Economy Persistence**: Choice SNS grant immediately credits player account balance.
- `T3.C1.4` **Dynamic Auto-Mode Switch**: Toggling auto-play mid-choice rescales timer from 5.0s to 1.5s.
- `T3.C1.5` **Cross-Chapter Cooldown Preservation**: 3-step cooldown remains active across chapter boundary.

---

### Tier 4: Real-World Workload Scenarios (4 Tests)
- `T4.W1.1` **Full 40-Chapter Hands-Free Playthrough**: Autonomous simulation completes all 40 chapters with 0 stalls.
- `T4.W1.2` **Two-Cycle Reincarnation Loop**: Successfully completes Chapter 1..40 Rebirth 0 followed by Rebirth 1.
- `T4.W1.3` **10,000-Step Monte Carlo Audit**: Empirical audit verifies 0 cooldown violations and ~10–14% spawn rate.
- `T4.W1.4` **Safe Loss Recovery Workload**: Player defeated in ambush recovers safely and proceeds to boss victory.

---

## 3. Test Execution Harness Guide

Run the suite from the repository root:

```bash
# 1. Full Master RPG E2E Verification (All 4 Tiers, 51 Assertions)
python3 tests/e2e_rpg/run_rpg_e2e_tests.py

# 2. Tier-Specific Invocations
python3 tests/e2e_rpg/run_rpg_e2e_tests.py --tier 1   # Tier 1: Feature Coverage (36 assertions)
python3 tests/e2e_rpg/run_rpg_e2e_tests.py --tier 2   # Tier 2: Boundary & Corner Cases (6 assertions)
python3 tests/e2e_rpg/run_rpg_e2e_tests.py --tier 3   # Tier 3: Cross-Feature State Machine (5 assertions)
python3 tests/e2e_rpg/run_rpg_e2e_tests.py --tier 4   # Tier 4: Real-World Workload & Monte Carlo (4 assertions)

# 3. Progressive Milestone Invocations
python3 tests/e2e_rpg/run_rpg_e2e_tests.py --milestone M1   # Milestone 1: Storyline & Scripts Scope
python3 tests/e2e_rpg/run_rpg_e2e_tests.py --milestone M2   # Milestone 2: Dialogue Choices & Timers Scope
python3 tests/e2e_rpg/run_rpg_e2e_tests.py --milestone M3   # Milestone 3: Field Encounters Scope
python3 tests/e2e_rpg/run_rpg_e2e_tests.py --milestone M4   # Milestone 4: 100% Hands-Free Auto-Play Scope
python3 tests/e2e_rpg/run_rpg_e2e_tests.py --milestone ALL  # All Milestones

# 4. JSON Output for Automation & CI
python3 tests/e2e_rpg/run_rpg_e2e_tests.py --json

# 5. Type Safety & Production Build Verification
npx tsc --noEmit
npm run build
```

---

## 4. Traceability Matrix

| Feature | Feature Name | Test IDs | Status |
|---|---|---|---|
| **F1** | 40-Chapter Storyline Sync | `T1.F1.1`, `T1.F1.2`, `T1.F1.3`, `T1.F1.4`, `T1.F1.5`, `T1.F1.6` | **VERIFIED** |
| **F2** | 40-Chapter Rich Novel Scripts | `T1.F2.1`, `T1.F2.2`, `T1.F2.3`, `T1.F2.4`, `T1.F2.5` | **VERIFIED** |
| **F3** | Interactive Choice Data Structures | `T1.F3.1`, `T1.F3.2`, `T1.F3.3`, `T1.F3.4`, `T1.F3.5` | **VERIFIED** |
| **F4** | Interactive Choice UI & Attitude Badges | `T1.F4.1`, `T1.F4.2`, `T1.F4.3`, `T1.F4.4`, `T1.F4.5` | **VERIFIED** |
| **F5** | Dual-Mode Countdown Timer Bar | `T1.F5.1`, `T1.F5.2`, `T1.F5.3`, `T1.F5.4`, `T1.F5.5` | **VERIFIED** |
| **F8** | Random Field Encounters | `T1.F8.1`, `T1.F8.2`, `T1.F8.3`, `T1.F8.4`, `T1.F8.5` | **VERIFIED** |
| **F12** | 100% Hands-Free Auto-Progression | `T1.F12.1`, `T1.F12.2`, `T1.F12.3`, `T1.F12.4`, `T1.F12.5` | **VERIFIED** |
| **Boundary** | Boundary & Corner Analysis | `T2.B1.1`, `T2.B1.2`, `T2.B1.3`, `T2.B1.4`, `T2.B1.5`, `T2.B1.6` | **VERIFIED** |
| **Integration** | Cross-Feature State Transitions | `T3.C1.1`, `T3.C1.2`, `T3.C1.3`, `T3.C1.4`, `T3.C1.5` | **VERIFIED** |
| **Workload** | Real-World Workload & Monte Carlo | `T4.W1.1`, `T4.W1.2`, `T4.W1.3`, `T4.W1.4` | **VERIFIED** |
