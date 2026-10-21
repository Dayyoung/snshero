#!/usr/bin/env python3
"""
Upload:
1. Official Theatrical Trailer (`SNSHero com The Movie - Official Theatrical Trailer.mp4`, 55.6 MB)
2. Full Theatrical Edition (`SNSHero com The Movie - Full Theatrical Edition (EP01-EP40).mp4`, 2.50 GB)
in order to the SNSHero YouTube channel (`UCA6QmKiPstbiyBUHtnSMxyA`) and add both to the
`SNSHero.com The Movie` playlist with English promotional descriptions.
"""

import json
import re
import shutil
import time
from pathlib import Path
from typing import Dict
from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
IMPROVE_DIR = Path("/Users/dayyoung/Desktop/내문서/movie/improve")
IDS_FILE = PROJECT_ROOT / "scripts/youtube_improved_movie_ids.json"

CHANNEL_UPLOAD_URL = "https://studio.youtube.com/channel/UCA6QmKiPstbiyBUHtnSMxyA/content?d=ud"
PLAYLIST_NAME = "SNSHero.com The Movie"
CHROME_PROFILE_DIR = Path("/tmp/yt_studio_chrome_profile6")

TRAILER_MP4 = IMPROVE_DIR / "SNSHero com The Movie - Official Theatrical Trailer.mp4"
THEATRICAL_MP4 = IMPROVE_DIR / "SNSHero com The Movie - Full Theatrical Edition (EP01-EP40).mp4"

TRAILER_TITLE = "SNSHero.com The Movie - Official Theatrical Trailer | Play Free AI Card Battle"
TRAILER_DESC = (
    "🎬 SNSHero.com The Movie — Official Theatrical Trailer\n"
    "⚔️ Visit https://snshero.com now to play the game and watch the full 40-episode saga!\n\n"
    "🔥 Two Vows Beneath the Blizzard. Forty Chapters of Destiny.\n"
    "When betrayal consumes the northern frontier, two silver daggers are placed into the hands of unborn brothers—Kadan and Ignis. "
    "Witness the official trailer for SNSHero.com The Movie, an epic 40-episode dark fantasy chronicle of loyalty, sacrifice, and war!\n\n"
    "🎮 Play SNSHero.com — 100% Free Instant Web Card Battle & RPG:\n"
    "• Command 110+ Legendary Heroes in tactical 3x3 elemental card battles!\n"
    "• Unleash Soul Burst ultimates, elemental resonance combos, and conquer 110 interactive mission games directly in your browser—no download or installation required!\n"
    "• Read all 40 chapters of the original illustrated dark fantasy web novel with multi-language support and full voice narration.\n\n"
    "👉 Start Your Legend Today: https://snshero.com\n\n"
    "#SNSHero #MovieTrailer #DarkFantasy #FantasyMovie #CardBattleGame #WebGame #RPG #SNSHeroTheMovie"
)

THEATRICAL_TITLE = "SNSHero.com The Movie - Full Theatrical Edition (All 40 Episodes Full Movie)"
THEATRICAL_DESC = (
    "🎬 SNSHero.com The Movie — Full Theatrical Edition (Complete 40-Episode Saga | 1 Hour 47 Mins)\n"
    "⚔️ Visit https://snshero.com now to play the free AI Card Battle game and read the original novel!\n\n"
    "📖 About the Full Movie (Episodes 01 – 40):\n"
    "Experience the complete, uninterrupted theatrical feature film of SNSHero.com! "
    "From the blood vow forged beneath the blizzard of Elwin village to the final clash for the fate of the continent, "
    "follow Kadan, Ignis, Celia, Alia, Aleksandar, Balian, and Hercul across all four acts of the dark fantasy chronicle.\n"
    "• Act I (EP01–EP10): Vows in the Blizzard & Birth of Fate\n"
    "• Act II (EP11–EP20): Awakening of the Silver Daggers & The Burning Sea\n"
    "• Act III (EP21–EP30): Secret of the Black Sanctum & Revolt of the Jade Council\n"
    "• Act IV (EP31–EP40): The Cross-Shaped Scar & The World Worth Protecting\n\n"
    "🔥 About SNSHero.com — Play Free in Your Browser:\n"
    "• 110+ Legendary Hero Cards: Build your ultimate deck and battle in real-time 3x3 tactical card duels.\n"
    "• 110 Interactive Mission Games: Earn rewards, awaken hero runes, and climb the Colosseum rankings—100% free with zero installation!\n"
    "• Original Illustrated Web Novel: Read the complete 40-episode story in 12 languages at https://snshero.com\n\n"
    "👉 Play & Watch Now at: https://snshero.com\n\n"
    "#SNSHero #FullMovie #DarkFantasy #FantasyMovie #CardBattleGame #WebGame #RPG #SNSHeroTheMovie"
)


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


