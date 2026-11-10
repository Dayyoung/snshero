#!/usr/bin/env python3
"""
Manages the SNSHero Official YouTube Channel (`https://www.youtube.com/@snshero`, `UCA6QmKiPstbiyBUHtnSMxyA`):
1. Bulk-deletes ALL existing videos and Shorts from YouTube Studio (`/videos/upload` & `/videos/short`).
2. Creates 4 official playlists:
   - EN_FULL:   `SNSHero.com - Kadan's Journey | Official Webtoon (English Dub · 40 Episodes)`
   - EN_SHORTS: `SNSHero.com - Kadan's Journey | Official Webtoon Shorts (English · 40 Episodes)`
   - KO_FULL:   `눈히어로.com - 카단의 여정 | 공식 웹툰 (한국어 더빙 · 전 40화)`
   - KO_SHORTS: `눈히어로.com - 카단의 여정 | 공식 웹툰 쇼츠 (한국어 · 전 40화)`
3. Uploads today's 80 English videos (40 English Full Episodes + 40 English Shorts) to `@snshero`
   (or Korean batch when invoked with `--batch ko`).
4. Fetches Playlist IDs via YouTube Data API v3 (`AIzaSyBa9TidLv_iwMyB-9VSrVGWEVUr0WyjiQU`),
   sets playlist sort order to Oldest First (`게시된 날짜(오래된순)`), and updates codebase mappings.
"""

import json
import re
import shutil
import sys
import time
import urllib.request
from pathlib import Path
from typing import Dict, Optional
from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MAPPING_FILE = PROJECT_ROOT / "src/content/movieEpisodeMapping.ts"
VIDEOS_ROOT = PROJECT_ROOT / "exports/webtoon_videos"
STATE_FILE = PROJECT_ROOT / "scripts/youtube_webtoon_160_state.json"

YOUTUBE_API_KEY = "AIzaSyBa9TidLv_iwMyB-9VSrVGWEVUr0WyjiQU"
CHANNEL_ID = "UCA6QmKiPstbiyBUHtnSMxyA"
PROFILE_DIR_NAME = "Profile 6"
TMP_CHROME_DIR = Path("/tmp/yt_studio_chrome_profile6")

PLAYLIST_TITLES = {
    "en_full": "SNSHero.com - Kadan's Journey | Official Webtoon (English Dub · 40 Episodes)",
    "en_shorts": "SNSHero.com - Kadan's Journey | Official Webtoon Shorts (English · 40 Episodes)",
    "ko_full": "눈히어로.com - 카단의 여정 | 공식 웹툰 (한국어 더빙 · 전 40화)",
    "ko_shorts": "눈히어로.com - 카단의 여정 | 공식 웹툰 쇼츠 (한국어 · 전 40화)",
}


def log(msg: str) -> None:
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def ensure_chrome_profile() -> None:
    src_root = Path("/Users/dayyoung/Library/Application Support/Google/Chrome")
    if not TMP_CHROME_DIR.exists() or not (TMP_CHROME_DIR / PROFILE_DIR_NAME).exists():
        log(f"Copying Chrome {PROFILE_DIR_NAME} to {TMP_CHROME_DIR} ...")
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
            "arcKo": "눈히어로.com 공식 다크 판타지 연대기",
            "arcEn": m.group(5),
            "synopsisKo": m.group(6),
            "synopsisEn": m.group(7),
        }
    return episodes


def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "channel_id": CHANNEL_ID,
        "deleted_existing_videos": False,
        "playlists": {
            "en_full": None,
            "en_shorts": None,
            "ko_full": None,
            "ko_shorts": None,
        },
        "videos": {
            "en_full": {},
            "en_shorts": {},
            "ko_full": {},
            "ko_shorts": {},
        },
    }


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")


def refresh_playlist_ids_from_api(state: dict) -> None:
    url = (
        f"https://www.googleapis.com/youtube/v3/playlists"
        f"?part=snippet,contentDetails&channelId={CHANNEL_ID}&maxResults=50&key={YOUTUBE_API_KEY}"
    )
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        title_to_id = {}
        for item in data.get("items", []):
            t = item.get("snippet", {}).get("title", "").strip()
            pid = item.get("id")
            if t and pid:
                title_to_id[t] = pid
        for key, target_title in PLAYLIST_TITLES.items():
            if target_title in title_to_id:
                state["playlists"][key] = title_to_id[target_title]
        save_state(state)
    except Exception as e:
        log(f"Warning refreshing playlist IDs from API: {e}")


