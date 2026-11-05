#!/usr/bin/env python3
"""
Finalize Episode 2:
1. Wait for CUT09 to complete rendering & download.
2. Submit & download CUT12 using sanitized prompt.
3. Concat all 26 clips into final Episode 2 video (no embedded subtitles).
4. Create external .srt and .vtt files (Korean & English).
5. Copy to Desktop/내문서/movie/ and public/videos/episodes/.
"""

import json
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.generate_ep02_ufotable_videos import (
    ROOT, PROMPTS_JSON, CLIPS_DIR, VID_OUT_DIR, MOVIE_DIR, PUBLIC_EP_DIR,
    run_chrome_js, ensure_flow_veo_16x9_ready, clear_video_composer,
    attach_ufo3_start_frame, download_asb_video_via_chrome_tab,
    concat_videos_no_subtitles, write_external_subtitles
)

def wait_and_download_current_tile(ccode: str, tag_id: str, dest: Path) -> bool:
    print(f"⏳ Waiting for {ccode} rendering to complete...", flush=True)
    start_t = time.time()
    video_url = None

    while time.time() - start_t < 180:
        time.sleep(3)
        tile_raw = run_chrome_js("""
        (() => {
            const c = document.querySelector('flow-grid-tile-container');
            if (!c) return JSON.stringify({ isPend: true });
            const isPend = Boolean(c.querySelector('flow-pending-tile'));
            const vt = c.querySelector('flow-video-tile');
            const raw = vt ? (vt.querySelector('img.thumbnail')?.src || vt.querySelector('video')?.src || '') : '';
            const txt = (c.innerText || '');
            return JSON.stringify({
                isPend,
                url: raw ? raw.split('=')[0] : '',
                isFail: txt.includes('실패') || txt.includes('서드 파티')
            });
        })()
        """)
        try:
            info = json.loads(tile_raw)
        except Exception:
            continue

        if info.get("isFail"):
            print(f"❌ {ccode} failed safety check!", flush=True)
            return False

        if not info.get("isPend") and info.get("url", "").startswith("https://flow.google.com/asb/"):
            video_url = info["url"]
            print(f"🎉 {ccode} completed in {time.time() - start_t:.1f}s: {video_url[:50]}", flush=True)
            break

    if not video_url:
        print(f"⚠️ {ccode} timed out waiting for render", flush=True)
        return False

    asb_mm_url = video_url + "=mm,22,15"
    print(f"⬇️ Downloading {ccode} from {asb_mm_url[:50]}...", flush=True)
    ok = download_asb_video_via_chrome_tab(asb_mm_url, dest)
    print(f"Result {ccode}: {ok} (size={dest.stat().st_size if dest.exists() else 0})", flush=True)
    return ok and dest.exists() and dest.stat().st_size > 100000


