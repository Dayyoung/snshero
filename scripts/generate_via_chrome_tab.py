#!/usr/bin/env python3
"""
Generate remaining solo anime characters directly via user's open Google Chrome Flow tab.
Communicates with Chrome via AppleScript execute javascript.
"""
import argparse
import hashlib
from io import BytesIO
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time
from typing import Dict, List, Optional, Set, Tuple

import numpy as np
from PIL import Image
import requests

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from solo_prompts_110 import ALL_110_SOLO_PROMPTS

FLOW_PROJECT_URL = "https://flow.google.com/project/72ee6e60-2819-43a6-bb8c-700a7d599bdf"
OUT_SOLO_DIR = ROOT / "public" / "anime-character-sheets" / "raw_solo_regenerated"


def run_js(js_code: str) -> str:
    """Execute JavaScript in the open Flow tab of Google Chrome."""
    escaped_js = js_code.replace('\\', '\\\\').replace('"', '\\"').replace('$', '\\$')
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


def check_chrome_js_enabled() -> bool:
    try:
        title = run_js("document.title")
        return bool(title)
    except Exception as e:
        return False


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
        white_corners = sum(1 for c in corners if float(c.mean()) > 240.0)
        return white_corners >= 3
    except Exception:
        return False


def get_current_settings_summary() -> str:
    js = """
    (() => {
        const trig = document.querySelector('button[aria-label="설정 트리거"], .settings-trigger-button');
        return trig ? trig.innerText : 'TRIGGER_NOT_FOUND';
    })()
    """
    return run_js(js)


def configure_flow_settings():
    curr = get_current_settings_summary()
    print(f"[Flow] Current settings: {repr(curr)}", flush=True)
    if "Nano Banana 2" in curr and "crop_16_9" in curr and "x1" in curr:
        print("[Flow] Settings are already optimal!", flush=True)
        return

    js = """
    (() => {
        const trig = document.querySelector('button[aria-label="설정 트리거"], .settings-trigger-button');
        if (!trig) return 'TRIGGER_NOT_FOUND';
        trig.click();
        return 'CLICKED_TRIGGER';
    })()
    """
    run_js(js)
    time.sleep(1.0)

    # Click image, 16:9, x1
    setup_js = """
    (() => {
        const imgRadio = Array.from(document.querySelectorAll('button[role="radio"], [role="tab"]')).find(e => (e.innerText || '').includes('이미지'));
        if (imgRadio) imgRadio.click();
        const r169 = Array.from(document.querySelectorAll('button[role="radio"]')).find(e => (e.innerText || '').includes('16:9'));
        if (r169) r169.click();
        const x1 = Array.from(document.querySelectorAll('button[role="radio"]')).find(e => (e.innerText || '').includes('x1'));
        if (x1) x1.click();
        return 'OPTIONS_CLICKED';
    })()
    """
    run_js(setup_js)
    time.sleep(0.5)

    # Dismiss settings dialog
    run_js("(() => { const b = document.querySelector('.cdk-overlay-backdrop'); if (b) b.click(); })()")
    time.sleep(0.5)


def get_all_asb_image_urls() -> List[str]:
    js = """
    (() => {
        const imgs = Array.from(document.querySelectorAll('img'))
            .filter(e => !e.classList.contains('thumbnail'))
            .map(e => e.currentSrc || e.src || '')
            .filter(s => s.includes('/asb/'));
        return JSON.stringify(Array.from(new Set(imgs)));
    })()
    """
    raw = run_js(js)
    try:
        return json.loads(raw)
    except Exception:
        return []


