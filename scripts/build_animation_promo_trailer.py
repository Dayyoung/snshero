#!/usr/bin/env python3
"""
Build an official 1m 45s (~105s) Animation Promotional Trailer
(`SNSHero_Animation_40EP_CardGame_Promo_Ad.mp4`) from the 40 animation episodes
(`public/video/animation/SNSHero.com_E1..E40_*.mp4`) and hero card assets (`public/seat/*.png`),
promoting both the 40-Episode Animation Series and the SNSHero.com AI Web Card Battle game.
"""

import asyncio
import math
import shutil
import subprocess
import time
import wave
from pathlib import Path
from typing import List, Tuple

import edge_tts
import numpy as np
from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
ANIM_DIR = PROJECT_ROOT / "public" / "video" / "animation"
SEAT_DIR = PROJECT_ROOT / "public" / "seat"
WORK_DIR = Path("/tmp/snshero_anim_promo_work")

OUT_DOWNLOADS_MP4 = Path("/Users/dayyoung/Downloads/SNSHero_Animation_40EP_CardGame_Promo_Ad.mp4")
OUT_PUBLIC_MP4 = PROJECT_ROOT / "public" / "video" / "SNSHero_Animation_Promo_Trailer.mp4"

FONT_SERIF_BOLD = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
FONT_KR = "/System/Library/Fonts/AppleSDGothicNeo.ttc"

WORLDBEAT_MP3 = PROJECT_ROOT / "public" / "mixkit-games-worldbeat-466.mp3"
SFX_START_MP3 = PROJECT_ROOT / "public" / "gwent" / "sfx" / "game_start.mp3"
SFX_HORN_MP3 = PROJECT_ROOT / "public" / "gwent" / "sfx" / "horn.mp3"
SFX_WIN_MP3 = PROJECT_ROOT / "public" / "gwent" / "sfx" / "round_win.mp3"

# Korean energetic narrator voice for Korean & global YouTube ad promotion
VOICE_KO = "ko-KR-InJoonNeural"


def log(msg: str) -> None:
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def get_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def probe_duration(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ]
    ).decode().strip()
    return float(out)


def find_anim_ep(ep_num: int) -> Path:
    matches = sorted(ANIM_DIR.glob(f"SNSHero.com_E{ep_num}_*.mp4"))
    if not matches:
        raise FileNotFoundError(f"Could not find animation MP4 for EP{ep_num} in {ANIM_DIR}")
    return matches[0]


def draw_centered_text(
    draw: ImageDraw.ImageDraw,
    y: int,
    text: str,
    font: ImageFont.FreeTypeFont,
    fill: Tuple[int, int, int],
    width: int = 1280,
) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (width - tw) // 2
    draw.text((x, y), text, font=font, fill=fill)
    return th


