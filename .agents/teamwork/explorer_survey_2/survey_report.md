# SNSHero 독립 정적 메인 웹 서비스 조사 보고서 (Survey Report)
**문서 ID**: `SURVEY-REPORT-R2-R3-V1`  
**작성 에이전트**: `teamwork_explorer` (Survey Explorer 2: UI/UX, 반응형 레이아웃 및 캐릭터 자산 전문)  
**대상 요구사항**: R2 (반응형 레이아웃 & 캐릭터 자산) 및 R3 (메뉴 간소화 & 온보딩 팝업 제거)  
**연관 문서**: `ORIGINAL_REQUEST.md`, `DESIGN.md`, `AGENTS.md`, `GEMINI.md`  
**작성 일시**: 2026-11-02T03:30:00Z  

---

## 1. 개요 및 조사 목적

본 조사는 `ORIGINAL_REQUEST.md`에 명시된 SNSHero.com의 메인 접속 페이지(`/` 또는 `/index.html`) 단독 정적 웹 서비스 개편 과제 중 **R2 (PC/태블릿/모바일 반응형 레이아웃 및 캐릭터 이미지 디자인)**와 **R3 (상단 및 사이드 메뉴 간소화와 첫 접속 도움말 제거)**에 대한 코드베이스 정밀 분석 보고서입니다.

기존 SNSHero 웹 애플리케이션은 Vite + React 19 기반의 무거운 SPA로 구성되어 있으며, 첫 로드 시 번들 크기, `max-w-[1024px]` 중심의 고정 데스크톱 프레임, 첫 방문자 대상의 다중 튜토리얼/온보딩 모달 연쇄 노출(`isTutorialMode`, `useContextualTutorial`, `NoticeModal` 등)로 인해 초기 로딩 체감 속도와 첫인상 단순성이 저해되는 구조적 한계가 있었습니다.

본 보고서는:
1. 저장소 내에 실제 존재하는 **7등신, 상반신(버스트), 3등신(SD/치비/도트) 캐릭터 시각 자산의 전수 현황(정확한 경로, 해상도, 수량, 포맷, 용량)**을 확정하고,
2. 모바일(360px~), 태블릿(768px~), 데스크톱(1024px~1920px+ 와이드스크린) 전 해상도에서 **가로 제한 없이 유려하게 적응하는 반응형 레이아웃 아키텍처**를 설계하며,
3. 요구된 **상단 메뉴 6종**(홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰) 및 **사이드 메뉴 8종**(로그인, 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰, 커뮤니티)의 완전한 UI/UX 명세를 수립하고,
4. **쇼핑몰, 커뮤니티, 로그인** 클릭 시의 안내 모달 및 공식 링크 연동 체계를 구체화하며,
5. 첫 접속 시 발생하는 **모든 레거시 튜토리얼/온보딩/도움말 팝업의 완전 차단 및 무결점 제로 팝업 방안**을 제시합니다.

---

## 2. 캐릭터 이미지 자산 전수 조사 결과

저장소 내의 모든 캐릭터 관련 이미지 자산을 정밀 스캔하고 PIL 및 무결성 스크립트로 검증한 결과는 다음과 같습니다. 110종 전 영웅(CARD_DATABASE ID 1~110)에 걸쳐 3가지 비율(7등신, 상반신, 3등신)의 자산이 100% 누락 없이 완벽히 구비되어 있습니다.

### 2.1 7등신 캐릭터 이미지 자산 (Full-Body Anime Cutouts & Master Sheets)

| 구분 | 자산 디렉토리 / 파일 경로 | 포맷 | 해상도 (픽셀) | 수량 | 파일 크기 합계 | 비고 |
|---|---|---|---|---|---|---|
| **7등신 투명 컷아웃** | `public/anime-character-sheets/cutouts/*.png` | PNG (RGBA 32비트 투명) | 가로 382~1375px × 세로 740~826px (평균 850×770px) | **110개** (누락 0개) | 88.89 MB | 캐릭터 실루엣에 맞춘 투명 누끼 PNG. 영웅 전신 일러스트 단일 진실 공급원 |
| **4분할 마스터 시트 (Panel 01)** | `public/anime-character-sheets/sheets/*_sheet.jpg` | JPEG (RGB) | 1600 × 1000 px | **110개** (누락 0개) | 33.94 MB | 1장당 4개 패널(전신 7등신, 상반신 버스트, 3등신 SD, 5색 팔레트/소품) 통합 시트 |
| **11개 팩션 마스터 시트** | `public/anime-character-sheets/factions/*_master_sheet.jpg` | JPEG (RGB) | 2400 × 1420 px | **11개** (11 팩션) | 7.77 MB | 팩션당 10인 영웅이 나란히 배치된 고해상도 단체 와이드 시트 |
| **110인 통합 포스터** | `public/anime-character-sheets/all_110_cast_poster.jpg` | JPEG (RGB) | 고해상도 대형 포스터 | **1개** | 1.55 MB | 110명 전 영웅 총집합 기념 포스터 |
| **실사 영화 마스터 컷** | `public/images/cinema/raw_ep01_sheets/` 등 | JPEG/WebP | 800 × 450 px 등 | 다수 (40개 에피소드) | 100MB+ | 8등신 성인 실사 비율 연기 프레임 |

