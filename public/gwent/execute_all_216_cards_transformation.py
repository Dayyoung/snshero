import json
import os
import subprocess
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

print("=== Starting Full 216-Card Uniform Transformation System ===")

font_path = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
font_title = ImageFont.truetype(font_path, 33, index=5)  # Bold 33pt
font_sub = ImageFont.truetype(font_path, 19, index=4)    # SemiBold 19pt
font_desc = ImageFont.truetype(font_path, 17, index=4)   # SemiBold 17pt
font_power_hero = ImageFont.truetype(font_path, 46, index=5)
font_power_normal = ImageFont.truetype(font_path, 42, index=5)
font_sm_title = ImageFont.truetype(font_path, 16, index=4)

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
    },
    "special": {
        "name_ko": "특수",
        "bg_top": (45, 20, 65),
        "bg_bot": (18, 8, 30),
        "border": (215, 165, 245),
        "border_inner": (175, 120, 215),
        "accent": (230, 180, 255)
    },
    "weather": {
        "name_ko": "날씨",
        "bg_top": (20, 42, 60),
        "bg_bot": (10, 22, 35),
        "border": (90, 185, 225),
        "border_inner": (140, 210, 245),
        "accent": (130, 220, 255)
    }
}

cards1 = Image.open("img/cards1.png").convert("RGBA")
cards2 = Image.open("img/cards2.png").convert("RGBA")
cards3 = Image.open("img/cards3.png").convert("RGBA")

# 1. Load CARD_DATABASE from snshero
node_script = """
const db = require("/tmp/cardDB.js");
console.log(JSON.stringify(db));
"""
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

SHEET3_CELL_MAPPING = {
    # === NORTHERN REALMS LEADERS ===
    201: (0, 0),  # 성왕 폴테스트 (Foltest King of Temeria - 수염 난 왕관 왕)
    202: (0, 3),  # 총사령관 폴테스트 (Foltest Commander of the North - 황금 갑옷 왕)
    203: (1, 3),  # 공성왕 폴테스트 (Foltest Siegemaster - 황금 갑옷 지휘관 왕)
    204: (3, 8),  # 강철군주 폴테스트 (Foltest Steel Lord - 중장갑 강철 기사)
    205: (4, 8),  # 성기사 폴테스트 (Foltest Paladin King - 투구를 쓴 성기사)

    # === NILFGAARD LEADERS ===
    206: (0, 7),  # 황제 에미르 (Emhyr the Relentless - 지도를 든 지휘관 황제)
    207: (1, 7),  # 제왕 에미르 (Emhyr the White Flame Dancing - 지도를 든 근엄한 제왕)
    208: (0, 8),  # 백염의 에미르 (Emhyr White Flame - 은발의 지팡이 대군주)
    209: (2, 7),  # 정복왕 에미르 (Emhyr Emperor of Nilfgaard - 지도를 든 정복군주)
    210: (1, 8),  # 침략군주 에미르 (Emhyr Invader Lord - 위엄 있는 은발 대군주)

    # === MONSTERS LEADERS (WILD HUNT) ===
    211: (8, 0),  # 기병군주 에레딘 (Eredin King of the Wild Hunt - 얼음 서리 갑옷의 군주)
    212: (8, 1),  # 사신 에레딘 (Eredin Reaper - 창백한 푸른 투구의 사신 전사)
    213: (9, 0),  # 파멸자 에레딘 (Eredin Destroyer of Worlds - 얼음 왕관의 파멸 군주)
    214: (9, 1),  # 유령왕 에레딘 (Eredin Ghost King - 차가운 영혼을 부리는 서리 군주)
    215: (3, 4),  # 배신자 에레딘 (Eredin Treacherous Commander - 어둠의 복면 암살자)

    # === SCOIATAEL LEADERS ===
    216: (0, 6),  # 엘프여왕 프란체스카 (Francesca Queen of Dol Blathanna - 금빛 왕관과 녹색 예복의 엘프 여왕)
    217: (1, 6),  # 매혹의 프란체스카 (Francesca Radiant Sorceress - 우아한 금발의 엘프 여왕)
    218: (2, 6),  # 꽃의 군주 프란체스카 (Francesca Daisy of the Valley - 화려한 엘프 꽃의 군주)
    219: (0, 1),  # 순혈군주 프란체스카 (Francesca Pureblood Noble - 붉은 망토에 왕관을 쓴 고귀한 여왕)
    220: (1, 1),  # 희망의 인도자 프란체스카 (Francesca Hopebringer - 아름다운 푸른 왕관의 여왕)

    # === SKELLIGE LEADERS ===
    221: (0, 4),  # 해양대군주 크라크 (Crach an Craite Warlord - 용맹한 해양 부족장)
    222: (1, 0),  # 설산의 브란 왕 (King Bran High King - 백발에 풍성한 수염을 지닌 스켈리게 노왕)

    # === SPECIAL CARDS ===
    223: (6, 7),  # 미끼 인형 (Decoy Dummy - 과녁 훈련용 허수아비 인형)
    224: (6, 6),  # 전장의 나팔 (Commander's Horn - 붉은 깃발 달린 황금빛 뿔나팔)
    225: (6, 8),  # 멸망의 업화 (Scorch Cataclysm - 불타는 화염 파이어볼)
    226: (6, 9),  # 광전사의 비약 (Berserker Elixir - 룬 문자가 새겨진 붉은 마법 비약 병!)

    # === WEATHER CARDS ===
    227: (6, 0),  # 혹한의 서리 (Biting Frost - 얼음 눈보라 소용돌이)
    228: (6, 4),  # 맑은 창공 (Clear Sky - 찬란하게 빛나는 태양)
    229: (6, 1),  # 침묵의 안개 (Impenetrable Fog - 안개 속 유령/망령)
    230: (6, 2),  # 폭풍의 폭우 (Torrential Rain - 번개 치는 먹구름 폭우)
    231: (6, 5),  # 스켈리게 대폭풍 (Skellige Storm - 거대한 바다 회오리 토네이도)
}

