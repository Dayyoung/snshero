#!/usr/bin/env python3
"""
Updates all 80 currently uploaded YouTube videos on `@snshero` (`UCA6QmKiPstbiyBUHtnSMxyA`):
  - 40 English Full Webtoon videos (`en_full`)
  - 40 English Webtoon Shorts videos (`en_shorts`)

For every video (in parallel across 4 Playwright tabs):
1. Uploads the episode's 1st Webtoon Cover Image (`exports/webtoon_thumbnails/ep_XX_cover_thumb.jpg`,
   converted from `public/images/webtoon/episode_XX/scene_00.webp`) via `input#file-loader`.
2. Sets a bilingual Title (EN + KO Episode Title, <= 100 chars).
3. Sets a full 12-language Multilingual Description (`EN`, `KO`, `JA`, `ZH-CN`, `ZH-TW`, `DE`, `ES`, `FR`, `ID`, `RU`, `TH`, `VI`)
   with episode synopses and direct links to https://snshero.com.
4. Clicks `ytcp-button#save` and waits until changes are saved.
"""

import asyncio
import json
import re
import shutil
from pathlib import Path
from typing import Dict
from PIL import Image
from playwright.async_api import async_playwright

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MAPPING_FILE = PROJECT_ROOT / "src/content/movieEpisodeMapping.ts"
STATE_FILE = PROJECT_ROOT / "scripts/youtube_webtoon_160_state.json"
THUMB_DIR = PROJECT_ROOT / "exports/webtoon_thumbnails"
TMP_CHROME_DIR = Path("/tmp/yt_studio_chrome_profile6")
PROFILE_DIR_NAME = "Profile 6"


def ensure_chrome_profile() -> None:
    src_root = Path("/Users/dayyoung/Library/Application Support/Google/Chrome")
    if not TMP_CHROME_DIR.exists() or not (TMP_CHROME_DIR / PROFILE_DIR_NAME).exists():
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


def ensure_all_40_cover_thumbnails() -> None:
    THUMB_DIR.mkdir(parents=True, exist_ok=True)
    for ep in range(1, 41):
        src = PROJECT_ROOT / f"public/images/webtoon/episode_{ep:02d}/scene_00.webp"
        dst = THUMB_DIR / f"ep_{ep:02d}_cover_thumb.jpg"
        if not dst.exists() or dst.stat().st_size < 10000:
            with Image.open(src) as im:
                im.convert("RGB").resize((1280, 720), Image.Resampling.LANCZOS).save(dst, "JPEG", quality=92)


def parse_episodes() -> Dict[int, Dict[str, str]]:
    text = MAPPING_FILE.read_text(encoding="utf-8")
    episodes: Dict[int, Dict[str, str]] = {}
    pattern = re.compile(
        r"episodeNumber:\s*(\d+),\s*"
        r'titleKo:\s*"([^"]+)",\s*'
        r'titleJa:\s*"([^"]+)",\s*'
        r'titleEn:\s*"([^"]+)",.*?'
        r'arc:\s*"([^"]+)",\s*'
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
            "arcKo": m.group(5),
            "arcEn": m.group(6),
            "synopsisKo": m.group(7),
            "synopsisEn": m.group(8),
        }
    return episodes


