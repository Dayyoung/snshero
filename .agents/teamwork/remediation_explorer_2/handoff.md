# Handoff Report: UI Touch Ergonomics, Deep-Linking & Storage Remediation Strategy

- **Agent**: `remediation_explorer_2` (teamwork_preview_explorer)
- **Role**: explorer, specialist
- **Date**: 2026-10-18T07:26:00Z
- **Authoritative Spec**: `/Users/dayyoung/project/snshero/PROJECT.md` & `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md`
- **Reference Report**: `/Users/dayyoung/project/snshero/.agents/teamwork/remediation_explorer_2/remediation_report.md`
- **Parent Conversation ID**: `b25c9f85-c96b-42a7-bce3-42d8c13e23ed`
- **Handoff Type**: Hard (Investigation complete, full implementation strategy formulated)

---

## 1. Observation

### Obs 1. Reproduction of Challenger 1 Failures
Execution of `npx tsx scripts/challenger_empirical_stress.ts` yielded:
```text
Total: 58 | Passed: 54 | Failed: 4
[✗ HIGH] [Storage-ScrollState] loadEpisodeScrollState resilient against: String literal "true"
[✗ HIGH] [Storage-ScrollState] loadEpisodeScrollState resilient against: String literal "false"
[✗ HIGH] [Storage-ScrollState] loadEpisodeScrollState resilient against: Numeric literal (99999)
[✗ HIGH] [TouchErgonomics] Zero touch targets below 44px across IP Trilogy interactive controls
```

### Obs 2. Direct Source Verification of 17 Substandard Interactive Controls
Direct inspection of files confirmed 17 controls violating `DESIGN.md`'s 44px minimum touch target requirement:
1. `src/views/NovelView.tsx:908`: `min-h-[32px] px-2.5 py-1 bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] font-bold rounded-sm cursor-pointer transition-colors text-[11px]` (Resume banner button)
2. `src/views/NovelView.tsx:915`: `min-h-[32px] min-w-[32px] flex items-center justify-center text-[#fdfcfc]/70 hover:text-[#fdfcfc] cursor-pointer ml-1` (Resume banner dismiss)
3. `src/views/NovelView.tsx:1121`: `min-h-[36px] text-xs font-bold uppercase tracking-widest text-[#201d1d] px-2.5 py-1 border border-[#201d1d] bg-[#f8f7f7] hover:bg-[#f1eeee] rounded-sm flex items-center gap-1 cursor-pointer transition-colors group` (Episode modal trigger)
4. `src/views/NovelView.tsx:1154`: `min-h-[36px] flex items-center gap-1.5 px-2.5 py-1 border border-[rgba(15,0,0,0.12)] rounded-sm bg-[#fdfcfc] hover:bg-[#f8f7f7] transition-colors cursor-pointer text-xs font-bold text-[#201d1d]` (Featured character chip)
5. `src/views/NovelView.tsx:1187`: `min-h-[36px] px-3 py-1 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:bg-[#201d1d]/90 transition-colors cursor-pointer flex items-center gap-1` (TTS Play)
6. `src/views/NovelView.tsx:1196`: `min-h-[36px] px-3 py-1 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:bg-[#201d1d]/90 transition-colors cursor-pointer flex items-center gap-1` (TTS Pause)
7. `src/views/NovelView.tsx:1205`: `min-h-[36px] px-3 py-1 bg-emerald-700 text-[#fdfcfc] text-xs font-bold rounded-sm hover:bg-emerald-800 transition-colors cursor-pointer flex items-center gap-1` (TTS Resume)
8. `src/views/NovelView.tsx:1214`: `min-h-[36px] px-2.5 py-1 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#fdfcfc] transition-colors cursor-pointer flex items-center gap-1` (TTS Stop)
9. `src/views/NovelView.tsx:1245`: `min-h-[36px] px-3 py-1 text-[11px] font-bold border border-[#201d1d] rounded-sm bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] cursor-pointer flex items-center gap-1.5 transition-colors` (Prompt mode: Copy 20-scene summary)
10. `src/views/NovelView.tsx:1298`: `min-h-[36px] px-3 py-1 text-[11px] font-bold border border-[#201d1d] rounded-sm bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] cursor-pointer flex items-center gap-1.5 transition-colors` (Prompt mode: Copy short narration)
11. `src/views/NovelView.tsx:1357`: `min-h-[36px] px-3 py-1 text-[11px] font-bold border border-[#201d1d] rounded-sm bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] cursor-pointer flex items-center gap-1.5 transition-colors` (Prompt mode: Copy all character prompts)
12. `src/views/NovelView.tsx:1391`: `min-h-[32px] px-2.5 py-1 text-[10px] font-bold border border-[rgba(15,0,0,0.12)] text-[#201d1d] bg-[#fdfcfc] hover:bg-[#f1eeee] rounded-sm cursor-pointer flex items-center gap-1` (Character card Wiki button)
13. `src/views/NovelView.tsx:1402`: `min-h-[32px] px-2.5 py-1 text-[10px] font-bold border border-[#201d1d] text-[#fdfcfc] bg-[#201d1d] hover:bg-[#201d1d]/90 rounded-sm cursor-pointer flex items-center gap-1` (Character card Summon button)
14. `src/views/NovelView.tsx:1413`: `min-h-[32px] px-2.5 py-1 text-[10px] font-bold border border-[rgba(15,0,0,0.12)] text-[#201d1d] bg-[#fdfcfc] hover:bg-[#f1eeee] rounded-sm cursor-pointer flex items-center gap-1` (Character card Copy Prompt button)
15. `src/views/NovelView.tsx:1493`: `min-h-[36px] px-3 py-1 text-[11px] font-bold border border-[#201d1d] rounded-sm bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] cursor-pointer flex items-center gap-1.5 transition-colors` (Continuous 20 prompts Copy button)
16. `src/components/movie/CinematicMoviePlayer.tsx:643`: `group relative flex-1 min-h-[28px] flex items-center py-2` (20-scene segmented scrubber button)
17. `src/components/webtoon/WebtoonPanelCard.tsx:80`: `min-h-[32px] px-2.5 py-1 border border-[rgba(15,0,0,0.12)] rounded-sm bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] text-[11px] font-bold cursor-pointer flex items-center gap-1 transition-colors` (Panel zoom/fullscreen button)

