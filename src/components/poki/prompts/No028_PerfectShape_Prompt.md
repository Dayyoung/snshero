# No.028 Perfect Shape 3D (퍼펙트 셰이프 3D) 리마스터 프롬프트

## 1. 개요 및 원작 분석
- **원작 게임**: [Poki - Perfect Shape](https://poki.com/kr/g/perfect-shape)
- **장르**: 3D 정밀 윤곽선 드로잉 스킬, 셰이프 조각 퍼즐
- **특징**: 3D 입체 캔버스 작업대 위에서 목표 형상(원, 삼각형, 정사각형, 별)의 네온 가이드라인에 맞춰 한 번의 매끄러운 터치 드로잉으로 완벽한 윤곽선을 그리고, 정밀한 실시간 오차율 분석을 통해 정확도(Accuracy %)를 평가받으며 3D 보석 조각품을 완성해내는 감각적인 스킬 퍼즐 게임.

## 2. 3D 그래픽 및 월드 구성 (Three.js)
1. **3D 아틀리에 캔버스 플랫폼 (Studio Canvas Workbench)**:
   - 20m x 20m 미니멀 스튜디오 룸 & 웜크림 원형 조각 플랫폼.
   - 4가지 목표 형상(원, 삼각형, 정사각형, 오각별)의 은은한 네온 가이드 와이어프레임.
   - 상단 No.028 공식 영웅 카드 스프라이트 HUD 배지 렌더링.
2. **실시간 3D 네온 리본 브러시 (Realtime 3D Neon Stroke)**:
   - 사용자가 손가락으로 드로잉할 때 3D 작업대 평면 상에 매끄럽게 연결되는 실시간 발광 네온 튜브 스트로크.
   - 브러시 끝을 따라 회전하는 스파크 파티클.
   - 드로잉 완료 시 목표 형상과의 거리 오차를 계산해 정확도 점수 산출(0~100%).
   - 80% 이상 고득점 시 황금빛으로 솟아오르는 3D 솔리드 크리스털 메쉬로 변환 & 50개 축하 콘페티 파티클 분출.
3. **4단계 정밀 셰이프 코스**:
   - Round 1: 퍼펙트 서클 (Perfect Circle)
   - Round 2: 정삼각형 (Equilateral Triangle)
   - Round 3: 정사각형 (Precise Square)
   - Round 4: 5각 황금별 (Golden Star)
   - 평균 정확도 75% 이상 달성 시 최종 조각 마스터 우승!

## 3. 모바일 편의성 및 100% 퓨어 터치 절대 원칙
1. **화면 왜곡 원천 차단**:
   - `fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none`
   - `ResizeObserver` 및 `orientationchange` 대응으로 100% 모바일 전체화면 유지.
2. **카메라 시점 일치 조작**:
   - 정면 탑다운 쿼터뷰 시점 (화면 가로 = X, 화면 세로 = Z).
   - 화면 터치 좌표와 3D 캔버스 평면 1:1 완벽 동기화.
3. **직관적인 모바일 퓨어 터치 UI**:
   - 화면을 누르고 부드럽게 이어 그리는 100% 모바일 친화적 원터치 드로잉.
   - 하단 좌측 [🔄 다시 그리기(Clear)] 버튼 완비.
   - 드로잉 중 햅틱 진동 및 완성 채점 시 경쾌한 햅틱 피드백.

## 4. 보상 및 데이터 영구 보존
- 4개 라운드 완료 및 평균 75% 이상 달성 시 `calculateAndDepositMissionReward('poki_perfect_shape', ...)` 통해 20~50 SNS 포인트 및 트로피 즉시 지급.
- `MinimalistMissionHUD` (중도 포기 시 달성 정확도 비례 안전 정산).
- `UniversalTutorialModal` (`iconType: 'GOAL' | 'GESTURES' | 'REWARDS'`).
- `VictoryRewardModal` 및 `localStorage` 기반 무결점 영구 보존.
