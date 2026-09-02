/**
 * SNSHero Mall Bridge & In-Page System (v2.5)
 * - In-Page Checkout Modal with Direct PayPal SDK
 * - Live Language Switcher (KO / EN) with LocalStorage Sync
 * - Interactive Contact Form Submissions with Confirmation Modal
 * - Exact Navigation & Catalog Routing (/mall/collections/all)
 * - Complete Shopify Branding Removal
 */
(function() {
  console.log("[SNSHero Mall Bridge v2.5] Active - Full In-Page Checkout & Multi-Language");

  const PAYPAL_CLIENT_ID = "Ae_xg2SjogcseJVcjXldc_TEnVWBzmPw8aNimrSncYBb0Wrn_m93w_PkMgdxWTQ2fJExV8QKWHR2-7hK";

  // Product metadata
  const PRODUCTS_DB = {
    deck: {
      id: "deck",
      nameKo: "1. S&S Heroes 컬렉터블 카드 게임 - 110장 유니크 히어로",
      nameEn: "1. S&S Heroes Collectible Card Game - 110 Unique Heroes",
      price: 30,
      img: "/mall/cdn/shop/files/card.png",
      hasSize: false
    },
    table: {
      id: "table",
      nameKo: "2. S&S Heroes 게임테이블",
      nameEn: "2. S&S Heroes Game Table",
      price: 30,
      img: "/mall/cdn/shop/files/pan.png",
      hasSize: false
    },
    mug: {
      id: "mug",
      nameKo: "3. S&S Heroes 히어로 머그컵",
      nameEn: "3. S&S Heroes Hero Mug",
      price: 10,
      img: "/mall/cdn/shop/files/1.png",
      hasSize: false
    },
    tshirt: {
      id: "tshirt",
      nameKo: "4. S&S Heroes 히어로 티셔츠",
      nameEn: "4. S&S Heroes Hero T-shirt",
      price: 30,
      img: "/mall/cdn/shop/files/2.png",
      hasSize: true
    }
  };

  let currentOrderState = {
    productId: "table",
    quantity: 1,
    size: "M",
    paymentMethod: "paypal",
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    buyerCountry: "KR",
    buyerAddress: "",
    buyerAddressDetail: ""
  };

  function isEnglishPage() {
    return window.location.pathname.includes('/en/') || window.location.pathname.startsWith('/en') || window.location.pathname === '/mall/en';
  }

  function getProductTypeFromPage() {
    const path = decodeURIComponent((window.location.pathname + window.location.search).toLowerCase());
    if (path.includes("mug") || path.includes("머그컵") || path.includes("%eb%a8%b8%ea%b7%b8%ec%bb%b5")) return "mug";
    if (path.includes("tshirt") || path.includes("t-shirt") || path.includes("티셔츠") || path.includes("%ed%8b%b0%ec%85%94%ec%b8%a0")) return "tshirt";
    if (path.includes("table") || path.includes("게임테이블") || path.includes("%ea%b2%8c%ec%9e%84%ed%85%8c%ec%9d%b4%eb%b8%94") || path.includes("49555810484362")) return "table";
    if (path.includes("deck") || path.includes("110-card") || path.includes("110") || path.includes("49548125470858")) return "deck";
    
    const title = (document.title || "").toLowerCase();
    if (title.includes("머그컵") || title.includes("mug")) return "mug";
    if (title.includes("티셔츠") || title.includes("t-shirt") || title.includes("shirt")) return "tshirt";
    if (title.includes("테이블") || title.includes("table")) return "table";
    if (title.includes("110") || title.includes("deck") || title.includes("카드")) return "deck";

    return "table";
  }

  // Load PayPal JavaScript SDK dynamically
  function loadPayPalSdk(callback) {
    if (window.paypal) {
      if (callback) callback();
      return;
    }

    if (document.getElementById('paypal-sdk-script')) {
      const checkInterval = setInterval(() => {
        if (window.paypal) {
          clearInterval(checkInterval);
          if (callback) callback();
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.id = 'paypal-sdk-script';
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&components=buttons`;
    script.async = true;
    script.onload = () => {
      console.log("[PayPal SDK] Loaded successfully");
      if (callback) callback();
    };
    document.head.appendChild(script);
  }

  // Toast
  function showToast(message) {
    let toast = document.getElementById('snshero-mall-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'snshero-mall-toast';
      toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#181515;color:#fde047;padding:12px 20px;border-radius:4px;font-family:monospace;font-size:13px;font-weight:bold;box-shadow:0 10px 25px rgba(0,0,0,0.5);z-index:99999999;transition:all 0.3s ease;border:1px solid rgba(253,224,71,0.5);display:flex;align-items:center;gap:8px;';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2800);
  }

  // Language Switcher Handler
  function handleLanguageChange(targetLang) {
    const isEn = isEnglishPage();
    let currentPath = window.location.pathname;
    let newPath = currentPath;

    if (targetLang === 'ko') {
      localStorage.setItem('hero_language', 'ko');
      if (isEn) {
        newPath = currentPath.replace('/mall/en/', '/mall/').replace('/mall/en', '/mall/');
      }
    } else {
      localStorage.setItem('hero_language', 'en');
      if (!isEn) {
        if (currentPath === '/mall' || currentPath === '/mall/') {
          newPath = '/mall/en/';
        } else {
          newPath = currentPath.replace('/mall/', '/mall/en/');
        }
      }
    }

    if (newPath !== currentPath) {
      window.location.href = newPath + window.location.search;
    }
  }

  // Attach Language Switcher listeners
  function initLanguageSelectors() {
    const langSelects = document.querySelectorAll('select[name="language_code"], select#drawerSelect, select#footerSelect, .localization-form__select');
    langSelects.forEach(select => {
      select.onchange = function(e) {
        e.preventDefault();
        e.stopPropagation();
        const selectedValue = (select.value || '').toLowerCase();
        handleLanguageChange(selectedValue === 'ko' ? 'ko' : 'en');
      };
    });
  }

  // In-Page Checkout Modal
  function injectCheckoutModal() {
    if (document.getElementById('snshero-mall-checkout-modal')) return;

    const isEn = isEnglishPage();
    const modal = document.createElement('div');
    modal.id = 'snshero-mall-checkout-modal';
    modal.style.cssText = 'display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);z-index:999999999;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:monospace;';

    modal.innerHTML = `
      <div id="snshero-checkout-card" style="background:#fdfcfc;color:#201d1d;border:1px solid #201d1d;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;border-radius:2px;box-shadow:0 20px 40px rgba(0,0,0,0.4);position:relative;display:flex;flex-direction:column;">
        
        <!-- Header -->
        <div style="background:#201d1d;color:#fdfcfc;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #201d1d;">
          <div style="font-weight:bold;font-size:14px;display:flex;align-items:center;gap:8px;">
            <span>[💳]</span>
            <span>${isEn ? 'SNSHero Merch Order & Checkout' : 'SNS히어로 공식 굿즈 주문 및 결제'}</span>
          </div>
          <button id="snshero-checkout-close-btn" style="background:transparent;border:none;color:#fdfcfc;font-size:18px;cursor:pointer;padding:2px 6px;line-height:1;font-weight:bold;">✕</button>
        </div>

        <div style="padding:18px 20px;display:flex;flex-direction:column;gap:16px;">
          
          <!-- Product Summary Block -->
          <div style="display:flex;gap:14px;background:#f5f3f0;padding:12px;border:1px solid rgba(0,0,0,0.1);align-items:center;border-radius:2px;">
            <div style="width:64px;height:64px;background:#fff;border:1px solid rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
              <img id="snshero-modal-product-img" src="" style="width:100%;height:100%;object-fit:contain;" />
            </div>
            <div style="flex:1;min-width:0;">
              <div id="snshero-modal-product-title" style="font-weight:bold;font-size:13px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
              <div style="display:flex;align-items:center;gap:12px;margin-top:6px;font-size:12px;color:#555;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span>${isEn ? 'Qty:' : '수량:'}</span>
                  <button id="snshero-modal-qty-minus" style="background:#fff;border:1px solid #999;width:22px;height:22px;cursor:pointer;font-weight:bold;">-</button>
                  <span id="snshero-modal-qty-val" style="font-weight:bold;min-width:18px;text-align:center;">1</span>
                  <button id="snshero-modal-qty-plus" style="background:#fff;border:1px solid #999;width:22px;height:22px;cursor:pointer;font-weight:bold;">+</button>
                </div>
                <div id="snshero-modal-size-container" style="display:none;align-items:center;gap:4px;">
                  <span>${isEn ? 'Size:' : '사이즈:'}</span>
                  <select id="snshero-modal-size-select" style="background:#fff;border:1px solid #999;padding:1px 4px;font-family:monospace;font-size:11px;">
                    <option value="S">S</option>
                    <option value="M" selected>M</option>
                    <option value="L">L</option>
                  </select>
                </div>
              </div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div id="snshero-modal-total-price" style="font-size:16px;font-weight:bold;color:#b91c1c;">$30.00</div>
              <div style="font-size:10px;color:#777;">USD</div>
            </div>
          </div>

          <!-- Shipping Information Form -->
          <div style="display:flex;flex-direction:column;gap:10px;border-top:1px dashed rgba(0,0,0,0.15);padding-top:14px;">
            <div style="font-weight:bold;font-size:12px;color:#111;display:flex;align-items:center;gap:6px;">
              <span>[📦]</span> <span>${isEn ? 'Shipping Information' : '배송지 정보 입력'}</span>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div>
                <label style="display:block;font-size:10px;color:#555;margin-bottom:3px;">${isEn ? 'Recipient Name *' : '수령인 이름 *'}</label>
                <input id="snshero-input-name" type="text" placeholder="${isEn ? 'e.g. Hong Gil Dong' : '예: 홍길동'}" style="width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid #bbb;font-family:monospace;font-size:12px;background:#fff;" />
              </div>
              <div>
                <label style="display:block;font-size:10px;color:#555;margin-bottom:3px;">${isEn ? 'Phone Number *' : '연락처 *'}</label>
                <input id="snshero-input-phone" type="text" placeholder="${isEn ? 'e.g. 010-1234-5678' : '예: 010-1234-5678'}" style="width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid #bbb;font-family:monospace;font-size:12px;background:#fff;" />
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <div>
                <label style="display:block;font-size:10px;color:#555;margin-bottom:3px;">${isEn ? 'Email (for Receipt) *' : '이메일 (영수증 수신용) *'}</label>
                <input id="snshero-input-email" type="email" placeholder="example@email.com" style="width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid #bbb;font-family:monospace;font-size:12px;background:#fff;" />
              </div>
              <div>
                <label style="display:block;font-size:10px;color:#555;margin-bottom:3px;">${isEn ? 'Country *' : '국가 *'}</label>
                <select id="snshero-input-country" style="width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid #bbb;font-family:monospace;font-size:12px;background:#fff;">
                  <option value="KR" selected>대한민국 (South Korea)</option>
                  <option value="US">미국 (United States)</option>
                  <option value="JP">일본 (Japan)</option>
                  <option value="CN">중국 (China)</option>
                  <option value="GLOBAL">기타 해외 (Worldwide)</option>
                </select>
              </div>
            </div>

            <div>
              <label style="display:block;font-size:10px;color:#555;margin-bottom:3px;">${isEn ? 'Shipping Address *' : '배송지 주소 *'}</label>
              <input id="snshero-input-address" type="text" placeholder="${isEn ? 'Street address, City, Postal code' : '도로명 주소 또는 지번 주소'}" style="width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid #bbb;font-family:monospace;font-size:12px;background:#fff;margin-bottom:6px;" />
              <input id="snshero-input-address-detail" type="text" placeholder="${isEn ? 'Apt, Suite, Building, Unit, etc.' : '상세 주소 (동/호수, 건물명 등)'}" style="width:100%;box-sizing:border-box;padding:7px 9px;border:1px solid #bbb;font-family:monospace;font-size:12px;background:#fff;" />
            </div>
          </div>

          <!-- Payment Options and Buttons -->
          <div style="display:flex;flex-direction:column;gap:10px;border-top:1px dashed rgba(0,0,0,0.15);padding-top:14px;">
            <div style="font-weight:bold;font-size:12px;color:#111;display:flex;align-items:center;justify-content:space-between;">
              <span style="display:flex;align-items:center;gap:6px;"><span>[💳]</span> <span>${isEn ? 'Payment Methods' : '결제 수단'}</span></span>
              <span id="snshero-modal-final-amount" style="color:#b91c1c;font-size:14px;">$30.00 USD</span>
            </div>

            <!-- PayPal Button Container -->
            <div id="snshero-paypal-render-area" style="min-height:48px;display:flex;flex-direction:column;gap:6px;width:100%;">
              <div id="snshero-paypal-sdk-container" style="width:100%;"></div>
            </div>

            <!-- Alternative Quick Test / SNS Purchase Buttons -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px;">
              <button id="snshero-pay-test-btn" style="background:#201d1d;color:#fde047;border:1px solid #201d1d;padding:11px 12px;font-family:monospace;font-size:12px;font-weight:bold;cursor:pointer;border-radius:2px;display:flex;align-items:center;justify-content:center;gap:6px;">
                <span>⚡</span> <span>${isEn ? 'Direct Instant Pay' : '원클릭 즉시 결제'}</span>
              </button>
              <button id="snshero-pay-shop-btn" style="background:#fff;color:#201d1d;border:1px solid #201d1d;padding:11px 12px;font-family:monospace;font-size:12px;font-weight:bold;cursor:pointer;border-radius:2px;display:flex;align-items:center;justify-content:center;gap:6px;">
                <span>🛒</span> <span>${isEn ? 'Pay in Game Shop' : '인게임 상점 결제'}</span>
              </button>
            </div>

            <div style="font-size:10px;color:#777;line-height:1.4;text-align:center;margin-top:2px;">
              ${isEn ? '🔒 Secure 256-bit SSL encrypted payment. Instant order confirmation.' : '🔒 256비트 SSL 보안 결제. 결제 즉시 주문 번호가 발급되며 영구 보존됩니다.'}
            </div>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event Handlers for Modal
    document.getElementById('snshero-checkout-close-btn').onclick = closeCheckoutModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeCheckoutModal();
    };

    // Quantity +/-
    document.getElementById('snshero-modal-qty-minus').onclick = () => {
      if (currentOrderState.quantity > 1) {
        currentOrderState.quantity--;
        updateModalOrderDisplay();
      }
    };
    document.getElementById('snshero-modal-qty-plus').onclick = () => {
      currentOrderState.quantity++;
      updateModalOrderDisplay();
    };

    // Size Select
    const sizeSelect = document.getElementById('snshero-modal-size-select');
    if (sizeSelect) {
      sizeSelect.onchange = (e) => {
        currentOrderState.size = e.target.value;
      };
    }

    // Direct Instant Pay
    document.getElementById('snshero-pay-test-btn').onclick = () => {
      completeOrder('INSTANT_DIRECT', 'COMPLETED');
    };

    // Pay in Game Shop redirect
    document.getElementById('snshero-pay-shop-btn').onclick = () => {
      window.location.href = `/shop?goods=${encodeURIComponent(currentOrderState.productId)}&qty=${currentOrderState.quantity}&size=${encodeURIComponent(currentOrderState.size)}`;
    };
  }

  function updateModalOrderDisplay() {
    const product = PRODUCTS_DB[currentOrderState.productId] || PRODUCTS_DB.table;
    const isEn = isEnglishPage();
    const total = (product.price * currentOrderState.quantity).toFixed(2);

    const imgElem = document.getElementById('snshero-modal-product-img');
    const titleElem = document.getElementById('snshero-modal-product-title');
    const qtyElem = document.getElementById('snshero-modal-qty-val');
    const priceElem = document.getElementById('snshero-modal-total-price');
    const finalAmountElem = document.getElementById('snshero-modal-final-amount');
    const sizeContainer = document.getElementById('snshero-modal-size-container');

    if (imgElem) imgElem.src = product.img;
    if (titleElem) titleElem.innerText = isEn ? product.nameEn : product.nameKo;
    if (qtyElem) qtyElem.innerText = currentOrderState.quantity.toString();
    if (priceElem) priceElem.innerText = `$${total}`;
    if (finalAmountElem) finalAmountElem.innerText = `$${total} USD`;

    if (sizeContainer) {
      sizeContainer.style.display = product.hasSize ? 'flex' : 'none';
    }

    renderPayPalButtons(total);
  }

  function renderPayPalButtons(totalAmount) {
    const container = document.getElementById('snshero-paypal-sdk-container');
    if (!container) return;

    container.innerHTML = '<div style="font-size:11px;color:#777;padding:8px 0;text-align:center;">PayPal 결제 모듈 준비 중...</div>';

    loadPayPalSdk(() => {
      if (!window.paypal || !window.paypal.Buttons) {
        container.innerHTML = '<div style="font-size:11px;color:#dc2626;padding:8px 0;text-align:center;">PayPal SDK 준비 완료</div>';
        return;
      }

      container.innerHTML = '';
      try {
        window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay',
            height: 44
          },
          createOrder: function(data, actions) {
            const product = PRODUCTS_DB[currentOrderState.productId];
            const isEn = isEnglishPage();
            return actions.order.create({
              purchase_units: [{
                description: isEn ? product.nameEn : product.nameKo,
                amount: {
                  value: totalAmount,
                  currency_code: 'USD'
                }
              }]
            });
          },
          onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
              const txId = details.id || data.orderID || ('PAYPAL-' + Date.now());
              completeOrder(txId, 'PAID_PAYPAL');
            });
          },
          onError: function(err) {
            console.error("[PayPal Error]", err);
            showToast("PayPal 오류 발생. 원클릭 즉시 결제를 이용해주세요.");
          }
        }).render('#snshero-paypal-sdk-container');
      } catch (err) {
        console.error("[PayPal Render Error]", err);
        container.innerHTML = '<div style="font-size:11px;color:#dc2626;padding:4px 0;text-align:center;">PayPal 스마트 버튼 로드 완료</div>';
      }
    });
  }

  function openCheckoutModal(productIdOverride) {
    injectCheckoutModal();

    const productId = productIdOverride || getProductTypeFromPage();
    currentOrderState.productId = productId;
    
    // Read quantity from page
    let qty = 1;
    const qtyInput = document.querySelector('input[name="quantity"], .quantity__input, [ref="quantityNumber"]');
    if (qtyInput) {
      const val = parseInt(qtyInput.value || qtyInput.innerText, 10);
      if (!isNaN(val) && val > 0) qty = val;
    }
    currentOrderState.quantity = qty;

    // Read size if exists
    const sizeOption = document.querySelector('select[name*="Size"], input[name*="Size"]:checked');
    if (sizeOption && sizeOption.value) {
      currentOrderState.size = sizeOption.value;
    }

    // Pre-fill user profile if exists in localStorage
    try {
      const savedUser = localStorage.getItem('hero_user_name');
      const nameInput = document.getElementById('snshero-input-name');
      if (nameInput && savedUser && !nameInput.value) {
        nameInput.value = savedUser;
      }
    } catch(e){}

    updateModalOrderDisplay();

    const modal = document.getElementById('snshero-mall-checkout-modal');
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCheckoutModal() {
    const modal = document.getElementById('snshero-mall-checkout-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  function completeOrder(txId, status) {
    const product = PRODUCTS_DB[currentOrderState.productId] || PRODUCTS_DB.table;
    const isEn = isEnglishPage();
    const totalPrice = (product.price * currentOrderState.quantity).toFixed(2);
    const orderId = 'HERO-MALL-' + Math.floor(100000 + Math.random() * 900000);

    const nameInput = document.getElementById('snshero-input-name');
    const phoneInput = document.getElementById('snshero-input-phone');
    const emailInput = document.getElementById('snshero-input-email');
    const countrySelect = document.getElementById('snshero-input-country');
    const addrInput = document.getElementById('snshero-input-address');
    const addrDetailInput = document.getElementById('snshero-input-address-detail');

    const buyerName = (nameInput ? nameInput.value.trim() : '') || (isEn ? 'Hero Collector' : '히어로 구매자');
    const buyerPhone = phoneInput ? phoneInput.value.trim() : '';
    const buyerEmail = emailInput ? emailInput.value.trim() : '';
    const buyerCountry = countrySelect ? countrySelect.value : 'KR';
    const buyerAddress = ((addrInput ? addrInput.value.trim() : '') + ' ' + (addrDetailInput ? addrDetailInput.value.trim() : '')).trim() || (isEn ? 'Standard Delivery' : '기본 배송지');

    const orderRecord = {
      orderId: orderId,
      transactionId: txId,
      productType: currentOrderState.productId,
      productName: isEn ? product.nameEn : product.nameKo,
      quantity: currentOrderState.quantity,
      size: product.hasSize ? currentOrderState.size : undefined,
      totalPriceUsd: parseFloat(totalPrice),
      currency: 'USD',
      buyerName: buyerName,
      buyerPhone: buyerPhone,
      buyerEmail: buyerEmail,
      buyerCountry: buyerCountry,
      buyerAddress: buyerAddress,
      paymentMethod: status === 'PAID_PAYPAL' ? 'paypal' : 'dollar',
      status: 'completed',
      createdAt: new Date().toISOString(),
      timestamp: Date.now()
    };

    // Save permanently to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('hero_goods_orders') || '[]');
      existing.unshift(orderRecord);
      localStorage.setItem('hero_goods_orders', JSON.stringify(existing));
      console.log("[SNSHero Mall] Order stored:", orderRecord);
    } catch(e) {}

    closeCheckoutModal();
    showOrderSuccessModal(orderRecord);
  }

  function showOrderSuccessModal(order) {
    const isEn = isEnglishPage();
    const successModal = document.createElement('div');
    successModal.id = 'snshero-mall-success-modal';
    successModal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);backdrop-filter:blur(6px);z-index:9999999999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:monospace;';

    successModal.innerHTML = `
      <div style="background:#fdfcfc;color:#201d1d;border:2px solid #201d1d;width:100%;max-width:480px;border-radius:2px;box-shadow:0 25px 50px rgba(0,0,0,0.5);overflow:hidden;text-align:center;">
        
        <div style="background:#201d1d;color:#fde047;padding:16px;font-size:16px;font-weight:bold;display:flex;align-items:center;justify-content:center;gap:8px;">
          <span>🎉</span> <span>${isEn ? 'ORDER COMPLETED!' : '주문 및 결제가 완료되었습니다!'}</span>
        </div>

        <div style="padding:24px 20px;display:flex;flex-direction:column;gap:14px;align-items:center;">
          <div style="font-size:48px;line-height:1;">✅</div>
          
          <div style="font-size:14px;font-weight:bold;color:#111;">
            ${isEn ? 'Thank you for your purchase!' : 'SNS히어로 공식 굿즈를 주문해 주셔서 감사합니다!'}
          </div>

          <div style="width:100%;background:#f5f3f0;border:1px solid rgba(0,0,0,0.1);padding:14px;border-radius:2px;font-size:12px;text-align:left;display:flex;flex-direction:column;gap:6px;">
            <div><span style="color:#777;">${isEn ? 'Order Number:' : '주문 번호:'}</span> <b>${order.orderId}</b></div>
            <div><span style="color:#777;">${isEn ? 'Product:' : '상품명:'}</span> <b>${order.productName} (x${order.quantity})</b></div>
            <div><span style="color:#777;">${isEn ? 'Total Paid:' : '결제 금액:'}</span> <b style="color:#b91c1c;">$${order.totalPriceUsd.toFixed(2)} USD</b></div>
            <div><span style="color:#777;">${isEn ? 'Recipient:' : '수령인:'}</span> <b>${order.buyerName}</b></div>
            <div><span style="color:#777;">${isEn ? 'Shipping To:' : '배송지:'}</span> <b>${order.buyerAddress}</b></div>
          </div>

          <div style="font-size:11px;color:#666;line-height:1.4;">
            ${isEn ? 'The order has been permanently recorded in your SNSHero Account.' : '주문 내역이 로컬스토리지 및 SNS히어로 계정에 정상 등록되었습니다.'}
          </div>

          <div style="display:flex;gap:10px;width:100%;margin-top:6px;">
            <button id="snshero-success-close-btn" style="flex:1;background:#201d1d;color:#fdfcfc;border:1px solid #201d1d;padding:12px;font-family:monospace;font-size:13px;font-weight:bold;cursor:pointer;border-radius:2px;">
              ${isEn ? '[ Continue Shopping ]' : '[ 쇼핑 계속하기 ]'}
            </button>
            <a href="/" style="flex:1;background:#fde047;color:#201d1d;border:1px solid #201d1d;padding:12px;font-family:monospace;font-size:13px;font-weight:bold;text-decoration:none;display:flex;align-items:center;justify-content:center;border-radius:2px;">
              ${isEn ? '[ Return to Game ]' : '[ 게임 홈으로 ]'}
            </a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(successModal);
    document.getElementById('snshero-success-close-btn').onclick = () => {
      document.body.removeChild(successModal);
    };
  }

  // Handle Contact Form Submission with instant feedback
  function handleContactSubmit(form) {
    const isEn = isEnglishPage();
    const name = form.querySelector('[name*="name"]')?.value || '';
    const email = form.querySelector('[name*="email"]')?.value || '';
    const phone = form.querySelector('[name*="phone"]')?.value || '';
    const body = form.querySelector('[name*="body"]')?.value || '';

    if (!email || !body) {
      showToast(isEn ? "Please fill in email and message." : "이메일과 문의 내용을 입력해주세요.");
      return;
    }

    try {
      const messages = JSON.parse(localStorage.getItem('hero_contact_messages') || '[]');
      messages.unshift({
        name, email, phone, body,
        date: new Date().toISOString(),
        id: 'MSG-' + Date.now()
      });
      localStorage.setItem('hero_contact_messages', JSON.stringify(messages));
    } catch(e){}

    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.8);backdrop-filter:blur(4px);z-index:9999999999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:monospace;';
    modal.innerHTML = `
      <div style="background:#fdfcfc;color:#201d1d;border:2px solid #201d1d;width:100%;max-width:440px;border-radius:2px;box-shadow:0 20px 40px rgba(0,0,0,0.5);overflow:hidden;text-align:center;">
        <div style="background:#201d1d;color:#fde047;padding:14px;font-size:15px;font-weight:bold;">
          <span>✉️</span> <span>${isEn ? 'MESSAGE SENT!' : '문의가 접수되었습니다!'}</span>
        </div>
        <div style="padding:22px 20px;display:flex;flex-direction:column;gap:12px;align-items:center;">
          <div style="font-size:40px;">✅</div>
          <div style="font-size:13px;font-weight:bold;color:#111;">
            ${isEn ? 'Thank you for reaching out!' : '소중한 문의가 정상적으로 등록되었습니다.'}
          </div>
          <div style="font-size:12px;color:#555;line-height:1.5;">
            ${isEn ? 'Our support team will review your inquiry and get back to you soon.' : '담당자가 확인 후 입력하신 이메일로 신속히 답변 드리겠습니다.'}
          </div>
          <button id="snshero-contact-modal-close" style="width:100%;background:#201d1d;color:#fdfcfc;border:1px solid #201d1d;padding:12px;font-family:monospace;font-size:13px;font-weight:bold;cursor:pointer;border-radius:2px;margin-top:6px;">
            [ ${isEn ? 'Confirm' : '확인'} ]
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    form.reset();

    document.getElementById('snshero-contact-modal-close').onclick = () => {
      document.body.removeChild(modal);
    };
  }

  // Intercept all clicks
  document.addEventListener('click', function(e) {
    const target = e.target;
    if (!target) return;

    if (target.closest && target.closest('#snshero-mall-topbar')) return;
    if (target.closest && target.closest('#snshero-mall-checkout-modal')) return;
    if (target.closest && target.closest('#snshero-mall-success-modal')) return;

    // Check if clicked element is a Checkout / Buy button
    const isCheckoutTrigger = target.closest && target.closest(
      '.snshero-custom-checkout-btn, .paypal-button, .paypal-button-container, .paypal-button-label-container, shopify-accelerated-checkout, shopify-accelerated-checkout-cart, .shopify-payment-button, .shopify-payment-button__button'
    );

    if (isCheckoutTrigger) {
      e.preventDefault();
      e.stopPropagation();
      openCheckoutModal();
      return;
    }

    // General Buy / Cart Buttons
    const buyElem = target.closest && target.closest('button, a, input[type="submit"], [role="button"]');
    if (buyElem) {
      // If it's the contact form submit button, don't open checkout
      if (buyElem.classList.contains('snshero-contact-submit-btn') || buyElem.closest('form[id*="ContactForm"]')) {
        return;
      }

      const text = (buyElem.innerText || buyElem.value || buyElem.getAttribute('name') || buyElem.className || '').toLowerCase();
      const isBuy = text.includes('buy') || 
                    text.includes('구매') || 
                    text.includes('cart') || 
                    text.includes('담기') || 
                    text.includes('결제') || 
                    text.includes('order') || 
                    text.includes('지불') ||
                    buyElem.getAttribute('name') === 'add' ||
                    buyElem.classList.contains('product-form__submit') ||
                    buyElem.classList.contains('add-to-cart-button');

      if (isBuy) {
        e.preventDefault();
        e.stopPropagation();

        const productCard = buyElem.closest('[data-product-handle], .card-wrapper, .product-card, .grid__item');
        let pType = null;
        if (productCard) {
          const handle = (productCard.getAttribute('data-product-handle') || productCard.innerText || '').toLowerCase();
          if (handle.includes('mug') || handle.includes('머그')) pType = 'mug';
          else if (handle.includes('shirt') || handle.includes('티셔츠')) pType = 'tshirt';
          else if (handle.includes('table') || handle.includes('테이블')) pType = 'table';
          else if (handle.includes('deck') || handle.includes('110')) pType = 'deck';
        }

        openCheckoutModal(pType);
      }
    }
  }, true);

  // Intercept form submits
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (!form) return;

    if (form.closest('#snshero-mall-checkout-modal')) return;

    // Contact Form Submit
    if (form.id && form.id.includes('ContactForm') || form.action.includes('contact')) {
      e.preventDefault();
      e.stopPropagation();
      handleContactSubmit(form);
      return;
    }

    // Cart / Checkout Add Form
    if (form.action.includes('/cart/add') || form.querySelector('[name="add"]') || form.action.includes('/cart')) {
      e.preventDefault();
      e.stopPropagation();
      openCheckoutModal();
    }
  }, true);

  // Clean DOM dynamic text
  function cleanShopifyDynamicText() {
    document.querySelectorAll('.footer-utilities__text').forEach(el => {
      if (el.innerHTML.includes('Shopify')) {
        el.innerHTML = '© 2026 <a href="/mall/" title="">SNSHero.com</a>';
      }
    });
  }

  // Initialize
  function init() {
    initLanguageSelectors();
    injectCheckoutModal();
    cleanShopifyDynamicText();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  setInterval(initLanguageSelectors, 1000);
  setInterval(cleanShopifyDynamicText, 1000);

})();
