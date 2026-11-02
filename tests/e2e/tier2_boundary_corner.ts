/**
 * Tier 2: Boundary Value Analysis & Corner Cases (12 Assertions across Core Boundaries)
 *
 * Mapped to PROJECT.md Features and Milestones M1..M6.
 * Direct Production Integration: Zero Test Doubles.
 */

import {
  runTestAssertion,
  MockLocalStorage,
  setupTestEnvironment,
} from './helpers';
import { TestResult } from './types';

// Genuine Production Deliverable Imports
import { normalizeHashRoute } from '../../src/landing/services/hashRouter';
import { IdleAutoPlayManager } from '../../src/landing/services/idleAutoPlayManager';
import { CardNurtureStore } from '../../src/landing/services/cardNurtureStore';
import {
  executeShopPurchase,
  exchangeGoldForSns,
  getUserCoins,
  setUserCoins,
  getUserGold,
  setUserGold,
} from '../../src/landing/views/ShopSection';
import { getAdPlacements } from '../../src/landing/services/adsenseManager';

export async function runTier2Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // =========================================================================
  // Boundary 1: Max Level 100 Cap (B1)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B1.1', 2, 'Max Level Boundary', 'M4', 'Level 100 Cap & Zero Level 101 Overflow', async () => {
      setupTestEnvironment();
      const oracle = new CardNurtureStore();
      oracle.cards[1].level = 100;
      oracle.cards[1].exp = 10000;
      oracle.cards[1].statPoints = 0;

      // Attempt to nurture with massive EXP
      const res = oracle.nurtureCard(1, 999999);
      if (oracle.cards[1].level !== 100) {
        return { pass: false, message: `Level cap failed: reached level ${oracle.cards[1].level}` };
      }
      if (res.leveledUp) {
        return { pass: false, message: 'leveledUp was true at level 100 cap' };
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
    await runTestAssertion('T2.B1.2', 2, 'Level 1 Baseline', 'M4', 'Level 1 Baseline State & Zero Residual Bonuses', async () => {
      setupTestEnvironment();
      const oracle = new CardNurtureStore();
      const card = oracle.cards[1];
      if (card.level !== 1 || card.exp !== 0 || card.statPoints !== 0 || card.totalBonus !== 0) {
        return { pass: false, message: `Initial state not clean: ${JSON.stringify(card)}` };
      }
      if (card.bonusStats.top !== 0 || card.bonusStats.right !== 0 || card.bonusStats.bottom !== 0 || card.bonusStats.left !== 0) {
        return { pass: false, message: 'Initial bonus stats not zero' };
      }
      return { pass: true, message: 'Level 1 clean baseline initial state verified' };
    })
  );

  // =========================================================================
  // Boundary 3: Owned-Only Gating Boundary (B3)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B2.1', 2, 'Owned Gating Boundary', 'M4', 'Unowned Card Nurturing Rejection & Zero EXP Leakage', async () => {
      setupTestEnvironment();
      const oracle = new CardNurtureStore();
      // Card 110 is unowned
      const unownedId = 110;
      if (oracle.isCardOwned(unownedId)) {
        return { pass: false, message: `Card ${unownedId} should be unowned initially` };
      }

      const res = oracle.nurtureCard(unownedId, 5000);
      if (res.expGained > 0 || res.leveledUp) {
        return { pass: false, message: 'Unowned card received EXP or leveled up' };
      }
      if (oracle.cards[unownedId].level !== 1) {
        return { pass: false, message: 'Unowned card level was modified' };
      }

      return { pass: true, message: 'Unowned card nurture attempt strictly rejected with 0 EXP leakage' };
    })
  );

  // =========================================================================
  // Boundary 4: Idle Auto-Play 14,999ms vs 15,000ms Boundary (B4)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B3.1', 2, 'Idle Timer Boundary', 'M1', 'Exact 14,999ms vs 15,000ms Inactivity Transition Boundary', async () => {
      const mockStorage = setupTestEnvironment();
      const idleManager = new IdleAutoPlayManager({ timeoutMs: 15000 });

      // Advance to 14,999ms
      const subThreshold = idleManager.tick(14999);
      if (subThreshold.redirected) {
        return { pass: false, message: 'Idle auto-play triggered at 14,999ms (before 15,000ms threshold)' };
      }
      if (idleManager.isTriggered()) {
        return { pass: false, message: 'Boundary violation: isTriggered true at 14,999ms' };
      }
      if (mockStorage.getItem('hero_kadan_rpg_auto_mode') === 'true') {
        return { pass: false, message: 'Auto mode flag set prematurely before 15,000ms' };
      }

      // Advance remaining 1ms to hit exactly 15,000ms
      const exactThreshold = idleManager.tick(1);
      if (!exactThreshold.redirected) {
        return { pass: false, message: 'Idle auto-play failed to trigger at exactly 15,000ms' };
      }
      if (!idleManager.isTriggered()) {
        return { pass: false, message: 'Boundary violation: isTriggered false at 15,000ms' };
      }
      if (mockStorage.getItem('hero_kadan_rpg_auto_mode') !== 'true') {
        return { pass: false, message: 'Auto mode flag not set at 15,000ms threshold' };
      }

      return { pass: true, message: 'Exact 14,999ms vs 15,000ms boundary distinction verified' };
    })
  );

  // =========================================================================
  // Boundary 5: Idle Interaction Reset at Last Millisecond (B5)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B3.2', 2, 'Idle Timer Boundary', 'M1', 'Last-Second User Activity Resets Idle Countdown Safely', async () => {
      const mockStorage = setupTestEnvironment();
      const idleManager = new IdleAutoPlayManager({ timeoutMs: 15000 });

      // Advance to 14,900ms (100ms before timeout)
      idleManager.tick(14900);

      // User performs touch gesture
      idleManager.handleUserInteraction();

      if (idleManager.getIdleTime() !== 0) {
        return { pass: false, message: 'handleUserInteraction did not reset idle timer to 0' };
      }

      // Advance another 5,000ms (total elapsed 19,900ms, but reset occurred at 14,900ms)
      const res = idleManager.tick(5000);
      if (res.redirected) {
        return { pass: false, message: 'Idle auto-play triggered despite user activity reset' };
      }
      if (idleManager.getIdleTime() !== 5000) {
        return { pass: false, message: `Expected idle time 5,000ms post-reset, got ${idleManager.getIdleTime()}` };
      }
      if (idleManager.isTriggered()) {
        return { pass: false, message: 'Premature trigger after interaction reset' };
      }

      return { pass: true, message: 'Last-second user interaction resets timer and cancels auto-redirect' };
    })
  );

  // =========================================================================
  // Boundary 6: Shop Currency Underflow & Insufficient Funds (B6)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B4.1', 2, 'Shop Currency Boundary', 'M5', 'Insufficient Balance Pack Purchase Safe Rejection', async () => {
      setupTestEnvironment();
      // Set SNS balance to 100 (less than 300 normal pack cost)
      setUserCoins(100);

      const purchase = executeShopPurchase('pack_normal');
      if (purchase.success) {
        return { pass: false, message: 'Purchase succeeded with insufficient balance' };
      }
      if (purchase.revealedCards && purchase.revealedCards.length > 0) {
        return { pass: false, message: 'Cards revealed despite failed purchase' };
      }

      // Balance must remain untouched at 100
      const currentSns = getUserCoins();
      if (currentSns !== 100) {
        return { pass: false, message: `Balance mutated upon failed purchase: ${currentSns}` };
      }

      return { pass: true, message: 'Insufficient currency pack purchase rejected with balance preservation' };
    })
  );

  // =========================================================================
  // Boundary 7: Non-Free Gold Exchange Zero & Insufficient Balance (B7)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B4.2', 2, 'Shop Currency Boundary', 'M5', 'Invalid or Insufficient Gold Exchange Safe Rejection', async () => {
      setupTestEnvironment();
      setUserGold(2000); // Less than standard 5000 exchange
      setUserCoins(500);

      // Attempt 1: Exchanging 0 gold
      const zeroRes = exchangeGoldForSns(0);
      if (zeroRes.success) {
        return { pass: false, message: 'Zero gold exchange allowed' };
      }

      // Attempt 2: Exchanging 5000 gold with only 2000 available
      const overRes = exchangeGoldForSns(5000);
      if (overRes.success) {
        return { pass: false, message: 'Exchange succeeded despite insufficient gold balance' };
      }

      // Balances preserved
      if (getUserGold() !== 2000 || getUserCoins() !== 500) {
        return { pass: false, message: 'Balances mutated on invalid gold exchange' };
      }

      return { pass: true, message: 'Zero and insufficient gold exchange attempts safely rejected' };
    })
  );

  // =========================================================================
  // Boundary 8: AdSense Viewport Breakpoint 1023px vs 1024px (B8)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B5.1', 2, 'AdSense Breakpoint Boundary', 'M5', '1023px Mobile Banner vs 1024px Desktop Gutters Breakpoint', async () => {
      setupTestEnvironment();

      // 1023px: Just below desktop breakpoint -> Mobile Top Banner active, Gutters inactive
      const at1023 = getAdPlacements(1023);
      if (!at1023.mobileTop || at1023.desktopLeft || at1023.desktopRight) {
        return { pass: false, message: `1023px breakpoint mismatch: ${JSON.stringify(at1023)}` };
      }

      // 1024px: Exact desktop breakpoint -> Desktop Gutters active, Mobile Top Banner inactive
      const at1024 = getAdPlacements(1024);
      if (at1024.mobileTop || !at1024.desktopLeft || !at1024.desktopRight) {
        return { pass: false, message: `1024px breakpoint mismatch: ${JSON.stringify(at1024)}` };
      }

      return { pass: true, message: 'Exact 1023px vs 1024px responsive AdSense breakpoint verified' };
    })
  );

  // =========================================================================
  // Boundary 9: VIP Ad Removal Across All Viewports (B9)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B5.2', 2, 'AdSense VIP Boundary', 'M5', 'VIP Ad-Removal Guard Full Screen Width Coverage (320px..3840px)', async () => {
      const mockStorage = setupTestEnvironment();
      mockStorage.setItem('hero_ad_removed', 'true');

      const testWidths = [320, 375, 768, 1023, 1024, 1440, 1920, 2560, 3840];
      for (const w of testWidths) {
        const placement = getAdPlacements(w);
        if (placement.desktopLeft || placement.desktopRight || placement.mobileTop) {
          return { pass: false, message: `Ad unit leaked at viewport width ${w}px despite VIP removal` };
        }
        if (!placement.suppressedByVip) {
          return { pass: false, message: `suppressedByVip not set at ${w}px` };
        }
      }

      return { pass: true, message: 'VIP ad-removal completely suppresses all ads across all screen widths' };
    })
  );

  // =========================================================================
  // Boundary 10: Unknown Hash Route Fallback to #home (B10)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B6.1', 2, 'Hash Route Fallback', 'M1', 'Malformed or Unknown Hash Route Fallback to #home', async () => {
      const invalidRoutes = ['', '#', '#random_invalid_view', '#unknown/path', '#404'];

      for (const invalid of invalidRoutes) {
        const resolved = normalizeHashRoute(invalid);
        if (resolved !== '#home') {
          return { pass: false, message: `Route '${invalid}' should normalize to #home, got '${resolved}'` };
        }
      }
      return { pass: true, message: 'Malformed and unknown hash routes safely normalize to #home' };
    })
  );

  // =========================================================================
  // Boundary 11: LocalStorage Corrupted JSON Recovery (B11)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B7.1', 2, 'Storage Boundary', 'M4', 'Corrupted hero_card_nurturing JSON Fallback without Crash', async () => {
      const mockStorage = setupTestEnvironment();
      mockStorage.setItem('hero_card_nurturing', 'INVALID_JSON_CORRUPTED_{{{{');

      const oracle = new CardNurtureStore();
      let didThrow = false;
      try {
        oracle.loadFromStorage();
      } catch {
        didThrow = true;
      }

      if (didThrow) {
        return { pass: false, message: 'Loading corrupted JSON threw unhandled error' };
      }
      if (!oracle.cards[1] || oracle.cards[1].level !== 1) {
        return { pass: false, message: 'Fallback to default cards failed after JSON corruption' };
      }
      return { pass: true, message: 'Corrupted localStorage JSON gracefully recovered with default state' };
    })
  );

  // =========================================================================
  // Boundary 12: Zero Stat Points Allocation Attempt (B12)
  // =========================================================================
  results.push(
    await runTestAssertion('T2.B7.2', 2, 'Stat Point Boundary', 'M4', 'Zero Stat Points Allocation Safe Rejection', async () => {
      setupTestEnvironment();
      const oracle = new CardNurtureStore();
      // Fresh Card 1 has 0 stat points
      const card = oracle.cards[1];
      if (card.statPoints !== 0) {
        return { pass: false, message: 'Card 1 should start with 0 stat points' };
      }

      const allocated = oracle.allocateStat(1, 'top');
      if (allocated) {
        return { pass: false, message: 'allocateStat returned true with 0 stat points available' };
      }
      if (card.bonusStats.top !== 0 || card.totalBonus !== 0) {
        return { pass: false, message: 'Bonus stats incremented without available stat points' };
      }

      return { pass: true, message: 'Stat allocation with 0 points safely rejected without mutation' };
    })
  );

  return results;
}
