# Handoff Report: Milestone 5 Currency Debit/Credit & Dual-Write Persistence Exploration

## 1. Observation

### 1.1 Currency Debit/Credit in `#shop` (`src/landing/views/ShopSection.tsx`)
- **Reading Currency**:
  - `getUserCoins()` at lines 119–128 reads only `localStorage.getItem('hero_sns')`:
    ```typescript
    export function getUserCoins(): number {
      if (typeof localStorage === 'undefined') return 1000;
      const raw = localStorage.getItem('hero_sns');
      if (!raw) {
        localStorage.setItem('hero_sns', '1000');
        return 1000;
      }
      const val = parseInt(raw, 10);
      return isNaN(val) ? 1000 : Math.max(0, val);
    }
    ```
  - It completely omits reading `hero_earned_sns` and `hero_purchased_sns`.
  - There is zero reading or handling of `hero_gold` in `ShopSection.tsx`.
- **Writing Currency**:
  - `setUserCoins(amount)` at lines 130–136 writes exclusively to `localStorage.setItem('hero_sns', String(Math.max(0, amount)))`:
    ```typescript
    export function setUserCoins(amount: number): void {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem('hero_sns', String(Math.max(0, amount)));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('snshero_sns_updated'));
      }
    }
    ```
  - Neither `hero_earned_sns` nor `hero_purchased_sns` are updated during coin mutation.
  - Season-scoped keys such as `hero_sns_${season}` are not synchronized.
- **Balance Validation in Purchases**:
  - In `executeShopPurchase(itemId)` at lines 149–154:
    ```typescript
    if (currentCoins < item.priceCoins) {
      return {
        success: false,
        message: `SNS 코인이 부족합니다. (현재: ${currentCoins} SNS / 필요: ${item.priceCoins} SNS)`,
      };
    }
    ```
    Balance validation gracefully prevents execution and preserves currency when funds are insufficient.
  - However, upon purchase at line 157:
    ```typescript
    setUserCoins(currentCoins - item.priceCoins);
    ```
    This simply replaces `hero_sns` with the remainder, violating the canonical currency consumption rules established in `App.tsx:3554–3563` where `hero_earned_sns` must be debited first before consuming `hero_purchased_sns`.

### 1.2 Dual-Write Persistence (`cardNurtureStore.ts` & `ShopSection.tsx`)
- In `ShopSection.tsx` lines 166–170:
  ```typescript
  for (let i = 0; i < 3; i++) {
    const randId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
    cardNurtureStore.addCard(randId);
    unlockedIds.push(randId);
  }
  ```
- In `src/landing/services/cardNurtureStore.ts` lines 372–411:
  ```typescript
  addCard(cardId: number): boolean {
    if (!Number.isInteger(cardId) || cardId < 1 || cardId > 110) return false;
    let added = false;
    if (!this.ownedCardIds.includes(cardId)) {
      this.ownedCardIds.push(cardId);
      this.ownedCardIds.sort((a, b) => a - b);
      this.ensureValidDeck();
      added = true;
    }
    this.syncCardToHeroInventory(cardId);
    this.saveToStorage();
    this.dispatchUpdateEvent(cardId);
    return added;
  }

  private syncCardToHeroInventory(cardId: number): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const season = localStorage.getItem('hero_current_season') || 'season1';
      const rawInv = localStorage.getItem('hero_inventory');
      const inv: Record<string, any> = rawInv ? JSON.parse(rawInv) : {};
      const key = String(cardId);
      if (!inv[key]) {
        inv[key] = {
          cardIndex: cardId,
          id: cardId,
          quantity: 1,
          rarity: CARD_DATABASE[cardId]?.rarity || 'bronze',
        };
      } else {
        inv[key].quantity = (inv[key].quantity || 0) + 1;
      }
      const serialized = JSON.stringify(inv);
      localStorage.setItem('hero_inventory', serialized);
      localStorage.setItem(`hero_inventory_${season}`, serialized);
      localStorage.setItem(`hero_inventory_guest_${season}`, serialized);
    } catch (e) {
      console.warn('Failed to sync to hero_inventory:', e);
    }
  }
  ```
