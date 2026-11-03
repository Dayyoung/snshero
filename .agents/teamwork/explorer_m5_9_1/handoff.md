# Handoff Report: Milestone 5 Shop & PackRevealModal Architecture

## 1. Observation

### 1.1 `src/landing/views/ShopSection.tsx` Current State
- **Card Pack Items**:
  In `src/landing/views/ShopSection.tsx` (lines 36–66), exactly 3 card pack items are defined in `SHOP_ITEMS`:
  ```typescript
  {
    id: 'pack_normal',
    name: '일반 카드팩',
    category: '카드팩',
    priceText: '300 SNS',
    priceCoins: 300,
    badge: '브론즈~실버 확정',
    description: '기초 원소 영웅 3장을 획득합니다. 도감 수집율을 빠르게 높일 수 있는 기본 팩.',
    actionText: '구매하기 (300 SNS)',
  },
  {
    id: 'pack_magic',
    name: '매직 카드팩',
    category: '카드팩',
    priceText: '800 SNS',
    priceCoins: 800,
    badge: '실버~골드 확정',
    description: '상급 영웅 카드 3장을 획득합니다. 실버 등급 이상 확정 지급.',
    actionText: '구매하기 (800 SNS)',
  },
  {
    id: 'pack_rare',
    name: '희귀 카드팩',
    category: '카드팩',
    priceText: '1,500 SNS',
    priceCoins: 1500,
    badge: '골드 이상 확정',
    description: '최고 등급 전설 영웅 3장을 획득합니다. 덱 TP와 Total TP를 비약적으로 상승시킵니다.',
    actionText: '구매하기 (1,500 SNS)',
  }
  ```
- **Single vs. 10-Pack Options**:
  There are **no 10-pack options** currently in `SHOP_ITEMS` or `ShopSection.tsx`. All pack purchases are single-pack operations yielding exactly 3 cards.
- **Purchase Trigger & Event Handling**:
  The purchase button is rendered as:
  `<button type="button" data-action="buy-shop-item" data-item-id="${item.id}" data-item-name="${item.name}">` (lines 280–288).
  In `src/landing/index.ts` (lines 360–368), global event delegation listens for `action === 'buy-shop-item'`:
  ```typescript
  } else if (action === 'buy-shop-item') {
    const itemId = target.getAttribute('data-item-id');
    if (itemId) {
      const res = executeShopPurchase(itemId);
      if (!res.success) {
        console.warn(res.message);
      }
      renderApp();
    }
  }
  ```
- **Silent Card Addition (No Modal)**:
  In `src/landing/views/ShopSection.tsx` (lines 159–176), `executeShopPurchase` executes:
  ```typescript
  if (itemId === 'pack_normal' || itemId === 'pack_magic' || itemId === 'pack_rare') {
    const unlockedIds: number[] = [];
    const minId = itemId === 'pack_normal' ? 1 : itemId === 'pack_magic' ? 20 : 60;
    const maxId = itemId === 'pack_normal' ? 50 : itemId === 'pack_magic' ? 90 : 110;

    for (let i = 0; i < 3; i++) {
      const randId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
      cardNurtureStore.addCard(randId);
      unlockedIds.push(randId);
    }

    return {
      success: true,
      message: `${item.name}을 구매하여 영웅 카드 3장(ID: ${unlockedIds.join(', ')})을 획득하였습니다!`,
    };
  }
  ```
  `ShopSection.tsx` currently has **NO modal dialog** whatsoever. Cards are added completely silently in the background, without any visual reveal, animations, card artwork display, or confirmation dialog.

### 1.2 Legacy & Reference Components
- **Legacy React Gacha**:
  - `src/views/ShopView.tsx` uses `GachaRevealSequence.tsx` (1,084 lines).
  - Depends heavily on React 19, `motion/react` (Framer Motion), WebGL canvas (`GachaWebGLCanvas.tsx`), and Sound/Haptics.
  - Reveals 5 cards with rotating 360° aura rays, particle explosions, cut-in animations, and 3D card flips.
- **Pure TypeScript Static Landing Architecture**:
  - `src/landing/` does NOT use React. It uses pure TypeScript DOM template string generators (`renderApp()`, `renderHeader()`, `renderShopSection()`).
  - Heavy React-based components like `GachaRevealSequence.tsx` cannot run inside `src/landing/`.
- **Existing Modal References in `src/landing/`**:
  - `src/landing/components/Modals.tsx` (lines 17–192) contains `renderModals(activeModal: ModalKey)` with fixed inset-0 backdrop (`#landing-modal-overlay`), `modal-dialog` box, top-right `[x]` dismiss control, and `닫기` button. Currently only supports `'mall' | 'community' | 'login'`.
  - `src/landing/views/HomeSection.tsx` (lines 472–578) implements `home-card-inspect-modal` with dedicated sibling backdrop (`home-card-inspect-backdrop`), `[x]` top-right button, 7-head body preview, compass stats (N/E/S/W), and action buttons.
  - In `src/landing/index.ts` (lines 404–415), `handleGlobalKeydown` intercepts `Escape` to close modals.
