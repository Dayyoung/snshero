# SNSHero Webtoon Implementation, Generative Art & Comic Direction Comprehensive Survey Report

**Author**: survey_explorer_2 (Webtoon & Generative Art Explorer)  
**Date**: 2026-10-18  
**Scope**: Read-only investigation of Webtoon architecture, viewer UI (`NovelView.tsx`), manifests, narration datasets, local & remote image assets, generative AI capabilities, gap analysis against R2, and technical recommendations.

---

## 1. Executive Summary

This report delivers a thorough, evidence-based survey of the current Webtoon implementation in the SNSHero web application, evaluating it against the authoritative requirements in `ORIGINAL_REQUEST.md` (specifically **R2. 40-Episode Webtoon Remake with Generative Visuals & Comic Direction** and its acceptance criteria).

### Key Takeaways:
1. **Current Viewer Paradigm**: The existing "Cartoon" viewer in `src/views/NovelView.tsx` is essentially a **static image-plus-caption list**. It renders 21 remote images per episode loaded from an external GitHub Pages CDN (`https://dayyoung.github.io/image/cartoon/`), followed by a plain text box with a truncated novel sentence.
2. **Complete Absence of Comic Direction**: Across all 40 episodes and 840 panels in both `src/content/webtoonEpisodeManifest.json` and `public/book/image_narrations/`, there are **0 structured dialogues**, **0 speaker attributes**, **0 comic speech bubbles**, and **0 dramatic visual SFX typography overlays**.
3. **Generative Image Capabilities Verified**: Environmental testing of the `generate_image` tool confirmed outstanding high-definition generation capabilities, producing commercial-grade dark-fantasy key art (e.g. Kadan wielding an arcane sword amidst ruins in a blizzard).
4. **Zero Broken Remote URLs**: Head HTTP probe tests across sample episodes (1, 5, 10, 20, 30, 40) confirmed that existing remote CDN image URLs return HTTP 200 OK. However, all existing images lack comic text integration and localized high-res climax assets.
5. **Architectural Opportunity**: With clean TypeScript types, modular component design (`WebtoonSpeechBubble`, `WebtoonSfxOverlay`, `WebtoonMonologueBox`), and enriched manifest data, the Webtoon experience can be elevated into a commercial-grade, authentic Korean webtoon strip that strictly adheres to `DESIGN.md`.

---

## 2. In-Depth Analysis of Current Webtoon Viewer (`src/views/NovelView.tsx`)

### 2.1 Mode Toggling & Tab Navigation
- `NovelView.tsx` provides three reader tabs (lines 185–192):
  - `'novel'`: Traditional web novel text reader with TTS, font sizing, and theme switching.
  - `'cartoon'`: The cartoon/webtoon viewer mode.
  - `'prompt'`: Prompt inspection mode.
- Tab selection can be initialized via `initialTab` prop or detected from URL path/hash (`/webtoon`).
- Persistent scroll position tracking is stored per tab using `saveEpisodeScrollState(currentSeason, currentEpisodeNum, scrollY, pct, readerTab)` in `src/lib/webtoonProgress.ts`.

### 2.2 Layout Modes: Vertical Scroll Strip vs Slide Carousel
In cartoon mode, two layout modes are supported (state `cartoonDisplayMode`, lines 207, 1544–1567):
1. **Vertical Scroll Mode (`'scroll'`)** (lines 1571–1666):
   - Loops through 21 items (`scNum = 0` to `20`), where `0` is `[ TITLE CARD ]` and `1..20` are `SCENE 01 / 20` through `SCENE 20 / 20`.
   - Each item renders an outer container with hairline border (`border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] rounded-none`), a header bar, an `<img>` tag with lazy loading, and a bottom caption card.
2. **Slide Carousel Mode (`'slides'`)** (lines 1668–1780):
   - Renders a single active scene (`activeSlideIndex`, 0..20) with previous/next buttons and a horizontal index bar.
   - **Bug / UX Flaw Observed**: In `NovelView.tsx:1695`, the scene number buttons are styled with `w-7 h-7` (28x28px). This violates the project's strict `min-h-[44px]` touch target guideline for mobile devices.

