import json, re

# Test expanding sample paragraphs from Ep 12 (두 무덤 사이의 봄)
data = json.load(open('scripts/canon_synopses.json'))
ep12_paras = [p.strip() for p in data['12'].split('\n\n') if p.strip()]

print(f"Ep 12 raw paras count: {len(ep12_paras)}")
print("Sample para 2:", ep12_paras[2])
print("Sample para 5:", ep12_paras[5])