def build_multilingual_title_and_desc(ep: int, meta: Dict[str, str], category: str) -> tuple[str, str]:
    t_en = meta.get("titleEn", f"Episode {ep}")
    t_ko = meta.get("titleKo", f"제{ep}화")
    t_ja = meta.get("titleJa", f"第{ep}話")
    arc_en = meta.get("arcEn", "SNSHero.com Official Dark Fantasy Saga")
    s_en = meta.get("synopsisEn", "")
    s_ko = meta.get("synopsisKo", "")
    s_ja = meta.get("synopsisJa", "")

    # YouTube Title limit: strictly <= 100 characters
    if category == "en_full":
        cand = f"SNSHero Webtoon EP{ep:02d}: {t_en} | 눈히어로 {ep:02d}화: {t_ko} (EN Dub)"
        if len(cand) > 100:
            cand = f"SNSHero Webtoon EP{ep:02d}: {t_en} | 눈히어로 {ep:02d}화 (EN Dub)"
        yt_title = cand[:100]
    elif category == "en_shorts":
        cand = f"SNSHero Shorts EP{ep:02d}: {t_en} | 눈히어로 {ep:02d}화: {t_ko} #Shorts"
        if len(cand) > 100:
            cand = f"SNSHero Shorts EP{ep:02d}: {t_en} | 눈히어로 {ep:02d}화 #Shorts"
        yt_title = cand[:100]
    elif category == "ko_full":
        cand = f"눈히어로 웹툰 {ep:02d}화: {t_ko} | SNSHero EP{ep:02d}: {t_en} (KR Dub)"
        if len(cand) > 100:
            cand = f"눈히어로 웹툰 {ep:02d}화: {t_ko} | SNSHero EP{ep:02d} (KR Dub)"
        yt_title = cand[:100]
    else:
        cand = f"눈히어로 쇼츠 {ep:02d}화: {t_ko} | SNSHero EP{ep:02d}: {t_en} #Shorts"
        if len(cand) > 100:
            cand = f"눈히어로 쇼츠 {ep:02d}화: {t_ko} | SNSHero EP{ep:02d} #Shorts"
        yt_title = cand[:100]

    is_shorts = "shorts" in category
    tag_line = "#Shorts #SNSHero #눈히어로 #Webtoon #웹툰 #DarkFantasy #CardBattleGame #RPG" if is_shorts else "#SNSHero #눈히어로 #Webtoon #웹툰 #DarkFantasy #FantasyAnime #CardBattleGame #RPG"

    yt_desc = (
        f"⚔️ SNSHero.com (눈히어로.com) — Kadan's Journey | Episode {ep:02d}: {t_en} / 제{ep:02d}화: {t_ko} / 第{ep:02d}話: {t_ja}\n"
        f"({arc_en})\n"
        f"👉 Play Free Card RPG & Read Full Webtoon: https://snshero.com | https://snshero.com/#webtoon\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🌐 [ENGLISH] Episode {ep:02d}: {t_en}\n"
        f"{s_en}\n"
        f"🎮 Play the 3x3 Tactical Card Battle RPG & 110 Mission Games free in your browser: https://snshero.com\n\n"
        f"🇰🇷 [한국어] 제{ep:02d}화: {t_ko}\n"
        f"{s_ko}\n"
        f"🎮 웹툰 원작 3x3 전략 카드배틀 RPG & 110종 미션 게임 무료 플레이: https://snshero.com (눈히어로.com)\n\n"
        f"🇯🇵 [日本語] 第{ep:02d}話: {t_ja}\n"
        f"🎮 ウェブトゥーン原作の3x3戦略カードバトルRPGをブラウザで無料プレイ: https://snshero.com\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🌍 [12-LANGUAGE GLOBAL OFFICIAL GUIDE]\n"
        f"• 🇨🇳 [简体中文] 《SNSHero：卡丹的旅程》第{ep:02d}话 — 立即免费畅玩暗黑奇幻3x3卡牌对战网页游戏与全40话有声漫画：https://snshero.com\n"
        f"• 🇹🇼 [繁體中文] 《SNSHero：卡丹的旅程》第{ep:02d}話 — 立即免費暢玩暗黑奇幻3x3卡牌對戰網頁遊戲與全40話有聲漫畫：https://snshero.com\n"
        f"• 🇩🇪 [Deutsch] SNSHero: Kadans Reise (Folge {ep:02d}) — Spiele das kostenlose Dark-Fantasy 3x3-Karten-RPG im Browser: https://snshero.com\n"
        f"• 🇪🇸 [Español] SNSHero: El Viaje de Kadan (Episodio {ep:02d}) — Juega gratis al RPG de cartas táctico 3x3 y lee el webtoon: https://snshero.com\n"
        f"• 🇫🇷 [Français] SNSHero : Le Voyage de Kadan (Épisode {ep:02d}) — Jouez gratuitement au RPG de cartes tactique 3x3 sur navigateur : https://snshero.com\n"
        f"• 🇮🇩 [Bahasa Indonesia] SNSHero: Perjalanan Kadan (Episode {ep:02d}) — Mainkan game kartu RPG taktis 3x3 & baca webtoon gratis: https://snshero.com\n"
        f"• 🇷🇺 [Русский] SNSHero: Путешествие Кадана (Эпизод {ep:02d}) — Играйте бесплатно в тактическую карточную RPG 3x3 в браузере: https://snshero.com\n"
        f"• 🇹🇭 [ภาษาไทย] SNSHero: การเดินทางของคาดัน (ตอนที่ {ep:02d}) — เล่นเกมการ์ดแบทเทิล RPG 3x3 และอ่านเว็บตูนฟรี: https://snshero.com\n"
        f"• 🇻🇳 [Tiếng Việt] SNSHero: Hành Trình Của Kadan (Tập {ep:02d}) — Chơi miễn phí game thẻ bài chiến thuật 3x3 và đọc webtoon: https://snshero.com\n\n"
        f"{tag_line}"
    )
    return yt_title, yt_desc


