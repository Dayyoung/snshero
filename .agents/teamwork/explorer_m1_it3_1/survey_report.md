# Survey Report: Post-Build Nested Route `.html` Missing Defect & Fix Specification

- **Author**: Explorer M1 Iteration 3 (`teamwork_explorer`)
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_1/`
- **Date**: 2026-11-02T04:48:30Z
- **Target File**: `scripts/post-build.js` (and supplementary SEO scripts)
- **Status**: COMPLETE

---

## 1. Executive Summary (요약)

Milestone 1 Iteration 2 Challenger(`challenger_m1_it2_2`)가 발견한 **중첩 SPA 라우트 트레일링 슬래시 누락 시 정적 랜딩 페이지(`#landing-root`)로 폴백되는 결함**의 원인을 정밀 분석했습니다.

- **결함의 직접적 원인**: `scripts/post-build.js` line 229의 `if (!route.includes('/'))` 가드로 인해, 슬래시(`/`)가 포함된 중첩 라우트(`wiki/card`, `r/hanguk`, `r/hanguk/comments/...` 등)에 대해 `dist/[route].html` 파일 생성이 완전히 누락되었습니다.
- **영향**: 정적 웹 서버(Vite preview, Nginx, CDN 등)가 `/wiki/card` 요청을 수신했을 때, 확장자 없는 클린 URL 파일(`dist/wiki/card.html`)을 찾지 못해 기본 SPA 폴백 파일인 `dist/index.html`을 서빙합니다. Milestone 1에서 `dist/index.html`은 **독립 정적 랜딩 페이지**로 분리되었기 때문에 사용자는 위키나 레딧 대신 랜딩 페이지를 마주하게 됩니다.
- **해결 사양**: `scripts/post-build.js`에서 `if (!route.includes('/'))` 조건을 제거하고, 부모 디렉토리를 안전하게 보장(`fs.mkdirSync(path.dirname(flatHtmlPath), { recursive: true })`)하면서 모든 라우트에 대해 `${route}.html`을 생성하도록 수정합니다. 또한 `dist/index.html`을 절대 덮어쓰지 않는 이중 안전 가드를 적용합니다.

---

## 2. Empirical Observations & Issue Reproduction (실측 관측 및 문제 재현)

### 2.1 Adversarial Test Suite Failure (`tests/adversarial_route_edge_cases.ts`)
- **실행 결과**: 76개 단언 중 73개 PASS, **3개 FAIL (96.1% PASS)**
- **실패 항목**:
  1. `[FAIL] [LIVE-HTTP-24] GET /r/hanguk (deep route)`: Expected 200 with `#root` and `home-`, got status 200, `hasRoot=false`, `hasScript=false`
  2. `[FAIL] [LIVE-HTTP-26] GET /r/hanguk/comments/post_vibecoding_master`: Expected 200 with `#root` and `home-`, got status 200, `hasRoot=false`, `hasScript=false`
  3. `[FAIL] [LIVE-HTTP-28] GET /wiki/card (nested deep route without trailing slash)`: Expected 200 with `#root` and `home-`, got status 200, `hasRoot=false`, `hasScript=false`

### 2.2 Live HTTP Direct Probe (`localhost:3000`)
```bash
# 1. 트레일링 슬래시 없는 중첩 라우트 요청 (결함 발생):
curl -s http://localhost:3000/wiki/card | grep -o 'id="[^"]*"'
# 결과: id="landing-root" (비정상: 정적 랜딩 페이지 서빙!)

curl -s http://localhost:3000/r/hanguk | grep -o 'id="[^"]*"'
# 결과: id="landing-root" (비정상: 정적 랜딩 페이지 서빙!)

# 2. 트레일링 슬래시 있는 중첩 라우트 요청 (정상):
curl -s http://localhost:3000/wiki/card/ | grep -o 'id="[^"]*"'
# 결과: id="root" (정상: SPA 셸 서빙)

# 3. 루트 단일(flat) 라우트 요청 (정상):
curl -s http://localhost:3000/deck | grep -o 'id="[^"]*"'
# 결과: id="root" (정상: dist/deck.html 직접 서빙)
```

### 2.3 Filesystem Inspection in `dist/`
- **Flat Routes (`deck`, `play`, `shop`, `reddit` 등)**:
  - `dist/deck/index.html` (존재)
  - `dist/deck.html` (존재)
  - 결과: `/deck` 접속 시 `dist/deck.html`이 즉시 서빙됨.
