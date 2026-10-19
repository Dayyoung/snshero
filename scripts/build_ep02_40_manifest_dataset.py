import json
import re
from pathlib import Path

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MANIFEST_PATH = PROJECT_ROOT / "src/content/webtoonEpisodeManifest.json"
MOVIE_MAPPING_PATH = PROJECT_ROOT / "src/content/movieEpisodeMapping.ts"

with open(MANIFEST_PATH) as f:
    webtoon_manifest = json.load(f)

with open(MOVIE_MAPPING_PATH) as f:
    movie_text = f.read()

movie_meta = {}
for m in re.finditer(r'(\d+):\s*\{\s*episodeNumber:\s*(\d+),\s*titleKo:\s*\"([^\"]+)\",\s*titleJa:[^,]+,\s*titleEn:\s*\"([^\"]+)\",.*?arc:\s*\"([^\"]+)\",\s*arcEn:\s*\"([^\"]+)\",\s*synopsisKo:\s*\"([^\"]+)\",\s*synopsisEn:\s*\"([^\"]+)\",', movie_text, re.DOTALL):
    ep = int(m.group(1))
    movie_meta[ep] = {
        'ep': ep,
        'titleKo': m.group(3),
        'titleEn': m.group(4),
        'arc': m.group(5),
        'arcEn': m.group(6),
        'synopsisKo': m.group(7),
        'synopsisEn': m.group(8),
    }

# Load character specs
from generate_survey_manifest_ep02_40 import CHAR_DB

all_episodes = {}

for ep_num in range(2, 41):
    ep_key = str(ep_num)
    w_data = webtoon_manifest.get(ep_key, {})
    m_data = movie_meta.get(ep_num, {})
    
    title_en = m_data.get('titleEn') or w_data.get('episodeTitle')
    title_ko = m_data.get('titleKo') or w_data.get('episodeTitleKo')
    arc_en = m_data.get('arcEn', 'Act I: Vows in the Blizzard & Birth of Fate')
    synopsis_en = m_data.get('synopsisEn', '')
    synopsis_ko = m_data.get('synopsisKo', '')
    
    # Extract scenes
    scenes = [img for img in w_data.get('images', []) if img.get('type') != 'title_card']
    n_scenes = len(scenes)
    
    # Collect characters
    ep_chars = []
    for sc in scenes:
        for c in sc.get('characters', []):
            if c in CHAR_DB and c not in ep_chars:
                ep_chars.append(c)
    
    # If some episodes have few named characters, add key protagonist or antagonist if appropriate
    if 'Kadan' not in ep_chars and ep_num >= 4:
        ep_chars.insert(0, 'Kadan')
    
    # Partition into 8 sequences
    seg_size = n_scenes / 8.0
    sequences = []
    for s_i in range(8):
        st = int(round(s_i * seg_size))
        en = int(round((s_i + 1) * seg_size))
        seg_scenes = scenes[st:en]
        
        # Extract narration lines
        lines = []
        seg_chars = []
        for sc in seg_scenes:
            for c in sc.get('characters', []):
                if c in CHAR_DB and c not in seg_chars:
                    seg_chars.append(c)
            narr = sc.get('narrationEn', '').strip()
            if narr and narr not in lines:
                lines.append(narr)
        
        combined_text = ' '.join(lines)
        # Clean quotes and clean text
        clean_text = re.sub(r'\"+', '', combined_text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        
        # Take first 2-3 sentences or up to ~300 chars for punchy narration script
        sentences = re.split(r'(?<=[.!?])\s+', clean_text)
        script_sentences = sentences[:3]
        narration_script = ' '.join(script_sentences)
        if len(narration_script) > 380:
            narration_script = narration_script[:370].rsplit('.', 1)[0] + '.'
        
        sequences.append({
            'seq': s_i + 1,
            'characters': seg_chars if seg_chars else ep_chars[:3],
            'narration_script': narration_script,
            'source_scenes_count': len(seg_scenes)
        })
        
    all_episodes[ep_num] = {
        'episodeNumber': ep_num,
        'titleEn': title_en,
        'titleKo': title_ko,
        'arcEn': arc_en,
        'synopsisEn': synopsis_en,
        'synopsisKo': synopsis_ko,
        'featuredCharacters': ep_chars,
        'sequences': sequences,
        'openingTitleCard': {
            'header': 'SNSHERO ORIGINAL LIVE-ACTION CINEMA',
            'episode': f'EPISODE {ep_num:02d}',
            'title': title_en.upper(),
            'act': arc_en.upper(),
            'durationSec': 4.0,
            'textLanguage': 'English Only (Zero Korean, Zero Subtitles)'
        }
    }

print(f"Built manifest dataset for {len(all_episodes)} episodes (02 to 40).")
with open('/tmp/all_episodes_survey_02_40.json', 'w') as f:
    json.dump(all_episodes, f, indent=2, ensure_ascii=False)
print("Saved to /tmp/all_episodes_survey_02_40.json")
