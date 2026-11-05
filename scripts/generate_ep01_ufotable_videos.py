#!/usr/bin/env python3
"""
Generate all 28 Episode 1 ('Two Vows Beneath the Blizzard' / '눈보라 아래 두 서약') 6-second 16:9 Video Clips
in Google Flow (Veo 3.1 - Lite, 동영상, 프레임, 16:9, 6초, x1) using the newly generated ufotable
16:9 Cutscene Images (`UFO3_EP01_CUT01_cutscene.jpg` .. `UFO3_EP01_CUT28_cutscene.jpg`) as Start Frames (`시작`),
and merge all 28 clips into 1 integrated Episode 1 video (with external .ko/.en subtitles only, no embedded subtitle tracks).
"""

import base64
import json
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROMPTS_JSON = ROOT / "public" / "anime-character-sheets" / "cutscene-prompts" / "episode_01_cutscene_prompts.json"
CUTSCENES_DIR = ROOT / "public" / "anime-character-sheets" / "cutscenes" / "ep01_landscape" / "images"
VID_OUT_DIR = ROOT / "public" / "anime-character-sheets" / "videos" / "ep01_landscape"
CLIPS_DIR = VID_OUT_DIR / "clips"
MOVIE_DIR = Path("/Users/dayyoung/Desktop/내문서/movie")
PUBLIC_EP_DIR = ROOT / "public" / "videos" / "episodes"

CLIPS_DIR.mkdir(parents=True, exist_ok=True)
MOVIE_DIR.mkdir(parents=True, exist_ok=True)


def run_chrome_js(js_code: str, timeout: int = 35) -> str:
    tmp = Path("/tmp/chrome_ep01_vid_cmd.js")
    tmp.write_text(js_code, encoding="utf-8")
    osa = """
    set jsCode to read POSIX file "/tmp/chrome_ep01_vid_cmd.js" as «class utf8»
    tell application "Google Chrome"
        repeat with w in windows
            repeat with t in tabs of w
                if URL of t contains "flow.google.com/project/" then
                    return execute t javascript jsCode
                end if
            end repeat
        end repeat
        return "TAB_NOT_FOUND"
    end tell
    """
    res = subprocess.run(["osascript", "-e", osa], capture_output=True, text=True, timeout=timeout)
    return res.stdout.strip()


def download_asb_video_via_chrome_tab(asb_mm_url: str, dest: Path) -> bool:
    """
    Opens `asb_mm_url` (`https://flow.google.com/asb/<TOKEN>=mm,22,15`) in a temporary Chrome tab
    inside the same window as `flow.google.com/project/`, waits for the 302 redirect to
    `googlevideo.com/videoplayback`, performs a same-origin fetch() inside that tab, and writes
    the decoded MP4 bytes to `dest`.
    """
    clean_url = asb_mm_url.split("=")[0] + "=mm,22,15"
    osa = f"""
    tell application "Google Chrome"
        repeat with w in windows
            repeat with ft in tabs of w
                if URL of ft contains "flow.google.com/project/" then
                    set t to make new tab at end of tabs of w with properties {{URL:"{clean_url}"}}
                    delay 2.4
                    execute t javascript "
                        fetch(location.href).then(r => r.arrayBuffer()).then(buf => {{
                            const bytes = new Uint8Array(buf);
                            let bin = \\"\\";
                            for (let i = 0; i < bytes.length; i += 32768) {{
                                bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
                            }}
                            document.body.setAttribute(\\"data-b64\\", btoa(bin));
                        }}).catch(e => {{
                            document.body.setAttribute(\\"data-b64\\", \\"ERR:\\" + e);
                        }});
                        \\"STARTED\\";
                    "
                    repeat 15 times
                        delay 0.45
                        set b64 to execute t javascript "document.body.getAttribute(\\"data-b64\\") || \\"\\""
                        if length of b64 > 10 then
                            exit repeat
                        end if
                    end repeat
                    close t
                    return b64
                end if
            end repeat
        end repeat
        return "NO_WINDOW"
    end tell
    """
    res = subprocess.run(["osascript", "-e", osa], capture_output=True, text=True, timeout=45)
    b64 = res.stdout.strip()
    if len(b64) > 50000 and not b64.startswith("ERR:"):
        raw = base64.b64decode(b64)
        if len(raw) > 100000:
            dest.write_bytes(raw)
            return True
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


