import json
import os
import subprocess
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

print("=== Starting Full Gwent Card Transformation ===")
font_path = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
font_title = ImageFont.truetype(font_path, 28, index=1)
font_sub = ImageFont.truetype(font_path, 16, index=1)
font_desc = ImageFont.truetype(font_path, 14, index=0)
font_power_hero = ImageFont.truetype(font_path, 42, index=1)
font_power_normal = ImageFont.truetype(font_path, 38, index=1)
font_sm_title = ImageFont.truetype(font_path, 15, index=1)

# 1. Load CARD_DATABASE from snshero
node_script = """
const db = require("/tmp/cardDB.js");
console.log(JSON.stringify(db));
"""
FACTION_THEMES = {
    "realms": {
        "name_ko": "북부 왕국",
        "bg_top": (16, 32, 68),
        "bg_bot": (9, 18, 40),
        "border": (212, 175, 55),
        "border_inner": (100, 149, 237),
        "accent": (245, 208, 97)
    },
    "nilfgaard": {
        "name_ko": "닐프가드",
        "bg_top": (28, 28, 32),
        "bg_bot": (12, 12, 14),
        "border": (225, 170, 50),
        "border_inner": (90, 85, 75),
        "accent": (245, 215, 110)
    },
    "monsters": {
        "name_ko": "괴물",
        "bg_top": (50, 15, 22),
        "bg_bot": (20, 8, 12),
        "border": (195, 60, 75),
        "border_inner": (130, 40, 50),
        "accent": (255, 120, 130)
    },
    "scoiatael": {
        "name_ko": "스코이아'텔",
        "bg_top": (18, 48, 28),
        "bg_bot": (8, 24, 14),
        "border": (70, 180, 110),
        "border_inner": (190, 155, 80),
        "accent": (110, 230, 150)
    },
    "skellige": {
        "name_ko": "스켈리게",
        "bg_top": (16, 45, 62),
        "bg_bot": (8, 22, 32),
        "border": (65, 165, 190),
        "border_inner": (195, 140, 85),
        "accent": (100, 215, 235)
    },
    "neutral": {
        "name_ko": "중립",
        "bg_top": (38, 22, 60),
        "bg_bot": (18, 10, 30),
        "border": (185, 135, 235),
        "border_inner": (215, 185, 245),
        "accent": (230, 195, 255)
    }
}

cards1 = Image.open("img/cards1.png").convert("RGBA")
cards2 = Image.open("img/cards2.png").convert("RGBA")

CARD_DB = json.loads(subprocess.run(["node", "-e", node_script], capture_output=True, text=True, check=True).stdout)

