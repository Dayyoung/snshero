# SNSHero Revolution - Project Memory

## 1. 개요
- **이름**: SNSHero Revolution
- **장르**: 원클릭 웹 카드 배틀 게임 (Triple Triad / OTHELLO 느낌의 3x3 보드 카드 배틀)
- **스택**: React 19 + Vite 6 + TypeScript 5.8 + Tailwind CSS 4.1 + Firebase
- **빌드/실행**: `npm run build`, `npm run lint`, `tsx server.ts` 등 사용

## 2. 디렉토리 구조 (중요)
```
src/
 ├─ App.tsx            # 전역 상태가 많이 몰려 있으므로 가능하면 건드리지 말고 분리
 ├─ types.ts           # 공통 타입 정의
 ├─ constants.ts       # 카드/스킬/파워룰/덱/아이네임 생성 등 핵심 게임 로직
 ├─ constants/
 │   └─ itemDatabase.ts
 ├─ cardDatabase.ts    # 카드 DB
 ├─ lib/
 │   ├─ firebase.ts    # Firebase 초기화, localStorage 기반 DB 모드 분기
 │   ├─ i18n.ts        # 다국어 t() 헬퍼 (ko, en, gb, ja, zh-CN, zh-TW, de, es, fr, id, ru, th, vi)
 │   ├─ gameEngine.ts  # 배틀 규칙: checkFlips, findBestMove
 │   ├─ guildHelper.ts
 │   ├─ communityHelper.ts
 │   ├─ deckUpgrade.ts
 │   └─ utils.ts       # cn, sanitizeForFirestore, getUserCollectionName 등
 └─ views/             # 페이지 단위 뷰
     ├─ PlayGameView.tsx  # 메인 배틀 (가장 큼, 수정 시 주의)
     ├─ HomeView.tsx
     ├─ MyDeckView.tsx
     ├─ ShopView.tsx
     ├─ RankingView.tsx
     ├─ CommunityView.tsx
     ├─ GodView.tsx
     └─ ... (약 20+ 개)
```

## 3. 핵심 데이터 모델 (src/types.ts 기준)
- `CardData`: 카드 1장의 정보 (id, title, stats[4], rarity, element, level, skills, equipment, ability 등)
- `Skill`: id, name, description, effect(type/value), level, maxLevel
- `Item`: 장비 아이템 (necklace, ring1, ring2, boots), rarity, stats[4], slot
- `GameState`: 현재 화면/게임 상태
- `InventoryRecord`: 인벤토리内的 카드/아이템 정보
- `Guild`, `CommunityPost`, `CommunityComment` 등

## 4. 배틀 규칙 요약 (src/lib/gameEngine.ts)
- 보드: 3x3 (9칸)
- 각 카드는 상/우/하/좌 (0~3) 4개의 스탯을 가짐
- 배치 시 인접한 상대 카드와 스탯 비교 후 flipping 발생
- 콤보 규칙:
  - SAME: 양쪽 스탯이 같고, 2개 이상 인접하면 해당 인접 카드 전부 플립
  - PLUS: 양쪽 스탯 합이 같은 조합이 2개 이상일 때 해당 카드 플립
- 어빌리티:
  - WALL / SHIELD / PIERCE / COUNTER / IMMUNITY / OMNIBOOST / POWER_BOOST / WEAKEN / REINFORCE / TIME_WARP
- 속성(Element) 보너스: 카드 element와 보드 타일 element가 같으면 +1, 다르면 -1 (최소 1)
- 장비(Equipment) 보너스: 카드에 장착된 아이템 stats가 그대로 추가됨

## 5. 카드/파워 규칙 (src/constants.ts)
- `getCardPower(card)`: stats[4] 합 + 스킬/장비/길드/속성 보정 반영
- `syncCardWithDatabase`: CARD_DATABASE 기준으로 카드 정보 재동기화
- `getCardStatWithBonus`: 길드 레벨(1~10) 보너스 + 속성 타일 보너스 + 장비 + 스킬 반영
- `getSkillPointBonus`, `getPowerMultiplier`: 스킬 레벨에 따른 전투 보정

## 6. 컨트롤/UI 규칙 (AGENTS.md 반영)
- **TypeScript strict 모드**, `any` 타입 지양
- **Tailwind CSS**만 사용하고 index.css 직접 수정 금지 (src/index.css는 허용)
- 함수형 컴포넌트 + Hooks만 사용
- 아이콘은 `lucide-react` 사용
- 상태가 과중해지면 Context API 또는 커스텀 훅으로 분리
- `localStorage` 키는 반드시 `hero_xxx` 또는 `hero_xxx_{season}` 형식 사용
- `getSeasonItem()` / `setSeasonItem()` 헬퍼를 시즌 데이터에 사용
- 오프라인 모드(`offlineMode`)와 게스트 모드(`uid === 'guest-id'`)를 항상 고려
- **저사양 모드(`lowSpecMode`)**: 복잡한 애니메이션은 `lowSpecMode`가 true일 때 비활성화 필요

## 7. 다국어(i18n) 규칙
- 사용자 노출 텍스트는 `t()` 함수를 통해 한국어/영어를 우선 제공
- AGENTS.md에 명시된 12개 언어 지원이 기본 정책
- 신규 텍스트 추가 시 `src/lib/translations/*.ts` 전파 필요

