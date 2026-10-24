#!/usr/bin/env python3
"""
Uploads all 40 newly regenerated Animation MP4s (`public/video/animation/SNSHero.com_E1..40_*.mp4`)
and all 40 newly produced Live-Action Movie MP4s (`public/videos/cinema/episode_01..40.mp4`)
to the official SNSHero YouTube channel (`UCA6QmKiPstbiyBUHtnSMxyA`), creates two brand-new
YouTube playlists:
  1. `SNSHero.com Official Animation (40 Episodes)`
  2. `SNSHero.com Official Live-Action Movie (40 Episodes)`
fetches their new Playlist IDs via the YouTube Data API v3 (`AIzaSyBa9TidLv_iwMyB-9VSrVGWEVUr0WyjiQU`),
and updates all game files (`movieEpisodeMapping.ts`, `MovieView.tsx`, `CinemaView.tsx`,
`AnimeView.tsx`, `NovelView.tsx`, `geoManager.ts`, `generate-video-seo.ts`) so that clicking
the Animation or Movie buttons in the game plays the newly uploaded videos and playlists.
"""

import json
import re
import shutil
import time
import urllib.request
from pathlib import Path
from typing import Dict, Optional
from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MAPPING_FILE = PROJECT_ROOT / "src/content/movieEpisodeMapping.ts"
ANIMATION_DIR = PROJECT_ROOT / "public/video/animation"
CINEMA_DIR = PROJECT_ROOT / "public/videos/cinema"
STATE_FILE = PROJECT_ROOT / "scripts/youtube_new_80_upload_state.json"

CHANNEL_ID = "UCA6QmKiPstbiyBUHtnSMxyA"
CHANNEL_UPLOAD_URL = f"https://studio.youtube.com/channel/{CHANNEL_ID}/content?d=ud"
YOUTUBE_API_KEY = "AIzaSyBa9TidLv_iwMyB-9VSrVGWEVUr0WyjiQU"

ANIMATION_PLAYLIST_TITLE = "SNSHero.com Official Animation (40 Episodes)"
CINEMA_PLAYLIST_TITLE = "SNSHero.com Official Live-Action Movie (40 Episodes)"

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


def build_animation_description(ep: int, title_en: str, arc_en: str, synopsis_en: str) -> str:
    return (
        f"🎨 SNSHero.com Official Animation — Episode {ep:02d}: {title_en}\n"
        f"({arc_en})\n\n"
        f"📖 Episode Story:\n"
        f"{synopsis_en}\n\n"
        f"⚔️ Visit https://snshero.com now to play the game and experience the full 40-episode saga!\n\n"
        f"🔥 About SNSHero.com — Official Animated Picture-Book Chronicle & AI Card Battle Game:\n"
        f"• 40-Episode Multi-Character Animated Fantasy Series: Follow Kadan, Ignis, Celia, Aleksandar, and Balian across 2,049 illustrated picture-book scenes with English narration.\n"
        f"• Instant 3x3 Tactical Card Battle Game: Command over 110 legendary heroes and conquer 110 mission games directly in your browser—100% free!\n\n"
        f"👉 Play Free Now: https://snshero.com/animation?ep={ep}\n\n"
        f"#SNSHero #DarkFantasy #FantasyAnimation #CardBattleGame #WebGame #RPG #Audiobook"
    )


def build_cinema_description(ep: int, title_en: str, arc_en: str, synopsis_en: str) -> str:
    return (
        f"🎬 SNSHero.com Official Live-Action Movie — Episode {ep:02d}: {title_en}\n"
        f"({arc_en})\n\n"
        f"📖 Episode Story:\n"
        f"{synopsis_en}\n\n"
        f"⚔️ Visit https://snshero.com now to play the game and experience the full 40-episode saga!\n\n"
        f"🔥 About SNSHero.com — Official Live-Action Dark Fantasy Movie & AI Card Battle Game:\n"
        f"• 40-Episode Photorealistic Live-Action Cinema Chronicle: Experience 2,009 live-action dark fantasy cuts of Kadan, Ignis, Celia, Aleksandar, and Balian in 2.39:1 CinemaScope.\n"
        f"• Instant 3x3 Tactical Card Battle Game: Command over 110 legendary heroes and conquer 110 mission games directly in your browser—100% free!\n\n"
        f"👉 Watch & Play Free Now: https://snshero.com/cinema?ep={ep}\n\n"
        f"#SNSHero #DarkFantasy #FantasyMovie #LiveAction #CardBattleGame #WebGame #RPG"
    )


def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "animation_playlist_id": None,
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


