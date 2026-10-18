# Explorer 2 Survey Report: Interactive Dialogue Choices & Countdown Timer System

**Target Subsystem**: SNSHero Revolution `/main` RPG Mode (Kadan RPG Novel Script & NPC Dialog Engine)  
**Investigator**: Explorer 2 (Interactive Dialogue Choices & Timers Specialist)  
**Date**: 2026-10-18 (KST / UTC+0)  
**Repository Working Directory**: `/Users/dayyoung/project/snshero`  
**Reference Sources**:
- `src/components/rpg/KadanNpcDialog.tsx`
- `src/content/kadanRpgNovelScript.ts`
- `src/content/kadanRpgStory.ts`
- `src/views/KadanRpgView.tsx`
- `src/hooks/useKadanRpgProgress.ts`
- `DESIGN.md` (OpenCode Terminal-Flat Canonical Design System)
- `tests/e2e_design_system/helpers.py` & `run_all_e2e_tests.py`

---

## 1. Executive Summary

The SNSHero RPG Mode (`/main`) overhaul requires upgrading dialogue interactions from passive linear text advances into dynamic, branching protagonist (Kadan) decision moments across all 40 chapters. 

This survey investigates:
1. The existing structure and lifecycle of `KadanNpcDialog.tsx` and `KadanRpgNovelScriptLine` in `src/content/kadanRpgNovelScript.ts`.
2. The TypeScript architectural extension for `KadanRpgNovelScriptLine` to support 2–3 branching interactive choices per chapter with attitude archetypes (`[결의/돌파]`, `[신중/통찰]`, `[성진호흡/공명]`), tailored follow-up reaction lines, and micro-bonuses (SNS coins and combat buffs).
3. The dual-mode countdown timer system: **5.0 seconds** in manual mode and **1.5 seconds** in auto-play mode, rendering a terminal-flat visual progress bar and automatically resolving to the recommended default option on expiration.
4. Strict compliance with `DESIGN.md` OpenCode terminal-flat design principles: `font-mono` typography, `rounded-none` (0px) containers, `rounded-sm` (4px) choice buttons, 1px hairline borders, `min-h-[44px]` touch targets, and `0` prohibited classes (no `bg-gradient-to-*`, no `rounded-xl/2xl/3xl/full` pills, no `animate-ping/bounce`).
5. Zero regression with `MobileCardPlayScreen.tsx`, `localStorage` persistence (`hero_*` keys), and hands-free auto-play progression.

---

## 2. Current Implementation Analysis

### 2.1 Examination of `src/components/rpg/KadanNpcDialog.tsx`

`KadanNpcDialog.tsx` (372 lines) serves as the primary story presentation overlay when a player triggers an RPG node.

#### Current State Machine:
- **Props**: Receives `event`, `language`, `isCompleted`, `autoMode`, `canStartBattle`, `canClaimReward`, `rebirthLevel`, and callbacks (`onStartBattle`, `onClaimReward`, `onComplete`, `onClose`, `onNavigate`, `onToggleAutoMode`).
- **Script Resolution (`lines 76-113`)**:
  ```tsx
  const conversationLines = useMemo(() => {
    const novelScript = language === 'ko' ? KADAN_RPG_NOVEL_SCRIPTS[event.chapterNumber] : undefined;
    if (novelScript) {
      return novelScript.map((line) => ({
        speaker: line.speaker,
        cardId: line.cardId ?? event.speakerCardId,
        name: line.name,
        text: line.text,
      }));
    }
    // Generic fallback for non-KO or missing script
    ...
  }, [event, fallbackSpeakerName, language, templateKey]);
  ```
  *Key Finding*: If `language !== 'ko'`, it completely discards `KADAN_RPG_NOVEL_SCRIPTS` and returns 3 generic lines. The new design should allow English text fallback (`line.textEn || line.text`) so international players also experience the rich 40-chapter novel script and interactive choices.
- **Auto-Play Progression (`lines 143-147`)**:
  ```tsx
  useEffect(() => {
    if (!autoMode) return;
    const timer = window.setTimeout(advanceConversation, lineIndex < conversationLines.length - 1 ? 1800 : 2300);
    return () => window.clearTimeout(timer);
  }, [advanceConversation, autoMode, conversationLines.length, lineIndex]);
  ```
  *Key Finding*: The current auto-play uses a fixed timeout of 1800ms per line. When a choice prompt is active, this normal timer must be paused, giving way to the dedicated 1.5s choice auto-select timer.
