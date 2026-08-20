# [SNSHero Revolution] AI Studio 마스터 원샷 개발 프롬프트 및 게임 기획/디자인 명세서 (`snshero.md`)

> **문서 목적**: 본 문서는 Google AI Studio, Gemini API 또는 최신 자율 코딩 에이전트에 단일 컨텍스트/프롬프트로 첨부하여, 100% 작동 가능한 완성형 **'SNS히어로 (SNSHero Revolution)'** 웹 카드 배틀 게임(React 19 + TypeScript + Tailwind CSS + LocalStorage)을 단 한 번의 프롬프트로 완벽히 개발할 수 있도록 작성된 **통합 게임 기획서(GDD), 디자인 가이드라인, 시스템 아키텍처 및 마스터 원샷 프롬프트 지침서**입니다.
>
> 카드 이미지는 `/public/cards1.png` (카드 ID 1~100) 및 `/public/cards2.png` (카드 ID 101~110+) 10x10 스프라이트 시트를 그리드 연산으로 자동 매핑합니다.

---

```
╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                   [AI STUDIO MASTER PROMPT]                                      ║
║                                                                                                  ║
║  "당신은 세계 최고의 수석 프론트엔드 게임 개발자이자 게임 기획/UI 아키텍트입니다.                     ║
║   아래에 제공된 [SNSHero 게임 기획서 + 디자인 가이드 + 데이터베이스 + 기술 아키텍처] 전체를 100% 반영하여,  ║
║   3x3 배틀 엔진, 110종 카드 스프라이트 그리드 렌더링, 덱 편집 및 다마고치 육성, 가챠 상점 및 천장 시스템,  ║
║   카단 2D 타일 RPG, 미니게임 8종, 애니메이션 QR 분할 백업/복원, Web Audio 신디사이저,               ║
║   Monospace/Warm Cream 디자인 시스템을 갖춘 완전하고 즉시 실행 가능한 React 19 코드를 작성하십시오."     ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

# PART 1. 게임 기획 사양서 (Game Design Document)

## 1.1 게임 개요 및 핵심 루프 (Core Game Loop)

### 게임 정의
- **타이틀**: SNS히어로 (SNSHero Revolution)
- **장르**: 3x3 전술 카드 배틀 + 캐릭터 다마고치 육성 + 2D 월드맵 RPG + 미니게임 컬렉션
- **플랫폼**: 모바일/PC 웹 브라우저 (반응형, 모바일 100dvh 최적화)
- **저장 방식**: 100% 브라우저 로컬스토리지 (LocalStorage) 기반 무서버 영구 저장

### 코어 게임 루프 (Core Loop Diagram)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. 메인 로비 (HomeView)                                                      │
│    └─ 방치형 순찰(AFK Patrol) 보상 수령 (분당 1 SNS, 최대 8시간 480 SNS)          │
│    └─ 일일 미션(Daily Missions) 확인 및 출석 보상 획득                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. 덱 편성 & 다마고치 육성 (MyDeckView)                                       │
│    └─ 보유 카드 5장 선택 및 드래그 앤 드롭 전략 배치                           │
│    └─ 4개 장비 슬롯(목걸이, 반지1, 반지2, 부츠) 장착으로 스탯 강화             │
│    └─ 카드 돌봄(밥주기, 놀아주기, 훈련, 휴식)으로 친밀도 및 추가 스탯 부여      │
│    └─ 중복 카드 일괄 분해(SNS 획득) 및 3합 1 카드 합성                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. 다양한 전투 & 게임 모드 플레이 (PlayGameView / KadanRpgView / MiniGames) │
│    └─ [랭킹 대전]: 3x3 보드에서 상대 AI/유저와 턴제 카드 플립 배틀 (+30 SNS)   │
│    └─ [모험/스토리]: 10개 챕터 보스 클리어 및 신규 카드 해금                   │
│    └─ [보스 레이드]: 거대 보스(포세이돈, 이그니시우스, 바하무트) 토벌          │
│    └─ [시련의 탑]: 1~50층 연속 등반 극한 챌린지                               │
│    └─ [8시간 원정대]: 탐색 파티 파견 후 오프라인 재화 수확                      │
│    └─ [카단 RPG]: 2D 타일 월드맵 탐험, NPC 대화, 상자 파밍, 필드 배틀, 환생   │
│    └─ [미니게임 8종]: 카드러시, 카드하이스트, 카드탭, 카드슬롯, 카드소서리 등  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. 상점 & 경제 활동 (ShopView)                                              │
│    └─ 획득한 SNS 포인트로 단일팩(100 SNS) / 10연차(900 SNS) 뽑기              │
│    └─ 30연차 천장 게이지(Pity)를 통해 Gold 등급 이상 카드 100% 확정 획득       │
│    └─ 장비팩(150 SNS) 뽑기 및 코스메틱 스킨 해금                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1.2 세계관 및 11개 세력(Faction) IP 설정

SNSHero의 세계는 11개의 독특한 원소 및 종족 세력으로 이루어져 있으며, 각 세력마다 고유한 비주얼 키워드와 플레이 스타일을 갖습니다.

```
┌──────────┬──────────────┬──────────────────┬─────────────────┬──────────────────────────────────┐
│ 세력 ID  │ 세력명 (KR)  │ 주조색 / 보조색  │ 엠블럼 아이콘   │ 세계관 및 배경 지역              │
├──────────┼──────────────┼──────────────────┼─────────────────┼──────────────────────────────────┤
│ water    │ 물 (Water)   │ #0ea5e9 / #06b6d4│ Droplets (물방울)│ 아쿠아 심연 (Aqua Abyss)          │
│ fire     │ 불 (Fire)    │ #ef4444 / #f97316│ Flame (불꽃)    │ 이그니스 요람 (Ignis Cradle)     │
│ air/wind │ 바람 (Air)   │ #22d3ee / #a78bfa│ Wind (바람)     │ 폭풍의 정점 (Storm Peak)         │
│ earth    │ 대지 (Earth) │ #84cc16 / #a16207│ Mountain (산맥) │ 테라 코어 (Terra Core)           │
│ human    │ 인간 (Human) │ #eab308 / #78716c│ Shield (방패)   │ 철의 왕국 (Iron Kingdom)         │
│ undead   │ 언데드       │ #a855f7 / #111827│ Skull (해골)    │ 그림자 행진 (Shadow March)       │
│ elf      │ 엘프 (Elf)   │ #22c55e / #d4d4d4│ Leaf (나뭇잎)   │ 실반 글레이드 (Sylvan Glade)     │
│ dwarf    │ 드워프       │ #d97706 / #451a03│ Hammer (망치)   │ 심연 대장간 (Deep Forge)         │
│ monster  │ 몬스터(야수) │ #65a30d / #991b1b│ Ghost (야수령)  │ 야생의 황야 (Wild Expanse)       │
│ robot    │ 기계/로봇    │ #0284c7 / #475569│ Bot (로봇)      │ 사이버 코어 (Cyber Core)         │
│ dragon   │ 드래곤       │ #e11d48 / #fbbf24│ Zap (용의 번개) │ 용의 안식처 (Dragon Peak)        │
└──────────┴──────────────┴──────────────────┴─────────────────┴──────────────────────────────────┘
```

---

## 1.3 110종 전체 카드 데이터베이스 (Complete Database: ID 1 ~ 110)

각 카드는 4개 방향의 전투 수치 **`stats: [Top, Right, Bottom, Left]`** (1~10), 레벨(1~10), 희귀도, 그리고 특수 능력을 보유합니다.

```typescript
export interface DatabaseCard {
  id: number;
  title: string;       // 한글 명칭
  title_en: string;    // 영문 명칭
  level: number;       // 레벨 (1~10)
  element: 'water' | 'fire' | 'air' | 'earth' | 'human' | 'undead' | 'elf' | 'dwarf' | 'monster' | 'robot' | 'dragon';
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legendary';
  stats: [number, number, number, number]; // [Top, Right, Bottom, Left]
  power: number;       // stats 합계
  ability?: {
    type: 'SHIELD' | 'COUNTER' | 'WALL' | 'OMNIBOOST' | 'PIERCE' | 'IMMUNITY' | 'TIME_WARP';
    value: number;
    description_ko: string;
    description_en: string;
  };
  lore_ko?: string;
  lore_en?: string;
}
```

### [세부 카드 리스트 110종 전체]
1. **No.01 아쿠아리스 (Aquaris)**: 물 / Bronze / Lv.1 / [1, 4, 1, 5] (P.11) | [SHIELD] 적의 플립 확률 감소
2. **No.02 나이아드 (Naiad)**: 물 / Bronze / Lv.2 / [7, 1, 3, 1] (P.12)
3. **No.03 운디네 (Undine)**: 물 / Bronze / Lv.3 / [6, 6, 3, 2] (P.17)
4. **No.04 켈피 (Kelpie)**: 물 / Bronze / Lv.4 / [2, 3, 6, 7] (P.18)
5. **No.05 아쿠아로드 (Aqualord)**: 물 / Bronze / Lv.5 / [6, 5, 6, 5] (P.22)
6. **No.06 레비아탄 (Leviathan)**: 물 / Silver / Lv.6 / [2, 8, 8, 4] (P.22)
7. **No.07 가르간티아 (Gargantia)**: 물 / Silver / Lv.7 / [8, 4, 4, 8] (P.24)
8. **No.08 캐스케이드 (Cascade)**: 물 / Silver / Lv.8 / [4, 4, 8, 9] (P.25)
9. **No.09 크라켄 (Kraken)**: 물 / Gold / Lv.9 / [8, 4, 10, 4] (P.26) | [COUNTER] 플립 실패 시 적 카드 역플립
10. **No.10 포세이돈 (Poseidon)**: 물 / Gold / Lv.10 / [10, 7, 2, 8] (P.30) | [WALL] 일반 공격에 절대 뒤집히지 않음
11. **No.11 이그니스 (Ignis)**: 불 / Bronze / Lv.1 / [5, 1, 1, 3] (P.10)
12. **No.12 샐러맨더 (Salamander)**: 불 / Bronze / Lv.2 / [6, 2, 2, 3] (P.13)
13. **No.13 벨페고르 (Belphegor)**: 불 / Bronze / Lv.3 / [6, 3, 1, 6] (P.16)
14. **No.14 파이로 (Pyro)**: 불 / Bronze / Lv.4 / [6, 5, 4, 5] (P.20)
15. **No.15 발록 (Balrog)**: 불 / Bronze / Lv.5 / [3, 7, 5, 6] (P.21)
16. **No.16 무스펠 (Muspel)**: 불 / Silver / Lv.6 / [7, 8, 3, 1] (P.22)
17. **No.17 이바르 (Ivar)**: 불 / Silver / Lv.7 / [8, 8, 4, 4] (P.24)
18. **No.18 불사신 아셀 (Ashel the Immortal)**: 불 / Silver / Lv.8 / [9, 6, 7, 3] (P.25)
19. **No.19 피닉스 (Phoenix)**: 불 / Gold / Lv.9 / [5, 10, 8, 3] (P.26) | [OMNIBOOST] 배치 시 보드 내 모든 아군 +1
20. **No.20 이그니시우스 (Ignisius)**: 불 / Gold / Lv.10 / [6, 7, 6, 10] (P.29) | [PIERCE] 적의 방패 및 벽 관통
21. **No.21 제피로스 (Zephyros)**: 바람 / Bronze / Lv.1 / [1, 3, 3, 5] (P.12)
22. **No.22 실프 (Sylph)**: 바람 / Bronze / Lv.2 / [5, 3, 3, 4] (P.15)
23. **No.23 실피드 (Sylphid)**: 바람 / Bronze / Lv.3 / [3, 5, 5, 5] (P.18)
24. **No.24 하피 (Harpy)**: 바람 / Bronze / Lv.4 / [4, 6, 2, 7] (P.19)
25. **No.25 에올루스 (Aeolus)**: 바람 / Bronze / Lv.5 / [7, 6, 5, 3] (P.21)
26. **No.26 템페스트 (Tempest)**: 바람 / Silver / Lv.6 / [4, 8, 7, 3] (P.22)
27. **No.27 사이클론 (Cyclone)**: 바람 / Silver / Lv.7 / [8, 5, 2, 8] (P.23)
28. **No.28 제우스피어 (Zeusphere)**: 바람 / Silver / Lv.8 / [3, 7, 9, 6] (P.25)
29. **No.29 뇌신 (Raijin)**: 바람 / Gold / Lv.9 / [7, 10, 1, 7] (P.25)
30. **No.30 바람신 토람 (Wind God Toram)**: 바람 / Gold / Lv.10 / [5, 10, 3, 9] (P.27)
31. **No.31 가이아 (Gaia)**: 대지 / Bronze / Lv.1 / [6, 1, 1, 2] (P.10)
32. **No.32 그놈 (Gnome)**: 대지 / Bronze / Lv.2 / [6, 1, 4, 3] (P.14)
33. **No.33 테라 (Terra)**: 대지 / Bronze / Lv.3 / [7, 5, 1, 3] (P.16)
34. **No.34 고르곤 (Gorgon)**: 대지 / Bronze / Lv.4 / [2, 7, 6, 3] (P.18)
35. **No.35 오벨리스크 (Obelisk)**: 대지 / Bronze / Lv.5 / [3, 10, 2, 1] (P.16)
36. **No.36 그랜드로크 (Grandrock)**: 대지 / Silver / Lv.6 / [7, 2, 8, 5] (P.22)
37. **No.37 록타 (Rokta)**: 대지 / Silver / Lv.7 / [5, 6, 6, 8] (P.25)
38. **No.38 오리하르콘 (Orihalcon)**: 대지 / Silver / Lv.8 / [9, 3, 9, 2] (P.23)
39. **No.39 아틀라스 (Atlas)**: 대지 / Gold / Lv.9 / [8, 10, 3, 5] (P.26)
40. **No.40 콜로서스 (Colossus)**: 대지 / Gold / Lv.10 / [10, 8, 6, 4] (P.28) | [IMMUNITY] 콤보 및 반격 완전 면역
41. **No.41 카단 (Kadan)**: 인간 / Bronze / Lv.1 / [2, 3, 1, 5] (P.11)
42. **No.42 엘윈 (Elwin)**: 인간 / Bronze / Lv.1 / [2, 1, 2, 6] (P.11)
43. **No.43 발리안 (Balian)**: 인간 / Bronze / Lv.2 / [3, 4, 5, 3] (P.15)
44. **No.44 카제 (Kaze)**: 인간 / Bronze / Lv.3 / [7, 1, 5, 3] (P.16)
45. **No.45 가웨인 (Gawain)**: 인간 / Bronze / Lv.4 / [1, 6, 4, 7] (P.18)
46. **No.46 론돌 (Rondol)**: 인간 / Silver / Lv.5 / [6, 2, 6, 7] (P.21)
47. **No.47 길가메시 (Gilgamesh)**: 인간 / Silver / Lv.6 / [1, 8, 8, 3] (P.20)
48. **No.48 로비냐드 (Robinyard)**: 인간 / Silver / Lv.7 / [8, 8, 7, 3] (P.26)
49. **No.49 헤르쿨 (Hercul)**: 인간 / Gold / Lv.8 / [9, 4, 8, 4] (P.25)
50. **No.50 알렉산다르 (Aleksandar)**: 인간 / Gold / Lv.10 / [9, 6, 10, 2] (P.27) | [TIME_WARP] 적 턴 강제 스킵
51. **No.51 워커 (Walker)**: 언데드 / Bronze / Lv.1 / [2, 1, 4, 4] (P.11)
52. **No.52 구울 (Ghoul)**: 언데드 / Bronze / Lv.2 / [5, 3, 2, 5] (P.15)
53. **No.53 캐리언 (Carrion)**: 언데드 / Bronze / Lv.2 / [5, 2, 5, 3] (P.15)
54. **No.54 아라크네 (Arachne)**: 언데드 / Bronze / Lv.3 / [5, 6, 3, 3] (P.17)
55. **No.55 패치워크 (Patchwork)**: 언데드 / Bronze / Lv.4 / [7, 3, 1, 6] (P.17)
56. **No.56 카르디스 (Cardis)**: 언데드 / Silver / Lv.5 / [5, 5, 7, 4] (P.21)
57. **No.57 스톤가고일 (Stone Gargoyle)**: 언데드 / Silver / Lv.6 / [8, 2, 8, 2] (P.20)
58. **No.58 사이드라고사 (Sidragosa)**: 언데드 / Silver / Lv.7 / [8, 3, 5, 8] (P.24)
59. **No.59 켈투스 (Keltus)**: 언데드 / Gold / Lv.8 / [2, 9, 9, 4] (P.24)
60. **No.60 데스나이트 아르투스 (Death Knight Artus)**: 언데드 / Gold / Lv.10 / [2, 6, 9, 10] (P.27)
61. **No.61 루시안 (Lucian)**: 엘프 / Bronze / Lv.1 / [2, 1, 6, 1] (P.10)
62. **No.62 실리아 (Celia)**: 엘프 / Bronze / Lv.2 / [4, 4, 5, 2] (P.15)
63. **No.63 엘리아나 (Eliana)**: 엘프 / Bronze / Lv.3 / [6, 2, 6, 3] (P.17)
64. **No.64 티타니아 (Titania)**: 엘프 / Bronze / Lv.3 / [7, 2, 3, 5] (P.17)
65. **No.65 실바니아 (Sylvania)**: 엘프 / Bronze / Lv.4 / [6, 2, 7, 3] (P.18)
66. **No.66 말퓨온 (Malfuon)**: 엘프 / Silver / Lv.5 / [5, 3, 7, 6] (P.21)
67. **No.67 베작스 (Vezax)**: 엘프 / Silver / Lv.6 / [1, 8, 4, 8] (P.21)
68. **No.68 캘토르 (Kaeltor)**: 엘프 / Silver / Lv.7 / [6, 8, 4, 7] (P.25)
69. **No.69 간다르 (Gandar)**: 엘프 / Gold / Lv.8 / [8, 9, 6, 2] (P.25)
70. **No.70 에일라 (Aila)**: 엘프 / Gold / Lv.10 / [8, 5, 10, 6] (P.29)
71. **No.71 발보 (Balbo)**: 드워프 / Bronze / Lv.1 / [4, 2, 4, 3] (P.13)
72. **No.72 프레도 (Fredo)**: 드워프 / Bronze / Lv.2 / [3, 2, 1, 7] (P.13)
73. **No.73 샘와이 (Samwy)**: 드워프 / Bronze / Lv.3 / [3, 6, 4, 4] (P.17)
74. **No.74 그림리 (Grimli)**: 드워프 / Bronze / Lv.4 / [4, 5, 5, 6] (P.20)
75. **No.75 마그니스 (Magnis)**: 드워프 / Bronze / Lv.4 / [7, 5, 4, 3] (P.19)
76. **No.76 브란디 (Brandy)**: 드워프 / Silver / Lv.5 / [4, 8, 7, 4] (P.23)
77. **No.77 무라디 (Muradi)**: 드워프 / Silver / Lv.6 / [6, 5, 8, 4] (P.23)
78. **No.78 토그림 (Thorgrim)**: 드워프 / Silver / Lv.7 / [1, 8, 7, 7] (P.23)
79. **No.79 베리포지 (Berryforge)**: 드워프 / Gold / Lv.8 / [5, 1, 9, 9] (P.24)
80. **No.80 아이언포지 (Ironforge)**: 드워프 / Gold / Lv.10 / [4, 10, 2, 10] (P.26)
81. **No.81 펜릴 (Fenrir)**: 몬스터 / Bronze / Lv.1 / [3, 5, 2, 1] (P.11)
82. **No.82 미노타우로스 (Minotaur)**: 몬스터 / Bronze / Lv.2 / [5, 2, 5, 2] (P.14)
83. **No.83 요르문간드 (Jormungandr)**: 몬스터 / Bronze / Lv.3 / [4, 4, 7, 2] (P.17)
84. **No.84 그리폰 (Griffon)**: 몬스터 / Bronze / Lv.4 / [3, 7, 3, 6] (P.19)
85. **No.85 바이라 (Byra)**: 몬스터 / Bronze / Lv.5 / [7, 2, 7, 4] (P.20)
86. **No.86 레오나르 (Leonar)**: 몬스터 / Silver / Lv.6 / [4, 8, 5, 6] (P.23)
87. **No.87 바르가스트 (Barghest)**: 몬스터 / Silver / Lv.6 / [7, 5, 8, 1] (P.21)
88. **No.88 우르삭 (Ursoc)**: 몬스터 / Silver / Lv.7 / [5, 7, 8, 5] (P.25)
89. **No.89 메두사 고르고 (Medusa Gorgo)**: 몬스터 / Gold / Lv.8 / [9, 6, 2, 8] (P.25)
90. **No.90 페가수스 (Pegasus)**: 몬스터 / Gold / Lv.9 / [7, 2, 7, 10] (P.26)
91. **No.91 스파이더봇 (Spiderbot)**: 로봇 / Bronze / Lv.1 / [1, 5, 4, 1] (P.11)
92. **No.92 크로노스 (Chronos)**: 로봇 / Bronze / Lv.2 / [5, 1, 3, 5] (P.14)
93. **No.93 센티넬 (Sentinel)**: 로봇 / Bronze / Lv.3 / [5, 6, 2, 4] (P.17)
94. **No.94 디바스터 (Devastator)**: 로봇 / Bronze / Lv.4 / [7, 4, 4, 4] (P.19)
95. **No.95 골리앗 (Goliath)**: 로봇 / Bronze / Lv.5 / [7, 7, 4, 2] (P.20)
96. **No.96 시즈엔진 (Siege Engine)**: 로봇 / Silver / Lv.5 / [6, 6, 2, 7] (P.21)
97. **No.97 하이페리온 프라임 (Hyperion Prime)**: 로봇 / Silver / Lv.6 / [6, 8, 4, 5] (P.23)
98. **No.98 아이언클래드 (Ironclad)**: 로봇 / Silver / Lv.7 / [8, 8, 5, 4] (P.25)
99. **No.99 마기테크 골렘 (Magitech Golem)**: 로봇 / Gold / Lv.8 / [6, 7, 4, 9] (P.26)
100. **No.100 오메가 웨폰 (Omega Weapon)**: 로봇 / Gold / Lv.9 / [9, 10, 4, 2] (P.25)
101. **No.101 드레이크 (Drake)**: 드래곤 / Silver / Lv.7 / [7, 7, 2, 8] (P.24)
102. **No.102 와이버니 (Wyverny)**: 드래곤 / Silver / Lv.8 / [9, 5, 2, 9] (P.25)
103. **No.103 네더드래곤 (Netherdragon)**: 드래곤 / Gold / Lv.9 / [10, 1, 7, 7] (P.25)
104. **No.104 바하무트 (Bahamut)**: 드래곤 / Gold / Lv.9 / [7, 4, 6, 10] (P.27)
105. **No.105 스파이크드래곤 (Spikedragon)**: 드래곤 / Gold / Lv.9 / [10, 8, 2, 6] (P.26)
106. **No.106 어스드래곤 테라 (Earth Dragon Terra)**: 드래곤 / Gold / Lv.9 / [3, 1, 10, 10] (P.24)
107. **No.107 이셀라 (Ysela)**: 드래곤 / Gold / Lv.9 / [4, 4, 9, 10] (P.27)
108. **No.108 알렉스트라 (Alexstra)**: 드래곤 / Gold / Lv.10 / [10, 10, 3, 3] (P.26)
109. **No.109 말리곤 (Malygon)**: 드래곤 / Gold / Lv.10 / [6, 9, 10, 4] (P.29)
110. **No.110 드레드윙 (Dreadwing)**: 드래곤 / Gold / Lv.10 / [10, 4, 6, 9] (P.29)

---

## 1.4 3x3 배틀 엔진 & 상세 판정 알고리즘

### 보드 및 턴 룰
- **보드**: 3x3 (총 9칸, 인덱스 0~8)
- **핸드**: P1(플레이어: 블루) 5장, P2(AI/상대: 레드) 5장
- **배치**: 턴을 번갈아가며 보드의 빈 칸에 1장씩 배치 (총 9턴 진행, 마지막 1장은 핸드에 잔여)
- **승리 조건**: 9칸 배치 종료 후 `(보드 위 점유 카드 수) + (핸드 잔여 카드 1장)`의 합산이 6 이상이면 승리, 5:5 무승부, 4 이하 패배.

### 4방향 스탯 비교 및 플립(Flip) 공식
카드가 배치된 셀을 `C`라 할 때, 4방향 인접 셀 검사:
- **상단 (Top, `C - 3`)**: `C >= 3`일 때 검사. `PlacedCard.stats[0](Top) > TargetCard.stats[2](Bottom)`이면 플립.
- **우측 (Right, `C + 1`)**: `C % 3 < 2`일 때 검사. `PlacedCard.stats[1](Right) > TargetCard.stats[3](Left)`이면 플립.
- **하단 (Bottom, `C + 3`)**: `C <= 5`일 때 검사. `PlacedCard.stats[2](Bottom) > TargetCard.stats[0](Top)`이면 플립.
- **좌측 (Left, `C - 1`)**: `C % 3 > 0`일 때 검사. `PlacedCard.stats[3](Left) > TargetCard.stats[1](Right)`이면 플립.

### 연쇄 콤보 (Combo Chain)
뒤집힌 카드는 즉시 새로운 공격 주체가 되어 자신의 인접 상대 카드를 동일한 방식으로 연속 검사하여 뒤집습니다. (BFS/Queue 방식 적용, 중복 방문 방지).

### 전술 스탠스 및 AI 엔진
- **공격형 (Aggressive)**: 당장 가장 많은 상대 카드를 뒤집을 수 있는 셀 우선 선택.
- **방어형 (Defensive)**: 외곽 코너(0, 2, 6, 8)에 강한 수치를 바깥으로 향하게 배치하여 상대방에게 공격받지 않도록 방어.
- **균형형 (Balanced)**: 획득 플립 점수와 노출된 약점의 손실 위험을 가중치(Score = Flips * 2 - Vulnerabilities)로 평가하여 최적수 계산.

---

## 1.5 가챠(Gacha) 확률 및 경제 밸런스

```
┌─────────────┬───────────┬─────────────┬──────────────────────────────────────────┐
│ 팩 종류     │ 비용      │ 천장 (Pity) │ 기본 획득 확률                           │
├─────────────┼───────────┼─────────────┼──────────────────────────────────────────┤
│ Bronze Pack │ 10 SNS    │ 30회        │ Bronze: 99.899%, Silver: 0.1%, Gold: 0.001%│
│ Silver Pack │ 100 SNS   │ 20회        │ Bronze: 97.98%, Silver: 2.0%, Gold: 0.02%│
│ Gold Pack   │ 1,000 SNS │ 10회        │ Bronze: 84.5%, Silver: 15.0%, Gold: 0.5% │
│ 10연속 뽑기 │ 10% 할인  │ 누적 적용   │ 단일 팩 확률 × 10회 (천장 카운트 10 즉시 가산) │
└─────────────┴───────────┴─────────────┴──────────────────────────────────────────┘
```

---

# PART 2. 디자인 시스템 가이드 (OpenCode Monospace Design)

본 프로젝트는 불필요한 시각적 장식(그라데이션, 드롭 섀도우, 둥근 곡선)을 배제하고 순수한 텍스트와 1px 헤어라인만으로 구축된 **터미널 네이티브 모노스페이스 시스템**을 지향합니다.

## 2.1 색상 팔레트 토큰 (Design Tokens)
- **Canvas (배경)**: `#fdfcfc` (Warm Cream — 은은하고 따뜻한 크림빛 화이트)
- **Ink (주조 텍스트/버튼)**: `#201d1d` (Deep Ink — 완전한 블랙 대신 따뜻한 잉크 흑색)
- **Ink Deep (버튼 눌림)**: `#0f0000` (극암색)
- **Body / Mute (본문/보조)**: Body: `#424245`, Mute: `#646262`, Ash: `#9a9898`
- **Surface Soft / Card**: Soft: `#f8f7f7`, Card: `#f1eeee`, Dark Mockup: `#201d1d`
- **Hairline (구분선)**: 1px solid `rgba(15,0,0,0.12)` 또는 `border-[#201d1d]/15`
- **Semantic Signals**: Accent: `#007aff` (블루), Danger: `#ff3b30` (레드), Warning: `#ff9f0a` (골드), Success: `#30d158` (그린)

