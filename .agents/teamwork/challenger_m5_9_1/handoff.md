# Empirical Challenge Report: Milestone 5 Pack Reveal & Dual-Write Invariants

**Agent**: `challenger_m5_9_1` (Milestone 5 Challenger 1: Pack Reveal & Dual-Write Invariants)  
**Parent ID**: `21826d14-7bc9-4995-866c-cbb42a941789`  
**Milestone**: Milestone 5 (`#shop` Restoration & Responsive Google AdSense)  
**Date**: 2026-11-02  
**Final Verdict**: **APPROVE** (All 37/37 empirical challenge assertions PASSED)

---

## 1. Observation

1. **Independent Empirical Challenge Test Suite Deployment**:
   - Developed and executed `tests/challenger_m5_9_1_empirical_invariants.ts` covering 37 distinct empirical assertions across 5 adversarial suites:
     - **Suite 1**: 3-Card Pack Purchase & Rarity Bounds Invariants (`CH5-PACK-NORMAL-100`, `CH5-PACK-MAGIC-100`, `CH5-PACK-RARE-100`, `CH5-PRICE-NORMAL`, `CH5-PRICE-MAGIC`, `CH5-PRICE-RARE`, `CH5-REJECT-INSUFFICIENT`)
     - **Suite 2**: `renderPackRevealModal()` DOM Output Invariants (`CH5-MODAL-EMPTY`, `CH5-MODAL-POPULATED`, `CH5-MODAL-A11Y-BACKDROP`, `CH5-MODAL-TERMINAL-FLAT`, `CH5-MODAL-3-SLOTS`, `CH5-SLOTS-DATA-IMAGE`, `CH5-SLOTS-STATS-PWR-RARITY`, `CH5-CONFIRM-BUTTON`, `CH5-CLOSE-BUTTON`, `CH5-MODAL-NEW-DUP-BADGES`)
     - **Suite 3**: Modal Dismissal Invariants (`CH5-DISMISS-SETUP`, `CH5-DISMISS-BACKDROP`, `CH5-DISMISS-CONTAINER`, `CH5-DISMISS-CLOSE-BUTTON`, `CH5-DISMISS-CONFIRM-BUTTON`, `CH5-DISMISS-ESCAPE`, `CH5-IMMUNITY-NON-ESCAPE-KEYS`, `CH5-IMMUNITY-INSIDE-CLICK`, `CH5-SOURCE-CONTRACT-DISMISSAL`)
     - **Suite 4**: Dual-Write Persistence Invariants (`CH5-DUAL-INIT`, `CH5-DUAL-FIRST-ACQUISITION`, `CH5-DUAL-SEASON-KEYS`, `CH5-DUPLICATE-OWNED-UNIQUENESS`, `CH5-DUPLICATE-QUANTITY-INCREMENTS`, `CH5-EVENT-INVENTORY-UPDATED`)
     - **Suite 5**: Full-Cycle Pack Opening Dual-Write & Storage Stress Test (`CH5-STRESS-15-PACKS`, `CH5-NURTURE-STORAGE-PAYLOAD`, `CH5-IMMUNITY-INVALID-CARD-IDS`, `CH5-RESILIENCE-CORRUPTED-INVENTORY`, `CH5-BOUNDARY-CARD-1-AND-110`)
   - Execution command and output:
     ```bash
     $ npx tsx tests/challenger_m5_9_1_empirical_invariants.ts
     ...
     ========================================================================
       EMPIRICAL CHALLENGER M5.9.1 EXECUTION SUMMARY                        
     ========================================================================
       Total Assertions Run : 37
       Passed               : 37
       Failed               : 0
       Pass Rate            : 100.0%
     ========================================================================
     [VERDICT] APPROVE — All 37 empirical invariants verified successfully!
     ```

2. **Pack Roll Bounds & Deduplication Observations**:
   - In `src/landing/views/ShopSection.tsx` lines 426–436:
     ```typescript
     const minId = itemId === 'pack_normal' ? 1 : itemId === 'pack_magic' ? 20 : 60;
     const maxId = itemId === 'pack_normal' ? 50 : itemId === 'pack_magic' ? 90 : 110;

     const unlockedIds: number[] = [];
     while (unlockedIds.length < 3) {
       const randId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
       if (!unlockedIds.includes(randId)) {
         unlockedIds.push(randId);
       }
     }
     ```
   - Across 300 sequential pack openings (100 Normal, 100 Magic, 100 Rare), `unlockedIds.length` was strictly 3, `new Set(unlockedIds).size` was strictly 3, and all IDs fell within the expected intervals (`1..50`, `20..90`, `60..110`).
   - Insufficient currency check in lines 406–412 properly aborted transaction when user balance was 250 SNS (< 300 SNS), maintaining zero balance debit and zero pack activation.

