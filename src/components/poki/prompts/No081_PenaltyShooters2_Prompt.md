# No.081 Penalty Shooters 2 - Three.js 3D 국가대항 승부차기 토너먼트 & 슈퍼 세이브

## 1. 개요
- **게임명**: Penalty Shooters 2 (페널티 슈터스 2 3D)
- **장르**: 운동 스포츠, 축구 승부차기 시뮬레이션, 토너먼트 배틀
- **플랫폼**: Poki 웹게임 Top 110선 No.081
- **원작 URL**: `https://poki.com/kr/g/penalty-shooters-2`
- **엔진**: Three.js (WebGL 3D) + React 19 + TypeScript + Tailwind CSS

---

## 2. 핵심 게임 메커니즘 & 3D 연출
1. **3D 축구 스타디움 & 골대 (Football Stadium Arena)**:
   - 3D 축구 그라운드 (잔디 줄무늬 텍스처, 페널티 에어리어 라인, 11m 페널티 마크 & 중앙 No.081 공식 영웅 배지 엠블럼).
   - 정밀 규격 골대 (백색 골포스트, 크로스바, 물리적 진동 골망 Net).
   - 현장감 넘치는 3.5D 다이나믹 슈팅 & 키퍼 뷰 카메라.
2. **키커 턴 & 골키퍼 턴 듀얼 롤 플레이 (Kicker & Keeper Roles)**:
   - **키커 턴 (Player Kicks)**:
     - 플레이어 스트라이커 (국가대표 유니폼, 축구화, 가슴 No.081 공식 카드 영웅 배지).
     - 골대 9개 구역(좌상/중상/우상/좌중/센터/우중/좌하/중하/우하) 정밀 조준 타깃팅.
     - 76px [POWER SHOOT] 90km/h 직사 강슛 및 64px [CURVE] 바나나 감아차기 탄도학.
     - 골 성공 시 그물 흔들림 애니메이션 + GOAL! 골 세레모니 + 환호 파티클.
   - **키퍼 턴 (Player Saves)**:
     - 플레이어가 골키퍼가 되어 상대 AI의 강력한 슛을 다이빙 선방!
     - 상대 슛 궤적 예측 타깃 링 표시 ➔ 화면 터치 슬라이드 & 76px [DIVE] 슈퍼 세이브!
3. **5라운드 승부차기 토너먼트 룰**:
   - 5번의 슈팅 & 선방 (전광판 ⚽/❌ 인디케이터 실시간 기록).
   - 5라운드 후 다득점 팀 승리 (동점 시 서든데스 연장전).

---

## 3. 100% 모바일 퓨어 터치 조작계
- **키커 턴**: 골대 영역 터치 슬라이드로 슈팅 타깃 조준 + 76px [SHOOT 강슛] 대형 버튼 + 64px [CURVE 감아차기].
- **키퍼 턴**: 화면 터치 슬라이드로 골키퍼 장갑 조향 + 76px [DIVE 다이빙 선방].
- **햅틱 피드백**: 슈팅 임팩트 시 진동(`navigator.vibrate(30)`), 골망 흔들림 및 선방 시 강력 진동(`navigator.vibrate([40, 50, 60])`).

---

## 4. UI & 시스템 연동
- **전체화면 무결점**: `fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none`.
- **MinimalistMissionHUD**: 실시간 스코어보드 (KOR 3 : 2 AI), 라운드 1/5, 중도 포기 확인 모달, 실적 비례 20~50 SNS 안전 정산.
- **LocalStorage 100% 영구 보존**: `standardizedRewardGateway.ts` 완벽 통합.
