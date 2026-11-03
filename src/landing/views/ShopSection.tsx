/**
 * src/landing/views/ShopSection.tsx
 *
 * Unified Shop & Goods Mall Section for SNSHero Static Landing.
 *
 * Core Features:
 *   1. Full Mall Integration (#shop):
 *      - Replaces legacy /mall completely with zero external redirects.
 *      - Unified Header, Sidebar, and Footer shared with #home, #deck, #play, #card.
 *      - 5 Categorized Tabs:
 *        * ALL: 전체 상품
 *        * PACK: 카드팩 (일반, 매직, 희귀, 스타터 전설팩)
 *        * GOODS: 공식 실물 굿즈 (머그컵, 티셔츠, 게임테이블, 110장 풀세트, 종족별 11종 덱)
 *        * ITEM: 육성 아이템 & 콘텐츠 (EXP 영약팩, 광고 영구 제거, 웹소설 40화, 애니 시네마)
 *        * COIN: 코인 충전 & 환전 (1,000P / 3,000P / 10,000P / 50,000P 충전 및 골드 환전소)
 *   2. Minimalist Product Detail View (정보 최소화 및 미니멀 UI):
 *      - Clean visual asset display (high-res bust/merch).
 *      - Condensed 1~2 sentence summary, transparent price, minimal options.
 *   3. Instant Purchase Flow (즉시구매 -> 배송지 입력 -> 나라선택 / 페이선택 팝업):
 *      - Step 1: Clean Detail Preview with Options (Qty, Size, Faction).
 *      - Step 2: Minimal Shipping Input (Name, Phone, Address).
 *      - Step 3: Country Selection (10 major countries + Crypto).
 *      - Step 4: Payment Method Selection (PayApp, KakaoPay, NaverPay, ApplePay, PayPal, Crypto, Test SIM).
 *      - Step 5: Real LocalStorage persistence ('hero_goods_orders') & celebration modal.
 *   4. Standalone Coin Recharge Modal with same Country/Payment selector.
 *   5. OpenCode Terminal-Flat design, 44px+ touch targets, font-mono, 0px/4px radii, mobile responsive.
 */

import { CARD_DATABASE } from '../../cardDatabase';
import { cardNurtureStore } from '../services/cardNurtureStore';
import { getCharacterAsset } from '../services/assetCatalog';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ShopCategoryTab = 'ALL' | 'PACK' | 'GOODS' | 'ITEM' | 'COIN';

export interface ShopCardProduct {
  id: string;
  category: 'PACK' | 'GOODS' | 'ITEM' | 'COIN';
  name: string;
  badge: string;
  priceText: string;
  priceCoins: number;
  priceUsd: number;
  priceKrw: number;
  description: string;
  shortSpec: string;
  actionText: string;
  image?: string;
  isPhysicalGoods?: boolean;
}

export interface CoinPackage {
  id: string;
  amount: number;
  priceUsd: number;
  priceKrw: number;
  label: string;
  bonusText?: string;
  isAdRemoval?: boolean;
}

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  currency: string;
}

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

export interface GoodsOrderRecord {
  id: string;
  productId: string;
  title: string;
  quantity: number;
  size?: string;
  faction?: string;
  priceUsd: number;
  priceKrw: number;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  country: string;
  paymentMethod: string;
  orderedAt: number;
  status: 'paid' | 'shipping_ready';
}

// ============================================================================
// Constants
// ============================================================================

export const SHOP_CATEGORY_TABS: Array<{ key: ShopCategoryTab; label: string; icon: string }> = [
  { key: 'ALL', label: '전체 (ALL)', icon: '🛍️' },
  { key: 'PACK', label: '카드팩 (PACK)', icon: '🎴' },
  { key: 'GOODS', label: '실물 굿즈 (GOODS)', icon: '📦' },
  { key: 'ITEM', label: '아이템 (ITEM)', icon: '🧪' },
  { key: 'COIN', label: '코인 충전 (COIN)', icon: '⚡' },
];

