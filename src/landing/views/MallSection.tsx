/**
 * src/landing/views/MallSection.tsx
 *
 * Official Character Sheet IP License Store (#mall) for SNSHero Landing.
 * - Replaces all legacy physical goods with the 110 updated Studio Character Sheets (NO.001 ~ NO.110).
 * - Each character sheet incorporates the newly updated upper-body bust portrait in Panel 02.
 * - Priced at $10.00 USD (14,000 KRW) each under an IP License Unlock (라이센스 해제) condition.
 * - Follows DESIGN.md OpenCode Terminal-Flat aesthetic (100% font-mono, 0px/4px radius, 1px hairline borders).
 */

import { requestPayAppPayment } from '../services/paymentService';
import {
  CRYPTO_COINS_CATALOG,
  resolveCryptoDepositDetails,
  type CryptoCoinOption,
} from '../services/qrCodeSvg';
import { getCurrentLanguage, tr } from '../services/i18n';
import {
  getCharacterAsset,
  getLocalizedCharacterName,
  getLocalizedFactionName,
  FACTION_PALETTES,
} from '../services/assetCatalog';

export type MallGoodsCategory =
  | 'ALL'
  | 'UNLOCKED'
  | 'WATER'
  | 'FIRE'
  | 'WIND'
  | 'EARTH'
  | 'HUMAN'
  | 'UNDEAD'
  | 'ELF'
  | 'DWARF'
  | 'MONSTER'
  | 'ROBOT'
  | 'DRAGON';

export interface MallGoodsProduct {
  id: string;
  cardId: number;
  code: string;
  faction: string;
  rarity: string;
  category: MallGoodsCategory;
  name: string;
  badge: string;
  priceText: string;
  priceUsd: number;
  priceKrw: number;
  imageUrl: string;
  bustUrl: string;
  bustJpgUrl: string;
  cutoutUrl: string;
  desc: string;
  spec: string;
  licenseTerms: string;
}

export interface GoodsOrderRecord {
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  size: string;
  priceText: string;
  buyerName: string;
  buyerPhone: string;
  shippingAddress: string;
  paymentMethod: string;
  status: string;
  createdAt: number;
}

const UNLOCKED_SHEETS_STORAGE_KEY = 'hero_unlocked_character_sheets';
const GOODS_ORDERS_KEY = 'hero_goods_orders';
const SHEET_CACHE_VER = '20261104v1';

export function getUnlockedSheetIds(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(UNLOCKED_SHEETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((n) => Number(n)).filter((n) => n >= 1 && n <= 110);
  } catch {
    return [];
  }
}

export function isCharacterSheetUnlocked(cardId: number): boolean {
  return getUnlockedSheetIds().includes(Number(cardId));
}

export function unlockCharacterSheetLicense(cardId: number): void {
  if (typeof window === 'undefined') return;
  try {
    const current = new Set(getUnlockedSheetIds());
    current.add(Number(cardId));
    window.localStorage.setItem(
      UNLOCKED_SHEETS_STORAGE_KEY,
      JSON.stringify(Array.from(current).sort((a, b) => a - b))
    );
  } catch {
    // ignore storage quota errors
  }
}

export function getGoodsOrders(): GoodsOrderRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(GOODS_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      orderId: item.orderId || item.id || `LIC-${Date.now()}`,
      productId: item.productId || 'sheet_001',
      productName: item.productName || item.title || 'Character Sheet License',
      quantity: Number(item.quantity) || 1,
      size: item.size || 'IP LICENSE UNLOCK ($10.00)',
      priceText:
        item.priceText ||
        `$${Number(item.priceUsd || 10).toFixed(2)} (${Number(item.priceKrw || 14000).toLocaleString()}원)`,
      buyerName: item.buyerName || '모험가',
      buyerPhone: item.buyerPhone || '010-0000-0000',
      shippingAddress: item.shippingAddress || item.buyerAddress || 'Digital License Unlock',
      paymentMethod: item.paymentMethod || 'test_sim',
      status: item.status || 'paid',
      createdAt: Number(item.createdAt || item.orderedAt || Date.now()),
    }));
  } catch {
    return [];
  }
}