### 2.3 Image Loading, CDN Failover & Fallback
- Primary image URL resolution is handled by `getCartoonSceneUrl` (lines 218–230):
  ```typescript
  const getCartoonSceneUrl = (epNum: number, sceneIdx: number, attempt = 0): string => {
    const epData = WEBTOON_DATA[String(epNum)];
    const imgInfo = epData?.images?.find(img => img.index === sceneIdx);
    if (imgInfo && imgInfo.imageUrl) {
      if (attempt === 0) return imgInfo.imageUrl;
      if (attempt === 1) return imgInfo.imageUrl.replace('.jpeg', '.jpg');
      if (attempt === 2) return imgInfo.imageUrl.replace('.jpeg', '.png');
    }
    const epPad = pad2(epNum);
    const scPad = pad2(sceneIdx);
    const baseUrl = 'https://dayyoung.github.io/image/cartoon';
    return `${baseUrl}/episode_${epPad}/${scPad}.jpeg`;
  };
  ```
- If an image fails to load after 10 attempts (`attempt > 10`), it falls back to a card sprite icon (`getCardSpriteStyle(((currentEpisodeNum * 5 + scNum) % 110) + 1)`).
- **Asynchronous pre-decoding**: Line 114 defines `preDecodeImage(url)` with `img.decode()` and cached URLs in a `Set<string>` (ID 484).

### 2.4 Lightbox Modal Analysis
- Clicking any scene image opens a fullscreen lightbox modal (`lightboxSceneIndex !== null`, lines 2149–2230).
- Features: Close button `[ CLOSE ]`, Prev/Next navigation buttons (`min-h-[44px] min-w-[44px]`), image centered with max height `75vh`, and bottom caption card.
- **Deficiency**: The lightbox only renders the raw image and the single paragraph sentence; it displays no speech bubbles, no speaker badges, and no SFX.

### 2.5 Scroll Tracking Hardcoded Bug
- In `NovelView.tsx:340`:
  ```typescript
  if (readerTab === 'cartoon' && cartoonDisplayMode === 'scroll') {
    const sceneNum = Math.min(5, Math.max(1, Math.ceil((pct / 100) * 5)));
    setCurrentVisibleScene(sceneNum);
  }
  ```
  `sceneNum` is calculated by dividing percentage by 5 scenes rather than the actual 21 scenes (`scNum` 0..20)! This is a lingering artifact from an early prototype when cartoon mode only had 5 scenes.

---

## 3. Dataset Audit: Manifest & Narration Files

### 3.1 `src/content/webtoonEpisodeManifest.json`
- **Episode Count**: Exactly 40 episodes (keys `"1"` through `"40"`).
- **Total Images**: Exactly 840 images (21 images per episode: index 0 = title card, index 1..20 = scenes 1..20).
- **Current Field Schema**:
  - `index`: `number` (0..20)
  - `fileName`: `string` (e.g. `"00_SNSHERO_Episode_01_title_card_202608311350.jpeg"`)
  - `imageUrl`: `string` (`https://dayyoung.github.io/image/cartoon/episode_XX/...`)
  - `type`: `string` (`"title_card"` or `"scene_1"` .. `"scene_20"`)
  - `narrationEn`: `string` (English narrative sentence)
  - `narrationKo`: `string` (Korean narrative sentence)
  - `background`: `string` (AI prompt background description)
  - `characters`: `string[]` (names of characters appearing in scene)
- **Direct Observation**:
  - Panels with structured `dialogue`: **0 / 840 (0%)**
  - Panels with `speaker` attribution: **0 / 840 (0%)**
  - Panels with visual `sfx` or onomatopoeia: **0 / 840 (0%)**
  - Panels with `camera framing` tags: **0 / 840 (0%)**

### 3.2 `public/book/image_narrations/`
- Contains 41 JSON files: `index.json` + `episode_01_narrations.json` through `episode_40_narrations.json`, plus a directory `english_txt/` (40 `.txt` files).
- **Structure**:
  - `episodeNumber`: `number` (1..40)
  - `episodeTitleEn`, `episodeTitleKo`: `string`
  - `sourceSentenceCount`: `number`
  - `sceneCount`: `20` (Note: scene 0 / title card is **omitted** in `image_narrations`, containing only scenes 1..20).
  - `scenes`: Array of 20 objects with fields:
    `sceneNumber`, `imageFile`, `sourceImageFile`, `narrationEn`, `narrationKo`, `sourceSentenceStart`, `sourceSentenceEnd`, `alignmentScore`.