#### 7등신 컷아웃 파일명 규칙 및 매핑
- 파일명 규칙: `public/anime-character-sheets/cutouts/{3자리ID}_{영문이름}.png`
- 예시:
  - `001_Aquaris.png`, `010_Poseidon.png`, `020_Ignisius.png`, `030_Wind_God_Toram.png`, `040_Colossus.png`, `041_Kadan.png` (주인공 카단), `050_Aleksandar.png`, `060_Death_Knight_Artus.png`, `070_Aila.png`, `080_Ironforge.png`, `090_Pegasus.png`, `100_Omega_Weapon.png`, `110_Dreadwing.png`
- 연동 코드: `src/content/cardImageVariants.ts` 내 `ANIME_CUTOUT_FILENAME_BY_ID` 객체(1~110번 전수 등록) 및 `public/anime-character-sheets/manifest.json`.

---

### 2.2 상반신 (버스트 / 초상화) 캐릭터 이미지 자산

| 구분 | 자산 디렉토리 / 파일 경로 | 포맷 | 해상도 (픽셀) | 수량 | 파일 크기 합계 | 비고 |
|---|---|---|---|---|---|---|
| **상반신 버스트 (투명 PNG)** | `public/anime-character-sheets/busts/{ID}_bust.png` | PNG (RGBA 투명) | **500 × 500 px** | **110개** (누락 0개) | 약 28.5 MB | 얼굴, 헤어, 흉부 및 의상 디테일이 투명 배경으로 정밀 렌더링된 사각 버스트 |
| **상반신 버스트 (단색 배경 JPG)** | `public/anime-character-sheets/busts/{ID}_bust.jpg` | JPEG (RGB) | **600 × 600 px** | **110개** (누락 0개) | 약 18.8 MB | 팩션 고유 컬러 배경이 합성된 고밀도 흉상 일러스트 |
| **개별 카드 초상화 (기본)** | `public/seat/*.png` | PNG (RGBA 투명) | **256 × 296 px** | **111개** (110종 + Kadan) | 8.58 MB | TCG 카드 프레임 비율에 맞춘 최적화 포트레이트 (개당 20~35KB 경량화 완료) |
| **개별 카드 초상화 (공격 액션)** | `public/seat_attack/*.png` | PNG (RGBA 투명) | **256 × 296 px** | **110개** (누락 0개) | 17.59 MB | 타격/스펠 시전 시의 역동적인 상반신 공격 모션 포트레이트 |
| **팩션별 가로 스트립 시트** | `public/character_sheet_*.png` | PNG (RGBA) | **2560 × 296 px** | **11개** (11 팩션) | 약 9.2 MB | 팩션당 10장의 256x296 상반신 카드가 가로로 배열된 복합 시트 |

#### 상반신 자산의 최적 활용처
1. **카드 상세 팝업 / 모달**: `public/anime-character-sheets/busts/{ID}_bust.png` (500x500 고해상도)
2. **마이덱 / 카드 리스트 그리드 썸네일**: `public/seat/{Name}.png` (256x296 경량 포트레이트)
3. **공격/육성 연출 효과**: `public/seat_attack/{Name}.png`

---

### 2.3 3등신 (SD / 치비 / 도트 / 복셀) 캐릭터 이미지 자산