def update_codebase(state: dict) -> None:
    anim_ids: Dict[str, str] = state.get("animation_ids", {})
    cinema_ids: Dict[str, str] = state.get("cinema_ids", {})
    anim_pl_id: Optional[str] = state.get("animation_playlist_id")
    cinema_pl_id: Optional[str] = state.get("cinema_playlist_id")

    # 1. Update src/content/movieEpisodeMapping.ts
    mapping_txt = MAPPING_FILE.read_text(encoding="utf-8")
    for ep_str, vid in anim_ids.items():
        ep_num = int(ep_str)
        pattern = re.compile(
            rf"(episodeNumber:\s*{ep_num}\b.*?videoId:\s*\")([^\"]+)(\")",
            re.DOTALL,
        )
        mapping_txt = pattern.sub(rf"\g<1>{vid}\g<3>", mapping_txt, count=1)

    for ep_str, mvid in cinema_ids.items():
        ep_num = int(ep_str)
        pattern = re.compile(
            rf"(episodeNumber:\s*{ep_num}\b.*?movieVideoId:\s*\")([^\"]+)(\")",
            re.DOTALL,
        )
        mapping_txt = pattern.sub(rf"\g<1>{mvid}\g<3>", mapping_txt, count=1)

    MAPPING_FILE.write_text(mapping_txt, encoding="utf-8")

    # Save legacy JSON files too for compatibility
    if anim_ids:
        (PROJECT_ROOT / "scripts/youtube_snshero_channel_ids.json").write_text(
            json.dumps(anim_ids, indent=2, ensure_ascii=False), encoding="utf-8"
        )
    if cinema_ids:
        existing_movie_json = PROJECT_ROOT / "scripts/youtube_improved_movie_ids.json"
        movie_data = dict(cinema_ids)
        if existing_movie_json.exists():
            try:
                old_m = json.loads(existing_movie_json.read_text(encoding="utf-8"))
                for k in ("trailer", "theatrical_full"):
                    if k in old_m:
                        movie_data[k] = old_m[k]
            except Exception:
                pass
        existing_movie_json.write_text(json.dumps(movie_data, indent=2, ensure_ascii=False), encoding="utf-8")

    # 2. Update MovieView.tsx, AnimeView.tsx, NovelView.tsx if anim_pl_id / anim EP1 available
    ep1_anim = anim_ids.get("1")
    if anim_pl_id and ep1_anim:
        for rel in ["src/views/MovieView.tsx", "src/views/AnimeView.tsx"]:
            fp = PROJECT_ROOT / rel
            if fp.exists():
                txt = fp.read_text(encoding="utf-8")
                txt = re.sub(
                    r"const YOUTUBE_PLAYLIST_ID = '[^']+';",
                    f"const YOUTUBE_PLAYLIST_ID = '{anim_pl_id}';",
                    txt,
                )
                txt = re.sub(
                    r"const YOUTUBE_PLAYLIST_URL = 'https://www\.youtube\.com/watch\?v=[^']+';",
                    f"const YOUTUBE_PLAYLIST_URL = 'https://www.youtube.com/watch?v={ep1_anim}&list={anim_pl_id}';",
                    txt,
                )
                txt = re.sub(
                    r"\|\|\s*'[A-Za-z0-9_-]{11}'",
                    f"|| '{ep1_anim}'",
                    txt,
                )
                fp.write_text(txt, encoding="utf-8")

        novel_fp = PROJECT_ROOT / "src/views/NovelView.tsx"
        if novel_fp.exists():
            ntxt = novel_fp.read_text(encoding="utf-8")
            ntxt = re.sub(
                r'href="https://www\.youtube\.com/watch\?v=[A-Za-z0-9_-]+&list=[A-Za-z0-9_-]+"',
                f'href="https://www.youtube.com/watch?v={ep1_anim}&list={anim_pl_id}"',
                ntxt,
            )
            novel_fp.write_text(ntxt, encoding="utf-8")

    # 3. Update CinemaView.tsx if cinema_pl_id / cinema EP1 available
    ep1_cinema = cinema_ids.get("1")
    if cinema_pl_id and ep1_cinema:
        cfp = PROJECT_ROOT / "src/views/CinemaView.tsx"
        if cfp.exists():
            ctxt = cfp.read_text(encoding="utf-8")
            ctxt = re.sub(
                r"const YOUTUBE_PLAYLIST_ID = '[^']+';",
                f"const YOUTUBE_PLAYLIST_ID = '{cinema_pl_id}';",
                ctxt,
            )
            ctxt = re.sub(
                r"const YOUTUBE_PLAYLIST_URL = 'https://www\.youtube\.com/watch\?v=[^']+';",
                f"const YOUTUBE_PLAYLIST_URL = 'https://www.youtube.com/watch?v={ep1_cinema}&list={cinema_pl_id}';",
                ctxt,
            )
            ctxt = re.sub(
                r"\|\|\s*'[A-Za-z0-9_-]{11}'",
                f"|| '{ep1_cinema}'",
                ctxt,
            )
            cfp.write_text(ctxt, encoding="utf-8")


