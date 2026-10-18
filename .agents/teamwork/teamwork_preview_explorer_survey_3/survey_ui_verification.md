# Explorer 3 Survey: UI Readers, Cache & Verification Framework

- **Investigator**: Explorer 3 (UI Reader, Cache & Verification Specialist)
- **Target Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_3/`
- **Scope**: UI readers (`NovelView`, `WebtoonPanelCard`, `WebtoonSpeechBubble`, `WebtoonSfxOverlay`), movie players (`CinematicMoviePlayer`, `movieEpisodeMapping.ts`), webtoon manifests, CDN references, Service Worker cache rules, build & report environment, and automated verification suite design.
- **Date / Timestamp**: 2026-10-18T04:40:00Z
- **Baseline Git Commit**: `3f64397a` (`feat(art): regenerate all 110 characters with Gemini Nano Banana V2 and bust SW/browser media cache`)

---

## 1. UI Readers and Video Player Architecture Analysis

### 1.1 `src/views/NovelView.tsx` (Webtoon Cartoon Mode, Image Loading, Bubbles & SFX)
- **Role**: Primary reader interface supporting three tabs: `'novel'` (text reader), `'cartoon'` (webtoon viewer), and `'prompt'` (vibe prompt viewer).
- **Webtoon Display Modes** (Line 232, 1630–1750):
  - `'scroll'`: Continuous vertical webtoon strip rendering 21 panels per episode (1 title card `index: 0` + 20 story panels `index: 1..20`).
  - `'slides'`: Single-panel horizontal carousel mode with a full 21-button slide navigation header (`min-h-[44px] min-w-[44px]` touch targets) and Previous/Next buttons.
- **Image Resolution Mechanism** (`getCartoonSceneUrl`, Lines 245–260):
  ```typescript
  const getCartoonSceneUrl = (epNum: number, sceneIdx: number, attempt = 0): string => {
    const epData = WEBTOON_DATA[String(epNum)];
    const imgInfo = epData?.images?.find(img => img.index === sceneIdx);
    if (imgInfo) {
      if (attempt === 0 && imgInfo.localArtUrl) return imgInfo.localArtUrl;
      if (imgInfo.imageUrl) {
        if (attempt <= 1) return imgInfo.imageUrl;
        if (attempt === 2) return imgInfo.imageUrl.replace('.jpeg', '.jpg');
        if (attempt === 3) return imgInfo.imageUrl.replace('.jpeg', '.png');
      }
    }
    const epPad = pad2(epNum);
    const scPad = pad2(sceneIdx);
    const baseUrl = 'https://dayyoung.github.io/image/cartoon';
    return `${baseUrl}/episode_${epPad}/${scPad}.jpeg`;
  };
  ```
  - **Issue Identified**:
    1. Line 258 hardcodes external GitHub Pages CDN: `const baseUrl = 'https://dayyoung.github.io/image/cartoon';`.
    2. In `attempt > 0`, it defaults to `imgInfo.imageUrl` which currently contains `https://dayyoung.github.io/...`.
  - **Recommendation**:
    - Change line 258–259 to point directly to the local asset path:
      ```typescript
      return `/images/webtoon/episode_${epPad}/scene_${scPad}.webp`;
      ```
    - Prefer `imgInfo.localArtUrl || imgInfo.imageUrl || ...`.
- **Speech Bubbles & SFX Direction** (Lines 1652–1655, 1717–1720, 2195–2200):
  - Pass `dialogues` and `sfxCues` to `WebtoonPanelCard`.
  - Global toggle `showCartoonBubbles` (`[말풍선 ON / OFF]`) with keyboard/touch support.
  - Lightbox modal (Line 2174) mirrors speech bubbles and SFX overlays for full-screen immersive reading.
- **Climax Staging**:
  - `isKeyClimax`: Enhances panel border with `border-amber-600/50` and gold badge `[클라이맥스 명장면]`.

---

### 1.2 `src/components/webtoon/WebtoonPanelCard.tsx`
- **Role**: Renders an individual webtoon scene card with responsive image display, overlayed speech bubbles, interactive SFX typography, and narration caption box.
- **Image Resolution & Fallback Logic** (Lines 42–46, 100–107):
  ```typescript
  const [useLocalArtFailed, setUseLocalArtFailed] = useState(false);
  const resolvedSrc = (localArtUrl && !useLocalArtFailed) ? localArtUrl : imgUrl;
  ```
  - If `localArtUrl` fails to load, `useLocalArtFailed` toggles to `true` and falls back to `imgUrl`.
  - If all fail (`isFailedAll`, attempt > 10, Line 111–121): Renders a fallback character card panel using `getCardSpriteStyle(((episodeNumber * 5 + sceneIndex) % 110) + 1)` with black background and 1px border.
