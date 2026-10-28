#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
/cutscene-anime & /cutscene-anime-short Generator Script
1. Checks if `/script-anime` cutscene prompts JSON (`public/anime-character-sheets/cutscene-prompts/episode_XX_cutscene_prompts.json`)
   exists for the target episode. If not, automatically invokes `generate_episode_cutscene_prompts.py` to create it.
2. Connects to Google Flow project:
   https://flow.google.com/project/72ee6e60-2819-43a6-bb8c-700a7d599bdf
3. Uploads and attaches for every cutscene:
   - Background Location Sheet (`public/anime-character-sheets/locations/art/LOC_XXX_*.jpg`)
   - 7-Head-Tall Character Cutout Sheets (`public/anime-character-sheets/cutouts/XXX_Name.png`)
   - Prop Concept Sheets (`public/anime-character-sheets/props/art/PROP_XXX_*.jpg`)
4. Generates all cutscenes in the episode using **🍌 Nano Banana 2.1**:
   - `/cutscene-anime [회차]`       -> `--orientation landscape` (`16:9` 가로 이미지)
   - `/cutscene-anime-short [회차]` -> `--orientation portrait`  (`9:16` 세로 이미지)
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path
from typing import Dict, List, Optional
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[3]
PROMPTS_DIR = ROOT / "public" / "anime-character-sheets" / "cutscene-prompts"
SCRIPT_ANIME_PY = ROOT / "skills" / "script-anime" / "scripts" / "generate_episode_cutscene_prompts.py"
FLOW_PROJECT_URL = "https://flow.google.com/project/72ee6e60-2819-43a6-bb8c-700a7d599bdf"
FLOW_PROFILE_DIR = Path("/tmp/flow_anime_chrome_profile")


def parse_episode_arg(raw_arg: str) -> int:
    m = re.search(r"(\d+)", str(raw_arg))
    if not m:
        raise ValueError(f"Invalid episode argument: {raw_arg}")
    ep = int(m.group(1))
    if ep < 1 or ep > 40:
        raise ValueError(f"Episode number must be between 1 and 40 (got {ep})")
    return ep


def ensure_episode_script(ep: int) -> Path:
    json_path = PROMPTS_DIR / f"episode_{ep:02d}_cutscene_prompts.json"
    md_path = PROMPTS_DIR / f"episode_{ep:02d}_cutscene_prompts.md"
    if json_path.exists() and md_path.exists():
        print(f"[Step 1] Found existing /script-anime script for Episode {ep:02d}: {json_path}")
        return json_path

    print(f"[Step 1] /script-anime script not found for Episode {ep:02d}. Generating now...")
    subprocess.run([sys.executable, str(SCRIPT_ANIME_PY), f"{ep}회"], check=True)
    if not json_path.exists():
        raise RuntimeError(f"Failed to generate {json_path}")
    return json_path


def ensure_chrome_profile(profile_dir: Path = FLOW_PROFILE_DIR):
    src_root = Path("/Users/dayyoung/Library/Application Support/Google/Chrome")
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


def collect_cutscene_ref_files(cut: dict) -> List[str]:
    """
    Collects local absolute file paths for a cutscene in priority order:
    1) Background Location Sheet (`locations/art/LOC_XXX_*.jpg`)
    2) Appearing 7-Head-Tall Character Cutouts (`cutouts/XXX_Name.png`)
    3) Appearing Prop Sheets (`props/art/PROP_XXX_*.jpg`)
    """
    files: List[str] = []
    seen = set()

    def add_rel(rel_url: Optional[str]):
        if not rel_url:
            return
        p = ROOT / "public" / rel_url.lstrip("/")
        if p.exists() and str(p) not in seen:
            seen.add(str(p))
            files.append(str(p))

    loc = cut.get("location") or {}
    add_rel(loc.get("artUrl"))

    for c in cut.get("attachedCutouts") or []:
        add_rel(c.get("cutoutUrl"))

    for pr in cut.get("props") or []:
        art_url = pr.get("artUrl") or ""
        if "/props/art/" in art_url:
            add_rel(art_url)

    return files


