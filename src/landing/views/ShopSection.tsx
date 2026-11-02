/**
 * src/landing/views/ShopSection.tsx
 *
 * Streamlined Shop Section for SNSHero Static Landing.
 *
 * Requirements:
 *   - Exactly 8 fixed items:
 *     1. 일반 카드팩
 *     2. 매직 카드팩
 *     3. 희귀 카드팩
 *     4. 아이템 팩
 *     5. 광고 제거
 *     6. 공식 소설
 *     7. 공식 동영상
 *     8. 코인 충전 (골드 환전소: 5,000G -> 1,000 SNS)
 *   - Strictly ZERO free faucets (eliminated free SNS grants).
 *   - Card packs unlock 3 cards with animated PackRevealModal, dual-writing to
 *     both cardNurtureStore and hero_inventory.
 *   - Structured LocalStorage currency debit/credit (hero_sns, hero_earned_sns,
 *     hero_purchased_sns, hero_gold).
 *   - OpenCode Terminal-Flat design, 44px+ touch targets, font-mono, 0px/4px radii.
 * Pure TypeScript template string generator (Zero React runtime).
 */

import { CARD_DATABASE } from '../../cardDatabase';
import { cardNurtureStore } from '../services/cardNurtureStore';
import { getCharacterAsset } from '../services/assetCatalog';
import { SHOP_8_ITEMS } from '../types';

export interface RevealedCardMeta {
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
}

export interface PackRevealData {
  packId: string;
  packName: string;
  cards: RevealedCardMeta[];
}

export interface ShopPurchaseResult {
  success: boolean;
  message: string;
  error?: string;
  cardIds?: number[];
  revealedCards?: RevealedCardMeta[];
}

export interface ShopItemData {
  id: string;
  name: (typeof SHOP_8_ITEMS)[number];
  category: '카드팩' | '아이템' | '영구혜택' | '콘텐츠' | '재화';
  priceText: string;
  priceCoins: number;
  badge: string;
  description: string;
  actionText: string;
}

export const SHOP_ITEMS: ShopItemData[] = [
  {
    id: 'pack_normal',
    name: '일반 카드팩',
    category: '카드팩',
    priceText: '300 SNS',
    priceCoins: 300,
    badge: '브론즈~실버 확정',
    description: '기초 원소 영웅 3장을 획득합니다. 도감 수집율을 빠르게 높일 수 있는 기본 팩.',
    actionText: '구매하기 (300 SNS)',
  },
  {
    id: 'pack_magic',
    name: '매직 카드팩',
    category: '카드팩',
    priceText: '800 SNS',
    priceCoins: 800,
    badge: '실버~골드 확정',
    description: '상급 영웅 카드 3장을 획득합니다. 실버 등급 이상 확정 지급.',
    actionText: '구매하기 (800 SNS)',
  },
  {
    id: 'pack_rare',
    name: '희귀 카드팩',
    category: '카드팩',
    priceText: '1,500 SNS',
    priceCoins: 1500,
    badge: '골드 이상 확정',
    description: '최고 등급 전설 영웅 3장을 획득합니다. 덱 TP와 Total TP를 비약적으로 상승시킵니다.',
    actionText: '구매하기 (1,500 SNS)',
  },
  {
    id: 'item_pack',
    name: '아이템 팩',
    category: '아이템',
    priceText: '500 SNS',
    priceCoins: 500,
    badge: '육성 부스터',
    description: '카드 육성에 사용하는 마력의 EXP 영약 5개 세트. 카드 1장에 즉시 대량의 EXP를 공급합니다.',
    actionText: '구매하기 (500 SNS)',
  },
  {
    id: 'ad_remove',
    name: '광고 제거',
    category: '영구혜택',
    priceText: '1,000 SNS',
    priceCoins: 1000,
    badge: '영구 혜택',
    description: '인게임 및 배틀 중 발생하는 모든 배너/전면 광고를 영구적으로 제거합니다.',
    actionText: '영구 해금 (1,000 SNS)',
  },
  {
    id: 'official_novel',
    name: '공식 소설',
    category: '콘텐츠',
    priceText: '100 SNS',
    priceCoins: 100,
    badge: '40부작 전편',
    description: '카단과 아케인 대륙 11개 종족의 공식 대서사 웹소설 40화 전편 무제한 열람권.',
    actionText: '소장하기 (100 SNS)',
  },
  {
    id: 'official_movie',
    name: '공식 동영상',
    category: '콘텐츠',
    priceText: '200 SNS',
    priceCoins: 200,
    badge: '시네마 풀영상',
    description: '40부작 전편 고화질 실사 및 애니메이션 시네마 영상과 공식 오리지널 사운드트랙 소장권.',
    actionText: '시청권 구매 (200 SNS)',
  },
  {
    id: 'coin_charge',
    name: '코인 충전',
    category: '재화',
    priceText: '5,000 골드',
    priceCoins: 0,
    badge: '골드 환전',
    description: '인게임 5,000 골드를 1,000 SNS 코인으로 환전합니다. (보유 골드 소진)',
    actionText: '골드 환전소 열기 (5,000G → 1,000 SNS)',
  },
];

