#!/usr/bin/env python3
"""
Synchronizes src/content/webtoonEpisodeManifest.json and public/book/image_narrations/episode_XX_narrations.json
100% faithfully with the latest 40-episode novel texts in public/book/episode_01.md..episode_40.md
and public/book/image_narrations/english_txt/SNSHero_Novel_Episode_01..40_*.txt.
Splits each episode into 2–3 line narration cutscenes (~55–130 Korean chars per cutscene) without a 20-scene limit.
"""

import json
import re
from pathlib import Path

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MANIFEST_PATH = PROJECT_ROOT / "src/content/webtoonEpisodeManifest.json"
NARRATIONS_DIR = PROJECT_ROOT / "public/book/image_narrations"
EN_TXT_DIR = NARRATIONS_DIR / "english_txt"
BOOK_DIR = PROJECT_ROOT / "public/book"
CARD_DB_PATH = PROJECT_ROOT / "src/cardDatabase.ts"
EN_MAP_PATH = PROJECT_ROOT / "src/content/englishNovelMapping.ts"

# 1. Parse all 110 cards from cardDatabase.ts
db_txt = CARD_DB_PATH.read_text(encoding="utf-8")
CARDS_BY_ID = {}
for m in re.finditer(r"(\d+):\s*\{\s*id:\s*\d+[^}]*?title:\s*'([^']+)'[^}]*?title_en:\s*'([^']+)'", db_txt, re.DOTALL):
    cid = int(m.group(1))
    CARDS_BY_ID[cid] = {"id": cid, "ko": m.group(2), "en": m.group(3)}

# 2. Parse novel character list from public/book/index.json
idx_data = json.loads((BOOK_DIR / "index.json").read_text(encoding="utf-8"))
NOVEL_CHARS = []
for c in idx_data["characters"]:
    cid = c["cardId"]
    ko_name = c["cardName"]
    en_name = CARDS_BY_ID.get(cid, {}).get("en", ko_name)
    NOVEL_CHARS.append({"cardId": cid, "ko": ko_name, "en": en_name})

# Build aliases for accurate Korean text matching
CHAR_ALIASES = []
for ch in NOVEL_CHARS:
    CHAR_ALIASES.append((ch["ko"], ch))
    if " " in ch["ko"]:
        for part in ch["ko"].split():
            if len(part) >= 2:
                CHAR_ALIASES.append((part, ch))
CHAR_ALIASES.sort(key=lambda x: len(x[0]), reverse=True)

# 3. Parse ENGLISH_NOVEL_MAP
en_map_txt = EN_MAP_PATH.read_text(encoding="utf-8")
EN_EPISODE_INFO = {}
for m in re.finditer(r'(\d+):\s*\{\s*fileName:\s*"([^"]+)",\s*titleEn:\s*"([^"]+)"\s*\}', en_map_txt):
    ep_n = int(m.group(1))
    EN_EPISODE_INFO[ep_n] = {"fileName": m.group(2), "titleEn": m.group(3)}

ACTION_KEYWORDS = [
    (("검", "창", "베", "챙", "부딪", "격돌", "방패", "단검", "칼날"), ("챙-!", "CLANG!", "slash", "top-right")),
    (("베어", "날붙이", "절단", "스쳤", "일격", "끊었"), ("서걱-!", "SLASH!", "slash", "center")),
    (("폭발", "화염", "불꽃", "터져", "화구", "파괴", "불길", "횃불"), ("콰아아앙!", "BOOM!", "impact", "center")),
    (("마나", "마법", "룬", "빛", "아케인", "번개", "섬광", "방호진", "공명"), ("파지지직!", "CRACKLE!", "magic", "top-right")),
    (("진동", "무너", "포효", "괴성", "땅", "울림", "거대", "추락", "급류"), ("쿠구구궁!", "RUMBLE!", "rumble", "bottom-left")),
    (("눈보라", "바람", "돌풍", "휘몰", "삭풍", "한기", "설원", "안개"), ("휘이이익-!", "SWOOSH!", "slash", "top-left")),
    (("발소리", "돌진", "내리찍", "강타", "착지", "벽", "말발굽", "문짝"), ("쿵-!", "THUD!", "impact", "bottom-right")),
]

