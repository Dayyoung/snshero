# E2E Test Suite Ready: SNSHero 40-Episode Webtoon Remake

## Test Runner
- Command: `python3 /Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_3/verify_webtoon_assets.py`
- Build Commands: `npx tsc --noEmit` and `npm run build`
- Expected: all tests pass with exit code 0

## Coverage Summary
| Tier | Count | Description |
|------|------:|-------------|
| 1. Feature Coverage | 40 eps × 21 scenes = 840 | All 840 local WebP panel files exist in `public/images/webtoon/episode_01/` ~ `episode_40/` |
| 2. Boundary & Corner | 840 files | File size within [4,096 B, 76,800 B], 800x450 px, WebP header valid, 840 distinct SHA-256 hashes |
| 3. Cross-Feature Combinations | 840 scenes | Manifest alignment (`localArtUrl` & `imageUrl` local), 820 dialogues with `characterCardId` (1–110), 0 CDN |
| 4. Real-World Application Scenarios | UI readers & SW | `NovelView.tsx`, `MobileCardPlayScreen.tsx`, `CinematicMoviePlayer.tsx` 0 CDN hits, `sw.js` v4 bump |
| **Total** | **840 scenes + UI** | 100% Local, Zero External CDN, 0 Regressions |

## Feature Checklist
| Feature | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---------|:------:|:------:|:------:|:------:|
| Webtoon Panel Assets (840) | 840 | 840 | ✓ | ✓ |
| WebP Size Budget (4KB-75KB) | ✓ | 840 | ✓ | ✓ |
| Unique Hashes (840 distinct) | ✓ | 840 | ✓ | ✓ |
| Character Badges (820 dialogues) | ✓ | ✓ | 820 | ✓ |
| Manifest Synchronization | 40 eps | 840 | ✓ | ✓ |
| External CDN Removal (0 hits) | ✓ | ✓ | ✓ | ✓ |
| Service Worker Cache v4 Bump | ✓ | ✓ | ✓ | ✓ |
| Character Asset Non-Regression vs 3f64397a | ✓ | ✓ | ✓ | ✓ |
| TypeScript & Production Build | ✓ | ✓ | ✓ | ✓ |
