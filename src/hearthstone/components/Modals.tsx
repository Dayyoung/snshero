import React, { useEffect, useMemo, useState } from 'react';
import { isAdRemoved } from '../../landing/services/adsenseManager';
import { AudioSettings, hsAudio } from '../audio';
import {
  CLASSIC_RANK_NAMES,
  CLASS_CREST_URL,
  getStarsNeededForRank,
} from '../cardDb';
import {
  CHECKOUT_COUNTRIES,
  CRYPTO_COINS_CATALOG,
  CRYPTO_QUICK_CHIPS,
  GAME_SHOP_PACKAGES,
  GamePaymentReturnResult,
  GameShopPackage,
  launchPayAppCheckout,
  launchPayPalCheckout,
  loadPayAppSdk,
  resolveCryptoDepositDetails,
} from '../paymentGateway';
import { hsStorage } from '../storage';
import {
  CLASSIC_HEROES,
  HERO_CLASS_ORDER,
  PlayerProfile,
  SnsCardBackId,
} from '../types';
import { HsArcaneDustVialIcon, HsGoldCoinIcon } from './CardVisual';
import {
  SNS_CARD_BACK_THEMES,
  SnsBoosterPackArt,
  SnsCardBackArt,
  SnsQuestScrollIcon,
  SnsRankMedallion,
} from './SnsHeroArtKit';

const CARD_BACK_IDS: SnsCardBackId[] = ['gold', 'silver', 'bronze'];

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
                엘윈마을 의뢰 일지
              </h2>
              <p className="text-xs font-semibold text-amber-300/85">
                눈히어로 등급전 전적 · 엘윈마을 일일 의뢰 · 9대 종족 승리 기록
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
              <span className="text-[11px] font-bold text-sky-200/80">영웅 가루</span>
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
          오늘의 엘윈마을 의뢰
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
                  className="whitespace-nowrap text-[10px] font-extrabold"
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

type ShopCheckoutStep = 'catalog' | 'payment' | 'crypto_coin' | 'crypto_chain' | 'crypto_deposit';