def determine_sfx(text_ko: str, ep_num: int, scene_idx: int) -> list:
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
    if not cues:
        fallback_sfx = ACTION_KEYWORDS[(ep_num + scene_idx) % len(ACTION_KEYWORDS)][1]
        cues.append({
            "textKo": fallback_sfx[0],
            "textEn": fallback_sfx[1],
            "style": fallback_sfx[2],
            "position": fallback_sfx[3]
        })
    return cues

def determine_bubble_type(quote: str) -> str:
    if any(m in quote for m in ["!", "크악", "멈춰라", "덤벼라", "죽어라", "안 돼", "살아남아", "비겁한"]):
        return "shout"
    if any(m in quote for m in ["...", "…", "과연", "어쩌면"]):
        return "thought"
    if any(m in quote for m in ["조용히", "쉿", "들리지 않게"]):
        return "whisper"
    return "speech"

def infer_background_desc(text_ko: str, ep_num: int) -> str:
    if any(k in text_ko for k in ["선술집", "주막", "대장간", "화로", "모루"]):
        return "inside a weathered frontier tavern lit by fire and rune lamps"
    if any(k in text_ko for k in ["다리", "절벽", "계곡", "급류", "협곡"]):
        return "a frozen mountain canyon bridge and icy waterfall cliff"
    if any(k in text_ko for k in ["종", "동굴", "지하", "봉인", "석실", "사슬"]):
        return "a subterranean cavern with ancient chains and golden rune circles"
    if any(k in text_ko for k in ["적갈", "명마", "평원", "초원", "말발굽"]):
        return "a sunlit crimson plain where wild warhorses gallop"
    if any(k in text_ko for k in ["숲", "엘프", "세계수", "실바니아", "나뭇잎"]):
        return "an enchanted forest elf sanctuary under moonlight"
    if any(k in text_ko for k in ["궁정", "황궁", "왕궁", "알현실", "왕좌", "연회"]):
        return "a grand palace court with towering arches and throne room"
    if any(k in text_ko for k in ["바다", "배", "선박", "항구", "파도", "해류", "섬"]):
        return "an ocean coast with dark waves and ancient shipwrecks"
    if any(k in text_ko for k in ["용암", "화산", "불길", "화염", "용광로"]):
        return "a volcanic magma citadel and flame chamber"
    if any(k in text_ko for k in ["무덤", "묘지", "망자", "언데드", "해골"]):
        return "a foggy gothic memorial graveyard and crypt"
    if any(k in text_ko for k in ["비행정", "태엽", "골렘", "기계", "공방"]):
        return "a clockwork steam forge and arcane foundry"
    if any(k in text_ko for k in ["드래곤", "용", "첨탑", "비늘"]):
        return "a towering dragon precipice among crags"
    if any(k in text_ko for k in ["심연", "균열", "차원", "어둠의 군세"]):
        return "an abyssal void and dimensional tear battlefield"
    if any(k in text_ko for k in ["새벽", "아침", "여명", "빵", "씨앗", "평화"]):
        return "dawn breaking over the restored kingdom morning"
    if any(k in text_ko for k in ["눈보라", "설원", "겨울", "얼어붙은", "눈밭"]):
        return "a snowbound Lighthaven frontier under a violent blue-white blizzard"
    return ""

def find_subject_in_sentence(sent: str, vocatives: set):
    if "이름이 적혀" in sent:
        return None
    clean_sent = re.sub(r'엘윈\s*마을', '마을', sent)
    for alias, ch in CHAR_ALIASES:
        if ch["ko"] in vocatives:
            continue
        if re.search(rf'{re.escape(alias)}(\s+역시|은|는|이|가|도|의\s*목소리|의\s*눈빛|의\s*입|마저)', clean_sent):
            return ch
    for alias, ch in CHAR_ALIASES:
        if ch["ko"] in vocatives:
            continue
        if alias in clean_sent:
            return ch
    return None

