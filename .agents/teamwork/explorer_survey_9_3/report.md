# Comprehensive Survey Report: Shop Mechanics & Responsive Google AdSense Integration

**Survey Target**: SNSHero Revolution (`#shop` and global layout)  
**Investigator**: `explorer_survey_9_3` (Explorer Subagent)  
**Date**: 2026-11-02  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_9_3/`  
**Reference Specification**: `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md` (Approved Task Prompt 2026-11-02T07:32:49Z)

---

## 1. Executive Summary

본 조사는 SNSHero 애플리케이션의 **단일 페이지 해시 라우트 전환(`#shop`)**에 따른 **상점 시스템(Shop Mechanics)의 결함 분석 및 복구 방안**, 그리고 **전체 화면 반응형 구글 애드센스(Google AdSense) 통합 구조**를 심층 분석하기 위해 수행되었습니다.

### 핵심 조사 결과 요약:
1. **상점 메커니즘 (`#shop`)**:
   - 현재 정적 랜딩 오케스트레이터(`src/landing/index.ts` 및 `src/landing/views/ShopSection.tsx`)에 8개 정규 상품이 등록되어 있으나, **카드팩 구매 시 개봉 모달(Card Pack Opening Modal)이 전무하여 구매 즉시 카드가 화면에 보이지 않고 삼켜지는 치명적 UX 결함**이 존재합니다.
   - **인벤토리 저장소 이원화 결함**: `#shop`에서 카드팩 구매 시 `cardNurtureStore`(`hero_card_nurturing`)에만 기록되고, 본체 게임 엔진 및 배틀 전장이 참조하는 `hero_inventory`에는 동기화되지 않아 구매한 카드가 실제 카드 배틀 및 마이덱 본체에서 유실/미인식됩니다.
   - **재화 동기화 결함**: `hero_sns` 단일 키만 수정되고 `hero_earned_sns`, `hero_purchased_sns`, `hero_sns_${season}`과 동기화되지 않아 세션 간 잔액 불일치가 발생합니다.
   - **충전 기능 결함**: 현재 코인 충전이 100% 무료(0원) 클릭으로만 임시 구현되어 있으며, 인게임 로컬스토리지 재화(`hero_gold` 등)를 소모하는 **유료/비무료 통화 충전 및 환전 루프(non-free currency replenishment)**가 부재합니다.
2. **반응형 구글 애드센스 통합**:
   - `index.html` 헤더에 공식 애드센스 클라이언트 태그(`ca-pub-6937094123258335`)가 로드되어 있으나, `src/landing/index.ts`에는 **애드센스 광고 유닛 컨테이너가 0건**으로 아예 구현되어 있지 않습니다.
   - **PC/데스크톱(>=1024px)**: 게임 보드와 조작부를 침범하지 않는 좌/우 여백 거터(Left/Right Gutters, `w-[120px] xl:w-[160px]`, 스카이스크래퍼 120x600/160x600) 레이아웃 배치 구조를 도출했습니다.
   - **태블릿/모바일(<1024px)**: 상단 헤더 직하단에 뷰포트 맞춤형 모바일 배너(높이 60~72px, 320x50/320x100)를 문서 흐름(Document Flow)으로 배치하여 3x3 보드 및 터치 조작부를 일체 가리지 않는 안전 구조를 수립했습니다.
   - 상점 내 "광고 제거(Ad Removal)" 구매 시 `hero_ad_removed` 플래그와 연동되어 모든 광고 노드를 깨끗이 제거하는 무결점 라이프사이클을 설계했습니다.

---

## 2. Shop Mechanics 심층 조사 및 결함 분석

### 2.1 아키텍처 개요 (`ShopSection.tsx` vs `ShopView.tsx`)

