#!/usr/bin/env python3
import hashlib
from io import BytesIO
import json
from pathlib import Path
import sys
import time

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from solo_prompts_110 import ALL_110_SOLO_PROMPTS

FLOW_PROJECT_URL = "https://flow.google.com/project/72ee6e60-2819-43a6-bb8c-700a7d599bdf"
FLOW_PROFILE_DIR = Path("/tmp/flow_anime_chrome_profile")
OUT_SOLO_DIR = ROOT / "public" / "anime-character-sheets" / "raw_solo_regenerated"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

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

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        user_data_dir=str(FLOW_PROFILE_DIR),
        channel="chrome",
        headless=False,
        user_agent=USER_AGENT,
        ignore_default_args=["--use-mock-keychain", "--password-store=basic"],
        args=["--profile-directory=Default", "--disable-blink-features=AutomationControlled"],
        viewport={"width": 1360, "height": 900},
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()

    new_net_bodies = []
    seen_hashes = set()

    def on_resp(resp):
        try:
            url = resp.url
            ct = (resp.headers.get("content-type") or "").lower()
            if ("image/jpeg" in ct or "image/png" in ct or "image/webp" in ct) and resp.ok:
                if "/asb/" in url:
                    body = resp.body()
                    if len(body) > 40000:
                        h = hashlib.sha1(body).hexdigest()
                        if h not in seen_hashes:
                            seen_hashes.add(h)
                            new_net_bodies.append(body)
                            print(f"  [Net] Captured asb image: {len(body)} bytes", flush=True)
        except Exception:
            pass

    page.on("response", on_resp)

    print("Navigating to Flow project...", flush=True)
    page.goto(FLOW_PROJECT_URL, wait_until="domcontentloaded", timeout=60000)
    time.sleep(8)

    agree = page.locator('button:has-text("동의함")')
    if agree.count() > 0 and agree.first.is_visible():
        agree.first.click()
        time.sleep(1.0)

    for _ in range(3):
        page.keyboard.press("Escape")
        time.sleep(0.2)

    # Configure Nano Banana 2.1 16:9 x1
    trig = page.locator('button[aria-label="설정 트리거"], .settings-trigger-button').first
    trig.wait_for(state="visible", timeout=20000)
    trig_txt = trig.inner_text()
    print(f"Current setting: {repr(trig_txt)}", flush=True)

    if not ("Nano Banana 2" in trig_txt and "crop_16_9" in trig_txt and "x1" in trig_txt):
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
        x1_radio = page.locator('button[role="radio"]:has-text("x1")').first
        if x1_radio.is_visible():
            x1_radio.click()
            time.sleep(0.4)
        page.keyboard.press("Escape")
        time.sleep(0.5)
        print(f"Configured setting: {repr(trig.inner_text())}", flush=True)

    # Click prompt box
    box = page.locator('[aria-label="무엇을 만들고 싶으신가요?"]').first
    box.wait_for(state="visible", timeout=15000)
    box.click()
    page.keyboard.press("Meta+A")
    page.keyboard.press("Backspace")
    time.sleep(0.3)
    box.fill(prompt)
    time.sleep(0.8)

    gen_btn = page.locator('button[aria-label="생성 시작"]').first
    for _ in range(15):
        if gen_btn.is_enabled():
            break
        time.sleep(0.3)

    net_before = len(new_net_bodies)
    print("Clicking Generate button...", flush=True)
    gen_btn.click()

    t0 = time.time()
    saved = False
    while time.time() - t0 < 70:
        time.sleep(2.0)
        if len(new_net_bodies) > net_before:
            body = new_net_bodies[-1]
            dst = OUT_SOLO_DIR / f"{cid:03d}_{slug}_solo.jpg"
            im = Image.open(BytesIO(body)).convert("RGB")
            im.save(dst, "JPEG", quality=95)
            print(f"🎉 SUCCESS! Saved {dst.name} ({im.width}x{im.height}, {dst.stat().st_size // 1024} KB)", flush=True)
            saved = True
            break
        # Check percentage
        pcts = page.evaluate("""() => {
            const els = Array.from(document.querySelectorAll('*'));
            return els.filter(e => e.children.length === 0 && /^\\d{1,2}%$/.test((e.innerText || '').trim())).map(e => e.innerText.trim());
        }""")
        if pcts:
            print(f"  Progress: {pcts[0]}", flush=True)

    if not saved:
        print("Timed out waiting for image generation.", flush=True)

    ctx.close()
