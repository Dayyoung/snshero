# Original User Request

## Initial Request — 2026-10-17T21:45:15Z

Complete a full-scale, commercial-grade creative remake of the 40-episode SNSHero IP trilogy — **Web Novel**, **Webtoon**, and **Full Movie** — in the SNSHero web application. Eliminate flat, telegraphic, AI-summary-style text and bare image dumps by rewriting all 40 episodes with authentic dark/high-fantasy literary depth, upgrading the Webtoon with generative illustrations and comic-style speech-bubble/SFX direction, and transforming the Movie theater into a 40-episode fully playable cinematic experience.

Working directory: /Users/dayyoung/project/snshero
Integrity mode: development

## Requirements

### R1. 40-Episode Web Novel Full Literary Adaptation (KO & EN)
Remake all 40 episodes of the SNSHero Web Novel ("Kadan & Arcane Echoes", `public/book/episode_01.md`–`episode_40.md` and English counterparts) from dry plot summaries into immersive, commercial-grade fantasy fiction. Each episode must feature vivid sensory worldbuilding across the 11 races of the Arcane continent, distinct character voices, dramatic dialogue exchanges, emotional stakes, tactical battle tension, and compelling chapter hooks/cliffhangers without repetitive AI clichés or mechanical sentence endings.

### R2. 40-Episode Webtoon Remake with Generative Visuals & Comic Direction
Upgrade the 40-episode Webtoon experience (`NovelView` cartoon mode, `src/content/webtoonEpisodeManifest.json`, and `public/book/image_narrations/episode_01_narrations.json`–`episode_40_narrations.json`) from static image-plus-caption lists into an authentic vertical/slide webtoon experience. Actively leverage available generative image capabilities (`image-generator` / Gemini Banana and free generative visual pipelines) to produce new high-impact dark-fantasy key art and climax panels, and pair every episode's panels with structured comic direction (character speech bubbles, internal monologues, dramatic SFX typography overlays, and cinematic framing).

### R3. 40-Episode Full Movie Theater & In-App Cinematic Engine
Remake the Movie theater (`src/views/MovieView.tsx` and `src/content/movieEpisodeMapping.ts`) so that all 40 episodes (not just episodes 1–8) are immediately playable and watchable end-to-end. Combine existing official YouTube theatrical streams with a full-featured in-app Generative Cinematic Movie Player capable of rendering any episode as an animated theatrical film with multi-plane camera motion (Ken Burns pan/zoom/shake), atmospheric visual effects (blizzard, embers, arcane runes, combat slashes), procedural/synthesized cinematic soundtrack & battle SFX, synchronized Korean/English voiceover narration, and theatrical subtitles.

### R4. Seamless Main App Integration & LocalStorage Persistence
Ensure the remade Web Novel, Webtoon, and Movie views integrate cleanly with the main screen shortcuts (`HomeView.tsx`), preserve reading/watching progress and reward claims in `localStorage` (`hero_novel_progress_{season}`, `hero_movie_progress_{season}`), and strictly adhere to the project's `DESIGN.md` aesthetic (Monospace typography, warm-cream/ink palette, 1px hairline borders, `rounded-none`/`rounded-sm` radii, and 44px+ mobile touch targets).

## Acceptance Criteria

### Web Novel Literary Quality & Completeness
- [ ] All 40 Korean episode files (`public/book/episode_01.md` through `episode_40.md`) and their English counterparts are completely rewritten and expanded; every Korean episode contains at least 3,500+ characters (at least 2x–3x richer than the legacy ~1,800-char summaries) with at least 8+ lines of direct character dialogue (`“...”` / `"..."`) per episode.
- [ ] An automated verification script confirms zero truncated/corrupted files, valid markdown structure across all 40 episodes, and synchronized episode titles/metadata in `public/book/index.json` and `src/content/englishNovelMapping.ts`.
- [ ] Independent Agent-as-Judge literary audit scores a random sample of episodes across Early (Ep 1–10), Mid (Ep 11–25), and Late (Ep 26–40) arcs at ≥ 8.5/10 on narrative immersion, natural prose flow, dialogue authenticity, and absence of repetitive AI summary tropes.

### Webtoon Generative Art & Comic Direction
- [ ] New generative dark-fantasy illustrations (created via `image-generator` / Gemini Banana or free generative visual pipelines) are generated, saved in the project, and integrated for key episode title cards / climax scenes.
- [ ] All 40 episode narration/webtoon datasets (`episode_01_narrations.json` through `episode_40_narrations.json` and `webtoonEpisodeManifest.json`) include rich adapted scene scripts, structured speaker dialogue / dramatic SFX cues, and valid image URLs with zero broken images.
- [ ] The Webtoon reader renders speech bubbles, dramatic narration boxes, and SFX overlays cleanly in both vertical scroll and slide modes on mobile and desktop viewports.

### Movie 40-Episode Playability & Cinematic Experience
- [ ] All 40 episodes in `MovieView.tsx` and `movieEpisodeMapping.ts` are unlocked and playable from start to finish (0 episodes blocked by "Coming Soon" dead-ends).
- [ ] The in-app Cinematic Movie Player plays full 20-scene theatrical sequences for any selected episode with synchronized camera motion, atmospheric particle VFX, cinematic BGM/SFX audio synthesis, TTS/voiceover narration, bilingual subtitles, playback timeline controls, and fullscreen support.

### Build, Type Safety & Design Compliance
- [ ] `npm run lint` (`tsc --noEmit`) passes with 0 TypeScript errors.
- [ ] `npm run build` succeeds with 0 bundling errors.
- [ ] All UI controls in `NovelView.tsx` and `MovieView.tsx` comply with `DESIGN.md` (`font-mono`, `rounded-none` containers, `rounded-sm` interactive elements, `min-h-[44px]` touch targets).
