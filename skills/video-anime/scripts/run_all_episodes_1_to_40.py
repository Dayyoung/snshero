#!/usr/bin/env python3
"""
Master Batch Production Runner for Episodes 1 ~ 40 (`1화` ~ `40화`) via Google Flow
-----------------------------------------------------------------------------------
Runs the genuine Google Flow pipeline (`https://flow.google.com/project/72ee6e60-2819-43a6-bb8c-700a7d599bdf`)
sequentially for each episode:
  1. `/script-anime <ep>회`: Ensures `episode_XX_cutscene_prompts.json` & `.md` exist.
  2. `/cutscene-anime <ep>화`: Generates all 16:9 (or 9:16) cutscene images in Google Flow using
     🍌 Nano Banana 2.1 with attached Location Sheets (`LOC-001`~`LOC-020`), 7-Head-Tall Character
     Cutouts (`cutouts/XXX_Name.png`), and Prop Sheets (`PROP-001`~`PROP-020`), and exports them to
     `public/anime-character-sheets/cutscenes/epXX_<orientation>/images/EPXX_CUTYY_cutscene.jpg`.
  3. `/video-anime <ep>화`: Animates each generated Nano Banana 2.1 cutscene image in Google Flow
     using `Veo 3.1 - Lite` (6 seconds, Start Frame `시작` = `EPXX_CUTYY_cutscene.jpg`, 3-mode audio/narration),
     downloads all 6s `.mp4` clips to `public/anime-character-sheets/videos/epXX_<orientation>/clips/`,
     and merges them into 1 integrated `.mp4` video in both:
       - `public/anime-character-sheets/videos/epXX_<orientation>/SNSHero_Anime_EPXX_<Title>_16x9.mp4`
       - `/Users/dayyoung/Desktop/내문서/movie/SNSHero_Anime_EPXX_<Title>_16x9.mp4`
"""

import argparse
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SCRIPT_GENERATOR = ROOT / "skills" / "script-anime" / "scripts" / "generate_episode_cutscene_prompts.py"
CUTSCENE_GENERATOR = ROOT / "skills" / "cutscene-anime" / "scripts" / "generate_flow_cutscenes.py"
VIDEO_GENERATOR = ROOT / "skills" / "video-anime" / "scripts" / "generate_flow_videos.py"


def main():
    parser = argparse.ArgumentParser(description="Run full Google Flow /script-anime + /cutscene-anime + /video-anime pipeline for Episodes 1..40")
    parser.add_argument("--start-ep", type=int, default=2)
    parser.add_argument("--end-ep", type=int, default=40)
    parser.add_argument("--orientation", choices=["landscape", "portrait"], default="landscape")
    args = parser.parse_args()

    for ep in range(args.start_ep, args.end_ep + 1):
        t0 = time.time()
        print("\n" + "=" * 88, flush=True)
        print(f"🚀 [EPISODE {ep:02d} / {args.end_ep:02d}] Starting Genuine Google Flow Pipeline ({args.orientation})...", flush=True)
        print("=" * 88, flush=True)

        try:
            # 1. Ensure /script-anime
            subprocess.run([sys.executable, str(SCRIPT_GENERATOR), f"{ep}회"], check=True)

            # 2. Run /cutscene-anime in Google Flow (Nano Banana 2.1, max 3 tries per cut then exclude)
            subprocess.run(
                [sys.executable, str(CUTSCENE_GENERATOR), f"{ep}화", "--orientation", args.orientation],
                check=True,
            )

            # 3. Run /video-anime in Google Flow (Veo 3.1 - Lite 6s, max 3 tries per clip then exclude + Merge)
            subprocess.run(
                [sys.executable, str(VIDEO_GENERATOR), f"{ep}화", "--orientation", args.orientation],
                check=True,
            )
            elapsed_min = (time.time() - t0) / 60.0
            print(f"✅ [EPISODE {ep:02d} COMPLETED in Flow] Elapsed: {elapsed_min:.1f} minutes", flush=True)
        except Exception as e:
            print(f"⚠️ [EPISODE {ep:02d} ERROR] {e} — proceeding to Episode {ep+1:02d}...", flush=True)


if __name__ == "__main__":
    main()
