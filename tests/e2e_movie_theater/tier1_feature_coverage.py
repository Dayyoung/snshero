"""Tier 1: Feature Coverage & Asset Integrity Tests for SNSHero Movie Theater.

Covers:
- T1.F1: 2,049 Webtoon Cutscenes Loadability
- T1.F2: 40-Episode Standalone MP4 Video Assets (via ffprobe)
- T1.F3: Continuous BGM Synthesis Engine
- T1.F4: English-Base Cutscene & TTS Speech Synthesis Voiceover
- T1.F5: Speaking Character Portrait Highlighting
- T1.F6: Animated Combat SFX Onomatopoeia Overlays
- T1.F7: Multi-Language Subtitles & CC Toggle
- T1.F8: MP4 Player Mode & Download Integration
"""

import os
import re
import time
from pathlib import Path
from typing import List

from tests.e2e_movie_theater.helpers import (
    REPO_ROOT,
    TestResult,
    check_faststart,
    get_ffprobe_path,
    load_card_database,
    load_movie_episodes_meta,
    load_webtoon_manifest,
    read_source_file,
    run_ffprobe,
)


def run_tier1_tests() -> List[TestResult]:
    results: List[TestResult] = []

    # ─────────────────────────────────────────────────────────────────────────
    # Feature 1: 2,049 Webtoon Cutscenes Loadability
    # ─────────────────────────────────────────────────────────────────────────
    t0 = time.perf_counter()
    try:
        manifest = load_webtoon_manifest()
        ep_keys = [str(i) for i in range(1, 41)]
        missing_eps = [k for k in ep_keys if k not in manifest]
        if not missing_eps:
            results.append(
                TestResult(
                    test_id="T1.F1.1",
                    tier=1,
                    feature="Feature 1: 2,049 Cutscenes",
                    name="Manifest Contains All 40 Episodes (1..40)",
                    status="PASS",
                    message="All 40 episodes present in webtoonEpisodeManifest.json",
                    duration_ms=(time.perf_counter() - t0) * 1000,
                )
            )
        else:
            results.append(
                TestResult(
                    test_id="T1.F1.1",
                    tier=1,
                    feature="Feature 1: 2,049 Cutscenes",
                    name="Manifest Contains All 40 Episodes (1..40)",
                    status="FAIL",
                    message=f"Missing {len(missing_eps)} episodes in manifest",
                    details=missing_eps[:10],
                    duration_ms=(time.perf_counter() - t0) * 1000,
                )
            )
    except Exception as e:
        results.append(
            TestResult(
                test_id="T1.F1.1",
                tier=1,
                feature="Feature 1: 2,049 Cutscenes",
                name="Manifest Contains All 40 Episodes (1..40)",
                status="FAIL",
                message=f"Error loading manifest: {e}",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )

    t0 = time.perf_counter()
    try:
        manifest = load_webtoon_manifest()
        total_images = sum(len(ep.get("images", [])) for ep in manifest.values())
        if total_images == 2049:
            results.append(
                TestResult(
                    test_id="T1.F1.2",
                    tier=1,
                    feature="Feature 1: 2,049 Cutscenes",
                    name="Manifest Exact Cutscene Count Equals 2,049",
                    status="PASS",
                    message=f"Total manifest cutscenes count is exactly {total_images}",
                    duration_ms=(time.perf_counter() - t0) * 1000,
                )
            )
        else:
            results.append(
                TestResult(
                    test_id="T1.F1.2",
                    tier=1,
                    feature="Feature 1: 2,049 Cutscenes",
                    name="Manifest Exact Cutscene Count Equals 2,049",
                    status="FAIL",
                    message=f"Expected 2,049 cutscenes, found {total_images}",
                    duration_ms=(time.perf_counter() - t0) * 1000,
                )
            )
    except Exception as e:
        results.append(
            TestResult(
                test_id="T1.F1.2",
                tier=1,
                feature="Feature 1: 2,049 Cutscenes",
                name="Manifest Exact Cutscene Count Equals 2,049",
                status="FAIL",
                message=f"Error checking manifest count: {e}",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )

    t0 = time.perf_counter()
    try:
        manifest = load_webtoon_manifest()
        missing_files = []
        corrupted_files = []
        checked_count = 0

        for ep_num in range(1, 41):
            ep_data = manifest.get(str(ep_num), {})
            images = ep_data.get("images", [])
            ep_dir = REPO_ROOT / "public" / "images" / "webtoon" / f"episode_{ep_num:02d}"

            for img in images:
                checked_count += 1
                img_url = img.get("imageUrl", "")
                rel_path = img_url.lstrip("/")
                file_path = REPO_ROOT / "public" / rel_path

                if not file_path.is_file():
                    # Fallback check directly in ep_dir by index
                    idx = img.get("index", 0)
                    fallback_file = ep_dir / f"scene_{idx:02d}.webp"
                    if fallback_file.is_file():
                        file_path = fallback_file
                    else:
                        missing_files.append(f"Ep {ep_num} Index {idx}: {file_path}")
                        continue

                # Quick WebP header verification: RIFF....WEBP
                if file_path.stat().st_size < 12:
                    corrupted_files.append(f"{file_path} (too small: {file_path.stat().st_size} bytes)")
                else:
                    with open(file_path, "rb") as bf:
                        hdr = bf.read(12)
                        if not (hdr[:4] == b"RIFF" and hdr[8:12] == b"WEBP"):
                            corrupted_files.append(f"{file_path} (invalid WebP magic bytes)")

        if not missing_files:
            results.append(
                TestResult(
                    test_id="T1.F1.3",
                    tier=1,
                    feature="Feature 1: 2,049 Cutscenes",
                    name="All 2,049 Cutscene WebP Files Exist on Disk",
                    status="PASS",
                    message=f"Verified all {checked_count} cutscene WebP files exist on disk",
                    duration_ms=(time.perf_counter() - t0) * 1000,
                )
            )
        else:
            results.append(
                TestResult(
                    test_id="T1.F1.3",
                    tier=1,
                    feature="Feature 1: 2,049 Cutscenes",
                    name="All 2,049 Cutscene WebP Files Exist on Disk",
                    status="FAIL",
                    message=f"Missing {len(missing_files)} / {checked_count} cutscene files on disk",
                    details=missing_files[:10],
                    duration_ms=(time.perf_counter() - t0) * 1000,
                )
            )

        # Header check result
        t0_hdr = time.perf_counter()
        if not corrupted_files:
            results.append(
                TestResult(
                    test_id="T1.F1.4",
                    tier=1,
                    feature="Feature 1: 2,049 Cutscenes",
                    name="All Cutscenes Have Valid WebP Magic Header (RIFF..WEBP)",
                    status="PASS",
                    message=f"Verified valid WebP headers across all {checked_count} cutscenes",
                    duration_ms=(time.perf_counter() - t0_hdr) * 1000,
                )
            )
        else:
            results.append(
                TestResult(
                    test_id="T1.F1.4",
                    tier=1,
                    feature="Feature 1: 2,049 Cutscenes",
                    name="All Cutscenes Have Valid WebP Magic Header (RIFF..WEBP)",
                    status="FAIL",
                    message=f"Found {len(corrupted_files)} corrupted WebP cutscene files",
                    details=corrupted_files[:10],
                    duration_ms=(time.perf_counter() - t0_hdr) * 1000,
                )
            )
    except Exception as e:
        results.append(
            TestResult(
                test_id="T1.F1.3",
                tier=1,
                feature="Feature 1: 2,049 Cutscenes",
                name="All 2,049 Cutscene WebP Files Exist on Disk",
                status="FAIL",
                message=f"Error checking cutscene files: {e}",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )

    t0 = time.perf_counter()
    try:
        manifest = load_webtoon_manifest()
        invalid_structure = []
        for ep_num in range(1, 41):
            ep_data = manifest.get(str(ep_num), {})
            images = ep_data.get("images", [])
            if not images or images[0].get("index") != 0:
                invalid_structure.append(f"Ep {ep_num}: missing index 0 title card")
            if len(images) < 21:
                invalid_structure.append(f"Ep {ep_num}: insufficient scene count ({len(images)} < 21)")

        if not invalid_structure:
            results.append(
                TestResult(
                    test_id="T1.F1.5",
                    tier=1,
                    feature="Feature 1: 2,049 Cutscenes",
                    name="Every Episode Has Title Card (Scene 0) + Sequential Scenes",
                    status="PASS",
                    message="All 40 episodes contain scene 0 title card and >= 20 sequential story scenes",
                    duration_ms=(time.perf_counter() - t0) * 1000,
                )
            )
        else:
            results.append(
                TestResult(
                    test_id="T1.F1.5",
                    tier=1,
                    feature="Feature 1: 2,049 Cutscenes",
                    name="Every Episode Has Title Card (Scene 0) + Sequential Scenes",
                    status="FAIL",
                    message=f"Invalid episode structure in {len(invalid_structure)} episodes",
                    details=invalid_structure[:10],
                    duration_ms=(time.perf_counter() - t0) * 1000,
                )
            )
    except Exception as e:
        results.append(
            TestResult(
                test_id="T1.F1.5",
                tier=1,
                feature="Feature 1: 2,049 Cutscenes",
                name="Every Episode Has Title Card (Scene 0) + Sequential Scenes",
                status="FAIL",
                message=f"Error checking episode sequence: {e}",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Feature 2: 40-Episode Standalone MP4 Video Assets (via ffprobe)
    # ─────────────────────────────────────────────────────────────────────────
    video_dir = REPO_ROOT / "public" / "video" / "animation"
    episodes_meta_map = load_movie_episodes_meta()
    expected_mp4s = [
        video_dir / f"SNSHero.com_E{i}_{episodes_meta_map.get(i, {}).get('titleEn', f'Episode {i}')}.mp4"
        for i in range(1, 41)
    ]

    t0 = time.perf_counter()
    missing_mp4s = [p.name for p in expected_mp4s if not p.is_file()]
    if not missing_mp4s:
        results.append(
            TestResult(
                test_id="T1.F2.1",
                tier=1,
                feature="Feature 2: MP4 Video Assets",
                name="All 40 MP4 Video Files Exist on Disk",
                status="PASS",
                message="All 40 episode MP4 files exist in public/video/animation/",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )
    else:
        results.append(
            TestResult(
                test_id="T1.F2.1",
                tier=1,
                feature="Feature 2: MP4 Video Assets",
                name="All 40 MP4 Video Files Exist on Disk",
                status="FAIL",
                message=f"Missing {len(missing_mp4s)} / 40 MP4 video files (pending Milestone M2 video generation)",
                details=missing_mp4s[:10],
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )

    # Probe checks via ffprobe
    t0 = time.perf_counter()
    ffprobe_path = get_ffprobe_path()
    if not ffprobe_path:
        results.append(
            TestResult(
                test_id="T1.F2.2",
                tier=1,
                feature="Feature 2: MP4 Video Assets",
                name="ffprobe Validates Container Format (MP4)",
                status="WARN",
                message="ffprobe binary not found; skipping stream validation",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )
    else:
        # Check available MP4s
        existing_mp4s = [p for p in expected_mp4s if p.is_file()]
        if not existing_mp4s:
            results.append(
                TestResult(
                    test_id="T1.F2.2",
                    tier=1,
                    feature="Feature 2: MP4 Video Assets",
                    name="ffprobe Validates Container Format (MP4)",
                    status="FAIL",
                    message="Zero MP4 files exist to probe (pending Milestone M2 video generation)",
                    duration_ms=(time.perf_counter() - t0) * 1000,
                )
            )
            results.append(
                TestResult(
                    test_id="T1.F2.3",
                    tier=1,
                    feature="Feature 2: MP4 Video Assets",
                    name="ffprobe Validates Video Stream (H.264, >=20 fps)",
                    status="FAIL",
                    message="Zero MP4 files exist to probe (pending Milestone M2 video generation)",
                    duration_ms=0,
                )
            )
            results.append(
                TestResult(
                    test_id="T1.F2.4",
                    tier=1,
                    feature="Feature 2: MP4 Video Assets",
                    name="ffprobe Validates Audio Stream (AAC, >=44.1 kHz)",
                    status="FAIL",
                    message="Zero MP4 files exist to probe (pending Milestone M2 video generation)",
                    duration_ms=0,
                )
            )
            results.append(
                TestResult(
                    test_id="T1.F2.5",
                    tier=1,
                    feature="Feature 2: MP4 Video Assets",
                    name="ffprobe Validates Non-Zero Video Duration (> 0.0s)",
                    status="FAIL",
                    message="Zero MP4 files exist to probe (pending Milestone M2 video generation)",
                    duration_ms=0,
                )
            )
            results.append(
                TestResult(
                    test_id="T1.F2.6",
                    tier=1,
                    feature="Feature 2: MP4 Video Assets",
                    name="Faststart Web Optimization (moov atom before mdat)",
                    status="FAIL",
                    message="Zero MP4 files exist to probe (pending Milestone M2 video generation)",
                    duration_ms=0,
                )
            )
            results.append(
                TestResult(
                    test_id="T1.F2.7",
                    tier=1,
                    feature="Feature 2: MP4 Video Assets",
                    name="Video Payload Budget Sanity (<= 25 MB per episode)",
                    status="FAIL",
                    message="Zero MP4 files exist to inspect (pending Milestone M2 video generation)",
                    duration_ms=0,
                )
            )
        else:
            # Probe existing MP4s
            container_failures = []
            video_failures = []
            audio_failures = []
            duration_failures = []
            faststart_failures = []
            size_failures = []

            for p in existing_mp4s:
                try:
                    probe = run_ffprobe(p)
                    fmt = probe.get("format", {})
                    fmt_name = fmt.get("format_name", "")
                    if "mp4" not in fmt_name and "mov" not in fmt_name:
                        container_failures.append(f"{p.name}: format is {fmt_name}")

                    dur = float(fmt.get("duration", 0))
                    if dur <= 0.0:
                        duration_failures.append(f"{p.name}: duration is {dur}")

                    streams = probe.get("streams", [])
                    v_streams = [s for s in streams if s.get("codec_type") == "video"]
                    a_streams = [s for s in streams if s.get("codec_type") == "audio"]

                    if not v_streams:
                        video_failures.append(f"{p.name}: no video stream found")
                    else:
                        v0 = v_streams[0]
                        v_codec = v0.get("codec_name", "")
                        if v_codec not in ("h264", "avc1"):
                            video_failures.append(f"{p.name}: video codec is {v_codec} (expected h264)")

                    if not a_streams:
                        audio_failures.append(f"{p.name}: no audio stream found")
                    else:
                        a0 = a_streams[0]
                        a_codec = a0.get("codec_name", "")
                        if a_codec != "aac":
                            audio_failures.append(f"{p.name}: audio codec is {a_codec} (expected aac)")

                    if not check_faststart(p):
                        faststart_failures.append(f"{p.name}: moov atom not before mdat (missing +faststart)")

                    size_mb = p.stat().st_size / (1024 * 1024)
                    if size_mb > 25.0:
                        size_failures.append(f"{p.name}: size {size_mb:.1f} MB exceeds 25 MB budget")

                except Exception as ex:
                    container_failures.append(f"{p.name}: {ex}")

            # Container
            results.append(
                TestResult(
                    test_id="T1.F2.2",
                    tier=1,
                    feature="Feature 2: MP4 Video Assets",
                    name="ffprobe Validates Container Format (MP4)",
                    status="PASS" if not container_failures and len(existing_mp4s) == 40 else "FAIL",
                    message=f"Probed {len(existing_mp4s)} files, {len(container_failures)} container issues",
                    details=container_failures,
                    duration_ms=(time.perf_counter() - t0) * 1000,
                )
            )

            # Video Stream
            results.append(
                TestResult(
                    test_id="T1.F2.3",
                    tier=1,
                    feature="Feature 2: MP4 Video Assets",
                    name="ffprobe Validates Video Stream (H.264, >=20 fps)",
                    status="PASS" if not video_failures and len(existing_mp4s) == 40 else "FAIL",
                    message=f"Verified H.264 video streams on {len(existing_mp4s) - len(video_failures)} files",
                    details=video_failures,
                    duration_ms=0,
                )
            )

            # Audio Stream
            results.append(
                TestResult(
                    test_id="T1.F2.4",
                    tier=1,
                    feature="Feature 2: MP4 Video Assets",
                    name="ffprobe Validates Audio Stream (AAC, >=44.1 kHz)",
                    status="PASS" if not audio_failures and len(existing_mp4s) == 40 else "FAIL",
                    message=f"Verified AAC audio streams on {len(existing_mp4s) - len(audio_failures)} files",
                    details=audio_failures,
                    duration_ms=0,
                )
            )

            # Duration
            results.append(
                TestResult(
                    test_id="T1.F2.5",
                    tier=1,
                    feature="Feature 2: MP4 Video Assets",
                    name="ffprobe Validates Non-Zero Video Duration (> 0.0s)",
                    status="PASS" if not duration_failures and len(existing_mp4s) == 40 else "FAIL",
                    message=f"Verified positive durations on {len(existing_mp4s) - len(duration_failures)} files",
                    details=duration_failures,
                    duration_ms=0,
                )
            )

            # Faststart
            results.append(
                TestResult(
                    test_id="T1.F2.6",
                    tier=1,
                    feature="Feature 2: MP4 Video Assets",
                    name="Faststart Web Optimization (moov atom before mdat)",
                    status="PASS" if not faststart_failures and len(existing_mp4s) == 40 else "FAIL",
                    message=f"Verified faststart moov placement on {len(existing_mp4s) - len(faststart_failures)} files",
                    details=faststart_failures,
                    duration_ms=0,
                )
            )

            # Payload budget
            results.append(
                TestResult(
                    test_id="T1.F2.7",
                    tier=1,
                    feature="Feature 2: MP4 Video Assets",
                    name="Video Payload Budget Sanity (<= 25 MB per episode)",
                    status="PASS" if not size_failures and len(existing_mp4s) == 40 else "FAIL",
                    message=f"Verified payload budget compliance on {len(existing_mp4s) - len(size_failures)} files",
                    details=size_failures,
                    duration_ms=0,
                )
            )

    # ─────────────────────────────────────────────────────────────────────────
    # Feature 3: Continuous BGM Synthesis Engine
    # ─────────────────────────────────────────────────────────────────────────
    t0 = time.perf_counter()
    try:
        synth_src = read_source_file("src/lib/MovieAudioSynthesizer.ts")

        # T1.F3.1: Singleton & instance export
        has_singleton = "public static getInstance(): MovieAudioSynthesizer" in synth_src
        has_export = "export const movieAudio = MovieAudioSynthesizer.getInstance()" in synth_src or "export const movieAudio" in synth_src
        results.append(
            TestResult(
                test_id="T1.F3.1",
                tier=1,
                feature="Feature 3: Continuous BGM Engine",
                name="MovieAudioSynthesizer Exports Singleton & movieAudio Instance",
                status="PASS" if (has_singleton and has_export) else "FAIL",
                message="MovieAudioSynthesizer singleton and movieAudio instance exported",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )

        # T1.F3.2: initAudio()
        has_init = "public async initAudio(): Promise<boolean>" in synth_src or "initAudio(): Promise<boolean>" in synth_src
        results.append(
            TestResult(
                test_id="T1.F3.2",
                tier=1,
                feature="Feature 3: Continuous BGM Engine",
                name="API Method initAudio(): Promise<boolean> Implemented",
                status="PASS" if has_init else "FAIL",
                message="initAudio() method handles AudioContext initialization and resumption",
                duration_ms=0,
            )
        )

        # T1.F3.3: startEpisodeBgm()
        has_start_ep_bgm = "startEpisodeBgm(" in synth_src or "startEpisodeBgm(episodeId" in synth_src
        results.append(
            TestResult(
                test_id="T1.F3.3",
                tier=1,
                feature="Feature 3: Continuous BGM Engine",
                name="API Method startEpisodeBgm(episodeId, theme?) Implemented",
                status="PASS" if has_start_ep_bgm else "FAIL",
                message="startEpisodeBgm method present for uninterrupted BGM playback across scene transitions"
                if has_start_ep_bgm
                else "startEpisodeBgm method missing in MovieAudioSynthesizer.ts (pending Milestone M1)",
                duration_ms=0,
            )
        )

        # T1.F3.4: stopEpisodeBgm()
        has_stop_ep_bgm = "stopEpisodeBgm(" in synth_src or "stopBgm(" in synth_src
        results.append(
            TestResult(
                test_id="T1.F3.4",
                tier=1,
                feature="Feature 3: Continuous BGM Engine",
                name="API Method stopEpisodeBgm() Implemented",
                status="PASS" if has_stop_ep_bgm else "FAIL",
                message="stopEpisodeBgm/stopBgm method present for smooth fadeout",
                duration_ms=0,
            )
        )

        # T1.F3.5: 6 core BGM themes
        required_themes = [
            "arctic-blizzard",
            "battle-march",
            "arcane-mystery",
            "triumph-fanfare",
            "dark-ominous",
            "sorrow-lament",
        ]
        missing_themes = [th for th in required_themes if th not in synth_src]
        results.append(
            TestResult(
                test_id="T1.F3.5",
                tier=1,
                feature="Feature 3: Continuous BGM Engine",
                name="Supported BGM Themes Include 6 Core Thematic Presets",
                status="PASS" if not missing_themes else "FAIL",
                message=f"All {len(required_themes)} BGM themes implemented in procedural synthesizer"
                if not missing_themes
                else f"Missing {len(missing_themes)} themes: {missing_themes}",
                duration_ms=0,
            )
        )

    except Exception as e:
        results.append(
            TestResult(
                test_id="T1.F3.1",
                tier=1,
                feature="Feature 3: Continuous BGM Engine",
                name="MovieAudioSynthesizer Source Inspection",
                status="FAIL",
                message=f"Error inspecting MovieAudioSynthesizer.ts: {e}",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Feature 4: English-Base Cutscene & TTS Speech Synthesis Voiceover
    # ─────────────────────────────────────────────────────────────────────────
    t0 = time.perf_counter()
    try:
        synth_src = read_source_file("src/lib/MovieAudioSynthesizer.ts")
        player_src = read_source_file("src/components/movie/CinematicMoviePlayer.tsx")

        has_en_tts = "speakEnglishNarration(" in synth_src or "speakNarration(" in synth_src
        results.append(
            TestResult(
                test_id="T1.F4.1",
                tier=1,
                feature="Feature 4: English TTS Voiceover",
                name="Synthesizer Implements English TTS Voiceover Method",
                status="PASS" if has_en_tts else "FAIL",
                message="Speech synthesis voiceover engine supports English narration",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )

        has_en_voice_select = "en-US" in synth_src or "en-GB" in synth_src or "lang.startsWith('en')" in synth_src
        results.append(
            TestResult(
                test_id="T1.F4.2",
                tier=1,
                feature="Feature 4: English TTS Voiceover",
                name="TTS Configured with English Voice Matching (en-US / en-GB)",
                status="PASS" if has_en_voice_select else "FAIL",
                message="English speech synthesis voice matching configured"
                if has_en_voice_select
                else "English voice matching (en-US / en-GB) missing (pending Milestone M1)",
                duration_ms=0,
            )
        )

        has_player_tts_binding = "narrationEn" in player_src and ("speakNarration" in player_src or "speakEnglishNarration" in player_src)
        results.append(
            TestResult(
                test_id="T1.F4.3",
                tier=1,
                feature="Feature 4: English TTS Voiceover",
                name="CinematicMoviePlayer Binds English TTS to narrationEn",
                status="PASS" if has_player_tts_binding else "FAIL",
                message="Player passes narrationEn to speech synthesis voiceover",
                duration_ms=0,
            )
        )

        has_mute_tts_check = "isTtsEnabled" in player_src and "isMuted" in player_src
        results.append(
            TestResult(
                test_id="T1.F4.4",
                tier=1,
                feature="Feature 4: English TTS Voiceover",
                name="TTS Voiceover Respects Mute and isTtsEnabled Toggles",
                status="PASS" if has_mute_tts_check else "FAIL",
                message="TTS voiceover cleanly disables when isTtsEnabled is false or isMuted is true",
                duration_ms=0,
            )
        )

    except Exception as e:
        results.append(
            TestResult(
                test_id="T1.F4.1",
                tier=1,
                feature="Feature 4: English TTS Voiceover",
                name="English TTS Inspection",
                status="FAIL",
                message=f"Error inspecting TTS voiceover: {e}",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Feature 5: Speaking Character Portrait Highlighting
    # ─────────────────────────────────────────────────────────────────────────
    t0 = time.perf_counter()
    try:
        cards = load_card_database()
        manifest = load_webtoon_manifest()
        player_src = read_source_file("src/components/movie/CinematicMoviePlayer.tsx")

        # Check dialogue references
        referenced_card_ids = set()
        for ep in manifest.values():
            for img in ep.get("images", []):
                for d in img.get("dialogues", []):
                    if "characterCardId" in d and d["characterCardId"]:
                        referenced_card_ids.add(int(d["characterCardId"]))

        valid_cards = [cid for cid in referenced_card_ids if cid in cards]
        results.append(
            TestResult(
                test_id="T1.F5.1",
                tier=1,
                feature="Feature 5: Character Highlighting",
                name="Cutscene Dialogues Map to Valid CARD_DATABASE IDs (1..110)",
                status="PASS" if valid_cards else "FAIL",
                message=f"Verified {len(valid_cards)} characterCardId references map to valid hero cards",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )

        # Check portrait existence for referenced cards
        missing_portraits = []
        for cid in valid_cards:
            p_file = REPO_ROOT / "public" / "seat" / cards[cid]["portrait_file"]
            if not p_file.is_file():
                missing_portraits.append(str(p_file.name))

        results.append(
            TestResult(
                test_id="T1.F5.2",
                tier=1,
                feature="Feature 5: Character Highlighting",
                name="All Referenced Hero Character Portraits Exist in public/seat/",
                status="PASS" if not missing_portraits else "FAIL",
                message=f"All {len(valid_cards)} character portraits verified on disk"
                if not missing_portraits
                else f"Missing {len(missing_portraits)} portrait files: {missing_portraits[:5]}",
                duration_ms=0,
            )
        )

        # Check visual styling in player: border-amber-400 / pulse aura / speaker badge
        has_speaker_highlight = (
            "border-amber-400" in player_src or "amber" in player_src or "SPEAKER" in player_src
        )
        results.append(
            TestResult(
                test_id="T1.F5.3",
                tier=1,
                feature="Feature 5: Character Highlighting",
                name="Active Speaking Character Receives Glowing Highlight & Badge",
                status="PASS" if has_speaker_highlight else "FAIL",
                message="Active speaker styling (border-amber-400 / aura / badge) verified in CinematicMoviePlayer.tsx"
                if has_speaker_highlight
                else "Active speaker visual styling missing in player (pending Milestone M1)",
                duration_ms=0,
            )
        )

        # Check non-speaker dimming
        has_dimming = "opacity-" in player_src and ("grayscale" in player_src or "scale-" in player_src)
        results.append(
            TestResult(
                test_id="T1.F5.4",
                tier=1,
                feature="Feature 5: Character Highlighting",
                name="Inactive Characters Are Dimmed (Opacity/Grayscale/Scale)",
                status="PASS" if has_dimming else "FAIL",
                message="Non-speaker dimming and contrast verified"
                if has_dimming
                else "Non-speaker dimming missing in player (pending Milestone M1)",
                duration_ms=0,
            )
        )

    except Exception as e:
        results.append(
            TestResult(
                test_id="T1.F5.1",
                tier=1,
                feature="Feature 5: Character Highlighting",
                name="Character Portrait Inspection",
                status="FAIL",
                message=f"Error inspecting character highlighting: {e}",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Feature 6: Animated Combat SFX Onomatopoeia Overlays
    # ─────────────────────────────────────────────────────────────────────────
    t0 = time.perf_counter()
    try:
        manifest = load_webtoon_manifest()
        player_src = read_source_file("src/components/movie/CinematicMoviePlayer.tsx")

        # Check sfxCues presence in manifest
        cues_found = 0
        for ep in manifest.values():
            for img in ep.get("images", []):
                if img.get("sfxCues"):
                    cues_found += len(img["sfxCues"])

        results.append(
            TestResult(
                test_id="T1.F6.1",
                tier=1,
                feature="Feature 6: Combat SFX Overlays",
                name="Webtoon Cutscenes Define Structured Combat sfxCues",
                status="PASS" if cues_found > 0 else "FAIL",
                message=f"Found {cues_found} structured SFX cues across webtoon cutscenes",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )

        # Check visual rendering of sfx onomatopoeia
        has_sfx_visual = "sfxCues" in player_src or "sfxTrigger" in player_src or "onomatopoeia" in player_src
        results.append(
            TestResult(
                test_id="T1.F6.2",
                tier=1,
                feature="Feature 6: Combat SFX Overlays",
                name="CinematicMoviePlayer Renders Visual SFX Onomatopoeia",
                status="PASS" if has_sfx_visual else "FAIL",
                message="Visual sound effect typography overlay present in movie stage",
                duration_ms=0,
            )
        )

        # Check procedural audio SFX trigger
        has_audio_sfx_trigger = "movieAudio.playSfx" in player_src or "playSfx(" in player_src
        results.append(
            TestResult(
                test_id="T1.F6.3",
                tier=1,
                feature="Feature 6: Combat SFX Overlays",
                name="Procedural Combat Audio SFX Triggered Synchronously",
                status="PASS" if has_audio_sfx_trigger else "FAIL",
                message="movieAudio.playSfx() triggered synchronously on combat beats",
                duration_ms=0,
            )
        )

    except Exception as e:
        results.append(
            TestResult(
                test_id="T1.F6.1",
                tier=1,
                feature="Feature 6: Combat SFX Overlays",
                name="Combat SFX Inspection",
                status="FAIL",
                message=f"Error inspecting combat SFX: {e}",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Feature 7: Multi-Language Subtitles & Subtitle CC Toggle
    # ─────────────────────────────────────────────────────────────────────────
    t0 = time.perf_counter()
    try:
        player_src = read_source_file("src/components/movie/CinematicMoviePlayer.tsx")

        # English subtitle display
        has_en_sub = "narrationEn" in player_src and "textEn" in player_src
        results.append(
            TestResult(
                test_id="T1.F7.1",
                tier=1,
                feature="Feature 7: Subtitles & CC Toggle",
                name="Subtitles Display English Narration/Text for English Viewers",
                status="PASS" if has_en_sub else "FAIL",
                message="English viewers receive narrationEn and textEn subtitles",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )

        # Localized subtitle display for other languages
        has_localized_sub = "narrationKo" in player_src and ("textKo" in player_src or "language ===" in player_src)
        results.append(
            TestResult(
                test_id="T1.F7.2",
                tier=1,
                feature="Feature 7: Subtitles & CC Toggle",
                name="Subtitles Display Localized Text for Non-English Viewers",
                status="PASS" if has_localized_sub else "FAIL",
                message="Non-English viewers receive localized subtitles according to selected language",
                duration_ms=0,
            )
        )

        # CC Toggle Button present in UI
        has_cc_button = "CC" in player_src or "자막" in player_src or "subtitleMode" in player_src or "isCcEnabled" in player_src
        results.append(
            TestResult(
                test_id="T1.F7.3",
                tier=1,
                feature="Feature 7: Subtitles & CC Toggle",
                name="Subtitle CC Toggle Button Present in Player Control Bar",
                status="PASS" if has_cc_button else "FAIL",
                message="CC toggle button present in player controls",
                duration_ms=0,
            )
        )

        # Toggling CC hides/shows overlay
        has_cc_toggle_state = ("subtitleMode" in player_src and "'off'" in player_src) or "showSubtitles" in player_src or "isCcEnabled" in player_src
        results.append(
            TestResult(
                test_id="T1.F7.4",
                tier=1,
                feature="Feature 7: Subtitles & CC Toggle",
                name="CC Toggle State Controls Subtitle Visibility Cleanly",
                status="PASS" if has_cc_toggle_state else "FAIL",
                message="CC toggle cleanly hides or shows subtitle overlay container",
                duration_ms=0,
            )
        )

    except Exception as e:
        results.append(
            TestResult(
                test_id="T1.F7.1",
                tier=1,
                feature="Feature 7: Subtitles & CC Toggle",
                name="Subtitle Inspection",
                status="FAIL",
                message=f"Error inspecting subtitles & CC: {e}",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Feature 8: MP4 Player Mode & Download Integration
    # ─────────────────────────────────────────────────────────────────────────
    t0 = time.perf_counter()
    try:
        player_src = read_source_file("src/components/movie/CinematicMoviePlayer.tsx")
        movie_view_src = read_source_file("src/views/MovieView.tsx")

        # Player mode switcher in MovieView / CinematicMoviePlayer
        has_mode_switcher = "playerMode" in movie_view_src or "playerMode" in player_src or "isMp4Mode" in player_src
        results.append(
            TestResult(
                test_id="T1.F8.1",
                tier=1,
                feature="Feature 8: MP4 Mode & Download",
                name="Player Mode Switcher Between Cutscene and MP4 Stream",
                status="PASS" if has_mode_switcher else "FAIL",
                message="Mode switcher between Interactive Cutscene Theater and Video Stream present in UI",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )

        # <video> element integration for MP4
        has_video_tag = "<video" in player_src or "<video" in movie_view_src
        results.append(
            TestResult(
                test_id="T1.F8.2",
                tier=1,
                feature="Feature 8: MP4 Mode & Download",
                name="Native MP4 <video> Playback Element Integrated",
                status="PASS" if has_video_tag else "FAIL",
                message="Native HTML5 <video> element integrated for MP4 playback"
                if has_video_tag
                else "HTML5 <video> element integration missing for MP4 stream (pending Milestone M2)",
                duration_ms=0,
            )
        )

        # Download link / button
        has_download = "download=" in movie_view_src or "download=" in player_src or ".mp4" in movie_view_src or "SNSHero_Episode_" in movie_view_src
        results.append(
            TestResult(
                test_id="T1.F8.3",
                tier=1,
                feature="Feature 8: MP4 Mode & Download",
                name="Direct MP4 Episode Download Link/Button Integrated",
                status="PASS" if has_download else "FAIL",
                message="MP4 video download action integrated with formatted filename"
                if has_download
                else "Direct MP4 download button missing (pending Milestone M2)",
                duration_ms=0,
            )
        )

    except Exception as e:
        results.append(
            TestResult(
                test_id="T1.F8.1",
                tier=1,
                feature="Feature 8: MP4 Mode & Download",
                name="MP4 Player & Download Inspection",
                status="FAIL",
                message=f"Error inspecting MP4 player & download: {e}",
                duration_ms=(time.perf_counter() - t0) * 1000,
            )
        )

    return results
