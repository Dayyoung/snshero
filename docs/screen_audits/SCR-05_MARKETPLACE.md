# [SCR-05] 카드 P2P 마켓플레이스 전면 검토 및 개선 보고서 (Round 2)

- **최종 검토 일시**: 2026-10-16 12:35 (KST)
- **대상 화면**: 카드 P2P 마켓플레이스 (Card P2P Marketplace / `marketplace`, `src/views/CardMarketplaceView.tsx`)
- **주요 파일**: `src/views/CardMarketplaceView.tsx`, `src/components/MarketplaceSortBottomSheet.tsx`, `src/components/GoldenDealPassModal.tsx`
- **핵심 목표**: `DESIGN.md` 터미널 호가창 플랫 에디토리얼 정돈, 원터치 빠른 정렬 바텀시트, 실시간 급매물(Hot Bargain) 추천 및 첫 거래 웰컴 보조금(+50 SNS), 가스비 무료 혜택

---

## 1. 6대 핵심 지표별 분석 결과 (Round 2: Professional Editorial Design & Growth)

### ① 프로페셔널 에디토리얼 디자인 (`DESIGN.md` 100% 준수)
- **현황 및 개선 내역**:
  - `CardMarketplaceView.tsx` 전 구간에서 레거시 다색 그라데이션, 둥근 모서리, 드롭 섀도우를 전수 배제하고 `DESIGN.md` 규격(`font-mono`, `#fdfcfc` 웜크림 캔버스, `#201d1d` 잉크 다크, 1px hairline 보더 `border-[rgba(15,0,0,0.12)]`, 컨테이너 `rounded-none`, 인터랙티브 버튼 `rounded-sm` & `min-h-[44px]`)으로 정돈 완료.

### ② 사용자 유치 & 바이럴 K-Factor (User Acquisition & FTUE)
- **개선 내역**:
  - 첫 P2P 거래 체결 시 **"첫 거래 웰컴 보너스 +50 SNS"**(`hero_market_first_trade_reward`) 즉시 환급 및 상단에 오늘의 급매물 추천 배너를 상시 배치.

### ③ 게임 판매율 & 과금 전환율 (Monetization & Conversion)
- **개선 내역**:
  - 시세 15% 이하 급매물 등록 시 푸시 알림을 제공하는 1,900원 황금 특가 패스(`GoldenDealPassModal.tsx`) 및 SNS 부족 시 상점 충전 브릿지 완결.

### ④ 모바일 퓨어 터치 사용성 (Mobile UX & Usability)
- **개선 내역**:
  - `MarketplaceSortBottomSheet.tsx` 기반 44px+ 엄지 최적화 정렬 바텀시트로 오터치 없는 쾌적한 호가 탐색 보장.

### ⑤ 성능 및 반응속도 (Performance & 60fps)
- **개선 내역**:
  - 플랫 모노스페이스 렌더링으로 GPU 부하를 최소화하여 60fps 부드러운 스크롤 유지.

### ⑥ 게임의 재미 & 도파민 (Dopamine & Core Loop)
- **개선 내역**:
  - 매물 체결 시 햅틱 피드백(`triggerHaptic('victory')`)과 가스비 100% 면제 축하 연출로 트레이딩 재미 극대화.

---

## 2. 검증 결과
- [x] `npx tsc --noEmit && npm run build` 통과
- [x] 100% `localStorage` 영구 보존 (`hero_marketplace_items`, `hero_sns`)
- [x] `DESIGN.md` 준수: 100% `font-mono`, `#fdfcfc`/`#201d1d`, 1px hairline, `rounded-none`/`rounded-sm`, 44px+ 터치 타깃
