import React, { useEffect, useState } from 'react';
import { hsAudio } from '../audio';
import { CLASSIC_RANK_NAMES } from '../cardDb';
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

  return (
    <div
      style={{ backgroundImage: 'url(/hs-assets/ui/tavern_bg.webp)' }}
      className="relative flex h-[100dvh] w-full select-none flex-col items-center justify-between overflow-hidden bg-cover bg-center p-3 sm:p-5"
    >
      {/* Warm Tavern Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-radial from-transparent via-black/25 to-black/80" />

      {/* Top Header Bar */}
      <header className="relative z-20 flex w-full max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('box_open');
              onOpenQuestLog();
            }}
            onMouseEnter={() => hsAudio.playSfx('box_hover', 0.5)}
            className="flex items-center gap-2.5 rounded-2xl border-2 border-[#d5b067] bg-gradient-to-b from-[#49301b] to-[#24160b] px-3.5 py-2 text-amber-100 shadow-xl transition hover:scale-105 hover:brightness-110"
          >
            <img
              src="/hs-assets/ui/hs_questlog.webp"
              alt="퀘스트"
              className="h-8 w-8 rounded-lg object-cover"
            />
            <div className="text-left">
              <div className="text-xs font-extrabold text-amber-200">퀘스트 일지</div>
              <div className="text-[10px] text-amber-300/85">
                {profile.rank === 0 ? '전설 등급' : `${profile.rank}등급 · ${rankTitle}`}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('ui_click');
              onOpenReaModal();
            }}
            className="hidden items-center gap-1.5 rounded-2xl border border-sky-400/60 bg-slate-950/80 px-3 py-2 text-xs font-bold text-sky-200 shadow-lg hover:bg-slate-900 sm:flex"
          >
            <span>🔬</span>
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
            className="flex items-center gap-2 rounded-2xl border-2 border-[#e0bd72] bg-gradient-to-b from-[#4a3219] to-[#24160a] px-3.5 py-2 shadow-xl transition hover:scale-105"
          >
            <span className="text-lg">🪙</span>
            <span className="hs-num text-base text-yellow-300">{profile.gold}</span>
            <span className="ml-1 text-xs font-bold text-sky-300">🧪 {profile.arcaneDust}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('open_menu');
              onOpenOptions();
            }}
            className="rounded-2xl border-2 border-[#cfa85e] bg-gradient-to-b from-[#47301b] to-[#23160b] px-3.5 py-2 text-sm font-extrabold text-amber-100 shadow-xl hover:brightness-110"
          >
            ⚙ 메뉴
          </button>
        </div>
      </header>

      {/* Center: THE HEARTHSTONE BOX (3D Carved Oak & Brass Case) */}
      <main className="relative z-20 my-auto flex w-full max-w-4xl flex-col items-center">
        <div className="relative flex w-full flex-col items-center rounded-[36px] border-[6px] border-[#c8a15a] bg-gradient-to-b from-[#54371f] via-[#3a2413] to-[#22140a] px-5 pb-7 pt-4 shadow-[0_28px_70px_rgba(0,0,0,0.92),inset_0_2px_16px_rgba(255,222,150,0.35)] sm:px-10">
          {/* Corner Brass Rivets */}
          <div className="pointer-events-none absolute left-4 top-4 h-4 w-4 rounded-full border border-amber-200 bg-amber-600 shadow" />
          <div className="pointer-events-none absolute right-4 top-4 h-4 w-4 rounded-full border border-amber-200 bg-amber-600 shadow" />
          <div className="pointer-events-none absolute bottom-4 left-4 h-4 w-4 rounded-full border border-amber-200 bg-amber-600 shadow" />
          <div className="pointer-events-none absolute bottom-4 right-4 h-4 w-4 rounded-full border border-amber-200 bg-amber-600 shadow" />

          {/* Official Hearthstone Title Plaque */}
          <img
            src="/hs-assets/ui/hs_titlelogo.webp"
            alt="Hearthstone"
            className="-mt-9 w-[250px] drop-shadow-[0_10px_18px_rgba(0,0,0,0.9)] sm:w-[310px]"
          />

          {/* Center Rotating Brass Medallion ("The Box" Turntable) */}
          <div
            style={{
              transform: diskSpinning
                ? 'perspective(900px) rotateY(90deg) scale(0.95)'
                : 'perspective(900px) rotateY(0deg) scale(1)',
              transition: 'transform 0.34s ease-in-out',
            }}
            className="relative my-2 flex h-[290px] w-[290px] flex-col items-center justify-center rounded-full border-[7px] border-[#dbb66c] bg-radial from-[#f5e7c4] via-[#d7be8c] to-[#8f6e3f] p-6 shadow-[0_14px_38px_rgba(0,0,0,0.88),inset_0_0_28px_rgba(68,42,16,0.75)] sm:h-[330px] sm:w-[330px]"
          >
            {/* Extracted Box Ring Overlay */}
            <img
              src="/hs-assets/ui/hs_thebox_glowring.webp"
              alt=""
              className="pointer-events-none absolute -inset-5 h-[calc(100%+40px)] w-[calc(100%+40px)] object-contain opacity-65"
            />

            {/* Top Blue Gem Accent */}
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border-2 border-sky-200 bg-radial from-sky-300 via-blue-500 to-indigo-950 text-lg shadow-[0_0_18px_#38bdf8]">
              🌀
            </div>

            <div className="flex w-full max-w-[225px] flex-col gap-2.5">
              <button
                type="button"
                onMouseEnter={() => hsAudio.playSfx('box_hover', 0.55)}
                onClick={() => triggerModeTransition('RANKED')}
                className="hs-outline-sm rounded-2xl border-[3px] border-[#f6dc99] bg-gradient-to-b from-[#d97706] via-[#b45309] to-[#78350f] py-3 text-lg font-extrabold tracking-wider text-white shadow-[0_6px_14px_rgba(0,0,0,0.65)] transition hover:scale-105 hover:brightness-110"
              >
                ⚔ 대전 (등급전)
              </button>

              <button
                type="button"
                onMouseEnter={() => hsAudio.playSfx('box_hover', 0.55)}
                onClick={() => triggerModeTransition('PRACTICE_NORMAL')}
                className="hs-outline-sm rounded-2xl border-[3px] border-[#e5c683] bg-gradient-to-b from-[#2563eb] via-[#1d4ed8] to-[#1e3a8a] py-2.5 text-base font-extrabold tracking-wider text-white shadow-[0_6px_14px_rgba(0,0,0,0.65)] transition hover:scale-105 hover:brightness-110"
              >
                🍺 연습 (여관주인)
              </button>

              <button
                type="button"
                onMouseEnter={() => hsAudio.playSfx('box_hover', 0.55)}
                onClick={() => triggerModeTransition('TUTORIAL')}
                className="hs-outline-sm rounded-2xl border-[2.5px] border-[#d6b87c] bg-gradient-to-b from-[#15803d] via-[#166534] to-[#14532d] py-2 text-sm font-extrabold tracking-wider text-white shadow-[0_5px_12px_rgba(0,0,0,0.6)] transition hover:scale-105 hover:brightness-110"
              >
                📖 입문 튜토리얼
              </button>
            </div>
          </div>

          {/* Bottom Drawer Tray: Open Packs · Shop · My Collection */}
          <div className="mt-3 grid w-full max-w-2xl grid-cols-3 gap-3 rounded-2xl border-[3px] border-[#9d773e] bg-gradient-to-b from-[#29180c] to-[#170d06] p-3 shadow-inner">
            <button
              type="button"
              onMouseEnter={() => hsAudio.playSfx('box_hover', 0.5)}
              onClick={() => {
                hsAudio.playSfx('box_press');
                onOpenPacks();
              }}
              className="relative flex flex-col items-center justify-center rounded-xl border-2 border-[#d4af63] bg-gradient-to-b from-[#5d3d20] to-[#321f10] px-3 py-2.5 text-amber-100 shadow-lg transition hover:scale-[1.03] hover:brightness-110"
            >
              {profile.packs > 0 && (
                <span className="hs-num absolute -right-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-red-200 bg-red-600 px-1.5 text-xs text-white shadow-lg">
                  {profile.packs}
                </span>
              )}
              <span className="text-xl">📦</span>
              <span className="mt-0.5 text-xs font-extrabold sm:text-sm">카드 팩 개봉</span>
            </button>

            <button
              type="button"
              onMouseEnter={() => hsAudio.playSfx('box_hover', 0.5)}
              onClick={() => {
                hsAudio.playSfx('box_press');
                onOpenCollection();
              }}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-[#d4af63] bg-gradient-to-b from-[#6e4623] to-[#3b2310] px-3 py-2.5 text-amber-100 shadow-lg transition hover:scale-[1.03] hover:brightness-110"
            >
              <span className="text-xl">📕</span>
              <span className="mt-0.5 text-xs font-extrabold sm:text-sm">내 카드첩 · 덱 편집</span>
            </button>

            <button
              type="button"
              onMouseEnter={() => hsAudio.playSfx('box_hover', 0.5)}
              onClick={() => {
                hsAudio.playSfx('box_press');
                onOpenShop();
              }}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-[#d4af63] bg-gradient-to-b from-[#5d3d20] to-[#321f10] px-3 py-2.5 text-amber-100 shadow-lg transition hover:scale-[1.03] hover:brightness-110"
            >
              <span className="text-xl">🪙</span>
              <span className="mt-0.5 text-xs font-extrabold sm:text-sm">상점 · 전체해금</span>
            </button>
          </div>
        </div>
      </main>

      {/* Subtle Footer Info */}
      <footer className="relative z-20 text-center text-[11px] text-amber-200/70">
        오리지널 9직업 · 기본/클래식 수집 카드 382종 완비 · 모든 데이터 브라우저 자동 저장 (`LocalStorage`)
      </footer>
    </div>
  );
};
