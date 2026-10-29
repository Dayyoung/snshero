import os
import sys
sys.path.insert(0, ".")
import glob
import re
from pathlib import Path
from PIL import Image
from scripts.process_episode_scenes import process_scene, BUBBLE_CONFIGS_EP03

BRAIN_DIR = "/Users/dayyoung/.gemini/antigravity/brain/7735ed8e-a83b-4148-9951-01121a360410"
OUT_DIR = "public/images/webtoon/episode_03"

def find_latest_ep03_scene_images():
    # Gather all ep03_scene_XX_*.jpg or ep03_scene_XX.jpg
    files = glob.glob(os.path.join(BRAIN_DIR, "ep03_scene_*.jpg"))
    scene_map = {}
    for f in files:
        fname = os.path.basename(f)
        m = re.match(r"ep03_scene_(\d+)", fname)
        if m:
            s_idx = int(m.group(1))
            mtime = os.path.getmtime(f)
            if s_idx not in scene_map or mtime > scene_map[s_idx][1]:
                scene_map[s_idx] = (f, mtime)
    return scene_map

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    scene_map = find_latest_ep03_scene_images()
    print(f"Found generated images for {len(scene_map)} / 54 scenes of Episode 3.")

    processed_count = 0
    for s_idx in range(0, 54):
        if s_idx in scene_map:
            src_path, _ = scene_map[s_idx]
            dst_path = os.path.join(OUT_DIR, f"scene_{s_idx:02d}.webp")
            if not os.path.exists(dst_path) or os.path.getmtime(src_path) > os.path.getmtime(dst_path):
                process_scene(src_path, s_idx, dst_path, ep=3)
                processed_count += 1

    print(f"Finished auto-processing Episode 3. Newly updated: {processed_count} scenes.")

if __name__ == "__main__":
    main()