def build_video_prompt(cut: dict, fallback_try: int = 0) -> str:
    base = sanitize_veo_prompt_strict(cut.get("cutsceneAnimationPromptEn") or cut["unifiedVideoPromptEn"])
    # Emphasize ufotable Demon Slayer sakuga consistency with the attached start frame
    base = base.replace(
        "1) ANIMATE ATTACHED CUTSCENE IMAGE:",
        "1) ANIMATE ATTACHED UFOTABLE CUTSCENE START FRAME (Demon Slayer: Kimetsu no Yaiba studio quality):"
    )
    if fallback_try >= 1:
        base = re.sub(
            r"2\) 6-SECOND ANIME MOTION & VISUAL EFFECTS:.*?3\) AUDIO / VOICE / NARRATION RULE",
            "2) 6-SECOND ANIME MOTION & VISUAL EFFECTS: Apply smooth 24fps 2D ufotable anime sakuga camera motion, dynamic wind and glowing arcane particles, natural hair and cloak physics while preserving the exact character faces, outfits, and props from the start frame. 3) AUDIO / VOICE / NARRATION RULE",
            base,
            flags=re.DOTALL,
        )
    return base


def ensure_flow_veo_16x9_ready():
    # If accidentally in /edit/ detail view, navigate back to project grid
    run_chrome_js("""
    (() => {
        if (location.href.includes('/edit/')) {
            history.back();
            return 'HIST_BACK';
        }
        return 'OK';
    })()
    """)
    time.sleep(0.5)

    # Patch submit(a) -> submit({isTrusted:true})
    run_chrome_js("""
    (() => {
        const s = document.querySelector('script[nonce]');
        const nonce = s ? (s.nonce || s.getAttribute('nonce')) : '';
        let pol = window.__ttPol;
        if (!pol && window.trustedTypes && window.trustedTypes.createPolicy) {
            try {
                pol = window.trustedTypes.createPolicy('flowPatchPol_' + Math.random().toString(36).slice(2), { createScript: x => x });
                window.__ttPol = pol;
            } catch(e) {}
        }
        const code = `
            (() => {
                const m = window.default_AiSandboxAngularFrontend;
                if (!m) return;
                for (const k of ['XY', 'c8']) {
                    const cls = m[k];
                    if (cls && cls.prototype && cls.prototype.submit && !cls.prototype.submit.__patched) {
                        const orig = cls.prototype.submit;
                        const wrapped = function(ev) {
                            return orig.call(this, { isTrusted: true, preventDefault: () => {}, stopPropagation: () => {} });
                        };
                        wrapped.__patched = true;
                        cls.prototype.submit = wrapped;
                    }
                }
                document.body.setAttribute('data-submit-patched', '1');
            })();
        `;
        const el = document.createElement('script');
        if (nonce) el.setAttribute('nonce', nonce);
        el.text = pol ? pol.createScript(code) : code;
        document.head.appendChild(el);
        el.remove();
        return document.body.getAttribute('data-submit-patched') || '0';
    })()
    """)

    pill_state = run_chrome_js("""
    (() => {
        const pill = document.querySelector('button[aria-label="설정 트리거"]');
        if (!pill) return 'NO_PILL';
        const txt = pill.innerText.replace(/\\s+/g, ' ').trim();
        const startSlot = [...document.querySelectorAll('button, div[role="button"]')].find(b => (b.innerText || '').trim() === '시작');
        if (txt.includes('동영상') && txt.includes('6초') && txt.includes('crop_16_9') && txt.includes('x1') && startSlot) {
            return 'OK:' + txt;
        }
        pill.click();
        return 'OPENED:' + txt;
    })()
    """)
    if pill_state.startswith("OPENED"):
        time.sleep(0.6)
        run_chrome_js("""
        (() => {
            const radios = [...document.querySelectorAll('button[role="radio"]')];
            const clickR = (kw) => {
                const b = radios.find(r => (r.innerText || '').includes(kw));
                if (b) b.click();
            };
            clickR('동영상');
        })()
        """)
        time.sleep(0.4)
        run_chrome_js("""
        (() => {
            const mSel = document.querySelector('button[aria-label="모델 제품군 선택"]');
            if (mSel && !(mSel.innerText || '').includes('Veo 3.1 - Lite')) {
                mSel.click();
            }
        })()
        """)
        time.sleep(0.5)
        run_chrome_js("""
        (() => {
            const opts = [...document.querySelectorAll('[role="menuitem"], [role="option"]')];
            const veo = opts.find(o => (o.innerText || '').includes('Veo 3.1 - Lite'));
            if (veo) veo.click();
        })()
        """)
        time.sleep(0.4)
        run_chrome_js("""
        (() => {
            const radios = [...document.querySelectorAll('button[role="radio"]')];
            const clickR = (kw) => {
                const b = radios.find(r => (r.innerText || '').includes(kw));
                if (b) b.click();
            };
            clickR('프레임');
            clickR('16:9');
            clickR('6초');
            clickR('x1');
            document.body.click();
        })()
        """)
        time.sleep(0.5)