def get_sprite(cid):
    if 1 <= cid <= 100:
        idx = cid - 1
        col = idx % 10
        row = idx // 10
        return cards1.crop((col * 100, row * 100, col * 100 + 100, row * 100 + 100))
    elif 101 <= cid <= 200:
        idx = cid - 101
        col = idx % 10
        row = idx // 10
        return cards2.crop((col * 100, row * 100, col * 100 + 100, row * 100 + 100))
    elif 201 <= cid <= 231:
        row, col = SHEET3_CELL_MAPPING[cid]
        return cards3.crop((col * 100, row * 100, col * 100 + 100, row * 100 + 100))
    else:
        raise ValueError(f"Invalid character id: {cid}")

# Unit Mappings (185 units)
UNIT_MAPPING = {
    # === NEUTRAL (16 units) ===
    0: { "cid": 170 },
    3: { "cid": 184, "muster": "대지 수호룡 (Terra Guardian)" },
    6: { "cid": 172 },
    7: { "cid": 174 },
    8: { "cid": 185, "muster": "대지 수호룡 (Terra Guardian)" },
    12: { "cid": 177 },
    13: { "cid": 173 },
    14: { "cid": 176 },
    15: { "cid": 179 },
    16: { "cid": 183 },
    17: { "cid": 181 },
    18: { "cid": 178, "custom_name": "빙원 와이번 (Tundra Wyvern)", "muster": "빙원 와이번 - 다크니스" },
    19: { "cid": 182, "custom_name": "빙원 와이번 - 다크니스 (Tundra Wyvern - Darkness)" },
    20: { "cid": 171 },
    21: { "cid": 180 },
    214: { "cid": 175 },

    # === NORTHERN REALMS (30 units) ===
    27: { "cid": 94, "custom_name": "디바스터 (Devastator)" },
    28: { "cid": 41 },
    29: { "cid": 96 },
    30: { "cid": 101 },
    31: { "cid": 43 },
    32: { "cid": 42 },
    33: { "cid": 47 },
    34: { "cid": 49 },
    35: { "cid": 91, "custom_name": "스파이더봇 (Spiderbot)" },
    36: { "cid": 92, "custom_name": "스파이더봇 (Spiderbot)" },
    37: { "cid": 93, "custom_name": "스파이더봇 (Spiderbot)" },
    38: { "cid": 146 },
    39: { "cid": 102 },
    40: { "cid": 45 },
    41: { "cid": 44 },
    42: { "cid": 147, "custom_name": "황금 와이번 (Golden Wyvern)" },
    43: { "cid": 148, "custom_name": "황금 와이번 (Golden Wyvern)" },
    44: { "cid": 149 },
    45: { "cid": 95 },
    46: { "cid": 46 },
    47: { "cid": 48 },
    48: { "cid": 150 },
    49: { "cid": 99 },
    50: { "cid": 151 },
    51: { "cid": 50 },
    52: { "cid": 152 },
    53: { "cid": 153 },
    54: { "cid": 97, "custom_name": "하이페리온 프라임 (Hyperion Prime)" },
    55: { "cid": 98, "custom_name": "하이페리온 프라임 (Hyperion Prime)" },
    215: { "cid": 100, "custom_name": "디바스터 (Devastator)" },

    # === NILFGAARD (32 units) ===
    61: { "cid": 11 },
    62: { "cid": 31 },
    63: { "cid": 160, "custom_name": "백룡 (White Dragon)" },
    64: { "cid": 161, "custom_name": "백룡 (White Dragon)" },
    65: { "cid": 12 },
    66: { "cid": 32 },
    67: { "cid": 162, "custom_name": "화염의 군주 (Flame Lord Dragon)" },
    68: { "cid": 163, "custom_name": "화염의 군주 (Flame Lord Dragon)" },
    69: { "cid": 33 },
    70: { "cid": 15 },
    71: { "cid": 38 },
    72: { "cid": 106 },
    73: { "cid": 20 },
    74: { "cid": 34 },
    75: { "cid": 40 },
    76: { "cid": 18 },
    77: { "cid": 164 },
    78: { "cid": 16 },
    79: { "cid": 35 },
    80: { "cid": 165 },
    81: { "cid": 17 },
    82: { "cid": 36 },
    83: { "cid": 166 },
    84: { "cid": 13 },
    85: { "cid": 167 },
    86: { "cid": 19 },
    87: { "cid": 37 },
    88: { "cid": 168 },
    89: { "cid": 169 },
    90: { "cid": 14, "custom_name": "파이로 (Pyro)" },
    91: { "cid": 109, "custom_name": "파이로 (Pyro)" },
    92: { "cid": 39 },

    # === MONSTERS (41 units) ===
    98: { "cid": 54, "custom_name": "아라크네 (Arachne)", "muster": "아라크네" },
    99: { "cid": 113, "custom_name": "아라크네 (Arachne)", "muster": "아라크네" },
    100: { "cid": 114, "custom_name": "아라크네 (Arachne)", "muster": "아라크네" },
    101: { "cid": 82, "custom_name": "아라크네 - 베히모스 (Arachne - Behemoth)", "muster": "아라크네" },
    102: { "cid": 115, "custom_name": "크론 - 브루어스 (Crone - Brewess)" },
    103: { "cid": 116, "custom_name": "크론 - 위버 (Crone - Weavess)" },
    104: { "cid": 117, "custom_name": "크론 - 위스퍼 (Crone - Whispess)" },
    105: { "cid": 60 },
    106: { "cid": 118 },
    107: { "cid": 119 },
    108: { "cid": 81 },
    109: { "cid": 120 },
    110: { "cid": 121 },
    111: { "cid": 122 },
    112: { "cid": 83 },
    113: { "cid": 57 },
    114: { "cid": 58 },
    115: { "cid": 85 },
    116: { "cid": 51 },
    117: { "cid": 111 },
    118: { "cid": 84 },
    119: { "cid": 112 },
    120: { "cid": 52, "custom_name": "구울 (Ghoul)" },
    121: { "cid": 124, "custom_name": "구울 (Ghoul)" },
    122: { "cid": 125, "custom_name": "구울 (Ghoul)" },
    123: { "cid": 88 },
    124: { "cid": 110 },
    125: { "cid": 89 },
    126: { "cid": 103 },
    127: { "cid": 53, "custom_name": "캐리언 (Carrion)" },
    128: { "cid": 126, "custom_name": "캐리언 (Carrion)" },
    129: { "cid": 127, "custom_name": "캐리언 (Carrion)" },
    130: { "cid": 55 },
    131: { "cid": 56, "custom_name": "카르디스 - 브룩사 (Cardis - Bruxa)" },
    132: { "cid": 128, "custom_name": "카르디스 - 에킴마라 (Cardis - Ekimmara)" },
    133: { "cid": 129, "custom_name": "카르디스 - 플레더 (Cardis - Fleder)" },
    134: { "cid": 86, "custom_name": "카르디스 - 가르카인 (Cardis - Garkain)" },
    135: { "cid": 59, "custom_name": "카르디스 - 카타칸 (Cardis - Katakan)" },
    136: { "cid": 87 },
    137: { "cid": 90 },
    138: { "cid": 123 },

    # === SCOIATAEL (38 units) ===
    144: { "cid": 61 },
    145: { "cid": 71 },
    146: { "cid": 72 },
    147: { "cid": 62 },
    148: { "cid": 130, "custom_name": "백은 드래곤 (Silver Dragon)" },
    149: { "cid": 131, "custom_name": "백은 드래곤 (Silver Dragon)" },
    150: { "cid": 132, "custom_name": "백은 드래곤 (Silver Dragon)" },
    151: { "cid": 133, "custom_name": "청록 드래곤 (Teal Dragon)" },
    152: { "cid": 134, "custom_name": "청록 드래곤 (Teal Dragon)" },
    153: { "cid": 135, "custom_name": "청록 드래곤 (Teal Dragon)" },
    154: { "cid": 65 },
    155: { "cid": 136, "custom_name": "폭풍 와이번 (Storm Wyvern)" },
    156: { "cid": 137, "custom_name": "폭풍 와이번 (Storm Wyvern)" },
    157: { "cid": 138, "custom_name": "폭풍 와이번 (Storm Wyvern)" },
    158: { "cid": 63 },
    159: { "cid": 70, "custom_name": "숲의 수호룡 (Forest Guardian Dragon)" },
    160: { "cid": 73, "custom_name": "숲의 수호룡 (Forest Guardian Dragon)" },
    161: { "cid": 139, "custom_name": "숲의 수호룡 (Forest Guardian Dragon)" },
    162: { "cid": 64, "custom_name": "티타니아 (Titania)" },
    163: { "cid": 140, "custom_name": "티타니아 (Titania)" },
    164: { "cid": 141, "custom_name": "티타니아 (Titania)" },
    165: { "cid": 66 },
    166: { "cid": 69 },
    167: { "cid": 80 },
    168: { "cid": 74, "custom_name": "그림리 (Grimli)" },
    169: { "cid": 75, "custom_name": "그림리 (Grimli)" },
    170: { "cid": 76, "custom_name": "그림리 (Grimli)" },
    171: { "cid": 77, "custom_name": "그림리 (Grimli)" },
    172: { "cid": 78, "custom_name": "그림리 (Grimli)" },
    173: { "cid": 68 },
    174: { "cid": 142 },
    175: { "cid": 108 },
    176: { "cid": 143 },
    177: { "cid": 67 },
    178: { "cid": 144, "custom_name": "창공 와이번 (Sky Wyvern)" },
    179: { "cid": 145, "custom_name": "창공 와이번 (Sky Wyvern)" },
    180: { "cid": 79 },
    213: { "cid": 107 },

    # === SKELLIGE (28 units) ===
    181: { "cid": 25, "custom_name": "에올루스 (Aeolus)" },
    182: { "cid": 22 },
    183: { "cid": 1 },
    184: { "cid": 10, "custom_name": "포세이돈 (Poseidon)", "muster": "포세이돈 - 호위병" },
    185: { "cid": 21 },
    186: { "cid": 26 },
    187: { "cid": 2, "custom_name": "포세이돈 - 호위병 (Poseidon - Guard)" },
    188: { "cid": 3, "custom_name": "포세이돈 - 호위병 (Poseidon - Guard)" },
    189: { "cid": 154, "custom_name": "포세이돈 - 호위병 (Poseidon - Guard)" },
    190: { "cid": 23 },
    191: { "cid": 27 },
    192: { "cid": 5 },
    193: { "cid": 28 },
    194: { "cid": 155 },
    195: { "cid": 29 },
    196: { "cid": 104 },
    197: { "cid": 30 },
    198: { "cid": 156 },
    199: { "cid": 4 },
    200: { "cid": 157 },
    201: { "cid": 7 },
    203: { "cid": 6 },
    205: { "cid": 8 },
    206: { "cid": 9 },
    207: { "cid": 105 },
    208: { "cid": 158 },
    209: { "cid": 159 },
    210: { "cid": 24, "custom_name": "어린 하피 (Young Harpy)" }
}

