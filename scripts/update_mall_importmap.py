import json
import os
import re
import urllib.parse
import urllib.request
from pathlib import Path
from bs4 import BeautifulSoup

MALL_DIR = Path("public/mall")
HEADERS = {'User-Agent': 'Mozilla/5.0'}

def update_html(file_path):
    print(f"Updating: {file_path}")
    content = file_path.read_text(encoding='utf-8', errors='ignore')
    soup = BeautifulSoup(content, 'html.parser')

    # 1. Update importmap
    imap = soup.find('script', {'type': 'importmap'})
    if imap and imap.string:
        try:
            data = json.loads(imap.string)
            imports = data.get('imports', {})
            new_imports = {}
            for name, url in imports.items():
                parsed = urllib.parse.urlparse(url)
                p = parsed.path
                if p.startswith('//'):
                    p = p[1:]
                if not p.startswith('/mall'):
                    p = f"/mall{p}" if p.startswith('/') else f"/mall/{p}"
                new_imports[name] = p
            data['imports'] = new_imports
            imap.string = json.dumps(data, indent=2)
        except Exception as e:
            print(f"Error parsing importmap in {file_path}: {e}")

    # 2. Update all modulepreload and preload links
    for link in soup.find_all('link'):
        href = link.get('href')
        if href:
            if href.startswith('//shop.snshero.com/'):
                link['href'] = href.replace('//shop.snshero.com/', '/mall/')
            elif href.startswith('https://shop.snshero.com/'):
                link['href'] = href.replace('https://shop.snshero.com/', '/mall/')
            elif href.startswith('http://shop.snshero.com/'):
                link['href'] = href.replace('http://shop.snshero.com/', '/mall/')

    # 3. Update all script src
    for script in soup.find_all('script'):
        src = script.get('src')
        if src:
            if src.startswith('//shop.snshero.com/'):
                script['src'] = src.replace('//shop.snshero.com/', '/mall/')
            elif src.startswith('https://shop.snshero.com/'):
                script['src'] = src.replace('https://shop.snshero.com/', '/mall/')
            elif src.startswith('http://shop.snshero.com/'):
                script['src'] = src.replace('http://shop.snshero.com/', '/mall/')

    # 4. Update all img src & srcset
    for img in soup.find_all('img'):
        src = img.get('src')
        if src:
            if src.startswith('//shop.snshero.com/'):
                img['src'] = src.replace('//shop.snshero.com/', '/mall/')
            elif src.startswith('https://shop.snshero.com/'):
                img['src'] = src.replace('https://shop.snshero.com/', '/mall/')
        srcset = img.get('srcset')
        if srcset:
            img['srcset'] = srcset.replace('//shop.snshero.com/', '/mall/').replace('https://shop.snshero.com/', '/mall/')

    # 5. Disable Shopify broken remote analytics
    final_html = str(soup)
    final_html = re.sub(r'https?://shop\.snshero\.com/cdn/', '/mall/cdn/', final_html)
    final_html = re.sub(r'//shop\.snshero\.com/cdn/', '/mall/cdn/', final_html)

    file_path.write_text(final_html, encoding='utf-8')

def main():
    for f in MALL_DIR.rglob("*.html"):
        update_html(f)
    print("All mall HTML files successfully updated with local importmap and asset paths!")

if __name__ == '__main__':
    main()
