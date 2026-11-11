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
  'home', 'bench', 'benchmark', 'shbp', 'reddit', 'play', 'card', 'card-play', 'deck', 'mydeck', 'shop', 'market',
  'rank', 'ranking', 'guild', 'novel', 'book', 'webtoon', 'script', 'animation', 'movie', 'cinema', 'event', 'companion',
  'stock', 'community', 'admin', 'status', 'profile',
  'setting', 'settings', 'share', 'boost', 'creator', 'web3', 'mall',
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
    // Only skip dedicated sub-static sites (e.g., mirrored assets in public/mall/cdn)
    const isDedicatedStaticSite = route.startsWith('mall/');
    if (isDedicatedStaticSite && fs.existsSync(publicStaticIndex)) {
      continue;
    }

    const routeDir = path.join(distDir, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }

    // 0. Comprehensive SEO/GEO/AEO prerender for SPA canonical routes
    const ROUTE_SEO_MAP = {
      home: {
        hash: '#home',
        title: "눈히어로.com - 카단의 여정 (SNSHero.com) | 원클릭 AI 웹 카드 배틀 RPG",
        description: "복잡한 설치나 회원가입 없이 클릭 한 번으로 즐기는 차세대 인공지능(AI) 웹 카드 배틀 게임 눈히어로.com! 110종의 영웅 카드, 11대 원소 종족, 3x3 전술 보드 배틀, 40부작 공식 웹소설 및 풀컬러 웹툰을 즉시 무료로 플레이하세요.",
        type: "WebApplication",
        keywords: "눈히어로, SNSHero, 카단의 여정, AI 카드 게임, 웹 카드 배틀, TCG, 웹소설, 웹툰, 3x3 배틀",
        h1: "눈히어로.com - 카단의 여정 (SNSHero.com) 공식 웹 카드 게임",
        h2: "110종 영웅 수집 · 11대 원소 시너지 · 3x3 턴제 전술 배틀 · 40부작 판타지 대서사시",
        faqs: [
          { q: "눈히어로.com은 어떤 게임인가요?", a: "별도의 클라이언트 앱 설치 없이 브라우저에서 원클릭으로 즐기는 100% 로컬스토리지 기반 차세대 AI 웹 카드 배틀 RPG입니다." },
          { q: "과금 없이도 무료로 즐길 수 있나요?", a: "네, 첫 접속 시 1,000 SNS 코인과 무료 카드팩 소환 기회가 주어지며, 40부작 모험과 110종 미니게임을 통해 모든 카드를 획득할 수 있습니다." }
        ]
      },
      deck: {
        hash: '#deck',
        title: "마이덱 (My Deck) - 눈히어로.com | 110종 영웅 덱 편성 및 성장",
        description: "눈히어로.com 마이덱 관리 센터. 내가 수집한 110종 영웅 카드의 공격력, 방어력, N/E/S/W 4방향 스탯을 확인하고 5장의 최강 덱을 편성하세요. 레벨업, 잠재력 강화 및 11대 원소 시너지 조합을 제공합니다.",
        type: "CollectionPage",
        keywords: "눈히어로 마이덱, SNSHero 덱 편성, 카드 육성, 영웅 강화, TCG 덱 빌딩, 110종 영웅, 원소 시너지",
        h1: "눈히어로.com 마이덱 관리 및 전략 덱 빌더",
        h2: "5인 영웅 최강 덱 편성 · 잠재력 강화 · 11대 종족 시너지 극대화",
        faqs: [
          { q: "덱은 몇 장의 카드로 구성되나요?", a: "3x3 전장에 출전할 5장의 대표 영웅 카드로 덱을 구성하며, 종족 및 원소 공명에 따라 보너스 버프가 발동합니다." }
        ]
      },
      play: {
        hash: '#play',
        title: "배틀 필드 & 2D RPG 모험 - 눈히어로.com | 3x3 턴제 전술 카드 배틀",
        description: "3x3 보드에서 펼쳐지는 정통 턴제 AI 카드 배틀과 40부작 2D RPG 월드맵 모험! 상하좌우(N/E/S/W) 스탯을 비교하여 상대 카드를 뒤집는(Flip!) 짜릿한 전략 대결과 회차별 스토리 보스 레이드를 플레이하세요.",
        type: "VideoGame",
        keywords: "눈히어로 배틀, 3x3 카드 대결, 턴제 배틀, RPG 모험, 카단, 플립 룰, 보스 레이드, 턴제 전략",
        h1: "눈히어로.com 3x3 턴제 전술 카드 배틀 & 2D RPG 모험",
        h2: "N/E/S/W 4방향 스탯 대결 · 카드 뒤집기(Flip!) 연쇄 오의 · 40부작 챕터 퀘스트",
        faqs: [
          { q: "카드 배틀의 기본 규칙은 무엇인가요?", a: "3x3 격자판에 카드를 배치하고, 맞닿은 상대 카드의 맞은편 수치보다 내 카드의 수치가 높으면 상대 카드를 내 편으로 뒤집는(Flip) 정통 규칙입니다." }
        ]
      },
      card: {
        hash: '#card',
        title: "영웅 도감 (Hero Codex) - 눈히어로.com | 110종 영웅 카드 백과사전",
        description: "아케인 대륙 11대 종족(물, 불, 바람, 대지, 인간, 언데드, 엘프, 드워프, 야수, 로봇, 드래곤) 110종 전 영웅 카드의 상세 일러스트, 칭호, 전투력, 4방향 스탯, 보유 스킬을 열람하세요.",
        type: "CollectionPage",
        keywords: "눈히어로 도감, 110종 영웅, 아케인 대륙, 카드 일러스트, 영웅 능력치, 속성 상성, TCG 도감",
        h1: "눈히어로.com 110종 전 영웅 카드 도감 & 속성 백과",
        h2: "11대 원소 종족 · Bronze부터 Boss/Legendary 등급 · 고유 패시브 및 스탯",
        faqs: [
          { q: "영웅 카드의 등급은 어떻게 나뉘나요?", a: "Bronze, Silver, Gold, Boss(Legendary) 4단계로 구성되며, 레벨업을 통해 최대 10성까지 강화할 수 있습니다." }
        ]
      },
      shop: {
        hash: '#shop',
        title: "상점 & 소환 제단 - 눈히어로.com | 카드팩 뽑기 및 SNS 코인 충전",
        description: "눈히어로.com 공식 인게임 상점. 매직 팩, 레어 팩, 스타터 번들 등 5연속 영웅 소환 의식과 EXP 영약, 웹소설 영구 패스를 만나보세요. 네이버페이, 카카오페이, 페이팔, 암호화폐(BTC/ETH/USDT) 결제를 지원합니다.",
        type: "GameService",
        keywords: "눈히어로 상점, 카드팩 뽑기, 가챠, SNS 코인, 페이팔, 네이버페이, 코인 충전, 영웅 소환",
        h1: "눈히어로.com 영웅 소환 제단 및 공식 인게임 상점",
        h2: "5연속 카드팩 개봉 · 최고 등급 종족 특성 연출 · 간편 결제 시스템",
        faqs: [
          { q: "카드팩 구매 시 어떤 카드가 나오나요?", a: "구매 즉시 5장의 카드가 소환되며, 팩의 종류에 따라 실버 및 골드 등급이 확정 보장됩니다. 최고 등급 영웅의 종족 특성(물/화염/안개 등)이 화려하게 폭발합니다." }
        ]
      },
      mall: {
        hash: '#mall',
        title: "공식 굿즈 몰 (Official Merch Mall) - 눈히어로.com | 실물 TCG 카드 및 굿즈",
        description: "눈히어로.com 공식 실물 굿즈 몰. 110종 풀세트 실물 TCG 카드 박스, 11종 테마 덱, 3x3 배틀 게임테이블 매트, 내 영웅 카드가 전사 인쇄되는 프리미엄 커스텀 머그컵 및 시그니처 코튼 티셔츠를 만나보세요.",
        type: "Store",
        keywords: "눈히어로 굿즈몰, 실물 TCG 카드, 커스텀 머그컵, 커스텀 티셔츠, 배틀 매트, 게임테이블",
        h1: "눈히어로.com 공식 실물 굿즈 스토어 (Official Goods Mall)",
        h2: "110종 풀세트 실물 TCG 카드 · 커스텀 머그컵 · 티셔츠 · 3x3 게임 매트",
        faqs: [
          { q: "커스텀 머그컵은 어떻게 제작되나요?", a: "내가 소장한 영웅 카드의 일러스트와 칭호가 11oz 프리미엄 세라믹 머그컵 전면에 고온 전사 인쇄되어 나만의 시그니처 굿즈로 소장할 수 있습니다." },
          { q: "배송은 어떻게 진행되나요?", a: "주문 시 입력하신 배송지로 안전하게 특급 배송되며, 주문 내역 조회를 통해 실시간 진행 상황을 확인할 수 있습니다." }
        ]
      },
      book: {
        hash: '#book',
        title: "공식 웹소설 (40부작) - 눈히어로.com | 카단의 여정 정통 판타지 소설",
        description: "평범한 청년 카단이 전설의 모험가로 거듭나는 40부작 정통 판타지 웹소설 《카단의 여정》 전편 무료 공개! 네이버 웹소설, 문피아 공식 연재작의 전 에피소드와 삽화를 감상하세요.",
        type: "Book",
        keywords: "눈히어로 웹소설, 카단의 여정 소설, 네이버 웹소설, 문피아, 판타지 웹소설, 40부작",
        h1: "눈히어로.com 공식 40부작 판타지 웹소설 《카단의 여정》",
        h2: "네이버 웹소설 · 문피아 공식 연재작 전편 열람 및 에피소드 가이드",
        faqs: [
          { q: "소설은 어디서 연재되나요?", a: "눈히어로.com 공식 웹소설 라운지는 물론, 네이버 웹소설 챌린지리그(novelId=1250635)와 문피아(novel/616551)에서도 공식 감상하실 수 있습니다." }
        ]
      },
      webtoon: {
        hash: '#webtoon',
        title: "공식 웹툰 (40화 풀컬러) - 눈히어로.com | 카단의 여정 웹툰 연재관",
        description: "눈히어로.com 공식 40화 풀컬러 웹툰 《카단의 여정》! 110종 영웅들의 역동적인 전투와 아케인 대륙의 모험을 초고화질 스크롤 웹툰으로 감상하세요. 네이버 웹툰 도전만화 공식 연재 중.",
        type: "ComicSeries",
        keywords: "눈히어로 웹툰, 카단의 여정 웹툰, 네이버 웹툰, 풀컬러 만화, 판타지 웹툰, 40화",
        h1: "눈히어로.com 공식 40화 풀컬러 웹툰 《카단의 여정》",
        h2: "초고화질 세로 스크롤 연재관 · 110 영웅 시네마틱 컷신 · 네이버 웹툰 연동",
        faqs: [
          { q: "웹툰은 몇 화까지 준비되어 있나요?", a: "총 40화 풀컬러 고해상도 웹툰이 완비되어 있으며, 네이버 웹툰 도전만화(titleId=856677) 및 눈히어로 공식 웹툰관에서 감상할 수 있습니다." }
        ]
      },
      setting: {
        hash: '#setting',
        title: "환경설정 & 언어 - 눈히어로.com | 12개 다국어 및 오디오 설정",
        description: "눈히어로.com 시스템 설정. 한국어, 영어, 일본어, 중국어, 독일어, 스페인어, 프랑스어 등 12개 글로벌 언어팩 설정, 배경음악 및 효과음 볼륨 조절, 저사양 최적화 모드 및 클라우드 동기화 지원.",
        type: "WebApplication",
        keywords: "눈히어로 설정, 언어 변경, 12개 언어, BGM 설정, 다국어 지원, 클라우드 저장",
        h1: "눈히어로.com 시스템 환경설정 및 12개 언어 지원",
        h2: "글로벌 다국어 현지화 · 음향 및 사운드 조절 · 그래픽 최적화 모드",
        faqs: [
          { q: "지원하는 언어는 무엇인가요?", a: "한국어(ko), 영어(en), 일본어(ja), 중국어 간체/번체, 독일어, 스페인어, 프랑스어, 인도네시아어, 러시아어, 태국어, 베트남어 총 12개 언어를 완벽 지원합니다." }
        ]
      }
    };

    // Aliases for legacy routes
    const routeAliases = {
      'main-lobby': 'home',
      mydeck: 'deck',
      main: 'play',
      cards: 'card',
      mission: 'card',
      missions: 'card',
      store: 'shop',
      goods: 'mall',
      novel: 'book',
      webtoo: 'webtoon',
      cartoon: 'webtoon',
      cartoonbook: 'webtoon',
      settings: 'setting',
    };

    const resolvedRouteKey = routeAliases[route] || route;
    const seoData = ROUTE_SEO_MAP[resolvedRouteKey];

    if (seoData) {
      const targetHash = seoData.hash;
      const canonicalUrl = `https://snshero.com/${route}`;

      const schemaJsonLd = {
        "@context": "https://schema.org",
        "@type": seoData.type || "WebApplication",
        "name": seoData.title,
        "description": seoData.description,
        "url": canonicalUrl,
        "inLanguage": ["ko", "en", "ja", "zh-CN", "zh-TW", "de", "es", "fr", "id", "ru", "th", "vi"],
        "applicationCategory": "GameApplication",
        "operatingSystem": "All Web Browsers (Chrome, Safari, Firefox, Edge, iOS, Android)",
        "author": {
          "@type": "Organization",
          "name": "눈히어로.com (SNSHero.com)",
          "url": "https://snshero.com"
        }
      };

      const faqJsonLd = seoData.faqs && seoData.faqs.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": seoData.faqs.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.a
          }
        }))
      } : null;

      const richPrerenderHtml = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>${seoData.title}</title>
  <meta name="description" content="${seoData.description}">
  <meta name="keywords" content="${seoData.keywords}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- OpenGraph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${seoData.title}">
  <meta property="og:description" content="${seoData.description}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="https://snshero.com/og-image.png">
  <meta property="og:site_name" content="눈히어로.com">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${seoData.title}">
  <meta name="twitter:description" content="${seoData.description}">
  <meta name="twitter:image" content="https://snshero.com/og-image.png">

  <!-- Schema.org JSON-LD (Search / GEO / AEO Grounding) -->
  <script type="application/ld+json">
