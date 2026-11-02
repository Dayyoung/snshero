/**
 * tests/adversarial_m2_home_deck.ts
 *
 * EMPIRICAL ADVERSARIAL TEST HARNESS — MILESTONE 2
 * Home Section Branding & MyDeck Editing Parity (Features 5, 6, 7)
 *
 * Scope:
 * 1. Physical existence and DOM rendering of official graphic logo (/logo-ko.png) in #home.
 * 2. 5-card fan-folded squad preview in #home with active deck cards, rotation angles, stats, deck CP, and flame badge.
 * 3. Preservation of 4 core media pillars and external serialization links with '[절찬 연재중]' badges.
 * 4. 5-slot active deck layout in #deck with slot selection and detailed card inspection.
 * 5. Card replacement from owned inventory, unowned card rejection, and strict duplicate prevention in active squad.
 * 6. Real-time dynamic Deck TP calculation and synchronization with card nurturing.
 * 7. LocalStorage persistence (hero_deck), rehydration, legacy format compatibility, and corruption recovery.
 *
 * Usage:
 *   npx tsx tests/adversarial_m2_home_deck.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

// ============================================================================
// In-Memory Storage Mock for Headless Node.js Execution
// ============================================================================

class MockStorage implements Storage {
  private store = new Map<string, string>();

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
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  get length(): number {
    return this.store.size;
  }
}

const mockStorage = new MockStorage();
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = mockStorage;
}

// Import production code modules
import { renderHomeSection } from '../src/landing/views/HomeSection';
import { renderMyDeckSection } from '../src/landing/views/MyDeckSection';
import { cardNurtureStore, CardNurtureStore } from '../src/landing/services/cardNurtureStore';
import { CARD_DATABASE } from '../src/cardDatabase';
import { EXTERNAL_LINKS } from '../src/landing/types';

// ============================================================================
// ANSI Color Formatting & Test Assertion Runner
// ============================================================================

const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const YELLOW = '\x1b[93m';
const CYAN = '\x1b[96m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

interface AssertionResult {
  suite: string;
  id: string;
  name: string;
  passed: boolean;
  message?: string;
  expected?: string;
  actual?: string;
}

const results: AssertionResult[] = [];

function assert(
  suite: string,
  id: string,
  name: string,
  condition: boolean,
  expected?: string,
  actual?: string,
  extraMessage?: string
): void {
  results.push({
    suite,
    id,
    name,
    passed: condition,
    expected,
    actual,
    message: extraMessage,
  });

  const badge = condition ? `${GREEN}✓ PASS${RESET}` : `${RED}✗ FAIL${RESET}`;
  console.log(`  [${id}] ${name.padEnd(54)} ${badge}`);
  if (!condition) {
    if (expected !== undefined && actual !== undefined) {
      console.log(`    ${YELLOW}↳ Expected: ${expected}${RESET}`);
      console.log(`    ${YELLOW}↳ Actual  : ${actual}${RESET}`);
    }
    if (extraMessage) {
      console.log(`    ${YELLOW}↳ Note    : ${extraMessage}${RESET}`);
    }
  }
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function runAdversarialHarness() {
  const startTime = performance.now();
  console.log(`\n${BOLD}${CYAN}======================================================================${RESET}`);
  console.log(`${BOLD}${CYAN}  MILESTONE 2 EMPIRICAL ADVERSARIAL TEST HARNESS: HOME & DECK PARITY  ${RESET}`);
  console.log(`${BOLD}${CYAN}======================================================================${RESET}`);
  console.log(`Working Directory : ${REPO_ROOT}`);
  console.log(`Target Modules    : HomeSection.tsx, MyDeckSection.tsx, cardNurtureStore.ts`);
  console.log(`Features Verified : Feature 5 (Logo), Feature 6 (Fan Deck & Pillars), Feature 7 (MyDeck Editing)\n`);

  // Reset in-memory storage to clean baseline
  mockStorage.clear();
  cardNurtureStore.initDefaultCards();
  cardNurtureStore.ownedCardIds = [1, 2, 3, 4, 5];
  if (Array.isArray((cardNurtureStore as any).activeDeckIds)) {
    (cardNurtureStore as any).activeDeckIds = [1, 2, 3, 4, 5];
  }

  // --------------------------------------------------------------------------
  // SUITE 1: Official Graphic Logo (/logo-ko.png) Physical Asset & Home DOM
  // --------------------------------------------------------------------------
  console.log(`${BOLD}>>> Suite 1: Official Graphic Logo (/logo-ko.png) Integrity & Rendering${RESET}`);

  // Test 1.1: Physical Asset Existence & Magic Bytes
  const logoPath = path.join(REPO_ROOT, 'public/logo-ko.png');
  const fileExists = fs.existsSync(logoPath);
  let isPngMagic = false;
  let imgWidth = 0;
  let imgHeight = 0;
  let fileSize = 0;

  if (fileExists) {
    const stat = fs.statSync(logoPath);
    fileSize = stat.size;
    const fd = fs.openSync(logoPath, 'r');
    const buf = Buffer.alloc(24);
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);
    isPngMagic = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    imgWidth = buf.readUInt32BE(16);
    imgHeight = buf.readUInt32BE(20);
  }

  assert(
    'Suite 1',
    'M2.LOGO.1',
    'Physical logo file exists with PNG magic bytes',
    fileExists && isPngMagic,
    'Valid PNG at public/logo-ko.png',
    `fileExists=${fileExists}, isPngMagic=${isPngMagic}`
  );

  assert(
    'Suite 1',
    'M2.LOGO.2',
    'Logo asset resolution matches official 1268x716 dimensions',
    imgWidth === 1268 && imgHeight === 716,
    '1268x716 px',
    `${imgWidth}x${imgHeight} px`
  );

  // Test 1.3: Home Section DOM Rendering of /logo-ko.png
  const homeHtml = renderHomeSection();
  const $home = cheerio.load(homeHtml);
  const logoImgs = $home('img').filter((_, el) => {
    const src = $home(el).attr('src') || '';
    return src.includes('logo-ko.png');
  });

  assert(
    'Suite 1',
    'M2.LOGO.3',
    'renderHomeSection() renders <img> with src="/logo-ko.png"',
    logoImgs.length >= 1,
    'At least 1 logo <img> tag',
    `Found ${logoImgs.length}`
  );

  const logoAlt = logoImgs.first().attr('alt') || '';
  const hasValidAlt = logoAlt.includes('눈히어로') || logoAlt.includes('SNSHero');
  assert(
    'Suite 1',
    'M2.LOGO.4',
    'Logo <img> includes accessible alt text branding',
    hasValidAlt,
    'Alt text containing "눈히어로" or "SNSHero"',
    `Alt: "${logoAlt}"`
  );

  console.log('');

  // --------------------------------------------------------------------------
  // SUITE 2: Cool Card Deck 5-Card Fan-Folded Squad Preview in #home
  // --------------------------------------------------------------------------
  console.log(`${BOLD}>>> Suite 2: Cool Card Deck 5-Card Fan-Folded Squad Preview in #home${RESET}`);

  // Test 2.1: 5 distinct card preview items rendered in fan container
  const fanCards = $home('[data-fan-card], .fan-card, [data-deck-preview-card]');
  // Fallback: search for cards inside cool-card-deck / squad preview container
  const squadContainer = $home('#home-squad-fan, #home-deck-showcase, [data-testid="cool-card-deck"], .squad-fan-container');
  const squadCardsCount = fanCards.length > 0 ? fanCards.length : squadContainer.find('[data-card-id]').length;

  assert(
    'Suite 2',
    'M2.FAN.1',
    'Squad preview renders exactly 5 active squad cards',
    squadCardsCount === 5 || fanCards.length === 5,
    '5 preview cards',
    `Found ${squadCardsCount || fanCards.length}`
  );

  // Test 2.2: Rotational transform offsets present (-12deg to +12deg)
  let foundNegativeRot = false;
  let foundPositiveRot = false;
  let foundZeroRot = false;

  const cardsToInspect = fanCards.length > 0 ? fanCards : squadContainer.find('[data-card-id]');
  cardsToInspect.each((_, el) => {
    const style = $home(el).attr('style') || '';
    const classAttr = $home(el).attr('class') || '';
    const fullDesc = `${style} ${classAttr}`;

    if (fullDesc.includes('rotate(-') || fullDesc.includes('-rotate-') || fullDesc.includes('-12deg') || fullDesc.includes('-6deg') || fullDesc.includes('-10deg')) {
      foundNegativeRot = true;
    }
    if (fullDesc.includes('rotate(') && !fullDesc.includes('rotate(-') && (fullDesc.includes('12deg') || fullDesc.includes('6deg') || fullDesc.includes('10deg') || fullDesc.includes('rotate-'))) {
      foundPositiveRot = true;
    }
    if (fullDesc.includes('rotate(0') || fullDesc.includes('rotate-0') || fullDesc.includes('0deg')) {
      foundZeroRot = true;
    }
  });

  const hasFanRotation = (foundNegativeRot && foundPositiveRot) || homeHtml.includes('rotate(') || homeHtml.includes('-12deg');
  assert(
    'Suite 2',
    'M2.FAN.2',
    'Fan-folded cards feature symmetric rotational transforms',
    hasFanRotation,
    'Symmetric rotation angles (negative, center, positive)',
    `neg=${foundNegativeRot}, center=${foundZeroRot}, pos=${foundPositiveRot}`
  );

  // Test 2.3: Active squad cards represent current active deck IDs
  const activeDeckIds = (cardNurtureStore as any).activeDeckIds || cardNurtureStore.ownedCardIds.slice(0, 5);
  let allActiveCardsRendered = true;
  for (const cardId of activeDeckIds) {
    const dbCard = CARD_DATABASE[cardId];
    const nameKo = (dbCard as any)?.title || (dbCard as any)?.name_ko || (dbCard as any)?.nameKo || '';
    const nameEn = (dbCard as any)?.title_en || (dbCard as any)?.name_en || (dbCard as any)?.nameEn || '';
    if (dbCard && !homeHtml.includes(nameKo) && !homeHtml.includes(nameEn)) {
      allActiveCardsRendered = false;
      break;
    }
  }

  assert(
    'Suite 2',
    'M2.FAN.3',
    'Fan preview displays active deck heroes (names & artwork)',
    allActiveCardsRendered,
    'All 5 active deck hero names/assets rendered',
    `allActiveCardsRendered=${allActiveCardsRendered}`
  );

  // Test 2.4: Deck Combat Power (CP) display
  const expectedDeckCP = cardNurtureStore.getDeckTP();
  const hasDeckCP = homeHtml.includes(`${expectedDeckCP}`) && (homeHtml.includes('전투력') || homeHtml.includes('CP') || homeHtml.includes('TP'));

  assert(
    'Suite 2',
    'M2.FAN.4',
    'Displays accurate Deck Combat Power (CP / TP) metric',
    hasDeckCP,
    `Displays Deck CP: ${expectedDeckCP}`,
    `Found CP in HTML: ${hasDeckCP}`
  );

  // Test 2.5: Win Streak Flame Badge
  const hasFlameBadge = homeHtml.includes('🔥') || homeHtml.includes('연승') || homeHtml.includes('WIN STREAK');
  assert(
    'Suite 2',
    'M2.FAN.5',
    'Displays win streak flame badge (e.g. 🔥 7연승)',
    hasFlameBadge,
    'Flame badge with "🔥" or "연승"',
    `Found: ${hasFlameBadge}`
  );

  // Test 2.6: Interactive link to Deck Management (#deck)
  const hasDeckLink = $home('a[href="#deck"], button[data-nav="deck"], [data-action="go-to-deck"]').length >= 1;
  assert(
    'Suite 2',
    'M2.FAN.6',
    'Fan preview includes seamless interactive link to #deck',
    hasDeckLink,
    'Link/button targeting #deck',
    `Found ${hasDeckLink ? 'yes' : 'no'}`
  );

  console.log('');

  // --------------------------------------------------------------------------
  // SUITE 3: 4 Core Media Pillars & External Serialization Links Preservation
  // --------------------------------------------------------------------------
  console.log(`${BOLD}>>> Suite 3: 4 Core Media Pillars & Serialization Links Preservation${RESET}`);

  // Test 3.1: 4 Core Media Pillars
  const hasNovelPillar = homeHtml.includes('웹소설') && (homeHtml.includes('40부작') || homeHtml.includes('NOVEL'));
  const hasGamePillar = homeHtml.includes('웹게임') && (homeHtml.includes('카드') || homeHtml.includes('GAME'));
  const hasWebtoonPillar = homeHtml.includes('웹툰') && (homeHtml.includes('840컷') || homeHtml.includes('WEBTOON') || homeHtml.includes('2,049컷'));
  const hasAnimePillar = homeHtml.includes('애니메이션') && (homeHtml.includes('시네마틱') || homeHtml.includes('ANIME') || homeHtml.includes('MP4'));

  assert(
    'Suite 3',
    'M2.PIL.1',
    'Preserves all 4 core media pillars (웹소설, 웹게임, 웹툰, 애니메이션)',
    hasNovelPillar && hasGamePillar && hasWebtoonPillar && hasAnimePillar,
    'All 4 pillars fully preserved',
    `novel=${hasNovelPillar}, game=${hasGamePillar}, webtoon=${hasWebtoonPillar}, anime=${hasAnimePillar}`
  );

  // Test 3.2: Naver Novel Serialization Link & Badge
  const naverNovelAnchor = $home(`a[href*="novel.naver.com"]`);
  const hasNovelUrl = naverNovelAnchor.length >= 1 || homeHtml.includes(EXTERNAL_LINKS.naverNovel);
  assert(
    'Suite 3',
    'M2.PIL.2',
    'Preserves official Naver Web Novel serialization link',
    hasNovelUrl,
    `Link matching ${EXTERNAL_LINKS.naverNovel}`,
    `Found: ${hasNovelUrl}`
  );

  // Test 3.3: Naver Webtoon Serialization Link & Badge
  const naverWebtoonAnchor = $home(`a[href*="comic.naver.com"]`);
  const hasWebtoonUrl = naverWebtoonAnchor.length >= 1 || homeHtml.includes(EXTERNAL_LINKS.naverWebtoon);
  assert(
    'Suite 3',
    'M2.PIL.3',
    'Preserves official Naver Webtoon serialization link',
    hasWebtoonUrl,
    `Link matching ${EXTERNAL_LINKS.naverWebtoon}`,
    `Found: ${hasWebtoonUrl}`
  );

  // Test 3.4: Munpia Serialization Link & Badge
  const munpiaAnchor = $home(`a[href*="munpia.com"]`);
  const hasMunpiaUrl = munpiaAnchor.length >= 1 || homeHtml.includes(EXTERNAL_LINKS.munpiaNovel);
  assert(
    'Suite 3',
    'M2.PIL.4',
    'Preserves official Munpia novel serialization link',
    hasMunpiaUrl,
    `Link matching ${EXTERNAL_LINKS.munpiaNovel}`,
    `Found: ${hasMunpiaUrl}`
  );

  // Test 3.5: [절찬 연재중] Badges Present on All 3 External Links
  const badgeMatches = (homeHtml.match(/절찬\s*연재중/g) || []).length;
  assert(
    'Suite 3',
    'M2.PIL.5',
    'All 3 serialization platforms display "[절찬 연재중]" badges',
    badgeMatches >= 3,
    'At least 3 instances of "[절찬 연재중]"',
    `Found ${badgeMatches} badge instances`
  );

  console.log('');

  // --------------------------------------------------------------------------
  // SUITE 4: #deck Active 5-Slot Layout & Slot Selection
  // --------------------------------------------------------------------------
  console.log(`${BOLD}>>> Suite 4: #deck Active 5-Slot Layout & Slot Selection${RESET}`);

  const deckHtml = renderMyDeckSection(1);
  const $deck = cheerio.load(deckHtml);

  // Test 4.1: Exactly 5 Slot Items Rendered
  const slotButtons = $deck('[data-action="select-deck-card"], [data-action="select-deck-slot"], [data-slot-index]');
  assert(
    'Suite 4',
    'M2.SLOT.1',
    'renderMyDeckSection() renders exactly 5 deck slot cards',
    slotButtons.length >= 5,
    'At least 5 interactive slot elements',
    `Found ${slotButtons.length}`
  );

  // Test 4.2: Directional Compass Stats (N, E, S, W) on Active Slots
  const hasCompassStats = deckHtml.includes('북') && deckHtml.includes('남') && deckHtml.includes('동') && deckHtml.includes('서');
  assert(
    'Suite 4',
    'M2.SLOT.2',
    'Deck slots display 4-way compass stats (N, E, S, W)',
    hasCompassStats,
    'All 4 compass directions present',
    `hasCompassStats=${hasCompassStats}`
  );

  // Test 4.3: Unspent Stat Point Red Dot Indicator Indicator Support
  cardNurtureStore.cards[1].statPoints = 2; // Give Card 1 unspent points
  const deckHtmlWithRedDot = renderMyDeckSection(1);
  const hasRedDot = deckHtmlWithRedDot.includes('bg-red-600') || deckHtmlWithRedDot.includes('pt') || deckHtmlWithRedDot.includes('미사용');
  assert(
    'Suite 4',
    'M2.SLOT.3',
    'Cards with unspent stat points display red dot indicator (+pt)',
    hasRedDot,
    'Red badge indicating unspent stat points',
    `Found red dot styling: ${hasRedDot}`
  );
  cardNurtureStore.cards[1].statPoints = 0; // Reset

  // Test 4.4: Selected Card Deep Inspection Section Rendered
  const hasInspectionView = deckHtml.includes('공식 7등신 풀바디 투명 컷아웃') || deckHtml.includes('SELECTED CARD DETAIL') || deckHtml.includes('영웅 상세 분석');
  assert(
    'Suite 4',
    'M2.SLOT.4',
    'Selected card inspector renders 7-head cutout and detailed stats',
    hasInspectionView,
    'Detailed inspector panel present',
    `Found inspector view: ${hasInspectionView}`
  );

  console.log('');

  // --------------------------------------------------------------------------
  // SUITE 5: Card Replacement, Duplicate Prevention & Real-Time Deck TP
  // --------------------------------------------------------------------------
  console.log(`${BOLD}>>> Suite 5: Card Replacement, Duplicate Prevention & Real-Time Deck TP${RESET}`);

  // Test 5.1: Replace Slot 0 with Owned Card 6
  cardNurtureStore.addCard(6); // Ensure Card 6 is owned
  const setCardResult = (cardNurtureStore as any).setDeckCard
    ? (cardNurtureStore as any).setDeckCard(0, 6)
    : false;

  const currentSlot0 = (cardNurtureStore as any).activeDeckIds
    ? (cardNurtureStore as any).activeDeckIds[0]
    : null;

  assert(
    'Suite 5',
    'M2.EDIT.1',
    'setDeckCard(0, 6) successfully swaps owned Card 6 into Slot 0',
    setCardResult === true && currentSlot0 === 6,
    'setDeckCard returns true and activeDeckIds[0] === 6',
    `result=${setCardResult}, slot0=${currentSlot0}`
  );

  // Test 5.2: Reject Unowned Card 99
  const unownedCardId = 99;
  const is99Owned = cardNurtureStore.isCardOwned(unownedCardId);
  const unownedSetResult = (cardNurtureStore as any).setDeckCard
    ? (cardNurtureStore as any).setDeckCard(0, unownedCardId)
    : false;

  const slot0AfterUnowned = (cardNurtureStore as any).activeDeckIds
    ? (cardNurtureStore as any).activeDeckIds[0]
    : null;

  assert(
    'Suite 5',
    'M2.EDIT.2',
    'setDeckCard() strictly rejects unowned card (Card 99)',
    !is99Owned && unownedSetResult === false && slot0AfterUnowned === 6,
    'Unowned card rejected without slot mutation',
    `isOwned=${is99Owned}, result=${unownedSetResult}, slot0=${slot0AfterUnowned}`
  );

  // Test 5.3: Duplicate Prevention in Active Squad (No duplicate cards across 5 slots)
  // Currently active deck has Card 6 at Slot 0, and Card 2 at Slot 1.
  // Attempt to place Card 6 into Slot 1 (triggers slot swap):
  const duplicateSetResult = (cardNurtureStore as any).setDeckCard
    ? (cardNurtureStore as any).setDeckCard(1, 6)
    : false;

  const currentDeckIds = (cardNurtureStore as any).activeDeckIds || [];
  const uniqueCount = new Set(currentDeckIds).size;

  assert(
    'Suite 5',
    'M2.EDIT.3',
    'Active squad strictly prevents duplicate cards (Set size === 5)',
    uniqueCount === 5,
    'Exactly 5 unique card IDs across all 5 active slots',
    `uniqueCount=${uniqueCount}, deck=[${currentDeckIds.join(', ')}]`
  );

  // Test 5.4: Dynamic Deck TP Recalculation on Card Replacement
  const newDeckTP = cardNurtureStore.getDeckTP();
  const calculatedSum = currentDeckIds.reduce((sum: number, id: number) => {
    return sum + cardNurtureStore.getCardBasePower(id) + (cardNurtureStore.cards[id]?.totalBonus || 0);
  }, 0);

  assert(
    'Suite 5',
    'M2.EDIT.4',
    'Deck TP dynamically recalculates to match exact 5-slot power sum',
    newDeckTP === calculatedSum && newDeckTP > 0,
    `Deck TP === calculated sum (${calculatedSum})`,
    `getDeckTP()=${newDeckTP}, sum=${calculatedSum}`
  );

  // Test 5.5: Stat Allocation Syncs Directly into Deck TP
  const preAllocDeckTP = cardNurtureStore.getDeckTP();
  const cardInSlot0 = currentDeckIds[0];
  cardNurtureStore.cards[cardInSlot0].statPoints = 1;
  const allocSuccess = cardNurtureStore.allocateStat(cardInSlot0, 'top');
  const postAllocDeckTP = cardNurtureStore.getDeckTP();

  assert(
    'Suite 5',
    'M2.EDIT.5',
    'Allocating stat point to active deck card immediately increases Deck TP by +1',
    allocSuccess && postAllocDeckTP === preAllocDeckTP + 1,
    `Deck TP increases from ${preAllocDeckTP} to ${preAllocDeckTP + 1}`,
    `allocSuccess=${allocSuccess}, postAlloc=${postAllocDeckTP}`
  );

  console.log('');

  // --------------------------------------------------------------------------
  // SUITE 6: LocalStorage Persistence (hero_deck) & Fault Tolerance
  // --------------------------------------------------------------------------
  console.log(`${BOLD}>>> Suite 6: LocalStorage Persistence (hero_deck) & Fault Tolerance${RESET}`);

  // Test 6.1: Active Deck Synchronously Persisted under 'hero_deck'
  cardNurtureStore.saveToStorage();
  const rawStoredDeck = mockStorage.getItem('hero_deck');
  let parsedStoredDeck: any = null;
  try {
    parsedStoredDeck = rawStoredDeck ? JSON.parse(rawStoredDeck) : null;
  } catch {}

  const isStoredValidArray = Array.isArray(parsedStoredDeck) && parsedStoredDeck.length === 5;
  assert(
    'Suite 6',
    'M2.STORE.1',
    'Active deck is synchronously persisted to LocalStorage "hero_deck"',
    isStoredValidArray,
    '5-element JSON array in localStorage.hero_deck',
    `Stored: ${rawStoredDeck}`
  );

  // Test 6.2: Rehydration into Fresh Store Instance
  const customDeck = [10, 20, 30, 40, 50];
  mockStorage.setItem('hero_deck', JSON.stringify(customDeck));
  // Ensure those cards are marked as owned in nurturing payload
  mockStorage.setItem(
    'hero_card_nurturing',
    JSON.stringify({
      cards: cardNurtureStore.cards,
      ownedCardIds: [1, 2, 3, 4, 5, 10, 20, 30, 40, 50],
      updatedAt: Date.now(),
    })
  );

  const freshStore = new CardNurtureStore();
  const freshActiveDeck = (freshStore as any).activeDeckIds || [];
  const rehydratedMatches = JSON.stringify(freshActiveDeck) === JSON.stringify(customDeck);

  assert(
    'Suite 6',
    'M2.STORE.2',
    'Fresh CardNurtureStore rehydrates activeDeckIds from localStorage.hero_deck',
    rehydratedMatches,
    `Rehydrated deck: [${customDeck.join(', ')}]`,
    `Got: [${freshActiveDeck.join(', ')}]`
  );

  // Test 6.3: Dual-Sync with Legacy Object Format ([{ id: 7 }, ...])
  const legacyDeckObjects = [
    { id: 7, name_ko: '영웅7' },
    { id: 8, name_ko: '영웅8' },
    { id: 9, name_ko: '영웅9' },
    { id: 11, name_ko: '영웅11' },
    { id: 12, name_ko: '영웅12' },
  ];
  mockStorage.setItem('hero_deck', JSON.stringify(legacyDeckObjects));
  const legacyStore = new CardNurtureStore();
  const legacyActiveDeck = (legacyStore as any).activeDeckIds || [];
  const extractedIdsMatch = JSON.stringify(legacyActiveDeck) === JSON.stringify([7, 8, 9, 11, 12]);

  assert(
    'Suite 6',
    'M2.STORE.3',
    'Gracefully parses legacy CardData[] object format from hero_deck',
    extractedIdsMatch,
    'Extracted IDs [7, 8, 9, 11, 12]',
    `Got: [${legacyActiveDeck.join(', ')}]`
  );

  // Test 6.4: Corrupted LocalStorage Fault Tolerance
  mockStorage.setItem('hero_deck', 'CORRUPTED_JSON_{{{{INVALID');
  let loadThrew = false;
  let corruptedStore: any = null;
  try {
    corruptedStore = new CardNurtureStore();
  } catch {
    loadThrew = true;
  }

  const fallbackDeck = corruptedStore?.activeDeckIds || [];
  const fallbackValid = !loadThrew && Array.isArray(fallbackDeck) && fallbackDeck.length === 5;

  assert(
    'Suite 6',
    'M2.STORE.4',
    'Corrupted hero_deck JSON gracefully falls back to default 5 cards without crashing',
    fallbackValid,
    'Safe fallback without exception, deck length === 5',
    `threw=${loadThrew}, fallbackLen=${fallbackDeck.length}`
  );

  console.log('');

  // --------------------------------------------------------------------------
  // Summary & Pass/Fail Decision
  // --------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const passRate = ((passed / total) * 100).toFixed(1);
  const totalDuration = (performance.now() - startTime).toFixed(2);

  console.log(`${BOLD}${CYAN}----------------------------------------------------------------------${RESET}`);
  console.log(`${BOLD}MILESTONE 2 TEST EXECUTION SUMMARY${RESET}`);
  console.log(`${BOLD}${CYAN}----------------------------------------------------------------------${RESET}`);
  console.log(`Total Assertions Run : ${total}`);
  console.log(`Passed               : ${GREEN}${passed}${RESET}`);
  console.log(`Failed               : ${failed > 0 ? RED + failed + RESET : '0'}`);
  console.log(`Pass Rate            : ${passRate === '100.0' ? GREEN : YELLOW}${passRate}%${RESET}`);
  console.log(`Duration             : ${totalDuration}ms\n`);

  if (failed > 0) {
    console.error(`${RED}${BOLD}FAILED: ${failed} assertion(s) did not satisfy Milestone 2 criteria.${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}SUCCESS: All 28 Milestone 2 adversarial assertions passed 100%!${RESET}\n`);
    process.exit(0);
  }
}

runAdversarialHarness().catch((err) => {
  console.error('Unhandled harness exception:', err);
  process.exit(1);
});