- **Audio Feedback**:
  - Triggers sound effects via `onPlaySfx()` when SFX badges or speech bubbles are clicked.
- **DESIGN.md Compliance**:
  - `font-mono`, `rounded-none` containers, `rounded-sm` badges/buttons, minimum 44px touch targets on zoom button (`min-h-[44px]`).

---

### 1.3 `src/components/webtoon/WebtoonSpeechBubble.tsx`
- **Role**: Structured comic speech bubble overlay supporting 4 dialogue types:
  1. `speech`: Normal dialogue (`bg-[#fdfcfc]/95`, border `#201d1d`).
  2. `shout`: Dramatic shout (`bg-[#201d1d]`, text `#fdfcfc`, 2px red border, bold).
  3. `thought`: Internal monologue (`bg-[#f8f7f7]/95`, dashed border, italic, trailing thought dots).
  4. `whisper`: Muted whisper (`text-[#646262]`, dotted border, 12px text).
- **Character Avatar Integration** (Lines 83–88):
  - When `characterCardId` is specified, renders an inline 16x16 sprite thumbnail using `getCardSpriteStyle(characterCardId)`.
- **Bilingual Support**: Dynamically switches `speakerName` and `bubbleText` based on `language === 'ko' ? textKo : textEn`.
- **Absolute Positioning**: Anchors at `top-left`, `top-right`, `bottom-left`, `bottom-right`, or `center`.

---

### 1.4 `src/components/webtoon/WebtoonSfxOverlay.tsx`
- **Role**: Dynamic onomatopoeia overlay matching high-fantasy comic typography.
- **Styles**:
  - `slash`: Red italic rotated -6°, blade slash feel.
  - `impact`: Amber bold rotated +3°, heavy strike feel.
  - `magic`: Cyan glow rotated -3°, arcane burst feel.
  - `rumble`: Stone gray rotated +2°, earthquake/collapse feel.
- **Interactive Audio**: Clicking the SFX overlay triggers `onTriggerSfx()` to play procedural or synthesized sound.

---

### 1.5 `src/components/movie/CinematicMoviePlayer.tsx`
- **Role**: In-app Generative Theatrical Film Player rendering 20 scenes per episode with Ken Burns multi-plane camera motion (`zoom-in`, `pan-left`, `zoom-out`, `pan-right`, `shake`), HTML5 particle VFX overlay (`snow`, `embers`, `runes`, `slash`, `fog`), synthesized battle SFX, Web Speech TTS narration, and bilingual subtitles.
- **Scene Generation Logic** (`generateEpisodeScenes`, Lines 83–170):
  ```typescript
  const epData = manifest[String(epNum)];
  ...
  return targetImages.slice(0, 20).map((img, idx) => ({
    sceneNumber: idx + 1,
    imageUrl: img.imageUrl, // <-- BUG: Does NOT check img.localArtUrl!
    narrationKo: textKo,
    narrationEn: textEn,
    ...
  }));
  ```
  - **Issues Identified**:
    1. Line 159 reads `imageUrl: img.imageUrl`. If manifest has `localArtUrl`, it is ignored here unless `imageUrl` is also updated to local path.
    2. Line 100 (fallback generation):
       `imageUrl: 'https://dayyoung.github.io/image/cartoon/episode_${String(epNum).padStart(2, '0')}/01_scene_${i + 1}.jpeg'`
    3. Line 494 (image onError fallback):
       `(e.target as HTMLImageElement).src = 'https://dayyoung.github.io/image/cartoon/episode_01/00_SNSHERO_Episode_01_title_card_202608311350.jpeg';`
  - **Recommendations**:
    - Change line 159 to:
      ```typescript
      imageUrl: img.localArtUrl || img.imageUrl || `/images/webtoon/episode_${String(epNum).padStart(2, '0')}/scene_${String(idx + 1).padStart(2, '0')}.webp`,
      ```
    - Update fallback lines 100 and 494 to point to local assets `/images/webtoon/episode_01/scene_00.webp` or `/cards1.png`.

---

### 1.6 `src/content/movieEpisodeMapping.ts` & `src/content/webtoonEpisodes.ts`
- **`movieEpisodeMapping.ts`**:
  - Full 40 episodes defined with titles, arcs, synopses, BGM themes, and default VFX.
  - Episodes 1–8 include YouTube stream IDs; episodes 9–40 seamlessly play in Cinematic Movie Player mode.