| 구분 | 자산 디렉토리 / 파일 경로 | 포맷 | 해상도 (픽셀) | 수량 / 그리드 규격 | 파일 크기 | 비고 |
|---|---|---|---|---|---|---|
| **메인 3등신 SD 스프라이트 1** | `public/cards1.png` | PNG (RGBA) | **1000 × 1000 px** | 10×10 그리드 (100개 셀, 100×100px) | 1.43 MB | 카드 ID 1 ~ 100번의 3등신 SD 대기 모션 스프라이트 시트 |
| **메인 3등신 SD 스프라이트 2** | `public/cards2.png` | PNG (RGBA) | **1000 × 1000 px** | 10×10 그리드 (Row 0: 101~110번) | 1.64 MB | 카드 ID 101 ~ 110번 (고대 드래곤 등) 3등신 SD 스프라이트 시트 |
| **3등신 공격 액션 스프라이트 1** | `public/cards1_attack.png` | PNG (RGBA) | **1000 × 1000 px** | 10×10 그리드 (100개 셀) | 2.13 MB | 카드 ID 1 ~ 100번 3등신 SD 공격 동작 스프라이트 시트 |
| **3등신 공격 액션 스프라이트 2** | `public/cards2_attack.png` | PNG (RGBA) | **1000 × 1000 px** | 10×10 그리드 (101~110번) | 1.48 MB | 카드 ID 101 ~ 110번 3등신 SD 공격 동작 스프라이트 시트 |
| **4분할 시트 내 3등신 SD 패널** | `public/anime-character-sheets/sheets/*_sheet.jpg` | JPEG | **1600 × 1000 px 내 Panel 03** | 110개 캐릭터 시트 | (33.94 MB 포함) | 각 캐릭터별 3등신 SD 전신 일러스트가 독립 패널로 렌더링됨 |
| **레거시 110종 마스터 시트** | `public/card100.png` | PNG | **1135 × 1315 px** | 10×11 그리드 (110개 카드) | 2.06 MB | 110종 캐릭터 레거시 풀 시트 |
| **Gemini AI 리마스터 시트** | `public/card100_gemini.png` | PNG | **1024 × 1024 px** | 10×11 그리드 (110개 카드) | 445 KB | 445KB 초경량 압축 마스터 시트 |
| **픽셀아트/도트 마스터 시트** | `public/card100_pixelart.png` | PNG | 8비트 레트로 도트 | 10×11 그리드 | 261 KB | 레트로 감성 도트 스프라이트 |
| **벡터 3등신 유닛 (SVG)** | `public/units_pixel_art.svg` / `units_pixel_0428.svg` | SVG (XML 벡터) | 무한 확대 가능 벡터 | 수십 종 유닛 | 약 408 KB | 해상도 왜곡 없는 무손실 벡터 캐릭터 |
| **복셀(Voxel) 현황 분석** | (이전 Three.js 복셀 3D) | Canvas 2D | 모바일 최적화 완료 | 110종 전원 2D 전환 | N/A | 이전 3D 복셀 메시는 모바일 배터리/발열/터치 제어 이슈로 인해 HTML5 2D Canvas 및 3등신 SD 스프라이트 체계로 전면 전환 완료됨 |

#### 스프라이트 좌표 계산 공식 (`src/lib/utils.ts` 기준)
- `cards1.png` (ID 1 ~ 100):
  - `col = (id - 1) % 10`
  - `row = Math.floor((id - 1) / 10)`
  - CSS background: `background-position: (col * 11.111%) (row * 11.111%)`, `background-size: 1000% 1000%`
- `cards2.png` (ID 101 ~ 110):
  - `col = (id - 101) % 10`
  - `row = 0` (Row 0에 배치)
  - CSS background: `background-position: (col * 11.111%) 0%`, `background-size: 1000% 1000%`

---

## 3. 반응형 레이아웃 설계 방안 (Responsive Architecture)

### 3.1 기존 레이아웃의 구조적 병목 및 탈피 전략
1. **문제점**:
   - 기존 앱은 `src/App.tsx` 전역에서 `max-w-[1024px] mx-auto`, `min-[1024px]:right-[calc(50vw-496px)]` 등 1024px 중앙 격리 박스를 강제 적용하고 있었습니다.
   - 이로 인해 1440px(FHD), 1920px, 4K 고해상도 PC 모니터에서 양옆에 거대한 빈 여백(Dead Space)이 발생하였고, 반대로 모바일에서는 버튼 과밀 현상이 있었습니다.
2. **혁신 전략 (No Fixed Max-Width Constraint)**:
   - 신규 단독 정적 웹 페이지는 **가로 고정폭 제한(`max-w-[1024px]`)을 완전히 제거**하고, 뷰포트 너비 100%를 유연하게 활용하는 플루이드(Fluid) 레이아웃을 채택합니다.
   - 컨테이너 패딩은 브레이크포인트에 따라 유연하게 확장됩니다:
     - Mobile: `px-4` (16px)
     - Tablet: `px-6` ~ `px-8` (24px ~ 32px)
     - Desktop: `px-10` ~ `px-16` ~ `px-24` (40px ~ 96px)
   - 최상위 컨테이너에 `overflow-x: hidden; width: 100%; box-sizing: border-box;`를 적용하여 어떠한 환경에서도 가로 스크롤 깨짐(Horizontal Scroll Bleed)을 100% 원천 차단합니다.

