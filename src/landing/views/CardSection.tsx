/**
 * src/landing/views/CardSection.tsx
 *
 * Card Collection & 1~100Lv Nurturing System View for SNSHero Static Landing.
 *
 * Requirements:
 *   - Section naming: '카드' (renamed from '미션')
 *   - Collection rate indicator display: 수집율: XX / 110 (XX.X%)
 *   - 110-card comprehensive grid with 3-tier visual assets
 *   - 1~100Lv EXP progression and level-up controls
 *   - Unspent stat points indicator (red dot)
 *   - 4-way stat allocation controls (Top, Right, Bottom, Left)
 *   - Terminal-Flat design, 44px+ touch targets, 0px/4px radii
 * Pure TypeScript template string generator (Zero React runtime).
 */

import { cardNurtureStore } from '../services/cardNurtureStore';
import { getCharacterAsset } from '../services/assetCatalog';
import { CARD_DATABASE } from '../../cardDatabase';

interface CardSectionState {
  selectedCardId: number | null;
  elementFilter: string; // 'all' or faction name
  ownedFilter: 'all' | 'owned' | 'unowned';
}

const localState: CardSectionState = {
  selectedCardId: null,
  elementFilter: 'all',
  ownedFilter: 'all',
};

export function setSelectedCardId(id: number | null): void {
  localState.selectedCardId = id;
}

export function getSelectedCardId(): number | null {
  return localState.selectedCardId;
}

export function setElementFilter(filter: string): void {
  localState.elementFilter = filter;
}

export function setOwnedFilter(filter: 'all' | 'owned' | 'unowned'): void {
  localState.ownedFilter = filter;
}

