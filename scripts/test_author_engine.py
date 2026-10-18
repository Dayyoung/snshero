import re

def verify_ep(title, ko, en, req_keywords, forbidden_speakers):
    errs = []
    # Length
    char_len = len(ko)
    if char_len < 3500:
        errs.append(f"Length {char_len} < 3500")
    if char_len > 4400:
        errs.append(f"Length {char_len} > 4400")
    
    # Dialogues
    dlgs = re.findall(r"[\"“][^\"”\n]+[\"”]", ko)
    if len(dlgs) < 8:
        errs.append(f"Dialogues {len(dlgs)} < 8")
        
    # Keywords
    for kw in req_keywords:
        if kw not in ko:
            errs.append(f"Missing keyword: {kw}")
            
    # Forbidden speakers
    for spk in forbidden_speakers:
        if f"{spk}:" in ko or f"{spk}이 말했다" in ko or f"{spk}가 말했다" in ko:
            errs.append(f"Forbidden speaker active: {spk}")
            
    # English
    if len(re.findall(r"[가-힣]", en)) > 0:
        errs.append("English contains Korean characters")
    if len(en) < 4500:
        errs.append(f"English len {len(en)} < 4500")
        
    print(f"[{title}] chars={char_len}, dlgs={len(dlgs)}, en_len={len(en)}, errs={len(errs)}")
    if errs:
        print("  Errors:", errs)
    return len(errs) == 0

print("Engine test ready.")
