# Handoff Report — Explorer Survey 1 (R1 & R5 Investigation)

- **Agent**: `teamwork_explorer` (Architecture & Routing Specialist)
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/`
- **Target Requirements**:
  - **R1**: 메인 정적 랜딩 페이지 신규 개발 및 소스 완전 분리 (`/` 및 `/index.html`)
  - **R5**: 독립 정적 빌드 및 자동화 검증 환경 (빌드 무결성 & Playwright 브라우저 E2E)
- **Detailed Survey Report**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/survey_report.md`

---

## 1. Observation (직접 관찰된 사실 및 근거)

1. **단일 진입점 및 SPA 강결합 (`index.html` & `src/main.tsx`)**:
   - `index.html` 라인 778: `<script type="module" src="/src/main.tsx"></script>`.
   - `index.html` 라인 781: `<div id="root"></div>`.
   - `src/main.tsx` 라인 153~159: `createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><App /></StrictMode>)`.
   - 관찰 결과: 루트 경로(`/` 및 `/index.html`)로 접속하는 모든 사용자는 예외 없이 React 19, Three.js, TensorFlow, Motion, Firebase, Lucide 아이콘 등이 포함된 거대한 단일 SPA 번들을 다운로드받고 초기화해야 함.

2. **기존 라우팅 매핑 (`src/routes.ts` & `src/App.tsx`)**:
   - `src/routes.ts` 라인 21~28:
     ```typescript
     home: {
       path: '/',
       aliases: ['/home'],
       titleKo: '눈히어로.com - 카단의 여정 (원클릭 AI 웹 카드 게임)',
       ...
     }
     ```
   - `src/routes.ts` 라인 463~465:
     ```typescript
     // 홈 화면 매핑 (/ 또는 /home)
     if (cleanPath === '/' || cleanPath === '/home') {
       return 'home';
     }
     ```
   - 관찰 결과: 현재 시스템에서는 `/`와 `/home`이 동일한 뷰(`HomeView.tsx`)로 매핑되어 있으며, `/`를 순수 정적 랜딩 페이지로 분리하고 `/home`을 리치 게임 홈으로 이동시키기 위해서는 `home.path`를 `'/home'`으로 변경하고 `cleanPath === '/'`와의 매핑을 명시적으로 분리해야 함.

3. **Vite 빌드 설정 (`vite.config.ts`)**:
   - `vite.config.ts` 라인 681~706:
     ```typescript
     base: process.env.VITE_BASE_PATH || './',
     build: {
       outDir: 'dist',
       assetsDir: 'assets',
       emptyOutDir: false,
       rollupOptions: {
         output: {
           entryFileNames: `assets/[name]-[hash].js`,
           ...
         }
       }
     }
     ```
   - 관찰 결과: `rollupOptions.input`이 정의되지 않아 기본값인 루트 `index.html` 단일 엔트리로만 빌드됨. Vite의 네이티브 Multi-Page Application (MPA) 기능을 활용해 `input: { main: 'index.html', home: 'home.html' }`로 설정하면 추가 도구 없이도 독립 정적 랜딩 번들과 리치 게임 SPA 번들을 동시에 생성 가능.

4. **사후 빌드 스크립트 현황 (`scripts/post-build.js`)**:
   - `scripts/post-build.js` 라인 72~93: `routes = ['home', 'bench', 'reddit', 'play', 'deck', 'shop', ...]` 목록을 순회하며 `dist/<route>/index.html`과 `dist/<route>.html` 생성.
   - 라인 208: `fs.writeFileSync(path.join(routeDir, 'index.html'), cleanBaseHtml, 'utf8')`.
   - 확인 결과: `dist/index.html`(크기 45,964 B)과 `dist/home.html`(크기 45,955 B), `dist/home/index.html`(크기 45,955 B)이 모두 동일한 SPA 템플릿 복사본임. `post-build.js`를 수정하여 `dist/index.html`은 순수 정적 랜딩으로 유지하고, `dist/home` 및 기타 SPA 라우트는 `dist/home.html`을 복사하도록 조정해야 함.

5. **캐릭터 이미지 에셋 구비 상태 (3대 규격)**:
   - **7등신 전신 컷아웃**: `public/anime-character-sheets/cutouts/*.png` (110종 영웅 전신 파일 완벽 구비 확인).
   - **상반신 포트레이트**: `public/seat/*.png` (110종 영웅 상반신 고해상도 포트레이트 완벽 구비 확인).
   - **3등신/스프라이트**: `public/cards1.png` (IDs 1~100), `public/cards2.png` (IDs 101~110) 완벽 구비 확인.
   - **웹툰 씬 에셋**: `public/images/webtoon/episode_01/scene_00.webp` ~ `scene_50.webp` 완벽 구비 확인.
   - **웹툰 나레이션 데이터**: `public/book/image_narrations/episode_01_narrations.json` (49개 씬 나레이션 및 대사 구비 확인).

