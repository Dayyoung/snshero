#!/usr/bin/env python3
"""
Publishes all 80 newly uploaded 1:1 synced Drafts in YouTube Studio (`UC_xayYwKaB5TbH3eZXeREpA`, Profile 2):
- Animation 40 Episodes (`6kug0HSmtOM` .. `5BPT1AqJs-0`) -> Playlist `PLBTRBTakaSNU` ("SNSHero.com Official Animation (40 Episodes - Synced)")
- Live-Action Movie 40 Episodes (`6ILGHhuYK2c` .. `7VqUeRqXAMQ`) -> Playlist `PLeb-8Xpcho0o` ("SNSHero.com Official Live-Action Movie (40 Episodes - Synced)")
Then updates all game codebase files with the new video IDs and playlist IDs.
"""

import json
import re
import time
from pathlib import Path
from typing import Dict
from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MAPPING_FILE = PROJECT_ROOT / "src/content/movieEpisodeMapping.ts"
STATE_FILE = PROJECT_ROOT / "scripts/youtube_upload_synced_80_state.json"

CHANNEL_ID = "UC_xayYwKaB5TbH3eZXeREpA"
CHROME_PROFILE_DIR = Path("/tmp/yt_studio_chrome_profile2")

ANIMATION_PLAYLIST_TITLE = "SNSHero.com Official Animation (40 Episodes - Synced)"
ANIMATION_PLAYLIST_ID = "PLBTRBTakaSNU"

CINEMA_PLAYLIST_TITLE = "SNSHero.com Official Live-Action Movie (40 Episodes - Synced)"
CINEMA_PLAYLIST_ID = "PLeb-8Xpcho0o"

ANIM_DRAFT_IDS: Dict[int, str] = {
    1: "6kug0HSmtOM",
    2: "HLFnzl4vfwQ",
    3: "wn0herrP5CM",
    4: "FFssBSsO1os",
    5: "VhKw00p5MZI",
    6: "BPe62yt_aSc",
    7: "icdz25VLIN0",
    8: "lzD3K4_Fwlc",
    9: "PLPD-l1pDhw",
    10: "U2OAL12GrN8",
    11: "s_HhKeEyC4k",
    12: "racur7v3lQ4",
    13: "gyCX44ckqiI",
    14: "34nJeBSoB1g",
    15: "rHFEdkS4KEA",
    16: "ryQYPqhdyTw",
    17: "xwZHZpx9w3s",
    18: "qxoDokotaIc",
    19: "knpyUQe0cyQ",
    20: "XEKSdTEdPLU",
    21: "aL3zLBW5xHY",
    22: "3bu5d3O2kg0",
    23: "F-FzojQMh70",
    24: "UKi06n5Q9i0",
    25: "0ZFJyrNh8IQ",
    26: "L4gEwVwMme8",
    27: "yAF_X-e0Wk4",
    28: "Tm5f96DrFi8",
    29: "N43zx0Y4Cf0",
    30: "9aOxrXLyD58",
    31: "A_XpRDYJNnA",
    32: "gj0hZ0GhJC4",
    33: "B5G_TgWeACA",
    34: "R3S4dOM6tpk",
    35: "hh5tvdMFzE0",
    36: "YB-LvyrNjo0",
    37: "FSm6xzqZImg",
    38: "2Hj0RQczRY8",
    39: "1-vtwbKT2bM",
    40: "5BPT1AqJs-0",
}

MOVIE_DRAFT_IDS: Dict[int, str] = {
    1: "6ILGHhuYK2c",
    2: "lxo9BHaOaRM",
    3: "OSZd-qopMWM",
    4: "uDHKq3-Mt28",
    5: "O7lGH7sG5-o",
    6: "0FRcHsZTvuY",
    7: "wypdn6NbqJc",
    8: "_a7SdTeUTOQ",
    9: "sN1QmA8GAdE",
    10: "Rbzv2DH-qNk",
    11: "tNxpxtQU6lM",
    12: "aW2hlBa_sUk",
    13: "3Mq244loqh0",
    14: "kV4peNyH1LM",
    15: "9mWBmZfu3b8",
    16: "abIXGXG3cgA",
    17: "Ic8cO9eTkgg",
    18: "ZXJdAl8PghI",
    19: "DbzMTVyf2VI",
    20: "MOKWje9FDs4",
    21: "kg3FyYUmlPs",
    22: "fN8PsfXi-nA",
    23: "jl2tNlbXOWw",
    24: "vXdmveS3Tv8",
    25: "7AQekCVG07s",
    26: "bTqF2mbmUTw",
    27: "0d95Rf-An3Q",
    28: "LLF5fdB2kkM",
    29: "fvTBRd0CKWg",
    30: "41dLLTvFqZs",
    31: "rGHsIv5jAjg",
    32: "iMvB51cxToI",
    33: "DWZSWi9YXH0",
    34: "4zxD8a7_D1w",
    35: "2M9tGnRBD7k",
    36: "-TLtBrgH2vQ",
    37: "Aa6jLN55ats",
    38: "YTjNu_x2yJA",
    39: "mMeh7bWB-DQ",
    40: "7VqUeRqXAMQ",
}


def log(msg: str) -> None:
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            st = json.loads(STATE_FILE.read_text(encoding="utf-8"))
            st["animation_playlist_id"] = ANIMATION_PLAYLIST_ID
            st["cinema_playlist_id"] = CINEMA_PLAYLIST_ID
            return st
        except Exception:
            pass
    return {
        "animation_playlist_id": ANIMATION_PLAYLIST_ID,
        "cinema_playlist_id": CINEMA_PLAYLIST_ID,
        "animation_ids": {},
        "cinema_ids": {},
    }


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")