def detect_speaker_for_quote(quote_ko: str, chunk_idx: int, all_ko_chunks: list, last_speaker=None):
    def strip_q(s):
        return re.sub(r'[“"][^”"]*[”"]', '', s)

    curr_narr = strip_q(all_ko_chunks[chunk_idx]).strip()
    next_narr = strip_q(all_ko_chunks[chunk_idx + 1]).strip() if chunk_idx + 1 < len(all_ko_chunks) else ""
    prev_narr = strip_q(all_ko_chunks[chunk_idx - 1]).strip() if chunk_idx - 1 >= 0 else ""

    vocatives = set()
    for alias, ch in CHAR_ALIASES:
        if re.search(rf'(^|[,\s“"]){re.escape(alias)}[!?,，\s]', quote_ko):
            vocatives.add(ch["ko"])

    if len(curr_narr) > 2:
        sp = find_subject_in_sentence(curr_narr, vocatives)
        if sp:
            return sp

    next_sents = [s.strip() for s in re.split(r'[.!?]\s*', next_narr) if s.strip()]
    next_first_sent = next_sents[0] if next_sents else ""
    prev_sents = [s.strip() for s in re.split(r'[.!?]\s*', prev_narr) if s.strip()]
    prev_last_sent = prev_sents[-1] if prev_sents else ""

    next_introduces_next_quote = (chunk_idx + 2 < len(all_ko_chunks) and ('“' in all_ko_chunks[chunk_idx + 2] or '"' in all_ko_chunks[chunk_idx + 2]) and len(next_sents) <= 1)
    if next_introduces_next_quote and prev_last_sent:
        sp = find_subject_in_sentence(prev_last_sent, vocatives)
        if sp:
            return sp

    post_speech_re = r'(으르렁|소리쳤|외쳤|속삭였|말했|물었|답했|중얼|내뱉|읊조|부르짖|호통|일갈|덧붙였|대꾸했|눈빛이|목소리가)'
    if next_first_sent and re.search(post_speech_re, next_first_sent):
        sp = find_subject_in_sentence(next_first_sent, vocatives)
        if sp:
            return sp

    for sent in reversed(prev_sents):
        sp = find_subject_in_sentence(sent, vocatives)
        if sp:
            return sp

    if next_first_sent:
        sp = find_subject_in_sentence(next_first_sent, vocatives)
        if sp:
            return sp

    if last_speaker:
        return last_speaker
    return None

def extract_chars_in_text(text: str) -> list:
    found = []
    seen = set()
    clean_text = re.sub(r'엘윈\s*마을', '마을', text)
    for m_pos in range(len(clean_text)):
        sub = clean_text[m_pos:]
        for alias, ch in CHAR_ALIASES:
            if sub.startswith(alias) and ch["en"] not in seen:
                seen.add(ch["en"])
                found.append(ch)
    return found

