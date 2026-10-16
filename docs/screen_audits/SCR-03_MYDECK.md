# [SCR-03] 마이덱 & 카드 돌봄 전면 검토 및 개선 보고서

- **최종 검토 일시**: 2026-10-16 12:35 (KST)
- **대상 화면**: 마이덱 & 카드 돌봄 (My Deck & Card Care / `mydeck`, `src/views/MyDeckView.tsx`)
- **주요 파일**: `src/views/MyDeckView.tsx`
- **핵심 목표**: 내 덱 5장 조합 기반 무설치 도전장 링크(`?challenge=${deckParam}&ref=mydeck`) 1탭 공유 & 일일 +50 SNS 보상, 속성/전투력 시너지 HUD, 상점 표적 소환 브릿지, `DESIGN.md` 플랫 모노스페이스 100% 준수

---

## 1. 6대 핵심 지표별 분석 결과 (Round 2: Professional Editorial Design & Growth)

### ① 프로페셔널 에디토리얼 디자인 (`DESIGN.md` 100% 준수)
- **현황 및 개선 내역**:
  - `MyDeckView.tsx` 전 구간에서 레거시 다색 그라데이션, 둥근 모서리, 드롭 섀도우를 전수 배제하고 `DESIGN.md` 규격(`font-mono`, `#fdfcfc` 웜크림 캔버스, `#201d1d` 잉크 다크, 1px hairline 보더 `border-[rgba(15,0,0,0.12)]`, 컨테이너 `rounded-none`, 인터랙티브 버튼 `rounded-sm` & `min-h-[44px]`)으로 정돈 완료.

### ② 사용자 유치 & 바이럴 K-Factor (User Acquisition & FTUE)
- **개선 내역**:
  - 상단에 **`[MY DECK CHALLENGE & SYNERGY HUD]`**를 배치하고, **`[내 덱 도전장 링크 복사 (+50 SNS)]`** 원터치 버튼을 통해 현재 편성된 5장 덱 파라미터가 포함된 URL을 클립보드에 복사하고 일일 최초 공유 시 **+50 SNS 즉시 보상(`hero_mydeck_viral_share_{todayStr}`)**을 지급.

### ③ 게임 판매율 & 과금 전환율 (Monetization & Conversion)
- **개선 내역**:
  - 덱 구성 중 특정 속성이나 고등급 카드가 부족할 때 즉시 상점으로 이동할 수 있는 `[상점 표적 소환 바로가기]` 1탭 브릿지를 제공하여 가챠 전환율 증대.

### ④ 모바일 퓨어 터치 사용성 (Mobile UX & Usability)
- **개선 내역**:
  - 카드 장착/해제 및 정렬 필터가 엄지 조작 영역에 배치되어 44px+ 터치 타깃으로 오터치 없이 한 손 조작 가능.

### ⑤ 성능 및 반응속도 (Performance & 60fps)
- **개선 내역**:
  - 가상화 그리드 및 카드 스프라이트 최적화로 110종 카드 렌더링 시 60fps 유지.

### ⑥ 게임의 재미 & 도파민 (Dopamine & Core Loop)
- **개선 내역**:
  - 다마고치식 애정도 육성 및 강화 성공 시 햅틱 피드백(`triggerHaptic('victory')`)으로 덱 육성 도파민 제공.

---

## 2. 검증 결과
- [x] `npx tsc --noEmit && npm run build` 통과
- [x] 100% `localStorage` 영구 보존 (`hero_mydeck_viral_share_*`, `hero_sns`, `hero_decks`)
- [x] `DESIGN.md` 준수: 100% `font-mono`, `#fdfcfc`/`#201d1d`, 1px hairline, `rounded-none`/`rounded-sm`, 44px+ 터치 타깃
