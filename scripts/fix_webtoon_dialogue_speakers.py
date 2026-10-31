#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix Webtoon Dialogue Speakers Script
Corrects misattributed dialogue speakers across all 40 episodes in:
1. src/content/webtoonEpisodeManifest.json
2. src/content/kadanRpgNovelScript.ts
3. public/book/image_narrations/episode_XX_narrations.json

Specifically resolves bugs where:
- Enemies confronting Kadan (e.g. Bogart, Barto, Karnak, Ursac, Royal Guard Officer, Assassin Leader, Inquisitor Captain, Auctioneer, Arachne) had their lines attributed to Kadan.
- Mentors (Rondol, Grimli, Star Hermit) or allies (Titania, Gilgamesh, Sylvia, Celia, Emperor) had their lines attributed to Kadan or others.
- Self-calling vocatives (e.g. "Kadan, ..." spoken by someone addressing Kadan) were misassigned.
"""

import json
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = PROJECT_ROOT / "src" / "content" / "webtoonEpisodeManifest.json"
RPG_SCRIPT_PATH = PROJECT_ROOT / "src" / "content" / "kadanRpgNovelScript.ts"
NARRATIONS_DIR = PROJECT_ROOT / "public" / "book" / "image_narrations"
BOOK_DIR = PROJECT_ROOT / "public" / "book"

SPEAKERS_MAP = {
    '보가트': ('보가트', 'Bogart', 77),
    '바르토': ('바르토', 'Barto', 47),
    '카르낙': ('카르낙', 'Karnak', 71),
    '우르삭': ('우르삭', 'Ursac', 47),
    '근위대 장교': ('근위대 장교', 'Royal Guard Officer', 45),
    '암살자 두목': ('암살자 두목', 'Assassin Leader', 44),
    '암살 대장': ('암살 대장', 'Assassin Leader', 44),
    '두목': ('암살자 두목', 'Assassin Leader', 44),
    '감찰대장': ('감찰대장', 'Inquisitor Captain', 45),
    '경매상': ('경매상', 'Auctioneer', 48),
    '곡물 상인': ('곡물 상인', 'Grain Merchant', 48),
    '발타자르': ('발타자르', 'Balthazar', 45),
    '아라크네': ('아라크네', 'Arachne', 71),
    '늙은 황제': ('황제', 'Emperor', 50),
    '황제': ('황제', 'Emperor', 50),
    '원로원 의장': ('원로원 의장', 'Senate Chancellor', 61),
    '실비아': ('실비아', 'Sylvia', 63),
    '토르발트': ('토르발트', 'Thorvald', 47),
    '어린아이': ('피난민 아이', 'Refugee Child', 41),
    '피난민 아이': ('피난민 아이', 'Refugee Child', 41),
    '어부': ('어부', 'Fisherman', 48),
    '성진 은자': ('성진 은자', 'Star Hermit', 66),
    '노인': ('성진 은자', 'Star Hermit', 66),
    '그림리': ('그림리', 'Grimli', 74),
    '론돌': ('론돌', 'Rondol', 50),
    '티타니아': ('티타니아', 'Titania', 64),
    '길가메시': ('길가메시', 'Gilgamesh', 47),
    '실리아': ('실리아', 'Celia', 62),
    '카단': ('카단', 'Kadan', 41),
    '루시안': ('루시안', 'Lucian', 61),
    '이그니스': ('이그니스', 'Ignis', 11),
    '메두사 고르고': ('메두사 고르고', 'Medusa Gorgo', 71),
    '고르고': ('메두사 고르고', 'Medusa Gorgo', 71),
    '벨페고르': ('벨페고르', 'Belphegor', 83),
    '데스나이트 아르투스': ('데스나이트 아르투스', 'Death Knight Artus', 60),
    '아르투스': ('데스나이트 아르투스', 'Death Knight Artus', 60),
    '펜릴 왕': ('펜릴', 'Fenrir', 81),
    '펜릴': ('펜릴', 'Fenrir', 81),
    '알렉산다르': ('알렉산다르', 'Aleksandar', 50),
    '발리안': ('발리안', 'Balian', 45),
    '이셀라': ('이셀라', 'Ysela', 42),
    '엘윈': ('엘윈', 'Elwin', 42),
    '에올루스': ('에올루스', 'Aeolus', 66),
    '에일라': ('에일라', 'Aila', 43),
    '카제': ('카제', 'Kaze', 44),
    '엘리아나': ('엘리아나', 'Eliana', 63),
    '가웨인': ('가웨인', 'Gawain', 45),
    '사회관': ('황궁 사회관', 'Court Herald', 48),
    '귀족들': ('황궁 귀족들', 'Courtiers', 61),
    '부랑배들': ('도박꾼들', 'Gamblers', 48),
}

def find_speaker_in_text(clause: str):
    for name in sorted(SPEAKERS_MAP.keys(), key=len, reverse=True):
        pattern = rf'(?:^|[\s,])({re.escape(name)})(?:이|가|은|는|\s*역시|\s*또한)\b'
        if re.search(pattern, clause):
            return SPEAKERS_MAP[name]
    return None

def resolve_dialogue_speaker(text_ko: str, book_text: str, current_sp: str):
    quotes = re.findall(r'[“\"]([^”\"]+)[”\"]', text_ko)
    if not quotes:
        return None
    q = quotes[0]
    if len(q) < 5:
        return None

    pos = book_text.find(q[:18])
    if pos == -1:
        pos = book_text.find(q[-18:])

    before = ''
    after = ''
    if pos != -1:
        before = book_text[max(0, pos - 180):pos].strip()
        after = book_text[pos + len(q):min(len(book_text), pos + len(q) + 180)].strip()

    new_sp = None

    # 1. Lead-in clause in text_ko
    q_pos_text = text_ko.find('“')
    if q_pos_text != -1:
        lead_in = text_ko[:q_pos_text].strip()
        if lead_in:
            clauses = [c.strip() for c in re.split(r'[,.!?]\s*', lead_in) if c.strip()]
            if clauses:
                matched = find_speaker_in_text(clauses[-1])
                if matched:
                    new_sp = matched

    # 2. Before lines in book
    if not new_sp and before:
        lines = [l.strip() for l in before.split('\n') if l.strip()]
        if lines:
            last_line = lines[-1]
            clauses = [c.strip() for c in re.split(r'[,.!?]\s*', last_line) if c.strip()]
            if clauses:
                matched = find_speaker_in_text(clauses[-1])
                if matched and any(v in clauses[-1] for v in ['말했', '소리쳤', '외쳤', '고함', '비명', '포효', '이를 갈', '호통', '일갈', '선언', '속삭였', '읊조', '조아렸', '비웃', '조소', '중얼']):
                    new_sp = matched

    # 3. After lines in book
    if not new_sp and after:
        lines = [l.strip() for l in after.split('\n') if l.strip()]
        if lines:
            first_line = lines[0]
            clauses = [c.strip() for c in re.split(r'[,.!?]\s*', first_line) if c.strip()]
            if clauses:
                matched = find_speaker_in_text(clauses[0])
                if matched and any(v in clauses[0] for v in ['비명을 질렀', '고함을 질렀', '소리 질렀', '외쳤', '이를 갈', '호통쳤', '일갈했', '비웃', '조소', '조아렸']):
                    new_sp = matched

    # 4. Content overrides for iconic lines
    if not new_sp:
        if '수장시켜라' in q or '저 촌뜨기 놈까지' in q:
            new_sp = ('암살자 두목', 'Assassin Leader', 44)
        elif '살인귀들이야' in q:
            new_sp = ('길가메시', 'Gilgamesh', 47)
        elif '네 아비 알렉산다르는' in q:
            new_sp = ('그림리', 'Grimli', 74)
        elif '산이 너를 밀어내는 것이다' in q or '천지 만물의 호흡에 귀를 기울이지 않고' in q:
            new_sp = ('성진 은자', 'Star Hermit', 66)
        elif '별을 세느라 등 뒤에 선 동료의' in q or '에올루스 경에게서 배운' in q or '외동딸 실리아가 있다고 들었다' in q:
            new_sp = ('론돌', 'Rondol', 50)
        elif '가식 부리지 마라, 애송이!' in q:
            new_sp = ('우르삭', 'Ursac', 47)
        elif '나는 누군가의 전리품이나 보물이 아니야' in q:
            new_sp = ('티타니아', 'Titania', 64)
        elif '이봐, 애송이! 뼈도 못 추리고' in q:
            new_sp = ('경매상', 'Auctioneer', 48)
        elif '애송이 놈이 감히 황실 기병대' in q:
            new_sp = ('근위대 장교', 'Royal Guard Officer', 45)
        elif '선대의 보물창고를 찾아냈구나' in q:
            new_sp = ('바르토', 'Barto', 47)
        elif '키히힉! 황궁을 뒤집어엎었다는' in q or '내 주사위 놀음에서' in q or '운명에 네 모가지를 걸어라' in q or '키히힉! 12다!' in q or '이놈들을 모조리 쳐라!' in q or '사, 살려주십시오! 나룻배' in q:
            new_sp = ('보가트', 'Bogart', 77)
        elif '약속을 지켰네요, 카단' in q or '내가 잠시 흔들렸어요' in q:
            new_sp = ('실리아', 'Celia', 62)

    # 5. Prevent vocative self-attribution:
    current_chosen = new_sp[0] if new_sp else current_sp
    if re.search(rf'{re.escape(current_chosen)}[아아이여,\s…\.\!]', q) or f'{current_chosen}에게' in q:
        if current_chosen == '카단':
            if '약속을 지켰네요' in q or '내가 잠시 흔들렸어요' in q or '잠이 오지 않나요' in q:
                new_sp = ('실리아', 'Celia', 62)
            elif '보았느냐, 카단' in q:
                new_sp = ('이그니스', 'Ignis', 11)
            elif '나는 누군가의 전리품이나' in q:
                new_sp = ('티타니아', 'Titania', 64)
        elif current_chosen == '이그니스':
            if '이그니스! 네놈이 정녕' in q:
                new_sp = ('감찰대장', 'Inquisitor Captain', 45)
            elif '이그니스... 루시안 재상은' in q:
                new_sp = ('발타자르', 'Balthazar', 45)

    return new_sp


def main():
    print("=================================================================")
    print("WEBTOON DIALOGUE SPEAKER ACCURACY FIX ENGINE")
    print("=================================================================")

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    # Tracking corrections per episode: { (ep, fileName): (new_ko, new_en, cid) }
    corrections = {}
    total_corrected = 0

    for ep_num in range(1, 41):
        ep_key = str(ep_num)
        if ep_key not in manifest:
            continue
        book_file = BOOK_DIR / f"episode_{ep_num:02d}.md"
        book_text = book_file.read_text(encoding="utf-8") if book_file.exists() else ""

        images = manifest[ep_key].get("images", [])
        for idx, img in enumerate(images):
            file_name = img.get("fileName", "")
            for d_idx, d in enumerate(img.get("dialogues", [])):
                sp_ko = d.get("speakerKo", "")
                text_ko = d.get("textKo", "")
                new_sp = resolve_dialogue_speaker(text_ko, book_text, sp_ko)

                if new_sp and new_sp[0] != sp_ko:
                    print(f"[EP{ep_num:02d} {file_name}] '{sp_ko}' -> '{new_sp[0]}' ({new_sp[1]})")
                    d["speakerKo"] = new_sp[0]
                    d["speakerEn"] = new_sp[1]
                    d["characterCardId"] = new_sp[2]

                    # Also ensure speaker is added to characters list if not present
                    chars = img.get("characters", [])
                    if new_sp[1] not in chars:
                        chars.append(new_sp[1])
                        img["characters"] = chars

                    corrections[(ep_num, file_name)] = new_sp
                    total_corrected += 1

    print(f"\nTotal webtoon manifest dialogues corrected: {total_corrected}")

    # 1. Save manifest
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print("✓ Successfully updated src/content/webtoonEpisodeManifest.json")

    # 2. Update episode_XX_narrations.json
    narrations_updated = 0
    for ep_num in range(1, 41):
        n_file = NARRATIONS_DIR / f"episode_{ep_num:02d}_narrations.json"
        if not n_file.exists():
            continue
        try:
            n_data = json.loads(n_file.read_text(encoding="utf-8"))
            ep_modified = False
            for scene in n_data.get("scenes", []):
                img_file = scene.get("imageFile", "")
                # e.g. "episode_04/scene_21.webp" -> base "scene_21.webp"
                base_name = Path(img_file).name
                if (ep_num, base_name) in corrections:
                    new_ko, new_en, cid = corrections[(ep_num, base_name)]
                    for d in scene.get("dialogues", []):
                        d["speakerKo"] = new_ko
                        d["speakerEn"] = new_en
                        d["characterCardId"] = cid
                    ep_modified = True
                    narrations_updated += 1
            if ep_modified:
                n_file.write_text(json.dumps(n_data, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception as e:
            print(f"  Note: narrations error on EP{ep_num}: {e}")

    print(f"✓ Updated {narrations_updated} dialogue entries in public/book/image_narrations/*.json")

    # 3. Update kadanRpgNovelScript.ts
    if RPG_SCRIPT_PATH.exists():
        rpg_text = RPG_SCRIPT_PATH.read_text(encoding="utf-8")
        rpg_changes = 0
        for (ep_num, file_name), (new_ko, new_en, cid) in corrections.items():
            pattern = rf'("imageUrl":\s*"/images/webtoon/episode_{ep_num:02d}/{re.escape(file_name)}"[^}}]*?"speakerKo":\s*")[^"]+(")'
            if re.search(pattern, rpg_text):
                rpg_text = re.sub(pattern, rf'\g<1>{new_ko}\g<2>', rpg_text)
                rpg_changes += 1

        RPG_SCRIPT_PATH.write_text(rpg_text, encoding="utf-8")
        print(f"✓ Updated {rpg_changes} subCut speaker entries in src/content/kadanRpgNovelScript.ts")

    print("\n=================================================================")
    print("ALL WEBTOON DIALOGUE SPEAKER ERRORS FIXED SUCCESSFULLY!")
    print("=================================================================")

if __name__ == "__main__":
    main()
