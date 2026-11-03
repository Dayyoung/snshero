# Handoff Report: R4 Core Screen Sections & Card Nurturing System Transition

- **Sender**: Explorer Survey 3 (`teamwork_explorer`)
- **Recipient**: Orchestrator (`7b342c7a-1d74-43d7-a388-5ffc926b3969`) / Lead & Workers
- **Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/`
- **Report Path**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/survey_report.md`
- **Handoff Type**: Hard (Investigation Completed)
- **Timestamp**: 2026-11-02T03:32:00Z

---

## 1. Observation (직접 관찰 사실)

1. **홈 섹션 (Home Section)**:
   - `src/views/HomeView.tsx` 라인 719~825: 네이버 웹소설(`http://novel.naver.com/challenge/list?novelId=1250635`), 네이버 웹툰(`https://comic.naver.com/challenge/list?titleId=856677`), 문피아 웹소설(`https://nlink.munpia.com/link/munpia/novel/616551`) 링크가 존재하며 외부 새 창으로 열리도록 구성됨.
   - `public/logo-ko.png`, `public/logo-en.png`: 정상적으로 존재하는 고해상도 로고 이미지 (각 ~1.6MB).
   - `public/anime-character-sheets/cutouts/`: `001_Aquaris.png`부터 `010_Poseidon.png` 등 110종의 7등신 고화질 컷아웃 캐릭터 시트 존재.

2. **마이덱 섹션 (My Deck Section)**:
   - `src/constants.ts` 라인 123~129:
     ```typescript
     export const getCardPower = (card: CardData): number => {
       const n = getCardStatWithBonus(card, 0);
       const e = getCardStatWithBonus(card, 1);
       const s = getCardStatWithBonus(card, 2);
       const w = getCardStatWithBonus(card, 3);
       return n + e + s + w;
     };
     ```
   - `src/views/MyDeckView.tsx` 라인 1258~1261: `currentDeck.reduce((acc, c) => acc + getCardPower(c), 0)`로 현재 5장 덱의 `deckPower`를 산출.
   - `src/views/MyDeckView.tsx` 라인 1756~1765: `deckPower`와 `globalTotalPower`를 2열 박스로 렌더링하고 있으나, 화면 전체에 분해, 합성, 연금술, 프리셋, 시너지 분석 등 3,700줄 이상의 복잡한 UI가 과밀 배치되어 있음.

3. **플레이 섹션 (Play Section)**:
   - `src/content/webtoonEpisodeManifest.json`: 1~40화 전편의 에피소드 및 840개 씬 이미지 매니페스트.
   - `public/images/webtoon/episode_XX/scene_XX.webp`: 실제 존재하는 로컬 고속 웹툰 컷신 파일.
   - `src/views/NovelView.tsx` 라인 686~751: `window.speechSynthesis` 기반 음성 합성 로직 보유. 현재는 수많은 탭(소설, 만화, 프롬프트, 북마크, 목차)과 복잡한 조작 버튼들이 혼재되어 있음.

4. **카드 섹션 및 육성 시스템 (Card Nurturing)**:
   - `src/cardDatabase.ts`: 1~110번까지의 110개 카드 데이터베이스 (Top, Right, Bottom, Left 4방향 스탯, 파워, 희귀도, 속성/종족).
   - `src/views/PlayGameView.tsx` 라인 7801~7806: 기존 미션 게임 대결 승리 시 `hero_card_enhancements` 로컬스토리지 키에 `(stored[targetCardId] || 1) + 1` 형태로 단순 강화 레벨을 기록하는 로직이 잔존함.
   - `src/types.ts` 라인 394~407: `InventoryRecord`에 `cardIndex`, `quantity`, `level`, `stats` 필드가 정의되어 있음.

5. **상점 섹션 (Shop Section)**:
   - `src/views/ShopView.tsx`: 6,782줄 규모로 실물 굿즈(티셔츠), PayPal, OKX Web3 암호화폐 입금, 인형뽑기(Claw), 환불 요청 폼 등 수많은 부가 기능이 혼재되어 화면이 과밀함.
   - 신규 요구사항은 정확히 8개 품목(일반 카드팩, 매직 카드팩, 희귀 카드팩, 아이템 팩, 광고 제거, 공식 소설, 공식 동영상, 코인 충전)만 단일 화면에 노출하도록 요구함.

---

## 2. Logic Chain (논리적 추론 체계)

1. **[홈 섹션 추론]**:
   - `HomeView.tsx` 및 `index.html`에 이미 검증된 네이버 웹소설, 네이버 웹툰, 문피아 웹소설 링크와 메타데이터가 존재하므로, 신규 정적 랜딩 화면에서는 이 3개 링크에 사용자가 쉽게 인지할 수 있는 붉은색/초록색 계열의 `[절찬 연재중]` 뱃지를 시각적으로 강조하여 상하 스크롤 흐름 속에 배치하면 R4-1 요구조건을 100% 충족함.

2. **[마이덱 섹션 추론]**:
   - TP는 `getCardPower(card)`인 $N + E + S + W$ 합계로 정의되어 있음.
   - 기존의 3,700줄에 달하는 분해/합성 모달을 걷어내고, 현재 5장 출전 카드 슬롯과 `덱 TP: XXX TP` (5장 합계), `총 TP: YYY TP` (보유한 모든 카드의 합계)만 Monospace 폰트로 심플하게 렌더링하는 전용 뷰를 구성하면 R4-2 요구조건을 완벽히 달성함.

