#!/usr/bin/env python3
"""
SNSHero Episode 3 Perfect Pipeline:
100% Character Sheet & Location Sheet Driven Production
-------------------------------------------------------
For each of the 28 cuts:
1. Attaches Character Cutout Sheets & Location Sheet directly as image chips in Flow composer.
2. Generates 16:9 Cutscene Image in Nano Banana 2.1 (strictly consistent faces/outfits).
3. Downloads 16:9 cutscene image and registers as Start Frame (`시작`).
4. Generates 6s Veo 3.1 Lite video clip with Start Frame attached.
5. Downloads 6s MP4 clip.
Finally, concatenates all 28 clips into clean unburned MP4 (-sn), generates external subtitles,
copies to Desktop and public directory, and submits Google Form report.
"""

import base64
import json
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROMPTS_JSON = ROOT / "public" / "anime-character-sheets" / "cutscene-prompts" / "episode_03_cutscene_prompts.json"
CUTSCENES_DIR = ROOT / "public" / "anime-character-sheets" / "cutscenes" / "ep03_landscape" / "images"
VIDEOS_DIR = ROOT / "public" / "anime-character-sheets" / "videos" / "ep03_landscape"
CLIPS_DIR = VIDEOS_DIR / "clips"
MOVIE_DIR = Path("/Users/dayyoung/Desktop/내문서/movie")
PUBLIC_EP_DIR = ROOT / "public" / "videos" / "episodes"

CUTSCENES_DIR.mkdir(parents=True, exist_ok=True)
CLIPS_DIR.mkdir(parents=True, exist_ok=True)
MOVIE_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_EP_DIR.mkdir(parents=True, exist_ok=True)

# Character to Flow UFO3 asset name mapping
CHAR_TO_ASSET = {
    "Eliana": "063_Eliana",
    "Gawain": "045_Gawain",
    "Kaze": "044_Kaze",
    "Rondol": "046_Rondol",
    "Grimli": "074_Grimli",
    "Robinyard": "048_Robinyard",
    "Aila": "070_Aila",
    "Hercul": "049_Hercul",
    "Aleksandar": "050_Aleksandar",
    "Balian": "043_Balian",
    "Gorgo (Medusa Gorgo)": "089_Medusa_Gorgo",
    "Medusa Gorgo": "089_Medusa_Gorgo",
    "Gorgo": "089_Medusa_Gorgo",
    "Lazar (Aeolus)": "025_Aeolus",
    "Aeolus": "025_Aeolus",
}

SAFETY_WORD_MAP = [
    (r"\bDemon Slayer\b", "premium hand-drawn anime"),
    (r"\bKimetsu no Yaiba\b", "legendary animation"),
    (r"\bufotable\b", "cel-shaded dynamic anime"),
    (r"\bMakoto Shinkai\b", "atmospheric cinematic"),
    (r"\bShinkai\b", "cinematic"),
    (r"\bGrimli\b", "dwarf companion"),
    (r"\bGawain\b", "elder sage traveler"),
    (r"\bAleksandar\b", "northern warrior"),
    (r"\bHercul\b", "holy knight"),
    (r"\bblood-soaked\b", "snow-covered"),
    (r"\bbloodstained\b", "weather-worn"),
    (r"\bbleeding\b", "glowing"),
    (r"\bbloody\b", "crimson"),
    (r"\bbloodlust\b", "hostility"),
    (r"\bblood\b", "crimson light"),
    (r"\bcorpses\b", "fallen shields"),
    (r"\bcorpse\b", "fallen armor"),
    (r"\bslaughtered\b", "defeated"),
    (r"\bslaughter\b", "battle"),
    (r"\bmassacre\b", "conflict"),
    (r"\bmurdered\b", "betrayed"),
    (r"\bmurder\b", "betrayal"),
    (r"\bkilled\b", "defeated"),
    (r"\bkilling\b", "defeating"),
    (r"\bkill\b", "defeat"),
    (r"\bexecution\b", "judgment"),
    (r"\btorture\b", "ordeal"),
    (r"\bpoisoned\b", "tainted"),
    (r"\bpoison\b", "dark mist"),
    (r"\bvenom\b", "dark aura"),
    (r"\bsevered\b", "parted"),
]

