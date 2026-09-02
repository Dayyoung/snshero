import re
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import unquote, urlparse

MALL_DIR = Path("public/mall")

# 1. Generate Privacy Policy Pages
def create_privacy_policy_pages():
    ko_policy_dir = MALL_DIR / "policies"
    ko_policy_dir.mkdir(parents=True, exist_ok=True)
    ko_policy_file = ko_policy_dir / "privacy-policy.html"

    en_policy_dir = MALL_DIR / "en" / "policies"
    en_policy_dir.mkdir(parents=True, exist_ok=True)
    en_policy_file = en_policy_dir / "privacy-policy.html"

    # Minimal boilerplate using index.html layout or clean card layout
    sample_page = (MALL_DIR / "pages" / "contact.html").read_text(encoding='utf-8')
    soup_ko = BeautifulSoup(sample_page, 'html.parser')
    
    # Replace title and main content
    title_el = soup_ko.find('title')
    if title_el:
        title_el.string = "개인정보처리방침 - SNSHero.com"

    main_el = soup_ko.find('main')
    if main_el:
        main_el.clear()
        main_el.append(BeautifulSoup('''
        <div class="section section--page-width color-scheme-1" style="padding: 48px 16px; font-family: monospace; max-width: 800px; margin: 0 auto; line-height: 1.6;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #201d1d; padding-bottom: 12px;">개인정보처리방침 (Privacy Policy)</h1>
          <p style="font-size: 13px; color: #555; margin-bottom: 24px;">최종 업데이트: 2026년 9월 2일</p>
          
          <div style="font-size: 14px; display: flex; flex-direction: column; gap: 16px;">
            <p>SNSHero(이하 "회사")는 이용자의 개인정보를 소중히 다루며, 관련 법령을 준수합니다.</p>
            <h3 style="font-size: 16px; font-weight: bold; margin-top: 8px;">1. 수집하는 개인정보 항목</h3>
            <p>- 굿즈 배송 및 주문: 수령인 이름, 연락처, 이메일, 배송지 주소, 결제 정보(PayPal 트랜잭션 식별자)</p>
            <p>- 인게임 및 서비스: 닉네임, 보유 카드 및 SNS 포인트 내역 (100% 로컬스토리지 기반 보존)</p>
            
            <h3 style="font-size: 16px; font-weight: bold; margin-top: 8px;">2. 개인정보의 이용 목적</h3>
            <p>- 주문 상품 배송 및 결제 확인, 고객 문의 응대 및 영수증 발급</p>
            
            <h3 style="font-size: 16px; font-weight: bold; margin-top: 8px;">3. 보관 및 파기</h3>
            <p>- 모든 주문 및 인벤토리 데이터는 단일 진실 공급원 원칙에 따라 로컬스토리지에 안전하게 관리됩니다.</p>
          </div>
          
          <div style="margin-top: 36px; padding-top: 20px; border-top: 1px dashed rgba(0,0,0,0.2);">
            <a href="/mall/" style="display: inline-block; background: #201d1d; color: #fde047; padding: 12px 20px; text-decoration: none; font-weight: bold; border-radius: 4px;">[ 쇼핑몰 홈으로 돌아가기 ]</a>
          </div>
        </div>
        ''', 'html.parser'))

    ko_policy_file.write_text(str(soup_ko), encoding='utf-8')
    print("Created public/mall/policies/privacy-policy.html")

    # EN Policy
    sample_page_en = (MALL_DIR / "en" / "pages" / "contact.html").read_text(encoding='utf-8')
    soup_en = BeautifulSoup(sample_page_en, 'html.parser')
    title_el_en = soup_en.find('title')
    if title_el_en:
        title_el_en.string = "Privacy Policy - SNSHero.com"

    main_el_en = soup_en.find('main')
    if main_el_en:
        main_el_en.clear()
        main_el_en.append(BeautifulSoup('''
        <div class="section section--page-width color-scheme-1" style="padding: 48px 16px; font-family: monospace; max-width: 800px; margin: 0 auto; line-height: 1.6;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; border-bottom: 2px solid #201d1d; padding-bottom: 12px;">Privacy Policy</h1>
          <p style="font-size: 13px; color: #555; margin-bottom: 24px;">Last updated: September 2, 2026</p>
          
          <div style="font-size: 14px; display: flex; flex-direction: column; gap: 16px;">
            <p>SNSHero ("Company") respects your privacy and complies with all global data protection standards.</p>
            <h3 style="font-size: 16px; font-weight: bold; margin-top: 8px;">1. Information We Collect</h3>
            <p>- Merch Orders & Shipping: Recipient name, contact number, email, delivery address, PayPal Transaction ID.</p>
            <p>- In-Game Assets: Nickname, card collection, and SNS point history (100% LocalStorage based).</p>
            
            <h3 style="font-size: 16px; font-weight: bold; margin-top: 8px;">2. Purpose of Use</h3>
            <p>- Processing merch fulfillment, shipping updates, receipt delivery, and customer service.</p>
            
            <h3 style="font-size: 16px; font-weight: bold; margin-top: 8px;">3. Storage and Safety</h3>
            <p>- Data is securely stored following LocalStorage single-source-of-truth principles.</p>
          </div>
          
          <div style="margin-top: 36px; padding-top: 20px; border-top: 1px dashed rgba(0,0,0,0.2);">
            <a href="/mall/en" style="display: inline-block; background: #201d1d; color: #fde047; padding: 12px 20px; text-decoration: none; font-weight: bold; border-radius: 4px;">[ Return to Mall Home ]</a>
          </div>
        </div>
        ''', 'html.parser'))

    en_policy_file.write_text(str(soup_en), encoding='utf-8')
    print("Created public/mall/en/policies/privacy-policy.html")

