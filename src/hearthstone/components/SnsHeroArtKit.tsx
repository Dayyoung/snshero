import React from 'react';
import { HeroClass } from '../types';

export const SNS_LOGO_URL = '/logo-ko.png';
export const SNS_ICON_URL = '/icon.png';

export const SNS_LOCATIONS = {
  TAVERN_EXTERIOR: '/anime-character-sheets/locations/art/LOC_002_Drunken_Bell_Tower.jpg',
  BOX_TABLE: '/anime-character-sheets/locations/art/LOC_016_Jade_Council_Hall.jpg',
  PACK_ALTAR: '/anime-character-sheets/locations/art/LOC_012_Sky_Altar.jpg',
  COLLECTION_ARCHIVE: '/anime-character-sheets/locations/art/LOC_019_Black_Citadel_Starlight_Archive.jpg',
  BOARD_LIGHTHAVEN: '/anime-character-sheets/locations/art/LOC_006_Lighthaven_Inner_Forum.jpg',
  BOARD_RED_PALACE: '/anime-character-sheets/locations/art/LOC_007_Red_Glass_Palace.jpg',
  BOARD_WIND_ISLE: '/anime-character-sheets/locations/art/LOC_010_Whispering_Wind_Island.jpg',
} as const;

export const SNS_CARD_BACK_THEMES: Record<
  'classic' | 'legend' | 'frost' | 'gold',
  {
    name: string;
    subtitle: string;
    bgGrad: string;
    rimGrad: string;
    coreColor: string;
    runeColor: string;
  }
> = {
  classic: {
    name: '라이트헤븐 설원 문장',
    subtitle: '아케 성기사단 기본 인장',
    bgGrad: 'linear-gradient(160deg, #1d4ed8 0%, #0f172a 55%, #172554 100%)',
    rimGrad: 'linear-gradient(135deg, #fde68a 0%, #d97706 50%, #78350f 100%)',
    coreColor: '#38bdf8',
    runeColor: 'rgba(186,230,253,0.55)',
  },
  legend: {
    name: '성흔의 전설 문장',
    subtitle: '취선루 최고 등급 달성 기념',
    bgGrad: 'linear-gradient(160deg, #7c2d12 0%, #3b0764 55%, #1e1b4b 100%)',
    rimGrad: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #92400e 100%)',
    coreColor: '#fbbf24',
    runeColor: 'rgba(253,230,138,0.65)',
  },
  frost: {
    name: '만년설 은빛 단검',
    subtitle: '엘윈 마을 서약의 유물',
    bgGrad: 'linear-gradient(160deg, #0284c7 0%, #082f49 55%, #0f172a 100%)',
    rimGrad: 'linear-gradient(135deg, #e0f2fe 0%, #38bdf8 50%, #0369a1 100%)',
    coreColor: '#7dd3fc',
    runeColor: 'rgba(224,242,254,0.68)',
  },
  gold: {
    name: '비취 평의회 황금장',
    subtitle: '대륙 11종족 동맹 문장',
    bgGrad: 'linear-gradient(160deg, #854d0e 0%, #422006 55%, #1c1917 100%)',
    rimGrad: 'linear-gradient(135deg, #fef9c3 0%, #eab308 50%, #854d0e 100%)',
    coreColor: '#facc15',
    runeColor: 'rgba(254,240,138,0.65)',
  },
};

export const SnsCardBackArt: React.FC<{
  variant?: 'classic' | 'legend' | 'frost' | 'gold';
  className?: string;
}> = ({ variant = 'classic', className = 'w-full h-full' }) => {
  const t = SNS_CARD_BACK_THEMES[variant] || SNS_CARD_BACK_THEMES.classic;
  return (
    <div
      className={`relative overflow-hidden rounded-[12px] select-none ${className}`}
      style={{
        background: t.rimGrad,
        padding: '6%',
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.65), 0 8px 20px rgba(0,0,0,0.65)',
      }}
    >
      <div
        className="relative w-full h-full rounded-[9px] overflow-hidden flex items-center justify-center border border-amber-100/35"
        style={{ background: t.bgGrad }}
      >
        {/* Corner filigree & arcane geometry */}
        <svg viewBox="0 0 160 224" className="absolute inset-0 w-full h-full pointer-events-none">
          <rect
            x="8"
            y="8"
            width="144"
            height="208"
            rx="8"
            fill="none"
            stroke={t.runeColor}
            strokeWidth="1.6"
          />
          <rect
            x="14"
            y="14"
            width="132"
            height="196"
            rx="6"
            fill="none"
            stroke={t.runeColor}
            strokeWidth="0.9"
            strokeDasharray="4 3"
          />
          <circle cx="80" cy="112" r="52" fill="none" stroke={t.runeColor} strokeWidth="1.8" />
          <circle
            cx="80"
            cy="112"
            r="41"
            fill="rgba(0,0,0,0.35)"
            stroke={t.coreColor}
            strokeWidth="1.5"
          />
          {/* 8-point snow crystal star */}
          <path
            d="M80 48 L89 96 L136 112 L89 128 L80 176 L71 128 L24 112 L71 96 Z"
            fill={t.coreColor}
            fillOpacity="0.24"
            stroke={t.coreColor}
            strokeWidth="1.5"
          />
          <path
            d="M46 78 L80 99 L114 78 L93 112 L114 146 L80 125 L46 146 L67 112 Z"
            fill={t.coreColor}
            fillOpacity="0.18"
            stroke={t.runeColor}
            strokeWidth="1.1"
          />
          {/* Corner diamonds */}
          <polygon points="24,24 32,20 28,28" fill={t.coreColor} />
          <polygon points="136,24 128,20 132,28" fill={t.coreColor} />
          <polygon points="24,200 32,204 28,196" fill={t.coreColor} />
          <polygon points="136,200 128,204 132,196" fill={t.coreColor} />
        </svg>

        {/* Center Snow-Emblem Core */}
        <div
          className="relative z-10 w-[44%] aspect-square rounded-full flex items-center justify-center border-2 border-amber-200/80"
          style={{
            background: `radial-gradient(circle, #ffffff 0%, ${t.coreColor} 48%, #0f172a 100%)`,
            boxShadow: `0 0 18px ${t.coreColor}`,
          }}
        >
          <img
            src={SNS_ICON_URL}
            alt="눈히어로 인장"
            className="w-[78%] h-[78%] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)]"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
};