## 2.2 타이포그래피 규칙
- **서체 100% Monospace**: `font-family: 'JetBrains Mono', 'Berkeley Mono', 'Courier New', monospace`
- **제목 (Hero Title)**: 24px ~ 32px / Bold / Monospace
- **섹션 라벨 (Heading)**: 14px ~ 16px / Bold / 대괄호 마커 동반 (`[+] MY DECK`, `[x] SYSTEM`)
- **본문 (Body)**: 13px ~ 15px / Regular / Line-height: 1.5
- **버튼 (Button)**: 13px ~ 14px / Medium / `rounded-sm` (4px) / 44px 터치 높이 확보

## 2.3 모서리 반경 & 요소 규칙
- **컨테이너/패널/모달/섹션**: `rounded-none` (0px 직각 모서리 + 1px hairline 보더)
- **인터랙티브 요소(버튼/인풋/뱃지)**: `rounded-sm` (4px 미세 라운딩)
- **아이콘 대체 마커**: SVG 남발 대신 `[+]`, `[-]`, `[x]`, `+`, `−`, `[PULL]`, `[BATTLE]` 등의 텍스트 마커 사용

---

# PART 3. 카드 스프라이트 시트 그리드 렌더링 시스템

## 3.1 규격 및 파일 구조
- **`public/cards1.png`**: 10열 × 10행 스프라이트 시트 (ID 1 ~ 100 카드)
- **`public/cards2.png`**: 10열 × 10행 스프라이트 시트 (ID 101 ~ 110+ 카드)
- **사이즈**: 각 칸은 정방형 비율이며, CSS `background-size: 1000% 1000%`로 스케일링됩니다.

