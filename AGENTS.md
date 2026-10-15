# SNS히어로 에이전트 지침서 (AGENTS.md)

## 스프레드시트 개선 작업 진행 상태
- **현재 연동 스프레드시트 (공개 CSV)**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vRF82ZJBHIhPsTzzjGm8DFutzw6PtAwqT_iyEB3MG5yKvZrEs354rKHy7YIFIO2zgqKSuRbo62uNyX_/pub?gid=0&single=true&output=csv`
- **마지막 수정 완료 항목 ID**: `[306개 확장 과제 중 162개 완료 (53.0%)] Task [001] ~ [162] 전수 구현 및 빌드 검증 완료 (SCR-01-13~15 홈 클린뷰/위젯독/소원분수, SCR-02-13~15 물리리그/양손잡이/피니셔컷인, SCR-03-13~15 배치워커/스마트렌즈/홀로그램틸트/시너지트리, SCR-04-13~15 어댑티브스트리밍/카테고리캐러셀/스마트번들독/운명선택, SCR-05-13~15 머클트리/2.5x감정사/원핸드흥정/황금블라인드박스)`
- **최종 업데이트 일시**: 2026-09-20 18:45 (KST)

## RSI-SNSHero 바이브코딩 프롬프트 스프레드시트 진행 상태 (`/rsi-snshero`)
- **현재 연동 스프레드시트 (공개 CSV)**: `https://docs.google.com/spreadsheets/d/e/2PACX-1vRMzW-MBD2QmqWD2GZ4KVoKSzO0UdewPXt7Qvsx-z8hpjv3gnT35o4Kgkbxz6CNw4ABnioVkEywSVCv/pub?output=csv`
- **마지막 수정 완료 항목 ID**: `[RSI-001 ~ RSI-025 전수 구현 완료 (25/25개, 100.0%)]`
  - RSI-001: 첫 방문자 3초 SSR 전설 영웅 소환 및 15초 심연 보스전 '소울 버스트(Soul Burst)' 각성 모달 (`FirstVisitOverdriveModal.tsx`, `SoulBurstModal`)
  - RSI-002: 웹소설·뉴스룸 탐색 중 '필드 몬스터 조우 & 방랑 영웅 계약(WildHeroEncounterWidget)' 인카운터 및 24시간 용병 루프 (`WildCardEncounterWidget.tsx`, `WildHeroEncounterWidget`)
  - RSI-003: ?challenge= 결투장 URL 기반 무설치 즉시 대결(InstantDuelBattleModal) 및 양피지 문장(Crest) 전술 공유기 (`InstantChallengeBattleModal.tsx`, `InstantDuelBattleModal`, `challengeCanvasGenerator.ts`)
  - RSI-004: 110종 미니게임 마나/스태미나 연동 및 실시간 영웅 전술 지휘 HUD (맹공 돌격 / 결계 수호 / 비전 원소합일) (`TacticalCommandHUD.tsx`)
  - RSI-005: 모험가 길드의 매일 무료 10연속 영웅 소환 룬 의식(DailyGuildSummonModal) 및 퀘스트 완주 마이크로 퍼널 트래킹 (`DailyFreeGachaModal.tsx`, `DailyGuildSummonModal`)
  - RSI-006: 태초의 영웅 소환 시 룬 진동 촉각 피드백 및 운명의 재배열(운명의 룬 1회 리롤, FateRerollModal) (`FirstVisitOverdriveModal.tsx`, `FateRerollModal`)
  - RSI-007: 판타지 웹소설 챕터 완독 시 '고대 봉인 성물 발굴 및 에피소드 보스 레이드 진입로 해금(StoryArtifactUnsealModal)' (`SecretArtifactDecryptionModal.tsx`, `StoryArtifactUnsealModal`)
  - RSI-008: 길드 척살령/결투 패배 시 즉시 명예 회복 복수전(InstantRevengeDuelModal) 및 모험가 명예 엠블럼 공유 루프 (`InstantRevengeModal.tsx`, `InstantRevengeDuelModal`, Web Share API)
  - RSI-009: 영웅 5인 속성 공명 시너지 매트릭스(ElementalResonanceMatrix) 및 미니게임 고득점 영기(靈氣) 폭주 마력 각성 연출 (`TacticalSynergyMatrix.tsx`, `ElementalResonanceMatrix`)
  - RSI-010: 7일간의 왕국 원정 일지 출석 의식(SevenDayExpeditionModal) 및 길드 전서구(로컬 알림) 연동 (`SevenDayStreakModal.tsx`, `SevenDayExpeditionModal`, `localNotifications.ts`)
  - RSI-011: 초보 모험가 성향 맞춤형 직업군(맹렬한 기사 vs 원소 마도사 vs 은밀한 로그) 스타터 영웅 파티 3초 즉시 편성(AdventurerStarterPartyModal) (`PersonalizedStarterDeckModal.tsx`, `AdventurerStarterPartyModal`)
  - RSI-012: 영지 외곽 마물 출몰 긴급 퀘스트 기반 모험가 파티 원정 파견(GuildBountyExpeditionWidget) 및 방치형 전리품 루프 (`BreakingNewsExpeditionWidget.tsx`, `GuildBountyExpeditionWidget`)
  - RSI-013: 콜로세움 명예 투기장 결투 관전 및 승부 예측 응원 위젯(ColosseumSpectatorWidget)을 통한 관전자 유입 루프 (`SpectatorBettingWidget.tsx`, `ColosseumSpectatorWidget`)
  - RSI-014: 110종 미니게임 시련 달성 칭호 기반 영웅 고유 패시브 룬 각인 시스템(HeroRuneEngravingModal) (`TacticalPassivePerksModal.tsx`, `HeroRuneEngravingModal`, `perkSystem.ts`)
  - RSI-015: 30일 왕국 수호 영웅 배틀 패스 로드맵(KingdomHeroPassModal) 및 방랑 복귀 영웅 환영 2배 영기 부스터 연동 (`TacticalSeasonPassModal.tsx`, `KingdomHeroPassModal`, `seasonPassStore.ts`)
  - RSI-016: 제로-프릭션 모험가 면허증 자동 발급(GuestAdventurerLicenseModal) 및 3초 고속 심연 마수 약점 일격 연출 (`TacticalQuickStrikeModal.tsx`, `GuestAdventurerLicenseModal`)
  - RSI-017: 판타지 웹소설 본문 내 '고대 룬어 주석 해독기(AncientRuneAnnotation)' 및 소설 속 전설 영웅 직접 계약 연동 (`TacticalLoreAnnotation.tsx`, `AncientRuneAnnotation`, `loreRecruitmentStore.ts`)
  - RSI-018: 소설 속 명장면 재현 '전설의 라이벌 결투 챌린지(StoryRivalDuelModal)' 및 1클릭 모험가 도전장 생성기 (`StoryRivalDuelModal.tsx`, `storyDeckPresets.ts`)
  - RSI-019: 소설 속 비전 '성진호흡법(StarBreathing)' 연계 미니게임 마력 수련 및 3x3 전장 오의 개방 HUD(StarBreathingUltimateWidget) (`StarBreathingUltimateWidget.tsx`, `starBreathingStore.ts`)
  - RSI-020: 모험가 길드 의뢰 게시판(GuildBountyBoardModal) 일일 3대 의뢰 및 주간 네임드 보스 토벌 레이드 리텐션 루프 (`GuildBountyBoardModal.tsx`, `guildBountyStore.ts`)
  - RSI-021: 초회 3x3 배틀 '운명의 속성 역상성 파훼(ElementalCounterStrike)' 인터랙티브 튜토리얼 스킵 및 3초 캡처 승리 쾌감 연출 (`ElementalCounterStrikeTutorial.tsx`)
  - RSI-022: 소설 EP8 '적갈기의 기수' 연계 명마 길들이기 QTE 위젯 및 선공권 +1 영구 버프 (`CrimsonManeTamingWidget.tsx`, `mountSystemStore.ts`)
  - RSI-023: 모험가 명예의 전당 랭커 덱 1클릭 복제 시뮬레이션 및 바이럴 공유기 (`RankerDeckMirrorModal.tsx`, `rankerDeckStore.ts`)
  - RSI-024: 미니게임 보스 전리품 연계 3x3 전장 원소 폭풍(Elemental Tempest) 연쇄 스펠 위젯 (`ElementalTempestWidget.tsx`, `elementalTempestStore.ts`)
  - RSI-025: 모험가 길드 명예 칭호 계급장 승급 의식 및 주간 랭킹 정산 리텐션 퍼널 (`GuildRankPromotionModal.tsx`, `guildRankStore.ts`)
