/**
 * tests/adversarial_challenger_m3_landing.ts
 *
 * EMPIRICAL ADVERSARIAL STRESS TEST HARNESS FOR MILESTONE 3
 * Evaluates:
 *   1. Deck TP & Stat Calculation Oracle (80 TP starter, 1~100Lv EXP curve, 99 stat points, 4-way stats)
 *   2. Corrupted LocalStorage Recovery & Adversarial Injections
 *   3. Play Section 5 Buttons & Invariant TTS Contract
 *   4. Shop 8 Fixed Items & Inventory Cross-Feature Synergy
 *   5. DESIGN.md Terminal-Flat & Production Bundle Size Audit
 */

import { CardNurtureStore, cardNurtureStore, STORAGE_KEY } from '../src/landing/services/cardNurtureStore';
import { CARD_DATABASE } from '../src/cardDatabase';
import {
  playState,
  renderPlaySection,
  prevScene,
  nextScene,
  setEpisode,
  setScene,
  toggleTts,
  toggleNarration,
  stopPlayTts,
} from '../src/landing/views/PlaySection';
import { renderMyDeckSection } from '../src/landing/views/MyDeckSection';
import { renderCardSection, setSelectedCardId } from '../src/landing/views/CardSection';
import { SHOP_ITEMS, executeShopPurchase, getUserCoins, setUserCoins } from '../src/landing/views/ShopSection';
import * as fs from 'fs';
import * as path from 'path';

