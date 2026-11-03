# SNSHero R4 핵심 화면별 구성 및 카드 육성 시스템 정밀 조사 보고서 (Survey Report)

- **조사자**: 탐색 에이전트 (Explorer Survey 3)
- **대상 과제**: R4 (핵심 화면별 구성 및 카드 육성 시스템 전환)
- **작업 일시**: 2026-11-02T03:30:00Z
- **관련 파일**: 
  - `src/views/HomeView.tsx`, `src/views/MyDeckView.tsx`, `src/views/NovelView.tsx`, `src/views/PlayGameView.tsx`, `src/views/ShopView.tsx`
  - `src/cardDatabase.ts`, `src/types.ts`, `src/constants.ts`, `src/constants/itemDatabase.ts`
  - `src/content/webtoonEpisodeManifest.json`, `public/images/webtoon/`
  - `public/logo-ko.png`, `public/logo-en.png`, `public/cards1.png`, `public/seat/`

---

## 1. 개요 및 조사 목적

본 조사는 신규 메인 정적 웹 서비스(`/` 및 `/index.html`)의 5대 핵심 섹션인 **홈**, **마이덱**, **플레이**, **카드(구 미션)**, **상점**의 구성 방식과, 기존 카드 대결을 대체하는 **100레벨 카드 육성 및 스탯 업그레이드 시스템**을 정밀 분석하고 구현 명세를 확립하기 위해 수행되었습니다.

---

## 2. 섹션별 정밀 분석 및 구현 설계

### [섹션 1] 홈 섹션 (Home Section)

#### 1) 요구사항 및 목표
- 상하 스크롤 형태의 반응형 랜딩 페이지 콘텐츠 구성
- 눈히어로(SnowHero) 소개: 아케인 대륙 11개 종족, 주인공 카단의 성장 서사 및 IP 소개
- 웹소설, 웹게임, 애니메이션의 3대 미디어 믹스 소개 및 바로가기
- **네이버 웹툰, 네이버 웹소설, 문피아 웹소설 링크에 '절찬 연재중' 배지 부착**

#### 2) 자산 및 데이터 연동 현황
- **로고 이미지**: 
  - 한국어: `/logo-ko.png` (정상 존재, 1.67MB)
  - 영어: `/logo-en.png` (정상 존재, 1.63MB)
- **대표 캐릭터 비주얼**:
  - 7등신 컷아웃: `public/anime-character-sheets/cutouts/001_Aquaris.png` ~ `010_Poseidon.png` 등 110종
  - 상반신 포트레이트: `public/seat/Aquaris.png` 등 110종
- **공식 외부 연재 링크 전수 확인**:
  1. **네이버 웹소설 (챌린지리그)**: `http://novel.naver.com/challenge/list?novelId=1250635`
  2. **네이버 웹툰 (도전만화)**: `https://comic.naver.com/challenge/list?titleId=856677`
  3. **문피아 웹소설**: `https://nlink.munpia.com/link/munpia/novel/616551`

#### 3) UI/UX 구성 명세
```html
<!-- 공식 연재 링크 배너 예시 -->
<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
  <!-- 네이버 웹소설 -->
  <a href="http://novel.naver.com/challenge/list?novelId=1250635" target="_blank" rel="noopener noreferrer"
     class="p-4 border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f8f7f7] rounded-none flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 bg-[#03C75A] text-white font-bold flex items-center justify-center text-xs">N</div>
      <div>
        <div class="flex items-center gap-2">
          <span class="font-bold text-sm">네이버 웹소설</span>
          <span class="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 border border-red-200 font-bold rounded-sm">절찬 연재중</span>
        </div>
        <p class="text-xs text-[#646262]">카단의 여정 챌린지리그</p>
      </div>
    </div>
    <span class="text-xs text-[#646262]">[↗]</span>
  </a>

  <!-- 네이버 웹툰 -->
  <a href="https://comic.naver.com/challenge/list?titleId=856677" target="_blank" rel="noopener noreferrer"
     class="p-4 border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f8f7f7] rounded-none flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 bg-[#00DC64] text-white font-bold flex items-center justify-center text-[10px]">WEB</div>
      <div>
        <div class="flex items-center gap-2">
          <span class="font-bold text-sm">네이버 웹툰</span>
          <span class="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 border border-red-200 font-bold rounded-sm">절찬 연재중</span>
        </div>
        <p class="text-xs text-[#646262]">도전만화 풀컬러 웹툰</p>
      </div>
    </div>
    <span class="text-xs text-[#646262]">[↗]</span>
  </a>

  <!-- 문피아 웹소설 -->
  <a href="https://nlink.munpia.com/link/munpia/novel/616551" target="_blank" rel="noopener noreferrer"
     class="p-4 border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#f8f7f7] rounded-none flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 bg-[#1351F9] text-white font-bold flex items-center justify-center text-[10px]">MUN</div>
      <div>
        <div class="flex items-center gap-2">
          <span class="font-bold text-sm">문피아 웹소설</span>
          <span class="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 border border-red-200 font-bold rounded-sm">절찬 연재중</span>
        </div>
        <p class="text-xs text-[#646262]">공식 연재 판타지</p>
      </div>
    </div>
    <span class="text-xs text-[#646262]">[↗]</span>
  </a>
</div>
```

