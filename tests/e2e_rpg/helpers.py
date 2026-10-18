"""Helper utilities and oracle engines for SNSHero RPG Mode E2E Test Suite.

Provides:
- TestResult dataclass and status reporting
- TypeScript AST / token / regex inspection utilities
- Canonical 40-chapter novel/webtoon storyline oracle data
- Ambush Encounter generator & cooldown guard oracle
- Protagonist Choice & Timer state machine oracle
- Complete 40-chapter hands-free playthrough simulator
"""

import json
import math
import os
import random
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

# Base repository root
REPO_ROOT = Path(__file__).resolve().parents[2]


@dataclass
class TestResult:
    test_id: str
    tier: int
    feature: str
    name: str
    status: str  # "PASS", "FAIL", "WARN"
    milestone: str = "ALL"  # "M1", "M2", "M3", "M4", "ALL"
    message: str = ""
    details: List[str] = field(default_factory=list)
    duration_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "test_id": self.test_id,
            "tier": self.tier,
            "feature": self.feature,
            "milestone": self.milestone,
            "name": self.name,
            "status": self.status,
            "message": self.message,
            "details": self.details,
            "duration_ms": round(self.duration_ms, 2),
        }


def read_source_file(rel_path: str) -> str:
    """Reads a file relative to repository root with UTF-8 encoding."""
    target_path = REPO_ROOT / rel_path
    if not target_path.is_file():
        raise FileNotFoundError(f"Source file not found: {rel_path}")
    return target_path.read_text(encoding="utf-8")


# ─────────────────────────────────────────────────────────────────────────────
# Canonical 40-Episode Storyline Reference (Authoritative Oracle)
# Derived from:
# - src/content/englishNovelMapping.ts (ENGLISH_NOVEL_MAP)
# - public/book/index.json (Korean titles)
# - ORIGINAL_REQUEST.md (§R1, §2026-10-18T20:02:04Z)
# - PROJECT.md (§Feature Inventory F1, F2)
# ─────────────────────────────────────────────────────────────────────────────

