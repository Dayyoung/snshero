#!/usr/bin/env python3
"""
Publishes the remaining uploaded Drafts in YouTube Studio (`UCA6QmKiPstbiyBUHtnSMxyA`):
- Animation Drafts: EP03 (`S46q0D2rvGw`), EP35 (`Bl6pikr5ymI`), plus uploads & publishes EP20.
- Live-Action Movie Drafts: EP01..EP40 (`hqgXClTuKmU` .. `XhYsliWTU7M`).
Then fetches the new `cinema_playlist_id`, sorts both playlists by Episode 1..40, and updates
all game codebase files.
"""

import json
import re
import time
import urllib.request
from pathlib import Path
from typing import Dict, Optional
from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MAPPING_FILE = PROJECT_ROOT / "src/content/movieEpisodeMapping.ts"
ANIMATION_DIR = PROJECT_ROOT / "public/video/animation"
STATE_FILE = PROJECT_ROOT / "scripts/youtube_new_80_upload_state.json"

CHANNEL_ID = "UCA6QmKiPstbiyBUHtnSMxyA"
CHANNEL_UPLOAD_URL = f"https://studio.youtube.com/channel/{CHANNEL_ID}/content?d=ud"
YOUTUBE_API_KEY = "AIzaSyBa9TidLv_iwMyB-9VSrVGWEVUr0WyjiQU"

ANIMATION_PLAYLIST_TITLE = "SNSHero.com Official Animation (40 Episodes)"
CINEMA_PLAYLIST_TITLE = "SNSHero.com Official Live-Action Movie (40 Episodes)"

CHROME_PROFILE_DIR = Path("/tmp/yt_studio_chrome_profile6")

ANIM_DRAFT_IDS: Dict[int, str] = {
    3: "S46q0D2rvGw",
    35: "Bl6pikr5ymI",
}

MOVIE_DRAFT_IDS: Dict[int, str] = {
    1: "hqgXClTuKmU",
    2: "2jpYqSWisPY",
    3: "ljjK219a0cI",
    4: "ol3LL1JLlFk",
    5: "w5A-AqOoHWk",
    6: "YwgQxJnrUoU",
    7: "zx-1QssUPgY",
    8: "ccEaASjLzKs",
    9: "HJYTeMT65c4",
    10: "Au_0oIumS04",
    11: "SCY8rZihVLA",
    12: "YQ7rqAJRBDg",
    13: "FZHP6tG4nzc",
    14: "FhixunWgakQ",
    15: "KMxhfkPl5m0",
    16: "bOZ5Z1Uwz44",
    17: "5OgR-UspmX0",
    18: "Cit__2pWFIQ",
    19: "4-gcgUMvmtE",
    20: "bKIPiN_jdhc",
    21: "0uILIAaxdfA",
    22: "s09C3rBS-vE",
    23: "Fpzt5YREh54",
    24: "I9sX2389akQ",
    25: "uUbJ3BSn5Pk",
    26: "EAK-mqWUrmQ",
    27: "WPU86qXaK7U",
    28: "qnfcDcZHQUk",
    29: "GCVyfSarF_s",
    30: "ROHgE2HYiOQ",
    31: "a8yVBdM-g1U",
    32: "MeHCwSZ9L0w",
    33: "RAJ6Gnj5n-k",
    34: "keFt3mFEWG8",
    35: "eGrTvFSAKX4",
    36: "BUaO_f34zn4",
    37: "oJDSZgX-t2Q",
    38: "u_bP6qwBIog",
    39: "-6BTjINE22Q",
    40: "XhYsliWTU7M",
}


def log(msg: str) -> None:
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "animation_playlist_id": "PLWJoj18KXId0",
        "cinema_playlist_id": None,
        "animation_ids": {},
        "cinema_ids": {},
    }


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")


def fetch_playlist_id_by_title(target_title: str) -> Optional[str]:
    url = (
        f"https://www.googleapis.com/youtube/v3/playlists"
        f"?part=snippet,contentDetails&channelId={CHANNEL_ID}&maxResults=50&key={YOUTUBE_API_KEY}"
    )
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        for item in data.get("items", []):
            title = item.get("snippet", {}).get("title", "")
            if title.strip() == target_title.strip():
                return item.get("id")
    except Exception as e:
        log(f"Warning fetching playlist ID via API for '{target_title}': {e}")
    return None


