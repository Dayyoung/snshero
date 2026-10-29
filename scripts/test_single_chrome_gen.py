#!/usr/bin/env python3
"""
Test single solo character generation via Chrome AppleScript.
"""
import base64
from io import BytesIO
import json
from pathlib import Path
import subprocess
import sys
import time
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from solo_prompts_110 import ALL_110_SOLO_PROMPTS

FLOW_PROJECT_URL = "https://flow.google.com/project/72ee6e60-2819-43a6-bb8c-700a7d599bdf"
OUT_SOLO_DIR = ROOT / "public" / "anime-character-sheets" / "raw_solo_regenerated"


def run_js(js_code: str) -> str:
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


def get_latest_asb_urls() -> list:
    js = """
    (() => {
        const imgs = Array.from(document.querySelectorAll('img[src*="/asb/"]'))
            .map(i => i.currentSrc || i.src)
            .filter(Boolean);
        return JSON.stringify(imgs);
    })()
    """
    raw = run_js(js)
    try:
        return json.loads(raw)
    except:
        return []


def submit_prompt_and_generate(prompt_text: str) -> bool:
    # 1. Insert text
    insert_js = f"""
    (() => {{
        const pm = document.querySelector('div.ProseMirror');
        if (!pm) return 'NO_PM';
        pm.focus();
        const sel = window.getSelection();
        sel.selectAllChildren(pm);
        document.execCommand('delete', false);
        
        document.execCommand('insertText', false, {json.dumps(prompt_text)});
        pm.dispatchEvent(new InputEvent('input', {{ bubbles: true, cancelable: true, inputType: 'insertText', data: ' ' }}));
        pm.dispatchEvent(new KeyboardEvent('keydown', {{ key: 'a', code: 'KeyA', bubbles: true }}));
        pm.dispatchEvent(new KeyboardEvent('keyup', {{ key: 'a', code: 'KeyA', bubbles: true }}));
        pm.dispatchEvent(new Event('change', {{ bubbles: true }}));
        return 'INSERTED';
    }})()
    """
    res1 = run_js(insert_js)
    if res1 != 'INSERTED':
        print(f"Insert failed: {res1}", flush=True)
        return False

    # 2. Wait up to 2.5s for button to enable and click
    for _ in range(5):
        time.sleep(0.5)
        click_js = """
        (() => {
            const btn = document.querySelector('button[aria-label="생성 시작"], .generate-icon-button');
            if (!btn) return 'NO_BTN';
            if (btn.disabled) return 'STILL_DISABLED';
            btn.click();
            return 'CLICKED_GENERATE';
        })()
        """
        res2 = run_js(click_js)
        if res2 == 'CLICKED_GENERATE':
            print("Successfully clicked generate button!", flush=True)
            return True

    print(f"Submit timed out waiting for button enable: {res2}", flush=True)
    return False


def extract_canvas_b64(target_src: str) -> str:
    js = f"""
    (() => {{
        const target = {json.dumps(target_src)};
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
    return run_js(js)


def main():
    cid = 1
    slug, desc = ALL_110_SOLO_PROMPTS[cid]
    prompt = (
        f"[SOLO ANIME CHARACTER MODEL ART #{cid:03d}] "
        f"Single solo full-body 2D Japanese-Korean fantasy studio anime character illustration of {desc}. "
        f"PURE SOLID #FFFFFF STUDIO WHITE BACKGROUND from edge to edge, NO ground shadow, NO pedestal, NO background scenery. "
        f"Centered single-character full-body framing zoomed out with generous 20% pure white margin on top, bottom, left, and right so 100% of the head, feet, wings, weapons, shields, and tail fit completely inside the frame with ZERO clipping. "
        f"Crisp dark anime ink linework, vibrant cel-shaded studio coloring, clean anatomical hands, ONLY ONE SINGLE CHARACTER IN THE IMAGE (never draw duplicate figures), NO text, NO labels, NO watermarks."
    )

    print(f"Target: #{cid:03d} {slug}", flush=True)
    before_urls = set(get_latest_asb_urls())
    print(f"Existing ASB count: {len(before_urls)}", flush=True)

    submitted = submit_prompt_and_generate(prompt)
    if not submitted:
        print("Failed to submit!")
        sys.exit(1)

    print("Waiting for generation...", flush=True)
    start_t = time.time()
    new_url = None
    for sec in range(60):
        time.sleep(2.0)
        curr_urls = set(get_latest_asb_urls())
        diff = curr_urls - before_urls
        if diff:
            new_url = list(diff)[0]
            print(f"\nNew image found after {time.time() - start_t:.1f}s: {new_url[:60]}...", flush=True)
            break
        print(f"  elapsed {sec*2 + 2}s...", end="\r", flush=True)

    if not new_url:
        print("\nGeneration timed out after 60s!")
        sys.exit(1)

    # Wait 2 seconds for full render
    time.sleep(2.0)
    b64_str = extract_canvas_b64(new_url)
    if not b64_str.startswith("data:image/"):
        print(f"Extraction failed: {b64_str[:100]}")
        sys.exit(1)

    data = base64.b64decode(b64_str.split(",", 1)[1])
    im = Image.open(BytesIO(data))
    print(f"\nExtracted image: {im.size}, {len(data)} bytes")
    dst = OUT_SOLO_DIR / f"{cid:03d}_{slug}_solo.jpg"
    dst.write_bytes(data)
    print(f"Saved successfully to {dst}!")


if __name__ == "__main__":
    main()
