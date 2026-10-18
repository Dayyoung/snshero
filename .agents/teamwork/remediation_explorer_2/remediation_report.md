# Remediation Report: UI Touch Ergonomics, Deep-Linking Parity & Storage Robustness

- **Author**: `remediation_explorer_2` (teamwork_preview_explorer)
- **Date**: 2026-10-18T07:25:00+09:00
- **Authoritative Spec**: `/Users/dayyoung/project/snshero/PROJECT.md` & `/Users/dayyoung/project/snshero/.agents/teamwork/ORIGINAL_REQUEST.md`
- **Challenger Audit Reference**: `/Users/dayyoung/project/snshero/.agents/teamwork/challenger_1/handoff.md`
- **Scope**: Read-Only Investigation & Implementation-Ready Remediation Plan

---

## 1. Executive Summary

Challenger 1 executed an automated 4-tier empirical stress test suite (`scripts/challenger_empirical_stress.ts`), uncovering 4 distinct failure points across 58 assertions:
1. **17 Substandard Interactive Controls**: Controls with `min-h-[36px]`, `min-h-[32px]`, or `min-h-[28px]` in `NovelView.tsx` (15 controls), `WebtoonPanelCard.tsx` (1 control), and `CinematicMoviePlayer.tsx` (1 control), violating `DESIGN.md`'s mandatory 44px+ mobile touch ergonomics.
2. **Deep-Linking Asymmetry**: `MovieView.tsx` supports URL query parameters (`?ep=` and `?episode=`), but `NovelView.tsx` completely ignores `window.location.search`, preventing deep links like `/book?ep=20` or `/webtoon?ep=20` from navigating to the target episode.
3. **Out-of-Bounds Parameter Clamping Gap**: When `?ep=999` is passed to `MovieView.tsx`, the component checks `parsedEp <= TOTAL_EPISODES`, fails the condition, and falls back to LocalStorage progress (or Ep 1), rather than clamping smoothly to the upper boundary `40`.
4. **Corrupted JSON Storage Type Guard Vulnerability**: In `src/lib/webtoonProgress.ts`, `loadEpisodeScrollState` performs a bare `return JSON.parse(raw);`. When LocalStorage holds valid JSON primitives such as `"true"`, `"false"`, or `"99999"`, `JSON.parse` returns a boolean or number instead of `EpisodeScrollData | null`, violating TypeScript return contracts and causing runtime attribute lookup bugs.

This report establishes the complete, production-grade remediation plan with exact line numbers, before-and-after code blocks, and test verification strategies.

---

## 2. Topic 1: UI Touch Target Ergonomics Remediation (17 Controls)

In accordance with `DESIGN.md` (Terminal Flat Aesthetic: Monospace typography, 1px hairline border, `rounded-sm` [4px] interactive elements, `min-h-[44px]` touch target, `min-w-[44px]` minimum dimension), all 17 interactive elements are cataloged below with exact line numbers and proposed replacements.

### Summary Table of 17 Controls

