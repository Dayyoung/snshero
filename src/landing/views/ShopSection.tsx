/**
 * src/landing/views/ShopSection.tsx
 *
 * Dedicated In-Game Shop Section for SNSHero (#shop).
 * Matches official https://snshero.com/shop structure with OpenCode Terminal-Flat design.
 *
 * Features:
 *   1. Categorized In-Game Tabs:
 *      - ALL: 전체 인게임 상품
 *      - PACK: 카드팩 가챠 (일반, 매직, 희귀, 스타터 전설팩)
 *      - ITEM: 육성 아이템 & 콘텐츠 (EXP 영약팩, 광고 영구 제거, 110화 웹소설, 시네마 티켓)
 *      - COIN: SNS 코인 충전 (1,000 / 3,000 / 10,000 / 50,000 SNS 코인)
 *   2. Real Payment Gateway Integration:
 *      - PayApp Lite: Credit Card, KakaoPay, NaverPay, ApplePay, WeChatPay
 *      - PayPal Express Checkout
 *      - Crypto Payments (USDT, SOL, BTC)
 *      - Clear Developer Simulation (SIM - 무과금 테스트)
 *   3. Gacha Pack Reveal Sequence & Diamond Compass Card Rendering.
 */

import { CARD_DATABASE } from '../../cardDatabase';
import { cardNurtureStore } from '../services/cardNurtureStore';
import {
  getCharacterAsset,
  getLocalizedCharacterName,
  getLocalizedFactionName,
  generateTerminalFlatPlaceholder,
} from '../services/assetCatalog';
import { requestPayAppPayment, CRYPTO_PAYMENT_INFO } from '../services/paymentService';
import {
  CRYPTO_COINS_CATALOG,
  CRYPTO_QUICK_CHIPS,
  resolveCryptoDepositDetails,
} from '../services/qrCodeSvg';
import { tr } from '../services/i18n';
import { audioManager } from '../services/audioManager';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ShopCategoryTab = 'ALL' | 'PACK' | 'ITEM' | 'COIN';

export interface ShopCardProduct {
  id: string;
  category: 'PACK' | 'ITEM' | 'COIN';
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
  fallbackUrl: string;
  isNew: boolean;
}

export interface PackRevealData {
  packId: string;
  packName: string;
  cards: RevealedCardMeta[];
  revealedIndices: number[];
  bestFaction?: string;
  bestCard: RevealedCardMeta;
  hasTriggeredFactionVfx?: boolean;
}

export interface FactionVfxInfo {
  icon: string;
  nameKo: string;
  nameEn: string;
  themeColor: string;
  bgGradient: string;
  bannerText: string;
  particles: string[];
  particleAnimation: string;
}

export function getFactionVfxInfo(faction: string): FactionVfxInfo {
  const norm = (faction || '').toLowerCase();
  if (norm.includes('water') || norm.includes('물') || norm.includes('aqua') || norm.includes('siren') || norm.includes('poseidon')) {
    return {
      icon: '🌊',
      nameKo: '물의 원소',
      nameEn: 'Water Elemental',
      themeColor: '#06b6d4',
      bgGradient: 'radial-gradient(circle at center, rgba(6,182,212,0.45) 0%, rgba(2,132,199,0.2) 65%, transparent 100%)',
      bannerText: tr('🌊 물의 원소 해일 각성! 사방으로 튀어오르는 거대한 파도!', '🌊 Water Elemental Awakening! Giant tidal waves and water splashes!', '🌊 水の元素覚醒！四方に飛び散る巨大な波しぶき！'),
      particles: ['💧', '🌊', '🫧', '🔷', '✨', '💧', '🌊'],
      particleAnimation: 'water-splash',
    };
  }
  if (norm.includes('fire') || norm.includes('불') || norm.includes('flame') || norm.includes('pyro') || norm.includes('dragon')) {
    return {
      icon: '🔥',
      nameKo: '불의 원소',
      nameEn: 'Fire Elemental',
      themeColor: '#ef4444',
      bgGradient: 'radial-gradient(circle at center, rgba(239,68,68,0.5) 0%, rgba(249,115,22,0.25) 65%, transparent 100%)',
      bannerText: tr('🔥 화염의 원소 대폭발! 전장을 불태우는 맹렬한 업화!', '🔥 Blazing Fire Nova! Incinerating the entire battlefield!', '🔥 火炎元素大爆発！戦場を焼き尽くす猛烈な業火！'),
      particles: ['🔥', '💥', '✨', '🔴', '⚡', '🔥', '💥'],
      particleAnimation: 'fire-burst',
    };
  }
  if (norm.includes('undead') || norm.includes('dark') || norm.includes('언데드') || norm.includes('암흑') || norm.includes('shadow') || norm.includes('necromancer')) {
    return {
      icon: '💀',
      nameKo: '언데드 & 암흑',
      nameEn: 'Undead & Shadow',
      themeColor: '#a855f7',
      bgGradient: 'radial-gradient(circle at center, rgba(168,85,247,0.5) 0%, rgba(88,28,135,0.3) 65%, transparent 100%)',
      bannerText: tr('💀 심연의 흑마법 안개 각성! 전장을 뒤덮는 음침한 영혼의 안개!', '💀 Abyssal Dark Mist Unleashed! Ominous spectral fog covers the battlefield!', '💀 深淵の黒魔術の霧覚醒！戦場を覆い尽くす不気味な霊魂の霧！'),
      particles: ['💀', '🌫️', '💜', '✨', '🌑', '💀', '🌫️'],
      particleAnimation: 'undead-mist',
    };
  }
  if (norm.includes('earth') || norm.includes('nature') || norm.includes('바람') || norm.includes('대지') || norm.includes('야수') || norm.includes('monster') || norm.includes('beast') || norm.includes('elf')) {
    return {
      icon: '🌿',
      nameKo: '대자연 & 원소 폭풍',
      nameEn: 'Nature & Gale',
      themeColor: '#10b981',
      bgGradient: 'radial-gradient(circle at center, rgba(16,185,129,0.45) 0%, rgba(5,150,105,0.25) 65%, transparent 100%)',
      bannerText: tr('🌿 대자연의 숨결 각성! 휘몰아치는 원소의 폭풍과 나뭇잎의 가호!', '🌿 Nature Elemental Gale! Whirling gale of leaves and elemental blessing!', '🌿 大自然の息吹覚醒！吹き荒れる元素の嵐と木の葉の加護！'),
      particles: ['🌿', '🍃', '🌪️', '💚', '✨', '🌿', '🍃'],
      particleAnimation: 'nature-gale',
    };
  }
  if (norm.includes('robot') || norm.includes('mecha') || norm.includes('로봇') || norm.includes('번개') || norm.includes('electric') || norm.includes('dwarf')) {
    return {
      icon: '⚡',
      nameKo: '초전도 번개 & 기계',
      nameEn: 'Lightning & Mecha',
      themeColor: '#eab308',
      bgGradient: 'radial-gradient(circle at center, rgba(234,179,8,0.5) 0%, rgba(56,189,248,0.25) 65%, transparent 100%)',
      bannerText: tr('⚡ 하늘을 가르는 전율의 번개! 초전도 뇌격 방전 폭발!', '⚡ Thunderous Lightning Discharge! Sky-splitting superconducting volts!', '⚡ 天を裂く戦慄の稲妻！超電導雷撃放電炸裂！'),
      particles: ['⚡', '⚙️', '✨', '🟡', '💥', '⚡', '⚙️'],
      particleAnimation: 'lightning-spark',
    };
  }
  // Default / Celestial / Holy / Human
  return {
    icon: '✨',
    nameKo: '천상 & 신성',
    nameEn: 'Divine Celestial',
    themeColor: '#f59e0b',
    bgGradient: 'radial-gradient(circle at center, rgba(245,158,11,0.5) 0%, rgba(251,191,36,0.3) 65%, transparent 100%)',
    bannerText: tr('✨ 태초의 성스러운 황금빛 광채! 눈부신 신성의 축복 강림!', '✨ Primordial Divine Radiance! Sacred golden blessing descends!', '✨ 太古の神聖な黄金の輝き！眩しい神性の祝福降臨！'),
    particles: ['✨', '⭐', '🌟', '👑', '💫', '✨', '⭐'],
    particleAnimation: 'divine-radiance',
  };
}

// ============================================================================
// Constants
// ============================================================================

export const SHOP_CATEGORY_TABS: Array<{ key: ShopCategoryTab; label: string; icon: string }> = [
  { key: 'ALL', label: '전체 (ALL)', icon: '🛍️' },
  { key: 'PACK', label: '카드팩 가챠 (PACK)', icon: '🎴' },
  { key: 'ITEM', label: '아이템·특전 (ITEM)', icon: '🧪' },
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
  // ── PACK (카드팩 가챠) ───────────────────────────────────────────────────
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

  // ── ITEM (육성 아이템 & 콘텐츠) ──────────────────────────────────────────
  {
    id: 'item_exp_pack',
    category: 'ITEM',
    name: 'EXP 영약팩 (대용량)',
    badge: '성장 부스터',
    priceText: '500 SNS',
    priceCoins: 500,
    priceUsd: 1.5,
    priceKrw: 2000,
    description: '영웅 즉시 레벨업 경험치 영약 10병 세트. 원하는 영웅에게 즉시 투여하여 전투력을 강화합니다.',
    shortSpec: '10병 세트 (병당 +500 EXP) · 즉시 인벤토리 지급',
    actionText: '구매하기 (500 SNS)',
  },
  {
    id: 'item_ad_removal',
    category: 'ITEM',
    name: '광고 영구 제거 패키지',
    badge: '영구 편의',
    priceText: '$2.99 (4,000원)',
    priceCoins: 0,
    priceUsd: 2.99,
    priceKrw: 4000,
    description: '전면/보상형 광고를 영구적으로 제거하고 쾌적하게 3초 즉시 보상을 수령합니다.',
    shortSpec: '광고 제거 영구 적용 · 보상 즉시 획득',
    actionText: '충전 & 결제하기',
  },

  // ── COIN (코인 충전 패키지) ──────────────────────────────────────────────
  {
    id: 'coin_charge_1000',
    category: 'COIN',
    name: '1,000 SNS 코인 충전',
    badge: '스타터',
    priceText: '$1.00 (1,500원)',
    priceCoins: 0,
    priceUsd: 1.0,
    priceKrw: 1500,
    description: '일반/매직 카드팩을 소환할 수 있는 기본 코인 패키지.',
    shortSpec: '즉시 계정 충전 · 유효기간 없음',
    actionText: '충전하기',
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
    description: '희귀 카드팩과 아이템 팩을 여유롭게 구매할 수 있는 인기 패키지.',
    shortSpec: '+5% 추가 보너스 적립',
    actionText: '충전하기',
  },
  {
    id: 'coin_charge_10000',
    category: 'COIN',
    name: '10,000 SNS 코인 충전',
    badge: '🔥 BEST 인기',
    priceText: '$10.00 (14,000원)',
    priceCoins: 0,
    priceUsd: 10.0,
    priceKrw: 14000,
    description: '가장 많은 모험가들이 선택하는 베스트 패키지. 대량 소환 및 풀 세팅 지원.',
    shortSpec: '+15% 추가 보너스 적립 · 전설 소환 추천',
    actionText: '충전하기',
  },
  {
    id: 'coin_charge_50000',
    category: 'COIN',
    name: '50,000 SNS 코인 충전',
    badge: '⭐ VIP 혜택',
    priceText: '$100.00 (140,000원)',
    priceCoins: 0,
    priceUsd: 100.0,
    priceKrw: 140000,
    description: '모든 시즌 전설 덱 완성과 최고급 컬렉션을 위한 최고 혜택 VIP 번들.',
    shortSpec: '+25% 초대형 보너스 · VIP 한정 카드 테두리 증정',
    actionText: '충전하기',
  },
];