- **최종 업데이트 일시**: 2026-10-15 16:16 (KST)
- **다음 작업 안내**: 구글 스프레드시트에 신규 RSI 항목이 추가되면 RSI-026부터 즉시 순차 착수합니다.

### RSI-SNSHero 디자인 가이드 준수 및 사용자 경험(UX) 개선 절대 원칙
1. **DESIGN.md 터미널 플랫 미학 100% 준수**:
   - **서체 통일**: 모든 텍스트, 라벨, 수치, 버튼 캡션은 `font-mono`로 일관되게 렌더링 (비-모노스페이스 서체 금지).
   - **모서리 반경 2단계**: 모달/컨테이너/프레임은 반드시 `rounded-none` (0px), 버튼/인풋/배지는 최대 `rounded-sm` (4px). `rounded-lg/xl/2xl/full` 등 둥근 모서리 일체 사용 금지.
   - **단일 플랫 서피스**: 다색 그라데이션(`bg-gradient-to-...`), 네온 발광, 핑/바운스 애니메이션, 드롭 섀도우를 배제하고 웜크림(`bg-[#fdfcfc]`) 또는 잉크 다크(`bg-[#201d1d]`, `#090d16`) 단일 서피스와 1px hairline 보더(`border border-[#646262]/30`, `border-stone-800`, `border-white/10`)를 적용.
   - **표준 버튼 규격**: `button-primary` (배경 `#201d1d`, 텍스트 `#fdfcfc`, 1px hairline, 4px 모서리, 최소 높이 44px).
2. **사용자 경험(UX) 및 화면 미니멀리즘 절대 원칙 (Progressive Disclosure)**:
   - **플레이어 시야/조작부 침범 원천 차단 (Zero Intrusion)**: 플로팅 버튼이나 HUD가 배틀 보드, 3x3 슬롯, 카드 핸드, 미니게임 터치 조작부를 가로막지 않도록 라우트 격리 및 상시 `[—]` 최소화 접기 토글을 제공.
   - **연속 팝업 폭탄 방지 (스마트 디퍼링)**: 홈 화면 진입 시 여러 팝업이 연쇄적으로 연속 튀어나오지 않도록 세션/일일 우선순위 1개만 부드럽게 노출하고 나머지는 유예(defer).
   - **사용자 제어권 및 이탈 방지**: 모든 튜토리얼/모달에 최상위 레이어의 `[건너뛰기 (SKIP)]` 및 `[x]` 닫기 버튼을 상시 명확히 제공.
   - **모바일 원핸드 44px+ 터치 타깃**: 스마트폰 한 손 조작 편의를 위해 모든 터치 타깃을 최소 44px 이상으로 보장.

- **전수 일괄 완료 및 신규 항목 직행 원칙 (Complete All Remaining Tasks)**: `/gemini-ex` 또는 `/ge` 실행 시 현재 스프레드시트에 남아 있는 **모든 미완료 항목을 중간에 멈추지 않고 끝까지 전수 완료**합니다. 모든 항목 완료 후 이후 스프레드시트에 새로 추가되는 신규 항목이 발견되면, 마지막 완료 항목 바로 다음의 **신규 미작업 항목**부터 즉시 이어서 착수합니다.
- **무작업 시 침묵 원칙 (Silent if No-op)**: 크론 작업 실행 시 신규로 개선할 미작업 항목이 없으면 사용자에게 별도의 알림 메시지를 보내지 않고 조용히 대기합니다.

## 프로젝트 개요
- **이름**: SNS히어로 (SNSHero Revolution)
- **유형**: AI 기반 원클릭 웹 카드 배틀 게임
- **스택**: React 19 + Vite 6 + TypeScript 5.8 + Tailwind CSS 4.1
- **데이터 저장소**: 100% 로컬스토리지 (LocalStorage) 기반 영구 저장