def bypass_studio_interstitials(page) -> None:
    try:
        skip_btn = page.locator(
            'a:has-text("YOUTUBE 스튜디오로 건너뛰기"), '
            'a:has-text("Skip to YouTube Studio"), '
            'button:has-text("YOUTUBE 스튜디오로 건너뛰기"), '
            ':text("YOUTUBE 스튜디오로 건너뛰기")'
        ).first
        if skip_btn.count() > 0 and skip_btn.is_visible():
            skip_btn.click(force=True)
            time.sleep(4.0)
        cont_btn = page.locator(
            'ytcp-button:has-text("계속"), ytcp-button:has-text("Continue"), ytcp-button#dismiss-button'
        ).first
        if cont_btn.count() > 0 and cont_btn.is_visible():
            cont_btn.click(force=True)
            time.sleep(1.5)
    except Exception:
        pass


def bulk_delete_all_videos_on_tab(page, tab_url: str, tab_label: str) -> int:
    """
    Repeatedly selects all rows on `tab_url` (`/videos/upload` or `/videos/short`)
    and permanently deletes them in batches of 30 until 0 rows remain.
    """
    deleted_batches = 0
    for round_idx in range(1, 20):
        log(f"[{tab_label}] Navigating to {tab_url} (batch check #{round_idx})...")
        page.goto(tab_url, wait_until="domcontentloaded", timeout=45000)
        time.sleep(5.0)
        bypass_studio_interstitials(page)

        row_count = page.locator("ytcp-video-row").count()
        log(f"[{tab_label}] Visible video rows on page: {row_count}")
        if row_count == 0:
            log(f"[{tab_label}] 0 videos remaining on {tab_label}!")
            break

        first_link = page.locator("ytcp-video-row a[href*='/video/']").first
        first_href = first_link.get_attribute("href") if first_link.count() > 0 else None

        hdr_chk = page.locator("#selection-checkbox").first
        if hdr_chk.count() == 0:
            break
        hdr_chk.click()
        time.sleep(1.5)

        more_btn = page.locator(
            "ytcp-bulk-actions #additional-action-options, "
            'ytcp-bulk-actions :text("추가 작업"), '
            'ytcp-bulk-actions :text("More actions")'
        ).first
        more_btn.click()
        time.sleep(1.5)

        del_item = page.locator(
            'tp-yt-paper-item#text-item-1, '
            'tp-yt-paper-item:has-text("완전삭제"), '
            'tp-yt-paper-item:has-text("완전히 삭제"), '
            'tp-yt-paper-item:has-text("Delete forever")'
        ).first
        del_item.click()
        time.sleep(2.0)

        confirm_chk = page.locator("ytcp-confirmation-dialog ytcp-checkbox-lit#confirm-checkbox, ytcp-confirmation-dialog #confirm-checkbox").first
        confirm_chk.wait_for(state="visible", timeout=10000)
        confirm_chk.click()
        time.sleep(1.0)

        confirm_btn = page.locator("ytcp-confirmation-dialog ytcp-button#confirm-button").first
        confirm_btn.wait_for(state="visible", timeout=10000)
        confirm_btn.click()
        log(f"[{tab_label}] Triggered permanent deletion of {row_count} videos (batch #{round_idx}, first={first_href})...")

        # Wait until the first deleted row disappears from DOM (up to 180s for 30 videos)
        for wait_s in range(120):
            time.sleep(1.5)
            if first_href and page.locator(f'ytcp-video-row a[href="{first_href}"]').count() == 0:
                log(f"[{tab_label}] Batch #{round_idx} deletion completed in {(wait_s+1)*1.5:.1f}s!")
                break
            if page.locator("ytcp-video-row").count() == 0:
                break
        time.sleep(2.5)
        deleted_batches += 1

    return deleted_batches


