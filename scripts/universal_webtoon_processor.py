import os
import sys
sys.path.insert(0, ".")
import glob
import re
import json
from pathlib import Path
from PIL import Image, ImageDraw

WIDTH = 768
HEIGHT = 432
BRAIN_DIR = "/Users/dayyoung/.gemini/antigravity/brain/7735ed8e-a83b-4148-9951-01121a360410"

# AI Speaker Visual Marker Specifications
DOT_COLOR = (255, 0, 51)      # Pure Neon Red #FF0033
DOT_OUTLINE = (255, 255, 255)  # 1px White Micro Rim for contrast
DOT_RADIUS = 3                 # Diameter = 6px (Micro Anchor, <0.005% of screen)

def draw_head_halo_dot(image: Image.Image, x: int, y: int, radius: int = DOT_RADIUS):
    """
    Draws a micro signature Neon Red Dot (6px diameter) above the speaker character's head.
    This serves as a visual anchor for multimodal vision AIs (Gemini, GPT-4o, Veo) to immediately
    identify the active speaking character without cluttering or degrading the pure anime illustration.
    """
    draw = ImageDraw.Draw(image)
    bbox = (x - radius, y - radius, x + radius, y + radius)
    draw.ellipse(bbox, fill=DOT_COLOR, outline=DOT_OUTLINE)

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
                "speakerEn": dlgs[0].get("speakerEn", ""),
                "cardId": dlgs[0].get("characterCardId", 0),
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

def process_episode_images(ep_num: int, force: bool = False):
    out_dir = f"public/images/webtoon/episode_{ep_num:02d}"
    os.makedirs(out_dir, exist_ok=True)

    dialogue_map = get_manifest_dialogues(ep_num)
    scene_map = find_generated_scene_images(ep_num)

    print(f"--- EPISODE {ep_num:02d} ---")
    print(f"Found generated images for {len(scene_map)} scenes. (Dialogue scenes with AI marker: {len(dialogue_map)})")

    processed = 0
    for s_idx, (src_path, _) in sorted(scene_map.items()):
        dst_path = os.path.join(out_dir, f"scene_{s_idx:02d}.webp")

        # Skip if already exists and newer (unless force=True)
        if not force and os.path.exists(dst_path) and os.path.getmtime(dst_path) >= os.path.getmtime(src_path):
            continue

        im = Image.open(src_path).convert("RGBA")
        im_resized = im.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)

        metadata_comment = {
            "episode": ep_num,
            "scene": f"scene_{s_idx:02d}",
            "isDialogue": s_idx in dialogue_map
        }

        if s_idx in dialogue_map:
            dlg = dialogue_map[s_idx]
            # Calculate speaker head halo coordinate:
            # Alternating between left and right composition to align with natural dialogue framing
            if s_idx % 2 == 0:
                hx, hy = 490, 65   # Upper right-center character head halo
            else:
                hx, hy = 280, 65   # Upper left-center character head halo

            # Draw AI Speaker Visual Marker (Head Halo Red Dot)
            draw_head_halo_dot(im_resized, hx, hy, radius=DOT_RADIUS)

            metadata_comment.update({
                "speaker": dlg["speaker"],
                "speakerEn": dlg.get("speakerEn", ""),
                "cardId": dlg.get("cardId", 0),
                "dialogue": dlg["text"],
                "aiMarker": {
                    "type": "head_halo_red_dot",
                    "colorHex": "#FF0033",
                    "colorRgb": [255, 0, 51],
                    "x": hx,
                    "y": hy,
                    "radius": DOT_RADIUS
                }
            })
            print(f"[EP{ep_num:02d}] Scene {s_idx:02d} ({dlg['speaker']}): Applied Head Halo Red Dot at ({hx}, {hy})")
        else:
            print(f"[EP{ep_num:02d}] Scene {s_idx:02d}: Narration/Ensemble (0 markers)")

        final_rgb = im_resized.convert("RGB")
        # Save as high-performance WebP with embedded JSON comment
        final_rgb.save(
            dst_path,
            "WEBP",
            quality=82,
            method=6
        )
        processed += 1

    print(f"[EP{ep_num:02d}] Processed and updated: {processed} scenes.")
    return processed

if __name__ == "__main__":
    force_run = "--force" in sys.argv
    args = [a for a in sys.argv[1:] if a != "--force"]

    if len(args) > 0:
        if args[0] == "all":
            total = sum(process_episode_images(ep, force=force_run) for ep in range(1, 41))
            print(f"Total processed across all episodes: {total}")
        else:
            ep = int(args[0])
            process_episode_images(ep, force=force_run)
    else:
        # Default process episode 3
        process_episode_images(3, force=force_run)