export const TavernShopModal: React.FC<{
  onClose: () => void;
  onProfileChanged: () => void;
  onGoOpenPacks: () => void;
}> = ({ onClose, onProfileChanged, onGoOpenPacks }) => {
  const [profile, setProfile] = useState<PlayerProfile>(() => hsStorage.getProfile());
  const [vipAdRemoved, setVipAdRemoved] = useState<boolean>(() => isAdRemoved());
  const [step, setStep] = useState<ShopCheckoutStep>('catalog');
  const [selectedPkg, setSelectedPkg] = useState<GameShopPackage>(GAME_SHOP_PACKAGES[0]);
  const [countryCode, setCountryCode] = useState<string>('ko');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const [coinSearch, setCoinSearch] = useState<string>('');
  const [selectedCoinCcy, setSelectedCoinCcy] = useState<string>('USDT');
  const [selectedChain, setSelectedChain] = useState<string>('USDT-TRC20');
  const [cryptoSecondsLeft, setCryptoSecondsLeft] = useState<number>(600);
  const [copiedAddr, setCopiedAddr] = useState<boolean>(false);
  const [depositCheckMsg, setDepositCheckMsg] = useState<string | null>(null);

  useEffect(() => {
    loadPayAppSdk();
    const sync = () => {
      setProfile(hsStorage.getProfile());
      setVipAdRemoved(isAdRemoved());
    };
    window.addEventListener('snshero:state-changed', sync);
    window.addEventListener('snshero_ad_removed_updated', sync);
    return () => {
      window.removeEventListener('snshero:state-changed', sync);
      window.removeEventListener('snshero_ad_removed_updated', sync);
    };
  }, []);

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

  const handleOpenCheckout = (pkg: GameShopPackage) => {
    hsAudio.playSfx('ui_click');
    setSelectedPkg(pkg);
    setDepositCheckMsg(null);
    setCopiedAddr(false);
    setStep('payment');
  };

  const handleSelectBack = (id: SnsCardBackId) => {
    const p = hsStorage.getProfile();
    p.selectedCardBack = id;
    hsStorage.saveProfile(p);
    hsAudio.playSfx('ui_click');
    setToast(`카드 뒷면이 '${SNS_CARD_BACK_THEMES[id].name}'(으)로 변경되었습니다.`);
    refresh();
  };

  const handlePayAppMethod = async (method: 'card' | 'kakaopay' | 'naverpay' | 'applepay') => {
    setIsProcessing(true);
    try {
      await launchPayAppCheckout(selectedPkg, method);
    } finally {
      setIsProcessing(false);
    }
  };

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
                {step === 'catalog' ? '눈히어로 보급소' : `결제 수단 선택 · ${selectedPkg.name}`}
              </h2>
              <p className="text-xs font-semibold text-amber-300/85">
                미개봉 팩 <b className="text-amber-100">{profile.packs}개</b> · 영웅 가루{' '}
                <b className="text-sky-300">{profile.arcaneDust}</b> · PayPal / 카드 / 간편결제 / 암호화폐
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

        {step === 'catalog' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {GAME_SHOP_PACKAGES.map((pkg) => {
                const isBest = pkg.id === 'pack_5';
                const alreadyOwnedAd = Boolean(pkg.isAdRemoval && vipAdRemoved);
                return (
                  <div
                    key={pkg.id}
                    className={`flex flex-col items-center justify-between rounded-2xl border-2 p-4 ${
                      isBest
                        ? 'border-yellow-300/80 bg-amber-950/40 shadow-[0_0_24px_rgba(250,204,21,0.22)]'
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

                      <div className="my-3 flex flex-col items-center">
                        {pkg.packs > 0 ? (
                          <div className="h-28 w-20">
                            <SnsBoosterPackArt glowing={isBest} />
                          </div>
                        ) : (
                          <div className="flex h-28 w-20 items-center justify-center rounded-2xl border-2 border-[#c8a158] bg-stone-950/90 text-center text-xs font-extrabold text-yellow-300">
                            NO AD
                            <br />
                            VIP
                          </div>
                        )}
                        <div className="hs-title mt-2.5 text-center text-sm font-extrabold text-amber-100">
                          {pkg.name}
                        </div>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="hs-num text-xl text-yellow-300">
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
                      onClick={() => handleOpenCheckout(pkg)}
                      className={`mt-3 w-full rounded-xl py-2.5 text-xs font-extrabold sm:text-sm ${
                        isBest
                          ? 'hs-arcane-btn text-white'
                          : 'hs-brass-btn text-amber-100'
                      }`}
                    >
                      {alreadyOwnedAd
                        ? '광고 제거 적용됨'
                        : `구매하기 ($${pkg.priceUsd.toFixed(2)})`}
                    </button>
                  </div>
                );
              })}
            </div>

            {profile.packs > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoOpenPacks();
                }}
                className="hs-brass-btn w-full rounded-xl py-2.5 text-xs font-extrabold text-sky-200 sm:text-sm"
              >
                눈히어로 팩 개봉하러 가기 ({profile.packs}개 보유) →
              </button>
            )}

            {/* Official 3 SNS HERO Card Back Selector */}
            <div className="rounded-2xl border-2 border-[#c8a158]/50 bg-black/40 p-4">
              <h3 className="hs-title mb-2.5 text-sm font-extrabold text-amber-100">
                눈히어로 공식 카드 뒷면 선택
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
                      className={`flex flex-col items-center rounded-xl border-2 p-2.5 transition ${
                        active
                          ? 'border-yellow-300 bg-amber-900/60 shadow-[0_0_16px_rgba(250,204,21,0.72)]'
                          : 'border-stone-700 bg-stone-900/60 hover:border-amber-500'
                      }`}
                    >
                      <div className="h-24 w-[68px]">
                        <SnsCardBackArt variant={cbId} />
                      </div>
                      <span className="mt-2 text-center text-[11px] font-extrabold leading-tight text-amber-100">
                        {meta.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('catalog')}
                className="hs-brass-btn rounded-xl px-3.5 py-2 text-xs font-extrabold text-amber-100"
              >
                ← 상품 목록으로
              </button>
              <span className="text-xs font-bold text-amber-300/85">안전 결제 게이트웨이</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[#c8a158]/55 bg-black/45 p-4">
              <div>
                <div className="text-[11px] font-bold text-amber-300/80">선택 상품</div>
                <div className="hs-title text-base font-extrabold text-amber-100">
                  {selectedPkg.name}
                </div>
                <div className="text-xs font-semibold text-amber-200/75">{selectedPkg.shortSpec}</div>
              </div>
              <div className="text-right">
                <div className="hs-num text-xl text-yellow-300">
                  ${selectedPkg.priceUsd.toFixed(2)} USD
                </div>
                <div className="text-xs font-bold text-amber-200/85">
                  국내 결제가 {selectedPkg.priceKrw.toLocaleString()}원
                </div>
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-xs font-extrabold text-amber-200">결제 국가 / 통화</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CHECKOUT_COUNTRIES.map((c) => {
                  const active = countryCode === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCountryCode(c.code)}
                      className={`flex min-h-[42px] items-center gap-2 rounded-xl border px-3 text-left text-xs font-extrabold transition ${
                        active
                          ? 'border-yellow-300 bg-amber-900/65 text-yellow-200'
                          : 'border-[#c8a158]/35 bg-black/40 text-amber-100 hover:border-amber-400'
                      }`}
                    >
                      <span>{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => launchPayPalCheckout(selectedPkg)}
                className="hs-arcane-btn flex min-h-[46px] w-full items-center justify-between rounded-xl px-4 text-xs font-extrabold text-white sm:text-sm"
              >
                <span>PayPal 해외/글로벌 결제 (비자 · 마스터 · 아멕스)</span>
                <span className="text-yellow-200">${selectedPkg.priceUsd.toFixed(2)} USD →</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handlePayAppMethod('card')}
                className="hs-brass-btn flex min-h-[46px] w-full items-center justify-between rounded-xl px-4 text-xs font-extrabold text-amber-100 sm:text-sm"
              >
                <span>신용 / 체크카드 결제 (PayApp 안전결제)</span>
                <span className="text-yellow-300">{selectedPkg.priceKrw.toLocaleString()}원 →</span>
              </button>

              {countryCode === 'ko' && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handlePayAppMethod('kakaopay')}
                    className="hs-brass-btn min-h-[44px] rounded-xl px-3 text-xs font-extrabold text-yellow-200"
                  >
                    카카오페이 ({selectedPkg.priceKrw.toLocaleString()}원)
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handlePayAppMethod('naverpay')}
                    className="hs-brass-btn min-h-[44px] rounded-xl px-3 text-xs font-extrabold text-emerald-200"
                  >
                    네이버페이 ({selectedPkg.priceKrw.toLocaleString()}원)
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handlePayAppMethod('applepay')}
                    className="hs-brass-btn min-h-[44px] rounded-xl px-3 text-xs font-extrabold text-amber-100"
                  >
                    Apple Pay ({selectedPkg.priceKrw.toLocaleString()}원)
                  </button>
                </div>
              )}

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => {
                  setCoinSearch('');
                  setStep('crypto_coin');
                }}
                className="hs-brass-btn flex min-h-[46px] w-full items-center justify-between rounded-xl px-4 text-xs font-extrabold text-sky-200 sm:text-sm"
              >
                <span>암호화폐 결제 (USDT · BTC · ETH · SOL · USDC · XRP)</span>
                <span>${selectedPkg.priceUsd.toFixed(2)} 상당 →</span>
              </button>
            </div>
          </div>
        )}

        {step === 'crypto_coin' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('payment')}
                className="hs-brass-btn rounded-xl px-3.5 py-2 text-xs font-extrabold text-amber-100"
              >
                ← 결제 수단으로
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
            확인
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
              <span>엘윈마을 · 전장 배경음악 (BGM)</span>
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
