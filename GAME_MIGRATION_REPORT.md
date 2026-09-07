# SNSHero Poki 110선 미션 게임 전면 전환 전체 보고서 (GAME_MIGRATION_REPORT.md)

- **프로젝트**: SNSHero Revolution (웹 카드 배틀 & 아케이드 미션 게임)
- **전환 목표**: `http://localhost:3000/play`의 110개 미션 게임을 글로벌 웹게임 플랫폼 Poki 인기 Top 110 게임으로 100% 전면 교체
- **5대 핵심 원칙**:
  1. **일관된 디자인**: Monospace 글꼴, 웜크림/잉크 톤, 1px 헤어라인 보더, `MinimalistMissionHUD` 통일
  2. **일관된 터치/조작**: 가상 D-패드 100% 배제, 모바일 퓨어 제스처 (스와이프, 드래그, 탭) 원핸드 플레이
  3. **일관된 보상 체계**: `standardizedRewardGateway.ts` 경유 20~50 SNS 포인트 공정 지급 및 `VictoryRewardModal`
  4. **일관된 그래픽 엔진**: HTML5 Canvas 2D 60fps 부드러운 애니메이션 및 파티클
  5. **SNSHero 캐릭터 연동**: `drawCardSprite` 기반 `cards1.png`, `cards2.png` 영웅/몬스터 스프라이트 100% 적용
- **전체 진행 현황**: **20 / 110 완료 (18.2%)**

---

## 110개 게임 전환 진행 현황표