| # | File Path | Current Line | Current Class / Element | Proposed Replacement Class | Category |
|---|-----------|--------------|-------------------------|----------------------------|----------|
| 1 | `src/views/NovelView.tsx` | 908 | `min-h-[32px] px-2.5 py-1 bg-[#fdfcfc] ...` | `min-h-[44px] px-3 py-2 bg-[#fdfcfc] ... flex items-center justify-center` | Resume Banner Action Button |
| 2 | `src/views/NovelView.tsx` | 915 | `min-h-[32px] min-w-[32px] flex items-center ...` | `min-h-[44px] min-w-[44px] flex items-center justify-center ...` | Resume Banner Dismiss Button |
| 3 | `src/views/NovelView.tsx` | 1121 | `min-h-[36px] text-xs font-bold uppercase ...` | `min-h-[44px] text-xs font-bold uppercase ... px-3 py-2` | Episode Selector Drawer Trigger |
| 4 | `src/views/NovelView.tsx` | 1154 | `min-h-[36px] flex items-center gap-1.5 ...` | `min-h-[44px] flex items-center gap-1.5 ... px-3 py-2` | Featured Character Wiki Chip |
| 5 | `src/views/NovelView.tsx` | 1187 | `min-h-[36px] px-3 py-1 bg-[#201d1d] ...` | `min-h-[44px] px-3.5 py-2 bg-[#201d1d] ...` | TTS Voice Reader: Play Button |
| 6 | `src/views/NovelView.tsx` | 1196 | `min-h-[36px] px-3 py-1 bg-[#201d1d] ...` | `min-h-[44px] px-3.5 py-2 bg-[#201d1d] ...` | TTS Voice Reader: Pause Button |
| 7 | `src/views/NovelView.tsx` | 1205 | `min-h-[36px] px-3 py-1 bg-emerald-700 ...` | `min-h-[44px] px-3.5 py-2 bg-emerald-700 ...` | TTS Voice Reader: Resume Button |
| 8 | `src/views/NovelView.tsx` | 1214 | `min-h-[36px] px-2.5 py-1 bg-[#f1eeee] ...` | `min-h-[44px] px-3 py-2 bg-[#f1eeee] ...` | TTS Voice Reader: Stop Button |
| 9 | `src/views/NovelView.tsx` | 1245 | `min-h-[36px] px-3 py-1 text-[11px] ...` | `min-h-[44px] px-3.5 py-2 text-[11px] ...` | Prompt Mode: Copy 20-Scene Summary |
| 10 | `src/views/NovelView.tsx` | 1298 | `min-h-[36px] px-3 py-1 text-[11px] ...` | `min-h-[44px] px-3.5 py-2 text-[11px] ...` | Prompt Mode: Copy Short Narration |
| 11 | `src/views/NovelView.tsx` | 1357 | `min-h-[36px] px-3 py-1 text-[11px] ...` | `min-h-[44px] px-3.5 py-2 text-[11px] ...` | Prompt Mode: Copy All Character Prompts |
| 12 | `src/views/NovelView.tsx` | 1391 | `min-h-[32px] px-2.5 py-1 text-[10px] ...` | `min-h-[44px] px-3 py-2 text-[11px] ...` | Character Card Action: Wiki |
| 13 | `src/views/NovelView.tsx` | 1402 | `min-h-[32px] px-2.5 py-1 text-[10px] ...` | `min-h-[44px] px-3 py-2 text-[11px] ...` | Character Card Action: Summon |
| 14 | `src/views/NovelView.tsx` | 1413 | `min-h-[32px] px-2.5 py-1 text-[10px] ...` | `min-h-[44px] px-3 py-2 text-[11px] ...` | Character Card Action: Copy Prompt |
| 15 | `src/views/NovelView.tsx` | 1493 | `min-h-[36px] px-3 py-1 text-[11px] ...` | `min-h-[44px] px-3.5 py-2 text-[11px] ...` | Continuous 20 Prompts: Copy All |
| 16 | `src/components/movie/CinematicMoviePlayer.tsx` | 643 | `className="group relative flex-1 min-h-[28px] flex items-center py-2"` | `className="group relative flex-1 min-h-[44px] flex items-center py-2 cursor-pointer"` | 20-Scene Segmented Scrubber Button |
| 17 | `src/components/webtoon/WebtoonPanelCard.tsx` | 80 | `min-h-[32px] px-2.5 py-1 ...` | `min-h-[44px] px-3 py-2 ...` | Webtoon Panel Zoom / Fullscreen Button |

---

### Detailed Code Changes for Topic 1

#### 1. Controls 1 & 2: `src/views/NovelView.tsx` Lines 906–920
**Before**:
```tsx
            <button
              onClick={handleResumeLastScroll}
              className="min-h-[32px] px-2.5 py-1 bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] font-bold rounded-sm cursor-pointer transition-colors text-[11px]"
            >
              [ {language === 'ko' ? '이동' : 'Resume'} ]
            </button>
          </div>
          <button
            onClick={() => setShowResumeBanner(false)}
            className="min-h-[32px] min-w-[32px] flex items-center justify-center text-[#fdfcfc]/70 hover:text-[#fdfcfc] cursor-pointer ml-1"
            title="Dismiss"
          >
            <X size={13} />
          </button>
```

**After**:
```tsx
            <button
              onClick={handleResumeLastScroll}
              className="min-h-[44px] px-3 py-2 bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] font-bold rounded-sm cursor-pointer transition-colors text-[11px] flex items-center justify-center"
            >
              [ {language === 'ko' ? '이동' : 'Resume'} ]
            </button>
          </div>
          <button
            onClick={() => setShowResumeBanner(false)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#fdfcfc]/70 hover:text-[#fdfcfc] hover:bg-white/10 rounded-sm cursor-pointer ml-1 transition-colors"
            title="Dismiss"
          >
            <X size={14} />
          </button>
```