function getLocalizedShopTabLabel(key: ShopCategoryTab): string {
  switch (key) {
    case 'ALL':
      return tr('전체 (ALL)', 'All Items (ALL)', 'すべて (ALL)');
    case 'PACK':
      return tr('카드팩 가챠 (PACK)', 'Card Packs (PACK)', 'カードパック (PACK)');
    case 'ITEM':
      return tr('아이템·특전 (ITEM)', 'Items & Passes (ITEM)', 'アイテム・特典 (ITEM)');
    case 'COIN':
      return tr('코인 충전 (COIN)', 'Coin Top-Up (COIN)', 'コインチャージ (COIN)');
  }
}

function getLocalizedCoinPackage(pkg: CoinPackage): { label: string; bonusText: string; priceDisplay: string } {
  switch (pkg.id) {
    case 'coin_1000':
      return {
        label: tr('1,000 SNS 코인', '1,000 SNS Coins', '1,000 SNSコイン'),
        bonusText: tr('스타터 충전', 'Starter Pack', 'スターターチャージ'),
        priceDisplay: tr('$1.00 USD / 1,500원', '$1.00 USD', '$1.00 USD (約150円)'),
      };
    case 'coin_3000':
      return {
        label: tr('3,000 SNS 코인', '3,000 SNS Coins', '3,000 SNSコイン'),
        bonusText: tr('+5% 보너스', '+5% Bonus', '+5% ボーナス'),
        priceDisplay: tr('$2.99 USD / 4,000원', '$2.99 USD', '$2.99 USD (約450円)'),
      };
    case 'coin_10000':
      return {
        label: tr('10,000 SNS 코인', '10,000 SNS Coins', '10,000 SNSコイン'),
        bonusText: tr('🔥 BEST 인기 (+15%)', '🔥 BEST Seller (+15%)', '🔥 人気No.1 (+15%)'),
        priceDisplay: tr('$10.00 USD / 14,000원', '$10.00 USD', '$10.00 USD (約1,500円)'),
      };
    case 'coin_50000':
      return {
        label: tr('50,000 SNS 코인', '50,000 SNS Coins', '50,000 SNSコイン'),
        bonusText: tr('⭐ VIP 혜택 (+25%)', '⭐ VIP Bundle (+25%)', '⭐ VIP特典 (+25%)'),
        priceDisplay: tr('$100.00 USD / 140,000원', '$100.00 USD', '$100.00 USD (約15,000円)'),
      };
    case 'pkg_ad_removal':
      return {
        label: tr('광고 영구 제거 패키지', 'Permanent Ad Removal Pack', '広告永久除去パッケージ'),
        bonusText: tr('영구 해금', 'Permanent Unlock', '永久解放'),
        priceDisplay: tr('$2.99 USD / 4,000원', '$2.99 USD', '$2.99 USD (約450円)'),
      };
    default:
      return {
        label: pkg.label,
        bonusText: pkg.bonusText || '',
        priceDisplay: `$${pkg.priceUsd.toFixed(2)} USD`,
      };
  }
}

function getLocalizedShopProduct(item: ShopCardProduct): ShopCardProduct {
  switch (item.id) {
    case 'pack_normal':
      return {
        ...item,
        name: tr('일반 카드팩', 'Normal Card Pack', 'ノーマルカードパック'),
        badge: tr('브론즈~실버 확정', 'Bronze–Silver Guaranteed', 'ブロンズ〜シルバー確定'),
        description: tr(
          '기초 원소 영웅 3장을 획득합니다. 도감 수집율을 빠르게 높일 수 있는 기본 팩.',
          'Summons 3 base elemental heroes. Ideal for building your collection rate quickly.',
          '基本属性の英雄3枚を獲得します。図鑑収集率を素早く高められる基本パック。'
        ),
        shortSpec: tr('3장 랜덤 소환 · 브론즈~실버 등급 보장', '3 Random Cards · Bronze–Silver Guaranteed', '3枚ランダム召喚・ブロンズ〜シルバー保証'),
        actionText: tr('구매하기 (300 SNS)', 'Buy Now (300 SNS)', '購入する (300 SNS)'),
      };
    case 'pack_magic':
      return {
        ...item,
        name: tr('매직 카드팩', 'Magic Card Pack', 'マジックカードパック'),
        badge: tr('실버~골드 확정', 'Silver–Gold Guaranteed', 'シルバー〜ゴールド確定'),
        description: tr(
          '상급 영웅 카드 3장을 획득합니다. 실버 등급 이상 확정 지급.',
          'Summons 3 advanced hero cards with Silver rarity or higher guaranteed.',
          '上級英雄カード3枚を獲得します。シルバー等級以上が確定で排出されます。'
        ),
        shortSpec: tr('3장 상급 소환 · 실버 등급 이상 100% 보장', '3 Advanced Cards · 100% Silver+ Guaranteed', '3枚上級召喚・シルバー以上100%保証'),
        actionText: tr('구매하기 (800 SNS)', 'Buy Now (800 SNS)', '購入する (800 SNS)'),
      };
    case 'pack_rare':
      return {
        ...item,
        name: tr('희귀 카드팩', 'Rare Card Pack', 'レアカードパック'),
        badge: tr('골드 이상 확정', 'Gold+ Guaranteed', 'ゴールド以上確定'),
        description: tr(
          '최고 등급 전설 영웅 3장을 획득합니다. 덱 TP와 Total TP를 비약적으로 상승시킵니다.',
          'Summons 3 top-tier legendary heroes to dramatically boost your Deck TP and Total TP.',
          '最高ランクの伝説英雄3枚を獲得します。デッキTPと総戦闘力を飛躍的に上昇させます。'
        ),
        shortSpec: tr('3장 최고급 소환 · 골드~전설 SSR 확정', '3 Supreme Cards · Gold–SSR Guaranteed', '3枚最高級召喚・ゴールド〜伝説SSR確定'),
        actionText: tr('구매하기 (1,500 SNS)', 'Buy Now (1,500 SNS)', '購入する (1,500 SNS)'),
      };
    case 'pack_starter_bundle':
      return {
        ...item,
        name: tr('스타터 전설팩 (SSR 5종)', 'Starter Legendary Pack (5 SSRs)', 'スターター伝説パック (SSR 5種)'),
        badge: tr('첫 구매 추천', 'Best Starter Value', '初回購入おすすめ'),
        description: tr(
          '초심자 모험가를 위한 핵심 5대 종족 전설 영웅 5장 즉시 지급 세트.',
          'Instant bundle of 5 core faction legendary heroes tailored for new adventurers.',
          '初心者冒険者のための主要5大種族・伝説英雄5枚即時付与セット。'
        ),
        shortSpec: tr('전설 영웅 5장 일괄 지급 · 초보자 필수 추천', '5 Legendary Heroes Bundle · Essential Starter', '伝説英雄5枚一括付与・初心者必須おすすめ'),
        actionText: tr('구매하기 (2,000 SNS)', 'Buy Now (2,000 SNS)', '購入する (2,000 SNS)'),
      };
    case 'item_exp_pack':
      return {
        ...item,
        name: tr('EXP 영약팩 (대용량)', 'EXP Elixir Bundle (Large)', 'EXP霊薬パック (大容量)'),
        badge: tr('성장 부스터', 'Growth Booster', '成長ブースター'),
        description: tr(
          '영웅 즉시 레벨업 경험치 영약 10병 세트. 원하는 영웅에게 즉시 투여하여 전투력을 강화합니다.',
          'Set of 10 instant EXP elixirs to rapidly level up your heroes and boost combat power.',
          '英雄即時レベルアップ経験値霊薬10本セット。英雄に投与して戦闘力を強化します。'
        ),
        shortSpec: tr('10병 세트 (병당 +500 EXP) · 즉시 인벤토리 지급', '10 Bottles (+500 EXP each) · Instant Delivery', '10本セット (1本あたり+500 EXP)・即時付与'),
        actionText: tr('구매하기 (500 SNS)', 'Buy Now (500 SNS)', '購入する (500 SNS)'),
      };
    case 'item_ad_removal':
      return {
        ...item,
        name: tr('광고 영구 제거 패키지', 'Permanent Ad Removal Pack', '広告永久除去パッケージ'),
        badge: tr('영구 편의', 'Permanent QoL', '永久快適'),
        priceText: tr('$2.99 (4,000원)', '$2.99 USD', '$2.99 USD (約450円)'),
        description: tr(
          '전면/보상형 광고를 영구적으로 제거하고 쾌적하게 3초 즉시 보상을 수령합니다.',
          'Permanently removes interstitial/rewarded ads and claims all rewards instantly.',
          '広告を永久に除去し、すべての報酬を即座に受け取ることができます。'
        ),
        shortSpec: tr('광고 제거 영구 적용 · 보상 즉시 획득', 'Permanent Ad-Free · Instant Rewards', '広告除去永久適用・報酬即時獲得'),
        actionText: tr('충전 & 결제하기', 'Checkout & Unlock', '決済して解放する'),
      };
    case 'item_novel_pass':
      return {
        ...item,
        name: tr('공식 웹소설 110화 전편 패스', 'Official Web Novel Full Pass', '公式ウェブ小説全話パス'),
        badge: tr('세계관 비전서', 'Lore Archive', '世界観秘伝書'),
        description: tr(
          '네이버/문피아 연재 중인 눈히어로 공식 110화 풀 텍스트 열람 및 히든 칭호 해금권.',
          'Full access pass to the official unabridged SNSHero web novel and hidden title unlock.',
          '公式連載中のSNSHeroウェブ小説全文閲覧および隠し称号解放パス。'
        ),
        shortSpec: tr('110화 무제한 정주행 · 히든 스탯 영구 버프 지급', 'Unlimited Reading · Permanent Hidden Stat Buff', '無制限閲覧・隠しステータス永久バフ付与'),
        actionText: tr('구매하기 (1,000 SNS)', 'Buy Now (1,000 SNS)', '購入する (1,000 SNS)'),
      };
    case 'item_anime_cinema':
      return {
        ...item,
        name: tr('공식 3D/2D 애니 극장판 티켓', 'Official Anime Cinema Pass', '公式アニメ劇場版チケット'),
        badge: tr('시네마 패스', 'Cinema Pass', 'シネマパス'),
        description: tr(
          '카단의 여정 40부작 및 Veo 3.1 기반 공식 컷신 애니메이션 무제한 고화질 스트리밍.',
          'Unlimited HD streaming for all 40 episodes of Kadan’s Journey cutscene animation.',
          'カダンの旅 全40話および公式カットシーンアニメの無制限高画質ストリーミング。'
        ),
        shortSpec: tr('40부작 풀에피소드 1080p 고화질 감상', '40 Full Episodes in 1080p HD', '全40話フルエピソード 1080p高画質鑑賞'),
        actionText: tr('구매하기 (1,200 SNS)', 'Buy Now (1,200 SNS)', '購入する (1,200 SNS)'),
      };
    case 'coin_charge_1000':
      return {
        ...item,
        name: tr('1,000 SNS 코인 충전', '1,000 SNS Coins Top-Up', '1,000 SNSコインチャージ'),
        badge: tr('스타터', 'Starter', 'スターター'),
        priceText: tr('$1.00 (1,500원)', '$1.00 USD', '$1.00 USD (約150円)'),
        description: tr(
          '일반/매직 카드팩을 소환할 수 있는 기본 코인 패키지.',
          'Starter coin package for summoning Normal and Magic card packs.',
          'ノーマル・マジックカードパックを召喚できる基本コインパッケージ。'
        ),
        shortSpec: tr('즉시 계정 충전 · 유효기간 없음', 'Instant Account Top-Up · Never Expires', '即時アカウントチャージ・有効期限なし'),
        actionText: tr('충전하기', 'Top Up Now', 'チャージする'),
      };
    case 'coin_charge_3000':
      return {
        ...item,
        name: tr('3,000 SNS 코인 충전', '3,000 SNS Coins Top-Up', '3,000 SNSコインチャージ'),
        badge: tr('+5% 보너스', '+5% Bonus', '+5% ボーナス'),
        priceText: tr('$2.99 (4,000원)', '$2.99 USD', '$2.99 USD (約450円)'),
        description: tr(
          '희귀 카드팩과 아이템 팩을 여유롭게 구매할 수 있는 인기 패키지.',
          'Popular coin bundle with enough balance for Rare card packs and item bundles.',
          'レアカードパックやアイテムパックを余裕を持って購入できる人気パッケージ。'
        ),
        shortSpec: tr('+5% 추가 보너스 적립', '+5% Extra Bonus Coins', '+5% 追加ボーナス付与'),
        actionText: tr('충전하기', 'Top Up Now', 'チャージする'),
      };
    case 'coin_charge_10000':
      return {
        ...item,
        name: tr('10,000 SNS 코인 충전', '10,000 SNS Coins Top-Up', '10,000 SNSコインチャージ'),
        badge: tr('🔥 BEST 인기', '🔥 BEST Seller', '🔥 人気No.1'),
        priceText: tr('$10.00 (14,000원)', '$10.00 USD', '$10.00 USD (約1,500円)'),
        description: tr(
          '가장 많은 모험가들이 선택하는 베스트 패키지. 대량 소환 및 풀 세팅 지원.',
          'Our most popular package chosen by adventurers for bulk summons and full deck builds.',
          '最も多くの冒険者に選ばれているベストパッケージ。大量召喚とフル編成に対応。'
        ),
        shortSpec: tr('+15% 추가 보너스 적립 · 전설 소환 추천', '+15% Bonus Coins · Recommended for SSR Summons', '+15% 追加ボーナス・伝説召喚おすすめ'),
        actionText: tr('충전하기', 'Top Up Now', 'チャージする'),
      };
    case 'coin_charge_50000':
      return {
        ...item,
        name: tr('50,000 SNS 코인 충전', '50,000 SNS Coins Top-Up', '50,000 SNSコインチャージ'),
        badge: tr('⭐ VIP 혜택', '⭐ VIP Tier', '⭐ VIP特典'),
        priceText: tr('$100.00 (140,000원)', '$100.00 USD', '$100.00 USD (約15,000円)'),
        description: tr(
          '모든 시즌 전설 덱 완성과 최고급 컬렉션을 위한 최고 혜택 VIP 번들.',
          'Ultimate VIP bundle for completing all seasonal legendary decks and collections.',
          '全シーズンの伝説デッキ完成と最高級コレクションのためのVIPバンドル。'
        ),
        shortSpec: tr('+25% 초대형 보너스 · VIP 한정 카드 테두리 증정', '+25% Mega Bonus · Exclusive VIP Card Border', '+25% 超大型ボーナス・VIP限定カードフレーム贈呈'),
        actionText: tr('충전하기', 'Top Up Now', 'チャージする'),
      };
    default:
      return item;
  }
}

