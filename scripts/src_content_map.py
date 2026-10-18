# -*- coding: utf-8 -*-
"""
scripts/src_content_map.py
Parses src/content/englishNovelMapping.ts to provide filename lookup for English episodes.
"""
import re, os

MAPPING_FILE = os.path.join(os.path.dirname(__file__), "..", "src", "content", "englishNovelMapping.ts")

with open(MAPPING_FILE, "r", encoding="utf-8") as f:
    _content = f.read()

_mapping = {}
for m in re.finditer(r'(\d+):\s*\{\s*fileName:\s*"([^"]+)"', _content):
    ep = int(m.group(1))
    fname = m.group(2)
    _mapping[ep] = fname

def get_en_filename(ep_num: int) -> str:
    return _mapping.get(ep_num, f"SNSHero_Novel_Episode_{ep_num:02d}_EN.txt")

if __name__ == "__main__":
    print(f"Loaded {len(_mapping)} English file mappings.")
    for i in range(1, 41):
        print(f"Ep {i:02d} -> {get_en_filename(i)}")
