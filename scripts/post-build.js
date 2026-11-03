import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');

console.log('[post-build] Running post-build enhancements...');

if (!fs.existsSync(distDir)) {
  console.log('[post-build] dist directory does not exist, creating...');
  fs.mkdirSync(distDir, { recursive: true });
}

// 1. Find entry script in dist/home.html first (SPA game bundle), then dist/index.html
let entryScript = '';
const candidateHtmlPaths = [
  path.join(distDir, 'home.html'),
  path.join(distDir, 'index.html'),
];

for (const htmlPath of candidateHtmlPaths) {
  if (fs.existsSync(htmlPath)) {
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const scriptMatch = htmlContent.match(/\/assets\/((?:home|main|index)-[A-Za-z0-9_-]+\.js)/);
    if (scriptMatch && scriptMatch[1]) {
      entryScript = `/assets/${scriptMatch[1]}`;
      console.log(`[post-build] Detected entry script from ${path.basename(htmlPath)}: ${entryScript}`);
      break;
    }
  }
}
if (!entryScript) {
  const assetsDir = path.join(distDir, 'assets');
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir)
      .filter(f => (f.startsWith('home-') || f.startsWith('main-') || f.startsWith('index-')) && f.endsWith('.js'))
      .sort((a, b) => {
        const mtimeA = fs.statSync(path.join(assetsDir, a)).mtimeMs;
        const mtimeB = fs.statSync(path.join(assetsDir, b)).mtimeMs;
        return mtimeB - mtimeA;
      });
    if (files[0]) {
      entryScript = `/assets/${files[0]}`;
      console.log(`[post-build] Detected latest entry script: ${entryScript}`);
    }
  }
}

// 2. Generate version.json
const buildTimestamp = Date.now();
const versionData = {
  version: `2.1.0-${buildTimestamp}`,
  buildTime: new Date(buildTimestamp).toISOString(),
  buildTimestamp,
  service: 'snshero-revolution',
  minRequiredVersion: '2.0.0',
  entryScript: entryScript || '/assets/index.js',
};

fs.writeFileSync(path.join(distDir, 'version.json'), JSON.stringify(versionData, null, 2), 'utf8');
if (fs.existsSync(publicDir)) {
  fs.writeFileSync(path.join(publicDir, 'version.json'), JSON.stringify(versionData, null, 2), 'utf8');
}
console.log('[post-build] Generated version.json');

// 3. Copy metadata.json
const metaSource = path.join(rootDir, 'metadata.json');
if (fs.existsSync(metaSource)) {
  fs.copyFileSync(metaSource, path.join(distDir, 'metadata.json'));
  if (fs.existsSync(publicDir)) {
    fs.copyFileSync(metaSource, path.join(publicDir, 'metadata.json'));
  }
  console.log('[post-build] Synced metadata.json to dist/ and public/');
}

// 4. Generate SPA route directories with index.html for clean URL routing (SEO/AEO/GEO direct crawlable)
const routes = [
  'home', 'bench', 'benchmark', 'shbp', 'reddit', 'play', 'card', 'card-play', 'deck', 'mydeck', 'shop', 'battle', 'market',
  'rank', 'ranking', 'guild', 'novel', 'book', 'webtoon', 'script', 'animation', 'movie', 'cinema', 'event', 'companion',
  'stock', 'community', 'admin', 'status', 'profile',
  'setting', 'share', 'boost', 'creator', 'web3', 'mall',
  // Wiki pages
  'wiki', 'wiki/card', 'wiki/howtoplay', 'wiki/tip',
  // Reddit Subreddits
  'r', 'r/hanguk', 'r/technology', 'r/gaming', 'r/popular', 'r/all', 'r/home', 'r/AskReddit', 'r/memes',
  // Reddit Key Vibecoding Posts
  'r/hanguk/comments/post_vibecoding_master',
  'r/hanguk/comments/post_vibecoding_ep1',
  'r/hanguk/comments/post_vibecoding_ep2',
  'r/hanguk/comments/post_vibecoding_ep3',
  'r/hanguk/comments/post_vibecoding_ep4',
  'r/hanguk/comments/post_vibecoding_ep5',
  'r/technology/comments/post_resource_prompt',
  'r/technology/comments/post_resource_source',
  'r/technology/comments/post_resource_aistudio',
  'r/hanguk/comments/post_resource_cards',
  'r/hanguk/comments/post_resource_channel',
];