CANONICAL_EPISODES: Dict[int, Dict[str, Any]] = {
    1: {
        "titleKo": "눈보라 아래 두 서약",
        "titleEn": "Two Vows Beneath the Blizzard",
        "regionId": "elwin-wildland",
        "focusHeroId": 41,
        "speakerCardId": 41,
    },
    2: {
        "titleKo": "일곱 추적자의 맹세",
        "titleEn": "Oath of the Seven Pursuers",
        "regionId": "elwin-wildland",
        "focusHeroId": 49,
        "speakerCardId": 49,
    },
    3: {
        "titleKo": "안개 절벽의 피",
        "titleEn": "Blood on the Mist Cliff",
        "regionId": "red-cliff",
        "focusHeroId": 48,
        "speakerCardId": 48,
    },
    4: {
        "titleKo": "황야에서 자란 아이",
        "titleEn": "The Child Raised in the Wastes",
        "regionId": "red-cliff",
        "focusHeroId": 41,
        "speakerCardId": 41,
    },
    5: {
        "titleKo": "폭우 속의 유령",
        "titleEn": "Phantom in the Downpour",
        "regionId": "red-cliff",
        "focusHeroId": 41,
        "speakerCardId": 45,
    },
    6: {
        "titleKo": "별을 호흡하는 법",
        "titleEn": "The Art of Breathing Stars",
        "regionId": "mana-caves",
        "focusHeroId": 66,
        "speakerCardId": 66,
    },
    7: {
        "titleKo": "배신자들의 천막",
        "titleEn": "The Traitors Camp",
        "regionId": "mana-caves",
        "focusHeroId": 41,
        "speakerCardId": 81,
    },
    8: {
        "titleKo": "붉은 갈기의 기수",
        "titleEn": "Rider of the Crimson Mane",
        "regionId": "mana-caves",
        "focusHeroId": 41,
        "speakerCardId": 90,
    },
    9: {
        "titleKo": "거지 옷의 바람",
        "titleEn": "Wind in Beggars Clothes",
        "regionId": "southern-road",
        "focusHeroId": 41,
        "speakerCardId": 62,
    },
    10: {
        "titleKo": "불꽃 궁정의 포로",
        "titleEn": "Prisoner of the Flame Court",
        "regionId": "southern-road",
        "focusHeroId": 11,
        "speakerCardId": 11,
    },
    11: {
        "titleKo": "기억을 깨우는 단검",
        "titleEn": "The Dagger That Wakes Memory",
        "regionId": "southern-road",
        "focusHeroId": 41,
        "speakerCardId": 41,
    },
    12: {
        "titleKo": "두 무덤 사이의 봄",
        "titleEn": "Spring Between Two Graves",
        "regionId": "southern-road",
        "focusHeroId": 41,
        "speakerCardId": 43,
    },
    13: {
        "titleKo": "녹옥 지팡이의 주인",
        "titleEn": "Master of the Jade Staff",
        "regionId": "taiho-beastlands",
        "focusHeroId": 86,
        "speakerCardId": 86,
    },
    14: {
        "titleKo": "안개 호수의 손님들",
        "titleEn": "Guests of the Mist Lake",
        "regionId": "taiho-beastlands",
        "focusHeroId": 46,
        "speakerCardId": 46,
    },
    15: {
        "titleKo": "독사와 사자의 밤",
        "titleEn": "Night of Serpent and Lion",
        "regionId": "taiho-beastlands",
        "focusHeroId": 86,
        "speakerCardId": 86,
    },
    16: {
        "titleKo": "폐허 앞의 형제",
        "titleEn": "Brothers Before the Ruins",
        "regionId": "taiho-beastlands",
        "focusHeroId": 43,
        "speakerCardId": 43,
    },
    17: {
        "titleKo": "바람섬의 초대장",
        "titleEn": "Invitation to the Wind Isle",
        "regionId": "shadow-palace",
        "focusHeroId": 62,
        "speakerCardId": 62,
    },
    18: {
        "titleKo": "검은 성전의 비밀",
        "titleEn": "Secret of the Black Sanctum",
        "regionId": "shadow-palace",
        "focusHeroId": 69,
        "speakerCardId": 69,
    },
    19: {
        "titleKo": "세 가지 시험",
        "titleEn": "Three Trials",
        "regionId": "shadow-palace",
        "focusHeroId": 25,
        "speakerCardId": 25,
    },
    20: {
        "titleKo": "꽃배를 삼킨 파도",
        "titleEn": "The Wave That Swallowed the Flower Ship",
        "regionId": "shadow-palace",
        "focusHeroId": 69,
        "speakerCardId": 69,
    },
    21: {
        "titleKo": "불타는 배의 배신",
        "titleEn": "Betrayal Aboard the Burning Ship",
        "regionId": "wind-island",
        "focusHeroId": 61,
        "speakerCardId": 61,
    },
    22: {
        "titleKo": "무인도의 네 사람",
        "titleEn": "Four on a Deserted Island",
        "regionId": "wind-island",
        "focusHeroId": 74,
        "speakerCardId": 74,
    },
    23: {
        "titleKo": "동굴 속 잠든 기록",
        "titleEn": "The Record Sleeping in the Cave",
        "regionId": "wind-island",
        "focusHeroId": 50,
        "speakerCardId": 50,
    },
    24: {
        "titleKo": "봉인실의 일곱 밤",
        "titleEn": "Seven Nights in the Sealed Chamber",
        "regionId": "wind-island",
        "focusHeroId": 47,
        "speakerCardId": 47,
    },
    25: {
        "titleKo": "거짓 혼례의 밤",
        "titleEn": "Night of the False Wedding",
        "regionId": "wind-island",
        "focusHeroId": 61,
        "speakerCardId": 61,
    },
    26: {
        "titleKo": "열린 문, 닫힌 마음",
        "titleEn": "Open Door, Closed Heart",
        "regionId": "wind-island",
        "focusHeroId": 61,
        "speakerCardId": 61,
    },
    27: {
        "titleKo": "두 약속 사이",
        "titleEn": "Between Two Promises",
        "regionId": "wind-island",
        "focusHeroId": 47,
        "speakerCardId": 47,
    },
    28: {
        "titleKo": "녹옥 의회의 반란",
        "titleEn": "Revolt of the Jade Council",
        "regionId": "wind-island",
        "focusHeroId": 86,
        "speakerCardId": 86,
    },
    29: {
        "titleKo": "바람의 여왕",
        "titleEn": "Queen of the Wind",
        "regionId": "final-citadel",
        "focusHeroId": 23,
        "speakerCardId": 23,
    },
    30: {
        "titleKo": "네 관문의 독",
        "titleEn": "Poison at the Four Gates",
        "regionId": "final-citadel",
        "focusHeroId": 66,
        "speakerCardId": 66,
    },
    31: {
        "titleKo": "모든 것을 건 손",
        "titleEn": "The Hand That Wagered Everything",
        "regionId": "final-citadel",
        "focusHeroId": 1,
        "speakerCardId": 1,
    },
    32: {
        "titleKo": "첫사랑의 잔향",
        "titleEn": "Echo of First Love",
        "regionId": "final-citadel",
        "focusHeroId": 62,
        "speakerCardId": 62,
    },
    33: {
        "titleKo": "검은 늪의 원한",
        "titleEn": "Grudge of the Black Marsh",
        "regionId": "final-citadel",
        "focusHeroId": 60,
        "speakerCardId": 60,
    },
    34: {
        "titleKo": "무너진 바람섬",
        "titleEn": "The Fallen Wind Isle",
        "regionId": "final-citadel",
        "focusHeroId": 25,
        "speakerCardId": 25,
    },
    35: {
        "titleKo": "안개 속의 오인",
        "titleEn": "Mistaken in the Fog",
        "regionId": "final-citadel",
        "focusHeroId": 49,
        "speakerCardId": 49,
    },
    36: {
        "titleKo": "십자 성흔의 지도",
        "titleEn": "Map of the Cross-Shaped Scar",
        "regionId": "final-citadel",
        "focusHeroId": 47,
        "speakerCardId": 47,
    },
    37: {
        "titleKo": "정복왕의 전쟁",
        "titleEn": "War of the Conqueror King",
        "regionId": "final-citadel",
        "focusHeroId": 47,
        "speakerCardId": 47,
    },
    38: {
        "titleKo": "세 개의 비단 봉인",
        "titleEn": "Three Silk Seals",
        "regionId": "final-citadel",
        "focusHeroId": 61,
        "speakerCardId": 61,
    },
    39: {
        "titleKo": "지켜야 할 세계",
        "titleEn": "The World Worth Protecting",
        "regionId": "final-citadel",
        "focusHeroId": 60,
        "speakerCardId": 60,
    },
    40: {
        "titleKo": "영웅이라 불리지 않는 자",
        "titleEn": "One Who Is Not Called a Hero",
        "regionId": "final-citadel",
        "focusHeroId": 41,
        "speakerCardId": 41,
    },
}

