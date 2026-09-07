# No.099 Perfect Landing, Plane Pilot (Three.js 3D 항공기 조종 & 정밀 활주로 착륙 시뮬레이터)

## 1. 게임 개요
- **원작 타이틀**: Perfect Landing, Plane Pilot (`https://poki.com/kr/g/perfect-landing-plane-pilot`)
- **장르**: 3D 비행 시뮬레이션 / 파일럿 착륙 챌린지 / 항공 아케이드
- **플랫폼**: 모바일 웹 (Three.js + React 19 + TypeScript + Tailwind CSS)
- **공식 연동 영웅**: No.099 공식 카드 영웅 배지 (`cards1.png` / `cards2.png` 스프라이트 연동)

---

## 2. 게임 메커니즘 및 3D 구현 사양

### (1) 3D 활주로 공항 및 해양 비행 코스
- **해상 공항 아일랜드 & 120m 활주로 (Runway)**:
  - 녹색/백색 활주로 유도로 조명 램프, 센터라인 마킹, 터치다운 마킹 존.
  - 활주로 끝 관제탑 상단 No.099 공식 카드 영웅 배지 엠블럼.
  - 해상 회전 풍력 터빈 타워 3기 (거대 3엽 날개 회전).
  - 공중 골드 링 게이트 (통과 시 비행 안정도 보너스).

### (2) 3D 제트 여객기 모델링
- 화이트 & 네이비 제트 여객기 (길이 4.8m, 날개폭 4.2m).
- 듀얼 제트 엔진 (후방 추진 배기 파티클), 주익 및 윙렛, 수직/수평 꼬리날개.
- 전방 콕핏 윈도우, 랜딩기어 바퀴 3세트.
- 기체 날개 및 동체 No.099 공식 카드 영웅 배지 데칼 각인.

### (3) 정밀 착륙(Glide Slope) & 터치다운 판정
- 피치각(Pitch)과 롤각(Roll)을 정밀 제어하여 활주로 중심선 정렬.
- 풍력 터빈 회피 및 고도(Altitude) 강하.
- 활주로 터치다운 존 접지 시 수직 강하속도 측정:
  - 안전 하강 속도(Vy < 3.5m/s) ➔ [✨ PERFECT LANDING! +100] 및 브레이크 정지.
- 3회 연속 착륙 성공(TARGET_LANDINGS = 3) 시 승리!

### (4) 모바일 퓨어 터치 조작계
- **360° 다이나믹 플로팅 비행 요크**: 터치 지점에서 비행기 승강타(Pitch) 및 보조날개(Roll) Screen-relative 1:1 완벽 정렬 조종.
- **76px [🛬 FLAPS / LAND] 대형 착륙 감속 버튼**.
- **64px [🚀 THROTTLE] 엔진 출력 조절 버튼**.
- 햅틱 진동 피드백 (`navigator.vibrate`) 연동.

---

## 3. 보상 및 UI 규격
- **MinimalistMissionHUD**: 성공 착륙 횟수(0/3), 현재 고도(ALT), 속도(SPD), 중도 포기 확인 모달, 실적 비례 20~50 SNS 포인트 안전 정산.
- **VictoryRewardModal**: 3회 착륙 성공 시 360도 공항 런웨이 쇼케이스 세레모니 및 보상 지급.
- **LocalStorage 100% 영구 보존**: `calculateAndDepositMissionReward` 표준 게이트웨이 연동.
