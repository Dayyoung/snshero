# Handoff Report — Explorer M1-2: Vite MPA 번들러 설정 사양

- **작성자**: `teamwork_explorer`
- **대상 마일스톤**: Milestone 1 (Static Architecture & MPA Decoupling)
- **작업 디렉토리**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_2/`
- **인계 유형**: Hard (완전 완결 조사 인계)
- **핵심 산출물**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_2/survey_report.md`

---

## 1. Observation (관찰 사실)

1. **`vite.config.ts` 현행 번들러 설정 (라인 681~706)**:
   - `build.rollupOptions.input` 설정이 누락되어 있어 Vite의 단일 엔트리 기본값(`index.html`)만 빌드하고 있습니다.
   - `output.entryFileNames`는 `assets/[name]-[hash].js`로 정의되어 있습니다.
   - `output.manualChunks(id)`가 활성화되어 있으며, React, TensorFlow, Firebase, Motion, Lucide 등이 청크로 분할되어 있습니다.
   - `vite.config.ts` 전체에서 Node ESM 환경(`"type": "module"`) 특성상 `__dirname` 대신 `process.cwd()`를 일관되게 사용하고 있습니다 (라인 42: `path.resolve(process.cwd(), 'public')`, 라인 52: `path.resolve(process.cwd(), 'dist', 'assets')`, 라인 712: `'@': path.resolve(process.cwd(), '.')`).
2. **`scripts/post-build.js` 빌드 후처리 구조 (라인 17~42, 라인 95~215)**:
   - 라인 21: `const scriptMatch = indexHtmlContent.match(/\/assets\/(index-[A-Za-z0-9_-]+\.js)/);` - 오직 `index-*.js`만 검색하고 있습니다.
   - 라인 95~97: `indexPath = path.join(distDir, 'index.html'); baseHtml = fs.readFileSync(indexPath, 'utf8');`
   - 라인 184~213: `routes` 배열을 순회하며 `dist/<route>/index.html`과 `dist/<route>.html`에 `baseHtml`(`dist/index.html`)을 일괄 복사하고 있습니다.
3. **`src/routes.ts` 라우팅 정의 (라인 21~28, 라인 462~465)**:
   - 라인 22~23: `home: { path: '/', aliases: ['/home'], ... }`
   - 라인 463~465: `if (cleanPath === '/' || cleanPath === '/home') return 'home';`
4. **Vite 개발 서버 동작**:
   - `vite.config.ts`의 `appType` 미지정 상태에서 `connect-history-api-fallback`에 의해 `/home` 요청 시 기본값으로 `/index.html`을 서빙합니다.
   - `home.html`이 루트에 존재하지 않으며, `main`과 `home` 듀얼 엔트리 구축을 위해 `home.html` 생성이 필수적입니다.

---

## 2. Logic Chain (논리 전개)

1. **관찰 1에 근거**:
   `build.rollupOptions.input`을 객체 형태로 지정하여 `{ main: path.resolve(process.cwd(), 'index.html'), home: path.resolve(process.cwd(), 'home.html') }`을 구성하면, Rollup은 `dist/index.html`과 `dist/home.html`을 독립된 HTML 엔트리로 생성합니다.
   ESM 환경에서 `__dirname`을 직접 쓰면 `ReferenceError`가 발생하므로, 프로젝트 컨벤션에 맞춰 `process.cwd()`를 사용해야 합니다.
2. **관찰 1 및 관찰 3에 근거**:
   `output.entryFileNames`가 `assets/[name]-[hash].js`이므로, `main` 엔트리는 `assets/main-[hash].js`, `home` 엔트리는 `assets/home-[hash].js`를 생성합니다.
   `src/landing/index.ts`에서 React/TensorFlow 등의 모듈을 임포트하지 않으면, Rollup의 트리 쉐이킹에 의해 `dist/index.html`에는 해당 거대 벤더 청크가 일체 주입되지 않아 초경량(<50KB) 정적 랜딩 페이지가 완성됩니다.