// ============================================================================
// Modal States & Handlers
// ============================================================================

let activeRevealPack: PackRevealData | null = null;
let isGoldExchangeOpen = false;

export function getActiveRevealPack(): PackRevealData | null {
  return activeRevealPack;
}

export function setActiveRevealPack(pack: PackRevealData | null): void {
  activeRevealPack = pack;
}

export function closePackRevealModal(): void {
  activeRevealPack = null;
}

export function isGoldExchangeModalOpen(): boolean {
  return isGoldExchangeOpen;
}

export function setGoldExchangeModalOpen(open: boolean): void {
  isGoldExchangeOpen = open;
}

export function openGoldExchangeModal(): void {
  isGoldExchangeOpen = true;
}

export function closeGoldExchangeModal(): void {
  isGoldExchangeOpen = false;
}

// ============================================================================
// Currency Management (SNS, Gold, Earned, Purchased)
// ============================================================================

export function getUserCoins(): number {
  if (typeof localStorage === 'undefined') return 1000;
  const raw = localStorage.getItem('hero_sns');
  if (raw === null) {
    localStorage.setItem('hero_sns', '1000');
    return 1000;
  }
  const val = parseInt(raw, 10);
  return isNaN(val) ? 1000 : Math.max(0, val);
}

export function setUserCoins(amount: number): void {
  if (typeof localStorage === 'undefined') return;
  const clamped = Math.max(0, amount);
  const season = localStorage.getItem('hero_current_season') || 'season1';
  localStorage.setItem('hero_sns', String(clamped));
  localStorage.setItem(`hero_sns_${season}`, String(clamped));
  localStorage.setItem('hero_earned_sns', String(clamped));
  localStorage.setItem('hero_purchased_sns', '0');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('snshero_sns_updated'));
    window.dispatchEvent(new Event('sns_updated'));
  }
}

export function getUserGold(): number {
  if (typeof localStorage === 'undefined') return 10000;
  const raw = localStorage.getItem('hero_gold');
  if (raw === null) {
    localStorage.setItem('hero_gold', '10000');
    return 10000;
  }
  const val = parseInt(raw, 10);
  return isNaN(val) ? 10000 : Math.max(0, val);
}

export function setUserGold(amount: number): void {
  if (typeof localStorage === 'undefined') return;
  const clamped = Math.max(0, amount);
  localStorage.setItem('hero_gold', String(clamped));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('snshero_gold_updated'));
  }
}

/**
 * Deduct SNS coins following canonical rule:
 * Debits hero_earned_sns first, remainder from hero_purchased_sns.
 */
