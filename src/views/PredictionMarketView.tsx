import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, RefreshCw, X, HelpCircle, AlertCircle, 
  CheckCircle2, Gift, History, Calendar, Play, Check, Trophy, ChevronLeft, ChevronRight,
  Sparkles, Zap, Flame, TrendingUp, Award, ArrowUpRight, ArrowRight, Target as TargetIcon
} from 'lucide-react';
import { Language, ViewType } from '../types';
import { t } from '../lib/i18n';
import { cn, getAssetUrl } from '../lib/utils';
import { PageHeader } from '../components/PageHeader';
import { usePredictionMarkets, Market, PredictionBet } from '../hooks/usePredictionMarkets';
import { triggerHaptic } from '../lib/haptic';
import { PredictionBoosterModal } from '../components/PredictionBoosterModal';

interface PredictionMarketViewProps {
  language: Language;
  sns: number;
  updateSns: (amount: number, reason?: string, type?: 'earned' | 'purchased') => void;
  playSfx: (url: string) => void;
  setView: (view: ViewType) => void;
  showCustomAlert?: (title: string, message: string) => void;
  user: any;
  syncUserData?: (data: any) => Promise<void>;
  currentSeason: string;
  lowSpecMode?: boolean;
}

type LiveMatchTab = 'overview' | 'stats' | 'plays';

type LiveMatchModalState = {
  isOpen: boolean;
  market: Market | null;
  loading: boolean;
  error: string | null;
  data: Record<string, any> | null;
  activeTab: LiveMatchTab;
};

