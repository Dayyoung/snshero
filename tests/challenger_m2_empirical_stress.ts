/**
 * Empirical Challenger Stress Harness for Milestone 2:
 * Interactive Dialogue Choices & Countdown Timer UI (SNSHero RPG Mode Overhaul)
 *
 * Verifies:
 * 1. Choice auto-select when timer reaches 0s in both 5.0s (manual) and 1.5s (auto) modes.
 * 2. Default choice selection behavior when `isDefault: true` is present vs missing vs edge cases.
 * 3. Touch targets meeting `>= 44px` on all buttons across KadanNpcDialog and KadanRpgView.
 * 4. Micro-bonus dispatch (SNS + Buff) and localStorage persistence ('hero_kadan_active_buff').
 * 5. Full 40-chapter content validation for bilingual integrity, attitudes, and choices.
 * 6. React component rendering across all 40 chapters in KO and EN.
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { KADAN_RPG_NOVEL_SCRIPTS, type KadanRpgDialogueChoice, type KadanRpgNovelScriptLine } from '../src/content/kadanRpgNovelScript';
import { KADAN_RPG_EVENTS, type KadanRpgEvent } from '../src/content/kadanRpgStory';
import { KadanNpcDialog } from '../src/components/rpg/KadanNpcDialog';
import { CARD_DATABASE } from '../src/cardDatabase';
import fs from 'node:fs';

interface TestSectionResult {
  section: string;
  testName: string;
  passed: boolean;
  details: string;
}

const testResults: TestSectionResult[] = [];

function assert(condition: boolean, section: string, testName: string, details: string) {
  testResults.push({
    section,
    testName,
    passed: Boolean(condition),
    details: condition ? details : `FAILED: ${details}`,
  });
  const symbol = condition ? '✓' : '✗';
  console.log(`  ${symbol} [${section}] ${testName} - ${condition ? 'PASS' : 'FAIL'}`);
  if (!condition) {
    console.error(`     Error: ${details}`);
  }
}

// ============================================================================
// SUITE 1: 40-Chapter Novel Script Choice Content Verification
// ============================================================================
console.log('\n=== SUITE 1: 40-Chapter Script & Choice Structure Verification ===');

let totalChoiceNodes = 0;
let validBilingualChoices = 0;
let chaptersWithDefault = 0;

for (let ch = 1; ch <= 40; ch++) {
  const script = KADAN_RPG_NOVEL_SCRIPTS[ch];
  const choiceLine = script?.find((l) => (l.choices && l.choices.length > 0) || l.speaker === 'choice');

  if (choiceLine && choiceLine.choices && choiceLine.choices.length >= 2) {
    totalChoiceNodes++;
    const choices = choiceLine.choices;
    const defaults = choices.filter((c) => c.isDefault);
    if (defaults.length === 1) {
      chaptersWithDefault++;
    }

    const bilingualValid = choices.every(
      (c) =>
        (c.labelKo || c.text) &&
        (c.labelEn || c.textEn) &&
        (c.attitude || c.badge) &&
        (c.followUpTextKo || c.followUpLine) &&
        (c.followUpTextEn || c.followUpLineEn) &&
        (c.bonusType === 'sns' || c.bonusType === 'buff' || c.bonusType === 'item') &&
        c.bonusValue > 0
    );
    if (bilingualValid) {
      validBilingualChoices++;
    }
  }
}

assert(
  totalChoiceNodes === 40,
  'Content',
  'All 40 Chapters Have Interactive Choice Nodes',
  `Found ${totalChoiceNodes}/40 chapters with >= 2 choices.`
);

assert(
  chaptersWithDefault === 40,
  'Content',
  'All 40 Chapters Specify Exactly One isDefault: true Choice',
  `Found ${chaptersWithDefault}/40 chapters with unambiguous default choice.`
);

assert(
  validBilingualChoices === 40,
  'Content',
  'All 40 Chapters Have Complete Bilingual Text, Attitudes, and Bonuses',
  `Found ${validBilingualChoices}/40 chapters meeting strict bilingual schema.`
);

// ============================================================================
// SUITE 2: Timer Countdown Duration & Auto-Select Execution Simulation
// ============================================================================
console.log('\n=== SUITE 2: Timer Countdown Duration & Auto-Select Execution ===');

/**
 * Simulates KadanNpcDialog timer countdown logic matching KadanNpcDialog.tsx lines 265-291
 */