DRAGON_NAMES = {
  111: { "title": "루비 드래곤", "title_en": "Ruby Dragon" },
  112: { "title": "마그마 드래곤", "title_en": "Magma Dragon" },
  113: { "title": "흑요석 드래곤", "title_en": "Obsidian Dragon" },
  114: { "title": "자수정 드래곤", "title_en": "Amethyst Dragon" },
  115: { "title": "에메랄드 드래곤", "title_en": "Emerald Dragon" },
  116: { "title": "사파이어 드래곤", "title_en": "Sapphire Dragon" },
  117: { "title": "태양광 드래곤", "title_en": "Solar Dragon" },
  118: { "title": "프로스트 드레이크", "title_en": "Frost Drake" },
  119: { "title": "토파즈 드래곤", "title_en": "Topaz Dragon" },
  120: { "title": "황혼의 와이번", "title_en": "Twilight Wyvern" },
  121: { "title": "심해룡", "title_en": "Abyssal Dragon" },
  122: { "title": "비취 드래곤", "title_en": "Jade Dragon" },
  123: { "title": "화염룡", "title_en": "Blaze Dragon" },
  124: { "title": "그림자 드래곤", "title_en": "Shadow Dragon" },
  125: { "title": "용암 드래곤", "title_en": "Lava Dragon" },
  126: { "title": "천둥 와이번", "title_en": "Thunder Wyvern" },
  127: { "title": "화산 드래곤", "title_en": "Volcano Dragon" },
  128: { "title": "빙하 드래곤", "title_en": "Glacial Dragon" },
  129: { "title": "암흑 와이번", "title_en": "Dark Wyvern" },
  130: { "title": "백은 드래곤", "title_en": "Silver Dragon" },
  131: { "title": "강철 드래곤", "title_en": "Steel Dragon" },
  132: { "title": "환영 드래곤", "title_en": "Illusion Dragon" },
  133: { "title": "해류 드래곤", "title_en": "Current Dragon" },
  134: { "title": "청록 드래곤", "title_en": "Teal Dragon" },
  135: { "title": "황동 드래곤", "title_en": "Brass Dragon" },
  136: { "title": "폭풍 와이번", "title_en": "Storm Wyvern" },
  137: { "title": "숲의 수호룡", "title_en": "Forest Guardian Dragon" },
  138: { "title": "심연 와이번", "title_en": "Abyss Wyvern" },
  139: { "title": "수정 드래곤", "title_en": "Crystal Dragon" },
  140: { "title": "청룡", "title_en": "Azure Dragon" },
  141: { "title": "칠흑 드래곤", "title_en": "Pitch-black Dragon" },
  142: { "title": "해양 와이번", "title_en": "Oceanic Wyvern" },
  143: { "title": "호박 드래곤", "title_en": "Amber Dragon" },
  144: { "title": "창공 와이번", "title_en": "Sky Wyvern" },
  145: { "title": "맹독 드래곤", "title_en": "Venom Dragon" },
  146: { "title": "취옥 와이번", "title_en": "Emerald Wyvern" },
  147: { "title": "황금 와이번", "title_en": "Golden Wyvern" },
  148: { "title": "설산 드래곤", "title_en": "Snow Mountain Dragon" },
  149: { "title": "혼돈 와이번", "title_en": "Chaos Wyvern" },
  150: { "title": "적룡", "title_en": "Crimson Dragon" },
  151: { "title": "폭풍의 인도자", "title_en": "Storm Bringer" },
  152: { "title": "대지 드레이크", "title_en": "Earth Drake" },
  153: { "title": "홍련 와이번", "title_en": "Crimson Lotus Wyvern" },
  154: { "title": "자연 드래곤", "title_en": "Nature Dragon" },
  155: { "title": "벽력 드래곤", "title_en": "Thunderbolt Dragon" },
  156: { "title": "마룡", "title_en": "Magic Dragon" },
  157: { "title": "환상의 드레이크", "title_en": "Phantasm Drake" },
  158: { "title": "강철 와이번", "title_en": "Iron Wyvern" },
  159: { "title": "작열 드래곤", "title_en": "Scorching Dragon" },
  160: { "title": "백룡", "title_en": "White Dragon" },
  161: { "title": "은하 드래곤", "title_en": "Galaxy Dragon" },
  162: { "title": "화염의 군주", "title_en": "Flame Lord Dragon" },
  163: { "title": "해일 드래곤", "title_en": "Tsunami Dragon" },
  164: { "title": "바위 와이번", "title_en": "Crag Wyvern" },
  165: { "title": "어둠의 군주", "title_en": "Darkness Lord" },
  166: { "title": "해무 드래곤", "title_en": "Sea Mist Dragon" },
  167: { "title": "대수림 드래곤", "title_en": "Great Forest Dragon" },
  168: { "title": "태양 드레이크", "title_en": "Sun Drake" },
  169: { "title": "청천 드래곤", "title_en": "Azure Sky Dragon" },
  170: { "title": "성운 드래곤", "title_en": "Nebula Dragon" },
  171: { "title": "황혼의 포식자", "title_en": "Twilight Predator" },
  172: { "title": "창해 드래곤", "title_en": "Blue Ocean Dragon" },
  173: { "title": "고룡", "title_en": "Ancient Dragon" },
  174: { "title": "밤하늘 드래곤", "title_en": "Night Sky Dragon" },
  175: { "title": "대지 수호룡", "title_en": "Terra Guardian" },
  176: { "title": "염화 드래곤", "title_en": "Flame Flare Dragon" },
  177: { "title": "황금날개 드래곤", "title_en": "Goldwing Dragon" },
  178: { "title": "빙원 와이번", "title_en": "Tundra Wyvern" },
  179: { "title": "빛의 인도자", "title_en": "Lightbringer Dragon" },
  180: { "title": "지옥불 와이번", "title_en": "Hellfire Wyvern" },
  181: { "title": "용암석 드래곤", "title_en": "Magma Rock Dragon" },
  182: { "title": "밤안개 드래곤", "title_en": "Night Fog Dragon" },
  183: { "title": "흑철 드래곤", "title_en": "Black Iron Dragon" },
  184: { "title": "불사조 드래곤", "title_en": "Phoenix Dragon" },
  185: { "title": "천상룡", "title_en": "Celestial Dragon" }
}

def get_char(cid):
    scid = str(cid)
    if scid in CARD_DB:
        c = CARD_DB[scid]
        return { "id": cid, "title": c["title"], "title_en": c["title_en"], "lore": c.get("lore_ko", "") }
    if cid in DRAGON_NAMES:
        d = DRAGON_NAMES[cid]
        return { "id": cid, "title": d["title"], "title_en": d["title_en"], "lore": "" }
    return { "id": cid, "title": f"드래곤 #{cid}", "title_en": f"Dragon #{cid}", "lore": "" }

def get_sprite(cid):
    if 1 <= cid <= 100:
        idx = cid - 1
        col = idx % 10
        row = idx // 10
        x = col * 100
        y = row * 100
        return cards1.crop((x, y, x + 100, y + 100))
    elif 101 <= cid <= 200:
        idx = cid - 101
        col = idx % 10
        row = idx // 10
        x = col * 100
        y = row * 100
        return cards2.crop((x, y, x + 100, y + 100))
    else:
        raise ValueError(f"Invalid character id: {cid}")