#### 2. Control 3: `src/views/NovelView.tsx` Lines 1116–1127
**Before**:
```tsx
                <button
                  onClick={() => {
                    setShowEpisodeModal(true);
                    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  }}
                  className="min-h-[36px] text-xs font-bold uppercase tracking-widest text-[#201d1d] px-2.5 py-1 border border-[#201d1d] bg-[#f8f7f7] hover:bg-[#f1eeee] rounded-sm flex items-center gap-1 cursor-pointer transition-colors group"
                  title={t('novel_select_episode_hint', language)}
                >
                  <BookOpen size={11} />
                  <span>EPISODE {currentEpisodeNum} / {TOTAL_EPISODES}</span>
                  <ChevronDown size={11} />
                </button>
```

**After**:
```tsx
                <button
                  onClick={() => {
                    setShowEpisodeModal(true);
                    if (playSfx) playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  }}
                  className="min-h-[44px] text-xs font-bold uppercase tracking-widest text-[#201d1d] px-3 py-2 border border-[#201d1d] bg-[#f8f7f7] hover:bg-[#f1eeee] rounded-sm flex items-center gap-1.5 cursor-pointer transition-colors group"
                  title={t('novel_select_episode_hint', language)}
                >
                  <BookOpen size={13} />
                  <span>EPISODE {currentEpisodeNum} / {TOTAL_EPISODES}</span>
                  <ChevronDown size={13} />
                </button>
```

#### 3. Control 4: `src/views/NovelView.tsx` Lines 1151–1166
**Before**:
```tsx
                      <button
                        key={char.cardId}
                        onClick={() => setSelectedWikiCardId(char.cardId)}
                        className="min-h-[36px] flex items-center gap-1.5 px-2.5 py-1 border border-[rgba(15,0,0,0.12)] rounded-sm bg-[#fdfcfc] hover:bg-[#f8f7f7] transition-colors cursor-pointer text-xs font-bold text-[#201d1d]"
                        title={language === 'ko' ? `${char.cardName} 카드 위키 보기` : `View Card Wiki for ${char.cardName}`}
                      >
```

**After**:
```tsx
                      <button
                        key={char.cardId}
                        onClick={() => setSelectedWikiCardId(char.cardId)}
                        className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 border border-[rgba(15,0,0,0.12)] rounded-sm bg-[#fdfcfc] hover:bg-[#f8f7f7] transition-colors cursor-pointer text-xs font-bold text-[#201d1d]"
                        title={language === 'ko' ? `${char.cardName} 카드 위키 보기` : `View Card Wiki for ${char.cardName}`}
                      >
```

#### 4. Controls 5, 6, 7, 8: `src/views/NovelView.tsx` Lines 1184–1219 (TTS Controls)
**Before**:
```tsx
              {!isTtsPlaying && !isTtsPaused && (
                <button
                  onClick={() => startTtsFromParagraph(0)}
                  className="min-h-[36px] px-3 py-1 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:bg-[#201d1d]/90 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Play size={12} /> {t('novel_tts_play', language)}
                </button>
              )}

              {isTtsPlaying && (
                <button
                  onClick={pauseTts}
                  className="min-h-[36px] px-3 py-1 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:bg-[#201d1d]/90 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Pause size={12} /> {t('novel_tts_pause', language)}
                </button>
              )}

              {isTtsPaused && (
                <button
                  onClick={resumeTts}
                  className="min-h-[36px] px-3 py-1 bg-emerald-700 text-[#fdfcfc] text-xs font-bold rounded-sm hover:bg-emerald-800 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Play size={12} /> {language === 'ko' ? '이어서 재생' : 'Resume'}
                </button>
              )}

              {(isTtsPlaying || isTtsPaused) && (
                <button
                  onClick={stopTts}
                  className="min-h-[36px] px-2.5 py-1 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#fdfcfc] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Square size={12} /> Stop
                </button>
              )}
```

