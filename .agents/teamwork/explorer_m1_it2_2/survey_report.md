# Survey Report: `scripts/generate-video-seo.ts` Base Template Fix Specification

- **Author**: `teamwork_explorer` (explorer_m1_it2_2)
- **Target File**: `scripts/generate-video-seo.ts`
- **Related Files**: `scripts/post-build.js`, `public/movie/`, `public/cinema/`, `public/animation/`, `dist/movie/`, `dist/cinema/`, `dist/animation/`
- **Date**: 2026-11-02T04:10:00Z
- **Milestone**: Milestone 1 (Iteration 2) — Static Architecture & MPA Decoupling

---

## 1. Executive Summary

Milestone 1의 Dual-Entry Architecture에서 `dist/index.html`은 `src/landing/index.ts`를 마운트하는 독립 정적 랜딩 페이지(`#landing-root`)로 분리되었습니다. 기존 React 19 SPA 게임 번들은 `dist/home.html`(`#root`, `/assets/home-*.js`)로 분리되었습니다.

그러나 `scripts/generate-video-seo.ts`는 여전히 레거시 가정(`dist/index.html`이 SPA 진입점이라는 가정)을 기반으로 라인 700~705에서 `dist/index.html`을 베이스 템플릿으로 읽고 있습니다. 이로 인해 비디오 서브라우트 허브 3종(`/movie`, `/animation`, `/cinema`) 및 에피소드 개별 정적 페이지 80종(`/movie/ep-1..40`, `/cinema/ep-1..40`) 등 총 83개 이상의 라우트가 정적 랜딩 번들(`/assets/main-*.js` 및 `<div id="landing-root"></div>`)로 덮어써져 SPA 라우터(`MovieView`, `CinemaView`)가 실행되지 않고 정적 랜딩 페이지만 노출되는 치명적인 오염이 발생했습니다.

본 보고서는 이 결함의 원인을 분석하고, `dist/home.html`을 베이스 템플릿으로 안전하게 로드하도록 수정하는 구체적인 코드 사양 및 빌드 파이프라인 정리 방안을 제시합니다.

---

## 2. Root Cause Analysis

### 2.1 결함 발생 위치 및 메커니즘
- **파일**: `scripts/generate-video-seo.ts`
- **해당 라인**: 699~705
```typescript
  // 2. 베이스 HTML 템플릿 로드 (dist/index.html 우선, 없으면 index.html)
  const distIndexPath = path.join(distDir, 'index.html');
  const rootIndexPath = path.join(rootDir, 'index.html');
  const baseHtml = fs.existsSync(distIndexPath)
    ? fs.readFileSync(distIndexPath, 'utf8')
    : fs.readFileSync(rootIndexPath, 'utf8');
```

### 2.2 오염 전파 체인 (Propagation Chain)
1. **템플릿 오염**:
   - `dist/index.html`을 읽어들임.
   - `dist/index.html` 내부: `<script type="module" crossorigin src="/assets/main-DFC6NrKW.js"></script>`, `<div id="landing-root"></div>`.
   - `<div id="root"></div>`가 존재하지 않음.
2. **SEO 본문 치환 실패**:
   - `buildSeriesHubHtml` 및 `buildEpisodeHtml` 내부:
     ```typescript
     if (html.includes('<div id="root"></div>')) {
       html = html.replace('<div id="root"></div>', `<div id="root">\n${opts.bodyHtml}\n</div>`);
     }
     ```
   - 템플릿에 `<div id="root"></div>`가 없으므로 `html.includes(...)`가 `false`로 평가되어 SEO 크롤러용 사전 렌더링 본문(`opts.bodyHtml`)이 주입되지 못함.
3. **디스크 덮어쓰기 (`writeHtmlToPublicAndDist`)**:
   - 허브 페이지 3종: `/movie`, `/animation`, `/cinema`
   - 에피소드 페이지 80종: `/movie/ep-1` ~ `/movie/ep-40`, `/cinema/ep-1` ~ `/cinema/ep-40`
   - 위 총 83개 경로의 `index.html`이 `dist/`뿐만 아니라 `public/`에도 기록됨.
4. **Vite 빌드 및 post-build 캐싱 오염**:
   - `public/movie/index.html` 등에 오염된 정적 파일이 남게 되면:
     - 차후 `vite build` 시 `public/`의 오염된 파일이 `dist/`로 다시 복사됨.
     - `scripts/post-build.js`의 `publicStaticIndex` 가드(`if (fs.existsSync(publicStaticIndex)) continue;`)에 의해 `dist/home.html` 기반 정상 생성이 차단됨.
5. **런타임 동작 오류**:
   - 사용자가 `https://snshero.com/movie` 또는 `https://snshero.com/cinema/ep-1`로 접속 시, 브라우저는 `dist/movie/index.html`을 수신.
   - 브라우저는 `/assets/main-*.js`를 실행하여 `#landing-root`를 마운트함.
   - 결과: 영화관/애니메이션 플레이어(`MovieView`/`CinemaView`) 대신 단독 정적 랜딩(SnowHero 소개 페이지)이 강제 표시됨.

---

## 3. Detailed Fix Specification

### 3.1 `scripts/generate-video-seo.ts` 코드 변경 사양

#### [Target Location]
- 파일: `scripts/generate-video-seo.ts`
- 라인: 699–705 (`runGenerateVideoSeo` 함수 내부)