- **Text Characteristics**:
  - Narrations in `image_narrations` are verbatim raw slices of the legacy novel text.
  - Spoken dialogue (e.g. `“섀도우렐름의 사냥개라면 이름을 밝힐 시간도 아깝겠지.”`) is lumped inside the narrative string with no speaker identification or bubble positioning metadata.

### 3.3 `src/content/webtoonEpisodes.ts`
- Provides helper functions `buildSeasonEpisodes()` and exports `WEBTOON_SEASONS` (`s1` and `season1`).
- Interface `WebtoonPanel` defines:
  ```typescript
  export interface WebtoonPanel {
    id: string;
    imageUrl?: string;
    captionKey?: string;
    narrationEn?: string;
    narrationKo?: string;
    focusCardId?: number;
  }
  ```
  This interface has no fields for dialogue bubbles, speech types, or SFX.

### 3.4 LocalStorage & Progress Tracking
- Implemented in `src/lib/webtoonProgress.ts`:
  - `hero_webtoon_progress_{season}`: Stores `WebtoonProgressState` (`readEpisodeIds`, `claimedRewardEpisodeIds`, `lastEpisodeId`, `lastPanelIndex`, `lastReadPanelIndex`).
  - `hero_novel_progress_{season}`: Stores current episode number (1..40).
  - `hero_novel_scroll_{season}_{epNum}_{tab}`: Stores scroll offset and read percentage.

---

## 4. Visual Assets & Generative Image Capability Survey

### 4.1 Local Image Inventory in `public/`
- Total files in `public/`: 2,680
- Total image files in `public/`: 746
  - `public/gwent/img/lg`: 221 files (Card battle illustrations)
  - `public/gwent/img/sm`: 216 files (Small card thumbnails)
  - `public/seat`: 110 files (Seat and venue icons)
  - `public/gwent/img/icons`: 93 files (Card icon badges)
  - `public`: 68 files (Root banners, logos, sprites)
  - `public/mall/cdn/shop/files`: 11 files
  - `public/rpg/kadan-map`: 9 files
  - `public/banner`: 8 files
  - `public/book/image_narrations/`: **0 image files**
  - `public/images/webtoon/`: **Does not exist yet**
- **Conclusion**: The project currently hosts zero local webtoon panel images; 100% of cartoon images are loaded from the external GitHub Pages CDN.

### 4.2 Generative Tooling Test (`generate_image`)
- We executed a live test generation using the environment's `generate_image` tool:
  - **Prompt**: `"Dark fantasy digital illustration of hero Kadan standing atop snowy ruins holding a glowing arcane sword, blizzard storm, dramatic rim lighting, epic high fantasy webtoon key art"`
  - **Aspect Ratio**: `16:9`
  - **Output**: An ultra-high-definition dark-fantasy illustration was generated and verified at `/Users/dayyoung/.gemini/antigravity/brain/a3bbafe8-3fcb-460c-adc6-7029313abadc/kadan_climax_battle_1792273801823.jpg`.
- **Quality Assessment**: The generated asset exhibits authentic dark-fantasy digital painting quality, high atmospheric fidelity (snow particles, arcane glow, weathered armor, Gothic ruin architecture), and cinematic framing matching the lore of Arcane continent.
- **Feasibility**: High-impact key art for key episode title cards and climax scenes can be generated using this pipeline, copied to `public/images/webtoon/` or `public/book/art/`, and referenced cleanly via `getAssetUrl`.

---

## 5. Comprehensive Gap Analysis Against ORIGINAL_REQUEST.md R2