${JSON.stringify(schemaJsonLd, null, 2)}
  </script>
  ${faqJsonLd ? `<script type="application/ld+json">\n${JSON.stringify(faqJsonLd, null, 2)}\n  </script>` : ''}

  <!-- Instant SPA Hash Transition for Interactive Browsers -->
  <script>
    (function() {
      var search = window.location.search || '';
      var hash = window.location.hash || '';
      // If user directly opened URL without hash, seamlessly transition into SPA hash view
      if (!hash || hash === '#' || hash === '#/') {
        window.location.replace('/' + '${targetHash}' + search);
      }
    })();
  </script>
</head>
<body style="font-family: monospace, system-ui; padding: 24px; background: #fdfcfc; color: #201d1d; line-height: 1.6;">
  <!-- Crawler Prerendered Semantic Body for GoogleBot / SearchGPT / Perplexity / Gemini AEO -->
  <article class="seo-crawler-prerender">
    <header style="margin-bottom: 24px; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 16px;">
      <h1 style="font-size: 24px; font-weight: 900; margin: 0 0 8px 0;">${seoData.h1}</h1>
      <p style="font-size: 15px; color: #555; margin: 0;">${seoData.h2}</p>
    </header>

    <section style="margin-bottom: 24px;">
      <p style="font-size: 14px; margin-bottom: 12px;">${seoData.description}</p>
      <div style="padding: 12px; background: #f4f3f3; border-left: 4px solid #201d1d; font-size: 13px;">
        게임 바로 시작하기: <a href="/${targetHash}" style="color: #1e58ff; font-weight: bold; text-decoration: underline;">/${targetHash} 열기</a> | <a href="/#home" style="color: #555;">홈 로비</a> | <a href="/#deck" style="color: #555;">마이덱</a> | <a href="/#play" style="color: #555;">배틀 모험</a> | <a href="/#card" style="color: #555;">영웅 도감</a> | <a href="/#shop" style="color: #555;">상점</a> | <a href="/#mall" style="color: #555;">굿즈몰</a> | <a href="/#book" style="color: #555;">웹소설</a> | <a href="/#webtoon" style="color: #555;">웹툰</a>
      </div>
    </section>

    ${seoData.faqs && seoData.faqs.length > 0 ? `
    <section style="margin-top: 24px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 16px;">
      <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 12px;">자주 묻는 질문 (FAQ)</h2>
      ${seoData.faqs.map(f => `
        <div style="margin-bottom: 12px;">
          <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 4px 0;">Q. ${f.q}</h3>
          <p style="font-size: 13px; color: #444; margin: 0;">A. ${f.a}</p>
        </div>
      `).join('')}
    </section>
    ` : ''}

    <footer style="margin-top: 32px; font-size: 12px; color: #777; border-top: 1px solid rgba(0,0,0,0.08); padding-top: 12px;">
      &copy; 2026 눈히어로.com (SNSHero.com). All rights reserved. 100% 로컬스토리지 영구 보존.
    </footer>
  </article>
