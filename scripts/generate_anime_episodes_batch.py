#!/usr/bin/env python3
"""
Batch Runner for SNSHero Anime Episodes 3 to 20
-----------------------------------------------
Sequentially invokes `scripts/run_anime_episode.py <EP>` from start to end episode.
"""

import argparse
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=3, help="Start episode (default: 3)")
    parser.add_argument("--end", type=int, default=20, help="End episode (default: 20)")
    args = parser.parse_args()

    print(f"🚀 [SNSHero Anime Batch Engine] Launching EP{args.start:02d} to EP{args.end:02d}")
    runner = ROOT / "scripts" / "run_anime_episode.py"

    for ep in range(args.start, args.end + 1):
        print(f"\n=======================================================")
        print(f"🎬 [Batch Engine] Starting Pipeline for Episode {ep:02d} ({ep}/{args.end})")
        print(f"=======================================================")
        res = subprocess.run([sys.executable, str(runner), str(ep)])
        print(f"Finished Episode {ep:02d} with exit code: {res.returncode}")
        time.sleep(3)

    print(f"\n🎉 [SNSHero Anime Batch Engine] All Episodes {args.start} to {args.end} complete!")

if __name__ == "__main__":
    main()
