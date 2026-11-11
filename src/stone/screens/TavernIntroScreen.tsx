import React, { useMemo, useState } from 'react';
import { hsAudio } from '../audio';

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
      className="relative flex h-[100dvh] w-full cursor-pointer select-none flex-col items-center justify-between overflow-hidden bg-[#0a0503]"
    >
      {/* Layer 0: Warm Interior Tavern Table & Hearth Revealed As Doors Swing Open */}
      <div
        style={{
          backgroundImage: 'url(/stone-assets/ui/box_table_bg.webp)',
          transform: opening ? 'scale(1.06)' : 'scale(0.96)',
          transition: 'transform 1s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className="absolute inset-0 bg-cover bg-center"
      />
      <div
        style={{ backgroundImage: 'url(/stone-assets/ui/tavern_bg.webp)' }}
        className={`absolute inset-0 bg-cover bg-center mix-blend-lighten transition-opacity duration-700 ${
          opening ? 'opacity-35' : 'opacity-75'
        }`}
      />

      {/* Warm Hearth Amber Glow Burst When Doors Open */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          opening
            ? 'bg-radial from-amber-300/65 via-amber-600/20 to-black/65 opacity-100'
            : 'bg-radial from-amber-500/35 via-[#1a0d05]/65 to-[#070402]/95 opacity-100'
        }`}
      />

      {/* Layer 1: Authentic Blizzard Tavern Saloon Archway & 3D Swinging Double Doors */}
      <div
        style={{
          transform: opening ? 'scale(1.22)' : 'scale(1)',
          opacity: opening ? 0 : 1,
          transition: 'transform 0.96s cubic-bezier(0.32, 0.04, 0.24, 1), opacity 0.45s ease 0.52s',
        }}
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      >
        {/* Left Stone & Timber Tavern Wall */}
        <div
          style={{ backgroundImage: 'url(/stone-assets/ui/intro_wall_left.webp)' }}
          className="h-full w-[24%] bg-cover bg-right shadow-[20px_0_45px_rgba(0,0,0,0.9)]"
        />

        {/* Central Saloon Door Frame + Warm Top Hearth Spill */}
        <div className="relative flex h-full flex-1 items-end justify-center overflow-hidden">
          {/* Warm Amber Tavern Ceiling Glow Above Saloon Doors */}
          <div className="absolute inset-x-0 top-0 h-[34%] bg-gradient-to-b from-[#ffb43b]/45 via-[#d97706]/25 to-transparent" />

          {/* Left Saloon Door */}
          <div
            style={{
              backgroundImage: 'url(/stone-assets/ui/intro_door_left.webp)',
              transformOrigin: 'left center',
              transform: opening
                ? 'perspective(1600px) rotateY(-96deg)'
                : 'perspective(1600px) rotateY(0deg)',
              transition: 'transform 0.92s cubic-bezier(0.32, 0.04, 0.24, 1)',
            }}
            className="h-[84%] w-1/2 bg-cover bg-right shadow-[10px_0_32px_rgba(0,0,0,0.88)]"
          />

          {/* Center Glowing Hearth Light Seam Between Doors */}
          <div
            className={`z-20 h-[82%] w-[4px] bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 shadow-[0_0_24px_8px_rgba(251,191,36,0.85)] transition-opacity duration-300 ${
              opening ? 'opacity-0' : 'opacity-95'
            }`}
          />

          {/* Right Saloon Door */}
          <div
            style={{
              backgroundImage: 'url(/stone-assets/ui/intro_door_right.webp)',
              transformOrigin: 'right center',
              transform: opening
                ? 'perspective(1600px) rotateY(96deg)'
                : 'perspective(1600px) rotateY(0deg)',
              transition: 'transform 0.92s cubic-bezier(0.32, 0.04, 0.24, 1)',
            }}
            className="h-[84%] w-1/2 bg-cover bg-left shadow-[-10px_0_32px_rgba(0,0,0,0.88)]"
          />

          {/* Warm Tavern Floorboards Spilling Under Doors */}
          <div className="absolute inset-x-0 bottom-0 h-[6%] bg-gradient-to-t from-[#090503] via-[#5c2d0c]/60 to-amber-400/35" />
        </div>

        {/* Right Stone & Timber Tavern Wall */}
        <div
          style={{ backgroundImage: 'url(/stone-assets/ui/intro_wall_right.webp)' }}
          className="h-full w-[24%] bg-cover bg-left shadow-[-20px_0_45px_rgba(0,0,0,0.9)]"
        />
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

      {/* Top Subtle Studio Header */}
      <div
        className={`relative z-30 px-3 pt-3 text-center transition-all duration-500 sm:pt-4 ${
          opening ? '-translate-y-6 opacity-0' : 'opacity-100'
        }`}
      >
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-[#c89d51]/45 bg-[#120a05]/80 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#efd7a3] shadow-lg sm:gap-2 sm:px-4 sm:text-[11px] sm:tracking-[0.18em]">
          <span>STONEBREW&apos;S TAVERN</span>
          <span className="text-amber-500">•</span>
          <span>CLASSIC PATCH 1.0.0.4944</span>
        </div>
      </div>

      {/* Layer 3: Master Sculpted Stone & Gold HEARTHSTONE Logo + Compass Swirl Latch */}
      <div
        className={`relative z-30 my-auto flex flex-col items-center px-4 text-center transition-all duration-700 ${
          opening ? 'scale-125 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Ultra-Crisp 926x390 Master Hearthstone Logo */}
        <div className="relative flex flex-col items-center">
          <div className="pointer-events-none absolute -inset-6 rounded-full bg-radial from-amber-400/25 via-sky-400/10 to-transparent blur-xl" />
          <img
            src="/stone-assets/ui/hs_logo_master.webp"
            alt="Hearthstone"
            draggable={false}
            className="relative w-[305px] max-w-[88vw] drop-shadow-[0_18px_32px_rgba(0,0,0,0.95)] sm:w-[540px]"
          />
          <div className="hs-title -mt-1.5 tracking-[0.22em] text-xs font-extrabold text-[#f7dfb0] sm:-mt-2 sm:text-sm sm:tracking-[0.26em]">
            워크래프트의 영웅들
          </div>
        </div>

        {/* Authentic 8-Point Golden Compass-Star + Glowing Blue Swirl Seal */}
        <div className="relative my-3.5 flex items-center justify-center sm:my-6">
          <img
            src="/stone-assets/ui/hs_thebox_glowring.webp"
            alt=""
            style={{ animation: 'hsSlowSpin 26s linear infinite' }}
            className="pointer-events-none absolute -inset-6 h-[calc(100%+48px)] w-[calc(100%+48px)] rounded-full object-contain opacity-90 mix-blend-screen sm:-inset-7 sm:h-[calc(100%+56px)] sm:w-[calc(100%+56px)]"
          />
          <div className="pointer-events-none absolute inset-3 rounded-full bg-sky-400/35 blur-xl" />
          <img
            src="/stone-assets/ui/box_compass_medallion.webp"
            alt="여관 인장"
            draggable={false}
            className="relative h-28 w-28 object-contain drop-shadow-[0_12px_28px_rgba(0,0,0,0.95)] transition-transform duration-300 hover:scale-108 sm:h-40 sm:w-40"
          />
        </div>

        {/* Carved Arcane & Brass Tavern Entry Plaque */}
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleEnter();
            }}
            className="hs-arcane-btn hs-title hs-outline min-h-[48px] rounded-2xl px-10 py-3 text-base tracking-widest sm:px-14 sm:py-4 sm:text-xl"
          >
            여관 문 열기
          </button>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-[#8d6732]/60 bg-[#130b05]/85 px-3.5 py-1.5 text-[11px] font-bold text-[#e7cda0] shadow-xl sm:gap-2.5 sm:px-4 sm:text-xs">
            <span>오리지널 9대 직업</span>
            <span className="text-amber-500">·</span>
            <span>수집 카드 382종 완비</span>
            <span className="text-amber-500">·</span>
            <span className="text-sky-300">공식 한국어 음성</span>
          </div>
        </div>
      </div>

      {/* Bottom Vignette & Hint */}
      <footer
        className={`relative z-30 px-4 pb-3 text-center text-[11px] font-bold tracking-wide text-[#d4b684]/85 transition-opacity duration-500 sm:pb-4 ${
          opening ? 'opacity-0' : 'opacity-100'
        }`}
      >
        화면을 터치하거나 클릭하면 스톤브루의 여관이 열립니다
      </footer>
    </div>
  );
};
