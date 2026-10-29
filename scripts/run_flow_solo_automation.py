#!/usr/bin/env python3
"""
Fully automated Flow character generation runner.
Uses Chrome AppleScript + Quartz CGEvent to submit prompts and downloads 1376x768 images from flow-content.google / flow.google.com CDN.
"""
import argparse
import base64
from io import BytesIO
import json
from pathlib import Path
import re
import subprocess
import sys
import time
from typing import Dict, List, Optional, Set, Tuple

import numpy as np
from PIL import Image
import Quartz.CoreGraphics as CG
import requests

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from solo_prompts_110 import ALL_110_SOLO_PROMPTS

OUT_SOLO_DIR = ROOT / "public" / "anime-character-sheets" / "raw_solo_regenerated"


def run_js(js_code: str) -> str:
    escaped_js = js_code.replace('\\', '\\\\').replace('"', '\\"').replace('$', '\\$').strip()
    apple_script = f'''
tell application "Google Chrome"
    repeat with w in windows
        repeat with t in tabs of w
            if URL of t contains "flow.google.com/project/72ee6e60-2819-43a6-bb8c-700a7d599bdf" then
                return (execute t javascript "{escaped_js}")
            end if
        end repeat
    end repeat
    error "Flow project tab not found in Google Chrome"
end tell
'''
    res = subprocess.run(["osascript", "-e", apple_script], capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(res.stderr.strip() or res.stdout.strip())
    return res.stdout.strip()


def is_valid_white_bg_solo_char(body: bytes) -> bool:
    try:
        im = Image.open(BytesIO(body)).convert("RGB")
        if im.width < 1000 or im.height < 550 or im.width < im.height * 1.35:
            return False
        arr = np.array(im, dtype=np.float32)
        sat = np.max(arr, axis=2) - np.min(arr, axis=2)
        if float(sat.max()) < 40.0 or float(sat.mean()) < 3.0:
            return False
        corners = [
            arr[:24, :24],
            arr[:24, -24:],
            arr[-24:, :24],
            arr[-24:, -24:],
        ]
        # At least 2 corners with mean > 210.0 or average of 4 corners > 215.0 (allows slight dark magic aura for Undead/Dark Elves)
        c_means = [float(c.mean()) for c in corners]
        valid_corners = sum(1 for m in c_means if m > 210.0)
        avg_corners = sum(c_means) / 4.0
        return valid_corners >= 2 or avg_corners > 215.0
    except Exception:
        return False


def get_all_gallery_image_urls() -> List[str]:
    js = """
    (() => {
        const imgs = Array.from(document.querySelectorAll('img'))
            .map(i => i.currentSrc || i.src || '')
            .filter(s => s.includes('flow-content.google') || s.includes('/asb/'));
        return JSON.stringify(Array.from(new Set(imgs)));
    })()
    """
    raw = run_js(js)
    try:
        return json.loads(raw)
    except:
        return []


def get_element_screen_coords(selector: str) -> Optional[Dict[str, float]]:
    js = f"""
    (() => {{
        const el = document.querySelector({json.dumps(selector)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return JSON.stringify({{
            x: window.screenX + r.left + r.width / 2,
            y: window.screenY + 120 + r.top + r.height / 2
        }});
    }})()
    """
    raw = run_js(js)
    if not raw or raw == "null":
        return None
    try:
        return json.loads(raw)
    except:
        return None


def click_screen_coords(x: float, y: float):
    pt = CG.CGPoint(x, y)
    CG.CGEventPost(CG.kCGHIDEventTap, CG.CGEventCreateMouseEvent(None, CG.kCGEventMouseMoved, pt, CG.kCGMouseButtonLeft))
    time.sleep(0.04)
    CG.CGEventPost(CG.kCGHIDEventTap, CG.CGEventCreateMouseEvent(None, CG.kCGEventLeftMouseDown, pt, CG.kCGMouseButtonLeft))
    time.sleep(0.06)
    CG.CGEventPost(CG.kCGHIDEventTap, CG.CGEventCreateMouseEvent(None, CG.kCGEventLeftMouseUp, pt, CG.kCGMouseButtonLeft))
    time.sleep(0.04)


def submit_prompt_reliable(prompt_text: str) -> bool:
    # 0. Ensure Chrome is active and ProseMirror has real OS focus
    subprocess.run(["osascript", "-e", 'tell application "Google Chrome" to activate'])
    time.sleep(0.15)
    pm_coords = get_element_screen_coords("div.ProseMirror")
    if pm_coords:
        click_screen_coords(pm_coords["x"], pm_coords["y"])
        time.sleep(0.15)

    # 1. Insert prompt via execCommand + InputEvent
    insert_js = f"""
    (() => {{
        const pm = document.querySelector('div.ProseMirror');
        if (!pm) return -1;
        pm.focus();
        document.execCommand('selectAll', false);
        document.execCommand('insertText', false, {json.dumps(prompt_text)});
        pm.dispatchEvent(new InputEvent('input', {{ bubbles: true, cancelable: true, inputType: 'insertText', data: ' ' }}));
        pm.dispatchEvent(new KeyboardEvent('keydown', {{ key: 'a', code: 'KeyA', bubbles: true }}));
        pm.dispatchEvent(new KeyboardEvent('keyup', {{ key: 'a', code: 'KeyA', bubbles: true }}));
        pm.dispatchEvent(new Event('change', {{ bubbles: true }}));
        return pm.innerText.trim().length;
    }})()
    """
    try:
        txt_len = int(run_js(insert_js))
    except Exception as e:
        print(f"  [Error] Insert failed: {e}", flush=True)
        return False

    if txt_len < 30:
        print(f"  [Warn] Inserted text too short: {txt_len}", flush=True)
        return False

    # 2. Wait up to 3.5s for generate button to enable
    btn_ready = False
    for _ in range(7):
        time.sleep(0.5)
        check_btn_js = """
        (() => {
            const btn = document.querySelector('button[aria-label="생성 시작"], .generate-icon-button');
            return btn ? !btn.disabled : false;
        })()
        """
        if run_js(check_btn_js) == "true":
            btn_ready = True
            break

    if not btn_ready:
        print("  [Warn] Generate button did not enable.", flush=True)
        return False

    # 3. Focus Chrome and click generate button
    subprocess.run(["osascript", "-e", 'tell application "Google Chrome" to activate'])
    time.sleep(0.1)
    btn_coords = get_element_screen_coords('button[aria-label="생성 시작"], .generate-icon-button')
    if not btn_coords:
        print("  [Error] Button coords not found.", flush=True)
        return False

    click_screen_coords(btn_coords["x"], btn_coords["y"])
    time.sleep(1.2)

    # 4. Check if text cleared
    check_cleared = """
    (() => {
        const pm = document.querySelector('div.ProseMirror');
        return pm ? pm.innerText.trim().length : -1;
    })()
    """
    length = int(run_js(check_cleared))
    if length == 0:
        return True

    # Retry click once more
    click_screen_coords(btn_coords["x"], btn_coords["y"])
    time.sleep(1.2)
    return int(run_js(check_cleared)) == 0


def download_image_bytes(url: str) -> Optional[bytes]:
    # Method 1: Direct requests if flow-content.google (public signed CDN)
    if "flow-content.google" in url:
        try:
            r = requests.get(url, timeout=20)
            if r.status_code == 200 and len(r.content) > 30000:
                return r.content
        except Exception as e:
            print(f"  [Warn] Direct download error: {e}", flush=True)

    # Method 2: Canvas extraction if same-origin /asb/
    if "/asb/" in url:
        js = f"""
        (() => {{
            const target = {json.dumps(url)};
            const img = Array.from(document.querySelectorAll('img')).find(i => (i.currentSrc || i.src) === target);
            if (!img) return 'NO_IMG_MATCH';
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 1376;
            canvas.height = img.naturalHeight || 768;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            return canvas.toDataURL('image/jpeg', 0.95);
        }})()
        """
        b64_str = run_js(js)
        if b64_str.startswith("data:image/"):
            try:
                return base64.b64decode(b64_str.split(",", 1)[1])
            except:
                pass

    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ids", type=str, default="remaining", help="Comma-separated IDs, 'remaining', or 'all'")
    parser.add_argument("--delay", type=float, default=8.5, help="Cooldown delay between generations in seconds")
    parser.add_argument("--max-wait", type=int, default=50, help="Max wait seconds for a single generation")
    args = parser.parse_args()

    OUT_SOLO_DIR.mkdir(parents=True, exist_ok=True)

    # Find already completed files
    completed_ids = set()
    for p in OUT_SOLO_DIR.glob("*_solo.jpg"):
        try:
            cid = int(p.name[:3])
            if p.stat().st_size >= 25000:
                completed_ids.add(cid)
        except:
            pass

    if args.ids == "remaining":
        targets = sorted([c for c in ALL_110_SOLO_PROMPTS.keys() if c not in completed_ids])
    elif args.ids == "all":
        targets = sorted(ALL_110_SOLO_PROMPTS.keys())
    else:
        targets = [int(x.strip()) for x in args.ids.split(",") if x.strip().isdigit()]

    print(f"=== SNSHero Google Flow Auto-Generator ===", flush=True)
    print(f"Total characters in spec: {len(ALL_110_SOLO_PROMPTS)}", flush=True)
    print(f"Already completed: {len(completed_ids)}/{len(ALL_110_SOLO_PROMPTS)} ({len(completed_ids)/len(ALL_110_SOLO_PROMPTS)*100:.1f}%)", flush=True)
    print(f"Pending to generate ({len(targets)}): {targets}", flush=True)

    for idx, cid in enumerate(targets, 1):
        slug, desc = ALL_110_SOLO_PROMPTS[cid]
        dst_path = OUT_SOLO_DIR / f"{cid:03d}_{slug}_solo.jpg"
        print(f"\n[{idx}/{len(targets)}] Starting #{cid:03d} {slug}...", flush=True)

        prompt = (
            f"[SOLO ANIME CHARACTER MODEL ART #{cid:03d}] "
            f"Single solo full-body 2D Japanese-Korean fantasy studio anime character illustration of {desc}. "
            f"PURE SOLID #FFFFFF STUDIO WHITE BACKGROUND from edge to edge, NO ground shadow, NO pedestal, NO background scenery. "
            f"Centered single-character full-body framing zoomed out with generous 20% pure white margin on top, bottom, left, and right so 100% of the head, feet, wings, weapons, shields, and tail fit completely inside the frame with ZERO clipping. "
            f"Crisp dark anime ink linework, vibrant cel-shaded studio coloring, clean anatomical hands, ONLY ONE SINGLE CHARACTER IN THE IMAGE (never draw duplicate figures), NO text, NO labels, NO watermarks."
        )

        char_success = False
        for attempt in range(1, 4):
            print(f"  [Attempt {attempt}/3] Submitting prompt...", flush=True)
            before_urls = set(get_all_gallery_image_urls())
            
            submitted = submit_prompt_reliable(prompt)
            if not submitted:
                print("  [Warn] Failed to submit prompt. Retrying in 3s...", flush=True)
                time.sleep(3.0)
                continue

            print("  Submitted! Waiting for new generated image in Flow gallery...", flush=True)
            start_time = time.time()
            new_img_url = None

            while time.time() - start_time < args.max_wait:
                time.sleep(2.0)
                curr_urls = set(get_all_gallery_image_urls())
                diff = curr_urls - before_urls
                if diff:
                    new_img_url = list(diff)[0]
                    elapsed = time.time() - start_time
                    print(f"  New image detected after {elapsed:.1f}s: {new_img_url[:65]}...", flush=True)
                    break

            if not new_img_url:
                print(f"  [Timeout] No new image appeared within {args.max_wait}s.", flush=True)
                continue

            # Wait 1.5s for final render settlement
            time.sleep(1.5)
            img_bytes = download_image_bytes(new_img_url)
            if not img_bytes:
                print("  [Error] Failed to download image bytes.", flush=True)
                continue

            if not is_valid_white_bg_solo_char(img_bytes):
                print(f"  [Warn] Image validation failed (size={len(img_bytes)}). Retrying attempt...", flush=True)
                continue

            # Valid! Save
            dst_path.write_bytes(img_bytes)
            print(f"  SUCCESS! #{cid:03d} {slug} saved to {dst_path.name} ({len(img_bytes)} bytes)!", flush=True)
            char_success = True
            break

        if not char_success:
            print(f"  [Rule] 3 attempts failed for #{cid:03d}. Skipping to next character.", flush=True)
        else:
            print(f"  Cooling down {args.delay}s to maintain safe generation pacing...", flush=True)
            time.sleep(args.delay)

    print("\n=== Generation Batch Finished! ===", flush=True)


if __name__ == "__main__":
    main()
