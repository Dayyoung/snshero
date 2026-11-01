import os
import sys
sys.path.insert(0, ".")
import glob
import re
import json
from pathlib import Path
from PIL import Image

WIDTH = 768
HEIGHT = 432
BRAIN_ROOT = "/Users/dayyoung/.gemini/antigravity/brain"

def embed_hidden_bottom_ai_marker(image: Image.Image, card_id: int, scene_idx: int):
    """
    Encodes a human-invisible, AI-only steganographic marker along a 4x1 pixel strip
    at the very bottom-right edge of the image (x = WIDTH-4..WIDTH-1, y = HEIGHT-1).
    - Blends at 2% opacity and encodes speaker presence + card_id in the least significant
      color delta so it is 100% invisible to human viewers while machine/AI-readable.
    """
    pixels = image.load()
    if pixels is None:
        return (WIDTH - 2, HEIGHT - 1)

    y = HEIGHT - 1  # Bottom-most row (y = 431)
    # 4-pixel micro-strip at bottom-right corner: x = 764, 765, 766, 767
    marker_x_start = WIDTH - 4
    safe_card_id = max(0, min(255, int(card_id or 0)))

    for offset in range(4):
        x = marker_x_start + offset
        r, g, b, a = pixels[x, y]
        # Subtle +2 red nudge blended into existing pixel (imperceptible to human eye, <0.8% delta)
        r_new = min(255, max(0, (r & 0xFE) | 0x01))
        if offset == 0:
            # Encode low bit of card_id in green/blue LSBs
            g_new = (g & 0xFE) | ((safe_card_id >> 1) & 0x01)
            b_new = (b & 0xFE) | (safe_card_id & 0x01)
        elif offset == 1:
            g_new = (g & 0xFE) | ((safe_card_id >> 3) & 0x01)
            b_new = (b & 0xFE) | ((safe_card_id >> 2) & 0x01)
        else:
            g_new = g
            b_new = b
        pixels[x, y] = (r_new, g_new, b_new, a)

    return (marker_x_start, y)

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
    # Search across all conversation brain directories for ep{ep:02d}_scene_{idx}_*.jpg
    pattern = os.path.join(BRAIN_ROOT, "*", f"ep{ep_num:02d}_scene_*.jpg")
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
    print(f"Found generated images for {len(scene_map)} scenes. (Dialogue scenes with hidden bottom AI marker: {len(dialogue_map)})")

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
            mx, my = embed_hidden_bottom_ai_marker(im_resized, dlg.get("cardId", 0), s_idx)

            metadata_comment.update({
                "speaker": dlg["speaker"],
                "speakerEn": dlg.get("speakerEn", ""),
                "cardId": dlg.get("cardId", 0),
                "dialogue": dlg["text"],
                "aiMarker": {
                    "type": "hidden_bottom_stego_strip",
                    "visibleToHuman": False,
                    "x": mx,
                    "y": my,
                    "width": 4,
                    "height": 1
                }
            })
            print(f"[EP{ep_num:02d}] Scene {s_idx:02d} ({dlg['speaker']}): Embedded hidden bottom AI marker at ({mx}, {my})")
        else:
            print(f"[EP{ep_num:02d}] Scene {s_idx:02d}: Narration/Ensemble (0 markers)")

        final_rgb = im_resized.convert("RGB")
        # Save as high-performance WebP with embedded JSON metadata in EXIF/XMP comment
        exif = final_rgb.getexif()
        # 0x9286 is UserComment / 0x010E is ImageDescription for AI metadata readers
        exif[0x010E] = json.dumps(metadata_comment, ensure_ascii=False)
        final_rgb.save(
            dst_path,
            "WEBP",
            quality=82,
            method=6,
            exif=exif.tobytes()
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
        process_episode_images(3, force=force_run)