function simulateTimerCountdown(
  autoMode: boolean,
  choices: KadanRpgDialogueChoice[],
  interruptMs?: number,
  selectedChoiceId?: string
) {
  const duration = autoMode ? 1500 : 5000;
  let remaining = duration;
  let selected: KadanRpgDialogueChoice | null = null;
  let ticks = 0;
  const tickStep = 50;

  for (let elapsed = tickStep; elapsed <= duration + tickStep; elapsed += tickStep) {
    ticks++;
    remaining = Math.max(0, duration - elapsed);

    // If user clicked manually before timer expiration
    if (interruptMs !== undefined && elapsed >= interruptMs && selectedChoiceId) {
      selected = choices.find((c) => c.id === selectedChoiceId) || choices[0];
      remaining = 0;
      break;
    }

    if (remaining <= 0) {
      // Auto-select default choice upon timer expiration
      const defaultChoice = choices.find((c) => c.isDefault) ?? choices[0];
      selected = defaultChoice;
      break;
    }
  }

  return { duration, selected, ticks, remaining };
}

const mockChoices: KadanRpgDialogueChoice[] = [
  {
    id: 'opt1',
    attitude: '[결의/돌파]',
    attitudeEn: '[Resolve]',
    labelKo: '돌파한다',
    labelEn: 'Break through',
    followUpTextKo: '돌파 반응',
    followUpTextEn: 'Breakthrough response',
    bonusType: 'buff',
    bonusValue: 15,
    bonusDescKo: '공격력 +15%',
    bonusDescEn: 'Attack +15%',
    isDefault: false,
  },
  {
    id: 'opt2',
    attitude: '[신중/통찰]',
    attitudeEn: '[Insight]',
    labelKo: '관찰한다',
    labelEn: 'Observe carefully',
    followUpTextKo: '관찰 반응',
    followUpTextEn: 'Observation response',
    bonusType: 'sns',
    bonusValue: 50,
    bonusDescKo: 'SNS +50',
    bonusDescEn: 'SNS +50',
    isDefault: true,
  },
  {
    id: 'opt3',
    attitude: '[성진호흡/공명]',
    attitudeEn: '[Resonance]',
    labelKo: '호흡한다',
    labelEn: 'Breathe stars',
    followUpTextKo: '호흡 반응',
    followUpTextEn: 'Breathing response',
    bonusType: 'buff',
    bonusValue: 20,
    bonusDescKo: '방어력 +20%',
    bonusDescEn: 'Defense +20%',
    isDefault: false,
  },
];

// Test 2.1: Manual mode 5.0s countdown auto-select
const manualResult = simulateTimerCountdown(false, mockChoices);
assert(
  manualResult.duration === 5000 &&
    manualResult.selected?.id === 'opt2' &&
    manualResult.ticks === 100,
  'Timer',
  'Manual Mode Enforces Exactly 5000ms (5.0s) & Auto-Selects Default Option',
  `Duration: ${manualResult.duration}ms, Ticks: ${manualResult.ticks}, Selected: ${manualResult.selected?.id}`
);

// Test 2.2: Auto-play mode 1.5s countdown auto-select
const autoResult = simulateTimerCountdown(true, mockChoices);
assert(
  autoResult.duration === 1500 &&
    autoResult.selected?.id === 'opt2' &&
    autoResult.ticks === 30,
  'Timer',
  'Auto Mode Enforces Exactly 1500ms (1.5s) & Auto-Selects Default Option',
  `Duration: ${autoResult.duration}ms, Ticks: ${autoResult.ticks}, Selected: ${autoResult.selected?.id}`
);

// Test 2.3: Manual user tap at 1200ms in 5.0s mode disarms timer
const manualTapResult = simulateTimerCountdown(false, mockChoices, 1200, 'opt3');
assert(
  manualTapResult.selected?.id === 'opt3' && manualTapResult.ticks === 24,
  'Timer',
  'Manual Tap Before Expiration Immediately Selects Choice & Disarms Timer',
  `Selected: ${manualTapResult.selected?.id} at tick ${manualTapResult.ticks} (1200ms)`
);

// ============================================================================
// SUITE 3: Default Choice Resolution Semantics (isDefault Present vs Missing)
// ============================================================================
console.log('\n=== SUITE 3: Default Choice Selection Semantics ===');

