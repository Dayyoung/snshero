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
 * with scene navigation, image canvas, subtitle narration, and Naver Webtoon links.
 */

import { EXTERNAL_LINKS } from '../types';
import {
  getWebtoonEpisode,
  getWebtoonSceneImageUrl,
  WEBTOON_40_EPISODES,
} from '../services/webtoonCatalog';

let currentWebtoonEpisode: number = 1;
let currentWebtoonScene: number = 0;

export function getWebtoonEpisodeNum(): number {
  return currentWebtoonEpisode;
}

export function setWebtoonEpisodeNum(ep: number): void {
  if (typeof ep !== 'number' || isNaN(ep)) ep = 1;
  currentWebtoonEpisode = Math.max(1, Math.min(40, Math.floor(ep)));
  currentWebtoonScene = 0;
}

export function getWebtoonSceneNum(): number {
  return currentWebtoonScene;
}

export function setWebtoonSceneNum(scene: number): void {
  const epMeta = getWebtoonEpisode(currentWebtoonEpisode);
  if (typeof scene !== 'number' || isNaN(scene)) scene = 0;
  currentWebtoonScene = Math.max(0, Math.min(Math.max(0, epMeta.totalScenes - 1), Math.floor(scene)));
}

export function handleWebtoonAction(action: string, target?: HTMLElement): void {
  const epMeta = getWebtoonEpisode(currentWebtoonEpisode);

  if (action === 'webtoon-prev-scene') {
    if (currentWebtoonScene > 0) {
      currentWebtoonScene -= 1;
    } else if (currentWebtoonEpisode > 1) {
      currentWebtoonEpisode -= 1;
      const prevEpMeta = getWebtoonEpisode(currentWebtoonEpisode);
      currentWebtoonScene = Math.max(0, prevEpMeta.totalScenes - 1);
    }
  } else if (action === 'webtoon-next-scene') {
    if (currentWebtoonScene < epMeta.totalScenes - 1) {
      currentWebtoonScene += 1;
    } else if (currentWebtoonEpisode < 40) {
      currentWebtoonEpisode += 1;
      currentWebtoonScene = 0;
    }
  } else if (action === 'webtoon-prev-episode') {
    if (currentWebtoonEpisode > 1) {
      currentWebtoonEpisode -= 1;
      currentWebtoonScene = 0;
    }
  } else if (action === 'webtoon-next-episode') {
    if (currentWebtoonEpisode < 40) {
      currentWebtoonEpisode += 1;
      currentWebtoonScene = 0;
    }
  } else if (action === 'webtoon-select-episode') {
    const select = target as HTMLSelectElement | null;
    if (select) {
      const val = parseInt(select.value, 10);
      if (!isNaN(val)) setWebtoonEpisodeNum(val);
    }
  } else if (action === 'webtoon-scrub-scene') {
    const input = target as HTMLInputElement | null;
    if (input) {
      const val = parseInt(input.value, 10);
      if (!isNaN(val)) setWebtoonSceneNum(val);
    }
  }
}

