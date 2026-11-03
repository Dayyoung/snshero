/**
 * src/landing/views/WebtoonSection.tsx
 *
 * Official 40-Episode Webtoon / Cartoon Reader View for SNSHero Static Landing (#webtoon).
 * Strictly complies with DESIGN.md OpenCode Terminal-Flat design:
 *   - Monospace typography (font-mono)
 *   - Flat surfaces (#fdfcfc, #201d1d) with 1px hairline borders
 *   - 0px container radii (rounded-none), max 4px button/badge radii (rounded-sm)
 *   - 44px+ minimum touch targets for all interactive controls
 *
 * Displays all 40 episodes (840+ panels) of 《눈히어로.com - 카단의 여정》
 * as a vertical continuous scrolling webtoon strip with panel images and clean dialogues.
 * Special visual effect letters (SFX cues) are cleanly removed.
 * Fullscreen / Lightbox mode features Left/Right pagination buttons with auto-advance to next episode.
 */

import { EXTERNAL_LINKS } from '../types';
import WEBTOON_MANIFEST_DATA from '../../content/webtoonEpisodeManifest.json';
import { chapterTitles } from '../../content/kadanRpgStory';
import { isKoreanLanguage, tr } from '../services/i18n';

export interface WebtoonDialogueItem {
  speakerKo?: string;
  speakerEn?: string;
  textKo?: string;
  textEn?: string;
  bubbleType?: string;
  position?: string;
  characterCardId?: number;
}

export interface WebtoonImageItem {
  index: number;
  fileName?: string;
  imageUrl: string;
  localArtUrl?: string;
  type?: string;
  narrationKo?: string;
  narrationEn?: string;
  characters?: string[];
  background?: string;
  dialogues?: WebtoonDialogueItem[];
  isKeyClimax?: boolean;
}

export interface WebtoonManifestEpisode {
  episodeNumber: number;
  episodeTitle: string;
  episodeTitleKo?: string;
  totalImages: number;
  images: WebtoonImageItem[];
}

const MANIFEST = WEBTOON_MANIFEST_DATA as unknown as Record<string, WebtoonManifestEpisode>;

let currentWebtoonEpisode: number = 1;
let isWebtoonIndexOpen: boolean = false;

// Lightbox (Fullscreen Zoom) State
let zoomedEpisode: number = 1;
let zoomedSceneIndex: number | null = null; // null indicates lightbox is closed

export function getWebtoonEpisodeNum(): number {
  return currentWebtoonEpisode;
}

export function setWebtoonEpisodeNum(ep: number, updateUrl: boolean = true): void {
  if (typeof ep !== 'number' || isNaN(ep)) ep = 1;
  currentWebtoonEpisode = Math.max(1, Math.min(40, Math.floor(ep)));

  if (updateUrl && typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href);
      url.hash = `webtoon?ep=${currentWebtoonEpisode}`;
      window.history.replaceState({ view: 'webtoon', ep: currentWebtoonEpisode }, '', url.toString());
    } catch {
      // Ignore URL replacement errors in sandboxed iframes
    }
  }
}

export function initWebtoonEpisodeFromUrl(): void {
  if (typeof window === 'undefined') return;
  const hash = window.location.hash || '';
  const match = hash.match(/ep=(\d+)/);
  if (match && match[1]) {
    const epNum = parseInt(match[1], 10);
    if (!isNaN(epNum) && epNum >= 1 && epNum <= 40) {
      currentWebtoonEpisode = epNum;
    }
  }
}

export function isWebtoonLightboxOpen(): boolean {
  return zoomedSceneIndex !== null;
}

export function closeWebtoonLightbox(): void {
  zoomedSceneIndex = null;
}