## 3.2 핵심 CSS 백그라운드 계산 코드
```typescript
export function getCardSpriteStyle(cardId: number): React.CSSProperties {
  const id = Math.max(1, Number(cardId) || 1);
  const isCards2 = id >= 101;
  const imageSource = isCards2 ? '/cards2.png' : '/cards1.png';
  const slotIndex = isCards2 ? (id - 101) % 100 : (id - 1) % 100;
  
  const col = slotIndex % 10;
  const row = Math.floor(slotIndex / 10);
  
  // 10칸 시트에서 0~9번 인덱스는 col * (100 / 9)%
  const xPercent = col * (100 / 9);
  const yPercent = row * (100 / 9);
  
  return {
    backgroundImage: `url('${imageSource}')`,
    backgroundSize: '1000% 1000%',
    backgroundPosition: `${xPercent}% ${yPercent}%`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
  };
}
```

## 3.3 CardItem 컴포넌트 렌더링 명세
```tsx
export const CardItem: React.FC<{
  card: CardData;
  onClick?: () => void;
  className?: string;
  isSelected?: boolean;
}> = ({ card, onClick, className, isSelected }) => {
  const spriteStyle = getCardSpriteStyle(Number(card.id));
  const ownerBorder = card.owner === 'player' ? 'border-[#007aff]' : card.owner === 'ai' ? 'border-[#ff3b30]' : 'border-[#201d1d]/20';
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative aspect-[3/4] w-full rounded-sm border bg-[#f8f7f7] p-1 font-mono cursor-pointer select-none transition-all",
        ownerBorder,
        isSelected && "ring-2 ring-[#007aff] scale-105",
        className
      )}
    >
      {/* 10x10 스프라이트 시트 카드 아트 */}
      <div className="relative w-full h-[65%] rounded-sm overflow-hidden border border-[#201d1d]/10" style={spriteStyle}>
        <div className="absolute top-0.5 left-0.5 bg-[#201d1d]/80 text-[#fdfcfc] text-[9px] px-1 rounded-sm">
          #{String(card.id).padStart(2, '0')}
        </div>
        <div className="absolute top-0.5 right-0.5 bg-[#201d1d]/80 text-[#ff9f0a] text-[9px] px-1 rounded-sm uppercase">
          {card.rarity[0]}
        </div>
      </div>
      
      {/* 카드 정보 및 4방향 스탯 십자 렌더링 */}
      <div className="mt-1 flex flex-col justify-between h-[30%]">
        <div className="text-[10px] font-bold text-[#201d1d] truncate">
          {card.title || card.title_en}
        </div>
        <div className="grid grid-cols-3 grid-rows-3 text-center text-[9px] font-bold text-[#424245] leading-none">
          <div></div>
          <div className="text-[#007aff]">{card.stats[0]}</div>
          <div></div>
          <div className="text-[#ff3b30]">{card.stats[3]}</div>
          <div className="text-[8px] text-[#9a9898]">★</div>
          <div className="text-[#30d158]">{card.stats[1]}</div>
          <div></div>
          <div className="text-[#ff9f0a]">{card.stats[2]}</div>
          <div></div>
        </div>
      </div>
    </div>
  );
};
```

