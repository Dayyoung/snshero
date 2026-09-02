import os
import re
from pathlib import Path
from bs4 import BeautifulSoup

MALL_DIR = Path("public/mall")

def clean_html(file_path):
    content = file_path.read_text(encoding='utf-8', errors='ignore')
    soup = BeautifulSoup(content, 'html.parser')

    # 1. Remove broken analytics and trackers
    for script in soup.find_all('script'):
        text = script.string or ''
        src = script.get('src') or ''
        
        # Remove trekkie, monorail, wpmLoader, shopify-cfh, web-pixels
        if 'wpmLoader' in text or 'monorail-edge' in text or 'sendBeacon' in text or '__TREKKIE_SHIM_QUEUE' in text or 'ShopifyAnalytics' in text or 'trekkie' in src or 'web-pixels-manager' in src:
            script.decompose()

    # 2. Remove broken meta and link tags
    for link in soup.find_all('link'):
        href = link.get('href') or ''
        if 'monorail-edge' in href or href.endswith('.oembed'):
            link.decompose()

    # 3. Save cleaned HTML
    final_html = str(soup)
    file_path.write_text(final_html, encoding='utf-8')

def main():
    for f in MALL_DIR.rglob("*.html"):
        clean_html(f)
    print("All mall HTML files cleaned of tracking scripts and 404 sources!")

if __name__ == '__main__':
    main()