export const COUNTRIES: CountryOption[] = [
  { code: 'ko', name: '대한민국 (South Korea)', flag: '🇰🇷', currency: 'KRW' },
  { code: 'en', name: 'United States', flag: '🇺🇸', currency: 'USD' },
  { code: 'ja', name: '日本 (Japan)', flag: '🇯🇵', currency: 'JPY' },
  { code: 'zh', name: '中国 (China)', flag: '🇨🇳', currency: 'CNY' },
  { code: 'gb', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP' },
  { code: 'de', name: 'Deutschland (Germany)', flag: '🇩🇪', currency: 'EUR' },
  { code: 'fr', name: 'France', flag: '🇫🇷', currency: 'EUR' },
  { code: 'es', name: 'España (Spain)', flag: '🇪🇸', currency: 'EUR' },
  { code: 'vi', name: 'Việt Nam (Vietnam)', flag: '🇻🇳', currency: 'VND' },
  { code: 'th', name: 'ประเทศไทย (Thailand)', flag: '🇹🇭', currency: 'THB' },
];

export const COIN_PACKAGES: CoinPackage[] = [
  {
    id: 'coin_1000',
    amount: 1000,
    priceUsd: 1.0,
    priceKrw: 1500,
    label: '1,000 SNS 코인',
    bonusText: '스타터 충전',
  },
  {
    id: 'coin_3000',
    amount: 3000,
    priceUsd: 2.99,
    priceKrw: 4000,
    label: '3,000 SNS 코인',
    bonusText: '+5% 보너스',
  },
  {
    id: 'coin_10000',
    amount: 10000,
    priceUsd: 10.0,
    priceKrw: 14000,
    label: '10,000 SNS 코인',
    bonusText: '🔥 BEST 인기 (+15%)',
  },
  {
    id: 'coin_50000',
    amount: 50000,
    priceUsd: 100.0,
    priceKrw: 140000,
    label: '50,000 SNS 코인',
    bonusText: '⭐ VIP 혜택 (+25%)',
  },
  {
    id: 'pkg_ad_removal',
    amount: 0,
    priceUsd: 2.99,
    priceKrw: 4000,
    label: '광고 영구 제거 패키지',
    bonusText: '영구 해금',
    isAdRemoval: true,
  },
];

export const ALL_SHOP_PRODUCTS: ShopCardProduct[] = [
  // ── PACK (카드팩) ─────────────────────────────────────────────────────────
  {
    id: 'pack_normal',
    category: 'PACK',
    name: '일반 카드팩',
    badge: '브론즈~실버 확정',
    priceText: '300 SNS',
    priceCoins: 300,
    priceUsd: 1.0,
    priceKrw: 1500,
    description: '기초 원소 영웅 3장을 획득합니다. 도감 수집율을 빠르게 높일 수 있는 기본 팩.',
    shortSpec: '3장 랜덤 소환 · 브론즈~실버 등급 보장',
    actionText: '구매하기 (300 SNS)',
  },
  {
    id: 'pack_magic',
    category: 'PACK',
    name: '매직 카드팩',
    badge: '실버~골드 확정',
    priceText: '800 SNS',
    priceCoins: 800,
    priceUsd: 2.5,
    priceKrw: 3500,
    description: '상급 영웅 카드 3장을 획득합니다. 실버 등급 이상 확정 지급.',
    shortSpec: '3장 상급 소환 · 실버 등급 이상 100% 보장',
    actionText: '구매하기 (800 SNS)',
  },
  {
    id: 'pack_rare',
    category: 'PACK',
    name: '희귀 카드팩',
    badge: '골드 이상 확정',
    priceText: '1,500 SNS',
    priceCoins: 1500,
    priceUsd: 5.0,
    priceKrw: 7000,
    description: '최고 등급 전설 영웅 3장을 획득합니다. 덱 TP와 Total TP를 비약적으로 상승시킵니다.',
    shortSpec: '3장 최고급 소환 · 골드~전설 SSR 확정',
    actionText: '구매하기 (1,500 SNS)',
  },
  {
    id: 'pack_starter_bundle',
    category: 'PACK',
    name: '스타터 전설팩 (SSR 5종)',
    badge: '첫 구매 추천',
    priceText: '2,000 SNS',
    priceCoins: 2000,
    priceUsd: 7.0,
    priceKrw: 9800,
    description: '초심자 모험가를 위한 핵심 5대 종족 전설 영웅 5장 즉시 지급 세트.',
    shortSpec: '전설 영웅 5장 일괄 지급 · 초보자 필수 추천',
    actionText: '구매하기 (2,000 SNS)',
  },

  // ── GOODS (공식 실물 굿즈 - 통합 쇼핑몰) ──────────────────────────────────
  {
    id: 'goods_mug',
    category: 'GOODS',
    name: '히어로 커스텀 머그컵',
    badge: '공식 정품',
    priceText: '$10.00 (14,000원)',
    priceCoins: 0,
    priceUsd: 10.0,
    priceKrw: 14000,
    description: '원하는 영웅 일러스트와 칭호가 고화질 전사 인쇄된 11oz 프리미엄 세라믹 머그컵.',
    shortSpec: '용량 11oz (약 330ml) · 고온 전사 세라믹 · 전자레인지/식기세척기 안심 사용',
    actionText: '상세보기 & 즉시구매',
    image: '/mug.png',
    isPhysicalGoods: true,
  },
  {
    id: 'goods_tshirt',
    category: 'GOODS',
    name: '히어로 커스텀 티셔츠',
    badge: '프리미엄 코튼',
    priceText: '$30.00 (42,000원)',
    priceCoins: 0,
    priceUsd: 30.0,
    priceKrw: 42000,
    description: '20수 고급 코튼 원단에 대표 영웅 풀바디 공식 일러스트가 프린팅된 공식 반팔 티셔츠.',
    shortSpec: '면 100% 20수 코마사 · 정사이즈 유니섹스 핏 (S/M/L) · 넥라인 보강 테이핑',
    actionText: '상세보기 & 즉시구매',
    image: '/icon.png',
    isPhysicalGoods: true,
  },
  {
    id: 'goods_table',
    category: 'GOODS',
    name: '히어로 3x3 배틀 게임테이블',
    badge: '전용 배틀 매트',
    priceText: '$30.00 (42,000원)',
    priceCoins: 0,
    priceUsd: 30.0,
    priceKrw: 42000,
    description: '3x3 격자 전장과 N/E/S/W 스탯 룰이 각인된 고급 천연고무 게이밍 데스크 패브릭 매트.',
    shortSpec: '규격 600x350x4mm · 방수 코팅 패브릭 표면 · 미끄럼 방지 천연고무 바닥',
    actionText: '상세보기 & 즉시구매',
    image: '/mall/cdn/shop/files/pan.png',
    isPhysicalGoods: true,
  },
  {
    id: 'goods_deck_all',
    category: 'GOODS',
    name: '110장 올인원 풀세트 (10% 할인)',
    badge: '소장용 풀컬렉션',
    priceText: '$300.00 (420,000원)',
    priceCoins: 0,
    priceUsd: 300.0,
    priceKrw: 420000,
    description: '11개 종족 110종 전 영웅 공식 실물 TCG 카드 완벽 패키지. 전용 하드케이스 동봉.',
    shortSpec: '110종 전 영웅 실물 카드 전량 수록 · 350gsm 고급 독일제 코어 블랙지 · 홀로그램 포일 박스',
    actionText: '상세보기 & 즉시구매',
    image: '/mall/cdn/shop/files/card.png',
    isPhysicalGoods: true,
  },
  {
    id: 'goods_deck_faction',
    category: 'GOODS',
    name: '종족별 영웅 덱 (10장 세트)',
    badge: '11개 종족 선택',
    priceText: '$30.00 (42,000원)',
    priceCoins: 0,
    priceUsd: 30.0,
    priceKrw: 42000,
    description: '물, 불, 바람, 대지, 인간, 언데드 등 원하는 종족 10장 실물 TCG 카드 덱 세트.',
    shortSpec: '선택 종족 카드 10장 세트 · 350gsm 프리미엄 텍스처 · 투명 슬리브 10매 기본 동봉',
    actionText: '상세보기 & 즉시구매',
    image: '/mall/cdn/shop/files/deck_water.png',
    isPhysicalGoods: true,
  },

  // ── ITEM (육성 아이템 & 디지털 콘텐츠) ──────────────────────────────────
  {
    id: 'item_pack',
    category: 'ITEM',
    name: '아이템 팩 (EXP 영약 5개)',
    badge: '육성 부스터',
    priceText: '500 SNS',
    priceCoins: 500,
    priceUsd: 2.0,
    priceKrw: 2800,
    description: '카드 육성에 사용하는 마력의 EXP 영약 5개 세트. 카드 1장에 즉시 대량의 EXP를 공급합니다.',
    shortSpec: '마력의 영약 5개 세트 · 즉시 EXP +5,000 주입',
    actionText: '구매하기 (500 SNS)',
  },
  {
    id: 'ad_remove',
    category: 'ITEM',
    name: '광고 영구 제거',
    badge: '영구 혜택',
    priceText: '1,000 SNS',
    priceCoins: 1000,
    priceUsd: 2.99,
    priceKrw: 4000,
    description: '인게임 및 배틀 중 발생하는 모든 배너/전면 광고를 영구적으로 제거합니다.',
    shortSpec: '인게임 전면/배너 광고 100% 영구 차단 · 계정 영구 귀속',
    actionText: '영구 해금 (1,000 SNS)',
  },
  {
    id: 'official_novel',
    category: 'ITEM',
    name: '공식 소설 40부작 전편',
    badge: '웹소설 전편',
    priceText: '100 SNS',
    priceCoins: 100,
    priceUsd: 0.99,
    priceKrw: 1400,
    description: '카단과 아케인 대륙 11개 종족의 공식 대서사 웹소설 40화 전편 무제한 열람권.',
    shortSpec: '카단의 여정 40부작 텍스트 전편 무제한 열람 및 소장',
    actionText: '소장하기 (100 SNS)',
  },
  {
    id: 'official_movie',
    category: 'ITEM',
    name: '공식 동영상 & OST',
    badge: '시네마 풀영상',
    priceText: '200 SNS',
    priceCoins: 200,
    priceUsd: 1.5,
    priceKrw: 2100,
    description: '40부작 전편 고화질 실사 및 애니메이션 시네마 영상과 공식 오리지널 사운드트랙 소장권.',
    shortSpec: '40부작 4K 시네마 컷신 영상 스트리밍 및 공식 OST 음원팩',
    actionText: '시청권 구매 (200 SNS)',
  },

  // ── COIN (코인 충전 & 환전) ───────────────────────────────────────────────
  {
    id: 'coin_charge_1000',
    category: 'COIN',
    name: '1,000 SNS 코인 충전',
    badge: '스타터 패키지',
    priceText: '$1.00 (1,500원)',
    priceCoins: 0,
    priceUsd: 1.0,
    priceKrw: 1500,
    description: 'SNS 코인 1,000 포인트를 즉시 충전합니다. (국가별 신용카드, 간편결제, 페이팔, 코인 지원)',
    shortSpec: '1,000 SNS 코인 즉시 지급 · 카드팩 3회 개봉 가능',
    actionText: '충전하기 ($1.00)',
  },
  {
    id: 'coin_charge_3000',
    category: 'COIN',
    name: '3,000 SNS 코인 충전',
    badge: '+5% 보너스',
    priceText: '$2.99 (4,000원)',
    priceCoins: 0,
    priceUsd: 2.99,
    priceKrw: 4000,
    description: 'SNS 코인 3,000 포인트를 즉시 충전합니다. 카드팩 10연차 및 육성에 최적.',
    shortSpec: '3,000 SNS 코인 즉시 지급 · 인기 추천 패키지',
    actionText: '충전하기 ($2.99)',
  },
  {
    id: 'coin_charge_10000',
    category: 'COIN',
    name: '10,000 SNS 코인 충전',
    badge: '🔥 BEST 인기 (+15%)',
    priceText: '$10.00 (14,000원)',
    priceCoins: 0,
    priceUsd: 10.0,
    priceKrw: 14000,
    description: '가장 많은 모험가들이 선택하는 인기 패키지. 대량의 전설 팩과 아이템을 여유롭게 구매 가능.',
    shortSpec: '10,000 SNS 코인 즉시 지급 · 대량 영웅 덱 강화에 최적',
    actionText: '충전하기 ($10.00)',
  },
  {
    id: 'coin_charge_50000',
    category: 'COIN',
    name: '50,000 SNS 코인 충전',
    badge: '⭐ VIP 혜택 (+25%)',
    priceText: '$100.00 (140,000원)',
    priceCoins: 0,
    priceUsd: 100.0,
    priceKrw: 140000,
    description: '대규모 길드 토너먼트 및 110종 풀컬렉션을 위한 최고 혜택 VIP 코인 패키지.',
    shortSpec: '50,000 SNS 코인 즉시 지급 · 110종 전 영웅 즉시 수집 가능',
    actionText: '충전하기 ($100.00)',
  },
  {
    id: 'gold_exchange_5000',
    category: 'COIN',
    name: '골드 환전소 (5,000G → 1,000 SNS)',
    badge: '무과금 플레이 환전',
    priceText: '5,000 Gold',
    priceCoins: 0,
    priceUsd: 0,
    priceKrw: 0,
    description: '인게임 미니게임과 퀘스트로 획득한 5,000 골드를 1,000 SNS 코인으로 환전합니다.',
    shortSpec: '5 Gold = 1 SNS · 매일 인게임 플레이 보상 무료 환전',
    actionText: '골드 환전소 열기 (5,000G)',
  },
];

// ============================================================================
// State Management
// ============================================================================

let currentCategoryTab: ShopCategoryTab = (() => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('hero_shop_active_tab') as ShopCategoryTab | null;
    if (saved && ['ALL', 'PACK', 'GOODS', 'ITEM', 'COIN'].includes(saved)) {
      localStorage.removeItem('hero_shop_active_tab');
      return saved;
    }
  }
  return 'ALL';
})();

