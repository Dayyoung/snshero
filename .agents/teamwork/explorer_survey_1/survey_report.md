# SNS히어로 메인 정적 랜딩 페이지 신규 개발 및 /home 분리 아키텍처 정밀 조사 보고서 (R1 & R5)

- **문서 ID**: `SURVEY-R1-R5-001`
- **조사자**: 탐색 에이전트 (`teamwork_explorer`, Architecture & Routing Specialist)
- **작업 디렉토리**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_1/`
- **조사 일시**: 2026-11-02T03:30:00Z
- **대상 요구사항**:
  - **R1**: 메인 정적 랜딩 페이지 신규 개발 및 소스 완전 분리 (`/` 및 `/index.html`, 서버 런타임 의존성 0)
  - **R5**: 독립 정적 빌드 및 자동화 검증 환경 (무결성 검사 및 브라우저 렌더링/인터랙션 자동화 테스트)

---

## 1. 개요 및 조사 목적

SNSHero.com의 메인 접속 페이지(`/` 또는 `/index.html`)는 현재 무거운 React 19 단일 페이지 애플리케이션(SPA) 전체 번들과 강결합되어 있습니다. 이로 인해 최초 접속자에게 수 메가바이트의 게임 엔진, Three.js, TensorFlow, Firebase, DND-Kit 및 다국어 리소스가 일괄 로드되어 초기 로딩 지연이 발생하고, 서버 런타임 없는 순수 정적 웹 서비스로의 독립 운영이 제한됩니다.

본 조사는 다음 목표를 완벽히 달성하기 위한 구체적이고 실행 가능한 아키텍처 설계와 구현 명세를 도출합니다:
1. **메인 접속 경로(`/` 및 `/index.html`)의 순수 정적 웹 서비스 완전 분리**: 기존 SPA 화면 소스에 의존하지 않고, 가볍고 반응성이 뛰어난 단독 정적 웹 페이지(HTML, CSS, JS, 이미지 리소스)로 신규 구축.
2. **기존 리치 게임 앱의 `/home` 경로 이전**: 기존 홈 화면 및 게임 기능을 `/home` 경로로 완벽하게 대체하고 라우팅을 분리하여 유저 경험과 기존 로컬스토리지 데이터 보존.
3. **독립 정적 빌드 및 자동화 검증 환경(R5) 구축**: Vite Multi-Page App(MPA) 기반의 빌드 파이프라인 정립, 빌드 산출물 무결성 검증, Playwright 헤드리스 브라우저를 통한 렌더링 및 주요 인터랙션(메뉴 전환, 카드 육성 1~100레벨, 스탯 분배, 레드닷, 새로고침 후 localStorage 영구 보존, 팝업 0% 검증) 자동화 테스트 스크립트 설계.

---

## 2. 현재 프로젝트 구조 및 진입점/라우팅 정밀 분석

### 2.1 진입점(`index.html`) 및 번들링 구조
- **경로**: `/Users/dayyoung/project/snshero/index.html` (869 라인)
- **현행 구성**:
  - 상단에 방대한 Google Ads, GA4 및 구조화된 JSON-LD SEO/GEO/AEO 메타데이터(Organization, SiteNavigationElement, ItemList, BookSeries, ComicSeries, SoftwareApplication, HowTo, FAQPage) 탑재.
  - 라인 778: `<script type="module" src="/src/main.tsx"></script>`를 통해 애플리케이션의 유일한 진입점 지정.
  - 라인 781: `<div id="root"></div>` 단일 마운트 노드.
  - 라인 753~776: 부팅 지연 시 캐시를 강제 삭제하고 새로고침하는 인라인 워치독 스크립트(`hero_boot_retries`).
- **한계점**:
  - 루트 `/`로 접속하는 순간 React 19 런타임, Tailwind CSS, Motion, WebMCP, Firebase, Lucide 아이콘 등 거대한 SPA 모놀리스가 무조건 로드됨.

### 2.2 진입 스크립트(`src/main.tsx`) 및 API 인터셉터
- **경로**: `/Users/dayyoung/project/snshero/src/main.tsx` (173 라인)
- **주요 기능**:
  - `initWebMcpService()` 및 `initHeroAiBridge()` 초기화.
  - 청크 로드 에러(`ChunkLoadError`) 감지 및 자동 새로고침(최대 2회).
  - Service Worker(`/sw.js`) 등록.
  - SPA 정적 호스팅 폴백 처리: `/api/version`, `/version.json`, `/api/health`, `/pacpik`, `/gotest` 직접 텍스트 렌더링.
  - `createRoot(document.getElementById('root')!).render(<App />)`.

### 2.3 라우팅 메커니즘 (`src/routes.ts` & `src/App.tsx`)
- **경로**: `/Users/dayyoung/project/snshero/src/routes.ts` (518 라인), `src/App.tsx` (8,717 라인)
- **현행 라우팅 로직**:
  - `VIEW_ROUTES`: 50여 개 뷰의 고유 URL 경로 및 타이틀/설명 매핑.
    ```typescript
    home: {
      path: '/',
      aliases: ['/home'],
      titleKo: '눈히어로.com - 카단의 여정 (원클릭 AI 웹 카드 게임)',
      ...
    }
    ```
  - `getViewFromPath(pathname, search)`:
    - 라인 463~465: `cleanPath === '/' || cleanPath === '/home'`이면 모두 `'home'`을 반환.
  - `App.tsx`:
    - `view` 상태를 `getViewFromPathAndUrl()`로 초기화.
    - 네비게이션 시 `window.history.pushState(null, '', getViewPath(view))`를 호출하여 URL 갱신.
    - `currentView === 'home'`일 때 `HomeView.tsx`를 동적 렌더링.
- **분리 시 필수 변경점**:
  - `home.path`를 `'/home'`으로 명시적 변경.
  - `cleanPath === '/'`는 더 이상 SPA 내부의 `home`이 아니라 독립 정적 랜딩 페이지의 도메인으로 분리.
  - SPA가 `/home`에서 부팅될 때 정확히 `HomeView.tsx`를 렌더링하도록 매핑 정렬.

### 2.4 빌드 파이프라인 (`vite.config.ts` & `scripts/post-build.js`)
- **`vite.config.ts`**:
  - Vite 6.2.0, React 플러그인, `@tailwindcss/vite` 4.1.14 적용.
  - `rollupOptions.input` 미지정 상태 (기본값: 프로젝트 루트의 `index.html` 단일 엔트리).
  - 커스텀 미들웨어 `public-wildcard-static-plugin`: `/public/*`, `/ai`, `/gwent`, `/mall` 등 정적 리소스 직접 서빙.
- **`scripts/post-build.js`**:
  - Vite가 빌드한 `dist/index.html`을 읽어 `baseHtml`로 저장.
  - 40여 개 라우트(`routes = ['home', 'bench', 'reddit', 'play', 'deck', 'shop', ...]`)를 순회하며 `dist/<route>/index.html`과 `dist/<route>.html`을 생성.
  - 현재는 `dist/index.html`, `dist/home/index.html`, `dist/home.html` 모두 동일한 SPA 번들을 가리키고 있음 (`ls -la dist/` 결과 크기 45,955~45,964 바이트로 동일).

---

## 3. 독립 정적 랜딩 페이지(`/` 및 `/index.html`) 최적 아키텍처 방안 (R1)

### 3.1 아키텍처 옵션 비교 분석

| 평가 기준 | 옵션 A: Vite Multi-Page App (MPA) 듀얼 엔트리 (권장) | 옵션 B: 완전 분리형 바닐라 디렉토리 (Zero-Vite) | 옵션 C: 클라이언트 리다이렉트 스크립트 |
|---|---|---|---|
| **서버 런타임 의존성** | **0 (완전 순수 정적 HTML/CSS/JS/이미지)** | 0 (순수 정적 파일) | 런타임 종속성 높음 |
| **초기 로딩 성능 (FCP)** | **< 100ms (초경량 번들, 번들 크기 < 50KB)** | < 100ms | 느림 (리다이렉트 지연) |
| **디자인 시스템 일관성** | **100% (Tailwind CSS 4 + DESIGN.md 토큰 공유)** | 별도 CSS 수동 관리 또는 중복 빌드 | 부분 일치 |
| **타입 안정성 & 카드 데이터 공유** | **완벽 (TypeScript + `CARD_DATABASE` 공유)** | JSON 수동 동기화 필요 | 런타임 공유 |
| **개발/프리뷰 단일 워크플로우** | **완벽 (`npm run dev`, `npm run build` 통합)** | 빌드 스크립트 2원화 필요 | 취약 |
| **서비스 독립 운영 가능 여부** | **완벽 (`dist/index.html` + 자산만으로 독자 배포 가능)** | 가능 | 불가 |

### 3.2 최적 권장 방안: Vite MPA 기반 듀얼 엔트리 & 독립 모듈화
- **핵심 원리**:
  1. 프로젝트 루트의 `index.html`을 **신규 독립 정적 랜딩 페이지 전용 엔트리**로 전환.
     - `<script type="module" src="/src/landing/index.ts"></script>` 및 `/src/landing/landing.css`만 로드.
     - React 19, Three.js, TensorFlow, Firebase 등 무거운 런타임 일체 배제.
  2. 프로젝트 루트에 `home.html`을 신설하여 **기존 리치 게임 SPA 엔트리**로 지정.
     - 기존 `src/main.tsx` 및 `App.tsx`를 로드하여 `/home` 및 모든 하위 게임 기능 구동.
  3. `vite.config.ts`의 `rollupOptions.input`에 두 엔트리를 등록:
     ```typescript
     rollupOptions: {
       input: {
         main: path.resolve(process.cwd(), 'index.html'), // -> dist/index.html (정적 랜딩)
         home: path.resolve(process.cwd(), 'home.html'),  // -> dist/home.html (SPA 게임)
       },
       ...
     }
     ```
  4. `scripts/post-build.js`에서:
     - `dist/index.html`은 독립 정적 랜딩 페이지로 온전히 유지.
     - `dist/home/index.html`과 `dist/home.html`은 `dist/home.html`(SPA 번들)을 복사하여 배치.
     - 기존 SPA 라우트(`dist/deck/index.html`, `dist/play/index.html` 등)도 `dist/home.html`을 복사.

### 3.3 신규 정적 랜딩 웹 서비스 소스 구조 (`src/landing/`)

```
src/landing/
├── index.ts                      # 정적 랜딩 메인 컨트롤러 (DOM 마운트, 탭 전환, 이벤트 버스)
├── landing.css                   # 정적 랜딩 전용 스타일 (Tailwind 4 + DESIGN.md 터미널 플랫)
├── types.ts                      # 카드 육성, 탭, 상점, 웹툰 데이터 인터페이스
├── data/
│   ├── landingCards.ts           # 110종 영웅 카드 메타데이터 및 이미지 에셋 경로 매핑
│   ├── webtoonScenes.ts          # 플레이 섹션용 40부작 웹툰 대표 씬 및 나레이션 데이터
│   └── shopItems.ts              # 상점 8개 항목 정적 명세 (가격, 설명, 아이콘)
├── state/
│   ├── cardGrowthStore.ts        # 100% LocalStorage 기반 카드 육성 엔진 (EXP, Lv 1~100, 스탯, 레드닷)
│   ├── navigationStore.ts        # 탭 상태 관리 (home, mydeck, play, cards, shop)
│   └── deckStore.ts              # 마이덱 슬롯 및 덱 TP / 총 TP 산출기
├── components/
│   ├── Header.ts                 # 상단 헤더 (6개 메뉴: 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰 & 모바일 토글)
│   ├── Sidebar.ts                # 사이드 드로어 (8개 메뉴: 로그인, 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰, 커뮤니티)
│   ├── HomeSection.ts            # 상하 스크롤 랜딩 (소개, 웹소설, 웹게임, 애니메이션, 네이버/문피아 링크)
│   ├── MyDeckSection.ts          # 마이덱 (내 카드 5장, 덱 TP, 총 TP 심플 뷰)
│   ├── PlaySection.ts            # 플레이 (닫기, 이전, 다음, 나레이션, TTS 버튼 & 웹툰 이미지 뷰어)
│   ├── CardSection.ts            # 카드/구 미션 (수집율, 110종 카드 그리드, 육성, 레벨업, 스탯 강화, 레드닷)
│   ├── ShopSection.ts            # 상점 (8개 항목 심플 그리드 및 구매 모달)
│   ├── NoticeModal.ts            # 쇼핑몰/커뮤니티/로그인 '준비 중' 안내 모달
│   └── TtsService.ts             # Web Speech API 기반 브라우저 내장 TTS (기본값 OFF)
```

---

## 4. 핵심 요구사항별 상세 구현 스펙

### 4.1 R2: 반응형 레이아웃 및 3대 캐릭터 이미지 규격
1. **반응형 뷰포트 완벽 대응 (가로 스크롤 깨짐 0%)**:
   - 모바일: `360px ~ 767px` (1열 카드 그리드, 모바일 상단 미니멀 헤더, 햄버거 사이드 메뉴, 44px+ 터치 타깃).
   - 태블릿: `768px ~ 1023px` (2~3열 반응형 그리드, 유연한 패딩).
   - 데스크톱: `1024px ~ 1920px+` (최대 폭 제한 없는 유동적 유체 레이아웃 또는 4열 그리드).
2. **3대 규격 캐릭터 이미지 적극 연출**:
   - **7등신 전신 컷아웃**: `public/anime-character-sheets/cutouts/*.png` (110종 영웅 전신, 홈 랜딩 대표 히어로 및 카드 상세 모달에 고화질 렌더링).
   - **상반신 포트레이트**: `public/seat/*.png` (110종 영웅 상반신, 카드 리스트 대표 썸네일 및 마이덱 슬롯).
   - **3등신/스프라이트 카드**: `public/cards1.png`, `public/cards2.png` (배틀 스프라이트 및 미니 아이콘).

### 4.2 R3: 상단 & 사이드 메뉴 간소화 및 온보딩 팝업 원천 차단
1. **상단 메인 메뉴 (6개 항목 엄격 제한)**:
   - `[홈]` (Home)
   - `[마이덱]` (My Deck)
   - `[플레이]` (Play)
   - `[미션]` (구 미션 -> 카드 육성 섹션으로 전환)
   - `[상점]` (Shop)
   - `[쇼핑몰]` (Mall -> "준비 중" 모달 표시 또는 `/mall` 연결)
   - *이 외의 어떠한 부가 메뉴도 상단에 표시하지 않음.*
2. **사이드 메뉴 (8개 항목 엄격 제한)**:
   - `[로그인]`, `[홈]`, `[마이덱]`, `[플레이]`, `[미션]`, `[상점]`, `[쇼핑몰]`, `[커뮤니티]`
3. **준비 중 모달 (NoticeModal)**:
   - 쇼핑몰, 커뮤니티, 로그인 클릭 시:
     "현재 공식 서비스 준비 중입니다. 눈히어로 공식 런칭을 기대해 주세요!" 문구의 깔끔한 터미널 플랫 모달(`rounded-none`, hairline 보더, 닫기 버튼) 노출.
4. **온보딩 도움말 & 튜토리얼 팝업 일체 제거**:
   - 첫 접속 시 사용자 시야를 가로막던 코치마크, 튜토리얼 모달, 가이드 팝업을 100% 제거하여 즉각적인 조작 편의성 보장.

### 4.3 R4: 5대 핵심 화면별 구성 및 카드 육성 시스템 전환

#### ① 홈 섹션 (HomeSection)
- 상하 스크롤 형태의 직관적인 랜딩 페이지.
- **눈히어로 소개**: 아케인 대륙 11개 종족(수, 화, 풍, 지, 인간, 언데드, 엘프, 호빗, 야수, 메카, 드래곤)과 110명 영웅의 대서사시 소개.
- **웹소설 소개**: 40부작 정통 모험 판타지 《카단의 여정》 시놉시스 및 명장면 프리뷰.
- **웹게임 소개**: 브라우저 클릭 한 번으로 설치 없이 구동되는 AI 웹 카드 배틀 시스템.
- **애니메이션 & 시네마 소개**: 40편 연속 풀 액션 시네마 및 오리지널 BGM.
- **공식 연재 링크 배너 (절찬 연재중 배지 부착)**:
  - 네이버 웹소설: `http://novel.naver.com/challenge/list?novelId=1250635`
  - 문피아 웹소설: `https://nlink.munpia.com/link/munpia/novel/616551`
  - 네이버 웹툰: `https://comic.naver.com/challenge/list?titleId=856677`
- **게임 바로가기 버튼**: 리치 게임 환경(`/home`)으로 매끄럽게 연결되는 대형 액션 버튼(`min-h-[48px]`).

#### ② 마이덱 섹션 (MyDeckSection)
- 복잡한 덱 에디터를 배제하고 꼭 필요한 정보만 미니멀하게 제공:
  - 현재 출전 5장 카드 슬롯 (카드 포트레이트, 이름, 등급, 레벨, 속성 표시).
  - **덱 TP (Deck Total Power)**: 현재 편성된 5장 카드의 종합 전투력.
  - **총 TP (Account Total Power)**: 보유한 110장 카드 전체의 누적 육성 전투력.

#### ③ 플레이 섹션 (PlaySection)
- 불필요한 컨트롤 바를 제거하고 5대 필수 버튼만 미니멀하게 배치:
  1. `[닫기]`: 플레이 모드 종료 및 홈으로 복귀.
  2. `[이전]`: 이전 웹툰 씬으로 이동.
  3. `[다음]`: 다음 웹툰 씬으로 이동.
  4. `[나레이션]`: 본문 해설 및 캐릭터 대사 텍스트 박스 토글.
  5. `[TTS]`: 음성 읽기 토글 (기본값: **OFF / 음소거 상태**).
- 고화질 웹툰 이미지 뷰어 (`/images/webtoon/episode_01/scene_*.webp`).

#### ④ 카드 (구 미션) 섹션 - 혁신적인 카드 육성 시스템 (CardSection)
- 명칭을 '미션'에서 **'카드'**로 전면 전환.
- **카드 수집율 표시**: 110종 중 획득 카드 수 및 퍼센트 게이지(예: `110장 중 42장 수집 (38.2%)`).
- **110개 전체 카드 그리드**:
  - 카드 ID (1~110), 상반신 이미지, 이름, 속성, 현재 레벨(`Lv.1` ~ `Lv.100`), 기본 스탯 표시.
- **카드 대결 대신 '카드 육성(Training)' 시스템 도입**:
  - 각 카드에 `[육성하기]` 버튼 배치.
  - 육성 진행 시 훈련 애니메이션과 함께 경험치(EXP) 획득.
  - 경험치가 누적되면 최대 **100레벨(Lv.100)**까지 레벨업.
  - 레벨업 시 **스탯 포인트(Stat Points)** 획득 (레벨당 2포인트).
  - 미분배 스탯 포인트를 보유한 카드 우측 상단에 **선명한 빨간 점(Red Dot Indicator)** 자동 점등 (`w-3 h-3 bg-red-500 rounded-full animate-pulse`).
  - 카드를 클릭하면 스탯 강화 팝업이 열려 공격력(ATK), 방어력(DEF), 체력(HP)을 원하는 대로 분배 업그레이드 가능.
- **로컬스토리지 영구 보존**:
  - 키: `hero_static_card_growth_v1`
  - 브라우저를 새로고침하거나 브라우저를 종료 후 재방문해도 카드별 레벨, EXP, 누적 스탯, 잔여 포인트가 100% 무결점으로 복원됨.

#### ⑤ 상점 섹션 (ShopSection)
- 8개 지정 상품만 단정하게 노출하는 터미널 플랫 그리드:
  1. **일반 카드팩**: 1,000 P (5장 일반 영웅 소환)
  2. **매직 카드팩**: 3,000 P (5장 실버+ 확정 소환)
  3. **희귀 카드팩**: 5,000 P (5장 골드/보스 확정 소환)
  4. **아이템 팩**: 2,000 P (장비 3종 팩)
  5. **광고 제거**: 10,000 P (무료 플레이 광고 영구 제거)
  6. **공식 소설**: 15,000 P (40부작 카단의 여정 디지털 북)
  7. **공식 동영상**: 20,000 P (40부작 시네마 무비 패키지)
  8. **코인 충전**: SNS 코인 및 가상자산(BTC/ETH/USDC) 충전 센터

---

## 5. 기존 홈 화면의 /home 분리 및 SPA 대체 방안

### 5.1 라우팅 매핑 변경 (`src/routes.ts`)
```typescript
// 변경 전:
home: {
  path: '/',
  aliases: ['/home'],
  ...
}

// 변경 후:
home: {
  path: '/home',
  aliases: ['/main-lobby'],
  titleKo: '눈히어로.com - 카단의 여정 (AI 카드 게임)',
  titleEn: "SNSHero.com - Kadan's Journey (AI Web Card Game)",
  descriptionKo: '복잡한 가입 없이 즐기는 원클릭 AI 웹 카드 게임 로비입니다.',
  descriptionEn: "Instant AI Web Card Game Lobby on SNSHero.com.",
}
```
`getViewFromPath(pathname, search)` 함수에서:
```typescript
// 홈 화면 매핑 (/home)
if (cleanPath === '/home') {
  return 'home';
}
// 루트(/)는 더 이상 SPA의 home이 아님 (정적 랜딩 페이지 엔트리)
```

### 5.2 SPA 진입점 생성 (`home.html`)
프로젝트 루트에 `home.html`을 생성하여 기존 React 19 SPA 애플리케이션을 그대로 유지합니다:
```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <title>눈히어로.com - 카단의 여정 (AI 웹 카드 게임)</title>
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="stylesheet" href="/src/index.css" />
  </head>
  <body class="bg-[#fdfcfc] text-[#201d1d] font-mono">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 5.3 기존 게임 데이터 무결성 보장
- 기존 SPA의 모든 로컬스토리지 키(`hero_user_stats`, `hero_cards`, `hero_deck`, `hero_novel_progress_{season}` 등)는 그대로 유지됩니다.
- 신규 정적 랜딩 페이지는 독립 네임스페이스(`hero_static_card_growth_v1`, `hero_static_deck_v1`)를 사용하여 기존 저장 데이터와 충돌하거나 덮어쓰는 일을 원천 차단합니다.

---

## 6. 독립 정적 빌드 및 자동화 검증 환경 설계 (R5)

### 6.1 `vite.config.ts` 멀티페이지 빌드 설정
```typescript
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
      // 기존 manualChunks 유지
    }
  }
}
```

### 6.2 `scripts/post-build.js` 고도화
1. `dist/index.html`: `main` 롤업 산출물(순수 정적 랜딩 페이지)로 보존.
2. `dist/home.html` 및 `dist/home/index.html`: `home` 롤업 산출물(SPA 번들)을 복사하여 `/home` 접근 시 리치 게임 앱이 구동되도록 구성.
3. 기타 하위 라우트(`dist/deck/index.html`, `dist/play/index.html`, `dist/shop/index.html` 등): `dist/home.html`을 베이스로 정적 라우트 생성.

### 6.3 정적 빌드 무결성 자동 검증 스크립트 (`scripts/verify-static-build.ts`)
- **수행 작업**:
  1. `dist/index.html` 존재 및 크기 검증 (0바이트 방지, 독립 번들 확인).
  2. `dist/home/index.html` 및 `dist/home.html` 존재 검증.
  3. `dist/index.html` 내부의 모든 `<link>` 및 `<script>` 파일이 실제 `dist/assets/`에 존재하는지 링크 무결성 전수 검사 (404 링크 0건 확인).
  4. 7등신(`public/anime-character-sheets/cutouts/`), 상반신(`public/seat/`), 3등신(`public/cards1.png`, `cards2.png`) 리소스 접근성 검증.
  5. 외부 서버 런타임 의존성 0 확인 (Node.js/Express 없이 파일 서버만으로 구동 가능한지 검증).
  6. 위반 사항 발생 시 `exit code 1`, 성공 시 `exit code 0` 반환.

### 6.4 브라우저 렌더링 & 인터랙션 E2E 자동화 테스트 스크립트 (`scripts/test-static-landing-e2e.py`)
- **실행 환경**: Python Playwright (헤드리스 Chromium, 검증 완료된 내장 모듈 사용).
- **테스트 케이스 명세**:
  1. **반응형 렌더링 검증**:
     - 모바일(375x667): 가로 오버플로우/스크롤 깨짐 0건, 햄버거 메뉴 및 터치 타깃 44px+ 검증.
     - 태블릿(768x1024): 2~3열 그리드 및 헤더 내비게이션 렌더링 검증.
     - 데스크톱(1440x900): 상단 6개 메뉴 노출 및 전체 레이아웃 정렬 검증.
  2. **메뉴 & 모달 검증**:
     - 상단 메뉴 6개([홈], [마이덱], [플레이], [미션], [상점], [쇼핑몰]) 정밀 검증.
     - 쇼핑몰, 커뮤니티, 로그인 클릭 시 "준비 중" 모달이 정상 팝업되는지 검증.
     - 첫 접속 시 어떠한 온보딩/도움말/튜토리얼 팝업도 노출되지 않음(0건)을 단언(assert).
  3. **플레이 섹션 검증**:
     - 5대 버튼([닫기], [이전], [다음], [나레이션], [TTS]) 정상 렌더링.
     - 씬 넘김 시 웹툰 이미지 및 나레이션 텍스트 동기화 검증.
     - TTS 초기 로드 시 `aria-pressed="false"` 또는 OFF 상태 단언.
  4. **카드 (구 미션) 육성 & 로컬스토리지 영구 보존 검증**:
     - 110개 카드 그리드 및 수집율 렌더링 확인.
     - 특정 카드의 `[육성하기]` 버튼 클릭 -> EXP 증가 및 레벨업(Lv.1 -> Lv.2) 확인.
     - 레벨업 후 카드에 **빨간 점(Red Dot)** 인디케이터 출현 확인.
     - 카드 클릭 -> 스탯 강화 모달 오픈 -> ATK 스탯 +1 분배 확인.
     - `page.reload()` (브라우저 새로고침) 실행 -> 해당 카드의 레벨(Lv.2)과 업그레이드된 스탯이 `localStorage`에서 완벽히 유지되는지 최종 단언.
  5. **/home 경로 전환 검증**:
     - 홈 섹션의 "게임 플레이 / 앱 시작" 버튼 클릭 시 `/home`으로 이동하여 기존 리치 SPA 게임이 정상 마운트되는지 확인.
  6. **종료 코드**: 모든 어설션 통과 시 `exit code 0`.