- **`webtoonEpisodes.ts`**:
  - Extracts panels from `webtoonEpisodeManifest.json`.
  - Line 78 fallback:
    `imageUrl: 'https://dayyoung.github.io/image/cartoon/episode_${pad}/00_SNSHERO_Episode_${pad}_title_card_202608311350.jpeg'`
  - Recommendation: Replace with `/images/webtoon/episode_${pad}/scene_00.webp`.

---

## 2. Image References & External CDN Audit

### 2.1 Complete Inventory of Hardcoded CDN URLs (`dayyoung.github.io`)
Across the entire repository, exactly 5 source code locations and 840 manifest entries reference `dayyoung.github.io`:

| File Path | Line | Existing Code | Recommended Replacement |
|---|---|---|---|
| `src/views/NovelView.tsx` | 258 | `const baseUrl = 'https://dayyoung.github.io/image/cartoon';` | `return '/images/webtoon/episode_' + epPad + '/scene_' + scPad + '.webp';` |
| `src/views/MobileCardPlayScreen.tsx` | 693 | `const fallbackImg = 'https://dayyoung.github.io/...';` | `const fallbackImg = '/images/webtoon/episode_' + pad + '/scene_00.webp';` |
| `src/content/webtoonEpisodes.ts` | 78 | `imageUrl: 'https://dayyoung.github.io/...';` | `imageUrl: '/images/webtoon/episode_' + pad + '/scene_00.webp';` |
| `src/components/movie/CinematicMoviePlayer.tsx` | 100 | `imageUrl: 'https://dayyoung.github.io/...';` | `imageUrl: '/images/webtoon/episode_' + epPad + '/scene_' + scPad + '.webp';` |
| `src/components/movie/CinematicMoviePlayer.tsx` | 494 | `(e.target).src = 'https://dayyoung.github.io/...';` | `(e.target).src = '/images/webtoon/episode_01/scene_00.webp';` |
| `src/content/webtoonEpisodeManifest.json` | 840 lines | `"imageUrl": "https://dayyoung.github.io/..."` | `"imageUrl": "/images/webtoon/episode_XX/scene_YY.webp"`, `"localArtUrl": "/images/webtoon/episode_XX/scene_YY.webp"` |

### 2.2 Local Asset Directory Architecture
- Physical disk location: `public/images/webtoon/episode_{01..40}/scene_{00..20}.webp`
- Web browser resolution: `/images/webtoon/episode_{01..40}/scene_{00..20}.webp`
- Structure:
  - 40 episode directories (`episode_01` to `episode_40`)
  - 21 WebP scene files per episode (`scene_00.webp` title card, `scene_01.webp` through `scene_20.webp` story scenes)
  - Total files: 840 images.

---

## 3. Service Worker Caching & Cache Invalidation Audit (`public/sw.js`)

### 3.1 Current Architecture
- Cache Name: `const MEDIA_CACHE_NAME = 'snshero-media-v3-banana2026';` (Line 7)
- Caching Strategy (Lines 43–64):
  - **Cache-First** for all media files matching:
    `/\.(png|jpg|jpeg|webp|gif|svg|ico|avif|mp3|wav|ogg)(\?.*)?$/i`
  - HTML, JS, CSS, JSON are **Network Pass-through** (not cached by SW, fetched fresh).
- Cache Invalidation (Lines 18–31):
  ```javascript
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== MEDIA_CACHE_NAME) {
              console.log('[SW] Deleting stale non-media cache:', key);
              return caches.delete(key);
            }
          })
        );
      }).then(() => self.clients.claim())
    );
  });
  ```

### 3.2 Invalidation Imperative
Because `sw.js` uses Cache-First for WebP/JPEG, browsers that previously loaded any scenes or placeholders will NEVER fetch the new images unless:
1. `MEDIA_CACHE_NAME` is bumped from `'snshero-media-v3-banana2026'` to `'snshero-media-v4-webtoon2026'`!
2. When bumped, the SW activation lifecycle executes `caches.delete(key)` on all older caches, purging stale assets instantly without requiring query string parameters.

---

## 4. Build and Validation Environment Assessment

### 4.1 Scripts in `package.json`
- `"lint": "node -e \"process.exit(0)\""` -> Exits 0 cleanly.
- `npx tsc --noEmit` -> Tested and verified: **0 TypeScript errors (Exit Code 0)**.
- `"build": "vite build && node scripts/post-build.js"` -> Tested and verified: **Vite 6 build completes in 15.19s, generating 52 static SPA pages, news SEO, sitemap (Exit Code 0)**.

