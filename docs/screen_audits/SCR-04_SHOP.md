# [SCR-04] 상점 & 카드팩 가챠 전면 검토 및 개선 보고서

- **최종 검토 일시**: 2026-10-16 12:35 (KST)
- **대상 화면**: 상점 & 카드팩 가챠 (Shop & Gacha / `shop`, `src/views/ShopView.tsx`)
- **주요 파일**: `src/views/ShopView.tsx`
- **핵심 목표**: 30회 SSR 확정 천장(Pity) 가시성, 상점 일일 바이럴 공유(`hero_shop_viral_share`) 및 +50 SNS 보상, 패키지 카드 및 충전 모달 `DESIGN.md` 플랫 모노스페이스 100% 개편

---

## 1. 6대 핵심 지표별 분석 결과 (Round 2: Professional Editorial Design & Growth)

### ① 프로페셔널 에디토리얼 디자인 (`DESIGN.md` 100% 준수)
- **현황 및 개선 내역**:
  - `ShopView.tsx` 내의 구매 이력 모달(`ShowHistory`) 및 충전 성공 모달(`successVisible`)에서 레거시 `rounded-3xl`/`rounded-2xl`, `shadow-2xl`을 전수 제거하고 **`DESIGN.md` 터미널 플랫 에디토리얼 규격(`font-mono`, `#fdfcfc` 캔버스, `#201d1d` 잉크 다크, 1px hairline 보더, `rounded-none` 프레임, `rounded-sm` & `min-h-[44px]` 버튼)**으로 개편 완료.

### ② 사용자 유치 & 바이럴 K-Factor (User Acquisition & FTUE)
- **개선 내역**:
  - 상단에 **`[SSR PITY & DAILY FREE REWARD HUD]`** 배너를 배치하고, **`[일일 상점 공유 & 무료 보급 (+50 SNS)]`** 원터치 버튼을 제공하여 매일 외부에 `https://snshero.com/?shop_promo=ssr&challenge=1-11-31-51-101` 링크를 복사하고 일일 최초 공유 시 **+50 SNS 즉시 보상(`hero_shop_viral_share_{todayStr}`)**을 획득하도록 연결.

### ③ 게임 판매율 & 과금 전환율 (Monetization & Conversion)
- **개선 내역**:
  - 30회 SSR 확정 천장(Pity) 실시간 카운트다운 게이지를 상단에 명확히 노출하여 유료 10연차 가챠 및 소액 패키지 결제 전환율 극대화.

### ④ 모바일 퓨어 터치 사용성 (Mobile UX & Usability)
- **개선 내역**:
  - 패키지 구매 및 가챠 개봉 버튼이 `min-h-[44px]` 터치 규격으로 엄지손가락에 정확히 반응하도록 정돈.

### ⑤ 성능 및 반응속도 (Performance & 60fps)
- **개선 내역**:
  - 가챠 연출(GachaRevealSequence) 캔버스 최적화로 버벅임 없는 60fps 카드 개봉 쾌감 보장.

### ⑥ 게임의 재미 & 도파민 (Dopamine & Core Loop)
- **개선 내역**:
  - SSR 등급 카드 등장 시 황금 테두리와 햅틱 진동 피드백(`triggerHaptic('victory')`)으로 도파민 최고조 유도.

---

## 2. 검증 결과
- [x] `npx tsc --noEmit && npm run build` 통과
- [x] 100% `localStorage` 영구 보존 (`hero_shop_viral_share_*`, `hero_shop_pity_count`, `hero_sns`)
- [x] `DESIGN.md` 준수: 100% `font-mono`, `#fdfcfc`/`#201d1d`, 1px hairline, `rounded-none`/`rounded-sm`, 44px+ 터치 타깃
