/**
 * src/landing/views/BookSection.tsx
 *
 * Official 40-Episode Web Novel Reader View for SNSHero Static Landing (#book).
 * Strictly complies with DESIGN.md OpenCode Terminal-Flat design:
 *   - Monospace typography (font-mono)
 *   - Flat surfaces (#fdfcfc, #201d1d) with 1px hairline borders
 *   - 0px container radii (rounded-none), max 4px button/badge radii (rounded-sm)
 *   - 44px+ minimum touch targets for all interactive elements
 *
 * Displays all 40 unabridged episodes of 《눈히어로.com - 카단의 여정》
 * with episode switcher, chapter metadata, dialogue quotes, and official serialization links.
 */

import { EXTERNAL_LINKS } from '../types';
import { KADAN_RPG_NOVEL_SCRIPTS } from '../../content/kadanRpgNovelScript';
import { chapterTitles } from '../../content/kadanRpgStory';
import { getCutoutUrl } from '../services/assetCatalog';

let currentBookEpisode: number = 1;

export function getBookEpisode(): number {
  return currentBookEpisode;
}

export function setBookEpisode(ep: number): void {
  if (typeof ep !== 'number' || isNaN(ep)) ep = 1;
  currentBookEpisode = Math.max(1, Math.min(40, Math.floor(ep)));
}

export function handleBookAction(action: string, target?: HTMLElement): void {
  if (action === 'book-prev-episode') {
    if (currentBookEpisode > 1) {
      currentBookEpisode -= 1;
    }
  } else if (action === 'book-next-episode') {
    if (currentBookEpisode < 40) {
      currentBookEpisode += 1;
    }
  } else if (action === 'book-select-episode') {
    const select = target as HTMLSelectElement | null;
    if (select) {
      const val = parseInt(select.value, 10);
      if (!isNaN(val)) setBookEpisode(val);
    }
  }
}