export const SnsBoosterPackArt: React.FC<{
  className?: string;
  glowing?: boolean;
}> = ({ className = 'w-full h-full', glowing = false }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-[14px] select-none ${className}`}
      style={{
        background: 'linear-gradient(145deg, #fef08a 0%, #d97706 38%, #78350f 75%, #f59e0b 100%)',
        padding: '5%',
        boxShadow: glowing
          ? '0 0 36px rgba(56,189,248,0.85), 0 18px 36px rgba(0,0,0,0.8)'
          : '0 14px 28px rgba(0,0,0,0.78), inset 0 1px 2px rgba(255,255,255,0.75)',
      }}
    >
      {/* Pack metallic crimps top & bottom */}
      <div
        className="relative w-full h-full rounded-[10px] overflow-hidden flex flex-col items-center justify-between py-[10%] px-[8%] border border-amber-200/45"
        style={{
          background:
            'radial-gradient(circle at 50% 42%, #1e40af 0%, #0f172a 62%, #090d16 100%)',
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-[8%] opacity-65"
          style={{
            background:
              'repeating-linear-gradient(90deg, rgba(253,224,71,0.45) 0px, rgba(253,224,71,0.45) 3px, rgba(120,53,15,0.65) 3px, rgba(120,53,15,0.65) 6px)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[8%] opacity-65"
          style={{
            background:
              'repeating-linear-gradient(90deg, rgba(253,224,71,0.45) 0px, rgba(253,224,71,0.45) 3px, rgba(120,53,15,0.65) 3px, rgba(120,53,15,0.65) 6px)',
          }}
        />

        {/* Official NunHero Logo */}
        <img
          src={SNS_LOGO_URL}
          alt="눈히어로"
          className="relative z-10 w-[88%] max-h-[28%] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
          draggable={false}
        />

        {/* Sculpted Glowing Snow-Gem Clasp */}
        <div className="relative z-10 w-[56%] aspect-square rounded-full flex items-center justify-center my-auto">
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(56,189,248,0.65) 0%, transparent 72%)',
            }}
          />
          <div
            className="relative w-[84%] h-[84%] rounded-full border-[3px] border-amber-300 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.85)]"
            style={{
              background: 'radial-gradient(circle at 35% 30%, #e0f2fe 0%, #0284c7 55%, #1e3a8a 100%)',
            }}
          >
            <img
              src={SNS_ICON_URL}
              alt=""
              className="w-[74%] h-[74%] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              draggable={false}
            />
          </div>
        </div>

        {/* Bottom Ribbon */}
        <div className="relative z-10 px-2.5 py-0.5 rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 border border-amber-950 shadow">
          <span className="hs-title text-[9px] sm:text-[10px] font-extrabold text-[#261608] tracking-wider whitespace-nowrap">
            성흔 영웅 팩
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
    style={spinning ? { animationDuration: '14s' } : undefined}
  >
    <defs>
      <radialGradient id="snsSealCore" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="45%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0f172a" />
      </radialGradient>
      <linearGradient id="snsSealGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
    </defs>
    <circle cx="40" cy="40" r="37" fill="url(#snsSealCore)" stroke="url(#snsSealGold)" strokeWidth="4" />
    <circle cx="40" cy="40" r="29" fill="none" stroke="rgba(253,224,71,0.55)" strokeWidth="1.4" strokeDasharray="4 3" />
    <path
      d="M40 8 L46 31 L69 40 L46 49 L40 72 L34 49 L11 40 L34 31 Z"
      fill="url(#snsSealGold)"
      stroke="#451a03"
      strokeWidth="1.4"
    />
    <circle cx="40" cy="40" r="11" fill="#38bdf8" stroke="#fef9c3" strokeWidth="2" />
    <path d="M40 32 V48 M32 40 H48" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
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
  <svg viewBox="0 0 220 90" className={`pointer-events-none select-none ${className}`}>
    <defs>
      <linearGradient id="snsLegGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff7cc" />
        <stop offset="45%" stopColor="#facc15" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
    </defs>
    {/* Sculpted Twin Dragon-Valkyrie Wings */}
    <path
      d="M110 26 C88 8, 42 4, 8 24 C28 26, 44 34, 52 46 C34 42, 20 48, 12 58 C38 54, 64 58, 86 72 L110 54 L134 72 C156 58, 182 54, 208 58 C200 48, 186 42, 168 46 C176 34, 192 26, 212 24 C178 4, 132 8, 110 26 Z"
      fill="url(#snsLegGold)"
      stroke="#3b1d06"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    {/* Crown Center Sapphire */}
    <polygon
      points="110,10 122,28 110,46 98,28"
      fill="#38bdf8"
      stroke="#fef9c3"
      strokeWidth="2.4"
    />
  </svg>
);

export const SnsTauntShieldSvg: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 120 144" className={`pointer-events-none select-none ${className}`}>
    <defs>
      <linearGradient id="snsTauntSteel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f1f5f9" />
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