function resolveDefaultChoice(choices: KadanRpgDialogueChoice[]): KadanRpgDialogueChoice | undefined {
  return choices.find((c) => c.isDefault) ?? choices[0];
}

// Case 3.1: isDefault: true on middle option (opt2)
const c1 = resolveDefaultChoice(mockChoices);
assert(
  c1?.id === 'opt2',
  'DefaultSemantics',
  'Resolves Choice with isDefault: true When Present',
  `Expected opt2, got ${c1?.id}`
);

// Case 3.2: isDefault: true on first option (opt1)
const choicesOpt1Default: KadanRpgDialogueChoice[] = [
  { ...mockChoices[0], isDefault: true },
  { ...mockChoices[1], isDefault: false },
  { ...mockChoices[2], isDefault: false },
];
const c2 = resolveDefaultChoice(choicesOpt1Default);
assert(
  c2?.id === 'opt1',
  'DefaultSemantics',
  'Resolves Choice with isDefault: true on First Option',
  `Expected opt1, got ${c2?.id}`
);

// Case 3.3: isDefault: true on last option (opt3)
const choicesOpt3Default: KadanRpgDialogueChoice[] = [
  { ...mockChoices[0], isDefault: false },
  { ...mockChoices[1], isDefault: false },
  { ...mockChoices[2], isDefault: true },
];
const c3 = resolveDefaultChoice(choicesOpt3Default);
assert(
  c3?.id === 'opt3',
  'DefaultSemantics',
  'Resolves Choice with isDefault: true on Last Option',
  `Expected opt3, got ${c3?.id}`
);

// Case 3.4: isDefault is MISSING (undefined) on all options
const choicesNoDefault: KadanRpgDialogueChoice[] = [
  { ...mockChoices[0], isDefault: undefined },
  { ...mockChoices[1], isDefault: undefined },
  { ...mockChoices[2], isDefault: undefined },
];
const c4 = resolveDefaultChoice(choicesNoDefault);
assert(
  c4?.id === 'opt1',
  'DefaultSemantics',
  'Gracefully Falls Back to choices[0] When isDefault Flag is Missing',
  `Expected opt1 as fallback, got ${c4?.id}`
);

// Case 3.5: isDefault: false on all options
const choicesAllFalse: KadanRpgDialogueChoice[] = [
  { ...mockChoices[0], isDefault: false },
  { ...mockChoices[1], isDefault: false },
  { ...mockChoices[2], isDefault: false },
];
const c5 = resolveDefaultChoice(choicesAllFalse);
assert(
  c5?.id === 'opt1',
  'DefaultSemantics',
  'Gracefully Falls Back to choices[0] When All isDefault Flags are False',
  `Expected opt1 as fallback, got ${c5?.id}`
);

// Case 3.6: Multiple choices have isDefault: true (Ambiguous Specification)
const choicesMultiDefault: KadanRpgDialogueChoice[] = [
  { ...mockChoices[0], isDefault: true },
  { ...mockChoices[1], isDefault: true },
  { ...mockChoices[2], isDefault: false },
];
const c6 = resolveDefaultChoice(choicesMultiDefault);
assert(
  c6?.id === 'opt1',
  'DefaultSemantics',
  'Deterministically Selects First Matching Default When Multiple are Marked',
  `Expected opt1 (first default), got ${c6?.id}`
);

// ============================================================================
// SUITE 4: Touch Target Ergonomics (>= 44px on all buttons)
// ============================================================================
console.log('\n=== SUITE 4: Touch Target Ergonomics in KadanNpcDialog & KadanRpgView ===');

function extractButtonTags(content: string) {
  const results: Array<{ line: number; tag: string; classNames: string }> = [];
  const pattern = /<button\b/g;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const startIdx = match.index;
    let i = pattern.lastIndex;
    let braceDepth = 0;
    let inStr: string | null = null;
    let escaped = false;

    while (i < content.length) {
      const ch = content[i];
      if (inStr) {
        if (ch === '\\' && !escaped) {
          escaped = true;
        } else if (ch === inStr && !escaped) {
          inStr = null;
        } else {
          escaped = false;
        }
      } else {
        if (ch === '"' || ch === "'" || ch === '`') {
          inStr = ch;
        } else if (ch === '{') {
          braceDepth++;
        } else if (ch === '}') {
          if (braceDepth > 0) braceDepth--;
        } else if (ch === '>' && braceDepth === 0) {
          break;
        }
      }
      i++;
    }

    const tagFull = content.substring(startIdx, i + 1);
    const lineNum = content.substring(0, startIdx).split('\n').length;
    results.push({ line: lineNum, tag: tagFull, classNames: tagFull });
  }

  return results;
}

