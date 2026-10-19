import json
import re
from pathlib import Path

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
MANIFEST_PATH = PROJECT_ROOT / "src/content/webtoonEpisodeManifest.json"
MOVIE_MAPPING_PATH = PROJECT_ROOT / "src/content/movieEpisodeMapping.ts"

with open(MANIFEST_PATH) as f:
    manifest = json.load(f)

with open(MOVIE_MAPPING_PATH) as f:
    movie_text = f.read()

# Extract movie meta
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

print(f"Loaded movie meta for {len(movie_meta)} episodes.")
