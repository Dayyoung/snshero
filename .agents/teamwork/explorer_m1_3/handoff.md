# Handoff Report: Milestone 1 Routing Migration & Post-Build Script Specification

- **Reporter**: Explorer Agent (`teamwork_explorer_m1_3`)
- **Recipient**: Parent Orchestrator (`7b342c7a-1d74-43d7-a388-5ffc926b3969`) / M1 Implementation Worker
- **Date**: 2026-11-02T03:42:00Z
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_3/`
- **Report Reference**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_3/survey_report.md`

---

## 1. Observation (직접 관찰 사실)

### 1.1 `src/routes.ts`
- **경로**: `/Users/dayyoung/project/snshero/src/routes.ts`
- **라인 21~28 (`VIEW_ROUTES.home`)**:
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
- **라인 422~425 (`getViewPath`)**:
  ```typescript
  export function getViewPath(view: ViewType): string {
    const route = VIEW_ROUTES[view];
    return route ? route.path : '/';
  }
  ```
- **라인 462~465 (`getViewFromPath`)**:
  ```typescript
  // 홈 화면 매핑 (/ 또는 /home)
  if (cleanPath === '/' || cleanPath === '/home') {
    return 'home';
  }
  ```

### 1.2 `scripts/post-build.js`
- **경로**: `/Users/dayyoung/project/snshero/scripts/post-build.js`
- **라인 16~26 (`entryScript` 감지)**:
  `const builtIndexHtmlPath = path.join(distDir, 'index.html');`에서만 `scriptMatch`를 탐색함.
- **라인 95~98 (`baseHtml` 로딩)**:
  ```javascript
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    const baseHtml = fs.readFileSync(indexPath, 'utf8');
  ```
  `dist/index.html`을 모든 라우트 복사의 베이스 템플릿으로 사용함.
- **라인 184~213 (`routes` 루프)**:
  `for (const route of routes)`를 돌며 `dist/${route}/index.html`과 `dist/${route}.html`에 `cleanBaseHtml` (`dist/index.html`에서 읽은 내용)을 작성함.
- **라인 225~230 (`404.html`)**:
  `fs.copyFileSync(indexPath, notFoundPath);`로 `dist/index.html`을 복사함.

### 1.3 내비게이션 소비자 (`pushState` 하드코딩)
- **`src/components/PageHeader.tsx:61`**: `window.history.pushState({ view: 'home' }, '', '/');`
- **`src/components/reddit/RedditHeader.tsx:133`**: `window.history.pushState({ view: 'home' }, '', '/');`
- **`src/components/ShareTemplateCard.tsx:92`**: `window.history.pushState({ view: 'home' }, '', '/');`
- **`src/views/HomeView.tsx:267, 842`**: `window.history.pushState({ view: 'home' }, '', '/');`
- **`src/views/ShopView.tsx:5052`**: `window.history.pushState({ view: 'home' }, '', '/');`
- **`src/views/KadanRpgView.tsx:973`**: `window.history.pushState({ view: 'home' }, '', '/');`
- **`src/views/ShareView.tsx:281`**: `window.history.pushState({ view: 'home' }, '', '/');`
- **`src/App.tsx:5652, 6681, 6731, 6927`**: `window.history.pushState(null, '', '/');`
- **`src/App.tsx:6713`**: `targetView === 'home' ? '/' : '/' + targetView`

### 1.4 `dist/` 빌드 현황
- `dist/index.html` (45,964 바이트)과 `dist/home.html` (45,955 바이트)가 현재 모두 기존 리치 게임 SPA 번들을 담고 있음 (`ls -la dist/` 실행 결과 확인).

---

## 2. Logic Chain (논리 추론 과정)

1. **[기반: 관찰 1.4 & ORIGINAL_REQUEST R1]**:
   - 신규 정적 랜딩 페이지는 루트(`/` 및 `/index.html`)에 배치되고, 기존 게임 SPA는 `/home`으로 분리된다.
   - Vite MPA 듀얼 엔트리(`{ main: 'index.html', home: 'home.html' }`)가 빌드되면, `dist/index.html`은 초경량 정적 랜딩 번들이 되고 `dist/home.html`은 리치 게임 SPA 번들이 된다.
2. **[추론: 관찰 1.2 기반 위험성 도출]**:
   - 현재 `scripts/post-build.js`는 `dist/index.html`을 읽어 `baseHtml`로 삼고 모든 SPA 라우트(`dist/bench/`, `dist/deck/`, `dist/play/` 등)를 생성한다.
   - 만약 이 상태에서 빌드를 실행하면, 모든 SPA 서브라우트가 정적 랜딩 페이지 번들로 덮어써져 게임 기능을 완전히 상실하는 심각한 번들링 결함이 발생한다.
   - 따라서 `post-build.js`는 `dist/home.html`을 SPA 베이스 템플릿으로 읽어야 하며, `dist/index.html`은 절대 덮어쓰지 않고 보존해야 한다.
