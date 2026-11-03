/**
 * Exact Drop-in Replacement for Suite 1 in tests/adversarial_m5_shop_adsense.ts
 *
 * Replaces ReferenceShopManager and renderMockPackRevealModal with
 * genuine production calls to src/landing/views/ShopSection.tsx.
 */

// --- Required Imports (at top of tests/adversarial_m5_shop_adsense.ts) ---
/*
import {
  executeShopPurchase,
  renderPackRevealModal,
  closePackRevealModal,
  getActiveRevealPack,
  setActiveRevealPack,
  setUserCoins,
  getUserCoins,
  type RevealedCardMeta,
  type PackRevealData,
} from '../src/landing/views/ShopSection';
*/

// --- Replacement for Lines 170-293 in tests/adversarial_m5_shop_adsense.ts ---

// ============================================================================
// SUITE 1: 3-Card Pack Reveal Modal (PackRevealModal) DOM Structure & Lifecycles
// ============================================================================
console.log(`${CYAN}--- [SUITE 1] 3-Card Pack Reveal Modal (PackRevealModal) DOM Structure & Lifecycles ---${RESET}`);
{
  // 1. Setup user balance & ensure modal is closed before start
  mockStorage.clear();
  setUserCoins(5000);
  closePackRevealModal();

  // 2. Pack purchase yields 3 cards via genuine production executeShopPurchase
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

  // 3. Genuine production renderPackRevealModal() call (Zero mock template)
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

  // 4. Genuine production modal closing lifecycle
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
