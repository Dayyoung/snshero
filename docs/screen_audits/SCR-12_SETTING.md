# [SCR-12] 설정, 데일리 미션 & 출석 보상 센터 전면 검토 및 개선 보고서

- **검토 일시**: 2026-09-17 06:10 (KST)
- **대상 화면**: 설정, 데일리 미션 & 출석 보상 센터 (Settings, Missions & Attendance / `setting`, `src/views/SettingView.tsx`, `src/components/DailyMissions.tsx`, `src/components/AttendanceStreakModal.tsx`)
- **주요 파일**: `src/views/SettingView.tsx`, `src/components/DailyMissions.tsx`, `src/components/AttendanceStreakModal.tsx`
- **핵심 목표**: 3대 통합 서브 탭(시스템/미션/출석), 일일 보상 요약 HUD, 7일 출석 스트릭 & 에너지 번 환급 마일스톤, DESIGN.md 플랫 정돈 & 100% 로컬스토리지 SSOT

---

## 1. 5대 핵심 지표별 분석 결과

### ① 사용자 유치 & 온보딩 (User Acquisition & FTUE)
- **현황 진단**: 
  - `SettingView`가 오디오, 언어, 테마, 저사양 모드 등 시스템 제어 기능에만 국한되어 있어, 유저가 매일 설정 탭을 방문해야 할 일일 접속 동기가 부족함.
  - 반면 `DailyMissions`와 `AttendanceStreakModal`은 각각 훌륭한 기능들을 보유하고 있으나 화면별로 분산되거나 모달로만 존재하여 설정 화면과의 유기적 연결이 부족함.
- **문제점 및 개선 기회**: 
  - 상단에 **`[🎯 일일 보상 요약 HUD]`** (오늘 출석 여부, 수령 대기 중인 일일 미션 수, AP 환급 마일스톤)가 노출되면 유저의 당일 일과 달성률이 극대화됨.
  - 상단 3대 서브 탭을 구축하여 한 화면에서 시스템 설정, 일일 미션, 7일 출석을 원클릭으로 오갈 수 있게 개편 필요.
- **개선 방향**:
  - 상단에 **`[🎯 일일 보상 요약 HUD]`** 탑재 (출석 상태, 완료 미션 수, AP 번 현황).
  - 상단 3대 서브 탭바 구축:
    1. `[⚙️ 시스템 & 최적화]` (`system`)
    2. `[📋 일일 미션 센터]` (`missions`)
    3. `[📅 7일 출석 스트릭]` (`attendance`)

### ② 게임 판매율 & 과금 전환율 (Monetization & Conversion)
- **현황 진단**: 
  - 일일 미션과 출석 체크로 획득한 SNS 포인트가 상점 가챠나 카드 육성으로 이어지는 연결 동선이 단절되어 있음.
  - AP 소모량에 따른 캐시백(Stamina Burn & Rebate) 마일스톤이 설정 화면에서도 명확히 드러나야 과금/활동성이 증가함.
- **개선 방향**:
  - 출석 체크 및 미션 수령 완료 시 **`[🛒 상점 카드팩 소환 (획득 SNS 사용)]`** 숏컷 연동.
  - 에너지 번 환급 마일스톤(50/100/150 AP) 즉시 수령 및 SNS 캐시백 지급.

### ③ 모바일 퓨어 터치 사용성 (Mobile UX & Usability)
- **현황 진단**: 
  - `SettingView` 내 레거시 `rounded-lg`, `rounded-full` 곡률이 남아있어 프로젝트 표준인 `DESIGN.md` (Monospace 서체, 웜크림/잉크 팔레트, 1px solid hairline, 0px/4px 반경)와 일관되지 않음.
  - 모바일 터치 타깃이 44px 이상으로 엄지 친화적이어야 함.
- **개선 방향**:
  - 컨테이너 `rounded-none`, 버튼/입력 `rounded-none`/`rounded-sm`, 1px solid hairline (`border-slate-200` / `border-stone-300`) 전면 정돈.
  - 모든 탭 버튼 및 액션 버튼 44px+ 엄지 최적화 터치 타깃 준수.

### ④ 성능 및 반응속도 (Performance & 60fps)
- **현황 진단**: 
  - 저사양 60fps 최적화 모드, 배터리 절약 모드, 타깃 FPS 설정(30/60)이 `GameSettingsContext`에 이미 잘 마련되어 있음.
- **개선 방향**:
  - 3대 서브 탭 조건부 렌더링으로 불필요한 DOM 부하 최소화 및 탭 전환 레이턴시 0ms 달성.

### ⑤ 게임의 재미 & 도파민 (Dopamine & Core Loop)
- **현황 진단**: 
  - 7일 연속 출석 달성(1.0x~3.0x 보너스 및 7일차 대박 보상)과 일일 미션 올클리어 시 시각적/진동 쾌감이 필요함.
- **개선 방향**:
  - 출석 체크 및 미션 수령 시 `triggerHaptic('victory')` 및 `triggerHaptic('success')` 진동 피드백 적용.
  - 100% 로컬스토리지 SSOT (`hero_attendance_streak_v1`, `hero_daily_missions_*`, `hero_claimed_weekly_chests_v1`) 영구 보존.

---

## 2. 도출된 개선 작업 항목 (Action Items)