3. **[추론: 관찰 1.1 기반 라우팅 분리 도출]**:
   - `src/routes.ts`에서 `VIEW_ROUTES.home.path`가 `'/'`이면, SPA 내부에서 홈으로 이동할 때마다 URL이 `'/'`로 push되어 정적 랜딩 페이지 경로와 충돌한다.
   - 따라서 `VIEW_ROUTES.home.path`를 `'/home'`으로 변경하고, `getViewPath` fallback도 `'/home'`으로 설정해야 한다.
   - `getViewFromPath`에서 `cleanPath === '/'` 매핑을 제거하고 `cleanPath === '/home'`만 매핑하여 루트 접근을 완전히 분리(decouple)해야 한다.
4. **[추론: 관찰 1.3 기반 내비게이션 소비자 정합성 도출]**:
   - `App.tsx`, `PageHeader.tsx`, `RedditHeader.tsx` 등에 하드코딩된 `pushState(..., '/')`는 로고 클릭 시 사용자를 강제로 `'/'`로 이동시킨다.
   - 이를 방치하면 게임 중 로고를 눌렀을 때 정적 랜딩 URL로 오염되므로, 이들 10개소를 모두 `'/home'`으로 수정해야 완벽한 격리가 완성된다.

---

## 3. Caveats (제약 사항 및 주의점)

1. **Vite 개발 서버 환경**:
   - 개발 서버(`npm run dev`)에서 `http://localhost:3000/home`으로 직접 접근 시, Vite의 기본 동작에 따라 404가 발생하거나 `index.html`로 폴백될 수 있습니다. `vite.config.ts`의 커스텀 미들웨어에서 `/home` 요청을 `/home.html`로 rewrite 처리해주는 작업이 M1 워커 작업에 포함되어야 합니다.
2. **기존 로컬스토리지 보존**:
   - `hero_current_view` 등 기존 사용자 상태에 `'home'`이 저장되어 있는 경우 문제없이 `/home` 뷰로 마운트됩니다.
3. **타 영역 비간섭**:
   - 본 분석은 라우팅 및 사후 빌드 스크립트 명세에 집중하였으며, `src/landing/` 신규 컴포넌트 구현(M2/M3)이나 실제 소스 코드 수정은 포함하지 않았습니다 (Read-only 규칙 준수).

---

## 4. Conclusion (최종 결론 및 액션 아이템)

1. **`src/routes.ts` 수정 명세 확정**:
   - `VIEW_ROUTES.home.path = '/home'`, `aliases = ['/main-lobby']`
   - `getViewPath(view)` fallback -> `'/home'`
   - `getViewFromPath` -> `if (cleanPath === '/home') return 'home';`
2. **`scripts/post-build.js` 수정 명세 확정**:
   - `const spaTemplatePath = fs.existsSync(homeHtmlPath) ? homeHtmlPath : indexPath;`
   - `dist/index.html`은 순수 정적 랜딩 페이지로 절대 보존 (`route === '' || route === '/' || route === 'index'` 스킵 가드 추가)
   - `routes` 순회 시 `cleanBaseHtml`을 `dist/home/index.html`, `dist/home.html` 및 모든 SPA 서브라우트에 배포
   - `404.html` 생성 템플릿을 `home.html` 기반으로 복사
3. **내비게이션 소비자 10개소 치환 명세 확정**:
   - `src/components/PageHeader.tsx:61` 등 10개소 `pushState` 대상 경로를 `'/home'`으로 치환.

---

## 5. Verification Method (독립 검증 방법)

워커 구현 후 다음 명령과 검증 절차를 순차적으로 실행하여 검증합니다:

1. **타입 안전성 검증**:
   ```bash
   npx tsc --noEmit
   ```
   - 정상 종료 (`exit code 0`).
2. **프로덕션 빌드 및 사후 빌드 검증**:
   ```bash
   npm run build
   ```
   - `vite build` 및 `node scripts/post-build.js` 정상 완료 (`exit code 0`).
3. **산출물 무결성 및 템플릿 분리 검증**:
   ```bash
   # 1) dist/home/index.html 존재 확인
   test -f dist/home/index.html && echo "PASS: dist/home/index.html exists"
   
   # 2) dist/home.html 존재 확인
   test -f dist/home.html && echo "PASS: dist/home.html exists"
   
   # 3) dist/deck/index.html과 dist/home.html의 스크립트 청크 일치 여부 확인 (SPA 템플릿 사용 검증)
   diff <(grep -o "assets/.*\.js" dist/home.html | head -n 1) <(grep -o "assets/.*\.js" dist/deck/index.html | head -n 1) && echo "PASS: SPA routes use home.html template"
   
   # 4) dist/index.html이 SPA 템플릿으로 덮어써지지 않았는지 확인
   ```
4. **런타임 라우팅 프리뷰 검증**:
   ```bash
   npm run preview
   ```
   - 브라우저에서 `http://localhost:3000/home` 접근 시 리치 게임 SPA가 렌더링되고, 로고 클릭 시 주소창이 `/home`으로 유지되는지 확인.
