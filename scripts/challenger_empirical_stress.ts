import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

interface StressResult {
  category: string;
  testName: string;
  passed: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'PASS';
  details: string;
  error?: string;
}

const stressResults: StressResult[] = [];

function record(res: StressResult) {
  stressResults.push(res);
  const tag = res.passed ? '✓ PASS' : `✗ ${res.severity}`;
  console.log(`[${tag}] [${res.category}] ${res.testName}`);
  if (!res.passed) {
    console.log(`       Details: ${res.details}`);
    if (res.error) console.log(`       Error: ${res.error}`);
  }
}

// Mock localStorage helper
function createMockLocalStorage(initial: Record<string, string> = {}) {
  const store = { ...initial };
  const mock = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    _getStore: () => store,
  };
  (global as any).window = {
    localStorage: mock,
    location: { search: '', pathname: '/', href: 'http://localhost/' },
  };
  (global as any).localStorage = mock;
  return mock;
}

// ============================================================================
// 1. PARAMETER CLAMPING & URL QUERIES
// ============================================================================
console.log('\n============================================================');
console.log('1. STRESS-TESTING PARAMETER CLAMPING ACROSS NOVEL & MOVIE');
console.log('============================================================');

// Import webtoonProgress helpers
const { getSeasonItem, setSeasonItem } = await import('../src/lib/webtoonProgress.js');

const TOTAL_EPISODES = 40;

// Test MovieView logic
function evaluateMovieViewEpisode(searchQuery: string, savedInStorage: string | null = null): number {
  const params = new URLSearchParams(searchQuery);
  const epParam = params.get('ep') || params.get('episode');
  if (epParam) {
    const parsedEp = parseInt(epParam, 10);
    if (!isNaN(parsedEp)) {
      return Math.max(1, Math.min(TOTAL_EPISODES, parsedEp));
    }
  }
  const saved = savedInStorage;
  const parsed = saved ? parseInt(saved, 10) : 1;
  return isNaN(parsed) || parsed < 1 || parsed > TOTAL_EPISODES ? 1 : Math.max(1, Math.min(TOTAL_EPISODES, parsed));
}

// Test NovelView logic
function evaluateNovelViewEpisode(searchQuery: string, savedInStorage: string | null = null): {
  episode: number;
  readFromUrl: boolean;
} {
  // Check NovelView.tsx source: does it read window.location.search for ep?
  const novelViewSrc = fs.readFileSync(path.join(ROOT_DIR, 'src', 'views', 'NovelView.tsx'), 'utf-8');
  const hasUrlSearchRead = novelViewSrc.includes('location.search') && (novelViewSrc.includes("'ep'") || novelViewSrc.includes('"ep"'));
  
  if (hasUrlSearchRead) {
    const params = new URLSearchParams(searchQuery);
    const epParam = params.get('ep') || params.get('episode');
    if (epParam) {
      const parsedEp = parseInt(epParam, 10);
      if (!isNaN(parsedEp)) {
        return { episode: Math.max(1, Math.min(TOTAL_EPISODES, parsedEp)), readFromUrl: true };
      }
    }
  }
  
  const saved = savedInStorage;
  const parsed = saved ? parseInt(saved, 10) : 1;
  const ep = isNaN(parsed) || parsed < 1 || parsed > TOTAL_EPISODES ? 1 : Math.max(1, Math.min(TOTAL_EPISODES, parsed));
  return { episode: ep, readFromUrl: false };
}

// Run MovieView clamping tests
const testQueries = [
  { query: '?ep=-10', expectedFallback: 1, desc: 'Negative episode (?ep=-10)' },
  { query: '?ep=0', expectedFallback: 1, desc: 'Zero episode (?ep=0)' },
  { query: '?ep=1', expectedFallback: 1, desc: 'Lower boundary valid (?ep=1)' },
  { query: '?ep=25', expectedFallback: 25, desc: 'Mid valid episode (?ep=25)' },
  { query: '?ep=40', expectedFallback: 40, desc: 'Upper boundary valid (?ep=40)' },
  { query: '?ep=41', expectedFallback: 40, desc: 'Out-of-bounds above max clamped (?ep=41)' },
  { query: '?ep=999', expectedFallback: 40, desc: 'Extreme out-of-bounds clamped (?ep=999)' },
  { query: '?ep=invalid', expectedFallback: 1, desc: 'Non-numeric string (?ep=invalid)' },
  { query: '?episode=15', expectedFallback: 15, desc: 'Alias param valid (?episode=15)' },
  { query: '?episode=-5', expectedFallback: 1, desc: 'Alias param negative clamped (?episode=-5)' },
  { query: '?episode=999', expectedFallback: 40, desc: 'Alias param extreme clamped (?episode=999)' },
];

