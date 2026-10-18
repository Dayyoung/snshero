#!/usr/bin/env python3
"""
scripts/audit_literary_quality.py
Empirical Challenger Agent-as-Judge Literary Quality & Metric Audit
Analyzes all 40 episodes and specifically audits the 9 designated sample episodes:
  Early: Ep 01, Ep 04, Ep 08
  Mid:   Ep 12, Ep 18, Ep 25
  Late:  Ep 29, Ep 35, Ep 40
"""

import os
import re
import sys
import json
from collections import Counter

BOOK_DIR = os.path.abspath("public/book")

SAMPLE_EPS = [1, 4, 8, 12, 18, 25, 29, 35, 40]

AI_CLICHES = [
    r"있었다\.",
    r"것이었다\.",
    r"않았다\.",
    r"수 있었다\.",
    r"기 시작했다\.",
    r"때문이었다\.",
    r"상황이었다\.",
    r"모습이었다\.",
    r"셈이었다\.",
]

def analyze_episode(ep_num):
    ep_pad = f"{ep_num:02d}"
    file_path = os.path.join(BOOK_DIR, f"episode_{ep_pad}.md")
    if not os.path.exists(file_path):
        return {"error": f"File {file_path} not found"}

    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    char_count = len(text)
    char_count_no_ws = len(re.sub(r"\s+", "", text))
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    # Extract dialogues: lines starting with quotation mark or containing quotes
    dialogue_lines = [
        l for l in lines 
        if (l.startswith("“") or l.startswith('"') or ("“" in l and "”" in l) or ('"' in l and l.count('"') >= 2))
    ]

    # Sentence endings analysis
    sentences = re.split(r"(?<=[.!?])\s+", text)
    total_sentences = len(sentences)
    
    cliche_counts = {}
    for pat in AI_CLICHES:
        matches = re.findall(pat, text)
        cliche_counts[pat.replace(r"\.", ".")] = len(matches)

    total_cliches = sum(cliche_counts.values())
    cliche_ratio = (total_cliches / total_sentences * 100) if total_sentences else 0

    # Race & Worldbuilding keywords check (11 races: 인간, 엘프, 드워프, 오크, 용족/드래곤, 언데드, 정령, 야수/수인, 천사/천족, 악마/마족, 거인)
    races = ["인간", "엘프", "드워프", "오크", "용", "드래곤", "언데드", "정령", "수인", "야수", "천족", "천사", "마족", "악마", "거인"]
    found_races = [r for r in races if r in text]

    # Check cliffhanger markers at end of chapter (last 3 paragraphs)
    last_paragraphs = "\n".join(lines[-3:]) if len(lines) >= 3 else text

    return {
        "episode": ep_num,
        "pad": ep_pad,
        "char_count": char_count,
        "char_count_no_ws": char_count_no_ws,
        "dialogue_count": len(dialogue_lines),
        "total_lines": len(lines),
        "total_sentences": total_sentences,
        "cliche_counts": cliche_counts,
        "total_cliches": total_cliches,
        "cliche_ratio_pct": round(cliche_ratio, 2),
        "found_races": found_races,
        "dialogue_samples": dialogue_lines[:4],
        "ending_snippet": last_paragraphs[-300:],
    }

def main():
    print("=================================================================")
    print(" Agent-as-Judge Empirical Literary Quality & Metric Audit ")
    print("=================================================================")

    all_stats = []
    failed_char_req = []
    failed_dlg_req = []

    for ep in range(1, 41):
        stat = analyze_episode(ep)
        if "error" in stat:
            print(f"Error in Ep {ep}: {stat['error']}")
            continue
        all_stats.append(stat)
        if stat["char_count"] < 3500:
            failed_char_req.append((ep, stat["char_count"]))
        if stat["dialogue_count"] < 8:
            failed_dlg_req.append((ep, stat["dialogue_count"]))

    print(f"\n1. Overall 40-Episode Metric Summary:")
    print(f"  - Total Audited: {len(all_stats)}/40 episodes")
    print(f"  - Chars < 3,500: {len(failed_char_req)} episodes (Failed: {failed_char_req})")
    print(f"  - Dialogues < 8: {len(failed_dlg_req)} episodes (Failed: {failed_dlg_req})")
    
    char_lens = [s["char_count"] for s in all_stats]
    dlg_counts = [s["dialogue_count"] for s in all_stats]
    cliche_ratios = [s["cliche_ratio_pct"] for s in all_stats]

    print(f"  - Characters: Min={min(char_lens)}, Max={max(char_lens)}, Avg={sum(char_lens)/len(char_lens):.1f}")
    print(f"  - Dialogues:  Min={min(dlg_counts)}, Max={max(dlg_counts)}, Avg={sum(dlg_counts)/len(dlg_counts):.1f}")
    print(f"  - Cliché Ending Ratio (% of sentences): Min={min(cliche_ratios)}%, Max={max(cliche_ratios)}%, Avg={sum(cliche_ratios)/len(cliche_ratios):.1f}%")

    print("\n2. Detailed Sample Episodes Audit:")
    for ep in SAMPLE_EPS:
        s = next(x for x in all_stats if x["episode"] == ep)
        arc = "Early Arc" if ep <= 10 else ("Mid Arc" if ep <= 25 else "Late Arc")
        print(f"\n--- [Episode {s['pad']}] ({arc}) ---")
        print(f"  Chars: {s['char_count']} (No-whitespace: {s['char_count_no_ws']}) | Dialogues: {s['dialogue_count']} lines")
        print(f"  Sentences: {s['total_sentences']} | Cliché Count: {s['total_cliches']} ({s['cliche_ratio_pct']}%)")
        print(f"  Races mentioned: {', '.join(s['found_races'])}")
        print("  Sample Dialogues:")
        for d in s["dialogue_samples"][:2]:
            print(f"    • {d[:90]}")
        print("  Ending Snippet:")
        print(f"    {s['ending_snippet'][:180].replace(chr(10), ' ')}...")

if __name__ == "__main__":
    main()