---

### [섹션 2] 마이덱 섹션 (My Deck Section)

#### 1) 요구사항 및 목표
- 기존의 복잡한 부가 팝업(분해, 합성, 연금술, 시너지 빌더, 장비 세부 설정 등)을 걷어내고 **심플 뷰**로 개편
- **현재 내 카드 구성 (5장 슬롯)**
- **덱 TP (Tactical Power)** 및 **총 TP (Total Tactical Power)** 명확히 표시

#### 2) 데이터 및 계산식 분석
- **카드 1장의 TP 계산식 (`src/constants.ts:123`)**:
  ```typescript
  export const getCardPower = (card: CardData): number => {
    // Top, Right, Bottom, Left 4방향 스탯 합산
    return card.stats[0] + card.stats[1] + card.stats[2] + card.stats[3];
  };
  ```
- **덱 TP (Deck TP)**:
  - 현재 편성된 5장 카드의 TP 합계:
    $$\text{Deck TP} = \sum_{i=1}^{5} \text{power}(card_i)$$
- **총 TP (Total TP)**:
  - 유저가 보유한 모든 카드의 TP 합산 (또는 `localStorage.getItem('hero_totalPower')`):
    $$\text{Total TP} = \sum_{c \in \text{OwnedCards}} \text{power}(c)$$
- **기본 덱 (Starter Deck Fallback)**:
  - `[1, 11, 31, 51, 101]` (Aquaris, Ignis, Gaia, Walker, Bahamut 5장)

#### 3) 심플 뷰 레이아웃 설계
- 상단 HUD: 2열 타일 카드 (`덱 TP: X,XXX TP` | `총 TP: XX,XXX TP`)
- 중앙 영역: 5개의 출전 카드 프레임 (슬롯 번호, 캐릭터 일러스트, 4방향 스탯, 카드명, 개별 TP)
- 카드 터치 시 보유 카드 목록 중 1클릭 교체 기능 지원

---

### [섹션 3] 플레이 섹션 (Play Section)

#### 1) 요구사항 및 목표
- 불필요한 컨트롤 일체 제거: 목차 탐색기, 북마크, 글자 크기 조절, 프롬프트 복사, 다크모드, 씬 분석기 등 제거
- **오직 5개 버튼만 심플하게 표시**:
  1. `[닫기]` (`Close`)
  2. `[이전]` (`Prev`)
  3. `[다음]` (`Next`)
  4. `[나레이션]` (`Narration` 토글)
  5. `[TTS]` (`TTS` 음성 토글)
- **웹툰 이미지 전용 선택**:
  - `WEBTOON_MANIFEST` (`src/content/webtoonEpisodeManifest.json`)의 에피소드 1~40 웹툰 컷신 (`public/images/webtoon/episode_XX/scene_XX.webp`)
- **TTS 기본 비활성화 (OFF)**:
  - 초기 진입 시 `isTtsEnabled = false`로 설정되어 소리가 나지 않으며, 유저가 `[TTS]` 버튼을 명시적으로 눌렀을 때만 Web SpeechSynthesis 낭독 시작