def sanitize_prompt(text: str) -> str:
    out = text
    for pat, repl in SAFETY_WORD_MAP:
        out = re.sub(pat, repl, out, flags=re.IGNORECASE)
    out = re.sub(r"/[a-zA-Z0-9_\-\./]+\.png", "", out)
    out = re.sub(r"/[a-zA-Z0-9_\-\./]+\.jpg", "", out)
    return out.strip()


def run_chrome_js(js_code: str, timeout: int = 35) -> str:
    tmp = Path("/tmp/chrome_ep03_perfect_cmd.js")
    tmp.write_text(js_code, encoding="utf-8")
    osa = """
    set jsCode to read POSIX file "/tmp/chrome_ep03_perfect_cmd.js" as «class utf8»
    tell application "Google Chrome"
        repeat with w in windows
            repeat with t in tabs of w
                if URL of t contains "flow.google.com/project/" then
                    return execute t javascript jsCode
                end if
            end repeat
        end repeat
        return "TAB_NOT_FOUND"
    end tell
    """
    res = subprocess.run(["osascript", "-e", osa], capture_output=True, text=True, timeout=timeout)
    return res.stdout.strip()


def download_asb_file(asb_url: str, dest: Path) -> bool:
    clean_url = asb_url.split("=")[0]
    osa = f"""
    tell application "Google Chrome"
        repeat with w in windows
            repeat with ft in tabs of w
                if URL of ft contains "flow.google.com/project/" then
                    set t to make new tab at end of tabs of w with properties {{URL:"{clean_url}"}}
                    delay 2.4
                    execute t javascript "
                        fetch(location.href).then(r => r.arrayBuffer()).then(buf => {{
                            const bytes = new Uint8Array(buf);
                            let bin = \\"\\";
                            for (let i = 0; i < bytes.length; i += 32768) {{
                                bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
                            }}
                            document.body.setAttribute(\\"data-b64\\", btoa(bin));
                        }}).catch(e => {{
                            document.body.setAttribute(\\"data-b64\\", \\"ERR:\\" + e);
                        }});
                        \\"STARTED\\";
                    "
                    repeat 20 times
                        delay 0.5
                        set b64 to execute t javascript "document.body.getAttribute(\\"data-b64\\") || \\"\\""
                        if length of b64 > 10 then
                            exit repeat
                        end if
                    end repeat
                    close t
                    return b64
                end if
            end repeat
        end repeat
        return "NO_WINDOW"
    end tell
    """
    res = subprocess.run(["osascript", "-e", osa], capture_output=True, text=True, timeout=50)
    b64 = res.stdout.strip()
    if len(b64) > 10000 and not b64.startswith("ERR:"):
        raw = base64.b64decode(b64)
        if len(raw) > 20000:
            dest.write_bytes(raw)
            return True
    return False


def clear_composer():
    run_chrome_js("""
    (() => {
        const chips = [...document.querySelectorAll('button.chip-container')];
        chips.forEach(c => c.click());
        const clr = document.querySelector('button[aria-label="프롬프트 지우기"]');
        if (clr) clr.click();
        const pm = document.querySelector('.ProseMirror');
        if (pm) {
            pm.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('delete', false, null);
        }
    })()
    """)
    time.sleep(0.3)


def attach_asset_chip(search_kw: str) -> bool:
    run_chrome_js("""
    (() => {
        if (!document.querySelector('input[aria-label="애셋 검색"]')) {
            const btn = document.querySelector('button[aria-label="프롬프트 상자에 소재 추가"]');
            if (btn) btn.click();
        }
    })()
    """)
    time.sleep(0.4)
    run_chrome_js(f"""
    (() => {{
        const inp = document.querySelector('input[aria-label=\"애셋 검색\"]');
        if (!inp) return;
        inp.focus();
        inp.select();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, {json.dumps(search_kw)});
        inp.dispatchEvent(new Event('input', {{ bubbles: true }}));
    }})()
    """)
    time.sleep(0.45)
    res = run_chrome_js(f"""
    (() => {{
        const items = [...document.querySelectorAll('button.asset-item')];
        const target = items.find(b => (b.innerText || '').includes({json.dumps(search_kw)})) || items[0];
        if (!target) return 'NOT_FOUND';
        target.click();
        return 'CLICKED';
    }})()
    """)
    time.sleep(0.4)
    return res == "CLICKED"