def delete_old_playlists(page) -> None:
    """Deletes legacy playlists that are not in PLAYLIST_TITLES."""
    url = (
        f"https://www.googleapis.com/youtube/v3/playlists"
        f"?part=snippet&channelId={CHANNEL_ID}&maxResults=50&key={YOUTUBE_API_KEY}"
    )
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        log(f"Could not query old playlists via API: {e}")
        return

    keep_titles = set(PLAYLIST_TITLES.values())
    for item in data.get("items", []):
        pl_id = item.get("id")
        title = item.get("snippet", {}).get("title", "").strip()
        if not pl_id or title in keep_titles:
            continue
        try:
            edit_url = f"https://studio.youtube.com/playlist/{pl_id}/edit"
            log(f"Deleting old playlist '{title}' ({pl_id})...")
            page.goto(edit_url, wait_until="domcontentloaded", timeout=35000)
            time.sleep(4.0)
            more_btn = page.locator("ytcp-button#overflow-menu-button, #overflow-menu-button").first
            if more_btn.count() > 0 and more_btn.is_visible():
                more_btn.click()
                time.sleep(1.2)
                del_opt = page.locator(
                    'tp-yt-paper-item:has-text("재생목록 삭제"), '
                    'tp-yt-paper-item:has-text("Delete playlist"), '
                    'tp-yt-paper-item:has-text("삭제")'
                ).first
                if del_opt.count() > 0 and del_opt.is_visible():
                    del_opt.click()
                    time.sleep(1.5)
                    confirm_btn = page.locator("ytcp-confirmation-dialog ytcp-button#confirm-button").first
                    if confirm_btn.count() > 0 and confirm_btn.is_visible():
                        confirm_btn.click()
                        time.sleep(2.5)
                        log(f"Deleted old playlist '{title}' ({pl_id}).")
        except Exception as e:
            log(f"Note deleting old playlist {pl_id}: {e}")


def ensure_all_4_playlists_exist_in_dialog(page, dialog, active_playlist_title: str, ep: int) -> None:
    """
    Opens `ytcp-video-metadata-playlists` inside the upload dialog, ensures all 4 playlists
    in PLAYLIST_TITLES exist (creating any missing ones), and selects ONLY `active_playlist_title`.
    """
    try:
        playlist_trigger = dialog.locator("ytcp-video-metadata-playlists").first
        if playlist_trigger.count() == 0:
            return
        playlist_trigger.scroll_into_view_if_needed()
        playlist_trigger.click()
        time.sleep(2.0)

        pl_dialog = page.locator("ytcp-playlist-dialog")

        # First ensure all 4 playlists exist
        for pl_key, target_title in PLAYLIST_TITLES.items():
            pl_item = page.locator(f'label:has-text("{target_title}")').first
            if pl_item.count() == 0:
                log(f"[Playlist Init] Creating playlist '{target_title}'...")
                new_pl_btn = page.locator(
                    'ytcp-button:has-text("재생목록 만들기"), '
                    "ytcp-button#new-playlist-button, "
                    'ytcp-button:has-text("새 재생목록"), '
                    'ytcp-button:has-text("New playlist")'
                ).first
                if new_pl_btn.count() > 0:
                    new_pl_btn.click()
                    time.sleep(1.2)
                    sub_item = page.locator(
                        'tp-yt-paper-item:has-text("새 재생목록"), '
                        'tp-yt-paper-item:has-text("새로운 재생목록"), '
                        'tp-yt-paper-item#text-item-0, '
                        'tp-yt-paper-item:has-text("New playlist")'
                    ).first
                    if sub_item.count() > 0 and sub_item.is_visible():
                        sub_item.click()
                        time.sleep(1.8)
                    pl_title_box = page.locator("#textbox:visible").first
                    pl_title_box.wait_for(state="visible", timeout=10000)
                    pl_title_box.click()
                    page.keyboard.press("Meta+A")
                    page.keyboard.press("Backspace")
                    pl_title_box.fill(target_title)
                    time.sleep(0.8)
                    create_pl_confirm = page.locator("ytcp-button#create-button").first
                    create_pl_confirm.click()
                    time.sleep(3.5)

        # Now ensure ONLY active_playlist_title is checked
        for pl_key, target_title in PLAYLIST_TITLES.items():
            lbl = page.locator(f'label:has-text("{target_title}")').first
            if lbl.count() == 0:
                continue
            chk = lbl.locator("ytcp-checkbox-lit, tp-yt-paper-checkbox").first
            is_checked = False
            if chk.count() > 0:
                aria_chk = chk.get_attribute("aria-checked")
                checked_attr = chk.get_attribute("checked")
                is_checked = (aria_chk == "true") or (checked_attr is not None)
            should_check = (target_title == active_playlist_title)
            if is_checked != should_check:
                lbl.click()
                time.sleep(0.5)

        pl_done = page.locator(
            'ytcp-playlist-dialog ytcp-button#done-button, '
            'ytcp-playlist-dialog ytcp-button:has-text("완료"), '
            'ytcp-playlist-dialog ytcp-button:has-text("저장"), '
            'ytcp-button:has-text("완료")'
        ).first
        if pl_done.count() > 0 and pl_done.is_visible():
            pl_done.click()
            time.sleep(0.8)
    except Exception as e:
        log(f"[EP{ep:02d}] Playlist selection warning: {e}")


