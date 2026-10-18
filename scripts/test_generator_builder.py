import json, os, re

data = json.load(open('scripts/canon_synopses.json'))
print(f"Total episodes in canon: {len(data)}")

# Let's verify that we can load and parse every single episode
for ep in range(1, 41):
    raw = data[str(ep)]
    lines = [l.strip() for l in raw.split('\n') if l.strip()]
    header = lines[0]
    scope = lines[1] if len(lines) > 1 else ""
    paras = [p.strip() for p in raw.split('\n\n') if p.strip() and not p.startswith('#') and not p.startswith('>')]
    assert len(paras) >= 15, f"Ep {ep} has fewer than 15 paras: {len(paras)}"

print("All 40 episodes have >= 15 canonical paragraphs!")
