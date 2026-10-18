import json, re

# Let's inspect all 40 episodes from canon_synopses.json to ensure we can parse them cleanly
data = json.load(open('scripts/canon_synopses.json'))
print(f"Loaded {len(data)} canonical episodes.")
for ep in range(1, 41):
    text = data[str(ep)]
    paras = [p.strip() for p in text.split('\n\n') if p.strip()]
    header = paras[0] if paras else ""
    print(f"Ep {ep:02d}: {len(paras)} paras, {len(text)} raw chars, title='{header[:30]}'")
