#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Google Flow Episode 01 Live-Action Cinema Cutscenes Generator
Automates Google Chrome connected to Google Flow:
https://flow.google.com/project/72ee6e60-2819-43a6-bb8c-700a7d599bdf

Generates all 28 cutscenes for Episode 01 with:
1. Direct sheet attachments (Location Sheet + 7-head-tall Character Cutouts + Prop Sheets)
2. 70mm IMAX Photorealistic Live-Action Cinema style (Strict Zero Anime, Real human actors)
3. Visual DNA:
   - Female characters: Glamorous voluptuous hourglass figure, revealing sexy fantasy attire
   - Male characters: Chiseled hyper-muscular physiques, prominent heavy weapons
   - All characters completely silent with mouths closed
   - Strict no text / speech bubbles / watermarks
4. Saves to:
   - public/anime-character-sheets/cutscenes_liveaction/ep01_landscape/images/EP01_CUTXX_cutscene.jpg
   - public/images/cinema/episode_01/scene_XX.webp
"""

import argparse
import base64
import json
import re
import subprocess
import sys
import time
import urllib.request
from io import BytesIO
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PROMPTS_JSON = ROOT / "public" / "anime-character-sheets" / "cutscene-prompts" / "episode_01_cutscene_prompts.json"
OUT_CUTSCENES_DIR = ROOT / "public" / "anime-character-sheets" / "cutscenes_liveaction" / "ep01_landscape" / "images"
OUT_CINEMA_DIR = ROOT / "public" / "images" / "cinema" / "episode_01"


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
end tell
'''
    p = subprocess.run(['osascript', '-'], input=apple_script, capture_output=True, text=True)
    if p.returncode != 0:
        return f"ERROR: {p.stderr.strip()}"
    return p.stdout.strip()


def clear_reference_chips():
    js = """
    (() => {
        const chips = Array.from(document.querySelectorAll('.reference-ingredient-chip'));
        chips.forEach(c => {
            const btn = c.querySelector('button, mat-icon, .cancel-icon') || c;
            btn.click();
        });
        return 'CLEARED_' + chips.length;
    })()
    """
    run_js(js)
    time.sleep(0.3)


def get_current_flow_image_urls() -> list:
    js = """
    (() => {
        const imgs = Array.from(document.querySelectorAll('img'))
            .map(i => i.currentSrc || i.src)
            .filter(s => s && s.includes('flow-content.google/image/'));
        return JSON.stringify(imgs);
    })()
    """
    raw = run_js(js)
    try:
        return json.loads(raw)
    except:
        return []


def open_asset_overlay() -> bool:
    js = """
    (() => {
        const addBtn = document.querySelector('button.add-menu-trigger');
        if (!addBtn) return 'NO_ADD_BTN';
        addBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        addBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        addBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return 'OPENED';
    })()
    """
    res = run_js(js)
    time.sleep(0.8)
    return res == 'OPENED'


def close_asset_overlay():
    js = """
    (() => {
        const backdrop = document.querySelector('.cdk-overlay-backdrop');
        if (backdrop) backdrop.click();
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
        return 'CLOSED';
    })()
    """
    run_js(js)
    time.sleep(0.3)


def add_asset_to_prompt(clean_keyword: str) -> bool:
    js = f"""
    (() => {{
        const keyword = {json.dumps(clean_keyword)}.toLowerCase();
        const items = Array.from(document.querySelectorAll('.asset-item'));
        const match = items.find(i => i.innerText.toLowerCase().includes(keyword));
        if (!match) return 'NOT_FOUND';
        match.click();
        return 'CLICKED_MATCH';
    }})()
    """
    res = run_js(js)
    if res != 'CLICKED_MATCH':
        return False

    time.sleep(0.4)
    add_click_js = """
    (() => {
        const addBtn = document.querySelector('.detail-add-to-prompt-btn');
        if (!addBtn) return 'NO_DETAIL_BTN';
        addBtn.click();
        return 'ADDED';
    })()
    """
    res2 = run_js(add_click_js)
    time.sleep(0.4)
    return res2 == 'ADDED'


def attach_sheets_for_cut(cut: dict):
    # Collect filenames and keywords
    needed_keywords = []
    
    # 1. Location
    loc = cut.get('location', {})
    if loc.get('code'):
        needed_keywords.append(loc['code']) # e.g. "LOC-001" -> "LOC_001"
    if loc.get('artUrl'):
        needed_keywords.append(Path(loc['artUrl']).stem)

    # 2. Cutouts
    for co in cut.get('attachedCutouts', []):
        if co.get('nameEn'):
            needed_keywords.append(co['nameEn'])
        if co.get('code'):
            needed_keywords.append(co['code'].replace('NO.', '').strip())

    # 3. Props
    for pr in cut.get('props', []):
        if pr.get('code'):
            needed_keywords.append(pr['code'])

    # Clean keywords for matching
    cleaned = []
    for k in needed_keywords:
        k_clean = k.replace('-', '_').strip()
        if k_clean and k_clean not in cleaned:
            cleaned.append(k_clean)

    if not cleaned:
        return

    # Flow handles 1-2 reference ingredients best per prompt
    target_keywords = cleaned[:2]
    print(f"  Target reference sheets to attach: {target_keywords}")

    if not open_asset_overlay():
        print("  Warning: Failed to open asset overlay!")
        return

    attached_count = 0
    for kw in target_keywords:
        if add_asset_to_prompt(kw):
            attached_count += 1
            print(f"    + Attached sheet matching: {kw}")
        time.sleep(0.3)

    close_asset_overlay()
    print(f"  Successfully attached {attached_count} sheet(s) to prompt.")


def build_liveaction_prompt(cut: dict) -> str:
    # Summarized novel action (1-2 sentences)
    action = cut.get("novelTextEn", "").split(".")[0] + "."
    if len(action) > 180:
        action = action[:180] + "..."

    # Location description
    loc_desc = cut.get("location", {}).get("descriptionEn", "").split(",")[0]
    narration = cut.get("dialogue", {}).get("summarized6sLineEn", "")

    # Visual DNA per character types
    char_names = [c.get("nameEn") for c in cut.get("characters", [])]
    has_female = any(n in ["Elwin", "Ysela", "Aila", "Kaze", "Eliana"] for n in char_names)
    has_male = any(n in ["Aleksandar", "Balian", "Hercul", "Lucian", "Artus", "Kadan", "Grimli"] for n in char_names)

    dna_notes = []
    if has_female:
        dna_notes.append("Glamorous voluptuous hourglass figures, seductive elegant beauty, revealing fantasy attire")
    if has_male:
        dna_notes.append("Chiseled hyper-muscular rugged builds, prominently wielding heavy weapons with sharp steel reflections")

    dna_str = "; ".join(dna_notes)
    if dna_str:
        dna_str = f"CHARACTER VISUAL DNA: {dna_str}. "

    prompt = (
        f"[70MM IMAX PHOTOREALISTIC LIVE-ACTION CINEMA FILM STILL | 16:9 WIDESCREEN] "
        f"Masterpiece theatrical fantasy film still shot on ARRI Alexa 65 anamorphic lenses, Kodak Vision3 500T 35mm film. "
        f"Real living human actors with authentic skin pores, natural skin texture, subsurface scattering, weathered leather and forged steel armor. "
        f"{dna_str}"
        f"SCENE: {action} Setting: {loc_desc}. "
        f"MANDATORY SILENCE: All characters keep mouths completely closed in solemn silence (zero lip movement). "
        f"Deep male narrator: '{narration}'. "
        f"Volumetric blizzard lighting, shallow depth of field. STRICT ZERO ANIME, STRICT ZERO CARTOON, ZERO CEL-SHADING, NO TEXT."
    )

    # Ensure length <= 700 chars
    if len(prompt) > 700:
        prompt = prompt[:695] + " NO TEXT."

    return prompt.strip()


def trigger_generate_hardware_return(prompt_text: str) -> bool:
    # 1. Insert prompt text
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
        print(f"  Insert failed: {res1}")
        return False

    time.sleep(0.5)

    # 2. Trigger native hardware Return keystroke
    apple_script = '''
tell application "Google Chrome"
    repeat with w in windows
        repeat with t in tabs of w
            if URL of t contains "flow.google.com/project/72ee6e60-2819-43a6-bb8c-700a7d599bdf" then
                execute t javascript "document.querySelector('div.ProseMirror').focus();"
            end if
        end repeat
    end repeat
    activate
end tell
delay 0.3
tell application "System Events"
    keystroke return
end tell
'''
    subprocess.run(['osascript', '-'], input=apple_script, capture_output=True, text=True)
    time.sleep(0.8)

    # 3. Verify submission (pm length should be 0)
    check_js = "(() => document.querySelector('div.ProseMirror') ? document.querySelector('div.ProseMirror').innerText.trim().length : -1)()"
    res_len = run_js(check_js)
    if res_len == '0':
        print("  Prompt submitted successfully (Flow generation started)!")
        return True

    # Fallback: click submit button directly
    fallback_js = """
    (() => {
        const btn = document.querySelector('button[aria-label="생성 시작"], .generate-icon-button');
        if (btn && !btn.disabled) {
            btn.click();
            return 'FALLBACK_CLICKED';
        }
        return 'STILL_BLOCKED';
    })()
    """
    res_fb = run_js(fallback_js)
    print(f"  Fallback submit: {res_fb}")
    return res_fb == 'FALLBACK_CLICKED'


def download_image_from_url(url: str, jpg_dst: Path, webp_dst: Path) -> bool:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        im = Image.open(BytesIO(data))
        jpg_dst.parent.mkdir(parents=True, exist_ok=True)
        webp_dst.parent.mkdir(parents=True, exist_ok=True)
        jpg_dst.write_bytes(data)
        im.save(webp_dst, "WEBP", quality=92)
        print(f"  [SAVED] {jpg_dst.name} & {webp_dst.name} ({im.size[0]}x{im.size[1]}, {len(data):,} bytes)")
        return True
    except Exception as e:
        print(f"  [ERROR] Image download failed: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Generate Episode 01 Live-Action Cutscenes in Flow")
    parser.add_argument("--start-cut", type=int, default=1, help="Start cut number (1-28)")
    parser.add_argument("--end-cut", type=int, default=28, help="End cut number (1-28)")
    parser.add_argument("--force", action="store_true", help="Force regenerate existing cuts")
    args = parser.parse_args()

    OUT_CUTSCENES_DIR.mkdir(parents=True, exist_ok=True)
    OUT_CINEMA_DIR.mkdir(parents=True, exist_ok=True)

    if not PROMPTS_JSON.exists():
        print(f"Error: {PROMPTS_JSON} not found!")
        sys.exit(1)

    data = json.loads(PROMPTS_JSON.read_text())
    cutscenes = data.get("cutscenes", [])
    print(f"Loaded {len(cutscenes)} cutscenes for Episode 01.")

    success_count = 0

    for cut in cutscenes:
        c_num = cut["cutNumber"]
        if c_num < args.start_cut or c_num > args.end_cut:
            continue

        c_code = cut["cutCode"]
        jpg_dst = OUT_CUTSCENES_DIR / f"{c_code.replace('-', '_')}_cutscene.jpg"
        webp_dst = OUT_CINEMA_DIR / f"scene_{c_num:02d}.webp"

        if not args.force and jpg_dst.exists() and jpg_dst.stat().st_size > 50000:
            print(f"[{c_num:02d}/28] {c_code} already exists ({jpg_dst.stat().st_size:,} bytes). Skipping.")
            success_count += 1
            continue

        print(f"\n=======================================================")
        print(f"[{c_num:02d}/28] Generating Live-Action Cutscene: {c_code}")
        print(f"=======================================================")

        # 1. Clear previous reference chips
        clear_reference_chips()

        # 2. Attach relevant sheets (Location + Cutouts + Props)
        attach_sheets_for_cut(cut)

        # 3. Build Live-Action Prompt
        prompt = build_liveaction_prompt(cut)
        print(f"  Prompt ({len(prompt)} chars): {prompt[:110]}...")

        # 4. Snapshot existing images
        before_urls = set(get_current_flow_image_urls())
        print(f"  Existing image count in project: {len(before_urls)}")

        # 5. Submit Prompt & Trigger Hardware Return
        if not trigger_generate_hardware_return(prompt):
            print(f"  [ERROR] Failed to trigger generate for {c_code}")
            continue

        # 6. Wait for new image generation (up to 60 seconds)
        print("  Waiting for Flow image generation...", end="", flush=True)
        start_t = time.time()
        new_url = None

        for sec in range(30):
            time.sleep(2.0)
            curr_urls = set(get_current_flow_image_urls())
            diff = curr_urls - before_urls
            if diff:
                new_url = list(diff)[0]
                print(f" Done! ({time.time() - start_t:.1f}s)")
                break
            print(".", end="", flush=True)

        if not new_url:
            print(f"\n  [ERROR] Generation timed out after {time.time() - start_t:.1f}s for {c_code}")
            continue

        # 7. Direct download original bytes from signed URL
        time.sleep(1.0)
        if download_image_from_url(new_url, jpg_dst, webp_dst):
            success_count += 1

        time.sleep(1.5)

    print(f"\n=======================================================")
    print(f"Episode 01 Generation Completed: {success_count}/28 cutscenes ready!")
    print(f"Cutscenes directory: {OUT_CUTSCENES_DIR}")
    print(f"Cinema directory: {OUT_CINEMA_DIR}")
    print(f"=======================================================")


if __name__ == "__main__":
    main()
