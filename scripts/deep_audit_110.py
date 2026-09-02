import os
import re

view_path = 'src/views/PlayGameView.tsx'
with open(view_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Parse modes array
start_idx = code.find('const modes = [')
bracket_count = 0
in_modes = False
modes_end = -1

for i in range(start_idx, len(code)):
    if code[i] == '[':
        bracket_count += 1
        in_modes = True
    elif code[i] == ']':
        bracket_count -= 1
        if in_modes and bracket_count == 0:
            modes_end = i + 1
            break

modes_text = code[start_idx:modes_end]
items = re.findall(r'\{\s*id:\s*[\'"]([^\'"]+)[\'"].*?characterId:\s*(\d+).*?action:\s*\(\)\s*=>\s*\{([^}]+)\}', modes_text, re.DOTALL)

print(f"Total Mode Definitions Found: {len(items)}\n")

results = []

for mid, cid, act in items:
    cid_int = int(cid)
    act_clean = " ".join(act.strip().split())
    
    # Identify how this mode starts
    status = "UNKNOWN"
    reason = ""
    
    # Check gameState triggers
    gs_match = re.search(r"setGameState\(['\"]([^'\"]+)['\"]\)", act)
    modal_match = re.search(r"setIs([A-Za-z0-9_]+Open)\(true\)", act)
    custom_match = re.search(r"(startTournament|handleEncounter|startDungeonBattle)", act)
    
    if gs_match:
        gs = gs_match.group(1)
        # Check if this gameState has a rendering block in PlayGameView
        gs_pattern = f"if (gameState === '{gs}')"
        alt_pattern = f"gameState === '{gs}'"
        
        if gs_pattern in code or alt_pattern in code:
            status = "PLAYABLE"
            reason = f"GameState '{gs}' triggers dedicated view component"
        else:
            status = "BROKEN"
            reason = f"GameState '{gs}' has NO rendering block in PlayGameView!"
    elif modal_match:
        modal_state = modal_match.group(1)
        # Check if modal is in JSX
        if f"is{modal_state}" in code:
            status = "PLAYABLE"
            reason = f"Modal 'is{modal_state}' opens correctly"
        else:
            status = "BROKEN"
            reason = f"Modal state 'is{modal_state}' not bound to any modal!"
    elif custom_match:
        handler = custom_match.group(1)
        status = "PLAYABLE"
        reason = f"Custom battle handler '{handler}()' starts match"
    else:
        status = "BROKEN"
        reason = f"Unrecognized action: {act_clean}"
        
    results.append({
        'characterId': cid_int,
        'id': mid,
        'status': status,
        'reason': reason,
        'action': act_clean
    })

results.sort(key=lambda x: x['characterId'])

playable_count = sum(1 for r in results if r['status'] == 'PLAYABLE')
broken_count = sum(1 for r in results if r['status'] != 'PLAYABLE')

print(f"{'#':<4} | {'ID':<26} | {'Status':<9} | {'Details'}")
print("-" * 80)
for r in results:
    print(f"#{str(r['characterId']).zfill(3)} | {r['id']:<26} | {r['status']:<9} | {r['reason']}")

print("=" * 80)
print(f"FINAL AUDIT RESULT: {playable_count}/110 Playable ({playable_count/110*100:.1f}%), {broken_count} Broken")
