# Milestone 1: Vite Multi-Page Application (MPA) 번들러 설정 및 rollupOptions input 정밀 사양서

- **문서 ID**: `SPEC-M1-MPA-001`
- **작성자**: 탐색 에이전트 (`teamwork_explorer`, Bundler & Architecture Specialist)
- **작업 디렉토리**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_2/`
- **조사 일시**: 2026-11-02T03:40:00Z
- **대상 파일**:
  - `vite.config.ts` (Vite 6 번들러 설정)
  - `scripts/post-build.js` (빌드 후 라우트 생성기)
  - `src/routes.ts` (클라이언트 라우터 정의)
  - `home.html` (신규 SPA 엔트리 HTML)
  - `index.html` (독립 정적 랜딩 엔트리 HTML)

---

## 1. 개요 및 조사 목적

Milestone 1의 핵심 목표는 SNSHero 애플리케이션을 **독립 정적 랜딩 웹 서비스(`/` 및 `/index.html`)**와 **리치 게임 SPA(`/home` 및 `/home.html`)**로 물리적·논리적으로 완전 분리하는 듀얼 엔트리 Multi-Page Application (MPA) 아키텍처를 수립하는 것입니다.

본 보고서는 `vite.config.ts` 번들러 설정의 `build.rollupOptions.input`을 비롯하여, 청크 분리, `manualChunks` 호환성, 개발 서버(`npm run dev`) 및 프리뷰 서버(`npm run preview`) 라우팅 재작성(URL rewrite) 미들웨어, `post-build.js` 연계 사양까지 워커가 즉시 복사하여 적용할 수 있는 구체적인 프로덕션 코드 레벨의 사양을 제시합니다.

---

## 2. 현행 `vite.config.ts` 정밀 분석 및 문제점

### 2.1 현행 `build.rollupOptions` 상태 (라인 681~706)
현재 `vite.config.ts`의 `build` 섹션:
```typescript
build: {
  outDir: 'dist',
  assetsDir: 'assets',
  emptyOutDir: false,
  rollupOptions: {
    output: {
      entryFileNames: `assets/[name]-[hash].js`,
      chunkFileNames: `assets/[name]-[hash].js`,
      assetFileNames: `assets/[name]-[hash][extname]`,
      manualChunks(id) {
        if (id.includes('webtoonEpisodeManifest')) return 'data-webtoon';
        if (id.includes('src/lib/i18n')) return 'data-i18n';
        if (!id.includes('node_modules')) return undefined;
        if (id.includes('/@tensorflow/') || id.includes('/seedrandom/')) return 'vendor-tensorflow';
        if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'vendor-firebase';
        if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/') || id.includes('/use-sync-external-store/')) return 'vendor-react';
        if (id.includes('/motion/') || id.includes('/motion-dom/') || id.includes('/motion-utils/') || id.includes('/framer-motion/')) return 'vendor-motion';
        if (id.includes('/lucide-react/')) return 'vendor-icons';
        if (id.includes('/@paypal/') || id.includes('/paypal')) return 'vendor-payments';
        if (id.includes('/axios/')) return 'vendor-network';
        if (id.includes('/jsqr/') || id.includes('/qrcode.react/')) return 'vendor-scanners';
        return 'vendor-misc';
      },
    },
  },
}
```
- **관찰 결과 1**: `rollupOptions.input`이 지정되어 있지 않아 기본값으로 루트의 `index.html` 단일 페이지만 빌드됩니다.
- **관찰 결과 2**: ESM 환경(`"type": "module"` in `package.json`)에서 `vite.config.ts` 전체에 걸쳐 `__dirname` 대신 `process.cwd()`를 사용하고 있습니다 (라인 42, 52, 235, 303, 712). 만약 워커가 `path.resolve(__dirname, 'index.html')`을 그대로 사용하면 `ReferenceError: __dirname is not defined in ES module scope` 런타임 에러가 발생합니다.
- **관찰 결과 3**: `output.entryFileNames`가 `assets/[name]-[hash].js`로 되어 있으므로, `input` 객체의 키(`main`, `home`)에 따라 각각 `assets/main-[hash].js`, `assets/home-[hash].js`로 명확하게 분리되어 출력됩니다.

### 2.2 개발 서버(`npm run dev`) 라우팅 문제점
- Vite 개발 서버는 기본적으로 SPA fallback(connect-history-api-fallback)을 내장하고 있어, 브라우저에서 `http://localhost:3000/home`을 요청하면 `/index.html`을 서빙합니다.
- MPA 전환 후 `/index.html`은 독립 정적 랜딩 페이지이므로, 개발 환경에서 `/home` 접근 시 게임 SPA가 아니라 랜딩 페이지가 중복 노출되는 치명적인 라우팅 미스매치가 발생합니다.
- 따라서 `vite.config.ts`의 플러그인(`configureServer`, `configurePreviewServer`)에 `/home` 요청을 `/home.html`로 투명하게 재작성(URL rewrite)해 주는 미들웨어가 반드시 필요합니다.

