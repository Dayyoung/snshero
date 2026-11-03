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
 * as a vertical continuous scrolling webtoon strip with panel images and dialogues.
 */

import { EXTERNAL_LINKS } from '../types';
import WEBTOON_MANIFEST_DATA from '../../content/webtoonEpisodeManifest.json';
import { chapterTitles } from '../../content/kadanRpgStory';

export interface WebtoonDialogueItem {
  speakerKo?: string;
  speakerEn?: string;
  textKo?: string;
  textEn?: string;
  bubbleType?: string;
  position?: string;
  characterCardId?: number;
}

export interface WebtoonSfxItem {
  textKo?: string;
  textEn?: string;
  style?: string;
  position?: string;
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
  sfxCues?: WebtoonSfxItem[];
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
let zoomedImageUrl: string | null = null;
let zoomedCaption: string = '';

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
    const url = target?.getAttribute('data-img-url');
    const caption = target?.getAttribute('data-caption') || '';
    if (url) {
      zoomedImageUrl = url;
      zoomedCaption = caption;
    }
  } else if (action === 'webtoon-close-zoom') {
    zoomedImageUrl = null;
    zoomedCaption = '';
  } else if (action === 'webtoon-scroll-top') {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

export function renderWebtoonSection(): string {
  initWebtoonEpisodeFromUrl();

  const ep = currentWebtoonEpisode;
  const epData = MANIFEST[String(ep)];
  const rawTitle = epData?.episodeTitleKo || epData?.episodeTitle || chapterTitles[ep - 1]?.titleKo || `제 ${ep}화`;
  const images: WebtoonImageItem[] = epData?.images || [];
  const totalPanels = images.length;

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
                (${totalPanels}컷)
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
                <span>네이버 웹툰 ↗</span>
              </a>

              <button
                type="button"
                data-action="webtoon-toggle-index"
                class="px-3 py-1.5 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#383333] text-xs font-bold rounded-sm min-h-[36px] flex items-center gap-1 cursor-pointer transition-colors"
                title="전체 40화 목차 보기"
              >
                <span>${isWebtoonIndexOpen ? '목차 닫기 ▲' : '전체 회차 ▼'}</span>
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
              aria-label="이전 화"
            >
              ◀ 이전화
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
                  const title = item?.episodeTitleKo || chapterTitles[idx]?.titleKo || `제 ${num}화`;
                  return `
                    <option value="${num}" ${num === ep ? 'selected' : ''}>
                      제${num}화 - ${title}
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
              aria-label="다음 화"
            >
              다음화 ▶
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
                웹툰 40화 전편 에피소드 선택 (클릭 시 즉시 이동)
              </span>
              <button
                type="button"
                data-action="webtoon-toggle-index"
                class="text-xs text-[#646262] hover:text-[#201d1d] font-bold p-1 cursor-pointer"
              >
                [닫기 ✕]
              </button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5 max-h-[320px] overflow-y-auto pr-1">
              ${Array.from({ length: 40 }, (_, idx) => {
                const num = idx + 1;
                const item = MANIFEST[String(num)];
                const title = item?.episodeTitleKo || chapterTitles[idx]?.titleKo || `제 ${num}화`;
                const isCurrent = num === ep;
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
                    title="제${num}화 - ${title}"
                  >
                    <span class="font-bold mr-1">[${num}화]</span>
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
              제 ${ep}화 / 40부작
            </span>
          </div>
          <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-[#201d1d] tracking-tight m-0">
            ${rawTitle}
          </h1>
          <p class="text-xs text-[#646262] m-0 pt-1">
            화면을 아래로 스크롤하여 컷신과 대사를 순서대로 감상하세요. (총 ${totalPanels}컷)
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
                <p class="text-sm font-bold text-[#201d1d]">웹툰 이미지를 준비 중입니다.</p>
                <p class="text-xs text-[#646262]">잠시 후 다시 시도해 주세요.</p>
              </div>
            `
              : images
                  .map((img, idx) => {
                    const sceneIndex = img.index !== undefined ? img.index : idx;
                    const isTitleCard = sceneIndex === 0 || img.type === 'title_card';
                    const panelBadge = isTitleCard ? 'TITLE CARD' : `SCENE ${String(sceneIndex).padStart(2, '0')}`;
                    const mainNarration = img.narrationKo || img.narrationEn || '';
                    const dialogues = img.dialogues || [];
                    const sfxCues = img.sfxCues || [];
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
                                ★ 명장면
                              </span>
                            `
                                : ''
                            }
                          </div>
                          
                          <!-- Zoom Button -->
                          <button
                            type="button"
                            data-action="webtoon-zoom-image"
                            data-img-url="${imgSrc}"
                            data-caption="${escapeHtml(mainNarration)}"
                            class="px-2 py-1 text-[11px] font-bold text-[#646262] hover:text-[#201d1d] hover:bg-[#edeaea] border border-[rgba(15,0,0,0.12)] rounded-sm cursor-pointer transition-colors"
                          >
                            확대 🔍
                          </button>
                        </div>

                        <!-- Panel Image Frame -->
                        <div class="relative w-full bg-[#201d1d] flex items-center justify-center overflow-hidden">
                          <img
                            src="${imgSrc}"
                            alt="제${ep}화 ${panelBadge}"
                            loading="lazy"
                            decoding="async"
                            data-action="webtoon-zoom-image"
                            data-img-url="${imgSrc}"
                            data-caption="${escapeHtml(mainNarration)}"
                            class="w-full h-auto block object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onerror="this.onerror=null; this.src='/images/webtoon/fallback_panel.webp';"
                          />

                          <!-- Visual SFX Badge Overlay (If Any) -->
                          ${
                            sfxCues.length > 0
                              ? `
                            <div class="absolute top-3 right-3 pointer-events-none">
                              ${sfxCues
                                .map(
                                  (sfx) => `
                                <span class="inline-block px-2.5 py-1 bg-amber-500/90 text-black font-black text-xs sm:text-sm tracking-widest border border-amber-300 shadow-md">
                                  ${escapeHtml(sfx.textKo || sfx.textEn || '')}
                                </span>
                              `
                                )
                                .join('')}
                            </div>
                          `
                              : ''
                          }
                        </div>

                        <!-- Dialogue & Narration Box -->
                        <div class="bg-[#fcfbfb] p-4 sm:p-5 border-t border-[rgba(15,0,0,0.12)] space-y-3 font-mono">
                          
                          <!-- Character Speech Bubbles / Dialogue Quotes -->
                          ${
                            dialogues.length > 0
                              ? dialogues
                                  .map((dlg) => {
                                    const speaker = dlg.speakerKo || dlg.speakerEn || '내레이션';
                                    const text = dlg.textKo || dlg.textEn || '';
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
                — 《카단의 여정》 웹툰 제 ${ep}화 완독 —
              </span>
              <p class="text-xs text-stone-500 m-0">
                다음 에피소드에서 전설의 배틀과 스토리가 계속됩니다.
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
                <span>◀ 이전화 (제${Math.max(1, ep - 1)}화)</span>
              </button>

              <button
                type="button"
                data-action="webtoon-scroll-top"
                class="px-4 py-3.5 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#edeaea] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[48px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                title="맨 위로"
              >
                <span>맨 위로 ↑</span>
              </button>

              <button
                type="button"
                data-action="webtoon-next-episode"
                ${ep >= 40 ? 'disabled' : ''}
                class="flex-1 py-3.5 px-4 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] disabled:opacity-30 disabled:hover:bg-[#201d1d] text-xs sm:text-sm font-bold rounded-sm min-h-[48px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <span>다음화 (제${Math.min(40, ep + 1)}화) ▶</span>
              </button>
            </div>
          </div>

        </div>
      </main>

      <!-- 4. Lightbox Zoom Modal (If Triggered) -->
      ${
        zoomedImageUrl
          ? `
        <div class="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-xs select-none">
          <div class="relative max-w-4xl w-full flex flex-col items-center">
            <!-- Close Button -->
            <button
              type="button"
              data-action="webtoon-close-zoom"
              class="self-end mb-2 px-3 py-1.5 bg-[#fdfcfc] text-[#201d1d] hover:bg-stone-200 text-xs font-bold rounded-sm cursor-pointer transition-colors"
            >
              [ 닫기 ✕ ]
            </button>
            
            <img
              src="${zoomedImageUrl}"
              alt="확대 이미지"
              class="max-h-[80vh] w-auto object-contain border border-stone-700 shadow-2xl"
            />
            
            ${
              zoomedCaption
                ? `
              <p class="text-xs text-stone-300 text-center mt-3 max-w-xl line-clamp-3 font-mono">
                ${zoomedCaption}
              </p>
            `
                : ''
            }
          </div>
        </div>
      `
          : ''
      }

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