export function renderBookSection(): string {
  const ep = currentBookEpisode;
  const scriptLines = KADAN_RPG_NOVEL_SCRIPTS[ep] || [];
  const epTitle = chapterTitles[ep - 1] || `제 ${ep}화`;

  return `
    <div class="w-full flex flex-col font-mono text-[#201d1d] select-none">
      <!-- 1. Header Banner & Title -->
      <section class="w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] py-8 sm:py-12 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-5xl mx-auto space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(15,0,0,0.12)] pb-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-wider uppercase">
                  OFFICIAL WEB NOVEL
                </span>
                <span class="text-xs text-[#646262] font-bold">
                  40부작 완결 공식 웹소설
                </span>
              </div>
              <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-[#201d1d] tracking-tight m-0">
                눈히어로.com - 카단의 여정
              </h1>
            </div>

            <!-- External Serialization Links (Naver & Munpia) -->
            <div class="flex flex-wrap items-center gap-2">
              <a
                href="${EXTERNAL_LINKS.naverNovel}"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-2 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#f1eeee] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1.5 transition-colors no-underline"
              >
                <span>네이버 웹소설 ↗</span>
              </a>
              <a
                href="${EXTERNAL_LINKS.munpiaNovel}"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-2 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#f1eeee] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1.5 transition-colors no-underline"
              >
                <span>문피아 소설 ↗</span>
              </a>
            </div>
          </div>

          <!-- Episode Navigation & Selector Controls -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
            <!-- Prev Button -->
            <button
              type="button"
              data-action="book-prev-episode"
              ${ep <= 1 ? 'disabled' : ''}
              class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] disabled:opacity-40 disabled:hover:bg-[#201d1d] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors"
              aria-label="이전 화로 이동"
            >
              ◀ 이전화
            </button>

            <!-- Episode Selector Dropdown -->
            <div class="flex items-center gap-2 flex-1 max-w-md min-w-[200px]">
              <label for="book-episode-select" class="text-xs font-bold text-[#646262] shrink-0">
                회차 선택:
              </label>
              <select
                id="book-episode-select"
                data-action="book-select-episode"
                class="w-full px-3 py-2.5 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] cursor-pointer focus:outline-none focus:border-[#201d1d]"
              >
                ${Array.from({ length: 40 }, (_, idx) => {
                  const num = idx + 1;
                  const title = chapterTitles[idx] || `제 ${num}화`;
                  return `
                    <option value="${num}" ${num === ep ? 'selected' : ''}>
                      [제${num}화] ${title}
                    </option>
                  `;
                }).join('')}
              </select>
            </div>

            <!-- Next Button -->
            <button
              type="button"
              data-action="book-next-episode"
              ${ep >= 40 ? 'disabled' : ''}
              class="px-4 py-2.5 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] disabled:opacity-40 disabled:hover:bg-[#201d1d] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors"
              aria-label="다음 화로 이동"
            >
              다음화 ▶
            </button>
          </div>
        </div>
      </section>

      <!-- 2. Episode Reading Body -->
      <section class="w-full bg-[#fdfcfc] py-8 sm:py-12 px-4 sm:px-6 md:px-8 lg:px-12">
        <div class="w-full max-w-4xl mx-auto space-y-8">
          
          <!-- Episode Info Header Card -->
          <div class="border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-5 sm:p-6 rounded-none space-y-2">
            <span class="text-xs font-bold text-amber-700 uppercase tracking-widest">
              EPISODE ${String(ep).padStart(2, '0')} / 40
            </span>
            <h2 class="text-lg sm:text-xl md:text-2xl font-black text-[#201d1d] m-0">
              제 ${ep}화 : ${epTitle}
            </h2>
            <p class="text-xs text-stone-600 m-0 pt-1 leading-relaxed">
              카단과 11개 종족의 수호자들이 펼치는 정통 모험 판타지 공식 웹소설 40부작.
            </p>
          </div>

          <!-- Scenes & Paragraphs Content Stream -->
          <article class="space-y-8 text-[#201d1d] leading-relaxed">
            ${
              scriptLines.length > 0
                ? scriptLines
                    .map((line, lineIdx) => {
                      const cutoutUrl = getCutoutUrl(line.cardId || 41);
                      const speakerName = line.name || line.speaker || '내레이션';
                      const isNarrator = line.speaker === 'narrator';

                      // Paragraph splitting
                      const paragraphs = (line.text || '')
                        .split(/\n\n+/)
                        .map((p) => p.trim())
                        .filter((p) => p.length > 0);

                      return `
                        <div class="border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-5 sm:p-7 rounded-none space-y-5">
                          <!-- Scene Title & Speaker Tag -->
                          <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[rgba(15,0,0,0.12)]">
                            <div class="flex items-center gap-2">
                              <span class="w-2 h-2 bg-[#201d1d] inline-block"></span>
                              <span class="text-xs font-bold text-[#201d1d]">
                                [장면 ${lineIdx + 1} / ${scriptLines.length}]
                              </span>
                              ${
                                line.sceneTitleKo
                                  ? `<span class="text-xs text-[#646262] font-medium hidden sm:inline truncate max-w-md">
                                      ${line.sceneTitleKo}
                                    </span>`
                                  : ''
                              }
                            </div>
                            <span class="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm">
                              ${speakerName}
                            </span>
                          </div>

                          <!-- Dialogue Quote Highlight Box (if available) -->
                          ${
                            line.dialogueQuoteKo
                              ? `
                                <div class="p-3.5 sm:p-4 bg-[#181515] text-amber-200 border-l-4 border-amber-400 rounded-none text-xs sm:text-sm font-bold leading-relaxed shadow-sm">
                                  ${line.dialogueQuoteKo}
                                </div>
                              `
                              : ''
                          }

                          <!-- Novel Body Prose -->
                          <div class="space-y-4 text-xs sm:text-sm text-stone-800 leading-relaxed font-sans sm:font-mono">
                            ${paragraphs
                              .map(
                                (para) => `
                              <p class="m-0 break-keep leading-relaxed text-justify">
                                ${para}
                              </p>
                            `
                              )
                              .join('')}
                          </div>

                          <!-- Participating Characters (if available) -->
                          ${
                            line.sceneCharacters && line.sceneCharacters.length > 0
                              ? `
                                <div class="pt-3 border-t border-[rgba(15,0,0,0.08)] flex flex-wrap items-center gap-2">
                                  <span class="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                                    등장인물:
                                  </span>
                                  ${line.sceneCharacters
                                    .map(
                                      (ch) => `
                                    <span class="px-2 py-0.5 bg-[#f1eeee] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-[10px] font-bold rounded-sm">
                                      ${ch.nameKo} (${ch.roleKo || '수호자'})
                                    </span>
                                  `
                                    )
                                    .join('')}
                                </div>
                              `
                              : ''
                          }
                        </div>
                      `;
                    })
                    .join('')
                : `
                  <div class="p-8 text-center text-stone-500 text-sm border border-stone-200">
                    해당 회차의 소설 본문을 불러오는 중입니다...
                  </div>
                `
            }
          </article>

          <!-- Bottom Navigation & Chapter Skip Buttons -->
          <div class="pt-6 border-t border-[rgba(15,0,0,0.12)] flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              data-action="book-prev-episode"
              ${ep <= 1 ? 'disabled' : ''}
              class="px-5 py-3 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] disabled:opacity-40 text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              ◀ 이전 화 (제 ${Math.max(1, ep - 1)}화)
            </button>

            <a
              href="#webtoon"
              data-nav="webtoon"
              class="px-5 py-3 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#f1eeee] border border-[#201d1d] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1.5 transition-colors no-underline cursor-pointer"
            >
              🎨 이 회차 웹툰으로 보기 →
            </a>

            <button
              type="button"
              data-action="book-next-episode"
              ${ep >= 40 ? 'disabled' : ''}
              class="px-5 py-3 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] disabled:opacity-40 text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              다음 화 (제 ${Math.min(40, ep + 1)}화) ▶
            </button>
          </div>
        </div>
      </section>
    </div>
  `;
}