- **E2E Contract Specification**:
  - `tests/e2e/types.ts` (lines 107–114) defines:
    ```typescript
    export interface PackRevealCard {
      cardId: number;
      nameKo: string;
      nameEn: string;
      rarity: 'Bronze' | 'Silver' | 'Gold' | 'Boss';
      faction: string;
      power: number;
    }
    ```
  - `tests/e2e/helpers.ts` (lines 431–478) provides `ReferenceShopManager.purchaseCardPack(packTier)` which rolls 3 distinct cards, calls `nurtureStore.addCard(cardId)` and `syncToHeroInventory(cardId)`, and returns `{ success, revealedCards: PackRevealCard[], deductedSns }`.
  - `tests/e2e/tier1_feature_coverage.ts` (lines 530–542) tests `T1.SHOP.2`: "Card pack purchase produces 3 revealed cards for animated modal".

### 1.3 Available Visual Asset & Stat Helpers
- `src/landing/services/assetCatalog.ts`:
  - `getCharacterAsset(cardId: number)` returns `cutoutUrl`, `bustPngUrl`, `seatUrl`, `nameKo`, `nameEn`, `faction`, `rarity`.
  - `FACTION_PALETTES` provides terminal-flat background and text colors per element.
- `src/cardDatabase.ts`:
  - `CARD_DATABASE[cardId]` provides `top`, `right`, `bottom`, `left`, `power`, and ability text.
- `src/landing/services/cardNurtureStore.ts`:
  - `cardNurtureStore.isCardOwned(cardId)` determines if the card is newly acquired or a duplicate.
  - `cardNurtureStore.addCard(cardId)` automatically calls `syncCardToHeroInventory(cardId)` to dual-write to `hero_inventory`.

---

## 2. Logic Chain

1. **Premise 1**: The user and Milestone 5 specification require `#shop` to display an animated 3-card pack reveal modal (`PackRevealModal`) when purchasing card packs (Feature 16).
2. **Premise 2**: `ShopSection.tsx` currently rolls cards and adds them silently via `cardNurtureStore.addCard()`, but never displays a modal.
3. **Premise 3**: `src/landing/` operates with zero React runtime, using HTML template strings and centralized event delegation in `src/landing/index.ts`.
4. **Premise 4**: All UI components must strictly comply with `DESIGN.md` OpenCode terminal-flat design:
   - 0px border radius on container and modal frames (`rounded-none`).
   - 4px maximum border radius on buttons and badges (`rounded-sm`).
   - `font-mono` typography throughout.
   - Solid Warm Cream (`#fdfcfc`, `#f8f7f7`) and Ink Dark (`#201d1d`) surfaces with 1px hairline borders (`border-[rgba(15,0,0,0.12)]`).
   - Strictly NO multi-stop gradients, drop shadows, neon glow, bounce, or ping animations.
5. **Inference 1 (State Management)**:
   `ShopSection.tsx` should maintain an active pack reveal state:
   ```typescript
   export interface PackRevealData {
     packId: string;
     packName: string;
     cards: Array<PackRevealCard & {
       top: number;
       right: number;
       bottom: number;
       left: number;
       bustUrl: string;
       seatUrl: string;
       isNew: boolean;
     }>;
   }
   let activeRevealPack: PackRevealData | null = null;
   export function getActiveRevealPack(): PackRevealData | null { return activeRevealPack; }
   export function setActiveRevealPack(pack: PackRevealData | null): void { activeRevealPack = pack; }
   ```
6. **Inference 2 (Modal Trigger)**:
   When `executeShopPurchase` succeeds for `pack_normal`, `pack_magic`, or `pack_rare`:
   - Deduct SNS coins (and record history/balance).
   - Roll 3 distinct cards within the tier range.
   - Dual-write via `cardNurtureStore.addCard(id)` and `syncToHeroInventory(id)`.
   - Set `activeRevealPack = { packId, packName, cards: revealedCards }`.
   - Return `{ success: true, message: ..., cardIds: [...], revealedCards: [...] }`.
7. **Inference 3 (Modal Rendering)**:
   `renderShopSection()` or `renderModals()` appends the `PackRevealModal` HTML dialog when `activeRevealPack` is not null.
   The modal dialog includes:
   - Fixed overlay with backdrop: `id="pack-reveal-modal"`.
   - Dedicated backdrop click element: `id="pack-reveal-backdrop"` with `data-action="close-pack-reveal"`.
   - Top-right close button: `data-action="close-pack-reveal"` (minimum 44x44px touch target).
   - Category header badge & pack title.
   - 3-card horizontal grid (`grid grid-cols-1 sm:grid-cols-3 gap-4`).
   - Each card display includes:
     - Rarity badge (`Bronze`, `Silver`, `Gold`, `Boss`) using terminal-flat pill (`rounded-sm`).
     - Character bust/portrait artwork (`getCharacterAsset(id).bustPngUrl`) with seat PNG fallback.
     - Korean & English name (`[NO.XXX] 이름 (Name)`).
     - 4-way compass stats (N/E/S/W) and Total TP power.
     - `[NEW]` badge or `[보유 +1]` badge.
     - Card entrance animation: subtle CSS staggered transition (e.g. `opacity 0 -> 1`, `translateY(8px) -> translateY(0)`), completely free of bounce or ping.
   - Bottom confirmation button: `data-action="close-pack-reveal"` (`min-h-[44px]`).
