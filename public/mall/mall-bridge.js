/**
 * SNSHero Mall Bridge Script
 * Handles purchase intent from the static Shopify mall and redirects to SNSHero /shop checkout
 */
(function() {
  console.log("[SNSHero Mall Bridge v1.2] Active");

  // Show a quick visual notification
  function showToast(message) {
    let toast = document.getElementById('snshero-mall-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'snshero-mall-toast';
      toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1e1b1b;color:#fde047;padding:12px 20px;border-radius:4px;font-family:monospace;font-size:13px;font-weight:bold;box-shadow:0 10px 25px rgba(0,0,0,0.3);z-index:9999999;transition:all 0.3s ease;border:1px solid rgba(253,224,71,0.4);display:flex;align-items:center;gap:8px;';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>⚡</span> <span>${message}</span>`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2500);
  }

  function getProductTypeFromPage() {
    const path = decodeURIComponent(window.location.pathname.toLowerCase());
    if (path.includes("mug") || path.includes("머그컵") || path.includes("%eb%a8%b8%ea%b7%b8%ec%bb%b5")) return "mug";
    if (path.includes("tshirt") || path.includes("t-shirt") || path.includes("티셔츠") || path.includes("%ed%8b%b0%ec%85%94%ec%b8%a0")) return "tshirt";
    if (path.includes("table") || path.includes("게임테이블") || path.includes("%ea%b2%8c%ec%9e%84%ed%85%8c%ec%9d%b4%eb%b8%94")) return "table";
    if (path.includes("deck") || path.includes("110-card") || path.includes("110")) return "deck";
    
    const title = (document.title || "").toLowerCase();
    if (title.includes("머그컵") || title.includes("mug")) return "mug";
    if (title.includes("티셔츠") || title.includes("t-shirt") || title.includes("shirt")) return "tshirt";
    if (title.includes("테이블") || title.includes("table")) return "table";
    if (title.includes("110") || title.includes("deck") || title.includes("카드")) return "deck";

    return "goods";
  }

  function handlePurchase(e, productTypeOverride) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const productType = productTypeOverride || getProductTypeFromPage();
    
    // Read quantity
    let qty = 1;
    const qtyInput = document.querySelector('input[name="quantity"]') || document.querySelector('.quantity__input') || document.querySelector('input[type="number"]');
    if (qtyInput && qtyInput.value) {
      const parsed = parseInt(qtyInput.value, 10);
      if (!isNaN(parsed) && parsed > 0) qty = parsed;
    }

    // Read size option if available
    let size = 'M';
    const sizeSelect = document.querySelector('select[name="Size"]') || 
                       document.querySelector('select[name="options[Size]"]') ||
                       document.querySelector('input[name="Size"]:checked') ||
                       document.querySelector('input[name="options[Size]"]:checked');
    if (sizeSelect && sizeSelect.value) {
      size = sizeSelect.value;
    }

    showToast(`SNSHero 상점 결제 페이지로 이동합니다... (${productType.toUpperCase()} x ${qty})`);

    // If inside iframe, notify parent window
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'SNSHERO_MALL_BUY',
        goodsType: productType,
        quantity: qty,
        size: size
      }, '*');
      return;
    }

    // Direct redirect to /shop with query params
    setTimeout(() => {
      window.location.href = `/shop?goods=${encodeURIComponent(productType)}&qty=${qty}&size=${encodeURIComponent(size)}`;
    }, 400);
  }

  // Intercept clicks on buy / checkout / add to cart buttons
  document.addEventListener('click', function(e) {
    const target = e.target.closest('button, a, input[type="submit"]');
    if (!target) return;

    // Don't intercept top navigation bar links
    if (target.closest('#snshero-mall-topbar')) return;

    const text = (target.innerText || target.value || target.getAttribute('name') || target.className || '').toLowerCase();
    const isBuyButton = text.includes('buy') || 
                        text.includes('구매') || 
                        text.includes('cart') || 
                        text.includes('담기') || 
                        text.includes('결제') || 
                        text.includes('order') || 
                        target.getAttribute('name') === 'add' ||
                        target.classList.contains('product-form__submit') ||
                        target.classList.contains('shopify-payment-button__button');

    if (isBuyButton) {
      const productCard = target.closest('[data-product-handle], .card-wrapper, .product-card, .grid__item');
      let pType = null;
      if (productCard) {
        const handle = (productCard.getAttribute('data-product-handle') || productCard.innerText || '').toLowerCase();
        if (handle.includes('mug') || handle.includes('머그')) pType = 'mug';
        else if (handle.includes('shirt') || handle.includes('티셔츠')) pType = 'tshirt';
        else if (handle.includes('table') || handle.includes('테이블')) pType = 'table';
        else if (handle.includes('deck') || handle.includes('110')) pType = 'deck';
      }

      handlePurchase(e, pType);
    }
  }, true);

  // Intercept form submits for cart/add
  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form && (form.action.includes('/cart/add') || form.querySelector('[name="add"]'))) {
      handlePurchase(e);
    }
  }, true);

})();
