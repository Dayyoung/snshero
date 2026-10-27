#!/usr/bin/env python3
"""
Deletes all previously uploaded old Animation/Movie 40-episode playlists and videos
on the SNSHero Official YouTube channel (`UCA6QmKiPstbiyBUHtnSMxyA`), keeping ONLY
today's 40 Animation videos (`PLY6O_zlgCxYY`) and 40 Movie videos (`PLMkfo7bS3l4Q`).
"""

import json
import re
import time
import urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
DATA_FILE = PROJECT_ROOT / "scripts/old_videos_to_delete.json"
YOUTUBE_API_KEY = "AIzaSyBa9TidLv_iwMyB-9VSrVGWEVUr0WyjiQU"
CHANNEL_ID = "UCA6QmKiPstbiyBUHtnSMxyA"

KEEP_PLAYLISTS = {
    "PLY6O_zlgCxYY",  # Today's Animation 40
    "PLMkfo7bS3l4Q",  # Today's Movie 40
    "PLMZVaaVQfrcU",  # Novel
    "PLTXARuD7kQ78",  # Novel
    "PLM4FMYy7mS8w",  # Novel
    "PLAGqa3OJwbA4",  # Play the Game!
}

OLD_PLAYLISTS_TO_DELETE = [
    "PLAP5BnG0QZw8",
    "PLfJ0X_nGc5Uc",
    "PLHiW8jLQ0t2Q",
    "PLWJoj18KXId0",
    "PLdQXi60Hv4Fg",
    "PLMdirwPt_FHU",
    "PLSvmAWAJh8FU",
    "PLK35ZdYm5NNE",
    "PLOLtCtApKgp8",
]


def log(msg: str) -> None:
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def delete_playlist(page, pl_id: str) -> bool:
    try:
        url = f"https://studio.youtube.com/playlist/{pl_id}/edit"
        log(f"Navigating to playlist {pl_id} ({url})...")
        page.goto(url, wait_until="domcontentloaded", timeout=45000)
        time.sleep(3.5)

        body = page.locator("body").inner_text()
        if "찾을 수 없습니다" in body or "죄송합니다" in body or "not found" in body.lower():
            log(f"Playlist {pl_id} already deleted.")
            return True

        more_btn = page.locator("#overflow-menu-button").first
        if more_btn.count() == 0:
            log(f"No #overflow-menu-button on playlist {pl_id}")
            return False

        more_btn.click(force=True)
        time.sleep(1.2)

        del_item = page.locator(
            'tp-yt-paper-item:has-text("삭제"), '
            'tp-yt-paper-item:has-text("재생목록 삭제"), '
            'tp-yt-paper-item:has-text("Delete")'
        ).first
        if del_item.count() == 0:
            log(f"No delete menu item for playlist {pl_id}")
            return False

        del_item.click(force=True)
        time.sleep(1.5)

        confirm_btn = page.locator(
            'ytcp-button#confirm-button, '
            'ytcp-button:has-text("삭제"), '
            'ytcp-button:has-text("Delete")'
        ).first
        if confirm_btn.count() > 0:
            confirm_btn.click(force=True)
            time.sleep(3.0)
            log(f"Successfully deleted playlist {pl_id}!")
            return True
    except Exception as e:
        log(f"Warning deleting playlist {pl_id}: {e}")
    return False


def is_old_anim_or_movie_row(vid: str, row_text: str, old_vids: set, keep_vids: set) -> bool:
    if vid in keep_vids:
        return False
    if vid in old_vids:
        return True
    # Also match any leftover old Animation/Movie episode or draft not in keep_vids
    patterns = [
        "SNSHero.com Animation EP",
        "SNSHero.com The Movie EP",
        "SNSHero com The Movie EP",
        "SNSHero.com_E",
        "SNSHero.com The Movie -",
        "episode_",
    ]
    for p in patterns:
        if p in row_text:
            return True
    return False


