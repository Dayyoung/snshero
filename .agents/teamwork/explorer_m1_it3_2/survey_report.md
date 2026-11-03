# Vite Dev 및 Preview 서버 라우트 Rewrite 미들웨어 정밀 분석 및 사양 보고서
**Technical Survey & Specification Report: Dev & Preview Server Route Rewriting in `vite.config.ts`**

- **작성 에이전트**: 마일스톤 1 반복 3 탐색 에이전트 (`explorer_m1_it3_2`)
- **작업 디렉토리**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m1_it3_2/`
- **일시**: 2026-11-02T04:53:00Z
- **수신자**: 오케스트레이터 (`7b342c7a-1d74-43d7-a388-5ffc926b3969`)
- **연관 게이트 & 보고서**:
  - `orchestrator_8/GATE_STATUS.md` (Iteration 2 Gate Fail: 챌린저 변경 요청)
  - `challenger_m1_it2_2/handoff.md` (중첩 라우트 트레일링 슬래시 누락 시 landing-root 폴백 결함)
  - `tests/adversarial_route_edge_cases.ts` (76개 테스트 중 3개 실패)

---

## 1. 개요 및 핵심 결론 (Executive Summary)

현재 `vite.config.ts` 내 `mpa-dev-rewrite-plugin`은 오직 `/home` 및 `/home/` 단일 경로만을 하드코딩으로 검사(`if (pathname === '/home' || pathname === '/home/')`)하고 있어, **Dev 서버 환경에서는 `/deck`, `/play`, `/shop`, `/wiki/*`, `/r/*` 등 모든 SPA 서브라우트가 정적 랜딩 페이지(`index.html`, `#landing-root`)로 오작동 폴백**되며, **Preview 서버 환경에서도 트레일링 슬래시가 없는 중첩 SPA 경로(`/wiki/card`, `/r/hanguk`, `/r/hanguk/comments/...`) 접근 시 `dist/index.html`로 잘못 폴백**되는 고위험 결함이 확인되었습니다.

이를 해결하기 위해:
1. `vite.config.ts`의 `mpa-dev-rewrite-plugin`에 **정밀 경로 분류기(`isSpaRoute`)**를 도입하여, 루트(`/`, `/index.html`)와 API(`/api/*`), 정적 자산, 전용 정적 사이트(`/mall`, `/gwent`, `/ai`)를 완벽히 격리·보존하고,
2. **Dev 서버(`configureServer`)**에서는 모든 SPA 라우트를 `/home.html`로 내부 rewrite하여 Vite HMR 및 SPA 셸(`#root`)을 서빙하며,
3. **Preview 서버(`configurePreviewServer`)**에서는 빌드 산출물(`dist/`) 내 사전 렌더링된 `index.html` 또는 `.html`이 존재하는지 확인하여 해당 정적 SEO HTML로 rewrite하고, 존재하지 않는 동적 경로는 `/home.html`로 rewrite하여 어떠한 SPA 경로도 `dist/index.html`로 잘못 폴백되지 않도록 보장하는 완전한 미들웨어 코드 사양을 도출했습니다.

---

## 2. 결함 관측 및 근본 원인 분석 (Root Cause Analysis)

### 2.1 결함 관측 데이터

`tests/adversarial_route_edge_cases.ts` 실행 결과 (76개 단언 중 3개 실패):
```text
[FAIL] [LIVE-HTTP-24] GET /r/hanguk (deep route) | Expected: 200 OK with #root and home- | Actual: Status 200, hasRoot=false, hasScript=false
[FAIL] [LIVE-HTTP-26] GET /r/hanguk/comments/post_vibecoding_master | Expected: 200 OK with #root and home- | Actual: Status 200, hasRoot=false, hasScript=false
[FAIL] [LIVE-HTTP-28] GET /wiki/card (nested deep route without trailing slash) | Expected: 200 OK with #root and home- | Actual: Status 200, hasRoot=false, hasScript=false
```

실제 HTTP 응답 직접 검증 (`curl -i`):
- `curl -s http://localhost:3000/wiki/card | grep -o 'id="[^"]*"'` ➔ **`id="landing-root"`** (오류! 정적 랜딩 서빙됨, 바이트 크기: 43,549 = `dist/index.html`)
- `curl -s http://localhost:3000/wiki/card/ | grep -o 'id="[^"]*"'` ➔ **`id="root"`** (정상! SPA 셸 서빙됨, 바이트 크기: 46,041 = `dist/wiki/card/index.html`)
- `curl -s http://localhost:3000/r/hanguk | grep -o 'id="[^"]*"'` ➔ **`id="landing-root"`** (오류!)
- `curl -s http://localhost:3000/r/hanguk/ | grep -o 'id="[^"]*"'` ➔ **`id="root"`** (정상!)

### 2.2 왜 `/movie/ep-1`은 통과하고 `/wiki/card`는 실패했는가?
- `tests/adversarial_route_edge_cases.ts`에서 `GET /movie/ep-1`은 통과했습니다.
- 원인을 추적한 결과, `public/movie/ep-1` 디렉토리가 `public/` 폴더에 실제로 존재하여 `vite.config.ts`의 `public-wildcard-static-plugin` (590~607행)에서 `301 Moved Permanently` (`Location: /movie/ep-1/`)로 리다이렉트되었고, 테스트 하네스의 `fetchHttp`가 301을 따라가서 `/movie/ep-1/index.html`을 읽었기 때문이었습니다.
- 반면 `public/wiki/card`나 `public/r/hanguk`은 `public/`에 디렉토리가 존재하지 않고 `dist/`에만 빌드 생성되었으므로, `public-wildcard-static-plugin`의 디렉토리 자동 301 리다이렉트 혜택을 받지 못하고 Vite preview의 기본 SPA 폴백인 `dist/index.html`로 추락했습니다.

### 2.3 `vite.config.ts` 기존 미들웨어의 결함 코드
`vite.config.ts` 50~73행:
```typescript
      {
        name: 'mpa-dev-rewrite-plugin',
        configureServer(server: any) {
          server.middlewares.use((req: any, _res: any, next: any) => {
            if (!req.url) return next();
            const [pathname, search] = req.url.split('?');
            const query = search ? `?${search}` : '';
            if (pathname === '/home' || pathname === '/home/') {
              req.url = `/home.html${query}`;
            }
            next();
          });
        },
        configurePreviewServer(server: any) {
          server.middlewares.use((req: any, _res: any, next: any) => {
            if (!req.url) return next();
            const [pathname, search] = req.url.split('?');
            const query = search ? `?${search}` : '';
            if (pathname === '/home' || pathname === '/home/') {
              req.url = `/home.html${query}`;
            }
            next();
          });
        },
      },
```
- **문제점 1 (Dev 서버)**: 개발 서버(`npm run dev`)에서는 빌드된 `dist/`가 존재하지 않습니다. 사용자가 브라우저에서 `http://localhost:3000/deck`이나 `http://localhost:3000/play`, `http://localhost:3000/wiki/card`로 직접 접속하거나 새로고침하면, `mpa-dev-rewrite-plugin`이 `/home`만 rewrite하므로 Vite의 기본 SPA fallback이 동작하여 루트 `index.html` (정적 랜딩)을 응답합니다. 개발 중 게임 뷰에 접근할 수 없는 심각한 문제가 발생합니다.
- **문제점 2 (Preview 서버)**: 프리뷰 서버(`npm run preview`)에서 `dist/wiki/card/index.html`이 존재하더라도 요청 URL이 `/wiki/card` (끝 슬래시 없음)인 경우, 정적 파일 서버(sirv)는 디렉토리 이름과 일치하는 파일 `dist/wiki/card`나 `dist/wiki/card.html`을 찾지 못하고 `dist/index.html`로 폴백합니다.

---

## 3. 라우팅 분류 및 격리 원칙 (Interface & Invariant Rules)

미들웨어가 충족해야 하는 불변식(Invariants):

| 요청 범주 | 대상 예시 경로 | 서버 동작 | 응답 HTML / 엔티티 |
|---|---|---|---|
| **1. 독립 정적 랜딩** | `/`, `/?ref=twitter`, `/index.html`, `/index.html?ref=1` | **Rewrite 금지** (`next()`) | `index.html` (`#landing-root`, 번들 < 50KB) |
| **2. Dev SPA 라우트** | `/home`, `/deck`, `/play`, `/wiki/card`, `/r/hanguk`, `/movie/ep-1` | `req.url = /home.html${query}` | `home.html` (Vite dev HMR + `src/main.tsx`) |
| **3. Preview 사전 렌더 라우트** | `/wiki/card`, `/r/hanguk`, `/deck`, `/novel` | `dist/${route}/index.html` 또는 `dist/${route}.html`로 rewrite | 사전 렌더링된 전용 SEO HTML (`#root`) |
| **4. Preview 동적 SPA 라우트** | `/r/unknown_sub`, `/u/some_user`, `/share/1234` | `req.url = /home.html${query}` | `dist/home.html` (`#root` + 클라이언트 라우터) |
| **5. 정적 자산 & 파일** | `/assets/*`, `/seat/*.png`, `/favicon.ico`, `/version.json` | **Rewrite 금지** (`next()`) | 원본 파일 서빙 (MIME 타입, ETag) |
| **6. 백엔드 API & 프록시** | `/api/*`, `/api-mlx/*`, `/api/health`, `/api/version` | **Rewrite 금지** (`next()`) | JSON / XML API 응답 |
| **7. 전용 정적 사이트** | `/mall`, `/mall/*`, `/gwent`, `/gwent/*`, `/ai`, `/ai/*` | **Rewrite 금지** (`next()`) | 독립 HTML 서빙 (쇼피파이 미러, 궨트 게임 등) |

---

## 4. 정밀 미들웨어 사양 (Concrete Code Specification)

### 4.1 SPA 라우트 판별자 (`isSpaRoute`)

`vite.config.ts` 최상단(또는 플러그인 클로저)에 배치되는 순수 판별 함수입니다:

```typescript
/**
 * 주어진 요청 경로가 독립 정적 랜딩(/, /index.html)이나 API, 정적 자산이 아닌
 * SPA 게임 애플리케이션 라우트(home.html 기반)인지 정확하게 판별합니다.
 */
