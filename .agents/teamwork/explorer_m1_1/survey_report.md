# Milestone 1: HTML 엔트리 포인트 분리 및 정적 랜딩 진입점 정밀 조사 보고서

- **문서 ID**: `REPORT-M1-ENTRYPOINTS-001`
- **조사자**: 마일스톤 1 탐색 에이전트 (`teamwork_explorer_m1_1`, Architecture & Entrypoint Specialist)
- **작업 디렉토리**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_1/`
- **조사 일시**: 2026-11-02T03:40:00Z
- **대상 마일스톤**: Milestone 1 (Features 1~5: `index.html`, `home.html`, `vite.config.ts`, `scripts/post-build.js`, `src/routes.ts`)

---

## 1. 개요 및 핵심 목표

본 조사는 SNSHero.com의 루트 접속 경로(`/` 및 `/index.html`)를 무거운 React 19 SPA 모놀리스로부터 완전히 격리하고, 다음 두 가지 독립적인 엔트리 포인트 체계(Vite Multi-Page Application)를 구축하기 위한 구체적인 코드 사양을 도출합니다:

1. **`index.html`**:
   - 가볍고 빠른 반응형 독립 정적 랜딩 웹 서비스 진입점.
   - 무거운 React 19, Three.js, TensorFlow, Firebase 등 일체 배제.
   - `/src/landing/index.ts` 및 `/src/landing/styles/landing.css`만 로드.
   - 기존의 모든 검색엔진 최적화(SEO/GEO/AEO) 메타 태그, OpenGraph, Twitter 카드, JSON-LD 스키마, 구글 애널리틱스(GA4)/애드센스, 웹 폰트 완벽 보존.
2. **`home.html`**:
   - 기존의 모든 기능이 동작하는 리치 게임 SPA(Single Page Application) 전용 진입점.
   - `/src/main.tsx` 및 React 앱 마운트 노드(`<div id="root"></div>`) 로드.
   - SPA 부팅 워치독 스크립트 및 스플래시 스타일 유지.
   - 캐노니컬 URL `https://snshero.com/home` 지정.

---

## 2. 현행 `index.html` 정밀 분석 (869라인 전수 검토)

### 2.1 파일 개요
- **위치**: `/Users/dayyoung/project/snshero/index.html` (총 869 라인, 45,279 바이트)
- **현재 진입 스크립트**: 라인 778: `<script type="module" src="/src/main.tsx"></script>`
- **현재 마운트 노드**: 라인 781: `<div id="root"></div>`

### 2.2 반드시 보존해야 하는 태그 그룹 (SEO, 광고, 폰트, 분석)
1. **Google 태그 (GA4 & Google Ads)**:
   - 라인 4~32: gtag 스크립트 (`AW-980426001`, `G-MT60DTV1KJ`, `gtag_report_conversion` 함수).
2. **캐시 제어 및 사이트 소유권 확인 메타 태그**:
   - 라인 33~39: `Cache-Control`, `Pragma`, `Expires`, `google-site-verification` (`kqrVlF-Gf4ez-U4JurXLDarfCf7Myh_mi15-uuZweCw`), `robots`, `googlebot`.
3. **RSS 피드 및 뷰포트 설정**:
   - 라인 40~43: `news-feed.xml`, `rss.xml`, charset `UTF-8`, `viewport` (`width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`).
4. **웹 폰트 (Inter & JetBrains Mono)**:
   - 라인 45~48: Google Fonts preconnect 및 `Inter`, `JetBrains Mono` 폰트 링크.
5. **타이틀 및 메타 디스크립션**:
   - 라인 49~50: 눈히어로 공식 타이틀 및 메타 디스크립션.
6. **OpenGraph & Twitter 카드**:
   - 라인 52~64: `og:type`, `og:url` (`https://snshero.com/`), `og:title`, `og:description`, `og:image`, `twitter:*`.
7. **정적 JSON-LD 스키마 (총 7개 영역, SEO/GEO/AEO)**:
   - 1. Organization (라인 69~91)
   - 1-1. SiteNavigationElement (라인 94~184, 12개 사이트링크)
   - 1-2. ItemList (라인 187~294, 12개 바로가기)
   - 1-3. BookSeries & ComicSeries (라인 297~372, 네이버 웹소설/웹툰/문피아)
   - 2. WebSite + SearchAction (라인 375~392)
   - 3. SoftwareApplication / VideoGame (라인 395~442)
   - 4. BreadcrumbList (라인 445~500)
   - 5. HowTo (라인 503~548)
   - 6. FAQPage (라인 551~622)
   - 7. ItemList - 주요 기능 (라인 625~698)