export function submitGoodsOrder(
  input: Omit<GoodsOrderRecord, 'orderId' | 'status' | 'createdAt'>
): GoodsOrderRecord {
  const record: GoodsOrderRecord = {
    ...input,
    orderId: `LIC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    status: 'paid',
    createdAt: Date.now(),
  };
  if (typeof window !== 'undefined') {
    try {
      const existing = getGoodsOrders();
      existing.unshift(record);
      window.localStorage.setItem(GOODS_ORDERS_KEY, JSON.stringify(existing.slice(0, 100)));
    } catch {
      // ignore storage errors
    }
  }
  return record;
}

function getPaymentMethodLabel(method: string): string {
  if (method === 'payapp_card') return tr('국내 카드/간편결제 (PayApp)', 'PayApp Card/EasyPay', 'PayAppカード決済');
  if (method === 'paypal') return 'PayPal (USD)';
  if (method === 'crypto') return 'Crypto QR';
  return tr('즉시 라이센스 결제', 'Instant License Unlock', '即時ライセンス決済');
}

function getOrderStatusLabel(_status: string): string {
  return tr('라이센스 해제 완료', 'LICENSE ACTIVE', 'ライセンス解除済');
}

// ─── Generate 110 Official Character Sheet License Products ($10.00 Each) ───

function buildCharacterSheetProducts(): MallGoodsProduct[] {
  const list: MallGoodsProduct[] = [];
  for (let cid = 1; cid <= 110; cid++) {
    const pad3 = String(cid).padStart(3, '0');
    const asset = getCharacterAsset(cid);
    const factionUpper = (asset.faction || 'water').toUpperCase() as MallGoodsCategory;
    const sheetCleanPath = asset.sheetUrl.split('?')[0];
    const sheetUrlWithVer = `${sheetCleanPath}?v=${SHEET_CACHE_VER}`;
    const bustUrlWithVer = `${asset.bustPngUrl}?v=${SHEET_CACHE_VER}`;
    const bustJpgUrlWithVer = `${asset.bustJpgUrl}?v=${SHEET_CACHE_VER}`;

    list.push({
      id: `sheet_${pad3}`,
      cardId: cid,
      code: `NO.${pad3}`,
      faction: asset.faction,
      rarity: (asset.rarity || 'bronze').toUpperCase(),
      category: factionUpper,
      name: `[NO.${pad3}] ${asset.nameKo} (${asset.nameEn}) 캐릭터시트`,
      badge: 'LICENSE UNLOCK · $10',
      priceText: '$10.00 (14,000원)',
      priceUsd: 10.0,
      priceKrw: 14000,
      imageUrl: sheetUrlWithVer,
      bustUrl: bustUrlWithVer,
      bustJpgUrl: bustJpgUrlWithVer,
      cutoutUrl: asset.cutoutUrl,
      desc: `원작 소설 『카단의 여정』 공식 애니메이션 캐릭터 설정화 시트 (NO.${pad3} ${asset.nameKo}). 수정된 상반신 표정·헤어 디테일(Panel 02)과 7등신 전신 원화(Panel 01), 3등신 SD 원형(Panel 03), 작화 지침서 및 컬러칩(Panel 04)이 수록되어 있으며 구매 즉시 상업적·2차 창작 IP 라이센스가 영구 해제됩니다.`,
      spec: '1600×1000 HD 캐릭터시트(JPG) + 수정된 상반신(PNG) + 7등신 투명 원화(PNG) | 상업적·2차 창작 라이센스 영구 해제',
      licenseTerms:
        '개당 $10.00 라이센스 해제 조건: 구매 즉시 해당 캐릭터의 2차 창작·유튜브/숏폼 영상·웹툰·인디게임·커스텀 굿즈 제작 등 상업적/비상업적 IP 활용 라이센스가 영구 해제되며 고해상도 원본 시트 다운로드를 제공합니다.',
    });
  }
  return list;
}

export const MALL_GOODS_PRODUCTS: MallGoodsProduct[] = buildCharacterSheetProducts();

export interface MallShippingCountry {
  code: string;
  nameKo: string;
  nameEn: string;
  regionLabel: string;
  shippingFeeKrw: number;
  shippingFeeUsd: number;
  deliveryDays: string;
}

export const MALL_SHIPPING_COUNTRIES: MallShippingCountry[] = [
  { code: 'KR', nameKo: '대한민국 (South Korea)', nameEn: 'South Korea', regionLabel: '국내 디지털 라이센스 즉시 발급 (수수료 무료)', shippingFeeKrw: 0, shippingFeeUsd: 0, deliveryDays: '결제 즉시 라이센스 해제 및 원본 다운로드' },
  { code: 'US', nameKo: '미국 / 캐나다 (USA & Canada)', nameEn: 'USA & Canada', regionLabel: '글로벌 디지털 라이센스 즉시 발급 ($0 Fee)', shippingFeeKrw: 0, shippingFeeUsd: 0, deliveryDays: 'Instant Digital License Unlock & Download' },
  { code: 'JP', nameKo: '일본 (Japan)', nameEn: 'Japan', regionLabel: '글로벌 디지털 라이센스 즉시 발급 ($0 Fee)', shippingFeeKrw: 0, shippingFeeUsd: 0, deliveryDays: 'Instant Digital License Unlock & Download' },
  { code: 'SG', nameKo: '아시아 / 싱가포르 / 대만 / 홍콩', nameEn: 'Asia Pacific (SG/TW/HK)', regionLabel: '글로벌 디지털 라이센스 즉시 발급 ($0 Fee)', shippingFeeKrw: 0, shippingFeeUsd: 0, deliveryDays: 'Instant Digital License Unlock & Download' },
  { code: 'EU', nameKo: '유럽 / 영국 / 호주 (EU / UK / AU)', nameEn: 'Europe / UK / Australia', regionLabel: '글로벌 디지털 라이센스 즉시 발급 ($0 Fee)', shippingFeeKrw: 0, shippingFeeUsd: 0, deliveryDays: 'Instant Digital License Unlock & Download' },
  { code: 'GLOBAL', nameKo: '기타 글로벌 국가 (Rest of World)', nameEn: 'Rest of World', regionLabel: '글로벌 디지털 라이센스 즉시 발급 ($0 Fee)', shippingFeeKrw: 0, shippingFeeUsd: 0, deliveryDays: 'Instant Digital License Unlock & Download' },
];

export type MallModalStep =
  | 'detail'
  | 'shipping'
  | 'country'
  | 'payment'
  | 'crypto_select'
  | 'crypto_qr'
  | 'complete'
  | 'orders_list';

interface MallCheckoutState {
  currentTab: MallGoodsCategory;
  activeProductId: string | null;
  step: MallModalStep;
  quantity: number;
  selectedSize: string;
  selectedFaction: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  selectedCountryCode: string;
  selectedPaymentMethod: string;
  selectedCryptoCoinId: string | null;
  selectedCryptoChain: string | null;
  cryptoSearchQuery: string;
  currentPage: number;
  completedOrder: GoodsOrderRecord | null;
  feedbackMsg: string | null;
}

export const MALL_ITEMS_PER_PAGE = 10;

const VALID_TABS: MallGoodsCategory[] = [
  'ALL',
  'UNLOCKED',
  'WATER',
  'FIRE',
  'WIND',
  'EARTH',
  'HUMAN',
  'UNDEAD',
  'ELF',
  'DWARF',
  'MONSTER',
  'ROBOT',
  'DRAGON',
];

function getInitialMallTab(): MallGoodsCategory {
  if (typeof window === 'undefined') return 'ALL';
  try {
    const saved = localStorage.getItem('hero_mall_active_tab') as MallGoodsCategory | null;
    if (saved && VALID_TABS.includes(saved)) {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'ALL';
}

const mallState: MallCheckoutState = {
  currentTab: getInitialMallTab(),
  activeProductId: null,
  step: 'detail',
  quantity: 1,
  selectedSize: 'STANDARD',
  selectedFaction: 'water',
  buyerName: '',
  buyerPhone: '',
  buyerAddress: '',
  selectedCountryCode: 'KR',
  selectedPaymentMethod: '',
  selectedCryptoCoinId: null,
  selectedCryptoChain: null,
  cryptoSearchQuery: '',
  currentPage: 1,
  completedOrder: null,
  feedbackMsg: null,
};

export function setMallCurrentTab(tab: MallGoodsCategory): void {
  const normalized = VALID_TABS.includes(tab) ? tab : 'ALL';
  mallState.currentTab = normalized;
  mallState.currentPage = 1;
  try {
    localStorage.setItem('hero_mall_active_tab', normalized);
  } catch {
    // ignore
  }
}

export function setMallPage(page: number): void {
  mallState.currentPage = Math.max(1, Math.floor(page));
}

export function getMallCurrentPage(): number {
  return mallState.currentPage;
}

// Legacy compatibility exports kept as safe no-ops for index.ts
export function toggleMugCardPicker(): void {}
export function setSelectedMugCardId(_cardId: number): void {}
export function toggleTshirtCardPicker(): void {}
export function setSelectedTshirtCardId(_cardId: number): void {}

function getLocalizedMallProduct(p: MallGoodsProduct): {
  name: string;
  badge: string;
  priceText: string;
  desc: string;
  spec: string;
  licenseTerms: string;
} {
  const charName = getLocalizedCharacterName(p.cardId);
  const facName = getLocalizedFactionName(p.faction);
  const unlocked = isCharacterSheetUnlocked(p.cardId);

  return {
    name: tr(
      `[${p.code}] ${charName} 공식 캐릭터시트`,
      `[${p.code}] ${charName} Character Sheet`,
      `[${p.code}] ${charName} 公式キャラクターシート`
    ),
    badge: unlocked
      ? tr('✓ 라이센스 해제 완료', '✓ LICENSE UNLOCKED', '✓ ライセンス解除済')
      : tr('라이센스 해제 조건 · $10.00', 'LICENSE UNLOCK · $10.00', 'ライセンス解除 · $10.00'),
    priceText: tr('$10.00 (14,000원)', '$10.00 USD', '$10.00 (¥1,500)'),
    desc: tr(
      `원작 소설 『카단의 여정』 ${facName} 진영 공식 애니메이션 캐릭터 설정화 시트(${p.code} ${charName}). 수정된 상반신 표정·헤어 디테일(Panel 02)과 7등신 전신 원화(Panel 01), 3등신 SD 원형(Panel 03), 작화 지침서(Panel 04)가 수록되어 있습니다.`,
      `Official 1600×1000 Studio Animation Character Sheet for ${charName} (${p.code}, ${facName}). Includes updated Upper-Body Bust Portrait (Panel 02), 7-Head Full-Body Cutout (Panel 01), 3-Head SD Reference (Panel 03), and Color Palette (Panel 04).`,
      `原作小説『カダンの旅』公式アニメーション設定資料シート（${p.code} ${charName}）。修正済み上半身バスト（Panel 02）、7頭身全身原画（Panel 01）、3頭身SD原型（Panel 03）、作画仕様書（Panel 04）収録。`
    ),
    spec: tr(
      '1600×1000 HD 캐릭터시트(JPG) + 수정된 상반신(PNG) + 7등신 투명 원화(PNG) | 상업적·2차 창작 IP 라이센스 영구 해제',
      '1600×1000 HD Sheet (JPG) + Updated Bust (PNG) + 7-Head Cutout (PNG) | Commercial & Derivative IP License Unlock',
      '1600×1000 HDシート(JPG) + 修正済上半身(PNG) + 7頭身透過原画(PNG) | 商用・二次創作IPライセンス永久解除'
    ),
    licenseTerms: tr(
      '라이센스 해제 조건 ($10.00 / 14,000원): 구매 즉시 해당 캐릭터의 2차 창작, 유튜브/숏폼 애니메이션 제작, 웹툰·웹소설 삽화, 인디게임 에셋, 커스텀 굿즈 제작 등 상업적·비상업적 IP 사용 라이센스가 영구 해제되며 고해상도 원본 시트 다운로드를 제공합니다.',
      'License Unlock Terms ($10.00 USD): Immediately unlocks perpetual commercial & non-commercial IP usage rights (YouTube/Shorts animation, webtoon/novel art, indie game assets, custom merch) with instant high-res sheet & cutout downloads.',
      'ライセンス解除条件（$10.00）：購入即時、該当キャラクターの商用・非商用二次創作（YouTube動画・ショートアニメ、ウェブトゥーン、インディーゲーム、グッズ制作）ライセンスが永久解除され、高解像度原本シートのダウンロードを提供します。'
    ),
  };
}

function getLocalizedCountry(c: MallShippingCountry): {
  name: string;
  regionLabel: string;
  deliveryDays: string;
} {
  const lang = getCurrentLanguage();
  if (lang === 'ko') {
    return { name: c.nameKo, regionLabel: c.regionLabel, deliveryDays: c.deliveryDays };
  }
  return {
    name: c.nameEn,
    regionLabel: tr(c.regionLabel, 'Instant Digital License Unlock ($0 Fee)', 'デジタルライセンス即時発行（手数料無料）'),
    deliveryDays: tr(c.deliveryDays, 'Instant License Unlock & High-Res Download', '決済即時ライセンス解除および原本ダウンロード'),
  };
}

export function getActiveProduct(): MallGoodsProduct | null {
  if (!mallState.activeProductId) return null;
  return MALL_GOODS_PRODUCTS.find((p) => p.id === mallState.activeProductId) || null;
}

export function getSelectedCountry(): MallShippingCountry {
  return (
    MALL_SHIPPING_COUNTRIES.find((c) => c.code === mallState.selectedCountryCode) ||
    MALL_SHIPPING_COUNTRIES[0]
  );
}

export function openMallProductDetail(productId: string): void {
  const product = MALL_GOODS_PRODUCTS.find((p) => p.id === productId);
  if (!product) return;
  mallState.activeProductId = product.id;
  mallState.step = 'detail';
  mallState.quantity = 1;
  mallState.selectedSize = 'LICENSE';
  mallState.selectedFaction = product.faction;
  mallState.feedbackMsg = null;
}

export function openMallOrdersList(): void {
  mallState.activeProductId = MALL_GOODS_PRODUCTS[0].id;
  mallState.step = 'orders_list';
  mallState.feedbackMsg = null;
}

export function closeMallModal(): void {
  mallState.activeProductId = null;
  mallState.step = 'detail';
  mallState.feedbackMsg = null;
}

export function setMallQty(qty: number): void {
  mallState.quantity = Math.max(1, Math.min(99, qty));
}

export function setMallSize(size: string): void {
  mallState.selectedSize = size;
}

export function setMallFaction(faction: string): void {
  mallState.selectedFaction = faction;
}

export function proceedMallToShipping(): void {
  // Skip buyer info & country input — go directly to payment window
  mallState.step = 'payment';
  mallState.feedbackMsg = null;
}

export function backMallToDetail(): void {
  mallState.step = 'detail';
  mallState.feedbackMsg = null;
}

export function submitMallShipping(info: { name: string; phone: string; address: string }): boolean {
  const cleanName = info.name.trim() || tr('모험가 라이센시', 'Adventurer Licensee', '冒険者ライセンシー');
  const cleanPhone = info.phone.trim() || '010-0000-0000';
  const cleanAddress = info.address.trim() || tr('디지털 라이센스 즉시 발급 (온라인)', 'Instant Digital License Unlock', 'デジタルライセンス即時発行');

  mallState.buyerName = cleanName;
  mallState.buyerPhone = cleanPhone;
  mallState.buyerAddress = cleanAddress;
  mallState.step = 'payment';
  mallState.feedbackMsg = null;
  return true;
}

export function backMallToShipping(): void {
  mallState.step = 'detail';
  mallState.feedbackMsg = null;
}

export function selectMallCountry(countryCode: string): void {
  mallState.selectedCountryCode = countryCode;
  mallState.step = 'payment';
  mallState.feedbackMsg = null;
}

export function backMallToCountry(): void {
  mallState.step = 'detail';
  mallState.feedbackMsg = null;
}

export function backMallToPayment(): void {
  mallState.step = 'payment';
  mallState.feedbackMsg = null;
}

export function selectMallCryptoCoin(coinId: string): void {
  const found = CRYPTO_COINS_CATALOG.find((c) => c.ccy === coinId) || CRYPTO_COINS_CATALOG[0];
  if (!found) return;
  mallState.selectedCryptoCoinId = found.ccy;
  mallState.selectedCryptoChain = found.chains[0] || `${found.ccy}-TRC20`;
}

export function selectMallCryptoChain(chainId: string): void {
  mallState.selectedCryptoChain = chainId;
}

export function backMallToCryptoCoin(): void {
  mallState.step = 'crypto_select';
  mallState.feedbackMsg = null;
}

export function setMallCryptoSearch(query: string): void {
  mallState.cryptoSearchQuery = query;
}

export function getMallTotalPricing(): {
  productKrw: number;
  productUsd: number;
  shippingKrw: number;
  shippingUsd: number;
  totalKrw: number;
  totalUsd: number;
} {
  const product = getActiveProduct();
  const country = getSelectedCountry();
  if (!product) {
    return { productKrw: 0, productUsd: 0, shippingKrw: 0, shippingUsd: 0, totalKrw: 0, totalUsd: 0 };
  }
  const productKrw = product.priceKrw * mallState.quantity;
  const productUsd = Number((product.priceUsd * mallState.quantity).toFixed(2));
  const shippingKrw = country.shippingFeeKrw;
  const shippingUsd = country.shippingFeeUsd;
  return {
    productKrw,
    productUsd,
    shippingKrw,
    shippingUsd,
    totalKrw: productKrw + shippingKrw,
    totalUsd: Number((productUsd + shippingUsd).toFixed(2)),
  };
}

function buildOptionSummary(product: MallGoodsProduct): string {
  return `${product.code} (${product.name}) · IP 라이센스 영구 해제 ($10.00)`;
}

export async function executeMallCheckout(method: string): Promise<void> {
  const product = getActiveProduct();
  if (!product) return;

  const country = getSelectedCountry();
  const pricing = getMallTotalPricing();
  mallState.selectedPaymentMethod = method;

  if (!mallState.buyerName) {
    mallState.buyerName = tr('모험가 라이센시', 'Adventurer Licensee', '冒険者ライセンシー');
  }
  if (!mallState.buyerPhone) {
    mallState.buyerPhone = '010-0000-0000';
  }
  if (!mallState.buyerAddress) {
    mallState.buyerAddress = tr('디지털 라이센스 즉시 발급', 'Digital License Unlock', 'デジタルライセンス即時発行');
  }

  if (method === 'crypto') {
    const defaultCoin = CRYPTO_COINS_CATALOG[0];
    mallState.selectedCryptoCoinId = defaultCoin?.ccy || 'USDT';
    mallState.selectedCryptoChain = defaultCoin?.chains[0] || 'USDT-TRC20';
    mallState.step = 'crypto_select';
    mallState.feedbackMsg = null;
    return;
  }

  if (method === 'crypto_proceed_qr') {
    mallState.step = 'crypto_qr';
    mallState.feedbackMsg = null;
    return;
  }

  if (method === 'payapp_card') {
    mallState.feedbackMsg = tr('PayApp 안전 결제창을 호출하고 있습니다...', 'Opening PayApp secure checkout...', 'PayApp決済画面を呼び出しています...');
    unlockCharacterSheetLicense(product.cardId);
    const order = submitGoodsOrder({
      productId: product.id,
      productName: product.name,
      quantity: mallState.quantity,
      size: buildOptionSummary(product),
      priceText: `$${pricing.totalUsd.toFixed(2)} (${pricing.totalKrw.toLocaleString()}원)`,
      buyerName: mallState.buyerName,
      buyerPhone: mallState.buyerPhone,
      shippingAddress: `[${country.nameKo}] ${mallState.buyerAddress}`,
      paymentMethod: 'payapp_card',
    });

    await requestPayAppPayment({
      goodname: `[SNSHero 라이센스 해제] ${product.name}`,
      priceKrw: pricing.totalKrw,
      method: 'card',
      returnParam: 'goods',
      recvphone: mallState.buyerPhone.replace(/[^0-9]/g, '') || '01000000000',
      targetHash: '#mall',
      pendingOrder: order,
    });

    mallState.completedOrder = order;
    mallState.step = 'complete';
    mallState.feedbackMsg = null;
    return;
  }

  if (method === 'paypal') {
    unlockCharacterSheetLicense(product.cardId);
    const order = submitGoodsOrder({
      productId: product.id,
      productName: product.name,
      quantity: mallState.quantity,
      size: buildOptionSummary(product),
      priceText: `$${pricing.totalUsd.toFixed(2)} USD`,
      buyerName: mallState.buyerName,
      buyerPhone: mallState.buyerPhone,
      shippingAddress: `[${country.nameKo}] ${mallState.buyerAddress}`,
      paymentMethod: 'paypal',
    });

    const returnUrl = encodeURIComponent(window.location.origin + window.location.pathname + '#mall?payapp_success=goods');
    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=dryudryu@gmail.com&item_name=${encodeURIComponent(
      `[SNSHero IP License Unlock] ${product.code} ${product.name}`
    )}&amount=${pricing.totalUsd.toFixed(2)}&currency_code=USD&return=${returnUrl}`;
    window.open(paypalUrl, '_blank', 'noopener,noreferrer');

    mallState.completedOrder = order;
    mallState.step = 'complete';
    mallState.feedbackMsg = null;
    return;
  }

  // Instant license unlock checkout (test_sim / direct unlock)
  unlockCharacterSheetLicense(product.cardId);
  const order = submitGoodsOrder({
    productId: product.id,
    productName: product.name,
    quantity: mallState.quantity,
    size: buildOptionSummary(product),
    priceText: `$${pricing.totalUsd.toFixed(2)} (${pricing.totalKrw.toLocaleString()}원)`,
    buyerName: mallState.buyerName,
    buyerPhone: mallState.buyerPhone,
    shippingAddress: `[${country.nameKo}] ${mallState.buyerAddress}`,
    paymentMethod: 'test_sim',
  });
  mallState.completedOrder = order;
  mallState.step = 'complete';
  mallState.feedbackMsg = null;
}