function isSpaRoute(pathname: string): boolean {
  if (!pathname) return false;

  // 1. 연속된 슬래시 정규화 (예: //wiki///card -> /wiki/card)
  const normalized = pathname.replace(/\/+/g, '/');

  // 2. 루트(/) 및 정적 랜딩(index.html)은 절대 SPA 라우트로 간주하지 않음 (순수 랜딩 보존)
  if (normalized === '/' || normalized === '/index.html') {
    return false;
  }

  // 3. Vite 개발 서버 내부 경로, HMR, 소스코드, 모듈 경로 제외
  if (
    normalized.startsWith('/@') ||
    normalized.startsWith('/src/') ||
    normalized.startsWith('/node_modules/')
  ) {
    return false;
  }

  // 4. API 엔드포인트 및 시스템 헬스체크 경로 제외
  if (
    normalized.startsWith('/api/') ||
    normalized.startsWith('/api-mlx/') ||
    normalized === '/api' ||
    normalized === '/health' ||
    normalized === '/api/health' ||
    normalized === '/version' ||
    normalized === '/api/version' ||
    normalized === '/version.json'
  ) {
    return false;
  }

  // 5. 번들된 비-SPA 독립 정적 사이트 및 특별 정적 HTML 파일 제외
  if (
    normalized === '/mall' || normalized.startsWith('/mall/') ||
    normalized === '/gwent' || normalized.startsWith('/gwent/') ||
    normalized === '/ai' || normalized.startsWith('/ai/') ||
    normalized === '/mlx-chat.html' ||
    normalized.startsWith('/anime-character-sheets/') ||
    normalized.startsWith('/pacpik') ||
    normalized.startsWith('/gotest') ||
    normalized === '/about-news.html' ||
    normalized === '/editorial-guidelines.html' ||
    normalized === '/CNAME'
  ) {
    return false;
  }

  // 6. 파일 확장자를 가진 정적 리소스 요청 제외 (.js, .css, .png, .jpg, .webp, .svg, .json, .ico, .mp4, etc.)
  // 단, /home.html 등 명시적 HTML 파일 요청은 Vite가 자체 서빙하도록 통과
  const lastSegment = normalized.split('/').pop() || '';
  if (lastSegment.includes('.')) {
    return false;
  }

  // 7. 위의 예외를 통과한 모든 확장자 없는 애플리케이션 경로는 SPA 라우트임!
  // 예: /home, /deck, /play, /shop, /wiki, /wiki/card, /r/hanguk, /r/hanguk/comments/..., /movie/ep-1
  return true;
}
```

### 4.2 플러그인 정의 (`mpa-dev-rewrite-plugin`)

`vite.config.ts`의 `plugins` 배열 내 `mpa-dev-rewrite-plugin` 교체 사양:

```typescript
      {
        name: 'mpa-dev-rewrite-plugin',
        configureServer(server: any) {
          server.middlewares.use((req: any, _res: any, next: any) => {
            if (!req.url) return next();
            const [pathname, search] = req.url.split('?');
            const query = search ? `?${search}` : '';
            const normalized = (pathname || '').replace(/\/+/g, '/');

            // Dev 모드: SPA 라우트 요청 시 home.html로 rewrite하여 Vite dev HMR 번들 서빙
            if (isSpaRoute(normalized)) {
              req.url = `/home.html${query}`;
            }
            next();
          });
        },
        configurePreviewServer(server: any) {
          server.middlewares.use((req: any, _res: any, next: any) => {
            if (!req.url) return next();
            const [pathname, search] = req.url.split('?');
            const query = search ? `?${search}` : '';
            const normalized = (pathname || '').replace(/\/+/g, '/');

            // Preview 모드: SPA 라우트 요청 시 dist/ 내 사전 렌더링된 정적 파일 우선 매핑
            if (isSpaRoute(normalized)) {
              const cleanPath = normalized.replace(/^\/+/, '').replace(/\/+$/, '');
              const distDir = path.resolve(process.cwd(), 'dist');

              // 1. 디렉토리 index.html이 존재하는 경우 (예: dist/wiki/card/index.html, dist/r/hanguk/index.html)
              if (cleanPath && fs.existsSync(path.join(distDir, cleanPath, 'index.html'))) {
                req.url = `/${cleanPath}/index.html${query}`;
              }
              // 2. 단일 .html 파일이 존재하는 경우 (예: dist/deck.html, dist/home.html)
              else if (cleanPath && fs.existsSync(path.join(distDir, `${cleanPath}.html`))) {
                req.url = `/${cleanPath}.html${query}`;
              }
              // 3. 사전 렌더링되지 않은 동적 SPA 라우트의 경우 SPA 셸(home.html)로 폴백
              else {
                req.url = `/home.html${query}`;
              }
            }
            next();
          });
        },
      },