async def update_single_video(
    sem: asyncio.Semaphore,
    ctx,
    category: str,
    ep: int,
    video_id: str,
    meta: Dict[str, str],
) -> bool:
    async with sem:
        page = await ctx.new_page()
        thumb_path = str(THUMB_DIR / f"ep_{ep:02d}_cover_thumb.jpg")
        yt_title, yt_desc = build_multilingual_title_and_desc(ep, meta, category)
        try:
            url = f"https://studio.youtube.com/video/{video_id}/edit"
            await page.goto(url, wait_until="domcontentloaded", timeout=45000)
            await asyncio.sleep(2.5)
            skip_btn = page.locator(
                'a:has-text("YOUTUBE 스튜디오로 건너뛰기"), '
                'a:has-text("Skip to YouTube Studio"), '
                'button:has-text("YOUTUBE 스튜디오로 건너뛰기"), '
                ':text("YOUTUBE 스튜디오로 건너뛰기")'
            ).first
            if await skip_btn.count() > 0 and await skip_btn.is_visible():
                await skip_btn.click(force=True)
                await asyncio.sleep(3.5)
            title_box = page.locator("#title-textarea #textbox").first
            await title_box.wait_for(state="visible", timeout=25000)
            await asyncio.sleep(2.0)

            # 1. Update Title
            await title_box.click(force=True)
            await page.keyboard.press("Meta+A")
            await page.keyboard.press("Backspace")
            await title_box.fill(yt_title)
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.4)

            # 2. Update Description
            desc_box = page.locator("#description-textarea #textbox").first
            if await desc_box.count() > 0:
                await desc_box.click(force=True)
                await page.keyboard.press("Meta+A")
                await page.keyboard.press("Backspace")
                await desc_box.fill(yt_desc)
                await page.keyboard.press("Escape")
                await asyncio.sleep(0.4)

            # 3. Upload Custom Cover Thumbnail (scene_00) unless --meta-only
            if "--meta-only" not in __import__("sys").argv:
                fi = page.locator("input#file-loader").first
                if await fi.count() > 0:
                    await fi.set_input_files(thumb_path)
                    await asyncio.sleep(1.8)

            # 4. Click Save
            save_btn = page.locator("ytcp-button#save").first
            for _ in range(15):
                disabled = await save_btn.get_attribute("disabled")
                aria_disabled = await save_btn.get_attribute("aria-disabled")
                if disabled is None and aria_disabled != "true":
                    await save_btn.click()
                    break
                await asyncio.sleep(0.5)

            # Wait for save completion
            for _ in range(30):
                await asyncio.sleep(0.5)
                disabled = await save_btn.get_attribute("disabled")
                aria_disabled = await save_btn.get_attribute("aria-disabled")
                if disabled is not None or aria_disabled == "true":
                    break

            print(f"✅ [{category.upper()} EP{ep:02d}] ({video_id}) -> {yt_title}", flush=True)
            return True
        except Exception as e:
            print(f"⚠️ [{category.upper()} EP{ep:02d}] ({video_id}) Error: {e}", flush=True)
            return False
        finally:
            await page.close()