def build_metadata(ep: int, meta: Dict[str, str], category: str) -> tuple[str, str]:
    title_en = meta.get("titleEn", f"Episode {ep}")
    title_ko = meta.get("titleKo", f"제{ep}화")
    arc_en = meta.get("arcEn", "SNSHero.com Official Dark Fantasy Saga")
    arc_ko = meta.get("arcKo", "눈히어로.com 공식 다크 판타지 연대기")
    syn_en = meta.get("synopsisEn", "")
    syn_ko = meta.get("synopsisKo", "")

    if category == "en_full":
        yt_title = f"SNSHero.com Webtoon EP{ep:02d} - {title_en} (English Dub)"
        yt_desc = (
            f"🎨 SNSHero.com - Kadan's Journey | Official Webtoon — Episode {ep:02d}: {title_en} (Full English Dub)\n"
            f"({arc_en})\n\n"
            f"📖 Episode Synopsis:\n{syn_en}\n\n"
            f"⚔️ Play the Free 3x3 Tactical Card RPG & Read All 40 Webtoon Episodes at https://snshero.com !\n"
            f"👉 Direct Episode Link: https://snshero.com/#webtoon\n\n"
            f"#SNSHero #Webtoon #DarkFantasy #FantasyAnime #CardBattleGame #AudioWebtoon #RPG"
        )
    elif category == "en_shorts":
        yt_title = f"SNSHero Webtoon Shorts EP{ep:02d} - {title_en} #Shorts"
        yt_desc = (
            f"⚡ SNSHero.com - Kadan's Journey | Webtoon Shorts — Episode {ep:02d}: {title_en}\n"
            f"({arc_en})\n\n"
            f"📖 {syn_en}\n\n"
            f"🎮 Play the Webtoon Card Battle Game Free Now: https://snshero.com\n\n"
            f"#Shorts #SNSHero #Webtoon #DarkFantasy #AnimeShorts #CardGame"
        )
    elif category == "ko_full":
        yt_title = f"눈히어로 웹툰 {ep:02d}화 - {title_ko} (한국어 풀더빙)"
        yt_desc = (
            f"🎨 눈히어로(SNSHero.com) - 카단의 여정 | 공식 웹툰 제{ep:02d}화: {title_ko} (한국어 성우 풀더빙)\n"
            f"({arc_ko})\n\n"
            f"📖 줄거리:\n{syn_ko}\n\n"
            f"⚔️ 지금 https://snshero.com (눈히어로.com)에서 웹툰 원작 3x3 전략 카드배틀 게임을 무료로 플레이하세요!\n\n"
            f"#눈히어로 #SNSHero #웹툰 #판타지웹툰 #더빙웹툰 #카드게임 #다크판타지"
        )
    else:
        yt_title = f"눈히어로 웹툰 쇼츠 {ep:02d}화 - {title_ko} #Shorts"
        yt_desc = (
            f"⚡ 눈히어로(SNSHero.com) - 카단의 여정 | 웹툰 쇼츠 제{ep:02d}화: {title_ko}\n"
            f"({arc_ko})\n\n"
            f"📖 {syn_ko}\n\n"
            f"🎮 웹툰 원작 카드게임 무료 플레이: https://snshero.com (눈히어로.com)\n\n"
            f"#Shorts #쇼츠 #눈히어로 #SNSHero #웹툰쇼츠 #판타지웹툰 #카드게임"
        )
    return yt_title[:100], yt_desc


