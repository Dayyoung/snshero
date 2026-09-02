import os
import re
import urllib.parse
import urllib.request
import ssl
from pathlib import Path
from bs4 import BeautifulSoup

BASE_URL = "https://shop.snshero.com"
OUTPUT_DIR = Path("public/mall")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

PAGES_TO_FETCH = [
    "/",
    "/collections/frontpage",
    "/collections/s-s-heroes-%EA%B5%BF%EC%A6%88-%EC%A0%84%EC%B2%B4",
    "/products/s-s-heroes-110-card-unique-heroes-deck-collectible-card-game",
    "/products/s-s-heroes-%ED%9E%88%EC%96%B4%EB%A1%9C-%EB%A8%B8%EA%B7%B8%EC%BB%B5",
    "/products/s-s-heroes-%ED%9E%88%EC%96%B4%EB%A1%9C-%ED%8B%B0%EC%85%94%EC%B8%A0",
    "/products/s-s-heroes-%EA%B2%8C%EC%9E%84%ED%85%8C%EC%9D%B4%EB%B8%94",
    "/pages/contact",
    "/pages/data-sharing-opt-out",
    # EN paths
    "/en",
    "/en/collections/frontpage",
    "/en/collections/s-s-heroes-%EA%B5%BF%EC%A6%88-%EC%A0%84%EC%B2%B4",
    "/en/products/s-s-heroes-110-card-unique-heroes-deck-collectible-card-game",
    "/en/products/s-s-heroes-%ED%9E%88%EC%96%B4%EB%A1%9C-%EB%A8%B8%EA%B7%B8%EC%BB%B5",
    "/en/products/s-s-heroes-%ED%9E%88%EC%96%B4%EB%A1%9C-%ED%8B%B0%EC%85%94%EC%B8%A0",
    "/en/products/s-s-heroes-%EA%B2%8C%EC%9E%84%ED%85%8C%EC%9D%B4%EB%B8%94",
    "/en/pages/contact",
    "/en/pages/data-sharing-opt-out"
]

downloaded_assets = set()

def fetch_url(url):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            return resp.read(), resp.getheader('Content-Type', '')
    except Exception as e:
        print(f"[Error fetching] {url}: {e}")
        return None, None

def sanitize_asset_path(url):
    parsed = urllib.parse.urlparse(url)
    path = parsed.path
    if path.startswith("//"):
        path = path[1:]
    if path.startswith("/"):
        path = path[1:]
    return path

def download_asset(asset_url, base_page_url):
    if asset_url.startswith("//"):
        asset_url = "https:" + asset_url
    elif asset_url.startswith("/"):
        asset_url = urllib.parse.urljoin(BASE_URL, asset_url)
    elif not asset_url.startswith("http"):
        asset_url = urllib.parse.urljoin(base_page_url, asset_url)

    if asset_url.startswith("data:") or asset_url.startswith("blob:") or not asset_url:
        return asset_url

    local_rel_path = sanitize_asset_path(asset_url)
    local_file_path = OUTPUT_DIR / local_rel_path

    if asset_url not in downloaded_assets:
        downloaded_assets.add(asset_url)
        local_file_path.parent.mkdir(parents=True, exist_ok=True)
        if not local_file_path.exists():
            print(f"Downloading asset: {asset_url} -> {local_file_path}")
            data, ctype = fetch_url(asset_url)
            if data:
                if local_file_path.suffix == '.css' or 'css' in (ctype or ''):
                    css_content = data.decode('utf-8', errors='ignore')
                    def replace_css_url(match):
                        sub_url = match.group(1).strip("'\"")
                        if sub_url.startswith('data:') or not sub_url:
                            return match.group(0)
                        sub_full = urllib.parse.urljoin(asset_url, sub_url)
                        sub_local = download_asset(sub_full, asset_url)
                        return f"url('/mall/{sub_local}')"

                    new_css = re.sub(r'url\((.*?)\)', replace_css_url, css_content)
                    local_file_path.write_text(new_css, encoding='utf-8')
                else:
                    local_file_path.write_bytes(data)

    return local_rel_path

