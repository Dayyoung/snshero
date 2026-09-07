# No.047 Count Control Legends (카운트 컨트롤 레전드 3D) 리마스터 프롬프트

## 1. 게임 개요
- **게임명**: Count Control Legends (Poki No.047)
- **장르**: 3D 수학 연산 군단 돌파 & 공성전 러너 (Math Crowd Runner & Castle Siege)
- **원작 URL**: https://poki.com/kr/g/count-control-legends
- **핵심 메커니즘**:
  - 스틱맨 부대를 지휘해 170m 런웨이를 질주하며 최적의 연산 게이트(+20, x2, x3 등)를 통과하여 대규모 군단을 양성.
  - 회전 톱니 날과 진자 장애물을 피하고 결승선의 거대 적군 성채(HP 150)를 군단 돌격으로 함락.
  - 시작 시 20m의 넓고 안전한 시작 플랫폼에서 출발하여 안전 안착.

## 2. Three.js 3D 구현 스펙
- **무대 & 환경**:
  - 170m 고대 석조 런웨이 트랙 & 사이드 가이드 레일 & 용암 심연 배경.
  - 4쌍의 좌/우 분할 3D 네온 수학 게이트 (+20, x2, +50, x3, ÷2 등).
  - 회전 3D 톱니 블레이드 트랩 (Saw Blades).
  - 결승 요새 성채 & 성문 메쉬 (Enemy Fortress, HP 150).
  - 3인칭 쿼터뷰 후방 추종 카메라.
- **3D 군단(Crowd) 시스템**:
  - 지휘관 스틱맨 (골든 아머 & No.047 공식 영웅 배지).
  - 병력 수(1 ~ 180명)에 비례한 피보나치 나선형 동적 클러스터링 및 러닝 모션.
  - 게이트 통과 시 증폭 애니메이션 & 골드 스파크 파티클.
- **성채 공성전**:
  - 결승선 도달 시 군단 전체 일제 돌격 러시 및 성채 HP 격파 연출.

## 3. 모바일 편의성 & 조작계 절대 원칙
- **화면 규격**: `fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none`.
- **조작계**:
  - 화면 좌우 터치 드래그로 군단 실시간 스티어링.
  - 좌측 하단 [⬅️ LEFT] / [➡️ RIGHT] 레인 이동 원터치 백업.
  - 우측 하단 76px 대형 [⚡ RUSH] 돌격 가속 버튼.
  - 게이트 통과, 병력 증폭, 성채 타격 시 다채로운 햅틱(`navigator.vibrate`) 피드백.
- **HUD & 보상**:
  - `MinimalistMissionHUD`: 군단 병력 수, 성채 HP 바, 거리, 중도 포기 보상 연동.
  - `UniversalTutorialModal`: 수학 게이트 선택과 공성전 안내.
  - `VictoryRewardModal`: 성채 함락 승리 시 35~50 SNS 포인트 지급 및 LocalStorage 영구 보존.
