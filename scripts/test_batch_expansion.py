import json, re

data = json.load(open('scripts/canon_synopses.json'))

# Let's inspect how an intelligent expander can expand Ep 11 paragraphs
ep11_text = data['11']
paras = [p.strip() for p in ep11_text.split('\n\n') if p.strip()]

print(f"Raw Ep 11 length: {len(ep11_text)}, {len(paras)} paras")