---

## 7. 구체적인 파일 구조, 빌드 스크립트, 의존성 관계 도출

### 7.1 신규 생성 파일 목록
1. `/Users/dayyoung/project/snshero/home.html` (기존 SPA 엔트리)
2. `/Users/dayyoung/project/snshero/src/landing/index.ts` (정적 랜딩 컨트롤러)
3. `/Users/dayyoung/project/snshero/src/landing/landing.css` (정적 랜딩 전용 스타일)
4. `/Users/dayyoung/project/snshero/src/landing/types.ts` (정적 랜딩 타입 정의)
5. `/Users/dayyoung/project/snshero/src/landing/data/landingCards.ts` (110종 카드 메타데이터)
6. `/Users/dayyoung/project/snshero/src/landing/data/webtoonScenes.ts` (웹툰 씬 데이터)
7. `/Users/dayyoung/project/snshero/src/landing/data/shopItems.ts` (8개 상점 항목)
8. `/Users/dayyoung/project/snshero/src/landing/state/cardGrowthStore.ts` (카드 육성 & localStorage 엔진)
9. `/Users/dayyoung/project/snshero/src/landing/state/navigationStore.ts` (내비게이션 상태)
10. `/Users/dayyoung/project/snshero/src/landing/state/deckStore.ts` (마이덱 & TP 계산)
11. `/Users/dayyoung/project/snshero/src/landing/components/Header.ts` (상단 메뉴 6개 & 모바일 토글)
12. `/Users/dayyoung/project/snshero/src/landing/components/Sidebar.ts` (사이드 메뉴 8개)
13. `/Users/dayyoung/project/snshero/src/landing/components/HomeSection.ts` (상하 스크롤 랜딩)
14. `/Users/dayyoung/project/snshero/src/landing/components/MyDeckSection.ts` (마이덱 심플 뷰)
15. `/Users/dayyoung/project/snshero/src/landing/components/PlaySection.ts` (플레이 5대 버튼 & 웹툰)
16. `/Users/dayyoung/project/snshero/src/landing/components/CardSection.ts` (110종 카드, 육성, 스탯, 레드닷)
17. `/Users/dayyoung/project/snshero/src/landing/components/ShopSection.ts` (8개 상점 그리드)
18. `/Users/dayyoung/project/snshero/src/landing/components/NoticeModal.ts` (준비 중 안내 모달)
19. `/Users/dayyoung/project/snshero/src/landing/components/TtsService.ts` (TTS 서비스)
20. `/Users/dayyoung/project/snshero/scripts/verify-static-build.ts` (정적 빌드 무결성 검증기)
21. `/Users/dayyoung/project/snshero/scripts/test-static-landing-e2e.py` (Playwright E2E 검증기)