def load_saved_ids() -> Dict[str, str]:
    if IDS_FILE.exists():
        try:
            return json.loads(IDS_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def save_ids(ids_map: Dict[str, str]) -> None:
    IDS_FILE.write_text(json.dumps(ids_map, indent=2, ensure_ascii=False), encoding="utf-8")


def upload_one_video(
    page,
    key: str,
    mp4_path: Path,
    yt_title: str,
    yt_desc: str,
    ids_map: Dict[str, str],
    is_large_file: bool = False,
) -> str:
    if key in ids_map and ids_map[key]:
        log(f"[{key}] Already uploaded ({ids_map[key]}), skipping.")
        return ids_map[key]

    size_mb = mp4_path.stat().st_size / (1024 * 1024)
    log(f"=== Starting Upload [{key}]: {mp4_path.name} ({size_mb:.1f} MB) ===")
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
    log(f"[{key}] File attached, waiting for upload dialog & YouTube Video ID...")

    dialog = page.locator("ytcp-uploads-dialog")
    video_id = None
    for _ in range(60):
        time.sleep(1)
        body_txt = dialog.inner_text() if dialog.count() > 0 else page.inner_text("body")
        if "일일 업로드 한도" in body_txt or "Daily upload limit" in body_txt:
            raise RuntimeError(f"[{key}] Daily upload limit reached on YouTube Studio!")
        links = dialog.locator("a[href*='youtu.be']")
        if links.count() > 0:
            href = links.first.get_attribute("href") or ""
            if "youtu.be/" in href:
                video_id = href.split("youtu.be/")[-1].split("?")[0].strip()
                if video_id:
                    break

    if not video_id:
        raise RuntimeError(f"[{key}] Could not detect video_id within 60s")

    log(f"[{key}] Assigned YouTube Video ID: {video_id} (https://youtu.be/{video_id})")

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

    # Select Playlist ("SNSHero.com The Movie")
    playlist_trigger = dialog.locator("ytcp-video-metadata-playlists").first
    if playlist_trigger.count() > 0:
        playlist_trigger.scroll_into_view_if_needed()
        playlist_trigger.click()
        time.sleep(2.0)
        pl_item = page.locator(f'ytcp-playlist-dialog label:has-text("{PLAYLIST_NAME}")').first
        if pl_item.count() > 0:
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

    # For a large 2.50 GB file, wait while upload progress is running in the dialog before or after clicking #done-button
    if is_large_file:
        log(f"[{key}] Monitoring 2.50 GB file upload progress inside YouTube Studio...")
        for wait_i in range(900):  # up to 30 minutes max
            try:
                prog_txt = dialog.locator("ytcp-video-upload-progress").first.inner_text().strip()
                prog_txt_clean = re.sub(r"\s+", " ", prog_txt)
            except Exception:
                prog_txt_clean = ""
            if wait_i % 5 == 0 and prog_txt_clean:
                log(f"  [{key} Upload Progress] {prog_txt_clean}")
            # Once upload hits 100% or enters processing ("처리 중" / "검토 중" / "업로드 완료" / "Checks" / "Processing" / "SD" / "HD")
            if any(
                kw in prog_txt_clean
                for kw in ("업로드 완료", "처리", "검토", "완료", "Checks", "Processing", "Upload complete", "SD")
            ) and "%" not in prog_txt_clean.split("업로드")[0]:
                log(f"  [{key}] File bytes 100% transferred to YouTube! ({prog_txt_clean})")
                break
            if "100%" in prog_txt_clean and "업로드" in prog_txt_clean:
                time.sleep(3)
                break
            time.sleep(2)

    # Wait for #done-button to be enabled and click Publish
    done_btn = dialog.locator("#done-button").first
    for _ in range(120):
        disabled_attr = done_btn.get_attribute("disabled")
        aria_disabled = done_btn.get_attribute("aria-disabled")
        if disabled_attr is None and aria_disabled != "true":
            break
        time.sleep(1)

    done_btn.click()
    log(f"[{key}] Clicked Publish (#done-button) -> https://youtu.be/{video_id}")
    time.sleep(6)

    # If YouTube shows a "동영상 업로드 중..." modal because bytes are still transferring, wait for it to finish
    for wait_post in range(600):
        body_now = page.locator("body").inner_text()
        if "동영상 업로드 중" in body_now or " Still uploading" in body_now:
            if wait_post % 5 == 0:
                log(f"  [{key}] Waiting for post-publish upload dialog to complete...")
            time.sleep(2)
        else:
            break

    ids_map[key] = video_id
    save_ids(ids_map)
    log(f"[{key}] COMPLETED & SAVED -> https://youtu.be/{video_id}")
    return video_id


def main() -> None:
    ensure_chrome_profile6()
    ids_map = load_saved_ids()

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

        # 1. Upload Official Theatrical Trailer FIRST
        trailer_id = upload_one_video(
            page=page,
            key="trailer",
            mp4_path=TRAILER_MP4,
            yt_title=TRAILER_TITLE,
            yt_desc=TRAILER_DESC,
            ids_map=ids_map,
            is_large_file=False,
        )

        # 2. Upload Full Theatrical Edition SECOND (LAST)
        theatrical_id = upload_one_video(
            page=page,
            key="theatrical_full",
            mp4_path=THEATRICAL_MP4,
            yt_title=THEATRICAL_TITLE,
            yt_desc=THEATRICAL_DESC,
            ids_map=ids_map,
            is_large_file=True,
        )

        ctx.close()

    log(f"ALL DONE! Trailer: https://youtu.be/{trailer_id} | Full Theatrical Edition: https://youtu.be/{theatrical_id}")


if __name__ == "__main__":
    main()
