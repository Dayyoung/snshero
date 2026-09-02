import re
from pathlib import Path
from bs4 import BeautifulSoup

MALL_DIR = Path("public/mall")

def replace_checkout_buttons_in_html(html_file):
    content = html_file.read_text(encoding='utf-8')
    is_en = '/en/' in str(html_file) or html_file.name.startswith('en')
    btn_label = "💳 Checkout / Buy Now" if is_en else "💳 결제하기 (Checkout)"

    # Replace <div class="accelerated-checkout-block"...>...</div> with our custom direct checkout button
    checkout_html = f'''
    <div class="accelerated-checkout-block" ref="acceleratedCheckoutButtonContainer" style="margin-top: 8px;">
      <button type="button" class="snshero-custom-checkout-btn button" style="width: 100%; min-height: 48px; background: #181515; color: #fde047; border: 1px solid #181515; padding: 14px 20px; font-family: monospace; font-size: 14px; font-weight: bold; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.2s ease;">
        <span>{btn_label}</span>
      </button>
    </div>
    '''

    # Pattern for accelerated checkout block
    pattern = re.compile(r'<div class="accelerated-checkout-block"[^>]*>.*?</div>\s*</div>', re.DOTALL)
    if pattern.search(content):
        content = pattern.sub(f'{checkout_html}\n</div>', content)
        html_file.write_text(content, encoding='utf-8')
        print(f"Replaced checkout button in {html_file}")
    else:
        # Check for shopify-accelerated-checkout directly
        pattern2 = re.compile(r'<shopify-accelerated-checkout[^>]*>.*?</shopify-accelerated-checkout>', re.DOTALL)
        if pattern2.search(content):
            content = pattern2.sub(f'<button type="button" class="snshero-custom-checkout-btn button" style="width: 100%; min-height: 48px; background: #181515; color: #fde047; border: 1px solid #181515; padding: 14px 20px; font-family: monospace; font-size: 14px; font-weight: bold; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">{btn_label}</button>', content)
            html_file.write_text(content, encoding='utf-8')
            print(f"Replaced shopify-accelerated-checkout in {html_file}")

def main():
    for f in MALL_DIR.rglob("*.html"):
        if 'products' in str(f):
            replace_checkout_buttons_in_html(f)
    print("All product HTML checkout buttons updated!")

if __name__ == '__main__':
    main()
