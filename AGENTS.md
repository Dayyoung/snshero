# SNS히어로 에이전트 지침서 (AGENTS.md)

## 스프레드시트 개선 작업 진행 상태
- **마지막 수정 완료 항목 ID**: `[Row 606 / CSV Row 618] 3D 레이싱 썸존 조향 및 드리프트 릴리즈 퓨어 제스처 컨트롤러, 3단계 스포츠 온보딩 튜토리얼 모달, 상단 70% 시야 개방 1줄 미니멀 글래스 HUD 및 난이도별 확정 SNS 포인트 정산 팝업 전수 구현/검증 완료`
- **최종 업데이트 일시**: 2026-08-24 20:39 (KST)
- **신규 항목 직행 원칙**: `/gemini-ex` 실행 시 이미 완료된 이전 항목(Row 1 ~ 마지막 완료 Row)은 **처음부터 다시 점검하지 않고 즉시 스킵**하며, 마지막 완료 항목 바로 다음의 **신규 미작업 항목**부터 즉시 착수합니다.
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

## 등록된 커스텀 스킬 및 명령어
- **`/gemini-ex`**: 구글 스프레드시트 (`1gk9U2sMDRvlOCsbquqSMqrnLrRJWpoijz6uGdKjxk-s`)의 미작업 항목을 확인하고 소스코드에 반영 및 완료하는 스킬
- **`/report-ex`**: 구글 스프레드시트 (`1nX6BFBJR4fTrv3PMqG8UamwSbqY2tJt_VvJoGAPItu8`)의 작업대기 항목들을 작업하고 완료 시 구글폼으로 제출 보고하는 스킬
- **`/imp-mission`**: 3D 복셀 미션 게임들을 엄격한 기준으로 심사하여 모바일 적합도/재미/보상이 미달되는 게임을 즉시 폐기하고, 배틀/아케이드/퍼즐/캐주얼 등 다양한 장르의 고품질 신규 게임으로 새로 개발·대체하여 구글 폼으로 보고하는 스킬 (매 10분 주기 수행)

## imp-mission 3D 복셀 엄격 심사 & 신규 다장르 대체 개발 진행 상태
- **현재 심사 정책**: 3D 복셀 게임(78종)의 비율을 줄이고, 모바일 적합도/조작성/재미/보상 미달 시 즉시 폐기 ➔ 배틀/아케이드/퍼즐/캐주얼 신규 게임 개발 대체
- **반드시 실제 개발 & 완료 원칙**: 폐기된 복셀 게임 슬롯에 **반드시 실제 플레이 가능한 고품질 신규 게임 코드를 즉시 100% 새로 개발하여 컴포넌트, `PlayGameView.tsx` 메뉴 메타데이터(제목/가이드/카테고리/보상명/검색 키워드)까지 완벽하게 연동하고 완료**합니다.
- **모바일 네이티브 퓨어 터치 절대 원칙**: 가상 조이스틱(Virtual Joystick), D-Pad, 복잡한 가상 방향키를 **완전히 배제**하고, 스마트폰 화면을 직접 터치/스와이프/드래그/탭하는 **100% 모바일 친화적 터치 제스처**로만 조작되도록 개발합니다.
- **마지막 심사 복셀 게임**: `VoxelPirateBattlesGame.tsx` (블리츠 대해적 함포전: 3종 해적 함선 및 기함 영웅 배지 카드 스프라이트 전면 고도화, 100% 퓨어 원터치 함포 조준 & 브로드사이드 연동 완료)
- **폐기 및 신규 대체 누적 건수**: 78건 / 78건 (100% 전수 완료!)
- **110개 전체 미션 게임 카드 캐릭터(`cards1.png`, `cards2.png`) 스프라이트 전수 연동 완료**: 전체 110개 미션 게임(클래식 16종 + 블리츠 78종 + 모드 16종)에 `src/lib/canvasCardRenderer.ts` 및 `getCardSpriteStyle` 기반 공식 카드 캐릭터 스프라이트 렌더링 100% 전면 적용 및 검증 완료!
- **가상 키보드/D-패드 100% 완전 퇴출 및 모바일 퓨어 제스처 전환 완료**: 스네이크, 팩맨, 2048, 슬라이드 퍼즐, 카드러시, 카드하이스트 등 잔존 D-패드 버튼을 100% 전면 삭제하고 스와이프/원터치 제스처로 전환, 사과 지렁이 먹이/지렁이 헤드 카드 캐릭터 스프라이트화 완료!
- **목표**: 3D 복셀 게임 전수 심사 및 재미있고 완성도 높은 다양한 2D/아케이드/퍼즐/배틀 신규 게임 라인업 100% 확충 달성!

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

## 작업 전/후 체크리스트
- [ ] `npm run lint` (tsc --noEmit) 통과 여부 확인
- [ ] `DESIGN.md` 디자인 가이드 준수 여부 (Monospace 서체, 웜크림/잉크 테마, 플랫 디자인, 1px 헤어라인, 4px/0px 반경, 44px+ 터치 타깃)
- [ ] 기존 코드 스타일(인덴트, 따옴표 등) 준수
- [ ] 새로운 localStorage 키 추가 시 `AGENTS.md`에 문서화

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
- 파일이 변경될 때마다 즉시 커밋을 수행합니다.
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

## 디자인 지침
- UI의 일관성과 사용자 경험을 최우선으로 고려합니다.
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
- `hero_gacha_pity_{season}`: 카드팩 천장 진행도 저장 (시즌/팩별 현재 횟수, 마지막 보장 시각)
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
