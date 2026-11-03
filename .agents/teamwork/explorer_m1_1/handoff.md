# Handoff Report — Explorer M1-1

- **Role**: Milestone 1 Explorer (`teamwork_explorer`)
- **Author**: Explorer M1-1 (`40676966-1cd7-46c5-8e57-d60b30e60e78`)
- **Recipient**: Parent Orchestrator (`7b342c7a-1d74-43d7-a388-5ffc926b3969`)
- **Target Task**: Milestone 1 HTML Entry Points Separation (`index.html` & `home.html`)
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_1/`

---

## 1. Observation

1. **`index.html` 분석**:
   - 위치: `/Users/dayyoung/project/snshero/index.html` (총 869 라인).
   - 라인 4~32: Google Ads (`AW-980426001`), GA4 (`G-MT60DTV1KJ`), `gtag_report_conversion` 함수.
   - 라인 33~65: 캐시 메타 태그, Google 인증, RSS 피드, 뷰포트, 폰트(Inter/JetBrains Mono), 타이틀, OpenGraph, Twitter 태그.
   - 라인 69~698: 총 7종의 정적 JSON-LD 스키마 (Organization, SiteNavigationElement, ItemList, BookSeries, WebSite, SoftwareApplication/VideoGame, BreadcrumbList, HowTo, FAQPage, ItemList).
   - 라인 700~710: 12개 언어 hreflang 태그 (`ja`, `zh-CN`, `zh-TW`, `de`, `es`, `fr`, `id`, `ru`, `th`, `vi`, `x-default`).
   - 라인 717: Google AdSense 스크립트 (`ca-pub-6937094123258335`).
   - 라인 719: `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />`.
   - 라인 720~751: `#root:empty` ("AI 카드 배틀 엔진을 불러오는 중입니다...") 스플래시 스타일.
   - 라인 752~776: `hero_boot_retries` 인라인 워치독 스크립트.
   - 라인 778: `<script type="module" src="/src/main.tsx"></script>`.
   - 라인 781: `<div id="root"></div>`.
   - 라인 784~865: 크롤러용 정적 `<nav aria-label="...">` 태그.

2. **`home.html` 부재 확인**:
   - `view_file` 실행 시: `stat /Users/dayyoung/project/snshero/home.html: no such file or directory`. 신규 생성이 필요함.

3. **`vite.config.ts` 분석**:
   - 위치: `/Users/dayyoung/project/snshero/vite.config.ts` (778 라인).
   - 라인 685~705: `build.rollupOptions`에 `input` 옵션이 지정되어 있지 않아 기본 단일 진입점(`index.html`)만 빌드하고 있음.
   - 라인 65~630: `public-wildcard-static-plugin` 미들웨어가 존재하여 `/home` URL에 대한 리라이트 처리를 손쉽게 추가 가능.

4. **`scripts/post-build.js` 분석**:
   - 위치: `/Users/dayyoung/project/snshero/scripts/post-build.js` (249 라인).
   - 라인 95~97: `const indexPath = path.join(distDir, 'index.html'); const baseHtml = fs.readFileSync(indexPath, 'utf8');`.
   - 라인 208: 모든 SPA 서브 라우트(`dist/home`, `dist/deck`, `dist/play` 등)에 `dist/index.html`을 복사하고 있음.
   - `dist/index.html`이 정적 랜딩으로 교체되면 SPA 라우트가 파손되므로 `dist/home.html`을 템플릿으로 참조하도록 수정해야 함.

5. **`src/routes.ts` 분석**:
   - 위치: `/Users/dayyoung/project/snshero/src/routes.ts` (518 라인).
   - 라인 21~28: `home: { path: '/', aliases: ['/home'], ... }`.
   - 라인 424: `getViewPath` 폴백이 `'/'`임.
   - 라인 463~465: `if (cleanPath === '/' || cleanPath === '/home') return 'home';`.
   - 이를 `path: '/home'` 및 `cleanPath === '/home'`으로 분리해야 함.

---

## 2. Logic Chain

1. **[Observation 1, 2]에 기반한 엔트리 분리 필연성**:
   - 현재 `index.html`은 루트 `/` 접속 시 `src/main.tsx`를 로드하므로 React 19와 모든 서브 라이브러리가 강제 실행됨.
   - 따라서 `index.html`에서 `src/main.tsx`, `#root:empty` 스타일, Leaflet CSS, 워치독 스크립트를 제거하고 `src/landing/index.ts` 및 `<div id="landing-root"></div>`로 교체해야만 React 런타임 의존성 0인 초경량 정적 랜딩 페이지가 실현됨.
   - 동시에 기존 리치 게임 SPA를 유지하기 위해 `home.html`을 신규 생성하여 기존의 메타 태그, `#root`, 워치독, `src/main.tsx`를 완전히 보존해야 함.

