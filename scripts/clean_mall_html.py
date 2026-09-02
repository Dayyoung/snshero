import os
import re
from pathlib import Path

MALL_DIR = Path("public/mall")

def clean_file(fpath):
    content = fpath.read_text(encoding='utf-8', errors='ignore')

    # Remove or disable Shopify tracking beacons that fail in local static mode
    content = re.sub(r'wpmLoader\(\{.*?\}\);\}\)\(\);</script>', '/* wpm disabled */})();</script>', content, flags=re.DOTALL)
    content = re.sub(r'<script[^>]*data-application="storefront-renderer"[^>]*>.*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'<shopify-store[^>]*store-domain="https?://shop\.snshero\.com"[^>]*></shopify-store>', '<div class="snshero-mall-store"></div>', content)

    # Replace any remaining absolute URLs
    content = content.replace("https://shop.snshero.com", "/mall")
    content = content.replace("http://shop.snshero.com", "/mall")
    content = content.replace("//shop.snshero.com", "/mall")
    content = content.replace("https:\\/\\/shop.snshero.com", "\\/mall")
    content = content.replace("http:\\/\\/shop.snshero.com", "\\/mall")
    content = content.replace("\\/\\/shop.snshero.com", "\\/mall")

    fpath.write_text(content, encoding='utf-8')

def main():
    for f in MALL_DIR.rglob("*.html"):
        clean_file(f)
    print("Cleaned all public/mall HTML files!")

if __name__ == '__main__':
    main()
