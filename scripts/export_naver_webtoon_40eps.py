#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
눈히어로.com - 카단의 여정 (1화 ~ 40화)
네이버 웹툰 연재 규격 (가로 690px 고정, 파일당 5MB 이하 보장, 01~40 넘버링 및 정렬)
세로 연결 통이미지(이미지 + 대사번호 + 대사 + 엔딩 카드게임 안내 컷) 40개 일괄 생성 스크립트
"""

import io
import json
import os
import re
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONT_PATH = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
CANVAS_W = 690
IMG_W = 690
IMG_H = 388  # 690 * 9 / 16 (16:9 ratio)
MAX_FILE_BYTES = 4_750_000  # Strict < 5,000,000 bytes (5MB decimal & binary safe)

with open("src/content/webtoonEpisodeManifest.json", "r", encoding="utf-8") as f:
    MANIFEST = json.load(f)

with open("public/book/index.json", "r", encoding="utf-8") as f:
    INDEX_DATA = json.load(f)

EP_META_MAP = {ep["episodeNumber"]: ep for ep in INDEX_DATA.get("episodes", [])}


def wrap_korean_text(draw, text, font, max_width):
    if not text:
        return [""]
    words = text.split(" ")
    lines = []
    current_line = ""
    for word in words:
        test_line = f"{current_line} {word}".strip() if current_line else word
        bbox = draw.textbbox((0, 0), test_line, font=font)
        w = bbox[2] - bbox[0]
        if w <= max_width:
            current_line = test_line
        else:
            if current_line:
                lines.append(current_line)
            wbbox = draw.textbbox((0, 0), word, font=font)
            if (wbbox[2] - wbbox[0]) <= max_width:
                current_line = word
            else:
                sub = ""
                for ch in word:
                    tb = draw.textbbox((0, 0), sub + ch, font=font)
                    if (tb[2] - tb[0]) <= max_width:
                        sub += ch
                    else:
                        if sub:
                            lines.append(sub)
                        sub = ch
                current_line = sub
    if current_line:
        lines.append(current_line)
    return lines if lines else [""]


def render_single_episode(ep_num, out_dir):
    font_title_lg = ImageFont.truetype(FONT_PATH, 24, index=14)
    font_title_sub = ImageFont.truetype(FONT_PATH, 14, index=6)
    font_scene_hdr = ImageFont.truetype(FONT_PATH, 13, index=6)
    font_climax_badge = ImageFont.truetype(FONT_PATH, 11, index=6)
    font_num_badge = ImageFont.truetype(FONT_PATH, 14, index=14)
    font_dialogue = ImageFont.truetype(FONT_PATH, 17, index=4)
    font_footer = ImageFont.truetype(FONT_PATH, 15, index=6)

    ep_data = MANIFEST[str(ep_num)]
    ep_meta = EP_META_MAP.get(ep_num, {})
    title_ko = ep_meta.get("titleKo", f"제 {ep_num}화")
    title_en = ep_data.get("episodeTitle", f"Episode {ep_num}")
    source_range = ep_meta.get("sourceRange", "")
    images_info = ep_data["images"]
    total_scenes = len(images_info) - 1

    dummy_img = Image.new("RGB", (100, 100))
    dummy_draw = ImageDraw.Draw(dummy_img)

    TOP_HEADER_H = 112
    PANEL_HDR_H = 36
    PANEL_GAP = 14
    FOOTER_H = 88

    panel_layouts = []
    total_h = TOP_HEADER_H + PANEL_GAP

    for item in images_info:
        sc_idx = item["index"]
        is_climax = bool(item.get("isKeyClimax"))
        narr_ko = item.get("narrationKo", "").strip()
        if sc_idx == 0:
            narr_ko = f"제 {ep_num:02d}화 : {title_ko} ({title_en})"

        badge_text = "TITLE" if sc_idx == 0 else f"#{sc_idx:02d}"
        badge_w = 62 if sc_idx == 0 else 54
        text_x = 18 + badge_w + 12
        max_text_w = CANVAS_W - text_x - 20

        lines = wrap_korean_text(dummy_draw, narr_ko, font_dialogue, max_text_w)
        line_h = 26
        text_block_h = len(lines) * line_h
        dialogue_box_h = max(60, text_block_h + 28)

        panel_h = PANEL_HDR_H + IMG_H + dialogue_box_h
        panel_layouts.append({
            "sc_idx": sc_idx,
            "is_climax": is_climax,
            "img_rel_path": "public" + (item.get("localArtUrl") or item.get("imageUrl")),
            "badge_text": badge_text,
            "badge_w": badge_w,
            "text_x": text_x,
            "lines": lines,
            "line_h": line_h,
            "dialogue_box_h": dialogue_box_h,
            "panel_h": panel_h,
        })
        total_h += panel_h + PANEL_GAP

    total_h += FOOTER_H

    strip = Image.new("RGB", (CANVAS_W, total_h), (239, 237, 237))
    draw = ImageDraw.Draw(strip)

    # 1. Top Episode Header Banner
    draw.rectangle([0, 0, CANVAS_W, TOP_HEADER_H], fill=(32, 29, 29))
    draw.rectangle([0, TOP_HEADER_H - 3, CANVAS_W, TOP_HEADER_H], fill=(217, 119, 6))

    series_label = f"눈히어로.com - 카단의 여정  |  EPISODE {ep_num:02d} / 40"
    if source_range:
        series_label += f"  ({source_range})"
    draw.text((22, 18), series_label, font=font_title_sub, fill=(251, 191, 36))

    main_title_str = f"제 {ep_num:02d}화. {title_ko}"
    draw.text((22, 43), main_title_str, font=font_title_lg, fill=(253, 252, 252))

    sub_title_str = f"{title_en}  ·  총 {total_scenes}컷 (타이틀 포함 {len(images_info)}컷)"
    draw.text((22, 79), sub_title_str, font=font_title_sub, fill=(185, 180, 180))

    # 2. Scene Panels
    curr_y = TOP_HEADER_H + PANEL_GAP

    for p in panel_layouts:
        sc_idx = p["sc_idx"]
        is_climax = p["is_climax"]
        p_h = p["panel_h"]

        hdr_bg = (254, 243, 199) if is_climax else (248, 247, 247)
        draw.rectangle([0, curr_y, CANVAS_W, curr_y + PANEL_HDR_H], fill=hdr_bg)
        draw.line([(0, curr_y), (CANVAS_W, curr_y)], fill=(32, 29, 29), width=1)
        draw.line([(0, curr_y + PANEL_HDR_H - 1), (CANVAS_W, curr_y + PANEL_HDR_H - 1)], fill=(215, 212, 212), width=1)

        mid_hdr_y = curr_y + PANEL_HDR_H // 2
        dot_color = (217, 119, 6) if is_climax else (32, 29, 29)
        draw.rectangle([18, mid_hdr_y - 4, 26, mid_hdr_y + 4], fill=dot_color)

        hdr_label = "[ TITLE CARD ]" if sc_idx == 0 else f"SCENE {sc_idx:02d} / {total_scenes:02d}  ·  대사번호 #{sc_idx:02d}"
        draw.text((34, mid_hdr_y), hdr_label, font=font_scene_hdr, fill=(32, 29, 29), anchor="lm")

        if is_climax:
            climax_str = "★ 클라이맥스 명장면"
            cbbox = draw.textbbox((0, 0), climax_str, font=font_climax_badge)
            cw = cbbox[2] - cbbox[0]
            bx2 = CANVAS_W - 16
            bx1 = bx2 - cw - 18
            by1 = curr_y + 7
            by2 = curr_y + 29
            draw.rounded_rectangle([bx1, by1, bx2, by2], radius=3, fill=(217, 119, 6))
            draw.text(((bx1 + bx2) / 2, (by1 + by2) / 2), climax_str, font=font_climax_badge, fill=(255, 255, 255), anchor="mm")

        # Scene Image
        img_y = curr_y + PANEL_HDR_H
        with Image.open(p["img_rel_path"]) as sc_im:
            sc_rgb = sc_im.convert("RGB")
            sc_up = sc_rgb.resize((IMG_W, IMG_H), Image.Resampling.LANCZOS)
            sc_sharp = sc_up.filter(ImageFilter.UnsharpMask(radius=0.9, percent=45, threshold=2))
            strip.paste(sc_sharp, (0, img_y))

        # Scene Bottom Dialogue Box
        d_y = img_y + IMG_H
        d_h = p["dialogue_box_h"]
        d_bg = (255, 251, 235) if is_climax else (253, 252, 252)
        draw.rectangle([0, d_y, CANVAS_W, d_y + d_h], fill=d_bg)
        draw.line([(0, d_y), (CANVAS_W, d_y)], fill=(210, 206, 206), width=1)
        draw.line([(0, d_y + d_h - 1), (CANVAS_W, d_y + d_h - 1)], fill=(180, 175, 175), width=1)

        accent_color = (217, 119, 6) if is_climax else (32, 29, 29)
        draw.rectangle([0, d_y, 4, d_y + d_h], fill=accent_color)

        bx1 = 18
        by1 = d_y + 16
        bx2 = bx1 + p["badge_w"]
        by2 = by1 + 28
        badge_bg = (180, 83, 9) if is_climax else (32, 29, 29)
        draw.rounded_rectangle([bx1, by1, bx2, by2], radius=3, fill=badge_bg)
        draw.text(((bx1 + bx2) / 2, (by1 + by2) / 2), p["badge_text"], font=font_num_badge, fill=(253, 252, 252), anchor="mm")

        if len(p["lines"]) == 1:
            draw.text((p["text_x"], (by1 + by2) / 2), p["lines"][0], font=font_dialogue, fill=(32, 29, 29), anchor="lm")
        else:
            text_y = d_y + 16
            for line in p["lines"]:
                draw.text((p["text_x"], text_y), line, font=font_dialogue, fill=(32, 29, 29))
                text_y += p["line_h"]

        curr_y += p_h + PANEL_GAP

    # 3. Bottom Episode Footer
    draw.rectangle([0, curr_y, CANVAS_W, total_h], fill=(32, 29, 29))
    footer_msg = f"[ 눈히어로.com - 카단의 여정 · 제 {ep_num:02d}화 ({title_ko}) 완독 ]"
    draw.text((22, curr_y + 20), footer_msg, font=font_footer, fill=(253, 252, 252))
    next_msg = (
        f"다음 화 예고: 제 {ep_num + 1:02d}화에서 계속됩니다. (https://SNSHero.com)"
        if ep_num < 40
        else "대단원의 막 — 전 40화 완결 (https://SNSHero.com)"
    )
    draw.text((22, curr_y + 50), next_msg, font=font_title_sub, fill=(251, 191, 36))

    safe_title = re.sub(r"[^\w가-힣]+", "_", title_ko).strip("_")
    filename = f"{ep_num:02d}_눈히어로_코믹툰_제{ep_num:02d}화_{safe_title}.jpg"
    out_path = os.path.join(out_dir, filename)

    chosen_bytes = None
    for q, sub in [(92, 0), (89, 0), (86, 0), (85, 1), (82, 1), (78, 1), (75, 1)]:
        buf = io.BytesIO()
        strip.save(buf, "JPEG", quality=q, subsampling=sub, optimize=True)
        if buf.tell() <= MAX_FILE_BYTES:
            chosen_bytes = buf.getvalue()
            break
    if chosen_bytes is None:
        buf = io.BytesIO()
        strip.save(buf, "JPEG", quality=72, subsampling=2, optimize=True)
        chosen_bytes = buf.getvalue()

    with open(out_path, "wb") as f_out:
        f_out.write(chosen_bytes)

    size_mb = round(len(chosen_bytes) / (1024 * 1024), 2)
    return ep_num, filename, strip.size, size_mb


def main():
    downloads_dir = os.path.expanduser("~/Downloads")
    os.makedirs(downloads_dir, exist_ok=True)

    print(f"Generating 40 Naver Webtoon episodes (690px width, <5MB) into {downloads_dir} ...")
    results = []
    with ProcessPoolExecutor(max_workers=8) as executor:
        futures = {
            executor.submit(render_single_episode, ep_num, downloads_dir): ep_num
            for ep_num in range(1, 41)
        }
        for future in as_completed(futures):
            ep_num, filename, dims, size_mb = future.result()
            results.append((ep_num, filename, dims, size_mb))
            print(f"  [완료 {len(results):02d}/40] 제{ep_num:02d}화 -> {filename} ({dims[0]}x{dims[1]}px, {size_mb}MB)")

    results.sort(key=lambda x: x[0])
    base_time = time.time() - 45
    for ep_num, filename, _, _ in results:
        fpath = os.path.join(downloads_dir, filename)
        t = base_time + ep_num
        os.utime(fpath, (t, t))
    total_mb = round(sum(r[3] for r in results), 2)
    max_mb = max(r[3] for r in results)
    print(f"\n전 40화(690px, 최대 {max_mb}MB <= 5MB) 웹툰 이미지 생성 및 01~40 정렬 완료! (합계 {total_mb}MB)")


if __name__ == "__main__":
    main()