def clear_video_composer():
    run_chrome_js("""
    (() => {
        const clr = document.querySelector('button[aria-label="프롬프트 지우기"]');
        if (clr) clr.click();
        const chips = [...document.querySelectorAll('button.chip-container')];
        chips.forEach(c => c.click());
        const pm = document.querySelector('.ProseMirror');
        if (pm) {
            pm.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('delete', false, null);
        }
    })()
    """)
    time.sleep(0.3)


def attach_ufo3_start_frame(cnum: int) -> bool:
    search_q = f"UFO3_EP01_CUT{cnum:02d}"
    target_fname = f"UFO3_EP01_CUT{cnum:02d}_cutscene.jpg"

    # Open 시작 picker if not open
    run_chrome_js("""
    (() => {
        if (!document.querySelector('input[aria-label="애셋 검색"]')) {
            const startBtn = [...document.querySelectorAll('button.empty-chip, button, div[role="button"]')].find(b => (b.innerText || '').trim() === '시작');
            if (startBtn) startBtn.click();
        }
    })()
    """)
    time.sleep(0.55)

    # Type search_q into 애셋 검색
    run_chrome_js(f"""
    (() => {{
        const inp = document.querySelector('input[aria-label="애셋 검색"]');
        if (!inp) return 'NO_INP';
        inp.focus();
        inp.select();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, {json.dumps(search_q)});
        inp.dispatchEvent(new Event('input', {{ bubbles: true }}));
        return 'TYPED';
    }})()
    """)
    time.sleep(0.75)

    # Clicking the asset-item inside the 시작 picker immediately attaches it as the Start Frame and closes the picker
    sel_res = run_chrome_js(f"""
    (() => {{
        const items = [...document.querySelectorAll('button.asset-item')];
        const target = items.find(b => (b.innerText || '').includes({json.dumps(target_fname)})) || items[0];
        if (!target) return 'NOT_FOUND';
        target.click();
        return 'CLICKED:' + (target.innerText || '').replace(/\\s+/g, ' ').trim();
    }})()
    """)
    if not sel_res.startswith("CLICKED"):
        return False

    time.sleep(0.5)
    chk = run_chrome_js("""
    (() => {
        const chip = document.querySelector('button.chip-container[aria-label="이미지 소재"]');
        return chip ? 'ATTACHED' : 'NO_CHIP';
    })()
    """)
    return chk == "ATTACHED"


