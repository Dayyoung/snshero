/**
 * src/landing/views/BookSection.tsx
 *
 * Official 40-Episode Web Novel Reader View for SNSHero Static Landing (#book).
 * Strictly complies with DESIGN.md OpenCode Terminal-Flat design:
 *   - Monospace typography (font-mono)
 *   - Flat surfaces (#fdfcfc, #201d1d) with 1px hairline borders
 *   - 0px container radii (rounded-none), max 4px button/badge radii (rounded-sm)
 *   - 44px+ minimum touch targets for all interactive controls
 *
 * Renders the unabridged canonical text from public/book/episode_*.md.
 * Features:
 *   - Episode switcher (<select>, Prev/Next buttons, and full 40-episode index accordion drawer)
 *   - Clean, immersive reading layout without distracting UI clutter
 *   - Font size adjustment (A-, A+)
 *   - Hash query (?ep=N) synchronization
 */

import { EXTERNAL_LINKS } from '../types';
import { getNovelRawEpisode } from '../../content/novelRawEpisodes';
import { chapterTitles } from '../../content/kadanRpgStory';

let currentBookEpisode: number = 1;
let isEpisodeListOpen: boolean = false;
let bookFontSize: 'normal' | 'large' | 'xlarge' = 'normal';

export function getBookEpisode(): number {
  return currentBookEpisode;
}

function scrollToTopPage(): void {
  if (typeof window === 'undefined') return;
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
}

export function setBookEpisode(ep: number, updateUrl: boolean = true): void {
  if (typeof ep !== 'number' || isNaN(ep)) ep = 1;
  currentBookEpisode = Math.max(1, Math.min(40, Math.floor(ep)));

  if (updateUrl && typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href);
      url.hash = `book?ep=${currentBookEpisode}`;
      window.history.replaceState({ view: 'book', ep: currentBookEpisode }, '', url.toString());
    } catch {
      // Ignore if URL replacement fails in sandbox
    }
    scrollToTopPage();
  }
}

export function initBookEpisodeFromUrl(): void {
  if (typeof window === 'undefined') return;
  const hash = window.location.hash || '';
  const match = hash.match(/ep=(\d+)/);
  if (match && match[1]) {
    const epNum = parseInt(match[1], 10);
    if (!isNaN(epNum) && epNum >= 1 && epNum <= 40) {
      currentBookEpisode = epNum;
    }
  }
}