#### [Before]
```typescript
  // 2. 베이스 HTML 템플릿 로드 (dist/index.html 우선, 없으면 index.html)
  const distIndexPath = path.join(distDir, 'index.html');
  const rootIndexPath = path.join(rootDir, 'index.html');
  const baseHtml = fs.existsSync(distIndexPath)
    ? fs.readFileSync(distIndexPath, 'utf8')
    : fs.readFileSync(rootIndexPath, 'utf8');
```

#### [After]
```typescript
  // 2. 베이스 HTML 템플릿 로드 (SPA 진입점인 dist/home.html 우선, 없으면 root home.html, fallback dist/index.html)
  const distHomePath = path.join(distDir, 'home.html');
  const rootHomePath = path.join(rootDir, 'home.html');
  const distIndexPath = path.join(distDir, 'index.html');
  const rootIndexPath = path.join(rootDir, 'index.html');

  const baseTemplatePath = fs.existsSync(distHomePath)
    ? distHomePath
    : fs.existsSync(rootHomePath)
    ? rootHomePath
    : fs.existsSync(distIndexPath)
    ? distIndexPath
    : rootIndexPath;

  const baseHtml = fs.readFileSync(baseTemplatePath, 'utf8');
```

### 3.2 템플릿 선정 우선순위 로직 근거
1. **`distHomePath` (`dist/home.html`)**:
   - 1순위. 프로덕션 빌드에서 Vite 번들러가 컴파일한 SPA HTML.
   - 번들된 최신 해시 스크립트(`/assets/home-[hash].js`), 스타일시트(`/assets/home-[hash].css`), `<div id="root"></div>`가 완전히 포함되어 있어 딥링크 SPA 구동에 최적.
2. **`rootHomePath` (`rootDir/home.html`)**:
   - 2순위. Vite 빌드 전이거나 `dist/`가 부분 생성된 개발/테스트 환경에서 SPA 원본 마크업을 보장.
3. **`distIndexPath` / `rootIndexPath`**:
   - 3순위/4순위. `home.html`이 전혀 존재하지 않는 예외 상황에 대한 안전 fallback.

---

## 4. Associated Build & Workspace Cleanup Actions

`scripts/generate-video-seo.ts` 수정만으로는 이전에 `public/`에 기록된 오염 파일이 남아있을 수 있으므로 다음 조치가 함께 수행되어야 합니다.

### 4.1 오염된 `public/` 비디오 라우트 정리
`public/movie`, `public/cinema`, `public/animation` 디렉토리에 남아있는 구버전 `index.html` 파일들은 빌드 시 Vite가 그대로 `dist/`에 복사하거나 `post-build.js`의 생성을 건너뛰게 만들 수 있습니다.
- 워커는 빌드 전 또는 빌드 파이프라인에서 다음 디렉토리들을 클린업하거나 최신 템플릿으로 전수 덮어쓰도록 조치해야 합니다:
  - `public/movie/`
  - `public/cinema/`
  - `public/animation/`

### 4.2 회귀 방지 검증 (`tests/adversarial_m1_build_pipeline.ts` 및 E2E)
수정 후 다음 항목들이 `tests/adversarial_m1_build_pipeline.ts`에서 반드시 통과해야 합니다:
- `[ADV-M1-SPA-movie]`: `dist/movie/index.html` has SPA root & home.js -> **PASS**
- `dist/cinema/index.html`, `dist/animation/index.html`, `dist/movie/ep-1..40/index.html`, `dist/cinema/ep-1..40/index.html`에 `<div id="landing-root">`가 전혀 없고, `<div id="root">` 및 `/assets/home-*.js`가 로드되는지 확인.

---

## 5. Affected Files & Routing Inventory

| 경로 | 이전 상태 (오염) | 수정 후 상태 (정상) |
|---|---|---|
| `dist/movie/index.html` | `<div id="landing-root"></div>`, `main-*.js` | `<div id="root">...</div>`, `home-*.js` |
| `dist/animation/index.html` | `<div id="landing-root"></div>`, `main-*.js` | `<div id="root">...</div>`, `home-*.js` |
| `dist/cinema/index.html` | `<div id="landing-root"></div>`, `main-*.js` | `<div id="root">...</div>`, `home-*.js` |
| `dist/movie/ep-1..40/index.html` (40개 파일) | `<div id="landing-root"></div>`, `main-*.js` | `<div id="root">...</div>`, `home-*.js` |
| `dist/cinema/ep-1..40/index.html` (40개 파일) | `<div id="landing-root"></div>`, `main-*.js` | `<div id="root">...</div>`, `home-*.js` |
| `public/movie/index.html` 등 동기화 파일들 | 구버전 랜딩 마운트 태그 | 최신 SPA 템플릿 마운트 태그 |

---

## 6. Implementation Checklist for Worker

1. [ ] `scripts/generate-video-seo.ts` lines 699–705 교체 (`dist/home.html` 우선 참조).
2. [ ] `public/` 및 `dist/` 내 stale video route HTML 파일 정리.
3. [ ] `npm run build` 실행.
4. [ ] `npx tsx tests/adversarial_m1_build_pipeline.ts` 실행하여 100% 통과 확인.
5. [ ] `grep -rn "landing-root" dist/movie dist/cinema dist/animation` 실행하여 0건 검출 확인.
