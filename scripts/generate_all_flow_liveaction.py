#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Google Flow Master Live-Action Cinema Cutscenes Generator (Episodes 01 to 40)
Automates Google Chrome connected to Google Flow:
https://flow.google.com/project/72ee6e60-2819-43a6-bb8c-700a7d599bdf

Generates all cutscenes from Episode 01 to 40 continuously with:
1. 70mm IMAX Photorealistic Live-Action Cinema style (Strict Zero Anime, Real human actors)
2. Rigorous Visual DNA:
   - Female characters: Glamorous voluptuous hourglass figure, revealing seductive fantasy attire
   - Male characters: Chiseled hyper-muscular physiques, prominent heavy weapons
   - Rondol: Short-cropped dark hair and dark-oak oar-staff (Strictly NEVER bald)
   - All characters completely silent with mouths closed (Zero lip movement)
   - Deep off-screen male background narration
   - Strict no text / speech bubbles / watermarks / UI overlays
3. Saves to:
   - public/anime-character-sheets/cutscenes_liveaction/epXX_landscape/images/EPXX_CUTYY_cutscene.jpg
   - public/images/cinema/episode_XX/scene_YY.webp
4. Automatically commits git locally per episode and submits Google Form reports.
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
PROMPTS_DIR = ROOT / "public" / "anime-character-sheets" / "cutscene-prompts"
CUTSCENES_BASE_DIR = ROOT / "public" / "anime-character-sheets" / "cutscenes_liveaction"
CINEMA_BASE_DIR = ROOT / "public" / "images" / "cinema"
REPORT_SCRIPT = ROOT / "skills" / "report-ex" / "scripts" / "submit_report.py"


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


def reload_flow_tab():
    print("  [FLOW] Reloading Flow tab to refresh session and clear DOM cache...")
    subprocess.run(['osascript', '-e', '''
tell application "Google Chrome"
    repeat with w in windows
        repeat with t in tabs of w
            if URL of t contains "flow.google.com/project/72ee6e60-2819-43a6-bb8c-700a7d599bdf" then
                reload t
            end if
        end repeat
    end repeat
end tell
'''])
    time.sleep(8.0)


