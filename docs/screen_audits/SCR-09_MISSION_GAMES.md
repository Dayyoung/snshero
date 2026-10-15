# [SCR-09] 미션 게임 캔버스 아레나 (Poki 110선 & 110종 수호자 카드 대결) 전면 검토 및 Round 2 그로스 혁신 보고서

- **검토 일시**: 2026-10-16 08:55 (KST) — Round 2 사용자 유입(UA)·리텐션·과금전환(BM) 집중 혁신
- **대상 화면**: 미션 게임 캔버스 아레나 (`mission_games`, `modeSelect`, `src/views/PlayGameView.tsx`, `src/components/MissionEncounterModal.tsx`, `src/components/Meta.tsx`)
- **주요 파일**: `src/views/PlayGameView.tsx`, `src/components/MissionEncounterModal.tsx`, `src/components/Meta.tsx`
- **핵심 목표**: 첫 3초 내 즉시 대결 진입(Activation), 도감 수집 진행도 HUD, 1탭 추천 공략 타깃, 바이럴 도전장 링크 공유(+50 SNS), 50% 특가 AP 물약 과금 전환, `DESIGN.md` 플랫 모노스페이스 100% 정돈

---

## 1. 5대 핵심 지표별 분석 결과 (Round 2 심층 진단)

### ① 사용자 유치 & 온보딩 (User Acquisition & FTUE)
- **현황 진단**:
  - 110종 캐릭터 카드가 각각 고유 수호자 5장 AI 덱과 매칭되어 승리 시 미보유 카드 획득 또는 잠재력 강화를 제공하는 핵심 수집 루프가 구축되어 있음.
  - 그러나 `modeSelect` 상단에서 도감 수집 진행도 HUD와 추천 타깃 배너가 누락되어 신규 유입 유저가 110개 카드 목록 앞에서 무엇을 먼저 눌러야 할지 망설이게 됨.
  - 또한 외부 검색(SEO) 및 소셜 공유 시 `Meta.tsx`가 `document.title`만 변경하고 `meta[name="description"]`, `og:title`, `og:description`, `link[rel="canonical"]`을 동적으로 갱신하지 않아 라우트별 공유/검색 최적화가 불완전했음.
- **개선 구현**:
  - 상단에 **`[CODEX HUD] 도감 수집율: {owned} / 110장 ({pct}%)`** 실시간 프로그레스 바와 **`[추천 타깃] No.XX {카드명} — [1초 즉시 공략]`** 1탭 직행 배너를 전면 배치하여 조우 모달 대기조차 없이 1초 만에 실전 배틀에 진입하도록 단축.
  - **`[도전장 링크 공유 (+50 SNS)]`** 1탭 바이럴 버튼을 상단에 신설하여 클릭 즉시 내 5장 대표 덱 도전장 URL(`https://snshero.com/?challenge=...`)을 클립보드에 복사하고 일일 +50 SNS 보상을 즉시 지급.
  - `src/components/Meta.tsx`를 업그레이드하여 모든 화면 전환 시 `description`, `canonical`, `og:*`, `twitter:*` 메타태그를 실시간 동기화.

### ② 게임 판매율 & 과금 전환율 (Monetization & Conversion)
- **현황 진단**:
  - 연속 대결 시 소모되는 모험 AP(`StaminaPacingManager`) 잔량과 보유 SNS 포인트가 상단에서 직관적으로 보이지 않고, AP 회복 물약 구매 동선이 상점 깊숙이 숨겨져 있음.
- **개선 구현**:
  - 상단 HUD 우측에 **`[모험 AP: {currentAp}/{maxAp}] | [보유 SNS: {snsBalance}]`**를 상시 노출.
  - 퀵 액션 바 중앙에 **`[AP 물약 +50 (25 SNS 특가)]`** 원터치 충전 버튼을 배치하여, SNS 보유 시 즉시 25 SNS를 차감해 +50 AP를 회복하고, SNS 부족 시 즉시 상점(`shop`)으로 연결하여 과금 및 재화 순환을 촉진.

### ③ 모바일 퓨어 터치 사용성 & 화면 단순화 (Mobile UX & DESIGN.md)
- **현황 진단**:
  - 카드를 탭했을 때 뜨는 `MissionEncounterModal.tsx`와 도움말 팝업(`showHelpPopup`)에 레거시 다크 네온 그림자(`shadow-[0_0_35px_...]`), 그라데이션 버튼(`bg-gradient-to-r from-amber-500...`), `rounded-3xl` 곡률이 남아있어 `DESIGN.md` 터미널 플랫 미학에 위배됨.
- **개선 구현**:
  - `MissionEncounterModal.tsx` 및 도움말 모달을 **100% `font-mono`, 웜크림(`#fdfcfc`) & 잉크(`#201d1d`), 1px solid hairline 보더, 컨테이너 `rounded-none`, 버튼 `rounded-sm`, 최소 높이 `44px`** 규격으로 전면 리팩토링.
  - `MissionEncounterModal` 상단 우측에 **`[건너뛰기 (SKIP)]`** 및 **`[X]`** 버튼을 명확히 배치하여 사용자 통제권 100% 보장.

