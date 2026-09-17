---
name: rsi
description: snshero.com 모바일 게임의 기획/디자인/개발을 전면 검토하고 12대 핵심 화면을 1회 1화면씩 순차 개선하며, 엑셀 대신 화면별 신규 md 분석 문서를 생성하고 소스코드 구현, 빌드 검증, 구글 폼 보고를 자동 수행하는 순환 화면 혁신(Rolling Screen Innovation) 스킬
---

# /rsi 스킬 지침서 (Rolling Screen Innovation: 순환 화면 전면 혁신)

## 개요
`/rsi`는 `snshero.com`을 모바일 게임으로서 전면적으로 검토하고, **12대 핵심 화면을 한 화면씩 순차적으로 집중 개선**하는 통합 혁신 스킬입니다.
엑셀 업데이트 대신 **`docs/screen_audits/` 경로에 화면별 정밀 분석 마크다운(`SCR_XX_화면명.md`) 문서를 신규 생성**하여 영구 보존하며, 도출된 개선사항을 실제 프로덕션 코드(React 19 + TypeScript 5.8 + Tailwind CSS 4.1)에 즉각 반영하고 빌드 검증 및 보고를 완료합니다.

---

## 5대 핵심 분석 및 개선 지표 (Evaluation Pillars)

각 화면 검토 시 다음 5가지 축을 엄격하게 점검하여 구체적인 작업 항목을 도출합니다:

1. **사용자 유치 & 첫 3분 온보딩 (User Acquisition & FTUE)**:
   - 복잡한 튜토리얼 없이 3초 만에 룰을 이해하고 즉시 승리의 쾌감을 느끼는가?
   - 공유 가능한 승리/덱 카드, 친구 초대, 리퍼럴 동선이 매력적인가?

2. **게임 판매율 및 과금 전환율 증대 (Monetization & Conversion)**:
   - 패배 직후, 팩 개봉 직후 '합리적인 소액 특가 패키지(예: 1,000원 스타터팩, 할인 AP 물약)' 유혹이 자연스럽게 배치되었는가?
   - SNS 토큰과 골드의 순환 구조가 플레이어의 소비 욕구를 자극하는가?

3. **모바일 퓨어 터치 사용성 & 화면 단순화 (Mobile Pure Touch UX & Minimal First View)**:
   - **첫 화면 단순화 & 버튼 과밀 원천 차단**: 화면에 수많은 버튼이 평면적으로 나열되는 복잡함을 방지하고, 첫 화면은 핵심 3~4개 상위 카테고리만 심플하게 표시.
   - **상위/하위 메뉴 및 팝업 허브화**: 세부 기능은 아코디언 메뉴 또는 팝업(모달 허브)으로 구성하여 짜임새 있는 2단계 탐색 구조 적용.
   - 한 손 조작(One-hand play)이 100% 가능한가? 터치 타깃 44px 이상 유지 여부.
   - `100dvh` 화면 안에서 불필요한 스크롤, 텍스트 잘림, 팝업 중첩이 없는가?
   - PC(대화면 좌우 배너) 및 모바일(상단 배너 및 원터치) 반응형 정합성.

4. **성능 및 반응속도 (Performance & 60fps)**:
   - 무지연 0ms 터치 피드백, RAF 스로틀링, 가벼운 CSS/Canvas 렌더링, 메모리 누수 원천 차단.
   - 저사양 디바이스에서도 부드러운 60fps 유지 여부.

5. **게임의 재미와 도파민 (Dopamine & Core Loop)**:
   - 마지막 한 장으로 판을 뒤집는 '역전의 짜릿함(Comeback Finisher)'이 있는가?
   - 시각 효과(FX), 콤보 사운드(SFX), 햅틱 진동이 풍부하고 중독성이 있는가?

---

## 12대 순환 검토 대상 화면 맵