def process_html(html_bytes, page_path):
    soup = BeautifulSoup(html_bytes, 'html.parser')
    current_page_url = urllib.parse.urljoin(BASE_URL, page_path)

    # 1. Download & replace Stylesheets / Links
    for link in soup.find_all('link'):
        href = link.get('href')
        if href and (link.get('rel') == ['stylesheet'] or 'stylesheet' in (link.get('rel') or []) or link.get('as') in ['style', 'font', 'image', 'script']):
            local_path = download_asset(href, current_page_url)
            link['href'] = f"/mall/{local_path}"

    # 2. Download & replace Scripts
    for script in soup.find_all('script'):
        src = script.get('src')
        if src:
            local_path = download_asset(src, current_page_url)
            script['src'] = f"/mall/{local_path}"

    # 3. Download & replace Images
    for img in soup.find_all('img'):
        src = img.get('src')
        if src:
            local_path = download_asset(src, current_page_url)
            img['src'] = f"/mall/{local_path}"
        srcset = img.get('srcset')
        if srcset:
            new_srcset_parts = []
            for part in srcset.split(','):
                part = part.strip()
                if not part:
                    continue
                tokens = part.split()
                img_url = tokens[0]
                local_path = download_asset(img_url, current_page_url)
                if len(tokens) > 1:
                    new_srcset_parts.append(f"/mall/{local_path} {tokens[1]}")
                else:
                    new_srcset_parts.append(f"/mall/{local_path}")
            img['srcset'] = ", ".join(new_srcset_parts)

    # 4. Download & replace Source (picture tags)
    for source in soup.find_all('source'):
        src = source.get('src')
        if src:
            local_path = download_asset(src, current_page_url)
            source['src'] = f"/mall/{local_path}"
        srcset = source.get('srcset')
        if srcset:
            new_srcset_parts = []
            for part in srcset.split(','):
                part = part.strip()
                if not part:
                    continue
                tokens = part.split()
                img_url = tokens[0]
                local_path = download_asset(img_url, current_page_url)
                if len(tokens) > 1:
                    new_srcset_parts.append(f"/mall/{local_path} {tokens[1]}")
                else:
                    new_srcset_parts.append(f"/mall/{local_path}")
            source['srcset'] = ", ".join(new_srcset_parts)

    # 5. Fix internal <a> links
    for a in soup.find_all('a'):
        href = a.get('href')
        if href:
            if href.startswith("https://shop.snshero.com") or href.startswith("http://shop.snshero.com"):
                href = urllib.parse.urlparse(href).path or "/"
            if href.startswith("/"):
                if not href.startswith("/mall"):
                    clean_path = href.lstrip("/")
                    if not clean_path:
                        a['href'] = "/mall/"
                    else:
                        a['href'] = f"/mall/{clean_path}"

    # 6. Inject Mall Bridge Script for '구매하기' / 'Add to cart' / 'Buy it now'
    bridge_script = soup.new_tag('script')
    bridge_script['src'] = "/mall/mall-bridge.js"
    if soup.body:
        soup.body.append(bridge_script)
    elif soup.head:
        soup.head.append(bridge_script)

    # 7. Add top home navigation banner
    top_nav = soup.new_tag('div')
    top_nav['id'] = 'snshero-mall-topbar'
    top_nav['style'] = 'position:sticky;top:0;z-index:999999;background:#1e1b1b;color:#fdfcfc;padding:8px 16px;display:flex;align-items:center;justify-content:between;font-family:monospace;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.15);'
    top_nav.append(BeautifulSoup('''
      <div style="display:flex;align-items:center;gap:12px;width:100%;justify-content:space-between;">
        <a href="/" style="color:#fde047;text-decoration:none;font-weight:bold;display:flex;align-items:center;gap:6px;">
          <span>←</span> <span>[SNSHERO 게임으로 돌아가기]</span>
        </a>
        <div style="display:flex;align-items:center;gap:12px;">
          <a href="/shop" style="color:#67e8f9;text-decoration:none;font-weight:bold;">[인게임 상점 / 결제]</a>
        </div>
      </div>
    ''', 'html.parser'))
    if soup.body:
        soup.body.insert(0, top_nav)

    return str(soup)

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print("Starting download of shop.snshero.com to public/mall ...")

    # Save bridge script
    bridge_js_path = OUTPUT_DIR / "mall-bridge.js"
    bridge_code = """
(function() {
  console.log("[SNSHero Mall Bridge] Initialized");

  function getProductTypeFromPage() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes("mug") || path.includes("%eb%a8%b8%ea%b7%b8%ec%bb%b5") || path.includes("머그컵")) return "mug";
    if (path.includes("tshirt") || path.includes("t-shirt") || path.includes("%ed%8b%b0%ec%85%94%ec%b8%a0") || path.includes("티셔츠")) return "tshirt";
    if (path.includes("table") || path.includes("%ea%b2%8c%ec%9e%84%ed%85%8c%ec%9d%b4%eb%b8%94") || path.includes("게임테이블")) return "table";
    if (path.includes("deck") || path.includes("110-card")) return "deck";
    
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
    
    let qty = 1;
    const qtyInput = document.querySelector('input[name="quantity"]') || document.querySelector('.quantity__input');
    if (qtyInput && qtyInput.value) {
      const parsed = parseInt(qtyInput.value, 10);
      if (!isNaN(parsed) && parsed > 0) qty = parsed;
    }

    let size = 'M';
    const sizeSelect = document.querySelector('select[name="Size"]') || document.querySelector('input[name="Size"]:checked');
    if (sizeSelect && sizeSelect.value) {
      size = sizeSelect.value;
    }

    console.log(`[SNSHero Mall] Directing to /shop with: item=${productType}, qty=${qty}, size=${size}`);

    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'SNSHERO_MALL_BUY',
        goodsType: productType,
        quantity: qty,
        size: size
      }, '*');
      return;
    }

    window.location.href = `/shop?goods=${encodeURIComponent(productType)}&qty=${qty}&size=${encodeURIComponent(size)}`;
  }

  document.addEventListener('click', function(e) {
    const target = e.target.closest('button, a, input[type="submit"]');
    if (!target) return;

    const text = (target.innerText || target.value || target.getAttribute('name') || target.className || '').toLowerCase();
    const isBuyButton = text.includes('buy') || text.includes('구매') || text.includes('cart') || text.includes('담기') || text.includes('결제') || text.includes('order') || target.getAttribute('name') === 'add';

    if (isBuyButton) {
      const productCard = target.closest('[data-product-handle], .card-wrapper, .product-card');
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

  document.addEventListener('submit', function(e) {
    const form = e.target;
    if (form && (form.action.includes('/cart/add') || form.querySelector('[name="add"]'))) {
      handlePurchase(e);
    }
  }, true);

})();
"""
    bridge_js_path.write_text(bridge_code, encoding='utf-8')

    for page_path in PAGES_TO_FETCH:
        full_url = urllib.parse.urljoin(BASE_URL, page_path)
        print(f"Fetching page: {full_url}")
        html_data, _ = fetch_url(full_url)
        if not html_data:
            continue

        processed_html = process_html(html_data, page_path)

        clean_path = page_path.strip("/")
        if not clean_path:
            out_file = OUTPUT_DIR / "index.html"
            out_file.parent.mkdir(parents=True, exist_ok=True)
            out_file.write_text(processed_html, encoding='utf-8')
        else:
            unquoted_path = urllib.parse.unquote(clean_path)
            out_file = OUTPUT_DIR / f"{unquoted_path}.html"
            out_file.parent.mkdir(parents=True, exist_ok=True)
            out_file.write_text(processed_html, encoding='utf-8')

            out_file_dir = OUTPUT_DIR / unquoted_path
            out_file_dir.mkdir(parents=True, exist_ok=True)
            (out_file_dir / "index.html").write_text(processed_html, encoding='utf-8')

        print(f"Saved: {out_file}")

    print("Mall mirroring completed successfully!")

if __name__ == '__main__':
    main()