## 게임 데이터 로컬스토리지 완전 기반 원칙
- **단일 진실 공급원 (Single Source of Truth)**: 인벤토리(카드 획득/보유/수량), 덱 구성, SNS 재화(구매/획득), 유저 전적 및 스탯, 아이템, 강화 레벨, 컴패니언 육성, 시즌 진행도 등 **모든 변경/수정/삭제/추가되는 게임 데이터는 오직 로컬스토리지(`localStorage`)를 기반으로 영구 보존**됩니다.
- **데이터 무결성 및 리셋 방지**: 원격 인증 상태 변경, 오프라인 전환, 페이지 새로고침 등에 의해 로컬스토리지에 저장된 카드/재화 데이터가 기본값으로 초기화되거나 유실되는 일이 절대 없어야 합니다.
- **즉시 동기화**: 상점 뽑기(단일팩, 10연차, 연속뽑기 등), 보상 수령, 덱 편집, 레벨업 등의 이벤트 발생 즉시 로컬스토리지에 동기적으로 기록합니다.

## 모든 작업 완료 시 구글 폼 제출 의무화 절대 원칙 (Mandatory Google Form Report Submission)
- **전수 작업 보고 의무화**: 기능 개발, 버그 수정, 성능 최적화, UI/UX 개선, 리팩토링, 스킬 실행 등 **에이전트가 수행하는 어떠한 작업이든 작업이 완료되면 예외 없이 반드시 연동된 구글 폼을 통해 작업 완료 보고서를 즉시 제출**해야 합니다.
- **연동 구글 폼 엔드포인트**: `https://docs.google.com/forms/d/e/1FAIpQLScrvcAqDF7vHHQndycr90ii-ujTi3Plw23eNrSyiJpOLrHbjg/formResponse`
- **반영 구글 스프레드시트**: `1nX6BFBJR4fTrv3PMqG8UamwSbqY2tJt_VvJoGAPItu8` (`/modoo` 모두의 상태 화면에서 실시간 45초마다 동기화)
- **제출 방법**:
  - **Python 스크립트 실행 (권장)**:
    ```bash
    python3 skills/report-ex/scripts/submit_report.py --dept "개발" --task "[작업명]" --status "작업완료" --details "[작업 상세 내용 및 검증 결과]"
    ```
  - **curl 실행**:
    ```bash
    curl -s -X POST "https://docs.google.com/forms/d/e/1FAIpQLScrvcAqDF7vHHQndycr90ii-ujTi3Plw23eNrSyiJpOLrHbjg/formResponse" \
      --data-urlencode "emailAddress=developer@snshero.com" \
      --data-urlencode "entry.1712635414=개발" \
      --data-urlencode "entry.1651694192=[작업명]" \
      --data-urlencode "entry.1282964596=작업완료" \
      --data-urlencode "entry.1982035501=[작업 상세 내용 및 검증 결과]"
    ```
- **누적 기록**: 작업 완료 후 `WORK_LOGS.md` 파일에도 실행 일시, 작업 내역, 검증 결과 및 구글 폼 제출 완료 여부를 누적 기록합니다.

## 등록된 커스텀 스킬 및 명령어
- **`/gemini-ex` (단축어: `/ge`)**: 공개 구글 스프레드시트 CSV(`2PACX-1vRF82ZJBHIhPsTzzjGm8DFutzw6PtAwqT_iyEB3MG5yKvZrEs354rKHy7YIFIO2zgqKSuRbo62uNyX_`)의 미작업 항목을 확인하고 소스코드에 반영 및 완료하는 스킬
- **`/ge`**: `/gemini-ex`의 축약어/단축 명령어로 동일한 작업 수행
- **`/report-ex`**: 구글 스프레드시트 (`1nX6BFBJR4fTrv3PMqG8UamwSbqY2tJt_VvJoGAPItu8`)의 작업대기 항목들을 작업하고 완료 시 구글폼으로 제출 보고하는 스킬
- **`/imp-mission`**: 3D 복셀 미션 게임들을 엄격한 기준으로 심사하여 모바일 적합도/재미/보상이 미달되는 게임을 즉시 폐기하고, 배틀/아케이드/퍼즐/캐주얼 등 다양한 장르의 고품질 신규 게임으로 새로 개발·대체하여 구글 폼으로 보고하는 스킬 (매 10분 주기 수행)
- **`/rsi`**: snshero.com 모바일 게임의 기획/디자인/개발을 전면 검토하고 12대 핵심 화면을 1회 1화면씩 순차 개선하며, 엑셀 대신 `docs/screen_audits/`에 신규 md 분석 문서를 생성하고 코드 구현/빌드/보고를 자동 수행하는 스킬 (매 1시간 주기 수행)
- **`/git-push`**: 모든 작업은 로컬 커밋(`git commit`)만 수행하며, 오직 사용자가 `/git-push`를 호출하거나 명시적으로 푸시를 요청할 때만 원격 저장소(`origin main`)로 푸시하는 스킬
- **`/start-server`**: 포트 3000에서 최신 프로덕션 정적 번들을 초고속으로 서빙(`vite preview`)하고, 소스 변경 시 백그라운드에서 실시간 자동 빌드 갱신(`watch-build`)을 수행하는 고속 프리뷰 및 라이브 워처 가동 스킬

