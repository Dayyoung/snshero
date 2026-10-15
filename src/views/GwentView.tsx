import React, { useState } from 'react';

interface GwentViewProps {
  onBackToHome?: () => void;
}

export const GwentView: React.FC<GwentViewProps> = ({ onBackToHome }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const handleBack = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-[#090d16] overflow-hidden select-none font-mono flex flex-col z-40">
      {/* Top Floating Control Bar */}
      <div className="h-10 bg-[#090d16]/95 border-b border-white/10 px-3 flex items-center justify-between text-xs text-stone-300 z-50 shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleBack}
            className="flex items-center space-x-1.5 px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-sm transition-all"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>[홈으로]</span>
          </button>
          <span className="text-[11px] text-amber-400 font-bold hidden sm:inline">
            [THE WITCHER 3 // GWENT CLASSIC CARD BATTLE]
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              const iframe = document.getElementById('gwent-iframe') as HTMLIFrameElement;
              if (iframe) iframe.src = '/gwent/index.html';
            }}
            className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 rounded-sm text-[11px] transition-all"
            title="Reload game"
          >
            [새로고침]
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-sm text-[11px] transition-all"
          >
            {isFullscreen ? '[전체화면 해제]' : '[전체화면]'}
          </button>
        </div>
      </div>

      {/* Embedded Gwent Game Iframe */}
      <div className="flex-1 w-full h-full relative bg-black">
        <iframe
          id="gwent-iframe"
          src="/gwent/index.html"
          title="The Witcher 3 Gwent Classic"
          className="absolute inset-0 w-full h-full border-0 select-none"
          allow="fullscreen; autoplay; accelerometer; gyroscope"
        />
      </div>
    </div>
  );
};

export default GwentView;
