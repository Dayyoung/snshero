# Dispatch: Explorer Survey 3

- Role: Explorer (Game Systems & Card Nurturing Specialist)
- Working Directory: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/
- Original Request: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md

## Mission
Investigate R4 (Core Screen Sections & Card Nurturing System Transition).
1. Home section: vertical scroll landing page contents (SnowHero intro, web novel, web game, anime, Naver Webtoon & Munpia links with "절찬 연재중").
2. My Deck section: clean view of current deck composition, Deck TP, Total TP.
3. Play section: streamlined player (Close, Prev, Next, Narration, TTS buttons only; webtoon image selection; TTS default OFF).
4. Card section (formerly Mission): rename to '카드', collection rate display, 110 card list.
5. Card Nurturing System:
   - Transition from card duel to card nurturing.
   - Nurture activity gives EXP -> level up to max Lv 100.
   - Leveling up grants stat points.
   - Red dot indicator on cards with unspent points.
   - Click card to allocate stat points (upgrade stats).
   - localStorage persistence schema for all nurturing data (EXP, level, stats).
   - Check existing card data structures in `src/cardDatabase.ts`, `src/types.ts`, existing `hero_*` localStorage keys.
6. Shop section: exactly 8 items (일반 카드팩, 매직 카드팩, 희귀 카드팩, 아이템 팩, 광고 제거, 공식 소설, 공식 동영상, 코인 충전).

Produce a comprehensive survey report at `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/survey_report.md` and deliver `handoff.md`.


## 2026-11-02T03:22:13Z
당신은 탐색 에이전트(teamwork_explorer)입니다.
작업 디렉토리: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/
원본 요구사항 파일: /Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md
작업 지침서: /Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/DISPATCH.md

반드시 ORIGINAL_REQUEST.md와 DISPATCH.md를 먼저 읽으십시오.
임무:
R4 (핵심 화면별 구성 및 카드 육성 시스템 전환)에 대해 코드베이스를 정밀 조사하십시오.
1. 홈 섹션: 상하 스크롤 형태 반응형 랜딩 페이지 콘텐츠 (눈히어로 소개, 웹소설, 웹게임, 애니메이션, 네이버웹툰/문피아 웹소설 링크 '절찬 연재중')
2. 마이덱 섹션: 현재 내 카드 구성, 덱 TP, 총 TP 심플 뷰 구성
3. 플레이 섹션: 불필요한 버튼 제거, [닫기, 이전, 다음, 나레이션, TTS] 버튼만 구성, 웹툰 이미지 선택, TTS 기본 비활성화(OFF) 로직
4. 카드 섹션 (구 미션):
   - 명칭 '카드' 변경, 카드 수집율 및 110개 카드 리스트 표시
   - 카드 육성 시스템: 기존 대결 대신 육성 활동 -> EXP 획득 및 100레벨까지 레벨업
   - 레벨업 시 스탯 포인트 획득, 포인트 보유 카드에 빨간 점 인디케이터 표시, 클릭하여 스탯 업그레이드
   - `localStorage` 영구 보존 스키마 (`src/cardDatabase.ts`, `src/types.ts` 등 기존 로컬스토리지 구조와의 호환성 조사)
5. 상점 섹션: 정확히 8개 항목(일반 카드팩, 매직 카드팩, 희귀 카드팩, 아이템 팩, 광고 제거, 공식 소설, 공식 동영상, 코인 충전) 노출 로직

조사 결과를 `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/survey_report.md`에 상세히 작성하고, Handoff Protocol에 따라 `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_survey_3/handoff.md`를 작성한 뒤 오케스트레이터에게 완료 보고 메시지를 보내십시오.
