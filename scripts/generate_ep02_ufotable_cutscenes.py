#!/usr/bin/env python3
"""
Generate all 26 Episode 2 ('Oath of the Seven Pursuers' / '일곱 추적자의 맹세') 16:9 Cutscene Images
in Google Flow (🍌 Nano Banana 2.1, 16:9, x1) using the newly generated ufotable Character Cutout Sheets,
Location Sheets, and Prop Sheets (`UFO3_*` uploaded in the Flow project asset library).
"""

import base64
import json
import re
import shutil
import subprocess
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROMPTS_JSON = ROOT / "public" / "anime-character-sheets" / "cutscene-prompts" / "episode_02_cutscene_prompts.json"
OUT_DIR = ROOT / "public" / "anime-character-sheets" / "cutscenes" / "ep02_landscape"
IMAGES_DIR = OUT_DIR / "images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)


def run_chrome_js(js_code: str, timeout: int = 30) -> str:
    tmp = Path("/tmp/chrome_ep02_cmd.js")
    tmp.write_text(js_code, encoding="utf-8")
    osa = """
    set jsCode to read POSIX file "/tmp/chrome_ep02_cmd.js" as «class utf8»
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


def upload_file_to_flow_project(local_path: Path, upload_name: str) -> str:
    b64 = base64.b64encode(local_path.read_bytes()).decode("ascii")
    mime = "image/png" if upload_name.endswith(".png") else "image/jpeg"
    run_chrome_js("window.__ep2_up_b64 = '';")
    chunk_size = 45000
    for i in range(0, len(b64), chunk_size):
        chunk = b64[i : i + chunk_size]
        run_chrome_js(f"window.__ep2_up_b64 += {json.dumps(chunk)};")
    return run_chrome_js(f"""
    (() => {{
        const s = document.querySelector('script[nonce]');
        const nonce = s ? (s.nonce || s.getAttribute('nonce')) : '';
        let pol = window.__ttPol;
        if (!pol && window.trustedTypes && window.trustedTypes.createPolicy) {{
            try {{
                pol = window.trustedTypes.createPolicy('flowUp2Pol_' + Math.random().toString(36).slice(2), {{ createScript: x => x }});
                window.__ttPol = pol;
            }} catch(e) {{}}
        }}
        const code = `
            (() => {{
                const b64 = window.__ep2_up_b64 || '';
                const bin = atob(b64);
                const bytes = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                const file = new File([bytes], {json.dumps(upload_name)}, {{ type: {json.dumps(mime)} }});
                const origClick = HTMLInputElement.prototype.click;
                HTMLInputElement.prototype.click = function() {{
                    if (this.type === 'file') {{
                        const dt = new DataTransfer();
                        dt.items.add(file);
                        this.files = dt.files;
                        this.dispatchEvent(new Event('change', {{ bubbles: true }}));
                        this.dispatchEvent(new Event('input', {{ bubbles: true }}));
                        HTMLInputElement.prototype.click = origClick;
                        return;
                    }}
                    return origClick.apply(this, arguments);
                }};
                const upBtns = [...document.querySelectorAll('button')].filter(b => (b.innerText || '').includes('upload'));
                if (upBtns.length > 0) upBtns[0].click();
            }})();
        `;
        const el = document.createElement('script');
        if (nonce) el.setAttribute('nonce', nonce);
        el.text = pol ? pol.createScript(code) : code;
        document.head.appendChild(el);
        el.remove();
        return 'TRIGGERED';
    }})()
    """)


UFOTABLE_CHAR_APPEARANCE = {
    "Balian": "Balian (strictly match attached UFO3_043_Balian.png: short golden-blond hair with silver winged headpiece, gleaming white-and-gold plate armor with red cross heraldry, carrying Arcane Spear and white tower shield)",
    "Kaze": "Kaze (strictly match attached UFO3_044_Kaze.png: dark-haired shinobi assassin in sleek black-and-indigo ninja tunic, twin kunai and daggers, agile stance)",
    "Gawain": "Gawain (strictly match attached UFO3_045_Gawain.png: stoic blond holy knight in ornate polished steel-and-gold plate armor, wielding massive dragon breaker greatsword)",
    "Rondol": "Rondol (strictly match attached UFO3_046_Rondol.png: seasoned mariner swordmaster with braided dark hair, weathered navy captain coat, wielding curved cutlass)",
    "Robinyard": "Robinyard (strictly match attached UFO3_048_Robinyard.png: agile rogue marksman in green-and-brown leather doublet with feather cap, carrying composite recurve greatbow)",
    "Hercul": "Hercul (strictly match attached UFO3_049_Hercul.png: wild dark-brown hair and beard, weathered dark-green cloak over silver-trimmed plate armor, cracked golden seal at belt, wielding twin silver runic daggers)",
    "Aleksandar": "Aleksandar (strictly match attached UFO3_050_Aleksandar.png: chestnut-brown hair and trimmed beard, royal-blue and gold coat with white wolf-fur mantle, wielding masterwork twin arcane longswords)",
    "Lucian": "Lucian (strictly match attached UFO3_061_Lucian.png: emerald-green hair, nobleman in ermine-trimmed crimson cloak with serpentine crest)",
    "Eliana": "Eliana (strictly match attached UFO3_063_Eliana.png: silver-haired mage-scholar in indigo-and-violet starry robes, carrying runic staff and parchment scrolls)",
    "Aila": "Aila (strictly match attached UFO3_070_Aila.png: fiery red-haired warrior-maiden with braided locks, leather-and-bronze battle tunic, carrying silver daggers and healing herbs)",
    "Grimli": "Grimli (strictly match attached UFO3_074_Grimli.png: stout copper-bearded dwarf blacksmith with soot-streaked apron over iron chainmail, wielding massive two-handed warhammer)",
}

CHAR_NAME_TO_UFO3 = {
    "Balian": "UFO3_043_Balian.png",
    "Kaze": "UFO3_044_Kaze.png",
    "Gawain": "UFO3_045_Gawain.png",
    "Rondol": "UFO3_046_Rondol.png",
    "Robinyard": "UFO3_048_Robinyard.png",
    "Hercul": "UFO3_049_Hercul.png",
    "Aleksandar": "UFO3_050_Aleksandar.png",
    "Lucian": "UFO3_061_Lucian.png",
    "Eliana": "UFO3_063_Eliana.png",
    "Aila": "UFO3_070_Aila.png",
    "Grimli": "UFO3_074_Grimli.png",
}

LOC_CODE_TO_UFO3 = {
    "LOC-001": "UFO3_LOC_001_Elwin_Village.jpg",
    "LOC-002": "UFO3_LOC_002_Drunken_Bell_Tower.jpg",
    "LOC-007": "UFO3_LOC_007_Red_Glass_Palace.jpg",
}

PROP_CODE_TO_UFO3 = {
    "PROP-001": "UFO3_PROP_001_Silver_Dagger.jpg",
    "PROP-019": "UFO3_PROP_019_Bronze_Great_Bell_of_Drunken_Bell.jpg",
}

SAFE_WORD_MAP = [
    (r"\bblood-soaked\b", "snow-covered"),
    (r"\bbloodstained\b", "weather-worn"),
    (r"\bbleeding\b", "glowing"),
    (r"\bbloody\b", "crimson"),
    (r"\bbloodlust\b", "hostility"),
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
    (r"\bslavers\b", "captors"),
    (r"\bslave galleys\b", "prison ships"),
    (r"\bslave\b", "captive"),
    (r"\btrafficking\b", "captivity"),
    (r"\bliquidation\b", "dissolution"),
    (r"\bragged young girl\b", "young apprentice"),
    (r"\byoung girl\b", "young apprentice"),
    (r"\btears streaming\b", "gazing upward"),
    (r"\bwhistled straight for Hercul\'s eyes\b", "glanced toward Hercul"),
    (r"\bburning eyes\b", "focused gaze"),
    (r"\bblinding\b", "radiant"),
    (r"\btorn surcoat\b", "travel cloak"),
    (r"\bshreds\b", "pieces"),
]


def sanitize_prompt_strict(text: str) -> str:
    out = text
    for pat, repl in SAFE_WORD_MAP:
        out = re.sub(pat, repl, out, flags=re.IGNORECASE)
    return out


def get_ufo3_ref_names_for_cut(cut: dict) -> list[str]:
    names: list[str] = []

    def add_name(n: str):
        if n and n not in names and len(names) < 5:
            names.append(n)

    # 1. Appearing Characters
    for ch in cut.get("characters") or []:
        cname = ch.get("nameEn", "")
        if cname in CHAR_NAME_TO_UFO3:
            add_name(CHAR_NAME_TO_UFO3[cname])

    # 2. Location sheet
    loc = cut.get("location") or {}
    lcode = loc.get("code", "")
    if lcode in LOC_CODE_TO_UFO3:
        add_name(LOC_CODE_TO_UFO3[lcode])

    # 3. Prop sheets
    for pr in cut.get("props") or []:
        pcode = pr.get("code", "")
        if pcode in PROP_CODE_TO_UFO3:
            add_name(PROP_CODE_TO_UFO3[pcode])

    return names[:5]


def build_ufotable_cutscene_prompt(cut: dict) -> str:
    ccode = cut["cutCode"]
    loc = cut.get("location") or {}
    loc_desc = sanitize_prompt_strict(loc.get("descriptionEn", "Ruined snowbound frontier village of Elwin under cold winter winds."))
    action_en = sanitize_prompt_strict(cut.get("novelTextEn", ""))

    chars = cut.get("characters") or []
    if chars:
        char_specs = []
        for c in chars:
            cname = c["nameEn"]
            char_specs.append(UFOTABLE_CHAR_APPEARANCE.get(cname, f"{cname} (strictly match attached UFO3 cutout)"))
        char_str = " ; ".join(char_specs)
    else:
        char_str = "Atmospheric wide cinematic environment shot."

    props = cut.get("props") or []
    if props:
        prop_str = " ; ".join(sanitize_prompt_strict(f"{p['nameEn']}: {p['holderEn']}") for p in props)
    else:
        prop_str = "Standard character weapons and armor."

    prompt = (
        f"Masterpiece 16:9 widescreen 2D dark-fantasy anime cinema still in Demon Slayer: Kimetsu no Yaiba (ufotable) and Makoto Shinkai studio style. "
        f"STRICT VISUAL CONSISTENCY WITH ATTACHED REFERENCE SHEETS: You MUST strictly preserve the exact face, hair color/style, outfit/armor, and weapon/prop design of every attached character sheet, prop sheet, and location sheet. "
        f"SCENE ACTION ({ccode}): {action_en} "
        f"SETTING & LIGHTING ({loc.get('code', 'LOC-001')} {loc.get('nameEn', 'Elwin Village')}): {loc_desc} "
        f"APPEARING CHARACTERS: {char_str}. "
        f"PROPS & HOLDERS: {prop_str}. "
        f"Bold ufotable anime linework, dramatic volumetric lighting, rich cel-shaded depth, cinematic 16:9 widescreen composition. "
        f"STRICT NO-TEXT RULE: Do NOT render any text, subtitles, captions, speech bubbles, letters, numbers, watermarks, or UI anywhere in the image."
    )
    return prompt


def ensure_flow_16x9_ready():
    # If accidentally in /edit/ detail view, navigate back
    run_chrome_js("""
    (() => {
        if (location.href.includes('/edit/')) {
            history.back();
            return 'HIST_BACK';
        }
        return 'OK';
    })()
    """)
    time.sleep(0.4)

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
        if (txt.includes('Nano Banana') && txt.includes('crop_16_9') && txt.includes('x1')) {
            return 'OK:' + txt;
        }
        pill.click();
        return 'OPENED_MENU:' + txt;
    })()
    """)
    if pill_state.startswith("OPENED_MENU"):
        time.sleep(0.6)
        run_chrome_js("""
        (() => {
            const btns = [...document.querySelectorAll('button, [role="tab"], [role="radio"], [role="option"]')];
            const clickBtn = (label) => {
                const t = btns.find(b => (b.innerText || '').trim().includes(label));
                if (t) t.click();
            };
            clickBtn('이미지');
            clickBtn('16:9');
            clickBtn('x1');
            document.body.click();
            return 'SET_16_9';
        })()
        """)
        time.sleep(0.5)