### 4.2 `WORK_LOGS.md` Format Standards
Confirmed from lines 1–60:
```markdown
## [YYYY-MM-DD HH:MM KST] [작업 카테고리/단계] 제목
- **작업명**: `...`
- **담당자**: ...
- **최종 판정**: ...
- **주요 수행 내역** / **주요 감사 및 독립 검증 결과**:
  1. ...
  2. ...
```

### 4.3 Report Submission Utility
- Script: `skills/report-ex/scripts/submit_report.py`
- Command format:
  ```bash
  python3 skills/report-ex/scripts/submit_report.py --dept "개발" --task "[작업명]" --status "작업완료" --details "[상세 검증 결과]"
  ```
- Submits directly to Google Form `https://docs.google.com/forms/d/e/1FAIpQLScrvcAqDF7vHHQndycr90ii-ujTi3Plw23eNrSyiJpOLrHbjg/formResponse` which syncs into Google Sheet `1nX6BFBJR4fTrv3PMqG8UamwSbqY2tJt_VvJoGAPItu8`.

---

## 5. Automated Verification Suite Design & Acceptance Checks

We have created an automated test runner at:
`/Users/dayyoung/project/snshero/.agents/teamwork/teamwork_preview_explorer_survey_3/verify_webtoon_assets.py`

### 5.1 Verification Checklist & Criteria

| Check # | Category | Criterion | Baseline Status | Target Status |
|---|---|---|---|---|
| **C1** | Character Asset Non-Regression | `git diff 3f64397a` on `public/seat/*.png` (110 files), 4 master sheets, 11 faction sheets yields 0 diff | **PASS (100% match)** | **PASS** |
| **C2** | 840 Files Existence | All 40 episodes × 21 scenes (`public/images/webtoon/episode_XX/scene_YY.webp`) exist on disk | FAIL (0/840 exist) | **PASS (840/840 exist)** |
| **C3** | 840 Distinct Hashes | SHA-256 hash calculated for each of the 840 files; zero duplicates, zero blank files | FAIL | **PASS (840 unique hashes)** |
| **C4** | File Size Budget | Each file between 4,096 B (4 KB) and 76,800 B (75 KB); average 25–55 KB; ep total < 1.2 MB | FAIL | **PASS (100% in bounds)** |
| **C5** | Manifest Alignment | `webtoonEpisodeManifest.json` has 40 episodes × 21 scenes; all `imageUrl`/`localArtUrl` resolve locally | FAIL (840 CDN URLs) | **PASS (0 CDN, 840 local)** |
| **C6** | UI Readers CDN Removal | 0 occurrences of `dayyoung.github.io` in `NovelView.tsx`, `MobileCardPlayScreen.tsx`, `webtoonEpisodes.ts`, `CinematicMoviePlayer.tsx` | FAIL (5 occurrences) | **PASS (0 occurrences)** |
| **C7** | SW Cache Version | `public/sw.js` bumped from `v3` to `v4` (`snshero-media-v4-webtoon2026`) | FAIL (`v3`) | **PASS (`v4`)** |
| **C8** | TypeScript Typecheck | `npx tsc --noEmit` succeeds with 0 errors | **PASS (0 errors)** | **PASS (0 errors)** |
| **C9** | Production Build | `npm run build` succeeds with 0 bundling errors | **PASS (15.19s)** | **PASS (Exit 0)** |

---

## 6. Synthesis and Execution Roadmap for Subsequent Agents

1. **Image Generation & Assembly Workers**:
   - Synthesize 840 scene panels using the 16 background plates (`/tmp/webtoon_bg_plates/bg_01.jpg`..`bg_16.jpg`) and remastered character portraits (`public/seat/*.png`).
   - Save to `public/images/webtoon/episode_{01..40}/scene_{00..20}.webp`.
   - Apply Pillow / WebP quality compression (target 75–85 quality) to ensure all file sizes stay within `[4,096, 76,800]` bytes.
2. **Manifest & UI Implementer**:
   - Update `src/content/webtoonEpisodeManifest.json`: set `imageUrl` and `localArtUrl` to `/images/webtoon/episode_XX/scene_YY.webp`.
   - Update `src/views/NovelView.tsx:258`, `src/views/MobileCardPlayScreen.tsx:693`, `src/content/webtoonEpisodes.ts:78`, `src/components/movie/CinematicMoviePlayer.tsx:100,159,494`.
   - Bump `public/sw.js` cache name to `snshero-media-v4-webtoon2026`.
3. **Tester & Verifier**:
   - Run `python3 .agents/teamwork/teamwork_preview_explorer_survey_3/verify_webtoon_assets.py` to confirm all 9 acceptance checks pass with 100%.
   - Run `npx tsc --noEmit` and `npm run build`.
   - Update `WORK_LOGS.md` and submit Google Form report via `submit_report.py`.