---

## 3. 구체적인 `vite.config.ts` 구현 사양

### 3.1 `build.rollupOptions.input` 사양
`vite.config.ts`의 `build.rollupOptions` 내에 다음 입력을 명시합니다:

```typescript
// vite.config.ts 내 build 설정
build: {
  outDir: 'dist',
  assetsDir: 'assets',
  emptyOutDir: false,
  rollupOptions: {
    input: {
      main: path.resolve(process.cwd(), 'index.html'), // 독립 정적 랜딩 페이지
      home: path.resolve(process.cwd(), 'home.html'),  // 리치 게임 SPA
    },
    output: {
      entryFileNames: `assets/[name]-[hash].js`,
      chunkFileNames: `assets/[name]-[hash].js`,
      assetFileNames: `assets/[name]-[hash][extname]`,
      manualChunks(id) {
        // 랜딩 페이지 소스는 번들 격리 유지 (vendor-misc에 흡수 방지)
        if (id.includes('src/landing')) {
          return undefined;
        }
        if (id.includes('webtoonEpisodeManifest')) return 'data-webtoon';
        if (id.includes('src/lib/i18n')) return 'data-i18n';
        if (!id.includes('node_modules')) return undefined;
        if (id.includes('/@tensorflow/') || id.includes('/seedrandom/')) return 'vendor-tensorflow';
        if (id.includes('/firebase/') || id.includes('/@firebase/')) return 'vendor-firebase';
        if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/') || id.includes('/use-sync-external-store/')) return 'vendor-react';
        if (id.includes('/motion/') || id.includes('/motion-dom/') || id.includes('/motion-utils/') || id.includes('/framer-motion/')) return 'vendor-motion';
        if (id.includes('/lucide-react/')) return 'vendor-icons';
        if (id.includes('/@paypal/') || id.includes('/paypal')) return 'vendor-payments';
        if (id.includes('/axios/')) return 'vendor-network';
        if (id.includes('/jsqr/') || id.includes('/qrcode.react/')) return 'vendor-scanners';
        return 'vendor-misc';
      },
    },
  },
}
```

### 3.2 번들 분리 및 의존성 격리 보장
| 엔트리 키 | 입력 파일 | 주요 진입 스크립트 | 산출물 HTML | 산출물 JS | 포함 의존성 |
|---|---|---|---|---|---|
| `main` | `index.html` | `/src/landing/index.ts` | `dist/index.html` | `dist/assets/main-[hash].js` | 순수 TS/DOM, 경량 스토어, 무거운 런타임 0개 (React, Three.js, TensorFlow, Firebase 완전 배제) |
| `home` | `home.html` | `/src/main.tsx` | `dist/home.html` | `dist/assets/home-[hash].js` | React 19, Lucide, Motion, TensorFlow, Three.js, Firebase 등 기존 리치 게임 SPA 전체 |

