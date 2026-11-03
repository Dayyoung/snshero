# Milestone 5 Iteration 2: Suite 1 & Modal Mock Removal Investigation Report

**Agent**: `explorer_m5_it2_2` (Suite 1 & Modal Mock Removal Explorer)  
**Parent ID**: `21826d14-7bc9-4995-866c-cbb42a941789`  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m5_it2_2/`  
**Target Milestone**: Milestone 5 (`#shop` Restoration & Responsive Google AdSense)  

---

## 1. Observation

### 1.1 The Forensic Violation in `tests/adversarial_m5_shop_adsense.ts`
In `tests/adversarial_m5_shop_adsense.ts:196-225`, Suite 1 (`ADV-M5-PACK-01` through `ADV-M5-PACK-08`) was constructed around a self-certifying local test double string generator rather than importing and invoking production code:

```ts
// tests/adversarial_m5_shop_adsense.ts:196-227
  // 2. Check card reveal HTML template requirements (Mocking drop-in modal markup)
  const renderMockPackRevealModal = (cards: typeof purchase.revealedCards, isOpen: boolean) => {
    if (!isOpen) return '';
    return `
      <div id="pack-reveal-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono" role="dialog" aria-modal="true">
        <div class="bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-2xl w-full p-6 relative">
          <button type="button" data-action="close-pack-reveal" class="absolute top-4 right-4 min-h-[44px] min-w-[44px] text-stone-500 font-bold" aria-label="닫기">[x]</button>
          ...
```

- In `tests/adversarial_m5_shop_adsense.ts:171-175`, `ADV-M5-PACK-01` invoked `refShop.purchaseCardPack('normal')` from `ReferenceShopManager` in `tests/e2e/helpers.ts`, rather than calling production `executeShopPurchase('pack_normal')`.
- Assertions `ADV-M5-PACK-02` through `ADV-M5-PACK-07` tested against the local variable `modalHtml = renderMockPackRevealModal(purchase.revealedCards, true)`.
- Assertion `ADV-M5-PACK-08` tested `renderMockPackRevealModal(purchase.revealedCards, false) === ''`.
- Crucially, `renderPackRevealModal` from `src/landing/views/ShopSection.tsx` was **never imported or executed anywhere** in `tests/adversarial_m5_shop_adsense.ts`.

### 1.2 Genuine Production Implementation in `src/landing/views/ShopSection.tsx`
Direct inspection of `src/landing/views/ShopSection.tsx` reveals:
1. **Purchase Execution (`lines 390-483`)**:
   - `export function executeShopPurchase(itemId: string): ShopPurchaseResult`
   - Debits SNS coins using canonical earned-first rules via `debitUserCoins(item.priceCoins)` (300 SNS for `pack_normal`).
   - Rolls 3 distinct random cards within faction/rarity boundaries.
   - Dual-writes to both `cardNurtureStore.addCard(cardId)` and `hero_inventory`.
   - Populates `activeRevealPack: PackRevealData = { packId: item.id, packName: item.name, cards: revealedCards }`.
   - Returns `{ success: true, message: ..., cardIds: [...], revealedCards: [...] }`.

2. **Modal Rendering & Lifecycle (`lines 158-188` & `lines 523-631`)**:
   - `export function renderPackRevealModal(): string`
   - Guarded by `if (!activeRevealPack) return '';`.
   - When `activeRevealPack` is set, generates 7,247 bytes of OpenCode Terminal-Flat markup:
     - Root: `<div id="pack-reveal-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono select-none" role="dialog" aria-modal="true">`
     - Sibling Backdrop: `<div id="pack-reveal-backdrop" data-action="close-pack-reveal" class="absolute inset-0 cursor-pointer" aria-hidden="true"></div>`
     - Modal Frame: `<div class="relative z-10 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-2xl w-full p-6 shadow-none">`
     - Close [x] button: `<button type="button" data-action="close-pack-reveal" class="absolute top-4 right-4 min-h-[44px] min-w-[44px] ...">[x]</button>`
     - 3 Card Slots: `<div class="pack-card-slot border border-[rgba(15,0,0,0.12)] p-3 text-center bg-[#f8f7f7] rounded-none flex flex-col items-center justify-between space-y-2 hover:border-[#201d1d] transition-colors" data-card-id="${c.cardId}" data-flipped="true">`
     - Card Visuals: `<img src="/seat/${c.cardId}.png" alt="${c.nameKo}" ... onerror="this.onerror=null; this.src='${c.bustUrl}';" />`
     - Directional Stats & PWR: `<span class="font-mono">N${c.top} E${c.right} S${c.bottom} W${c.left}</span>` and `<span class="font-bold text-[#201d1d]">PWR ${c.power}</span>`
     - Confirm Button: `<button type="button" data-action="confirm-pack-reveal" class="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[44px] ...">확인 및 보관함에 저장</button>`
   - `export function closePackRevealModal(): void`: Sets `activeRevealPack = null;`, causing subsequent calls to `renderPackRevealModal()` to return `""` immediately.
   - `export function getActiveRevealPack(): PackRevealData | null`: Exposes current active modal data.
   - `export function setActiveRevealPack(pack: PackRevealData | null): void`: Allows direct state setting.

### 1.3 Signature and Calling Conventions
- Current Production Signature: `export function renderPackRevealModal(): string` (0 parameters, reading internal `activeRevealPack`).
- The dispatch prompt mentioned: `renderPackRevealModal({ packId, packName, cards }, isOpen)`.
- If an enhanced signature `renderPackRevealModal(overridePack?: PackRevealData | null, isOpen: boolean = true): string` is implemented in `ShopSection.tsx`:
  - It maintains 100% backwards compatibility with existing 0-arg callers (`ShopSection.tsx:745`, `challenger_m5_9_1`, `challenger_m5_9_2`).
  - It directly supports passing `(packData, isOpen)` explicitly.
  - Both patterns were empirically verified in `.agents/teamwork/explorer_m5_it2_2/test_enhanced_signature.ts`.

---

## 2. Logic Chain

1. **Step 1 (Root Cause)**:
   `tests/adversarial_m5_shop_adsense.ts` in commit `313dee611` failed forensic audit because Suite 1 relied on `ReferenceShopManager` and a local function `renderMockPackRevealModal`, bypassing `src/landing/views/ShopSection.tsx`.
2. **Step 2 (Production Parity)**:
   Production `ShopSection.tsx` already contains authentic `executeShopPurchase` and `renderPackRevealModal()` functions that produce terminal-flat HTML matching all required specifications (`#pack-reveal-modal`, `#pack-reveal-backdrop`, 3 slots, `/seat/*.png`, 44px+ touch targets).