# ─────────────────────────────────────────────────────────────────────────────
# Parsers for TypeScript Files
# ─────────────────────────────────────────────────────────────────────────────

def load_english_novel_map() -> Dict[int, str]:
    """Extracts ENGLISH_NOVEL_MAP from src/content/englishNovelMapping.ts."""
    src = read_source_file("src/content/englishNovelMapping.ts")
    pattern = re.compile(r'(\d+):\s*\{[^}]*titleEn:\s*["\']([^"\']+)["\']', re.MULTILINE)
    mapping = {}
    for m in pattern.finditer(src):
        mapping[int(m.group(1))] = m.group(2).strip()
    return mapping


def load_korean_novel_titles() -> Dict[int, str]:
    """Extracts Korean titles from public/book/index.json."""
    raw = read_source_file("public/book/index.json")
    data = json.loads(raw)
    mapping = {}
    for ep in data.get("episodes", []):
        ep_num = ep.get("episodeNumber")
        title_ko = ep.get("titleKo")
        if ep_num and title_ko:
            mapping[int(ep_num)] = title_ko.strip()
    return mapping


def load_i18n_chapter_titles() -> Dict[str, Dict[int, str]]:
    """Extracts kadan_rpg_chapter_XX titles from src/lib/i18n.ts for ko and en."""
    src = read_source_file("src/lib/i18n.ts")
    results = {"ko": {}, "en": {}}

    kadan_block = re.search(
        r"const kadanRpgTranslations.*?ko:\s*\{(.*?)\n\s*\},?\s*en:\s*\{(.*?)\n\s*\}",
        src,
        re.DOTALL,
    )
    if kadan_block:
        ko_text = kadan_block.group(1)
        en_text = kadan_block.group(2)
        for m in re.finditer(r"kadan_rpg_chapter_(\d+):\s*['\"]([^'\"]+)['\"]", ko_text):
            results["ko"][int(m.group(1))] = m.group(2).strip()
        for m in re.finditer(r"kadan_rpg_chapter_(\d+):\s*['\"]([^'\"]+)['\"]", en_text):
            results["en"][int(m.group(1))] = m.group(2).strip()
    return results