---

# PART 4. 모든 화면(Views)별 레이아웃 & 상세 구현 명세

## 4.1 `HomeView` (메인 로비)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [SNS HERO REV]               [⚡ 1,250 SNS]   [🔊 ON]   [🌐 KO]   [⚙️ SETTING]│
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🎪 [BANNER] 시즌1 개막: 포세이돈 & 이그니시우스 픽업 가챠 진행 중!     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ ⏳ 랭킹 배틀 자동 대기 중... [ 28초 후 자동 매칭 ]       [⏹️ 일시정지]  │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│ ┌───────────────────┬───────────────────┬───────────────────┬─────────────┐ │
│ │ [⚔️ BATTLE START] │ [🃏 MY DECK]      │ [🛍️ GACHA SHOP]   │ [🗺️ RPG]    │ │
│ └───────────────────┴───────────────────┴───────────────────┴─────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 📦 [방치형 순찰 (AFK Patrol)] 축적: +180 SNS (3시간 진행 중) [보상 수령]│ │
│ ├─────────────────────────────────────────────────────────────────────────┤ │
│ │ 📜 [일일 미션]                                                          │ │
│ │  [x] 배틀 3회 플레이 (3/3) ── [수령 완료]                               │ │
│ │  [ ] 카드 뽑기 1회 진행 (0/1) ── [바로가기]                             │ │
│ │  [ ] 미니게임 1회 클리어 (0/1) ── [바로가기]                            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4.2 `MyDeckView` (덱 편성 & 다마고치 육성)
- **5장 출전 슬롯**: 클릭 또는 드래그로 장착/해제. 덱 전체 전투력(Power) 실시간 합산.
- **장비 슬롯 4개**: 목걸이(상 스탯 +1~3), 반지1(우 스탯 +1~3), 반지2(하 스탯 +1~3), 부츠(좌 스탯 +1~3).
- **다마고치 돌봄 (Hero Care)**:
  - 포만감(Hunger) 0~100, 행복도(Happiness) 0~100, 피로도(Rest) 0~100.
  - `[밥주기]` (10 SNS), `[놀아주기]` (15 SNS), `[훈련하기]` (+경험치), `[휴식]`.