def find_video_file(category: str, ep: int) -> Optional[Path]:
    folder_map = {
        "en_full": VIDEOS_ROOT / "en",
        "en_shorts": VIDEOS_ROOT / "shorts_en",
        "ko_full": VIDEOS_ROOT / "ko",
        "ko_shorts": VIDEOS_ROOT / "shorts_ko",
    }
    folder = folder_map[category]
    prefix = f"EP{ep:02d} " if category.startswith("en_") else f"{ep:02d}화 "
    matches = sorted(folder.glob(f"{prefix}*.mp4"))
    return matches[0] if matches else None


def upload_single_video(
    page,
    mp4_path: Path,
    yt_title: str,
    yt_desc: str,
    playlist_title: str,
    ep: int,
    category: str,
) -> tuple[Optional[str], bool]:
    upload_url = f"https://studio.youtube.com/channel/{CHANNEL_ID}/content?d=ud"
    log(f"--- Uploading [{category.upper()} EP{ep:02d}/40]: {mp4_path.name} -> '{yt_title}' ---")
    page.goto(upload_url, wait_until="domcontentloaded", timeout=45000)
    time.sleep(3.5)
    bypass_studio_interstitials(page)

    file_input = page.locator("input[type=file]")
    if file_input.count() == 0:
        create_btn = page.locator("ytcp-button#create-icon, #create-icon").first
        if create_btn.count() > 0:
            create_btn.click(force=True)
            time.sleep(1.5)
            upload_item = page.locator("tp-yt-paper-item#text-item-0").first
            if upload_item.count() > 0:
                upload_item.click(force=True)
                time.sleep(2.0)

    file_input = page.locator("input[type=file]").first
    file_input.set_input_files(str(mp4_path))

    dialog = page.locator("ytcp-uploads-dialog")
    video_id = None
    limit_hit = False
    for _ in range(45):
        time.sleep(1.0)
        body_txt = dialog.inner_text() if dialog.count() > 0 else page.inner_text("body")
        if "일일 업로드 한도" in body_txt or "Daily upload limit" in body_txt:
            log(f"[{category.upper()} EP{ep:02d}] Daily upload limit reached on channel {CHANNEL_ID}!")
            limit_hit = True
            break
        links = dialog.locator("a[href*='youtu.be'], a[href*='youtube.com/shorts/']")
        if links.count() > 0:
            href = links.first.get_attribute("href") or ""
            if "youtu.be/" in href:
                video_id = href.split("youtu.be/")[-1].split("?")[0].strip()
            elif "/shorts/" in href:
                video_id = href.split("/shorts/")[-1].split("?")[0].strip()
            if video_id:
                break

    if limit_hit:
        return None, True
    if not video_id:
        log(f"[{category.upper()} EP{ep:02d}] Could not detect video_id within 45s.")
        return None, False

    log(f"[{category.upper()} EP{ep:02d}] Assigned YouTube Video ID: {video_id} (https://youtu.be/{video_id})")

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

    ensure_all_4_playlists_exist_in_dialog(page, dialog, playlist_title, ep)

    not_mfk = dialog.locator('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]').first
    not_mfk.scroll_into_view_if_needed()
    not_mfk.click()
    time.sleep(0.5)

    step3 = dialog.locator("#step-badge-3").first
    step3.click()
    time.sleep(1.1)

    pub_radio = dialog.locator('tp-yt-paper-radio-button[name="PUBLIC"]').first
    pub_radio.wait_for(state="visible", timeout=10000)
    pub_radio.click()
    time.sleep(0.7)

    done_btn = dialog.locator("#done-button").first
    for _ in range(90):
        disabled_attr = done_btn.get_attribute("disabled")
        aria_disabled = done_btn.get_attribute("aria-disabled")
        if disabled_attr is None and aria_disabled != "true":
            break
        time.sleep(1.0)

    done_btn.click()
    log(f"✅ [{category.upper()} EP{ep:02d}/40] PUBLISHED -> https://youtu.be/{video_id}")
    time.sleep(3.5)
    return video_id, False


