#!/usr/bin/env python3
"""
Upload all 40 improved episode videos (`EP01`..`EP40`) from
`/Users/dayyoung/Desktop/내문서/movie/improve/` to the SNSHero YouTube channel
(`UCA6QmKiPstbiyBUHtnSMxyA`), add them to the `SNSHero.com The Movie` playlist,
and populate an English promotional movie & game description with `https://snshero.com`.

Note: The Official Theatrical Trailer and Full Theatrical Edition are intentionally
excluded (held on standby per user request).
"""

import json
import re
import shutil
import time
from pathlib import Path
from typing import Dict
from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MAPPING_FILE = PROJECT_ROOT / "src/content/movieEpisodeMapping.ts"
IMPROVE_DIR = Path("/Users/dayyoung/Desktop/내문서/movie/improve")
IDS_FILE = PROJECT_ROOT / "scripts/youtube_improved_movie_ids.json"

CHANNEL_UPLOAD_URL = "https://studio.youtube.com/channel/UCA6QmKiPstbiyBUHtnSMxyA/content?d=ud"
PLAYLIST_NAME = "SNSHero.com The Movie"
CHROME_PROFILE_DIR = Path("/tmp/yt_studio_chrome_profile6")


def log(msg: str) -> None:
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def ensure_chrome_profile6() -> None:
    src_root = Path("/Users/dayyoung/Library/Application Support/Google/Chrome")
    if not CHROME_PROFILE_DIR.exists() or not (CHROME_PROFILE_DIR / "Profile 6").exists():
        log("Copying Chrome Profile 6 (snsherocom@gmail.com) to /tmp/yt_studio_chrome_profile6 ...")
        CHROME_PROFILE_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src_root / "Local State", CHROME_PROFILE_DIR / "Local State")
        shutil.copytree(
            src_root / "Profile 6",
            CHROME_PROFILE_DIR / "Profile 6",
            symlinks=True,
            ignore=shutil.ignore_patterns(
                "Cache*", "Code Cache*", "GPUCache*", "Service Worker*", "Singleton*", "Sessions*"
            ),
        )
    for sf in CHROME_PROFILE_DIR.glob("Singleton*"):
        sf.unlink(missing_ok=True)


def parse_episodes() -> Dict[int, Dict[str, str]]:
    text = MAPPING_FILE.read_text(encoding="utf-8")
    episodes: Dict[int, Dict[str, str]] = {}
    pattern = re.compile(
        r"episodeNumber:\s*(\d+),\s*"
        r'titleKo:\s*"([^"]+)",\s*'
        r'titleJa:\s*"([^"]+)",\s*'
        r'titleEn:\s*"([^"]+)",.*?'
        r'arcEn:\s*"([^"]+)",\s*'
        r'synopsisKo:\s*"([^"]+)",\s*'
        r'synopsisEn:\s*"([^"]+)"',
        re.DOTALL,
    )
    for m in pattern.finditer(text):
        ep = int(m.group(1))
        episodes[ep] = {
            "ep": str(ep),
            "titleKo": m.group(2),
            "titleJa": m.group(3),
            "titleEn": m.group(4),
            "arcEn": m.group(5),
            "synopsisKo": m.group(6),
            "synopsisEn": m.group(7),
        }
    return episodes


def build_english_promo_description(ep: int, title_en: str, arc_en: str, synopsis_en: str) -> str:
    return (
        f"🎬 SNSHero.com The Movie — Episode {ep:02d}: {title_en}\n"
        f"({arc_en})\n\n"
        f"📖 Episode Story:\n"
        f"{synopsis_en}\n\n"
        f"⚔️ Visit https://snshero.com now to play the game and experience the full saga!\n\n"
        f"🔥 About SNSHero.com — The Movie & AI Card Battle Game:\n"
        f"• Epic Dark Fantasy Movie Chronicle: Follow the 40-episode live-action dark fantasy saga of Kadan, Ignis, Celia, Aleksandar, and Balian across a continent of ancient runes, betrayal, and war.\n"
        f"• Instant 3x3 Tactical Card Battle Game: Command over 110 legendary heroes, unleash elemental resonance & Soul Burst skills, and conquer 110 interactive mission games directly in your browser—100% free with zero installation required!\n"
        f"• Full Illustrated Web Novel: Read all 40 chapters of the original dark fantasy novel with voice narration and multi-language support.\n\n"
        f"👉 Play Free Now: https://snshero.com\n\n"
        f"#SNSHero #DarkFantasy #FantasyMovie #CardBattleGame #WebGame #RPG #SNSHeroTheMovie"
    )