export function handleWebtoonAction(action: string, target?: HTMLElement): void {
  if (action === 'webtoon-prev-episode') {
    if (currentWebtoonEpisode > 1) {
      setWebtoonEpisodeNum(currentWebtoonEpisode - 1);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } else if (action === 'webtoon-next-episode') {
    if (currentWebtoonEpisode < 40) {
      setWebtoonEpisodeNum(currentWebtoonEpisode + 1);
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } else if (action === 'webtoon-jump-episode') {
    const epAttr = target?.getAttribute('data-episode');
    if (epAttr) {
      const epNum = parseInt(epAttr, 10);
      if (!isNaN(epNum)) {
        setWebtoonEpisodeNum(epNum);
        isWebtoonIndexOpen = false;
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  } else if (action === 'webtoon-select-episode') {
    const select = target as HTMLSelectElement | null;
    if (select && select.value) {
      const val = parseInt(select.value, 10);
      if (!isNaN(val)) {
        setWebtoonEpisodeNum(val);
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  } else if (action === 'webtoon-toggle-index') {
    isWebtoonIndexOpen = !isWebtoonIndexOpen;
  } else if (action === 'webtoon-zoom-image') {
    const epAttr = target?.getAttribute('data-episode');
    const sceneAttr = target?.getAttribute('data-scene-index');
    const epNum = epAttr ? parseInt(epAttr, 10) : currentWebtoonEpisode;
    const sceneIdx = sceneAttr ? parseInt(sceneAttr, 10) : 0;
    
    zoomedEpisode = isNaN(epNum) ? currentWebtoonEpisode : Math.max(1, Math.min(40, epNum));
    zoomedSceneIndex = isNaN(sceneIdx) ? 0 : Math.max(0, sceneIdx);
  } else if (action === 'webtoon-close-zoom') {
    zoomedSceneIndex = null;
  } else if (action === 'webtoon-lightbox-prev') {
    if (zoomedSceneIndex === null) return;
    if (zoomedSceneIndex > 0) {
      zoomedSceneIndex -= 1;
    } else if (zoomedEpisode > 1) {
      // Move to the last panel of previous episode
      zoomedEpisode -= 1;
      setWebtoonEpisodeNum(zoomedEpisode);
      const prevImages = MANIFEST[String(zoomedEpisode)]?.images || [];
      zoomedSceneIndex = Math.max(0, prevImages.length - 1);
    }
  } else if (action === 'webtoon-lightbox-next') {
    if (zoomedSceneIndex === null) return;
    const curImages = MANIFEST[String(zoomedEpisode)]?.images || [];
    if (zoomedSceneIndex < curImages.length - 1) {
      zoomedSceneIndex += 1;
    } else if (zoomedEpisode < 40) {
      // Reached the end of current episode -> Advance to next episode
      zoomedEpisode += 1;
      setWebtoonEpisodeNum(zoomedEpisode);
      zoomedSceneIndex = 0;
    }
  } else if (action === 'webtoon-scroll-top') {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

export function renderWebtoonSection(): string {
  initWebtoonEpisodeFromUrl();

  const ep = currentWebtoonEpisode;
  const isKo = isKoreanLanguage();
  const epData = MANIFEST[String(ep)];
  const rawTitle = isKo
    ? epData?.episodeTitleKo || chapterTitles[ep - 1]?.titleKo || epData?.episodeTitle || `제 ${ep}화`
    : epData?.episodeTitle || chapterTitles[ep - 1]?.titleEn || epData?.episodeTitleKo || `Episode ${ep}`;
  const images: WebtoonImageItem[] = epData?.images || [];
  const totalPanels = images.length;

  // Build Lightbox modal HTML if active
  let lightboxModalHtml = '';
  if (zoomedSceneIndex !== null) {
    const curEp = zoomedEpisode;
    const curEpData = MANIFEST[String(curEp)];
    const curTitle = isKo
      ? curEpData?.episodeTitleKo || chapterTitles[curEp - 1]?.titleKo || curEpData?.episodeTitle || `제 ${curEp}화`
      : curEpData?.episodeTitle || chapterTitles[curEp - 1]?.titleEn || curEpData?.episodeTitleKo || `Episode ${curEp}`;
    const curImages = curEpData?.images || [];
    const maxIdx = Math.max(0, curImages.length - 1);
    const validIdx = Math.max(0, Math.min(maxIdx, zoomedSceneIndex));
    const activeImage: WebtoonImageItem | undefined = curImages[validIdx];

    const imgSrc = activeImage?.imageUrl || activeImage?.localArtUrl || '';
    const narration = isKo
      ? activeImage?.narrationKo || activeImage?.narrationEn || ''
      : activeImage?.narrationEn || activeImage?.narrationKo || '';
    const dialogues = activeImage?.dialogues || [];
    const isFirstPanelOfFirstEp = curEp <= 1 && validIdx <= 0;
    const isLastPanelOfLastEp = curEp >= 40 && validIdx >= maxIdx;
    const isAtEpisodeEnd = validIdx >= maxIdx;

    lightboxModalHtml = `
      <div
        id="webtoon-lightbox-modal"
        class="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-2 sm:p-4 font-mono select-none backdrop-blur-md"
      >
        <!-- Lightbox Top Controls Bar -->
        <header class="w-full max-w-6xl mx-auto flex items-center justify-between gap-3 px-2 sm:px-4 py-2 border-b border-stone-800 text-[#fdfcfc] shrink-0">
          <div class="flex items-center gap-2 truncate">
            <span class="px-2 py-0.5 bg-[#fdfcfc] text-[#201d1d] text-[10px] font-bold rounded-sm tracking-wider uppercase shrink-0">
              EP.${String(curEp).padStart(2, '0')}
            </span>
            <span class="text-xs sm:text-sm font-bold text-stone-200 truncate">
              ${isKo ? `제${curEp}화` : `EP.${String(curEp).padStart(2, '0')}`} ${curTitle}
            </span>
            <span class="text-xs text-stone-400 font-mono shrink-0">
              [${validIdx + 1} / ${curImages.length}]
            </span>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              data-action="webtoon-close-zoom"
              class="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-[#fdfcfc] text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center gap-1 cursor-pointer transition-colors border border-stone-600"
              title="${tr('전체화면 닫기 (ESC)', 'Close Fullscreen (ESC)', '全画面を閉じる (ESC)')}"
            >
              <span>✕ ${tr('닫기', 'Close', '閉じる')}</span>
            </button>
          </div>
        </header>

        <!-- Lightbox Center: Image with Left / Right Navigation Buttons -->
        <div class="relative w-full flex-1 flex items-center justify-center my-2 overflow-hidden px-1 sm:px-16">
          
          <!-- Prev Button (Left) -->
          <button
            type="button"
            data-action="webtoon-lightbox-prev"
            ${isFirstPanelOfFirstEp ? 'disabled' : ''}
            class="absolute left-2 sm:left-4 z-20 w-12 sm:w-16 h-16 sm:h-24 bg-black/60 hover:bg-black/90 text-[#fdfcfc] disabled:opacity-20 disabled:hover:bg-black/40 border border-stone-700 hover:border-white text-xl sm:text-2xl font-black rounded-sm flex items-center justify-center cursor-pointer transition-all shadow-lg active:scale-95"
            aria-label="${tr('이전 컷 보기', 'Previous Panel', '前のカット')}"
            title="${validIdx === 0 && curEp > 1 ? tr('이전 화 마지막 컷으로 이동', 'Go to last panel of previous episode', '前話の最後のカットへ移動') : tr('이전 컷 (◀)', 'Previous Panel (◀)', '前のカット (◀)')}"
          >
            ◀
          </button>

          <!-- Current Panel Image -->
          <div class="relative max-h-full max-w-full flex items-center justify-center">
            <img
              src="${imgSrc}"
              alt="EP.${curEp} #${validIdx + 1}"
              class="max-h-[60vh] sm:max-h-[72vh] md:max-h-[76vh] w-auto max-w-full object-contain border border-stone-800 shadow-2xl transition-all"
              onerror="this.onerror=null; this.src='/images/webtoon/fallback_panel.webp';"
            />
          </div>

          <!-- Next Button (Right) -->
          <button
            type="button"
            data-action="webtoon-lightbox-next"
            ${isLastPanelOfLastEp ? 'disabled' : ''}
            class="absolute right-2 sm:right-4 z-20 w-12 sm:w-16 h-16 sm:h-24 bg-black/60 hover:bg-black/90 text-[#fdfcfc] disabled:opacity-20 disabled:hover:bg-black/40 border ${
              isAtEpisodeEnd ? 'border-amber-400 text-amber-300' : 'border-stone-700 hover:border-white'
            } text-xl sm:text-2xl font-black rounded-sm flex flex-col items-center justify-center cursor-pointer transition-all shadow-lg active:scale-95"
            aria-label="${tr('다음 컷 보기', 'Next Panel', '次のカット')}"
            title="${isAtEpisodeEnd ? tr('다음 화로 이동 (▶)', 'Go to Next Episode (▶)', '次話へ移動 (▶)') : tr('다음 컷 (▶)', 'Next Panel (▶)', '次のカット (▶)')}"
          >
            <span>▶</span>
            ${
              isAtEpisodeEnd && curEp < 40
                ? `<span class="text-[9px] font-bold tracking-tight text-amber-300 uppercase mt-0.5">${tr('다음화', 'NEXT EP', '次話')}</span>`
                : ''
            }
          </button>
        </div>

        <!-- Lightbox Bottom Dialogue & Caption Bar -->
        <footer class="w-full max-w-4xl mx-auto px-4 py-3 bg-stone-900/90 border border-stone-800 rounded-sm text-[#fdfcfc] space-y-2 shrink-0">
          <div class="flex items-center justify-between text-[11px] text-stone-400 pb-1 border-b border-stone-800">
            <div class="flex items-center gap-2">
              <span class="font-bold text-stone-200">
                ${validIdx === 0 ? 'TITLE CARD' : `SCENE #${String(validIdx).padStart(2, '0')}`}
              </span>
              ${
                activeImage?.isKeyClimax
                  ? `<span class="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold rounded-sm">★ ${tr('명장면', 'CLIMAX', '名場面')}</span>`
                  : ''
              }
            </div>
            <div class="flex items-center gap-1.5 text-xs">
              <span class="text-stone-400">${tr('컷', 'Panel', 'カット')}</span>
              <span class="text-amber-400 font-bold">${validIdx + 1}</span>
              <span class="text-stone-500">/</span>
              <span>${curImages.length}</span>
              ${
                isAtEpisodeEnd && curEp < 40
                  ? `<span class="ml-2 px-1.5 py-0.5 bg-amber-600 text-white font-bold text-[10px] rounded-sm">▶ ${tr('누르면 다음 화 이동', 'Click ▶ for Next Episode', '▶で次話へ移動')}</span>`
                  : ''
              }
            </div>
          </div>

          <!-- Dialogues & Clean Narration (Zero SFX letters) -->
          <div class="max-h-24 sm:max-h-28 overflow-y-auto space-y-1.5 text-xs sm:text-sm pr-1">
            ${
              dialogues.length > 0
                ? dialogues
                    .map((dlg) => {
                      const speaker = isKo
                        ? dlg.speakerKo || dlg.speakerEn || '내레이션'
                        : dlg.speakerEn || dlg.speakerKo || 'Narration';
                      const text = isKo
                        ? dlg.textKo || dlg.textEn || ''
                        : dlg.textEn || dlg.textKo || '';
                      const isNarration = speaker === '내레이션' || speaker === 'Narration';

                      if (isNarration) {
                        return `
                          <div class="text-stone-300 leading-relaxed border-l-2 border-amber-500 pl-2 py-0.5">
                            ${escapeHtml(text)}
                          </div>
                        `;
                      }

                      return `
                        <div class="flex items-start gap-2 text-stone-100 leading-relaxed">
                          <span class="px-1.5 py-0.2 bg-stone-800 text-amber-300 text-[11px] font-bold rounded-xs shrink-0">
                            [${escapeHtml(speaker)}]
                          </span>
                          <span class="font-medium">
                            “${escapeHtml(text.replace(/^[“"']+|[”"']+$/g, ''))}”
                          </span>
                        </div>
                      `;
                    })
                    .join('')
                : narration
                ? `
                <div class="text-stone-300 leading-relaxed border-l-2 border-stone-600 pl-2 py-0.5">
                  ${escapeHtml(narration)}
                </div>
              `
                : `
                <div class="text-stone-500 text-xs italic">
                  ${tr('대사 및 내레이션이 없는 씬입니다.', 'No dialogue or narration in this scene.', 'セリフ・ナレーションのないシーンです。')}
                </div>
              `
            }
          </div>
        </footer>
      </div>
    `;
  }

  return `
    <div class="w-full flex flex-col font-mono text-[#201d1d] select-none bg-[#fdfcfc]">
      <!-- 1. Sticky Header Controls Bar -->
      <section class="w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] sticky top-0 z-30 shadow-xs">
        <div class="w-full max-w-4xl mx-auto px-4 py-3 sm:px-6">
          <div class="flex flex-wrap items-center justify-between gap-2.5">
            <!-- Left: Badge & Title -->
            <div class="flex items-center gap-2 truncate">
              <span class="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-wider uppercase shrink-0">
                WEBTOON EP.${String(ep).padStart(2, '0')}
              </span>
              <span class="text-xs sm:text-sm font-black text-[#201d1d] truncate">
                ${rawTitle}
              </span>
              <span class="text-[11px] text-[#646262] font-semibold shrink-0 hidden sm:inline">
                (${totalPanels}${tr('컷', ' panels', 'カット')})
              </span>
            </div>

            <!-- Right: External Link & Index Toggle -->
            <div class="flex items-center gap-1.5 shrink-0">
              <a
                href="${EXTERNAL_LINKS.naverWebtoon}"
                target="_blank"
                rel="noopener noreferrer"
                class="px-2.5 py-1.5 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#edeaea] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[36px] flex items-center gap-1 no-underline transition-colors"
              >
                <span>${tr('네이버 웹툰 ↗', 'Naver Webtoon ↗', 'NAVERウェブトゥーン ↗')}</span>
              </a>

              <button
                type="button"
                data-action="webtoon-toggle-index"
                class="px-3 py-1.5 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#383333] text-xs font-bold rounded-sm min-h-[36px] flex items-center gap-1 cursor-pointer transition-colors"
                title="${tr('전체 40화 목차 보기', 'View All 40 Episodes', '全40話の目次を表示')}"
              >
                <span>${isWebtoonIndexOpen ? tr('목차 닫기 ▲', 'Close Index ▲', '目次を閉じる ▲') : tr('전체 회차 ▼', 'All Episodes ▼', '全話一覧 ▼')}</span>
              </button>
            </div>
          </div>

          <!-- Quick Navigation Bar -->
          <div class="flex items-center justify-between gap-2 pt-3 border-t border-[rgba(15,0,0,0.08)] mt-2">
            <!-- Prev Episode -->
            <button
              type="button"
              data-action="webtoon-prev-episode"
              ${ep <= 1 ? 'disabled' : ''}
              class="px-3 py-2 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] disabled:opacity-30 disabled:hover:bg-[#201d1d] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors"
              aria-label="${tr('이전 화', 'Previous Episode', '前の話')}"
            >
              ◀ ${tr('이전화', 'Prev', '前話')}
            </button>

            <!-- Dropdown Episode Selector -->
            <div class="flex items-center gap-1.5 flex-1 max-w-xs mx-auto">
              <select
                id="webtoon-episode-select"
                data-action="webtoon-select-episode"
                class="w-full px-2.5 py-2 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] cursor-pointer focus:outline-none focus:border-[#201d1d] text-center"
              >
                ${Array.from({ length: 40 }, (_, idx) => {
                  const num = idx + 1;
                  const item = MANIFEST[String(num)];
                  const title = isKo
                    ? item?.episodeTitleKo || chapterTitles[idx]?.titleKo || item?.episodeTitle || `제 ${num}화`
                    : item?.episodeTitle || chapterTitles[idx]?.titleEn || item?.episodeTitleKo || `Episode ${num}`;
                  const epPrefix = isKo ? `제${num}화` : `EP.${String(num).padStart(2, '0')}`;
                  return `
                    <option value="${num}" ${num === ep ? 'selected' : ''}>
                      ${epPrefix} - ${title}
                    </option>
                  `;
                }).join('')}
              </select>
            </div>

            <!-- Next Episode -->
            <button
              type="button"
              data-action="webtoon-next-episode"
              ${ep >= 40 ? 'disabled' : ''}
              class="px-3 py-2 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] disabled:opacity-30 disabled:hover:bg-[#201d1d] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors"
              aria-label="${tr('다음 화', 'Next Episode', '次の話')}"
            >
              ${tr('다음화', 'Next', '次話')} ▶
            </button>
          </div>
        </div>

        <!-- 40-Episode Quick Drawer (If Toggled Open) -->
        ${
          isWebtoonIndexOpen
            ? `
          <div class="w-full max-w-4xl mx-auto px-4 py-4 sm:px-6 bg-[#f8f7f7] border-t border-[rgba(15,0,0,0.12)]">
            <div class="flex items-center justify-between pb-2 mb-3 border-b border-[rgba(15,0,0,0.12)]">
              <span class="text-xs font-black text-[#201d1d]">
                ${tr(
                  '웹툰 40화 전편 에피소드 선택 (클릭 시 즉시 이동)',
                  'Select from all 40 Webtoon Episodes (Click to jump)',
                  'ウェブトゥーン全40話選択（クリックで移動）'
                )}
              </span>
              <button
                type="button"
                data-action="webtoon-toggle-index"
                class="text-xs text-[#646262] hover:text-[#201d1d] font-bold p-1 cursor-pointer"
              >
                [${tr('닫기', 'Close', '閉じる')} ✕]
              </button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5 max-h-[320px] overflow-y-auto pr-1">
              ${Array.from({ length: 40 }, (_, idx) => {
                const num = idx + 1;
                const item = MANIFEST[String(num)];
                const title = isKo
                  ? item?.episodeTitleKo || chapterTitles[idx]?.titleKo || item?.episodeTitle || `제 ${num}화`
                  : item?.episodeTitle || chapterTitles[idx]?.titleEn || item?.episodeTitleKo || `Episode ${num}`;
                const isCurrent = num === ep;
                const epBadge = isKo ? `[${num}화]` : `[EP.${String(num).padStart(2, '0')}]`;
                return `
                  <button
                    type="button"
                    data-action="webtoon-jump-episode"
                    data-episode="${num}"
                    class="px-2 py-2 text-left text-xs rounded-sm border transition-colors truncate min-h-[40px] cursor-pointer ${
                      isCurrent
                        ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] font-bold'
                        : 'bg-[#fdfcfc] text-[#201d1d] border-[rgba(15,0,0,0.12)] hover:bg-[#edeaea]'
                    }"
                    title="${epBadge} ${title}"
                  >
                    <span class="font-bold mr-1">${epBadge}</span>
                    <span class="truncate">${title}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        `
            : ''
        }
      </section>

      <!-- 2. Episode Banner Card -->
      <section class="w-full bg-[#f8f7f7] border-b border-[rgba(15,0,0,0.12)] py-6 sm:py-8 px-4 text-center">
        <div class="w-full max-w-3xl mx-auto space-y-2">
          <div class="flex items-center justify-center gap-2">
            <span class="px-2.5 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-widest uppercase">
              CANONICAL WEBTOON STRIP
            </span>
            <span class="text-xs font-bold text-amber-700">
              ${tr(`제 ${ep}화 / 40부작`, `Episode ${ep} / 40 Series`, `第${ep}話 / 全40部作`)}
            </span>
          </div>
          <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-[#201d1d] tracking-tight m-0">
            ${rawTitle}
          </h1>
          <p class="text-xs text-[#646262] m-0 pt-1">
            ${tr(
              `화면을 아래로 스크롤하여 컷신과 대사를 순서대로 감상하세요. (총 ${totalPanels}컷 · 클릭 시 전체화면 좌우 넘김 지원)`,
              `Scroll down to read panels and dialogues in sequence. (${totalPanels} panels total · Click any panel for fullscreen reader)`,
              `下にスクロールしてカットとセリフを順番にお楽しみください。（全${totalPanels}カット・クリックで全画面左右ページめくり対応）`
            )}
          </p>
        </div>
      </section>

      <!-- 3. Vertical Continuous Scroll Webtoon Strip -->
      <main class="w-full py-6 sm:py-10 px-2 sm:px-4 bg-[#fdfcfc]">
        <div class="w-full max-w-2xl sm:max-w-3xl mx-auto space-y-8 sm:space-y-12">
          
          ${
            images.length === 0
              ? `
              <div class="p-8 text-center border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] space-y-2">
                <p class="text-sm font-bold text-[#201d1d]">${tr('웹툰 이미지를 준비 중입니다.', 'Preparing webtoon panels...', 'ウェブトゥーン画像を準備中です。')}</p>
                <p class="text-xs text-[#646262]">${tr('잠시 후 다시 시도해 주세요.', 'Please try again shortly.', 'しばらくしてから再度お試しください。')}</p>
              </div>
            `
              : images
                  .map((img, idx) => {
                    const sceneIndex = img.index !== undefined ? img.index : idx;
                    const isTitleCard = sceneIndex === 0 || img.type === 'title_card';
                    const panelBadge = isTitleCard ? 'TITLE CARD' : `SCENE ${String(sceneIndex).padStart(2, '0')}`;
                    const mainNarration = isKo
                      ? img.narrationKo || img.narrationEn || ''
                      : img.narrationEn || img.narrationKo || '';
                    const dialogues = img.dialogues || [];
                    const imgSrc = img.imageUrl || img.localArtUrl || '';

                    return `
                      <!-- Single Webtoon Panel Card (Vertical Flow) -->
                      <article class="w-full bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-none overflow-hidden shadow-xs">
                        
                        <!-- Panel Header -->
                        <div class="bg-[#f8f7f7] border-b border-[rgba(15,0,0,0.12)] px-3 py-2 flex items-center justify-between text-xs">
                          <div class="flex items-center gap-2">
                            <span class="w-2 h-2 bg-[#201d1d] inline-block"></span>
                            <span class="font-bold text-[#201d1d] uppercase tracking-wider">
                              ${panelBadge}
                            </span>
                            ${
                              img.isKeyClimax
                                ? `
                              <span class="px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold rounded-sm">
                                ★ ${tr('명장면', 'CLIMAX', '名場面')}
                              </span>
                            `
                                : ''
                            }
                          </div>
                          
                          <!-- Zoom Fullscreen Button -->
                          <button
                            type="button"
                            data-action="webtoon-zoom-image"
                            data-episode="${ep}"
                            data-scene-index="${sceneIndex}"
                            class="px-2 py-1 text-[11px] font-bold text-[#646262] hover:text-[#201d1d] hover:bg-[#edeaea] border border-[rgba(15,0,0,0.12)] rounded-sm cursor-pointer transition-colors"
                          >
                            ${tr('전체화면 🔍', 'Fullscreen 🔍', '全画面 🔍')}
                          </button>
                        </div>

                        <!-- Panel Image Frame (Clean Image, Zero SFX letters) -->
                        <div class="relative w-full bg-[#201d1d] flex items-center justify-center overflow-hidden">
                          <img
                            src="${imgSrc}"
                            alt="EP.${ep} ${panelBadge}"
                            loading="lazy"
                            decoding="async"
                            data-action="webtoon-zoom-image"
                            data-episode="${ep}"
                            data-scene-index="${sceneIndex}"
                            class="w-full h-auto block object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onerror="this.onerror=null; this.src='/images/webtoon/fallback_panel.webp';"
                            title="${tr('클릭하여 전체화면 모드로 감상', 'Click to view in fullscreen mode', 'クリックして全画面モードで鑑賞')}"
                          />
                        </div>

                        <!-- Dialogue & Narration Box -->
                        <div class="bg-[#fcfbfb] p-4 sm:p-5 border-t border-[rgba(15,0,0,0.12)] space-y-3 font-mono">
                          
                          <!-- Character Speech Bubbles / Dialogue Quotes -->
                          ${
                            dialogues.length > 0
                              ? dialogues
                                  .map((dlg) => {
                                    const speaker = isKo
                                      ? dlg.speakerKo || dlg.speakerEn || '내레이션'
                                      : dlg.speakerEn || dlg.speakerKo || 'Narration';
                                    const text = isKo
                                      ? dlg.textKo || dlg.textEn || ''
                                      : dlg.textEn || dlg.textKo || '';
                                    const isNarration = speaker === '내레이션' || speaker === 'Narration';

                                    if (isNarration) {
                                      return `
                                        <div class="p-3 bg-[#f8f7f7] border-l-3 border-[#201d1d] text-xs sm:text-sm leading-relaxed text-[#201d1d] select-text">
                                          ${escapeHtml(text)}
                                        </div>
                                      `;
                                    }

                                    return `
                                      <div class="flex items-start gap-2.5 p-3 bg-white border border-[rgba(15,0,0,0.12)] rounded-sm select-text">
                                        <div class="shrink-0">
                                          <span class="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[11px] font-bold rounded-sm tracking-wide">
                                            ${escapeHtml(speaker)}
                                          </span>
                                        </div>
                                        <div class="flex-1 text-xs sm:text-sm leading-relaxed text-[#111111] font-medium pt-0.5">
                                          “${escapeHtml(text.replace(/^[“"']+|[”"']+$/g, ''))}”
                                        </div>
                                      </div>
                                    `;
                                  })
                                  .join('')
                              : mainNarration
                              ? `
                              <div class="p-3 bg-[#f8f7f7] border-l-3 border-[#201d1d] text-xs sm:text-sm leading-relaxed text-[#201d1d] select-text">
                                ${escapeHtml(mainNarration)}
                              </div>
                            `
                              : ''
                          }

                          ${
                            // If there are dialogues AND a separate main narration that is not duplicate
                            dialogues.length > 0 &&
                            mainNarration &&
                            !dialogues.some((d) => d.textKo === mainNarration || d.textEn === mainNarration)
                              ? `
                              <div class="text-xs text-stone-600 leading-relaxed italic border-t border-[rgba(15,0,0,0.08)] pt-2 select-text">
                                ※ ${escapeHtml(mainNarration)}
                              </div>
                            `
                              : ''
                          }

                        </div>

                      </article>
                    `;
                  })
                  .join('')
          }

          <!-- Bottom Endmark & Navigation -->
          <div class="pt-8 pb-4 text-center border-t border-[rgba(15,0,0,0.12)] space-y-4">
            <div class="space-y-1">
              <span class="text-xs font-bold text-[#646262] tracking-widest uppercase">
                ${tr(
                  `— 《카단의 여정》 웹툰 제 ${ep}화 완독 —`,
                  `— End of Kadan's Journey Webtoon Episode ${ep} —`,
                  `— 《カダンの旅》 ウェブトゥーン 第${ep}話 読了 —`
                )}
              </span>
              <p class="text-xs text-stone-500 m-0">
                ${tr(
                  '다음 에피소드에서 전설의 배틀과 스토리가 계속됩니다.',
                  'The legendary battles and story continue in the next episode.',
                  '次のエピソードでも伝説のバトルと物語が続きます。'
                )}
              </p>
            </div>

            <!-- Big Prev / Top / Next Navigation Buttons -->
            <div class="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                data-action="webtoon-prev-episode"
                ${ep <= 1 ? 'disabled' : ''}
                class="flex-1 py-3.5 px-4 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] disabled:opacity-30 disabled:hover:bg-[#201d1d] text-xs sm:text-sm font-bold rounded-sm min-h-[48px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>◀ ${tr(`이전화 (제${Math.max(1, ep - 1)}화)`, `Prev (EP.${Math.max(1, ep - 1)})`, `前話 (第${Math.max(1, ep - 1)}話)`)}</span>
              </button>

              <button
                type="button"
                data-action="webtoon-scroll-top"
                class="px-4 py-3.5 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#edeaea] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[48px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                title="${tr('맨 위로', 'Back to Top', 'ページ上部へ')}"
              >
                <span>${tr('맨 위로 ↑', 'Top ↑', '上へ ↑')}</span>
              </button>

              <button
                type="button"
                data-action="webtoon-next-episode"
                ${ep >= 40 ? 'disabled' : ''}
                class="flex-1 py-3.5 px-4 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] disabled:opacity-30 disabled:hover:bg-[#201d1d] text-xs sm:text-sm font-bold rounded-sm min-h-[48px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>${tr(`다음화 (제${Math.min(40, ep + 1)}화)`, `Next (EP.${Math.min(40, ep + 1)})`, `次話 (第${Math.min(40, ep + 1)}話)`)} ▶</span>
              </button>
            </div>
          </div>

        </div>
      </main>

      <!-- 4. Lightbox Fullscreen Modal with Left/Right Buttons & Auto-advance -->
      ${lightboxModalHtml}

    </div>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
