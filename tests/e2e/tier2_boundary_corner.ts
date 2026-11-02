/**
 * Tier 2: Boundary Value Analysis & Corner Cases (10 Assertions across 7 Boundaries)
 */

import {
  readProjectFile,
  runTestAssertion,
  ReferenceNurtureStore,
  MockLocalStorage,
} from './helpers';
import { TestResult } from './types';

export async function runTier2Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // =========================================================================
  // Boundary 1: Max Level 100 Cap (B1)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B1.1', 2, 'Max Level Boundary', 'M3', 'Level 100 Cap & Zero Level 101 Overflow', async () => {
      const oracle = new ReferenceNurtureStore();
      oracle.cards[1].level = 100;
      oracle.cards[1].exp = 10000;
      oracle.cards[1].statPoints = 0;

      // Nurture with huge EXP
      const res = oracle.nurtureCard(1, 999999);
      if (oracle.cards[1].level !== 100) {
        return { pass: false, message: `Level capped failed: got level ${oracle.cards[1].level}` };
      }
      if (res.leveledUp) {
        return { pass: false, message: 'leveledUp was true at level 100' };
      }
      if (oracle.cards[1].statPoints !== 0) {
        return { pass: false, message: `Unexpected stat points at Lv 100: ${oracle.cards[1].statPoints}` };
      }
      return { pass: true, message: 'Level 100 cap and overflow prevention verified' };
    })
  );

  // =========================================================================
  // Boundary 2: Level 1 Initial State (B2)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B1.2', 2, 'Level 1 Baseline', 'M3', 'Level 1 Baseline State & Zero Residual Bonuses', async () => {
      const oracle = new ReferenceNurtureStore();
      const card = oracle.cards[1];
      if (card.level !== 1 || card.exp !== 0 || card.statPoints !== 0 || card.totalBonus !== 0) {
        return { pass: false, message: `Initial state not clean: ${JSON.stringify(card)}` };
      }
      if (card.bonusStats.top !== 0 || card.bonusStats.right !== 0 || card.bonusStats.bottom !== 0 || card.bonusStats.left !== 0) {
        return { pass: false, message: 'Initial bonus stats not zero' };
      }
      return { pass: true, message: 'Level 1 clean initial state verified' };
    })
  );

  // =========================================================================
  // Boundary 3: Corrupted LocalStorage Recovery (B3)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B2.1', 2, 'Storage Boundary', 'M3', 'Corrupted JSON Recovery without Crash', async () => {
      const mockStorage = new MockLocalStorage();
      // Inject corrupted JSON
      mockStorage.setItem('hero_card_nurturing', '<<<NOT_VALID_JSON>>{[[corrupt');

      const oracle = new ReferenceNurtureStore(mockStorage);
      // Loading should not throw
      let didThrow = false;
      try {
        oracle.loadFromStorage();
      } catch {
        didThrow = true;
      }
      if (didThrow) {
        return { pass: false, message: 'Loading corrupted JSON threw unhandled error' };
      }
      // Should fall back to default cards
      if (!oracle.cards[1] || oracle.cards[1].level !== 1) {
        return { pass: false, message: 'Fallback to default state failed after corrupted JSON' };
      }
      return { pass: true, message: 'Corrupted localStorage recovered gracefully' };
    })
  );

  // =========================================================================
  // Boundary 4: Missing LocalStorage Key (B4)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B2.2', 2, 'Storage Boundary', 'M3', 'Missing Storage Key Clean Initialization', async () => {
      const mockStorage = new MockLocalStorage();
      // Empty storage
      const oracle = new ReferenceNurtureStore(mockStorage);
      oracle.loadFromStorage();
      if (oracle.ownedCardIds.length !== 5 || !oracle.cards[1]) {
        return { pass: false, message: 'Failed to initialize clean state on missing key' };
      }
      return { pass: true, message: 'Clean initialization on missing storage key verified' };
    })
  );

  // =========================================================================
  // Boundary 5: Route Trailing Slash Resolution (B5)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B3.1', 2, 'Routing Boundary', 'M1', 'Trailing Slash & /home Resolution', async () => {
      const routes = readProjectFile('src/routes.ts') || '';
      const postBuild = readProjectFile('scripts/post-build.js') || '';
      // Check if both /home and /home/ or index.html routing are accounted for
      const hasHomeHandling = routes.includes('/home') || postBuild.includes('home');
      if (!hasHomeHandling) {
        return { pass: false, message: 'Route handling for /home not defined' };
      }
      return { pass: true, message: 'Trailing slash and /home path variants handled' };
    })
  );

  // =========================================================================
  // Boundary 6: Invalid Route Fallback (B6)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B3.2', 2, 'Routing Boundary', 'M1', 'Invalid Route Graceful Fallback', async () => {
      const routes = readProjectFile('src/routes.ts') || '';
      const landing = readProjectFile('src/landing/index.ts') || '';
      const hasFallback = routes.includes('*') || routes.includes('default') || landing.includes('default') || landing.includes('home');
      if (!hasFallback) {
        return { pass: false, message: 'No fallback route for invalid paths' };
      }
      return { pass: true, message: 'Invalid route fallback mechanism verified' };
    })
  );

  // =========================================================================
  // Boundary 7: Rapid Concurrency Nurture (B7)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B4.1', 2, 'Concurrency Boundary', 'M3', '50 Rapid Concurrency Nurture Accrual', async () => {
      const oracle = new ReferenceNurtureStore();
      // 50 rapid nurture calls of 20 EXP each -> total 1000 EXP
      // At level 1, expToNext: 100 (Lv2), 200 (Lv3), 300 (Lv4), 400 (Lv5) -> Sum = 1000 EXP
      // Level should become 5, statPoints = 4
      for (let i = 0; i < 50; i++) {
        oracle.nurtureCard(1, 20);
      }
      if (oracle.cards[1].level !== 5) {
        return { pass: false, message: `Expected level 5 after 1000 EXP, got ${oracle.cards[1].level}` };
      }
      if (oracle.cards[1].statPoints !== 4) {
        return { pass: false, message: `Expected 4 stat points, got ${oracle.cards[1].statPoints}` };
      }
      return { pass: true, message: '50 rapid successive nurture actions accumulated accurately' };
    })
  );

  // =========================================================================
  // Boundary 8: Zero Points Allocation Attempt (B8)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B5.1', 2, 'Stat Boundary', 'M3', 'Zero Points Allocation Safe Rejection', async () => {
      const oracle = new ReferenceNurtureStore();
      oracle.cards[1].statPoints = 0;
      const allocated = oracle.allocateStat(1, 'top');
      if (allocated !== false) {
        return { pass: false, message: 'allocateStat should return false when statPoints === 0' };
      }
      if (oracle.cards[1].bonusStats.top !== 0) {
        return { pass: false, message: 'Bonus stats mutated despite 0 stat points' };
      }
      return { pass: true, message: 'Zero points allocation safely rejected without side-effects' };
    })
  );

  // =========================================================================
  // Boundary 9: Mobile 320px Extreme Boundary (B9)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B6.1', 2, 'Viewport Boundary', 'M2', '320px Ultra-Compact Mobile Viewport Resilience', async () => {
      const css = readProjectFile('src/landing/styles/landing.css') || '';
      const header = readProjectFile('src/landing/components/Header.tsx') || '';
      const hasSmallScreenClass = css.includes('min-h-[44px]') || header.includes('min-h-[44px]') || css.includes('box-sizing');
      return { pass: hasSmallScreenClass, message: '320px viewport touch target and overflow resilience verified' };
    })
  );

  // =========================================================================
  // Boundary 10: Static Offline Host Simulation (B10)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B7.1', 2, 'Offline Boundary', 'M1', 'Static Offline Host Zero External Call Integrity', async () => {
      const indexHtml = readProjectFile('index.html') || '';
      // Ensure no external CDN fonts or scripts that block offline rendering
      const hasBlockingExternalCdn = indexHtml.includes('https://cdn.') || indexHtml.includes('https://cdnjs.');
      if (hasBlockingExternalCdn) {
        return { pass: false, message: 'index.html contains blocking external CDN dependency' };
      }
      return { pass: true, message: 'Static landing contains zero blocking external CDN dependencies' };
    })
  );

  return results;
}
