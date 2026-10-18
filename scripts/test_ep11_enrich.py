import json, re

data = json.load(open('scripts/canon_synopses.json'))
paras = [p.strip() for p in data['11'].split('\n\n') if p.strip()]

header = paras[0]
scope = paras[1]
body = paras[2:]

enriched = [header, scope]
for i, p in enumerate(body):
    # If it's a short dialogue, expand with speaker action and surrounding reaction
    if p.startswith('“') or p.startswith('"'):
        enriched.append(p)
    else:
        enriched.append(p)

print("Original len:", len('\n\n'.join(paras)))
