import React, { useEffect, useState } from 'react';
import { hsAudio } from '../audio';
import { HearthstoneCard, HsGoldCoinIcon } from '../components/CardVisual';
import { OpenedPackCard, hsStorage } from '../storage';
import { CardRarity } from '../types';

const HOVER_RARITY_FILTER: Record<CardRarity, string> = {
  FREE: 'drop-shadow(0 0 12px rgba(255,255,255,0.5))',
  COMMON: 'drop-shadow(0 0 14px rgba(226,232,240,0.75))',
  RARE: 'drop-shadow(0 0 18px rgba(59,130,246,0.98)) drop-shadow(0 0 32px rgba(37,99,235,0.85))',
  EPIC: 'drop-shadow(0 0 20px rgba(168,85,247,1)) drop-shadow(0 0 36px rgba(147,51,234,0.9))',
  LEGENDARY:
    'drop-shadow(0 0 22px rgba(251,191,36,1)) drop-shadow(0 0 42px rgba(245,158,11,0.95))',
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
      <div className="pointer-events-none absolute inset-0 bg-radial from-sky-500/12 via-black/48 to-black/88" />

      {/* Top Brass Header */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between">
        <button
          type="button"
          onClick={() => {
            hsAudio.playSfx('box_close');
            onBack();
          }}
          className="hs-brass-btn rounded-xl px-4 py-2 text-xs font-extrabold text-amber-100 sm:text-sm"
        >
          ← 여관 상자로 돌아가기
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border-2 border-[#c8a158] bg-stone-950/90 px-3.5 py-1.5 text-xs font-extrabold shadow-lg">
            <HsGoldCoinIcon size={20} />
            <span>보유 골드</span>
            <span className="hs-num text-sm text-yellow-300">{profile.gold}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (hsStorage.buyPacksWithGold(1)) {
                hsAudio.playSfx('purchase');
                sync();
              }
            }}
            className="hs-arcane-btn flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-extrabold text-white"
          >
            <HsGoldCoinIcon size={16} />
            <span>+ 1팩 즉시 구매 (100)</span>
          </button>
        </div>
      </header>

      {/* Main Split: Left Pack Stack + Right Arcane Rune Altar */}
      <main className="relative z-20 mx-auto my-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 md:grid-cols-12">
        {/* Left: Unopened Pack Tray */}
        <aside className="hs-wood-panel flex flex-col items-center justify-center rounded-3xl p-5 md:col-span-3">
          <div className="hs-title mb-2 text-sm font-extrabold text-amber-100">
            미개봉 오리지널 팩
          </div>
          <div className="hs-num mb-3 rounded-full border-2 border-[#e0bc72] bg-stone-950/85 px-4 py-1 text-xl text-yellow-300 shadow-inner">
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
                className="h-44 w-32 object-contain drop-shadow-[0_16px_26px_rgba(0,0,0,0.92)]"
              />
            </div>
          ) : (
            <div className="py-10 text-center text-xs font-semibold text-amber-200/70">
              보유한 카드 팩이 없습니다.
              <br />
              상단 버튼으로 100골드에 구매하세요.
            </div>
          )}

          <p className="mt-3 text-center text-[11px] font-semibold text-amber-200/80">
            팩을 제단으로 드래그하거나
            <br />
            <b className="text-amber-100">클릭 / 스페이스바</b>로 개봉
          </p>
        </aside>

        {/* Right: Glowing Rune Altar OR 5-Card Reveal Spread */}
        <section
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDraggingPack(false);
            triggerOpenPack();
          }}
          className="relative flex min-h-[480px] flex-col items-center justify-center overflow-hidden rounded-[36px] border-[4px] border-[#cfa85d]/75 bg-radial from-sky-500/20 via-stone-950/70 to-stone-950/92 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.92)] md:col-span-9"
        >
          {/* Ambient Rotating Godrays on Altar */}
          <img
            src="/hs-assets/ui/hs_godrays1.webp"
            alt=""
            className="pointer-events-none absolute h-[420px] w-[420px] animate-[hsSlowSpin_36s_linear_infinite] object-contain opacity-30 mix-blend-screen"
          />

          {!openedCards ? (
            <div
              onClick={triggerOpenPack}
              className={`relative z-10 flex cursor-pointer flex-col items-center justify-center rounded-full border-[4px] p-10 transition-all ${
                packBursting
                  ? 'scale-125 border-yellow-200 bg-yellow-300/40 shadow-[0_0_90px_30px_rgba(250,204,21,0.95)]'
                  : draggingPack
                    ? 'scale-110 border-sky-300 bg-sky-500/25 shadow-[0_0_60px_rgba(56,189,248,0.85)]'
                    : 'border-sky-400/50 bg-sky-950/40 shadow-[0_0_45px_rgba(56,189,248,0.45)] hover:scale-105'
              }`}
            >
              <img
                src="/hs-assets/ui/classic_pack.webp"
                alt="제단"
                className={`h-44 w-32 object-contain transition ${
                  profile.packs > 0 ? 'opacity-95' : 'opacity-25 grayscale'
                } ${packBursting ? 'scale-110 brightness-125' : ''}`}
              />
              <span className="hs-title hs-outline-sm mt-3 text-lg font-extrabold text-sky-200">
                {packBursting
                  ? '비전 봉인 해제 중...'
                  : profile.packs > 0
                    ? '클릭하여 오리지널 팩 개봉'
                    : '개봉할 카드 팩이 없습니다'}
              </span>
            </div>
          ) : (
            /* 5-Card Reveal Spread with Alpha-Contour Rarity Auras */
            <div className="relative z-10 flex w-full flex-col items-center">
              <div className="mb-3 flex items-center gap-3">
                {!allRevealed ? (
                  <button
                    type="button"
                    onClick={revealAll}
                    className="hs-arcane-btn rounded-xl px-5 py-1.5 text-xs font-extrabold text-white"
                  >
                    5장 한 번에 뒤집기
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      hsAudio.playSfx('menu_select');
                      setOpenedCards(null);
                    }}
                    className="hs-brass-btn rounded-2xl border-yellow-200 bg-gradient-to-b from-amber-400 via-amber-600 to-amber-800 px-8 py-2 text-base font-black text-stone-950 shadow-[0_0_24px_rgba(250,204,21,0.85)]"
                  >
                    확인 완료 (스페이스바)
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                {openedCards.map((item, idx) => {
                  const isUp = revealed[idx];
                  const isHovered = hoveredIdx === idx;
                  const isHighTier =
                    item.card.rarity === 'LEGENDARY' || item.card.rarity === 'EPIC';
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
                            filter: isHovered
                              ? HOVER_RARITY_FILTER[item.card.rarity]
                              : 'drop-shadow(0 12px 20px rgba(0,0,0,0.85))',
                          }}
                          className="h-[248px] w-[166px] cursor-pointer overflow-hidden rounded-[16px] border-2 border-[#dfc07b]/80 transition-all duration-200 hover:-translate-y-2 hover:scale-105"
                        >
                          <img
                            src={backImg}
                            alt="카드 뒷면"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="relative animate-[hsCardPop_0.32s_ease-out]">
                          {isHighTier && (
                            <img
                              src="/hs-assets/ui/hs_godrays1.webp"
                              alt=""
                              className="pointer-events-none absolute -inset-6 z-0 h-[calc(100%+48px)] w-[calc(100%+48px)] animate-[hsSlowSpin_18s_linear_infinite] object-contain opacity-65 mix-blend-screen"
                            />
                          )}
                          <div className="relative z-10">
                            <HearthstoneCard
                              card={item.card}
                              isGolden={item.isGolden}
                              rarityAura={item.card.rarity}
                              enableTilt
                              size="MD"
                            />
                          </div>
                          {item.isNew && (
                            <span className="hs-outline-sm absolute right-1 top-2 z-40 rounded-md border border-yellow-200 bg-gradient-to-b from-amber-400 to-amber-700 px-2 py-0.5 text-[10px] font-black text-white shadow-lg">
                              신규!
                            </span>
                          )}
                          {item.isGolden && (
                            <span className="hs-outline-sm absolute -bottom-1 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md border border-yellow-200 bg-gradient-to-b from-yellow-400 to-amber-700 px-2 py-0.5 text-[9.5px] font-black text-white shadow">
                              황금 카드
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

      <footer className="relative z-20 text-center text-[11px] font-semibold text-amber-200/75">
        뒷면 카드에 마우스를 올리면 등급별 마력 광채(희귀: 사파이어 / 특급: 자수정 / 전설: 태양빛)가 깨어납니다
      </footer>
    </div>
  );
};
