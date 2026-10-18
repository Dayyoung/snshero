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
 <div className="fixed inset-0 w-full h-[100dvh] bg-[#090d16] overflow-hidden select-none font-mono flex flex-col z-40 pb-28">
 {/* Top Monospace Control Bar (44px mobile touch target) */}
 <div className="h-11 bg-[#201d1d] border-b border-[#646262]/30 px-3 flex items-center justify-between text-xs text-stone-200 z-50 shrink-0">
 <div className="flex items-center space-x-2">
 <button
 onClick={handleBack}
 className="min-h-[44px] flex items-center space-x-1.5 px-3 py-1.5 bg-[#090d16] hover:bg-stone-900 text-stone-200 border border-stone-700 rounded-sm transition-colors min-h-[36px]"
 >
 <svg className="w-3.5 h-3.5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
 <polyline points="15 18 9 12 15 6"></polyline>
 </svg>
 <span className="font-bold">[홈으로]</span>
 </button>
 <span className="text-[11px] text-amber-400 font-bold hidden sm:inline">
 [GWENT // THE WITCHER 3 CLASSIC]
 </span>
 </div>

 <div className="flex items-center space-x-2">
 <button
 onClick={() => {
 const iframe = document.getElementById('gwent-iframe') as HTMLIFrameElement;
 if (iframe) iframe.src = '/gwent/index.html';
 }}
 className="min-h-[44px] px-2.5 py-1.5 bg-[#090d16] hover:bg-stone-900 text-stone-300 border border-stone-700 rounded-sm text-xs transition-colors min-h-[36px]"
 title="Reload game"
 >
 [새로고침]
 </button>
 <button
 onClick={toggleFullscreen}
 className="min-h-[44px] px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-700 rounded-sm text-xs transition-colors min-h-[36px]"
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
