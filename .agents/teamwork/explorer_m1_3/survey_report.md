# Milestone 1 라우팅 마이그레이션 & 사후 빌드 스크립트 정밀 조사 보고서

- **문서 ID**: `SURVEY-M1-ROUTING-POSTBUILD-001`
- **조사자**: 탐색 에이전트 (`teamwork_explorer_m1_3`, Routing & Build Pipeline Specialist)
- **작업 디렉토리**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_3/`
- **조사 일시**: 2026-11-02T03:40:00Z
- **대상 파일**:
  1. `src/routes.ts` (라우트 정의 및 경로 정규화)
  2. `scripts/post-build.js` (정적 라우트 생성 및 템플릿 배포)
  3. `src/App.tsx`, `src/components/PageHeader.tsx`, `src/components/reddit/RedditHeader.tsx` 등 (네비게이션 및 pushState 소비자)
  4. `vite.config.ts` (MPA 롤업 엔트리 및 개발 서버 rewrite)

---

## 1. 개요 및 마이그레이션 배경

SNSHero 프로젝트는 메인 접속 페이지(`/` 또는 `/index.html`)를 가볍고 반응성이 뛰어난 독립 정적 페이지(`src/landing/`)로 분리하고, 기존 리치 게임 SPA를 `/home` 경로로 완전 이전하는 **Dual-Entry Architecture**를 구축하고 있습니다.

이 아키텍처가 완벽히 동작하기 위해서는 다음 두 핵심 영역의 정밀한 수정이 필수적입니다:
1. **SPA 내부 라우팅 디커플링 (`src/routes.ts`)**:
   - 기존에는 `home.path`가 `'/'`로 설정되어 있고 `cleanPath === '/' || cleanPath === '/home'`이 모두 `home`으로 매핑되어 있었습니다.
   - 이를 변경하여 `home.path`를 `'/home'`으로 엄격히 재지정하고, 루트(`/`)를 SPA 내부 라우팅에서 완전 분리(decouple)해야 합니다.
2. **사후 빌드 스크립트 고도화 (`scripts/post-build.js`)**:
   - 기존 스크립트는 `dist/index.html`을 읽어 40여 개 SPA 서브라우트(`dist/bench/`, `dist/deck/`, `dist/play/` 등)에 일괄 복사했습니다.
   - Vite MPA 듀얼 엔트리(`index.html` -> 정적 랜딩, `home.html` -> 게임 SPA) 도입 시, 기존 방식대로 동작하면 **정적 랜딩 페이지가 모든 SPA 서브라우트를 덮어쓰는 치명적 장애**가 발생합니다.
   - 따라서 `dist/index.html`은 독립 정적 랜딩 페이지로 **절대 보존**하고, 모든 SPA 서브라우트 및 `dist/home/`은 **`dist/home.html` (SPA 번들 템플릿)**을 베이스로 생성하도록 분리해야 합니다.

---

## 2. `src/routes.ts` 정밀 분석 및 구체적 구현 사양

### 2.1 현행 코드 분석
- **파일 위치**: `/Users/dayyoung/project/snshero/src/routes.ts`
- **현행 코드 라인 21~28 (`VIEW_ROUTES.home`)**:
  ```typescript
  home: {
    path: '/',
    aliases: ['/home'],
    titleKo: '눈히어로.com - 카단의 여정 (원클릭 AI 웹 카드 게임)',
    titleEn: "SNSHero.com - Kadan's Journey (One-Click AI Web Card Game)",
    descriptionKo: '복잡한 가입 없이 클릭 한 번으로 시작하는 AI 웹 카드 게임 눈히어로.com - 카단의 여정 로비입니다.',
    descriptionEn: "Start instantly with one click at SNSHero.com - Kadan's Journey. Collect 110+ hero cards with AI battles.",
  },
  ```
- **현행 코드 라인 422~425 (`getViewPath`)**:
  ```typescript
  export function getViewPath(view: ViewType): string {
    const route = VIEW_ROUTES[view];
    return route ? route.path : '/';
  }
  ```
- **현행 코드 라인 462~465 (`getViewFromPath`)**:
  ```typescript
  // 홈 화면 매핑 (/ 또는 /home)
  if (cleanPath === '/' || cleanPath === '/home') {
    return 'home';
  }
  ```

### 2.2 문제점 및 영향
1. `VIEW_ROUTES.home.path`가 `'/'`이면, SPA 내부에서 `setView('home')` 호출 시 `getViewPath('home')`이 `'/'`를 반환하고, `App.tsx` 라인 1853의 `window.history.pushState({ view }, '', targetPath)`에 의해 브라우저 주소창이 다시 `'/'`로 변경됩니다. 이는 사용자를 정적 랜딩 페이지의 URL로 덮어쓰는 URL 충돌을 유발합니다.
2. `getViewPath`의 fallback 경로가 `'/'`이므로 등록되지 않은 뷰 접근 시 정적 랜딩 페이지 경로로 회귀합니다.
3. `getViewFromPath`에서 `cleanPath === '/'`를 `home`으로 매핑하고 있어, 루트 접근과 게임 홈 접근의 경계가 모호합니다.

### 2.3 변경 구현 사양 (Before & After Code Diff)

#### ① `VIEW_ROUTES.home` 변경 (라인 21~28)
```typescript
<<<< BEFORE
  home: {
    path: '/',
    aliases: ['/home'],
    titleKo: '눈히어로.com - 카단의 여정 (원클릭 AI 웹 카드 게임)',
    titleEn: "SNSHero.com - Kadan's Journey (One-Click AI Web Card Game)",
    descriptionKo: '복잡한 가입 없이 클릭 한 번으로 시작하는 AI 웹 카드 게임 눈히어로.com - 카단의 여정 로비입니다.',
    descriptionEn: "Start instantly with one click at SNSHero.com - Kadan's Journey. Collect 110+ hero cards with AI battles.",
  },