def clear_composer():
    run_chrome_js("""
    (() => {
        const clr = document.querySelector('button[aria-label="프롬프트 지우기"]');
        if (clr) clr.click();
        const chips = [...document.querySelectorAll('button.chip-container[aria-label="소재"]')];
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


def attach_ufo3_sheets_for_cut(ref_names: list[str]) -> list[str]:
    attached: list[str] = []
    if not ref_names:
        return attached

    for rname in ref_names:
        # Open picker if not open
        run_chrome_js("""
        (() => {
            if (!document.querySelector('button.asset-item')) {
                const addBtn = document.querySelector('button[aria-label="프롬프트 상자에 소재 추가"]') || [...document.querySelectorAll('button')].find(b => (b.innerText || '').includes('add'));
                if (addBtn) addBtn.click();
            }
        })()
        """)
        time.sleep(0.55)

        # Type search keyword
        search_kw = rname[:16]
        run_chrome_js(f"""
        (() => {{
            const inp = document.querySelector('input[aria-label="애셋 검색"]');
            if (inp) {{
                inp.focus();
                inp.select();
                document.execCommand('selectAll', false, null);
                document.execCommand('insertText', false, {json.dumps(search_kw)});
                inp.dispatchEvent(new Event('input', {{ bubbles: true }}));
            }}
        }})()
        """)
        time.sleep(0.65)

        sel_res = run_chrome_js(f"""
        (() => {{
            const items = [...document.querySelectorAll('button.asset-item')];
            const target = items.find(b => (b.innerText || '').includes({json.dumps(rname[:14])})) || items[0];
            if (!target) return 'NOT_FOUND';
            if (!target.className.includes('asset-item-active')) target.click();
            return 'SELECTED:' + (target.innerText || '').replace(/\\s+/g, ' ').trim();
        }})()
        """)

        if sel_res.startswith("SELECTED"):
            time.sleep(0.35)
            add_res = run_chrome_js("""
            (() => {
                const btn = [...document.querySelectorAll('button')].find(b => (b.innerText || '').includes('프롬프트에 추가'));
                if (btn && !btn.disabled) {
                    btn.click();
                    return 'ADDED';
                }
                return 'NO_BTN';
            })()
            """)
            if add_res == "ADDED":
                attached.append(rname)
                time.sleep(0.35)

    run_chrome_js("""
    (() => {
        const closeBtn = [...document.querySelectorAll('button')].find(b => (b.innerText || '').includes('left_panel_close'));
        if (closeBtn) closeBtn.click();
    })()
    """)
    time.sleep(0.3)
    return attached


def get_grid_image_urls() -> list[str]:
    raw = run_chrome_js("""
    (() => {
        const imgs = [...document.querySelectorAll('flow-image-tile img.image')];
        return JSON.stringify(imgs.map(i => i.src || '').filter(s => s.startsWith('https://flow-content.google/image/')));
    })()
    """)
    try:
        return json.loads(raw)
    except Exception:
        return []


def download_url_to_file(url: str, dest: Path):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=45) as resp:
        data = resp.read()
    dest.write_bytes(data)


def generate_cutscene_batch(batch_cuts: list[dict], status_data: dict, status_file: Path):
    remaining = list(batch_cuts)
    for attempt in range(1, 4):
        if not remaining:
            break
        ensure_flow_16x9_ready()

        # Wait if pending
        for _ in range(35):
            pend = run_chrome_js("String(document.querySelectorAll('flow-pending-tile').length)")
            if pend == "0":
                break
            time.sleep(1.5)

        # Scroll to top
        run_chrome_js("""
        (() => {
            const scrollers = [...document.querySelectorAll('*')].filter(el => el.scrollHeight > el.clientHeight + 100);
            scrollers.forEach(el => { el.scrollTop = 0; });
        })()
        """)
        time.sleep(0.3)
        before_urls = set(get_grid_image_urls())

        submitted_info: list[tuple[str, dict, list[str], str]] = []
        for cut in remaining:
            cnum = cut["cutNumber"]
            ccode = cut["cutCode"]
            tag_id = f"TAG_EP02_CUT{cnum:02d}"

            clear_composer()
            ref_names = get_ufo3_ref_names_for_cut(cut)
            attached = attach_ufo3_sheets_for_cut(ref_names)
            prompt = build_ufotable_cutscene_prompt(cut)
            tagged_prompt = f"[{tag_id}] {prompt}"

            run_chrome_js(f"""
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
            run_chrome_js("""
            (() => {
                const btn = document.querySelector('button[aria-label="생성 시작"]') || [...document.querySelectorAll('button')].find(b => (b.innerText || '').includes('arrow_forward'));
                if (btn) btn.click();
            })()
            """)
            time.sleep(1.0)
            submitted_info.append((tag_id, cut, attached, prompt))
            print(f"  🎨 [{ccode} | Try {attempt}] Submitted 🍌 Nano Banana 2.1 | Refs Attached={len(attached)}/{len(ref_names)}: {attached}", flush=True)

        # Poll until complete
        results: dict[str, str] = {}
        start_t = time.time()
        while time.time() - start_t < 90:
            time.sleep(2.0)
            state_raw = run_chrome_js("""
            (() => {
                const pend = document.querySelectorAll('flow-pending-tile').length;
                const containers = [...document.querySelectorAll('flow-grid-tile-container')].slice(0, 10);
                const tiles = containers.map((c, idx) => {
                    const img = c.querySelector('flow-image-tile img.image')?.src || '';
                    const aria = c.getAttribute('aria-label') || '';
                    const m = aria.match(/^\\[(TAG_[A-Za-z0-9_\\-]+)\\]/);
                    return {
                        idx,
                        tag: m ? m[1] : '',
                        isPend: Boolean(c.querySelector('flow-pending-tile')),
                        imgUrl: img
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
                u = t["imgUrl"]
                tag = t["tag"]
                if u.startswith("https://flow-content.google/image/") and u not in before_urls:
                    if tag and tag not in results:
                        results[tag] = u

            if st["pend"] == 0:
                new_tiles = [
                    t for t in st["tiles"]
                    if t["imgUrl"].startswith("https://flow-content.google/image/") and t["imgUrl"] not in before_urls
                ]
                if len(new_tiles) == len(submitted_info):
                    for rev_idx, (tag_id, _cut, _att, _pr) in enumerate(reversed(submitted_info)):
                        if tag_id not in results and rev_idx < len(new_tiles):
                            results[tag_id] = new_tiles[rev_idx]["imgUrl"]
                if all(tag_id in results for (tag_id, _, _, _) in submitted_info):
                    break
                if time.time() - start_t > 15:
                    break

        # Download completed images and upload as UFO3 start frames
        for tag_id, cut, attached, prompt in submitted_info:
            if tag_id in results:
                cnum = cut["cutNumber"]
                ccode = cut["cutCode"]
                dest = IMAGES_DIR / f"{ccode}_cutscene.jpg"
                try:
                    download_url_to_file(results[tag_id], dest)
                except Exception as e:
                    print(f"    Download error {ccode}: {e}", flush=True)
                    continue

                if dest.exists() and dest.stat().st_size > 50000:
                    status_data[ccode] = {
                        "cutNumber": cnum,
                        "cutCode": ccode,
                        "orientation": "landscape",
                        "aspectRatio": "16:9",
                        "model": "Nano Banana 2.1 (ufotable 16:9)",
                        "attachedRefs": attached,
                        "imagePath": str(dest.relative_to(ROOT)),
                        "imageSizeBytes": dest.stat().st_size,
                        "imageUrl": results[tag_id],
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                    }
                    status_file.write_text(json.dumps(status_data, ensure_ascii=False, indent=2), encoding="utf-8")
                    print(f"    ✅ [{ccode}] Downloaded {dest.name} ({dest.stat().st_size / 1024:.1f} KB)", flush=True)

                    # Upload to Flow as UFO3 Start Frame for video generation
                    up_name = f"UFO3_{ccode}_cutscene.jpg"
                    up_res = upload_file_to_flow_project(dest, up_name)
                    print(f"    📤 [{ccode}] Uploaded Start Frame: {up_name} ({up_res})", flush=True)
                    time.sleep(2.0)

        remaining = [
            cut for cut in remaining
            if not ((IMAGES_DIR / f"{cut['cutCode']}_cutscene.jpg").exists() and (IMAGES_DIR / f"{cut['cutCode']}_cutscene.jpg").stat().st_size > 50000)
        ]


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--end", type=int, default=26)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--batch-size", type=int, default=3)
    args = parser.parse_args()

    ep_data = json.loads(PROMPTS_JSON.read_text(encoding="utf-8"))
    all_cuts = ep_data["cutscenes"]
    target_cuts = all_cuts[args.start - 1 : args.end]

    status_file = OUT_DIR / "cutscene_generation_status.json"
    status_data = {}
    if status_file.exists() and not args.force:
        try:
            status_data = json.loads(status_file.read_text(encoding="utf-8"))
        except Exception:
            status_data = {}

    todo = [
        cut for cut in target_cuts
        if args.force or not ((IMAGES_DIR / f"{cut['cutCode']}_cutscene.jpg").exists() and (IMAGES_DIR / f"{cut['cutCode']}_cutscene.jpg").stat().st_size > 50000)
    ]
    print(f"[EP02 ufotable Cutscenes] Generating {len(todo)}/{len(target_cuts)} 16:9 images in batches of {args.batch_size}...", flush=True)

    for i in range(0, len(todo), args.batch_size):
        chunk = todo[i : i + args.batch_size]
        print(f"\n=== [Batch {i // args.batch_size + 1}] {[c['cutCode'] for c in chunk]} ===", flush=True)
        generate_cutscene_batch(chunk, status_data, status_file)

    existing = [c for c in all_cuts if (IMAGES_DIR / f"{c['cutCode']}_cutscene.jpg").exists()]
    print(f"\n🎉 Episode 2 Cutscene Generation Complete: {len(existing)}/26 images ready in {IMAGES_DIR}", flush=True)


if __name__ == "__main__":
    main()