| 번호 | Poki 대상 게임명 | 장르/유형 | 연동 카드 No. | 조작 방식 (모바일 퓨어) | SNS 보상 | 상태 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| No.001 | **Slime Keyboard Escape** | 스킬/플랫폼 | 카드 No.01 불꽃기사 카단 | 원터치 탭 점프 & 드래그 | 20~50 SNS | ✅ 완료 (Canvas 2D, 키보드 슬라임 플랫포머) |
| No.002 | **Hide and Paint** | 액션/스텔스 | 카드 No.02 아쿠아 메이지 | 원터치 드래그 페인팅 & 멈춤 위장 | 20~50 SNS | ✅ 완료 (Canvas 2D, 페인트 롤러 & 시야 콘 회피) |
| No.003 | **MineFun.io** | 액션/샌드박스 | 카드 No.03 스톤 골렘 | 원터치 광석/몬스터 탭 & 드래그 | 20~50 SNS | ✅ 완료 (Canvas 2D, 복셀 채광 & 서바이벌) |
| No.004 | **Paper.io 2** | 액션/전략 io | 카드 No.04 윈드 헌터 | 원터치/드래그 방향 조타 | 20~50 SNS | ✅ 완료 (Canvas 2D, 실시간 루프 영역 정복) |
| No.005 | **Level Devil** | 액션/트랩 플랫포머 | 카드 No.05 다크 어쌔신 | 원터치 탭 점프 & 좌우 드래그 | 20~50 SNS | ✅ 완료 (Canvas 2D, 낚시 트랩/가시/도망문) |
| No.006 | **Snake vs Worms** | 뱀/동물 배틀로얄 | 카드 No.06 드래곤 슬레이어 | 원터치 드래그 & 롱탭 부스터 | 20~50 SNS | ✅ 완료 (Canvas 2D, 음식 먹방 & 부스터 차단 폭파) |
| No.007 | **Vectaria.io** | 어드벤처/블록 배틀 | 카드 No.07 라이트닝 나이트 | 원터치 드래그 & 탭 마법 발사 | 20~50 SNS | ✅ 완료 (Canvas 2D, 복셀 웨이브 슈팅 & 젬 채집) |
| No.008 | **Cryzen.io** | 액션/전술 슈팅 | 카드 No.08 프로스트 아처 | 원터치 타깃 조준 사격 & 재장전 | 20~50 SNS | ✅ 완료 (Canvas 2D, 엄폐 스나이퍼 헤드샷) |
| No.009 | **Blocky Blast Puzzle** | 두뇌/블록 퍼즐 | 카드 No.09 블레이즈 버서커 | 원터치 블록 드래그 앤 드롭 | 20~50 SNS | ✅ 완료 (Canvas 2D, 8x8 라인 클리어 폭파 콤보) |
| No.010 | **Ragdoll Chaos** | 액션/물리 샌드박스 | 카드 No.10 섀도우 네크로맨서 | 원터치 래그돌 잡기 & 슬링 날리기 | 20~50 SNS | ✅ 완료 (Canvas 2D, 범퍼/폭탄/포털 물리 바운스) |
| No.011 | **[Rainbow Obby](https://poki.com/kr/g/rainbow-obby)** | 액션 게임, 어드벤쳐 게임 | 카드 No.11 성스러운 성기사 | 원터치 탭 점프 & 수평 드래그 | 20~50 SNS | ✅ 완료 (Canvas 2D, 무지개 고공 발판 점프 파쿠르) |
| No.012 | **[My Perfect Hotel](https://poki.com/kr/g/my-perfect-hotel)** | 장식 게임, 마우스 게임 | 카드 No.12 홀리 프리스트 | 원터치 드래그 이동 & 객실 확장 탭 | 20~50 SNS | ✅ 완료 (Canvas 2D, 호텔 체크인/룸클리닝 타이쿤) |
| No.013 | **[Talking Tom Gold Run](https://poki.com/kr/g/talking-tom-gold-run)** | 어드벤쳐 게임, 스킬 게임 | 카드 No.13 샤이닝 엔젤 | 좌우 스와이프 레인 이동 & 상향 점프 | 20~50 SNS | ✅ 완료 (Canvas 2D, 3레인 고속 금괴 추격 러너) |
| No.014 | **[Monkey Tag IO](https://poki.com/kr/g/monkey-tag-io)** | 액션 게임, 동물 게임 | 카드 No.14 대지 골렘 | 원터치 터치 드래그 스윙 & 대시 | 20~50 SNS | ✅ 완료 (Canvas 2D, 정글 캐노피 술래잡기 태그 io) |
| No.015 | **[Stickman Battle](https://poki.com/kr/g/stickman-battle)** | 액션 게임, 랙돌 게임 | 카드 No.15 블러드 나이트 | 터치 드래그 칼날 베기 & 래그돌 도약 | 20~50 SNS | ✅ 완료 (Canvas 2D, 래그돌 소드 파이팅 대결) |
| No.016 | **[Decor Life](https://poki.com/kr/g/decor-life)** | 방치 게임, 아늑한 게임 | 카드 No.16 섀도우 닌자 | 탭 언박싱 & 드래그 가구 배치 | 20~50 SNS | ✅ 완료 (Canvas 2D, 감성 인테리어 룸 메이크오버) |
| No.017 | **[Neon Challenge Legends](https://poki.com/kr/g/neon-challenge-legends)** | 스킬 게임, 마우스 게임 | 카드 No.17 플레임 소서러 | 원터치 탭 점프 & 콤보 대시 | 20~50 SNS | ✅ 완료 (Canvas 2D, 리듬 네온 플랫폼 연속 도약) |
| No.018 | **[Plonky](https://poki.com/kr/g/plonky)** | 스킬 게임, 크리스마스 게임 | 카드 No.18 윈드 레인저 | 좌우 드래그 회전 링 틈새 통과 | 20~50 SNS | ✅ 완료 (Canvas 2D, 헬릭스 스타일 심층 낙하 드롭) |
| No.019 | **[Backrooms Recovery](https://poki.com/kr/g/backrooms-recovery)** | 액션 게임, 어드벤쳐 게임 | 카드 No.19 어스 퀘이커 | 원터치 화면 탭/드래그 이동 & 손전등 | 20~50 SNS | ✅ 완료 (Canvas 2D, 옐로우 미로 3키카드 회수 탈출) |
| No.020 | **[Stickman Hook](https://poki.com/kr/g/stickman-hook)** | 레이싱 게임, 액션 게임 | 카드 No.20 라이트닝 로드 | 롱탭 로프 그래플링 & 릴리즈 점프 | 20~50 SNS | ✅ 완료 (Canvas 2D, 물리 기반 진자 스윙 & 바운스 러너) |
| No.021 | **[Steal a Brainrot](https://poki.com/kr/g/steal-a-brainrot)** | 어드벤쳐 게임, 멀티플레이어 게임 | 카드 No.21 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.022 | **[Longcat](https://poki.com/kr/g/longcat)** | 두뇌 게임, 스킬 게임 | 카드 No.22 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.023 | **[Guns Guns Guns](https://poki.com/kr/g/guns-guns-guns)** | 슈팅 게임, 총 게임 | 카드 No.23 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.024 | **[Ragdoll Hit](https://poki.com/kr/g/ragdoll-hit)** | 액션 게임, 랙돌 게임 | 카드 No.24 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.025 | **[Soccer REAL](https://poki.com/kr/g/soccer-real)** | 운동 게임, 축구 게임 | 카드 No.25 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.026 | **[Subway Surfers](https://poki.com/kr/g/subway-surfers)** | 액션 게임, 어드벤쳐 게임 | 카드 No.26 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.027 | **[Master Chess](https://poki.com/kr/g/master-chess)** | 두뇌 게임, 보드 게임 | 카드 No.27 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.028 | **[Perfect Shape](https://poki.com/kr/g/perfect-shape)** | 스킬 게임, 달리기 게임 | 카드 No.28 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.029 | **[Murder](https://poki.com/kr/g/murder)** | 액션 게임, 어드벤쳐 게임 | 카드 No.29 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.030 | **[Disaster Arena](https://poki.com/kr/g/disaster-arena)** | 액션 게임, 어드벤쳐 게임 | 카드 No.30 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.031 | **[Slice Master](https://poki.com/kr/g/slice-master)** | 두뇌 게임, 스킬 게임 | 카드 No.31 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.032 | **[Brain Test: Tricky Puzzles](https://poki.com/kr/g/brain-test-tricky-puzzles)** | 숨은 그림 찾기 게임, 마우스 게임 | 카드 No.32 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.033 | **[Stunt Bike Extreme](https://poki.com/kr/g/stunt-bike-extreme)** | 레이싱 게임, 스킬 게임 | 카드 No.33 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.034 | **[Sushi Party](https://poki.com/kr/g/sushi-party-io)** | 뱀 게임, 동물 게임 | 카드 No.34 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.035 | **[Drive Mad](https://poki.com/kr/g/drive-mad)** | 레이싱 게임, 멀티플레이어 게임 | 카드 No.35 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.036 | **[Temple Run 2](https://poki.com/kr/g/temple-run-2)** | 액션 게임, 어드벤쳐 게임 | 카드 No.36 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.037 | **[Escape From School](https://poki.com/kr/g/escape-from-school)** | 액션 게임, 어드벤쳐 게임 | 카드 No.37 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.038 | **[Count War](https://poki.com/kr/g/count-war)** | 스킬 게임, 슈팅 게임 | 카드 No.38 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.039 | **[Party Time](https://poki.com/kr/g/party-time)** | 액션 게임, 플랫폼 게임 | 카드 No.39 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.040 | **[Punchy Guy](https://poki.com/kr/g/punchy-guy)** | 액션 게임, 마우스 게임 | 카드 No.40 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.041 | **[Blacktop Police Chase](https://poki.com/kr/g/blacktop-police-chase)** | 레이싱 게임, 멀티플레이어 게임 | 카드 No.41 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.042 | **[Family Life Simulator](https://poki.com/kr/g/family-life-simulator)** | 어드벤쳐 게임 | 카드 No.42 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.043 | **[Petnest.io](https://poki.com/kr/g/petnest-io)** | 동물 게임, 멀티플레이어 게임 | 카드 No.43 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.044 | **[Cuboy Adventure](https://poki.com/kr/g/cuboy-adventure)** | 스킬 게임, 플랫폼 게임 | 카드 No.44 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.045 | **[Bubble Storm](https://poki.com/kr/g/bubble-storm)** | 스킬 게임, 퍼즐 게임 | 카드 No.45 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.046 | **[Kick The Buddy](https://poki.com/kr/g/kick-the-buddy)** | 랙돌 게임 | 카드 No.46 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.047 | **[Count Control Legends](https://poki.com/kr/g/count-control-legends)** | 두뇌 게임, 스킬 게임 | 카드 No.47 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.048 | **[Repuls.io](https://poki.com/kr/g/repuls-io)** | 액션 게임, 멀티플레이어 게임 | 카드 No.48 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.049 | **[Shenzhen Mahjong](https://poki.com/kr/g/shenzhen-mahjong)** | 두뇌 게임, 마작 게임 | 카드 No.49 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.050 | **[Beauty Salon](https://poki.com/kr/g/beauty-salon)** | 옷입히기 게임, 뷰티 게임 | 카드 No.50 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.051 | **[Super Dress](https://poki.com/kr/g/super-dress)** | 옷입히기 게임, 패션 게임 | 카드 No.51 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.052 | **[Karate Fighter](https://poki.com/kr/g/karate-fighter)** | 액션 게임, 스킬 게임 | 카드 No.52 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.053 | **[Planet Destruction](https://poki.com/kr/g/planet-destruction)** | 마우스 게임, 시뮬레이션 게임 | 카드 No.53 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.054 | **[You Monster!](https://poki.com/kr/g/you-monster)** | 액션 게임, 어드벤쳐 게임 | 카드 No.54 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.055 | **[SatisBox Mini Games](https://poki.com/kr/g/satisbox-mini-games)** | 두뇌 게임, 퍼즐 게임 | 카드 No.55 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.056 | **[Soccer Skills 2 World Cup](https://poki.com/kr/g/soccer-skills-2-world-cup)** | 운동 게임, 축구 게임 | 카드 No.56 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.057 | **[Dino Simulator](https://poki.com/kr/g/dino-simulator)** | 동물 게임, 시뮬레이션 게임 | 카드 No.57 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.058 | **[Tear Blocks Down](https://poki.com/kr/g/tear-blocks-down)** | 액션 게임, 좀비 게임 | 카드 No.58 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.059 | **[Red Ball 4](https://poki.com/kr/g/red-ball-4)** | 액션 게임, 어드벤쳐 게임 | 카드 No.59 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.060 | **[Tank Stars](https://poki.com/kr/g/tank-stars)** | 액션 게임, 전쟁 게임 | 카드 No.60 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.061 | **[Magic Battleground](https://poki.com/kr/g/magic-battleground)** | 액션 게임, 랙돌 게임 | 카드 No.61 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.062 | **[Blast Buddies](https://poki.com/kr/g/blast-buddies)** | 액션 게임, 멀티플레이어 게임 | 카드 No.62 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.063 | **[Sword Masters](https://poki.com/kr/g/sword-masters)** | 어드벤쳐 게임, 스킬 게임 | 카드 No.63 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.064 | **[Sprint League](https://poki.com/kr/g/sprint-league)** | 레이싱 게임, 운동 게임 | 카드 No.64 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.065 | **[Real City Bikes](https://poki.com/kr/g/real-city-bikes)** | 레이싱 게임, 오토바이 게임 | 카드 No.65 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.066 | **[Hills of Steel](https://poki.com/kr/g/hills-of-steel)** | 어드벤쳐 게임, 전쟁 게임 | 카드 No.66 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.067 | **[Rail in the Air](https://poki.com/kr/g/rail-in-the-air)** | 시뮬레이션 게임, 운전 게임 | 카드 No.67 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.068 | **[Monkey Mart](https://poki.com/kr/g/monkey-mart)** | 쇼핑 게임, 동물 게임 | 카드 No.68 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.069 | **[Carnado Stunt Car](https://poki.com/kr/g/carnado-stunt-car)** | 레이싱 게임, 자동차 게임 | 카드 No.69 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.070 | **[Diva Hair Salon](https://poki.com/kr/g/diva-hair-salon)** | 장식 게임, 옷입히기 게임 | 카드 No.70 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.071 | **[Scary Teacher Hide & Seek Games](https://poki.com/kr/g/scary-teacher-hide-seek-games)** | 어드벤쳐 게임 | 카드 No.71 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.072 | **[Supercar Legends](https://poki.com/kr/g/supercar-legends)** | 마우스 게임, 자동차 게임 | 카드 No.72 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.073 | **[Nails DIY: Manicure Master](https://poki.com/kr/g/nails-diy-manicure-master)** | 옷입히기 게임, 뷰티 게임 | 카드 No.73 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.074 | **[Ping Pong Go!](https://poki.com/kr/g/ping-pong-go)** | 스킬 게임, 마우스 게임 | 카드 No.74 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.075 | **[Color Artist](https://poki.com/kr/g/color-artist)** | 장식 게임, 그리기 게임 | 카드 No.75 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.076 | **[Going Up Rooftop](https://poki.com/kr/g/going-up-rooftop)** | 어드벤쳐 게임, 플랫폼 게임 | 카드 No.76 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.077 | **[Stickman Dragon Fight](https://poki.com/kr/g/stickman-dragon-fight)** | 액션 게임, 어드벤쳐 게임 | 카드 No.77 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.078 | **[Dog's Life](https://poki.com/kr/g/dogs-life)** | 동물 게임, 멀티플레이어 게임 | 카드 No.78 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.079 | **[Anycolor](https://poki.com/kr/g/anycolor)** | 스킬 게임, 장식 게임 | 카드 No.79 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.080 | **[Scary Teacher 3D](https://poki.com/kr/g/scary-teacher-3d)** | 액션 게임, 두뇌 게임 | 카드 No.80 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.081 | **[Penalty Shooters 2](https://poki.com/kr/g/penalty-shooters-2)** | 운동 게임, 스킬 게임 | 카드 No.81 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.082 | **[Boomy World](https://poki.com/kr/g/boomy-world)** | 액션 게임, 두뇌 게임 | 카드 No.82 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.083 | **[SnapStyle Dress Up](https://poki.com/kr/g/snapstyle-dress-up)** | 옷입히기 게임, 패션 게임 | 카드 No.83 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.084 | **[Fashion Legends](https://poki.com/kr/g/fashion-legends)** | 옷입히기 게임, 메이크업 게임 | 카드 No.84 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.085 | **[Vortella's Dress Up](https://poki.com/kr/g/vortellas-dress-up)** | 옷입히기 게임, 마우스 게임 | 카드 No.85 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.086 | **[MR RACER - Car Racing](https://poki.com/kr/g/mr-racer-car-racing)** | 액션 게임, 스킬 게임 | 카드 No.86 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.087 | **[School Cleaning](https://poki.com/kr/g/school-cleaning)** | 마우스 게임, 자동차 게임 | 카드 No.87 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.088 | **[Hill Climb Racing Lite](https://poki.com/kr/g/hill-climb-racing-lite)** | 레이싱 게임, 스킬 게임 | 카드 No.88 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.089 | **[Stickman Crazy Box](https://poki.com/kr/g/stickman-crazy-box)** | 액션 게임, 스킬 게임 | 카드 No.89 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.090 | **[Goods Master](https://poki.com/kr/g/goods-master)** | 두뇌 게임, 퍼즐 게임 | 카드 No.90 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.091 | **[Hexellent](https://poki.com/kr/g/hexellent)** | 두뇌 게임, 마우스 게임 | 카드 No.91 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.092 | **[Harvest Simulator](https://poki.com/kr/g/harvest-simulator)** | 시뮬레이션 게임, 농장 게임 | 카드 No.92 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.093 | **[Car Circle](https://poki.com/kr/g/car-circle)** | 두뇌 게임, 스킬 게임 | 카드 No.93 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.094 | **[Phone CASE DIY](https://poki.com/kr/g/phone-case-diy)** | 장식 게임, 그리기 게임 | 카드 No.94 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.095 | **[Soccer League](https://poki.com/kr/g/soccer-league)** | 운동 게임, 스킬 게임 | 카드 No.95 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.096 | **[Capitalist Bus Driver](https://poki.com/kr/g/capitalist-bus-driver)** | 시뮬레이션 게임, 버스 게임 | 카드 No.96 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.097 | **[EvoWorld io (FlyOrDie io)](https://poki.com/kr/g/flyordie-io)** | 스킬 게임, 마우스 게임 | 카드 No.97 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.098 | **[Bullet Bros](https://poki.com/kr/g/bullet-bros)** | 액션 게임, 플랫폼 게임 | 카드 No.98 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.099 | **[Perfect Landing, Plane Pilot](https://poki.com/kr/g/perfect-landing-plane-pilot)** | 스킬 게임, 시뮬레이션 게임 | 카드 No.99 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.100 | **[Undead Slayer](https://poki.com/kr/g/undead-slayer)** | 액션 게임, 스킬 게임 | 카드 No.100 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.101 | **[Watermelon Drop](https://poki.com/kr/g/watermelon-drop)** | 두뇌 게임, 스킬 게임 | 카드 No.101 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.102 | **[Kawaii Fruits 3D](https://poki.com/kr/g/kawaii-fruits-3d)** | 두뇌 게임, 스킬 게임 | 카드 No.102 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.103 | **[Blumgi Bounce](https://poki.com/kr/g/blumgi-bounce)** | 스킬 게임, 농구 게임 | 카드 No.103 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.104 | **[Brain Test 5](https://poki.com/kr/g/brain-test-5)** | 퍼즐 게임, 두뇌 게임 | 카드 No.104 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.105 | **[Blumgi Merge](https://poki.com/kr/g/blumgi-merge)** | 어드벤쳐 게임, 마우스 게임 | 카드 No.105 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.106 | **[Stickman Climb 3D](https://poki.com/kr/g/stickman-climb-3d)** | 스킬 게임, 플랫폼 게임 | 카드 No.106 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.107 | **[Brain Test Special](https://poki.com/kr/g/brain-test-special)** | 퍼즐 게임, 두뇌 게임 | 카드 No.107 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.108 | **[11-11](https://poki.com/kr/g/11-11)** | 두뇌 게임, 블록 게임 | 카드 No.108 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.109 | **[Blumgi Slime](https://poki.com/kr/g/blumgi-slime)** | 스킬 게임, 플랫폼 게임 | 카드 No.109 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |
| No.110 | **[Obby Roads](https://poki.com/kr/g/obby-roads)** | 레이싱 게임, 멀티플레이어 게임 | 카드 No.110 | 원터치/스와이프/드래그 | 20~50 SNS | ⏳ 대기중 |

---

## 변경 이력 및 세부 구현 로그
*(각 게임 완료 시마다 실시간으로 누적 기록됩니다)*


### [2026-09-07] Phase 1: Slot 1 ~ 10 완료 (10종 전면 개편)
1. **No.001 Slime Keyboard Escape (`PokiSlimeKeyboardGame.tsx`)**:
   - 거대 키보드 블록 위를 탭 점프하며 슬라임 트랩을 피하는 플랫포머 게임 구현.
   - 플레이어: 카드 No.01 불꽃기사 카단 스프라이트 (`cards1.png`).
   - 퓨어 원터치 탭 점프 & 좌우 이동 조작, MinimalistMissionHUD, 표준 SNS 보상 연동 완료.
2. **No.002 Hide and Paint (`PokiHideAndPaintGame.tsx`)**:
   - 바닥에 페인트를 칠하며 65% 면적을 확보하고, 순찰자 접근 시 멈춰 위장(Camouflage)하는 스텔스 아케이드.
   - 플레이어: 카드 No.02 아쿠아 메이지 스프라이트 (`cards1.png`).
   - 순찰 몬스터 FOV 시야 콘 렌더링, 퓨어 드래그 조작 연동 완료.
3. **No.003 MineFun.io (`PokiMineFunGame.tsx`)**:
   - 복셀 오픈월드에서 나무/돌/철/금/다이아몬드 광석을 채광하고 야간 몬스터를 격퇴하는 서바이벌 샌드박스.
   - 플레이어: 카드 No.03 스톤 골렘 스프라이트 (`cards1.png`).
   - 곡괭이 티어 업그레이드 시스템, 퓨어 원터치 채광 & 공격 연동 완료.
4. **No.004 Paper.io 2 (`PokiPaperIoGame.tsx`)**:
   - 베이스 밖으로 선을 그리고 복귀하여 영토를 정복하는 글로벌 인기 실시간 땅따먹기 io.
   - 플레이어: 카드 No.04 윈드 헌터 스프라이트 (`cards1.png`).
   - 꼬리 방어 & 상대 꼬리 자르기 전투, 영토 40% 점유 승리 로직 연동 완료.
5. **No.005 Level Devil (`PokiLevelDevilGame.tsx`)**:
   - 바닥 꺼짐, 숨겨진 가시, 도망가는 문 등 악마의 페이크 트랩을 돌파하는 낚시 플랫포머.
   - 플레이어: 카드 No.05 다크 어쌔신 스프라이트 (`cards1.png`).
   - 3개 스테이지 페이크 기믹, 퓨어 탭 점프 연동 완료.
6. **No.006 Snake vs Worms (`PokiSnakeVsWormsGame.tsx`)**:
   - 피자, 버거, 도넛을 먹으며 성장하고 부스터로 상대 지렁이를 막아서 폭파시키는 배틀로얄 지렁이 게임.
   - 플레이어: 카드 No.06 드래곤 슬레이어 스프라이트 (`cards1.png`).
   - 역기구학 몸체 세그먼트 추종, 부스터 가속, 대량 음식 드롭 연동 완료.
7. **No.007 Vectaria.io (`PokiVectariaGame.tsx`)**:
   - 복셀 아레나에서 마법 탄환을 쏘며 크리스탈을 채집하고 3개 웨이브의 적 전사를 소탕하는 슈팅 게임.
   - 플레이어: 카드 No.07 라이트닝 나이트 스프라이트 (`cards1.png`).
   - 원터치 조준 마법 발사 & 드래그 이동 연동 완료.
8. **No.008 Cryzen.io (`PokiCryzenGame.tsx`)**:
   - 엄폐물 뒤에서 출현하는 적 저격수를 반격 전에 원터치 탭하여 사살하는 전술 FPS 스나이핑 게임.
   - 플레이어: 카드 No.08 프로스트 아처 스프라이트 (`cards1.png`).
   - 헤드샷 보너스 판정, 조준 카운트다운 게이지, 탄약 재장전 시스템 연동 완료.
9. **No.009 Blocky Blast Puzzle (`PokiBlockyBlastGame.tsx`)**:
   - 8x8 그리드에 테트리스 모양 블록들을 드래그 앤 드롭하여 가로/세로 줄을 연쇄 폭파시키는 대히트 퍼즐.
   - 플레이어: 카드 No.09 블레이즈 버서커 스프라이트 (`cards1.png`).
   - 실시간 격자 스냅 판정, 멀티 라인 폭파 파티클 & 콤보 연동 완료.
10. **No.010 Ragdoll Chaos (`PokiRagdollChaosGame.tsx`)**:
    - 래그돌 영웅을 자유롭게 잡고 던져 범퍼(⚡), 폭발물(💥), 포털(🌀)에 연속 충돌시키는 물리 샌드박스.
    - 플레이어: 카드 No.10 섀도우 네크로맨서 스프라이트 (`cards1.png`).
    - 래그돌 각운동량 및 탄성 물리 충돌, 슬링샷 투척 조작 연동 완료.

---

## Phase 2 상세 작업 내역 (No.011 ~ No.020)

11. **No.011 Rainbow Obby (`PokiRainbowObbyGame.tsx`)**:
    - 공중에 떠 있는 7색 무지개 발판을 순차 도약하여 고공 정상 결승선에 도달하는 정통 오비 파쿠르.
    - 플레이어: 카드 No.11 성스러운 성기사 스프라이트 (`cards1.png`).
    - 원터치 탭 점프 & 좌우 수평 드래그 조타, 추락 시 체크포인트 리스폰 연동 완료.
12. **No.012 My Perfect Hotel (`PokiMyHotelGame.tsx`)**:
    - 프론트 데스크 손님 체크인, 퇴실 객실 청소 및 화장실 소독, 현금 수거 및 룸 확장을 진행하는 호텔 타이쿤.
    - 플레이어: 카드 No.12 홀리 프리스트 스프라이트 (`cards1.png`).
    - 원터치 드래그 이동 기반 자동 상호작용 및 수익 1,000점 경영 클리어 연동 완료.
13. **No.013 Talking Tom Gold Run (`PokiTalkingTomGoldRunGame.tsx`)**:
    - 도둑 라쿤을 추격하며 3개 레인에서 장애물/바리케이드를 점프/회피하고 골드바를 수집하는 고속 3레인 러너.
    - 플레이어: 카드 No.13 샤이닝 엔젤 스프라이트 (`cards1.png`).
    - 좌우 스와이프 레인 이동 & 상향 스와이프 점프, 금괴 35개 수집 연동 완료.
14. **No.014 Monkey Tag IO (`PokiMonkeyTagGame.tsx`)**:
    - 울창한 정글 캐노피 나무 위에서 감염 술래 원숭이를 피해 도망치거나, 술래가 되었을 때 상대에게 태그를 넘기는 멀티플레이 io.
    - 플레이어: 카드 No.14 대지 골렘 스프라이트 (`cards1.png`).
    - 원터치 드래그 스윙 & 바나나 부스터, 30초 생존 경쟁 연동 완료.
15. **No.015 Stickman Battle (`PokiStickmanBattleGame.tsx`)**:
    - 래그돌 물리 관절을 가진 스틱맨 검사들이 검을 휘두르며 결투를 벌이는 1:1 아레나 격투 액션.
    - 플레이어: 카드 No.15 블러드 나이트 스프라이트 (`cards1.png`).
    - 터치 드래그 각속도 칼날 휘두르기, 급소 타격 데미지, 5명 연속 토너먼트 격파 연동 완료.
16. **No.016 Decor Life (`PokiDecorLifeGame.tsx`)**:
    - 방별 가구 택배 박스를 탭하여 개봉하고, 가구/소품을 실내 점선 슬롯에 맞추어 드래그 배치하는 감성 인테리어 퍼즐.
    - 플레이어: 카드 No.16 섀도우 닌자 스프라이트 (`cards1.png`).
    - 탭 언박싱 & 드래그 앤 드롭 방 꾸미기, 침실/거실 2스테이지 연동 완료.
17. **No.017 Neon Challenge Legends (`PokiNeonChallengeGame.tsx`)**:
    - 비트와 리듬에 반응하는 형광 사이버 네온 타일 위를 정확한 타이밍에 탭/점프하여 콤보를 잇는 리듬 러너.
    - 플레이어: 카드 No.17 플레임 소서러 스프라이트 (`cards1.png`).
    - 원터치 비트 탭 점프 & 네온 충격파 파티클, 20연속 콤보 연동 완료.
18. **No.018 Plonky (`PokiPlonkyGame.tsx`)**:
    - 회전하는 타워 링의 열린 틈새를 향해 동글동글 플롱키 캐릭터를 안전하게 낙하시키는 헬릭스 스타일 드롭 아케이드.
    - 플레이어: 카드 No.18 윈드 레인저 스프라이트 (`cards1.png`).
    - 좌우 드래그 회전 조향 & 보석 수집, 3층 심층 낙하 클리어 연동 완료.
19. **No.019 Backrooms Recovery (`PokiBackroomsRecoveryGame.tsx`)**:
    - 기묘한 옐로우 벽지 미로에서 제한된 배터리의 손전등을 켜고, 배회하는 그림자 엔티티를 피해 3개 비상 키카드를 회수하여 탈출하는 호러 어드벤처.
    - 플레이어: 카드 No.19 어스 퀘이커 스프라이트 (`cards1.png`).
    - 퓨어 탭/드래그 시야 이동, 손전등 비네팅 & 심장박동 적 경고, 키카드 3개 수집 후 EXIT 개방 연동 완료.
20. **No.020 Stickman Hook (`PokiStickmanHookGame.tsx`)**:
    - 공중 앵커 포인트에 로프를 걸고 원심력 진자 스윙과 탄력 점프로 장애물을 넘어 결승선까지 주파하는 글로벌 메가히트 스킬 액션.
    - 플레이어: 카드 No.20 라이트닝 로드 스프라이트 (`cards1.png`).
    - 롱탭 로프 그래플링 & 릴리즈 점프 물리, 트램펄린 바운스, 결승선 통과 연동 완료.

