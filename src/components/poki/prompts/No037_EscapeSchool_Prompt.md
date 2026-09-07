# No.037 Escape From School (학교 탈출 3D) 리마스터 프롬프트

## 1. 게임 개요
- **게임명**: Escape From School (Poki No.037)
- **장르**: 3D 잠입 스텔스 학교 탈출 액션 (Stealth Escape Adventure)
- **원작 URL**: https://poki.com/kr/g/escape-from-school
- **핵심 메커니즘**:
  - 엄격한 당직 교사들의 시야각(Vision Cone)을 피해 교실과 복도를 누비며 3개의 황금 교문 열쇠를 획득.
  - 사물함과 책상 뒤로 은신(Crouch/Hide)하여 감시망을 회피.
  - 모든 열쇠를 모아 교문을 개방하고 학교에서 무사 탈출.
  - 시작 시 안전한 빈 교실 스폰 지점에 안착.

## 2. Three.js 3D 구현 스펙
- **무대 & 환경**:
  - 32x22m 학교 복도 & 교실 (체커보드 바닥, 사물함 라인, 학생 책걸상 세트, 화장실 칸막이, 잠긴 교문).
  - 피사체 추종 탑다운 쿼터뷰 카메라.
- **3D 캐릭터 & AI**:
  - 학생 플레이어 (책가방을 멘 3D 아바타 & No.037 공식 영웅 카드 스프라이트 HUD 배지).
  - 당직 교사 AI 2명 (순찰 경로 이동, 3D 반투명 시야각 Vision Cone 투사, 발각 시 붉은색 경보 및 추격).
- **상호작용 오브젝트**:
  - 3D 황금 열쇠 3개 (회전 및 스파크 파티클).
  - 잠긴 철제 교문 (열쇠 3개 수집 시 자물쇠 해제).
  - 사물함 & 책상 엄폐물 (시야 차단).

## 3. 모바일 편의성 & 조작계 절대 원칙
- **화면 규격**: `fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none`.
- **조작계**:
  - 좌측: 360° 다이나믹 플로팅 가상 조이스틱 (부드러운 잠입 이동).
  - 우측: 76px 대형 [🤫 SNEAK / 은신 걷기] 및 [⚡ SPRINT / 질주] 버튼.
  - 열쇠 획득, 발각 경고, 탈출 시 다이내믹 햅틱(`navigator.vibrate`) 피드백.
- **HUD & 보상**:
  - `MinimalistMissionHUD`: 열쇠 획득 수(0/3), 경보 상태, 점수.
  - `UniversalTutorialModal`: 교사 시야 회피 및 엄폐물 활용 팁 안내.
  - `VictoryRewardModal`: 교문 탈출 성공 시 35~50 SNS 포인트 정산.