## 110개 미션 게임 AI 카드 배틀 전면 통일 & 주사위/랜덤플레이 연동 완료
- **AI 카드 대결 통일**: 110개 미션 게임을 각 카드 전담 AI 카드게임 플레이로 100% 통일, 상대 AI 덱은 해당 카드 5장 동일 덱으로 자동 편성.
- **승리 보상**: 미보유 카드는 상점 획득 확률로 획득(`addCard`), 보유 카드는 45% 확률로 잠재력 강화(`addCard` 재료 추가 + `hero_card_enhancements` Lv+1).
- **소유 식별**: 보유 카드는 선명한 초록색 테두리(`border-emerald-500`) 및 `[보유: N장]` 뱃지 표시, 미보유 카드는 `[도전 목표]` 표시.
- **주사위 & 랜덤 플레이**: 110개 Poki 게임 풀은 주사위 롤러 및 홈 화면 신규 "랜덤 플레이" 버튼(`Dices` 아이콘)으로 연동.
- **현재 심사 정책**: 3D 복셀 게임(78종)의 비율을 줄이고, 모바일 적합도/조작성/재미/보상 미달 시 즉시 폐기 ➔ 배틀/아케이드/퍼즐/캐주얼 신규 게임 개발 대체
- **반드시 실제 개발 & 완료 원칙**: 폐기된 복셀 게임 슬롯에 **반드시 실제 플레이 가능한 고품질 신규 게임 코드를 즉시 100% 새로 개발하여 컴포넌트, `PlayGameView.tsx` 메뉴 메타데이터(제목/가이드/카테고리/보상명/검색 키워드)까지 완벽하게 연동하고 완료**합니다.
- **모바일 네이티브 퓨어 터치 절대 원칙**: 가상 조이스틱(Virtual Joystick), D-Pad, 복잡한 가상 방향키를 **완전히 배제**하고, 스마트폰 화면을 직접 터치/스와이프/드래그/탭하는 **100% 모바일 친화적 터치 제스처**로만 조작되도록 개발합니다.
- **마지막 심사 복셀 게임**: `VoxelZombieSurvivalGame.tsx` 및 110개 전체 미션 게임 ➔ 글로벌 Poki Top 110 전면 교체 완료!
- **Poki 110선 전면 전환 누적 건수**: 110건 / 110건 (100.0% 전수 전환 완료 달성!)
- **110개 전체 미션 게임 100% 순수 2D Canvas 전환 완료**: 110개 미션 게임 전수에서 Three.js 3D WebGL 의존성을 100% 완전 제거하고 HTML5 2D Canvas 및 모바일 퓨어 제스처 조작(터치/드래그/탭/스와이프/햅틱 진동)으로 전환 완료!
- **가상 키보드/D-패드/3D WebGL 100% 완전 퇴출 및 모바일 퓨어 제스처 전환 완료**: 스와이프, 터치, 드래그 등 스마트폰 최적화 퓨어 제스처 조작 및 `100dvh` 전체화면 무결점 100% 통일 완료!
- **표준 SNS 보상 및 로컬스토리지 영구 보존 완료**: `standardizedRewardGateway.ts` 및 `VictoryRewardModal` 기반 공정 보상 지급 및 `localStorage` 무결점 영구 보존 완료!
- **목표**: 110개 전체 미션 게임 2D 모드 전환 및 모바일 터치 최적화 100% 전수 완수!


## 모바일 전체화면 무결점 및 100% 터치 편의성 절대 원칙 (전체 게임 필수 적용)
1. **모바일 전체화면 왜곡/깨짐 0% 원칙**:
   - 모든 게임 컴포넌트의 루트 컨테이너는 반드시 `fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none`를 적용하여 모바일 브라우저의 주소창/바운스 스크롤을 원천 차단합니다.
   - Three.js 캔버스 뷰포트는 `absolute inset-0 w-full h-full`로 배치합니다.
   - `ResizeObserver`와 `orientationchange` 리스너를 필수로 등록하여 스마트폰 화면 회전 및 브라우저 주소창 변화 시 카메라 종횡비(`camera.aspect = w / h`)와 `renderer.setSize(w, h, false)`를 실시간 오차 없이 자동 동기화합니다.
2. **100% 모바일 퓨어 터치 편의성 표준**:
   - 가상 D-패드나 복잡한 가상 방향키를 절대 사용하지 않습니다.
   - 360° 이동/탐색 게임: 터치 지점에 부드럽게 나타나는 **다이나믹 플로팅 가상 조이스틱 (Floating Touch Joystick Ring & Knob)** 시각 피드백을 기본 제공합니다.
   - 러너/오비 게임: 좌측 영역 터치 슬라이드 조향 + 우측 대형 점프/부스트 버튼 (64px~80px 이상) 또는 원터치 제스처를 제공합니다.
   - 주요 액션 버튼(점프, 페인트, 정지, 공격 등)은 엄지손가락 터치에 최적화된 64px 이상의 명확한 터치 타깃과 햅틱(`navigator.vibrate`) 피드백을 제공합니다.
3. **카메라 시점 기준 조작 방향(좌우/상하) 100% 일치 절대 원칙**:
   - Three.js 카메라는 기본 정면이 `-Z`이므로, 카메라가 `+Z`를 바라볼 경우 화면 기준 오른쪽은 `-X`, 화면 기준 왼쪽은 `+X`입니다.
   - 플레이어 키보드(A/D/방향키) 및 가상 조이스틱의 좌우 조향은 **반드시 사용자가 바라보는 화면 기준(Screen-relative)**으로 오른쪽 입력 시 화면 오른쪽으로, 왼쪽 입력 시 화면 왼쪽으로 이동하도록 일관되게 정렬합니다.
   - FPS/TPS 시점에서는 카메라의 전방(`Forward = (-sin, -cos)`) 및 우측(`Right = (cos, -sin)`) 벡터와 완벽하게 일치시켜 대각선/좌우 역전 현상을 원천 방지합니다.
4. **시작 지점 안전 안착 절대 원칙 (러너/오비 게임 필수)**:
   - 게임 시작 직후 플레이어가 발판 틈새로 낙하하여 허무하게 끝나는 일이 없도록, 모든 러너/오비 게임은 시작 지점에 **최소 15m 이상의 안전 광폭 스타트 플랫폼**을 배치하고 초기 플레이어 위치를 발판 중앙에 안전하게 안착시킵니다.

## 코딩 스타일 및 규칙
- **TypeScript**: `strict` 모드 준수. `any` 타입 지양. 필요시 `unknown` 후 타입 가드 사용.
- **스타일링**: Tailwind CSS 유틸리티 클래스만 사용. 직접 CSS 파일 수정 금지 (`src/index.css` 제외).
- **컴포넌트**: 함수형 컴포넌트 + Hooks만 사용. React Class 컴포넌트 작성 금지.
- **아이콘**: `lucide-react` 사용. SVG 하드코딩 지양.

## 상태 관리 규칙
- **App.tsx 과중 방지**: App.tsx는 이미 2000+ 라인이므로, 새로운 전역 상태는 반드시 **Context API** 또는 별도의 커스텀 훅으로 분리할 것.
- **localStorage 네이밍**: 모든 키는 `hero_xxx` 형식으로 작성. 시즌 데이터는 `hero_xxx_{season}` 형식 사용.

## 파일 구조 및 네이밍
- **Views**: 페이지 단위 컴포넌트는 `src/views/ViewName.tsx`에 배치.
- **Components**: 재사용 가능한 UI는 `src/components/ComponentName.tsx`에 배치.
- **Types**: 공통 타입은 `src/types.ts`에 정의. View/Component 전용 타입은 해당 파일 내 `interface`로 정의 가능.

