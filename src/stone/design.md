# Hearthstone Classic Web (`/game.html`) — 상용 프로덕션 디자인 시스템 명세서 (`design.md`)

> **적용 범위 (Scope Isolation)**
> 본 문서는 `/game.html` (및 `/game`, [`src/hearthstone/`](file:///Users/dayyoung/project/snshero/src/stone/HearthstoneApp.tsx)) 독립 멀티페이지 애플리케이션 전용 **상용 프로덕션 UI/UX 디자인 가이드**입니다. 본편 SNSHero 앱(`index.html`, `home.html`)의 터미널 플랫 디자인(`DESIGN.md`)과 완전히 분리되어 동작하며, 블리자드 엔터테인먼트의 **Derek Sakamoto & Kyle Harrison 오리지널 하스스톤 UI 철학**([Behance Hearthstone UI](https://www.behance.net/gallery/25695693/Hearthstone-UI)) 및 공식 웹 카드 라이브러리·덱 빌더([Blizzard Cards](https://hearthstone.blizzard.com/ko-kr/cards), [Blizzard Deckbuilder](https://hearthstone.blizzard.com/ko-kr/deckbuilder?deckFormat=standard&set=standard))의 시각적 완성도를 100% 일관되게 준수합니다.

---

## 1. 핵심 디자인 철학 (Core Aesthetic Philosophy)

1. **"Physicality & Sense of Place" — 물리적 실재감과 여관의 공간감**
   - 플랫 웹 UI(단순 CSS 둥근 사각형, 네온 테두리, 이모지 아이콘 `🌀`/`🃏`/`⚔️`, 일반 웹 알약 배지)를 **전면 배제**합니다.
   - 모든 인터페이스는 **스톤브루의 여관 참나무 탁자(`box_table_bg.webp`) 위에 놓인 물리적 보석함('더 박스', `box_chest_full.webp`)과 가죽 장정 고서(`page_parchment_classic.webp`), 조각된 석판·황동 메달리온**으로 구성됩니다.
2. **5단계 물성(Materiality) 레이어 위계**
   - **Layer 0 — 숙성된 여관 참나무 & 벨벳 러너 (Aged Tavern Oak & Royal Velvet)**: `box_table_bg.webp` (`#1d1109` ~ `#4a2a14`) + 금박 자수가 놓인 로열 블루 벨벳 천(`#102347`).
   - **Layer 1 — 주조 황동 & 단조 철제 장식 (Cast Brass & Forged Iron)**: 모서리 브래킷, 경첩, 리벳, 골드 베벨 림(`linear-gradient(180deg, #fff3c4 0%, #d8a23c 45%, #7c5116 100%)`).
   - **Layer 2 — 정으로 깎은 석판 베젤 (Chiseled Hearthstone Slate)**: 영웅 아치 프레임, 전장 하수인 타원형 석판(`minion_oval_bezel.webp`), 소용돌이 대전 시작 메달리온(`play_swirl_medallion.webp`), 턴 종료 석조 버튼(`endturn_stone.webp`).
   - **Layer 3 — 바랜 양피지와 가죽 고서 (Weathered Vellum & Leather Tome)**: 가장자리가 찢기고 은빛 필리그리 문양이 새겨진 컬렉션 북 페이지(`page_parchment_classic.webp`), S자 곡선 카드 명판 스크롤.
   - **Layer 4 — 비전 마력광 & 난로 불빛 (Arcane Swirl & Hearth Warmth)**: 차가운 사파이어 비전 소용돌이(`#38bdf8` → `#0284c7`)와 따뜻한 여관 벽난로 앰버 불빛(`#fbbf24` → `#ea580c`)의 극적인 색온도 대비.

---

## 2. 서체 및 수치 렌더링 규격 (Typography & Numerals — 100% 나눔고딕 통일)

1. **전 화면 100% 나눔고딕 (`Nanum Gothic`) 단일 서체 체계**
   - `/game.html` 내 모든 타이틀(`.hs-title`), 수치(`.hs-num`), 버튼, 탭, 설명문, 모달, 전투 캔버스 피해/치유 플로팅 팝업(`BoardVfxCanvas.tsx`), 카드 확대 판독 명판(`CardZoomModal.tsx`)은 가독성이 뛰어난 **나눔고딕 (`'Nanum Gothic', '나눔고딕', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif`)** `400 / 700 / 800` 웨이트로 100% 통일합니다.
   - 마나 비용, 공격력, 생명력, 방어도, 내구도, 덱 잔여 매수, 등급 숫자는 나눔고딕 `800 ExtraBold` + **다중 외곽선 스트로크(`2.5px #000000`) + 하단 드롭 섀도우**를 적용해 모바일 소형 화면에서도 선명하게 읽혀야 합니다.
   - **동적 수치 상태 색상**:
     - 기본값: `#FFFFFF` (순백색)
     - 버프 / 비용 감소: `#4ADE80` (에메랄드 그린 발광)
     - 피해 / 비용 증가: `#FF4D4D` (크림슨 레드)
2. **타이틀 및 고대비 본문 한국어 서체**
   - **명판·버튼·헤더 (`.hs-title`)**: 나눔고딕 `800 ExtraBold` + 조각 음각 외곽선(`.hs-outline`), 황금빛 아이보리(`#FFF5D6`) 텍스트 컬러 (단, 밝은 상아 명판 `.hs-ivory-plate` 내부에서는 어두운 세피아 브라운 `#2B180A`을 유지).
   - **양피지 본문·카드 확대 텍스트 명판**: 양피지(`#FDF6E4` ~ `#E9DAC0`) 위에서는 외곽선 없는 짙은 세피아 잉크(`#1A0F06`)와 `14px~15px` 볼드 나눔고딕을 적용하여 모바일에서도 작은 카드 텍스트가 한눈에 읽히도록 보장합니다.

---

## 3. 카드 디자인 아키텍처 (Commercial Card Visual Standard)

[`CardVisual.tsx`](file:///Users/dayyoung/project/snshero/src/stone/components/CardVisual.tsx)의 모든 카드는 단순 CSS 박스 대신 **블리자드 공식 한국어(`koKR`) 프리렌더 알파 PNG + 실시간 동적 스탯/실루엣 셰이더 레이어**로 렌더링합니다.

1. **기본 카드 레이어 (1:1 Official `koKR` Alpha Render)**
   - 엔드포인트: `https://art.hearthstonejson.com/v1/render/latest/koKR/{256x|512x}/{vanId || id}.png`
   - 2014 오리지널 클래식(`VAN_*`) 전용 렌더를 우선 사용하여 **언너프 오리지널 코스트/텍스트, 오리지널 소용돌이 워터마크, 입체 전설 용 문양(Dragon Crest), 대검 공격력 구체, 핏방울 생명력 보석, S자 양피지 리본, 직업별 조각 프레임**을 원본 100% 그대로 표시합니다.
   - 손패/그리드(`SM`, `MD`)는 `256x`, 팩 개봉 확대/카드 상세 모달/전장 호버 프리뷰(`LG`)는 초고해상도 `512x` 에셋을 로드합니다.
2. **알파 실루엣 발광 (Alpha-Contour Silhouette Glow)**
   - 사각형 `box-shadow`를 절대 사용하지 않습니다.
   - 투명 알파 채널을 따라 마나 수정·전설 용 날개·하단 검/핏방울 돌출부 외곽선이 그대로 빛나도록 CSS `filter: drop-shadow(...)` 다중 패스를 적용합니다:
     - 사용 가능 (`GREEN`): `drop-shadow(0 0 5px #4ade80) drop-shadow(0 0 14px rgba(34,197,94,0.9))`
     - 도적 연계 활성 (`COMBO`): `drop-shadow(0 0 5px #facc15) drop-shadow(0 0 16px rgba(250,204,21,0.95))`
     - 전설/특급/희귀 팩 개봉 후광: 등급별 컬러 `drop-shadow` + 회전 광선(`hs_godrays1.webp`).
3. **실시간 동적 비용·주문 공격력 오버레이**
   - `effectiveCost !== card.cost`일 때 좌상단 육각 사파이어 마나 수정 좌표 위에 정밀 정렬된 입체 사파이어 젬 + `나눔고딕` 초록/빨강 수치를 오버레이합니다.
   - 주문 공격력 보너스(`spellPowerBonus > 0` 또는 `예언자 벨렌` 배수)가 적용된 피해 주문은 하단에 비전 증폭 배지(`주문 공격력 +N`)를 표시합니다.
4. **오프라인/토큰 조각 폴백 렌더러 (Sculpted SVG Fallback)**
   - 네트워크 오프라인 또는 특수 커스텀 토큰 발생 시에도 평면 박스가 아닌, 다면체 사파이어 마나 수정 SVG + 아치형 양피지 스크롤 + 교차 대검 황금 구체 + 루비 핏방울 보석으로 구성된 스큐어모픽 프레임을 렌더링합니다.
5. **전장 하수인 타원형 토큰 (`BoardMinionToken`)**
   - 추출된 석조 타원 베젤(`minion_oval_bezel.webp`) + 고해상도 원화 줌 크롭 + 도발 철제 방패(`taunt_shield.webp`) + 천상의 보호막 황금 돔(`divine_shield.webp`) + 전설 용 문양(`legendary_dragon.webp`) + 교차 검 공격력 구체 & 루비 핏방울 생명력 보석으로 구성합니다.

---

## 4. 핵심 화면별 디자인 일관성 규격 (Screen Consistency Rules)

### 4.1 여관 양문 인트로 화면 ([`TavernIntroScreen.tsx`](file:///Users/dayyoung/project/snshero/src/stone/screens/TavernIntroScreen.tsx))
- **구성 요소**:
  - 배경: 따뜻한 벽난로 불빛이 일렁이는 여관 내부(`tavern_bg.webp`) + 부유하는 황금 불씨(Ember) 파티클 & 볼류메트릭 갓레이.
  - 좌·우 석조/목조 기둥(`intro_wall_left.webp`, `intro_wall_right.webp`)과 중앙 3D 경첩 양문(`intro_door_left.webp`, `intro_door_right.webp`).
  - 양문 맞물림 중앙: 8각 나침반 황금 별 + 푸른 비전 소용돌이 인장(`box_compass_medallion.webp`) 및 틈새로 새어 나오는 황금빛 난로 광선.
  - 상단 중앙: 초고해상도 석조·황금 조각 마스터 로고(`hs_logo_master.webp`).
  - 하단 중앙: 밧줄에 매달린 목제 여관 현판(`intro_hanging_sign.webp`) 위에 조각된 황동 입장 버튼과 클래식 패치(`1.0.0.4944`) 각인.
- **인터랙션**: 클릭 시 묵직한 경첩 개방음(`box_open`)과 함께 양문이 좌우 3D 원근(`perspective(1500px) rotateY(±92deg)`)으로 활짝 열리고, 벽난로 빛이 화면을 감싸며 여관 탁자 위 '더 박스'로 카메라가 줌인됩니다.

### 4.2 더 박스 메인 허브 ([`BoxHubScreen.tsx`](file:///Users/dayyoung/project/snshero/src/stone/screens/BoxHubScreen.tsx))
- **배경**: `box_table_bg.webp` (참나무 여관 테이블 + 금박 로열 블루 실크 러너 + 촛불 비네팅).
- **중앙 보석함 프레임**: 물리적 나무 상자(`box_chest_full.webp` / 황동 코너 브래킷 + 음각 몰딩 프레임) 안에 회전하는 황금 원형 디스크(`box_menu_disk.webp`, `hs_thebox_ring.webp`, `hs_thebox_glowring.webp`) 배치.
- **3대 메인 아이보리 명판 버튼**: `대전 (PLAY)`, `연습 (PRACTICE)`, `입문 튜토리얼 (TUTORIAL)` — 실제 `TheBox_Top`의 깎인 상아/황동 베벨 플레이트 질감 구현.
- **하단 황동 서랍 트레이**: `카드 팩 개봉`, `내 카드첩 · 덱 빌더`, `퀘스트 일지`, `상점` 4분할 물리 버튼 + 상단 주조 황동 재화/등급 표시줄.

### 4.3 가죽 고서 카드첩 & 공식 덱 빌더 ([`CollectionScreen.tsx`](file:///Users/dayyoung/project/snshero/src/stone/screens/CollectionScreen.tsx))
- **좌측/중앙 — 가죽 장정 컬렉션 고서**:
  - `page_parchment_classic.webp` 양피지 지면 + 상단 공식 10종 직업 문장 탭(`crest_mage.webp` ~ `crest_neutral.webp`).
  - 상단 컨트롤 바: 육각 사파이어 마나 수정 필터(`전체`, `0`~`7+`), 등급 보석 필터, 키워드/이름 검색창, 가루 제작 모드 토글.
  - 2×4 (페이지당 8장) 공식 알파 PNG 카드 그리드 + 좌우 책장 넘김 화살표 + 카드 우클릭/돋보기 클릭 시 **512px HD 원화·플레이버 텍스트·신비한 가루 제작/분해 모달** 노출.
- **우측 — 조각 참나무 & 철제 덱 트레이 (`DeckTrayV2` + Blizzard Deckbuilder)**:
  - 선택 영웅 초상화 아치 헤더 + **실시간 마나 커브 막대그래프 (`0`~`7+` 분포 차트)**.
  - 원화 타일(`getCardTileUrl`) 크롭 슬롯 바(좌측 사파이어 코스트 배지 + 중앙 그라데이션 카드명 + 우측 보유 수량 `2` / 전설 `★` 각인).
  - 하단 **`자동 완성`**, **`덱 코드 복사/불러오기`**, **`저장 완료`** 황동 버튼.

### 4.4 영웅·덱 선택 ([`HeroDeckSelectScreen.tsx`](file:///Users/dayyoung/project/snshero/src/stone/screens/HeroDeckSelectScreen.tsx)), 팩 개봉 제단 ([`PackOpeningScreen.tsx`](file:///Users/dayyoung/project/snshero/src/stone/screens/PackOpeningScreen.tsx)), 7v7 전장 ([`BattleScreen.tsx`](file:///Users/dayyoung/project/snshero/src/stone/screens/BattleScreen.tsx))
- **영웅 선택**: 3×3 영웅/덱 초상화 액자(`crest_*.webp` 직업 문장 부착) + 우측 영웅 대형 아치 쇼케이스 + 등급 메달(`medal_classic.webp` / `medal_legend.webp`) + 석조 소용돌이 **`대전 시작` (`play_swirl_medallion.webp`)** 원형 버튼.
- **팩 개봉 제단**: 고대 석조 룬 제단 + 마력 떨림(`hsPackTremble`) 및 충격파 섬광 개봉 연출 → 중앙에서 5각 오각형(Pentagon) 대형으로 방사형 사출 → 비동기 사인파 부유(`hsPackCardFloat`, 공중 부양 그림자 동반) + 양면 3D 원근 회전(`preserve-3d` `rotateY(0deg → 180deg)` + `hsCardFlipLift` 도약 + `hsFlipBurstRing` 등급 충격파) 및 `5장 한 번에 뒤집기` 순차 연쇄 개봉 지원.
- **7v7 전장**:
  - 우측 중앙 공식 석조 턴 종료 버튼: 플레이 가능한 행동이 남아 있으면 노란색 **`턴 종료` (`endturn_yellow.webp`)**, 행동이 모두 끝났으면 초록색 **`할 일 없음` (`endturn_green.webp`)**, 상대 턴에는 석판 **`상대 턴` (`endturn_stone.webp`)**으로 자동 전환.
  - 영웅 방어도 `armor_shield.webp`, 직업별 비밀 구체 `secret_mage/hunter/paladin.webp`, 부채꼴 알파 PNG 손패 및 실루엣 발광 일관 적용.

### 4.5 모바일 포트레이트 (`360×800` ~ `390×844`) 최적화 & 전 화면 공통 카드 확대(`CardZoomModal`) UX 표준
1. **작은 카드 터치 → 선택 & 확대 (`CardZoomModal`) → 하단 사용 버튼 실행 / 외곽 터치 취소**
   - 카드가 등장하는 **모든 화면**(전장 내 손패·멀리건 시작 카드·드루이드 선택·사냥꾼 추적·전장 하수인·행동 기록, 카드첩 그리드·덱 빌더 슬롯, 팩 개봉 완료 카드)에서 작은 카드를 클릭/터치하면 **즉시 카드를 내거나 소모하지 않고** [`CardZoomModal.tsx`](file:///Users/dayyoung/project/snshero/src/stone/components/CardZoomModal.tsx)를 통해 카드를 선택·확대(`512x` `LG` 원화 + 고대비 나눔고딕 능력 텍스트 명판)합니다.
   - 확대 모달 하단의 기본 액션 버튼(`카드 사용`, `교체 표시하기 / 교체 취소`, `이 효과 사용`, `이 카드 손으로 가져오기`, `덱에 카드 넣기 / 빼기` 등)을 누를 때만 실제 카드 사용·편집이 실행되며, **모달 바깥 배경(외곽)을 터치하면 즉시 카드 선택이 취소**됩니다.
2. **모바일 포트레이트 누락·잘림 버튼/카드 0건 보장**
   - **전장 (`BattleScreen`)**: `XS`(`96×146`) 손패 스크롤 팬, 최대 7기 1열 전장 하수인(`48×66`), 모바일 상단 상대 뒷면 손패·`기물`·`메뉴 · 항복`, 중앙 전술 디바이더 바(`기록` 모달·`상대덱/내덱` 잔여 수·`턴 종료`), 하단 `감정표현` 및 10수정 마나 트레이 전수 노출.
   - **카드첩 (`CollectionScreen`)**: 모바일 상단 `카드첩 보기 ↔ 내 덱 목록 / 편집` 원탭 스위처 및 등급 필터·직업 문장 가로 스크롤 노출.
   - **팩 개봉 (`PackOpeningScreen`)**: 상단 가로형 팩 트레이 + 세로 화면 전용 `2-1-2` 부유 오각형 성좌(`MOBILE_PENTAGON_SLOTS`)로 5장 카드 동시 부유·개봉 지원.
   - **영웅·덱 선택 (`HeroDeckSelectScreen`)**: `3×3` 덱 그리드 + 하단 상시 고정 `대전 시작` 독 제공.

---

## 5. 금지 사항 체크리스트 (Strict Anti-Patterns for `/game.html`)
- [x] 이모지(`🌀`, `🃏`, `⚔️`, `👑`, `💎`)를 핵심 UI 아이콘 대용으로 노출 금지 → 반드시 추출된 블리자드 공식 텍스처(`crest_*.webp`, `armor_shield.webp`, `play_swirl_medallion.webp`, 커스텀 다면체 SVG 보석)만 사용.
- [x] 카드에 사각형 배경색 박스나 사각형 `box-shadow` 적용 금지 → 반드시 투명 알파 PNG + `filter: drop-shadow(...)` 실루엣 셰이딩만 사용.
- [x] 모던 SaaS 스타일 반투명 글래스모피즘/플랫 테일윈드 버튼 금지 → 황동·석조·참나무·양피지 베벨 프레임과 **나눔고딕 (`Nanum Gothic`)** 고대비 서체만 사용.
- [x] 작은 카드를 터치하자마자 확대 확인 없이 곧바로 전장에 내거나 교체 확정하는 동작 금지 → 반드시 **카드 선택 & 크게 확대(`CardZoomModal`) → 하단 사용 버튼 확정 / 외곽 클릭 취소** 흐름 준수.