def split_long_sentence_if_needed(sent: str, max_len: int = 125) -> list:
    """If a single sentence or multi-sentence quote exceeds max_len, split it cleanly into 2-3 line chunks."""
    if len(sent) <= max_len:
        return [sent]
    mid = len(sent) // 2

    # Case 1: Long multi-sentence quote “...”
    if sent.startswith('“') and sent.endswith('”'):
        inner = sent[1:-1].strip()
        q_cands = []
        for m in re.finditer(r'[.!?]\s+', inner):
            pos = m.end()
            if 28 <= pos <= len(inner) - 28:
                q_cands.append((abs(pos - len(inner) // 2), pos))
        if q_cands:
            q_cands.sort(key=lambda x: x[0])
            sp_pos = q_cands[0][1]
            left_q = f"“{inner[:sp_pos].strip()}”"
            right_q = f"“{inner[sp_pos:].strip()}”"
            res = []
            res.extend(split_long_sentence_if_needed(left_q, max_len))
            res.extend(split_long_sentence_if_needed(right_q, max_len))
            return res

    # Case 2: Sentence outside quotes
    if '“' in sent or '"' in sent:
        return [sent]

    candidates = []
    for m in re.finditer(r'(,\s+|며\s+|고\s+|자\s+|으나\s+|지만\s+|채\s+|뒤\s+|동안\s+)', sent):
        pos = m.end()
        if 32 <= pos <= len(sent) - 32:
            candidates.append((abs(pos - mid), pos))
    if not candidates:
        return [sent]
    candidates.sort(key=lambda x: x[0])
    split_pos = candidates[0][1]
    left = sent[:split_pos].strip()
    right = sent[split_pos:].strip()
    return [left, right]

def split_para_into_sentences_ko(p: str) -> list:
    sents = []
    buf = []
    in_quote = False
    i = 0
    n = len(p)
    while i < n:
        ch = p[i]
        buf.append(ch)
        if ch == '“':
            in_quote = True
        elif ch == '”':
            in_quote = False
            if i + 1 < n and p[i + 1] == ' ':
                raw_s = "".join(buf).strip()
                sents.extend(split_long_sentence_if_needed(raw_s))
                buf = []
                i += 1
        elif not in_quote and ch in '.!?':
            if i + 1 == n or p[i + 1] == ' ':
                raw_s = "".join(buf).strip()
                sents.extend(split_long_sentence_if_needed(raw_s))
                buf = []
                if i + 1 < n and p[i + 1] == ' ':
                    i += 1
        i += 1
    rem = "".join(buf).strip()
    if rem:
        sents.extend(split_long_sentence_if_needed(rem))
    return [s for s in sents if s]

def build_2_3_line_chunks_ko(paras: list, max_chars: int = 118) -> list:
    """
    Splits Korean paragraphs into 2–3 line narration chunks (~50–122 chars).
    Preserves paragraph boundaries unless a single-sentence paragraph is very short (< 38 chars).
    """
    raw_para_chunks = []
    for p in paras:
        sents = split_para_into_sentences_ko(p)
        p_chunks = []
        curr = ""
        for s in sents:
            if not curr:
                curr = s
            elif len(curr) + 1 + len(s) <= max_chars:
                curr = curr + " " + s
            else:
                p_chunks.append(curr)
                curr = s
        if curr:
            if p_chunks and len(curr) < 32 and len(p_chunks[-1]) + 1 + len(curr) <= 125:
                p_chunks[-1] = p_chunks[-1] + " " + curr
            else:
                p_chunks.append(curr)
        raw_para_chunks.extend(p_chunks)

    # Merge very short standalone chunks (< 36 chars) with adjacent chunk if combined <= 125 chars
    merged = []
    i = 0
    while i < len(raw_para_chunks):
        c = raw_para_chunks[i]
        if len(c) < 36 and i + 1 < len(raw_para_chunks) and len(c) + 1 + len(raw_para_chunks[i + 1]) <= 125:
            merged.append(c + " " + raw_para_chunks[i + 1])
            i += 2
        else:
            merged.append(c)
            i += 1
    return merged

def split_en_paras_into_sentences(en_paras: list) -> list:
    sents = []
    for p in en_paras:
        parts = [s.strip() for s in re.split(r'(?<=[.!?”"])\s+(?=[A-Z“"])', p.strip()) if s.strip()]
        sents.extend(parts)
    return sents


def split_en_sentence_into_clauses(sent: str) -> list:
    """Splits a long multi-clause English sentence into 2 balanced clauses if possible."""
    mid = len(sent) // 2
    cands = []
    for m in re.finditer(
        r'(;\s+|:\s+|—\s*|,\s+(?:and|but|while|where|though|yet|as|for|who|which|choosing|leaving|shielding|wiping|turning|dragging|holding|drawing|brandishing|concealing)\b|,\s+)',
        sent
    ):
        pos = m.end()
        if 28 <= pos <= len(sent) - 28:
            weight = 0 if (len(m.group(0)) > 3 or m.group(0)[0] in ';:—') else 18
            cands.append((abs(pos - mid) + weight, m.start(), m.end()))
    if not cands:
        return [sent]
    cands.sort(key=lambda x: x[0])
    _, sp_start, _ = cands[0]
    left = sent[:sp_start].strip()
    if left and left[-1] not in '.!?"”':
        left += '.'
    right = sent[sp_start:].lstrip(',;:— ').strip()
    if right:
        right = right[0].upper() + right[1:]
    return [left, right] if (left and right) else [sent]


def build_en_sents_with_panel(en_paras: list, target_min_sents: int) -> list:
    """
    Partitions en_paras into the 9 AI storyboard panel buckets (p = 0..8)
    and returns a list of (panel_idx, sentence_str) tuples.
    If total sentences < target_min_sents, splits the longest multi-clause sentences
    so DP alignment can assign at least 1 distinct sentence/clause per cut.
    """
    m_paras = len(en_paras)
    items = []
    for p in range(9):
        st = int(round(p * m_paras / 9))
        en = int(round((p + 1) * m_paras / 9))
        for s in split_en_paras_into_sentences(en_paras[st:en]):
            items.append((p, s))

    # Also split any very long English sentence (> 210 chars) that isn't inside quotes
    expanded = []
    for p, s in items:
        if len(s) > 210 and '"' not in s and '“' not in s:
            for cl in split_en_sentence_into_clauses(s):
                expanded.append((p, cl))
        else:
            expanded.append((p, s))
    items = expanded

    while len(items) < target_min_sents:
        best_i = -1
        best_len = 0
        for idx, (p, s) in enumerate(items):
            if len(s) > best_len and len(s) >= 75:
                clauses = split_en_sentence_into_clauses(s)
                if len(clauses) > 1:
                    best_len = len(s)
                    best_i = idx
        if best_i < 0:
            break
        p_val, s_val = items[best_i]
        clauses = split_en_sentence_into_clauses(s_val)
        items[best_i:best_i + 1] = [(p_val, c) for c in clauses]

    return items


def align_ko_chunks_with_en_sents(ko_chunks: list, en_sents_with_panel: list) -> list:
    """
    Uses dynamic programming with multi-feature similarity (character names, quote presence,
    translated length ratio, and cumulative narrative progress) to align each ko_chunk (0..n_cuts-1)
    to a contiguous slice (se, ee) of en_sents_with_panel.
    Returns a list of (se, ee, panel_idx) for each cut.
    """
    n_cuts = len(ko_chunks)
    n_sents = len(en_sents_with_panel)
    if n_sents < n_cuts:
        # Fallback proportional mapping if still fewer sentences than cuts
        res = []
        for i in range(n_cuts):
            se = min(n_sents - 1, int(round(i * n_sents / n_cuts)))
            ee = max(se + 1, int(round((i + 1) * n_sents / n_cuts)))
            res.append((se, ee, en_sents_with_panel[se][0]))
        return res

    ko_lens = [max(8, len(c)) for c in ko_chunks]
    en_lens = [max(8, len(s)) for _, s in en_sents_with_panel]
    tot_ko = float(sum(ko_lens))
    tot_en = float(sum(en_lens))

    ko_cum = []
    acc = 0.0
    for l in ko_lens:
        acc += l
        ko_cum.append(acc / tot_ko)

    en_cum = []
    acc = 0.0
    for l in en_lens:
        acc += l
        en_cum.append(acc / tot_en)

    ko_has_q = [bool(re.search(r'[“"”]', c)) for c in ko_chunks]
    ko_chars = [set(ch["en"] for ch in extract_chars_in_text(c)) for c in ko_chunks]

    en_has_q = [bool(re.search(r'[“"”]', s)) for _, s in en_sents_with_panel]
    en_chars = [
        set(ch["en"] for ch in NOVEL_CHARS if ch["en"].lower() in s.lower())
        for _, s in en_sents_with_panel
    ]

    INF = 1e12
    dp = [[INF] * n_sents for _ in range(n_cuts)]
    parent = [[0] * n_sents for _ in range(n_cuts)]

    def calc_cost(i: int, k_start: int, j_end: int) -> float:
        en_len = sum(en_lens[m] for m in range(k_start, j_end + 1))
        exp_len = ko_lens[i] * 2.15
        len_c = abs(en_len - exp_len) / max(75.0, exp_len)

        eq = any(en_has_q[m] for m in range(k_start, j_end + 1))
        q_c = 0.0 if (ko_has_q[i] == eq) else 0.55

        ck = ko_chars[i]
        ce = set()
        for m in range(k_start, j_end + 1):
            ce |= en_chars[m]
        if ck or ce:
            ch_c = 0.45 * (1.0 - len(ck & ce) / float(len(ck | ce)))
        else:
            ch_c = 0.0

        pos_c = abs(ko_cum[i] - en_cum[j_end]) * 2.2
        return len_c * 0.40 + q_c + ch_c + pos_c

    max_first = min(6, n_sents - (n_cuts - 1))
    for j in range(max_first):
        dp[0][j] = calc_cost(0, 0, j)

    for i in range(1, n_cuts):
        rem_cuts = n_cuts - 1 - i
        j_min = i
        j_max = n_sents - 1 - rem_cuts
        for j in range(j_min, j_max + 1):
            k_min = max(i - 1, j - 5)
            best_v = INF
            best_k = i - 1
            for k in range(k_min, j):
                prev_v = dp[i - 1][k]
                if prev_v < INF:
                    v = prev_v + calc_cost(i, k + 1, j)
                    if v < best_v:
                        best_v = v
                        best_k = k
            dp[i][j] = best_v
            parent[i][j] = best_k

    assign = [None] * n_cuts
    curr_j = n_sents - 1
    for i in range(n_cuts - 1, 0, -1):
        pk = parent[i][curr_j]
        p_idx = en_sents_with_panel[pk + 1][0]
        assign[i] = (pk + 1, curr_j + 1, p_idx)
        curr_j = pk
    assign[0] = (0, curr_j + 1, en_sents_with_panel[0][0])
    return assign

def extract_english_quotes_from_text(en_text: str) -> list:
    merged_p = re.sub(r'[”"]\s*[^”".!?]{2,45}?,\s*[“"]', ' ', en_text)
    qs = re.findall(r'[“"]([^”"]+)[”"]', merged_p)
    return [q.strip() for q in qs if len(q.strip()) >= 3]

def get_concise_narration_sentence(text_ko: str, text_en: str) -> tuple:
    sents_ko = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text_ko.strip()) if s.strip()]
    sents_en = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text_en.strip()) if s.strip()]
    best_ko = sents_ko[-1] if sents_ko else text_ko.strip()
    best_en = sents_en[-1] if sents_en else text_en.strip()
    return best_ko, best_en

