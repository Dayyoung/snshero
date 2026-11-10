import React, { useState } from 'react';
import { hsAudio } from '../audio';

export const TavernIntroScreen: React.FC<{ onEnterHub: () => void }> = ({ onEnterHub }) => {
  const [opening, setOpening] = useState(false);

  const handleEnter = () => {
    if (opening) return;
    setOpening(true);
    hsAudio.playSfx('box_open');
    hsAudio.playBgm('tavern_hub');
    hsAudio.playInnkeeper('welcome');
    window.setTimeout(() => {
      onEnterHub();
    }, 920);
  };

  return (
    <div
      onClick={handleEnter}
      className="relative flex h-[100dvh] w-full cursor-pointer select-none items-center justify-center overflow-hidden bg-stone-950"
    >
      {/* Warm Tavern Background Behind Doors */}
      <div
        style={{ backgroundImage: 'url(/hs-assets/ui/tavern_bg.webp)' }}
        className="absolute inset-0 bg-cover bg-center brightness-95"
      />
      <div className="absolute inset-0 bg-radial from-amber-500/25 via-transparent to-black/80" />

      {/* Left Oak Tavern Door */}
      <div
        style={{
          transformOrigin: 'left center',
          transform: opening ? 'perspective(1400px) rotateY(-88deg)' : 'perspective(1400px) rotateY(0deg)',
          transition: 'transform 0.92s cubic-bezier(0.32, 0.04, 0.24, 1)',
        }}
        className="absolute inset-y-0 left-0 z-20 w-1/2 border-r-[5px] border-[#d2aa5c] bg-gradient-to-br from-[#4d321c] via-[#342010] to-[#1b0f07] shadow-[18px_0_40px_rgba(0,0,0,0.9)]"
      >
        <div className="m-6 h-[calc(100%-3rem)] rounded-2xl border-[3px] border-[#8b6334]/60 bg-gradient-to-b from-[#3d2614]/80 to-[#211309]/90 p-6 shadow-inner">
          <div className="h-full w-full rounded-xl border border-amber-500/20" />
        </div>
      </div>

      {/* Right Oak Tavern Door */}
      <div
        style={{
          transformOrigin: 'right center',
          transform: opening ? 'perspective(1400px) rotateY(88deg)' : 'perspective(1400px) rotateY(0deg)',
          transition: 'transform 0.92s cubic-bezier(0.32, 0.04, 0.24, 1)',
        }}
        className="absolute inset-y-0 right-0 z-20 w-1/2 border-l-[5px] border-[#d2aa5c] bg-gradient-to-bl from-[#4d321c] via-[#342010] to-[#1b0f07] shadow-[-18px_0_40px_rgba(0,0,0,0.9)]"
      >
        <div className="m-6 h-[calc(100%-3rem)] rounded-2xl border-[3px] border-[#8b6334]/60 bg-gradient-to-b from-[#3d2614]/80 to-[#211309]/90 p-6 shadow-inner">
          <div className="h-full w-full rounded-xl border border-amber-500/20" />
        </div>
      </div>

      {/* Center Hearthstone Medallion & Extracted Official Title Logo */}
      <div
        className={`relative z-30 flex flex-col items-center px-4 text-center transition-all duration-700 ${
          opening ? 'scale-125 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Glowing Blue Swirl Seal */}
        <div className="relative mb-3 flex h-36 w-36 items-center justify-center rounded-full border-[5px] border-[#e7c57a] bg-gradient-to-b from-[#49311c] to-[#1f130a] shadow-[0_0_50px_rgba(56,189,248,0.75)]">
          <img
            src="/hs-assets/ui/hs_thebox_glowring.webp"
            alt=""
            className="pointer-events-none absolute -inset-4 h-44 w-44 animate-pulse object-contain opacity-90"
          />
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-sky-200 bg-radial from-sky-300 via-blue-500 to-indigo-950 text-5xl shadow-[0_0_28px_#38bdf8]">
            🌀
          </div>
        </div>

        <img
          src="/hs-assets/ui/hs_titlelogo.webp"
          alt="Hearthstone"
          className="w-[340px] max-w-[86vw] drop-shadow-[0_12px_26px_rgba(0,0,0,0.95)] sm:w-[440px]"
        />

        <div className="mt-2 rounded-full border border-amber-400/50 bg-black/65 px-5 py-1.5 text-xs font-bold tracking-wider text-amber-200 shadow-lg">
          워크래프트의 영웅들 · 2014 오리지널 클래식 (382종 전수 복원)
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleEnter();
          }}
          className="mt-7 animate-pulse rounded-2xl border-[3px] border-[#f6dc99] bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#1e3a8a] px-10 py-3.5 text-lg font-extrabold tracking-wide text-white shadow-[0_0_32px_rgba(56,189,248,0.8)] transition hover:scale-105 hover:brightness-110"
        >
          여관 문 열기 (클릭하여 입장)
        </button>

        <p className="mt-4 text-[11px] text-amber-200/75">
          스톤브루의 여관 · 한국어 음성/효과음 활성화 · 100% 브라우저 즉시 실행
        </p>
      </div>
    </div>
  );
};