export function renderWebtoonSection(): string {
  const ep = currentWebtoonEpisode;
  const scene = currentWebtoonScene;
  const epMeta = getWebtoonEpisode(ep);
  const sceneUrl = getWebtoonSceneImageUrl(ep, scene);
  const total = Math.max(1, epMeta.totalScenes);

  return `
    <div class="w-full flex flex-col font-mono text-[#201d1d] select-none">
      <!-- 1. Header Banner & Title -->
      <section class="w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] py-8 sm:py-12 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-5xl mx-auto space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(15,0,0,0.12)] pb-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-wider uppercase">
                  OFFICIAL WEBTOON
                </span>
                <span class="text-xs text-[#646262] font-bold">
                  840컷+ 풀컬러 판타지 공식 웹툰
                </span>
              </div>
              <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-[#201d1d] tracking-tight m-0">
                눈히어로.com - 카단의 여정 웹툰
              </h1>
            </div>

            <!-- External Serialization Links (Naver Webtoon) -->
            <div class="flex flex-wrap items-center gap-2">
              <a
                href="${EXTERNAL_LINKS.naverWebtoon}"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-2 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#f1eeee] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1.5 transition-colors no-underline"
              >
                <span>네이버 웹툰 공식 연재관 ↗</span>
              </a>
              <a
                href="#book"
                data-nav="book"
                class="px-3 py-2 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#f1eeee] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1.5 transition-colors no-underline"
              >
                <span>📜 공식 웹소설 보기 →</span>
              </a>
            </div>
          </div>

          <!-- Episode Navigation & Selector Controls -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
            <!-- Prev Episode Button -->
            <button
              type="button"
              data-action="webtoon-prev-episode"
              ${ep <= 1 ? 'disabled' : ''}
              class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] disabled:opacity-40 disabled:hover:bg-[#201d1d] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors"
              aria-label="이전 회차로 이동"
            >
              ◀ 이전화
            </button>

            <!-- Episode Selector Dropdown -->
            <div class="flex items-center gap-2 flex-1 max-w-md min-w-[200px]">
              <label for="webtoon-episode-select" class="text-xs font-bold text-[#646262] shrink-0">
                회차 선택:
              </label>
              <select
                id="webtoon-episode-select"
                data-action="webtoon-select-episode"
                class="w-full px-3 py-2.5 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] cursor-pointer focus:outline-none focus:border-[#201d1d]"
              >
                ${WEBTOON_40_EPISODES.map((meta) => {
                  const num = meta.episodeNumber;
                  return `
                    <option value="${num}" ${num === ep ? 'selected' : ''}>
                      [제${num}화] ${meta.titleKo} (${meta.totalScenes}컷)
                    </option>
                  `;
                }).join('')}
              </select>
            </div>

            <!-- Next Episode Button -->
            <button
              type="button"
              data-action="webtoon-next-episode"
              ${ep >= 40 ? 'disabled' : ''}
              class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] disabled:opacity-40 disabled:hover:bg-[#201d1d] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors"
              aria-label="다음 회차로 이동"
            >
              다음화 ▶
            </button>
          </div>
        </div>
      </section>

      <!-- 2. Webtoon Scene Canvas & Controls -->
      <section class="w-full bg-[#0a0808] text-[#fdfcfc] py-6 sm:py-10 px-3 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-4xl mx-auto space-y-4">
          
          <!-- Scene Status Header -->
          <div class="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-stone-400">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 bg-amber-400 text-stone-950 font-black rounded-sm text-[10px]">
                제 ${ep}화
              </span>
              <span class="font-bold text-white truncate max-w-xs sm:max-w-md">
                ${epMeta.titleKo}
              </span>
            </div>
            <div class="font-bold text-amber-400">
              컷 [${scene + 1} / ${total}]
            </div>
          </div>

          <!-- Main Webtoon Scene Image Display Frame -->
          <div class="relative w-full aspect-video bg-[#050404] border border-white/15 rounded-none overflow-hidden flex items-center justify-center shadow-2xl">
            <img
              src="${sceneUrl}"
              alt="${epMeta.titleKo} 씬 ${scene + 1}"
              class="w-full h-full object-contain filter drop-shadow-none"
              onerror="this.src='/images/webtoon/episode_01/scene_00.webp'"
            />

            <!-- Top Left Floating Scene Tag -->
            <div class="absolute top-3 left-3 px-2 py-0.5 bg-[#201d1d]/85 text-[#fdfcfc] border border-white/20 text-[10px] font-bold rounded-sm backdrop-blur-xs">
              SCENE ${String(scene + 1).padStart(2, '0')}
            </div>
          </div>

          <!-- Subtitle & Narration Box -->
          <div class="p-4 sm:p-5 bg-[#141212] border border-amber-400/40 rounded-none space-y-2">
            <div class="flex items-center gap-2 border-b border-white/10 pb-1.5">
              <span class="px-2 py-0.5 bg-amber-400 text-stone-950 text-[10px] font-black rounded-sm">
                ${epMeta.speakerKo || '내레이션'}
              </span>
              <span class="text-xs text-amber-300 font-bold truncate">
                ${epMeta.titleKo}
              </span>
            </div>
            <p class="text-xs sm:text-sm text-stone-200 leading-relaxed m-0 break-keep font-sans sm:font-mono">
              ${epMeta.leadNarrationKo || '라이트헤븐 설산의 맹세부터 이어지는 대서사시.'}
            </p>
          </div>

          <!-- Scene Scrubber & 5-Button Control Bar -->
          <div class="space-y-3 pt-2">
            <!-- Scene Scrubber Range Slider -->
            <div class="flex items-center gap-3 px-2">
              <span class="text-[11px] text-stone-400 font-bold">01</span>
              <input
                type="range"
                min="0"
                max="${Math.max(0, total - 1)}"
                value="${scene}"
                data-action="webtoon-scrub-scene"
                class="w-full accent-amber-400 cursor-pointer h-2 bg-stone-800 rounded-sm"
                aria-label="웹툰 컷 탐색 슬라이더"
              />
              <span class="text-[11px] text-stone-400 font-bold">
                ${String(total).padStart(2, '0')}
              </span>
            </div>

            <!-- Primary Navigation Buttons -->
            <div class="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                data-action="webtoon-prev-scene"
                ${scene <= 0 && ep <= 1 ? 'disabled' : ''}
                class="flex-1 py-3 px-4 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] border border-white/20 text-xs sm:text-sm font-bold rounded-sm min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
                aria-label="이전 컷 보기"
              >
                ◀ 이전 컷
              </button>

              <button
                type="button"
                data-action="webtoon-next-scene"
                ${scene >= total - 1 && ep >= 40 ? 'disabled' : ''}
                class="flex-[2] py-3 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 border border-amber-400 text-xs sm:text-sm font-black rounded-sm min-h-[44px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
                aria-label="다음 컷 보기"
              >
                다음 컷 (진행) ▶
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}
