#!/usr/bin/env python3
"""
Replace all 40 animation videos on the SNSHero YouTube channel (`UCA6QmKiPstbiyBUHtnSMxyA`)
in the `SNSHero.com-Animation` playlist (`PLK35ZdYm5NNE`):
1. For each episode (EP01..EP40), uploads the newly remastered animation video
   (`public/video/animation/SNSHero.com_E{ep}_{title_en}.mp4`, with calm unified BGM
   and slow -15% gentle female narration) to `SNSHero.com-Animation`.
2. Deletes the old animation video (`old_video_id` from `scripts/youtube_snshero_channel_ids.json`)
   from YouTube Studio once the new video is published.
3. Updates `scripts/youtube_snshero_channel_ids.json`, `src/content/movieEpisodeMapping.ts`,
   `src/views/MovieView.tsx`, `src/views/NovelView.tsx`, and `src/views/AnimeView.tsx` with
   the new YouTube video IDs.
4. Sets `SNSHero.com-Animation` (`PLK35ZdYm5NNE`) sort order to `게시된 날짜(오래된순)` so
   Episode 1 plays first.
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
VIDEO_DIR = PROJECT_ROOT / "public/video/animation"
OLD_IDS_FILE = PROJECT_ROOT / "scripts/youtube_snshero_channel_ids.json"
PROGRESS_FILE = PROJECT_ROOT / "scripts/youtube_animation_replace_progress.json"

CHANNEL_UPLOAD_URL = "https://studio.youtube.com/channel/UCA6QmKiPstbiyBUHtnSMxyA/content?d=ud"
PLAYLIST_NAME = "SNSHero.com-Animation"
PLAYLIST_ID = "PLK35ZdYm5NNE"
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
        f"🎬 SNSHero.com Animation — Episode {ep:02d}: {title_en}\n"
        f"({arc_en})\n\n"
        f"📖 Episode Story:\n"
        f"{synopsis_en}\n\n"
        f"⚔️ Visit https://snshero.com now to play the game and experience the full saga!\n\n"
        f"🔥 About SNSHero.com — Animated Story & AI Card Battle Game:\n"
        f"• 40-Episode Animated Fantasy Chronicle: Follow the epic dark fantasy story of Kadan, Ignis, Celia, Aleksandar, and Balian with soothing English female narration.\n"
        f"• Instant 3x3 Tactical Card Battle Game: Command over 110 legendary heroes, unleash elemental resonance & Soul Burst skills, and conquer 110 interactive mission games directly in your browser—100% free with zero installation required!\n"
        f"• Full Illustrated Web Novel: Read all 40 chapters of the original dark fantasy novel in 12 languages.\n\n"
        f"👉 Play Free Now: https://snshero.com\n\n"
        f"#SNSHero #DarkFantasy #FantasyAnimation #CardBattleGame #WebGame #RPG #Audiobook"
    )


def load_json_file(path: Path) -> dict:
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def save_json_file(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def delete_youtube_video(page, video_id: str, ep: int) -> bool:
    """
    Navigates to `https://studio.youtube.com/video/{video_id}/edit` and permanently
    deletes the old video from YouTube Studio.
    """
    if not video_id:
        return False
    try:
        edit_url = f"https://studio.youtube.com/video/{video_id}/edit"
        log(f"[EP{ep:02d}] Deleting old video {video_id} ({edit_url})...")
        page.goto(edit_url, wait_until="domcontentloaded", timeout=45000)
        time.sleep(4.5)

        body_txt = page.locator("body").inner_text()
        if "동영상을 찾을 수 없습니다" in body_txt or "Video not found" in body_txt or "죄송합니다" in body_txt:
            log(f"[EP{ep:02d}] Old video {video_id} already deleted or not found.")
            return True

        more_btn = page.locator("ytcp-button#overflow-menu-button, #overflow-menu-button").first
        if more_btn.count() == 0:
            log(f"[EP{ep:02d}] Could not find #overflow-menu-button for {video_id}")
            return False

        more_btn.click()
        time.sleep(1.5)

        del_item = page.locator(
            'tp-yt-paper-item:has-text("삭제"), '
            'tp-yt-paper-item:has-text("Delete"), '
            'tp-yt-paper-item#text-item-1'
        ).first
        del_item.click()
        time.sleep(2.0)

        # Check the confirmation checkbox inside ytcp-confirmation-dialog / ytcp-dialog
        checkbox = page.locator(
            "ytcp-checkbox-lit#confirm-checkbox, "
            "#confirm-checkbox, "
            'ytcp-checkbox-lit:has-text("완전히 삭제"), '
            'tp-yt-paper-checkbox:has-text("완전히 삭제")'
        ).first
        if checkbox.count() > 0:
            checkbox.click()
            time.sleep(1.0)

        confirm_btn = page.locator(
            "ytcp-button#confirm-button, "
            'ytcp-button:has-text("동영상 삭제"), '
            'ytcp-button:has-text("Delete forever"), '
            "#confirm-button"
        ).first
        confirm_btn.click()
        time.sleep(4.5)
        log(f"[EP{ep:02d}] Successfully deleted old video {video_id}!")
        return True
    except Exception as e:
        log(f"[EP{ep:02d}] Warning while deleting old video {video_id}: {e}")
        return False


def update_codebase_video_ids(current_ids: Dict[str, str]) -> None:
    """
    Updates `scripts/youtube_snshero_channel_ids.json`, `src/content/movieEpisodeMapping.ts`,
    `src/views/MovieView.tsx`, `src/views/NovelView.tsx`, and `src/views/AnimeView.tsx`.
    """
    save_json_file(OLD_IDS_FILE, current_ids)

    # Update src/content/movieEpisodeMapping.ts
    mapping_txt = MAPPING_FILE.read_text(encoding="utf-8")
    for ep_str, vid in current_ids.items():
        ep_num = int(ep_str)
        # Replace videoId inside episode block
        pattern = re.compile(
            rf"(episodeNumber:\s*{ep_num}\b.*?videoId:\s*\")([^\"]+)(\")",
            re.DOTALL,
        )
        mapping_txt = pattern.sub(rf"\g<1>{vid}\g<3>", mapping_txt, count=1)
    MAPPING_FILE.write_text(mapping_txt, encoding="utf-8")

    # Update EP1 playlist URLs in MovieView.tsx, NovelView.tsx, AnimeView.tsx if EP1 changed
    ep1_vid = current_ids.get("1")
    if ep1_vid:
        for rel_path in ["src/views/MovieView.tsx", "src/views/NovelView.tsx", "src/views/AnimeView.tsx"]:
            fpath = PROJECT_ROOT / rel_path
            if fpath.exists():
                txt = fpath.read_text(encoding="utf-8")
                txt_new = re.sub(
                    r"watch\?v=[A-Za-z0-9_-]+&list=PLK35ZdYm5NNE",
                    f"watch?v={ep1_vid}&list=PLK35ZdYm5NNE",
                    txt,
                )
                if rel_path == "src/views/MovieView.tsx":
                    txt_new = re.sub(
                        r"getVideoId\(currentEpisodeNum\)\s*\|\|\s*'[^']+'",
                        f"getVideoId(currentEpisodeNum) || '{ep1_vid}'",
                        txt_new,
                    )
                if txt_new != txt:
                    fpath.write_text(txt_new, encoding="utf-8")


def main() -> None:
    ensure_chrome_profile6()
    episodes = parse_episodes()
    old_ids_map = load_json_file(OLD_IDS_FILE)
    progress = load_json_file(PROGRESS_FILE)
    if "uploaded" not in progress:
        progress["uploaded"] = {}
    if "deleted" not in progress:
        progress["deleted"] = {}
    if "original_old_ids" not in progress:
        progress["original_old_ids"] = dict(old_ids_map)
        save_json_file(PROGRESS_FILE, progress)

    original_old_ids: Dict[str, str] = progress["original_old_ids"]

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

        limit_hit = False
        for ep in range(1, 41):
            ep_str = str(ep)
            meta = episodes.get(ep, {})
            title_en = meta.get("titleEn", f"Episode {ep}")
            arc_en = meta.get("arcEn", "SNSHero.com Official Dark Fantasy Saga")
            synopsis_en = meta.get("synopsisEn", "")

            mp4_name = f"SNSHero.com_E{ep}_{title_en}.mp4"
            mp4_path = VIDEO_DIR / mp4_name
            if not mp4_path.exists():
                matches = sorted(VIDEO_DIR.glob(f"SNSHero.com_E{ep}_*.mp4"))
                if matches:
                    mp4_path = matches[0]
                else:
                    log(f"[EP{ep:02d}] File missing: {mp4_path}")
                    continue

            # Step 1: Upload new remastered animation video if not yet uploaded
            if ep_str not in progress["uploaded"] or not progress["uploaded"][ep_str]:
                yt_title = f"SNSHero.com_E{ep}_{title_en}"
                yt_desc = build_english_promo_description(ep, title_en, arc_en, synopsis_en)

                log(f"--- Uploading New Remastered Animation [EP{ep:02d}/40]: {mp4_path.name} ---")
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
                        log(f"[EP{ep:02d}] Could not detect video_id within 35s. Skipping...")
                        continue

                    log(f"[EP{ep:02d}] Assigned New YouTube Video ID: {video_id} (https://youtu.be/{video_id})")

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

                    # Select Playlist ("SNSHero.com-Animation")
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

                    # Wait for #done-button to be enabled and click Publish
                    done_btn = dialog.locator("#done-button").first
                    for _ in range(90):
                        disabled_attr = done_btn.get_attribute("disabled")
                        aria_disabled = done_btn.get_attribute("aria-disabled")
                        if disabled_attr is None and aria_disabled != "true":
                            break
                        time.sleep(1)

                    done_btn.click()
                    log(f"[EP{ep:02d}/40] PUBLISHED NEW -> https://youtu.be/{video_id}")
                    time.sleep(5)

                    progress["uploaded"][ep_str] = video_id
                    old_ids_map[ep_str] = video_id
                    save_json_file(PROGRESS_FILE, progress)
                    update_codebase_video_ids(old_ids_map)
                except Exception as e:
                    log(f"[EP{ep:02d}/40] Upload error: {e}")
                    time.sleep(3)
                    continue

            # Step 2: Delete old video for this episode once new one is uploaded
            old_vid = original_old_ids.get(ep_str)
            new_vid = progress["uploaded"].get(ep_str)
            if old_vid and new_vid and old_vid != new_vid and not progress["deleted"].get(ep_str):
                if delete_youtube_video(page, old_vid, ep):
                    progress["deleted"][ep_str] = old_vid
                    save_json_file(PROGRESS_FILE, progress)

        # Ensure playlist PLK35ZdYm5NNE is sorted by Oldest First (게시된 날짜(오래된순))
        try:
            page.goto(f"https://studio.youtube.com/playlist/{PLAYLIST_ID}/edit", wait_until="domcontentloaded", timeout=45000)
            time.sleep(4)
            sort_trigger = page.locator(
                'ytcp-text-dropdown-trigger:has-text("최신순"), '
                'ytcp-dropdown-trigger:has-text("최신순"), '
                ':text("게시된 날짜(최신순)")'
            ).first
            if sort_trigger.count() > 0 and sort_trigger.is_visible():
                sort_trigger.click()
                time.sleep(1.5)
                oldest_opt = page.locator('tp-yt-paper-item:has-text("게시된 날짜(오래된순)")').first
                if oldest_opt.count() > 0:
                    oldest_opt.click()
                    time.sleep(1.5)
                    save_btn = page.locator('ytcp-button#save-button, ytcp-button#save, ytcp-button:has-text("저장")').first
                    if save_btn.count() > 0:
                        save_btn.click()
                        time.sleep(3)
                        log(f"Updated playlist {PLAYLIST_ID} sort order to Oldest First.")
        except Exception as e:
            log(f"Playlist sort check note: {e}")

        ctx.close()

    log(
        f"Summary: Uploaded {len(progress['uploaded'])}/40 new animation videos, "
        f"Deleted {len(progress['deleted'])}/40 old animation videos."
    )


if __name__ == "__main__":
    main()
