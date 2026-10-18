import json, re

# Let's inspect the 5-act generator concept on Episode 11
data = json.load(open('scripts/canon_synopses.json'))
raw = data['11']
paras = [p.strip() for p in raw.split('\n\n') if p.strip()]

# Act 1: The Setting & Infiltration (paras 0 to 4)
# Act 2: Finding Balian & Aleksandar's Name (paras 5 to 9)
# Act 3: Escape & Duel with Ignis (paras 10 to 14)
# Act 4: Spear Technique & Truth Confrontation (paras 15 to 18)
# Act 5: Return to Surface & Gorgo Ambush (paras 19 to 21)

print(f"Ep 11 raw paras: {len(paras)}")