```

---

## 5. `scripts/post-build.js` 보완 사양 (심층 방어, Defense-in-Depth)

미들웨어가 프리뷰/개발 서버의 요청을 완벽히 라우팅하더라도, **Vercel, Netlify, Cloudflare Pages, S3/CloudFront 등 정적 파일 호스팅 CDN 환경에서는 클린 URL 요청(`/wiki/card`) 시 자동으로 `${route}.html` 파일을 먼저 탐색**합니다.

따라서 `scripts/post-build.js`에서도 `if (!route.includes('/'))` 제약을 해제하여 중첩 경로에 대해서도 `dist/${route}.html`을 생성하도록 보완해야 합니다:

### `scripts/post-build.js` (227~233행 수정안)
```javascript
    } else {
      fs.writeFileSync(path.join(routeDir, 'index.html'), cleanBaseHtml, 'utf8');
      
      // 기존: if (!route.includes('/')) { ... }
      // 개선: 중첩 경로(wiki/card, r/hanguk 등)를 포함한 모든 라우트에 대해 .html 플랫 파일도 함께 생성
      const flatHtmlPath = path.join(distDir, `${route}.html`);
      fs.mkdirSync(path.dirname(flatHtmlPath), { recursive: true });
      fs.writeFileSync(flatHtmlPath, cleanBaseHtml, 'utf8');
    }