- **Identified Non-Compliances with `DESIGN.md` in Existing Code**:
  1. *Typo on Touch Targets (`lines 303, 319, 336, 346, 353`)*:
     The code writes `className="min-min-h-[44px] ..."`. While Python regex `tok in class_str` coincidentally matched the substring, in browser CSS `min-min-h-[44px]` is invalid. It must be corrected to standard `min-h-[44px]`.
  2. *Prohibited Border Radii (`lines 175, 179, 184, 203, 268`)*:
     Badges use `rounded-md`, and the line progress indicators use `rounded-full`. Under `DESIGN.md`, containers must be `rounded-none`, and buttons/badges must be at most `rounded-sm` (4px).
  3. *Prohibited Inline Gradients & Shadows (`lines 186, 245-247, 273`)*:
     Lines 245-247 render an inline `radial-gradient(circle, ...)`. Line 186 uses `shadow-[0_0_12px_rgba(245,158,11,0.35)] animate-pulse`. Line 273 uses `shadow-[0_0_8px_rgba(129,140,248,0.8)]`. These violate terminal-flat rules and must be simplified to flat surfaces with 1px hairlines.

---

### 2.2 Examination of `src/content/kadanRpgNovelScript.ts`

`kadanRpgNovelScript.ts` (240 lines) defines:
```ts
export interface KadanRpgNovelScriptLine {
  speaker: 'narrator' | 'quote' | 'kadan' | 'speaker';
  name: string;
  text: string;
  cardId?: number;
}
export const KADAN_RPG_NOVEL_SCRIPTS: Record<number, KadanRpgNovelScriptLine[]> = { ... };
```
- Each chapter (1 to 40) currently contains a static list of 4–8 script lines.
- There are no branching paths, choices, or reward triggers.
- Text is currently Korean-only; speaker names and text lack optional English counterparts (`nameEn`, `textEn`).

---

## 3. Architecture & Extension Design: `KadanRpgNovelScriptLine` & Choices

### 3.1 Extended Type Definitions

We specify the extension to `src/content/kadanRpgNovelScript.ts`:

```typescript
export type KadanRpgChoiceArchetype = 'breakthrough' | 'insight' | 'resonance';

export interface KadanRpgDialogueChoice {
  /** Unique choice ID within the chapter, e.g. "ch01_choice_1" */
  id: string;
  /** Attitude / archetype badge tag, e.g. "[결의/돌파]", "[신중/통찰]", "[성진호흡/공명]" */
  badge: string;
  badgeEn?: string;
  /** Choice prompt displayed on the button */
  text: string;
  textEn?: string;
  /** Whether this option is the recommended default, auto-selected on timer expiration */
  isDefault?: boolean;
  /** Micro-bonus granted immediately upon selection */
  reward?: {
    snsCoins?: number;
    buff?: 'atk_boost' | 'def_shield' | 'mana_surge' | 'critical_strike' | string;
    buffName?: string;
    buffNameEn?: string;
  };
  /** Tailored follow-up reaction line reacting specifically to this choice */
  followUpLine: string | KadanRpgNovelScriptLine;
  followUpLineEn?: string | KadanRpgNovelScriptLine;
}

export interface KadanRpgNovelScriptLine {
  speaker: 'narrator' | 'quote' | 'kadan' | 'speaker';
  name: string;
  nameEn?: string;
  text: string;
  textEn?: string;
  cardId?: number;
  /** Optional interactive protagonist choices. When present, dialogue halts and triggers the countdown timer */
  choices?: KadanRpgDialogueChoice[];
}
```

### 3.2 Choice Archetypes & Reward Matrix

Every chapter (1–40) will feature at least one protagonist decision node containing 2–3 structured choices following these archetypes:

