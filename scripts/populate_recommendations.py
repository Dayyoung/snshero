import re
from pathlib import Path
from bs4 import BeautifulSoup

MALL_DIR = Path("public/mall")

PRODUCTS_KO = [
    {
        "id": "deck",
        "title": "1. S&S Heroes 컬렉터블 카드 게임 - 110장 유니크 히어로",
        "price": "$30.00",
        "url": "/mall/products/s-s-heroes-110-card-unique-heroes-deck-collectible-card-game",
        "img": "/mall/cdn/shop/files/card.png"
    },
    {
        "id": "table",
        "title": "2. S&S Heroes 게임테이블",
        "price": "$30.00",
        "url": "/mall/products/s-s-heroes-게임테이블",
        "img": "/mall/cdn/shop/files/pan.png"
    },
    {
        "id": "mug",
        "title": "3. S&S Heroes 히어로 머그컵",
        "price": "$10.00",
        "url": "/mall/products/s-s-heroes-히어로-머그컵",
        "img": "/mall/cdn/shop/files/1.png"
    },
    {
        "id": "tshirt",
        "title": "4. S&S Heroes 히어로 티셔츠",
        "price": "$30.00",
        "url": "/mall/products/s-s-heroes-히어로-티셔츠",
        "img": "/mall/cdn/shop/files/2.png"
    }
]

PRODUCTS_EN = [
    {
        "id": "deck",
        "title": "1. S&S Heroes Collectible Card Game - 110 Unique Heroes",
        "price": "$30.00",
        "url": "/mall/en/products/s-s-heroes-110-card-unique-heroes-deck-collectible-card-game",
        "img": "/mall/cdn/shop/files/card.png"
    },
    {
        "id": "table",
        "title": "2. S&S Heroes Game Table",
        "price": "$30.00",
        "url": "/mall/en/products/s-s-heroes-게임테이블",
        "img": "/mall/cdn/shop/files/pan.png"
    },
    {
        "id": "mug",
        "title": "3. S&S Heroes Hero Mug",
        "price": "$10.00",
        "url": "/mall/en/products/s-s-heroes-히어로-머그컵",
        "img": "/mall/cdn/shop/files/1.png"
    },
    {
        "id": "tshirt",
        "title": "4. S&S Heroes Hero T-shirt",
        "price": "$30.00",
        "url": "/mall/en/products/s-s-heroes-히어로-티셔츠",
        "img": "/mall/cdn/shop/files/2.png"
    }
]

def generate_recommendations_html(current_id, is_en=False):
    products = PRODUCTS_EN if is_en else PRODUCTS_KO
    other_products = [p for p in products if p["id"] != current_id]

    items_html = ""
    for p in other_products:
        items_html += f'''
        <div class="resource-list__item" style="display: flex; flex-direction: column; background: var(--color-background, #fff); border: 1px solid var(--color-border, #e5e7eb); border-radius: 4px; overflow: hidden; transition: transform 0.2s ease, box-shadow 0.2s ease;">
          <a href="{p['url']}" style="display: block; text-decoration: none; color: inherit; position: relative;">
            <div style="aspect-ratio: 1; width: 100%; overflow: hidden; background: #f9fafb; display: flex; align-items: center; justify-content: center;">
              <img src="{p['img']}" alt="{p['title']}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" />
            </div>
            <div style="padding: 14px 16px; display: flex; flex-direction: column; gap: 6px;">
              <h4 style="margin: 0; font-size: 14px; font-weight: 600; line-height: 1.4; color: var(--color-foreground, #111827); overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                {p['title']}
              </h4>
              <div style="font-size: 15px; font-weight: 700; color: var(--color-foreground, #111827); margin-top: 4px;">
                {p['price']}
              </div>
            </div>
          </a>
        </div>
        '''

    title_text = "You may also like" if is_en else "추천 상품 (You may also like)"

    rec_html = f'''
    <div class="section-background color-scheme-1"></div>
    <div class="section section--page-width color-scheme-1 section-resource-list spacing-style gap-style" style="--padding-block-start: 40px; --padding-block-end: 48px;">
      <div class="section-resource-list__content" style="margin-bottom: 24px;">
        <div class="spacing-style text-block h4">
          <h3 style="font-size: 20px; font-weight: 700; margin: 0; color: var(--color-foreground, #111827);">{title_text}</h3>
        </div>
      </div>
      <div class="resource-list" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; width: 100%;">
        {items_html}
      </div>
    </div>
    '''
    return rec_html

def patch_product_page(html_file):
    content = html_file.read_text(encoding='utf-8')
    is_en = '/en/' in str(html_file) or html_file.name.startswith('en')

    # Determine current product id
    filename = html_file.name
    path_str = str(html_file)
    if 'deck' in path_str or '110-card' in path_str:
        current_id = 'deck'
    elif '머그컵' in path_str or 'mug' in path_str:
        current_id = 'mug'
    elif '티셔츠' in path_str or 't-shirt' in path_str:
        current_id = 'tshirt'
    elif '게임테이블' in path_str or 'table' in path_str:
        current_id = 'table'
    else:
        return

    soup = BeautifulSoup(content, 'html.parser')
    rec_elem = soup.find('product-recommendations')
    if rec_elem:
        new_content = BeautifulSoup(generate_recommendations_html(current_id, is_en), 'html.parser')
        rec_elem.clear()
        for child in new_content.children:
            rec_elem.append(child)
        rec_elem['data-recommendations-performed'] = 'true'

        html_file.write_text(str(soup), encoding='utf-8')
        print(f"Injected recommendation products into {html_file} ({current_id}, en={is_en})")

def main():
    for f in MALL_DIR.rglob("*.html"):
        if 'products' in str(f):
            patch_product_page(f)
    print("All product recommendations populated!")

if __name__ == '__main__':
    main()