3. **Pack Reveal Modal DOM Structure Observations**:
   - In `src/landing/views/ShopSection.tsx` lines 523–631 (`renderPackRevealModal()`):
     - Output contains `#pack-reveal-modal` with `role="dialog"` and `aria-modal="true"`.
     - Output contains sibling backdrop `#pack-reveal-backdrop` with `data-action="close-pack-reveal"`.
     - Frame adheres strictly to OpenCode Terminal-Flat design: `rounded-none`, `font-mono`, hairline border `border border-[rgba(15,0,0,0.12)]`.
     - Exactly 3 `.pack-card-slot` elements rendered with `data-card-id` and `data-flipped="true"`.
     - Card images render `/seat/${cardId}.png` with `onerror` fallback to `c.bustUrl`.
     - Directional stats `N${top} E${right} S${bottom} W${left}` and total power `PWR ${power}` match `CARD_DATABASE` values.
     - New vs duplicate badge renders `[NEW]` for unowned cards and `[보유 +1]` for previously owned duplicates.
     - Confirm button has `data-action="confirm-pack-reveal"` and `min-h-[44px]`.
     - Close button has `data-action="close-pack-reveal"`, `min-h-[44px]`, and `[x]`.
     - Empty string returned when `activeRevealPack` is `null`.

4. **Modal Dismissal Observations**:
   - In `src/landing/index.ts` lines 257–260:
     ```typescript
     if (rawTarget.id === 'pack-reveal-modal' || rawTarget.id === 'pack-reveal-backdrop') {
       closePackRevealModal();
       renderApp();
       return;
     }
     ```
   - In `src/landing/index.ts` lines 429–432:
     ```typescript
     } else if (action === 'close-pack-reveal' || action === 'confirm-pack-reveal') {
       closePackRevealModal();
       renderApp();
     }
     ```
   - In `src/landing/index.ts` lines 463–468:
     ```typescript
     if (event.key === 'Escape') {
       if (getActiveRevealPack()) {
         closePackRevealModal();
         renderApp();
         return;
       }
     ```
   - Tested 4 independent dismissal pathways:
     1. Backdrop click (`#pack-reveal-backdrop`) -> Modal closed (`activeRevealPack === null`).
     2. Close button click (`data-action="close-pack-reveal"`) -> Modal closed.
     3. Confirm button click (`data-action="confirm-pack-reveal"`) -> Modal closed.
     4. Keyboard `Escape` -> Modal closed.
   - Tested dismissal immunity: Non-Escape keys (`Enter`, `Space`, `Tab`, `x`) and clicks inside the modal frame without dismissal actions preserve the open modal state.

5. **Dual-Write Persistence & Event Dispatch Observations**:
   - In `src/landing/services/cardNurtureStore.ts` lines 372–420 (`addCard` and `syncCardToHeroInventory`):
     - First acquisition sets `isCardOwned(id) = true` and writes `quantity: 1` to `hero_inventory`.
     - Dual-writes synchronously to `hero_inventory_s1`, `hero_inventory_${season}`, and `hero_inventory_guest_${season}`.
     - Duplicate acquisition keeps `ownedCardIds` deduplicated (`ownedCardIds.length` unchanged) while incrementing `quantity` (1 -> 2 -> 3 -> 4) in all inventory keys.
     - Custom event `snshero_inventory_updated` is dispatched with detail `{ cardId, quantity, inventory }`.
     - Corrupted non-JSON strings in `hero_inventory` are caught safely without crashing.
     - Boundary IDs (Card 1 minimum, Card 110 Boss maximum) dual-write with 100% integrity.

6. **Regression Verification Results**:
   - `tests/adversarial_m5_shop_adsense.ts`: **38 / 38 PASS (100.0%)**
   - `tests/e2e/run_all.ts`: **76 / 76 PASS (100.0%)** across Tiers 1-4
   - `npx tsc --noEmit`: Exit code 0 (0 errors)
   - `npm run build`: Exit code 0 (`dist/` generated with zero errors)

---

## 2. Logic Chain

