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

// 1. Find entry script in dist/assets
let entryScript = '';
const assetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  const indexJs = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
  if (indexJs) {
    entryScript = `/assets/${indexJs}`;
    console.log(`[post-build] Detected entry script: ${entryScript}`);
  }
}

// 2. Generate version.json
const versionData = {
  version: '2.1.0',
  buildTime: new Date().toISOString(),
  buildTimestamp: Date.now(),
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
  'home', 'bench', 'benchmark', 'shbp', 'reddit', 'play', 'card-play', 'deck', 'mydeck', 'shop', 'battle', 'market',
  'ranking', 'guild', 'novel', 'book', 'webtoon', 'animation', 'movie', 'cinema', 'event', 'companion',
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
if (fs.existsSync(indexPath)) {
  const baseHtml = fs.readFileSync(indexPath, 'utf8');

  // Dedicated prerendered SEO HTML for 'snshero bench'
  const benchTitle = 'snshero bench - SNSHero Bench Point (SHBP) AI 1시간 공인 벤치마크 | SNS히어로';
  const benchDesc = 'snshero bench는 Claude, GPT, Gemini 등 첨단 AI 모델의 1시간 자율 플레이 성능을 측정하는 공인 벤치마크입니다. 256경기 기준 누적 SNSHero Bench Point(SHBP) 점수와 위변조 방지 검증 해시를 제공합니다.';
  const benchUrl = 'https://snshero.com/bench';

  const benchPrerenderArticle = `
    <!-- Static Crawler Pre-render for 'snshero bench' Search Discovery -->
    <article class="seo-bench-prerender" style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); whiteSpace: nowrap; border: 0;">
      <h1>snshero bench - SNSHero Bench Point (SHBP) AI 1시간 공인 벤치마크</h1>
      <p>snshero bench는 대규모 언어 모델(Claude, GPT, Gemini)이 1시간 동안 인간의 개입이나 코드 조작, 치팅 없이 SNS히어로 웹 카드 게임을 스스로 플레이하여 획득하는 공인 누적 스코어 SNSHero Bench Point (SHBP)를 측정하고 검증하는 공식 벤치마크 플랫폼입니다.</p>
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
  const cleanBaseHtml = ensureAbsoluteAssetPaths(baseHtml);

  for (const route of routes) {
    const publicStaticIndex = path.join(publicDir, route, 'index.html');
    if (fs.existsSync(publicStaticIndex)) {
      // Do not overwrite real static games/pages that already exist in public/
      continue;
    }

    const routeDir = path.join(distDir, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }

    if (route === 'bench' || route === 'benchmark' || route === 'shbp') {
      fs.writeFileSync(path.join(routeDir, 'index.html'), cleanBenchHtml, 'utf8');
      fs.writeFileSync(path.join(distDir, `${route}.html`), cleanBenchHtml, 'utf8');
    } else {
      fs.writeFileSync(path.join(routeDir, 'index.html'), cleanBaseHtml, 'utf8');
      if (!route.includes('/')) {
        fs.writeFileSync(path.join(distDir, `${route}.html`), cleanBaseHtml, 'utf8');
      }
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

// 5. Ensure 404.html fallback
const notFoundPath = path.join(distDir, '404.html');
if (fs.existsSync(indexPath) && !fs.existsSync(notFoundPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('[post-build] Generated 404.html from index.html');
}

// 6. Run Google News SEO & AdSense Static Prerenderer
try {
  console.log('[post-build] Running Google News SEO & AdSense static generator...');
  execSync('npx tsx scripts/generate-news-seo.ts', { stdio: 'inherit' });
} catch (e) {
  console.warn('[post-build] Warning: Google News SEO generator encountered an issue:', e.message);
}

// 7. Run Google Video SEO/GEO/AEO Static Prerenderer (Animation 40 + Movie 40)
try {
  console.log('[post-build] Running Google Video SEO/GEO/AEO static generator...');
  execSync('npx tsx scripts/generate-video-seo.ts', { stdio: 'inherit' });
} catch (e) {
  console.warn('[post-build] Warning: Google Video SEO generator encountered an issue:', e.message);
}

console.log('[post-build] Post-build completed successfully.');