====
  home: {
    path: '/home',
    aliases: ['/main-lobby'],
    titleKo: '눈히어로.com - 카단의 여정 (원클릭 AI 웹 카드 게임)',
    titleEn: "SNSHero.com - Kadan's Journey (One-Click AI Web Card Game)",
    descriptionKo: '복잡한 가입 없이 클릭 한 번으로 시작하는 AI 웹 카드 게임 눈히어로.com - 카단의 여정 로비입니다.',
    descriptionEn: "Start instantly with one click at SNSHero.com - Kadan's Journey. Collect 110+ hero cards with AI battles.",
  },
>>>>
```

#### ② `getViewPath` 변경 (라인 422~425)
```typescript
<<<< BEFORE
export function getViewPath(view: ViewType): string {
  const route = VIEW_ROUTES[view];
  return route ? route.path : '/';
}
====
export function getViewPath(view: ViewType): string {
  const route = VIEW_ROUTES[view];
  return route ? route.path : '/home';
}
>>>>
```

#### ③ `getViewFromPath` 변경 (라인 462~465)
```typescript
<<<< BEFORE
  // 홈 화면 매핑 (/ 또는 /home)
  if (cleanPath === '/' || cleanPath === '/home') {
    return 'home';
  }
====
  // 홈 화면 매핑 (/home) - 루트(/)는 독립 정적 랜딩 페이지로 디커플링
  if (cleanPath === '/home') {
    return 'home';
  }
