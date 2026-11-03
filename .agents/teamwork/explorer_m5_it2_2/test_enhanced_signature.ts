/**
 * Verification test for Enhanced Signature:
 * renderPackRevealModal(overridePack?: PackRevealData | null, isOpen: boolean = true)
 */

interface MockPackRevealData {
  packId: string;
  packName: string;
  cards: Array<{
    cardId: number;
    nameKo: string;
    nameEn: string;
    rarity: 'Bronze' | 'Silver' | 'Gold' | 'Boss';
    faction: string;
    power: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
    bustUrl: string;
    seatUrl: string;
    isNew: boolean;
  }>;
}

let activeRevealPack: MockPackRevealData | null = null;

function renderPackRevealModal(
  overridePack?: MockPackRevealData | null,
  isOpen: boolean = true
): string {
  if (isOpen === false) return '';
  const pack = overridePack !== undefined ? overridePack : activeRevealPack;
  if (!pack) return '';

  const { packName, cards } = pack;
  return `
    <div id="pack-reveal-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono select-none" role="dialog" aria-modal="true">
      <div id="pack-reveal-backdrop" data-action="close-pack-reveal" class="absolute inset-0 cursor-pointer" aria-hidden="true"></div>
      <div class="relative z-10 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-2xl w-full p-6 shadow-none">
        <button type="button" data-action="close-pack-reveal" class="absolute top-4 right-4 min-h-[44px] min-w-[44px] text-stone-500 font-bold hover:text-stone-900 cursor-pointer flex items-center justify-center text-sm" aria-label="닫기">[x]</button>
        <div class="mb-4">
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm">카드팩 오픈</span>
          <h2 class="text-lg sm:text-xl font-bold m-0 mt-1">${packName} 획득 영웅 카드 (3장)</h2>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          ${cards.map(c => `
            <div class="pack-card-slot border border-[rgba(15,0,0,0.12)] p-3 text-center bg-[#f8f7f7] rounded-none flex flex-col items-center justify-between space-y-2 hover:border-[#201d1d] transition-colors" data-card-id="${c.cardId}" data-flipped="true">
              <img src="/seat/${c.cardId}.png" alt="${c.nameKo}" class="w-20 h-24 mx-auto object-cover border border-stone-300 rounded-none bg-stone-100" />
              <div class="text-xs font-bold text-[#201d1d]">[NO.${String(c.cardId).padStart(3, '0')}] ${c.nameKo}</div>
              <div class="text-[10px] text-stone-500">${c.rarity} · PWR ${c.power}</div>
            </div>
          `).join('')}
        </div>
        <div class="flex justify-end pt-2 border-t border-[rgba(15,0,0,0.08)]">
          <button type="button" data-action="confirm-pack-reveal" class="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[44px] hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center shadow-none">확인 및 보관함에 저장</button>
        </div>
      </div>
    </div>
  `;
}

const samplePack: MockPackRevealData = {
  packId: 'pack_normal',
  packName: '일반 카드팩',
  cards: [
    { cardId: 1, nameKo: '아서', nameEn: 'Arthur', rarity: 'Bronze', faction: 'water', power: 12, top: 3, right: 3, bottom: 3, left: 3, bustUrl: '', seatUrl: '/seat/1.png', isNew: true },
    { cardId: 2, nameKo: '란슬롯', nameEn: 'Lancelot', rarity: 'Silver', faction: 'fire', power: 16, top: 4, right: 4, bottom: 4, left: 4, bustUrl: '', seatUrl: '/seat/2.png', isNew: false },
    { cardId: 3, nameKo: '가웨인', nameEn: 'Gawain', rarity: 'Gold', faction: 'earth', power: 20, top: 5, right: 5, bottom: 5, left: 5, bustUrl: '', seatUrl: '/seat/3.png', isNew: true },
  ],
};

// Case 1: Parameterized call with isOpen = true
const html1 = renderPackRevealModal(samplePack, true);
console.log('Case 1 (samplePack, true): length =', html1.length, 'has slots =', (html1.match(/class="pack-card-slot/g) || []).length);

// Case 2: Parameterized call with isOpen = false
const html2 = renderPackRevealModal(samplePack, false);
console.log('Case 2 (samplePack, false): length =', html2.length, 'equals empty =', html2 === '');

// Case 3: Stateful call with 0 args (activeRevealPack set)
activeRevealPack = samplePack;
const html3 = renderPackRevealModal();
console.log('Case 3 (0 args, active): length =', html3.length, 'equals html1 =', html3 === html1);

// Case 4: Stateful call with 0 args after close
activeRevealPack = null;
const html4 = renderPackRevealModal();
console.log('Case 4 (0 args, closed): length =', html4.length, 'equals empty =', html4 === '');
