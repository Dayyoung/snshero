import React, { useEffect, useState } from 'react';
import { hsAudio } from '../audio';
import { CLASSIC_RANK_NAMES, CLASS_CREST_URL } from '../cardDb';
import { HsArcaneDustVialIcon, HsGoldCoinIcon } from '../components/CardVisual';
import {
  SNS_LOCATIONS,
  SNS_LOGO_URL,
  SnsBoosterPackArt,
  SnsQuestScrollIcon,
  SnsRankMedallion,
  SnsSnowCompassSeal,
} from '../components/SnsHeroArtKit';
import { getJourneyEpisodeDef } from '../kadanJourneyData';
import {
  canInstallGamePwa,
  isBrowserFullscreen,
  isFullscreenSupported,
  isStandalonePwa,
  promptInstallGamePwa,
  subscribePwaFullscreen,
  toggleBrowserFullscreen,
} from '../pwaFullscreen';
import { hsStorage } from '../storage';
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
  const [diskSpinning, setDiskSpinning] = useState(false);
  const [, setPwaTick] = useState(0);
  const isFirstVisitGuide = !profile.journeyGuideDone;
  const currentEp = getJourneyEpisodeDef(profile.journeyEpisode || 1);

  useEffect(() => {
    hsAudio.playBgm('tavern_hub');
    return subscribePwaFullscreen(() => setPwaTick((n) => n + 1));
  }, []);

  const fullscreenActive = isBrowserFullscreen() || isStandalonePwa();
  const showFullscreenBtn = isFullscreenSupported() && !isStandalonePwa();
  const showInstallBtn = canInstallGamePwa();

  const triggerModeTransition = (mode: GameMode) => {
    if (diskSpinning) return;
    if (isFirstVisitGuide && mode !== 'TUTORIAL') return;
    if (mode === 'TUTORIAL' && isFirstVisitGuide) {
      hsStorage.markJourneyGuideDone();
    }
    hsAudio.playSfx('box_press');
    hsAudio.playSfx('box_disk_flip', 0.85);
    setDiskSpinning(true);
    window.setTimeout(() => {
      setDiskSpinning(false);
      onSelectPlayMode(mode);
    }, 340);
  };

  const rankTitle = CLASSIC_RANK_NAMES[profile.rank] || '엘윈 마을 수습생';
  const lockedBtnStyle = isFirstVisitGuide
    ? 'pointer-events-none cursor-not-allowed opacity-40 saturate-[0.35]'
    : '';

  return (
    <div
      style={{ backgroundImage: `url(${SNS_LOCATIONS.BOX_TABLE})` }}
      className="relative flex h-full w-full select-none flex-col items-center justify-between overflow-y-auto bg-cover bg-center px-2.5 py-2 sm:overflow-hidden sm:p-5"
    >
      {/* Warm Candlelight & Elwin Sanctuary Table Vignette */}
      <div
        style={{
          background:
            'radial-gradient(ellipse at 50% 48%, rgba(255,198,105,0.1) 0%, rgba(12,7,4,0.44) 62%, rgba(5,3,2,0.88) 100%)',
        }}
        className="pointer-events-none absolute inset-0"
      />

      {/* Top Brass HUD Bar */}
      <header className="relative z-20 flex w-full max-w-6xl flex-wrap items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <button
            type="button"
            disabled={isFirstVisitGuide}
            onClick={() => {
              if (isFirstVisitGuide) return;
              hsAudio.playSfx('box_open');
              onOpenQuestLog();
            }}
            onMouseEnter={() => !isFirstVisitGuide && hsAudio.playSfx('box_hover', 0.5)}
            className={`hs-brass-btn flex min-h-[42px] items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-amber-100 sm:gap-2.5 sm:px-3.5 sm:py-2 ${lockedBtnStyle}`}
          >
            <SnsQuestScrollIcon size={30} className="shrink-0 drop-shadow" />
            <div className="text-left">
              <div className="hs-title text-[11px] font-extrabold tracking-wide text-amber-100 sm:text-xs">
                의뢰 · 보상표
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
            disabled={isFirstVisitGuide}
            onClick={() => {
              if (isFirstVisitGuide) return;
              hsAudio.playSfx('ui_click');
              onOpenShop();
            }}
            onMouseEnter={() => !isFirstVisitGuide && hsAudio.playSfx('box_hover', 0.5)}
            className={`hs-brass-btn flex min-h-[42px] items-center gap-2 rounded-xl px-2.5 py-1.5 sm:gap-3 sm:px-3.5 sm:py-2 ${lockedBtnStyle}`}
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

          {showInstallBtn && (
            <button
              type="button"
              data-testid="hub-pwa-install-btn"
              onClick={() => {
                hsAudio.playSfx('ui_click');
                promptInstallGamePwa();
              }}
              className="hs-arcane-btn flex min-h-[42px] items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-white sm:px-3 sm:py-2"
            >
              <span>📲</span>
              <span>앱 설치</span>
            </button>
          )}

          {showFullscreenBtn && (
            <button
              type="button"
              data-testid="hub-fullscreen-btn"
              onClick={() => {
                hsAudio.playSfx('ui_click');
                toggleBrowserFullscreen();
              }}
              onMouseEnter={() => hsAudio.playSfx('box_hover', 0.5)}
              title={fullscreenActive ? '전체화면 해제' : '전체화면 전환'}
              className="hs-brass-btn flex min-h-[42px] items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-amber-100 sm:px-3 sm:py-2"
            >
              <span className="text-amber-300">{fullscreenActive ? '🗗' : '⛶'}</span>
              <span className="hidden sm:inline">
                {fullscreenActive ? '창모드' : '전체화면'}
              </span>
            </button>
          )}

          <button
            type="button"
            disabled={isFirstVisitGuide}
            onClick={() => {
              if (isFirstVisitGuide) return;
              hsAudio.playSfx('open_menu');
              onOpenOptions();
            }}
            onMouseEnter={() => !isFirstVisitGuide && hsAudio.playSfx('box_hover', 0.5)}
            className={`hs-brass-btn flex min-h-[42px] items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-extrabold text-amber-100 sm:gap-1.5 sm:px-3.5 sm:py-2.5 sm:text-sm ${lockedBtnStyle}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="text-amber-300">
              <path
                d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z"
                stroke="currentColor"
                strokeWidth="2.2"
              />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1.51 1 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
                stroke="currentColor"
                strokeWidth="1.9"
              />
            </svg>
            <span>메뉴</span>
          </button>
        </div>
      </header>

      {/* Centerpiece: THE SNSHERO BOX */}
      <main className="relative z-20 my-auto flex w-full max-w-[820px] flex-col items-center pt-3 sm:pt-0">
        {isFirstVisitGuide && (
          <div className="mb-2 rounded-full border-2 border-emerald-300 bg-gradient-to-r from-emerald-950/95 via-teal-900/95 to-emerald-950/95 px-4 py-1.5 text-center text-xs font-extrabold text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.55)] sm:text-sm">
            ✨ 첫 방문 가이드: 아래 손가락이 가리키는 <b className="text-yellow-300">「스토리모드」</b>를 눌러 첫 모험을 시작하세요!
          </div>
        )}

        <div className="hs-wood-panel relative flex w-full flex-col items-center rounded-[28px] px-3.5 pb-4 pt-2 sm:rounded-[34px] sm:px-10 sm:pb-7 sm:pt-3">
          {/* Carved Wooden Chest Relief Grain & Brass Corner Inlay */}
          <div
            style={{
              background:
                'radial-gradient(circle at 50% 44%, rgba(251,191,36,0.14) 0%, rgba(24,13,6,0.45) 58%, rgba(10,5,2,0.78) 100%)',
            }}
            className="pointer-events-none absolute inset-2 rounded-[22px] sm:rounded-[26px]"
          />

          <div className="pointer-events-none absolute inset-2.5 rounded-[20px] border-2 border-[#e2be75]/40 shadow-[inset_0_0_28px_rgba(0,0,0,0.8)] sm:inset-3 sm:rounded-[24px]" />

          {/* 4 Forged Brass Corner Rivets */}
          <div className="pointer-events-none absolute left-4 top-4 h-3 w-3 rounded-full border border-amber-100 bg-gradient-to-b from-amber-300 to-amber-800 shadow-md sm:left-5 sm:top-5 sm:h-3.5 sm:w-3.5" />
          <div className="pointer-events-none absolute right-4 top-4 h-3 w-3 rounded-full border border-amber-100 bg-gradient-to-b from-amber-300 to-amber-800 shadow-md sm:right-5 sm:top-5 sm:h-3.5 sm:w-3.5" />
          <div className="pointer-events-none absolute bottom-4 left-4 h-3 w-3 rounded-full border border-amber-100 bg-gradient-to-b from-amber-300 to-amber-800 shadow-md sm:bottom-5 sm:left-5 sm:h-3.5 sm:w-3.5" />
          <div className="pointer-events-none absolute bottom-4 right-4 h-3 w-3 rounded-full border border-amber-100 bg-gradient-to-b from-amber-300 to-amber-800 shadow-md sm:bottom-5 sm:right-5 sm:h-3.5 sm:w-3.5" />

          {/* Overhanging Official 눈히어로 Logo Crest */}
          <img
            src={SNS_LOGO_URL}
            alt="눈히어로"
            draggable={false}
            className="relative z-10 -mt-6 w-[196px] drop-shadow-[0_14px_22px_rgba(0,0,0,0.94)] sm:-mt-11 sm:w-[308px]"
          />

          {/* Center 3D Rotating Brass & Ivory Medallion ("The Box" Turntable) */}
          <div
            style={{
              transform: diskSpinning
                ? 'perspective(950px) rotateY(90deg) scale(0.95)'
                : 'perspective(950px) rotateY(0deg) scale(1)',
              transition: 'transform 0.34s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className="relative z-10 my-1 flex h-[284px] w-[284px] flex-col items-center justify-center rounded-full border-[5px] border-[#dfb96c] bg-radial from-[#f5e7c4] via-[#c7a467] to-[#5e4120] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.9),inset_0_0_30px_rgba(44,26,10,0.85)] sm:h-[360px] sm:w-[360px] sm:border-[6px] sm:p-6"
          >
            {/* Engraved Concentric Brass & Oak Turntable Rings */}
            <div
              style={{
                background:
                  'repeating-radial-gradient(circle at 50% 50%, rgba(74,44,17,0.12) 0px, rgba(74,44,17,0.12) 6px, rgba(255,243,214,0.08) 6px, rgba(255,243,214,0.08) 12px)',
              }}
              className="pointer-events-none absolute inset-1.5 rounded-full border border-[#6e481b]/45"
            />

            {/* Arcane Glow Ring around Turntable */}
            <svg
              viewBox="0 0 240 240"
              className="pointer-events-none absolute -inset-5 h-[calc(100%+40px)] w-[calc(100%+40px)] animate-[hsSlowSpin_32s_linear_infinite] rounded-full opacity-90 sm:-inset-6 sm:h-[calc(100%+48px)] sm:w-[calc(100%+48px)]"
            >
              <defs>
                <radialGradient id="hubTurntableGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="68%" stopColor="rgba(56,189,248,0)" />
                  <stop offset="86%" stopColor="rgba(56,189,248,0.45)" />
                  <stop offset="95%" stopColor="rgba(253,224,71,0.55)" />
                  <stop offset="100%" stopColor="rgba(56,189,248,0)" />
                </radialGradient>
              </defs>
              <circle cx="120" cy="120" r="116" fill="url(#hubTurntableGlow)" />
              <circle
                cx="120"
                cy="120"
                r="107"
                fill="none"
                stroke="rgba(186,230,253,0.55)"
                strokeWidth="1.8"
                strokeDasharray="12 9 3 9"
              />
            </svg>

            {/* Top Sculpted Snow-Compass Seal */}
            <SnsSnowCompassSeal
              size={38}
              className="relative z-10 -mt-1.5 mb-1 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] sm:-mt-2 sm:mb-1.5 sm:h-12 sm:w-12"
            />

            {/* 3 Identical-Height Beveled Ivory/Parchment Menu Plates */}
            <div className="relative z-10 flex w-full max-w-[218px] flex-col gap-2 sm:max-w-[248px] sm:gap-2.5">
              {/* 1. 랭킹대전 */}
              <button
                type="button"
                data-testid="hub-mode-ranked"
                disabled={isFirstVisitGuide}
                onMouseEnter={() => !isFirstVisitGuide && hsAudio.playSfx('box_hover', 0.55)}
                onClick={() => triggerModeTransition('RANKED')}
                className={`hs-ivory-plate group flex h-[52px] w-full flex-col items-center justify-center rounded-2xl px-3 sm:h-[60px] sm:px-4 ${lockedBtnStyle}`}
              >
                <span className="hs-title text-[15px] font-extrabold leading-tight tracking-wider text-[#2d1a0b] group-hover:text-[#0c4a6e] sm:text-lg">
                  랭킹대전
                </span>
                <span className="mt-0.5 truncate text-[9.5px] font-extrabold tracking-tight text-[#6b4826] sm:text-[10.5px]">
                  승리 +25G · 3승 +30G · 등급 별(★)
                </span>
              </button>

              {/* 2. AI대전 */}
              <button
                type="button"
                data-testid="hub-mode-ai"
                disabled={isFirstVisitGuide}
                onMouseEnter={() => !isFirstVisitGuide && hsAudio.playSfx('box_hover', 0.55)}
                onClick={() => triggerModeTransition('PRACTICE_NORMAL')}
                className={`hs-ivory-plate group flex h-[52px] w-full flex-col items-center justify-center rounded-2xl px-3 sm:h-[60px] sm:px-4 ${lockedBtnStyle}`}
              >
                <span className="hs-title text-[15px] font-extrabold leading-tight tracking-wider text-[#2d1a0b] group-hover:text-[#7c2d12] sm:text-lg">
                  AI대전
                </span>
                <span className="mt-0.5 truncate text-[9.5px] font-extrabold tracking-tight text-[#6b4826] sm:text-[10.5px]">
                  종족 초회 +25~50G · 올클리어 +2팩
                </span>
              </button>

              {/* 3. 스토리모드 (Equal Height + First-Visit Pointing Hand Indicator) */}
              <div className="relative w-full">
                {isFirstVisitGuide && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-4 -top-5 z-30 flex animate-bounce items-center gap-1 rounded-full border-2 border-yellow-200 bg-gradient-to-b from-amber-400 to-amber-700 px-2.5 py-0.5 text-xs font-black text-stone-950 shadow-[0_6px_18px_rgba(0,0,0,0.9)] sm:-right-7 sm:-top-6 sm:px-3 sm:py-1 sm:text-sm"
                  >
                    <span className="text-base leading-none sm:text-lg">👈</span>
                    <span>클릭!</span>
                  </div>
                )}

                <button
                  type="button"
                  data-testid="hub-mode-story"
                  onMouseEnter={() => hsAudio.playSfx('box_hover', 0.55)}
                  onClick={() => triggerModeTransition('TUTORIAL')}
                  className={`hs-ivory-plate group relative flex h-[52px] w-full flex-col items-center justify-center rounded-2xl px-3 sm:h-[60px] sm:px-4 ${
                    isFirstVisitGuide
                      ? 'ring-4 ring-emerald-400 shadow-[0_0_26px_rgba(52,211,153,0.95)]'
                      : ''
                  }`}
                >
                  <span className="hs-title text-[15px] font-extrabold leading-tight tracking-wider text-[#14532d] group-hover:text-[#064e3b] sm:text-lg">
                    스토리모드
                  </span>
                  <span className="mt-0.5 max-w-full truncate text-[9.5px] font-extrabold tracking-tight text-[#5c3d1e] sm:text-[10.5px]">
                    {profile.journeyReincarnation > 0 ? `${profile.journeyReincarnation}환생 · ` : ''}
                    제{profile.journeyEpisode}화 {currentEp.titleKo} · 보스팩 보상
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Recessed Brass Drawer Tray */}
          <div className="relative z-10 mt-2.5 grid w-full max-w-2xl grid-cols-2 gap-2 rounded-2xl border-[2.5px] border-[#a88246] bg-gradient-to-b from-[#231409] to-[#120a04] p-2.5 shadow-[inset_0_4px_14px_rgba(0,0,0,0.9)] sm:mt-3 sm:grid-cols-4 sm:gap-2.5 sm:border-[3px] sm:p-3">
            <button
              type="button"
              disabled={isFirstVisitGuide}
              onMouseEnter={() => !isFirstVisitGuide && hsAudio.playSfx('box_hover', 0.5)}
              onClick={() => {
                if (isFirstVisitGuide) return;
                hsAudio.playSfx('box_press');
                onOpenPacks();
              }}
              className={`hs-brass-btn relative flex min-h-[48px] items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-amber-100 sm:gap-2.5 sm:px-3 sm:py-2 ${lockedBtnStyle}`}
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
              disabled={isFirstVisitGuide}
              onMouseEnter={() => !isFirstVisitGuide && hsAudio.playSfx('box_hover', 0.5)}
              onClick={() => {
                if (isFirstVisitGuide) return;
                hsAudio.playSfx('box_press');
                onOpenCollection();
              }}
              className={`hs-brass-btn flex min-h-[48px] items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-amber-100 sm:gap-2.5 sm:px-3 sm:py-2 ${lockedBtnStyle}`}
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
                  3장=3배 강화 · 382종
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={isFirstVisitGuide}
              onMouseEnter={() => !isFirstVisitGuide && hsAudio.playSfx('box_hover', 0.5)}
              onClick={() => {
                if (isFirstVisitGuide) return;
                hsAudio.playSfx('box_open');
                onOpenQuestLog();
              }}
              className={`hs-brass-btn flex min-h-[48px] items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-amber-100 sm:gap-2.5 sm:px-3 sm:py-2 ${lockedBtnStyle}`}
            >
              <SnsQuestScrollIcon size={32} className="shrink-0 drop-shadow" />
              <div className="min-w-0">
                <div className="hs-title truncate text-xs font-extrabold text-amber-100 sm:text-sm">
                  의뢰 일지
                </div>
                <div className="text-[10px] font-bold text-amber-300/85">
                  모드별 보상 · 의뢰
                </div>
              </div>
            </button>

            <button
              type="button"
              disabled={isFirstVisitGuide}
              onMouseEnter={() => !isFirstVisitGuide && hsAudio.playSfx('box_hover', 0.5)}
              onClick={() => {
                if (isFirstVisitGuide) return;
                hsAudio.playSfx('box_press');
                onOpenShop();
              }}
              className={`hs-brass-btn flex min-h-[48px] items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-amber-100 sm:gap-2.5 sm:px-3 sm:py-2 ${lockedBtnStyle}`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-300/50 bg-stone-950/60 sm:h-9 sm:w-9">
                <HsGoldCoinIcon size={22} />
              </div>
              <div className="min-w-0">
                <div className="hs-title truncate text-xs font-extrabold text-amber-100 sm:text-sm">
                  눈히어로 보급소
                </div>
                <div className="text-[10px] font-bold text-amber-300/85">
                  골드·현금 팩 구매
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Subtle Footer Plaque */}
      <footer className="relative z-20 pt-1 text-center text-[10.5px] font-bold tracking-wide text-amber-200/80 sm:text-[11px]">
        눈히어로 11종족 110영웅 · 수집 카드 382종 완비 · 배경음 기본 15% · 로컬 자동 보존
      </footer>
    </div>
  );
};