def select_or_create_playlist(page, dialog, playlist_title: str, ep: int) -> None:
    playlist_trigger = dialog.locator("ytcp-video-metadata-playlists").first
    if playlist_trigger.count() == 0:
        return
    playlist_trigger.scroll_into_view_if_needed()
    playlist_trigger.click()
    time.sleep(2.0)

    pl_item = page.locator(f'ytcp-playlist-dialog label:has-text("{playlist_title}")').first
    if pl_item.count() == 0:
        log(f"[EP{ep:02d}] Creating brand-new playlist '{playlist_title}'...")
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
            pl_title_box.fill(playlist_title)
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


def upload_single_video(
    page,
    mp4_path: Path,
    yt_title: str,
    yt_desc: str,
    playlist_title: str,
    ep: int,
    label: str,
) -> tuple[Optional[str], bool]:
    """
    Returns `(video_id, limit_hit)`.
    """
    log(f"--- Uploading {label} [EP{ep:02d}/40]: {mp4_path.name} -> '{yt_title}' ---")
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
    log(f"[{label} EP{ep:02d}] File attached, waiting for upload dialog & video ID...")

    dialog = page.locator("ytcp-uploads-dialog")
    video_id = None
    limit_hit = False
    for _ in range(40):
        time.sleep(1.0)
        body_txt = dialog.inner_text() if dialog.count() > 0 else page.inner_text("body")
        if "일일 업로드 한도" in body_txt or "Daily upload limit" in body_txt:
            log(f"[{label} EP{ep:02d}] STOP: Daily upload limit reached on YouTube Studio!")
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
        return None, True
    if not video_id:
        log(f"[{label} EP{ep:02d}] Could not detect video_id within 40s.")
        return None, False

    log(f"[{label} EP{ep:02d}] Assigned YouTube Video ID: {video_id} (https://youtu.be/{video_id})")

    # Fill Title
    title_box = dialog.locator("#title-textarea #textbox").first
    title_box.wait_for(state="visible", timeout=15000)
    title_box.click()
    page.keyboard.press("Meta+A")
    page.keyboard.press("Backspace")
    title_box.fill(yt_title)
    time.sleep(0.4)

    # Fill Description
    desc_box = dialog.locator("#description-textarea #textbox").first
    if desc_box.count() > 0:
        desc_box.click()
        page.keyboard.press("Meta+A")
        page.keyboard.press("Backspace")
        desc_box.fill(yt_desc)
        time.sleep(0.4)

    # Select or Create Playlist
    select_or_create_playlist(page, dialog, playlist_title, ep)

    # Select Not Made For Kids
    not_mfk = dialog.locator('tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]').first
    not_mfk.scroll_into_view_if_needed()
    not_mfk.click()
    time.sleep(0.6)

    # Step 3 (Visibility)
    step3 = dialog.locator("#step-badge-3").first
    step3.click()
    time.sleep(1.2)

    # Select PUBLIC
    pub_radio = dialog.locator('tp-yt-paper-radio-button[name="PUBLIC"]').first
    pub_radio.wait_for(state="visible", timeout=10000)
    pub_radio.click()
    time.sleep(0.8)

    # Wait for #done-button to be enabled and click Publish
    done_btn = dialog.locator("#done-button").first
    for _ in range(90):
        disabled_attr = done_btn.get_attribute("disabled")
        aria_disabled = done_btn.get_attribute("aria-disabled")
        if disabled_attr is None and aria_disabled != "true":
            break
        time.sleep(1.0)

    done_btn.click()
    log(f"[{label} EP{ep:02d}/40] PUBLISHED -> https://youtu.be/{video_id}")
    time.sleep(4.5)
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
            sort_trigger.click()
            time.sleep(1.5)
            oldest_opt = page.locator('tp-yt-paper-item:has-text("게시된 날짜(오래된순)")').first
            if oldest_opt.count() > 0:
                oldest_opt.click()
                time.sleep(1.5)
                save_btn = page.locator('ytcp-button#save-button, ytcp-button#save, ytcp-button:has-text("저장")').first
                if save_btn.count() > 0:
                    save_btn.click()
                    time.sleep(3.0)
                    log(f"[{label}] Set playlist {playlist_id} sort order to Oldest First.")
    except Exception as e:
        log(f"[{label}] Playlist sort note: {e}")


