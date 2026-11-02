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
 *   - Strictly ZERO prohibited clutter items.
 *   - Card packs unlock cards into cardNurtureStore inventory (syncing collection rate and Total TP).
 *   - LocalStorage coin balance simulation ('hero_sns').
 *   - OpenCode Terminal-Flat design, 44px+ touch targets, font-mono, 0px/4px radii.
 * Pure TypeScript template string generator (Zero React runtime).
 */

import { cardNurtureStore } from '../services/cardNurtureStore';
import { SHOP_8_ITEMS } from '../types';

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
    priceText: '충전소',
    priceCoins: 0,
    badge: '즉시 지급',
    description: '상점 아이템 및 카드팩 구매에 사용하는 SNS 코인을 즉시 충전합니다.',
    actionText: '1,000 SNS 충전하기',
  },
];

export function getUserCoins(): number {
  if (typeof localStorage === 'undefined') return 1000;
  const raw = localStorage.getItem('hero_sns');
  if (!raw) {
    localStorage.setItem('hero_sns', '1000');
    return 1000;
  }
  const val = parseInt(raw, 10);
  return isNaN(val) ? 1000 : Math.max(0, val);
}

export function setUserCoins(amount: number): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('hero_sns', String(Math.max(0, amount)));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('snshero_sns_updated'));
  }
}

export function executeShopPurchase(itemId: string): { success: boolean; message: string } {
  const item = SHOP_ITEMS.find((it) => it.id === itemId);
  if (!item) return { success: false, message: '아이템을 찾을 수 없습니다.' };

  const currentCoins = getUserCoins();

  if (itemId === 'coin_charge') {
    setUserCoins(currentCoins + 1000);
    return { success: true, message: '1,000 SNS 코인이 즉시 충전되었습니다!' };
  }

  if (currentCoins < item.priceCoins) {
    return {
      success: false,
      message: `SNS 코인이 부족합니다. (현재: ${currentCoins} SNS / 필요: ${item.priceCoins} SNS)`,
    };
  }

  // Deduct coins
  setUserCoins(currentCoins - item.priceCoins);

  // Card pack roll simulation
  if (itemId === 'pack_normal' || itemId === 'pack_magic' || itemId === 'pack_rare') {
    // Candidate card IDs based on rarity
    const unlockedIds: number[] = [];
    const minId = itemId === 'pack_normal' ? 1 : itemId === 'pack_magic' ? 20 : 60;
    const maxId = itemId === 'pack_normal' ? 50 : itemId === 'pack_magic' ? 90 : 110;

    for (let i = 0; i < 3; i++) {
      const randId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
      cardNurtureStore.addCard(randId);
      unlockedIds.push(randId);
    }

    return {
      success: true,
      message: `${item.name}을 구매하여 영웅 카드 3장(ID: ${unlockedIds.join(', ')})을 획득하였습니다!`,
    };
  }

  if (itemId === 'item_pack') {
    // Award 250 EXP to starter cards
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

export function renderShopSection(): string {
  const coins = getUserCoins();

  return `
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 font-mono text-[#201d1d] select-none">
      <!-- Section Header -->
      <section class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 sm:p-8 rounded-none shadow-none space-y-6 mb-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[rgba(15,0,0,0.08)] gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-wider uppercase mb-2">
              <span>눈히어로 공식 상점</span>
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
              <div class="text-[10px] text-stone-500 uppercase tracking-wider">보유 코인</div>
              <div class="text-base sm:text-lg font-black text-[#201d1d]">
                ${coins.toLocaleString()} SNS
              </div>
            </div>
            <button
              type="button"
              data-action="free-charge-coin"
              class="px-3 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center whitespace-nowrap cursor-pointer"
            >
              + 코인 무료 충전
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
                data-action="buy-shop-item"
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
    </div>
  `;
}
