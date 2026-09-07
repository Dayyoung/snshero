# No.027 Master Chess 3D (마스터 체스 3D) 리마스터 프롬프트

## 1. 개요 및 원작 분석
- **원작 게임**: [Poki - Master Chess](https://poki.com/kr/g/master-chess)
- **장르**: 3D 클래식 체스 두뇌 전략 보드 게임
- **특징**: 고급스러운 대리석과 원목 재질의 3D 체스보드 위에서 기물(킹, 퀸, 룩, 비숍, 나이트, 폰)을 직접 터치하여 이동 가능 경로를 시각적으로 확인하고, 전략적인 수로 상대 기물을 포획하거나 체크메이트를 달성하는 전 세계인이 사랑하는 명작 전략 게임.

## 2. 3D 그래픽 및 월드 구성 (Three.js)
1. **아이소메트릭 쿼터뷰 3D 체스보드 (8x8 Marble Chessboard)**:
   - 8x8 입체 3D 그리드 타일 (화이트 마블 `#f1f5f9` vs 다크 슬레이트 우드 `#334155`).
   - 월넛 우드 베벨 외곽 프레임.
   - 선택된 타일: 부드러운 골든 앰버 하이라이트 발광.
   - 이동 가능 타일: 반투명 초록색 3D 인디케이터 링.
2. **정교한 3D 체스 기물 모델링 (Full 3D Pieces)**:
   - 폰(Pawn), 룩(Rook), 나이트(Knight), 비숍(Bishop), 퀸(Queen), 킹(King).
   - 플레이어(White): 상아색/골든 크림 메쉬 (`#fef3c7`).
   - 상대 AI(Black): 흑단목/다크 흑요석 메쉬 (`#0f172a`).
   - 백색 킹 상단 No.027 공식 영웅 카드 스프라이트 HUD 배지 렌더링.
   - 기물 선택 시 0.3m 공중 부양(Floating Lift) 및 이동 시 부드러운 아크 곡선 애니메이션.
   - 포획 시 3D 스파크 파티클 분출 및 기물 넉아웃 롤링.
3. **스마트 체스 AI 엔진**:
   - 미니맥스/휴리스틱 가치 평가(기물 가치: 퀸 9점, 룩 5점, 비숍/나이트 3점, 폰 1점).
   - 플레이어 턴 종료 후 1.0초 뒤 지능적으로 최선의 수를 찾아 이동.

## 3. 모바일 편의성 및 100% 퓨어 터치 절대 원칙
1. **화면 왜곡 원천 차단**:
   - `fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none`
   - `ResizeObserver` 및 `orientationchange` 대응으로 100% 모바일 전체화면 유지.
2. **카메라 시점 일치 조작**:
   - 화면 기준 백색 진영(하단)에서 흑색 진영(상단)을 바라보는 아이소메트릭 쿼터뷰 시점.
   - 터치 레이캐스팅(Raycaster)으로 정확한 타일/기물 터치 선택.
3. **직관적인 모바일 퓨어 터치 UI**:
   - 3D 기물 및 목적지 타일을 원터치로 편리하게 조작.
   - 하단 좌측 [↩ 한 수 물리기(Undo)] 및 [🔄 다시하기(Reset)] 버튼.
   - 기물 선택, 이동, 포획 시 손맛 넘치는 햅틱 진동(`navigator.vibrate`) 피드백.

## 4. 보상 및 데이터 영구 보존
- 상대 킹 포획 또는 5개 이상 기물 포획 시 `calculateAndDepositMissionReward('poki_master_chess', ...)` 통해 20~50 SNS 포인트 및 트로피 즉시 지급.
- `MinimalistMissionHUD` (중도 포기 시 포획 기물 점수 비례 안전 정산).
- `UniversalTutorialModal` (`iconType: 'GOAL' | 'GESTURES' | 'REWARDS'`).
- `VictoryRewardModal` 및 `localStorage` 기반 무결점 영구 보존.
