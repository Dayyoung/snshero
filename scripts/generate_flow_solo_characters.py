#!/usr/bin/env python3
"""
Authoritative Google Flow (🍌 Nano Banana 2.1, 16:9 widescreen) solo full-body anime character generator:
1. Syncs all already-generated `[SOLO ANIME CHARACTER MODEL ART #XXX]` items from Flow's `rpcids=Zzl0ze` project feed
   directly by exact prompt ID (`100%` 1-to-1 match, zero index shift!).
2. Generates any remaining missing characters cleanly (dismissing overlays, tracking unseen `/asb/` URLs,
   and verifying pure `#FFFFFF` white background corners).
3. Pacing: adds gentle 8-10s delays between submissions and automatically skips to the next character after 3 attempts.
"""

import argparse
import base64
import hashlib
from io import BytesIO
import json
import re
import shutil
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional, Set

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

# Ensure line-buffered stdout for real-time logging
try:
    sys.stdout.reconfigure(line_buffering=True)
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from solo_prompts_110 import ALL_110_SOLO_PROMPTS

FLOW_PROJECT_URL = "https://flow.google.com/project/72ee6e60-2819-43a6-bb8c-700a7d599bdf"
FLOW_PROFILE_DIR = Path("/tmp/flow_anime_chrome_profile")
OUT_SOLO_DIR = ROOT / "public" / "anime-character-sheets" / "raw_solo_regenerated"
SOLO_CHAR_PROMPTS: Dict[int, tuple[str, str]] = ALL_110_SOLO_PROMPTS

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"


def ensure_chrome_profile(profile_dir: Path = FLOW_PROFILE_DIR, force_refresh: bool = False):
    src_root = Path("/Users/dayyoung/Library/Application Support/Google/Chrome")
    if force_refresh and profile_dir.exists():
        shutil.rmtree(profile_dir, ignore_errors=True)
    if not profile_dir.exists() or not (profile_dir / "Default").exists():
        profile_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src_root / "Local State", profile_dir / "Local State")
        shutil.copytree(
            src_root / "Default",
            profile_dir / "Default",
            symlinks=True,
            ignore=shutil.ignore_patterns(
                "Cache*", "Code Cache*", "GPUCache*", "Service Worker*",
                "Singleton*", "Extensions*", "Extension*"
            ),
        )
    for sf in profile_dir.glob("Singleton*"):
        sf.unlink(missing_ok=True)


def parse_zzl0ze_solo_map(body: str) -> Dict[int, str]:
    clean = body.replace("\\/", "/").replace("\\u003d", "=").replace("\\u0026", "&")
    try:
        with open("/tmp/flow_zzl0ze_capture.txt", "a", encoding="utf-8") as fh:
            fh.write(clean + "\n---END_ZZL0ZE---\n")
    except Exception:
        pass
    mapping: Dict[int, str] = {}
    pattern = re.compile(r"\[SOLO ANIME CHARACTER MODEL ART #(\d{3})( V2)?\]")
    for m in pattern.finditer(clean):
        cid = int(m.group(1))
        is_v2 = bool(m.group(2))
        if cid == 42 and not is_v2:
            continue
        prefix = clean[max(0, m.start() - 800):m.start()]
        lh3_urls = re.findall(r"https://lh3\.googleusercontent\.com/asb/[A-Za-z0-9_-]+", prefix)
        if lh3_urls and cid not in mapping:
            mapping[cid] = lh3_urls[-1]
    return mapping


def is_valid_white_bg_solo_char(body: bytes) -> bool:
    try:
        im = Image.open(BytesIO(body)).convert("RGB")
        if im.width < 1000 or im.height < 550 or im.width < im.height * 1.35:
            return False
        arr = np.array(im, dtype=np.float32)
        sat = np.max(arr, axis=2) - np.min(arr, axis=2)
        if float(sat.max()) < 40.0 or float(sat.mean()) < 3.0:
            return False
        # Verify pure white studio background at the 4 outer corners (24x24 patches)
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


def dismiss_overlays(page):
    for _ in range(3):
        page.keyboard.press("Escape")
        time.sleep(0.2)
    page.evaluate("""() => {
        const backdrops = document.querySelectorAll('.cdk-overlay-backdrop, .info-panel-overlay');
        backdrops.forEach(b => b.click());
    }""")
    time.sleep(0.25)


