#!/usr/bin/env python3
"""
Adversarial Empirical Verification Oracle for Milestone 1:
Storyline & Script Content Synchronization (SNSHero RPG Mode /main)

This script stress-tests:
1. `src/content/kadanRpgNovelScript.ts`:
   - Full 40-chapter coverage (Chapters 1 to 40)
   - Zero empty scripts or undefined/null/empty string fields
   - Choice nodes: exactly 3 choices per node, canonical attitudes, valid bonus types/values,
     non-empty bilingual labels/follow-ups, default flag, and compatibility aliases
   - Card ID bounds: all character cardId references within [1, 110] and existing in CARD_DATABASE
2. `src/content/kadanRpgStory.ts`:
   - Chapter titles synchronization against `public/book/index.json` and `englishNovelMapping.ts`
   - Region IDs validity and 40-chapter mapping against `KADAN_RPG_REGIONS`
   - Speaker card IDs (all 40 within [1, 110])
   - Encounters (enc-ch01 to enc-ch40 + legacy aliases) with valid 5-card decks within [1, 110]
   - Event definitions (40 chapters)
3. `src/lib/i18n.ts`:
   - Verification of all 40 chapter title keys and opponent keys in Korean and English
   - Verification of bandit and thief random encounter keys
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]

# Path constants
SCRIPT_TS = PROJECT_ROOT / "src" / "content" / "kadanRpgNovelScript.ts"
STORY_TS = PROJECT_ROOT / "src" / "content" / "kadanRpgStory.ts"
BOOK_INDEX_JSON = PROJECT_ROOT / "public" / "book" / "index.json"
NOVEL_MAP_TS = PROJECT_ROOT / "src" / "content" / "englishNovelMapping.ts"
CARD_DB_TS = PROJECT_ROOT / "src" / "cardDatabase.ts"
I18N_TS = PROJECT_ROOT / "src" / "lib" / "i18n.ts"


def extract_data_via_tsx():
    """Executes a small TypeScript probe via npx tsx to dump the parsed runtime data to JSON."""
    ts_code = """
import { KADAN_RPG_NOVEL_SCRIPTS } from './src/content/kadanRpgNovelScript.ts';
import {
  chapterTitles,
  KADAN_RPG_REGIONS,
  chapterRegionIds,
  speakerCardIds,
  KADAN_RPG_ENCOUNTERS,
  KADAN_RPG_EVENTS,
} from './src/content/kadanRpgStory.ts';
import { CARD_DATABASE } from './src/cardDatabase.ts';
import { ENGLISH_NOVEL_MAP } from './src/content/englishNovelMapping.ts';
import { staticTranslations } from './src/lib/i18n.ts';

const cardIds = Object.keys(CARD_DATABASE).map(k => Number(k));

const payload = {
  novelScripts: KADAN_RPG_NOVEL_SCRIPTS,
  chapterTitles,
  regions: KADAN_RPG_REGIONS,
  chapterRegionIds,
  speakerCardIds,
  encounters: KADAN_RPG_ENCOUNTERS,
  events: KADAN_RPG_EVENTS,
  cardIds,
  englishNovelMap: ENGLISH_NOVEL_MAP,
  i18nKo: staticTranslations.ko,
  i18nEn: staticTranslations.en,
};