3. **[플레이 섹션 추론]**:
   - 기존의 북마크/프롬프트 복사/AI 요약 등의 군더더기 버튼을 배제하고, `[닫기]`, `[이전]`, `[다음]`, `[나레이션]`, `[TTS]`의 5개 컨트롤만 배치.
   - `WEBTOON_MANIFEST`의 40개 에피소드 웹툰 이미지(`public/images/webtoon/`)만 선택/탐색할 수 있게 구성하고, 초기 렌더링 시 `isTtsEnabled = false`로 시작하여 브라우저 자동 재생 정책 위반 및 깜짝 음성 재생을 원천 차단함 (R4-3).

4. **[카드 섹션 및 육성 시스템 추론]**:
   - 기존 '미션' 화면의 3D/Canvas 미니게임 및 복잡한 대결 시스템을 폐지하고 '카드'로 명칭 변경.
   - 카드 수집율 (`보유 카드 / 110`) 및 110개 카드 그리드를 표시.
   - 1-클릭 육성(Nurture) 시 EXP를 획득하고, $\text{EXP}(L) = L \times 100$ 공식에 따라 최대 100레벨까지 성장.
   - 레벨업 시 3 스탯 포인트를 지급하고, 미사용 포인트가 있는 카드에 빨간 점(`animate-pulse`) 인디케이터를 점등.
   - 카드를 클릭하여 4방향 스탯(Top, Right, Bottom, Left)을 올리면 카드의 TP가 즉각 상승하고, 이 모든 진행 상황을 `hero_card_nurturing` 키로 `localStorage`에 영구 보존하면 R4-4 요구조건이 완전무결하게 성립함.

5. **[상점 섹션 추론]**:
   - 불필요한 결제창/환불창/굿즈샵을 전부 제거하고, 요구된 8개 고정 품목(일반/매직/희귀 카드팩, 아이템팩, 광고제거, 공식소설, 공식동영상, 코인충전)만 그리드 형태로 노출.
   - 클릭 시 즉시 로컬스토리지(`hero_sns`, `hero_inventory`, `hero_item_inventory`, `hero_ad_removed`)를 갱신하도록 설계하면 의존성 없이 독립 동작 가능함 (R4-5).

---

## 3. Caveats (주의사항 및 한계)

1. **로컬스토리지 용량 한계 (5MB~10MB)**:
   - 110개 카드의 육성 데이터는 간결한 JSON 형태(레벨, EXP, 포인트, 보너스 스탯)로 저장되므로 10KB 내외에 불과하여 로컬스토리지 쿼터 초과 위험이 없습니다.
2. **기존 데이터 마이그레이션**:
   - 기존 유저가 보유 중인 `hero_inventory`와 `hero_card_enhancements`가 있을 경우, 이를 읽어와 초기 보유 여부와 기본 레벨로 승계하도록 처리해야 기존 데이터 유실이 없습니다.
3. **독립 정적 페이지 분리**:
   - 본 조사는 R4의 각 섹션별 내부 구성과 육성 엔진 로직에 집중하였으며, 전체 HTML/라우팅 구조는 Explorer 1의 R1 설계와 합치되어야 합니다.

---

## 4. Conclusion (최종 결론)

R4 과제(홈, 마이덱, 플레이, 카드 육성, 상점 8개 항목)에 대한 코드베이스 분석이 100% 완료되었습니다.
- **홈**: 3대 외부 연재처(네이버 웹소설/웹툰, 문피아) '절찬 연재중' 배지 및 소개 콘텐츠 확정.
- **마이덱**: 5장 카드 + 덱 TP + 총 TP 심플 뷰 확정.
- **플레이**: 5개 전용 버튼(`[닫기]`, `[이전]`, `[다음]`, `[나레이션]`, `[TTS]`) + 웹툰 이미지 전용 + TTS 기본 OFF 확정.
- **카드 & 육성**: '카드' 명칭 변경 + 수집율 + 110개 그리드 + 100레벨 EXP 육성 시스템 + 레벨업 스탯 포인트 획득 + 빨간 점 인디케이터 + 4방향 스탯 분배 + `hero_card_nurturing` 영구 보존 확정.
- **상점**: 8개 정확한 품목(일반/매직/희귀 팩, 아이템팩, 광고제거, 공식소설, 공식동영상, 코인충전) 노출 로직 확정.

모든 세부 구현 명세는 `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/survey_report.md`에 집대성되어 있습니다.

---

## 5. Verification Method (독립 검증 방법)

1. **보고서 파일 무결성 확인**:
   ```bash
   cat /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/survey_report.md
   ```
2. **에셋 및 URL 링크 유효성 검증**:
   - `public/logo-ko.png`, `public/logo-en.png` 파일 존재 및 크기 확인
   - `public/anime-character-sheets/cutouts/` 110종 캐릭터 이미지 확인
   - 네이버 웹툰(`856677`), 네이버 웹소설(`1250635`), 문피아(`616551`) 링크 일치 확인
3. **스탯 및 계산 로직 검증**:
   - `src/constants.ts`의 `getCardPower` 수식과 `survey_report.md`의 TP 계산식 일치 여부 확인
4. **타입 안전성 및 빌드 테스트**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
