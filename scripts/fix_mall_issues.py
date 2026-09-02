import re
import shutil
from pathlib import Path
from bs4 import BeautifulSoup

MALL_DIR = Path("public/mall")

# 1. Create collections/all.html and en/collections/all.html
def create_collections_all():
    frontpage_ko = MALL_DIR / "collections" / "frontpage.html"
    frontpage_en = MALL_DIR / "en" / "collections" / "frontpage.html"

    all_ko = MALL_DIR / "collections" / "all.html"
    all_ko_dir = MALL_DIR / "collections" / "all"
    all_ko_dir.mkdir(parents=True, exist_ok=True)
    all_ko_idx = all_ko_dir / "index.html"

    all_en = MALL_DIR / "en" / "collections" / "all.html"
    all_en_dir = MALL_DIR / "en" / "collections" / "all"
    all_en_dir.mkdir(parents=True, exist_ok=True)
    all_en_idx = all_en_dir / "index.html"

    # Use frontpage or s-s-heroes-굿즈-전체 as source
    source_ko = MALL_DIR / "collections" / "s-s-heroes-굿즈-전체.html"
    if not source_ko.exists():
        source_ko = frontpage_ko

    source_en = MALL_DIR / "en" / "collections" / "s-s-heroes-굿즈-전체.html"
    if not source_en.exists():
        source_en = frontpage_en

    if source_ko.exists():
        content_ko = source_ko.read_text(encoding='utf-8')
        all_ko.write_text(content_ko, encoding='utf-8')
        all_ko_idx.write_text(content_ko, encoding='utf-8')
        print("Created collections/all.html and collections/all/index.html (KO)")

    if source_en.exists():
        content_en = source_en.read_text(encoding='utf-8')
        all_en.write_text(content_en, encoding='utf-8')
        all_en_idx.write_text(content_en, encoding='utf-8')
        print("Created en/collections/all.html and en/collections/all/index.html (EN)")

# 2. Fix Contact Form and Button
def fix_contact_pages():
    for f in MALL_DIR.rglob("*.html"):
        if 'contact' in str(f):
            content = f.read_text(encoding='utf-8')
            is_en = '/en/' in str(f) or f.name.startswith('en')
            btn_text = "Send Message (문의 보내기)" if is_en else "문의 보내기 (Submit)"

            # Replace submit button with stylish button
            pattern = re.compile(r'<button[^>]*class=\"[^\"]*submit-button[^\"]*\"[^>]*>.*?</button>', re.DOTALL)
            new_btn = f'''<button type="submit" class="button submit-button snshero-contact-submit-btn" style="width: 100%; max-width: 240px; min-height: 48px; background: #181515; color: #fde047; border: 1px solid #181515; padding: 14px 28px; font-family: monospace; font-size: 14px; font-weight: bold; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-top: 12px; transition: all 0.2s ease;">
  <span>✉️ {btn_text}</span>
</button>'''
            if pattern.search(content):
                content = pattern.sub(new_btn, content)
                f.write_text(content, encoding='utf-8')
                print(f"Enhanced contact form button in {f}")

# 3. Remove all 'Powered by Shopify' and replace with 'Powered by SNSHero'
def remove_shopify_branding():
    count = 0
    for f in MALL_DIR.rglob("*.html"):
        content = f.read_text(encoding='utf-8')
        original = content

        # Replace Powered by Shopify
        content = re.sub(r'Powered by\s+<a[^>]*>Shopify</a>', 'Powered by SNSHero', content, flags=re.IGNORECASE)
        content = re.sub(r'Powered by Shopify', 'Powered by SNSHero', content, flags=re.IGNORECASE)
        content = re.sub(r'href=\"https?://www\.shopify\.com[^\"]*\"', 'href=\"/mall/\"', content)
        content = re.sub(r', Powered by Shopify', '', content, flags=re.IGNORECASE)
        
        # Meta generator
        content = re.sub(r'<meta\s+name=\"generator\"\s+content=\"Shopify[^\"]*\">', '<meta name="generator" content="SNSHero Revolution">', content, flags=re.IGNORECASE)

        if content != original:
            f.write_text(content, encoding='utf-8')
            count += 1

    print(f"Removed Shopify branding in {count} HTML files")

def main():
    create_collections_all()
    fix_contact_pages()
    remove_shopify_branding()
    print("Static assets preparation complete!")

if __name__ == '__main__':
    main()