8. **다국어 hreflang 태그 (12개 언어 + x-default)**:
   - 라인 700~710 (`ja`, `zh-CN`, `zh-TW`, `de`, `es`, `fr`, `id`, `ru`, `th`, `vi`, `x-default`).
9. **Google AdSense 스크립트**:
   - 라인 717: `pagead2.googlesyndication.com` (`ca-pub-6937094123258335`).
10. **검색엔진 크롤러용 정적 폴백 마크업**:
    - 라인 784~865: 시각적으로 숨겨진 정적 내비게이션 `<nav aria-label="...">`.

### 2.3 `index.html`에서 반드시 제거/교체해야 하는 항목
1. **SPA 메인 스크립트 제거**:
   - 라인 778: `<script type="module" src="/src/main.tsx"></script>` 제거.
   - ➔ 교체: `<script type="module" src="/src/landing/index.ts"></script>`.
2. **불필요한 무거운 외부 CSS 제거**:
   - 라인 719: `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />` 제거 (정적 랜딩에는 지도 러닝 배틀 불필요).
3. **React 전용 `#root:empty` 스플래시 스타일 제거**:
   - 라인 722~751: `#root:empty` ("AI 카드 배틀 엔진을 불러오는 중입니다...") 제거.
   - ➔ 교체: 정적 랜딩 전용 스타일 `<link rel="stylesheet" href="/src/landing/styles/landing.css" />` 및 기본 body 스타일.
4. **React 청크 로드 실패 복구용 인라인 워치독 제거**:
   - 라인 752~776: `hero_boot_retries` 워치독 타이머 제거 (정적 랜딩 페이지는 청크 에러 리로드가 불필요함).
5. **DOM 마운트 노드 격리**:
   - 라인 781: `<div id="root"></div>` ➔ `<div id="landing-root"></div>`로 변경하여 React SPA와의 마운트 충돌 원천 방지.

---

## 3. `index.html` 교체 사양 (정적 랜딩 진입점)

### 3.1 파일 변경 핵심 구간 (Lines 718~781)
기존 라인 718~781 구간을 다음과 같이 교체합니다:

```html
    <!-- Static Landing Stylesheet -->
    <link rel="stylesheet" href="/src/landing/styles/landing.css" />
    <style>
      body { margin: 0; background-color: #fdfcfc; color: #201d1d; font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    </style>
    <script type="module" src="/src/landing/index.ts"></script>
  </head>
  <body class="bg-[#fdfcfc] text-[#201d1d] font-mono">
    <div id="landing-root"></div>
```

### 3.2 검증된 `index.html` 전체 구조
워커가 구현할 `index.html`의 전체 구조는 다음과 같습니다:
- `<head>` 상단: GA4, Google Ads, Cache-Control, Verification, Robots, RSS, Fonts, Title, Meta Description, OG/Twitter, JSON-LD Schemas (1~7), Hreflang, AdSense (기존 그대로 100% 유지).
- `<head>` 하단:
  - `<link rel="stylesheet" href="/src/landing/styles/landing.css" />`
  - `<script type="module" src="/src/landing/index.ts"></script>`
- `<body>`:
  - `<div id="landing-root"></div>`
  - `<nav aria-label="...">` (크롤러용 정적 폴백 마크업 유지)

---

## 4. `home.html` 신규 생성 사양 (리치 게임 SPA 진입점)

### 4.1 파일 생성 위치 및 목적
- **경로**: `/Users/dayyoung/project/snshero/home.html`
- **목적**: 기존 `/`에 연결되어 있던 React 19 전체 게임 SPA를 `/home` 경로에서 온전히 구동하기 위한 전용 HTML 진입점.

### 4.2 완전한 `home.html` 소스코드 사양