| 구분 | 레거시 라우트 (`ShopView.tsx`) | 신규 해시 라우트 (`ShopSection.tsx`) |
| :--- | :--- | :--- |
| **진입 경로** | `/shop` (Vite SPA / React 19) | `#shop` (`index.html` 기반 독립 정적 랜딩) |
| **코드 파일** | `src/views/ShopView.tsx` (6,782 라인) | `src/landing/views/ShopSection.tsx` (296 라인) |
| **상태 관리** | React useState, useEffect, Context | Pure TypeScript 템플릿 스트링 + Event Delegation |
| **카드 개봉 연출** | `GachaRevealSequence`, `PityGauge`, 모션 애니메이션 | **현재 전무 (결함 상태: 단순 alert/무음 복귀)** |
| **상품 구성** | 수십 개 복합 탭 (굿즈, 크립토, 룰렛, 인형뽑기 등) | **프로젝트 지침 8개 필수 정규 상품** |

### 2.2 정규 8개 등록 상품 현황 (`SHOP_ITEMS`)

`src/landing/views/ShopSection.tsx` (Line 36~117)에 정의된 8개 상품 메타데이터:
1. `pack_normal`: **일반 카드팩** (300 SNS, 브론즈~실버 확정)
2. `pack_magic`: **매직 카드팩** (800 SNS, 실버~골드 확정)
3. `pack_rare`: **희귀 카드팩** (1,500 SNS, 골드 이상 확정)
4. `item_pack`: **아이템 팩** (500 SNS, 육성 부스터 / EXP 영약 5개)
5. `ad_remove`: **광고 제거** (1,000 SNS, 영구 혜택 / 인게임 배너 영구 제거)
6. `official_novel`: **공식 소설** (100 SNS, 40부작 전편 무제한 열람권)
7. `official_movie`: **공식 동영상** (200 SNS, 40부작 시네마 풀영상 및 OST 소장권)
8. `coin_charge`: **코인 충전** (충전소, SNS 코인 즉시 충전)

### 2.3 통화 및 잔액 관리 체계 (`LocalStorage`)

애플리케이션 전반에서 사용되는 통화 및 로컬스토리지 키 분석:
- **`hero_sns`**: 사용자 보유 총 SNS 코인 잔액 (기본값: 1,000 SNS).
- **`hero_earned_sns`**: 게임 플레이/보상으로 획득한 SNS (App.tsx 초기화 시 1,000).
- **`hero_purchased_sns`**: 결제/충전으로 획득한 SNS (App.tsx 기본값 0).
- **`hero_sns_${currentSeason}`**: 시즌별 랭킹/프로필 연동 SNS 잔액.
- **`hero_gold`**: 미니게임 및 보스전, 배틀 승리로 획득하는 인게임 골드 (PlayGameView.tsx line 12976 등).
- **`hero_ad_removed`**: 광고 제거 상품 구매 플래그 (`'true'`).

### 2.4 인벤토리 및 카드 저장소 체계

1. **`cardNurtureStore` (`src/landing/services/cardNurtureStore.ts`)**:
   - 키: `hero_card_nurturing`
   - 구조: `{ cards: Record<number, CardNurtureData>, ownedCardIds: number[], updatedAt: number }`
   - 기본 보유 카드: `[1, 2, 3, 4, 5]`
   - 메서드: `addCard(cardId)`, `nurtureCard(cardId, exp)`, `allocateStat(cardId, dir)`
2. **레거시 및 본체 엔진 인벤토리 (`src/App.tsx`, `MobileCardPlayScreen.tsx`)**:
   - 키: `hero_inventory`, `hero_inventory_${season}`, `hero_inventory_guest_${season}`
   - 구조: `Record<number, { cardIndex: number, quantity: number, rarity: CardRarity, acquiredAt?: number }>`
   - 카드 파워: `hero_totalPower`, `hero_totalPower_${season}`

---

### 2.5 구체적 결함 및 누락 사항 (Detailed Defect Analysis)

#### [결함 1] 카드팩 구매 시 개봉 모달(Reveal Modal) 완전 누락
- **위치**: `src/landing/views/ShopSection.tsx` (Line 160~176), `src/landing/index.ts` (Line 163~171)
- **증상**:
  - `executeShopPurchase`가 카드 3장을 무작위로 생성하고 `cardNurtureStore.addCard(randId)`를 호출한 뒤 `{ success: true, message: '...' }`를 반환함.
  - `index.ts`의 이벤트 핸들러는 `if (!res.success) alert(res.message);`로 성공 시 알림조차 띄우지 않고 화면만 `renderApp()`함.
  - 사용자는 300~1,500 SNS가 차감되었음에도 **어떤 카드를 뽑았는지 전혀 알 수 없으며**, 카드 일러스트, 등급, 스탯 연출이 전혀 노출되지 않음.
