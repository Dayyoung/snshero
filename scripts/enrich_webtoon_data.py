#!/usr/bin/env python3
"""
Enriches webtoonEpisodeManifest.json and public/book/image_narrations/episode_XX_narrations.json
with structured comic dialogues and dramatic sfx cues.
"""

import os
import re
import json
import glob

MANIFEST_PATH = "src/content/webtoonEpisodeManifest.json"
NARRATIONS_DIR = "public/book/image_narrations"

CHAR_MAP_KO_EN = {
    "알렉산다르": ("알렉산다르", "Aleksandar"),
    "발리안": ("발리안", "Balian"),
    "헤르쿨": ("헤르쿨", "Hercul"),
    "카단": ("카단", "Kadan"),
    "루시안": ("루시안", "Lucian"),
    "이그니스": ("이그니스", "Ignis"),
    "실리아": ("실리아", "Celia"),
    "세라피나": ("세라피나", "Seraphina"),
    "레이븐": ("레이븐", "Raven"),
    "조슈아": ("조슈아", "Joshua"),
    "드레이크": ("드레이크", "Drake"),
    "모이라": ("모이라", "Moira"),
    "비비안": ("비비안", "Vivian"),
    "발레리우스": ("발레리우스", "Valerius"),
    "정복왕": ("정복왕 발레리우스", "Conqueror King"),
    "기사": ("성기사단원", "Holy Knight"),
    "사제": ("순례 사제", "Pilgrim Priest"),
    "암살자": ("그림자 암살자", "Shadow Assassin"),
    "선장": ("드레이크 선장", "Captain Drake"),
    "지휘관": ("지휘관", "Commander"),
    "엘윈": ("엘윈 촌장", "Elwin Elder"),
}

ACTION_KEYWORDS = [
    (("검", "창", "베", "챙", "부딪", "격돌", "방패"), ("챙-!", "CLANG!", "slash", "top-right")),
    (("베어", "날붙이", "절단", "스쳤", "일격"), ("서걱-!", "SLASH!", "slash", "center")),
    (("폭발", "화염", "불꽃", "터져", "화구", "파괴"), ("콰아아앙!", "BOOM!", "impact", "center")),
    (("마나", "마법", "룬", "빛", "아케인", "번개", "섬광"), ("파지지직!", "CRACKLE!", "magic", "top-right")),
    (("진동", "무너", "포효", "괴성", "땅", "울림", "거대"), ("쿠구구궁!", "RUMBLE!", "rumble", "bottom-left")),
    (("눈보라", "바람", "돌풍", "휘몰", "삭풍", "한기"), ("휘이이익-!", "SWOOSH!", "slash", "top-left")),
    (("발소리", "돌진", "내리찍", "강타", "착지", "벽"), ("쿵-!", "THUD!", "impact", "bottom-right")),
]

def find_speaker(text, char_list, default_speaker=("내레이터", "Narrator")):
    for ch in char_list:
        for k, v in CHAR_MAP_KO_EN.items():
            if k.lower() in ch.lower():
                return v
    for k, v in CHAR_MAP_KO_EN.items():
        if k in text:
            return v
    return default_speaker

def extract_quotes(text_ko, text_en):
    # Match Korean quotes: “...” or "..." or '...'
    quotes_ko = re.findall(r'["“]([^"”]+)["”]', text_ko)
    quotes_en = re.findall(r'["“]([^"”]+)["”]', text_en)
    return quotes_ko, quotes_en

def determine_bubble_type(quote):
    if any(m in quote for m in ["!", "크악", "멈춰라", "덤벼라", "죽어라", "검을", "안 돼"]):
        return "shout"
    if any(m in quote for m in ["...", "과연", "어쩌면", "이것은", "설마"]):
        return "thought"
    if any(m in quote for m in ["조용히", "쉿", "들리지 않게", "가만히"]):
        return "whisper"
    return "speech"

def determine_sfx(text_ko):
    cues = []
    for keys, (ko, en, style, pos) in ACTION_KEYWORDS:
        if any(k in text_ko for k in keys):
            cues.append({
                "textKo": ko,
                "textEn": en,
                "style": style,
                "position": pos
            })
            if len(cues) >= 2:
                break
    return cues

def generate_fallback_dialogue(ep_num, scene_idx, characters, narration_ko):
    # When no explicit quotes in text, produce contextual comic speech or monologue
    speaker_ko, speaker_en = find_speaker(narration_ko, characters, ("카단" if ep_num > 10 else "알렉산다르", "Kadan" if ep_num > 10 else "Aleksandar"))
    
    # Simple semantic context
    if "눈보라" in narration_ko or "겨울" in narration_ko:
        t_ko = f"이 눈보라는 단순한 한기가 아니다... 섀도우렐름의 기운이야."
        t_en = "This blizzard isn't just cold... It bears the aura of the Shadow Realm."
        b_type = "thought"
    elif "성기사" in narration_ko or "인장" in narration_ko:
        t_ko = f"우리의 맹세는 아직 꺼지지 않았다."
        t_en = "Our vow has never been extinguished."
        b_type = "speech"
    elif "적" in narration_ko or "병사" in narration_ko or "기병" in narration_ko:
        t_ko = f"전원 경계 태세를 갖춰라! 놈들이 온다!"
        t_en = "All units on high alert! They are coming!"
        b_type = "shout"
    elif "검" in narration_ko or "무기" in narration_ko:
        t_ko = f"검끝이 흔들리지 않는 한, 길은 열린다."
        t_en = "As long as our blades do not waver, the path will open."
        b_type = "speech"
    elif "도망" in narration_ko or "밤" in narration_ko:
        t_ko = f"발소리를 죽여라. 어둠 속에서 숨을 고르는 거다."
        t_en = "Muffle your footsteps. Catch your breath in the dark."
        b_type = "whisper"
    else:
        t_ko = f"끝까지 포기하지 마라. 우리의 전장은 바로 이곳이다."
        t_en = "Do not yield until the very end. Our battlefield is right here."
        b_type = "speech"

    positions = ["top-right", "top-left", "bottom-left", "bottom-right"]
    pos = positions[(ep_num + scene_idx) % len(positions)]
    return [{
        "speakerKo": speaker_ko,
        "speakerEn": speaker_en,
        "textKo": t_ko,
        "textEn": t_en,
        "bubbleType": b_type,
        "position": pos
    }]