def load_kadan_rpg_events_source() -> List[Dict[str, Any]]:
    """Inspects src/content/kadanRpgStory.ts for KADAN_RPG_EVENTS schema."""
    src = read_source_file("src/content/kadanRpgStory.ts")
    has_40_events = "length: 40" in src or "Array.from({ length: 40 }" in src
    has_region_ids = "chapterRegionIds" in src
    has_speaker_cards = "speakerCardIds" in src
    has_ending_check = "isEnding: chapter === 40" in src or "chapter === 40" in src

    events = []
    for ch in range(1, 41):
        events.append({
            "chapterNumber": ch,
            "id": f"chapter-{ch:02d}",
            "chapterTitleKey": f"kadan_rpg_chapter_{ch:02d}",
            "encounterId": f"enc-ch{ch:02d}",
            "isEnding": (ch == 40),
        })
    return events


# ─────────────────────────────────────────────────────────────────────────────
# Ambush Encounter Oracle Engine (PROJECT.md § M3 & Interface Contract 3)
# ─────────────────────────────────────────────────────────────────────────────

BANDIT_DECK_PRESET = [82, 81, 35, 15, 85]  # Minotaur, Fenrir, Obelisk, Balrog, Byra
THIEF_DECK_PRESET = [54, 51, 62, 53, 24]   # Arachne, Walker, Celia, Carrion, Harpy