>>>>
```

#### ④ 라우트 정규화 및 Fallback 처리 상세 로직
- `cleanPath === '/home'`만 명시적으로 `'home'`을 반환합니다.
- 만약 SPA 실행 환경에서 브라우저 pathname이 `'/'`로 전달되는 예외적 상황(예: 사용자가 뒤로가기로 루트에 진입했거나 `home.html`이 루트에서 실행된 경우):
  - 3단계 루프에서 `'/'` 경로가 없으므로 통과합니다.
  - 4단계 Fallback(라인 498~506)에서 `localStorage.getItem('hero_current_view')`를 확인하거나 최종 `return 'home'`을 반환합니다.
  - `App.tsx`의 URL 동기화 `useEffect`가 `getViewPath('home')`을 통해 즉시 `'/home'`으로 URL을 자동 보정(`pushState`)하므로 100% 안전하게 격리됩니다.

---

## 3. SPA 내비게이션 소비자 전수 감사 및 변경 사양

SPA 코드베이스 전체를 grep 검색하여 하드코딩된 `window.history.pushState(..., '/')` 및 `href="/"` 패턴 10개소를 전수 식별했습니다. 이들은 사용자가 로고나 홈 버튼을 눌렀을 때 실행되는 곳으로, 모두 `'/home'`으로 마이그레이션해야 합니다.

| 번호 | 파일 경로 | 라인 번호 | 현행 코드 | 변경 코드 | 비고 |
|---|---|---|---|---|---|
| 1 | `src/components/PageHeader.tsx` | 61 | `window.history.pushState({ view: 'home' }, '', '/');` | `window.history.pushState({ view: 'home' }, '', '/home');` | 상단 브랜드 로고 클릭 |
| 2 | `src/components/reddit/RedditHeader.tsx` | 133 | `window.history.pushState({ view: 'home' }, '', '/');` | `window.history.pushState({ view: 'home' }, '', '/home');` | 레딧 뷰 로고 클릭 |
| 3 | `src/components/ShareTemplateCard.tsx` | 92 | `window.history.pushState({ view: 'home' }, '', '/');` | `window.history.pushState({ view: 'home' }, '', '/home');` | 공유 카드 홈 버튼 |
| 4 | `src/views/HomeView.tsx` | 267 | `window.history.pushState({ view: 'home' }, '', '/');` | `window.history.pushState({ view: 'home' }, '', '/home');` | 게임 홈 상단 로고 |
| 5 | `src/views/HomeView.tsx` | 842 | `window.history.pushState({ view: 'home' }, '', '/');` | `window.history.pushState({ view: 'home' }, '', '/home');` | 퀵 링크 홈 버튼 |
| 6 | `src/views/ShopView.tsx` | 5052 | `window.history.pushState({ view: 'home' }, '', '/');` | `window.history.pushState({ view: 'home' }, '', '/home');` | 상점 홈 바로가기 |
| 7 | `src/views/KadanRpgView.tsx` | 973 | `window.history.pushState({ view: 'home' }, '', '/');` | `window.history.pushState({ view: 'home' }, '', '/home');` | 메인 RPG 홈 로고 |
| 8 | `src/views/ShareView.tsx` | 281 | `window.history.pushState({ view: 'home' }, '', '/');` | `window.history.pushState({ view: 'home' }, '', '/home');` | 공유 뷰 홈 이동 |
| 9 | `src/App.tsx` | 5652, 6681, 6731 | `window.history.pushState(null, '', '/');` | `window.history.pushState(null, '', '/home');` | 사이드바/드로어 네비게이션 |
| 10 | `src/App.tsx` | 6713 | `targetView === 'home' ? '/' : '/' + targetView` | `targetView === 'home' ? '/home' : '/' + targetView` | 탭 네비게이션 경로 매핑 |
| 11 | `src/App.tsx` | 6927 | `window.history.pushState({ view: 'home' }, '', '/');` | `window.history.pushState({ view: 'home' }, '', '/home');` | 모바일 메뉴 로고 클릭 |

> **워커 구현 권장 사항**:
> `App.tsx` 라인 1819에서 이미 `let targetPath = getViewPath(view);`를 통해 중앙집중식 URL 관리를 수행하고 있으므로, `src/routes.ts` 수정만으로도 대부분의 뷰 전환은 자동 반영됩니다. 그러나 위 테이블의 인라인 `pushState` 호출부들도 누락 없이 `'/home'`으로 치환해야 완벽한 무결성이 보장됩니다.

---

## 4. `scripts/post-build.js` 정밀 분석 및 구체적 구현 사양

### 4.1 현행 코드 분석
- **파일 위치**: `/Users/dayyoung/project/snshero/scripts/post-build.js`
- **현행 로직 요약**:
  1. 라인 18~26: `dist/index.html`에서 `index-*.js` 정규식 검색 -> `version.json`에 `entryScript` 기록.
  2. 라인 95~98: `const indexPath = path.join(distDir, 'index.html'); const baseHtml = fs.readFileSync(indexPath, 'utf8');`
  3. 라인 184~213: `routes` 배열(73개 라우트)을 순회하며 `dist/<route>/index.html`과 `dist/<route>.html`에 `cleanBaseHtml` (`dist/index.html` 기반) 복사/작성.
  4. 라인 225~230: `dist/index.html`을 `dist/404.html`로 복사.

### 4.2 문제점 및 위험성
- **위험도: 치명적 (Critical)**
  Vite MPA 듀얼 엔트리(`index.html` = 정적 랜딩, `home.html` = 리치 게임 SPA)를 빌드하면 `dist/index.html`에는 **순수 정적 랜딩 페이지 번들**(`src/landing/index.ts`)만 담기게 됩니다.
  현행 `post-build.js`가 그대로 실행되면:
  1. `dist/bench/`, `dist/deck/`, `dist/play/`, `dist/shop/` 등 모든 게임 하위 라우트가 **정적 랜딩 페이지의 HTML로 덮어써져 게임 기능을 상실**하게 됩니다.
  2. `dist/index.html` 자체도 스크립트 실행 과정에서 의도치 않게 변경될 위험이 있습니다.
  3. `version.json`에 정적 랜딩 번들(`main-*.js`)이 잘못 기록되어 게임 SPA의 핫픽스 감지 메커니즘이 오작동할 수 있습니다.

### 4.3 변경 구현 사양 (Before & After Code Diff)

#### ① SPA 템플릿 로딩 및 `dist/index.html` 보존 로직 (라인 95~98)
`dist/index.html`을 템플릿으로 쓰지 않고, **`dist/home.html` (SPA 번들)**을 템플릿으로 사용합니다.

```javascript
<<<< BEFORE
const indexPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexPath)) {
  const baseHtml = fs.readFileSync(indexPath, 'utf8');
====
const indexPath = path.join(distDir, 'index.html');
const homeHtmlPath = path.join(distDir, 'home.html');

// 4. SPA Route Base Template Selection:
// dist/index.html은 순수 정적 랜딩 페이지로 절대 보존해야 합니다.
// 모든 SPA 서브라우트(bench, play, deck, shop 등) 및 /home은 dist/home.html(SPA 엔트리)을 템플릿으로 사용합니다.
const spaTemplatePath = fs.existsSync(homeHtmlPath) ? homeHtmlPath : indexPath;

if (fs.existsSync(spaTemplatePath)) {
  console.log(`[post-build] Using SPA base template: ${spaTemplatePath}`);
  const baseHtml = fs.readFileSync(spaTemplatePath, 'utf8');
>>>>
```

#### ② `routes` 순회 및 `/home` 처리 로직 (라인 184~215)
`routes` 배열(라인 73)에는 이미 `'home'`이 포함되어 있습니다.
- `route === 'home'`일 때:
  - `dist/home/index.html` 생성 -> `cleanBaseHtml` 기록
  - `dist/home.html` 생성 -> `cleanBaseHtml` 기록 (절대 경로 정규화된 SPA 템플릿 보장)
- 기타 서브라우트:
  - `dist/<route>/index.html` 및 `dist/<route>.html` 생성 -> `cleanBaseHtml` 기록
- **절대 원칙**: 루프 내에서 `dist/index.html`은 절대 덮어쓰지 않습니다.

```javascript
<<<< BEFORE
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
    } else if (route === 'novel' || route === 'book' || route === 'webtoon') {
      const routeCanonical = `https://snshero.com/${route}`;
      const routeHtml = cleanNovelHtml
        .replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/, `<link rel="canonical" href="${routeCanonical}" />`)
        .replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/, `<meta property="og:url" content="${routeCanonical}" />`)
        .replace(/<meta\s+property="twitter:url"\s+content=".*?"\s*\/?>/, `<meta property="twitter:url" content="${routeCanonical}" />`);
      fs.writeFileSync(path.join(routeDir, 'index.html'), routeHtml, 'utf8');
      fs.writeFileSync(path.join(distDir, `${route}.html`), routeHtml, 'utf8');
    } else {
      fs.writeFileSync(path.join(routeDir, 'index.html'), cleanBaseHtml, 'utf8');
      if (!route.includes('/')) {
        fs.writeFileSync(path.join(distDir, `${route}.html`), cleanBaseHtml, 'utf8');
      }
    }
  }
