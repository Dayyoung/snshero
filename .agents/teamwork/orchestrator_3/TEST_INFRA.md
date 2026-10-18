# E2E Test Infra: SNSHero 40-Episode Webtoon Remake

## Test Philosophy
- Opaque-box, requirement-driven.
- Automated validation of all 840 webtoon scene assets, manifest synchronization, UI reader local routing, service worker cache invalidation, character asset non-regression, and build integrity.

## Feature Inventory & Test Coverage
| # | Feature | Requirement | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|-------------|:------:|:------:|:------:|:------:|
| 1 | 840 Scene Panels Existence | ORIGINAL_REQUEST §R1 | 40 eps × 21 scenes | Missing files test | Path formatting | Full folder traversal |
| 2 | Image Decode & Format | ORIGINAL_REQUEST §R1 | WebP valid header | Zero corrupted files | 800x450 dimensions | Visual rendering decode |
| 3 | Unique Hashes | ORIGINAL_REQUEST §R1 | 840 distinct SHA-256 | Zero duplicate hashes | Zero blank images | Entropy check |
| 4 | File Size Budget | ORIGINAL_REQUEST §R3 | 4,096 B <= size <= 76,800 B | Lower boundary (4KB) | Upper boundary (75KB) | Mean 25–55KB budget |
| 5 | Manifest Sync | ORIGINAL_REQUEST §R2 | 40 episodes in manifest | 21 scenes per episode | Local URLs only | Zero CDN URLs |
| 6 | Dialogue & Character Badges | ORIGINAL_REQUEST §R2 | Speakers mapped to 110 heroes | characterCardId valid | Non-empty narration | SFX cues check |
| 7 | UI CDN Removal | ORIGINAL_REQUEST §R2 | NovelView local paths | MoviePlayer local paths | MobileCardPlayScreen | Zero external dayyoung.github.io |
| 8 | Service Worker Cache | ORIGINAL_REQUEST §R3 | sw.js cache name bump | Media cache v4 | Cache invalidation logic | Offline readiness |
| 9 | 110 Hero Asset Non-Regression | ORIGINAL_REQUEST §R4 | public/seat/*.png intact | Master sprite sheets intact | Faction sheets intact | git diff 3f64397a empty |
| 10 | Typecheck & Build | ORIGINAL_REQUEST §R4 | tsc --noEmit 0 errors | npm run build exit 0 | 52 SPA routes | Zero bundle warnings |

## Test Architecture
- Test Runner: `/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_3/verify_webtoon_assets.py`
- Invocation: `python3 .agents/teamwork/teamwork_preview_explorer_survey_3/verify_webtoon_assets.py`
- Pass/Fail semantics: Exit 0 = All checks pass; Exit 1 = Any check fails with detailed failure report.