- **카드 분해/합성**: 중복 Bronze/Silver 일괄 분해(개당 10~50 SNS 환급), 동일 등급 카드 3장 합성 시 상위 등급 1장 확정 지급.

## 4.3 `PlayGameView` (3x3 메인 배틀 및 게임 모드)
- **3x3 보드**: 9개 슬롯 그리드.
- **플레이어 핸드 (5장)** vs **상대 핸드 (5장)**.
- **배속/자동 토글**: `[AUTO: ON/OFF]`, `[SPEED: 1x / 2x / 3x]`.
- **전술 스탠스 바**: `[공격형: Aggressive]` | `[수비형: Defensive]` | `[균형형: Balanced]`.
- **콤보 연쇄 플립 애니메이션**: 뒤집힐 때 0.15초 간격으로 연속 사운드 및 플래시 피드백.
- **결과 패널**: 승리 시 `VICTORY +30 SNS`, 패배 시 `DEFEAT +5 SNS`, 경험치 획득 및 카드 레벨업 연출.

## 4.4 `ShopView` (가챠 상점 & 천장)
- **1회 뽑기**: 100 SNS
- **10회 연속 뽑기**: 900 SNS (10% 할인)
- **천장 게이지**: 30회 뽑기 진행 시 Gold 등급 이상 카드 100% 확정 지급 게이지 바(`PITY: 18 / 30`).
- **가챠 오픈 시퀀스**: 카드 뒷면 팩 터치 ➔ 빛 기둥 연출 (Bronze: 백색, Silver: 청색, Gold: 황금색, Legendary: 무지개색) ➔ 개봉 결과 카드 그리드 노출.
- **장비팩 뽑기**: 150 SNS (목걸이/반지/부츠 랜덤 획득).