## AI Studio 및 웹 샌드박스 환경 import-analysis 오류 방지 절대 원칙 (Fail-Safe Import & No SPOF)
- **배경 및 문제점**:
  - Google AI Studio, StackBlitz, CodeSandbox 등 웹 기반 샌드박스 환경에서는 파일 동기화 지연, 디렉토리 인덱스(`index.ts`) 자동 해석 미지원, 또는 가상 파일시스템 경로 탐색 이슈로 인해 `[plugin:vite:import-analysis] Failed to resolve import "./lib/xxx" from "src/App.tsx". Does the file exist?`와 같은 치명적 번들링 에러가 발생할 수 있습니다.
- **필수 준수 규칙**:
  1. **디렉토리 직접 import 금지 (Always Single-File Entrypoint)**:
     - `import ... from './lib/webMcp'`와 같이 폴더 경로만으로 import하지 마십시오.
     - 반드시 `src/lib/webMcp.ts`와 같이 루트에 명시적인 단일 진입점 파일을 두고 import하거나, `from './lib/webMcp/index'`처럼 명확한 파일 경로를 지정해야 합니다.
  2. **App.tsx 정적/동적 import 단일 장애점(SPOF) 원천 차단 (Glob 로더 필수)**:
     - `App.tsx`는 애플리케이션의 최상위 진입점이므로, 신규 뷰나 컴포넌트를 추가할 때 `import('./...')` 고정 경로 문자열을 직접 쓰면 Vite의 `import-analysis` AST 분석 단계에서 파일 누락 시 전체 앱이 다운(Fatal Error)됩니다.
     - 신규 뷰는 반드시 `safeLazy(loadViewSafely('ViewName'), 'ViewName')`를 사용하십시오 (`import.meta.glob('./views/*.tsx')` 기반).
     - 신규 컴포넌트는 반드시 `safeLazy(loadComponentSafely('ComponentName'), 'ComponentName')`를 사용하십시오 (`import.meta.glob('./components/*.tsx')` 기반).
     - 라이브러리 비동기 로딩 시에도 `lazyWebMcpGlob` 등 `import.meta.glob`을 통하여 파일 부재 시에도 번들러 에러 없이 안전하게 건너뛰도록(Graceful Degradation) 구성하십시오.
  3. **내장 기능 Fail-Safe Fallback 보장**:
     - 외부 도구나 보조 기능(WebMCP, GEO 메타데이터 등)은 모듈이 로드되지 않더라도 앱의 메인 배틀/홈/덱 기능이 100% 정상 작동하도록 try-catch 또는 no-op 더미 함수로 우아한 성능 저하를 구현하십시오.

## 작업 전/후 체크리스트
- [ ] `npm run lint` (tsc --noEmit) 통과 여부 확인
- [ ] `DESIGN.md` 디자인 가이드 준수 여부 (Monospace 서체, 웜크림/잉크 테마, 플랫 디자인, 1px 헤어라인, 4px/0px 반경, 44px+ 터치 타깃)
- [ ] 기존 코드 스타일(인덴트, 따옴표 등) 준수
- [ ] 새로운 localStorage 키 추가 시 `AGENTS.md`에 문서화
- [ ] **[필수] 작업 완료 후 연동 구글 폼 보고서 제출 완료 (`python3 skills/report-ex/scripts/submit_report.py --dept "개발" --task "[작업명]" --details "[내용]"`)**

## 중요 참고사항
- **저사양 모드(`lowSpecMode`)**: 애니메이션/효과 추가 시 `lowSpecMode`가 `true`일 때는 복잡한 애니메이션을 비활성화해야 함.
- **다국어(i18n)**: 사용자 노출 텍스트는 하드코딩하지 말고 `src/lib/i18n.ts`의 `t()` 함수를 사용. 최소한 한국어(ko)와 영어(en)를 제공.
- **시즌제 데이터**: 게임 데이터는 시즌별로 격리되어야 함. `getSeasonItem()` / `setSeasonItem()` 헬퍼 함수를 사용할 것.

## 금지 사항
- `alert()`, `confirm()`, `prompt()` 사용 금지. 대신 커스텀 팝업(`showCustomAlert`, `showCustomConfirm`) 사용.
- 외부 CDN에서 직접 스크립트 로드 금지. 모든 의존성은 `npm`으로 관리.
- `console.log` 남발 금지. 디버깅 후 불필요한 로그는 제거. (단, `testMode` 조건 내 로그는 허용)