| 화면 ID | 화면명 | 뷰 식별자 | 주요 소스코드 파일 | 중점 점검 목표 |
|---|---|---|---|---|
| **SCR-01** | 홈 & 메인 로비 | `home` | `src/views/HomeView.tsx`, `MainLobbyBannerCarousel.tsx` | 온보딩, 첫인상, 배틀 직행 동선, 공지 인지율 |
| **SCR-02** | 배틀 아레나 (3x3 보드) | `play` | `src/views/PlayGameView.tsx`, `BattleMinimalTopBar.tsx`, `BattleFXEngine.ts` | 드래그 조작감, 연쇄 도미노 손맛, 역전 피니셔 |
| **SCR-03** | 마이덱 & 카드 돌봄 | `mydeck` | `src/views/MyDeckView.tsx`, `CardItem.tsx` | 덱 편성 터치 편의성, 다마고치 애정도 육성 |
| **SCR-04** | 상점 & 카드팩 가챠 | `shop` | `src/views/ShopView.tsx` | 팩 개봉 연출 도파민, 30회 천장 체감, 스타터팩 |
| **SCR-05** | 카드 P2P 마켓플레이스 | `marketplace` | `src/views/CardMarketplaceView.tsx` | 호가창 직관성, 지정가 자동 매수, 가스비 페이백 |
| **SCR-06** | 가상 주식 거래소 | `stock` | `src/views/StockMarketView.tsx` | 지분 시세 차트, 1탭 배당금 복리 재투자 |
| **SCR-07** | 승부 예측 시장 | `prediction` | `src/views/PredictionMarketView.tsx` | AI 배틀 베팅 쾌감, 원터치 배팅 UX, 배당금 풀 |
| **SCR-08** | 시련의 탑 & 레이드 | `tower` | `src/views/PlayGameView.tsx`, `BattleBossHUD.tsx` | 층별 등반 성취감, 보스 기믹 예고, 한정 칭호 |
| **SCR-09** | 미션 캔버스 아레나 | `mission_games` | `src/views/PlayGameView.tsx` | Poki 110선 퓨어 제스처 조작감, 60fps 2D 캔버스 |
| **SCR-10** | 소셜, 친구 친선전 & 길드 | `guild` | `src/views/GuildDetailView.tsx`, `FriendBattlePanel.tsx` | 비동기 친선전 링크, 길드전 예측, 용병 대여 |
| **SCR-11** | 웹소설·웹툰 미디어 허브 | `novel` | `src/views/NovelView.tsx`, `AnimeView.tsx`, `MovieView.tsx` | IP 세계관 몰입, 뷰어 읽기 보상, 완독률 증대 |
| **SCR-12** | 설정 & 보상 센터 | `setting` | `src/views/SettingView.tsx`, `DailyMissions.tsx`, `AttendanceStreakModal.tsx` | 에너지 번 환급, 7일 출석 스트릭, 저사양 모드 |

---

## 수행 절차 (Execution Workflow)

### 1단계: 대상 화면 결정 및 신규 md 리포트 생성
- 스크립트를 실행하여 다음 점검 대상 화면을 확인하고 템플릿 마크다운 문서를 생성합니다:
  ```bash
  python3 skills/rsi/scripts/screen_rotator.py --init-doc
  ```
- `docs/screen_audits/SCR_XX_[VIEW].md` 파일이 자동 생성됩니다.

### 2단계: 5대 지표 관점 정밀 진단
- 해당 화면 컴포넌트와 관련 하위 컴포넌트, 엔진 코드를 `view_file` 또는 `grep_search`로 열람합니다.
- 모바일 390x844 뷰포트 기준 UI/UX, 성능, 과금 동선, 게임성 취약점 1~3건을 도출합니다.
- 생성된 `docs/screen_audits/SCR_XX_[VIEW].md` 문서에 분석 결과 및 개선 과제를 구체적으로 작성합니다.

### 3단계: 실제 프로덕션 소스코드 구현
- 도출된 핵심 개선 사항을 실제 React 19 + TypeScript 5.8 + Tailwind 코드로 완벽하게 개발 적용합니다.
- **필수 준수 원칙**:
  - `DESIGN.md`: Monospace 서체, 1px Hairline 보더, 웜크림/잉크 팔레트, 4px/0px 반경
  - 단일 진실 공급원: 100% `localStorage` 기반 영구 보존 (`hero_xxx`)
  - 모바일 퓨어 터치: 가상 조이스틱 금지, 원터치 탭/드래그, 44px+ 터치 타깃

### 4단계: 빌드 검증 (`npm run build`)
- `npm run build`를 실행하여 컴파일 오류 0건을 확인합니다.

### 5단계: Git 커밋 (원격 푸시 자동 실행 금지)
- 문서 및 소스코드 변경 사항을 명확한 메시지로 로컬 커밋만 수행합니다 (원격 푸시는 절대 자동 실행하지 않으며, `/git-push` 또는 명시 요청 시에만 실행):
  ```bash
  git add docs/screen_audits/ src/ AGENTS.md WORK_LOGS.md
  git commit -m "feat(rsi): [SCR-XX 화면명] 5대 핵심 지표 개선 및 분석 보고서 작성"
  ```

### 6단계: 구글 폼 제출 및 영구 로그 갱신
- 구글 폼 엔드포인트로 완료 보고를 전송합니다:
  ```bash
  python3 skills/report-ex/scripts/submit_report.py \
    --dept "개발" \
    --task "[/rsi] [SCR-XX 화면명] 기획/디자인/개발 전면 개선 완료" \
    --status "작업완료" \
    --details "[분석 내용, 구현된 개선사항 요약, npm run build 통과, md 문서 생성]"
  ```
- `WORK_LOGS.md` 및 `AGENTS.md`에 실행 기록을 최신화합니다.

### 7단계: 대화창 상세 보고
- 점검한 화면, 작성된 `docs/screen_audits/SCR_XX_[VIEW].md` 요약, 실제 코드에 개선한 내용, 빌드 검증 결과를 한국어로 명확히 보고합니다.

### 8단계: 1시간 주기 자동 스케줄 유지 및 등록
- `/rsi` 실행 시 `schedule` 도구를 통해 **1시간마다 1회(`0 * * * *`)** 자동으로 다음 순환 화면 점검이 트리거되도록 데몬 크론 스케줄(`IsDaemon: true`)을 등록 및 상시 유지합니다.