8. **Inference 4 (Dismissal Handling)**:
   In `src/landing/index.ts`:
   - Backdrop click: `rawTarget.id === 'pack-reveal-modal' || rawTarget.id === 'pack-reveal-backdrop'` -> `setActiveRevealPack(null); renderApp(); return;`.
   - Button click: `action === 'close-pack-reveal'` -> `setActiveRevealPack(null); renderApp(); return;`.
   - ESC keydown: `if (getActiveRevealPack()) { setActiveRevealPack(null); renderApp(); return; }`.
9. **Inference 5 (Backward Compatibility)**:
   Returning `{ success, message, cards, revealedCards }` preserves 100% backward compatibility with `tests/adversarial_tier5_m4_suite.ts` (`ADV-4.4`) and `tests/e2e/helpers.ts`.

---

## 3. Caveats

1. **Non-Free Currency Replenishment Scope**:
   Replacing `data-action="free-charge-coin"` with the in-game Gold-to-SNS currency exchange modal (`exchangeGoldForSns`, Feature 19) is a sibling task within Milestone 5. The pack reveal modal focuses exclusively on card pack purchasing and unboxing presentation.
2. **AdSense Integration Scope**:
   Desktop side gutters and mobile top banner placements (Features 20–22) are separate layout concerns handled by `AdSenseBanners.tsx` / `adsenseManager.ts`.
3. **Card Drop Rarity Weights**:
   `ShopSection.tsx` currently segments cards by ID boundaries (1–50 for normal, 20–90 for magic, 60–110 for rare). While this is simple and satisfies all tests, implementers can either maintain these distinct ID ranges or utilize weighted random rolls aligned with `GACHA_PACK_CONFIG` in `src/content/gachaRates.ts`.

---

## 4. Conclusion

- **Assessment**: The current `ShopSection.tsx` implementation performs silent card additions. A drop-in template string modal `PackRevealModal` is feasible, fits the zero-React architecture of `src/landing/`, and matches the existing `home-card-inspect-modal` pattern.
- **Actionable Drop-In Specification**:
  1. **Add `PackRevealData` and state getters/setters** to `src/landing/views/ShopSection.tsx`.
  2. **Update `executeShopPurchase`** to roll 3 distinct cards, dual-write to both `cardNurtureStore` and `hero_inventory`, build `revealedCards` metadata, and set `activeRevealPack`.
  3. **Add `renderPackRevealModal`** to generate the 3-card terminal-flat dialog (0px frame, 4px buttons/badges, font-mono, 44px+ touch targets).
  4. **Wire dismissal events in `src/landing/index.ts`**:
     - Handle `action === 'close-pack-reveal'`.
     - Handle `id === 'pack-reveal-backdrop'` backdrop clicks.
     - Add `if (getActiveRevealPack()) { setActiveRevealPack(null); renderApp(); return; }` to `handleGlobalKeydown` ESC handler.
  5. **Add CSS reveal animation** in `src/landing/styles/landing.css`: clean staggered keyframe translation (`terminal-pack-card-in`) with zero bounce or ping.

---

## 5. Verification Method

To independently verify the implementation:

1. **TypeScript Type Check**:
   ```bash
   npx tsc --noEmit
   ```
   Must pass with exit code 0.
2. **Production Bundle Build**:
   ```bash
   npm run build
   ```
   Must pass with exit code 0 and emit all production chunks.
3. **E2E Test Execution**:
   ```bash
   npx tsx tests/e2e/run_all.ts
   ```
   Specifically verifies `T1.SHOP.1` through `T1.SHOP.5` (Feature 16 card pack purchase and 3 revealed cards).
4. **Adversarial M4 Non-Regression**:
   ```bash
   npx tsx tests/adversarial_tier5_m4_suite.ts
   ```
   Confirms `ADV-4.4` (idempotent card unlocking and zero duplicate inventory corruption) continues to pass 100%.
5. **Interactive Browser Verification**:
   - Navigate to `#shop`.
   - Click "구매하기 (300 SNS)" on "일반 카드팩".
   - Confirm that `PackRevealModal` immediately opens displaying 3 distinct unlocked cards with correct artwork, rarity badge, stats, and confirm button.
   - Click backdrop, close `[x]`, or press ESC to confirm seamless modal dismissal and LocalStorage persistence.