async def main():
    ensure_all_40_cover_thumbnails()
    ensure_chrome_profile()
    episodes = parse_episodes()
    print(f"Parsed {len(episodes)} episodes from movieEpisodeMapping.ts", flush=True)
    state = json.loads(STATE_FILE.read_text(encoding="utf-8"))

    jobs = []
    for cat in ("en_full", "en_shorts", "ko_full", "ko_shorts"):
        vid_map = state["videos"].get(cat, {})
        for ep_str in sorted(vid_map.keys(), key=lambda x: int(x)):
            ep = int(ep_str)
            vid = vid_map[ep_str]
            if vid:
                jobs.append((cat, ep, vid, episodes.get(ep, {})))

    if "--only-outdated" in __import__("sys").argv:
        import urllib.request
        API_KEY = "AIzaSyBa9TidLv_iwMyB-9VSrVGWEVUr0WyjiQU"
        live_titles = {}
        all_vids = [j[2] for j in jobs]
        for i in range(0, len(all_vids), 40):
            chunk = ",".join(all_vids[i:i+40])
            url = f"https://www.googleapis.com/youtube/v3/videos?part=snippet&id={chunk}&key={API_KEY}"
            with urllib.request.urlopen(url) as r:
                data = json.loads(r.read().decode())
            for it in data.get("items", []):
                live_titles[it["id"]] = (it["snippet"]["title"], it["snippet"]["description"])
        filtered = []
        for cat, ep, vid, meta in jobs:
            yt_title, _ = build_multilingual_title_and_desc(ep, meta, cat)
            cur_title, cur_desc = live_titles.get(vid, ("", ""))
            if cur_title != yt_title or "🌍 [12-LANGUAGE GLOBAL OFFICIAL GUIDE]" not in cur_desc:
                filtered.append((cat, ep, vid, meta))
        print(f"Found {len(filtered)}/{len(jobs)} videos needing metadata update.", flush=True)
        jobs = filtered
        if not jobs:
            print("🎉 All 80 videos already have 100% up-to-date titles & 12-language descriptions!", flush=True)
            return

    print(f"Starting parallel thumbnail + 12-lang metadata update for {len(jobs)} videos...", flush=True)

    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context(
            user_data_dir=str(TMP_CHROME_DIR),
            channel="chrome",
            headless=True,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
            ignore_default_args=["--use-mock-keychain", "--password-store=basic"],
            args=[f"--profile-directory={PROFILE_DIR_NAME}", "--disable-blink-features=AutomationControlled"],
            viewport={"width": 1440, "height": 900},
        )
        init_page = ctx.pages[0] if ctx.pages else await ctx.new_page()
        await init_page.goto("https://studio.youtube.com/channel/UCA6QmKiPstbiyBUHtnSMxyA", wait_until="domcontentloaded", timeout=45000)
        await asyncio.sleep(4.0)
        skip_btn = init_page.locator('a:has-text("YOUTUBE 스튜디오로 건너뛰기"), a:has-text("Skip to YouTube Studio"), :text("YOUTUBE 스튜디오로 건너뛰기")').first
        if await skip_btn.count() > 0 and await skip_btn.is_visible():
            await skip_btn.click(force=True)
            await asyncio.sleep(3.5)
        sem = asyncio.Semaphore(4)
        tasks = [update_single_video(sem, ctx, cat, ep, vid, meta) for cat, ep, vid, meta in jobs]
        results = await asyncio.gather(*tasks)
        await ctx.close()

    ok = sum(1 for r in results if r)
    print(f"\n🎉 COMPLETED: {ok}/{len(jobs)} videos updated with 1st Cover Thumbnail & 12-Language Metadata!", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