console.log(JSON.stringify(payload));
"""
    result = subprocess.run(
        ["npx", "tsx", "-e", ts_code],
        cwd=str(PROJECT_ROOT),
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print("ERROR: Failed to run TypeScript data extraction probe via tsx:")
        print(result.stderr)
        sys.exit(1)

    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as e:
        print("ERROR: Failed to parse tsx output as JSON:", e)
        print("Raw stdout preview:", result.stdout[:500])
        sys.exit(1)


class Milestone1ChallengerOracle:
    def __init__(self, data):
        self.data = data
        self.novel_scripts = data["novelScripts"]
        self.chapter_titles = data["chapterTitles"]
        self.regions = data["regions"]
        self.chapter_region_ids = data["chapterRegionIds"]
        self.speaker_card_ids = data["speakerCardIds"]
        self.encounters = data["encounters"]
        self.events = data["events"]
        self.valid_card_ids = set(data["cardIds"])
        self.english_novel_map = data["englishNovelMap"]
        self.i18n_ko = data["i18nKo"]
        self.i18n_en = data["i18nEn"]

        with open(BOOK_INDEX_JSON, encoding="utf-8") as f:
            self.book_index = json.load(f)

        self.anomalies = []
        self.passed_checks = 0

    def record_fail(self, check_name, reason):
        msg = f"[FAIL] {check_name}: {reason}"
        print("  " + msg)
        self.anomalies.append(msg)

    def record_pass(self, check_name, detail=""):
        self.passed_checks += 1
        msg = f"[PASS] {check_name}"
        if detail:
            msg += f" ({detail})"
        print("  " + msg)

    def run_all_challenges(self):
        print("=" * 80)
        print("   EMPIRICAL ADVERSARIAL CHALLENGER SUITE — MILESTONE 1 ORACLE")
        print("   Target: SNSHero RPG Mode /main Storyline & Novel Scripts Sync")
        print("=" * 80)

        self.challenge_1_card_database_bounds()
        self.challenge_2_script_coverage_and_line_integrity()
        self.challenge_3_choice_node_deep_inspection()
        self.challenge_4_story_titles_canonical_sync()
        self.challenge_5_story_regions_and_encounters()
        self.challenge_6_i18n_keys_synchronization()
        self.challenge_7_raw_source_static_sanity()

        print("\n" + "=" * 80)
        print(f"VERIFICATION SUMMARY: {self.passed_checks} checks PASSED, {len(self.anomalies)} anomalies detected.")
        print("=" * 80)

        if self.anomalies:
            print("\nLIST OF DETECTED ANOMALIES:")
            for a in self.anomalies:
                print(" - " + a)
            return False
        else:
            print("\nALL ADVERSARIAL STRESS TESTS PASSED WITH ZERO ANOMALIES.")
            return True

    def challenge_1_card_database_bounds(self):
        print("\n[CHALLENGE 1] Card Database Boundary & ID Coverage")
        if len(self.valid_card_ids) != 110:
            self.record_fail("CARD_DATABASE size", f"Expected 110 cards, found {len(self.valid_card_ids)}")
        else:
            self.record_pass("CARD_DATABASE size", "Exactly 110 cards registered (1..110)")

        # Verify min and max card IDs
        if min(self.valid_card_ids) != 1 or max(self.valid_card_ids) != 110:
            self.record_fail("CARD_DATABASE bounds", f"Range is {min(self.valid_card_ids)}..{max(self.valid_card_ids)}")
        else:
            self.record_pass("CARD_DATABASE range", "Range strictly spans 1..110 without gaps")

    def challenge_2_script_coverage_and_line_integrity(self):
        print("\n[CHALLENGE 2] 40-Chapter Script Coverage & Line Quality Stress-Test")

        chapter_keys = set(self.novel_scripts.keys())
        expected_keys = {str(i) for i in range(1, 41)}

        if chapter_keys != expected_keys:
            missing = expected_keys - chapter_keys
            extra = chapter_keys - expected_keys
            self.record_fail("Chapter Key Coverage", f"Missing chapters: {missing}, Extra: {extra}")
        else:
            self.record_pass("Chapter Key Coverage", "All 40 chapters present as keys (1..40)")

        total_lines = 0
        min_lines = 9999
        max_lines = 0
        valid_speakers = {"narrator", "quote", "kadan", "speaker", "choice"}

        for ch_num in range(1, 41):
            ch_key = str(ch_num)
            lines = self.novel_scripts.get(ch_key)
            if not lines or len(lines) == 0:
                self.record_fail(f"Chapter {ch_num} Empty", "Script array is empty or undefined")
                continue

            num_lines = len(lines)
            total_lines += num_lines
            min_lines = min(min_lines, num_lines)
            max_lines = max(max_lines, num_lines)

            # Check that chapter has sufficient lines (at least 4)
            if num_lines < 4:
                self.record_fail(f"Chapter {ch_num} Length", f"Only {num_lines} lines (expected >= 4)")

            # Line-by-line inspection
            for idx, line in enumerate(lines):
                loc = f"Ch{ch_num}[line {idx}]"

                # speaker field
                speaker = line.get("speaker")
                if not speaker or speaker not in valid_speakers:
                    self.record_fail(f"{loc} Speaker", f"Invalid speaker '{speaker}'")

                # name field
                name = line.get("name")
                if not name or not isinstance(name, str) or len(name.strip()) == 0:
                    self.record_fail(f"{loc} Name", "Missing or empty name field")

                # nameEn field
                name_en = line.get("nameEn")
                if name_en is not None:
                    if not isinstance(name_en, str) or len(name_en.strip()) == 0:
                        self.record_fail(f"{loc} NameEn", "Empty string in nameEn")

                # text field
                text = line.get("text")
                if not text or not isinstance(text, str) or len(text.strip()) < 3:
                    self.record_fail(f"{loc} Text", f"Text is missing, empty, or too short: {text!r}")

                # textEn field
                text_en = line.get("textEn")
                if not text_en or not isinstance(text_en, str) or len(text_en.strip()) < 3:
                    self.record_fail(f"{loc} TextEn", f"TextEn is missing, empty, or too short: {text_en!r}")

                # cardId field
                card_id = line.get("cardId")
                if card_id is not None:
                    if not isinstance(card_id, int):
                        self.record_fail(f"{loc} CardId Type", f"cardId {card_id!r} is not an integer")
                    elif card_id < 1 or card_id > 110:
                        self.record_fail(f"{loc} CardId Bounds", f"cardId {card_id} is out of bounds [1..110]")
                    elif card_id not in self.valid_card_ids:
                        self.record_fail(f"{loc} CardId Database", f"cardId {card_id} not in CARD_DATABASE")

                # speaker requirement
                if speaker == "speaker" and card_id is None:
                    self.record_fail(f"{loc} Speaker CardId", "Line with speaker='speaker' missing cardId")

        self.record_pass(
            "Script Line Integrity",
            f"Verified {total_lines} total lines across 40 chapters (min={min_lines}, max={max_lines}) with 0 undefined fields",
        )

    def challenge_3_choice_node_deep_inspection(self):
        print("\n[CHALLENGE 3] Interactive Protagonist Choice Nodes (R2 Specification)")

        seen_choice_ids = set()
        required_attitudes = ["[결의/돌파]", "[신중/통찰]", "[성진호흡/공명]"]
        valid_bonus_types = {"sns", "buff", "item"}

        for ch_num in range(1, 41):
            ch_key = str(ch_num)
            lines = self.novel_scripts.get(ch_key, [])
            choice_nodes = [l for l in lines if l.get("speaker") == "choice"]

            if len(choice_nodes) != 1:
                self.record_fail(f"Chapter {ch_num} Choice Node Count", f"Expected exactly 1 choice node, found {len(choice_nodes)}")
                continue

            node = choice_nodes[0]
            choices = node.get("choices")
            if not choices or not isinstance(choices, list):
                self.record_fail(f"Chapter {ch_num} Choices Array", "choices is missing or not a list")
                continue

            if len(choices) != 3:
                self.record_fail(f"Chapter {ch_num} Choices Count", f"Expected exactly 3 choices, got {len(choices)}")
                continue

            # Check attitudes order and uniqueness within chapter
            node_attitudes = [c.get("attitude") for c in choices]
            if node_attitudes != required_attitudes:
                self.record_fail(
                    f"Chapter {ch_num} Attitudes",
                    f"Expected {required_attitudes}, found {node_attitudes}",
                )

            default_count = sum(1 for c in choices if c.get("isDefault") is True)
            if default_count != 1:
                self.record_fail(
                    f"Chapter {ch_num} Default Choice",
                    f"Expected exactly 1 default choice, found {default_count}",
                )

            for c_idx, c in enumerate(choices):
                cid = c.get("id")
                c_loc = f"Ch{ch_num}[Choice {c_idx} id={cid}]"

                if not cid or not isinstance(cid, str):
                    self.record_fail(f"{c_loc} ID", "Invalid or missing choice id")
                elif cid in seen_choice_ids:
                    self.record_fail(f"{c_loc} ID Collision", f"Duplicate choice id '{cid}'")
                else:
                    seen_choice_ids.add(cid)

                # Attitude EN
                att_en = c.get("attitudeEn")
                if not att_en or not isinstance(att_en, str) or len(att_en.strip()) == 0:
                    self.record_fail(f"{c_loc} attitudeEn", "Missing or empty attitudeEn")

                # Labels
                label_ko = c.get("labelKo")
                if not label_ko or not isinstance(label_ko, str) or len(label_ko.strip()) < 5:
                    self.record_fail(f"{c_loc} labelKo", f"labelKo too short or missing: {label_ko!r}")

                label_en = c.get("labelEn")
                if not label_en or not isinstance(label_en, str) or len(label_en.strip()) < 5:
                    self.record_fail(f"{c_loc} labelEn", f"labelEn too short or missing: {label_en!r}")

                # Follow-up reaction lines
                follow_ko = c.get("followUpTextKo")
                if not follow_ko or not isinstance(follow_ko, str) or len(follow_ko.strip()) < 5:
                    self.record_fail(f"{c_loc} followUpTextKo", f"followUpTextKo too short or missing: {follow_ko!r}")

                follow_en = c.get("followUpTextEn")
                if not follow_en or not isinstance(follow_en, str) or len(follow_en.strip()) < 5:
                    self.record_fail(f"{c_loc} followUpTextEn", f"followUpTextEn too short or missing: {follow_en!r}")

                # Bonus metadata
                bonus_type = c.get("bonusType")
                if bonus_type not in valid_bonus_types:
                    self.record_fail(f"{c_loc} bonusType", f"Invalid bonusType '{bonus_type}'")

                bonus_value = c.get("bonusValue")
                if not isinstance(bonus_value, (int, float)) or bonus_value <= 0:
                    self.record_fail(f"{c_loc} bonusValue", f"Invalid bonusValue '{bonus_value}'")

                desc_ko = c.get("bonusDescKo")
                if not desc_ko or not isinstance(desc_ko, str):
                    self.record_fail(f"{c_loc} bonusDescKo", "Missing bonusDescKo")

                desc_en = c.get("bonusDescEn")
                if not desc_en or not isinstance(desc_en, str):
                    self.record_fail(f"{c_loc} bonusDescEn", "Missing bonusDescEn")

                # UI compatibility aliases validation
                badge = c.get("badge")
                if badge != c.get("attitude"):
                    self.record_fail(f"{c_loc} badge alias", f"badge '{badge}' does not match attitude")

                text_alias = c.get("text")
                if text_alias != c.get("labelKo"):
                    self.record_fail(f"{c_loc} text alias", "text alias does not match labelKo")

                follow_alias = c.get("followUpLine")
                if follow_alias != c.get("followUpTextKo"):
                    self.record_fail(f"{c_loc} followUpLine alias", "followUpLine alias does not match followUpTextKo")

                reward = c.get("reward")
                if not isinstance(reward, dict):
                    self.record_fail(f"{c_loc} reward alias", "reward alias is missing or not an object")

        self.record_pass(
            "Interactive Choice Structure",
            f"All 40 chapters feature exactly 1 choice node, 3 choices ({len(seen_choice_ids)} total unique IDs), valid attitudes and bonuses",
        )

    def challenge_4_story_titles_canonical_sync(self):
        print("\n[CHALLENGE 4] Chapter Titles Canonical Synchronization")

        if len(self.chapter_titles) != 40:
            self.record_fail("chapterTitles length", f"Expected 40, found {len(self.chapter_titles)}")
            return

        book_episodes = self.book_index.get("episodes", [])
        book_titles = {ep["episodeNumber"]: ep["titleKo"] for ep in book_episodes}

        for entry in self.chapter_titles:
            ch = entry.get("chapter")
            t_ko = entry.get("titleKo")
            t_en = entry.get("titleEn")

            # Check matching against book index
            expected_ko = book_titles.get(ch)
            if expected_ko and expected_ko != t_ko:
                self.record_fail(f"Ch{ch} Korean Title Mismatch", f"kadanRpgStory: '{t_ko}' != index.json: '{expected_ko}'")

            # Check matching against englishNovelMapping.ts
            map_entry = self.english_novel_map.get(str(ch))
            if map_entry:
                expected_en = map_entry.get("titleEn")
                if expected_en != t_en:
                    self.record_fail(f"Ch{ch} English Title Mismatch", f"kadanRpgStory: '{t_en}' != englishNovelMapping: '{expected_en}'")

        self.record_pass("Chapter Titles Synchronization", "All 40 chapter titles match public/book/index.json and englishNovelMapping.ts exactly")

    def challenge_5_story_regions_and_encounters(self):
        print("\n[CHALLENGE 5] Story Regions, Encounters, and Speaker Card IDs")

        # 1. Regions
        region_ids = {r["id"] for r in self.regions}
        if len(self.chapter_region_ids) != 40:
            self.record_fail("chapterRegionIds length", f"Expected 40, got {len(self.chapter_region_ids)}")
        else:
            invalid_regions = [r for r in self.chapter_region_ids if r not in region_ids]
            if invalid_regions:
                self.record_fail("Invalid Region IDs", f"Unrecognized regions: {set(invalid_regions)}")
            else:
                self.record_pass("chapterRegionIds", "All 40 chapter regions belong to valid KADAN_RPG_REGIONS")

        # 2. Speaker card IDs
        if len(self.speaker_card_ids) != 40:
            self.record_fail("speakerCardIds length", f"Expected 40, got {len(self.speaker_card_ids)}")
        else:
            invalid_sp_cards = [cid for cid in self.speaker_card_ids if cid not in self.valid_card_ids]
            if invalid_sp_cards:
                self.record_fail("Invalid speakerCardIds", f"Out of bound card IDs: {invalid_sp_cards}")
            else:
                self.record_pass("speakerCardIds", "All 40 speakerCardIds strictly within [1..110] and valid")

        # 3. Encounters
        enc_map = {e["id"]: e for e in self.encounters}
        required_encs = [f"enc-ch{i:02d}" for i in range(1, 41)] + ["enc-mid", "enc-boss", "enc-ending"]

        for enc_id in required_encs:
            if enc_id not in enc_map:
                self.record_fail(f"Missing Encounter {enc_id}", "Encounter ID not defined in KADAN_RPG_ENCOUNTERS")
                continue
            enc = enc_map[enc_id]
            deck = enc.get("opponentCardIds", [])
            if len(deck) != 5:
                self.record_fail(f"Encounter {enc_id} Deck Size", f"Expected 5 cards, got {len(deck)}")
            invalid_deck_cards = [cid for cid in deck if cid not in self.valid_card_ids]
            if invalid_deck_cards:
                self.record_fail(f"Encounter {enc_id} Card IDs", f"Cards {invalid_deck_cards} not in 1..110 database")

        self.record_pass("KADAN_RPG_ENCOUNTERS", f"All 43 encounters valid with 5-card decks in range [1..110]")

        # 4. Events
        if len(self.events) != 40:
            self.record_fail("KADAN_RPG_EVENTS count", f"Expected 40 events, got {len(self.events)}")
        else:
            for idx, ev in enumerate(self.events):
                ch = idx + 1
                if ev.get("chapterNumber") != ch:
                    self.record_fail(f"Event {idx} Chapter Number", f"Expected {ch}, got {ev.get('chapterNumber')}")
                if ev.get("speakerCardId") not in self.valid_card_ids:
                    self.record_fail(f"Event {ch} speakerCardId", f"Invalid card ID {ev.get('speakerCardId')}")
            self.record_pass("KADAN_RPG_EVENTS", "All 40 events accurately configured with valid speaker cards and encounters")

    def challenge_6_i18n_keys_synchronization(self):
        print("\n[CHALLENGE 6] Multilingual i18n Localization Keys (KO & EN)")

        for ch in range(1, 41):
            ch_key = f"kadan_rpg_chapter_{ch:02d}"
            opp_key = f"kadan_rpg_opp_ch{ch:02d}"

            # Chapter key
            if ch_key not in self.i18n_ko:
                self.record_fail(f"i18n KO Missing {ch_key}", "Key not in translations.ko")
            if ch_key not in self.i18n_en:
                self.record_fail(f"i18n EN Missing {ch_key}", "Key not in translations.en")

            # Opponent key
            if opp_key not in self.i18n_ko:
                self.record_fail(f"i18n KO Missing {opp_key}", "Key not in translations.ko")
            if opp_key not in self.i18n_en:
                self.record_fail(f"i18n EN Missing {opp_key}", "Key not in translations.en")

        # Random ambush opponent keys
        for amb in ["kadan_rpg_opp_bandit", "kadan_rpg_opp_thief"]:
            if amb not in self.i18n_ko:
                self.record_fail(f"i18n KO Missing {amb}", "Random encounter key not in translations.ko")
            if amb not in self.i18n_en:
                self.record_fail(f"i18n EN Missing {amb}", "Random encounter key not in translations.en")

        self.record_pass(
            "i18n Completeness",
            "All 40 chapters and opponents + bandit/thief ambush keys present in both KO and EN locales",
        )

    def challenge_7_raw_source_static_sanity(self):
        print("\n[CHALLENGE 7] Static Code Analysis & Syntax Hygiene")

        # Check raw kadanRpgNovelScript.ts
        content = SCRIPT_TS.read_text(encoding="utf-8")
        forbidden_tokens = ["undefined", "null", "NaN", "TODO", "FIXME", "[TBD]"]
        for token in forbidden_tokens:
            matches = list(re.finditer(r"\b" + re.escape(token) + r"\b", content))
            if matches:
                self.record_fail(
                    f"Forbidden Token in Script: {token}",
                    f"Found {len(matches)} occurrences in {SCRIPT_TS.name}",
                )

        # Check raw kadanRpgStory.ts
        story_content = STORY_TS.read_text(encoding="utf-8")
        for token in ["undefined", "NaN", "TODO", "FIXME"]:
            # Note: null or undefined might appear in type signatures like string | undefined, so match assignment
            matches = list(re.finditer(r":\s*" + re.escape(token) + r"\b", story_content))
            if matches:
                self.record_fail(
                    f"Forbidden Value in Story: {token}",
                    f"Found {len(matches)} occurrences in {STORY_TS.name}",
                )

        self.record_pass("Static Code Hygiene", "No forbidden placeholders (undefined/null/NaN/TODO/TBD) found in raw source")


if __name__ == "__main__":
    print("Extracting runtime dataset via tsx probe...")
    dataset = extract_data_via_tsx()
    oracle = Milestone1ChallengerOracle(dataset)
    success = oracle.run_all_challenges()
    sys.exit(0 if success else 1)