def sort_playlist_oldest_first(page, playlist_id: Optional[str], label: str) -> None:
    if not playlist_id:
        return
    try:
        page.goto(f"https://studio.youtube.com/playlist/{playlist_id}/edit", wait_until="domcontentloaded", timeout=45000)
        time.sleep(4.0)
        sort_trigger = page.locator(
            'ytcp-text-dropdown-trigger:has-text("최신순"), '
            'ytcp-dropdown-trigger:has-text("최신순"), '
            ':text("게시된 날짜(최신순)")'
        ).first
        if sort_trigger.count() > 0 and sort_trigger.is_visible():
            sort_trigger.click(force=True)
            time.sleep(1.5)
            oldest_opt = page.locator('tp-yt-paper-item:has-text("게시된 날짜(오래된순)")').first
            if oldest_opt.count() > 0:
                oldest_opt.click(force=True)
                time.sleep(1.5)
                save_btn = page.locator('ytcp-button#save-button, ytcp-button#save, ytcp-button:has-text("저장")').first
                if save_btn.count() > 0:
                    save_btn.click(force=True)
                    time.sleep(3.0)
                    log(f"[{label}] Set playlist {playlist_id} sort order to Oldest First.")
    except Exception as e:
        log(f"[{label}] Playlist sort note: {e}")


def update_codebase_from_state(state: dict) -> None:
    en_full_ids: Dict[str, str] = state["videos"].get("en_full", {})
    en_shorts_ids: Dict[str, str] = state["videos"].get("en_shorts", {})
    en_full_pl: Optional[str] = state["playlists"].get("en_full")
    en_shorts_pl: Optional[str] = state["playlists"].get("en_shorts")

    if not en_full_ids and not en_shorts_ids:
        return

    mapping_txt = MAPPING_FILE.read_text(encoding="utf-8")
    for ep_str, vid in en_full_ids.items():
        ep_num = int(ep_str)
        pattern = re.compile(
            rf"(episodeNumber:\s*{ep_num}\b.*?videoId:\s*\")([^\"]+)(\")",
            re.DOTALL,
        )
        mapping_txt = pattern.sub(rf"\g<1>{vid}\g<3>", mapping_txt, count=1)

    for ep_str, svid in en_shorts_ids.items():
        ep_num = int(ep_str)
        pattern = re.compile(
            rf"(episodeNumber:\s*{ep_num}\b.*?movieVideoId:\s*\")([^\"]+)(\")",
            re.DOTALL,
        )
        mapping_txt = pattern.sub(rf"\g<1>{svid}\g<3>", mapping_txt, count=1)

    MAPPING_FILE.write_text(mapping_txt, encoding="utf-8")

    ep1_full = en_full_ids.get("1")
    if en_full_pl and ep1_full:
        for rel in ["src/views/MovieView.tsx", "src/views/AnimeView.tsx"]:
            fp = PROJECT_ROOT / rel
            if fp.exists():
                txt = fp.read_text(encoding="utf-8")
                txt = re.sub(
                    r"const YOUTUBE_PLAYLIST_ID = '[^']+';",
                    f"const YOUTUBE_PLAYLIST_ID = '{en_full_pl}';",
                    txt,
                )
                txt = re.sub(
                    r"const YOUTUBE_PLAYLIST_URL = 'https://www\.youtube\.com/watch\?v=[^']+';",
                    f"const YOUTUBE_PLAYLIST_URL = 'https://www.youtube.com/watch?v={ep1_full}&list={en_full_pl}';",
                    txt,
                )
                fp.write_text(txt, encoding="utf-8")

    ep1_shorts = en_shorts_ids.get("1")
    if en_shorts_pl and ep1_shorts:
        cfp = PROJECT_ROOT / "src/views/CinemaView.tsx"
        if cfp.exists():
            ctxt = cfp.read_text(encoding="utf-8")
            ctxt = re.sub(
                r"const YOUTUBE_PLAYLIST_ID = '[^']+';",
                f"const YOUTUBE_PLAYLIST_ID = '{en_shorts_pl}';",
                ctxt,
            )
            ctxt = re.sub(
                r"const YOUTUBE_PLAYLIST_URL = 'https://www\.youtube\.com/watch\?v=[^']+';",
                f"const YOUTUBE_PLAYLIST_URL = 'https://www.youtube.com/watch?v={ep1_shorts}&list={en_shorts_pl}';",
                ctxt,
            )
            cfp.write_text(ctxt, encoding="utf-8")