- **요구사항 위반**: "ensuring card packs can be opened and currencies are properly credited and debited" 위반.

#### [결함 2] 인벤토리 저장소 미동기화 (카드 배틀 엔진과의 단절)
- **위치**: `src/landing/services/cardNurtureStore.ts` (Line 164~174), `src/landing/views/ShopSection.tsx` (Line 168)
- **증상**:
  - 카드팩 구매 시 오직 `cardNurtureStore.ownedCardIds`와 `hero_card_nurturing`에만 카드가 추가됨.
  - 전장/배틀/마이덱이 참조하는 본체 키인 `hero_inventory` 및 `hero_inventory_season1`에는 전혀 기록되지 않음.
  - 반대로, 기존에 플레이어가 `hero_inventory`에 모아둔 카드가 있어도 `cardNurtureStore`가 이를 읽지 않아 초기 카드 5장만 보유한 것으로 표시됨.

#### [결함 3] 통화 차감/지급 시 서브 키 미동기화
- **위치**: `src/landing/views/ShopSection.tsx` (Line 119~136)
- **증상**:
  - `setUserCoins`가 `hero_sns`만 기록하고 `hero_earned_sns`나 `hero_purchased_sns`를 갱신하지 않음.
  - `App.tsx`의 동기화 훅(Line 4995~5011)이나 리로드 발생 시 `purchasedSns + earnedSns`가 과거 값으로 남아 `hero_sns`를 덮어쓰거나 불일치가 발생할 위험이 있음.
  - 이벤트 디스패치 역시 `snshero_sns_updated`만 발생시키고 `hero_sns_updated`를 발생시키지 않아 일부 뷰가 갱신을 감지하지 못함.

#### [결함 4] 비무료(유료/재화 소모) 통화 충전 체계 부재
- **위치**: `src/landing/views/ShopSection.tsx` (Line 108~117, Line 144~147, Line 230~236)
- **증상**:
  - 상품 8번 `coin_charge`와 상단 `free-charge-coin` 버튼이 아무런 대가 없이 무제한으로 1,000 SNS를 무상 지급함 (`priceCoins: 0`).
  - 기획/승인 지침: "Navigating to `#shop` supports card pack purchases and non-free currency replenishment using in-game LocalStorage currency balances."
  - 인게임 로컬스토리지의 골드(`hero_gold`)나 배틀 전리품을 소모하여 SNS 코인을 충전/교환하는 현실적인 충전 메커니즘이 구현되어 있지 않음.

#### [결함 5] 카드팩 등급별 확률 풀의 하드코딩 오류
- **위치**: `src/landing/views/ShopSection.tsx` (Line 163~165)
- **증상**:
  ```ts
  const minId = itemId === 'pack_normal' ? 1 : itemId === 'pack_magic' ? 20 : 60;
  const maxId = itemId === 'pack_normal' ? 50 : itemId === 'pack_magic' ? 90 : 110;
  ```
  - 카드 ID 범위(1~50, 20~90, 60~110)로 단순 난수를 생성하고 있어 실제 `CARD_DATABASE`의 등급(`bronze`, `silver`, `gold`, `diamond`)과 일치하지 않음.
  - 예를 들어 `pack_rare`의 경우 60~110번 카드가 뽑히는데, 60번대는 실버 등급이 다수 포함되어 있어 '골드 이상 확정'이라는 상품 뱃지와 불일치함.

---

### 2.6 구체적 개선 및 구현 권고안 (Shop Blueprint)

