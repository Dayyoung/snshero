import React, { useEffect, useState } from 'react';
import { hsAudio } from '../audio';
import { CLASSIC_RANK_NAMES } from '../cardDb';
import { HsArcaneDustVialIcon, HsGoldCoinIcon } from '../components/CardVisual';
import { GameMode, PlayerProfile } from '../types';

export interface BoxHubScreenProps {
  profile: PlayerProfile;
  onSelectPlayMode: (mode: GameMode) => void;
  onOpenCollection: () => void;
  onOpenPacks: () => void;
  onOpenQuestLog: () => void;
  onOpenShop: () => void;
  onOpenOptions: () => void;
  onOpenReaModal: () => void;
}

export const BoxHubScreen: React.FC<BoxHubScreenProps> = ({
  profile,
  onSelectPlayMode,
  onOpenCollection,
  onOpenPacks,
  onOpenQuestLog,
  onOpenShop,
  onOpenOptions,
  onOpenReaModal,
}) => {
  const [diskSpinning, setDiskSpinning] = useState(false);

  useEffect(() => {
    hsAudio.playBgm('tavern_hub');
  }, []);

  const triggerModeTransition = (mode: GameMode) => {
    hsAudio.playSfx('box_press');
    hsAudio.playSfx('box_disk_flip', 0.85);
    setDiskSpinning(true);
    window.setTimeout(() => {
      setDiskSpinning(false);
      onSelectPlayMode(mode);
    }, 340);
  };

  const rankTitle = CLASSIC_RANK_NAMES[profile.rank] || '화난 닭';
  const rankMedalImg =
    profile.rank === 0 ? '/stone-assets/ui/medal_legend.webp' : '/stone-assets/ui/medal_bronze.webp';

  return (
    <div
      style={{ backgroundImage: 'url(/stone-assets/ui/box_table_bg.webp)' }}
      className="relative flex h-[100dvh] w-full select-none flex-col items-center justify-between overflow-y-auto bg-cover bg-center px-2.5 py-2 sm:overflow-hidden sm:p-5"
    >
      {/* Warm Candlelight Tavern Table Vignette */}
      <div
        style={{
          background:
            'radial-gradient(ellipse at 50% 48%, rgba(255,198,105,0.08) 0%, rgba(12,7,4,0.38) 62%, rgba(5,3,2,0.86) 100%)',
        }}
        className="pointer-events-none absolute inset-0"
      />

      {/* Top Brass HUD Bar (All 4 Controls Visible on Mobile Portrait & Desktop!) */}
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
            <img
              src="/stone-assets/ui/hs_questlog.webp"
              alt="퀘스트 일지"
              className="h-7 w-7 rounded-lg border border-amber-300/60 object-cover shadow sm:h-9 sm:w-9"
            />
            <div className="text-left">
              <div className="hs-title text-[11px] font-extrabold tracking-wide text-amber-100 sm:text-xs">
                퀘스트 · 전적
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-amber-300/90 sm:gap-1.5 sm:text-[10.5px]">
                <img src={rankMedalImg} alt="" className="h-3.5 w-3.5 object-contain sm:h-4 sm:w-4" />
                <span>
                  {profile.rank === 0 ? '전설 등급' : `${profile.rank}등급`}
                  <span className="hidden sm:inline">{profile.rank > 0 ? ` · ${rankTitle}` : ''}</span>
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('ui_click');
              onOpenReaModal();
            }}
            onMouseEnter={() => hsAudio.playSfx('box_hover', 0.45)}
            className="hs-brass-btn flex min-h-[42px] items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-extrabold text-sky-200 sm:gap-2 sm:px-3 sm:py-2 sm:text-xs"
          >
            <img
              src="/stone-assets/ui/box_compass_medallion.webp"
              alt=""
              className="h-5 w-5 object-contain sm:h-6 sm:w-6"
            />
            <span className="sm:hidden">REA 검증</span>
            <span className="hidden sm:inline">REA 원본 검증</span>
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

      {/* Centerpiece: THE HEARTHSTONE BOX (Carved Hinged Wooden Jewelry Box) */}
      <main className="relative z-20 my-auto flex w-full max-w-[820px] flex-col items-center pt-4 sm:pt-0">
        <div className="hs-wood-panel relative flex w-full flex-col items-center rounded-[28px] px-3.5 pb-4 pt-2 sm:rounded-[34px] sm:px-10 sm:pb-7 sm:pt-3">
          {/* Authentic Extracted Wooden Chest Relief Texture */}
          <div
            style={{ backgroundImage: 'url(/stone-assets/ui/box_chest_full.webp)' }}
            className="pointer-events-none absolute inset-2 rounded-[22px] bg-cover bg-center opacity-22 mix-blend-luminosity sm:rounded-[26px]"
          />

          {/* Inner Recessed Brass Filigree Frame */}
          <div className="pointer-events-none absolute inset-2.5 rounded-[20px] border-2 border-[#e2be75]/35 shadow-[inset_0_0_28px_rgba(0,0,0,0.75)] sm:inset-3 sm:rounded-[24px]" />

          {/* 4 Forged Brass Corner Rivets */}
          <div className="pointer-events-none absolute left-4 top-4 h-3 w-3 rounded-full border border-amber-100 bg-gradient-to-b from-amber-300 to-amber-800 shadow-md sm:left-5 sm:top-5 sm:h-3.5 sm:w-3.5" />
          <div className="pointer-events-none absolute right-4 top-4 h-3 w-3 rounded-full border border-amber-100 bg-gradient-to-b from-amber-300 to-amber-800 shadow-md sm:right-5 sm:top-5 sm:h-3.5 sm:w-3.5" />
          <div className="pointer-events-none absolute bottom-4 left-4 h-3 w-3 rounded-full border border-amber-100 bg-gradient-to-b from-amber-300 to-amber-800 shadow-md sm:bottom-5 sm:left-5 sm:h-3.5 sm:w-3.5" />
          <div className="pointer-events-none absolute bottom-4 right-4 h-3 w-3 rounded-full border border-amber-100 bg-gradient-to-b from-amber-300 to-amber-800 shadow-md sm:bottom-5 sm:right-5 sm:h-3.5 sm:w-3.5" />

          {/* Master Sculpted Stone & Gold HEARTHSTONE Logo */}
          <img
            src="/stone-assets/ui/hs_logo_master.webp"
            alt="Hearthstone"
            className="relative z-10 -mt-7 w-[224px] drop-shadow-[0_14px_22px_rgba(0,0,0,0.92)] sm:-mt-12 sm:w-[345px]"
          />

          {/* Center Rotating Brass Medallion ("The Box" Turntable) */}
          <div
            style={{
              transform: diskSpinning
                ? 'perspective(950px) rotateY(90deg) scale(0.95)'
                : 'perspective(950px) rotateY(0deg) scale(1)',
              transition: 'transform 0.34s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className="relative z-10 my-1 flex h-[262px] w-[262px] flex-col items-center justify-center rounded-full border-[5px] border-[#dfb96c] bg-radial from-[#f5e7c4] via-[#c7a467] to-[#5e4120] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.9),inset_0_0_30px_rgba(44,26,10,0.85)] sm:h-[338px] sm:w-[338px] sm:border-[6px] sm:p-6"
          >
            {/* Extracted Wooden Turntable Disk Texture */}
            <img
              src="/stone-assets/ui/box_menu_disk.webp"
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full rounded-full object-cover opacity-50 mix-blend-multiply"
            />

            {/* Arcane Glow Ring around Turntable */}
            <img
              src="/stone-assets/ui/hs_thebox_glowring.webp"
              alt=""
              className="pointer-events-none absolute -inset-5 h-[calc(100%+40px)] w-[calc(100%+40px)] animate-[hsSlowSpin_32s_linear_infinite] rounded-full object-contain opacity-85 mix-blend-screen sm:-inset-6 sm:h-[calc(100%+48px)] sm:w-[calc(100%+48px)]"
            />

            {/* Top Sculpted Hearthstone Compass Swirl Seal */}
            <img
              src="/stone-assets/ui/box_compass_medallion.webp"
              alt=""
              className="relative z-10 -mt-1.5 mb-1 h-10 w-10 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] sm:-mt-2 sm:mb-1.5 sm:h-14 sm:w-14"
            />

            {/* 3 Authentic Beveled Ivory/Parchment Menu Plates */}
            <div className="relative z-10 flex w-full max-w-[205px] flex-col gap-1.5 sm:max-w-[232px] sm:gap-2.5">
              <button
                type="button"
                onMouseEnter={() => hsAudio.playSfx('box_hover', 0.55)}
                onClick={() => triggerModeTransition('RANKED')}
                className="hs-ivory-plate group flex flex-col items-center rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2.5"
              >
                <span className="hs-title text-base font-extrabold tracking-wider text-[#2d1a0b] group-hover:text-[#0c4a6e] sm:text-xl">
                  대전
                </span>
                <span className="text-[9.5px] font-extrabold tracking-tight text-[#6b4826] sm:text-[10px]">
                  클래식 등급전 · 일반전
                </span>
              </button>

              <button
                type="button"
                onMouseEnter={() => hsAudio.playSfx('box_hover', 0.55)}
                onClick={() => triggerModeTransition('PRACTICE_NORMAL')}
                className="hs-ivory-plate group flex flex-col items-center rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2"
              >
                <span className="hs-title text-sm font-extrabold tracking-wider text-[#2d1a0b] group-hover:text-[#7c2d12] sm:text-lg">
                  연습
                </span>
                <span className="text-[9.5px] font-extrabold tracking-tight text-[#6b4826] sm:text-[10px]">
                  여관주인 AI 대결 (일반 · 숙련)
                </span>
              </button>

              <button
                type="button"
                onMouseEnter={() => hsAudio.playSfx('box_hover', 0.55)}
                onClick={() => triggerModeTransition('TUTORIAL')}
                className="hs-ivory-plate group flex flex-col items-center rounded-2xl px-3 py-1 sm:px-4 sm:py-1.5"
              >
                <span className="hs-title text-xs font-extrabold tracking-wider text-[#2d1a0b] group-hover:text-[#14532d] sm:text-base">
                  입문 튜토리얼
                </span>
                <span className="text-[9px] font-bold text-[#6b4826] sm:text-[9.5px]">
                  실전 코칭 가이드 매치
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Recessed Brass Drawer Tray: Packs · Collection · Quests · Shop */}
          <div className="relative z-10 mt-2.5 grid w-full max-w-2xl grid-cols-2 gap-2 rounded-2xl border-[2.5px] border-[#a88246] bg-gradient-to-b from-[#231409] to-[#120a04] p-2.5 shadow-[inset_0_4px_14px_rgba(0,0,0,0.9)] sm:mt-3 sm:grid-cols-4 sm:gap-2.5 sm:border-[3px] sm:p-3">
            <button
              type="button"
              onMouseEnter={() => hsAudio.playSfx('box_hover', 0.5)}
              onClick={() => {
                hsAudio.playSfx('box_press');
                onOpenPacks();
              }}
              className="hs-brass-btn relative flex min-h-[48px] items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-amber-100 sm:gap-2.5 sm:px-3 sm:py-2"
            >
              {profile.packs > 0 && (
                <span className="hs-num absolute -right-1.5 -top-1.5 z-20 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-red-200 bg-gradient-to-b from-red-500 to-red-800 px-1 text-[11px] text-white shadow-[0_3px_10px_rgba(220,38,38,0.85)] sm:-right-2 sm:-top-2 sm:h-6 sm:min-w-6 sm:px-1.5 sm:text-xs">
                  {profile.packs}
                </span>
              )}
              <img
                src="/stone-assets/ui/classic_pack.webp"
                alt=""
                className="h-9 w-7 shrink-0 object-contain drop-shadow sm:h-10 sm:w-8"
              />
              <div className="min-w-0">
                <div className="hs-title truncate text-xs font-extrabold text-amber-100 sm:text-sm">
                  카드 팩 개봉
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
              className="hs-brass-btn flex min-h-[48px] items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-amber-100 sm:gap-2.5 sm:px-3 sm:py-2"
            >
              <img
                src="/stone-assets/ui/crest_mage.webp"
                alt=""
                className="h-8 w-8 shrink-0 rounded-full border border-amber-300/60 object-cover shadow sm:h-9 sm:w-9"
              />
              <div className="min-w-0">
                <div className="hs-title truncate text-xs font-extrabold text-amber-100 sm:text-sm">
                  내 카드첩
                </div>
                <div className="text-[10px] font-bold text-amber-300/85">
                  덱 빌더 · 382종
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
              className="hs-brass-btn flex min-h-[48px] items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-amber-100 sm:gap-2.5 sm:px-3 sm:py-2"
            >
              <img
                src="/stone-assets/ui/hs_questlog.webp"
                alt=""
                className="h-8 w-8 shrink-0 rounded-lg border border-amber-300/50 object-cover shadow sm:h-9 sm:w-9"
              />
              <div className="min-w-0">
                <div className="hs-title truncate text-xs font-extrabold text-amber-100 sm:text-sm">
                  퀘스트 일지
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
              className="hs-brass-btn flex min-h-[48px] items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-amber-100 sm:gap-2.5 sm:px-3 sm:py-2"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-300/50 bg-stone-950/60 sm:h-9 sm:w-9">
                <HsGoldCoinIcon size={22} />
              </div>
              <div className="min-w-0">
                <div className="hs-title truncate text-xs font-extrabold text-amber-100 sm:text-sm">
                  여관 상점
                </div>
                <div className="text-[10px] font-bold text-amber-300/85">
                  팩 구매 · 전체해금
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Subtle Footer Plaque */}
      <footer className="relative z-20 pt-1 text-center text-[10.5px] font-bold tracking-wide text-amber-200/80 sm:text-[11px]">
        오리지널 9직업 · 한국어 카드 382종 완비 · 모든 진행 데이터 로컬 자동 보존
      </footer>
    </div>
  );
};
