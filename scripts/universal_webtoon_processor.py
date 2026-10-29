import os
import sys
sys.path.insert(0, ".")
import glob
import re
import json
from pathlib import Path
from PIL import Image
from scripts.process_episode_scenes import draw_comic_speech_bubble, WIDTH, HEIGHT

BRAIN_DIR = "/Users/dayyoung/.gemini/antigravity/brain/7735ed8e-a83b-4148-9951-01121a360410"

def get_manifest_dialogues(ep_num: int):
    manifest_path = "src/content/webtoonEpisodeManifest.json"
    if not os.path.exists(manifest_path):
        return {}
    with open(manifest_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    ep_data = data.get(str(ep_num))
    if not ep_data:
        return {}

    dialogue_map = {}
    for img in ep_data.get("images", []):
        idx = img["index"]
        dlgs = [d for d in img.get("dialogues", []) if d.get("speakerKo") not in ("내레이션", "Narration", None, "")]
        if dlgs:
            dialogue_map[idx] = {
                "speaker": dlgs[0]["speakerKo"],
                "text": dlgs[0]["textKo"]
            }
    return dialogue_map

def find_generated_scene_images(ep_num: int):
    # Pattern: ep{ep:02d}_scene_{idx}_*.jpg or ep{ep:02d}_scene_{idx}.jpg
    pattern = os.path.join(BRAIN_DIR, f"ep{ep_num:02d}_scene_*.jpg")
    files = glob.glob(pattern)
    scene_map = {}
    for f in files:
        fname = os.path.basename(f)
        m = re.match(rf"ep{ep_num:02d}_scene_(\d+)", fname)
        if m:
            s_idx = int(m.group(1))
            mtime = os.path.getmtime(f)
            if s_idx not in scene_map or mtime > scene_map[s_idx][1]:
                scene_map[s_idx] = (f, mtime)
    return scene_map

def process_episode_images(ep_num: int):
    out_dir = f"public/images/webtoon/episode_{ep_num:02d}"
    os.makedirs(out_dir, exist_ok=True)

    dialogue_map = get_manifest_dialogues(ep_num)
    scene_map = find_generated_scene_images(ep_num)

    print(f"--- EPISODE {ep_num:02d} ---")
    print(f"Found generated images for {len(scene_map)} scenes. (Dialogue scenes: {len(dialogue_map)})")

    processed = 0
    for s_idx, (src_path, _) in sorted(scene_map.items()):
        dst_path = os.path.join(out_dir, f"scene_{s_idx:02d}.webp")

        # Skip if already exists and newer
        if os.path.exists(dst_path) and os.path.getmtime(dst_path) >= os.path.getmtime(src_path):
            continue

        im = Image.open(src_path).convert("RGBA")
        im_resized = im.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)

        if s_idx in dialogue_map:
            # Alternating placement between upper-right and upper-left based on scene index or speaker
            # to keep natural visual rhythm
            if s_idx % 2 == 0:
                cx, cy, tail_tip, is_left = 570, 55, (500, 115), False
            else:
                cx, cy, tail_tip, is_left = 190, 55, (250, 115), True

            draw_comic_speech_bubble(im_resized, cx, cy, tail_tip, is_left)
            print(f"[EP{ep_num:02d}] Scene {s_idx:02d} ({dialogue_map[s_idx]['speaker']}): Added speech bubble at ({cx}, {cy})")
        else:
            print(f"[EP{ep_num:02d}] Scene {s_idx:02d}: Narration only (0 bubbles)")

        final_rgb = im_resized.convert("RGB")
        final_rgb.save(dst_path, "WEBP", quality=82)
        processed += 1

    print(f"[EP{ep_num:02d}] Processed and updated: {processed} scenes.")
    return processed

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "all":
            total = sum(process_episode_images(ep) for ep in range(1, 41))
            print(f"Total processed across all episodes: {total}")
        else:
            ep = int(sys.argv[1])
            process_episode_images(ep)
    else:
        # Default process episode 3
        process_episode_images(3)
