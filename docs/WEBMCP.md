# SNSHero WebMCP (Web Model Context Protocol) 가이드

> **표준 규격**: [Google Chrome WebMCP W3C WICG 제안 표준](https://developer.chrome.com/docs/ai/webmcp?hl=ko)  
> **지원 환경**: Chrome 149+ 내장 WebMCP (`document.modelContext`), 브라우저 확장 프로그램, 헤드리스 AI 에이전트 (Puppeteer, Playwright), 폴리필/브리지 (`window.webMCP`)

---

## 1. 개요

SNSHero는 사용자 가이드나 복잡한 UI 튜토리얼 없이도 **AI 에이전트(LLM, Gemini, Claude, OpenAI Operator 등)가 게임 전체를 자율적으로 인식하고 플레이**할 수 있도록 W3C/Chrome 표준 **WebMCP(Web Model Context Protocol)**를 전 화면에 걸쳐 100% 적용했습니다.

### 핵심 기능
- **표준 도구 등록 인터페이스**: `document.modelContext.registerTool({ name, description, inputSchema, annotations, execute }, { signal })`
- **동적 화면 생명주기 관리**: 현재 보고 있는 화면(View)에 최적화된 도구만 자동으로 활성화되고, 화면 전환 시 이전 화면의 도구는 `AbortSignal`로 즉시 정리됩니다.
- **폴리필 & 듀얼 브리지**: WebMCP를 네이티브 지원하지 않는 브라우저에서도 `document.modelContext` 및 `window.webMCP` 전역 객체가 생성되어 개발자 도구 콘솔, 스크립트, 외부 확장 프로그램에서 동일한 표준 API로 즉시 호출 가능합니다.
- **실시간 비주얼 인스펙터**: 화면 좌측 하단 플로팅 뱃지 `[⚡ WebMCP: N]`를 탭하면 현재 등록된 모든 도구의 JSON 스키마를 확인하고 직접 매개변수를 입력하여 테스트 실행할 수 있는 대화형 콘솔 모달이 열립니다.

---

## 2. WebMCP API 인터페이스

### 2.1 도구 조회
```javascript
// 등록된 모든 활성 도구 목록 (전역 도구 + 현재 화면 도구)
const tools = document.modelContext.getTools();
console.log(tools);
```

### 2.2 도구 실행
```javascript
// 표준 executeTool API
const result = await document.modelContext.executeTool('navigate_to_screen', { targetScreen: 'battle' });
console.log(result); // { success: true, from: 'home', to: 'battle' }
```

### 2.3 `window.webMCP` 헬퍼 브리지
```javascript
// 편의 API 브리지
await window.webMCP.execute('deck_optimize_best_cards');
const state = await window.webMCP.execute('get_game_state');
```

---

## 3. 화면별 WebMCP 도구 카탈로그 (전체 31종)

### 3.1 전역 도구 (Always Available - 5종)
| 도구 이름 | 설명 | 입력 스키마 | Annotations |
| :--- | :--- | :--- | :--- |
| `navigate_to_screen` | 원하는 게임 화면으로 즉시 전환 | `{ targetScreen: string }` | `readOnly: false, consequential: false` |
| `get_game_state` | 현재 보유 재화, AP, 덱 전투력, 화면 정보 조회 | `{}` | `readOnly: true` |
| `get_available_screens` | 진입 가능한 전체 화면 목록 및 한/영 이름 조회 | `{}` | `readOnly: true` |
| `change_language` | 게임 표시 언어 전환 (ko, en, ja, zh 등 12개 국어) | `{ language: string }` | `readOnly: false, consequential: false` |
| `search_card_database` | 110종 전체 카드 데이터베이스 이름/속성/스탯 검색 | `{ query?: string, element?: string, minPower?: number }` | `readOnly: true` |

### 3.2 홈 화면 도구 (HomeView - 3종)
| 도구 이름 | 설명 | 입력 스키마 | Annotations |
| :--- | :--- | :--- | :--- |
| `home_claim_fountain_wish` | 12시간 주기 소원의 분수 무료 SNS 보상 수령 | `{}` | `readOnly: false, consequential: true` |
| `home_claim_stamina_station` | 정오/오후 6시 일일 무료 스태미나 충전 수령 | `{}` | `readOnly: false, consequential: true` |
| `home_get_summary_status` | 홈 위젯 상태(미션, 분수 쿨다운, 덱 파워) 조회 | `{}` | `readOnly: true` |

### 3.3 랭킹 화면 도구 (RankingView - 3종)
| 도구 이름 | 설명 | 입력 스키마 | Annotations |
| :--- | :--- | :--- | :--- |
| `ranking_challenge_ranker` | 랭킹 보드 상위 유저 또는 고스트 봇에게 PVP 도전 | `{ targetRank: number, targetName?: string }` | `readOnly: false, consequential: true` |
| `ranking_get_leaderboard` | 최상위 랭커 목록 및 내 순위/점수 조회 | `{ limit?: number }` | `readOnly: true` |
| `ranking_switch_tab` | 글로벌/국가별 랭킹 탭 전환 | `{ tab: 'global' \| 'national' }` | `readOnly: false` |

### 3.4 배틀 화면 도구 (MobileCardPlayScreen - 3종)
| 도구 이름 | 설명 | 입력 스키마 | Annotations |
| :--- | :--- | :--- | :--- |
| `battle_play_card_move` | 보유 핸드 카드를 3x3 보드 슬롯에 배치 | `{ handCardIndex: number, boardSlotIndex: number }` | `readOnly: false, consequential: true` |
| `battle_toggle_auto_play` | 배틀 AI 자동 플레이 온/오프 토글 | `{ enable?: boolean }` | `readOnly: false` |
| `battle_get_board_state` | 3x3 격자판, 내 핸드 5장, 상대 핸드, 현재 점수 조회 | `{}` | `readOnly: true` |

### 3.5 마이덱 화면 도구 (MyDeckView - 3종)
| 도구 이름 | 설명 | 입력 스키마 | Annotations |
| :--- | :--- | :--- | :--- |
| `deck_optimize_best_cards` | 인벤토리 분석 후 최고 전투력 카드 5장 원클릭 자동 장착 | `{}` | `readOnly: false, consequential: true` |
| `deck_get_inventory_and_slots` | 현재 5슬롯 덱 구성 및 전체 보유 카드/레벨/스탯 조회 | `{}` | `readOnly: true` |
| `deck_swap_card` | 특정 슬롯(0~4)에 인벤토리 카드 교체 장착 | `{ slotIndex: number, cardId: number }` | `readOnly: false, consequential: true` |

### 3.6 상점 화면 도구 (ShopView - 3종)
| 도구 이름 | 설명 | 입력 스키마 | Annotations |
| :--- | :--- | :--- | :--- |
| `shop_summon_gacha_pack` | 카드팩 소환 (단차 또는 10연차) | `{ packType: string, isTenPull: boolean }` | `readOnly: false, consequential: true` |
| `shop_get_pity_and_catalog` | 가챠 천장 게이지, 일일 무료 소환 여부, 상품 카탈로그 조회 | `{}` | `readOnly: true` |
| `shop_initiate_crypto_payment` | OKX 암호화폐 결제 모달 호출 | `{ currency?: string }` | `readOnly: false` |

### 3.7 미션 게임 화면 도구 (PlayGameView - 3종)
| 도구 이름 | 설명 | 입력 스키마 | Annotations |
| :--- | :--- | :--- | :--- |
| `game_launch_by_id` | 110종 Poki 아케이드 미션 게임 지정 실행 | `{ gameId: number }` | `readOnly: false` |
| `game_roll_random_dice` | 주사위 롤러를 굴려 무작위 미션 게임 자동 선택/실행 | `{}` | `readOnly: false` |
| `game_get_all_modes` | 110종 전체 미션 게임 목록, 카테고리, 플레이 가이드 조회 | `{}` | `readOnly: true` |

### 3.8 주식/코인 거래소 도구 (StockMarketView - 3종)
| 도구 이름 | 설명 | 입력 스키마 | Annotations |
| :--- | :--- | :--- | :--- |
| `stock_buy_shares` | 가상 히어로 주식/코인 티커 매수 | `{ ticker: string, quantity: number }` | `readOnly: false, consequential: true` |
| `stock_sell_shares` | 보유 주식/코인 티커 매도 및 SNS 실현 | `{ ticker: string, quantity: number }` | `readOnly: false, consequential: true` |
| `stock_get_portfolio_and_prices` | 20대 대표 코인 시세 및 내 보유 주식 포트폴리오 조회 | `{}` | `readOnly: true` |

### 3.9 P2P 카드 마켓플레이스 도구 (CardMarketplaceView - 3종)
| 도구 이름 | 설명 | 입력 스키마 | Annotations |
| :--- | :--- | :--- | :--- |
| `market_buy_card_listing` | 유저 간 P2P 마켓에 등록된 카드 매수 | `{ listingId: string }` | `readOnly: false, consequential: true` |
| `market_list_card_for_sale` | 보유 카드를 지정 SNS 가격으로 판매 등록 | `{ cardId: number, priceSns: number }` | `readOnly: false, consequential: true` |
| `market_get_listings_and_offers` | 활성 판매 매물, 내 거래 제안, 에스크로 상태 조회 | `{}` | `readOnly: true` |

### 3.10 커뮤니티 화면 도구 (CommunityView - 2종)
| 도구 이름 | 설명 | 입력 스키마 | Annotations |
| :--- | :--- | :--- | :--- |
| `community_create_post` | 자유/공략/덱자랑 게시판 새 글 발행 | `{ title: string, content: string, channel: string }` | `readOnly: false, consequential: true` |
| `community_get_feed_posts` | 최신 커뮤니티 피드 글 목록 및 댓글/좋아요 수 조회 | `{ category?: string }` | `readOnly: true` |

---

## 4. 자율 AI Agent 플레이 시나리오 예제

가이드나 사람의 조작 없이 AI 에이전트가 자율적으로 실행하는 전형적인 루프:

```javascript
// 1단계: 게임 상태 및 현재 화면 파악
const state = await document.modelContext.executeTool('get_game_state');
console.log(`현재 화면: ${state.currentScreen}, SNS 포인트: ${state.sns}`);

// 2단계: 홈 화면이면 소원의 분수 무료 보상 수령
if (state.currentScreen === 'home') {
  await document.modelContext.executeTool('home_claim_fountain_wish');
}

// 3단계: 상점으로 이동하여 카드팩 뽑기
await document.modelContext.executeTool('navigate_to_screen', { targetScreen: 'shop' });
await document.modelContext.executeTool('shop_summon_gacha_pack', { packType: 'gold', isTenPull: false });

// 4단계: 마이덱으로 이동하여 뽑은 최상위 카드로 덱 자동 최적화
await document.modelContext.executeTool('navigate_to_screen', { targetScreen: 'mydeck' });
await document.modelContext.executeTool('deck_optimize_best_cards');

// 5단계: 배틀 화면으로 이동하여 자동 전투 실행
await document.modelContext.executeTool('navigate_to_screen', { targetScreen: 'battle' });
await document.modelContext.executeTool('battle_toggle_auto_play', { enable: true });
```

---

## 5. Puppeteer / Playwright 헤드리스 브라우저 테스트 연동

헤드리스 에이전트 환경에서 SNSHero를 자율 제어할 때:

```typescript
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://snshero.com');

  // WebMCP 로드 대기
  await page.waitForFunction(() => !!(window as any).webMCP);

  // 등록된 도구 목록 가져오기
  const tools = await page.evaluate(async () => {
    return (window as any).document.modelContext.getTools();
  });
  console.log('등록된 WebMCP 도구 수:', tools.length);

  // 덱 최적화 실행
  const res = await page.evaluate(async () => {
    await (window as any).document.modelContext.executeTool('navigate_to_screen', { targetScreen: 'mydeck' });
    return await (window as any).document.modelContext.executeTool('deck_optimize_best_cards');
  });
  console.log('실행 결과:', res);

  await browser.close();
})();
```

---

## 6. 결론

SNSHero의 WebMCP 아키텍처는 W3C/Chrome 표준 명세를 100% 준수하여 구현되었으며, 로컬스토리지 영구 보존 원칙과 완벽히 호환됩니다. AI 에이전트는 자연어 가이드 없이도 제공되는 도구 카탈로그(JSON Schema)를 통해 게임의 모든 기능을 스스로 탐색하고 즐길 수 있습니다.