### Obs 3. Deep-Linking Query Parameter Asymmetry
- `src/views/NovelView.tsx:185–189`:
  ```ts
  const [currentEpisodeNum, setCurrentEpisodeNum] = useState<number>(() => {
    const saved = getSeasonItem('hero_novel_progress', currentSeason);
    const parsed = saved ? parseInt(saved, 10) : 1;
    return isNaN(parsed) || parsed < 1 || parsed > TOTAL_EPISODES ? 1 : parsed;
  });
  ```
  `NovelView.tsx` never parses `window.location.search`, so URL parameters (`?ep=` or `?episode=`) are ignored.
- `src/views/MovieView.tsx:71–76`:
  ```ts
  if (epParam) {
    const parsedEp = parseInt(epParam, 10);
    if (!isNaN(parsedEp) && parsedEp >= 1 && parsedEp <= TOTAL_EPISODES) {
      return parsedEp;
    }
  }
  ```
  `MovieView.tsx` rejects out-of-bounds queries (`?ep=999` or `?ep=-10`), falling back to previous LocalStorage progress or 1 rather than clamping to boundary values `[1, 40]`.

### Obs 4. Type Guard Vulnerability in `webtoonProgress.ts`
In `src/lib/webtoonProgress.ts:188`:
```ts
const raw = localStorage.getItem(key);
if (!raw) return null;
return JSON.parse(raw);
```
When `raw` contains `"true"`, `"false"`, or `"99999"`, `JSON.parse` returns primitive values instead of `EpisodeScrollData | null`, triggering failures in `scripts/challenger_empirical_stress.ts` lines 299–301.

---

## 2. Logic Chain