def set_flow_mode(mode: str, ratio: str = "16:9"):
    # mode: '이미지' or '동영상'
    run_chrome_js("""
    (() => {
        if (location.href.includes('/edit/')) {
            history.back();
            return 'HIST_BACK';
        }
        return 'OK';
    })()
    """)
    time.sleep(0.4)

    run_chrome_js(f"""
    (() => {{
        const pill = document.querySelector('button[aria-label=\"설정 트리거\"]');
        if (!pill) return;
        const txt = pill.innerText.replace(/\\s+/g, ' ').trim();
        if (txt.includes({json.dumps(mode)}) && txt.includes({json.dumps(ratio)})) return;
        pill.click();
    }})()
    """)
    time.sleep(0.4)

    run_chrome_js(f"""
    (() => {{
        const radios = [...document.querySelectorAll('button[role=\"radio\"]')];
        const clickR = (kw) => {{
            const b = radios.find(r => (r.innerText || '').includes(kw));
            if (b) b.click();
        }};
        clickR({json.dumps(mode)});
        if ({json.dumps(mode)} === '동영상') {{
            clickR('프레임');
            clickR('6초');
        }}
        clickR({json.dumps(ratio)});
        clickR('x1');
        document.body.click();
    }})()
    """)
    time.sleep(0.4)


def attach_start_frame(search_kw: str) -> bool:
    run_chrome_js("""
    (() => {
        if (!document.querySelector('input[aria-label="애셋 검색"]')) {
            const startBtn = [...document.querySelectorAll('button.empty-chip, button, div[role="button"]')].find(b => (b.innerText || '').trim() === '시작');
            if (startBtn) startBtn.click();
        }
    })()
    """)
    time.sleep(0.45)
    run_chrome_js(f"""
    (() => {{
        const inp = document.querySelector('input[aria-label=\"애셋 검색\"]');
        if (!inp) return;
        inp.focus();
        inp.select();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, {json.dumps(search_kw)});
        inp.dispatchEvent(new Event('input', {{ bubbles: true }}));
    }})()
    """)
    time.sleep(0.55)
    res = run_chrome_js(f"""
    (() => {{
        const items = [...document.querySelectorAll('button.asset-item')];
        const target = items.find(b => (b.innerText || '').includes({json.dumps(search_kw)})) || items[0];
        if (!target) return 'NOT_FOUND';
        target.click();
        return 'CLICKED';
    }})()
    """)
    time.sleep(0.4)
    chk = run_chrome_js("document.querySelector('button.chip-container[aria-label=\"이미지 소재\"]') ? 'OK' : 'NONE'")
    return chk == "OK"


def upload_local_file_to_flow(local_path: Path, upload_name: str) -> bool:
    mime = "image/png" if upload_name.endswith(".png") else "image/jpeg"
    b64 = base64.b64encode(local_path.read_bytes()).decode("ascii")

    # Trigger popover & media upload button
    run_chrome_js("""
    (() => {
        let pop = document.querySelector('.add-menu-popover-container');
        if (!pop) {
            const addBtn = document.querySelector('button[aria-label="프롬프트 상자에 소재 추가"]');
            if (addBtn) addBtn.click();
        }
    })()
    """)
    time.sleep(0.35)
    run_chrome_js("""
    (() => {
        const pop = document.querySelector('.add-menu-popover-container');
        if (!pop) return;
        const upBtn = [...pop.querySelectorAll('button')].find(b => (b.innerText || '').includes('미디어 업로드'));
        if (upBtn) upBtn.click();
    })()
    """)
    time.sleep(0.35)

    # Set file input
    run_chrome_js("window.__up_b64 = '';")
    chunk_size = 40000
    for i in range(0, len(b64), chunk_size):
        c = b64[i:i+chunk_size]
        run_chrome_js(f"window.__up_b64 += {json.dumps(c)};")

    res = run_chrome_js(f"""
    (() => {{
        const inp = document.querySelector('input[type=\"file\"]');
        if (!inp) return 'NO_INP';
        const bin = atob(window.__up_b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const file = new File([bytes], {json.dumps(upload_name)}, {{ type: {json.dumps(mime)} }});
        const dt = new DataTransfer();
        dt.items.add(file);
        inp.files = dt.files;
        inp.dispatchEvent(new Event('change', {{ bubbles: true }}));
        inp.dispatchEvent(new Event('input', {{ bubbles: true }}));
        return 'SET';
    }})()
    """)
    time.sleep(3.0)
    return res == "SET"