def build_image_cutscene_prompt(cut: dict, orientation: str) -> str:
    base = cut["unifiedVideoPromptEn"]
    if orientation == "portrait":
        base = base.replace("16:9 widescreen", "9:16 vertical portrait")
        return f"[NANO BANANA 2.1 VERTICAL 9:16 ANIME CUTSCENE IMAGE] {base}"
    return f"[NANO BANANA 2.1 LANDSCAPE 16:9 ANIME CUTSCENE IMAGE] {base}"


def configure_flow_settings(page, orientation: str):
    target_crop = "crop_9_16" if orientation == "portrait" else "crop_16_9"
    target_ratio_label = "9:16" if orientation == "portrait" else "16:9"

    trig = page.locator('button[aria-label="설정 트리거"]').first
    trig.wait_for(state="visible", timeout=15000)
    trig_txt = trig.inner_text()
    print(f"[Step 2] Current Flow Settings Trigger: {repr(trig_txt)}")

    trig.click()
    time.sleep(1.0)

    # 1. Select Image mode ('이미지')
    img_radio = page.locator('button[role="radio"]:has-text("이미지")').first
    if img_radio.is_visible():
        img_radio.click()
        time.sleep(0.4)

    # 2. Select Aspect Ratio ('16:9' or '9:16')
    ratio_radio = page.locator(f'button[role="radio"]:has-text("{target_ratio_label}")').first
    if ratio_radio.is_visible():
        ratio_radio.click()
        time.sleep(0.4)

    # 3. Ensure Model is Nano Banana 2.1
    model_sel = page.locator('button[aria-label="모델 제품군 선택"]').first
    if model_sel.is_visible():
        m_txt = model_sel.inner_text()
        if "Nano Banana 2.1" not in m_txt and "Nano Banana 2" not in m_txt:
            model_sel.click()
            time.sleep(0.6)
            nb_opt = page.locator('[role="menuitem"]:has-text("Nano Banana 2"), [role="option"]:has-text("Nano Banana 2")').first
            if nb_opt.count() > 0 and nb_opt.is_visible():
                nb_opt.click()
                time.sleep(0.4)

    # 4. Select x1 per cutscene so all 28 cutscenes generate cleanly
    x1_radio = page.locator('button[role="radio"]:has-text("x1")').first
    if x1_radio.is_visible():
        x1_radio.click()
        time.sleep(0.4)

    page.keyboard.press("Escape")
    time.sleep(0.6)
    print(f"[Step 2] Configured Flow Settings Trigger -> {repr(trig.inner_text())}")


def open_asset_picker(page):
    search_inp = page.locator('input[aria-label="애셋 검색"]').first
    if search_inp.is_visible():
        return search_inp

    add_btn = page.locator('button[aria-label="프롬프트 상자에 소재 추가"]').first
    if add_btn.count() > 0:
        add_btn.click(force=True)
        time.sleep(1.0)
        if search_inp.is_visible():
            return search_inp

    return search_inp


def close_asset_picker(page):
    search_inp = page.locator('input[aria-label="애셋 검색"]').first
    if search_inp.is_visible():
        close_btn = page.locator('button[aria-label="프롬프트 상자에 소재 추가"]').first
        if close_btn.count() > 0:
            close_btn.click(force=True)
        time.sleep(0.6)


def clear_prompt_box(page):
    close_asset_picker(page)
    # Remove any attached chips if present (click top-right 'close' button inside prompt composer, excluding '프롬프트 상자에 소재 추가')
    for _ in range(8):
        removed = page.evaluate("""() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const chipClose = btns.find(b => {
                const r = b.getBoundingClientRect();
                const txt = (b.innerText || '').trim();
                const aria = b.getAttribute('aria-label') || '';
                if (aria === '프롬프트 상자에 소재 추가') return false;
                return (txt === 'close' || aria.includes('삭제') || aria.includes('제거')) && r.y > 480 && r.y < 720 && r.x > 400;
            });
            if (chipClose) {
                chipClose.click();
                return true;
            }
            return false;
        }""")
        if not removed:
            break
        time.sleep(0.35)

    box = page.locator('[aria-label="무엇을 만들고 싶으신가요?"]').first
    if box.is_visible():
        box.click()
        page.keyboard.press("Meta+A")
        page.keyboard.press("Backspace")
        time.sleep(0.25)