const indexPath = path.join(distDir, 'index.html');
const homeHtmlPath = path.join(distDir, 'home.html');

// 4. SPA Route Base Template Selection:
// dist/index.html is preserved as the standalone static landing web service entry.
// All SPA subroutes (deck, play, shop, etc.) and /home are generated from dist/home.html.
const spaTemplatePath = fs.existsSync(homeHtmlPath) ? homeHtmlPath : indexPath;
let cleanBaseHtml = '';

if (fs.existsSync(spaTemplatePath)) {
  console.log(`[post-build] Using SPA base template: ${spaTemplatePath}`);
  const baseHtml = fs.readFileSync(spaTemplatePath, 'utf8');

  // Dedicated prerendered SEO HTML for 'snshero bench'
  const benchTitle = "snshero bench - SNSHero Bench Point (SHBP) AI 1시간 공인 벤치마크 | 눈히어로.com (SNSHero.com - Kadan's Journey)";
  const benchDesc = 'snshero bench는 Claude, GPT, Gemini 등 첨단 AI 모델의 1시간 자율 플레이 성능을 측정하는 눈히어로.com (SNSHero.com) 공인 벤치마크입니다. 256경기 기준 누적 SNSHero Bench Point(SHBP) 점수와 위변조 방지 검증 해시를 제공합니다.';
  const benchUrl = 'https://snshero.com/bench';

  const benchPrerenderArticle = `
    <!-- Static Crawler Pre-render for 'snshero bench' Search Discovery -->
    <article class="seo-bench-prerender" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); whiteSpace: nowrap; border: 0;">
      <h1>snshero bench - SNSHero Bench Point (SHBP) AI 1시간 공인 벤치마크</h1>
      <p>snshero bench는 대규모 언어 모델(Claude, GPT, Gemini)이 1시간 동안 인간의 개입이나 코드 조작, 치팅 없이 눈히어로.com - 카단의 여정 (SNSHero.com - Kadan's Journey) 웹 카드 게임을 스스로 플레이하여 획득하는 공인 누적 스코어 SNSHero Bench Point (SHBP)를 측정하고 검증하는 공식 벤치마크 플랫폼입니다.</p>
      <h2>공식 AI 모델 리더보드 (Official Leaderboard)</h2>
      <ul>
        <li>1위: Claude 3.7 Sonnet - 4,820 SHBP (승률 84.8%, 217승 39패, 검증 해시 SHBP-9A4F-8821)</li>
        <li>2위: Gemini 2.5 Pro - 4,390 SHBP (승률 79.3%, 203승 53패, 검증 해시 SHBP-7C3D-6104)</li>
        <li>3위: GPT-4o - 4,110 SHBP (승률 75.8%, 194승 62패, 검증 해시 SHBP-4E2B-9043)</li>
        <li>4위: Claude 3.5 Sonnet - 3,920 SHBP (승률 72.3%, 185승 71패, 검증 해시 SHBP-3B8A-7192)</li>
        <li>5위: Gemini 2.0 Flash - 3,450 SHBP (승률 65.2%, 167승 89패, 검증 해시 SHBP-2F6C-4911)</li>
        <li>6위: GPT-4o-mini - 2,880 SHBP (승률 57.8%, 148승 108패, 검증 해시 SHBP-1D5E-3284)</li>
      </ul>
      <h2>벤치마크 표준 규격 및 규칙</h2>
      <p>1. 총 256경기(1시간 분량) 공평한 표준 카드 덱에서 시작.</p>
      <p>2. 소스코드 조작 및 클라이언트 메모리 치팅 원천 금지.</p>
      <p>3. 자율적 카드 승리, 상점 팩 개봉, 덱 교체 및 진형 배치 전략 평가.</p>
      <p>4. 128비트 결정론적 시드 및 위변조 방지 해시 발행.</p>
      <p>공식 웹사이트 및 벤치마크 도구: <a href="https://snshero.com/bench">https://snshero.com/bench</a></p>
    </article>
  `;

  let benchCustomHtml = baseHtml
    .replace(/<title>.*?<\/title>/, `<title>${benchTitle}</title>`)
    .replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/, `<meta name="description" content="${benchDesc}" />`)
    .replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/, `<link rel="canonical" href="${benchUrl}" />`)
    .replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/, `<meta property="og:title" content="${benchTitle}" />`)
    .replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/, `<meta property="og:description" content="${benchDesc}" />`)
    .replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/, `<meta property="og:url" content="${benchUrl}" />`)
    .replace(/<meta\s+property="twitter:title"\s+content=".*?"\s*\/?>/, `<meta property="twitter:title" content="${benchTitle}" />`)
    .replace(/<meta\s+property="twitter:description"\s+content=".*?"\s*\/?>/, `<meta property="twitter:description" content="${benchDesc}" />`)
    .replace(/<meta\s+property="twitter:url"\s+content=".*?"\s*\/?>/, `<meta property="twitter:url" content="${benchUrl}" />`);

  if (benchCustomHtml.includes('<div id="root"></div>')) {
    benchCustomHtml = benchCustomHtml.replace('<div id="root"></div>', `<div id="root"></div>\n${benchPrerenderArticle}`);
  }

  // Ensure all asset references inside nested route HTMLs use absolute paths (/assets/ instead of ./assets/)
  const ensureAbsoluteAssetPaths = (html) => {
    return html
      .replace(/(src|href)=["']\.\/assets\//g, '$1="/assets/')
      .replace(/(src|href)=["']assets\//g, '$1="/assets/');
  };

  const cleanBenchHtml = ensureAbsoluteAssetPaths(benchCustomHtml);
  cleanBaseHtml = ensureAbsoluteAssetPaths(baseHtml);

  if (fs.existsSync(homeHtmlPath)) {
    fs.writeFileSync(homeHtmlPath, cleanBaseHtml, 'utf8');
  }

  // Dedicated prerendered SEO HTML for 'novel' / 'book' / 'webtoon' (Naver Web Novel, Naver Webtoon, Munpia Web Novel)
  const novelTitle = "눈히어로.com - 카단의 여정 (SNSHero.com - Kadan's Journey) | 공식 웹소설 & 웹툰 (네이버 웹소설 · 네이버 웹툰 · 문피아)";
  const novelDesc = "눈히어로.com - 카단의 여정 공식 40부작 판타지 웹소설 및 풀컬러 웹툰! 네이버 웹소설(novelId=1250635), 네이버 웹툰(titleId=856677), 문피아 웹소설(novel/616551) 및 눈히어로.com에서 공식 연재 중입니다.";
  const novelPrerenderArticle = `
    <!-- Static Crawler Pre-render for Web Novel & Webtoon Search Discovery (Naver / Munpia) -->
    <article class="seo-novel-prerender" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); whiteSpace: nowrap; border: 0;">
      <h1>눈히어로.com - 카단의 여정 (SNSHero.com - Kadan's Journey) 공식 웹소설 &amp; 웹툰 연재 안내</h1>
      <p>《눈히어로.com - 카단의 여정 (SNSHero.com - Kadan's Journey)》은 평범하고 우직한 청년 카단이 아케인 대륙의 11개 종족과 110명의 영웅들을 만나 성장하는 40부작 정통 모험 판타지 웹소설 및 풀컬러 웹툰입니다.</p>
      <h2>공식 연재 플랫폼 바로가기 (Official Serialization Platforms)</h2>
      <ul>
        <li><a href="http://novel.naver.com/challenge/list?novelId=1250635" target="_blank" rel="noopener">네이버 웹소설 공식 연재 (챌린지리그 novelId=1250635)</a></li>
        <li><a href="https://comic.naver.com/challenge/list?titleId=856677" target="_blank" rel="noopener">네이버 웹툰 공식 연재 (도전만화 titleId=856677)</a></li>
        <li><a href="https://nlink.munpia.com/link/munpia/novel/616551" target="_blank" rel="noopener">문피아 웹소설 공식 연재 (문피아 novel/616551)</a></li>
        <li><a href="https://snshero.com/novel">눈히어로.com 공식 웹소설 라운지 (https://snshero.com/novel)</a></li>
        <li><a href="https://snshero.com/webtoon">눈히어로.com 공식 웹툰 라운지 (https://snshero.com/webtoon)</a></li>
      </ul>
    </article>
  `;

  let novelCustomHtml = baseHtml
    .replace(/<title>.*?<\/title>/, `<title>${novelTitle}</title>`)
    .replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/, `<meta name="description" content="${novelDesc}" />`)
    .replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/, `<meta property="og:title" content="${novelTitle}" />`)
    .replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/, `<meta property="og:description" content="${novelDesc}" />`)
    .replace(/<meta\s+property="twitter:title"\s+content=".*?"\s*\/?>/, `<meta property="twitter:title" content="${novelTitle}" />`)
    .replace(/<meta\s+property="twitter:description"\s+content=".*?"\s*\/?>/, `<meta property="twitter:description" content="${novelDesc}" />`);

  if (novelCustomHtml.includes('<div id="root"></div>')) {
    novelCustomHtml = novelCustomHtml.replace('<div id="root"></div>', `<div id="root"></div>\n${novelPrerenderArticle}`);
  }
  const cleanNovelHtml = ensureAbsoluteAssetPaths(novelCustomHtml);

  for (const route of routes) {
    if (route === '' || route === '/' || route === 'index') {
      continue;
    }

    const publicStaticIndex = path.join(publicDir, route, 'index.html');
    // Only skip dedicated non-SPA static sites (e.g., mirrored Shopify mall in public/mall)
    const isDedicatedStaticSite = route === 'mall' || route.startsWith('mall/');
    if (isDedicatedStaticSite && fs.existsSync(publicStaticIndex)) {
      continue;
    }

    const routeDir = path.join(distDir, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }

    // 0. Legacy standalone routes redirect cleanly to canonical hash routes
    const legacyRoutesToHash = {
      home: '#home',
      'main-lobby': '#home',
      deck: '#deck',
      mydeck: '#deck',
      play: '#play',
      main: '#play',
      card: '#card',
      cards: '#card',
      mission: '#card',
      missions: '#card',
      shop: '#shop',
      store: '#shop',
      mall: '#shop',
      goods: '#shop',
      book: '#book',
      novel: '#book',
      webtoon: '#webtoon',
      webtoo: '#webtoon',
      cartoon: '#webtoon',
      cartoonbook: '#webtoon',
    };

    if (legacyRoutesToHash[route]) {
      const targetHash = legacyRoutesToHash[route];
      const redirectHtml = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>눈히어로.com - 이동 중...</title>
  <meta http-equiv="refresh" content="0; url=/${targetHash}">
  <link rel="canonical" href="https://snshero.com/${targetHash}">
  <script>
    var search = window.location.search || '';
    window.location.replace('/' + '${targetHash}' + search);
  </script>
</head>
<body style="font-family: monospace; padding: 20px; background: #fdfcfc; color: #201d1d;">
  <p>섹션으로 이동 중입니다: <a href="/${targetHash}">/${targetHash}</a></p>
</body>
</html>`;
      // 0a. Write directory index redirect: dist/[route]/index.html (e.g. dist/home/index.html -> /#home)
      fs.writeFileSync(path.join(routeDir, 'index.html'), redirectHtml, 'utf8');

      // 0b. Write clean flat file: dist/[route].html ONLY for non-home legacy routes.
      // CRITICAL GUARD: dist/home.html is Vite's compiled master React SPA template containing
      // the full application bundle, #root mount point, and early client-side hash redirect.
      // It must strictly NEVER be overwritten with a redirect stub. Overwriting dist/home.html
      // destroys downstream generators (dist/404.html, generate-news-seo.ts, generate-video-seo.ts).
      const flatHtmlPath = path.join(distDir, `${route}.html`);
      const isProtectedTemplate =
        route === 'home' ||
        flatHtmlPath === homeHtmlPath ||
        flatHtmlPath === indexPath ||
        path.relative(distDir, flatHtmlPath) === 'home.html' ||
        path.relative(distDir, flatHtmlPath) === 'index.html';

      if (!isProtectedTemplate) {
        const flatHtmlDir = path.dirname(flatHtmlPath);
        if (!fs.existsSync(flatHtmlDir)) {
          fs.mkdirSync(flatHtmlDir, { recursive: true });
        }
        fs.writeFileSync(flatHtmlPath, redirectHtml, 'utf8');
      }
      continue;
    }

    // 1. Determine HTML content for the route
    let targetHtml = cleanBaseHtml;
    if (route === 'bench' || route === 'benchmark' || route === 'shbp') {
      targetHtml = cleanBenchHtml;
    } else if (route === 'novel' || route === 'book' || route === 'webtoon') {
      const routeCanonical = `https://snshero.com/${route}`;
      targetHtml = cleanNovelHtml
        .replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/, `<link rel="canonical" href="${routeCanonical}" />`)
        .replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/, `<meta property="og:url" content="${routeCanonical}" />`)
        .replace(/<meta\s+property="twitter:url"\s+content=".*?"\s*\/?>/, `<meta property="twitter:url" content="${routeCanonical}" />`);
    }

    // 2. Write directory index: dist/[route]/index.html
    fs.writeFileSync(path.join(routeDir, 'index.html'), targetHtml, 'utf8');

    // 3. Write clean URL extensionless file: dist/[route].html for ALL routes (flat & nested)
    const flatHtmlPath = path.join(distDir, `${route}.html`);
    // Strict isolation guard: never overwrite dist/index.html (standalone landing) or dist/home.html (master SPA template)
    const isProtectedMasterTemplate =
      flatHtmlPath === indexPath ||
      flatHtmlPath === homeHtmlPath ||
      path.relative(distDir, flatHtmlPath) === 'index.html' ||
      path.relative(distDir, flatHtmlPath) === 'home.html';

    if (!isProtectedMasterTemplate) {
      const flatHtmlDir = path.dirname(flatHtmlPath);
      if (!fs.existsSync(flatHtmlDir)) {
        fs.mkdirSync(flatHtmlDir, { recursive: true });
      }
      fs.writeFileSync(flatHtmlPath, targetHtml, 'utf8');
    }
  }
  console.log(`[post-build] Generated ${routes.length} static SPA route fallback pages (including .html root clean URLs)`);
}