export function renderCardSection(): string {
  const collection = cardNurtureStore.getCollectionRate();
  const deckTP = cardNurtureStore.getDeckTP();
  const totalTP = cardNurtureStore.getTotalTP();

  // All 110 card IDs
  const allCardIds = Array.from({ length: 110 }, (_, i) => i + 1);

  // Filtered card IDs
  const filteredCardIds = allCardIds.filter((id) => {
    const asset = getCharacterAsset(id);
    const isOwned = cardNurtureStore.isCardOwned(id);

    if (localState.ownedFilter === 'owned' && !isOwned) return false;
    if (localState.ownedFilter === 'unowned' && isOwned) return false;
    if (localState.elementFilter !== 'all' && asset.faction !== localState.elementFilter) return false;

    return true;
  });

  const selectedCard = localState.selectedCardId
    ? cardNurtureStore.cards[localState.selectedCardId]
    : null;
  const selectedAsset = localState.selectedCardId
    ? getCharacterAsset(localState.selectedCardId)
    : null;
  const selectedDbCard = localState.selectedCardId
    ? CARD_DATABASE[localState.selectedCardId]
    : null;

  return `
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 font-mono text-[#201d1d] select-none">
      <!-- Section Header -->
      <section class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 sm:p-8 rounded-none shadow-none space-y-6 mb-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[rgba(15,0,0,0.08)] gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-wider uppercase mb-2">
              <span>카드 도감 및 육성</span>
              <span class="text-stone-400">·</span>
              <span>110종 영웅 컬렉션</span>
            </div>
            <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-[#201d1d] m-0">
              카드 (Card Collection &amp; Nurture)
            </h1>
            <p class="text-xs sm:text-sm text-stone-600 mt-1 m-0">
              110종의 영웅 카드를 수집하고 최대 100레벨까지 육성하세요. 레벨업 시 획득한 스탯 포인트로 4방향 파워를 강화할 수 있습니다.
            </p>
          </div>

          <!-- Collection Rate & TP Summary Box -->
          <div class="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-right min-w-[130px]">
              <div class="text-[10px] text-stone-500 uppercase tracking-wider">카드 수집율</div>
              <div class="text-sm sm:text-base font-bold text-[#201d1d]">
                수집율: ${collection.ownedCount} / 110 (${collection.percentage}%)
              </div>
            </div>
            <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-right min-w-[100px]">
              <div class="text-[10px] text-stone-500 uppercase tracking-wider">덱 파워 (Deck TP)</div>
              <div class="text-sm sm:text-base font-bold text-[#201d1d]">${deckTP} TP</div>
            </div>
            <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-right min-w-[100px]">
              <div class="text-[10px] text-stone-500 uppercase tracking-wider">총 파워 (Total TP)</div>
              <div class="text-sm sm:text-base font-bold text-[#201d1d]">${totalTP} TP</div>
            </div>
          </div>
        </div>

        <!-- Collection Progress Bar -->
        <div class="space-y-1">
          <div class="flex justify-between text-[11px] text-stone-500">
            <span>컬렉션 달성도 (${collection.ownedCount} / 110장 보유)</span>
            <span>${collection.percentage}%</span>
          </div>
          <div class="w-full bg-[#f1eeee] h-2 rounded-sm overflow-hidden">
            <div class="bg-[#201d1d] h-full transition-all duration-300" style="width: ${collection.percentage}%"></div>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
          <!-- Ownership Filter -->
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-xs text-stone-500 mr-1">분류:</span>
            <button
              type="button"
              data-action="filter-card-owned"
              data-filter="all"
              class="px-3 py-1.5 text-xs rounded-sm border min-h-[44px] flex items-center justify-center cursor-pointer ${
                localState.ownedFilter === 'all'
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#f8f7f7] text-stone-700 border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee]'
              }"
            >
              전체 (110)
            </button>
            <button
              type="button"
              data-action="filter-card-owned"
              data-filter="owned"
              class="px-3 py-1.5 text-xs rounded-sm border min-h-[44px] flex items-center justify-center cursor-pointer ${
                localState.ownedFilter === 'owned'
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#f8f7f7] text-stone-700 border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee]'
              }"
            >
              보유 중 (${collection.ownedCount})
            </button>
            <button
              type="button"
              data-action="filter-card-owned"
              data-filter="unowned"
              class="px-3 py-1.5 text-xs rounded-sm border min-h-[44px] flex items-center justify-center cursor-pointer ${
                localState.ownedFilter === 'unowned'
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#f8f7f7] text-stone-700 border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee]'
              }"
            >
              미보유 (${110 - collection.ownedCount})
            </button>
          </div>

          <!-- Element Faction Filter -->
          <div class="flex flex-wrap items-center gap-1">
            <span class="text-xs text-stone-500 mr-1">속성:</span>
            ${[
              { key: 'all', name: '전체' },
              { key: 'water', name: '물' },
              { key: 'fire', name: '불' },
              { key: 'wind', name: '바람' },
              { key: 'earth', name: '땅' },
              { key: 'human', name: '휴먼' },
              { key: 'undead', name: '언데드' },
              { key: 'elf', name: '엘프' },
              { key: 'dwarf', name: '드워프' },
              { key: 'monster', name: '마수' },
              { key: 'robot', name: '로봇' },
              { key: 'dragon', name: '드래곤' },
            ].map((f) => `
              <button
                type="button"
                data-action="filter-card-element"
                data-element="${f.key}"
                class="px-2 py-1 text-[11px] rounded-sm border min-h-[44px] flex items-center justify-center cursor-pointer ${
                  localState.elementFilter === f.key
                    ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                    : 'bg-[#f8f7f7] text-stone-600 border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee]'
                }"
              >
                ${f.name}
              </button>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Selected Card Nurture & Stat Allocation Panel (if selected) -->
      ${selectedCard && selectedAsset ? `
        <section class="border-2 border-[#201d1d] bg-[#fdfcfc] p-6 sm:p-8 rounded-none shadow-none space-y-6 mb-8">
          <div class="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 pb-6 border-b border-[rgba(15,0,0,0.12)]">
            <div class="flex flex-col sm:flex-row items-center gap-6">
              <!-- Card Portrait -->
              <div class="relative w-36 h-48 sm:w-44 sm:h-56 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] flex items-center justify-center overflow-hidden">
                <img
                  src="${selectedAsset.bustPngUrl}"
                  alt="${selectedAsset.nameKo}"
                  class="max-w-full max-h-full object-contain"
                  onerror="this.src='${selectedAsset.seatUrl}'; this.onerror=null;"
                />
                ${cardNurtureStore.hasUnspentPoints(selectedCard.cardId) ? `
                  <span class="absolute top-2 right-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-sm shadow-none">
                    스탯 UP!
                  </span>
                ` : ''}
              </div>

              <!-- Card Details & EXP Progression -->
              <div class="space-y-3 text-center sm:text-left">
                <div class="inline-flex items-center gap-2">
                  <span class="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm">
                    ${selectedAsset.code}
                  </span>
                  <span class="px-2 py-0.5 bg-[#f1eeee] text-[#201d1d] text-[10px] font-bold rounded-sm uppercase">
                    ${selectedAsset.faction} · ${selectedAsset.rarity}
                  </span>
                </div>
                <h2 class="text-xl sm:text-2xl font-bold text-[#201d1d] m-0">
                  ${selectedAsset.nameKo} (${selectedAsset.nameEn})
                </h2>
                <div class="text-xs text-stone-600">
                  현재 레벨: <strong class="text-sm text-[#201d1d]">Lv.${selectedCard.level} / 100</strong>
                </div>

                <!-- EXP Progress Bar -->
                <div class="w-full sm:w-64 space-y-1">
                  <div class="flex justify-between text-[10px] text-stone-500">
                    <span>경험치 (EXP)</span>
                    <span>${selectedCard.exp} / ${selectedCard.expToNext}</span>
                  </div>
                  <div class="w-full bg-[#f1eeee] h-2 rounded-sm overflow-hidden">
                    <div
                      class="bg-emerald-600 h-full transition-all duration-300"
                      style="width: ${selectedCard.level >= 100 ? 100 : Math.min(100, Math.floor((selectedCard.exp / selectedCard.expToNext) * 100))}%"
                    ></div>
                  </div>
                </div>

                <!-- Nurture Buttons -->
                <div class="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button
                    type="button"
                    data-action="nurture-card"
                    data-card-id="${selectedCard.cardId}"
                    data-exp="50"
                    ${selectedCard.level >= 100 ? 'disabled' : ''}
                    class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center cursor-pointer ${
                      selectedCard.level >= 100 ? 'opacity-50 cursor-not-allowed' : ''
                    }"
                  >
                    ${selectedCard.level >= 100 ? '최대 레벨 도달 (Lv.100 MAX)' : '카드 육성하기 (+50 EXP)'}
                  </button>
                  <button
                    type="button"
                    data-action="nurture-card"
                    data-card-id="${selectedCard.cardId}"
                    data-exp="500"
                    ${selectedCard.level >= 100 ? 'disabled' : ''}
                    class="px-4 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-semibold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] flex items-center justify-center cursor-pointer ${
                      selectedCard.level >= 100 ? 'opacity-50 cursor-not-allowed' : ''
                    }"
                  >
                    10회 연속 육성 (+500 EXP)
                  </button>
                </div>
              </div>
            </div>

            <!-- Close Inspector Button -->
            <button
              type="button"
              data-action="close-card-inspector"
              class="p-2 text-stone-500 hover:text-[#201d1d] min-h-[44px] min-w-[44px] flex items-center justify-center text-sm font-bold border border-[rgba(15,0,0,0.12)] rounded-sm cursor-pointer"
              aria-label="인스펙터 닫기"
            >
              [X] 닫기
            </button>
          </div>

          <!-- 4-Way Directional Stat Enhancement Matrix -->
          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[rgba(15,0,0,0.08)]">
              <div>
                <span class="text-[11px] text-stone-500 uppercase tracking-wider">4방향 스탯 인핸스먼트</span>
                <h3 class="text-base font-bold text-[#201d1d] m-0">방향별 능력치 배분</h3>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-stone-600">미분배 스탯 포인트:</span>
                <span class="px-2.5 py-1 ${
                  selectedCard.statPoints > 0 ? 'bg-red-600 text-white' : 'bg-[#f1eeee] text-[#201d1d]'
                } text-xs font-bold rounded-sm">
                  ${selectedCard.statPoints} P
                </span>
              </div>
            </div>

            ${selectedCard.statPoints > 0 ? `
              <div class="p-3 bg-[#fff7ed] border border-amber-300 rounded-none text-xs text-amber-800">
                [!] 보유 중인 스탯 포인트(${selectedCard.statPoints}P)가 있습니다. 원하는 방향의 [+] 버튼을 눌러 스탯을 강화하세요.
              </div>
            ` : ''}

            <!-- 4-Way Grid Layout -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Top (N) Stat -->
              <div class="p-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">상단 (Top / N)</span>
                  <span class="text-xs font-semibold text-emerald-700">+${selectedCard.bonusStats.top} 보너스</span>
                </div>
                <div class="text-xl font-bold text-[#201d1d]">
                  ${(selectedDbCard?.top || 0) + selectedCard.bonusStats.top}
                  <span class="text-xs text-stone-500 font-normal">(기본 ${selectedDbCard?.top || 0})</span>
                </div>
                <button
                  type="button"
                  data-action="allocate-stat"
                  data-card-id="${selectedCard.cardId}"
                  data-direction="top"
                  ${selectedCard.statPoints <= 0 ? 'disabled' : ''}
                  class="w-full py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center cursor-pointer ${
                    selectedCard.statPoints <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                  }"
                >
                  + 상단(N) 강화
                </button>
              </div>

              <!-- Right (E) Stat -->
              <div class="p-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">우측 (Right / E)</span>
                  <span class="text-xs font-semibold text-emerald-700">+${selectedCard.bonusStats.right} 보너스</span>
                </div>
                <div class="text-xl font-bold text-[#201d1d]">
                  ${(selectedDbCard?.right || 0) + selectedCard.bonusStats.right}
                  <span class="text-xs text-stone-500 font-normal">(기본 ${selectedDbCard?.right || 0})</span>
                </div>
                <button
                  type="button"
                  data-action="allocate-stat"
                  data-card-id="${selectedCard.cardId}"
                  data-direction="right"
                  ${selectedCard.statPoints <= 0 ? 'disabled' : ''}
                  class="w-full py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center cursor-pointer ${
                    selectedCard.statPoints <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                  }"
                >
                  + 우측(E) 강화
                </button>
              </div>

              <!-- Bottom (S) Stat -->
              <div class="p-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">하단 (Bottom / S)</span>
                  <span class="text-xs font-semibold text-emerald-700">+${selectedCard.bonusStats.bottom} 보너스</span>
                </div>
                <div class="text-xl font-bold text-[#201d1d]">
                  ${(selectedDbCard?.bottom || 0) + selectedCard.bonusStats.bottom}
                  <span class="text-xs text-stone-500 font-normal">(기본 ${selectedDbCard?.bottom || 0})</span>
                </div>
                <button
                  type="button"
                  data-action="allocate-stat"
                  data-card-id="${selectedCard.cardId}"
                  data-direction="bottom"
                  ${selectedCard.statPoints <= 0 ? 'disabled' : ''}
                  class="w-full py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center cursor-pointer ${
                    selectedCard.statPoints <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                  }"
                >
                  + 하단(S) 강화
                </button>
              </div>

              <!-- Left (W) Stat -->
              <div class="p-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-[#201d1d]">좌측 (Left / W)</span>
                  <span class="text-xs font-semibold text-emerald-700">+${selectedCard.bonusStats.left} 보너스</span>
                </div>
                <div class="text-xl font-bold text-[#201d1d]">
                  ${(selectedDbCard?.left || 0) + selectedCard.bonusStats.left}
                  <span class="text-xs text-stone-500 font-normal">(기본 ${selectedDbCard?.left || 0})</span>
                </div>
                <button
                  type="button"
                  data-action="allocate-stat"
                  data-card-id="${selectedCard.cardId}"
                  data-direction="left"
                  ${selectedCard.statPoints <= 0 ? 'disabled' : ''}
                  class="w-full py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center cursor-pointer ${
                    selectedCard.statPoints <= 0 ? 'opacity-40 cursor-not-allowed' : ''
                  }"
                >
                  + 좌측(W) 강화
                </button>
              </div>
            </div>
          </div>
        </section>
      ` : ''}

      <!-- 110 Card Comprehensive Grid -->
      <section class="space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-[rgba(15,0,0,0.08)]">
          <span class="text-xs font-bold text-[#201d1d] uppercase">
            전체 카드 목록 (${filteredCardIds.length} / 110)
          </span>
          <span class="text-xs text-stone-500">
            카드를 클릭하여 상세 정보 확인 및 육성을 진행하세요.
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          ${filteredCardIds.map((id) => {
            const asset = getCharacterAsset(id);
            const cardData = cardNurtureStore.cards[id] || {
              cardId: id,
              level: 1,
              exp: 0,
              expToNext: 100,
              statPoints: 0,
              bonusStats: { top: 0, right: 0, bottom: 0, left: 0 },
              totalBonus: 0,
            };
            const isOwned = cardNurtureStore.isCardOwned(id);
            const hasPoints = cardNurtureStore.hasUnspentPoints(id);
            const isSelected = localState.selectedCardId === id;

            return `
              <div
                data-action="select-card"
                data-card-id="${id}"
                class="group relative border ${
                  isSelected
                    ? 'border-2 border-[#201d1d] bg-[#f8f7f7]'
                    : isOwned
                    ? 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:border-[#201d1d]'
                    : 'border-dashed border-stone-300 bg-[#faf9f9] opacity-70 hover:opacity-90'
                } p-3 rounded-none flex flex-col justify-between space-y-2 cursor-pointer transition-colors"
                role="button"
                tabindex="0"
                aria-label="${asset.nameKo} 카드 선택"
              >
                <!-- Top Row: Card ID, Faction Badge & Red Dot Indicator -->
                <div class="flex items-center justify-between text-[10px]">
                  <span class="font-bold text-stone-500">${asset.code}</span>
                  <div class="flex items-center gap-1.5">
                    ${hasPoints ? `
                      <span
                        class="inline-block w-2.5 h-2.5 rounded-full bg-red-600"
                        title="미분배 스탯 포인트 있음"
                      ></span>
                    ` : ''}
                    <span class="px-1.5 py-0.5 ${isOwned ? 'bg-[#201d1d] text-[#fdfcfc]' : 'bg-stone-300 text-stone-700'} font-semibold rounded-sm">
                      ${isOwned ? `Lv.${cardData.level}` : '미보유'}
                    </span>
                  </div>
                </div>

                <!-- Card Thumbnail Image -->
                <div class="w-full h-28 sm:h-32 bg-[#f1eeee] flex items-center justify-center overflow-hidden rounded-none p-1">
                  <img
                    src="${asset.sdUrl}"
                    alt="${asset.nameKo}"
                    class="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                    onerror="this.src='${asset.seatUrl}'; this.onerror=null;"
                  />
                </div>

                <!-- Card Info -->
                <div class="space-y-1">
                  <div class="text-xs font-bold text-[#201d1d] truncate" title="${asset.nameKo} (${asset.nameEn})">
                    ${asset.nameKo}
                  </div>
                  <div class="flex items-center justify-between text-[10px] text-stone-500">
                    <span class="capitalize">${asset.faction}</span>
                    <span class="uppercase">${asset.rarity}</span>
                  </div>
                </div>

                <!-- Mini EXP bar (if owned) -->
                ${isOwned ? `
                  <div class="w-full bg-[#f1eeee] h-1.5 rounded-sm overflow-hidden">
                    <div
                      class="bg-emerald-600 h-full"
                      style="width: ${cardData.level >= 100 ? 100 : Math.min(100, Math.floor((cardData.exp / cardData.expToNext) * 100))}%"
                    ></div>
                  </div>
                ` : `
                  <div class="text-[10px] text-stone-400 text-center py-0.5">
                    상점 획득 가능
                  </div>
                `}
              </div>
            `;
          }).join('')}
        </div>
      </section>
    </div>
  `;
}
