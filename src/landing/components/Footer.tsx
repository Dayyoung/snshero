/**
 * src/landing/components/Footer.tsx
 *
 * Terminal-Flat footer component for SNSHero Static Landing.
 * Features OpenCode monospace layout, external novel/webtoon links, and copyright info.
 * Pure TypeScript template string generator (Zero React runtime).
 */

import { EXTERNAL_LINKS } from '../types';

export function renderFooter(): string {
  return `
    <footer class="w-full border-t border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] font-mono mt-auto">
      <div class="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8">
        <!-- Links Grid: 1-col on mobile, 2-col on sm, 3-col on md, 5-col on lg -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pb-8 border-b border-[rgba(15,0,0,0.12)] text-xs text-stone-600">
          <a
            href="${EXTERNAL_LINKS.naverNovel}"
            target="_blank"
            rel="noopener noreferrer"
            class="min-h-[44px] flex items-center no-underline hover:text-[#201d1d] transition-colors"
          >
            <span>[+] 네이버 웹소설 공식 연재</span>
          </a>
          <a
            href="${EXTERNAL_LINKS.naverWebtoon}"
            target="_blank"
            rel="noopener noreferrer"
            class="min-h-[44px] flex items-center no-underline hover:text-[#201d1d] transition-colors"
          >
            <span>[+] 네이버 웹툰 공식 연재</span>
          </a>
          <a
            href="${EXTERNAL_LINKS.munpiaNovel}"
            target="_blank"
            rel="noopener noreferrer"
            class="min-h-[44px] flex items-center no-underline hover:text-[#201d1d] transition-colors"
          >
            <span>[+] 문피아 웹소설 공식 연재</span>
          </a>
          <a
            href="https://github.com/Dayyoung/snshero"
            target="_blank"
            rel="noopener noreferrer"
            class="min-h-[44px] flex items-center no-underline hover:text-[#201d1d] transition-colors"
          >
            <span>[+] GitHub 오픈소스 리포지토리</span>
          </a>
          <a
            href="#play"
            data-nav="play"
            class="min-h-[44px] flex items-center no-underline text-[#201d1d] font-bold hover:underline"
          >
            <span>[→] 원클릭 웹게임 바로가기</span>
          </a>
        </div>

        <!-- Copyright & System Info -->
        <div class="pt-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-stone-500 space-y-2 md:space-y-0">
          <div>
            © 2026 SNSHero.com (눈히어로.com). OpenCode Terminal-Flat Architecture.
          </div>
          <div class="flex items-center space-x-4">
            <span>[Web TCG Platform]</span>
            <span>[110 Cards / 40 Episodes]</span>
          </div>
        </div>
      </div>
    </footer>
  `;
}
