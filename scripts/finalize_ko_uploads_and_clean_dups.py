#!/usr/bin/env python3
"""
1. Publishes any remaining unpublished primary Korean videos (among the 40 KO_FULL + 11 KO_SHORTS)
   by clicking `ytcp-button#action-1` (`초안 수정`) FIRST, setting playlist + Not Made For Kids + Public,
   and clicking `#done-button`.
2. Adds any already-public video missing from `PLVch67W9z4TA` (`ko_full`) or `PLBmhdute5Irg` (`ko_shorts`)
   to its playlist via `/video/{vid}/edit` -> `ytcp-video-metadata-playlists` -> `ytcp-button:has-text("완료")` -> `ytcp-button#save`.
3. Bulk-deletes the 50 duplicate draft videos across pages of `/videos/upload` and `/videos/short`.
4. Sorts `PLVch67W9z4TA` (`ko_full`) and `PLBmhdute5Irg` (`ko_shorts`) Oldest First (`게시된 날짜(오래된순)`).
"""

import asyncio
import json
import re
import urllib.request
from pathlib import Path
from playwright.async_api import async_playwright

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
STATE_FILE = PROJECT_ROOT / "scripts/youtube_webtoon_160_state.json"
THUMB_DIR = PROJECT_ROOT / "exports/webtoon_thumbnails"
TASK_LOG = Path("/Users/dayyoung/.gemini/antigravity/brain/dcf8e55e-cf78-47fd-96bd-ced03464aa0a/.system_generated/steps/2277/output.txt")
TMP_CHROME_DIR = Path("/tmp/yt_studio_chrome_profile6")
CHANNEL_ID = "UCA6QmKiPstbiyBUHtnSMxyA"
API_KEY = "AIzaSyBa9TidLv_iwMyB-9VSrVGWEVUr0WyjiQU"

PLAYLIST_TITLES = {
    "en_full": "SNSHero.com - Kadan's Journey | Official Webtoon (English Dub · 40 Episodes)",
    "en_shorts": "SNSHero.com - Kadan's Journey | Official Webtoon Shorts (English · 40 Episodes)",
    "ko_full": "눈히어로.com - 카단의 여정 | 공식 웹툰 (한국어 더빙 · 전 40화)",
    "ko_shorts": "눈히어로.com - 카단의 여정 | 공식 웹툰 쇼츠 (한국어 · 전 40화)",
}


def parse_log_ids():
    text = TASK_LOG.read_text(encoding="utf-8", errors="ignore")
    pattern = re.compile(r"\[(KO_FULL|KO_SHORTS)\s+EP(\d+)\]\s+Assigned YouTube Video ID:\s+([A-Za-z0-9_-]+)")
    primary = {"ko_full": {}, "ko_shorts": {}}
    duplicates = []
    for m in pattern.finditer(text):
        cat = m.group(1).lower()
        ep = str(int(m.group(2)))
        vid = m.group(3)
        if ep not in primary[cat]:
            primary[cat][ep] = vid
        else:
            duplicates.append((cat, ep, vid))
    return primary, duplicates


def get_missing_or_unpublished(primary):
    all_prim = [(cat, int(ep), vid) for cat in ("ko_full", "ko_shorts") for ep, vid in primary[cat].items()]
    pub_set = set()
    for i in range(0, len(all_prim), 40):
        chunk = all_prim[i:i+40]
        ids_str = ",".join(c[2] for c in chunk)
        url = f"https://www.googleapis.com/youtube/v3/videos?part=status&id={ids_str}&key={API_KEY}"
        with urllib.request.urlopen(url) as r:
            data = json.loads(r.read().decode())
        for it in data.get("items", []):
            if it.get("status", {}).get("privacyStatus") == "public":
                pub_set.add(it["id"])

    in_pl = {"ko_full": set(), "ko_shorts": set()}
    for cat, pid in [("ko_full", "PLVch67W9z4TA"), ("ko_shorts", "PLBmhdute5Irg")]:
        url = f"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId={pid}&maxResults=50&key={API_KEY}"
        with urllib.request.urlopen(url) as r:
            data = json.loads(r.read().decode())
        for it in data.get("items", []):
            in_pl[cat].add(it["snippet"]["resourceId"]["videoId"])

    todo = []
    for cat, ep, vid in sorted(all_prim, key=lambda x: (x[0], x[1])):
        is_pub = vid in pub_set
        is_in_pl = vid in in_pl[cat]
        if not is_pub or not is_in_pl:
            todo.append((cat, ep, vid, is_pub, is_in_pl))
    return todo


