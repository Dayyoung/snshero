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
      className="relative flex h-[100dvh] w-full cursor-pointer select-none flex-col items-center justify-between overflow-hidden bg-[#0a0503]"
    >
      {/* Layer 0: Warm Interior Jade Council Hall & Drunken Bell Tower Revealed As Doors Swing Open */}
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
          opening ? 'opacity-30' : 'opacity-80'
        }`}
      />

      {/* Warm Hearth Amber Glow Burst When Doors Open */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
          opening
            ? 'bg-radial from-amber-300/65 via-amber-600/20 to-black/65 opacity-100'
            : 'bg-radial from-sky-500/25 via-[#160d07]/72 to-[#070402]/96 opacity-100'
        }`}
      />

      {/* Layer 1: Sculpted Timber & Bronze Drunken Bell Tower Archway & 3D Swinging Double Doors */}
      <div
        style={{
          transform: opening ? 'scale(1.22)' : 'scale(1)',
          opacity: opening ? 0 : 1,
          transition: 'transform 0.96s cubic-bezier(0.32, 0.04, 0.24, 1), opacity 0.45s ease 0.52s',
        }}
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      >
        {/* Left Stone & Timber Pillar Wall */}
        <div
          style={{
            background:
              'linear-gradient(90deg, #0b0704 0%, #1d120a 58%, #352010 88%, #5e3c1e 100%)',
          }}
          className="relative h-full w-[16%] border-r-4 border-[#9c7338]/70 shadow-[20px_0_45px_rgba(0,0,0,0.92)] sm:w-[22%]"
        >
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 3px, transparent 3px, transparent 42px)',
            }}
          />
        </div>

        {/* Central Tavern Door Frame + Warm Top Lantern Spill */}
        <div className="relative flex h-full flex-1 items-end justify-center overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[34%] bg-gradient-to-b from-[#ffb43b]/40 via-[#0284c7]/20 to-transparent" />

          {/* Left Sculpted Oak & Brass Door */}
          <div
            style={{
              background:
                'linear-gradient(135deg, #3b2312 0%, #241409 55%, #160c05 100%)',
              transformOrigin: 'left center',
              transform: opening
                ? 'perspective(1600px) rotateY(-96deg)'
                : 'perspective(1600px) rotateY(0deg)',
              transition: 'transform 0.92s cubic-bezier(0.32, 0.04, 0.24, 1)',
            }}
            className="relative h-[84%] w-1/2 border-y-4 border-r-2 border-[#b68a46]/70 p-3 shadow-[10px_0_32px_rgba(0,0,0,0.88)] sm:p-6"
          >
            <div className="h-full w-full rounded-lg border-2 border-[#c89d51]/35 bg-gradient-to-b from-amber-950/35 to-black/45 shadow-inner" />
            <div className="absolute right-3 top-1/2 h-8 w-3 -translate-y-1/2 rounded-full border border-amber-200 bg-gradient-to-b from-amber-300 to-amber-800 shadow-lg sm:right-5 sm:h-12 sm:w-4" />
          </div>

          {/* Center Glowing Starlight & Hearth Seam Between Doors */}
          <div
            className={`z-20 h-[82%] w-[4px] bg-gradient-to-b from-sky-200 via-amber-300 to-amber-600 shadow-[0_0_24px_8px_rgba(251,191,36,0.85)] transition-opacity duration-300 ${
              opening ? 'opacity-0' : 'opacity-95'
            }`}
          />

          {/* Right Sculpted Oak & Brass Door */}
          <div
            style={{
              background:
                'linear-gradient(225deg, #3b2312 0%, #241409 55%, #160c05 100%)',
              transformOrigin: 'right center',
              transform: opening
                ? 'perspective(1600px) rotateY(96deg)'
                : 'perspective(1600px) rotateY(0deg)',
              transition: 'transform 0.92s cubic-bezier(0.32, 0.04, 0.24, 1)',
            }}
            className="relative h-[84%] w-1/2 border-y-4 border-l-2 border-[#b68a46]/70 p-3 shadow-[-10px_0_32px_rgba(0,0,0,0.88)] sm:p-6"
          >
            <div className="h-full w-full rounded-lg border-2 border-[#c89d51]/35 bg-gradient-to-b from-amber-950/35 to-black/45 shadow-inner" />
            <div className="absolute left-3 top-1/2 h-8 w-3 -translate-y-1/2 rounded-full border border-amber-200 bg-gradient-to-b from-amber-300 to-amber-800 shadow-lg sm:left-5 sm:h-12 sm:w-4" />
          </div>

          {/* Warm Tavern Floorboards Spilling Under Doors */}
          <div className="absolute inset-x-0 bottom-0 h-[6%] bg-gradient-to-t from-[#090503] via-[#5c2d0c]/60 to-amber-400/35" />
        </div>

        {/* Right Stone & Timber Pillar Wall */}
        <div
          style={{
            background:
              'linear-gradient(270deg, #0b0704 0%, #1d120a 58%, #352010 88%, #5e3c1e 100%)',
          }}
          className="relative h-full w-[16%] border-l-4 border-[#9c7338]/70 shadow-[-20px_0_45px_rgba(0,0,0,0.92)] sm:w-[22%]"
        >
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 3px, transparent 3px, transparent 42px)',
            }}
          />
        </div>
      </div>

      {/* Layer 2: Floating Starlight & Hearth Ember Particles */}
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
            className="absolute rounded-full bg-amber-300 shadow-[0_0_10px_3px_rgba(56,189,248,0.85)]"
          />
        ))}
      </div>

      {/* Top Subtle Lore Header */}
      <div
        className={`relative z-30 px-3 pt-3 text-center transition-all duration-500 sm:pt-4 ${
          opening ? '-translate-y-6 opacity-0' : 'opacity-100'
        }`}
      >
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-[#c89d51]/45 bg-[#120a05]/85 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#efd7a3] shadow-lg sm:gap-2 sm:px-4 sm:text-[11px] sm:tracking-[0.18em]">
          <span>DRUNKEN BELL TOWER · 취선루</span>
          <span className="text-amber-500">•</span>
          <span>카단의 여정 CHRONICLES</span>
        </div>
      </div>

      {/* Layer 3: Official 눈히어로 Logo + Sculpted Snow-Star Seal Latch */}
      <div
        className={`relative z-30 my-auto flex flex-col items-center px-4 text-center transition-all duration-700 ${
          opening ? 'scale-125 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <div className="relative flex flex-col items-center">
          <div className="pointer-events-none absolute -inset-6 rounded-full bg-radial from-sky-400/25 via-amber-400/15 to-transparent blur-xl" />
          <img
            src={SNS_LOGO_URL}
            alt="눈히어로"
            draggable={false}
            className="relative w-[275px] max-w-[84vw] drop-shadow-[0_18px_32px_rgba(0,0,0,0.95)] sm:w-[440px]"
          />
          <div className="hs-title mt-1 tracking-[0.2em] text-xs font-extrabold text-[#f7dfb0] sm:mt-1.5 sm:text-sm sm:tracking-[0.24em]">
            카단의 여정 · 성흔의 카드 배틀
          </div>
        </div>

        {/* Sculpted 8-Point Golden Snow-Compass Seal */}
        <div className="relative my-3.5 flex items-center justify-center sm:my-6">
          <div
            style={{ animation: 'hsSlowSpin 24s linear infinite' }}
            className="pointer-events-none absolute -inset-4 rounded-full border-2 border-dashed border-sky-300/45 opacity-85 sm:-inset-5"
          />
          <div className="pointer-events-none absolute inset-2 rounded-full bg-sky-400/35 blur-xl" />
          <div className="relative transition-transform duration-300 hover:scale-108">
            <SnsSnowCompassSeal size={124} className="drop-shadow-[0_12px_28px_rgba(0,0,0,0.95)] sm:h-36 sm:w-36" />
          </div>
        </div>

        {/* Carved Arcane & Brass Entry Plaque */}
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleEnter();
            }}
            className="hs-arcane-btn hs-title hs-outline min-h-[48px] rounded-2xl px-10 py-3 text-base tracking-widest sm:px-14 sm:py-4 sm:text-xl"
          >
            취선루 문 열기
          </button>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 rounded-xl border border-[#8d6732]/60 bg-[#130b05]/85 px-3.5 py-1.5 text-[11px] font-bold text-[#e7cda0] shadow-xl sm:gap-2.5 sm:px-4 sm:text-xs">
            <span>11종족 110영웅</span>
            <span className="text-amber-500">·</span>
            <span>수집 카드 382종 완비</span>
            <span className="text-amber-500">·</span>
            <span className="text-sky-300">전술 성흔 카드 배틀</span>
          </div>
        </div>
      </div>

      {/* Bottom Vignette & Hint */}
      <footer
        className={`relative z-30 px-4 pb-3 text-center text-[11px] font-bold tracking-wide text-[#d4b684]/85 transition-opacity duration-500 sm:pb-4 ${
          opening ? 'opacity-0' : 'opacity-100'
        }`}
      >
        화면을 터치하거나 클릭하면 라이트헤븐 취선루의 대전 상자가 열립니다
      </footer>
    </div>
  );
};