#### 2) 플레이어 컨트롤 바 명세
```tsx
<div className="flex items-center justify-between p-3 border-t border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] font-mono">
  <button onClick={onClose} className="min-h-[44px] px-4 py-2 border border-[rgba(15,0,0,0.12)] rounded-sm bg-white hover:bg-[#f1eeee]">
    [닫기]
  </button>
  <div className="flex items-center gap-2">
    <button onClick={onPrev} className="min-h-[44px] px-3 py-2 border border-[rgba(15,0,0,0.12)] rounded-sm bg-white hover:bg-[#f1eeee]">
      [이전]
    </button>
    <button onClick={onNext} className="min-h-[44px] px-3 py-2 border border-[rgba(15,0,0,0.12)] rounded-sm bg-white hover:bg-[#f1eeee]">
      [다음]
    </button>
  </div>
  <div className="flex items-center gap-2">
    <button onClick={toggleNarration} className={`min-h-[44px] px-3 py-2 border rounded-sm ${showNarration ? 'bg-[#201d1d] text-white' : 'bg-white text-[#201d1d]'}`}>
      [나레이션 {showNarration ? 'ON' : 'OFF'}]
    </button>
    <button onClick={toggleTts} className={`min-h-[44px] px-3 py-2 border rounded-sm ${isTtsOn ? 'bg-indigo-600 text-white' : 'bg-white text-[#201d1d]'}`}>
      [TTS {isTtsOn ? 'ON' : 'OFF'}]
    </button>
  </div>
</div>
```

---

### [섹션 4] 카드 섹션 (구 미션) 및 카드 육성 시스템

#### 1) 요구사항 및 목표
- 섹션 명칭: **'미션' ➔ '카드'**로 전면 전환
- **카드 수집율 표시**: 보유 고유 카드 수 / 110 (예: `15 / 110 (13.6%)`)
- **110개 카드 리스트 표시**: 1~110번 카드를 깔끔한 그리드로 노출
- **기존 카드 대결 완전 폐지 ➔ 카드 육성 시스템 도입**:
  - 카드를 육성 활동(Nurture)하면 경험치(EXP) 획득
  - 최대 100레벨(Max Lv.100)까지 레벨업
  - 레벨업 시 **스탯 포인트(Stat Points)** 획득
  - 스탯 포인트를 보유한 카드에는 **빨간 점(Red Dot Indicator)** 표시
  - 카드를 클릭하여 스탯 업그레이드(Top, Right, Bottom, Left 스탯 분배)
- **로컬스토리지(localStorage) 영구 보존**

#### 2) 레벨업 및 경험치 밸런스 공식
- **최대 레벨**: 100
- **필요 경험치 공식**:
  $$\text{Required EXP}(L) = L \times 100 \quad (L: 1 \to 99)$$
  - Lv 1 ➔ 2: 100 EXP
  - Lv 2 ➔ 3: 200 EXP
  - Lv 10 ➔ 11: 1,000 EXP
  - Lv 99 ➔ 100: 9,900 EXP
- **육성 1회당 획득 EXP**: 기본 +50 EXP (쿨타임 없이 1-클릭 육성 또는 일일/무제한 육성 탭)
- **레벨업 보상**: 1레벨 상승 시 **스탯 포인트 +3 P** 지급

#### 3) 스탯 포인트 분배 및 빨간 점 인디케이터
- `statPoints > 0`인 카드:
  - 카드 썸네일 우상단에 `w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border border-white` 인디케이터 표시
- 클릭 시 스탯 업그레이드 패널 노출:
  - 보유 포인트: `X P`
  - 4방향 스탯 (North, East, South, West) 옆에 `[+]` 버튼
  - `[+]` 클릭 시 해당 스탯 +1, 보유 포인트 -1 소모
  - 포인트가 0이 되면 빨간 점 자동 소멸

#### 4) 로컬스토리지 영구 보존 스키마 설계
기존 프로젝트 규칙(`hero_*` 네이밍 및 JSON 무결성)을 100% 준수하는 스키마:
- **저장 키**: `hero_card_nurturing`
- **타입 정의 (`TypeScript`)**:
  ```typescript
  export interface CardNurtureRecord {
    cardId: number;              // 1 ~ 110
    level: number;               // 1 ~ 100
    currentExp: number;          // 현재 레벨 누적 경험치
    statPoints: number;          // 미사용 스탯 포인트 (0 이상 시 빨간 점)
    bonusStats: [number, number, number, number]; // [Top, Right, Bottom, Left] 추가 분배치
    nurtureCount: number;        // 총 육성 횟수
    updatedAt: number;           // 마지막 육성 타임스탬프
  }

  export type CardNurtureStore = Record<number, CardNurtureRecord>;
  ```
