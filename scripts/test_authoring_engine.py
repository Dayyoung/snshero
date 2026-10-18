import json, re

# Let's inspect Ep 11 paragraphs from canon_synopses.json
data = json.load(open('scripts/canon_synopses.json'))
ep11_paras = [p.strip() for p in data['11'].split('\n\n') if p.strip()]
print(f"Ep 11 has {len(ep11_paras)} paragraphs:")
for i, p in enumerate(ep11_paras[:8]):
    print(f"[{i:02d}] {p[:80]}...")