1. **Premise 1 (`DESIGN.md` & `PROJECT.md` Feature 11, 19)**: All interactive touch targets on mobile viewports must meet `min-h-[44px]` (and `min-w-[44px]` for square icon buttons).
2. **From Obs 2**: 17 buttons in `NovelView.tsx`, `CinematicMoviePlayer.tsx`, and `WebtoonPanelCard.tsx` explicitly set `min-h-[36px]`, `min-h-[32px]`, or `min-h-[28px]`.
3. **Inference 1**: Upgrading all 17 controls to `min-h-[44px]` (and dismiss button to `min-w-[44px]`) directly resolves the `[TouchErgonomics]` failure in `scripts/challenger_empirical_stress.ts`.
4. **Premise 2 (`ORIGINAL_REQUEST.md` R4 & Obs 3)**: Deep linking via `?ep=` or `?episode=` must provide consistent cross-media routing across Novel, Webtoon, and Movie.
5. **Inference 2**: Parsing `window.location.search` in `NovelView.tsx` with boundary clamping `Math.max(1, Math.min(TOTAL_EPISODES, parsedEp))` and synchronizing `window.history.replaceState` on episode switch aligns `NovelView` with `MovieView`.
6. **Inference 3**: Refining `MovieView.tsx` to clamp `parsedEp` via `Math.max(1, Math.min(TOTAL_EPISODES, parsedEp))` when `!isNaN(parsedEp)` ensures out-of-bounds parameters (e.g. `?ep=999` -> 40, `?ep=-5` -> 1) clamp rather than resetting unexpectedly.
7. **Premise 3 (`Obs 4`)**: LocalStorage entries may become corrupted or hold primitives. Functions returning typed records must defensively guard returned structures.
8. **Inference 4**: Validating `parsed && typeof parsed === 'object' && !Array.isArray(parsed) && typeof parsed.scrollY === 'number' && typeof parsed.progressPct === 'number'` ensures `loadEpisodeScrollState` returns strictly valid `EpisodeScrollData` or `null`, immediately resolving the 3 `Storage-ScrollState` failures.
9. **Inference 5**: Checking `parsed && typeof parsed === 'object' && !Array.isArray(parsed)` in `claimedRewards` parsing in `NovelView.tsx` and `MovieView.tsx` prevents runtime `TypeError: Cannot convert undefined or null to object` when keys contain `"null"`.

---

## 3. Caveats

- **Test Harness Synchronization**: In `scripts/challenger_empirical_stress.ts`, line 139 currently has `passed: !novelUrlCheck.readFromUrl`. Once `NovelView.tsx` is updated to support URL search parameters, this assertion must be inverted to `passed: novelUrlCheck.readFromUrl` so that it verifies deep-linking actively works.
- **Main Test Suite Update**: `scripts/verify_ip_trilogy.ts` line 902 should be updated from `novelContent.includes('w-7 h-7')` to also check `novelContent.includes('min-h-[36px]') || novelContent.includes('min-h-[32px]')` for permanent regression prevention.
- **No Scope Drift**: These changes are purely surgical styling, type guards, and parameter clamping. They do not alter narrative text, image assets, or audio synthesizer pipelines.

---

## 4. Conclusion

The 4 issues discovered by Challenger 1 are fully analyzed with exact file locations and replacement snippets detailed in `/Users/dayyoung/project/snshero/.agents/teamwork/remediation_explorer_2/remediation_report.md`.

The concrete remediation plan encompasses:
1. Upgrading 17 interactive controls across `src/views/NovelView.tsx` (15), `src/components/movie/CinematicMoviePlayer.tsx` (1), and `src/components/webtoon/WebtoonPanelCard.tsx` (1) to `min-h-[44px]`.
2. Implementing URL search parameter parsing (`?ep=` and `?episode=`) with `[1, TOTAL_EPISODES]` clamping and `window.history.replaceState` sync in `src/views/NovelView.tsx`.
3. Updating parameter clamping in `src/views/MovieView.tsx` to clamp out-of-bounds queries to `1` or `40`.
4. Adding defensive type guards to `loadEpisodeScrollState` in `src/lib/webtoonProgress.ts` and `claimedRewards` parsing in `NovelView.tsx` / `MovieView.tsx`.
5. Updating the assertion in `scripts/challenger_empirical_stress.ts` and `scripts/verify_ip_trilogy.ts`.

---

## 5. Verification Method

Once implemented, the changes can be independently verified using:

```bash
# 1. Verify TypeScript type safety (must pass with 0 errors)
npx tsc --noEmit

# 2. Run the empirical stress test harness (must pass 58/58 tests)
npx tsx scripts/challenger_empirical_stress.ts

# 3. Run the primary IP Trilogy verification harness (must pass 32/32 tests)
npx tsx scripts/verify_ip_trilogy.ts

# 4. Production build test (must succeed with 0 errors)
npm run build
```

### Invalidation Conditions
- Any interactive control in `NovelView.tsx`, `WebtoonPanelCard.tsx`, or `CinematicMoviePlayer.tsx` remaining below `min-h-[44px]`.
- Navigating to `/?view=novel&ep=25` failing to load Episode 25 on mount.
- Passing corrupted strings like `"true"` or `"99999"` into LocalStorage causing `loadEpisodeScrollState` to return a primitive.
