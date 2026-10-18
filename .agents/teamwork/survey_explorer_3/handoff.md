# Handoff Report — survey_explorer_3

**Agent**: survey_explorer_3 (teamwork_preview_explorer)  
**Date**: 2026-10-18  
**Working Directory**: `/Users/dayyoung/project/snshero/.agents/teamwork/survey_explorer_3/`  
**Reference Report**: `/Users/dayyoung/project/snshero/.agents/teamwork/survey_explorer_3/survey_report.md`  
**Type**: Hard Handoff (Investigation & Survey Complete)

---

## 1. Observation

1. **Movie Theater Locking Logic**:
   - In `src/views/MovieView.tsx` (line 54): `const DEFAULT_RELEASED_COUNT = 8;`
   - In `src/views/MovieView.tsx` (lines 385–396):
     ```ts
     if (epNum > releasedCount) {
       if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
       if (showCustomAlert) {
         showCustomAlert(
           language === 'ko' ? '공개 예정 에피소드' : 'Episode Coming Soon',
           language === 'ko'
             ? `제 ${epNum}화는 아직 공개 준비 중입니다! 유튜브 오피셜 채널에서 곧 공개될 예정입니다.`
             : `Episode ${epNum} is scheduled for release soon! Stay tuned on the YouTube playlist.`
         );
       }
       return;
     }
     ```
   - Verbatim result: Selecting any episode from 9 to 40 triggers an alert popup and completely aborts playback (`return;`).

2. **Movie Episode Mapping Data**:
   - In `src/content/movieEpisodeMapping.ts` (lines 9–65): Episodes 1 through 8 have `videoId` defined (`L01HUesRGvQ`, `Q4IgdCmLipI`, `tLlNTZYYBrg`, `dqoDeA8DTvg`, `if4xYWaXyTw`, `eX1nJf_95Hk`, `qbN4ngzVvIw`, `S8kgVJdYtP4`).
   - Lines 66–258: Episodes 9 through 40 have `titleKo`, `titleJa`, `titleEn`, but `videoId` is omitted.
   - The interface `MovieEpisodeMeta` contains only `episodeNumber`, `titleKo`, `titleEn`, `titleJa`, and optional `videoId`. It contains no scene cues, visual tags, audio cues, or camera directions.

3. **In-App Player Absence**:
   - In `src/views/MovieView.tsx` (lines 609–618), the only video rendering container is:
     ```tsx
     <iframe
       key={`movie-yt-player-ep-${currentEpisodeNum}-${currentVideoId || 'playlist'}`}
       id="movie-yt-player"
       src={embedUrl}
       title={`SNSHero Movie Ep.${currentEpisodeNum}`}
       className="w-full h-full border-0"
       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
       allowFullScreen
     />
     ```
   - No HTML5 canvas, WebGL, or CSS Ken Burns motion player exists in `MovieView.tsx`.
   - No procedural Web Audio synthesizer or particle VFX systems are wired into `MovieView.tsx`.

4. **Available 40-Episode Storyboard Assets**:
   - `src/content/webtoonEpisodeManifest.json` contains 11,231 lines with complete 40-episode datasets, each containing 21 scene items (title card + 20 narrative scenes) with image URLs on `https://dayyoung.github.io/image/cartoon/episode_XX/...`, character tags, and bilingual Korean and English narration texts.
   - `public/book/image_narrations/episode_01_narrations.json` through `episode_40_narrations.json` (all 40 files present) contain 20 scene breakdown objects each with sentence alignment and narration.

5. **Audio & Sound Synthesis Foundations**:
   - `src/lib/BattleAudioEngine.ts` (585 lines) contains rich Web Audio API synthesis patterns: oscillators (sine, triangle, saw), exponential gain ramps, sub-bass drops, shimmer fanfares, and life-cycle suspension guards.
   - `src/views/NovelView.tsx` (lines 600–672) contains an established `window.speechSynthesis` TTS pipeline with language switching (`ko-KR` vs `en-US`), pause, resume, and paragraph progression.