- **트리 쉐이킹 및 코드 스플리팅 원리**:
  - `main` 엔트리(`src/landing/index.ts`)는 React 19, Motion, TensorFlow, Firebase를 일체 `import`하지 않습니다.
  - Rollup은 엔트리별 의존성 그래프를 독립적으로 순회하므로, `dist/index.html`의 `<script>` 및 `<link rel="modulepreload">` 태그에는 오직 `main-[hash].js`와 순수 랜딩 CSS만 포함됩니다.
  - `dist/home.html`에는 `home-[hash].js`와 `vendor-react-[hash].js`를 비롯한 분할 청크들이 정상 연결됩니다.

### 3.3 개발 및 프리뷰 서버 라우팅 재작성 플러그인 (`mpa-router-plugin`)
Vite 개발 서버(`npm run dev`)와 프리뷰 서버(`npm run preview`)에서 `/home` 또는 `/home/` 요청 시 `home.html`을 정확히 서빙하도록 플러그인을 `vite.config.ts`의 `plugins` 배열에 추가합니다.

```typescript
// vite.config.ts의 plugins 배열에 추가할 플러그인
{
  name: 'mpa-dev-rewrite-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (!req.url) return next();
      const [pathname, search] = req.url.split('?');
      const query = search ? `?${search}` : '';

      // /home 및 /home/ 요청을 home.html로 내부 재작성
      if (pathname === '/home' || pathname === '/home/') {
        req.url = `/home.html${query}`;
      }
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      if (!req.url) return next();
      const [pathname, search] = req.url.split('?');
      const query = search ? `?${search}` : '';

      if (pathname === '/home' || pathname === '/home/') {
        req.url = `/home.html${query}`;
      }
      next();
    });
  },
}
```

또한, 기존 `public-wildcard-static-plugin` (라인 559 부근)의 제외 목록에 `/home`과 `/home.html`을 명시적으로 추가하여 정적 폴더 탐색 간섭을 원천 방지합니다:
```typescript
// vite.config.ts 라인 559 부근
!decodedUrl.startsWith('/assets/') &&
decodedUrl !== '/' &&
decodedUrl !== '/index.html' &&
decodedUrl !== '/home' &&
decodedUrl !== '/home.html'
```

---

## 4. 연계 파일 수정 사양 (`scripts/post-build.js` & `src/routes.ts`)

### 4.1 `scripts/post-build.js` 사양 변경
`vite build` 후 실행되는 `scripts/post-build.js`에서 가장 주의해야 할 점은 **기존 `dist/index.html`을 템플릿 삼아 `dist/home.html` 및 모든 SPA 라우트를 덮어쓰던 로직을 반드시 분리**해야 한다는 것입니다.

1. **엔트리 스크립트 감지 정규식 업데이트 (라인 21)**:
   ```javascript
   // 변경 전:
   const scriptMatch = indexHtmlContent.match(/\/assets\/(index-[A-Za-z0-9_-]+\.js)/);
   // 변경 후:
   const scriptMatch = indexHtmlContent.match(/\/assets\/((?:main|index|home)-[A-Za-z0-9_-]+\.js)/);
   ```

2. **SPA 라우트 템플릿 소스 분리 (라인 95~215)**:
   - `dist/index.html`: `main` 롤업 산출물(순수 정적 랜딩 페이지)로 보존하며 절대 SPA 라우트 템플릿으로 쓰지 않음.
   - `dist/home.html`: `home` 롤업 산출물(리치 게임 SPA)을 읽어 `baseSpaHtml`로 활용.
   - `dist/home/index.html`: `cleanHomeHtml`을 기반으로 생성.
   - 기존 SPA 라우트(`deck`, `play`, `shop`, `novel`, `movie`, `bench` 등): `cleanHomeHtml`을 기반으로 생성.
   - `dist/404.html`: SPA 클라이언트 라우팅 폴백을 위해 `cleanHomeHtml`로부터 생성.

