import React from 'react';
import { HeroClass, SnsCardBackId } from '../types';

export const SNS_LOGO_URL = '/logo-ko.png';
export const SNS_ICON_URL = '/icon.png';

export const SNS_LOCATIONS = {
  TAVERN_EXTERIOR: '/hs-assets/bg/elwin_intro_bg.webp',
  BOX_TABLE: '/hs-assets/bg/elwin_hub_bg.webp',
  PACK_ALTAR: '/hs-assets/bg/pack_altar_bg.webp',
  COLLECTION_ARCHIVE: '/hs-assets/bg/elwin_hub_bg.webp',
  BOARD_LIGHTHAVEN: '/hs-assets/bg/arena_elwin_snow.webp',
  BOARD_RED_PALACE: '/hs-assets/bg/arena_crimson_forge.webp',
  BOARD_WIND_ISLE: '/hs-assets/bg/arena_emerald_wind.webp',
} as const;

export const SNS_CARD_BACK_THEMES: Record<
  SnsCardBackId,
  {
    name: string;
    subtitle: string;
    imageUrl: string;
    glowColor: string;
  }
> = {
  gold: {
    name: '눈히어로 골드',
    subtitle: '공식 골드 엠블럼 카드 뒷면',
    imageUrl: '/hs-assets/cardbacks/snshero-gold.png',
    glowColor: 'rgba(250, 204, 21, 0.55)',
  },
  silver: {
    name: '눈히어로 실버',
    subtitle: '공식 실버 플래티넘 카드 뒷면',
    imageUrl: '/hs-assets/cardbacks/snshero-silver.png',
    glowColor: 'rgba(226, 232, 240, 0.55)',
  },
  bronze: {
    name: '눈히어로 브론즈',
    subtitle: '공식 브론즈 클래식 카드 뒷면',
    imageUrl: '/hs-assets/cardbacks/snshero-bronze.png',
    glowColor: 'rgba(217, 119, 6, 0.55)',
  },
};

export const SnsCardBackArt: React.FC<{
  variant?: SnsCardBackId | string;
  className?: string;
}> = ({ variant = 'gold', className = 'w-full h-full' }) => {
  const key: SnsCardBackId =
    variant === 'silver' || variant === 'frost'
      ? 'silver'
      : variant === 'bronze'
        ? 'bronze'
        : 'gold';
  const theme = SNS_CARD_BACK_THEMES[key];

  return (
    <div
      className={`relative select-none overflow-hidden rounded-[8%] ${className}`}
      style={{
        filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.75))',
      }}
    >
      <img
        src={theme.imageUrl}
        alt={theme.name}
        draggable={false}
        className="h-full w-full object-fill select-none"
      />
      {/* Subtle glossy foil highlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[8%]"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 36%, transparent 72%, rgba(0,0,0,0.25) 100%)',
        }}
      />
    </div>
  );
};

export const SnsBoosterPackArt: React.FC<{
  className?: string;
  glowing?: boolean;
}> = ({ className = 'w-full h-full', glowing = false }) => {
  return (
    <div
      className={`relative select-none overflow-hidden rounded-[12px] ${className}`}
      style={{
        background:
          'linear-gradient(145deg, #fef08a 0%, #eab308 32%, #92400e 68%, #facc15 100%)',
        padding: '4.5%',
        boxShadow: glowing
          ? '0 0 38px rgba(56,189,248,0.88), 0 18px 36px rgba(0,0,0,0.85)'
          : '0 14px 28px rgba(0,0,0,0.82), inset 0 1px 2px rgba(255,255,255,0.8)',
      }}
    >
      <div
        className="relative flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-[9px] border border-amber-200/50 px-[6%] py-[9%]"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, #1d4ed8 0%, #0f172a 60%, #060a14 100%)',
        }}
      >
        {/* Top & bottom metallic booster crimps */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[7%] opacity-75"
          style={{
            background:
              'repeating-linear-gradient(90deg, rgba(254,240,138,0.55) 0px, rgba(254,240,138,0.55) 3px, rgba(120,53,15,0.75) 3px, rgba(120,53,15,0.75) 6px)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[7%] opacity-75"
          style={{
            background:
              'repeating-linear-gradient(90deg, rgba(254,240,138,0.55) 0px, rgba(254,240,138,0.55) 3px, rgba(120,53,15,0.75) 3px, rgba(120,53,15,0.75) 6px)',
          }}
        />

        {/* Official 눈히어로 Logo */}
        <img
          src={SNS_LOGO_URL}
          alt="눈히어로"
          className="relative z-10 max-h-[26%] w-[90%] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.92)]"
          draggable={false}
        />

        {/* Center Official SNS HERO Emblem Preview */}
        <div className="relative z-10 my-auto flex aspect-[5/7] w-[62%] items-center justify-center">
          <div
            className="pointer-events-none absolute -inset-2 animate-pulse rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(56,189,248,0.55) 0%, transparent 72%)',
            }}
          />
          <img
            src="/hs-assets/cardbacks/snshero-gold.png"
            alt=""
            draggable={false}
            className="relative h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
          />
        </div>

        {/* Bottom Metallic Ribbon */}
        <div className="relative z-10 rounded-full border border-amber-950 bg-gradient-to-b from-amber-100 via-amber-400 to-amber-700 px-2.5 py-0.5 shadow">
          <span className="hs-title whitespace-nowrap text-[8.5px] font-extrabold tracking-wider text-[#261608] sm:text-[10px]">
            눈히어로 팩
          </span>
        </div>
      </div>
    </div>
  );
};

