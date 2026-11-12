import React, { useEffect, useMemo, useState } from 'react';
import { AudioSettings, hsAudio } from '../audio';
import { useModalDismiss } from '../useModalDismiss';
import {
  CLASSIC_RANK_NAMES,
  getStarsNeededForRank,
} from '../cardDb';
import {
  CHECKOUT_COUNTRIES,
  CRYPTO_COINS_CATALOG,
  CRYPTO_QUICK_CHIPS,
  CheckoutPopupMethod,
  GAME_SHOP_PACKAGES,
  GamePaymentReturnResult,
  GameShopPackage,
  isHsGameAdRemoved,
  openGameCheckoutPopup,
  resolveCryptoDepositDetails,
} from '../paymentGateway';
import {
  canInstallGamePwa,
  isBrowserFullscreen,
  isFullscreenSupported,
  isStandalonePwa,
  promptInstallGamePwa,
  subscribePwaFullscreen,
  toggleBrowserFullscreen,
} from '../pwaFullscreen';
import {
  GOLD_PACK_BUNDLES,
  MODE_REWARD_GUIDES,
  computeOverallStanding,
  hsStorage,
} from '../storage';
import {
  GameMode,
  PlayerProfile,
  SnsCardBackId,
} from '../types';
import { HsGoldCoinIcon } from './CardVisual';
import {
  SNS_CARD_BACK_THEMES,
  SnsBoosterPackArt,
  SnsCardBackArt,
  SnsQuestScrollIcon,
  SnsRankMedallion,
} from './SnsHeroArtKit';

const CARD_BACK_IDS: SnsCardBackId[] = ['gold', 'silver', 'bronze'];
const ALL_MODES_ORDER: GameMode[] = [
  'TUTORIAL',
  'RANKED',
  'CASUAL',
  'PRACTICE_NORMAL',
  'PRACTICE_EXPERT',
];

