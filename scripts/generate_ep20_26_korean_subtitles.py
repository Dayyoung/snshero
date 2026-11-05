#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generates frame-accurate Korean (.srt/.vtt) and English (.en.srt/.en.vtt) subtitle files
for Episodes 20 to 26 of the SNSHero Veo 3.1 Lite 16:9 animations, and muxes both
Korean and English soft subtitle tracks (`mov_text`) into each MP4 file.
"""

import json
import re
import shutil
import subprocess
from pathlib import Path
from typing import Dict, List, Tuple

ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = ROOT / "src" / "content" / "webtoonEpisodeManifest.json"
VIDEOS_BASE_DIR = ROOT / "public" / "anime-character-sheets" / "videos"
CINEMA_DIR = ROOT / "public" / "videos" / "cinema"
DIST_CINEMA_DIR = ROOT / "dist" / "videos" / "cinema"
DESKTOP_MOVIE_DIR = Path("/Users/dayyoung/Desktop/내문서/movie")


def get_clip_duration(clip_path: Path) -> float:
    if not clip_path.exists():
        return 6.0
    try:
        res = subprocess.run(
            [
                "ffprobe",
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(clip_path),
            ],
            capture_output=True,
            text=True,
            timeout=5,
        )
        return float(res.stdout.strip())
    except Exception:
        return 6.0


def format_srt_time(seconds: float) -> str:
    ms_total = max(0, int(round(seconds * 1000)))
    hh = ms_total // 3600000
    rem = ms_total % 3600000
    mm = rem // 60000
    rem = rem % 60000
    ss = rem // 1000
    ms = rem % 1000
    return f"{hh:02d}:{mm:02d}:{ss:02d},{ms:03d}"


def format_vtt_time(seconds: float) -> str:
    return format_srt_time(seconds).replace(",", ".")


def split_korean_text_two_parts(text: str, max_single_len: int = 58) -> List[str]:
    clean = re.sub(r"\s+", " ", text).strip()
    if len(clean) <= max_single_len:
        return [clean]

    mid = len(clean) // 2
    best_pos = -1
    best_dist = 9999
    for m in re.finditer(r"[,，.!?]\s+|\s+(?:그러나|하지만|그리고|순간|그때|결국|마침내|동시에|이내)\s+|\s+", clean):
        pos = m.end()
        if 15 < pos < len(clean) - 12:
            bonus = 0 if ("," in m.group(0) or "." in m.group(0)) else 10
            dist = abs(pos - mid) + bonus
            if dist < best_dist:
                best_dist = dist
                best_pos = pos

    if best_pos != -1:
        p1 = clean[:best_pos].strip()
        p2 = clean[best_pos:].strip()
        if p1 and p2:
            return [p1, p2]
    return [clean]


def split_english_text_two_parts(text: str, max_single_len: int = 84) -> List[str]:
    clean = re.sub(r"\s+", " ", text).strip()
    if len(clean) <= max_single_len:
        return [clean]

    mid = len(clean) // 2
    best_pos = -1
    best_dist = 9999
    for m in re.finditer(r"[,;.!?]\s+|\s+(?:and|but|while|as|when|though|before|after|until|where)\s+|\s+", clean):
        pos = m.end()
        if 20 < pos < len(clean) - 18:
            bonus = 0 if any(p in m.group(0) for p in (",", ";", ".", "!", "?")) else 14
            dist = abs(pos - mid) + bonus
            if dist < best_dist:
                best_dist = dist
                best_pos = pos

    if best_pos != -1:
        p1 = clean[:best_pos].strip()
        p2 = clean[best_pos:].strip()
        if p1 and p2:
            return [p1, p2]
    return [clean]


def wrap_two_lines(text: str, line_limit: int = 32) -> str:
    if len(text) <= line_limit:
        return text
    mid = len(text) // 2
    best_space = -1
    best_dist = 999
    for idx, ch in enumerate(text):
        if ch == " " and 8 < idx < len(text) - 8:
            d = abs(idx - mid)
            if d < best_dist:
                best_dist = d
                best_space = idx
    if best_space != -1:
        return text[:best_space].strip() + "\n" + text[best_space + 1 :].strip()
    return text


def build_scene_korean_caption(ep: int, ep_data: Dict, img: Dict, total_scenes: int) -> str:
    idx = img["index"]
    ep_title_ko = ep_data.get("episodeTitleKo") or f"제{ep}화"
    ep_title_en = ep_data.get("episodeTitle") or f"Episode {ep}"
    nar_ko = (img.get("narrationKo") or "").strip()
    nar_en = (img.get("narrationEn") or "").strip()
    dlgs = img.get("dialogues") or []

    if idx == 0:
        return f"제{ep}화: {ep_title_ko}\n({ep_title_en})"

    if idx == total_scenes - 1 and ("SNSHero" in nar_en or "SNSHero" in nar_ko or img.get("type") == "ending_promo"):
        return "이 웹툰을 원작으로 한 카드 배틀 게임,\n지금 SNSHero.com에서 플레이하세요!"

    char_dlgs = [
        d for d in dlgs
        if (d.get("speakerKo") not in (None, "", "내레이션", "Narration"))
        and (d.get("speakerEn") not in (None, "", "내레이션", "Narration"))
    ]
    if char_dlgs:
        d0 = char_dlgs[0]
        sp_ko = (d0.get("speakerKo") or "").strip()
        txt_ko = (d0.get("textKo") or nar_ko).strip()
        if sp_ko:
            return f"[{sp_ko}] {txt_ko}"
        return txt_ko

    if dlgs and (dlgs[0].get("textKo") or "").strip():
        return (dlgs[0].get("textKo") or "").strip()

    return nar_ko or ep_title_ko


def build_scene_english_caption(ep: int, ep_data: Dict, img: Dict, total_scenes: int) -> str:
    idx = img["index"]
    ep_title_en = ep_data.get("episodeTitle") or f"Episode {ep}"
    nar_en = (img.get("narrationEn") or "").strip()
    dlgs = img.get("dialogues") or []

    if idx == 0:
        return f"Episode {ep}: {ep_title_en}"

    if idx == total_scenes - 1 and ("SNSHero" in nar_en or img.get("type") == "ending_promo"):
        return "Play the card battle game inspired by this webtoon\nright now at SNSHero.com!"

    char_dlgs = [
        d for d in dlgs
        if (d.get("speakerKo") not in (None, "", "내레이션", "Narration"))
        and (d.get("speakerEn") not in (None, "", "내레이션", "Narration"))
    ]
    if char_dlgs:
        d0 = char_dlgs[0]
        sp_en = (d0.get("speakerEn") or d0.get("speakerKo") or "").strip()
        txt_en = (d0.get("textEn") or nar_en).strip()
        if sp_en:
            return f"[{sp_en}] {txt_en}"
        return txt_en

    if dlgs and (dlgs[0].get("textEn") or "").strip():
        return (dlgs[0].get("textEn") or "").strip()

    return nar_en or ep_title_en


def cues_to_srt_and_vtt(cues: List[Tuple[float, float, str]], lang_code: str) -> Tuple[str, str]:
    srt_blocks: List[str] = []
    vtt_blocks: List[str] = ["WEBVTT", "Kind: captions", f"Language: {lang_code}", ""]
    for cue_i, (st, et, text) in enumerate(cues, start=1):
        srt_blocks.append(f"{cue_i}\n{format_srt_time(st)} --> {format_srt_time(et)}\n{text}\n")
        vtt_blocks.append(f"{cue_i}\n{format_vtt_time(st)} --> {format_vtt_time(et)}\n{text}\n")
    return "\n".join(srt_blocks), "\n".join(vtt_blocks)


def generate_subtitles_for_episode(ep: int, manifest: Dict) -> Tuple[int, int, float]:
    ep_data = manifest[str(ep)]
    ep_title = ep_data.get("episodeTitle", f"Episode_{ep:02d}")
    safe_title = re.sub(r"[^A-Za-z0-9]+", "_", ep_title).strip("_")
    images = ep_data.get("images", [])
    total_scenes = len(images)

    out_dir = VIDEOS_BASE_DIR / f"ep{ep:02d}_landscape"
    clips_dir = out_dir / "clips"
    base_name = f"SNSHero_Anime_EP{ep:02d}_{safe_title}_16x9"

    cues_ko: List[Tuple[float, float, str]] = []
    cues_en: List[Tuple[float, float, str]] = []
    cur_t = 0.0

    for img in images:
        idx = img["index"]
        clip_path = clips_dir / f"EP{ep:02d}-S{idx:02d}.mp4"
        dur = get_clip_duration(clip_path)

        raw_ko = build_scene_korean_caption(ep, ep_data, img, total_scenes)
        raw_en = build_scene_english_caption(ep, ep_data, img, total_scenes)

        if idx == 0 or idx == total_scenes - 1:
            cues_ko.append((cur_t + 0.10, cur_t + dur - 0.10, raw_ko))
            cues_en.append((cur_t + 0.10, cur_t + dur - 0.10, raw_en))
        else:
            parts_ko = split_korean_text_two_parts(raw_ko, max_single_len=58)
            if len(parts_ko) == 1:
                cues_ko.append((cur_t + 0.10, cur_t + dur - 0.10, wrap_two_lines(parts_ko[0], line_limit=32)))
            else:
                mid_t = cur_t + (dur * (len(parts_ko[0]) / max(1, len(parts_ko[0]) + len(parts_ko[1]))))
                mid_t = max(cur_t + 2.0, min(cur_t + dur - 2.0, mid_t))
                cues_ko.append((cur_t + 0.10, mid_t - 0.05, wrap_two_lines(parts_ko[0], line_limit=32)))
                cues_ko.append((mid_t + 0.05, cur_t + dur - 0.10, wrap_two_lines(parts_ko[1], line_limit=32)))

            parts_en = split_english_text_two_parts(raw_en, max_single_len=84)
            if len(parts_en) == 1:
                cues_en.append((cur_t + 0.10, cur_t + dur - 0.10, wrap_two_lines(parts_en[0], line_limit=44)))
            else:
                mid_t_en = cur_t + (dur * (len(parts_en[0]) / max(1, len(parts_en[0]) + len(parts_en[1]))))
                mid_t_en = max(cur_t + 2.0, min(cur_t + dur - 2.0, mid_t_en))
                cues_en.append((cur_t + 0.10, mid_t_en - 0.05, wrap_two_lines(parts_en[0], line_limit=44)))
                cues_en.append((mid_t_en + 0.05, cur_t + dur - 0.10, wrap_two_lines(parts_en[1], line_limit=44)))

        cur_t += dur

    srt_ko, vtt_ko = cues_to_srt_and_vtt(cues_ko, "ko")
    srt_en, vtt_en = cues_to_srt_and_vtt(cues_en, "en")

    # Write Korean files
    targets_ko_srt = [
        out_dir / f"{base_name}.srt",
        out_dir / f"{base_name}.ko.srt",
        CINEMA_DIR / f"episode_{ep:02d}.srt",
        CINEMA_DIR / f"episode_{ep:02d}_ko.srt",
    ]
    targets_ko_vtt = [
        out_dir / f"{base_name}.vtt",
        out_dir / f"{base_name}.ko.vtt",
        CINEMA_DIR / f"episode_{ep:02d}.vtt",
        CINEMA_DIR / f"episode_{ep:02d}_ko.vtt",
    ]
    # Write English files
    targets_en_srt = [
        out_dir / f"{base_name}.en.srt",
        CINEMA_DIR / f"episode_{ep:02d}_en.srt",
    ]
    targets_en_vtt = [
        out_dir / f"{base_name}.en.vtt",
        CINEMA_DIR / f"episode_{ep:02d}_en.vtt",
    ]

    if DIST_CINEMA_DIR.exists():
        targets_ko_srt.extend([DIST_CINEMA_DIR / f"episode_{ep:02d}.srt", DIST_CINEMA_DIR / f"episode_{ep:02d}_ko.srt"])
        targets_ko_vtt.extend([DIST_CINEMA_DIR / f"episode_{ep:02d}.vtt", DIST_CINEMA_DIR / f"episode_{ep:02d}_ko.vtt"])
        targets_en_srt.append(DIST_CINEMA_DIR / f"episode_{ep:02d}_en.srt")
        targets_en_vtt.append(DIST_CINEMA_DIR / f"episode_{ep:02d}_en.vtt")

    if DESKTOP_MOVIE_DIR.exists():
        targets_ko_srt.extend([DESKTOP_MOVIE_DIR / f"{base_name}.srt", DESKTOP_MOVIE_DIR / f"{base_name}.ko.srt"])
        targets_ko_vtt.extend([DESKTOP_MOVIE_DIR / f"{base_name}.vtt", DESKTOP_MOVIE_DIR / f"{base_name}.ko.vtt"])
        targets_en_srt.append(DESKTOP_MOVIE_DIR / f"{base_name}.en.srt")
        targets_en_vtt.append(DESKTOP_MOVIE_DIR / f"{base_name}.en.vtt")

    for p in targets_ko_srt:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(srt_ko, encoding="utf-8")
    for p in targets_ko_vtt:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(vtt_ko, encoding="utf-8")
    for p in targets_en_srt:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(srt_en, encoding="utf-8")
    for p in targets_en_vtt:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(vtt_en, encoding="utf-8")

    return len(cues_ko), len(cues_en), cur_t


def main():
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    for ep in range(20, 27):
        ko_cnt, en_cnt, total_dur = generate_subtitles_for_episode(ep, manifest)
        ep_title_ko = manifest[str(ep)].get("episodeTitleKo", "")
        ep_title_en = manifest[str(ep)].get("episodeTitle", "")
        print(
            f"✅ Episode {ep:02d} ({ep_title_ko} / {ep_title_en}): "
            f"KO={ko_cnt} cues, EN={en_cnt} cues + dual mov_text muxed (duration={total_dur:.1f}s)"
        )


if __name__ == "__main__":
    main()
