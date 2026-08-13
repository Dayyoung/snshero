
# SNS히어로 에이전트 지침서 (AGENTS.md)

## 스프레드시트 개선 작업 진행 상태
- **마지막 수정 완료 항목 ID**: `Row 275 (구글 시트 1nX6BFBJR4fTrv3PMqG8UamwSbqY2tJt_VvJoGAPItu8 추가 작업대기 항목 확인, 소스코드 반영, 검증 및 구글폼 완료 보고 제출)`
- **최종 업데이트 일시**: 2026-08-13 13:10

## 프로젝트 개요
- **이름**: SNS히어로 (SNSHero Revolution)
- **유형**: AI 기반 원클릭 웹 카드 배틀 게임
- **스택**: React 19 + Vite 6 + TypeScript 5.8 + Tailwind CSS 4.1 + Firebase

## 등록된 커스텀 스킬 및 명령어
- **`/gemini-ex`**: 구글 스프레드시트 (`1gk9U2sMDRvlOCsbquqSMqrnLrRJWpoijz6uGdKjxk-s`)의 미작업 항목을 확인하고 소스코드에 반영 및 완료하는 스킬
- **`/report-ex`**: 구글 스프레드시트 (`1nX6BFBJR4fTrv3PMqG8UamwSbqY2tJt_VvJoGAPItu8`)의 작업대기 항목들을 작업하고 완료 시 구글폼으로 제출 보고하는 스킬

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

## 커밋 및 작업 종료 보고 정책
- 파일이 변경될 때마다 즉시 커밋을 수행합니다.
- 커밋 메시지는 변경 사항을 명확하게 설명해야 합니다.
- 모든 작업이 종료되면 전달받은 구글 폼 curl 명령어를 통해 수행 결과를 즉시 보고합니다.

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
- `firebase_db_mode`: Firebase DB 모드 설정 ('online' / 'offline')
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
