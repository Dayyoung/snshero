import React, { useMemo, useState } from 'react';
import { hsAudio } from '../audio';
import { SNS_LOCATIONS, SNS_LOGO_URL, SnsSnowCompassSeal } from '../components/SnsHeroArtKit';

export const TavernIntroScreen: React.FC<{ onEnterHub: () => void }> = ({ onEnterHub }) => {
  const [entering, setEntering] = useState(false);

  const snowStars = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => ({
        id: i,
        left: `${6 + ((i * 37) % 88)}%`,
        size: 3 + (i % 4) * 1.4,
        delay: `${(i * 0.29).toFixed(2)}s`,
        duration: `${(4.4 + (i % 5) * 0.85).toFixed(2)}s`,
        dx: `${(i % 2 === 0 ? 1 : -1) * (14 + (i % 4) * 9)}px`,
      })),
    [],
  );

  const handleEnter = () => {
    if (entering) return;
    setEntering(true);
    hsAudio.playSfx('box_open');
    hsAudio.playBgm('tavern_hub');
    hsAudio.playInnkeeper('welcome');
    window.setTimeout(() => {
      onEnterHub();
    }, 780);
  };

  return (
    <div className="relative flex h-[100dvh] w-full select-none flex-col items-center justify-between overflow-hidden bg-[#060b16]">
      {/* Layer 0: Newly Generated Original Elwin Village Snowy Aurora Panoramic Background */}
      <div
        style={{
          backgroundImage: `url(${SNS_LOCATIONS.TAVERN_EXTERIOR})`,
          transform: entering ? 'scale(1.14)' : 'scale(1.02)',
          filter: entering ? 'brightness(1.22)' : 'brightness(1)',
          transition:
            'transform 0.82s cubic-bezier(0.22, 1, 0.36, 1), filter 0.7s ease',
        }}
        className="absolute inset-0 bg-cover bg-center"
      />

      {/* Atmospheric Aurora & Warm Village Lantern Vignette */}
      <div
        style={{
          background: entering
            ? 'radial-gradient(circle at 50% 48%, rgba(125,211,252,0.38) 0%, rgba(15,23,42,0.35) 55%, rgba(4,8,18,0.82) 100%)'
            : 'linear-gradient(180deg, rgba(6,11,24,0.68) 0%, rgba(8,15,32,0.28) 42%, rgba(6,10,22,0.86) 100%)',
        }}
        className="pointer-events-none absolute inset-0 transition-all duration-700"
      />

      {/* Layer 1: Drifting Elwin Starlight & Snow Crystal Motes */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        {snowStars.map((st) => (
          <span
            key={st.id}
            style={
              {
                left: st.left,
                bottom: '-12px',
                width: `${st.size}px`,
                height: `${st.size}px`,
                animation: `hsEmberRise ${st.duration} ease-in ${st.delay} infinite`,
                '--ember-dx': st.dx,
              } as React.CSSProperties
            }
            className="absolute rounded-full bg-sky-200/90 shadow-[0_0_10px_2px_rgba(125,211,252,0.85)]"
          />
        ))}
      </div>

      {/* Top Lore Header */}
      <header
        className={`relative z-30 px-3 pt-3.5 text-center transition-all duration-500 sm:pt-5 ${
          entering ? '-translate-y-6 opacity-0' : 'opacity-100'
        }`}
      >
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-sky-300/40 bg-[#091224]/85 px-3.5 py-1 text-[10.5px] font-extrabold tracking-[0.14em] text-sky-100 shadow-[0_8px_24px_rgba(0,0,0,0.75)] backdrop-blur-xs sm:gap-2 sm:px-4.5 sm:text-xs sm:tracking-[0.18em]">
          <span className="text-amber-300">ELWIN VILLAGE</span>
          <span className="text-sky-400">•</span>
          <span>엘윈마을 · 카단의 여정</span>
        </div>
      </header>

      {/* Centerpiece: Official 눈히어로 Brand Crest + Entry & Story Links */}
      <main
        className={`relative z-30 my-auto flex w-full max-w-md flex-col items-center px-4 text-center transition-all duration-700 sm:max-w-lg ${
          entering ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Official 눈히어로 Logo */}
        <div className="relative flex flex-col items-center">
          <div className="pointer-events-none absolute -inset-8 rounded-full bg-radial from-sky-400/30 via-amber-400/12 to-transparent blur-2xl" />
          <img
            src={SNS_LOGO_URL}
            alt="눈히어로"
            draggable={false}
            className="relative w-[270px] max-w-[82vw] drop-shadow-[0_18px_34px_rgba(0,0,0,0.95)] sm:w-[420px]"
          />
          <div className="hs-title hs-outline-sm mt-1.5 text-xs font-extrabold tracking-[0.22em] text-amber-200 sm:mt-2 sm:text-sm sm:tracking-[0.26em]">
            눈히어로 · 카단의 여정
          </div>
        </div>

        {/* Sculpted 8-Point Golden Snow-Compass Emblem (Tappable to Enter) */}
        <button
          type="button"
          onClick={handleEnter}
          aria-label="엘윈마을 입장"
          className="group relative my-3.5 flex cursor-pointer items-center justify-center focus:outline-none sm:my-5"
        >
          <div
            style={{ animation: 'hsSlowSpin 26s linear infinite' }}
            className="pointer-events-none absolute -inset-4 rounded-full border-2 border-dashed border-sky-300/50 opacity-90 sm:-inset-5"
          />
          <div className="pointer-events-none absolute inset-1 rounded-full bg-sky-400/35 blur-xl transition group-hover:bg-amber-300/45" />
          <SnsSnowCompassSeal
            size={112}
            className="relative drop-shadow-[0_12px_28px_rgba(0,0,0,0.95)] transition-transform duration-300 group-hover:scale-108 sm:h-32 sm:w-32"
          />
        </button>

        {/* Primary CTA + Novel & Webtoon Quick Buttons */}
        <div className="relative flex w-full max-w-[330px] flex-col items-stretch gap-2.5 sm:max-w-[368px]">
          <button
            type="button"
            onClick={handleEnter}
            className="hs-arcane-btn hs-title hs-outline flex min-h-[54px] w-full items-center justify-center rounded-2xl px-8 py-3.5 text-lg font-extrabold tracking-[0.16em] text-white shadow-[0_14px_34px_rgba(2,132,199,0.65)] sm:min-h-[60px] sm:text-xl"
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
              className="hs-brass-btn flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-extrabold tracking-wide text-amber-100 no-underline shadow-[0_8px_20px_rgba(0,0,0,0.75)] sm:text-sm"
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
              className="hs-brass-btn flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-extrabold tracking-wide text-sky-100 no-underline shadow-[0_8px_20px_rgba(0,0,0,0.75)] sm:text-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-sky-300">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2.1" />
                <path d="M3 10h18M11 10v11" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span>웹툰보기</span>
            </a>
          </div>

          <div className="mt-1 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-amber-300/35 bg-[#091120]/85 px-3.5 py-1.5 text-[11px] font-bold text-amber-100/90 shadow-xl backdrop-blur-xs sm:text-xs">
            <span>11종족 110영웅</span>
            <span className="text-amber-400">·</span>
            <span>수집 카드 382종</span>
            <span className="text-amber-400">·</span>
            <span className="text-sky-300">눈히어로 카드 배틀</span>
          </div>
        </div>
      </main>

      {/* Bottom Footer Hint */}
      <footer
        className={`relative z-30 px-4 pb-3.5 text-center text-[11px] font-bold tracking-wide text-sky-100/80 transition-opacity duration-500 sm:pb-4 ${
          entering ? 'opacity-0' : 'opacity-100'
        }`}
      >
        엘윈마을 입장을 눌러 눈히어로 전술 대결을 시작하거나 원작 소설·웹툰을 감상하세요
      </footer>
    </div>
  );
};