def publish_draft_video(page, vid: str, yt_title: str, playlist_title: str, ep: int, label: str) -> bool:
    log(f"[{label} EP{ep:02d}] Publishing Draft {vid} -> '{yt_title}'...")
    page.goto(f"https://studio.youtube.com/video/{vid}/edit", wait_until="domcontentloaded", timeout=40000)
    time.sleep(3.2)

    edit_draft_btn = page.locator(
        'ytcp-button#action-1, ytcp-button:has-text("초안 수정"), ytcp-button:has-text("Edit draft")'
    ).first
    if edit_draft_btn.count() == 0 or not edit_draft_btn.is_visible():
        # Already published!
        log(f"[{label} EP{ep:02d}] Video {vid} has no Edit Draft button (already published)!")
        return True

    edit_draft_btn.click()
    time.sleep(2.0)

    dialog = page.locator("ytcp-uploads-dialog")

    # Ensure title is set cleanly
    title_box = dialog.locator("#title-textarea #textbox").first
    if title_box.count() > 0 and title_box.is_visible():
        title_box.click()
        page.keyboard.press("Meta+A")
        page.keyboard.press("Backspace")
        title_box.fill(yt_title)
        time.sleep(0.3)

    # Select Playlist
    playlist_trigger = dialog.locator("ytcp-video-metadata-playlists").first
    if playlist_trigger.count() > 0:
        playlist_trigger.scroll_into_view_if_needed()
        playlist_trigger.click(force=True)
        time.sleep(1.8)

        pl_item = page.locator(f'ytcp-playlist-dialog label:has-text("{playlist_title}")').first
        if pl_item.count() > 0:
            pl_item.click()
            time.sleep(0.6)

        pl_done = page.locator(
            'ytcp-playlist-dialog ytcp-button#done-button, ytcp-playlist-dialog button:has-text("완료"), ytcp-playlist-dialog button:has-text("Done")'
        ).first
        if pl_done.count() > 0:
            pl_done.click()
            time.sleep(0.8)

    # Not Made For Kids
    not_mfk = dialog.locator('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]').first
    not_mfk.scroll_into_view_if_needed()
    not_mfk.click()
    time.sleep(0.5)

    # Visibility -> Public
    step3 = dialog.locator("#step-badge-3").first
    step3.click()
    time.sleep(1.0)

    pub_radio = dialog.locator('tp-yt-paper-radio-button[name="PUBLIC"]').first
    pub_radio.wait_for(state="visible", timeout=10000)
    pub_radio.click()
    time.sleep(0.6)

    done_btn = dialog.locator("#done-button").first
    for _ in range(30):
        disabled_attr = done_btn.get_attribute("disabled")
        aria_disabled = done_btn.get_attribute("aria-disabled")
        if disabled_attr is None and aria_disabled != "true":
            break
        time.sleep(1.0)

    done_btn.click()
    log(f"[{label} EP{ep:02d}/40] PUBLISHED -> https://youtu.be/{vid}")
    time.sleep(3.5)
    return True


def upload_and_publish_anim_ep20(page, playlist_title: str) -> Optional[str]:
    ep = 20
    title_en = "The Wave That Swallowed the Flower Ship"
    yt_title = f"SNSHero.com Animation EP20 - {title_en}"
    yt_desc = (
        f"🎨 SNSHero.com Official Animation — Episode 20: {title_en}\n\n"
        f"⚔️ Visit https://snshero.com now to play the game and experience the full 40-episode saga!\n\n"
        f"👉 Play Free Now: https://snshero.com/animation?ep=20\n"
    )
    matches = sorted(ANIMATION_DIR.glob("SNSHero.com_E20_*.mp4"))
    mp4_path = matches[0] if matches else (ANIMATION_DIR / f"SNSHero.com_E20_{title_en}.mp4")
    log(f"[ANIM EP20] Uploading {mp4_path.name}...")
    page.goto(CHANNEL_UPLOAD_URL, wait_until="domcontentloaded", timeout=45000)
    time.sleep(3.5)

    file_input = page.locator("input[type=file]")
    if file_input.count() == 0:
        create_btn = page.locator("ytcp-button#create-icon, #create-icon").first
        if create_btn.count() > 0:
            create_btn.click()
            time.sleep(1.5)
            upload_item = page.locator("tp-yt-paper-item#text-item-0").first
            if upload_item.count() > 0:
                upload_item.click()
                time.sleep(2.0)

    file_input = page.locator("input[type=file]").first
    file_input.set_input_files(str(mp4_path))

    dialog = page.locator("ytcp-uploads-dialog")
    video_id = None
    for _ in range(45):
        time.sleep(1.0)
        links = dialog.locator("a[href*='youtu.be']")
        if links.count() > 0:
            href = links.first.get_attribute("href") or ""
            if "youtu.be/" in href:
                video_id = href.split("youtu.be/")[-1].split("?")[0].strip()
                if video_id:
                    break

    if not video_id:
        log("[ANIM EP20] Could not detect video_id")
        return None

    log(f"[ANIM EP20] Assigned Video ID: {video_id}")
    title_box = dialog.locator("#title-textarea #textbox").first
    title_box.wait_for(state="visible", timeout=15000)
    title_box.click()
    page.keyboard.press("Meta+A")
    page.keyboard.press("Backspace")
    title_box.fill(yt_title)
    time.sleep(0.4)

    desc_box = dialog.locator("#description-textarea #textbox").first
    if desc_box.count() > 0:
        desc_box.click()
        page.keyboard.press("Meta+A")
        page.keyboard.press("Backspace")
        desc_box.fill(yt_desc)
        time.sleep(0.4)
        title_box.click()
        time.sleep(0.3)

    playlist_trigger = dialog.locator("ytcp-video-metadata-playlists").first
    playlist_trigger.scroll_into_view_if_needed()
    playlist_trigger.click(force=True)
    time.sleep(1.8)
    pl_item = page.locator(f'ytcp-playlist-dialog label:has-text("{playlist_title}")').first
    if pl_item.count() > 0:
        pl_item.click()
        time.sleep(0.6)
    pl_done = page.locator(
        'ytcp-playlist-dialog ytcp-button#done-button, ytcp-playlist-dialog button:has-text("완료")'
    ).first
    if pl_done.count() > 0:
        pl_done.click()
        time.sleep(0.8)

    not_mfk = dialog.locator('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]').first
    not_mfk.scroll_into_view_if_needed()
    not_mfk.click()
    time.sleep(0.5)

    step3 = dialog.locator("#step-badge-3").first
    step3.click()
    time.sleep(1.0)

    pub_radio = dialog.locator('tp-yt-paper-radio-button[name="PUBLIC"]').first
    pub_radio.wait_for(state="visible", timeout=10000)
    pub_radio.click()
    time.sleep(0.6)

    done_btn = dialog.locator("#done-button").first
    for _ in range(60):
        disabled_attr = done_btn.get_attribute("disabled")
        aria_disabled = done_btn.get_attribute("aria-disabled")
        if disabled_attr is None and aria_disabled != "true":
            break
        time.sleep(1.0)

    done_btn.click()
    log(f"[ANIM EP20/40] PUBLISHED -> https://youtu.be/{video_id}")
    time.sleep(4.0)
    return video_id