====
  for (const route of routes) {
    // 안전 장치: index 또는 루트 경로는 절대 SPA 템플릿으로 덮어쓰지 않음
    if (route === '' || route === '/' || route === 'index') {
      continue;
    }

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
    } else if (route === 'novel' || route === 'book' || route === 'webtoon') {
      const routeCanonical = `https://snshero.com/${route}`;
      const routeHtml = cleanNovelHtml
        .replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/, `<link rel="canonical" href="${routeCanonical}" />`)
        .replace(/<meta\s+property="og:url"\s+content=".*?"\s*\/?>/, `<meta property="og:url" content="${routeCanonical}" />`)
        .replace(/<meta\s+property="twitter:url"\s+content=".*?"\s*\/?>/, `<meta property="twitter:url" content="${routeCanonical}" />`);
      fs.writeFileSync(path.join(routeDir, 'index.html'), routeHtml, 'utf8');
      fs.writeFileSync(path.join(distDir, `${route}.html`), routeHtml, 'utf8');
    } else {
      fs.writeFileSync(path.join(routeDir, 'index.html'), cleanBaseHtml, 'utf8');
      if (!route.includes('/')) {
        fs.writeFileSync(path.join(distDir, `${route}.html`), cleanBaseHtml, 'utf8');
      }
    }
  }