let activeRevealPack: PackRevealData | null = null;
let isGoldExchangeOpen = false;

// Standalone Coin Charge Modal State
let isCoinChargeModalOpen = false;
let coinChargeStep: 'country' | 'payment' | 'success' = 'country';
let selectedChargePackage: CoinPackage = COIN_PACKAGES[2];
let selectedChargeCountry: string | null = null;
let selectedPaymentMethod: string | null = null;
let chargeSuccessInfo: { amount: number; label: string; isAdRemoval?: boolean } | null = null;

// Product Detail & Instant Purchase State
export type ProductDetailStep = 'detail' | 'shipping' | 'country' | 'payment' | 'success';

let activeDetailProduct: ShopCardProduct | null = null;
let productDetailStep: ProductDetailStep = 'detail';
let detailSelectedQty = 1;
let detailSelectedSize = 'M';
let detailSelectedFaction = 'deck_water';
let detailBuyerName = '';
let detailBuyerPhone = '';
let detailBuyerAddress = '';
let detailSelectedCountry: string | null = 'ko';
let detailSelectedPayment: string | null = null;
let completedGoodsOrder: GoodsOrderRecord | null = null;

// ============================================================================
// State Getters & Setters
// ============================================================================

export function getShopCategoryTab(): ShopCategoryTab {
  return currentCategoryTab;
}

export function setShopCategoryTab(tab: ShopCategoryTab): void {
  currentCategoryTab = tab;
}

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

// ── Coin Charge Modal Controls ───────────────────────────────────────────────

export function openCoinChargeModal(packageId?: string): void {
  if (packageId) {
    const pkg = COIN_PACKAGES.find((p) => p.id === packageId);
    if (pkg) selectedChargePackage = pkg;
  }
  isCoinChargeModalOpen = true;
  coinChargeStep = 'country';
  selectedChargeCountry = null;
  selectedPaymentMethod = null;
  chargeSuccessInfo = null;
}

export function closeCoinChargeModal(): void {
  isCoinChargeModalOpen = false;
  selectedChargeCountry = null;
  selectedPaymentMethod = null;
  chargeSuccessInfo = null;
}

export function selectChargeCountry(countryCode: string): void {
  selectedChargeCountry = countryCode;
  coinChargeStep = 'payment';
}

export function backToCountrySelection(): void {
  coinChargeStep = 'country';
  selectedPaymentMethod = null;
}

export function selectChargePackage(packageId: string): void {
  const pkg = COIN_PACKAGES.find((p) => p.id === packageId);
  if (pkg) selectedChargePackage = pkg;
}

// ── Product Detail & Instant Purchase Modal Controls ─────────────────────────

export function openProductDetail(productId: string): void {
  const p = ALL_SHOP_PRODUCTS.find((item) => item.id === productId);
  if (!p) return;

  activeDetailProduct = p;
  productDetailStep = 'detail';
  detailSelectedQty = 1;
  detailSelectedSize = 'M';
  detailSelectedFaction = 'deck_water';
  detailSelectedCountry = 'ko';
  detailSelectedPayment = null;
  completedGoodsOrder = null;

  // Pre-fill existing buyer info if available
  if (typeof localStorage !== 'undefined') {
    try {
      const savedOrders = JSON.parse(localStorage.getItem('hero_goods_orders') || '[]');
      if (savedOrders.length > 0) {
        detailBuyerName = savedOrders[0].buyerName || '';
        detailBuyerPhone = savedOrders[0].buyerPhone || '';
        detailBuyerAddress = savedOrders[0].buyerAddress || '';
      }
    } catch {}
  }
}

export function closeProductDetail(): void {
  activeDetailProduct = null;
  productDetailStep = 'detail';
  completedGoodsOrder = null;
}

export function setDetailQty(qty: number): void {
  detailSelectedQty = Math.max(1, Math.min(10, qty));
}

export function setDetailSize(size: string): void {
  detailSelectedSize = size;
}

export function setDetailFaction(faction: string): void {
  detailSelectedFaction = faction;
}

export function proceedToShipping(): void {
  productDetailStep = 'shipping';
}

export function backToDetail(): void {
  productDetailStep = 'detail';
}

export function proceedToGoodsCountry(info: {
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
}): boolean {
  if (!info.buyerName.trim() || !info.buyerAddress.trim()) {
    return false;
  }
  detailBuyerName = info.buyerName.trim();
  detailBuyerPhone = info.buyerPhone.trim();
  detailBuyerAddress = info.buyerAddress.trim();
  productDetailStep = 'country';
  return true;
}

export function backToShipping(): void {
  productDetailStep = 'shipping';
}

export function selectGoodsPaymentCountry(countryCode: string): void {
  detailSelectedCountry = countryCode;
  productDetailStep = 'payment';
}

export function backToGoodsCountrySelection(): void {
  productDetailStep = 'country';
  detailSelectedPayment = null;
}