6. **Home & App View Routing**:
   - In `src/views/HomeView.tsx` (lines 400–443): Clean 3-button media row with shortcuts to `novel`, `webtoon`, and `movie` using `min-h-[44px]`, `font-mono`, and haptic feedback.
   - In `src/App.tsx` (lines 6236–6246): `case 'movie'` mounts `MovieView`. Lines 6277–6291: `case 'novel'` / `case 'webtoon'` mounts `NovelView`.
   - In `src/App.tsx` (line 6387): `view !== 'movie'` and `view !== 'novel'` suppresses the bottom navbar.

7. **Critical Latent Defect in `setSeasonItem` Parameter Order**:
   - Definition in `src/lib/webtoonProgress.ts` (lines 28–34):
     ```ts
     export function setSeasonItem(key: string, season: string, value: string): void {
       if (typeof window === 'undefined') return;
       localStorage.setItem(`${key}_${season}`, value);
       if (season === 'season1') {
         localStorage.setItem(key, value);
       }
     }
     ```
   - Invocations in `src/views/MovieView.tsx`:
     - Line 195: `setSeasonItem('hero_movie_released_count', combinedCount.toString(), currentSeason);`
     - Line 247: `setSeasonItem('hero_movie_released_count', count.toString(), currentSeason);`
     - Line 370: `setSeasonItem('hero_movie_progress', currentEpisodeNum.toString(), currentSeason);`
     - Line 408: `setSeasonItem('hero_movie_claimed_episodes', JSON.stringify(newClaimed), currentSeason);`
   - Invocations in `src/views/NovelView.tsx`:
     - Line 288: `setSeasonItem('hero_novel_progress', currentEpisodeNum.toString(), currentSeason);`
     - Line 402: `setSeasonItem('hero_novel_prompt_mode', nextVal ? 'true' : 'false', currentSeason);`
     - Line 712: `setSeasonItem('hero_novel_claimed_episodes', JSON.stringify(nextClaimed), currentSeason);`
   - Invocations in `src/views/AnimeView.tsx`:
     - Line 197: `setSeasonItem('hero_anime_progress', currentEpisodeNum.toString(), currentSeason);`
     - Line 212: `setSeasonItem('hero_anime_claimed_episodes', JSON.stringify(newClaimed), currentSeason);`
   - Verbatim bug: `setSeasonItem` receives `season` as the 2nd argument and `value` as the 3rd argument. The callers reversed them by passing `value` as 2nd argument and `currentSeason` as 3rd argument.
   - Result: Key written to localStorage is `${key}_${value}` with value `${season}` (e.g. `hero_movie_progress_3` = `'season1'`). Meanwhile, `getSeasonItem(key, season)` looks up `${key}_${season}` (e.g. `hero_movie_progress_season1`), which yields `null`!

8. **DESIGN.md Compliance**:
   - `MovieView.tsx` and `NovelView.tsx` 100% adhere to `font-mono` and 0px/4px border radii.
   - Minor touch target gap: In `MovieView.tsx`, lines 728, 735, 742 have `min-h-[36px]` filter tabs (should be `min-h-[44px]`), and line 884 has a `p-1` link icon button (< 44px).

9. **Build and Verification Health**:
   - Command `npx tsc --noEmit` exited with code 0 (0 errors).
   - Command `npm run build` exited with code 0 in 16.04s.
   - High-speed runner `npx tsx` is verified and operational (v4.23.12).

---

## 2. Logic Chain

1. From Observation 1, `MovieView.tsx` hardcodes `DEFAULT_RELEASED_COUNT = 8` and blocks episodes 9–40 with an alert.
   - Therefore, to satisfy Acceptance Criterion 3 ("All 40 episodes in MovieView.tsx and movieEpisodeMapping.ts are unlocked and playable from start to finish (0 episodes blocked by Coming Soon dead-ends)"), `releasedCount` must default to 40 and the click blocker must be removed.
2. From Observations 2 & 3, YouTube official videos only exist for Ep 1–8, and `MovieView.tsx` contains only a YouTube iframe.
   - Therefore, playing episodes 9–40 requires an in-app player capable of rendering the theatrical scenes without relying on an external YouTube video stream.
