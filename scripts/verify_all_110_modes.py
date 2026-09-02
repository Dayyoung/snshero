import re
from pathlib import Path

content = Path("src/views/PlayGameView.tsx").read_text(encoding='utf-8')

# 1. Parse all 110 game modes
mode_regex = re.compile(r'{\s*id:\s*[\'"]([^\'"]+)[\'"],\s*title:\s*(.*?),.*?characterId:\s*(\d+),\s*action:\s*\(\)\s*=>\s*{(.*?)}', re.DOTALL)

modes = mode_regex.findall(content)
print(f"Total modes parsed: {len(modes)}")

# 2. Check each mode
results = []
for idx, (m_id, title_expr, char_id, action_code) in enumerate(modes, 1):
    action_clean = action_code.strip()
    
    # What does action do?
    gs_match = re.search(r"setGameState\(['\"]([^'\"]+)['\"]\)", action_code)
    modal_match = re.search(r"set(Is[a-zA-Z]+Open)\(true\)", action_code)

    mode_type = ""
    target_state = ""
    is_valid = True
    reason = ""

    if gs_match:
        mode_type = "GameState"
        target_state = gs_match.group(1)
        # Verify if target_state is rendered in JSX
        if target_state in ['story', 'boss', 'dungeon', 'defense', 'single', 'multi', 'tournament', 'lobby']:
            is_valid = True
        elif f"gameState === '{target_state}'" in content or f'gameState === "{target_state}"' in content:
            is_valid = True
        else:
            is_valid = False
            reason = f"gameState '{target_state}' NOT found in JSX render switch!"
    elif modal_match:
        mode_type = "Modal"
        setter = modal_match.group(1)
        # check if modal state exists
        state_var = setter[3].lower() + setter[4:-4] if setter.startswith('setIs') else setter
        # e.g., setIsTowerTrialsOpen -> isTowerTrialsOpen
        state_name = "is" + setter[3:] if setter.startswith('setIs') else setter
        if state_name in content:
            is_valid = True
            target_state = state_name
        else:
            is_valid = False
            reason = f"Modal state '{state_name}' is undefined!"
    else:
        mode_type = "Custom"
        target_state = action_clean[:30]

    results.append({
        'index': idx,
        'characterId': int(char_id),
        'id': m_id,
        'type': mode_type,
        'target': target_state,
        'valid': is_valid,
        'reason': reason,
        'action': action_clean
    })

# Print report
print("\n" + "="*80)
print(f"{'#':<4} | {'CharID':<7} | {'Mode ID':<24} | {'Type':<10} | {'Target State':<22} | {'Status'}")
print("="*80)

invalid_count = 0
for r in results:
    status_str = "✅ OK" if r['valid'] else f"❌ ERROR ({r['reason']})"
    if not r['valid']:
        invalid_count += 1
    print(f"{r['index']:<4} | {r['characterId']:<7} | {r['id']:<24} | {r['type']:<10} | {r['target']:<22} | {status_str}")

print("="*80)
print(f"Total Modes: {len(results)}, Valid: {len(results) - invalid_count}, Invalid/Broken: {invalid_count}")
