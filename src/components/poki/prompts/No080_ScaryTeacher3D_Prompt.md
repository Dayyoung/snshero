# No.080 Scary Teacher 3D - Three.js 3D 미스 티 대저택 잠입 & 기상천외 장난 탈출

## 1. 개요
- **게임명**: Scary Teacher 3D (무서운 선생님 3D)
- **장르**: 액션 잠입 어드벤처, 두뇌 퍼즐, 3D 장난 시뮬레이션
- **플랫폼**: Poki 웹게임 Top 110선 No.080
- **원작 URL**: `https://poki.com/kr/g/scary-teacher-3d`
- **엔진**: Three.js (WebGL 3D) + React 19 + TypeScript + Tailwind CSS

---

## 2. 핵심 게임 메커니즘 & 3D 연출
1. **3D 미스 티 대저택 (Miss T's Grand Mansion)**:
   - 32m x 28m 호화 대저택 (중앙 로비 홀, 주방, 거실, 서재, 현관 정문).
   - 카펫 중앙에 No.080 공식 카드 영웅 배지 엠블럼 부착.
   - 소파, 옷장, 냉장고, 식탁, TV, 책장 등 풍부한 3D 가구 배치.
2. **미스 티(Miss T) 순찰 및 추격 AI**:
   - 3D 미스 티 모델링: 핑크 드레스, 롤러 파마머리, 돋보기 안경, 손에 쥔 분필/자.
   - 8m 전방 75° 노란색 시야각 원뿔(Vision Cone) 실시간 렌더링.
   - 플레이어 시야 포착 또는 달리기 소음 감지 시 빨간색 [!] 경보 발령 및 고속 추격 시작.
   - 옷장에 숨으면(HIDE) 바로 앞을 지나가도 발각되지 않는 완전 은신 판정.
3. **3종 장난(Pranks) 미션 & 탈출**:
   - **장난 1 (주방)**: 시리얼 그릇에 매운 소스 붓기 (Chili Cereal).
   - **장난 2 (거실)**: 푹신한 소파에 방귀 쿠션 & 장난감 설치 (Whoopee Sofa).
   - **장난 3 (서재)**: TV 화면에 페인트 칠하고 리모컨 고장내기 (Prank TV).
   - 3개 장난 완수 후 현관 게이트를 열고 탈출하면 미스 티가 골탕 먹는 코믹 컷신과 함께 승리!

---

## 3. 100% 모바일 퓨어 터치 조작계
- **화면 좌측**: 360° 다이나믹 플로팅 가상 조이스틱 (Screen-relative 완벽 일치).
- **화면 우측 액션 버튼 군**:
  - **76px [PRANK!]**: 장난 설치 및 상호작용 대형 버튼 (오브젝트 근접 시 바운스 활성화).
  - **64px [HIDE]**: 옷장/소파 뒤 완전 은신 (시야 회피).
  - **64px [SNEAK/RUN]**: 살금살금 걷기(무소음) vs 전력질주(소음 발생) 전환.
- **햅틱 피드백**: 장난 성공 시 진동(`navigator.vibrate([40, 50, 40])`), 발각 경보 시 위험 진동(`navigator.vibrate(100)`).

---

## 4. UI & 시스템 연동
- **전체화면 무결점**: `fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none`.
- **MinimalistMissionHUD**: 장난 진행도(x/3), 미스 티 경보 게이지(0~100%), 중도 포기 확인 모달, 실적 비례 20~50 SNS 안전 정산.
- **LocalStorage 100% 영구 보존**: `standardizedRewardGateway.ts` 완벽 통합.
