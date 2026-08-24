#!/usr/bin/env python3
import os
import glob
import re

COMPONENTS_DIR = "/Users/dayyoung/project/snshero/src/components"
AGENTS_FILE = "/Users/dayyoung/project/snshero/AGENTS.md"

def get_mission_games():
    pattern = os.path.join(COMPONENTS_DIR, "Voxel*Game.tsx")
    files = sorted(glob.glob(pattern))
    return [os.path.basename(f) for f in files]

def get_last_inspected_game():
    if not os.path.exists(AGENTS_FILE):
        return None
    with open(AGENTS_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    match = re.search(r"마지막 점검 게임[*\s:]+`([A-Za-z0-9_.]+)`", content)
    if match:
        return match.group(1)
    return None

def get_next_game():
    games = get_mission_games()
    last = get_last_inspected_game()
    if not last or last not in games:
        return games[0] if games else None
    idx = games.index(last)
    next_idx = (idx + 1) % len(games)
    return games[next_idx]

if __name__ == "__main__":
    games = get_mission_games()
    last = get_last_inspected_game()
    next_game = get_next_game()
    print(f"Total Mission Games: {len(games)}")
    print(f"Last Inspected Game: {last}")
    print(f"Next Target Game: {next_game}")
