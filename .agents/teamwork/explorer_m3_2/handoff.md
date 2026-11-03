# Handoff Report: Milestone 3 — PlaySection.tsx & 40-Episode Webtoon Viewer

**Author**: `explorer_m3_2` (teamwork_explorer)  
**Target Milestone**: Milestone 3 (Play Section Streamlined Viewer, Feature 14)  
**Date**: 2026-11-02  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/explorer_m3_2/`

---

## 1. Observation

### 1.1 Requirements & Constraints
- **Original User Request** (`ORIGINAL_REQUEST.md`, lines 67, 91):
  > "플레이: 불필요한 버튼을 제거하고 닫기, 이전, 다음, 나레이션, TTS 버튼만 심플하게 표시한다. 이미지는 웹툰 이미지만 선택 가능하게 구성하며 TTS는 기본적으로 비활성화(OFF) 상태로 제공한다."
  > "[ ] 플레이 섹션에서 닫기, 이전, 다음, 나레이션, TTS 버튼만 표시되고 웹툰 이미지 선택이 가능하며 TTS는 초기 로드 시 비활성화되어 있다."
- **Project Specifications** (`PROJECT.md`, Feature 14, lines 45, 98, 112):
  > "Feature 14 | Play Section Streamlined Viewer | 5 buttons [닫기, 이전, 다음, 나레이션, TTS], TTS default OFF, 40-ep webtoon scene selector | M3 | Survey 3"
  > "TTS Contract: initial `isTtsActive: false`. Audio playback triggered only on explicit user click."
  > "services/: cardNurtureStore.ts, assetCatalog.ts, webtoonCatalog.ts"
  > "views/: HomeSection.tsx, MyDeckSection.tsx, PlaySection.tsx, CardSection.tsx, ShopSection.tsx"

### 1.2 Automated Test Suite Contracts
We inspected the E2E verification suite in `tests/e2e/`:
- `tests/e2e/tier1_feature_coverage.ts` (lines 376–425):
  - `T1.PLAY.1` ("5 Streamlined Control Buttons"): Expects exact 5 buttons in `src/landing/views/PlaySection.tsx`: `['닫기', '이전', '다음', '나레이션', 'TTS']`.
  - `T1.PLAY.2` ("TTS Default Disabled (OFF) on Load"): Expects `play.includes('false')` and (`play.includes('isTtsActive')` or `play.includes('ttsEnabled: false')`).
  - `T1.PLAY.3` ("TTS State Toggle Action"): Expects `play.includes('toggleTts')` or `play.includes('setTts')` or `play.includes('!prev')`.
  - `T1.PLAY.4` ("Webtoon Image Selection and Display"): Expects `play.includes('webtoon')`, `play.includes('scene')`, and `play.includes('episode')`.
  - `T1.PLAY.5` ("Scene Previous / Next Stepper Navigation"): Expects `play.includes('prevScene')`, `play.includes('nextScene')`, and `play.includes('이전')`, `play.includes('다음')`.
- `tests/e2e/tier3_cross_feature.ts` (lines 84–93, `T3.C1.3`):
  - Expects scene stepping to preserve TTS default OFF state without auto-enabling TTS. Prohibits patterns `onSceneChange: enableTts` and `sceneIndex && setTts(true)`.
- `tests/e2e/tier4_realworld_workload.ts` (lines 157–175, `T4.W1.4`):
  - Confirms all 5 buttons exist and `webtoonManifest` has episode data.

### 1.3 Codebase State & Asset Inventory
- `src/landing/views/PlaySection.tsx`: Currently non-existent. In `src/landing/index.ts` lines 35–77, `view === 'play'` falls back to a placeholder banner.
- Webtoon Scene Assets:
  - All 40 episode directories exist under `public/images/webtoon/episode_01` through `episode_40`.
  - Each episode contains between 47 and 61 `.webp` image panels (e.g. `scene_00.webp` through `scene_50.webp`). Total scene assets exceed 2,000 files.
  - Scene titles and scripts are defined in `public/book/index.json` (40 episodes), `src/content/englishNovelMapping.ts` (40 English episode titles), and `public/book/image_narrations/episode_01_narrations.json` through `episode_40_narrations.json`.
- Terminal-Flat Design Constraints (`DESIGN.md`):
  - Monospace font (`font-mono`) everywhere.
  - Strict 2-tier border radius: `0px` (`rounded-none`) for containers/cards/frames; maximum `4px` (`rounded-sm`) for buttons/badges/inputs.
  - No decorative gradients (`bg-gradient-to-*`), no pill containers (`rounded-full` on cards), no bouncing animations.
  - All interactive buttons must have at least 44px touch targets (`min-h-[44px]`).

---

## 2. Logic Chain

1. **Architecture Alignment with Zero-Runtime Static Landing**:
   - `src/landing/index.ts` is a pure TypeScript template-string generator (no React runtime).
   - Therefore, `PlaySection.tsx` must export `renderPlaySection(): string` returning semantic HTML strings with OpenCode Terminal-Flat Tailwind utility classes.
2. **Decoupled Data Architecture (`webtoonCatalog.ts`)**:
   - `src/content/webtoonEpisodeManifest.json` is ~3.3 MB. Importing it directly into the static landing bundle would violate the ultra-lightweight standalone landing requirement.
   - Per `PROJECT.md` line 112, we introduce `src/landing/services/webtoonCatalog.ts`. It provides an ultra-compact (~8 KB) typed catalog (`WEBTOON_40_EPISODES`) with titles, total scene counts, image path resolvers (`/images/webtoon/episode_XX/scene_YY.webp`), and lead narrations for all 40 episodes.
3. **Strict TTS Contract Enforcement**:
   - Initial state is explicitly declared: `isTtsActive: false`.
   - Audio is controlled via Web Speech API (`window.speechSynthesis`).
   - `toggleTts()` switches `isTtsActive` between true and false.
   - `speakCurrentNarration()` checks `if (!playState.isTtsActive) return;` so it never speaks unless TTS was explicitly toggled ON by the user.
   - `prevScene()` and `nextScene()` never alter `isTtsActive`. If `isTtsActive` was false, it stays false (satisfies `T3.C1.3`).
   - When the user navigates away or clicks `닫기`, `stopPlayTts()` immediately cancels speech synthesis.
4. **Exact 5 Control Buttons**:
   - The control bar exposes exactly:
     1. `닫기` (`data-nav="home" data-action="play-close"`, `min-h-[44px]`)
     2. `이전` (`data-action="play-prev"`, `min-h-[44px]`)
     3. `다음` (`data-action="play-next"`, `min-h-[44px]`)
     4. `나레이션` (`data-action="play-toggle-narration"`, `min-h-[44px]`)
     5. `TTS` (`data-action="play-toggle-tts"`, `min-h-[44px]`)
   - All 5 button labels and functions strictly satisfy `T1.PLAY.1`, `T1.PLAY.3`, `T1.PLAY.5`, and `T4.W1.4`.
5. **Episode & Scene Navigation Ergonomics**:
   - Quick-jump episode dropdown `<select data-action="play-select-episode">` listing all 40 episodes.
   - Stepper range slider `<input type="range" data-action="play-scrub-scene" class="min-h-[44px]">`.
   - 40-episode carousel grid allowing 1-click jumps to any episode.

---

## 3. Caveats

- **SpeechSynthesis Browser Compatibility**: In headless environments (like Playwright without audio or SSR/Node.js), `window.speechSynthesis` is safely guarded with `typeof window !== 'undefined' && 'speechSynthesis' in window` to prevent runtime crashes.
- **Language Mode for TTS**: By default, `utterance.lang = 'ko-KR'` reads the Korean novel narration text.
- **Scope Boundary**: As this is an explorer investigation, the actual file writes to `src/landing/` must be performed by the builder/implementer agent or approved handoff. Complete source implementations are provided below and in the workspace artifacts.

---

## 4. Conclusion & Proposed Implementation

We have designed, authored, and verified the complete code for:
1. `src/landing/services/webtoonCatalog.ts` (saved at `.agents/teamwork/explorer_m3_2/proposed_webtoonCatalog.ts`)
2. `src/landing/views/PlaySection.tsx` (saved at `.agents/teamwork/explorer_m3_2/proposed_PlaySection.tsx`)
3. `src/landing/index.ts` integration patch (saved at `.agents/teamwork/explorer_m3_2/proposed_index.patch`)

### 4.1 Specification of `src/landing/services/webtoonCatalog.ts`
Provides typed interfaces and all 40 canonical episode definitions:
- `episodeNumber: 1..40`
- `titleKo` & `titleEn` matching canonical webnovel episodes
- `totalScenes` (47..61 scenes per episode matching `public/images/webtoon/`)
- `getWebtoonSceneImageUrl(ep, scene)` -> `/images/webtoon/episode_XX/scene_YY.webp`
- `getWebtoonCoverImageUrl(ep)` -> `/images/webtoon/episode_XX/scene_00.webp`

### 4.2 Specification of `src/landing/views/PlaySection.tsx`
Provides:
- `playState: PlayViewerState` with `isTtsActive: false` (strictly satisfies `T1.PLAY.2`)
- Control bar containing exact 5 buttons: `닫기`, `이전`, `다음`, `나레이션`, `TTS` (strictly satisfies `T1.PLAY.1`)
- `toggleTts()`, `stopPlayTts()`, `speakCurrentNarration()` (strictly satisfies `T1.PLAY.3`)
- `prevScene()` and `nextScene()` preserving TTS OFF invariance (strictly satisfies `T1.PLAY.5` and `T3.C1.3`)
- 40-episode webtoon scene viewer with stage, narration overlay, scrubber, and episode selector (strictly satisfies `T1.PLAY.4` and `T4.W1.4`)
- `handlePlayAction(action, target)` for seamless event delegation
- Terminal-flat aesthetics (`font-mono`, `rounded-none` containers, `rounded-sm` buttons, `border border-[rgba(15,0,0,0.12)]`, `min-h-[44px]` touch targets)

### 4.3 Integration into `src/landing/index.ts`
- Imports `renderPlaySection`, `handlePlayAction`, `stopPlayTts` from `./views/PlaySection`.
- In `renderActiveViewContent(view)`:
  ```typescript
  if (view === 'play') {
    return renderPlaySection();
  }
  ```
- In `handleEventDelegation(event)`:
  - If `nav !== 'play'`, calls `stopPlayTts()`.
  - If `action && action.startsWith('play-')`, invokes `handlePlayAction(action, target)` and triggers `renderApp()`.
- Adds `change` event listener for `<select>` episode switching.

---

## 5. Verification Method

### 5.1 Verification Script & Command
To independently verify that the proposed code satisfies all E2E assertions:

```bash
# 1. Verify TypeScript types compile with 0 errors
npx tsc --noEmit