```html
<!doctype html>
<html lang="ko">
  <head>
    <!-- Google tag (gtag.js) GA4 & Google Ads -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=AW-980426001"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-MT60DTV1KJ');
      gtag('config', 'AW-980426001');
    </script>
    <!-- Event snippet for 구매 conversion page (Google Ads) -->
    <script>
      function gtag_report_conversion(url, transaction_id, value, currency) {
        var callback = function () {
          if (typeof(url) != 'undefined') {
            window.location = url;
          }
        };
        if (typeof gtag === 'function') {
          gtag('event', 'conversion', {
              'send_to': 'AW-980426001/5pbgCI2H9ckcEJG6wNMD',
              'value': value || 1000.0,
              'currency': currency || 'KRW',
              'transaction_id': transaction_id || '',
              'event_callback': callback
          });
        }
        return false;
      }
    </script>
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0, post-check=0, pre-check=0" />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
    <meta name="google-site-verification" content="kqrVlF-Gf4ez-U4JurXLDarfCf7Myh_mi15-uuZweCw" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <link rel="alternate" type="application/rss+xml" title="SNSHero Google News RSS Feed" href="https://snshero.com/news-feed.xml" />
    <link rel="alternate" type="application/rss+xml" title="SNSHero News 2.0 Feed" href="https://snshero.com/rss.xml" />
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700;800&display=swap" />
    <title>눈히어로.com - 카단의 여정 (AI 웹 카드 게임) | SNSHero.com - Kadan's Journey</title>
    <meta name="description" content="눈히어로.com - 카단의 여정! 복잡한 클라이언트 설치나 가입 없이 클릭 한 번으로 즐기는 인공지능(AI) 웹 카드 배틀 게임과 40부작 판타지 소설·웹툰 유니버스입니다." />
    <link rel="canonical" href="https://snshero.com/home" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://snshero.com/home" />
    <meta property="og:title" content="눈히어로.com - 카단의 여정 (AI 웹 카드 게임) | SNSHero.com - Kadan's Journey" />
    <meta property="og:description" content="눈히어로.com - 카단의 여정! 원클릭 AI 웹 카드 배틀 게임과 40부작 판타지 소설·웹툰 유니버스입니다." />
    <meta property="og:image" content="https://snshero.com/logo.jpg" />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="https://snshero.com/home" />
    <meta property="twitter:title" content="눈히어로.com - 카단의 여정 (AI 웹 카드 게임) | SNSHero.com - Kadan's Journey" />
    <meta property="twitter:description" content="눈히어로.com - 카단의 여정! 원클릭 AI 웹 카드 배틀 게임과 40부작 판타지 소설·웹툰 유니버스입니다." />
    <meta property="twitter:image" content="https://snshero.com/logo.jpg" />

    <!-- Leaflet CSS for Running Battle Map -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="/src/index.css" />

    <style>
      body { margin: 0; background-color: #fdfcfc; color: #201d1d; font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
      #root:empty {
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: #fdfcfc;
        padding: 24px;
        box-sizing: border-box;
      }
      #root:empty::before {
        content: "눈히어로.com - 카단의 여정 (SNSHero.com - Kadan's Journey)";
        display: block;
        padding: 10px 18px;
        background-color: #201d1d;
        color: #fdfcfc;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 0.06em;
        border: 1px solid #201d1d;
        margin-bottom: 10px;
      }
      #root:empty::after {
        content: "AI 카드 배틀 엔진을 불러오는 중입니다...";
        display: block;
        color: #646262;
        font-size: 12px;
        font-weight: 600;
      }
    </style>
    <script>
      (function() {
        var watchdogTimer = setTimeout(function() {
          var root = document.getElementById('root');
          if (root && root.children.length === 0) {
            try {
              var retries = parseInt(sessionStorage.getItem('hero_boot_retries') || '0', 10);
              if (retries < 2) {
                sessionStorage.setItem('hero_boot_retries', String(retries + 1));
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    names.forEach(function(n) { caches.delete(n); });
                  });
                }
                var url = new URL(window.location.href);
                url.searchParams.set('_v', String(Date.now()));
                window.location.replace(url.toString());
              }
            } catch (e) {}
          }
        }, 6000);
        window.__SNSHERO_CLEAR_WATCHDOG__ = function() {
          clearTimeout(watchdogTimer);
        };
      })();
    </script>
    <script type="module" src="/src/main.tsx"></script>
  </head>
  <body class="bg-[#fdfcfc] text-[#201d1d] font-mono">
    <div id="root"></div>
  </body>
</html>
```

---

## 5. 아키텍처 연동 및 파이프라인 정합성 사양

### 5.1 `vite.config.ts` 멀티 엔트리 롤업 설정
Vite가 빌드 시 `index.html`과 `home.html`을 모두 인식하여 독립 번들로 출력하도록 구성합니다.