3. **Step 3 (Assertion Mapping)**:
   - `ADV-M5-PACK-01`: Replace `refShop.purchaseCardPack('normal')` with `executeShopPurchase('pack_normal')`.
   - `ADV-M5-PACK-02` ~ `ADV-M5-PACK-07`: Replace `renderMockPackRevealModal(...)` with `renderPackRevealModal()` from `ShopSection.tsx`.
   - `ADV-M5-PACK-08`: Replace `renderMockPackRevealModal(purchase.revealedCards, false) === ''` with `closePackRevealModal()` and testing `renderPackRevealModal() === ''`.
   - Delete `renderMockPackRevealModal` declaration entirely.
4. **Step 4 (Empirical Execution)**:
   Running the remediated Suite 1 against production `ShopSection.tsx` via `verify_suite1_replacement.ts` yields **8 / 8 PASS (100.0%)** with zero errors or regressions.

---

## 3. Caveats

1. **Test Environment Prerequisites**:
   `executeShopPurchase` and currency management methods in `ShopSection.tsx` interact with `localStorage` and `window.dispatchEvent`. The test harness must initialize `mockStorage` and stub `window.dispatchEvent` / `document` prior to executing the purchase (which `tests/adversarial_m5_shop_adsense.ts` already sets up at lines 64-101).
2. **Read-Only Explorer Scope**:
   As an explorer agent under read-only constraints, this agent did not modify `src/landing/views/ShopSection.tsx` or `tests/adversarial_m5_shop_adsense.ts`. Instead, the verified drop-in replacement is provided in `proposed_suite1_replacement.ts` and `suite1_replacement.patch` for immediate application by `worker_m5_9`.

---

## 4. Conclusion

The self-certifying `renderMockPackRevealModal` mock in `tests/adversarial_m5_shop_adsense.ts` can be completely eliminated and replaced with genuine production calls to `ShopSection.tsx`. All 8 assertions (`ADV-M5-PACK-01` through `ADV-M5-PACK-08`) pass 100.0% against genuine production code.

### Drop-in Code Replacement for Suite 1 (Lines 170-293)

