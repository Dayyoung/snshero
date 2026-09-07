# Poki No.003 - MineFun.io (3D 마인크래프트 복셀 파쿠르 오비) 고도화 구현 프롬프트

## 1. 게임 개요
- **게임명**: MineFun.io (마인펀)
- **원본 제작사**: Vectaria (Cryzen.io, Vectaria.io 제작사)
- **Poki 공식 URL**: `https://poki.com/kr/g/minefun-io`
- **장르**: 3D 복셀 블록 파쿠르 & 오비 어드벤처 (Three.js 3D Engine)
- **핵심 컨셉**: 마인크래프트 스타일의 복셀 블록(잔디, 돌, 나무, 용암, 슬라임 점프패드)으로 공중에 지어진 고난도 오비(Obby) 파쿠르 코스를 점프와 정밀한 조향으로 통과하며, 맵 곳곳의 코인을 수집하고 결승 다이아몬드 포털에 도달하는 3D 어드벤처 게임.

---

## 2. 원본 핵심 요소 및 메커니즘 분석
1. **3D 복셀 파쿠르 트랙 (Floating Voxel Obby)**:
   - 복셀 블록(가로 1 x 세로 1 x 높이 1) 단위로 배치된 플랫폼.
   - 다양한 블록 종류:
     - **Grass Block (초록 잔디 & 흙)**: 기본 안전 발판
     - **Stone / Cobblestone (돌)**: 좁은 기둥 발판
     - **Wood Plank (나무 판자)**: 징검다리 발판
     - **Lava Block (붉은 용암)**: 밟으면 즉시 데미지 / 넉백 / 낙사
     - **Slime Pad (연두색 슬라임)**: 밟으면 2.5배 고공 슈퍼 점프 발동
     - **Moving Platform (부유 이동 블록)**: 좌우로 왕복하는 움직이는 발판
2. **플레이어 (Voxel Hero - 카드 No.03 영웅 배지)**:
   - 3D 복셀 마인크래프트 스타일 캐릭터 (몸통, 머리, 팔다리, 카드 No.03 스프라이트 배지).
   - 3차원 점프 및 중력 물리(Gravity, Air Drag, Ground Detection).
   - 착지 판정(AABB 박스 충돌) 및 낙사 판정(Y < -15 시 체크포인트 리스폰 또는 게임 오버).
3. **오브젝트 및 목표**:
   - **Voxel Gold Coins**: 회전하는 3D 금화 코인 수집 시 점수 +50 및 SNS 포인트 보너스.
   - **Checkpoint Flags**: 중간 세이브포인트(부활 지점).
   - **End Goal Portal**: 결승선에 배치된 회전하는 거대 에메랄드/다이아몬드 포털. 도달 시 스테이지 클리어!
4. **모바일 퓨어 제스처**:
   - 좌측 영역 터치 & 드래그: 360도 이동 조향 (가상 D-패드 배제, 퓨어 터치 드래그).
   - 우측 대형 점프 버튼: `[🚀 JUMP]` (44px 이상 터치 영역).
   - 상단 HUD: 진행도 거리(m), 수집 코인, 하트(HP), `MinimalistMissionHUD` (중도 포기 시 진행도 비례 정산 연동).

---

## 3. 기술 구현 명세 (Three.js 3D)
- **라이브러리**: `import * as THREE from 'three'`
- **렌더러**: `THREE.WebGLRenderer({ antialias: true, alpha: false })`
- **카메라**: 3인칭 어깨너머 추적 카메라 (`THREE.PerspectiveCamera`, FOV 60)
- **광원**: `AmbientLight`, `DirectionalLight` (실시간 그림자)
- **성능 최적화**: InstancedMesh 또는 효율적인 BoxGeometry 재활용, GC 낭비 최소화.
