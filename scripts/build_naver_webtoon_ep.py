#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Naver Webtoon Vertical Scroll Strip Generator (가로 690px 정식 연재 규격, 2x 슈퍼샘플링 렌더링)
- 입력: public/images/webtoon/episode_XX/scene_YY.webp + src/content/webtoonEpisodeManifest.json
- 출력: '{ep}화 {title_ko}.png' (예: '1화 눈보라 아래 두 서약.png')
"""

import io
import json
import math
import os
import re
import shutil
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT_GOTHIC = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
FONT_SERIF_EN = "/System/Library/Fonts/Palatino.ttc"
FONT_SANS_EN = "/System/Library/Fonts/Avenir Next.ttc"

FINAL_W = 690
SCALE = 2  # 2x supersampling (1380px internal width -> 690px LANCZOS)
W = FINAL_W * SCALE  # 1380
IMG_H = int(round(FINAL_W * 9 / 16)) * SCALE  # 388 * 2 = 776

BG_COLOR = (8, 11, 18)  # Deep cinema scroll black (#080b12)


def load_font(path: str, size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        return ImageFont.load_default()


def wrap_korean_lines(text: str, font: ImageFont.FreeTypeFont, max_w: float) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    words = text.split(" ")
    lines: list[str] = []
    cur = ""
    for w in words:
        cand = f"{cur} {w}".strip() if cur else w
        if font.getlength(cand) <= max_w:
            cur = cand
        else:
            if cur:
                lines.append(cur)
            if font.getlength(w) <= max_w:
                cur = w
            else:
                sub = ""
                for ch in w:
                    if font.getlength(sub + ch) <= max_w:
                        sub += ch
                    else:
                        if sub:
                            lines.append(sub)
                        sub = ch
                cur = sub
    if cur:
        lines.append(cur)
    return lines


def parse_scene_segments(item: dict) -> list[dict]:
    """
    Splits a scene's dialogue/narration into ordered visual blocks:
      - {'kind': 'narration', 'text': '...'}
      - {'kind': 'speech' | 'shout', 'speaker': '...', 'text': '...'}
    Handles mixed strings like:
      '알렉산다르는 고개를 끄덕였다. “내 아들이 태어난다면...”'
      '“손대지 마라, 이 비겁한 악마야!” 그 짧은 비명을 도망치라는 신호로 오인한 발리안은...'
    """
    sc_idx = item.get("index", 0)
    sc_type = item.get("type", "scene")
    if sc_idx == 0 or sc_type in ("title_card", "ending_promo"):
        return []

    dlgs = item.get("dialogues") or []
    if not dlgs:
        raw_narr = (item.get("narrationKo") or "").strip()
        return [{"kind": "narration", "text": raw_narr}] if raw_narr else []

    segments: list[dict] = []
    quote_pattern = re.compile(r"(“[^”]+”|\"[^\"]+\")")

    for d in dlgs:
        speaker = (d.get("speakerKo") or "").strip()
        btype = (d.get("bubbleType") or "speech").strip()
        raw_text = (d.get("textKo") or "").strip()
        if not raw_text:
            continue

        is_narrator = speaker in ("", "내레이션", "Narration")
        if is_narrator:
            segments.append({"kind": "narration", "text": raw_text})
            continue

        # Check if raw_text mixes quoted speech and unquoted narration
        parts = quote_pattern.split(raw_text)
        has_quotes = any(quote_pattern.fullmatch(p.strip()) for p in parts if p.strip())

        if not has_quotes:
            clean_q = raw_text.strip("“”\"' ")
            kind = "shout" if btype == "shout" else "speech"
            segments.append({"kind": kind, "speaker": speaker, "text": clean_q})
        else:
            for p in parts:
                p_str = p.strip()
                if not p_str:
                    continue
                if quote_pattern.fullmatch(p_str):
                    clean_q = p_str.strip("“”\"' ").strip()
                    if clean_q:
                        kind = "shout" if btype == "shout" else "speech"
                        segments.append({"kind": kind, "speaker": speaker, "text": clean_q})
                else:
                    segments.append({"kind": "narration", "text": p_str})

    return segments


def draw_shout_burst_polygon(
    draw: ImageDraw.ImageDraw,
    cx: float,
    cy: float,
    rx: float,
    ry: float,
    fill: tuple,
    outline: tuple,
    width: int = 5,
):
    """Draws a dramatic comic/webtoon spiky shout bubble around (cx, cy)."""
    num_points = 44
    pts = []
    for i in range(num_points):
        angle = (2.0 * math.pi * i) / num_points
        # Alternating long/short spikes with slight organic rhythm
        if i % 2 == 0:
            r_scale = 1.11 if (i % 4 == 0) else 1.07
        else:
            r_scale = 0.94
        px = cx + rx * r_scale * math.cos(angle)
        py = cy + ry * r_scale * math.sin(angle)
        pts.append((px, py))
    draw.polygon(pts, fill=fill, outline=outline)
    # Crisp thick outline pass
    for i in range(num_points):
        p1 = pts[i]
        p2 = pts[(i + 1) % num_points]
        draw.line([p1, p2], fill=outline, width=width)


def build_episode_png(ep_num: int, out_dirs: list[Path]) -> tuple[Path, tuple[int, int], float]:
    with open("src/content/webtoonEpisodeManifest.json", "r", encoding="utf-8") as f:
        manifest = json.load(f)
    with open("public/book/index.json", "r", encoding="utf-8") as f:
        book_idx = json.load(f)

    ep_meta_map = {e["episodeNumber"]: e for e in book_idx.get("episodes", [])}
    ep_data = manifest[str(ep_num)]
    ep_meta = ep_meta_map.get(ep_num, {})

    title_ko = ep_meta.get("titleKo") or ep_data.get("episodeTitleKo") or f"제{ep_num}화"
    title_en = ep_data.get("episodeTitle") or f"Episode {ep_num:02d}"
    next_meta = ep_meta_map.get(ep_num + 1, {})
    next_title_ko = next_meta.get("titleKo", "")

    # Fonts (2x supersampled sizes)
    f_top_kicker = load_font(FONT_GOTHIC, 24, index=6)     # Bold
    f_top_title = load_font(FONT_GOTHIC, 46, index=14)     # ExtraBold
    f_top_en = load_font(FONT_SERIF_EN, 25, index=1)       # Palatino Italic
    f_narr = load_font(FONT_GOTHIC, 33, index=4)           # SemiBold
    f_speech = load_font(FONT_GOTHIC, 35, index=6)         # Bold
    f_shout = load_font(FONT_GOTHIC, 39, index=14)         # ExtraBold
    f_speaker = load_font(FONT_GOTHIC, 25, index=14)       # ExtraBold
    f_end_title = load_font(FONT_GOTHIC, 34, index=14)     # ExtraBold
    f_end_sub = load_font(FONT_GOTHIC, 26, index=4)        # SemiBold

    images_info = ep_data["images"]

    # Pre-calculate layout heights on 2x canvas (W = 1380)
    TOP_BANNER_H = 210
    FOOTER_BANNER_H = 240
    SCENE_GAP = 86

    narr_max_w = W - 210       # generous side margins inside narration box
    bubble_max_w = W - 280     # sleek centered/staggered webtoon speech bubble width

    laid_out_scenes = []
    total_h = TOP_BANNER_H

    speech_side_toggle = 0  # alternate slight left/right alignment for dialogue rhythm

    for item in images_info:
        sc_idx = item["index"]
        sc_type = item.get("type", "scene")
        is_climax = bool(item.get("isKeyClimax")) and sc_type != "ending_promo"
        img_rel = "public" + (item.get("localArtUrl") or item.get("imageUrl"))
        segments = parse_scene_segments(item)

        seg_layouts = []
        blocks_h = 0
        overlap_top = 0

        for s_i, seg in enumerate(segments):
            kind = seg["kind"]
            if kind == "narration":
                lines = wrap_korean_lines(seg["text"], f_narr, narr_max_w)
                line_h = 52
                pad_y = 36
                box_h = len(lines) * line_h + pad_y * 2
                gap_before = 30 if s_i == 0 else 26
                seg_layouts.append({
                    "kind": "narration",
                    "lines": lines,
                    "line_h": line_h,
                    "box_h": box_h,
                    "gap_before": gap_before,
                    "is_climax": is_climax,
                })
                blocks_h += gap_before + box_h
            else:
                font_use = f_shout if kind == "shout" else f_speech
                eff_max_w = (W - 390) if kind == "shout" else bubble_max_w
                lines = wrap_korean_lines(seg["text"], font_use, eff_max_w)
                line_h = 56 if kind == "shout" else 52
                max_lw = max((font_use.getlength(l) for l in lines), default=240.0)
                pad_x = 126 if kind == "shout" else 68
                pad_y = 64 if kind == "shout" else 42
                bub_w = min(W - 96, max(440, int(max_lw + pad_x * 2)))
                bub_h = len(lines) * line_h + pad_y * 2

                side = speech_side_toggle % 2
                speech_side_toggle += 1

                # If speech/shout is the very first block after the cutscene, overlap bottom of cutscene slightly (-24px) like authentic webtoons!
                if s_i == 0:
                    overlap_top = 24
                    gap_before = 22  # space for speaker badge + tail
                else:
                    gap_before = 38

                seg_layouts.append({
                    "kind": kind,
                    "speaker": seg["speaker"],
                    "lines": lines,
                    "line_h": line_h,
                    "bub_w": bub_w,
                    "bub_h": bub_h,
                    "side": side,
                    "gap_before": gap_before,
                })
                blocks_h += gap_before + bub_h

        extra_after = 96 if sc_idx == 0 else (50 if sc_type == "ending_promo" else SCENE_GAP)
        scene_total_h = IMG_H - overlap_top + blocks_h + extra_after
        laid_out_scenes.append({
            "sc_idx": sc_idx,
            "sc_type": sc_type,
            "is_climax": is_climax,
            "img_rel": img_rel,
            "overlap_top": overlap_top,
            "segments": seg_layouts,
            "extra_after": extra_after,
            "scene_total_h": scene_total_h,
        })
        total_h += scene_total_h

    total_h += FOOTER_BANNER_H

    # Create 2x supersampled RGBA canvas
    canvas = Image.new("RGBA", (W, total_h), (*BG_COLOR, 255))
    draw = ImageDraw.Draw(canvas)

    # 1. Top Episode Header (Minimalist dark-fantasy Naver Webtoon header)
    cx = W / 2.0
    kicker_txt = f"눈히어로 : 카단의 여정  ·  제 {ep_num} 화"
    kw = f_top_kicker.getlength(kicker_txt)
    draw.text((cx - kw / 2.0, 44), kicker_txt, font=f_top_kicker, fill=(148, 163, 184, 255))

    tw = f_top_title.getlength(title_ko)
    draw.text((cx - tw / 2.0, 84), title_ko, font=f_top_title, fill=(255, 255, 255, 255))

    ew = f_top_en.getlength(title_en)
    draw.text((cx - ew / 2.0, 148), title_en, font=f_top_en, fill=(148, 163, 184, 210))

    # Subtle ornamental divider line
    draw.line([(cx - 180, 192), (cx + 180, 192)], fill=(255, 255, 255, 55), width=2)

    curr_y = TOP_BANNER_H

    # Pre-generate top/bottom edge vignette mask for cutscenes so transitions feel cinematic
    edge_fade = Image.new("L", (W, IMG_H), 255)
    ef_px = edge_fade.load()
    fade_px = 18
    for yy in range(fade_px):
        val = int(round(255 * (yy / float(fade_px))))
        for xx in range(W):
            ef_px[xx, yy] = val
            ef_px[xx, IMG_H - 1 - yy] = val

    # 2. Render each scene + webtoon speech bubbles / narration boxes
    for sc in laid_out_scenes:
        sc_idx = sc["sc_idx"]
        sc_type = sc["sc_type"]
        img_y = curr_y

        with Image.open(sc["img_rel"]) as raw_im:
            im_rgb = raw_im.convert("RGB").resize((W, IMG_H), Image.Resampling.LANCZOS)
            if sc_idx == 0 or sc_type == "ending_promo":
                # Keep full crisp edges on title & ending cards, only subtle 1px border
                canvas.paste(im_rgb, (0, img_y))
            else:
                # Subtle top/bottom feather into cinema black scroll background
                bg_slice = Image.new("RGB", (W, IMG_H), BG_COLOR)
                blended = Image.composite(im_rgb, bg_slice, edge_fade)
                canvas.paste(blended, (0, img_y))

        # Subtle side hairline frame
        draw.rectangle([1, img_y, W - 2, img_y + IMG_H - 1], outline=(255, 255, 255, 22), width=2)

        block_y = img_y + IMG_H - sc["overlap_top"]

        for s_i, seg in enumerate(sc["segments"]):
            block_y += seg["gap_before"]
            kind = seg["kind"]

            if kind == "narration":
                box_h = seg["box_h"]
                bx0, bx1 = 68, W - 68
                by0, by1 = block_y, block_y + box_h

                # Sleek dark-obsidian narration plaque
                box_fill = (20, 25, 38, 245) if not seg["is_climax"] else (32, 24, 18, 248)
                border_col = (100, 116, 139, 95) if not seg["is_climax"] else (245, 158, 11, 155)
                accent_col = (56, 189, 248, 190) if not seg["is_climax"] else (251, 191, 36, 220)

                draw.rounded_rectangle([bx0, by0, bx1, by1], radius=8, fill=box_fill, outline=border_col, width=2)
                # Top/bottom centered hairline accents
                draw.line([(cx - 56, by0), (cx + 56, by0)], fill=accent_col, width=4)
                draw.line([(cx - 56, by1), (cx + 56, by1)], fill=accent_col, width=4)

                lines = seg["lines"]
                line_h = seg["line_h"]
                total_txt_h = len(lines) * line_h
                ty = by0 + (box_h - total_txt_h) / 2.0 + 4
                for ln in lines:
                    lw = f_narr.getlength(ln)
                    draw.text((cx - lw / 2.0, ty), ln, font=f_narr, fill=(241, 245, 249, 255))
                    ty += line_h

                block_y += box_h

            else:
                # Speech or Shout Bubble
                bub_w = seg["bub_w"]
                bub_h = seg["bub_h"]
                side = seg["side"]
                speaker = seg["speaker"]

                # Slight left/right stagger like authentic webtoon conversation flow
                if bub_w >= W - 220:
                    bx0 = int((W - bub_w) / 2)
                elif side == 0:
                    bx0 = 84
                else:
                    bx0 = W - 84 - bub_w
                bx1 = bx0 + bub_w
                by0 = block_y
                by1 = by0 + bub_h
                bcx = (bx0 + bx1) / 2.0
                bcy = (by0 + by1) / 2.0

                # Drop shadow layer
                sh_pad = 36
                sh_im = Image.new("RGBA", (bub_w + sh_pad * 2, bub_h + sh_pad * 2), (0, 0, 0, 0))
                sh_dr = ImageDraw.Draw(sh_im)
                sh_dr.rounded_rectangle(
                    [sh_pad, sh_pad + 8, sh_pad + bub_w, sh_pad + bub_h + 8],
                    radius=44,
                    fill=(0, 0, 0, 175),
                )
                sh_im = sh_im.filter(ImageFilter.GaussianBlur(radius=12))
                canvas.alpha_composite(sh_im, (bx0 - sh_pad, by0 - sh_pad))
                draw = ImageDraw.Draw(canvas)

                if kind == "shout":
                    # Spiky Webtoon Shout Burst Bubble with generous inner safe zone
                    draw_shout_burst_polygon(
                        draw,
                        bcx,
                        bcy,
                        bub_w * 0.52,
                        bub_h * 0.56,
                        fill=(255, 252, 247, 255),
                        outline=(185, 28, 28, 255),
                        width=5,
                    )
                    font_use = f_shout
                    txt_fill = (20, 16, 18, 255)
                    badge_bg = (185, 28, 28, 255)
                    badge_border = (254, 202, 202, 255)
                else:
                    # Smooth Webtoon Speech Bubble + Seamless Upward Pointer Tail
                    tail_x = bx0 + int(bub_w * (0.28 if side == 0 else 0.72))
                    tail_pts = [
                        (tail_x - 22, by0 + 10),
                        (tail_x + (-12 if side == 0 else 12), by0 - 28),
                        (tail_x + 22, by0 + 10),
                    ]
                    draw.rounded_rectangle(
                        [bx0, by0, bx1, by1],
                        radius=46,
                        fill=(253, 252, 252, 255),
                        outline=(22, 25, 34, 255),
                        width=5,
                    )
                    # Erase border seam beneath tail base, fill tail, and stroke outer two edges
                    draw.polygon(tail_pts, fill=(253, 252, 252, 255))
                    draw.line([(tail_x - 19, by0 + 2), (tail_x + 19, by0 + 2)], fill=(253, 252, 252, 255), width=10)
                    draw.line([(tail_x - 20, by0 + 4), (tail_pts[1][0], tail_pts[1][1])], fill=(22, 25, 34, 255), width=5)
                    draw.line([(tail_pts[1][0], tail_pts[1][1]), (tail_x + 20, by0 + 4)], fill=(22, 25, 34, 255), width=5)

                    font_use = f_speech
                    txt_fill = (17, 20, 28, 255)
                    badge_bg = (22, 27, 38, 255)
                    badge_border = (148, 163, 184, 180)

                # Speaker Nameplate Pill Badge
                spk_w = f_speaker.getlength(speaker)
                pw = int(spk_w + 40)
                ph = 42
                px0 = bx0 + 34
                py0 = by0 - 21
                draw.rounded_rectangle(
                    [px0, py0, px0 + pw, py0 + ph],
                    radius=21,
                    fill=badge_bg,
                    outline=badge_border,
                    width=2,
                )
                draw.text((px0 + 20, py0 + 6), speaker, font=f_speaker, fill=(255, 255, 255, 255))

                # Centered Bubble Dialogue Lines
                lines = seg["lines"]
                line_h = seg["line_h"]
                total_txt_h = len(lines) * line_h
                ty = by0 + (bub_h - total_txt_h) / 2.0 + 4
                for ln in lines:
                    lw = font_use.getlength(ln)
                    draw.text((bcx - lw / 2.0, ty), ln, font=font_use, fill=txt_fill)
                    ty += line_h

                block_y += bub_h

        curr_y += sc["scene_total_h"]

    # 3. Clean Naver Webtoon Episode End Footer
    draw.line([(cx - 220, curr_y + 24), (cx + 220, curr_y + 24)], fill=(255, 255, 255, 50), width=2)
    end_line1 = f"제 {ep_num} 화  〈{title_ko}〉  끝"
    ew1 = f_end_title.getlength(end_line1)
    draw.text((cx - ew1 / 2.0, curr_y + 62), end_line1, font=f_end_title, fill=(255, 255, 255, 245))

    if ep_num < 40:
        end_line2 = f"다음 화 예고  ·  제 {ep_num + 1} 화 〈{next_title_ko}〉"
    else:
        end_line2 = "눈히어로 : 카단의 여정 — 전 40화 완결"
    ew2 = f_end_sub.getlength(end_line2)
    draw.text((cx - ew2 / 2.0, curr_y + 122), end_line2, font=f_end_sub, fill=(148, 163, 184, 220))

    # Downsample 2x -> 690px exact Naver Webtoon width with LANCZOS
    final_h = total_h // SCALE
    final_rgb = canvas.convert("RGB").resize((FINAL_W, final_h), Image.Resampling.LANCZOS)

    MAX_BYTES = 4_880_000  # Strictly < 5,000,000 decimal bytes (and < 5 MiB = 5,242,880 bytes)
    clean_title = re.sub(r"\s+", " ", re.sub(r"[^\w가-힣\s]+", " ", title_ko)).strip()
    png_filename = f"{ep_num}화 {clean_title}.png"
    jpg_filename = f"{ep_num}화 {clean_title}.jpg"

    # 1. Encode < 5MB 24-bit JPEG (Naver Webtoon's official recommended upload format)
    jpg_bytes: bytes | None = None
    for q, sub in [(90, 0), (87, 0), (85, 1), (84, 1), (82, 1), (80, 1), (77, 1), (74, 1), (70, 2), (65, 2), (60, 2)]:
        buf = io.BytesIO()
        final_rgb.save(buf, "JPEG", quality=q, subsampling=sub, optimize=True)
        if buf.tell() <= MAX_BYTES:
            jpg_bytes = buf.getvalue()
            break
    if jpg_bytes is None:
        buf = io.BytesIO()
        final_rgb.save(buf, "JPEG", quality=55, subsampling=2, optimize=True)
        jpg_bytes = buf.getvalue()

    # 2. Encode < 5MB quantized PNG (for users preferring .png extension)
    png_bytes: bytes | None = None
    for colors in (112, 104, 96, 88, 76, 64, 52, 42, 32):
        q_im = final_rgb.quantize(colors=colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
        buf = io.BytesIO()
        q_im.save(buf, "PNG", optimize=True, compress_level=9)
        if buf.tell() <= MAX_BYTES:
            png_bytes = buf.getvalue()
            break
    if png_bytes is None:
        q_im = final_rgb.quantize(colors=24, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
        buf = io.BytesIO()
        q_im.save(buf, "PNG", optimize=True, compress_level=9)
        png_bytes = buf.getvalue()

    first_png_path: Path | None = None
    for od in out_dirs:
        if od.name.endswith("_JPG") or od.name == "jpg":
            od.mkdir(parents=True, exist_ok=True)
            (od / jpg_filename).write_bytes(jpg_bytes)
        elif od.name.endswith("_PNG") or od.name == "png":
            od.mkdir(parents=True, exist_ok=True)
            p_png = od / png_filename
            p_png.write_bytes(png_bytes)
            if first_png_path is None:
                first_png_path = p_png
        else:
            od.mkdir(parents=True, exist_ok=True)
            p_png = od / png_filename
            p_jpg = od / jpg_filename
            p_png.write_bytes(png_bytes)
            p_jpg.write_bytes(jpg_bytes)
            if first_png_path is None:
                first_png_path = p_png

    assert first_png_path is not None
    png_mb = round(len(png_bytes) / (1024 * 1024), 2)
    jpg_mb = round(len(jpg_bytes) / (1024 * 1024), 2)
    return first_png_path, final_rgb.size, png_mb, jpg_mb, len(png_bytes), len(jpg_bytes)


def main():
    ep_arg = sys.argv[1] if len(sys.argv) > 1 else "1"
    dl = Path(os.path.expanduser("~/Downloads"))
    out_dirs = [
        Path("exports/naver_webtoon/jpg"),
        Path("exports/naver_webtoon/png"),
        dl / "네이버웹툰_전40화_JPG",
        dl / "네이버웹툰_전40화_PNG",
    ]
    if ep_arg == "all":
        t0 = time.time()
        print("Generating all 40 Naver Webtoon episodes (690px width, strict < 5MB) in parallel...")
        results = []
        with ProcessPoolExecutor(max_workers=6) as ex:
            futs = {ex.submit(build_episode_png, ep, out_dirs): ep for ep in range(1, 41)}
            for fut in as_completed(futs):
                ep = futs[fut]
                p, dims, png_mb, jpg_mb, png_b, jpg_b = fut.result()
                results.append((ep, p.stem, dims, png_mb, jpg_mb, png_b, jpg_b))
                print(
                    f"  [{len(results):02d}/40] EP{ep:02d} {p.stem} -> {dims[0]}x{dims[1]}px | "
                    f"JPG: {jpg_mb:.2f}MiB ({jpg_b:,}B) | PNG: {png_mb:.2f}MiB ({png_b:,}B)",
                    flush=True,
                )
        results.sort(key=lambda x: x[0])
        max_jpg_b = max(r[6] for r in results)
        max_png_b = max(r[5] for r in results)
        elapsed = round(time.time() - t0, 1)
        print(
            f"\nAll 40 episodes completed in {elapsed}s! "
            f"Max JPG: {max_jpg_b:,} bytes (<5MB={max_jpg_b < 5_000_000}) | "
            f"Max PNG: {max_png_b:,} bytes (<5MB={max_png_b < 5_000_000})"
        )
    else:
        ep = int(ep_arg)
        p, dims, png_mb, jpg_mb, png_b, jpg_b = build_episode_png(ep, out_dirs)
        print(f"Saved: {p.stem} | {dims[0]}x{dims[1]}px | JPG={jpg_mb}MiB ({jpg_b:,}B), PNG={png_mb}MiB ({png_b:,}B)")


if __name__ == "__main__":
    main()
