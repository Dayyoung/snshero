# No.046 Kick The Buddy (킥 더 버디 3D) 리마스터 프롬프트

## 1. 게임 개요
- **게임명**: Kick The Buddy (Poki No.046)
- **장르**: 3D 래그돌 물리 인터랙티브 샌드박스 (Ragdoll Physics Sandbox)
- **원작 URL**: https://poki.com/kr/g/kick-the-buddy
- **핵심 메커니즘**:
  - 3D 골판지 박스 룸에서 헝겊 인형 버디(Buddy)를 직접 붙잡아 벽면에 내던지고 4대 무기를 활용해 타격하는 스트레스 해소 샌드박스.
  - 글러브 펀치, 다트, 다이너마이트, 테슬라 감전 무기를 조합하여 버디를 공중에 띄우고 코인을 획득.
  - 누적 $1,500 코인을 모아 버디 마스터 승리를 달성.

## 2. Three.js 3D 구현 스펙
- **무대 & 환경**:
  - 12x10x12m 3D 골판지 박스 룸 (골판지 텍스처, 벽면 스티커, 스포트라이트 조명).
  - 정면 쿼터뷰 카메라.
- **3D 래그돌 버디 & 물리**:
  - 마포 캔버스 질감의 3D 헝겊 인형 (단추 눈, 입술, 스티치 라인 & No.046 공식 영웅 배지).
  - 머리, 상체, 팔다리 스프링 탄성 물리(Verlet / Spring Pendulum).
  - 화면 터치 드래그로 버디를 직접 붙잡고 던지는(Grab & Throw) 3D 물리 인터랙션.
- **4대 무기 시스템**:
  - [🥊 PUNCH]: 스프링 권투 글러브 발사 (+15$)
  - [🎯 DART]: 터치 위치에 다트가 날아가 꽂힘 (+25$)
  - [💣 BOMB]: 다이너마이트 폭발 충격파 및 공중 회전 (+50$)
  - [⚡ ZAP]: 테슬라 번개 감전 쇼크 (+40$)
  - 타격 시 골드 코인 분출 및 래그돌 넉백 파티클.

## 3. 모바일 편의성 & 조작계 절대 원칙
- **화면 규격**: `fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none`.
- **조작계**:
  - 화면 터치 & 드래그로 버디 직접 조작 및 무기 타격.
  - 하단 4대 무기 셀렉터 [🥊 PUNCH] [🎯 DART] [💣 BOMB] [⚡ ZAP].
  - 우측 하단 76px 대형 [💥 ATTACK] 연속 타격 버튼.
  - 강타, 폭발, 감전 시 다채로운 햅틱(`navigator.vibrate`) 피드백.
- **HUD & 보상**:
  - `MinimalistMissionHUD`: 획득 코인($), 점수, 중도 포기 보상 연동.
  - `UniversalTutorialModal`: 버디 잡기 던지기와 무기 콤보 가이드.
  - `VictoryRewardModal`: $1,500 달성 시 35~50 SNS 포인트 지급 및 LocalStorage 영구 보존.