def create_4_playlists_and_bulk_assign_en(page, state: dict) -> None:
    """
    Ensures all 4 playlists exist via the bulk '재생목록에 추가' dialog on /videos/upload,
    assigns all 40 English Full videos (/videos/upload Page 1 & Page 2) to `en_full` playlist,
    and assigns all 40 English Shorts (/videos/short Page 1 & Page 2) to `en_shorts` playlist.
    """
    log("=== Ensuring all 4 playlists exist & bulk-assigning 40 EN Full + 40 EN Shorts ===")
    upload_tab = f"https://studio.youtube.com/channel/{CHANNEL_ID}/videos/upload"
    page.goto(upload_tab, wait_until="domcontentloaded", timeout=45000)
    time.sleep(5.0)
    bypass_studio_interstitials(page)

    page.locator("#selection-checkbox").first.click()
    time.sleep(1.5)
    page.locator('ytcp-bulk-actions :text("재생목록에 추가")').first.click()
    time.sleep(2.5)

    for key, pl_title in PLAYLIST_TITLES.items():
        if page.locator(f'label:has-text("{pl_title}")').count() > 0:
            log(f"Playlist already exists: [{key}] {pl_title}")
            continue
        log(f"Creating playlist [{key}]: {pl_title}")
        new_btn = page.locator(
            'ytcp-button#new-playlist-button, '
            'ytcp-button:has-text("새 재생목록"), '
            'ytcp-button:has-text("재생목록 만들기")'
        ).first
        new_btn.click()
        time.sleep(1.5)
        sub = page.locator('tp-yt-paper-item:has-text("새 재생목록"), tp-yt-paper-item:has-text("새로운 재생목록"), tp-yt-paper-item#text-item-0').first
        if sub.count() > 0 and sub.is_visible():
            sub.click()
            time.sleep(1.8)
        tbox = page.locator("#textbox:visible").first
        tbox.click()
        page.keyboard.press("Meta+A")
        page.keyboard.press("Backspace")
        tbox.fill(pl_title)
        time.sleep(0.8)
        page.locator("ytcp-button#create-button").first.click()
        time.sleep(4.0)

    en_full_title = PLAYLIST_TITLES["en_full"]
    for key, pl_title in PLAYLIST_TITLES.items():
        lbl = page.locator(f'label:has-text("{pl_title}")').first
        if lbl.count() == 0:
            continue
        chk = lbl.locator("ytcp-checkbox-lit, tp-yt-paper-checkbox").first
        is_chk = (chk.get_attribute("aria-checked") == "true") or (chk.get_attribute("checked") is not None)
        should_chk = (key == "en_full")
        if is_chk != should_chk:
            lbl.click()
            time.sleep(0.5)

    page.locator('ytcp-button:has-text("저장")').first.click()
    log("[EN_FULL Page 1] Assigned 30 videos to playlist. Waiting 9s...")
    time.sleep(9.0)

    # Page 2 of /videos/upload (remaining 10 EN Full videos)
    page.goto(upload_tab, wait_until="domcontentloaded", timeout=45000)
    time.sleep(5.0)
    next_btn = page.locator("#navigate-after").first
    if next_btn.count() > 0:
        next_btn.click()
        time.sleep(4.5)
        page.locator("#selection-checkbox").first.click()
        time.sleep(1.5)
        page.locator('ytcp-bulk-actions :text("재생목록에 추가")').first.click()
        time.sleep(2.0)
        lbl = page.locator(f'label:has-text("{en_full_title}")').first
        lbl.click()
        time.sleep(0.8)
        page.locator('ytcp-button:has-text("저장")').first.click()
        log("[EN_FULL Page 2] Assigned remaining 10 videos to playlist. Waiting 8s...")
        time.sleep(8.0)

    # Page 1 & Page 2 of /videos/short -> en_shorts playlist
    en_shorts_title = PLAYLIST_TITLES["en_shorts"]
    short_tab = f"https://studio.youtube.com/channel/{CHANNEL_ID}/videos/short"
    for pg in (1, 2):
        page.goto(short_tab, wait_until="domcontentloaded", timeout=45000)
        time.sleep(5.0)
        if pg == 2:
            nbtn = page.locator("#navigate-after").first
            if nbtn.count() > 0:
                nbtn.click()
                time.sleep(4.5)
        page.locator("#selection-checkbox").first.click()
        time.sleep(1.5)
        page.locator('ytcp-bulk-actions :text("재생목록에 추가")').first.click()
        time.sleep(2.0)
        lbl = page.locator(f'label:has-text("{en_shorts_title}")').first
        lbl.click()
        time.sleep(0.8)
        page.locator('ytcp-button:has-text("저장")').first.click()
        log(f"[EN_SHORTS Page {pg}] Assigned videos to playlist. Waiting 8s...")
        time.sleep(8.0)

    refresh_playlist_ids_from_api(state)
    for key, pid in state["playlists"].items():
        if pid:
            sort_playlist_oldest_first(page, pid, key.upper())


