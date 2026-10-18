# Project: SNSHero Revolution RPG Mode Overhaul (/main)

## Architecture
- **Module Boundaries**:
  - `src/content/`: Narrative data layer (`kadanRpgStory.ts`, `kadanRpgNovelScript.ts`).
  - `src/lib/i18n.ts`: Multilingual localization strings for chapter titles, opponents, and choices.
  - `src/components/rpg/`: Dialog UI, choice buttons, countdown timer bar, and event modals (`KadanNpcDialog.tsx`).
  - `src/views/KadanRpgView.tsx`: Main RPG map canvas, tile movement loop, random field encounter triggers, deck buffs, and battle portal mounting.
  - `src/hooks/useKadanRpgAutoRunner.ts`: Auto-progression runner coordinating with dialog and encounter state machines.
  - `tests/e2e_design_system/`: Automated E2E verification for DESIGN.md compliance and touch targets.
  - `tests/e2e_rpg/`: Dedicated opaque-box E2E test suite for RPG mode mechanics.

- **Data Flow**:
  1. Map tile navigation (`stepToward`) triggers 14% step roll with cooldown guards.
  2. If ambush triggered: mounts `MobileCardPlayScreen` with Bandit/Thief deck scaled to chapter.
  3. When reaching story event tile: mounts `KadanNpcDialog` with chapter's novel script.
  4. If choice node present: displays 3-attitude choices with 5s (manual) or 1.5s (auto) countdown progress bar.
  5. Upon choice selection: renders follow-up reaction line, awards SNS coins, and stores combat buff in `localStorage ('hero_kadan_active_buff')`.
  6. Boss battle: mounts `MobileCardPlayScreen` with chapter boss deck, applying active combat buff to player deck.
  7. When `autoMode` is enabled: 100% of movements, choices, ambushes, and boss battles execute hands-free.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | 40-Chapter Canonical Storyline Sync | Synchronize all 40 chapters in `kadanRpgStory.ts` and `i18n.ts` with canonical webnovel/webtoon episodes | M1 (DONE) | Survey |
| F2 | 40-Chapter Rich Novel Scripts | Rewrite `kadanRpgNovelScript.ts` chapters 1–40 with authentic narrative dramatization and character mapping | M1 (DONE) | Survey |
| F3 | Interactive Choice Data Structures | Extend `KadanRpgNovelScriptLine` and introduce `KadanRpgDialogueChoice` with bilingual fields and bonuses | M1 (DONE) | Survey |
| F4 | Interactive Choice UI & Attitude Badges | Implement choice buttons with `[결의/돌파]`, `[신중/통찰]`, `[성진호흡/공명]` in `KadanNpcDialog.tsx` | M2 (DONE) | Survey |
| F5 | Dual-Mode Countdown Timer Bar | 5.0s (manual) and 1.5s (auto) countdown progress bar auto-selecting default choice upon timeout | M2 (DONE) | Survey |
| F6 | Follow-Up Reactions & Micro-Bonuses | Display Kadan follow-up line, award SNS coins and register combat buffs (`hero_kadan_active_buff`) | M2 (DONE) | Survey |
| F7 | DESIGN.md Strict Terminal-Flat Compliance | Fix `min-min-h-[44px]` typo, replace rounded-md/rounded-full, eliminate radial gradient/pulse, ensure 44px+ touch targets | M2 (DONE) | Survey |
| F8 | Random Field Encounter Generator | Generate scaled Bandit Deck (황야 산적단) and Thief Deck (그림자 도둑단) based on chapter/region/rebirth | M3 (DONE) | Survey |
| F9 | Step Movement Roll & Cooldown Guards | 14% encounter roll per tile step with max 1 ambush per chapter leg, min 3 steps cooldown, and tile immunities | M3 (DONE) | Survey |
| F10 | Safe Ambush Defeat & Victory Spoils | Victory yields scaled SNS coins + drops; defeat allows safe retreat with zero penalty (`allowLossProgress = true`) | M3 (DONE) | Survey |
| F11 | Active Combat Buff Battle Injection | Inject active buffs from choices into player deck in `KadanRpgView.tsx` battle portal | M3 (DONE) | Survey |
| F12 | 100% Hands-Free Auto-Progression | Seamless auto-progression across tile navigation, dialogues, timed choices, ambushes, and boss battles | M4 (DONE) | Survey |
| F13 | E2E Testing & Design System Regression | Ensure 100% pass rate in `run_all_e2e_tests.py` and TypeScript build exit 0 | M4 (DONE) | Survey |
| F14 | Final Verification & Google Form Reporting | Local commit only, update `WORK_LOGS.md`, submit Google Form report, notify Sentinel | M5 (DONE) | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Storyline & Script Content Synchronization | `src/content/kadanRpgStory.ts`, `src/content/kadanRpgNovelScript.ts`, `src/lib/i18n.ts` | none | DONE (Gate passed 5/5) |
| M2 | Interactive Dialogue Choices & Countdown Timer UI | `src/components/rpg/KadanNpcDialog.tsx`, DESIGN.md fixes | M1 | DONE (Gate passed 5/5) |
| M3 | Random Field Encounters & Deck Scaling | `src/views/KadanRpgView.tsx`, `src/lib/rpg/kadanRpgAmbush.ts` | M1, M2 | DONE (Gate passed Iteration 2 5/5) |
| M4 | 100% Hands-Free Auto-Progression & E2E Track | Auto-runner loop, E2E test verification, `TEST_READY.md` | M1, M2, M3 | DONE (Gate passed Iteration 2 5/5) |
| M5 | Final Verification, Commit & Mandatory Report | Regression test, git commit, `WORK_LOGS.md`, Google Form submission | M1, M2, M3, M4 | DONE |