## 4.5 `KadanRpgView` (카단 & 아케인 에코즈 2D 타일 RPG)
- **타일 맵**: 10×8 2D 타일 격자 맵 (눈밭, 절벽, 성곽, 동굴 등 10개 챕터).
- **영웅 이동**: 상/하/좌/우 터치 또는 자동 이동(`[AUTO RUNNER]`).
- **인카운터**:
  - `NPC 타일`: 퀘스트 대화창 팝업.
  - `상자 타일`: 100~500 SNS 및 장비 아이템 즉시 획득.
  - `적 몬스터 타일`: 즉각 3x3 카드 배틀 진입 ➔ 승리 시 길 개방.
- **엔딩 및 환생(Reincarnation)**: 10챕터 최종 보스 격파 시 누적 스탯 10%를 영구 계승한 채 2회차 시작.

## 4.6 미니게임 8종 (`MiniGames`)
1. **카드러시 (Card Rush)**: 3초마다 제시되는 속성(불/물/바람/땅)에 맞는 카드를 빠르게 탭하는 순발력 게임.
2. **카드하이스트 (Card Heist)**: 적 경비병의 시야를 피해 금고까지 카드를 이동시키는 스텔스 잠입 퍼즐.
3. **카드탭 (Card Tap)**: 15초 제한 시간 동안 화면에 무작위로 뜨는 카드를 연속 연타하여 점수 달성.
4. **카드슬롯 (Card Slot)**: 3개 릴의 슬롯머신을 돌려 3장 일치 시 대량 SNS 잭팟 지급.
5. **카드소서리 (Card Sorcery)**: 마법진에 요구되는 원소 카드를 순서대로 조합하는 마법 조합 퍼즐.
6. **카드플립 (Card Flip)**: 4x4 뒤집힌 카드 중 같은 짝 2장을 찾아내는 기억력 게임.
7. **카드슬라이드 (Card Slide)**: 3x3 격자에서 한 칸 비어있는 타일을 밀어 원본 일러스트를 완성하는 슬라이딩 퍼즐.
8. **카드점퍼 (Card Jumper)**: 다가오는 장애물을 탭으로 뛰어넘는 러닝 점프 아케이드.