### 7.2 수정 대상 파일 목록
1. `/Users/dayyoung/project/snshero/index.html` (신규 정적 랜딩 전용 마크업 및 진입점 연결)
2. `/Users/dayyoung/project/snshero/vite.config.ts` (rollupOptions input 듀얼 엔트리 및 미들웨어 라우트 처리)
3. `/Users/dayyoung/project/snshero/scripts/post-build.js` (`dist/index.html` 보존 및 `dist/home.html` 라우트 복사)
4. `/Users/dayyoung/project/snshero/src/routes.ts` (`home.path = '/home'` 및 `getViewFromPath` 분기 조정)
5. `/Users/dayyoung/project/snshero/package.json` (`test:static`, `verify:build` 검증 스크립트 등록)

### 7.3 빌드 & 배포 파이프라인 흐름도

```
[개발 단계]
  npm run dev
    ├── '/' 접속        ──> index.html ──> src/landing/index.ts (가벼운 정적 랜딩 페이지)
    └── '/home' 접속    ──> home.html  ──> src/main.tsx (리치 게임 SPA)

[빌드 단계]
  npm run build (vite build)
    ├── rollup input: index.html ──> dist/index.html (초경량 정적 랜딩 번들)
    └── rollup input: home.html  ──> dist/home.html (풀버전 리치 게임 SPA 번들)
  post-build.js 실행
    ├── dist/index.html 보존
    ├── dist/home.html ──> dist/home/index.html 및 dist/home.html 생성
    └── dist/home.html ──> dist/deck/, dist/play/, dist/shop/ 등 SPA 서브라우트 복사

[검증 단계 (R5)]
  npx tsx scripts/verify-static-build.ts (빌드 파일, 링크, 번들 크기 정적 검증)
  python3 scripts/test-static-landing-e2e.py (Playwright 브라우저 E2E 검증: 메뉴, 육성, 스탯, 로컬스토리지, 반응형)
```

