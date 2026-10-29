import os
import sys
sys.path.insert(0, ".")
import glob
import re
from pathlib import Path
from PIL import Image
from scripts.process_episode_scenes import process_scene, BUBBLE_CONFIGS

BRAIN_DIR = "/Users/dayyoung/.gemini/antigravity/brain/7735ed8e-a83b-4148-9951-01121a360410"
OUT_DIR = "public/images/webtoon/episode_01"

def find_latest_scene_images():
    # Gather all scene_XX_*.jpg or scene_XX.jpg
    files = glob.glob(os.path.join(BRAIN_DIR, "scene_*.jpg"))
    scene_map = {}
    for f in files:
        fname = os.path.basename(f)
        # Match scene_(\d+) or scene_(\d+)_narrative
        m = re.match(r"scene_(\d+)", fname)
        if m:
            s_idx = int(m.group(1))
            mtime = os.path.getmtime(f)
            if s_idx not in scene_map or mtime > scene_map[s_idx][1]:
                scene_map[s_idx] = (f, mtime)
    return scene_map

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    scene_map = find_latest_scene_images()
    print(f"Found generated images for {len(scene_map)} / 50 scenes.")

    processed_count = 0
    for s_idx in range(1, 51):
        if s_idx in scene_map:
            src_path, _ = scene_map[s_idx]
            dst_path = os.path.join(OUT_DIR, f"scene_{s_idx:02d}.webp")
            # If dst_path does not exist or src is newer than dst
            if not os.path.exists(dst_path) or os.path.getmtime(src_path) > os.path.getmtime(dst_path):
                process_scene(src_path, s_idx, dst_path)
                processed_count += 1
            else:
                pass

    print(f"Finished auto-processing. Newly updated: {processed_count} scenes.")

if __name__ == "__main__":
    main()