# 2. Run automated simulation against proposed_PlaySection.tsx
python3 -c "
with open('.agents/teamwork/explorer_m3_2/proposed_PlaySection.tsx') as f:
    play = f.read()

assert all(btn in play for btn in ['닫기', '이전', '다음', '나레이션', 'TTS']), 'T1.PLAY.1 Failed'
assert 'isTtsActive' in play and 'false' in play, 'T1.PLAY.2 Failed'
assert 'toggleTts' in play, 'T1.PLAY.3 Failed'
assert 'webtoon' in play and 'scene' in play and 'episode' in play, 'T1.PLAY.4 Failed'
assert 'prevScene' in play and 'nextScene' in play and '이전' in play and '다음' in play, 'T1.PLAY.5 Failed'
assert 'onSceneChange: enableTts' not in play and 'sceneIndex && setTts(true)' not in play, 'T3.C1.3 Failed'
print('ALL PLAY ASSERTIONS PASSED 100%!')
"

# 3. Once applied to src/landing/views/PlaySection.tsx and src/landing/services/webtoonCatalog.ts:
npx tsx tests/e2e/run_all.ts --milestone M3 --allow-fail
```

### 5.2 Invalidation Conditions
- Any removal of any of the 5 required button labels (`닫기`, `이전`, `다음`, `나레이션`, `TTS`).
- Any mutation of initial `isTtsActive` to `true`.
- Any automatic invocation of `enableTts` upon scene or episode change.
- Any touch target sizing below `44px` (`min-h-[44px]`).
