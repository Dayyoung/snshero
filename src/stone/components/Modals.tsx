import React, { useState } from 'react';
import { AudioSettings, hsAudio } from '../audio';
import {
  CLASSIC_RANK_NAMES,
  CLASS_CREST_URL,
  cardDb,
  getStarsNeededForRank,
} from '../cardDb';
import { HsArcaneDustVialIcon, HsGoldCoinIcon } from './CardVisual';
import { hsStorage } from '../storage';
import {
  CLASSIC_HEROES,
  HERO_CLASS_ORDER,
  PlayerProfile,
} from '../types';

const CARD_BACK_ITEMS: {
  id: PlayerProfile['selectedCardBack'];
  name: string;
  img: string;
}[] = [
  { id: 'classic', name: '오리지널 기본', img: '/stone-assets/ui/cardback_classic.webp' },
  { id: 'legend', name: '전설의 문장', img: '/stone-assets/ui/cardback_legend.webp' },
  { id: 'frost', name: '노스렌드 서리', img: '/stone-assets/ui/cardback_frost.webp' },
  { id: 'gold', name: '황금 여관', img: '/stone-assets/ui/cardback_gold.webp' },
];

export const QuestLogModal: React.FC<{
  onClose: () => void;
  onProfileChanged: () => void;
}> = ({ onClose }) => {
  const profile = hsStorage.getProfile();
  const quests = hsStorage.getQuests();
  const rankTitle = CLASSIC_RANK_NAMES[profile.rank] || '여관 손님';
  const starsNeeded = getStarsNeededForRank(profile.rank);
  const rankMedalImg =
    profile.rank === 0 ? '/stone-assets/ui/medal_legend.webp' : '/stone-assets/ui/medal_bronze.webp';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/78 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hs-wood-panel relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-6 text-amber-100"
      >
        <div className="mb-4 flex items-center justify-between border-b border-amber-600/35 pb-3">
          <div className="flex items-center gap-3">
            <img
              src="/stone-assets/ui/hs_questlog.webp"
              alt="퀘스트 일지"
              className="h-12 w-12 rounded-xl border-2 border-[#d4af63] object-cover shadow"
            />
            <div>
              <h2 className="hs-title text-2xl font-extrabold text-amber-100">
                모험가의 퀘스트 일지
              </h2>
              <p className="text-xs font-semibold text-amber-300/85">
                오리지널 등급전 전적 · 일일 퀘스트 · 9대 직업 승리 기록
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
              <img
                src={rankMedalImg}
                alt="등급 메달"
                className="h-full w-full object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.9)]"
              />
              {profile.rank > 0 && (
                <span className="hs-num absolute bottom-0 right-0 rounded-full border border-amber-200 bg-stone-950/95 px-2 py-0.5 text-xs text-amber-200">
                  {profile.rank}
                </span>
              )}
            </div>
            <div>
              <div className="hs-title text-lg font-extrabold text-amber-100">
                {profile.rank === 0 ? '전설 (LEGEND)' : `${profile.rank}등급 · ${rankTitle}`}
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
                  최고 등급 전설 달성!
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
              <span className="text-[11px] font-bold text-sky-200/80">신비한 가루</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-amber-400/25 bg-stone-950/75 p-2">
              <img
                src="/stone-assets/ui/classic_pack.webp"
                alt=""
                className="h-7 w-6 object-contain"
              />
              <span className="hs-num mt-1 text-lg text-amber-200">{profile.packs}</span>
              <span className="text-[11px] font-bold text-amber-200/80">미개봉 팩</span>
            </div>
          </div>
        </div>

        {/* Daily Quests on Parchment Cards */}
        <h3 className="hs-title mb-2 text-sm font-extrabold tracking-wide text-amber-200">
          오늘의 여관 퀘스트
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

        {/* 9 Classic Heroes Win Counts with Official Class Crests */}
        <h3 className="hs-title mb-2 text-sm font-extrabold tracking-wide text-amber-200">
          9대 오리지널 직업 승리 기록
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
                  className="text-[10.5px] font-extrabold"
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

  const refresh = () => {
    setProfile(hsStorage.getProfile());
    onProfileChanged();
  };

  const handleBuy = (count: number) => {
    if (hsStorage.buyPacksWithGold(count)) {
      hsAudio.playSfx('purchase');
      setToast(`오리지널 카드 팩 ${count}개를 구매했습니다!`);
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
    setToast('카드 뒷면이 변경되었습니다.');
    refresh();
  };

  const handleUnlockMaster = () => {
    hsStorage.unlockMasterCollection();
    hsAudio.playSfx('pack_legendary');
    hsAudio.playInnkeeper('legendary');
    setToast('전설을 포함한 오리지널 수집 카드 382종 전체와 보너스 재화가 해금되었습니다!');
    refresh();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/78 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hs-wood-panel relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-6 text-amber-100"
      >
        <div className="mb-4 flex items-center justify-between border-b border-amber-600/35 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#dfc07b] bg-stone-950/80">
              <HsGoldCoinIcon size={28} />
            </div>
            <div>
              <h2 className="hs-title text-2xl font-extrabold text-amber-100">
                스톤브루 여관 상점
              </h2>
              <p className="text-xs font-semibold text-amber-300/85">
                보유 골드 <b className="text-yellow-300">{profile.gold}</b> · 미개봉 팩{' '}
                <b className="text-amber-100">{profile.packs}개</b> · 신비한 가루{' '}
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
            <img
              src="/stone-assets/ui/classic_pack.webp"
              alt="오리지널 팩"
              className="h-36 w-28 object-contain drop-shadow-[0_12px_22px_rgba(0,0,0,0.9)]"
            />
            <div className="mt-2 text-center">
              <div className="hs-title text-base font-extrabold text-amber-100">
                오리지널 클래식 카드 팩
              </div>
              <div className="mt-0.5 text-xs font-semibold text-amber-200/75">
                공식 한국어 카드 5장 포함 · 최소 1장 희귀(Rare) 등급 이상 확정
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
                지금 팩 개봉 제단으로 이동 ({profile.packs}개 보유) →
              </button>
            )}
          </div>

          {/* Card Back Selector + Master Sandbox Unlock */}
          <div className="flex flex-col justify-between rounded-2xl border-2 border-[#c8a158]/50 bg-black/40 p-4">
            <div>
              <h3 className="hs-title mb-2 text-sm font-extrabold text-amber-100">
                공식 카드 뒷면 선택
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {CARD_BACK_ITEMS.map((cb) => {
                  const active = profile.selectedCardBack === cb.id;
                  return (
                    <button
                      key={cb.id}
                      type="button"
                      onClick={() => handleSelectBack(cb.id)}
                      className={`flex flex-col items-center rounded-xl border-2 p-1.5 transition ${
                        active
                          ? 'border-yellow-300 bg-amber-900/60 shadow-[0_0_14px_rgba(250,204,21,0.65)]'
                          : 'border-stone-700 bg-stone-900/60 hover:border-amber-500'
                      }`}
                    >
                      <img
                        src={cb.img}
                        alt={cb.name}
                        className="h-20 w-14 rounded object-cover"
                      />
                      <span className="mt-1 text-[10px] font-bold text-amber-100">
                        {cb.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-xl border-2 border-[#e2bf76]/75 bg-gradient-to-r from-[#2e1c0e] via-[#1f182e] to-[#2e1c0e] p-3.5">
              <div className="hs-title text-xs font-extrabold text-yellow-300">
                여관 마스터 샌드박스 모드
              </div>
              <p className="mt-1 text-[11px] font-semibold text-amber-100/85">
                오리지널 수집 가능 카드 382종(전설 1장 · 일반~특급 각 2장) 전체와 1,000골드, 1,600가루, 10팩을 즉시 해금합니다.
              </p>
              <button
                type="button"
                onClick={handleUnlockMaster}
                className="hs-arcane-btn mt-2.5 w-full rounded-xl py-2 text-xs font-extrabold text-white"
              >
                여관 마스터 전체 카드 1클릭 해금
              </button>
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
  onOpenReaModal?: () => void;
  onProfileChanged?: () => void;
  onClose: () => void;
}> = ({ inBattle = false, onConcede, onOpenReaModal, onProfileChanged, onClose }) => {
  const [settings, setSettings] = useState<AudioSettings>(() => hsAudio.getSettings());
  const [unlockedMsg, setUnlockedMsg] = useState(false);

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
          게임 메뉴
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
            항복하기
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
              <span>여관 · 전장 배경음악 (BGM)</span>
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
              <span>타격 · 주문 효과음 (SFX)</span>
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
              <span>한국어 성우 음성 (VO)</span>
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

        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={() => {
              hsStorage.unlockMasterCollection();
              hsAudio.playSfx('pack_legendary');
              setUnlockedMsg(true);
              onProfileChanged?.();
            }}
            className="hs-arcane-btn w-full rounded-xl py-2.5 text-xs font-extrabold text-white"
          >
            여관 마스터 전체 해금 (382종 카드 + 재화)
          </button>
          {unlockedMsg && (
            <div className="text-center text-xs font-bold text-emerald-300">
              382종 모든 오리지널 카드가 내 카드첩에 지급되었습니다!
            </div>
          )}

          {onOpenReaModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenReaModal();
              }}
              className="hs-brass-btn w-full rounded-xl py-2 text-xs font-extrabold text-sky-200"
            >
              REA 역설계 증거 및 원본 바이너리 검증 보기
            </button>
          )}

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

export const ReaEvidenceModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const manifest = cardDb.getManifest();
  const totalCollectible = cardDb.getAllCollectible().length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/82 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hs-wood-panel max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-6 text-amber-100"
      >
        <div className="mb-4 flex items-center justify-between border-b border-amber-600/35 pb-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/stone-assets/ui/box_compass_medallion.webp"
              alt=""
              className="h-9 w-9 object-contain"
            />
            <div>
              <h2 className="hs-title text-xl font-extrabold text-amber-100">
                REA (`morluto/rea@6.7.0`) 역설계 증명 리포트
              </h2>
              <p className="text-xs font-semibold text-amber-300/80">
                로컬 설치본 `{manifest?.sourceInstallation || '/Applications/Hearthstone'}` 직접 추출 아티팩트 및 `src/hearthstone/design.md` 검증
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hs-brass-btn rounded-xl px-3 py-1.5 text-xs font-extrabold text-amber-100"
          >
            닫기 ✕
          </button>
        </div>

        {manifest && (
          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-[#c8a158]/40 bg-black/45 p-3.5">
              <div className="font-extrabold text-yellow-300">
                1. Assembly-CSharp.dll (Unity 6000.3.11f1 Mono CIL Assembly)
              </div>
              <div className="mt-1 break-all text-[11px] font-bold text-amber-100/90">
                <div>Evidence ID: {manifest.evidence.assemblyCSharp.evidenceId}</div>
                <div>SHA-256: {manifest.evidence.assemblyCSharp.sha256}</div>
                <div>
                  Byte Length: {manifest.evidence.assemblyCSharp.byteLength.toLocaleString()} bytes · TypeDefs:{' '}
                  {manifest.evidence.assemblyCSharp.tableRowCounts.TypeDef?.toLocaleString()} · MethodDefs:{' '}
                  {manifest.evidence.assemblyCSharp.tableRowCounts.MethodDef?.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#c8a158]/40 bg-black/45 p-3.5">
              <div className="font-extrabold text-sky-300">
                2. Blizzard.T5.Game.dll & 상용 프로 디자인 시스템 (`src/hearthstone/design.md`)
              </div>
              <div className="mt-1 break-all text-[11px] font-bold text-amber-100/90">
                <div>Blizzard.T5.Game Evidence: {manifest.evidence.blizzardT5Game.evidenceId}</div>
                <div>Rymedy Baseline Evidence: {manifest.evidence.rymedyBaseline.evidenceId}</div>
              </div>
              <div className="mt-2.5 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
                <div className="rounded-lg border border-red-400/25 bg-stone-900/80 p-2.5">
                  <b className="text-red-300">기존 웹 복제본 한계:</b>
                  <ul className="mt-1 list-disc pl-4 text-stone-300">
                    <li>단순 사각형 CSS 카드 · 이모지 의존 · 원작 재질 부재</li>
                    <li>영웅 2종 고정, 덱 빌더 · 덱 코드 · 팩 개봉 부재</li>
                    <li>주문/비밀/선택/과부하 미구현</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-emerald-400/25 bg-emerald-950/55 p-2.5">
                  <b className="text-emerald-300">현재 /game.html 상용 프로 에디션:</b>
                  <ul className="mt-1 list-disc pl-4 text-emerald-100">
                    <li>공식 `koKR` 1:1 알파 실루엣 카드 렌더 ({totalCollectible}종 + 토큰 123종)</li>
                    <li>원본 번들 추출 여관 스윙 도어 · 더 박스 · 양피지 카드첩 · 석조 턴종료 레버</li>
                    <li>공식 덱 빌더 마나 커브 · 타일 바 · 덱 코드 공유 완비</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