| Requirement Item | Acceptance Criteria | Current State | Gap Severity | Root Cause / Missing Elements |
|---|---|---|---|---|
| **R2.1 Generative Dark-Fantasy Art** | New generative dark-fantasy illustrations saved in project & integrated for key title cards / climax scenes | 100% remote CDN images (`dayyoung.github.io`). Zero local webtoon art files in `public/`. | **HIGH** | No local generative art asset directory or pipeline. Key title cards and climax scenes rely on legacy images. |
| **R2.2 40-Episode Manifest & Narration Datasets** | All 40 episodes include rich adapted scene scripts, structured speaker dialogue, and dramatic SFX cues | Manifest has 840 panels and narrations have 800 scenes, but **0 dialogues, 0 speakers, 0 SFX cues** across all files. | **CRITICAL** | Datasets contain only raw sentence text strings without structured comic metadata. |
| **R2.3 Comic Speech Bubbles** | Renders speech bubbles cleanly in vertical scroll and slide modes on mobile and desktop | **Zero speech bubble rendering**. All spoken text is rendered inside a plain `<p>` in a bottom caption box. | **CRITICAL** | `NovelView.tsx` lacks comic bubble components, speaker identification badges, and speech styles (shout, whisper, thought). |
| **R2.4 Dramatic SFX Typography Overlays** | Dramatic SFX typography overlays onomatopoeia directly on panels with visual flair | **Zero SFX typography rendering**. `playSfx` is only used for button click audio. No visual onomatopoeia. | **CRITICAL** | No SFX overlay component or styling exists in the codebase. |
| **R2.5 Internal Monologue Styling** | Internal monologues styled distinctively from narration and spoken dialogue | Monologues are indistinguishable from third-person narration in a single paragraph block. | **HIGH** | No monologue container, distinct font treatment, or styling hooks. |
| **R2.6 Mobile Touch Compliance** | All controls comply with `DESIGN.md` (`font-mono`, `rounded-none`/`rounded-sm`, `min-h-[44px]` touch targets) | Slide mode scene buttons (`NovelView.tsx:1695`) are `w-7 h-7` (28px). Scroll tracking assumes 5 scenes instead of 21. | **MEDIUM** | Touch target sub-44px bug in slide mode; hardcoded 5-scene calculation in scroll tracker. |
| **R2.7 Bilingual Support** | Synchronized Korean and English dialogues and narrations across all 40 episodes | Narration strings exist in KO & EN, but dialogues and SFX are not extracted or localized. | **HIGH** | Datasets lack bilingual dialogue keys (`speakerKo`/`speakerEn`, `textKo`/`textEn`, `sfxKo`/`sfxEn`). |

---

## 6. Technical Architecture & Recommendations for the Webtoon Remake Stream

### 6.1 Enriched Data Schema Architecture

We recommend enriching both `webtoonEpisodeManifest.json` and `episode_XX_narrations.json` with the following unified TypeScript schema:

```typescript
// Proposed schema for Webtoon Comic Direction
export type ComicSpeechType = 'dialogue' | 'shout' | 'thought' | 'whisper' | 'system';
export type ComicSfxType = 'impact' | 'slash' | 'magic' | 'ambient' | 'roar' | 'whisper';
export type ComicFraming = 'wide' | 'close_up' | 'high_angle' | 'low_angle' | 'climax_spread';

export interface WebtoonComicDialogue {
  id: string;
  speakerKo: string; // e.g. "알렉산다르", "발리안", "헤르쿨", "루시안", "카단", "실리아"
  speakerEn: string; // e.g. "Aleksandar", "Balian", "Hercul", "Lucian", "Kadan", "Celia"
  characterCardId?: number; // 1..110 for displaying character avatar sprite
  textKo: string;
  textEn: string;
  speechType: ComicSpeechType;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export interface WebtoonComicSfx {
  id: string;
  textKo: string; // e.g. "콰아아앙!", "챙-!", "서걱!", "쏴아아-", "휘이익!"
  textEn: string; // e.g. "BOOM!", "CLANG!", "SLASH!", "SWOOSH!", "WHIRL!"
  sfxType: ComicSfxType;
  position?: 'center' | 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right';
  rotationDeg?: number; // e.g. -6, 4, -12 for dynamic comic impact
  colorScheme?: 'crimson' | 'amber' | 'cyan' | 'ink' | 'pure_white';
  audioCueUrl?: string; // Mixkit or procedural SFX trigger
}

export interface WebtoonComicMonologue {
  speakerKo: string;
  speakerEn: string;
  textKo: string;
  textEn: string;
}

export interface EnhancedWebtoonManifestImage {
  index: number; // 0 for title card, 1..20 for scenes
  fileName: string;
  imageUrl: string; // Remote CDN fallback
  localArtUrl?: string; // Optional local high-res generative art asset (e.g. /images/webtoon/...)
  isKeyClimax?: boolean; // Highlighted climax panel
  type: string;
  narrationKo: string;
  narrationEn: string;
  background?: string;
  characters?: string[];
  framing?: ComicFraming;
  dialogues?: WebtoonComicDialogue[];
  monologue?: WebtoonComicMonologue;
  sfxCues?: WebtoonComicSfx[];
}

export interface EnhancedWebtoonEpisode {
  episodeNumber: number;
  episodeTitle: string;
  episodeTitleKo: string;
  totalImages: number; // 21
  images: EnhancedWebtoonManifestImage[];
}
```