export function executeGoodsCheckout(method: string): { success: boolean; order?: GoodsOrderRecord } {
  if (!activeDetailProduct) return { success: false };

  detailSelectedPayment = method;

  const totalUsd = activeDetailProduct.priceUsd * detailSelectedQty;
  const totalKrw = activeDetailProduct.priceKrw * detailSelectedQty;

  const order: GoodsOrderRecord = {
    id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    productId: activeDetailProduct.id,
    title: activeDetailProduct.name,
    quantity: detailSelectedQty,
    size: activeDetailProduct.id === 'goods_tshirt' ? detailSelectedSize : undefined,
    faction: activeDetailProduct.id === 'goods_deck_faction' ? detailSelectedFaction : undefined,
    priceUsd: totalUsd,
    priceKrw: totalKrw,
    buyerName: detailBuyerName || '모험가',
    buyerPhone: detailBuyerPhone || '010-0000-0000',
    buyerAddress: detailBuyerAddress || '대한민국',
    country: detailSelectedCountry || 'ko',
    paymentMethod: method,
    orderedAt: Date.now(),
    status: 'paid',
  };

  try {
    const raw = localStorage.getItem('hero_goods_orders') || '[]';
    const list: GoodsOrderRecord[] = JSON.parse(raw);
    list.unshift(order);
    localStorage.setItem('hero_goods_orders', JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to record goods order', e);
  }

  completedGoodsOrder = order;
  productDetailStep = 'success';
  return { success: true, order };
}

// ============================================================================
// LocalStorage Currency Services
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

export function creditUserCoins(amount: number, type: 'earned' | 'purchased' = 'purchased'): void {
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

// ============================================================================
// Exchange & Purchase Logic
// ============================================================================

export function exchangeGoldForSns(goldAmount: number = 5000): {
  success: boolean;
  snsGranted: number;
  message: string;
} {
  const currentGold = getUserGold();
  if (currentGold < goldAmount) {
    return {
      success: false,
      snsGranted: 0,
      message: `보유 골드가 부족합니다. (현재: ${currentGold.toLocaleString()} G / 필요: ${goldAmount.toLocaleString()} G)`,
    };
  }

  const snsGranted = Math.floor(goldAmount / 5);
  setUserGold(currentGold - goldAmount);
  creditUserCoins(snsGranted, 'earned');

  return {
    success: true,
    snsGranted,
    message: `${goldAmount.toLocaleString()} 골드를 ${snsGranted.toLocaleString()} SNS 코인으로 환전하였습니다!`,
  };
}

export function executeGoldExchange(goldAmount: number = 5000) {
  return exchangeGoldForSns(goldAmount);
}

export function executeCoinCharge(method: string): { success: boolean; message: string } {
  selectedPaymentMethod = method;

  if (selectedChargePackage.isAdRemoval) {
    localStorage.setItem('hero_ad_removed', 'true');
    chargeSuccessInfo = {
      amount: 0,
      label: '광고 영구 제거 패키지',
      isAdRemoval: true,
    };
  } else {
    creditUserCoins(selectedChargePackage.amount, 'purchased');
    chargeSuccessInfo = {
      amount: selectedChargePackage.amount,
      label: selectedChargePackage.label,
    };
  }

  coinChargeStep = 'success';
  return { success: true, message: '코인 충전이 완료되었습니다.' };
}

export function executeShopPurchase(productId: string): {
  success: boolean;
  message: string;
  revealedCards?: RevealedCardMeta[];
} {
  const item = ALL_SHOP_PRODUCTS.find((p) => p.id === productId);
  if (!item) return { success: false, message: '상품을 찾을 수 없습니다.' };

  if (item.id === 'gold_exchange_5000') {
    openGoldExchangeModal();
    return { success: true, message: '환전소 모달을 엽니다.' };
  }

  if (item.category === 'COIN') {
    const pkgId = item.id.replace('coin_charge_', 'coin_');
    openCoinChargeModal(pkgId);
    return { success: true, message: '코인 충전 모달을 엽니다.' };
  }

  // Physical Goods trigger minimalist detail & checkout flow
  if (item.isPhysicalGoods) {
    openProductDetail(productId);
    return { success: true, message: '굿즈 상세 및 구매 모달을 엽니다.' };
  }

  const userCoins = getUserCoins();
  if (userCoins < item.priceCoins) {
    openCoinChargeModal();
    return {
      success: false,
      message: `SNS 코인이 부족합니다. 코인 충전소로 이동합니다.`,
    };
  }

  // Deduct Coins
  const ok = debitUserCoins(item.priceCoins);
  if (!ok) return { success: false, message: '코인 차감에 실패하였습니다.' };

  // Pack reveal logic
  if (item.category === 'PACK') {
    const minId = item.id === 'pack_normal' ? 1 : item.id === 'pack_magic' ? 20 : 60;
    const maxId = item.id === 'pack_normal' ? 50 : item.id === 'pack_magic' ? 90 : 110;
    const count = item.id === 'pack_starter_bundle' ? 5 : 3;

    const unlockedIds: number[] = [];
    while (unlockedIds.length < count) {
      const randId = Math.floor(Math.random() * (maxId - minId + 1)) + minId;
      if (!unlockedIds.includes(randId)) unlockedIds.push(randId);
    }

    const revealedCards: RevealedCardMeta[] = [];
    for (const cId of unlockedIds) {
      const isNew = !cardNurtureStore.isCardOwned(cId);
      cardNurtureStore.addCard(cId);
      const cardDb = CARD_DATABASE[cId];
      const asset = getCharacterAsset(cId);

      const rawRarity = cardDb?.rarity || asset.rarity || 'bronze';
      const rarity = (rawRarity.charAt(0).toUpperCase() + rawRarity.slice(1)) as
        | 'Bronze'
        | 'Silver'
        | 'Gold'
        | 'Boss';

      revealedCards.push({
        cardId: cId,
        nameKo: cardDb?.name || asset.nameKo,
        nameEn: asset.nameEn,
        rarity,
        faction: cardDb?.element || asset.element,
        power: cardDb?.power || asset.power,
        top: cardDb?.top || 5,
        right: cardDb?.right || 5,
        bottom: cardDb?.bottom || 5,
        left: cardDb?.left || 5,
        bustUrl: asset.bustUrl,
        seatUrl: asset.seatUrl,
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
      message: `${item.name}을 개봉하였습니다!`,
      revealedCards,
    };
  }

  // Item / Digital Content logic
  if (item.id === 'ad_remove') {
    localStorage.setItem('hero_ad_removed', 'true');
  } else if (item.id === 'item_pack') {
    const raw = parseInt(localStorage.getItem('hero_exp_potions') || '0', 10);
    localStorage.setItem('hero_exp_potions', String(raw + 5));
  } else if (item.id === 'official_novel') {
    localStorage.setItem('hero_novel_unlocked', 'true');
  } else if (item.id === 'official_movie') {
    localStorage.setItem('hero_movie_unlocked', 'true');
  }

  return { success: true, message: `${item.name}을 성공적으로 구매하였습니다!` };
}

// ============================================================================
// Modal Renderers: Pack Reveal & Gold Exchange
// ============================================================================

export function renderPackRevealModal(): string {
  if (!activeRevealPack) return '';

  return `
    <div
      id="pack-reveal-modal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 font-mono select-none"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="pack-reveal-backdrop"
        data-action="close-pack-reveal"
        class="absolute inset-0 cursor-pointer"
        aria-hidden="true"
      ></div>

      <div class="relative z-10 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-2xl w-full p-6 shadow-none max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          data-action="close-pack-reveal"
          class="absolute top-4 right-4 min-h-[44px] min-w-[44px] text-stone-500 font-bold hover:text-stone-900 cursor-pointer flex items-center justify-center text-sm"
          aria-label="닫기"
        >
          [x]
        </button>

        <div class="text-center mb-6">
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm">
            카드팩 개봉 결과
          </span>
          <h2 class="text-xl font-black mt-2 text-[#201d1d]">
            ${activeRevealPack.packName} 획득 영웅
          </h2>
          <p class="text-xs text-stone-500 mt-1">
            획득한 카드가 보관함에 즉시 등록되었습니다.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          ${activeRevealPack.cards
            .map(
              (c) => `
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-3 rounded-none flex flex-col items-center text-center space-y-2 relative">
              ${
                c.isNew
                  ? `
                <div class="absolute top-2 left-2 px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-black uppercase rounded-xs">
                  NEW
                </div>
              `
                  : ''
              }
              <div class="w-full h-36 bg-[#f1eeee] flex items-center justify-center p-2 overflow-hidden">
                <img
                  src="${c.bustUrl}"
                  alt="${c.nameKo}"
                  class="max-h-full object-contain"
                  onerror="this.src='${c.seatUrl}'; this.onerror=null;"
                />
              </div>

              <div class="w-full space-y-0.5">
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

        <div class="flex justify-end pt-2 border-t border-[rgba(15,0,0,0.08)]">
          <button
            type="button"
            data-action="confirm-pack-reveal"
            class="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[44px] hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center shadow-none"
          >
            확인 및 마이덱으로 이동
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
      <div
        id="gold-exchange-backdrop"
        data-action="close-gold-exchange"
        class="absolute inset-0 cursor-pointer"
        aria-hidden="true"
      ></div>

      <div class="relative z-10 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-md w-full p-6 shadow-none">
        <button
          type="button"
          data-action="close-gold-exchange"
          class="absolute top-4 right-4 min-h-[44px] min-w-[44px] text-stone-500 font-bold hover:text-stone-900 cursor-pointer flex items-center justify-center text-sm"
          aria-label="닫기"
        >
          [x]
        </button>

        <div class="mb-4">
          <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm">
            골드 환전소
          </span>
          <h2 class="text-lg font-bold m-0 mt-1">
            골드 → SNS 코인 환전
          </h2>
          <p class="text-xs text-stone-500 m-0 mt-0.5">
            인게임 골드를 상점 전용 SNS 코인으로 교환합니다.
          </p>
        </div>

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
// Standalone Coin Charge Modal (나라선택 / 페이선택)
// ============================================================================

export function renderCoinChargeModal(): string {
  if (!isCoinChargeModalOpen) return '';

  const country = COUNTRIES.find((c) => c.code === selectedChargeCountry);
  const pkg = selectedChargePackage;

  return `
    <div
      id="coin-charge-modal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 font-mono select-none"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="coin-charge-backdrop"
        data-action="close-coin-charge-modal"
        class="absolute inset-0 cursor-pointer"
        aria-hidden="true"
      ></div>

      <div class="relative z-10 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-lg w-full max-h-[88vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
        <button
          type="button"
          data-action="close-coin-charge-modal"
          class="absolute top-4 right-4 min-h-[44px] min-w-[44px] text-stone-500 font-bold hover:text-stone-900 cursor-pointer flex items-center justify-center text-sm border border-transparent hover:border-[rgba(15,0,0,0.12)] rounded-sm"
          aria-label="닫기"
        >
          [x]
        </button>

        <div class="border-b border-[rgba(15,0,0,0.1)] pb-3">
          <div class="flex items-center gap-2">
            ${
              coinChargeStep === 'payment'
                ? `
              <button
                type="button"
                data-action="back-to-country-selection"
                class="min-h-[40px] px-2.5 py-1.5 bg-[#f1eeee] hover:bg-[#e8e5e5] text-xs font-bold text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-sm flex items-center gap-1 cursor-pointer mr-1"
              >
                ← 국가 다시 선택
              </button>
            `
                : ''
            }
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm">
                SNS 코인 충전소
              </span>
              <h2 class="text-base sm:text-lg font-black text-[#201d1d] m-0 mt-1">
                ${
                  coinChargeStep === 'country'
                    ? '1단계: 결제 국가 선택'
                    : coinChargeStep === 'payment'
                      ? '2단계: 결제 수단(페이) 선택'
                      : '충전 완료'
                }
              </h2>
            </div>
          </div>
        </div>

        ${
          coinChargeStep !== 'success'
            ? `
          <div class="space-y-1.5">
            <div class="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
              충전 패키지 선택:
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              ${COIN_PACKAGES.map(
                (p) => `
                <button
                  type="button"
                  data-action="select-charge-package"
                  data-package-id="${p.id}"
                  class="p-2 text-left border rounded-sm min-h-[44px] cursor-pointer transition-colors ${
                    p.id === pkg.id
                      ? 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc]'
                      : 'border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] text-[#201d1d] hover:border-stone-400'
                  }"
                >
                  <div class="text-xs font-black truncate">${p.label}</div>
                  <div class="text-[10px] opacity-80">$${p.priceUsd.toFixed(2)} (${p.priceKrw.toLocaleString()}원)</div>
                </button>
              `
              ).join('')}
            </div>
          </div>

          <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none flex items-center justify-between text-xs">
            <div>
              <span class="font-bold text-[#201d1d]">${pkg.label}</span>
              <span class="text-stone-500 ml-1.5 text-[11px]">${pkg.bonusText || ''}</span>
            </div>
            <div class="text-right font-black text-[#201d1d]">
              $${pkg.priceUsd.toFixed(2)} USD / ${pkg.priceKrw.toLocaleString()} KRW
            </div>
          </div>
        `
            : ''
        }

        ${
          coinChargeStep === 'country'
            ? `
          <div class="space-y-3">
            <button
              type="button"
              data-action="execute-coin-charge"
              data-method="crypto"
              class="w-full min-h-[44px] p-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-sm transition-all flex items-center justify-between group cursor-pointer border border-amber-700 shadow-none"
            >
              <div class="flex items-center gap-2.5 text-left">
                <span class="text-lg">⚡</span>
                <div>
                  <div class="font-black text-xs sm:text-sm">암호화폐 결제 (USDT / BTC / ETH)</div>
                  <div class="text-[10px] text-amber-100 font-medium">국가 무관 전 세계 즉시 결제 및 코인 충전</div>
                </div>
              </div>
              <span class="text-xs font-bold bg-white/20 px-2 py-1 rounded-sm">즉시 결제 →</span>
            </button>

            <div class="text-[11px] font-bold text-stone-500 uppercase tracking-wider pt-1">
              결제 국가 선택 (지원 통화 및 간편결제 연동):
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              ${COUNTRIES.map(
                (c) => `
                <button
                  type="button"
                  data-action="select-charge-country"
                  data-country-code="${c.code}"
                  class="w-full min-h-[44px] text-left p-3 border border-[rgba(15,0,0,0.12)] rounded-sm hover:border-[#201d1d] hover:bg-[#f1eeee] transition-all flex items-center justify-between cursor-pointer"
                >
                  <div class="flex items-center gap-2.5">
                    <span class="text-xl">${c.flag}</span>
                    <span class="font-bold text-xs text-[#201d1d]">${c.name}</span>
                  </div>
                  <span class="text-[10px] font-mono text-stone-500">${c.currency}</span>
                </button>
              `
              ).join('')}
            </div>
          </div>
        `
            : ''
        }

        ${
          coinChargeStep === 'payment'
            ? `
          <div class="space-y-4">
            <div class="p-2.5 bg-stone-100 border border-[rgba(15,0,0,0.1)] rounded-none flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="text-lg">${country?.flag || '🌐'}</span>
                <span class="font-bold text-[#201d1d]">${country?.name || '글로벌'}</span>
              </div>
              <span class="text-[11px] text-stone-500">결제 통화: ${country?.currency || 'USD'}</span>
            </div>

            <div class="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
              사용할 결제 수단을 선택하세요:
            </div>

            <div class="flex flex-col gap-2.5">
              ${
                selectedChargeCountry === 'ko'
                  ? `
                <button
                  type="button"
                  data-action="execute-coin-charge"
                  data-method="payapp_card"
                  class="w-full min-h-[44px] py-3 px-4 bg-[#1e58ff] hover:bg-[#1542c7] text-white font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-[#1542c7] shadow-none"
                >
                  <div class="flex items-center gap-2"><span>💳</span><span>국내 신용/체크카드 (PayApp)</span></div>
                  <span class="text-[11px] opacity-90">${pkg.priceKrw.toLocaleString()}원 결제 →</span>
                </button>

                <button
                  type="button"
                  data-action="execute-coin-charge"
                  data-method="kakaopay"
                  class="w-full min-h-[44px] py-3 px-4 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-[#E6CF00] shadow-none"
                >
                  <div class="flex items-center gap-2"><span>🟡</span><span>카카오페이 (Kakao Pay)</span></div>
                  <span class="text-[11px] opacity-90">${pkg.priceKrw.toLocaleString()}원 간편결제 →</span>
                </button>

                <button
                  type="button"
                  data-action="execute-coin-charge"
                  data-method="naverpay"
                  class="w-full min-h-[44px] py-3 px-4 bg-[#03C75A] hover:bg-[#02b351] text-white font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-[#029a46] shadow-none"
                >
                  <div class="flex items-center gap-2"><span>🟢</span><span>네이버페이 (Naver Pay)</span></div>
                  <span class="text-[11px] opacity-90">${pkg.priceKrw.toLocaleString()}원 간편결제 →</span>
                </button>

                <button
                  type="button"
                  data-action="execute-coin-charge"
                  data-method="applepay"
                  class="w-full min-h-[44px] py-3 px-4 bg-[#000000] hover:bg-stone-800 text-white font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-black shadow-none"
                >
                  <div class="flex items-center gap-2"><span>🍎</span><span>Apple Pay</span></div>
                  <span class="text-[11px] opacity-90">원터치 결제 →</span>
                </button>
              `
                  : `
                <button
                  type="button"
                  data-action="execute-coin-charge"
                  data-method="paypal"
                  class="w-full min-h-[44px] py-3 px-4 bg-[#003087] hover:bg-[#002466] text-white font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-[#002466]"
                >
                  <div class="flex items-center gap-2"><span>🅿️</span><span>PayPal Express Checkout</span></div>
                  <span class="text-[11px] opacity-90">$${pkg.priceUsd.toFixed(2)} USD →</span>
                </button>

                <button
                  type="button"
                  data-action="execute-coin-charge"
                  data-method="applepay"
                  class="w-full min-h-[44px] py-3 px-4 bg-[#000000] hover:bg-stone-800 text-white font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-black"
                >
                  <div class="flex items-center gap-2"><span>🍎</span><span>Apple Pay</span></div>
                  <span class="text-[11px] opacity-90">Instant Checkout →</span>
                </button>

                <button
                  type="button"
                  data-action="execute-coin-charge"
                  data-method="global_card"
                  class="w-full min-h-[44px] py-3 px-4 bg-[#201d1d] hover:bg-stone-800 text-white font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-stone-800"
                >
                  <div class="flex items-center gap-2"><span>💳</span><span>Credit Card (Visa / Master)</span></div>
                  <span class="text-[11px] opacity-90">Proceed →</span>
                </button>
              `
              }

              <button
                type="button"
                data-action="execute-coin-charge"
                data-method="crypto"
                class="w-full min-h-[44px] py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-amber-700 mt-1"
              >
                <div class="flex items-center gap-2"><span>⚡</span><span>암호화폐 결제 (USDT / BTC / ETH)</span></div>
                <span class="text-[11px] opacity-90">Web3 지갑 결제 →</span>
              </button>

              <button
                type="button"
                data-action="execute-coin-charge"
                data-method="test_sim"
                class="w-full min-h-[44px] py-2.5 px-4 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-stone-400 mt-2"
              >
                <div class="flex items-center gap-2"><span>🧪</span><span>[개발자/시뮬레이션] 즉시 충전 (SIM)</span></div>
                <span class="text-[11px] text-stone-600">즉시 계정 반영</span>
              </button>
            </div>
          </div>
        `
            : ''
        }

        ${
          coinChargeStep === 'success' && chargeSuccessInfo
            ? `
          <div class="py-4 text-center space-y-4">
            <div class="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center text-2xl font-bold border border-emerald-300">
              ✓
            </div>

            <div class="space-y-1">
              <h3 class="text-lg font-black text-[#201d1d] m-0">코인 충전 완료!</h3>
              <p class="text-xs text-stone-600">
                ${
                  chargeSuccessInfo.isAdRemoval
                    ? '광고 영구 제거 패키지가 성공적으로 적용되었습니다.'
                    : `<strong>+${chargeSuccessInfo.amount.toLocaleString()} SNS 코인</strong>이 계정에 정상 지급되었습니다.`
                }
              </p>
            </div>

            <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-xs space-y-1">
              <div class="flex justify-between text-stone-500"><span>충전 상품:</span><span class="font-bold text-[#201d1d]">${chargeSuccessInfo.label}</span></div>
              <div class="flex justify-between text-stone-500"><span>현재 보유 SNS 코인:</span><span class="font-black text-emerald-700">${getUserCoins().toLocaleString()} SNS</span></div>
            </div>

            <button
              type="button"
              data-action="close-coin-charge-modal"
              class="w-full py-3 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] font-bold text-xs rounded-sm min-h-[44px] cursor-pointer shadow-none flex items-center justify-center"
            >
              확인 및 상점으로 돌아가기
            </button>
          </div>
        `
            : ''
        }
      </div>
    </div>
  `;
}

// ============================================================================
// Minimalist Product Detail & Instant Purchase Modal (상세보기 & 즉시구매)
// ============================================================================

export function renderProductDetailModal(): string {
  if (!activeDetailProduct) return '';

  const p = activeDetailProduct;
  const isGoods = Boolean(p.isPhysicalGoods);
  const totalUsd = p.priceUsd * detailSelectedQty;
  const totalKrw = p.priceKrw * detailSelectedQty;
  const country = COUNTRIES.find((c) => c.code === detailSelectedCountry);

  return `
    <div
      id="product-detail-modal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 font-mono select-none"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="product-detail-backdrop"
        data-action="close-product-detail"
        class="absolute inset-0 cursor-pointer"
        aria-hidden="true"
      ></div>

      <div class="relative z-10 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-lg w-full max-h-[88vh] overflow-y-auto p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
        <!-- Close Button -->
        <button
          type="button"
          data-action="close-product-detail"
          class="absolute top-4 right-4 min-h-[44px] min-w-[44px] text-stone-500 font-bold hover:text-stone-900 cursor-pointer flex items-center justify-center text-sm border border-transparent hover:border-[rgba(15,0,0,0.12)] rounded-sm"
          aria-label="닫기"
        >
          [x]
        </button>

        <!-- STEP 1: Minimalist Product Detail -->
        ${
          productDetailStep === 'detail'
            ? `
          <div class="space-y-4">
            <!-- Header Tag -->
            <div class="border-b border-[rgba(15,0,0,0.08)] pb-2 flex items-center gap-2">
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm">
                ${p.category}
              </span>
              <span class="text-xs text-stone-500 font-bold">${p.badge}</span>
            </div>

            <!-- Clean Image Preview -->
            <div class="w-full h-44 sm:h-52 bg-[#f8f7f7] border border-[rgba(15,0,0,0.1)] rounded-none flex items-center justify-center p-3 overflow-hidden">
              <img
                src="${p.image || '/mug.png'}"
                alt="${p.name}"
                class="max-h-full max-w-full object-contain filter drop-shadow-sm"
              />
            </div>

            <!-- Title & Price (Minimalist) -->
            <div class="space-y-1">
              <h2 class="text-lg sm:text-xl font-black text-[#201d1d] m-0">
                ${p.name}
              </h2>
              <div class="flex items-baseline gap-2">
                <span class="text-lg font-black text-[#201d1d] font-mono">
                  ${p.priceText}
                </span>
                ${
                  detailSelectedQty > 1
                    ? `
                  <span class="text-xs text-stone-500">
                    (총계: $${totalUsd.toFixed(2)} / ${totalKrw.toLocaleString()}원)
                  </span>
                `
                    : ''
                }
              </div>
            </div>

            <!-- Condensed Spec / Summary (최소화된 핵심 설명) -->
            <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] rounded-none text-xs text-stone-700 space-y-1">
              <div class="font-bold text-[#201d1d]">${p.shortSpec}</div>
              <div class="text-[11px] text-stone-500 leading-relaxed">${p.description}</div>
            </div>

            <!-- Options Selection (수량 & 옵션) -->
            <div class="space-y-2 pt-1 border-t border-[rgba(15,0,0,0.08)]">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-bold text-stone-600 uppercase mb-1">수량 선택</label>
                  <select
                    id="detail-qty-select"
                    data-action="change-detail-qty"
                    class="w-full min-h-[44px] px-3 bg-white border border-[rgba(15,0,0,0.2)] text-xs rounded-sm font-mono cursor-pointer"
                  >
                    <option value="1" ${detailSelectedQty === 1 ? 'selected' : ''}>1개</option>
                    <option value="2" ${detailSelectedQty === 2 ? 'selected' : ''}>2개</option>
                    <option value="3" ${detailSelectedQty === 3 ? 'selected' : ''}>3개</option>
                    <option value="5" ${detailSelectedQty === 5 ? 'selected' : ''}>5개</option>
                  </select>
                </div>

                ${
                  p.id === 'goods_tshirt'
                    ? `
                  <div>
                    <label class="block text-[10px] font-bold text-stone-600 uppercase mb-1">사이즈</label>
                    <select
                      id="detail-size-select"
                      data-action="change-detail-size"
                      class="w-full min-h-[44px] px-3 bg-white border border-[rgba(15,0,0,0.2)] text-xs rounded-sm font-mono cursor-pointer"
                    >
                      <option value="S" ${detailSelectedSize === 'S' ? 'selected' : ''}>S (90)</option>
                      <option value="M" ${detailSelectedSize === 'M' ? 'selected' : ''}>M (95~100)</option>
                      <option value="L" ${detailSelectedSize === 'L' ? 'selected' : ''}>L (105)</option>
                    </select>
                  </div>
                `
                    : p.id === 'goods_deck_faction'
                      ? `
                  <div>
                    <label class="block text-[10px] font-bold text-stone-600 uppercase mb-1">종족 덱 선택</label>
                    <select
                      id="detail-faction-select"
                      data-action="change-detail-faction"
                      class="w-full min-h-[44px] px-2 bg-white border border-[rgba(15,0,0,0.2)] text-xs rounded-sm font-mono cursor-pointer"
                    >
                      <option value="deck_water" ${detailSelectedFaction === 'deck_water' ? 'selected' : ''}>물의 원소 덱</option>
                      <option value="deck_fire" ${detailSelectedFaction === 'deck_fire' ? 'selected' : ''}>불의 원소 덱</option>
                      <option value="deck_wind" ${detailSelectedFaction === 'deck_wind' ? 'selected' : ''}>바람의 원소 덱</option>
                      <option value="deck_earth" ${detailSelectedFaction === 'deck_earth' ? 'selected' : ''}>대지의 원소 덱</option>
                      <option value="deck_human" ${detailSelectedFaction === 'deck_human' ? 'selected' : ''}>인간 전사 덱</option>
                      <option value="deck_undead" ${detailSelectedFaction === 'deck_undead' ? 'selected' : ''}>언데드 암흑 덱</option>
                      <option value="deck_elf" ${detailSelectedFaction === 'deck_elf' ? 'selected' : ''}>엘프 마법사 덱</option>
                    </select>
                  </div>
                `
                      : `
                  <div>
                    <label class="block text-[10px] font-bold text-stone-600 uppercase mb-1">배송 방식</label>
                    <div class="min-h-[44px] px-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-xs rounded-sm font-mono flex items-center text-stone-600">
                      안심 우체국 택배
                    </div>
                  </div>
                `
                }
              </div>
            </div>

            <!-- Instant Buy Action Button -->
            <div class="pt-2 border-t border-[rgba(15,0,0,0.08)]">
              <button
                type="button"
                data-action="proceed-to-shipping"
                class="w-full py-3.5 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] font-black text-sm rounded-sm min-h-[44px] cursor-pointer shadow-none flex items-center justify-center gap-2 transition-colors"
              >
                <span>즉시 구매하기</span>
                <span>·</span>
                <span>$${totalUsd.toFixed(2)} (${totalKrw.toLocaleString()}원) →</span>
              </button>
            </div>
          </div>
        `
            : ''
        }

        <!-- STEP 2: Minimal Shipping Information Input -->
        ${
          productDetailStep === 'shipping'
            ? `
          <div class="space-y-4">
            <div class="border-b border-[rgba(15,0,0,0.08)] pb-2 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  data-action="back-to-detail"
                  class="min-h-[38px] px-2 py-1 bg-[#f1eeee] text-xs font-bold rounded-sm border border-[rgba(15,0,0,0.12)] cursor-pointer"
                >
                  ← 상품으로
                </button>
                <h3 class="text-sm font-black text-[#201d1d] m-0">배송지 정보 입력</h3>
              </div>
              <span class="text-xs font-bold text-[#201d1d]">$${totalUsd.toFixed(2)} USD</span>
            </div>

            <form id="goods-shipping-form" data-action="submit-goods-shipping" class="space-y-3">
              <div>
                <label class="block text-[10px] font-bold text-stone-600 uppercase mb-1">수령인 성함 (이름)</label>
                <input
                  type="text"
                  name="buyer_name"
                  value="${detailBuyerName}"
                  placeholder="예: 홍길동"
                  required
                  class="w-full min-h-[44px] px-3 bg-white border border-[rgba(15,0,0,0.2)] text-xs rounded-sm font-mono focus:border-[#201d1d] focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-stone-600 uppercase mb-1">연락처 (휴대전화)</label>
                <input
                  type="tel"
                  name="buyer_phone"
                  value="${detailBuyerPhone}"
                  placeholder="예: 010-1234-5678"
                  required
                  class="w-full min-h-[44px] px-3 bg-white border border-[rgba(15,0,0,0.2)] text-xs rounded-sm font-mono focus:border-[#201d1d] focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold text-stone-600 uppercase mb-1">배송지 주소 (도로명 / 상세 주소)</label>
                <textarea
                  name="buyer_address"
                  rows="2"
                  placeholder="예: 서울특별시 강남구 테헤란로 123, 4층"
                  required
                  class="w-full p-2.5 bg-white border border-[rgba(15,0,0,0.2)] text-xs rounded-sm font-mono resize-none focus:border-[#201d1d] focus:outline-none"
                >${detailBuyerAddress}</textarea>
              </div>

              <div class="pt-2 border-t border-[rgba(15,0,0,0.08)] flex items-center gap-2">
                <button
                  type="button"
                  data-action="back-to-detail"
                  class="flex-1 py-3 bg-[#f1eeee] text-[#201d1d] font-bold text-xs rounded-sm min-h-[44px] cursor-pointer border border-[rgba(15,0,0,0.12)]"
                >
                  이전
                </button>
                <button
                  type="submit"
                  class="flex-2 py-3 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] font-black text-xs rounded-sm min-h-[44px] cursor-pointer"
                >
                  결제 수단(나라/페이) 선택 →
                </button>
              </div>
            </form>
          </div>
        `
            : ''
        }

        <!-- STEP 3: Country Selection (상점 코인 충전과 100% 동일) -->
        ${
          productDetailStep === 'country'
            ? `
          <div class="space-y-3">
            <div class="border-b border-[rgba(15,0,0,0.08)] pb-2 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  data-action="back-to-shipping"
                  class="min-h-[38px] px-2 py-1 bg-[#f1eeee] text-xs font-bold rounded-sm border border-[rgba(15,0,0,0.12)] cursor-pointer"
                >
                  ← 배송지로
                </button>
                <h3 class="text-sm font-black text-[#201d1d] m-0">결제 국가 선택</h3>
              </div>
              <span class="text-xs font-bold text-[#201d1d]">$${totalUsd.toFixed(2)} USD</span>
            </div>

            <!-- Global Crypto Quick Option -->
            <button
              type="button"
              data-action="execute-goods-checkout"
              data-method="crypto"
              class="w-full min-h-[44px] p-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-sm transition-all flex items-center justify-between group cursor-pointer border border-amber-700 shadow-none"
            >
              <div class="flex items-center gap-2.5 text-left">
                <span class="text-lg">⚡</span>
                <div>
                  <div class="font-black text-xs">암호화폐 결제 (USDT / BTC / ETH)</div>
                  <div class="text-[10px] text-amber-100 font-medium">국가 무관 전 세계 즉시 결제</div>
                </div>
              </div>
              <span class="text-xs font-bold bg-white/20 px-2 py-1 rounded-sm">즉시 결제 →</span>
            </button>

            <div class="text-[11px] font-bold text-stone-500 uppercase tracking-wider pt-1">
              결제 국가 선택 (지원 통화 및 간편결제 연동):
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              ${COUNTRIES.map(
                (c) => `
                <button
                  type="button"
                  data-action="select-goods-country"
                  data-country-code="${c.code}"
                  class="w-full min-h-[44px] text-left p-3 border border-[rgba(15,0,0,0.12)] rounded-sm hover:border-[#201d1d] hover:bg-[#f1eeee] transition-all flex items-center justify-between cursor-pointer"
                >
                  <div class="flex items-center gap-2.5">
                    <span class="text-xl">${c.flag}</span>
                    <span class="font-bold text-xs text-[#201d1d]">${c.name}</span>
                  </div>
                  <span class="text-[10px] font-mono text-stone-500">${c.currency}</span>
                </button>
              `
              ).join('')}
            </div>
          </div>
        `
            : ''
        }

        <!-- STEP 4: Payment Method Selection (페이선택) -->
        ${
          productDetailStep === 'payment'
            ? `
          <div class="space-y-4">
            <div class="border-b border-[rgba(15,0,0,0.08)] pb-2 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  data-action="back-to-goods-country"
                  class="min-h-[38px] px-2 py-1 bg-[#f1eeee] text-xs font-bold rounded-sm border border-[rgba(15,0,0,0.12)] cursor-pointer"
                >
                  ← 국가 다시 선택
                </button>
                <h3 class="text-sm font-black text-[#201d1d] m-0">결제 수단 선택</h3>
              </div>
              <span class="text-xs font-bold text-[#201d1d]">${country?.flag || ''} ${country?.currency || 'USD'}</span>
            </div>

            <div class="p-2.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.1)] rounded-none text-xs space-y-1">
              <div class="flex justify-between">
                <span class="text-stone-500">주문 상품:</span>
                <span class="font-bold text-[#201d1d]">${p.name} (x${detailSelectedQty})</span>
              </div>
              <div class="flex justify-between">
                <span class="text-stone-500">배송 수령인:</span>
                <span class="font-bold text-[#201d1d]">${detailBuyerName} (${detailBuyerPhone})</span>
              </div>
              <div class="flex justify-between">
                <span class="text-stone-500">총 결제 금액:</span>
                <span class="font-black text-[#201d1d]">$${totalUsd.toFixed(2)} USD / ${totalKrw.toLocaleString()} KRW</span>
              </div>
            </div>

            <div class="flex flex-col gap-2.5">
              ${
                detailSelectedCountry === 'ko'
                  ? `
                <button
                  type="button"
                  data-action="execute-goods-checkout"
                  data-method="payapp_card"
                  class="w-full min-h-[44px] py-3 px-4 bg-[#1e58ff] hover:bg-[#1542c7] text-white font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-[#1542c7]"
                >
                  <div class="flex items-center gap-2"><span>💳</span><span>국내 신용/체크카드 (PayApp)</span></div>
                  <span class="text-[11px] opacity-90">${totalKrw.toLocaleString()}원 결제 →</span>
                </button>

                <button
                  type="button"
                  data-action="execute-goods-checkout"
                  data-method="kakaopay"
                  class="w-full min-h-[44px] py-3 px-4 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-[#E6CF00]"
                >
                  <div class="flex items-center gap-2"><span>🟡</span><span>카카오페이 (Kakao Pay)</span></div>
                  <span class="text-[11px] opacity-90">${totalKrw.toLocaleString()}원 간편결제 →</span>
                </button>

                <button
                  type="button"
                  data-action="execute-goods-checkout"
                  data-method="naverpay"
                  class="w-full min-h-[44px] py-3 px-4 bg-[#03C75A] hover:bg-[#02b351] text-white font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-[#029a46]"
                >
                  <div class="flex items-center gap-2"><span>🟢</span><span>네이버페이 (Naver Pay)</span></div>
                  <span class="text-[11px] opacity-90">${totalKrw.toLocaleString()}원 간편결제 →</span>
                </button>

                <button
                  type="button"
                  data-action="execute-goods-checkout"
                  data-method="applepay"
                  class="w-full min-h-[44px] py-3 px-4 bg-[#000000] hover:bg-stone-800 text-white font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-black"
                >
                  <div class="flex items-center gap-2"><span>🍎</span><span>Apple Pay</span></div>
                  <span class="text-[11px] opacity-90">원터치 결제 →</span>
                </button>
              `
                  : `
                <button
                  type="button"
                  data-action="execute-goods-checkout"
                  data-method="paypal"
                  class="w-full min-h-[44px] py-3 px-4 bg-[#003087] hover:bg-[#002466] text-white font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-[#002466]"
                >
                  <div class="flex items-center gap-2"><span>🅿️</span><span>PayPal Express Checkout</span></div>
                  <span class="text-[11px] opacity-90">$${totalUsd.toFixed(2)} USD →</span>
                </button>

                <button
                  type="button"
                  data-action="execute-goods-checkout"
                  data-method="applepay"
                  class="w-full min-h-[44px] py-3 px-4 bg-[#000000] hover:bg-stone-800 text-white font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-black"
                >
                  <div class="flex items-center gap-2"><span>🍎</span><span>Apple Pay</span></div>
                  <span class="text-[11px] opacity-90">Instant Checkout →</span>
                </button>

                <button
                  type="button"
                  data-action="execute-goods-checkout"
                  data-method="global_card"
                  class="w-full min-h-[44px] py-3 px-4 bg-[#201d1d] hover:bg-stone-800 text-white font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-stone-800"
                >
                  <div class="flex items-center gap-2"><span>💳</span><span>Credit Card (Visa / Master)</span></div>
                  <span class="text-[11px] opacity-90">Proceed →</span>
                </button>
              `
              }

              <button
                type="button"
                data-action="execute-goods-checkout"
                data-method="crypto"
                class="w-full min-h-[44px] py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-amber-700 mt-1"
              >
                <div class="flex items-center gap-2"><span>⚡</span><span>암호화폐 결제 (USDT / BTC / ETH)</span></div>
                <span class="text-[11px] opacity-90">Web3 지갑 결제 →</span>
              </button>

              <button
                type="button"
                data-action="execute-goods-checkout"
                data-method="test_sim"
                class="w-full min-h-[44px] py-2.5 px-4 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-sm flex items-center justify-between cursor-pointer border border-stone-400 mt-2"
              >
                <div class="flex items-center gap-2"><span>🧪</span><span>[개발자/시뮬레이션] 즉시 주문 승인 (SIM)</span></div>
                <span class="text-[11px] text-stone-600">카드결제 없이 주문 확정</span>
              </button>
            </div>
          </div>
        `
            : ''
        }

        <!-- STEP 5: Order Completed Celebration Screen -->
        ${
          productDetailStep === 'success' && completedGoodsOrder
            ? `
          <div class="py-4 text-center space-y-4">
            <div class="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center text-2xl font-bold border border-emerald-300">
              ✓
            </div>

            <div class="space-y-1">
              <h3 class="text-lg font-black text-[#201d1d] m-0">굿즈 주문 및 결제 완료!</h3>
              <p class="text-xs text-stone-600">주문서가 정상 접수되었으며 배송 준비가 시작됩니다.</p>
            </div>

            <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-xs space-y-1.5 text-left">
              <div class="flex justify-between"><span class="text-stone-500">주문 번호:</span><span class="font-bold">${completedGoodsOrder.id}</span></div>
              <div class="flex justify-between"><span class="text-stone-500">주문 상품:</span><span class="font-bold">${completedGoodsOrder.title} (x${completedGoodsOrder.quantity})</span></div>
              <div class="flex justify-between"><span class="text-stone-500">결제 금액:</span><span class="font-black text-emerald-700">$${completedGoodsOrder.priceUsd.toFixed(2)} USD (${completedGoodsOrder.priceKrw.toLocaleString()}원)</span></div>
              <div class="flex justify-between"><span class="text-stone-500">수령인:</span><span class="font-bold">${completedGoodsOrder.buyerName}</span></div>
              <div class="flex justify-between"><span class="text-stone-500">배송지:</span><span class="font-bold truncate max-w-[200px]">${completedGoodsOrder.buyerAddress}</span></div>
            </div>

            <button
              type="button"
              data-action="close-product-detail"
              class="w-full py-3.5 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] font-black text-xs rounded-sm min-h-[44px] cursor-pointer"
            >
              확인 및 상점으로 돌아가기
            </button>
          </div>
        `
            : ''
        }
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
  const activeTab = currentCategoryTab;

  // Filter products by selected category
  const filteredProducts =
    activeTab === 'ALL'
      ? ALL_SHOP_PRODUCTS
      : ALL_SHOP_PRODUCTS.filter((item) => item.category === activeTab);

  const packModal = renderPackRevealModal();
  const exchangeModal = renderGoldExchangeModal();
  const coinChargeModal = renderCoinChargeModal();
  const detailModal = renderProductDetailModal();

  return `
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 font-mono text-[#201d1d] select-none">
      <!-- Top Shop Header & Balance Bar -->
      <section class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 sm:p-8 rounded-none shadow-none space-y-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[rgba(15,0,0,0.08)] gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-wider uppercase mb-2">
              <span>SNS히어로 공식 상점 &amp; 굿즈 몰</span>
              <span class="text-stone-400">·</span>
              <span>단일 페이지 #shop 통합</span>
            </div>
            <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-[#201d1d] m-0">
              상점 &amp; 공식 굿즈 몰 (Shop &amp; Merch)
            </h1>
            <p class="text-xs sm:text-sm text-stone-600 mt-1 m-0">
              카드팩, 실물 TCG 굿즈, 육성 부스터 아이템 및 SNS 코인을 충전하고 구매할 수 있습니다.
            </p>
          </div>

          <!-- Currency & Recharge Bar -->
          <div class="flex flex-wrap items-center gap-3 p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none">
            <div class="text-right">
              <div class="text-[10px] text-stone-500 uppercase tracking-wider">
                보유 골드: <span class="font-bold text-[#201d1d]">${gold.toLocaleString()} G</span>
              </div>
              <div class="text-base sm:text-lg font-black text-[#201d1d]">
                ${coins.toLocaleString()} SNS
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <button
                type="button"
                data-action="open-coin-charge-modal"
                class="px-3.5 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center whitespace-nowrap cursor-pointer shadow-none"
              >
                + 코인 충전
              </button>
              <button
                type="button"
                data-action="open-gold-exchange"
                class="px-3 py-2 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] flex items-center justify-center whitespace-nowrap cursor-pointer"
              >
                골드 환전소
              </button>
            </div>
          </div>
        </div>

        <!-- Category Tab Bar (원본 상점 기준 5대 카테고리 분할) -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[rgba(15,0,0,0.08)]">
          ${SHOP_CATEGORY_TABS.map(
            (tab) => `
            <button
              type="button"
              data-action="switch-shop-tab"
              data-tab="${tab.key}"
              class="px-4 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider min-h-[44px] cursor-pointer whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                tab.key === activeTab
                  ? 'bg-[#201d1d] text-[#fdfcfc] border border-[#201d1d]'
                  : 'bg-[#f8f7f7] text-[#201d1d] border border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee]'
              }"
            >
              <span>${tab.icon}</span>
              <span>${tab.label}</span>
            </button>
          `
          ).join('')}
        </div>
      </section>

      <!-- Products Grid -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        ${filteredProducts
          .map((item) => {
            const isGoods = item.category === 'GOODS';
            const isCoin = item.category === 'COIN';

            return `
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-5 sm:p-6 rounded-none flex flex-col justify-between space-y-4 hover:border-[#201d1d] transition-colors">
              <div class="space-y-2.5">
                <!-- Header Badge & Category -->
                <div class="flex items-center justify-between">
                  <span class="text-[10px] text-stone-500 uppercase font-bold tracking-wider">
                    ${item.category}
                  </span>
                  <span class="px-2 py-0.5 bg-[#f1eeee] text-[#201d1d] text-[10px] font-bold rounded-sm">
                    ${item.badge}
                  </span>
                </div>

                ${
                  item.image
                    ? `
                  <div class="w-full h-32 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] rounded-none flex items-center justify-center p-2 overflow-hidden cursor-pointer" data-action="open-product-detail" data-product-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}" class="max-h-full max-w-full object-contain" />
                  </div>
                `
                    : ''
                }

                <!-- Product Name -->
                <h3 class="text-base font-bold text-[#201d1d] m-0">
                  ${item.name}
                </h3>

                <!-- Product Description -->
                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  ${item.description}
                </p>
              </div>

              <!-- Price & Action Button -->
              <div class="pt-4 border-t border-[rgba(15,0,0,0.08)] space-y-3">
                <div class="flex items-baseline justify-between">
                  <span class="text-xs text-stone-500">가격:</span>
                  <span class="text-base font-black text-[#201d1d]">
                    ${item.priceText}
                  </span>
                </div>

                <button
                  type="button"
                  data-action="${
                    item.id === 'gold_exchange_5000'
                      ? 'open-gold-exchange'
                      : isCoin
                        ? 'open-coin-charge-modal'
                        : isGoods
                          ? 'open-product-detail'
                          : 'buy-shop-item'
                  }"
                  data-item-id="${item.id}"
                  data-product-id="${item.id}"
                  data-package-id="${item.id.replace('coin_charge_', 'coin_')}"
                  class="w-full py-2.5 ${
                    isCoin
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : isGoods
                        ? 'bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc]'
                        : 'bg-[#201d1d] hover:opacity-90 text-[#fdfcfc]'
                  } text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center shadow-none cursor-pointer transition-colors"
                >
                  ${item.actionText}
                </button>
              </div>
            </div>
          `;
          })
          .join('')}
      </section>

      <!-- Active Modals -->
      ${packModal}
      ${exchangeModal}
      ${coinChargeModal}
      ${detailModal}
    </div>
  `;
}