# Leader & Special Mappings (31 cards) -> CIDs 201..231
NON_UNIT_MAPPING = {
    # === NORTHERN REALMS LEADERS (Indices 22..26) ===
    22: {
        "cid": 201,
        "title_ko": "성왕 폴테스트",
        "title_en": "Holy King Foltest",
        "name": "성왕 폴테스트 (Holy King Foltest)",
        "lore": "테메리아를 호령하는 성왕. 덱에서 침묵의 안개 카드를 찾아 즉시 전장에 발동합니다."
    },
    23: {
        "cid": 202,
        "title_ko": "총사령관 폴테스트",
        "title_en": "Grand Marshal Foltest",
        "name": "총사령관 폴테스트 (Grand Marshal Foltest)",
        "lore": "북부 연합군의 총사령관. 덱에서 맑은 창공 카드를 찾아 즉시 모든 날씨 효과를 정화합니다."
    },
    24: {
        "cid": 203,
        "title_ko": "공성왕 폴테스트",
        "title_en": "Siege King Foltest",
        "name": "공성왕 폴테스트 (Siege King Foltest)",
        "lore": "공성 무기를 능수능란하게 다루는 군주. 아군 공성 전선의 모든 유닛 공격력을 2배로 배가합니다."
    },
    25: {
        "cid": 204,
        "title_ko": "강철군주 폴테스트",
        "title_en": "Steel Lord Foltest",
        "name": "강철군주 폴테스트 (Steel Lord Foltest)",
        "lore": "불굴의 방어력을 자랑하는 군주. 적 공성 전선 총합이 10 이상일 때 가장 강한 적 공성 유닛을 파괴합니다."
    },
    26: {
        "cid": 205,
        "title_ko": "성기사 폴테스트",
        "title_en": "Paladin King Foltest",
        "name": "성기사 폴테스트 (Paladin King Foltest)",
        "lore": "정의의 깃발 아래 선 군주. 적 원거리 전선 총합이 10 이상일 때 가장 강한 적 원거리 유닛을 파괴합니다."
    },

    # === NILFGAARD LEADERS (Indices 56..60) ===
    56: {
        "cid": 206,
        "title_ko": "황제 에미르",
        "title_en": "Emperor Emhyr",
        "name": "황제 에미르 (Emperor Emhyr)",
        "lore": "제국 전역을 지배하는 황제. 덱에서 폭풍의 폭우 카드를 찾아 즉시 전장에 발동합니다."
    },
    57: {
        "cid": 207,
        "title_ko": "제왕 에미르",
        "title_en": "Imperial Sovereign Emhyr",
        "name": "제왕 에미르 (Imperial Sovereign Emhyr)",
        "lore": "냉철한 책략가. 적의 무작위 패 3장을 엿보고 다음 턴의 전략을 철저히 무너뜨립니다."
    },
    58: {
        "cid": 208,
        "title_ko": "백염의 에미르",
        "title_en": "White Flame Emhyr",
        "name": "백염의 에미르 (White Flame Emhyr)",
        "lore": "적의 묘비 위에서 춤추는 백색 불꽃. 적 지휘관의 리더 능력을 완벽히 봉인하여 무력화합니다."
    },
    59: {
        "cid": 209,
        "title_ko": "정복왕 에미르",
        "title_en": "Conqueror Emhyr",
        "name": "정복왕 에미르 (Conqueror Emhyr)",
        "lore": "승리를 향해 거침없이 전진하는 정복자. 적의 무덤에서 카드 1장을 탈취하여 내 패로 가져옵니다."
    },
    60: {
        "cid": 210,
        "title_ko": "침략군주 에미르",
        "title_en": "Invader Lord Emhyr",
        "name": "침략군주 에미르 (Invader Lord Emhyr)",
        "lore": "북부를 집어삼킨 침략의 군주. 양 플레이어의 무덤을 차단하여 카드 부활 효과를 원천 봉쇄합니다."
    },

    # === MONSTERS LEADERS (Indices 93..97) ===
    93: {
        "cid": 211,
        "title_ko": "기병군주 에레딘",
        "title_en": "Rider Lord Eredin",
        "name": "기병군주 에레딘 (Rider Lord Eredin)",
        "lore": "붉은 기병대를 이끄는 공포의 지휘관. 아군 근접 전선의 모든 유닛 공격력을 2배로 증폭시킵니다."
    },
    94: {
        "cid": 212,
        "title_ko": "사신 에레딘",
        "title_en": "Reaper Eredin",
        "name": "사신 에레딘 (Reaper Eredin)",
        "lore": "죽음을 인도하는 사신. 무덤에서 유닛 카드 1장을 되살려 전장에 즉시 재배치합니다."
    },
    95: {
        "cid": 213,
        "title_ko": "파멸자 에레딘",
        "title_en": "Destroyer Eredin",
        "name": "파멸자 에레딘 (Destroyer Eredin)",
        "lore": "차원을 넘나드는 세계의 파괴자. 덱에서 카드 1장을 뽑고 무작위 카드 2장을 덱으로 되돌립니다."
    },
    96: {
        "cid": 214,
        "title_ko": "유령왕 에레딘",
        "title_en": "Ghost King Eredin",
        "name": "유령왕 에레딘 (Ghost King Eredin)",
        "lore": "칠흑의 안개를 가르는 와일드 헌트의 군주. 덱에서 원하는 날씨 카드를 골라 즉시 발동합니다."
    },
    97: {
        "cid": 215,
        "title_ko": "배신자 에레딘",
        "title_en": "Traitor King Eredin",
        "name": "배신자 에레딘 (Traitor King Eredin)",
        "lore": "음모와 배신의 지배자. 전장에 배치된 모든 스파이 유닛의 공격력을 2배로 폭증시킵니다."
    },

    # === SCOIATAEL LEADERS (Indices 139..143) ===
    139: {
        "cid": 216,
        "title_ko": "엘프여왕 프란체스카",
        "title_en": "Elven Queen Francesca",
        "name": "엘프여왕 프란체스카 (Elven Queen Francesca)",
        "lore": "돌 블라타나의 아름다운 여왕. 적 근접 전선의 총합이 10 이상일 때 가장 강력한 적 근접 유닛을 파괴합니다."
    },
    140: {
        "cid": 217,
        "title_ko": "매혹의 프란체스카",
        "title_en": "Radiant Francesca",
        "name": "매혹의 프란체스카 (Radiant Francesca)",
        "lore": "혹한의 숨결을 부르는 마법사. 덱에서 혹한의 서리 카드를 찾아 즉시 전장에 발동합니다."
    },
    141: {
        "cid": 218,
        "title_ko": "꽃의 군주 프란체스카",
        "title_en": "Daisy Francesca",
        "name": "꽃의 군주 프란체스카 (Daisy Francesca)",
        "lore": "골짜기의 꽃이라 불리는 현자. 라운드 개시 시 덱에서 카드 1장을 추가로 드로우합니다."
    },
    142: {
        "cid": 219,
        "title_ko": "순혈군주 프란체스카",
        "title_en": "Pureblood Francesca",
        "name": "순혈군주 프란체스카 (Pureblood Francesca)",
        "lore": "고대 혈통의 정통 후계자. 엘프 종족의 특수 강화 효과를 발동하여 전세를 뒤집습니다."
    },
    143: {
        "cid": 220,
        "title_ko": "희망의 인도자 프란체스카",
        "title_en": "Hopebringer Francesca",
        "name": "희망의 인도자 프란체스카 (Hopebringer Francesca)",
        "lore": "자유를 꿈꾸는 엔 세이디의 수호자. 아군 원거리 전선의 모든 유닛 공격력을 2배로 증폭합니다."
    },

    # === SKELLIGE LEADERS (Indices 211, 212) ===
    211: {
        "cid": 221,
        "title_ko": "해양대군주 크라크",
        "title_en": "Warlord Crach",
        "name": "해양대군주 크라크 (Warlord Crach)",
        "lore": "거친 바다의 맹주. 양 플레이어의 무덤에 안치된 모든 전사들을 덱으로 되돌려 다시 섞습니다."
    },
    212: {
        "cid": 222,
        "title_ko": "설산의 브란 왕",
        "title_en": "High King Bran",
        "name": "설산의 브란 왕 (High King Bran)",
        "lore": "혹한의 군도를 다스리는 국왕. 날씨 카드로 인한 전선 공격력 페널티를 절반으로 완화합니다."
    },

    # === SPECIAL CARDS (Indices 1, 5, 10, 202) ===
    1: {
        "cid": 223,
        "title_ko": "미끼 인형",
        "title_en": "Decoy Dummy",
        "name": "미끼 인형 (Decoy Dummy)",
        "lore": "전장에 배치된 아군 일반 유닛 1장과 자리를 맞바꿔 해당 카드를 다시 패로 회수하는 전술 인형입니다."
    },
    5: {
        "cid": 224,
        "title_ko": "전장의 나팔",
        "title_en": "Commander's Horn",
        "name": "전장의 나팔 (Commander's Horn)",
        "lore": "전열을 고무하는 황금빛 나팔. 배치된 전선 행의 모든 아군 유닛 공격력을 2배로 배가시킵니다."
    },
    10: {
        "cid": 225,
        "title_ko": "멸망의 업화",
        "title_en": "Scorch Cataclysm",
        "name": "멸망의 업화 (Scorch Cataclysm)",
        "lore": "전장을 집어삼키는 심판의 불길. 전장에 존재하는 모든 유닛 중 가장 공격력이 높은 유닛을 전부 소각합니다."
    },
    202: {
        "cid": 226,
        "title_ko": "광전사의 비약",
        "title_en": "Berserker Elixir",
        "name": "광전사의 비약 (Berserker Elixir)",
        "lore": "스켈리게 전사의 야성을 일깨우는 비약. 배치된 행의 모든 버서커 유닛을 거대한 곰 전사로 각성시킵니다."
    },

    # === WEATHER CARDS (Indices 2, 4, 9, 11, 204) ===
    2: {
        "cid": 227,
        "title_ko": "혹한의 서리",
        "title_en": "Biting Frost",
        "name": "혹한의 서리 (Biting Frost)",
        "lore": "대지를 얼어붙게 만드는 살인적인 한파. 양 플레이어의 모든 근접 유닛 공격력을 1로 고정시킵니다."
    },
    4: {
        "cid": 228,
        "title_ko": "맑은 창공",
        "title_en": "Clear Sky",
        "name": "맑은 창공 (Clear Sky)",
        "lore": "먹구름을 걷어내는 찬란한 태양광. 전장에 몰아친 모든 날씨 효과(서리, 안개, 비)를 일시에 정화합니다."
    },
    9: {
        "cid": 229,
        "title_ko": "침묵의 안개",
        "title_en": "Impenetrable Fog",
        "name": "침묵의 안개 (Impenetrable Fog)",
        "lore": "시야를 차단하는 짙은 유령 안개. 양 플레이어의 모든 원거리 유닛 공격력을 1로 고정시킵니다."
    },
    11: {
        "cid": 230,
        "title_ko": "폭풍의 폭우",
        "title_en": "Torrential Rain",
        "name": "폭풍의 폭우 (Torrential Rain)",
        "lore": "시즈 엔진을 침수시키는 격렬한 폭우. 양 플레이어의 모든 공성 유닛 공격력을 1로 고정시킵니다."
    },
    204: {
        "cid": 231,
        "title_ko": "스켈리게 대폭풍",
        "title_en": "Skellige Storm",
        "name": "스켈리게 대폭풍 (Skellige Storm)",
        "lore": "군도를 뒤흔드는 거대한 소용돌이 폭풍. 원거리와 공성 전선에 동시에 재앙을 내려 공격력을 1로 만듭니다."
    }
}