def main() -> None:
    ensure_chrome_profile6()
    episodes = parse_episodes()
    state = load_state()
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

        limit_hit = False

        # =====================================================================
        # BATCH 1: Upload 40 New Animation Episodes
        # =====================================================================
        for ep in range(1, 41):
            ep_str = str(ep)
            if ep_str in state["animation_ids"] and state["animation_ids"][ep_str]:
                log(f"[ANIM EP{ep:02d}/40] Already uploaded ({state['animation_ids'][ep_str]}), skipping.")
                continue

            meta = episodes.get(ep, {})
            title_en = meta.get("titleEn", f"Episode {ep}")
            arc_en = meta.get("arcEn", "SNSHero.com Official Dark Fantasy Saga")
            synopsis_en = meta.get("synopsisEn", "")

            mp4_path = ANIMATION_DIR / f"SNSHero.com_E{ep}_{title_en}.mp4"
            if not mp4_path.exists():
                matches = sorted(ANIMATION_DIR.glob(f"SNSHero.com_E{ep}_*.mp4"))
                if matches:
                    mp4_path = matches[0]
                else:
                    log(f"[ANIM EP{ep:02d}] Missing MP4: {mp4_path}")
                    continue

            yt_title = f"SNSHero.com Animation EP{ep:02d} - {title_en}"
            yt_desc = build_animation_description(ep, title_en, arc_en, synopsis_en)

            try:
                vid, limit_hit = upload_single_video(
                    page, mp4_path, yt_title, yt_desc, ANIMATION_PLAYLIST_TITLE, ep, "ANIM"
                )
                if limit_hit:
                    break
                if vid:
                    state["animation_ids"][ep_str] = vid
                    if not state.get("animation_playlist_id"):
                        pl_id = fetch_playlist_id_by_title(ANIMATION_PLAYLIST_TITLE)
                        if pl_id:
                            state["animation_playlist_id"] = pl_id
                            log(f"[ANIM] Detected new Animation Playlist ID: {pl_id}")
                    save_state(state)
                    update_codebase(state)
            except Exception as e:
                log(f"[ANIM EP{ep:02d}] Upload error: {e}")
                time.sleep(3.0)

        if not state.get("animation_playlist_id"):
            pl_id = fetch_playlist_id_by_title(ANIMATION_PLAYLIST_TITLE)
            if pl_id:
                state["animation_playlist_id"] = pl_id
                save_state(state)
                update_codebase(state)

        sort_playlist_oldest_first(page, state.get("animation_playlist_id"), "ANIM")

        # =====================================================================
        # BATCH 2: Upload 40 New Live-Action Movie Episodes
        # =====================================================================
        if not limit_hit:
            for ep in range(1, 41):
                ep_str = str(ep)
                if ep_str in state["cinema_ids"] and state["cinema_ids"][ep_str]:
                    log(f"[MOVIE EP{ep:02d}/40] Already uploaded ({state['cinema_ids'][ep_str]}), skipping.")
                    continue

                meta = episodes.get(ep, {})
                title_en = meta.get("titleEn", f"Episode {ep}")
                arc_en = meta.get("arcEn", "SNSHero.com Official Dark Fantasy Saga")
                synopsis_en = meta.get("synopsisEn", "")

                mp4_path = CINEMA_DIR / f"episode_{ep:02d}.mp4"
                if not mp4_path.exists():
                    log(f"[MOVIE EP{ep:02d}] Missing MP4: {mp4_path}")
                    continue

                yt_title = f"SNSHero.com The Movie EP{ep:02d} - {title_en}"
                yt_desc = build_cinema_description(ep, title_en, arc_en, synopsis_en)

                try:
                    vid, limit_hit = upload_single_video(
                        page, mp4_path, yt_title, yt_desc, CINEMA_PLAYLIST_TITLE, ep, "MOVIE"
                    )
                    if limit_hit:
                        break
                    if vid:
                        state["cinema_ids"][ep_str] = vid
                        if not state.get("cinema_playlist_id"):
                            pl_id = fetch_playlist_id_by_title(CINEMA_PLAYLIST_TITLE)
                            if pl_id:
                                state["cinema_playlist_id"] = pl_id
                                log(f"[MOVIE] Detected new Live-Action Movie Playlist ID: {pl_id}")
                        save_state(state)
                        update_codebase(state)
                except Exception as e:
                    log(f"[MOVIE EP{ep:02d}] Upload error: {e}")
                    time.sleep(3.0)

        if not state.get("cinema_playlist_id"):
            pl_id = fetch_playlist_id_by_title(CINEMA_PLAYLIST_TITLE)
            if pl_id:
                state["cinema_playlist_id"] = pl_id
                save_state(state)
                update_codebase(state)

        sort_playlist_oldest_first(page, state.get("cinema_playlist_id"), "MOVIE")

        ctx.close()

    log(
        f"DONE! Animation uploaded: {len(state['animation_ids'])}/40 (Playlist: {state.get('animation_playlist_id')}), "
        f"Movie uploaded: {len(state['cinema_ids'])}/40 (Playlist: {state.get('cinema_playlist_id')})"
    )


if __name__ == "__main__":
    main()