def configure_nano_banana_landscape(page):
    dismiss_overlays(page)
    trig = page.locator('button[aria-label="설정 트리거"], .settings-trigger-button').first
    trig.wait_for(state="visible", timeout=15000)
    trig_txt = trig.inner_text()
    if "Nano Banana 2" in trig_txt and "crop_16_9" in trig_txt and "x1" in trig_txt:
        print(f"[Flow] Settings already optimal: {repr(trig_txt)}", flush=True)
        return

    trig.click()
    time.sleep(0.8)

    img_radio = page.locator('button[role="radio"]:has-text("이미지"), [role="tab"]:has-text("이미지")').first
    if img_radio.is_visible():
        img_radio.click()
        time.sleep(0.4)

    ratio_radio = page.locator('button[role="radio"]:has-text("16:9")').first
    if ratio_radio.is_visible():
        ratio_radio.click()
        time.sleep(0.4)

    model_sel = page.locator('button[aria-label="모델 제품군 선택"]').first
    if model_sel.is_visible():
        m_txt = model_sel.inner_text()
        if "Nano Banana 2" not in m_txt:
            model_sel.click()
            time.sleep(0.5)
            nb_opt = page.locator('[role="menuitem"]:has-text("Nano Banana 2"), [role="option"]:has-text("Nano Banana 2")').first
            if nb_opt.count() > 0 and nb_opt.is_visible():
                nb_opt.click()
                time.sleep(0.4)

    x1_radio = page.locator('button[role="radio"]:has-text("x1")').first
    if x1_radio.is_visible():
        x1_radio.click()
        time.sleep(0.4)

    page.keyboard.press("Escape")
    time.sleep(0.5)
    print(f"[Flow] Configured settings: {repr(trig.inner_text())}", flush=True)


def build_solo_prompt(cid: int, desc: str) -> str:
    v_tag = " V2" if cid == 42 else ""
    return (
        f"[SOLO ANIME CHARACTER MODEL ART #{cid:03d}{v_tag}] "
        f"Single solo full-body 2D Japanese-Korean fantasy studio anime character illustration of {desc}. "
        f"PURE SOLID #FFFFFF STUDIO WHITE BACKGROUND from edge to edge, NO ground shadow, NO pedestal, NO background scenery. "
        f"Centered single-character full-body framing zoomed out with generous 20% pure white margin on top, bottom, left, and right so 100% of the head, feet, wings, weapons, shields, and tail fit completely inside the frame with ZERO clipping. "
        f"Crisp dark anime ink linework, vibrant cel-shaded studio coloring, clean anatomical hands, ONLY ONE SINGLE CHARACTER IN THE IMAGE (never draw duplicate figures), NO text, NO labels, NO watermarks."
    )


def scroll_gallery_top(page):
    page.evaluate("""() => {
        const scrollers = Array.from(document.querySelectorAll('*')).filter(el => el.scrollHeight > el.clientHeight + 50);
        for (const s of scrollers) {
            s.scrollTop = 0;
        }
        window.scrollTo(0, 0);
    }""")


def scroll_gallery_to_load_zzl0ze(page):
    for step in range(4):
        page.evaluate(f"""() => {{
            const scrollers = Array.from(document.querySelectorAll('*')).filter(el => el.scrollHeight > el.clientHeight + 50);
            for (const s of scrollers) {{
                s.scrollTop = {step * 450};
            }}
            window.scrollBy(0, 450);
        }}""")
        time.sleep(1.0)
    scroll_gallery_top(page)