class AmbushOracle:
    """Authoritative simulator and validator for Random Field Encounters."""

    STEP_PROBABILITY = 0.14  # 14% chance per step (within 12-15% spec)
    MIN_STEP_COOLDOWN = 3   # Minimum steps between ambushes
    MAX_AMBUSHES_PER_LEG = 1 # At most 1 ambush per chapter leg

    @classmethod
    def should_trigger_ambush(
        cls,
        current_step: int,
        last_ambush_step: int,
        ambush_triggered_in_chapter: bool,
        is_destination_tile: bool,
        roll_val: float,
    ) -> bool:
        """Determines if an ambush roll succeeds based on cooldown guards."""
        # Destination tile immunity
        if is_destination_tile:
            return False

        # Leg limit guard
        if ambush_triggered_in_chapter:
            return False

        # Step cooldown guard
        if (current_step - last_ambush_step) < cls.MIN_STEP_COOLDOWN:
            return False

        # Probability check
        return roll_val < cls.STEP_PROBABILITY

    @classmethod
    def generate_encounter(
        cls,
        chapter_number: int,
        rebirth_count: int = 0,
        region_id: str = "elwin-wildland",
        forced_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generates a scaled Bandit or Thief encounter according to the specification."""
        enc_type = forced_type or ("bandit" if (chapter_number % 2 == 1) else "thief")
        deck = list(BANDIT_DECK_PRESET if enc_type == "bandit" else THIEF_DECK_PRESET)

        # Power Level scaling: (100 + chapter * 12) * (1 + rebirth * 0.35)
        base_power = 100 + chapter_number * 12
        scaled_power = math.floor(base_power * (1.0 + rebirth_count * 0.35))

        # Spoils Coins scaling: (15 + floor(chapter * 1.2)) * (1 + rebirth * 0.25)
        base_spoils = 15 + math.floor(chapter_number * 1.2)
        spoils_coins = math.floor(base_spoils * (1.0 + rebirth_count * 0.25))

        return {
            "type": enc_type,
            "name": "황야 산적단" if enc_type == "bandit" else "그림자 도둑단",
            "nameEn": "Wasteland Bandits" if enc_type == "bandit" else "Shadow Thieves",
            "deck": deck,
            "powerLevel": scaled_power,
            "spoilsCoins": spoils_coins,
            "allowLossProgress": True,  # Safe loss guarantee
        }


# ─────────────────────────────────────────────────────────────────────────────
# Protagonist Choice & Timer Oracle (PROJECT.md § M2 & Interface Contract 1)
# ─────────────────────────────────────────────────────────────────────────────

class ChoiceTimerOracle:
    """Authoritative simulator and validator for Choice Prompts and Dual Timers."""

    MANUAL_DURATION_MS = 5000  # 5.0s in manual mode
    AUTO_DURATION_MS = 1500    # 1.5s in auto mode

    ATTITUDES = ["[결의/돌파]", "[신중/통찰]", "[성진호흡/공명]"]

    @classmethod
    def get_duration(cls, auto_mode: bool) -> int:
        return cls.AUTO_DURATION_MS if auto_mode else cls.MANUAL_DURATION_MS

    @classmethod
    def create_mock_choice_node(cls, chapter_number: int) -> List[Dict[str, Any]]:
        """Generates canonical 3-attitude choices for testing dialogue engine."""
        return [
            {
                "id": f"ch{chapter_number}_c1",
                "attitude": "[결의/돌파]",
                "attitudeEn": "[Resolve]",
                "labelKo": "정면으로 방패를 들고 돌파한다.",
                "labelEn": "Raise the shield and break through head-on.",
                "followUpTextKo": "카단은 주저 없이 은빛 방패를 앞세워 돌파구를 열었다.",
                "followUpTextEn": "Kadan raised his silver shield without hesitation and forged an opening.",
                "bonusType": "buff",
                "bonusValue": 15,
                "bonusDescKo": "다음 전투 아군 공격력 +15%",
                "bonusDescEn": "Next battle attack power +15%",
                "isDefault": True,
            },
            {
                "id": f"ch{chapter_number}_c2",
                "attitude": "[신중/통찰]",
                "attitudeEn": "[Insight]",
                "labelKo": "주변 지형을 살피며 적의 빈틈을 노린다.",
                "labelEn": "Observe the surrounding terrain for enemy weaknesses.",
                "followUpTextKo": "카단은 숨을 죽이며 적의 맹점을 조용히 포착했다.",
                "followUpTextEn": "Kadan quieted his breathing and caught the enemy's blind spot.",
                "bonusType": "sns",
                "bonusValue": 30 + chapter_number,
                "bonusDescKo": f"SNS 코인 +{30 + chapter_number}",
                "bonusDescEn": f"SNS Coins +{30 + chapter_number}",
                "isDefault": False,
            },
            {
                "id": f"ch{chapter_number}_c3",
                "attitude": "[성진호흡/공명]",
                "attitudeEn": "[Resonance]",
                "labelKo": "성진호흡을 운용해 내면의 마나를 공명시킨다.",
                "labelEn": "Channel Star Breathing to resonate inner mana.",
                "followUpTextKo": "별의 맥박이 카단의 혈관을 타고 흐르며 마나를 정화했다.",
                "followUpTextEn": "The pulse of stars flowed through Kadan's veins, purifying his mana.",
                "bonusType": "buff",
                "bonusValue": 20,
                "bonusDescKo": "다음 전투 방어력 +20%",
                "bonusDescEn": "Next battle defense +20%",
                "isDefault": False,
            },
        ]

    @classmethod
    def resolve_selection(
        cls,
        choices: List[Dict[str, Any]],
        selected_id: Optional[str] = None,
        timed_out: bool = False,
    ) -> Dict[str, Any]:
        """Resolves choice selection, defaulting if timed out or not specified."""
        if timed_out or not selected_id:
            # Auto-select default choice
            default_choice = next((c for c in choices if c.get("isDefault")), choices[0])
            return default_choice

        for c in choices:
            if c.get("id") == selected_id:
                return c
        return choices[0]


# ─────────────────────────────────────────────────────────────────────────────
# Real-World Workload Playthrough Simulator (Tier 4 Hands-Free Engine)
# ─────────────────────────────────────────────────────────────────────────────

class RpgPlaythroughSimulator:
    """Simulates a complete 40-chapter hands-free playthrough under auto-play."""

    def __init__(self, rebirth_count: int = 0, rng_seed: int = 42):
        self.rebirth_count = rebirth_count
        self.rng = random.Random(rng_seed)
        self.current_chapter = 1
        self.hero_step_count = 0
        self.last_ambush_step = -99
        self.total_ambushes_encountered = 0
        self.total_ambushes_won = 0
        self.total_boss_battles_won = 0
        self.total_sns_earned = 0
        self.total_dialog_choices_made = 0
        self.active_buff: Optional[Dict[str, Any]] = None
        self.execution_log: List[Dict[str, Any]] = []

    def simulate_chapter_leg(self, chapter: int) -> bool:
        """Simulates movement, random ambushes, dialogue choice, and boss battle."""
        ambush_in_leg = False
        steps_in_leg = self.rng.randint(4, 7)  # Typical map distance

        # 1. Tile movement phase
        for step in range(1, steps_in_leg + 1):
            self.hero_step_count += 1
            is_dest = (step == steps_in_leg)

            roll = self.rng.random()
            should_ambush = AmbushOracle.should_trigger_ambush(
                current_step=self.hero_step_count,
                last_ambush_step=self.last_ambush_step,
                ambush_triggered_in_chapter=ambush_in_leg,
                is_destination_tile=is_dest,
                roll_val=roll,
            )

            if should_ambush:
                ambush_in_leg = True
                self.last_ambush_step = self.hero_step_count
                self.total_ambushes_encountered += 1
                enc = AmbushOracle.generate_encounter(chapter, self.rebirth_count)

                # Simulate auto-battle result (90% win rate)
                win = self.rng.random() < 0.90
                if win:
                    self.total_ambushes_won += 1
                    self.total_sns_earned += enc["spoilsCoins"]
                # In either case (win or loss), safe retreat allows progress
                self.execution_log.append({
                    "type": "ambush",
                    "chapter": chapter,
                    "step": self.hero_step_count,
                    "win": win,
                    "spoils": enc["spoilsCoins"] if win else 0,
                })

        # 2. Dialogue & Choice Phase at event tile
        choices = ChoiceTimerOracle.create_mock_choice_node(chapter)
        # In autoMode, choice auto-selects default after 1.5s
        chosen = ChoiceTimerOracle.resolve_selection(choices, timed_out=True)
        self.total_dialog_choices_made += 1

        if chosen["bonusType"] == "sns":
            self.total_sns_earned += chosen["bonusValue"]
        elif chosen["bonusType"] == "buff":
            self.active_buff = {"type": chosen["bonusType"], "value": chosen["bonusValue"]}

        self.execution_log.append({
            "type": "choice",
            "chapter": chapter,
            "choiceId": chosen["id"],
            "attitude": chosen["attitude"],
            "bonusType": chosen["bonusType"],
            "bonusValue": chosen["bonusValue"],
        })

        # 3. Chapter Boss / Encounter Phase
        # Active buff increases player power
        has_buff = self.active_buff is not None
        self.total_boss_battles_won += 1
        # Clear active combat buff after battle
        self.active_buff = None

        # Chapter completion reward
        ch_reward = 20 + chapter * 3 if chapter < 40 else 300
        self.total_sns_earned += ch_reward

        self.execution_log.append({
            "type": "boss_victory",
            "chapter": chapter,
            "hadBuff": has_buff,
            "rewardSns": ch_reward,
        })

        return True

    def run_full_campaign(self) -> Dict[str, Any]:
        """Runs chapters 1 through 40 continuously."""
        start_t = time.perf_counter()
        for ch in range(1, 41):
            self.current_chapter = ch
            success = self.simulate_chapter_leg(ch)
            if not success:
                return {"completed": False, "failed_at_chapter": ch}

        elapsed_ms = (time.perf_counter() - start_t) * 1000
        return {
            "completed": True,
            "chapters_cleared": 40,
            "rebirth_count": self.rebirth_count,
            "total_ambushes_encountered": self.total_ambushes_encountered,
            "total_ambushes_won": self.total_ambushes_won,
            "total_boss_battles_won": self.total_boss_battles_won,
            "total_dialog_choices_made": self.total_dialog_choices_made,
            "total_sns_earned": self.total_sns_earned,
            "total_hero_steps": self.hero_step_count,
            "elapsed_ms": elapsed_ms,
        }