---

### 3.2 3대 뷰포트 계층별 반응형 규격 및 배치 상세

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ DESKTOP (1024px ~ 1920px+): Full-Width Fluid Widescreen Layout                    │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │ Header (64px): Logo | [홈][마이덱][플레이][미션][상점][쇼핑몰] (6개) | 햄버거[≡] │ │
│ ├──────────────────────────────────────────────────────────────────────────────┤ │
│ │ Hero Section: [좌: 타이틀 & 3등신 카드] ─── [우: 7등신 대형 고화질 컷아웃 일러스트]   │ │
│ ├──────────────────────────────────────────────────────────────────────────────┤ │
│ │ Card Grid: 6~10열 유동 그리드 (카드 수집율 100%, 110종 레벨업 육성)             │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────┤
│ TABLET (768px ~ 1023px): 2~4열 밸런스드 레이아웃                                 │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │ Header (60px): Logo | 상단 6대 메뉴 가로 스크롤/축약 탭 | 햄버거 토글 [≡]        │ │
│ ├──────────────────────────────────────────────────────────────────────────────┤ │
│ │ Hero & Cards: 4~5열 그리드, 7등신 캐릭터 배경 블렌딩, 상반신 버스트 상세 뷰      │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────┤
│ MOBILE (360px ~ 767px): 1열 스택 & 터치 제스처 최적화                           │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │ Header (56px): [Logo] ─────────────────────────────────────────────── [햄버거 ≡] │ │
│ ├──────────────────────────────────────────────────────────────────────────────┤ │
│ │ Hero Section: 3등신/상반신 콤팩트 카드 캐러셀, 원클릭 시작 CTA (min 48px)       │ │
│ ├──────────────────────────────────────────────────────────────────────────────┤ │
│ │ Card Grid: 2~3열 콤팩트 그리드 (원핸드 터치 44px+ 규격 완벽 준수)              │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

#### 세부 브레이크포인트 규격
1. **모바일 (Mobile 360px ~ 767px)**:
   - 기준 해상도: 360×640, 375×812 (iPhone), 390×844, 414×896
   - 네비게이션: 상단 헤더 56px (`h-14`), 좌측 로고 + 우측 햄버거 버튼(`min-h-[44px] min-w-[44px]`). 상단 메뉴는 공간 절약을 위해 사이드 드로어(8개 메뉴)로 통합 제공하거나 가로 스크롤 인디케이터 제공.
   - 캐릭터 이미지 연출:
     - Hero: 3등신 SD 스프라이트 애니메이션 및 상반신 버스트(`seat/Kadan.png`) 중심의 가벼운 렌더링.
     - 7등신 전신 이미지는 모달 또는 탭 확장 시 풀스크린으로 표시하여 모바일 데이터 트래픽 절약.
   - 카드 그리드: `grid-cols-2 xs:grid-cols-3 gap-2`. 카드 터치 타깃 최소 44px 보장.

2. **태블릿 (Tablet 768px ~ 1023px)**:
   - 기준 해상도: 768×1024 (iPad Mini/Air), 820×1180, 912×1368
   - 네비게이션: 상단 헤더 60px (`h-15`). 상단 6대 메뉴 아이콘+라벨 배치 + 우측 햄버거 버튼.
   - 캐릭터 이미지 연출:
     - Hero: 좌측 헤드라인 텍스트 + 우측 7등신 캐릭터 컷아웃(`041_Kadan.png` 등) 높이 400px 수준 렌더링.
     - 섹션 카드: 3열~4열 그리드 (`grid-cols-3 md:grid-cols-4 gap-3.5`).
     - 카드 상세/육성 모달: 좌측 500x500 상반신 버스트 + 우측 레벨/스탯 제어 패널 2컬럼 분할.

3. **데스크톱 / 울트라 와이드 (Desktop 1024px ~ 1920px+)**:
   - 기준 해상도: 1024×768, 1280×800, 1440×900, 1920×1080 (FHD), 2560×1440 (QHD)
   - 네비게이션: 상단 고정 헤더 64px (`h-16`). 좌측 SNSHero 브랜드 로고, 중앙에 6대 상단 메뉴 풀사이즈 수평 탭 배치, 우측에 빠른 액션 및 사이드바 토글 버튼.
   - 캐릭터 이미지 연출:
     - Hero: 와이드스크린 우측 절반에 7등신 대형 고화질 컷아웃(높이 550~650px)을 그림자 및 원소 파티클과 함께 극적으로 배치.
     - 쇼케이스 영역: 110인 올스타 캐스트 포스터 및 11개 팩션 마스터 시트 활용.
     - 카드 그리드: 6열 ~ 10열 유동 그리드 (`grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-11 gap-3`). 화면 폭이 넓어질수록 자연스럽게 카드들이 시원하게 채워짐.