export const PredictionMarketView: React.FC<PredictionMarketViewProps> = ({
  language,
  sns,
  updateSns,
  playSfx,
  setView,
  showCustomAlert,
  user,
  syncUserData,
  currentSeason,
  lowSpecMode = false
}) => {
  const {
    markets,
    bets,
    loading,
    error,
    fetchMarkets,
    placeBet,
    resolveBet,
    claimReward
  } = usePredictionMarkets(currentSeason, language);

  // First Bet Reward status from localStorage
  const [hasClaimedFirstBetBonus, setHasClaimedFirstBetBonus] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('hero_prediction_first_bet_reward') === 'true';
  });

  const formatProbabilityPercent = useCallback((price: number): string => {
    const percent = price * 100;
    const rounded = Math.round(percent * 1000) / 1000;
    if (rounded >= 1) {
      return Math.round(rounded) + '%';
    } else if (rounded > 0) {
      return rounded.toFixed(3) + '%';
    }
    return '0%';
  }, []);

  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [betOutcome, setBetOutcome] = useState<'Yes' | 'No'>('Yes');
  const [betAmount, setBetAmount] = useState<number>(50);
  const [localAlert, setLocalAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'markets' | 'bets' | 'stats'>('markets');
  
  // SCR-07-06: Prediction Booster Modal State & Active Booster
  const [isBoosterModalOpen, setIsBoosterModalOpen] = useState(false);
  const [activeBooster, setActiveBooster] = useState<'multiplier' | 'insurance' | null>(null);
  // Dopamine Celebratory Modals
  const [betSuccessModal, setBetSuccessModal] = useState<{
    isOpen: boolean;
    question: string;
    outcome: string;
    amount: number;
    potentialWin: number;
    isFirstBetBonus?: boolean;
  } | null>(null);

  const [claimSuccessModal, setClaimSuccessModal] = useState<{
    isOpen: boolean;
    amount: number;
  } | null>(null);

  const [selectedSportsCategory, setSelectedSportsCategory] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('cat');
      if (cat === 'fifa') return 'FIFA';
    }
    return 'Popular';
  });
  const [resolvingBetId, setResolvingBetId] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (showHelp) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [showHelp]);

  const [helpStep, setHelpStep] = useState(0);
  const [liveMatchModal, setLiveMatchModal] = useState<LiveMatchModalState>({
    isOpen: false,
    market: null,
    loading: false,
    error: null,
    data: null,
    activeTab: 'overview'
  });

  const activeBets = useMemo(() => bets.filter(b => b.status !== 'claimed'), [bets]);

  // SCR-07: 내 예측 베팅 포트폴리오 요약 통계 HUD
  const predictionStats = useMemo(() => {
    const totalBetAmount = bets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const activeCount = activeBets.length;
    const potentialWinning = activeBets.reduce((sum, b) => {
      const odds = b.betPrice > 0 ? (1 / b.betPrice) : 2.0;
      return sum + Math.round(b.amount * odds);
    }, 0);
    const claimedRewards = bets.filter(b => b.status === 'claimed').reduce((sum, b) => sum + (b.amount * 2), 0);
    return { totalBetAmount, activeCount, potentialWinning, claimedRewards };
  }, [bets, activeBets]);

  // SCR-07: 오늘의 하이라이트 핫픽 매치 (Hot Match Pick)
  const hotMatch = useMemo(() => {
    return markets.find(m => m.subCategory === 'Soccer' || m.subCategory === 'FIFA' || m.category === 'FIFA') || markets[0] || null;
  }, [markets]);

  const formatLocalMatchTime = useCallback((iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(undefined, {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    }).format(date);
  }, []);

  const getLiveCompetition = (data: Record<string, any> | null) => {
    return data?.header?.competitions?.[0] || data?.competitions?.[0] || null;
  };

  const getLiveCompetitors = (data: Record<string, any> | null) => {
    const competition = getLiveCompetition(data);
    const competitors = competition?.competitors;
    return Array.isArray(competitors) ? competitors : [];
  };

  const getLiveStatus = (data: Record<string, any> | null) => {
    const competition = getLiveCompetition(data);
    return competition?.status?.type?.shortDetail || competition?.status?.type?.description || competition?.status?.type?.detail || '-';
  };

  const getLivePlays = (data: Record<string, any> | null) => {
    if (!data) return [];
    const plays = Array.isArray(data.plays) ? data.plays : [];
    const currentDrivePlays = Array.isArray(data.drives?.current?.plays) ? data.drives.current.plays : [];
    const previousDrivePlays = Array.isArray(data.drives?.previous)
      ? data.drives.previous.flatMap((drive: any) => Array.isArray(drive.plays) ? drive.plays : [])
      : [];
    return [...plays, ...currentDrivePlays, ...previousDrivePlays].slice(-20).reverse();
  };

  const handleOpenLiveMatch = async (market: Market) => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setLiveMatchModal({ isOpen: true, market, loading: true, error: null, data: null, activeTab: 'overview' });

    const parts = market.id.split('_');
    const isEspnMarket = parts.length >= 4 && parts[0] === 'espn';
    if (!isEspnMarket) {
      setLiveMatchModal(prev => ({
        ...prev,
        loading: false,
        error: language === 'ko' ? '실시간 경기 정보를 가져올 수 없습니다.' : 'Live match information is not available.'
      }));
      return;
    }

    const [, sport, league, eventId] = parts;
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/summary?event=${eventId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLiveMatchModal(prev => ({ ...prev, loading: false, data, error: null }));
    } catch (err) {
      console.error('Failed to fetch live match info:', err);
      setLiveMatchModal(prev => ({
        ...prev,
        loading: false,
        error: language === 'ko' ? '실시간 경기 정보를 불러오지 못했습니다.' : 'Failed to load live match information.'
      }));
    }
  };

  // Trigger alert helper
  const triggerAlert = (type: 'success' | 'error', text: string) => {
    if (showCustomAlert) {
      showCustomAlert(type === 'success' ? (language === 'ko' ? '성공' : 'SUCCESS') : (language === 'ko' ? '오류' : 'ERROR'), text);
    } else {
      setLocalAlert({ type, text });
      setTimeout(() => setLocalAlert(null), 4000);
    }
  };

  const handleOpenBetModal = (market: Market, outcome: 'Yes' | 'No') => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setSelectedMarket(market);
    setBetOutcome(outcome);
    setBetAmount(Math.min(sns, 50));
    setLocalAlert(null);
  };

  const handlePlaceBet = async () => {
    if (!selectedMarket) return;
    if (betAmount <= 0) {
      triggerAlert('error', language === 'ko' ? '올바른 배팅 금액을 입력해주세요.' : 'Please enter a valid bet amount.');
      return;
    }
    if (sns < betAmount) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      triggerAlert('error', language === 'ko' ? 'SNS 포인트가 부족합니다.' : 'Insufficient SNS points.');
      return;
    }

    const priceIndex = betOutcome === 'Yes' ? 0 : 1;
    const betPrice = selectedMarket.outcomePrices[priceIndex];

    // Deduct SNS
    const reason = `${selectedMarket.question} (${betOutcome}) ${t('bet_amount', language)}: ${betAmount} SNS`;
    updateSns(-betAmount, reason);

    // Place bet in local hook/storage
    placeBet(selectedMarket.id, selectedMarket.question, betOutcome, betAmount, betPrice);

    triggerHaptic('victory');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');

    // SCR-07 FTUE: 첫 예측 배팅 시 +30 SNS 웰컴 캐시백 즉시 지급
    let isFirstBonus = false;
    if (!hasClaimedFirstBetBonus) {
      localStorage.setItem('hero_prediction_first_bet_reward', 'true');
      setHasClaimedFirstBetBonus(true);
      updateSns(30, language === 'ko' ? '첫 승부 예측 베팅 웰컴 캐시백' : 'First Prediction Bet Welcome Cashback', 'earned');
      isFirstBonus = true;
    }

    const potentialWin = Math.round(betAmount / (betPrice > 0 ? betPrice : 0.5));
    setBetSuccessModal({
      isOpen: true,
      question: selectedMarket.question,
      outcome: betOutcome,
      amount: betAmount,
      potentialWin,
      isFirstBetBonus: isFirstBonus
    });

    // Sync to Cloud Firestore if user is not guest
    if (user && user.uid !== 'guest-id' && syncUserData) {
      try {
        await syncUserData({
          sns: sns - betAmount + (isFirstBonus ? 30 : 0)
        });
      } catch (err) {
        console.error('Failed to sync user data after placing bet:', err);
      }
    }

    setSelectedMarket(null);
  };

  const hasPlacedEventBet = useMemo(() => {
    if (!selectedMarket) return false;
    return bets.some(b => b.marketId === selectedMarket.id && b.isEventBet === true);
  }, [bets, selectedMarket]);

  const handlePlaceEventBet = async () => {
    if (!selectedMarket) return;
    if (hasPlacedEventBet) {
      triggerAlert('error', language === 'ko' ? '이미 이 경기에 이벤트 배팅을 완료했습니다.' : 'You have already placed an event bet on this match.');
      return;
    }

    const priceIndex = betOutcome === 'Yes' ? 0 : 1;
    const betPrice = selectedMarket.outcomePrices[priceIndex];

    // Place bet with amount = 1000 and isEventBet = true
    placeBet(selectedMarket.id, selectedMarket.question, betOutcome, 1000, betPrice, true);

    playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
    triggerAlert('success', language === 'ko' ? '이벤트 1000 SNS 배팅이 완료되었습니다!' : 'Event 1000 SNS bet placed successfully!');

    setSelectedMarket(null);
  };

  const handleResolveBet = async (betId: string) => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    setResolvingBetId(betId);
    
    try {
      const result = await resolveBet(betId, true);
      
      if (result.error) {
        triggerAlert('error', result.error);
      } else if (result.status === 'win') {
        triggerHaptic('victory');
        playSfx('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'); // win fanfare
        const rewardAmount = result.rewardAmount || 0;
        if (rewardAmount > 0) {
          updateSns(rewardAmount, `Prediction Reward auto claim`);
          setClaimSuccessModal({ isOpen: true, amount: rewardAmount });
          const successMsg = t('bet_claim_success', language).replace('{amount}', String(rewardAmount));
          triggerAlert('success', successMsg);

          if (user && user.uid !== 'guest-id' && syncUserData) {
            try {
              await syncUserData({
                sns: sns + rewardAmount
              });
            } catch (err) {
              console.error('Failed to sync user data after auto reward claim:', err);
            }
          }
        } else {
          triggerAlert('success', language === 'ko' ? '예측 성공! 보상이 자동 수령되었습니다.' : 'Prediction successful! Reward claimed automatically.');
        }
      } else if (result.status === 'loss') {
        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'); // fail sound
        triggerAlert('error', t('bet_loss_msg', language));
      }
    } catch (err) {
      triggerAlert('error', language === 'ko' ? '정산 처리 중 오류가 발생했습니다.' : 'An error occurred during settlement check.');
    } finally {
      setResolvingBetId(null);
    }
  };

  const handleClaimReward = async (betId: string) => {
    triggerHaptic('victory');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3');
    
    const rewardAmount = claimReward(betId);
    if (rewardAmount > 0) {
      updateSns(rewardAmount, `Prediction Reward claim`);
      setClaimSuccessModal({ isOpen: true, amount: rewardAmount });
      
      const successMsg = t('bet_claim_success', language).replace('{amount}', String(rewardAmount));
      triggerAlert('success', successMsg);

      // Sync to Cloud Firestore if user is not guest
      if (user && user.uid !== 'guest-id' && syncUserData) {
        try {
          await syncUserData({
            sns: sns + rewardAmount
          });
        } catch (err) {
          console.error('Failed to sync user data after reward claim:', err);
        }
      }
    }
  };

  // Dynamic categories list based on fetched markets
  const sportsTabs = useMemo(() => {
    const defaultTabs = [
      { id: 'Popular', label: t('tab_popular', language) },
      { id: 'All', label: t('tab_all', language) },
    ];
    
    const uniqueCategories = Array.from(new Set(markets.map(m => m.subCategory)))
      .filter(Boolean)
      .sort((a, b) => String(a).localeCompare(String(b))) as string[];
      
    const getTabLabel = (cat: string): string => {
      const market = markets.find(m => m.subCategory === cat);
      if (market && market.category) return market.category;

      if (cat === 'Soccer') return t('tab_soccer', language);
      if (cat === 'Baseball') return t('tab_baseball', language);
      if (cat === 'Basketball') return t('tab_basketball', language);
      if (cat === 'NFL') return t('tab_nfl', language);
      if (cat === 'MMA') return t('tab_mma', language);
      if (cat === 'Politics') return t('tab_politics', language);
      if (cat === 'Other') return t('tab_other', language);
      return cat;
    };

    const dynamicTabs = uniqueCategories.map(cat => ({
      id: cat,
      label: getTabLabel(cat)
    }));
    
    return [...defaultTabs, ...dynamicTabs];
  }, [markets, language]);

  // Filtering matches based on tab
  const filteredMarkets = useMemo(() => {
    if (selectedSportsCategory === 'All') return markets;
    if (selectedSportsCategory === 'Popular') {
      return markets.slice(0, 15);
    }
    return markets.filter(m => m.subCategory === selectedSportsCategory);
  }, [markets, selectedSportsCategory]);

  return (
    <div className="flex-1 flex flex-col w-full bg-slate-50/50 text-slate-800 font-sans overflow-y-auto pb-32">
      <div className="max-w-4xl mx-auto w-full px-4 flex flex-col gap-4 pt-2">
        {/* Top Header Bar with Balance HUD */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <PageHeader title={t('prediction_market', language)} />
            <button
              onClick={() => { setShowHelp(true); setHelpStep(0); }}
              className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Help"
            >
              <HelpCircle size={16} className="text-slate-500" />
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Realtime SNS Balance HUD */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-400/40 rounded-sm font-mono text-xs text-amber-900 font-bold shadow-2xs">
              <Coins size={14} className="text-amber-500 fill-amber-400" />
              <span>{sns.toLocaleString()} SNS</span>
            </div>

            {/* Shop Shortcut */}
            <button
              onClick={() => setView('shop')}
              className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-stone-950 font-mono text-xs font-black rounded-sm flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 border border-amber-300"
              title="상점으로 이동하여 SNS 코인 충전"
            >
              <Zap size={13} className="fill-current" />
              <span className="hidden xs:inline">{language === 'ko' ? '충전' : 'Shop'}</span>
              <ArrowUpRight size={13} />
            </button>

            {/* Refresh Markets */}
            <button 
              onClick={fetchMarkets}
              className="w-9 h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-sm active:scale-95 transition-all cursor-pointer shadow-xs flex items-center justify-center"
              title={t('refresh', language)}
              aria-label={t('refresh', language)}
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* SCR-07 FTUE: 내 예측 베팅 포트폴리오 요약 HUD */}
        <div className="bg-white border border-slate-200/80 rounded-sm p-3.5 shadow-xs font-mono">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
            <div className="flex items-center gap-1.5 font-black text-xs text-slate-800">
              <TargetIcon className="text-indigo-600" size={15} />
              <span>{language === 'ko' ? '[🎯 내 예측 베팅 포트폴리오 HUD]' : '[🎯 PREDICTION PORTFOLIO HUD]'}</span>
            </div>
            {!hasClaimedFirstBetBonus && (
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-800 border border-amber-400/50 px-2 py-0.5 rounded-sm animate-pulse flex items-center gap-1">
                <Gift size={11} className="text-amber-600" />
                <span>{language === 'ko' ? '첫 베팅 시 +30 SNS 캐시백' : '+30 SNS First Bet Cashback'}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 border border-slate-150 p-2 rounded-sm">
              <p className="text-[9px] text-slate-400 uppercase">{language === 'ko' ? '누적 베팅액' : 'Total Bet'}</p>
              <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 truncate">
                {predictionStats.totalBetAmount.toLocaleString()} <span className="text-[9px] font-normal text-slate-500">SNS</span>
              </p>
            </div>
            <div className="bg-indigo-50/50 border border-indigo-150 p-2 rounded-sm">
              <p className="text-[9px] text-indigo-500 uppercase">{language === 'ko' ? '진행 중 베팅' : 'Active Bets'}</p>
              <p className="text-xs sm:text-sm font-black text-indigo-700 mt-0.5">
                {predictionStats.activeCount} <span className="text-[9px] font-normal text-indigo-400">{language === 'ko' ? '건' : 'bets'}</span>
              </p>
            </div>
            <div className="bg-emerald-50/50 border border-emerald-150 p-2 rounded-sm">
              <p className="text-[9px] text-emerald-600 uppercase">{language === 'ko' ? '최대 예상 당첨금' : 'Est. Max Win'}</p>
              <p className="text-xs sm:text-sm font-black text-emerald-700 mt-0.5 truncate">
                +{predictionStats.potentialWinning.toLocaleString()} <span className="text-[9px] font-normal text-emerald-500">SNS</span>
              </p>
            </div>
          </div>
        </div>

        {/* SCR-07 모바일 원터치 서브 탭바 */}
        <div className="bg-slate-200/60 p-1 rounded-sm flex items-center gap-1 font-mono text-xs select-none">
          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              setActiveTab('markets');
            }}
            className={cn(
              "flex-1 min-h-[44px] py-2 px-2 text-center font-black rounded-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-target",
              activeTab === 'markets' 
                ? "bg-white text-slate-950 shadow-xs border border-slate-300/80" 
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Flame size={14} className={activeTab === 'markets' ? "text-orange-500 fill-orange-500" : "text-slate-400"} />
            <span>{language === 'ko' ? '실시간 경기 예측' : 'Live Matches'}</span>
          </button>

          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              setActiveTab('bets');
            }}
            className={cn(
              "flex-1 min-h-[44px] py-2 px-2 text-center font-black rounded-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-target",
              activeTab === 'bets' 
                ? "bg-white text-slate-950 shadow-xs border border-slate-300/80" 
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <History size={14} className={activeTab === 'bets' ? "text-indigo-600" : "text-slate-400"} />
            <span>{language === 'ko' ? '내 베팅 목록' : 'My Bets'}</span>
            <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded-xs font-mono">
              {activeBets.length}
            </span>
          </button>

          <button
            onClick={() => {
              playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
              setActiveTab('stats');
            }}
            className={cn(
              "flex-1 min-h-[44px] py-2 px-2 text-center font-black rounded-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-target",
              activeTab === 'stats' 
                ? "bg-white text-slate-950 shadow-xs border border-slate-300/80" 
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Trophy size={14} className={activeTab === 'stats' ? "text-amber-500" : "text-slate-400"} />
            <span>{language === 'ko' ? '베팅 전적 & 정산' : 'History & Stats'}</span>
          </button>
        </div>

        {/* SCR-07: 오늘의 하이라이트 핫픽 추천 매치 배너 (Hot Match Pick) */}
        {activeTab === 'markets' && hotMatch && (
          <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-indigo-500/10 border border-orange-400/40 rounded-sm p-3.5 shadow-xs font-mono">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-orange-950 dark:text-orange-300">
                <Flame size={15} className="text-orange-500 fill-orange-500 animate-pulse" />
                <span>{language === 'ko' ? '[🔥 오늘의 추천 핫픽 승부처]' : '[🔥 TODAY HOT MATCH PICK]'}</span>
              </div>
              <span className="text-[10px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-xs">
                HOT ODDS
              </span>
            </div>
            
            <p className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 mb-3">
              {hotMatch.question}
            </p>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenBetModal(hotMatch, 'Yes')}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 touch-target"
                >
                  <span>YES {formatProbabilityPercent(hotMatch.outcomePrices[0])}</span>
                </button>
                <button
                  onClick={() => handleOpenBetModal(hotMatch, 'No')}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-sm flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 touch-target"
                >
                  <span>NO {formatProbabilityPercent(hotMatch.outcomePrices[1])}</span>
                </button>
              </div>

              {hotMatch.liveUrl && (
                <button
                  onClick={() => handleOpenLiveMatch(hotMatch)}
                  className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-sm flex items-center gap-1 cursor-pointer active:scale-95 touch-target shrink-0"
                >
                  <Play size={11} className="fill-current" />
                  <span>LIVE</span>
                </button>
              )}
            </div>
          </div>
        )}

      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-6 w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Main Column: Sports Matches */}
        <div className={cn(
          "lg:col-span-2 space-y-4",
          activeTab !== 'markets' ? 'hidden lg:block' : 'block'
        )}>
          {/* Subcategory filter tab list */}
          <div className="flex gap-2 overflow-x-auto pb-2.5 scrollbar-none select-none border-b border-slate-100 mb-2">
            {sportsTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  setSelectedSportsCategory(tab.id);
                }}
                className={cn(
                  "min-h-11 px-3.5 py-2 border rounded-lg font-bold text-[10px] uppercase shrink-0 transition-all active:scale-95 cursor-pointer shadow-sm touch-target flex items-center justify-center gap-1",
                  selectedSportsCategory === tab.id
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                )}
              >
                <span>{tab.label}</span>
                {tab.id === 'FIFA' && (
                  <span className="text-[7.5px] font-black tracking-wider bg-rose-500 text-white px-1.5 py-0.5 rounded-sm uppercase">
                    EVENT
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="animate-spin text-indigo-600" size={32} />
            </div>
          ) : filteredMarkets.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-lg p-12 text-center text-slate-400 bg-slate-50/50">
              <HelpCircle size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-bold uppercase">{language === 'ko' ? '해당 카테고리에 진행 중인 경기가 없습니다.' : 'No active matches in this category.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMarkets.map((market) => (
                <div 
                  key={market.id}
                  className="bg-white border border-slate-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Live Match & Question */}
                    <div className="flex flex-col gap-1 mb-2">
                      {market.liveUrl && (
                        <button
                          onClick={() => handleOpenLiveMatch(market)}
                          className="mt-2 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
                        >
                          <Play size={11} className="fill-current" />
                          {t('live_match_view', language)}
                        </button>
                      )}
                    </div>

                    {/* Question */}
                    <div className="flex items-center gap-2.5 mb-4 min-h-[40px]">
                      {market.image ? (
                        <img 
                          src={market.image} 
                          alt="team logo" 
                          className="w-10 h-10 rounded-full border border-slate-100 bg-white object-contain p-0.5 shadow-xs shrink-0" 
                        />
                      ) : null}
                      <h4 className="font-bold text-slate-800 text-xs leading-snug flex-1">
                        {market.question}
                      </h4>
                    </div>
                  </div>

                  {/* Bet Odds buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => handleOpenBetModal(market, 'Yes')}
                      className="py-1.5 px-2 border border-emerald-100 bg-emerald-50/20 hover:bg-emerald-50/50 text-emerald-800 font-bold rounded-2xl active:scale-95 transition-all flex items-center justify-between cursor-pointer shadow-xs w-full min-w-0"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 shrink">
                        <span className="text-[9px] text-emerald-700 font-bold uppercase whitespace-nowrap">{t('bet_yes', language)}</span>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-850 whitespace-nowrap shrink-0 ml-1.5">{formatProbabilityPercent(market.outcomePrices[0])}</span>
                    </button>
                    <button
                      onClick={() => handleOpenBetModal(market, 'No')}
                      className="py-1.5 px-2 border border-rose-100 bg-rose-50/20 hover:bg-rose-50/50 text-rose-800 font-bold rounded-2xl active:scale-95 transition-all flex items-center justify-between cursor-pointer shadow-xs w-full min-w-0"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 shrink">
                        <span className="text-[9px] text-rose-700 font-bold uppercase whitespace-nowrap">{t('bet_no', language)}</span>
                      </div>
                      <span className="text-xs font-extrabold text-rose-850 whitespace-nowrap shrink-0 ml-1.5">{formatProbabilityPercent(market.outcomePrices[1])}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right/Secondary Column: My Bets Log */}
        <div className={cn(
          "lg:col-span-1 space-y-4",
          activeTab !== 'bets' ? 'hidden lg:block' : 'block'
        )}>
          <div className="flex items-center justify-end pb-2 border-b border-slate-100 mb-2">
            <button
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                setShowHistoryModal(true);
              }}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0"
            >
              {language === 'ko' ? '전체기록' : 'ALL HISTORY'}
            </button>
          </div>

          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            {activeBets.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400 bg-slate-50/50">
                <HelpCircle size={32} className="mx-auto mb-2 text-slate-300 animate-pulse" />
                <p className="text-xs font-bold uppercase">{t('no_active_predictions', language)}</p>
              </div>
            ) : (
              activeBets.map((bet) => {
                const betPricePercent = formatProbabilityPercent(bet.betPrice);
                const payoutAmount = Math.round(bet.amount / (bet.betPrice > 0 ? bet.betPrice : 0.5));
                const isResolving = resolvingBetId === bet.betId;
                
                return (
                  <div 
                    key={bet.betId}
                    className="bg-white border border-slate-100 rounded-3xl p-4 shadow-md space-y-3"
                  >
                    {/* Header: Date and Option */}
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 border-b border-slate-100 pb-1.5">
                      <span className="flex items-center gap-1 font-semibold">
                        <Calendar size={10} />
                        {new Date(bet.timestamp).toLocaleDateString()}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg uppercase font-bold text-[9px] shadow-xs",
                        bet.outcome === 'Yes' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      )}>
                        {t('my_bets', language)}: {bet.outcome} ({betPricePercent}%)
                      </span>
                    </div>

                    {/* Question */}
                    <p className="text-xs font-bold text-slate-800 leading-snug">
                      {bet.question}
                    </p>

                    {/* Bet amounts */}
                    <div className="flex justify-between items-center text-xs font-semibold bg-slate-50 border border-slate-100 p-2.5 rounded-2xl shadow-inner">
                      <span className="font-bold text-slate-800">{bet.amount} SNS</span>
                      <span className="font-bold text-indigo-600">+{payoutAmount} SNS</span>
                    </div>

                    {/* Action buttons based on status */}
                    <div className="flex items-center justify-between pt-1">
                      {bet.status === 'pending' && (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] text-amber-600 bg-amber-50/50 rounded-full px-2.5 py-1 font-bold uppercase shadow-xs">
                            {t('pending', language)}
                          </span>
                          <button
                            onClick={() => handleResolveBet(bet.betId)}
                            disabled={isResolving}
                            className="px-3.5 py-2 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-bold rounded-2xl active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                          >
                            {isResolving ? (
                              <RefreshCw size={10} className="animate-spin" />
                            ) : (
                              <Play size={10} className="fill-white" />
                            )}
                            {isResolving 
                              ? (language === 'ko' ? '확인 중...' : 'Checking...') 
                              : t('check_result', language)}
                          </button>
                        </div>
                      )}

                      {bet.status === 'win' && (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] text-emerald-600 bg-emerald-50/50 rounded-full px-2.5 py-1 font-bold uppercase flex items-center gap-1 shadow-xs">
                            <Trophy size={10} />
                            {t('win', language)}
                          </span>
                          <button
                            onClick={() => handleClaimReward(bet.betId)}
                            className="px-3.5 py-2 bg-gradient-to-r from-yellow-400 to-amber-400 text-amber-950 text-[10px] font-bold rounded-2xl active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <Gift size={10} />
                            {t('claim_reward', language)}
                          </button>
                        </div>
                      )}

                      {bet.status === 'loss' && (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] text-rose-600 bg-rose-50/50 rounded-full px-2.5 py-1 font-bold uppercase shadow-xs">
                            {t('loss', language)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {language === 'ko' ? '결과: ' : 'Outcome: '}{bet.resolvedOutcome}
                          </span>
                        </div>
                      )}

                      {bet.status === 'claimed' && (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] text-indigo-650 bg-indigo-50/50 rounded-full px-2.5 py-1 font-bold uppercase flex items-center gap-1 shadow-xs">
                            <Check size={10} />
                            {t('claimed', language)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            +{payoutAmount} SNS Claimed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SCR-07: Stats & Settlement Panel */}
        {activeTab === 'stats' && (
          <div className="lg:col-span-3 space-y-4 font-mono">
            <div className="bg-white border border-slate-200/80 rounded-sm p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                  <Trophy className="text-amber-500" size={16} />
                  <span>{language === 'ko' ? '[🏆 내 예측 전적 & 승률 리포트]' : '[🏆 PREDICTION RECORD & WIN RATE]'}</span>
                </div>
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                >
                  {language === 'ko' ? '전체 히스토리 보기 ↗' : 'View Full History ↗'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-sm">
                  <p className="text-[10px] text-slate-500 uppercase">{language === 'ko' ? '총 베팅' : 'Total Bets'}</p>
                  <p className="text-base font-black text-slate-900 mt-1">{bets.length}건</p>
                </div>
                <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-sm">
                  <p className="text-[10px] text-emerald-700 uppercase">{language === 'ko' ? '적중 (당첨)' : 'Wins'}</p>
                  <p className="text-base font-black text-emerald-800 mt-1">
                    {bets.filter(b => b.status === 'win' || b.status === 'claimed').length}건
                  </p>
                </div>
                <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-sm">
                  <p className="text-[10px] text-rose-700 uppercase">{language === 'ko' ? '미적중 (패배)' : 'Losses'}</p>
                  <p className="text-base font-black text-rose-800 mt-1">
                    {bets.filter(b => b.status === 'loss').length}건
                  </p>
                </div>
                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-sm">
                  <p className="text-[10px] text-amber-700 uppercase">{language === 'ko' ? '적중 승률' : 'Win Rate'}</p>
                  <p className="text-base font-black text-amber-900 mt-1">
                    {(() => {
                      const wins = bets.filter(b => b.status === 'win' || b.status === 'claimed').length;
                      const losses = bets.filter(b => b.status === 'loss').length;
                      const total = wins + losses;
                      return total > 0 ? Math.round((wins / total) * 100) : 0;
                    })()}%
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-1.5 text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800 flex items-center gap-1">
                  <Sparkles size={13} className="text-indigo-600" />
                  <span>{language === 'ko' ? '승부 예측 및 2.5배 배당 팁' : 'Prediction & Odds Tips'}</span>
                </p>
                <p>• {language === 'ko' ? '배당률(Odds)이 낮은 Topdog 선택 시 안정적인 당첨, Underdog 역배당 선택 시 최대 5배+의 고수익 배당을 획득합니다.' : 'Bet on Topdog for higher chance, or Underdog for massive 5x+ payout.'}</p>
                <p>• {language === 'ko' ? '경기 종료 후 [결과 확인] 버튼을 누르면 실시간 경기 결과 판정 후 즉시 정산됩니다.' : 'Tap [Check Result] after match ends to settle rewards instantly.'}</p>
              </div>
            </div>
          </div>
        )}

      </div>
      </div>

      {/* Betting Modal (Yes/No placement popup) */}
      <AnimatePresence>
        {selectedMarket && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          >
            <div className="absolute inset-0" onClick={() => setSelectedMarket(null)} />
            
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border border-slate-100 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative z-10 font-sans"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Coins size={18} className="text-yellow-400" />
                  <span className="font-bold uppercase tracking-wider text-sm">
                    {t('place_bet', language)}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedMarket(null)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                
                {/* Question Details */}
                <div className="border border-slate-100 p-4 bg-slate-50 rounded-2xl space-y-1">
                  <span className="text-[9px] font-bold text-indigo-650 tracking-wider uppercase block">
                    {selectedMarket.subCategory} MATCH
                  </span>
                  <h3 className="font-bold text-slate-850 text-xs leading-snug">
                    {selectedMarket.question}
                  </h3>
                </div>

                {/* Outcome badge selection */}
                <div className="flex items-center justify-between py-2 px-3 border border-slate-150 rounded-2xl bg-slate-50">
                  <span className="text-xs font-semibold text-slate-400">{language === 'ko' ? '예측 선택' : 'Prediction'}</span>
                  <div className="flex items-center gap-2">
                    <img 
                      src={
                        (betOutcome === 'Yes' && selectedMarket.outcomePrices[0] >= selectedMarket.outcomePrices[1]) ||
                        (betOutcome === 'No' && selectedMarket.outcomePrices[1] > selectedMarket.outcomePrices[0])
                          ? getAssetUrl("/topdog.png")
                          : getAssetUrl("/underdog.png")
                      }
                      alt="dog-badge"
                      className="w-6 h-6 rounded-full border border-white/20 shadow-xs"
                    />
                    <span className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase text-center shadow-xs flex items-center gap-1.5",
                      betOutcome === 'Yes' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                    )}>
                      {betOutcome === 'Yes' ? t('bet_yes', language) : t('bet_no', language)}
                      <span className="text-[9px] opacity-90">
                        ({(betOutcome === 'Yes' && selectedMarket.outcomePrices[0] >= selectedMarket.outcomePrices[1]) ||
                        (betOutcome === 'No' && selectedMarket.outcomePrices[1] > selectedMarket.outcomePrices[0])
                          ? t('topdog', language)
                          : t('underdog', language)})
                      </span>
                    </span>
                  </div>
                </div>

                {/* Bet amount selector */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-400">{t('bet_amount', language)} (SNS)</label>
                    <span className="text-[10px] font-bold text-slate-400">Bal: {sns.toLocaleString()} SNS</span>
                  </div>
                  <div className="flex items-center justify-between border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <button 
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                        setBetAmount(prev => Math.max(10, prev - 10));
                      }}
                      className="px-3.5 py-2 bg-slate-50 border-r border-slate-200 hover:bg-slate-100 font-bold cursor-pointer text-slate-500"
                    >
                      -10
                    </button>
                    <input 
                      type="number"
                      value={betAmount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setBetAmount(isNaN(val) ? 0 : val);
                      }}
                      className="w-20 text-center font-bold text-slate-800 bg-transparent outline-none py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button 
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        setBetAmount(prev => Math.min(sns, prev + 10));
                      }}
                      className="px-3.5 py-2 bg-slate-50 border-l border-slate-200 hover:bg-slate-100 font-bold cursor-pointer text-slate-500"
                    >
                      +10
                    </button>
                  </div>

                  {/* Quick select keys: 44px+ mobile touch targets */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1 font-mono">
                    {[10, 50, 100].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                          setBetAmount(val);
                        }}
                        className={cn(
                          "min-h-[44px] py-2 border rounded-xl text-xs font-bold text-center cursor-pointer shadow-xs transition-colors touch-target",
                          betAmount === val 
                            ? "bg-indigo-600 border-indigo-700 text-white" 
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        +{val}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        setBetAmount(sns);
                      }}
                      className="min-h-[44px] py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl text-center cursor-pointer shadow-xs transition-colors touch-target"
                    >
                      MAX
                    </button>
                  </div>

                  {/* Insufficient balance top-up prompt */}
                  {sns < betAmount && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs font-mono">
                      <span className="text-rose-700 text-[11px] font-bold">
                        {language === 'ko' ? '잔액 부족' : 'Low balance'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMarket(null);
                          setView('shop');
                        }}
                        className="text-indigo-600 hover:text-indigo-800 text-[11px] font-black underline cursor-pointer flex items-center gap-0.5"
                      >
                        <span>{language === 'ko' ? '상점에서 SNS 충전 ↗' : 'Top up in Shop ↗'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* SCR-07-06: Prediction Booster Selector */}
                <div className="p-2.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-indigo-300 font-bold flex items-center gap-1">
                      <Zap size={13} className="text-amber-400" />
                      {language === 'ko' ? '베팅 부스터' : 'Bet Booster'}
                    </span>
                    {activeBooster ? (
                      <button
                        type="button"
                        onClick={() => setActiveBooster(null)}
                        className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                      >
                        [{language === 'ko' ? '해제' : 'Remove'}]
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsBoosterModalOpen(true)}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                      >
                        [{language === 'ko' ? '+ 부스터 선택' : '+ Select Booster'}]
                      </button>
                    )}
                  </div>
                  {activeBooster === 'multiplier' && (
                    <div className="text-[11px] text-amber-300 font-bold bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
                      ⚡ {language === 'ko' ? '1.5배 슈퍼 배당률 부스터 활성화!' : '1.5x Super Multiplier Booster Active!'}
                    </div>
                  )}
                  {activeBooster === 'insurance' && (
                    <div className="text-[11px] text-sky-300 font-bold bg-sky-500/10 px-2 py-1 rounded border border-sky-500/30">
                      🛡️ {language === 'ko' ? '50% 원금 페이백 보험 활성화!' : '50% Principal Payback Insurance Active!'}
                    </div>
                  )}
                </div>

                {/* Estimate output summary */}
                <div className="space-y-1.5 text-xs font-semibold text-slate-700 border-t border-slate-150 pt-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{language === 'ko' ? '예측 확률' : 'Prediction Probability'}:</span>
                    <span>
                      {formatProbabilityPercent(betOutcome === 'Yes' ? selectedMarket.outcomePrices[0] : selectedMarket.outcomePrices[1])}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-850 border-t border-slate-100 pt-2">
                    <span>{language === 'ko' ? '예상 보상 금액' : 'Est. Reward'}:</span>
                    <span className="text-indigo-650 font-bold">
                      +{Math.round((betAmount / (betOutcome === 'Yes' ? selectedMarket.outcomePrices[0] : selectedMarket.outcomePrices[1])) * (activeBooster === 'multiplier' ? 1.5 : 1)).toLocaleString()} SNS
                      {activeBooster === 'multiplier' && <span className="text-[10px] text-amber-500 ml-1">(+50% 부스트)</span>}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <div className="space-y-2.5">
                  <button
                    onClick={handlePlaceBet}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-605 text-white font-bold uppercase rounded-2xl active:scale-95 transition-all text-sm cursor-pointer shadow-md"
                  >
                    {t('place_bet', language)}
                  </button>
                  {selectedMarket.category === 'FIFA' && (
                    <button
                      onClick={handlePlaceEventBet}
                      disabled={hasPlacedEventBet}
                      className={cn(
                        "w-full py-3 text-white font-bold uppercase rounded-2xl transition-all text-sm cursor-pointer shadow-md flex items-center justify-center gap-1.5",
                        hasPlacedEventBet 
                          ? "bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-200 shadow-none"
                          : "bg-gradient-to-r from-rose-500 to-red-650 hover:from-rose-600 hover:to-red-700 active:scale-95"
                      )}
                    >
                      {hasPlacedEventBet 
                        ? (language === 'ko' ? '이벤트 배팅 완료' : 'EVENT BET PLACED')
                        : (language === 'ko' ? '이벤트 1000 SNS 배팅하기' : 'PLACE EVENT 1000 SNS BET')}
                    </button>
                  )}
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Local Alert Fallback Banner */}
      {/* Live Match Modal */}
      <AnimatePresence>
        {liveMatchModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setLiveMatchModal(prev => ({ ...prev, isOpen: false }))} />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-950 text-white w-full max-w-2xl max-h-[88vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative flex flex-col z-[1001]"
            >
              <div className="p-5 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300 flex items-center gap-2">
                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    {t('live_match_view', language)}
                  </p>
                  <h2 className="text-sm sm:text-base font-black mt-1 truncate">
                    {liveMatchModal.market?.question || t('live_match_title', language)}
                  </h2>
                </div>
                <button
                  onClick={() => setLiveMatchModal(prev => ({ ...prev, isOpen: false }))}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {liveMatchModal.loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="animate-spin text-indigo-300" size={32} />
                  <p className="text-xs font-bold text-slate-400 uppercase">{t('live_match_loading', language)}</p>
                </div>
              ) : liveMatchModal.error ? (
                <div className="py-20 px-6 text-center text-slate-300">
                  <AlertCircle size={34} className="mx-auto mb-3 text-rose-400" />
                  <p className="text-sm font-bold">{liveMatchModal.error}</p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-white/10 bg-slate-900/80 shrink-0">
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                      {getLiveCompetitors(liveMatchModal.data).map((competitor: any, idx: number) => (
                        <div key={competitor.id || idx} className={cn("flex flex-col items-center text-center gap-2", idx === 0 ? "order-1" : "order-3")}>
                          {competitor.team?.logo && (
                            <img src={competitor.team.logo} alt="team" className="w-14 h-14 rounded-full bg-white object-contain p-1 shadow-lg" />
                          )}
                          <span className="text-xs font-black leading-tight line-clamp-2">{competitor.team?.displayName || competitor.team?.name || '-'}</span>
                          <span className="text-3xl font-black tabular-nums text-white">{competitor.score ?? '-'}</span>
                        </div>
                      ))}
                      <div className="order-2 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black px-2 py-1 rounded-full bg-rose-500/20 text-rose-200 border border-rose-400/20 uppercase">
                          {getLiveStatus(liveMatchModal.data)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">VS</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 px-4 pt-4 bg-slate-950 shrink-0 overflow-x-auto scrollbar-none">
                    {(['overview', 'stats', 'plays'] as LiveMatchTab[]).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setLiveMatchModal(prev => ({ ...prev, activeTab: tab }))}
                        className={cn(
                          "px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shrink-0",
                          liveMatchModal.activeTab === tab
                            ? "bg-indigo-500 text-white"
                            : "bg-slate-900 text-slate-400 hover:text-white"
                        )}
                      >
                        {tab === 'overview' ? t('live_match_overview', language) : tab === 'stats' ? t('live_match_stats', language) : t('live_match_plays', language)}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {liveMatchModal.activeTab === 'overview' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">{t('live_match_status', language)}</p>
                          <p className="text-sm font-bold text-slate-100">{getLiveStatus(liveMatchModal.data)}</p>
                        </div>
                        <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">{t('match_start_time', language)}</p>
                          <p className="text-sm font-bold text-slate-100">
                            {formatLocalMatchTime(liveMatchModal.market?.startDateTime || getLiveCompetition(liveMatchModal.data)?.date) || '-'}
                          </p>
                        </div>
                        <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">{t('live_match_venue', language)}</p>
                          <p className="text-sm font-bold text-slate-100">{getLiveCompetition(liveMatchModal.data)?.venue?.fullName || '-'}</p>
                        </div>
                        <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 sm:col-span-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">{t('live_match_available_info', language)}</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.keys(liveMatchModal.data || {}).slice(0, 18).map(key => (
                              <span key={key} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-800 text-slate-300 border border-white/5">
                                {key}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {liveMatchModal.activeTab === 'stats' && (
                      <div className="space-y-3">
                        {(liveMatchModal.data?.boxscore?.teams || []).length > 0 ? (
                          liveMatchModal.data?.boxscore?.teams.map((team: any, idx: number) => (
                            <div key={team.team?.id || idx} className="bg-slate-900 border border-white/10 rounded-2xl p-4">
                              <h3 className="text-sm font-black mb-3">{team.team?.displayName || team.team?.name || '-'}</h3>
                              <div className="grid grid-cols-2 gap-2">
                                {(team.statistics || []).slice(0, 12).map((stat: any) => (
                                  <div key={stat.name || stat.label} className="bg-slate-950 rounded-xl p-2 border border-white/5">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase truncate">{stat.label || stat.name}</p>
                                    <p className="text-sm font-black text-indigo-200">{stat.displayValue || stat.value || '-'}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-slate-500 text-xs font-bold uppercase">{t('live_match_no_stats', language)}</div>
                        )}
                      </div>
                    )}

                    {liveMatchModal.activeTab === 'plays' && (
                      <div className="space-y-2">
                        {getLivePlays(liveMatchModal.data).length > 0 ? (
                          getLivePlays(liveMatchModal.data).map((play: any, idx: number) => (
                            <div key={play.id || idx} className="bg-slate-900 border border-white/10 rounded-2xl p-3 flex gap-3">
                              <span className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-200 flex items-center justify-center text-[10px] font-black shrink-0">{idx + 1}</span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-100 leading-relaxed">{play.text || play.shortText || play.type?.text || '-'}</p>
                                {(play.clock?.displayValue || play.period?.displayValue) && (
                                  <p className="text-[10px] font-bold text-slate-500 mt-1">{play.period?.displayValue || ''} {play.clock?.displayValue || ''}</p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-12 text-center text-slate-500 text-xs font-bold uppercase">{t('live_match_no_plays', language)}</div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)} />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 relative flex flex-col z-[1001]"
            >
              <div className="p-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between shrink-0">
                <h2 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                  <History size={18} />
                  {language === 'ko' ? '전체 배팅 기록' : 'ALL BETTING HISTORY'}
                </h2>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {bets.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <HelpCircle size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-bold uppercase">{t('no_active_predictions', language)}</p>
                  </div>
                ) : (
                  [...bets].reverse().map((bet) => {
                    const betPricePercent = formatProbabilityPercent(bet.betPrice);
                    const payoutAmount = Math.round(bet.amount / (bet.betPrice > 0 ? bet.betPrice : 0.5));
                    return (
                      <div key={bet.betId} className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(bet.timestamp).toLocaleDateString()}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-lg uppercase font-bold text-[9px]",
                            bet.status === 'win' ? "bg-emerald-50 text-emerald-700" :
                            bet.status === 'claimed' ? "bg-slate-200 text-slate-500" :
                            bet.status === 'loss' ? "bg-rose-50 text-rose-700" :
                            "bg-amber-50 text-amber-700"
                          )}>
                            {bet.status === 'win' ? (language === 'ko' ? '당첨' : 'WIN') :
                            bet.status === 'claimed' ? (language === 'ko' ? '수령 완료' : 'CLAIMED') :
                            bet.status === 'loss' ? (language === 'ko' ? '패배' : 'LOSS') :
                            (language === 'ko' ? '진행 중' : 'PENDING')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 truncate max-w-[80%]">
                            {bet.marketTitle || bet.matchName || '-'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={cn(
                            "font-bold",
                            bet.outcome === 'Yes' ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {bet.outcome} ({betPricePercent})
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-600">
                              {bet.amount.toLocaleString()} SNS
                            </span>
                            {bet.status === 'win' && (
                              <span className="font-extrabold text-emerald-600">
                                → {payoutAmount.toLocaleString()} SNS
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="w-full py-3 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {language === 'ko' ? '닫기' : 'CLOSE'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {localAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 right-4 z-[9999] p-4 rounded-2xl border border-slate-100 font-bold shadow-2xl text-xs text-center flex items-center justify-center gap-2 bg-white text-slate-850"
          >
            {localAlert.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
            )}
            <span>{localAlert.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Popup */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowHelp(false)} />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-white pt-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {t('prediction_market', language)}
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              <div className="min-h-[120px] flex flex-col justify-center text-center py-4">
                {helpStep === 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">{language === 'ko' ? '실시간 스포츠 경기에 베팅하세요.' : 'Bet on live sports matches.'}</p>
                    <p className="text-[10px] text-slate-500">{language === 'ko' ? 'Yes/No 확률을 확인하고 SNS 코인으로 베팅하여 보상을 획득하세요.' : 'Check Yes/No odds and bet SNS coins for rewards.'}</p>
                  </div>
                )}
                {helpStep === 1 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">{language === 'ko' ? '베팅 내역을 관리하세요.' : 'Manage your bets.'}</p>
                    <p className="text-[10px] text-slate-500">{language === 'ko' ? '내 베팅 탭에서 진행 중인 베팅을 확인하고 결과를 확인한 후 보상을 수령하세요.' : 'Check your active bets, verify results, and claim rewards in My Bets tab.'}</p>
                  </div>
                )}
                {helpStep === 2 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">{language === 'ko' ? '실시간 경기 중계를 확인하세요.' : 'Watch live match updates.'}</p>
                    <p className="text-[10px] text-slate-500">{language === 'ko' ? 'LIVE 버튼을 눌러 실시간 경기 점수, 통계, 플레이 정보를 확인할 수 있습니다.' : 'Tap LIVE to see real-time scores, stats, and play-by-play.'}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setHelpStep(prev => Math.max(0, prev - 1))}
                  disabled={helpStep === 0}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                >
                  <ChevronLeft size={18} className="text-slate-600" />
                </button>
                <span className="text-[10px] font-bold text-slate-400">{helpStep + 1} / 3</span>
                <button
                  onClick={() => setHelpStep(prev => Math.min(2, prev + 1))}
                  disabled={helpStep === 2}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                >
                  <ChevronRight size={18} className="text-slate-600" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCR-07: Bet Placement Success Dopamine Modal */}
      <AnimatePresence>
        {betSuccessModal?.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs font-mono select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a1717] border border-amber-500/80 text-white p-6 max-w-sm w-full space-y-4 shadow-2xl relative rounded-xs"
            >
              <div className="text-center space-y-1">
                <div className="inline-flex p-3 rounded-full bg-amber-500/20 text-amber-400 border border-amber-400/50 mb-1 animate-bounce">
                  <Flame size={28} />
                </div>
                <h3 className="text-base font-black text-amber-300">
                  {language === 'ko' ? '🎉 승부 예측 베팅 접수 완료!' : '🎉 PREDICTION BET PLACED!'}
                </h3>
                <p className="text-xs text-slate-300 font-bold line-clamp-2">
                  {betSuccessModal.question}
                </p>
              </div>

              <div className="bg-black/50 border border-slate-800 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>{language === 'ko' ? '선택 결과' : 'Selection'}:</span>
                  <span className={cn(
                    "font-black px-2 py-0.5 rounded-xs",
                    betSuccessModal.outcome === 'Yes' ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                  )}>
                    {betSuccessModal.outcome}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>{language === 'ko' ? '베팅 금액' : 'Bet Amount'}:</span>
                  <span className="font-bold text-slate-200">{betSuccessModal.amount.toLocaleString()} SNS</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800 pt-2 font-black">
                  <span className="text-amber-400">{language === 'ko' ? '적중 시 예상 당첨금' : 'Est. Win Payout'}:</span>
                  <span className="text-emerald-400 text-sm animate-pulse">+{betSuccessModal.potentialWin.toLocaleString()} SNS</span>
                </div>
              </div>

              {betSuccessModal.isFirstBetBonus && (
                <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-400/60 p-2.5 rounded-xs flex items-center gap-2 text-xs text-amber-300">
                  <Gift size={16} className="text-amber-400 shrink-0 animate-bounce" />
                  <span className="font-black">
                    {language === 'ko' 
                      ? '🎁 [첫 베팅 웰컴 캐시백] +30 SNS가 즉시 지급되었습니다!'
                      : '🎁 [First Bet Bonus] +30 SNS instant cashback awarded!'}
                  </span>
                </div>
              )}

              <button
                onClick={() => setBetSuccessModal(null)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xs cursor-pointer shadow-lg active:scale-95 transition-all border border-amber-300 touch-target"
              >
                [{language === 'ko' ? '확인 (경기 결과 기다리기)' : 'CONFIRM'}]
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCR-07: Reward Claim Success Dopamine Modal */}
      <AnimatePresence>
        {claimSuccessModal?.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs font-mono select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a1717] border border-emerald-500/80 text-white p-6 max-w-sm w-full space-y-4 shadow-2xl relative rounded-xs text-center"
            >
              <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/50 mb-1 animate-bounce">
                <Trophy size={32} />
              </div>
              <h3 className="text-base font-black text-emerald-300">
                {language === 'ko' ? '👑 적중 배당금 수령 완료!' : '👑 REWARD CLAIMED SUCCESSFULLY!'}
              </h3>
              <p className="text-2xl font-black text-amber-400 animate-pulse">
                +{claimSuccessModal.amount.toLocaleString()} SNS
              </p>
              <p className="text-xs text-slate-300">
                {language === 'ko' ? '예측 성공 배당금이 보유 잔액으로 즉시 정산되었습니다.' : 'Winnings have been credited to your balance.'}
              </p>
              <button
                onClick={() => setClaimSuccessModal(null)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xs cursor-pointer shadow-lg active:scale-95 transition-all border border-emerald-400 touch-target"
              >
                [{language === 'ko' ? '확인' : 'OK'}]
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* SCR-07-06: Prediction Booster Modal */}
      <PredictionBoosterModal
        isOpen={isBoosterModalOpen}
        onClose={() => setIsBoosterModalOpen(false)}
        language={language}
        onSelectBooster={(booster) => {
          setActiveBooster(booster);
          setIsBoosterModalOpen(false);
        }}
      />
    </div>
  );
};