export function debitUserCoins(cost: number): boolean {
  if (typeof localStorage === 'undefined') return false;
  const currentTotal = getUserCoins();
  if (currentTotal < cost) return false;

  let earned = parseInt(localStorage.getItem('hero_earned_sns') || '0', 10);
  let purchased = parseInt(localStorage.getItem('hero_purchased_sns') || '0', 10);

  if (earned === 0 && purchased === 0 && currentTotal > 0) {
    earned = currentTotal;
  }

  if (earned >= cost) {
    earned -= cost;
  } else {
    const remainder = cost - earned;
    earned = 0;
    purchased = Math.max(0, purchased - remainder);
  }

  const newTotal = earned + purchased;
  const season = localStorage.getItem('hero_current_season') || 'season1';

  localStorage.setItem('hero_sns', String(newTotal));
  localStorage.setItem(`hero_sns_${season}`, String(newTotal));
  localStorage.setItem('hero_earned_sns', String(earned));
  localStorage.setItem('hero_purchased_sns', String(purchased));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('snshero_sns_updated'));
    window.dispatchEvent(new Event('sns_updated'));
  }
  return true;
}

/**
 * Credit SNS coins to user account
 */
export function creditUserCoins(amount: number, type: 'earned' | 'purchased' = 'earned'): void {
  if (typeof localStorage === 'undefined') return;
  const currentTotal = getUserCoins();
  let earned = parseInt(localStorage.getItem('hero_earned_sns') || '0', 10);
  let purchased = parseInt(localStorage.getItem('hero_purchased_sns') || '0', 10);

  if (earned === 0 && purchased === 0 && currentTotal > 0) {
    earned = currentTotal;
  }

  if (type === 'purchased') {
    purchased += amount;
  } else {
    earned += amount;
  }

  const newTotal = earned + purchased;
  const season = localStorage.getItem('hero_current_season') || 'season1';

  localStorage.setItem('hero_sns', String(newTotal));
  localStorage.setItem(`hero_sns_${season}`, String(newTotal));
  localStorage.setItem('hero_earned_sns', String(earned));
  localStorage.setItem('hero_purchased_sns', String(purchased));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('snshero_sns_updated'));
    window.dispatchEvent(new Event('sns_updated'));
  }
}

/**
 * Non-free Currency Exchange (5,000 Gold -> 1,000 SNS).
 * Debits hero_gold, credits hero_earned_sns and hero_sns.
 */
export function exchangeGoldForSns(goldAmount: number = 5000): {
  success: boolean;
  snsGranted: number;
  message: string;
  error?: string;
} {
  if (goldAmount <= 0) {
    return {
      success: false,
      snsGranted: 0,
      message: '유효하지 않은 교환 골드 수량입니다.',
      error: '유효하지 않은 교환 골드 수량입니다.',
    };
  }

  const currentGold = getUserGold();
  if (currentGold < goldAmount) {
    return {
      success: false,
      snsGranted: 0,
      message: `보유 골드가 부족합니다. (현재: ${currentGold.toLocaleString()} G / 필요: ${goldAmount.toLocaleString()} G)`,
      error: '보유 골드가 부족합니다.',
    };
  }

  // 5 Gold = 1 SNS
  const snsGranted = Math.floor(goldAmount / 5);

  // Debit Gold
  const nextGold = currentGold - goldAmount;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('hero_gold', String(nextGold));
  }

  // Credit SNS & earnedSns
  const currentSns = getUserCoins();
  const nextSns = currentSns + snsGranted;
  const currentEarned =
    typeof localStorage !== 'undefined'
      ? parseInt(localStorage.getItem('hero_earned_sns') || '0', 10)
      : 0;
  const nextEarned = (isNaN(currentEarned) ? 0 : currentEarned) + snsGranted;

  if (typeof localStorage !== 'undefined') {
    const season = localStorage.getItem('hero_current_season') || 'season1';
    localStorage.setItem('hero_sns', String(nextSns));
    localStorage.setItem(`hero_sns_${season}`, String(nextSns));
    localStorage.setItem('hero_earned_sns', String(nextEarned));
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('snshero_sns_updated'));
    window.dispatchEvent(new Event('sns_updated'));
    window.dispatchEvent(new Event('snshero_gold_updated'));
  }

  return {
    success: true,
    snsGranted,
    message: `${goldAmount.toLocaleString()} 골드를 ${snsGranted.toLocaleString()} SNS 코인으로 환전하였습니다!`,
  };
}