def process():
    print("Reading manifest...")
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    # Climax map
    climax_map = {
        (1, 20): ("/images/webtoon/ep01_blizzard_vow.jpg", True),
        (8, 15): ("/images/webtoon/ep08_crimson_mane.jpg", True),
        (15, 18): ("/images/webtoon/ep15_shadow_duel.jpg", True),
        (25, 16): ("/images/webtoon/ep25_assassin_ambush.jpg", True),
        (40, 20): ("/images/webtoon/ep40_eternal_shield.jpg", True),
    }

    total_scenes_enriched = 0
    total_dialogues_added = 0
    total_sfx_added = 0

    for ep_str, ep_data in manifest.items():
        ep_num = int(ep_str)
        images = ep_data.get("images", [])

        # Read corresponding narration file if present
        pad = f"{ep_num:02d}"
        narr_file = os.path.join(NARRATIONS_DIR, f"episode_{pad}_narrations.json")
        narr_data = None
        if os.path.exists(narr_file):
            with open(narr_file, "r", encoding="utf-8") as nf:
                narr_data = json.load(nf)

        positions = ["top-left", "top-right", "bottom-left", "bottom-right"]

        for img in images:
            idx = img.get("index", 0)
            if idx == 0:
                # Title card: can have a dramatic title monologue or subtitle
                img["dialogues"] = [{
                    "speakerKo": "내레이션",
                    "speakerEn": "Narration",
                    "textKo": img.get("narrationKo", f"제{ep_num}화의 서막"),
                    "textEn": img.get("narrationEn", f"Episode {ep_num} Begins"),
                    "bubbleType": "thought",
                    "position": "center"
                }]
                img["sfxCues"] = []
                continue

            narration_ko = img.get("narrationKo", "")
            narration_en = img.get("narrationEn", "")
            chars = img.get("characters", [])

            # Check climax
            if (ep_num, idx) in climax_map:
                art_url, is_climax = climax_map[(ep_num, idx)]
                img["localArtUrl"] = art_url
                img["isKeyClimax"] = is_climax

            quotes_ko, quotes_en = extract_quotes(narration_ko, narration_en)
            dialogues = []

            if quotes_ko:
                for q_i, q_ko in enumerate(quotes_ko):
                    q_en = quotes_en[q_i] if q_i < len(quotes_en) else f"“{q_ko}”"
                    speaker_ko, speaker_en = find_speaker(narration_ko, chars, ("카단" if ep_num > 10 else "알렉산다르", "Kadan" if ep_num > 10 else "Aleksandar"))
                    b_type = determine_bubble_type(q_ko)
                    pos = positions[(idx + q_i) % len(positions)]
                    dialogues.append({
                        "speakerKo": speaker_ko,
                        "speakerEn": speaker_en,
                        "textKo": q_ko,
                        "textEn": q_en,
                        "bubbleType": b_type,
                        "position": pos
                    })
            else:
                # If scene has characters or dramatic action, add contextual dialogue for at least 60% of scenes
                if chars or (idx % 2 == 1) or (ep_num, idx) in climax_map:
                    dialogues = generate_fallback_dialogue(ep_num, idx, chars, narration_ko)

            sfx_cues = determine_sfx(narration_ko)
            # Guarantee at least some sfx in climax or combat scenes
            if not sfx_cues and (ep_num, idx) in climax_map:
                sfx_cues = [{
                    "textKo": "콰아아앙!",
                    "textEn": "BOOM!",
                    "style": "impact",
                    "position": "center"
                }]

            img["dialogues"] = dialogues
            img["sfxCues"] = sfx_cues

            total_scenes_enriched += 1
            total_dialogues_added += len(dialogues)
            total_sfx_added += len(sfx_cues)

            # Update narr_data scene if exists
            if narr_data and "scenes" in narr_data:
                for sc in narr_data["scenes"]:
                    if sc.get("sceneNumber") == idx:
                        sc["dialogues"] = dialogues
                        sc["sfxCues"] = sfx_cues
                        if (ep_num, idx) in climax_map:
                            sc["localArtUrl"] = climax_map[(ep_num, idx)][0]
                            sc["isKeyClimax"] = True

        if narr_data and os.path.exists(narr_file):
            with open(narr_file, "w", encoding="utf-8") as nf:
                json.dump(narr_data, nf, ensure_ascii=False, indent=2)

    print("Writing enriched manifest...")
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f"Enrichment Complete!")
    print(f"Total scenes processed: {total_scenes_enriched}")
    print(f"Total dialogues added: {total_dialogues_added}")
    print(f"Total SFX cues added: {total_sfx_added}")

if __name__ == "__main__":
    process()