# Define MAPPING for all 185 unit cards
MAPPING = {
    # === NEUTRAL (16 units) === (Characters 170..185)
    0: { "cid": 170 },                                              # Mysterious Elf -> 성운 드래곤
    3: { "cid": 184, "muster": "대지 수호룡 (Terra Guardian)" },       # Cirilla -> 불사조 드래곤
    6: { "cid": 172 },                                              # Dandelion -> 창해 드래곤
    7: { "cid": 174 },                                              # Emiel Regis -> 밤하늘 드래곤
    8: { "cid": 185, "muster": "대지 수호룡 (Terra Guardian)" },       # Geralt of Rivia -> 천상룡
    12: { "cid": 177 },                                             # Triss Merigold -> 황금날개 드래곤
    13: { "cid": 173 },                                             # Vesemir -> 고룡
    14: { "cid": 176 },                                             # Villentretenmerth -> 염화 드래곤
    15: { "cid": 179 },                                             # Yennefer of Vengerberg -> 빛의 인도자
    16: { "cid": 183 },                                             # Zoltan Chivay -> 흑철 드래곤
    17: { "cid": 181 },                                             # Olgierd von Everec -> 용암석 드래곤
    18: { "cid": 178, "custom_name": "빙원 와이번 (Tundra Wyvern)", "muster": "빙원 와이번 - 다크니스" }, # Gaunter O'Dimm
    19: { "cid": 182, "custom_name": "빙원 와이번 - 다크니스 (Tundra Wyvern - Darkness)" }, # Gaunter O'Dimm - Darkness
    20: { "cid": 171 },                                             # Cow -> 황혼의 포식자
    21: { "cid": 180 },                                             # Bovine Defense Force -> 지옥불 와이번
    214: { "cid": 175 },                                            # Roach -> 대지 수호룡

    # === NORTHERN REALMS (30 units) === (Characters 41..50, 91..100, 101, 102, 146..153)
    27: { "cid": 94, "custom_name": "디바스터 (Devastator)" },       # Ballista
    28: { "cid": 41 },                                              # Blue Stripes Commando -> 카단
    29: { "cid": 96 },                                              # Catapult -> 시즈엔진
    30: { "cid": 101 },                                             # Crinfrid Reavers -> 드레이크
    31: { "cid": 43 },                                              # Dethmold -> 발리안
    32: { "cid": 42 },                                              # Dun Banner Medic -> 엘윈
    33: { "cid": 47 },                                              # Esterad Thyssen -> 길가메시
    34: { "cid": 49 },                                              # John Natalis -> 헤르쿨
    35: { "cid": 91, "custom_name": "스파이더봇 (Spiderbot)" },      # Kaedweni Siege Expert
    36: { "cid": 92, "custom_name": "스파이더봇 (Spiderbot)" },      # Kaedweni Siege Expert 1
    37: { "cid": 93, "custom_name": "스파이더봇 (Spiderbot)" },      # Kaedweni Siege Expert 2
    38: { "cid": 146 },                                             # Keira Metz -> 취옥 와이번
    39: { "cid": 102 },                                             # Philippa Eilhart -> 와이버니
    40: { "cid": 45 },                                              # Poor Fucking Infantry -> 가웨인
    41: { "cid": 44 },                                              # Prince Stennis -> 카제
    42: { "cid": 147, "custom_name": "황금 와이번 (Golden Wyvern)" },# Redanian Foot Soldier
    43: { "cid": 148, "custom_name": "황금 와이번 (Golden Wyvern)" },# Redanian Foot Soldier 1
    44: { "cid": 149 },                                             # Sheldon Skaggs -> 혼돈 와이번
    45: { "cid": 95 },                                              # Siege Tower -> 골리앗
    46: { "cid": 46 },                                              # Siegfried of Denesle -> 론돌
    47: { "cid": 48 },                                              # Sigismund Dijkstra -> 로비냐드
    48: { "cid": 150 },                                             # Síle de Tansarville -> 적룡
    49: { "cid": 99 },                                              # Thaler -> 마기테크 골렘
    50: { "cid": 151 },                                             # Sabrina Glevissig -> 폭풍의 인도자
    51: { "cid": 50 },                                              # Vernon Roche -> 알렉산다르
    52: { "cid": 152 },                                             # Ves -> 대지 드레이크
    53: { "cid": 153 },                                             # Yarpen Zigrin -> 홍련 와이번
    54: { "cid": 97, "custom_name": "하이페리온 프라임 (Hyperion Prime)" }, # Trebuchet
    55: { "cid": 98, "custom_name": "하이페리온 프라임 (Hyperion Prime)" }, # Trebuchet 1
    215: { "cid": 100, "custom_name": "디바스터 (Devastator)" },     # Ballista 1

    # === NILFGAARD (32 units) === (Characters 11..20, 31..40, 106, 109, 160..169)
    61: { "cid": 11 },                                              # Albrich -> 이그니스
    62: { "cid": 31 },                                              # Assire var Anahid -> 가이아
    63: { "cid": 160, "custom_name": "백룡 (White Dragon)" },       # Black Infantry Archer
    64: { "cid": 161, "custom_name": "백룡 (White Dragon)" },       # Black Infantry Archer 1
    65: { "cid": 12 },                                              # Cahir -> 샐러맨더
    66: { "cid": 32 },                                              # Cynthia -> 그놈
    67: { "cid": 162, "custom_name": "화염의 군주 (Flame Lord Dragon)" }, # Etolian Auxiliary Archers
    68: { "cid": 163, "custom_name": "화염의 군주 (Flame Lord Dragon)" }, # Etolian Auxiliary Archers 1
    69: { "cid": 33 },                                              # Fringilla Vigo -> 테라
    70: { "cid": 15 },                                              # Heavy Zerrikanian Fire Scorpion -> 발록
    71: { "cid": 38 },                                              # Impera Brigade Guard -> 오리하르콘
    72: { "cid": 106 },                                             # Letho of Gulet -> 어스드래곤 테라
    73: { "cid": 20 },                                              # Menno Coehoorn -> 이그니시우스
    74: { "cid": 34 },                                              # Morteisen -> 고르곤
    75: { "cid": 40 },                                              # Morvran Voorhis -> 콜로서스
    76: { "cid": 18 },                                              # Nausicaa Cavalry Rider -> 불사신 아셀
    77: { "cid": 164 },                                             # Puttkammer -> 바위 와이번
    78: { "cid": 16 },                                              # Rainfarn -> 무스펠
    79: { "cid": 35 },                                              # Renuald aep Matsen -> 오벨리스크
    80: { "cid": 165 },                                             # Rotten Mangonel -> 어둠의 군주
    81: { "cid": 17 },                                              # Shilard Fitz-Oesterlen -> 이바르
    82: { "cid": 36 },                                              # Siege Engineer -> 그랜드로크
    83: { "cid": 166 },                                             # Siege Technician -> 해무 드래곤
    84: { "cid": 13 },                                              # Stefan Skellen -> 벨페고르
    85: { "cid": 167 },                                             # Sweers -> 대수림 드래곤
    86: { "cid": 19 },                                              # Tibor Eggebracht -> 피닉스
    87: { "cid": 37 },                                              # Vanhemar -> 록타
    88: { "cid": 168 },                                             # Vattier de Rideaux -> 태양 드레이크
    89: { "cid": 169 },                                             # Vreemde -> 청천 드래곤
    90: { "cid": 14, "custom_name": "파이로 (Pyro)" },               # Young Emissary
    91: { "cid": 109, "custom_name": "파이로 (Pyro)" },              # Young Emissary 1
    92: { "cid": 39 },                                              # Zerrikanian Fire Scorpion -> 아틀라스

    # === MONSTERS (41 units) === (Characters 51..60, 81..90, 103, 110, 111..129)
    98: { "cid": 54, "custom_name": "아라크네 (Arachne)", "muster": "아라크네" },         # Arachas
    99: { "cid": 113, "custom_name": "아라크네 (Arachne)", "muster": "아라크네" },        # Arachas 1
    100: { "cid": 114, "custom_name": "아라크네 (Arachne)", "muster": "아라크네" },       # Arachas 2
    101: { "cid": 82, "custom_name": "아라크네 - 베히모스 (Arachne - Behemoth)", "muster": "아라크네" }, # Arachas- Behemoth
    102: { "cid": 115, "custom_name": "크론 - 브루어스 (Crone - Brewess)" },     # Crone - Brewess
    103: { "cid": 116, "custom_name": "크론 - 위버 (Crone - Weavess)" },         # Crone - Weavess
    104: { "cid": 117, "custom_name": "크론 - 위스퍼 (Crone - Whispess)" },       # Crone - Whispess
    105: { "cid": 60 },                                             # Draug -> 데스나이트 아르투스
    106: { "cid": 118 },                                            # Earth Elemental -> 프로스트 드레이크
    107: { "cid": 119 },                                            # Endrega -> 토파즈 드래곤
    108: { "cid": 81 },                                             # Fiend -> 펜릴
    109: { "cid": 120 },                                            # Fire Elemental -> 황혼의 와이번
    110: { "cid": 121 },                                            # Fogling -> 심해룡
    111: { "cid": 122 },                                            # Forktail -> 비취 드래곤
    112: { "cid": 83 },                                             # Frightener -> 요르문간드
    113: { "cid": 57 },                                             # Gargoyle -> 스톤가고일
    114: { "cid": 58 },                                             # Grave Hag -> 사이드라고사
    115: { "cid": 85 },                                             # Griffin -> 바이라
    116: { "cid": 51 },                                             # Botchling -> 워커
    117: { "cid": 111 },                                            # Bruxa -> 루비 드래곤
    118: { "cid": 84 },                                             # Celaeno Harpy -> 그리폰
    119: { "cid": 112 },                                            # Cockatrice -> 마그마 드래곤
    120: { "cid": 52, "custom_name": "구울 (Ghoul)" },               # Ghoul
    121: { "cid": 124, "custom_name": "구울 (Ghoul)" },              # Ghoul 1
    122: { "cid": 125, "custom_name": "구울 (Ghoul)" },              # Ghoul 2
    123: { "cid": 88 },                                             # Ice Giant -> 우르삭
    124: { "cid": 110 },                                            # Imlerith -> 드레드윙
    125: { "cid": 89 },                                             # Kayran -> 메두사 고르고
    126: { "cid": 103 },                                            # Leshen -> 네더드래곤
    127: { "cid": 53, "custom_name": "캐리언 (Carrion)" },           # Nekker
    128: { "cid": 126, "custom_name": "캐리언 (Carrion)" },          # Nekker 1
    129: { "cid": 127, "custom_name": "캐리언 (Carrion)" },          # Nekker 2
    130: { "cid": 55 },                                             # Plague Maiden -> 패치워크
    131: { "cid": 56, "custom_name": "카르디스 - 브룩사 (Cardis - Bruxa)" },       # Vampire - Bruxa
    132: { "cid": 128, "custom_name": "카르디스 - 에킴마라 (Cardis - Ekimmara)" },   # Vampire - Ekimmara
    133: { "cid": 129, "custom_name": "카르디스 - 플레더 (Cardis - Fleder)" },     # Vampire - Fleder
    134: { "cid": 86, "custom_name": "카르디스 - 가르카인 (Cardis - Garkain)" },     # Vampire - Garkain
    135: { "cid": 59, "custom_name": "카르디스 - 카타칸 (Cardis - Katakan)" },     # Vampire - Katakan
    136: { "cid": 87 },                                             # Werewolf -> 바르가스트
    137: { "cid": 90 },                                             # Wyvern -> 페가수스
    138: { "cid": 123 },                                            # Toad -> 화염룡

    # === SCOIATAEL (38 units) === (Characters 61..70, 71..80, 107, 108, 130..145)
    144: { "cid": 61 },                                             # Ciaran -> 루시안
    145: { "cid": 71 },                                             # Barclay Els -> 발보
    146: { "cid": 72 },                                             # Dennis Cranmer -> 프레도
    147: { "cid": 63 },                                             # Dol Blathanna Archer -> 엘리아나
    148: { "cid": 130, "custom_name": "백은 드래곤 (Silver Dragon)" }, # Dol Blathanna Scout
    149: { "cid": 131, "custom_name": "백은 드래곤 (Silver Dragon)" }, # Dol Blathanna Scout 1
    150: { "cid": 132, "custom_name": "백은 드래곤 (Silver Dragon)" }, # Dol Blathanna Scout 2
    151: { "cid": 73, "custom_name": "샘와이 (Samwy)" },             # Dwarven Skirmisher
    152: { "cid": 133, "custom_name": "샘와이 (Samwy)" },            # Dwarven Skirmisher 1
    153: { "cid": 134, "custom_name": "샘와이 (Samwy)" },            # Dwarven Skirmisher 2
    154: { "cid": 70 },                                             # Eithné -> 에일라
    155: { "cid": 62, "custom_name": "실리아 (Celia)" },             # Elven Skirmisher
    156: { "cid": 135, "custom_name": "실리아 (Celia)" },            # Elven Skirmisher 1
    157: { "cid": 136, "custom_name": "실리아 (Celia)" },            # Elven Skirmisher 2
    158: { "cid": 65 },                                             # Filavandrel -> 실바니아
    159: { "cid": 137, "custom_name": "숲의 수호룡 (Forest Guardian Dragon)" }, # Havekar Healer
    160: { "cid": 138, "custom_name": "숲의 수호룡 (Forest Guardian Dragon)" }, # Havekar Healer 1
    161: { "cid": 139, "custom_name": "숲의 수호룡 (Forest Guardian Dragon)" }, # Havekar Healer 2
    162: { "cid": 64, "custom_name": "티타니아 (Titania)" },         # Havekar Smuggler
    163: { "cid": 140, "custom_name": "티타니아 (Titania)" },        # Havekar Smuggler 1
    164: { "cid": 141, "custom_name": "티타니아 (Titania)" },        # Havekar Smuggler 2
    165: { "cid": 66 },                                             # Ida Emean -> 말퓨온
    166: { "cid": 69 },                                             # Iorveth -> 간다르
    167: { "cid": 80 },                                             # Isengrim -> 아이언포지
    168: { "cid": 74, "custom_name": "그림리 (Grimli)" },            # Mahakaman Defender
    169: { "cid": 75, "custom_name": "그림리 (Grimli)" },            # Mahakaman Defender 1
    170: { "cid": 76, "custom_name": "그림리 (Grimli)" },            # Mahakaman Defender 2
    171: { "cid": 77, "custom_name": "그림리 (Grimli)" },            # Mahakaman Defender 3
    172: { "cid": 78, "custom_name": "그림리 (Grimli)" },            # Mahakaman Defender 4
    173: { "cid": 68 },                                             # Milva -> 캘토르
    174: { "cid": 142 },                                            # Riordain -> 해양 와이번
    175: { "cid": 108 },                                            # Saesenthessis -> 알렉스트라
    176: { "cid": 143 },                                            # Toruviel -> 호박 드래곤
    177: { "cid": 67 },                                             # Vrihedd Recruit -> 베작스
    178: { "cid": 144, "custom_name": "창공 와이번 (Sky Wyvern)" },  # Vrihedd Veteran
    179: { "cid": 145, "custom_name": "창공 와이번 (Sky Wyvern)" },  # Vrihedd Veteran 1
    180: { "cid": 79 },                                             # Yaevinn -> 베리포지
    213: { "cid": 107 },                                            # Schirru -> 이셀라

    # === SKELLIGE (28 units) === (Characters 1..10, 21..30, 104, 105, 154..159)
    181: { "cid": 25, "custom_name": "에올루스 (Aeolus)" },          # Berserker (no "Young")
    182: { "cid": 22 },                                             # Birna Bran -> 실프
    183: { "cid": 1 },                                              # Blueboy Lugos -> 아쿠아리스
    184: { "cid": 10, "custom_name": "포세이돈 (Poseidon)", "muster": "포세이돈 - 호위병" },        # Cerys
    185: { "cid": 21 },                                             # Clan Brokva Archer -> 제피로스
    186: { "cid": 26 },                                             # Clan Dimun Pirate -> 템페스트
    187: { "cid": 2, "custom_name": "포세이돈 - 호위병 (Poseidon - Guard)" }, # Shield Maiden
    188: { "cid": 3, "custom_name": "포세이돈 - 호위병 (Poseidon - Guard)" }, # Shield Maiden 1
    189: { "cid": 154, "custom_name": "포세이돈 - 호위병 (Poseidon - Guard)" }, # Shield Maiden 2
    190: { "cid": 23 },                                             # Clan Heymaey Skald -> 실피드
    191: { "cid": 27 },                                             # Clan Tordarroch -> 사이클론
    192: { "cid": 5 },                                              # Clan an Craite Warrior -> 아쿠아로드
    193: { "cid": 28 },                                             # Donar an Hindar -> 제우스피어
    194: { "cid": 155 },                                            # Draig Bon-Dhu -> 벽력 드래곤
    195: { "cid": 29 },                                             # Ermion -> 뇌신
    196: { "cid": 104 },                                            # Hemdall -> 바하무트
    197: { "cid": 30 },                                             # Hjalmar -> 바람신 토람
    198: { "cid": 156 },                                            # Holger Blackhand -> 마룡
    199: { "cid": 4 },                                              # Kambi -> 켈피
    200: { "cid": 157 },                                            # Light Longship -> 환상의 드레이크
    201: { "cid": 7 },                                              # Madman Lugos -> 가르간티아
    203: { "cid": 6 },                                              # Olaf -> 레비아탄
    205: { "cid": 8 },                                              # Svanrige -> 캐스케이드
    206: { "cid": 9 },                                              # Transformed Vildkaarl -> 크라켄
    207: { "cid": 105 },                                            # Transformed Young Vildkaarl -> 스파이크드래곤
    208: { "cid": 158 },                                            # Udalryk -> 강철 와이번
    209: { "cid": 159 },                                            # War Longship -> 작열 드래곤
    210: { "cid": 24, "custom_name": "어린 하피 (Young Harpy)" }     # Young Berserker (contains "Young")
}

