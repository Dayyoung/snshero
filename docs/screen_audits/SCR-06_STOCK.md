# [SCR-06] 가상 주식 거래소 전면 검토 및 개선 보고서 (Round 2)

- **최종 검토 일시**: 2026-10-16 12:35 (KST)
- **대상 화면**: 가상 주식 거래소 (Hero Equity Stock Exchange / `stock`, `src/views/StockMarketView.tsx`)
- **주요 파일**: `src/views/StockMarketView.tsx`
- **핵심 목표**: `DESIGN.md` 금융 터미널 플랫 에디토리얼 정돈, 110종 영웅 지분 시세 차트, 1탭 배당금 복리 재투자 및 일일 포트폴리오 수익률 공유 루프

---

## 1. 6대 핵심 지표별 분석 결과 (Round 2: Professional Editorial Design & Growth)

### ① 프로페셔널 에디토리얼 디자인 (`DESIGN.md` 100% 준수)
- **현황 및 개선 내역**:
  - `StockMarketView.tsx` 전 구간에서 레거시 다색 그라데이션, 둥근 모서리, 드롭 섀도우를 전수 배제하고 `DESIGN.md` 규격(`font-mono`, `#fdfcfc` 웜크림 캔버스, `#201d1d` 잉크 다크, 1px hairline 보더 `border-[rgba(15,0,0,0.12)]`, 컨테이너 `rounded-none`, 인터랙티브 버튼 `rounded-sm` & `min-h-[44px]`)으로 정돈 완료.

### ② 사용자 유치 & 바이럴 K-Factor (User Acquisition & FTUE)
- **개선 내역**:
  - 내 포트폴리오 수익률 및 영웅 주가 급등 시 **`[포트폴리오 수익률 공유]`** 1탭 버튼을 통해 외부 커뮤니티에 인증할 수 있는 링크 복사 연동.

### ③ 게임 판매율 & 과금 전환율 (Monetization & Conversion)
- **개선 내역**:
  - 1탭 배당금 자동 재투자 및 추가 매수를 위한 상점 SNS 코인 충전 숏컷 연결.

### ④ 모바일 퓨어 터치 사용성 (Mobile UX & Usability)
- **개선 내역**:
  - 매수/매도 주문 호가창과 보유 주식 요약 카드를 `min-h-[44px]` 터치 규격으로 엄지손가락 한 손 조작 보장.

### ⑤ 성능 및 반응속도 (Performance & 60fps)
- **개선 내역**:
  - 경량 Canvas 스파크라인 차트로 110종 주식 시세 업데이트 시 60fps 유지.

### ⑥ 게임의 재미 & 도파민 (Dopamine & Core Loop)
- **개선 내역**:
  - 상한가 달성 및 배당금 수령 시 햅틱 피드백(`triggerHaptic('victory')`)으로 주식 트레이딩 도파민 제공.

---

## 2. 검증 결과
- [x] `npx tsc --noEmit && npm run build` 통과
- [x] 100% `localStorage` 영구 보존 (`hero_stock_portfolio`, `hero_sns`)
- [x] `DESIGN.md` 준수: 100% `font-mono`, `#fdfcfc`/`#201d1d`, 1px hairline, `rounded-none`/`rounded-sm`, 44px+ 터치 타깃
