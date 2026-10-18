#!/usr/bin/env python3
import json
import sys
import os
import re

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from chapters_1_15 import CHAPTERS_1_15
from chapters_16_30 import CHAPTERS_16_30
from chapters_31_40 import CHAPTERS_31_40

all_chapters = CHAPTERS_1_15 + CHAPTERS_16_30 + CHAPTERS_31_40

print(f"Total chapters collected: {len(all_chapters)}")
assert len(all_chapters) == 40, f"Expected 40 chapters, got {len(all_chapters)}"

# Verify chapter numbers 1 to 40
ch_numbers = [ch[0] for ch in all_chapters]
assert ch_numbers == list(range(1, 41)), f"Chapter numbers mismatch: {ch_numbers}"

# Build the typescript content
ts_output = """/**
 * Canonical 40-Episode Webnovel Scripts & Interactive Choices for SNSHero RPG Mode (/main)
 * Synchronized with:
 * - English/Korean 40-Episode Novel Mapping (englishNovelMapping.ts)
 * - Public Webnovel Book Index (public/book/index.json)
 * - Story Encounters & Regions (kadanRpgStory.ts)
 */

export interface KadanRpgDialogueChoice {
  id: string;
  attitude: '[결의/돌파]' | '[신중/통찰]' | '[성진호흡/공명]';
  attitudeEn: string;
  labelKo: string;
  labelEn: string;
  followUpTextKo: string;
  followUpTextEn: string;
  bonusType: 'sns' | 'buff' | 'item';
  bonusValue: number;
  bonusDescKo: string;
  bonusDescEn: string;
  isDefault?: boolean;
  // UI and backwards compatibility convenience aliases
  badge?: string;
  badgeEn?: string;
  text?: string;
  textEn?: string;
  reward?: {
    snsCoins?: number;
    buff?: string;
    buffName?: string;
    buffNameEn?: string;
  };
  followUpLine?: string;
  followUpLineEn?: string;
}

export interface KadanRpgNovelScriptLine {
  speaker: 'narrator' | 'quote' | 'kadan' | 'speaker' | 'choice';
  name: string;
  nameEn?: string;
  text: string;
  textEn?: string;
  cardId?: number;
  choices?: KadanRpgDialogueChoice[];
}

export const KADAN_RPG_NOVEL_SCRIPTS: Record<number, KadanRpgNovelScriptLine[]> = {
"""

# Regex to unquote standard TS object keys
unquote_key_regex = re.compile(r'"([a-zA-Z0-9_]+)":\s*')

for ch_num, lines in all_chapters:
    ts_output += f"  {ch_num}: [\n"
    for line in lines:
        line_json = json.dumps(line, ensure_ascii=False, indent=4)
        # Convert "key": to key:
        line_ts = unquote_key_regex.sub(r'\1: ', line_json)
        # Indent line_ts by 4 spaces
        indented = "\n".join("    " + l for l in line_ts.split("\n"))
        ts_output += f"{indented},\n"
    ts_output += "  ],\n"

ts_output += "};\n"

target_file = "/Users/dayyoung/project/snshero/src/content/kadanRpgNovelScript.ts"
with open(target_file, "w", encoding="utf-8") as f:
    f.write(ts_output)

print(f"Successfully wrote {len(ts_output)} bytes to {target_file}")
