#!/usr/bin/env python3
"""
Generates 200 studio-mastered Korean male storyteller MP3 narrations for all 40 episodes
(5 cuts per episode) of 『눈히어로 - 카단의 여정』 plus bespoke male announcer clips for all
custom Story Mode player/boss hero names, eliminating browser robotic female speechSynthesis.
"""

import asyncio
import hashlib
import json
import re
import subprocess
import tempfile
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
STORY_VO_DIR = ROOT / "public" / "hs-assets" / "snshero-audio" / "story"
KADAN_TS = ROOT / "src" / "hearthstone" / "kadanJourneyData.ts"

# Warm, natural DragonHD Korean Male Chronicle Narrator
NARRATOR_VOICE = "ko-KR-HyunsuMultilingualNeural"
ANNOUNCER_VOICE = "ko-KR-InJoonNeural"


def master_mp3(raw_mp3: Path, out_mp3: Path, is_announcer: bool = False) -> None:
    af_chain = (
        "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-46dB:"
        "stop_periods=-1:stop_duration=0.22:stop_threshold=-46dB,"
        "highpass=f=75,"
        "equalizer=f=175:width_type=o:width=1.2:g=1.8,"
        "equalizer=f=3600:width_type=o:width=1.4:g=1.2,"
        + ("loudnorm=I=-14:TP=-1.2:LRA=7" if is_announcer else "loudnorm=I=-15.5:TP=-1.5:LRA=9")
    )
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(raw_mp3),
            "-af",
            af_chain,
            "-ar",
            "24000",
            "-ac",
            "1",
            "-b:a",
            "48k",
            str(out_mp3),
        ],
        check=True,
    )


async def synth_one(
    sem: asyncio.Semaphore,
    text: str,
    out_mp3: Path,
    voice: str,
    rate: str,
    pitch: str,
    is_announcer: bool = False,
) -> None:
    async with sem:
        for attempt in range(4):
            try:
                with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tf:
                    tmp_path = Path(tf.name)
                try:
                    comm = edge_tts.Communicate(text, voice=voice, rate=rate, pitch=pitch)
                    await comm.save(str(tmp_path))
                    master_mp3(tmp_path, out_mp3, is_announcer=is_announcer)
                    return
                finally:
                    tmp_path.unlink(missing_ok=True)
            except Exception as exc:
                if attempt == 3:
                    raise RuntimeError(f"Failed TTS for {out_mp3.name}: {exc}") from exc
                await asyncio.sleep(0.8 * (attempt + 1))


def name_hash_key(name_ko: str) -> str:
    return hashlib.sha1(name_ko.strip().encode("utf-8")).hexdigest()[:10]


async def main() -> None:
    STORY_VO_DIR.mkdir(parents=True, exist_ok=True)

    raw_ts = KADAN_TS.read_text(encoding="utf-8")
    m = re.search(
        r"export const KADAN_JOURNEY_EPISODES:\s*KadanJourneyEpisodeDef\[\]\s*=\s*(\[.*?\]);\s*\n\s*export function getJourneyEpisodeDef",
        raw_ts,
        re.S,
    )
    assert m, "Could not parse KADAN_JOURNEY_EPISODES from kadanJourneyData.ts"
    episodes = json.loads(m.group(1))

    sem = asyncio.Semaphore(14)
    tasks = []

    # 1. 40 Episodes x 5 Cuts = 200 Story Narration MP3s
    for ep_obj in episodes:
        ep_num = int(ep_obj["episode"])
        pad = f"{ep_num:02d}"
        for cut_idx, sc in enumerate(ep_obj["scenes"][:5]):
            out_path = STORY_VO_DIR / f"ep{pad}_cut{cut_idx + 1}.mp3"
            text = sc["shortCaption"].strip()
            tasks.append(
                synth_one(
                    sem,
                    text=text,
                    out_mp3=out_path,
                    voice=NARRATOR_VOICE,
                    rate="+4%",
                    pitch="-2Hz",
                    is_announcer=False,
                )
            )

    # 2. Unique Custom Hero / Boss Names for Matchup VS Announcer
    hero_names: set[str] = set()
    for ep_obj in episodes:
        p_name = ep_obj.get("playerHeroSpec", {}).get("heroNameKo")
        b_name = ep_obj.get("bossHeroSpec", {}).get("heroNameKo")
        if p_name:
            hero_names.add(p_name)
        if b_name:
            hero_names.add(b_name)

    name_map: dict[str, str] = {}
    for nm in sorted(hero_names):
        hkey = name_hash_key(nm)
        rel_url = f"/hs-assets/snshero-audio/story/hero_{hkey}.mp3"
        name_map[nm] = rel_url
        tasks.append(
            synth_one(
                sem,
                text=f"{nm}!",
                out_mp3=STORY_VO_DIR / f"hero_{hkey}.mp3",
                voice=ANNOUNCER_VOICE,
                rate="+2%",
                pitch="-4Hz",
                is_announcer=True,
            )
        )

    print(f"Synthesizing {len(tasks)} neural Korean male audio files ({len(episodes)*5} story cuts + {len(hero_names)} hero names)...")
    await asyncio.gather(*tasks)

    manifest_path = STORY_VO_DIR / "hero_name_vo_map.json"
    manifest_path.write_text(json.dumps(name_map, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Done! Generated all story narrations and {manifest_path.name} ({len(name_map)} names).")


if __name__ == "__main__":
    asyncio.run(main())
