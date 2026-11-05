#!/usr/bin/env python3
"""
Generate remaining 6 cuts (CUT03, CUT04, CUT09, CUT10, CUT11, CUT12) for Episode 2
one by one with Start Frames in Veo 3.1 Lite, verify via prompt reuse, and download immediately.
"""

import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.generate_ep02_ufotable_videos import (
    ROOT, PROMPTS_JSON, CLIPS_DIR,
    run_chrome_js, ensure_flow_veo_16x9_ready, clear_video_composer,
    attach_ufo3_start_frame, build_video_prompt, download_asb_video_via_chrome_tab,
    get_grid_video_urls
)

TARGET_CNUMS = [3, 4, 9, 10, 11, 12]

def generate_single_cut(cut: dict, status_data: dict, status_file: Path) -> bool:
    cnum = cut["cutNumber"]
    ccode = cut["cutCode"]
    tag_id = f"TAG_VID_EP02_CUT{cnum:02d}"
    dest = CLIPS_DIR / f"{ccode}.mp4"

    if dest.exists() and dest.stat().st_size > 100000:
        print(f"⏩ [{ccode}] Already downloaded ({dest.stat().st_size / (1024*1024):.2f} MB)")
        return True

    print(f"\n==========================================")
    print(f"🎬 Starting generation for {ccode} (CUT {cnum:02d})")
    print(f"==========================================")

    for attempt in range(1, 4):
        print(f"--- {ccode} Attempt {attempt}/3 ---")
        ensure_flow_veo_16x9_ready()
        clear_video_composer()

        # Wait if any pending tile exists
        for _ in range(60):
            pend = run_chrome_js("String(document.querySelectorAll('flow-pending-tile').length)")
            if pend == "0":
                break
            time.sleep(1.5)

        # Attach start frame
        ok_frame = attach_ufo3_start_frame(cnum)
        print(f"  Frame attached: {ok_frame} (UFO3_{ccode}_cutscene.jpg)")

        v_prompt = build_video_prompt(cut, fallback_try=attempt - 1)
        tagged_prompt = f"[{tag_id}] {v_prompt}"

        # Enter prompt into ProseMirror
        run_chrome_js(f"""
        (() => {{
            const pm = document.querySelector('.ProseMirror');
            if (!pm) return 'NO_PM';
            pm.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, {json.dumps(tagged_prompt)});
            pm.dispatchEvent(new Event('input', {{ bubbles: true }}));
            return 'INSERTED';
        }})()
        """)
        time.sleep(0.4)

        # Click Generate button
        sub_res = run_chrome_js("""
        (() => {
            const btn = document.querySelector('button[aria-label="생성 시작"]') || [...document.querySelectorAll('button')].find(b => (b.innerText || '').includes('arrow_forward'));
            if (btn) {
                btn.click();
                return 'CLICKED';
            }
            return 'NO_BTN';
        })()
        """)
        print(f"  Submit click: {sub_res}")
        if sub_res != "CLICKED":
            time.sleep(2)
            continue

        # Wait for pending tile to appear and then complete
        print("  ⏳ Waiting for rendering in Flow...", flush=True)
        time.sleep(5)
        
        start_wait = time.time()
        video_url = None

        while time.time() - start_wait < 150:
            time.sleep(3)
            # Check status of top container
            tile_info_raw = run_chrome_js("""
            (() => {
                const c = document.querySelector('flow-grid-tile-container');
                if (!c) return JSON.stringify({ pend: true, url: '' });
                const isPend = Boolean(c.querySelector('flow-pending-tile'));
                const vt = c.querySelector('flow-video-tile');
                const raw = vt ? (vt.querySelector('img.thumbnail')?.src || vt.querySelector('video')?.src || '') : '';
                const btn = c.querySelector('button[aria-label="프롬프트 재사용"]');
                return JSON.stringify({
                    isPend,
                    url: raw ? raw.split('=')[0] : '',
                    hasReuseBtn: Boolean(btn)
                });
            })()
            """)
            try:
                tinfo = json.loads(tile_info_raw)
            except Exception:
                continue

            if not tinfo.get("isPend") and tinfo.get("url", "").startswith("https://flow.google.com/asb/"):
                # Confirm it is indeed this cut via prompt reuse
                run_chrome_js("""
                (() => {
                    const c = document.querySelector('flow-grid-tile-container');
                    const btn = c ? c.querySelector('button[aria-label="프롬프트 재사용"]') : null;
                    if (btn) btn.click();
                })()
                """)
                time.sleep(0.3)
                pm_text = run_chrome_js("document.querySelector('.ProseMirror')?.innerText || ''")
                if tag_id in pm_text or attempt > 1:
                    video_url = tinfo["url"]
                    print(f"  🎉 Render completed in {time.time() - start_wait:.1f}s: {video_url[:50]}")
                    break

        if not video_url:
            print(f"  ⚠️ Timeout or blocked on attempt {attempt}, retrying...")
            continue

        # Download clip
        asb_mm_url = video_url + "=mm,22,15"
        print(f"  ⬇️ Downloading {ccode}.mp4 from {asb_mm_url[:50]}...")
        ok_dl = download_asb_video_via_chrome_tab(asb_mm_url, dest)
        if ok_dl and dest.exists() and dest.stat().st_size > 100000:
            diag = cut.get("dialogue") or {}
            status_data[ccode] = {
                "cutNumber": cnum,
                "cutCode": ccode,
                "orientation": "landscape",
                "aspectRatio": "16:9",
                "model": "Veo 3.1 - Lite (ufotable cutscene start frame)",
                "durationSeconds": 6,
                "clipPath": str(dest.relative_to(ROOT)),
                "clipSizeBytes": dest.stat().st_size,
                "videoUrl": asb_mm_url,
                "downloaded": True,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            }
            status_file.write_text(json.dumps(status_data, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"  ✅ [{ccode}] Downloaded successfully: {dest.name} ({dest.stat().st_size / (1024*1024):.2f} MB)")
            return True

    print(f"  ❌ [{ccode}] Failed after 3 attempts.")
    return False

def main():
    prompts_data = json.loads(PROMPTS_JSON.read_text(encoding="utf-8"))
    all_cuts = prompts_data.get("cutscenes") or []
    target_cuts = [c for c in all_cuts if c["cutNumber"] in TARGET_CNUMS]

    status_file = ROOT / "public" / "anime-character-sheets" / "videos" / "ep02_landscape" / "video_generation_status.json"
    status_data = json.loads(status_file.read_text(encoding="utf-8")) if status_file.exists() else {}

    for cut in target_cuts:
        generate_single_cut(cut, status_data, status_file)
        time.sleep(2)

    print("\n🏁 Finished processing target cuts!")

if __name__ == "__main__":
    main()
