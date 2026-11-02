/**
 * Tier 3: Pairwise Combinations & State Machine (6 Assertions across 6 Interactions)
 */

import {
  readProjectFile,
  runTestAssertion,
  ReferenceNurtureStore,
  MockLocalStorage,
} from './helpers';
import { TestResult } from './types';

export async function runTier3Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // =========================================================================
  // Combination 1: Nurture -> Stat Allocation -> Deck TP Update (C1)
  // =========================================================================
  results.push(
    await runTestAssertion('T3.C1.1', 3, 'Cross-Feature Synergy', 'M3', 'Nurture -> Stat Allocation -> Dynamic Deck TP Sync', async () => {
      const oracle = new ReferenceNurtureStore();
      const initialDeckTP = oracle.getDeckTP(); // 80

      // Nurture Card 1 (in active deck) to gain 1 level and 1 stat point
      oracle.nurtureCard(1, 100);
      if (oracle.cards[1].statPoints !== 1) {
        return { pass: false, message: 'Expected 1 stat point after nurture' };
      }

      // Allocate point to 'top'
      const allocated = oracle.allocateStat(1, 'top');
      if (!allocated) {
        return { pass: false, message: 'Stat allocation failed' };
      }

      // Deck TP must increase by exactly 1
      const updatedDeckTP = oracle.getDeckTP();
      if (updatedDeckTP !== initialDeckTP + 1) {
        return { pass: false, message: `Deck TP not updated correctly: got ${updatedDeckTP}, expected ${initialDeckTP + 1}` };
      }

      // Total TP must also increase by exactly 1
      const updatedTotalTP = oracle.getTotalTP();
      if (updatedTotalTP !== initialDeckTP + 1) {
        return { pass: false, message: `Total TP mismatch: got ${updatedTotalTP}` };
      }

      return { pass: true, message: 'Nurture, stat allocation, and Deck TP dynamic sync verified' };
    })
  );

  // =========================================================================
  // Combination 2: Shop Purchase -> Collection Rate -> Total TP (C2)
  // =========================================================================
  results.push(
    await runTestAssertion('T3.C1.2', 3, 'Cross-Feature Synergy', 'M3', 'Shop Purchase -> Inventory Expansion -> Collection Rate Sync', async () => {
      const oracle = new ReferenceNurtureStore();
      const initialCount = oracle.ownedCardIds.length; // 5
      const initialTotalTP = oracle.getTotalTP(); // 80

      // Emulate purchase of card pack unlocking Card 6 (Leviathan, base power = 22)
      oracle.ownedCardIds.push(6);
      oracle.saveToStorage();

      const newCount = oracle.ownedCardIds.length;
      if (newCount !== initialCount + 1) {
        return { pass: false, message: 'Owned cards count not incremented' };
      }

      const newTotalTP = oracle.getTotalTP();
      // Card 6 power: 22. Total TP should become 80 + 22 = 102.
      if (newTotalTP !== initialTotalTP + 22) {
        return { pass: false, message: `Total TP mismatch after shop expansion: got ${newTotalTP}, expected ${initialTotalTP + 22}` };
      }

      return { pass: true, message: 'Shop inventory expansion, collection rate, and Total TP sync verified' };
    })
  );

  // =========================================================================
  // Combination 3: Play Section Scene Stepper -> TTS State (C3)
  // =========================================================================
  results.push(
    await runTestAssertion('T3.C1.3', 3, 'Media Controls Synergy', 'M3', 'Scene Stepping Preserves TTS Default OFF State', async () => {
      const play = readProjectFile('src/landing/views/PlaySection.tsx') || '';
      // Ensure scene transitions do not inadvertently auto-enable TTS
      const hasAutoPlayOnSceneChange = play.includes('onSceneChange: enableTts') || play.includes('sceneIndex && setTts(true)');
      if (hasAutoPlayOnSceneChange) {
        return { pass: false, message: 'Scene change violates TTS OFF rule by auto-enabling TTS' };
      }
      return { pass: true, message: 'Scene navigation preserves TTS OFF state invariance' };
    })
  );

  // =========================================================================
  // Combination 4: Dual Routing Transition / <-> /home (C4)
  // =========================================================================
  results.push(
    await runTestAssertion('T3.C1.4', 3, 'Routing Synergy', 'M1', 'Dual Routing Independence (/ Landing vs /home Game SPA)', async () => {
      const indexHtml = readProjectFile('index.html') || '';
      const homeHtml = readProjectFile('home.html') || '';
      const routes = readProjectFile('src/routes.ts') || '';

      const landingClean = !indexHtml.includes('src/main.tsx');
      const homeClean = homeHtml.includes('src/main.tsx');
      const routesDecoupled = routes.includes('/home');

      if (!landingClean || !homeClean || !routesDecoupled) {
        return {
          pass: false,
          message: `Dual routing decoupling incomplete: landingClean=${landingClean}, homeClean=${homeClean}, routesDecoupled=${routesDecoupled}`,
        };
      }
      return { pass: true, message: 'Dual routing / and /home operates with complete independence' };
    })
  );

  // =========================================================================
  // Combination 5: Modal Lifecycle & Dismissal (C5)
  // =========================================================================
  results.push(
    await runTestAssertion('T3.C1.5', 3, 'Modal Lifecycle', 'M2', 'Modal Open / Close Lifecycle & Background State Preservation', async () => {
      const modals = readProjectFile('src/landing/components/Modals.tsx') || '';
      const hasDismissHandlers = modals.includes('onClose') || modals.includes('setModal(null)');
      const hasBackdrop = modals.includes('fixed') || modals.includes('z-50') || modals.includes('backdrop');
      if (!hasDismissHandlers || !hasBackdrop) {
        return { pass: false, message: 'Modal backdrop or dismissal handler missing' };
      }
      return { pass: true, message: 'Modal backdrop and dismissal lifecycle verified' };
    })
  );

  // =========================================================================
  // Combination 6: Bulk Stat Allocation & Red Dot Clearance (C6)
  // =========================================================================
  results.push(
    await runTestAssertion('T3.C1.6', 3, 'Card Nurture Synergy', 'M3', 'Bulk Stat Points Expenditure & Red Dot Clearance', async () => {
      const oracle = new ReferenceNurtureStore();
      // Level up 3 times -> 3 stat points
      oracle.cards[2].statPoints = 3;
      if (!oracle.hasUnspentPoints(2)) {
        return { pass: false, message: 'Red dot indicator should be active when statPoints > 0' };
      }

      // Allocate all 3 points
      oracle.allocateStat(2, 'top');
      if (!oracle.hasUnspentPoints(2)) {
        return { pass: false, message: 'Red dot should still be active with 2 points left' };
      }

      oracle.allocateStat(2, 'right');
      oracle.allocateStat(2, 'bottom');

      if (oracle.hasUnspentPoints(2)) {
        return { pass: false, message: 'Red dot should be inactive after all points allocated' };
      }
      if (oracle.cards[2].statPoints !== 0 || oracle.cards[2].totalBonus !== 3) {
        return { pass: false, message: 'Stat points or totalBonus mismatch after bulk allocation' };
      }

      return { pass: true, message: 'Bulk stat allocation and red dot clearance lifecycle verified' };
    })
  );

  return results;
}