| Archetype Badge | Strategic Intent | Micro-Bonus Type | Tactical Effect in Upcoming 3x3 Battle | Typical Reward |
|---|---|---|---|---|
| **`[결의/돌파]`** (Breakthrough) | Direct offensive confrontation, unyielding courage, frontal assault | `atk_boost` | Player cards receive +15% total power and +1 directional attack stats | +50 SNS / ATK +15% |
| **`[신중/통찰]`** (Insight) | Tactical observation, defensive formation, exposing enemy weakness | `def_shield` | Player cards receive +1 defensive shield on placement or +1 defensive stats | +50 SNS / SHIELD +1 |
| **`[성진호흡/공명]`** (Resonance) | Arcane breath meditation, spiritual harmony, elemental alignment | `mana_surge` | Player cards receive +20% power surge and bonus starting tactical AP | +80 SNS / MANA +20% |
| **`[필살/일격]`** (Critical) | High-risk decisive strike, exploiting fatal blindspot | `critical_strike` | +25% burst power for decisive 3x3 turn flips | +100 SNS / CRIT +25% |

### 3.3 Dynamic Conversation Stream Injection

When a choice is selected:
1. The reward is immediately disbursed (`onRewardSns` and `onApplyBuff`).
2. The `choice.followUpLine` is formatted as a `KadanRpgNovelScriptLine` and dynamically spliced into the active conversation stream immediately following the choice line.
3. The dialog automatically advances to this follow-up line, allowing the player to observe the immediate narrative consequence before proceeding to the next storyline beat or battle.

---

## 4. Dual-Mode Countdown Timer & Auto-Play Engine

### 4.1 Timer Specifications

| Mode | Trigger Condition | Countdown Duration | Tick Frequency | Expiration Action |
|---|---|---|---|---|
| **Manual Mode** (`autoMode === false`) | Dialogue encounters a line with `choices` and user has not yet chosen | **5.0 seconds** (5,000 ms) | 50ms (`requestAnimationFrame` / interval) | Automatically selects choice where `isDefault === true` (or `choices[0]`) |
| **Auto-Play Mode** (`autoMode === true`) | Same as above, while `autoMode` is enabled | **1.5 seconds** (1,500 ms) | 50ms | Automatically selects default choice and smoothly continues hands-free loop |

### 4.2 State Machine in `KadanNpcDialog.tsx`

```
                      [Line N Loaded]
                             |
             Has choices && unselected?
                 /                       \
              YES                         NO
               |                           |
      [Choice Mode Active]        [Standard Dialogue Mode]
     - Normal auto-advance paused  - User clicks Continue / Skip
     - Duration = autoMode ? 1.5s : 5.0s - In autoMode: timer 1.8s
     - Countdown progress bar ticks down
               |
      +--------+--------+
      |                 |
  User Clicks     Timer Expires (0.0s)
  Choice Option   Auto-picks Default Choice
      |                 |
      +--------+--------+
               |
    [Execute Selection]
    - Grant reward (SNS coins / Buff)
    - Persist buff in localStorage ('hero_kadan_active_buff')
    - Format choice.followUpLine
    - Splice followUpLine into conversation at lineIndex + 1
    - Advance to lineIndex + 1 (Reaction Line)
               |
    [Standard Dialogue Mode Resumes]
    - If autoMode: 1.8s auto-advance to next line
    - If manual: User clicks Continue
```

### 4.3 Handling Edge Cases

1. **Mid-Stream Mode Switching**: If the user toggles `autoMode` while the 5.0s timer is running, the remaining duration seamlessly rescales to the 1.5s budget (`Math.min(remainingMs, 1500)`), preventing dialogue stalls.
2. **User Skip Action (`handleSkipToFinal`)**: If the player clicks `[Skip]`, any pending choice automatically resolves with the default choice, ensuring bonuses are never lost.
3. **Dialogue Dismissal / Re-entry**: Cleanup return functions in `useEffect` cancel all pending `requestAnimationFrame` and `setTimeout` timers to prevent memory leaks or audio/state desynchronization.

---

## 5. Micro-Bonus State Management & LocalStorage Persistence

### 5.1 SNS Coin Grants
- Awarded via callback `onRewardSns?.(amount, reason)` passed from `KadanRpgView` to `KadanNpcDialog`.
- `KadanRpgView` invokes `updateSns(amount, `[RPG Ch.${event.chapterNumber}] 선택 보너스`, 'earned')`.
- Persisted automatically to `hero_user_sns` and synced across views.

