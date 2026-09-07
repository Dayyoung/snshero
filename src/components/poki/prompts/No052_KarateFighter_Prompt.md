# No.052 Karate Fighter - Three.js 3D 정통 도장 가라테 격투 대전 리마스터 프롬프트

## 1. 게임 개요
- **게임명**: Karate Fighter (가라테 파이터 3D)
- **장르**: 3D 대전 격투 액션, 무술 배틀 시뮬레이션 (Martial Arts 3D Fighting)
- **원본 URL**: https://poki.com/kr/g/karate-fighter
- **영웅 카드**: No.052 카드 스프라이트 (`drawCardSprite` 기반 영웅 HUD 뱃지 연동)
- **보상 체계**: 20 ~ 50 SNS 포인트 공정 지급 (`standardizedRewardGateway.ts` 및 LocalStorage 100% 영구 보존)

---

## 2. 3D 공간 및 비주얼 디자인 (Three.js)
1. **정통 무도관 도장 (Traditional Japanese Dojo Arena)**:
   - 16m x 16m 다다미(Tatami) 원목 경기장 바닥 & 다크 우드 프레임.
   - 배경: 전통 쇼지(Shoji) 살창 미닫이벽, 걸려있는 붉은 제등(Lanterns) 4기, 벚꽃 잎 파티클.
   - 중앙 시작 지점: 안전 매트 중앙 (플레이어 X: -2.5m, 적 라이벌 X: +2.5m 대치 구도 안전 안착).
2. **3D 가라테 무술가 파이터 모델**:
   - 플레이어 (백색 도복 & 블랙 벨트, No.052 공식 영웅 카드 엠블럼):
     - 정통 가라테 가드 자세 (부드러운 바운스 애니메이션).
     - 타격 모션: [정권 찌르기 (Straight Punch)], [돌려차기 (Roundhouse Kick)], [철벽 방어 (Iron Guard)].
   - 적 라이벌 (흑색 도복 & 레드 벨트):
     - 지능형 격투 AI: 거리 유지, 페인트, 기습 발차기, 플레이어 연속 공격 시 가드.
     - 피격 시 넉백 및 붉은 스파크 충격파.
3. **무술 액션 메커니즘 & 기(Ki) 게이지**:
   - [PUNCH]: 빠른 2연타 정권 (데미지 12).
   - [KICK]: 강력한 돌려차기 (데미지 24 & 넉백).
   - [BLOCK]: 적 공격 타이밍에 가드 시 패링(Parry) 성공 (데미지 0 + 상대 스턴 0.8초).
   - [⚡ KI SPECIAL]: 기 게이지 100% 시 발동하는 승룡권 폭풍 피니시 (데미지 45 & 시네마틱 슬로모션).
   - 타격 시 카툰 스타일 임팩트 텍스트("HIT!", "CRITICAL!", "PARRY!") 및 3D 충격파 링.

---

## 3. 모바일 퓨어 터치 인터랙션 (절대 원칙 준수)
1. **모바일 전체화면 무결점**:
   - `fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none`
   - `ResizeObserver`로 카메라 및 렌더러 반응형 100% 동기화.
2. **카메라 시점 기준 조작 방향(좌우/상하) 100% 일치 절대 원칙**:
   - 횡스크롤 3D 대전 시점에서 화면 좌측 스와이프/버튼 전진(+X) 및 후퇴(-X) 1:1 일치.
3. **100% 모바일 퓨어 터치 조작계**:
   - 화면 좌측: 좌/우 전진 및 후퇴 대시 버튼 (48px 원형).
   - 화면 우측 대형 격투 버튼군:
     - `76px [👊 PUNCH]` (정권 찌르기).
     - `64px [🥋 KICK]` (하이킥).
     - `56px [🛡️ BLOCK]` (가드 & 패링).
     - `64px [⚡ SPECIAL]` (기 게이지 완충 시 황금빛 펄스 활성화).
   - 햅틱 피드백 (`navigator.vibrate`) 연동.
4. **미션 목표 & 보상 정산**:
   - 2판 3선승제(2 Rounds to Win) 또는 1판 라이벌 완전 격파 시 승리.
   - `MinimalistMissionHUD` (중도 포기 시 가한 피해량 비례 20~50 SNS 안전 정산).
   - `VictoryRewardModal` 및 LocalStorage 무결점 영구 보존.
