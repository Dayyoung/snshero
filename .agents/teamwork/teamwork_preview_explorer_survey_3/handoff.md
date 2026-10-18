# Handoff Report — Explorer 3 (Field Encounters & Auto-Progression)

**Agent**: Explorer 3 (`teamwork_preview_explorer_survey_3`)  
**Mission**: Survey & Architecture Design for Random Field Encounters (Bandit & Thief Decks) and 100% Hands-Free Auto-Progression  
**Date**: 2026-10-18  
**Type**: Hard Handoff (Task Complete)

---

## 1. Observation

1. **`KadanRpgView.tsx` Tile Movement & Encounter Gap**:
   - `src/views/KadanRpgView.tsx` (lines 231–247): Movement occurs step-by-step via `stepToward(previous, targetTile)` every 110ms (low-spec) or 180ms.
   - Lines 267–280: Encounters are only opened when `sameTile(heroTile, targetTile)`. There is currently **zero checking or roll for random encounters on intermediate tile steps**.
2. **Existing 3x3 Card Battle Portal & Hands-Free Support**:
   - In `KadanRpgView.tsx` (lines 574–606), battles are rendered using `MobileCardPlayScreen` mounted via portal with `z-[99999]`.
   - `MobileCardPlayScreen.tsx` (lines 1281–1287) already implements:
     ```ts
     if (autoCloseOnComplete) {
       const timer = setTimeout(() => {
         handleExitGame();
       }, 1600);
       return () => clearTimeout(timer);
     }
     ```
     When `autoCloseOnComplete` is true, it automatically closes the battle and invokes `recordMatchResult` after 1.6s.
3. **Auto-Runner & Dialogue Coordination**:
   - `src/hooks/useKadanRpgAutoRunner.ts` (line 380 in `KadanRpgView.tsx`): `isBusy` evaluates to `true` whenever an active event/dialogue is open. Therefore, `useKadanRpgAutoRunner` does not advance dialogue itself; dialogue self-advancement is managed inside `KadanNpcDialog.tsx` (lines 143–147) via a 1.8s/2.3s timer.
   - When interactive dialogue choices are presented, dialogue advancement must be gated on a 1.5s countdown auto-selection in `autoMode` (5.0s in manual mode).
4. **Card Database Assets for Bandit & Thief Decks**:
   - `src/cardDatabase.ts`: Full card database (IDs 1–110 across 11 factions) with stats, powers, abilities, and elements.
   - Minotaur (82), Fenrir (81), Obelisk (35), Balrog (15), Byra (85), Leonar (86) are ideal for the Bandit deck.
   - Arachne (54), Walker (51), Celia (62), Carrion (53), Harpy (24), Stone Gargoyle (57) are ideal for the Thief deck.
5. **Baseline Test Status**:
   - `npx tsc --noEmit`: 0 TypeScript errors (Exit Code 0).
   - `python3 tests/e2e_design_system/run_all_e2e_tests.py`: 377 / 377 assertions passed (100.0% Pass Rate).
   - `npm run build`: Succeeded completely with code 0.

---

## 2. Logic Chain

1. **Step 1 (Intermediate Encounter Need)**:
   - From Observation 1, because movement happens in discrete 1-tile steps in `stepToward`, the step callback inside `KadanRpgView.tsx` is the exact architectural injection point to evaluate random encounters.
2. **Step 2 (Encounter Probability & Cooldown Balance)**:
   - To satisfy Requirement R3 without frustrating players or trapping them in infinite loops:
     - 14% chance per step (within the 12–15% requirement).
     - Guard 1: At most 1 ambush per chapter leg (`lastAmbushChapterId !== nextEvent?.id`).
     - Guard 2: At least 3 steps minimum cooldown (`stepsSinceLastAmbush >= 3`).
     - Guard 3: Destination tile (`sameTile(next, targetTile)`) and start tile are excluded.
3. **Step 3 (Thematic Deck Scaling & Safe Loss)**:
   - From Observation 4, composing Bandit (Brute/Beast/Earth, aggressive AI) and Thief (Stealth/Undead/Air, balanced AI) decks with procedural stat ($\Delta_{\text{stat}} \in [0, 3]$) and power scaling ensures competitive battles across all 40 chapters and rebirth levels.
   - Because random encounters are intermediate events, setting `allowLossProgress = true` guarantees that losing an ambush never halts the story: the player retreats safely with zero penalty and continues movement.
4. **Step 4 (100% Hands-Free Auto-Progression Integration)**:
   - From Observations 2 and 3, uniting:
     - 1.0s auto-engagement on ambush alert banners.
     - 1.5s countdown auto-selection on protagonist dialogue choices.
     - `initialAutoBattle={true}` and `autoCloseOnComplete={true}` in `MobileCardPlayScreen`.
     - 650ms auto-claim in `useKadanRpgAutoRunner` with `isSilent={true}` in `addCard`.
     guarantees that Auto-Play operates completely hands-free from Chapter 1 to Chapter 40.

---

## 3. Caveats

1. **Audio / SFX in Battles**: Background music and SFX are automatically suspended during dialogue overlays and resumed during battles via window custom events (`snshero-rpg-battle-state`). The ambush banner should also observe this convention.
2. **Reincarnation / Episode 40 Epilogue**: At Chapter 40 completion, the epilogue modal displays the final victory and reincarnation option. While Auto-Play drives all 40 chapters automatically, reincarnation resets progress to Chapter 1, which should remain an explicit player decision.

---

## 4. Conclusion

1. The random field encounter system and 100% hands-free auto-progression architecture have been fully analyzed and specified in `survey_report.md`.
2. Detailed implementations are ready for:
   - Random field encounter generator (`generateAmbushEncounter`) with Bandit and Thief decks.
   - 14% step roll with chapter leg and 3-step cooldown guards.
   - Spoils calculation: $(15 + \lfloor C \times 1.2 \rfloor) \times (1 + R \times 0.25)$ SNS coins + 25% card drop + 15% item drop.
   - Safe retreat mechanism on ambush defeat.
   - 6-phase hands-free auto progression covering tile navigation, dialogue advancement, 1.5s choice auto-selection, ambush battles, boss battles, and silent reward claims.
3. All UI designs strictly comply with `DESIGN.md` terminal-flat specifications (`font-mono`, `rounded-none` containers, `rounded-sm` buttons, 1px hairlines, `min-h-[44px]` touch targets).

---

## 5. Verification Method

To independently verify the survey findings and ensure zero codebase regressions:

```bash
# 1. Verify TypeScript type checking (0 errors)
npx tsc --noEmit

# 2. Verify Full Codebase DESIGN.md Terminal-Flat E2E Compliance (All 377 assertions)
python3 tests/e2e_design_system/run_all_e2e_tests.py

# 3. Verify Production Vite Bundling (Exit code 0)
npm run build
```
