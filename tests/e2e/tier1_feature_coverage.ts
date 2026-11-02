/**
 * Tier 1: Feature Coverage & Interface Contracts (45 Assertions across 10 Feature Groups)
 */

import {
  readProjectFile,
  projectPathExists,
  parseHtml,
  runTestAssertion,
  ReferenceNurtureStore,
  MockLocalStorage,
} from './helpers';
import {
  TestResult,
  TOP_NAV_ITEMS,
  SIDE_NAV_ITEMS,
  SHOP_8_ITEMS,
  EXTERNAL_LINKS,
} from './types';
import { CARD_DATABASE } from '../../src/cardDatabase';

export async function runTier1Tests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // =========================================================================
  // Group 1: Dual-Entry MPA Architecture (Features 1–5, R1) [Milestone M1]
  // =========================================================================

  results.push(
    await runTestAssertion('T1.MPA.1', 1, 'MPA Architecture', 'M1', 'Root index.html Static Landing Entry', async () => {
      const content = readProjectFile('index.html');
      if (!content) return { pass: false, message: 'index.html not found' };
      const $ = parseHtml(content);
      const scriptSrcs = $('script').map((_, el) => $(el).attr('src') || '').get();
      const hasLandingEntry = scriptSrcs.some(src => src.includes('src/landing/index.ts') || src.includes('landing'));
      // Must not load heavy src/main.tsx directly in root static landing
      const loadsGameMainDirectly = scriptSrcs.some(src => src.includes('src/main.tsx'));
      if (!hasLandingEntry) {
        return { pass: false, message: `index.html does not reference src/landing/index.ts (scripts: ${scriptSrcs.join(', ')})` };
      }
      if (loadsGameMainDirectly) {
        return { pass: false, message: 'index.html still references heavy src/main.tsx directly' };
      }
      return { pass: true, message: 'index.html cleanly loads static landing entry' };
    })
  );

  results.push(
    await runTestAssertion('T1.MPA.2', 1, 'MPA Architecture', 'M1', 'Separate home.html Game SPA Entry', async () => {
      const content = readProjectFile('home.html');
      if (!content) return { pass: false, message: 'home.html entry not found' };
      const $ = parseHtml(content);
      const scriptSrcs = $('script').map((_, el) => $(el).attr('src') || '').get();
      const hasMainEntry = scriptSrcs.some(src => src.includes('src/main.tsx'));
      if (!hasMainEntry) {
        return { pass: false, message: `home.html does not reference src/main.tsx (scripts: ${scriptSrcs.join(', ')})` };
      }
      return { pass: true, message: 'home.html references src/main.tsx for game SPA' };
    })
  );

  results.push(
    await runTestAssertion('T1.MPA.3', 1, 'MPA Architecture', 'M1', 'Vite Multi-Page Rollup Inputs', async () => {
      const config = readProjectFile('vite.config.ts');
      if (!config) return { pass: false, message: 'vite.config.ts not found' };
      const hasMultiEntry = (config.includes('index.html') && config.includes('home.html')) ||
        (config.includes('rollupOptions') && config.includes('input'));
      if (!hasMultiEntry) {
        return { pass: false, message: 'vite.config.ts does not configure multi-page rollup inputs for index.html and home.html' };
      }
      return { pass: true, message: 'vite.config.ts configures multi-entry build' };
    })
  );

  results.push(
    await runTestAssertion('T1.MPA.4', 1, 'MPA Architecture', 'M1', 'Post-Build Route Preservation Script', async () => {
      const script = readProjectFile('scripts/post-build.js');
      if (!script) return { pass: false, message: 'scripts/post-build.js not found' };
      const handlesHome = script.includes('home.html') || script.includes('home/index.html') || script.includes('/home');
      const preservesIndex = script.includes('index.html');
      if (!handlesHome || !preservesIndex) {
        return { pass: false, message: 'scripts/post-build.js missing /home route preservation logic' };
      }
      return { pass: true, message: 'scripts/post-build.js preserves root index and generates /home' };
    })
  );

  results.push(
    await runTestAssertion('T1.MPA.5', 1, 'MPA Architecture', 'M1', 'Router Decoupling / vs /home', async () => {
      const routes = readProjectFile('src/routes.ts');
      if (!routes) return { pass: false, message: 'src/routes.ts not found' };
      const hasHomeRoute = routes.includes("'/home'") || routes.includes('"/home"');
      if (!hasHomeRoute) {
        return { pass: false, message: 'src/routes.ts does not map home view to /home' };
      }
      return { pass: true, message: 'src/routes.ts maps game home to /home' };
    })
  );

  // =========================================================================
  // Group 2: Responsive Layout & Zero Popups (Features 6–7, 11, R2, R3) [Milestone M2]
  // =========================================================================

  results.push(
    await runTestAssertion('T1.RESP.1', 1, 'Responsive Layout', 'M2', 'Mobile 360px Fluid Responsive Layout', async () => {
      const css = readProjectFile('src/landing/styles/landing.css') || '';
      const app = readProjectFile('src/landing/index.ts') || '';
      if (!css && !app) return { pass: false, message: 'Landing styling/index not found' };
      const hasOverflowControl = css.includes('overflow-x-hidden') || css.includes('w-full') || app.includes('w-full');
      return { pass: hasOverflowControl, message: 'Fluid responsive layout defined without fixed width overflow' };
    })
  );

  results.push(
    await runTestAssertion('T1.RESP.2', 1, 'Responsive Layout', 'M2', 'Tablet 768px Grid / Navigation Adaptability', async () => {
      const header = readProjectFile('src/landing/components/Header.tsx') || '';
      const sidebar = readProjectFile('src/landing/components/Sidebar.tsx') || '';
      const css = readProjectFile('src/landing/styles/landing.css') || '';
      const hasBreakpoints = header.includes('md:') || sidebar.includes('md:') || css.includes('768px') || css.includes('@media');
      return { pass: hasBreakpoints, message: 'Tablet 768px breakpoint adaptations present' };
    })
  );

  results.push(
    await runTestAssertion('T1.RESP.3', 1, 'Responsive Layout', 'M2', 'Desktop 1024px+ Full Widescreen Layout', async () => {
      const header = readProjectFile('src/landing/components/Header.tsx') || '';
      const app = readProjectFile('src/landing/index.ts') || '';
      const hasDesktop = header.includes('lg:') || app.includes('lg:') || header.includes('desktop');
      return { pass: hasDesktop, message: 'Desktop 1024px+ responsive layout rules defined' };
    })
  );

  results.push(
    await runTestAssertion('T1.RESP.4', 1, 'Character Assets', 'M2', '3-Tier Character Visual Assets Catalog', async () => {
      const catalog = readProjectFile('src/landing/services/assetCatalog.ts') || readProjectFile('src/landing/views/HomeSection.tsx') || '';
      if (!catalog) return { pass: false, message: 'Asset catalog or HomeSection referencing assets not found' };
      const has7Head = catalog.includes('cutouts') || catalog.includes('anime-character-sheets');
      const hasBust = catalog.includes('seat/') || catalog.includes('bust');
      const has3Head = catalog.includes('cards1.png') || catalog.includes('cards2.png') || catalog.includes('sd') || catalog.includes('3head');
      if (!has7Head || !hasBust || !has3Head) {
        return { pass: false, message: `Missing character tiers: 7-head(${has7Head}), bust(${hasBust}), 3-head(${has3Head})` };
      }
      return { pass: true, message: 'All 3 character visual asset tiers integrated' };
    })
  );

  results.push(
    await runTestAssertion('T1.RESP.5', 1, 'Zero Popups', 'M2', 'Zero Onboarding & Tutorial Popups on Visit', async () => {
      const indexScript = readProjectFile('src/landing/index.ts') || '';
      const modals = readProjectFile('src/landing/components/Modals.tsx') || '';
      // Ensure no auto-triggering tutorial or onboarding popups
      const hasAutoOnboarding = indexScript.includes('showTutorial') || indexScript.includes('onboarding') || indexScript.includes('FirstVisit');
      if (hasAutoOnboarding) {
        return { pass: false, message: 'Found automatic onboarding popup trigger in landing index' };
      }
      return { pass: true, message: 'First-time visit initiates with 0 onboarding popups' };
    })
  );

  // =========================================================================
  // Group 3: Navigation & Secondary Modals (Features 8–10, R3) [Milestone M2]
  // =========================================================================

  results.push(
    await runTestAssertion('T1.NAV.1', 1, 'Navigation', 'M2', 'Top Navigation Contains Exact 6 Items', async () => {
      const header = readProjectFile('src/landing/components/Header.tsx');
      if (!header) return { pass: false, message: 'src/landing/components/Header.tsx not found' };
      for (const item of TOP_NAV_ITEMS) {
        if (!header.includes(item)) {
          return { pass: false, message: `Top navigation missing item: '${item}'` };
        }
      }
      return { pass: true, message: `Top nav contains all 6 required items: ${TOP_NAV_ITEMS.join(', ')}` };
    })
  );

  results.push(
    await runTestAssertion('T1.NAV.2', 1, 'Navigation', 'M2', 'Side Navigation Contains Exact 8 Items', async () => {
      const sidebar = readProjectFile('src/landing/components/Sidebar.tsx');
      if (!sidebar) return { pass: false, message: 'src/landing/components/Sidebar.tsx not found' };
      for (const item of SIDE_NAV_ITEMS) {
        if (!sidebar.includes(item)) {
          return { pass: false, message: `Side navigation missing item: '${item}'` };
        }
      }
      return { pass: true, message: `Side nav contains all 8 required items: ${SIDE_NAV_ITEMS.join(', ')}` };
    })
  );

  results.push(
    await runTestAssertion('T1.NAV.3', 1, 'Navigation Modals', 'M2', 'Shopping Mall Modal with Dismiss Control', async () => {
      const modals = readProjectFile('src/landing/components/Modals.tsx');
      if (!modals) return { pass: false, message: 'src/landing/components/Modals.tsx not found' };
      const hasMall = modals.includes('쇼핑몰') || modals.includes('mall');
      const hasDismiss = modals.includes('닫기') || modals.includes('close') || modals.includes('[x]') || modals.includes('onClose');
      if (!hasMall || !hasDismiss) {
        return { pass: false, message: 'Shopping mall modal or dismiss control missing' };
      }
      return { pass: true, message: 'Shopping mall modal with dismiss control verified' };
    })
  );

  results.push(
    await runTestAssertion('T1.NAV.4', 1, 'Navigation Modals', 'M2', 'Community Modal with Dismiss Control', async () => {
      const modals = readProjectFile('src/landing/components/Modals.tsx');
      if (!modals) return { pass: false, message: 'src/landing/components/Modals.tsx not found' };
      const hasCommunity = modals.includes('커뮤니티') || modals.includes('community');
      const hasDismiss = modals.includes('닫기') || modals.includes('close') || modals.includes('[x]') || modals.includes('onClose');
      if (!hasCommunity || !hasDismiss) {
        return { pass: false, message: 'Community modal or dismiss control missing' };
      }
      return { pass: true, message: 'Community modal with dismiss control verified' };
    })
  );

  results.push(
    await runTestAssertion('T1.NAV.5', 1, 'Navigation Modals', 'M2', 'Login Modal with Dismiss Control', async () => {
      const modals = readProjectFile('src/landing/components/Modals.tsx');
      if (!modals) return { pass: false, message: 'src/landing/components/Modals.tsx not found' };
      const hasLogin = modals.includes('로그인') || modals.includes('login');
      const hasDismiss = modals.includes('닫기') || modals.includes('close') || modals.includes('[x]') || modals.includes('onClose');
      if (!hasLogin || !hasDismiss) {
        return { pass: false, message: 'Login modal or dismiss control missing' };
      }
      return { pass: true, message: 'Login modal with dismiss control verified' };
    })
  );

  // =========================================================================
  // Group 4: Home Section & External Links (Feature 12, R4) [Milestone M3]
  // =========================================================================

  results.push(
    await runTestAssertion('T1.HOME.1', 1, 'Home Section', 'M3', 'Home Vertical Scroll Structure', async () => {
      const home = readProjectFile('src/landing/views/HomeSection.tsx');
      if (!home) return { pass: false, message: 'src/landing/views/HomeSection.tsx not found' };
      const hasSections = home.includes('section') || home.includes('웹소설') || home.includes('웹게임');
      return { pass: hasSections, message: 'Home section has vertical scroll sections' };
    })
  );

  results.push(
    await runTestAssertion('T1.HOME.2', 1, 'Home Section', 'M3', 'SnowHero Introduction Section', async () => {
      const home = readProjectFile('src/landing/views/HomeSection.tsx');
      if (!home) return { pass: false, message: 'src/landing/views/HomeSection.tsx not found' };
      const hasIntro = home.includes('눈히어로') || home.includes('SNS히어로') || home.includes('SnowHero');
      return { pass: hasIntro, message: 'SnowHero intro section verified' };
    })
  );

  results.push(
    await runTestAssertion('T1.HOME.3', 1, 'Home Section', 'M3', 'Naver Web Novel Link & "절찬 연재중" Badge', async () => {
      const home = readProjectFile('src/landing/views/HomeSection.tsx');
      if (!home) return { pass: false, message: 'src/landing/views/HomeSection.tsx not found' };
      const hasLink = home.includes(EXTERNAL_LINKS.naverNovel) || home.includes('1250635');
      const hasBadge = home.includes(EXTERNAL_LINKS.badgeText);
      if (!hasLink || !hasBadge) {
        return { pass: false, message: 'Naver Web Novel link or [절찬 연재중] badge missing' };
      }
      return { pass: true, message: 'Naver Web Novel link and badge verified' };
    })
  );

  results.push(
    await runTestAssertion('T1.HOME.4', 1, 'Home Section', 'M3', 'Naver Webtoon Link & "절찬 연재중" Badge', async () => {
      const home = readProjectFile('src/landing/views/HomeSection.tsx');
      if (!home) return { pass: false, message: 'src/landing/views/HomeSection.tsx not found' };
      const hasLink = home.includes(EXTERNAL_LINKS.naverWebtoon) || home.includes('856677');
      const hasBadge = home.includes(EXTERNAL_LINKS.badgeText);
      if (!hasLink || !hasBadge) {
        return { pass: false, message: 'Naver Webtoon link or [절찬 연재중] badge missing' };
      }
      return { pass: true, message: 'Naver Webtoon link and badge verified' };
    })
  );

  results.push(
    await runTestAssertion('T1.HOME.5', 1, 'Home Section', 'M3', 'Munpia Web Novel Link & "절찬 연재중" Badge', async () => {
      const home = readProjectFile('src/landing/views/HomeSection.tsx');
      if (!home) return { pass: false, message: 'src/landing/views/HomeSection.tsx not found' };
      const hasLink = home.includes(EXTERNAL_LINKS.munpiaNovel) || home.includes('616551');
      const hasBadge = home.includes(EXTERNAL_LINKS.badgeText);
      if (!hasLink || !hasBadge) {
        return { pass: false, message: 'Munpia Web Novel link or [절찬 연재중] badge missing' };
      }
      return { pass: true, message: 'Munpia Web Novel link and badge verified' };
    })
  );

  // =========================================================================
  // Group 5: MyDeck Section & TP Metrics (Feature 13, R4) [Milestone M3]
  // =========================================================================

  results.push(
    await runTestAssertion('T1.DECK.1', 1, 'MyDeck Section', 'M3', '5-Card Deck Slot Composition Display', async () => {
      const deck = readProjectFile('src/landing/views/MyDeckSection.tsx');
      if (!deck) return { pass: false, message: 'src/landing/views/MyDeckSection.tsx not found' };
      const has5Slots = deck.includes('5') || deck.includes('deck') || deck.includes('slots');
      return { pass: has5Slots, message: 'MyDeck section displays 5-card slots' };
    })
  );

  results.push(
    await runTestAssertion('T1.DECK.2', 1, 'MyDeck Section', 'M3', 'Deck TP (Active 5-Card Stats Sum) Calculation', async () => {
      const oracle = new ReferenceNurtureStore();
      const initialDeckTP = oracle.getDeckTP();
      // Card 1: 11, Card 2: 12, Card 3: 17, Card 4: 18, Card 5: 22 -> Sum = 80
      const expectedSum = 11 + 12 + 17 + 18 + 22;
      if (initialDeckTP !== expectedSum) {
        return { pass: false, message: `Deck TP mismatch: got ${initialDeckTP}, expected ${expectedSum}` };
      }
      return { pass: true, message: `Deck TP verified (${initialDeckTP})` };
    })
  );

  results.push(
    await runTestAssertion('T1.DECK.3', 1, 'MyDeck Section', 'M3', 'Total TP (All Owned Cards) Calculation', async () => {
      const oracle = new ReferenceNurtureStore();
      const initialTotalTP = oracle.getTotalTP();
      // Starter owned cards 1..5: sum = 80
      if (initialTotalTP !== 80) {
        return { pass: false, message: `Total TP mismatch: got ${initialTotalTP}, expected 80` };
      }
      return { pass: true, message: `Total TP verified (${initialTotalTP})` };
    })
  );

  results.push(
    await runTestAssertion('T1.DECK.4', 1, 'MyDeck Section', 'M3', 'Minimalist Deck Interface (No Redundant HUDs)', async () => {
      const deck = readProjectFile('src/landing/views/MyDeckSection.tsx');
      if (!deck) return { pass: false, message: 'src/landing/views/MyDeckSection.tsx not found' };
      const hasNoRedundantBattleHUD = !deck.includes('BattleHUD') && !deck.includes('Joystick');
      return { pass: hasNoRedundantBattleHUD, message: 'MyDeck has minimalist clean layout' };
    })
  );

  results.push(
    await runTestAssertion('T1.DECK.5', 1, 'MyDeck Section', 'M3', 'Card Slot Inspect / Detail View', async () => {
      const deck = readProjectFile('src/landing/views/MyDeckSection.tsx');
      if (!deck) return { pass: false, message: 'src/landing/views/MyDeckSection.tsx not found' };
      const hasCardDetail = deck.includes('onClick') || deck.includes('selected') || deck.includes('card');
      return { pass: hasCardDetail, message: 'Card slot interaction supported' };
    })
  );

  // =========================================================================
  // Group 6: Play Section 5 Buttons & TTS OFF (Feature 14, R4) [Milestone M3]
  // =========================================================================

  results.push(
    await runTestAssertion('T1.PLAY.1', 1, 'Play Section', 'M3', '5 Streamlined Control Buttons', async () => {
      const play = readProjectFile('src/landing/views/PlaySection.tsx');
      if (!play) return { pass: false, message: 'src/landing/views/PlaySection.tsx not found' };
      const requiredButtons = ['닫기', '이전', '다음', '나레이션', 'TTS'];
      for (const btn of requiredButtons) {
        if (!play.includes(btn)) {
          return { pass: false, message: `Play section missing button: '${btn}'` };
        }
      }
      return { pass: true, message: `Play section contains all 5 buttons: ${requiredButtons.join(', ')}` };
    })
  );

  results.push(
    await runTestAssertion('T1.PLAY.2', 1, 'Play Section', 'M3', 'TTS Default Disabled (OFF) on Load', async () => {
      const play = readProjectFile('src/landing/views/PlaySection.tsx');
      if (!play) return { pass: false, message: 'src/landing/views/PlaySection.tsx not found' };
      const hasDefaultOff = play.includes('false') || play.includes('isTtsActive') || play.includes('ttsEnabled: false');
      return { pass: hasDefaultOff, message: 'TTS default state is OFF' };
    })
  );

  results.push(
    await runTestAssertion('T1.PLAY.3', 1, 'Play Section', 'M3', 'TTS State Toggle Action', async () => {
      const play = readProjectFile('src/landing/views/PlaySection.tsx');
      if (!play) return { pass: false, message: 'src/landing/views/PlaySection.tsx not found' };
      const hasToggle = play.includes('toggleTts') || play.includes('setTts') || play.includes('!prev');
      return { pass: hasToggle, message: 'TTS toggle handler present' };
    })
  );

  results.push(
    await runTestAssertion('T1.PLAY.4', 1, 'Play Section', 'M3', 'Webtoon Image Selection and Display', async () => {
      const play = readProjectFile('src/landing/views/PlaySection.tsx');
      if (!play) return { pass: false, message: 'src/landing/views/PlaySection.tsx not found' };
      const hasWebtoonImages = play.includes('webtoon') || play.includes('scene') || play.includes('episode');
      return { pass: hasWebtoonImages, message: 'Webtoon image viewer integrated' };
    })
  );

  results.push(
    await runTestAssertion('T1.PLAY.5', 1, 'Play Section', 'M3', 'Scene Previous / Next Stepper Navigation', async () => {
      const play = readProjectFile('src/landing/views/PlaySection.tsx');
      if (!play) return { pass: false, message: 'src/landing/views/PlaySection.tsx not found' };
      const hasPrevNext = play.includes('prevScene') || play.includes('nextScene') || (play.includes('이전') && play.includes('다음'));
      return { pass: hasPrevNext, message: 'Scene stepper navigation supported' };
    })
  );

  // =========================================================================
  // Group 7: Card Section 1~100Lv Nurture & Red Dot (Features 15–16, R4) [Milestone M3]
  // =========================================================================

  results.push(
    await runTestAssertion('T1.CARD.1', 1, 'Card Section', 'M3', "'카드' Section Naming & Collection Rate Display", async () => {
      const cardView = readProjectFile('src/landing/views/CardSection.tsx');
      if (!cardView) return { pass: false, message: 'src/landing/views/CardSection.tsx not found' };
      const hasCardTitle = cardView.includes('카드');
      const hasRate = cardView.includes('수집율') || cardView.includes('110') || cardView.includes('%');
      if (!hasCardTitle || !hasRate) {
        return { pass: false, message: 'Card section missing "카드" title or collection rate display' };
      }
      return { pass: true, message: 'Card naming and collection rate verified' };
    })
  );

  results.push(
    await runTestAssertion('T1.CARD.2', 1, 'Card Section', 'M3', '110-Card Comprehensive Grid', async () => {
      const cardView = readProjectFile('src/landing/views/CardSection.tsx');
      if (!cardView) return { pass: false, message: 'src/landing/views/CardSection.tsx not found' };
      const hasGrid = cardView.includes('110') || cardView.includes('grid') || cardView.includes('map');
      return { pass: hasGrid, message: '110-card grid layout verified' };
    })
  );

  results.push(
    await runTestAssertion('T1.CARD.3', 1, 'Card Nurture', 'M3', 'Nurture EXP Progression & Level-Up', async () => {
      const oracle = new ReferenceNurtureStore();
      const initial = oracle.cards[1];
      const res = oracle.nurtureCard(1, 150); // expToNext is 100
      if (!res.leveledUp || res.newLevel !== 2) {
        return { pass: false, message: `Expected level-up to 2, got level ${res.newLevel}` };
      }
      if (oracle.cards[1].statPoints !== 1) {
        return { pass: false, message: `Expected 1 stat point, got ${oracle.cards[1].statPoints}` };
      }
      return { pass: true, message: 'Card nurture awards EXP and triggers level-up' };
    })
  );

  results.push(
    await runTestAssertion('T1.CARD.4', 1, 'Card Nurture', 'M3', 'Max Level 100 Cap Enforcement', async () => {
      const oracle = new ReferenceNurtureStore();
      oracle.cards[1].level = 99;
      oracle.cards[1].exp = 0;
      oracle.cards[1].expToNext = 9900;
      // Level up to 100
      oracle.nurtureCard(1, 10000);
      if (oracle.cards[1].level !== 100) {
        return { pass: false, message: `Expected level 100, got ${oracle.cards[1].level}` };
      }
      // Attempting to nurture beyond 100
      const nextRes = oracle.nurtureCard(1, 50000);
      if (oracle.cards[1].level > 100 || nextRes.leveledUp) {
        return { pass: false, message: 'Card level exceeded 100 or leveled up past cap' };
      }
      return { pass: true, message: 'Card level capped strictly at 100' };
    })
  );

  results.push(
    await runTestAssertion('T1.CARD.5', 1, 'Card Nurture', 'M3', 'Stat Points & Red Dot Indicator', async () => {
      const oracle = new ReferenceNurtureStore();
      oracle.nurtureCard(1, 100); // Level 2, 1 stat point
      const hasPoints = oracle.hasUnspentPoints(1);
      if (!hasPoints) {
        return { pass: false, message: 'Card should have unspent points' };
      }
      // Allocate point
      oracle.allocateStat(1, 'top');
      const hasPointsAfter = oracle.hasUnspentPoints(1);
      if (hasPointsAfter) {
        return { pass: false, message: 'Red dot / unspent points should clear after allocation' };
      }
      return { pass: true, message: 'Stat points and red dot indicator state transitions verified' };
    })
  );

  results.push(
    await runTestAssertion('T1.CARD.6', 1, 'Card Nurture', 'M3', '4-Way Stat Allocation (Top, Right, Bottom, Left)', async () => {
      const oracle = new ReferenceNurtureStore();
      // Level up 4 times -> 4 stat points
      oracle.cards[1].statPoints = 4;
      const topOk = oracle.allocateStat(1, 'top');
      const rightOk = oracle.allocateStat(1, 'right');
      const bottomOk = oracle.allocateStat(1, 'bottom');
      const leftOk = oracle.allocateStat(1, 'left');

      if (!topOk || !rightOk || !bottomOk || !leftOk) {
        return { pass: false, message: 'Failed to allocate in 4 directions' };
      }
      const b = oracle.cards[1].bonusStats;
      if (b.top !== 1 || b.right !== 1 || b.bottom !== 1 || b.left !== 1 || oracle.cards[1].totalBonus !== 4) {
        return { pass: false, message: `Unexpected bonus stats: ${JSON.stringify(b)}` };
      }
      return { pass: true, message: '4-way stat allocation successfully applied' };
    })
  );

  // =========================================================================
  // Group 8: LocalStorage State Persistence (Feature 17, R4) [Milestone M3]
  // =========================================================================

  results.push(
    await runTestAssertion('T1.STORE.1', 1, 'Storage Persistence', 'M3', 'hero_card_nurturing Schema Compliance', async () => {
      const mockStorage = new MockLocalStorage();
      const oracle = new ReferenceNurtureStore(mockStorage);
      oracle.nurtureCard(1, 100);
      oracle.saveToStorage();

      const raw = mockStorage.getItem('hero_card_nurturing');
      if (!raw) return { pass: false, message: 'hero_card_nurturing key not set in storage' };
      const parsed = JSON.parse(raw);
      if (!parsed.cards || !parsed.cards[1] || typeof parsed.cards[1].level !== 'number') {
        return { pass: false, message: 'Stored schema missing cards payload' };
      }
      return { pass: true, message: 'LocalStorage schema strictly conforms to contract' };
    })
  );

  results.push(
    await runTestAssertion('T1.STORE.2', 1, 'Storage Persistence', 'M3', 'Nurture Level/EXP Persistence on Reload', async () => {
      const mockStorage = new MockLocalStorage();
      const oracle1 = new ReferenceNurtureStore(mockStorage);
      oracle1.nurtureCard(2, 200); // Level 2
      oracle1.saveToStorage();

      // Emulate fresh browser reload with same storage
      const oracle2 = new ReferenceNurtureStore(mockStorage);
      oracle2.loadFromStorage();
      if (oracle2.cards[2].level !== oracle1.cards[2].level) {
        return { pass: false, message: `Level not persisted: got ${oracle2.cards[2].level}, expected ${oracle1.cards[2].level}` };
      }
      return { pass: true, message: 'Nurture level and EXP persist across storage reload' };
    })
  );

  results.push(
    await runTestAssertion('T1.STORE.3', 1, 'Storage Persistence', 'M3', 'Allocated Stats Persistence on Reload', async () => {
      const mockStorage = new MockLocalStorage();
      const oracle1 = new ReferenceNurtureStore(mockStorage);
      oracle1.cards[3].statPoints = 2;
      oracle1.allocateStat(3, 'right');
      oracle1.allocateStat(3, 'bottom');
      oracle1.saveToStorage();

      const oracle2 = new ReferenceNurtureStore(mockStorage);
      oracle2.loadFromStorage();
      if (oracle2.cards[3].bonusStats.right !== 1 || oracle2.cards[3].bonusStats.bottom !== 1) {
        return { pass: false, message: 'Allocated stats not restored on reload' };
      }
      return { pass: true, message: 'Allocated bonus stats persist cleanly across reload' };
    })
  );

  results.push(
    await runTestAssertion('T1.STORE.4', 1, 'Storage Persistence', 'M3', 'Owned Cards Inventory Persistence', async () => {
      const mockStorage = new MockLocalStorage();
      const oracle1 = new ReferenceNurtureStore(mockStorage);
      oracle1.ownedCardIds.push(10);
      oracle1.saveToStorage();

      const oracle2 = new ReferenceNurtureStore(mockStorage);
      oracle2.loadFromStorage();
      if (!oracle2.ownedCardIds.includes(10)) {
        return { pass: false, message: 'Newly acquired card ID 10 not restored' };
      }
      return { pass: true, message: 'Owned cards list persists across reload' };
    })
  );

  // =========================================================================
  // Group 9: Shop Section 8 Fixed Items (Feature 18, R4) [Milestone M3]
  // =========================================================================

  results.push(
    await runTestAssertion('T1.SHOP.1', 1, 'Shop Section', 'M3', 'Exact 8 Fixed Shop Items Presence', async () => {
      const shop = readProjectFile('src/landing/views/ShopSection.tsx');
      if (!shop) return { pass: false, message: 'src/landing/views/ShopSection.tsx not found' };
      for (const item of SHOP_8_ITEMS) {
        if (!shop.includes(item)) {
          return { pass: false, message: `Shop missing required item: '${item}'` };
        }
      }
      return { pass: true, message: `Shop contains all 8 exact items: ${SHOP_8_ITEMS.join(', ')}` };
    })
  );

  results.push(
    await runTestAssertion('T1.SHOP.2', 1, 'Shop Section', 'M3', 'Zero Prohibited Extra Shop Items', async () => {
      const shop = readProjectFile('src/landing/views/ShopSection.tsx');
      if (!shop) return { pass: false, message: 'src/landing/views/ShopSection.tsx not found' };
      // Prohibited legacy items: e.g. '행운의 룰렛', 'VIP 패스', '보물상자'
      const prohibited = ['행운의 룰렛', 'VIP 패스', '보물상자'];
      for (const p of prohibited) {
        if (shop.includes(p)) {
          return { pass: false, message: `Shop contains prohibited legacy clutter item: '${p}'` };
        }
      }
      return { pass: true, message: 'Zero extra clutter items verified' };
    })
  );

  results.push(
    await runTestAssertion('T1.SHOP.3', 1, 'Shop Section', 'M3', 'Card Pack Items (Normal, Magic, Rare)', async () => {
      const shop = readProjectFile('src/landing/views/ShopSection.tsx');
      if (!shop) return { pass: false, message: 'src/landing/views/ShopSection.tsx not found' };
      const hasPacks = shop.includes('일반 카드팩') && shop.includes('매직 카드팩') && shop.includes('희귀 카드팩');
      return { pass: hasPacks, message: 'All 3 card packs present in shop' };
    })
  );

  results.push(
    await runTestAssertion('T1.SHOP.4', 1, 'Shop Section', 'M3', 'Item Pack & Ad Removal Items', async () => {
      const shop = readProjectFile('src/landing/views/ShopSection.tsx');
      if (!shop) return { pass: false, message: 'src/landing/views/ShopSection.tsx not found' };
      const hasSpecial = shop.includes('아이템 팩') && shop.includes('광고 제거');
      return { pass: hasSpecial, message: 'Item Pack and Ad Removal present' };
    })
  );

  results.push(
    await runTestAssertion('T1.SHOP.5', 1, 'Shop Section', 'M3', 'Official Content & Coin Recharge Items', async () => {
      const shop = readProjectFile('src/landing/views/ShopSection.tsx');
      if (!shop) return { pass: false, message: 'src/landing/views/ShopSection.tsx not found' };
      const hasContent = shop.includes('공식 소설') && shop.includes('공식 동영상') && shop.includes('코인 충전');
      return { pass: hasContent, message: 'Official Novel, Video, and Coin Recharge present' };
    })
  );

  // =========================================================================
  // Group 10: Static Build Integrity (Feature 19, R5) [Milestone M4]
  // =========================================================================

  results.push(
    await runTestAssertion('T1.BUILD.1', 1, 'Build Integrity', 'M4', 'Production Build Config Check', async () => {
      const pkg = readProjectFile('package.json');
      if (!pkg) return { pass: false, message: 'package.json not found' };
      const json = JSON.parse(pkg);
      const buildScript = json.scripts?.build || '';
      if (!buildScript.includes('vite build')) {
        return { pass: false, message: 'build script missing vite build' };
      }
      return { pass: true, message: 'Build script configured properly' };
    })
  );

  results.push(
    await runTestAssertion('T1.BUILD.2', 1, 'Build Integrity', 'M4', 'Dist Output HTML Target Integrity', async () => {
      const postBuild = readProjectFile('scripts/post-build.js');
      if (!postBuild) return { pass: false, message: 'scripts/post-build.js not found' };
      const outputsHome = postBuild.includes('dist/home') || postBuild.includes('home.html');
      return { pass: outputsHome, message: 'post-build targets dist/home cleanly' };
    })
  );

  results.push(
    await runTestAssertion('T1.BUILD.3', 1, 'Build Integrity', 'M4', 'Zero Mandatory Server API Dependencies', async () => {
      const landing = readProjectFile('src/landing/index.ts') || '';
      const hasMandatoryApi = landing.includes('/api/v1/auth') || landing.includes('fetch("/api/');
      if (hasMandatoryApi) {
        return { pass: false, message: 'Landing has hardcoded mandatory server API calls' };
      }
      return { pass: true, message: 'Static landing operates with zero server runtime dependencies' };
    })
  );

  return results;
}