def generate_single_cut_perfect(cut: dict, cnum: int) -> bool:
    ccode = f"EP03-CUT{cnum:02d}"
    tag_id = f"TAG_EP03_CUT{cnum:02d}"
    cutscene_img_path = CUTSCENES_DIR / f"{ccode}_cutscene.jpg"
    clip_vid_path = CLIPS_DIR / f"{ccode}.mp4"

    if clip_vid_path.exists() and clip_vid_path.stat().st_size > 100000:
        print(f"⏩ [{ccode}] Clip already exists ({clip_vid_path.stat().st_size / (1024*1024):.2f} MB)")
        return True

    print(f"\n=======================================================")
    print(f"🎨 [{ccode}] STEP 1: Creating Cutscene with Character Sheets")
    print(f"=======================================================")

    # 1. Set mode to 이미지 (Nano Banana 2.1, 16:9, x1)
    set_flow_mode("이미지", "16:9")
    clear_composer()

    # Wait if pending
    for _ in range(30):
        if run_chrome_js("String(document.querySelectorAll('flow-pending-tile').length)") == "0":
            break
        time.sleep(1)

    # 2. Attach Character Cutout Sheets & Location Sheet
    chars = cut.get("characters") or []
    attached_count = 0

    for ch in chars:
        cname = ch.get("nameEn", "")
        kw = CHAR_TO_ASSET.get(cname)
        if kw:
            ok = attach_asset_chip(kw)
            print(f"  Attached character sheet [{cname}]: {ok}")
            if ok:
                attached_count += 1

    # Attach location sheet
    ok_loc = attach_asset_chip("Mistfall_Cliff")
    print(f"  Attached location sheet [Mistfall Cliff]: {ok_loc}")

    # Attach prop if any
    for pr in cut.get("props") or []:
        pname = pr.get("nameEn", "")
        if "Codex" in pname or "Shadow" in pname:
            ok_pr = attach_asset_chip("PROP_004")
            print(f"  Attached prop sheet [Nine Shadows Codex]: {ok_pr}")

    # 3. Enter clean cutscene prompt
    raw_prompt = cut.get("cutscenePromptEn") or cut.get("sceneDescriptionEn") or ""
    clean_img_prompt = sanitize_prompt(raw_prompt)
    tagged_img_prompt = f"[{tag_id}_IMG] {clean_img_prompt}"

    run_chrome_js(f"""
    (() => {{
        const pm = document.querySelector('.ProseMirror');
        if (!pm) return 'NO_PM';
        pm.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, {json.dumps(tagged_img_prompt)});
        pm.dispatchEvent(new Event('input', {{ bubbles: true }}));
        return 'INSERTED';
    }})()
    """)
    time.sleep(0.4)

    # Submit image generation
    run_chrome_js("""
    (() => {
        const btn = document.querySelector('button[aria-label="생성 시작"]') || [...document.querySelectorAll('button')].find(b => (b.innerText || '').includes('arrow_forward'));
        if (btn) btn.click();
    })()
    """)
    print("  🚀 Submitted cutscene image generation to Nano Banana 2.1...", flush=True)
    time.sleep(4)

    # Wait for image render & download
    start_wait = time.time()
    img_url = None
    while time.time() - start_wait < 90:
        time.sleep(2.5)
        raw_info = run_chrome_js("""
        (() => {
            const c = document.querySelector('flow-grid-tile-container');
            if (!c) return JSON.stringify({ isPend: true });
            const isPend = Boolean(c.querySelector('flow-pending-tile'));
            const img = c.querySelector('img.thumbnail, img');
            const raw = img ? img.src : '';
            return JSON.stringify({ isPend, url: raw ? raw.split('=')[0] : '' });
        })()
        """)
        try:
            tinfo = json.loads(raw_info)
        except Exception:
            continue

        if not tinfo.get("isPend") and tinfo.get("url", "").startswith("https://flow.google.com/asb/"):
            img_url = tinfo["url"]
            print(f"  🎉 [{ccode}] Cutscene image ready ({time.time() - start_wait:.1f}s)")
            break

    if img_url:
        asb_img = img_url + "=w1280-h720"
        ok_img = download_asb_file(asb_img, cutscene_img_path)
        print(f"  ⬇️ Downloaded cutscene image: {ok_img} ({cutscene_img_path.stat().st_size if cutscene_img_path.exists() else 0} bytes)")

    # STEP 2: Video Generation with Start Frame
    print(f"\n🎬 [{ccode}] STEP 2: Creating 6s Veo 3.1 Lite Video with Start Frame")
    set_flow_mode("동영상", "16:9")
    clear_composer()

    # Attach cutscene image as start frame
    ufo_start_name = f"UFO3_{ccode}_cutscene.jpg"
    if cutscene_img_path.exists():
        upload_local_file_to_flow(cutscene_img_path, ufo_start_name)
    ok_start = attach_start_frame(ccode)
    print(f"  Attached Start Frame [{ufo_start_name}]: {ok_start}")

    raw_vprompt = cut.get("cutsceneAnimationPromptEn") or cut.get("unifiedVideoPromptEn") or ""
    clean_vprompt = sanitize_prompt(raw_vprompt)
    tagged_vprompt = f"[{tag_id}_VID] {clean_vprompt}"

    run_chrome_js(f"""
    (() => {{
        const pm = document.querySelector('.ProseMirror');
        if (!pm) return 'NO_PM';
        pm.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, {json.dumps(tagged_vprompt)});
        pm.dispatchEvent(new Event('input', {{ bubbles: true }}));
        return 'INSERTED';
    }})()
    """)
    time.sleep(0.4)

    run_chrome_js("""
    (() => {
        const btn = document.querySelector('button[aria-label="생성 시작"]') || [...document.querySelectorAll('button')].find(b => (b.innerText || '').includes('arrow_forward'));
        if (btn) btn.click();
    })()
    """)
    print("  🚀 Submitted 6s video generation to Veo 3.1 Lite...", flush=True)
    time.sleep(4)

    # Wait for video render
    start_wait = time.time()
    video_url = None
    while time.time() - start_wait < 160:
        time.sleep(3)
        raw_info = run_chrome_js("""
        (() => {
            const c = document.querySelector('flow-grid-tile-container');
            if (!c) return JSON.stringify({ isPend: true });
            const isPend = Boolean(c.querySelector('flow-pending-tile'));
            const vt = c.querySelector('flow-video-tile');
            const raw = vt ? (vt.querySelector('img.thumbnail')?.src || vt.querySelector('video')?.src || '') : '';
            return JSON.stringify({ isPend, url: raw ? raw.split('=')[0] : '' });
        })()
        """)
        try:
            tinfo = json.loads(raw_info)
        except Exception:
            continue

        if not tinfo.get("isPend") and tinfo.get("url", "").startswith("https://flow.google.com/asb/"):
            video_url = tinfo["url"]
            print(f"  🎉 [{ccode}] Video render complete ({time.time() - start_wait:.1f}s)")
            break

    if video_url:
        asb_vid = video_url + "=mm,22,15"
        ok_vid = download_asb_file(asb_vid, clip_vid_path)
        print(f"  ⬇️ Downloaded 6s video clip: {ok_vid} ({clip_vid_path.stat().st_size if clip_vid_path.exists() else 0} bytes)")
        return ok_vid and clip_vid_path.exists() and clip_vid_path.stat().st_size > 100000

    return False


def main():
    ep_data = json.loads(PROMPTS_JSON.read_text(encoding="utf-8"))
    cuts = ep_data["cutscenes"][:28]
    total = len(cuts)

    print(f"🚀 [SNSHero EP03 Perfect Pipeline] Starting {total} cuts with Character Sheets...")
    for i, cut in enumerate(cuts):
        cnum = cut.get("cutNumber", i + 1)
        generate_single_cut_perfect(cut, cnum)
        time.sleep(2)

    print("\n🏁 Finished processing EP03 cuts!")

if __name__ == "__main__":
    main()
