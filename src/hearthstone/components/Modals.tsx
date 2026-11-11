import React, { useEffect, useState } from 'react';
import { AudioSettings, hsAudio } from '../audio';
import {
  CLASSIC_RANK_NAMES,
  CLASS_CREST_URL,
  getStarsNeededForRank,
} from '../cardDb';
import { hsStorage } from '../storage';
import {
  CLASSIC_HEROES,
  HERO_CLASS_ORDER,
  PlayerProfile,
} from '../types';
import { HsArcaneDustVialIcon, HsGoldCoinIcon } from './CardVisual';
import {
  SNS_CARD_BACK_THEMES,
  SnsBoosterPackArt,
  SnsCardBackArt,
  SnsQuestScrollIcon,
  SnsRankMedallion,
} from './SnsHeroArtKit';

const CARD_BACK_IDS: PlayerProfile['selectedCardBack'][] = ['classic', 'legend', 'frost', 'gold'];

export const QuestLogModal: React.FC<{
  onClose: () => void;
  onProfileChanged: () => void;
}> = ({ onClose }) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const sync = () => setTick((n) => n + 1);
    window.addEventListener('snshero:state-changed', sync);
    return () => window.removeEventListener('snshero:state-changed', sync);
  }, []);

  const profile = hsStorage.getProfile();
  const quests = hsStorage.getQuests();
  const rankTitle = CLASSIC_RANK_NAMES[profile.rank] || '엘윈 마을 수습생';
  const starsNeeded = getStarsNeededForRank(profile.rank);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/78 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hs-wood-panel relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-5 text-amber-100 sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between border-b border-amber-600/35 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#d4af63] bg-stone-950/80 shadow">
              <SnsQuestScrollIcon size={34} />
            </div>
            <div>
              <h2 className="hs-title text-xl font-extrabold text-amber-100 sm:text-2xl">
                일곱 추적자 의뢰 일지
              </h2>
              <p className="text-xs font-semibold text-amber-300/85">
                성흔 등급전 전적 · 취선루 일일 의뢰 · 9대 종족 승리 기록
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('box_close');
              onClose();
            }}
            className="hs-brass-btn rounded-xl px-3.5 py-1.5 text-sm font-extrabold text-amber-100"
          >
            닫기 ✕
          </button>
        </div>

        {/* Top Row: Rank Medallion + Sculpted Currencies */}
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border-2 border-[#c8a158]/50 bg-black/40 p-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
              <SnsRankMedallion rank={profile.rank} size={74} />
            </div>
            <div>
              <div className="hs-title text-lg font-extrabold text-amber-100">
                {profile.rank === 0 ? rankTitle : `${profile.rank}등급 · ${rankTitle}`}
              </div>
              {profile.rank > 0 ? (
                <div className="mt-1 flex items-center gap-1 text-base">
                  {Array.from({ length: starsNeeded }).map((_, idx) => (
                    <span
                      key={idx}
                      className={idx < profile.stars ? 'text-yellow-300' : 'text-stone-600'}
                    >
                      ★
                    </span>
                  ))}
                  <span className="ml-2 text-xs font-bold text-amber-300/80">
                    ({profile.stars} / {starsNeeded})
                  </span>
                </div>
              ) : (
                <div className="mt-1 text-xs font-bold text-yellow-300">
                  최고 명예 전설의 눈히어로 달성!
                </div>
              )}
              <div className="mt-1.5 text-xs font-semibold text-amber-200/75">
                통산 {profile.totalWins}승 / {profile.totalGames}전 · 현재 {profile.winStreak}연승
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border-2 border-[#c8a158]/50 bg-black/40 p-4 text-center">
            <div className="flex flex-col items-center justify-center rounded-xl border border-amber-500/25 bg-stone-950/75 p-2">
              <HsGoldCoinIcon size={26} />
              <span className="hs-num mt-1 text-lg text-yellow-300">{profile.gold}</span>
              <span className="text-[11px] font-bold text-amber-200/80">보유 골드</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-sky-400/25 bg-stone-950/75 p-2">
              <HsArcaneDustVialIcon size={26} />
              <span className="hs-num mt-1 text-lg text-sky-300">{profile.arcaneDust}</span>
              <span className="text-[11px] font-bold text-sky-200/80">성흔 가루</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-amber-400/25 bg-stone-950/75 p-2">
              <div className="h-8 w-6">
                <SnsBoosterPackArt />
              </div>
              <span className="hs-num mt-1 text-lg text-amber-200">{profile.packs}</span>
              <span className="text-[11px] font-bold text-amber-200/80">미개봉 팩</span>
            </div>
          </div>
        </div>

        {/* Daily Quests on Parchment Cards */}
        <h3 className="hs-title mb-2 text-sm font-extrabold tracking-wide text-amber-200">
          오늘의 취선루 의뢰
        </h3>
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {quests.map((q) => {
            const pct = Math.min(100, Math.round((q.progress / q.goal) * 100));
            return (
              <div
                key={q.id}
                className={`rounded-2xl border-2 p-3.5 shadow ${
                  q.completed
                    ? 'border-emerald-400/70 bg-emerald-950/55 text-emerald-100'
                    : 'border-[#a88246] bg-[#f3e5c3] text-stone-900'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="hs-title text-sm font-extrabold">{q.title}</span>
                  <span className="flex items-center gap-1 rounded-full border border-amber-900/40 bg-amber-400/90 px-2 py-0.5 text-xs font-black text-stone-950">
                    <HsGoldCoinIcon size={14} />
                    <span>{q.rewardGold}</span>
                  </span>
                </div>
                <p
                  className={`mt-1.5 text-xs font-semibold ${
                    q.completed ? 'text-emerald-200' : 'text-stone-700'
                  }`}
                >
                  {q.description}
                </p>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-stone-800/35">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500"
                  />
                </div>
                <div className="mt-1 text-right text-[11px] font-extrabold">
                  {q.completed ? '완료됨' : `${q.progress} / ${q.goal}`}
                </div>
              </div>
            );
          })}
        </div>

        {/* 9 SNSHero Faction Heroes Win Counts */}
        <h3 className="hs-title mb-2 text-sm font-extrabold tracking-wide text-amber-200">
          9대 종족 대표 영웅 승리 기록
        </h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-9">
          {HERO_CLASS_ORDER.map((hc) => {
            const h = CLASSIC_HEROES[hc];
            return (
              <div
                key={hc}
                className="flex flex-col items-center rounded-xl border border-[#c8a158]/35 bg-black/40 px-1.5 py-2.5"
              >
                <img
                  src={CLASS_CREST_URL[hc]}
                  alt={h.classNameKo}
                  className="mb-1 h-8 w-8 rounded-full border border-amber-200/70 object-cover shadow"
                />
                <span
                  style={{ color: h.accentColor }}
                  className="text-[10px] font-extrabold whitespace-nowrap"
                >
                  {h.classNameKo}
                </span>
                <span className="hs-num mt-0.5 text-sm text-white">
                  {profile.classWins[hc] || 0}승
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const TavernShopModal: React.FC<{
  onClose: () => void;
  onProfileChanged: () => void;
  onGoOpenPacks: () => void;
}> = ({ onClose, onProfileChanged, onGoOpenPacks }) => {
  const [profile, setProfile] = useState<PlayerProfile>(() => hsStorage.getProfile());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setProfile(hsStorage.getProfile());
    window.addEventListener('snshero:state-changed', sync);
    return () => window.removeEventListener('snshero:state-changed', sync);
  }, []);

  const refresh = () => {
    setProfile(hsStorage.getProfile());
    onProfileChanged();
  };

  const handleBuy = (count: number) => {
    if (hsStorage.buyPacksWithGold(count)) {
      hsAudio.playSfx('purchase');
      setToast(`눈히어로 성흔 카드 팩 ${count}개를 구매했습니다!`);
      refresh();
    } else {
      hsAudio.playInnkeeper('collection');
      setToast(`골드가 부족합니다. (필요: ${count * 100} 골드)`);
    }
  };

  const handleSelectBack = (id: PlayerProfile['selectedCardBack']) => {
    const p = hsStorage.getProfile();
    p.selectedCardBack = id;
    hsStorage.saveProfile(p);
    hsAudio.playSfx('ui_click');
    setToast(`카드 뒷면이 '${SNS_CARD_BACK_THEMES[id].name}'(으)로 변경되었습니다.`);
    refresh();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/78 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hs-wood-panel relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-5 text-amber-100 sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between border-b border-amber-600/35 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#dfc07b] bg-stone-950/80">
              <HsGoldCoinIcon size={28} />
            </div>
            <div>
              <h2 className="hs-title text-xl font-extrabold text-amber-100 sm:text-2xl">
                취선루 성흔 보급소
              </h2>
              <p className="text-xs font-semibold text-amber-300/85">
                보유 골드 <b className="text-yellow-300">{profile.gold}</b> · 미개봉 팩{' '}
                <b className="text-amber-100">{profile.packs}개</b> · 성흔 가루{' '}
                <b className="text-sky-300">{profile.arcaneDust}</b>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('box_close');
              onClose();
            }}
            className="hs-brass-btn rounded-xl px-3.5 py-1.5 text-sm font-extrabold text-amber-100"
          >
            닫기 ✕
          </button>
        </div>

        {toast && (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-950/90 px-4 py-2 text-center text-xs font-extrabold text-yellow-200">
            {toast}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Pack Purchase Box */}
          <div className="flex flex-col items-center justify-between rounded-2xl border-2 border-[#c8a158]/50 bg-black/40 p-4">
            <div className="h-40 w-28">
              <SnsBoosterPackArt glowing />
            </div>
            <div className="mt-3 text-center">
              <div className="hs-title text-base font-extrabold text-amber-100">
                눈히어로 성흔 영웅 카드 팩
              </div>
              <div className="mt-0.5 text-xs font-semibold text-amber-200/75">
                11종족 110영웅 카드 5장 포함 · 최소 1장 희귀(Rare) 등급 이상 확정
              </div>
            </div>
            <div className="mt-4 flex w-full gap-2">
              <button
                type="button"
                onClick={() => handleBuy(1)}
                className="hs-brass-btn flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold text-amber-100 sm:text-sm"
              >
                <HsGoldCoinIcon size={17} />
                <span>1팩 구매 (100)</span>
              </button>
              <button
                type="button"
                onClick={() => handleBuy(5)}
                className="hs-arcane-btn flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold text-white sm:text-sm"
              >
                <HsGoldCoinIcon size={17} />
                <span>5팩 구매 (500)</span>
              </button>
            </div>
            {profile.packs > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoOpenPacks();
                }}
                className="hs-brass-btn mt-2 w-full rounded-xl py-2 text-xs font-extrabold text-sky-200"
              >
                하늘 제단에서 팩 개봉하기 ({profile.packs}개 보유) →
              </button>
            )}
          </div>

          {/* Card Back Selector */}
          <div className="flex flex-col justify-between rounded-2xl border-2 border-[#c8a158]/50 bg-black/40 p-4">
            <div>
              <h3 className="hs-title mb-2.5 text-sm font-extrabold text-amber-100">
                눈히어로 성흔 카드 뒷면 선택
              </h3>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {CARD_BACK_IDS.map((cbId) => {
                  const active = profile.selectedCardBack === cbId;
                  const meta = SNS_CARD_BACK_THEMES[cbId];
                  return (
                    <button
                      key={cbId}
                      type="button"
                      onClick={() => handleSelectBack(cbId)}
                      className={`flex flex-col items-center rounded-xl border-2 p-2 transition ${
                        active
                          ? 'border-yellow-300 bg-amber-900/60 shadow-[0_0_14px_rgba(250,204,21,0.65)]'
                          : 'border-stone-700 bg-stone-900/60 hover:border-amber-500'
                      }`}
                    >
                      <div className="h-22 w-16">
                        <SnsCardBackArt variant={cbId} />
                      </div>
                      <span className="mt-1.5 text-center text-[10.5px] font-extrabold text-amber-100 leading-tight">
                        {meta.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[#c8a158]/35 bg-stone-950/75 p-3.5 text-xs leading-relaxed text-amber-200/85">
              <div className="font-extrabold text-amber-100">
                『카단의 여정』 성흔 도감 안내
              </div>
              <p className="mt-1 text-[11px] font-semibold text-amber-200/75">
                대전 및 수련 승리 보상으로 골드를 모아 성흔 영웅 팩을 개봉하거나, 별빛 기록실(내 카드첩)에서 성흔 가루로 원하는 종족 영웅 카드를 제작할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GameOptionsModal: React.FC<{
  inBattle?: boolean;
  onConcede?: () => void;
  onClose: () => void;
}> = ({ inBattle = false, onConcede, onClose }) => {
  const [settings, setSettings] = useState<AudioSettings>(() => hsAudio.getSettings());

  const update = (patch: Partial<AudioSettings>) => {
    hsAudio.updateSettings(patch);
    setSettings(hsAudio.getSettings());
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/78 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hs-wood-panel w-full max-w-md rounded-3xl p-6 text-amber-100"
      >
        <h2 className="hs-title mb-4 text-center text-2xl font-extrabold text-amber-100">
          환경 설정
        </h2>

        {inBattle && onConcede && (
          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('menu_press');
              onClose();
              onConcede();
            }}
            className="mb-4 w-full rounded-2xl border-2 border-red-300 bg-gradient-to-b from-red-600 to-red-950 py-3 text-base font-extrabold text-white shadow-lg hover:brightness-110"
          >
            대결 항복하기
          </button>
        )}

        <div className="space-y-3 rounded-2xl border border-[#c8a158]/40 bg-black/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold">사운드 출력</span>
            <button
              type="button"
              onClick={() => update({ muted: !settings.muted })}
              className={`rounded-lg border px-3 py-1 text-xs font-extrabold ${
                settings.muted
                  ? 'border-red-300/60 bg-red-800 text-white'
                  : 'border-emerald-300/60 bg-emerald-800 text-white'
              }`}
            >
              {settings.muted ? '음소거 켜짐' : '사운드 켜짐'}
            </button>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-amber-200">
              <span>취선루 · 전장 배경음악 (BGM)</span>
              <span>{Math.round(settings.bgmVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.bgmVolume * 100)}
              onChange={(e) => update({ bgmVolume: Number(e.target.value) / 100 })}
              className="mt-1 w-full accent-amber-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-amber-200">
              <span>타격 · 비전 효과음 (SFX)</span>
              <span>{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.sfxVolume * 100)}
              onChange={(e) => update({ sfxVolume: Number(e.target.value) / 100 })}
              className="mt-1 w-full accent-amber-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-amber-200">
              <span>영웅 교감 알림음</span>
              <span>{Math.round(settings.voVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.voVolume * 100)}
              onChange={(e) => update({ voVolume: Number(e.target.value) / 100 })}
              className="mt-1 w-full accent-amber-400"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('box_close');
              onClose();
            }}
            className="hs-brass-btn w-full rounded-xl py-2.5 text-sm font-extrabold text-amber-100"
          >
            게임으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};