def preupload_episode_reference_sheets(page, all_ref_files: List[str]):
    """
    Ensures all unique Location Sheets, 7-Head-Tall Cutouts, and Prop Sheets for the episode
    are uploaded to the Flow project asset library before cutscene generation begins.
    """
    print(f"[Step 3] Checking {len(all_ref_files)} unique reference sheets (Locations, 7-head-tall Cutouts, Props) in Flow project...")
    search_inp = open_asset_picker(page)
    missing_files = []

    for fpath in all_ref_files:
        fname = Path(fpath).name
        prefix = fname[:14]
        search_inp.click()
        search_inp.fill(prefix)
        time.sleep(0.65)
        count = page.locator('button.asset-item[role="option"]').filter(has_text=prefix[:10]).count()
        if count == 0:
            missing_files.append(fpath)
        else:
            print(f"  ✓ Already in Flow library: {fname}")

    if missing_files:
        print(f"  ↑ Uploading {len(missing_files)} missing reference sheets to Flow project...")
        search_inp.fill("")
        time.sleep(0.4)
        upload_btn = page.locator('button:has-text("미디어 업로드")').first
        with page.expect_file_chooser() as fc_info:
            upload_btn.click()
        fc_info.value.set_files(missing_files)
        # Wait for uploads to complete processing
        wait_secs = max(8, len(missing_files) * 2)
        print(f"  ⏳ Waiting {wait_secs}s for {len(missing_files)} reference sheets to finish uploading...")
        time.sleep(wait_secs)

    close_asset_picker(page)


def attach_reference_sheet(page, fpath: str) -> bool:
    fname = Path(fpath).name
    prefix = fname[:14]
    search_inp = open_asset_picker(page)
    if not search_inp.is_visible():
        return False

    search_inp.click()
    search_inp.fill("")
    time.sleep(0.2)
    search_inp.fill(prefix)
    time.sleep(0.75)

    opt = page.locator('button.asset-item[role="option"]').filter(has_text=prefix[:10]).first
    if opt.count() == 0:
        # Upload on the fly if still missing
        upload_btn = page.locator('button:has-text("미디어 업로드")').first
        if upload_btn.is_visible():
            with page.expect_file_chooser() as fc_info:
                upload_btn.click()
            fc_info.value.set_files([fpath])
            time.sleep(4.0)
            search_inp.fill(prefix)
            time.sleep(0.8)
            opt = page.locator('button.asset-item[role="option"]').filter(has_text=prefix[:10]).first

    if opt.count() > 0 and opt.is_visible():
        cls_attr = opt.get_attribute("class") or ""
        if "asset-item-active" not in cls_attr:
            opt.click()
            time.sleep(0.55)
        add_to_prompt = page.locator('button:has-text("프롬프트에 추가")').first
        for _ in range(10):
            if add_to_prompt.is_visible() and add_to_prompt.is_enabled():
                add_to_prompt.click()
                time.sleep(0.65)
                return True
            time.sleep(0.35)

    close_asset_picker(page)
    return False


def wait_for_active_generations(page, max_concurrent: int = 2, timeout_sec: int = 90):
    """
    Waits if there are too many active percentage indicators (e.g. '27%', '65%') on the canvas
    so that Flow's Nano Banana 2.1 queue never throttles or drops a cutscene.
    """
    t0 = time.time()
    while time.time() - t0 < timeout_sec:
        active_pcts = page.evaluate("""() => {
            const els = Array.from(document.querySelectorAll('*'));
            const pctRe = /^\\d{1,2}%$/;
            return els.filter(e => e.children.length === 0 && pctRe.test((e.innerText || '').trim())).map(e => e.innerText.trim());
        }""")
        if len(active_pcts) <= max_concurrent:
            return active_pcts
        time.sleep(2.5)
    return []


