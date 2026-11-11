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
    profile.rank === 0 ? '/hs-assets/ui/medal_legend.webp' : '/hs-assets/ui/medal_bronze.webp';

  return (
    <div
      style={{ backgroundImage: 'url(/hs-assets/ui/box_table_bg.webp)' }}
      className="relative flex h-[100dvh] w-full select-none flex-col items-center justify-between overflow-hidden bg-cover bg-center p-3 sm:p-5"
    >
      {/* Warm Candlelight Tavern Table Vignette */}
      <div
        style={{
          background:
            'radial-gradient(ellipse at 50% 48%, rgba(255,198,105,0.08) 0%, rgba(12,7,4,0.38) 62%, rgba(5,3,2,0.86) 100%)',
        }}
        className="pointer-events-none absolute inset-0"
      />

      {/* Top Brass HUD Bar */}
      <header className="relative z-20 flex w-full max-w-6xl items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('box_open');
              onOpenQuestLog();
            }}
            onMouseEnter={() => hsAudio.playSfx('box_hover', 0.5)}
            className="hs-brass-btn flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-amber-100"
          >
            <img
              src="/hs-assets/ui/hs_questlog.webp"
              alt="퀘스트 일지"
              className="h-9 w-9 rounded-lg border border-amber-300/60 object-cover shadow"
            />
            <div className="text-left">
              <div className="hs-title text-xs font-extrabold tracking-wide text-amber-100">
                퀘스트 일지 · 전적
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[10.5px] font-bold text-amber-300/90">
                <img src={rankMedalImg} alt="" className="h-4 w-4 object-contain" />
                <span>
                  {profile.rank === 0 ? '전설 등급' : `${profile.rank}등급 · ${rankTitle}`}
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
            className="hs-brass-btn hidden items-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold text-sky-200 md:flex"
          >
            <img
              src="/hs-assets/ui/box_compass_medallion.webp"
              alt=""
              className="h-6 w-6 object-contain"
            />
            <span>REA 원본 검증</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('ui_click');
              onOpenShop();
            }}
            onMouseEnter={() => hsAudio.playSfx('box_hover', 0.5)}
            className="hs-brass-btn flex items-center gap-3 rounded-xl px-3.5 py-2"
          >
            <span className="flex items-center gap-1.5">
              <HsGoldCoinIcon size={21} />
              <span className="hs-num text-base text-yellow-300">{profile.gold}</span>
            </span>
            <span className="h-4 w-[1px] bg-amber-400/35" />
            <span className="flex items-center gap-1.5">
              <HsArcaneDustVialIcon size={20} />
              <span className="hs-num text-sm text-sky-200">{profile.arcaneDust}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('open_menu');
              onOpenOptions();
            }}
            onMouseEnter={() => hsAudio.playSfx('box_hover', 0.5)}
            className="hs-brass-btn flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-amber-100 sm:text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-amber-300">
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
      <main className="relative z-20 my-auto flex w-full max-w-[820px] flex-col items-center">
        <div className="hs-wood-panel relative flex w-full flex-col items-center rounded-[34px] px-5 pb-6 pt-3 sm:px-10 sm:pb-7">
          {/* Authentic Extracted Wooden Chest Relief Texture */}
          <div
            style={{ backgroundImage: 'url(/hs-assets/ui/box_chest_full.webp)' }}
            className="pointer-events-none absolute inset-2 rounded-[26px] bg-cover bg-center opacity-22 mix-blend-luminosity"
          />

          {/* Inner Recessed Brass Filigree Frame */}
          <div className="pointer-events-none absolute inset-3 rounded-[24px] border-2 border-[#e2be75]/35 shadow-[inset_0_0_28px_rgba(0,0,0,0.75)]" />

          {/* 4 Forged Brass Corner Rivets */}
          <div className="pointer-events-none absolute left-5 top-5 h-3.5 w-3.5 rounded-full border border-amber-100 bg-gradient-to-b from-amber-300 to-amber-800 shadow-md" />
          <div className="pointer-events-none absolute right-5 top-5 h-3.5 w-3.5 rounded-full border border-amber-100 bg-gradient-to-b from-amber-300 to-amber-800 shadow-md" />
          <div className="pointer-events-none absolute bottom-5 left-5 h-3.5 w-3.5 rounded-full border border-amber-100 bg-gradient-to-b from-amber-300 to-amber-800 shadow-md" />
          <div className="pointer-events-none absolute bottom-5 right-5 h-3.5 w-3.5 rounded-full border border-amber-100 bg-gradient-to-b from-amber-300 to-amber-800 shadow-md" />

          {/* Master Sculpted Stone & Gold HEARTHSTONE Logo */}
          <img
            src="/hs-assets/ui/hs_logo_master.webp"
            alt="Hearthstone"
            className="relative z-10 -mt-10 w-[265px] drop-shadow-[0_14px_22px_rgba(0,0,0,0.92)] sm:-mt-12 sm:w-[345px]"
          />

          {/* Center Rotating Brass Medallion ("The Box" Turntable) */}
          <div
            style={{
              transform: diskSpinning
                ? 'perspective(950px) rotateY(90deg) scale(0.95)'
                : 'perspective(950px) rotateY(0deg) scale(1)',
              transition: 'transform 0.34s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className="relative z-10 my-1 flex h-[300px] w-[300px] flex-col items-center justify-center rounded-full border-[6px] border-[#dfb96c] bg-radial from-[#f5e7c4] via-[#c7a467] to-[#5e4120] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.9),inset_0_0_30px_rgba(44,26,10,0.85)] sm:h-[338px] sm:w-[338px]"
          >
            {/* Extracted Wooden Turntable Disk Texture */}
            <img
              src="/hs-assets/ui/box_menu_disk.webp"
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full rounded-full object-cover opacity-50 mix-blend-multiply"
            />

            {/* Arcane Glow Ring around Turntable */}
            <img
              src="/hs-assets/ui/hs_thebox_glowring.webp"
              alt=""
              className="pointer-events-none absolute -inset-6 h-[calc(100%+48px)] w-[calc(100%+48px)] animate-[hsSlowSpin_32s_linear_infinite] rounded-full object-contain opacity-85 mix-blend-screen"
            />

            {/* Top Sculpted Hearthstone Compass Swirl Seal */}
            <img
              src="/hs-assets/ui/box_compass_medallion.webp"
              alt=""
              className="relative z-10 -mt-2 mb-1.5 h-14 w-14 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
            />

            {/* 3 Authentic Beveled Ivory/Parchment Menu Plates */}
            <div className="relative z-10 flex w-full max-w-[232px] flex-col gap-2.5">
              <button
                type="button"
                onMouseEnter={() => hsAudio.playSfx('box_hover', 0.55)}
                onClick={() => triggerModeTransition('RANKED')}
                className="hs-ivory-plate group flex flex-col items-center rounded-2xl px-4 py-2.5"
              >
                <span className="hs-title text-lg font-extrabold tracking-wider text-[#2d1a0b] group-hover:text-[#0c4a6e] sm:text-xl">
                  대전
                </span>
                <span className="text-[10px] font-extrabold tracking-tight text-[#6b4826]">
                  클래식 등급전 · 일반전
                </span>
              </button>

              <button
                type="button"
                onMouseEnter={() => hsAudio.playSfx('box_hover', 0.55)}
                onClick={() => triggerModeTransition('PRACTICE_NORMAL')}
                className="hs-ivory-plate group flex flex-col items-center rounded-2xl px-4 py-2"
              >
                <span className="hs-title text-base font-extrabold tracking-wider text-[#2d1a0b] group-hover:text-[#7c2d12] sm:text-lg">
                  연습
                </span>
                <span className="text-[10px] font-extrabold tracking-tight text-[#6b4826]">
                  여관주인 AI 대결 (일반 · 숙련)
                </span>
              </button>

              <button
                type="button"
                onMouseEnter={() => hsAudio.playSfx('box_hover', 0.55)}
                onClick={() => triggerModeTransition('TUTORIAL')}
                className="hs-ivory-plate group flex flex-col items-center rounded-2xl px-4 py-1.5"
              >
                <span className="hs-title text-sm font-extrabold tracking-wider text-[#2d1a0b] group-hover:text-[#14532d] sm:text-base">
                  입문 튜토리얼
                </span>
                <span className="text-[9.5px] font-bold text-[#6b4826]">
                  실전 코칭 가이드 매치
                </span>
              </button>
            </div>
          </div>

          {/* Bottom Recessed Brass Drawer Tray: Packs · Collection · Quests · Shop */}
          <div className="relative z-10 mt-3 grid w-full max-w-2xl grid-cols-2 gap-2.5 rounded-2xl border-[3px] border-[#a88246] bg-gradient-to-b from-[#231409] to-[#120a04] p-3 shadow-[inset_0_4px_14px_rgba(0,0,0,0.9)] sm:grid-cols-4">
            <button
              type="button"
              onMouseEnter={() => hsAudio.playSfx('box_hover', 0.5)}
              onClick={() => {
                hsAudio.playSfx('box_press');
                onOpenPacks();
              }}
              className="hs-brass-btn relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-amber-100"
            >
              {profile.packs > 0 && (
                <span className="hs-num absolute -right-2 -top-2 z-20 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-red-200 bg-gradient-to-b from-red-500 to-red-800 px-1.5 text-xs text-white shadow-[0_3px_10px_rgba(220,38,38,0.85)]">
                  {profile.packs}
                </span>
              )}
              <img
                src="/hs-assets/ui/classic_pack.webp"
                alt=""
                className="h-10 w-8 shrink-0 object-contain drop-shadow"
              />
              <div className="min-w-0">
                <div className="hs-title truncate text-xs font-extrabold text-amber-100 sm:text-sm">
                  카드 팩 개봉
                </div>
                <div className="text-[10px] font-bold text-amber-300/80">
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
              className="hs-brass-btn flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-amber-100"
            >
              <img
                src="/hs-assets/ui/crest_mage.webp"
                alt=""
                className="h-9 w-9 shrink-0 rounded-full border border-amber-300/60 object-cover shadow"
              />
              <div className="min-w-0">
                <div className="hs-title truncate text-xs font-extrabold text-amber-100 sm:text-sm">
                  내 카드첩
                </div>
                <div className="text-[10px] font-bold text-amber-300/80">
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
              className="hs-brass-btn flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-amber-100"
            >
              <img
                src="/hs-assets/ui/hs_questlog.webp"
                alt=""
                className="h-9 w-9 shrink-0 rounded-lg border border-amber-300/50 object-cover shadow"
              />
              <div className="min-w-0">
                <div className="hs-title truncate text-xs font-extrabold text-amber-100 sm:text-sm">
                  퀘스트 일지
                </div>
                <div className="text-[10px] font-bold text-amber-300/80">
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
              className="hs-brass-btn flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-amber-100"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-300/50 bg-stone-950/60">
                <HsGoldCoinIcon size={24} />
              </div>
              <div className="min-w-0">
                <div className="hs-title truncate text-xs font-extrabold text-amber-100 sm:text-sm">
                  여관 상점
                </div>
                <div className="text-[10px] font-bold text-amber-300/80">
                  팩 구매 · 전체해금
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Subtle Footer Plaque */}
      <footer className="relative z-20 text-center text-[11px] font-semibold tracking-wide text-amber-200/75">
        오리지널 9직업 · 기본/클래식 공식 한국어 카드 382종 완비 · 모든 진행 데이터 브라우저 자동 보존
      </footer>
    </div>
  );
};
