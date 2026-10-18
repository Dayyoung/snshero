import json, re

data = json.load(open('scripts/canon_synopses.json'))

# Let's inspect how an expander enriches a raw canonical paragraph
def enrich_paragraph(para, ep_num):
    # If it's a title or source note, keep intact
    if para.startswith('#') or para.startswith('>'):
        return para
    # If it's short dialogue, enrich with speaker gesture and emotion
    if para.startswith('“') or para.startswith('"'):
        return para
    # Otherwise, it's narrative prose
    return para

print("Testing parser...")
for ep in range(1, 41):
    raw_paras = [p.strip() for p in data[str(ep)].split('\n\n') if p.strip()]
    narratives = [p for p in raw_paras if not p.startswith('#') and not p.startswith('>')]
    dlgs = [p for p in narratives if p.startswith('“') or p.startswith('"')]
    print(f"Ep {ep:02d}: {len(narratives)} narrative units ({len(dlgs)} dialogues, {len(narratives)-len(dlgs)} prose)")