print(f"Total MAPPING size: {len(MAPPING)}")
all_cids = [MAPPING[k]["cid"] for k in MAPPING]
print(f"Unique CIDs: {len(set(all_cids))}")
assert len(set(all_cids)) == 185, f"Expected 185 unique CIDs, got {len(set(all_cids))}"
assert set(all_cids) == set(range(1, 186)), "CIDs must be 1..185"
print("Verification passed! All 185 CIDs from 1 to 185 match perfectly.")

# 2. Load card_dict from cards.js
node_dump = """
const fs = require('fs');
eval(fs.readFileSync('cards.js', 'utf8'));
console.log(JSON.stringify(card_dict));
"""
card_dict = json.loads(subprocess.run(["node", "-e", node_dump], capture_output=True, text=True, check=True).stdout)

# 3. Process cards and generate images
os.makedirs("img/sm", exist_ok=True)
os.makedirs("img/lg", exist_ok=True)

font_sm_title = ImageFont.truetype(font_path, 15, index=1)

def render_small_card(char_id, faction, strength, is_hero, title_ko):
    w, h = 309, 444
    theme = FACTION_THEMES.get(faction, FACTION_THEMES["neutral"])
    card = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    
    grad = Image.new("RGBA", (w, h))
    gdraw = ImageDraw.Draw(grad)
    for y in range(h):
        f = y / h
        r = int(theme["bg_top"][0]*(1-f) + theme["bg_bot"][0]*f)
        g = int(theme["bg_top"][1]*(1-f) + theme["bg_bot"][1]*f)
        b = int(theme["bg_top"][2]*(1-f) + theme["bg_bot"][2]*f)
        gdraw.line([(0, y), (w, y)], fill=(r, g, b, 255))
    
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w-1, h-1], radius=16, fill=255)
    card.paste(grad, (0, 0), mask)
    
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    gc = theme["accent"] if not is_hero else (255, 230, 130)
    glow_draw.ellipse([w//2 - 90, h//2 - 110, w//2 + 90, h//2 + 70], fill=(gc[0], gc[1], gc[2], 65))
    glow = glow.filter(ImageFilter.GaussianBlur(35))
    card = Image.alpha_composite(card, glow)
    
    sprite = get_sprite(char_id)
    sprite_large = sprite.resize((210, 210), Image.Resampling.LANCZOS)
    sprite_mask = sprite_large.getchannel('A')
    
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    s_alpha = sprite_mask.point(lambda p: int(p * 0.6))
    shadow_img = Image.new("RGBA", (210, 210), (0, 0, 0, 255))
    shadow.paste(shadow_img, (w//2 - 105 + 4, h//2 - 115 + 6), s_alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(8))
    card = Image.alpha_composite(card, shadow)
    
    card.paste(sprite_large, (w//2 - 105, h//2 - 115), sprite_mask)
    draw = ImageDraw.Draw(card)
    
    border_col = (255, 215, 0) if is_hero else theme["border"]
    border_w = 6 if is_hero else 4
    draw.rounded_rectangle([border_w//2, border_w//2, w-1-border_w//2, h-1-border_w//2], radius=16, outline=border_col, width=border_w)
    draw.rounded_rectangle([10, 10, w-11, h-11], radius=12, outline=(border_col[0], border_col[1], border_col[2], 100), width=1)
    
    banner_h = 32
    banner_y = h - 42
    banner = Image.new("RGBA", (w, banner_h), (0, 0, 0, 175))
    card.paste(banner, (0, banner_y), banner)
    draw = ImageDraw.Draw(card)
    draw.line([(12, banner_y), (w-12, banner_y)], fill=(border_col[0], border_col[1], border_col[2], 180), width=1)
    
    bbox = font_sm_title.getbbox(title_ko)
    tw = bbox[2] - bbox[0]
    draw.text(((w - tw) // 2, banner_y + 7), title_ko, font=font_sm_title, fill=(255, 255, 255))
    
    return card.convert("RGB")

def render_large_card(char_id, faction, strength, is_hero, row, ability, title_ko, title_en, lore=""):
    w, h = 410, 775
    theme = FACTION_THEMES.get(faction, FACTION_THEMES["neutral"])
    card = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    
    grad = Image.new("RGBA", (w, h))
    gdraw = ImageDraw.Draw(grad)
    for y in range(h):
        f = y / h
        r = int(theme["bg_top"][0]*(1-f) + theme["bg_bot"][0]*f)
        g = int(theme["bg_top"][1]*(1-f) + theme["bg_bot"][1]*f)
        b = int(theme["bg_top"][2]*(1-f) + theme["bg_bot"][2]*f)
        gdraw.line([(0, y), (w, y)], fill=(r, g, b, 255))
    
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w-1, h-1], radius=22, fill=255)
    card.paste(grad, (0, 0), mask)
    
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    gc = theme["accent"] if not is_hero else (255, 230, 130)
    glow_draw.ellipse([w//2 - 130, 150, w//2 + 130, 450], fill=(gc[0], gc[1], gc[2], 75))
    glow = glow.filter(ImageFilter.GaussianBlur(50))
    card = Image.alpha_composite(card, glow)
    
    sprite = get_sprite(char_id)
    sprite_large = sprite.resize((310, 310), Image.Resampling.LANCZOS)
    sprite_mask = sprite_large.getchannel('A')
    
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    s_alpha = sprite_mask.point(lambda p: int(p * 0.7))
    shadow_img = Image.new("RGBA", (310, 310), (0, 0, 0, 255))
    shadow.paste(shadow_img, (w//2 - 155 + 5, 150 + 8), s_alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    card = Image.alpha_composite(card, shadow)
    
    card.paste(sprite_large, (w//2 - 155, 150), sprite_mask)
    draw = ImageDraw.Draw(card)
    
    border_col = (255, 215, 0) if is_hero else theme["border"]
    border_w = 8 if is_hero else 5
    draw.rounded_rectangle([border_w//2, border_w//2, w-1-border_w//2, h-1-border_w//2], radius=22, outline=border_col, width=border_w)
    draw.rounded_rectangle([12, 12, w-13, h-13], radius=16, outline=(border_col[0], border_col[1], border_col[2], 120), width=1)
    
    badge_name = "power_hero.png" if is_hero else "power_normal.png"
    p_badge = Image.open("img/icons/" + badge_name)
    p_size = 126 if is_hero else 114
    p_badge = p_badge.resize((p_size, p_size), Image.Resampling.LANCZOS)
    card.paste(p_badge, (4, 4), p_badge)
    
    str_text = str(strength)
    p_font = font_power_hero if is_hero else font_power_normal
    p_bbox = p_font.getbbox(str_text)
    pw = p_bbox[2] - p_bbox[0]
    ph = p_bbox[3] - p_bbox[1]
    
    center_x = 4 + int(p_size * 68.5 / 215)
    center_y = 4 + int(p_size * 68.5 / 215)
    if is_hero:
        draw.text((center_x - pw//2 + 2, center_y - ph//2 + 2), str_text, font=p_font, fill=(0, 0, 0, 220))
        draw.text((center_x - pw//2, center_y - ph//2), str_text, font=p_font, fill=(255, 255, 255))
    else:
        draw.text((center_x - pw//2 + 1, center_y - ph//2 + 1), str_text, font=p_font, fill=(255, 255, 255, 180))
        draw.text((center_x - pw//2, center_y - ph//2), str_text, font=p_font, fill=(20, 20, 20))
        
    cur_y = p_size - 4
    if row in ["close", "ranged", "siege", "agile"]:
        row_img = Image.open(f"img/icons/card_row_{row}.png")
        row_img = row_img.resize((66, 66), Image.Resampling.LANCZOS)
        card.paste(row_img, (18, cur_y), row_img)
        cur_y += 70
        
    if ability and ability not in ["", "none"]:
        abi_key = ability.split()[-1]
        if abi_key in ["scorch_c", "scorch_r", "scorch_s"]: abi_key = "scorch"
        if abi_key == "cerys": abi_key = "muster"
        if abi_key.startswith("avenger"): abi_key = "avenger"
        abi_path = f"img/icons/card_ability_{abi_key}.png"
        try:
            abi_img = Image.open(abi_path)
            abi_img = abi_img.resize((66, 66), Image.Resampling.LANCZOS)
            card.paste(abi_img, (18, cur_y), abi_img)
        except Exception:
            pass

    plaque_y = 565
    plaque_h = 195
    plaque = Image.new("RGBA", (w - 24, plaque_h), (12, 14, 20, 225))
    pdraw = ImageDraw.Draw(plaque)
    pdraw.rounded_rectangle([0, 0, w - 25, plaque_h - 1], radius=12, outline=(border_col[0], border_col[1], border_col[2], 160), width=2)
    card.paste(plaque, (12, plaque_y), plaque)
    draw = ImageDraw.Draw(card)
    
    t_bbox = font_title.getbbox(title_ko)
    t_w = t_bbox[2] - t_bbox[0]
    draw.text(((w - t_w)//2, plaque_y + 16), title_ko, font=font_title, fill=(255, 235, 140) if is_hero else (255, 255, 255))
    
    f_name = theme["name_ko"]
    type_str = "영웅 (Hero)" if is_hero else "유닛 (Unit)"
    sub_text = f"{title_en} • {f_name} {type_str}"
    s_bbox = font_sub.getbbox(sub_text)
    s_w = s_bbox[2] - s_bbox[0]
    draw.text(((w - s_w)//2, plaque_y + 55), sub_text, font=font_sub, fill=(180, 200, 220))
    
    draw.line([(35, plaque_y + 82), (w - 35, plaque_y + 82)], fill=(border_col[0], border_col[1], border_col[2], 100), width=1)
    
    if not lore:
        lore = f"{f_name}의 강력한 {type_str} 캐릭터로, 전장에서 뛰어난 전술적 가치를 지닙니다."
    
    words = lore.split(" ")
    lines = []
    cur_line = ""
    for word in words:
        test = cur_line + (" " if cur_line else "") + word
        if font_desc.getbbox(test)[2] - font_desc.getbbox(test)[0] < (w - 60):
            cur_line = test
        else:
            if cur_line: lines.append(cur_line)
            cur_line = word
    if cur_line: lines.append(cur_line)
    
    ly = plaque_y + 96
    for line in lines[:3]:
        lw = font_desc.getbbox(line)[2] - font_desc.getbbox(line)[0]
        draw.text(((w - lw)//2, ly), line, font=font_desc, fill=(215, 215, 215))
        ly += 22
        
    return card.convert("RGB")

print("Rendering cards and updating card_dict...")
rendered_count = 0
for idx, card in enumerate(card_dict):
    if idx not in MAPPING:
        continue
    
    cfg = MAPPING[idx]
    cid = cfg["cid"]
    cinfo = get_char(cid)
    
    is_hero = "hero" in (card.get("ability", "") or "").split()
    faction = card["deck"]
    strength = int(card["strength"]) if card["strength"] != "" else 0
    row = card["row"]
    ability = card.get("ability", "")
    
    if "custom_name" in cfg:
        final_name = cfg["custom_name"]
    else:
        final_name = f"{cinfo['title']} ({cinfo['title_en']})"
        
    card["name"] = final_name
    card["characterId"] = cid
    if "muster" in cfg:
        card["muster"] = cfg["muster"]
        
    # Render small image
    sm_img = render_small_card(cid, faction, strength, is_hero, cinfo["title"])
    sm_path = f"img/sm/{faction}_{card['filename']}.jpg"
    sm_img.save(sm_path, quality=95)
    
    # Render large image
    lg_img = render_large_card(cid, faction, strength, is_hero, row, ability, cinfo["title"], cinfo["title_en"], cinfo.get("lore", ""))
    lg_path = f"img/lg/{faction}_{card['filename']}.jpg"
    lg_img.save(lg_path, quality=95)
    
    rendered_count += 1
    if rendered_count % 25 == 0 or rendered_count == 185:
        print(f"  Rendered {rendered_count}/185 cards...")

print(f"Successfully rendered all {rendered_count} cards for both sm and lg!")

# 4. Save updated cards.js
print("Saving updated cards.js...")
cards_js_content = "var card_dict = JSON.parse(\n'[ '\n"
for i, c in enumerate(card_dict):
    c_json = json.dumps(c, ensure_ascii=False)
    # escape single quotes
    c_json_escaped = c_json.replace("'", "\\'")
    prefix = "+ '" if i == 0 else "+ ', "
    cards_js_content += f"{prefix}{c_json_escaped}'\n"
cards_js_content += "+ ' ]'\n);\n"

with open("cards.js", "w", encoding="utf-8") as f:
    f.write(cards_js_content)
print("cards.js written successfully!")

# 5. Generate cards.css with CSS sprites and modern card styling
print("Generating cards.css...")
css_content = """/* ==========================================================================
   GWENT REIMAGINED - 200 CHARACTER CARD SYSTEM
   Sprite Coordinates & Custom Card Styles
   ========================================================================== */

/* Character Sprite Definitions */
"""

for cid in range(1, 186):
    sheet = "cards1.png" if cid <= 100 else "cards2.png"
    offset = (cid - 1) if cid <= 100 else (cid - 101)
    col = offset % 10
    row = offset // 10
    x_pct = f"{col * 11.1111:.4f}%"
    y_pct = f"{row * 11.1111:.4f}%"
    css_content += f""".card-sprite-{cid} {{
  background-image: url('img/{sheet}');
  background-size: 1000% 1000%;
  background-position: {x_pct} {y_pct};
  background-repeat: no-repeat;
  image-rendering: auto;
}}
"""

css_content += """
/* Enhanced Card Visuals */
.card {
  border-radius: 0.35vw;
  box-shadow: 0 0.15vw 0.5vw rgba(0, 0, 0, 0.6);
  transition: transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.18s ease;
}

.card:hover {
  transform: translateY(-0.25vw) scale(1.04);
  box-shadow: 0 0.5vw 1.2vw rgba(0, 0, 0, 0.85), 0 0 0.8vw rgba(212, 175, 55, 0.4);
  z-index: 100 !important;
}

/* Hero Shimmer Effect */
.card.hero {
  box-shadow: 0 0 0.6vw rgba(255, 215, 0, 0.5), 0 0.2vw 0.8vw rgba(0, 0, 0, 0.7);
}

.card.hero:hover {
  box-shadow: 0 0 1.2vw rgba(255, 215, 0, 0.85), 0 0.6vw 1.5vw rgba(0, 0, 0, 0.9);
}

/* Card Tooltip Enhancements */
.card::after {
  font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
  font-weight: bold;
  letter-spacing: 0.02em;
}

/* Large Card Preview */
.card-lg {
  border-radius: 1.2vw;
  box-shadow: 0 0.5vw 2vw rgba(0, 0, 0, 0.85);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.card-description {
  font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
}

.card-description > h1 {
  font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
  letter-spacing: 0.03em;
}
"""

with open("cards.css", "w", encoding="utf-8") as f:
    f.write(css_content)
print("cards.css written successfully!")

# 6. Ensure index.html links cards.css
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

if "cards.css" not in html:
    html = html.replace('href="style.css">', 'href="style.css">\n\t<link rel="stylesheet" type="text/css" href="cards.css">')
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("index.html updated with cards.css link!")
else:
    print("cards.css already linked in index.html.")

print("=== All Operations Completed Successfully! ===")