export function verifyMallCryptoDeposit(): void {
  const product = getActiveProduct();
  if (!product) return;

  const country = getSelectedCountry();
  const pricing = getMallTotalPricing();
  const ccy = mallState.selectedCryptoCoinId || 'USDT';
  const chain = mallState.selectedCryptoChain || 'USDT-TRC20';
  const details = resolveCryptoDepositDetails(ccy, chain, pricing.totalUsd);

  unlockCharacterSheetLicense(product.cardId);
  const order = submitGoodsOrder({
    productId: product.id,
    productName: product.name,
    quantity: mallState.quantity,
    size: `${buildOptionSummary(product)} · ${details.ccy}/${details.chain}`,
    priceText: `${details.amount} ${details.ccy} ($${pricing.totalUsd.toFixed(2)})`,
    buyerName: mallState.buyerName || tr('모험가 라이센시', 'Adventurer Licensee', '冒険者ライセンシー'),
    buyerPhone: mallState.buyerPhone || '010-0000-0000',
    shippingAddress: `[${country.nameKo}] ${mallState.buyerAddress || 'Digital License Unlock'}`,
    paymentMethod: 'crypto',
  });

  mallState.completedOrder = order;
  mallState.step = 'complete';
  mallState.feedbackMsg = null;
}

export function copyMallCryptoAddress(): void {
  const pricing = getMallTotalPricing();
  const ccy = mallState.selectedCryptoCoinId || 'USDT';
  const chain = mallState.selectedCryptoChain || 'USDT-TRC20';
  const details = resolveCryptoDepositDetails(ccy, chain, pricing.totalUsd);
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(details.address).catch(() => {});
  }
  mallState.feedbackMsg = tr('입금 주소가 클립보드에 복사되었습니다.', 'Deposit address copied to clipboard.', '入金アドレスがクリップボードにコピーされました。');
}