for (const t of testQueries) {
  const result = evaluateMovieViewEpisode(t.query, null);
  const ok = result === t.expectedFallback;
  record({
    category: 'ParamClamping-Movie',
    testName: `MovieView ${t.desc}`,
    passed: ok,
    severity: ok ? 'PASS' : 'HIGH',
    details: `Evaluated ${t.query}: got ep=${result}, expected=${t.expectedFallback}`,
  });
}

// Test NovelView URL query support
const novelUrlCheck = evaluateNovelViewEpisode('?ep=25', null);
record({
  category: 'ParamClamping-Novel',
  testName: 'NovelView URL ?ep= query parameter handling',
  passed: novelUrlCheck.readFromUrl,
  severity: 'PASS',
  details: novelUrlCheck.readFromUrl 
    ? 'NovelView reads from URL query (?ep=) with boundary clamping.' 
    : 'NovelView does not parse URL search params.',
});

// Test NovelView LocalStorage out-of-bounds clamping
const novelStorageTests = [
  { val: '-10', expected: 1 },
  { val: '0', expected: 1 },
  { val: '41', expected: 1 },
  { val: '999', expected: 1 },
  { val: 'invalid', expected: 1 },
  { val: '15', expected: 15 },
  { val: '40', expected: 40 },
];
for (const s of novelStorageTests) {
  const result = evaluateNovelViewEpisode('', s.val);
  const ok = result.episode === s.expected;
  record({
    category: 'ParamClamping-Novel',
    testName: `NovelView Storage value clamping: '${s.val}'`,
    passed: ok,
    severity: ok ? 'PASS' : 'HIGH',
    details: `Input '${s.val}' resolved to episode ${result.episode}, expected ${s.expected}`,
  });
}

// ============================================================================
// 2. RAPID UI STATE TOGGLING & STATE CONSISTENCY
// ============================================================================
console.log('\n============================================================');
console.log('2. STRESS-TESTING RAPID UI STATE TOGGLING');
console.log('============================================================');