#### A. 카드팩 개봉 모달 (`PackRevealModal`) 신설
- **모달 타입 확장**: `src/landing/types.ts`의 `ModalKey`에 `'pack_reveal'` 및 `'coin_exchange'` 추가.
- **UI 구조**:
  - OpenCode Terminal-Flat 디자인 (`rounded-none` 프레임, `border border-[#201d1d]`, `bg-[#fdfcfc]`, `font-mono`).
  - 헤더: `[GIFT PACK OPENED]` / `[카드팩 개봉 결과]` 뱃지 및 상품명 표기.
  - 3개 슬롯 반응형 카드 리스트 (모바일 1열, 데스크톱 3열):
    - `assetCatalog.ts`의 `getCharacterAsset(id)`를 통한 고화질 포트레이트(`seatUrl` or `bustPngUrl`).
    - 영웅 번호(`NO.001`), 영문명/한국어명, 종족 뱃지, 등급 뱃지(브론즈/실버/골드/SSR).
    - 동서남북(T, R, B, L) 능력치 및 합산 파워.
    - 미보유 카드 획득 시 선명한 `[NEW!]` 뱃지 노출.
  - 인터랙션 버튼 (모바일 44px+):
    - `[마이덱 확인하기]` (`data-nav="deck"`)
    - `[카드 육성하기]` (`data-nav="card"`)
    - `[확인 / 닫기]` (`data-action="close-pack-modal"`)
  - 효과음: `new Audio('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3').play()`

#### B. 인벤토리 이중 동기화 (`Dual-Write`) 체계
```ts
export function syncCardToInventories(cardId: number): void {
  // 1. cardNurtureStore 등록
  cardNurtureStore.addCard(cardId);

  // 2. hero_inventory 본체 등록
  if (typeof localStorage !== 'undefined') {
    try {
      const dbCard = CARD_DATABASE[cardId];
      const rarity = dbCard?.rarity || 'bronze';
      const raw = localStorage.getItem('hero_inventory') || '{}';
      const inv = JSON.parse(raw);
      const cur = inv[cardId] || { cardIndex: cardId, quantity: 0, rarity };
      inv[cardId] = {
        ...cur,
        quantity: (cur.quantity || 0) + 1,
        acquiredAt: Date.now()
      };
      localStorage.setItem('hero_inventory', JSON.stringify(inv));
      localStorage.setItem('hero_inventory_season1', JSON.stringify(inv));
      localStorage.setItem('hero_inventory_guest_season1', JSON.stringify(inv));

      // Total Power 누적
      const curPower = parseInt(localStorage.getItem('hero_totalPower') || '1000', 10);
      localStorage.setItem('hero_totalPower', String(curPower + (dbCard?.power || 10)));
    } catch (e) {
      console.warn('Inventory sync failed:', e);
    }
  }
}
```

#### C. 비무료 통화 충전 & 골드 환전소 (`Token Swap`) 메커니즘
- 상품 8번 `coin_charge` 클릭 시 무료 일괄 충전 대신 **충전 & 환전 모달** 실행:
  1. **인게임 골드(`hero_gold`) 환전**:
     - 1,000 Gold → 100 SNS 코인 (교환 비율 10:1)
     - 5,000 Gold → 600 SNS 코인 (+20% 보너스)
     - 10,000 Gold → 1,500 SNS 코인 (+50% 보너스)
     - 잔액 부족 시 경고 메시지 노출 및 차감 방지.
  2. **일일 모험가 정착 보급 (Daily Free Refill)**:
     - 1일 1회 무료 500 SNS 보급 (`hero_last_daily_sns` 타임스탬프로 24시간 쿨타임 제어).
  3. **재화 동기화 헬퍼 (`syncAllSnsBalances`)**:
     - `hero_sns`, `hero_earned_sns`, `hero_sns_season1`을 일괄 갱신하고 `snshero_sns_updated`, `hero_sns_updated` 이벤트를 동시 디스패치.

---

## 3. Responsive Google AdSense Integration 심층 조사

### 3.1 아키텍처 개요 및 현황

`index.html` (Line 716~717):
```html
<!-- Google AdSense -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6937094123258335" crossorigin="anonymous"></script>
```
- **게시자 클라이언트 ID**: `ca-pub-6937094123258335`
- **문제점**:
  - `home.html` 및 `src/App.tsx`에는 좌우 날개 및 모바일 상단 배너가 일부 구현되어 있으나,
  - **신규 정적 단일 페이지 랜딩인 `src/landing/index.ts`에는 애드센스 광고 컨테이너가 단 1줄도 존재하지 않음.**
  - `src/landing/styles/landing.css`에도 광고 레이아웃 유틸리티가 부재함.

