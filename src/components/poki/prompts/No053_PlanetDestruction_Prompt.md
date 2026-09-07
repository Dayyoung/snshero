# No.053 Planet Destruction - Three.js 3D 코스믹 행성 파괴 시뮬레이터 리마스터 프롬프트

## 1. 게임 개요
- **게임명**: Planet Destruction (플래닛 디스트럭션 3D)
- **장르**: 3D 우주 시뮬레이션, 샌드박스 행성 파괴 (Space Planet Smash Simulation)
- **원본 URL**: https://poki.com/kr/g/planet-destruction
- **영웅 카드**: No.053 카드 스프라이트 (`drawCardSprite` 기반 영웅 HUD 뱃지 연동)
- **보상 체계**: 20 ~ 50 SNS 포인트 공정 지급 (`standardizedRewardGateway.ts` 및 LocalStorage 100% 영구 보존)

---

## 2. 3D 공간 및 비주얼 디자인 (Three.js)
1. **우주 공간 & 3D 행성 (Cosmic Planet)**:
   - 심우주(Deep Space) 배경: 1,000개의 성운/항성 파티클 & 은하수 림.
   - 중앙 직경 7m 거대 3D 지구형 행성 (중심 [0, 0, 0] 안전 안착):
     - 대양(Blue Ocean) & 대륙(Green Land) & 회전하는 구름층(Cloud Layer Sphere).
     - 대기권 발광 아우라(Atmosphere Rim Glow).
   - 행성 내부 핵(Molten Core Sphere): 붉은 용암 핵이 지각 파괴 시 점진적 노출.
2. **4대 파괴 무기 아스널 (Destruction Arsenal)**:
   - [☄️ METEOR]: 불타는 화염 꼬리의 소행성이 우주에서 궤적으로 날아와 충돌, 분화구 크레이터 및 용암 스파크 폭발.
   - [⚡ ION LASER]: 궤도 빔이 표면에 지속적으로 꽂히며 지표면을 녹이고 연기 파티클 발생.
   - [🚀 NUCLEAR]: 원자 미사일 직격 후 거대 버섯구름 충격파 링 및 대규모 크레이터 형성.
   - [🕳️ BLACK HOLE]: 소형 중력 블랙홀이 시공간을 왜곡하며 지각 파편을 흡수.
3. **행성 파괴 피직스 & 슈퍼노바 피날레**:
   - Raycasting 기반으로 플레이어가 터치한 지표면 정확한 3D 좌표에 크레이터 데칼 및 화염 메쉬 생성.
   - 파괴율(Destruction %) 0% ➔ 100% 실시간 누적.
   - 100% 도달 시 슈퍼노바 대폭발:
     - 행성 본체가 수십 개의 암석 파편 조각으로 산산조각 분해되며 사방으로 튕겨 나가는 시네마틱 폭발!

---

## 3. 모바일 퓨어 터치 인터랙션 (절대 원칙 준수)
1. **모바일 전체화면 무결점**:
   - `fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none`
   - `ResizeObserver`로 카메라 및 렌더러 반응형 100% 동기화.
2. **100% 모바일 퓨어 터치 편의성**:
   - 화면 드래그: 3D 행성 360도 자유 궤도 회전(Orbit / Rotation).
   - 화면 탭: 선택된 무기로 해당 지표면 즉시 폭격.
   - 하단 4대 무기 탭 선택 바 (엄지손가락 최적화 56px 버튼 + 햅틱).
3. **미션 목표 & 보상 정산**:
   - 행성 파괴율 100% 달성 시 슈퍼노바 승리.
   - `MinimalistMissionHUD` (중도 포기 시 파괴율 비례 20~50 SNS 안전 정산).
   - `VictoryRewardModal` 및 LocalStorage 무결점 영구 보존.