1. **Pack Invariant Soundness**:
   - Observation 2 directly demonstrates that `while (unlockedIds.length < 3)` with random integer selection within `[minId, maxId]` and `!unlockedIds.includes(randId)` mathematically guarantees 3 distinct card IDs. The empirical test across 300 purchases confirmed 0 duplicate IDs and 0 out-of-bounds roll occurrences.
   - Currency debiting occurs via `debitUserCoins(cost)` before rolling cards, ensuring that purchases cannot occur without sufficient SNS balance.

2. **Modal Markup & A11y Verification**:
   - Observation 3 confirms via Cheerio DOM parsing that `renderPackRevealModal()` satisfies all structural, visual, and accessibility requirements specified in `ORIGINAL_REQUEST.md` and `PROJECT.md`: 3 distinct slots, 44px+ mobile touch targets, OpenCode Terminal-Flat classes (`rounded-none`, `font-mono`, hairline borders), N/E/S/W stats, PWR total power, and both `[NEW]` and `[보유 +1]` indicators.

3. **Event Delegation & Dismissal Integrity**:
   - Observation 4 confirms that `handleEventDelegation` and `handleGlobalKeydown` in `src/landing/index.ts` intercept `#pack-reveal-backdrop`, `close-pack-reveal`, `confirm-pack-reveal`, and `Escape` keypresses, setting `activeRevealPack = null` and rendering the cleared DOM.
   - The immunity tests confirm that players will not accidentally dismiss the unboxing modal when clicking on cards or pressing other keys.

4. **Dual-Write Consistency & Event Reactivity**:
   - Observation 5 confirms that `addCard()` and `syncCardToHeroInventory()` maintain single-source-of-truth invariants between `cardNurtureStore` (`hero_card_nurturing`) and `hero_inventory` / `hero_inventory_s1` / `hero_inventory_${season}`.
   - Duplicate card acquisitions strictly preserve array uniqueness in `ownedCardIds` while incrementing inventory `quantity`.
   - The `snshero_inventory_updated` event reliably notifies reactive UI listeners with the updated card ID and quantity.

5. **Operational Health & Build Safety**:
   - Observation 6 verifies that all existing milestone suites (M1 through M5) continue to pass 100%, TypeScript compilation has 0 errors, and the production build completes cleanly.

---

## 3. Caveats

1. **AdSense Live Banner Fill**:
   - Live commercial Google AdSense ad units require production web domain approval and active network connections. In local automated tests, container placement, responsive breakpoint switching, and VIP ad-removal suppression (`hero_ad_removed`) are fully verified.
2. **Cheerio vs Headless Browser**:
   - Tests were executed in Node.js with Cheerio and in-memory polyfills. Live DOM layout rendering was verified via the master E2E test suite and `npm run build` static bundle generation.

---

## 4. Conclusion

**Verdict: APPROVE**

Milestone 5's 3-card pack reveal modal and dual-write persistence invariants are fully verified, robust, and mathematically sound.
All 37 adversarial empirical challenge assertions passed with 100% compliance:
- 3 distinct cards are consistently rolled within exact pack rarity bounds.
- `renderPackRevealModal()` produces clean OpenCode Terminal-Flat markup with 44px+ touch targets and full directional stats.
- Modal dismissals via backdrop click, close button `[x]`, confirm button `[확인]`, and `Escape` key function reliably with adversarial immunity.
- Dual-write persistence synchronously updates `cardNurtureStore`, `hero_inventory`, and seasonal inventory keys, while preserving `ownedCardIds` uniqueness and firing `snshero_inventory_updated`.

---

## 5. Verification Method

To independently execute and verify the empirical challenge harness:

1. **Milestone 5.9.1 Empirical Challenge Test Harness**:
   ```bash
   npx tsx tests/challenger_m5_9_1_empirical_invariants.ts
   ```
   *Expected Output*: 37 / 37 assertions PASS (100.0%), exit code 0.

2. **Milestone 5 Worker Test Suite**:
   ```bash
   npx tsx tests/adversarial_m5_shop_adsense.ts
   ```
   *Expected Output*: 38 / 38 assertions PASS (100.0%), exit code 0.

3. **Master E2E Test Suite**:
   ```bash
   npx tsx tests/e2e/run_all.ts
   ```
   *Expected Output*: 76 / 76 assertions PASS (100.0%), exit code 0.

4. **TypeScript Compilation & Build Verification**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   *Expected Output*: Exit code 0, 0 errors.
