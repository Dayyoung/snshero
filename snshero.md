# SNSHero Revolution: AI Studio 마스터 원샷 개발 프롬프트 지침서 (`snshero.md`)

> **문서 목적**: 본 지침서는 Google AI Studio, Gemini API 또는 최신 AI 코딩 에이전트에 단일 컨텍스트/프롬프트로 첨부하여, 100% 작동 가능한 완성형 **'SNS히어로 (SNSHero Revolution)'** 웹 카드 배틀 게임(React + TypeScript + Tailwind CSS + LocalStorage)을 단 한 번에 완벽히 생성하도록 설계된 **마스터 원샷 프롬프트 명세서**입니다.
> 
> 카드 이미지는 `/public/cards1.png` (카드 ID 1~100) 및 `/public/cards2.png` (카드 ID 101~110+) 10x10 스프라이트 시트를 그리드 연산으로 자동 매핑합니다.

---

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║                          [AI STUDIO MASTER PROMPT]                               ║
║                                                                                  ║
║  "당신은 세계 최고의 풀스택 프론트엔드 게임 개발자이자 시스템 아키텍트입니다.       ║
║   아래에 제공된 [SNSHero 게임 마스터 사양서] 전체를 100% 반영하여, 모든 화면,      ║
║   3x3 배틀 엔진, 110종 카드 스프라이트 그리드 렌더링, 덱 편집, 가챠 상점,          ║
║   카단 RPG, 미니게임 8종, 다마고치 돌봄, 로컬스토리지 영구 저장, Web Audio 사운드,  ║
║   Monospace/Warm Cream 디자인 시스템을 갖춘 완전한 React 게임을 작성하십시오."    ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

# 1. 프로젝트 아키텍처 및 핵심 원칙

### 1.1 기술 스택
- **프레임워크**: React 19 (Functional Components + Hooks)
- **언어**: TypeScript 5.8+ (`strict` 모드, `any` 최소화)
- **스타일링**: Tailwind CSS 4.x + Lucide-react 아이콘 + Monospace 폰트 (Berkeley Mono / JetBrains Mono)
- **사운드**: 브라우저 Web Audio API 기반 8비트/칩튠 실시간 신디사이저 (외부 오디오 의존성 제로)
- **데이터 저장소**: **100% 로컬스토리지 (LocalStorage) 기반 영구 저장** (Single Source of Truth)

### 1.2 데이터 무결성 및 단일 진실 공급원 (Single Source of Truth) 원칙
- **영구 보존**: 카드 인벤토리, 덱, SNS 포인트(재화), 장비, 전적, 스토리 진행도, RPG 진행도 등 모든 게임 데이터는 `localStorage`에 즉각 동기화됩니다.
- **초기 부트스트랩**: 사용자가 게임에 처음 접속할 때 기본 5장 덱 (아쿠아리스, 이그니스, 제피로스, 가이아, 카단)과 1,000 SNS 포인트를 자동으로 지급합니다.

---

# 2. 디자인 시스템 (OpenCode Monospace & Warm Cream Theme)

본 게임의 모든 UI는 `DESIGN.md` (Monospace Design Standard)를 전적으로 준수합니다.

```
┌─────────────────────────┬────────────────────────────────────────────────────────┐
│ 구분                     │ 규격 및 스타일 토큰                                     │
├─────────────────────────┼────────────────────────────────────────────────────────┤
│ 서체 (Typography)       │ Monospace 100% (JetBrains Mono, Courier New, monospace)│
│ 배경 캔버스 (Canvas)    │ Warm Cream: `#fdfcfc`                                  │
│ 주조색 및 텍스트 (Ink)   │ Deep Ink: `#201d1d`, Deep Near-Black: `#0f0000`        │
│ 서브 텍스트 (Body/Mute) │ Body: `#424245`, Mute: `#646262`, Ash: `#9a9898`       │
│ 표면 카드 (Surface)     │ Soft: `#f8f7f7`, Card: `#f1eeee`, Dark TUI: `#201d1d`  │
│ 구분선 (Hairline)       │ 1px solid `rgba(15,0,0,0.12)` 또는 `border-[#201d1d]/15`│
│ 모서리 반경 (Radius)    │ 인터랙티브(버튼/인풋): 4px (`rounded-sm`), 컨테이너: 0px │
│ 시그널 색상 (Semantic)  │ Blue: `#007aff`, Red: `#ff3b30`, Gold: `#ff9f0a`, Green: `#30d158` │
│ 아이콘 & 마커           │ 대괄호 ASCII 마커: `[+]`, `[-]`, `[x]`, `[BATTLE]`, `[PULL]`│
│ 터치 타깃 (Touch)       │ 최소 44px 이상 터치 영역 확보, 모바일 `100dvh` 레이아웃│
└─────────────────────────┴────────────────────────────────────────────────────────┘
```

---

# 3. 카드 스프라이트 시트 및 그리드 연산 시스템

카드 이미지는 두 장의 10x10 스프라이트 시트 이미지(`/cards1.png`, `/cards2.png`)를 기반으로 정밀한 CSS 백그라운드 포지셔닝을 수행합니다.

### 3.1 스프라이트 매핑 규칙
- **카드 ID 1 ~ 100**: `/cards1.png` (또는 `/public/cards1.png`)
- **카드 ID 101 ~ 110+**: `/cards2.png` (또는 `/public/cards2.png`)
- **스프라이트 규격**: 가로 10열, 세로 10행 (총 100칸)

### 3.2 CSS 백그라운드 좌표 계산 공식
```typescript
/**
 * 카드 ID로부터 스프라이트 시트 위치 스타일을 반환합니다.
 */