- **Duplicate Card Handling**:
  - In `cardNurtureStore`: If `cardId` is already in `this.ownedCardIds`, `this.ownedCardIds` maintains uniqueness (no duplicates added to the array), and `addCard` returns `false`.
  - In `hero_inventory`: `inv[key].quantity` increments by 1 on duplicate acquisitions (`inv[key].quantity = (inv[key].quantity || 0) + 1`).
  - **Season Key Observation**: `syncCardToHeroInventory` writes `hero_inventory_${season}` (e.g. `hero_inventory_season1`), but does not explicitly write the short key `hero_inventory_s1` referenced in the prompt scope.
  - **Event Notification**: `syncCardToHeroInventory` does not dispatch `snshero_inventory_updated`.
  - **Pack Reveal Modal**: When packs are purchased, `executeShopPurchase` does not trigger `PackRevealModal`; it only returns a text message string, and `src/landing/index.ts:360–368` simply triggers `renderApp()`.

### 1.3 Non-Free Gold Exchange & Free SNS Faucet
- **Free Faucets Discovered**:
  1. `src/landing/views/ShopSection.tsx` lines 108–116 & 144–147:
     `SHOP_ITEMS[7]` is `'coin_charge'`, with `priceCoins: 0`. Calling `executeShopPurchase('coin_charge')` adds 1,000 SNS immediately with zero gold/currency spent:
     ```typescript
     if (itemId === 'coin_charge') {
       setUserCoins(currentCoins + 1000);
       return { success: true, message: '1,000 SNS 코인이 즉시 충전되었습니다!' };
     }
     ```
  2. `src/landing/views/ShopSection.tsx` lines 229–235 & `src/landing/index.ts` lines 369–373:
     Header currency bar button `data-action="free-charge-coin"` with text `+ 코인 무료 충전` gives 1,000 free coins on every click:
     ```typescript
     } else if (action === 'free-charge-coin') {
       const cur = getUserCoins();
       setUserCoins(cur + 1000);
       renderApp();
     }
     ```
- **Absence of Structured Gold-to-SNS Exchange**:
  - No gold exchange mechanism exists in `ShopSection.tsx`.
  - Neither `src/landing/types.ts` (`ModalKey`) nor `src/landing/components/Modals.tsx` includes a gold exchange modal or pack reveal modal.
  - In `tests/e2e/helpers.ts` lines 496–530, `ReferenceShopManager.exchangeGoldForSns(goldAmount: number = 5000)` establishes the reference contract:
    - 5 Gold = 1 SNS (5,000 Gold -> 1,000 SNS).
    - Checks `currentGold >= goldAmount`. If insufficient, returns `{ success: false, snsGranted: 0, error: '보유 골드가 부족합니다.' }`.
    - Debits `hero_gold` by `goldAmount`.
    - Credits `hero_sns` and `hero_earned_sns` by `snsGranted`.

---

## 2. Logic Chain

1. **Balance Validation & Currency Integrity**:
   - Observation 1.1 reveals that `getUserCoins()` reads only `hero_sns` and `setUserCoins()` writes only `hero_sns`.
   - `App.tsx:3554–3563` and `PROJECT.md:49` establish that SNS has two components: `hero_earned_sns` and `hero_purchased_sns`.
   - Debiting currency must deduct from `hero_earned_sns` first, spilling over into `hero_purchased_sns` only if earned SNS is depleted.
   - Therefore, `ShopSection.tsx` currently loses track of earned vs. purchased balances whenever purchases occur.
   - Balance validation (`currentCoins < item.priceCoins`) functions correctly to prevent overdraft, but the subsequent state update is incomplete.

2. **Dual-Write Consistency**:
   - Observation 1.2 demonstrates that `addCard()` already dual-writes to `cardNurtureStore.cards` / `this.ownedCardIds` and `hero_inventory`.
   - For duplicate cards, `ownedCardIds` preserves distinct IDs while `hero_inventory[cardId].quantity` increments by 1, which matches specifications.
   - However, `syncCardToHeroInventory()` writes `hero_inventory_${season}` (which resolves to `hero_inventory_season1`) and `hero_inventory_guest_${season}`. If callers or test harnesses specifically query `hero_inventory_s1`, they will find `null` unless `hero_inventory_s1` is also written.
   - Furthermore, `ShopSection.tsx` does not return or pass revealed card objects to `PackRevealModal`, preventing the player from seeing newly unlocked cards.

3. **Faucet Elimination & Gold Exchange**:
   - Observation 1.3 documents two explicit free faucets: `SHOP_ITEMS[7]` (`coin_charge`, 0 SNS) and the `+ 코인 무료 충전` button (`data-action="free-charge-coin"`).
   - `ORIGINAL_REQUEST.md:507` and `PROJECT.md:50, 82` mandate non-free currency replenishment where in-game `hero_gold` is converted to `hero_sns` (e.g. 5,000 Gold -> 1,000 SNS).
   - Therefore, the free charging logic must be eliminated, the button converted to `[골드 환전소]`, and a structured exchange modal implemented with `hero_gold >= 5000` balance validation.