6. **검증 및 자동화 환경 (Playwright 지원 상태)**:
   - 명령어 `python3 -c "from playwright.sync_api import sync_playwright; p = sync_playwright().start(); b = p.chromium.launch(headless=True); ..."` 실행 결과:
     `Playwright Chromium successfully launched and rendered!` 정상 확인.
   - 프로젝트에 Python Playwright 헤드리스 Chromium이 완벽하게 가동되므로, R5 자동화 브라우저 렌더링 및 인터랙션 E2E 테스트 스크립트를 즉시 작성 및 실행 가능.

---

## 2. Logic Chain (논리 추론 과정)

1. **(기반: 관찰 1, 2) 메인 경로 소스 분리의 필요성**:
   - 루트 `/`가 `index.html` -> `src/main.tsx` -> `App.tsx`로 결합되어 있는 한 초기 로딩 지연과 서버/런타임 결합을 피할 수 없다.
   - 따라서 메인 접속 페이지(`/` 및 `/index.html`)의 소스를 완전히 독립된 디렉토리(`src/landing/`)로 분리하고, 순수 HTML/CSS/JS로 구현해야 한다.
   - 기존의 리치 게임 경험을 훼손하지 않기 위해, 기존 SPA의 진입점을 `home.html`로 분리하고 `src/routes.ts`에서 `/home`을 게임 홈으로 매핑하여 대체한다.

2. **(기반: 관찰 3, 4) Vite MPA 듀얼 엔트리 아키텍처의 적합성**:
   - 완전히 별개의 서브 프로젝트를 만들면 빌드 스크립트가 2원화되고 타입스크립트 및 CSS 토큰 공유가 복잡해진다.
   - 반면 Vite의 네이티브 Multi-Page Application (MPA) 설정(`rollupOptions.input = { main: 'index.html', home: 'home.html' }`)을 적용하면:
     - `index.html`은 `src/landing/index.ts`만 불러와 초경량 순수 정적 번들(`dist/index.html`)을 생성한다.
     - `home.html`은 `src/main.tsx`를 불러와 기존 SPA 번들(`dist/home.html`)을 생성한다.
     - `scripts/post-build.js`가 `dist/index.html`을 보존하고, `dist/home.html`을 `dist/home/index.html` 및 기타 SPA 라우트(`deck`, `play`, `shop` 등)로 복사한다.
   - 이로써 정적 호스팅(Nginx, GitHub Pages, Vercel, S3 등) 환경에서 서버 런타임 없이도 `/`는 독립 정적 랜딩으로, `/home`은 기존 SPA로 완벽히 분기된다.

3. **(기반: 관찰 5) 게미피케이션 및 UI 완성도 극대화**:
   - `public/anime-character-sheets/cutouts/`(7등신), `public/seat/`(상반신), `public/cards1.png`(3등신)의 풍부한 에셋이 이미 존재하므로, 정적 랜딩 페이지 전반에 이를 배치하여 시각적 몰입감을 극대화할 수 있다.
   - R4 요구사항인 카드 육성 시스템(1~100레벨, EXP 획득, 레벨업 시 스탯 포인트 획득, 미분배 포인트 보유 시 빨간 점 인디케이터 표시, 스탯 강화 분배, `localStorage` 영구 보존)을 `cardGrowthStore.ts`로 구현하면 가벼운 정적 웹 서비스임에도 높은 수준의 게미피케이션 경험을 제공한다.

4. **(기반: 관찰 6) R5 자동화 검증의 완결성**:
   - Python Playwright 헤드리스 환경이 준비되어 있으므로, `scripts/verify-static-build.ts`(정적 파일/링크 무결성 검사)와 `scripts/test-static-landing-e2e.py`(실제 브라우저 인터랙션 검증)를 결합하여 exit code 0을 검증하는 강력한 자동화 환경을 구축할 수 있다.

---

## 3. Caveats (주의사항 및 한계)

1. **SPA 서브 라우트 새로고침 대응**:
   - 정적 파일 서버(Vite preview, Nginx, GitHub Pages 등)에서 `/home` 또는 `/deck`으로 직접 브라우저 주소를 입력할 경우, 해당 디렉토리에 `index.html`이 존재해야 404가 발생하지 않습니다.
   - `scripts/post-build.js`에서 `dist/home/index.html` 및 각 라우트 폴더를 빠짐없이 생성하므로 프로덕션 빌드에서는 완벽히 동작합니다.
   - 로컬 개발 서버(`npm run dev`)에서는 Vite 미들웨어를 통해 `/home` 요청을 `/home.html`로 내부 리라이트(rewrite) 처리해 주어야 합니다.
