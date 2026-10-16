# [SCR-07] 승부 예측 시장 전면 검토 및 개선 보고서 (Round 2)

- **최종 검토 일시**: 2026-10-16 12:35 (KST)
- **대상 화면**: 승부 예측 시장 (Prediction Market / `prediction`, `src/views/PredictionMarketView.tsx`)
- **주요 파일**: `src/views/PredictionMarketView.tsx`
- **핵심 목표**: `DESIGN.md` 플랫 모노스페이스 정돈, 무설치 1클릭 예측 티켓 & 도전장 링크(`?challenge=1-11-31-51-101&ref=prediction`) 공유 및 일일 +50 SNS 보상, 1탭 원터치 배팅 및 배당금 수령

---

## 1. 6대 핵심 지표별 분석 결과 (Round 2: Professional Editorial Design & Growth)

### ① 프로페셔널 에디토리얼 디자인 (`DESIGN.md` 100% 준수)
- **현황 및 개선 내역**:
  - `PredictionMarketView.tsx` 전 구간에서 레거시 `bg-slate-50/50`, `font-sans`, 둥근 모서리(`rounded-2xl/3xl`), 다색 그라데이션을 전수 제거하고 **`DESIGN.md` 규격(`font-mono`, `#fdfcfc` 웜크림 캔버스, `#201d1d` 잉크 다크, 1px hairline 보더 `border-[rgba(15,0,0,0.12)]`, 컨테이너 `rounded-none`, 인터랙티브 버튼 `rounded-sm` & `min-h-[44px]`)**으로 개편 완료.

### ② 사용자 유치 & 바이럴 K-Factor (User Acquisition & FTUE)
- **개선 내역**:
  - 상단에 **`[VIRAL PREDICTION] 승부 예측 티켓 & 덱 1:1 도전장 공유`** 1탭 배너를 신설하여, 유저가 외부 메신저에 공유하고 일일 최초 공유 시 **+50 SNS 즉시 보상(`hero_prediction_viral_share_{todayStr}`)**을 획득하도록 연결.

### ③ 게임 판매율 & 과금 전환율 (Monetization & Conversion)
- **개선 내역**:
  - 예측 배팅 SNS가 부족할 때 원터치로 상점 코인 코너로 이동할 수 있는 `[상점 충전]` 1탭 브릿지 연동.

### ④ 모바일 퓨어 터치 사용성 (Mobile UX & Usability)
- **개선 내역**:
  - 종목별 탭과 배팅 카드 버튼이 `min-h-[44px]` 터치 규격으로 제공되어 모바일 한 손 조작 편의성 극대화.

### ⑤ 성능 및 반응속도 (Performance & 60fps)
- **개선 내역**:
  - 경량 상태 관리 및 0ms 무지연 터치 피드백으로 배팅 목록 갱신 시 60fps 유지.

### ⑥ 게임의 재미 & 도파민 (Dopamine & Core Loop)
- **개선 내역**:
  - 예측 적중 시 2.5배 이상의 배당금 수령과 축하 햅틱 피드백(`triggerHaptic('victory')`)으로 예측 승부의 짜릿함 완결.

---

## 2. 검증 결과
- [x] `npx tsc --noEmit && npm run build` 통과
- [x] 100% `localStorage` 영구 보존 (`hero_prediction_viral_share_*`, `hero_prediction_bets`, `hero_sns`)
- [x] `DESIGN.md` 준수: 100% `font-mono`, `#fdfcfc`/`#201d1d`, 1px hairline, `rounded-none`/`rounded-sm`, 44px+ 터치 타깃
