# [SCR-05] 카드 P2P 마켓플레이스 전면 검토 및 개선 보고서 (Round 2)

- **검토 일시**: 2026-09-17 13:00 (KST)
- **대상 화면**: 카드 P2P 마켓플레이스 (Card P2P Marketplace / `marketplace`)
- **주요 파일**: `src/views/CardMarketplaceView.tsx`, `src/components/MarketplaceSortBottomSheet.tsx`, `src/components/GoldenDealPassModal.tsx`
- **핵심 목표**: 모바일 원핸드 빠른 정렬 바텀시트(최저가/최고가/전투력/최신순), 1,900원 황금 특가 알림 구독 패스 인앱 모달, 44px+ 퓨어 터치 타깃 확보, 실시간 급매물(Hot Bargain) 추천 및 첫 거래 웰컴 보조금(+50 SNS) 연동

---

## 1. 5대 핵심 지표별 분석 결과

### ① 사용자 유치 & 온보딩 (User Acquisition & FTUE)
- **현황 진단**: 
  - 수많은 매물 카드 사이에서 신규 유저가 자신에게 꼭 필요한 최저가/고전투력 카드를 한눈에 찾기 어려운 문제.
  - P2P 거래소를 처음 이용하는 유저의 첫 거래 허들이 존재함.
- **문제점 및 개선 기회**: 
  - 첫 P2P 거래 성공 시 **"첫 거래 웰컴 보너스 +50 SNS"** 즉시 환급 이벤트 (`hero_market_first_trade_reward`) 연동.
  - 상단에 **[⚡ 오늘의 실시간 급매물 (Hot Bargain Deal)]** 배너를 유지하여 시세 대비 최대 25% 저렴한 카드를 1탭으로 추천.

### ② 게임 판매율 & 과금 전환율 (Monetization & Conversion)
- **현황 진단**: 
  - 인기 카드가 급매물로 등록되었을 때 알림을 받지 못해 놓치는 유저들의 아쉬움 발생.
- **문제점 및 개선 기회**: 
  - 시세 대비 15% 이상 저렴한 황금 특가 매물 등록 시 푸시 알림을 즉시 제공하는 **[🔔 황금 특가 알림 패스 (1,900원 / Golden Deal Pass)]** 인앱 결제 구독 모달(`GoldenDealPassModal.tsx`) 연동 및 로컬 영구 보존.

### ③ 모바일 퓨어 터치 사용성 (Mobile UX & Usability)
- **현황 진단**: 
  - 모바일(390x844) 화면에서 정렬 및 필터 변경을 위해 드롭다운을 조작할 때 터치 타깃이 작아 오터치 발생 위험.
- **문제점 및 개선 기회**: 
  - 한 손 엄지손가락으로 시원하게 선택 가능한 **`MarketplaceSortBottomSheet.tsx` (원터치 빠른 정렬 바텀시트)** 탑재.
  - 모든 퀵 액션 버튼(정렬, 특가 패스, 서브 탭)에 **44px 이상의 터치 타깃**과 햅틱 피드백(`triggerHaptic('light')`)을 100% 적용하여 모바일 퓨어 터치 완성도 극대화.

### ④ 성능 및 반응속도 (Performance & 60fps)
- **현황 진단**: 
  - 수십 개의 매물 카드 렌더링 시 SVG 스파크라인과 복잡한 CSS 그림자가 결합될 때 모바일 저사양 기기에서 스크롤 끊김 우려.
- **문제점 및 개선 기회**: 
  - `lowSpecMode` 가드를 적용하고 0px 컨테이너 반경, 플랫 디자인을 적용하여 GPU 오버헤드를 줄이고 60fps 무지연 스크롤 보장.

### ⑤ 게임의 재미 & 도파민 (Dopamine & Core Loop)
- **현황 진단**: 
  - 매물 구매 체결 시의 쾌감과 성취감 연출 강화 필요.
- **문제점 및 개선 기회**: 
  - 거래 성사 시 축하 골든 차임 사운드(`playSfx`)와 성공 햅틱(`triggerHaptic('victory')`)을 발동하고, **"🎉 P2P 거래 체결 성공! 가스비 100% 무료 환급!"** 배너를 즉시 노출하여 도파민 루프 완결.

---

## 2. 도출된 개선 작업 항목 (Action Items)

| No | 카테고리 | 부서 | 개선 과제명 | 문제점 | 구체적 해결책 | 예상 기대효과 | 구현 파일 |
|---|---|---|---|---|---|---|---|
| 1 | 모바일 UX | 디자인/개발 | 원핸드 빠른 정렬 바텀시트 (Marketplace Sort BottomSheet) | 드롭다운의 좁은 터치 영역과 스크롤 불편 | 44px+ 선택 행으로 구성된 빠른 정렬(최저가/최고가/전투력/최신) 바텀시트 연동 | 한 손 조작감 100% 달성 및 오터치 방지 | `src/components/MarketplaceSortBottomSheet.tsx`, `CardMarketplaceView.tsx` |
| 2 | 과금 전환율 | 기획/개발 | 1,900원 황금 특가 알림 구독 패스 (Golden Deal Pass) | 초특가 매물 조기 품절로 인한 유저 이탈 | 시세 15% 이하 급매물 실시간 감지 패스 인앱 모달 구축 | 소액 결제 전환율 및 마켓 체류율 증대 | `src/components/GoldenDealPassModal.tsx`, `CardMarketplaceView.tsx` |
| 3 | 모바일 디자인 | 디자인/개발 | 44px+ 터치 타깃 및 DESIGN.md 가이드 고도화 | 일부 버튼의 좁은 높이 및 디자인 불일치 | `min-h-[44px]` 규격화, 4px 모서리 반경(`rounded-sm`), 1px 헤어라인 적용 | 플랫 모노스페이스 일관성 및 조작 쾌적도 제고 | `src/views/CardMarketplaceView.tsx` |

---

## 3. 프로덕션 소스코드 구현 내역
1. **`MarketplaceSortBottomSheet.tsx`**:
   - 최신순, 최저가순, 최고가순, 전투력순 4대 정렬 옵션을 대형 모바일 바텀시트로 제공.
2. **`GoldenDealPassModal.tsx`**:
   - 1,900원 원터치 인앱 결제 모의 파이프라인 및 `hero_golden_deal_pass` 로컬 영구 보존.
3. **`CardMarketplaceView.tsx`**:
   - 정렬 상태(`marketSortOption`) 실시간 반영 및 44px+ 터치 타깃 규격화.
   - P2P 첫 거래 +50 SNS 보조금 및 100% 가스비 페이백 유지.

---

## 4. 검증 결과
- [x] `npm run build` 오류 0건 통과
- [x] 100% 로컬스토리지 영구 저장 무결점 유지
- [x] 모바일 390x844 뷰포트 레이아웃 무결점 확인
- [x] Git 커밋 및 구글 폼 보고 완료
