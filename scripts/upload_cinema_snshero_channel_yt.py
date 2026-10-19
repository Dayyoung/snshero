import json
import os
import re
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MAPPING_FILE = PROJECT_ROOT / "src/content/movieEpisodeMapping.ts"
VIDEO_DIR = PROJECT_ROOT / "public/videos/cinema"
IDS_FILE = PROJECT_ROOT / "scripts/youtube_cinema_snshero_ids.json"
CHANNEL_UPLOAD_URL = "https://studio.youtube.com/channel/UCA6QmKiPstbiyBUHtnSMxyA/content?d=ud"
PLAYLIST_NAME = "SNSHero.com - Cinema"

ENGLISH_DESC = (
    "This video is the game story of SNSHero.\n\n"
    "Visit https://snshero.com for more details!"
)


def parse_episodes():
    text = MAPPING_FILE.read_text(encoding="utf-8")
    episodes = {}
    pattern = re.compile(
        r'episodeNumber:\s*(\d+),\s*'
        r'titleKo:\s*"([^"]+)",\s*'
        r'titleJa:\s*"([^"]+)",\s*'
        r'titleEn:\s*"([^"]+)",.*?'
        r'synopsisKo:\s*"([^"]+)",\s*'
        r'synopsisEn:\s*"([^"]+)"',
        re.DOTALL,
    )
    for m in pattern.finditer(text):
        ep = int(m.group(1))
        episodes[ep] = {
            "ep": ep,
            "titleKo": m.group(2),
            "titleJa": m.group(3),
            "titleEn": m.group(4),
            "synopsisKo": m.group(5),
            "synopsisEn": m.group(6),
        }
    return episodes


def load_saved_ids():
    if IDS_FILE.exists():
        try:
            return json.loads(IDS_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def save_ids(ids_map):
    IDS_FILE.write_text(json.dumps(ids_map, indent=2, ensure_ascii=False), encoding="utf-8")


def main():
    episodes = parse_episodes()
    print(f"Parsed {len(episodes)} episodes from movieEpisodeMapping.ts", flush=True)
    ids_map = load_saved_ids()
    save_ids(ids_map)

    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir="/tmp/yt_studio_chrome_profile6",
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
                print(f"[EP {ep}] Already uploaded: {ids_map[str(ep)]}, skipping.", flush=True)
                continue

            meta = episodes.get(ep)
            if not meta:
                print(f"[EP {ep}] Metadata not found!", flush=True)
                continue

            title_en = meta["titleEn"]
            mp4_name = f"episode_{ep:02d}.mp4"
            mp4_path = VIDEO_DIR / mp4_name
            if not mp4_path.exists():
                print(f"[EP {ep}] File missing: {mp4_path}", flush=True)
                continue

            yt_title = f"SNSHero.com_E{ep}_{title_en}"
            yt_desc = ENGLISH_DESC

            print(f"\n--- Uploading Cinema [EP {ep}/40] to SNSHero Channel: {mp4_name} ({yt_title}) ---", flush=True)
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
                print(f"[EP {ep}] File attached, waiting for upload dialog metadata...", flush=True)

                dialog = page.locator("ytcp-uploads-dialog")
                video_id = None
                limit_hit = False
                for _ in range(25):
                    time.sleep(1)
                    body_txt = dialog.inner_text() if dialog.count() > 0 else page.inner_text("body")
                    if "일일 업로드 한도" in body_txt or "Daily upload limit" in body_txt:
                        print(f"[EP {ep}] STOP: Daily upload limit reached on YouTube Studio!", flush=True)
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
                    print(f"[EP {ep}] Could not detect video_id within 25s. Checking dialog text...", flush=True)
                    try:
                        print(dialog.inner_text()[:400], flush=True)
                    except Exception:
                        pass
                    continue

                print(f"[EP {ep}] Assigned YouTube Video ID: {video_id}", flush=True)

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

                # Select Playlist (auto-create "SNSHero.com - Cinema" if not present yet)
                playlist_trigger = dialog.locator("ytcp-video-metadata-playlists").first
                if playlist_trigger.count() > 0:
                    playlist_trigger.scroll_into_view_if_needed()
                    playlist_trigger.click()
                    time.sleep(2)
                    pl_item = page.locator(f'ytcp-playlist-dialog label:has-text("{PLAYLIST_NAME}")').first
                    if pl_item.count() == 0:
                        print(f"[EP {ep}] Creating playlist '{PLAYLIST_NAME}' on SNSHero channel...", flush=True)
                        new_pl_btn = page.locator(
                            'ytcp-playlist-dialog ytcp-button#new-playlist-button, '
                            'ytcp-playlist-dialog button:has-text("새 재생목록"), '
                            'ytcp-playlist-dialog button:has-text("New playlist")'
                        ).first
                        if new_pl_btn.count() > 0:
                            new_pl_btn.click()
                            time.sleep(1)
                            sub_item = page.locator(
                                'tp-yt-paper-item:has-text("새로운 재생목록"), '
                                'tp-yt-paper-item:has-text("새 재생목록"), '
                                'tp-yt-paper-item:has-text("New playlist")'
                            ).first
                            if sub_item.count() > 0 and sub_item.is_visible():
                                sub_item.click()
                                time.sleep(1.5)
                            pl_title_box = page.locator(
                                'ytcp-playlist-creation-dialog #title-textarea #textbox, '
                                'ytcp-playlist-dialog #title-textarea #textbox'
                            ).first
                            pl_title_box.wait_for(state="visible", timeout=10000)
                            pl_title_box.click()
                            pl_title_box.fill(PLAYLIST_NAME)
                            time.sleep(0.8)
                            create_pl_confirm = page.locator(
                                'ytcp-playlist-creation-dialog ytcp-button#create-button, '
                                'ytcp-playlist-creation-dialog button:has-text("만들기"), '
                                'ytcp-playlist-dialog button:has-text("만들기")'
                            ).first
                            create_pl_confirm.click()
                            time.sleep(3)
                    else:
                        pl_item.click()
                        time.sleep(0.8)
                    pl_done = page.locator(
                        'ytcp-playlist-dialog ytcp-button#done-button, '
                        'ytcp-playlist-dialog button:has-text("완료"), '
                        'ytcp-playlist-dialog button:has-text("Done")'
                    ).first
                    if pl_done.count() > 0:
                        pl_done.click()
                        time.sleep(1)

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
                time.sleep(1)

                # Wait for #done-button to be enabled and click
                done_btn = dialog.locator("#done-button").first
                for _ in range(60):
                    disabled_attr = done_btn.get_attribute("disabled")
                    aria_disabled = done_btn.get_attribute("aria-disabled")
                    if disabled_attr is None and aria_disabled != "true":
                        break
                    time.sleep(1)

                done_btn.click()
                print(f"[EP {ep}] Clicked Publish (#done-button) for {video_id}!", flush=True)
                time.sleep(5)

                ids_map[str(ep)] = video_id
                save_ids(ids_map)
                print(f"[EP {ep}] Saved {video_id} to youtube_cinema_snshero_ids.json (Total: {len(ids_map)}/40)", flush=True)

            except Exception as e:
                print(f"[EP {ep}] Error during upload: {e}", flush=True)
                time.sleep(3)

        ctx.close()

    print(f"\nCompleted Cinema upload batch to SNSHero channel. Total uploaded: {len(ids_map)}/40", flush=True)


if __name__ == "__main__":
    main()
