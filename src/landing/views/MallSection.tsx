/**
 * src/landing/views/MallSection.tsx
 *
 * Dedicated Official Goods Mall Section for SNSHero (#mall).
 * Matches official https://snshero.com/mall structure with OpenCode Terminal-Flat design.
 *
 * Lineup:
 *   1. 110장 올인원 풀세트 (110 Card Collector's Box)
 *   2. 종족별 영웅 덱 (10장 세트 - 11종 팩션 선택)
 *   3. 히어로 3x3 배틀 게임테이블 (데스크 패브릭 매트)
 *   4. 히어로 커스텀 머그컵 (11oz 프리미엄 세라믹)
 *   5. 히어로 커스텀 티셔츠 (20수 고급 코튼 반팔)
 *
 * Purchase Flow:
 *   - Step 1: Minimalist Product Detail View (Options: Qty, Size, Faction)
 *   - Step 2: Minimal Shipping Input (Name, Phone, Address)
 *   - Step 3: Country Selection (10 Countries + Crypto)
 *   - Step 4: Real Payment Gateway (PayApp Lite / PayPal / Crypto / SIM Test)
 *   - Step 5: Order Confirmation & Persistence in 'hero_goods_orders'
 */

import { requestPayAppPayment, CRYPTO_PAYMENT_INFO } from '../services/paymentService';
import {
  CRYPTO_COINS_CATALOG,
  CRYPTO_QUICK_CHIPS,
  resolveCryptoDepositDetails,
} from '../services/qrCodeSvg';
import { tr } from '../services/i18n';
import { CARD_DATABASE } from '../../cardDatabase';
import { getCharacterAsset, getLocalizedCharacterName, getLocalizedFactionName } from '../services/assetCatalog';

export type MallCategoryTab = 'ALL' | 'CARD_SET' | 'APPAREL' | 'EQUIPMENT';

export interface MallGoodsProduct {
  id: string;
  category: 'CARD_SET' | 'APPAREL' | 'EQUIPMENT';
  name: string;
  badge: string;
  priceText: string;
  priceUsd: number;
  priceKrw: number;
  description: string;
  shortSpec: string;
  image: string;
}