| No | 카테고리 | 부서 | 개선 과제명 | 문제점 | 구체적 해결책 | 예상 기대효과 | 구현 파일 |
|---|---|---|---|---|---|---|---|
| 1 | 사용자 유치 / FTUE | 기획/개발 | 🎯 일일 보상 요약 HUD & 3대 통합 서브 탭바 (시스템/미션/출석) 구축 | 설정 화면의 일일 방문 동기 부재 및 미션/출석과의 단절 | 상단 [일일 보상 요약 HUD: 출석/미션/AP현황] 및 3대 서브 탭([⚙️ 시스템], [📋 일일 미션], [📅 7일 출석]) 구축 | 일일 재방문율 35% 증대, 일일 보상 수령률 극대화 | `src/views/SettingView.tsx` |
| 2 | 모바일 퓨어 UX | 디자인/개발 | 📱 DESIGN.md 플랫 헤어라인 전면 정돈 & 44px+ 엄지 최적화 터치 타깃 | 레거시 rounded-lg/full 곡률 혼재 및 모바일 터치 타깃 미흡 | 컨테이너 rounded-none, 1px solid hairline 보더, 44px+ 터치 타깃 전면 적용 | 한손 모바일 조작 편의성 100% 달성, 시각적 일관성 확보 | `src/views/SettingView.tsx` |
| 3 | 과금전환 & 도파민 | 기획/개발 | 🏆 7일 출석 스트릭 & 에너지 번 환급 마일스톤 연동 + 햅틱 피드백 | 출석/미션 보상 후 상점 소비 동선 단절 및 인터랙션 피드백 부족 | 7일 연속 출석 패널 임베드, AP 번 환급 마일스톤 연동, 완수 시 상점 숏컷 및 triggerHaptic('victory') 연동 | 유저 활동성 및 가챠 과금 전환 30% 증대 | `src/views/SettingView.tsx` |

---

## 3. 프로덕션 소스코드 구현 내역
1. **`src/views/SettingView.tsx`**:
   - `DailyMissions` 컴포넌트 및 `loadDailyMissions`, `getClaimableCount` 연동
   - 3대 서브 탭 상태: `activeSubTab: 'system' | 'missions' | 'attendance'`
   - 상단 **`[🎯 일일 보상 요약 HUD]`**:
     - 오늘 출석 완료 여부 (`hero_attendance_streak_v1` 기반)
     - 수령 대기 중인 일일 미션 수 (`getClaimableCount()`)
     - 오늘 AP 소모 및 환급 마일스톤 현황
   - 탭 1 (`system`): 오디오, 주크박스, 햅틱, 테마, 저사양 60fps 모드, 캐시/버전 정리, 백업/복원
   - 탭 2 (`missions`): `DailyMissions` 인라인 임베드 (일일 퀘스트, 주간 보물상자, 1회 무료 교체)
   - 탭 3 (`attendance`): 7일 연속 출석 스트릭(Day 1~7), 1탭 오늘 출석 체크(+50~150 SNS), 월 1회 스트릭 세이버
   - 보상 수령 시 `triggerHaptic('victory')` 진동 및 상점 카드팩 소환 숏컷 연동
   - `DESIGN.md` 준수: Monospace 서체, 컨테이너 `rounded-none`, 1px solid hairline 보더, 44px+ 터치 타깃

---

## 4. 검증 결과
- [x] `npm run build` 오류 0건 통과 (`SettingView-Bc3zJ2vg-v1789592601018.js`, 10.54s)
- [x] 100% 로컬스토리지 영구 저장 무결점 유지 (`hero_attendance_streak_v1`, `hero_daily_missions_*`, `hero_stamina_pacing_*`)
- [x] 모바일 390x844 뷰포트 레이아웃 무결점 확인 (Playwright 실제 캡처 검증)
- [x] Git 커밋 및 구글 폼 보고 완료

### 실측 검증 스크린샷 4종
1. **스크린샷 1 (시스템 설정 & 일일 보상 요약 HUD & 3대 서브 탭)**:
   - 파일: `scratch/scr12_01_system_and_hud.png`
   - 검증 내용: 상단 일일 보상 요약 HUD (7일 출석 스트릭 Day 4/7 상태, 일일 미션 진행 현황, AP 에너지 소모율 게이지) 및 3대 서브 탭바 (`[시스템 설정]`, `[일일 미션]`, `[7일 출석]`) 정상 렌더링 확인.
2. **스크린샷 2 (일일 미션 센터 탭)**:
   - 파일: `scratch/scr12_02_daily_missions_tab.png`
   - 검증 내용: 일일 미션 서브 탭 클릭 시 `<DailyMissions />` 인라인 렌더링, `[오늘의 미션]`, `[수행 기록]` 탭 정상 작동 확인.
3. **스크린샷 3 (7일 출석 스트릭 탭)**:
   - 파일: `scratch/scr12_03_attendance_streak_tab.png`
   - 검증 내용: 7일 출석 서브 탭 클릭 시 노란 알림 점 표시 및 스트릭 헤더 연동 확인.
4. **스크린샷 4 (7일 출석 카드 그리드 & 1탭 출석 체크 & 상점 가챠 연동)**:
   - 파일: `scratch/scr12_04_attendance_cards_and_shop.png`
   - 검증 내용: Day 1~7 출석 카드 그리드 (Day 1~3 `[✓ 완]`, Day 4 `[오늘]`), 승수 배지 (1.5x), 1탭 대형 출석 버튼 (44px+), 상점 가챠 바로가기 배너 및 로컬스토리지 SSOT 안내 완벽 확인.
