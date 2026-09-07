# Poki No.008: Cryzen.io 3D 리마스터 구현 프롬프트

## 1. 개요
- **게임명**: Cryzen.io 3D (택티컬 전술 FPS 아레나)
- **장르**: 3D 실시간 택티컬 FPS / 슈팅 배틀로얄
- **엔진**: Three.js (JavaScript 3D Library)
- **참조 링크**: `https://poki.com/kr/g/cryzen-io`
- **카드 스프라이트**: No.08 영웅 배지 및 3D 택티컬 솔저 장식

## 2. 핵심 게임플레이 메커니즘
1. **3D 전술 군사 기지 아레나**:
   - 콘크리트 벙커, 선적 컨테이너, 엄폐 모래주머니 벽, 망루가 배치된 택티컬 전장.
   - 다크 인더스트리얼 전술 조명 및 안개 효과.
2. **3D 솔저 아바타 & 총기 시스템**:
   - 방탄 헬멧, 전술 조끼, 라이플을 파지한 3D 군인 아바타 & 머리 위 No.08 카드 영웅 스프라이트.
   - AKM 돌격소총: 탄창 30발, 발사 시 총구 화염(Muzzle Flash) + 탄도 트레이서 광선 + 사격 반동(Recoil) 애니메이션.
   - 타격 및 킬 피드: 적 히트 시 스파크 임팩트 파티클, 헤드샷/킬 시 도파민 킬 피드 알림.
3. **적 AI 용병 봇들 (Rival Mercenaries)**:
   - 5명의 적 AI 용병이 엄폐물을 끼고 배회하며 플레이어를 조준 사격.
   - 플레이어 피격 시 붉은 비네트 펄스 및 체력 감소, 몬스터 처치 시 탄약 보급 및 스코어 +250.
4. **모바일 100% 최적화 표준**:
   - `fixed inset-0 w-full h-[100dvh] overflow-hidden select-none touch-none`
   - Three.js 캔버스 뷰포트 `absolute inset-0 w-full h-full`
   - `ResizeObserver` + `orientationchange`로 실시간 종횡비/렌더러 완벽 동기화.
   - 좌측 화면 터치: 다이나믹 플로팅 가상 조이스틱 (Floating Joystick Ring & Knob) 360° 이동.
   - 우측 화면 터치: 카메라 에임 조준 (Swipe to Aim).
   - 우측 하단 80px 대형 `[🔫 사격 FIRE]` 버튼 (원터치/홀드 연속 사격, 0ms 즉각 반응, 햅틱 `navigator.vibrate` 진동).
   - 우측 64px `[▲ 점프]` 및 `[🔄 재장전]` 버튼.
5. **미션 정산 & 로컬스토리지 보존**:
   - `MinimalistMissionHUD` 연동: 중도 포기/뒤로가기 시 확인 팝업 및 처치 수/점수에 비례한 SNS 포인트 보상 정산 지급!