### 5.2 Combat Buff Storage & Consumption
- Storage Key: `hero_kadan_active_buff`
- Schema:
  ```json
  {
    "id": "atk_boost",
    "name": "돌파의 결의 (+15% 공격력)",
    "nameEn": "Breakthrough Resolve (+15% ATK)",
    "chapterNumber": 1,
    "grantedAt": 1776543210000
  }
  ```
- **Application in RPG Battle (`KadanRpgView.tsx`)**:
  When `MobileCardPlayScreen` is launched for a chapter encounter (`lines 576-585`), `KadanRpgView` inspects the active buff and enhances the player's deck cards:
  - If `atk_boost`: Power +15%, stats +1.
  - If `def_shield`: Defense +1, bonus board protection.
  - If `mana_surge`: Power +20%, AP burst.
  - If `critical_strike`: Power +25%, stats +1.
- **Consumption**:
  Upon battle completion (victory or event completion), `localStorage.removeItem('hero_kadan_active_buff')` is called, ensuring buffs are single-use per chapter encounter.

---

## 6. DESIGN.md Terminal-Flat Compliance Audit

| Requirement | DESIGN.md Rule | Proposed Implementation in `KadanNpcDialog` | Status |
|---|---|---|---|
| **Typography** | 100% `font-mono` (Berkeley Mono hierarchy) | All text, choice prompts, badges, and timer readouts use `font-mono` | COMPLIANT |
| **Container Geometry** | `rounded-none` (0px) on modal frame & panels | Root dialog container: `rounded-none border border-slate-800` | COMPLIANT |
| **Interactive Geometry** | `rounded-sm` (4px) maximum on buttons & badges | Choice buttons: `rounded-sm border border-slate-700/80` | COMPLIANT |
| **Progress Bar Geometry** | `rounded-none` (0px) flat rect | Timer track & fill: `rounded-none border border-slate-700/80` | COMPLIANT |
| **Hairline Borders** | 1px hairline (`border border-slate-700/80` / `border-amber-500/80`) | 1px hairline rules for all dividers and choice frames | COMPLIANT |
| **Surfaces & Palettes** | Solid Ink Dark (`#201d1d`, `bg-slate-950`) & Warm Cream | Replaces legacy `radial-gradient` and neon glows with flat `#201d1d` surfaces | COMPLIANT |
| **Touch Ergonomics** | `min-h-[44px]` (or `h-11`) minimum height | Every choice `<button>` enforces `min-h-[44px]` touch target | COMPLIANT |
| **Banned Classes** | `0` instances of `bg-gradient-to-*`, `rounded-xl/2xl/3xl`, `animate-ping`, `animate-bounce` | Completely purged from `KadanNpcDialog.tsx` | COMPLIANT |

---

## 7. Concrete Code Specifications for Implementation

### 7.1 Proposed Extension in `src/content/kadanRpgNovelScript.ts`

```typescript
export interface KadanRpgDialogueChoice {
  id: string;
  badge: string;
  badgeEn?: string;
  text: string;
  textEn?: string;
  isDefault?: boolean;
  reward?: {
    snsCoins?: number;
    buff?: 'atk_boost' | 'def_shield' | 'mana_surge' | 'critical_strike' | string;
    buffName?: string;
    buffNameEn?: string;
  };
  followUpLine: string | KadanRpgNovelScriptLine;
  followUpLineEn?: string | KadanRpgNovelScriptLine;
}

export interface KadanRpgNovelScriptLine {
  speaker: 'narrator' | 'quote' | 'kadan' | 'speaker';
  name: string;
  nameEn?: string;
  text: string;
  textEn?: string;
  cardId?: number;
  choices?: KadanRpgDialogueChoice[];
}
```

### 7.2 Choice Node Sample for Chapter 1 (`kadanRpgNovelScript.ts`)