</body>
</html>`;

      // Write directory index: dist/[route]/index.html
      fs.writeFileSync(path.join(routeDir, 'index.html'), richPrerenderHtml, 'utf8');

      // Write clean flat file: dist/[route].html (except protected templates)
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
        fs.writeFileSync(flatHtmlPath, richPrerenderHtml, 'utf8');
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

// 4.2 Ensure standalone public/battle.html & battle-data.js are preserved in dist/battle.html and dist/battle/index.html
const publicBattleHtml = path.join(publicDir, 'battle.html');
const publicBattleData = path.join(publicDir, 'battle-data.js');
if (fs.existsSync(publicBattleHtml)) {
  fs.copyFileSync(publicBattleHtml, path.join(distDir, 'battle.html'));
  const distBattleDir = path.join(distDir, 'battle');
  if (!fs.existsSync(distBattleDir)) fs.mkdirSync(distBattleDir, { recursive: true });
  fs.copyFileSync(publicBattleHtml, path.join(distBattleDir, 'index.html'));
  if (fs.existsSync(publicBattleData)) {
    fs.copyFileSync(publicBattleData, path.join(distDir, 'battle-data.js'));
  }
  console.log('[post-build] Preserved standalone public/battle.html & dist/battle/index.html');
}

// 4.3 Ensure standalone SNSHero Card Battle (dist/game.html & dist/game/index.html) & purge legacy Hearthstone dirs
for (const legacySub of ['ui', 'audio', 'cursors', 'fonts']) {
  const legacyDir = path.join(distDir, 'hs-assets', legacySub);
  if (fs.existsSync(legacyDir)) {
    fs.rmSync(legacyDir, { recursive: true, force: true });
  }
}
for (const legacyFile of ['rea-manifest.json', 'vo-manifest.json']) {
  const legacyPath = path.join(distDir, 'hs-assets', 'data', legacyFile);
  if (fs.existsSync(legacyPath)) {
    fs.rmSync(legacyPath, { force: true });
  }
}
const distGameHtml = path.join(distDir, 'game.html');
if (fs.existsSync(distGameHtml)) {
  const gameHtmlRaw = fs.readFileSync(distGameHtml, 'utf8')
    .replace(/(src|href)=["']\.\/assets\//g, '$1="/assets/')
    .replace(/(src|href)=["']assets\//g, '$1="/assets/');
  fs.writeFileSync(distGameHtml, gameHtmlRaw, 'utf8');
  const distGameDir = path.join(distDir, 'game');
  if (!fs.existsSync(distGameDir)) fs.mkdirSync(distGameDir, { recursive: true });
  fs.writeFileSync(path.join(distGameDir, 'index.html'), gameHtmlRaw, 'utf8');
  console.log('[post-build] Preserved standalone dist/game.html & dist/game/index.html');
}

const distStoneHtml = path.join(distDir, 'stone.html');
if (fs.existsSync(distStoneHtml)) {
  const stoneHtmlRaw = fs.readFileSync(distStoneHtml, 'utf8')
    .replace(/(src|href)=["']\.\/assets\//g, '$1="/assets/')
    .replace(/(src|href)=["']assets\//g, '$1="/assets/');
  fs.writeFileSync(distStoneHtml, stoneHtmlRaw, 'utf8');
  const distStoneDir = path.join(distDir, 'stone');
  if (!fs.existsSync(distStoneDir)) fs.mkdirSync(distStoneDir, { recursive: true });
  fs.writeFileSync(path.join(distStoneDir, 'index.html'), stoneHtmlRaw, 'utf8');
  console.log('[post-build] Preserved standalone dist/stone.html & dist/stone/index.html');
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
