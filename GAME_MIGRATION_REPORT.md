# SNSHero Poki 110선 미션 게임 전면 전환 전체 보고서 (GAME_MIGRATION_REPORT.md)

- **프로젝트**: SNSHero Revolution (웹 카드 배틀 & 아케이드 미션 게임)
- **전환 목표**: `http://localhost:3000/play`의 110개 미션 게임을 글로벌 웹게임 플랫폼 Poki 인기 Top 110 게임으로 100% 전면 교체
- **5대 핵심 원칙**:
  1. **일관된 디자인**: Monospace 글꼴, 웜크림/잉크 톤, 1px 헤어라인 보더, `MinimalistMissionHUD` 통일
  2. **일관된 터치/조작**: 가상 D-패드 100% 배제, 모바일 퓨어 제스처 (스와이프, 드래그, 탭) 원핸드 플레이
  3. **일관된 보상 체계**: `standardizedRewardGateway.ts` 경유 20~50 SNS 포인트 공정 지급 및 `VictoryRewardModal`
  4. **일관된 그래픽 엔진**: HTML5 Canvas 2D 60fps 부드러운 애니메이션 및 파티클
  5. **SNSHero 캐릭터 연동**: `drawCardSprite` 기반 `cards1.png`, `cards2.png` 영웅/몬스터 스프라이트 100% 적용