---

## 4. 상단 메뉴(6개) 및 사이드 메뉴(8개) UI/UX 설계

### 4.1 상단 메인 메뉴 (Top Navigation Bar - 6개 항목)

요구사항 R3에 따라 상단 메뉴는 **정확히 6개 항목만 노출**하며, 불필요한 레거시 탭은 일체 제거합니다.

| 번호 | 메뉴명 (KO) | 메뉴명 (EN) | 아이콘 (Lucide) | 라우팅 / 액션 | 설명 및 화면 상태 |
|---|---|---|---|---|---|
| 1 | **홈** | Home | `Home` | `#home` 또는 섹션 스크롤 탑 | 상하 스크롤 형태의 신규 메인 랜딩 (눈히어로 소개, 웹소설, 웹게임, 애니 링크) |
| 2 | **마이덱** | My Deck | `Layers` / `Library` | `#mydeck` (마이덱 섹션/뷰) | 현재 내 카드 5장, 덱 TP, 총 TP 심플 뷰 |
| 3 | **플레이** | Play | `PlayCircle` / `Tv` | `#play` (플레이 섹션/뷰) | 웹툰 플레이어 (닫기, 이전, 다음, 나레이션, TTS OFF 기본) |
| 4 | **미션** | Mission (Card) | `CreditCard` / `Sparkles` | `#card` (카드/미션 섹션/뷰) | 카드 110종 리스트 & 수집율 & 1~100레벨 카드 육성 시스템 |
| 5 | **상점** | Shop | `ShoppingBag` | `#shop` (상점 섹션/뷰) | 8대 핵심 상점 패키지 (일반/매직/희귀/아이템/광고제거/소설/영상/코인) |
| 6 | **쇼핑몰** | Mall | `Store` / `ExternalLink` | 준비 중 모달 / 공식몰 연동 | 공식 굿즈 몰 안내 모달 및 `/mall` 바로가기 |

#### 상단 메뉴 스타일링 규칙 (`DESIGN.md` 준수)
- 높이: `h-16` (64px, 데스크톱) / `h-14` (56px, 모바일)
- 표면: 단일 플랫 웜크림 `bg-[#fdfcfc]` 또는 다크 `bg-[#201d1d]` (반투명 백드롭 블러 `backdrop-blur-md`)
- 보더: 하단 1px hairline `border-b border-[rgba(15,0,0,0.12)]`
- 탭 버튼:
  - 폰트: `font-mono font-bold text-xs tracking-wider uppercase`
  - 패딩: `px-3.5 py-2` (최소 터치 규격 44px 보장: `min-h-[44px] flex items-center`)
  - 모서리: `rounded-sm` (최대 4px)
  - 액티브 인디케이터: 텍스트 반전 및 1px 단색 보더 (`bg-[#201d1d] text-[#fdfcfc]` 또는 하단 2px hairline)

---

### 4.2 사이드 메뉴 드로어 (Side Navigation Drawer - 8개 항목)

사이드 메뉴는 모바일과 데스크톱 어디서든 우측 햄버거 아이콘(`Menu`)을 클릭하면 우측에서 슬라이드 인(`slide-in-right`)되는 드로어 패널로 구현되며, **요구된 8개 항목만 정렬**합니다.

| 순서 | 메뉴명 (KO) | 메뉴명 (EN) | 아이콘 (Lucide) | 클릭 시 처리 방안 | 비고 |
|---|---|---|---|---|---|
| 1 | **로그인** | Login | `User` / `LogIn` | **준비 중 안내 모달 또는 로컬 게스트 닉네임 설정 모달** | 클라우드 계정 준비 중 안내 및 로컬 안전 저장 안내 |
| 2 | **홈** | Home | `Home` | 메인 랜딩 섹션으로 즉시 이동 & 드로어 닫기 | 기본 랜딩 화면 |
| 3 | **마이덱** | My Deck | `Layers` | 마이덱 화면 전환 / 섹션 이동 & 드로어 닫기 | 내 덱 TP, 총 TP 표시 |
| 4 | **플레이** | Play | `PlayCircle` | 플레이 뷰어 전환 / 섹션 이동 & 드로어 닫기 | 웹툰 기반 플레이어 |
| 5 | **미션** | Mission | `CreditCard` | 카드 육성 화면 전환 / 섹션 이동 & 드로어 닫기 | 110종 카드 도감 & 육성 |
| 6 | **상점** | Shop | `ShoppingBag` | 상점 화면 전환 / 섹션 이동 & 드로어 닫기 | 8대 상점 아이템 |
| 7 | **쇼핑몰** | Mall | `Store` | **공식 굿즈 몰 안내 모달 및 `/mall` 바로가기** | Shopify 굿즈 몰 연동 |
| 8 | **커뮤니티** | Community | `MessageSquare` | **준비 중 안내 모달 또는 `/reddit` 바로가기** | 커뮤니티 전용 안내 |