### ④ 성능 및 반응속도 (Performance & 60fps)
- **현황 진단 & 개선**:
  - 불필요한 `backdrop-blur-md` 및 다중 드롭 섀도우를 제거하여 모바일 브라우저 합성 레이어(Compositing Layer) 부하를 낮추고 60fps 즉각적인 터치 반응성 확보.

### ⑤ 게임의 재미 & 도파민 (Dopamine & Core Loop)
- **현황 진단 & 개선**:
  - `[랜덤 1:1 즉시 대결]`, `[1초 즉시 공략]`, `[AP 물약 +50]`, `[도전장 링크 공유 (+50 SNS)]` 클릭 시 햅틱 진동(`triggerHaptic('light')`)과 사운드 피드백, 상단 피드백 배너(`missionBattleFeedback`)가 즉각 반응하여 수집과 전투의 몰입감 극대화.

---

## 2. 도출된 개선 작업 항목 (Action Items)

| No | 카테고리 | 부서 | 개선 과제명 | 문제점 | 구체적 해결책 | 예상 기대효과 | 구현 파일 |
|---|---|---|---|---|---|---|---|
| 1 | 사용자 유입 / 바이럴 | 기획/개발 | 도감 수집율 HUD & 1초 추천 타깃 직행 & 도전장 바이럴 공유(+50 SNS) | 110종 리스트 첫 진입 시 행동 유도 부족 및 외부 공유 훅 부재 | 상단 [CODEX HUD], [추천 타깃 1초 즉시 공략], [도전장 링크 공유 (+50 SNS)] 및 `Meta.tsx` 동적 OG/Canonical 태그 구현 | 첫 배틀 진입률 +45%, 친구 초대 바이럴(K-Factor) 및 검색 CTR 상승 | `src/views/PlayGameView.tsx`, `src/components/Meta.tsx` |
| 2 | 모바일 UX / DESIGN.md | 디자인/개발 | `MissionEncounterModal` & 도움말 팝업 DESIGN.md 플랫 모노스페이스 전면 정돈 | 레거시 그라데이션, 네온 섀도우, `rounded-3xl` 곡률 혼재 | `font-mono`, `#fdfcfc`/`#201d1d`, `rounded-none` 컨테이너, `rounded-sm` 44px+ 버튼, 상단 `[건너뛰기 (SKIP)]` 적용 | 시각적 일관성 100% 달성 및 모바일 원핸드 조작성 향상 | `src/components/MissionEncounterModal.tsx`, `src/views/PlayGameView.tsx` |
| 3 | 과금전환 / 리텐션 | 기획/개발 | 실시간 모험 AP / SNS 표시 및 50% 특가 AP 물약(+50 AP) 1탭 충전 브릿지 | AP 상태 인지 및 상점 소비 동선 단절 | 상단에 실시간 AP/SNS 노출 및 [AP 물약 +50 (25 SNS 특가)] 1탭 회복(부족 시 상점 이동) 구현 | SNS 재화 소진율 및 상점 방문/결제 전환율 +35% 증대 | `src/views/PlayGameView.tsx` |

---

## 3. 프로덕션 소스코드 구현 내역
1. **`src/components/Meta.tsx`**:
   - 라우트 및 언어 변경 시 `document.title`뿐만 아니라 `meta[name="description"]`, `link[rel="canonical"]`, `meta[property="og:title"]`, `meta[property="og:description"]`, `meta[property="og:url"]`, `meta[name="twitter:*"]`를 동적으로 생성·갱신하는 `upsertMetaTag`, `upsertCanonicalLink` 구현.
2. **`src/components/MissionEncounterModal.tsx`**:
   - 다색 그라데이션 및 네온 `shadow-[0_0_35px_...]` 제거, `DESIGN.md` 규격(`bg-[#fdfcfc]`, `border-[#201d1d]`, `rounded-none`, `font-mono`) 적용.
   - 상단 헤더에 `[건너뛰기 (SKIP)]` 버튼 추가 및 하단 액션 버튼 `min-h-[44px]` 보장.
3. **`src/views/PlayGameView.tsx`**:
   - `StaminaPacingManager` 실시간 연동 (`staminaState`) 및 바이럴 링크 복사 상태(`viralShareCopied`) 추가.
   - `modeSelect` 상단에 `[CODEX HUD]` 도감 수집율 게이지, `[추천 타깃]` 1초 즉시 공략 배너, 3대 원핸드 액션 바(`[랜덤 1:1 즉시 대결]`, `[AP 물약 +50 (25 SNS 특가)]`, `[도전장 링크 공유 (+50 SNS)]`) 구현.
   - 도움말 모달(`showHelpPopup`)을 `DESIGN.md` 플랫 모노스페이스 규격으로 리팩토링.

---

## 4. 검증 결과
- [x] `npx tsc --noEmit` 및 `npm run build` 오류 0건 통과
- [x] 100% 로컬스토리지 영구 저장 무결점 유지 (`hero_inventory`, `hero_sns`, `hero_stamina_pacing_v1`, `hero_mission_viral_share_*`)
- [x] `DESIGN.md` 준수: Monospace 서체, 웜크림/잉크 팔레트, 1px hairline 보더, 0px/4px 반경, 44px+ 터치 타깃
- [x] Git 커밋 및 구글 폼 보고 완료
