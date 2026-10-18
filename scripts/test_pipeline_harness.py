import json, re

# Verification function to test any episode text
REQUIRED_KEYWORDS = {
    "은빛 단검": [1, 2, 4, 11, 16],
    "알렉산다르": [1, 2, 4, 10, 11, 23, 24],
    "발리안": [1, 6, 7, 10, 11, 12, 16, 23, 24, 40],
    "이그니스": [1, 6, 7, 8, 9, 10, 11, 12, 14, 16, 17, 18, 19, 20, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 35, 37, 39, 40],
    "실리아": [5, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
}

FORBIDDEN_BOILERPLATE = [
    "대기를 타고 흐르는 미세한 마나의 파문이 칼날처럼 팽팽한 긴장감을 자아냈다",
    "녹옥 지팡이를 쥔 실리아의 가벼운 발걸음이 바람의 결을 따라 매끄럽게 미끄러졌다",
    "백색 화염을 두른 이그니스의 눈동자가 꺼지지 않는 불꽃처럼 번뜩였다",
    "푸른 파도가 절벽에 부딪쳐 하얗게 부서지며 짠내 섞인 서늘한 바닷바람이 망토를 흔들었다",
    "안개에 젖은 기괴한 바위벽 사이로 피어오른 냉기가 폐허의 기둥을 서늘하게 휘감았다",
    "운명의 수레바퀴는 결코 멈추지 않고",
]

FORBIDDEN_REGEX_CORRUPTIONS = [
    "거두지 않았다",
    "결박펼쳐졌다",
    "시작펼쳐졌다",
    "함락펼쳐졌다",
    "발각펼쳐졌다",
    "완성펼쳐졌다",
    "배달펼쳐졌다",
    "포위펼쳐졌다",
    "웃고 타올랐다",
    "내리고 타올랐다",
    "누워 타올랐다",
]

def validate_episode(ep_num, ko_text, en_text):
    errors = []
    # 1. Length check
    char_len = len(ko_text)
    if char_len < 3500:
        errors.append(f"Length {char_len} < 3500")
    
    # 2. Dialogue count
    lines = [l.strip() for l in ko_text.split("\n") if l.strip()]
    dlgs = [l for l in lines if ('“' in l and '”' in l) or l.startswith('“')]
    if len(dlgs) < 8:
        errors.append(f"Dialogues {len(dlgs)} < 8")
        
    # 3. Required keywords
    for kw, req_eps in REQUIRED_KEYWORDS.items():
        if ep_num in req_eps and kw not in ko_text:
            errors.append(f"Missing required keyword: '{kw}'")
            
    # 4. Forbidden boilerplate
    for bp in FORBIDDEN_BOILERPLATE:
        if bp in ko_text:
            errors.append(f"Contains boilerplate: '{bp}'")
            
    # 5. Forbidden regex corruptions
    for rc in FORBIDDEN_REGEX_CORRUPTIONS:
        if rc in ko_text:
            errors.append(f"Contains regex corruption: '{rc}'")
            
    # 6. Ghost speaker rule: Ignis in Ep 29..40
    if ep_num >= 29:
        for d in dlgs:
            # Check if Ignis is speaking
            # (e.g. “...” 라고 이그니스가 말했다 or 이그니스가 외쳤다: “...”)
            if "이그니스" in d and ("외쳤다" in d or "소리쳤다" in d or "말했다" in d or "중얼거렸다" in d):
                errors.append(f"Ghost speaker Ignis speaking in Ep {ep_num}: {d}")
                
    # 7. English checks
    if en_text:
        if "(042.png)" in en_text or re.search(r"\(\d{3}\.png\)", en_text):
            errors.append("English contains raw image tokens")
        if not re.search(r"^SNSHero Novel\s*\nEpisode \d{2}:", en_text, re.MULTILINE):
            errors.append("English header format invalid")

    return errors, char_len, len(dlgs)

print("Harness loaded successfully.")