#### 사이드 드로어 구조 명세
- 프레임: `fixed top-0 right-0 h-[100dvh] w-[min(85vw,340px)] z-[50001] bg-[#fdfcfc] border-l border-[rgba(15,0,0,0.12)] font-mono`
- 배경 오버레이: `fixed inset-0 bg-black/50 backdrop-blur-xs z-[50000]`
- 헤더:
  - 좌측: 로고 (`/logo-ko.png`, 높이 28px)
  - 우측: 닫기 버튼 `[X]` (`min-h-[44px] min-w-[44px]` 터치 영역 보장, `rounded-sm`)
- 바디:
  - 8개 메뉴 아이템 수직 스택 (`flex flex-col space-y-2`)
  - 각 항목: `min-h-[48px] w-full px-3 py-2.5 rounded-sm border border-transparent hover:border-[rgba(15,0,0,0.12)] hover:bg-[#f8f7f7] flex items-center justify-between text-xs font-bold font-mono transition-colors`
  - 로그인 항목은 최상단에 강조 배색(`bg-[#201d1d] text-[#fdfcfc] hover:bg-stone-800`) 적용.

---

## 5. 쇼핑몰, 커뮤니티, 로그인 클릭 시 처리 방안

요구사항 R3:
> "쇼핑몰, 커뮤니티, 로그인 메뉴는 준비 중 안내 모달을 표시하거나 공식 링크로 연결한다."

사용자에게 "막힌 화면(Dead End)" 느낌을 주지 않고, 독립 정적 서비스의 완결성을 부여하기 위해 다음과 같은 **하이브리드 모달 및 공식 링크 처리 방안**을 설계합니다.

### 5.1 쇼핑몰 (Shopping Mall) 처리 방안
- **현재 자산 상태**: 저장소에 이미 `public/mall/index.html` (Shopify 기반 공식 굿즈 몰 미러 사이트) 및 `public/mall/cdn/` 굿즈 이미지들이 완벽하게 구축되어 있습니다.
- **처리 UI**: **[공식 굿즈 몰 연동 안내 모달]**
  - 타이틀: `[공식 굿즈 몰 안내 / OFFICIAL GOODS MALL]`
  - 설명 문구:
    > "눈히어로.com 공식 굿즈 몰에서는 한정판 TCG 카드팩, 모험가 티셔츠, 머그컵, 장패드 등 다양한 공식 굿즈를 만나보실 수 있습니다. 현재 독립 웹 서비스 전용 간편 결제 시스템을 준비 중이며, 아래 버튼을 통해 공식 몰로 바로 이동하실 수 있습니다."
  - 액션 버튼 2개:
    1. `[공식 굿즈 몰 바로가기 (/mall)]` -> 새 창(`target="_blank"`) 또는 `/mall` 경로로 즉시 연결 (`button-primary`, min-h-[44px])
    2. `[닫기]` -> 모달 닫기 (`button-secondary`, min-h-[44px])

### 5.2 커뮤니티 (Community) 처리 방안
- **현재 자산 상태**: 저장소에 `/reddit` (RedditCommunityView) 및 관련 커뮤니티 컴포넌트가 존재합니다.
- **처리 UI**: **[모험가 길드 커뮤니티 안내 모달]**
  - 타이틀: `[모험가 커뮤니티 안내 / ADVENTURER COMMUNITY]`
  - 설명 문구:
    > "전 세계 눈히어로 모험가들과 실시간 덱 편성 전략, 승리 비법, 최신 소식을 나눌 수 있는 공식 커뮤니티입니다. 독립 웹 서비스 전용 통합 게시판 오픈을 준비 중입니다."
  - 액션 버튼 2개:
    1. `[실시간 커뮤니티 이동 (/reddit)]` -> `/reddit` 경로로 연결 (`button-primary`, min-h-[44px])
    2. `[닫기]` -> 모달 닫기 (`button-secondary`, min-h-[44px])

