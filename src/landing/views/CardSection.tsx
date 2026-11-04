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
import { tr } from '../services/i18n';

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
      <!-- Compact Section Header & Select Box Filters -->
      <section class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-3.5 sm:p-5 rounded-none shadow-none mb-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 class="text-lg sm:text-2xl font-black text-[#201d1d] m-0 leading-tight">
              ${tr('카드 (Card Collection &amp; Nurture)', 'Cards (Card Collection &amp; Nurture)', 'カード (Card Collection &amp; Nurture)')}
            </h1>
            <p class="text-[11px] sm:text-xs text-stone-500 mt-0.5 m-0">
              ${tr(
                '카드를 터치하여 상세 확인 및 스탯 강화를 진행하세요.',
                'Tap any card to inspect details and allocate stat points.',
                'カードをタップして詳細確認およびステータス強化を行えます。'
              )}
            </p>
          </div>

          <!-- Compact Select Box Filters (1 Row on Mobile & Desktop) -->
          <div class="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
            <!-- Ownership Filter Select -->
            <label class="flex items-center gap-1.5 text-xs text-stone-600">
              <span class="sr-only">${tr('분류', 'Filter', '分類')}</span>
              <select
                data-action="filter-card-owned-select"
                aria-label="${tr('보유 여부 필터', 'Ownership Filter', '保有フィルター')}"
                class="w-full sm:w-auto px-2.5 py-2 text-xs font-bold rounded-sm border border-[rgba(15,0,0,0.18)] bg-[#f8f7f7] text-[#201d1d] min-h-[40px] cursor-pointer focus:outline-none focus:border-[#201d1d]"
              >
                <option value="all" ${localState.ownedFilter === 'all' ? 'selected' : ''}>
                  ${tr('분류: 전체', 'Filter: All', '分類: すべて')} (110)
                </option>
                <option value="owned" ${localState.ownedFilter === 'owned' ? 'selected' : ''}>
                  ${tr('분류: 보유', 'Filter: Owned', '分類: 保有')} (${collection.ownedCount})
                </option>
                <option value="unowned" ${localState.ownedFilter === 'unowned' ? 'selected' : ''}>
                  ${tr('분류: 미보유', 'Filter: Unowned', '分類: 未保有')} (${110 - collection.ownedCount})
                </option>
              </select>
            </label>

            <!-- Element Filter Select -->
            <label class="flex items-center gap-1.5 text-xs text-stone-600">
              <span class="sr-only">${tr('속성', 'Element', '属性')}</span>
              <select
                data-action="filter-card-element-select"
                aria-label="${tr('속성 필터', 'Element Filter', '属性フィルター')}"
                class="w-full sm:w-auto px-2.5 py-2 text-xs font-bold rounded-sm border border-[rgba(15,0,0,0.18)] bg-[#f8f7f7] text-[#201d1d] min-h-[40px] cursor-pointer focus:outline-none focus:border-[#201d1d]"
              >
                <option value="all" ${localState.elementFilter === 'all' ? 'selected' : ''}>
                  ${tr('속성: 전체 속성', 'Element: All', '属性: 全属性')}
                </option>
                ${[
                  { key: 'water', name: tr('물', 'Water', '水') },
                  { key: 'fire', name: tr('불', 'Fire', '火') },
                  { key: 'wind', name: tr('바람', 'Wind', '風') },
                  { key: 'earth', name: tr('땅', 'Earth', '地') },
                  { key: 'human', name: tr('휴먼', 'Human', '人間') },
                  { key: 'undead', name: tr('언데드', 'Undead', 'アンデッド') },
                  { key: 'elf', name: tr('엘프', 'Elf', 'エルフ') },
                  { key: 'dwarf', name: tr('드워프', 'Dwarf', 'ドワーフ') },
                  { key: 'monster', name: tr('마수', 'Monster', '魔獣') },
                  { key: 'robot', name: tr('로봇', 'Robot', 'ロボット') },
                  { key: 'dragon', name: tr('드래곤', 'Dragon', 'ドラゴン') },
                ].map((f) => `
                  <option value="${f.key}" ${localState.elementFilter === f.key ? 'selected' : ''}>
                    ${tr('속성:', 'Element:', '属性:')} ${f.name}
                  </option>
                `).join('')}
              </select>
            </label>
          </div>
        </div>
      </section>

      <!-- 110 Card Comprehensive Grid (Original TCG Card Design) -->
      <section class="space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-[rgba(15,0,0,0.08)]">
          <span class="text-xs font-bold text-[#201d1d] uppercase">
            ${tr('전체 카드 목록', 'All Cards', '全カード一覧')} (${filteredCardIds.length} / 110)
          </span>
          <span class="text-xs text-stone-500">
            ${tr(
              '카드를 클릭하여 상세 정보 확인 및 팝업 모달에서 육성을 진행하세요.',
              'Click any card to inspect details and allocate stat points.',
              'カードをクリックして詳細確認およびステータス強化を行えます。'
            )}
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
                aria-label="${tr('닫기', 'Close', '閉じる')}"
              >
                ✕ ${tr('닫기', 'Close', '閉じる')}
              </button>
            </div>

            <!-- Scrollable Body -->
            <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              <!-- Top Row: Original Card Preview & Level/EXP -->
              <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <!-- Original Card Preview Component (7-Head Full-Body in Card Detail Modal) -->
                <div class="w-44 sm:w-52 shrink-0">
                  ${renderOriginalCardHtml(selectedCard.cardId, {
                    isOwned: isSelectedCardOwned,
                    level: isSelectedCardOwned ? selectedCard.level : 1,
                    bonusStats: isSelectedCardOwned ? selectedCard.bonusStats : { top: 0, right: 0, bottom: 0, left: 0 },
                    hideStats: false,
                    visualTier: '7head',
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
                      ${isSelectedCardOwned ? tr('[보유 카드]', '[OWNED]', '[保有カード]') : tr('[미보유 카드]', '[UNOWNED]', '[未保有カード]')}
                    </span>
                    <span class="text-xs text-stone-600 font-bold">
                      ${isSelectedCardOwned ? `${tr('성장 레벨:', 'Growth Level:', '成長レベル:')} Lv.${selectedCard.level} / 100` : tr('상태: 미보유 (Lv.1)', 'Status: Unowned (Lv.1)', '状態: 未保有 (Lv.1)')}
                    </span>
                  </div>

                  ${isSelectedCardOwned ? `
                    <!-- EXP Progress Bar (Owned) -->
                    <div class="space-y-1">
                      <div class="flex justify-between text-xs text-stone-500">
                        <span>${tr('경험치 (EXP)', 'Experience (EXP)', '経験値 (EXP)')}</span>
                        <span>${selectedCard.exp} / ${selectedCard.expToNext}</span>
                      </div>
                      <div class="w-full bg-[#f1eeee] h-2.5 rounded-sm overflow-hidden">
                        <div
                          class="bg-emerald-600 h-full transition-all duration-300"
                          style="width: ${selectedCard.level >= 100 ? 100 : Math.min(100, Math.floor((selectedCard.exp / selectedCard.expToNext) * 100))}%"
                        ></div>
                      </div>
                    </div>

                    <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-xs text-stone-600 space-y-2.5">
                      <div>
                        <span class="text-emerald-700 font-bold">${tr('[EXP 획득 가이드]', '[EXP Guide]', '[EXP獲得ガイド]')}</span> ${tr(
                          '배틀 승리 시 덱 출격 카드 5장에 자동 지급(+50 EXP)되거나, 상점에서 구매한 EXP 영약(+500 EXP)을 즉시 투여할 수 있습니다.',
                          'Earned automatically (+50 EXP) upon battle victory, or use an EXP Elixir (+500 EXP) purchased from the Shop.',
                          'バトル勝利時に自動支給(+50 EXP)されるほか、ショップで購入したEXP霊薬(+500 EXP)を即時投与できます。'
                        )}
                      </div>
                      <div class="flex items-center justify-between gap-2 pt-1 border-t border-[rgba(15,0,0,0.08)]">
                        <span class="text-[11px] font-bold text-[#201d1d]">
                          🧪 ${tr('보유 EXP 영약:', 'Owned EXP Elixirs:', '保有EXP霊薬:')} <strong class="text-emerald-700">${cardNurtureStore.getExpElixirCount()}${tr('병', ' bottles', '本')}</strong>
                        </span>
                        ${
                          cardNurtureStore.getExpElixirCount() > 0
                            ? `
                              <button
                                type="button"
                                data-action="use-exp-elixir"
                                data-card-id="${selectedCard.cardId}"
                                ${selectedCard.level >= 100 ? 'disabled' : ''}
                                class="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-sm min-h-[40px] inline-flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                                  selectedCard.level >= 100 ? 'opacity-40 cursor-not-allowed' : ''
                                }"
                              >
                                🧪 ${tr('EXP 영약 투여 (+500 EXP)', 'Use EXP Elixir (+500 EXP)', 'EXP霊薬投与 (+500 EXP)')}
                              </button>
                            `
                            : `
                              <a
                                href="#shop"
                                data-nav="shop"
                                data-action="close-card-inspector"
                                class="px-3 py-2 bg-[#201d1d] hover:opacity-90 text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[40px] inline-flex items-center justify-center no-underline cursor-pointer"
                              >
                                🛒 ${tr('상점에서 영약 구매 →', 'Buy Elixirs in Shop →', 'ショップで霊薬購入 →')}
                              </a>
                            `
                        }
                      </div>
                    </div>
                  ` : `
                    <!-- Unowned Notice -->
                    <div class="p-3 bg-[#f8f7f7] border border-dashed border-stone-300 rounded-none text-xs text-stone-600 space-y-2">
                      <div class="font-bold text-[#201d1d]">🔒 ${tr('미보유 카드 (육성 잠김)', 'Unowned Card (Locked)', '未保有カード (育成ロック)')}</div>
                      <p class="m-0 leading-relaxed">${tr(
                        '상점에서 카드 팩을 구매하여 영웅을 영입하세요. 획득 후 레벨업 및 스탯 분배가 가능합니다.',
                        'Purchase card packs in the Shop to recruit this hero and unlock leveling &amp; stat allocation.',
                        'ショップでカードパックを購入して英雄を迎え入れましょう。獲得後にレベルアップやステータス配分が可能になります。'
                      )}</p>
                      <a
                        href="#shop"
                        data-nav="shop"
                        class="inline-flex items-center justify-center px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 no-underline min-h-[44px] cursor-pointer"
                      >
                        ${tr('상점 바로가기 ➔', 'Go to Shop ➔', 'ショップへ移動 ➔')}
                      </a>
                    </div>
                  `}
                </div>
              </div>

              <!-- 4-Way Stat Enhancement Grid -->
              <div class="space-y-3 pt-2 border-t border-[rgba(15,0,0,0.08)]">
                <div class="flex items-center justify-between">
                  <h4 class="text-sm font-bold text-[#201d1d] m-0">${tr('4방향 스탯 인핸스먼트', '4-Way Stat Enhancement', '4方向ステータス強化')}</h4>
                  <div class="text-xs">
                    <span class="text-stone-600">${tr('미분배 스탯:', 'Unspent Pts:', '未配分ポイント:')}</span>
                    <strong class="${isSelectedCardOwned && selectedCard.statPoints > 0 ? 'text-red-600 font-bold' : 'text-[#201d1d]'} ml-1">
                      ${isSelectedCardOwned ? `${selectedCard.statPoints} pt` : '0 pt'}
                    </strong>
                  </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  ${[
                    { dir: 'top', label: tr('북 (N)', 'North (N)', '北 (N)'), base: selectedDbCard?.top || 0, bonus: isSelectedCardOwned ? selectedCard.bonusStats.top : 0 },
                    { dir: 'right', label: tr('동 (E)', 'East (E)', '東 (E)'), base: selectedDbCard?.right || 0, bonus: isSelectedCardOwned ? selectedCard.bonusStats.right : 0 },
                    { dir: 'bottom', label: tr('남 (S)', 'South (S)', '南 (S)'), base: selectedDbCard?.bottom || 0, bonus: isSelectedCardOwned ? selectedCard.bonusStats.bottom : 0 },
                    { dir: 'left', label: tr('서 (W)', 'West (W)', '西 (W)'), base: selectedDbCard?.left || 0, bonus: isSelectedCardOwned ? selectedCard.bonusStats.left : 0 },
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
                          ${tr('+ 스탯 강화', '+ Enhance', '+ ステータス強化')}
                        </button>
                      ` : `
                        <div class="py-2 text-[10px] text-stone-400 font-medium">${tr('미보유', 'Unowned', '未保有')}</div>
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
                ${tr('확인 (CLOSE)', 'Close (CLOSE)', '確認 (CLOSE)')}
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}
