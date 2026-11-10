import React, { useEffect, useState } from 'react';
import { hsAudio } from '../audio';
import { HearthstoneCard } from '../components/CardVisual';
import { OpenedPackCard, hsStorage } from '../storage';
import { CardRarity } from '../types';

const HOVER_RARITY_SHADOW: Record<CardRarity, string> = {
  FREE: '0 0 18px rgba(255,255,255,0.45)',
  COMMON: '0 0 22px 4px rgba(226,232,240,0.65)',
  RARE: '0 0 28px 8px rgba(59,130,246,0.95)',
  EPIC: '0 0 32px 10px rgba(168,85,247,0.98)',
  LEGENDARY: '0 0 38px 14px rgba(249,115,22,1)',
};

const CARD_BACK_MAP: Record<string, string> = {
  classic: '/hs-assets/ui/cardback_classic.webp',
  legend: '/hs-assets/ui/cardback_legend.webp',
  frost: '/hs-assets/ui/cardback_frost.webp',
  gold: '/hs-assets/ui/cardback_gold.webp',
};

export const PackOpeningScreen: React.FC<{
  onBack: () => void;
  onProfileChanged: () => void;
}> = ({ onBack, onProfileChanged }) => {
  const [profile, setProfile] = useState(() => hsStorage.getProfile());
  const [packBursting, setPackBursting] = useState(false);
  const [openedCards, setOpenedCards] = useState<OpenedPackCard[] | null>(null);
  const [revealed, setRevealed] = useState<boolean[]>([false, false, false, false, false]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [draggingPack, setDraggingPack] = useState(false);

  const sync = () => {
    setProfile(hsStorage.getProfile());
    onProfileChanged();
  };

  const triggerOpenPack = () => {
    if (packBursting || openedCards) return;
    if (profile.packs <= 0) return;

    hsAudio.playSfx('pack_open');
    setPackBursting(true);
    window.setTimeout(() => {
      const res = hsStorage.openOnePack();
      setPackBursting(false);
      if (res) {
        setOpenedCards(res);
        setRevealed([false, false, false, false, false]);
        sync();
      }
    }, 520);
  };

  // Spacebar shortcut just like Blizzard's Hearthstone client!
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (!openedCards && profile.packs > 0) {
        triggerOpenPack();
      } else if (openedCards && revealed.every(Boolean)) {
        setOpenedCards(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const revealCardAt = (idx: number) => {
    if (!openedCards || revealed[idx]) return;
    const item = openedCards[idx];
    const next = [...revealed];
    next[idx] = true;
    setRevealed(next);

    hsAudio.playSfx('card_flip', 0.9);
    if (item.card.rarity === 'LEGENDARY') {
      hsAudio.playSfx('pack_legendary');
      hsAudio.playInnkeeper(item.isGolden ? 'golden_legendary' : 'legendary');
    } else if (item.card.rarity === 'EPIC') {
      hsAudio.playSfx('pack_epic');
      hsAudio.playInnkeeper('epic');
    } else if (item.card.rarity === 'RARE') {
      hsAudio.playSfx('pack_rare');
      hsAudio.playInnkeeper('rare');
    }
  };

  const revealAll = () => {
    if (!openedCards) return;
    openedCards.forEach((_, idx) => {
      if (!revealed[idx]) {
        window.setTimeout(() => revealCardAt(idx), idx * 140);
      }
    });
  };

  const allRevealed = Boolean(openedCards && revealed.every(Boolean));
  const backImg = CARD_BACK_MAP[profile.selectedCardBack] || CARD_BACK_MAP.classic;

  return (
    <div
      style={{ backgroundImage: 'url(/hs-assets/ui/pack_altar_bg.webp)' }}
      className="relative flex h-[100dvh] w-full select-none flex-col justify-between overflow-hidden bg-cover bg-center p-4 text-amber-100"
    >
      <div className="pointer-events-none absolute inset-0 bg-radial from-sky-500/10 via-black/45 to-black/85" />

      {/* Top Bar */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between">
        <button
          type="button"
          onClick={() => {
            hsAudio.playSfx('box_close');
            onBack();
          }}
          className="rounded-2xl border-2 border-[#d4af63] bg-gradient-to-b from-[#49301b] to-[#24160b] px-4 py-2 text-sm font-extrabold text-amber-100 shadow-lg hover:brightness-110"
        >
          ← 여관 상자로 돌아가기
        </button>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border-2 border-amber-400/60 bg-stone-950/85 px-4 py-1.5 text-xs font-extrabold">
            🪙 보유 골드: <span className="hs-num text-sm text-yellow-300">{profile.gold}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (hsStorage.buyPacksWithGold(1)) {
                hsAudio.playSfx('purchase');
                sync();
              }
            }}
            className="rounded-2xl border-2 border-yellow-300 bg-gradient-to-b from-amber-500 to-amber-800 px-3.5 py-1.5 text-xs font-extrabold text-white shadow hover:brightness-110"
          >
            + 1팩 즉시 구매 (100G)
          </button>
        </div>
      </header>

      {/* Main Split: Left Pack Stack + Right Glowing Altar */}
      <main className="relative z-20 mx-auto my-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 md:grid-cols-12">
        {/* Left: Unopened Pack Tray */}
        <aside className="flex flex-col items-center justify-center rounded-3xl border-[4px] border-[#b78f49] bg-gradient-to-b from-[#342112]/90 to-[#1a1008]/95 p-5 shadow-2xl md:col-span-3">
          <div className="mb-2 text-sm font-extrabold text-amber-200">
            미개봉 오리지널 팩
          </div>
          <div className="hs-num mb-3 rounded-full border-2 border-amber-300 bg-amber-950 px-4 py-1 text-xl text-yellow-300">
            {profile.packs}개
          </div>

          {profile.packs > 0 ? (
            <div
              draggable={!openedCards}
              onDragStart={() => setDraggingPack(true)}
              onDragEnd={() => setDraggingPack(false)}
              onClick={triggerOpenPack}
              className={`cursor-grab transition duration-200 hover:scale-105 active:cursor-grabbing ${
                openedCards ? 'pointer-events-none opacity-45' : ''
              }`}
            >
              <img
                src="/hs-assets/ui/classic_pack.webp"
                alt="오리지널 카드 팩"
                className="h-44 w-32 object-contain drop-shadow-[0_14px_24px_rgba(0,0,0,0.9)]"
              />
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-amber-200/70">
              보유한 팩이 없습니다.
              <br />
              상단 버튼으로 100골드에 구매하세요!
            </div>
          )}

          <p className="mt-3 text-center text-[11px] text-amber-200/80">
            팩을 제단으로 드래그하거나
            <br />
            <b>클릭 / 스페이스바</b>로 개봉!
          </p>
        </aside>

        {/* Right: Glowing Rune Altar OR 5-Card Pentagon Reveal */}
        <section
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDraggingPack(false);
            triggerOpenPack();
          }}
          className="relative flex min-h-[470px] flex-col items-center justify-center rounded-[36px] border-[4px] border-[#c8a35c]/70 bg-radial from-sky-500/20 via-stone-950/65 to-stone-950/90 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.9)] md:col-span-9"
        >
          {!openedCards ? (
            <div
              onClick={triggerOpenPack}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-full border-[4px] p-10 transition-all ${
                packBursting
                  ? 'scale-125 border-yellow-200 bg-yellow-300/40 shadow-[0_0_90px_30px_rgba(250,204,21,0.95)]'
                  : draggingPack
                    ? 'scale-110 border-sky-300 bg-sky-500/25 shadow-[0_0_60px_rgba(56,189,248,0.85)]'
                    : 'border-sky-400/50 bg-sky-950/35 shadow-[0_0_45px_rgba(56,189,248,0.45)] hover:scale-105'
              }`}
            >
              <img
                src="/hs-assets/ui/classic_pack.webp"
                alt="제단"
                className={`h-44 w-32 object-contain transition ${
                  profile.packs > 0 ? 'opacity-95' : 'opacity-25 grayscale'
                } ${packBursting ? 'animate-bounce' : ''}`}
              />
              <span className="hs-title mt-3 text-lg font-extrabold text-sky-200">
                {packBursting
                  ? '✨ 봉인 해제 중!! ✨'
                  : profile.packs > 0
                    ? '클릭하여 오리지널 팩 개봉!'
                    : '개봉할 카드 팩이 없습니다'}
              </span>
            </div>
          ) : (
            /* 5-Card Pentagon Reveal Spread */
            <div className="flex w-full flex-col items-center">
              <div className="mb-3 flex items-center gap-3">
                {!allRevealed ? (
                  <button
                    type="button"
                    onClick={revealAll}
                    className="rounded-xl border border-sky-300 bg-sky-800/85 px-4 py-1.5 text-xs font-extrabold text-white shadow hover:bg-sky-700"
                  >
                    ✨ 5장 한 번에 뒤집기
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      hsAudio.playSfx('menu_select');
                      setOpenedCards(null);
                    }}
                    className="animate-pulse rounded-2xl border-2 border-yellow-200 bg-gradient-to-b from-amber-400 via-amber-600 to-amber-800 px-8 py-2 text-base font-black text-stone-950 shadow-[0_0_24px_rgba(250,204,21,0.85)] hover:scale-105"
                  >
                    확인 완료 (스페이스바) ✔
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                {openedCards.map((item, idx) => {
                  const isUp = revealed[idx];
                  const isHovered = hoveredIdx === idx;
                  return (
                    <div
                      key={`${item.card.id}_${idx}`}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onClick={() => revealCardAt(idx)}
                      className="relative flex flex-col items-center"
                    >
                      {!isUp ? (
                        <div
                          style={{
                            boxShadow: isHovered
                              ? HOVER_RARITY_SHADOW[item.card.rarity]
                              : '0 12px 26px rgba(0,0,0,0.85)',
                          }}
                          className="h-[232px] w-[164px] cursor-pointer overflow-hidden rounded-[14px] border-2 border-amber-300/70 transition-all duration-200 hover:-translate-y-2 hover:scale-105"
                        >
                          <img
                            src={backImg}
                            alt="카드 뒷면"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="relative animate-[hsCardPop_0.32s_ease-out]">
                          <HearthstoneCard
                            card={item.card}
                            isGolden={item.isGolden}
                            enableTilt
                            size="MD"
                          />
                          {item.isNew && (
                            <span className="absolute -right-2 -top-2 z-40 rounded-full border border-yellow-100 bg-gradient-to-r from-amber-400 to-orange-600 px-2 py-0.5 text-[10px] font-black text-stone-950 shadow-lg">
                              신규!
                            </span>
                          )}
                          {item.isGolden && (
                            <span className="absolute -bottom-2 left-1/2 z-40 -translate-x-1/2 rounded-full border border-yellow-200 bg-yellow-400 px-2 py-0.5 text-[9.5px] font-black text-stone-950 shadow">
                              ★ 황금 카드
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="relative z-20 text-center text-[11px] text-amber-200/70">
        마우스를 뒷면 카드 위에 올리면 등급별 광채(파랑: 희귀 / 보라: 영웅 / 주황: 전설)를 미리 느낄 수 있습니다!
      </footer>
    </div>
  );
};