## 4.7 `SettingView` 및 `BackupRestoreModal` (애니메이션 QR 백업/복원)
- **애니메이션 QR 분할 백업**: 로컬스토리지 전체 데이터를 LZ-String 압축 후 280~750자 청크 단위로 쪼개어 0.5초 주기로 순환 송출하는 애니메이션 QR 코드 생성.
- **카메라 연속 프레임 스캔 복원**: 모바일 카메라로 애니메이션 QR 코드를 비추면 1~2회전 동안 무작위 순서로 캡처된 조각들을 100% 자동 결합하여 계정 데이터를 원클릭 복원.
- **다국어(i18n)**: 한국어, 영어, 일본어, 중국어 원클릭 토글.

---

# PART 5. 로컬스토리지(LocalStorage) 데이터 스키마 명세

모든 데이터는 아래 키 목록을 기반으로 로컬스토리지에 저장되고 관리됩니다:

```typescript
export const STORAGE_KEYS = {
  CURRENT_SEASON: 'hero_current_season',         // 기본값: 'season1'
  USER_NAME: 'hero_user_name',                   // 유저 닉네임 (기본값: 'HERO')
  USER_AVATAR: 'hero_user_avatar',               // 유저 아바타 카드 ID (기본값: 'preset:1')
  SNS_BALANCE: 'hero_sns_points',                // 보유 SNS 포인트 (기본값: 1000)
  CURRENT_DECK: 'hero_current_deck_season1',     // 5장 출전 덱 [CardData, ...]
  OWNED_CARDS: 'hero_owned_cards_season1',       // 보유 인벤토리 카드 목록
  EQUIPPED_ITEMS: 'hero_equipped_items_season1', // 카드별 장착 장비
  USER_STATS: 'hero_user_stats',                 // 승/패/무 전적 및 랭킹 점수
  GACHA_PITY: 'hero_gacha_pity_season1',         // 가챠 천장 카운트 (0~30)
  HERO_GROWTH: 'hero_hero_growth_season1',       // 다마고치 육성 상태
  KADAN_RPG: 'hero_kadan_rpg_progress_season1',  // 카단 RPG 진행도
  AUDIO_BGM: 'hero_bgm',                         // BGM 켜짐 여부 ('true'/'false')
  AUDIO_SFX: 'hero_sfx',                         // SFX 켜짐 여부 ('true'/'false')
  LANGUAGE: 'hero_lang',                         // 언어 ('ko', 'en' 등)
};
```

