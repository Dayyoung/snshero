import json

data = json.load(open('scripts/canon_synopses.json'))
ep8_text = data['8']
paras = [p.strip() for p in ep8_text.split('\n\n') if p.strip()]
print(f"Total paragraphs in Ep 8: {len(paras)}")
for i, p in enumerate(paras):
    print(f"[{i:02d}] ({len(p)} chars) {p[:70]}...")
