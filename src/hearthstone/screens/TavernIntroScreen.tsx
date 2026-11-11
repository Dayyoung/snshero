import React, { useMemo, useState } from 'react';
import { hsAudio } from '../audio';
import { SNS_LOCATIONS, SNS_LOGO_URL, SnsSnowCompassSeal } from '../components/SnsHeroArtKit';

export const TavernIntroScreen: React.FC<{ onEnterHub: () => void }> = ({ onEnterHub }) => {
  const [opening, setOpening] = useState(false);

  const embers = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        left: `${8 + ((i * 37) % 84)}%`,
        size: 3 + (i % 4) * 1.5,
        delay: `${(i * 0.31).toFixed(2)}s`,
        duration: `${(4.2 + (i % 5) * 0.85).toFixed(2)}s`,
        dx: `${(i % 2 === 0 ? 1 : -1) * (14 + (i % 4) * 9)}px`,
      })),
    [],
  );

  const handleEnter = () => {
    if (opening) return;
    setOpening(true);
    hsAudio.playSfx('box_open');
    hsAudio.playBgm('tavern_hub');
    hsAudio.playInnkeeper('welcome');
    window.setTimeout(() => {
      onEnterHub();
    }, 980);
  };

  return (
    <div
      onClick={handleEnter}
      className="relative flex h-full w-full cursor-pointer select-none flex-col items-center justify-between overflow-hidden bg-[#0a0503]"
    >
      {/* Layer 0: Warm Interior Elwin Sanctuary Table & Hearth Revealed As Doors Swing Open */}
      <div
        style={{
          backgroundImage: `url(${SNS_LOCATIONS.BOX_TABLE})`,
          transform: opening ? 'scale(1.06)' : 'scale(0.96)',
          transition: 'transform 1s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className="absolute inset-0 bg-cover bg-center"
      />
      <div
        style={{ backgroundImage: `url(${SNS_LOCATIONS.TAVERN_EXTERIOR})` }}
        className={`absolute inset-0 bg-cover bg-center mix-blend-lighten transition-opacity duration-700 ${
          opening ? 'opacity-30' : 'opacity-65'
        }`}
      />

      {/* Warm Hearth & Aurora Glow Burst When Sanctuary Doors Open */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          opening
            ? 'bg-radial from-amber-300/65 via-sky-500/20 to-black/65 opacity-100'
            : 'bg-radial from-amber-500/30 via-[#150c06]/68 to-[#060403]/95 opacity-100'
        }`}
      />

      {/* Layer 1: Hearthstone-Benchmarked Sanctuary Archway & 3D Swinging Double Doors */}
      <div
        style={{
          transform: opening ? 'scale(1.22)' : 'scale(1)',
          opacity: opening ? 0 : 1,
          transition: 'transform 0.96s cubic-bezier(0.32, 0.04, 0.24, 1), opacity 0.45s ease 0.52s',
        }}
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      >
        {/* Left Carved Stone & Timber Elwin Sanctuary Wall */}
        <div
          style={{
            background:
              'repeating-linear-gradient(180deg, rgba(255,214,150,0.03) 0px, rgba(255,214,150,0.03) 24px, rgba(0,0,0,0.28) 24px, rgba(0,0,0,0.28) 27px), linear-gradient(90deg, #0b0603 0%, #1d1109 68%, #2e1b0e 96%, #8c622b 100%)',
          }}
          className="relative h-full w-[19%] shadow-[20px_0_45px_rgba(0,0,0,0.92)] sm:w-[24%]"
        >
          <div className="absolute inset-y-0 right-1.5 w-[2px] bg-amber-300/35" />
          <div className="absolute right-3 top-[28%] h-16 w-4 rounded-full bg-amber-400/20 blur-md" />
        </div>

        {/* Central Double Sanctuary Door Frame + Warm Top Hearth Spill */}
        <div className="relative flex h-full flex-1 items-end justify-center overflow-hidden">
          {/* Warm Amber & Aurora Ceiling Glow Above Double Doors */}
          <div className="absolute inset-x-0 top-0 h-[34%] bg-gradient-to-b from-[#ffb43b]/45 via-[#d97706]/22 to-transparent" />

          {/* Left 3D Swinging Carved Oak & Brass Sanctuary Door */}
          <div
            style={{
              transformOrigin: 'left center',
              transform: opening
                ? 'perspective(1600px) rotateY(-96deg)'
                : 'perspective(1600px) rotateY(0deg)',
              transition: 'transform 0.92s cubic-bezier(0.32, 0.04, 0.24, 1)',
              background:
                'repeating-linear-gradient(90deg, rgba(255,210,145,0.035) 0px, rgba(255,210,145,0.035) 5px, rgba(0,0,0,0.16) 5px, rgba(0,0,0,0.16) 11px), linear-gradient(180deg, #4b2d16 0%, #2f1a0c 52%, #1b0e06 100%)',
            }}
            className="relative h-[84%] w-1/2 rounded-tr-[28px] border-r-2 border-t-[3px] border-[#d4a857]/80 shadow-[10px_0_32px_rgba(0,0,0,0.9)]"
          >
            {/* Recessed Carved Door Panels & Forged Brass Hinge Straps */}
            <div className="absolute inset-x-3 top-6 h-[36%] rounded-t-2xl border-2 border-[#9f7334]/55 bg-[#1a0d05]/55 shadow-[inset_0_4px_14px_rgba(0,0,0,0.85)] sm:inset-x-6" />
            <div className="absolute inset-x-3 bottom-6 h-[42%] rounded-b-xl border-2 border-[#9f7334]/55 bg-[#1a0d05]/55 shadow-[inset_0_4px_14px_rgba(0,0,0,0.85)] sm:inset-x-6" />
            <div className="absolute left-0 top-[22%] h-3 w-[68%] rounded-r-full border border-amber-200/50 bg-gradient-to-b from-[#d8ad5e] to-[#6a4419] shadow-md" />
            <div className="absolute left-0 bottom-[24%] h-3 w-[68%] rounded-r-full border border-amber-200/50 bg-gradient-to-b from-[#d8ad5e] to-[#6a4419] shadow-md" />
            <div className="absolute right-2.5 top-1/2 h-6 w-2.5 -translate-y-1/2 rounded-full border border-amber-100 bg-gradient-to-b from-amber-200 to-amber-700 shadow" />
          </div>

          {/* Center Glowing Hearth Light Seam Between Doors */}
          <div
            className={`z-20 h-[82%] w-[4px] bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 shadow-[0_0_24px_8px_rgba(251,191,36,0.88)] transition-opacity duration-300 ${
              opening ? 'opacity-0' : 'opacity-95'
            }`}
          />

          {/* Right 3D Swinging Carved Oak & Brass Sanctuary Door */}
          <div
            style={{
              transformOrigin: 'right center',
              transform: opening
                ? 'perspective(1600px) rotateY(96deg)'
                : 'perspective(1600px) rotateY(0deg)',
              transition: 'transform 0.92s cubic-bezier(0.32, 0.04, 0.24, 1)',
              background:
                'repeating-linear-gradient(90deg, rgba(255,210,145,0.035) 0px, rgba(255,210,145,0.035) 5px, rgba(0,0,0,0.16) 5px, rgba(0,0,0,0.16) 11px), linear-gradient(180deg, #4b2d16 0%, #2f1a0c 52%, #1b0e06 100%)',
            }}
            className="relative h-[84%] w-1/2 rounded-tl-[28px] border-l-2 border-t-[3px] border-[#d4a857]/80 shadow-[-10px_0_32px_rgba(0,0,0,0.9)]"
          >
            <div className="absolute inset-x-3 top-6 h-[36%] rounded-t-2xl border-2 border-[#9f7334]/55 bg-[#1a0d05]/55 shadow-[inset_0_4px_14px_rgba(0,0,0,0.85)] sm:inset-x-6" />
            <div className="absolute inset-x-3 bottom-6 h-[42%] rounded-b-xl border-2 border-[#9f7334]/55 bg-[#1a0d05]/55 shadow-[inset_0_4px_14px_rgba(0,0,0,0.85)] sm:inset-x-6" />
            <div className="absolute right-0 top-[22%] h-3 w-[68%] rounded-l-full border border-amber-200/50 bg-gradient-to-b from-[#d8ad5e] to-[#6a4419] shadow-md" />
            <div className="absolute right-0 bottom-[24%] h-3 w-[68%] rounded-l-full border border-amber-200/50 bg-gradient-to-b from-[#d8ad5e] to-[#6a4419] shadow-md" />
            <div className="absolute left-2.5 top-1/2 h-6 w-2.5 -translate-y-1/2 rounded-full border border-amber-100 bg-gradient-to-b from-amber-200 to-amber-700 shadow" />
          </div>

          {/* Warm Sanctuary Floorboards Spilling Under Doors */}
          <div className="absolute inset-x-0 bottom-0 h-[6%] bg-gradient-to-t from-[#090503] via-[#5c2d0c]/60 to-amber-400/35" />
        </div>

        {/* Right Carved Stone & Timber Elwin Sanctuary Wall */}
        <div
          style={{
            background:
              'repeating-linear-gradient(180deg, rgba(255,214,150,0.03) 0px, rgba(255,214,150,0.03) 24px, rgba(0,0,0,0.28) 24px, rgba(0,0,0,0.28) 27px), linear-gradient(270deg, #0b0603 0%, #1d1109 68%, #2e1b0e 96%, #8c622b 100%)',
          }}
          className="relative h-full w-[19%] shadow-[-20px_0_45px_rgba(0,0,0,0.92)] sm:w-[24%]"
        >
          <div className="absolute inset-y-0 left-1.5 w-[2px] bg-amber-300/35" />
          <div className="absolute left-3 top-[28%] h-16 w-4 rounded-full bg-amber-400/20 blur-md" />
        </div>
      </div>

      {/* Layer 2: Floating Hearth Ember Particles */}
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        {embers.map((em) => (
          <span
            key={em.id}
            style={
              {
                left: em.left,
                bottom: '-12px',
                width: `${em.size}px`,
                height: `${em.size}px`,
                animation: `hsEmberRise ${em.duration} ease-in ${em.delay} infinite`,
                '--ember-dx': em.dx,
              } as React.CSSProperties
            }
            className="absolute rounded-full bg-amber-300 shadow-[0_0_10px_3px_rgba(251,146,60,0.9)]"
          />
        ))}
      </div>

      {/* Top Subtle Sanctuary Header */}
      <header
        className={`relative z-30 px-3 pt-3 text-center transition-all duration-500 sm:pt-4 ${
          opening ? '-translate-y-6 opacity-0' : 'opacity-100'
        }`}
      >
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-[#c89d51]/50 bg-[#120a05]/85 px-3.5 py-1 text-[10px] font-extrabold tracking-[0.14em] text-[#efd7a3] shadow-lg sm:gap-2 sm:px-4 sm:text-[11px] sm:tracking-[0.18em]">
          <span className="text-amber-300">ELWIN VILLAGE</span>
          <span className="text-amber-500">•</span>
          <span>엘윈마을 · 카단의 여정</span>
        </div>
      </header>

      {/* Layer 3: Official 눈히어로 Brand Crest + Compass Swirl Latch + Novel/Webtoon Buttons */}
      <main
        className={`relative z-30 my-auto flex w-full max-w-md flex-col items-center px-4 text-center transition-all duration-700 sm:max-w-lg ${
          opening ? 'scale-125 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Official 눈히어로 Logo */}
        <div className="relative flex flex-col items-center">
          <div className="pointer-events-none absolute -inset-6 rounded-full bg-radial from-amber-400/25 via-sky-400/12 to-transparent blur-xl" />
          <img
            src={SNS_LOGO_URL}
            alt="눈히어로"
            draggable={false}
            className="relative w-[265px] max-w-[84vw] drop-shadow-[0_18px_32px_rgba(0,0,0,0.95)] sm:w-[430px]"
          />
          <div className="hs-title hs-outline-sm mt-1 tracking-[0.22em] text-xs font-extrabold text-[#f7dfb0] sm:mt-1.5 sm:text-sm sm:tracking-[0.26em]">
            엘윈마을의 영웅들
          </div>
        </div>

        {/* 8-Point Golden Snow-Compass Medallion + Rotating Arcane Swirl Ring */}
        <div className="relative my-3 flex items-center justify-center sm:my-5">
          <svg
            viewBox="0 0 200 200"
            style={{ animation: 'hsSlowSpin 26s linear infinite' }}
            className="pointer-events-none absolute -inset-6 h-[calc(100%+48px)] w-[calc(100%+48px)] opacity-90 sm:-inset-7 sm:h-[calc(100%+56px)] sm:w-[calc(100%+56px)]"
          >
            <defs>
              <radialGradient id="introArcaneRing" cx="50%" cy="50%" r="50%">
                <stop offset="55%" stopColor="rgba(56,189,248,0)" />
                <stop offset="82%" stopColor="rgba(56,189,248,0.55)" />
                <stop offset="94%" stopColor="rgba(253,224,71,0.65)" />
                <stop offset="100%" stopColor="rgba(56,189,248,0)" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="94" fill="url(#introArcaneRing)" />
            <circle
              cx="100"
              cy="100"
              r="84"
              fill="none"
              stroke="rgba(186,230,253,0.65)"
              strokeWidth="2"
              strokeDasharray="10 8 3 8"
            />
          </svg>
          <div className="pointer-events-none absolute inset-2 rounded-full bg-sky-400/35 blur-xl" />
          <SnsSnowCompassSeal
            size={112}
            className="relative drop-shadow-[0_12px_28px_rgba(0,0,0,0.95)] transition-transform duration-300 hover:scale-108 sm:h-36 sm:w-36"
          />
        </div>

        {/* Carved Arcane & Brass Entry Plaque + 소설읽기 / 웹툰보기 Directly Below */}
        <div className="relative flex w-full max-w-[330px] flex-col items-stretch gap-2.5 sm:max-w-[372px]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleEnter();
            }}
            className="hs-arcane-btn hs-title hs-outline min-h-[50px] w-full rounded-2xl px-10 py-3 text-base font-extrabold tracking-widest sm:min-h-[56px] sm:px-14 sm:py-3.5 sm:text-xl"
          >
            엘윈마을 입장
          </button>

          {/* 소설읽기 / 웹툰보기 Buttons Directly Underneath */}
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href="/book"
              onClick={(e) => {
                e.stopPropagation();
                hsAudio.playSfx('ui_click', 0.65);
              }}
              className="hs-brass-btn flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold tracking-wide text-amber-100 no-underline shadow-[0_8px_20px_rgba(0,0,0,0.75)] sm:text-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-amber-300">
                <path
                  d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>소설읽기</span>
            </a>

            <a
              href="/webtoon"
              onClick={(e) => {
                e.stopPropagation();
                hsAudio.playSfx('ui_click', 0.65);
              }}
              className="hs-brass-btn flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold tracking-wide text-sky-100 no-underline shadow-[0_8px_20px_rgba(0,0,0,0.75)] sm:text-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-sky-300">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2.1" />
                <path d="M3 10h18M11 10v11" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span>웹툰보기</span>
            </a>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-[#8d6732]/60 bg-[#130b05]/85 px-3.5 py-1.5 text-[11px] font-bold text-[#e7cda0] shadow-xl sm:gap-2.5 sm:px-4 sm:text-xs">
            <span>11종족 110영웅</span>
            <span className="text-amber-500">·</span>
            <span>수집 카드 382종 완비</span>
            <span className="text-amber-500">·</span>
            <span className="text-sky-300">한국어 성우 풀보이스</span>
          </div>
        </div>
      </main>

      {/* Bottom Vignette & Hint */}
      <footer
        className={`relative z-30 px-4 pb-3 text-center text-[11px] font-bold tracking-wide text-[#d4b684]/85 transition-opacity duration-500 sm:pb-4 ${
          opening ? 'opacity-0' : 'opacity-100'
        }`}
      >
        화면을 터치하거나 엘윈마을 입장을 누르면 성소의 문이 열립니다
      </footer>
    </div>
  );
};