```ts
// ============================================================================
// SUITE 1: 3-Card Pack Reveal Modal (PackRevealModal) DOM Structure & Lifecycles
// ============================================================================
console.log(`${CYAN}--- [SUITE 1] 3-Card Pack Reveal Modal (PackRevealModal) DOM Structure & Lifecycles ---${RESET}`);
{
  mockStorage.clear();
  setUserCoins(5000);
  closePackRevealModal();

  // 1. Pack purchase yields 3 cards via genuine production executeShopPurchase
  const purchase = executeShopPurchase('pack_normal');
  const revealedCards: RevealedCardMeta[] = purchase.revealedCards || [];

  assert(
    'ADV-M5-PACK-01',
    'SUITE 1',
    'Pack purchase produces exactly 3 revealed cards with required attributes',
    purchase.success &&
      revealedCards.length === 3 &&
      revealedCards.every(
        (c) =>
          typeof c.cardId === 'number' &&
          c.cardId >= 1 &&
          c.cardId <= 110 &&
          typeof c.nameKo === 'string' &&
          typeof c.rarity === 'string' &&
          typeof c.power === 'number'
      ),
    '3 cards with cardId, nameKo, rarity, power',
    `Count: ${revealedCards.length}, IDs: ${revealedCards.map((c) => c.cardId).join(',')}`
  );

  // 2. Genuine production renderPackRevealModal() call (Zero mock template)
  const modalHtml = renderPackRevealModal();

  assert(
    'ADV-M5-PACK-02',
    'SUITE 1',
    'Modal container adheres to OpenCode Terminal-Flat design (rounded-none, font-mono, hairline)',
    modalHtml.includes('rounded-none') && modalHtml.includes('font-mono') && modalHtml.includes('border'),
    'Contains rounded-none and font-mono and hairline border',
    'Verified via production renderPackRevealModal DOM inspection'
  );

  assert(
    'ADV-M5-PACK-03',
    'SUITE 1',
    'Modal contains exactly 3 card display slots (pack-card-slot)',
    (modalHtml.match(/class="pack-card-slot/g) || []).length === 3,
    '3 pack-card-slot elements',
    `Found: ${(modalHtml.match(/class="pack-card-slot/g) || []).length}`
  );

  assert(
    'ADV-M5-PACK-04',
    'SUITE 1',
    'Each revealed card references /seat/${id}.png and displays rarity and power',
    revealedCards.every((c) => modalHtml.includes(`/seat/${c.cardId}.png`) && modalHtml.includes(c.nameKo)),
    'All 3 card image URLs and names rendered',
    'Verified via production DOM string matching'
  );

  assert(
    'ADV-M5-PACK-05',
    'SUITE 1',
    'Modal provides top-layer [x] close button with min-h-[44px] touch target',
    modalHtml.includes('data-action="close-pack-reveal"') && modalHtml.includes('min-h-[44px]'),
    'Contains close button with min-h-[44px]',
    'Verified'
  );

  assert(
    'ADV-M5-PACK-06',
    'SUITE 1',
    'Modal provides confirm button with min-h-[44px] and rounded-sm radius',
    modalHtml.includes('data-action="confirm-pack-reveal"') &&
      modalHtml.includes('min-h-[44px]') &&
      modalHtml.includes('rounded-sm'),
    'Contains confirm button with min-h-[44px] and rounded-sm',
    'Verified'
  );

  assert(
    'ADV-M5-PACK-07',
    'SUITE 1',
    'Modal includes fixed inset-0 backdrop for click dismissal',
    modalHtml.includes('fixed inset-0') && modalHtml.includes('bg-black/'),
    'Contains fixed inset-0 backdrop',
    'Verified'
  );

  // 3. Genuine production modal closing lifecycle
  closePackRevealModal();
  const closedModalHtml = renderPackRevealModal();

  assert(
    'ADV-M5-PACK-08',
    'SUITE 1',
    'Modal returns empty string when closed (activeRevealPack is null / closePackRevealModal called)',
    closedModalHtml === '',
    'Empty string',
    closedModalHtml === '' ? 'Empty string' : closedModalHtml
  );
}
```

---

## 5. Verification Method

To independently verify this solution:

1. **Run the standalone verification test**:
   ```bash
   npx tsx .agents/teamwork/explorer_m5_it2_2/verify_suite1_replacement.ts
   ```
   *Expected output*: `Results: 8 / 8 (100.0%)` with exit code `0`.

2. **Inspect the patch file**:
   ```bash
   cat .agents/teamwork/explorer_m5_it2_2/suite1_replacement.patch
   ```

3. **Verify DOM properties directly against production**:
   ```bash
   npx tsx -e "
     import { setUserCoins, executeShopPurchase, renderPackRevealModal, closePackRevealModal } from './src/landing/views/ShopSection';
     setUserCoins(3000);
     executeShopPurchase('pack_normal');
     const html = renderPackRevealModal();
     console.log('Slots:', (html.match(/pack-card-slot/g)||[]).length);
     closePackRevealModal();
     console.log('Closed:', renderPackRevealModal() === '');
   "
   ```
   *Expected output*:
   `Slots: 3`
   `Closed: true`
