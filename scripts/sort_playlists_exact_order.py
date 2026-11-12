#!/usr/bin/env python3
"""
Sorts SNSHero YouTube playlists into exact Episode 01 -> 40 order
by clicking each episode row's 3-dot menu -> '맨 아래로 이동' (Move to bottom) sequentially from EP01 to EP40.
"""

import asyncio
import json
import re
import shutil
import urllib.request
from pathlib import Path
from playwright.async_api import async_playwright

API_KEY = "AIzaSyBa9TidLv_iwMyB-9VSrVGWEVUr0WyjiQU"
TMP_CHROME_DIR = Path("/tmp/yt_studio_chrome_profile6")
PROFILE_DIR_NAME = "Profile 6"

PLAYLISTS = [
    ("ko_full", "PLVch67W9z4TA"),
    ("en_full", "PLFvV2raCoFww"),
    ("en_shorts", "PLR3ZkIX_CTNA"),
]


def ensure_chrome_profile():
    src_root = Path("/Users/dayyoung/Library/Application Support/Google/Chrome")
    if not TMP_CHROME_DIR.exists() or not (TMP_CHROME_DIR / PROFILE_DIR_NAME).exists():
        TMP_CHROME_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src_root / "Local State", TMP_CHROME_DIR / "Local State")
        shutil.copytree(
            src_root / PROFILE_DIR_NAME,
            TMP_CHROME_DIR / PROFILE_DIR_NAME,
            symlinks=True,
            ignore=shutil.ignore_patterns(
                "Cache*", "Code Cache*", "GPUCache*", "Service Worker*", "Singleton*", "Sessions*"
            ),
        )
    for sf in TMP_CHROME_DIR.glob("Singleton*"):
        sf.unlink(missing_ok=True)


def get_playlist_order(pid: str):
    url = f"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId={pid}&maxResults=50&key={API_KEY}"
    with urllib.request.urlopen(url) as r:
        data = json.loads(r.read().decode())
    eps = []
    for it in data.get("items", []):
        t = it["snippet"]["title"]
        m = re.search(r"(?:EP|웹툰 |쇼츠 )(\d+)", t)
        eps.append(int(m.group(1)) if m else -1)
    return eps


async def sort_one_playlist(ctx, name: str, pid: str):
    page = await ctx.new_page()
    try:
        url = f"https://www.youtube.com/playlist?list={pid}"
        print(f"[{name}] Opening {url} ...", flush=True)
        await page.goto(url, wait_until="domcontentloaded", timeout=45000)
        await page.locator("ytd-playlist-video-renderer, ytm-shorts-lockup-view-model").first.wait_for(state="visible", timeout=25000)
        await asyncio.sleep(2.5)

        is_shorts = (await page.locator("ytm-shorts-lockup-view-model").count()) > 0
        row_sel = "ytm-shorts-lockup-view-model" if is_shorts else "ytd-playlist-video-renderer"
        total = await page.locator(row_sel).count()
        print(f"[{name}] Loaded {total} rows ({'Shorts' if is_shorts else 'Full'}). Moving EP01 -> EP{total:02d} to bottom sequentially...", flush=True)

        for ep in range(1, total + 1):
            pat_str = f"{ep:02d}화:" if name.startswith("ko_") else f"EP{ep:02d}:"
            target_row = page.locator(f'{row_sel}:has-text("{pat_str}")').first
            if await target_row.count() == 0:
                print(f"[{name}] ⚠️ Could not find row for {pat_str}", flush=True)
                continue
            await target_row.scroll_into_view_if_needed()
            await asyncio.sleep(0.15)
            menu_btn = target_row.locator("button").first if is_shorts else target_row.locator("#menu button").first
            await menu_btn.click(force=True)
            await asyncio.sleep(0.55)
            move_bottom = page.locator(
                'ytd-menu-popup-renderer ytd-menu-service-item-renderer:has-text("맨 아래로 이동"), '
                'ytd-menu-popup-renderer ytd-menu-service-item-renderer:has-text("Move to bottom"), '
                'tp-yt-iron-dropdown yt-list-item-view-model:has-text("맨 아래로 이동"), '
                'tp-yt-iron-dropdown yt-list-item-view-model:has-text("Move to bottom")'
            ).first
            await move_bottom.wait_for(state="visible", timeout=5000)
            await move_bottom.click(force=True)
            await asyncio.sleep(0.95)
            if ep % 10 == 0 or ep == total:
                print(f"[{name}] Moved EP01..EP{ep:02d} to bottom.", flush=True)

        await asyncio.sleep(2.0)
        print(f"✅ [{name}] Finished sorting {pid}!", flush=True)
    finally:
        await page.close()


async def main():
    import sys
    only = sys.argv[1] if len(sys.argv) > 1 else None
    targets = [(n, p) for n, p in PLAYLISTS if not only or n == only]
    ensure_chrome_profile()
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context(
            user_data_dir=str(TMP_CHROME_DIR),
            channel="chrome",
            headless=True,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
            ignore_default_args=["--use-mock-keychain", "--password-store=basic"],
            args=[f"--profile-directory={PROFILE_DIR_NAME}", "--disable-blink-features=AutomationControlled"],
            viewport={"width": 1440, "height": 900},
        )
        await asyncio.gather(*(sort_one_playlist(ctx, name, pid) for name, pid in targets))
        await ctx.close()

    print("\n=== VERIFYING EXACT ORDER VIA YOUTUBE API v3 ===")
    for name, pid in PLAYLISTS + [("ko_shorts", "PLBmhdute5Irg")]:
        eps = get_playlist_order(pid)
        expected = list(range(1, len(eps) + 1))
        print(f"  • {name} ({pid}): count={len(eps)}, exact_1_to_{len(eps)}_order={eps == expected}")
        if eps != expected:
            print("    actual:", eps)


if __name__ == "__main__":
    asyncio.run(main())