def parse_episodes() -> Dict[int, str]:
    text = MAPPING_FILE.read_text(encoding="utf-8")
    episodes: Dict[int, str] = {}
    pattern = re.compile(r"episodeNumber:\s*(\d+).*?titleEn:\s*\"([^\"]+)\"", re.DOTALL)
    for m in pattern.finditer(text):
        episodes[int(m.group(1))] = m.group(2)
    return episodes


def publish_draft_video(page, vid: str, yt_title: str, playlist_title: str, ep: int, label: str) -> bool:
    log(f"[{label} EP{ep:02d}/40] Publishing Draft {vid} -> '{yt_title}'...")
    page.goto(f"https://studio.youtube.com/video/{vid}/edit", wait_until="domcontentloaded", timeout=45000)
    time.sleep(3.0)

    edit_draft_btn = page.locator(
        'ytcp-button#action-1, ytcp-button:has-text("초안 수정"), ytcp-button:has-text("Edit draft")'
    ).first
    if edit_draft_btn.count() > 0 and edit_draft_btn.is_visible():
        edit_draft_btn.click()
        time.sleep(2.0)
        dialog = page.locator("ytcp-uploads-dialog")
    else:
        # Either already published or inside video details view directly
        log(f"[{label} EP{ep:02d}/40] Video {vid} has no Edit Draft button (already published)!")
        return True

    # Ensure title is set cleanly
    title_box = dialog.locator("#title-textarea #textbox").first
    if title_box.count() > 0 and title_box.is_visible():
        title_box.click()
        page.keyboard.press("Meta+A")
        page.keyboard.press("Backspace")
        title_box.fill(yt_title)
        time.sleep(0.3)

    # Select Playlist safely
    try:
        playlist_trigger = dialog.locator("ytcp-video-metadata-playlists").first
        if playlist_trigger.count() > 0:
            playlist_trigger.scroll_into_view_if_needed()
            playlist_trigger.click(force=True)
            time.sleep(1.5)

            pl_dialog = page.locator("ytcp-playlist-dialog")
            pl_item = pl_dialog.locator(f'label:has-text("{playlist_title}")').first
            if pl_item.count() > 0:
                pl_item.click()
                time.sleep(0.5)

            pl_done = pl_dialog.locator(
                'ytcp-button#done-button, button:has-text("완료"), button:has-text("Done")'
            ).first
            if pl_done.count() > 0 and pl_done.is_visible():
                pl_done.click()
                time.sleep(0.6)
            else:
                page.keyboard.press("Escape")
                time.sleep(0.5)
    except Exception as e:
        log(f"[{label} EP{ep:02d}] Playlist selection warning: {e}")
        page.keyboard.press("Escape")
        time.sleep(0.5)

    # Not Made For Kids
    not_mfk = dialog.locator('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]').first
    not_mfk.scroll_into_view_if_needed()
    not_mfk.click()
    time.sleep(0.4)

    # Visibility -> Public
    step3 = dialog.locator("#step-badge-3").first
    step3.click()
    time.sleep(1.0)

    pub_radio = dialog.locator('tp-yt-paper-radio-button[name="PUBLIC"]').first
    pub_radio.wait_for(state="visible", timeout=10000)
    pub_radio.click()
    time.sleep(0.5)

    done_btn = dialog.locator("#done-button").first
    for _ in range(30):
        disabled_attr = done_btn.get_attribute("disabled")
        aria_disabled = done_btn.get_attribute("aria-disabled")
        if disabled_attr is None and aria_disabled != "true":
            break
        time.sleep(1.0)

    done_btn.click()
    log(f"[{label} EP{ep:02d}/40] PUBLISHED -> https://youtu.be/{vid}")
    time.sleep(3.0)
    return True


def main() -> None:
    state = load_state()
    save_state(state)
    ep_titles = parse_episodes()

    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=str(CHROME_PROFILE_DIR),
            channel="chrome",
            headless=True,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            ignore_default_args=["--use-mock-keychain", "--password-store=basic"],
            args=["--profile-directory=Profile 2", "--disable-blink-features=AutomationControlled"],
            viewport={"width": 1440, "height": 900},
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()

        # 1. Publish Animation Drafts EP01..EP40
        for ep in range(1, 41):
            if str(ep) in state["animation_ids"] and state["animation_ids"][str(ep)] == ANIM_DRAFT_IDS[ep]:
                continue
            vid = ANIM_DRAFT_IDS[ep]
            title_en = ep_titles.get(ep, f"Episode {ep}")
            yt_title = f"SNSHero.com Animation EP{ep:02d} - {title_en}"
            try:
                if publish_draft_video(page, vid, yt_title, ANIMATION_PLAYLIST_TITLE, ep, "ANIM"):
                    state["animation_ids"][str(ep)] = vid
                    save_state(state)
            except Exception as e:
                log(f"[ANIM EP{ep:02d}] Error publishing draft {vid}: {e}")
                time.sleep(2.0)

        # 2. Publish Live-Action Movie Drafts EP01..EP40
        for ep in range(1, 41):
            if str(ep) in state["cinema_ids"] and state["cinema_ids"][str(ep)] == MOVIE_DRAFT_IDS[ep]:
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

    from upload_new_animation_and_cinema_80_yt import update_codebase
    update_codebase(state)

    log(
        f"ALL 80 SYNCED VIDEOS PUBLISHED! "
        f"Animation: {len(state['animation_ids'])}/40 ({state.get('animation_playlist_id')}), "
        f"Movie: {len(state['cinema_ids'])}/40 ({state.get('cinema_playlist_id')})"
    )


if __name__ == "__main__":
    main()