def main() -> None:
    batch_mode = sys.argv[1].lower() if len(sys.argv) > 1 else "en"  # 'en' | 'ko' | 'all'
    episodes = parse_episodes()
    state = load_state()
    save_state(state)

    ensure_chrome_profile()

    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=str(TMP_CHROME_DIR),
            channel="chrome",
            headless=True,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
            ignore_default_args=["--use-mock-keychain", "--password-store=basic"],
            args=[f"--profile-directory={PROFILE_DIR_NAME}", "--disable-blink-features=AutomationControlled"],
            viewport={"width": 1440, "height": 900},
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()

        try:
            # 1. Delete all existing videos & shorts if not yet done
            if not state.get("deleted_existing_videos"):
                log("=== [STEP 1] Deleting ALL existing videos & Shorts on @snshero ===")
                bulk_delete_all_videos_on_tab(
                    page,
                    f"https://studio.youtube.com/channel/{CHANNEL_ID}/videos/upload",
                    "VIDEOS",
                )
                bulk_delete_all_videos_on_tab(
                    page,
                    f"https://studio.youtube.com/channel/{CHANNEL_ID}/videos/short",
                    "SHORTS",
                )
                delete_old_playlists(page)
                state["deleted_existing_videos"] = True
                save_state(state)
                log("=== [STEP 1 COMPLETE] All old videos, Shorts, and legacy playlists removed! ===")

            # 2. Upload target categories
            categories = ["en_full", "en_shorts"] if batch_mode == "en" else (
                ["ko_full", "ko_shorts"] if batch_mode == "ko" else ["en_full", "en_shorts", "ko_full", "ko_shorts"]
            )

            limit_hit = False
            for cat in categories:
                if limit_hit:
                    break
                pl_title = PLAYLIST_TITLES[cat]
                log(f"=== [STEP 2] Uploading Category '{cat}' (40 videos) -> Playlist '{pl_title}' ===")

                for ep in range(1, 41):
                    ep_str = str(ep)
                    if ep_str in state["videos"][cat] and state["videos"][cat][ep_str]:
                        continue

                    mp4_path = find_video_file(cat, ep)
                    if not mp4_path or not mp4_path.exists():
                        log(f"[{cat} EP{ep:02d}] File not found! Skipping.")
                        continue

                    meta = episodes.get(ep, {})
                    yt_title, yt_desc = build_metadata(ep, meta, cat)

                    for attempt in range(2):
                        try:
                            vid, limit_hit = upload_single_video(
                                page, mp4_path, yt_title, yt_desc, pl_title, ep, cat
                            )
                            if limit_hit:
                                break
                            if vid:
                                state["videos"][cat][ep_str] = vid
                                save_state(state)
                                if ep == 1 or ep % 10 == 0 or ep == 40:
                                    refresh_playlist_ids_from_api(state)
                                    update_codebase_from_state(state)
                                break
                        except Exception as e:
                            log(f"[{cat} EP{ep:02d}] Attempt {attempt+1} error: {e}")
                            time.sleep(3.0)

                    if limit_hit:
                        break

                refresh_playlist_ids_from_api(state)
                if state["playlists"].get(cat):
                    sort_playlist_oldest_first(page, state["playlists"].get(cat), cat.upper())

            if not state["playlists"].get("en_full") or not state["playlists"].get("en_shorts"):
                create_4_playlists_and_bulk_assign_en(page, state)

            refresh_playlist_ids_from_api(state)
            update_codebase_from_state(state)
        finally:
            ctx.close()

    log("=== SUMMARY ===")
    for k, pid in state["playlists"].items():
        cnt = len(state["videos"].get(k, {}))
        log(f"  • {k}: {cnt}/40 uploaded | Playlist ID: {pid} | Title: {PLAYLIST_TITLES[k]}")


if __name__ == "__main__":
    main()