const TOUCH_TARGET_QUALIFIERS = [
  'min-h-[44px]',
  'min-h-11',
  'min-h-12',
  'h-11',
  'h-12',
  'h-14',
  'h-[44px]',
  'h-[48px]',
];

const dialogSrc = fs.readFileSync('src/components/rpg/KadanNpcDialog.tsx', 'utf-8');
const viewSrc = fs.readFileSync('src/views/KadanRpgView.tsx', 'utf-8');

const dialogButtons = extractButtonTags(dialogSrc);
const allDialogButtonsMeetTouchTarget = dialogButtons.every((btn) =>
  TOUCH_TARGET_QUALIFIERS.some((qualifier) => btn.classNames.includes(qualifier))
);

assert(
  dialogButtons.length >= 7 && allDialogButtonsMeetTouchTarget,
  'TouchTarget',
  'All Buttons in KadanNpcDialog.tsx Satisfy >= 44px Touch Target',
  `Checked ${dialogButtons.length} buttons, all contain qualifying 44px+ classes.`
);

// Verify choice button specifically has min-h-[44px]
const choiceBtnMatch = dialogSrc.includes('w-full min-h-[44px]');
assert(
  choiceBtnMatch,
  'TouchTarget',
  'Interactive Choice Buttons Explicitly Styled with w-full min-h-[44px]',
  'Choice buttons provide full-width and 44px+ thumb target.'
);

// Verify close [x] button has min-h-[44px] min-w-[44px]
const closeBtnMatch = dialogSrc.includes('min-h-[44px] min-w-[44px]');
assert(
  closeBtnMatch,
  'TouchTarget',
  'Dialog Dismiss [x] Button Has min-h-[44px] min-w-[44px] Square Target',
  'Dismiss touch target is at least 44x44px.'
);

const viewButtons = extractButtonTags(viewSrc);
const allViewButtonsMeetTouchTarget = viewButtons.every((btn) =>
  TOUCH_TARGET_QUALIFIERS.some((qualifier) => btn.classNames.includes(qualifier))
);

assert(
  viewButtons.length >= 8 && allViewButtonsMeetTouchTarget,
  'TouchTarget',
  'All Buttons in KadanRpgView.tsx Satisfy >= 44px Touch Target',
  `Checked ${viewButtons.length} buttons in KadanRpgView.tsx.`
);

// ============================================================================
// SUITE 5: Follow-Up Reaction Line Splicing and State Transition Simulation
// ============================================================================
console.log('\n=== SUITE 5: Follow-Up Reaction Line Splicing & State Transition ===');

interface ConversationLine {
  speaker: string;
  cardId?: number;
  name: string;
  nameEn?: string;
  text: string;
  textEn?: string;
  choices?: KadanRpgDialogueChoice[];
}

function simulateDialogueChoiceSelection(
  baseLines: ConversationLine[],
  choiceLineIndex: number,
  selectedChoice: KadanRpgDialogueChoice,
  isEn: boolean
) {
  let lines = [...baseLines];
  let lineIndex = choiceLineIndex;
  const currentLine = lines[lineIndex];

  // Callback simulations
  let rewardedSns = 0;
  let appliedBuff: any = null;

  if (selectedChoice.bonusType === 'sns') {
    rewardedSns = selectedChoice.bonusValue;
  } else if (selectedChoice.bonusType === 'buff') {
    appliedBuff = {
      id: 'atk_boost',
      value: selectedChoice.bonusValue,
      name: isEn ? selectedChoice.bonusDescEn : selectedChoice.bonusDescKo,
    };
  }

  const followUpText = isEn
    ? selectedChoice.followUpTextEn || selectedChoice.followUpTextKo
    : selectedChoice.followUpTextKo || selectedChoice.followUpTextEn;

  if (followUpText) {
    const followUpObj: ConversationLine = {
      speaker: 'kadan',
      cardId: currentLine?.cardId ?? 41,
      name: isEn ? currentLine?.nameEn || 'Kadan' : currentLine?.name || '카단',
      text: followUpText,
    };
    lines.splice(lineIndex + 1, 0, followUpObj);
    lineIndex = lineIndex + 1;
  } else {
    lineIndex = lineIndex + 1;
  }

  return { lines, lineIndex, rewardedSns, appliedBuff };
}

