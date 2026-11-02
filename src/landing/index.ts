import './styles/landing.css';

console.log('[SNSHero Landing] Standalone static landing initialized.');

function mountLanding(): void {
  const root = document.getElementById('landing-root') || document.getElementById('root');
  if (!root) return;

  // Placeholder bootstrap shell for Milestone 1 build integrity
  // Full UI components will be mounted here in Milestone 2 & 3
  if (root.children.length === 0) {
    root.innerHTML = `
      <div class="min-h-screen bg-[#fdfcfc] text-[#201d1d] font-mono flex flex-col items-center justify-center p-6">
        <div class="border border-[rgba(15,0,0,0.12)] p-8 max-w-lg w-full text-center bg-white shadow-sm">
          <h1 class="text-xl font-bold tracking-tight mb-3">눈히어로.com (SNSHero.com)</h1>
          <p class="text-xs text-stone-600 mb-6 leading-relaxed">
            원클릭 AI 웹 카드 게임 &amp; 공식 웹소설·웹툰 플랫폼에 오신 것을 환영합니다.
          </p>
          <a href="/home" class="inline-block px-6 py-3 bg-[#201d1d] text-[#fdfcfc] text-sm font-semibold rounded-sm hover:opacity-90 transition-opacity min-h-[44px] leading-[20px]">
            게임 시작하기 (Play Game) →
          </a>
        </div>
      </div>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountLanding);
} else {
  mountLanding();
}
