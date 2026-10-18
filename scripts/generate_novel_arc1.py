#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SNSHero Web Novel Arc 1 Generator (Episodes 01 - 10)
Expands Episodes 01-10 into commercial-grade fantasy fiction (>= 3,700 chars, >= 10 dialogues).
"""

import json
import os
import re

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BOOK_DIR = os.path.join(BASE_DIR, "public", "book")
EN_DIR = os.path.join(BOOK_DIR, "image_narrations", "english_txt")
MANIFEST_PATH = os.path.join(BASE_DIR, "src", "content", "webtoonEpisodeManifest.json")

with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
    MANIFEST = json.load(f)

# Scene-by-scene custom dialogues and rich sensory beats for Episodes 1-10
EPISODE_ENRICHMENTS = {
    1: {
        # Already pre-authored with 4,060 chars in novel_batch_1.py
    },
    2: {
        "sensory_intro": "폐허가 된 엘윈 마을의 잿더미 위로 북풍이 울부짖었다. 검게 그을린 목재 기둥마다 서릿발이 칼날처럼 돋아났고, 눈 덮인 밭둑 아래에는 아직 식지 않은 비극의 냄새가 맴돌았다.",
        "extra_dialogues": [
            ("헤르쿨", "“이것은 국경을 지키는 정예 사령부의 문장... 외부의 적이 아니라 왕국 내부의 권력자가 설계를 주도했다는 명백한 증거다.”"),
            ("그림리", "“성기사의 황금 망토를 두른 놈이 여기까지 냄새를 맡고 기어들어 왔군!”"),
            ("에일라", "“황궁의 충견 놈들에게 넘겨줄 아이는 한 놈도 없다! 무기를 버려라!”"),
            ("가웨인", "“잠깐, 그림리! 저자의 발소리에는 죄 없는 자를 해치려는 살기가 실려 있지 않다!”"),
            ("피난민 소녀", "“기사님, 제발 멈추세요! 이분들은 우리를 팔아넘기는 유괴범이 아니에요! 노예선으로 끌려가던 우리를 목숨 걸고 구해 주신 분들이라고요!”"),
            ("그림리", "“빌어먹을, 궁정 놈들의 개가 아니라 진짜 뼈대 있는 성기사였단 말인가. 겉모습만 보고 섣불리 화살을 날렸군 그래. 이 부둣가에 궁정 첩자들이 하도 들끓어서 눈이 뒤집혔던 게지.”"),
            ("헤르쿨", "“알렉산다르의 아내는 만삭의 몸으로 북쪽 얼어붙은 와일드랜드로 탈출했소. 발리안의 아이는 루시안의 궁정으로 끌려갔지. 부디 간청하오. 황야의 사나운 바람 속에서 알렉산다르의 핏줄이 살아남을 수 있도록 찾아내 거두어 주시오.”"),
            ("가웨인", "“우리는 대륙의 그림자 속을 걷는 거친 사냥꾼들이오. 하지만 의로운 영웅의 피가 북풍 속에서 얼어 죽는 꼴은 차마 두고 볼 수 없지.”"),
            ("에일라", "“좋아요. 우리 일곱 사람이 북방의 유목민 천막들을 샅샅이 뒤져 알렉산다르의 아들을 찾아내겠어요. 황야의 거친 늑대들에게도 찢기지 않는 단단한 무인으로 키워내지요. 활 쏘는 법부터 사냥의 숨결까지 모조리 가르치겠어요.”"),
            ("카제", "“거기다 세상의 사기꾼들에게 속지 않는 날카로운 눈치와 비검술까지 덤으로 얹어주지.”"),
            ("론돌", "“물살을 타는 법과 배를 모는 끈기도 빼놓을 수 없소.”"),
            ("헤르쿨", "“고맙소. 그렇다면 나는 남쪽 붉은 유리 궁정의 어둠 속으로 잠입해 발리안의 아이를 찾아내겠소. 섀도우렐름의 사악한 마도사들이 그 아이의 영혼을 타락시키지 못하도록 진실의 룬을 지킬 것이오.”"),
            ("가웨인", "“그렇다면 하나의 맹세를 더합시다, 성기사여. 지금으로부터 정확히 열여덟 해가 흐른 뒤, 대륙 중앙의 별취한 종탑에서 다시 만납시다. 당신이 기른 아이와 우리 일곱 사람이 길러낸 아이를 마주 세워, 누구의 가르침이 더 올곧게 세상의 불의를 갈랐는지 무인의 결투로 확인하는 것이 어떻겠소?”"),
            ("헤르쿨", "“좋소! 승패를 떠나, 두 아이가 부모의 숭고한 뜻을 이어받아 이 썩어빠진 대륙을 구할 진정한 등불이 되었음을 증명하는 의식이 될 것이오!”"),
        ]
    }
}

print("Loaded Arc 1 enrichment templates.")