export function handleBookAction(action: string, target?: HTMLElement): void {
  if (action === 'book-prev-episode') {
    if (currentBookEpisode > 1) {
      setBookEpisode(currentBookEpisode - 1);
    }
  } else if (action === 'book-next-episode') {
    if (currentBookEpisode < 40) {
      setBookEpisode(currentBookEpisode + 1);
    }
  } else if (action === 'book-jump-episode') {
    const epAttr = target?.getAttribute('data-episode');
    if (epAttr) {
      const epNum = parseInt(epAttr, 10);
      if (!isNaN(epNum)) {
        setBookEpisode(epNum);
        isEpisodeListOpen = false;
      }
    }
  } else if (action === 'book-select-episode') {
    const select = target as HTMLSelectElement | null;
    if (select && select.value) {
      const val = parseInt(select.value, 10);
      if (!isNaN(val)) setBookEpisode(val);
    }
  } else if (action === 'book-toggle-index') {
    isEpisodeListOpen = !isEpisodeListOpen;
  } else if (action === 'book-font-normal') {
    bookFontSize = 'normal';
  } else if (action === 'book-font-large') {
    bookFontSize = 'large';
  } else if (action === 'book-font-xlarge') {
    bookFontSize = 'xlarge';
  } else if (action === 'book-scroll-top') {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

/**
 * Parses raw markdown novel text into structured sections:
 * Title, Scope citation, and paragraphs/dialogues.
 */
interface ParsedNovel {
  mainTitle: string;
  sourceScope: string;
  paragraphs: string[];
}

function parseRawNovel(rawText: string, fallbackEp: number): ParsedNovel {
  if (!rawText || !rawText.trim()) {
    return {
      mainTitle: `눈히어로.com - 카단의 여정 제 ${fallbackEp}화`,
      sourceScope: '',
      paragraphs: ['소설 본문을 불러오는 중입니다...'],
    };
  }

  const lines = rawText.split('\n');
  let mainTitle = '';
  let sourceScope = '';
  const bodyLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!mainTitle && line.startsWith('# ')) {
      mainTitle = line.replace(/^#\s*/, '').trim();
    } else if (!sourceScope && line.startsWith('> ')) {
      sourceScope = line.replace(/^>\s*/, '').trim();
    } else {
      bodyLines.push(lines[i]);
    }
  }

  // Join and split by double newlines to form pure paragraphs
  const rawParagraphs = bodyLines.join('\n').split(/\n\s*\n/);
  const cleanParagraphs: string[] = [];

  for (const para of rawParagraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    // Strip trailing promotion or delimiter blocks if present
    if (trimmed.startsWith('==') || trimmed.includes('소설 관련 카드게임 플레이를 원하시나요')) {
      continue;
    }
    cleanParagraphs.push(trimmed);
  }

  if (!mainTitle) {
    mainTitle = `눈히어로.com - 카단의 여정 제 ${fallbackEp}화`;
  }

  return {
    mainTitle,
    sourceScope,
    paragraphs: cleanParagraphs,
  };
}

export function renderBookSection(): string {
  initBookEpisodeFromUrl();

  const ep = currentBookEpisode;
  const rawContent = getNovelRawEpisode(ep);
  const parsed = parseRawNovel(rawContent, ep);
  const epTitle = chapterTitles[ep - 1]?.titleKo || `제 ${ep}화`;

  const fontClass =
    bookFontSize === 'xlarge'
      ? 'text-[18px] sm:text-[21px] leading-[2.3]'
      : bookFontSize === 'large'
      ? 'text-[16px] sm:text-[19px] leading-[2.1]'
      : 'text-[15px] sm:text-[17px] leading-[1.9]';

  return `
    <div class="w-full flex flex-col font-mono text-[#201d1d] select-none bg-[#fdfcfc]">
      <!-- 1. Header Navigation Bar -->
      <section class="w-full bg-[#fdfcfc] border-b border-[rgba(15,0,0,0.12)] sticky top-0 z-30 shadow-xs">
        <div class="w-full max-w-5xl mx-auto px-4 py-3 sm:px-6">
          <div class="flex flex-wrap items-center justify-between gap-2.5">
            <!-- Left: Title & Episode Badge -->
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-wider uppercase">
                EP.${String(ep).padStart(2, '0')}
              </span>
              <span class="text-xs sm:text-sm font-black text-[#201d1d] truncate max-w-[200px] sm:max-w-md">
                ${epTitle}
              </span>
            </div>

            <!-- Right: Font Sizing & Index Drawer Toggle -->
            <div class="flex items-center gap-1.5">
              <!-- Font Size Buttons -->
              <div class="flex items-center border border-[rgba(15,0,0,0.12)] rounded-sm overflow-hidden bg-[#f8f7f7]">
                <button
                  type="button"
                  data-action="book-font-normal"
                  class="px-2.5 py-1 text-xs font-bold ${bookFontSize === 'normal' ? 'bg-[#201d1d] text-[#fdfcfc]' : 'text-[#646262] hover:bg-[#f1eeee]'} cursor-pointer"
                  title="보통 글자"
                >
                  기본
                </button>
                <button
                  type="button"
                  data-action="book-font-large"
                  class="px-2.5 py-1 text-xs font-bold ${bookFontSize === 'large' ? 'bg-[#201d1d] text-[#fdfcfc]' : 'text-[#646262] hover:bg-[#f1eeee]'} cursor-pointer border-l border-[rgba(15,0,0,0.12)]"
                  title="큰 글자"
                >
                  크게
                </button>
                <button
                  type="button"
                  data-action="book-font-xlarge"
                  class="px-2.5 py-1 text-xs font-bold ${bookFontSize === 'xlarge' ? 'bg-[#201d1d] text-[#fdfcfc]' : 'text-[#646262] hover:bg-[#f1eeee]'} cursor-pointer border-l border-[rgba(15,0,0,0.12)]"
                  title="아주 큰 글자"
                >
                  더크게
                </button>
              </div>

              <!-- Full Episode List Toggle -->
              <button
                type="button"
                data-action="book-toggle-index"
                class="px-3 py-1.5 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#f1eeee] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[36px] flex items-center gap-1 cursor-pointer transition-colors"
                title="전체 40화 목차 보기"
              >
                <span>${isEpisodeListOpen ? '목차 닫기 ▲' : '전체 목차 ▼'}</span>
              </button>
            </div>
          </div>

          <!-- Quick Episode Controls Bar -->
          <div class="flex items-center justify-between gap-2 pt-3 border-t border-[rgba(15,0,0,0.08)] mt-2">
            <!-- Prev Episode Button -->
            <button
              type="button"
              data-action="book-prev-episode"
              ${ep <= 1 ? 'disabled' : ''}
              class="px-3 py-2 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] disabled:opacity-30 disabled:hover:bg-[#201d1d] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors"
              aria-label="이전 화"
            >
              ◀ 이전화
            </button>

            <!-- Dropdown Episode Selector -->
            <div class="flex items-center gap-1.5 flex-1 max-w-xs mx-auto">
              <select
                id="book-episode-select"
                data-action="book-select-episode"
                class="w-full px-2.5 py-2 bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] cursor-pointer focus:outline-none focus:border-[#201d1d] text-center"
              >
                ${Array.from({ length: 40 }, (_, idx) => {
                  const num = idx + 1;
                  const title = chapterTitles[idx]?.titleKo || `제 ${num}화`;
                  return `
                    <option value="${num}" ${num === ep ? 'selected' : ''}>
                      제${num}화 - ${title}
                    </option>
                  `;
                }).join('')}
              </select>
            </div>

            <!-- Next Episode Button -->
            <button
              type="button"
              data-action="book-next-episode"
              ${ep >= 40 ? 'disabled' : ''}
              class="px-3 py-2 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] disabled:opacity-30 disabled:hover:bg-[#201d1d] text-xs font-bold rounded-sm min-h-[44px] flex items-center gap-1 cursor-pointer transition-colors"
              aria-label="다음 화"
            >
              다음화 ▶
            </button>
          </div>
        </div>

        <!-- 40-Episode Accordion Drawer (If Toggled Open) -->
        ${
          isEpisodeListOpen
            ? `
          <div class="w-full max-w-5xl mx-auto px-4 py-4 sm:px-6 bg-[#f8f7f7] border-t border-[rgba(15,0,0,0.12)]">
            <div class="flex items-center justify-between pb-2 mb-3 border-b border-[rgba(15,0,0,0.12)]">
              <span class="text-xs font-black text-[#201d1d]">
                카단의 여정 40화 전편 목차 (원하는 화를 클릭하면 즉시 이동합니다)
              </span>
              <button
                type="button"
                data-action="book-toggle-index"
                class="text-xs text-[#646262] hover:text-[#201d1d] font-bold p-1 cursor-pointer"
              >
                [닫기 ✕]
              </button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5 max-h-[320px] overflow-y-auto pr-1">
              ${Array.from({ length: 40 }, (_, idx) => {
                const num = idx + 1;
                const title = chapterTitles[idx]?.titleKo || `제 ${num}화`;
                const isCurrent = num === ep;
                return `
                  <button
                    type="button"
                    data-action="book-jump-episode"
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

      <!-- 2. Pure Novel Content Body -->
      <main class="w-full py-8 sm:py-14 px-4 sm:px-6 md:px-8 bg-[#fdfcfc]">
        <article class="w-full max-w-3xl mx-auto space-y-8 select-text">
          
          <!-- Novel Title Header -->
          <header class="space-y-3 pb-6 border-b border-[rgba(15,0,0,0.12)] text-center sm:text-left">
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span class="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm tracking-widest uppercase">
                CANONICAL NOVEL
              </span>
              <span class="text-xs font-bold text-amber-700">
                제 ${ep}화 / 총 40화 완결
              </span>
            </div>

            <h1 class="text-xl sm:text-2xl md:text-3xl font-black text-[#201d1d] tracking-tight m-0 leading-snug">
              ${parsed.mainTitle}
            </h1>

            ${
              parsed.sourceScope
                ? `
              <div class="inline-block px-3 py-1.5 bg-[#f8f7f7] border-l-3 border-[#201d1d] text-xs font-semibold text-[#646262]">
                ${parsed.sourceScope}
              </div>
            `
                : ''
            }
          </header>

          <!-- Novel Paragraphs (Pure Text Only) -->
          <div class="space-y-6 sm:space-y-7 ${fontClass} text-[#201d1d] font-normal">
            ${parsed.paragraphs
              .map((para) => {
                // If the paragraph is dialogue (starts with Korean/standard quotation mark)
                const isDialogue =
                  para.startsWith('“') ||
                  para.startsWith('"') ||
                  para.startsWith('\'') ||
                  para.startsWith('‘') ||
                  para.startsWith('「');

                if (isDialogue) {
                  return `
                    <p class="m-0 font-medium text-[#111111] pl-2 sm:pl-3 border-l-2 border-stone-400 bg-stone-50/60 py-1 rounded-none">
                      ${escapeHtml(para)}
                    </p>
                  `;
                }

                return `
                  <p class="m-0 text-stone-900 text-justify">
                    ${escapeHtml(para)}
                  </p>
                `;
              })
              .join('')}
          </div>

          <!-- Episode Completion Endmark -->
          <div class="pt-10 pb-6 text-center border-t border-[rgba(15,0,0,0.12)] space-y-2">
            <span class="text-xs font-bold text-[#646262] tracking-widest uppercase">
              — 《카단의 여정》 제 ${ep}화 끝 —
            </span>
            <p class="text-xs text-stone-500 m-0">
              다음 화에서 카단과 수호자들의 모험이 계속 이어집니다.
            </p>
          </div>

          <!-- Bottom Big Navigation Buttons -->
          <div class="flex items-center justify-between gap-3 pt-4 border-t border-[rgba(15,0,0,0.12)]">
            <button
              type="button"
              data-action="book-prev-episode"
              ${ep <= 1 ? 'disabled' : ''}
              class="flex-1 py-3.5 px-4 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] disabled:opacity-30 disabled:hover:bg-[#201d1d] text-xs sm:text-sm font-bold rounded-sm min-h-[48px] flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>◀ 이전화 (제${Math.max(1, ep - 1)}화)</span>
            </button>

            <button
              type="button"
              data-action="book-scroll-top"
              class="px-4 py-3.5 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#f1eeee] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[48px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
              title="맨 위로"
            >
              <span>맨 위로 ↑</span>
            </button>

            <button
              type="button"
              data-action="book-next-episode"
              ${ep >= 40 ? 'disabled' : ''}
              class="flex-1 py-3.5 px-4 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#302c2c] disabled:opacity-30 disabled:hover:bg-[#201d1d] text-xs sm:text-sm font-bold rounded-sm min-h-[48px] flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>다음화 (제${Math.min(40, ep + 1)}화) ▶</span>
            </button>
          </div>

          <!-- External Official Serialization Links -->
          <div class="mt-8 p-4 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-3">
            <span class="text-xs font-bold text-[#646262]">공식 연재처 바로가기:</span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <a
                href="${EXTERNAL_LINKS.naverNovel}"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-2 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#edeaea] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center text-center no-underline"
              >
                네이버 시리즈 ↗
              </a>
              <a
                href="${EXTERNAL_LINKS.munpiaNovel}"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-2 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#edeaea] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center text-center no-underline"
              >
                문피아 소설 ↗
              </a>
              <a
                href="https://page.kakao.com"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-2 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#edeaea] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center text-center no-underline"
              >
                카카오페이지 ↗
              </a>
              <a
                href="https://ridibooks.com"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-2 bg-[#fdfcfc] text-[#201d1d] hover:bg-[#edeaea] border border-[rgba(15,0,0,0.12)] text-xs font-bold rounded-sm min-h-[44px] flex items-center justify-center text-center no-underline"
              >
                리디북스 ↗
              </a>
            </div>
          </div>

        </article>
      </main>
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