```typescript
// vite.config.ts의 build.rollupOptions 설정
build: {
  outDir: 'dist',
  assetsDir: 'assets',
  emptyOutDir: false,
  rollupOptions: {
    input: {
      main: path.resolve(process.cwd(), 'index.html'), // -> dist/index.html (독립 정적 랜딩)
      home: path.resolve(process.cwd(), 'home.html'),  // -> dist/home.html (리치 게임 SPA)
    },
    output: {
      entryFileNames: `assets/[name]-[hash].js`,
      chunkFileNames: `assets/[name]-[hash].js`,
      assetFileNames: `assets/[name]-[hash][extname]`,
      manualChunks(id) {
        // 기존 manualChunks 유지 (React/TF/Firebase는 home.html 엔트리에서만 로드됨)
      }
    }
  }
}
```

#### Vite Dev 및 Preview 서버 `/home` URL 리라이트 미들웨어
`vite.config.ts`의 `public-wildcard-static-plugin` 내부 최상단(라인 74 부근)에 다음 리라이트 규칙을 추가하여, 로컬 개발(`npm run dev`) 및 프리뷰(`npm run preview`) 시 `/home` 접근이 `home.html`로 매끄럽게 연결되도록 보장합니다:

```typescript
// Rewrite /home and /home/ to /home.html in dev and preview servers
if (decodedUrl === '/home' || decodedUrl === '/home/') {
  req.url = '/home.html';
}
```

### 5.2 `scripts/post-build.js` 경로 보존 및 생성 로직
현재 `scripts/post-build.js`는 `dist/index.html`을 읽어 모든 SPA 라우트(`dist/home/index.html`, `dist/deck/index.html`, etc.)를 생성하고 있습니다. `index.html`이 정적 랜딩으로 교체되면 SPA 라우트가 깨지므로, **SPA 템플릿의 소스를 `dist/home.html`로 전환**해야 합니다:

```javascript
// scripts/post-build.js 수정 사양:
const homeHtmlPath = path.join(distDir, 'home.html');
const indexPath = path.join(distDir, 'index.html');
// SPA 라우트 생성 시 home.html을 우선 템플릿으로 사용
const spaTemplatePath = fs.existsSync(homeHtmlPath) ? homeHtmlPath : indexPath;

if (fs.existsSync(spaTemplatePath)) {
  const baseHtml = fs.readFileSync(spaTemplatePath, 'utf8');
  // ... benchCustomHtml, novelCustomHtml, cleanBaseHtml 생성 ...
  
  for (const route of routes) {
    // ...
    // 주의: dist/index.html은 순수 정적 랜딩으로 보존 (덮어쓰지 않음)
    // route 'home'인 경우 dist/home/index.html 및 dist/home.html을 spa 템플릿으로 생성
  }
}

// 404 폴백: SPA 딥링크 라우팅 지원을 위해 spaTemplatePath(home.html) 기반 생성
const notFoundPath = path.join(distDir, '404.html');
if (fs.existsSync(spaTemplatePath) && !fs.existsSync(notFoundPath)) {
  fs.copyFileSync(spaTemplatePath, notFoundPath);
  console.log('[post-build] Generated 404.html from SPA template (home.html)');
}
```

### 5.3 `src/routes.ts` 라우트 분리
`src/routes.ts`에서 `home`의 경로를 `'/home'`으로 명시적 변경합니다:

```typescript
// 1. VIEW_ROUTES.home (라인 21~28)
home: {
  path: '/home',
  aliases: ['/home.html', '/main-lobby'],
  titleKo: '눈히어로.com - 카단의 여정 (원클릭 AI 웹 카드 게임)',
  titleEn: "SNSHero.com - Kadan's Journey (One-Click AI Web Card Game)",
  descriptionKo: '복잡한 가입 없이 클릭 한 번으로 시작하는 AI 웹 카드 게임 눈히어로.com - 카단의 여정 로비입니다.',
  descriptionEn: "Start instantly with one click at SNSHero.com - Kadan's Journey. Collect 110+ hero cards with AI battles.",
},

// 2. getViewPath (라인 422~425) 기본 폴백
export function getViewPath(view: ViewType): string {
  const route = VIEW_ROUTES[view];
  return route ? route.path : '/home';
}

// 3. getViewFromPath (라인 463~465)
if (cleanPath === '/home' || cleanPath === '/home.html') {
  return 'home';
}
```

### 5.4 `src/landing/` 진입점 최소 부트스트랩 스텁 (빌드 무결성 확보)
Vite가 `index.html`을 빌드할 때 참조할 최소한의 진입 파일이 필요합니다:

1. **`src/landing/styles/landing.css`**:
```css
@import "tailwindcss";

:root {
  --landing-cream: #fdfcfc;
  --landing-ink: #201d1d;
  --landing-line: rgba(15, 0, 0, 0.12);
}

body {
  margin: 0;
  background-color: var(--landing-cream);
  color: var(--landing-ink);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
```

2. **`src/landing/index.ts`**:
```typescript
import './styles/landing.css';

console.log('[SNSHero Landing] Standalone static landing initialized.');

function mountLanding() {
  const root = document.getElementById('landing-root') || document.getElementById('root');
  if (!root) return;

  // Placeholder bootstrap shell for Milestone 1 build integrity
  // Full UI components will be mounted here in Milestone 2 & 3
  if (root.children.length === 0) {
    root.innerHTML = `
      <div class="min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono flex flex-col items-center justify-center p-6">
        <div class="border border-[rgba(15,0,0,0.12)] p-8 max-w-lg w-full text-center bg-white shadow-sm">
          <h1 class="text-xl font-bold tracking-tight mb-3">눈히어로.com (SNSHero.com)</h1>
          <p class="text-xs text-stone-600 mb-6 leading-relaxed">
            원클릭 AI 웹 카드 게임 & 공식 웹소설·웹툰 플랫폼에 오신 것을 환영합니다.
          </p>
          <a href="/home" class="inline-block px-6 py-3 bg-[#201d1d] text-[#fdfcfc] text-sm font-semibold rounded-sm hover:opacity-90 transition-opacity min-h-[44px]">
            게임 시작하기 (Play Game) →
          </a>
        </div>
      </div>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountLanding);
} else {
  mountLanding();
}
```

---

## 6. 워커 구현 절차 및 작업 순서 (Implementation Checklist)

워커는 아래 순서대로 정확하게 작업을 수행해야 합니다:

1. **Step 1: 최소 랜딩 스텁 파일 생성**:
   - `src/landing/styles/landing.css` 생성.
   - `src/landing/index.ts` 생성.
2. **Step 2: `home.html` 생성**:
   - 프로젝트 루트에 `home.html` 생성 (위 4.2 사양 준수).
3. **Step 3: `index.html` 수정**:
   - 라인 718~781 구간을 랜딩 진입점 사양(3.1)으로 교체.
4. **Step 4: `vite.config.ts` 수정**:
   - `rollupOptions.input`에 `{ main: 'index.html', home: 'home.html' }` 추가.
   - 미들웨어에 `/home` 리라이트 규칙 추가.
5. **Step 5: `scripts/post-build.js` 수정**:
   - `dist/home.html`을 SPA 라우트 기본 템플릿으로 지정하고 `dist/index.html` 보존.
6. **Step 6: `src/routes.ts` 수정**:
   - `home.path = '/home'` 및 `cleanPath === '/home'` 정렬.
7. **Step 7: 빌드 및 검증**:
   - `npm run build` 실행하여 `dist/index.html` 및 `dist/home.html` 정상 생성 검증.
   - 번들 크기 확인: `dist/index.html`이 참조하는 번들에 React/TensorFlow 청크가 포함되지 않는지 확인.

---

## 7. 검증 및 무효화 기준 (Verification & Invalidation)

### 7.1 독립 검증 명령
```bash
# 1. TypeScript 타입 무결성 검증
npx tsc --noEmit

# 2. 프로덕션 빌드 실행 (Vite build + post-build.js)
npm run build

# 3. 산출물 파일 검증
ls -la dist/index.html dist/home.html dist/home/index.html

# 4. 정적 랜딩 번들 의존성 검증 (React/TF 포함 여부)
grep -q "vendor-react" dist/index.html && echo "FAIL: React found in index.html" || echo "PASS: index.html is ultra-light"
grep -q "/src/landing/index.ts" index.html && echo "PASS: index.html loads landing entry"
grep -q "/src/main.tsx" home.html && echo "PASS: home.html loads main.tsx"
```

### 7.2 무효화 조건 (Invalidation Conditions)
- `npm run build` 실패 시 (exit code != 0).
- `dist/index.html` 내부에 React 런타임 번들이 직접 포함되는 경우.
- `dist/home.html` 또는 `dist/home/index.html`이 누락되거나 빈 파일인 경우.
- `/home` 접속 시 기존 리치 게임 SPA가 마운트되지 않는 경우.