def main():
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    positions = ["top-left", "top-right", "bottom-left", "bottom-right"]

    total_scenes_all = 0
    total_quoted_scenes = 0
    total_narration_scenes = 0
    max_chunk_len_seen = 0

    for ep_num in range(1, 41):
        ep_pad = f"{ep_num:02d}"
        ko_md_path = BOOK_DIR / f"episode_{ep_pad}.md"
        en_info = EN_EPISODE_INFO[ep_num]
        en_txt_path = EN_TXT_DIR / en_info["fileName"]

        ko_raw = ko_md_path.read_text(encoding="utf-8").splitlines()
        title_ko = f"제{ep_num}화"
        ko_paras = []
        for line in ko_raw:
            s = line.strip()
            if not s:
                continue
            if s.startswith("#"):
                m_t = re.search(r'-\s*(.+)$', s)
                if m_t:
                    title_ko = m_t.group(1).strip()
                continue
            if s.startswith(">"):
                continue
            ko_paras.append(s)

        en_raw = en_txt_path.read_text(encoding="utf-8").splitlines()
        title_en = en_info["titleEn"]
        en_paras = []
        for line in en_raw:
            s = line.strip()
            if not s or s.startswith("SNSHero Novel") or s.startswith("Episode "):
                continue
            en_paras.append(s)

        # Build 2-3 line Korean narration chunks for this episode
        ko_chunks = build_2_3_line_chunks_ko(ko_paras, max_chars=122)
        num_scenes = len(ko_chunks)
        en_sents_with_panel = build_en_sents_with_panel(en_paras, num_scenes)
        cut_assignments = align_ko_chunks_with_en_sents(ko_chunks, en_sents_with_panel)

        # Compute sub_idx within each panel bucket (0..8)
        panel_counters = {p: 0 for p in range(9)}
        cut_panel_sub = []
        for se, ee, p_idx in cut_assignments:
            sub_i = panel_counters[p_idx]
            panel_counters[p_idx] += 1
            cut_panel_sub.append((se, ee, p_idx, sub_i))

        # Precompute quotes & speakers across all ko_chunks in this episode
        chunk_quotes_ko = {}
        last_sp = None
        for i, ch_txt in enumerate(ko_chunks):
            qs = re.findall(r'[“"]([^”"]+)[”"]', ch_txt)
            q_list = []
            for q in qs:
                sp = detect_speaker_for_quote(q, i, ko_chunks, last_sp)
                if sp:
                    last_sp = sp
                q_list.append((q, sp))
            chunk_quotes_ko[i] = q_list

        # All episode characters for title card
        ep_chars_all = extract_chars_in_text(" ".join(ko_paras))
        ep_char_names_en = [c["en"] for c in ep_chars_all[:8]] or ["Kadan"]

        ep_manifest = manifest.get(str(ep_num), {})
        ep_manifest["episodeNumber"] = ep_num
        ep_manifest["episodeTitle"] = title_en
        ep_manifest["episodeTitleKo"] = title_ko
        ep_manifest["totalImages"] = num_scenes + 1

        # Determine climax scene index if this episode has a special climax art
        climax_art = None
        if ep_num == 1:
            climax_art = (num_scenes, "/images/webtoon/ep01_blizzard_vow.webp")
        elif ep_num == 8:
            climax_art = (max(1, round(num_scenes * 0.75)), "/images/webtoon/ep08_crimson_mane.webp")
        elif ep_num == 15:
            climax_art = (max(1, round(num_scenes * 0.90)), "/images/webtoon/ep15_shadow_duel.webp")
        elif ep_num == 25:
            climax_art = (max(1, round(num_scenes * 0.80)), "/images/webtoon/ep25_assassin_ambush.webp")
        elif ep_num == 40:
            climax_art = (num_scenes, "/images/webtoon/ep40_eternal_shield.webp")

        last_active_chars = ep_chars_all[:2] if ep_chars_all else [{"cardId": 41, "ko": "카단", "en": "Kadan"}]

        new_images_list = []
        narr_json_scenes = []

        # Scene 0: Title Card
        title_card_entry = {
            "index": 0,
            "fileName": "scene_00.webp",
            "imageUrl": f"/images/webtoon/episode_{ep_pad}/scene_00.webp",
            "localArtUrl": f"/images/webtoon/episode_{ep_pad}/scene_00.webp",
            "type": "title_card",
            "narrationKo": f"SNS히어로 제{ep_num}화 - {title_ko}",
            "narrationEn": f"SNSHERO · EPISODE {ep_pad} - {title_en}",
            "characters": ep_char_names_en,
            "dialogues": [{
                "speakerKo": "내레이션",
                "speakerEn": "Narration",
                "textKo": f"SNS히어로 제{ep_num}화 - {title_ko}",
                "textEn": f"SNSHERO · EPISODE {ep_pad} - {title_en}",
                "bubbleType": "thought",
                "position": "center"
            }],
            "sfxCues": []
        }
        new_images_list.append(title_card_entry)

        # Scenes 1..num_scenes: 2-3 line narration cutscenes
        for idx in range(1, num_scenes + 1):
            narration_ko = ko_chunks[idx - 1]
            if len(narration_ko) > max_chunk_len_seen:
                max_chunk_len_seen = len(narration_ko)

            se, ee, panel_idx, sub_idx = cut_panel_sub[idx - 1]
            e_slice = [en_sents_with_panel[m][1] for m in range(se, ee)]
            narration_en = " ".join(e_slice).strip() if e_slice else title_en

            local_webp = f"/images/webtoon/episode_{ep_pad}/scene_{idx:02d}.webp"
            scene_quotes_ko = chunk_quotes_ko.get(idx - 1, [])
            scene_quotes_en = extract_english_quotes_from_text(narration_en)

            scene_chars = extract_chars_in_text(narration_ko)
            for _, sp in reversed(scene_quotes_ko):
                if sp:
                    scene_chars = [sp] + [c for c in scene_chars if c["en"] != sp["en"]]

            if scene_chars:
                last_active_chars = scene_chars[:3]
            else:
                scene_chars = last_active_chars

            dialogues = []
            if scene_quotes_ko:
                total_quoted_scenes += 1
                for q_i, (q_ko, sp) in enumerate(scene_quotes_ko):
                    q_en = scene_quotes_en[q_i] if q_i < len(scene_quotes_en) else narration_en
                    speaker_ko = sp["ko"] if sp else "내레이션"
                    speaker_en = sp["en"] if sp else "Narration"
                    card_id = sp["cardId"] if sp else scene_chars[0]["cardId"]
                    b_type = determine_bubble_type(q_ko)
                    pos = positions[(idx + q_i) % len(positions)]
                    dialogues.append({
                        "speakerKo": speaker_ko,
                        "speakerEn": speaker_en,
                        "textKo": narration_ko if len(scene_quotes_ko) == 1 else f"“{q_ko}”",
                        "textEn": narration_en if len(scene_quotes_ko) == 1 else f"“{q_en}”",
                        "bubbleType": b_type,
                        "position": pos,
                        "characterCardId": card_id
                    })
            else:
                total_narration_scenes += 1
                lead_char = scene_chars[0]
                pos = positions[(ep_num + idx) % len(positions)]
                dialogues.append({
                    "speakerKo": "내레이션",
                    "speakerEn": "Narration",
                    "textKo": narration_ko,
                    "textEn": narration_en,
                    "bubbleType": "thought",
                    "position": pos,
                    "characterCardId": lead_char["cardId"]
                })

            sfx_cues = determine_sfx(narration_ko, ep_num, idx)
            img_entry = {
                "index": idx,
                "panelIndex": panel_idx,
                "subIndex": sub_idx,
                "fileName": f"scene_{idx:02d}.webp",
                "imageUrl": local_webp,
                "localArtUrl": local_webp,
                "type": "scene",
                "narrationKo": narration_ko,
                "narrationEn": narration_en,
                "characters": [c["en"] for c in scene_chars[:4]],
                "background": infer_background_desc(narration_ko, ep_num),
                "dialogues": dialogues,
                "sfxCues": sfx_cues
            }
            if climax_art and climax_art[0] == idx:
                img_entry["localArtUrl"] = climax_art[1]
                img_entry["isKeyClimax"] = True

            new_images_list.append(img_entry)

            narr_json_scenes.append({
                "sceneNumber": idx,
                "imageFile": f"episode_{ep_pad}/scene_{idx:02d}.webp",
                "sourceImageFile": f"episode_{ep_pad}/scene_{idx:02d}.webp",
                "narrationEn": narration_en,
                "narrationKo": narration_ko,
                "sourceSentenceStart": idx,
                "sourceSentenceEnd": idx,
                "alignmentScore": 1.0,
                "dialogues": dialogues,
                "sfxCues": sfx_cues
            })

        ep_manifest["images"] = new_images_list
        manifest[str(ep_num)] = ep_manifest
        total_scenes_all += (num_scenes + 1)

        narr_json_path = NARRATIONS_DIR / f"episode_{ep_pad}_narrations.json"
        narr_payload = {
            "episodeNumber": ep_num,
            "episodeTitleEn": title_en,
            "episodeTitleKo": title_ko,
            "sourceSentenceCount": num_scenes,
            "sceneCount": num_scenes,
            "scenes": narr_json_scenes
        }
        narr_json_path.write_text(json.dumps(narr_payload, ensure_ascii=False, indent=2), encoding="utf-8")

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Successfully synchronized all 40 episodes into {total_scenes_all} total panels ({total_scenes_all - 40} story cutscenes; max chunk length = {max_chunk_len_seen} chars)!")

if __name__ == "__main__":
    main()
