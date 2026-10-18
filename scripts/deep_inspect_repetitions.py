#!/usr/bin/env python3
"""
scripts/deep_inspect_repetitions.py
Empirically scans all 40 episodes for identical sentence and dialogue repetitions across episodes.
"""

import os
import re
from collections import defaultdict

BOOK_DIR = os.path.abspath("public/book")

def main():
    dialogues_map = defaultdict(list) # dialogue_text -> [episode_nums]
    sentences_map = defaultdict(list) # sentence_text -> [episode_nums]

    for ep in range(1, 41):
        ep_pad = f"{ep:02d}"
        file_path = os.path.join(BOOK_DIR, f"episode_{ep_pad}.md")
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()

        lines = [l.strip() for l in text.split("\n") if l.strip()]
        for line in lines:
            if line.startswith("“") or line.startswith('"') or ("“" in line and "”" in line):
                cleaned = line.strip("“\"”' ").strip()
                if len(cleaned) > 10:
                    dialogues_map[cleaned].append(ep)

        # Sentences
        sentences = re.split(r"(?<=[.!?])\s+", text)
        for s in sentences:
            s_clean = s.strip()
            if len(s_clean) > 15:
                sentences_map[s_clean].append(ep)

    print("=== DIALOGUES REPEATED IN >= 3 EPISODES ===")
    repeated_dlgs = [(d, eps) for d, eps in dialogues_map.items() if len(set(eps)) >= 3]
    repeated_dlgs.sort(key=lambda x: len(set(x[1])), reverse=True)
    for d, eps in repeated_dlgs:
        print(f"[{len(set(eps))} eps: {sorted(list(set(eps)))}] {d[:80]}")

    print("\n=== SENTENCES REPEATED IN >= 3 EPISODES ===")
    repeated_sents = [(s, eps) for s, eps in sentences_map.items() if len(set(eps)) >= 3]
    repeated_sents.sort(key=lambda x: len(set(x[1])), reverse=True)
    for s, eps in repeated_sents[:25]:
        print(f"[{len(set(eps))} eps: {sorted(list(set(eps)))}] {s[:80]}")

if __name__ == "__main__":
    main()