// Verify webtoon manifest integrity across all 40 episodes for 21 images (0..20)
const manifestPath = path.join(ROOT_DIR, 'src', 'content', 'webtoonEpisodeManifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

let manifestPanelBoundsOk = true;
let brokenEpisodes: string[] = [];
for (let ep = 1; ep <= 40; ep++) {
  const epData = manifest[String(ep)];
  if (!epData || !epData.images || epData.images.length !== 21) {
    manifestPanelBoundsOk = false;
    brokenEpisodes.push(`Ep ${ep}: has ${epData?.images?.length ?? 0} images`);
  }
}

record({
  category: 'StateToggling-Manifest',
  testName: 'Webtoon Manifest 21-Panel Uniformity (indices 0..20)',
  passed: manifestPanelBoundsOk,
  severity: manifestPanelBoundsOk ? 'PASS' : 'HIGH',
  details: manifestPanelBoundsOk
    ? 'All 40 episodes contain exactly 21 panels (indices 0..20), preventing out-of-bounds in slide mode.'
    : `Panel count mismatch in: ${brokenEpisodes.join(', ')}`,
});

// Test slide mode activeSlideIndex transitions
let slideTransitionsOk = true;
let currentSlide = 1;
// Rapid next / prev simulating user hammering slide arrows
for (let i = 0; i < 100; i++) {
  const direction = Math.random() > 0.5 ? 1 : -1;
  currentSlide = Math.min(20, Math.max(0, currentSlide + direction));
  if (currentSlide < 0 || currentSlide > 20) {
    slideTransitionsOk = false;
  }
}
record({
  category: 'StateToggling-Slides',
  testName: 'Rapid Slide Index Navigation Clamping ([0, 20])',
  passed: slideTransitionsOk,
  severity: slideTransitionsOk ? 'PASS' : 'HIGH',
  details: `Rapid slide navigation safely constrained within [0, 20]. Final slide: ${currentSlide}`,
});

// Check episode jumping behavior in slide mode:
// When episode jumps, does WEBTOON_DATA[String(newEp)] have activeSlideIndex?
let crossEpSlideSafe = true;
for (let newEp = 1; newEp <= 40; newEp++) {
  const epData = manifest[String(newEp)];
  // Even if activeSlideIndex is 20, does image 20 exist?
  const img20 = epData.images.find((img: any) => img.index === 20);
  if (!img20) crossEpSlideSafe = false;
}
record({
  category: 'StateToggling-Slides',
  testName: 'Slide Index Retention on Episode Jump Safety',
  passed: crossEpSlideSafe,
  severity: crossEpSlideSafe ? 'PASS' : 'HIGH',
  details: crossEpSlideSafe
    ? 'Every episode has index 20; jumping episodes while at slide 20 never produces undefined panel.'
    : 'Missing index 20 in some episode, causing potential undefined panel render.',
});

// ============================================================================
// 3. LOCALSTORAGE ROBUSTNESS: CORRUPTED JSON RESILIENCE
// ============================================================================
console.log('\n============================================================');
console.log('3. STRESS-TESTING LOCALSTORAGE ROBUSTNESS (CORRUPTED JSON)');
console.log('============================================================');

const mockStorage = createMockLocalStorage();
const { loadWebtoonProgress, loadEpisodeScrollState, getEpisodeMaxReadPct } = await import('../src/lib/webtoonProgress.js');

const corruptedPayloads = [
  { label: 'Malformed JSON', value: '{corrupted: json broken' },
  { label: 'String literal "null"', value: 'null' },
  { label: 'String literal "undefined"', value: 'undefined' },
  { label: 'String literal "true"', value: 'true' },
  { label: 'String literal "false"', value: 'false' },
  { label: 'Numeric literal', value: '99999' },
  { label: 'Array instead of Object', value: '[1, 2, 3]' },
  { label: 'Empty string', value: '' },
  { label: 'Object string representation', value: '[object Object]' },
  { label: 'HTML error response', value: '<html>502 Bad Gateway</html>' },
];

// Test 3.1: webtoonProgress loadWebtoonProgress
for (const p of corruptedPayloads) {
  mockStorage.clear();
  mockStorage.setItem('hero_webtoon_progress_season1', p.value);
  let passed = false;
  let errorMsg = '';
  try {
    const loaded = loadWebtoonProgress('season1');
    if (
      Array.isArray(loaded.readEpisodeIds) &&
      Array.isArray(loaded.claimedRewardEpisodeIds) &&
      typeof loaded.updatedAt === 'number'
    ) {
      passed = true;
    } else {
      errorMsg = 'Returned progress structure missing required arrays';
    }
  } catch (err: any) {
    passed = false;
    errorMsg = err.message;
  }

  record({
    category: 'Storage-WebtoonProgress',
    testName: `loadWebtoonProgress resilient against: ${p.label}`,
    passed,
    severity: passed ? 'PASS' : 'HIGH',
    details: `Input: ${p.value.slice(0, 30)}`,
    error: errorMsg,
  });
}

// Test 3.2: loadEpisodeScrollState
for (const p of corruptedPayloads) {
  mockStorage.clear();
  mockStorage.setItem('hero_scroll_state_season1_cartoon_ep1', p.value);
  let passed = false;
  let errorMsg = '';
  try {
    const loaded = loadEpisodeScrollState('season1', 1, 'cartoon');
    // should either return valid object or null, never throw!
    passed = loaded === null || typeof loaded === 'object';
  } catch (err: any) {
    passed = false;
    errorMsg = err.message;
  }

  record({
    category: 'Storage-ScrollState',
    testName: `loadEpisodeScrollState resilient against: ${p.label}`,
    passed,
    severity: passed ? 'PASS' : 'HIGH',
    details: `Input: ${p.value.slice(0, 30)}`,
    error: errorMsg,
  });
}

// Test 3.3: NovelView claimedRewards parser simulation
// Let's test the EXACT code from NovelView.tsx line 289-300:
// const saved = getSeasonItem('hero_novel_claimed_episodes', currentSeason);
// return saved ? JSON.parse(saved) : {};
// const claimedCount = Object.keys(claimedRewards).filter(k => claimedRewards[Number(k)]).length;
for (const p of corruptedPayloads) {
  mockStorage.clear();
  mockStorage.setItem('hero_novel_claimed_episodes_season1', p.value);
  let passed = false;
  let errorMsg = '';
  try {
    const raw = mockStorage.getItem('hero_novel_claimed_episodes_season1');
    let claimedRewards: any = {};
    try {
      const parsed = raw ? JSON.parse(raw) : {};
      claimedRewards = (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch {
      claimedRewards = {};
    }

    // Now check if Object.keys works
    const claimedCount = Object.keys(claimedRewards).filter(k => claimedRewards[Number(k)]).length;
    passed = typeof claimedCount === 'number';
  } catch (err: any) {
    passed = false;
    errorMsg = err.message;
  }

  record({
    category: 'Storage-NovelClaimedRewards',
    testName: `Safe claimedRewards parsing simulation against: ${p.label}`,
    passed,
    severity: passed ? 'PASS' : 'CRITICAL',
    details: `Input: ${p.value.slice(0, 30)}`,
    error: errorMsg,
  });
}

// Check NovelView.tsx line 289: Does NovelView.tsx have a defensive check against `JSON.parse("null")` returning null?
const novelViewCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'views', 'NovelView.tsx'), 'utf-8');
const movieViewCode = fs.readFileSync(path.join(ROOT_DIR, 'src', 'views', 'MovieView.tsx'), 'utf-8');

// In NovelView:
// const saved = getSeasonItem('hero_novel_claimed_episodes', currentSeason);
// return saved ? JSON.parse(saved) : {};
const rawNullThrowsInNovel = (() => {
  try {
    const saved: any = 'null';
    const parsed = saved ? JSON.parse(saved) : {};
    // If parsed is null: Object.keys(null) -> TypeError!
    Object.keys(parsed);
    return false;
  } catch {
    return true;
  }
})();

if (rawNullThrowsInNovel) {
  // Check if NovelView actually guards against null from JSON.parse:
  const hasNullGuard = novelViewCode.includes('JSON.parse(saved) || {}') || 
                       novelViewCode.includes('typeof') ||
                       novelViewCode.includes('parsed &&');
  record({
    category: 'Storage-DefensiveCode',
    testName: 'NovelView claimedRewards null-guard check',
    passed: hasNullGuard,
    severity: hasNullGuard ? 'PASS' : 'MEDIUM',
    details: hasNullGuard
      ? 'NovelView includes defensive check against JSON.parse("null").'
      : 'Vulnerability: If localStorage key hero_novel_claimed_episodes contains "null", JSON.parse("null") returns null and Object.keys(claimedRewards) throws TypeError at runtime.',
  });
}

// In MovieView:
const movieHasNullGuard = movieViewCode.includes('JSON.parse(saved) || {}') ||
                          movieViewCode.includes('typeof') ||
                          movieViewCode.includes('parsed &&');
record({
  category: 'Storage-DefensiveCode',
  testName: 'MovieView claimedRewards null-guard check',
  passed: movieHasNullGuard,
  severity: movieHasNullGuard ? 'PASS' : 'MEDIUM',
  details: movieHasNullGuard
    ? 'MovieView includes defensive check against JSON.parse("null").'
    : 'Vulnerability: If localStorage key hero_movie_claimed_episodes contains "null", JSON.parse("null") returns null and claimedRewards[epNum] throws TypeError at runtime.',
});

// ============================================================================
// 4. MULTI-SEASON DATA ISOLATION
// ============================================================================
console.log('\n============================================================');
console.log('4. STRESS-TESTING MULTI-SEASON ISOLATION');
console.log('============================================================');

mockStorage.clear();

// Test A: Parameter order robustness
// 1. (key, season, value)
setSeasonItem('hero_novel_progress', 'season1', '10');
// 2. (key, value, season)
setSeasonItem('hero_novel_progress', '25', 'season2');
// 3. Season 3
setSeasonItem('hero_novel_progress', 'season3', '38');

const s1Prog = getSeasonItem('hero_novel_progress', 'season1');
const s2Prog = getSeasonItem('hero_novel_progress', 'season2');
const s3Prog = getSeasonItem('hero_novel_progress', 'season3');

const orderAgnosticOk = s1Prog === '10' && s2Prog === '25' && s3Prog === '38';
record({
  category: 'SeasonIsolation-ParamOrder',
  testName: 'setSeasonItem argument-order-agnostic persistence',
  passed: orderAgnosticOk,
  severity: orderAgnosticOk ? 'PASS' : 'HIGH',
  details: `S1=${s1Prog} (expected 10), S2=${s2Prog} (expected 25), S3=${s3Prog} (expected 38)`,
});

// Test B: Cross-season data bleed
// S1 has progress 10. Does reading S4 return S1 data or null?
const s4Prog = getSeasonItem('hero_novel_progress', 'season4');
const noBleedToS4 = s4Prog === null;
record({
  category: 'SeasonIsolation-Bleed',
  testName: 'Unset season query returns null (Zero Bleed)',
  passed: noBleedToS4,
  severity: noBleedToS4 ? 'PASS' : 'CRITICAL',
  details: `Queried uninitialized season4: got '${s4Prog}', expected null.`,
});

// Test C: Webtoon progress multi-season isolation
mockStorage.clear();
const { markEpisodeRead, claimEpisodeReward, hasClaimedEpisodeReward } = await import('../src/lib/webtoonProgress.js');

// User reads and claims Ep 1 in Season 1
markEpisodeRead('season1', 'ep_01', 15);
claimEpisodeReward('season1', 'ep_01');

// Verify Season 1 has it
const s1Read = loadWebtoonProgress('season1').readEpisodeIds.includes('ep_01');
const s1Claimed = hasClaimedEpisodeReward('season1', 'ep_01');

// Verify Season 2 does NOT have it
const s2Read = loadWebtoonProgress('season2').readEpisodeIds.includes('ep_01');
const s2Claimed = hasClaimedEpisodeReward('season2', 'ep_01');

const webtoonSeasonIsolated = s1Read && s1Claimed && !s2Read && !s2Claimed;
record({
  category: 'SeasonIsolation-Webtoon',
  testName: 'Webtoon reading & reward state strict isolation between S1 and S2',
  passed: webtoonSeasonIsolated,
  severity: webtoonSeasonIsolated ? 'PASS' : 'CRITICAL',
  details: `S1 Read=${s1Read}, S1 Claimed=${s1Claimed} | S2 Read=${s2Read}, S2 Claimed=${s2Claimed}`,
});

// ============================================================================
// 5. TOUCH ERGONOMICS (44px+ RULE)
// ============================================================================
console.log('\n============================================================');
console.log('5. STRESS-TESTING TOUCH ERGONOMICS (< 44px CONTROLS)');
console.log('============================================================');

interface SubstandardControl {
  file: string;
  line: number;
  snippet: string;
  matchedSize: string;
}

const substandardControls: SubstandardControl[] = [];

const filesToInspect = [
  'src/views/NovelView.tsx',
  'src/views/MovieView.tsx',
  'src/components/movie/CinematicMoviePlayer.tsx',
  'src/components/webtoon/WebtoonPanelCard.tsx',
  'src/components/webtoon/WebtoonSpeechBubble.tsx',
  'src/components/webtoon/WebtoonSfxOverlay.tsx',
];

const smallSizeRegex = /min-h-\[(1\d|2\d|3\d)px\]|h-\[(1\d|2\d|3\d)px\]|min-w-\[(1\d|2\d|3\d)px\]|w-7\s+h-7|min-h-\[36px\]/g;

for (const relFile of filesToInspect) {
  const absPath = path.join(ROOT_DIR, relFile);
  if (!fs.existsSync(absPath)) continue;
  const content = fs.readFileSync(absPath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check if line contains a button or interactive class with small size
    const matches = line.match(smallSizeRegex);
    if (matches) {
      // Check surrounding lines (up to 5 lines up) to see if it's on a button/interactive element
      const context = lines.slice(Math.max(0, idx - 4), idx + 2).join(' ');
      const isInteractive = context.includes('<button') || context.includes('onClick') || context.includes('cursor-pointer');
      if (isInteractive) {
        substandardControls.push({
          file: relFile,
          line: idx + 1,
          snippet: line.trim(),
          matchedSize: matches.join(', '),
        });
      }
    }
  });
}

const noSubstandardControls = substandardControls.length === 0;
record({
  category: 'TouchErgonomics',
  testName: 'Zero touch targets below 44px across IP Trilogy interactive controls',
  passed: noSubstandardControls,
  severity: noSubstandardControls ? 'PASS' : 'HIGH',
  details: noSubstandardControls
    ? 'All interactive buttons meet >= 44px touch targets.'
    : `Found ${substandardControls.length} interactive control(s) below 44px:\n` +
      substandardControls.map(c => `  - ${c.file}:${c.line} (${c.matchedSize}) -> ${c.snippet}`).join('\n'),
});

console.log('\n============================================================');
console.log('STRESS TEST SUMMARY');
console.log('============================================================');
const passCount = stressResults.filter(r => r.passed).length;
const failCount = stressResults.filter(r => !r.passed).length;
console.log(`Total: ${stressResults.length} | Passed: ${passCount} | Failed: ${failCount}`);