### 6.2 Modular UI Component Architecture

Instead of bloating `NovelView.tsx` (which is already 2,331 lines), create dedicated, modular components in `src/components/webtoon/`:

1. **`WebtoonSpeechBubble.tsx`**:
   - Renders comic speech bubbles adhering strictly to `DESIGN.md`.
   - **Visual styling**:
     - Monospace typography (`font-mono`).
     - Tail/callout pointer directed toward speaker.
     - Small character avatar thumbnail (using `getCardSpriteStyle(cardId)`).
     - Distinct styles per `speechType`:
       - `dialogue`: Flat cream/ink background, 1px solid hairline border (`border-[#201d1d]`), sharp corners (`rounded-none` or `rounded-sm`).
       - `shout`: Bold crimson border (`border-red-600`), high contrast, slight scale up.
       - `thought`: Dashed border (`border-dashed border-[#646262]`), italicized font, cloud-like corner indicators.
       - `whisper`: Muted opacity, light dotted border (`border-dotted`).
2. **`WebtoonSfxOverlay.tsx`**:
   - Renders dramatic typography overlays directly above or overlapping the image.
   - Angled text styling (`transform rotate-[-6deg]`), bold impact monospace font, black stroke or drop shadow (`drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`).
   - Interactive: Clicking the SFX badge triggers `playSfx(audioCueUrl)` with haptic feedback (`triggerHaptic('light')`).
3. **`WebtoonMonologueBox.tsx`**:
   - Renders internal thoughts or narrative poetic interludes.
   - Dark translucent slate background (`bg-[#201d1d]/90 text-[#fdfcfc]`), left accent bar (`border-l-2 border-amber-500`), monospace text.
4. **`WebtoonPanelCard.tsx`**:
   - Encapsulates a single panel in both vertical scroll and slide modes.
   - Manages image loading, error retry, overlay rendering, zoom lightbox launch, and framing badges.
   - Provides an optional `[COMIC BUBBLE: ON/OFF]` toggle button so users can toggle between clean illustration appreciation and full comic speech bubble mode.

### 6.3 Fixes Required in `NovelView.tsx`

1. **Fix Slide Button Touch Targets**:
   - Change `w-7 h-7` in line 1695 to `min-w-[44px] min-h-[44px] px-2 py-1` with smooth horizontal scrolling for touch thumb accessibility.
2. **Fix Scroll Tracker Calculation**:
   - Update line 340 from `Math.ceil((pct / 100) * 5)` to `Math.min(20, Math.max(0, Math.round((pct / 100) * 20)))`.
3. **Integrate Enriched Manifest & Narration Data**:
   - Pass `dialogues`, `monologue`, and `sfxCues` to `WebtoonPanelCard`.
4. **Synchronize Lightbox with Comic Overlays**:
   - Enable toggling speech bubbles and SFX inside the fullscreen Lightbox modal so users can enjoy high-res comic reading in fullscreen mode.

### 6.4 Generative Art Production Plan

We recommend generating local high-impact dark-fantasy key art for key episodes across the 4 arcs:

- **Arc 1 (Origins & Frost, Ep 1–10)**:
  - Ep 01 Climax: *Aleksandar and Balian's Last Stand at the Blizzard Bridge*
  - Ep 06 Climax: *Awakening the Star Breathing Technique in the Cavern*
  - Ep 08 Climax: *Taming the Crimson Mane Warhorse*
  - Ep 10 Climax: *Kadan and Ignis Escaping the Flame Court Citadel*