3. **관찰 2에 근거**:
   `scripts/post-build.js`가 기존처럼 `dist/index.html`을 읽어 모든 서브라우트(`deck`, `play`, `shop` 등)를 생성하면, SPA 게임 화면들이 랜딩 페이지로 덮어씌워지는 치명적 장애가 발생합니다.
   따라서 `scripts/post-build.js`는 `dist/index.html`을 손대지 않고 보존하며, `dist/home.html`을 읽어 `dist/home/index.html` 및 SPA 서브라우트들을 생성하도록 분리해야 합니다. 또한 엔트리 스크립트 정규식을 `(?:main|index|home)-[A-Za-z0-9_-]+\.js`로 확장해야 합니다.
4. **관찰 4에 근거**:
   `npm run dev` 및 `npm run preview` 시 개발자가 브라우저에서 `/home`을 호출했을 때 SPA가 열려야 하므로, `vite.config.ts`에 `/home` 요청을 `/home.html`로 내부 재작성하는 `mpa-dev-rewrite-plugin` 미들웨어가 필수적입니다.
5. **관찰 3에 근거**:
   `src/routes.ts`에서 `home.path`를 `'/home'`으로 변경하고, `cleanPath === '/home'`을 매핑함으로써 SPA 라우터가 `/home`에서 정확히 `HomeView`를 렌더링하도록 보장합니다.

---

## 3. Caveats (주의 사항 및 제약)

- **Landing 페이지 의존성 엄격 관리**:
  `src/landing/` 내부에서 React 19나 `lucide-react`를 임포트하면 `vendor-react` 또는 `vendor-icons` 청크가 생성되어 `dist/index.html`에 링크될 수 있습니다. `src/landing`은 순수 DOM 및 인라인 SVG를 사용하여 런타임 제로 의존성을 엄격히 지켜야 합니다.
- **`dist/404.html` 대상**:
  정적 호스팅 환경(GitHub Pages, Cloudflare 등)에서 알 수 없는 URL로 접근했을 때 SPA 클라이언트 라우팅이 이를 처리할 수 있도록, `dist/404.html`은 `dist/home.html`을 기반으로 생성하는 것이 권장됩니다.

---

## 4. Conclusion (결론 및 최종 권고)

Vite MPA 듀얼 엔트리 아키텍처 설계를 확정하고, 워커가 즉시 복사하여 구현할 수 있는 완전한 코드 사양서를 `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_2/survey_report.md`에 작성 완료했습니다.

- **`vite.config.ts`**:
  - `build.rollupOptions.input`에 `main` 및 `home` 등록 (`process.cwd()` 사용).
  - `mpa-dev-rewrite-plugin` 추가 (`/home` -> `/home.html` 재작성).
  - `manualChunks`에 `src/landing` 격리 규칙 추가.
- **`scripts/post-build.js`**:
  - `dist/index.html` 독립 보존.
  - `dist/home.html` 기반으로 `dist/home/index.html` 및 SPA 서브라우트 생성.
  - 엔트리 스크립트 감지 정규식 개선.
- **`src/routes.ts`**:
  - `home.path = '/home'` 지정 및 `/home` 라우트 매핑.

---

## 5. Verification Method (검증 방법)

### 독립 빌드 검증:
```bash
npm run build
```
1. `dist/index.html` 및 `dist/home.html`이 동시에 정상 생성되었는지 확인.
2. `dist/index.html` 파일 내부 검사:
   - `<script type="module" crossorigin src="/assets/main-[hash].js"></script>` 포함 확인.
   - `vendor-react` 또는 `vendor-tensorflow` 스크립트 미포함(크기 < 50KB) 확인.
3. `dist/home.html` 및 `dist/home/index.html` 파일 내부 검사:
   - `<script type="module" crossorigin src="/assets/home-[hash].js"></script>` 및 `vendor-react-[hash].js` 포함 확인.
4. `dist/deck/index.html`, `dist/play/index.html`이 `dist/home.html` 기반으로 생성되었는지 확인.

### 로컬 서빙 및 라우팅 검증:
```bash
npm run preview
# 또는
npm run dev
```
1. `curl -s http://localhost:3000/ | grep -q "main-"` -> 성공 (정적 랜딩)
2. `curl -s http://localhost:3000/home | grep -q "home-"` -> 성공 (게임 SPA)
3. `npx tsc --noEmit` 실행 시 0 에러 통과 확인.