// ─── Modal Renderer ──────────────────────────────────────────────────────────

function renderMallCheckoutModal(): string {
  const product = getActiveProduct();
  if (!product) return '';

  const locProd = getLocalizedMallProduct(product);
  const country = getSelectedCountry();
  const locCountry = getLocalizedCountry(country);
  const pricing = getMallTotalPricing();
  const unlocked = isCharacterSheetUnlocked(product.cardId);
  const pal = FACTION_PALETTES[product.faction] || { bg: '#201d1d', text: '#fdfcfc', border: '#646262' };

  let stepBadge = tr('STEP 1/3 · 캐릭터시트 상세 및 라이센스 조건', 'STEP 1/3 · SHEET SPEC & LICENSE TERMS', 'STEP 1/3 · シート詳細＆ライセンス条件');
  if (mallState.step === 'shipping') stepBadge = tr('STEP 2/3 · 라이센스 등록자 정보 입력', 'STEP 2/3 · LICENSEE REGISTRATION INFO', 'STEP 2/3 · ライセンス登録者情報');
  else if (mallState.step === 'country') stepBadge = tr('STEP 2.5/3 · 발급 국가 및 권역 선택', 'STEP 2.5/3 · SELECT REGION', 'STEP 2.5/3 · 発行国・地域の選択');
  else if (mallState.step === 'payment' || mallState.step === 'crypto_select' || mallState.step === 'crypto_qr') {
    stepBadge = tr('STEP 3/3 · 라이센스 해제 결제 ($10.00)', 'STEP 3/3 · LICENSE UNLOCK PAYMENT ($10.00)', 'STEP 3/3 · ライセンス解除決済 ($10.00)');
  } else if (mallState.step === 'complete') {
    stepBadge = tr('COMPLETE · 라이센스 영구 해제 및 원본 다운로드', 'COMPLETE · LICENSE UNLOCKED & DOWNLOAD', 'COMPLETE · ライセンス解除完了＆ダウンロード');
  } else if (mallState.step === 'orders_list') {
    stepBadge = tr('MY LICENSES · 라이센스 해제 및 주문 내역', 'MY LICENSES · UNLOCK & ORDER HISTORY', 'MY LICENSES · ライセンス解除・注文履歴');
  }

  let bodyHtml = '';

  if (mallState.step === 'detail') {
    return `
      <div class="fixed inset-0 z-50 w-screen h-[100dvh] bg-[#0e0d11] text-[#fdfcfc] flex flex-col overflow-hidden font-mono select-none">
        <!-- Top Fullscreen Studio Header Bar -->
        <div class="px-3 sm:px-6 py-2.5 bg-[#201d1d] border-b border-white/15 flex items-center justify-between gap-3 shrink-0">
          <div class="flex items-center gap-2 min-w-0">
            <span class="px-2 py-0.5 text-xs font-bold rounded-sm shrink-0" style="background:${pal.bg};color:${pal.text};">${product.code}</span>
            <h3 class="text-xs sm:text-base font-bold text-[#fdfcfc] truncate">${locProd.name}</h3>
            <span class="hidden md:inline-block px-2 py-0.5 bg-white/10 text-amber-300 text-[10px] font-bold rounded-sm shrink-0">
              1600×1000 HD · ${product.faction.toUpperCase()} · ${product.rarity}
            </span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="hidden sm:inline-block px-2.5 py-1 ${unlocked ? 'bg-emerald-600 text-white' : 'bg-amber-400 text-stone-950'} text-xs font-bold rounded-sm">
              ${unlocked ? tr('✓ 라이센스 해제 완료', '✓ LICENSE UNLOCKED', '✓ ライセンス解除済') : '$10.00 (14,000원) · LICENSE'}
            </span>
            <button
              type="button"
              data-action="close-mall-modal"
              class="min-w-[44px] min-h-[44px] px-3 flex items-center justify-center bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-bold text-[#fdfcfc] rounded-sm cursor-pointer"
              aria-label="Close fullscreen character sheet"
            >
              ✕ ${tr('닫기', 'Close', '閉じる')}
            </button>
          </div>
        </div>

        <!-- Center Fullscreen Character Sheet Viewport -->
        <div class="flex-1 min-h-0 w-full flex items-center justify-center bg-[#141316] p-1 sm:p-3 overflow-auto">
          <img
            src="${product.imageUrl}"
            alt="${locProd.name}"
            class="max-w-full max-h-full w-auto h-auto object-contain bg-white border border-white/20"
          />
        </div>

        <!-- Bottom Fullscreen License Unlock & Purchase Bar -->
        <div class="px-3 sm:px-6 py-3 bg-[#201d1d] border-t border-white/15 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
          <div class="space-y-0.5 min-w-0">
            <div class="flex items-center gap-2">
              <span class="px-1.5 py-0.5 bg-amber-400 text-stone-950 text-[10px] font-bold rounded-sm shrink-0">IP LICENSE UNLOCK</span>
              <span class="text-xs sm:text-sm font-bold text-[#fdfcfc] truncate">
                ${tr('개당 $10.00 (14,000원) · 상업적·2차 창작 라이센스 영구 해제', '$10.00 USD · Perpetual Commercial & Derivative IP License Unlock', '$10.00 · 商用・二次創作IPライセンス永久解除')}
              </span>
            </div>
            <p class="text-[11px] text-stone-300 line-clamp-1">
              ${tr(
                '구매 즉시 유튜브/숏폼 영상·웹툰·인디게임·굿즈 제작 라이센스 영구 해제 및 1600×1000 HD 시트·수정된 상반신·7등신 투명 원화(PNG) 다운로드 제공',
                'Unlocks perpetual commercial & creative rights + instant download of 1600×1000 HD Sheet (JPG), Updated Bust (PNG) & 7-Head Cutout (PNG)',
                '購入即時、動画・ウェブトゥーン・ゲーム・グッズ制作ライセンスが永久解除され、1600×1000 HDシート＆透過原画ダウンロードを提供'
              )}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            ${
              unlocked
                ? `
              <a
                href="${product.imageUrl}"
                download="${product.code.replace('.', '_')}_${product.id}_CharacterSheet_1600x1000.jpg"
                target="_blank"
                rel="noopener noreferrer"
                class="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-sm flex items-center justify-center gap-1 transition"
                title="${tr('1600×1000 HD 공식 캐릭터시트 원본 다운로드', 'Download Master Sheet JPG', '原本シートJPGをダウンロード')}"
              >
                ⬇ ${tr('시트 원본 (JPG)', 'Sheet (JPG)', 'シート (JPG)')}
              </a>
              <a
                href="${product.bustUrl}"
                download="${product.code.replace('.', '_')}_Updated_Bust.png"
                target="_blank"
                rel="noopener noreferrer"
                class="min-h-[44px] px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-sm flex items-center justify-center gap-1 transition"
                title="${tr('투명 배경 상반신 포트레이트 PNG 다운로드', 'Download Transparent Bust PNG', '透過上半身PNGをダウンロード')}"
              >
                ⬇ ${tr('상반신 (PNG)', 'Bust (PNG)', '上半身 (PNG)')}
              </a>
              <a
                href="${product.cutoutUrl}"
                download="${product.code.replace('.', '_')}_7Head_Cutout.png"
                target="_blank"
                rel="noopener noreferrer"
                class="min-h-[44px] px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-sm flex items-center justify-center gap-1 transition"
                title="${tr('투명 배경 7등신 전신 원화 PNG 다운로드', 'Download 7-Head Transparent Cutout PNG', '透過7頭身全身原画PNGをダウンロード')}"
              >
                ⬇ ${tr('7등신 원화 (PNG)', 'Cutout (PNG)', '全身原画 (PNG)')}
              </a>
            `
                : `
              <div class="hidden sm:inline-flex items-center px-2 py-1 bg-white/5 border border-white/10 text-[11px] text-stone-300 rounded-sm">
                🔒 ${tr('구매자 전용: 투명 PNG 원화 다운로드 활성화', 'PNG Download unlocks on purchase', '購入者限定: 透過PNG原画ダウンロード解禁')}
              </div>
            `
            }
            <button
              type="button"
              data-action="proceed-mall-shipping"
              class="w-full sm:w-auto min-h-[46px] px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs sm:text-sm font-bold font-mono rounded-sm transition cursor-pointer"
            >
              ${
                unlocked
                  ? tr('라이센스 재구매창 이동 ($10.00) →', 'Proceed to Payment ($10.00) →', '決済画面へ ($10.00) →')
                  : tr('라이센스 해제 구매하기 ($10.00 / 14,000원) →', 'Buy License Unlock ($10.00 USD) →', 'ライセンス解除を購入 ($10.00) →')
              }
            </button>
          </div>
        </div>
      </div>
    `;
  }

  if (mallState.step === 'orders_list') {
    const orders = getGoodsOrders();
    const unlockedIds = getUnlockedSheetIds();
    bodyHtml = `
      <div class="space-y-4">
        <div class="p-3 bg-emerald-50 border border-emerald-500/40 flex items-center justify-between">
          <div>
            <div class="text-xs font-bold text-emerald-900 font-mono">${tr('보유 라이센스 해제 캐릭터시트', 'Unlocked Character Sheet Licenses', '保有ライセンス解除キャラクターシート')}</div>
            <div class="text-[11px] text-emerald-700 font-mono">${tr(`총 110종 중 ${unlockedIds.length}종 라이센스 영구 해제 완료`, `${unlockedIds.length} / 110 Character Sheet Licenses Unlocked`, `全110種中 ${unlockedIds.length}種 ライセンス永久解除済`)}</div>
          </div>
          <span class="px-2.5 py-1 bg-emerald-700 text-white text-xs font-bold font-mono rounded-sm">${unlockedIds.length} / 110</span>
        </div>

        ${
          orders.length === 0
            ? `<div class="p-8 text-center border border-[#646262]/20 bg-[#f8f7f7] text-xs text-[#646262] font-mono">
                 ${tr('아직 라이센스 해제 구매 내역이 없습니다.', 'No character sheet license orders yet.', 'まだライセンス解除の購入履歴がありません。')}
               </div>`
            : `<div class="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                 ${orders
                   .map(
                     (o) => `
                   <div class="p-3.5 border border-[#646262]/30 bg-white space-y-1.5 font-mono">
                     <div class="flex items-center justify-between border-b border-[#646262]/15 pb-1.5">
                       <span class="text-[11px] font-bold text-[#201d1d]">${o.orderId}</span>
                       <span class="px-2 py-0.5 bg-emerald-50 border border-emerald-500/40 text-emerald-800 text-[10px] font-bold rounded-sm">
                         ${getOrderStatusLabel(o.status)} · LICENSE ACTIVE
                       </span>
                     </div>
                     <div class="text-xs font-bold text-[#201d1d]">${o.productName}</div>
                     <div class="text-[11px] text-[#646262]">${tr('라이센스 조건', 'License', 'ライセンス')}: ${o.size} | ${tr('결제금액', 'Paid', '決済金額')}: <strong class="text-[#201d1d]">${o.priceText}</strong></div>
                     <div class="text-[11px] text-[#646262]">${tr('등록자', 'Licensee', '登録者')}: ${o.buyerName} (${o.buyerPhone})</div>
                     <div class="text-[10px] text-[#646262] pt-0.5 flex items-center justify-between">
                       <span>${getPaymentMethodLabel(o.paymentMethod)}</span>
                       <span>${new Date(o.createdAt).toLocaleString()}</span>
                     </div>
                   </div>
                 `
                   )
                   .join('')}
               </div>`
        }
        <button
          type="button"
          data-action="close-mall-modal"
          class="w-full min-h-[44px] py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold font-mono rounded-sm cursor-pointer"
        >
          ${tr('닫기', 'Close', '閉じる')}
        </button>
      </div>
    `;
  } else if (mallState.step === 'payment' || mallState.step === 'shipping' || mallState.step === 'country') {
    bodyHtml = `
      <div class="space-y-4 font-mono">
        <!-- Order & Price Summary -->
        <div class="p-3.5 bg-[#f8f7f7] border border-[#201d1d] space-y-2 text-xs">
          <div class="flex items-center justify-between border-b border-[#646262]/20 pb-2">
            <span class="font-bold text-[#201d1d]">${locProd.name}</span>
            <span class="font-bold text-[#201d1d]">${product.code} · LICENSE</span>
          </div>
          <div class="flex items-center justify-between text-[11px] text-[#646262]">
            <span>${tr('캐릭터시트 라이센스 해제 단가', 'Character Sheet License Price', 'キャラクターシート・ライセンス単価')}</span>
            <span>$${pricing.productUsd.toFixed(2)} (${pricing.productKrw.toLocaleString()}원)</span>
          </div>
          <div class="flex items-center justify-between text-[11px] text-[#646262]">
            <span>${tr('디지털 원본 발급 수수료', 'Digital License & Download Fee', 'デジタル原本発行手数料')}</span>
            <span>${tr('무료 ($0.00)', 'FREE ($0.00)', '無料 ($0.00)')}</span>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-[#201d1d] text-sm font-bold text-[#201d1d]">
            <span>${tr('최종 결제 금액', 'Total Amount Due', '最終決済金額')}</span>
            <span class="text-emerald-800">$${pricing.totalUsd.toFixed(2)} (${pricing.totalKrw.toLocaleString()}원)</span>
          </div>
        </div>

        ${
          mallState.feedbackMsg
            ? `<div class="p-3 bg-amber-50 border border-amber-500/40 text-xs text-amber-900 font-bold">${mallState.feedbackMsg}</div>`
            : ''
        }

        <!-- 3 Real Payment Gateways (1-Click Removed) -->
        <div class="space-y-2.5">
          <div class="text-xs font-bold text-[#201d1d]">${tr('결제 수단 선택 (결제 즉시 라이센스 영구 해제)', 'Select Payment Method (Instant License Unlock)', '決済手段の選択（決済即時ライセンス永久解除）')}</div>

          <button
            type="button"
            data-action="execute-mall-checkout"
            data-method="payapp_card"
            class="w-full min-h-[48px] p-3 border border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] hover:bg-[#343030] transition flex items-center justify-between rounded-sm cursor-pointer"
          >
            <div class="text-left">
              <div class="text-xs font-bold">💳 ${tr('국내 신용/체크카드 · 간편결제 (PayApp)', 'Credit/Debit Card · PayApp (KRW)', 'クレジットカード・簡単決済 (PayApp)')}</div>
              <div class="text-[10px] text-[#d6d3d1]">${tr('카카오페이 · 네이버페이 · 삼성페이 · 전 카드사 즉시 결제', 'KakaoPay, NaverPay, SamsungPay & All KR Cards', 'カカオペイ・ネイバーペイ・全カード対応')}</div>
            </div>
            <span class="px-2.5 py-1 bg-[#fdfcfc] text-[#201d1d] text-xs font-bold rounded-sm">${pricing.totalKrw.toLocaleString()}원</span>
          </button>

          <button
            type="button"
            data-action="execute-mall-checkout"
            data-method="paypal"
            class="w-full min-h-[48px] p-3 border border-[#201d1d] bg-white text-[#201d1d] hover:bg-[#f8f7f7] transition flex items-center justify-between rounded-sm cursor-pointer"
          >
            <div class="text-left">
              <div class="text-xs font-bold">🌐 ${tr('해외 결제 · 페이팔 (PayPal / Global Visa·Master)', 'PayPal / International Credit Card (USD)', '海外決済・PayPal (USD)')}</div>
              <div class="text-[10px] text-[#646262]">${tr('글로벌 USD 안전 결제 및 즉시 라이센스 활성화', 'Global USD Checkout & Instant License Activation', 'グローバルUSD安全決済＆即時ライセンス有効化')}</div>
            </div>
            <span class="px-2.5 py-1 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm">$${pricing.totalUsd.toFixed(2)}</span>
          </button>

          <button
            type="button"
            data-action="execute-mall-checkout"
            data-method="crypto"
            class="w-full min-h-[48px] p-3 border border-[#201d1d] bg-white text-[#201d1d] hover:bg-[#f8f7f7] transition flex items-center justify-between rounded-sm cursor-pointer"
          >
            <div class="text-left">
              <div class="text-xs font-bold">🪙 ${tr('암호화폐 QR 입금 (USDT / USDC / BTC / ETH / SOL)', 'Crypto QR Deposit (USDT / USDC / BTC / ETH / SOL)', '暗号資産QR入金 (USDT / USDC / BTC / ETH / SOL)')}</div>
              <div class="text-[10px] text-[#646262]">${tr('10+ 메이저 코인 멀티체인 지갑 QR 지원', 'Supports 10+ Major Coins & Multi-Chain QR', '主要10通貨以上のマルチチェーンQR対応')}</div>
            </div>
            <span class="px-2.5 py-1 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm">CRYPTO QR</span>
          </button>
        </div>

        <button
          type="button"
          data-action="back-mall-detail"
          class="w-full min-h-[44px] py-2 border border-[#646262]/40 bg-white text-xs font-bold text-[#201d1d] rounded-sm cursor-pointer"
        >
          ← ${tr('캐릭터시트 전체화면으로 돌아가기', 'Back to Character Sheet Fullscreen', 'キャラクターシート全画面に戻る')}
        </button>
      </div>
    `;
  } else if (mallState.step === 'crypto_select') {
    const allCoins: CryptoCoinOption[] = CRYPTO_COINS_CATALOG;
    const q = mallState.cryptoSearchQuery.trim().toLowerCase();
    const filteredCoins: CryptoCoinOption[] = q
      ? allCoins.filter(
          (c) =>
            c.ccy.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q)
        )
      : allCoins;

    const selectedCoin =
      allCoins.find((c) => c.ccy === mallState.selectedCryptoCoinId) || allCoins[0];
    const selectedChain =
      selectedCoin.chains.find((ch) => ch === mallState.selectedCryptoChain) ||
      selectedCoin.chains[0];

    bodyHtml = `
      <div class="space-y-4 font-mono">
        <div class="p-3 bg-[#f8f7f7] border border-[#646262]/30 flex items-center justify-between text-xs">
          <span class="font-bold text-[#201d1d]">${locProd.name}</span>
          <span class="font-bold text-emerald-800">$${pricing.totalUsd.toFixed(2)} USD</span>
        </div>

        <div>
          <label class="block text-xs font-bold text-[#201d1d] mb-1.5">${tr('1. 입금할 암호화폐 선택', '1. Select Cryptocurrency', '1. 入金する暗号資産を選択')}</label>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[180px] overflow-y-auto p-1 border border-[#646262]/20 bg-[#f8f7f7]">
            ${filteredCoins
              .map((coin) => {
                const active = coin.ccy === selectedCoin.ccy;
                return `
                  <button
                    type="button"
                    data-action="select-mall-crypto-coin"
                    data-ccy="${coin.ccy}"
                    class="min-h-[44px] p-2 text-left border ${
                      active
                        ? 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc]'
                        : 'border-[#646262]/30 bg-white text-[#201d1d]'
                    } rounded-sm cursor-pointer transition"
                  >
                    <div class="text-xs font-bold">${coin.icon} ${coin.ccy}</div>
                    <div class="text-[10px] opacity-80 truncate">${coin.name}</div>
                  </button>
                `;
              })
              .join('')}
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-[#201d1d] mb-1.5">${tr('2. 전송 네트워크(Chain) 선택', '2. Select Blockchain Network', '2. ネットワーク(Chain)を選択')}</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            ${selectedCoin.chains
              .map((ch) => {
                const active = ch === selectedChain;
                return `
                  <button
                    type="button"
                    data-action="select-mall-crypto-chain"
                    data-chain="${ch}"
                    class="min-h-[44px] p-2.5 text-left border ${
                      active
                        ? 'border-[#201d1d] bg-[#201d1d] text-[#fdfcfc]'
                        : 'border-[#646262]/30 bg-white text-[#201d1d]'
                    } rounded-sm cursor-pointer transition flex items-center justify-between"
                  >
                    <span class="text-xs font-bold">${ch}</span>
                    <span class="text-[10px] opacity-80">INSTANT</span>
                  </button>
                `;
              })
              .join('')}
          </div>
        </div>

        <div class="flex gap-2 pt-2">
          <button
            type="button"
            data-action="back-mall-payment"
            class="min-h-[44px] px-4 py-2 border border-[#646262]/40 bg-white text-xs font-bold text-[#201d1d] rounded-sm cursor-pointer"
          >
            ← ${tr('결제수단 변경', 'Back', '戻る')}
          </button>
          <button
            type="button"
            data-action="execute-mall-checkout"
            data-method="crypto_proceed_qr"
            class="flex-1 min-h-[44px] py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm cursor-pointer"
          >
            ${tr('입금 QR 코드 및 주소 생성 →', 'Generate Deposit QR & Address →', '入金QRコード＆アドレス生成 →')}
          </button>
        </div>
      </div>
    `;
  } else if (mallState.step === 'crypto_qr') {
    const ccy = mallState.selectedCryptoCoinId || 'USDT';
    const chain = mallState.selectedCryptoChain || 'USDT-TRC20';
    const details = resolveCryptoDepositDetails(ccy, chain, pricing.totalUsd);

    bodyHtml = `
      <div class="space-y-4 font-mono">
        <div class="p-3 bg-[#f8f7f7] border border-[#201d1d] flex items-center justify-between text-xs">
          <span class="font-bold text-[#201d1d]">${details.ccy} (${details.chain})</span>
          <span class="font-bold text-emerald-800">${details.amount} ${details.ccy} ($${pricing.totalUsd.toFixed(2)})</span>
        </div>

        <div class="flex flex-col items-center justify-center p-4 border border-[#646262]/30 bg-white space-y-3">
          <div class="border border-[#201d1d] p-2 bg-white">${details.qrSvg}</div>
          <div class="w-full p-2.5 bg-[#f8f7f7] border border-[#646262]/30 text-[11px] break-all text-center font-bold text-[#201d1d]">
            ${details.address}
          </div>
          <button
            type="button"
            data-action="copy-mall-crypto-address"
            class="min-h-[40px] px-4 py-1.5 border border-[#201d1d] bg-white text-xs font-bold text-[#201d1d] hover:bg-[#f8f7f7] rounded-sm cursor-pointer"
          >
            📋 ${tr('지갑 주소 복사하기', 'Copy Wallet Address', 'ウォレットアドレスをコピー')}
          </button>
        </div>

        ${
          mallState.feedbackMsg
            ? `<div class="p-2.5 bg-emerald-50 border border-emerald-500/40 text-xs text-emerald-900 font-bold text-center">${mallState.feedbackMsg}</div>`
            : ''
        }

        <div class="flex gap-2">
          <button
            type="button"
            data-action="back-mall-crypto-coin"
            class="min-h-[44px] px-4 py-2 border border-[#646262]/40 bg-white text-xs font-bold text-[#201d1d] rounded-sm cursor-pointer"
          >
            ← ${tr('코인 변경', 'Change Coin', '通貨変更')}
          </button>
          <button
            type="button"
            data-action="verify-mall-crypto-deposit"
            class="flex-1 min-h-[44px] py-2 bg-emerald-700 text-white text-xs font-bold rounded-sm hover:bg-emerald-800 cursor-pointer"
          >
            ✓ ${tr('입금 완료 확인 및 라이센스 즉시 해제', 'Verify Deposit & Unlock License Now', '入金確認およびライセンス即時解除')}
          </button>
        </div>
      </div>
    `;
  } else if (mallState.step === 'complete') {
    const ord = mallState.completedOrder;
    bodyHtml = `
      <div class="space-y-4 font-mono">
        <div class="p-4 bg-emerald-50 border border-emerald-600/50 space-y-2">
          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 bg-emerald-800 text-white text-[10px] font-bold rounded-sm">IP LICENSE UNLOCKED</span>
            <span class="text-[11px] font-bold text-emerald-900">${ord?.orderId || 'ORD-LICENSE'}</span>
          </div>
          <h4 class="text-base font-bold text-emerald-950">
            ${tr('캐릭터시트 라이센스 영구 해제 및 원본 파일 활성화 완료!', 'Character Sheet IP License Unlocked & Downloads Ready!', 'キャラクターシートのライセンス永久解除完了！')}
          </h4>
          <p class="text-xs text-emerald-900 leading-relaxed">
            ${tr(
              `${locProd.name}에 대한 상업적·2차 창작 라이센스가 영구 해제되었습니다. 아래 버튼에서 1600×1000 HD 캐릭터시트 원본과 수정된 상반신/7등신 투명 원화를 즉시 다운로드하실 수 있습니다.`,
              `Commercial & derivative IP license for ${locProd.name} is now permanently unlocked. Download the 1600×1000 HD Studio Character Sheet, Updated Bust PNG, and 7-Head Cutout PNG below.`,
              `${locProd.name}の商用・二次創作ライセンスが永久解除されました。下のボタンから高解像度原本シートを今すぐダウンロードできます。`
            )}
          </p>
        </div>

        <!-- Preview & Direct High-Res Download Buttons -->
        <div class="p-3 border border-[#201d1d] bg-white space-y-3">
          <div class="w-full aspect-[16/10] border border-[#646262]/30 overflow-hidden bg-[#141316]">
            <img src="${product.imageUrl}" alt="${locProd.name}" class="w-full h-full object-contain" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <a
              href="${product.imageUrl}"
              download="${product.code.replace('.', '_')}_${product.id}_CharacterSheet_1600x1000.jpg"
              target="_blank"
              rel="noopener noreferrer"
              class="min-h-[44px] px-3 py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm flex items-center justify-center text-center hover:bg-[#343030]"
            >
              ⬇ ${tr('1600×1000 시트 (JPG)', '1600×1000 Sheet (JPG)', '1600×1000 シート (JPG)')}
            </a>
            <a
              href="${product.bustUrl}"
              download="${product.code.replace('.', '_')}_Updated_Bust.png"
              target="_blank"
              rel="noopener noreferrer"
              class="min-h-[44px] px-3 py-2.5 bg-white border border-[#201d1d] text-[#201d1d] text-xs font-bold rounded-sm flex items-center justify-center text-center hover:bg-[#f8f7f7]"
            >
              ⬇ ${tr('수정된 상반신 (PNG)', 'Updated Bust (PNG)', '修正済上半身 (PNG)')}
            </a>
            <a
              href="${product.cutoutUrl}"
              download="${product.code.replace('.', '_')}_7Head_Cutout.png"
              target="_blank"
              rel="noopener noreferrer"
              class="min-h-[44px] px-3 py-2.5 bg-white border border-[#201d1d] text-[#201d1d] text-xs font-bold rounded-sm flex items-center justify-center text-center hover:bg-[#f8f7f7]"
            >
              ⬇ ${tr('7등신 전신 원화 (PNG)', '7-Head Cutout (PNG)', '7頭身全身原画 (PNG)')}
            </a>
          </div>
        </div>

        ${
          ord
            ? `
          <div class="p-3 bg-[#f8f7f7] border border-[#646262]/30 text-[11px] space-y-1 text-[#646262]">
            <div><strong class="text-[#201d1d]">${tr('라이센스 증서 번호', 'Certificate ID', 'ライセンス証書番号')}:</strong> ${ord.orderId}</div>
            <div><strong class="text-[#201d1d]">${tr('대상 캐릭터시트', 'Character Sheet', '対象シート')}:</strong> ${ord.productName}</div>
            <div><strong class="text-[#201d1d]">${tr('결제 금액', 'Amount Paid', '決済金額')}:</strong> ${ord.priceText} (${getPaymentMethodLabel(ord.paymentMethod)})</div>
            <div><strong class="text-[#201d1d]">${tr('등록 라이센시', 'Registered Licensee', '登録ライセンシー')}:</strong> ${ord.buyerName} (${ord.buyerPhone})</div>
          </div>
        `
            : ''
        }

        <div class="flex gap-2">
          <button
            type="button"
            data-action="open-mall-orders"
            class="min-h-[44px] px-4 py-2 border border-[#201d1d] bg-white text-xs font-bold text-[#201d1d] rounded-sm cursor-pointer"
          >
            ${tr('전체 라이센스 내역 보기', 'View All Licenses', '全ライセンス履歴を見る')}
          </button>
          <button
            type="button"
            data-action="close-mall-modal"
            class="flex-1 min-h-[44px] py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm cursor-pointer"
          >
            ${tr('확인 완료', 'Done', '完了')}
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div class="w-full max-w-2xl bg-[#fdfcfc] border-2 border-[#201d1d] rounded-none shadow-none overflow-hidden my-auto max-h-[92dvh] flex flex-col">
        <!-- Modal Header -->
        <div class="px-4 py-3 bg-[#201d1d] text-[#fdfcfc] flex items-center justify-between shrink-0">
          <div>
            <div class="text-[10px] font-mono text-amber-300 uppercase tracking-wider">${stepBadge}</div>
            <h3 class="text-sm font-bold font-mono truncate">${locProd.name}</h3>
          </div>
          <button
            type="button"
            data-action="close-mall-modal"
            class="min-w-[44px] min-h-[44px] flex items-center justify-center text-sm font-bold font-mono text-[#fdfcfc] hover:bg-white/10 rounded-sm cursor-pointer"
            aria-label="Close modal"
          >
            [X]
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-4 sm:p-5 overflow-y-auto flex-1">
          ${bodyHtml}
        </div>
      </div>
    </div>
  `;
}