- **전체 진행 현황**: **110 / 110 완료 (100.0% 전수 완료!)**

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
| No.021 | **[Steal a Brainrot](https://poki.com/kr/g/steal-a-brainrot)** | 어드벤쳐 게임, 멀티플레이어 게임 | 카드 No.21 그림자 도둑 | 원터치 탭/드래그 잠입 & 안전지대 질주 | 20~50 SNS | ✅ 완료 (Canvas 2D, CCTV 경비망 잠입 및 트로피 탈취) |
| No.022 | **[Longcat](https://poki.com/kr/g/longcat)** | 두뇌 게임, 스킬 게임 | 카드 No.22 롱캣 고양이 | 상하좌우 스와이프 롱캣 스트레치 | 20~50 SNS | ✅ 완료 (Canvas 2D, 100% 그리드 채우기 한붓그리기) |
| No.023 | **[Guns Guns Guns](https://poki.com/kr/g/guns-guns-guns)** | 슈팅 게임, 총 게임 | 카드 No.23 전술 특전사 | 탭 엄폐 이동 & 적군 타깃 탭 사격 | 20~50 SNS | ✅ 완료 (Canvas 2D, 전술 아레나 3:3 엄폐 총격전) |
| No.024 | **[Ragdoll Hit](https://poki.com/kr/g/ragdoll-hit)** | 액션 게임, 랙돌 게임 | 카드 No.24 격투 챔피언 | 터치 드래그 반동 스윙 & 래그돌 넉아웃 | 20~50 SNS | ✅ 완료 (Canvas 2D, 물리 래그돌 3명 연속 KO 격투) |
| No.025 | **[Soccer REAL](https://poki.com/kr/g/soccer-real)** | 운동 게임, 축구 게임 | 카드 No.25 스트라이커 | 슬링샷 터치 드래그 슛 조준 & 발사 | 20~50 SNS | ✅ 완료 (Canvas 2D, 수비수/골키퍼 뚫는 3골 축구) |
| No.026 | **[Subway Surfers](https://poki.com/kr/g/subway-surfers)** | 액션 게임, 어드벤쳐 게임 | 카드 No.26 서프 러너 | 4방향 스와이프 레인 이동, 점프, 구르기 | 20~50 SNS | ✅ 완료 (Canvas 2D, 3선로 기차 회피 & 35코인 러너) |
| No.027 | **[Master Chess](https://poki.com/kr/g/master-chess)** | 두뇌 게임, 보드 게임 | 카드 No.27 체스 마스터 | 기물 탭 후 하이라이트 행마 칸 탭 | 20~50 SNS | ✅ 완료 (Canvas 2D, 정통 체스 룰 AI 체크메이트) |
| No.028 | **[Perfect Shape](https://poki.com/kr/g/perfect-shape)** | 스킬 게임, 달리기 게임 | 카드 No.28 마법 화가 | 원터치 드로잉 후 손 떼기 판정 | 20~50 SNS | ✅ 완료 (Canvas 2D, 원/삼각/사각 75%+ 정밀도 판정) |
| No.029 | **[Murder](https://poki.com/kr/g/murder)** | 액션 게임, 어드벤쳐 게임 | 카드 No.29 왕실 암살자 | 롱탭 단검 들기 & 릴리즈 시치미/뒤돌기 | 20~50 SNS | ✅ 완료 (Canvas 2D, 코믹 암살 스릴러 및 왕좌 방어) |
| No.030 | **[Disaster Arena](https://poki.com/kr/g/disaster-arena)** | 액션 게임, 어드벤쳐 게임 | 카드 No.30 아레나 서바이버 | 원터치 화면 탭/드래그 회피 기동 | 20~50 SNS | ✅ 완료 (Canvas 2D, 메테오 폭격 붕괴 아레나 30초 생존) |
| No.031 | **[Slice Master](https://poki.com/kr/g/slice-master)** | 두뇌 게임, 스킬 게임 | 카드 No.31 요리 검객 | 원터치 탭 공중제비 플립 & 슬라이스 | 20~50 SNS | ✅ 완료 (Canvas 2D, 나이프 회전 절단 & 기둥 착지) |
| No.032 | **[Brain Test: Tricky Puzzles](https://poki.com/kr/g/brain-test-tricky-puzzles)** | 숨은 그림 찾기 게임, 마우스 게임 | 카드 No.32 지혜의 현자 | 드래그 결합, 탭 문지르기, 트릭 풀이 | 20~50 SNS | ✅ 완료 (Canvas 2D, 상식파괴 넌센스 두뇌 퍼즐 3제) |
| No.033 | **[Stunt Bike Extreme](https://poki.com/kr/g/stunt-bike-extreme)** | 레이싱 게임, 스킬 게임 | 카드 No.33 모토 라이더 | 탭 가속 스로틀 & 좌우 드래그 바이크 틸트 | 20~50 SNS | ✅ 완료 (Canvas 2D, 360도 백플립 묘기 & 착지 점프) |
| No.034 | **[Sushi Party](https://poki.com/kr/g/sushi-party-io)** | 뱀 게임, 동물 게임 | 카드 No.34 미식 냥이 | 원터치 드래그 방향 조타 & 롱탭 부스터 | 20~50 SNS | ✅ 완료 (Canvas 2D, 스시 뷔페 먹방 & 상대 차단 폭파 io) |
| No.035 | **[Drive Mad](https://poki.com/kr/g/drive-mad)** | 레이싱 게임, 멀티플레이어 게임 | 카드 No.35 매드 드라이버 | 화면 우측 탭 전진 & 좌측 탭 후진 | 20~50 SNS | ✅ 완료 (Canvas 2D, 서스펜션 휠 물리 & 험로 전복 방지) |
| No.036 | **[Temple Run 2](https://poki.com/kr/g/temple-run-2)** | 액션 게임, 어드벤쳐 게임 | 카드 No.36 고대 탐험가 | 4방향 스와이프 (좌우 회전, 점프, 슬라이드) | 20~50 SNS | ✅ 완료 (Canvas 2D, 악마 원숭이 추격 & 35루비 수집) |
| No.037 | **[Escape From School](https://poki.com/kr/g/escape-from-school)** | 액션 게임, 어드벤쳐 게임 | 카드 No.37 장난꾸러기 학생 | 원터치 탭/드래그 잠입 & 교장/선생 시야 회피 | 20~50 SNS | ✅ 완료 (Canvas 2D, 교실 복도 탈출 & 3개 열쇠 탈취) |
| No.038 | **[Count War](https://poki.com/kr/g/count-war)** | 스킬 게임, 슈팅 게임 | 카드 No.38 군단 지휘관 | 좌우 수평 드래그 배수 게이트 통과 | 20~50 SNS | ✅ 완료 (Canvas 2D, 군단 증식 게이트 통과 & 보스 돌파) |
| No.039 | **[Party Time](https://poki.com/kr/g/party-time)** | 액션 게임, 플랫폼 게임 | 카드 No.39 파티 마스코트 | 원터치 탭 타이밍 점프 | 20~50 SNS | ✅ 완료 (Canvas 2D, 회전 장애물 봉 회피 25회 파티 생존) |
| No.040 | **[Punchy Guy](https://poki.com/kr/g/punchy-guy)** | 액션 게임, 마우스 게임 | 카드 No.40 펀치 복서 | 좌우 화면 탭 펀치 & 가드/회피 | 20~50 SNS | ✅ 완료 (Canvas 2D, 타이밍 카운터 펀치 3명 KO 챔피언) |
| No.041 | **[Blacktop Police Chase](https://poki.com/kr/g/blacktop-police-chase)** | 레이싱 게임, 멀티플레이어 게임 | 카드 No.41 강도 드라이버 | 화면 좌/우 터치 조타 & 롱터치 니트로 | 20~50 SNS | ✅ 완료 (Canvas 2D, 경찰차 추격 회피 & 탈옥범 $1,000 이송) |
| No.042 | **[Family Life Simulator](https://poki.com/kr/g/family-life-simulator)** | 어드벤쳐 게임 | 카드 No.42 가족 가장 | [A] / [B] 선택지 탭 & 라이프 분기 | 20~50 SNS | ✅ 완료 (Canvas 2D, 10대 인생 마일스톤 가족 화목도 300pt) |
| No.043 | **[Petnest.io](https://poki.com/kr/g/petnest-io)** | 동물 게임, 멀티플레이어 게임 | 카드 No.43 동물 구조대원 | 원터치 드래그 이동 & 보금자리 유도 | 20~50 SNS | ✅ 완료 (Canvas 2D, 강아지/고양이/토끼 구조 & 1,000pt 힐링) |
| No.044 | **[Cuboy Adventure](https://poki.com/kr/g/cuboy-adventure)** | 스킬 게임, 플랫폼 게임 | 카드 No.44 큐브 모험가 | 화면 상단 탭 2단점프 & 하단 좌우 이동 | 20~50 SNS | ✅ 완료 (Canvas 2D, 가시/무빙 플랫폼 돌파 & 별 3개 포털) |
| No.045 | **[Bubble Storm](https://poki.com/kr/g/bubble-storm)** | 스킬 게임, 퍼즐 게임 | 카드 No.45 버블 캐논포 | 드래그 조준선 정렬 & 손 떼기 발사 | 20~50 SNS | ✅ 완료 (Canvas 2D, 3매칭 연쇄 폭파 & 30버블 클리어) |
| No.046 | **[Kick The Buddy](https://poki.com/kr/g/kick-the-buddy)** | 랙돌 게임 | 카드 No.46 래그돌 버디 | 화면 터치 타격 & 하단 4종 도구 선택 | 20~50 SNS | ✅ 완료 (Canvas 2D, 펀치/다트/폭탄/전기 1,500pt 스트레스 해소) |
| No.047 | **[Count Control Legends](https://poki.com/kr/g/count-control-legends)** | 두뇌 게임, 스킬 게임 | 카드 No.47 군단 지휘관 | 좌우 수평 드래그 증식 게이트 조타 | 20~50 SNS | ✅ 완료 (Canvas 2D, 배수 관문 군단 증식 & 50명 성 함락) |
| No.048 | **[Repuls.io](https://poki.com/kr/g/repuls-io)** | 액션 게임, 멀티플레이어 게임 | 카드 No.48 사이버 워리어 | 터치/드래그 이동 & 자동 조준 플라즈마 사격 | 20~50 SNS | ✅ 완료 (Canvas 2D, SF 아레나 사이버 드론 10킬 제압) |
| No.049 | **[Shenzhen Mahjong](https://poki.com/kr/g/shenzhen-mahjong)** | 두뇌 게임, 마작 게임 | 카드 No.49 마작 도사 | 패 탭 선택 & 짝맞추기 매칭 | 20~50 SNS | ✅ 완료 (Canvas 2D, 24개 패 12쌍 매칭 보드 클리어) |
| No.050 | **[Beauty Salon](https://poki.com/kr/g/beauty-salon)** | 옷입히기 게임, 뷰티 게임 | 카드 No.50 뷰티 스타일리스트 | 스펀지 드래그 세안 & 뷰티 도구 탭 | 20~50 SNS | ✅ 완료 (Canvas 2D, 클렌징/헤어/메이크업/드레스업 4단계) |
| No.051 | **[Super Dress](https://poki.com/kr/g/super-dress)** | 옷입히기 게임, 패션 게임 | 카드 No.51 런웨이 모델 | 헤어/가운/악세/슈즈 탭 코디네이션 | 20~50 SNS | ✅ 완료 (Canvas 2D, 갈라 레드카펫 100점 런웨이 데뷔) |
| No.052 | **[Karate Fighter](https://poki.com/kr/g/karate-fighter)** | 액션 게임, 스킬 게임 | 카드 No.52 가라데 사범 | 탭 정권/발차기 & 경고 시 가드 패링 | 20~50 SNS | ✅ 완료 (Canvas 2D, 도장 블랙벨트 3인 연속 KO 제패) |
| No.053 | **[Planet Destruction](https://poki.com/kr/g/planet-destruction)** | 마우스 게임, 시뮬레이션 게임 | 카드 No.53 은하 사령관 | 행성 터치 4종 초병기 폭격 | 20~50 SNS | ✅ 완료 (Canvas 2D, 운석/레이저/핵/함선 100% 행성 분쇄) |
| No.054 | **[You Monster!](https://poki.com/kr/g/you-monster)** | 액션 게임, 어드벤쳐 게임 | 카드 No.54 카이주 괴수 | 터치/드래그 도심 파괴 & 탱크 분쇄 | 20~50 SNS | ✅ 완료 (Canvas 2D, 빌딩 분쇄 거대화 & 1,000pt 점령) |
| No.055 | **[SatisBox Mini Games](https://poki.com/kr/g/satisbox-mini-games)** | 두뇌 게임, 퍼즐 게임 | 카드 No.55 정리정돈 달인 | 드래그 앤 드롭 점선 슬롯 맞춤 | 20~50 SNS | ✅ 완료 (Canvas 2D, 필통/도시락/오거나이저 3단계 힐링) |
| No.056 | **[Soccer Skills 2 World Cup](https://poki.com/kr/g/soccer-skills-2-world-cup)** | 운동 게임, 축구 게임 | 카드 No.56 국가대표 스트라이커 | 슬링샷 조준선 궤적 감아차기 | 20~50 SNS | ✅ 완료 (Canvas 2D, 8강/4강/결승 2골 돌파 월드컵 우승) |
| No.057 | **[Dino Simulator](https://poki.com/kr/g/dino-simulator)** | 동물 게임, 시뮬레이션 게임 | 카드 No.57 티라노사우루스 | 터치/드래그 쥐라기 사냥 & 랩터 격퇴 | 20~50 SNS | ✅ 완료 (Canvas 2D, 밀림 서바이벌 먹방 1,000pt 포식자) |
| No.058 | **[Tear Blocks Down](https://poki.com/kr/g/tear-blocks-down)** | 액션 게임, 좀비 게임 | 카드 No.58 공성 포병대장 | 대포 뒤로 당겨 각도/파워 조절 발사 | 20~50 SNS | ✅ 완료 (Canvas 2D, 블록 타워 물리 붕괴 & 좀비 전멸 3단계) |
| No.059 | **[Red Ball 4](https://poki.com/kr/g/red-ball-4)** | 액션 게임, 어드벤쳐 게임 | 카드 No.59 레드볼 | 좌우 이동 & 상단 탭 바운스 점프 | 20~50 SNS | ✅ 완료 (Canvas 2D, 큐브 몬스터 스톰프 & 별 3개 골인) |
| No.060 | **[Tank Stars](https://poki.com/kr/g/tank-stars)** | 액션 게임, 전쟁 게임 | 카드 No.60 기갑 전차장 | 조준 드래그 각도 조절 & FIRE 발사 | 20~50 SNS | ✅ 완료 (Canvas 2D, 곡사포 탄도학 & 적 전차 100% 폭파) |
| No.061 | **[Magic Battleground](https://poki.com/kr/g/magic-battleground)** | 액션 게임, 랙돌 게임 | 카드 No.61 아케인 마법사 | 조준 드래그 & 스펠(화염/빙결/전격) 전환 | 20~50 SNS | ✅ 완료 (Canvas 2D, 아레나 링아웃/마법탄 3KO) |
| No.062 | **[Blast Buddies](https://poki.com/kr/g/blast-buddies)** | 액션 게임, 멀티플레이어 게임 | 카드 No.62 블래스터 | 스와이프 이동 & 탭 폭탄 설치 | 20~50 SNS | ✅ 완료 (Canvas 2D, 상자 폭파 파워업 & 적 2KO) |
| No.063 | **[Sword Masters](https://poki.com/kr/g/sword-masters)** | 어드벤쳐 게임, 스킬 게임 | 카드 No.63 소드 마스터 | 터치/드래그 이동 & 소드 스톰 탭 | 20~50 SNS | ✅ 완료 (Canvas 2D, 몬스터 20마리 & 데몬로드 격파) |
| No.064 | **[Sprint League](https://poki.com/kr/g/sprint-league)** | 레이싱 게임, 운동 게임 | 카드 No.64 스프린트 챔피언 | 좌/우 발 번갈아 탭 & 점프 버튼 | 20~50 SNS | ✅ 완료 (Canvas 2D, 허들 도약 & 100m 1위 주파) |
| No.065 | **[Real City Bikes](https://poki.com/kr/g/real-city-bikes)** | 레이싱 게임, 오토바이 게임 | 카드 No.65 시티 라이더 | 좌우 스와이프 차선 & 롱터치 부스터 | 20~50 SNS | ✅ 완료 (Canvas 2D, 차량 니어미스 5회 & 2,000m 완주) |
| No.066 | **[Hills of Steel](https://poki.com/kr/g/hills-of-steel)** | 어드벤쳐 게임, 전쟁 게임 | 카드 No.66 강철 전차 | 좌우 탭 전/후진 & 공중 폭격 지원 | 20~50 SNS | ✅ 완료 (Canvas 2D, 언덕 물리 & 전차4/헬기2 전멸) |
| No.067 | **[Rail in the Air](https://poki.com/kr/g/rail-in-the-air)** | 시뮬레이션 게임, 운전 게임 | 카드 No.67 열차 기관사 | 순항/풀가속 탭 & 비상 제동 정차 | 20~50 SNS | ✅ 완료 (Canvas 2D, 커브 감속 & 3개역 승객 수송) |
| No.068 | **[Monkey Mart](https://poki.com/kr/g/monkey-mart)** | 쇼핑 게임, 동물 게임 | 카드 No.68 마켓 원숭이 | 터치/드래그 오토 수확·진열·수거 | 20~50 SNS | ✅ 완료 (Canvas 2D, 바나나/옥수수 30판매 & $500) |
| No.069 | **[Carnado Stunt Car](https://poki.com/kr/g/carnado-stunt-car)** | 레이싱 게임, 자동차 게임 | 카드 No.69 스턴트 드라이버 | 터치 가속 & 공중 스와이프 수평 조절 | 20~50 SNS | ✅ 완료 (Canvas 2D, 360도 공중제비 묘기 & 1,500점) |
| No.070 | **[Diva Hair Salon](https://poki.com/kr/g/diva-hair-salon)** | 장식 게임, 옷입히기 게임 | 카드 No.70 헤어 디자이너 | 도구 선택 & 모발 드래그 스타일링 | 20~50 SNS | ✅ 완료 (Canvas 2D, 샴푸/드라이/커트/염색 4단계) |
| No.071 | **[Scary Teacher Hide & Seek Games](https://poki.com/kr/g/scary-teacher-hide-seek-games)** | 어드벤쳐 게임 | 카드 No.71 은신 잠입자 | 터치 이동 & 은신처 탭 숨기 | 20~50 SNS | ✅ 완료 (Canvas 2D, 시야 회피 잠입 & 3대 비밀 아이템) |
| No.072 | **[Supercar Legends](https://poki.com/kr/g/supercar-legends)** | 마우스 게임, 자동차 게임 | 카드 No.72 슈퍼카 레이서 | 좌우 스와이프 차선 & 니트로 부스터 | 20~50 SNS | ✅ 완료 (Canvas 2D, 3차선 서킷 3랩 1위 주파) |
| No.073 | **[Nails DIY: Manicure Master](https://poki.com/kr/g/nails-diy-manicure-master)** | 옷입히기 게임, 뷰티 게임 | 카드 No.73 네일 아티스트 | 컬러/스티커 선택 & 손톱 터치 아트 | 20~50 SNS | ✅ 완료 (Canvas 2D, 5개 손톱 DIY 매니큐어 살롱) |
| No.074 | **[Ping Pong Go!](https://poki.com/kr/g/ping-pong-go)** | 스킬 게임, 마우스 게임 | 카드 No.74 핑퐁 챔피언 | 수직 드래그 패들 & 스매시 반격 | 20~50 SNS | ✅ 완료 (Canvas 2D, 고속 랠리 & 5점 선취 승리) |
| No.075 | **[Color Artist](https://poki.com/kr/g/color-artist)** | 장식 게임, 그리기 게임 | 카드 No.75 픽셀 아티스트 | 번호 매칭 컬러 탭 채색 | 20~50 SNS | ✅ 완료 (Canvas 2D, 영웅 도안 8구역 100% 페인팅) |
| No.076 | **[Going Up Rooftop](https://poki.com/kr/g/going-up-rooftop)** | 어드벤쳐 게임, 플랫폼 게임 | 카드 No.76 루프탑 러너 | 좌우 이동 & 탭 점프 / 벽점프 | 20~50 SNS | ✅ 완료 (Canvas 2D, 50m 고층 빌딩 파쿠르 헬리패드) |
| No.077 | **[Stickman Dragon Fight](https://poki.com/kr/g/stickman-dragon-fight)** | 액션 게임, 어드벤쳐 게임 | 카드 No.77 드래곤 파이터 | 터치 비행 이동 & 콤보 / 드래곤 빔 | 20~50 SNS | ✅ 완료 (Canvas 2D, 공중 격투 & 악의 전사 2명 KO) |
| No.078 | **[Dog's Life](https://poki.com/kr/g/dogs-life)** | 동물 게임, 멀티플레이어 게임 | 카드 No.78 강아지 | 터치 산책 이동 & 짖기 / 허들 점프 | 20~50 SNS | ✅ 완료 (Canvas 2D, 공원 모험 & 황금 뼈다귀 5개 수집) |
| No.079 | **[Anycolor](https://poki.com/kr/g/anycolor)** | 스킬 게임, 장식 게임 | 카드 No.79 일러스트레이터 | 번호 팔레트 선택 & 파츠 터치 채색 | 20~50 SNS | ✅ 완료 (Canvas 2D, 레트로 팝아트 10개 파츠 100%) |
| No.080 | **[Scary Teacher 3D](https://poki.com/kr/g/scary-teacher-3d)** | 액션 게임, 두뇌 게임 | 카드 No.80 장난 천재 | 잠입 이동 & 3대 장난 설치 & EXIT 탈출 | 20~50 SNS | ✅ 완료 (Canvas 2D, 저택 침투 트릭 & 현관 탈출) |
| No.081 | **[Penalty Shooters 2](https://poki.com/kr/g/penalty-shooters-2)** | 운동 게임, 스킬 게임 | 카드 No.81 페널티 키커 | 슬링샷 슈팅 & 키퍼 드래그 선방 | 20~50 SNS | ✅ 완료 (Canvas 2D, 승부차기 3라운드 토너먼트 우승) |
| No.082 | **[Boomy World](https://poki.com/kr/g/boomy-world)** | 액션 게임, 두뇌 게임 | 카드 No.82 폭파 마스터 | 폭탄 배치 & 격발 연쇄 폭발 | 20~50 SNS | ✅ 완료 (Canvas 2D, 화약통 연쇄 반응 10몬스터 폭파) |
| No.083 | **[SnapStyle Dress Up](https://poki.com/kr/g/snapstyle-dress-up)** | 옷입히기 게임, 패션 게임 | 카드 No.83 패션 인플루언서 | 5개 파츠 스타일링 & 셔터 촬영 | 20~50 SNS | ✅ 완료 (Canvas 2D, 100점 매거진 표지 스냅샷) |
| No.084 | **[Fashion Legends](https://poki.com/kr/g/fashion-legends)** | 옷입히기 게임, 메이크업 게임 | 카드 No.84 캣워크 모델 | 좌우 스와이프 의상 게이트 수집 | 20~50 SNS | ✅ 완료 (Canvas 2D, 런웨이 워킹 80점 이상 심사 우승) |
| No.085 | **[Vortella's Dress Up](https://poki.com/kr/g/vortellas-dress-up)** | 옷입히기 게임, 마우스 게임 | 카드 No.85 고딕 마녀 | 4개 마법 파츠 코디 & 주술 각성 | 20~50 SNS | ✅ 완료 (Canvas 2D, 고딕 마녀 100% 룬 주술 시전) |
| No.086 | **[MR RACER - Car Racing](https://poki.com/kr/g/mr-racer-car-racing)** | 액션 게임, 스킬 게임 | 카드 No.86 레이서 | 좌우 차선 이동 & 니트로 부스터 | 20~50 SNS | ✅ 완료 (Canvas 2D, 4차선 고속도로 1,500m 질주) |
| No.087 | **[School Cleaning](https://poki.com/kr/g/school-cleaning)** | 마우스 게임, 자동차 게임 | 카드 No.87 환경 반장 | 쓰레기 탭 & 칠판 닦기 & 책상 정렬 | 20~50 SNS | ✅ 완료 (Canvas 2D, 방과 후 교실 100% 정리정돈) |
| No.088 | **[Hill Climb Racing Lite](https://poki.com/kr/g/hill-climb-racing-lite)** | 레이싱 게임, 스킬 게임 | 카드 No.88 오프로드 드라이버 | 가속/브레이크 차량 밸런스 조절 | 20~50 SNS | ✅ 완료 (Canvas 2D, 2D 물리 구릉 지형 300m 언덕 완주) |
| No.089 | **[Stickman Crazy Box](https://poki.com/kr/g/stickman-crazy-box)** | 액션 게임, 스킬 게임 | 카드 No.89 스틱맨 파이터 | 좌우 회피 & 점프 도약 & 스타 수집 | 20~50 SNS | ✅ 완료 (Canvas 2D, 낙하 상자 회피 & 황금 스타 8개) |
| No.090 | **[Goods Master](https://poki.com/kr/g/goods-master)** | 두뇌 게임, 퍼즐 게임 | 카드 No.90 마켓 매니저 | 선반 상품 탭 & 카트 3매칭 정리 | 20~50 SNS | ✅ 완료 (Canvas 2D, 편의점 선반 3세트 100% 클리어) |
| No.091 | **[Hexellent](https://poki.com/kr/g/hexellent)** | 두뇌 게임, 마우스 게임 | 카드 No.91 헥사 마스터 | 동일 색상 인접 육각 블록 탭 연쇄 폭발 | 20~50 SNS | ✅ 완료 (Canvas 2D, 육각 블록 콤보 1,000pt) |
| No.092 | **[Harvest Simulator](https://poki.com/kr/g/harvest-simulator)** | 시뮬레이션 게임, 농장 게임 | 카드 No.92 농부 드라이버 | 콤바인 주행 수확 & 저장고 하역 | 20~50 SNS | ✅ 완료 (Canvas 2D, 밀/해바라기 수확 & $500 수익) |
| No.093 | **[Car Circle](https://poki.com/kr/g/car-circle)** | 두뇌 게임, 스킬 게임 | 카드 No.93 교통 관제관 | 원형 교차로 타이밍 탭 합류 | 20~50 SNS | ✅ 완료 (Canvas 2D, 로터리 무사고 차량 12대 합류) |
| No.094 | **[Phone CASE DIY](https://poki.com/kr/g/phone-case-diy)** | 장식 게임, 그리기 게임 | 카드 No.94 케이스 디자이너 | 스프레이 도색 & 드라이 & 스티커 데코 | 20~50 SNS | ✅ 완료 (Canvas 2D, 3단계 케이스 DIY 완성) |
| No.095 | **[Soccer League](https://poki.com/kr/g/soccer-league)** | 운동 게임, 스킬 게임 | 카드 No.95 풋살 챔피언 | 드리블 & 슬링샷 패스/슈팅 | 20~50 SNS | ✅ 완료 (Canvas 2D, 3v3 실시간 풋살 3골 승리) |
| No.096 | **[Capitalist Bus Driver](https://poki.com/kr/g/capitalist-bus-driver)** | 시뮬레이션 게임, 버스 게임 | 카드 No.96 버스 운전사 | 차선 변경 & 정류장 승객 탑승 수송 | 20~50 SNS | ✅ 완료 (Canvas 2D, 도심-해변 20명 승객 수송) |
| No.097 | **[EvoWorld io (FlyOrDie io)](https://poki.com/kr/g/flyordie-io)** | 스킬 게임, 마우스 게임 | 카드 No.97 에보 크리처 | 터치 비행 조타 & 먹이 섭취 진화 | 20~50 SNS | ✅ 완료 (Canvas 2D, 파리에서 피닉스 드래곤 최종 진화) |
| No.098 | **[Bullet Bros](https://poki.com/kr/g/bullet-bros)** | 액션 게임, 플랫폼 게임 | 카드 No.98 불릿 브라더 | 도탄 물리 궤적 조준 & 발사 | 20~50 SNS | ✅ 완료 (Canvas 2D, 리코셰 총탄 적 소탕 3개 스테이지) |
| No.099 | **[Perfect Landing, Plane Pilot](https://poki.com/kr/g/perfect-landing-plane-pilot)** | 스킬 게임, 시뮬레이션 게임 | 카드 No.99 파일럿 기장 | 상하 피치 제어 터빈 회피 & 착륙 | 20~50 SNS | ✅ 완료 (Canvas 2D, 활주로 완벽 터치다운 3회 성공) |
| No.100 | **[Undead Slayer](https://poki.com/kr/g/undead-slayer)** | 액션 게임, 스킬 게임 | 카드 No.100 언데드 슬레이어 | 터치 이동 연속 검격 & 회전 참격 스킬 | 20~50 SNS | ✅ 완료 (Canvas 2D, 언데드 군단 25마리 및 보스 토벌) |

| No.101 | **[Watermelon Drop](https://poki.com/kr/g/watermelon-drop)** | 두뇌 게임, 스킬 게임 | 카드 No.101 과일 마스터 | 터치 드래그 조준 & 과일 투하 머지 | 20~50 SNS | ✅ 완료 (Canvas 2D, 수박게임 물리 머지 800pt) |
| No.102 | **[Kawaii Fruits 3D](https://poki.com/kr/g/kawaii-fruits-3d)** | 두뇌 게임, 스킬 게임 | 카드 No.102 카와이 아티스트 | 깜빡이는 표정 과일 투하 & 10회 합성 | 20~50 SNS | ✅ 완료 (Canvas 2D, 귀여운 과일 10회 머지 콤보) |
| No.103 | **[Blumgi Bounce](https://poki.com/kr/g/blumgi-bounce)** | 스킬 게임, 농구 게임 | 카드 No.103 블룸기 바운서 | 슬링샷 각도 조절 & 바운스 농구 슛 | 20~50 SNS | ✅ 완료 (Canvas 2D, 플랫폼 바운스 농구 5골 득점) |
| No.104 | **[Brain Test 5](https://poki.com/kr/g/brain-test-5)** | 퍼즐 게임, 두뇌 게임 | 카드 No.104 브레인 마스터 | 사물 터치/드래그 상식 파괴 넌센스 | 20~50 SNS | ✅ 완료 (Canvas 2D, 3개 넌센스 트릭 퍼즐 돌파) |
| No.105 | **[Blumgi Merge](https://poki.com/kr/g/blumgi-merge)** | 어드벤쳐 게임, 마우스 게임 | 카드 No.105 블룸기 테이머 | 그리드 크리처 드래그 머지 & 보스전 | 20~50 SNS | ✅ 완료 (Canvas 2D, 크리처 진화 & 보스 500HP 격파) |
| No.106 | **[Stickman Climb 3D](https://poki.com/kr/g/stickman-climb-3d)** | 스킬 게임, 플랫폼 게임 | 카드 No.106 스틱맨 클라이머 | 곡괭이 원형 회전 & 바위 지렛대 도약 | 20~50 SNS | ✅ 완료 (Canvas 2D, 피지컬 등반 100m 정상 정복) |
| No.107 | **[Brain Test Special](https://poki.com/kr/g/brain-test-special)** | 퍼즐 게임, 두뇌 게임 | 카드 No.107 천재 탐정 | 구름 치우기 & UFO 돔 열기 & 자물쇠 | 20~50 SNS | ✅ 완료 (Canvas 2D, 스페셜 두뇌 퍼즐 3스테이지 돌파) |
| No.108 | **[11-11](https://poki.com/kr/g/11-11)** | 두뇌 게임, 블록 게임 | 카드 No.108 일레븐 마스터 | 11x11 그리드 블록 배치 & 라인 제거 | 20~50 SNS | ✅ 완료 (Canvas 2D, 11줄 라인 클리어 600pt 달성) |
| No.109 | **[Blumgi Slime](https://poki.com/kr/g/blumgi-slime)** | 스킬 게임, 플랫폼 게임 | 카드 No.109 블룸기 슬라임 | 롱탭 탄성 충전 점프 & 에어 슬램 | 20~50 SNS | ✅ 완료 (Canvas 2D, 가시 트랩 회피 300m 결승 완주) |
| No.110 | **[Obby Roads](https://poki.com/kr/g/obby-roads)** | 레이싱 게임, 멀티플레이어 게임 | 카드 No.110 오비 레전드 | 좌우 터치 조향 & 롤러 회피 고공 질주 | 20~50 SNS | ✅ 완료 (Canvas 2D, 공중 로드 레이스 500m 피니시) |


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

---

## Phase 3-A 상세 작업 내역 (No.021 ~ No.030)

21. **No.021 Steal a Brainrot (`PokiStealBrainrotGame.tsx`)**:
    - 경비 로봇들의 순찰 경로와 전방 시야 콘(FOV)을 피해 적 금고의 Brainrot 트로피를 탈취하고 그린 세이프존으로 탈출하는 스텔스 잠입 액션.
    - 플레이어: 카드 No.21 그림자 도둑 스프라이트 (`cards1.png`).
    - 원터치 탭/드래그 이동 조작, 경보 발령 시 붉은 화면 점멸 및 가속 탈출 연동 완료.
22. **No.022 Longcat (`PokiLongcatGame.tsx`)**:
    - 롱캣 고양이의 머리를 상하좌우로 스와이프하여 벽이나 몸통에 닿을 때까지 몸을 늘려, 모든 빈칸을 100% 틈새 없이 채우는 두뇌 힐링 퍼즐.
    - 플레이어: 카드 No.22 롱캣 고양이 스프라이트 (`cards1.png`).
    - 퓨어 4방향 스와이프 조작, 3개 난이도 스테이지 한붓그리기 연동 완료.
23. **No.023 Guns Guns Guns (`PokiGunsGunsGunsGame.tsx`)**:
    - 콘크리트 엄폐물이 배치된 전술 아레나에서 적 분대원 3명과 교전하는 3:3 전술 총격전.
    - 플레이어: 카드 No.23 전술 특전사 스프라이트 (`cards1.png`).
    - 좌측 탭 엄폐 이동 & 우측 적 타깃 조준 사격, 30발 탄창 재장전, 적 5명 사살 승리 연동 완료.
24. **No.024 Ragdoll Hit (`PokiRagdollHitGame.tsx`)**:
    - 래그돌 물리 관절 캐릭터가 배트를 휘두르며 상대 래그돌을 쳐날리는 물리 기반 1:1 격투 배틀.
    - 플레이어: 카드 No.24 격투 챔피언 스프라이트 (`cards1.png`).
    - 터치 드래그 반동 스윙, 충돌 각속도 데미지 및 3명 연속 KO 승리 연동 완료.
25. **No.025 Soccer REAL (`PokiSoccerRealGame.tsx`)**:
    - 녹색 필드에서 골대를 가로막는 수비수와 골키퍼의 궤적을 뚫고 슛을 날리는 정밀 축구 아케이드.
    - 플레이어: 카드 No.25 스트라이커 스프라이트 (`cards1.png`).
    - 슬링샷 드래그 조준선 궤적 & 파워 슛 발사, 5회 기회 중 3골 득점 승리 연동 완료.
26. **No.026 Subway Surfers (`PokiSubwaySurfersGame.tsx`)**:
    - 달려오는 지하철 기차와 바리케이드, 상단 장애물을 피하며 끝없이 질주하는 글로벌 메가히트 3레인 러너.
    - 플레이어: 카드 No.26 서프 러너 스프라이트 (`cards1.png`).
    - 4방향 모바일 퓨어 스와이프 (좌우 레인 변경, 점프, 슬라이딩 구르기), 골드 코인 35개 수집 승리 연동 완료.
27. **No.027 Master Chess (`PokiMasterChessGame.tsx`)**:
    - 8x8 체스판에서 정통 체스 행마법(폰, 나이트, 비숍, 룩, 퀸, 킹)을 준수하며 인공지능과 두뇌 싸움을 펼치는 클래식 보드 게임.
    - 플레이어: 카드 No.27 체스 마스터 스프라이트 (`cards1.png`).
    - 기물 탭 후 유효 행마 초록 하이라이트 탭 이동, 적 기물 4개 캡처 또는 체크메이트 승리 연동 완료.
28. **No.028 Perfect Shape (`PokiPerfectShapeGame.tsx`)**:
    - 화면의 점선 가이드를 따라 완벽한 원, 삼각형, 사각형을 한 획의 붓질로 정밀하게 그리는 드로잉 챌린지.
    - 플레이어: 카드 No.28 마법 화가 스프라이트 (`cards1.png`).
    - 원터치 드로잉 후 수학적 반지름/변 오차 기반 정밀도(%) 판정, 3라운드 평균 75%+ 달성 승리 연동 완료.
29. **No.029 Murder (`PokiMurderGame.tsx`)**:
    - 왕의 뒤를 밟으며 단검을 치켜들고, 왕이 뒤돌아볼 때 시치미를 떼며 암살에 성공한 뒤, 왕이 되어 침입자를 감옥에 보내는 코믹 스릴러.
    - 플레이어: 카드 No.29 왕실 암살자 & 국왕 스프라이트 (`cards1.png`).
    - 화면 길게 누르기(단검 충전/뒤돌아보기) & 손 떼기(시치미), 암살 후 3명 방어 승리 연동 완료.
30. **No.030 Disaster Arena (`PokiDisasterArenaGame.tsx`)**:
    - 원형 경기장에 쏟아지는 하늘의 메테오 폭격과 폭발 충격파를 예측 회피하며 끝까지 버티는 배틀로얄 생존 게임.
    - 플레이어: 카드 No.30 아레나 서바이버 스프라이트 (`cards1.png`).
    - 원터치 터치/드래그 회피 기동, 붉은 낙하 표식 회피, 30초 극한 생존 승리 연동 완료.

---

## Phase 3-B 상세 작업 내역 (No.031 ~ No.040)

31. **No.031 Slice Master (`PokiSliceMasterGame.tsx`)**:
    - 공중에 떠오르고 뒤집히는 나이프를 원터치로 점프/회전시켜 오렌지, 수박, 빵, 도넛 등 다양한 대상을 자르고 기둥에 칼을 꽂으며 전진하는 글로벌 메가히트 슬라이스 아케이드.
    - 플레이어/오브젝트: 카드 No.31 요리 검객 스프라이트 (`cards1.png`).
    - 원터치 탭 공중제비 플립, 과일/오브젝트 정밀 절단 파티클 및 기둥 착지 보너스, 1,000점 달성 승리 연동 완료.
32. **No.032 Brain Test: Tricky Puzzles (`PokiBrainTestGame.tsx`)**:
    - 상식을 뒤엎는 유쾌한 트릭 질문과 물리 드래그 상호작용으로 두뇌를 자극하는 글로벌 인기 퍼즐.
    - 플레이어: 카드 No.32 지혜의 현자 스프라이트 (`cards1.png`).
    - 물체 드래그 합성, 숨은 요소 탭 문지르기, 3단계 넌센스 트릭 퀴즈 클리어 승리 연동 완료.
33. **No.033 Stunt Bike Extreme (`PokiStuntBikeExtremeGame.tsx`)**:
    - 굴곡진 산악 지형과 점프대에서 바이크의 균형과 스로틀을 조절하며 360도 공중제비 묘기를 펼치는 익스트림 모토 레이싱.
    - 플레이어: 카드 No.33 모토 라이더 스프라이트 (`cards1.png`).
    - 우측 탭 스로틀 가속 & 좌우 드래그 틸트 회전, 공중 회전 백플립 스턴 및 안전 착지, 결승선 통과 승리 연동 완료.
34. **No.034 Sushi Party (`PokiSushiPartyGame.tsx`)**:
    - 회전초밥, 마키, 롤을 먹으며 몸집을 불리고, 상대 고양이 뱀의 진로를 가로막아 스시로 폭파시켜 흡수하는 카와이 스타일 지렁이 배틀로얄.
    - 플레이어: 카드 No.34 미식 냥이 스프라이트 (`cards1.png`).
    - 원터치 드래그 방향 조타 & 롱탭 부스터 질주, 상대 뱀 차단 폭파 및 길이 1,000pt 달성 승리 연동 완료.
35. **No.035 Drive Mad (`PokiDriveMadGame.tsx`)**:
    - 험난한 오프로드와 튀어나오는 장애물 코스에서 전복되지 않도록 속도와 바퀴 서스펜션을 조절하여 완주하는 물리 트럭 챌린지.
    - 플레이어: 카드 No.35 매드 드라이버 스프라이트 (`cards1.png`).
    - 화면 우측 탭 전진 가속 & 좌측 탭 후진/제동, 차량 밸런스 물리 및 전복 방지, 3코스 완주 승리 연동 완료.
36. **No.036 Temple Run 2 (`PokiTempleRun2Game.tsx`)**:
    - 고대 사원에서 저주받은 악마 원숭이(Demon Monkey)의 추격을 피해 절벽, 외나무다리, 장애물을 질주하는 전설의 러너.
    - 플레이어: 카드 No.36 고대 탐험가 스프라이트 (`cards1.png`).
    - 4방향 모바일 퓨어 스와이프 (좌우 방향 전환, 상향 점프, 하향 슬라이딩), 루비 35개 수집 및 생존 승리 연동 완료.
37. **No.037 Escape From School (`PokiEscapeSchoolGame.tsx`)**:
    - 순찰을 도는 완고한 교장선생님과 당직 교사의 시야를 피해 교실 복도에 숨겨진 3개의 비상 열쇠를 찾아 정문으로 탈출하는 잠입 어드벤처.
    - 플레이어: 카드 No.37 장난꾸러기 학생 스프라이트 (`cards1.png`).
    - 원터치 탭/드래그 이동 & 사물함/책상 뒤 은폐, 시야각 회피 및 열쇠 3개 획득 후 교문 탈출 승리 연동 완료.
38. **No.038 Count War (`PokiCountWarGame.tsx`)**:
    - 달리는 도중 배수 게이트(+5, x2, -10 등)를 통과하여 아군 군단 수를 폭발적으로 불리고, 관문의 적 수비군과 거대 보스를 압도적인 물량으로 돌파하는 군단 전략 러너.
    - 플레이어: 카드 No.38 군단 지휘관 스프라이트 (`cards1.png`).
    - 좌우 수평 드래그로 최적의 증식 게이트 조타, 군단 병력 집결 및 적 수비대 돌파 승리 연동 완료.
39. **No.039 Party Time (`PokiPartyTimeGame.tsx`)**:
    - 흥겨운 파티 음악 속에서 시계 방향과 반시계 방향으로 불규칙하게 회전하는 장애물 봉을 점프로 뛰어넘는 파티 아케이드.
    - 플레이어: 카드 No.39 파티 마스코트 스프라이트 (`cards1.png`).
    - 원터치 탭 도약 타이밍 판정, 회전 속도 가속 페이싱 돌파, 25회 연속 회피 생존 승리 연동 완료.
40. **No.040 Punchy Guy (`PokiPunchyGuyGame.tsx`)**:
    - 링 위에서 상대 복서의 공격 패턴과 텔레그래프 모션을 읽고 타이밍에 맞춰 카운터 펀치와 위빙 가드를 날리는 타격 액션.
    - 플레이어: 카드 No.40 펀치 복서 스프라이트 (`cards1.png`).
    - 좌/우 탭 스트레이트 & 훅 타격, 중앙 탭 가드/회피, 3명의 복싱 챔피언 연속 KO 승리 연동 완료.

---

## Phase 4-A 상세 작업 내역 (No.041 ~ No.050)

41. **No.041 Blacktop Police Chase (`PokiBlacktopPoliceGame.tsx`)**:
    - 도로 위를 순찰하며 플레이어 차량을 들이받는 경찰차들을 따돌리고, 탈옥범 승객을 태워 그린 세이프존 은신처로 안전하게 이송하는 드라이빙 탈출 액션.
    - 플레이어/차량: 카드 No.41 강도 드라이버 스프라이트 (`cards1.png`).
    - 좌/우 터치 레인 조타, 화면 터치 유지 니트로 부스터 가속, 충돌 파티클 및 $1,000 은신처 이송 승리 연동 완료.
42. **No.042 Family Life Simulator (`PokiFamilyLifeGame.tsx`)**:
    - 청년기 보금자리 장만부터 황혼의 은혼식까지, 10대 인생 주요 마일스톤에서 [A]/[B] 선택지를 골라 가족의 행복, 자산, 화목도를 가꾸는 인생 시뮬레이터.
    - 플레이어: 카드 No.42 가족 가장 스프라이트 (`cards1.png`).
    - 선택지 카드 원터치 탭 조작, 실시간 3대 지표 게이지 반영, 10단계 마일스톤 완료 및 화목도 300pt 달성 승리 연동 완료.
43. **No.043 Petnest.io (`PokiPetnestGame.tsx`)**:
    - 평화로운 공원을 돌아다니는 유기견 🐶, 아기 고양이 🐱, 토끼 🐰를 구조하여 뒤를 따르게 하고, 하단의 따뜻한 보금자리 둥지로 안전하게 인도하는 동물 힐링 타이쿤.
    - 플레이어: 카드 No.43 동물 구조대원 스프라이트 (`cards1.png`).
    - 원터치 터치/드래그 이동 조작, 하트 파티클 및 1,000pt 러브 포인트 수집 보호소 확장 승리 연동 완료.
44. **No.044 Cuboy Adventure (`PokiCuboyAdventureGame.tsx`)**:
    - 가시 트랩, 공중 무빙 플랫폼, 점프대를 돌파하며 스테이지 곳곳에 숨겨진 황금 별(⭐) 3개를 모아 골 포털로 탈출하는 큐브 플랫포머.
    - 플레이어: 카드 No.44 큐브 모험가 스프라이트 (`cards1.png`).
    - 화면 상단 탭 2단 점프 & 하단 좌우 이동 제어, 별 3개 수집 및 포털 골인 승리 연동 완료.
45. **No.045 Bubble Storm (`PokiBubbleStormGame.tsx`)**:
    - 하단 캐논에서 조준선을 조절하여 같은 색상의 버블을 3개 이상 맞춰 연쇄 폭파시키는 클래식 아케이드 버블 슈터.
    - 플레이어: 카드 No.45 버블 캐논포 영웅 스프라이트 (`cards1.png`).
    - 터치 드래그 레이저 궤적 조준 & 손 떼기 발사, 3매칭 연쇄 폭파 및 30개 버블 격추 승리 연동 완료.
46. **No.046 Kick The Buddy (`PokiKickTheBuddyGame.tsx`)**:
    - 천장에 매달린 래그돌 버디 인형에게 펀치 글러브, 다트, 다이너마이트 폭탄, 전기 충격을 가하며 스트레스를 해소하는 인터랙티브 물리 샌드박스.
    - 플레이어/버디: 카드 No.46 래그돌 버디 스프라이트 (`cards1.png`).
    - 화면 터치 타격, 하단 4종 물리 도구 핫키 전환, 코인 파티클 및 1,500점 달성 승리 연동 완료.
47. **No.047 Count Control Legends (`PokiCountControlGame.tsx`)**:
    - 스틱맨 분대를 이끌고 도로 위를 질주하며 배수 게이트(+15, x2, x3 등)를 통과해 대군단을 편성하고 전방의 붉은 요새를 돌파하는 군단 제어 러너.
    - 플레이어: 카드 No.47 군단 지휘관 스프라이트 (`cards1.png`).
    - 좌우 수평 드래그 조타, 회전 톱날 장애물 회피, 50명 이상의 군단으로 최종 성채 함락 승리 연동 완료.
48. **No.048 Repuls.io (`PokiRepulsGame.tsx`)**:
    - 사이버네틱 미래 전장에서 사이버 워리어가 플라즈마 소총을 발사하여 공중 순찰 드론과 적 사이버 전투원을 제압하는 탑다운 SF 슈팅 io.
    - 플레이어: 카드 No.48 사이버 워리어 스프라이트 (`cards1.png`).
    - 터치/드래그 이동 & 자동 조준 플라즈마 사격, 에너지 실드 재생, 적 10킬 프래그 달성 승리 연동 완료.
49. **No.049 Shenzhen Mahjong (`PokiShenzhenMahjongGame.tsx`)**:
    - 녹색 모직 매트 위에 배치된 24개의 고급 마작패(홍중, 발재, 백판, 대나무, 금전 등) 중 동일한 패를 2개씩 짝지어 제거하는 전통 선전 마작 솔리테어.
   - 패 원터치 탭 선택 및 짝맞추기 판정, 대나무 스파크 파티클, 12쌍 전수 클리어 승리 연동 완료.
50. **No.050 Beauty Salon (`PokiBeautySalonGame.tsx`)**:
    - 스펀지로 얼굴의 오염을 씻어내는 클렌징부터 헤어스타일/컬러 선택, 립스틱/블러셔 메이크업, 오트쿠튀르 갈라 드레스업까지 4단계를 거쳐 완벽한 런웨이 스타로 변신시키는 뷰티 메이크오버.
    - 플레이어: 카드 No.50 뷰티 스타일리스트 스프라이트 (`cards1.png`).
    - 스펀지 드래그 클렌징 제스처 & 뷰티 팔레트 원터치 탭, 컨페티 축하 파티클 및 런웨이 데뷔 승리 연동 완료.

---

## Phase 4-B 상세 작업 내역 (No.051 ~ No.060)

51. **No.051 Super Dress (`PokiSuperDressGame.tsx`)**:
    - 헤어, 드레스 가운, 보석 목걸이, 하이힐을 원터치 탭으로 코디네이션하고 런웨이에 서는 패션 스타일링 게임.
    - 플레이어: 카드 No.51 런웨이 모델 스프라이트 (`cards2.png`).
    - 4개 파츠별 4종 아이템 탭 조합, 완성도 판정 및 100점 런웨이 축하 폭죽 연동 완료.
52. **No.052 Karate Fighter (`PokiKarateFighterGame.tsx`)**:
    - 도장에서 사범과 수련생들이 정권 지르기와 돌려차기를 교환하고 적의 일격을 가드로 패링하는 격투 액션.
    - 플레이어: 카드 No.52 가라데 사범 스프라이트 (`cards2.png`).
    - 좌/우 펀치·킥 타격 탭 & 붉은 경고 시 방어 패링, 3인 연속 KO 승리 연동 완료.
53. **No.053 Planet Destruction (`PokiPlanetDestructionGame.tsx`)**:
    - 우주 궤도에서 거대 행성을 향해 소행성 충돌, 궤도 레이저, 반물질 폭탄, 모선 함포를 원터치 폭격하여 행성을 파괴하는 우주 시뮬레이션.
    - 플레이어/모선: 카드 No.53 은하 사령관 스프라이트 (`cards2.png`).
    - 4종 슈퍼 웨폰 탭 선택 & 행성 충격파/파편 폭발 파티클, 행성 체력 0% 완파 승리 연동 완료.
54. **No.054 You Monster! (`PokiYouMonsterGame.tsx`)**:
    - 거대 괴수가 되어 고층 빌딩과 군용 탱크를 짓밟으며 파괴 점수를 쌓고 점점 거대해지는 카이주 액션.
    - 플레이어: 카드 No.54 카이주 괴수 스프라이트 (`cards2.png`).
    - 터치 드래그 이동 & 빌딩 충돌 분쇄, 군용 탱크 격파, 1,000pt 도심 점령 승리 연동 완료.
55. **No.055 SatisBox Mini Games (`PokiSatisBoxGame.tsx`)**:
    - 흩어진 필기구, 피크닉 도시락 음식, 서랍 속 도구들을 알맞은 점선 슬롯에 정확하게 드래그 앤 드롭 배치하는 정리정돈 힐링 퍼즐.
    - 플레이어: 카드 No.55 정리정돈 달인 스프라이트 (`cards2.png`).
    - 부드러운 드래그 스냅 피팅, 하트 축하 파티클, 3단계 오거나이저 완벽 정리 승리 연동 완료.
56. **No.056 Soccer Skills 2 World Cup (`PokiSoccerSkillsWorldCupGame.tsx`)**:
    - 월드컵 토너먼트에서 골대를 수비하는 골키퍼와 벽을 피해 슬링샷 조준선으로 휘어지는 감아차기 슛을 성공시키는 정밀 축구 아케이드.
    - 플레이어: 카드 No.56 국가대표 스트라이커 스프라이트 (`cards2.png`).
    - 슬링샷 드래그 궤적 조준 & 커브 슛 발사, 8강/4강/결승 3라운드 2골 돌파 월드컵 우승 연동 완료.
57. **No.057 Dino Simulator (`PokiDinoSimulatorGame.tsx`)**:
    - 쥐라기 원시림에서 티라노사우루스가 되어 초식공룡과 사냥감을 추격 포식하고 사나운 랩터를 물리치며 밀림의 지배자가 되는 생존 시뮬레이터.
    - 플레이어: 카드 No.57 티라노사우루스 스프라이트 (`cards2.png`).
    - 터치/드래그 사냥 질주, 포식 먹방 이펙트, 1,000pt 달성 밀림 제패 승리 연동 완료.
58. **No.058 Tear Blocks Down (`PokiTearBlocksDownGame.tsx`)**:
    - 공성 캐논 대포를 뒤로 당겨 각도와 위력을 조절하고, 블록 요새 위에 숨은 좀비들을 포탄 충격과 블록 연쇄 붕괴로 일망타진하는 물리 슈팅.
    - 플레이어: 카드 No.58 공성 포병대장 스프라이트 (`cards2.png`).
    - 슬링샷 캐논 궤적 투사체 발사, 블록 물리 낙하 & 좀비 전멸 3스테이지 클리어 승리 연동 완료.
59. **No.059 Red Ball 4 (`PokiRedBall4Game.tsx`)**:
    - 데굴데굴 구르는 레드볼을 조작하여 구르는 언덕을 넘고, 가시를 피하며, 사악한 블랙 큐브 몬스터 머리 위를 밟아 처치하는 인기 플랫포머.
    - 플레이어: 카드 No.59 레드볼 스프라이트 (`cards2.png`).
    - 화면 좌/우 굴림 & 상단 탭 점프, 몬스터 스톰프 처치, 황금 별 3개 수집 후 깃발 골인 승리 연동 완료.
60. **No.060 Tank Stars (`PokiTankStarsGame.tsx`)**:
    - 지형 굴곡이 있는 전장에서 전차 포신의 각도와 사격 파워를 정밀 조절하여 적 전차를 곡사포로 정밀 타격하는 전차 포격 결투.
    - 플레이어: 카드 No.60 기갑 전차장 스프라이트 (`cards2.png`).
    - 포신 각도 드래그 & 파워 게이지 릴리즈 발사, 탄도 궤적 및 지형 폭파, 적 전차 격파 승리 연동 완료.

---

## Phase 5-A 상세 작업 내역 (No.061 ~ No.070)

61. **No.061 Magic Battleground (`PokiMagicBattlegroundGame.tsx`)**:
    - 공중에 떠 있는 마법 아레나 링에서 화염(중형 데미지), 빙결(연사), 전격(초강력 넉백) 스펠을 조준 발사해 적 마법사 3명을 장외로 밀어내거나 제압하는 랙돌 마법 액션.
    - 플레이어: 카드 No.61 아케인 마법사 스프라이트 (`cards2.png`).
    - 터치 조준 드래그 & 스펠 원소 전환 버튼, 링아웃 물리 및 3인 KO 승리 연동 완료.
62. **No.062 Blast Buddies (`PokiBlastBuddiesGame.tsx`)**:
    - 9x9 격자 미로에서 폭탄을 설치하여 장애물 상자를 부수고 범위 증가/폭탄 추가/스피드업 아이템을 획득하며 적 버디 2명을 폭파시키는 배틀 아케이드.
    - 플레이어: 카드 No.62 블래스터 스프라이트 (`cards2.png`).
    - 스와이프 그리드 이동 & 원터치 탭 폭탄 설치, 십자 폭발 화염 및 적 2명 폭파 승리 연동 완료.
63. **No.063 Sword Masters (`PokiSwordMastersGame.tsx`)**:
    - 던전에서 검을 휘두르며 슬라임과 스켈레톤 20마리를 베어넘기고 거대 던전 보스인 심연의 데몬 로드를 격파하는 소드 액션 RPG.
    - 플레이어: 카드 No.63 소드 마스터 스프라이트 (`cards2.png`).
    - 원터치 드래그 이동 & 자동 검 휘두르기, '소드 스톰' 광역 회전 참격 스킬, 보스 토벌 승리 연동 완료.
64. **No.064 Sprint League (`PokiSprintLeagueGame.tsx`)**:
    - 100m 육상 트랙에서 왼발과 오른발을 번갈아 박자에 맞춰 빠른 탭으로 가속하고, 장애물 허들을 점프로 뛰어넘어 4명의 스프린터 중 1위로 골인하는 육상 스프린트.
    - 플레이어: 카드 No.64 스프린트 챔피언 스프라이트 (`cards2.png`).
    - 좌/우 발 교차 탭 가속 & 점프 버튼, 허들 충돌 감속 물리, 100m 1위 골인 승리 연동 완료.
65. **No.065 Real City Bikes (`PokiRealCityBikesGame.tsx`)**:
    - 4차선 도심 고속도로를 질주하며 일반 차량 사이를 아슬아슬하게 통과하는 니어미스(Near Miss) 5회를 성공시키고 2,000m를 완주하는 슈퍼바이크 레이싱.
    - 플레이어: 카드 No.65 시티 라이더 스프라이트 (`cards2.png`).
    - 좌우 스와이프 차선 변경 & 화면 터치 유지 니트로 부스터 가속, 충돌 판정 및 2,000m 완주 승리 연동 완료.
66. **No.066 Hills of Steel (`PokiHillsOfSteelGame.tsx`)**:
    - 기복이 심한 언덕 지형을 서스펜션 탄성으로 주파하며, 적 지상 전차 4대와 상공의 전투 헬기 2대를 포탄과 긴급 공중 폭격으로 격파하는 힐 탱크 슈터.
    - 플레이어: 카드 No.66 강철 전차 스프라이트 (`cards2.png`).
    - 화면 좌/우 탭 전진·후진 이동, 지형 탄도학 곡사포 & '공중 폭격' 지원, 적 6기 전멸 승리 연동 완료.
67. **No.067 Rail in the Air (`PokiRailInAirGame.tsx`)**:
    - 구름 위 고공 모노레일 레일을 달리며 급커브 구간에서 적정 속도를 유지해 탈선을 방지하고, 3개 공중 정거장에 정확히 정차하여 승객을 수송하는 열차 시뮬레이션.
    - 플레이어: 카드 No.67 열차 기관사 스프라이트 (`cards2.png`).
    - 스로틀 가속 & 긴급 제동 브레이크 조작, 탈선 위험도(%) 게이지 관리, 3개역 완벽 정차 승리 연동 완료.
68. **No.068 Monkey Mart (`PokiMonkeyMartGame.tsx`)**:
    - 바나나 나무와 옥수수 밭에서 작물을 수확해 진열대에 채우고, 몰려드는 동물 손님들에게 판매하여 지폐를 수거해 $500 수익을 달성하는 인기 마켓 타이쿤.
    - 플레이어: 카드 No.68 마켓 원숭이 스프라이트 (`cards2.png`).
    - 원터치 터치/드래그 오토 파밍 상호작용, 손님 결제 지폐 드롭 & 30개 판매 및 $500 수익 달성 승리 연동 완료.
69. **No.069 Carnado Stunt Car (`PokiCarnadoStuntGame.tsx`)**:
    - 메가 램프를 도약해 공중에서 360도 공중제비 묘기를 성공시키고 안전하게 착지하여 1,500점 스턴트 점수를 달성하는 익스트림 카 스턴트.
    - 플레이어: 카드 No.69 스턴트 드라이버 스프라이트 (`cards2.png`).
    - 터치 유지 풀악셀 가속 & 공중 좌우 스와이프 각운동량 회전 조절, 3연속 안전 착지 승리 연동 완료.
70. **No.070 Diva Hair Salon (`PokiDivaHairSalonGame.tsx`)**:
    - 샴푸 거품 세발 ➔ 드라이어 수분 건조 ➔ 가위 모발 커트 ➔ 컬러 염색약 칠하기 및 티아라 착용 4단계를 거쳐 완벽한 디바를 완성하는 뷰티 헤어 살롱.
    - 플레이어: 카드 No.70 헤어 디자이너 스프라이트 (`cards2.png`).
    - 도구 탭 선택 & 모발 부위 원터치 드래그 스타일링 제스처, 4단계 살롱 케어 완료 및 런웨이 데뷔 승리 연동 완료.

---

## Phase 5-B 상세 작업 내역 (No.071 ~ No.080)

71. **No.071 Scary Teacher Hide & Seek Games (`PokiScaryTeacherHideSeekGame.tsx`)**:
    - 미스 T 선생님의 순찰 시야콘과 발소리를 피해 거실/복도의 옷장과 소파 뒤로 숨고, 3가지 비밀 아이템(시험지, 열쇠, 비밀수첩)을 수집하는 스텔스 잠입 어드벤처.
    - 플레이어: 카드 No.71 은신 잠입자 스프라이트 (`cards2.png`).
    - 화면 터치/드래그 이동 & 은신처 근접 시 은신 탭, 시야각 회피 및 3대 아이템 수집 승리 연동 완료.
72. **No.072 Supercar Legends (`PokiSupercarLegendsGame.tsx`)**:
    - 3차선 서킷 트랙을 질주하며 다른 레이서들을 추월하고, 도로 위의 니트로 부스터를 획득해 폭발적인 가속력으로 3랩을 1위로 완주하는 하이퍼 슈퍼카 레이싱.
    - 플레이어: 카드 No.72 슈퍼카 레이서 스프라이트 (`cards2.png`).
    - 좌우 스와이프 차선 변경 & 니트로 부스터 가속, 서킷 랩타임 기록 및 3랩 1위 주파 승리 연동 완료.
73. **No.073 Nails DIY: Manicure Master (`PokiNailsDIYGame.tsx`)**:
    - 5가지 다채로운 매니큐어 컬러와 귀여운 네일 스티커(하트, 별, 다이아몬드, 꽃)를 선택해 5개 손톱을 아름답게 스타일링하는 네일 살롱 DIY 아트.
    - 플레이어: 카드 No.73 네일 아티스트 스프라이트 (`cards2.png`).
    - 컬러/스티커 팔레트 탭 & 손톱 터치 아트 제스처, 5개 손톱 100% 매니큐어 완성 승리 연동 완료.
74. **No.074 Ping Pong Go! (`PokiPingPongGoGame.tsx`)**:
    - 상대 AI와 테이블 위에서 팽팽한 고속 랠리를 주고받으며 각도 조절과 스매시 반격으로 먼저 5점을 선취하는 다이내믹 탁구 스포츠 액션.
    - 플레이어: 카드 No.74 핑퐁 챔피언 스프라이트 (`cards2.png`).
    - 수직 터치/드래그 패들 조작 & 반사 각도 물리, 고속 랠리 및 5점 선취 승리 연동 완료.
75. **No.075 Color Artist (`PokiColorArtistGame.tsx`)**:
    - 번호가 매겨진 영웅 캐릭터 일러스트 도안에서 해당 번호의 색상을 선택해 터치하여 8개 영역을 완벽하게 채색하는 픽셀 컬러링 퍼즐.
    - 플레이어: 카드 No.75 픽셀 아티스트 스프라이트 (`cards2.png`).
    - 컬러 팔레트 선택 & 번호 영역 터치 채색 제스처, 8개 영역 100% 완성 승리 연동 완료.
76. **No.076 Going Up Rooftop (`PokiGoingUpRooftopGame.tsx`)**:
    - 고층 빌딩 옥상을 향해 에어컨 실외기, 철골 빔, 비상 사다리를 타고 수직 상승하며, 벽면에 닿았을 때 반대편으로 솟구치는 벽점프(Wall Jump)를 구사해 50m 정상 헬리패드에 도달하는 버티컬 파쿠르 러너.
    - 플레이어: 카드 No.76 루프탑 러너 스프라이트 (`cards2.png`).
    - 좌우 드래그 이동 & 탭 점프 및 벽점프 콤보, 50m 정상 헬리패드 착봉 승리 연동 완료.
77. **No.077 Stickman Dragon Fight (`PokiStickmanDragonFightGame.tsx`)**:
    - 우주 아레나를 자유롭게 비행하며 연속 콤보 타격으로 기(Ki) 게이지를 모으고, 50 기를 소모해 전방을 관통하는 거대 '드래곤 빔(기공포)'을 발사하여 2인의 다크 드래곤 전사를 격퇴하는 공중 격투 액션.
    - 플레이어: 카드 No.77 드래곤 파이터 스프라이트 (`cards2.png`).
    - 터치 비행 조타 & 콤보 타격/드래곤 빔 발사 액션, 에너지 파티클 및 적 2명 KO 승리 연동 완료.
78. **No.078 Dog's Life (`PokiDogsLifeGame.tsx`)**:
    - 햇살 가득한 공원을 신나게 달리는 귀여운 강아지가 되어 나비를 쫓고, 멍멍 짖으며 어질리티 허들을 뛰어넘고, 공원 곳곳에 숨겨진 황금 뼈다귀 5개를 모두 찾아내는 힐링 애견 어드벤처.
    - 플레이어: 카드 No.78 강아지 스프라이트 (`cards2.png`).
    - 터치/드래그 자유 산책 & 멍멍 짖기/허들 점프 액션, 5개 황금 뼈다귀 수집 승리 연동 완료.
79. **No.079 Anycolor (`PokiAnycolorGame.tsx`)**:
    - 5색 테마 팔레트(루비, 스카이, 웜앰버, 에메랄드, 바이올렛)에서 번호를 선택하고 기하학적 스테인드글라스 도안의 일치 구역을 터치하여 레트로 메카 로봇 일러스트 10개 파츠를 완성하는 팝아트 컬러링.
    - 플레이어: 카드 No.79 일러스트레이터 스프라이트 (`cards2.png`).
    - 번호 팔레트 선택 & SVG 기하학 파츠 터치 채색, 10개 구역 100% 완성 승리 연동 완료.
80. **No.080 Scary Teacher 3D (`PokiScaryTeacher3DGame.tsx`)**:
    - 미스 T 선생님의 저택에 잠입해 순찰 시야(붉은 부채꼴 콘)를 피해 주방(소금통 설탕 바꾸기), 욕실(샴푸에 페인트), 거실(방귀쿠션) 3대 장난을 설치하고 현관 EXIT로 탈출하는 코믹 잠입 스릴러.
    - 플레이어: 카드 No.80 장난 천재 스프라이트 (`cards2.png`).
    - 터치/드래그 은밀 잠입 & 장난 포인트 근접 설치, 경보 시스템 및 EXIT 무사 탈출 승리 연동 완료.

---

## Phase 6-A 상세 작업 내역 (No.081 ~ No.090)

81. **No.081 Penalty Shooters 2 (`PokiPenaltyShooters2Game.tsx`)**:
    - 슬링샷 슈팅과 골키퍼 다이빙 방어를 공수 교대로 진행하는 축구 승부차기 토너먼트 (3라운드 2점 선취 승리).
    - 플레이어: 카드 No.81 페널티 킥커 스프라이트 (`cards2.png`).
    - 슬링샷 드래그 궤적 슈팅 조준 & 골키퍼 다이빙 터치 블로킹, 3R 토너먼트 우승 연동 완료.
82. **No.082 Boomy World (`PokiBoomyWorldGame.tsx`)**:
    - 9x9 미로 전장에서 TNT 폭탄을 배치해 장애물 블록을 부수고 폭발 화염으로 몰려오는 몬스터 10마리를 퇴치하는 클래식 폭탄 배틀.
    - 플레이어: 카드 No.82 부머 영웅 스프라이트 (`cards2.png`).
    - 스와이프 이동 & 폭탄 설치 버튼, 십자 폭발 연쇄 반응 및 10마리 몬스터 전멸 승리 연동 완료.
83. **No.083 SnapStyle Dress Up (`PokiSnapStyleDressUpGame.tsx`)**:
    - 헤어, 의상, 슈즈, 안경, 모자 5개 카테고리 아이템을 자유롭게 코디하고 패션 매거진 표지 셔터로 베스트 컷을 촬영하는 포토제닉 드레스업.
    - 플레이어: 카드 No.83 패션 모델 스프라이트 (`cards2.png`).
    - 카테고리 탭 & 아이템 선택, 100점 매거진 표지 셔터 스냅샷 및 촬영 완성 승리 연동 완료.
84. **No.084 Fashion Legends (`PokiFashionLegendsGame.tsx`)**:
    - 런웨이를 전진하며 좌우 스와이프로 긍정(+스타일) 의상 게이트를 수집하고 부정(-오염) 게이트를 피해 80점 이상의 매혹적인 스타일로 캣워크를 질주하는 런웨이 러너.
    - 플레이어: 카드 No.84 런웨이 모델 스프라이트 (`cards2.png`).
    - 좌우 스와이프 레인 이동 & 의상 게이트 수집, 80점 이상 캣워크 피날레 우승 연동 완료.
85. **No.085 Vortella's Gothic Dress Up (`PokiVortellasDressUpGame.tsx`)**:
    - 고딕 마법사 보르텔라의 마녀 모자, 로브, 마법 오브, 마법봉 4개 신비한 파츠를 조합하여 고딕 룬 주술을 각성시키는 판타지 코디.
    - 플레이어: 카드 No.85 고딕 마녀 스프라이트 (`cards2.png`).
    - 파츠별 옵션 터치 교체 & 보라빛 마법 오라 이펙트, 4개 부위 완벽 코디 및 룬 각성 승리 연동 완료.
86. **No.086 MR RACER - Car Racing (`PokiMrRacerGame.tsx`)**:
    - 4차선 도심 고속도로에서 일반 차량 사이를 아슬아슬하게 추월하며 니트로 부스터로 폭발적 가속을 펼치는 하이퍼 스피드 레이서.
    - 플레이어: 카드 No.86 MR 레이서 스프라이트 (`cards2.png`).
    - 좌우 스와이프 차선 변경 & 화면 터치 유지 니트로 부스터 가속, 1,500m 무사고 질주 완주 승리 연동 완료.
87. **No.087 School Cleaning (`PokiSchoolCleaningGame.tsx`)**:
    - 어질러진 교실에서 바닥 쓰레기 분리수거(5개), 지저분한 칠판 지우기(스펀지 드래그), 삐뚤어진 책상 바르게 정렬하기 3단계를 수행하는 클리닝 시뮬레이션.
    - 플레이어: 카드 No.87 환경 반장 스프라이트 (`cards2.png`).
    - 3단계 탭/드래그 청소 인터랙션, 반짝임 파티클 및 100% 교실 청소 완벽 클리어 승리 연동 완료.
88. **No.088 Hill Climb Racing Lite (`PokiHillClimbRacingLiteGame.tsx`)**:
    - 거친 험로와 언덕을 지프차로 주파하며 가속과 브레이크 2개 버튼으로 차량의 피치 기울기를 제어해 전복 없이 코인을 수집하며 300m를 완주하는 물리 힐 레이싱.
    - 플레이어: 카드 No.88 힐 드라이버 스프라이트 (`cards2.png`).
    - 좌/우 탭 가속·감속 물리 밸런스 제어 & 연료 캔 수집, 300m 완주 승리 연동 완료.
89. **No.089 Stickman Crazy Box (`PokiStickmanCrazyBoxGame.tsx`)**:
    - 하늘에서 끝없이 떨어지는 위험한 나무 상자들을 회피하고, 쌓여가는 상자들을 발판 삼아 점프하며 황금 스타 8개를 수집하는 서바이벌 점프 아케이드.
    - 플레이어: 카드 No.89 스틱맨 스프라이트 (`cards2.png`).
    - 좌우 드래그 이동 & 원터치 점프, 낙하 상자 물리 충돌 회피 및 황금 스타 8개 수집 승리 연동 완료.
90. **No.090 Goods Master 3D (`PokiGoodsMasterGame.tsx`)**:
    - 3단 편의점 선반에 진열된 다양한 상품들을 터치해 하단 정리 카트에 담고, 동일 상품 3개를 일치시켜 선반을 말끔하게 비우는 트리플 매치 3D 퍼즐.
    - 플레이어: 카드 No.90 굿즈 마스터 스프라이트 (`cards2.png`).
    - 상품 터치 카트 이동 & 3개 동일 상품 매칭 제거, 3세트 선반 완전 정리 승리 연동 완료.

---

## Phase 6-B 상세 작업 내역 (No.091 ~ No.100)

91. **No.091 Hexellent (`PokiHexellentGame.tsx`)**:
    - 육각 격자(Hexagonal Grid)에서 인접한 같은 색상 블록들을 터치해 연쇄 폭발을 일으키고 1,000pt를 달성하는 헥사 콤보 퍼즐.
    - 플레이어: 카드 No.91 헥사 마스터 스프라이트 (`cards2.png`).
    - 축 좌표(Axial Coordinates) 플러드 필 알고리즘 & 연쇄 폭발 파티클, 1,000점 달성 승리 연동 완료.
92. **No.092 Harvest Simulator (`PokiHarvestSimulatorGame.tsx`)**:
    - 콤바인 수확기를 운전하여 해바라기와 밀 밭을 수확하고 적재함이 가득 차면 곡물 저장고에 하역하여 $500 수익을 달성하는 농업 시뮬레이터.
    - 플레이어: 카드 No.92 농부 드라이버 스프라이트 (`cards2.png`).
    - 원터치 터치/드래그 주행 & 작물 수확 메커니즘, 저장고 하역 정산 및 $500 달성 승리 연동 완료.
93. **No.093 Car Circle (`PokiCarCircleGame.tsx`)**:
    - 차량들이 끊임없이 회전하는 바쁜 원형 로터리(Roundabout)에 진입 대기 차량을 타이밍에 맞춰 안전하게 합류시키는 교통 통제 스킬 게임.
    - 플레이어: 카드 No.93 교통 관제관 스프라이트 (`cards2.png`).
    - 원터치 진입 탭 제스처, 차량 충돌 판정 및 라이프 시스템, 12대 무사고 합류 승리 연동 완료.
94. **No.094 Phone CASE DIY (`PokiPhoneCaseDIYGame.tsx`)**:
    - 스프레이 페인트 분사(1단계) ➔ 헤어드라이어 열풍 건조(2단계) ➔ 귀여운 이모지 스티커 4종 부착(3단계)을 거쳐 나만의 스마트폰 케이스를 디자인하는 DIY 크래프트.
    - 플레이어: 카드 No.94 케이스 디자이너 스프라이트 (`cards2.png`).
    - 3단계 터치/드래그 제작 인터랙션, 반짝임 파티클 및 100% 케이스 완성 승리 연동 완료.
95. **No.095 Soccer League (`PokiSoccerLeagueGame.tsx`)**:
    - 3대3 실시간 풋살 경기에서 드리블과 슬링샷 드래그 슛/패스로 상대 AI 수비와 골키퍼를 뚫고 먼저 3골을 득점하는 스포츠 아케이드.
    - 플레이어: 카드 No.95 풋살 챔피언 스프라이트 (`cards2.png`).
    - 슬링샷 드래그 조준 & 킥 발사, 공 물리 반사 및 3골 선취 리그 우승 연동 완료.
96. **No.096 Capitalist Bus Driver (`PokiCapitalistBusDriverGame.tsx`)**:
    - 3차선 도로를 운전하며 차량 장애물을 피하고 우측 버스 정류장에서 대기 중인 승객들을 태워 목적지까지 안전하게 총 20명을 수송하는 버스 타이쿤.
    - 플레이어: 카드 No.96 버스 운전사 스프라이트 (`cards2.png`).
    - 좌/우 탭 차선 변경 & 정류장 감속 탑승, 20명 수송 완료 승리 연동 완료.
97. **No.097 EvoWorld io (FlyOrDie io) (`PokiEvoWorldIoGame.tsx`)**:
    - 작은 파리로 시작해 이슬과 음식을 먹고 수분을 보충하며 나비, 모기, 매, 최종 불사조 피닉스로 진화하고 상위 포식자를 회피하는 생존 진화 io.
    - 플레이어: 카드 No.97 에보 크리처 스프라이트 (`cards2.png`).
    - 터치 비행 조타, 수분/경험치 게이지 관리, 피닉스 드래곤 최종 진화 승리 연동 완료.
98. **No.098 Bullet Bros (`PokiBulletBrosGame.tsx`)**:
    - 벽과 장애물에 도탄(Ricochet)되는 물리 총탄을 조준 발사하여 엄폐한 적들을 격파하는 2인조 브라더스 트릭샷 슈터.
    - 플레이어: 카드 No.98 불릿 브라더 스프라이트 (`cards2.png`).
    - 슬링샷 궤적 조준 & 도탄 물리 판정, 3개 스테이지 적 전멸 클리어 승리 연동 완료.
99. **No.099 Perfect Landing, Plane Pilot (`PokiPerfectLandingGame.tsx`)**:
    - 풍력 터빈과 난기류를 피해 비행기 피치를 정밀 제어하고 활주로에 부드럽게 글라이드 터치다운을 성공시키는 항공기 착륙 시뮬레이션.
    - 플레이어: 카드 No.99 파일럿 기장 스프라이트 (`cards2.png`).
    - 화면 상/하 탭 피치 각도 조절, 풍력 터빈 회피 및 3회 퍼펙트 랜딩 승리 연동 완료.
100. **No.100 Undead Slayer (`PokiUndeadSlayerGame.tsx`)**:
    - 묘지와 어두운 던전에서 몰려오는 스켈레톤과 좀비 군단을 연속 검격과 360도 회전 참격 스킬로 베어넘기고 언데드 보스를 처단하는 핵앤슬래시.
    - 플레이어: 카드 No.100 언데드 슬레이어 스프라이트 (`cards2.png`).
    - 원터치 드래그 이동 & 자동 연속 참격, 광역 '회전참격' 쿨다운 스킬, 25마리 토벌 승리 연동 완료.

---

## Phase 7 상세 작업 내역 (No.101 ~ No.110 - 최종 피날레)

101. **No.101 Watermelon Drop (`PokiWatermelonDropGame.tsx`)**:
    - 글로벌 메가히트 수박게임(Suika Game) 스타일의 과일 투하 머지 퍼즐. 체리->딸기->포도->오렌지->사과->수박의 6단계 과일 합성과 현실적 2D 물리 탄성.
    - 플레이어: 카드 No.101 과일 마스터 스프라이트 (`cards2.png`).
    - 원터치 드래그 조준 & 릴리즈 낙하, 동일 과일 충돌 합성 및 800점 달성 승리 연동 완료.
102. **No.102 Kawaii Fruits 3D (`PokiKawaiiFruits3DGame.tsx`)**:
    - 살아 움직이듯 깜빡이는 귀여운 표정의 카와이 과일들을 투하하여 상자 안에서 합성하는 캐주얼 머지 아케이드.
    - 플레이어: 카드 No.102 카와이 아티스트 스프라이트 (`cards2.png`).
    - 과일 표정(눈/입/홍조) 애니메이션, 10회 머지 콤보 달성 승리 연동 완료.
103. **No.103 Blumgi Bounce (`PokiBlumgiBounceGame.tsx`)**:
    - 농구 골대를 향해 탄성을 주어 슬링샷으로 조준 발사하고 플랫폼 벽면을 바운스시켜 림을 통과시키는 트릭샷 바운스 농구.
    - 플레이어: 카드 No.103 블룸기 바운서 스프라이트 (`cards2.png`).
    - 슬링샷 드래그 궤적 조준 & 바운스 물리 반사, 5골 득점 승리 연동 완료.
104. **No.104 Brain Test 5 (`PokiBrainTest5Game.tsx`)**:
    - 고정관념을 깨부수는 기발한 상식 파괴 넌센스 트릭 두뇌 퍼즐 (거대 과일 찾기, 잠든 고양이 깨우기, 양초 점화).
    - 플레이어: 카드 No.104 브레인 마스터 스프라이트 (`cards2.png`).
    - 사물 드래그/인터랙션 기믹, 3개 넌센스 퍼즐 전수 클리어 승리 연동 완료.
105. **No.105 Blumgi Merge (`PokiBlumgiMergeGame.tsx`)**:
    - 3x3 보드에서 블룸기 크리처들을 드래그 머지하여 치킨->펭귄->부엉이->피닉스->드래곤으로 진화시키고 보스 아레나에 총공격 출진하는 머지 배틀.
    - 플레이어: 카드 No.105 블룸기 테이머 스프라이트 (`cards2.png`).
    - 드래그 앤 드롭 머지, 전투력 합산 보스 총공격 및 HP 500 토벌 승리 연동 완료.
106. **No.106 Stickman Climb 3D (`PokiStickmanClimb3DGame.tsx`)**:
    - 항아리에 들어간 스틱맨이 곡괭이를 원형 회전으로 휘둘러 바위 절벽을 찍고 지렛대 탄성으로 공중 도약하는 등반 플랫포머.
    - 플레이어: 카드 No.106 스틱맨 클라이머 스프라이트 (`cards2.png`).
    - 360도 원형 곡괭이 조작 & 도약 물리 역학, 해발 100m 정상 깃발 도달 승리 연동 완료.
107. **No.107 Brain Test Special (`PokiBrainTestSpecialGame.tsx`)**:
    - 스페셜 에디션 두뇌 수수께끼 (먹구름 걷어내 활주로 찾기, UFO 돔 열어 외계인 발견, 자물쇠 5연타 탈출).
    - 플레이어: 카드 No.107 천재 탐정 스프라이트 (`cards2.png`).
    - 구름 드래그/돔 개방/자물쇠 탭 상호작용, 3개 스페셜 스테이지 완벽 돌파 승리 연동 완료.
108. **No.108 11-11 (`PokiElevenElevenGame.tsx`)**:
    - 11x11 초대형 격자 보드에 다양한 테트로미노/폴리오미노 블록을 배치해 가로/세로 11줄을 완성해 폭파시키는 명작 블록 퍼즐.
    - 플레이어: 카드 No.108 일레븐 마스터 스프라이트 (`cards2.png`).
    - 블록 선택 & 보드 터치 배치, 라인 클리어 연쇄 폭발 및 600점 달성 승리 연동 완료.
109. **No.109 Blumgi Slime (`PokiBlumgiSlimeGame.tsx`)**:
    - 화면을 꾹 눌러 찌그러뜨려 탄성을 충전하고 손을 떼어 힘차게 도약하며 가시 트랩을 뛰어넘는 쫀득 슬라임 점프 아케이드.
    - 플레이어: 카드 No.109 블룸기 슬라임 스프라이트 (`cards2.png`).
    - 충전 탄성 점프 & 공중 급강하(Slam), 가시 회피 및 300m 완주 승리 연동 완료.
110. **No.110 Obby Roads (`PokiObbyRoadsGame.tsx`)**:
    - 하늘 위 공중에 떠 있는 익스트림 장애물 로드를 스포츠카로 질주하며 회전 롤러를 피하고 부스터로 돌파하는 110번째 최종 피날레 하이퍼 레이서!
    - 플레이어: 카드 No.110 오비 레전드 스프라이트 (`cards2.png`).
    - 좌우 터치 조향 & 장애물 회피 & 부스터 배기구 화염, 500m 결승선 골인 승리 연동 완료.

---

## 🏆 전수 전환 완료 총평 및 성과 (110 / 110 완료 - 100.0%)

1. **글로벌 웹게임 표준화 완수**:
   - `http://localhost:3000/play`의 모든 미션 게임 110종을 전 세계에서 검증된 Poki 글로벌 인기 Top 110 게임으로 1:1 완벽 교체 완료.
2. **모바일 퓨어 터치 100% 달성**:
   - 가상 D-패드, 방향키 버튼, 복잡한 키보드 인터페이스를 100% 완전 퇴출하고, 스마트폰 화면을 직접 터치/스와이프/드래그하는 모바일 친화적 원핸드 제스처로 통일.
3. **디자인 및 비주얼 통일**:
   - `DESIGN.md` 가이드에 맞추어 Monospace 서체, 웜크림(`#fdfcfc`)/잉크(`#201d1d`) 팔레트, 1px 헤어라인 보더, 통일된 상단 `MinimalistMissionHUD` 및 결과 팝업 `VictoryRewardModal`을 모든 게임에 일관되게 적용.
4. **공식 카드 캐릭터 스프라이트 100% 연동**:
   - 110개 전체 미션 게임에 카드 번호(No.01~No.110)를 1:1 매핑하여 `drawCardSprite(ctx, cardId, x, y, w, h)` 기반 공식 일러스트 영웅/몬스터 스프라이트 렌더링 적용.
5. **표준 SNS 보상 및 LocalStorage 영구 보존**:
   - `calculateAndDepositMissionReward` 표준 게이트웨이를 통해 모든 미션 게임 승리 시 20~50 SNS 포인트를 공정하게 지급하고 `localStorage`에 무결점 영구 보존.