**After**:
```tsx
              {!isTtsPlaying && !isTtsPaused && (
                <button
                  onClick={() => startTtsFromParagraph(0)}
                  className="min-h-[44px] px-3.5 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:bg-[#201d1d]/90 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Play size={14} /> {t('novel_tts_play', language)}
                </button>
              )}

              {isTtsPlaying && (
                <button
                  onClick={pauseTts}
                  className="min-h-[44px] px-3.5 py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:bg-[#201d1d]/90 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Pause size={14} /> {t('novel_tts_pause', language)}
                </button>
              )}

              {isTtsPaused && (
                <button
                  onClick={resumeTts}
                  className="min-h-[44px] px-3.5 py-2 bg-emerald-700 text-[#fdfcfc] text-xs font-bold rounded-sm hover:bg-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Play size={14} /> {language === 'ko' ? '이어서 재생' : 'Resume'}
                </button>
              )}

              {(isTtsPlaying || isTtsPaused) && (
                <button
                  onClick={stopTts}
                  className="min-h-[44px] px-3 py-2 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm hover:bg-[#fdfcfc] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Square size={14} /> Stop
                </button>
              )}
```

#### 5. Controls 9, 10, 11: `src/views/NovelView.tsx` Lines 1245, 1298, 1357 (Prompt Copy Headers)
**Before**:
```tsx
// Line 1245:
className="min-h-[36px] px-3 py-1 text-[11px] font-bold border border-[#201d1d] rounded-sm bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] cursor-pointer flex items-center gap-1.5 transition-colors"

// Line 1298:
className="min-h-[36px] px-3 py-1 text-[11px] font-bold border border-[#201d1d] rounded-sm bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] cursor-pointer flex items-center gap-1.5 transition-colors"

// Line 1357:
className="min-h-[36px] px-3 py-1 text-[11px] font-bold border border-[#201d1d] rounded-sm bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] cursor-pointer flex items-center gap-1.5 transition-colors"
```

**After**:
```tsx
// Line 1245:
className="min-h-[44px] px-3.5 py-2 text-[11px] font-bold border border-[#201d1d] rounded-sm bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] cursor-pointer flex items-center gap-1.5 transition-colors"

// Line 1298:
className="min-h-[44px] px-3.5 py-2 text-[11px] font-bold border border-[#201d1d] rounded-sm bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] cursor-pointer flex items-center gap-1.5 transition-colors"

// Line 1357:
className="min-h-[44px] px-3.5 py-2 text-[11px] font-bold border border-[#201d1d] rounded-sm bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] cursor-pointer flex items-center gap-1.5 transition-colors"
```

#### 6. Controls 12, 13, 14: `src/views/NovelView.tsx` Lines 1389–1418 (Character Card Buttons)
**Before**:
```tsx
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedWikiCardId(char.cardId)}
                              className="min-h-[32px] px-2.5 py-1 text-[10px] font-bold border border-[rgba(15,0,0,0.12)] text-[#201d1d] bg-[#fdfcfc] hover:bg-[#f1eeee] rounded-sm cursor-pointer flex items-center gap-1"
                              title={language === 'ko' ? '카드 위키' : 'Card Wiki'}
                            >
                              <ExternalLink size={10} />
                              <span>{language === 'ko' ? '위키' : 'Wiki'}</span>
                            </button>
                            <button
                              onClick={() => {
                                triggerHaptic('tap');
                                onNavigate('shop');
                              }}
                              className="min-h-[32px] px-2.5 py-1 text-[10px] font-bold border border-[#201d1d] text-[#fdfcfc] bg-[#201d1d] hover:bg-[#201d1d]/90 rounded-sm cursor-pointer flex items-center gap-1"
                              title={language === 'ko' ? '상점에서 카드 뽑기' : 'Summon Card in Shop'}
                            >
                              <ShoppingCart size={10} />
                              <span>{language === 'ko' ? '카드 뽑기' : 'Summon'}</span>
                            </button>
                            <button
                              onClick={() => {
                                const singleText = `[Character Art Prompt: ${p.cardNameKo} / ${p.cardNameEn}]\nPrompt: ${p.positivePromptEn}\nNegative: ${p.negativePrompt}\nWebtoon Panel: ${p.webtoonPanelPrompt}`;
                                handleCopyText(singleText, p.cardNameKo);
                              }}
                              className="min-h-[32px] px-2.5 py-1 text-[10px] font-bold border border-[rgba(15,0,0,0.12)] text-[#201d1d] bg-[#fdfcfc] hover:bg-[#f1eeee] rounded-sm cursor-pointer flex items-center gap-1"
                            >
                              <Copy size={10} />
                              <span>{language === 'ko' ? '프롬프트 복사' : 'Copy Prompt'}</span>
                            </button>
                          </div>
```