// 4.1 Ensure public/gwent is copied to dist/gwent
const publicGwentDir = path.join(publicDir, 'gwent');
const distGwentDir = path.join(distDir, 'gwent');
if (fs.existsSync(publicGwentDir) && !fs.existsSync(path.join(distGwentDir, 'index.html'))) {
  fs.cpSync(publicGwentDir, distGwentDir, { recursive: true });
  console.log('[post-build] Synced public/gwent to dist/gwent');
}

// 5. Ensure 404.html fallback (uses SPA template so deep links load client-side router)
const notFoundPath = path.join(distDir, '404.html');
const templateFor404 = fs.existsSync(homeHtmlPath) ? homeHtmlPath : indexPath;
if (fs.existsSync(templateFor404)) {
  fs.writeFileSync(notFoundPath, cleanBaseHtml, 'utf8');
  console.log(`[post-build] Generated 404.html with absolute asset paths from ${path.basename(templateFor404)}`);
}

// 6. Run Google News SEO & AdSense Static Prerenderer
try {
  console.log('[post-build] Running Google News SEO & AdSense static generator...');
  execSync(`npx tsx scripts/generate-news-seo.ts --template "${spaTemplatePath}"`, {
    stdio: 'inherit',
    env: { ...process.env, SPA_TEMPLATE_PATH: spaTemplatePath }
  });
} catch (e) {
  console.warn('[post-build] Warning: Google News SEO generator encountered an issue:', e.message);
}

// 7. Run Google Video SEO/GEO/AEO Static Prerenderer (Animation 40 + Movie 40)
try {
  console.log('[post-build] Running Google Video SEO/GEO/AEO static generator...');
  execSync(`npx tsx scripts/generate-video-seo.ts --template "${spaTemplatePath}"`, {
    stdio: 'inherit',
    env: { ...process.env, SPA_TEMPLATE_PATH: spaTemplatePath }
  });
} catch (e) {
  console.warn('[post-build] Warning: Google Video SEO generator encountered an issue:', e.message);
}

console.log('[post-build] Post-build completed successfully.');
