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
    image: '/mug.png',
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
    image: '/icon.png',
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

// ============================================================================
// Internal State
// ============================================================================

let currentMallTab: MallCategoryTab = 'ALL';
let activeDetailProduct: MallGoodsProduct | null = null;
let mallModalStep: 'detail' | 'shipping' | 'country' | 'payment' | 'celebration' | 'crypto' | 'orders' | null = null;

let selectedQty = 1;
let selectedSize = 'L';
let selectedFaction = '성진기사단 (Human)';

let buyerName = '';
let buyerPhone = '';
let buyerAddress = '';
let selectedCountry = 'ko';
let selectedPaymentMethod: string | null = null;
let lastCompletedOrder: MallGoodsOrderRecord | null = null;

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
    alert('받는 분 성함, 연락처, 배송지 주소를 모두 입력해주세요.');
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

  const orderData: MallGoodsOrderRecord = {
    id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    productId: activeDetailProduct.id,
    title: activeDetailProduct.name,
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
    // Show Crypto transfer details
    mallModalStep = 'crypto';
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
            <h3 class="text-sm font-bold m-0">[주문 내역] 실물 굿즈 배송 주문</h3>
            <button type="button" data-action="close-mall-modal" class="text-stone-500 hover:text-black font-bold p-1">[x]</button>
          </div>
          <div class="flex-1 overflow-y-auto py-4 space-y-3">
            ${
              orders.length === 0
                ? '<div class="text-center py-8 text-xs text-stone-500">아직 주문된 내역이 없습니다.</div>'
                : orders
                    .map(
                      (ord) => `
              <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] rounded-none text-xs space-y-1">
                <div class="flex items-center justify-between font-bold">
                  <span>${ord.title} (${ord.quantity}개)</span>
                  <span class="text-emerald-700 font-mono">${ord.status === 'paid' ? '결제완료' : '배송준비'}</span>
                </div>
                <div class="text-[11px] text-stone-600">주문번호: ${ord.id} · 금액: ${ord.priceKrw.toLocaleString()}원</div>
                <div class="text-[11px] text-stone-500">받는 분: ${ord.buyerName} (${ord.buyerPhone})</div>
                <div class="text-[10px] text-stone-500">배송지: ${ord.buyerAddress}</div>
              </div>
            `
                    )
                    .join('')
            }
          </div>
          <button type="button" data-action="close-mall-modal" class="w-full py-2.5 bg-[#f1eeee] hover:bg-[#e8e5e5] text-xs font-bold rounded-sm min-h-[44px]">닫기</button>
        </div>
      </div>
    `;
  }

  if (mallModalStep === 'celebration' && lastCompletedOrder) {
    return `
      <div id="mall-celebration-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
        <div class="bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-md w-full p-6 text-center space-y-4 shadow-none">
          <div class="text-3xl">🎉</div>
          <h3 class="text-base font-black m-0">굿즈 주문이 성공적으로 접수되었습니다!</h3>
          <p class="text-xs text-stone-600 leading-relaxed">
            주문번호: <strong>${lastCompletedOrder.id}</strong><br/>
            상품: <strong>${lastCompletedOrder.title}</strong> (${lastCompletedOrder.quantity}개)<br/>
            수령인: ${lastCompletedOrder.buyerName}님 (${lastCompletedOrder.buyerPhone})<br/>
            배송지: ${lastCompletedOrder.buyerAddress}
          </p>
          <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] text-[11px] text-stone-600">
            주문 승인이 완료되었으며, 상품 준비 후 발송 시 안내 문자가 발송됩니다.
          </div>
          <button type="button" data-action="close-mall-modal" class="w-full py-3 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs rounded-sm min-h-[44px]">
            확인 (완료)
          </button>
        </div>
      </div>
    `;
  }

  if (mallModalStep === 'crypto') {
    return `
      <div id="mall-crypto-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
        <div class="bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-md w-full p-6 space-y-4 shadow-none">
          <div class="flex items-center justify-between pb-2 border-b border-[rgba(15,0,0,0.08)]">
            <h3 class="text-sm font-bold m-0">⚡ 암호화폐 결제 (USDT / SOL)</h3>
            <button type="button" data-action="close-mall-modal" class="text-stone-500 hover:text-black font-bold p-1">[x]</button>
          </div>
          <p class="text-xs text-stone-600">아래 주소로 해당 금액을 송금하신 후 트랜잭션 해시를 기록해주세요.</p>
          <div class="space-y-2 text-xs">
            <div class="p-2.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)]">
              <div class="text-[10px] text-stone-500 font-bold">USDT (TRC20):</div>
              <div class="font-mono text-[11px] break-all select-all font-bold text-[#201d1d]">${CRYPTO_PAYMENT_INFO.usdtTrc20}</div>
            </div>
            <div class="p-2.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)]">
              <div class="text-[10px] text-stone-500 font-bold">Solana (SOL):</div>
              <div class="font-mono text-[11px] break-all select-all font-bold text-[#201d1d]">${CRYPTO_PAYMENT_INFO.solana}</div>
            </div>
          </div>
          <button type="button" data-action="close-mall-modal" class="w-full py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[44px]">
            확인 완료
          </button>
        </div>
      </div>
    `;
  }

  if (!activeDetailProduct) return '';

  const totalUsd = activeDetailProduct.priceUsd * selectedQty;
  const totalKrw = activeDetailProduct.priceKrw * selectedQty;

  // Step 1: Detail
  if (mallModalStep === 'detail') {
    return `
      <div id="mall-detail-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
        <div class="bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] rounded-none max-w-lg w-full max-h-[90vh] flex flex-col p-6 shadow-none">
          <div class="flex items-center justify-between pb-3 border-b border-[rgba(15,0,0,0.08)]">
            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm">
              ${activeDetailProduct.badge}
            </span>
            <button type="button" data-action="close-mall-modal" class="text-stone-500 hover:text-black font-bold p-1">[x]</button>
          </div>

          <div class="flex-1 overflow-y-auto py-4 space-y-4">
            <div class="w-full h-44 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] flex items-center justify-center p-3">
              <img src="${activeDetailProduct.image}" alt="${activeDetailProduct.name}" class="max-h-full max-w-full object-contain" />
            </div>

            <div>
              <h2 class="text-base font-black text-[#201d1d] m-0">${activeDetailProduct.name}</h2>
              <div class="text-sm font-black text-emerald-800 mt-1">
                ${activeDetailProduct.priceText}
              </div>
              <p class="text-xs text-stone-600 mt-2 leading-relaxed m-0">
                ${activeDetailProduct.description}
              </p>
            </div>

            <div class="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] text-[11px] text-stone-600">
              <span class="font-bold text-[#201d1d]">제품 사양:</span> ${activeDetailProduct.shortSpec}
            </div>

            <!-- Options -->
            <div class="space-y-3 pt-2 border-t border-[rgba(15,0,0,0.08)]">
              ${
                activeDetailProduct.id === 'goods_tshirt'
                  ? `
                <div>
                  <label class="block text-xs font-bold text-stone-700 mb-1">사이즈 선택 (Size):</label>
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
                activeDetailProduct.id === 'goods_deck_faction'
                  ? `
                <div>
                  <label class="block text-xs font-bold text-stone-700 mb-1">종족 선택 (Faction):</label>
                  <select data-action="change-mall-faction" class="w-full p-2.5 bg-white border border-stone-300 text-xs font-mono rounded-sm">
                    ${FACTION_OPTIONS.map(
                      (f) => `<option value="${f}" ${selectedFaction === f ? 'selected' : ''}>${f}</option>`
                    ).join('')}
                  </select>
                </div>
              `
                  : ''
              }

              <div class="flex items-center justify-between pt-1">
                <span class="text-xs font-bold text-stone-700">주문 수량:</span>
                <div class="flex items-center border border-stone-300 rounded-sm">
                  <button type="button" data-action="change-mall-qty" data-delta="-1" class="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-xs font-bold min-h-[36px]">-</button>
                  <span class="px-4 py-1 text-xs font-bold">${selectedQty}</span>
                  <button type="button" data-action="change-mall-qty" data-delta="1" class="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-xs font-bold min-h-[36px]">+</button>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-[rgba(15,0,0,0.08)]">
                <span class="text-xs font-bold text-stone-700">총 결제 예정액:</span>
                <span class="text-sm font-black text-[#201d1d]">
                  $${totalUsd.toFixed(2)} USD / ${totalKrw.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-[rgba(15,0,0,0.08)] flex gap-2">
            <button type="button" data-action="close-mall-modal" class="flex-1 py-3 bg-[#f1eeee] hover:bg-[#e8e5e5] text-xs font-bold rounded-sm min-h-[44px]">
              닫기
            </button>
            <button type="button" data-action="proceed-mall-shipping" class="flex-2 py-3 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[44px]">
              즉시 구매 (배송지 입력) →
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
              <button type="button" data-action="back-mall-detail" class="text-xs text-stone-500 hover:text-black">← 상품</button>
              <h3 class="text-sm font-bold m-0">배송지 정보 입력</h3>
            </div>
            <button type="button" data-action="close-mall-modal" class="text-stone-500 hover:text-black font-bold p-1">[x]</button>
          </div>

          <form id="mall-shipping-form" class="space-y-3" onsubmit="event.preventDefault();">
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">받는 분 성함 (Name) *</label>
              <input type="text" id="mall-buyer-name" value="${buyerName}" placeholder="홍길동" class="w-full p-2.5 bg-white border border-stone-300 text-xs rounded-sm min-h-[44px]" required />
            </div>
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">연락처 (Phone) *</label>
              <input type="tel" id="mall-buyer-phone" value="${buyerPhone}" placeholder="010-1234-5678" class="w-full p-2.5 bg-white border border-stone-300 text-xs rounded-sm min-h-[44px]" required />
            </div>
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">배송지 상세 주소 (Address) *</label>
              <input type="text" id="mall-buyer-address" value="${buyerAddress}" placeholder="도로명 주소 및 상세 동호수 입력" class="w-full p-2.5 bg-white border border-stone-300 text-xs rounded-sm min-h-[44px]" required />
            </div>

            <div class="pt-3 border-t border-[rgba(15,0,0,0.08)] flex gap-2">
              <button type="button" data-action="back-mall-detail" class="flex-1 py-3 bg-[#f1eeee] text-xs font-bold rounded-sm min-h-[44px]">이전</button>
              <button type="button" data-action="submit-mall-shipping" class="flex-2 py-3 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[44px]">
                결제 국가 선택 →
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
              <button type="button" data-action="back-mall-shipping" class="text-xs text-stone-500 hover:text-black">← 배송지</button>
              <h3 class="text-sm font-bold m-0">결제 국가 선택</h3>
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
            <span>⚡ 암호화폐 결제 (USDT / SOL / BTC)</span>
            <span>즉시 지갑 결제 →</span>
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
              <button type="button" data-action="back-mall-country" class="text-xs text-stone-500 hover:text-black">← 국가</button>
              <h3 class="text-sm font-bold m-0">결제 수단 선택</h3>
            </div>
            <span class="text-xs font-bold text-[#201d1d]">${totalKrw.toLocaleString()}원</span>
          </div>

          <div class="space-y-2">
            ${
              selectedCountry === 'ko'
                ? `
              <button type="button" data-action="execute-mall-checkout" data-method="payapp_card" class="w-full py-3 px-4 bg-[#1e58ff] hover:bg-[#1542c7] text-white font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
                <span>💳 국내 신용/체크카드 (PayApp)</span>
                <span>${totalKrw.toLocaleString()}원 결제 →</span>
              </button>
              <button type="button" data-action="execute-mall-checkout" data-method="kakaopay" class="w-full py-3 px-4 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
                <span>🟡 카카오페이 (Kakao Pay)</span>
                <span>간편결제 →</span>
              </button>
              <button type="button" data-action="execute-mall-checkout" data-method="naverpay" class="w-full py-3 px-4 bg-[#03C75A] hover:bg-[#02b351] text-white font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
                <span>🟢 네이버페이 (Naver Pay)</span>
                <span>간편결제 →</span>
              </button>
              <button type="button" data-action="execute-mall-checkout" data-method="applepay" class="w-full py-3 px-4 bg-black hover:bg-stone-800 text-white font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px]">
                <span>🍎 Apple Pay</span>
                <span>원터치 결제 →</span>
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
              <span>⚡ 암호화폐 결제 (USDT / SOL / BTC)</span>
              <span>Web3 지갑 결제 →</span>
            </button>

            <!-- Test Simulation Button Clearly Separated -->
            <button type="button" data-action="execute-mall-checkout" data-method="test_sim" class="w-full py-2.5 px-4 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs rounded-sm flex items-center justify-between min-h-[44px] mt-2 border border-stone-400">
              <span>🧪 [개발자/시뮬레이션] 즉시 주문 승인 (SIM - 무과금)</span>
              <span class="text-[10px] text-stone-600">결제창 없이 주문 확정</span>
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
  const filtered =
    activeTab === 'ALL'
      ? MALL_GOODS_PRODUCTS
      : MALL_GOODS_PRODUCTS.filter((p) => p.category === activeTab);

  const modalHtml = renderMallModal();

  return `
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 font-mono text-[#201d1d] select-none">
      <!-- Top Mall Banner & Actions -->
      <section class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-6 sm:p-8 rounded-none shadow-none space-y-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[rgba(15,0,0,0.08)] gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-wider uppercase mb-2">
              <span>공식 실물 굿즈 스토어</span>
              <span class="text-stone-400">·</span>
              <span>snshero.com/mall</span>
            </div>
            <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-[#201d1d] m-0">
              SNS히어로 공식 굿즈 몰 (Official Goods Mall)
            </h1>
            <p class="text-xs sm:text-sm text-stone-600 mt-1 m-0">
              110종 풀세트 실물 TCG 카드, 11대 종족별 테마 덱, 배틀 매트 게임테이블, 머그컵 및 공식 의류를 만나보세요.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              data-action="open-mall-orders"
              class="px-4 py-2.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#e8e5e5] transition-colors min-h-[44px] flex items-center justify-center whitespace-nowrap cursor-pointer"
            >
              📦 내 주문 내역 조회
            </button>
            <a
              href="#shop"
              data-nav="shop"
              class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] flex items-center justify-center whitespace-nowrap cursor-pointer no-underline"
            >
              인게임 상점 바로가기 →
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
              <span>${tab.label}</span>
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
                  class="w-full h-44 bg-[#f8f7f7] border border-[rgba(15,0,0,0.08)] rounded-none flex items-center justify-center p-3 overflow-hidden cursor-pointer"
                  data-action="open-mall-detail"
                  data-product-id="${prod.id}"
                >
                  <img src="${prod.image}" alt="${prod.name}" class="max-h-full max-w-full object-contain" />
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
                  <span class="text-xs text-stone-500">가격:</span>
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
                  상세보기 &amp; 즉시구매
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