def generate_cut12() -> bool:
    cnum = 12
    ccode = "EP02-CUT12"
    tag_id = "TAG_VID_EP02_CUT12"
    dest = CLIPS_DIR / f"{ccode}.mp4"

    if dest.exists() and dest.stat().st_size > 100000:
        print(f"⏩ {ccode} already exists ({dest.stat().st_size / (1024*1024):.2f} MB)")
        return True

    print(f"\n🎬 Starting clean generation for {ccode}...")
    ensure_flow_veo_16x9_ready()
    clear_video_composer()

    for _ in range(30):
        if run_chrome_js("String(document.querySelectorAll('flow-pending-tile').length)") == "0":
            break
        time.sleep(1)

    ok_frame = attach_ufo3_start_frame(cnum)
    print(f"Frame attached: {ok_frame}")

    clean_prompt = (
        "[TAG_VID_EP02_CUT12] [VEO 3.1 LITE 6-SECOND ANIMATION PROMPT] "
        "1) ANIMATE ATTACHED START FRAME: Animate the attached 2D hand-drawn anime start frame smoothly over 6 seconds, preserving the exact character appearance and winter setting. "
        "2) MOTION & VISUAL EFFECTS: Soft snowfall falling, gentle camera pan across the holy knight and apprentice, atmospheric lighting and wind blowing the cloak fabric. "
        "3) AUDIO / SPEECH: The young apprentice speaks gently with natural lip-sync: \"Sir Knight, please cease.\" Other characters remain silent. "
        "4) NO TEXT: No subtitles, captions, or text overlays."
    )

    run_chrome_js(f"""
    (() => {{
        const pm = document.querySelector('.ProseMirror');
        if (!pm) return 'NO_PM';
        pm.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, {json.dumps(clean_prompt)});
        pm.dispatchEvent(new Event('input', {{ bubbles: true }}));
        return 'INSERTED';
    }})()
    """)
    time.sleep(0.5)

    sub = run_chrome_js("""
    (() => {
        const btn = document.querySelector('button[aria-label="생성 시작"]') || [...document.querySelectorAll('button')].find(b => (b.innerText || '').includes('arrow_forward'));
        if (btn) {
            btn.click();
            return 'CLICKED';
        }
        return 'NO_BTN';
    })()
    """)
    print(f"Submit button click: {sub}")
    time.sleep(4)
    return wait_and_download_current_tile(ccode, tag_id, dest)


def main():
    dest_cut09 = CLIPS_DIR / "EP02-CUT09.mp4"
    if not (dest_cut09.exists() and dest_cut09.stat().st_size > 100000):
        # Wait for CUT09 which was already submitted
        wait_and_download_current_tile("EP02-CUT09", "TAG_VID_EP02_CUT09", dest_cut09)

    # Now generate CUT12
    generate_cut12()

    # Verify all 26 clips
    existing_cnums = []
    missing_cnums = []
    for i in range(1, 27):
        p = CLIPS_DIR / f"EP02-CUT{i:02d}.mp4"
        if p.exists() and p.stat().st_size > 100000:
            existing_cnums.append(i)
        else:
            missing_cnums.append(i)

    print(f"\n📊 Verification: {len(existing_cnums)}/26 clips present")
    if missing_cnums:
        print(f"⚠️ Missing cuts: {missing_cnums}")
    else:
        print("🎉 ALL 26 CLIPS VERIFIED!")

    ep_data = json.loads(PROMPTS_JSON.read_text(encoding="utf-8"))
    all_cuts = ep_data["cutscenes"]
    all_clip_paths = [CLIPS_DIR / f"{c['cutCode']}.mp4" for c in all_cuts]
    valid_clips = [p for p in all_clip_paths if p.exists() and p.stat().st_size > 100000]

    print(f"\n🎬 Concatenating {len(valid_clips)} clips into integrated Episode 2 video...")
    final_mp4 = VID_OUT_DIR / "SNSHero_Anime_EP02_Oath_of_the_Seven_Pursuers_16x9.mp4"
    concat_videos_no_subtitles(valid_clips, final_mp4)

    desktop_named = MOVIE_DIR / "SNSHero_Anime_EP02_Oath_of_the_Seven_Pursuers_16x9.mp4"
    desktop_ep02 = MOVIE_DIR / "episode_02.mp4"
    shutil.copy2(final_mp4, desktop_named)
    shutil.copy2(final_mp4, desktop_ep02)

    sub_targets = [final_mp4, desktop_named, desktop_ep02]
    if PUBLIC_EP_DIR.exists():
        pub_ep02 = PUBLIC_EP_DIR / "episode_02.mp4"
        shutil.copy2(final_mp4, pub_ep02)
        sub_targets.append(pub_ep02)

    write_external_subtitles(all_cuts, sub_targets)
    print(f"✅ Successfully exported final video ({final_mp4.stat().st_size / (1024*1024):.2f} MB)")
    print(f"   Desktop: {desktop_named}")
    print(f"   External subtitles: .ko.srt, .ko.vtt, .en.srt, .en.vtt generated!")

if __name__ == "__main__":
    main()
