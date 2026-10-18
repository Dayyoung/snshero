import json, re

# Let's inspect all paragraphs of Ep 7
data = json.load(open('scripts/canon_synopses.json'))
ep7_text = data['7']
paras = [p.strip() for p in ep7_text.split('\n\n') if p.strip()]
print(f"Total paragraphs in Ep 7: {len(paras)}")
for i, p in enumerate(paras):
    print(f"[{i:02d}] ({len(p)} chars) {p[:60]}...")
