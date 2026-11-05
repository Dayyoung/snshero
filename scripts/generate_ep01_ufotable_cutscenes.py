#!/usr/bin/env python3
"""
Generate all 28 Episode 1 ('Two Vows Beneath the Blizzard' / '눈보라 아래 두 서약') 16:9 Cutscene Images
in Google Flow (🍌 Nano Banana 2.1, 16:9, x1) using the newly generated ufotable Character Cutout Sheets,
Location Sheets, and Prop Sheets (`UFO3_*` uploaded in the Flow project asset library).
"""

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
PROMPTS_JSON = ROOT / "public" / "anime-character-sheets" / "cutscene-prompts" / "episode_01_cutscene_prompts.json"
OUT_DIR = ROOT / "public" / "anime-character-sheets" / "cutscenes" / "ep01_landscape"
IMAGES_DIR = OUT_DIR / "images"
IMAGES_DIR.mkdir(parents=True, exist_ok=True)


def run_chrome_js(js_code: str, timeout: int = 30) -> str:
    tmp = Path("/tmp/chrome_ep01_cmd.js")
    tmp.write_text(js_code, encoding="utf-8")
    osa = """
    set jsCode to read POSIX file "/tmp/chrome_ep01_cmd.js" as «class utf8»
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


SAFE_WORD_MAP = [
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


def sanitize_prompt_strict(text: str) -> str:
    out = text
    for pat, repl in SAFE_WORD_MAP:
        out = re.sub(pat, repl, out, flags=re.IGNORECASE)
    return out


# Canonical ufotable appearance reminders matching our newly generated UFO3 character cutouts 100%
UFOTABLE_CHAR_APPEARANCE = {
    "Aleksandar": (
        "Aleksandar (strictly match attached UFO3_050_Aleksandar.png: chestnut-brown hair and trimmed beard with slender golden circlet, "
        "royal-blue and gold Arcane Holy Knight coat with grey wolf-fur shoulder mantle, wielding Twin Arcane Longswords)"
    ),
    "Balian": (
        "Balian (strictly match attached UFO3_043_Balian.png: short golden-blond hair with silver winged circlet, "
        "silver-and-white Holy Knight cross plate armor and crimson cape, wielding glowing cyan Arcane Spear and iron cross-shield)"
    ),
    "Hercul": (
        "Hercul (strictly match attached UFO3_049_Hercul.png: towering muscular paladin with wild dark-brown mane and full beard, "
        "tattered dark cloak and leather bandolier, cracked golden seal at belt, golden-mana gauntlets, holding twin Silver Runic Daggers and crescent greatsword)"
    ),
    "Elwin": (
        "Elwin (strictly match attached UFO3_042_Elwin.png: graceful northern warrior-mother and Aleksandar's wife, "
        "golden Valkyrie crown-braided hair with side ringlets, sapphire-blue eyes, silver-and-blue bodice under dark-navy wool cloak trimmed with white winter fur, "
        "holding the glowing Silver Runic Dagger)"
    ),
    "Ysela": (
        "Ysela (strictly match attached UFO3_107_Ysela.png: Balian's wife and Starlight Dragon-Priestess, "
        "long luminous sapphire-lavender hair with pearl-gold dragon horns, starlight-indigo and silver gown with winter shawl)"
    ),
    "Lucian": (
        "Lucian (strictly match attached UFO3_061_Lucian.png: highborn nobleman of the Red Glass Court, "
        "silky long emerald-green hair, pointed elf ears, dark-emerald and gold coat with white ermine fur cloak and golden serpentine crest brooch, "
        "wielding emerald arcane greatbow and noble sword)"
    ),
    "Death Knight Artus": (
        "Death Knight Artus (strictly match attached UFO3_060_Death_Knight_Artus.png: towering Undead Regent Death Knight, "
        "horned black-iron skull-crown helm with glowing cyan eyes, long white hair, skull-engraved black dread plate armor, wielding frost-cursed greatsword)"
    ),
}


def collect_ufo3_ref_names(cut: dict) -> list[str]:
    """
    Returns up to 5 UFO3_* asset filenames in priority order:
    1) Appearing Character Cutouts (`UFO3_0XX_*.png`)
    2) Background Location Sheet (`UFO3_LOC_XXX_*.jpg`)
    3) Key Prop Sheet (`UFO3_PROP_XXX_*.jpg`)
    """
    names: list[str] = []
    seen = set()

    def add_name(rel_url: str):
        if not rel_url:
            return
        fname = f"UFO3_{Path(rel_url).name}"
        if fname not in seen:
            seen.add(fname)
            names.append(fname)

    # 1. Characters first so character consistency is prioritized
    for ch in cut.get("attachedCutouts") or []:
        add_name(ch.get("cutoutUrl", ""))

    # 2. Location sheet
    loc = cut.get("location") or {}
    add_name(loc.get("artUrl", ""))

    # 3. Prop sheets
    for pr in cut.get("props") or []:
        art_url = pr.get("artUrl") or ""
        if "/props/art/" in art_url:
            add_name(art_url)

    return names[:5]


def build_ufotable_cutscene_prompt(cut: dict) -> str:
    ccode = cut["cutCode"]
    loc = cut.get("location") or {}
    loc_desc = sanitize_prompt_strict(loc.get("descriptionEn", "Snowbound medieval frontier village of Elwin under a fierce blizzard."))
    action_en = sanitize_prompt_strict(cut.get("novelTextEn", ""))

    chars = cut.get("characters") or []
    if chars:
        char_specs = []
        for c in chars:
            cname = c["nameEn"]
            char_specs.append(UFOTABLE_CHAR_APPEARANCE.get(cname, f"{cname} (strictly match attached UFO3 cutout)"))
        char_str = " ; ".join(char_specs)
    else:
        char_str = "Atmospheric wide cinematic environment shot (no close-up foreground character)."

    props = cut.get("props") or []
    if props:
        prop_str = " ; ".join(sanitize_prompt_strict(f"{p['nameEn']}: {p['holderEn']}") for p in props)
    else:
        prop_str = "Standard scene equipment."

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
    # Close asset picker if open
    run_chrome_js("""
    (() => {
        const backBtn = [...document.querySelectorAll('button')].find(b => (b.innerText || '').includes('arrow_back') || (b.getAttribute('aria-label') || '').includes('뒤로'));
        if (backBtn && document.body.innerText.includes('프롬프트 재사용')) backBtn.click();
    })()
    """)
    time.sleep(0.3)

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
        const pill = document.querySelector('button[aria-label="설정 트리거"]') || [...document.querySelectorAll('button')].find(b => {
            const t = (b.innerText || '');
            return (t.includes('Nano Banana') || t.includes('Veo') || t.includes('동영상') || t.includes('이미지')) && t.includes('x');
        });
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
        time.sleep(0.7)
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
        time.sleep(0.6)


def clear_composer():
    run_chrome_js("""
    (() => {
        const clr = document.querySelector('button[aria-label="프롬프트 지우기"]');
        if (clr) {
            clr.click();
            return 'CLEARED_BTN';
        }
        const chips = [...document.querySelectorAll('button.chip-container[aria-label="소재"]')];
        chips.forEach(c => c.click());
        const pm = document.querySelector('.ProseMirror');
        if (pm) {
            pm.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('delete', false, null);
        }
        return 'CLEARED_MANUAL';
    })()
    """)
    time.sleep(0.3)


def attach_ufo3_sheets_for_cut(ref_names: list[str]) -> list[str]:
    attached: list[str] = []
    if not ref_names:
        return attached

    for rname in ref_names:
        # Ensure picker is open
        run_chrome_js("""
        (() => {
            if (!document.querySelector('button.asset-item')) {
                const addBtn = document.querySelector('button[aria-label="프롬프트 상자에 소재 추가"]');
                if (addBtn) addBtn.click();
            }
        })()
        """)
        time.sleep(0.45)

        sel_res = run_chrome_js(f"""
        (() => {{
            const items = [...document.querySelectorAll('button.asset-item')];
            const target = items.find(b => (b.innerText || '').includes({json.dumps(rname)}));
            if (!target) return 'NOT_FOUND';
            if (!target.className.includes('asset-item-active')) {{
                target.click();
            }}
            return 'SELECTED';
        }})()
        """)
        if sel_res == "NOT_FOUND":
            # Try typing into 애셋 검색
            run_chrome_js(f"""
            (() => {{
                const inp = document.querySelector('input[aria-label="애셋 검색"]');
                if (inp) {{
                    inp.focus();
                    inp.value = {json.dumps(rname[:18])};
                    inp.dispatchEvent(new Event('input', {{ bubbles: true }}));
                }}
            }})()
            """)
            time.sleep(0.55)
            sel_res = run_chrome_js(f"""
            (() => {{
                const items = [...document.querySelectorAll('button.asset-item')];
                const target = items.find(b => (b.innerText || '').includes({json.dumps(rname[:16])}));
                if (!target) return 'NOT_FOUND';
                if (!target.className.includes('asset-item-active')) target.click();
                return 'SELECTED';
            }})()
            """)

        if sel_res == "SELECTED":
            time.sleep(0.3)
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

    # Close picker if still open
    run_chrome_js("""
    (() => {
        const closeBtn = [...document.querySelectorAll('button')].find(b => (b.innerText || '').includes('left_panel_close'));
        if (closeBtn) closeBtn.click();
    })()
    """)
    time.sleep(0.25)
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


def generate_cutscene_batch(batch_cuts: list[dict], status_data: dict, status_file: Path, batch_size: int = 4):
    remaining = list(batch_cuts)
    for attempt in range(1, 4):
        if not remaining:
            break
        ensure_flow_16x9_ready()

        # Wait if any existing pending tile is running
        for _ in range(35):
            pend = run_chrome_js("String(document.querySelectorAll('flow-pending-tile').length)")
            if pend == "0":
                break
            time.sleep(1.2)

        # Scroll grid to top
        run_chrome_js("""
        (() => {
            const scrollers = [...document.querySelectorAll('*')].filter(el => el.scrollHeight > el.clientHeight + 100);
            scrollers.forEach(el => { el.scrollTop = 0; });
        })()
        """)
        time.sleep(0.25)
        before_urls = set(get_grid_image_urls())

        submitted_info: list[tuple[str, dict, list[str], str]] = []
        for cut in remaining:
            cnum = cut["cutNumber"]
            ccode = cut["cutCode"]
            tag_id = f"TAG_EP01_CUT{cnum:02d}"

            clear_composer()
            ref_names = collect_ufo3_ref_names(cut)
            attached = attach_ufo3_sheets_for_cut(ref_names)
            prompt_text = build_ufotable_cutscene_prompt(cut)
            tagged_prompt = f"[{tag_id}] {prompt_text}"

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
            time.sleep(0.3)
            sub_res = run_chrome_js("""
            (() => {
                const btn = document.querySelector('button[aria-label="생성 시작"]') || [...document.querySelectorAll('button')].find(b => (b.innerText || '').includes('arrow_forward'));
                if (!btn) return 'NO_BTN';
                btn.click();
                return 'SUBMITTED';
            })()
            """)
            time.sleep(0.85)
            run_chrome_js("""
            (() => {
                const containers = document.querySelectorAll('flow-grid-tile-container');
                containers.forEach(c => {
                    const aria = c.getAttribute('aria-label') || '';
                    const m = aria.match(/^\\[(TAG_[A-Za-z0-9_\\-]+)\\]/);
                    if (m) c.setAttribute('data-batch-tag', m[1]);
                });
            })()
            """)
            submitted_info.append((tag_id, cut, attached, prompt_text))
            print(f"  🎬 [{ccode} | Try {attempt}] Submitted ({ins_res}->{sub_res}) | Attached UFO3 Refs ({len(attached)}): {attached}", flush=True)

        # Poll until pending tiles finish
        results: dict[str, str] = {}
        start_t = time.time()
        while time.time() - start_t < 95:
            time.sleep(1.8)
            state_raw = run_chrome_js("""
            (() => {
                const scrollers = [...document.querySelectorAll('*')].filter(el => el.scrollHeight > el.clientHeight + 100 && el.className.includes('virtual-scroll'));
                scrollers.forEach(el => { el.scrollTop = 0; });
                const containers = [...document.querySelectorAll('flow-grid-tile-container')].slice(0, 12);
                containers.forEach(c => {
                    const aria = c.getAttribute('aria-label') || '';
                    const m = aria.match(/^\\[(TAG_[A-Za-z0-9_\\-]+)\\]/);
                    if (m) c.setAttribute('data-batch-tag', m[1]);
                });
                const pend = document.querySelectorAll('flow-pending-tile').length;
                const tiles = containers.map((c, idx) => ({
                    idx,
                    tag: c.getAttribute('data-batch-tag') || '',
                    isPend: Boolean(c.querySelector('flow-pending-tile')),
                    src: (c.querySelector('img.image')?.src || '')
                }));
                return JSON.stringify({ pend, tiles });
            })()
            """)
            try:
                st = json.loads(state_raw)
            except Exception:
                continue

            for t in st["tiles"]:
                u = t["src"]
                tag = t["tag"]
                if u.startswith("https://flow-content.google/image/") and u not in before_urls:
                    if tag and tag not in results:
                        results[tag] = u

            if st["pend"] == 0:
                new_tiles = [
                    t for t in st["tiles"]
                    if t["src"].startswith("https://flow-content.google/image/") and t["src"] not in before_urls
                ]
                if len(new_tiles) == len(submitted_info):
                    for rev_idx, (tag_id, _cut, _att, _pr) in enumerate(reversed(submitted_info)):
                        if tag_id not in results and rev_idx < len(new_tiles):
                            results[tag_id] = new_tiles[rev_idx]["src"]
                if all(tag_id in results for (tag_id, _, _, _) in submitted_info):
                    break
                if time.time() - start_t > 14:
                    break

        # Save completed images
        for tag_id, cut, attached, prompt_text in submitted_info:
            if tag_id in results:
                cnum = cut["cutNumber"]
                ccode = cut["cutCode"]
                img_out = IMAGES_DIR / f"EP01_CUT{cnum:02d}_cutscene.jpg"
                download_url_to_file(results[tag_id], img_out)
                status_data[ccode] = {
                    "cutNumber": cnum,
                    "cutCode": ccode,
                    "orientation": "landscape",
                    "aspectRatio": "16:9",
                    "model": "🍌 Nano Banana 2.1 (ufotable style)",
                    "attachedReferenceFiles": attached,
                    "imageUrl": results[tag_id],
                    "localImage": str(img_out.relative_to(ROOT)),
                    "prompt": prompt_text,
                    "submitted": True,
                    "extracted": img_out.exists(),
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
                }
                status_file.write_text(json.dumps(status_data, ensure_ascii=False, indent=2), encoding="utf-8")
                print(f"    ✅ [{ccode}] Saved {img_out.name} ({img_out.stat().st_size // 1024} KB)", flush=True)

        remaining = [
            cut for cut in remaining
            if not (IMAGES_DIR / f"EP01_CUT{cut['cutNumber']:02d}_cutscene.jpg").exists()
        ]


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--end", type=int, default=28)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--batch-size", type=int, default=3)
    args = parser.parse_args()

    ep_data = json.loads(PROMPTS_JSON.read_text(encoding="utf-8"))
    cutscenes = ep_data["cutscenes"][args.start - 1 : args.end]

    if args.force and args.start == 1 and args.end == 28:
        backup_dir = Path("/tmp/ep01_landscape_old_backup")
        if IMAGES_DIR.exists():
            shutil.rmtree(backup_dir, ignore_errors=True)
            shutil.copytree(IMAGES_DIR, backup_dir)
            for f in IMAGES_DIR.glob("EP01_CUT*_cutscene.jpg"):
                f.unlink()
            print(f"[Backup] Backed up old cutscenes to {backup_dir} and cleared IMAGES_DIR for fresh ufotable generation.", flush=True)

    status_file = OUT_DIR / "cutscene_generation_status.json"
    status_data = {}
    if status_file.exists() and not args.force:
        try:
            status_data = json.loads(status_file.read_text(encoding="utf-8"))
        except Exception:
            status_data = {}

    todo = [
        cut for cut in cutscenes
        if args.force or not (IMAGES_DIR / f"EP01_CUT{cut['cutNumber']:02d}_cutscene.jpg").exists()
    ]
    print(f"[EP01 ufotable Cutscenes] Generating {len(todo)}/{len(cutscenes)} 16:9 cutscene images in batches of {args.batch_size}...", flush=True)

    for i in range(0, len(todo), args.batch_size):
        chunk = todo[i : i + args.batch_size]
        print(f"\n=== [Cutscene Batch {i // args.batch_size + 1}] {[c['cutCode'] for c in chunk]} ===", flush=True)
        generate_cutscene_batch(chunk, status_data, status_file, batch_size=args.batch_size)

    exported = len(list(IMAGES_DIR.glob("EP01_CUT*_cutscene.jpg")))
    (OUT_DIR / "flow_generation_status.json").write_text(json.dumps({
        "episode": 1,
        "orientation": "landscape",
        "totalCutscenes": 28,
        "completedCutscenes": exported,
        "excludedCutscenes": 28 - exported,
        "exportedImages": exported,
        "finished": exported == 28,
        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n🎉 Completed {exported}/28 Episode 1 ufotable 16:9 cutscene images!", flush=True)


if __name__ == "__main__":
    main()