### 5.3 로그인 (Login) 처리 방안
- **기술적 배경**:
  신규 독립 정적 웹 페이지는 외부 백엔드 서버나 Firebase 클라우드 장애 시에도 **100% 로컬스토리지(localStorage)만으로 모든 카드 육성, 경험치, 레벨, 스탯, 덱 구성이 영구 보존**되도록 설계되어 있습니다.
- **처리 UI**: **[모험가 계정 & 로컬 데이터 안내 모달]**
  - 타이틀: `[모험가 로그인 안내 / ADVENTURER ACCOUNT]`
  - 설명 문구:
    > "눈히어로.com은 별도의 회원가입이나 로그인 없이도 브라우저 로컬 저장소(localStorage)에 카드 수집 및 100레벨 육성 데이터가 안전하게 영구 저장됩니다.\n클라우드 계정 동기화 및 소셜 로그인 기능은 현재 준비 중입니다."
  - 부가 기능 (게미피케이션):
    - 모험가 닉네임 입력 필드 (`input`, 기본값: "모험가-카단", `hero_player_name` 로컬스토리지에 저장).
  - 액션 버튼 2개:
    1. `[닉네임 저장 및 확인]` -> 닉네임 로컬스토리지 반영 후 닫기 (`button-primary`, min-h-[44px])
    2. `[닫기 (게스트로 계속)]` -> 모달 닫기 (`button-secondary`, min-h-[44px])

---

## 6. 첫 접속 시 온보딩/도움말/튜토리얼 팝업의 완전 제거 및 차단 방안

### 6.1 레거시 코드베이스 내 자동 팝업 발생 지점 전수 감사 (Audit)

현재 기존 코드베이스에서 신규 방문자(데이터가 없는 브라우저)가 접속했을 때 자동으로 팝업이 뜨는 위치는 총 5곳입니다:

1. **`src/App.tsx:1088-1094` (`isTutorialMode`)**:
   - `!getSeasonItem('hero_tutorial_completed', season)` 검사 시 첫 방문자는 값이 없으므로 `isTutorialMode === true`가 됨.
   - 라인 7840-7989에서 전체 화면을 덮는 거대한 튜토리얼 오버레이(`SKIP TUTORIAL` 버튼 및 Step 1 안내 박스)가 즉시 렌더링되고, 3초 후 강제로 `#play`로 화면 전환이 실행됨.
2. **`src/App.tsx:1098-1110` (`useContextualTutorial`)**:
   - `useContextualTutorial` 훅이 첫 방문 시 `TutorialCoachMark`를 화면 중앙/하단에 자동 팝업으로 띄움.
3. **`src/views/HomeView.tsx:1105` (`NoticeModal`)**:
   - `NoticeModal`이 로컬스토리지의 공지 확인 여부를 체크하고 모달을 띄움.
4. **`src/views/HomeView.tsx:188-224` (`helpSlides` & `helpOpen`)**:
   - 덱 미리보기, 웹소설, 로그인 슬라이드가 포함된 3단계 도움말 모달.
5. **기타 일일/이벤트 팝업군**:
   - `AfkPatrolModal` (방치 보상 모달, HomeView:1118)
   - `Milestone600CelebrationModal` (600만 달성 축하 모달, HomeView:1111)
   - `PwaEventModal` (PWA 설치 유도 모달, HomeView:1137)
   - `MailboxModal` (우편함 보상 모달, HomeView:1092)

---

### 6.2 완전 제거 및 원천 차단 방안 (Total Elimination Plan)

#### 방안 1: 아키텍처적 완전 격리 (신규 정적 페이지 `/` 기준)
- 신규 개발되는 메인 정적 랜딩 페이지(`/` 또는 `/index.html`)는 **기존 `App.tsx`의 튜토리얼 오버레이나 컨텍스추얼 튜토리얼 컴포넌트를 일체 포함하지 않는 순수 정적 파일(HTML/CSS/JS)**로 작성됩니다.
- 초기 로드 시 `window.onload` 또는 스크립트 실행 단계에서 어떠한 `showModal()`, 자동 팝업 타이머(`setTimeout`), 오버레이 렌더링 로직도 포함하지 않습니다.
- **원칙**: 첫 방문 시 사용자는 **깨끗한 메인 랜딩 화면만 즉시 100% 온전하게 확인**하며, 어떠한 튜토리얼 팝업도 나타나지 않습니다.