2. **[Observation 3]에 기반한 Vite MPA 롤업 구성**:
   - Vite 6은 `rollupOptions.input`에 복수 엔트리를 전달하면 각각을 독립적인 HTML 번들로 생성함.
   - `{ main: 'index.html', home: 'home.html' }`로 설정하면 `dist/index.html`과 `dist/home.html`이 각각 알맞은 의존성 청크만 참조하여 분리 빌드됨.

3. **[Observation 4]에 기반한 배포 라우트 무결성 보장**:
   - 빌드 후 `dist/index.html`은 순수 정적 랜딩 페이지이므로, SPA 기능이 필요한 `/home`, `/deck`, `/play` 등 40여 개 서브라우트는 `dist/home.html`을 베이스 템플릿으로 사용하여 생성해야 기능 퇴행(Regression)이 방지됨.
   - `dist/404.html` 역시 SPA 딥링크 폴백을 위해 `dist/home.html` 기반으로 복사해야 함.

4. **[Observation 5]에 기반한 SPA 내부 라우팅 정합성**:
   - `VIEW_ROUTES.home.path`를 `'/home'`으로 변경하면 `getViewPath('home')`이 `'/home'`을 반환하여 SPA 내부에서 홈 클릭 시 `/home` 경로로 이동함.
   - 루트 `/`는 독립 정적 랜딩 페이지의 고유 경로로 완전히 디커플링됨.

---

## 3. Caveats

- **최소 스텁 파일 선행 생성 필요**: 워커가 `index.html`을 수정할 때 `/src/landing/index.ts`와 `/src/landing/styles/landing.css` 파일이 없으면 `npm run build` 단계에서 Vite import-analysis 에러가 발생하므로, 구현 시작 즉시 최소 부트스트랩 스텁 파일을 함께 생성해야 합니다.
- **기존 SEO 메타 태그 무단 수정 금지**: `index.html`에 이미 최적화된 7개 JSON-LD 스키마와 Google Ads 전환 태그는 검색 순위 및 광고 운영에 필수적이므로, 임의로 축소하거나 삭제하지 않고 그대로 보존해야 합니다.

---

## 4. Conclusion

1. **`index.html`**:
   - 기존 모든 SEO 메타 태그, JSON-LD, 폰트, 애드센스 태그를 보존.
   - 라인 718~781을 `/src/landing/styles/landing.css`, `<script type="module" src="/src/landing/index.ts"></script>`, `<div id="landing-root"></div>`로 정밀 교체.
2. **`home.html`**:
   - 프로젝트 루트에 신규 생성하여 기존 SPA 메타 태그, Leaflet CSS, `#root:empty` 스플래시 스타일, 워치독 스크립트, `<div id="root"></div>`, `<script type="module" src="/src/main.tsx"></script>` 완전 구현.
   - 캐노니컬 URL을 `https://snshero.com/home`으로 설정.
3. **연동 설정 (`vite.config.ts`, `post-build.js`, `routes.ts`)**:
   - `vite.config.ts`: `rollupOptions.input` 듀얼 엔트리 및 `/home` URL 리라이트 미들웨어 추가.
   - `scripts/post-build.js`: SPA 라우트 생성을 `home.html` 기준으로 전환하고 `dist/index.html` 보존.
   - `src/routes.ts`: `home.path = '/home'` 및 `cleanPath === '/home'` 매핑.
4. 모든 상세 코드 블록과 단계별 작업 명세는 `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_1/survey_report.md`에 기술 완료.

---

## 5. Verification Method

워커가 구현을 마친 후 다음 명령으로 독립 검증을 수행합니다:

```bash
# 1. TypeScript 컴파일 무결성 검증 (0 에러)
npx tsc --noEmit

# 2. Vite 멀티페이지 빌드 및 post-build 실행
npm run build

# 3. 필수 산출물 파일 존재 및 크기 검증
ls -la dist/index.html dist/home.html dist/home/index.html

# 4. 정적 랜딩 번들의 React 비포함(초경량) 검증
grep -q "vendor-react" dist/index.html && echo "FAIL: React found in index.html" || echo "PASS: index.html is ultra-light"
grep -q "/src/landing/index.ts" index.html && echo "PASS: index.html references landing entry"
grep -q "/src/main.tsx" home.html && echo "PASS: home.html references main.tsx"
```

**무효화 조건**:
- `npm run build` 실패 (exit code != 0).
- `dist/index.html`에 React 청크가 번들링되는 경우.
- `dist/home.html` 또는 `dist/home/index.html`이 생성되지 않는 경우.
- `/home` 접속 시 기존 리치 게임 SPA가 마운트되지 않는 경우.