### 4.2 `src/routes.ts` 라우팅 정의 변경
```typescript
// src/routes.ts 라인 21~28
home: {
  path: '/home',
  aliases: ['/main-lobby'],
  titleKo: '눈히어로.com - 카단의 여정 (원클릭 AI 웹 카드 게임)',
  titleEn: "SNSHero.com - Kadan's Journey (One-Click AI Web Card Game)",
  descriptionKo: '복잡한 가입 없이 클릭 한 번으로 시작하는 AI 웹 카드 게임 눈히어로.com - 카단의 여정 로비입니다.',
  descriptionEn: "Start instantly with one click at SNSHero.com - Kadan's Journey. Collect 110+ hero cards with AI battles.",
},

// src/routes.ts 라인 462~465
// 홈 화면 매핑 (/home)
if (cleanPath === '/home') {
  return 'home';
}
// SPA 내부에서 '/'로 진입했을 경우의 안전한 폴백 매핑
if (cleanPath === '/') {
  return 'home';
}
```

---

## 5. `home.html` 신설 사양

기존 `index.html`에 있던 React SPA 부트스트랩 요소를 `home.html`로 이관하여 신설합니다:
- **경로**: `/Users/dayyoung/project/snshero/home.html`
- **핵심 요소**:
  - `<title>눈히어로.com - 카단의 여정 (AI 웹 카드 게임)</title>`
  - `<link rel="canonical" href="https://snshero.com/home" />`
  - `<link rel="stylesheet" href="/src/index.css" />`
  - `<div id="root"></div>`
  - `<script type="module" src="/src/main.tsx"></script>`
  - SEO 메타데이터 및 워치독 스크립트 탑재.

---

## 6. 검증 방법 및 무결성 판정 기준

### 6.1 독립 빌드 무결성 검증 (`npm run build`)
1. `npm run build` 실행 시 exit code 0 확인.
2. `dist/index.html` 파일 확인:
   - `<script>` 태그가 `/assets/main-[hash].js`를 참조하는지 확인.
   - `react`, `tensorflow`, `three` 등 거대 라이브러리 참조가 일체 없는지 확인 (번들 크기 < 50KB).
3. `dist/home.html` 및 `dist/home/index.html` 파일 확인:
   - `<script>` 태그가 `/assets/home-[hash].js`를 참조하는지 확인.
   - `vendor-react-[hash].js` 등 리치 게임 청크가 정상 연결되었는지 확인.
4. `dist/deck/index.html`, `dist/play/index.html` 등 SPA 서브라우트가 `dist/home.html` 기반으로 생성되었는지 확인.

### 6.2 로컬 서빙 및 라우팅 검증 (`npm run preview` 또는 `npm run dev`)
1. `http://localhost:3000/` 접속 -> 정적 랜딩 페이지 로드 확인.
2. `http://localhost:3000/home` 접속 -> 리치 게임 SPA 로드 확인.
3. 브라우저 콘솔 404 에러 0건 확인.

---

## 7. 워커 작업 지침 요약 (Actionable Checklist)

- [ ] **Step 1**: 루트에 `home.html` 생성 (기존 `src/main.tsx` 진입점 유지).
- [ ] **Step 2**: 루트 `index.html`의 진입점을 `src/landing/index.ts`로 전환.
- [ ] **Step 3**: `vite.config.ts`의 `build.rollupOptions.input`에 `main: path.resolve(process.cwd(), 'index.html')` 및 `home: path.resolve(process.cwd(), 'home.html')` 등록.
- [ ] **Step 4**: `vite.config.ts`에 `mpa-dev-rewrite-plugin` 추가 (`/home` -> `/home.html` 재작성).
- [ ] **Step 5**: `scripts/post-build.js`에서 `dist/index.html` 보존 및 `dist/home.html`을 SPA 템플릿으로 분리.
- [ ] **Step 6**: `src/routes.ts`에서 `home.path = '/home'` 업데이트.
- [ ] **Step 7**: `npm run build` 실행 및 `dist/` 산출물 검증.