---

# PART 6. Web Audio API 기반 오디오 신디사이저

외부 mp3 파일이 없어도 브라우저 자체 Web Audio API로 칩튠 효과음과 사운드를 실시간 합성합니다:

```typescript
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) { this.isMuted = muted; }

  public playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public playCardPlace() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  public playFlip(combo: number = 0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const freq = 523.25 * Math.pow(1.15, combo);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playVictory() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx!.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(this.ctx!.currentTime + i * 0.08);
      osc.stop(this.ctx!.currentTime + i * 0.08 + 0.25);
    });
  }
}

export const sound = new SoundEngine();
```

---

# PART 7. AI Studio 마스터 프롬프트 실행 가이드

Google AI Studio에 본 `snshero.md` 전체 내용을 첨부한 후, 프롬프트 입력창에 아래 지시문을 전달하여 즉각 완성형 코드를 빌드하십시오:

```markdown
[지시문]:
첨부된 [SNSHero Revolution 마스터 기획 및 디자인 사양서 (snshero.md)]의 모든 기획 내용, 디자인 토큰, 110종 카드 데이터베이스, 3x3 배틀 알고리즘, 스프라이트 그리드 렌더링, 덱 관리/다마고치 육성, 가챠 상점, 카단 RPG, 미니게임 8종, LocalStorage 영구 저장 스키마, Web Audio 사운드 시스템을 100% 반영하여 바로 실행 가능한 완전한 React 19 + TypeScript + Tailwind CSS 단일 애플리케이션 코드를 작성해주세요.

[필수 구현 체크리스트]:
1. /public/cards1.png (1~100) 및 /public/cards2.png (101~110+) 10x10 스프라이트 시트 CSS 그리드 연산 (getCardSpriteStyle) 적용
2. 110종 전체 CARD_DATABASE 및 11종 속성, 6개 등급, 7종 특수 어빌리티(SHIELD, WALL, COUNTER 등) 완벽 내장
3. 3x3 보드 Triple Triad 배틀 엔진: 상하좌우 스탯 비교 플립, 연쇄 콤보, 1x/2x/3x 배속 자동전투
4. 모든 뷰 구현: HomeView(로비/30초 타이머/AFK순찰), MyDeckView(덱편성/다마고치육성/합성/분해), PlayGameView(랭킹/모험/보스/시련의탑/원정대), ShopView(가챠/10연차/천장시스템), KadanRpgView(2D타일 RPG), 미니게임 8종, BackupRestoreModal(애니메이션 QR 백업/카메라 복원)
5. LocalStorage 100% 기반 영구 데이터 저장 및 신규 접속 시 5장 기본 덱 + 1,000 SNS 자동 지급
6. DESIGN.md 준수: Berkeley Mono 폰트, Warm Cream (#fdfcfc), Deep Ink (#201d1d), 1px Hairline, 4px 인터랙티브 버튼 반경, [BATTLE]/[+] ASCII 마커
7. Web Audio API 신디사이저 사운드 엔진 내장 (클릭, 카드배치, 콤보플립, 가챠 팡파레)

생략 없이 모든 컴포넌트와 인터랙션이 100% 작동하도록 완벽하게 코드를 작성해 주세요.
```
