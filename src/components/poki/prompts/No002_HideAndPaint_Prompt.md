# Poki No.002 - Hide and Paint (숨바꼭질과 그림 그리기) 고도화 구현 프롬프트

## 1. 게임 개요
- **게임명**: Hide and Paint (숨바꼭질과 그림 그리기)
- **원본 제작사**: OnRush Studio (Tribals.io, Venge.io 제작사)
- **Poki 공식 URL**: `https://poki.com/kr/g/hide-and-paint`
- **장르**: 3D 액션 멀티플레이어 잠입 숨바꼭질 (Three.js 3D Engine)
- **핵심 컨셉**: 플레이어는 새하얀 카멜레온/마네킹 캐릭터가 되어 다양한 색상의 방(Room) 안에서 주변 벽이나 가구의 색상으로 몸을 페인트칠(`[🎨 PAINT]`)하여 완벽하게 위장(Camouflage)하고, 정지 포즈(`[🗿 FREEZE]`)를 취해 순찰하는 사냥꾼(Hunter)의 눈을 속여 제한 시간 동안 살아남아야 합니다.

---

## 2. 원본 핵심 요소 및 메커니즘 분석
1. **3D 방(Room) 환경**:
   - 바닥(체커/우드 플로어)과 4개 구역의 컬러 벽(Red Zone, Cyan/Blue Zone, Lime/Green Zone, Gold/Yellow Zone, Purple Zone).
   - 각 구역에 배치된 3D 가구/오브젝트(소파, 책장, 수납함, 화분, 거대 액자, 큐브 박스).
2. **플레이어 (카멜레온 / 은신자 - Hider)**:
   - 3D 캐릭터 메시(헤드, 바디, 관절 구체 및 카드 No.02 영웅 텍스처/배지).
   - 초기 상태: 하얀색(White #FFFFFF, 무방비 노출 상태).
   - 페인트칠 기능: 벽이나 물체 근처에서 `[🎨 PAINT]` 액션을 누르면 현재 위치한 영역의 색상으로 몸이 부드럽게 염색(Color Morphing).
   - 정지 포즈 기능: `[🗿 FREEZE]` 버튼을 누르면 그 자리에 마네킹처럼 고정되어 위장도(Camouflage) 100% 발동.
3. **사냥꾼 (Hunter AI / Seeker)**:
   - 3D 헌터 캐릭터 메시 (페인트건을 들고 경계 순찰).
   - 전방 원뿔형 시야각(Vision Cone) 및 손전등 스포트라이트(Spotlight) 투사.
   - 플레이어가 사냥꾼의 시야 내에 들어왔을 때:
     - 플레이어가 정지 상태이고 현재 위치의 벽 색상과 몸 색상이 일치하면 **위장 성공 (Camouflage 100%)** ➔ 사냥꾼은 알아채지 못하고 지나침.
     - 색상이 다르거나, 움직이고 있거나, 덜 칠해진 경우 **발각 게이지(Alert %)** 가 급상승하고 사냥꾼이 "발견!" 상태로 돌입하여 페인트탄 발사!
4. **승리 및 패배 조건**:
   - 승리: 라운드 제한 시간(예: 35초~45초) 동안 사냥꾼의 총에 맞지 않고 살아남으면 라운드 클리어 (총 3개 라운드).
   - 패배: 사냥꾼에게 발각되어 페인트 탄환에 3회 피격되면 체력 소진으로 게임 오버.
5. **모바일 퓨어 제스처**:
   - 화면 좌측 드래그: 360도 이동 (가상 조이스틱 없이 터치 지점 기준 방향 벡터 계산).
   - 화면 우측 하단: 원터치 `[🎨 PAINT]` 버튼 및 `[🗿 FREEZE]` 토글 버튼 (44px 이상 터치 영역).
   - Monospace 서체, 플랫 UI, 1px 보더 가이드 ([DESIGN.md]) 100% 준수.
   - `MinimalistMissionHUD` 연동: 중도 포기/뒤로가기 시 진행도 비례 SNS 포인트 정산.

---

## 3. 기술 구현 명세 (Three.js 3D)
- **라이브러리**: `import * as THREE from 'three'`
- **렌더러**: `THREE.WebGLRenderer({ antialias: true, alpha: false })`
- **카메라**: 쿼터뷰/탑다운 3인칭 추적 카메라 (`THREE.PerspectiveCamera`, FOV 55)
- **조명**:
  - `AmbientLight` (전체 은은한 실내 조명)
  - `DirectionalLight` (실시간 그림자 캐스팅)
  - `SpotLight` (사냥꾼 전방 탐색 라이트)
- **오브젝트 구성**:
  - Room Walls (4방향 벽체, 각 벽면마다 다른 색상 머티리얼)
  - Furniture Props (소파, 상자, 기둥, 화분 등 3D BoxGeometry / CylinderGeometry)
  - Player Mesh (그룹 내 머리, 몸통, 팔다리, 카드 No.02 스프라이트 캔버스 텍스처)
  - Hunter Mesh (그룹 내 헌터 바디, 페인트건, 시야 콘 와이어프레임 메시)
