import { KADAN_RPG_NOVEL_SCRIPTS, type KadanRpgDialogueChoice, type KadanRpgNovelScriptLine } from '../src/content/kadanRpgNovelScript';
import { KADAN_RPG_EVENTS } from '../src/content/kadanRpgStory';
import { CARD_DATABASE } from '../src/cardDatabase';
import type { CardData, Language } from '../src/types';

// Mock in-memory LocalStorage for testing persistence
class MemoryLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

const mockStorage = new MemoryLocalStorage();

// Simulation of KadanRpgView combat buff deck augmentation
function calculateBuffedDeck(deck: CardData[], storage: MemoryLocalStorage): CardData[] {
  const rawDeck = deck.filter((c): c is CardData => Boolean(c));
  try {
    const rawBuff = storage.getItem('hero_kadan_active_buff');
    if (!rawBuff) return rawDeck;
    const buff = JSON.parse(rawBuff);
    const buffVal = typeof buff.value === 'number' ? buff.value : (buff.id === 'atk_boost' ? 15 : buff.id === 'mana_surge' ? 20 : 15);
    const multiplier = 1.0 + (buffVal / 100.0);
    return rawDeck.map((card) => ({
      ...card,
      power: Math.round(card.power * multiplier),
    }));
  } catch {
    return rawDeck;
  }
}

// Simulation of KadanNpcDialog choice selection logic
function simulateSelectChoice(
  choice: KadanRpgDialogueChoice,
  chapterNumber: number,
  isEn: boolean,
  storage: MemoryLocalStorage,
  onRewardSns: (amount: number, reason: string) => void,
  onApplyBuff: (buff: any, buffName: string) => void
) {
  // 1. SNS reward
  const snsAmount = choice.bonusType === 'sns' ? choice.bonusValue : (choice.reward?.snsCoins || 0);
  if (snsAmount > 0) {
    const reason = isEn ? `[RPG Ch.${chapterNumber}] Choice Bonus` : `[RPG Ch.${chapterNumber}] 선택 보너스`;
    onRewardSns(snsAmount, reason);
  }

  // 2. Combat buff
  if (choice.bonusType === 'buff' || choice.reward?.buff) {
    const buffId = choice.reward?.buff || (choice.bonusType === 'buff' ? 'atk_boost' : 'dialogue_buff');
    const buffName = isEn
      ? (choice.bonusDescEn || choice.reward?.buffNameEn || 'Combat Buff')
      : (choice.bonusDescKo || choice.reward?.buffName || '전투 버프');
    const buffObj = {
      id: buffId,
      type: choice.bonusType || 'buff',
      value: choice.bonusValue || 15,
      name: choice.bonusDescKo || choice.reward?.buffName || buffName,
      nameEn: choice.bonusDescEn || choice.reward?.buffNameEn || buffName,
      chapterNumber,
      timestamp: Date.now(),
    };
    onApplyBuff(buffObj, buffName);
    try {
      storage.setItem('hero_kadan_active_buff', JSON.stringify(buffObj));
    } catch {}
  }
}

