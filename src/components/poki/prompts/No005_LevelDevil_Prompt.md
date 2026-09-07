# Poki No.005 - Level Devil (3D 얄미운 트롤 함정 플랫포머) 고도화 구현 프롬프트

## 1. 게임 개요
- **게임명**: Level Devil (레벨 데빌)
- **원본 제작사**: Unept
- **Poki 공식 URL**: `https://poki.com/kr/g/level-devil`
- **장르**: 3D 피지컬 트롤 플랫포머 / 함정 탈출 액션 (Three.js 3D Engine)
- **핵심 컨셉**: 출구 문(Exit Door)까지 도달하는 것은 단순해 보이지만, 플레이어가 방심하는 순간 발판이 무너지고, 기습 가시가 솟구치며, 문이 저절로 도망치고, 조작이 반대로 바뀌는 등 상상을 초월하는 얄미운 트롤 함정들을 극복하고 탈출하는 코믹 피지컬 액션 게임입니다.

---

## 2. 원본 핵심 요소 및 메커니즘 분석
1. **3D 스테이지 환경 (Voxel Isometric Platform Stage)**:
   - Three.js 기반 깔끔하고 미니멀한 3D 큐브 블록 (어두운 미드나잇 배경, 텍스처드 큐브 블록, 네온 발광 조명).
   - 카메라: 2.5D/3D 고정 쿼터뷰로 원근감과 입체감을 제공하여 함정의 깊이감을 극대화.
2. **다양한 트롤 함정 기믹 (Troll Gimmicks)**:
   - **무너지는 발판 (Crumbling Trap)**: 밟는 순간 0.15초 뒤 아래 심연으로 푹 꺼지는 바닥 블록.
   - **기습 가시 (Pop-up Spikes)**: 플레이어가 특정 X 좌표에 접근하면 바닥이나 천장에서 갑자기 튀어나오는 3D 붉은 콘(Cone) 가시.
   - **도망치는 문 (Escaping Door)**: 문 앞 3m에 도착하면 문이 훌쩍 점프하여 다른 곳으로 도망침! (2번 도망친 뒤 최종 정지).
   - **천장 낙하 블록 (Crushing Ceiling)**: 점프하면 천장 블록이 쾅 내려앉음.
   - **반전 조작 (Inverted Controls)**: 특정 스테이지에서 좌우 입력이 반대로 반전.
3. **플레이어 (3D 데빌 큐비 & 카드 No.05 영웅 배지)**:
   - 귀여운 3D 노란색 큐비 아바타 (점프/낙하 시 신축 변형 Squish & Stretch).
   - 카드 No.05 영웅 배지 스프라이트 머리 위 플로팅.
   - 사망 시 3D 큐브 파편으로 폭발 산산조각 ➔ 0.5초 만에 즉시 부활 리스폰(무한 도전).
4. **모바일 전체화면 무결점 & 100% 터치 편의성 ([AGENTS.md] 표준)**:
   - `fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none`
   - `ResizeObserver` 및 `orientationchange` 연동으로 모바일 주소창/회전 시 캔버스 왜곡 0% 차단.
   - 화면 좌측: 직관적인 좌/우 슬라이딩 터치 조향 패드 (시각 피드백 인디케이터).
   - 화면 우측: 초대형 `[🦘 JUMP]` 버튼 (84px, `onTouchStart` 0ms 즉각 점프 + 햅틱 진동).
   - `MinimalistMissionHUD`: 중도 포기 시 클리어한 스테이지 비례 SNS 포인트 즉시 정산.

---

## 3. 기술 구현 명세 (Three.js 3D)
- **라이브러리**: `import * as THREE from 'three'`
- **렌더러**: `THREE.WebGLRenderer({ antialias: true, alpha: false })`
- **카메라**: `THREE.PerspectiveCamera`, 포커스 타깃은 플레이어와 문 중심
- **오브젝트**:
  - Ground & Wall Blocks (`THREE.BoxGeometry`)
  - Spike Cones (`THREE.ConeGeometry`, 붉은 네온)
  - Exit Door (`THREE.Group` + 문틀, 문짝, 녹색 클리어 포털 라이트)