## 매 30분 주기 미션 게임 테스트/개선 및 작업 종료 보고 정책
- **매 30분 주기 크론 작업(`*/30 * * * *`)**: 매시 정각(:00) 및 30분(:30)마다 미션게임(카드러시, 카드하이스트, 카드탭, 카드슬롯, 카드소서리, 카드플립, 카드슬라이드, 카드점퍼 등)을 순차적으로 선택하여 집중 테스트, 개선 및 구글 폼 보고를 수행합니다.
- **미니게임 점검 및 개선 기준**:
  1. **모바일 원핸드 플레이**: 상하스크롤 없이 한손으로 100% 간단하게 플레이 가능한지 (`100dvh`, overflow 방지, 모바일 가상 D-패드/터치 버튼 제공).
  2. **난이도 및 재미**: 난이도 곡선이 적절하고 직관적인 재미와 성취감이 제공되는지.
  3. **보상 형평성**: 타 게임 대비 합리적이고 균형 잡힌 SNS 포인트 보상 구조 (10~60 SNS 수준)를 갖추었는지.
  4. **모바일 UI 무결성**: 모바일 화면에서 모든 UI가 잘림 없이 표시되고 터치 영역이 44px 이상으로 쾌적하게 동작하는지.
  5. **디자인 가이드 준수**: [DESIGN.md](file:///Users/dayyoung/project/snshero/DESIGN.md) 기준 준수 여부 (Monospace 서체, 웜크림/잉크 팔레트, 그림자/그라데이션 지양, 1px hairline 보더, 인터랙티브 4px/컨테이너 0px 모서리 반경, 대괄호/ASCII 마커 활용).
- **Git 커밋 및 푸시 정책**: 파일이 변경될 때마다 로컬 Git 커밋(`git commit`)만 즉시 수행합니다. **원격 저장소 푸시(`git push`)는 절대 자동으로 실행하지 않습니다.** 오직 사용자가 `/git-push` 명령을 입력하거나 명시적으로 푸시를 요청할 때만 `git push`를 실행합니다.
- 커밋 메시지는 변경 사항을 명확하게 설명해야 합니다.
- 모든 작업이 종료되면 검증 완료된 구글 폼 엔드포인트(`https://docs.google.com/forms/d/e/1FAIpQLScrvcAqDF7vHHQndycr90ii-ujTi3Plw23eNrSyiJpOLrHbjg/formResponse`)로 결과를 즉시 보고합니다.
  - **단일 보고 (Python / curl)**:
    ```bash
    python3 skills/report-ex/scripts/submit_report.py --dept "개발" --task "[작업명]" --status "작업완료" --details "[작업 상세 내용 및 검증 결과]"
    ```
    또는
    ```bash
    curl -s -X POST "https://docs.google.com/forms/d/e/1FAIpQLScrvcAqDF7vHHQndycr90ii-ujTi3Plw23eNrSyiJpOLrHbjg/formResponse" \
      --data-urlencode "entry.1712635414=개발" \
      --data-urlencode "entry.1651694192=[작업명]" \
      --data-urlencode "entry.1282964596=작업완료" \
      --data-urlencode "entry.1982035501=[작업 상세 내용 및 검증 결과]"
    ```
  - **일괄 자동 보고 (Python 스크립트)**:
    ```bash
    python3 skills/report-ex/scripts/submit_report.py --sync-sheet
    ```
- 작업 완료 후 `WORK_LOGS.md` 파일에 실행 일시, 작업 내역, 검증 결과 및 구글 폼 제출 건수를 반드시 누적 기록하고 대화창에 보고합니다.

## 디자인 지침 및 화면 미니멀리즘 원칙 (Progressive Disclosure)
- UI의 일관성과 사용자 경험을 최우선으로 고려합니다.
- **첫 화면 단순화 및 버튼 과밀 해소 절대 원칙 (Minimal First View)**:
  - 기능이 지속적으로 추가됨에 따라 첫 화면에 무수한 버튼이 난립하는 버튼 과밀(Button Clutter) 현상을 원천 차단합니다.
  - **첫 화면은 3~4개의 핵심 상위 카테고리만 심플하게 표시**합니다 (예: `[🎮 게임 아레나]`, `[📚 미디어 라운지]`, `[💼 마켓/경제]`).
  - 세부 기능 및 하위 옵션들은 **상위/하위 메뉴 구조, 아코디언 메뉴, 또는 팝업(모달 허브)**으로 정돈하여 2단계로 짜임새 있게 진입하도록 구성합니다.
  - `/rsi` 및 `/ge` 스킬 수행 시 새로운 기능/버튼을 추가할 때 첫 화면에 직접 평면 나열하지 않고, 반드시 해당 화면의 상위 카테고리 팝업 또는 아코디언 하위 메뉴 안에 깔끔하게 통합합니다.
- 프로젝트의 모든 화면 및 컴포넌트는 프로젝트 루트의 [DESIGN.md](file:///Users/dayyoung/project/snshero/DESIGN.md) (OpenCode.ai 모노스페이스 디자인 가이드: https://getdesign.md/opencode.ai/design-md)를 전적으로 준수해야 합니다.
  - **서체**: 모든 텍스트 역할에 Monospace 글꼴(JetBrains Mono, Courier New 등)을 100% 사용합니다.
  - **색상**: 웜 크림(Warm Cream) `#fdfcfc`를 기본 배경색(canvas)으로 삼고, 거의 검은색에 가까운 잉크색(Ink) `#201d1d`를 기본 글자색 및 주조색으로 사용합니다.
  - **스타일**: 그림자(shadow)와 그라데이션(gradient)을 배제한 플랫(flat) 디자인을 유지합니다. 구분선은 1px solid hairline (`rgba(15,0,0,0.12)`)을 사용합니다.
  - **모서리 반경**: 버튼, 입력창 등 인터랙티브 요소는 4px 반경(`rounded-sm`), 주요 섹션 및 컨테이너는 0px 반경(`rounded-none`)을 적용합니다.
  - **아이콘**: 일반 아이콘 대신 대괄호와 ASCII 마커(`[+]`, `[-]`, `[x]`, `+`, `−`)를 가급적 사용합니다.

## 다국어 지원 (i18n)
- 신규 텍스트 추가 또는 기존 텍스트 수정 시, 한국어(`ko`)와 기본 영어(`en`) 2개 언어팩만 우선 업데이트합니다.
- 나머지 언어/locale(`gb`, `ja`, `zh-CN`, `zh-TW`, `de`, `es`, `fr`, `id`, `ru`, `th`, `vi`)은 기본 영어팩(`en`)으로 fallback 표시되게 유지합니다.
- 정식 출시 단계에서 전체 언어팩 번역을 확장할 예정이므로, 현재 개발 단계에서는 전체 언어팩 일괄 갱신을 요구하지 않습니다.
- 번역 키 구조는 나중에 전체 언어팩 확장이 쉽도록 검색 가능하고 일관된 이름으로 작성합니다.

## 사용되는 LocalStorage 키 목록
- `hero_current_season`: 현재 활성 시즌 식별자 (기본값: 'season1')
- `hero_tutorial_context_{season}`: 홈 외 화면별 성장형 튜토리얼 진행 상태 저장 (완료 화면, 다시 보지 않기, 나중에 다시 보기 만료 시각)
- `hero_prediction_bets_{season}`: 예측시장(PredictionMarket) 뷰의 유저 스포츠 경기 베팅 내역 목록 데이터 (배팅 금액, 예측 결과 및 시뮬레이션 상태 저장)
- `hero_snshero_app_state_v1`: `app/` 하위 SNSHero 소셜 서비스 데모 상태 저장 (세션, 사용자, 게시물, 스토리, 좋아요, 저장, 댓글, 팔로우, DM, 알림, 언어/테마 설정)
- `hero_story_progress_{season}`: 홈 화면 시즌 스토리 진행도 저장 (완료한 에피소드 수, 0 이상의 정수)
- `hero_novel_prompt_mode_{season}`: 웹소설 회차 공통 프롬프트 모드 온/오프 설정
- `hero_webtoon_progress_{season}`: 웹툰 읽기 진행도 저장 (완료한 웹툰 에피소드 ID 배열 및 읽기 완료 시간)
- `hero_season_hub_{season}`: 시즌 허브 상태 저장 (수령한 보상 티어, 완료 미션 ID, 시즌 포인트, 관심 캐릭터 목록)
- `hero_season_missions_{season}`: 시즌 미션 상태 저장 (데일리/위클리/시즌 미션 진행도, 완료/수령 상태, 리셋 날짜)
- `hero_fan_event_votes_{season}`: 팬 이벤트 투표 상태 저장 (이벤트 ID별 선택한 옵션)
- `hero_sns_challenge_submissions_{season}`: 외부 SNS 챌린지 제출 상태 저장 (챌린지 ID별 제출 링크, 스크린샷 URL, 검토 상태)
- `hero_user_name`: 사용자 프로필 닉네임
- `hero_user_avatar`: 사용자 프로필 아바타
- `hero_user_guild_level`: 사용자 길드 레벨
- `hero_admin_authenticated`: 관리자 인증 상태 ('true' / null)
- `hero_game_logs`: 게임 로그 기록 (최근 전투 로그 배열)
- `hero_running_session_data`: 달리기 게임 세션 상태
- `hero_boss_active_state`: 보스 레이드 활성 상태
- `hero_boss_cooldowns`: 보스 레이드 쿨다운 시간
- `hero_defense_active_state`: 디펜스 게임 활성 상태
- `hero_dungeon_active_state`: 던전 활성 상태
- `hero_mode_play_data`: 모드별 플레이 데이터
- `hero_auto_battle_setting`: 자동 전투 설정 (true/false)
- `hero_auto_battle_speed`: 자동/전투 배속 설정 ('1x' / '2x' / '3x')
- `hero_match_history`: 매치 히스토리 (최근 전투 기록 배열)
- `hero_community_pvp_post_id`: 커뮤니티 PVP 포스트 ID
- `hero_pvp_battle_result`: PVP 전투 결과
- `hero_ranking_lang_filter`: 랭킹 언어 필터 설정
- `hero_push_token`: 푸시 알림 토큰
- `hero_boast_last_time`: 마지막 덱 자랑 시간 (timestamp)
- `hero_last_diligence_time`: 마지막 부지런의 나무 보상 수령 시간 (timestamp)
- `hero_steps_claimed_date`: 걸음 수 보상 수령 날짜
- `hero_today_claimed_steps`: 오늘 수령한 걸음 수 보상
- `hero_current_steps`: 현재 걸음 수
- `hero_sns_history`: SNS 포인트 변동 내역
- `hero_goods_pending_payment`: 굿즈 결제 대기 상태
- `hero_goods_pending_order`: 굿즈 주문 대기 상태
- `hero_goods_orders`: 굿즈 주문 내역
- `hero_refund_requests`: 달러 결제 굿즈 환불 신청 접수 상태 저장
- `hero_card_marketplace_state_{season}`: 카드 P2P 거래소 로컬 MVP 상태 저장 (판매 목록, 구매 요청, 에스크로/취소 로그, 카운터)
- `hero_market_first_trade_reward`: 첫 P2P 거래 웰컴 보너스 (+50 SNS) 수령 여부 저장
- `hero_stock_first_trade_reward`: 첫 주식 매수 거래 웰컴 캐시백 (+30 SNS) 수령 여부 저장
- `hero_gacha_pity_{season}`: 카드팩 천장 진행도 저장 (시즌/팩별 현재 횟수, 마지막 보장 시각)
- `hero_daily_free_summon_{todayDateKey}`: 당일 상점 1회 무료 브론즈 팩 소환 수령 여부 저장
- `hero_starter_pack_purchased_{season}`: 초심자 1회 한정 스타터 번들 팩 구매 여부 저장
- `hero_hero_growth_{season}`: 마이덱 다마고치형 히어로 돌봄 상태 저장 (카드별 포만감, 기분, 훈련, 휴식력, 친밀도, 마지막 상호작용, 유대 보상/기념 배지 상태)
- `hero_monster_pet_{season}`: 대표 카드별 몬스터 애완동료 설정 저장 (대표 카드 ID별 연결된 몬스터/드래곤 카드 ID 매핑)
- `hero_simulation_index`: 시뮬레이션 테스트 인덱스
- `hero_playground_deck`: 플레이그라운드 덱 저장
- `hero_cardsorcery_highscore`: 카드 소서리 최고 점수
- `hero_qr_reward_last_claim`: QR 보상 마지막 수령 시간
- `hero_ar_reward_last_claim`: AR 보상 마지막 수령 시간
- `hero_custom_card_image`: 커스텀 카드 이미지 데이터 (사용자 업로드 커스텀 이미지)
- `hero_card_skin_theme`: 기본 카드 비주얼 테마 설정 (`default` / `original_mecha`)
- `hero_card_skins_{season}`: 카드 스킨 상태 저장 (보유 스킨 키 목록, 카드별 적용 스킨 맵)
- `hero_guild_raid_{guildId}_{season}`: 길드 레이드 상태 저장 (보스 HP, 누적 데미지, 기여도, 보상 수령 상태)
- `hero_friends`: 친구 목록 저장 (친구 UID, 이름, 대전 횟수, 마지막 대전 시간)
- `hero_friend_battle_requests`: 친구 대전 요청/수락/완료 상태 저장
- `hero_web3_referrer`: 웹3 랜딩 페이지 유입 추적용 UTM/referrer 저장 키
- `hero_referral_code`: 친구 초대 화면의 내 리퍼럴 코드 저장
- `hero_referral_source`: 친구 초대 링크 유입 시 저장되는 referrer 코드
- `hero_referral_status`: 친구 초대 현황 mock 요약/목록 저장
- `hero_referral_pending_rewards`: 튜토리얼 완료 후 서버 검증 대기 중인 리퍼럴 보상 큐 저장
- `hero_kadan_rpg_progress_{season}`: 카단 & 아케인 에코즈 `/main` RPG 진행도 저장 (현재 챕터/지역, 완료 이벤트, 전투/상자/보상 상태, 마지막 위치, 환생 레벨)
- `hero_kadan_rpg_auto_mode_{season}`: 카단 RPG 자동 진행/자동전투 토글 상태 저장
- `hero_daily_missions_history`: 일일 미션 보상 완료 및 수령 히스토리 목록 저장 (획득 보상, 날짜, 시간)
- `hero_movie_progress_{season}`: 영화(Movie) 뷰 시청 진행도 저장 (현재 선택된 에피소드 번호)
- `hero_movie_claimed_episodes_{season}`: 영화(Movie) 회차별 시청 보상 수령 상태 저장
- `hero_movie_released_count_{season}`: 유튜브 플레이리스트 동적 파싱으로 확인된 공개 영화 회차 개수 저장
- `hero_app_version`: 클라이언트가 현재 인식 중인 최신 앱 버전 번호 (버전 불일치 시 캐시 초기화 트리거)
- `hero_build_version`: 빌드 타임스탬프 저장 키
- `hero_last_version_check`: 마지막 버전 확인 타임스탬프 (ms)
- `hero_boot_gate_shown`: 세션 내 시스템 시작 게이트/버전 동기화 화면 노출 여부
- `hero_tower_trials_floor_v1`: 시련의 탑 50층 무한 등반 최고 달성 층수 및 보상 상태 저장
- `hero_expedition_state_v1`: 8시간 오프라인 원정대 순찰 파티 및 수령 대기 데이터
- `hero_beastarium_pet_v1`: 비스티아리움 도감 수집 및 활성 동행 펫 상태
- `hero_tactician_aura_skin_v1`: 전술가 마스터리 레벨, 경험치 및 활성 전장 아우라 테마 설정
- `hero_battle_gambit_config_v1`: 자동 전투 AI 전술 지침 슬롯, 활성 스탠스 및 N/R 자동분해 설정 저장
- `hero_mastery_record_v1`: 개별 영웅별 승리 횟수, 총 출전 횟수, 골든 스킨 및 사령관 보이스 해금 상태 저장
- `hero_secret_stamps_v1`: 8종 비밀 업적 스탬프 달성 기록 저장
- `hero_secret_stamps_claimed`: 비밀 업적 보상 수령 여부 매핑 저장
- `hero_last_ai_battle_summary`: 직전 AI 전투 상세 사후 분석 데이터 (총 가한/받은 데미지, 카드별 기여도/MVP, 전술 보너스, 보상) 저장
- `hero_scroll_state_{season}_{tab}_ep{ep}`: 웹툰/웹소설 뷰어 회차별 마지막 스크롤 위치 및 진행률(%) 저장
- `hero_max_read_pct_{season}_ep{ep}`: 웹툰/웹소설 회차별 최대 도달 완독률(%) 저장
- `hero_token_economy_{season}`: 토큰 바이백 및 50회 소환 천장(Pity) 상태 저장 (50연차 확정 카운트, 누적 소각 SNS, 주간 상금 풀, 총 거래액/수수료)
- `hero_token_reward_pool_v1`: 마켓 거래 수수료 50% 환급 캐시백 금고 및 일일 활동 통합 SNS 마일리지 풀 상태 저장
- `hero_token_economy_state_v1`: 마켓 거래 수수료 50% 환원 풀 및 실시간 AP 자연 회복 상태 저장
- `hero_stamina_pacing_v1`: 전 플랫폼 AP 페이싱 상태 및 친구 하트 선물 일일 충전 기록 저장
- `hero_deck_upgrade_dismissed_{season}`: 마이덱 덱 최적화 추천 팝업 '카드 변경 시까지 다시 보지 않기' 상태 핑거프린트 저장
- `hero_pinned_signature_card_{season}`: 프로필 대표 시그니처 카드 핀 저장
- `hero_pinned_honor_badges_{season}`: 프로필 시즌 명예 배지 3개 핀 목록 저장
- `hero_first_win_claimed_{date}`: 랭크 대전 일일 첫 승 보너스(2x SNS & 골드팩) 수령 여부 저장
- `hero_guild_weekly_contribution`: 길드 주간 기여도 누적 점수 저장
- `hero_guild_contribution_claimed_tiers`: 길드 5단계 기여도 마일스톤 보상 수령 완료 티어 목록 저장
- `hero_rivalry_{friendUid}`: 친구 1:1 라이벌 상대 전적 히스토리(W/L/D) 저장
- `hero_element_essences`: 카드 분해 시 환급되는 4원소(화/수/지/풍) 에센스 보유량 저장
- `hero_afk_harvest_last_time`: 로비 24시간 오프라인 순찰 수확 상자 마지막 수령 타임스탬프 (ms)
- `hero_win_streak`: 랭킹/AI 전투 연속 승리 횟수 (연승 질주 불꽃 뱃지 연동)
- `hero_card_affection_{season}`: 카드별 다마고치 애정도, 일일 쓰다듬기 횟수 및 친밀도 MAX 플립 방어(+5%) 해금 상태 저장
- `hero_deck_preset_name_{num}_{season}`: 덱 프리셋 커스텀 명칭 (1, 2, 3)
- `hero_deck_preset_icon_{num}_{season}`: 덱 프리셋 커스텀 아이콘 (1, 2, 3)
- `hero_weekly_milestone_chest_{dateKey}`: 주간 마일스톤 골드 미믹 보물상자 개봉 수령 여부 저장
- `hero_comeback_claimed_{season}`: 3일 이상 미접속 복귀 유저 7일 연속 소급 보상 수령 상태 저장
- `hero_growth_pass_{season}`: 7일 영웅 성장 배틀패스 일차별 미션 완료 및 보상 수령 상태 저장
- `hero_winstreak_jackpot_count`: 배틀 아레나 연승 잭팟 룰렛 누적 횟수 저장
- `hero_winstreak_shield_tickets`: 배틀 아레나 연승 방어 쉴드 티켓 보유량 저장
- `hero_deck_power_claimed_{season}`: 마이덱 총 전투력 마일스톤 보상 수령 완료 티어 목록 저장
- `hero_flash_sale_seen_{dateKey}`: 상점 15분 한정 플래시 세일 일일 팝업 노출 여부 저장
- `hero_golden_deal_pass_active`: 마켓플레이스 골든 딜 알림 패스 활성화 상태 저장
- `hero_stock_tpsl_orders_{season}`: 가상 주식 거래소 1-Tap 익절/손절(TP/SL) 자동 감시 예약 설정 저장
- `hero_double_dividend_active`: 주식 거래소 주간 배당 2배 부스터(7일권) 활성화 상태 저장
- `hero_shareholder_votes_{season}`: 주주총회 안건별 찬반 투표 기록 및 보너스 수령 상태 저장
- `hero_pwa_install_reward_claimed`: PWA 앱 설치(홈 화면 추가) 보너스(+100 SNS) 수령 여부 저장
- `hero_push_notification_reward_claimed`: 웹푸시 알림 등록 보너스(+100 SNS) 수령 여부 저장
- `hero_pwa_event_modal_dismissed_at`: PWA/알림 이벤트 모달 24시간 오늘 하루 보지 않기 타임스탬프 저장