def submit_prompt(prompt_text: str) -> bool:
    # Set text and click generate
    js = f"""
    (() => {{
        const input = document.querySelector('[aria-label="무엇을 만들고 싶으신가요?"], textarea, div[contenteditable="true"]');
        if (!input) return 'INPUT_NOT_FOUND';
        
        if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {{
            input.value = {json.dumps(prompt_text)};
            input.dispatchEvent(new Event('input', {{ bubbles: true }}));
            input.dispatchEvent(new Event('change', {{ bubbles: true }}));
        }} else {{
            input.innerText = {json.dumps(prompt_text)};
            input.dispatchEvent(new Event('input', {{ bubbles: true }}));
        }}
        
        // Find submit button
        const btn = document.querySelector('button[aria-label="만들기"], button[aria-label="제출"], button.submit-button, button.send-button');
        if (btn) {{
            btn.click();
            return 'CLICKED_SUBMIT';
        }}
        
        // Try enter key
        input.dispatchEvent(new KeyboardEvent('keydown', {{ key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }}));
        return 'SENT_ENTER';
    }})()
    """
    res = run_js(js)
    print(f"[Flow] Prompt submission status: {res}", flush=True)
    return 'NOT_FOUND' not in res


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ids", type=str, default="remaining", help="Comma-separated IDs or 'remaining' or 'all'")
    parser.add_argument("--delay", type=float, default=8.5, help="Delay in seconds between generations")
    args = parser.parse_args()

    OUT_SOLO_DIR.mkdir(parents=True, exist_ok=True)

    if not check_chrome_js_enabled():
        print("ERROR: Google Chrome has 'Apple Events JavaScript' disabled!", flush=True)
        print("Please enable it in Chrome: [View / 보기] -> [Developer / 개발자 정보] -> [Allow JavaScript from Apple Events / Apple Events의 자바스크립트 허용]", flush=True)
        sys.exit(1)

    print("[Flow] Successfully connected to open Flow tab via Google Chrome!", flush=True)
    configure_flow_settings()

    # Determine remaining IDs
    completed_ids = set()
    for p in OUT_SOLO_DIR.glob("*_solo.jpg"):
        try:
            cid = int(p.name[:3])
            if p.stat().st_size >= 25000:
                completed_ids.add(cid)
        except Exception:
            pass

    if args.ids == "remaining":
        target_ids = sorted([i for i in ALL_110_SOLO_PROMPTS.keys() if i not in completed_ids])
    elif args.ids == "all":
        target_ids = sorted(ALL_110_SOLO_PROMPTS.keys())
    else:
        target_ids = [int(x.strip()) for x in args.ids.split(",") if x.strip().isdigit()]

    print(f"[Flow] Completed characters: {len(completed_ids)}/110")
    print(f"[Flow] Target remaining characters ({len(target_ids)}): {target_ids}", flush=True)

    initial_asb = set(get_all_asb_image_urls())
    print(f"[Flow] Initial ASB image pool size: {len(initial_asb)}", flush=True)

    for idx, cid in enumerate(target_ids, 1):
        slug, desc = ALL_110_SOLO_PROMPTS[cid]
        dst_path = OUT_SOLO_DIR / f"{cid:03d}_{slug}_solo.jpg"
        print(f"\n[{idx}/{len(target_ids)}] Generating #{cid:03d} {slug}...", flush=True)

        prompt = (
            f"[SOLO ANIME CHARACTER MODEL ART #{cid:03d}] "
            f"Single solo full-body 2D Japanese-Korean fantasy studio anime character illustration of {desc}. "
            f"PURE SOLID #FFFFFF STUDIO WHITE BACKGROUND from edge to edge, NO ground shadow, NO pedestal, NO background scenery. "
            f"Centered single-character full-body framing zoomed out with generous 20% pure white margin on top, bottom, left, and right so 100% of the head, feet, wings, weapons, shields, and tail fit completely inside the frame with ZERO clipping. "
            f"Crisp dark anime ink linework, vibrant cel-shaded studio coloring, clean anatomical hands, ONLY ONE SINGLE CHARACTER IN THE IMAGE (never draw duplicate figures), NO text, NO labels, NO watermarks."
        )

        success = False
        for attempt in range(1, 4):
            print(f"  Attempt {attempt}/3...", flush=True)
            before_urls = set(get_all_asb_image_urls())
            submitted = submit_prompt(prompt)
            if not submitted:
                print("  Failed to submit prompt into input element, retrying in 3s...", flush=True)
                time.sleep(3.0)
                continue

            # Poll for new ASB image
            new_img_url = None
            for _ in range(35):
                time.sleep(2.0)
                current_urls = set(get_all_asb_image_urls())
                diff = current_urls - before_urls
                if diff:
                    new_img_url = list(diff)[-1]
                    break

            if new_img_url:
                print(f"  Found new generated image: {new_img_url}", flush=True)
                # Download full-resolution image
                dl_url = new_img_url
                if "=s" in dl_url or "=w" in dl_url:
                    dl_url = re.sub(r'=[swh\d-]+$', '=w1376-h768', dl_url)
                else:
                    dl_url = dl_url + "=w1376-h768"

                try:
                    resp = requests.get(dl_url, timeout=20)
                    if resp.status_code == 200 and len(resp.content) > 30000:
                        dst_path.write_bytes(resp.content)
                        print(f"  Saved #{cid:03d} {slug} ({len(resp.content)} bytes) to {dst_path.name}!", flush=True)
                        success = True
                        break
                    else:
                        # Try without dimensions parameter
                        resp = requests.get(new_img_url, timeout=20)
                        if resp.status_code == 200 and len(resp.content) > 30000:
                            dst_path.write_bytes(resp.content)
                            print(f"  Saved #{cid:03d} {slug} raw ({len(resp.content)} bytes) to {dst_path.name}!", flush=True)
                            success = True
                            break
                except Exception as e:
                    print(f"  Download error: {e}", flush=True)

            print(f"  Attempt {attempt} timed out or failed to produce new image.", flush=True)
            time.sleep(2.0)

        if not success:
            print(f"  [Rule] 3 attempts reached for #{cid:03d}. Skipping to next character.", flush=True)
        else:
            print(f"  Cooling down {args.delay}s to maintain safe generation pacing...", flush=True)
            time.sleep(args.delay)

    print("\n[Flow] Batch generation process completed!", flush=True)


if __name__ == "__main__":
    main()