```typescript
  1: [
    { speaker: 'narrator', name: '제 1화: 눈보라 아래 두 서약', text: '라이트헤븐 왕국 남쪽 끝 엘윈 마을. 낮부터 쏟아진 눈발이 성벽과 지붕의 경계를 덮은 밤, 소문처럼 북쪽 섀도우렐름의 기병들이 국경을 넘어오고 있었다.' },
    { speaker: 'speaker', name: '알렉산다르', cardId: 41, text: '“발리안, 바람 소리에 피 냄새가 섞여 있네. 섀도우렐름의 정찰대인가, 아니면 왕궁의 사냥개인가.”' },
    { speaker: 'speaker', name: '발리안', cardId: 47, text: '“누구든 대장간 문턱을 넘는다면 내 아케인 창이 먼저 대답할 걸세. 아내들의 출산이 임박했으니 패전국의 밤을 더 더럽히게 둘 수 없네.”' },
    {
      speaker: 'kadan',
      name: '알렉산다르의 결의',
      cardId: 41,
      text: '적의 말발굽 소리가 대장간 문 앞까지 닥쳤다. 알렉산다르는 부서진 검을 쥐며 아내를 지키기 위한 결단을 내린다.',
      choices: [
        {
          id: 'ch01_choice_1',
          badge: '[결의/돌파]',
          badgeEn: '[Breakthrough]',
          text: '부서진 검에 투기를 싣고 다리 위에서 적 선봉대를 정면 요격한다.',
          textEn: 'Channel aura into broken blade and intercept the enemy vanguard head-on on the bridge.',
          isDefault: true,
          reward: { snsCoins: 50, buff: 'atk_boost', buffName: '돌파의 결의 (+15% 공격력)', buffNameEn: 'Assault Resolve (+15% ATK)' },
          followUpLine: {
            speaker: 'kadan',
            name: '알렉산다르 (정면 돌파)',
            cardId: 41,
            text: '“내 아들의 이름은 끝까지 버티는 방패, 카단이다! 불의한 사냥개들 앞에서 결코 무릎 꿇지 않는다!”',
          },
        },
        {
          id: 'ch01_choice_2',
          badge: '[신중/통찰]',
          badgeEn: '[Insight]',
          text: '아내 엘윈을 수로로 은밀히 피신시키고 수호 결계로 적의 기병 진형을 분산시킨다.',
          textEn: 'Escort Elwin secretly into the waterways and deploy protective barriers to scatter cavalry.',
          reward: { snsCoins: 50, buff: 'def_shield', buffName: '수호 방진 (+1 보호막)', buffNameEn: 'Guardian Formation (+1 Shield)' },
          followUpLine: {
            speaker: 'kadan',
            name: '알렉산다르 (수호 결계)',
            cardId: 41,
            text: '“수로를 통해 북쪽으로 가시오! 이 다리는 내가 단 한 발짝도 내어주지 않을 테니!”',
          },
        },
        {
          id: 'ch01_choice_3',
          badge: '[성진호흡/공명]',
          badgeEn: '[Resonance]',
          text: '성기사단의 아케인 호흡으로 대장간 화로의 불꽃과 단검의 마나를 공명시킨다.',
          textEn: 'Synchronize Arcane Breathing with forge embers and awaken the silver dagger.',
          reward: { snsCoins: 80, buff: 'mana_surge', buffName: '성진공명 (+20% 마나/파워)', buffNameEn: 'Astral Resonance (+20% Power)' },
          followUpLine: {
            speaker: 'kadan',
            name: '알렉산다르 (아케인 공명)',
            cardId: 41,
            text: '“은빛 단검의 룬이 공명한다! 비록 내가 쓰러질지라도, 빛의 의지는 결코 꺼지지 않으리라!”',
          },
        },
      ],
    },
    { speaker: 'speaker', name: '헤르쿨', cardId: 49, text: '“검을 거두게, 동지들. 나는 붉은 유리 궁정 섭정 데스나이트 아르투스의 명단을 쫓아 도망쳐 온 성기사 헤르쿨이다.”' },
    { speaker: 'quote', name: '헤르쿨의 맹세', text: '“아이들이 태어나면 이 은빛 단검을 주게. 복수를 떠넘기라는 뜻이 아니라, 거짓 앞에서 고개를 숙이지 않게 하려는 뜻이다.”' },
  ],
```

### 7.3 Proposed UI Implementation in `src/components/rpg/KadanNpcDialog.tsx`