```
동일하게 217행(`bench`) 및 226행(`novel`)에서도 상위 디렉토리 생성 보장 후 `${route}.html`을 쓰도록 일관성 유지.

---

## 6. 독립 검증 방법 및 테스트 절차

워커 에이전트(`teamwork_worker`)가 위 사양을 소스코드에 적용한 후 다음 3단계로 검증합니다:

### 1단계: 빌드 및 타입 무결성 검증
```bash
npx tsc --noEmit
npm run build
```
- 실패 조건: TypeScript 컴파일 에러 발생 또는 빌드 실패.

### 2단계: 프리뷰 서버 기동 및 적대적 라우트 엣지케이스 테스트
```bash
# 프리뷰 서버가 3000번 포트에서 실행 중인지 확인 후 실행
npx tsx tests/adversarial_route_edge_cases.ts
```
- 성공 조건: 76개 전체 Assertion 100% 통과 (`Pass Rate: 100.0%`).
- 특히 이전에 실패했던 아래 3개 항목이 모두 `[PASS]`로 전환되어야 함:
  - `[LIVE-HTTP-24] GET /r/hanguk (deep route)` ➔ PASS
  - `[LIVE-HTTP-26] GET /r/hanguk/comments/post_vibecoding_master` ➔ PASS
  - `[LIVE-HTTP-28] GET /wiki/card (nested deep route without trailing slash)` ➔ PASS

### 3단계: `curl` 직접 검증
```bash
# 1. 중첩 SPA 라우트 (트레일링 슬래시 없음): 반드시 id="root" 및 home-*.js가 포함되어야 함
curl -s http://localhost:3000/wiki/card | grep -o 'id="[^"]*"'
# 기대값: id="root" (절대 id="landing-root"가 아니어야 함!)

curl -s http://localhost:3000/r/hanguk | grep -o 'id="[^"]*"'
# 기대값: id="root"

curl -s http://localhost:3000/r/hanguk/comments/post_vibecoding_master | grep -o 'id="[^"]*"'
# 기대값: id="root"

# 2. 독립 정적 랜딩 (루트): 반드시 id="landing-root" 및 main-*.js가 포함되어야 함
curl -s http://localhost:3000/ | grep -o 'id="[^"]*"'
# 기대값: id="landing-root"

curl -s http://localhost:3000/index.html | grep -o 'id="[^"]*"'
# 기대값: id="landing-root"
```

---

## 7. 결론

본 조사를 통해 식별된 원인과 사양은 `vite.config.ts`의 Dev/Preview 서버 동작 메커니즘을 근본적으로 보정하여, 정적 랜딩(`index.html`)과 풀 SPA(`home.html`)의 완전한 디커플링을 개발 환경과 프로덕션 프리뷰 환경 모두에서 결함 없이 완성할 수 있음을 입증합니다.