**After**:
```tsx
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => setSelectedWikiCardId(char.cardId)}
                              className="min-h-[44px] px-3 py-2 text-[11px] font-bold border border-[rgba(15,0,0,0.12)] text-[#201d1d] bg-[#fdfcfc] hover:bg-[#f1eeee] rounded-sm cursor-pointer flex items-center gap-1.5 transition-colors"
                              title={language === 'ko' ? '카드 위키' : 'Card Wiki'}
                            >
                              <ExternalLink size={12} />
                              <span>{language === 'ko' ? '위키' : 'Wiki'}</span>
                            </button>
                            <button
                              onClick={() => {
                                triggerHaptic('tap');
                                onNavigate('shop');
                              }}
                              className="min-h-[44px] px-3 py-2 text-[11px] font-bold border border-[#201d1d] text-[#fdfcfc] bg-[#201d1d] hover:bg-[#201d1d]/90 rounded-sm cursor-pointer flex items-center gap-1.5 transition-colors"
                              title={language === 'ko' ? '상점에서 카드 뽑기' : 'Summon Card in Shop'}
                            >
                              <ShoppingCart size={12} />
                              <span>{language === 'ko' ? '카드 뽑기' : 'Summon'}</span>
                            </button>
                            <button
                              onClick={() => {
                                const singleText = `[Character Art Prompt: ${p.cardNameKo} / ${p.cardNameEn}]\nPrompt: ${p.positivePromptEn}\nNegative: ${p.negativePrompt}\nWebtoon Panel: ${p.webtoonPanelPrompt}`;
                                handleCopyText(singleText, p.cardNameKo);
                              }}
                              className="min-h-[44px] px-3 py-2 text-[11px] font-bold border border-[rgba(15,0,0,0.12)] text-[#201d1d] bg-[#fdfcfc] hover:bg-[#f1eeee] rounded-sm cursor-pointer flex items-center gap-1.5 transition-colors"
                            >
                              <Copy size={12} />
                              <span>{language === 'ko' ? '프롬프트 복사' : 'Copy Prompt'}</span>
                            </button>
                          </div>
```

#### 7. Control 15: `src/views/NovelView.tsx` Line 1493 (Continuous 20 Prompts Copy)
**Before**:
```tsx
                    className="min-h-[36px] px-3 py-1 text-[11px] font-bold border border-[#201d1d] rounded-sm bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] cursor-pointer flex items-center gap-1.5 transition-colors"
```

**After**:
```tsx
                    className="min-h-[44px] px-3.5 py-2 text-[11px] font-bold border border-[#201d1d] rounded-sm bg-[#f8f7f7] hover:bg-[#f1eeee] text-[#201d1d] cursor-pointer flex items-center gap-1.5 transition-colors"
```

#### 8. Control 16: `src/components/movie/CinematicMoviePlayer.tsx` Line 643 (20-Scene Scrubber)
**Before**:
```tsx
              <button
                key={idx}
                onClick={() => handleJumpToScene(idx)}
                className="group relative flex-1 min-h-[28px] flex items-center py-2"
                title={`Jump to Scene ${idx + 1}`}
              >
```

**After**:
```tsx
              <button
                key={idx}
                onClick={() => handleJumpToScene(idx)}
                className="group relative flex-1 min-h-[44px] flex items-center py-2 cursor-pointer"
                title={`Jump to Scene ${idx + 1}`}
              >
```

#### 9. Control 17: `src/components/webtoon/WebtoonPanelCard.tsx` Line 80 (Webtoon Zoom Button)
**Before**:
```tsx
        <button
          onClick={onZoom}
          className="min-h-[32px] px-2.5 py-1 border border-[rgba(15,0,0,0.12)] rounded-sm bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] text-[11px] font-bold cursor-pointer flex items-center gap-1 transition-colors"
          title={language === 'ko' ? '크게 보기' : 'Fullscreen'}
        >
          <Maximize2 size={12} />
          <span>{language === 'ko' ? '확대' : 'Zoom'}</span>
        </button>
```

**After**:
```tsx
        <button
          onClick={onZoom}
          className="min-h-[44px] px-3 py-2 border border-[rgba(15,0,0,0.12)] rounded-sm bg-[#fdfcfc] hover:bg-[#f1eeee] text-[#201d1d] text-[11px] font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
          title={language === 'ko' ? '크게 보기' : 'Fullscreen'}
        >
          <Maximize2 size={14} />
          <span>{language === 'ko' ? '확대' : 'Zoom'}</span>
        </button>
```