# Merge all into FULL_MAPPING
FULL_MAPPING = {}
for k, v in UNIT_MAPPING.items():
    FULL_MAPPING[k] = v
for k, v in NON_UNIT_MAPPING.items():
    FULL_MAPPING[k] = v

print(f"Total mappings count: {len(FULL_MAPPING)} / 216")
assert len(FULL_MAPPING) == 216, f"Expected exactly 216 cards, got {len(FULL_MAPPING)}"

# Load card_dict
node_dump = """
const fs = require('fs');
eval(fs.readFileSync('cards.js', 'utf8'));
console.log(JSON.stringify(card_dict));
"""
card_dict = json.loads(subprocess.run(["node", "-e", node_dump], capture_output=True, text=True, check=True).stdout)
assert len(card_dict) == 216

def get_char(cid):
    scid = str(cid)
    if scid in CARD_DB:
        c = CARD_DB[scid]
        return { "id": cid, "title": c["title"], "title_en": c["title_en"], "lore": c.get("lore_ko", "") }
    if cid in DRAGON_NAMES:
        d = DRAGON_NAMES[cid]
        return { "id": cid, "title": d["title"], "title_en": d["title_en"], "lore": "" }
    if cid in range(201, 232):
        for idx, m in NON_UNIT_MAPPING.items():
            if m["cid"] == cid:
                return { "id": cid, "title": m["title_ko"], "title_en": m["title_en"], "lore": m["lore"] }
    return { "id": cid, "title": f"캐릭터 #{cid}", "title_en": f"Character #{cid}", "lore": "" }