```tsx
// Inside KadanNpcDialog:
const [selectedChoiceIds, setSelectedChoiceIds] = useState<Record<number, string>>({});
const [choiceTimeLeftMs, setChoiceTimeLeftMs] = useState<number>(0);
const [choiceTotalDurationMs, setChoiceTotalDurationMs] = useState<number>(5000);

const currentLine = conversationLines[lineIndex] ?? conversationLines[0];
const activeChoices = currentLine.choices && currentLine.choices.length > 0 && !selectedChoiceIds[lineIndex]
  ? currentLine.choices
  : null;

// Countdown Timer Effect
useEffect(() => {
  if (!activeChoices) {
    setChoiceTimeLeftMs(0);
    return;
  }

  const duration = autoMode ? 1500 : 5000;
  setChoiceTotalDurationMs(duration);
  setChoiceTimeLeftMs(duration);

  const startTimestamp = Date.now();
  const deadline = startTimestamp + duration;

  const interval = window.setInterval(() => {
    const remaining = Math.max(0, deadline - Date.now());
    setChoiceTimeLeftMs(remaining);

    if (remaining <= 0) {
      window.clearInterval(interval);
      // Auto-select default choice
      const defaultChoice = activeChoices.find((c) => c.isDefault) ?? activeChoices[0];
      handleSelectChoice(defaultChoice);
    }
  }, 50);

  return () => window.clearInterval(interval);
}, [activeChoices, autoMode, lineIndex]);

const handleSelectChoice = useCallback((choice: KadanRpgDialogueChoice) => {
  setSelectedChoiceIds((prev) => ({ ...prev, [lineIndex]: choice.id }));

  // Grant Micro-Bonuses
  if (choice.reward?.snsCoins) {
    onRewardSns?.(choice.reward.snsCoins, `RPG Ch.${event.chapterNumber} 선택 보상`);
  }
  if (choice.reward?.buff) {
    onApplyBuff?.(choice.reward.buff, choice.reward.buffName);
    try {
      localStorage.setItem('hero_kadan_active_buff', JSON.stringify({
        id: choice.reward.buff,
        name: choice.reward.buffName,
        nameEn: choice.reward.buffNameEn,
        chapterNumber: event.chapterNumber,
        timestamp: Date.now(),
      }));
    } catch {
      // safe fallback
    }
  }

  // Inject follow-up reaction line
  if (choice.followUpLine) {
    const rawLine = language === 'ko' ? choice.followUpLine : (choice.followUpLineEn || choice.followUpLine);
    const followUpLineObj: ConversationLine = typeof rawLine === 'string'
      ? { speaker: 'kadan', cardId: 41, name: 'Kadan', text: rawLine }
      : {
          speaker: rawLine.speaker,
          cardId: rawLine.cardId ?? 41,
          name: language === 'ko' ? rawLine.name : (rawLine.nameEn || rawLine.name),
          text: language === 'ko' ? rawLine.text : (rawLine.textEn || rawLine.text),
        };

    setDynamicConversationLines((prev) => {
      const next = [...prev];
      next.splice(lineIndex + 1, 0, followUpLineObj);
      return next;
    });

    setLineIndex((curr) => curr + 1);
  } else {
    advanceConversation();
  }
}, [advanceConversation, event.chapterNumber, language, lineIndex, onApplyBuff, onRewardSns]);
```

---

## 8. Verification & Independent Test Strategy

1. **Compilation & Type Check**:
   ```bash
   npx tsc --noEmit
   ```
   Ensures zero type breakage with `KadanRpgNovelScriptLine`, `KadanNpcDialogProps`, and `KadanRpgView`.
2. **E2E Design System Harness**:
   ```bash
   python3 tests/e2e_design_system/run_all_e2e_tests.py
   ```
   Verifies 100% compliance on touch targets (`min-h-[44px]`), 0 banned classes (`bg-gradient-to-*`, `rounded-xl/2xl/3xl`), and `rounded-none` frames.
3. **Automated Unit / Scenario Validation**:
   - Verify choice prompt appears with timer.
   - Verify manual mode timer runs for 5.0s, autoMode timer runs for 1.5s.
   - Verify timeout triggers auto-selection of the default option.
   - Verify `hero_kadan_active_buff` is written to `localStorage`.
   - Verify follow-up reaction line appears.
   - Verify auto-play advances through entire dialog to battle with zero manual clicks.
