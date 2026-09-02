import re
from pathlib import Path
from bs4 import BeautifulSoup
from urllib.parse import unquote, urlparse

MALL_DIR = Path("public/mall")

all_files = set()
for p in MALL_DIR.rglob("*"):
    if p.is_file():
        rel = "/" + str(p.relative_to("public"))
        all_files.add(rel)
        if rel.endswith(".html"):
            all_files.add(rel[:-5])
            all_files.add(rel[:-5] + "/")
        if rel.endswith("/index.html"):
            all_files.add(rel[:-11])
            all_files.add(rel[:-11] + "/")

all_files.add("/shop")
all_files.add("/")

def audit_and_repair_links():
    fixed_count = 0
    broken_links = []

    for html_file in MALL_DIR.rglob("*.html"):
        content = html_file.read_text(encoding='utf-8')
        soup = BeautifulSoup(content, 'html.parser')
        is_en = '/en/' in str(html_file) or html_file.name.startswith('en')
        modified = False

        for a in soup.find_all('a', href=True):
            href = a['href'].strip()
            if not href or href.startswith('#') or href.startswith('javascript:') or href.startswith('mailto:') or href.startswith('tel:'):
                continue

            orig_href = href

            # Fix /mall/shop to /shop
            if href in ['/mall/shop', '/mall/en/shop', '/mall/customer_authentication/redirect']:
                href = '/shop'
                a['href'] = '/shop'
                modified = True

            # Fix old shopify external domain
            elif 'shop.snshero.com' in href:
                parsed = urlparse(href)
                href = ('/mall/en' if is_en else '/mall') + parsed.path
                a['href'] = href
                modified = True

            # Fix relative links
            elif href.startswith('/') and not href.startswith('/mall') and not href.startswith('/shop') and href != '/':
                href = ('/mall/en/' if is_en else '/mall/') + href.lstrip('/')
                a['href'] = href
                modified = True

            # Check validity
            clean_path = unquote(urlparse(href).path).rstrip('/')
            clean_slash = clean_path + '/'
            clean_html = clean_path + '.html'
            clean_index = clean_path + '/index.html'

            exists = (clean_path in all_files or 
                      clean_slash in all_files or 
                      clean_html in all_files or 
                      clean_index in all_files)

            if not exists and not href.startswith('http'):
                broken_links.append((str(html_file), href, clean_path))

        if modified:
            html_file.write_text(str(soup), encoding='utf-8')
            fixed_count += 1

    print(f"Repaired files: {fixed_count}")
    print(f"Total remaining broken links: {len(broken_links)}")
    for source, href, clean in broken_links:
        print(f"  [Broken in {source}] {href} -> {clean}")

if __name__ == '__main__':
    audit_and_repair_links()
