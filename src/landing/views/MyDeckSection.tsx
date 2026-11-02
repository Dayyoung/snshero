/**
 * src/landing/views/MyDeckSection.tsx
 *
 * Minimalist MyDeck section for SNSHero Static Landing.
 * Features:
 * - Active 5-card deck composition display (5 slots)
 * - Real-time Deck TP calculation (N+E+S+W stats sum for active 5 cards)
 * - Real-time Total TP calculation (sum across all owned cards in inventory)
 * - 3-tier character visual assets integration (bust / 3-head SD / 7-head cutout)
 * - Interactive card slot inspection with detailed stats & ability breakdown
 * - Quick action links to Card Nurturing (data-nav="card") and game start (/home)
 * - Conforms strictly to OpenCode Terminal-Flat design system:
 *   font-mono, 0px container radius, 4px button radius, 1px hairlines, 44px+ touch targets.
 * - Zero intrusive battle HUDs, zero virtual joysticks.
 * Pure TypeScript template string generator (Zero React runtime).
 */

import { cardNurtureStore } from '../services/cardNurtureStore';
import { getCharacterAsset, FACTION_PALETTES } from '../services/assetCatalog';
import { CARD_DATABASE } from '../../cardDatabase';

/**
 * Get base stats (N, E, S, W) from CARD_DATABASE.
 */
function getCardBaseStats(cardId: number): { top: number; right: number; bottom: number; left: number; total: number } {
  const db = CARD_DATABASE[cardId];
  if (!db) {
    return { top: 2, right: 2, bottom: 2, left: 2, total: 8 };
  }
  const top = db.top || 0;
  const right = db.right || 0;
  const bottom = db.bottom || 0;
  const left = db.left || 0;
  return { top, right, bottom, left, total: top + right + bottom + left };
}

/**
 * Calculate total card power (base N+E+S+W + allocated bonus stats).
 */
function getCardEffectiveStats(cardId: number): {
  top: number;
  right: number;
  bottom: number;
  left: number;
  baseTotal: number;
  bonusTotal: number;
  totalTP: number;
  statPoints: number;
  level: number;
  exp: number;
  expToNext: number;
} {
  const base = getCardBaseStats(cardId);
  const nurture = cardNurtureStore.cards[cardId] || {
    cardId,
    level: 1,
    exp: 0,
    expToNext: 100,
    statPoints: 0,
    bonusStats: { top: 0, right: 0, bottom: 0, left: 0 },
    totalBonus: 0,
  };

  const bonus = nurture.bonusStats || { top: 0, right: 0, bottom: 0, left: 0 };
  const top = base.top + (bonus.top || 0);
  const right = base.right + (bonus.right || 0);
  const bottom = base.bottom + (bonus.bottom || 0);
  const left = base.left + (bonus.left || 0);
  const bonusTotal = (bonus.top || 0) + (bonus.right || 0) + (bonus.bottom || 0) + (bonus.left || 0);

  return {
    top,
    right,
    bottom,
    left,
    baseTotal: base.total,
    bonusTotal,
    totalTP: top + right + bottom + left,
    statPoints: nurture.statPoints || 0,
    level: nurture.level || 1,
    exp: nurture.exp || 0,
    expToNext: nurture.expToNext || nurture.level * 100,
  };
}