export const QuestLogModal: React.FC<{
  onClose: () => void;
  onProfileChanged: () => void;
}> = ({ onClose }) => {
  useModalDismiss(true, () => {
    hsAudio.playSfx('box_close');
    onClose();
  });

  const [openSection, setOpenSection] = useState<'NONE' | 'REWARDS' | 'QUESTS'>('NONE');
  const [, setTick] = useState(0);
  useEffect(() => {
    const sync = () => setTick((n) => n + 1);
    window.addEventListener('snshero:state-changed', sync);
    return () => window.removeEventListener('snshero:state-changed', sync);
  }, []);

  const profile = hsStorage.getProfile();
  const quests = hsStorage.getQuests();
  const standing = computeOverallStanding(profile);
  const rankTitle = CLASSIC_RANK_NAMES[profile.rank] || '엘윈 마을 수습생';
  const starsNeeded = getStarsNeededForRank(profile.rank);
  const completedQuestsCount = quests.filter((q) => q.completed).length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hs-wood-panel relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-4 text-amber-100 sm:p-6"
      >
        {/* Clean Header */}
        <div className="mb-4 flex items-center justify-between border-b border-amber-600/35 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#d4af63] bg-stone-950/85 shadow">
              <SnsQuestScrollIcon size={30} />
            </div>
            <div>
              <h2 className="hs-title text-lg font-extrabold text-amber-100 sm:text-2xl">
                전적 · 순위 및 의뢰 보상표
              </h2>
              <p className="text-[11px] font-semibold text-amber-300/85 sm:text-xs">
                내 승/패 · 승률 · 전체순위 요약
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              hsAudio.playSfx('box_close');
              onClose();
            }}
            className="hs-brass-btn shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-extrabold text-amber-100 sm:text-sm"
          >
            닫기 ✕
          </button>
        </div>

        {/* Compact Rank & Story Progress Banner */}
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#c8a158]/55 bg-black/45 px-4 py-3">
          <div className="flex items-center gap-3">
            <SnsRankMedallion rank={profile.rank} size={54} className="shrink-0" />
            <div>
              <div className="hs-title text-base font-extrabold text-amber-100 sm:text-lg">
                {profile.rank === 0 ? rankTitle : `${profile.rank}등급 · ${rankTitle}`}
              </div>
              {profile.rank > 0 ? (
                <div className="mt-0.5 flex items-center gap-1 text-sm">
                  {Array.from({ length: starsNeeded }).map((_, idx) => (
                    <span
                      key={idx}
                      className={idx < profile.stars ? 'text-yellow-300' : 'text-stone-600'}
                    >
                      ★
                    </span>
                  ))}
                  <span className="ml-1.5 text-xs font-bold text-amber-300/85">
                    ({profile.stars}/{starsNeeded})
                  </span>
                </div>
              ) : (
                <div className="mt-0.5 text-xs font-bold text-yellow-300">
                  최고 명예 전설의 눈히어로 달성!
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-400/40 bg-emerald-950/55 px-3 py-1.5 text-xs font-extrabold text-emerald-200">
            스토리모드: 환생 {profile.journeyReincarnation}회차 · 제{profile.journeyEpisode}화
          </div>
        </div>

        {/* 3 Eye-Catching Spotlight Cards: 전체순위 / 승·패 / 승률 */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* 1. 전체순위 */}
          <div
            data-testid="quest-stat-overall-rank"
            className="flex flex-col justify-between rounded-2xl border-2 border-amber-400/65 bg-gradient-to-b from-amber-950/75 via-stone-950/90 to-black p-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.65)]"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-extrabold text-amber-200">🏆 전체순위</span>
              <span className="rounded-full border border-yellow-300/60 bg-amber-900/80 px-2 py-0.5 text-[10.5px] font-black text-yellow-200">
                상위 {standing.topPercentLabel}
              </span>
            </div>
            <div className="hs-num hs-outline-sm my-2 text-2xl font-black tracking-tight text-yellow-300 sm:text-3xl">
              #{standing.overallRank.toLocaleString()}
              <span className="ml-0.5 text-base font-extrabold text-amber-200">위</span>
            </div>
            <div className="text-[11px] font-semibold text-amber-200/75">
              전체 {standing.totalPlayers.toLocaleString()}명 기준
            </div>
          </div>

          {/* 2. 승 / 패 */}
          <div
            data-testid="quest-stat-win-loss"
            className="flex flex-col justify-between rounded-2xl border-2 border-emerald-400/60 bg-gradient-to-b from-emerald-950/70 via-stone-950/90 to-black p-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.65)]"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-extrabold text-emerald-200">⚔ 승 / 패</span>
              <span className="rounded-full border border-emerald-400/50 bg-emerald-950/90 px-2 py-0.5 text-[10.5px] font-extrabold text-emerald-200">
                {profile.winStreak >= 2
                  ? `🔥 ${profile.winStreak}연승`
                  : `총 ${standing.totalGames}전`}
              </span>
            </div>
            <div className="hs-num hs-outline-sm my-2 flex items-baseline gap-1.5 text-2xl font-black sm:text-3xl">
              <span className="text-emerald-300">{standing.wins}승</span>
              <span className="text-base text-stone-500">/</span>
              <span className="text-rose-300">{standing.losses}패</span>
            </div>
            <div className="text-[11px] font-semibold text-amber-200/75">
              통산 {standing.totalGames}경기
              {profile.winStreak > 0 ? ` · 현재 ${profile.winStreak}연승` : ''}
            </div>
          </div>

          {/* 3. 승률 */}
          <div
            data-testid="quest-stat-win-rate"
            className="flex flex-col justify-between rounded-2xl border-2 border-sky-400/60 bg-gradient-to-b from-sky-950/75 via-stone-950/90 to-black p-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.65)]"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-extrabold text-sky-200">📈 승률</span>
              <span className="rounded-full border border-sky-400/50 bg-sky-950/90 px-2 py-0.5 text-[10.5px] font-extrabold text-sky-200">
                {standing.totalGames === 0
                  ? '대결 전'
                  : standing.winRatePct >= 50
                    ? '승률 우세'
                    : '분발 중'}
              </span>
            </div>
            <div className="hs-num hs-outline-sm my-2 text-2xl font-black tracking-tight text-sky-300 sm:text-3xl">
              {standing.winRateLabel}%
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full border border-sky-400/30 bg-stone-900">
              <div
                style={{ width: `${standing.winRatePct}%` }}
                className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Progressive Disclosure: Only 2 Clean Buttons Shown by Default ("보상 안내" / "의뢰") */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            data-testid="quest-toggle-rewards"
            onClick={() => {
              hsAudio.playSfx('ui_click', 0.85);
              setOpenSection((prev) => (prev === 'REWARDS' ? 'NONE' : 'REWARDS'));
            }}
            className={`flex min-h-[48px] items-center justify-between rounded-2xl border-2 px-4 py-2.5 text-sm font-extrabold shadow-lg transition sm:text-base ${
              openSection === 'REWARDS'
                ? 'border-yellow-300 bg-gradient-to-b from-amber-600 to-amber-900 text-white shadow-[0_0_18px_rgba(251,191,36,0.45)]'
                : 'hs-brass-btn border-[#c8a158] text-amber-100 hover:border-yellow-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>🏆</span>
              <span>보상 안내</span>
            </span>
            <span className="text-xs font-bold opacity-90">
              {openSection === 'REWARDS' ? '닫기 ▲' : '보기 ▼'}
            </span>
          </button>

          <button
            type="button"
            data-testid="quest-toggle-quests"
            onClick={() => {
              hsAudio.playSfx('ui_click', 0.85);
              setOpenSection((prev) => (prev === 'QUESTS' ? 'NONE' : 'QUESTS'));
            }}
            className={`flex min-h-[48px] items-center justify-between rounded-2xl border-2 px-4 py-2.5 text-sm font-extrabold shadow-lg transition sm:text-base ${
              openSection === 'QUESTS'
                ? 'border-emerald-300 bg-gradient-to-b from-emerald-600 to-emerald-900 text-white shadow-[0_0_18px_rgba(52,211,153,0.45)]'
                : 'hs-brass-btn border-[#c8a158] text-amber-100 hover:border-emerald-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>📜</span>
              <span>의뢰</span>
              <span className="rounded-full border border-amber-300/50 bg-black/45 px-2 py-0.5 text-[11px] font-black text-yellow-200">
                {completedQuestsCount}/{quests.length}
              </span>
            </span>
            <span className="text-xs font-bold opacity-90">
              {openSection === 'QUESTS' ? '닫기 ▲' : '보기 ▼'}
            </span>
          </button>
        </div>

        {/* On-Demand Panel 1: 보상 안내 */}
        {openSection === 'REWARDS' && (
          <div
            data-testid="quest-panel-rewards"
            className="mt-3.5 space-y-2 rounded-2xl border-2 border-amber-400/55 bg-black/55 p-3.5"
          >
            <div className="mb-1 flex items-center justify-between px-1">
              <h3 className="hs-title text-sm font-extrabold text-yellow-300">
                모드별 확정 승리 보상 안내
              </h3>
              <span className="text-[11px] font-semibold text-amber-200/75">
                승리 즉시 자동 지급
              </span>
            </div>
            {ALL_MODES_ORDER.map((m) => {
              const g = MODE_REWARD_GUIDES[m];
              return (
                <div
                  key={m}
                  className="flex flex-col justify-between gap-1 rounded-xl border border-amber-500/25 bg-stone-950/90 px-3 py-2.5 text-xs sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-extrabold text-amber-100">{g.modeNameKo}</span>
                      <span className="rounded border border-sky-400/35 bg-sky-950/80 px-1.5 py-0.5 text-[10px] font-bold text-sky-200">
                        {g.playStyleBadge}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] font-semibold text-emerald-200/90">
                      {g.specialBonusText}
                    </div>
                  </div>
                  <div className="shrink-0 font-extrabold text-yellow-300 sm:text-right">
                    {g.baseWinRewardText}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* On-Demand Panel 2: 의뢰 */}
        {openSection === 'QUESTS' && (
          <div
            data-testid="quest-panel-quests"
            className="mt-3.5 rounded-2xl border-2 border-emerald-400/55 bg-black/55 p-3.5"
          >
            <div className="mb-2.5 flex items-center justify-between px-1">
              <h3 className="hs-title text-sm font-extrabold text-emerald-200">
                오늘의 엘윈마을 의뢰
              </h3>
              <span className="text-[11px] font-semibold text-emerald-200/80">
                달성 시 골드 즉시 지급
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {quests.map((q) => {
                const pct = Math.min(100, Math.round((q.progress / q.goal) * 100));
                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border-2 p-3.5 shadow ${
                      q.completed
                        ? 'border-emerald-400/70 bg-emerald-950/60 text-emerald-100'
                        : 'border-[#a88246] bg-[#f3e5c3] text-stone-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="hs-title text-sm font-extrabold">{q.title}</span>
                      <span className="flex items-center gap-1 rounded-full border border-amber-900/40 bg-amber-400/90 px-2 py-0.5 text-xs font-black text-stone-950">
                        <HsGoldCoinIcon size={14} />
                        <span>+{q.rewardGold}G</span>
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
                      {q.completed ? '보상 지급 완료 ✓' : `${q.progress} / ${q.goal}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 3-Step Sequential Checkout Flow:
 * 1) `quantity` (① 구매수량 선택 + 골드 구매)
 * 2) `country`  (② 결제국가 선택)
 * 3) `method`   (③ 결제수단 선택 -> 새 팝업 창 결제)
 *    + optional `crypto_coin` / `crypto_chain` / `crypto_deposit` sub-steps when 암호화폐 is picked
 */
type ShopCheckoutStep =
  | 'quantity'
  | 'country'
  | 'method'
  | 'crypto_coin'
  | 'crypto_chain'
  | 'crypto_deposit';

export const TavernShopModal: React.FC<{
  onClose: () => void;
  onProfileChanged: () => void;
  onGoOpenPacks: () => void;
}> = ({ onClose, onProfileChanged, onGoOpenPacks }) => {
  useModalDismiss(true, () => {
    hsAudio.playSfx('box_close');
    onClose();
  });

  const [profile, setProfile] = useState<PlayerProfile>(() => hsStorage.getProfile());
  const [vipAdRemoved, setVipAdRemoved] = useState<boolean>(() => isHsGameAdRemoved());
  const [step, setStep] = useState<ShopCheckoutStep>('quantity');
  const [selectedPkg, setSelectedPkg] = useState<GameShopPackage>(GAME_SHOP_PACKAGES[0]);
  const [countryCode, setCountryCode] = useState<string>('ko');
  const [popupWaitingMethod, setPopupWaitingMethod] = useState<CheckoutPopupMethod | null>(null);
  const [popupBlockedRetry, setPopupBlockedRetry] = useState<CheckoutPopupMethod | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [coinSearch, setCoinSearch] = useState<string>('');
  const [selectedCoinCcy, setSelectedCoinCcy] = useState<string>('USDT');
  const [selectedChain, setSelectedChain] = useState<string>('USDT-TRC20');
  const [cryptoSecondsLeft, setCryptoSecondsLeft] = useState<number>(600);
  const [copiedAddr, setCopiedAddr] = useState<boolean>(false);
  const [depositCheckMsg, setDepositCheckMsg] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setProfile(hsStorage.getProfile());
      setVipAdRemoved(isHsGameAdRemoved());
    };
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === 'SNSHERO_GAME_PAYMENT_COMPLETE') {
        setPopupWaitingMethod(null);
        setPopupBlockedRetry(null);
        sync();
        onProfileChanged();
        onClose();
      }
    };
    window.addEventListener('snshero:state-changed', sync);
    window.addEventListener('snshero_ad_removed_updated', sync);
    window.addEventListener('message', onMsg);
    return () => {
      window.removeEventListener('snshero:state-changed', sync);
      window.removeEventListener('snshero_ad_removed_updated', sync);
      window.removeEventListener('message', onMsg);
    };
  }, [onClose, onProfileChanged]);

  useEffect(() => {
    if (step !== 'crypto_deposit') return;
    setCryptoSecondsLeft(600);
    const iv = window.setInterval(() => {
      setCryptoSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(iv);
  }, [step, selectedCoinCcy, selectedChain, selectedPkg.id]);

  const refresh = () => {
    setProfile(hsStorage.getProfile());
    onProfileChanged();
  };

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 3200);
  };

  const handleBuyGoldBundle = (packs: number, costGold: number, label: string) => {
    const ok = hsStorage.buyPackBundleWithGold(packs, costGold);
    if (!ok) {
      hsAudio.playSfx('ui_click', 0.6);
      showToast(`보유 골드가 부족합니다! (${label}: ${costGold}G 필요 / 현재 ${profile.gold}G)`);
      return;
    }
    hsAudio.playSfx('purchase');
    refresh();
    showToast(`🎉 ${label} 구매 완료! (-${costGold}G → 미개봉 팩 +${packs}개 지급)`);
  };

  const handleSelectPackageToStep2 = (pkg: GameShopPackage) => {
    hsAudio.playSfx('ui_click');
    setSelectedPkg(pkg);
    setPopupWaitingMethod(null);
    setPopupBlockedRetry(null);
    setDepositCheckMsg(null);
    setCopiedAddr(false);
    setStep('country');
  };

  const handleSelectCountryToStep3 = (code: string) => {
    hsAudio.playSfx('ui_click');
    setCountryCode(code);
    setPopupWaitingMethod(null);
    setPopupBlockedRetry(null);
    setStep('method');
  };

  const handleTriggerPopupCheckout = (method: CheckoutPopupMethod) => {
    hsAudio.playSfx('box_press');
    setPopupBlockedRetry(null);
    const popup = openGameCheckoutPopup(selectedPkg, method);
    if (!popup) {
      setPopupBlockedRetry(method);
      showToast('브라우저에서 팝업이 차단되었습니다. 아래 [결제 팝업 창 열기] 버튼을 다시 눌러주세요.');
      return;
    }
    setPopupWaitingMethod(method);
    try {
      popup.focus();
    } catch {
      // ignore
    }
  };

  const handleSelectBack = (id: SnsCardBackId) => {
    const p = hsStorage.getProfile();
    p.selectedCardBack = id;
    hsStorage.saveProfile(p);
    hsAudio.playSfx('ui_click');
    showToast(`카드 뒷면이 '${SNS_CARD_BACK_THEMES[id].name}'(으)로 변경되었습니다.`);
    refresh();
  };

  const selectedCountry = useMemo(
    () => CHECKOUT_COUNTRIES.find((c) => c.code === countryCode) || CHECKOUT_COUNTRIES[0],
    [countryCode],
  );

  const filteredCoins = useMemo(() => {
    const q = coinSearch.trim().toLowerCase();
    if (!q) return CRYPTO_COINS_CATALOG;
    return CRYPTO_COINS_CATALOG.filter(
      (c) => c.ccy.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    );
  }, [coinSearch]);

  const activeCoinObj = useMemo(
    () => CRYPTO_COINS_CATALOG.find((c) => c.ccy === selectedCoinCcy) || CRYPTO_COINS_CATALOG[0],
    [selectedCoinCcy],
  );

  const cryptoDeposit = useMemo(
    () => resolveCryptoDepositDetails(selectedCoinCcy, selectedChain, selectedPkg.priceUsd),
    [selectedCoinCcy, selectedChain, selectedPkg.priceUsd],
  );

  const handlePickCoin = (ccy: string) => {
    const coin = CRYPTO_COINS_CATALOG.find((c) => c.ccy === ccy) || CRYPTO_COINS_CATALOG[0];
    setSelectedCoinCcy(coin.ccy);
    setSelectedChain(coin.chains[0]);
    setDepositCheckMsg(null);
    if (coin.chains.length > 1) {
      setStep('crypto_chain');
    } else {
      setStep('crypto_deposit');
    }
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddr(true);
      window.setTimeout(() => setCopiedAddr(false), 2000);
    } catch {
      window.prompt('입금 지갑 주소를 복사해 주세요:', address);
    }
  };

  const mm = String(Math.floor(cryptoSecondsLeft / 60)).padStart(2, '0');
  const ss = String(cryptoSecondsLeft % 60).padStart(2, '0');

  const activeWizardStepNum =
    step === 'quantity' ? 1 : step === 'country' ? 2 : 3;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hs-wood-panel relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-4 text-amber-100 sm:p-6"
      >
        {/* Header */}
        <div className="mb-3 flex items-center justify-between border-b border-amber-600/35 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#dfc07b] bg-stone-950/80">
              <HsGoldCoinIcon size={28} />
            </div>
            <div>
              <h2 className="hs-title text-lg font-extrabold text-amber-100 sm:text-2xl">
                눈히어로 보급소
              </h2>
              <p className="text-xs font-semibold text-amber-300/85">
                보유 골드 <b className="text-yellow-300">{profile.gold}G</b> · 미개봉 팩{' '}
                <b className="text-amber-100">{profile.packs}개</b> · 영웅 가루{' '}
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

        {/* Sequential 3-Step Indicator Bar */}
        <div className="mb-4 grid grid-cols-3 gap-1.5 rounded-2xl border border-[#c8a158]/45 bg-stone-950/85 p-1.5 text-center text-[11px] font-extrabold sm:text-xs">
          <button
            type="button"
            onClick={() => setStep('quantity')}
            className={`rounded-xl py-1.5 transition ${
              activeWizardStepNum === 1
                ? 'bg-gradient-to-b from-amber-500 to-amber-800 text-white shadow'
                : 'text-amber-200/75 hover:text-white'
            }`}
          >
            ① 구매수량 선택
          </button>
          <button
            type="button"
            disabled={activeWizardStepNum < 2}
            onClick={() => {
              if (activeWizardStepNum >= 2) setStep('country');
            }}
            className={`rounded-xl py-1.5 transition ${
              activeWizardStepNum === 2
                ? 'bg-gradient-to-b from-amber-500 to-amber-800 text-white shadow'
                : activeWizardStepNum > 2
                  ? 'text-amber-200 hover:text-white'
                  : 'cursor-not-allowed text-stone-500'
            }`}
          >
            ② 결제국가 선택
          </button>
          <div
            className={`rounded-xl py-1.5 ${
              activeWizardStepNum === 3
                ? 'bg-gradient-to-b from-sky-500 to-blue-800 text-white shadow'
                : 'text-stone-500'
            }`}
          >
            ③ 결제수단 선택
          </div>
        </div>

        {toast && (
          <div className="mb-3.5 rounded-xl border border-amber-300 bg-amber-950/90 px-4 py-2 text-center text-xs font-extrabold text-yellow-200 shadow-lg">
            {toast}
          </div>
        )}

        {/* ==================== STEP 1: 구매수량 선택 (골드 구매 + 현금 패키지 선택) ==================== */}
        {step === 'quantity' && (
          <div className="space-y-4">
            {/* A. Gold Pack Purchase Section */}
            <div className="rounded-2xl border-2 border-yellow-400/55 bg-gradient-to-b from-amber-950/45 to-black/55 p-3.5 sm:p-4">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <HsGoldCoinIcon size={18} />
                  <h3 className="hs-title text-sm font-extrabold text-yellow-300 sm:text-base">
                    보유 골드로 눈히어로 카드팩 즉시 구매
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-300">
                  현재 보유: {profile.gold} 골드
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {GOLD_PACK_BUNDLES.map((gb) => {
                  const canAfford = profile.gold >= gb.costGold;
                  return (
                    <div
                      key={gb.id}
                      className="flex flex-col justify-between rounded-xl border border-[#c8a158]/55 bg-stone-950/85 p-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-extrabold text-amber-100">{gb.label}</span>
                          {gb.badge && (
                            <span className="rounded-full bg-emerald-800/90 px-2 py-0.5 text-[9.5px] font-extrabold text-emerald-200">
                              {gb.badge}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-[11px] font-semibold text-amber-200/75">
                          총 {gb.packs * 5}장 획득 · 희귀 이상 각 팩 1장 확정
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBuyGoldBundle(gb.packs, gb.costGold, gb.label)}
                        className={`mt-2.5 flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl text-xs font-extrabold transition ${
                          canAfford
                            ? 'hs-brass-btn border-yellow-300/80 text-yellow-200'
                            : 'border border-stone-700 bg-stone-900/80 text-stone-400 hover:border-amber-500/50'
                        }`}
                      >
                        <HsGoldCoinIcon size={15} />
                        <span>{gb.costGold} 골드로 구매</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* B. Cash Package Quantity Selection -> Advances to Step 2 (`country`) */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="hs-title text-sm font-extrabold text-sky-200 sm:text-base">
                  보급 패키지 수량 선택 (선택 시 결제국가 선택으로 이동)
                </h3>
                <span className="text-[11px] font-bold text-amber-200/75">
                  팝업 안전결제 지원
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {GAME_SHOP_PACKAGES.map((pkg) => {
                  const isBest = pkg.id === 'pack_5';
                  const alreadyOwnedAd = Boolean(pkg.isAdRemoval && vipAdRemoved);
                  return (
                    <div
                      key={pkg.id}
                      className={`flex flex-col items-center justify-between rounded-2xl border-2 p-3.5 ${
                        isBest
                          ? 'border-yellow-300/80 bg-amber-950/40 shadow-[0_0_22px_rgba(250,204,21,0.2)]'
                          : 'border-[#c8a158]/50 bg-black/40'
                      }`}
                    >
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full border border-amber-300/50 bg-amber-950/85 px-2 py-0.5 text-[10px] font-extrabold text-yellow-300">
                            {pkg.badge}
                          </span>
                          {pkg.packs > 0 && (
                            <span className="text-[11px] font-bold text-amber-200/80">
                              {pkg.packs * 5}장 수령
                            </span>
                          )}
                        </div>

                        <div className="my-2.5 flex flex-col items-center">
                          {pkg.packs > 0 ? (
                            <div className="h-24 w-18">
                              <SnsBoosterPackArt glowing={isBest} />
                            </div>
                          ) : (
                            <div className="flex h-24 w-18 items-center justify-center rounded-2xl border-2 border-[#c8a158] bg-stone-950/90 text-center text-xs font-extrabold text-yellow-300">
                              NO AD
                              <br />
                              VIP
                            </div>
                          )}
                          <div className="hs-title mt-2 text-center text-sm font-extrabold text-amber-100">
                            {pkg.name}
                          </div>
                          <div className="mt-0.5 flex items-baseline gap-1.5">
                            <span className="hs-num text-lg text-yellow-300">
                              ${pkg.priceUsd % 1 === 0 ? pkg.priceUsd.toFixed(0) : pkg.priceUsd.toFixed(2)}
                            </span>
                            <span className="text-xs font-bold text-amber-200/80">
                              ({pkg.priceKrw.toLocaleString()}원)
                            </span>
                          </div>
                        </div>

                        <p className="text-center text-[11px] font-semibold leading-relaxed text-amber-200/80">
                          {pkg.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={alreadyOwnedAd}
                        onClick={() => handleSelectPackageToStep2(pkg)}
                        className={`mt-3 min-h-[42px] w-full rounded-xl py-2 text-xs font-extrabold sm:text-sm ${
                          isBest
                            ? 'hs-arcane-btn text-white'
                            : 'hs-brass-btn text-amber-100'
                        }`}
                      >
                        {alreadyOwnedAd
                          ? '광고 제거 적용됨'
                          : `수량 선택 ($${pkg.priceUsd.toFixed(2)}) →`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {profile.packs > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoOpenPacks();
                }}
                className="hs-arcane-btn min-h-[44px] w-full rounded-xl py-2.5 text-xs font-extrabold text-white sm:text-sm"
              >
                눈히어로 팩 즉시 개봉하러 가기 ({profile.packs}개 보유 중) →
              </button>
            )}

            {/* Official 3 SNS HERO Card Back Selector */}
            <div className="rounded-2xl border-2 border-[#c8a158]/50 bg-black/40 p-3.5">
              <h3 className="hs-title mb-2 text-sm font-extrabold text-amber-100">
                눈히어로 공식 카드 뒷면 변경
              </h3>
              <div className="grid grid-cols-3 gap-2.5">
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
                          ? 'border-yellow-300 bg-amber-900/60 shadow-[0_0_16px_rgba(250,204,21,0.72)]'
                          : 'border-stone-700 bg-stone-900/60 hover:border-amber-500'
                      }`}
                    >
                      <div className="h-20 w-[56px]">
                        <SnsCardBackArt variant={cbId} />
                      </div>
                      <span className="mt-1.5 text-center text-[11px] font-extrabold leading-tight text-amber-100">
                        {meta.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== STEP 2: 결제국가 선택 팝업 단계 ==================== */}
        {step === 'country' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('quantity')}
                className="hs-brass-btn min-h-[38px] rounded-xl px-3.5 py-1.5 text-xs font-extrabold text-amber-100"
              >
                ← ① 구매수량 다시 선택
              </button>
              <span className="text-xs font-extrabold text-amber-300">
                2 / 3 단계 · 결제국가 선택
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border-2 border-[#c8a158]/55 bg-black/45 p-3.5">
              <div>
                <div className="text-[11px] font-bold text-amber-300/80">선택한 상품 수량</div>
                <div className="hs-title text-base font-extrabold text-amber-100">
                  {selectedPkg.name}
                </div>
                <div className="text-xs font-semibold text-amber-200/75">{selectedPkg.shortSpec}</div>
              </div>
              <div className="text-right">
                <div className="hs-num text-lg text-yellow-300">
                  ${selectedPkg.priceUsd.toFixed(2)}
                </div>
                <div className="text-xs font-bold text-amber-200/85">
                  ({selectedPkg.priceKrw.toLocaleString()}원)
                </div>
              </div>
            </div>

            <div>
              <h3 className="hs-title mb-2.5 text-base font-extrabold text-amber-100">
                결제하실 국가 / 통화 권역을 선택해 주세요
              </h3>
              <div className="space-y-2">
                {CHECKOUT_COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelectCountryToStep3(c.code)}
                    className="flex min-h-[56px] w-full items-center justify-between rounded-2xl border-2 border-[#c8a158]/45 bg-stone-950/85 px-4 py-2.5 text-left transition hover:border-yellow-300 hover:bg-amber-950/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.flag}</span>
                      <div>
                        <div className="text-sm font-extrabold text-amber-100">{c.name}</div>
                        <div className="text-[11px] font-semibold text-amber-200/75">
                          {c.subLabel}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-lg border border-amber-300/50 bg-amber-900/60 px-2.5 py-1 text-xs font-extrabold text-yellow-200">
                      선택 →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== STEP 3: 결제수단 선택 팝업 단계 (새 팝업 창 결제) ==================== */}
        {step === 'method' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('country')}
                className="hs-brass-btn min-h-[38px] rounded-xl px-3.5 py-1.5 text-xs font-extrabold text-amber-100"
              >
                ← ② 결제국가 변경
              </button>
              <span className="text-xs font-extrabold text-sky-300">
                3 / 3 단계 · 결제수단 선택 ({selectedCountry.flag} {selectedCountry.currency})
              </span>
            </div>

            {/* Summary Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-[#c8a158]/55 bg-black/45 p-3.5">
              <div>
                <div className="text-[11px] font-bold text-amber-300/80">
                  {selectedCountry.flag} {selectedCountry.name}
                </div>
                <div className="hs-title text-base font-extrabold text-amber-100">
                  {selectedPkg.name}
                </div>
              </div>
              <div className="text-right">
                {selectedCountry.currency === 'KRW' ? (
                  <>
                    <div className="hs-num text-xl text-yellow-300">
                      {selectedPkg.priceKrw.toLocaleString()}원
                    </div>
                    <div className="text-[11px] font-bold text-amber-200/75">
                      (글로벌 ${selectedPkg.priceUsd.toFixed(2)} USD)
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hs-num text-xl text-yellow-300">
                      ${selectedPkg.priceUsd.toFixed(2)} USD
                    </div>
                    <div className="text-[11px] font-bold text-amber-200/75">
                      ({selectedPkg.priceKrw.toLocaleString()} KRW)
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Active Popup Waiting Notice (Main Page Stays Right Here!) */}
            {popupWaitingMethod && (
              <div className="rounded-2xl border-2 border-emerald-400/75 bg-emerald-950/75 p-3.5 text-xs">
                <div className="font-extrabold text-emerald-200">
                  🪟 새 팝업 창에서 결제가 진행 중입니다 (현재 게임 화면은 그대로 유지됩니다!)
                </div>
                <p className="mt-1 font-semibold text-amber-100/90">
                  팝업 창에서 결제를 완료하시면 자동으로 팝업이 닫히고 현재 화면으로 돌아와{' '}
                  <b className="text-yellow-300">{selectedPkg.name}</b> 보상이 즉시 지급됩니다.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleTriggerPopupCheckout(popupWaitingMethod)}
                    className="hs-brass-btn rounded-lg px-3 py-1.5 text-[11px] font-extrabold text-amber-100"
                  >
                    결제 팝업 창 다시 띄우기
                  </button>
                  <button
                    type="button"
                    onClick={() => setPopupWaitingMethod(null)}
                    className="rounded-lg border border-stone-600 bg-stone-900 px-3 py-1.5 text-[11px] font-bold text-stone-300"
                  >
                    안내 닫기
                  </button>
                </div>
              </div>
            )}

            {popupBlockedRetry && (
              <button
                type="button"
                onClick={() => handleTriggerPopupCheckout(popupBlockedRetry)}
                className="hs-arcane-btn min-h-[46px] w-full rounded-xl px-4 text-xs font-extrabold text-white sm:text-sm"
              >
                🪟 차단된 결제 팝업 창 열기 ({selectedPkg.name})
              </button>
            )}

            {/* Clean Payment Methods Tailored by Country */}
            <div className="space-y-2.5">
              {selectedCountry.code === 'ko' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleTriggerPopupCheckout('card')}
                    className="hs-arcane-btn flex min-h-[50px] w-full items-center justify-between rounded-xl px-4 text-xs font-extrabold text-white sm:text-sm"
                  >
                    <span>💳 국내 신용 · 체크카드 (팝업 안전결제)</span>
                    <span className="text-yellow-200">
                      {selectedPkg.priceKrw.toLocaleString()}원 →
                    </span>
                  </button>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleTriggerPopupCheckout('kakaopay')}
                      className="hs-brass-btn flex min-h-[48px] items-center justify-between rounded-xl px-4 text-xs font-extrabold text-yellow-200"
                    >
                      <span>💛 카카오페이 간편결제 (팝업)</span>
                      <span>{selectedPkg.priceKrw.toLocaleString()}원 →</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTriggerPopupCheckout('naverpay')}
                      className="hs-brass-btn flex min-h-[48px] items-center justify-between rounded-xl px-4 text-xs font-extrabold text-emerald-200"
                    >
                      <span>💚 네이버페이 간편결제 (팝업)</span>
                      <span>{selectedPkg.priceKrw.toLocaleString()}원 →</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTriggerPopupCheckout('paypal')}
                    className="hs-brass-btn flex min-h-[48px] w-full items-center justify-between rounded-xl px-4 text-xs font-extrabold text-amber-100 sm:text-sm"
                  >
                    <span>🌐 PayPal 글로벌 결제 (팝업)</span>
                    <span className="text-yellow-300">
                      ${selectedPkg.priceUsd.toFixed(2)} USD →
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleTriggerPopupCheckout('paypal')}
                    className="hs-arcane-btn flex min-h-[50px] w-full items-center justify-between rounded-xl px-4 text-xs font-extrabold text-white sm:text-sm"
                  >
                    <span>🌐 PayPal · 해외 신용카드 Visa / Master (팝업 결제)</span>
                    <span className="text-yellow-200">
                      ${selectedPkg.priceUsd.toFixed(2)} USD →
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTriggerPopupCheckout('applepay')}
                    className="hs-brass-btn flex min-h-[48px] w-full items-center justify-between rounded-xl px-4 text-xs font-extrabold text-amber-100 sm:text-sm"
                  >
                    <span>🍎 Apple Pay · 글로벌 카드 결제 (팝업 결제)</span>
                    <span className="text-yellow-300">
                      ${selectedPkg.priceUsd.toFixed(2)} USD →
                    </span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setCoinSearch('');
                  setStep('crypto_coin');
                }}
                className="hs-brass-btn flex min-h-[48px] w-full items-center justify-between rounded-xl px-4 text-xs font-extrabold text-sky-200 sm:text-sm"
              >
                <span>🪙 암호화폐 결제 (USDT · BTC · ETH · SOL · XRP)</span>
                <span>${selectedPkg.priceUsd.toFixed(2)} 상당 →</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== CRYPTO SUB-STEPS ==================== */}
        {step === 'crypto_coin' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('method')}
                className="hs-brass-btn rounded-xl px-3.5 py-2 text-xs font-extrabold text-amber-100"
              >
                ← ③ 결제수단 목록으로
              </button>
              <span className="hs-num text-sm text-yellow-300">
                ${selectedPkg.priceUsd.toFixed(2)} USD
              </span>
            </div>

            <input
              type="text"
              value={coinSearch}
              onChange={(e) => setCoinSearch(e.target.value)}
              placeholder="암호화폐 검색 (예: USDT, BTC, SOL)"
              className="min-h-[42px] w-full rounded-xl border border-[#c8a158]/50 bg-stone-950/90 px-3.5 text-xs font-bold text-amber-100 placeholder:text-amber-200/45 focus:border-yellow-300 focus:outline-none"
            />

            <div className="flex flex-wrap gap-1.5">
              {CRYPTO_QUICK_CHIPS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => handlePickCoin(sym)}
                  className="hs-brass-btn rounded-lg px-3 py-1.5 text-xs font-extrabold text-yellow-200"
                >
                  {sym}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filteredCoins.map((coin) => (
                <button
                  key={coin.ccy}
                  type="button"
                  onClick={() => handlePickCoin(coin.ccy)}
                  className="flex min-h-[48px] items-center justify-between rounded-xl border border-[#c8a158]/45 bg-black/45 px-3.5 text-left hover:border-yellow-300"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-400/40 bg-stone-900 text-xs">
                      {coin.icon}
                    </span>
                    <div>
                      <div className="text-xs font-extrabold text-amber-100">{coin.ccy}</div>
                      <div className="text-[11px] text-amber-200/70">{coin.name}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-300">
                    체인 {coin.chains.length}개 →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'crypto_chain' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('crypto_coin')}
                className="hs-brass-btn rounded-xl px-3.5 py-2 text-xs font-extrabold text-amber-100"
              >
                ← 다른 코인 선택
              </button>
              <span className="text-xs font-extrabold text-yellow-300">
                {activeCoinObj.ccy} 네트워크 선택
              </span>
            </div>

            <div className="space-y-2">
              {activeCoinObj.chains.map((chainName, idx) => (
                <button
                  key={chainName}
                  type="button"
                  onClick={() => {
                    setSelectedChain(chainName);
                    setStep('crypto_deposit');
                  }}
                  className="flex min-h-[50px] w-full items-center justify-between rounded-xl border border-[#c8a158]/45 bg-black/45 px-4 text-left hover:border-yellow-300"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-amber-100">{chainName}</span>
                      {idx === 0 && (
                        <span className="rounded-full bg-amber-500/25 px-2 py-0.5 text-[10px] font-extrabold text-yellow-300">
                          추천
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-amber-200/70">
                      블록체인 컨펌 후 자동 반영 (약 1~3분)
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-yellow-300">선택 →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'crypto_deposit' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setStep(activeCoinObj.chains.length > 1 ? 'crypto_chain' : 'crypto_coin')
                }
                className="hs-brass-btn rounded-xl px-3.5 py-2 text-xs font-extrabold text-amber-100"
              >
                ← 네트워크 / 코인 변경
              </button>
              <span className="rounded-full border border-yellow-300/60 bg-amber-950/80 px-3 py-1 text-xs font-extrabold text-yellow-300">
                유효 시간 {mm}:{ss}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-2xl border-2 border-[#c8a158]/50 bg-black/45 p-4 sm:grid-cols-12">
              <div className="flex flex-col items-center justify-center rounded-xl border border-[#c8a158]/35 bg-white p-3 sm:col-span-5">
                <div
                  className="flex h-44 w-44 items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: cryptoDeposit.qrSvg }}
                />
                <span className="mt-1.5 text-[11px] font-extrabold text-stone-800">
                  {cryptoDeposit.ccy} ({cryptoDeposit.chain})
                </span>
              </div>

              <div className="flex flex-col justify-between space-y-3 sm:col-span-7">
                <div>
                  <div className="text-[11px] font-bold text-amber-300/80">정확한 입금 수량</div>
                  <div className="hs-num mt-0.5 text-xl text-yellow-300">
                    {cryptoDeposit.amount} {cryptoDeposit.ccy}
                  </div>
                  <div className="text-[11px] text-amber-200/75">
                    상품 금액: ${selectedPkg.priceUsd.toFixed(2)} USD · {selectedPkg.name}
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-[11px] font-bold text-amber-300/80">
                    입금 지갑 주소 ({cryptoDeposit.chain})
                  </div>
                  <div className="break-all rounded-xl border border-[#c8a158]/40 bg-stone-950/90 p-2.5 text-xs font-extrabold text-amber-100">
                    {cryptoDeposit.address}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyAddress(cryptoDeposit.address)}
                      className="hs-brass-btn flex-1 rounded-xl py-2.5 text-xs font-extrabold text-amber-100"
                    >
                      {copiedAddr ? '주소 복사 완료 ✓' : '지갑 주소 복사'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDepositCheckMsg(
                          `블록체인 네트워크(${cryptoDeposit.chain})에서 입금 내역을 조회 중입니다. 전송 컨펌 완료 즉시 ${selectedPkg.name} 상품이 자동 지급됩니다.`,
                        )
                      }
                      className="hs-arcane-btn flex-1 rounded-xl py-2.5 text-xs font-extrabold text-white"
                    >
                      입금 완료 확인 요청
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {depositCheckMsg && (
              <div className="rounded-xl border border-amber-300/60 bg-amber-950/85 p-3 text-xs font-bold text-yellow-200">
                {depositCheckMsg}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const PaymentSuccessModal: React.FC<{
  info: GamePaymentReturnResult;
  onOpenPacks: () => void;
  onClose: () => void;
}> = ({ info, onOpenPacks, onClose }) => {
  useModalDismiss(true, onClose);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hs-wood-panel w-full max-w-md rounded-3xl p-6 text-center text-amber-100"
      >
        <h2 className="hs-title text-2xl font-extrabold text-yellow-300">결제가 완료되었습니다!</h2>
        <p className="mt-2 text-sm font-bold text-amber-100">
          {info.label} 상품이 계정에 즉시 반영되었습니다.
        </p>
        {info.packsGranted && info.packsGranted > 0 && (
          <div className="my-4 flex flex-col items-center">
            <div className="h-28 w-20">
              <SnsBoosterPackArt glowing />
            </div>
            <span className="hs-num mt-2 text-lg text-yellow-300">
              +{info.packsGranted}팩 지급 완료
            </span>
          </div>
        )}
        <div className="mt-5 flex gap-2.5">
          {info.packsGranted && info.packsGranted > 0 && (
            <button
              type="button"
              onClick={onOpenPacks}
              className="hs-arcane-btn flex-1 rounded-xl py-2.5 text-sm font-extrabold text-white"
            >
              팩 개봉하러 가기 →
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="hs-brass-btn flex-1 rounded-xl py-2.5 text-sm font-extrabold text-amber-100"
          >
            현재 화면으로 계속하기
          </button>
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
  useModalDismiss(true, onClose);

  const [settings, setSettings] = useState<AudioSettings>(() => hsAudio.getSettings());
  const [, setPwaTick] = useState(0);
  const [dataNotice, setDataNotice] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const vibSupport = useMemo(() => hsAudio.getVibrationSupportInfo(), []);

  useEffect(() => {
    return subscribePwaFullscreen(() => setPwaTick((n) => n + 1));
  }, []);

  const standaloneApp = isStandalonePwa();
  const fullscreenOn = isBrowserFullscreen() || standaloneApp;
  const fullscreenSupported = isFullscreenSupported();
  const canInstallPwa = canInstallGamePwa();

  const update = (patch: Partial<AudioSettings>) => {
    hsAudio.updateSettings(patch);
    setSettings(hsAudio.getSettings());
  };

  const handleCopyBackup = async () => {
    hsAudio.playSfx('ui_click', 0.8);
    const { jsonString, keyCount } = hsStorage.exportGameBackupData();
    try {
      await navigator.clipboard.writeText(jsonString);
      setDataNotice(`✓ 눈히어로 카드배틀 백업 코드(${keyCount}개 항목)가 복사되었습니다.`);
    } catch {
      hsStorage.downloadGameBackupFile();
      setDataNotice('✓ 백업 JSON 파일이 다운로드되었습니다.');
    }
  };

  const handlePasteRestore = () => {
    hsAudio.playSfx('ui_click', 0.8);
    const raw = window.prompt('복원할 눈히어로 카드배틀(/game.html) 백업 JSON 코드를 붙여넣어 주세요:');
    if (!raw || !raw.trim()) return;
    const res = hsStorage.restoreGameBackupJson(raw.trim());
    setDataNotice(res.message);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/78 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="hs-wood-panel max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl p-5 sm:p-6 text-amber-100"
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
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-amber-100">전체화면 모드 (PWA)</div>
              <div className="mt-0.5 text-[11px] font-semibold text-amber-200/75">
                {standaloneApp
                  ? '독립형 전체화면 PWA 앱 모드로 실행 중'
                  : '브라우저 주소창을 숨기고 몰입형 전체화면으로 플레이'}
              </div>
            </div>
            {standaloneApp ? (
              <span className="shrink-0 rounded-lg border border-emerald-300/60 bg-emerald-900/80 px-3 py-1.5 text-xs font-extrabold text-emerald-100">
                PWA 전체화면 ✓
              </span>
            ) : (
              <button
                type="button"
                data-testid="toggle-fullscreen-mode"
                disabled={!fullscreenSupported}
                onClick={() => {
                  hsAudio.playSfx('ui_click', 0.75);
                  toggleBrowserFullscreen();
                }}
                className={`min-h-[38px] shrink-0 rounded-lg border px-3.5 py-1.5 text-xs font-extrabold transition ${
                  fullscreenOn
                    ? 'border-emerald-300/60 bg-emerald-800 text-white'
                    : 'border-amber-300/60 bg-amber-900/80 text-amber-100 hover:brightness-110'
                } disabled:opacity-45`}
              >
                {fullscreenOn ? '전체화면 켜짐' : '전체화면 전환'}
              </button>
            )}
          </div>

          {canInstallPwa && (
            <div className="flex items-center justify-between gap-2 border-t border-amber-500/20 pt-3">
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-sky-200">홈 화면에 앱 설치</div>
                <div className="mt-0.5 text-[11px] font-semibold text-amber-200/75">
                  바탕화면 아이콘으로 언제든 즉시 전체화면 실행
                </div>
              </div>
              <button
                type="button"
                data-testid="options-install-pwa"
                onClick={() => {
                  hsAudio.playSfx('ui_click', 0.8);
                  promptInstallGamePwa();
                }}
                className="hs-arcane-btn min-h-[38px] shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-extrabold text-white"
              >
                📲 앱 설치
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-amber-500/20 pt-3">
            <span className="text-sm font-extrabold">사운드 출력</span>
            <button
              type="button"
              onClick={() => update({ muted: !settings.muted })}
              className={`min-h-[38px] rounded-lg border px-3.5 py-1.5 text-xs font-extrabold ${
                settings.muted
                  ? 'border-red-300/60 bg-red-800 text-white'
                  : 'border-emerald-300/60 bg-emerald-800 text-white'
              }`}
            >
              {settings.muted ? '음소거 켜짐' : '사운드 켜짐'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-amber-500/20 pt-3">
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-amber-100">
                스토리 낭독 & TTS 읽어주기
              </div>
              <div className="mt-0.5 text-[11px] font-semibold text-amber-200/75">
                에피소드 5컷 요약 문구 및 영웅명 음성 낭독 (끄면 자막만 표시)
              </div>
            </div>
            <button
              type="button"
              data-testid="toggle-tts-reading"
              onClick={() => {
                const nextEnabled = !settings.ttsEnabled;
                hsAudio.playSfx('ui_click', 0.75);
                update({ ttsEnabled: nextEnabled });
              }}
              className={`min-h-[38px] shrink-0 rounded-lg border px-3.5 py-1.5 text-xs font-extrabold transition ${
                settings.ttsEnabled
                  ? 'border-emerald-300/60 bg-emerald-800 text-white'
                  : 'border-stone-400/50 bg-stone-800 text-stone-200'
              }`}
            >
              {settings.ttsEnabled ? 'TTS 켜짐' : 'TTS 꺼짐'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-amber-500/20 pt-3">
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-amber-100">
                공격 시 진동 (Android)
              </div>
              <div className="mt-0.5 text-[11px] font-semibold text-amber-200/75">
                {vibSupport.supportedOnDevice
                  ? '주고받는 데미지에 비례해 타격 진동 강도 자동 조절'
                  : '안드로이드 웹 접속 시 데미지 비례 타격 진동 작동'}
              </div>
            </div>
            <button
              type="button"
              data-testid="toggle-attack-vibration"
              onClick={() => {
                const nextEnabled = !settings.vibrateEnabled;
                hsAudio.playSfx('ui_click', 0.75);
                update({ vibrateEnabled: nextEnabled });
                if (nextEnabled) {
                  hsAudio.previewVibration();
                }
              }}
              className={`min-h-[38px] shrink-0 rounded-lg border px-3.5 py-1.5 text-xs font-extrabold transition ${
                settings.vibrateEnabled
                  ? 'border-emerald-300/60 bg-emerald-800 text-white'
                  : 'border-stone-400/50 bg-stone-800 text-stone-200'
              }`}
            >
              {settings.vibrateEnabled ? '진동 켜짐' : '진동 꺼짐'}
            </button>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-amber-200">
              <span>잔잔한 배경음악 (BGM · 기본 15%)</span>
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
              <span>타격 · 원소 효과음 (SFX)</span>
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
              <span>영웅 성우 음성 (VO)</span>
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

          {/* /game.html 전용 (hero_hs_*) 독립 세이브 백업 · 복원 · 초기화 */}
          <div className="space-y-2 border-t border-amber-500/25 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-yellow-300">
                데이터 백업 · 복원 (카드배틀 전용)
              </span>
              <span className="rounded bg-amber-950/80 px-2 py-0.5 text-[10px] font-bold text-amber-200/80">
                hero_hs_* 독립 저장소
              </span>
            </div>

            {dataNotice && (
              <div
                data-testid="hs-data-notice"
                className="rounded-lg border border-emerald-400/50 bg-emerald-950/80 px-2.5 py-1.5 text-[11px] font-bold text-emerald-200"
              >
                {dataNotice}
              </div>
            )}

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                data-testid="hs-backup-download-btn"
                onClick={() => {
                  hsAudio.playSfx('ui_click', 0.8);
                  hsStorage.downloadGameBackupFile();
                  setDataNotice('✓ 눈히어로 카드배틀 백업 JSON 파일이 저장되었습니다.');
                }}
                className="hs-brass-btn rounded-lg py-2 text-[11px] font-extrabold text-amber-100"
              >
                💾 백업 파일 저장
              </button>
              <button
                type="button"
                data-testid="hs-backup-copy-btn"
                onClick={handleCopyBackup}
                className="hs-brass-btn rounded-lg py-2 text-[11px] font-extrabold text-amber-100"
              >
                📋 백업 코드 복사
              </button>
              <label
                data-testid="hs-restore-file-label"
                className="hs-brass-btn flex cursor-pointer items-center justify-center rounded-lg py-2 text-center text-[11px] font-extrabold text-amber-100"
              >
                <span>📂 파일로 복원</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const content = String(ev.target?.result || '');
                      const res = hsStorage.restoreGameBackupJson(content);
                      setDataNotice(res.message);
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />
              </label>
              <button
                type="button"
                data-testid="hs-restore-paste-btn"
                onClick={handlePasteRestore}
                className="hs-brass-btn rounded-lg py-2 text-[11px] font-extrabold text-amber-100"
              >
                📥 코드 붙여넣기
              </button>
            </div>

            {!confirmReset ? (
              <button
                type="button"
                data-testid="hs-reset-data-btn"
                onClick={() => {
                  hsAudio.playSfx('ui_click', 0.8);
                  setConfirmReset(true);
                }}
                className="mt-1 w-full rounded-lg border border-red-400/50 bg-red-950/60 py-1.5 text-[11px] font-extrabold text-red-200 hover:bg-red-900/70"
              >
                🗑 카드배틀 데이터 초기화 (/game.html 전용)
              </button>
            ) : (
              <div className="mt-1 flex items-center gap-1.5 rounded-lg border border-red-400/70 bg-red-950/90 p-2">
                <span className="flex-1 text-[11px] font-extrabold text-red-100">
                  카드배틀(hero_hs_*) 데이터만 초기화할까요?
                </span>
                <button
                  type="button"
                  data-testid="hs-confirm-reset-btn"
                  onClick={() => {
                    hsAudio.playSfx('ui_click', 0.85);
                    hsStorage.resetGameDataOnly();
                    setConfirmReset(false);
                    setDataNotice('✓ 카드배틀(hero_hs_*) 데이터가 초기 상태로 리셋되었습니다. 화면을 새로고침합니다...');
                    window.location.reload();
                  }}
                  className="rounded bg-red-600 px-2.5 py-1 text-[11px] font-extrabold text-white"
                >
                  초기화
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="rounded bg-stone-700 px-2.5 py-1 text-[11px] font-extrabold text-stone-200"
                >
                  취소
                </button>
              </div>
            )}
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