let currentCategoryTab: ShopCategoryTab = 'ALL';
let activePackReveal: PackRevealData | null = null;

// Item purchase success modal state
export interface ItemPurchaseSuccessInfo {
  itemId: string;
  itemName: string;
  category: string;
  icon: string;
  message: string;
  remainingCoins: number;
}
let itemPurchaseSuccessModal: ItemPurchaseSuccessInfo | null = null;
let coinDeficitNotice: string | null = null;

// Coin recharge popup state
let isCoinChargeModalOpen = false;
let coinChargeStep:
  | 'package'
  | 'country'
  | 'payment'
  | 'crypto_coin'
  | 'crypto_chain'
  | 'crypto_deposit'
  | 'crypto'
  | 'success' = 'package';
let selectedChargePackage: CoinPackage = COIN_PACKAGES[0];
let selectedChargeCountry: string = 'ko';
let selectedPaymentMethod: string | null = null;
let chargeSuccessInfo: { amount: number; label: string; isAdRemoval?: boolean } | null = null;

// Crypto selection & QR deposit state
let selectedCryptoCcy: string = 'USDT';
let selectedCryptoChain: string = 'USDT-TRC20';
let cryptoSearchQuery: string = '';
let cryptoAddressCopied: boolean = false;
let cryptoVerifyNotice: string | null = null;

// ============================================================================
// State Getters & Mutators
// ============================================================================

export function getItemPurchaseSuccessModal(): ItemPurchaseSuccessInfo | null {
  return itemPurchaseSuccessModal;
}

export function closeItemPurchaseModal(): void {
  itemPurchaseSuccessModal = null;
}

export function getCoinDeficitNotice(): string | null {
  return coinDeficitNotice;
}

export function clearCoinDeficitNotice(): void {
  coinDeficitNotice = null;
}

export function getShopCurrentTab(): ShopCategoryTab {
  return currentCategoryTab;
}

export function setShopCurrentTab(tab: ShopCategoryTab): void {
  currentCategoryTab = tab;
}

export function openGoldExchangeModal(): void {
  // Deprecated: Gold exchange feature removed
}

export function closeGoldExchangeModal(): void {
  // Deprecated: Gold exchange feature removed
}

export function openCoinChargeModal(packageId?: string, notice?: string): void {
  if (notice) {
    coinDeficitNotice = notice;
  }
  if (packageId) {
    const found = COIN_PACKAGES.find((p) => p.id === packageId);
    if (found) {
      selectedChargePackage = found;
      coinChargeStep = 'country';
    } else {
      coinChargeStep = 'package';
    }
  } else {
    coinChargeStep = 'package';
  }
  isCoinChargeModalOpen = true;
  chargeSuccessInfo = null;
  cryptoSearchQuery = '';
  cryptoAddressCopied = false;
  cryptoVerifyNotice = null;
}

export function closeCoinChargeModal(): void {
  isCoinChargeModalOpen = false;
  coinChargeStep = 'package';
  chargeSuccessInfo = null;
  cryptoSearchQuery = '';
  cryptoAddressCopied = false;
  cryptoVerifyNotice = null;
  coinDeficitNotice = null;
}

export function selectChargePackage(packageId: string): void {
  const found = COIN_PACKAGES.find((p) => p.id === packageId);
  if (found) {
    selectedChargePackage = found;
    coinChargeStep = 'country';
  }
}

export function selectChargeCountry(countryCode: string): void {
  selectedChargeCountry = countryCode;
  coinChargeStep = 'payment';
}

export function backToPackageSelection(): void {
  coinChargeStep = 'package';
}

export function backToCountrySelection(): void {
  coinChargeStep = 'country';
}

export function backToPaymentSelection(): void {
  coinChargeStep = 'payment';
  cryptoVerifyNotice = null;
}

export function selectCryptoCoin(ccy: string): void {
  const found = CRYPTO_COINS_CATALOG.find((c) => c.ccy === ccy) || CRYPTO_COINS_CATALOG[0];
  selectedCryptoCcy = found.ccy;
  cryptoAddressCopied = false;
  cryptoVerifyNotice = null;
  if (found.chains.length > 1) {
    coinChargeStep = 'crypto_chain';
  } else {
    selectedCryptoChain = found.chains[0] || `${found.ccy}-TRC20`;
    coinChargeStep = 'crypto_deposit';
  }
}

export function selectCryptoChain(chain: string): void {
  selectedCryptoChain = chain;
  cryptoAddressCopied = false;
  cryptoVerifyNotice = null;
  coinChargeStep = 'crypto_deposit';
}

export function backToCryptoCoinSelection(): void {
  coinChargeStep = 'crypto_coin';
  cryptoAddressCopied = false;
  cryptoVerifyNotice = null;
}

export function setCryptoSearchQuery(query: string): void {
  cryptoSearchQuery = query;
}

export function copyCryptoDepositAddress(address: string): void {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(address).catch(() => {});
  }
  cryptoAddressCopied = true;
}

export function verifyCryptoDepositStatus(): void {
  cryptoVerifyNotice = tr(
    '블록체인 네트워크에서 입금 내역을 조회 중입니다. 송금 후 네트워크 컨펌(1~3분) 완료 시 자동으로 코인이 지급됩니다.',
    'Checking blockchain network for your deposit. Coins will be credited automatically after network confirmation (1–3 mins).',
    'ブロックチェーンネットワークで入金履歴を照会中です。送金後、ネットワーク承認（1〜3分）が完了すると自動的にコインが付与されます。'
  );
}

let autoRevealTimer: ReturnType<typeof setTimeout> | null = null;

export function stopAutoRevealTimer(): void {
  if (autoRevealTimer) {
    clearTimeout(autoRevealTimer);
    autoRevealTimer = null;
  }
}

export function startAutoRevealTimer(onReveal: () => void): void {
  stopAutoRevealTimer();
  autoRevealTimer = setTimeout(() => {
    if (activePackReveal && activePackReveal.revealedIndices.length < activePackReveal.cards.length) {
      flipAllPackCards();
      onReveal();
    }
    autoRevealTimer = null;
  }, 1000);
}

export function getActivePackReveal(): PackRevealData | null {
  return activePackReveal;
}

export function clearPackReveal(): void {
  stopAutoRevealTimer();
  activePackReveal = null;
}

export function flipPackCard(cardIndex: number): void {
  if (!activePackReveal) return;
  if (!activePackReveal.revealedIndices.includes(cardIndex)) {
    activePackReveal.revealedIndices.push(cardIndex);
    try {
      audioManager.playCardFlip();
    } catch {
      // ignore audio errors
    }
    if (activePackReveal.revealedIndices.length === activePackReveal.cards.length) {
      stopAutoRevealTimer();
      try {
        audioManager.playVictoryFanfare();
      } catch {
        // ignore audio errors
      }
    }
  }
}

export function flipAllPackCards(): void {
  if (!activePackReveal) return;
  stopAutoRevealTimer();
  activePackReveal.revealedIndices = activePackReveal.cards.map((_, i) => i);
  try {
    audioManager.playVictoryFanfare();
  } catch {
    // ignore audio errors
  }
}

// ============================================================================
// Coin / Gold Balance Helpers
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

/**
 * Executes coin charge:
 * If method is real payment (payapp_card, kakaopay, naverpay, applepay, wechatpay):
 * Triggers actual PayApp Lite payment gateway without giving free coins.
 * If method is test_sim, grants immediate mock coins for testing.
 */