export function getCardSpriteStyle(cardId: number): React.CSSProperties {
  const id = Math.max(1, Number(cardId) || 1);
  const isCards2 = id >= 101;
  const imageSource = isCards2 ? '/cards2.png' : '/cards1.png';
  
  // 0~99 인덱스로 변환
  const slotIndex = isCards2 ? (id - 101) % 100 : (id - 1) % 100;
  
  const col = slotIndex % 10;
  const row = Math.floor(slotIndex / 10);
  
  // 10칸일 때 퍼센트 = index * (100 / (10 - 1)) = index * 11.111111%
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

### 3.3 속성(Element) 및 희귀도(Rarity) 정의
- **11개 속성**: `water` (물), `fire` (불), `air` (바람/공기), `earth` (대지), `human` (인간), `undead` (언데드), `elf` (엘프), `dwarf` (드워프), `monster` (야수/몬스터), `robot` (기계/로봇), `dragon` (드래곤)
- **6개 희귀도**:
  - `bronze`: 브론즈 (기본)
  - `silver`: 실버 (중급)
  - `gold`: 골드 (상급)
  - `platinum`: 플래티넘 (희귀)
  - `diamond`: 다이아몬드 (초희귀)
  - `legendary`: 레전더리 (최고 등급)

---

# 4. 110종 전체 카드 데이터베이스 (Complete Card Database)

```typescript
export interface DatabaseCard {
  id: number;
  title: string;       // 한글 명칭
  title_en: string;    // 영문 명칭
  level: number;       // 레벨 (1~10)
  element: string;     // 속성
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'legendary';
  stats: [number, number, number, number]; // [Top(상), Right(우), Bottom(하), Left(좌)] (1~10)
  power: number;       // 전투력 합계
  ability?: {
    type: 'SHIELD' | 'COUNTER' | 'WALL' | 'OMNIBOOST' | 'PIERCE' | 'IMMUNITY' | 'TIME_WARP';
    value: number;
    description_ko: string;
    description_en: string;
  };
  lore_ko?: string;
}

export const CARD_DATABASE: Record<number, DatabaseCard> = {
  // ── [Water: 물 속성 (1~10)] ──
  1: { id: 1, title: '아쿠아리스', title_en: 'Aquaris', level: 1, element: 'water', rarity: 'bronze', stats: [1, 4, 1, 5], power: 11, ability: { type: 'SHIELD', value: 1, description_ko: '단단함: 적의 플립 확률을 감소시킵니다.', description_en: 'Hardened: Reduces enemy flip chance.' } },
  2: { id: 2, title: '나이아드', title_en: 'Naiad', level: 2, element: 'water', rarity: 'bronze', stats: [7, 1, 3, 1], power: 12 },
  3: { id: 3, title: '운디네', title_en: 'Undine', level: 3, element: 'water', rarity: 'bronze', stats: [6, 6, 3, 2], power: 17 },
  4: { id: 4, title: '켈피', title_en: 'Kelpie', level: 4, element: 'water', rarity: 'bronze', stats: [2, 3, 6, 7], power: 18 },
  5: { id: 5, title: '아쿠아로드', title_en: 'Aqualord', level: 5, element: 'water', rarity: 'bronze', stats: [6, 5, 6, 5], power: 22 },
  6: { id: 6, title: '레비아탄', title_en: 'Leviathan', level: 6, element: 'water', rarity: 'silver', stats: [2, 8, 8, 4], power: 22 },
  7: { id: 7, title: '가르간티아', title_en: 'Gargantia', level: 7, element: 'water', rarity: 'silver', stats: [8, 4, 4, 8], power: 24 },
  8: { id: 8, title: '캐스케이드', title_en: 'Cascade', level: 8, element: 'water', rarity: 'silver', stats: [4, 4, 8, 9], power: 25 },
  9: { id: 9, title: '크라켄', title_en: 'Kraken', level: 9, element: 'water', rarity: 'gold', stats: [8, 4, 10, 4], power: 26, ability: { type: 'COUNTER', value: 0, description_ko: '반사: 적이 이 카드를 뒤집지 못하면 대신 뒤집힙니다.', description_en: 'Rebound: If enemy fails to flip, they flip instead.' } },
  10: { id: 10, title: '포세이돈', title_en: 'Poseidon', level: 10, element: 'water', rarity: 'gold', stats: [10, 7, 2, 8], power: 30, ability: { type: 'WALL', value: 0, description_ko: '심해의 벽: 일반 공격으로 뒤집히지 않습니다.', description_en: 'Deep Sea Wall: Cannot be flipped by standard attacks.' }, lore_ko: '태초의 바다를 다스리는 신.' },

  // ── [Fire: 불 속성 (11~20)] ──
  11: { id: 11, title: '이그니스', title_en: 'Ignis', level: 1, element: 'fire', rarity: 'bronze', stats: [5, 1, 1, 3], power: 10 },
  12: { id: 12, title: '샐러맨더', title_en: 'Salamander', level: 2, element: 'fire', rarity: 'bronze', stats: [6, 2, 2, 3], power: 13 },
  13: { id: 13, title: '벨페고르', title_en: 'Belphegor', level: 3, element: 'fire', rarity: 'bronze', stats: [6, 3, 1, 6], power: 16 },
  14: { id: 14, title: '파이로', title_en: 'Pyro', level: 4, element: 'fire', rarity: 'bronze', stats: [6, 5, 4, 5], power: 20 },
  15: { id: 15, title: '발록', title_en: 'Balrog', level: 5, element: 'fire', rarity: 'bronze', stats: [3, 7, 5, 6], power: 21 },
  16: { id: 16, title: '무스펠', title_en: 'Muspel', level: 6, element: 'fire', rarity: 'silver', stats: [7, 8, 3, 1], power: 22 },
  17: { id: 17, title: '이바르', title_en: 'Ivar', level: 7, element: 'fire', rarity: 'silver', stats: [8, 8, 4, 4], power: 24 },
  18: { id: 18, title: '불사신 아셀', title_en: 'Ashel the Immortal', level: 8, element: 'fire', rarity: 'silver', stats: [9, 6, 7, 3], power: 25 },
  19: { id: 19, title: '피닉스', title_en: 'Phoenix', level: 9, element: 'fire', rarity: 'gold', stats: [5, 10, 8, 3], power: 26, ability: { type: 'OMNIBOOST', value: 1, description_ko: '집결: 배치 시 보드의 모든 아군 카드에 +1을 부여합니다.', description_en: 'Rally: +1 to all allied cards upon placement.' } },
  20: { id: 20, title: '이그니시우스', title_en: 'Ignisius', level: 10, element: 'fire', rarity: 'gold', stats: [6, 7, 6, 10], power: 29, ability: { type: 'PIERCE', value: 0, description_ko: '태양의 폭발: 적의 쉴드와 벽을 무시합니다.', description_en: 'Solar Flare: Ignores enemy Shield and Wall.' }, lore_ko: '태양의 심장에서 태어난 불사신.' },

  // ── [Air: 바람 속성 (21~30)] ──
  21: { id: 21, title: '제피로스', title_en: 'Zephyros', level: 1, element: 'air', rarity: 'bronze', stats: [1, 3, 3, 5], power: 12 },
  22: { id: 22, title: '실프', title_en: 'Sylph', level: 2, element: 'air', rarity: 'bronze', stats: [5, 3, 3, 4], power: 15 },
  23: { id: 23, title: '실피드', title_en: 'Sylphid', level: 3, element: 'air', rarity: 'bronze', stats: [3, 5, 5, 5], power: 18 },
  24: { id: 24, title: '하피', title_en: 'Harpy', level: 4, element: 'air', rarity: 'bronze', stats: [4, 6, 2, 7], power: 19 },
  25: { id: 25, title: '에올루스', title_en: 'Aeolus', level: 5, element: 'air', rarity: 'bronze', stats: [7, 6, 5, 3], power: 21 },
  26: { id: 26, title: '템페스트', title_en: 'Tempest', level: 6, element: 'air', rarity: 'silver', stats: [4, 8, 7, 3], power: 22 },
  27: { id: 27, title: '사이클론', title_en: 'Cyclone', level: 7, element: 'air', rarity: 'silver', stats: [8, 5, 2, 8], power: 23 },
  28: { id: 28, title: '제우스피어', title_en: 'Zeusphere', level: 8, element: 'air', rarity: 'silver', stats: [3, 7, 9, 6], power: 25 },
  29: { id: 29, title: '뇌신', title_en: 'Raijin', level: 9, element: 'air', rarity: 'gold', stats: [7, 10, 1, 7], power: 25 },
  30: { id: 30, title: '바람신 토람', title_en: 'Wind God Toram', level: 10, element: 'air', rarity: 'gold', stats: [5, 10, 3, 9], power: 27 },

  // ── [Earth: 대지 속성 (31~40)] ──
  31: { id: 31, title: '가이아', title_en: 'Gaia', level: 1, element: 'earth', rarity: 'bronze', stats: [6, 1, 1, 2], power: 10 },
  32: { id: 32, title: '그놈', title_en: 'Gnome', level: 2, element: 'earth', rarity: 'bronze', stats: [6, 1, 4, 3], power: 14 },
  33: { id: 33, title: '테라', title_en: 'Terra', level: 3, element: 'earth', rarity: 'bronze', stats: [7, 5, 1, 3], power: 16 },
  34: { id: 34, title: '고르곤', title_en: 'Gorgon', level: 4, element: 'earth', rarity: 'bronze', stats: [2, 7, 6, 3], power: 18 },
  35: { id: 35, title: '오벨리스크', title_en: 'Obelisk', level: 5, element: 'earth', rarity: 'bronze', stats: [3, 10, 2, 1], power: 16 },
  36: { id: 36, title: '그랜드로크', title_en: 'Grandrock', level: 6, element: 'earth', rarity: 'silver', stats: [7, 2, 8, 5], power: 22 },
  37: { id: 37, title: '록타', title_en: 'Rokta', level: 7, element: 'earth', rarity: 'silver', stats: [5, 6, 6, 8], power: 25 },
  38: { id: 38, title: '오리하르콘', title_en: 'Orihalcon', level: 8, element: 'earth', rarity: 'silver', stats: [9, 3, 9, 2], power: 23 },
  39: { id: 39, title: '아틀라스', title_en: 'Atlas', level: 9, element: 'earth', rarity: 'gold', stats: [8, 10, 3, 5], power: 26 },
  40: { id: 40, title: '콜로서스', title_en: 'Colossus', level: 10, element: 'earth', rarity: 'gold', stats: [10, 8, 6, 4], power: 28, ability: { type: 'IMMUNITY', value: 0, description_ko: '저지 불가: 콤보 및 반격에 면역입니다.', description_en: 'Unstoppable: Immune to combos and counters.' } },

  // ── [Human: 인간 속성 (41~50)] ──
  41: { id: 41, title: '카단', title_en: 'Kadan', level: 1, element: 'human', rarity: 'bronze', stats: [2, 3, 1, 5], power: 11 },
  42: { id: 42, title: '엘윈', title_en: 'Elwin', level: 1, element: 'human', rarity: 'bronze', stats: [2, 1, 2, 6], power: 11 },
  43: { id: 43, title: '발리안', title_en: 'Balian', level: 2, element: 'human', rarity: 'bronze', stats: [3, 4, 5, 3], power: 15 },
  44: { id: 44, title: '카제', title_en: 'Kaze', level: 3, element: 'human', rarity: 'bronze', stats: [7, 1, 5, 3], power: 16 },
  45: { id: 45, title: '가웨인', title_en: 'Gawain', level: 4, element: 'human', rarity: 'bronze', stats: [1, 6, 4, 7], power: 18 },
  46: { id: 46, title: '론돌', title_en: 'Rondol', level: 5, element: 'human', rarity: 'silver', stats: [6, 2, 6, 7], power: 21 },
  47: { id: 47, title: '길가메시', title_en: 'Gilgamesh', level: 6, element: 'human', rarity: 'silver', stats: [1, 8, 8, 3], power: 20 },
  48: { id: 48, title: '로비냐드', title_en: 'Robinyard', level: 7, element: 'human', rarity: 'silver', stats: [8, 8, 7, 3], power: 26 },
  49: { id: 49, title: '헤르쿨', title_en: 'Hercul', level: 8, element: 'human', rarity: 'gold', stats: [9, 4, 8, 4], power: 25 },
  50: { id: 50, title: '알렉산다르', title_en: 'Aleksandar', level: 10, element: 'human', rarity: 'gold', stats: [9, 6, 10, 2], power: 27, ability: { type: 'TIME_WARP', value: 0, description_ko: '시간 왜곡: 상대방은 다음 턴을 건너뜁니다.', description_en: 'Time Warp: Opponent skips their next turn.' } },

  // ── [Undead: 언데드 속성 (51~60)] ──
  51: { id: 51, title: '워커', title_en: 'Walker', level: 1, element: 'undead', rarity: 'bronze', stats: [2, 1, 4, 4], power: 11 },
  52: { id: 52, title: '구울', title_en: 'Ghoul', level: 2, element: 'undead', rarity: 'bronze', stats: [5, 3, 2, 5], power: 15 },
  53: { id: 53, title: '캐리언', title_en: 'Carrion', level: 2, element: 'undead', rarity: 'bronze', stats: [5, 2, 5, 3], power: 15 },
  54: { id: 54, title: '아라크네', title_en: 'Arachne', level: 3, element: 'undead', rarity: 'bronze', stats: [5, 6, 3, 3], power: 17 },
  55: { id: 55, title: '패치워크', title_en: 'Patchwork', level: 4, element: 'undead', rarity: 'bronze', stats: [7, 3, 1, 6], power: 17 },
  56: { id: 56, title: '카르디스', title_en: 'Cardis', level: 5, element: 'undead', rarity: 'silver', stats: [5, 5, 7, 4], power: 21 },
  57: { id: 57, title: '스톤가고일', title_en: 'Stone Gargoyle', level: 6, element: 'undead', rarity: 'silver', stats: [8, 2, 8, 2], power: 20 },
  58: { id: 58, title: '사이드라고사', title_en: 'Sidragosa', level: 7, element: 'undead', rarity: 'silver', stats: [8, 3, 5, 8], power: 24 },
  59: { id: 59, title: '켈투스', title_en: 'Keltus', level: 8, element: 'undead', rarity: 'gold', stats: [2, 9, 9, 4], power: 24 },
  60: { id: 60, title: '데스나이트 아르투스', title_en: 'Death Knight Artus', level: 10, element: 'undead', rarity: 'gold', stats: [2, 6, 9, 10], power: 27 },

  // ── [Elf: 엘프 속성 (61~70)] ──
  61: { id: 61, title: '루시안', title_en: 'Lucian', level: 1, element: 'elf', rarity: 'bronze', stats: [2, 1, 6, 1], power: 10 },
  62: { id: 62, title: '실리아', title_en: 'Celia', level: 2, element: 'elf', rarity: 'bronze', stats: [4, 4, 5, 2], power: 15 },
  63: { id: 63, title: '엘리아나', title_en: 'Eliana', level: 3, element: 'elf', rarity: 'bronze', stats: [6, 2, 6, 3], power: 17 },
  64: { id: 64, title: '티타니아', title_en: 'Titania', level: 3, element: 'elf', rarity: 'bronze', stats: [7, 2, 3, 5], power: 17 },
  65: { id: 65, title: '실바니아', title_en: 'Sylvania', level: 4, element: 'elf', rarity: 'bronze', stats: [6, 2, 7, 3], power: 18 },
  66: { id: 66, title: '말퓨온', title_en: 'Malfuon', level: 5, element: 'elf', rarity: 'silver', stats: [5, 3, 7, 6], power: 21 },
  67: { id: 67, title: '베작스', title_en: 'Vezax', level: 6, element: 'elf', rarity: 'silver', stats: [1, 8, 4, 8], power: 21 },
  68: { id: 68, title: '캘토르', title_en: 'Kaeltor', level: 7, element: 'elf', rarity: 'silver', stats: [6, 8, 4, 7], power: 25 },
  69: { id: 69, title: '간다르', title_en: 'Gandar', level: 8, element: 'elf', rarity: 'gold', stats: [8, 9, 6, 2], power: 25 },
  70: { id: 70, title: '에일라', title_en: 'Aila', level: 10, element: 'elf', rarity: 'gold', stats: [8, 5, 10, 6], power: 29 },

  // ── [Dwarf: 드워프 속성 (71~80)] ──
  71: { id: 71, title: '발보', title_en: 'Balbo', level: 1, element: 'dwarf', rarity: 'bronze', stats: [4, 2, 4, 3], power: 13 },
  72: { id: 72, title: '프레도', title_en: 'Fredo', level: 2, element: 'dwarf', rarity: 'bronze', stats: [3, 2, 1, 7], power: 13 },
  73: { id: 73, title: '샘와이', title_en: 'Samwy', level: 3, element: 'dwarf', rarity: 'bronze', stats: [3, 6, 4, 4], power: 17 },
  74: { id: 74, title: '그림리', title_en: 'Grimli', level: 4, element: 'dwarf', rarity: 'bronze', stats: [4, 5, 5, 6], power: 20 },
  75: { id: 75, title: '마그니스', title_en: 'Magnis', level: 4, element: 'dwarf', rarity: 'bronze', stats: [7, 5, 4, 3], power: 19 },
  76: { id: 76, title: '브란디', title_en: 'Brandy', level: 5, element: 'dwarf', rarity: 'silver', stats: [4, 8, 7, 4], power: 23 },
  77: { id: 77, title: '무라디', title_en: 'Muradi', level: 6, element: 'dwarf', rarity: 'silver', stats: [6, 5, 8, 4], power: 23 },
  78: { id: 78, title: '토그림', title_en: 'Thorgrim', level: 7, element: 'dwarf', rarity: 'silver', stats: [1, 8, 7, 7], power: 23 },
  79: { id: 79, title: '베리포지', title_en: 'Berryforge', level: 8, element: 'dwarf', rarity: 'gold', stats: [5, 1, 9, 9], power: 24 },
  80: { id: 80, title: '아이언포지', title_en: 'Ironforge', level: 10, element: 'dwarf', rarity: 'gold', stats: [4, 10, 2, 10], power: 26 },

  // ── [Monster: 야수/몬스터 속성 (81~90)] ──
  81: { id: 81, title: '펜릴', title_en: 'Fenrir', level: 1, element: 'monster', rarity: 'bronze', stats: [3, 5, 2, 1], power: 11 },
  82: { id: 82, title: '미노타우로스', title_en: 'Minotaur', level: 2, element: 'monster', rarity: 'bronze', stats: [5, 2, 5, 2], power: 14 },
  83: { id: 83, title: '요르문간드', title_en: 'Jormungandr', level: 3, element: 'monster', rarity: 'bronze', stats: [4, 4, 7, 2], power: 17 },
  84: { id: 84, title: '그리폰', title_en: 'Griffon', level: 4, element: 'monster', rarity: 'bronze', stats: [3, 7, 3, 6], power: 19 },
  85: { id: 85, title: '바이라', title_en: 'Byra', level: 5, element: 'monster', rarity: 'bronze', stats: [7, 2, 7, 4], power: 20 },
  86: { id: 86, title: '레오나르', title_en: 'Leonar', level: 6, element: 'monster', rarity: 'silver', stats: [4, 8, 5, 6], power: 23 },
  87: { id: 87, title: '바르가스트', title_en: 'Barghest', level: 6, element: 'monster', rarity: 'silver', stats: [7, 5, 8, 1], power: 21 },
  88: { id: 88, title: '우르삭', title_en: 'Ursoc', level: 7, element: 'monster', rarity: 'silver', stats: [5, 7, 8, 5], power: 25 },
  89: { id: 89, title: '메두사 고르고', title_en: 'Medusa Gorgo', level: 8, element: 'monster', rarity: 'gold', stats: [9, 6, 2, 8], power: 25 },
  90: { id: 90, title: '페가수스', title_en: 'Pegasus', level: 9, element: 'monster', rarity: 'gold', stats: [7, 2, 7, 10], power: 26 },

  // ── [Robot: 기계/로봇 속성 (91~100)] ──
  91: { id: 91, title: '스파이더봇', title_en: 'Spiderbot', level: 1, element: 'robot', rarity: 'bronze', stats: [1, 5, 4, 1], power: 11 },
  92: { id: 92, title: '크로노스', title_en: 'Chronos', level: 2, element: 'robot', rarity: 'bronze', stats: [5, 1, 3, 5], power: 14 },
  93: { id: 93, title: '센티넬', title_en: 'Sentinel', level: 3, element: 'robot', rarity: 'bronze', stats: [5, 6, 2, 4], power: 17 },
  94: { id: 94, title: '디바스터', title_en: 'Devastator', level: 4, element: 'robot', rarity: 'bronze', stats: [7, 4, 4, 4], power: 19 },
  95: { id: 95, title: '골리앗', title_en: 'Goliath', level: 5, element: 'robot', rarity: 'bronze', stats: [7, 7, 4, 2], power: 20 },
  96: { id: 96, title: '시즈엔진', title_en: 'Siege Engine', level: 5, element: 'robot', rarity: 'silver', stats: [6, 6, 2, 7], power: 21 },
  97: { id: 97, title: '하이페리온 프라임', title_en: 'Hyperion Prime', level: 6, element: 'robot', rarity: 'silver', stats: [6, 8, 4, 5], power: 23 },
  98: { id: 98, title: '아이언클래드', title_en: 'Ironclad', level: 7, element: 'robot', rarity: 'silver', stats: [8, 8, 5, 4], power: 25 },
  99: { id: 99, title: '마기테크 골렘', title_en: 'Magitech Golem', level: 8, element: 'robot', rarity: 'gold', stats: [6, 7, 4, 9], power: 26 },
  100: { id: 100, title: '오메가 웨폰', title_en: 'Omega Weapon', level: 9, element: 'robot', rarity: 'gold', stats: [9, 10, 4, 2], power: 25 },

  // ── [Dragon: 드래곤 속성 (101~110)] -> /cards2.png 매핑 ──
  101: { id: 101, title: '드레이크', title_en: 'Drake', level: 7, element: 'dragon', rarity: 'silver', stats: [7, 7, 2, 8], power: 24 },
  102: { id: 102, title: '와이버니', title_en: 'Wyverny', level: 8, element: 'dragon', rarity: 'silver', stats: [9, 5, 2, 9], power: 25 },
  103: { id: 103, title: '네더드래곤', title_en: 'Netherdragon', level: 9, element: 'dragon', rarity: 'gold', stats: [10, 1, 7, 7], power: 25 },
  104: { id: 104, title: '바하무트', title_en: 'Bahamut', level: 9, element: 'dragon', rarity: 'gold', stats: [7, 4, 6, 10], power: 27 },
  105: { id: 105, title: '스파이크드래곤', title_en: 'Spikedragon', level: 9, element: 'dragon', rarity: 'gold', stats: [10, 8, 2, 6], power: 26 },
  106: { id: 106, title: '어스드래곤 테라', title_en: 'Earth Dragon Terra', level: 9, element: 'dragon', rarity: 'gold', stats: [3, 1, 10, 10], power: 24 },
  107: { id: 107, title: '이셀라', title_en: 'Ysela', level: 9, element: 'dragon', rarity: 'gold', stats: [4, 4, 9, 10], power: 27 },
  108: { id: 108, title: '알렉스트라', title_en: 'Alexstra', level: 10, element: 'dragon', rarity: 'gold', stats: [10, 10, 3, 3], power: 26 },
  109: { id: 109, title: '말리곤', title_en: 'Malygon', level: 10, element: 'dragon', rarity: 'gold', stats: [6, 9, 10, 4], power: 29 },
  110: { id: 110, title: '드레드윙', title_en: 'Dreadwing', level: 10, element: 'dragon', rarity: 'gold', stats: [10, 4, 6, 9], power: 29 }
};
```

---

# 5. 핵심 3x3 배틀 엔진 메커니즘 (Triple Triad Engine)

### 5.1 보드 및 턴 진행 룰
1. **보드 구성**: 3x3 (총 9칸, 인덱스 0~8).
2. **덱 구성**: 플레이어 5장 (파랑/P1), 상대(AI 또는 PVP) 5장 (빨강/P2).
3. **선공 결정**: 동전 던지기 또는 50% 확률로 결정.
4. **승리 판정**: 9칸이 모두 채워지면, 보드 위의 카드 점유 수 + 손에 남은 1장 = 총 10장 중 더 많은 카드를 소유한 쪽이 승리 (6장 이상 승리, 5:5 무승부).

```
보드 인덱스 레이아웃:
[ 0 ] [ 1 ] [ 2 ]
[ 3 ] [ 4 ] [ 5 ]
[ 6 ] [ 7 ] [ 8 ]
```

### 5.2 인접 변 비교 및 플립(Flip) 알고리즘
- 카드를 특정 셀 `index`에 배치할 때 상/하/좌/우의 인접 셀을 검사합니다.
- 인접 방향 쌍:
  - **상(Top, cell - 3)**: 배치 카드의 `Top(stats[0])` vs 인접 카드의 `Bottom(stats[2])`
  - **우(Right, cell + 1)**: 배치 카드의 `Right(stats[1])` vs 인접 카드의 `Left(stats[3])`
  - **하(Bottom, cell + 3)**: 배치 카드의 `Bottom(stats[2])` vs 인접 카드의 `Top(stats[0])`
  - **좌(Left, cell - 1)**: 배치 카드의 `Left(stats[3])` vs 인접 카드의 `Right(stats[1])`
- 배치 카드의 스탯 수치가 상대 카드의 맞닿은 스탯 수치보다 **엄격히 클 때 (`myStat > oppStat`)**, 상대 카드는 내 소유로 뒤집힙니다 (`owner = 'player'`).

### 5.3 연쇄 콤보(Combo Chain) 처리
- 뒤집힌 카드가 다시 자신의 상/하/좌/우 인접한 상대 카드를 동일한 스탯 비교 룰로 연속하여 뒤집습니다.
- 무한 루프를 방지하기 위해 `visited` 셋을 활용하여 한 턴에 한 번만 전파합니다.

### 5.4 특수 어빌리티 처리 로직
- `SHIELD`: 플립당할 확률을 방어하거나 반감.
- `WALL`: 일반 스탯 공격으로 뒤집히지 않음 (`PIERCE` 공격에만 뒤집힘).
- `COUNTER`: 적이 이 카드를 뒤집으려다 실패할 경우, 공격을 시도한 적 카드가 역으로 뒤집힘.
- `OMNIBOOST`: 보드 배치 시 아군의 모든 기존 카드 스탯에 +1 보너스.
- `PIERCE`: 적의 `SHIELD` 및 `WALL` 무시.
- `IMMUNITY`: 콤보 및 반격에 완전 면역.
- `TIME_WARP`: 상대방의 다음 턴을 스킵하고 즉시 재행동.

### 5.5 자동 전투 (Auto-Battle) & 갬빗(Gambit) AI
- **1x / 2x / 3x 배속** 토글 지원.
- **전술 스탠스(Stance)**:
  - `Aggressive` (공격형): 최대 플립 수를 발생시키는 위치 우선 배치.
  - `Defensive` (방어형): 상대에게 취약한 약점이 노출되지 않는 코너/외곽 우선 배치.
  - `Balanced` (균형형): 플립 가능성과 방어력을 가중치 합산하여 최적 수 선택.

---

# 6. 전체 화면 (Views) 및 기능 명세

### 6.1 `HomeView` (메인 로비 & 허브)
- **상단 헤더**: 유저 닉네임, 프로필 아바타(스프라이트), 보유 SNS 포인트 잔액, BGM/SFX 사운드 토글 버튼.
- **메인 로비 배너 캐러셀**: 최신 이벤트, 시즌 패스, 신규 카드 픽업 배너 자동 슬라이드.
- **30초 자동 시작 타이머**: 로비 대기 30초 경과 시 자동으로 랭킹 배틀 매칭 진입 (사용자 마우스/터치 인터랙션 시 리셋).
- **빠른 액션 버튼**:
  - `[BATTLE START]`: 즉시 3x3 배틀 진입
  - `[MY DECK]`: 덱 관리 및 다마고치 육성
  - `[GACHA SHOP]`: 상점 및 카드 뽑기
  - `[KADAN RPG]`: 카단 월드맵 모험
  - `[MINI GAMES]`: 8종 미니게임 모음
- **방치형 순찰 (AFK Patrol)**: 분당 1 SNS 포인트 자동 축적 (최대 8시간, 최대 480 SNS 포인트 수령).
- **일일 미션 (Daily Missions)**: 배틀 3회 플레이, 카드 1회 뽑기, 미니게임 1회 클리어 등 일일 퀘스트 및 보상 수령.

### 6.2 `MyDeckView` (덱 편성 & 카드 다마고치 돌봄)
- **5장 메인 덱 편성**: 드래그 앤 드롭 또는 클릭으로 간편하게 출전 덱 5장 교체/정렬.
- **인벤토리**: 보유 카드 목록 그리드 렌더링, 속성별/희귀도별/전투력순 필터 및 검색.
- **장비 시스템**: 4개 장비 슬롯 (`necklace`, `ring1`, `ring2`, `boots`) 장착으로 카드 상/우/하/좌 스탯 증폭.
- **다마고치 돌봄 육성 (Hero Care)**:
  - 포만감 (`hunger`), 행복도 (`happiness`), 훈련 (`training`), 휴식 (`rest`) 상태 관리.
  - 밥주기, 놀아주기, 훈련하기 상호작용으로 친밀도 증가 및 추가 스탯 부여.
- **카드 분해 & 합성**:
  - 중복 Bronze/Silver 카드 일괄 분해하여 SNS 포인트 획득.
  - 동일 등급 카드 3장을 합성하여 상위 등급 카드 1장 획득.

### 6.3 `PlayGameView` (메인 게임 모드 허브)
- **모드 선택**:
  1. `랭킹 대전 (PVP / Ranking)`: 3x3 표준 경기, 승리 시 +30 SNS 포인트 및 랭킹 점수 획득.
  2. `모험 / 스토리 (Story Mode)`: 10개 챕터 스테이지 진행, 보스 클리어 시 신규 카드 해금.
  3. `보스 레이드 (Boss Raid)`: 거대 보스(포세이돈, 이그니시우스, 바하무트) 협동 토벌.
  4. `시련의 탑 (Tower of Trials 50F)`: 1층부터 50층까지 연속 등반하는 극한 도전 모드.
  5. `8시간 원정대 (Expedition)`: 보유 카드를 탐색 파티로 파견하여 오프라인 보상 획득.
  6. `비스티아리움 (Beastarium)`: 몬스터 도감 및 동행 펫 설정.
  7. `비밀 업적 스탬프북 (Secret Stamps)`: 8종의 히든 퀘스트 달성 시 전설 보상 지급.

### 6.4 `ShopView` (가챠 상점 & 경제 시스템)
- **카드 뽑기**:
  - `단일 뽑기 (1 Pull)`: 100 SNS 포인트.
  - `10연속 뽑기 (10 Pulls)`: 900 SNS 포인트 (10% 할인).
  - **가챠 연출 애니메이션**: 카드 팩 개봉 시 레어 등급별 빛 이펙트 (골드/다이아몬드 플래시).
- **천장 시스템 (Pity Gauge)**: 30연차 내에 무조건 Gold 등급 이상 카드 100% 확정 지급.
- **장비팩 뽑기**: 150 SNS 포인트로 랜덤 마법/희귀 장비 아이템 획득.
- **SNS 포인트 상점**: SNS 포인트 무료 충전 (광고 시청 모의, 출석 체크 보상).

### 6.5 `KadanRpgView` (카단 & 아케인 에코즈 2D 타일 RPG)
- **월드맵 탐험**: 2D 그리드 타일 맵을 이동하며 챕터 진행.
- **인카운터**:
  - `NPC 대화`: 퀘스트 수주 및 스토리 대화창.
  - `보물 상자`: 필드 파밍을 통한 대량 SNS 포인트 및 장비 획득.
  - `적 인카운터`: 필드 몬스터와 즉각 3x3 카드 배틀 돌입.
- **자동 모드 (Auto Runner)**: 타겟 퀘스트 위치까지 자동 이동 및 연속 전투.
- **환생 (Reincarnation)**: 엔딩 도달 시 누적 스탯 보너스를 유지한 채 2회차 시작.

### 6.6 미니게임 8종 컬렉션 (`MiniGames`)
1. **카드러시 (Card Rush)**: 빠르게 나타나는 카드의 속성을 맞추는 순발력 게임.
2. **카드하이스트 (Card Heist)**: 적의 감시를 피해 금고 카드를 털어내는 잠입 미니게임.
3. **카드탭 (Card Tap)**: 제한 시간 동안 화면의 카드를 연속 터치하여 콤보 점수 획득.
4. **카드슬롯 (Card Slot)**: 슬롯머신 3릴을 돌려 카드 일치 시 SNS 잭팟 보상.
5. **카드소서리 (Card Sorcery)**: 마법진에 올바른 원소 카드를 순서대로 조합하는 퍼즐.
6. **카드플립 (Card Flip)**: 기억력 기반 짝맞추기 카드 뒤집기 게임.
7. **카드슬라이드 (Card Slide Puzzle)**: 3x3 타일 슬라이딩 원본 카드 그림 복원 퍼즐.
8. **카드점퍼 (Card Jumper)**: 타이밍에 맞춰 장애물을 뛰어넘는 원버튼 점프 액션.

### 6.7 `SettingView` 및 백업/복원 시스템 (`BackupRestoreModal`)
- **애니메이션 QR 분할 백업**:
  - 로컬스토리지 데이터를 LZ-String 압축 후 280~750자 청크 단위로 분할.
  - 0.3s~1.0s 주기로 자동 전환되는 애니메이션 QR 코드로 송출 (대용량 계정 완벽 지원).
- **연속 카메라 스캔 조합 복원**:
  - 모바일 카메라로 애니메이션 QR 코드를 연속 캡처하여 분할 청크를 100% 결합 및 자동 복원.
  - JSON 내보내기/가져오기 및 클립보드 원클릭 백업/복원 지원.
- **다국어(i18n) 설정**: 한국어(KO), 영어(EN/GB), 일본어(JA), 중국어(ZH) 등 원클릭 언어 변경.
- **음향 볼륨 조절**: BGM 및 SFX 볼륨 슬라이더.

---

# 7. 로컬스토리지(LocalStorage) 데이터 스키마 명세

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

# 8. Web Audio API 기반 오디오 신디사이저 (Pure Sound Engine)

외부 mp3 파일이 없어도 브라우저 자체 Web Audio API로 칩튠 효과음과 BGM을 합성하여 완벽한 사운드를 재생합니다.

```typescript
class GameAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) this.ctx = new AudioCtxClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  // 1. 버튼 클릭 효과음 (간결한 칩튠 비프)
  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
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

  // 2. 카드 배치 효과음 (묵직한 타격음)
  public playCardPlace() {
    if (this.isMuted) return;
    this.initCtx();
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

  // 3. 카드 플립(뒤집기) 연쇄 사운드
  public playCardFlip(comboIndex: number = 0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const baseFreq = 523.25 * Math.pow(1.15, comboIndex); // 콤보마다 음계 상승
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  // 4. 가챠 팩 오픈 (황금빛 아르페지오)
  public playGachaFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.06);
      gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + i * 0.06 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(this.ctx!.currentTime + i * 0.06);
      osc.stop(this.ctx!.currentTime + i * 0.06 + 0.3);
    });
  }
}

export const soundEngine = new GameAudioEngine();
```

---

# 9. AI Studio 실행용 복사-붙여넣기 마스터 프롬프트

AI Studio 또는 대규모 언어 모델(LLM) 환경에서 SNSHero 게임 전체를 단번에 생성하려면, 아래의 프롬프트 블록을 그대로 복사하여 AI Studio의 **User Prompt** 또는 **System Instruction**에 입력하십시오:

```markdown
당신은 최고의 웹 프론트엔드 게임 개발자입니다.
첨부된 [SNSHero Revolution 지침서]의 모든 내용을 완벽히 반영하여 단 하나의 완전하고 오류 없는 React 19 + TypeScript + Tailwind CSS 게임 애플리케이션 코드를 작성해주세요.

[필수 구현 체크리스트]:
1. /cards1.png (1~100) 및 /cards2.png (101~110+) 10x10 스프라이트 시트 CSS 그리드 연산 (getCardSpriteStyle) 적용
2. 110종 전체 CARD_DATABASE 및 11종 속성, 6개 등급, 7종 특수 어빌리티(SHIELD, WALL, COUNTER 등) 완벽 내장
3. 3x3 보드 Triple Triad 배틀 엔진: 상하좌우 스탯 비교 플립, 연쇄 콤보, 1x/2x/3x 배속 자동전투
4. 모든 뷰 구현: HomeView(로비/30초 타이머/AFK순찰), MyDeckView(덱편성/다마고치육성/합성/분해), PlayGameView(랭킹/모험/보스/시련의탑/원정대), ShopView(가챠/10연차/천장시스템), KadanRpgView(2D타일 RPG), 미니게임 8종, BackupRestoreModal(애니메이션 QR 백업/카메라 복원)
5. LocalStorage 100% 기반 영구 데이터 저장 및 신규 접속 시 5장 기본 덱 + 1,000 SNS 자동 지급
6. DESIGN.md 준수: Berkeley Mono 폰트, Warm Cream (#fdfcfc), Deep Ink (#201d1d), 1px Hairline, 4px 인터랙티브 버튼 반경, [BATTLE]/[+] ASCII 마커
7. Web Audio API 신디사이저 사운드 엔진 내장 (클릭, 카드배치, 콤보플립, 가챠 팡파레)

코드는 바로 실행 가능하도록 생략이나 축약 없이 완벽하게 작성해 주세요.
```

---

# 10. 결론 및 배포 가이드

- **공개 배포**: 빌드 시 생성된 `dist/` 정적 파일을 GitHub Pages, Vercel, Netlify, Cloudflare Pages 어디든 단일 정적 호스팅으로 배포할 수 있습니다.
- **이미지 배치**: 프로젝트의 `public/cards1.png` 및 `public/cards2.png` 경로에 10x10 카드 시트를 배치하면 모든 카드가 100% 선명한 픽셀 아트로 즉각 렌더링됩니다.
- 본 `snshero.md` 지침서 하나만으로 언제 어디서든 AI를 통해 완전한 SNSHero Revolution 게임을 재현 및 확장할 수 있습니다.
