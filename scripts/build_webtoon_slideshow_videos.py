#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SNSHero Webtoon Multi-Voice Slideshow Video Builder (KO 40 eps + EN 40 eps)
- Resolution: 1280x720 (16:9 HD), 24 fps, H.264 + AAC 192kbps 48kHz Stereo
- Voice Direction:
  * 일반 나레이션 (Narration): 잔잔한 남성 목소리 (Calm, warm male narrator)
  * 일반 대사 (Speech): 잔잔한 젊은 남성 / 젊은 여성 목소리 (성별 자동 매칭)
  * 강조 대사 (Shout): 흥분한/격정적인 남성 / 여성 목소리 (성별 자동 매칭)
  * 나머지 대사 (Situational/Character): 노장·현자 / 냉혹한 악역 / 아이 / 애절·속삭임 상황별 성우 톤 자동 연출
- Visuals:
  * Smooth Ken Burns zoom/pan on artwork while keeping crisp lower-third subtitles rock-steady
  * Warm ambient fantasy orchestral BGM mixed gently beneath voice acting (-19dB)

Usage:
  python3 scripts/build_webtoon_slideshow_videos.py 1 both
  python3 scripts/build_webtoon_slideshow_videos.py all both
"""

import asyncio
import concurrent.futures
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import sys
import time
import wave
from pathlib import Path
import edge_tts
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MANIFEST_PATH = PROJECT_ROOT / "src/content/webtoonEpisodeManifest.json"
BOOK_INDEX_PATH = PROJECT_ROOT / "public/book/index.json"
WEBTOON_IMG_ROOT = PROJECT_ROOT / "public/images/webtoon"

VIDEO_W = 1280
VIDEO_H = 720
OVERSCAN_W = 1408
OVERSCAN_H = 792
FPS = 24

FONT_KO = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
FONT_EN_SANS = "/System/Library/Fonts/Avenir Next.ttc"
FONT_EN_SERIF = "/System/Library/Fonts/Palatino.ttc"

YOUNG_FEMALE_SPEAKERS = {
    "실리아", "Celia", "Cilia",
    "에일라", "Aila",
    "카제", "Kaze",
    "엘리아나", "Eliana",
    "실비아", "Sylvia",
    "티타니아", "Titania",
    "엘윈", "Elwin",
    "이셀라", "Ysela",
    "실피드", "Sylphid",
}

VILLAIN_FEMALE_SPEAKERS = {
    "메두사 고르고", "고르고", "Medusa Gorgo", "Medusa",
    "아라크네", "Arachne",
    "몽마 릴리스", "서큐버스 릴리스", "Succubus Lilith", "Lilith",
}

CHILD_SPEAKERS = {
    "피난민 아이", "Refugee Child",
    "구출된 아이", "Rescued Child",
}

ELDER_OR_VETERAN_MALE_SPEAKERS = {
    "헤르쿨", "Hercul",
    "론돌", "Rondol",
    "그림리", "Grimli",
    "가웨인", "Gawain",
    "레오나르", "Leonar",
    "펜릴", "Fenrir",
    "에올루스", "에올루스의 환영", "Aeolus",
    "말퓨온", "Malfuon", "Malfurion",
    "별빛의 현자", "Star Hermit",
    "원로원 의장", "Senate Chancellor",
    "항구 노인", "Harbor Elder",
    "어부", "Fisherman",
    "토르발트", "토르발드", "Thorvald",
}

VILLAIN_MALE_SPEAKERS = {
    "루시안", "Lucian",
    "제피르", "Zephyr",
    "데스나이트 아르투스", "아르투스", "Death Knight Artus", "Artus",
    "발타자르", "Balthazar",
    "바르가스트", "Barghest",
    "카르낙", "Karnak",
    "벨페고르", "Belphegor",
    "보가트", "고블린 왕 보가트", "Bogart",
    "우르삭", "Ursac",
    "바르토", "Barto",
    "감찰대장", "Inquisitor Captain",
    "암살자 두목", "암살 대장", "Assassin Leader",
    "황제", "Emperor",
    "경매상", "Auctioneer",
    "골목 건달 두목", "Alley Thug Leader",
}


def load_font(path: str, size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        return ImageFont.load_default()


def classify_speaker_archetype(speaker: str) -> str:
    s = speaker.strip()
    if s in ("", "내레이션", "Narration"):
        return "narrator"
    if s in YOUNG_FEMALE_SPEAKERS:
        return "young_female"
    if s in VILLAIN_FEMALE_SPEAKERS:
        return "villain_female"
    if s in CHILD_SPEAKERS:
        return "child"
    if s in ELDER_OR_VETERAN_MALE_SPEAKERS:
        return "veteran_male"
    if s in VILLAIN_MALE_SPEAKERS:
        return "villain_male"
    # Default young/adult male hero (Kadan, Ignis, Aleksandar, Balian, Robinyard, Walker, etc.)
    return "young_male"


def detect_situational_mood(text: str, context_text: str, bubble_type: str) -> str:
    """
    Determines delivery mood:
    - 'shout': 강조/외침/흥분 대사
    - 'whisper': 속삭임/낮은 경계
    - 'sorrow': 애절/슬픔/떨리는 목소리
    - 'thought': 내면 독백
    - 'speech': 잔잔한 일반 대사
    """
    if bubble_type == "shout":
        return "shout"
    combined = f"{text} {context_text}".lower()
    shout_kws = (
        "소리쳤", "포효", "외쳤", "고함", "절규", "비명", "으르렁",
        "shouted", "roared", "bellowed", "screamed", "barked", "snarled", "cried out",
    )
    if "!" in text and any(k in combined for k in shout_kws):
        return "shout"
    whisper_kws = ("속삭", "낮게", "조용히", "작은 목소리", "whispered", "murmured", "hushed", "quietly")
    if any(k in combined for k in whisper_kws):
        return "whisper"
    sorrow_kws = ("떨리는", "눈물", "울먹", "흐느껴", "애처로", "아가야", "trembling", "tears", "wept", "sobbed", "sorrow")
    if any(k in combined for k in sorrow_kws):
        return "sorrow"
    if bubble_type == "thought":
        return "thought"
    return "speech"


def select_voice_and_prosody(lang: str, archetype: str, mood: str) -> tuple[str, str, str, str]:
    """
    Returns (voice_name, rate, pitch, volume) tailored to language, character gender/archetype, and emotional mood.
    """
    if lang == "ko":
        if archetype == "narrator":
            # 일반 나레이션: 쾌활하고 경쾌한 남성 목소리 + 속도감 있는 템포 (+18%)
            return ("ko-KR-InJoonNeural", "+18%", "+4Hz", "+6%")

        if archetype == "young_female":
            if mood == "shout":
                return ("ko-KR-SunHiNeural", "+23%", "+13Hz", "+18%")
            if mood == "whisper":
                return ("ko-KR-SunHiNeural", "+2%", "+0Hz", "-4%")
            if mood in ("sorrow", "thought"):
                return ("ko-KR-SunHiNeural", "+4%", "+1Hz", "+0%")
            # 일반 대사: 맑고 자연스러운 젊은 여성 목소리
            return ("ko-KR-SunHiNeural", "+9%", "+4Hz", "+4%")

        if archetype == "villain_female":
            if mood == "shout":
                return ("ko-KR-SunHiNeural", "+21%", "+8Hz", "+18%")
            return ("ko-KR-SunHiNeural", "+5%", "-6Hz", "+5%")

        if archetype == "child":
            if mood == "shout":
                return ("ko-KR-SunHiNeural", "+20%", "+20Hz", "+14%")
            return ("ko-KR-SunHiNeural", "+10%", "+16Hz", "+4%")

        if archetype == "veteran_male":
            if mood == "shout":
                return ("ko-KR-HyunsuMultilingualNeural", "+20%", "+1Hz", "+20%")
            if mood == "whisper":
                return ("ko-KR-HyunsuMultilingualNeural", "+2%", "-11Hz", "-2%")
            if mood == "sorrow":
                return ("ko-KR-HyunsuMultilingualNeural", "+3%", "-9Hz", "+2%")
            return ("ko-KR-HyunsuMultilingualNeural", "+7%", "-9Hz", "+6%")

        if archetype == "villain_male":
            if mood == "shout":
                return ("ko-KR-InJoonNeural", "+24%", "+8Hz", "+22%")
            if mood == "whisper":
                return ("ko-KR-InJoonNeural", "+3%", "-8Hz", "+0%")
            return ("ko-KR-InJoonNeural", "+7%", "-8Hz", "+6%")

        # young_male (카단, 이그니스, 알렉산다르, 발리안 등 - 나레이터 InJoon과 구분되도록 젊은 톤의 Hyunsu 배정)
        if mood == "shout":
            # 강조 대사: 흥분한 젊은 남성 목소리
            return ("ko-KR-InJoonNeural", "+24%", "+14Hz", "+20%")
        if mood == "whisper":
            return ("ko-KR-HyunsuMultilingualNeural", "+3%", "+2Hz", "-3%")
        if mood in ("sorrow", "thought"):
            return ("ko-KR-HyunsuMultilingualNeural", "+5%", "+2Hz", "+2%")
        # 일반 대사: 자연스러운 젊은 남성 목소리
        return ("ko-KR-HyunsuMultilingualNeural", "+9%", "+4Hz", "+4%")

    else:
        # English ('en') multi-actor neural cast
        if archetype == "narrator":
            # Lively, upbeat, brisk English male narrator (+16%)
            return ("en-US-RogerNeural", "+16%", "+3Hz", "+6%")

        if archetype == "young_female":
            if mood == "shout":
                return ("en-US-AriaNeural", "+21%", "+10Hz", "+18%")
            if mood == "whisper":
                return ("en-US-JennyNeural", "+2%", "+0Hz", "-4%")
            if mood in ("sorrow", "thought"):
                return ("en-US-JennyNeural", "+4%", "+1Hz", "+0%")
            return ("en-US-AvaNeural", "+9%", "+3Hz", "+4%")

        if archetype == "villain_female":
            if mood == "shout":
                return ("en-US-AriaNeural", "+20%", "+7Hz", "+18%")
            return ("en-GB-SoniaNeural", "+5%", "-4Hz", "+5%")

        if archetype == "child":
            if mood == "shout":
                return ("en-US-AnaNeural", "+18%", "+8Hz", "+14%")
            return ("en-US-AnaNeural", "+10%", "+4Hz", "+4%")

        if archetype == "veteran_male":
            if mood == "shout":
                return ("en-US-ChristopherNeural", "+18%", "+2Hz", "+20%")
            if mood in ("whisper", "sorrow"):
                return ("en-GB-RyanNeural", "+3%", "-7Hz", "+2%")
            return ("en-GB-RyanNeural", "+7%", "-6Hz", "+6%")

        if archetype == "villain_male":
            if mood == "shout":
                return ("en-US-EricNeural", "+22%", "+8Hz", "+22%")
            return ("en-US-SteffanNeural", "+6%", "-6Hz", "+6%")

        # young_male
        if mood == "shout":
            return ("en-US-GuyNeural", "+21%", "+11Hz", "+20%")
        if mood == "whisper":
            return ("en-US-AndrewNeural", "+3%", "+0Hz", "-3%")
        if mood in ("sorrow", "thought"):
            return ("en-US-AndrewNeural", "+5%", "+1Hz", "+2%")
        return ("en-US-BrianNeural", "+9%", "+3Hz", "+4%")


def extract_scene_voice_segments(ep_num: int, title_ko: str, title_en: str, item: dict, lang: str) -> list[dict]:
    """
    Returns ordered list of spoken segments for a single webtoon panel:
      {
        'role': 'title' | 'ending' | 'narration' | 'dialogue',
        'speaker': str,
        'archetype': str,
        'mood': str,
        'tts_text': str,
        'subtitle_text': str,
      }
    """
    idx = item.get("index", 0)
    sc_type = item.get("type", "scene")

    if idx == 0 or sc_type == "title_card":
        if lang == "ko":
            tts_txt = f"눈히어로, 카단의 여정. 제 {ep_num} 화, {title_ko}."
        else:
            tts_txt = f"SNSHero, Kadan's Journey. Episode {ep_num}. {title_en}."
        return [{
            "role": "title",
            "speaker": "",
            "archetype": "narrator",
            "mood": "speech",
            "tts_text": tts_txt,
            "subtitle_text": "",  # Title card already has crisp white title on image
        }]

    if sc_type == "ending_promo":
        if lang == "ko":
            tts_txt = "웹툰 관련 카드게임 플레이를 원하시나요? 지금 에스엔에스히어로 닷컴에서 직접 플레이해 보세요."
        else:
            tts_txt = "Want to play the card game based on this webtoon? Play now at S N S Hero dot com."
        return [{
            "role": "ending",
            "speaker": "",
            "archetype": "narrator",
            "mood": "speech",
            "tts_text": tts_txt,
            "subtitle_text": "",  # Ending climax card already has crisp white overlay on image
        }]

    dlgs = item.get("dialogues") or []
    if not dlgs:
        raw = (item.get("narrationKo") if lang == "ko" else item.get("narrationEn")) or ""
        raw = re.sub(r"\s*\(눈히어로\.com\)", "", raw).strip()
        if not raw:
            return []
        return [{
            "role": "narration",
            "speaker": "",
            "archetype": "narrator",
            "mood": "speech",
            "tts_text": raw,
            "subtitle_text": raw,
        }]

    quote_re = re.compile(r"(“[^”]+”|\"[^\"]+\")")
    out_segs: list[dict] = []

    for d in dlgs:
        sp = (d.get("speakerKo") if lang == "ko" else d.get("speakerEn")) or ""
        sp_ko = (d.get("speakerKo") or "").strip()
        btype = (d.get("bubbleType") or "speech").strip()
        raw_txt = ((d.get("textKo") if lang == "ko" else d.get("textEn")) or "").strip()
        raw_txt = re.sub(r"\s*\(눈히어로\.com\)", "", raw_txt).strip()
        if not raw_txt:
            continue

        is_narr = sp.strip() in ("", "내레이션", "Narration") or sp_ko in ("", "내레이션", "Narration")
        if is_narr:
            out_segs.append({
                "role": "narration",
                "speaker": "",
                "archetype": "narrator",
                "mood": "speech",
                "tts_text": raw_txt.replace("“", "").replace("”", "").replace('"', ""),
                "subtitle_text": raw_txt,
            })
            continue

        archetype = classify_speaker_archetype(sp_ko or sp)
        parts = quote_re.split(raw_txt)
        has_quotes = any(quote_re.fullmatch(p.strip()) for p in parts if p.strip())

        if not has_quotes:
            clean_q = raw_txt.strip("“”\"' ").strip()
            mood = detect_situational_mood(clean_q, "", btype)
            out_segs.append({
                "role": "dialogue",
                "speaker": sp.strip(),
                "archetype": archetype,
                "mood": mood,
                "tts_text": clean_q,
                "subtitle_text": f"“{clean_q}”",
            })
        else:
            unquoted_ctx = " ".join(p.strip() for p in parts if p.strip() and not quote_re.fullmatch(p.strip()))
            for p in parts:
                ps = p.strip()
                if not ps:
                    continue
                # Ignore standalone punctuation leftovers like ',' or '.'
                if len(re.sub(r"[\W_]+", "", ps)) == 0:
                    continue
                if quote_re.fullmatch(ps):
                    clean_q = ps.strip("“”\"' ").strip()
                    # Clean trailing comma inside English quote like "The shadow reaches," -> "The shadow reaches."
                    tts_q = re.sub(r",\s*$", ".", clean_q)
                    mood = detect_situational_mood(clean_q, unquoted_ctx, btype)
                    out_segs.append({
                        "role": "dialogue",
                        "speaker": sp.strip(),
                        "archetype": archetype,
                        "mood": mood,
                        "tts_text": tts_q,
                        "subtitle_text": f"“{clean_q}”",
                    })
                else:
                    clean_n = ps.lstrip(",. ").strip()
                    if clean_n:
                        # Capitalize first letter in English if split after quote ("Hercul whispered..." or "he said...")
                        if lang == "en" and clean_n[0].islower():
                            clean_n = clean_n[0].upper() + clean_n[1:]
                        out_segs.append({
                            "role": "narration",
                            "speaker": "",
                            "archetype": "narrator",
                            "mood": "speech",
                            "tts_text": clean_n,
                            "subtitle_text": clean_n,
                        })

    return out_segs


def probe_duration(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(path),
        ]
    ).decode().strip()
    return float(out)


async def synthesize_tts_segment(
    tts_text: str,
    voice: str,
    rate: str,
    pitch: str,
    volume: str,
    out_wav: Path,
    post_pad_sec: float,
    sem: asyncio.Semaphore,
) -> float:
    async with sem:
        mp3_tmp = out_wav.with_suffix(".mp3")
        for attempt in range(4):
            try:
                comm = edge_tts.Communicate(tts_text, voice, rate=rate, pitch=pitch, volume=volume)
                await comm.save(str(mp3_tmp))
                if mp3_tmp.exists() and mp3_tmp.stat().st_size > 200:
                    break
            except Exception as e:
                if attempt == 3:
                    raise e
                await asyncio.sleep(0.8 * (attempt + 1))

        # Convert MP3 -> clean 48kHz stereo WAV with snappy 0.06s leading + post_pad_sec breath room
        subprocess.run(
            [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-i", str(mp3_tmp),
                "-af", f"adelay=60|60,apad=pad_dur={post_pad_sec:.2f}",
                "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le",
                str(out_wav),
            ],
            check=True,
        )
        mp3_tmp.unlink(missing_ok=True)
        return probe_duration(out_wav)


def wrap_subtitle_lines(text: str, font: ImageFont.FreeTypeFont, max_w: float) -> list[str]:
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
            cur = w
    if cur:
        lines.append(cur)
    return lines


def render_subtitle_overlay_png(
    out_png: Path,
    lang: str,
    role: str,
    speaker: str,
    mood: str,
    subtitle_text: str,
):
    """Creates a 1280x720 transparent RGBA PNG with rock-steady lower-third subtitles."""
    ov = Image.new("RGBA", (VIDEO_W, VIDEO_H), (0, 0, 0, 0))
    if not subtitle_text:
        ov.save(out_png, "PNG")
        return

    dr = ImageDraw.Draw(ov)
    if lang == "ko":
        f_sub = load_font(FONT_KO, 29 if mood == "shout" else 26, index=14 if mood == "shout" else 6)
        f_spk = load_font(FONT_KO, 20, index=14)
    else:
        f_sub = load_font(FONT_EN_SANS, 27 if mood == "shout" else 25, index=0 if mood == "shout" else 2)
        f_spk = load_font(FONT_EN_SANS, 19, index=0)

    max_text_w = VIDEO_W - 220
    lines = wrap_subtitle_lines(subtitle_text, f_sub, max_text_w)
    line_h = 38 if mood == "shout" else 35
    pad_y = 20
    box_h = len(lines) * line_h + pad_y * 2
    bx0 = 80
    bx1 = VIDEO_W - 80
    by1 = VIDEO_H - 32
    by0 = by1 - box_h
    cx = VIDEO_W / 2.0

    # Subtle bottom gradient under subtitle box
    grad = np.zeros((VIDEO_H, VIDEO_W, 4), dtype=np.uint8)
    g_start = max(0, by0 - 40)
    for y in range(g_start, VIDEO_H):
        t = (y - g_start) / max(1.0, float(VIDEO_H - 1 - g_start))
        grad[y, :, 3] = int(round(140 * (t ** 1.4)))
    ov = Image.alpha_composite(ov, Image.fromarray(grad))
    dr = ImageDraw.Draw(ov)

    if role == "dialogue":
        if mood == "shout":
            box_bg = (28, 12, 16, 226)
            border_col = (239, 68, 68, 230)
            badge_bg = (185, 28, 28, 255)
            txt_col = (255, 250, 245, 255)
        else:
            box_bg = (12, 17, 28, 222)
            border_col = (148, 163, 184, 150)
            badge_bg = (30, 41, 59, 255)
            txt_col = (255, 255, 255, 255)

        dr.rounded_rectangle([bx0, by0, bx1, by1], radius=14, fill=box_bg, outline=border_col, width=2)

        if speaker:
            sw = f_spk.getlength(speaker)
            pw = int(sw + 32)
            ph = 32
            px0 = bx0 + 24
            py0 = by0 - 16
            dr.rounded_rectangle([px0, py0, px0 + pw, py0 + ph], radius=16, fill=badge_bg, outline=border_col, width=2)
            dr.text((px0 + 16, py0 + 5), speaker, font=f_spk, fill=(255, 255, 255, 255))
    else:
        # Narration box
        box_bg = (10, 14, 23, 212)
        border_col = (56, 189, 248, 115)
        txt_col = (226, 232, 240, 255)
        dr.rounded_rectangle([bx0, by0, bx1, by1], radius=10, fill=box_bg, outline=border_col, width=1)
        dr.line([(cx - 48, by0), (cx + 48, by0)], fill=(56, 189, 248, 210), width=3)

    ty = by0 + pad_y + 2
    for ln in lines:
        lw = f_sub.getlength(ln)
        dr.text(
            (cx - lw / 2.0, ty),
            ln,
            font=f_sub,
            fill=txt_col,
            stroke_width=2,
            stroke_fill=(0, 0, 0, 230),
        )
        ty += line_h

    ov.save(out_png, "PNG")


def generate_ambient_bgm_wav(out_wav: Path, duration_sec: float, sr: int = 48000):
    """Synthesizes a warm, gentle stereo orchestral ambient BGM (Dm9 -> Bbmaj7 -> Fmaj7 -> Cadd9 -> Gm7 -> Am7)."""
    n_samples = int(math.ceil(duration_sec * sr))
    t = np.linspace(0.0, duration_sec, n_samples, endpoint=False, dtype=np.float32)
    chords = [
        [73.42, 110.00, 146.83, 174.61, 220.00, 329.63],
        [58.27, 87.31, 116.54, 146.83, 174.61, 220.00],
        [43.65, 65.41, 87.31, 110.00, 130.81, 164.81],
        [65.41, 98.00, 130.81, 164.81, 196.00, 293.66],
        [49.00, 73.42, 98.00, 116.54, 146.83, 174.61],
        [55.00, 82.41, 110.00, 130.81, 164.81, 196.00],
    ]
    chord_len = 8.0
    left = np.zeros(n_samples, dtype=np.float32)
    right = np.zeros(n_samples, dtype=np.float32)

    num_steps = int(math.ceil(duration_sec / chord_len)) + 1
    weights = [0.32, 0.24, 0.20, 0.16, 0.12, 0.08]
    for step in range(num_steps):
        freqs = chords[step % len(chords)]
        center_t = step * chord_len
        i0 = int(max(0.0, center_t - chord_len) * sr)
        i1 = int(min(duration_sec, center_t + chord_len) * sr)
        if i1 <= i0:
            continue
        seg_t = t[i0:i1]
        env = 0.5 * (1.0 + np.cos(math.pi * np.clip((seg_t - center_t) / chord_len, -1.0, 1.0)))
        seg_l = np.zeros_like(seg_t)
        seg_r = np.zeros_like(seg_t)
        for v_i, (f, w) in enumerate(zip(freqs, weights)):
            det = 1.0012 if (v_i % 2 == 0) else 0.9988
            ph_l = 2.0 * np.pi * f * seg_t
            ph_r = 2.0 * np.pi * (f * det) * seg_t
            seg_l += w * (np.sin(ph_l) + 0.20 * np.sin(2.0 * ph_l + 0.4))
            seg_r += w * (np.sin(ph_r + 0.3) + 0.20 * np.sin(2.0 * ph_r + 0.8))
        left[i0:i1] += env * seg_l
        right[i0:i1] += env * seg_r

    # Gentle fade-in (1.8s) and fade-out (2.5s)
    fi = min(n_samples, int(1.8 * sr))
    fo = min(n_samples, int(2.5 * sr))
    if fi > 0:
        ramp = np.linspace(0.0, 1.0, fi, dtype=np.float32)
        left[:fi] *= ramp
        right[:fi] *= ramp
    if fo > 0:
        ramp = np.linspace(1.0, 0.0, fo, dtype=np.float32)
        left[-fo:] *= ramp
        right[-fo:] *= ramp

    peak = max(float(np.max(np.abs(left))), float(np.max(np.abs(right))), 1e-6)
    left = (left / peak) * 0.82
    right = (right / peak) * 0.82

    stereo = np.empty((n_samples, 2), dtype=np.int16)
    stereo[:, 0] = np.clip(left * 32767.0, -32768, 32767).astype(np.int16)
    stereo[:, 1] = np.clip(right * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(str(out_wav), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(stereo.tobytes())


def render_segment_mp4(job: dict) -> Path:
    """
    Renders one segment MP4:
    - Applies smooth Ken Burns zoom/pan to clean scene image (except Title/Ending cards which use ultra-subtle static/gentle push)
    - Overlays rock-steady RGBA subtitle PNG on top
    - Muxes segment WAV audio
    """
    bg_png: Path = job["bg_png"]
    ov_png: Path = job["ov_png"]
    wav_path: Path = job["wav_path"]
    out_mp4: Path = job["out_mp4"]
    dur: float = job["dur"]
    z0: float = job["z0"]
    z1: float = job["z1"]
    pan_mode: int = job["pan_mode"]
    fade_in: bool = job["fade_in"]
    fade_out: bool = job["fade_out"]
    is_bookend: bool = job["is_bookend"]

    frames = max(12, int(round(dur * FPS)))

    if is_bookend:
        # Keep title/ending card crisp and centered without cropping baked-in typography
        vf_bg = f"[0:v]loop=loop=-1:size=1:start=0,scale={VIDEO_W}:{VIDEO_H}:flags=lanczos,fps={FPS},trim=duration={dur:.3f},setpts=PTS-STARTPTS"
    else:
        # Smooth linear zoom z0 -> z1 on single upscaled still image (NO -loop 1 before zoompan so it renders in 0.2s!)
        z_expr = f"{z0:.4f}+({z1 - z0:.4f})*(on/{max(1, frames - 1)})"
        if pan_mode == 0:
            x_expr = "iw/2-(iw/zoom/2)"
            y_expr = "ih/2-(ih/zoom/2)"
        elif pan_mode == 1:
            x_expr = f"(iw-iw/zoom)*(0.35+0.30*(on/{max(1, frames - 1)}))"
            y_expr = "ih/2-(ih/zoom/2)"
        else:
            x_expr = f"(iw-iw/zoom)*(0.65-0.30*(on/{max(1, frames - 1)}))"
            y_expr = "ih/2-(ih/zoom/2)"

        vf_bg = (
            f"[0:v]scale=1920:1080:flags=lanczos,"
            f"zoompan=z='{z_expr}':x='{x_expr}':y='{y_expr}':d={frames}:s={VIDEO_W}x{VIDEO_H}:fps={FPS},"
            f"trim=duration={dur:.3f},setpts=PTS-STARTPTS"
        )

    fade_filters = []
    if fade_in:
        fade_filters.append("fade=t=in:st=0:d=0.35")
    if fade_out and dur > 0.6:
        fade_filters.append(f"fade=t=out:st={max(0.0, dur - 0.35):.3f}:d=0.35")
    fade_chain = ("," + ",".join(fade_filters)) if fade_filters else ""

    filter_complex = (
        f"{vf_bg}[bg];"
        f"[bg][1:v]overlay=0:0:shortest=1:format=auto{fade_chain},format=yuv420p[v]"
    )

    subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(bg_png),
            "-loop", "1", "-framerate", str(FPS), "-i", str(ov_png),
            "-i", str(wav_path),
            "-filter_complex", filter_complex,
            "-map", "[v]", "-map", "2:a",
            "-t", f"{dur:.3f}",
            "-c:v", "h264_videotoolbox", "-b:v", "2800k", "-pix_fmt", "yuv420p",
            "-c:a", "pcm_s16le",
            str(out_mp4),
        ],
        check=True,
    )
    return out_mp4


async def build_single_episode_video(ep_num: int, lang: str, out_dirs: list[Path]) -> tuple[Path, float, float]:
    t_start = time.time()
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    book_idx = json.loads(BOOK_INDEX_PATH.read_text(encoding="utf-8"))
    ep_meta_map = {e["episodeNumber"]: e for e in book_idx.get("episodes", [])}

    ep_data = manifest[str(ep_num)]
    ep_meta = ep_meta_map.get(ep_num, {})
    title_ko = ep_meta.get("titleKo") or ep_data.get("episodeTitleKo") or f"제{ep_num}화"
    title_en = ep_data.get("episodeTitle") or f"Episode {ep_num:02d}"

    work_dir = Path(f"/tmp/snshero_slideshow_ep{ep_num:02d}_{lang}")
    if work_dir.exists():
        shutil.rmtree(work_dir)
    work_dir.mkdir(parents=True, exist_ok=True)

    images_info = ep_data["images"]

    # 1. Extract all voice/subtitle segments across the episode
    scene_bundles = []
    for item in images_info:
        sc_idx = item["index"]
        sc_type = item.get("type", "scene")
        img_path = PROJECT_ROOT / "public" / (item.get("localArtUrl") or item.get("imageUrl")).lstrip("/")
        segs = extract_scene_voice_segments(ep_num, title_ko, title_en, item, lang)
        if not segs:
            continue
        scene_bundles.append({
            "sc_idx": sc_idx,
            "sc_type": sc_type,
            "img_path": img_path,
            "segs": segs,
        })

    # 2. Synthesize all TTS audio clips concurrently (semaphore=8)
    sem = asyncio.Semaphore(8)
    tts_tasks = []
    flat_segs = []

    for b_i, bundle in enumerate(scene_bundles):
        n_segs = len(bundle["segs"])
        for s_i, seg in enumerate(bundle["segs"]):
            seg_id = f"s{bundle['sc_idx']:02d}_{s_i:02d}"
            wav_path = work_dir / f"{seg_id}.wav"
            voice, rate, pitch, volume = select_voice_and_prosody(lang, seg["archetype"], seg["mood"])
            if seg["role"] == "title":
                post_pad = 0.75
            elif seg["role"] == "ending":
                post_pad = 1.00
            elif s_i == n_segs - 1:
                post_pad = 0.26
            else:
                post_pad = 0.14

            seg_record = {
                **seg,
                "seg_id": seg_id,
                "sc_idx": bundle["sc_idx"],
                "sc_type": bundle["sc_type"],
                "img_path": bundle["img_path"],
                "sub_idx": s_i,
                "sub_count": n_segs,
                "wav_path": wav_path,
                "voice": voice,
            }
            flat_segs.append(seg_record)
            tts_tasks.append(
                synthesize_tts_segment(seg["tts_text"], voice, rate, pitch, volume, wav_path, post_pad, sem)
            )

    print(f"[EP{ep_num:02d}-{lang.upper()}] Synthesizing {len(flat_segs)} multi-voice TTS clips...", flush=True)
    durations = await asyncio.gather(*tts_tasks)
    for rec, dur in zip(flat_segs, durations):
        rec["dur"] = dur

    # 3. Prepare clean PNG scene images + transparent subtitle overlays, and render MP4 clips in parallel
    bg_png_cache: dict[int, Path] = {}
    render_jobs = []

    for r_i, rec in enumerate(flat_segs):
        sc_idx = rec["sc_idx"]
        if sc_idx not in bg_png_cache:
            bg_png = work_dir / f"bg_{sc_idx:02d}.png"
            with Image.open(rec["img_path"]) as im:
                im.convert("RGB").resize((VIDEO_W, VIDEO_H), Image.Resampling.LANCZOS).save(bg_png, "PNG")
            bg_png_cache[sc_idx] = bg_png

        ov_png = work_dir / f"ov_{rec['seg_id']}.png"
        render_subtitle_overlay_png(
            ov_png,
            lang=lang,
            role=rec["role"],
            speaker=rec["speaker"],
            mood=rec["mood"],
            subtitle_text=rec["subtitle_text"],
        )

        # Continuous zoom progression across sub-segments of the same scene
        zoom_in_dir = (sc_idx % 2 == 1)
        z_start_scene = 1.005 if zoom_in_dir else 1.075
        z_end_scene = 1.075 if zoom_in_dir else 1.005
        f0 = rec["sub_idx"] / float(rec["sub_count"])
        f1 = (rec["sub_idx"] + 1) / float(rec["sub_count"])
        z0 = z_start_scene + (z_end_scene - z_start_scene) * f0
        z1 = z_start_scene + (z_end_scene - z_start_scene) * f1

        render_jobs.append({
            "bg_png": bg_png_cache[sc_idx],
            "ov_png": ov_png,
            "wav_path": rec["wav_path"],
            "out_mp4": work_dir / f"clip_{r_i:03d}.mp4",
            "dur": rec["dur"],
            "z0": z0,
            "z1": z1,
            "pan_mode": sc_idx % 3,
            "fade_in": rec["sub_idx"] == 0,
            "fade_out": rec["sub_idx"] == rec["sub_count"] - 1,
            "is_bookend": rec["role"] in ("title", "ending"),
        })

    print(f"[EP{ep_num:02d}-{lang.upper()}] Rendering {len(render_jobs)} HD Ken Burns slideshow clips...", flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        clip_paths = list(pool.map(render_segment_mp4, render_jobs))

    # 4. Concatenate clips + synthesize & mix soft orchestral BGM (-19dB)
    concat_txt = work_dir / "concat.txt"
    concat_txt.write_text("\n".join(f"file '{p}'" for p in clip_paths) + "\n", encoding="utf-8")

    raw_concat = work_dir / "concat_raw.mp4"
    subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(concat_txt),
            "-c:v", "copy", "-c:a", "pcm_s16le",
            str(raw_concat),
        ],
        check=True,
    )

    total_dur = probe_duration(raw_concat)
    bgm_wav = work_dir / "bgm.wav"
    generate_ambient_bgm_wav(bgm_wav, total_dur + 1.0)

    clean_ko = re.sub(r"\s+", " ", re.sub(r"[^\w가-힣\s]+", " ", title_ko)).strip()
    clean_en = re.sub(r"\s+", " ", re.sub(r"[^\w\s]+", " ", title_en)).strip()
    if lang == "ko":
        out_name = f"{ep_num:02d}화 {clean_ko} (한국어 더빙).mp4"
    else:
        out_name = f"EP{ep_num:02d} {clean_en} (English Dub).mp4"

    final_tmp = work_dir / out_name
    subprocess.run(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-i", str(raw_concat),
            "-i", str(bgm_wav),
            "-filter_complex",
            "[0:a]volume=1.08[va];[1:a]volume=0.11[bgm];[va][bgm]amix=inputs=2:duration=first:dropout_transition=0[aout]",
            "-map", "0:v", "-map", "[aout]",
            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            "-movflags", "+faststart",
            str(final_tmp),
        ],
        check=True,
    )

    first_dst: Path | None = None
    for od in out_dirs:
        sub_dir = od / ("ko" if lang == "ko" else "en")
        sub_dir.mkdir(parents=True, exist_ok=True)
        dst = sub_dir / out_name
        shutil.copy2(final_tmp, dst)
        if first_dst is None:
            first_dst = dst

    shutil.rmtree(work_dir, ignore_errors=True)
    assert first_dst is not None
    size_mb = round(first_dst.stat().st_size / (1024 * 1024), 2)
    elapsed = round(time.time() - t_start, 1)
    print(
        f"✅ [EP{ep_num:02d}-{lang.upper()}] Completed '{out_name}' | "
        f"Duration: {total_dur:.1f}s ({int(total_dur//60)}m {int(total_dur%60):02d}s) | Size: {size_mb} MB | Built in {elapsed}s",
        flush=True,
    )
    return first_dst, total_dur, size_mb


async def async_main():
    ep_arg = sys.argv[1] if len(sys.argv) > 1 else "1"
    lang_arg = sys.argv[2].lower() if len(sys.argv) > 2 else "both"
    langs = ["ko", "en"] if lang_arg == "both" else [lang_arg]

    out_dirs = [
        PROJECT_ROOT / "exports/webtoon_videos",
        Path(os.path.expanduser("~/Downloads/웹툰슬라이드쇼_동영상")),
        PROJECT_ROOT / "dist/naver-webtoon/videos",
    ]

    eps = list(range(1, 41)) if ep_arg == "all" else [int(ep_arg)]
    for ep in eps:
        for lg in langs:
            await build_single_episode_video(ep, lg, out_dirs)


if __name__ == "__main__":
    asyncio.run(async_main())