2. **로컬스토리지 네임스페이스 격리**:
   - 신규 정적 랜딩 페이지의 카드 육성 데이터는 기존 SPA의 `hero_cards`, `hero_user_stats`와 키 충돌을 방지하기 위해 `hero_static_card_growth_v1`, `hero_static_deck_v1`과 같은 전용 키를 사용해야 합니다.
3. **DESIGN.md 플랫 터미널 스타일 엄격 준수**:
   - 모든 텍스트는 `font-mono`로 일관되게 렌더링되어야 하며, 모서리는 컨테이너 `rounded-none`(0px), 버튼/인풋 `rounded-sm`(4px)을 준수해야 합니다.
   - 모바일 터치 타깃은 반드시 44px 이상(`min-h-[44px]`)으로 보장되어야 합니다.

---

## 4. Conclusion (최종 결론 및 실행 계획)

1. **아키텍처 확정**:
   - Vite Multi-Page App (MPA) 듀얼 엔트리 방식(`index.html` + `home.html`)을 채택하여 소스를 완전히 분리합니다.
   - 메인 접속 경로(`/` 및 `/index.html`)는 순수 정적 웹 서비스로 신규 개발되며 서버 런타임 의존성이 0입니다.
   - 기존 홈 화면 및 SPA는 `/home` 경로로 완벽하게 이전됩니다.
2. **신규 정적 랜딩 웹 서비스 기능 명세**:
   - **홈**: 상하 스크롤 랜딩, 소개(눈히어로, 웹소설, 웹게임, 애니메이션), 공식 연재 링크(네이버 웹소설/웹툰, 문피아).
   - **마이덱**: 내 카드 구성 5장, 덱 TP, 총 TP 심플 뷰.
   - **플레이**: 5대 버튼(닫기, 이전, 다음, 나레이션, TTS 기본 OFF), 웹툰 이미지 뷰어.
   - **카드 (구 미션)**: 수집율, 110종 카드 그리드, 카드 육성(1~100Lv, EXP 획득, 레벨업, 스탯 포인트, 빨간 점 인디케이터, localStorage 영구 보존).
   - **상점**: 8개 지정 품목 심플 그리드.
   - **메뉴 & 모달**: 상단 6개, 사이드 8개, 쇼핑몰/커뮤니티/로그인 "준비 중" 모달, 온보딩 팝업 0%.
3. **검증 하네스 (R5)**:
   - 빌드 무결성 검증기 (`scripts/verify-static-build.ts`).
   - Playwright E2E 검증기 (`scripts/test-static-landing-e2e.py`).

---

## 5. Verification Method (독립 검증 방법)

워커 에이전트가 구현을 완료한 후, 다음 절차를 통해 독립적으로 검증할 수 있습니다:

1. **정적 빌드 검증**:
   ```bash
   npm run build
   ```
   - 빌드가 에러 없이 성공하고, `dist/index.html`과 `dist/home.html`, `dist/home/index.html`이 정상 생성되었는지 확인.
   - `dist/index.html`의 크기가 초경량(< 50KB)인지 확인.

2. **빌드 무결성 자동 검증기 실행**:
   ```bash
   npx tsx scripts/verify-static-build.ts
   ```
   - 모든 에셋 링크(CSS, JS, 7등신/상반신 이미지)가 404 없이 정상 확인되고 exit code 0을 반환하는지 검증.

3. **Playwright 브라우저 E2E 자동화 테스트 실행**:
   ```bash
   python3 scripts/test-static-landing-e2e.py
   ```
   - 헤드리스 Chromium에서 뷰포트 반응성(모바일/태블릿/데스크톱), 상단 6개/사이드 8개 메뉴, 준비 중 모달, 카드 육성(EXP -> 레벨업 -> 스탯 분배 -> 빨간 점 인디케이터), 브라우저 새로고침 후 `localStorage` 영구 보존, 팝업 0건 여부를 자동 검증하고 exit code 0을 반환하는지 확인.

4. **프리뷰 서버 HTTP 헤더 및 라우트 확인**:
   ```bash
   curl -s -I http://localhost:3000/
   curl -s -I http://localhost:3000/home
   ```
   - 두 엔드포인트 모두 HTTP 200 OK를 반환하며 정상 서빙되는지 확인.