export async function executeCoinCharge(method: string): Promise<{ success: boolean; message: string }> {
  selectedPaymentMethod = method;

  if (method === 'test_sim') {
    // Developers / Free Mock Simulation
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
    return { success: true, message: '테스트 충전이 완료되었습니다.' };
  }

  if (method === 'crypto') {
    coinChargeStep = 'crypto_coin';
    cryptoSearchQuery = '';
    cryptoAddressCopied = false;
    cryptoVerifyNotice = null;
    return { success: true, message: '암호화폐 선택 화면을 표시합니다.' };
  }

  if (method === 'paypal') {
    const returnUrl = encodeURIComponent(
      window.location.origin +
        window.location.pathname +
        '#shop?payapp_success=' +
        (selectedChargePackage.isAdRemoval ? 'ad_removal' : String(selectedChargePackage.amount))
    );
    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=dryudryu@gmail.com&item_name=${encodeURIComponent(
      selectedChargePackage.label
    )}&amount=${selectedChargePackage.priceUsd.toFixed(2)}&currency_code=USD&return=${returnUrl}`;
    window.location.href = paypalUrl;
    return { success: true, message: 'PayPal 결제창으로 이동합니다.' };
  }

  // Real PayApp Payment Gateway Execution
  let payappMethod = 'card';
  if (method === 'payapp_card') payappMethod = 'card';
  else if (method === 'kakaopay') payappMethod = 'kakaopay';
  else if (method === 'naverpay') payappMethod = 'naverpay';
  else if (method === 'applepay') payappMethod = 'applepay';
  else if (method === 'wechatpay') payappMethod = 'wechatpay';

  const returnParam = selectedChargePackage.isAdRemoval ? 'ad_removal' : String(selectedChargePackage.amount);

  await requestPayAppPayment({
    goodname: selectedChargePackage.label,
    priceKrw: selectedChargePackage.priceKrw,
    method: payappMethod,
    returnParam,
    targetHash: '#shop',
  });

  return { success: true, message: 'PayApp 결제창을 호출합니다.' };
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

  if (item.id === 'item_ad_removal') {
    openCoinChargeModal('pkg_ad_removal');
    return { success: true, message: '광고 제거 결제 모달을 엽니다.' };
  }

  const userCoins = getUserCoins();
  if (userCoins < item.priceCoins) {
    coinDeficitNotice = tr(
      `SNS 코인이 부족합니다! (보유: ${userCoins.toLocaleString()} SNS / 필요: ${item.priceCoins.toLocaleString()} SNS) 아래 패키지를 선택하여 코인을 충전해 주세요.`,
      `Not enough SNS coins! (Have: ${userCoins.toLocaleString()} SNS / Need: ${item.priceCoins.toLocaleString()} SNS) Please select a top-up package below.`,
      `SNSコインが不足しています！（保有: ${userCoins.toLocaleString()} SNS / 必要: ${item.priceCoins.toLocaleString()} SNS）以下のパッケージを選択してチャージしてください。`
    );
    openCoinChargeModal();
    return {
      success: false,
      message: `SNS 코인이 부족합니다. (보유: ${userCoins.toLocaleString()} SNS / 필요: ${item.priceCoins.toLocaleString()} SNS)`,
    };
  }

  // Deduct coins
  debitUserCoins(item.priceCoins);
  const remainingCoins = getUserCoins();

  // If item pack or content pass
  if (item.id === 'item_exp_pack') {
    const totalElixirs = cardNurtureStore.addExpElixirs(10);
    itemPurchaseSuccessModal = {
      itemId: item.id,
      itemName: tr('EXP 영약팩 (대용량)', 'EXP Elixir Pack (Large)', 'EXP霊薬パック (大容量)'),
      category: 'ITEM',
      icon: '🧪',
      message: tr(
        `EXP 영약 10병(병당 +500 EXP)이 인벤토리에 지급되었습니다! (현재 보유: ${totalElixirs}병) [마이덱] 또는 [카드] 화면에서 원하는 영웅을 클릭해 [🧪 EXP 영약 투여] 버튼을 눌러 즉시 레벨업하세요.`,
        `10 EXP Elixirs (+500 EXP each) added to your inventory! (Owned: ${totalElixirs}) Open any hero in [My Deck] or [Cards] and click [Use EXP Elixir] to level up.`,
        `EXP霊薬10本(1本+500 EXP)がインベントリに支給されました！(現在保有: ${totalElixirs}本) [マイデッキ]または[カード]画面で英雄を選択し、[EXP霊薬投与]ボタンでレベルアップできます。`
      ),
      remainingCoins,
    };
    return {
      success: true,
      message: `EXP 영약 10병이 지급되었습니다! (현재 보유: ${totalElixirs}병)`,
    };
  }

  if (item.id === 'item_novel_pass') {
    localStorage.setItem('hero_novel_pass_unlocked', 'true');
    itemPurchaseSuccessModal = {
      itemId: item.id,
      itemName: tr('공식 웹소설 110화 전편 패스', 'Official Web Novel All Chapters Pass', '公式Web小説全110話パス'),
      category: 'ITEM',
      icon: '📜',
      message: tr(
        '공식 웹소설 110화 풀 텍스트 열람권이 계정에 영구 해금되었습니다! 메뉴의 [스토리/소설] 탭에서 전편을 무제한 감상하실 수 있습니다.',
        'Official Web Novel 110 chapters pass unlocked permanently! Enjoy unlimited reading in the Story tab.',
        '公式Web小説全110話の閲覧権がアカウントに永久解放されました！ストーリータブで全話無制限に閲覧できます。'
      ),
      remainingCoins,
    };
    return {
      success: true,
      message: '공식 웹소설 110화 풀 텍스트 열람권이 영구 해금되었습니다!',
    };
  }

  if (item.id === 'item_anime_cinema') {
    localStorage.setItem('hero_anime_cinema_unlocked', 'true');
    itemPurchaseSuccessModal = {
      itemId: item.id,
      itemName: tr('공식 3D/2D 애니 극장판 티켓', 'Official Anime Cinema Pass', '公式アニメ劇場版チケット'),
      category: 'ITEM',
      icon: '🎬',
      message: tr(
        '공식 애니 극장판 시네마 패스가 영구 해금되었습니다! 40부작 풀에피소드 고화질 1080p 애니메이션을 무제한 스트리밍으로 감상하세요.',
        'Official Anime Cinema Pass unlocked permanently! Stream all 40 full episodes in 1080p HD without limits.',
        '公式アニメ劇場版シネマパスが永久解放されました！全40話フルエピソードを1080p高画質で無制限ストリーミング鑑賞できます。'
      ),
      remainingCoins,
    };
    return {
      success: true,
      message: '공식 애니 극장판 시네마 패스가 영구 해금되었습니다!',
    };
  }

  // Pack draws: ALWAYS 5 CARDS per summon ritual!
  let count = 5;
  let guaranteedRarity: 'Bronze' | 'Silver' | 'Gold' | 'Boss' = 'Bronze';

  if (item.id === 'pack_normal') {
    count = 5;
    guaranteedRarity = 'Bronze';
  } else if (item.id === 'pack_magic') {
    count = 5;
    guaranteedRarity = 'Silver';
  } else if (item.id === 'pack_rare') {
    count = 5;
    guaranteedRarity = 'Gold';
  } else if (item.id === 'pack_starter_bundle') {
    count = 5;
    guaranteedRarity = 'Gold';
  }

  const revealed = simulatePackDraw(count, guaranteedRarity);

  // Determine the highest rarity and power hero to drive the Faction Elemental VFX
  const RARITY_WEIGHT: Record<string, number> = { Boss: 4, Gold: 3, Silver: 2, Bronze: 1 };
  let best = revealed[0];
  for (const c of revealed) {
    const curScore = (RARITY_WEIGHT[c.rarity] || 1) * 10000 + c.power;
    const bestScore = (RARITY_WEIGHT[best.rarity] || 1) * 10000 + best.power;
    if (curScore > bestScore) {
      best = c;
    }
  }

  activePackReveal = {
    packId: item.id,
    packName: item.name,
    cards: revealed,
    revealedIndices: [], // initially facedown for 1s dramatic flip!
    bestCard: best,
  };

  return {
    success: true,
    message: `${item.name} 개봉 완료!`,
    revealedCards: revealed,
  };
}

function simulatePackDraw(
  count: number,
  minRarity: 'Bronze' | 'Silver' | 'Gold' | 'Boss'
): RevealedCardMeta[] {
  const db = Object.values(CARD_DATABASE);
  const cards: RevealedCardMeta[] = [];

  const bronzeCards = db.filter((c) => (c.rarity || '').toLowerCase() === 'bronze');
  const silverCards = db.filter((c) => (c.rarity || '').toLowerCase() === 'silver');
  const goldCards = db.filter((c) => (c.rarity || '').toLowerCase() === 'gold');
  const bossCards = goldCards.slice(0, 10);

  for (let i = 0; i < count; i++) {
    let pool = db;
    if (minRarity === 'Gold') {
      pool = [...goldCards, ...bossCards];
    } else if (minRarity === 'Silver') {
      pool = [...silverCards, ...goldCards, ...bossCards];
    }

    if (pool.length === 0) pool = db;
    const picked = pool[Math.floor(Math.random() * pool.length)] || db[0];

    const asset = getCharacterAsset(picked.id);
    const pad3 = String(picked.id).padStart(3, '0');
    const bustUrl = asset.bustPngUrl || `/anime-character-sheets/busts/${pad3}_bust.png?v=20261110v2`;
    const seatUrl = asset.cutoutUrl || asset.seatUrl || `/seat/${asset.nameEn}.png`;
    const fallbackUrl =
      asset.fallbackSvgDataUri ||
      generateTerminalFlatPlaceholder(asset.nameKo || `영웅 #${picked.id}`, asset.faction || 'human');

    const isAlreadyOwned = cardNurtureStore.isCardOwned(picked.id);
    const isNew = !isAlreadyOwned;

    // 인벤토리에 카드 추가 및 경험치 부여
    cardNurtureStore.addCard(picked.id);
    cardNurtureStore.addExp(picked.id, 200);

    const locNameKo = picked.title || getLocalizedCharacterName(picked.id) || `영웅 #${picked.id}`;
    const locNameEn = picked.title_en || getLocalizedCharacterName(picked.id) || `Hero #${picked.id}`;
    const faction = picked.element || picked.race || 'Human';
    const rarityCapitalized = (
      picked.rarity
        ? picked.rarity.charAt(0).toUpperCase() + picked.rarity.slice(1).toLowerCase()
        : 'Bronze'
    ) as 'Bronze' | 'Silver' | 'Gold' | 'Boss';

    cards.push({
      cardId: picked.id,
      nameKo: locNameKo,
      nameEn: locNameEn,
      rarity: rarityCapitalized,
      faction,
      power: picked.power || 20,
      top: picked.top,
      right: picked.right,
      bottom: picked.bottom,
      left: picked.left,
      bustUrl,
      seatUrl,
      fallbackUrl,
      isNew,
    });
  }

  return cards;
}

// ============================================================================
// Modal Renderers
// ============================================================================

export function renderGoldExchangeModal(): string {
  return '';
}

