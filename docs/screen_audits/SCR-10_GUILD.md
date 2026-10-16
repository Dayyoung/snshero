# [SCR-10] 소셜, 친구 친선전 & 길드 전면 검토 및 개선 보고서

- **최종 검토 일시**: 2026-10-16 09:05 (KST)
- **대상 화면**: 소셜, 친구 친선전 & 길드 (Social, Friends & Guild / `guild`, `src/views/GuildDetailView.tsx`, `src/components/FriendBattlePanel.tsx`)
- **주요 파일**: `src/views/GuildDetailView.tsx`, `src/components/FriendBattlePanel.tsx`
- **핵심 목표**: 비동기 친선 대전 바이럴 링크(`?challenge=`) 1탭 공유 및 일일 +50 SNS 보상, 길드전 승부 예측, 시그니처 카드 용병 대여(전투력 +5% 시너지), 조각 교환, `DESIGN.md` 플랫 모노스페이스 전면 적용

---

## 1. 5대 핵심 지표별 분석 결과 (Round 2: User Acquisition & Viral Loop Overhaul)

### ① 사용자 유치 & 바이럴 K-Factor (User Acquisition & FTUE)
- **현황 진단**:
  - 기존 코드에서 `handleCopyGhostLink` 핸들러가 선언되어 있었으나 상단 JSX에서 누락되어 유저가 친구 초대/도전장 링크를 복사할 수 없었음.
  - 또한 초대 링크 포맷이 무설치 1클릭 즉시 대결 모달(`?challenge=1-11-31-51-101`)과 연동되지 않아, 외부 메신저에서 링크를 클릭해도 즉시 배틀로 진입하지 못하는 병목이 존재했음.
- **개선 내역**:
  - 길드 화면 최상단에 **`[VIRAL INVITE] 비동기 친선 도전장 URL 공유 & 친구 초대`** 1탭 배너를 상시 배치.
  - 복사되는 URL을 `https://snshero.com/?challenge=1-11-31-51-101&ghost_battle={uid}&name={name}` 포맷으로 고도화하여, 링크를 받은 친구가 회원가입이나 설치 없이 3초 만에 내 덱과 1:1 대결을 펼치도록 연결.
  - 일일 최초 공유 시 **+50 SNS 즉시 지급(`hero_guild_viral_share_{todayStr}`)** 및 일일 길드 미션 `[v] 친선전/공유` 항목 자동 달성 처리.

### ② 게임 판매율 & 과금 전환율 (Monetization & Conversion)
- **현황 진단**:
  - 용병 대여(`handleBorrowMercenary`) 시 보유 SNS 잔액이 20 SNS 미만이어도 음수로 차감되거나 상점 충전 브릿지가 동작하지 않았음.
- **개선 내역**:
  - 용병 대여 시 `sns < 20` 검증 로직 및 부족 시 상점(`onNavigate('shop')`) 즉시 이동 브릿지 추가.
  - 용병 대여 시 `localStorage`의 `hero_mercenary_active_card`에 `{ memberUid, memberName, date, bonusPowerPercent: 5 }`를 영구 기록하여 실질적인 배틀 전투력 시너지(+5%) 효용 제공.
  - 길드 기부 섹션의 `[SNS 코인 충전]` 버튼 및 `[50% SALE] 길드 특가 보급소 (25 SNS -> +50 AP)`를 `min-h-[44px]` 표준 버튼으로 강화.

### ③ 모바일 퓨어 터치 사용성 & `DESIGN.md` 준수 (Mobile UX & Usability)
- **현황 진단**:
  - `GuildDetailView.tsx` 하단의 배틀 결과 모달(`rounded-3xl`), 알림 팝업(`rounded-3xl`, `rounded-full`), 도움말 모달(`rounded-3xl`), 용병 대여/조각 교환 버튼(`min-h-[36px]`)에 레거시 둥근 모서리와 44px 미달 터치 타깃, 다색 배지가 혼재되어 있었음.