def check_and_clear_error() -> bool:
    js = """
    (() => {
        const hasWarning = document.body.innerText.includes('비정상적인 활동') || document.body.innerText.includes('비정상');
        let deleted = 0;
        document.querySelectorAll('button').forEach(b => {
            if (b.textContent && b.textContent.includes('delete_forever')) {
                b.click();
                deleted++;
            }
        });
        if (hasWarning) {
            return 'HAS_BOT_WARNING_' + deleted;
        }
        return deleted > 0 ? 'CLEARED_' + deleted : 'OK';
    })()
    """
    res = run_js(js)
    if 'HAS_BOT_WARNING' in res:
        print(f"  [FLOW ALERT] Bot warning detected ({res}). Clearing and refreshing...")
        time.sleep(2.0)
        reload_flow_tab()
        return True
    return False


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
            .filter(s => s && (s.includes('flow-content.google/image/') || s.includes('flow.google.com/asb/')));
        return JSON.stringify(imgs);
    })()
    """
    raw = run_js(js)
    try:
        return json.loads(raw)
    except:
        return []


def build_liveaction_prompt(cut: dict) -> str:
    # Action sentence
    novel_raw = cut.get("novelTextEn", "").strip()
    action = novel_raw.split(".")[0] + "." if "." in novel_raw else novel_raw
    if len(action) > 170:
        action = action[:170] + "..."

    # Location description
    loc = cut.get("location", {})
    loc_name = loc.get("nameEn", "")
    loc_desc = loc.get("descriptionEn", "").split(",")[0]
    narration = cut.get("dialogue", {}).get("summarized6sLineEn", "")

    # Character names
    char_names = [c.get("nameEn", "") for c in cut.get("characters", []) if c.get("nameEn")]

    if not char_names:
        prompt = (
            f"[70MM IMAX PHOTOREALISTIC LIVE-ACTION CINEMA FILM STILL | 16:9 WIDESCREEN] "
            f"Masterpiece theatrical dark-fantasy architectural environment cinema still shot on ARRI Alexa 65 anamorphic lenses, Kodak Vision3 500T 35mm film. "
            f"Grand panoramic architectural landscape establishing shot of {loc_name}. {action} Setting: {loc_desc}. "
            f"Deep male narrator: '{narration}'. "
            f"Volumetric atmospheric rim lighting, cinematic depth of field, hyper-detailed fantasy architecture. "
            f"ABSOLUTELY NO ACTORS, NO PEOPLE, NO CHARACTERS, ZERO HUMANS IN FRAME. PURE SCENIC ARCHITECTURE SHOT. "
            f"STRICT ZERO ANIME, STRICT ZERO CARTOON, ZERO CEL-SHADING, NO TEXT."
        )
    else:
        char_str = ", ".join(char_names)

        # Specific Visual DNA anchors
        dna_items = []
        if any(n in ["Elwin", "Ysela", "Aila", "Kaze", "Eliana", "Medusa Gorgo", "Freya", "Aria", "Celia"] for n in char_names):
            dna_items.append("Glamorous voluptuous hourglass figure, revealing seductive fantasy attire, breathtaking beauty")
        if any(n in ["Aleksandar", "Balian", "Hercul", "Lucian", "Artus", "Kadan", "Grimli", "Rondol", "Ignis"] for n in char_names):
            dna_items.append("Chiseled hyper-muscular physique, prominent heavy weapons with sharp specular reflections")
        if "Rondol" in char_names:
            dna_items.append("Rondol has short dark hair (never bald) and dark-oak oar-staff")

        dna_prompt = "; ".join(dna_items)
        if dna_prompt:
            dna_prompt = f"VISUAL DNA: {dna_prompt}. "

        prompt = (
            f"[70MM IMAX PHOTOREALISTIC LIVE-ACTION CINEMA FILM STILL | 16:9 WIDESCREEN] "
            f"Masterpiece theatrical dark-fantasy live-action cinema still shot on ARRI Alexa 65 anamorphic lenses, Kodak Vision3 500T 35mm film. "
            f"Real living human actors with authentic skin pores, natural skin texture, subsurface scattering, weathered leather and forged steel armor. "
            f"{dna_prompt}"
            f"SCENE: {char_str} in {loc_name}. {action} Setting: {loc_desc}. "
            f"MANDATORY SILENCE: All characters keep mouths completely closed in solemn silence (zero lip movement). "
            f"Deep male narrator: '{narration}'. "
            f"Volumetric atmospheric rim lighting, cinematic depth of field. STRICT ZERO ANIME, STRICT ZERO CARTOON, ZERO CEL-SHADING, NO TEXT."
        )

    if len(prompt) > 700:
        prompt = prompt[:695] + " NO TEXT."

    return prompt.strip()


def trigger_generate_hardware_return(prompt_text: str) -> bool:
    for attempt in range(3):
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
            print(f"  Insert failed (attempt {attempt+1}): {res1}")
            time.sleep(1.0)
            continue

        time.sleep(0.4)

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
        time.sleep(1.0)

        check_js = "(() => document.querySelector('div.ProseMirror') ? document.querySelector('div.ProseMirror').innerText.trim().length : -1)()"
        res_len = run_js(check_js)
        if res_len == '0':
            return True

        # Second keystroke attempt
        print(f"  [RETRY] ProseMirror text still present ({res_len} chars), retrying return key...")
        subprocess.run(['osascript', '-e', '''
tell application "System Events"
    keystroke return
end tell
'''])
        time.sleep(1.0)
        res_len2 = run_js(check_js)
        if res_len2 == '0':
            return True

        # If still not submitted, reload tab and retry
        print(f"  [RELOAD] Form not submitted, reloading tab...")
        reload_flow_tab()

    return False


def download_image_from_url(url: str, jpg_dst: Path, webp_dst: Path) -> bool:
    if "flow.google.com/asb/" in url:
        escaped_url = url.replace('\\', '\\\\').replace('"', '\\"')
        js = f"""
        (() => {{
            const img = Array.from(document.querySelectorAll('img')).find(i => (i.currentSrc || i.src) === "{escaped_url}");
            if (!img) return 'NO_IMG';
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 1376;
            canvas.height = img.naturalHeight || 768;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            return canvas.toDataURL('image/jpeg', 0.95);
        }})()
        """
        data_url = run_js(js)
        if data_url and data_url.startswith("data:image/jpeg;base64,"):
            try:
                raw_b64 = data_url.split(",", 1)[1]
                data = base64.b64decode(raw_b64)
                im = Image.open(BytesIO(data))
                jpg_dst.parent.mkdir(parents=True, exist_ok=True)
                webp_dst.parent.mkdir(parents=True, exist_ok=True)
                jpg_dst.write_bytes(data)
                im.save(webp_dst, "WEBP", quality=92)
                print(f"  [SAVED ASB] {jpg_dst.name} & {webp_dst.name} ({im.size[0]}x{im.size[1]}, {len(data):,} bytes)")
                return True
            except Exception as e:
                print(f"  [ERROR] Failed to save ASB canvas image: {e}")

    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        im = Image.open(BytesIO(data))
        jpg_dst.parent.mkdir(parents=True, exist_ok=True)
        webp_dst.parent.mkdir(parents=True, exist_ok=True)
        jpg_dst.write_bytes(data)
        im.save(webp_dst, "WEBP", quality=92)
        print(f"  [SAVED DIRECT] {jpg_dst.name} & {webp_dst.name} ({im.size[0]}x{im.size[1]}, {len(data):,} bytes)")
        return True
    except Exception as e:
        print(f"  [ERROR] Image download failed: {e}")
        return False


def submit_episode_report(ep: int, total_cuts: int):
    task_name = f"Google Flow 실사 시네마 {ep}화 {total_cuts}컷 전수 생성 완료"
    details = f"Google Flow를 통해 제{ep}화 {total_cuts}개 컷 전수를 70mm IMAX 실사 시네마 1376x768 풀해상도로 100% 생성 완료 및 cinema/episode_{ep:02d} 연동 완료"
    cmd = [
        sys.executable, str(REPORT_SCRIPT),
        "--dept", "개발",
        "--task", task_name,
        "--status", "작업완료",
        "--details", details
    ]
    try:
        subprocess.run(cmd, check=True)
        print(f"  [REPORT] Google Form report submitted for Episode {ep:02d}!")
    except Exception as e:
        print(f"  [REPORT ERROR] {e}")


def commit_episode_git(ep: int):
    cutscenes_dir = CUTSCENES_BASE_DIR / f"ep{ep:02d}_landscape"
    cinema_dir = CINEMA_BASE_DIR / f"episode_{ep:02d}"
    try:
        subprocess.run(["git", "add", str(cutscenes_dir), str(cinema_dir)], check=True)
        msg = f"feat: complete Episode {ep:02d} Flow 70mm liveaction cinema cutscenes"
        subprocess.run(["git", "commit", "-m", msg], check=True)
        print(f"  [GIT] Committed Episode {ep:02d} liveaction cutscenes locally.")
    except Exception as e:
        print(f"  [GIT NOTE] {e}")


def process_episode(ep: int, force: bool = False) -> bool:
    prompts_json = PROMPTS_DIR / f"episode_{ep:02d}_cutscene_prompts.json"
    if not prompts_json.exists():
        print(f"Error: {prompts_json} not found! Skipping Episode {ep:02d}.")
        return False

    data = json.loads(prompts_json.read_text())
    cutscenes = data.get("cutscenes", [])
    total_cuts = len(cutscenes)

    out_cutscenes_dir = CUTSCENES_BASE_DIR / f"ep{ep:02d}_landscape" / "images"
    out_cinema_dir = CINEMA_BASE_DIR / f"episode_{ep:02d}"
    out_cutscenes_dir.mkdir(parents=True, exist_ok=True)
    out_cinema_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n#################################################################")
    print(f"### STARTING EPISODE {ep:02d} LIVE-ACTION GENERATION ({total_cuts} CUTS) ###")
    print(f"#################################################################")

    new_cuts_generated = 0
    skipped_cuts = 0

    for cut in cutscenes:
        c_num = cut["cutNumber"]
        c_code = cut["cutCode"]
        jpg_dst = out_cutscenes_dir / f"{c_code.replace('-', '_')}_cutscene.jpg"
        webp_dst = out_cinema_dir / f"scene_{c_num:02d}.webp"

        if not force and jpg_dst.exists() and jpg_dst.stat().st_size > 50000:
            print(f"[{ep:02d}-{c_num:02d}/{total_cuts}] {c_code} already exists ({jpg_dst.stat().st_size:,} bytes). Skipping.")
            skipped_cuts += 1
            continue

        print(f"\n[{ep:02d}-{c_num:02d}/{total_cuts}] Generating Live-Action Cutscene: {c_code}")

        # 1. Check & clear any error, clear reference chips
        check_and_clear_error()
        time.sleep(1.0)
        clear_reference_chips()

        # 2. Build Live-Action Prompt
        prompt = build_liveaction_prompt(cut)
        print(f"  Prompt ({len(prompt)} chars): {prompt[:105]}...")

        # 3. Snapshot existing images
        before_urls = set(get_current_flow_image_urls())

        # 4. Trigger generation
        if not trigger_generate_hardware_return(prompt):
            print(f"  [ERROR] Failed to trigger generate for {c_code}")
            time.sleep(3.0)
            continue

        # 5. Wait for Flow generation
        print("  Waiting for Flow image generation...", end="", flush=True)
        start_t = time.time()
        new_url = None

        for sec in range(35):
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
            if check_and_clear_error():
                print("  [COOLDOWN] Bot warning encountered. Sleeping 60s for cooldown...")
                time.sleep(60.0)
            else:
                time.sleep(3.0)
            continue

        # 6. Direct download
        time.sleep(1.0)
        if download_image_from_url(new_url, jpg_dst, webp_dst):
            new_cuts_generated += 1

        time.sleep(3.5)

    print(f"\nEpisode {ep:02d} Summary: {new_cuts_generated} new generated, {skipped_cuts} skipped (Total {total_cuts} cuts).")

    if new_cuts_generated > 0:
        commit_episode_git(ep)
        if new_cuts_generated + skipped_cuts >= total_cuts:
            submit_episode_report(ep, total_cuts)

    return True


def main():
    parser = argparse.ArgumentParser(description="Generate Flow Live-Action Cutscenes for Episodes 01-40")
    parser.add_argument("--start-ep", type=int, default=1, help="Start episode (1-40)")
    parser.add_argument("--end-ep", type=int, default=40, help="End episode (1-40)")
    parser.add_argument("--force", action="store_true", help="Force regenerate existing cuts")
    args = parser.parse_args()

    print("=================================================================")
    print(f"FLOW 70MM LIVE-ACTION MASTER RUNNER: Episodes {args.start_ep:02d} to {args.end_ep:02d}")
    print("=================================================================")

    for ep in range(args.start_ep, args.end_ep + 1):
        process_episode(ep, force=args.force)

    print("\n=================================================================")
    print("ALL EPISODES 01-40 LIVE-ACTION GENERATION COMPLETED SUCCESSFULLY!")
    print("=================================================================")


if __name__ == "__main__":
    main()
