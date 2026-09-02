import os
import re
from pathlib import Path
from bs4 import BeautifulSoup

MALL_DIR = Path("public/mall")

def fix_html_file(file_path):
    print(f"Post-processing: {file_path}")
    content = file_path.read_text(encoding='utf-8', errors='ignore')

    # Replace all occurrences of https://shop.snshero.com/ or http://shop.snshero.com/ or //shop.snshero.com/
    content = re.sub(r'https?://shop\.snshero\.com/cdn/', '/mall/cdn/', content)
    content = re.sub(r'//shop\.snshero\.com/cdn/', '/mall/cdn/', content)
    content = re.sub(r'https?://cdn\.shopify\.com/shopifycloud/', '/mall/shopifycloud/', content)
    content = re.sub(r'//cdn\.shopify\.com/shopifycloud/', '/mall/shopifycloud/', content)
    content = re.sub(r'https?://cdn\.shopify\.com/storefront/', '/mall/storefront/', content)
    content = re.sub(r'//cdn\.shopify\.com/storefront/', '/mall/storefront/', content)
    content = re.sub(r'https?://cdn\.shopify\.com/s/files/', '/mall/cdn/shop/files/', content)
    content = re.sub(r'//cdn\.shopify\.com/s/files/', '/mall/cdn/shop/files/', content)

    # Replace relative internal shopify links
    content = re.sub(r'href="https?://shop\.snshero\.com/([^"]*)"', r'href="/mall/\1"', content)
    content = re.sub(r'href="//shop\.snshero\.com/([^"]*)"', r'href="/mall/\1"', content)

    # Disable annoying shopify tracking beacons that cause CORS errors in console
    content = content.replace('window.ShopifyAnalytics', 'window._ShopifyAnalytics_disabled')
    content = content.replace('window.Shopify = window.Shopify || {};', 'window.Shopify = window.Shopify || { routes: { root: "/mall/" } };')

    file_path.write_text(content, encoding='utf-8')

def main():
    html_files = list(MALL_DIR.rglob("*.html"))
    print(f"Total HTML files to refine: {len(html_files)}")
    for hf in html_files:
        fix_html_file(hf)
    print("All HTML files refined successfully!")

if __name__ == '__main__':
    main()