### 3.2 뷰포트별 반응형 요구사항

| 뷰포트 규격 | 해상도 조건 | 애드센스 광고 유닛 배치 규격 | 인터페이스 보호 조치 |
| :--- | :--- | :--- | :--- |
| **PC / Desktop** | `width >= 1024px` (`lg:`, `xl:`, 2K, 4K) | 좌/우 거터 스카이스크래퍼 (`w-[120px]` ~ `160px`, `min-h-[600px]`) | 중앙 게임 컨테이너(`max-w-[1024px]`) 보존, 배틀 보드/조작부 0% 침범 |
| **Tablet & Mobile** | `width < 1024px` (`< lg:`, 360px~1023px) | 뷰포트 상단 가로 배너 (`max-w-[728px]`, 높이 60~72px) | 상단 헤더 직하단 문서 흐름 배치, 터치 조작부/카드 핸드 완전 가림 방지 |
| **광고 제거 유저** | `hero_ad_removed === 'true'` | 모든 애드센스 컨테이너 및 `<ins>` 완전 제거 | DOM 노드 소거 및 0px 공간 회수 |

---

### 3.3 레이아웃 계층 구조 및 배치 전략

#### A. 데스크톱 좌우 거터 (Width >= 1024px)
- **배치 원리**:
  - 전체 앱 컨테이너는 `w-full min-h-screen flex flex-col`.
  - 메인 영역은 `w-full flex-1 flex justify-center items-start px-2 lg:px-6 relative`.
  - 중앙 게임/랜딩 콘텐츠는 `max-w-[1024px] w-full shrink-0 flex-1`.
  - 좌측 여백: `<aside id="adsense-desktop-left" class="hidden lg:flex flex-col items-center w-[120px] xl:w-[160px] shrink-0 sticky top-20 mr-3 xl:mr-4 z-20">`
  - 우측 여백: `<aside id="adsense-desktop-right" class="hidden lg:flex flex-col items-center w-[120px] xl:w-[160px] shrink-0 sticky top-20 ml-3 xl:ml-4 z-20">`
- **침범 방지 보장 (Zero Intrusion)**:
  - 좌우 날개는 `sticky top-20`으로 스크롤 시 시야에 부드럽게 머무르며, 중앙 콘텐츠 컨테이너의 바깥 여백(Margin Gutter)에 물리적으로 격리됩니다.
  - 1024px 해상도에서도 메인 콘텐츠가 `w-[760px]~w-[800px]`로 안전하게 유지되어 가로 스크롤이나 레이아웃 깨짐이 0%입니다.

#### B. 모바일 및 태블릿 상단 배너 (Width < 1024px)
- **배치 원리**:
  - 위치: 상단 내비게이션 헤더(`#landing-header-slot`) 직하단.
  - 클래스: `<div id="adsense-mobile-top" class="block lg:hidden w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] px-2 py-1 select-none z-20">`
  - 높이: `h-[60px] sm:h-[72px]`, 내부 `<ins>` 높이 `max-h-[50px]~[60px]`.
- **침범 방지 보장 (Zero Intrusion)**:
  - 플로팅 오버레이(`fixed inset-x-0`)가 아닌 **문서 흐름(Document Flow)**으로 렌더링되므로, 아래의 메인 콘텐츠(게임 캔버스, 3x3 보드, 카드 리스트, 터치 버튼)를 자연스럽게 아래로 밀어냅니다.
  - 터치 조작부나 카드 핸드를 가리지 않으며 모바일 브라우저의 상단 노치 영역(`env(safe-area-inset-top)`)과 완벽하게 호환됩니다.

---

### 3.4 애드센스 컴포넌트 템플릿 및 설정 구조