def parse_episodes() -> Dict[int, str]:
    text = MAPPING_FILE.read_text(encoding="utf-8")
    episodes: Dict[int, str] = {}
    pattern = re.compile(r"episodeNumber:\s*(\d+).*?titleEn:\s*\"([^\"]+)\"", re.DOTALL)
    for m in pattern.finditer(text):
        episodes[int(m.group(1))] = m.group(2)
    return episodes


def main() -> None:
    state = load_state()
    ep_titles = parse_episodes()

    pl_id = fetch_playlist_id_by_title(CINEMA_PLAYLIST_TITLE)
    if pl_id:
        state["cinema_playlist_id"] = pl_id
        log(f"Detected Cinema Playlist ID: {pl_id}")
    # Also record EP01 of Movie which was just published in test
    state["cinema_ids"]["1"] = MOVIE_DRAFT_IDS[1]
    save_state(state)

    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=str(CHROME_PROFILE_DIR),
            channel="chrome",
            headless=True,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            ignore_default_args=["--use-mock-keychain", "--password-store=basic"],
            args=["--profile-directory=Profile 6", "--disable-blink-features=AutomationControlled"],
            viewport={"width": 1440, "height": 900},
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()

        # 1. Publish remaining Animation Drafts (EP03, EP35) & upload EP20
        for ep, vid in ANIM_DRAFT_IDS.items():
            if str(ep) not in state["animation_ids"]:
                title_en = ep_titles.get(ep, f"Episode {ep}")
                yt_title = f"SNSHero.com Animation EP{ep:02d} - {title_en}"
                if publish_draft_video(page, vid, yt_title, ANIMATION_PLAYLIST_TITLE, ep, "ANIM"):
                    state["animation_ids"][str(ep)] = vid
                    save_state(state)

        if "20" not in state["animation_ids"]:
            vid20 = upload_and_publish_anim_ep20(page, ANIMATION_PLAYLIST_TITLE)
            if vid20:
                state["animation_ids"]["20"] = vid20
                save_state(state)

        # 2. Publish Movie Drafts EP02..EP40
        for ep in range(2, 41):
            if str(ep) in state["cinema_ids"] and state["cinema_ids"][str(ep)]:
                continue
            vid = MOVIE_DRAFT_IDS[ep]
            title_en = ep_titles.get(ep, f"Episode {ep}")
            yt_title = f"SNSHero.com The Movie EP{ep:02d} - {title_en}"
            try:
                if publish_draft_video(page, vid, yt_title, CINEMA_PLAYLIST_TITLE, ep, "MOVIE"):
                    state["cinema_ids"][str(ep)] = vid
                    save_state(state)
            except Exception as e:
                log(f"[MOVIE EP{ep:02d}] Error publishing draft {vid}: {e}")
                time.sleep(2.0)

        ctx.close()

    if not state.get("cinema_playlist_id"):
        pl_id = fetch_playlist_id_by_title(CINEMA_PLAYLIST_TITLE)
        if pl_id:
            state["cinema_playlist_id"] = pl_id
            save_state(state)

    # Update codebase via upload_new_animation_and_cinema_80_yt.update_codebase
    from upload_new_animation_and_cinema_80_yt import update_codebase
    update_codebase(state)

    log(
        f"ALL PUBLISHED! Animation: {len(state['animation_ids'])}/40 ({state.get('animation_playlist_id')}), "
        f"Movie: {len(state['cinema_ids'])}/40 ({state.get('cinema_playlist_id')})"
    )


if __name__ == "__main__":
    main()
