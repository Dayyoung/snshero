# No.026 Subway Surfers 3D (서브웨이 서퍼스 3D) 리마스터 프롬프트

## 1. 개요 및 원작 분석
- **원작 게임**: [Poki - Subway Surfers](https://poki.com/kr/g/subway-surfers)
- **장르**: 3D 엔드리스 3레인 지하철 러너, 글로벌 No.1 러닝 액션
- **특징**: 경비원과 사나운 개의 추격을 피해 지하철 기찻길을 질주하며 마주 달려오는 전동차(Train), 공사 바리케이드(점프 회피), 고가 표지판(구르기 슬라이딩 회피)을 번개 같은 반사신경으로 피하고 황금 코인과 자석 파워업을 수집하는 스릴 만점의 전설적인 3D 러너.

## 2. 3D 그래픽 및 월드 구성 (Three.js)
1. **무한 루핑 3레인 철길 트랙 (Endless Subway Railway)**:
   - 3개 레인: Left (X: -2.2m), Center (X: 0m), Right (X: +2.2m).
   - 자갈 바닥(Ballast), 나무 침목(Sleepers), 은빛 강철 레일(Steel Rails).
   - 양쪽 지하철 터널 벽면 및 상단 전차선 기둥.
   - **시작 지점 안전 안착 원칙**: 시작 25m 구간(Z: 0 ~ -25m)은 장애물이 없는 완전 안전 트랙으로 스폰 즉시 급사 원천 차단.
2. **3D 지하철 열차 & 장애물 시스템**:
   - **지하철 전동차 (Subway Trains)**: 9m 길이의 실버 메탈릭 차체 + 헤드라이트 전동차 메쉬.
   - **낮은 바리케이드 (Low Barrier)**: 점프로 뛰어넘는 공사 표지판.
   - **높은 고가 신호기 (High Barrier)**: 몸을 웅크려 슬라이딩 롤링으로 통과하는 상단 구조물.
   - **3D 황금 코인**: 회전하는 황금 동전 스트림 (+20점).
   - **자석 파워업 (Magnet)**: 6초간 전 레인의 코인을 자석처럼 흡수.
3. **플레이어 & 추격자 3D 모델링**:
   - 후드티와 청바지의 3D 서퍼 아바타 & No.026 공식 영웅 카드 스프라이트 HUD 배지 렌더링.
   - 질주 애니메이션, 공중 점프 회전, 바닥 슬라이딩 롤링 모션.
   - 뒤에서 맹추격하는 3D 경비원 & 불독 메쉬.

## 3. 모바일 편의성 및 100% 퓨어 터치 절대 원칙
1. **화면 왜곡 원천 차단**:
   - `fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none`
   - `ResizeObserver` 및 `orientationchange` 대응으로 100% 모바일 전체화면 유지.
2. **카메라 시점 일치 조작**:
   - 3인칭 체이스 백 뷰 (화면 오른쪽 = `+X` 우측 레인, 화면 왼쪽 = `-X` 좌측 레인, 전방 = `-Z`).
   - 화면 스와이프 조작 방향 100% 일치.
3. **직관적인 모바일 퓨어 터치 UI**:
   - 4방향 터치 스와이프 (좌/우: 레인 변경, 상: 점프, 하: 슬라이드 롤링).
   - 하단 좌측 [◀ 좌] / [우 ▶] 레인 이동 버튼.
   - 하단 우측 80px 대형 [⬆ JUMP 점프] + 68px [⬇ ROLL 구르기] 버튼.
   - 점프, 슬라이드, 충돌, 코인 수집 시 실감 나는 햅틱 진동(`navigator.vibrate`) 피드백.

## 4. 보상 및 데이터 영구 보존
- 600m 완주 또는 500 코인 달성 시 `calculateAndDepositMissionReward('poki_subway_surfers', ...)` 통해 20~50 SNS 포인트 및 트로피 즉시 지급.
- `MinimalistMissionHUD` (중도 포기 시 주행 거리/코인 비례 안전 정산).
- `UniversalTutorialModal` (`iconType: 'GOAL' | 'GESTURES' | 'REWARDS'`).
- `VictoryRewardModal` 및 `localStorage` 기반 무결점 영구 보존.
