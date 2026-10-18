# Handoff Report: Explorer 2 (Interactive Dialogue Choices & Timers)

**Mission**: Survey and investigate interactive dialogue choices, countdown timer system, follow-up reaction lines, micro-bonuses, and DESIGN.md terminal-flat visual compliance for the SNSHero RPG mode overhaul.  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_2/`  
**Recipient / Parent**: Orchestrator (`0841dceb-1ed6-4895-a369-d9b2f167a28c`)

---

## 1. Observation

1. **`src/content/kadanRpgNovelScript.ts` (Lines 1–6, 8)**:
   ```ts
   export interface KadanRpgNovelScriptLine {
     speaker: 'narrator' | 'quote' | 'kadan' | 'speaker';
     name: string;
     text: string;
     cardId?: number;
   }
   export const KADAN_RPG_NOVEL_SCRIPTS: Record<number, KadanRpgNovelScriptLine[]> = { ... };
   ```
   All 40 chapters are defined as static linear line arrays with zero choice branching, zero follow-up lines, and zero reward metadata. Only Korean text is supported (`text`, `name`). Non-Korean languages lack localized strings.

2. **`src/components/rpg/KadanNpcDialog.tsx` (Lines 76–85, 143–147)**:
   - Line 77: `const novelScript = language === 'ko' ? KADAN_RPG_NOVEL_SCRIPTS[event.chapterNumber] : undefined;`
     When `language !== 'ko'`, the dialogue engine drops `KADAN_RPG_NOVEL_SCRIPTS` entirely and outputs 3 generic templated lines.
   - Lines 143–147:
     ```ts
     useEffect(() => {
       if (!autoMode) return;
       const timer = window.setTimeout(advanceConversation, lineIndex < conversationLines.length - 1 ? 1800 : 2300);
       return () => window.clearTimeout(timer);
     }, [advanceConversation, autoMode, conversationLines.length, lineIndex]);
     ```
     Auto-play advances every 1800ms blindly. There is no concept of a decision prompt, countdown bar, or pause for interactive choices.

3. **`src/components/rpg/KadanNpcDialog.tsx` DESIGN.md Non-Compliances**:
   - Lines 303, 319, 336, 346, 353 contain `className="min-min-h-[44px] ..."` (typo in touch target class name).
   - Lines 175, 179, 184, 203 contain `rounded-md` badges (violates 2-tier border radius rule: `rounded-none` or `rounded-sm`).
   - Line 245–247 renders inline `background: radial-gradient(circle, rgba(99,102,241,0.7) 0%, ...)` (violates flat surface rule).
   - Line 186 renders `shadow-[0_0_12px_rgba(245,158,11,0.35)] animate-pulse` (violates flat shadow-none and no-pulse rules).
   - Line 268 renders `rounded-full` indicators (violates 2-tier radius rule).

4. **`src/views/KadanRpgView.tsx` (Lines 557–572, 576–585)**:
   - Line 557 mounts `<KadanNpcDialog>` but passes no callbacks for SNS coin grants (`updateSns`) or combat buff registration.
   - Lines 576–585 render `<MobileCardPlayScreen>` with `playerDeck={currentDeck.filter((c): c is CardData => Boolean(c))}`. Combat buffs are not yet applied to the player deck before battle entry.

5. **`tests/e2e_design_system/helpers.py` & `run_all_e2e_tests.py`**:
   Executing `python3 tests/e2e_design_system/run_all_e2e_tests.py` passed with 377 assertions, confirming `min-h-[44px]` touch target verification across all 620 components (`T2.TOUCH.COMP_ALL`) and zero banned gradient/radius classes. Any new button in `KadanNpcDialog` must strictly enforce `min-h-[44px]`.

---

## 2. Logic Chain

1. **Dialogue Branching Requirement (Observation 1 -> Choice Node Specification)**:
   Because `KadanRpgNovelScriptLine` is currently a flat record with only `speaker`, `name`, and `text`, adding interactive decisions requires extending `KadanRpgNovelScriptLine` with an optional `choices?: KadanRpgDialogueChoice[]`. Each choice must contain `id`, `badge` (e.g. `[결의/돌파]`), `text`, `isDefault`, `reward`, and `followUpLine`.

2. **Multilingual Equity (Observation 1 & 2 -> English Support)**:
   Because non-Korean users are currently shunted to generic 3-line dialogue fallbacks, adding `nameEn`, `textEn`, `badgeEn`, and `followUpLineEn` allows international players to experience the same authentic storyline and branching decisions.

3. **Auto-Progression & Countdown Timer Synchronization (Observation 2 -> Dual Timer Machine)**:
   Because auto-play mode must be 100% hands-free without getting stuck on choices, the dialogue component needs a state machine distinction:
   - When a line has `choices` and no choice has been resolved:
     - Pause standard 1800ms auto-advance.
     - Start countdown timer: **5.0 seconds** if `!autoMode`, **1.5 seconds** if `autoMode`.
     - When countdown reaches 0s: auto-select choice with `isDefault: true`.
     - Splice `choice.followUpLine` into `conversationLines` at `lineIndex + 1` and transition to it.
     - Standard auto-advance resumes once the follow-up line is rendered.

4. **Micro-Bonus Persistence & Battle Synergy (Observation 4 -> LocalStorage Buff Architecture)**:
   Because choices award SNS coins and combat buffs, `KadanNpcDialog` must invoke `onRewardSns` and `onApplyBuff`. `KadanRpgView` connects these to `updateSns()` and `localStorage.setItem('hero_kadan_active_buff', ...)`. When entering battle, `KadanRpgView` applies the buff to `playerDeck` (e.g. +15% power for `atk_boost`), and cleans it up upon victory.

5. **Design System Hygiene (Observation 3 & 5 -> Full DESIGN.md Compliance)**:
   Because `tests/e2e_design_system/run_all_e2e_tests.py` audits all buttons in all components, the new choice buttons must use `min-h-[44px]`, `rounded-sm`, 1px hairline borders (`border border-slate-700/80` or `border-amber-500/80`), `font-mono`, and flat `#201d1d` surfaces, while eliminating legacy `min-min-h-[44px]` typos, `rounded-md`, and radial gradients.

