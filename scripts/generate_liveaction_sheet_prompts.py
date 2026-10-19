#!/usr/bin/env python3
import json
from pathlib import Path

SURVEY_PATH = Path("/tmp/all_episodes_survey_02_40.json")
REF_DIR = Path("/Users/dayyoung/project/snshero/public/images/cinema/raw_ep01_sheets")

CHAR_DESCRIPTIONS = {
    "Kadan": "KADAN (tall 22yo athletic male hero actor, 1:8 adult human ratio, tousled chestnut hair, dark-blue weathered leather armor, long flowing crimson-red wool scarf, twin silver rune daggers with golden hilts)",
    "Ignis": "IGNIS (tall 22yo athletic male fire-warrior actor, 1:8 adult human ratio, spiky auburn-red hair, charcoal battle tunic with crimson-gold flame embroidery, glowing fire-runed steel gauntlets)",
    "Aleksandar": "ALEKSANDAR (tall 35yo noble king actor, 1:8 adult ratio, brown hair & beard, golden sapphire crown, ornate gold-trimmed plate armor, royal blue cape, glowing runic steel broadsword)",
    "Balian": "BALIAN (tall 33yo noble paladin actor, 1:8 adult ratio, winged silver helmet, white-and-gold cross plate armor, red cape, silver cross shield & spear)",
    "Hercul": "HERCUL (tall 48yo muscular bearded warrior actor, 1:8 adult ratio, long wild brown hair & beard, wolf-fur mantle over scarred leather armor, glowing flame-runed scimitar)",
    "Elwin": "ELWIN (tall 28yo valkyrie shieldmaiden actress, 1:8 adult ratio, long golden-blonde braid, silver breastplate over blue wool tunic, fur-trimmed winter cloak)",
    "Lucian": "LUCIAN (tall 26yo aristocratic elf archer actor, 1:8 adult ratio, blonde hair, pointed elf ears, emerald-green & gold ranger armor, yew recurve bow)",
    "Death Knight Artus": "DEATH KNIGHT ARTUS (tall imposing undead regent in blackened steel horned skull helmet with glowing icy-cyan eyes, dark plate armor, cyan soulfire greatsword)",
    "Ysela": "YSELA (tall 27yo noblewoman actress, 1:8 adult ratio, dark violet-black hair, midnight-blue starlight cloak, celestial daggers)",
    "Grimli": "GRIMLI (tall, broad-shouldered 45yo human master-blacksmith warrior actor with normal 1:8 adult human height—NOT a short dwarf—thick braided red beard, heavy iron-ring mail, colossal iron war maul with bronze bell)",
    "Gawain": "GAWAIN (tall 50yo silver-haired paladin-sage actor, 1:8 adult ratio, gilded silver plate armor, solar greatsword & iron staff)",
    "Aila": "AILA (tall 28yo female shadow-archer actress, 1:8 adult ratio, dark lavender-black leather rogue armor, hooded cloak, steel wrist crossbow)",
    "Eliana": "ELIANA (tall 24yo female healer actress, 1:8 adult ratio, warm brown hair, floral circlet, rose-and-cream medieval cloak, glowing glass herb vials)",
    "Kaze": "KAZE (tall 29yo lean male shinobi assassin actor, 1:8 adult ratio, dark charcoal shinobi leather garb, black steel lower-face mask, twin curved daggers)",
    "Rondol": "RONDOL (tall 38yo knight actor, 1:8 adult ratio, midnight-blue steel plate armor, blue-plumed barbute helm, lion-crest tower shield & iron oar)",
    "Robinyard": "ROBINYARD (tall 32yo frontier ranger actor, 1:8 adult ratio, forest-green leather jerkin, scarlet-lined hood, yew longbow)",
    "Celia": "CELIA (tall 22yo elven priestess actress, 1:8 adult ratio, leaf-green elven silk dress, silver vine staff crowned with glowing blossoms)",
    "Malfuon": "MALFUON (tall 60yo archmage actor, 1:8 adult ratio, emerald & starlight archmage robes, living ironwood staff)",
    "Aeolus": "AEOLUS (tall 34yo wind-mage actor, 1:8 adult ratio, emerald and gold aeromancer vestments, cyan wind aura)",
    "Gilgamesh": "GILGAMESH (tall 36yo warlord king actor, 1:8 adult ratio, crimson and ornate gold breastplate, twin golden flame scimitars)",
    "Leonar": "LEONAR (tall 35yo high paladin commander actor, 1:8 adult ratio, silver plate armor, ice-blue cloak, frost claymore)",
    "Titania": "TITANIA (tall 30yo fairy queen actress, 1:8 adult human stature, translucent starlight gossamer gown, lotus crown, golden scepter)",
    "Belphegor": "BELPHEGOR (tall imposing dark-fantasy demon warlord in molten obsidian plate armor with ram-horned helm and hellfire battleaxe)",
    "Medusa Gorgo": "MEDUSA GORGO (tall dark-fantasy serpent empress in gilded bronze scale corslet with writhing vipers and petrifying gaze)",
    "Sylphid": "SYLPHID (tall 21yo wind-spirit priestess actress, 1:8 adult human stature, gossamer cyan-white silk tunic, silver zephyr flute)",
    "Balbo": "BALBO (tall 42yo muscular human siege-miner warrior actor, 1:8 adult ratio, bronze-and-iron plate armor, heavy iron mining mattock)",
    "Walker": "WALKER (tall dark-fantasy undead dread-knight in rusted chainmail hauberk, violet soul-embers glowing inside helm, ancient broadsword)",
    "Fenrir": "FENRIR (giant photorealistic silver-white arctic dire wolf wreathed in frost mist)",
    "Ursoc": "URSOC (colossal photorealistic armored battle-bear with banded iron pauldrons)",
    "Griffon": "GRIFFON (majestic photorealistic eagle-lion war griffon with golden feathers and leather harness)",
    "Pegasus": "PEGASUS (photorealistic winged white stallion with silver ceremonial headstall)",
    "Barghest": "BARGHEST (photorealistic dark-blue shadow hound wreathed in cyan spirit flame)",
    "Magitech Golem": "MAGITECH GOLEM (towering photorealistic chiseled stone-and-brass ancient automaton with glowing purple rune core)",
}