## 8. Firebase/백엔드
- Firestore/Auth는 `src/lib/firebase.ts`를 통해서만 접근
- `syncUserData()` 관련 로직 수정 시 `isSyncingRef` 잠금 + 10초 타임아웃 유지
- 클라이언트에서 민감한 연산(결제, 권한 검증 등) 금지
- Auth/Firestore 모드는 localStorage의 `firebase_db_mode`로 전환 가능 (local/production)

## 9. 금지 사항
- `alert()`, `confirm()`, `prompt()` 사용 금지 → `showCustomAlert`, `showCustomConfirm` 사용
- 외부 CDN 직접 로드 금지
- `console.log` 남발 금지 (testMode 내에서는 허용)

## 10. 자주 쓰이는 뷰/컴포넌트
- `PlayGameView.tsx`: 메인 게임 연출, 배틀 모드, 미니게임 연동
- `MyDeckView.tsx`: 덱 편집, 카드 정렬/필터
- `ShopView.tsx`: 아이템/광고/결제
- `CommunityView.tsx`: 게시글, 댓글
- `GodView.tsx`: 관리자급 뷰
- 미니게임 컴포넌트: Snake, Shooting, Trex, Pacman, Breakout, Minesweeper, Tic-tac-toe, Defense

## 11. 터미널 사용시 참고
- `npm run lint` = TypeScript 검사 (`tsc --noEmit`)
- `npm run build` = Vite 빌드
- `npm run dev` = Firebase emulator + Vite 동시 실행
- `npm run dev:app` = Vite dev server만 실행
- lint/build 통과 후에만 수정 완료로 간주

## 12. 화면/디자인 규칙 (DESIGN_GUIDE.md 반영)
- **타이포그래피**
  - 기본 폰트: `font-sans`. 디버그/로그 화면 외에는 `font-mono` 사용 금지
  - 제목: `text-lg` ~ `text-xl`, `font-bold` 또는 `font-extrabold`
  - 본문: `text-slate-600` 또는 `text-slate-700`, `font-medium`
- **레이아웃**
  - 헤더: `h-16 flex items-center justify-between border-b border-slate-100 px-4 md:px-6 bg-white`
  - 바디: `p-4 md:p-6 space-y-6 overflow-y-auto`
  - 푸터: `p-4 bg-white border-t border-slate-100 flex justify-end gap-3`
- **버튼 스타일**
  - Primary: `bg-indigo-600`, Secondary: `bg-slate-50 border border-slate-200/85`
  - Danger: `bg-rose-600`, Accent: `bg-gradient-to-r from-amber-500 to-orange-500`
  - 공통: `rounded-xl`, `active:scale-95`, `transition-all duration-200` 필수
- **모달/다이얼로그**
  - 오버레이: `absolute inset-0 bg-slate-900/60 backdrop-blur-xs`
  - 모달: `bg-white text-slate-800 w-full rounded-3xl overflow-hidden shadow-2xl`
- **색상 톤**
  - 기본 배경: `bg-slate-50/30` 또는 `bg-transparent`
  - 텍스트: 주로 `text-slate-800` 계열, 강조는 indigo/amber/orange 계열
- **애니메이션**
  - motion 라이브러리 활용
  - `lowSpecMode` 일 때는 복잡한 애니메이션 비활성화 필요

## 13. 개발 규칙 (요약)
- 상태가 무거워지면 **Context API / 커스텀 훅**으로 분리. `App.tsx` 직접 상태 추가는 가능한 한 지양
- `localStorage` 키는 `hero_xxx`, `hero_xxx_{season}` 형태로 명명
- 시즌 데이터는 `getSeasonItem()` / `setSeasonItem()` 을 통해 접근
- 게스트 모드, 오프라인 모드 항상 고려
- Firebase 보안 규칙/Cloud Functions로 민감 로직 검증
- 다국어: 신규/수정 텍스트는 12개 언어팩 전파 필요

## 14. 게임 스토리 요약
- 게임 내 `Story Battle` / `Act` / `Climax` 구조가 존재
- 번역 키 기준으로 4막(story_act1~4)으로 구성된 것으로 보임
- 주요 스토리 라인:
  - Act 1: 절대자 **검은 용(Black Dragon)**이 부활하고 분파들이 동맹을 맺어 권력 투쟁. 결국 용은 봉인되지만 마법 균형이 붕괴됨.
  - Act 2: 마법사가 검은 용의 마법을 이용해 AI 로봇을 타락시켜 반란. 인간 문명이 위험에 빠짐.
  - Act 3: AI 군세가 우주로 팽창하며 스카이워커 전선에서 전투. 로봇 모함 격파 후 천체 균형이 교란됨.
  - Act 4: 신들이 강림하여 심판. 모든 종족이 연합하여 신성한 분노에 맞서고, 새로운 시대가 열림.
- 주요 보상/이벤트: 스토리 완료 시 스킬 포인트, 희귀 아이템 등 지급
- 스토리 진행은 `Act`, Step(`Intro`, `Climax`) 단위로 구성되며, 보스 대사/이벤트 대사가 다국어로 등록되어 있음

## 15. 캐릭터/등장 요소 (번역 기준 추정)
- **Akria / Charsi**: 스토리 진행 시 등장하는 NPC로 보이며, 완료 보상 제공자
- 주요 종족/세력: 인간, 엘프, 드래곤, 언데드, 로봇/AI, 스카이워커, 신 계열
