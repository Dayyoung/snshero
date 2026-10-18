#!/usr/bin/env python3
"""Refactor all 620 components to 100% DESIGN.md Terminal-Flat compliance.
"""

import os
import re
import glob

TOUCH_44PX_TOKENS = (
    "min-h-[44px]", "min-h-[46px]", "min-h-[48px]", "min-h-[50px]", "min-h-[52px]",
    "min-h-[56px]", "min-h-[60px]", "min-h-[64px]", "min-h-[70px]", "min-h-[80px]",
    "min-h-11", "min-h-12", "min-h-14", "min-h-16", "min-h-20", "min-h-24", "min-h-28",
    "min-h-32", "min-h-36", "h-11", "h-12", "h-14", "h-16", "h-20", "h-24",
    "h-[44px]", "h-[48px]", "h-[50px]", "h-[56px]", "h-[64px]",
    "py-3", "py-3.5", "py-4", "py-5", "py-6", "p-3", "p-3.5", "p-4", "p-5",
)

def has_touch_44px(class_str: str) -> bool:
    return any(tok in class_str for tok in TOUCH_44PX_TOKENS)

def refactor_content(content: str, filename: str) -> str:
    # 1. Clean typography
    content = re.sub(r"\bfont-sans\b", "font-mono", content)
    content = re.sub(r"\bfont-serif\b", "font-mono", content)

    # 2. Clean animations
    content = re.sub(r"\banimate-ping\b", "transition-opacity duration-300", content)
    content = re.sub(r"\banimate-bounce\b", "transition-transform duration-300", content)

    # 3. Clean shadows
    content = re.sub(r"\bshadow-(?:md|lg|xl|2xl)\b", "shadow-none", content)
    content = re.sub(r"\bshadow-[a-z0-9_-]+/[0-9.]+\b", "shadow-none", content)

    # 4. Clean gradients: replace bg-gradient-to-* with solid flat surface
    content = re.sub(r"\bbg-gradient-to-[a-z]+\b", "bg-[#201d1d]", content)
    content = re.sub(r"\bfrom-[a-z0-9_-]+(/[0-9.]+)?\b", "", content)
    content = re.sub(r"\bvia-[a-z0-9_-]+(/[0-9.]+)?\b", "", content)
    content = re.sub(r"\bto-[a-z0-9_-]+(/[0-9.]+)?\b", "", content)

    # 5. Border radius and 44px+ on buttons
    pattern = re.compile(r"<button\b")
    pos = 0
    new_pieces = []

    while True:
        m = pattern.search(content, pos)
        if not m:
            new_pieces.append(content[pos:])
            break
        
        new_pieces.append(content[pos:m.start()])
        start_idx = m.start()
        i = m.end()
        brace_depth = 0
        in_str = None
        escaped = False

        while i < len(content):
            ch = content[i]
            if in_str:
                if ch == "\\" and not escaped:
                    escaped = True
                elif ch == in_str and not escaped:
                    in_str = None
                else:
                    escaped = False
            else:
                if ch in ('"', "'", "`"):
                    in_str = ch
                elif ch == "{":
                    brace_depth += 1
                elif ch == "}":
                    if brace_depth > 0:
                        brace_depth -= 1
                elif ch == ">" and brace_depth == 0:
                    break
            i += 1

        btn_tag = content[start_idx : i + 1]
        pos = i + 1

        # Replace rounded in button
        btn_tag = re.sub(r"\brounded-(?:lg|xl|2xl|3xl|full)\b", "rounded-sm", btn_tag)

        # Check if button has 44px
        if not has_touch_44px(btn_tag):
            # If it has sub-44px height like h-6, h-7, h-8, h-9, h-10, change it to min-h-[44px]
            btn_tag = re.sub(r"\b(?:h-6|h-7|h-8|h-9|h-10)\b", "min-h-[44px]", btn_tag)
            btn_tag = re.sub(r"\bmin-h-\[(?:24|28|30|32|36|38|40)px\]\b", "min-h-[44px]", btn_tag)

            if not has_touch_44px(btn_tag):
                if 'className="' in btn_tag:
                    btn_tag = btn_tag.replace('className="', 'className="min-h-[44px] ')
                elif "className='" in btn_tag:
                    btn_tag = btn_tag.replace("className='", "className='min-h-[44px] ")
                elif 'className={`' in btn_tag:
                    btn_tag = btn_tag.replace('className={`', 'className={`min-h-[44px] ')
                elif 'className={cn(' in btn_tag:
                    btn_tag = btn_tag.replace('className={cn(', 'className={cn("min-h-[44px]", ')
                elif 'className={' in btn_tag:
                    btn_tag = btn_tag.replace('className={', 'className={"min-h-[44px] " + ')
                else:
                    btn_tag = btn_tag[:-1] + ' className="min-h-[44px]">'

        new_pieces.append(btn_tag)

    content = "".join(new_pieces)

    # 6. For remaining rounded-lg/xl/2xl/3xl in non-buttons:
    # If input or span/badge: rounded-sm
    content = re.sub(r"(<(?:input|textarea|select)\b[^>]*)\brounded-(?:lg|xl|2xl|3xl|full)\b", r"\1rounded-sm", content)
    # Remaining rounded-lg, xl, 2xl, 3xl, full
    content = re.sub(r"\brounded-(?:lg|xl|2xl|3xl)\b", "rounded-none", content)

    # Clean double spaces in className
    content = re.sub(r'  +', ' ', content)

    return content

def main():
    components = sorted(glob.glob("src/components/**/*.tsx", recursive=True))
    print(f"Refactoring {len(components)} components...")

    updated_count = 0
    for c in components:
        orig = open(c, "r", encoding="utf-8").read()
        updated = refactor_content(orig, c)
        if orig != updated:
            with open(c, "w", encoding="utf-8") as f:
                f.write(updated)
            updated_count += 1

    print(f"Refactored {updated_count} / {len(components)} components.")

if __name__ == "__main__":
    main()