#### A. 프로덕션 설정 모듈 (`src/landing/services/adConfig.ts`)
```ts
export interface AdSenseUnitConfig {
  client: string;
  slots: {
    desktopLeft: string;
    desktopRight: string;
    mobileTop: string;
  };
}

export const ADSENSE_CONFIG: AdSenseUnitConfig = {
  client: 'ca-pub-6937094123258335',
  slots: {
    desktopLeft: '4819203112',   // Production Slot ID placeholder
    desktopRight: '5928172341',  // Production Slot ID placeholder
    mobileTop: '6738291045',     // Production Slot ID placeholder
  },
};

export function isAdRemovedByUser(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem('hero_ad_removed') === 'true';
}
```

#### B. 순수 템플릿 스트링 애드센스 렌더러 (`src/landing/components/AdSenseUnits.ts`)
```ts
import { ADSENSE_CONFIG, isAdRemovedByUser } from '../services/adConfig';

export function renderMobileTopAd(): string {
  if (isAdRemovedByUser()) return '';

  return `
    <div
      id="adsense-mobile-top"
      aria-label="Google AdSense Mobile Top Banner"
      class="block lg:hidden w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] px-2 py-1 select-none z-20 font-mono"
    >
      <div class="max-w-[728px] mx-auto h-[60px] sm:h-[72px] flex flex-col items-center justify-center overflow-hidden">
        <div class="w-full flex items-center justify-between px-1 text-[8px] text-stone-400 uppercase tracking-wider mb-0.5">
          <span>[AD]</span>
          <span>Google AdSense</span>
        </div>
        <ins
          class="adsbygoogle"
          style="display:block;max-height:50px;width:100%"
          data-ad-client="${ADSENSE_CONFIG.client}"
          data-ad-slot="${ADSENSE_CONFIG.slots.mobileTop}"
          data-ad-format="horizontal"
          data-full-width-responsive="true"
        ></ins>
      </div>
    </div>
  `;
}

export function renderDesktopLeftAd(): string {
  if (isAdRemovedByUser()) return '';

  return `
    <aside
      id="adsense-desktop-left"
      aria-label="Google AdSense Left Wing"
      class="hidden lg:flex flex-col items-center w-[120px] xl:w-[160px] shrink-0 sticky top-20 mr-3 xl:mr-4 z-20 pointer-events-auto font-mono"
    >
      <div class="w-full bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] p-1 text-center rounded-none shadow-none">
        <div class="text-[9px] text-stone-400 border-b border-[rgba(15,0,0,0.08)] pb-0.5 mb-1">[AD] Google Ads</div>
        <ins
          class="adsbygoogle"
          style="display:inline-block;width:120px;min-height:600px"
          data-ad-client="${ADSENSE_CONFIG.client}"
          data-ad-slot="${ADSENSE_CONFIG.slots.desktopLeft}"
          data-ad-format="vertical"
        ></ins>
      </div>
    </aside>
  `;
}

export function renderDesktopRightAd(): string {
  if (isAdRemovedByUser()) return '';

  return `
    <aside
      id="adsense-desktop-right"
      aria-label="Google AdSense Right Wing"
      class="hidden lg:flex flex-col items-center w-[120px] xl:w-[160px] shrink-0 sticky top-20 ml-3 xl:ml-4 z-20 pointer-events-auto font-mono"
    >
      <div class="w-full bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] p-1 text-center rounded-none shadow-none">
        <div class="text-[9px] text-stone-400 border-b border-[rgba(15,0,0,0.08)] pb-0.5 mb-1">[AD] Google Ads</div>
        <ins
          class="adsbygoogle"
          style="display:inline-block;width:120px;min-height:600px"
          data-ad-client="${ADSENSE_CONFIG.client}"
          data-ad-slot="${ADSENSE_CONFIG.slots.desktopRight}"
          data-ad-format="vertical"
        ></ins>
      </div>
    </aside>
  `;
}
```

#### C. TagError 방지 안전 실행 스크립트
```ts
export function triggerAdSensePush(): void {
  if (typeof window === 'undefined') return;
  if (isAdRemovedByUser()) return;

  setTimeout(() => {
    try {
      const insElements = document.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status])');
      if (insElements.length === 0) return;

      const win = window as any;
      win.adsbygoogle = win.adsbygoogle || [];
      insElements.forEach((ins) => {
        // 이미 렌더링된 자식이 없는 경우에만 push
        if (ins.children.length === 0) {
          win.adsbygoogle.push({});
        }
      });
    } catch (e) {
      // AdSense push safe catch
    }
  }, 150);
}
```