def render_title_card(
    lines: List[Tuple[str, int, Tuple[int, int, int], bool]],
    out_mp4: Path,
    duration: float,
    fade_in: float = 0.35,
    fade_out: float = 0.35,
) -> None:
    """Renders a 1280x720 24fps dark/gold promotional title card."""
    img = Image.new("RGB", (1280, 720), (9, 13, 22))
    draw = ImageDraw.Draw(img)

    # Outer double border & top/bottom accent lines
    draw.rectangle([28, 28, 1252, 692], outline=(90, 75, 45), width=2)
    draw.rectangle([36, 36, 1244, 684], outline=(195, 165, 100), width=1)
    draw.line([(160, 100), (1120, 100)], fill=(150, 125, 75), width=1)
    draw.line([(160, 620), (1120, 620)], fill=(150, 125, 75), width=1)

    spacing = 18
    rendered = []
    total_h = 0
    for text, fsize, color, is_kr in lines:
        if not text:
            rendered.append((text, None, color, 18))
            total_h += 18
            continue
        fpath = FONT_KR if is_kr else FONT_SERIF_BOLD
        font = get_font(fpath, fsize)
        bbox = draw.textbbox((0, 0), text, font=font)
        th = bbox[3] - bbox[1]
        rendered.append((text, font, color, th))
        total_h += th + spacing

    cur_y = max(90, (720 - total_h) // 2)
    for text, font, color, th in rendered:
        if text and font is not None:
            draw_centered_text(draw, cur_y, text, font, color)
        cur_y += th + spacing

    png_path = out_mp4.with_suffix(".png")
    img.save(png_path)

    fade_out_st = max(0.0, duration - fade_out)
    vf = f"fade=t=in:st=0:d={fade_in:.2f},fade=t=out:st={fade_out_st:.2f}:d={fade_out:.2f},format=yuv420p"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loop",
            "1",
            "-t",
            f"{duration:.2f}",
            "-r",
            "24",
            "-i",
            str(png_path),
            "-vf",
            vf,
            "-c:v",
            "libx264",
            "-profile:v",
            "high",
            "-level:v",
            "3.1",
            "-pix_fmt",
            "yuv420p",
            "-r",
            "24",
            "-video_track_timescale",
            "12288",
            "-crf",
            "18",
            "-an",
            str(out_mp4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def render_hero_card_showcase(
    hero_specs: List[Tuple[str, str, str, str]],
    header_ko: str,
    header_en: str,
    footer_ko: str,
    out_mp4: Path,
    duration: float,
    fade_in: float = 0.35,
    fade_out: float = 0.35,
) -> None:
    """
    Renders a 1280x720 showcase of 5 SSR Hero Cards from `public/seat/*.png`
    with golden frames, power ratings, and SNSHero.com promotional callouts.
    """
    img = Image.new("RGB", (1280, 720), (11, 15, 26))
    draw = ImageDraw.Draw(img)

    # Outer frame
    draw.rectangle([24, 24, 1256, 696], outline=(195, 165, 100), width=2)

    # Top header
    f_en = get_font(FONT_SERIF_BOLD, 22)
    f_ko = get_font(FONT_KR, 34)
    draw_centered_text(draw, 46, header_en, f_en, (215, 185, 115))
    draw_centered_text(draw, 80, header_ko, f_ko, (255, 250, 240))

    # Draw 5 hero cards across the center
    card_w = 204
    card_h = 370
    gap = 24
    total_cards_w = 5 * card_w + 4 * gap
    start_x = (1280 - total_cards_w) // 2
    card_y = 155

    f_card_name = get_font(FONT_KR, 20)
    f_card_sub = get_font(FONT_SERIF_BOLD, 14)
    f_card_pwr = get_font(FONT_SERIF_BOLD, 18)

    for idx, (png_name, name_ko, elem_label, pwr_label) in enumerate(hero_specs):
        cx = start_x + idx * (card_w + gap)
        cy = card_y

        # Card background & gold SSR border
        draw.rectangle([cx, cy, cx + card_w, cy + card_h], fill=(22, 26, 38), outline=(225, 190, 110), width=3)
        draw.rectangle([cx + 6, cy + 6, cx + card_w - 6, cy + card_h - 6], outline=(110, 90, 55), width=1)

        # Top SSR badge bar
        draw.rectangle([cx + 8, cy + 8, cx + card_w - 8, cy + 36], fill=(42, 34, 20))
        draw.text((cx + 14, cy + 12), "SSR LEGEND", font=f_card_sub, fill=(245, 210, 120))
        draw.text((cx + card_w - 68, cy + 11), pwr_label, font=f_card_pwr, fill=(255, 240, 180))

        # Portrait image
        seat_path = SEAT_DIR / png_name
        if seat_path.exists():
            try:
                p_img = Image.open(seat_path).convert("RGBA")
                p_img = p_img.resize((card_w - 20, 245), Image.Resampling.LANCZOS)
                bg_patch = Image.new("RGBA", p_img.size, (18, 22, 32, 255))
                merged = Image.alpha_composite(bg_patch, p_img).convert("RGB")
                img.paste(merged, (cx + 10, cy + 42))
            except Exception:
                pass

        # Card bottom nameplate
        draw.rectangle([cx + 8, cy + 294, cx + card_w - 8, cy + card_h - 8], fill=(16, 19, 28))
        bbox_n = draw.textbbox((0, 0), name_ko, font=f_card_name)
        nw = bbox_n[2] - bbox_n[0]
        draw.text((cx + (card_w - nw) // 2, cy + 302), name_ko, font=f_card_name, fill=(255, 250, 240))

        bbox_e = draw.textbbox((0, 0), elem_label, font=f_card_sub)
        ew = bbox_e[2] - bbox_e[0]
        draw.text((cx + (card_w - ew) // 2, cy + 334), elem_label, font=f_card_sub, fill=(195, 175, 130))

    # Bottom banner bar
    draw.rectangle([80, 565, 1200, 650], fill=(26, 22, 18), outline=(205, 175, 105), width=2)
    f_foot = get_font(FONT_KR, 26)
    draw_centered_text(draw, 592, footer_ko, f_foot, (255, 235, 175))

    png_path = out_mp4.with_suffix(".png")
    img.save(png_path)

    fade_out_st = max(0.0, duration - fade_out)
    vf = f"fade=t=in:st=0:d={fade_in:.2f},fade=t=out:st={fade_out_st:.2f}:d={fade_out:.2f},format=yuv420p"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loop",
            "1",
            "-t",
            f"{duration:.2f}",
            "-r",
            "24",
            "-i",
            str(png_path),
            "-vf",
            vf,
            "-c:v",
            "libx264",
            "-profile:v",
            "high",
            "-level:v",
            "3.1",
            "-pix_fmt",
            "yuv420p",
            "-r",
            "24",
            "-video_track_timescale",
            "12288",
            "-crf",
            "18",
            "-an",
            str(out_mp4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def extract_animation_cut(
    ep_num: int,
    start_sec: float,
    duration: float,
    ep_label_ko: str,
    ep_label_en: str,
    out_mp4: Path,
    fade_in: float = 0.18,
    fade_out: float = 0.18,
) -> None:
    """
    Extracts an action clip from `public/video/animation/SNSHero.com_E{ep_num}_*.mp4` (800x560)
    and composites it onto a 1280x720 HD frame with a top/bottom promotional HUD overlay.
    """
    src_mp4 = find_anim_ep(ep_num)

    # Create a 1280x720 RGBA overlay PNG with top & bottom HUD bars and a transparent center window
    overlay = Image.new("RGBA", (1280, 720), (9, 13, 22, 255))
    draw = ImageDraw.Draw(overlay)

    # Transparent center viewport (1028x580 at x=126, y=56) where the scaled animation video will show through
    vp_x, vp_y, vp_w, vp_h = 126, 56, 1028, 576
    draw.rectangle([vp_x, vp_y, vp_x + vp_w, vp_y + vp_h], fill=(0, 0, 0, 0))
    draw.rectangle([vp_x - 2, vp_y - 2, vp_x + vp_w + 2, vp_y + vp_h + 2], outline=(205, 175, 105, 255), width=2)

    # Top bar text
    f_top = get_font(FONT_KR, 20)
    f_top_en = get_font(FONT_SERIF_BOLD, 18)
    draw.text((128, 18), "SNSHero.com 공식 애니메이션 40화 전편 무료 스트리밍", font=f_top, fill=(245, 220, 155, 255))
    draw.text((885, 20), "WATCH & EARN +100 SNS", font=f_top_en, fill=(255, 245, 210, 255))

    # Bottom bar text (Episode title + CTA)
    f_bot_ko = get_font(FONT_KR, 24)
    f_bot_en = get_font(FONT_SERIF_BOLD, 18)
    draw.text((128, 646), f"EP.{ep_num:02d}  {ep_label_ko}", font=f_bot_ko, fill=(255, 252, 245, 255))
    draw.text((128, 680), ep_label_en, font=f_bot_en, fill=(195, 175, 135, 255))

    # Right bottom CTA pill
    draw.rectangle([865, 648, 1154, 696], fill=(205, 170, 95, 255))
    f_cta = get_font(FONT_KR, 20)
    draw.text((888, 660), "🎮 무료 플레이: snshero.com", font=f_cta, fill=(12, 14, 22, 255))

    ov_png = out_mp4.with_suffix(".ov.png")
    overlay.save(ov_png)

    fade_out_st = max(0.0, duration - fade_out)
    # Scale 800x560 -> 1028x720, crop to 1028x576, pad to 1280x720 at (126, 56), overlay HUD frame
    filter_complex = (
        f"[0:v]scale=1028:720:flags=lanczos,crop=1028:576:0:72,pad=1280:720:126:56:color=#090d16[bg];"
        f"[bg][1:v]overlay=0:0,"
        f"fade=t=in:st=0:d={fade_in:.2f},fade=t=out:st={fade_out_st:.2f}:d={fade_out:.2f},format=yuv420p[vout]"
    )

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            f"{start_sec:.2f}",
            "-t",
            f"{duration:.2f}",
            "-i",
            str(src_mp4),
            "-loop",
            "1",
            "-t",
            f"{duration:.2f}",
            "-i",
            str(ov_png),
            "-filter_complex",
            filter_complex,
            "-map",
            "[vout]",
            "-c:v",
            "libx264",
            "-profile:v",
            "high",
            "-level:v",
            "3.1",
            "-pix_fmt",
            "yuv420p",
            "-r",
            "24",
            "-video_track_timescale",
            "12288",
            "-crf",
            "18",
            "-an",
            "-sn",
            str(out_mp4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def build_upbeat_bgm_wav(
    out_wav: Path,
    vo_windows: List[Tuple[float, float]],
    duration_sec: float,
) -> None:
    raw_loop_wav = WORK_DIR / "worldbeat_looped_raw.wav"
    fade_out_st = max(0.0, duration_sec - 2.5)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(WORLDBEAT_MP3),
            "-i",
            str(WORLDBEAT_MP3),
            "-filter_complex",
            f"[0:a][1:a]acrossfade=d=4.0:c1=tri:c2=tri,afade=t=in:st=0:d=0.6,afade=t=out:st={fade_out_st:.2f}:d=2.5[aout]",
            "-map",
            "[aout]",
            "-ar",
            "48000",
            "-ac",
            "2",
            "-t",
            f"{duration_sec:.2f}",
            str(raw_loop_wav),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    with wave.open(str(raw_loop_wav), "rb") as wf:
        sr = wf.getframerate()
        n_frames = wf.getnframes()
        raw_bytes = wf.readframes(n_frames)

    samples = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32).reshape(-1, 2) / 32768.0
    t = np.arange(samples.shape[0], dtype=np.float32) / float(sr)

    gain = np.full_like(t, 0.70)
    for vo_start, vo_end in vo_windows:
        ramp = 0.35
        mask_full = (t >= vo_start) & (t <= vo_end)
        gain[mask_full] = 0.30
        mask_in = (t >= vo_start - ramp) & (t < vo_start)
        if np.any(mask_in):
            u = (t[mask_in] - (vo_start - ramp)) / ramp
            gain[mask_in] = np.minimum(gain[mask_in], 0.70 - (0.70 - 0.30) * 0.5 * (1.0 - np.cos(math.pi * u)))
        mask_out = (t > vo_end) & (t <= vo_end + ramp)
        if np.any(mask_out):
            u = (t[mask_out] - vo_end) / ramp
            gain[mask_out] = np.minimum(gain[mask_out], 0.30 + (0.70 - 0.30) * 0.5 * (1.0 - np.cos(math.pi * u)))

    samples[:, 0] *= gain
    samples[:, 1] *= gain

    out_pcm = np.clip(samples * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(str(out_wav), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(out_pcm.tobytes())


async def synthesize_vo_segment(text: str, out_mp3: Path, rate: str = "+6%", pitch: str = "+0Hz") -> float:
    out_mp3.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(5):
        try:
            comm = edge_tts.Communicate(text, voice=VOICE_KO, rate=rate, pitch=pitch)
            await comm.save(str(out_mp3))
            if out_mp3.exists() and out_mp3.stat().st_size > 1000:
                return probe_duration(out_mp3)
        except Exception:
            await asyncio.sleep(1.0 * (attempt + 1))
    raise RuntimeError(f"Failed to synthesize VO: {text[:40]}")


async def main() -> None:
    t0 = time.time()
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    clips_dir = WORK_DIR / "clips"
    clips_dir.mkdir(parents=True, exist_ok=True)

    # Timeline for ~105s (1m 45s) Official Animation 40-Episode & SNSHero.com Card Battle Promo Ad
    timeline = [
        # === ACT I: HOOK & OPENING (0.0s .. 22.2s) ===
        (
            "card",
            [
                ("S N S H E R O . C O M   O F F I C I A L   A N I M A T I O N", 22, (205, 175, 110), False),
                ("", 0, (0, 0, 0), False),
                ("전 40화 판타지 애니메이션 × AI 웹 카드 배틀", 42, (255, 250, 240), True),
                ("카단과 아케인의 메아리 · 지금 무료 스트리밍 & 즉시 보상!", 26, (195, 195, 205), True),
            ],
            3.2,
        ),
        ("anim", 1, 28.0, 3.2, "눈보라 아래 두 서약", "Two Vows Beneath the Blizzard"),
        ("anim", 2, 35.0, 3.2, "일곱 추적자의 맹세", "Oath of the Seven Pursuers"),
        ("anim", 3, 42.0, 3.1, "안개 절벽의 피", "Blood on the Mist Cliff"),
        ("anim", 5, 38.0, 3.1, "폭우 속의 유령", "Phantom in the Downpour"),
        ("anim", 6, 48.0, 3.2, "별을 호흡하는 법", "The Art of Breathing Stars"),
        ("anim", 8, 52.0, 3.2, "붉은 갈기의 기수", "Rider of the Crimson Mane"),

        # === ACT II: 40-EPISODE SAGA EXPANSION (22.2s .. 44.4s) ===
        (
            "card",
            [
                ("40 EPISODES OF EPIC FANTASY CHRONICLE", 28, (215, 185, 115), False),
                ("", 0, (0, 0, 0), False),
                ("매 화 시청할 때마다 +100 SNS 게임 보상 즉시 지급!", 38, (255, 250, 240), True),
                ("유튜브 전체 재생목록 감상 시 +300 SNS 추가 보너스!", 26, (190, 220, 175), True),
            ],
            3.2,
        ),
        ("anim", 10, 45.0, 3.1, "불꽃 궁정의 포로", "Prisoner of the Flame Court"),
        ("anim", 11, 40.0, 3.1, "기억을 깨우는 단검", "The Dagger That Wakes Memory"),
        ("anim", 13, 50.0, 3.2, "녹옥 지팡이의 주인", "Master of the Jade Staff"),
        ("anim", 18, 44.0, 3.2, "검은 성전의 비밀", "Secret of the Black Sanctum"),
        ("anim", 20, 55.0, 3.2, "꽃배를 삼킨 파도", "The Wave That Swallowed the Flower Ship"),
        ("anim", 25, 48.0, 3.2, "거짓 혼례의 밤", "Night of the False Wedding"),

        # === ACT III: CLIMAX OF THE 40 EPISODES (44.4s .. 66.6s) ===
        (
            "card",
            [
                ("FROM ANIMATION TO LIVE TACTICAL BATTLE", 28, (215, 185, 115), False),
                ("", 0, (0, 0, 0), False),
                ("애니메이션 속 110명의 영웅들이 카드로 깨어난다!", 40, (255, 250, 240), True),
                ("설치 0초 · 가입 0초 · 웹 브라우저에서 1초 만에 바로 플레이", 26, (195, 195, 205), True),
            ],
            3.2,
        ),
        ("anim", 28, 42.0, 3.1, "녹옥 의회의 반란", "Revolt of the Jade Council"),
        ("anim", 31, 46.0, 3.1, "모든 것을 건 손", "The Hand That Wagered Everything"),
        ("anim", 34, 50.0, 3.2, "무너진 바람섬", "The Fallen Wind Isle"),
        ("anim", 37, 54.0, 3.2, "정복왕의 전쟁", "War of the Conqueror King"),
        ("anim", 39, 60.0, 3.2, "지켜야 할 세계", "The World Worth Protecting"),
        ("anim", 40, 45.0, 3.2, "영웅이라 불리지 않는 자", "One Who Is Not Called a Hero"),

        # === ACT IV: SNSHERO.COM CARD BATTLE SHOWCASE (66.6s .. 86.6s) ===
        (
            "showcase",
            [
                ("Kadan.png", "카단 (Kadan)", "WIND · ASSASSIN", "PWR 98"),
                ("Celia.png", "실리아 (Celia)", "WATER · ARCHER", "PWR 95"),
                ("Ignis.png", "이그니스 (Ignis)", "FIRE · MONARCH", "PWR 97"),
                ("Aleksandar.png", "알렉산다르", "EARTH · PALADIN", "PWR 96"),
                ("Balian.png", "발리안 (Balian)", "HUMAN · LANCER", "PWR 94"),
            ],
            "나만의 5인 전설 영웅 덱을 편성하고 3x3 전장을 지배하라!",
            "SNSHERO.COM — 3x3 TACTICAL AI CARD BATTLE",
            "⚡ 실시간 DDA AI 랭킹 대전 · 속성 공명 시너지 · 소울 버스트 각성",
            6.5,
        ),
        (
            "showcase",
            [
                ("Bahamut.png", "바하무트", "FIRE · DRAGON", "PWR 99"),
                ("Aqualord.png", "아쿠아로드", "WATER · LORD", "PWR 96"),
                ("Death_Knight_Artus.png", "데스나이트 아서스", "DARK · KNIGHT", "PWR 97"),
                ("Aila_the_Demon_Hunter.png", "악마사냥꾼 아일라", "WIND · HUNTER", "PWR 95"),
                ("Colossus.png", "거신 콜로서스", "EARTH · TITAN", "PWR 96"),
            ],
            "110종 전설 영웅 카드 수집 & 110종 모바일 아케이드 미션 게임!",
            "COLLECT 110+ HERO CARDS & PLAY 110 MINIGAMES",
            "🎁 지금 접속 시 1,000 SNS 정착금 + 전설(SSR) 영웅 카드 즉시 무료 지급!",
            6.5,
        ),
        ("anim", 39, 95.0, 3.5, "최종 결전: 지켜야 할 세계", "Final Strike: The World Worth Protecting"),
        ("anim", 40, 85.0, 3.5, "새로운 전설의 시작: SNSHero.com", "A New Legend Begins at SNSHero.com"),

        # === ACT V: GRAND FINALE & CALL TO ACTION (86.6s .. 104.6s) ===
        (
            "card",
            [
                ("WATCH 40 ANIMATION EPISODES   ×   PLAY THE CARD GAME", 24, (215, 190, 130), False),
                ("", 0, (0, 0, 0), False),
                ("애니메이션 40화 전편 무료 감상 + 원클릭 AI 카드 배틀", 38, (255, 250, 240), True),
                ("회차별 시청 보상 +100 SNS · 신규 접속 +1,000 SNS 즉시 지급", 26, (190, 225, 175), True),
            ],
            6.0,
        ),
        (
            "card",
            [
                ("START YOUR LEGEND RIGHT NOW!", 26, (205, 175, 115), False),
                ("", 0, (0, 0, 0), False),
                ("Visit SNSHero.com!", 68, (255, 252, 240), False),
                ("", 0, (0, 0, 0), False),
                ("https://snshero.com/movie", 34, (235, 205, 135), False),
                ("지금 검색창에 SNSHero.com 을 입력하세요!", 28, (200, 200, 210), True),
            ],
            8.0,
        ),
    ]

    log(f"Rendering {len(timeline)} animation promo segments...")
    segment_mp4s: List[Path] = []
    cur_t = 0.0

    for idx, item in enumerate(timeline, start=1):
        seg_mp4 = clips_dir / f"seg_{idx:03d}.mp4"
        kind = item[0]
        if kind == "card":
            _, lines, dur = item
            render_title_card(lines, seg_mp4, duration=dur)
            cur_t += dur
        elif kind == "showcase":
            _, hero_specs, h_ko, h_en, f_ko, dur = item
            render_hero_card_showcase(hero_specs, h_ko, h_en, f_ko, seg_mp4, duration=dur)
            cur_t += dur
        else:
            _, ep_num, st_sec, dur, label_ko, label_en = item
            extract_animation_cut(ep_num, st_sec, dur, label_ko, label_en, seg_mp4)
            cur_t += dur
        segment_mp4s.append(seg_mp4)
        if idx % 5 == 0 or idx == len(timeline):
            log(f"  Rendered {idx}/{len(timeline)} segments (timeline at {cur_t:.1f}s)")

    concat_txt = WORK_DIR / "promo_concat.txt"
    concat_txt.write_text("\n".join(f"file '{p}'" for p in segment_mp4s) + "\n", encoding="utf-8")

    silent_mp4 = WORK_DIR / "promo_silent.mp4"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_txt),
            "-c:v",
            "copy",
            "-an",
            "-sn",
            str(silent_mp4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    total_vid_dur = probe_duration(silent_mp4)
    log(f"Silent video stream ready: {total_vid_dur:.2f}s ({int(total_vid_dur)//60}m {int(total_vid_dur)%60:02d}s)")

    # 5-Act Korean promotional voiceover timed to the 5 acts
    vo_specs = [
        (
            0.8,
            "혹독한 눈보라 속 두 자루의 은빛 단검에서 시작된 거대한 운명! "
            "총 사십 화로 펼쳐지는 판타지 대서사시, 에스엔에스 히어로 공식 애니메이션 시리즈가 지금 공개됩니다!",
        ),
        (
            22.8,
            "설원의 맹세부터 불꽃 궁정의 결투, 그리고 검은 성전의 비밀까지! "
            "사십 화의 애니메이션을 감상할 때마다 매 화 백 에스엔에스 게임 보상이 즉시 지급됩니다!",
        ),
        (
            45.0,
            "애니메이션 속 감동은 여기서 끝이 아닙니다! "
            "카단, 실리아, 이그니스 등 백십여 종의 전설 영웅들이 당신의 카드 덱으로 직접 깨어납니다!",
        ),
        (
            67.2,
            "설치도, 복잡한 가입도 필요 없습니다! "
            "웹 브라우저에서 단 일 초 만에 시작하는 삼대삼 전략 에이아이 카드 배틀과 백십 가지 모바일 미션 게임! "
            "지금 접속하면 천 에스엔에스 정착금과 전설 영웅 카드를 무료로 즉시 드립니다!",
        ),
        (
            87.2,
            "사십 부작 판타지 애니메이션 무료 스트리밍과 원클릭 에이아이 카드 배틀의 만남! "
            "지금 바로 에스엔에스 히어로 닷컴에 접속하세요!",
        ),
    ]

    vo_files: List[Tuple[int, Path]] = []
    vo_windows: List[Tuple[float, float]] = []
    for i, (st_sec, text) in enumerate(vo_specs, start=1):
        vo_mp3 = WORK_DIR / f"vo_act_{i}.mp3"
        vo_dur = await synthesize_vo_segment(text, vo_mp3, rate="+8%", pitch="+0Hz")
        log(f"  Act {i} VO: starts at {st_sec:.1f}s, duration {vo_dur:.2f}s (ends at {st_sec+vo_dur:.1f}s)")
        vo_files.append((int(round(st_sec * 1000)), vo_mp3))
        vo_windows.append((st_sec, st_sec + vo_dur))

    bgm_wav = WORK_DIR / "promo_bgm.wav"
    build_upbeat_bgm_wav(bgm_wav, vo_windows, duration_sec=total_vid_dur)

    fc_parts = ["[0:a]volume=1.0[bgm]"]
    mix_labels = ["[bgm]"]
    cmd_inputs = ["-t", f"{total_vid_dur:.2f}", "-i", str(bgm_wav)]
    for idx, (delay_ms, vo_mp3) in enumerate(vo_files, start=1):
        cmd_inputs.extend(["-i", str(vo_mp3)])
        lbl = f"[vo{idx}]"
        fc_parts.append(f"[{idx}:a]volume=1.55,adelay={delay_ms}|{delay_ms}{lbl}")
        mix_labels.append(lbl)

    sfx_entries = [
        (150, SFX_START_MP3, 0.45),
        (44400, SFX_HORN_MP3, 0.42),
        (66600, SFX_START_MP3, 0.45),
        (92500, SFX_WIN_MP3, 0.55),
    ]
    next_input_idx = len(vo_files) + 1
    for sfx_delay_ms, sfx_path, sfx_vol in sfx_entries:
        if sfx_path.exists():
            cmd_inputs.extend(["-i", str(sfx_path)])
            lbl = f"[sfx{next_input_idx}]"
            fc_parts.append(f"[{next_input_idx}:a]volume={sfx_vol:.2f},adelay={sfx_delay_ms}|{sfx_delay_ms}{lbl}")
            mix_labels.append(lbl)
            next_input_idx += 1

    n_in = len(mix_labels)
    fc_parts.append(
        f"{''.join(mix_labels)}amix=inputs={n_in}:duration=first:dropout_transition=0:normalize=0,"
        f"alimiter=limit=0.96[aout]"
    )
    filter_complex = ";".join(fc_parts)

    audio_m4a = WORK_DIR / "promo_audio.m4a"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            *cmd_inputs,
            "-filter_complex",
            filter_complex,
            "-map",
            "[aout]",
            "-ac",
            "2",
            "-ar",
            "48000",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-t",
            f"{total_vid_dur:.2f}",
            str(audio_m4a),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    OUT_PUBLIC_MP4.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(silent_mp4),
            "-i",
            str(audio_m4a),
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-c:v",
            "copy",
            "-c:a",
            "copy",
            "-movflags",
            "+faststart",
            str(OUT_DOWNLOADS_MP4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    shutil.copy2(OUT_DOWNLOADS_MP4, OUT_PUBLIC_MP4)

    final_dur = probe_duration(OUT_DOWNLOADS_MP4)
    size_mb = OUT_DOWNLOADS_MP4.stat().st_size / (1024 * 1024)
    log(
        f"COMPLETED Animation Promo Ad in {time.time()-t0:.1f}s -> {OUT_DOWNLOADS_MP4} "
        f"(Duration: {final_dur:.2f}s / {int(final_dur)//60}m {int(final_dur)%60:02d}s, Size: {size_mb:.1f} MB)"
    )


if __name__ == "__main__":
    asyncio.run(main())
