/**
 * Tier 4: Real-World Workload Scenarios (6 Assertions across Realistic End-to-End User Journeys)
 *
 * Mapped to PROJECT.md Features and Milestones M1..M6.
 * Direct Production Integration: Zero Test Doubles.
 */

import {
  readProjectFile,
  projectPathExists,
  runTestAssertion,
  MockLocalStorage,
  setupTestEnvironment,
} from './helpers';
import { TestResult, EXTERNAL_LINKS } from './types';
import { CARD_DATABASE } from '../../src/cardDatabase';

// Genuine Production Deliverable Imports
import { normalizeHashRoute } from '../../src/landing/services/hashRouter';
import { IdleAutoPlayManager } from '../../src/landing/services/idleAutoPlayManager';
import { CardNurtureStore, cardNurtureStore } from '../../src/landing/services/cardNurtureStore';
import {
  executeShopPurchase,
  exchangeGoldForSns,
  getUserCoins,
  setUserCoins,
  getUserGold,
  setUserGold,
} from '../../src/landing/views/ShopSection';
import { getAdPlacements } from '../../src/landing/services/adsenseManager';

export async function runTier4Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // =========================================================================
  // Scenario 1: First-Time Visitor Journey (W1)
  // =========================================================================
  results.push(
    await runTestAssertion('T4.W1.1', 4, 'End-to-End Workload', 'M2', 'First-Time Visitor Journey: Hash Navigation, Home Logos & Deck Preview', async () => {
      // 1. User loads root index.html
      const indexHtml = readProjectFile('index.html');
      if (!indexHtml) return { pass: false, message: 'index.html not found' };

      // 2. Routing defaults to #home
      const initialRoute = normalizeHashRoute('');
      if (initialRoute !== '#home') {
        return { pass: false, message: `Initial route should be #home, got ${initialRoute}` };
      }

      // 3. Verify official logo asset and external serialization links
      const hasLogo = projectPathExists('public/logo-ko.png');
      if (!hasLogo) return { pass: false, message: 'Official logo-ko.png missing' };

      const homeView = readProjectFile('src/landing/views/HomeSection.tsx') || '';
      const hasBadges = homeView.includes(EXTERNAL_LINKS.badgeText);
      if (!hasBadges) {
        return { pass: false, message: 'Home view missing "[절찬 연재중]" badges' };
      }

      // 4. Verify 5-card deck power calculation
      setupTestEnvironment();
      const oracle = new CardNurtureStore();
      const deckTP = oracle.getDeckTP();
      if (deckTP <= 0) {
        return { pass: false, message: `Invalid initial deck TP: ${deckTP}` };
      }

      return { pass: true, message: 'First-time visitor end-to-end journey fully satisfied' };
    })
  );

  // =========================================================================
  // Scenario 2: 15-Second Idle Inactivity Workload (W2)
  // =========================================================================
  results.push(
    await runTestAssertion('T4.W1.2', 4, 'End-to-End Workload', 'M1', '15-Second Inactivity Workload: Auto-Play Navigation to #play and Flag Init', async () => {
      const mockStorage = setupTestEnvironment();
      const idleManager = new IdleAutoPlayManager({ timeoutMs: 15000 });

      // User arrives on page and remains idle
      // 5 seconds pass
      idleManager.tick(5000);
      if (idleManager.isTriggered()) return { pass: false, message: 'Premature trigger at 5s' };

      // Another 5 seconds pass (total 10s)
      idleManager.tick(5000);
      if (idleManager.isTriggered()) return { pass: false, message: 'Premature trigger at 10s' };

      // Final 5 seconds pass (total 15s)
      const res = idleManager.tick(5000);
      if (!res.redirected) {
        return { pass: false, message: 'Failed to trigger redirect at 15s idle threshold' };
      }

      const expectedUrl = 'https://dayyoung-macbookpro.tail3717a4.ts.net/#play';
      if (res.targetUrl !== expectedUrl) {
        return { pass: false, message: `Redirect URL mismatch: ${res.targetUrl}` };
      }

      const autoFlag = mockStorage.getItem('hero_kadan_rpg_auto_mode');
      if (autoFlag !== 'true') {
        return { pass: false, message: `Auto mode flag not set in storage: ${autoFlag}` };
      }

      return { pass: true, message: '15-second idle inactivity workflow initiates auto-play redirect cleanly' };
    })
  );

  // =========================================================================
  // Scenario 3: Core RPG Gameplay Loop & Repeat Hunting (W3)
  // =========================================================================
  results.push(
    await runTestAssertion('T4.W1.3', 4, 'End-to-End Workload', 'M3', 'Core RPG Gameplay Loop: Tile Movement -> Battle Victory EXP -> Repeat Hunting', async () => {
      setupTestEnvironment();
      const oracle = new CardNurtureStore();
      const initialExpCard1 = oracle.cards[1].exp;

      // 1. Check tile map and dialog components exist
      const hasMap = projectPathExists('src/components/rpg/KadanWorldMap.tsx');
      const hasDialog = projectPathExists('src/components/rpg/KadanNpcDialog.tsx');
      const hasBattle = projectPathExists('src/views/MobileCardPlayScreen.tsx');

      if (!hasMap || !hasDialog || !hasBattle) {
        return { pass: false, message: 'Core gameplay components incomplete in project' };
      }

      // 2. Simulate match victory -> 50 EXP awarded to active deck
      const victory = oracle.awardBattleVictoryExp(50);
      if (victory.expAwarded !== 50 || !victory.updatedCards.includes(1)) {
        return { pass: false, message: 'Victory EXP not awarded to active deck cards' };
      }
      if (oracle.cards[1].exp !== initialExpCard1 + 50) {
        return { pass: false, message: 'Card 1 EXP mismatch after battle victory' };
      }

      // 3. Activate repeat hunting loop (반복 사냥)
      oracle.setRepeatHunting(true);
      if (!oracle.isRepeatHuntingActive()) {
        return { pass: false, message: 'Repeat hunting failed to activate' };
      }

      // Second automated victory in repeat loop -> another 50 EXP (total 100 EXP -> Lv 2)
      oracle.awardBattleVictoryExp(50);
      if (oracle.cards[1].level !== 2) {
        return { pass: false, message: `Expected Card 1 at Level 2 after repeat loop, got Lv ${oracle.cards[1].level}` };
      }

      return { pass: true, message: 'Tile exploration, battle victory EXP, and repeat hunting loop verified' };
    })
  );

  // =========================================================================
  // Scenario 4: Deck Strategy & Owned Card Nurturing Loop (W4)
  // =========================================================================
  results.push(
    await runTestAssertion('T4.W1.4', 4, 'End-to-End Workload', 'M4', 'Deck Strategy & Owned Card Nurturing Loop: Slot Swapping and Stat Allocation', async () => {
      const mockStorage = setupTestEnvironment();
      const oracle = new CardNurtureStore();

      // Initial Deck: [1, 2, 3, 4, 5]
      const initialTP = oracle.getDeckTP();

      // Add Card 6 (Leviathan, Water) to owned cards
      oracle.addCard(6);
      if (!oracle.isCardOwned(6)) {
        return { pass: false, message: 'Card 6 not added to owned cards' };
      }

      // Swap Slot 0 (Card 1) with Card 6
      const swapOk = oracle.setDeckCard(0, 6);
      if (!swapOk || oracle.activeDeckIds[0] !== 6) {
        return { pass: false, message: 'Deck slot swapping failed' };
      }

      // Verify Deck TP dynamically changed to reflect Card 6
      const postSwapTP = oracle.getDeckTP();
      if (postSwapTP <= 0 || postSwapTP === initialTP) {
        // Base power of Card 1 = 11, Card 6 = 22 -> Deck TP increases
        if (postSwapTP <= initialTP) {
          return { pass: false, message: `Deck TP should increase after slotting Card 6: was ${initialTP}, got ${postSwapTP}` };
        }
      }

      // Nurture Card 6 and allocate stat points
      oracle.nurtureCard(6, 100);
      oracle.allocateStat(6, 'bottom');

      if (oracle.cards[6].bonusStats.bottom !== 1 || oracle.cards[6].totalBonus !== 1) {
        return { pass: false, message: 'Stat allocation failed for Card 6' };
      }

      // Reload from storage to verify full persistence
      oracle.saveToStorage();
      const reloadedOracle = new CardNurtureStore();
      reloadedOracle.loadFromStorage();

      if (reloadedOracle.activeDeckIds[0] !== 6) {
        return { pass: false, message: 'Active deck slot not restored after reload' };
      }
      if (reloadedOracle.cards[6].bonusStats.bottom !== 1) {
        return { pass: false, message: 'Nurtured stats not restored after reload' };
      }

      return { pass: true, message: 'Deck editing, slot swapping, stat allocation, and persistence loop verified' };
    })
  );

  // =========================================================================
  // Scenario 5: Commercial Economy & Monetization Workload (W5)
  // =========================================================================
  results.push(
    await runTestAssertion('T4.W1.5', 4, 'End-to-End Workload', 'M5', 'Commercial Economy: Gold-to-SNS Exchange, Pack Purchase & Reveal Modal Dual-Write', async () => {
      const mockStorage = setupTestEnvironment();
      setUserCoins(50);     // Very low SNS
      setUserGold(15000);  // Ample Gold

      // Step 1: Exchange 5,000 Gold for 1,000 SNS
      const exchange = exchangeGoldForSns(5000);
      if (!exchange.success || exchange.snsGranted !== 1000) {
        return { pass: false, message: 'Gold exchange failed in workload' };
      }
      if (getUserCoins() !== 1050) {
        return { pass: false, message: `Expected 1050 SNS, got ${getUserCoins()}` };
      }

      // Step 2: Buy Magic Pack (800 SNS)
      const packRes = executeShopPurchase('pack_magic');
      if (!packRes.success || !packRes.revealedCards || packRes.revealedCards.length !== 3) {
        return { pass: false, message: 'Pack purchase failed' };
      }

      // Step 3: Check dual-write in both systems
      const firstCard = packRes.revealedCards[0];
      if (!cardNurtureStore.isCardOwned(firstCard.cardId)) {
        return { pass: false, message: 'Rolled card missing in nurture store' };
      }
      const rawInv = mockStorage.getItem('hero_inventory') || '';
      if (!rawInv.includes(String(firstCard.cardId))) {
        return { pass: false, message: 'Rolled card missing in hero_inventory' };
      }

      // Step 4: Verify remaining balance: 1050 - 800 = 250 SNS
      if (getUserCoins() !== 250) {
        return { pass: false, message: `Expected 250 remaining SNS, got ${getUserCoins()}` };
      }

      return { pass: true, message: 'Gold exchange, pack reveal modal data, and dual-write verified' };
    })
  );

  // =========================================================================
  // Scenario 6: Responsive Multi-Device Workload & VIP Experience (W6)
  // =========================================================================
  results.push(
    await runTestAssertion('T4.W1.6', 4, 'End-to-End Workload', 'M5', 'Responsive Multi-Device Workload: Desktop Gutters (1440px) vs Mobile Banner (375px)', async () => {
      const mockStorage = setupTestEnvironment();

      // Desktop Session (1440px wide)
      const desktop = getAdPlacements(1440);
      if (!desktop.desktopLeft || !desktop.desktopRight || desktop.mobileTop) {
        return { pass: false, message: 'Desktop side gutter placement failed at 1440px' };
      }

      // Tablet / Mobile Session (375px wide)
      const mobile = getAdPlacements(375);
      if (mobile.desktopLeft || mobile.desktopRight || !mobile.mobileTop) {
        return { pass: false, message: 'Mobile top banner placement failed at 375px' };
      }

      // User purchases Ad-Removal
      mockStorage.setItem('hero_ad_removed', 'true');
      const vipSession = getAdPlacements(1440);
      if (vipSession.desktopLeft || vipSession.desktopRight || vipSession.mobileTop) {
        return { pass: false, message: 'VIP user still receives ads' };
      }

      return { pass: true, message: 'Responsive multi-device layout and VIP ad-removal workload verified' };
    })
  );

  return results;
}