export interface MallGoodsOrderRecord {
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

export const MALL_CATEGORY_TABS: Array<{ key: MallCategoryTab; label: string; icon: string }> = [
  { key: 'ALL', label: '전체 (ALL)', icon: '🏬' },
  { key: 'CARD_SET', label: '실물 카드·덱 (CARD)', icon: '🎴' },
  { key: 'APPAREL', label: '굿즈·의류 (MERCH)', icon: '☕' },
  { key: 'EQUIPMENT', label: '배틀 매트 (TABLE)', icon: '🛡️' },
];

export const MALL_GOODS_PRODUCTS: MallGoodsProduct[] = [
  {
    id: 'goods_deck_all',
    category: 'CARD_SET',
    name: '110장 올인원 풀세트 (10% 할인)',
    badge: '소장용 풀컬렉션',
    priceText: '$300.00 (420,000원)',
    priceUsd: 300.0,
    priceKrw: 420000,
    description: '11개 종족 110종 전 영웅 공식 실물 TCG 카드 완벽 패키지. 전용 하드케이스 동봉.',
    shortSpec: '110종 전 영웅 실물 카드 전량 수록 · 350gsm 고급 독일제 코어 블랙지 · 홀로그램 포일 박스',
    image: '/mall/cdn/shop/files/card.png',
  },
  {
    id: 'goods_deck_faction',
    category: 'CARD_SET',
    name: '종족별 영웅 덱 (10장 세트)',
    badge: '종족 테마 덱',
    priceText: '$30.00 (42,000원)',
    priceUsd: 30.0,
    priceKrw: 42000,
    description: '선택한 특정 종족 영웅 10장으로 구성된 테마 스타터 덱. 11대 종족 중 자유 선택.',
    shortSpec: '종족별 카드 10장 + 종족 고유 슬리브 10매 동봉 · 즉시 3x3 배틀 가능 구성',
    image: '/mall/cdn/shop/files/card.png',
  },
  {
    id: 'goods_table',
    category: 'EQUIPMENT',
    name: '히어로 3x3 배틀 게임테이블',
    badge: '전용 배틀 매트',
    priceText: '$30.00 (42,000원)',
    priceUsd: 30.0,
    priceKrw: 42000,
    description: '3x3 격자 전장과 N/E/S/W 스탯 룰이 각인된 고급 천연고무 게이밍 데스크 패브릭 매트.',
    shortSpec: '규격 600x350x4mm · 방수 코팅 패브릭 표면 · 미끄럼 방지 천연고무 바닥',
    image: '/mall/cdn/shop/files/pan.png',
  },
  {
    id: 'goods_mug',
    category: 'APPAREL',
    name: '히어로 커스텀 머그컵',
    badge: '공식 정품',
    priceText: '$10.00 (14,000원)',
    priceUsd: 10.0,
    priceKrw: 14000,
    description: '원하는 영웅 일러스트와 칭호가 고화질 전사 인쇄된 11oz 프리미엄 세라믹 머그컵.',
    shortSpec: '용량 11oz (약 330ml) · 고온 전사 세라믹 · 전자레인지/식기세척기 안심 사용',
    image: '/mall/cdn/shop/files/1.png',
  },
  {
    id: 'goods_tshirt',
    category: 'APPAREL',
    name: '히어로 커스텀 티셔츠',
    badge: '프리미엄 코튼',
    priceText: '$30.00 (42,000원)',
    priceUsd: 30.0,
    priceKrw: 42000,
    description: '20수 고급 코튼 원단에 대표 영웅 풀바디 공식 일러스트가 프린팅된 공식 반팔 티셔츠.',
    shortSpec: '면 100% 20수 코마사 · 정사이즈 유니섹스 핏 (S/M/L) · 넥라인 보강 테이핑',
    image: '/tshirt.png',
  },
];

export const MALL_COUNTRIES = [
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

export const FACTION_OPTIONS = [
  '성진기사단 (Human)',
  '원소정령 (Spirit)',
  '암흑심연 (Abyss)',
  '신성교단 (Holy)',
  '용족군단 (Dragon)',
  '기계제국 (Mecha)',
  '수호야수 (Beast)',
  '고대불멸 (Undead)',
  '환상요정 (Fairy)',
  '천상신족 (Celestial)',
  '혼돈마족 (Demon)',
];

function getLocalizedMallTabLabel(key: MallCategoryTab): string {
  switch (key) {
    case 'ALL':
      return tr('전체 (ALL)', 'ALL', 'すべて (ALL)');
    case 'CARD_SET':
      return tr('실물 카드·덱 (CARD)', 'Physical Cards (CARD)', '実物カード・デッキ (CARD)');
    case 'APPAREL':
      return tr('굿즈·의류 (MERCH)', 'Merch & Apparel (MERCH)', 'グッズ・アパレル (MERCH)');
    case 'EQUIPMENT':
      return tr('배틀 매트 (TABLE)', 'Battle Mat (TABLE)', 'バトルマット (TABLE)');
  }
}

function getLocalizedMallProduct(prod: MallGoodsProduct): MallGoodsProduct {
  switch (prod.id) {
    case 'goods_deck_all':
      return {
        ...prod,
        name: tr('110장 올인원 풀세트 (10% 할인)', '110-Card All-in-One Full Set (10% OFF)', '110枚オールインワン・フルセット (10%割引)'),
        badge: tr('소장용 풀컬렉션', "Collector's Full Set", 'コレクターズ・フルセット'),
        priceText: tr('$300.00 (420,000원)', '$300.00 (₩420,000)', '$300.00 (420,000ウォン)'),
        description: tr(
          '11개 종족 110종 전 영웅 공식 실물 TCG 카드 완벽 패키지. 전용 하드케이스 동봉.',
          'Complete official physical TCG card package featuring all 110 heroes across 11 factions. Includes dedicated hard case.',
          '11種族110種すべての英雄を網羅した公式実物TCGカード完全パッケージ。専用ハードケース同梱。'
        ),
        shortSpec: tr(
          '110종 전 영웅 실물 카드 전량 수록 · 350gsm 고급 독일제 코어 블랙지 · 홀로그램 포일 박스',
          'All 110 physical hero cards · 350gsm premium German black-core cardstock · Holographic foil box',
          '全110種英雄実物カード収録 · 350gsm高級ドイツ製ブラックコア紙 · ホログラム箔押しボックス'
        ),
      };
    case 'goods_deck_faction':
      return {
        ...prod,
        name: tr('종족별 영웅 덱 (10장 세트)', 'Faction Hero Deck (10-Card Set)', '種族別英雄デッキ (10枚セット)'),
        badge: tr('종족 테마 덱', 'Faction Theme Deck', '種族テーマデッキ'),
        priceText: tr('$30.00 (42,000원)', '$30.00 (₩42,000)', '$30.00 (42,000ウォン)'),
        description: tr(
          '선택한 특정 종족 영웅 10장으로 구성된 테마 스타터 덱. 11대 종족 중 자유 선택.',
          'Themed starter deck composed of 10 heroes from your chosen faction. Choose freely from 11 major factions.',
          '選択した特定種族の英雄10枚で構成されたテーマスターターデッキ。11大種族から自由に選択可能。'
        ),
        shortSpec: tr(
          '종족별 카드 10장 + 종족 고유 슬리브 10매 동봉 · 즉시 3x3 배틀 가능 구성',
          '10 faction cards + 10 faction sleeves included · Ready for instant 3x3 battle',
          '種族別カード10枚 + 種族固有スリーブ10枚同梱 · すぐに3x3バトル可能な構成'
        ),
      };
    case 'goods_table':
      return {
        ...prod,
        name: tr('히어로 3x3 배틀 게임테이블', 'Hero 3x3 Battle Game Table Mat', 'ヒーロー 3x3 バトルゲームテーブルマット'),
        badge: tr('전용 배틀 매트', 'Dedicated Battle Mat', '専用バトルマット'),
        priceText: tr('$30.00 (42,000원)', '$30.00 (₩42,000)', '$30.00 (42,000ウォン)'),
        description: tr(
          '3x3 격자 전장과 N/E/S/W 스탯 룰이 각인된 고급 천연고무 게이밍 데스크 패브릭 매트.',
          'Premium natural rubber gaming desk fabric mat printed with the 3x3 grid battlefield and N/E/S/W stat rules.',
          '3x3グリッド戦場とN/E/S/Wステータスルールが刻印された高級天然ゴム・ゲーミングデスクファブリックマット。'
        ),
        shortSpec: tr(
          '규격 600x350x4mm · 방수 코팅 패브릭 표면 · 미끄럼 방지 천연고무 바닥',
          'Size 600x350x4mm · Water-repellent coated fabric surface · Non-slip natural rubber base',
          'サイズ 600x350x4mm · 防水コーティングファブリック表面 · 滑り止め天然ゴム底面'
        ),
      };
    case 'goods_mug':
      return {
        ...prod,
        name: tr('히어로 커스텀 머그컵', 'Hero Custom Mug', 'ヒーロー・カスタムマグカップ'),
        badge: tr('공식 정품', 'Official Merch', '公式正規品'),
        priceText: tr('$10.00 (14,000원)', '$10.00 (₩14,000)', '$10.00 (14,000ウォン)'),
        description: tr(
          '원하는 영웅 일러스트와 칭호가 고화질 전사 인쇄된 11oz 프리미엄 세라믹 머그컵.',
          '11oz premium ceramic mug featuring high-definition transfer printing of your favorite hero illustration and title.',
          'お好みの英雄イラストと称号が高画質転写印刷された11ozプレミアムセラミックマグカップ。'
        ),
        shortSpec: tr(
          '용량 11oz (약 330ml) · 고온 전사 세라믹 · 전자레인지/식기세척기 안심 사용',
          'Capacity 11oz (~330ml) · High-temp transfer ceramic · Microwave & dishwasher safe',
          '容量 11oz (約330ml) · 高温転写セラミック · 電子レンジ/食洗機対応'
        ),
      };
    case 'goods_tshirt':
      return {
        ...prod,
        name: tr('히어로 커스텀 티셔츠', 'Hero Custom T-Shirt', 'ヒーロー・カスタムTシャツ'),
        badge: tr('프리미엄 코튼', 'Premium Cotton', 'プレミアムコットン'),
        priceText: tr('$30.00 (42,000원)', '$30.00 (₩42,000)', '$30.00 (42,000ウォン)'),
        description: tr(
          '20수 고급 코튼 원단에 대표 영웅 풀바디 공식 일러스트가 프린팅된 공식 반팔 티셔츠.',
          'Official short-sleeve T-shirt printed with full-body hero artwork on premium 20s combed cotton fabric.',
          '20番手高級コットン生地に代表英雄のフルボディ公式イラストがプリントされた公式半袖Tシャツ。'
        ),
        shortSpec: tr(
          '면 100% 20수 코마사 · 정사이즈 유니섹스 핏 (S/M/L) · 넥라인 보강 테이핑',
          '100% 20s combed cotton · Regular unisex fit (S/M/L) · Reinforced neckline taping',
          '綿100% 20番手コーマ糸 · レギュラーユニセックスフィット (S/M/L) · ネックライン補強テーピング'
        ),
      };
    default:
      return prod;
  }
}

function getLocalizedMallFactionOption(f: string): string {
  const map: Record<string, [string, string]> = {
    '성진기사단 (Human)': ['Star Knights (Human)', '星辰騎士団 (Human)'],
    '원소정령 (Spirit)': ['Elemental Spirit (Spirit)', '元素精霊 (Spirit)'],
    '암흑심연 (Abyss)': ['Dark Abyss (Abyss)', '暗黒深淵 (Abyss)'],
    '신성교단 (Holy)': ['Holy Order (Holy)', '神聖教団 (Holy)'],
    '용족군단 (Dragon)': ['Dragon Legion (Dragon)', '竜族軍団 (Dragon)'],
    '기계제국 (Mecha)': ['Mecha Empire (Mecha)', '機械帝国 (Mecha)'],
    '수호야수 (Beast)': ['Guardian Beast (Beast)', '守護野獣 (Beast)'],
    '고대불멸 (Undead)': ['Ancient Undead (Undead)', '古代不滅 (Undead)'],
    '환상요정 (Fairy)': ['Fantasy Fairy (Fairy)', '幻想妖精 (Fairy)'],
    '천상신족 (Celestial)': ['Celestial Gods (Celestial)', '天上神族 (Celestial)'],
    '혼돈마족 (Demon)': ['Chaos Demon (Demon)', '混沌魔族 (Demon)'],
  };
  const found = map[f];
  return found ? tr(f, found[0], found[1]) : f;
}

// ============================================================================
// Internal State
// ============================================================================

let currentMallTab: MallCategoryTab = 'ALL';
let activeDetailProduct: MallGoodsProduct | null = null;
let mallModalStep:
  | 'detail'
  | 'shipping'
  | 'country'
  | 'payment'
  | 'celebration'
  | 'crypto_coin'
  | 'crypto_chain'
  | 'crypto_deposit'
  | 'crypto'
  | 'orders'
  | null = null;

let selectedQty = 1;
let selectedSize = 'L';
let selectedFaction = '성진기사단 (Human)';
let selectedMugCardId = 41; // Default: Kadan (#41, Royal Gold)
let isMugCardPickerOpen = false;

let selectedTshirtCardId = 41; // Default: Kadan (#41, Royal Gold)
let isTshirtCardPickerOpen = false;

export function setSelectedMugCardId(cardId: number): void {
  selectedMugCardId = cardId;
  isMugCardPickerOpen = false;
}

export function toggleMugCardPicker(): void {
  isMugCardPickerOpen = !isMugCardPickerOpen;
}

export function getSelectedMugCardId(): number {
  return selectedMugCardId;
}

export function setSelectedTshirtCardId(cardId: number): void {
  selectedTshirtCardId = cardId;
  isTshirtCardPickerOpen = false;
}

export function toggleTshirtCardPicker(): void {
  isTshirtCardPickerOpen = !isTshirtCardPickerOpen;
}

export function getSelectedTshirtCardId(): number {
  return selectedTshirtCardId;
}

export function renderMugMockupPreview(cardId: number, isThumbnail: boolean = false): string {
  const card = CARD_DATABASE[cardId] || CARD_DATABASE[41] || CARD_DATABASE[1];
  const bustUrl = getCharacterAsset(card.id, 'bust');
  const locName = getLocalizedCharacterName(card.id) || card.title;
  const locFaction = getLocalizedFactionName(card.element);

  const containerClass = isThumbnail
    ? 'relative w-full h-full flex items-center justify-center select-none overflow-hidden'
    : 'relative w-48 sm:w-56 h-44 sm:h-52 mx-auto bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] flex items-center justify-center p-2 select-none';

  return `
    <div class="${containerClass}">
      <!-- White Ceramic Mug Base -->
      <img src="/mug.png" alt="Mug Base" class="max-h-full max-w-full object-contain" />

      <!-- Cylindrical Curved Printed Card Overlay -->
      <div class="absolute top-[26%] left-[36%] w-[29%] aspect-[5/7] rotate-[-2.5deg] overflow-hidden shadow-sm pointer-events-none rounded-xs border border-amber-400/60 bg-[#161414] flex flex-col justify-between p-0.5 opacity-95">
        <div class="relative w-full aspect-square overflow-hidden bg-black/40">
          <img src="${bustUrl}" alt="${locName}" class="w-full h-full object-cover" />
          <span class="absolute top-0.5 left-0.5 px-0.5 py-0.2 bg-black/85 text-[6px] text-amber-300 font-black leading-none">${locFaction}</span>
          <span class="absolute top-0.5 right-0.5 px-0.5 py-0.2 bg-amber-400 text-stone-950 text-[6px] font-black leading-none">${card.rarity}</span>
        </div>
        <div class="w-full text-center text-[7px] font-bold text-amber-200 truncate py-0.2">
          ${locName}
        </div>
        <div class="w-full grid grid-cols-4 gap-0.2 text-[5.5px] font-mono font-bold bg-black/60 text-stone-300 text-center py-0.2">
          <span>▲${card.top}</span><span>▶${card.right}</span><span>▼${card.bottom}</span><span>◀${card.left}</span>
        </div>
      </div>
    </div>
  `;
}

export function renderTshirtMockupPreview(cardId: number, isThumbnail: boolean = false): string {
  const card = CARD_DATABASE[cardId] || CARD_DATABASE[41] || CARD_DATABASE[1];
  const bustUrl = getCharacterAsset(card.id, 'bust');
  const locName = getLocalizedCharacterName(card.id) || card.title;
  const locFaction = getLocalizedFactionName(card.element);

  const containerClass = isThumbnail
    ? 'relative w-full h-full flex items-center justify-center select-none overflow-hidden'
    : 'relative w-48 sm:w-56 h-48 sm:h-56 mx-auto bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] flex items-center justify-center p-2 select-none';

  return `
    <div class="${containerClass}">
      <!-- White Cotton T-shirt Base Mockup -->
      <img src="/tshirt.png" alt="T-Shirt Base" class="max-h-full max-w-full object-contain filter contrast-[1.02]" />

      <!-- Chest Center Custom Printed Hero Card Overlay -->
      <div class="absolute top-[28%] left-1/2 -translate-x-1/2 w-[27%] sm:w-[29%] aspect-[5/7] overflow-hidden shadow-md pointer-events-none rounded-xs border border-amber-400/80 bg-[#161414] flex flex-col justify-between p-0.5 opacity-95">
        <div class="relative w-full aspect-square overflow-hidden bg-black/50">
          <img src="${bustUrl}" alt="${locName}" class="w-full h-full object-cover" />
          <span class="absolute top-0.5 left-0.5 px-0.5 py-0.2 bg-black/85 text-[6px] text-amber-300 font-black leading-none">${locFaction}</span>
          <span class="absolute top-0.5 right-0.5 px-0.5 py-0.2 bg-amber-400 text-stone-950 text-[6px] font-black leading-none">${card.rarity}</span>
        </div>
        <div class="w-full text-center text-[7px] font-bold text-amber-200 truncate py-0.2">
          ${locName}
        </div>
        <div class="w-full grid grid-cols-4 gap-0.2 text-[5.5px] font-mono font-bold bg-black/70 text-stone-300 text-center py-0.2">
          <span>▲${card.top}</span><span>▶${card.right}</span><span>▼${card.bottom}</span><span>◀${card.left}</span>
        </div>
      </div>
    </div>
  `;
}

let buyerName = '';
let buyerPhone = '';
let buyerAddress = '';
let selectedCountry = 'ko';
let selectedPaymentMethod: string | null = null;
let lastCompletedOrder: MallGoodsOrderRecord | null = null;

// Mall Crypto state
let mallCryptoCcy: string = 'USDT';
let mallCryptoChain: string = 'USDT-TRC20';
let mallCryptoCopied: boolean = false;
let mallCryptoVerifyNotice: string | null = null;

// ============================================================================
// State Getters & Actions
// ============================================================================

export function getMallCurrentTab(): MallCategoryTab {
  return currentMallTab;
}

export function setMallCurrentTab(tab: MallCategoryTab): void {
  currentMallTab = tab;
}

export function openMallProductDetail(productId: string): void {
  const prod = MALL_GOODS_PRODUCTS.find((p) => p.id === productId);
  if (!prod) return;
  activeDetailProduct = prod;
  selectedQty = 1;
  selectedSize = 'L';
  selectedFaction = '성진기사단 (Human)';
  mallModalStep = 'detail';
}

export function closeMallModal(): void {
  mallModalStep = null;
  activeDetailProduct = null;
}

export function setMallQty(qty: number): void {
  selectedQty = Math.max(1, Math.min(10, qty));
}

export function setMallSize(size: string): void {
  selectedSize = size;
}

export function setMallFaction(faction: string): void {
  selectedFaction = faction;
}

export function proceedMallToShipping(): void {
  mallModalStep = 'shipping';
}

export function backMallToDetail(): void {
  mallModalStep = 'detail';
}

export function submitMallShipping(info: { name: string; phone: string; address: string }): boolean {
  if (!info.name.trim() || !info.phone.trim() || !info.address.trim()) {
    alert(
      tr(
        '받는 분 성함, 연락처, 배송지 주소를 모두 입력해주세요.',
        'Please enter the recipient name, phone number, and shipping address.',
        '受取人氏名、連絡先、配送先住所をすべて入力してください。'
      )
    );
    return false;
  }
  buyerName = info.name.trim();
  buyerPhone = info.phone.trim();
  buyerAddress = info.address.trim();
  mallModalStep = 'country';
  return true;
}

export function backMallToShipping(): void {
  mallModalStep = 'shipping';
}

export function selectMallCountry(countryCode: string): void {
  selectedCountry = countryCode;
  mallModalStep = 'payment';
}

export function backMallToCountry(): void {
  mallModalStep = 'country';
}

export function openMallOrdersList(): void {
  mallModalStep = 'orders';
}

export function getMallSavedOrders(): MallGoodsOrderRecord[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem('hero_goods_orders');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Executes checkout for goods:
 * If a real payment method (card, kakaopay, naverpay, applepay) is clicked:
 * Triggers actual PayApp Lite payment gateway without giving free goods.
 * If SIM test is clicked, grants immediate mock confirmation.
 */
export async function executeMallCheckout(method: string): Promise<boolean> {
  if (!activeDetailProduct) return false;

  selectedPaymentMethod = method;
  const totalUsd = activeDetailProduct.priceUsd * selectedQty;
  const totalKrw = activeDetailProduct.priceKrw * selectedQty;

  const customHeroName =
    activeDetailProduct.id === 'goods_tshirt'
      ? ` (#${selectedTshirtCardId} ${getLocalizedCharacterName(selectedTshirtCardId)})`
      : activeDetailProduct.id === 'goods_mug'
      ? ` (#${selectedMugCardId} ${getLocalizedCharacterName(selectedMugCardId)})`
      : '';

  const orderData: MallGoodsOrderRecord = {
    id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    productId: activeDetailProduct.id,
    title: `${activeDetailProduct.name}${customHeroName}`,
    quantity: selectedQty,
    size: activeDetailProduct.id === 'goods_tshirt' ? selectedSize : undefined,
    faction: activeDetailProduct.id === 'goods_deck_faction' ? selectedFaction : undefined,
    priceUsd: totalUsd,
    priceKrw: totalKrw,
    buyerName: buyerName || '모험가',
    buyerPhone: buyerPhone || '010-0000-0000',
    buyerAddress: buyerAddress || '대한민국',
    country: selectedCountry || 'ko',
    paymentMethod: method,
    orderedAt: Date.now(),
    status: 'paid',
  };

  if (method === 'test_sim') {
    // Immediate mock order confirmation for developer testing
    const existing = getMallSavedOrders();
    existing.unshift(orderData);
    localStorage.setItem('hero_goods_orders', JSON.stringify(existing));
    lastCompletedOrder = orderData;
    mallModalStep = 'celebration';
    return true;
  }

  if (method === 'crypto') {
    mallCryptoCopied = false;
    mallCryptoVerifyNotice = null;
    mallModalStep = 'crypto_coin';
    return true;
  }

  if (method === 'paypal') {
    // Real PayPal flow
    const returnUrl = encodeURIComponent(window.location.origin + window.location.pathname + '#mall?payapp_success=goods');
    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=dryudryu@gmail.com&item_name=${encodeURIComponent(
      activeDetailProduct.name
    )}&amount=${totalUsd.toFixed(2)}&currency_code=USD&return=${returnUrl}`;
    localStorage.setItem('hero_goods_pending_order', JSON.stringify(orderData));
    window.location.href = paypalUrl;
    return true;
  }

  // Real PayApp payment gateway
  let payappMethod = 'card';
  if (method === 'payapp_card') payappMethod = 'card';
  else if (method === 'kakaopay') payappMethod = 'kakaopay';
  else if (method === 'naverpay') payappMethod = 'naverpay';
  else if (method === 'applepay') payappMethod = 'applepay';
  else if (method === 'wechatpay') payappMethod = 'wechatpay';

  await requestPayAppPayment({
    goodname: activeDetailProduct.name + (selectedQty > 1 ? ` (${selectedQty}개)` : ''),
    priceKrw: totalKrw,
    method: payappMethod,
    returnParam: 'goods',
    recvphone: buyerPhone || '01000000000',
    targetHash: '#mall',
    pendingOrder: orderData,
  });

  return true;
}

export function selectMallCryptoCoin(ccy: string): void {
  const found = CRYPTO_COINS_CATALOG.find((c) => c.ccy === ccy) || CRYPTO_COINS_CATALOG[0];
  mallCryptoCcy = found.ccy;
  mallCryptoCopied = false;
  mallCryptoVerifyNotice = null;
  if (found.chains.length > 1) {
    mallModalStep = 'crypto_chain';
  } else {
    mallCryptoChain = found.chains[0] || `${found.ccy}-TRC20`;
    mallModalStep = 'crypto_deposit';
  }
}

export function selectMallCryptoChain(chain: string): void {
  mallCryptoChain = chain;
  mallCryptoCopied = false;
  mallCryptoVerifyNotice = null;
  mallModalStep = 'crypto_deposit';
}

export function backMallToCryptoCoin(): void {
  mallModalStep = 'crypto_coin';
  mallCryptoCopied = false;
  mallCryptoVerifyNotice = null;
}

export function backMallToPayment(): void {
  mallModalStep = 'payment';
}

export function copyMallCryptoAddress(address: string): void {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(address).catch(() => {});
  }
  mallCryptoCopied = true;
}

export function verifyMallCryptoDeposit(): void {
  mallCryptoVerifyNotice = tr(
    '블록체인 네트워크에서 입금 내역을 조회 중입니다. 송금 후 네트워크 컨펌 완료 시 주문이 자동 승인됩니다.',
    'Checking deposit on the blockchain network. Your order will be automatically approved once confirmed.',
    'ブロックチェーンネットワークで入金履歴を照会中です。送金後、ネットワーク承認完了時に注文が自動承認されます。'
  );
}

// ============================================================================
// Modal Renderer
// ============================================================================

export function renderMallModal(): string {
  if (!mallModalStep) return '';

  if (mallModalStep === 'orders') {
    const orders = getMallSavedOrders();
    return `
      <div id="mall-orders-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
        <div class="bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-lg w-full max-h-[85vh] flex flex-col p-6 shadow-none">
          <div class="flex items-center justify-between pb-3 border-b border-[rgba(15,0,0,0.08)]">
            <h3 class="text-sm font-bold m-0">${tr('[주문 내역] 실물 굿즈 배송 주문', '[Order History] Physical Merch Orders', '[注文履歴] 実物グッズ配送注文')}</h3>
            <button type="button" data-action="close-mall-modal" class="text-stone-500 hover:text-black font-bold p-1">[x]</button>
          </div>
          <div class="flex-1 overflow-y-auto py-4 space-y-3">
            ${
              orders.length === 0
                ? `<div class="text-center py-8 text-xs text-stone-500">${tr('아직 주문된 내역이 없습니다.', 'No orders placed yet.', 'まだ注文履歴がありません。')}</div>`
                : orders
                    .map(
                      (ord) => `
              <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] rounded-none text-xs space-y-1">
                <div class="flex items-center justify-between font-bold">
                  <span>${ord.title} (${ord.quantity}${tr('개', ' pcs', '個')})</span>
                  <span class="text-emerald-700 font-mono">${ord.status === 'paid' ? tr('결제완료', 'Paid', '決済完了') : tr('배송준비', 'Preparing', '配送準備中')}</span>
                </div>
                <div class="text-[11px] text-stone-600">${tr('주문번호', 'Order ID', '注文番号')}: ${ord.id} · ${tr('금액', 'Amount', '金額')}: ${ord.priceKrw.toLocaleString()}${tr('원', ' KRW', 'ウォン')}</div>
                <div class="text-[11px] text-stone-500">${tr('받는 분', 'Recipient', '受取人')}: ${ord.buyerName} (${ord.buyerPhone})</div>
                <div class="text-[10px] text-stone-500">${tr('배송지', 'Address', '配送先')}: ${ord.buyerAddress}</div>
              </div>
            `
                    )
                    .join('')
            }
          </div>
          <button type="button" data-action="close-mall-modal" class="w-full py-2.5 bg-[#f1eeee] hover:bg-[#e8e5e5] text-xs font-bold rounded-sm min-h-[44px]">${tr('닫기', 'Close', '閉じる')}</button>
        </div>
      </div>
    `;
  }

  if (mallModalStep === 'celebration' && lastCompletedOrder) {
    return `
      <div id="mall-celebration-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
        <div class="bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-md w-full p-6 text-center space-y-4 shadow-none">
          <div class="text-3xl">🎉</div>
          <h3 class="text-base font-black m-0">${tr('굿즈 주문이 성공적으로 접수되었습니다!', 'Your merch order has been successfully placed!', 'グッズのご注文が正常に受け付けられました！')}</h3>
          <p class="text-xs text-stone-600 leading-relaxed">
            ${tr('주문번호', 'Order ID', '注文番号')}: <strong>${lastCompletedOrder.id}</strong><br/>
            ${tr('상품', 'Product', '商品')}: <strong>${lastCompletedOrder.title}</strong> (${lastCompletedOrder.quantity}${tr('개', ' pcs', '個')})<br/>
            ${tr('수령인', 'Recipient', '受取人')}: ${lastCompletedOrder.buyerName} (${lastCompletedOrder.buyerPhone})<br/>
            ${tr('배송지', 'Address', '配送先')}: ${lastCompletedOrder.buyerAddress}
          </p>
          <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] text-[11px] text-stone-600">
            ${tr(
              '주문 승인이 완료되었으며, 상품 준비 후 발송 시 안내 문자가 발송됩니다.',
              'Your order is approved. A notification will be sent once the item is shipped.',
              '注文承認が完了しました。商品の準備ができ次第、発送案内をお送りします。'
            )}
          </div>
          <button type="button" data-action="close-mall-modal" class="w-full py-3 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs rounded-sm min-h-[44px]">
            ${tr('확인 (완료)', 'Confirm (Done)', '確認 (完了)')}
          </button>
        </div>
      </div>
    `;
  }

  if (
    mallModalStep === 'crypto_coin' ||
    mallModalStep === 'crypto_chain' ||
    mallModalStep === 'crypto_deposit' ||
    mallModalStep === 'crypto'
  ) {
    const prod = activeDetailProduct ? getLocalizedMallProduct(activeDetailProduct) : null;
    const totalUsd = prod ? prod.priceUsd * selectedQty : 29.0;
    const totalKrw = prod ? prod.priceKrw * selectedQty : 39000;
    const prodLabel = prod ? `${prod.name} (${selectedQty}${tr('개', ' pcs', '個')})` : tr('공식 굿즈 주문', 'Official Merch Order', '公式グッズ注文');

    return `
      <div id="mall-crypto-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
        <div class="bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-lg w-full p-6 space-y-4 shadow-none">
          <div class="flex items-center justify-between pb-3 border-b border-[rgba(15,0,0,0.08)]">
            <div>
              <span class="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-600 text-white rounded-sm mb-1">
                ${tr('굿즈 암호화폐 결제', 'Merch Crypto Payment', 'グッズ暗号資産決済')}
              </span>
              <h3 class="text-sm sm:text-base font-bold m-0">⚡ ${tr('암호화폐 결제', 'Crypto Payment', '暗号資産決済')} (${prodLabel})</h3>
            </div>
            <button type="button" data-action="close-mall-modal" class="text-stone-500 hover:text-black font-bold p-1">[x]</button>
          </div>

          ${
            mallModalStep === 'crypto_coin'
              ? `
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <button type="button" data-action="back-mall-payment" class="text-xs text-stone-500 hover:text-black font-bold cursor-pointer py-1">
                      ← ${tr('결제 수단 변경', 'Change Payment Method', '決済手段を変更')}
                    </button>
                    <span class="text-xs font-bold text-[#201d1d]">$${totalUsd.toFixed(2)} USD (${totalKrw.toLocaleString()}${tr('원', ' KRW', 'ウォン')})</span>
                  </div>

                  <div class="flex flex-wrap gap-1.5 text-[11px]">
                    ${CRYPTO_QUICK_CHIPS.map(
                      (chip) => `
                        <button
                          type="button"
                          data-action="select-mall-crypto-coin"
                          data-ccy="${chip}"
                          class="px-2.5 py-1.5 min-h-[38px] bg-[#f8f7f7] hover:bg-[#201d1d] hover:text-[#fdfcfc] text-[#201d1d] rounded-sm font-bold border border-[rgba(15,0,0,0.12)] transition-colors cursor-pointer"
                        >
                          ${chip}
                        </button>
                      `
                    ).join('')}
                  </div>

                  <div class="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    ${CRYPTO_COINS_CATALOG.map(
                      (coin) => `
                        <button
                          type="button"
                          data-action="select-mall-crypto-coin"
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
                            </div>
                          </div>
                          <span class="text-xs font-bold text-stone-500">${tr('선택 →', 'Select →', '選択 →')}</span>
                        </button>
                      `
                    ).join('')}
                  </div>
                </div>
              `
              : ''
          }

          ${
            mallModalStep === 'crypto_chain'
              ? (() => {
                  const coinObj =
                    CRYPTO_COINS_CATALOG.find((c) => c.ccy === mallCryptoCcy) || CRYPTO_COINS_CATALOG[0];
                  return `
                    <div class="space-y-3">
                      <div class="flex items-center justify-between">
                        <button type="button" data-action="back-mall-crypto-coin" class="text-xs text-stone-500 hover:text-black font-bold cursor-pointer py-1">
                          ← ${tr('코인 다시 선택', 'Reselect Coin', 'コインを再選択')}
                        </button>
                        <span class="text-xs font-bold text-[#201d1d]">⚡ ${coinObj.ccy} ${tr('네트워크 선택', 'Select Network', 'ネットワーク選択')}</span>
                      </div>
                      <div class="space-y-2 max-h-60 overflow-y-auto">
                        ${coinObj.chains
                          .map((chainItem) => {
                            const chainName = chainItem.replace(`${coinObj.ccy}-`, '');
                            return `
                              <button
                                type="button"
                                data-action="select-mall-crypto-chain"
                                data-chain="${chainItem}"
                                class="w-full p-3.5 min-h-[48px] bg-[#fdfcfc] hover:bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] hover:border-[#201d1d] rounded-none flex items-center justify-between transition-colors cursor-pointer text-left"
                              >
                                <span class="font-black text-xs sm:text-sm text-[#201d1d]">${chainName} (${chainItem})</span>
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
            mallModalStep === 'crypto_deposit' || mallModalStep === 'crypto'
              ? (() => {
                  const deposit = resolveCryptoDepositDetails(mallCryptoCcy, mallCryptoChain, totalUsd);
                  return `
                    <div class="space-y-3.5 max-h-[75vh] overflow-y-auto pr-0.5">
                      <div class="flex items-center justify-between">
                        <button type="button" data-action="back-mall-crypto-coin" class="text-xs text-stone-500 hover:text-black font-bold cursor-pointer py-1">
                          ← ${tr('다른 코인/네트워크 선택', 'Select Another Coin/Network', '別のコイン/ネットワークを選択')}
                        </button>
                        <span class="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm">
                          ${deposit.chain}
                        </span>
                      </div>

                      <div class="bg-[#f8f7f7] border border-[#201d1d] rounded-none p-3 text-center space-y-1">
                        <span class="text-[10px] text-stone-500 font-bold block uppercase tracking-wider">${tr('전송해야 할 정확한 금액', 'Exact Amount to Send', '送金する正確な金額')}</span>
                        <div class="text-xl sm:text-2xl font-black text-[#201d1d]">
                          ${deposit.amount} <span class="text-sm font-bold text-amber-700">${deposit.ccy}</span>
                        </div>
                        <span class="text-[10px] text-stone-600 font-bold block">${tr('네트워크', 'Network', 'ネットワーク')}: ${deposit.chain}</span>
                      </div>

                      <div class="flex flex-col items-center justify-center p-3 bg-white border border-[rgba(15,0,0,0.12)] rounded-none">
                        <div class="p-1 bg-white border border-stone-200 flex items-center justify-center">
                          ${deposit.qrSvg}
                        </div>
                        <span class="text-[10px] text-stone-500 mt-1.5 font-mono font-bold">
                          ${tr('지갑 앱으로 QR 코드를 스캔하여 전송하세요', 'Scan the QR code with your wallet app to send', 'ウォレットアプリでQRコードをスキャンして送金してください')}
                        </span>
                      </div>

                      <div class="space-y-1.5">
                        <label class="text-[11px] font-bold text-stone-600 block">${tr('입금 전용 지갑 주소', 'Deposit Wallet Address', '入金専用ウォレットアドレス')} (${deposit.chain})</label>
                        <div class="flex items-center gap-1.5">
                          <input
                            type="text"
                            readonly
                            value="${deposit.address}"
                            class="flex-1 p-2.5 text-[11px] bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm font-mono font-bold text-[#201d1d] select-all focus:outline-none"
                          />
                          <button
                            type="button"
                            data-action="copy-mall-crypto-address"
                            data-address="${deposit.address}"
                            class="px-3 py-2.5 min-h-[44px] bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] rounded-sm text-xs font-bold flex items-center justify-center cursor-pointer shrink-0"
                          >
                            ${mallCryptoCopied ? tr('✓ 복사됨', '✓ Copied', '✓ コピー済') : tr('복사', 'Copy', 'コピー')}
                          </button>
                        </div>
                      </div>

                      ${
                        mallCryptoVerifyNotice
                          ? `<div class="p-2.5 bg-amber-50 border border-amber-400 text-amber-900 text-[11px] font-bold rounded-none">${mallCryptoVerifyNotice}</div>`
                          : ''
                      }

                      <div class="space-y-2 pt-1">
                        <button
                          type="button"
                          data-action="verify-mall-crypto-deposit"
                          class="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-sm min-h-[44px] cursor-pointer"
                        >
                          ⚡ ${tr('입금 완료 즉시 확인 (수동 새로고침)', 'Verify Deposit Now (Manual Refresh)', '入金完了を即時確認 (手動更新)')}
                        </button>
                        <button type="button" data-action="close-mall-modal" class="w-full py-2.5 bg-[#f1eeee] hover:bg-[#e8e5e5] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] cursor-pointer">
                          ${tr('결제 취소 (닫기)', 'Cancel Payment (Close)', '決済キャンセル (閉じる)')}
                        </button>
                      </div>
                    </div>
                  `;
                })()
              : ''
          }
        </div>
      </div>
    `;
  }

  if (!activeDetailProduct) return '';

  const localizedDetailProd = getLocalizedMallProduct(activeDetailProduct);
  const totalUsd = localizedDetailProd.priceUsd * selectedQty;
  const totalKrw = localizedDetailProd.priceKrw * selectedQty;

  // Step 1: Detail
  if (mallModalStep === 'detail') {
    return `
      <div id="mall-detail-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
        <div class="bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-lg w-full max-h-[90vh] flex flex-col p-6 shadow-none">
          <div class="flex items-center justify-between pb-3 border-b border-[rgba(15,0,0,0.08)]">
            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm">
              ${localizedDetailProd.badge}
            </span>
            <button type="button" data-action="close-mall-modal" class="text-stone-500 hover:text-black font-bold p-1">[x]</button>
          </div>

          <div class="flex-1 overflow-y-auto py-4 space-y-4">
            <div class="w-full bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] flex items-center justify-center p-3">
              ${
                localizedDetailProd.id === 'goods_mug'
                  ? renderMugMockupPreview(selectedMugCardId)
                  : localizedDetailProd.id === 'goods_tshirt'
                  ? renderTshirtMockupPreview(selectedTshirtCardId)
                  : `<img src="${localizedDetailProd.image}" alt="${localizedDetailProd.name}" class="max-h-44 max-w-full object-contain" />`
              }
            </div>

            <div>
              <h2 class="text-base font-black text-[#201d1d] m-0">${localizedDetailProd.name}</h2>
              <div class="text-sm font-black text-emerald-800 mt-1">
                ${localizedDetailProd.priceText}
              </div>
              <p class="text-xs text-stone-600 mt-2 leading-relaxed m-0">
                ${localizedDetailProd.description}
              </p>
            </div>

            <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] text-[11px] text-stone-600">
              <span class="font-bold text-[#201d1d]">${tr('제품 사양:', 'Specifications:', '製品仕様:')}</span> ${localizedDetailProd.shortSpec}
            </div>

            <!-- Options -->
            <div class="space-y-3 pt-2 border-t border-[rgba(15,0,0,0.08)]">
              ${
                localizedDetailProd.id === 'goods_mug'
                  ? `
                <div class="p-3 bg-[#f8f7f7] border border-stone-300 rounded-none space-y-2">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-[10px] font-bold text-stone-500 uppercase tracking-wider">${tr('머그컵 인쇄 영웅 카드', 'Custom Printed Hero Card', 'マグカップ印刷英雄カード')}</div>
                      <div class="text-xs font-black text-[#201d1d]">
                        #${selectedMugCardId} ${getLocalizedCharacterName(selectedMugCardId)}
                      </div>
                    </div>
                    <button
                      type="button"
                      data-action="toggle-mug-picker"
                      class="px-3 py-1.5 bg-[#201d1d] hover:bg-[#343030] text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[36px] cursor-pointer"
                    >
                      ${isMugCardPickerOpen ? tr('선택 닫기 ▲', 'Close Picker ▲', '閉じる ▲') : tr('카드 변경 🔄', 'Change Card 🔄', 'カード変更 🔄')}
                    </button>
                  </div>

                  ${
                    isMugCardPickerOpen
                      ? `
                    <div class="pt-2 border-t border-stone-300">
                      <div class="text-[10px] text-stone-600 mb-1.5 font-bold">
                        ${tr('110종 영웅 중 머그컵에 인쇄할 카드를 선택하세요:', 'Select a hero card to print on your mug:', 'マグカップに印刷するカードを選択してください:')}
                      </div>
                      <div class="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1 bg-white border border-stone-300 rounded-none">
                        ${Object.values(CARD_DATABASE)
                          .slice(0, 110)
                          .map((c) => {
                            const isCur = c.id === selectedMugCardId;
                            const cName = getLocalizedCharacterName(c.id) || c.title;
                            return `
                          <button
                            type="button"
                            data-action="select-mug-card"
                            data-card-id="${c.id}"
                            class="p-1 border ${
                              isCur ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-400' : 'border-stone-200 hover:border-stone-400 bg-white'
                            } flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95"
                            title="${cName}"
                          >
                            <img src="${getCharacterAsset(c.id, 'bust')}" alt="${cName}" class="w-9 h-9 object-cover rounded-xs" />
                            <span class="text-[8px] font-bold text-stone-800 truncate w-full text-center mt-0.5">#${c.id}</span>
                          </button>
                        `;
                          })
                          .join('')}
                      </div>
                    </div>
                  `
                      : ''
                  }
                </div>
              `
                  : ''
              }
              ${
                localizedDetailProd.id === 'goods_tshirt'
                  ? `
                <div class="p-3 bg-[#f8f7f7] border border-stone-300 rounded-none space-y-2">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-[10px] font-bold text-stone-500 uppercase tracking-wider">${tr('티셔츠 인쇄 영웅 카드', 'Custom Printed Hero Card', 'Tシャツ印刷英雄カード')}</div>
                      <div class="text-xs font-black text-[#201d1d]">
                        #${selectedTshirtCardId} ${getLocalizedCharacterName(selectedTshirtCardId)}
                      </div>
                    </div>
                    <button
                      type="button"
                      data-action="toggle-tshirt-picker"
                      class="px-3 py-1.5 bg-[#201d1d] hover:bg-[#343030] text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[36px] cursor-pointer"
                    >
                      ${isTshirtCardPickerOpen ? tr('선택 닫기 ▲', 'Close Picker ▲', '閉じる ▲') : tr('카드 변경 🔄', 'Change Card 🔄', 'カード変更 🔄')}
                    </button>
                  </div>

                  ${
                    isTshirtCardPickerOpen
                      ? `
                    <div class="pt-2 border-t border-stone-300">
                      <div class="text-[10px] text-stone-600 mb-1.5 font-bold">
                        ${tr('110종 영웅 중 티셔츠 가슴에 인쇄할 카드를 선택하세요:', 'Select a hero card to print on your T-shirt:', 'Tシャツ胸に印刷するカードを選択してください:')}
                      </div>
                      <div class="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1 bg-white border border-stone-300 rounded-none">
                        ${Object.values(CARD_DATABASE)
                          .slice(0, 110)
                          .map((c) => {
                            const isCur = c.id === selectedTshirtCardId;
                            const cName = getLocalizedCharacterName(c.id) || c.title;
                            return `
                          <button
                            type="button"
                            data-action="select-tshirt-card"
                            data-card-id="${c.id}"
                            class="p-1 border ${
                              isCur ? 'border-amber-400 bg-amber-50 ring-1 ring-amber-400' : 'border-stone-200 hover:border-stone-400 bg-white'
                            } flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95"
                            title="${cName}"
                          >
                            <img src="${getCharacterAsset(c.id, 'bust')}" alt="${cName}" class="w-9 h-9 object-cover rounded-xs" />
                            <span class="text-[8px] font-bold text-stone-800 truncate w-full text-center mt-0.5">#${c.id}</span>
                          </button>
                        `;
                          })
                          .join('')}
                      </div>
                    </div>
                  `
                      : ''
                  }
                </div>

                <div>
                  <label class="block text-xs font-bold text-stone-700 mb-1">${tr('사이즈 선택 (Size):', 'Select Size:', 'サイズ選択 (Size):')}</label>
                  <div class="flex gap-2">
                    ${['S (90)', 'M (95)', 'L (100)', 'XL (105)']
                      .map(
                        (sz) => `
                      <button type="button" data-action="select-mall-size" data-size="${sz}" class="flex-1 py-2 text-xs font-bold rounded-sm border ${
                          selectedSize === sz ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]' : 'bg-white text-stone-700 border-stone-300'
                        }">
                        ${sz}
                      </button>
                    `
                      )
                      .join('')}
                  </div>
                </div>
              `
                  : ''
              }

              ${
                localizedDetailProd.id === 'goods_deck_faction'
                  ? `
                <div>
                  <label class="block text-xs font-bold text-stone-700 mb-1">${tr('종족 선택 (Faction):', 'Select Faction:', '種族選択 (Faction):')}</label>
                  <select data-action="change-mall-faction" class="w-full p-2.5 bg-white border border-stone-300 text-xs font-mono rounded-sm">
                    ${FACTION_OPTIONS.map(
                      (f) => `<option value="${f}" ${selectedFaction === f ? 'selected' : ''}>${getLocalizedMallFactionOption(f)}</option>`
                    ).join('')}
                  </select>
                </div>
              `
                  : ''
              }

              <div class="flex items-center justify-between pt-1">
                <span class="text-xs font-bold text-stone-700">${tr('주문 수량:', 'Quantity:', '注文数量:')}</span>
                <div class="flex items-center border border-stone-300 rounded-sm">
                  <button type="button" data-action="change-mall-qty" data-delta="-1" class="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-xs font-bold min-h-[36px]">-</button>
                  <span class="px-4 py-1 text-xs font-bold">${selectedQty}</span>
                  <button type="button" data-action="change-mall-qty" data-delta="1" class="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-xs font-bold min-h-[36px]">+</button>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-[rgba(15,0,0,0.08)]">
                <span class="text-xs font-bold text-stone-700">${tr('총 결제 예정액:', 'Total Amount:', 'お支払い合計額:')}</span>
                <span class="text-sm font-black text-[#201d1d]">
                  $${totalUsd.toFixed(2)} USD / ${totalKrw.toLocaleString()}${tr('원', ' KRW', 'ウォン')}
                </span>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-[rgba(15,0,0,0.08)] flex gap-2">
            <button type="button" data-action="close-mall-modal" class="flex-1 py-3 bg-[#f1eeee] hover:bg-[#e8e5e5] text-xs font-bold rounded-sm min-h-[44px]">
              ${tr('닫기', 'Close', '閉じる')}
            </button>
            <button type="button" data-action="proceed-mall-shipping" class="flex-2 py-3 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[44px]">
              ${tr('즉시 구매 (배송지 입력) →', 'Buy Now (Enter Shipping) →', '今すぐ購入 (配送先入力) →')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Step 2: Shipping
  if (mallModalStep === 'shipping') {
    return `
      <div id="mall-shipping-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
        <div class="bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-lg w-full p-6 shadow-none space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-[rgba(15,0,0,0.08)]">
            <div class="flex items-center gap-2">
              <button type="button" data-action="back-mall-detail" class="text-xs text-stone-500 hover:text-black">← ${tr('상품', 'Item', '商品')}</button>
              <h3 class="text-sm font-bold m-0">${tr('배송지 정보 입력', 'Shipping Information', '配送先情報の入力')}</h3>
            </div>
            <button type="button" data-action="close-mall-modal" class="text-stone-500 hover:text-black font-bold p-1">[x]</button>
          </div>

          <form id="mall-shipping-form" class="space-y-3" onsubmit="event.preventDefault();">
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">${tr('받는 분 성함 (Name) *', 'Recipient Name *', '受取人氏名 (Name) *')}</label>
              <input type="text" id="mall-buyer-name" value="${buyerName}" placeholder="${tr('홍길동', 'John Doe', '山田 太郎')}" class="w-full p-2.5 bg-white border border-stone-300 text-xs rounded-sm min-h-[44px]" required />
            </div>
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">${tr('연락처 (Phone) *', 'Phone Number *', '連絡先 (Phone) *')}</label>
              <input type="tel" id="mall-buyer-phone" value="${buyerPhone}" placeholder="010-1234-5678" class="w-full p-2.5 bg-white border border-stone-300 text-xs rounded-sm min-h-[44px]" required />
            </div>
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">${tr('배송지 상세 주소 (Address) *', 'Shipping Address *', '配送先詳細住所 (Address) *')}</label>
              <input type="text" id="mall-buyer-address" value="${buyerAddress}" placeholder="${tr('도로명 주소 및 상세 동호수 입력', 'Street address, apartment/suite, city, postal code', '都道府県・市区町村・番地・建物名を入力')}" class="w-full p-2.5 bg-white border border-stone-300 text-xs rounded-sm min-h-[44px]" required />
            </div>

            <div class="pt-3 border-t border-[rgba(15,0,0,0.08)] flex gap-2">
              <button type="button" data-action="back-mall-detail" class="flex-1 py-3 bg-[#f1eeee] text-xs font-bold rounded-sm min-h-[44px]">${tr('이전', 'Back', '戻る')}</button>
              <button type="button" data-action="submit-mall-shipping" class="flex-2 py-3 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[44px]">
                ${tr('결제 국가 선택 →', 'Select Country →', '決済国を選択 →')}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // Step 3: Country
  if (mallModalStep === 'country') {
    return `
      <div id="mall-country-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
        <div class="bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-lg w-full p-6 shadow-none space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-[rgba(15,0,0,0.08)]">
            <div class="flex items-center gap-2">
              <button type="button" data-action="back-mall-shipping" class="text-xs text-stone-500 hover:text-black">← ${tr('배송지', 'Shipping', '配送先')}</button>
              <h3 class="text-sm font-bold m-0">${tr('결제 국가 선택', 'Select Payment Country', '決済国の選択')}</h3>
            </div>
            <span class="text-xs font-bold text-[#201d1d]">$${totalUsd.toFixed(2)} USD</span>
          </div>

          <div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            ${MALL_COUNTRIES.map(
              (c) => `
              <button type="button" data-action="select-mall-country" data-country-code="${c.code}" class="p-3 bg-[#f8f7f7] hover:bg-[#f1eeee] border border-[rgba(15,0,0,0.08)] text-left flex items-center gap-2.5 rounded-sm min-h-[44px]">
                <span class="text-lg">${c.flag}</span>
                <div>
                  <div class="text-xs font-bold text-[#201d1d]">${c.name.split(' ')[0]}</div>
                  <div class="text-[10px] text-stone-500">${c.currency}</div>
                </div>
              </button>
            `
            ).join('')}
          </div>

          <button type="button" data-action="execute-mall-checkout" data-method="crypto" class="w-full p-3 bg-amber-600 hover:bg-amber-700 text-white rounded-sm text-xs font-bold flex items-center justify-between min-h-[44px]">
            <span>⚡ ${tr('암호화폐 결제 (USDT / SOL / BTC)', 'Crypto Payment (USDT / SOL / BTC)', '暗号資産決済 (USDT / SOL / BTC)')}</span>
            <span>${tr('즉시 지갑 결제 →', 'Instant Wallet Pay →', '即時ウォレット決済 →')}</span>
          </button>
        </div>
      </div>
    `;
  }

  // Step 4: Payment
  if (mallModalStep === 'payment') {
    return `
      <div id="mall-payment-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
        <div class="bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-lg w-full p-6 shadow-none space-y-4">
          <div class="flex items-center justify-between pb-2 border-b border-[rgba(15,0,0,0.08)]">
            <div class="flex items-center gap-2">
              <button type="button" data-action="back-mall-country" class="text-xs text-stone-500 hover:text-black">← ${tr('국가', 'Country', '国選択')}</button>
              <h3 class="text-sm font-bold m-0">${tr('결제 수단 선택', 'Select Payment Method', '決済手段の選択')}</h3>
            </div>
            <span class="text-xs font-bold text-[#201d1d]">${totalKrw.toLocaleString()}${tr('원', ' KRW', 'ウォン')}</span>
          </div>

          <div class="space-y-2">
            ${
              selectedCountry === 'ko'
                ? `
              <button type="button" data-action="execute-mall-checkout" data-method="payapp_card" class="w-full py-3 px-4 bg-[#1e58ff] hover:bg-[#1542c7] text-white font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
                <span>💳 ${tr('국내 신용/체크카드 (PayApp)', 'Credit/Debit Card (PayApp)', '韓国国内クレジット/チェックカード (PayApp)')}</span>
                <span>${totalKrw.toLocaleString()}${tr('원 결제 →', ' KRW Pay →', 'ウォン決済 →')}</span>
              </button>
              <button type="button" data-action="execute-mall-checkout" data-method="kakaopay" class="w-full py-3 px-4 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
                <span>🟡 ${tr('카카오페이 (Kakao Pay)', 'Kakao Pay', 'カカオペイ (Kakao Pay)')}</span>
                <span>${tr('간편결제 →', 'Quick Pay →', '簡単決済 →')}</span>
              </button>
              <button type="button" data-action="execute-mall-checkout" data-method="naverpay" class="w-full py-3 px-4 bg-[#03C75A] hover:bg-[#02b351] text-white font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
                <span>🟢 ${tr('네이버페이 (Naver Pay)', 'Naver Pay', 'ネイバーペイ (Naver Pay)')}</span>
                <span>${tr('간편결제 →', 'Quick Pay →', '簡単決済 →')}</span>
              </button>
              <button type="button" data-action="execute-mall-checkout" data-method="applepay" class="w-full py-3 px-4 bg-black hover:bg-stone-800 text-white font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
                <span>🍎 Apple Pay</span>
                <span>${tr('원터치 결제 →', 'One-Touch Pay →', 'ワンタッチ決済 →')}</span>
              </button>
            `
                : `
              <button type="button" data-action="execute-mall-checkout" data-method="paypal" class="w-full py-3 px-4 bg-[#003087] hover:bg-[#002466] text-white font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
                <span>🅿️ PayPal Express Checkout</span>
                <span>$${totalUsd.toFixed(2)} USD →</span>
              </button>
              <button type="button" data-action="execute-mall-checkout" data-method="applepay" class="w-full py-3 px-4 bg-black hover:bg-stone-800 text-white font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
                <span>🍎 Apple Pay</span>
                <span>Instant Checkout →</span>
              </button>
            `
            }

            <button type="button" data-action="execute-mall-checkout" data-method="crypto" class="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
              <span>⚡ ${tr('암호화폐 결제 (USDT / SOL / BTC)', 'Crypto Payment (USDT / SOL / BTC)', '暗号資産決済 (USDT / SOL / BTC)')}</span>
              <span>${tr('Web3 지갑 결제 →', 'Web3 Wallet Pay →', 'Web3ウォレット決済 →')}</span>
            </button>

            <!-- Test Simulation Button Clearly Separated -->
            <button type="button" data-action="execute-mall-checkout" data-method="test_sim" class="w-full py-2.5 px-4 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px] mt-2 border border-stone-400">
              <span>🧪 ${tr('[개발자/시뮬레이션] 즉시 주문 승인 (SIM - 무과금)', '[Dev/Sim] Instant Order Approval (SIM - Free)', '[開発者/シミュレーション] 即時注文承認 (SIM - 無料)')}</span>
              <span class="text-[10px] text-stone-600">${tr('결제창 없이 주문 확정', 'Confirm without payment', '決済画面なしで注文確定')}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return '';
}

// ============================================================================
// Main View Renderer
// ============================================================================

export function renderMallView(): string {
  const activeTab = currentMallTab;
  const filtered = (
    activeTab === 'ALL'
      ? MALL_GOODS_PRODUCTS
      : MALL_GOODS_PRODUCTS.filter((p) => p.category === activeTab)
  ).map(getLocalizedMallProduct);

  const modalHtml = renderMallModal();

  return `
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 font-mono text-[#201d1d] select-none">
      <!-- Top Mall Banner & Actions -->
      <section class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 sm:p-8 rounded-none shadow-none space-y-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[rgba(15,0,0,0.08)] gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-wider uppercase mb-2">
              <span>${tr('공식 실물 굿즈 스토어', 'Official Physical Merch Store', '公式実物グッズストア')}</span>
              <span class="text-stone-400">·</span>
              <span>snshero.com/mall</span>
            </div>
            <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-[#201d1d] m-0">
              ${tr('SNS히어로 공식 굿즈 몰 (Official Goods Mall)', 'SNSHero Official Goods Mall', 'SNSヒーロー公式グッズモール (Official Goods Mall)')}
            </h1>
            <p class="text-xs sm:text-sm text-stone-600 mt-1 m-0">
              ${tr(
                '110종 풀세트 실물 TCG 카드, 11대 종족별 테마 덱, 배틀 매트 게임테이블, 머그컵 및 공식 의류를 만나보세요.',
                'Discover the 110-card full physical TCG set, 11 faction theme decks, battle mat game tables, mugs, and official apparel.',
                '全110種フルセット実物TCGカード、11大種族別テーマデッキ、バトルマットゲームテーブル、マグカップ、公式アパレルをチェックしましょう。'
              )}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              data-action="open-mall-orders"
              class="px-4 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] flex items-center justify-center whitespace-nowrap cursor-pointer"
            >
              📦 ${tr('내 주문 내역 조회', 'My Order History', '注文履歴を照会')}
            </button>
            <a
              href="#shop"
              data-nav="shop"
              class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center whitespace-nowrap cursor-pointer no-underline"
            >
              ${tr('인게임 상점 바로가기 →', 'Go to In-Game Shop →', 'ゲーム内ショップへ →')}
            </a>
          </div>
        </div>

        <!-- Category Tabs -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[rgba(15,0,0,0.08)]">
          ${MALL_CATEGORY_TABS.map(
            (tab) => `
            <button
              type="button"
              data-action="switch-mall-tab"
              data-tab="${tab.key}"
              class="px-4 py-2.5 rounded-sm text-xs font-bold uppercase tracking-wider min-h-[44px] cursor-pointer whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                tab.key === activeTab
                  ? 'bg-[#201d1d] text-[#fdfcfc] border border-[#201d1d]'
                  : 'bg-[#f8f7f7] text-[#201d1d] border border-[rgba(15,0,0,0.12)] hover:bg-[#f1eeee]'
              }"
            >
              <span>${tab.icon}</span>
              <span>${getLocalizedMallTabLabel(tab.key)}</span>
            </button>
          `
          ).join('')}
        </div>
      </section>

      <!-- Goods Products Grid -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${filtered
          .map((prod) => {
            return `
            <div class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-5 sm:p-6 rounded-none flex flex-col justify-between space-y-4 hover:border-[#201d1d] transition-colors">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] text-stone-500 uppercase font-bold tracking-wider">
                    ${prod.category}
                  </span>
                  <span class="px-2 py-0.5 bg-[#f1eeee] text-[#201d1d] text-[10px] font-bold rounded-sm">
                    ${prod.badge}
                  </span>
                </div>

                <div
                  class="w-full h-44 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] rounded-none flex items-center justify-center p-2 overflow-hidden cursor-pointer"
                  data-action="open-mall-detail"
                  data-product-id="${prod.id}"
                >
                  ${
                    prod.id === 'goods_mug'
                      ? renderMugMockupPreview(selectedMugCardId, true)
                      : prod.id === 'goods_tshirt'
                      ? renderTshirtMockupPreview(selectedTshirtCardId, true)
                      : `<img src="${prod.image}" alt="${prod.name}" class="max-h-full max-w-full object-contain" />`
                  }
                </div>

                <h3 class="text-base font-bold text-[#201d1d] m-0">
                  ${prod.name}
                </h3>

                <p class="text-xs text-stone-600 leading-relaxed m-0">
                  ${prod.description}
                </p>

                <div class="text-[11px] text-stone-500 line-clamp-1">
                  ${prod.shortSpec}
                </div>
              </div>

              <div class="pt-4 border-t border-[rgba(15,0,0,0.08)] space-y-3">
                <div class="flex items-baseline justify-between">
                  <span class="text-xs text-stone-500">${tr('가격:', 'Price:', '価格:')}</span>
                  <span class="text-base font-black text-[#201d1d]">
                    ${prod.priceText}
                  </span>
                </div>

                <button
                  type="button"
                  data-action="open-mall-detail"
                  data-product-id="${prod.id}"
                  class="w-full py-2.5 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center shadow-none cursor-pointer transition-colors"
                >
                  ${tr('상세보기 &amp; 즉시구매', 'View Details &amp; Buy Now', '詳細表示 &amp; 今すぐ購入')}
                </button>
              </div>
            </div>
          `;
          })
          .join('')}
      </section>

      ${modalHtml}
    </div>
  `;
}
