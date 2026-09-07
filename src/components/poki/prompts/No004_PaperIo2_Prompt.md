# Poki No.004 - Paper.io 2 (3D 실시간 영토 확장 IO) 고도화 구현 프롬프트

## 1. 게임 개요
- **게임명**: Paper.io 2 (페이퍼 아이오 2)
- **원본 제작사**: Voodoo
- **Poki 공식 URL**: `https://poki.com/kr/g/paperio-2`
- **장르**: 3D 실시간 영토 쟁탈전 IO 액션 게임 (Three.js 3D Engine)
- **핵심 컨셉**: 플레이어는 자신만의 시그니처 색상을 가진 종이 블록(Paper Cubie)을 조작하여, 자신의 영토 밖으로 나가 꼬리(Trail)를 그린 뒤 다시 영토로 복귀해 둘러싸인 면적을 자신의 영토로 병합합니다. 다른 적의 꼬리를 들이받아 탈락시키고, 상대방에게 꼬리가 밟히지 않도록 방어하며 맵의 25% 이상을 정복하여 1등을 차지하는 전략 IO 게임입니다.

---

## 2. 원본 핵심 요소 및 메커니즘 분석
1. **3D 전장 (Smooth Arena Canvas)**:
   - 원형 또는 거대 사각형 3D 경기장 (Three.js Plane & Dynamic Texture / 80x80 고해상도 그리드 텍스처).
   - 각 플레이어 고유 색상 (플레이어: Sky Blue #0284c7, 봇 1: Crimson Red #ef4444, 봇 2: Lime Green #22c55e, 봇 3: Amber Orange #f59e0b, 봇 4: Violet Purple #8b5cf6).
   - 3D 영토 높낮이: 영토로 점령된 바닥은 은은한 광택과 1px 테두리, 안전지대(Safe Zone) 형성.
2. **플레이어 및 봇 아바타 (3D Paper Cubie)**:
   - 3D 둥근 모서리 박스 메시 + 진행 방향으로 부드러운 뱅킹 회전 애니메이션.
   - 카드 No.04 영웅 배지 스프라이트 텍스처 머리 위 플로팅.
   - 이동 경로 뒤에 생성되는 3D 리본 꼬리 궤적(Ribbon Trail Mesh / Line Geometry).
3. **영토 점령 (Conquest / Flood Fill) 알고리즘**:
   - 안전지대 밖으로 나가면 실시간으로 꼬리 점들(Trail Points)을 기록.
   - 꼬리를 유지한 채 다시 자신의 안전지대(Safe Zone)로 진입하는 순간, 다각형 루프(Polygon Loop)를 감지하여 둘러싸인 모든 타일을 자신의 색상으로 즉시 채움.
   - 점령된 영토 비율(%) 실시간 계산 (0% ~ 100%).
4. **전투 및 꼬리 차단 (Tail Elimination)**:
   - 적이 영토 밖에서 그리고 있는 꼬리에 충돌하면 해당 적을 즉시 처치(Kill + 점수 + SNS 보상)!
   - 반대로 내가 꼬리를 그리고 있을 때 적이 내 꼬리를 밟으면 즉시 패배(Game Over).
   - 상대방의 기존 영토를 잘라먹으면 상대방의 점유율이 감소하고 내 점유율로 전격 흡수.
5. **모바일 퓨어 제스처**:
   - 화면 어느 곳이든 터치 & 드래그로 360도 즉각적인 방향 전환 (Smooth Touch Steering).
   - 탑다운 3인칭 추적 카메라: 플레이어 중심의 부드러운 줌 & 패닝.
   - HUD: 실시간 랭킹 리더보드 (1등 왕관), 영토 점유율(%), 생존 시간, MinimalistMissionHUD (포기 시 정산).

---

## 3. 기술 구현 명세 (Three.js 3D)
- **라이브러리**: `import * as THREE from 'three'`
- **렌더러**: `THREE.WebGLRenderer({ antialias: true, alpha: false })`
- **카메라**: 부드러운 탑다운/쿼터뷰 카메라 (`THREE.PerspectiveCamera`, FOV 50)
- **조명**: `AmbientLight`, `DirectionalLight` (실시간 그림자 캐스팅)
- **영토 텍스처링**: 동적 2D 캔버스 텍스처 (`THREE.CanvasTexture`)를 바닥 3D 메시에 1:1 매핑하여 80x80 고해상도 초고속 Flood Fill 렌더링.