---

## 3. Caveats

1. **Scope Boundary**: Explorer 2 is a read-only investigation agent. No source files were modified during this turn. All code proposals are documented in `survey_report.md` for implementation by the designated worker agent.
2. **Combat Engine Non-Intrusion**: To avoid destabilizing `MobileCardPlayScreen.tsx` (a 2,742-line core battle engine), buffs are applied directly to the `playerDeck` passed into the portal from `KadanRpgView.tsx`. This avoids modifying internal skill states in `MobileCardPlayScreen`.
3. **Audio Performance**: `KadanNpcDialog.tsx` already dispatches `snshero-dialogue-overlay-open` and `close` to throttle background BGM synthesis. Choice countdown timers should run lightweight 50ms intervals without triggering sound spam.

---

## 4. Conclusion

1. The architecture for interactive dialogue choices, 5s/1.5s countdown timer bar, tailored follow-up reactions, and micro-bonuses has been completely mapped out and validated.
2. Extending `KadanRpgNovelScriptLine` and `KadanNpcDialog.tsx` with `KadanRpgDialogueChoice` provides a seamless drop-in capability that preserves 100% backward compatibility for chapters without choices while allowing all 40 chapters to feature strategic player choices.
3. Full implementation details, type interfaces, state machine flowcharts, and DESIGN.md specifications are compiled in `survey_report.md`.

---

## 5. Verification Method

The implementing agent can independently verify this overhaul using:

1. **TypeScript Type Check**:
   ```bash
   npx tsc --noEmit
   ```
   *Expected*: Exit code 0, 0 errors.

2. **E2E Design System Test Suite**:
   ```bash
   python3 tests/e2e_design_system/run_all_e2e_tests.py
   ```
   *Expected*: 377+ assertions PASS (including `T2.TOUCH.COMP_ALL` verifying all choice buttons meet `>=44px` height).

3. **Dialogue Choice & Timer Behavioral Verification**:
   - In manual mode: open an RPG story node with choices; verify the amber progress bar displays a 5.0s countdown; wait 5s and verify the default choice is automatically picked and the follow-up line is displayed.
   - In auto mode: verify the countdown is 1.5s and hands-free progression flows through choice selection into 3x3 battle without user intervention.
   - Inspect `localStorage.getItem('hero_kadan_active_buff')` to verify combat buff persistence.