async def fix_single_video(sem: asyncio.Semaphore, ctx, category: str, ep: int, video_id: str) -> bool:
    async with sem:
        page = await ctx.new_page()
        thumb_path = str(THUMB_DIR / f"ep_{ep:02d}_cover_thumb.jpg")
        active_pl_title = PLAYLIST_TITLES[category]
        try:
            url = f"https://studio.youtube.com/video/{video_id}/edit"
            await page.goto(url, wait_until="domcontentloaded", timeout=45000)
            await asyncio.sleep(4.5)

            # Check if it's still a Draft (`ytcp-button#action-1` visible)
            edit_draft = page.locator("ytcp-button#action-1").first
            if await edit_draft.count() > 0 and await edit_draft.is_visible():
                await edit_draft.click(force=True)
                await asyncio.sleep(2.5)
                dialog = page.locator("ytcp-uploads-dialog")

                # Upload cover thumbnail inside dialog
                fi = dialog.locator("input#file-loader").first
                if await fi.count() > 0:
                    await fi.set_input_files(thumb_path)
                    await asyncio.sleep(1.2)

                # Select playlist inside dialog
                pl_trigger = dialog.locator("ytcp-video-metadata-playlists ytcp-text-dropdown-trigger, ytcp-video-metadata-playlists").first
                if await pl_trigger.count() > 0:
                    await pl_trigger.scroll_into_view_if_needed()
                    await pl_trigger.click(force=True)
                    await asyncio.sleep(1.8)
                    lbl = page.locator(f'label:has-text("{active_pl_title}")').first
                    if await lbl.count() > 0:
                        chk = lbl.locator("ytcp-checkbox-lit, tp-yt-paper-checkbox").first
                        is_chk = False
                        if await chk.count() > 0:
                            a_chk = await chk.get_attribute("aria-checked")
                            c_attr = await chk.get_attribute("checked")
                            is_chk = (a_chk == "true") or (c_attr is not None)
                        if not is_chk:
                            await lbl.click(force=True)
                            await asyncio.sleep(0.5)
                    done_pl = page.locator('ytcp-button:has-text("완료")').first
                    if await done_pl.count() > 0 and await done_pl.is_visible():
                        await done_pl.click(force=True)
                        await asyncio.sleep(0.8)

                not_mfk = dialog.locator('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]').first
                if await not_mfk.count() > 0:
                    await not_mfk.scroll_into_view_if_needed()
                    await not_mfk.click(force=True)
                    await asyncio.sleep(0.5)
                step3 = dialog.locator("#step-badge-3").first
                if await step3.count() > 0:
                    await step3.click(force=True)
                    await asyncio.sleep(1.0)
                pub_radio = dialog.locator('tp-yt-paper-radio-button[name="PUBLIC"]').first
                if await pub_radio.count() > 0:
                    await pub_radio.click(force=True)
                    await asyncio.sleep(0.7)
                done_btn = dialog.locator("#done-button").first
                for _ in range(30):
                    d1 = await done_btn.get_attribute("disabled")
                    d2 = await done_btn.get_attribute("aria-disabled")
                    if d1 is None and d2 != "true":
                        break
                    await asyncio.sleep(0.5)
                await done_btn.click(force=True)
                await asyncio.sleep(3.5)
            else:
                # Already published, just ensure playlist + thumbnail on /video/{vid}/edit
                fi = page.locator("input#file-loader").first
                if await fi.count() > 0:
                    await fi.set_input_files(thumb_path)
                    await asyncio.sleep(1.2)
                pl_trigger = page.locator("ytcp-video-metadata-playlists ytcp-text-dropdown-trigger, ytcp-video-metadata-playlists").first
                if await pl_trigger.count() > 0:
                    await pl_trigger.scroll_into_view_if_needed()
                    await pl_trigger.click(force=True)
                    await asyncio.sleep(1.8)
                    lbl = page.locator(f'label:has-text("{active_pl_title}")').first
                    if await lbl.count() > 0:
                        chk = lbl.locator("ytcp-checkbox-lit, tp-yt-paper-checkbox").first
                        is_chk = False
                        if await chk.count() > 0:
                            a_chk = await chk.get_attribute("aria-checked")
                            c_attr = await chk.get_attribute("checked")
                            is_chk = (a_chk == "true") or (c_attr is not None)
                        if not is_chk:
                            await lbl.click(force=True)
                            await asyncio.sleep(0.5)
                    done_pl = page.locator('ytcp-button:has-text("완료")').first
                    if await done_pl.count() > 0 and await done_pl.is_visible():
                        await done_pl.click(force=True)
                        await asyncio.sleep(0.8)
                save_btn = page.locator("ytcp-button#save").first
                if await save_btn.count() > 0:
                    await save_btn.click(force=True)
                    await asyncio.sleep(2.5)

            print(f"✅ Fixed [{category.upper()} EP{ep:02d}] -> https://youtu.be/{video_id}", flush=True)
            return True
        except Exception as e:
            print(f"⚠️ Error fixing [{category.upper()} EP{ep:02d}] ({video_id}): {e}", flush=True)
            return False
        finally:
            await page.close()