- **기존 데이터 호환성**:
  - `hero_inventory`: 카드의 보유 여부(`quantity > 0`)를 판별하는 기준
  - `hero_card_enhancements`: 기존 강화 수치가 있다면 초기 레벨 산정 시 반영
  - 카드의 최종 스탯 계산:
    $$\text{Final Stats} = \text{Base Stats} + \text{bonusStats}$$

---

### [섹션 5] 상점 섹션 (Shop Section)

#### 1) 요구사항 및 목표
- 기존 6,782줄의 온갖 복잡한 결제, 머천다이즈, 크로우 머신, 환불 폼을 걷어냄
- **정확히 8개 항목만 표시**:
  1. **일반 카드팩** (Normal Card Pack)
  2. **매직 카드팩** (Magic Card Pack)
  3. **희귀 카드팩** (Rare Card Pack)
  4. **아이템 팩** (Item Pack)
  5. **광고 제거** (Remove Ads)
  6. **공식 소설** (Official Novel)
  7. **공식 동영상** (Official Video)
  8. **코인 충전** (Coin Charge)

#### 2) 정확히 8개 품목 세부 명세표

| 번호 | 품목명 | 유형 | 비용 | 구매/클릭 시 동작 | 로컬스토리지 변경 키 |
|:---:|:---|:---:|:---:|:---|:---|
| **1** | **일반 카드팩** | 카드 뽑기 | 100 SNS | 일반(브론즈) 카드 1장 랜덤 획득 및 인벤토리 추가 | `hero_inventory`, `hero_sns` |
| **2** | **매직 카드팩** | 카드 뽑기 | 300 SNS | 매직(실버 이상) 카드 1장 확정 획득 | `hero_inventory`, `hero_sns` |
| **3** | **희귀 카드팩** | 카드 뽑기 | 500 SNS | 희귀(골드/보스) 카드 1장 확정 획득 | `hero_inventory`, `hero_sns` |
| **4** | **아이템 팩** | 장비 뽑기 | 200 SNS | `ITEM_DATABASE` 장비 아이템 1종 랜덤 획득 | `hero_item_inventory`, `hero_sns` |
| **5** | **광고 제거** | 기능 해금 | 1,000 SNS | 광고 영구 제거 활성화 (구매 후 '적용 중' 배지) | `hero_ad_removed` = `'true'` |
| **6** | **공식 소설** | 콘텐츠 바로가기 | 무료 (0 SNS) | 40화 공식 웹소설 뷰어로 화면 이동 | - |
| **7** | **공식 동영상** | 콘텐츠 바로가기 | 무료 (0 SNS) | 40화 극장판 공식 동영상/시네마 뷰어로 이동 | - |
| **8** | **코인 충전** | 재화 충전 | 무료 (0원) | 무료 충전 +500 SNS 코인 지급 및 잔액 갱신 | `hero_sns` |

---

## 3. 종합 분석 및 구현 제안 요약

1. **독립 정적 랜딩 웹 서비스와의 결합**:
   - 신규 랜딩 웹 서비스는 메인 접속(`/` 및 `/index.html`) 시 순수 정적(HTML, CSS, JS)으로 구동되며, 상단 6대 메뉴(`홈`, `마이덱`, `플레이`, `카드`, `상점`, `쇼핑몰`)에 맞춰 본 보고서의 5대 핵심 화면을 즉각적이고 반응형으로 서빙할 수 있도록 완전 분리 개발되어야 합니다.
2. **복잡도 대폭 감소 (UX 스트림라이닝)**:
   - 플레이 섹션: 5개 버튼(`[닫기]`, `[이전]`, `[다음]`, `[나레이션]`, `[TTS]`)만 유지, TTS 기본 OFF.
   - 상점 섹션: 8개 항목만 고정 그리드로 노출, 부가 팝업 및 외부 쇼핑몰 링크 배제.
   - 마이덱 섹션: 내 덱 5장 + 덱 TP + 총 TP 심플 뷰.
3. **카드 육성 시스템의 게이미피케이션 완성**:
   - 복잡한 대결 없이 카드를 1-클릭으로 육성하고 레벨 100까지 올리는 직관적 쾌감 제공.
   - 스탯 포인트를 획득하면 카드에 빨간 점이 켜지고, 클릭하여 스탯을 직접 분배하는 정통 RPG 육성 루프를 완성.
   - 모든 데이터는 `hero_card_nurturing`에 영구 보존.

---
보고서 작성 완료.