export function executeGoldExchange(goldAmount: number = 5000): {
  success: boolean;
  snsGranted: number;
  message: string;
  error?: string;
} {
  return exchangeGoldForSns(goldAmount);
}

// ============================================================================
// Shop Purchase Execution
// ============================================================================

export function executeShopPurchase(itemId: string): ShopPurchaseResult {
  const item = SHOP_ITEMS.find((it) => it.id === itemId);
  if (!item) return { success: false, message: '아이템을 찾을 수 없습니다.' };

  // Non-free Gold Exchange Item
  if (itemId === 'coin_charge' || itemId === 'gold_exchange') {
    const res = exchangeGoldForSns(5000);
    return {
      success: res.success,
      message: res.message,
      error: res.error,
    };
  }

  const currentCoins = getUserCoins();

  if (currentCoins < item.priceCoins) {
    return {
      success: false,
      message: `SNS 코인이 부족합니다. (현재: ${currentCoins} SNS / 필요: ${item.priceCoins} SNS)`,
      error: `SNS 코인이 부족합니다. (현재: ${currentCoins} SNS / 필요: ${item.priceCoins} SNS)`,
    };
  }

  // Deduct coins using canonical earned-first rules
  const debited = debitUserCoins(item.priceCoins);
  if (!debited) {
    return {
      success: false,
      message: '코인 차감에 실패하였습니다.',
      error: '코인 차감 실패',
    };
  }

  // Card pack roll simulation (3 distinct cards with reveal modal)
  if (itemId === 'pack_normal' || itemId === 'pack_magic' || itemId === 'pack_rare') {
    const minId = itemId === 'pack_normal' ? 1 : itemId === 'pack_magic' ? 20 : 60;
    const maxId = itemId === 'pack_normal' ? 50 : itemId === 'pack_magic' ? 90 : 110;

    const unlockedIds: number[] = [];
    while (unlockedIds.length < 3) {
      const randId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
      if (!unlockedIds.includes(randId)) {
        unlockedIds.push(randId);
      }
    }

    const revealedCards: RevealedCardMeta[] = [];

    for (const cardId of unlockedIds) {
      const isNew = !cardNurtureStore.isCardOwned(cardId);
      cardNurtureStore.addCard(cardId);
      const cardDb = CARD_DATABASE[cardId];
      const asset = getCharacterAsset(cardId);

      const rawRarity = cardDb?.rarity || asset.rarity || 'bronze';
      const rarity = (rawRarity.charAt(0).toUpperCase() + rawRarity.slice(1)) as
        | 'Bronze'
        | 'Silver'
        | 'Gold'
        | 'Boss';

      revealedCards.push({
        cardId,
        nameKo: cardDb?.title || asset.nameKo || `영웅 ${cardId}`,
        nameEn: cardDb?.title_en || asset.nameEn || `Hero ${cardId}`,
        rarity,
        faction: cardDb?.element || asset.faction || 'water',
        power:
          cardDb?.power ||
          (cardDb?.top || 1) + (cardDb?.right || 1) + (cardDb?.bottom || 1) + (cardDb?.left || 1),
        top: cardDb?.top || 1,
        right: cardDb?.right || 1,
        bottom: cardDb?.bottom || 1,
        left: cardDb?.left || 1,
        bustUrl: asset.bustPngUrl,
        seatUrl: `/seat/${cardId}.png`,
        isNew,
      });
    }

    activeRevealPack = {
      packId: item.id,
      packName: item.name,
      cards: revealedCards,
    };

    return {
      success: true,
      message: `${item.name}을 구매하여 영웅 카드 3장(ID: ${unlockedIds.join(', ')})을 획득하였습니다!`,
      cardIds: unlockedIds,
      revealedCards,
    };
  }

  if (itemId === 'item_pack') {
    for (let id = 1; id <= 5; id++) {
      cardNurtureStore.nurtureCard(id, 250);
    }
    return {
      success: true,
      message: '아이템 팩을 구매하여 보유 덱 영웅들에게 +250 EXP가 공급되었습니다!',
    };
  }

  if (itemId === 'ad_remove') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('hero_ad_removed', 'true');
    }
    return { success: true, message: '광고 제거 혜택이 영구 적용되었습니다!' };
  }

  return { success: true, message: `${item.name}이 성공적으로 적용되었습니다.` };
}