export function renderMyDeckSection(selectedCardId: number = 1): string {
  // Active 5 cards compose the current deck slots
  const activeDeckIds = cardNurtureStore.ownedCardIds.slice(0, 5);

  // Deck TP: Sum of N+E+S+W of the 5 active deck cards
  const deckTP = cardNurtureStore.getDeckTP();

  // Total TP: Sum across all owned cards in inventory
  const totalTP = cardNurtureStore.getTotalTP();

  // Detail target card (falls back to Card 1 if selected is invalid)
  const currentSelectedId = activeDeckIds.includes(selectedCardId) ? selectedCardId : activeDeckIds[0] || 1;
  const selectedAsset = getCharacterAsset(currentSelectedId);
  const selectedStats = getCardEffectiveStats(currentSelectedId);
  const selectedDb = CARD_DATABASE[currentSelectedId] || {};
  const selectedFactionStyle = FACTION_PALETTES[selectedAsset.faction] || { bg: '#201d1d', text: '#ffffff', border: '#302c2c' };

  return `
    <div class="w-full flex flex-col font-mono text-[#201d1d] select-none">
      <!-- 1. Header & TP Metric Overview -->
      <section class="w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] py-8 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-7xl mx-auto space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(15,0,0,0.12)]">
            <div>
              <div class="inline-flex items-center gap-2 px-2.5 py-1 bg-[#201d1d] text-[#fdfcfc] text-[11px] font-bold rounded-sm tracking-wider uppercase mb-2">
                <span>[DECK MANAGEMENT]</span>
                <span class="text-stone-400">·</span>
                <span>5-CARD SQUAD</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-[#201d1d] m-0">마이덱 (My Deck)</h1>
              <p class="text-xs sm:text-sm text-stone-600 m-0 mt-1">
                현재 출격 배치된 5장의 영웅 덱 구성과 전술 전투력(Tactical Power) 실시간 합산
              </p>
            </div>

            <!-- Quick Action: Go to Nurture or Play -->
            <div class="flex flex-wrap items-center gap-3">
              <button
                type="button"
                data-nav="card"
                class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center cursor-pointer"
              >
                카드 육성 및 스탯 분배 (Lv.1~100) →
              </button>
              <a
                href="#play"
                data-nav="play"
                class="px-4 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center no-underline"
              >
                웹게임 출격 →
              </a>
            </div>
          </div>

          <!-- 3-Tier Metric Dashboard: Deck TP, Total TP, Squad Capacity -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Metric 1: Deck TP -->
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-5 rounded-none flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
                <span>덱 전투력 (DECK TP)</span>
                <span class="px-2 py-0.5 bg-[#201d1d] text-white text-[10px] rounded-sm">5 CARDS SUM</span>
              </div>
              <div class="text-3xl sm:text-4xl font-black text-[#201d1d] tracking-tight">
                ${deckTP} <span class="text-xs font-normal text-stone-500">TP</span>
              </div>
              <div class="text-[11px] text-stone-500">
                현재 출격 5개 슬롯 영웅들의 N+E+S+W 스탯 총합
              </div>
            </div>

            <!-- Metric 2: Total TP -->
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-5 rounded-none flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
                <span>전체 전투력 (TOTAL TP)</span>
                <span class="px-2 py-0.5 bg-stone-700 text-white text-[10px] rounded-sm">ALL OWNED</span>
              </div>
              <div class="text-3xl sm:text-4xl font-black text-[#201d1d] tracking-tight">
                ${totalTP} <span class="text-xs font-normal text-stone-500">TP</span>
              </div>
              <div class="text-[11px] text-stone-500">
                인벤토리에 보유 중인 전체 영웅 카드(${cardNurtureStore.ownedCardIds.length}종)의 누적 전투력 합산
              </div>
            </div>

            <!-- Metric 3: Active Deck Slots -->
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-5 rounded-none flex flex-col justify-between space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
                <span>덱 슬롯 상태 (SLOTS)</span>
                <span class="px-2 py-0.5 bg-emerald-700 text-white text-[10px] rounded-sm">READY</span>
              </div>
              <div class="text-3xl sm:text-4xl font-black text-[#201d1d] tracking-tight">
                ${activeDeckIds.length} <span class="text-xs font-normal text-stone-500">/ 5 SLOTS</span>
              </div>
              <div class="text-[11px] text-stone-500">
                수집율: ${cardNurtureStore.ownedCardIds.length} / 110 (${((cardNurtureStore.ownedCardIds.length / 110) * 100).toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Active 5 Card Deck Slots Grid -->
      <section class="w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] py-10 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-7xl mx-auto space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <span class="text-[11px] text-[#646262] font-bold uppercase tracking-wider">현재 출격 슬롯</span>
              <h2 class="text-lg sm:text-xl font-bold tracking-tight text-[#201d1d] m-0">
                활성 5개 덱 슬롯 (ACTIVE 5 DECK SLOTS)
              </h2>
            </div>
            <div class="text-xs text-stone-500 font-mono">
              슬롯 카드를 클릭하여 상세 정보 확인 및 육성 연동
            </div>
          </div>

          <!-- 5 Card Slots Responsive Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            ${activeDeckIds.map((cardId, index) => {
              const asset = getCharacterAsset(cardId);
              const stats = getCardEffectiveStats(cardId);
              const isSelected = cardId === currentSelectedId;
              const hasRedDot = stats.statPoints > 0;

              return `
                <div
                  role="button"
                  tabindex="0"
                  data-action="select-deck-card"
                  data-card-id="${cardId}"
                  class="relative border ${isSelected ? 'border-[#201d1d] bg-[#f8f7f7] shadow-sm' : 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc]'} p-4 rounded-none flex flex-col justify-between space-y-3 cursor-pointer hover:border-[#201d1d] transition-all min-h-[300px]"
                >
                  <!-- Top Row: Slot Number & Red Dot / Unspent Points -->
                  <div class="flex items-center justify-between w-full">
                    <span class="text-[10px] font-bold px-1.5 py-0.5 ${isSelected ? 'bg-[#201d1d] text-[#fdfcfc]' : 'bg-[#f1eeee] text-[#646262]'} rounded-sm">
                      SLOT 0${index + 1}
                    </span>
                    ${hasRedDot ? `
                      <span class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-sm" title="미사용 스탯 포인트">
                        +${stats.statPoints} pt
                      </span>
                    ` : `
                      <span class="text-[10px] text-stone-400 font-bold uppercase">${asset.rarity}</span>
                    `}
                  </div>

                  <!-- Character Bust Portrait (3-Tier Asset) -->
                  <div class="w-full h-36 bg-[#f1eeee] flex items-center justify-center p-2 overflow-hidden border border-[rgba(15,0,0,0.06)] rounded-none">
                    <img
                      src="${asset.bustPngUrl}"
                      alt="${asset.nameKo}"
                      class="max-h-full max-w-full object-contain filter drop-shadow-none"
                      loading="lazy"
                      onerror="this.src='${asset.seatUrl}'; this.onerror=null;"
                    />
                  </div>

                  <!-- Card Identification & Level -->
                  <div class="w-full space-y-1">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-black text-[#201d1d] truncate">[${asset.code}] ${asset.nameKo}</span>
                      <span class="text-[11px] font-bold text-stone-700">Lv.${stats.level}</span>
                    </div>
                    <div class="text-[10px] text-stone-500 uppercase tracking-wider">${asset.faction} · ${asset.nameEn}</div>
                  </div>

                  <!-- 4-Way Compass Stats (N, E, S, W) & Total TP -->
                  <div class="w-full bg-[#f1eeee] border border-[rgba(15,0,0,0.08)] p-2 rounded-sm space-y-1 text-center">
                    <div class="text-[10px] font-bold text-stone-600">북(N): <span class="text-[#201d1d]">${stats.top}</span></div>
                    <div class="flex items-center justify-between text-[10px] font-bold text-stone-600 px-1">
                      <span>서(W): <span class="text-[#201d1d]">${stats.left}</span></span>
                      <span>동(E): <span class="text-[#201d1d]">${stats.right}</span></span>
                    </div>
                    <div class="text-[10px] font-bold text-stone-600">남(S): <span class="text-[#201d1d]">${stats.bottom}</span></div>
                  </div>

                  <!-- Bottom Card TP Summary Badge -->
                  <div class="w-full pt-1 flex items-center justify-between border-t border-[rgba(15,0,0,0.08)] text-[11px]">
                    <span class="text-stone-500 font-semibold">전투력 (TP)</span>
                    <span class="font-black text-[#201d1d]">${stats.totalTP} TP</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </section>

      <!-- 3. Selected Card Deep Inspection & 7-Head Cutout Showcase -->
      <section class="w-full bg-[#f8f7f7] py-12 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-7xl mx-auto space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[rgba(15,0,0,0.12)]">
            <div>
              <span class="text-[11px] text-[#646262] font-bold uppercase tracking-wider">영웅 상세 분석</span>
              <h2 class="text-lg sm:text-xl font-bold tracking-tight text-[#201d1d] m-0">
                선택된 영웅 카드 상세 (SELECTED CARD DETAIL: ${selectedAsset.nameKo})
              </h2>
            </div>
            <div class="text-xs text-stone-500 font-mono">
              [NO.${selectedAsset.code}] ${selectedAsset.nameEn}
            </div>
          </div>

          <!-- 2-Column Responsive Detail Card -->
          <div class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 sm:p-8 rounded-none grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <!-- Left: 7-Head Full-Body Cutout Preview (Tier 1 Asset) -->
            <div class="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-4">
              <div class="relative w-full h-72 sm:h-80 flex items-center justify-center overflow-hidden">
                <img
                  src="${selectedAsset.cutoutUrl}"
                  alt="${selectedAsset.nameKo} 7등신 풀바디"
                  class="max-w-full max-h-full object-contain filter drop-shadow-none"
                  loading="eager"
                  onerror="this.src='${selectedAsset.bustPngUrl}'; this.onerror=null;"
                />
              </div>
              <div class="w-full text-center space-y-1">
                <span class="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-sm" style="background-color: ${selectedFactionStyle.bg}; color: ${selectedFactionStyle.text};">
                  ${selectedAsset.faction} · ${selectedAsset.rarity}
                </span>
                <div class="text-xs text-stone-500">
                  공식 7등신 풀바디 투명 컷아웃 (Visual Tier 1)
                </div>
              </div>
            </div>

            <!-- Right: Detailed Stats, Level, EXP, Ability, and Actions -->
            <div class="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <h3 class="text-xl sm:text-2xl font-black text-[#201d1d] m-0">
                    [${selectedAsset.code}] ${selectedAsset.nameKo}
                  </h3>
                  <span class="text-sm text-stone-500 font-normal">(${selectedAsset.nameEn})</span>
                </div>

                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  ${(selectedDb as any).lore_ko || `${selectedAsset.faction} 속성의 강력한 정령 영웅. 3x3 보드에서 전술적 플립과 결계를 주도합니다.`}
                </p>
              </div>

              <!-- Level, EXP Bar & Stat Points Notification -->
              <div class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-4 rounded-none space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-[#201d1d]">성장 레벨: Lv.${selectedStats.level} / 100</span>
                  <span class="text-stone-500">EXP: ${selectedStats.exp} / ${selectedStats.expToNext}</span>
                </div>
                <div class="w-full h-2 bg-stone-200 rounded-sm overflow-hidden">
                  <div
                    class="h-full bg-[#201d1d]"
                    style="width: ${Math.min(100, Math.round((selectedStats.exp / (selectedStats.expToNext || 100)) * 100))}%"
                  ></div>
                </div>
                <div class="flex items-center justify-between text-[11px] pt-1">
                  <span class="text-stone-600">
                    미사용 스탯 포인트: <strong class="${selectedStats.statPoints > 0 ? 'text-red-600' : 'text-[#201d1d]'}">${selectedStats.statPoints} pt</strong>
                  </span>
                  ${selectedStats.statPoints > 0 ? `
                    <span class="text-[10px] text-red-600 font-bold">카드 육성 메뉴에서 스탯을 배분하세요!</span>
                  ` : `
                    <span class="text-[10px] text-stone-400">모든 스탯 포인트 배분 완료</span>
                  `}
                </div>
              </div>

              <!-- 4-Way Compass Stats Breakdown Grid -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div class="border border-[rgba(15,0,0,0.12)] bg-white p-3 rounded-none">
                  <div class="text-[10px] text-stone-500 font-bold uppercase">북 (NORTH)</div>
                  <div class="text-lg font-black text-[#201d1d] mt-1">${selectedStats.top}</div>
                  <div class="text-[10px] text-stone-400">기본 ${getCardBaseStats(currentSelectedId).top} + 보너스 ${selectedStats.top - getCardBaseStats(currentSelectedId).top}</div>
                </div>
                <div class="border border-[rgba(15,0,0,0.12)] bg-white p-3 rounded-none">
                  <div class="text-[10px] text-stone-500 font-bold uppercase">동 (EAST)</div>
                  <div class="text-lg font-black text-[#201d1d] mt-1">${selectedStats.right}</div>
                  <div class="text-[10px] text-stone-400">기본 ${getCardBaseStats(currentSelectedId).right} + 보너스 ${selectedStats.right - getCardBaseStats(currentSelectedId).right}</div>
                </div>
                <div class="border border-[rgba(15,0,0,0.12)] bg-white p-3 rounded-none">
                  <div class="text-[10px] text-stone-500 font-bold uppercase">남 (SOUTH)</div>
                  <div class="text-lg font-black text-[#201d1d] mt-1">${selectedStats.bottom}</div>
                  <div class="text-[10px] text-stone-400">기본 ${getCardBaseStats(currentSelectedId).bottom} + 보너스 ${selectedStats.bottom - getCardBaseStats(currentSelectedId).bottom}</div>
                </div>
                <div class="border border-[rgba(15,0,0,0.12)] bg-white p-3 rounded-none">
                  <div class="text-[10px] text-stone-500 font-bold uppercase">서 (WEST)</div>
                  <div class="text-lg font-black text-[#201d1d] mt-1">${selectedStats.left}</div>
                  <div class="text-[10px] text-stone-400">기본 ${getCardBaseStats(currentSelectedId).left} + 보너스 ${selectedStats.left - getCardBaseStats(currentSelectedId).left}</div>
                </div>
              </div>

              <!-- Special Ability & TP Total -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] rounded-none">
                <div class="space-y-0.5">
                  <span class="text-[10px] text-stone-500 font-bold uppercase">고유 스킬 (SPECIAL ABILITY)</span>
                  <div class="text-xs font-bold text-[#201d1d]">
                    ${(selectedDb as any).ability?.description_ko || '기본 전술 능력: 표준 전장 배치'}
                  </div>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-stone-500 font-bold uppercase">영웅 총전투력</span>
                  <div class="text-xl font-black text-[#201d1d]">${selectedStats.totalTP} TP</div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  data-nav="card"
                  class="flex-1 px-5 py-3 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] inline-flex items-center justify-center cursor-pointer"
                >
                  이 카드 육성하기 (EXP &amp; 스탯 배분) →
                </button>
                <a
                  href="#play"
                  data-nav="play"
                  class="px-5 py-3 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] inline-flex items-center justify-center no-underline"
                >
                  실전 배틀 출격 →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}