export function renderItemPurchaseSuccessModal(): string {
  if (!itemPurchaseSuccessModal) return '';
  const modal = itemPurchaseSuccessModal;

  return `
    <div id="item-purchase-success-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 font-mono select-none">
      <div class="relative bg-[#fdfcfc] text-[#201d1d] border-2 border-stone-800 rounded-none max-w-md w-full p-6 space-y-4 shadow-2xl my-auto">
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b border-[rgba(15,0,0,0.08)]">
          <div class="flex items-center gap-2">
            <span class="text-2xl">${modal.icon}</span>
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-700 text-white rounded-sm">
                ${tr('구매 완료', 'Purchase Complete', '購入完了')}
              </span>
              <h3 class="text-base font-black m-0 mt-0.5">${modal.itemName}</h3>
            </div>
          </div>
          <button
            type="button"
            data-action="close-item-purchase-modal"
            class="text-stone-500 hover:text-black font-bold p-1 cursor-pointer"
            aria-label="${tr('닫기', 'Close', '閉じる')}"
          >[x]</button>
        </div>

        <!-- Description / Applied Effect -->
        <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] text-xs leading-relaxed text-stone-700">
          ${modal.message}
        </div>

        <!-- Remaining Coins -->
        <div class="flex items-center justify-between text-xs text-stone-500 py-1 bg-[#f1eeee]/60 px-3 py-2 border border-[rgba(15,0,0,0.06)]">
          <span>${tr('결제 후 잔여 코인:', 'Remaining Coins:', '残高コイン:')}</span>
          <span class="font-black text-[#201d1d] text-sm">${modal.remainingCoins.toLocaleString()} SNS</span>
        </div>

        <!-- Action Control Buttons -->
        <div class="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[rgba(15,0,0,0.08)]">
          ${
            modal.itemId === 'item_exp_pack'
              ? `
                <button
                  type="button"
                  data-action="view-my-deck-after-purchase"
                  class="w-full sm:flex-1 py-3 bg-emerald-700 hover:bg-emerald-600 text-[#fdfcfc] font-black text-xs rounded-sm min-h-[44px] cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                >
                  🧪 ${tr('마이덱으로 이동해 영약 즉시 투여하기', 'Move to My Deck & Apply Elixirs Now', 'マイデッキへ移動して霊薬を即時投与')}
                </button>
              `
              : modal.itemId === 'item_novel_pass'
              ? `
                <a
                  href="#book"
                  data-nav="book"
                  data-action="close-item-purchase-modal"
                  class="w-full sm:flex-1 py-3 bg-[#201d1d] hover:bg-[#343030] text-[#fdfcfc] font-black text-xs rounded-sm min-h-[44px] cursor-pointer flex items-center justify-center gap-1.5 transition-colors no-underline text-center"
                >
                  📖 ${tr('웹소설 1화 보러 가기', 'Read Web Novel Ep.1', 'Web小説第1話へ')}
                </a>
              `
              : `
                <a
                  href="/cinema"
                  target="_blank"
                  class="w-full sm:flex-1 py-3 bg-[#201d1d] hover:bg-[#343030] text-[#fdfcfc] font-black text-xs rounded-sm min-h-[44px] cursor-pointer flex items-center justify-center gap-1.5 transition-colors no-underline text-center"
                >
                  🎬 ${tr('극장판 시네마 감상하기', 'Watch Anime Cinema', '劇場版シネマを鑑賞')}
                </a>
              `
          }
          <button
            type="button"
            data-action="close-item-purchase-modal"
            class="w-full sm:w-auto px-4 py-3 bg-[#f1eeee] hover:bg-[#e8e5e5] text-[#201d1d] border border-[rgba(15,0,0,0.12)] font-bold text-xs rounded-sm min-h-[44px] cursor-pointer transition-colors"
          >
            ${tr('계속 쇼핑하기', 'Continue Shopping', '買い物を続ける')}
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderCoinChargeModal(): string {
  if (!isCoinChargeModalOpen) return '';

  const pkg = selectedChargePackage;
  const locPkg = getLocalizedCoinPackage(pkg);

  return `
    <div id="coin-charge-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
      <div class="bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-lg w-full p-6 space-y-4 shadow-none">
        <div class="flex items-center justify-between pb-3 border-b border-[rgba(15,0,0,0.08)]">
          <div>
            <span class="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-600 text-white rounded-sm mb-1">
              ${tr('결제 & 코인 충전', 'Checkout & Coin Top-Up', '決済＆コインチャージ')}
            </span>
            <h3 class="text-base font-bold m-0">${tr('SNS 코인 패키지 결제', 'SNS Coin Package Checkout', 'SNSコインパッケージ決済')}</h3>
          </div>
          <button type="button" data-action="close-coin-charge-modal" class="text-stone-500 hover:text-black font-bold p-1">[x]</button>
        </div>

        ${
          coinDeficitNotice
            ? `
              <div class="p-3 bg-amber-50 border border-amber-400 text-amber-900 text-xs font-bold rounded-sm flex items-start justify-between gap-2">
                <span>⚠️ ${coinDeficitNotice}</span>
                <button type="button" data-action="clear-coin-deficit-notice" class="text-amber-700 hover:text-black font-bold text-xs p-0.5">[x]</button>
              </div>
            `
            : ''
        }

        ${
          coinChargeStep === 'package'
            ? `
          <div class="space-y-2 max-h-72 overflow-y-auto">
            ${COIN_PACKAGES.map((p) => {
              const lp = getLocalizedCoinPackage(p);
              return `
              <button
                type="button"
                data-action="select-charge-package"
                data-package-id="${p.id}"
                class="w-full p-3 bg-[#f8f7f7] hover:bg-[#f1eeee] border border-[rgba(15,0,0,0.08)] rounded-none flex items-center justify-between min-h-[44px] text-left transition-colors cursor-pointer"
              >
                <div>
                  <div class="text-xs font-bold text-[#201d1d]">${lp.label}</div>
                  <div class="text-[10px] text-amber-700 font-medium">${lp.bonusText}</div>
                </div>
                <div class="text-xs font-black text-[#201d1d]">
                  ${lp.priceDisplay}
                </div>
              </button>
            `;
            }).join('')}
          </div>
        `
            : ''
        }

        ${
          coinChargeStep === 'country'
            ? `
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <button type="button" data-action="back-to-package-selection" class="text-xs text-stone-500 hover:text-black">← ${tr('패키지 변경', 'Change Package', 'パッケージ変更')}</button>
              <div class="text-xs font-bold">${locPkg.label} ($${pkg.priceUsd.toFixed(2)})</div>
            </div>

            <div class="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              ${COUNTRIES.map(
                (c) => `
                <button
                  type="button"
                  data-action="select-charge-country"
                  data-country-code="${c.code}"
                  class="p-2.5 bg-[#f8f7f7] hover:bg-[#f1eeee] border border-[rgba(15,0,0,0.08)] rounded-sm flex items-center gap-2 text-left min-h-[44px]"
                >
                  <span class="text-base">${c.flag}</span>
                  <div>
                    <div class="text-xs font-bold">${c.name.split(' ')[0]}</div>
                    <div class="text-[10px] text-stone-500">${c.currency}</div>
                  </div>
                </button>
              `
              ).join('')}
            </div>

            <button type="button" data-action="execute-coin-charge" data-method="crypto" class="w-full p-3 bg-amber-600 hover:bg-amber-700 text-white rounded-sm text-xs font-bold flex items-center justify-between min-h-[44px]">
              <span>⚡ ${tr('암호화폐 결제 (USDT / SOL / BTC)', 'Crypto Checkout (USDT / SOL / BTC)', '暗号資産決済 (USDT / SOL / BTC)')}</span>
              <span>${tr('즉시 지갑 결제 →', 'Instant Wallet Pay →', '即時ウォレット決済 →')}</span>
            </button>
          </div>
        `
            : ''
        }

        ${
          coinChargeStep === 'payment'
            ? `
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <button type="button" data-action="back-to-country-selection" class="text-xs text-stone-500 hover:text-black">← ${tr('국가 변경', 'Change Country', '国・地域を変更')}</button>
              <div class="text-xs font-bold">${locPkg.label} (${locPkg.priceDisplay})</div>
            </div>

            <div class="space-y-2">
              ${
                selectedChargeCountry === 'ko'
                  ? `
                <button type="button" data-action="execute-coin-charge" data-method="payapp_card" class="w-full py-3 px-4 bg-[#1e58ff] hover:bg-[#1542c7] text-white font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
                  <span>💳 ${tr('국내 신용/체크카드 (PayApp)', 'Credit / Debit Card (PayApp)', 'クレジット・デビットカード (PayApp)')}</span>
                  <span>${pkg.priceKrw.toLocaleString()}${tr('원 결제 →', ' KRW →', ' KRW 決済 →')}</span>
                </button>
                <button type="button" data-action="execute-coin-charge" data-method="kakaopay" class="w-full py-3 px-4 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
                  <span>🟡 ${tr('카카오페이 (Kakao Pay)', 'Kakao Pay', 'カカオペイ (Kakao Pay)')}</span>
                  <span>${tr('간편결제 →', 'Quick Pay →', '簡単決済 →')}</span>
                </button>
                <button type="button" data-action="execute-coin-charge" data-method="naverpay" class="w-full py-3 px-4 bg-[#03C75A] hover:bg-[#02b351] text-white font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
                  <span>🟢 ${tr('네이버페이 (Naver Pay)', 'Naver Pay', 'NAVERペイ (Naver Pay)')}</span>
                  <span>${tr('간편결제 →', 'Quick Pay →', '簡単決済 →')}</span>
                </button>
                <button type="button" data-action="execute-coin-charge" data-method="applepay" class="w-full py-3 px-4 bg-black hover:bg-stone-800 text-white font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
                  <span>🍎 Apple Pay</span>
                  <span>${tr('원터치 결제 →', 'One-Touch Pay →', 'ワンタッチ決済 →')}</span>
                </button>
              `
                  : `
                <button type="button" data-action="execute-coin-charge" data-method="paypal" class="w-full py-3 px-4 bg-[#003087] hover:bg-[#002466] text-white font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
                  <span>🅿️ PayPal Express Checkout</span>
                  <span>$${pkg.priceUsd.toFixed(2)} USD →</span>
                </button>
                <button type="button" data-action="execute-coin-charge" data-method="applepay" class="w-full py-3 px-4 bg-black hover:bg-stone-800 text-white font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
                  <span>🍎 Apple Pay</span>
                  <span>Instant Checkout →</span>
                </button>
              `
              }

              <button type="button" data-action="execute-coin-charge" data-method="crypto" class="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
                <span>⚡ ${tr('암호화폐 결제 (USDT / SOL / BTC)', 'Crypto Checkout (USDT / SOL / BTC)', '暗号資産決済 (USDT / SOL / BTC)')}</span>
                <span>${tr('Web3 지갑 결제 →', 'Web3 Wallet Pay →', 'Web3ウォレット決済 →')}</span>
              </button>

              <!-- Clear Simulation Test Button -->
              <button type="button" data-action="execute-coin-charge" data-method="test_sim" class="w-full py-2.5 px-4 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px] mt-2 border border-stone-400">
                <span>🧪 ${tr('[개발자/시뮬레이션] 즉시 충전 (SIM - 무과금)', '[Dev/Simulation] Instant Top-Up (Free SIM)', '[開発者/シミュレーション] 即時チャージ (無料SIM)')}</span>
                <span class="text-[10px] text-stone-600">${tr('결제창 없이 계정 즉시 지급', 'Instant credit without payment', '決済画面なしで即時付与')}</span>
              </button>
            </div>
          </div>
        `
            : ''
        }

        ${
          coinChargeStep === 'crypto_coin'
            ? (() => {
                const q = cryptoSearchQuery.trim().toLowerCase();
                const filteredCoins = CRYPTO_COINS_CATALOG.filter((coin) => {
                  if (!q) return true;
                  return coin.ccy.toLowerCase().includes(q) || coin.name.toLowerCase().includes(q);
                });

                return `
                  <div class="space-y-3">
                    <!-- Top Subheader & Back Button -->
                    <div class="flex items-center justify-between">
                      <button
                        type="button"
                        data-action="back-to-payment-selection"
                        class="text-xs text-stone-500 hover:text-black font-bold cursor-pointer py-1"
                      >
                        ← ${tr('결제 수단 변경', 'Change Payment Method', '決済手段を変更')}
                      </button>
                      <span class="text-xs font-bold text-[#201d1d]">⚡ ${tr('암호화폐 선택', 'Select Cryptocurrency', '暗号資産を選択')}</span>
                    </div>

                    <!-- Package Summary Box -->
                    <div class="bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none p-3 flex items-center justify-between">
                      <div class="text-xs text-[#201d1d]">
                        <span class="font-bold block">${locPkg.label}</span>
                        <span class="text-stone-500 text-[11px]">${tr('결제 예정 금액', 'Amount Due', '決済予定金額')}: ${locPkg.priceDisplay}</span>
                      </div>
                      <span class="text-xs font-black bg-[#201d1d] text-[#fdfcfc] px-2.5 py-1 rounded-sm">
                        $${pkg.priceUsd.toFixed(2)}
                      </span>
                    </div>

                    <!-- Search Coin Input -->
                    <div>
                      <input
                        id="crypto-coin-search-input"
                        type="text"
                        data-action="crypto-search-coin"
                        value="${cryptoSearchQuery}"
                        placeholder="${tr('코인 심볼 또는 이름 검색 (USDT, BTC, ETH, SOL...)', 'Search coin symbol or name (USDT, BTC, ETH, SOL...)', 'コインシンボルまたは名前を検索 (USDT, BTC, ETH, SOL...)')}"
                        class="w-full px-3 py-2 text-xs border border-[rgba(15,0,0,0.12)] rounded-sm bg-[#f8f7f7] text-[#201d1d] font-mono focus:outline-none focus:border-[#201d1d] min-h-[40px]"
                      />
                    </div>

                    <!-- Quick Select Chips -->
                    <div class="flex flex-wrap gap-1.5 text-[11px]">
                      ${CRYPTO_QUICK_CHIPS.map(
                        (chip) => `
                          <button
                            type="button"
                            data-action="select-crypto-coin"
                            data-ccy="${chip}"
                            class="px-2.5 py-1.5 min-h-[38px] bg-[#f8f7f7] hover:bg-[#201d1d] hover:text-[#fdfcfc] text-[#201d1d] rounded-sm font-bold border border-[rgba(15,0,0,0.12)] transition-colors cursor-pointer flex items-center justify-center"
                          >
                            ${chip}
                          </button>
                        `
                      ).join('')}
                    </div>

                    <!-- Full 8-Coin Selection List -->
                    <div class="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      ${filteredCoins
                        .map(
                          (coin) => `
                            <button
                              type="button"
                              data-action="select-crypto-coin"
                              data-ccy="${coin.ccy}"
                              class="w-full p-3 min-h-[48px] bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] rounded-none flex items-center justify-between transition-colors cursor-pointer text-left"
                            >
                              <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-none bg-[#f1eeee] border border-[rgba(15,0,0,0.12)] flex items-center justify-center font-bold text-base shrink-0">
                                  ${coin.icon}
                                </div>
                                <div>
                                  <div class="flex items-center gap-1.5">
                                    <span class="font-black text-xs sm:text-sm text-[#201d1d]">${coin.ccy}</span>
                                    <span class="text-[11px] text-stone-500">${coin.name}</span>
                                  </div>
                                  <div class="flex flex-wrap gap-1 mt-0.5">
                                    ${coin.chains
                                      .slice(0, 3)
                                      .map(
                                        (ch) => `
                                          <span class="text-[9px] bg-[#f1eeee] text-stone-700 px-1.5 py-0.5 rounded-none font-mono">
                                            ${ch.replace(`${coin.ccy}-`, '')}
                                          </span>
                                        `
                                      )
                                      .join('')}
                                    ${
                                      coin.chains.length > 3
                                        ? `<span class="text-[9px] text-stone-400 font-mono">+${coin.chains.length - 3}</span>`
                                        : ''
                                    }
                                  </div>
                                </div>
                              </div>
                              <span class="text-xs font-bold text-stone-500">${tr('선택 →', 'Select →', '選択 →')}</span>
                            </button>
                          `
                        )
                        .join('')}
                    </div>
                  </div>
                `;
              })()
            : ''
        }

        ${
          coinChargeStep === 'crypto_chain'
            ? (() => {
                const coinObj =
                  CRYPTO_COINS_CATALOG.find((c) => c.ccy === selectedCryptoCcy) || CRYPTO_COINS_CATALOG[0];

                return `
                  <div class="space-y-3">
                    <!-- Top Subheader & Back Button -->
                    <div class="flex items-center justify-between">
                      <button
                        type="button"
                        data-action="back-to-crypto-coin"
                        class="text-xs text-stone-500 hover:text-black font-bold cursor-pointer py-1"
                      >
                        ← ${tr('코인 다시 선택', 'Back to Coin List', 'コイン選択へ戻る')}
                      </button>
                      <span class="text-xs font-bold text-[#201d1d]">⚡ ${coinObj.ccy} ${tr('네트워크 선택', 'Select Network', 'ネットワーク選択')}</span>
                    </div>

                    <!-- Guidance Box -->
                    <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-xs text-stone-600 leading-relaxed">
                      ${tr(
                        `선택한 코인 <strong class="text-[#201d1d]">[${coinObj.ccy}]</strong>의 입금 네트워크(체인)를 선택해주세요. 송금 지갑과 동일한 네트워크를 선택해야 안전합니다.`,
                        `Select the deposit network (chain) for <strong class="text-[#201d1d]">[${coinObj.ccy}]</strong>. Make sure it matches your sending wallet network.`,
                        `選択したコイン <strong class="text-[#201d1d]">[${coinObj.ccy}]</strong> の入金ネットワーク（チェーン）を選択してください。送金元ウォレットと同じネットワークを選択してください。`
                      )}
                    </div>

                    <!-- Network List -->
                    <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
                      ${coinObj.chains
                        .map((chainItem) => {
                          const chainName = chainItem.replace(`${coinObj.ccy}-`, '');
                          const isRecommended =
                            chainName.includes('TRC20') ||
                            chainName.includes('Polygon') ||
                            chainName.includes('Arbitrum') ||
                            chainName.includes('Solana');

                          return `
                            <button
                              type="button"
                              data-action="select-crypto-chain"
                              data-chain="${chainItem}"
                              class="w-full p-3.5 min-h-[48px] bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] rounded-none flex items-center justify-between transition-colors cursor-pointer text-left"
                            >
                              <div>
                                <div class="flex items-center gap-2">
                                  <span class="font-black text-xs sm:text-sm text-[#201d1d]">${chainName}</span>
                                  ${
                                    isRecommended
                                      ? `<span class="text-[10px] bg-emerald-700 text-white font-bold px-1.5 py-0.5 rounded-sm">${tr('추천 (저렴한 수수료)', 'Recommended (Low Fee)', 'おすすめ (低手数料)')}</span>`
                                      : ''
                                  }
                                </div>
                                <span class="text-[11px] text-stone-500 font-mono block mt-0.5">${chainItem}</span>
                              </div>
                              <span class="text-xs font-bold text-[#201d1d]">${tr('QR 생성 →', 'Generate QR →', 'QR生成 →')}</span>
                            </button>
                          `;
                        })
                        .join('')}
                    </div>
                  </div>
                `;
              })()
            : ''
        }

        ${
          coinChargeStep === 'crypto_deposit' || coinChargeStep === 'crypto'
            ? (() => {
                const deposit = resolveCryptoDepositDetails(
                  selectedCryptoCcy,
                  selectedCryptoChain,
                  pkg.priceUsd
                );

                return `
                  <div class="space-y-3.5 max-h-[78vh] overflow-y-auto pr-0.5">
                    <!-- Top Bar -->
                    <div class="flex items-center justify-between">
                      <button
                        type="button"
                        data-action="back-to-crypto-coin"
                        class="text-xs text-stone-500 hover:text-black font-bold cursor-pointer py-1"
                      >
                        ← ${tr('다른 코인/네트워크 선택', 'Change Coin / Network', '別のコイン・ネットワークを選択')}
                      </button>
                      <span class="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm">
                        ${deposit.chain}
                      </span>
                    </div>

                    <!-- Countdown Timer & Status -->
                    <div class="flex items-center justify-between p-2.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-xs">
                      <span class="text-stone-600 font-bold">⏱ ${tr('입금 유효 시간:', 'Deposit Valid For:', '入金有効時間:')}</span>
                      <span class="font-black text-amber-700">10:00</span>
                    </div>

                    <!-- Exact Amount to Send -->
                    <div class="bg-[#f8f7f7] border border-[#201d1d] rounded-none p-3 text-center space-y-1">
                      <span class="text-[10px] text-stone-500 font-bold block uppercase tracking-wider">
                        ${tr('전송해야 할 정확한 금액 (EXACT AMOUNT TO SEND)', 'EXACT AMOUNT TO SEND', '送金する正確な金額 (EXACT AMOUNT TO SEND)')}
                      </span>
                      <div class="text-xl sm:text-2xl font-black text-[#201d1d] tracking-tight">
                        ${deposit.amount} <span class="text-sm font-bold text-amber-700">${deposit.ccy}</span>
                      </div>
                      <span class="text-[10px] text-stone-600 font-bold block">
                        ${tr('네트워크', 'Network', 'ネットワーク')}: ${deposit.chain} (≈ $${deposit.priceUsd.toFixed(2)} USD)
                      </span>
                    </div>

                    <!-- QR Code Box -->
                    <div class="flex flex-col items-center justify-center p-3 bg-white border border-[rgba(15,0,0,0.12)] rounded-none">
                      <div class="p-1 bg-white border border-stone-200 flex items-center justify-center">
                        ${deposit.qrSvg}
                      </div>
                      <span class="text-[10px] text-stone-500 mt-1.5 font-mono font-bold">
                        ${tr('지갑 앱으로 QR 코드를 스캔하여 전송하세요', 'Scan QR code with your wallet app to send', 'ウォレットアプリでQRコードをスキャンして送金してください')}
                      </span>
                    </div>

                    <!-- Deposit Address & Copy Button -->
                    <div class="space-y-1.5">
                      <label class="text-[11px] font-bold text-stone-600 block">
                        ${tr('입금 전용 지갑 주소', 'Deposit Wallet Address', '入金専用ウォレットアドレス')} (${deposit.chain})
                      </label>
                      <div class="flex items-center gap-1.5">
                        <input
                          type="text"
                          readonly
                          value="${deposit.address}"
                          class="flex-1 p-2.5 text-[11px] bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm font-mono font-bold text-[#201d1d] select-all focus:outline-none"
                        />
                        <button
                          type="button"
                          data-action="copy-crypto-address"
                          data-address="${deposit.address}"
                          class="px-3 py-2.5 min-h-[44px] bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] rounded-sm text-xs font-bold flex items-center justify-center cursor-pointer shrink-0"
                        >
                          ${cryptoAddressCopied ? tr('✓ 복사됨', '✓ Copied', '✓ コピー済') : tr('복사', 'Copy', 'コピー')}
                        </button>
                      </div>
                    </div>

                    ${
                      cryptoVerifyNotice
                        ? `
                          <div class="p-2.5 bg-amber-50 border border-amber-400 text-amber-900 text-[11px] font-bold rounded-none leading-relaxed">
                            ${cryptoVerifyNotice}
                          </div>
                        `
                        : ''
                    }

                    <!-- Action Buttons -->
                    <div class="space-y-2 pt-1">
                      <div class="flex items-center justify-center gap-2 text-[11px] text-stone-600 bg-[#f8f7f7] p-2 rounded-none border border-[rgba(15,0,0,0.08)]">
                        <span class="inline-block w-2 h-2 bg-amber-500 rounded-none"></span>
                        <span>${tr('네트워크 트랜잭션을 실시간 감지 중입니다...', 'Monitoring network transactions in real time...', 'ネットワークトランザクションをリアルタイム検知中...')}</span>
                      </div>

                      <button
                        type="button"
                        data-action="verify-crypto-deposit"
                        class="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-sm min-h-[44px] cursor-pointer"
                      >
                        ⚡ ${tr('입금 완료 즉시 확인 (수동 새로고침)', 'Verify Deposit Now (Manual Refresh)', '入金完了を今すぐ確認（手動更新）')}
                      </button>

                      <button
                        type="button"
                        data-action="close-coin-charge-modal"
                        class="w-full py-2.5 px-4 bg-[#f1eeee] hover:bg-[#e8e5e5] text-[#201d1d] border border-[rgba(15,0,0,0.12)] font-bold text-xs rounded-sm min-h-[44px] cursor-pointer"
                      >
                        ${tr('결제 취소 (닫기)', 'Cancel Payment (Close)', '決済キャンセル（閉じる）')}
                      </button>
                    </div>
                  </div>
                `;
              })()
            : ''
        }

        ${
          coinChargeStep === 'success' && chargeSuccessInfo
            ? `
          <div class="text-center py-4 space-y-4">
            <div class="text-3xl">🎉</div>
            <h3 class="text-base font-black m-0">${tr('결제 및 충전이 성공적으로 완료되었습니다!', 'Payment and Top-Up Completed!', '決済およびチャージが正常に完了しました！')}</h3>
            <p class="text-xs text-stone-600 leading-relaxed">
              ${
                chargeSuccessInfo.isAdRemoval
                  ? tr(
                      '광고가 영구적으로 제거되었습니다. 모든 보상을 3초 만에 즉시 획득하세요!',
                      'Ads have been permanently removed. Claim all rewards instantly!',
                      '広告が永久に除去されました。すべての報酬を即座に獲得できます！'
                    )
                  : tr(
                      `<strong>+${chargeSuccessInfo.amount.toLocaleString()} SNS 코인</strong>이 계정에 정상 지급되었습니다.`,
                      `<strong>+${chargeSuccessInfo.amount.toLocaleString()} SNS Coins</strong> have been credited to your account.`,
                      `<strong>+${chargeSuccessInfo.amount.toLocaleString()} SNSコイン</strong>がアカウントに正常に付与されました。`
                    )
              }
            </p>
            <button type="button" data-action="close-coin-charge-modal" class="w-full py-3 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs rounded-sm min-h-[44px]">
              ${tr('확인 (완료)', 'Confirm (Done)', '確認（完了）')}
            </button>
          </div>
        `
            : ''
        }
      </div>
    </div>
  `;
}

export function renderPackRevealModal(): string {
  if (!activePackReveal) return '';
  const packItem = ALL_SHOP_PRODUCTS.find((p) => p.id === activePackReveal?.packId);
  const localizedPackName = packItem ? getLocalizedShopProduct(packItem).name : activePackReveal.packName;
  const allRevealed = activePackReveal.revealedIndices.length === activePackReveal.cards.length;

  return `
    <div id="pack-reveal-modal" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 font-mono overflow-y-auto select-none">
      
      <!-- Main Modal Frame -->
      <div class="relative z-10 bg-[#fdfcfc] text-[#201d1d] border-2 border-stone-800 rounded-none max-w-4xl w-full p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl my-auto">
        
        <!-- Header -->
        <div class="relative text-center space-y-2 pb-2 border-b border-[rgba(15,0,0,0.08)]">
          <button
            type="button"
            data-action="close-pack-reveal"
            class="absolute top-0 right-0 text-stone-500 hover:text-black font-bold p-1 cursor-pointer text-sm"
            aria-label="${tr('닫기', 'Close', '閉じる')}"
          >[x]</button>

          <div class="flex items-center justify-center gap-2">
            <span class="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm">
              ${tr('5연속 영웅 소환', '5-Hero Summon', '5連英雄召喚')}
            </span>
            <span class="text-xs font-bold text-amber-700">
              [${activePackReveal.revealedIndices.length} / ${activePackReveal.cards.length} ${tr('개봉됨', 'Opened', '開封済')}]
            </span>
          </div>

          <h3 class="text-base sm:text-xl font-black m-0 tracking-tight">
            ${localizedPackName} — ${tr('카드팩 개봉', 'Hero Pack Summon', 'パック開封')}
          </h3>

          <p class="text-xs text-stone-500 m-0">
            ${
              allRevealed
                ? tr('5장의 영웅 카드가 모두 개봉되었습니다!', 'All 5 hero cards have been revealed!', '全5枚の英雄カードが開封されました！')
                : tr('1초 후 모든 카드가 자동으로 개봉됩니다. 카드를 터치하여 즉시 확인할 수도 있습니다.', 'All cards will reveal automatically in 1 second. You can also tap to reveal immediately.', '1秒後に全カードが自動で開封されます。タップして今すぐ確認することもできます。')
            }
          </p>
        </div>

        <!-- 5 Revealed Cards Row (Flip Effect) -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 py-1">
          ${activePackReveal.cards
            .map((card, idx) => {
              const isFlipped = activePackReveal?.revealedIndices.includes(idx);
              const locName = getLocalizedCharacterName(card.cardId) || card.nameKo;
              const locFaction = getLocalizedFactionName(card.faction);
              const isBest = card.cardId === activePackReveal?.bestCard.cardId;

              if (!isFlipped) {
                // 1. Facedown Sealed Card (Card Back + Touch to Flip)
                return `
                  <button
                    type="button"
                    data-action="flip-pack-card"
                    data-card-index="${idx}"
                    class="group relative aspect-[5/7] bg-[#1a1717] hover:bg-[#252222] border-2 border-amber-400/60 hover:border-amber-300 rounded-none p-2 flex flex-col items-center justify-between cursor-pointer transition-transform hover:scale-102 active:scale-95 shadow-lg select-none min-h-[170px]"
                    aria-label="${tr('카드 개봉하기', 'Open Card', 'カードを開封')} #${idx + 1}"
                  >
                    <!-- Magical Rune Frame -->
                    <div class="w-full flex justify-between items-center text-[10px] text-amber-400/70 font-mono">
                      <span>#${idx + 1}</span>
                      <span>✦</span>
                    </div>

                    <!-- Center Seal -->
                    <div class="flex flex-col items-center justify-center gap-1.5 my-auto">
                      <div class="w-12 h-12 rounded-full border border-amber-400/40 bg-stone-900 flex items-center justify-center text-amber-400 text-lg group-hover:scale-110 transition-transform">
                        ?
                      </div>
                      <span class="text-[10px] font-bold text-amber-300 tracking-wider">
                        ${tr('봉인된 룬', 'Sealed Rune', '封印されたルーン')}
                      </span>
                    </div>

                    <!-- Touch to Reveal Cue -->
                    <div class="w-full py-1 bg-amber-400/20 text-amber-300 text-[9px] font-black rounded-none text-center">
                      ${tr('터치하여 개봉', 'Tap to Flip', 'タップして開封')}
                    </div>
                  </button>
                `;
              }

              // 2. Faceup Flipped Card (Dramatic Card Reveal + Faction Glow)
              const rarityGlow =
                card.rarity === 'Boss'
                  ? 'border-purple-600 ring-2 ring-purple-400/70 shadow-[0_0_20px_rgba(168,85,247,0.8)]'
                  : card.rarity === 'Gold'
                  ? 'border-amber-400 ring-2 ring-amber-300/80 shadow-[0_0_18px_rgba(251,191,36,0.8)]'
                  : card.rarity === 'Silver'
                  ? 'border-slate-300 ring-1 ring-cyan-400/50 shadow-md'
                  : 'border-amber-700/60 shadow-sm';

              return `
                <div
                  class="relative aspect-[5/7] border-2 ${rarityGlow} bg-[#f8f7f7] p-2 flex flex-col justify-between items-center text-center select-none animate-[card-flip-rotate_0.5s_cubic-bezier(0.2,0.8,0.2,1)_forwards] min-h-[170px]"
                >
                  ${
                    isBest
                      ? `<div class="absolute -top-2 px-1.5 py-0.2 bg-amber-400 text-stone-950 text-[8px] font-black rounded-none shadow-md border border-stone-900 z-20">★ MVP HERO</div>`
                      : ''
                  }

                  <!-- Card Illustration Thumbnail -->
                  <div class="relative w-full aspect-square bg-[#ece8e8] flex items-center justify-center overflow-hidden border border-stone-200">
                    <img
                      src="${card.bustUrl}"
                      alt="${locName}"
                      class="w-full h-full object-cover"
                      draggable="false"
                      onerror="if (this.src !== '${card.seatUrl}') { this.src = '${card.seatUrl}'; } else if (this.src !== '${card.fallbackUrl}') { this.src = '${card.fallbackUrl}'; }"
                    />
                    <!-- Faction Icon Badge -->
                    <span class="absolute top-1 left-1 px-1 py-0.2 bg-black/75 text-white text-[8px] font-black rounded-none">
                      ${locFaction}
                    </span>
                    <!-- Rarity Badge -->
                    <span class="absolute top-1 right-1 px-1 py-0.2 bg-amber-400 text-stone-950 text-[8px] font-black rounded-none">
                      ${card.rarity}
                    </span>
                  </div>

                  <!-- Name and Power -->
                  <div class="w-full space-y-0.5 my-1">
                    <div class="text-[11px] font-bold text-stone-900 truncate">${locName}</div>
                    <div class="text-[10px] font-black text-amber-700">
                      ${tr('전투력', 'Power', '戦闘力')}: ${card.power}
                    </div>
                  </div>

                  <!-- 4-Way Compass Stats Preview (N / E / S / W) -->
                  <div class="w-full grid grid-cols-4 gap-0.5 text-[8px] font-mono font-bold bg-stone-200/80 p-0.5 text-stone-800 rounded-none">
                    <span title="North">▲${card.top}</span>
                    <span title="East">▶${card.right}</span>
                    <span title="South">▼${card.bottom}</span>
                    <span title="West">◀${card.left}</span>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>

        <!-- Action Control Buttons -->
        <div class="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-[rgba(15,0,0,0.08)]">
          ${
            !allRevealed
              ? `
                <button
                  type="button"
                  data-action="flip-pack-all"
                  class="w-full sm:flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-sm min-h-[44px] cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  ⚡ ${tr('전체 카드 한 번에 뒤집기 (OPEN ALL)', 'Reveal All 5 Cards (OPEN ALL)', '全5枚を一括開封 (OPEN ALL)')}
                </button>
              `
              : ''
          }
          <button
            type="button"
            data-action="confirm-pack-reveal"
            class="w-full sm:flex-1 py-3 bg-[#201d1d] hover:bg-[#343030] text-[#fdfcfc] font-black text-xs rounded-sm min-h-[44px] cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
          >
            ✓ ${tr('확인 및 마이덱 보관함으로 이동 →', 'Confirm & View My Deck →', '確認してマイデッキへ →')}
          </button>
          <button
            type="button"
            data-action="close-pack-reveal"
            class="w-full sm:w-auto px-4 py-3 bg-[#f1eeee] hover:bg-[#e8e5e5] text-[#201d1d] border border-[rgba(15,0,0,0.12)] font-bold text-xs rounded-sm min-h-[44px] cursor-pointer transition-colors"
          >
            ${tr('상점에 머물기', 'Stay in Shop', 'ショップに残る')}
          </button>
        </div>

      </div>
    </div>
  `;
}

// ============================================================================
// Category Section Metadata & Product Card Renderer
// ============================================================================

export interface ShopCategorySectionMeta {
  key: ShopCategoryTab;
  titleKo: string;
  titleEn: string;
  titleJa: string;
  badgeKo: string;
  badgeEn: string;
  badgeJa: string;
  descKo: string;
  descEn: string;
  descJa: string;
  icon: string;
}

export const SHOP_CATEGORY_SECTIONS: ShopCategorySectionMeta[] = [
  {
    key: 'PACK',
    titleKo: '영웅 카드팩 소환 (Hero Card Packs)',
    titleEn: 'Hero Card Packs Summon',
    titleJa: '英雄カードパック召喚',
    badgeKo: 'GACHA PACKS',
    badgeEn: 'GACHA PACKS',
    badgeJa: 'ガチャパック',
    descKo: '덱 편성을 위한 5대 종족 영웅 3~5장 소환 의식 · 실버/골드/전설 SSR 확정 보장',
    descEn: 'Summon 3–5 heroes from 5 factions to build your deck · Silver/Gold/SSR guaranteed.',
    descJa: 'デッキ編成用の5種族英雄3〜5枚召喚の儀式・シルバー/ゴールド/SSR確定保証',
    icon: '🎴',
  },
  {
    key: 'ITEM',
    titleKo: '육성 아이템 & 콘텐츠 특전 (Growth Items & Passes)',
    titleEn: 'Growth Items & Exclusive Passes',
    titleJa: '育成アイテム＆コンテンツ特典',
    badgeKo: 'ITEMS & PASSES',
    badgeEn: 'ITEMS & PASSES',
    badgeJa: 'アイテム＆パス',
    descKo: '영웅 즉시 레벨업 경험치 영약(10병 세트) 및 광고 영구 제거 혜택',
    descEn: 'Hero instant level-up EXP elixirs (10-pack) and permanent ad removal.',
    descJa: '英雄即時レベルアップ経験値霊薬（10本セット）および広告永久解除特典',
    icon: '🧪',
  },
  {
    key: 'COIN',
    titleKo: 'SNS 코인 충전소 (SNS Coin Packages)',
    titleEn: 'SNS Coin Top-Up Station',
    titleJa: 'SNSコインチャージ所',
    badgeKo: 'COIN RECHARGE',
    badgeEn: 'COIN RECHARGE',
    badgeJa: 'コインチャージ',
    descKo: '국내 카드/카카오·네이버페이 및 Web3 글로벌 암호화폐(USDT, SOL, BTC) 즉시 충전',
    descEn: 'Credit cards, Kakao/Naver Pay, and Web3 crypto (USDT, SOL, BTC) instant recharge.',
    descJa: 'クレジットカード、Kakao/Naver Pay、Web3暗号資産（USDT、SOL、BTC）即時チャージ',
    icon: '💎',
  },
];

function renderShopProductCard(rawItem: ShopCardProduct, userCoins: number): string {
  const item = getLocalizedShopProduct(rawItem);
  const isCoin = item.category === 'COIN';
  const isAdRemoval = item.id === 'item_ad_removal';
  const isCoinPack = !isCoin && !isAdRemoval;
  const isAffordable = !isCoinPack || userCoins >= item.priceCoins;
  const packageId = isAdRemoval ? 'pkg_ad_removal' : item.id.replace('coin_charge_', 'coin_');

  const badgeColorClass =
    item.category === 'PACK'
      ? 'bg-amber-100 text-amber-900 border border-amber-300'
      : item.category === 'ITEM'
      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
      : 'bg-sky-100 text-sky-900 border border-sky-300';

  const categoryIcon = item.category === 'PACK' ? '🎴' : item.category === 'ITEM' ? '🧪' : '💎';

  return `
    <div class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-5 sm:p-6 rounded-none flex flex-col justify-between space-y-4 hover:border-[#201d1d] hover:shadow-md transition-all">
      <div class="space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-[10px] text-stone-500 uppercase font-bold tracking-wider">
            ${item.category}
          </span>
          <span class="px-2 py-0.5 text-[10px] font-bold rounded-sm ${badgeColorClass}">
            ${item.badge}
          </span>
        </div>

        <h3 class="text-base font-bold text-[#201d1d] m-0 flex items-center gap-1.5">
          <span>${categoryIcon}</span>
          <span>${item.name}</span>
        </h3>

        <p class="text-xs text-stone-600 leading-relaxed m-0 min-h-[36px]">
          ${item.description}
        </p>

        <div class="text-[11px] text-stone-500 pt-1 border-t border-[rgba(15,0,0,0.06)] font-mono">
          ✦ ${item.shortSpec}
        </div>
      </div>

      <div class="pt-4 border-t border-[rgba(15,0,0,0.08)] space-y-3">
        <div class="flex items-baseline justify-between">
          <span class="text-xs text-stone-500">${tr('가격:', 'Price:', '価格:')}</span>
          <span class="text-base font-black text-[#201d1d]">
            ${item.priceText}
          </span>
        </div>

        ${
          isCoin
            ? `
              <button
                type="button"
                data-action="open-coin-charge-modal"
                data-package-id="${packageId}"
                class="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center shadow-none cursor-pointer transition-colors"
              >
                💎 ${item.actionText}
              </button>
            `
            : isAdRemoval
            ? `
              <button
                type="button"
                data-action="open-coin-charge-modal"
                data-package-id="pkg_ad_removal"
                class="w-full py-2.5 bg-[#201d1d] hover:bg-[#343030] text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center shadow-none cursor-pointer transition-colors"
              >
                🛡️ ${item.actionText}
              </button>
            `
            : isAffordable
            ? `
              <button
                type="button"
                data-action="buy-shop-item"
                data-item-id="${item.id}"
                class="w-full py-2.5 bg-[#201d1d] hover:bg-[#343030] text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center shadow-none cursor-pointer transition-colors"
              >
                ✨ ${item.actionText}
              </button>
            `
            : `
              <button
                type="button"
                data-action="open-coin-charge-modal"
                data-package-id="coin_1000"
                class="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center shadow-none cursor-pointer transition-colors"
                title="${tr(`SNS 코인이 부족합니다 (부족: ${(item.priceCoins - userCoins).toLocaleString()} SNS)`, `Insufficient SNS coins (Need ${(item.priceCoins - userCoins).toLocaleString()} more)`, `SNSコイン不足 (不足: ${(item.priceCoins - userCoins).toLocaleString()} SNS)`)}"
              >
                ⚠️ ${tr('코인 충전 필요', 'Top-Up Needed', 'チャージが必要')} (${item.priceCoins.toLocaleString()} SNS)
              </button>
            `
        }
      </div>
    </div>
  `;
}

function renderShopCategorySectionBlock(
  sectionMeta: ShopCategorySectionMeta,
  products: ShopCardProduct[],
  coins: number
): string {
  const title = tr(sectionMeta.titleKo, sectionMeta.titleEn, sectionMeta.titleJa);
  const badge = tr(sectionMeta.badgeKo, sectionMeta.badgeEn, sectionMeta.badgeJa);
  const desc = tr(sectionMeta.descKo, sectionMeta.descEn, sectionMeta.descJa);

  return `
    <section class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 sm:p-8 rounded-none shadow-none space-y-6 mb-8">
      <!-- Section Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[rgba(15,0,0,0.08)] gap-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-wider uppercase">
              <span>${sectionMeta.icon}</span>
              <span>${badge}</span>
            </span>
            <span class="text-xs font-bold text-stone-500">
              ${tr(`총 ${products.length}개 상품`, `${products.length} Products`, `全${products.length}商品`)}
            </span>
          </div>
          <h2 class="text-lg sm:text-xl font-black text-[#201d1d] m-0">
            ${title}
          </h2>
          <p class="text-xs sm:text-sm text-stone-600 m-0">
            ${desc}
          </p>
        </div>
      </div>

      <!-- Products Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        ${products.map((item) => renderShopProductCard(item, coins)).join('')}
      </div>
    </section>
  `;
}

// ============================================================================
// Main View Renderer
// ============================================================================

export function renderShopView(): string {
  const coins = getUserCoins();
  const gold = getUserGold();
  const activeTab = currentCategoryTab;

  const packProducts = ALL_SHOP_PRODUCTS.filter((item) => item.category === 'PACK');
  const itemProducts = ALL_SHOP_PRODUCTS.filter((item) => item.category === 'ITEM');
  const coinProducts = ALL_SHOP_PRODUCTS.filter((item) => item.category === 'COIN');

  const packModal = renderPackRevealModal();
  const coinChargeModal = renderCoinChargeModal();
  const itemPurchaseModal = renderItemPurchaseSuccessModal();

  return `
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 font-mono text-[#201d1d] select-none">
      <!-- Top Shop Header & Balance Bar -->
      <section class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 sm:p-8 rounded-none shadow-none space-y-6 mb-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[rgba(15,0,0,0.08)] gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-wider uppercase mb-2">
              <span>${tr('SNS히어로 인게임 상점', 'SNSHero In-Game Shop', 'SNSHero ゲーム内ショップ')}</span>
              <span class="text-stone-400">·</span>
              <span>snshero.com/shop</span>
            </div>
            <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-[#201d1d] m-0">
              ${tr('상점 & 소환의 제단 (Shop)', 'Shop & Summon Altar', 'ショップ＆召喚の祭壇 (Shop)')}
            </h1>
            <p class="text-xs sm:text-sm text-stone-600 mt-1 m-0">
              ${tr(
                '영웅 카드팩 가챠 소환, 성장 영약 & 특전 패스, 그리고 SNS 코인을 충전할 수 있습니다.',
                'Summon hero card packs, purchase growth elixirs & passes, and recharge SNS coins.',
                '英雄カードパックガチャ召喚、育成霊薬＆特典パス、そしてSNSコインをチャージできます。'
              )}
            </p>
          </div>

          <!-- Coin Balance Display Only -->
          <div class="inline-flex items-center gap-3 px-4 py-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none shrink-0">
            <div class="text-right">
              <div class="text-[10px] text-stone-500 uppercase tracking-wider font-bold">
                ${tr('보유 코인', 'Coin Balance', '保有コイン')}
              </div>
              <div class="text-base sm:text-lg font-black text-[#201d1d]">
                ${coins.toLocaleString()} SNS
              </div>
            </div>
          </div>
        </div>

        <!-- Category Tab Bar (전체 / 카드팩 / 아이템 / 코인충전) with Count Badges -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[rgba(15,0,0,0.08)]">
          ${SHOP_CATEGORY_TABS.map((tab) => {
            const count =
              tab.key === 'ALL'
                ? ALL_SHOP_PRODUCTS.length
                : tab.key === 'PACK'
                ? packProducts.length
                : tab.key === 'ITEM'
                ? itemProducts.length
                : coinProducts.length;

            return `
            <button
              type="button"
              data-action="switch-shop-tab"
              data-tab="${tab.key}"
              class="px-4 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider min-h-[44px] cursor-pointer whitespace-nowrap flex items-center gap-2 transition-colors ${
                tab.key === activeTab
                  ? 'bg-[#201d1d] text-[#fdfcfc] border border-[#201d1d]'
                  : 'bg-[#f8f7f7] text-[#201d1d] border border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee]'
              }"
            >
              <span>${tab.icon}</span>
              <span>${getLocalizedShopTabLabel(tab.key)}</span>
              <span class="px-1.5 py-0.2 text-[10px] rounded-sm font-black ${
                tab.key === activeTab ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
              }">${count}</span>
            </button>
          `;
          }).join('')}
        </div>
      </section>

      <!-- Category Sections Content -->
      ${
        activeTab === 'ALL'
          ? `
            ${renderShopCategorySectionBlock(SHOP_CATEGORY_SECTIONS[0], packProducts, coins)}
            ${renderShopCategorySectionBlock(SHOP_CATEGORY_SECTIONS[1], itemProducts, coins)}
            ${renderShopCategorySectionBlock(SHOP_CATEGORY_SECTIONS[2], coinProducts, coins)}
          `
          : activeTab === 'PACK'
          ? renderShopCategorySectionBlock(SHOP_CATEGORY_SECTIONS[0], packProducts, coins)
          : activeTab === 'ITEM'
          ? renderShopCategorySectionBlock(SHOP_CATEGORY_SECTIONS[1], itemProducts, coins)
          : renderShopCategorySectionBlock(SHOP_CATEGORY_SECTIONS[2], coinProducts, coins)
      }

      <!-- Active Modals -->
      ${packModal}
      ${coinChargeModal}
      ${itemPurchaseModal}
    </div>
  `;
}