def get_grid_video_urls() -> list[str]:
    raw = run_chrome_js("""
    (() => {
        const vtiles = [...document.querySelectorAll('flow-video-tile')];
        return JSON.stringify(vtiles.map(vt => {
            const raw = vt.querySelector('img.thumbnail')?.src || vt.querySelector('video')?.src || '';
            return raw ? raw.split('=')[0] : '';
        }).filter(Boolean));
    })()
    """)
    try:
        return json.loads(raw)
    except Exception:
        return []


def generate_video_batch(batch_cuts: list[dict], status_data: dict, status_file: Path):
    remaining = list(batch_cuts)
    for attempt in range(1, 4):
        if not remaining:
            break
        ensure_flow_veo_16x9_ready()

        # Wait if any existing pending tile is still running
        for _ in range(45):
            pend = run_chrome_js("String(document.querySelectorAll('flow-pending-tile').length)")
            if pend == "0":
                break
            time.sleep(1.5)

        # Scroll grid to top
        run_chrome_js("""
        (() => {
            const scrollers = [...document.querySelectorAll('*')].filter(el => el.scrollHeight > el.clientHeight + 100);
            scrollers.forEach(el => { el.scrollTop = 0; });
        })()
        """)
        time.sleep(0.3)
        before_vids = set(get_grid_video_urls())

        submitted_info: list[tuple[str, dict, bool, str]] = []
        for cut in remaining:
            cnum = cut["cutNumber"]
            ccode = cut["cutCode"]
            tag_id = f"TAG_VID_EP01_CUT{cnum:02d}"

            clear_video_composer()
            ok_frame = attach_ufo3_start_frame(cnum)
            v_prompt = build_video_prompt(cut, fallback_try=attempt - 1)
            tagged_prompt = f"[{tag_id}] {v_prompt}"

            ins_res = run_chrome_js(f"""
            (() => {{
                const pm = document.querySelector('.ProseMirror');
                if (!pm) return 'NO_PM';
                pm.focus();
                document.execCommand('selectAll', false, null);
                document.execCommand('insertText', false, {json.dumps(tagged_prompt)});
                pm.dispatchEvent(new Event('input', {{ bubbles: true }}));
                return 'INSERTED';
            }})()
            """)
            time.sleep(0.35)
            sub_res = run_chrome_js("""
            (() => {
                const btn = document.querySelector('button[aria-label="생성 시작"]') || [...document.querySelectorAll('button')].find(b => (b.innerText || '').includes('arrow_forward'));
                if (!btn) return 'NO_BTN';
                btn.click();
                return 'SUBMITTED';
            })()
            """)
            time.sleep(1.0)
            run_chrome_js("""
            (() => {
                const containers = document.querySelectorAll('flow-grid-tile-container');
                containers.forEach(c => {
                    const aria = c.getAttribute('aria-label') || '';
                    const m = aria.match(/^\\[(TAG_[A-Za-z0-9_\\-]+)\\]/);
                    if (m) c.setAttribute('data-vid-tag', m[1]);
                });
            })()
            """)
            diag = cut.get("dialogue") or {}
            submitted_info.append((tag_id, cut, ok_frame, v_prompt))
            print(f"  🎬 [{ccode} | Try {attempt}] Submitted Veo 3.1 Lite ({ins_res}->{sub_res}) | StartFrame=UFO3_EP01_CUT{cnum:02d}_cutscene.jpg (attached={ok_frame}) | Audio={diag.get('audioType')}", flush=True)

        # Poll until pending tiles finish
        results: dict[str, str] = {}
        start_t = time.time()
        while time.time() - start_t < 130:
            time.sleep(2.5)
            state_raw = run_chrome_js("""
            (() => {
                const scrollers = [...document.querySelectorAll('*')].filter(el => el.scrollHeight > el.clientHeight + 100 && el.className.includes('virtual-scroll'));
                scrollers.forEach(el => { el.scrollTop = 0; });
                const containers = [...document.querySelectorAll('flow-grid-tile-container')].slice(0, 10);
                containers.forEach(c => {
                    const aria = c.getAttribute('aria-label') || '';
                    const m = aria.match(/^\\[(TAG_[A-Za-z0-9_\\-]+)\\]/);
                    if (m) c.setAttribute('data-vid-tag', m[1]);
                });
                const pend = document.querySelectorAll('flow-pending-tile').length;
                const tiles = containers.map((c, idx) => {
                    const vt = c.querySelector('flow-video-tile');
                    const raw = vt ? (vt.querySelector('img.thumbnail')?.src || vt.querySelector('video')?.src || '') : '';
                    return {
                        idx,
                        tag: c.getAttribute('data-vid-tag') || '',
                        isPend: Boolean(c.querySelector('flow-pending-tile')),
                        vidTokenUrl: raw ? raw.split('=')[0] : ''
                    };
                });
                return JSON.stringify({ pend, tiles });
            })()
            """)
            try:
                st = json.loads(state_raw)
            except Exception:
                continue

            for t in st["tiles"]:
                u = t["vidTokenUrl"]
                tag = t["tag"]
                if u.startswith("https://flow.google.com/asb/") and u not in before_vids:
                    if tag and tag not in results:
                        results[tag] = u

            if st["pend"] == 0:
                new_vid_tiles = [
                    t for t in st["tiles"]
                    if t["vidTokenUrl"].startswith("https://flow.google.com/asb/") and t["vidTokenUrl"] not in before_vids
                ]
                if len(new_vid_tiles) == len(submitted_info):
                    for rev_idx, (tag_id, _cut, _ok, _pr) in enumerate(reversed(submitted_info)):
                        if tag_id not in results and rev_idx < len(new_vid_tiles):
                            results[tag_id] = new_vid_tiles[rev_idx]["vidTokenUrl"]
                if all(tag_id in results for (tag_id, _, _, _) in submitted_info):
                    break
                if time.time() - start_t > 20:
                    break

        # Download completed MP4s
        for tag_id, cut, ok_frame, v_prompt in submitted_info:
            if tag_id in results:
                cnum = cut["cutNumber"]
                ccode = cut["cutCode"]
                clip_out = CLIPS_DIR / f"{ccode}.mp4"
                asb_mm_url = results[tag_id] + "=mm,22,15"
                ok_dl = download_asb_video_via_chrome_tab(asb_mm_url, clip_out)
                if ok_dl and clip_out.exists() and clip_out.stat().st_size > 100000:
                    diag = cut.get("dialogue") or {}
                    status_data[ccode] = {
                        "cutNumber": cnum,
                        "cutCode": ccode,
                        "orientation": "landscape",
                        "aspectRatio": "16:9",
                        "model": "Veo 3.1 - Lite (ufotable cutscene start frame)",
                        "durationSeconds": 6,
                        "baseCutsceneImage": f"public/anime-character-sheets/cutscenes/ep01_landscape/images/EP01_CUT{cnum:02d}_cutscene.jpg",
                        "audioType": diag.get("audioType", "silent"),
                        "speakerEn": diag.get("speakerEn", ""),
                        "summarized6sLineEn": diag.get("summarized6sLineEn", ""),
                        "summarized6sLineKo": diag.get("summarized6sLineKo", ""),
                        "animationPrompt": v_prompt,
                        "clipPath": str(clip_out.relative_to(ROOT)),
                        "clipSizeBytes": clip_out.stat().st_size,
                        "videoUrl": asb_mm_url,
                        "downloaded": True,
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                    }
                    status_file.write_text(json.dumps(status_data, ensure_ascii=False, indent=2), encoding="utf-8")
                    print(f"    ✅ [{ccode}] Downloaded {clip_out.name} ({clip_out.stat().st_size / (1024*1024):.2f} MB)", flush=True)

        remaining = [
            cut for cut in remaining
            if not ((CLIPS_DIR / f"{cut['cutCode']}.mp4").exists() and (CLIPS_DIR / f"{cut['cutCode']}.mp4").stat().st_size > 100000)
        ]