- **Nested Routes (`wiki/card`, `wiki/howtoplay`, `r/hanguk` 등)**:
  - `dist/wiki/card/index.html` (존재)
  - `dist/wiki/card.html` (**부재! 누락됨**)
  - 결과: `/wiki/card` 접속 시 `dist/wiki/card.html`이 없으므로 Vite preview가 `dist/index.html`로 폴백 서빙함.

---

## 3. Root Cause Analysis (근본 원인 분석)

### 3.1 `scripts/post-build.js` lines 227–232
```javascript
} else {
  fs.writeFileSync(path.join(routeDir, 'index.html'), cleanBaseHtml, 'utf8');
  if (!route.includes('/')) {
    fs.writeFileSync(path.join(distDir, `${route}.html`), cleanBaseHtml, 'utf8');
  }
}
```
- `routes` 배열에는 중첩 라우트들(`wiki/card`, `wiki/howtoplay`, `wiki/tip`, `r/hanguk`, `r/technology`, `r/gaming`, `r/hanguk/comments/post_vibecoding_master` 등)이 포함되어 있습니다.
- `if (!route.includes('/'))` 조건으로 인해 슬래시가 포함된 모든 라우트는 `${route}.html` 생성이 건너뛰어졌습니다.

### 3.2 정적 웹 서버(Static Web Server)의 Clean URL 매핑 원리
1. 클라이언트가 `GET /wiki/card`를 요청합니다.
2. 서버는 먼저 정적 파일 매핑을 시도합니다:
   - 파일 `dist/wiki/card` 탐색 -> 디렉토리임.
   - 클린 URL 파일 `dist/wiki/card.html` 탐색 -> **없음!**
3. URL 끝에 `/`가 없으므로 서버는 디렉토리 기본 인덱스(`dist/wiki/card/index.html`)를 직접 열지 않고, SPA history fallback 규칙에 따라 루트 `dist/index.html`을 서빙합니다.
4. Milestone 1 이전에는 `dist/index.html`이 게임 SPA 셸이었으므로 브라우저 클라이언트 라우터가 `/wiki/card`를 해석하여 문제를 가렸으나, **Milestone 1에서 `dist/index.html`이 순수 정적 랜딩 페이지(`#landing-root`)로 분리**되면서 결함이 외부로 완전히 노출되었습니다.

### 3.3 왜 `/movie/ep-1`은 테스트를 통과했는가?
- `vite.config.ts`의 `public-wildcard-static-plugin`은 `public/` 디렉토리에 물리적으로 존재하는 폴더(`public/movie/ep-1`)에 대해 트레일링 슬래시가 없으면 `301 Moved Permanently` (`Location: /movie/ep-1/`)를 반환합니다.
- 테스트 하네스 `fetchHttp`가 301 리다이렉트를 따라 `/movie/ep-1/`로 접근하여 우연히 통과한 것입니다.
- 그러나 `wiki/card`와 `r/hanguk`은 `public/`에 없고 오직 빌드 산출물인 `dist/`에만 존재하므로, 플러그인이 가로채지 못하고 Vite preview의 기본 SPA fallback(`dist/index.html`)으로 직행했습니다.

---

## 4. Concrete Fix Specification (구체적 수정 코드 사양)

Worker 에이전트가 `scripts/post-build.js`에 적용해야 하는 구체적인 구현 사양입니다.

### 4.1 Target File: `scripts/post-build.js`
- **수정 위치**: lines 199–233 (SPA 라우트 생성 루프)

#### Before:
```javascript
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
```

#### After (수정 사양):
```javascript
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
    // Strict isolation guard: never overwrite dist/index.html (the standalone static landing page)
    if (flatHtmlPath !== indexPath && path.relative(distDir, flatHtmlPath) !== 'index.html') {
      const flatHtmlDir = path.dirname(flatHtmlPath);
      if (!fs.existsSync(flatHtmlDir)) {
        fs.mkdirSync(flatHtmlDir, { recursive: true });
      }
      fs.writeFileSync(flatHtmlPath, targetHtml, 'utf8');
    }
  }
```