---

## 3. Topic 2 & 3: Deep-Linking Query Parameter Handling & Clamping Refinement

### Problem Diagnosis
1. In `src/views/NovelView.tsx` (lines 185–189), `currentEpisodeNum` was initialized solely from `getSeasonItem('hero_novel_progress', currentSeason)`. If a user arrived via deep-link (e.g. `/novel?ep=15` or `?view=webtoon&episode=20`), the query was silently discarded.
2. In `src/views/MovieView.tsx` (lines 66–84), `MovieView` parsed `?ep=` or `?episode=`, but enforced `if (!isNaN(parsedEp) && parsedEp >= 1 && parsedEp <= TOTAL_EPISODES) return parsedEp;`. If an out-of-bounds parameter like `?ep=999` or `?ep=-5` was supplied, it discarded the URL query and fell back to LocalStorage or 1, instead of clamping to `40` or `1`.

### Unified Clamping Standard
For both `NovelView.tsx` and `MovieView.tsx`:
- Parse `window.location.search` for `ep` or `episode`.
- If parameter is provided and not NaN: clamp with `Math.max(1, Math.min(TOTAL_EPISODES, parsedEp))`.
- If parameter is missing or NaN: fall back to LocalStorage value clamped within `[1, TOTAL_EPISODES]`, defaulting to `1`.
- When `currentEpisodeNum` changes: synchronize `window.history.replaceState` with `?ep=${currentEpisodeNum}` without triggering full-page reloading.

### Exact Code Changes

#### 1. In `src/views/NovelView.tsx`
Replace lines 184–190:
```ts
  // Reading episode number (saved in hero_novel_progress_{season}) - URL query (?ep=, ?episode=) takes highest priority with boundary clamping
  const [currentEpisodeNum, setCurrentEpisodeNum] = useState<number>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const epParam = params.get('ep') || params.get('episode');
        if (epParam) {
          const parsedEp = parseInt(epParam, 10);
          if (!isNaN(parsedEp)) {
            return Math.max(1, Math.min(TOTAL_EPISODES, parsedEp));
          }
        }
      }
    } catch {
      // ignore
    }
    const saved = getSeasonItem('hero_novel_progress', currentSeason);
    const parsed = saved ? parseInt(saved, 10) : 1;
    return isNaN(parsed) || parsed < 1 || parsed > TOTAL_EPISODES ? 1 : Math.max(1, Math.min(TOTAL_EPISODES, parsed));
  });
```

And update lines 302–306 in `src/views/NovelView.tsx`:
```ts
  // Save progress on episode change and synchronize browser URL query params
  useEffect(() => {
    setSeasonItem('hero_novel_progress', currentEpisodeNum.toString(), currentSeason);
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('ep') !== currentEpisodeNum.toString()) {
          url.searchParams.set('ep', currentEpisodeNum.toString());
          window.history.replaceState(window.history.state, '', url.pathname + url.search);
        }
      } catch {
        // ignore
      }
    }
  }, [currentEpisodeNum, currentSeason]);
```

#### 2. In `src/views/MovieView.tsx`
Replace lines 65–84 in `src/views/MovieView.tsx`:
```ts
  // 현재 시청 중인 에피소드 번호 (1~40) - URL 쿼리 파라미터(?ep=, ?episode=) 최우선 반영 및 [1, TOTAL_EPISODES] 클램핑
  const [currentEpisodeNum, setCurrentEpisodeNum] = useState<number>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const epParam = params.get('ep') || params.get('episode');
        if (epParam) {
          const parsedEp = parseInt(epParam, 10);
          if (!isNaN(parsedEp)) {
            return Math.max(1, Math.min(TOTAL_EPISODES, parsedEp));
          }
        }
      }
    } catch {
      // ignore
    }
    const saved = getSeasonItem('hero_movie_progress', currentSeason);
    const parsed = saved ? parseInt(saved, 10) : 1;
    return isNaN(parsed) || parsed < 1 || parsed > TOTAL_EPISODES ? 1 : Math.max(1, Math.min(TOTAL_EPISODES, parsed));
  });
```

---

## 4. Topic 4: Defensive Storage Guards (`webtoonProgress.ts` & Views)