## Interface Contracts
### `src/content/kadanRpgNovelScript.ts` ↔ `src/components/rpg/KadanNpcDialog.tsx`
```typescript
export interface KadanRpgDialogueChoice {
  id: string;
  attitude: '[결의/돌파]' | '[신중/통찰]' | '[성진호흡/공명]';
  attitudeEn?: '[Resolve]' | '[Insight]' | '[Resonance]';
  labelKo: string;
  labelEn: string;
  followUpTextKo: string;
  followUpTextEn: string;
  bonusType: 'sns' | 'buff' | 'item';
  bonusValue: number;
  bonusDescKo: string;
  bonusDescEn: string;
  isDefault?: boolean;
}

export interface KadanRpgNovelScriptLine {
  speaker: 'narrator' | 'quote' | 'kadan' | 'speaker' | 'choice';
  name: string;
  nameEn?: string;
  text: string;
  textEn?: string;
  cardId?: number;
  choices?: KadanRpgDialogueChoice[];
}
```

### `src/components/rpg/KadanNpcDialog.tsx` ↔ `src/views/KadanRpgView.tsx`
```typescript
interface KadanNpcDialogProps {
  event: KadanRpgEvent;
  onClose: () => void;
  onRewardSns?: (amount: number, reason: string) => void;
  onApplyBuff?: (buff: { type: string; value: number; label: string }) => void;
  autoMode?: boolean;
  language?: string;
}
```

### `src/lib/rpg/kadanRpgAmbush.ts` ↔ `src/views/KadanRpgView.tsx`
```typescript
export interface AmbushEncounter {
  type: 'bandit' | 'thief';
  name: string;
  nameEn: string;
  deck: CardData[];
  powerLevel: number;
  spoilsCoins: number;
}

export function shouldTriggerAmbush(
  currentStep: number,
  lastAmbushStep: number,
  ambushTriggeredInChapter: boolean,
  isDestinationTile: boolean
): boolean;

export function generateAmbushEncounter(
  chapterNumber: number,
  rebirthCount: number,
  regionId: string
): AmbushEncounter;
```

## Code Layout
- `src/content/kadanRpgStory.ts`: Chapter definitions, region IDs, speaker cards, encounter configurations.
- `src/content/kadanRpgNovelScript.ts`: 40-chapter dramatized scripts with interactive choice nodes.
- `src/components/rpg/KadanNpcDialog.tsx`: Dialog screen, choice buttons, countdown timer bar.
- `src/lib/rpg/kadanRpgAmbush.ts`: Ambush generator, deck composition, scaling formulas.
- `src/views/KadanRpgView.tsx`: Map canvas, movement loop, encounter resolution, battle portal.
- `src/hooks/useKadanRpgAutoRunner.ts`: Auto-play coordination.
- `src/lib/i18n.ts`: Multilingual chapter titles and opponent names.
- `tests/e2e_rpg/`: E2E test runner and test cases.
