# [SCR-12] 설정 & 보상 센터 전면 검토 및 개선 보고서

- **최종 검토 일시**: 2026-10-16 12:35 (KST)
- **대상 화면**: 설정 & 보상 센터 (Settings & Reward Center / `setting`, `src/views/SettingView.tsx`)
- **주요 파일**: `src/views/SettingView.tsx`
- **핵심 목표**: `DESIGN.md` 플랫 모노스페이스 정돈, 무설치 1클릭 덱 도전장 링크(`?challenge=1-11-31-51-101&ref=setting`) 공유 및 일일 +50 SNS 보상, 7일 출석 스트릭 & AP 번 페이백, PWA/알림 리워드(+300 SNS) 허브 완성

---

## 1. 6대 핵심 지표별 분석 결과 (Round 2: Professional Editorial Design & Growth)

### ① 프로페셔널 에디토리얼 디자인 (`DESIGN.md` 100% 준수)
- **현황 및 개선 내역**:
  - `SettingView.tsx`의 루트 컨테이너 및 섹션을 `bg-slate-50/50 text-slate-800 font-sans`에서 **`min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono`**로 전면 전환.
  - 레거시 둥근 모서리(`rounded-lg`, `rounded-xl`, `rounded-full`)와 드롭 섀도우를 `rounded-none`(컨테이너) 및 `rounded-sm`(버튼/인풋) 44px+ 터치 타깃으로 통일.

### ② 사용자 유치 & 바이럴 K-Factor (User Acquisition & FTUE)
- **개선 내역**:
  - 상단에 **`[VIRAL SHARE] 친구 초대 & 덱 1:1 도전장 링크 공유`** 1탭 배너를 신설하여, 유저가 외부 메신저에 공유하고 일일 최초 공유 시 **+50 SNS 즉시 보상(`hero_setting_viral_share_{todayStr}`)**을 획득하도록 연결.
  - 공유 링크(`?challenge=1-11-31-51-101&ref=setting`)를 클릭한 친구가 회원가입 없이 즉시 대결을 펼치고 정착금을 받는 바이럴 루프 구축.

### ③ 게임 판매율 & 과금 전환율 (Monetization & Conversion)
- **개선 내역**:
  - PWA 홈 화면 추가 및 웹 푸시 알림 연동 시 즉시 +300 SNS 보상을 지급하는 리텐션 허브를 통해 유저 재방문율을 극대화하고 유료 상점/가챠 유입 촉진.

### ④ 모바일 퓨어 터치 사용성 (Mobile UX & Usability)
- **개선 내역**:
  - 일일 보상 요약 HUD(출석 스트릭, 미션 수령 대기, AP 번 캐시백)를 상단에 배치하고 `min-h-[44px]` 터치 규격으로 엄지 조작 편의성 보장.

### ⑤ 성능 및 반응속도 (Performance & 60fps)
- **개선 내역**:
  - 브라우저 리소스 캐시 정리(Purge Cache) 및 저사양 모드(`lowSpecMode`) 토글 최적화로 모바일 60fps 안정성 확보.

### ⑥ 게임의 재미 & 도파민 (Dopamine & Core Loop)
- **개선 내역**:
  - 7일 출석 연속 달성 시 점진적으로 증가하는 SNS 지급(50~150 SNS)과 햅틱 피드백으로 출석 체크 도파민 강화.

---

## 2. 검증 결과
- [x] `npx tsc --noEmit && npm run build` 통과
- [x] 100% `localStorage` 영구 보존 (`hero_setting_viral_share_*`, `hero_attendance_streak_v1`, `hero_sns`)
- [x] `DESIGN.md` 준수: 100% `font-mono`, `#fdfcfc`/`#201d1d`, 1px hairline, `rounded-none`/`rounded-sm`, 44px+ 터치 타깃