export const SnsSnowCompassSeal: React.FC<{
  size?: number;
  spinning?: boolean;
  className?: string;
}> = ({ size = 48, spinning = false, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 80 80"
    className={`select-none ${spinning ? 'animate-spin' : ''} ${className}`}
    style={spinning ? { animationDuration: '16s' } : undefined}
  >
    <defs>
      <radialGradient id="snsSealCore" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="48%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0f172a" />
      </radialGradient>
      <linearGradient id="snsSealGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fef9c3" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
    </defs>
    <polygon
      points="40,3 66,14 77,40 66,66 40,77 14,66 3,40 14,14"
      fill="url(#snsSealCore)"
      stroke="url(#snsSealGold)"
      strokeWidth="3.8"
    />
    <circle
      cx="40"
      cy="40"
      r="27"
      fill="none"
      stroke="rgba(253,224,71,0.55)"
      strokeWidth="1.4"
    />
    <path
      d="M40 10 L46 32 L68 40 L46 48 L40 70 L34 48 L12 40 L34 32 Z"
      fill="url(#snsSealGold)"
      stroke="#451a03"
      strokeWidth="1.4"
    />
    <circle cx="40" cy="40" r="10" fill="#38bdf8" stroke="#fef9c3" strokeWidth="2" />
    <path
      d="M40 33 V47 M33 40 H47 M35 35 L45 45 M45 35 L35 45"
      stroke="#ffffff"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const SnsRankMedallion: React.FC<{
  rank: number;
  size?: number;
  className?: string;
}> = ({ rank, size = 44, className = '' }) => {
  const isLegend = rank === 0;
  const isHigh = rank > 0 && rank <= 10;
  const topCol = isLegend ? '#f59e0b' : isHigh ? '#38bdf8' : '#b45309';
  const botCol = isLegend ? '#581c87' : isHigh ? '#1e3a8a' : '#451a03';
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" className={`select-none ${className}`}>
      <defs>
        <linearGradient id={`rk_${rank}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={topCol} />
          <stop offset="100%" stopColor={botCol} />
        </linearGradient>
      </defs>
      <polygon
        points="36,4 62,16 58,48 36,68 14,48 10,16"
        fill={`url(#rk_${rank})`}
        stroke="#fde68a"
        strokeWidth="3"
      />
      <polygon
        points="36,11 55,20 52,45 36,60 20,45 17,20"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.2"
      />
      <text
        x="36"
        y="43"
        textAnchor="middle"
        fill="#ffffff"
        stroke="#1c1008"
        strokeWidth="3"
        paintOrder="stroke"
        fontFamily="Nanum Gothic, sans-serif"
        fontWeight="900"
        fontSize={isLegend ? '18' : '22'}
      >
        {isLegend ? '★' : rank}
      </text>
    </svg>
  );
};

export const SnsQuestScrollIcon: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={`select-none ${className}`}>
    <rect x="14" y="10" width="36" height="44" rx="5" fill="#f3dfb7" stroke="#78350f" strokeWidth="3" />
    <rect x="10" y="8" width="44" height="8" rx="4" fill="#d97706" stroke="#451a03" strokeWidth="2.2" />
    <rect x="10" y="48" width="44" height="8" rx="4" fill="#d97706" stroke="#451a03" strokeWidth="2.2" />
    <line x1="21" y1="24" x2="43" y2="24" stroke="#78350f" strokeWidth="2.6" strokeLinecap="round" />
    <line x1="21" y1="32" x2="43" y2="32" stroke="#78350f" strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="39" cy="41" r="6" fill="#dc2626" stroke="#fef08a" strokeWidth="1.6" />
  </svg>
);

export const SnsLegendaryCrestSvg: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 260 112" className={`pointer-events-none select-none ${className}`}>
    <defs>
      <linearGradient id="snsLegWingGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fffbeb" />
        <stop offset="30%" stopColor="#fde047" />
        <stop offset="68%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <radialGradient id="snsLegGemAmber" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#fef9c3" />
        <stop offset="45%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#7c2d12" />
      </radialGradient>
    </defs>
    {/* Sweeping Sculpted Dragon Wings Embracing Portrait Oval */}
    <path
      d="M130 30
         C104 10, 56 6, 10 34
         C28 32, 46 39, 54 54
         C36 50, 20 58, 12 76
         C34 68, 56 72, 68 92
         C66 74, 84 54, 114 48
         L130 56
         L146 48
         C176 54, 194 74, 192 92
         C204 72, 226 68, 248 76
         C240 58, 224 50, 206 54
         C214 39, 232 32, 250 34
         C204 6, 156 10, 130 30 Z"
      fill="url(#snsLegWingGold)"
      stroke="#2b1404"
      strokeWidth="3.2"
      strokeLinejoin="round"
    />
    {/* Inner Engraved Wing Ribs */}
    <path
      d="M108 36 C78 24, 48 26, 26 38 M152 36 C182 24, 212 26, 234 38"
      fill="none"
      stroke="#fef3c7"
      strokeWidth="1.6"
      strokeLinecap="round"
      opacity="0.85"
    />
    {/* Horned Dragon Crown Spires */}
    <path
      d="M106 28 L94 6 L118 22 L130 4 L142 22 L166 6 L154 28 Z"
      fill="url(#snsLegWingGold)"
      stroke="#2b1404"
      strokeWidth="2.8"
      strokeLinejoin="round"
    />
    {/* Blazing Center Legendary Dragon-Eye Gem */}
    <polygon
      points="130,15 142,32 130,49 118,32"
      fill="url(#snsLegGemAmber)"
      stroke="#fef9c3"
      strokeWidth="2.2"
    />
    <polygon points="130,18 137,29 130,32 123,29" fill="rgba(255,255,255,0.65)" />
  </svg>
);

export const SnsTauntShieldSvg: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 144" className={`pointer-events-none select-none ${className}`}>
    <defs>
      <linearGradient id="snsTauntSteel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="45%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
    </defs>
    <path
      d="M60 4 L112 22 V72 C112 106 86 128 60 140 C34 128 8 106 8 72 V22 Z"
      fill="none"
      stroke="url(#snsTauntSteel)"
      strokeWidth="10"
      strokeLinejoin="round"
    />
    <path
      d="M60 4 L112 22 V72 C112 106 86 128 60 140 C34 128 8 106 8 72 V22 Z"
      fill="none"
      stroke="#eab308"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
  </svg>
);