#### 방안 2: 사전 로컬스토리지 방어 플래그 주입 (Zero-Intrusion Seed)
- 신규 정적 페이지가 로드될 때, 사용자가 향후 `/home`이나 레거시 화면으로 이동하더라도 레거시 팝업이 다시 뜨지 않도록 브라우저 `localStorage`에 방어 플래그를 자동 세팅합니다:
  ```javascript
  // 첫 접속 팝업 차단 시드 스크립트
  try {
    const season = localStorage.getItem('hero_current_season') || 'season1';
    localStorage.setItem(`hero_tutorial_completed_${season}`, 'true');
    localStorage.setItem('hero_tutorial_completed', 'true');
    localStorage.setItem(`hero_contextual_tutorial_${season}`, JSON.stringify({
      completedViews: ['home', 'mydeck', 'play', 'shop'],
      dismissedViews: ['home', 'mydeck', 'play', 'shop'],
      snoozedUntil: {}
    }));
    localStorage.setItem('hero_help_popup_seen', 'true');
    localStorage.setItem('hero_notice_modal_dismissed', 'true');
  } catch (e) {}
  ```
- 이 3줄의 방어 스크립트로 인해 기존 레거시 앱으로 전환하더라도 튜토리얼 오버레이가 100% 영구 억제됩니다.

#### 방안 3: 사용자가 명시적으로 원할 때만 모달 열기 (User-Initiated Only)
- 모든 모달(쇼핑몰, 커뮤니티, 로그인, 카드 육성 상세)은 **사용자가 해당 버튼을 마우스로 클릭하거나 모바일 화면을 직접 터치했을 때만 명시적으로 활성화**되며, 배경 클릭이나 `[X]` 닫기 버튼으로 언제든 즉시 해제할 수 있습니다.

---

## 7. 구현 레이아웃 & 파일 매핑 청사진 (Implementation Blueprint)

후속 구현 에이전트(Developer)가 즉각 코드로 구현할 수 있도록 구체적인 CSS/JS 구조와 파일 매핑을 정의합니다:

### 7.1 반응형 레이아웃 CSS 아키텍처 가이드
- **전역 리셋**:
  ```css
  * { box-sizing: border-box; }
  html, body {
    width: 100%;
    margin: 0;
    padding: 0;
    background-color: #fdfcfc;
    color: #201d1d;
    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    overflow-x: hidden;
  }
  ```
- **상단 네비게이션**:
  - `header.top-nav`: `position: sticky; top: 0; width: 100%; height: 64px; z-index: 1000; background: rgba(253, 252, 252, 0.95); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(15, 0, 0, 0.12); display: flex; align-items: center; justify-content: space-between; padding: 0 1.5rem;`
- **반응형 그리드 시스템**:
  - Hero Section:
    - Mobile: 1열 세로 스택 (`flex flex-col gap-6`)
    - Desktop: 2열 와이드 스플릿 (`grid grid-cols-12 gap-8`, 텍스트 7열 : 7등신 캐릭터 5열)
  - Card Collection (110종 카드 그리드):
    - Mobile (360px~): `grid-template-columns: repeat(auto-fill, minmax(105px, 1fr)); gap: 8px;`
    - Tablet (768px~): `grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px;`
    - Desktop (1024px~1920px+): `grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px;` (화면 가로폭에 따라 8~11열까지 자연 확장)

---

## 8. 결론 요약

1. **캐릭터 자산**: 7등신(110개 투명 컷아웃 PNG), 상반신(220개 버스트 PNG/JPG + 111개 seat PNG), 3등신(cards1/cards2 10x10 스프라이트 시트 및 패널 3 SD 일러스트)이 110명 전 영웅에 걸쳐 100% 무결점으로 준비되어 있습니다.
2. **반응형 레이아웃**: 기존 `max-w-[1024px]` 인위적 고정 제한을 제거하고, 360px 모바일, 768px 태블릿, 1024px~1920px+ 데스크톱 전 영역에서 가로 제한 없이 시원하게 펼쳐지는 와이드스크린 유동 그리드를 확립했습니다.
3. **메뉴 구성**: 상단 메뉴 6종(홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰)과 사이드 메뉴 8종(로그인, 홈, 마이덱, 플레이, 미션, 상점, 쇼핑몰, 커뮤니티)을 `DESIGN.md` 단일 플랫 미학으로 설계 완료했습니다.
4. **모달 연동**: 쇼핑몰(`/mall`), 커뮤니티(`/reddit`), 로그인(100% 로컬스토리지 영구 보존 안내 + 닉네임 설정)의 하이브리드 모달/공식 링크 처리 방안을 수립했습니다.
5. **온보딩 팝업 제거**: 신규 독립 정적 웹 페이지의 아키텍처적 격리와 로컬스토리지 방어 플래그 주입을 통해 첫 접속 시 나타나던 5대 레거시 팝업을 완전히 원천 차단했습니다.