---

## 3. Caveats

1. **Initial Gold Balance Initialization**:
   - If a new player enters `#shop` without prior minigame play, `localStorage.getItem('hero_gold')` may be `null`.
   - In `tests/e2e/helpers.ts:407–408`, default gold is initialized to `10,000` (`hero_gold = '10000'`).
   - If initialized to `0`, new players would not be able to test or use gold exchange without playing minigames first. A standard default fallback (e.g. 10,000 Gold) in `getUserGold()` aligns with the test oracle.
2. **Read-Only Constraint**:
   - Under explorer role constraints, no production files (`ShopSection.tsx`, `cardNurtureStore.ts`, `Modals.tsx`, `index.ts`) were modified during this investigation. Implementation must be carried out by subsequent implementer agents.

---

## 4. Conclusion

1. **Currency Management in `#shop`**:
   - Replace isolated `getUserCoins` / `setUserCoins` with unified balance management:
     - Read: `hero_sns`, `hero_earned_sns`, `hero_purchased_sns`, and `hero_gold`.
     - Debit: Verify `hero_sns >= cost`; deduct from `hero_earned_sns` first, remainder from `hero_purchased_sns`; update `hero_sns` and `hero_sns_${season}`; dispatch `snshero_sns_updated`.
2. **Dual-Write Persistence**:
   - `cardNurtureStore.addCard` handles duplicate increments in `hero_inventory` properly.
   - Extend `syncCardToHeroInventory` to write both `hero_inventory_${season}` and `hero_inventory_s1`, and dispatch `snshero_inventory_updated`.
   - Update `executeShopPurchase` for card packs to return `revealedCards: PackRevealCard[]` and open `PackRevealModal`.
3. **Non-Free Gold Exchange**:
   - Eliminate both free faucets (`coin_charge` free grant and `free-charge-coin` button).
   - In `SHOP_ITEMS`, update item 8 to open the Gold Exchange Modal.
   - In the `#shop` header, change `+ 코인 무료 충전` to `[골드 환전소 (5,000G → 1,000 SNS)]` with `data-action="open-gold-exchange"`.
   - Implement structured `GoldExchangeModal` (or within `Modals.tsx`) verifying `hero_gold >= 5000`, debiting `5,000 hero_gold`, and crediting `1,000 hero_earned_sns` & `hero_sns`.

---

## 5. Verification Method

1. **E2E Suite Verification**:
   - Run: `npx tsx tests/e2e/run_all.ts`
   - Verify assertions:
     - `T1.SHOP.3`: `Inventory Dual-Write (cardNurtureStore & hero_inventory)`
     - `T1.SHOP.4`: `Currency Balance Debit/Credit (hero_sns, hero_earned_sns, hero_gold)`
     - `T1.SHOP.5`: `Non-Free Currency Replenishment (In-Game hero_gold to hero_sns Exchange)`
     - `T2.B4.1`: `Insufficient Balance Pack Purchase Safe Rejection`
     - `T2.B4.2`: `Invalid or Insufficient Gold Exchange Safe Rejection`
     - `T3.C1.3`: `Shop Pack Purchase -> Dual-Write -> Owned Nurturing Gate Unlocked`
     - `T3.C1.4`: `Gold-to-SNS Exchange Debits Gold, Credits SNS, and Unlocks Pack Purchase`
     - `T4.W1.5`: `Commercial Economy: Gold-to-SNS Exchange, Pack Purchase & Reveal Modal Dual-Write`
2. **M4 Challenger Empirical Test**:
   - Run: `npx tsx tests/challenger_m4_9_2_empirical_stress.ts`
   - Verify Suite 4 (Dual-Write Inventory Synchronization: CHAL2-M4-SYNC-01 through 08).
3. **Production Build**:
   - Run: `npm run build`
   - Verify exit code 0 and zero bundling warnings/errors.
4. **Invalidation Conditions**:
   - If any button grants SNS without debiting gold or external payment.
   - If purchasing with insufficient SNS deducts any currency.
   - If card pack purchases do not increment card quantity in `hero_inventory`.
   - If gold exchange allows `< 5000` gold or mutates balances on failure.