// ─── Main #mall View Renderer ────────────────────────────────────────────────

export function renderMallView(): string {
  const orders = getGoodsOrders();
  const unlockedIds = getUnlockedSheetIds();
  const activeTab = mallState.currentTab;

  const filteredProducts = MALL_GOODS_PRODUCTS.filter((p) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UNLOCKED') return unlockedIds.includes(p.cardId);
    return p.category === activeTab;
  });

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / MALL_ITEMS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, mallState.currentPage), totalPages);
  mallState.currentPage = currentPage;

  const startIndex = (currentPage - 1) * MALL_ITEMS_PER_PAGE;
  const endIndex = Math.min(totalItems, startIndex + MALL_ITEMS_PER_PAGE);
  const pageProducts = filteredProducts.slice(startIndex, endIndex);

  const factionTabs: { id: MallGoodsCategory; label: string; count: number }[] = [
    { id: 'ALL', label: tr('전체 캐릭터시트 (110)', 'ALL SHEETS (110)', '全キャラクターシート (110)'), count: 110 },
    { id: 'UNLOCKED', label: tr(`라이센스 보유 (${unlockedIds.length})`, `UNLOCKED (${unlockedIds.length})`, `解除済 (${unlockedIds.length})`), count: unlockedIds.length },
    { id: 'WATER', label: tr('물 (Water · 001~010)', 'Water (001-010)', '水 (001-010)'), count: 10 },
    { id: 'FIRE', label: tr('불 (Fire · 011~020)', 'Fire (011-020)', '火 (011-020)'), count: 10 },
    { id: 'WIND', label: tr('바람 (Wind · 021~030)', 'Wind (021-030)', '風 (021-030)'), count: 10 },
    { id: 'EARTH', label: tr('땅 (Earth · 031~040)', 'Earth (031-040)', '地 (031-040)'), count: 10 },
    { id: 'HUMAN', label: tr('인간 (Human · 041~050)', 'Human (041-050)', '人間 (041-050)'), count: 10 },
    { id: 'UNDEAD', label: tr('언데드 (Undead · 051~060)', 'Undead (051-060)', 'アンデッド (051-060)'), count: 10 },
    { id: 'ELF', label: tr('엘프 (Elf · 061~070)', 'Elf (061-070)', 'エルフ (061-070)'), count: 10 },
    { id: 'DWARF', label: tr('드워프 (Dwarf · 071~080)', 'Dwarf (071-080)', 'ドワーフ (071-080)'), count: 10 },
    { id: 'MONSTER', label: tr('몬스터 (Monster · 081~090)', 'Monster (081-090)', 'モンスター (081-090)'), count: 10 },
    { id: 'ROBOT', label: tr('로봇 (Robot · 091~100)', 'Robot (091-100)', 'ロボット (091-100)'), count: 10 },
    { id: 'DRAGON', label: tr('드래곤 (Dragon · 101~110)', 'Dragon (101-110)', 'ドラゴン (101-110)'), count: 10 },
  ];

  // Pagination controls generator
  const renderPaginationControls = (): string => {
    if (totalPages <= 1) return '';

    const pages = [];
    for (let p = 1; p <= totalPages; p++) {
      pages.push(p);
    }

    return `
      <nav aria-label="Mall Pagination" class="p-3 bg-[#fdfcfc] border border-[#201d1d] flex flex-wrap items-center justify-between gap-3 font-mono">
        <div class="text-xs text-[#646262]">
          ${tr(
            `전체 <strong>${totalItems}</strong>종 중 <strong>${startIndex + 1}~${endIndex}</strong>번째 표시`,
            `Showing <strong>${startIndex + 1}–${endIndex}</strong> of <strong>${totalItems}</strong> sheets`,
            `全 <strong>${totalItems}</strong>種中 <strong>${startIndex + 1}〜${endIndex}</strong>番目を表示`
          )}
          <span class="ml-1 text-[11px] px-1.5 py-0.5 bg-[#201d1d] text-[#fdfcfc] font-bold rounded-xs">
            ${currentPage} / ${totalPages} P
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            data-action="change-mall-page"
            data-page="${currentPage - 1}"
            ${currentPage <= 1 ? 'disabled' : ''}
            class="min-h-[40px] px-3 py-1.5 text-xs font-bold font-mono border rounded-sm transition ${
              currentPage <= 1
                ? 'opacity-40 bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                : 'bg-white hover:bg-stone-50 text-[#201d1d] border-[#201d1d] cursor-pointer'
            }"
          >
            ← ${tr('이전', 'Prev', '前へ')}
          </button>

          <div class="flex items-center gap-1 overflow-x-auto max-w-full py-0.5">
            ${pages
              .map((pNum) => {
                const isCurrent = pNum === currentPage;
                return `
                  <button
                    type="button"
                    data-action="change-mall-page"
                    data-page="${pNum}"
                    class="min-w-[40px] min-h-[40px] px-2.5 py-1 text-xs font-bold font-mono border rounded-sm transition cursor-pointer ${
                      isCurrent
                        ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] shadow-xs'
                        : 'bg-white hover:bg-stone-50 text-[#201d1d] border-[#646262]/30 hover:border-[#201d1d]'
                    }"
                  >
                    ${pNum}
                  </button>
                `;
              })
              .join('')}
          </div>

          <button
            type="button"
            data-action="change-mall-page"
            data-page="${currentPage + 1}"
            ${currentPage >= totalPages ? 'disabled' : ''}
            class="min-h-[40px] px-3 py-1.5 text-xs font-bold font-mono border rounded-sm transition ${
              currentPage >= totalPages
                ? 'opacity-40 bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                : 'bg-white hover:bg-stone-50 text-[#201d1d] border-[#201d1d] cursor-pointer'
            }"
          >
            ${tr('다음', 'Next', '次へ')} →
          </button>
        </div>
      </nav>
    `;
  };

  const cardsHtml =
    totalItems === 0
      ? `
      <div class="col-span-full p-10 border border-[#646262]/30 bg-white text-center space-y-3 font-mono">
        <div class="text-sm font-bold text-[#201d1d]">${tr('아직 라이센스 해제된 캐릭터시트가 없습니다.', 'No unlocked character sheets yet.', 'まだライセンス解除されたキャラクターシートがありません。')}</div>
        <p class="text-xs text-[#646262]">${tr('전체 110종 캐릭터시트 탭에서 원하는 영웅의 캐릭터시트를 개당 $10.00에 라이센스 해제해보세요!', 'Browse all 110 character sheets and unlock any hero sheet for $10.00 each!', '全110種の中からお気に入りの英雄シートを1点$10.00でライセンス解除しましょう！')}</p>
        <button
          type="button"
          data-action="switch-mall-tab"
          data-tab="ALL"
          class="min-h-[44px] px-5 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm cursor-pointer"
        >
          ${tr('전체 110종 캐릭터시트 보기', 'View All 110 Character Sheets', '全110種キャラクターシートを見る')}
        </button>
      </div>
    `
      : pageProducts
          .map((p) => {
            const loc = getLocalizedMallProduct(p);
            const unlocked = unlockedIds.includes(p.cardId);
            const pal = FACTION_PALETTES[p.faction] || { bg: '#201d1d', text: '#fdfcfc', border: '#646262' };

            return `
        <article class="border ${
          unlocked ? 'border-emerald-600' : 'border-[#201d1d]'
        } bg-white flex flex-col justify-between rounded-none overflow-hidden transition hover:border-[#201d1d]">
          <div>
            <!-- Top Studio Bar -->
            <div class="px-3 py-2 bg-[#201d1d] text-[#fdfcfc] flex items-center justify-between gap-2 font-mono">
              <div class="flex items-center gap-1.5">
                <span class="px-1.5 py-0.5 text-[10px] font-bold rounded-sm" style="background:${pal.bg};color:${pal.text};">${p.code}</span>
                <span class="text-[11px] font-bold truncate">${getLocalizedCharacterName(p.cardId)}</span>
              </div>
              <span class="px-1.5 py-0.5 text-[10px] font-bold rounded-sm ${
                unlocked ? 'bg-emerald-500 text-stone-950' : 'bg-amber-400 text-stone-950'
              }">
                ${unlocked ? tr('✓ 라이센스 해제됨', '✓ UNLOCKED', '✓ 解除済') : '$10 · LICENSE'}
              </span>
            </div>

            <!-- 1600x1000 Studio Sheet Preview Image (JPG for fast bandwidth-saving loading) -->
            <div
              data-action="open-mall-detail"
              data-product-id="${p.id}"
              class="relative w-full aspect-[16/10] bg-[#141316] border-b border-[#646262]/30 overflow-hidden cursor-pointer group"
            >
              <img
                src="${p.imageUrl}"
                alt="${loc.name}"
                loading="lazy"
                decoding="async"
                class="w-full h-full object-contain bg-white group-hover:scale-[1.02] transition-transform duration-200"
              />
              <div class="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-[#201d1d]/90 text-[#fdfcfc] text-[10px] font-mono font-bold rounded-sm">
                1600×1000 HD · JPG 미리보기
              </div>
            </div>

            <!-- Product Spec & License Condition -->
            <div class="p-3.5 space-y-2 font-mono">
              <div class="flex items-start justify-between gap-2">
                <h4 class="text-xs sm:text-sm font-bold text-[#201d1d] leading-snug">${loc.name}</h4>
              </div>
              <p class="text-[11px] text-[#646262] line-clamp-2 leading-relaxed">
                ${loc.desc}
              </p>
              <div class="p-2 bg-[#f8f7f7] border border-[#646262]/25 text-[10px] text-[#201d1d] font-mono">
                <strong class="text-amber-900">📜 ${tr('판매 조건', 'Condition', '販売条件')}:</strong> ${tr(
                  '상업적·2차 창작 IP 라이센스 영구 해제 + 1600×1000 원본 시트 & 투명 원화(PNG) 다운로드',
                  'Perpetual Commercial/Derivative IP License Unlock + 1600×1000 HD Sheet & Cutout PNG',
                  '商用・二次創作IPライセンス永久解除＋1600×1000原本シート＆透過PNG提供'
                )}
              </div>
            </div>
          </div>

          <!-- Footer Price & Action CTA -->
          <div class="px-3.5 pb-3.5 pt-2 border-t border-[#646262]/15 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 font-mono">
            <div>
              <div class="text-[10px] text-[#646262]">${tr('라이센스 해제 가격', 'License Unlock Price', 'ライセンス解除価格')}</div>
              <div class="text-sm sm:text-base font-bold text-[#201d1d]">$10.00 <span class="text-[11px] font-normal text-[#646262]">(14,000원)</span></div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              ${
                unlocked
                  ? `
                <a
                  href="${p.cutoutUrl}"
                  download="${p.code.replace('.', '_')}_7Head_Cutout.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="min-h-[44px] px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold font-mono rounded-sm flex items-center justify-center gap-1 transition"
                  title="${tr('투명 배경 7등신 전신 원화 PNG 다운로드', 'Download 7-Head Transparent Cutout PNG', '透過7頭身全身原画PNGをダウンロード')}"
                >
                  <span>⬇ PNG</span>
                </a>
                <button
                  type="button"
                  data-action="open-mall-detail"
                  data-product-id="${p.id}"
                  class="min-h-[44px] px-3 py-2 bg-[#201d1d] hover:bg-[#343030] text-[#fdfcfc] text-xs font-bold font-mono rounded-sm transition cursor-pointer"
                >
                  ${tr('시트(JPG) 및 상세', 'Sheet & Details', 'シート(JPG)・詳細')}
                </button>
              `
                  : `
                <button
                  type="button"
                  data-action="open-mall-detail"
                  data-product-id="${p.id}"
                  class="min-h-[44px] px-3.5 py-2 bg-[#201d1d] hover:bg-[#343030] text-[#fdfcfc] text-xs font-bold font-mono rounded-sm transition cursor-pointer"
                >
                  ${tr('라이센스 해제 구매 ($10)', 'Unlock License ($10)', 'ライセンス解除 ($10)')}
                </button>
              `
              }
            </div>
          </div>
        </article>
      `;
          })
          .join('');

  return `
    <section id="mall" class="py-6 space-y-6 font-mono">
      <!-- Top Hero Header Banner -->
      <div class="border-2 border-[#201d1d] bg-[#fdfcfc] p-4 sm:p-6 space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#646262]/25 pb-4">
          <div class="space-y-1">
            <div class="inline-flex items-center gap-2 px-2.5 py-1 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm">
              <span>OFFICIAL 110 CHARACTER SHEETS · IP LICENSE STORE</span>
              <span class="text-amber-300">$10.00 / SHEET</span>
            </div>
            <h2 class="text-lg sm:text-xl font-bold text-[#201d1d]">
              ${tr(
                '공식 110종 캐릭터시트 라이센스 스토어 (개당 $10.00 · 라이센스 영구 해제)',
                'Official 110 Character Sheets License Store ($10.00 Each · IP License Unlock)',
                '公式110種キャラクターシート・ライセンスストア（1点$10.00・ライセンス永久解除）'
              )}
            </h2>
            <p class="text-xs text-[#646262] leading-relaxed">
              ${tr(
                '수정된 상반신 표정·헤어 디테일(Panel 02)이 전면 적용된 110종 공식 애니메이션 캐릭터시트(NO.001~NO.110)입니다. 트래픽 절감을 위해 1페이지당 10개씩 JPG 미리보기로 초고속 렌더링되며, 라이센스를 구매한 사용자에게만 상업적 IP 라이센스 증서와 고해상도 투명 원화(PNG) 다운로드가 즉시 활성화됩니다.',
                'Official Studio Character Sheets (NO.001–NO.110) updated with remastered upper-body bust portraits. Rendered 10 per page in lightweight JPG previews to save bandwidth; high-res transparent PNGs and commercial IP licenses unlock immediately upon purchase.',
                '修正済み上半身ディテール（Panel 02）が全面適用された全110種公式キャラクターシート（NO.001〜NO.110）。通信量削減のため1ページ10点ずつ軽量JPGプレビューで高速表示され、購入者限定で高解像度透過PNG原本と商用ライセンスが解禁されます。'
              )}
            </p>
          </div>

          <div class="flex flex-wrap sm:flex-col items-stretch sm:items-end gap-2 shrink-0">
            <button
              type="button"
              data-action="open-mall-orders"
              class="min-h-[44px] px-3.5 py-2 border border-[#201d1d] bg-white hover:bg-[#f8f7f7] text-[#201d1d] text-xs font-bold rounded-sm cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>📜 ${tr('라이센스 구매 내역', 'My License Orders', 'ライセンス購入履歴')} (${orders.length})</span>
            </button>
            <div class="px-3 py-1.5 bg-emerald-50 border border-emerald-600/40 text-emerald-900 text-[11px] font-bold text-center">
              ${tr(`해제 완료: ${unlockedIds.length} / 110종`, `Unlocked: ${unlockedIds.length} / 110`, `解除済: ${unlockedIds.length} / 110種`)}
            </div>
          </div>
        </div>

        <!-- Faction & Status Filter Tabs -->
        <div class="flex flex-wrap gap-1.5">
          ${factionTabs
            .map((t) => {
              const isActive = activeTab === t.id;
              return `
                <button
                  type="button"
                  data-action="switch-mall-tab"
                  data-tab="${t.id}"
                  class="min-h-[40px] px-3 py-1.5 text-xs font-bold font-mono border rounded-sm transition cursor-pointer ${
                    isActive
                      ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                      : 'bg-white text-[#201d1d] border-[#646262]/30 hover:border-[#201d1d]'
                  }"
                >
                  ${t.label}
                </button>
              `;
            })
            .join('')}
        </div>
      </div>

      <!-- Pagination Controls (Top) -->
      ${renderPaginationControls()}

      <!-- 10 Character Sheets Per Page Grid -->
      <div id="mall-products-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${cardsHtml}
      </div>

      <!-- Pagination Controls (Bottom) -->
      ${renderPaginationControls()}

      ${renderMallCheckoutModal()}
    </section>
  `;
}