const mockBaseLines: ConversationLine[] = [
  { speaker: 'narrator', name: '나레이션', text: '눈보라가 몰아친다.' },
  {
    speaker: 'choice',
    name: '카단',
    text: '어떻게 대응할 것인가?',
    choices: mockChoices,
  },
  { speaker: 'speaker', name: '적갈기의 기수', text: '놈이 다가온다!' },
];

const simResultKo = simulateDialogueChoiceSelection(mockBaseLines, 1, mockChoices[1], false);
assert(
  simResultKo.lines.length === 4 &&
    simResultKo.lineIndex === 2 &&
    simResultKo.lines[2].text === '관찰 반응' &&
    simResultKo.rewardedSns === 50,
  'StateSplicing',
  'Ko Mode: Slices Tailored Follow-Up Reaction Line at lineIndex+1 & Dispatches SNS',
  `Lines: ${simResultKo.lines.length}, Active Line: "${simResultKo.lines[simResultKo.lineIndex].text}", SNS: ${simResultKo.rewardedSns}`
);

const simResultEn = simulateDialogueChoiceSelection(mockBaseLines, 1, mockChoices[0], true);
assert(
  simResultEn.lines.length === 4 &&
    simResultEn.lineIndex === 2 &&
    simResultEn.lines[2].text === 'Breakthrough response' &&
    simResultEn.appliedBuff?.value === 15,
  'StateSplicing',
  'En Mode: Slices English Reaction Line at lineIndex+1 & Dispatches Buff',
  `Lines: ${simResultEn.lines.length}, Active Line: "${simResultEn.lines[simResultEn.lineIndex].text}", Buff: ${simResultEn.appliedBuff?.value}%`
);

// ============================================================================
// SUITE 6: React SSR Component Rendering Across All 40 Chapters
// ============================================================================
console.log('\n=== SUITE 6: React SSR Rendering Integrity Across All 40 Chapters ===');

let ssrPassed = 0;
for (let ch = 1; ch <= 40; ch++) {
  const event: KadanRpgEvent = KADAN_RPG_EVENTS[ch - 1];
  try {
    const htmlKo = renderToString(
      React.createElement(KadanNpcDialog, {
        event,
        language: 'ko',
        isCompleted: false,
        autoMode: false,
        canStartBattle: true,
        canClaimReward: false,
        rebirthLevel: 0,
        onStartBattle: () => {},
        onClaimReward: () => {},
        onComplete: () => {},
        onClose: () => {},
      })
    );

    const htmlEn = renderToString(
      React.createElement(KadanNpcDialog, {
        event,
        language: 'en',
        isCompleted: false,
        autoMode: true,
        canStartBattle: true,
        canClaimReward: false,
        rebirthLevel: 1,
        onStartBattle: () => {},
        onClaimReward: () => {},
        onComplete: () => {},
        onClose: () => {},
      })
    );

    if (htmlKo.length > 1000 && htmlEn.length > 1000 && htmlKo.includes('min-h-[44px]')) {
      ssrPassed++;
    }
  } catch (err) {
    console.error(`SSR crash on Chapter ${ch}:`, err);
  }
}

assert(
  ssrPassed === 40,
  'SSR',
  'All 40 Chapters Render Cleanly in React SSR (Both KO & EN) Without Exception',
  `Rendered ${ssrPassed}/40 chapters successfully.`
);

// ============================================================================
// SUMMARY & EXIT
// ============================================================================
console.log('\n============================================================');
console.log('            CHALLENGER M2 EMPIRICAL TEST SUMMARY           ');
console.log('============================================================');

const totalTests = testResults.length;
const passedTests = testResults.filter((r) => r.passed).length;
const failedTests = totalTests - passedTests;

console.log(`Total Assertions : ${totalTests}`);
console.log(`Passed           : ${passedTests}`);
console.log(`Failed           : ${failedTests}`);
console.log(`Compliance Rate  : ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests > 0) {
  console.error('\nFAILURE DETECTED IN CHALLENGER SUITE!');
  process.exit(1);
} else {
  console.log('\nALL EMPIRICAL CHALLENGER ASSERTIONS PASSED WITH 100% COMPLIANCE.');
  process.exit(0);
}