def run_flow_cutscenes(ep: int, orientation: str, start_cut: int = 1, end_cut: Optional[int] = None):
    json_path = ensure_episode_script(ep)
    ep_data = json.loads(json_path.read_text(encoding="utf-8"))
    cutscenes = ep_data["cutscenes"]
    if end_cut is None:
        end_cut = len(cutscenes)

    out_dir = ROOT / "public" / "anime-character-sheets" / "cutscenes" / f"ep{ep:02d}_{orientation}"
    out_dir.mkdir(parents=True, exist_ok=True)
    status_file = out_dir / "cutscene_generation_status.json"
    status_data = {}
    if status_file.exists():
        try:
            status_data = json.loads(status_file.read_text(encoding="utf-8"))
        except Exception:
            status_data = {}

    # If EP01-CUT01 was already submitted during our verification test in landscape mode, record it if requested
    all_ref_files = []
    seen_refs = set()
    for cut in cutscenes[start_cut - 1:end_cut]:
        for rf in collect_cutscene_ref_files(cut):
            if rf not in seen_refs:
                seen_refs.add(rf)
                all_ref_files.append(rf)

    ensure_chrome_profile(FLOW_PROFILE_DIR)

    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=str(FLOW_PROFILE_DIR),
            channel="chrome",
            headless=False,
            ignore_default_args=["--use-mock-keychain", "--password-store=basic", "--enable-automation"],
            args=[
                "--profile-directory=Default",
                "--disable-extensions",
                "--disable-blink-features=AutomationControlled",
                "--hide-crash-restore-bubble",
                "--window-size=1280,800",
            ],
            viewport={"width": 1280, "height": 800},
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        zzl0ze_bodies: List[str] = []

        def on_response(resp):
            if "rpcids=Zzl0ze" in resp.url:
                try:
                    zzl0ze_bodies.append(resp.text())
                except Exception:
                    pass

        page.on("response", on_response)
        print(f"[Flow] Navigating to {FLOW_PROJECT_URL} ...")
        page.goto(FLOW_PROJECT_URL, wait_until="domcontentloaded", timeout=60000)
        time.sleep(7)

        agree_btn = page.locator('button:has-text("동의함")')
        if agree_btn.count() > 0 and agree_btn.first.is_visible():
            agree_btn.first.click()
            time.sleep(0.5)

        configure_flow_settings(page, orientation)
        refs_marker = out_dir / "refs_uploaded.json"
        if not refs_marker.exists():
            preupload_episode_reference_sheets(page, all_ref_files)
            refs_marker.write_text(json.dumps(all_ref_files, indent=2), encoding="utf-8")
        else:
            print(f"[Step 3] All {len(all_ref_files)} reference sheets already verified in Flow project library.")

        for cut in cutscenes[start_cut - 1:end_cut]:
            cnum = cut["cutNumber"]
            ccode = cut["cutCode"]
            if status_data.get(ccode, {}).get("submitted"):
                print(f"[{ccode}] Already submitted in this orientation ({orientation}), skipping.")
                continue

            for attempt in range(3):
                try:
                    wait_for_active_generations(page, max_concurrent=2, timeout_sec=90)
                    clear_prompt_box(page)

                    ref_files = collect_cutscene_ref_files(cut)
                    attached_names = []
                    # Attach up to 5 reference sheets (1 Location + up to 3 7-head-tall Character Cutouts + 1 Prop Sheet)
                    for rf in ref_files[:5]:
                        ok = attach_reference_sheet(page, rf)
                        if ok:
                            attached_names.append(Path(rf).name)

                    close_asset_picker(page)
                    prompt_text = build_image_cutscene_prompt(cut, orientation)
                    box = page.locator('[aria-label="무엇을 만들고 싶으신가요?"]').first
                    box.click(force=True, timeout=10000)
                    box.fill(prompt_text, timeout=10000)
                    time.sleep(0.6)

                    gen_btn = page.locator('button[aria-label="생성 시작"]').first
                    for _ in range(10):
                        if gen_btn.is_enabled():
                            break
                        time.sleep(0.4)

                    gen_btn.click(force=True, timeout=10000)
                    print(f"🎬 [{ccode} ({cnum}/{len(cutscenes)})] Submitted to Flow Nano Banana 2.1 ({orientation}) | Attached: {attached_names}", flush=True)
                    time.sleep(3.5)

                    status_data[ccode] = {
                        "cutNumber": cnum,
                        "cutCode": ccode,
                        "orientation": orientation,
                        "aspectRatio": "9:16" if orientation == "portrait" else "16:9",
                        "model": "🍌 Nano Banana 2.1",
                        "attachedReferenceFiles": attached_names,
                        "prompt": prompt_text,
                        "submitted": True,
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                    }
                    status_file.write_text(json.dumps(status_data, ensure_ascii=False, indent=2), encoding="utf-8")
                    break
                except Exception as e:
                    print(f"⚠️ [{ccode}] Attempt {attempt+1} error: {e} — reloading Flow project page...", flush=True)
                    page.goto(FLOW_PROJECT_URL, wait_until="domcontentloaded", timeout=60000)
                    time.sleep(6)
                    configure_flow_settings(page, orientation)

        print(f"⏳ Waiting for final cutscenes on Flow canvas to finish rendering...")
        wait_for_active_generations(page, max_concurrent=0, timeout_sec=120)
        time.sleep(5)

        # Reload project page once to capture latest Zzl0ze state and export cutscene images locally
        page.goto(FLOW_PROJECT_URL, wait_until="domcontentloaded", timeout=60000)
        time.sleep(7)
        images_dir = out_dir / "images"
        images_dir.mkdir(parents=True, exist_ok=True)
        ep_prefix = f"EP{ep:02d}-CUT"
        orient_tag = "PORTRAIT 9:16" if orientation == "portrait" else "LANDSCAPE 16:9"
        img_pat = re.compile(rf"\[(NANO BANANA 2\.1 {orient_tag} ANIME CUTSCENE IMAGE)\]\s*\[6-SECOND ANIME CUTSCENE VIDEO PROMPT \| ({ep_prefix}\d{{2}})")
        img_url_map = {}
        for body in zzl0ze_bodies:
            for m in img_pat.finditer(body):
                cid = m.group(2)
                pref = body[max(0, m.start() - 500):m.start()]
                urls = re.findall(r"https://lh3\.googleusercontent\.com/asb/[A-Za-z0-9_-]+", pref)
                if urls:
                    img_url_map[cid] = urls[-1]

        exported_count = 0
        for cut in cutscenes:
            cid = cut["cutCode"]
            cnum = cut["cutNumber"]
            img_out = images_dir / f"EP{ep:02d}_CUT{cnum:02d}_cutscene.jpg"
            if img_out.exists() and img_out.stat().st_size > 15000:
                exported_count += 1
                continue
            if cid in img_url_map:
                r = ctx.request.get(img_url_map[cid])
                if r.ok and len(r.body()) > 15000:
                    img_out.write_bytes(r.body())
                    exported_count += 1
                    print(f"  🖼️ [{cid}] Exported Nano Banana 2.1 cutscene image -> {img_out.name}", flush=True)

        flow_status_file = out_dir / "flow_generation_status.json"
        flow_status_file.write_text(json.dumps({
            "episode": ep,
            "orientation": orientation,
            "totalCutscenes": len(cutscenes),
            "completedCutscenes": max(exported_count, sum(1 for v in status_data.values() if isinstance(v, dict) and v.get("submitted"))),
            "exportedImages": exported_count,
            "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        }, ensure_ascii=False, indent=2), encoding="utf-8")

        final_screenshot = out_dir / f"flow_ep{ep:02d}_{orientation}_canvas.png"
        page.screenshot(path=str(final_screenshot))
        print(f"✅ All {end_cut - start_cut + 1} cutscenes for Episode {ep:02d} ({orientation}) generated & {exported_count} exported!")
        print(f"   Canvas screenshot saved to: {final_screenshot}")
        ctx.close()


def main():
    parser = argparse.ArgumentParser(description="Generate anime cutscenes in Google Flow with Nano Banana 2.1")
    parser.add_argument("episode", help="Episode number or string (e.g., 1화, 1회, 1)")
    parser.add_argument("--orientation", choices=["landscape", "portrait"], default="landscape", help="landscape (16:9) or portrait (9:16)")
    parser.add_argument("--start-cut", type=int, default=1)
    parser.add_argument("--end-cut", type=int, default=None)
    args = parser.parse_args()

    ep = parse_episode_arg(args.episode)
    run_flow_cutscenes(ep, args.orientation, args.start_cut, args.end_cut)


if __name__ == "__main__":
    main()