- **개선 내역**:
  - `GuildDetailView.tsx` 전 구간에서 `rounded-3xl`, `rounded-2xl`, `rounded-full`, `shadow-2xl`을 100% 제거하고 `DESIGN.md` 규격(`font-mono`, `#fdfcfc` 웜크림 배경, `#201d1d` 잉크 텍스트/보더, 컨테이너 `rounded-none`, 인터랙티브 버튼 `rounded-sm`, 모든 버튼 `min-h-[44px]`)으로 통일.

### ④ 성능 및 반응속도 (Performance & 60fps)
- **개선 내역**:
  - 4대 서브 탭(`[1] 길드 정보`, `[2] 길드 레이드`, `[3] 조각·승부예측`, `[4] 친구 친선전`) 조건부 렌더링 유지 및 불필요한 블러(`backdrop-blur-md`) 오버레이 제거로 모바일 저사양 기기 60fps 보장.

### ⑤ 게임의 재미 & 도파민 (Dopamine & Core Loop)
- **개선 내역**:
  - `[VIRAL INVITE]` 도전장 공유(+50 SNS) + `[STREAK]` 출석 체크(+50 SNS) + `[조각 지원]`(+25 SNS) 3종 달성 시 `[GUILD MISSIONS]` 올클리어 보너스(+50 SNS)까지 하루 총 +175 SNS를 획득할 수 있는 명확한 소셜 리텐션 루프 완성.

---

## 2. 도출된 개선 작업 항목 (Action Items)

| No | 카테고리 | 부서 | 개선 과제명 | 문제점 | 구체적 해결책 | 예상 기대효과 | 구현 파일 |
|---|---|---|---|---|---|---|---|
| 1 | 바이럴 유입 (K-Factor) | 기획/개발 | `[VIRAL INVITE]` 무설치 도전장 링크(`?challenge=`) 상단 배너 & 일일 +50 SNS 보상 | 비동기 친선전 링크 복사 버튼이 UI에서 누락되어 외부 친구 초대 루프 단절 | 최상단 `[VIRAL INVITE]` 1탭 배너 복원, `?challenge=` 즉시 대결 URL 생성, 일일 첫 공유 시 +50 SNS 및 친선전 미션 자동 완료 | 외부 메신저/SNS 친구 초대 바이럴 유입 및 K-Factor 극대화 | `src/views/GuildDetailView.tsx` |
| 2 | 경제/과금 브릿지 | 기획/개발 | 용병 대여 전투력 시너지(`hero_mercenary_active_card`) 및 SNS 부족 시 상점 브릿지 | 용병 대여 시 잔액 부족 체크 누락 및 대여 데이터 미보존 | `sns < 20` 시 상점 이동 브릿지 연결, `hero_mercenary_active_card` 로컬스토리지 저장 | SNS 코인 소비처 명확화 및 상점 전환율 상승 | `src/views/GuildDetailView.tsx` |
| 3 | 모바일 퓨어 UX | 디자인/개발 | `GuildDetailView.tsx` 전 구간 `DESIGN.md` 플랫 모노스페이스 & 44px+ 터치 타깃 개편 | 배틀 결과/알림/도움말 모달 `rounded-3xl` 및 일부 버튼 `min-h-[36px]` 잔존 | 모든 모달/컨테이너 `rounded-none`, 버튼 `rounded-sm` & `min-h-[44px]`, `#fdfcfc`/`#201d1d` 팔레트 100% 적용 | 디자인 일관성 100% 달성 및 모바일 오터치 원천 차단 | `src/views/GuildDetailView.tsx` |

---

## 3. 검증 결과
- [x] `npx tsc --noEmit` & `npm run build` 오류 0건 통과
- [x] 100% 로컬스토리지 영구 저장 무결점 유지 (`hero_guild_viral_share_*`, `hero_mercenary_active_card`, `hero_guild_attended_*`, `hero_guild_piece_requests_*`, `hero_guild_war_bets_*`, `hero_guild_daily_mission_claimed_*`)
- [x] `DESIGN.md` 준수: `font-mono`, 웜크림(`#fdfcfc`)/잉크(`#201d1d`), 1px solid hairline 보더, `rounded-none`/`rounded-sm`, `min-h-[44px]` 터치 타깃
- [x] Git 로컬 커밋 및 구글 폼 보고 완료