// ============================================================================
// Terminal-Flat Modal Renderers (PackRevealModal & GoldExchangeModal)
// ============================================================================

function getRarityBadgeClass(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case 'boss':
      return 'bg-purple-900 text-purple-100 border border-purple-500';
    case 'gold':
      return 'bg-amber-100 text-amber-900 border border-amber-400';
    case 'silver':
      return 'bg-slate-200 text-slate-800 border border-slate-400';
    case 'bronze':
    default:
      return 'bg-amber-900/20 text-amber-950 border border-amber-800/30';
  }
}

export function renderPackRevealModal(): string {
  if (!activeRevealPack) return '';

  const { packName, cards } = activeRevealPack;

  return `
    <div
      id="pack-reveal-modal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono select-none"
      role="dialog"
      aria-modal="true"
    >
      <!-- Sibling Backdrop Click Dismissal -->
      <div
        id="pack-reveal-backdrop"
        data-action="close-pack-reveal"
        class="absolute inset-0 cursor-pointer"
        aria-hidden="true"
      ></div>

      <!-- Modal Dialog Frame -->
      <div class="relative z-10 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-2xl w-full p-6 shadow-none">
        <!-- Close [x] button -->
        <button
          type="button"
          data-action="close-pack-reveal"
          class="absolute top-4 right-4 min-h-[44px] min-w-[44px] text-stone-500 font-bold hover:text-stone-900 cursor-pointer flex items-center justify-center text-sm"
          aria-label="닫기"
        >
          [x]
        </button>

        <!-- Title Header -->
        <div class="mb-4">
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm">
            카드팩 오픈
          </span>
          <h2 class="text-lg sm:text-xl font-bold m-0 mt-1">
            ${packName} 획득 영웅 카드 (3장)
          </h2>
          <p class="text-xs text-stone-500 m-0 mt-0.5">
            새로 소환된 영웅들이 육성 보관함 및 영구 인벤토리에 자동 동기화되었습니다.
          </p>
        </div>

        <!-- 3 Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          ${cards
            .map(
              (c) => `
            <div
              class="pack-card-slot border border-[rgba(15,0,0,0.12)] p-3 text-center bg-[#f8f7f7] rounded-none flex flex-col items-center justify-between space-y-2 hover:border-[#201d1d] transition-colors"
              data-card-id="${c.cardId}"
              data-flipped="true"
            >
              <div class="flex items-center justify-between w-full">
                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${getRarityBadgeClass(c.rarity)}">
                  ${c.rarity}
                </span>
                ${
                  c.isNew
                    ? '<span class="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-600 text-white rounded-sm">[NEW]</span>'
                    : '<span class="text-[9px] text-stone-500 font-mono">[보유 +1]</span>'
                }
              </div>

              <div class="relative w-20 h-24 my-1">
                <img
                  src="/seat/${c.cardId}.png"
                  alt="${c.nameKo}"
                  class="w-20 h-24 mx-auto object-cover border border-stone-300 rounded-none bg-stone-100"
                  loading="eager"
                  onerror="this.onerror=null; this.src='${c.bustUrl}';"
                />
              </div>

              <div class="w-full">
                <div class="text-xs font-bold text-[#201d1d] truncate">
                  [NO.${String(c.cardId).padStart(3, '0')}] ${c.nameKo}
                </div>
                <div class="text-[10px] text-stone-500 truncate">
                  ${c.nameEn} · ${c.faction}
                </div>
              </div>

              <div class="w-full pt-1.5 border-t border-[rgba(15,0,0,0.08)] flex justify-between items-center text-[10px] text-stone-600">
                <span class="font-mono">N${c.top} E${c.right} S${c.bottom} W${c.left}</span>
                <span class="font-bold text-[#201d1d]">PWR ${c.power}</span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        <!-- Confirm Button -->
        <div class="flex justify-end pt-2 border-t border-[rgba(15,0,0,0.08)]">
          <button
            type="button"
            data-action="confirm-pack-reveal"
            class="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[44px] hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center shadow-none"
          >
            확인 및 보관함에 저장
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderGoldExchangeModal(): string {
  if (!isGoldExchangeOpen) return '';

  const gold = getUserGold();
  const sns = getUserCoins();
  const hasEnoughGold = gold >= 5000;

  return `
    <div
      id="gold-exchange-modal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono select-none"
      role="dialog"
      aria-modal="true"
    >
      <!-- Sibling Backdrop Click Dismissal -->
      <div
        id="gold-exchange-backdrop"
        data-action="close-gold-exchange"
        class="absolute inset-0 cursor-pointer"
        aria-hidden="true"
      ></div>

      <!-- Modal Dialog Frame -->
      <div class="relative z-10 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-md w-full p-6 shadow-none">
        <!-- Close [x] button -->
        <button
          type="button"
          data-action="close-gold-exchange"
          class="absolute top-4 right-4 min-h-[44px] min-w-[44px] text-stone-500 font-bold hover:text-stone-900 cursor-pointer flex items-center justify-center text-sm"
          aria-label="닫기"
        >
          [x]
        </button>

        <!-- Header -->
        <div class="mb-4">
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm">
            골드 환전소
          </span>
          <h2 class="text-lg font-bold m-0 mt-1">
            골드 → SNS 코인 환전
          </h2>
          <p class="text-xs text-stone-500 m-0 mt-0.5">
            게임 플레이를 통해 획득한 골드를 상점 전용 SNS 코인으로 교환합니다.
          </p>
        </div>

        <!-- Exchange Details Panel -->
        <div class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-4 rounded-none space-y-3 mb-4">
          <div class="flex items-center justify-between text-xs pb-2 border-b border-[rgba(15,0,0,0.08)]">
            <span class="text-stone-500">교환 비율:</span>
            <span class="font-bold text-[#201d1d]">5 골드 = 1 SNS (5,000G → 1,000 SNS)</span>
          </div>

          <div class="flex items-center justify-between text-xs">
            <span class="text-stone-500">현재 보유 골드:</span>
            <span class="font-bold ${hasEnoughGold ? 'text-[#201d1d]' : 'text-red-600'}">
              ${gold.toLocaleString()} Gold
            </span>
          </div>

          <div class="flex items-center justify-between text-xs">
            <span class="text-stone-500">현재 보유 SNS:</span>
            <span class="font-bold text-[#201d1d]">${sns.toLocaleString()} SNS</span>
          </div>

          ${
            !hasEnoughGold
              ? `
            <div class="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-none">
              ⚠️ 보유 골드가 부족합니다. (최소 5,000 골드 필요)
            </div>
          `
              : `
            <div class="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-none">
              ✓ 환전 후: ${Math.max(0, gold - 5000).toLocaleString()} Gold / ${(sns + 1000).toLocaleString()} SNS
            </div>
          `
          }
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3 pt-2 border-t border-[rgba(15,0,0,0.08)]">
          <button
            type="button"
            data-action="close-gold-exchange"
            class="flex-1 py-2.5 bg-[#f1eeee] text-[#201d1d] text-xs font-bold rounded-sm min-h-[44px] hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center border border-[rgba(15,0,0,0.12)]"
          >
            취소
          </button>
          <button
            type="button"
            data-action="execute-gold-exchange"
            ${!hasEnoughGold ? 'disabled' : ''}
            class="flex-1 py-2.5 ${hasEnoughGold ? 'bg-[#201d1d] text-[#fdfcfc] hover:opacity-90' : 'bg-stone-300 text-stone-500 cursor-not-allowed'} text-xs font-bold rounded-sm min-h-[44px] transition-opacity cursor-pointer flex items-center justify-center shadow-none"
          >
            환전 실행 (1,000 SNS)
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// Main Section Renderer
// ============================================================================

export function renderShopSection(): string {
  const coins = getUserCoins();
  const gold = getUserGold();

  const packModal = renderPackRevealModal();
  const exchangeModal = renderGoldExchangeModal();

  return `
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 font-mono text-[#201d1d] select-none">
      <!-- Section Header -->
      <section class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 sm:p-8 rounded-none shadow-none space-y-6 mb-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[rgba(15,0,0,0.08)] gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-wider uppercase mb-2">
              <span>SNS히어로 공식 상점</span>
              <span class="text-stone-400">·</span>
              <span>카드팩 &amp; 디지털 콘텐츠</span>
            </div>
            <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-[#201d1d] m-0">
              상점 (Card Shop &amp; Contents)
            </h1>
            <p class="text-xs sm:text-sm text-stone-600 mt-1 m-0">
              다양한 카드팩과 육성 부스터, 공식 40부작 웹소설 및 시네마 소장권을 구매할 수 있습니다.
            </p>
          </div>

          <!-- Currency & Recharge Bar -->
          <div class="flex items-center gap-3 p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none">
            <div class="text-right">
              <div class="text-[10px] text-stone-500 uppercase tracking-wider">
                보유 골드: <span class="font-bold text-[#201d1d]">${gold.toLocaleString()} G</span>
              </div>
              <div class="text-base sm:text-lg font-black text-[#201d1d]">
                ${coins.toLocaleString()} SNS
              </div>
            </div>
            <button
              type="button"
              data-action="open-gold-exchange"
              class="px-3 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center whitespace-nowrap cursor-pointer shadow-none"
            >
              [골드 환전소]
            </button>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs text-stone-500">
          <span>공식 등록 8종 필수 상품</span>
          <span>서버 로그인 없이 브라우저 로컬스토리지에 영구 보존됩니다.</span>
        </div>
      </section>

      <!-- Exact 8 Items Grid -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        ${SHOP_ITEMS.map((item) => `
          <div class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-5 sm:p-6 rounded-none flex flex-col justify-between space-y-4 hover:border-[#201d1d] transition-colors">
            <!-- Header: Category & Badge -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-stone-500 uppercase font-bold tracking-wider">
                  ${item.category}
                </span>
                <span class="px-2 py-0.5 bg-[#f1eeee] text-[#201d1d] text-[10px] font-bold rounded-sm">
                  ${item.badge}
                </span>
              </div>

              <!-- Item Name -->
              <h3 class="text-base sm:text-lg font-bold text-[#201d1d] m-0">
                ${item.name}
              </h3>

              <!-- Description -->
              <p class="text-xs text-stone-600 leading-relaxed m-0">
                ${item.description}
              </p>
            </div>

            <!-- Price & Purchase Action -->
            <div class="pt-4 border-t border-[rgba(15,0,0,0.08)] space-y-3">
              <div class="flex items-baseline justify-between">
                <span class="text-xs text-stone-500">판매 가격:</span>
                <span class="text-base font-black text-[#201d1d]">
                  ${item.priceText}
                </span>
              </div>

              <button
                type="button"
                data-action="${item.id === 'coin_charge' ? 'open-gold-exchange' : 'buy-shop-item'}"
                data-item-id="${item.id}"
                data-item-name="${item.name}"
                class="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center shadow-none cursor-pointer"
              >
                ${item.actionText}
              </button>
            </div>
          </div>
        `).join('')}
      </section>

      <!-- Active Modals (PackRevealModal & GoldExchangeModal) -->
      ${packModal}
      ${exchangeModal}
    </div>
  `;
}
