import React, { useEffect, useState } from 'react';
import { hsAudio } from '../audio';
import { CLASSIC_RANK_NAMES, CLASS_CREST_URL, getHeroArtUrl } from '../cardDb';
import { HsArcaneDustVialIcon, HsGoldCoinIcon } from '../components/CardVisual';
import {
  SNS_LOCATIONS,
  SNS_LOGO_URL,
  SnsBoosterPackArt,
  SnsQuestScrollIcon,
  SnsRankMedallion,
  SnsSnowCompassSeal,
} from '../components/SnsHeroArtKit';
import { GameMode, PlayerProfile } from '../types';

export interface BoxHubScreenProps {
  profile: PlayerProfile;
  onSelectPlayMode: (mode: GameMode) => void;
  onOpenCollection: () => void;
  onOpenPacks: () => void;
  onOpenQuestLog: () => void;
  onOpenShop: () => void;
  onOpenOptions: () => void;
}

export const BoxHubScreen: React.FC<BoxHubScreenProps> = ({
  profile,
  onSelectPlayMode,
  onOpenCollection,
  onOpenPacks,
  onOpenQuestLog,
  onOpenShop,
  onOpenOptions,
}) => {
  const [launchingMode, setLaunchingMode] = useState<GameMode | null>(null);

  useEffect(() => {
    hsAudio.playBgm('tavern_hub');
  }, []);

  const triggerModeTransition = (mode: GameMode) => {
    if (launchingMode) return;
    hsAudio.playSfx('box_press');
    hsAudio.playSfx('menu_select', 0.85);
    setLaunchingMode(mode);
    window.setTimeout(() => {
      setLaunchingMode(null);
      onSelectPlayMode(mode);
    }, 260);
  };

  const rankTitle = CLASSIC_RANK_NAMES[profile.rank] || '엘윈 마을 수습생';

  return (
    <div
      style={{ backgroundImage: `url(${SNS_LOCATIONS.BOX_TABLE})` }}
      className="relative flex h-[100dvh] w-full select-none flex-col items-center justify-between overflow-y-auto bg-cover bg-center px-2.5 py-2 sm:overflow-hidden sm:p-5"
    >
      {/* Atmospheric Elwin Command Hall Vignette */}
      <div
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, rgba(14,165,233,0.12) 0%, rgba(9,13,24,0.62) 60%, rgba(4,7,15,0.92) 100%)',
        }}
        className="pointer-events-none absolute inset-0"
      />

      {/* Top HUD Bar */}
      <header className="relative z-20 flex w-full max-w-6xl flex-wrap items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('box_open');
              onOpenQuestLog();
            }}
            onMouseEnter={() => hsAudio.playSfx('box_hover', 0.5)}
            className="hs-brass-btn flex min-h-[42px] items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-amber-100 sm:gap-2.5 sm:px-3.5 sm:py-2"
          >
            <SnsQuestScrollIcon size={30} className="shrink-0 drop-shadow" />
            <div className="text-left">
              <div className="hs-title text-[11px] font-extrabold tracking-wide text-amber-100 sm:text-xs">
                의뢰 · 전적
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-amber-300/90 sm:gap-1.5 sm:text-[10.5px]">
                <SnsRankMedallion rank={profile.rank} size={16} />
                <span>
                  {profile.rank === 0 ? '전설의 눈히어로' : `${profile.rank}등급`}
                  <span className="hidden sm:inline">{profile.rank > 0 ? ` · ${rankTitle}` : ''}</span>
                </span>
              </div>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('ui_click');
              onOpenShop();
            }}
            onMouseEnter={() => hsAudio.playSfx('box_hover', 0.5)}
            className="hs-brass-btn flex min-h-[42px] items-center gap-2 rounded-xl px-2.5 py-1.5 sm:gap-3 sm:px-3.5 sm:py-2"
          >
            <span className="flex items-center gap-1">
              <HsGoldCoinIcon size={18} />
              <span className="hs-num text-xs text-yellow-300 sm:text-base">{profile.gold}</span>
            </span>
            <span className="h-3.5 w-[1px] bg-amber-400/35 sm:h-4" />
            <span className="flex items-center gap-1">
              <HsArcaneDustVialIcon size={17} />
              <span className="hs-num text-xs text-sky-200 sm:text-sm">{profile.arcaneDust}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('open_menu');
              onOpenOptions();
            }}
            onMouseEnter={() => hsAudio.playSfx('box_hover', 0.5)}
            className="hs-brass-btn flex min-h-[42px] items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-amber-100 sm:gap-1.5 sm:px-3.5 sm:py-2.5 sm:text-sm"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-amber-300">
              <path
                d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z"
                stroke="currentColor"
                strokeWidth="2.2"
              />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
                stroke="currentColor"
                strokeWidth="1.9"
              />
            </svg>
            <span>메뉴</span>
          </button>
        </div>
      </header>

      {/* Centerpiece: Original Elwin Village Command Sanctuary (Zero Hearthstone Wooden Box Cliché) */}
      <main className="relative z-20 my-auto flex w-full max-w-4xl flex-col items-center py-2">
        {/* Official 눈히어로 Logo + Sanctuary Subtitle */}
        <div className="mb-2.5 flex flex-col items-center text-center sm:mb-4">
          <img
            src={SNS_LOGO_URL}
            alt="눈히어로"
            draggable={false}
            className="w-[196px] drop-shadow-[0_14px_24px_rgba(0,0,0,0.92)] sm:w-[290px]"
          />
          <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-sky-300/35 bg-slate-950/80 px-3.5 py-0.5 text-[10.5px] font-extrabold tracking-[0.18em] text-sky-200 shadow sm:text-xs">
            <span>엘윈마을 대결 광장</span>
            <span className="text-amber-400">·</span>
            <span className="text-amber-200">카단의 여정</span>
          </div>
        </div>

        {/* 3 Original SNSHero Battle Command Portals */}
        <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-4">
          {/* 1. 대전 (Ranked & Casual) */}
          <button
            type="button"
            onMouseEnter={() => hsAudio.playSfx('box_hover', 0.55)}
            onClick={() => triggerModeTransition('RANKED')}
            className={`group relative flex min-h-[104px] items-center justify-between overflow-hidden rounded-2xl border-2 border-sky-300/80 bg-gradient-to-br from-[#0f295c] via-[#0b1938] to-[#060c1b] p-3.5 text-left shadow-[0_16px_38px_rgba(0,0,0,0.88)] transition duration-200 hover:-translate-y-1 hover:border-yellow-300 hover:shadow-[0_0_28px_rgba(56,189,248,0.55)] sm:min-h-[214px] sm:flex-col sm:items-start sm:justify-end sm:p-5 ${
              launchingMode === 'RANKED' ? 'scale-96 brightness-125' : ''
            }`}
          >
            <img
              src={getHeroArtUrl('HERO_09')}
              alt=""
              draggable={false}
              className="pointer-events-none absolute -right-4 top-0 h-[155%] w-[132px] max-w-none object-cover object-top opacity-85 drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] transition duration-300 group-hover:scale-108 sm:-right-3 sm:h-[125%] sm:w-[170px]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#060c1b]/95 via-[#09152e]/75 to-transparent sm:bg-gradient-to-t sm:from-[#050914] sm:via-[#071126]/68 sm:to-transparent" />
            <div className="relative z-10 flex items-center gap-2 sm:mb-auto">
              <SnsSnowCompassSeal size={36} className="shrink-0 drop-shadow" />
              <span className="rounded-full border border-sky-300/50 bg-sky-950/90 px-2.5 py-0.5 text-[10px] font-extrabold text-sky-200">
                실시간 전략 대결
              </span>
            </div>
            <div className="relative z-10 mt-1">
              <div className="hs-title hs-outline-sm text-xl font-extrabold tracking-wider text-white sm:text-2xl">
                대전
              </div>
              <div className="mt-0.5 text-xs font-bold text-sky-200/90">
                눈히어로 등급전 · 일반전
              </div>
            </div>
          </button>

          {/* 2. 엘윈마을 수련 (Practice vs 9 Faction Leaders) */}
          <button
            type="button"
            onMouseEnter={() => hsAudio.playSfx('box_hover', 0.55)}
            onClick={() => triggerModeTransition('PRACTICE_NORMAL')}
            className={`group relative flex min-h-[104px] items-center justify-between overflow-hidden rounded-2xl border-2 border-amber-300/75 bg-gradient-to-br from-[#47210d] via-[#261107] to-[#0f0703] p-3.5 text-left shadow-[0_16px_38px_rgba(0,0,0,0.88)] transition duration-200 hover:-translate-y-1 hover:border-yellow-300 hover:shadow-[0_0_28px_rgba(245,158,11,0.5)] sm:min-h-[214px] sm:flex-col sm:items-start sm:justify-end sm:p-5 ${
              launchingMode === 'PRACTICE_NORMAL' ? 'scale-96 brightness-125' : ''
            }`}
          >
            <img
              src={getHeroArtUrl('HERO_01')}
              alt=""
              draggable={false}
              className="pointer-events-none absolute -right-4 top-0 h-[155%] w-[132px] max-w-none object-cover object-top opacity-85 drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] transition duration-300 group-hover:scale-108 sm:-right-3 sm:h-[125%] sm:w-[170px]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#120804]/95 via-[#241007]/75 to-transparent sm:bg-gradient-to-t sm:from-[#0d0502] sm:via-[#1e0d05]/68 sm:to-transparent" />
            <div className="relative z-10 flex items-center gap-2 sm:mb-auto">
              <img
                src={CLASS_CREST_URL.WARRIOR}
                alt=""
                className="h-8 w-8 rounded-full border border-amber-200/80 shadow"
              />
              <span className="rounded-full border border-amber-300/50 bg-amber-950/90 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-200">
                9대 종족 대표전
              </span>
            </div>
            <div className="relative z-10 mt-1">
              <div className="hs-title hs-outline-sm text-xl font-extrabold tracking-wider text-white sm:text-2xl">
                엘윈마을 수련
              </div>
              <div className="mt-0.5 text-xs font-bold text-amber-200/90">
                9종족 대표 수련 (일반 · 숙련)
              </div>
            </div>
          </button>

          {/* 3. 카단의 첫걸음 (Interactive Tutorial) */}
          <button
            type="button"
            onMouseEnter={() => hsAudio.playSfx('box_hover', 0.55)}
            onClick={() => triggerModeTransition('TUTORIAL')}
            className={`group relative flex min-h-[104px] items-center justify-between overflow-hidden rounded-2xl border-2 border-emerald-300/75 bg-gradient-to-br from-[#0d3b2e] via-[#07241c] to-[#04120e] p-3.5 text-left shadow-[0_16px_38px_rgba(0,0,0,0.88)] transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_0_28px_rgba(52,211,153,0.5)] sm:min-h-[214px] sm:flex-col sm:items-start sm:justify-end sm:p-5 ${
              launchingMode === 'TUTORIAL' ? 'scale-96 brightness-125' : ''
            }`}
          >
            <img
              src={getHeroArtUrl('HERO_02')}
              alt=""
              draggable={false}
              className="pointer-events-none absolute -right-4 top-0 h-[155%] w-[132px] max-w-none object-cover object-top opacity-85 drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] transition duration-300 group-hover:scale-108 sm:-right-3 sm:h-[125%] sm:w-[170px]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#04120e]/95 via-[#07241c]/75 to-transparent sm:bg-gradient-to-t sm:from-[#030e0b] sm:via-[#072119]/68 sm:to-transparent" />
            <div className="relative z-10 flex items-center gap-2 sm:mb-auto">
              <img
                src={CLASS_CREST_URL.SHAMAN}
                alt=""
                className="h-8 w-8 rounded-full border border-emerald-200/80 shadow"
              />
              <span className="rounded-full border border-emerald-300/50 bg-emerald-950/90 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-200">
                입문 가이드
              </span>
            </div>
            <div className="relative z-10 mt-1">
              <div className="hs-title hs-outline-sm text-xl font-extrabold tracking-wider text-white sm:text-2xl">
                카단의 첫걸음
              </div>
              <div className="mt-0.5 text-xs font-bold text-emerald-200/90">
                실전 코칭 입문 튜토리얼
              </div>
            </div>
          </button>
        </div>

        {/* Bottom 4-Action Dock: 눈히어로 팩 개봉 · 내 카드첩 · 의뢰 일지 · 눈히어로 보급소 */}
        <div className="mt-3 grid w-full grid-cols-2 gap-2 rounded-2xl border-2 border-[#c8a158]/75 bg-[#0c111d]/90 p-2.5 shadow-[0_18px_40px_rgba(0,0,0,0.9)] backdrop-blur-xs sm:mt-4 sm:grid-cols-4 sm:gap-3 sm:p-3">
          <button
            type="button"
            onMouseEnter={() => hsAudio.playSfx('box_hover', 0.5)}
            onClick={() => {
              hsAudio.playSfx('box_press');
              onOpenPacks();
            }}
            className="hs-brass-btn relative flex min-h-[52px] items-center gap-2 rounded-xl px-2.5 py-2 text-left text-amber-100 sm:gap-2.5 sm:px-3"
          >
            {profile.packs > 0 && (
              <span className="hs-num absolute -right-1.5 -top-1.5 z-20 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-red-200 bg-gradient-to-b from-red-500 to-red-800 px-1 text-[11px] text-white shadow-[0_3px_10px_rgba(220,38,38,0.85)] sm:-right-2 sm:-top-2 sm:h-6 sm:min-w-6 sm:px-1.5 sm:text-xs">
                {profile.packs}
              </span>
            )}
            <div className="h-9 w-7 shrink-0 sm:h-10 sm:w-8">
              <SnsBoosterPackArt />
            </div>
            <div className="min-w-0">
              <div className="hs-title truncate text-xs font-extrabold text-amber-100 sm:text-sm">
                눈히어로 팩 개봉
              </div>
              <div className="text-[10px] font-bold text-amber-300/85">
                보유 {profile.packs}팩
              </div>
            </div>
          </button>

          <button
            type="button"
            onMouseEnter={() => hsAudio.playSfx('box_hover', 0.5)}
            onClick={() => {
              hsAudio.playSfx('box_press');
              onOpenCollection();
            }}
            className="hs-brass-btn flex min-h-[52px] items-center gap-2 rounded-xl px-2.5 py-2 text-left text-amber-100 sm:gap-2.5 sm:px-3"
          >
            <img
              src={CLASS_CREST_URL.PRIEST}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full border border-amber-300/60 object-cover shadow sm:h-9 sm:w-9"
            />
            <div className="min-w-0">
              <div className="hs-title truncate text-xs font-extrabold text-amber-100 sm:text-sm">
                내 카드첩
              </div>
              <div className="text-[10px] font-bold text-amber-300/85">
                영웅 도감 · 382종
              </div>
            </div>
          </button>

          <button
            type="button"
            onMouseEnter={() => hsAudio.playSfx('box_hover', 0.5)}
            onClick={() => {
              hsAudio.playSfx('box_open');
              onOpenQuestLog();
            }}
            className="hs-brass-btn flex min-h-[52px] items-center gap-2 rounded-xl px-2.5 py-2 text-left text-amber-100 sm:gap-2.5 sm:px-3"
          >
            <SnsQuestScrollIcon size={32} className="shrink-0 drop-shadow" />
            <div className="min-w-0">
              <div className="hs-title truncate text-xs font-extrabold text-amber-100 sm:text-sm">
                의뢰 일지
              </div>
              <div className="text-[10px] font-bold text-amber-300/85">
                일일 보상 · 등급
              </div>
            </div>
          </button>

          <button
            type="button"
            onMouseEnter={() => hsAudio.playSfx('box_hover', 0.5)}
            onClick={() => {
              hsAudio.playSfx('box_press');
              onOpenShop();
            }}
            className="hs-brass-btn flex min-h-[52px] items-center gap-2 rounded-xl px-2.5 py-2 text-left text-amber-100 sm:gap-2.5 sm:px-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-300/50 bg-stone-950/60 sm:h-9 sm:w-9">
              <HsGoldCoinIcon size={22} />
            </div>
            <div className="min-w-0">
              <div className="hs-title truncate text-xs font-extrabold text-amber-100 sm:text-sm">
                눈히어로 보급소
              </div>
              <div className="text-[10px] font-bold text-amber-300/85">
                팩 구매 · 뒷면 변경
              </div>
            </div>
          </button>
        </div>
      </main>

      {/* Footer Plaque */}
      <footer className="relative z-20 pt-1 text-center text-[10.5px] font-bold tracking-wide text-sky-100/80 sm:text-[11px]">
        눈히어로 11종족 110영웅 · 수집 카드 382종 완비 · 모든 진행 데이터 로컬 자동 보존
      </footer>
    </div>
  );
};
