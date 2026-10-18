import json, os, re

data = json.load(open('scripts/canon_synopses.json'))

# Let's inspect the canonical paragraphs for Ep 12
paras = [p.strip() for p in data['12'].split('\n\n') if p.strip()]
print(f"Ep 12 raw length: {len(data['12'])}, paragraphs: {len(paras)}")
for i, p in enumerate(paras[:6]):
    print(f"[{i:02d}] {p}")
