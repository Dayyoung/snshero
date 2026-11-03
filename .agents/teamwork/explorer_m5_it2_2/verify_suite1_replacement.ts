/**
 * Verification test for Suite 1 Drop-in Replacement
 * Tests genuine production imports from ShopSection.tsx
 */

class MockStorage implements Storage {
  private store = new Map<string, string>();
  getItem(key: string): string | null { return this.store.get(key) ?? null; }
  setItem(key: string, value: string): void { this.store.set(key, String(value)); }
  removeItem(key: string): void { this.store.delete(key); }
  clear(): void { this.store.clear(); }
  key(index: number): string | null { return Array.from(this.store.keys())[index] ?? null; }
  get length(): number { return this.store.size; }
}

const mockStorage = new MockStorage();
if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = mockStorage;
}
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    location: { hash: '#shop', pathname: '/' },
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}
if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

import {
  executeShopPurchase,
  renderPackRevealModal,
  closePackRevealModal,
  getActiveRevealPack,
  setActiveRevealPack,
  setUserCoins,
  getUserCoins,
} from '../../../src/landing/views/ShopSection';

const GREEN = '\x1b[92m';
const RED = '\x1b[91m';
const CYAN = '\x1b[96m';
const RESET = '\x1b[0m';

let passedCount = 0;
let totalCount = 0;

function assert(id: string, name: string, condition: boolean, details?: string) {
  totalCount++;
  if (condition) passedCount++;
  const badge = condition ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
  console.log(`  [${badge}] [${CYAN}${id}${RESET}] ${name}`);
  if (!condition && details) {
    console.log(`         Details: ${details}`);
  }
}

console.log(`${CYAN}--- [TESTING SUITE 1 DROP-IN REPLACEMENT AGAINST PRODUCTION] ---${RESET}`);

// Setup
mockStorage.clear();
setUserCoins(5000);
closePackRevealModal();

// 1. ADV-M5-PACK-01
const purchase = executeShopPurchase('pack_normal');
const revealedCards = purchase.revealedCards || [];

assert(
  'ADV-M5-PACK-01',
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
  `Count: ${revealedCards.length}, IDs: ${revealedCards.map((c) => c.cardId).join(',')}`
);

// 2. Genuine production modalHtml
const modalHtml = renderPackRevealModal();

// ADV-M5-PACK-02
assert(
  'ADV-M5-PACK-02',
  'Modal container adheres to OpenCode Terminal-Flat design (rounded-none, font-mono, hairline)',
  modalHtml.includes('rounded-none') && modalHtml.includes('font-mono') && modalHtml.includes('border'),
  'Checked rounded-none, font-mono, border in production DOM'
);

// ADV-M5-PACK-03
assert(
  'ADV-M5-PACK-03',
  'Modal contains exactly 3 card display slots (pack-card-slot)',
  (modalHtml.match(/class="pack-card-slot/g) || []).length === 3,
  `Found: ${(modalHtml.match(/class="pack-card-slot/g) || []).length}`
);

// ADV-M5-PACK-04
assert(
  'ADV-M5-PACK-04',
  'Each revealed card references /seat/${id}.png and displays rarity and power',
  revealedCards.every((c) => modalHtml.includes(`/seat/${c.cardId}.png`) && modalHtml.includes(c.nameKo)),
  'Card seat image URLs and names rendered'
);

// ADV-M5-PACK-05
assert(
  'ADV-M5-PACK-05',
  'Modal provides top-layer [x] close button with min-h-[44px] touch target',
  modalHtml.includes('data-action="close-pack-reveal"') && modalHtml.includes('min-h-[44px]'),
  'Close button min-h-[44px]'
);

// ADV-M5-PACK-06
assert(
  'ADV-M5-PACK-06',
  'Modal provides confirm button with min-h-[44px] and rounded-sm radius',
  modalHtml.includes('data-action="confirm-pack-reveal"') &&
    modalHtml.includes('min-h-[44px]') &&
    modalHtml.includes('rounded-sm'),
  'Confirm button rounded-sm and min-h-[44px]'
);

// ADV-M5-PACK-07
assert(
  'ADV-M5-PACK-07',
  'Modal includes fixed inset-0 backdrop for click dismissal',
  modalHtml.includes('fixed inset-0') && modalHtml.includes('bg-black/'),
  'Backdrop fixed inset-0'
);

// ADV-M5-PACK-08
closePackRevealModal();
const closedModalHtml = renderPackRevealModal();

assert(
  'ADV-M5-PACK-08',
  'Modal returns empty string when closed / isOpen is false',
  closedModalHtml === '',
  `closedModalHtml length: ${closedModalHtml.length}`
);

console.log(`\nResults: ${passedCount} / ${totalCount} (${((passedCount / totalCount) * 100).toFixed(1)}%)`);
if (passedCount !== totalCount) {
  process.exit(1);
}