async def delete_all_drafts_on_tab(page, tab_url: str, label: str):
    """
    Since all 51 primary Korean videos and 80 English videos are PUBLIC,
    any row on `/videos/upload` or `/videos/short` that has `ytcp-button#action-1` (`초안 수정`)
    is one of the 50 duplicate drafts! Select all rows with `ytcp-button#action-1` and bulk-delete them.
    """
    for round_idx in range(1, 8):
        await page.goto(tab_url, wait_until="domcontentloaded", timeout=45000)
        await asyncio.sleep(4.5)

        draft_rows_checked = 0
        for pg_idx in range(4):
            rows = page.locator("ytcp-video-row")
            rcount = await rows.count()
            for i in range(rcount):
                row = rows.nth(i)
                draft_btn = row.locator("ytcp-button#action-1")
                if await draft_btn.count() > 0:
                    chk = row.locator("#checkbox, ytcp-checkbox-lit").first
                    if await chk.count() > 0:
                        await chk.click(force=True)
                        draft_rows_checked += 1
                        await asyncio.sleep(0.12)
            if draft_rows_checked > 0:
                break
            next_btn = page.locator("#navigate-after").first
            if await next_btn.count() == 0 or await next_btn.get_attribute("disabled") is not None:
                break
            await next_btn.click(force=True)
            await asyncio.sleep(4.0)

        if draft_rows_checked == 0:
            print(f"[{label}] 0 draft rows remaining!", flush=True)
            break

        print(f"[{label}] Bulk-deleting {draft_rows_checked} duplicate draft rows (round #{round_idx})...", flush=True)
        more_btn = page.locator(
            "ytcp-bulk-actions #additional-action-options, "
            'ytcp-bulk-actions :text("추가 작업"), '
            'ytcp-bulk-actions :text("More actions")'
        ).first
        await more_btn.click(force=True)
        await asyncio.sleep(1.2)
        del_item = page.locator(
            'tp-yt-paper-item#text-item-1, '
            'tp-yt-paper-item:has-text("완전삭제"), '
            'tp-yt-paper-item:has-text("완전히 삭제"), '
            'tp-yt-paper-item:has-text("Delete forever")'
        ).first
        await del_item.click(force=True)
        await asyncio.sleep(1.8)
        confirm_chk = page.locator("ytcp-confirmation-dialog ytcp-checkbox-lit#confirm-checkbox, ytcp-confirmation-dialog #confirm-checkbox").first
        await confirm_chk.click(force=True)
        await asyncio.sleep(0.8)
        confirm_btn = page.locator("ytcp-confirmation-dialog ytcp-button#confirm-button").first
        await confirm_btn.click(force=True)
        await asyncio.sleep(22.0)


async def main():
    primary, duplicates = parse_log_ids()
    todo = get_missing_or_unpublished(primary)
    print(f"Found {len(todo)} primary videos needing publish/playlist fix.", flush=True)

    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context(
            user_data_dir=str(TMP_CHROME_DIR),
            channel="chrome",
            headless=True,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
            ignore_default_args=["--use-mock-keychain", "--password-store=basic"],
            args=["--profile-directory=Profile 6", "--disable-blink-features=AutomationControlled"],
            viewport={"width": 1440, "height": 900},
        )
        sem = asyncio.Semaphore(3)
        if todo:
            await asyncio.gather(*(fix_single_video(sem, ctx, cat, ep, vid) for cat, ep, vid, _, _ in todo))

        page = ctx.pages[0] if ctx.pages else await ctx.new_page()
        await delete_all_drafts_on_tab(page, f"https://studio.youtube.com/channel/{CHANNEL_ID}/videos/upload", "VIDEOS")
        await delete_all_drafts_on_tab(page, f"https://studio.youtube.com/channel/{CHANNEL_ID}/videos/short", "SHORTS")

        # Sort both Korean playlists Oldest First
        for pl_key, pid in [("ko_full", "PLVch67W9z4TA"), ("ko_shorts", "PLBmhdute5Irg")]:
            await page.goto(f"https://studio.youtube.com/playlist/{pid}/edit", wait_until="domcontentloaded", timeout=45000)
            await asyncio.sleep(4.0)
            sort_trigger = page.locator(
                'ytcp-text-dropdown-trigger:has-text("최신순"), '
                'ytcp-dropdown-trigger:has-text("최신순"), '
                ':text("게시된 날짜(최신순)")'
            ).first
            if await sort_trigger.count() > 0 and await sort_trigger.is_visible():
                await sort_trigger.click(force=True)
                await asyncio.sleep(1.2)
                oldest_opt = page.locator('tp-yt-paper-item:has-text("게시된 날짜(오래된순)")').first
                if await oldest_opt.count() > 0:
                    await oldest_opt.click(force=True)
                    await asyncio.sleep(1.2)
                    save_btn = page.locator('ytcp-button#save-button, ytcp-button#save, ytcp-button:has-text("저장")').first
                    if await save_btn.count() > 0:
                        await save_btn.click(force=True)
                        await asyncio.sleep(2.5)
                        print(f"[{pl_key.upper()}] Sorted playlist {pid} Oldest First!", flush=True)

        await ctx.close()


if __name__ == "__main__":
    asyncio.run(main())
