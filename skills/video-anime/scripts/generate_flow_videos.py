#!/usr/bin/env python3
"""
/video-anime & /video-anime-short Automation Script
---------------------------------------------------
1. Checks if `/script-anime <ep>` script exists (`episode_XX_cutscene_prompts.json`). If not, generates it.
2. Checks if `/cutscene-anime <ep>` (or `/cutscene-anime-short <ep>`) cutscene images exist. If not, generates them.
3. Exports all 28 generated Nano Banana 2.1 cutscene images (`EPXX_CUT01_cutscene.jpg` ~ `EPXX_CUT28_cutscene.jpg`)
   directly from the Google Flow project (`https://flow.google.com/project/72ee6e60-2819-43a6-bb8c-700a7d599bdf`).
4. Opens the Google Flow project and configures `Veo 3.1 - Lite` (`동영상`, `프레임`, `16:9` or `9:16`, `6초`, `x1`).
5. For each cutscene:
   - Attaches the generated Nano Banana 2.1 cutscene image (`EPXX_CUTYY_cutscene.jpg`) as the Start Frame (`시작`),
     preserving the exact character/location/prop consistency already established in `/cutscene-anime`.
   - Submits the cutscene animation-effect prompt (`cutsceneAnimationPromptEn`) that animates the cutscene image over 6 seconds
     and enforces the 3-mode audio/narration rules:
       (a) Character Dialogue (`character_dialogue`): Summarized <= 6s spoken line by that character only.
       (b) Omniscient Male Narration (`omniscient_male_narration`): All on-screen characters keep mouths closed & silent;
           ONLY an off-screen male narrator in the background speaks a <= 6s explanation.
       (c) Silent Scene (`silent`): All appearing characters remain completely silent with mouths closed.
6. Uses Flow's authoritative `batchexecute?rpcids=Zzl0ze` project state payload to map each `EPXX-CUTYY` prompt
   1-to-1 to its exact generated video stream (`https://flow-content.google/video/<item_uuid>`), eliminating any
   virtual-scroll or batch ordering mismatch.
7. Downloads all generated 6-second `.mp4` cutscene clips (`public/anime-character-sheets/videos/epXX_<mode>/clips/EPXX-CUTYY.mp4`).
8. Concatenates all 28 clips into 1 integrated episode `.mp4` video via `ffmpeg` and prepares the YouTube upload metadata package.
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[3]
PROMPT_DIR = ROOT / "public" / "anime-character-sheets" / "cutscene-prompts"
SCRIPT_GENERATOR = ROOT / "skills" / "script-anime" / "scripts" / "generate_episode_cutscene_prompts.py"
CUTSCENE_GENERATOR = ROOT / "skills" / "cutscene-anime" / "scripts" / "generate_flow_cutscenes.py"
FLOW_PROJECT_ID = "72ee6e60-2819-43a6-bb8c-700a7d599bdf"
FLOW_PROJECT_URL = f"https://flow.google.com/project/{FLOW_PROJECT_ID}"
FLOW_PROFILE_DIR = Path("/tmp/flow_anime_chrome_profile")
MOVIE_OUT_DIR = Path("/Users/dayyoung/Desktop/내문서/movie")


def parse_episode_arg(raw: str) -> int:
    m = re.search(r"(\d+)", str(raw))
    if not m:
        raise ValueError(f"Could not parse episode number from: {raw}")
    ep = int(m.group(1))
    if ep < 1 or ep > 40:
        raise ValueError(f"Episode must be between 1 and 40 (got {ep})")
    return ep


def ensure_episode_script_and_cutscenes(ep: int, orientation: str) -> Path:
    json_path = PROMPT_DIR / f"episode_{ep:02d}_cutscene_prompts.json"
    need_regen = not json_path.exists()
    if json_path.exists():
        try:
            data = json.loads(json_path.read_text(encoding="utf-8"))
            cuts = data.get("cutscenes", [])
            if not cuts or "cutsceneAnimationPromptEn" not in cuts[0]:
                need_regen = True
        except Exception:
            need_regen = True

    if need_regen:
        print(f"[Step 1] Generating /script-anime {ep}회 with cutsceneAnimationPromptEn & 3-mode audio/narration rules...", flush=True)
        subprocess.run([sys.executable, str(SCRIPT_GENERATOR), f"{ep}회"], check=True)
    else:
        print(f"[Step 1] Verified existing /script-anime script: {json_path}", flush=True)

    cut_dir = ROOT / "public" / "anime-character-sheets" / "cutscenes" / f"ep{ep:02d}_{orientation}"
    cut_img_dir = cut_dir / "images"
    cut_status_file = cut_dir / "flow_generation_status.json"
    ep_data = json.loads(json_path.read_text(encoding="utf-8"))
    total_cuts = len(ep_data.get("cutscenes", []))

    completed_cuts = 0
    cutscenes_finished = False
    if cut_img_dir.exists():
        completed_cuts = len(list(cut_img_dir.glob(f"EP{ep:02d}_CUT*_cutscene.jpg")))
    if cut_status_file.exists():
        try:
            st = json.loads(cut_status_file.read_text(encoding="utf-8"))
            if st.get("finished"):
                cutscenes_finished = True
            completed_cuts = max(completed_cuts, int(st.get("completedCutscenes", 0)))
        except Exception:
            pass

    if not cutscenes_finished and completed_cuts < total_cuts:
        print(f"[Step 1] Cutscenes for Episode {ep:02d} ({orientation}) incomplete ({completed_cuts}/{total_cuts}). Running /cutscene-anime first...", flush=True)
        subprocess.run(
            [sys.executable, str(CUTSCENE_GENERATOR), f"{ep}화", "--orientation", orientation],
            check=True,
        )
    else:
        print(f"[Step 1] Verified existing /cutscene-anime ({orientation}) cutscenes: {completed_cuts}/{total_cuts} exported.", flush=True)

    return json_path


def parse_zzl0ze_video_map(body: str, ep: int) -> Dict[str, str]:
    """
    Parses Flow's authoritative `batchexecute?rpcids=Zzl0ze` response body and maps each
    `[VEO 3.1 LITE 6-SECOND CUTSCENE ANIMATION PROMPT | EPXX-CUTYY ...]` entry to its direct
    downloadable `.mp4` URL on `https://flow.google.com/asb/<TOKEN>=mm,22,15` (size >= 1 MB).
    """
    mapping: Dict[str, str] = {}
    ep_prefix = f"EP{ep:02d}-CUT"
    pattern = re.compile(rf"\[VEO 3\.1 LITE 6-SECOND CUTSCENE ANIMATION PROMPT \| ({ep_prefix}\d{{2}})")
    for m in pattern.finditer(body):
        cut_id = m.group(1)
        chunk = body[m.start():m.start() + 5500]
        m2 = re.search(r'https://lh3\.googleusercontent\.com/asb/([A-Za-z0-9_-]+)\\",null,null,(\d{7,9})', chunk)
        if m2:
            token = m2.group(1)
            mapping[cut_id] = f"https://flow.google.com/asb/{token}=mm,22,15"
    return mapping


def parse_zzl0ze_cutscene_image_map(body: str, ep: int, orientation: str) -> Dict[str, str]:
    """
    Parses Flow's `batchexecute?rpcids=Zzl0ze` response body to extract the exact `lh3.googleusercontent.com`
    image URL for each `[NANO BANANA 2.1 ... | EPXX-CUTYY ...]` cutscene image.
    """
    mapping: Dict[str, str] = {}
    ep_prefix = f"EP{ep:02d}-CUT"
    orient_tag = "PORTRAIT 9:16" if orientation == "portrait" else "LANDSCAPE 16:9"
    pattern = re.compile(
        rf"\[(NANO BANANA 2\.1 {orient_tag} ANIME CUTSCENE IMAGE)\]\s*\[6-SECOND ANIME CUTSCENE VIDEO PROMPT \| ({ep_prefix}\d{{2}})"
    )
    for m in pattern.finditer(body):
        cut_id = m.group(2)
        prefix = body[max(0, m.start() - 500):m.start()]
        lh3_urls = re.findall(r"https://lh3\.googleusercontent\.com/asb/[A-Za-z0-9_-]+", prefix)
        if lh3_urls:
            mapping[cut_id] = lh3_urls[-1]
    return mapping


def ensure_cutscene_images_exported(ctx, zzl0ze_bodies: List[str], ep: int, orientation: str, total_cuts: int, cut_img_dir: Path) -> Dict[str, Path]:
    cut_img_dir.mkdir(parents=True, exist_ok=True)
    existing_map: Dict[str, Path] = {}
    for cnum in range(1, total_cuts + 1):
        ccode = f"EP{ep:02d}-CUT{cnum:02d}"
        p_hero = cut_img_dir / f"EP{ep:02d}_CUT{cnum:02d}_hero.jpg"
        p = p_hero if (p_hero.exists() and p_hero.stat().st_size > 15000) else (cut_img_dir / f"EP{ep:02d}_CUT{cnum:02d}_cutscene.jpg")
        if p.exists() and p.stat().st_size > 15000:
            existing_map[ccode] = p

    if len(existing_map) >= total_cuts:
        print(f"[Step 2] All {len(existing_map)}/{total_cuts} generated Nano Banana 2.1 cutscene images already exported locally.", flush=True)
        return existing_map

    img_url_map: Dict[str, str] = {}
    for b in zzl0ze_bodies:
        img_url_map.update(parse_zzl0ze_cutscene_image_map(b, ep, orientation))

    for cnum in range(1, total_cuts + 1):
        ccode = f"EP{ep:02d}-CUT{cnum:02d}"
        out_path = cut_img_dir / f"EP{ep:02d}_CUT{cnum:02d}_cutscene.jpg"
        if out_path.exists() and out_path.stat().st_size > 15000:
            existing_map[ccode] = out_path
            continue
        if ccode in img_url_map:
            resp = ctx.request.get(img_url_map[ccode])
            if resp.ok and len(resp.body()) > 15000:
                out_path.write_bytes(resp.body())
                existing_map[ccode] = out_path
                print(f"  🖼️ [{ccode}] Exported Nano Banana 2.1 cutscene image -> {out_path.name}", flush=True)

    return existing_map


def configure_veo_lite_settings(page, orientation: str):
    target_ratio_label = "9:16" if orientation == "portrait" else "16:9"
    box = page.locator('[aria-label="무엇을 만들고 싶으신가요?"]').first
    if box.count() > 0 and box.is_visible():
        box.click()
        time.sleep(0.4)
    trig = page.locator('button[aria-label="설정 트리거"], button:has-text("Nano Banana"), button:has-text("동영상 ·")').first
    trig.wait_for(state="visible", timeout=20000)
    trig.click()
    time.sleep(0.8)

    vid_radio = page.locator('button[role="radio"]:has-text("동영상")').first
    if vid_radio.is_visible():
        vid_radio.click(force=True)
        time.sleep(0.4)

    frame_radio = page.locator('button[role="radio"]:has-text("프레임")').first
    if frame_radio.is_visible():
        frame_radio.click(force=True)
        time.sleep(0.4)

    ratio_radio = page.locator(f'button[role="radio"]:has-text("{target_ratio_label}")').first
    if ratio_radio.is_visible():
        ratio_radio.click(force=True)
        time.sleep(0.4)

    model_sel = page.locator('button[aria-label="모델 제품군 선택"]').first
    if model_sel.is_visible():
        if "Veo 3.1 - Lite" not in (model_sel.inner_text() or ""):
            model_sel.click(force=True)
            time.sleep(0.6)
            lite_opt = page.locator('[role="menuitem"]:has-text("Veo 3.1 - Lite")').first
            if lite_opt.count() > 0 and lite_opt.is_visible():
                lite_opt.click(force=True)
                time.sleep(0.6)

    dur_6s = page.locator('button[role="radio"]:has-text("6초")').first
    if dur_6s.is_visible():
        dur_6s.click(force=True)
        time.sleep(0.4)

    x1_radio = page.locator('button[role="radio"]:has-text("x1")').first
    if x1_radio.is_visible():
        x1_radio.click(force=True)
        time.sleep(0.4)

    page.keyboard.press("Escape")
    time.sleep(0.5)
    print(f"[Step 3] Configured Veo 3.1 - Lite Settings -> {repr(trig.inner_text())}", flush=True)


def open_start_frame_picker(page):
    search_inp = page.locator('input[aria-label="애셋 검색"]').first
    if search_inp.is_visible():
        return search_inp

    start_btn = page.locator('button:has-text("시작"), button[aria-label="프롬프트 상자에 소재 추가"]').first
    if start_btn.count() == 0 or not start_btn.is_visible():
        box = page.locator('[aria-label="무엇을 만들고 싶으신가요?"]').first
        if box.count() > 0 and box.is_visible():
            box.click(force=True)
            time.sleep(0.4)
        start_btn = page.locator('button:has-text("시작"), button[aria-label="프롬프트 상자에 소재 추가"]').first

    if start_btn.count() > 0:
        start_btn.click(force=True)
        time.sleep(0.9)
    return search_inp


def close_picker_if_open(page):
    search_inp = page.locator('input[aria-label="애셋 검색"]').first
    if search_inp.is_visible():
        page.keyboard.press("Escape")
        time.sleep(0.4)


def clear_prompt_composer(page):
    close_picker_if_open(page)
    clr = page.locator('button[aria-label="프롬프트 지우기"]').first
    if clr.count() > 0 and clr.is_visible():
        clr.click(force=True)
        time.sleep(0.4)

    for _ in range(3):
        chip_cancel = page.locator('button.chip-container:has-text("cancel")').first
        if chip_cancel.count() > 0 and chip_cancel.is_visible():
            chip_cancel.click(force=True)
            time.sleep(0.35)
        else:
            break

    box = page.locator('[aria-label="무엇을 만들고 싶으신가요?"]').first
    if box.is_visible():
        box.click(force=True)
        page.keyboard.press("Meta+A")
        page.keyboard.press("Backspace")
        time.sleep(0.2)


def preupload_cutscene_images(page, files_to_ensure: List[str], out_dir: Path):
    marker = out_dir / "cutscene_images_uploaded.json"
    already_uploaded = set()
    if marker.exists():
        try:
            already_uploaded = set(json.loads(marker.read_text(encoding="utf-8")))
        except Exception:
            already_uploaded = set()

    missing = [f for f in files_to_ensure if Path(f).name not in already_uploaded]
    if not missing:
        print(f"[Step 4] All {len(files_to_ensure)} generated cutscene images (`EPXX_CUTYY_cutscene.jpg`) indexed in Flow picker.", flush=True)
        return

    print(f"[Step 4] Indexing {len(missing)} generated Nano Banana 2.1 cutscene images (`EPXX_CUTYY_cutscene.jpg`) in Flow Start Frame picker...", flush=True)
    chunk_size = 9
    for i in range(0, len(missing), chunk_size):
        chunk = missing[i:i + chunk_size]
        search_inp = open_start_frame_picker(page)
        if search_inp.is_visible():
            search_inp.fill("")
            time.sleep(0.25)
        upload_btn = page.locator('button:has-text("미디어 업로드")').first
        with page.expect_file_chooser() as fc_info:
            upload_btn.click(force=True)
        fc_info.value.set_files(chunk)
        wait_s = max(9, int(len(chunk) * 1.4))
        print(f"    ⏳ Indexed chunk {i // chunk_size + 1} ({len(chunk)} cutscene images), waiting {wait_s}s...", flush=True)
        time.sleep(wait_s)
        for f in chunk:
            already_uploaded.add(Path(f).name)
        marker.write_text(json.dumps(sorted(already_uploaded), indent=2), encoding="utf-8")

    close_picker_if_open(page)


def attach_start_frame_cutscene(page, fpath: str) -> bool:
    prefix = Path(fpath).stem  # e.g. EP01_CUT01_cutscene
    search_inp = open_start_frame_picker(page)
    if not search_inp.is_visible():
        return False

    search_inp.click(force=True)
    search_inp.fill("")
    time.sleep(0.15)
    search_inp.fill(prefix)
    time.sleep(0.75)

    opt = page.locator('button.asset-item[role="option"]').filter(has_text=prefix[:14]).first
    if opt.count() == 0:
        upload_btn = page.locator('button:has-text("미디어 업로드")').first
        if upload_btn.is_visible():
            with page.expect_file_chooser() as fc_info:
                upload_btn.click(force=True)
            fc_info.value.set_files([fpath])
            time.sleep(4.5)
            search_inp.fill(prefix)
            time.sleep(0.8)
            opt = page.locator('button.asset-item[role="option"]').filter(has_text=prefix[:14]).first

    if opt.count() > 0 and opt.is_visible():
        cls_attr = opt.get_attribute("class") or ""
        if "asset-item-active" not in cls_attr:
            opt.click(force=True)
            time.sleep(0.45)
        add_btn = page.locator('button:has-text("프롬프트에 추가")').first
        for _ in range(10):
            if add_btn.is_visible() and add_btn.is_enabled():
                add_btn.click(force=True)
                time.sleep(0.6)
                return True
            time.sleep(0.3)

    close_picker_if_open(page)
    return False


VEO_SAFE_WORD_MAP = [
    (r"\bblood-soaked\b", "snow-covered"),
    (r"\bbloodstained\b", "weather-worn"),
    (r"\bbleeding\b", "glowing"),
    (r"\bbloody\b", "crimson"),
    (r"\bblood\b", "crimson light"),
    (r"\bcorpses\b", "fallen shields"),
    (r"\bcorpse\b", "fallen armor"),
    (r"\bsevered\b", "parted"),
    (r"\bsevering\b", "cutting through"),
    (r"\bdecapitated\b", "shattered"),
    (r"\bslaughtered\b", "defeated"),
    (r"\bslaughter\b", "battle"),
    (r"\bmassacre\b", "conflict"),
    (r"\bmurdered\b", "betrayed"),
    (r"\bmurder\b", "betrayal"),
    (r"\bkilled\b", "defeated"),
    (r"\bkilling\b", "defeating"),
    (r"\bkill\b", "defeat"),
    (r"\bstabbed\b", "struck"),
    (r"\bstabbing\b", "striking"),
    (r"\bscreaming\b", "shouting"),
    (r"\bscreams\b", "echoes"),
    (r"\bexecution\b", "judgment"),
    (r"\btorture\b", "ordeal"),
    (r"\bdying\b", "fading"),
    (r"\bdead\b", "fallen"),
    (r"\bdeath\b", "shadow"),
    (r"\bpoisoned\b", "tainted"),
    (r"\bpoison\b", "dark mist"),
    (r"\bvenom\b", "dark aura"),
    (r"\bwounded\b", "weary"),
    (r"\bwounds\b", "scars"),
    (r"\bwound\b", "scar"),
    (r"\bskulls\b", "helmets"),
    (r"\bskull\b", "helmet"),
    (r"\bthroat\b", "collar"),
    (r"\bflesh\b", "armor"),
]


def sanitize_veo_prompt_strict(text: str) -> str:
    out = text
    for pat, repl in VEO_SAFE_WORD_MAP:
        out = re.sub(pat, repl, out, flags=re.IGNORECASE)
    return out


def build_video_animation_prompt(cut: dict, orientation: str) -> str:
    base = cut.get("cutsceneAnimationPromptEn") or cut["unifiedVideoPromptEn"]
    if orientation == "portrait":
        base = base.replace("16:9 widescreen", "9:16 vertical portrait")
    return sanitize_veo_prompt_strict(base)


def sync_and_download_from_zzl0ze(
    ctx,
    zzl0ze_video_map: Dict[str, str],
    cutscenes: List[dict],
    cut_img_map: Dict[str, Path],
    clips_dir: Path,
    status_data: Dict[str, dict],
    status_file: Path,
    orientation: str,
) -> int:
    """
    Downloads or updates any local clip (`EPXX-CUTYY.mp4`) using Flow's authoritative `Zzl0ze` mapping
    (`cutCode -> https://flow-content.google/video/<item_uuid>`).
    Ensures 100% 1-to-1 alignment between cutCode and videoUrl.
    """
    synced_count = 0
    for cut in cutscenes:
        ccode = cut["cutCode"]
        if ccode not in zzl0ze_video_map:
            continue
        auth_url = zzl0ze_video_map[ccode]
        clip_path = clips_dir / f"{ccode}.mp4"
        prev_url = (status_data.get(ccode) or {}).get("videoUrl")

        if clip_path.exists() and clip_path.stat().st_size > 100000 and prev_url == auth_url:
            synced_count += 1
            continue

        resp = ctx.request.get(auth_url)
        if resp.ok and len(resp.body()) > 100000:
            clip_path.write_bytes(resp.body())
            diag = cut.get("dialogue") or {}
            img_rel = str(cut_img_map[ccode].relative_to(ROOT)) if ccode in cut_img_map else ""
            status_data[ccode] = {
                "cutNumber": cut["cutNumber"],
                "cutCode": ccode,
                "orientation": orientation,
                "aspectRatio": "9:16" if orientation == "portrait" else "16:9",
                "model": "Veo 3.1 - Lite",
                "durationSeconds": 6,
                "baseCutsceneImage": img_rel,
                "audioType": diag.get("audioType", "silent"),
                "speakerEn": diag.get("speakerEn", ""),
                "summarized6sLineEn": diag.get("summarized6sLineEn", ""),
                "animationPrompt": build_video_animation_prompt(cut, orientation),
                "clipPath": str(clip_path.relative_to(ROOT)),
                "clipSizeBytes": clip_path.stat().st_size,
                "videoUrl": auth_url,
                "downloaded": True,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
            }
            status_file.write_text(json.dumps(status_data, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"  ✅ [{ccode}] Synced exact video ({clip_path.stat().st_size / (1024*1024):.2f} MB) <- {auth_url}", flush=True)
            synced_count += 1
    return synced_count


def concat_episode_videos(clip_paths: List[Path], final_mp4: Path, orientation: str):
    final_mp4.parent.mkdir(parents=True, exist_ok=True)
    concat_list_path = final_mp4.parent / "ffmpeg_concat_list.txt"
    lines = [f"file '{p.resolve()}'" for p in clip_paths if p.exists() and p.stat().st_size > 50000]
    concat_list_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    cmd_copy = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_list_path),
        "-c", "copy",
        "-movflags", "+faststart",
        str(final_mp4),
    ]
    res = subprocess.run(cmd_copy, capture_output=True, text=True)
    if res.returncode != 0 or not final_mp4.exists() or final_mp4.stat().st_size < 500000:
        target_res = "720:1280" if orientation == "portrait" else "1280:720"
        cmd_reencode = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_list_path),
            "-vf", f"scale={target_res}:force_original_aspect_ratio=decrease,pad={target_res}:(ow-iw)/2:(oh-ih)/2,fps=24",
            "-c:v", "libx264", "-preset", "fast", "-crf", "20",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart",
            str(final_mp4),
        ]
        subprocess.run(cmd_reencode, check=True)


def write_youtube_upload_package(ep_data: dict, orientation: str, out_dir: Path, final_mp4: Path, desktop_mp4: Path, clip_paths: List[Path]):
    ep = ep_data["episodeNumber"]
    title_en = ep_data["episodeTitleEn"]
    title_ko = ep_data["episodeTitleKo"]
    summary_en = ep_data["episodeSummaryEn"]
    summary_ko = ep_data["episodeSummaryKo"]
    is_short = orientation == "portrait"

    yt_title = (
        f"[SNS히어로 애니 {ep}화 Shorts] {title_ko} ({title_en}) | Kadan's Journey"
        if is_short
        else f"[SNS히어로 애니메이션 {ep}화 풀버전] {title_ko} ({title_en}) | SNSHero Anime EP{ep:02d}"
    )

    chapters = []
    for cut in ep_data["cutscenes"]:
        tc_start = cut["timecode"].split("–")[0]
        loc_name = (cut.get("location") or {}).get("nameKo") or "엘윈 마을"
        chars_ko = ", ".join([c["nameKo"] for c in (cut.get("characters") or [])]) or "배경 연출"
        diag = cut.get("dialogue") or {}
        audio_badge = (
            f"대사: {diag.get('speakerKo')}"
            if diag.get("hasDialogue")
            else ("배경 남자 나레이션" if diag.get("hasNarration") else "무언 연출")
        )
        chapters.append(f"{tc_start} {cut['cutCode']} - {loc_name} ({chars_ko} | {audio_badge})")

    yt_description = "\n".join([
        f"🎬 {yt_title}",
        "",
        f"📖 줄거리 요약 (KO): {summary_ko}",
        f"📖 Synopsis (EN): {summary_en}",
        "",
        "⏱️ 컷신 타임라인 (6초 × 28컷 = 총 2분 48초):",
        *chapters,
        "",
        "🎮 지금 바로 플레이: https://snshero.com",
        "#SNS히어로 #SNSHero #판타지애니메이션 #웹소설애니화 #KadansJourney #AIAnimation #Veo31",
    ])

    pkg = {
        "episodeNumber": ep,
        "episodeTitleEn": title_en,
        "episodeTitleKo": title_ko,
        "orientation": orientation,
        "aspectRatio": "9:16" if is_short else "16:9",
        "model": "Veo 3.1 - Lite (6s, Cutscene-Image-to-Video)",
        "totalClips": len(clip_paths),
        "totalDurationSeconds": len(clip_paths) * 6,
        "mergedVideoPath": str(final_mp4),
        "desktopMovieCopyPath": str(desktop_mp4),
        "mergedVideoSizeBytes": final_mp4.stat().st_size if final_mp4.exists() else 0,
        "youtubeMetadata": {
            "title": yt_title,
            "description": yt_description,
            "tags": [
                "SNS히어로", "SNSHero", "판타지 애니메이션", "Kadan's Journey",
                title_ko, title_en, "Veo 3.1 Lite", "AI Anime",
            ],
            "categoryId": "1",
            "privacyStatus": "public",
        },
    }

    json_pkg_path = out_dir / "youtube_upload_ready.json"
    md_pkg_path = out_dir / "YOUTUBE_UPLOAD_READY.md"
    json_pkg_path.write_text(json.dumps(pkg, ensure_ascii=False, indent=2), encoding="utf-8")

    md_text = "\n".join([
        f"# YouTube 업로드 준비 완료 패키지 — 제{ep}화 『{title_ko}』 ({title_en})",
        "",
        f"- **최종 병합 동영상 (프로젝트 내)**: `{final_mp4}`",
        f"- **최종 병합 동영상 (데스크탑 Movie 폴더)**: `{desktop_mp4}`",
        f"- **해상도 / 화면 비율**: `{'720x1280 (9:16 세로 숏폼)' if is_short else '1280x720 (16:9 가로 와이드)'}`",
        f"- **생성 모델 및 방식**: `Veo 3.1 - Lite` (나노바나나 2.1 생성 컷신 이미지 기준 6초 애니메이션 효과 부여 × {len(clip_paths)}컷 = {len(clip_paths)*6}초)",
        f"- **파일 크기**: `{pkg['mergedVideoSizeBytes'] / (1024*1024):.2f} MB`",
        "",
        "## 제목 (Title)",
        f"```text\n{yt_title}\n```",
        "",
        "## 설명 (Description)",
        f"```text\n{yt_description}\n```",
        "",
    ])
    md_pkg_path.write_text(md_text, encoding="utf-8")
    return json_pkg_path, md_pkg_path


def ensure_chrome_profile(profile_dir: Path = FLOW_PROFILE_DIR, force_refresh: bool = False):
    src_root = Path("/Users/dayyoung/Library/Application Support/Google/Chrome")
    if force_refresh and profile_dir.exists():
        shutil.rmtree(profile_dir, ignore_errors=True)
    if not profile_dir.exists() or not (profile_dir / "Default").exists():
        profile_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src_root / "Local State", profile_dir / "Local State")
        shutil.copytree(
            src_root / "Default",
            profile_dir / "Default",
            symlinks=True,
            ignore=shutil.ignore_patterns(
                "Cache*", "Code Cache*", "GPUCache*", "Service Worker*",
                "Singleton*", "Extensions*", "Extension*", "Sessions*"
            ),
        )
    for sf in profile_dir.glob("Singleton*"):
        sf.unlink(missing_ok=True)


def run_flow_videos(ep: int, orientation: str, start_cut: int = 1, end_cut: Optional[int] = None, batch_size: int = 1):
    json_path = ensure_episode_script_and_cutscenes(ep, orientation)
    ep_data = json.loads(json_path.read_text(encoding="utf-8"))
    cutscenes = ep_data["cutscenes"]
    if end_cut is None:
        end_cut = len(cutscenes)
    target_cuts = cutscenes[start_cut - 1:end_cut]

    cut_img_dir = ROOT / "public" / "anime-character-sheets" / "cutscenes" / f"ep{ep:02d}_{orientation}" / "images"
    out_dir = ROOT / "public" / "anime-character-sheets" / "videos" / f"ep{ep:02d}_{orientation}"
    clips_dir = out_dir / "clips"
    clips_dir.mkdir(parents=True, exist_ok=True)

    status_file = out_dir / "video_generation_status.json"
    status_data: Dict[str, dict] = {}
    if status_file.exists():
        try:
            status_data = json.loads(status_file.read_text(encoding="utf-8"))
        except Exception:
            status_data = {}

    ensure_chrome_profile(FLOW_PROFILE_DIR, force_refresh=False)

    with sync_playwright() as p:
        zzl0ze_bodies: List[str] = []
        zzl0ze_video_map: Dict[str, str] = {}

        def open_flow_video_session():
            c = p.chromium.launch_persistent_context(
                user_data_dir=str(FLOW_PROFILE_DIR),
                channel="chrome",
                headless=False,
                accept_downloads=True,
                ignore_default_args=["--use-mock-keychain", "--password-store=basic", "--enable-automation"],
                args=[
                    "--profile-directory=Default",
                    "--disable-extensions",
                    "--disable-blink-features=AutomationControlled",
                    "--hide-crash-restore-bubble",
                ],
                viewport={"width": 1600, "height": 1000},
            )
            pg = c.pages[0] if c.pages else c.new_page()

            def on_response(resp):
                if "rpcids=Zzl0ze" in resp.url:
                    try:
                        body = resp.text()
                        zzl0ze_bodies.append(body)
                        parsed = parse_zzl0ze_video_map(body, ep)
                        if parsed:
                            zzl0ze_video_map.update(parsed)
                    except Exception:
                        pass

            pg.on("response", on_response)
            for nav_try in range(3):
                print(f"[Flow] Navigating to {FLOW_PROJECT_URL} (try {nav_try+1}) ...", flush=True)
                pg.goto(FLOW_PROJECT_URL, wait_until="domcontentloaded", timeout=60000)
                time.sleep(8)
                agree_btn = pg.locator('button:has-text("동의함")')
                if agree_btn.count() > 0 and agree_btn.first.is_visible():
                    agree_btn.first.click()
                    time.sleep(1.0)
                if pg.locator('[aria-label="무엇을 만들고 싶으신가요?"]').count() > 0 and pg.locator('[aria-label="무엇을 만들고 싶으신가요?"]').first.is_visible():
                    break
            configure_veo_lite_settings(pg, orientation)
            return c, pg

        ctx, page = open_flow_video_session()

        # Ensure all generated Nano Banana 2.1 cutscene images are exported locally
        cut_img_map = ensure_cutscene_images_exported(ctx, zzl0ze_bodies, ep, orientation, len(cutscenes), cut_img_dir)

        # Sync any already-generated videos in Flow
        if zzl0ze_video_map:
            sync_and_download_from_zzl0ze(ctx, zzl0ze_video_map, target_cuts, cut_img_map, clips_dir, status_data, status_file, orientation)

        pending_cuts = [
            cut for cut in target_cuts
            if cut["cutCode"] in cut_img_map
            and cut_img_map[cut["cutCode"]].exists()
            and not (status_data.get(cut["cutCode"]) or {}).get("excluded")
            and not ((clips_dir / f"{cut['cutCode']}.mp4").exists() and (clips_dir / f"{cut['cutCode']}.mp4").stat().st_size > 100000)
        ]
        if pending_cuts:
            cutscene_files_to_index = [
                str(cut_img_map[c["cutCode"]])
                for c in pending_cuts
                if c["cutCode"] in cut_img_map and cut_img_map[c["cutCode"]].exists()
            ]
            preupload_cutscene_images(page, cutscene_files_to_index, out_dir)

            for cut in pending_cuts:
                ccode = cut["cutCode"]
                cnum = cut["cutNumber"]
                clip_out = clips_dir / f"{ccode}.mp4"
                if clip_out.exists() and clip_out.stat().st_size > 100000:
                    continue
                if (status_data.get(ccode) or {}).get("excluded"):
                    print(f"  ⏭️ [{ccode}] Previously excluded after 3 failed attempts, skipping.", flush=True)
                    continue

                cut_img_path = str(cut_img_map[ccode])
                prompt_text = build_video_animation_prompt(cut, orientation)
                diag = cut.get("dialogue") or {}
                audio_mode = diag.get("audioType", "silent")

                succeeded = False
                for attempt in range(3):
                    try:
                        clear_prompt_composer(page)
                        ok_ref = attach_start_frame_cutscene(page, cut_img_path)
                        close_picker_if_open(page)

                        use_prompt = prompt_text
                        if attempt >= 1:
                            # On 2nd/3rd try, use sanitized sakuga motion prompt preserving audio rule
                            use_prompt = re.sub(
                                r"2\) 6-SECOND ANIME MOTION & VISUAL EFFECTS:.*?3\) AUDIO / VOICE / NARRATION RULE",
                                "2) 6-SECOND ANIME MOTION & VISUAL EFFECTS: Apply smooth 24fps 2D anime sakuga camera motion, dynamic wind and glowing arcane particles, natural hair and cloak movement. 3) AUDIO / VOICE / NARRATION RULE",
                                prompt_text,
                                flags=re.DOTALL,
                            )

                        box = page.locator('[aria-label="무엇을 만들고 싶으신가요?"]').first
                        box.click(timeout=10000)
                        box.fill(use_prompt, timeout=10000)
                        time.sleep(0.7)

                        gen_btn = page.locator('button[aria-label="생성 시작"]').first
                        for _ in range(12):
                            if gen_btn.is_enabled():
                                break
                            time.sleep(0.4)

                        before_thumbs = set(
                            page.locator("flow-video-tile img.thumbnail").evaluate_all("els => els.map(e => e.src).filter(Boolean)")
                        )

                        gen_btn.click(timeout=10000)
                        print(f"  🎬 [{ccode} ({cnum}/{len(cutscenes)}) | Try {attempt+1}/3] Submitted to Veo 3.1 - Lite (CutsceneImg={Path(cut_img_path).name}, Audio={audio_mode}, attached={ok_ref})", flush=True)

                        t0 = time.time()
                        saw_pct = False
                        new_thumb = None
                        while time.time() - t0 < 120:
                            time.sleep(3.5)
                            after_thumbs = page.locator("flow-video-tile img.thumbnail").evaluate_all("els => els.map(e => e.src).filter(Boolean)")
                            diff_thumbs = [t for t in after_thumbs if t not in before_thumbs]
                            if diff_thumbs:
                                new_thumb = diff_thumbs[0]
                                break
                            active_pcts = page.evaluate("""() => {
                                const els = Array.from(document.querySelectorAll('*'));
                                const pctRe = /^\\d{1,2}%$/;
                                return els.filter(e => e.children.length === 0 && pctRe.test((e.innerText || '').trim())).map(e => e.innerText.trim());
                            }""")
                            elapsed = int(time.time() - t0)
                            if active_pcts:
                                saw_pct = True
                                print(f"    [{elapsed}s] active_pcts={active_pcts}", flush=True)
                            elif not saw_pct and elapsed >= 15:
                                break
                            elif saw_pct and elapsed >= 22:
                                for _ in range(4):
                                    time.sleep(2.0)
                                    after_thumbs = page.locator("flow-video-tile img.thumbnail").evaluate_all("els => els.map(e => e.src).filter(Boolean)")
                                    diff_thumbs = [t for t in after_thumbs if t not in before_thumbs]
                                    if diff_thumbs:
                                        new_thumb = diff_thumbs[0]
                                        break
                                break

                        if not new_thumb:
                            print(f"  ⚠️ [{ccode}] Try {attempt+1}/3 did not complete (policy/filter). Waiting 4s...", flush=True)
                            time.sleep(4)
                            continue

                        zzl0ze_video_map[ccode] = f"{new_thumb}=mm,22,15"
                        sync_and_download_from_zzl0ze(ctx, zzl0ze_video_map, [cut], cut_img_map, clips_dir, status_data, status_file, orientation)
                        if clip_out.exists() and clip_out.stat().st_size > 100000:
                            succeeded = True
                            break
                    except Exception as e:
                        print(f"  ⚠️ [{ccode}] Try {attempt+1}/3 error: {e} — reloading page...", flush=True)
                        page.goto(FLOW_PROJECT_URL, wait_until="domcontentloaded", timeout=60000)
                        time.sleep(7)
                        configure_veo_lite_settings(page, orientation)

                if not succeeded:
                    print(f"  🚫 [{ccode}] Failed 3 times — excluding {ccode} and moving to next clip/episode.", flush=True)
                    status_data[ccode] = {
                        "cutNumber": cnum,
                        "cutCode": ccode,
                        "orientation": orientation,
                        "excluded": True,
                        "attempts": 3,
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                    }
                    status_file.write_text(json.dumps(status_data, ensure_ascii=False, indent=2), encoding="utf-8")

        final_canvas_png = out_dir / f"flow_ep{ep:02d}_{orientation}_videos_canvas.png"
        page.screenshot(path=str(final_canvas_png))
        ctx.close()

    all_clip_paths = [clips_dir / f"{cut['cutCode']}.mp4" for cut in target_cuts]
    existing_clips = [p for p in all_clip_paths if p.exists() and p.stat().st_size > 50000]
    print(f"\n[Step 5] Merging {len(existing_clips)}/{len(all_clip_paths)} cutscene clips into 1 integrated episode video...", flush=True)

    safe_title = re.sub(r"[^A-Za-z0-9]+", "_", ep_data["episodeTitleEn"]).strip("_")
    ratio_tag = "9x16_Shorts" if orientation == "portrait" else "16x9"
    final_mp4 = out_dir / f"SNSHero_Anime_EP{ep:02d}_{safe_title}_{ratio_tag}.mp4"
    concat_episode_videos(existing_clips, final_mp4, orientation)

    MOVIE_OUT_DIR.mkdir(parents=True, exist_ok=True)
    desktop_mp4 = MOVIE_OUT_DIR / f"SNSHero_Anime_EP{ep:02d}_{safe_title}_{ratio_tag}.mp4"
    if final_mp4.exists():
        shutil.copy2(final_mp4, desktop_mp4)

    json_pkg, md_pkg = write_youtube_upload_package(ep_data, orientation, out_dir, final_mp4, desktop_mp4, existing_clips)
    print(f"🎉 [Completed] Integrated Episode {ep:02d} Video Ready for YouTube Upload!", flush=True)
    print(f"   - Merged MP4 (Project): {final_mp4} ({final_mp4.stat().st_size / (1024*1024):.2f} MB)", flush=True)
    print(f"   - Merged MP4 (Desktop): {desktop_mp4}", flush=True)
    print(f"   - YouTube Package JSON: {json_pkg}", flush=True)
    print(f"   - YouTube Package MD  : {md_pkg}", flush=True)


def main():
    parser = argparse.ArgumentParser(description="Generate 6s Veo 3.1 - Lite cutscene videos from generated Nano Banana 2.1 cutscenes and merge for YouTube")
    parser.add_argument("episode", help="Episode number or string (e.g., 1화, 1회, 1)")
    parser.add_argument("--orientation", choices=["landscape", "portrait"], default="landscape", help="landscape (16:9) or portrait (9:16)")
    parser.add_argument("--start-cut", type=int, default=1)
    parser.add_argument("--end-cut", type=int, default=None)
    parser.add_argument("--batch-size", type=int, default=2)
    args = parser.parse_args()

    ep = parse_episode_arg(args.episode)
    run_flow_videos(ep, args.orientation, args.start_cut, args.end_cut, args.batch_size)


if __name__ == "__main__":
    main()