def bulk_delete_checked_rows(page, count: int) -> bool:
    try:
        log(f"Triggering bulk delete for {count} checked videos...")
        more_actions = page.locator(
            "#additional-action-options ytcp-text-dropdown-trigger, #additional-action-options #trigger, #additional-action-options"
        ).first
        more_actions.click(force=True)
        time.sleep(1.5)

        del_item = page.locator(
            'tp-yt-paper-item:has-text("완전삭제"), '
            'tp-yt-paper-item:has-text("완전히 삭제"), '
            'tp-yt-paper-item:has-text("Delete forever")'
        ).first
        del_item.wait_for(state="visible", timeout=10000)
        del_item.click(force=True)
        time.sleep(2.0)

        checkbox = page.locator(
            "ytcp-confirmation-dialog ytcp-checkbox-lit#confirm-checkbox, "
            "ytcp-dialog ytcp-checkbox-lit#confirm-checkbox, "
            "ytcp-checkbox-lit#confirm-checkbox"
        ).first
        checkbox.wait_for(state="visible", timeout=10000)
        checkbox.click(force=True)
        time.sleep(1.0)

        confirm_btn = page.locator(
            "ytcp-confirmation-dialog ytcp-button#confirm-button, "
            "ytcp-dialog ytcp-button#confirm-button, "
            "ytcp-button#confirm-button"
        ).first
        confirm_btn.wait_for(state="visible", timeout=10000)
        confirm_btn.click(force=True)
        log(f"Confirmed bulk deletion of {count} videos. Waiting for completion...")

        # Wait while bulk deletion is processing
        for _ in range(120):
            time.sleep(1.5)
            body_txt = page.locator("body").inner_text()
            if (
                "삭제하는 중" not in body_txt
                and "동영상 삭제 중" not in body_txt
                and "Deleting" not in body_txt
            ):
                if (
                    page.locator("ytcp-checkbox-lit#confirm-checkbox").count() == 0
                    or not page.locator("ytcp-checkbox-lit#confirm-checkbox").first.is_visible()
                ):
                    break
        time.sleep(4.0)
        log(f"Bulk deletion of {count} videos completed!")
        return True
    except Exception as e:
        log(f"Bulk delete error: {e}")
        return False


def main() -> None:
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    keep_vids = set(data["keep_vids"])
    old_vids = set(data["old_vids"])
    log(f"Loaded {len(keep_vids)} keep_vids (today's 80) and {len(old_vids)} old_vids to delete.")

    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir="/tmp/yt_studio_chrome_profile6",
            channel="chrome",
            headless=True,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
            ignore_default_args=["--use-mock-keychain", "--password-store=basic"],
            args=["--profile-directory=Profile 6", "--disable-blink-features=AutomationControlled"],
            viewport={"width": 1440, "height": 900},
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()

        try:
            # Navigate to /videos/upload and bulk-delete all old Animation/Movie videos
            videos_url = f"https://studio.youtube.com/channel/{CHANNEL_ID}/videos/upload"
            log(f"Navigating to {videos_url} ...")
            page.goto(videos_url, wait_until="domcontentloaded", timeout=45000)
            time.sleep(5.0)

            # Change page size to 50 if available
            try:
                ps = page.locator("ytcp-select#page-size, #page-size").first
                if ps.count() > 0 and ps.is_visible():
                    ps.click(force=True)
                    time.sleep(1.0)
                    opt50 = page.locator('tp-yt-paper-item:has-text("50")').first
                    if opt50.count() > 0:
                        opt50.click(force=True)
                        time.sleep(4.0)
                        log("Set page size to 50 rows per page.")
            except Exception as e:
                log(f"Page size change note: {e}")

            total_deleted = 0
            page_num = 1
            for _ in range(30):
                rows = page.locator("ytcp-video-row").all()
                log(f"[Page {page_num}] Scanning {len(rows)} rows...")
                checked_on_page = 0

                for r in rows:
                    try:
                        a = r.locator('a[href*="/video/"]').first
                        if a.count() == 0:
                            continue
                        href = a.get_attribute("href") or ""
                        m = re.search(r"/video/([^/]+)/", href)
                        if not m:
                            continue
                        vid = m.group(1)
                        row_txt = r.inner_text()
                        if is_old_anim_or_movie_row(vid, row_txt, old_vids, keep_vids):
                            cb = r.locator("ytcp-checkbox-lit#checkbox, ytcp-checkbox-lit").first
                            if cb.count() > 0:
                                cb.scroll_into_view_if_needed()
                                cb.click(force=True)
                                checked_on_page += 1
                                old_vids.discard(vid)
                                time.sleep(0.12)
                    except Exception:
                        pass

                if checked_on_page > 0:
                    if bulk_delete_checked_rows(page, checked_on_page):
                        total_deleted += checked_on_page
                        # Stay on current page_num since rows shifted up after deletion!
                        time.sleep(2.5)
                        continue
                    else:
                        # Reload videos_url if bulk delete had an issue
                        page.goto(videos_url, wait_until="domcontentloaded", timeout=45000)
                        time.sleep(4.5)
                        page_num = 1
                        continue

                # No matching rows on current page -> move to next page
                next_btn = page.locator("ytcp-icon-button#navigate-after, #navigate-after").first
                if next_btn.count() == 0:
                    break
                disabled = next_btn.get_attribute("disabled")
                aria_disabled = next_btn.get_attribute("aria-disabled")
                if disabled is not None or aria_disabled == "true":
                    log("Reached last page of videos!")
                    break

                next_btn.click(force=True)
                page_num += 1
                time.sleep(3.5)

            log(f"Finished bulk deletion! Total old videos deleted: {total_deleted}")
        finally:
            ctx.close()


if __name__ == "__main__":
    main()