def render_small_card(cid, faction, strength, is_hero, is_leader, is_special_or_weather, title_ko, ability):
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
    
    # Ambient glow
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    gc = (255, 230, 130) if (is_hero or is_leader) else theme["accent"]
    glow_draw.ellipse([w//2 - 110, h//2 - 100, w//2 + 110, h//2 + 100], fill=(gc[0], gc[1], gc[2], 90))
    glow = glow.filter(ImageFilter.GaussianBlur(40))
    card = Image.alpha_composite(card, glow)
    
    # Sprite processing: LARGE & CRISP for board view
    sprite = get_sprite(cid)
    sprite_size = 295 if cid <= 200 else 275
    sprite_large = sprite.resize((sprite_size, sprite_size), Image.Resampling.LANCZOS)
    if cid > 200:
        p_mask = Image.new("L", (sprite_size, sprite_size), 0)
        ImageDraw.Draw(p_mask).ellipse([6, 6, sprite_size - 7, sprite_size - 7], fill=255)
        sprite_large.putalpha(p_mask)
        
    sprite_mask = sprite_large.getchannel('A')
    
    # Drop shadow
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    s_alpha = sprite_mask.point(lambda p: int(p * 0.7))
    shadow_img = Image.new("RGBA", (sprite_size, sprite_size), (0, 0, 0, 255))
    pos_x = (w - sprite_size) // 2
    pos_y = (h - sprite_size) // 2 + 12
    shadow.paste(shadow_img, (pos_x + 5, pos_y + 8), s_alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    card = Image.alpha_composite(card, shadow)
    
    # Paste character sprite
    card.paste(sprite_large, (pos_x, pos_y), sprite_mask)
    draw = ImageDraw.Draw(card)
    
    # Clean sleek borders
    border_col = (255, 215, 0) if (is_hero or is_leader) else theme["border"]
    border_w = 5 if (is_hero or is_leader) else 3
    draw.rounded_rectangle([border_w//2, border_w//2, w-1-border_w//2, h-1-border_w//2], radius=16, outline=border_col, width=border_w)
    draw.rounded_rectangle([8, 8, w-9, h-9], radius=12, outline=(border_col[0], border_col[1], border_col[2], 90), width=1)
    
    return card.convert("RGB")

def render_large_card(cid, faction, strength, is_hero, is_leader, is_special_or_weather, row, ability, title_ko, title_en, lore=""):
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
    
    # Ambient glow
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    gc = (255, 230, 130) if (is_hero or is_leader) else theme["accent"]
    glow_draw.ellipse([w//2 - 130, 150, w//2 + 130, 450], fill=(gc[0], gc[1], gc[2], 85))
    glow = glow.filter(ImageFilter.GaussianBlur(50))
    card = Image.alpha_composite(card, glow)
    
    # Sprite processing
    sprite = get_sprite(cid)
    sprite_large = sprite.resize((310, 310), Image.Resampling.LANCZOS)
    if cid > 200:
        p_mask = Image.new("L", (310, 310), 0)
        ImageDraw.Draw(p_mask).ellipse([8, 8, 302, 302], fill=255)
        sprite_large.putalpha(p_mask)
        
    sprite_mask = sprite_large.getchannel('A')
    
    # Drop shadow
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    s_alpha = sprite_mask.point(lambda p: int(p * 0.75))
    shadow_img = Image.new("RGBA", (310, 310), (0, 0, 0, 255))
    shadow.paste(shadow_img, (w//2 - 155 + 5, 150 + 8), s_alpha)
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    card = Image.alpha_composite(card, shadow)
    
    # Paste character
    card.paste(sprite_large, (w//2 - 155, 150), sprite_mask)
    draw = ImageDraw.Draw(card)
    
    # Border
    border_col = (255, 215, 0) if (is_hero or is_leader) else theme["border"]
    border_w = 8 if (is_hero or is_leader) else 5
    draw.rounded_rectangle([border_w//2, border_w//2, w-1-border_w//2, h-1-border_w//2], radius=22, outline=border_col, width=border_w)
    draw.rounded_rectangle([12, 12, w-13, h-13], radius=16, outline=(border_col[0], border_col[1], border_col[2], 120), width=1)
    
    # Power & Badges (Only for Unit cards with strength)
    cur_y = 12
    if not is_leader and not is_special_or_weather:
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
                abi_img = Image.open(abi_path).resize((66, 66), Image.Resampling.LANCZOS)
                card.paste(abi_img, (18, cur_y), abi_img)
            except Exception:
                pass
    elif is_leader:
        # Leader badge
        try:
            crown_img = Image.open("img/icons/icon_leader_active.png").resize((84, 84), Image.Resampling.LANCZOS)
            card.paste(crown_img, (20, 20), crown_img)
        except Exception:
            pass
    elif is_special_or_weather:
        # Special/Weather badge
        if ability:
            abi_key = ability.split()[0]
            abi_path = f"img/icons/card_ability_{abi_key}.png"
            if os.path.exists(abi_path):
                try:
                    abi_img = Image.open(abi_path).resize((78, 78), Image.Resampling.LANCZOS)
                    card.paste(abi_img, (20, 20), abi_img)
                except Exception:
                    pass

    # Bottom plaque
    plaque_y = 545
    plaque_h = 215
    plaque = Image.new("RGBA", (w - 24, plaque_h), (10, 12, 18, 245))
    pdraw = ImageDraw.Draw(plaque)
    pdraw.rounded_rectangle([0, 0, w - 25, plaque_h - 1], radius=14, outline=(border_col[0], border_col[1], border_col[2], 180), width=2)
    card.paste(plaque, (12, plaque_y), plaque)
    draw = ImageDraw.Draw(card)
    
    t_bbox = font_title.getbbox(title_ko)
    t_w = t_bbox[2] - t_bbox[0]
    t_col = (255, 238, 140) if (is_hero or is_leader) else (255, 255, 255)
    draw.text(((w - t_w)//2 + 1, plaque_y + 12 + 1), title_ko, font=font_title, fill=(0, 0, 0, 240))
    draw.text(((w - t_w)//2, plaque_y + 12), title_ko, font=font_title, fill=t_col)
    
    f_name = theme["name_ko"]
    if is_leader:
        type_str = "지도자 (Leader)"
    elif is_special_or_weather:
        type_str = "특수 카드 (Special)" if faction == "special" else "날씨 카드 (Weather)"
    elif is_hero:
        type_str = "영웅 유닛 (Hero)"
    else:
        type_str = "일반 유닛 (Unit)"
        
    sub_text = f"{title_en} • {f_name} {type_str}"
    s_bbox = font_sub.getbbox(sub_text)
    s_w = s_bbox[2] - s_bbox[0]
    draw.text(((w - s_w)//2 + 1, plaque_y + 52 + 1), sub_text, font=font_sub, fill=(0, 0, 0, 220))
    draw.text(((w - s_w)//2, plaque_y + 52), sub_text, font=font_sub, fill=(200, 225, 255))
    
    draw.line([(30, plaque_y + 82), (w - 30, plaque_y + 82)], fill=(border_col[0], border_col[1], border_col[2], 130), width=1)
    
    if not lore:
        lore = f"{f_name}의 강력한 {type_str} 카드로, 전장에서 뛰어난 전술적 가치를 지닙니다."
        
    words = lore.split(" ")
    lines = []
    cur_line = ""
    for word in words:
        test = cur_line + (" " if cur_line else "") + word
        if font_desc.getbbox(test)[2] - font_desc.getbbox(test)[0] < (w - 55):
            cur_line = test
        else:
            if cur_line: lines.append(cur_line)
            cur_line = word
    if cur_line: lines.append(cur_line)
    
    ly = plaque_y + 94
    for line in lines[:3]:
        lw = font_desc.getbbox(line)[2] - font_desc.getbbox(line)[0]
        draw.text(((w - lw)//2 + 1, ly + 1), line, font=font_desc, fill=(0, 0, 0, 240))
        draw.text(((w - lw)//2, ly), line, font=font_desc, fill=(245, 245, 245))
        ly += 26
        
    return card.convert("RGB")

print("Rendering ALL 216 cards and updating card_dict...")
rendered_count = 0
for idx, card in enumerate(card_dict):
    cfg = FULL_MAPPING[idx]
    cid = cfg["cid"]
    cinfo = get_char(cid)
    
    is_leader = card["row"] == "leader"
    is_special_or_weather = card["deck"] in ["special", "weather"]
    is_hero = "hero" in (card.get("ability", "") or "").split()
    faction = card["deck"]
    strength = int(card["strength"]) if (card["strength"] != "" and not is_special_or_weather and not is_leader) else 0
    row = card["row"]
    ability = card.get("ability", "")
    
    # Title KO for small card
    title_ko = cfg.get("title_ko", cinfo["title"])
    title_en = cfg.get("title_en", cinfo["title_en"])
    lore = cfg.get("lore", cinfo.get("lore", ""))
    lore_en = cinfo.get("lore_en", "")

    if "custom_name" in cfg:
        final_name = cfg["custom_name"]
    elif "name" in cfg:
        final_name = cfg["name"]
    else:
        final_name = f"{title_ko} ({title_en})"
        
    card["name"] = final_name
    card["title_ko"] = title_ko
    card["title_en"] = title_en
    card["lore_ko"] = lore
    card["lore_en"] = lore_en
    card["characterId"] = cid
    if "muster" in cfg:
        card["muster"] = cfg["muster"]
    
    # 1. Render small image
    sm_img = render_small_card(cid, faction, strength, is_hero, is_leader, is_special_or_weather, title_ko, ability)
    sm_path = f"img/sm/{faction}_{card['filename']}.jpg"
    sm_img.save(sm_path, quality=95)
    
    # 2. Render large image
    lg_img = render_large_card(cid, faction, strength, is_hero, is_leader, is_special_or_weather, row, ability, title_ko, title_en, lore)
    lg_path = f"img/lg/{faction}_{card['filename']}.jpg"
    lg_img.save(lg_path, quality=95)
    
    rendered_count += 1
    if rendered_count % 30 == 0 or rendered_count == 216:
        print(f"  Rendered {rendered_count}/216 cards...")

print(f"Successfully rendered all {rendered_count} cards for both sm and lg!")

# Save updated cards.js
print("Saving updated cards.js...")
cards_js_content = "var card_dict = JSON.parse(\n'[ '\n"
for i, c in enumerate(card_dict):
    c_json = json.dumps(c, ensure_ascii=False)
    c_json_escaped = c_json.replace("'", "\\'")
    prefix = "+ '" if i == 0 else "+ ', "
    cards_js_content += f"{prefix}{c_json_escaped}'\n"
cards_js_content += "+ ' ]'\n);\n"

with open("cards.js", "w", encoding="utf-8") as f:
    f.write(cards_js_content)
print("cards.js written successfully!")

# Generate cards.css with all 231 character sprites
print("Generating expanded cards.css...")
css_content = """/* ==========================================================================
   GWENT REIMAGINED - ALL 216 CARDS UNIFIED SYSTEM
   Sprite Coordinates for Sheets 1, 2, 3 & Card Enhancements
   ========================================================================== */

/* Character Sprite Definitions */
"""

for cid in range(1, 232):
    if cid <= 100:
        sheet = "cards1.png"
        col = (cid - 1) % 10
        row = (cid - 1) // 10
    elif cid <= 200:
        sheet = "cards2.png"
        col = (cid - 101) % 10
        row = (cid - 101) // 10
    else:
        sheet = "cards3.png"
        row, col = SHEET3_CELL_MAPPING[cid]
        
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
  background-size: contain !important;
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

/* Leader Card Glowing Frame */
.card[data-title*="지도자"], .card[data-title*="폴테스트"], .card[data-title*="에미르"], .card[data-title*="에레딘"], .card[data-title*="프란체스카"], .card[data-title*="크라크"], .card[data-title*="브란"] {
  box-shadow: 0 0 0.7vw rgba(255, 215, 0, 0.6), 0 0.2vw 0.8vw rgba(0, 0, 0, 0.8);
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

print("=== ALL 216 CARDS UNIFORM TRANSFORMATION COMPLETED! ===")