### Problem Diagnosis
1. In `src/lib/webtoonProgress.ts` line 188:
   `return JSON.parse(raw);`
   If LocalStorage contains corrupted data such as `'true'`, `'false'`, `'99999'`, or `'[1,2,3]'`, `JSON.parse` evaluates to primitive booleans, numbers, or arrays. The calling code expects an object conforming to `EpisodeScrollData { scrollY: number, progressPct: number, updatedAt: number }`.
2. In `NovelView.tsx` (lines 289–296) and `MovieView.tsx` (lines 361–368):
   `const saved = getSeasonItem('hero_novel_claimed_episodes', currentSeason);`
   `return saved ? JSON.parse(saved) : {};`
   If `saved` is the string `'null'`, `JSON.parse('null')` returns `null`. Subsequently calling `Object.keys(claimedRewards)` throws an unhandled `TypeError: Cannot convert undefined or null to object`.

### Exact Code Changes

#### 1. In `src/lib/webtoonProgress.ts`
Replace `loadEpisodeScrollState` (lines 178–192):
```ts
export function loadEpisodeScrollState(
  season: string,
  episodeNum: number,
  tab: 'cartoon' | 'novel' | 'prompt' = 'cartoon'
): EpisodeScrollData | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = `hero_scroll_state_${season}_${tab}_ep${episodeNum}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      typeof parsed.scrollY === 'number' &&
      typeof parsed.progressPct === 'number' &&
      !isNaN(parsed.scrollY) &&
      !isNaN(parsed.progressPct)
    ) {
      return {
        scrollY: Math.max(0, parsed.scrollY),
        progressPct: Math.min(100, Math.max(0, parsed.progressPct)),
        updatedAt: typeof parsed.updatedAt === 'number' && !isNaN(parsed.updatedAt) ? parsed.updatedAt : Date.now(),
      };
    }
    return null;
  } catch {
    return null;
  }
}
```

#### 2. In `src/views/NovelView.tsx`
Replace lines 289–296:
```ts
  // Claimed Rewards state
  const [claimedRewards, setClaimedRewards] = useState<Record<number, boolean>>(() => {
    try {
      const saved = getSeasonItem('hero_novel_claimed_episodes', currentSeason);
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  });
```

#### 3. In `src/views/MovieView.tsx`
Replace lines 361–368:
```ts
  // 시청 완료 보상 수령 상태 (에피소드별)
  const [claimedRewards, setClaimedRewards] = useState<Record<number, boolean>>(() => {
    try {
      const saved = getSeasonItem('hero_movie_claimed_episodes', currentSeason);
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  });
```

---

## 5. Topic 5: Test Harness Alignment & Invalidation Conditions

### Test Harness Sync in `scripts/challenger_empirical_stress.ts`
When the implementation agent applies these remediations:
1. **NovelView URL Query Test** (line 139):
   In `scripts/challenger_empirical_stress.ts`, line 139 was previously:
   `passed: !novelUrlCheck.readFromUrl, // NovelView intentionally relies on hero_novel_progress`
   With NovelView reading URL search parameters, this assertion should be updated to:
   `passed: novelUrlCheck.readFromUrl`
2. **Movie Clamping Simulation in Test Harness** (lines 73, 114, 115, 119):
   In `scripts/challenger_empirical_stress.ts`, `evaluateMovieViewEpisode` and `testQueries` tested fallback to 1 on out-of-bounds. Update `evaluateMovieViewEpisode` to match the new clamped logic:
   - `?ep=41` -> expected `40` (clamped)
   - `?ep=999` -> expected `40` (clamped)
   - `?episode=999` -> expected `40` (clamped)
   - `?ep=-10` -> expected `1` (clamped)
   - `?episode=-5` -> expected `1` (clamped)
3. **Verify IP Trilogy Harness** (`scripts/verify_ip_trilogy.ts` line 902):
   Update the design check to ensure zero `min-h-[36px]` and zero `min-h-[32px]` exist in `NovelView.tsx`:
   ```ts
   const hasSmallNovelButtons = novelContent.includes('w-7 h-7') || novelContent.includes('min-h-[36px]') || novelContent.includes('min-h-[32px]');
   ```

### Independent Verification Method
```bash
# 1. Verify 0 TypeScript compilation errors
npx tsc --noEmit

# 2. Run the main IP Trilogy verification harness
npx tsx scripts/verify_ip_trilogy.ts

# 3. Run the empirical stress test harness
npx tsx scripts/challenger_empirical_stress.ts
```
**Expected Outcome**: 58/58 tests passing with 0 failures and 0 warnings.