3. From Observation 4, all 40 episodes already possess complete 20-scene high-resolution illustrated storyboard sequences and bilingual narrations in `webtoonEpisodeManifest.json` and `image_narrations/*.json`.
   - Therefore, building the in-app Cinematic Movie Player does not require creating new episode data from scratch; it can directly consume this validated 20-scene manifest.
4. From Observation 5, existing procedural synthesis code in `BattleAudioEngine.ts` and TTS code in `NovelView.tsx` prove that client-side procedural BGM/SFX and voiceover narration can be implemented cleanly with zero external API dependencies.
   - Therefore, a dedicated `MovieAudioSynthesizer.ts` can generate ambient chords, combat SFX, and SpeechSynthesis voiceover for each scene.
5. From Observation 7, the argument order between callers and `setSeasonItem` is inverted, silently corrupting localStorage keys.
   - Therefore, `webtoonProgress.ts` must be updated with an argument-order agnostic overload to guarantee reading/watching progress and reward claims persist correctly.
6. From Observation 9, TypeScript typechecking passes with 0 errors and production build succeeds.
   - Therefore, introducing the in-app cinematic player and updating `MovieView.tsx` can be verified end-to-end via `npx tsc --noEmit` and `npm run build`.

---

## 3. Caveats

- **YouTube Availability**: The official YouTube playlist `PLOLtCtApKgp8` currently contains only Episodes 1–8. Ep 9–40 cannot be watched via YouTube; they will play via the in-app Generative Cinematic Engine.
- **Audio Autoplay Policies**: Modern mobile browsers (Safari/Chrome) require an initial user gesture (click/tap) before starting Web Audio API `AudioContext` and `SpeechSynthesis`. The player must prompt the user with a standard "시작 / 재생 [▶]" button to unlock audio on first interaction.
- **Low-Spec Devices**: Devices with constrained GPUs should gracefully disable heavy particle rendering while keeping Ken Burns CSS transforms active.

---

## 4. Conclusion

The Movie Theater (`MovieView.tsx`) remake is completely feasible, high-impact, and unblocked. All necessary visual storyboard datasets (40 episodes × 20 scenes) and bilingual narrations are already present in the repository.

### Actionable Scope for Implementation Stream:
1. **Fix `setSeasonItem`**: Update `src/lib/webtoonProgress.ts` to be argument-order agnostic to restore reliable localStorage persistence.
2. **Build `MovieAudioSynthesizer.ts`**: Web Audio API procedural BGM themes (ambient, battle, mystery) + battle SFX + SpeechSynthesis voiceover.
3. **Build `CinematicMoviePlayer.tsx`**: Multi-plane Ken Burns camera motion, HTML5 particle VFX (snow, embers, runes, slashes), bilingual theatrical subtitles, and 44px+ touch-friendly timeline scrub controls.
4. **Remake `MovieView.tsx`**: Unlock all 40 episodes (0 episodes locked), add dual mode (In-App Cinematic Player vs. YouTube Official Stream), add cross-navigation to Web Novel & Webtoon, and fix touch targets to 44px+.
5. **Automated Verification Harness**: Implement `scripts/verify_ip_trilogy.ts` to programmatically verify all 40 episodes, scenes, JSONs, and TypeScript/build cleanliness.

---

## 5. Verification Method

To independently verify these findings:
1. **Inspect Episode Locking in MovieView**:
   ```bash
   grep -n "DEFAULT_RELEASED_COUNT" src/views/MovieView.tsx
   grep -n -C 5 "if (epNum > releasedCount)" src/views/MovieView.tsx
   ```
2. **Inspect Parameter Order Mismatch in `setSeasonItem`**:
   ```bash
   # Compare function definition:
   sed -n '25,35p' src/lib/webtoonProgress.ts
   # Against call site in MovieView:
   grep -n "setSeasonItem" src/views/MovieView.tsx
   ```
3. **Inspect 40-Episode Narration & Webtoon Datasets**:
   ```bash
   ls public/book/image_narrations/episode_*_narrations.json | wc -l
   # Returns: 40
   ```
4. **Execute TypeScript & Production Build Checks**:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
   Both commands must exit with code 0.