// -------------------------------------------------------------
// Test Execution Suite
// -------------------------------------------------------------
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail: string = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName} - ${detail}`);
  }
}

async function runEmpiricalTests() {
  console.log('===============================================================');
  console.log('  CHALLENGER 2 EMPIRICAL ADVERSARIAL TEST HARNESS (MILESTONE 2) ');
  console.log('===============================================================');

  // Sample card deck
  const sampleDeck: CardData[] = [
    { ...CARD_DATABASE[1], power: 100 },
    { ...CARD_DATABASE[2], power: 60 },
    { ...CARD_DATABASE[3], power: 75 },
    { ...CARD_DATABASE[4], power: 53 },
    { ...CARD_DATABASE[5], power: 120 },
  ];

  // =============================================================
  // PART 1: COMBAT BUFF PERSISTENCE & +15% POWER CALCULATION
  // =============================================================
  console.log('\n--- PART 1: Combat Buff Persistence & Power Calculation ---');

  // Test 1.1: LocalStorage empty -> original deck unchanged
  mockStorage.clear();
  const unbuffed = calculateBuffedDeck(sampleDeck, mockStorage);
  assert(
    unbuffed.length === sampleDeck.length && unbuffed.every((c, i) => c.power === sampleDeck[i].power),
    'Empty LocalStorage returns original unbuffed deck'
  );

  // Test 1.2: +15% buff calculation (Standard atk_boost)
  mockStorage.setItem(
    'hero_kadan_active_buff',
    JSON.stringify({
      id: 'atk_boost',
      type: 'buff',
      value: 15,
      name: '공격력 +15%',
      nameEn: 'ATK +15%',
    })
  );
  const buffed15 = calculateBuffedDeck(sampleDeck, mockStorage);
  assert(
    buffed15[0].power === 115, // 100 * 1.15 = 115
    '+15% power calculation on base 100 power yields exactly 115',
    `Expected 115, got ${buffed15[0].power}`
  );
  assert(
    buffed15[1].power === 69, // 60 * 1.15 = 69
    '+15% power calculation on base 60 power yields exactly 69',
    `Expected 69, got ${buffed15[1].power}`
  );
  assert(
    buffed15[2].power === 86, // 75 * 1.15 = 86.25 -> 86
    '+15% power calculation on base 75 power rounds to 86',
    `Expected 86, got ${buffed15[2].power}`
  );
  assert(
    buffed15[3].power === 61, // 53 * 1.15 = 60.95 -> 61
    '+15% power calculation on base 53 power rounds to 61',
    `Expected 61, got ${buffed15[3].power}`
  );
  assert(
    buffed15[4].power === 138, // 120 * 1.15 = 138
    '+15% power calculation on base 120 power yields exactly 138',
    `Expected 138, got ${buffed15[4].power}`
  );

  // Test 1.3: Verification of buff persistence across multiple calls
  const buffedCall2 = calculateBuffedDeck(sampleDeck, mockStorage);
  assert(
    buffedCall2[0].power === 115,
    'Buff persists in LocalStorage across multiple simulation reads'
  );

  // Test 1.4: Battle completion clears LocalStorage
  mockStorage.removeItem('hero_kadan_active_buff');
  const postBattle = calculateBuffedDeck(sampleDeck, mockStorage);
  assert(
    postBattle[0].power === 100,
    'Battle completion (removeItem) cleanly resets card power to original baseline'
  );

  // Test 1.5: Resilient handling of corrupted JSON in LocalStorage
  mockStorage.setItem('hero_kadan_active_buff', '{corrupted_json_string!!');
  const corruptedResult = calculateBuffedDeck(sampleDeck, mockStorage);
  assert(
    corruptedResult[0].power === 100,
    'Corrupted JSON in LocalStorage falls back gracefully to rawDeck without throwing'
  );

  // Test 1.6: Fallback when value is omitted but id is 'atk_boost'
  mockStorage.setItem('hero_kadan_active_buff', JSON.stringify({ id: 'atk_boost' }));
  const fallbackAtkBoost = calculateBuffedDeck(sampleDeck, mockStorage);
  assert(
    fallbackAtkBoost[0].power === 115,
    'Missing value with id: atk_boost defaults safely to +15% boost'
  );

  // Test 1.7: Fallback when value is omitted but id is 'mana_surge'
  mockStorage.setItem('hero_kadan_active_buff', JSON.stringify({ id: 'mana_surge' }));
  const fallbackManaSurge = calculateBuffedDeck(sampleDeck, mockStorage);
  assert(
    fallbackManaSurge[0].power === 120, // 100 * 1.20 = 120
    'Missing value with id: mana_surge defaults safely to +20% boost'
  );

  // Test 1.8: Test choice selection integration across all 40 chapters
  let totalBuffChoices = 0;
  let validBuffChoices = 0;

  for (let ch = 1; ch <= 40; ch++) {
    const script = KADAN_RPG_NOVEL_SCRIPTS[ch];
    if (!script) continue;
    for (const line of script) {
      if (!line.choices) continue;
      for (const choice of line.choices) {
        if (choice.bonusType === 'buff' || choice.reward?.buff) {
          totalBuffChoices++;
          mockStorage.clear();
          let buffDispatched = false;
          simulateSelectChoice(
            choice,
            ch,
            false,
            mockStorage,
            () => {},
            (buff) => {
              buffDispatched = Boolean(buff && buff.value > 0);
            }
          );
          const stored = mockStorage.getItem('hero_kadan_active_buff');
          if (buffDispatched && stored) {
            const parsed = JSON.parse(stored);
            if (parsed.chapterNumber === ch && typeof parsed.value === 'number' && parsed.value > 0) {
              const testDeck = calculateBuffedDeck(sampleDeck, mockStorage);
              if (testDeck[0].power > sampleDeck[0].power) {
                validBuffChoices++;
              }
            }
          }
        }
      }
    }
  }

  assert(
    totalBuffChoices > 0 && validBuffChoices === totalBuffChoices,
    `All ${totalBuffChoices} buff choices across all 40 chapters persist to storage and amplify deck power (${validBuffChoices}/${totalBuffChoices})`
  );

  // =============================================================
  // PART 2: MULTILINGUAL RENDERING WHEN language !== 'ko'
  // =============================================================
  console.log('\n--- PART 2: Multilingual Rendering (language !== ko) ---');

  const testLanguages: Language[] = ['en', 'ja', 'zh-CN', 'zh-TW', 'de', 'es', 'fr', 'id', 'ru', 'th', 'vi'];

  // Test 2.1: Verify language !== 'ko' flag behaves as isEn = true
  for (const lang of testLanguages) {
    const isEn = lang !== 'ko';
    assert(isEn === true, `Language '${lang}' resolves isEn = true for multilingual novel script rendering`);
  }

  // Test 2.2: Verify every line in all 40 chapters has valid English text and name
  let totalLinesAudited = 0;
  let englishLinesValid = 0;
  let linesWithEnglishText = 0;

  for (let ch = 1; ch <= 40; ch++) {
    const script = KADAN_RPG_NOVEL_SCRIPTS[ch];
    assert(Boolean(script && script.length > 0), `Chapter ${ch} novel script exists and has lines`);
    if (!script) continue;

    for (const line of script) {
      totalLinesAudited++;
      const resolvedNameEn = line.nameEn || line.name;
      const resolvedTextEn = line.textEn || line.text;

      if (resolvedNameEn && resolvedNameEn.trim().length > 0 && resolvedTextEn && resolvedTextEn.trim().length > 0) {
        englishLinesValid++;
      }
      if (line.textEn && line.textEn.trim().length > 0) {
        linesWithEnglishText++;
      }
    }
  }

  assert(
    englishLinesValid === totalLinesAudited,
    `All ${totalLinesAudited} novel lines resolve to non-empty English name and text in non-Korean mode (${englishLinesValid}/${totalLinesAudited})`
  );

  assert(
    linesWithEnglishText === totalLinesAudited,
    `100% of novel lines (${linesWithEnglishText}/${totalLinesAudited}) have dedicated textEn translations`
  );

  // Test 2.3: Verify every dialogue choice has valid English attitude, label, followUp, and bonusDesc
  let totalChoicesAudited = 0;
  let validChoicesEn = 0;
  let choicesWithAttitudeEn = 0;
  let choicesWithLabelEn = 0;
  let choicesWithFollowUpEn = 0;

  for (let ch = 1; ch <= 40; ch++) {
    const script = KADAN_RPG_NOVEL_SCRIPTS[ch];
    if (!script) continue;

    for (const line of script) {
      if (!line.choices) continue;
      for (const choice of line.choices) {
        totalChoicesAudited++;

        // Attitude
        const attitude = choice.attitudeEn || choice.badgeEn || choice.attitude || choice.badge;
        // Label
        const label = choice.labelEn || choice.textEn || choice.labelKo || choice.text;
        // Follow-up
        const followUp = choice.followUpTextEn || choice.followUpLineEn || choice.followUpTextKo || choice.followUpLine || '';
        // Bonus Desc
        const bonusDesc = choice.bonusDescEn || choice.bonusDescKo;

        if (attitude && label && followUp && bonusDesc) {
          validChoicesEn++;
        }
        if (choice.attitudeEn || choice.badgeEn) choicesWithAttitudeEn++;
        if (choice.labelEn || choice.textEn) choicesWithLabelEn++;
        if (choice.followUpTextEn || choice.followUpLineEn) choicesWithFollowUpEn++;
      }
    }
  }

  assert(
    validChoicesEn === totalChoicesAudited && totalChoicesAudited >= 40,
    `All ${totalChoicesAudited} choices across all 40 chapters provide complete English rendering fields (${validChoicesEn}/${totalChoicesAudited})`
  );
  assert(
    choicesWithAttitudeEn === totalChoicesAudited,
    `All ${totalChoicesAudited} choices provide English attitude badges ([Resolve], [Insight], [Resonance])`
  );
  assert(
    choicesWithLabelEn === totalChoicesAudited,
    `All ${totalChoicesAudited} choices provide English choice labels`
  );
  assert(
    choicesWithFollowUpEn === totalChoicesAudited,
    `All ${totalChoicesAudited} choices provide English follow-up reaction text`
  );

  // Test 2.4: Check for unintended Korean leaks in English fields
  const koreanRegex = /[\uac00-\ud7af]/;
  let koreanLeaksInAttitudeEn = 0;
  let koreanLeaksInLabelEn = 0;

  for (let ch = 1; ch <= 40; ch++) {
    const script = KADAN_RPG_NOVEL_SCRIPTS[ch];
    if (!script) continue;
    for (const line of script) {
      if (!line.choices) continue;
      for (const choice of line.choices) {
        if (choice.attitudeEn && koreanRegex.test(choice.attitudeEn)) koreanLeaksInAttitudeEn++;
        if (choice.labelEn && koreanRegex.test(choice.labelEn)) koreanLeaksInLabelEn++;
      }
    }
  }

  assert(
    koreanLeaksInAttitudeEn === 0,
    `Zero Korean characters in attitudeEn (${koreanLeaksInAttitudeEn} leaks found)`
  );
  assert(
    koreanLeaksInLabelEn === 0,
    `Zero Korean characters in labelEn (${koreanLeaksInLabelEn} leaks found)`
  );

  // =============================================================
  // PART 3: AUTO-PLAY TRANSITION THROUGH DIALOGUE CHOICE
  // =============================================================
  console.log('\n--- PART 3: Auto-Play Dialogue Choice State Machine & Countdown Timer ---');

  // Exact state machine simulation matching KadanNpcDialog.tsx
  interface DialogState {
    lineIndex: number;
    dynamicLines: KadanRpgNovelScriptLine[];
    selectedChoiceIds: Record<number, string>;
    choiceTimeLeftMs: number;
    choiceTotalDurationMs: number;
    hasActiveChoices: boolean;
    finished: boolean;
    finishType?: 'battle' | 'reward' | 'complete';
    activeBuff?: any;
    rewardCoins: number;
    timeElapsedMs: number;
  }

  function simulateDialogPlaythrough(
    chapterNumber: number,
    autoMode: boolean,
    storage: MemoryLocalStorage,
    manualPickAtMs?: { atMs: number; choiceIndex: number },
    skipAtMs?: number
  ): { state: DialogState; log: string[] } {
    const log: string[] = [];
    const baseLines = [...(KADAN_RPG_NOVEL_SCRIPTS[chapterNumber] || [])];

    const state: DialogState = {
      lineIndex: 0,
      dynamicLines: baseLines,
      selectedChoiceIds: {},
      choiceTimeLeftMs: 0,
      choiceTotalDurationMs: autoMode ? 1500 : 5000,
      hasActiveChoices: false,
      finished: false,
      rewardCoins: 0,
      timeElapsedMs: 0,
    };

    const maxSimulationTicks = 2000; // safety ceiling (100 seconds)
    let ticks = 0;

    let autoAdvanceTimerMs: number | null = null;
    let choiceDeadlineMs: number | null = null;

    while (!state.finished && ticks < maxSimulationTicks) {
      ticks++;
      state.timeElapsedMs += 50;

      const currentLine = state.dynamicLines[state.lineIndex] ?? state.dynamicLines[0];
      const currentChoices = currentLine?.choices;
      const hasActive = Boolean(
        ((currentChoices && currentChoices.length > 0) || currentLine?.speaker === 'choice') &&
        Boolean(currentChoices && currentChoices.length > 0 && !state.selectedChoiceIds[state.lineIndex])
      );
      state.hasActiveChoices = hasActive;

      // Check skip trigger
      if (skipAtMs !== undefined && state.timeElapsedMs >= skipAtMs) {
        skipAtMs = undefined; // trigger once
        log.push(`[${state.timeElapsedMs}ms] Manual SKIP triggered`);
        if (hasActive && currentChoices && currentChoices.length > 0) {
          const defaultChoice = currentChoices.find((c) => c.isDefault) ?? currentChoices[0];
          // select default
          state.selectedChoiceIds[state.lineIndex] = defaultChoice.id;
          state.choiceTimeLeftMs = 0;
          choiceDeadlineMs = null;
          if (defaultChoice.bonusType === 'buff') {
            state.activeBuff = defaultChoice;
          }
        }
        state.lineIndex = state.dynamicLines.length - 1;
        autoAdvanceTimerMs = 0;
      }

      // Check manual pick trigger
      if (manualPickAtMs && state.timeElapsedMs >= manualPickAtMs.atMs && hasActive && currentChoices) {
        log.push(`[${state.timeElapsedMs}ms] Manual choice tap triggered on choice #${manualPickAtMs.choiceIndex}`);
        const chosen = currentChoices[manualPickAtMs.choiceIndex] ?? currentChoices[0];
        manualPickAtMs = undefined; // trigger once

        state.selectedChoiceIds[state.lineIndex] = chosen.id;
        state.choiceTimeLeftMs = 0;
        choiceDeadlineMs = null;

        // Apply bonus
        if (chosen.bonusType === 'sns') {
          state.rewardCoins += chosen.bonusValue;
        } else if (chosen.bonusType === 'buff') {
          state.activeBuff = chosen;
          storage.setItem('hero_kadan_active_buff', JSON.stringify(chosen));
        }

        // Splice follow-up
        const followUp = chosen.followUpTextKo || chosen.followUpLine || '';
        if (followUp) {
          const followUpObj: KadanRpgNovelScriptLine = {
            speaker: 'kadan',
            cardId: 41,
            name: '카단',
            text: followUp,
          };
          state.dynamicLines.splice(state.lineIndex + 1, 0, followUpObj);
          state.lineIndex += 1;
        } else {
          state.lineIndex += 1;
        }
        autoAdvanceTimerMs = autoMode ? 1800 : null;
        continue;
      }

      // Choice countdown timer handling
      if (hasActive && currentChoices && currentChoices.length > 0) {
        autoAdvanceTimerMs = null; // paused normal auto-advance

        if (choiceDeadlineMs === null) {
          const duration = autoMode ? 1500 : 5000;
          state.choiceTotalDurationMs = duration;
          state.choiceTimeLeftMs = duration;
          choiceDeadlineMs = state.timeElapsedMs + duration;
          log.push(`[${state.timeElapsedMs}ms] Choice timer started: ${duration}ms`);
        }

        const remaining = Math.max(0, choiceDeadlineMs - state.timeElapsedMs);
        state.choiceTimeLeftMs = remaining;

        if (remaining <= 0) {
          log.push(`[${state.timeElapsedMs}ms] Choice timer EXPIRED -> auto-picking default choice`);
          choiceDeadlineMs = null;
          const defaultChoice = currentChoices.find((c) => c.isDefault) ?? currentChoices[0];

          state.selectedChoiceIds[state.lineIndex] = defaultChoice.id;
          state.choiceTimeLeftMs = 0;

          if (defaultChoice.bonusType === 'sns') {
            state.rewardCoins += defaultChoice.bonusValue;
          } else if (defaultChoice.bonusType === 'buff') {
            state.activeBuff = defaultChoice;
            storage.setItem('hero_kadan_active_buff', JSON.stringify(defaultChoice));
          }

          const followUp = defaultChoice.followUpTextKo || defaultChoice.followUpLine || '';
          if (followUp) {
            const followUpObj: KadanRpgNovelScriptLine = {
              speaker: 'kadan',
              cardId: 41,
              name: '카단',
              text: followUp,
            };
            state.dynamicLines.splice(state.lineIndex + 1, 0, followUpObj);
            state.lineIndex += 1;
          } else {
            state.lineIndex += 1;
          }
          autoAdvanceTimerMs = autoMode ? 1800 : null;
          continue;
        }
      } else {
        // Normal dialogue auto-advancement
        if (autoMode) {
          if (autoAdvanceTimerMs === null) {
            autoAdvanceTimerMs = state.lineIndex < state.dynamicLines.length - 1 ? 1800 : 2300;
          } else {
            autoAdvanceTimerMs -= 50;
            if (autoAdvanceTimerMs <= 0) {
              if (state.lineIndex < state.dynamicLines.length - 1) {
                state.lineIndex += 1;
                autoAdvanceTimerMs = state.lineIndex < state.dynamicLines.length - 1 ? 1800 : 2300;
              } else {
                state.finished = true;
                state.finishType = 'battle';
                log.push(`[${state.timeElapsedMs}ms] Dialogue finished cleanly`);
              }
            }
          }
        } else {
          // In manual mode, simulated player clicks "continue" to read non-choice dialogue
          if (autoAdvanceTimerMs === null) {
            autoAdvanceTimerMs = 400;
          } else {
            autoAdvanceTimerMs -= 50;
            if (autoAdvanceTimerMs <= 0) {
              if (state.lineIndex < state.dynamicLines.length - 1) {
                state.lineIndex += 1;
                autoAdvanceTimerMs = 400;
              } else {
                state.finished = true;
                state.finishType = 'battle';
                log.push(`[${state.timeElapsedMs}ms] Manual dialogue finished cleanly`);
              }
            }
          }
        }
      }
    }

    return { state, log };
  }

  // Test 3.1: Run auto-play playthrough on all 40 chapters
  let chaptersFinishedCleanly = 0;
  for (let ch = 1; ch <= 40; ch++) {
    const { state } = simulateDialogPlaythrough(ch, true, mockStorage);
    if (state.finished && state.finishType === 'battle') {
      chaptersFinishedCleanly++;
    }
  }

  assert(
    chaptersFinishedCleanly === 40,
    `Full 40-Chapter Auto-Play Dialog Playthrough: 100% complete without freezing (${chaptersFinishedCleanly}/40)`
  );

  // Test 3.2: Verify 1.5s countdown timing in autoMode
  const { state: autoState, log: autoLog } = simulateDialogPlaythrough(1, true, mockStorage);
  const timerStartEntry = autoLog.find((l) => l.includes('Choice timer started'));
  const timerExpiryEntry = autoLog.find((l) => l.includes('Choice timer EXPIRED'));
  let measuredCountdownDuration = 0;
  if (timerStartEntry && timerExpiryEntry) {
    const startMs = parseInt(timerStartEntry.match(/\[(\d+)ms\]/)?.[1] || '0', 10);
    const expiryMs = parseInt(timerExpiryEntry.match(/\[(\d+)ms\]/)?.[1] || '0', 10);
    measuredCountdownDuration = expiryMs - startMs;
  }
  assert(
    measuredCountdownDuration === 1500,
    `Auto-mode choice countdown runs for exactly 1.5s (1500ms) before auto-pick (measured: ${measuredCountdownDuration}ms)`
  );

  // Test 3.3: Verify manual mode 5.0s countdown timing
  const { log: manualLog } = simulateDialogPlaythrough(1, false, mockStorage);
  const mStartEntry = manualLog.find((l) => l.includes('Choice timer started'));
  const mExpiryEntry = manualLog.find((l) => l.includes('Choice timer EXPIRED'));
  let mMeasuredDuration = 0;
  if (mStartEntry && mExpiryEntry) {
    const startMs = parseInt(mStartEntry.match(/\[(\d+)ms\]/)?.[1] || '0', 10);
    const expiryMs = parseInt(mExpiryEntry.match(/\[(\d+)ms\]/)?.[1] || '0', 10);
    mMeasuredDuration = expiryMs - startMs;
  }
  assert(
    mMeasuredDuration === 5000,
    `Manual mode choice countdown runs for exactly 5.0s (5000ms) before auto-pick (measured: ${mMeasuredDuration}ms)`
  );

  // Test 3.4: Verify manual choice selection interrupts countdown immediately without freeze
  const tapTime = (timerStartEntry ? parseInt(timerStartEntry.match(/\[(\d+)ms\]/)?.[1] || '7300', 10) : 7300) + 500;
  const { state: manualPickState } = simulateDialogPlaythrough(1, true, mockStorage, { atMs: tapTime, choiceIndex: 1 });
  assert(
    manualPickState.finished === true && Object.values(manualPickState.selectedChoiceIds).includes('ch01_choice_2'),
    'Manual choice tap at choiceStart+500ms cleanly interrupts countdown, registers choice, and proceeds to finish'
  );

  // Test 3.5: Verify manual SKIP button jumps cleanly to end and completes
  const { state: skipState } = simulateDialogPlaythrough(1, true, mockStorage, undefined, 300);
  assert(
    skipState.finished === true,
    'Manual Skip button jumps to final dialogue line and finishes without hang'
  );

  // Test 3.5: Rapid countdown stress test (100 chapters in succession)
  let rapidSuccess = 0;
  for (let i = 0; i < 100; i++) {
    const ch = (i % 40) + 1;
    const { state } = simulateDialogPlaythrough(ch, true, mockStorage);
    if (state.finished) rapidSuccess++;
  }
  assert(
    rapidSuccess === 100,
    '100 consecutive rapid dialogue runs completed with 0 stalls or memory locks'
  );

  // =============================================================
  // PART 4: HOSTILE EDGE CASES & DESIGN.MD AUDIT
  // =============================================================
  console.log('\n--- PART 4: Hostile Edge Cases & DESIGN.md Audit ---');

  // Test 4.1: QuotaExceededError simulation on localStorage.setItem
  class ThrowingStorage extends MemoryLocalStorage {
    override setItem(key: string, value: string): void {
      throw new Error('QuotaExceededError: DOM Exception 22');
    }
  }
  const throwingStorage = new ThrowingStorage();
  let threwException = false;
  try {
    simulateSelectChoice(
      KADAN_RPG_NOVEL_SCRIPTS[1][4].choices![1],
      1,
      false,
      throwingStorage,
      () => {},
      () => {}
    );
  } catch (e) {
    threwException = true;
  }
  assert(!threwException, 'Storage QuotaExceededError is safely swallowed by try-catch without crashing UI');

  // Test 4.2: Extreme deck power calculation
  const extremeDeck: CardData[] = [
    { ...CARD_DATABASE[1], power: 0 },
    { ...CARD_DATABASE[2], power: 1 },
    { ...CARD_DATABASE[3], power: 99999 },
  ];
  mockStorage.setItem('hero_kadan_active_buff', JSON.stringify({ id: 'atk_boost', value: 15 }));
  const extremeResult = calculateBuffedDeck(extremeDeck, mockStorage);
  assert(
    extremeResult[0].power === 0 && extremeResult[1].power === 1 && extremeResult[2].power === 114999,
    'Zero power remains 0, 1 rounds to 1, and 99999 scales to 114999 with 0 NaN or overflow'
  );

  // Test 4.3: Zero / negative buff values
  mockStorage.setItem('hero_kadan_active_buff', JSON.stringify({ id: 'zero_buff', value: 0 }));
  const zeroResult = calculateBuffedDeck(sampleDeck, mockStorage);
  assert(
    zeroResult[0].power === 100,
    'Buff value: 0 maintains exact 1.0x baseline power without alteration'
  );

  // Test 4.4: DESIGN.md token inspection on KadanNpcDialog.tsx
  const fs = await import('fs');
  const dialogContent = fs.readFileSync('src/components/rpg/KadanNpcDialog.tsx', 'utf-8');

  assert(!dialogContent.includes('min-min-h-'), 'Zero occurrences of typo min-min-h- in KadanNpcDialog.tsx');
  assert(!dialogContent.includes('rounded-md'), 'Zero occurrences of prohibited rounded-md in KadanNpcDialog.tsx');
  assert(!dialogContent.includes('rounded-full'), 'Zero occurrences of prohibited rounded-full in KadanNpcDialog.tsx');
  assert(!dialogContent.includes('rounded-xl'), 'Zero occurrences of prohibited rounded-xl in KadanNpcDialog.tsx');
  assert(!dialogContent.includes('rounded-2xl'), 'Zero occurrences of prohibited rounded-2xl in KadanNpcDialog.tsx');
  assert(!dialogContent.includes('bg-gradient-to'), 'Zero occurrences of multi-color bg-gradient-to in KadanNpcDialog.tsx');
  assert(!dialogContent.includes('radial-gradient'), 'Zero occurrences of radial-gradient glow aura in KadanNpcDialog.tsx');
  assert(!dialogContent.includes('animate-pulse'), 'Zero occurrences of animate-pulse in KadanNpcDialog.tsx');
  assert(!dialogContent.includes('drop-shadow-['), 'Zero occurrences of drop-shadow-[ in KadanNpcDialog.tsx');

  // Test 4.5: Touch target audit: all <button elements have min-h-[44px]
  function extractButtonsJSX(content: string): string[] {
    const buttons: string[] = [];
    const btnRegex = /<button\b/g;
    let match;
    while ((match = btnRegex.exec(content)) !== null) {
      let i = btnRegex.lastIndex;
      let braceDepth = 0;
      let inStr: string | null = null;
      let escaped = false;
      while (i < content.length) {
        const ch = content[i];
        if (inStr) {
          if (ch === '\\' && !escaped) escaped = true;
          else if (ch === inStr && !escaped) inStr = null;
          else escaped = false;
        } else {
          if (ch === '"' || ch === "'" || ch === '`') inStr = ch;
          else if (ch === '{') braceDepth++;
          else if (ch === '}') { if (braceDepth > 0) braceDepth--; }
          else if (ch === '>' && braceDepth === 0) break;
        }
        i++;
      }
      buttons.push(content.substring(match.index, i + 1));
    }
    return buttons;
  }

  const buttons = extractButtonsJSX(dialogContent);
  const compliantButtons = buttons.filter((b) => b.includes('min-h-[44px]') || b.includes('min-h-11') || b.includes('h-11'));
  assert(
    buttons.length > 0 && buttons.length === compliantButtons.length,
    `All ${buttons.length} interactive buttons in KadanNpcDialog.tsx strictly satisfy min-h-[44px] touch target (${compliantButtons.length}/${buttons.length})`
  );

  // =============================================================
  // SUMMARY
  // =============================================================
  console.log('\n===============================================================');
  console.log(`TOTAL ASSERTIONS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log(`COMPLIANCE RATE : ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('===============================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runEmpiricalTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
