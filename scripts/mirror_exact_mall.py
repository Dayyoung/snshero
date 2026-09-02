import os
import re
import json
import urllib.parse
import urllib.request
import ssl
from pathlib import Path
from bs4 import BeautifulSoup

MALL_DIR = Path("public/mall")
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
HEADERS = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

PAGES = [
    ("https://shop.snshero.com/", "index.html"),
    ("https://shop.snshero.com/en", "en.html"),
    ("https://shop.snshero.com/products/s-s-heroes-110-card-unique-heroes-deck-collectible-card-game?variant=49548125470858", "products/s-s-heroes-110-card-unique-heroes-deck-collectible-card-game.html"),
    ("https://shop.snshero.com/products/s-s-heroes-%ED%9E%88%EC%96%B4%EB%A1%9C-%EB%A8%B8%EA%B7%B8%EC%BB%B5", "products/s-s-heroes-히어로-머그컵.html"),
    ("https://shop.snshero.com/products/s-s-heroes-%ED%9E%88%EC%96%B4%EB%A1%9C-%ED%8B%B0%EC%85%94%EC%B8%A0", "products/s-s-heroes-히어로-티셔츠.html"),
    ("https://shop.snshero.com/products/s-s-heroes-%EA%B2%8C%EC%9E%84%ED%85%8C%EC%9D%B4%EB%B8%94", "products/s-s-heroes-게임테이블.html"),
    ("https://shop.snshero.com/collections/frontpage", "collections/frontpage.html"),
    ("https://shop.snshero.com/collections/s-s-heroes-%EA%B5%BF%EC%A6%88-%EC%A0%84%EC%B2%B4", "collections/s-s-heroes-굿즈-전체.html"),
    ("https://shop.snshero.com/pages/contact", "pages/contact.html"),
    ("https://shop.snshero.com/pages/data-sharing-opt-out", "pages/data-sharing-opt-out.html")
]

downloaded = set()

def download_asset(url, base_url):
    if not url or url.startswith('data:') or url.startswith('blob:'):
        return url
    if url.startswith('//'):
        full_url = 'https:' + url
    elif url.startswith('/'):
        full_url = 'https://shop.snshero.com' + url
    elif not url.startswith('http'):
        full_url = urllib.parse.urljoin(base_url, url)
    else:
        full_url = url

    parsed = urllib.parse.urlparse(full_url)
    clean_p = parsed.path.lstrip('/')
    if clean_p.startswith('//'):
        clean_p = clean_p[2:]

    target_file = MALL_DIR / clean_p
    target_file.parent.mkdir(parents=True, exist_ok=True)

    if full_url not in downloaded:
        downloaded.add(full_url)
        if not target_file.exists():
            print(f"Downloading asset: {full_url} -> {target_file}")
            try:
                req = urllib.request.Request(full_url, headers=HEADERS)
                with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
                    target_file.write_bytes(resp.read())
            except Exception as e:
                print(f"Failed asset: {full_url}: {e}")

    return f"/mall/{clean_p}"

