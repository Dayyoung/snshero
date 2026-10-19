import json
import os
import re
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MAPPING_FILE = PROJECT_ROOT / "src/content/movieEpisodeMapping.ts"
VIDEO_DIR = PROJECT_ROOT / "public/video/animation"
IDS_FILE = PROJECT_ROOT / "scripts/youtube_animation_ids.json"
CHANNEL_UPLOAD_URL = "https://studio.youtube.com/channel/UC_xayYwKaB5TbH3eZXeREpA/content?d=ud"
PLAYLIST_NAME = "SNSHero.com-Animation"


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
    return {"1": "P_hxWzd9WAE"}


def save_ids(ids_map):
    IDS_FILE.write_text(json.dumps(ids_map, indent=2, ensure_ascii=False), encoding="utf-8")


def main():
    episodes = parse_episodes()
    print(f"Parsed {len(episodes)} episodes from movieEpisodeMapping.ts", flush=True)
    ids_map = load_saved_ids()
    save_ids(ids_map)

    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir="/tmp/yt_studio_chrome_profile2",
            channel="chrome",
            headless=True,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            ignore_default_args=["--use-mock-keychain", "--password-store=basic"],
            args=["--profile-directory=Profile 2", "--disable-blink-features=AutomationControlled"],
            viewport={"width": 1440, "height": 900},
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()

        for ep in range(2, 41):
            if str(ep) in ids_map and ids_map[str(ep)]:
                print(f"[EP {ep}] Already uploaded: {ids_map[str(ep)]}, skipping.", flush=True)
                continue

            meta = episodes.get(ep)
            if not meta:
                print(f"[EP {ep}] Metadata not found!", flush=True)
                continue

            title_en = meta["titleEn"]
            title_ko = meta["titleKo"]
            mp4_name = f"SNSHero.com_E{ep}_{title_en}.mp4"
            mp4_path = VIDEO_DIR / mp4_name
            if not mp4_path.exists():
                print(f"[EP {ep}] File missing: {mp4_path}", flush=True)
                continue

            yt_title = f"SNSHero.com_E{ep}_{title_en}"
            yt_desc = (
                f"SNSHero Official Animation Episode {ep}: {title_en} (제{ep}화 {title_ko})\n"
                f"{meta['synopsisEn']}\n"
                f"{meta['synopsisKo']}\n"
                f"Play & Watch at https://snshero.com/?ep={ep}"
            )

            print(f"\n--- Uploading [EP {ep}/40] {mp4_name} ---", flush=True)
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
                # Wait up to 25s for youtu.be link or daily limit error
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

                # Select Playlist
                playlist_trigger = dialog.locator("ytcp-video-metadata-playlists").first
                if playlist_trigger.count() > 0:
                    playlist_trigger.scroll_into_view_if_needed()
                    playlist_trigger.click()
                    time.sleep(2)
                    pl_item = page.locator(f'ytcp-playlist-dialog label:has-text("{PLAYLIST_NAME}")').first
                    if pl_item.count() > 0:
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
                print(f"[EP {ep}] Saved {video_id} to youtube_animation_ids.json (Total: {len(ids_map)}/40)", flush=True)

            except Exception as e:
                print(f"[EP {ep}] Error during upload: {e}", flush=True)
                time.sleep(3)

        ctx.close()

    print(f"\nCompleted upload batch. Total uploaded: {len(ids_map)}/40", flush=True)


if __name__ == "__main__":
    main()