REF_MAP = {
    "Aleksandar": str(REF_DIR / "ref_8head_aleksandar.jpg"),
    "Balian": str(REF_DIR / "ref_8head_balian.jpg"),
    "Hercul": str(REF_DIR / "ref_8head_hercul.jpg"),
    "Elwin": str(REF_DIR / "ref_8head_elwin.jpg"),
    "Lucian": str(REF_DIR / "ref_8head_lucian.jpg"),
    "Death Knight Artus": str(REF_DIR / "ref_8head_artus.jpg"),
    "Ysela": str(REF_DIR / "ref_8head_ysela.jpg"),
    "Kadan": str(REF_DIR / "ref_8head_kadan.jpg"),
    "Ignis": str(REF_DIR / "ref_8head_ignis.jpg"),
    "Grimli": str(REF_DIR / "ref_8head_grimli.jpg"),
    "Gawain": str(REF_DIR / "ref_8head_gawain.jpg"),
    "Aila": str(REF_DIR / "ref_8head_aila.jpg"),
    "Eliana": str(REF_DIR / "ref_8head_eliana.jpg"),
    "Kaze": str(REF_DIR / "ref_8head_kaze.jpg"),
    "Rondol": str(REF_DIR / "ref_8head_rondol.jpg"),
}

def main():
    with open(SURVEY_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    out = {}
    for ep_str, ep_info in sorted(data.items(), key=lambda x: int(x[0])):
        ep_num = int(ep_str)
        if ep_num < 3:
            continue
        title_en = ep_info.get("titleEn", f"Episode {ep_num}")
        seqs = []
        for s in ep_info.get("sequences", []):
            seq_num = s["seq"]
            chars = s.get("characters", [])
            nar = s.get("narration_script", "")
            char_lines = []
            img_paths = []
            for c in chars:
                if c in CHAR_DESCRIPTIONS:
                    char_lines.append(f"- {CHAR_DESCRIPTIONS[c]}")
                if c in REF_MAP and len(img_paths) < 2 and Path(REF_MAP[c]).is_file():
                    img_paths.append(REF_MAP[c])
            if not char_lines:
                char_lines.append(f"- {CHAR_DESCRIPTIONS['Kadan']}")
                if not img_paths and Path(REF_MAP["Kadan"]).is_file():
                    img_paths.append(REF_MAP["Kadan"])

            prompt = (
                f"Generate a high-resolution 16:9 image arranged as a clean 3x3 grid "
                f"(9 sequential live-action movie stills of a SINGLE continuous scene, separated by thin crisp black borders, "
                f"NO text, NO letters, NO numbers, NO subtitles, NO watermarks).\n\n"
                f"CRITICAL 8-HEAD-TALL ADULT HUMAN PROPORTIONS (EPISODE {ep_num:02d}: '{title_en}', SEQUENCE {seq_num}):\n"
                f"- 100% PHOTOREALISTIC LIVE-ACTION DARK FANTASY BLOCKBUSTER MOVIE STILLS ('The Lord of the Rings', 'Game of Thrones', 'The Witcher'), shot on ARRI Alexa 65 70mm anamorphic lens.\n"
                f"- Every human/humanoid character MUST have realistic 8-head-tall (1:8 head-to-body ratio) adult human proportions! Strictly NO 2-head-tall chibi, NO short cartoon dwarfs, NO oversized heads, NO anime/2D illustration.\n"
                f"CAST & COSTUMES IN THIS SCENE:\n" + "\n".join(char_lines) + "\n\n"
                f"STORY ACTION ACROSS THE 9 SEQUENTIAL PANELS (reading left-to-right, top-to-bottom, Frames 1 to 9):\n"
                f"Narrative Context: \"{nar}\"\n"
                f"- Panels 1–3 (Top Row): Establishing the live-action scene and initial continuous actor movement, expressions, and weapon/prop handling.\n"
                f"- Panels 4–6 (Middle Row): Escalating continuous live-action acting, physical interaction, combat clash or emotional exchange with signature props clearly visible.\n"
                f"- Panels 7–9 (Bottom Row): Climactic follow-through of the motion and dramatic resolution of the beat leading into the next sequence."
            )
            seqs.append({
                "seq": seq_num,
                "image_paths": img_paths,
                "prompt": prompt,
                "target_file": f"/Users/dayyoung/project/snshero/public/images/cinema/raw_ep{ep_num:02d}_sheets/act_seq_{seq_num:02d}.png"
            })
        out[str(ep_num)] = {
            "episodeNumber": ep_num,
            "titleEn": title_en,
            "sequences": seqs
        }

    out_path = Path("/tmp/ep_liveaction_prompts_03_40.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(out)} episodes (EP 03..40) live-action prompts to {out_path}")

if __name__ == "__main__":
    main()