def process_page(orig_url, out_rel_path):
    print(f"Fetching original page: {orig_url}")
    try:
        req = urllib.request.Request(orig_url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            content = resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error fetching {orig_url}: {e}")
        return

    soup = BeautifulSoup(content, 'html.parser')

    # 1. Process all links (CSS, fonts, favicons)
    for link in soup.find_all('link'):
        href = link.get('href')
        if href:
            rel = link.get('rel') or []
            if isinstance(rel, str):
                rel = [rel]
            as_attr = link.get('as')
            if 'stylesheet' in rel or 'preload' in rel or 'modulepreload' in rel or 'icon' in rel or as_attr in ['style', 'font', 'script', 'image']:
                link['href'] = download_asset(href, orig_url)

    # 2. Process all scripts
    for script in soup.find_all('script'):
        src = script.get('src')
        if src:
            script['src'] = download_asset(src, orig_url)

    # 3. Process all images
    for img in soup.find_all('img'):
        src = img.get('src')
        if src:
            img['src'] = download_asset(src, orig_url)
        srcset = img.get('srcset')
        if srcset:
            parts = []
            for p in srcset.split(','):
                p = p.strip()
                if not p:
                    continue
                tokens = p.split()
                if len(tokens) > 0:
                    local_url = download_asset(tokens[0], orig_url)
                    if len(tokens) > 1:
                        parts.append(f"{local_url} {tokens[1]}")
                    else:
                        parts.append(local_url)
            img['srcset'] = ", ".join(parts)

    # 4. Process importmap
    imap = soup.find('script', {'type': 'importmap'})
    if imap and imap.string:
        try:
            data = json.loads(imap.string)
            new_imports = {}
            for k, u in data.get('imports', {}).items():
                new_imports[k] = download_asset(u, orig_url)
            data['imports'] = new_imports
            imap.string = json.dumps(data, indent=2)
        except Exception as e:
            print(f"Error parsing importmap: {e}")

    # 5. Fix internal links
    for a in soup.find_all('a'):
        href = a.get('href')
        if href:
            if href.startswith('https://shop.snshero.com') or href.startswith('http://shop.snshero.com'):
                href = urllib.parse.urlparse(href).path
            if href.startswith('/') and not href.startswith('/mall'):
                p_clean = href.lstrip('/')
                a['href'] = f"/mall/{p_clean}" if p_clean else "/mall/"

    # 6. Inject mall bridge & top navigation
    bridge = soup.new_tag('script')
    bridge['src'] = '/mall/mall-bridge.js'
    if soup.body:
        soup.body.append(bridge)

    topbar = soup.new_tag('div')
    topbar['id'] = 'snshero-mall-topbar'
    topbar['style'] = 'position:sticky;top:0;z-index:9999999;background:#181515;color:#fdfcfc;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;font-family:monospace;font-size:12px;border-bottom:1px solid rgba(255,255,255,0.2);box-shadow:0 2px 8px rgba(0,0,0,0.3);'
    topbar.append(BeautifulSoup('''
      <div style="display:flex;align-items:center;gap:12px;width:100%;justify-content:space-between;max-width:1400px;margin:0 auto;">
        <a href="/" style="color:#fde047;text-decoration:none;font-weight:bold;display:flex;align-items:center;gap:6px;font-size:13px;">
          <span>←</span> <span>[SNSHERO 게임 홈]</span>
        </a>
        <div style="display:flex;align-items:center;gap:10px;">
          <a href="/mall/" style="color:#ffffff;text-decoration:none;font-weight:bold;margin-right:8px;">[굿즈 몰 홈]</a>
          <a href="/shop" style="color:#67e8f9;text-decoration:none;font-weight:bold;background:rgba(103,232,249,0.15);padding:4px 10px;border-radius:3px;border:1px solid rgba(103,232,249,0.3);">[인게임 상점 / 결제]</a>
        </div>
      </div>
    ''', 'html.parser'))
    if soup.body:
        soup.body.insert(0, topbar)

    # 7. Disable Shopify broken tracking
    out_html = str(soup)
    out_html = out_html.replace('https://shop.snshero.com', '/mall').replace('http://shop.snshero.com', '/mall')

    out_file = MALL_DIR / out_rel_path
    out_file.parent.mkdir(parents=True, exist_ok=True)
    out_file.write_text(out_html, encoding='utf-8')

    # Also save directory index.html if it's a product or collection or page
    if out_rel_path.endswith('.html') and out_rel_path != 'index.html' and out_rel_path != 'en.html':
        dir_path = MALL_DIR / out_rel_path[:-5]
        dir_path.mkdir(parents=True, exist_ok=True)
        (dir_path / 'index.html').write_text(out_html, encoding='utf-8')

    print(f"Saved exact mirrored page: {out_file}")

def main():
    import json
    for orig_url, out_path in PAGES:
        process_page(orig_url, out_path)
    print("Exact mirroring complete!")

if __name__ == '__main__':
    main()
