#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SNSHero — 'Kadan's Journey (카단의 여정)' 40-Episode Novel
Official Location Concept Sheets (20 Locations) & Prop Concept Sheets (20 Props) Builder.
All naming follows the canonical English novel terminology for unified AI image/video prompt generation.
"""

import json
import os
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

OUT_DIR = "public/anime-character-sheets"
RAW_LOC_DIR = os.path.join(OUT_DIR, "raw_locations")
RAW_PROP_DIR = os.path.join(OUT_DIR, "raw_props")

LOC_ART_DIR = os.path.join(OUT_DIR, "locations", "art")
LOC_SHEET_DIR = os.path.join(OUT_DIR, "locations", "sheets")
PROP_ART_DIR = os.path.join(OUT_DIR, "props", "art")
PROP_SHEET_DIR = os.path.join(OUT_DIR, "props", "sheets")

for d in [LOC_ART_DIR, LOC_SHEET_DIR, PROP_ART_DIR, PROP_SHEET_DIR]:
    os.makedirs(d, exist_ok=True)


def get_font(size: int, bold: bool = False):
    candidates = [
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",
        "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                idx = 6 if (bold and path.endswith(".ttc")) else 0
                return ImageFont.truetype(path, size, index=idx)
            except Exception:
                try:
                    return ImageFont.truetype(path, size)
                except Exception:
                    pass
    return ImageFont.load_default()


# ==============================================================================
# 20 CANONICAL NOVEL LOCATIONS (배경장소 시트 명세 — 영문 소설 공식 용어 통일)
# ==============================================================================
LOCATIONS = [
    {
        "id": 1,
        "code": "LOC-001",
        "slug": "Elwin_Village",
        "nameEn": "Elwin Village",
        "nameKo": "엘윈 마을",
        "regionEn": "Southern Frontier of Lighthaven",
        "regionKo": "라이트헤븐 남단 설원 변경",
        "episodes": [1, 2, 9, 10, 12, 40],
        "color": "#0284c7",
        "gridFile": "loc_grid_01.jpg",
        "quadrant": 0,
        "summaryKo": "라이트헤븐 왕국 남쪽 끝자락, 거친 산맥과 얼어붙은 툰드라가 맞닿은 설원 변경 마을. 알렉산다르와 발리안이 눈보라 속에서 형제의 서약을 맺은 이야기의 출발점.",
        "architectureKo": "돌지붕 오두막, 나무 목책과 망루, 얼어붙은 돌다리, 화롯불 연기가 피어오르는 변경 주막",
        "atmosphereKo": "창백한 청백색 눈보라(Blizzard)와 대비되는 창문 속 따뜻한 호박색 등잔불",
        "palette": ["#1E293B", "#38BDF8", "#E2E8F0", "#F59E0B", "#78350F"],
        "promptEn": "Anime environment concept art of Elwin Village in the Kingdom of Lighthaven, a snowbound medieval frontier village at the edge of jagged mountains under a fierce blue-white blizzard, stone-roofed cottages, timber watchtower, frozen stone bridge, warm amber lantern light glowing from windows, Makoto Shinkai and ufotable background style, 8k.",
    },
    {
        "id": 2,
        "code": "LOC-002",
        "slug": "Drunken_Bell_Tower",
        "nameEn": "Drunken Bell Tower",
        "nameKo": "취선루 (거대 청동 종탑 객잔)",
        "regionEn": "River Pier of Lighthaven",
        "regionKo": "라이트헤븐 강나루 포구",
        "episodes": [2, 3],
        "color": "#d97706",
        "gridFile": "loc_grid_01.jpg",
        "quadrant": 1,
        "summaryKo": "성기사 헤르쿨과 강남 일곱 기인이 첫 무력 충돌과 내기를 벌인 강나루의 대객잔이자 거대한 청동 대종이 걸린 종루.",
        "architectureKo": "다층 목조 누각 객잔, 강물 위 나루터 잔교, 수천 근의 고대 청동 대종이 매달린 종각",
        "atmosphereKo": "황혼녘 강안개와 빗줄기, 젖은 나무 바닥에 반사되는 붉은 홍등 불빛",
        "palette": ["#451A03", "#D97706", "#FDE68A", "#0F766E", "#1E293B"],
        "promptEn": "Anime environment concept art of Drunken Bell Tower, a grand multi-story traditional timber lakeside tavern beside a misty river pier at dusk, featuring a massive ornate ancient bronze bell hanging in an open wooden bell pavilion, warm glowing lanterns reflecting on rain-slicked wooden planks, ufotable background art.",
    },
    {
        "id": 3,
        "code": "LOC-003",
        "slug": "Mistfall_Cliff",
        "nameEn": "Mistfall Cliff",
        "nameKo": "미스트폴 절벽 (안개 절벽)",
        "regionEn": "Northern Precipice",
        "regionKo": "북방 천길 운무 절벽",
        "episodes": [3, 5, 11],
        "color": "#475569",
        "gridFile": "loc_grid_01.jpg",
        "quadrant": 2,
        "summaryKo": "자욱한 안개와 칼바람이 휘몰아치는 천길 낭떠러지 절벽. 일곱 추적자가 비극적인 혈투 끝에 카단을 찾아 북방으로 떠날 것을 맹세한 장소.",
        "architectureKo": "얼음과 서리가 뒤덮인 깎아지른 흑암 절벽, 무너진 고대 돌기둥과 폐신전 제단",
        "atmosphereKo": "끝없는 은빛 운해(雲海)와 매서운 칼바람, 차가운 새벽 달빛",
        "palette": ["#0F172A", "#475569", "#94A3B8", "#CBD5E1", "#38BDF8"],
        "promptEn": "Anime environment concept art of Mistfall Cliff, a sheer ice-crusted mountain cliff precipice above a sea of swirling silver clouds and dense fog, ancient ruined stone shrine pillars at the cliff edge, dramatic cold wind currents, cinematic anime background.",
    },
    {
        "id": 4,
        "code": "LOC-004",
        "slug": "Great_Plains_of_the_Wildlands",
        "nameEn": "Great Plains of the Wildlands",
        "nameKo": "와일드랜드 대평원 (유목민 천막촌)",
        "regionEn": "Northern Steppe & Tundra",
        "regionKo": "대륙 북방 와일드랜드 초원",
        "episodes": [4, 6, 7, 8],
        "color": "#65a30d",
        "gridFile": "loc_grid_01.jpg",
        "quadrant": 3,
        "summaryKo": "어린 카단이 어머니 엘윈, 대장장이 길가메시, 일곱 스승 밑에서 방패술과 별을 호흡하는 법을 수련하며 성장한 광활한 북방 대평원.",
        "architectureKo": "유목 부족의 둥근 가죽 대천막(게르), 깃발이 펄럭이는 군영, 모닥불 화덕과 말구유",
        "atmosphereKo": "끝없는 황금·청록 초원과 밤하늘을 수놓는 성좌(별빛)·오로라",
        "palette": ["#1E293B", "#365314", "#84CC16", "#F59E0B", "#FEF08A"],
        "promptEn": "Anime environment concept art of the Great Plains of the Wildlands, vast northern steppe grasslands at twilight under a starry aurora sky, a nomad camp of round leather yurt pavilions with glowing campfires and fluttering tribal banners, cinematic anime landscape.",
    },
    {
        "id": 5,
        "code": "LOC-005",
        "slug": "Pegasus_Valley",
        "nameEn": "Pegasus Valley",
        "nameKo": "페가수스 밸리 (국경 관문과 붉은 초원)",
        "regionEn": "Border Citadel & Crimson Plains",
        "regionKo": "북방 국경 관문 및 붉은 갈기 초원",
        "episodes": [8],
        "color": "#ea580c",
        "gridFile": "loc_grid_02.jpg",
        "quadrant": 0,
        "summaryKo": "와일드랜드와 중원을 잇는 안개 낀 국경 관문 도시이자, 카단과 실리아가 처음 만나 전설의 명마 ‘페가수스(붉은 갈기)’를 길들인 황혼빛 계곡.",
        "architectureKo": "낮은 석조 국경 성벽과 관문, 협곡을 가로지르는 목교와 붉은 억새 평원",
        "atmosphereKo": "석양에 물든 붉은 초원과 강물 위를 달리는 역동적인 황금빛 노을",
        "palette": ["#7C2D12", "#EA580C", "#FDBA74", "#FEF3C7", "#1E3A8A"],
        "promptEn": "Anime environment concept art of Pegasus Valley, a misty border stone fortress gate opening onto a vast sunlit crimson-grass valley at golden hour where wild red-maned horses gallop across a river gorge, Makoto Shinkai style lighting.",
    },
    {
        "id": 6,
        "code": "LOC-006",
        "slug": "Lighthaven_Inner_Forum",
        "nameEn": "Lighthaven Inner Forum",
        "nameKo": "라이트헤븐 내성 광장 (결투 연무장)",
        "regionEn": "Royal Capital of Lighthaven",
        "regionKo": "라이트헤븐 왕도 내성",
        "episodes": [9, 10],
        "color": "#2563eb",
        "gridFile": "loc_grid_02.jpg",
        "quadrant": 1,
        "summaryKo": "이그니스가 카제와의 혼사 내기 결투를 벌이고 카단이 무쇠 방패를 들고 끼어들어 천하에 이름을 알린 왕도 내성의 대광장.",
        "architectureKo": "중앙 대형 목조 결투 무대, 붉은 비단 깃발이 펄럭이는 성벽 망루, 황금 귀족 관람석 발코니",
        "atmosphereKo": "정오의 쨍한 햇살과 수백 관중의 열기, 왕도의 웅장한 백색 석조 건축",
        "palette": ["#1E3A8A", "#2563EB", "#DC2626", "#FACC15", "#F8FAFC"],
        "promptEn": "Anime environment concept art of Lighthaven Inner Forum, a grand royal castle inner courtyard plaza with a raised timber martial arts duel stage in the center, surrounded by towering battlements with crimson silk banners and gilded noble viewing balconies.",
    },
    {
        "id": 7,
        "code": "LOC-007",
        "slug": "Red_Glass_Palace",
        "nameEn": "Red Glass Palace (Flame Court)",
        "nameKo": "붉은 유리 궁전 (불꽃 궁정)",
        "regionEn": "Heart of Lighthaven Inner Citadel",
        "regionKo": "라이트헤븐 내성 심장부",
        "episodes": [1, 2, 5, 6, 7, 9, 10, 11],
        "color": "#dc2626",
        "gridFile": "loc_grid_02.jpg",
        "quadrant": 2,
        "summaryKo": "발리안과 이그니스, 그리고 최고 재상 루시안의 음모가 교차하는 검붉은 크리스탈 첨탑과 흑요석 기둥의 마도 대궁전.",
        "architectureKo": "검붉은 유리 스테인드글라스 첨탑, 흑요석 열주 회랑, 루비 마법 화로가 타오르는 궁정 홀",
        "atmosphereKo": "압도적이고 서늘한 검붉은 마나 광채와 황금빛 궁정 조명의 극적 대비",
        "palette": ["#450A0A", "#991B1B", "#DC2626", "#FCA5A5", "#FDE047"],
        "promptEn": "Anime environment concept art of the Red Glass Palace and Flame Court, an imposing dark-fantasy palace court built of towering black obsidian pillars and glowing crimson stained-glass spires, arcane braziers burning with ruby fire, polished red crystal floor.",
    },
    {
        "id": 8,
        "code": "LOC-008",
        "slug": "Seventh_Subterranean_Labor_Camp",
        "nameEn": "Seventh Subterranean Labor Camp",
        "nameKo": "제7 지하 노동 수용소 & 비밀 약초원",
        "regionEn": "Deep Beneath Red Glass Palace",
        "regionKo": "붉은 유리 궁전 지하 심층",
        "episodes": [9, 11, 12],
        "color": "#0891b2",
        "gridFile": "loc_grid_02.jpg",
        "quadrant": 3,
        "summaryKo": "엘윈이 갇혀 있던 지하 감옥 갱도이자, 천장 균열로 달빛과 눈송이가 내려앉아 설강화(Snowdrop)와 달빛 약초가 자라난 비밀 지하 정원.",
        "architectureKo": "무거운 철창과 사슬이 드리운 암반 감옥, 천장 크레바스 아래 펼쳐진 발광 약초 군락지",
        "atmosphereKo": "어두운 지하 동굴을 가르는 한 줄기 은빛 달빛과 파랗게 빛나는 설강화 포자",
        "palette": ["#090D16", "#1E293B", "#06B6D4", "#A5F3FC", "#F8FAFC"],
        "promptEn": "Anime environment concept art of the Seventh Subterranean Labor Camp, a deep underground cavern prison with heavy iron-barred cells and chains, opening into a secret grotto where a ceiling crack lets silver moonlight and snowflakes fall onto glowing white snowdrop flowers and silver herbs.",
    },
    {
        "id": 9,
        "code": "LOC-009",
        "slug": "Cloud_Return_Manor_Mist_Lake",
        "nameEn": "Cloud Return Manor at Mist Lake",
        "nameKo": "구름 돌아오는 장원 & 안개 호수",
        "regionEn": "Misty Lotus Waterways",
        "regionKo": "강남 안개 호수 수향",
        "episodes": [13, 14, 15, 16],
        "color": "#0d9488",
        "gridFile": "loc_grid_03.jpg",
        "quadrant": 0,
        "summaryKo": "물안개가 자욱한 안개 호수 한가운데 세워진 고풍스러운 수상 장원. 녹옥 지팡이의 전승과 고대 유적이 숨겨진 비밀스러운 회합 장소.",
        "architectureKo": "비취색 기와를 얹은 수상 정자, 연꽃 호수를 가로지르는 아치형 목교와 수상 회랑",
        "atmosphereKo": "몽환적인 에메랄드빛 물안개와 수면 위에 어른거리는 황금 수등(水燈)",
        "palette": ["#042F2E", "#0F766E", "#14B8A6", "#99F6E4", "#FDE68A"],
        "promptEn": "Anime environment concept art of Cloud Return Manor at Mist Lake, a mystical water-manor built over a tranquil mist-shrouded lotus lake, interconnected jade-tiled wooden pavilions, arched bridges, and glowing lanterns floating on emerald water.",
    },
    {
        "id": 10,
        "code": "LOC-010",
        "slug": "Whispering_Wind_Island",
        "nameEn": "Whispering Wind Island",
        "nameKo": "바람 속삭임 섬 (바람섬)",
        "regionEn": "Eastern Mystic Archipelago",
        "regionKo": "동해 신비 도서",
        "episodes": [9, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 25, 27, 29, 34, 40],
        "color": "#10b981",
        "gridFile": "loc_grid_03.jpg",
        "quadrant": 1,
        "summaryKo": "바람의 왕 에올루스와 실리아 공주의 고향. 만개한 복사꽃 미로 숲과 청록빛 바람의 룬 거석들이 외부 침입자를 길을 잃게 만드는 환상의 섬.",
        "architectureKo": "기암절벽 해안, 청록색 고대 룬 문자 거석진, 끝없이 펼쳐진 분홍 복사꽃(도화) 숲길",
        "atmosphereKo": "흩날리는 분홍 꽃잎과 청록빛 바람의 마나 입자가 어우러진 신비롭고 화사한 분위기",
        "palette": ["#064E3B", "#10B981", "#6EE7B7", "#F472B6", "#FBCFE8"],
        "promptEn": "Anime environment concept art of Whispering Wind Island, an enchanted island sanctuary surrounded by dramatic sea stacks, featuring a labyrinth of blooming pink peach-blossom trees and ancient cyan-glowing wind rune monoliths.",
    },
    {
        "id": 11,
        "code": "LOC-011",
        "slug": "Black_Temple_Jade_Barrier_Spire",
        "nameEn": "Black Temple & Jade Barrier Spire",
        "nameKo": "검은 성전 & 비취 결계탑",
        "regionEn": "Sanctum of Whispering Wind Island",
        "regionKo": "바람 속삭임 섬 중심 성소",
        "episodes": [17, 18, 19, 20],
        "color": "#059669",
        "gridFile": "loc_grid_03.jpg",
        "quadrant": 2,
        "summaryKo": "바람 속삭임 섬의 결계를 유지하는 고대 흑요석 성전과 하늘 높이 청록빛 결계 기둥을 쏘아 올리는 비취 결계탑.",
        "architectureKo": "기하학적 흑요석 신전 계단, 중앙에 우뚝 솟은 거대 에메랄드 비취 크리스탈 첨탑",
        "atmosphereKo": "먹구름을 뚫고 솟구치는 강렬한 청록색 마나 광선과 고대 룬 마법진",
        "palette": ["#090D16", "#064E3B", "#10B981", "#34D399", "#A7F3D0"],
        "promptEn": "Anime environment concept art of the Black Temple and Jade Barrier Spire, an ancient dark obsidian temple complex at the heart of an island, with a colossal glowing emerald-jade crystal spire shooting a beam of cyan barrier light into the sky.",
    },
    {
        "id": 12,
        "code": "LOC-012",
        "slug": "Sky_Altar",
        "nameEn": "Sky Altar",
        "nameKo": "하늘 제단 (세 가지 시험장)",
        "regionEn": "Summit of Whispering Wind Island",
        "regionKo": "바람섬 구름 위 최정상 제단",
        "episodes": [18, 19, 20],
        "color": "#0284c7",
        "gridFile": "loc_grid_03.jpg",
        "quadrant": 3,
        "summaryKo": "카단과 이그니스가 실리아와의 혼인을 두고 에올루스가 내린 ‘세 가지 시험(음율·기억·무예)’을 치른 구름 위 천공의 대리석 제단.",
        "architectureKo": "순백색 대리석 원형 투기장 제단, 바람의 문장이 조각된 열두 개의 공중 부유 기둥",
        "atmosphereKo": "발아래 펼쳐진 황금빛 운해와 푸른 하늘, 공중에 떠다니는 마나 음표와 빛 입자",
        "palette": ["#0C4A6E", "#0284C7", "#7DD3FC", "#F8FAFC", "#FDE047"],
        "promptEn": "Anime environment concept art of the Sky Altar, a majestic circular white-marble ritual altar atop a mountain peak above a sea of clouds, surrounded by carved wind-rune pillars and floating cyan mana particles.",
    },
    {
        "id": 13,
        "code": "LOC-013",
        "slug": "Flower_Ship_Siren_Strait",
        "nameEn": "Flower Ship at Siren Strait",
        "nameKo": "꽃배 선단 & 사이렌 해협",
        "regionEn": "Razor Reef Defile & Gull Crag",
        "regionKo": "칼날 암초 해협 및 갈매기 바위섬",
        "episodes": [20, 21, 22, 27, 40],
        "color": "#be123c",
        "gridFile": "loc_grid_04.jpg",
        "quadrant": 0,
        "summaryKo": "비단 휘장으로 장식된 화려한 꽃배(Flower Ship)가 거대한 파도와 배신자의 화공에 휩싸인 채 돌파하는 죽음의 사이렌 해협과 갈매기 바위섬.",
        "architectureKo": "다층 누각과 비단 돛을 갖춘 화려한 대형 목조 꽃배, 해협 양옆으로 솟은 칼날 암초",
        "atmosphereKo": "검푸른 폭풍 해일과 소용돌이, 선상의 등불과 화염이 부딪히는 해상 스펙터클",
        "palette": ["#0F172A", "#1E3A8A", "#BE123C", "#FB7185", "#FBBF24"],
        "promptEn": "Anime environment concept art of the Flower Ship at Siren Strait, an ornate multi-deck wooden palace ship draped in colorful silk canopies and lanterns sailing through a treacherous narrow strait of jagged black razor reefs and swirling ocean whirlpools.",
    },
    {
        "id": 14,
        "code": "LOC-014",
        "slug": "Mount_Dragonhorn_Dragon_Grotto",
        "nameEn": "Mount Dragonhorn & Dragon Grotto",
        "nameKo": "용의 뿔 산맥 & 해저 용의 석굴",
        "regionEn": "Coastal Mainland Crags",
        "regionKo": "대륙 해안 용의 척추 산맥",
        "episodes": [21, 22, 23, 24, 34],
        "color": "#1d4ed8",
        "gridFile": "loc_grid_04.jpg",
        "quadrant": 1,
        "summaryKo": "용의 척추처럼 솟아오른 해안 흑화강암 산맥과, 썰물 때만 입구가 열려 고대 전략가 아이언포지의 기록이 잠든 해식 동굴.",
        "architectureKo": "하늘을 찌르는 검은 용각(龍角) 암봉, 푸른 발광 수정과 고대 용의 화석이 박힌 해저 동굴",
        "atmosphereKo": "부서지는 하얀 파도 포말과 동굴 내부의 신비로운 청색 생물발광(Bioluminescence)",
        "palette": ["#090D16", "#1E3A8A", "#2563EB", "#60A5FA", "#E0F2FE"],
        "promptEn": "Anime environment concept art of Mount Dragonhorn and Dragon Grotto, towering black granite coastal mountain peaks shaped like a dragon's spine above crashing waves, revealing a bioluminescent tidal sea cave filled with ancient dragon bones and blue crystals.",
    },
    {
        "id": 15,
        "code": "LOC-015",
        "slug": "The_Sealed_Chamber",
        "nameEn": "The Sealed Chamber",
        "nameKo": "봉인실 (아다만티움 삼중 철문)",
        "regionEn": "Deepest Vault of Dragon Grotto",
        "regionKo": "용의 석굴 최심부 봉인 금고",
        "episodes": [24],
        "color": "#7c3aed",
        "gridFile": "loc_grid_04.jpg",
        "quadrant": 2,
        "summaryKo": "카단과 실리아가 일곱 밤 동안 머물며 성진호흡과 나인섀도우 코덱스의 오의를 깨우치고 ‘드래곤 브레이커 방패’를 얻은 고대 봉인 석실.",
        "architectureKo": "지하 절벽을 깎아 만든 수백 길 높이의 아다만티움 이중 철문, 삼위일체 마나 홈과 천문 돔",
        "atmosphereKo": "별빛(청)·바람(록)·순백 화염(백)의 삼중 룬이 공명하는 장엄한 고대 유적",
        "palette": ["#1E1B4B", "#4C1D95", "#38BDF8", "#34D399", "#FEF9C3"],
        "promptEn": "Anime environment concept art of The Sealed Chamber, a monumental subterranean vault featuring a colossal adamantine double gate carved into a cliff face, illuminated by a glowing tripartite seal of starlight blue, emerald wind, and pure white flame runes.",
    },
    {
        "id": 16,
        "code": "LOC-016",
        "slug": "Jade_Council_Hall",
        "nameEn": "Jade Council Hall",
        "nameKo": "비취 평의회 대전각 (황궁 옥좌홀)",
        "regionEn": "Imperial Palace Capital",
        "regionKo": "제국 황궁 최고 회의장",
        "episodes": [25, 26, 28],
        "color": "#b45309",
        "gridFile": "loc_grid_04.jpg",
        "quadrant": 3,
        "summaryKo": "거짓 혼례의 밤과 녹옥 의회의 반란이 벌어진 황궁의 중심 홀. 역대 황제의 옥좌 제단 위에 금지된 ‘심연의 핵’이 걸렸던 결전 무대.",
        "architectureKo": "거대한 비취색 용 조각 기둥, 황금 돔 천장과 샹들리에, 흑요석과 황금으로 쌓은 중앙 옥좌 단상",
        "atmosphereKo": "황실의 화려한 금빛 위엄과 반란의 검붉은 암흑 마나가 충돌하는 긴장감",
        "palette": ["#064E3B", "#047857", "#B45309", "#FACC15", "#7F1D1D"],
        "promptEn": "Anime environment concept art of the Jade Council Hall of the Imperial Palace, a grand vaulted throne hall with towering carved green-jade dragon columns, golden chandeliers, and a high obsidian-and-gold imperial dais.",
    },
    {
        "id": 17,
        "code": "LOC-017",
        "slug": "Citadel_of_the_Four_Gates",
        "nameEn": "Citadel of the Four Gates",
        "nameKo": "사문 요새 (네 관문)",
        "regionEn": "Northern Imperial Rampart",
        "regionKo": "고대 제국 북방 협곡 방어선",
        "episodes": [29, 30, 31],
        "color": "#9333ea",
        "gridFile": "loc_grid_05.jpg",
        "quadrant": 0,
        "summaryKo": "깎아지른 협곡 사이에 세워진 네 개의 흑철 수문 요새. 메두사 고르고의 치명적인 보랏빛 사독(蛇毒) 연무가 폭포처럼 쏟아지는 죽음의 관문.",
        "architectureKo": "협곡을 가로막은 4중 거대 흑철 수문, 독안개 배수구와 쇠사슬 현수교",
        "atmosphereKo": "폭포수처럼 흘러내리는 야광 보랏빛 독연무와 어두운 협곡의 위압감",
        "palette": ["#1E1B4B", "#581C87", "#9333EA", "#D8B4FE", "#475569"],
        "promptEn": "Anime environment concept art of the Citadel of the Four Gates, a formidable fortress spanning a narrow mountain chasm with four colossal black-iron sluice gates pouring cascades of glowing purple poisonous mist into the canyon below.",
    },
    {
        "id": 18,
        "code": "LOC-018",
        "slug": "Quicksand_River_Black_Marsh",
        "nameEn": "Quicksand River & Black Marsh",
        "nameKo": "유사강 & 검은 늪",
        "regionEn": "Cursed Wetlands",
        "regionKo": "사문 요새 너머 저주받은 늪지",
        "episodes": [29, 30, 31, 32, 33, 39],
        "color": "#ca8a04",
        "gridFile": "loc_grid_05.jpg",
        "quadrant": 1,
        "summaryKo": "모든 것을 집어삼키는 황금 모래 소용돌이의 유사강과, 데스나이트 아르투스의 한과 원한이 서린 안개 낀 검은 늪지대.",
        "architectureKo": "거대한 모래 소용돌이 급류, 갈대 나룻배, 뒤틀린 고목과 침수된 고대 석상",
        "atmosphereKo": "황금빛 유사(流砂)와 검보랏빛 늪지 독안개·푸른 도깨비불의 기묘한 공존",
        "palette": ["#1C1917", "#713F12", "#CA8A04", "#4C1D95", "#38BDF8"],
        "promptEn": "Anime environment concept art of Quicksand River and the Black Marsh, a dramatic fantasy landscape with a swirling golden-sand vortex river beside a haunting dark swamp of twisted dead trees, purple miasma fog, and eerie blue ghost-lights.",
    },
    {
        "id": 19,
        "code": "LOC-019",
        "slug": "Black_Citadel_Starlight_Archive",
        "nameEn": "Black Citadel & Starlight Archive",
        "nameKo": "검은 성채 & 별빛의 기록실",
        "regionEn": "Supreme Fortress & Astral Sanctum",
        "regionKo": "검은 성채 최상층 천문 성소",
        "episodes": [32, 33, 34, 36, 37],
        "color": "#3b82f6",
        "gridFile": "loc_grid_05.jpg",
        "quadrant": 2,
        "summaryKo": "제국의 모든 비밀이 봉인된 검은 성채의 최상층. 뚫린 원형 천장으로 북두칠성의 별빛이 쏟아져 내려 ‘십자 성흔의 지도’를 비추는 기록실.",
        "architectureKo": "흑요석 원형 회랑, 개방형 천문 돔 천장, 대륙의 지맥이 양각된 중앙 화강암 성도(星圖) 제단",
        "atmosphereKo": "서늘하고 경건한 밤하늘의 은빛 별빛 줄기와 황금빛으로 발광하는 대륙 지맥 지도",
        "palette": ["#090D16", "#1E293B", "#2563EB", "#93C5FD", "#FACC15"],
        "promptEn": "Anime environment concept art of the Black Citadel and Starlight Archive, a monolithic dark-iron citadel whose highest circular chamber has an open domed ceiling where silver starlight from the Big Dipper shines onto a giant carved stone map table.",
    },
    {
        "id": 20,
        "code": "LOC-020",
        "slug": "Altar_of_Ruin_Two_Graves",
        "nameEn": "Altar of Ruin & Spring Between Two Graves",
        "nameKo": "파멸의 제단 & 두 무덤 사이의 봄",
        "regionEn": "Final Battlefield & Epilogue Hill",
        "regionKo": "최종 결전지 및 엘윈 마을 봄 언덕",
        "episodes": [12, 34, 35, 36, 37, 38, 39, 40],
        "color": "#e11d48",
        "gridFile": "loc_grid_05.jpg",
        "quadrant": 3,
        "summaryKo": "루시안과의 최종 결전이 펼쳐지는 검붉은 마나 폭풍의 ‘파멸의 제단’과, 평화를 되찾은 뒤 알렉산다르·엘윈의 두 무덤 사이에 설강화가 피어난 에필로그 언덕.",
        "architectureKo": "좌측: 부서진 흑요석 옥좌와 심연의 균열 / 우측: 나란히 선 두 개의 돌무덤과 낡은 무쇠 방패, 만개한 봄꽃 언덕",
        "atmosphereKo": "종말의 핏빛 뇌전(雷電)에서 찬란하고 따스한 봄날의 아침 햇살로 이어지는 서사적 완결",
        "palette": ["#4C0519", "#E11D48", "#16A34A", "#86EFAC", "#FEF08A"],
        "promptEn": "Anime environment concept art showing the apocalyptic obsidian throne of the Altar of Ruin amidst crimson mana lightning on the left, transitioning into a peaceful sunlit spring hillside with two stone graves surrounded by blooming white snowdrop flowers on the right.",
    },
]


# ==============================================================================
# 20 CANONICAL NOVEL PROPS / ITEMS (소품 시트 명세 — 영문 소설 공식 용어 통일)
# ==============================================================================
PROPS = [
    {
        "id": 1,
        "code": "PROP-001",
        "slug": "Silver_Dagger",
        "nameEn": "Silver Dagger",
        "nameKo": "은빛 단검 (기억을 깨우는 단검)",
        "categoryEn": "Heirloom Weapon & Oath Relic",
        "categoryKo": "서약의 유물 무기",
        "ownerKo": "알렉산다르 → 카단 / 이그니스",
        "episodes": [1, 2, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 26, 28, 29, 30, 33, 34, 35, 36, 38, 39, 40],
        "color": "#0284c7",
        "gridFile": "prop_grid_01.jpg",
        "quadrant": 0,
        "summaryKo": "눈보라 치는 엘윈 마을에서 알렉산다르와 발리안이 두 아이의 운명을 걸고 나눈 맹세의 은빛 단검. 총 31개 회차에 걸쳐 등장하는 소설 전체의 핵심 상징물.",
        "materialKo": "서리 룬이 음각된 순은 검신, 푸른 사파이어가 박힌 십자 코등이와 백은 가죽 손잡이",
        "effectKo": "달빛과 마나에 반응해 푸른 서리 광채를 내뿜으며 봉인된 기억과 혈통의 진실을 일깨움",
        "palette": ["#0F172A", "#0284C7", "#7DD3FC", "#E2E8F0", "#F8FAFC"],
        "promptEn": "Anime key prop concept sheet of the Silver Dagger from Kadan's Journey, an ornate fantasy heirloom silver dagger with glowing blue frost runes etched along the blade and a sapphire-set crossguard and hilt, cel-shaded studio art.",
    },
    {
        "id": 2,
        "code": "PROP-002",
        "slug": "Dragon_Breaker_Shield",
        "nameEn": "Dragon Breaker Shield",
        "nameKo": "드래곤 브레이커 방패 (눈꽃 성기사 방패)",
        "categoryEn": "Legendary Paladin Shield",
        "categoryKo": "전설의 성기사 수호 방패",
        "ownerKo": "카단 (Kadan)",
        "episodes": [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
        "color": "#2563eb",
        "gridFile": "prop_grid_01.jpg",
        "quadrant": 1,
        "summaryKo": "용의 석굴 봉인실에서 카단이 계승한 전설의 성기사 방패. 중앙에 찬란한 눈꽃(Snowflake) 크리스탈 문장이 빛나며 어떠한 마장(魔障)과 용의 브레스도 파쇄한다.",
        "materialKo": "심해 코발트 아다만티움 합금, 백은 테두리 장식, 중앙 6각 눈꽃 마력 결정 코어",
        "effectKo": "성진호흡 마나 주입 시 절대 방어 결계 전개 및 역공 파동(Dragon Breaker Shockwave) 방출",
        "palette": ["#1E3A8A", "#2563EB", "#38BDF8", "#E0F2FE", "#F8FAFC"],
        "promptEn": "Anime key prop concept sheet of the Dragon Breaker Shield, Kadan's legendary dark-cobalt metallic paladin shield featuring a brilliant glowing ice-blue snowflake crest emblem in the center and silver trim, cel-shaded studio art.",
    },
    {
        "id": 3,
        "code": "PROP-003",
        "slug": "Weathered_Iron_Shield",
        "nameEn": "Weathered Iron Shield",
        "nameKo": "무쇠 방패 (북방 전사의 철방패)",
        "categoryEn": "Starter Guardian Shield",
        "categoryKo": "북방 수련 무쇠 방패",
        "ownerKo": "카단 (Kadan)",
        "episodes": [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 27, 40],
        "color": "#475569",
        "gridFile": "prop_grid_01.jpg",
        "quadrant": 2,
        "summaryKo": "대장장이 길가메시가 북방 무쇠로 단조해 준 카단의 첫 방패. 수많은 검흔이 새겨져 있으며, 마지막 제40화에서 두 무덤 앞에 영원한 수호의 징표로 세워진다.",
        "materialKo": "두꺼운 북방 흑무쇠 판금, 강철 리벳, 거친 들소 가죽 손잡이 스트랩",
        "effectKo": "화려한 마법 없이도 정직한 우직함과 불굴의 체술로 모든 기습을 막아내는 카단의 초심",
        "palette": ["#1E293B", "#475569", "#94A3B8", "#78350F", "#D97706"],
        "promptEn": "Anime key prop concept sheet of the Weathered Iron Shield, a heavy battle-scarred northern dark iron shield with steel rivets, leather straps, and sword-clash marks, cel-shaded studio art.",
    },
    {
        "id": 4,
        "code": "PROP-004",
        "slug": "Nine_Shadows_Codex",
        "nameEn": "Nine Shadows Codex",
        "nameKo": "나인섀도우 코덱스 (아홉 그림자 비전 고서)",
        "categoryEn": "Supreme Arcane & Martial Grimoire",
        "categoryKo": "최고위 고대 마도·무학 비전서",
        "ownerKo": "아이언포지 유산 → 실리아 & 카단",
        "episodes": [3, 7, 11, 13, 14, 17, 19, 20, 23, 25, 26, 28, 33, 34, 35, 36, 38, 39],
        "color": "#7c3aed",
        "gridFile": "prop_grid_01.jpg",
        "quadrant": 3,
        "summaryKo": "대륙의 모든 세력이 피를 흘리며 쟁탈전을 벌인 궁극의 고대 비전서. 상·하권과 총강으로 나뉘며 마나 운용법과 고대 전술의 정수가 담겨 있다.",
        "materialKo": "흑룡 가죽 표지, 황금·비취 잠금쇠, 별자리 룬과 고대 문자가 은빛으로 발광하는 양피지",
        "effectKo": "성진호흡과 결합될 때 심연의 오염을 정화하고 완전체 전술 결계를 구현함",
        "palette": ["#1E1B4B", "#4C1D95", "#8B5CF6", "#FACC15", "#10B981"],
        "promptEn": "Anime key prop concept sheet of the Nine Shadows Codex, an ancient forbidden grimoire book bound in black dragon-leather with ornate gold and emerald-jade clasps, slightly open to reveal glowing silver constellation magic circles.",
    },
    {
        "id": 5,
        "code": "PROP-005",
        "slug": "Jade_Staff",
        "nameEn": "Jade Staff",
        "nameKo": "녹옥 지팡이 (유랑민 연맹 수장의 성물)",
        "categoryEn": "Guild Sovereign Relic Staff",
        "categoryKo": "유랑민 연맹(개방) 수장 신물",
        "ownerKo": "레오나르 → 실리아 (Celia)",
        "episodes": [11, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
        "color": "#10b981",
        "gridFile": "prop_grid_02.jpg",
        "quadrant": 0,
        "summaryKo": "대륙 최대 정보·유랑 조직인 유랑민 연맹 수장의 권위를 상징하는 에메랄드빛 대나무 모양 녹옥 지팡이. 실리아의 지략과 지휘력을 상징하는 주무기.",
        "materialKo": "천년 묵은 반투명 에메랄드 취옥(翠玉), 마디마다 새겨진 황금 바람 룬 고리",
        "effectKo": "타격 시 청록빛 마나 파동을 일으키며 전국 유랑민 길드원들을 즉시 집결시키는 절대 신물",
        "palette": ["#064E3B", "#059669", "#10B981", "#6EE7B7", "#FDE047"],
        "promptEn": "Anime key prop concept sheet of the Jade Staff, a luminous translucent emerald-green jade staff shaped like segmented bamboo with subtle golden rune rings and a glowing cyan aura, cel-shaded studio art.",
    },
    {
        "id": 6,
        "code": "PROP-006",
        "slug": "White_Glass_Ember",
        "nameEn": "White Glass Ember",
        "nameKo": "백유리 불씨 (순백 화염 성물)",
        "categoryEn": "Sacred Purification Artifact",
        "categoryKo": "순백 화염 정화 성물",
        "ownerKo": "백염 교단 / 카단 & 실리아",
        "episodes": [27, 28, 29, 30, 31, 32, 33, 35, 36, 37, 38, 39],
        "color": "#f59e0b",
        "gridFile": "prop_grid_02.jpg",
        "quadrant": 1,
        "summaryKo": "투명한 백유리 보주 안에서 꺼지지 않고 타오르는 태초의 순백 불씨. 사문 요새의 맹독과 심연의 핵이 내뿜는 흑마법을 정화하는 유일한 성물.",
        "materialKo": "세공된 은빛 날개 프레임과 투명 백수정 구체(Glass Orb), 살아 숨 쉬는 순백색 성화(聖火)",
        "effectKo": "보랏빛 사독 연무를 소멸시키고 어둠에 잠식된 영혼과 마나 회로를 정화함",
        "palette": ["#78350F", "#F59E0B", "#FDE68A", "#FEFCE8", "#38BDF8"],
        "promptEn": "Anime key prop concept sheet of the White Glass Ember, a sacred crystal reliquary orb made of clear filigree glass and silver, holding a living pure-white sacred flame burning brightly inside.",
    },
    {
        "id": 7,
        "code": "PROP-007",
        "slug": "Snowdrop_Flower",
        "nameEn": "Snowdrop Flower",
        "nameKo": "설강화 (눈 속에 피는 하얀 영초)",
        "categoryEn": "Sacred Healing Botanical",
        "categoryKo": "설원 치유·해독 영초",
        "ownerKo": "엘윈 / 카단 & 실리아",
        "episodes": [12, 40],
        "color": "#06b6d4",
        "gridFile": "prop_grid_02.jpg",
        "quadrant": 2,
        "summaryKo": "제7 지하 노동 수용소의 차가운 눈과 두 무덤 사이에서 얼음을 뚫고 피어난 순백의 종 모양 꽃. 절망 속에서도 꺾이지 않는 생명과 재회의 상징.",
        "materialKo": "서리 결정을 머금은 순백색 세 갈래 꽃잎, 에메랄드 줄기, 은은한 얼음빛 발광 포자",
        "effectKo": "심맥에 침투한 한독(寒毒)과 화독을 동시에 해독하고 꺼져가는 생명력을 소생시킴",
        "palette": ["#083344", "#06B6D4", "#67E8F9", "#ECFEFF", "#22C55E"],
        "promptEn": "Anime key prop concept sheet of the Snowdrop Flower, a cluster of magical white bell-shaped snowdrop flowers blooming through frost and snow, with delicate ice-blue bioluminescent sparkles on the petals.",
    },
    {
        "id": 8,
        "code": "PROP-008",
        "slug": "Moonlit_Herb",
        "nameEn": "Moonlit Herb",
        "nameKo": "달빛 약초 (월광초)",
        "categoryEn": "Bioluminescent Elixir Herb",
        "categoryKo": "달빛 발광 영약초",
        "ownerKo": "엘윈 / 말퓨온 / 실리아",
        "episodes": [9, 10, 12, 16, 26, 27, 35],
        "color": "#38bdf8",
        "gridFile": "prop_grid_02.jpg",
        "quadrant": 3,
        "summaryKo": "달빛을 받아야만 잎맥이 은청색으로 투명하게 빛나는 희귀 약초. 중상을 입은 동료와 마나 역류를 치료하는 데 쓰이는 핵심 약재.",
        "materialKo": "액체 달빛이 흐르는 듯한 반투명 은청색 잎사귀와 옥색 약절구",
        "effectKo": "손상된 마나 경락을 복구하고 치명적인 내상을 빠르게 아물게 함",
        "palette": ["#0F172A", "#0284C7", "#38BDF8", "#BAE6FD", "#E0F2FE"],
        "promptEn": "Anime key prop concept sheet of the Moonlit Herb, a mystical medicinal herb plant with translucent silver-blue leaves whose veins glow like liquid moonlight, resting beside a small jade mortar.",
    },
    {
        "id": 9,
        "code": "PROP-009",
        "slug": "Three_Silk_Seals",
        "nameEn": "Three Silk Seals",
        "nameKo": "세 개의 비단 봉인 (삼색 명주 봉인)",
        "categoryEn": "Royal Strategic Scrolls",
        "categoryKo": "황실 비전 전략 봉인서",
        "ownerKo": "아이언포지 → 실리아 & 카단",
        "episodes": [37, 38, 39],
        "color": "#e11d48",
        "gridFile": "prop_grid_03.jpg",
        "quadrant": 0,
        "summaryKo": "최종 결전을 앞두고 위기의 순간마다 하나씩 개봉하도록 남겨진 홍(紅)·청(靑)·백(白) 세 개의 황금 자수 비단 봉인 주머니와 두루마리.",
        "materialKo": "금실 용문 자수가 놓인 진홍·군청·순백 명주 비단낭과 황금 봉인 매듭",
        "effectKo": "제1봉인(적의 진형 파훼), 제2봉인(내부 배신자 제압), 제3봉인(심연의 핵 역봉인)의 묘책 수록",
        "palette": ["#9F1239", "#E11D48", "#1D4ED8", "#FACC15", "#F8FAFC"],
        "promptEn": "Anime key prop concept sheet of the Three Silk Seals, three ornate royal silk scroll pouches—one crimson silk, one azure-blue silk, and one pure-white silk—each embroidered with golden crests and tied with gold cords.",
    },
    {
        "id": 10,
        "code": "PROP-010",
        "slug": "Map_of_the_Cross_Shaped_Scar",
        "nameEn": "Map of the Cross-Shaped Scar",
        "nameKo": "십자 성흔의 지도 (대륙 지맥 성도)",
        "categoryEn": "Astral Leyline Map",
        "categoryKo": "대륙 지맥·결계 천문 지도",
        "ownerKo": "카단 & 실리아",
        "episodes": [36, 37],
        "color": "#d97706",
        "gridFile": "prop_grid_03.jpg",
        "quadrant": 1,
        "summaryKo": "검은 성채 별빛의 기록실에서 발견된 고대 성도. 카단의 가슴에 새겨진 십자 흉터와 대륙의 두 지맥 교차점(파멸의 제단)이 일치함을 밝혀낸다.",
        "materialKo": "고대 양피지와 흑요석 석판 위에 황금 마나 선으로 양각된 십자형 지맥과 별자리 좌표",
        "effectKo": "북두칠성 별빛이 비칠 때 숨겨진 파멸의 제단 진입로와 지맥 핵의 위치를 투영함",
        "palette": ["#27272A", "#78350F", "#D97706", "#FACC15", "#FEF08A"],
        "promptEn": "Anime key prop concept sheet of the Map of the Cross-Shaped Scar, an ancient weathered parchment and stone tablet map of a fantasy continent featuring a glowing golden cross-shaped leyline scar at the center.",
    },
    {
        "id": 11,
        "code": "PROP-011",
        "slug": "Abyssal_Core",
        "nameEn": "Abyssal Core",
        "nameKo": "심연의 핵 (금지된 암흑 마도 구체)",
        "categoryEn": "Forbidden Calamity Relic",
        "categoryKo": "금단의 심연 마도 유물",
        "ownerKo": "최고 재상 루시안 (Lucian)",
        "episodes": [27, 28, 33, 36, 38],
        "color": "#991b1b",
        "gridFile": "prop_grid_03.jpg",
        "quadrant": 2,
        "summaryKo": "루시안이 제국과 대륙의 결계를 무너뜨리고 정복왕의 힘을 얻기 위해 가동한 금단의 암흑 마도 유물. 검붉은 번개와 함께 심장처럼 박동한다.",
        "materialKo": "균열이 간 칠흑의 흑요석 외피, 내부에 소용돌이치는 핏빛·자주빛 심연 에너지 핵",
        "effectKo": "주변 생명력과 마나를 강제로 흡수하여 파멸적인 암흑 폭풍을 일으킴",
        "palette": ["#090D16", "#450A0A", "#991B1B", "#DC2626", "#9333EA"],
        "promptEn": "Anime key prop concept sheet of the Abyssal Core, a forbidden dark-magic artifact sphere of jagged black obsidian with a pulsing crimson-violet energy core and dark lightning arcs.",
    },
    {
        "id": 12,
        "code": "PROP-012",
        "slug": "Throne_Seal",
        "nameEn": "Throne Seal",
        "nameKo": "왕좌의 인장 (황실 혈옥 옥새)",
        "categoryEn": "Imperial Sovereign Seal",
        "categoryKo": "제국 황실 옥새",
        "ownerKo": "라이트헤븐 황실",
        "episodes": [10, 12, 28],
        "color": "#b91c1c",
        "gridFile": "prop_grid_03.jpg",
        "quadrant": 3,
        "summaryKo": "제국의 군통수권과 왕위 계승의 정통성을 증명하는 황실 옥새. 붉은 혈옥 몸체 위에 정교한 황금 용이 조각되어 있다.",
        "materialKo": "반투명한 진홍빛 혈옥(Blood-Jade) 인장 본체와 순금 반룡(蟠龍) 손잡이",
        "effectKo": "황실 결계문 개방 및 제국 전군 동원령 발동 권한 부여",
        "palette": ["#450A0A", "#B91C1C", "#EF4444", "#D97706", "#FDE047"],
        "promptEn": "Anime key prop concept sheet of the Throne Seal, a heavy imperial royal seal stamp carved from translucent crimson blood-jade topped with an intricately sculpted golden dragon handle.",
    },
    {
        "id": 13,
        "code": "PROP-013",
        "slug": "Tripartite_Seal_Jade_Key",
        "nameEn": "Tripartite Seal & Jade Key",
        "nameKo": "삼중 봉인패 & 비취 열쇠",
        "categoryEn": "Vault Unlocking Relics",
        "categoryKo": "봉인실 개방 성물",
        "ownerKo": "카단 & 실리아",
        "episodes": [23, 24],
        "color": "#059669",
        "gridFile": "prop_grid_04.jpg",
        "quadrant": 0,
        "summaryKo": "용의 석굴 최심부 ‘봉인실’의 거대한 아다만티움 철문을 열기 위해 필요한 세 조각의 삼중 봉인 메달리온과 고대 비취 열쇠.",
        "materialKo": "청색(별빛)·녹색(바람)·백색(화염) 보석이 박힌 3분할 원형 룬 패와 에메랄드 비취 열쇠",
        "effectKo": "세 가지 속성의 마나가 동시에 주입될 때 봉인실의 고대 철문을 해금함",
        "palette": ["#064E3B", "#10B981", "#38BDF8", "#FACC15", "#F8FAFC"],
        "promptEn": "Anime key prop concept sheet of the Tripartite Seal and Jade Key, a three-part interlocking circular rune medallion glowing with blue, green, and white gems alongside an intricately carved emerald jade key.",
    },
    {
        "id": 14,
        "code": "PROP-014",
        "slug": "Obsidian_Greatsword",
        "nameEn": "Obsidian Greatsword",
        "nameKo": "흑요석 대검 (데스나이트·루시안의 마검)",
        "categoryEn": "Dark-Mana Heavy Blade",
        "categoryKo": "암흑 마나 중대검",
        "ownerKo": "데스나이트 아르투스 / 루시안",
        "episodes": [10, 18, 25, 28, 33, 35, 38, 39],
        "color": "#be123c",
        "gridFile": "prop_grid_04.jpg",
        "quadrant": 1,
        "summaryKo": "화산 흑요석과 암흑 마철을 벼려 만든 거대한 양손 대검. 검신 중앙의 혈로를 따라 타오르는 검붉은 마나 불꽃이 흐른다.",
        "materialKo": "칠흑의 흑요석 검신, 붉은 마나 혈로(Blood-fuller), 뿔 모양의 황금·흑철 코등이",
        "effectKo": "일격에 성벽과 방패를 갈라버리는 파괴적인 중력 참격 및 암흑 화염 방출",
        "palette": ["#090D16", "#31102F", "#BE123C", "#F43F5E", "#FBBF24"],
        "promptEn": "Anime key prop concept sheet of the Obsidian Greatsword, a massive dark-fantasy greatsword forged from jagged black volcanic glass with glowing crimson mana veins running down the blade and a horned golden crossguard.",
    },
    {
        "id": 15,
        "code": "PROP-015",
        "slug": "Vial_of_Four_Gates_Serpent_Venom",
        "nameEn": "Vial of Four Gates Serpent Venom",
        "nameKo": "사문의 독병 (고르고의 보랏빛 사독)",
        "categoryEn": "Lethal Alchemical Poison",
        "categoryKo": "사문 요새 맹독 비약병",
        "ownerKo": "메두사 고르고 / 벨페고르",
        "episodes": [15, 25, 29, 30, 31],
        "color": "#9333ea",
        "gridFile": "prop_grid_04.jpg",
        "quadrant": 2,
        "summaryKo": "두 마리 은빛 독사가 감고 있는 흑수정 약병에 담긴 치명적인 보랏빛 사독(蛇毒). 사문 요새의 수문을 오염시키고 영웅들의 마나를 마비시킨다.",
        "materialKo": "쌍독사 은세공 장식의 흑수정 플라스크, 내부에서 발광하는 보랏빛 독연무 액체",
        "effectKo": "접촉 즉시 마나 회로를 마비시키며 오직 설강화와 백유리 불씨로만 해독 가능",
        "palette": ["#1E1B4B", "#581C87", "#9333EA", "#C084FC", "#CBD5E1"],
        "promptEn": "Anime key prop concept sheet of the Vial of Four Gates Serpent Venom, an ornate dark-crystal potion flask sculpted with twin coiled silver snakes, filled with swirling bioluminescent purple serpent venom.",
    },
    {
        "id": 16,
        "code": "PROP-016",
        "slug": "Star_Breathing_Astral_Scroll",
        "nameEn": "Star-Breathing Astral Scroll",
        "nameKo": "성진호흡 천문 두루마리 (별을 호흡하는 비전서)",
        "categoryEn": "Celestial Mana Cultivation Scroll",
        "categoryKo": "성진호흡(星辰呼吸) 비전 두루마리",
        "ownerKo": "말퓨온 → 카단 (Kadan)",
        "episodes": [6, 24, 36],
        "color": "#2563eb",
        "gridFile": "prop_grid_04.jpg",
        "quadrant": 3,
        "summaryKo": "제6화에서 대현자 말퓨온이 절벽 위의 카단에게 전수한 ‘별을 호흡하는 법(성진호흡)’의 천문 경락 두루마리. 북두칠성의 별빛 마나를 호흡으로 끌어들이는 정통 비전.",
        "materialKo": "푸른 은하수 안료로 그려진 고대 양피지 두루마리, 공중에 홀로그램처럼 떠오르는 북두칠성 성좌",
        "effectKo": "착실한 호흡 수련을 통해 내공과 마나 코어를 폭발적으로 각성시킴",
        "palette": ["#0F172A", "#1D4ED8", "#3B82F6", "#93C5FD", "#FEF08A"],
        "promptEn": "Anime key prop concept sheet of the Star-Breathing Astral Scroll, an open ancient parchment scroll projecting a glowing blue holographic constellation of the Big Dipper and mana meridian stars above it.",
    },
    {
        "id": 17,
        "code": "PROP-017",
        "slug": "Wind_Isle_Invitation_Jade_Flute",
        "nameEn": "Wind Isle Invitation & Jade Flute",
        "nameKo": "바람섬 복사꽃 초대장 & 비취 옥피리",
        "categoryEn": "Musical & Diplomatic Relics",
        "categoryKo": "바람섬 신물 및 음율 법구",
        "ownerKo": "에올루스 (Aeolus) & 실리아",
        "episodes": [14, 17, 18, 19],
        "color": "#0d9488",
        "gridFile": "prop_grid_05.jpg",
        "quadrant": 0,
        "summaryKo": "바람 속삭임 섬의 결계를 통과할 수 있는 복사꽃 인장 초대장과, 바람의 왕 에올루스가 마나 음파 공명을 일으킬 때 연주하는 비취 옥피리.",
        "materialKo": "청록빛 인장이 찍힌 분홍 비단 두루마리와 투명한 녹옥(Jade) 횡적(피리)·비단 술",
        "effectKo": "옥피리 연주 시 폭풍과 파도를 잠재우거나 적의 정신을 뒤흔드는 음율 결계 발동",
        "palette": ["#042F2E", "#0D9488", "#2DD4BF", "#F472B6", "#FEF3C7"],
        "promptEn": "Anime key prop concept sheet of the Wind Isle Invitation and Jade Flute, a formal scroll sealed with a glowing cyan peach-blossom wax seal, paired with a slender translucent green jade flute with silk tassels.",
    },
    {
        "id": 18,
        "code": "PROP-018",
        "slug": "Crimson_Mane_Warhorse_Tack",
        "nameEn": "Crimson Mane Warhorse Tack",
        "nameKo": "붉은 갈기 명마의 은장식 안장 & 고삐",
        "categoryEn": "Legendary Mount Equipment",
        "categoryKo": "전설 명마(페가수스) 마구 세트",
        "ownerKo": "카단 & 명마 페가수스",
        "episodes": [8, 9, 37],
        "color": "#ea580c",
        "gridFile": "prop_grid_05.jpg",
        "quadrant": 1,
        "summaryKo": "제8화 ‘붉은 갈기의 기수’에서 카단이 야생 신마 페가수스를 길들인 뒤 장착한 북방 명장 가죽 안장과 불꽃 문양 은장식 고삐.",
        "materialKo": "최상급 북방 통가죽 안장, 바람의 룬이 새겨진 은빛 등자(Stirrup)와 진홍빛 갈기 장식",
        "effectKo": "기수와 명마의 마나 호흡을 하나로 연결하여 하루 천 리를 달리는 질주력 부여",
        "palette": ["#431407", "#9A3412", "#EA580C", "#CBD5E1", "#FACC15"],
        "promptEn": "Anime key prop concept sheet of the Crimson Mane Warhorse Tack, an ornate northern masterwork leather warhorse saddle and bridle inlaid with silver runes and crimson flame-hair tassels.",
    },
    {
        "id": 19,
        "code": "PROP-019",
        "slug": "Bronze_Great_Bell_of_Drunken_Bell",
        "nameEn": "Bronze Great-Bell of Drunken Bell",
        "nameKo": "취선루의 거대 청동 대종",
        "categoryEn": "Colossal Sonic Relic",
        "categoryKo": "고대 룬 청동 대종",
        "ownerKo": "성기사 헤르쿨 (Hercul)",
        "episodes": [2, 5, 18, 33],
        "color": "#ca8a04",
        "gridFile": "prop_grid_05.jpg",
        "quadrant": 2,
        "summaryKo": "취선루 종각에 매달려 있던 수천 근 무게의 고대 청동 대종. 성기사 헤르쿨이 맨손으로 들어 올려 그 안에 몸을 숨기거나 적의 기습을 통째로 받아낸 명장면의 소품.",
        "materialKo": "청록색 파티나(녹)와 황금 광택이 공존하는 두꺼운 청동 주물, 양각된 천문 룬과 용두 고리",
        "effectKo": "타종 시 반경 수십 리의 어둠과 환영 안개를 걷어내는 웅장한 파동 방출",
        "palette": ["#422006", "#854D0E", "#CA8A04", "#0F766E", "#FDE047"],
        "promptEn": "Anime key prop concept sheet of the Bronze Great-Bell of Drunken Bell, a colossal ancient temple bell cast in weathered green-gold bronze, covered in high-relief celestial runes and dragon-head hanging loops.",
    },
    {
        "id": 20,
        "code": "PROP-020",
        "slug": "Salt_Crystal_Spear_Arcane_Chains",
        "nameEn": "Salt-Crystal Spear & Arcane Chains",
        "nameKo": "소금 결정 창 & 아다만티움 봉인 사슬",
        "categoryEn": "Naval & Containment Weapons",
        "categoryKo": "해상 결정 창 및 마력 봉인 사슬",
        "ownerKo": "해안 수비대 / 황궁 결계단",
        "episodes": [1, 10, 21, 22, 28, 39],
        "color": "#0284c7",
        "gridFile": "prop_grid_05.jpg",
        "quadrant": 3,
        "summaryKo": "꽃배 선상 전투와 해안 기습에서 쓰인 날카로운 백염(소금 결정) 장창과, 마력을 억압하는 황금 룬이 새겨진 아다만티움 봉인 사슬.",
        "materialKo": "단단하게 결정화된 순백 해염(Sea-salt) 창날과 황금 봉인 룬이 빛나는 흑철 사슬",
        "effectKo": "수속성·언데드 마물을 정화하고 폭주하는 마나를 결박함",
        "palette": ["#0F172A", "#0369A1", "#38BDF8", "#FACC15", "#F8FAFC"],
        "promptEn": "Anime key prop concept sheet of the Salt-Crystal Spear and Arcane Chains, a gleaming spear with a sharp white salt-crystal blade tip crossed with heavy adamantine chains etched with glowing golden containment runes.",
    },
]


def hex_to_rgb(h: str):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def crop_quadrant(grid_path: str, q: int, margin_pct: float = 0.025) -> Image.Image:
    im = Image.open(grid_path).convert("RGB")
    w, h = im.size
    hw, hh = w // 2, h // 2
    col = q % 2
    row = q // 2
    x0 = col * hw
    y0 = row * hh
    x1 = x0 + hw
    y1 = y0 + hh
    mx = int(hw * margin_pct)
    my = int(hh * margin_pct)
    return im.crop((x0 + mx, y0 + my, x1 - mx, y1 - my))


def draw_wrapped_text(draw, text: str, x: int, y: int, max_w: int, font, fill, line_h: int):
    words = text.split(" ")
    lines = []
    cur = ""
    for w in words:
        test = (cur + " " + w).strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_w or not cur:
            cur = test
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    cy = y
    for ln in lines:
        draw.text((x, cy), ln, font=font, fill=fill)
        cy += line_h
    return cy


def build_location_sheet(loc: dict) -> dict:
    grid_path = os.path.join(RAW_LOC_DIR, loc["gridFile"])
    panel = crop_quadrant(grid_path, loc["quadrant"], margin_pct=0.02)
    panel = ImageEnhance.Sharpness(panel).enhance(1.15)
    panel = ImageEnhance.Contrast(panel).enhance(1.06)

    # Save clean widescreen art (1280x720)
    wide_art = panel.resize((1280, 720), Image.Resampling.LANCZOS)
    art_filename = f"{loc['code'].replace('-', '_')}_{loc['slug']}.jpg"
    art_rel_url = f"/anime-character-sheets/locations/art/{art_filename}"
    wide_art.save(os.path.join(LOC_ART_DIR, art_filename), "JPEG", quality=92)

    # Build 1600x1000 Studio Concept Sheet
    sheet = Image.new("RGB", (1600, 1000), (251, 249, 245))
    draw = ImageDraw.Draw(sheet)
    accent = hex_to_rgb(loc["color"])

    f_badge = get_font(18, bold=True)
    f_title_en = get_font(32, bold=True)
    f_title_ko = get_font(24, bold=True)
    f_sec = get_font(16, bold=True)
    f_body = get_font(17, bold=False)
    f_mono = get_font(15, bold=False)

    # Top Header Bar
    draw.rectangle([0, 0, 1600, 88], fill=(20, 18, 18))
    draw.rectangle([0, 84, 1600, 88], fill=accent)
    draw.rectangle([28, 18, 165, 66], fill=accent)
    draw.text((44, 30), loc["code"], font=f_badge, fill=(255, 255, 255))
    draw.text((185, 16), f"{loc['nameEn']}  —  {loc['nameKo']}", font=f_title_en, fill=(255, 255, 255))
    ep_str = "EPs: " + ", ".join(f"EP{e:02d}" for e in loc["episodes"][:10])
    if len(loc["episodes"]) > 10:
        ep_str += f" (+{len(loc['episodes'])-10})"
    draw.text((185, 54), f"REGION: {loc['regionEn']} ({loc['regionKo']})   |   {ep_str}", font=f_mono, fill=(210, 210, 210))

    # Left Box: 01 MAIN WIDE ESTABLISHING SHOT (920x540)
    draw.rectangle([28, 108, 968, 690], fill=(255, 255, 255), outline=(40, 36, 36), width=2)
    draw.rectangle([28, 108, 968, 142], fill=(32, 29, 29))
    draw.text((42, 116), "01 WIDE ESTABLISHING SHOT (16:9 CANONICAL ENVIRONMENT ART)", font=f_sec, fill=(255, 255, 255))
    main_img = wide_art.resize((924, 520), Image.Resampling.LANCZOS)
    sheet.paste(main_img, (36, 152))

    # Bottom-Left Box: 02 ATMOSPHERIC & ARCHITECTURAL DETAIL ZOOM (2 crops)
    draw.rectangle([28, 706, 968, 972], fill=(255, 255, 255), outline=(40, 36, 36), width=2)
    draw.rectangle([28, 706, 968, 740], fill=(32, 29, 29))
    draw.text((42, 714), "02 LANDMARK FOCUS & LIGHTING / TEXTURE CLOSE-UP", font=f_sec, fill=(255, 255, 255))

    pw, ph = wide_art.size
    crop1 = wide_art.crop((int(pw * 0.12), int(ph * 0.10), int(pw * 0.58), int(ph * 0.75))).resize((445, 212), Image.Resampling.LANCZOS)
    crop2 = wide_art.crop((int(pw * 0.42), int(ph * 0.22), int(pw * 0.88), int(ph * 0.88))).resize((445, 212), Image.Resampling.LANCZOS)
    sheet.paste(crop1, (40, 748))
    sheet.paste(crop2, (508, 748))
    draw.rectangle([40, 748, 485, 960], outline=accent, width=2)
    draw.rectangle([508, 748, 953, 960], outline=accent, width=2)

    # Right Column Box 1: 03 NOVEL LORE & ENVIRONMENT SPECS
    draw.rectangle([988, 108, 1572, 600], fill=(255, 255, 255), outline=(40, 36, 36), width=2)
    draw.rectangle([988, 108, 1572, 142], fill=accent)
    draw.text((1004, 116), "03 ENGLISH NOVEL NAMING & ENVIRONMENT SPECIFICATION", font=f_sec, fill=(255, 255, 255))

    cy = 160
    draw.text((1008, cy), f"• Canonical English Name: {loc['nameEn']}", font=f_title_ko, fill=(20, 18, 18))
    cy += 38
    draw.text((1008, cy), f"• 한국어 소설 공식 명칭: {loc['nameKo']}", font=f_body, fill=(60, 56, 56))
    cy += 32
    draw.text((1008, cy), f"• 등장 회차 (Episodes): {', '.join(str(e) for e in loc['episodes'])}화", font=f_body, fill=accent)
    cy += 38

    draw.line([1008, cy, 1552, cy], fill=(220, 215, 210), width=1)
    cy += 14
    draw.text((1008, cy), "[소설 배경 설정 및 서사적 역할]", font=f_sec, fill=(20, 18, 18))
    cy += 26
    cy = draw_wrapped_text(draw, loc["summaryKo"], 1008, cy, 540, f_body, (45, 42, 42), 25)
    cy += 14

    draw.text((1008, cy), "[건축 양식 및 지형지물 특징]", font=f_sec, fill=(20, 18, 18))
    cy += 26
    cy = draw_wrapped_text(draw, loc["architectureKo"], 1008, cy, 540, f_body, (45, 42, 42), 25)
    cy += 14

    draw.text((1008, cy), "[조명·기후·시간대 연출 지침]", font=f_sec, fill=(20, 18, 18))
    cy += 26
    cy = draw_wrapped_text(draw, loc["atmosphereKo"], 1008, cy, 540, f_body, (45, 42, 42), 25)

    # Right Column Box 2: 04 COLOR PALETTE & ENGLISH AI VIDEO/CUTSCENE PROMPT
    draw.rectangle([988, 616, 1572, 972], fill=(255, 255, 255), outline=(40, 36, 36), width=2)
    draw.rectangle([988, 616, 1572, 650], fill=(32, 29, 29))
    draw.text((1004, 624), "04 5-COLOR SWATCH & ENGLISH CUTSCENE / VIDEO PROMPT", font=f_sec, fill=(255, 255, 255))

    for i, hex_c in enumerate(loc["palette"]):
        sx = 1008 + i * 108
        sy = 666
        draw.rectangle([sx, sy, sx + 96, sy + 48], fill=hex_to_rgb(hex_c), outline=(32, 29, 29), width=1)
        draw.text((sx + 10, sy + 54), hex_c.upper(), font=f_mono, fill=(60, 56, 56))

    draw.text((1008, 746), "[Unified English Prompt for Cutscene & Video Generation]", font=f_sec, fill=accent)
    draw_wrapped_text(draw, loc["promptEn"], 1008, 774, 544, f_mono, (40, 38, 38), 22)

    sheet_filename = f"{loc['code'].replace('-', '_')}_{loc['slug']}_sheet.jpg"
    sheet_rel_url = f"/anime-character-sheets/locations/sheets/{sheet_filename}"
    sheet.save(os.path.join(LOC_SHEET_DIR, sheet_filename), "JPEG", quality=92)

    return {
        **loc,
        "artUrl": art_rel_url,
        "sheetUrl": sheet_rel_url,
    }


def build_prop_sheet(prop: dict) -> dict:
    grid_path = os.path.join(RAW_PROP_DIR, prop["gridFile"])
    panel = crop_quadrant(grid_path, prop["quadrant"], margin_pct=0.025)
    panel = ImageEnhance.Sharpness(panel).enhance(1.18)
    panel = ImageEnhance.Contrast(panel).enhance(1.06)

    # Save clean square studio prop art (800x800)
    sq_art = panel.resize((800, 800), Image.Resampling.LANCZOS)
    art_filename = f"{prop['code'].replace('-', '_')}_{prop['slug']}.jpg"
    art_rel_url = f"/anime-character-sheets/props/art/{art_filename}"
    sq_art.save(os.path.join(PROP_ART_DIR, art_filename), "JPEG", quality=92)

    # Build 1600x1000 Studio Prop Sheet
    sheet = Image.new("RGB", (1600, 1000), (251, 249, 245))
    draw = ImageDraw.Draw(sheet)
    accent = hex_to_rgb(prop["color"])

    f_badge = get_font(18, bold=True)
    f_title_en = get_font(32, bold=True)
    f_title_ko = get_font(23, bold=True)
    f_sec = get_font(16, bold=True)
    f_body = get_font(17, bold=False)
    f_mono = get_font(15, bold=False)

    # Top Header Bar
    draw.rectangle([0, 0, 1600, 88], fill=(20, 18, 18))
    draw.rectangle([0, 84, 1600, 88], fill=accent)
    draw.rectangle([28, 18, 175, 66], fill=accent)
    draw.text((42, 30), prop["code"], font=f_badge, fill=(255, 255, 255))
    draw.text((195, 16), f"{prop['nameEn']}  —  {prop['nameKo']}", font=f_title_en, fill=(255, 255, 255))
    ep_str = "EPs: " + ", ".join(f"EP{e:02d}" for e in prop["episodes"][:10])
    if len(prop["episodes"]) > 10:
        ep_str += f" (+{len(prop['episodes'])-10})"
    draw.text((195, 54), f"CATEGORY: {prop['categoryEn']}   |   HOLDER: {prop['ownerKo']}   |   {ep_str}", font=f_mono, fill=(210, 210, 210))

    # Left Box: 01 FULL PROP STUDIO VIEW (600x864)
    draw.rectangle([28, 108, 636, 972], fill=(255, 255, 255), outline=(40, 36, 36), width=2)
    draw.rectangle([28, 108, 636, 142], fill=(32, 29, 29))
    draw.text((42, 116), "01 FULL KEY PROP DESIGN (ORTHOGRAPHIC STUDIO VIEW)", font=f_sec, fill=(255, 255, 255))
    prop_main = sq_art.resize((580, 580), Image.Resampling.LANCZOS)
    sheet.paste(prop_main, (42, 162))
    draw.rectangle([42, 756, 622, 956], fill=(248, 246, 242), outline=(210, 205, 198), width=1)
    draw.text((58, 770), f"CANONICAL ID: {prop['code']} ({prop['nameEn']})", font=f_sec, fill=accent)
    draw_wrapped_text(draw, prop["summaryKo"], 58, 800, 548, f_body, (40, 38, 38), 25)

    # Middle Box: 02 MATERIAL & RUNE DETAIL ZOOM (340x864)
    draw.rectangle([654, 108, 994, 972], fill=(255, 255, 255), outline=(40, 36, 36), width=2)
    draw.rectangle([654, 108, 994, 142], fill=(32, 29, 29))
    draw.text((668, 116), "02 RUNE & MATERIAL ZOOM", font=f_sec, fill=(255, 255, 255))

    z1 = sq_art.crop((140, 100, 660, 620)).resize((312, 312), Image.Resampling.LANCZOS)
    z2 = sq_art.crop((200, 220, 600, 620)).resize((312, 312), Image.Resampling.LANCZOS)
    sheet.paste(z1, (668, 158))
    draw.rectangle([668, 158, 980, 470], outline=accent, width=2)
    draw.text((668, 478), "▲ Primary Core / Emblem Detail", font=f_mono, fill=(80, 76, 76))

    sheet.paste(z2, (668, 520))
    draw.rectangle([668, 520, 980, 832], outline=accent, width=2)
    draw.text((668, 840), "▲ Surface Texture & Aura Zoom", font=f_mono, fill=(80, 76, 76))

    # Right Column: 03 PROP SPECS & 04 COLOR PALETTE + ENGLISH PROMPT
    draw.rectangle([1012, 108, 1572, 588], fill=(255, 255, 255), outline=(40, 36, 36), width=2)
    draw.rectangle([1012, 108, 1572, 142], fill=accent)
    draw.text((1028, 116), "03 ENGLISH NOVEL NAMING & PROP SPECIFICATION", font=f_sec, fill=(255, 255, 255))

    cy = 160
    draw.text((1028, cy), f"• English Novel Term: {prop['nameEn']}", font=f_title_ko, fill=(20, 18, 18))
    cy += 36
    draw.text((1028, cy), f"• 한국어 소설 공식 명칭: {prop['nameKo']}", font=f_body, fill=(60, 56, 56))
    cy += 30
    draw.text((1028, cy), f"• 주요 소유자/사용자: {prop['ownerKo']}", font=f_body, fill=(60, 56, 56))
    cy += 30
    draw.text((1028, cy), f"• 총 등장 회차수: {len(prop['episodes'])}개 회차", font=f_body, fill=accent)
    cy += 36

    draw.line([1028, cy, 1552, cy], fill=(220, 215, 210), width=1)
    cy += 16
    draw.text((1028, cy), "[재질·형태·세공 디자인 지침]", font=f_sec, fill=(20, 18, 18))
    cy += 26
    cy = draw_wrapped_text(draw, prop["materialKo"], 1028, cy, 520, f_body, (45, 42, 42), 25)
    cy += 18

    draw.text((1028, cy), "[마나 이펙트 및 소품 연출 효과]", font=f_sec, fill=(20, 18, 18))
    cy += 26
    cy = draw_wrapped_text(draw, prop["effectKo"], 1028, cy, 520, f_body, (45, 42, 42), 25)

    # Box 04
    draw.rectangle([1012, 604, 1572, 972], fill=(255, 255, 255), outline=(40, 36, 36), width=2)
    draw.rectangle([1012, 604, 1572, 638], fill=(32, 29, 29))
    draw.text((1028, 612), "04 5-COLOR SWATCH & ENGLISH CUTSCENE / VIDEO PROMPT", font=f_sec, fill=(255, 255, 255))

    for i, hex_c in enumerate(prop["palette"]):
        sx = 1028 + i * 104
        sy = 654
        draw.rectangle([sx, sy, sx + 92, sy + 46], fill=hex_to_rgb(hex_c), outline=(32, 29, 29), width=1)
        draw.text((sx + 8, sy + 52), hex_c.upper(), font=f_mono, fill=(60, 56, 56))

    draw.text((1028, 734), "[Unified English Prompt for Cutscene & Video Generation]", font=f_sec, fill=accent)
    draw_wrapped_text(draw, prop["promptEn"], 1028, 762, 524, f_mono, (40, 38, 38), 22)

    sheet_filename = f"{prop['code'].replace('-', '_')}_{prop['slug']}_sheet.jpg"
    sheet_rel_url = f"/anime-character-sheets/props/sheets/{sheet_filename}"
    sheet.save(os.path.join(PROP_SHEET_DIR, sheet_filename), "JPEG", quality=92)

    return {
        **prop,
        "artUrl": art_rel_url,
        "sheetUrl": sheet_rel_url,
    }


def build_overview_poster(items: list, title: str, out_path: str, is_prop: bool = False):
    # 5 columns x 4 rows = 20 items poster (2200 x 1560)
    W, H = 2200, 1560
    poster = Image.new("RGB", (W, H), (18, 17, 20))
    draw = ImageDraw.Draw(poster)
    f_h1 = get_font(34, bold=True)
    f_sub = get_font(18, bold=False)
    f_card_t = get_font(17, bold=True)
    f_card_s = get_font(14, bold=False)

    draw.rectangle([0, 0, W, 92], fill=(32, 29, 29))
    draw.text((36, 18), title, font=f_h1, fill=(255, 255, 255))
    draw.text((36, 58), "Unified English Novel Terminology · Pre-Production Reference Suite for Image Cutscenes & AI Video Generation", font=f_sub, fill=(250, 204, 21))

    cols, rows = 5, 4
    cw, ch = 416, 340
    start_x, start_y = 30, 112
    gap_x, gap_y = 15, 18

    for idx, item in enumerate(items[:20]):
        c = idx % cols
        r = idx // cols
        x = start_x + c * (cw + gap_x)
        y = start_y + r * (ch + gap_y)
        accent = hex_to_rgb(item["color"])

        draw.rectangle([x, y, x + cw, y + ch], fill=(30, 28, 34), outline=accent, width=2)
        art_disk = "public" + item["artUrl"]
        if os.path.exists(art_disk):
            im = Image.open(art_disk).convert("RGB")
            if is_prop:
                im = im.resize((246, 246), Image.Resampling.LANCZOS)
                poster.paste(im, (x + (cw - 246) // 2, y + 8))
            else:
                im = im.resize((cw - 12, 246), Image.Resampling.LANCZOS)
                poster.paste(im, (x + 6, y + 6))

        draw.rectangle([x, y + 258, x + cw, y + ch], fill=(22, 20, 24))
        draw.rectangle([x + 8, y + 266, x + 98, y + 290], fill=accent)
        draw.text((x + 14, y + 269), item["code"], font=f_card_s, fill=(255, 255, 255))
        draw.text((x + 106, y + 266), item["nameEn"][:24], font=f_card_t, fill=(255, 255, 255))
        draw.text((x + 10, y + 296), f"{item['nameKo']}", font=f_card_s, fill=(210, 210, 215))
        ep_s = ", ".join(f"EP{e:02d}" for e in item["episodes"][:5])
        draw.text((x + 10, y + 316), f"Episodes: {ep_s}", font=f_card_s, fill=(250, 204, 21))

    poster.save(out_path, "JPEG", quality=92)


def main():
    built_locations = []
    for loc in LOCATIONS:
        built_locations.append(build_location_sheet(loc))
    print(f"Built {len(built_locations)} Location Concept Sheets.")

    built_props = []
    for prop in PROPS:
        built_props.append(build_prop_sheet(prop))
    print(f"Built {len(built_props)} Prop Concept Sheets.")

    loc_poster_path = os.path.join(OUT_DIR, "all_20_locations_poster.jpg")
    prop_poster_path = os.path.join(OUT_DIR, "all_20_props_poster.jpg")
    build_overview_poster(built_locations, "SNSHero 'Kadan's Journey' — 20 Canonical Location Sheets (배경장소 시트 총람)", loc_poster_path, is_prop=False)
    build_overview_poster(built_props, "SNSHero 'Kadan's Journey' — 20 Canonical Prop & Item Sheets (핵심 소품 시트 총람)", prop_poster_path, is_prop=True)

    # Update manifest.json with locations and props
    manifest_path = os.path.join(OUT_DIR, "manifest.json")
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    manifest["totalLocations"] = len(built_locations)
    manifest["totalProps"] = len(built_props)
    manifest["locationsPosterUrl"] = "/anime-character-sheets/all_20_locations_poster.jpg"
    manifest["propsPosterUrl"] = "/anime-character-sheets/all_20_props_poster.jpg"
    manifest["locations"] = built_locations
    manifest["props"] = built_props

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print("Updated manifest.json with 20 locations and 20 props.")


if __name__ == "__main__":
    main()
