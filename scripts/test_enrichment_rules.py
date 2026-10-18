import json, re

# Let's write an enrichment function for canonical paragraphs
def enrich_canonical_text(ep_num, canon_text, req_keywords):
    raw_paras = [p.strip() for p in canon_text.split('\n\n') if p.strip()]
    header = raw_paras[0]
    scope = raw_paras[1] if len(raw_paras) > 1 and raw_paras[1].startswith('>') else ""
    body = [p for p in raw_paras if not p.startswith('#') and not p.startswith('>')]
    
    # We will expand each paragraph of body
    # Let's see how many body paragraphs we have
    return header, scope, body

data = json.load(open('scripts/canon_synopses.json'))
h, s, b = enrich_canonical_text(11, data['11'], ["은빛 단검", "알렉산다르", "발리안", "이그니스", "실리아"])
print(f"Header: {h}, Scope: {s}, Body count: {len(b)}")