### 4.2 사양의 기술적 핵심 보장 사항
1. **모든 라우트에 대한 일관된 이중 산출물 생성**:
   - `dist/wiki/card/index.html` AND `dist/wiki/card.html`
   - `dist/r/hanguk/index.html` AND `dist/r/hanguk.html`
   - `dist/r/hanguk/comments/post_vibecoding_master/index.html` AND `dist/r/hanguk/comments/post_vibecoding_master.html`
2. **재귀적 부모 디렉토리 생성 보장**:
   - `path.dirname(flatHtmlPath)`가 존재하지 않을 때 `fs.mkdirSync(flatHtmlDir, { recursive: true })`를 수행하여, 라우트 순서나 깊이(3단계 이상)에 관계없이 `ENOENT` 에러를 원천 차단합니다.
3. **`dist/index.html` (정적 랜딩) 덮어쓰기 원천 방지**:
   - `flatHtmlPath !== indexPath && path.relative(distDir, flatHtmlPath) !== 'index.html'` 이중 가드를 통해 어떤 경우에도 루트 `dist/index.html`이 SPA HTML로 오염되는 것을 차단합니다.

---

## 5. Supplementary Hardening (보강 권고사항)

### 5.1 `scripts/generate-video-seo.ts`
`writeHtmlToPublicAndDist` 함수에서 에피소드 정적 HTML을 쓸 때 `${relDir}/index.html` 외에 `${relDir}.html`도 함께 작성하도록 보강 권고:
```typescript
function writeHtmlToPublicAndDist(relDir: string, html: string) {
  const targets = [path.join(publicDir, relDir)];
  if (fs.existsSync(distDir)) {
    targets.push(path.join(distDir, relDir));
  }
  for (const dir of targets) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
    // Also emit clean .html file alongside directory
    const flatFile = `${dir}.html`;
    const flatParent = path.dirname(flatFile);
    if (!fs.existsSync(flatParent)) {
      fs.mkdirSync(flatParent, { recursive: true });
    }
    fs.writeFileSync(flatFile, html, 'utf8');
  }
}
```

### 5.2 `scripts/generate-news-seo.ts`
개별 뉴스 기사 루프(lines 681–697)에서도 `index.html`과 함께 `${aliasId}.html`을 작성하도록 보강 권고:
```typescript
for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(dir, 'index.html'), articleHtml, 'utf8');
  // Also emit clean .html file for news alias
  const flatPath = `${dir}.html`;
  const flatParent = path.dirname(flatPath);
  if (!fs.existsSync(flatParent)) {
    fs.mkdirSync(flatParent, { recursive: true });
  }
  fs.writeFileSync(flatPath, articleHtml, 'utf8');
}
```

---

## 6. Verification Plan & Test Commands

Worker가 수정을 적용한 후 검증해야 하는 테스트 명령 및 기준:

1. **빌드 파이프라인 실행**:
   ```bash
   npm run build
   ```
2. **적대적 라우트 엣지케이스 테스트 (76개 전수 통과 확인)**:
   ```bash
   npx tsx tests/adversarial_route_edge_cases.ts
   # 기대 결과: 76 Executed, 76 Passed, 0 Failed (100.0% PASS)
   ```
3. **직접 HTTP 요청 검증 (반드시 `#root` 확인)**:
   ```bash
   curl -s http://localhost:3000/wiki/card | grep -o 'id="[^"]*"'
   # 기대 결과: id="root" (landing-root 가 아니어야 함!)

   curl -s http://localhost:3000/r/hanguk | grep -o 'id="[^"]*"'
   # 기대 결과: id="root"

   curl -s http://localhost:3000/r/hanguk/comments/post_vibecoding_master | grep -o 'id="[^"]*"'
   # 기대 결과: id="root"
   ```
4. **기존 베이스라인 테스트 슈트 통과 확인**:
   ```bash
   npx tsx tests/adversarial_m1_build_pipeline.ts
   npx tsx tests/challenger_m1_adversarial.ts
   npx tsx tests/e2e/run_all.ts --milestone M1
   ```

---

## 7. Invalidation Conditions
- `curl -s http://localhost:3000/wiki/card` 접속 시 `id="landing-root"`가 응답되는 경우.
- `dist/index.html`에 `id="root"`가 들어가 정적 랜딩 격리가 훼손되는 경우.
- `npx tsx tests/adversarial_route_edge_cases.ts`에서 실패가 1건이라도 발생하는 경우.