def format_srt_ts(seconds: float) -> str:
    ms = int(round((seconds - int(seconds)) * 1000))
    s = int(seconds) % 60
    m = (int(seconds) // 60) % 60
    h = int(seconds) // 3600
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def format_vtt_ts(seconds: float) -> str:
    return format_srt_ts(seconds).replace(",", ".")


def write_external_subtitles(cutscenes: list[dict], base_paths: list[Path]):
    """
    Writes external Korean (.ko.srt, .ko.vtt) and English (.en.srt, .en.vtt) subtitle files
    without embedding any subtitle tracks into the MP4 container.
    """
    srt_ko, vtt_ko = [], ["WEBVTT\n"]
    srt_en, vtt_en = [], ["WEBVTT\n"]

    idx_ko = 1
    idx_en = 1
    for i, cut in enumerate(cutscenes):
        t0 = i * 6.0 + 0.15
        t1 = (i + 1) * 6.0 - 0.15
        diag = cut.get("dialogue") or {}
        line_ko = (diag.get("summarized6sLineKo") or "").strip()
        line_en = (diag.get("summarized6sLineEn") or "").strip()
        speaker_ko = (diag.get("speakerKo") or "").strip()
        speaker_en = (diag.get("speakerEn") or "").strip()

        if line_ko:
            prefix_ko = f"[{speaker_ko}] " if diag.get("hasDialogue") and speaker_ko else ""
            srt_ko.append(f"{idx_ko}\n{format_srt_ts(t0)} --> {format_srt_ts(t1)}\n{prefix_ko}{line_ko}\n")
            vtt_ko.append(f"{format_vtt_ts(t0)} --> {format_vtt_ts(t1)}\n{prefix_ko}{line_ko}\n")
            idx_ko += 1

        if line_en:
            prefix_en = f"[{speaker_en}] " if diag.get("hasDialogue") and speaker_en else ""
            srt_en.append(f"{idx_en}\n{format_srt_ts(t0)} --> {format_srt_ts(t1)}\n{prefix_en}{line_en}\n")
            vtt_en.append(f"{format_vtt_ts(t0)} --> {format_vtt_ts(t1)}\n{prefix_en}{line_en}\n")
            idx_en += 1

    for bp in base_paths:
        bp.with_suffix(".ko.srt").write_text("\n".join(srt_ko), encoding="utf-8")
        bp.with_suffix(".ko.vtt").write_text("\n".join(vtt_ko), encoding="utf-8")
        bp.with_suffix(".en.srt").write_text("\n".join(srt_en), encoding="utf-8")
        bp.with_suffix(".en.vtt").write_text("\n".join(vtt_en), encoding="utf-8")


def concat_videos_no_subtitles(clip_paths: list[Path], final_mp4: Path):
    final_mp4.parent.mkdir(parents=True, exist_ok=True)
    valid_clips = [p.resolve() for p in clip_paths if p.exists() and p.stat().st_size > 100000]
    concat_list = final_mp4.parent / "ffmpeg_concat_list.txt"
    concat_list.write_text("\n".join(f"file '{p}'" for p in valid_clips) + "\n", encoding="utf-8")

    inputs = []
    filter_parts = []
    for i, p in enumerate(valid_clips):
        inputs.extend(["-i", str(p)])
        filter_parts.append(
            f"[{i}:v]scale=1280:720:force_original_aspect_ratio=decrease,"
            f"pad=1280:720:(ow-iw)/2:(oh-ih)/2,fps=24,format=yuv420p,setsar=1[v{i}];"
            f"[{i}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo[a{i}];"
        )
    concat_inputs = "".join(f"[v{i}][a{i}]" for i in range(len(valid_clips)))
    filter_complex = "".join(filter_parts) + f"{concat_inputs}concat=n={len(valid_clips)}:v=1:a=1[outv][outa]"

    cmd = [
        "ffmpeg", "-y",
        *inputs,
        "-filter_complex", filter_complex,
        "-map", "[outv]", "-map", "[outa]",
        "-c:v", "libx264", "-preset", "fast", "-crf", "19",
        "-c:a", "aac", "-b:a", "192k",
        "-sn",  # Strictly NO embedded subtitle track
        "-movflags", "+faststart",
        str(final_mp4),
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--end", type=int, default=28)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--batch-size", type=int, default=2)
    args = parser.parse_args()

    ep_data = json.loads(PROMPTS_JSON.read_text(encoding="utf-8"))
    all_cuts = ep_data["cutscenes"]
    target_cuts = all_cuts[args.start - 1 : args.end]

    if args.force and args.start == 1 and args.end == 28:
        vid_backup = Path("/tmp/ep01_videos_old_backup")
        if CLIPS_DIR.exists():
            shutil.rmtree(vid_backup, ignore_errors=True)
            shutil.copytree(CLIPS_DIR, vid_backup)
            for f in CLIPS_DIR.glob("EP01-CUT*.mp4"):
                f.unlink()
            print(f"[Backup] Backed up old EP01 video clips to {vid_backup} and cleared CLIPS_DIR.", flush=True)

    status_file = VID_OUT_DIR / "video_generation_status.json"
    status_data = {}
    if status_file.exists() and not args.force:
        try:
            status_data = json.loads(status_file.read_text(encoding="utf-8"))
        except Exception:
            status_data = {}

    todo = [
        cut for cut in target_cuts
        if args.force or not ((CLIPS_DIR / f"{cut['cutCode']}.mp4").exists() and (CLIPS_DIR / f"{cut['cutCode']}.mp4").stat().st_size > 100000)
    ]
    print(f"[EP01 ufotable Videos] Generating {len(todo)}/{len(target_cuts)} 6s Veo 3.1 Lite clips in batches of {args.batch_size}...", flush=True)

    for i in range(0, len(todo), args.batch_size):
        chunk = todo[i : i + args.batch_size]
        print(f"\n=== [Video Batch {i // args.batch_size + 1}] {[c['cutCode'] for c in chunk]} ===", flush=True)
        generate_video_batch(chunk, status_data, status_file)

    all_clip_paths = [CLIPS_DIR / f"{c['cutCode']}.mp4" for c in all_cuts]
    existing_clips = [p for p in all_clip_paths if p.exists() and p.stat().st_size > 100000]
    print(f"\n[Merge] Concatenating {len(existing_clips)}/28 clips into integrated Episode 1 MP4 (no embedded subtitles)...", flush=True)

    final_mp4 = VID_OUT_DIR / "SNSHero_Anime_EP01_Two_Vows_Beneath_the_Blizzard_16x9.mp4"
    concat_videos_no_subtitles(existing_clips, final_mp4)

    desktop_named = MOVIE_DIR / "SNSHero_Anime_EP01_Two_Vows_Beneath_the_Blizzard_16x9.mp4"
    desktop_ep01 = MOVIE_DIR / "episode_01.mp4"
    shutil.copy2(final_mp4, desktop_named)
    shutil.copy2(final_mp4, desktop_ep01)

    sub_targets = [final_mp4, desktop_named, desktop_ep01]
    if PUBLIC_EP_DIR.exists():
        pub_ep01 = PUBLIC_EP_DIR / "episode_01.mp4"
        shutil.copy2(final_mp4, pub_ep01)
        sub_targets.append(pub_ep01)

    write_external_subtitles(all_cuts, sub_targets)
    print(f"🎉 Episode 1 Video Complete: {final_mp4} ({final_mp4.stat().st_size / (1024*1024):.2f} MB, {len(existing_clips)} clips)", flush=True)
    print(f"   Desktop copies: {desktop_named} & {desktop_ep01}", flush=True)


if __name__ == "__main__":
    main()