---

## 4. 관련 파일 경로 및 상세 라인 매핑

| 파일 경로 | 관련 라인 | 현상 및 점검 내용 |
| :--- | :--- | :--- |
| `src/landing/views/ShopSection.tsx` | Line 36~117 | 정규 8개 상품 정의. 등급별 확률 매핑 수정 필요 |
| `src/landing/views/ShopSection.tsx` | Line 119~136 | `getUserCoins`, `setUserCoins`. `hero_sns` 단일 키만 갱신하는 문제 |
| `src/landing/views/ShopSection.tsx` | Line 138~197 | `executeShopPurchase`. 카드팩 구매 시 개봉 모달 트리거 누락 |
| `src/landing/views/ShopSection.tsx` | Line 221~236 | 헤더 무료 충전 버튼. 유료/골드 환전 루프로 전환 필요 |
| `src/landing/index.ts` | Line 61~87 | `renderApp`. 전체 레이아웃에 애드센스 컨테이너 미포함 |
| `src/landing/index.ts` | Line 163~171 | `buy-shop-item` 액션 처리 시 모달 노출 로직 부재 |
| `src/landing/components/Modals.tsx` | Line 17~191 | 모달 목록에 카드팩 개봉 모달 및 환전 모달 미등록 |
| `src/landing/services/cardNurtureStore.ts` | Line 164~174 | `addCard`. `hero_inventory` 이중 동기화 누락 |
| `src/landing/styles/landing.css` | Line 194~226 | 미디어 쿼리 정의. 좌우 거터 고정 클래스 추가 필요 |
| `src/App.tsx` | Line 6770~6784 | 데스크톱 좌측 거터 광고 구현 레퍼런스 |
| `src/App.tsx` | Line 6797~6813 | 모바일 상단 배너 광고 구현 레퍼런스 |
| `src/App.tsx` | Line 8691~8705 | 데스크톱 우측 거터 광고 구현 레퍼런스 |
| `src/components/AdSenseBanner.tsx` | Line 43~70 | `adsbygoogle.push` 중복 방지 가드 레퍼런스 |

---

## 5. 결론 및 구현 에이전트를 위한 권고사항 (Recommendations)

1. **상점 카드팩 개봉 모달 구현**:
   - `ShopSection.tsx`에서 카드팩 구매 완료 시 즉각 `state.activeModal = 'pack_reveal'`로 전환하고, 획득한 3장의 카드 정보(`cardId`, `nameKo`, `nameEn`, `rarity`, `stats`, `asset`)를 담아 모달에 전달해야 합니다.
   - 모달은 획득 카드의 고화질 일러스트와 능력치를 화려하고 정갈한 터미널 플랫 양식으로 렌더링하고, 마이덱/카드육성 바로가기 버튼을 제공해야 합니다.
2. **인벤토리 완전 동기화**:
   - 카드 추가 시 `cardNurtureStore`와 `hero_inventory`를 동시 갱신하여, 사용자가 `#shop`에서 뽑은 카드를 `#deck`, `#card`, `#play` 어디서든 즉시 장착하고 육성할 수 있도록 보장해야 합니다.
3. **비무료 통화 충전 & 골드 환전소**:
   - 8번 코인 충전 상품 클릭 시 단순 무료 지급 대신 인게임 골드(`hero_gold`)를 SNS 코인으로 환전하거나 일일 1회 무료 보급을 수령하는 팝업 허브를 제공해야 합니다.
4. **반응형 애드센스 전면 배치**:
   - `src/landing/index.ts`의 `renderApp()`에 `renderMobileTopAd()`, `renderDesktopLeftAd()`, `renderDesktopRightAd()`를 삽입하여 데스크톱(>=1024px)에서는 좌우 거터, 모바일(<1024px)에서는 상단 배너를 안정적으로 노출해야 합니다.
   - 렌더 직후 `triggerAdSensePush()`를 호출해 태그 에러 없이 광고가 로드되도록 조치해야 합니다.