export const SnsDivineBarrierSvg: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 144" className={`pointer-events-none select-none ${className}`}>
    <defs>
      <radialGradient id="snsDivineDome" cx="40%" cy="30%" r="68%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
        <stop offset="55%" stopColor="rgba(253,224,71,0.38)" />
        <stop offset="100%" stopColor="rgba(245,158,11,0.62)" />
      </radialGradient>
    </defs>
    <ellipse
      cx="60"
      cy="72"
      rx="54"
      ry="66"
      fill="url(#snsDivineDome)"
      stroke="#fef08a"
      strokeWidth="3.5"
    />
  </svg>
);

export const SnsArmorCrestSvg: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 64 72" className={`pointer-events-none select-none ${className}`}>
    <defs>
      <linearGradient id="snsArmorPlate" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="50%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
    </defs>
    <path
      d="M32 4 L58 14 V36 C58 52 45 63 32 69 C19 63 6 52 6 36 V14 Z"
      fill="url(#snsArmorPlate)"
      stroke="#1e293b"
      strokeWidth="4"
    />
    <path
      d="M32 10 L52 18 V35 C52 48 42 57 32 62 C22 57 12 48 12 35 V18 Z"
      fill="none"
      stroke="#e2e8f0"
      strokeWidth="1.6"
    />
  </svg>
);

export const SnsSecretOrbSvg: React.FC<{
  heroClass: HeroClass;
  size?: number;
}> = ({ heroClass, size = 28 }) => {
  const color =
    heroClass === 'MAGE'
      ? '#38bdf8'
      : heroClass === 'HUNTER'
        ? '#2dd4bf'
        : heroClass === 'PALADIN'
          ? '#facc15'
          : '#c084fc';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="select-none">
      <circle cx="24" cy="24" r="20" fill="#0f172a" stroke="#fde68a" strokeWidth="3" />
      <circle cx="24" cy="24" r="15" fill={color} fillOpacity="0.88" />
      <text
        x="24"
        y="31"
        textAnchor="middle"
        fill="#ffffff"
        stroke="#090d16"
        strokeWidth="3"
        paintOrder="stroke"
        fontFamily="Nanum Gothic, sans-serif"
        fontWeight="900"
        fontSize="22"
      >
        ?
      </text>
    </svg>
  );
};