- **Arc 2 (Shadows & Trials, Ep 11–20)**:
  - Ep 15 Climax: *Night of Serpent and Lion – Duel at the Foggy Citadel*
  - Ep 18 Climax: *Unsealing the Black Sanctum's Ancient Runic Door*
  - Ep 20 Climax: *The Colossal Tsunami Swallowing the Royal Flower Ship*
- **Arc 3 (Islands & Intrigue, Ep 21–30)**:
  - Ep 21 Climax: *Midnight Mutiny & Firestorm on the Flagship*
  - Ep 25 Climax: *The Shadow Assassins Ambush the False Wedding*
  - Ep 30 Climax: *The Four Elemental Guardians at the Poisoned Gates*
- **Arc 4 (The Conqueror's War, Ep 31–40)**:
  - Ep 34 Climax: *Fall of the Floating Wind Isle*
  - Ep 37 Climax: *All 11 Races Clash in the War of the Conqueror King*
  - Ep 40 Climax: *Kadan's Eternal Shield Facing the Dawning Horizon*

Assets should be saved to `public/images/webtoon/` as optimized WebP or JPEG files (`< 400KB` each) and registered in `webtoonEpisodeManifest.json` under `localArtUrl`.

---

## 7. Implementation Roadmap & Task Breakdown

| Phase | Milestone | Tasks | Verification |
|---|---|---|---|
| **Phase 1** | **Dataset Enrichment** | 1. Parse dialogue quotes from remade novel texts (`“...”`).<br>2. Attribute speakers and character IDs.<br>3. Add dramatic SFX typography cues and sound tags.<br>4. Update all 40 `episode_XX_narrations.json` and `webtoonEpisodeManifest.json`. | Automated JSON schema validation script checking 40 episodes x 21 panels. |
| **Phase 2** | **Generative Art Generation** | 1. Generate dark-fantasy key art for title cards and climax panels using `generate_image`.<br>2. Optimize and save to `public/images/webtoon/`.<br>3. Link `localArtUrl` in manifest with zero broken images. | Image load verification test script checking HTTP / local asset resolution. |
| **Phase 3** | **Comic Direction Components** | 1. Create `src/components/webtoon/WebtoonSpeechBubble.tsx`.<br>2. Create `src/components/webtoon/WebtoonSfxOverlay.tsx`.<br>3. Create `src/components/webtoon/WebtoonMonologueBox.tsx`.<br>4. Create `src/components/webtoon/WebtoonPanelCard.tsx`. | Component unit test / visual inspection in dev preview. |
| **Phase 4** | **NovelView Refactoring** | 1. Integrate `WebtoonPanelCard` into `NovelView.tsx`.<br>2. Fix slide mode 44px+ touch targets.<br>3. Fix scroll tracker calculation (21 scenes).<br>4. Add Bubble Display Toggle (`[말풍선 ON/OFF]`).<br>5. Synchronize Lightbox Modal. | `npm run lint` (`tsc --noEmit`) and `npm run build` pass with 0 errors. |
| **Phase 5** | **E2E Validation & Polish** | 1. Verify vertical scroll and slide modes on mobile and desktop viewports.<br>2. Verify bilingual switching (KO / EN).<br>3. Verify localStorage reading progress persistence (`hero_webtoon_progress_{season}`). | Full end-to-end regression check across episodes 1, 10, 20, 30, 40. |

---

## 8. Conclusion

The SNSHero project already possesses a solid functional scaffold for Webtoon viewing (mode switches, CDN failover, scroll progress tracking, lightbox modal), but it has hitherto treated webtoons merely as illustrated text summaries. 

By executing the proposed architecture—enriching the 840 panels with structured character dialogues and SFX typography, introducing bespoke terminal-flat comic direction components (`WebtoonSpeechBubble`, `WebtoonSfxOverlay`), fixing touch target ergonomics, and integrating stunning generative dark-fantasy art—the Webtoon stream will fully satisfy and exceed Requirement R2 of the IP Trilogy Remake.
