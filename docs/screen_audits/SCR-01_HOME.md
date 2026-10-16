# [SCR-01] 홈 & 메인 로비 전면 검토 및 개선 보고서

- **최종 검토 일시**: 2026-10-16 12:35 (KST)
- **대상 화면**: 홈 & 메인 로비 (Home & Main Lobby / `home`, `src/views/HomeView.tsx`, `src/components/HomeCategoryHub.tsx`)
- **주요 파일**: `src/views/HomeView.tsx`, `src/components/HomeCategoryHub.tsx`, `src/components/Meta.tsx`
- **핵심 목표**: `hero-tui-mockup` 터미널 플랫 미학 100% 준수, 3초 즉시 1:1 배틀 퀵 매치, 무설치 도전장 링크(`?challenge=1-11-31-51-101&ref=home`) 1탭 공유 및 일일 +50 SNS 보상, 동적 SEO/OG 메타 태그 완결

---

## 1. 6대 핵심 지표별 분석 결과 (Round 2: Professional Editorial Design & Growth)

### ① 프로페셔널 에디토리얼 디자인 (`DESIGN.md` 100% 준수)
- **현황 및 개선 내역**:
  - `HomeView.tsx`와 `HomeCategoryHub.tsx` 전 구간에서 레거시 다색 그라데이션, 둥근 모서리, 드롭 섀도우를 전수 배제하고 `DESIGN.md` 터미널 에디토리얼 규격(`font-mono`, `#fdfcfc` 웜크림 캔버스, `#201d1d` 잉크 다크, 1px hairline 보더 `border-[rgba(15,0,0,0.12)]`, 컨테이너 `rounded-none`, 인터랙티브 요소 `rounded-sm` & `min-h-[44px]`)으로 100% 정돈 유지.

### ② 사용자 유치 & 첫 3초 아하 모먼트 (User Acquisition & FTUE)
- **개선 내역**:
  - 홈 상단에 **`[3초 즉시 1:1 배틀 (QUICK MATCH)]`** 원터치 액션과 **`[무설치 도전장 링크 공유 (+50 SNS)]`** 배너를 전면 배치하여 첫 방문자가 3초 만에 첫 배틀을 경험하고 외부에 내 덱 도전장을 공유하도록 연결.
  - [`Meta.tsx`](file:///Users/dayyoung/project/snshero/src/components/Meta.tsx)를 통한 실시간 동적 SEO/GEO/OG 메타 태그 갱신으로 검색 및 소셜 공유 CTR 극대화.

### ③ 게임 판매율 & 과금 전환율 (Monetization & Conversion)
- **개선 내역**:
  - 상단 퀵 액션 바에 `[특가 상점 (/shop)]` 및 `[AI 벤치마크 (/bench)]` 에디토리얼 브릿지를 연계하여 무과금/소과금 유저의 가챠/BM 진입로 확보.

### ④ 모바일 퓨어 터치 사용성 (Mobile UX & Usability)
- **개선 내역**:
  - 카테고리 허브 4대 분류 체계(`Play`, `Economy`, `Story`, `System`) 및 점진적 공개(Progressive Disclosure)로 첫 화면 버튼 과밀 해소.

### ⑤ 성능 및 반응속도 (Performance & 60fps)
- **개선 내역**:
  - 가벼운 CSS 모노스페이스 렌더링 및 30초 비조작 시 데모플레이 자동 실행으로 이탈 방지.

### ⑥ 게임의 재미 & 도파민 (Dopamine & Core Loop)
- **개선 내역**:
  - 일일 도전장 공유 시 +50 SNS 즉시 지급(`hero_home_viral_share_${todayStr}`) 및 햅틱 피드백 제공.

---

## 2. 검증 결과
- [x] `npx tsc --noEmit && npm run build` 통과
- [x] 100% `localStorage` 영구 보존 (`hero_home_viral_share_*`, `hero_sns`)
- [x] `DESIGN.md` 준수: 100% `font-mono`, `#fdfcfc`/`#201d1d`, 1px hairline, `rounded-none`/`rounded-sm`, 44px+ 터치 타깃
