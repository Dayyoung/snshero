/**
 * src/landing/views/CardSection.tsx
 *
 * Card Collection & 1~100Lv Nurturing System View for SNSHero Static Landing.
 *
 * Requirements:
 *   - Section naming: '카드'
 *   - Collection rate indicator display: 수집율: XX / 110 (XX.X%)
 *   - 110-card comprehensive grid with Authentic Original TCG Card Design (https://snshero.com/play)
 *   - Modal Popup for Card Deep Inspection & Stat Allocation on Mobile & Desktop
 *   - 1~100Lv EXP progression and level-up controls
 *   - Unspent stat points indicator (red dot)
 *   - 4-way stat allocation controls (Top, Right, Bottom, Left)
 *   - Terminal-Flat design, 44px+ touch targets, 0px/4px radii
 * Pure TypeScript template string generator (Zero React runtime).
 */

import { cardNurtureStore } from '../services/cardNurtureStore';
import { getCharacterAsset } from '../services/assetCatalog';
import { CARD_DATABASE } from '../../cardDatabase';
import { renderOriginalCardHtml } from '../components/OriginalCardHtml';

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
  const isSelectedCardOwned = localState.selectedCardId
    ? cardNurtureStore.isCardOwned(localState.selectedCardId)
    : false;

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
              보유 (${collection.ownedCount})
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

          <!-- Element Filter Pills -->
          <div class="flex flex-wrap items-center gap-1">
            <button
              type="button"
              data-action="filter-card-element"
              data-element="all"
              class="px-2 py-1 text-[11px] rounded-sm border min-h-[44px] flex items-center justify-center cursor-pointer ${
                localState.elementFilter === 'all'
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                  : 'bg-[#f8f7f7] text-stone-600 border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee]'
              }"
            >
              전체 속성
            </button>
            ${[
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

      <!-- 110 Card Comprehensive Grid (Original TCG Card Design) -->
      <section class="space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-[rgba(15,0,0,0.08)]">
          <span class="text-xs font-bold text-[#201d1d] uppercase">
            전체 카드 목록 (${filteredCardIds.length} / 110)
          </span>
          <span class="text-xs text-stone-500">
            카드를 클릭하여 상세 정보 확인 및 팝업 모달에서 육성을 진행하세요.
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          ${filteredCardIds.map((id) => {
            const isOwned = cardNurtureStore.isCardOwned(id);
            const hasPoints = cardNurtureStore.hasUnspentPoints(id);
            const isSelected = localState.selectedCardId === id;

            return renderOriginalCardHtml(id, {
              action: 'select-card',
              isSelected,
              isOwned,
              showRedDot: hasPoints,
            });
          }).join('')}
        </div>
      </section>

      <!-- Selected Card Nurture & Stat Allocation Modal Popup (True Modal for Mobile & Desktop) -->
      ${selectedCard && selectedAsset ? `
        <div
          id="card-nurture-modal-root"
          class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-mono select-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-nurture-modal-title"
        >
          <!-- Dedicated Backdrop Overlay -->
          <div
            id="card-nurture-modal-backdrop"
            data-action="close-card-inspector"
            class="fixed inset-0 bg-black/75 backdrop-blur-xs cursor-pointer transition-opacity"
            aria-hidden="true"
          ></div>

          <!-- Modal Dialog Content Box -->
          <div class="relative z-10 w-full max-w-2xl bg-[#fdfcfc] border-2 border-[#201d1d] shadow-2xl rounded-none flex flex-col max-h-[92dvh] overflow-hidden text-[#201d1d]">
            <!-- Header -->
            <div class="flex items-center justify-between p-4 sm:p-5 border-b border-[rgba(15,0,0,0.12)] bg-[#f8f7f7]">
              <div>
                <span class="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm bg-[#201d1d] text-[#fdfcfc] mb-1">
                  ${selectedAsset.code} · ${selectedAsset.faction} · ${selectedAsset.rarity}
                </span>
                <h3 id="card-nurture-modal-title" class="text-base sm:text-lg font-black text-[#201d1d] m-0">
                  ${selectedAsset.nameKo} (${selectedAsset.nameEn})
                </h3>
              </div>
              <button
                type="button"
                data-action="close-card-inspector"
                class="px-3 py-2 bg-[#201d1d] text-[#fdfcfc] hover:opacity-90 text-xs font-bold rounded-sm min-h-[44px] min-w-[44px] inline-flex items-center justify-center cursor-pointer"
                aria-label="닫기"
              >
                ✕ 닫기
              </button>
            </div>

            <!-- Scrollable Body -->
            <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              <!-- Top Row: Original Card Preview & Level/EXP -->
              <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <!-- Original Card Preview Component -->
                <div class="w-44 sm:w-52 shrink-0">
                  ${renderOriginalCardHtml(selectedCard.cardId, {
                    isOwned: isSelectedCardOwned,
                    level: isSelectedCardOwned ? selectedCard.level : 1,
                    bonusStats: isSelectedCardOwned ? selectedCard.bonusStats : { top: 0, right: 0, bottom: 0, left: 0 },
                    hideStats: false,
                  })}
                </div>

                <!-- Info, Level & EXP Progression -->
                <div class="flex-1 space-y-3 w-full">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 ${
                      isSelectedCardOwned
                        ? 'bg-emerald-700 text-[#fdfcfc]'
                        : 'bg-stone-300 text-stone-700'
                    } text-xs font-bold rounded-sm">
                      ${isSelectedCardOwned ? '[보유 카드]' : '[미보유 카드]'}
                    </span>
                    <span class="text-xs text-stone-600 font-bold">
                      ${isSelectedCardOwned ? `성장 레벨: Lv.${selectedCard.level} / 100` : '상태: 미보유 (Lv.1)'}
                    </span>
                  </div>

                  ${isSelectedCardOwned ? `
                    <!-- EXP Progress Bar (Owned) -->
                    <div class="space-y-1">
                      <div class="flex justify-between text-xs text-stone-500">
                        <span>경험치 (EXP)</span>
                        <span>${selectedCard.exp} / ${selectedCard.expToNext}</span>
                      </div>
                      <div class="w-full bg-[#f1eeee] h-2.5 rounded-sm overflow-hidden">
                        <div
                          class="bg-emerald-600 h-full transition-all duration-300"
                          style="width: ${selectedCard.level >= 100 ? 100 : Math.min(100, Math.floor((selectedCard.exp / selectedCard.expToNext) * 100))}%"
                        ></div>
                      </div>
                    </div>

                    <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-xs text-stone-600">
                      <span class="text-emerald-700 font-bold">[EXP 획득 가이드]</span> 배틀 승리 시 덱 출격 카드 5장에 자동 지급됩니다 (+50 EXP).
                    </div>
                  ` : `
                    <!-- Unowned Notice -->
                    <div class="p-3 bg-[#f8f7f7] border border-dashed border-stone-300 rounded-none text-xs text-stone-600 space-y-2">
                      <div class="font-bold text-[#201d1d]">🔒 미보유 카드 (육성 잠김)</div>
                      <p class="m-0 leading-relaxed">상점에서 카드 팩을 구매하여 영웅을 영입하세요. 획득 후 레벨업 및 스탯 분배가 가능합니다.</p>
                      <a
                        href="#shop"
                        data-nav="shop"
                        class="inline-flex items-center justify-center px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 no-underline min-h-[44px] cursor-pointer"
                      >
                        상점 바로가기 ➔
                      </a>
                    </div>
                  `}
                </div>
              </div>

              <!-- 4-Way Stat Enhancement Grid -->
              <div class="space-y-3 pt-2 border-t border-[rgba(15,0,0,0.08)]">
                <div class="flex items-center justify-between">
                  <h4 class="text-sm font-bold text-[#201d1d] m-0">4방향 스탯 인핸스먼트</h4>
                  <div class="text-xs">
                    <span class="text-stone-600">미분배 스탯:</span>
                    <strong class="${isSelectedCardOwned && selectedCard.statPoints > 0 ? 'text-red-600 font-bold' : 'text-[#201d1d]'} ml-1">
                      ${isSelectedCardOwned ? `${selectedCard.statPoints} pt` : '0 pt'}
                    </strong>
                  </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  ${[
                    { dir: 'top', label: '북 (N)', base: selectedDbCard?.top || 0, bonus: isSelectedCardOwned ? selectedCard.bonusStats.top : 0 },
                    { dir: 'right', label: '동 (E)', base: selectedDbCard?.right || 0, bonus: isSelectedCardOwned ? selectedCard.bonusStats.right : 0 },
                    { dir: 'bottom', label: '남 (S)', base: selectedDbCard?.bottom || 0, bonus: isSelectedCardOwned ? selectedCard.bonusStats.bottom : 0 },
                    { dir: 'left', label: '서 (W)', base: selectedDbCard?.left || 0, bonus: isSelectedCardOwned ? selectedCard.bonusStats.left : 0 },
                  ].map((s) => `
                    <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-2 text-center">
                      <div class="text-[11px] font-bold text-stone-500 uppercase">${s.label}</div>
                      <div class="text-lg font-black text-[#201d1d]">
                        ${s.base + s.bonus}
                        <span class="text-[10px] text-stone-400 font-normal">(${s.base}+${s.bonus})</span>
                      </div>
                      ${isSelectedCardOwned ? `
                        <button
                          type="button"
                          data-action="allocate-stat"
                          data-card-id="${selectedCard.cardId}"
                          data-direction="${s.dir}"
                          ${selectedCard.statPoints <= 0 ? 'disabled' : ''}
                          class="w-full py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 min-h-[44px] flex items-center justify-center cursor-pointer ${
                            selectedCard.statPoints <= 0 ? 'opacity-30 cursor-not-allowed' : ''
                          }"
                        >
                          + 스탯 강화
                        </button>
                      ` : `
                        <div class="py-2 text-[10px] text-stone-400 font-medium">미보유</div>
                      `}
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="p-4 border-t border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] flex items-center justify-end">
              <button
                type="button"
                data-action="close-card-inspector"
                class="px-5 py-2.5 bg-[#201d1d] text-[#fdfcfc] hover:opacity-90 text-xs font-bold rounded-sm min-h-[44px] cursor-pointer"
              >
                확인 (CLOSE)
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}