---

## 8. 결론 및 워커/리뷰어 지침

1. **아키텍처 확정**:
   Vite Multi-Page Application (MPA) 듀얼 엔트리 아키텍처는 추가적인 툴링 도입 없이 현재 스택(Vite 6, TypeScript 5.8, Tailwind CSS 4)을 100% 활용하면서도 요구사항 R1(메인 정적 랜딩 페이지 신규 개발 및 소스 완전 분리) 및 R5(독립 정적 빌드 및 자동화 검증 환경)를 완벽하게 충족하는 최적의 해법입니다.
2. **독립 운영성 보장**:
   생성된 `dist/index.html`과 정적 리소스는 Node.js 서버나 백엔드 API 런타임 없이도 어떤 정적 호스팅(Apache, Nginx, GitHub Pages, Cloudflare, S3)에서든 즉시 단독 서빙이 가능합니다.
3. **사용자 경험 및 게미피케이션 극대화**:
   첫 진입 페이지는 가볍고 빠른 로딩 속도를 제공하는 동시에, 상하 스크롤 스토리텔링, 110종 카드 육성 시스템(Lv.1~100, 스탯 분배, 레드닷, localStorage 영구 보존), 웹툰 씬 뷰어(TTS), 미니멀 상점(8개 품목)을 직접 조작할 수 있는 완성도 높은 독립 웹 서비스로 작동합니다.