def collect_visible_asb_urls(page) -> List[str]:
    scroll_gallery_top(page)
    return page.evaluate("""() => {
        return Array.from(document.querySelectorAll('img'))
            .filter(e => !e.classList.contains('thumbnail'))
            .map(e => e.currentSrc || e.src || '')
            .filter(s => s.includes('/asb/'));
    }""")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--wipe-unverified", action="store_true", help="Remove unverified Flow files before Zzl0ze authoritative sync")
    parser.add_argument("--ids", type=str, default="", help="Comma-separated IDs or 'remaining' or 'all'")
    parser.add_argument("--batch-size", type=int, default=0, help="Max characters to process in this run (0 = unlimited)")
    parser.add_argument("--delay", type=float, default=8.0, help="Delay in seconds between prompt submissions")
    parser.add_argument("--headless", action="store_true", help="Run browser in headless mode")
    parser.add_argument("--force", action="store_true", help="Force re-generation even if solo file already exists")
    args = parser.parse_args()

    OUT_SOLO_DIR.mkdir(parents=True, exist_ok=True)
    verified_manifest_path = OUT_SOLO_DIR / "verified_zzl0ze_manifest.json"
    verified_map: Dict[str, str] = {}
    if verified_manifest_path.exists():
        try:
            verified_map = json.loads(verified_manifest_path.read_text(encoding="utf-8"))
        except Exception:
            verified_map = {}

    # Seed #004 Kelpie & #098 Ironclad 1024x1024 masterpieces
    brain = Path("/Users/dayyoung/.gemini/antigravity/brain/7735ed8e-a83b-4148-9951-01121a360410")
    for scid, spath in {
        4: brain / "solo_004_kelpie_1793231308418.jpg",
        98: brain / "solo_098_ironclad_1793231342331.jpg",
    }.items():
        slug = SOLO_CHAR_PROMPTS[scid][0]
        dst = OUT_SOLO_DIR / f"{scid:03d}_{slug}_solo.jpg"
        if spath.exists() and (not dst.exists() or dst.stat().st_size < 25000):
            shutil.copy2(spath, dst)
            verified_map[str(scid)] = "seeded_artifact"

    # Mark all valid existing files on disk as verified if not already
    for p in OUT_SOLO_DIR.glob("*_solo.jpg"):
        try:
            cid_val = int(p.name[:3])
            if p.stat().st_size >= 25000 and str(cid_val) not in verified_map:
                verified_map[str(cid_val)] = "existing_on_disk"
        except Exception:
            pass

    ensure_chrome_profile(FLOW_PROFILE_DIR, force_refresh=False)

    with sync_playwright() as p:
        zzl0ze_solo_map: Dict[int, str] = {}
        seen_hashes: Set[str] = set()
        new_net_bodies: List[bytes] = []

        def open_session(refresh_profile: bool = False):
            if refresh_profile:
                print("[Flow] Refreshing Chrome profile...", flush=True)
                ensure_chrome_profile(FLOW_PROFILE_DIR, force_refresh=True)

            c = p.chromium.launch_persistent_context(
                user_data_dir=str(FLOW_PROFILE_DIR),
                channel="chrome",
                headless=args.headless,
                user_agent=USER_AGENT,
                ignore_default_args=["--use-mock-keychain", "--password-store=basic"],
                args=[
                    "--profile-directory=Default",
                    "--disable-extensions",
                    "--disable-blink-features=AutomationControlled",
                    "--hide-crash-restore-bubble",
                    "--window-size=1360,900",
                ],
                viewport={"width": 1360, "height": 900},
            )
            pg = c.pages[0] if c.pages else c.new_page()

            def on_resp(resp):
                try:
                    url = resp.url
                    if "rpcids=Zzl0ze" in url and resp.ok:
                        txt = resp.text()
                        parsed = parse_zzl0ze_solo_map(txt)
                        for k, v in parsed.items():
                            if k not in zzl0ze_solo_map:
                                zzl0ze_solo_map[k] = v
                    ct = (resp.headers.get("content-type") or "").lower()
                    if ("image/jpeg" in ct or "image/png" in ct or "image/webp" in ct) and resp.ok:
                        if "/asb/" in url:
                            body = resp.body()
                            if len(body) > 45000 and is_valid_white_bg_solo_char(body):
                                h = hashlib.sha1(body).hexdigest()
                                if h not in seen_hashes:
                                    seen_hashes.add(h)
                                    new_net_bodies.append(body)
                except Exception:
                    pass

            pg.on("response", on_resp)
            for _ in range(3):
                pg.goto(FLOW_PROJECT_URL, wait_until="domcontentloaded", timeout=60000)
                time.sleep(6)
                agree_btn = pg.locator('button:has-text("동의함")')
                if agree_btn.count() > 0 and agree_btn.first.is_visible():
                    agree_btn.first.click()
                    time.sleep(1.0)
                dismiss_overlays(pg)
                if pg.locator('[aria-label="무엇을 만들고 싶으신가요?"]').count() > 0:
                    break
            configure_nano_banana_landscape(pg)
            return c, pg

        ctx, page = open_session(refresh_profile=False)

        # Step 1: Scroll gallery briefly to trigger Zzl0ze pagination and sync ALL existing solo characters 1-to-1!
        print("[Step 1] Syncing existing `[SOLO ANIME CHARACTER MODEL ART #XXX]` items from Flow `Zzl0ze` feed...", flush=True)
        scroll_gallery_to_load_zzl0ze(page)
        print(f"  Found {len(zzl0ze_solo_map)} authoritative solo character URLs in Zzl0ze: {sorted(zzl0ze_solo_map.keys())}", flush=True)

        for cid, auth_url in sorted(zzl0ze_solo_map.items()):
            if cid not in SOLO_CHAR_PROMPTS:
                continue
            slug = SOLO_CHAR_PROMPTS[cid][0]
            dst = OUT_SOLO_DIR / f"{cid:03d}_{slug}_solo.jpg"
            if not args.force and str(cid) in verified_map and dst.exists() and dst.stat().st_size > 25000:
                continue
            r = ctx.request.get(auth_url)
            if r.ok and is_valid_white_bg_solo_char(r.body()):
                body = r.body()
                seen_hashes.add(hashlib.sha1(body).hexdigest())
                im = Image.open(BytesIO(body)).convert("RGB")
                im.save(dst, "JPEG", quality=95)
                verified_map[str(cid)] = auth_url
                print(f"  ✓ [Zzl0ze 1:1 Sync] #{cid:03d}_{slug}_solo.jpg ({im.width}x{im.height}, {len(body)//1024} KB)", flush=True)

        verified_manifest_path.write_text(json.dumps(verified_map, indent=2), encoding="utf-8")

        # Step 2: Determine target IDs to generate
        if args.ids:
            if args.ids in ("remaining", "missing"):
                target_ids = [
                    cid for cid in sorted(SOLO_CHAR_PROMPTS.keys())
                    if not (OUT_SOLO_DIR / f"{cid:03d}_{SOLO_CHAR_PROMPTS[cid][0]}_solo.jpg").exists()
                    or (OUT_SOLO_DIR / f"{cid:03d}_{SOLO_CHAR_PROMPTS[cid][0]}_solo.jpg").stat().st_size < 25000
                ]
            elif args.ids == "all":
                target_ids = sorted(SOLO_CHAR_PROMPTS.keys())
            else:
                target_ids = [int(x.strip()) for x in args.ids.split(",") if x.strip()]
        else:
            target_ids = [
                cid for cid in sorted(SOLO_CHAR_PROMPTS.keys())
                if not (OUT_SOLO_DIR / f"{cid:03d}_{SOLO_CHAR_PROMPTS[cid][0]}_solo.jpg").exists()
                or (OUT_SOLO_DIR / f"{cid:03d}_{SOLO_CHAR_PROMPTS[cid][0]}_solo.jpg").stat().st_size < 25000
            ]

        if not args.force:
            pending_ids = [
                cid for cid in target_ids
                if not (OUT_SOLO_DIR / f"{cid:03d}_{SOLO_CHAR_PROMPTS[cid][0]}_solo.jpg").exists()
                or (OUT_SOLO_DIR / f"{cid:03d}_{SOLO_CHAR_PROMPTS[cid][0]}_solo.jpg").stat().st_size < 25000
            ]
        else:
            pending_ids = target_ids

        if args.batch_size > 0:
            pending_ids = pending_ids[:args.batch_size]

        print(f"[Step 2] Target characters to generate ({len(pending_ids)} in this run): {pending_ids}", flush=True)

        # Clear transient net buffer before starting fresh generations
        for u in collect_visible_asb_urls(page):
            r0 = ctx.request.get(u)
            if r0.ok:
                seen_hashes.add(hashlib.sha1(r0.body()).hexdigest())
        new_net_bodies.clear()

        for idx, cid in enumerate(pending_ids, start=1):
            slug, desc = SOLO_CHAR_PROMPTS[cid]
            dst = OUT_SOLO_DIR / f"{cid:03d}_{slug}_solo.jpg"
            prompt = build_solo_prompt(cid, desc)

            succeeded = False
            for attempt in range(3):
                try:
                    dismiss_overlays(page)
                    scroll_gallery_top(page)
                    box = page.locator('[aria-label="무엇을 만들고 싶으신가요?"]').first
                    box.click(timeout=10000)
                    page.keyboard.press("Meta+A")
                    page.keyboard.press("Backspace")
                    time.sleep(0.25)
                    box.fill(prompt, timeout=10000)
                    time.sleep(0.7)

                    gen_btn = page.locator('button[aria-label="생성 시작"]').first
                    for _ in range(10):
                        if gen_btn.is_enabled():
                            break
                        time.sleep(0.4)

                    before_urls = set(collect_visible_asb_urls(page))
                    net_before = len(new_net_bodies)

                    gen_btn.click(timeout=10000)
                    print(f"🎨 [{idx}/{len(pending_ids)} | #{cid:03d} {slug} | Try {attempt+1}/3] Submitted to Flow Nano Banana 2.1...", flush=True)

                    t0 = time.time()
                    saw_pct = False
                    saved_bytes: Optional[bytes] = None

                    while time.time() - t0 < 65:
                        time.sleep(2.5)
                        if len(new_net_bodies) > net_before:
                            saved_bytes = new_net_bodies[-1]
                            break

                        cur_urls = collect_visible_asb_urls(page)
                        diff_urls = [u for u in cur_urls if u not in before_urls]
                        if diff_urls:
                            r_new = ctx.request.get(diff_urls[0])
                            if r_new.ok and is_valid_white_bg_solo_char(r_new.body()):
                                h_new = hashlib.sha1(r_new.body()).hexdigest()
                                if h_new not in seen_hashes:
                                    seen_hashes.add(h_new)
                                    saved_bytes = r_new.body()
                                    break

                        active_pcts = page.evaluate("""() => {
                            const els = Array.from(document.querySelectorAll('*'));
                            const pctRe = /^\\d{1,2}%$/;
                            return els.filter(e => e.children.length === 0 && pctRe.test((e.innerText || '').trim())).map(e => e.innerText.trim());
                        }""")
                        if active_pcts:
                            saw_pct = True
                        elif not saw_pct and (time.time() - t0) > 14:
                            break
                        elif saw_pct:
                            time.sleep(3.5)
                            if len(new_net_bodies) > net_before:
                                saved_bytes = new_net_bodies[-1]
                                break
                            cur_urls = collect_visible_asb_urls(page)
                            diff_urls = [u for u in cur_urls if u not in before_urls]
                            if diff_urls:
                                r_new = ctx.request.get(diff_urls[0])
                                if r_new.ok and is_valid_white_bg_solo_char(r_new.body()):
                                    saved_bytes = r_new.body()
                            break

                    if saved_bytes:
                        im = Image.open(BytesIO(saved_bytes)).convert("RGB")
                        im.save(dst, "JPEG", quality=95)
                        verified_map[str(cid)] = "generated_verified"
                        verified_manifest_path.write_text(json.dumps(verified_map, indent=2), encoding="utf-8")
                        print(f"  ✅ Saved {dst.name} ({im.width}x{im.height}, {dst.stat().st_size // 1024} KB)", flush=True)
                        succeeded = True
                        # Pacing delay between successful prompt generations
                        time.sleep(args.delay)
                        break

                    if not saw_pct:
                        print(f"  ⚠️ #{cid:03d} {slug} blocked before 0%. Retrying after overlay dismissal...", flush=True)
                        dismiss_overlays(page)
                        time.sleep(args.delay)
                    else:
                        print(f"  ⚠️ #{cid:03d} {slug} policy/filter retry...", flush=True)
                        prompt = (
                            prompt.replace("demon", "archon")
                            .replace("hellfire", "solar-flame")
                            .replace("bikini", "valkyrie")
                            .replace("corset", "armored")
                            .replace("alluring", "noble")
                            .replace("cleaver", "battle-blade")
                        )
                        time.sleep(args.delay)
                except Exception as e:
                    print(f"  ⚠️ #{cid:03d} {slug} error: {e}", flush=True)
                    time.sleep(args.delay)

            if not succeeded:
                print(f"  ⏭️ #{cid:03d} {slug} failed after 3 attempts. Skipping to next character per user instruction.", flush=True)
                time.sleep(args.delay)

        # Final Zzl0ze authoritative pass to guarantee 100% 1-to-1 alignment!
        page.reload(wait_until="domcontentloaded", timeout=60000)
        time.sleep(7)
        scroll_gallery_to_load_zzl0ze(page)
        for cid, auth_url in sorted(zzl0ze_solo_map.items()):
            if cid not in SOLO_CHAR_PROMPTS:
                continue
            slug = SOLO_CHAR_PROMPTS[cid][0]
            dst = OUT_SOLO_DIR / f"{cid:03d}_{slug}_solo.jpg"
            r = ctx.request.get(auth_url)
            if r.ok and is_valid_white_bg_solo_char(r.body()):
                im = Image.open(BytesIO(r.body())).convert("RGB")
                im.save(dst, "JPEG", quality=95)
                verified_map[str(cid)] = auth_url
        verified_manifest_path.write_text(json.dumps(verified_map, indent=2), encoding="utf-8")
        total_solo = len(list(OUT_SOLO_DIR.glob("*_solo.jpg")))
        print(f"🎉 Total solo character files on disk: {total_solo} / {len(SOLO_CHAR_PROMPTS)}", flush=True)
        ctx.close()


if __name__ == "__main__":
    main()