def load_saved_ids() -> Dict[str, str]:
    if IDS_FILE.exists():
        try:
            return json.loads(IDS_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def save_ids(ids_map: Dict[str, str]) -> None:
    IDS_FILE.write_text(json.dumps(ids_map, indent=2, ensure_ascii=False), encoding="utf-8")


def find_episode_mp4(ep: int) -> Path:
    matches = sorted(IMPROVE_DIR.glob(f"SNSHero com The Movie EP{ep:02d} *.mp4"))
    if not matches:
        raise FileNotFoundError(f"Missing improved MP4 for EP{ep:02d} in {IMPROVE_DIR}")
    return matches[0]


def main() -> None:
    ensure_chrome_profile6()
    episodes = parse_episodes()
    log(f"Loaded metadata for {len(episodes)} episodes from movieEpisodeMapping.ts")

    ids_map = load_saved_ids()
    save_ids(ids_map)

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

        for ep in range(1, 41):
            if str(ep) in ids_map and ids_map[str(ep)]:
                log(f"[EP{ep:02d}/40] Already uploaded ({ids_map[str(ep)]}), skipping.")
                continue

            mp4_path = find_episode_mp4(ep)
            meta = episodes.get(ep, {})
            title_en = meta.get("titleEn") or mp4_path.stem.replace(f"SNSHero com The Movie EP{ep:02d} ", "")
            arc_en = meta.get("arcEn") or "SNSHero.com Official Dark Fantasy Saga"
            synopsis_en = (
                meta.get("synopsisEn")
                or f"Experience Episode {ep} ({title_en}) of SNSHero.com The Movie, an epic dark fantasy chronicle."
            )

            yt_title = f"SNSHero.com The Movie EP{ep:02d} - {title_en}"
            yt_desc = build_english_promo_description(ep, title_en, arc_en, synopsis_en)

            log(f"--- Uploading [EP{ep:02d}/40]: {mp4_path.name} -> '{yt_title}' ---")
            try:
                page.goto(CHANNEL_UPLOAD_URL, wait_until="domcontentloaded", timeout=45000)
                time.sleep(4)

                file_input = page.locator("input[type=file]")
                if file_input.count() == 0:
                    create_btn = page.locator("ytcp-button#create-icon, #create-icon").first
                    if create_btn.count() > 0:
                        create_btn.click()
                        time.sleep(1.5)
                        upload_item = page.locator("tp-yt-paper-item#text-item-0").first
                        if upload_item.count() > 0:
                            upload_item.click()
                            time.sleep(2)

                file_input = page.locator("input[type=file]").first
                file_input.set_input_files(str(mp4_path))
                log(f"[EP{ep:02d}] File attached, waiting for upload dialog & video ID...")

                dialog = page.locator("ytcp-uploads-dialog")
                video_id = None
                limit_hit = False
                for _ in range(35):
                    time.sleep(1)
                    body_txt = dialog.inner_text() if dialog.count() > 0 else page.inner_text("body")
                    if "일일 업로드 한도" in body_txt or "Daily upload limit" in body_txt:
                        log(f"[EP{ep:02d}] STOP: Daily upload limit reached on YouTube Studio!")
                        limit_hit = True
                        break
                    links = dialog.locator("a[href*='youtu.be']")
                    if links.count() > 0:
                        href = links.first.get_attribute("href") or ""
                        if "youtu.be/" in href:
                            video_id = href.split("youtu.be/")[-1].split("?")[0].strip()
                            if video_id:
                                break

                if limit_hit:
                    break

                if not video_id:
                    log(f"[EP{ep:02d}] Could not detect video_id within 35s. Retrying next...")
                    continue

                log(f"[EP{ep:02d}] Assigned YouTube Video ID: {video_id} (https://youtu.be/{video_id})")

                # Fill Title
                title_box = dialog.locator("#title-textarea #textbox").first
                title_box.wait_for(state="visible", timeout=15000)
                title_box.click()
                page.keyboard.press("Meta+A")
                page.keyboard.press("Backspace")
                title_box.fill(yt_title)
                time.sleep(0.5)

                # Fill Description
                desc_box = dialog.locator("#description-textarea #textbox").first
                if desc_box.count() > 0:
                    desc_box.click()
                    page.keyboard.press("Meta+A")
                    page.keyboard.press("Backspace")
                    desc_box.fill(yt_desc)
                    time.sleep(0.5)

                # Select Playlist ("SNSHero.com The Movie" - auto-create if not present)
                playlist_trigger = dialog.locator("ytcp-video-metadata-playlists").first
                if playlist_trigger.count() > 0:
                    playlist_trigger.scroll_into_view_if_needed()
                    playlist_trigger.click()
                    time.sleep(2.0)
                    pl_item = page.locator(f'ytcp-playlist-dialog label:has-text("{PLAYLIST_NAME}")').first
                    if pl_item.count() == 0:
                        log(f"[EP{ep:02d}] Creating new playlist '{PLAYLIST_NAME}'...")
                        new_pl_btn = page.locator(
                            "ytcp-playlist-dialog ytcp-button#new-playlist-button, "
                            'ytcp-playlist-dialog button:has-text("새 재생목록"), '
                            'ytcp-playlist-dialog button:has-text("New playlist")'
                        ).first
                        if new_pl_btn.count() > 0:
                            new_pl_btn.click()
                            time.sleep(1.0)
                            sub_item = page.locator(
                                'tp-yt-paper-item:has-text("새로운 재생목록"), '
                                'tp-yt-paper-item:has-text("새 재생목록"), '
                                'tp-yt-paper-item:has-text("New playlist")'
                            ).first
                            if sub_item.count() > 0 and sub_item.is_visible():
                                sub_item.click()
                                time.sleep(1.5)
                            pl_title_box = page.locator(
                                "ytcp-playlist-creation-dialog #title-textarea #textbox, "
                                "ytcp-playlist-dialog #title-textarea #textbox"
                            ).first
                            pl_title_box.wait_for(state="visible", timeout=10000)
                            pl_title_box.click()
                            pl_title_box.fill(PLAYLIST_NAME)
                            time.sleep(0.8)
                            create_pl_confirm = page.locator(
                                "ytcp-playlist-creation-dialog ytcp-button#create-button, "
                                'ytcp-playlist-creation-dialog button:has-text("만들기"), '
                                'ytcp-playlist-dialog button:has-text("만들기"), '
                                'ytcp-playlist-creation-dialog button:has-text("Create")'
                            ).first
                            create_pl_confirm.click()
                            time.sleep(3.0)
                    else:
                        pl_item.click()
                        time.sleep(0.8)

                    pl_done = page.locator(
                        "ytcp-playlist-dialog ytcp-button#done-button, "
                        'ytcp-playlist-dialog button:has-text("완료"), '
                        'ytcp-playlist-dialog button:has-text("Done")'
                    ).first
                    if pl_done.count() > 0:
                        pl_done.click()
                        time.sleep(1.0)

                # Select Not Made For Kids
                not_mfk = dialog.locator('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]').first
                not_mfk.scroll_into_view_if_needed()
                not_mfk.click()
                time.sleep(0.8)

                # Go to Step 3 (Visibility)
                step3 = dialog.locator("#step-badge-3").first
                step3.click()
                time.sleep(1.5)

                # Select PUBLIC
                pub_radio = dialog.locator('tp-yt-paper-radio-button[name="PUBLIC"]').first
                pub_radio.wait_for(state="visible", timeout=10000)
                pub_radio.click()
                time.sleep(1.0)

                # Wait for #done-button to be enabled and click Publish
                done_btn = dialog.locator("#done-button").first
                for _ in range(90):
                    disabled_attr = done_btn.get_attribute("disabled")
                    aria_disabled = done_btn.get_attribute("aria-disabled")
                    if disabled_attr is None and aria_disabled != "true":
                        break
                    time.sleep(1)

                done_btn.click()
                log(f"[EP{ep:02d}/40] PUBLISHED -> https://youtu.be/{video_id}")
                time.sleep(5)

                ids_map[str(ep)] = video_id
                save_ids(ids_map)
                log(f"[EP{ep:02d}/40] Saved ID {video_id} (Total uploaded: {len(ids_map)}/40)")

            except Exception as e:
                log(f"[EP{ep:02d}/40] Error during upload: {e}")
                time.sleep(3)

        ctx.close()

    log(f"Finished upload run. Total uploaded to '{PLAYLIST_NAME}': {len(ids_map)}/40")


if __name__ == "__main__":
    main()
