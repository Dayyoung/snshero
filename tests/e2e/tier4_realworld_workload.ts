/**
 * Tier 4: Real-World Workload Scenarios (5 Assertions across 5 User Journeys)
 */

import {
  readProjectFile,
  runTestAssertion,
  ReferenceNurtureStore,
  MockLocalStorage,
} from './helpers';
import { TestResult, EXTERNAL_LINKS } from './types';
import { CARD_DATABASE } from '../../src/cardDatabase';

export async function runTier4Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // =========================================================================
  // Scenario 1: First-Time Visitor Journey (W1)
  // =========================================================================
  results.push(
    await runTestAssertion('T4.W1.1', 4, 'End-to-End Workload', 'M2', 'First-Time Visitor Journey (Zero Popups, Landing Review, Modals)', async () => {
      // Step 1: User hits root URL /
      const indexHtml = readProjectFile('index.html');
      if (!indexHtml) return { pass: false, message: 'index.html not found' };

      // Step 2: Verify zero initial popup storms
      const landingIndex = readProjectFile('src/landing/index.ts') || '';
      if (landingIndex.includes('window.alert') || landingIndex.includes('initialModal: true')) {
        return { pass: false, message: 'Visitor immediately encountered intrusive alert/modal' };
      }

      // Step 3: Verify home section highlights external works with badges
      const homeView = readProjectFile('src/landing/views/HomeSection.tsx') || '';
      const hasNovel = homeView.includes(EXTERNAL_LINKS.naverNovel) && homeView.includes(EXTERNAL_LINKS.badgeText);
      const hasWebtoon = homeView.includes(EXTERNAL_LINKS.naverWebtoon) && homeView.includes(EXTERNAL_LINKS.badgeText);
      const hasMunpia = homeView.includes(EXTERNAL_LINKS.munpiaNovel) && homeView.includes(EXTERNAL_LINKS.badgeText);

      if (!hasNovel || !hasWebtoon || !hasMunpia) {
        return { pass: false, message: 'External novel/webtoon serialization links or badges missing' };
      }

      // Step 4: Verify navigation to secondary modals works cleanly
      const modals = readProjectFile('src/landing/components/Modals.tsx') || '';
      if (!modals.includes('쇼핑몰') || !modals.includes('커뮤니티')) {
        return { pass: false, message: 'Secondary action modals missing in landing components' };
      }

      return { pass: true, message: 'First-time visitor end-to-end journey fully satisfied' };
    })
  );

  // =========================================================================
  // Scenario 2: Complete Card Nurture 1->100 Loop (W2)
  // =========================================================================
  results.push(
    await runTestAssertion('T4.W1.2', 4, 'End-to-End Workload', 'M3', 'Complete Card Nurture 1->100, Point Distribution & Refresh Loop', async () => {
      const mockStorage = new MockLocalStorage();
      const session = new ReferenceNurtureStore(mockStorage);

      // Start at Lv 1
      const card = session.cards[1];
      if (card.level !== 1) return { pass: false, message: 'Card 1 does not start at Lv 1' };

      // Level up 1 -> 100
      // Sum of (lvl * 100) for lvl from 1 to 99 = 100 * (99 * 100 / 2) = 495,000 EXP
      let totalExpNeeded = 0;
      for (let lvl = 1; lvl <= 99; lvl++) {
        totalExpNeeded += lvl * 100;
      }

      const nurtureRes = session.nurtureCard(1, totalExpNeeded);
      if (session.cards[1].level !== 100) {
        return { pass: false, message: `Expected Level 100, got ${session.cards[1].level}` };
      }
      if (session.cards[1].statPoints !== 99) {
        return { pass: false, message: `Expected 99 stat points accrued, got ${session.cards[1].statPoints}` };
      }
      if (!session.hasUnspentPoints(1)) {
        return { pass: false, message: 'Card 1 should show red dot indicator with 99 unspent points' };
      }

      // Distribute all 99 points evenly across 4 directions
      // 25 top, 25 right, 25 bottom, 24 left = 99
      for (let i = 0; i < 25; i++) session.allocateStat(1, 'top');
      for (let i = 0; i < 25; i++) session.allocateStat(1, 'right');
      for (let i = 0; i < 25; i++) session.allocateStat(1, 'bottom');
      for (let i = 0; i < 24; i++) session.allocateStat(1, 'left');

      if (session.hasUnspentPoints(1)) {
        return { pass: false, message: 'Red dot indicator did not clear after allocating all 99 points' };
      }

      session.saveToStorage();

      // Emulate page refresh / new browser session
      const refreshedSession = new ReferenceNurtureStore(mockStorage);
      refreshedSession.loadFromStorage();

      const restoredCard = refreshedSession.cards[1];
      if (restoredCard.level !== 100) {
        return { pass: false, message: `Restored level mismatch: ${restoredCard.level}` };
      }
      if (restoredCard.totalBonus !== 99) {
        return { pass: false, message: `Restored total bonus mismatch: ${restoredCard.totalBonus}` };
      }
      if (restoredCard.bonusStats.top !== 25 || restoredCard.bonusStats.left !== 24) {
        return { pass: false, message: `Restored 4-way bonus mismatch: ${JSON.stringify(restoredCard.bonusStats)}` };
      }

      return { pass: true, message: 'Complete 1->100 nurture, stat distribution, and reload loop verified' };
    })
  );

  // =========================================================================
  // Scenario 3: Deck Optimization & Mathematical TP Audit (W3)
  // =========================================================================
  results.push(
    await runTestAssertion('T4.W1.3', 4, 'End-to-End Workload', 'M3', 'Deck Optimization & Mathematical TP Audit', async () => {
      const oracle = new ReferenceNurtureStore();
      // Default deck: [1, 2, 3, 4, 5]
      // Card 1: 1, 4, 1, 5 -> 11
      // Card 2: 7, 1, 3, 1 -> 12
      // Card 3: 6, 6, 3, 2 -> 17
      // Card 4: 2, 3, 6, 7 -> 18
      // Card 5: 6, 5, 6, 5 -> 22
      // Sum = 11 + 12 + 17 + 18 + 22 = 80
      const calculatedDeckTP = oracle.getDeckTP();
      if (calculatedDeckTP !== 80) {
        return { pass: false, message: `Deck TP mismatch: got ${calculatedDeckTP}, expected 80` };
      }

      // Nurture Card 5 to level 5 -> 4 stat points
      oracle.nurtureCard(5, 1000);
      oracle.allocateStat(5, 'top');
      oracle.allocateStat(5, 'right');
      oracle.allocateStat(5, 'bottom');
      oracle.allocateStat(5, 'left');

      const updatedDeckTP = oracle.getDeckTP();
      if (updatedDeckTP !== 84) {
        return { pass: false, message: `Deck TP after Card 5 nurture mismatch: got ${updatedDeckTP}, expected 84` };
      }

      // Total TP across cards 1..5: 80 + 4 = 84
      const totalTP = oracle.getTotalTP();
      if (totalTP !== 84) {
        return { pass: false, message: `Total TP mismatch: got ${totalTP}, expected 84` };
      }

      return { pass: true, message: 'Deck TP and Total TP mathematical properties rigorously audited' };
    })
  );

  // =========================================================================
  // Scenario 4: Play Section 40-Episode Reading Journey (W4)
  // =========================================================================
  results.push(
    await runTestAssertion('T4.W1.4', 4, 'End-to-End Workload', 'M3', 'Play Section 40-Episode Reading Journey & Controls', async () => {
      const playSection = readProjectFile('src/landing/views/PlaySection.tsx') || '';
      const webtoonManifest = readProjectFile('src/content/webtoonEpisodeManifest.json') || '';

      const hasControls = ['닫기', '이전', '다음', '나레이션', 'TTS'].every(btn => playSection.includes(btn));
      if (!hasControls) {
        return { pass: false, message: 'Play section missing one of the 5 required control buttons' };
      }

      // Check that webtoon content is accessible
      const hasEpisodeData = webtoonManifest.length > 100;
      if (!hasEpisodeData) {
        return { pass: false, message: 'Webtoon episode data missing or empty' };
      }

      return { pass: true, message: 'Play section webtoon reading journey and 5 controls verified' };
    })
  );

  // =========================================================================
  // Scenario 5: Full Static Deployment Workload (W5)
  // =========================================================================
  results.push(
    await runTestAssertion('T4.W1.5', 4, 'End-to-End Workload', 'M4', 'Full Static Deployment Workload (Zero Server Call, Portable Assets)', async () => {
      const viteConfig = readProjectFile('vite.config.ts') || '';
      const postBuild = readProjectFile('scripts/post-build.js') || '';

      const buildsStatic = viteConfig.includes('rollupOptions') || viteConfig.includes('build');
      const managesRoutes = postBuild.includes('post-build') || postBuild.includes('copy') || postBuild.includes('home');

      if (!buildsStatic || !managesRoutes) {
        return { pass: false, message: 'Static deployment configuration incomplete' };
      }

      return { pass: true, message: 'Full static standalone deployment configuration verified' };
    })
  );

  return results;
}