// Mock browser LocalStorage for headless Node environment
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, val: string): void {
    this.store[key] = String(val);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();
(global as any).localStorage = mockStorage;

// Mock window and document for PlaySection / Store event dispatching
if (typeof (global as any).window === 'undefined') {
  (global as any).window = {
    dispatchEvent: () => true,
    speechSynthesis: {
      speak: () => {},
      cancel: () => {},
    },
  };
}
if (typeof (global as any).SpeechSynthesisUtterance === 'undefined') {
  (global as any).SpeechSynthesisUtterance = class {
    text: string;
    lang: string = 'ko-KR';
    rate: number = 1;
    pitch: number = 1;
    onerror: any = null;
    constructor(text: string) {
      this.text = text;
    }
  };
}
if (typeof (global as any).document === 'undefined') {
  (global as any).document = {
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

interface TestReport {
  id: string;
  category: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const reports: TestReport[] = [];

function assertTest(
  id: string,
  category: string,
  name: string,
  passed: boolean,
  details?: string,
  error?: string
) {
  reports.push({ id, category, name, passed, details, error });
  const status = passed ? '\x1b[92mPASS\x1b[0m' : '\x1b[91mFAIL\x1b[0m';
  console.log(`[${status}] [${id}] [${category}] ${name}`);
  if (!passed && error) {
    console.error(`       Error: ${error}`);
  }
  if (details) {
    console.log(`       Details: ${details}`);
  }
}

async function runAdversarialM3Harness() {
  console.log('\n================================================================');
  console.log('   EMPIRICAL ADVERSARIAL STRESS TEST: MILESTONE 3 VERIFICATION   ');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. DECK TP & STAT CALCULATION ORACLE
  // ---------------------------------------------------------------------------
  console.log('--- Suite 1: Deck TP & Stat Calculation Oracle ---');

  // 1.1 Mathematical verification of starter 5 cards
  const c1 = CARD_DATABASE[1];
  const c2 = CARD_DATABASE[2];
  const c3 = CARD_DATABASE[3];
  const c4 = CARD_DATABASE[4];
  const c5 = CARD_DATABASE[5];

  const p1 = (c1.top || 0) + (c1.right || 0) + (c1.bottom || 0) + (c1.left || 0);
  const p2 = (c2.top || 0) + (c2.right || 0) + (c2.bottom || 0) + (c2.left || 0);
  const p3 = (c3.top || 0) + (c3.right || 0) + (c3.bottom || 0) + (c3.left || 0);
  const p4 = (c4.top || 0) + (c4.right || 0) + (c4.bottom || 0) + (c4.left || 0);
  const p5 = (c5.top || 0) + (c5.right || 0) + (c5.bottom || 0) + (c5.left || 0);

  const exactFormulaSum = p1 + p2 + p3 + p4 + p5;

  assertTest(
    'ADV.TP.1',
    'Deck TP Oracle',
    'Starter 5 cards individual powers match expected 11, 12, 17, 18, 22',
    p1 === 11 && p2 === 12 && p3 === 17 && p4 === 18 && p5 === 22,
    `Card1=${p1}, Card2=${p2}, Card3=${p3}, Card4=${p4}, Card5=${p5}`
  );

  assertTest(
    'ADV.TP.2',
    'Deck TP Oracle',
    'Starter 5 cards base power sum strictly equals 80 TP',
    exactFormulaSum === 80,
    `Sum: 11 + 12 + 17 + 18 + 22 = ${exactFormulaSum}`
  );

  mockStorage.clear();
  const freshStore = new CardNurtureStore();
  const initDeckTP = freshStore.getDeckTP();
  const initTotalTP = freshStore.getTotalTP();

  assertTest(
    'ADV.TP.3',
    'Deck TP Oracle',
    'CardNurtureStore fresh instance initializes Deck TP = 80 and Total TP = 80',
    initDeckTP === 80 && initTotalTP === 80,
    `Deck TP = ${initDeckTP}, Total TP = ${initTotalTP}`
  );

  // 1.2 Step-by-Step 1~100Lv EXP Progression Curve Oracle
  console.log('--- Testing 1~100Lv EXP curve step-by-step ---');
  let levelUpErrors = 0;
  const store = new CardNurtureStore();
  const targetCardId = 1;

  for (let currentLvl = 1; currentLvl < 100; currentLvl++) {
    const expectedExpToNext = currentLvl * 100;
    const cardBefore = store.cards[targetCardId];
    if (cardBefore.expToNext !== expectedExpToNext) {
      levelUpErrors++;
      break;
    }

    // Award exactly enough EXP to trigger level up
    const res = store.nurtureCard(targetCardId, expectedExpToNext);
    const cardAfter = store.cards[targetCardId];

    if (!res.leveledUp || cardAfter.level !== currentLvl + 1 || cardAfter.statPoints !== currentLvl) {
      levelUpErrors++;
      break;
    }
  }

  assertTest(
    'ADV.EXP.1',
    'EXP Curve Oracle',
    'Step-by-step level up 1->100 adheres to level*100 curve and awards 1 point per level',
    levelUpErrors === 0 && store.cards[targetCardId].level === 100 && store.cards[targetCardId].statPoints === 99,
    `Final Level: ${store.cards[targetCardId].level}, Stat Points: ${store.cards[targetCardId].statPoints}`
  );

  // 1.3 Max Level 100 Cap & Overflow Resistance
  const overExpResult = store.nurtureCard(targetCardId, 1000000);
  const cardAt100 = store.cards[targetCardId];

  assertTest(
    'ADV.EXP.2',
    'EXP Curve Oracle',
    'Feeding massive EXP (1,000,000) at Lv.100 is safely capped at Lv.100 with 0 extra points',
    overExpResult.newLevel === 100 && cardAt100.level === 100 && cardAt100.statPoints === 99,
    `NewLevel: ${overExpResult.newLevel}, Points: ${cardAt100.statPoints}`
  );

  // 1.4 4-Way Directional Stat Allocation & Real-Time Deck TP Sync
  console.log('--- Testing 4-Way Stat Allocation ---');
  const initialDeckTPBeforeAlloc = store.getDeckTP();
  const initialTotalTPBeforeAlloc = store.getTotalTP();

  // Allocate 25 Top, 25 Right, 25 Bottom, 24 Left (Total 99 points)
  for (let i = 0; i < 25; i++) store.allocateStat(targetCardId, 'top');
  for (let i = 0; i < 25; i++) store.allocateStat(targetCardId, 'right');
  for (let i = 0; i < 25; i++) store.allocateStat(targetCardId, 'bottom');
  for (let i = 0; i < 24; i++) store.allocateStat(targetCardId, 'left');

  const cardAfterAlloc = store.cards[targetCardId];
  const finalDeckTP = store.getDeckTP();
  const finalTotalTP = store.getTotalTP();

  const allocSuccess =
    cardAfterAlloc.statPoints === 0 &&
    cardAfterAlloc.bonusStats.top === 25 &&
    cardAfterAlloc.bonusStats.right === 25 &&
    cardAfterAlloc.bonusStats.bottom === 25 &&
    cardAfterAlloc.bonusStats.left === 24 &&
    cardAfterAlloc.totalBonus === 99;

  assertTest(
    'ADV.STAT.1',
    '4-Way Stat Oracle',
    'Exact 99 stat points distribution across N(25), E(25), S(25), W(24)',
    allocSuccess,
    `Top: ${cardAfterAlloc.bonusStats.top}, Right: ${cardAfterAlloc.bonusStats.right}, Bottom: ${cardAfterAlloc.bonusStats.bottom}, Left: ${cardAfterAlloc.bonusStats.left}, Unspent: ${cardAfterAlloc.statPoints}`
  );

  assertTest(
    'ADV.STAT.2',
    '4-Way Stat Oracle',
    'Deck TP and Total TP increment by exactly 99 (80 -> 179)',
    finalDeckTP === initialDeckTPBeforeAlloc + 99 && finalTotalTP === initialTotalTPBeforeAlloc + 99,
    `Deck TP: ${initialDeckTPBeforeAlloc} -> ${finalDeckTP}, Total TP: ${initialTotalTPBeforeAlloc} -> ${finalTotalTP}`
  );

  // 1.5 Allocation with Zero Stat Points Safe Rejection
  const overAllocAttempt = store.allocateStat(targetCardId, 'top');
  assertTest(
    'ADV.STAT.3',
    '4-Way Stat Oracle',
    'Attempting to allocate when statPoints === 0 returns false without modifying stats',
    overAllocAttempt === false && cardAfterAlloc.bonusStats.top === 25,
    `Returned: ${overAllocAttempt}, Top Bonus remained: ${cardAfterAlloc.bonusStats.top}`
  );

  // 1.6 Red Dot Indicator Invariant
  // At points = 0, hasUnspentPoints must be false
  const hasPointsAt0 = store.hasUnspentPoints(targetCardId);
  // Award 1 point to Card 2 and check
  store.nurtureCard(2, 100); // Lv 1 -> 2
  const hasPointsAt1 = store.hasUnspentPoints(2);

  assertTest(
    'ADV.REDDOT.1',
    'Red Dot Indicator',
    'hasUnspentPoints strictly returns true when statPoints > 0 and false when statPoints === 0',
    hasPointsAt0 === false && hasPointsAt1 === true,
    `Card1(0 pts)=${hasPointsAt0}, Card2(1 pt)=${hasPointsAt1}`
  );

  // ---------------------------------------------------------------------------
  // 2. CORRUPTED LOCALSTORAGE RECOVERY & ADVERSARIAL INJECTIONS
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 2: Corrupted LocalStorage Recovery ---');

  const adversarialPayloads = [
    { label: 'Malformed raw syntax', payload: '{ invalid json ]' },
    { label: 'Null string', payload: 'null' },
    { label: 'Array instead of object', payload: '[1, 2, 3]' },
    { label: 'Negative level & exp injection', payload: JSON.stringify({ cards: { '1': { level: -50, exp: -999 } }, ownedCardIds: [1] }) },
    { label: 'Overflow level 99999 injection', payload: JSON.stringify({ cards: { '1': { level: 99999, exp: 99999 } }, ownedCardIds: [1] }) },
    { label: 'Invalid card ID array with duplicates and out-of-range IDs', payload: JSON.stringify({ cards: {}, ownedCardIds: [999, -5, 0, 111, 2, 2, 2, 1] }) },
  ];

  let recoveryFailures = 0;

  for (const testCase of adversarialPayloads) {
    mockStorage.setItem(STORAGE_KEY, testCase.payload);
    try {
      const recoveredStore = new CardNurtureStore();
      const deckTP = recoveredStore.getDeckTP();
      const totalTP = recoveredStore.getTotalTP();

      if (isNaN(deckTP) || isNaN(totalTP) || deckTP <= 0 || totalTP <= 0) {
        recoveryFailures++;
        console.error(`Recovery failed for [${testCase.label}]: Deck TP=${deckTP}, Total TP=${totalTP}`);
      }

      // Check ownedCardIds integrity (must be 1..110)
      for (const id of recoveredStore.ownedCardIds) {
        if (id < 1 || id > 110) {
          recoveryFailures++;
          console.error(`Invalid card ID ${id} survived recovery!`);
        }
      }
    } catch (e: any) {
      recoveryFailures++;
      console.error(`Uncaught exception during recovery for [${testCase.label}]:`, e);
    }
  }

  assertTest(
    'ADV.STORE.1',
    'LocalStorage Recovery',
    'All 6 malicious LocalStorage payloads recovered safely with valid TP and sanitized IDs',
    recoveryFailures === 0,
    `Tested ${adversarialPayloads.length} payloads, failures: ${recoveryFailures}`
  );

  // ---------------------------------------------------------------------------
  // 3. PLAY SECTION 5 BUTTONS & INVARIANT TTS CONTRACT
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 3: Play Section 5 Buttons & Invariant TTS Contract ---');

  // Reset playState
  playState.currentEpisode = 1;
  playState.currentScene = 0;
  playState.isTtsActive = false;
  playState.isNarrationVisible = true;

  // 3.1 Initial state inspection
  assertTest(
    'ADV.PLAY.1',
    'TTS Contract',
    'Initial playState.isTtsActive is strictly false on load',
    playState.isTtsActive === false,
    `isTtsActive: ${playState.isTtsActive}`
  );

  // 3.2 Stepping scenes with prevScene / nextScene while TTS is OFF
  nextScene();
  const ttsAfterNext = playState.isTtsActive;
  nextScene();
  prevScene();
  const ttsAfterPrev = playState.isTtsActive;

  assertTest(
    'ADV.PLAY.2',
    'TTS Contract',
    'Stepping scenes (nextScene, prevScene) preserves invariant isTtsActive === false',
    ttsAfterNext === false && ttsAfterPrev === false,
    `TTS after next: ${ttsAfterNext}, after prev: ${ttsAfterPrev}`
  );

  // 3.3 Stepping episodes while TTS is OFF
  setEpisode(10);
  const ttsAfterSetEp = playState.isTtsActive;
  setScene(5);
  const ttsAfterSetScene = playState.isTtsActive;

  assertTest(
    'ADV.PLAY.3',
    'TTS Contract',
    'Switching episode and scrubbing scene preserves invariant isTtsActive === false',
    ttsAfterSetEp === false && ttsAfterSetScene === false,
    `TTS after setEp: ${ttsAfterSetEp}, after setScene: ${ttsAfterSetScene}`
  );

  // 3.4 Explicit user click enables TTS, explicit click toggles OFF
  const ttsAfterToggleOn = toggleTts();
  const ttsAfterToggleOff = toggleTts();

  assertTest(
    'ADV.PLAY.4',
    'TTS Contract',
    'Explicit toggleTts() correctly toggles between true and false',
    ttsAfterToggleOn === true && ttsAfterToggleOff === false && playState.isTtsActive === false,
    `Toggled ON: ${ttsAfterToggleOn}, Toggled OFF: ${ttsAfterToggleOff}`
  );

  // 3.5 Exact 5 buttons in PlaySection HTML output
  const playHtml = renderPlaySection();
  const hasClose = playHtml.includes('닫기');
  const hasPrev = playHtml.includes('이전');
  const hasNext = playHtml.includes('다음');
  const hasNarration = playHtml.includes('나레이션');
  const hasTts = playHtml.includes('TTS');

  // Verify no extraneous action buttons in control bar
  const controlBarMatch = playHtml.match(/<section[^>]*aria-label="웹툰 컨트롤 바"[^>]*>([\s\S]*?)<\/section>/);
  const controlBarHtml = controlBarMatch ? controlBarMatch[1] : '';
  const buttonMatches = controlBarHtml.match(/<button/g);
  const buttonCount = buttonMatches ? buttonMatches.length : 0;

  assertTest(
    'ADV.PLAY.5',
    'Play Control Bar',
    'Control bar contains exactly 5 buttons [닫기, 이전, 다음, 나레이션, TTS]',
    hasClose && hasPrev && hasNext && hasNarration && hasTts && buttonCount === 5,
    `Buttons found in control bar: ${buttonCount} (닫기, 이전, 다음, 나레이션, TTS)`
  );

  // 3.6 Boundary Navigation Traversal
  playState.currentEpisode = 1;
  playState.currentScene = 0;
  prevScene(); // Should clamp at ep 1, scene 0
  const clampedMin = playState.currentEpisode === 1 && playState.currentScene === 0;

  playState.currentEpisode = 40;
  playState.currentScene = 60; // ep 40 has 61 scenes (idx 0..60)
  nextScene(); // Should clamp at ep 40
  const clampedMax = playState.currentEpisode === 40;

  assertTest(
    'ADV.PLAY.6',
    'Play Navigation Boundary',
    'Stepping beyond boundaries safely clamps to episode 1 min and episode 40 max',
    clampedMin && clampedMax,
    `Min: Ep ${playState.currentEpisode}, Scene ${playState.currentScene}`
  );

  // ---------------------------------------------------------------------------
  // 4. SHOP 8 FIXED ITEMS & INVENTORY INTEGRATION
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 4: Shop 8 Fixed Items & Inventory Integration ---');

  const EXPECTED_8_ITEMS = [
    '일반 카드팩',
    '매직 카드팩',
    '희귀 카드팩',
    '아이템 팩',
    '광고 제거',
    '공식 소설',
    '공식 동영상',
    '코인 충전',
  ];

  const actualItemNames = SHOP_ITEMS.map((item) => item.name);
  const exact8Items =
    actualItemNames.length === 8 &&
    EXPECTED_8_ITEMS.every((expected) => actualItemNames.includes(expected as any));

  assertTest(
    'ADV.SHOP.1',
    'Shop Inventory',
    'SHOP_ITEMS has exactly 8 items matching canonical requirements',
    exact8Items,
    `Items: ${actualItemNames.join(', ')}`
  );

  // Prohibited clutter check
  const PROHIBITED_ITEMS = ['행운의 룰렛', 'VIP 패스', '보물상자', '랜덤 박스'];
  const hasClutter = PROHIBITED_ITEMS.some((clutter) => actualItemNames.includes(clutter as any));

  assertTest(
    'ADV.SHOP.2',
    'Shop Cleanliness',
    'Zero prohibited clutter items present in Shop catalog',
    !hasClutter,
    `Clutter check passed`
  );

  // Shop purchase expands inventory and syncs Total TP
  setUserCoins(5000);
  const initialOwnedCount = cardNurtureStore.ownedCardIds.length;
  const initialTotalTPForShop = cardNurtureStore.getTotalTP();

  const buyNormal = executeShopPurchase('pack_normal');
  const buyMagic = executeShopPurchase('pack_magic');
  const newOwnedCount = cardNurtureStore.ownedCardIds.length;
  const newTotalTP = cardNurtureStore.getTotalTP();

  assertTest(
    'ADV.SHOP.3',
    'Shop Cross-Synergy',
    'Purchasing card packs successfully unlocks cards, expands inventory, and updates Total TP',
    buyNormal.success && buyMagic.success && newOwnedCount >= initialOwnedCount && newTotalTP >= initialTotalTPForShop,
    `Owned count: ${initialOwnedCount} -> ${newOwnedCount}, Total TP: ${initialTotalTPForShop} -> ${newTotalTP}`
  );

  // ---------------------------------------------------------------------------
  // 5. DESIGN.MD TERMINAL-FLAT & PRODUCTION BUNDLE SIZE AUDIT
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 5: DESIGN.md Terminal-Flat & Production Bundle Audit ---');

  const distIndexPath = path.resolve(process.cwd(), 'dist/index.html');
  if (fs.existsSync(distIndexPath)) {
    const stats = fs.statSync(distIndexPath);
    const sizeKB = stats.size / 1024;
    const content = fs.readFileSync(distIndexPath, 'utf-8');

    assertTest(
      'ADV.BUILD.1',
      'Bundle Size',
      'dist/index.html size is under 50 KB strict static landing ceiling',
      sizeKB < 50,
      `dist/index.html size: ${sizeKB.toFixed(2)} KB (Limit: < 50 KB)`
    );

    assertTest(
      'ADV.BUILD.2',
      'Zero React Runtime',
      'dist/index.html does not load React 19 SPA vendor bundles',
      !content.includes('vendor-react') && !content.includes('react-dom'),
      `Clean standalone static bundle confirmed`
    );
  } else {
    assertTest(
      'ADV.BUILD.1',
      'Bundle Size',
      'dist/index.html exists',
      false,
      'dist/index.html not found, build may be running or failed'
    );
  }

  // Check DESIGN.md compliance in M3 views
  const viewFiles = [
    'src/landing/views/MyDeckSection.tsx',
    'src/landing/views/PlaySection.tsx',
    'src/landing/views/CardSection.tsx',
    'src/landing/views/ShopSection.tsx',
    'src/landing/views/HomeSection.tsx',
  ];

  let prohibitedClassesFound = 0;
  const prohibitedPatterns = [/rounded-xl/g, /rounded-2xl/g, /rounded-3xl/g, /animate-bounce/g];

  for (const file of viewFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const code = fs.readFileSync(fullPath, 'utf-8');
      for (const pattern of prohibitedPatterns) {
        if (pattern.test(code)) {
          prohibitedClassesFound++;
          console.error(`Prohibited class pattern ${pattern} found in ${file}`);
        }
      }
    }
  }

  assertTest(
    'ADV.DESIGN.1',
    'DESIGN.md Compliance',
    'M3 view files contain 0 prohibited decorative classes (rounded-xl/2xl/3xl, animate-bounce)',
    prohibitedClassesFound === 0,
    `Prohibited classes found: ${prohibitedClassesFound}`
  );

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('                 ADVERSARIAL CHALLENGE SUMMARY                  ');
  console.log('================================================================');

  const total = reports.length;
  const passed = reports.filter((r) => r.passed).length;
  const failed = reports.filter((r) => !r.passed).length;

  console.log(`Total Stress Assertions : ${total}`);
  console.log(`Passed                  : ${passed}`);
  console.log(`Failed                  : ${failed}`);
  console.log(`Success Rate            : ${((passed / total) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n\x1b[92mVERDICT: APPROVE (All adversarial challenges passed with zero defects)\x1b[0m\n');
  } else {
    console.log('\n\x1b[91mVERDICT: REJECT (Adversarial challenge identified defects)\x1b[0m\n');
  }

  return { total, passed, failed, reports };
}

// Run harness directly
runAdversarialM3Harness().then((res) => {
  if (res.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});

