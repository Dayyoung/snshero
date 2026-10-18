import json, re

data = json.load(open('scripts/canon_synopses.json'))

REQUIRED_KEYWORDS = {
    "은빛 단검": [1, 2, 4, 11, 16],
    "알렉산다르": [1, 2, 4, 10, 11, 23, 24],
    "발리안": [1, 6, 7, 10, 11, 12, 16, 23, 24, 40],
    "이그니스": [1, 6, 7, 8, 9, 10, 11, 12, 14, 16, 17, 18, 19, 20, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 35, 37, 39, 40],
    "실리아": [5, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
}

def expand_sample(ep_num):
    raw_text = data[str(ep_num)]
    paras = [p.strip() for p in raw_text.split('\n\n') if p.strip()]
    header = paras[0]
    scope = paras[1]
    body = paras[2:]
    
    print(f"Ep {ep_num}: {len(body)} body paragraphs")
    
expand_sample(11)
expand_sample(28)
expand_sample(29)
expand_sample(40)