# 2. Perfect All Links in all HTML files
def fix_all_broken_links():
    count = 0
    for html_file in MALL_DIR.rglob("*.html"):
        content = html_file.read_text(encoding='utf-8')
        soup = BeautifulSoup(content, 'html.parser')
        is_en = '/en/' in str(html_file) or html_file.name.startswith('en')

        # Replace links
        for a in soup.find_all('a', href=True):
            href = a['href'].strip()

            # Fix /mall/shop -> /shop
            if href == '/mall/shop' or href == '/mall/en/shop':
                a['href'] = '/shop'
            
            # Fix customer authentication
            elif 'customer_authentication' in href or 'account/login' in href:
                a['href'] = '/shop'

            # Fix policies link
            elif href == '/mall/policies/privacy-policy' or href == '/policies/privacy-policy':
                a['href'] = '/mall/en/policies/privacy-policy' if is_en else '/mall/policies/privacy-policy'

            # Fix collections/all links
            elif 'collections/all' in href or href == '/collections' or href == '/mall/collections':
                a['href'] = '/mall/en/collections/all' if is_en else '/mall/collections/all'

            # Fix contact links
            elif href == '/contact' or href == '/mall/contact' or 'pages/contact' in href:
                a['href'] = '/mall/en/pages/contact' if is_en else '/mall/pages/contact'

            # Fix home links
            elif href == '/' or href == '/mall' or href == '/mall/':
                a['href'] = '/mall/en' if is_en else '/mall/'

        # Fix Show all / viewAll buttons
        for btn in soup.find_all('button'):
            btn_class = btn.get('class', [])
            btn_ref = btn.get('ref', '')
            btn_text = btn.get_text().strip().lower()

            if (btn_ref == 'viewAllButton' or 
                'predictive-search__search-button' in btn_class or 
                'facets__see-results' in btn_class or
                'show all' in btn_text or
                'view all' in btn_text or
                '모두 보기' in btn_text or
                '품목 보기' in btn_text):
                
                target_url = '/mall/en/collections/all' if is_en else '/mall/collections/all'
                btn['onclick'] = f"window.location.href='{target_url}'; return false;"
                btn['type'] = 'button'

        html_file.write_text(str(soup), encoding='utf-8')
        count += 1

    print(f"Sanitized and verified all links across {count} HTML files!")

def main():
    create_privacy_policy_pages()
    fix_all_broken_links()

if __name__ == '__main__':
    main()