>>>>
```

#### ③ `version.json` 엔트리 스크립트 감지 고도화 (라인 16~42)
게임 SPA의 엔트리 스크립트(`home-*.js` 또는 `index-*.js`)를 정확히 감지하도록 개선합니다.

```javascript
<<<< BEFORE
// 1. Find entry script in dist/index.html (fallback to newest index-*.js in dist/assets)
let entryScript = '';
const builtIndexHtmlPath = path.join(distDir, 'index.html');
if (fs.existsSync(builtIndexHtmlPath)) {
  const indexHtmlContent = fs.readFileSync(builtIndexHtmlPath, 'utf8');
  const scriptMatch = indexHtmlContent.match(/\/assets\/(index-[A-Za-z0-9_-]+\.js)/);
  if (scriptMatch && scriptMatch[1]) {
    entryScript = `/assets/${scriptMatch[1]}`;
    console.log(`[post-build] Detected entry script from index.html: ${entryScript}`);
  }
}
====
// 1. Find entry script in dist/home.html first (SPA game bundle), then dist/index.html
let entryScript = '';
const candidateHtmlPaths = [
  path.join(distDir, 'home.html'),
  path.join(distDir, 'index.html'),
];

for (const htmlPath of candidateHtmlPaths) {
  if (fs.existsSync(htmlPath)) {
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const scriptMatch = htmlContent.match(/\/assets\/((?:home|index|main)-[A-Za-z0-9_-]+\.js)/);
    if (scriptMatch && scriptMatch[1]) {
      entryScript = `/assets/${scriptMatch[1]}`;
      console.log(`[post-build] Detected entry script from ${path.basename(htmlPath)}: ${entryScript}`);
      break;
    }
  }
}
>>>>
```

#### ④ 404.html 폴백 생성 로직 (라인 225~230)
정적 호스팅에서 알려지지 않은 URL 접근 시 SPA 라우터가 처리할 수 있도록 `spaTemplatePath`를 기반으로 404.html을 생성합니다.

```javascript
<<<< BEFORE
// 5. Ensure 404.html fallback
const notFoundPath = path.join(distDir, '404.html');
if (fs.existsSync(indexPath) && !fs.existsSync(notFoundPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('[post-build] Generated 404.html from index.html');
}
====
// 5. Ensure 404.html fallback (uses SPA template so deep links load client-side router)
const notFoundPath = path.join(distDir, '404.html');
const templateFor404 = fs.existsSync(homeHtmlPath) ? homeHtmlPath : indexPath;
if (fs.existsSync(templateFor404) && !fs.existsSync(notFoundPath)) {
  fs.copyFileSync(templateFor404, notFoundPath);
  console.log(`[post-build] Generated 404.html from ${path.basename(templateFor404)}`);
}
>>>>
```

---

## 5. `vite.config.ts` 연동 및 개발/프리뷰 서버 라우팅 명세

### 5.1 빌드 설정 (Rollup Multi-Page Input)
`vite.config.ts`의 `build.rollupOptions.input`에 두 엔트리가 등록되어야 합니다:
```typescript
rollupOptions: {
  input: {
    main: path.resolve(process.cwd(), 'index.html'), // -> dist/index.html (초경량 정적 랜딩)
    home: path.resolve(process.cwd(), 'home.html'),  // -> dist/home.html (리치 게임 SPA)
  },
  ...
}
```

### 5.2 개발 서버(`npm run dev`) 및 프리뷰 서버(`npm run preview`) 라우팅
개발 서버에서 `/home` 접근 시 `home.html`이 서빙되도록 `vite.config.ts`의 미들웨어에 다음 rewrite 처리가 포함되어야 합니다:

```typescript
// vite.config.ts 미들웨어 플러그인 내부
const cleanReqPath = (req.url || '').split('?')[0];
if (cleanReqPath === '/home' || cleanReqPath === '/home/') {
  req.url = '/home.html' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
}
```
이렇게 하면 개발 서버(`localhost:3000`)에서도:
- `http://localhost:3000/` 접속 시 -> `index.html` (신규 정적 랜딩)
- `http://localhost:3000/home` 접속 시 -> `home.html` (리치 게임 SPA)
가 즉시 매끄럽게 서빙됩니다.

---

## 6. 전체 마이그레이션 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Vite Multi-Page Build                            │
├──────────────────────────────────────┬──────────────────────────────────────┤
│  Root Entry: index.html              │  Game Entry: home.html               │
│  Loads: src/landing/index.ts         │  Loads: src/main.tsx                 │
│  Styles: src/landing/landing.css     │  Styles: src/index.css               │
│  Runtime: Pure Static (0 heavy libs) │  Runtime: React 19 + Game Engine     │
└──────────────────┬───────────────────┴──────────────────┬───────────────────┘
                   │                                      │
                   ▼                                      ▼
            dist/index.html                         dist/home.html
          (신규 독립 정적 랜딩)                     (리치 게임 SPA 템플릿)
                   │                                      │
                   │ [보존: 덮어쓰기 금지]                │ [복사 & 프리렌더링]
                   │                                      ├─► dist/home/index.html
                   │                                      ├─► dist/home.html
                   ▼                                      ├─► dist/deck/index.html, dist/deck.html
           https://snshero.com/                           ├─► dist/play/index.html, dist/play.html
         (독립 정적 랜딩 페이지)                          ├─► dist/bench/index.html (SEO)
                                                          ├─► dist/shop/index.html, dist/shop.html
                                                          └─► dist/404.html (SPA Fallback)
                                                                  │
                                                                  ▼
                                                          https://snshero.com/home
                                                        (리치 게임 SPA 메인 로비)
```

---

## 7. 워커 구현 체크리스트 및 독립 검증 방법

### 7.1 워커 구현 체크리스트
- [ ] **Task 1: `src/routes.ts` 수정**
  - `VIEW_ROUTES.home.path`를 `'/home'`으로 변경
  - `getViewPath`의 fallback 경로를 `'/home'`으로 변경
  - `getViewFromPath`에서 `cleanPath === '/home'`만 매핑하고 `'/'` 제거
- [ ] **Task 2: 내비게이션 소비자 수정**
  - `src/components/PageHeader.tsx` (라인 61) -> `'/home'`
  - `src/components/reddit/RedditHeader.tsx` (라인 133) -> `'/home'`
  - `src/components/ShareTemplateCard.tsx` (라인 92) -> `'/home'`
  - `src/views/HomeView.tsx` (라인 267, 842) -> `'/home'`
  - `src/views/ShopView.tsx` (라인 5052) -> `'/home'`
  - `src/views/KadanRpgView.tsx` (라인 973) -> `'/home'`
  - `src/views/ShareView.tsx` (라인 281) -> `'/home'`
  - `src/App.tsx` (라인 5652, 6681, 6713, 6731, 6927) -> `'/home'`
- [ ] **Task 3: `scripts/post-build.js` 수정**
  - `spaTemplatePath`로 `dist/home.html` 로드하도록 변경
  - `routes` 순회 시 `dist/index.html` 보존 및 `dist/home/` 생성 확인
  - `version.json` 엔트리 스크립트 감지 대상에 `home.html` 추가
  - `404.html` 템플릿을 `home.html` 기반으로 복사하도록 설정

### 7.2 독립 검증 방법 (Verification Methods)
1. **TypeScript 타입 검사**:
   ```bash
   npx tsc --noEmit
   ```
   - 0 errors (exit code 0) 확인.
2. **프로덕션 빌드 및 사후 빌드 실행**:
   ```bash
   npm run build
   ```
   - `vite build` 및 `node scripts/post-build.js` 정상 완료 확인.
3. **산출물 격리 검증 (파일 시스템 검사)**:
   ```bash
   # dist/index.html이 정적 랜딩 번들을 로드하는지 확인
   grep -q "src/landing/index.ts" dist/index.html || grep -q "assets/main-" dist/index.html
   
   # dist/home.html이 리치 게임 SPA 번들을 로드하는지 확인
   grep -q "assets/home-" dist/home.html || grep -q "root" dist/home.html
   
   # dist/home/index.html이 존재하는지 확인
   test -f dist/home/index.html && echo "dist/home/index.html exists"
   
   # dist/deck/index.html이 SPA 번들(home.html과 동일한 스크립트)을 로드하는지 확인
   diff <(grep -o "assets/.*\.js" dist/home.html | head -n 1) <(grep -o "assets/.*\.js" dist/deck/index.html | head -n 1)
   ```
4. **브라우저 라우팅 동작 검증**:
   - `npm run preview` 실행 후:
     - `http://localhost:3000/` 접속 -> 정적 랜딩 페이지 로드
     - `http://localhost:3000/home` 접속 -> 게임 SPA 로비 로드
     - 게임 SPA 내 로고 클릭 시 URL이 `/home`으로 유지되는지 확인 (절대 `/`로 바뀌지 않음).

---

## 8. 결론

본 보고서에서 제시한 구현 사양은 `src/routes.ts`의 라우트 매핑 변경과 `scripts/post-build.js`의 템플릿 분리를 통해, 기존 게임 기능 및 하위 라우트의 회귀(Regression) 없이 신규 독립 정적 랜딩 페이지(`/`)와 게임 SPA(`/home`)를 완벽하게 물리적·논리적으로 분리합니다.
워커 에이전트는 본 명세서의 구체적인 Before & After Diff와 파일/라인 번호 가이드를 통해 즉각적인 구현에 착수할 수 있습니다.
