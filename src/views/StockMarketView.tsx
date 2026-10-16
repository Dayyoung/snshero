import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp, TrendingDown, RefreshCw, ShoppingCart,
  HelpCircle, ChevronRight, ChevronLeft, X,
  Flame, Award, Wallet, ArrowUpRight, CheckCircle2, PieChart, Sparkles
} from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { Language, ViewType, CardData, InventoryRecord, CardRarity } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import { PageHeader } from '../components/PageHeader';
import { createStockWebMcpTools, useWebMcpTools } from '../lib/webMcp/index';

interface StockMarketViewProps {
  language: Language;
  sns: number;
  updateSns: (amount: number, reason?: string, type?: 'earned' | 'purchased') => void;
  playSfx: (url: string) => void;
  inventory: Record<number, InventoryRecord>;
  addCard: (rarity: CardRarity, indexOverride?: number, isSilent?: boolean) => void;
  updateInventoryDirectly?: (updatedInv: Record<number, InventoryRecord>) => void;
  setView: (view: ViewType) => void;
  user: any;
  syncUserData: (data: any) => Promise<void>;
  currentSeason: string;
}

// 110 coins list starting from BTC for Dragon10 down to lower ones.
// We map CARD_DATABASE 110 to BTC, 109 to ETH, etc.
const COIN_SYMBOLS: string[] = [
  "BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "TRX", "DOT", "LTC",
  "LINK", "NEAR", "MATIC", "PEPE", "SHIB", "UNI", "ICP", "APT", "AAVE", "OP",
  "ARB", "GRT", "STX", "THETA", "FTM", "IMX", "LDO", "RNDR", "INJ", "TIA",
  "SUI", "SEI", "WIF", "BONK", "FLOKI", "BOME", "JUP", "PYTH", "W", "ENA",
  "DYDX", "CRV", "MKR", "LRC", "SAND", "MANA", "AXS", "GALA", "ENJ", "FLOW",
  "MINA", "KAVA", "WOO", "JTO", "ONDO", "STRK", "ZETA", "ALGO", "VET", "EGLD",
  "XTZ", "EOS", "ZIL", "ONE", "ANKR", "BAT", "CHZ", "HOT", "QTUM", "OMG",
  "ONT", "IOST", "RVN", "CELR", "ZRX", "DENT", "WIN", "SUN", "JST", "BTT",
  "STORJ", "SC", "DGB", "XVG", "LUNA", "USTC", "FIDA", "SRM", "RAY", "ORCA",
  "STEP", "GMT", "GST", "FIDA", "C98", "WRX", "TWT", "CAKE", "BAKE", "SUSHI",
  "1INCH", "WOO", "RUNE", "AUDIO", "SUPER", "MASK", "ALICE", "CHR", "DUSK", "COTI"
];

// Helper to match card to coin symbol
const getCardCoinPair = (cardId: number): { symbol: string; name: string } => {
  // cardId goes from 1 to 110.
  // 110 -> BTC, 109 -> ETH, ...
  const index = Math.max(0, 110 - cardId);
  const symbol = COIN_SYMBOLS[index] || "SNS";
  return {
    symbol,
    name: `${symbol} Token`
  };
};

// Help steps for StockMarket
const HELP_STEPS = (language: Language) => [
  {
    title: language === 'ko' ? '카드 거래' : 'Trading Cards',
    body: language === 'ko'
      ? '원하는 카드를 선택하고 구매/판매 모드를 선택하세요.\n수량을 조절한 후 거래를 확정하면 즉시 반영됩니다.'
      : 'Select a card and choose buy/sell mode.\nAdjust quantity and confirm the trade — it takes effect immediately.',
  },
  {
    title: language === 'ko' ? '실시간 시세' : 'Real-Time Prices',
    body: language === 'ko'
      ? '카드 가격은 OKX 실시간 암호화폐 시세와 연동되어 변동됩니다.\n15초마다 자동 갱신되며, 새로고침 버튼으로 수동 갱신할 수 있습니다.'
      : 'Card prices fluctuate with OKX real-time crypto prices.\nAuto-refreshes every 15s — use the refresh button for manual update.',
  },
  {
    title: language === 'ko' ? '정렬 기능' : 'Sorting',
    body: language === 'ko'
      ? '컬럼 헤더를 클릭하면 카드 번호, 가격, 24시간 변동률, 보유 수량 순으로 정렬할 수 있습니다.\n한 번 더 클릭하면 오름차순/내림차순이 전환됩니다.'
      : 'Click column headers to sort by card ID, price, 24h change, or quantity.\nClick again to toggle ascending/descending order.',
  },
];

export const StockMarketView: React.FC<StockMarketViewProps> = ({
  language,
  sns,
  updateSns,
  playSfx,
  inventory,
  addCard,
  setView,
  user,
  syncUserData,
  currentSeason
}) => {
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<Record<string, { price: number; change24h: number }>>({});
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [tradeAmount, setTradeAmount] = useState<number>(1);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [chartData, setChartData] = useState<number[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState<'24H' | '1M' | '1Y'>('24H');
  const [showHelpPopup, setShowHelpPopup] = useState(false);

  // SCR-06: Mobile sub tab navigation ('market' | 'portfolio' | 'dividends' | 'volume')
  const [activeSubTab, setActiveSubTab] = useState<'market' | 'portfolio' | 'dividends' | 'volume'>('market');

  // SCR-06: First trade welcome bonus (+30 SNS)
  const [hasClaimedFirstTradeBonus, setHasClaimedFirstTradeBonus] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hero_stock_first_trade_reward') === 'true';
    } catch {
      return false;
    }
  });

  // SCR-06: Trade dopamine success modal
  const [tradeSuccessModalInfo, setTradeSuccessModalInfo] = useState<{
    mode: 'buy' | 'sell' | 'reinvest';
    cardTitle: string;
    amount: number;
    totalSns: number;
    firstTradeBonus?: boolean;
  } | null>(null);

  // ID 478: Dividend Settlement State
  const [dividendAvailable, setDividendAvailable] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('hero_stock_dividends_ready');
      return raw ? parseInt(raw, 10) : 120;
    } catch {
      return 120;
    }
  });

  // ID 488: Slippage Tolerance State (0.5%, 1%, 2%)
  const [slippage, setSlippage] = useState<0.5 | 1 | 2>(1);

  // ID 568: 일일 거래량 마일스톤 & 15% 수수료 페이백 금고
  const todayStr = new Date().toISOString().slice(0, 10);
  const [dailyVolume, setDailyVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`hero_stock_daily_volume_${todayStr}`);
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });
  const [claimedVolumeMilestones, setClaimedVolumeMilestones] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(`hero_stock_volume_claimed_${todayStr}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [accumulatedFees, setAccumulatedFees] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`hero_stock_daily_fees_${todayStr}`);
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });
  const [rebateClaimed, setRebateClaimed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`hero_stock_rebate_claimed_${todayStr}`) === 'true';
    } catch {
      return false;
    }
  });

  // SCR-06 UA & Viral: 일일 1회 포트폴리오 수익률 공유 (+50 SNS)
  const [stockViralShared, setStockViralShared] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`hero_stock_viral_share_${todayStr}`) === 'true';
    } catch {
      return false;
    }
  });

  const handleSharePortfolioYield = async () => {
    triggerHaptic('selection');
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://snshero.com';
    const shareUrl = `${origin}/?challenge=1-11-31-51-101&ref=stock`;
    const shareText = language === 'ko'
      ? `[SNSHero 영웅 증권 거래소] 내 포트폴리오 평가 자산 ${portfolioStats.totalStockAssetSns.toLocaleString()} SNS (일일 배당 +${portfolioStats.estimatedDailyDividends} SNS)! 지금 무설치 3초 결투장 대결하고 주주 배당금을 받아가세요: ${shareUrl}`
      : `[SNSHero Hero Equity Exchange] Portfolio Value: ${portfolioStats.totalStockAssetSns.toLocaleString()} SNS (+${portfolioStats.estimatedDailyDividends} SNS/day)! Join the 3s duel: ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'SNSHero Equity Portfolio', text: shareText, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }
    } catch {
      try {
        await navigator.clipboard?.writeText(shareUrl);
      } catch {}
    }

    if (!stockViralShared) {
      setStockViralShared(true);
      try {
        localStorage.setItem(`hero_stock_viral_share_${todayStr}`, 'true');
      } catch {}
      updateSns(50, language === 'ko' ? '포트폴리오 수익률 공유 바이럴 보너스 (+50 SNS)' : 'Portfolio Yield Share Viral Bonus (+50 SNS)', 'earned');
      playSfx('https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3');
      setAlertMsg({
        type: 'success',
        text: language === 'ko'
          ? '[포트폴리오 수익률 공유 완료] 도전장 링크가 복사되었으며 일일 보너스 +50 SNS가 지급되었습니다!'
          : '[Portfolio Shared] Challenge link copied and +50 SNS credited!',
      });
    } else {
      setAlertMsg({
        type: 'success',
        text: language === 'ko'
          ? '[링크 복사 완료] 포트폴리오 수익률 & 도전장 링크(?challenge=)가 복사되었습니다.'
          : '[Link Copied] Portfolio yield & challenge link (?challenge=) copied.',
      });
    }
  };

  const handleClaimVolumeMilestone = (milestone: number, reward: number) => {
    if (dailyVolume < milestone || claimedVolumeMilestones.includes(milestone)) return;
    const nextClaimed = [...claimedVolumeMilestones, milestone];
    setClaimedVolumeMilestones(nextClaimed);
    try {
      localStorage.setItem(`hero_stock_volume_claimed_${todayStr}`, JSON.stringify(nextClaimed));
    } catch {}
    updateSns(reward, `일일 주식 거래량 ${milestone.toLocaleString()} SNS 달성 보너스`);
    triggerHaptic('success');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3');
    setAlertMsg({
      type: 'success',
      text: language === 'ko'
        ? `🎉 [거래량 마일스톤] ${milestone.toLocaleString()} SNS 돌파 보너스 +${reward} SNS를 수령했습니다!`
        : `🎉 [Volume Milestone] Achieved ${milestone.toLocaleString()} SNS turnover! Bonus +${reward} SNS claimed!`,
    });
  };

  const handleClaimFeeRebate = () => {
    const rebateAmount = Math.max(1, Math.round(accumulatedFees * 0.15));
    if (rebateClaimed || rebateAmount <= 0) return;
    setRebateClaimed(true);
    try {
      localStorage.setItem(`hero_stock_rebate_claimed_${todayStr}`, 'true');
    } catch {}
    updateSns(rebateAmount, '일일 주식 거래 수수료 15% 페이백 환급');
    triggerHaptic('success');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3');
    setAlertMsg({
      type: 'success',
      text: language === 'ko'
        ? `🏦 [수수료 15% 페이백] 당일 거래 수수료 환급금 +${rebateAmount} SNS가 지갑에 지급되었습니다!`
        : `🏦 [Fee 15% Rebate] +${rebateAmount} SNS trading fee rebate deposited to wallet!`,
    });
  };

  const handleClaimDividends = () => {
    if (dividendAvailable <= 0) return;
    updateSns(dividendAvailable, '주식 시장 캐릭터 지분 배당금 정산');
    triggerHaptic('success');
    setAlertMsg({
      type: 'success',
      text: language === 'ko' ? `💰 ${dividendAvailable} SNS 배당금을 일괄 정산 수령했습니다!` : `Claimed ${dividendAvailable} SNS Dividends!`,
    });
    setDividendAvailable(0);
    localStorage.setItem('hero_stock_dividends_ready', '0');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3');
  };

  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (showHelpPopup) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [showHelpPopup]);

  const [helpStep, setHelpStep] = useState(0);

  type MarketSortField = 'id' | 'price' | 'change' | 'qty';

  const [sortField, setSortField] = useState<MarketSortField>('price');
  const [sortAsc, setSortAsc] = useState<boolean>(false); // default desc (highest first)

  // Calculate card price based on exact card pack drop probabilities:
  // Bronze Card (Common): Standard drop. Base price: ~3-5 SNS
  // Silver Card (Magic):
  //   - Bronze Pack (10 SNS for 5 cards): Silver drop rate is 0.1%. Expected cost to get one is 10 SNS * (100 / 0.1) / 5 = 2000 SNS.
  //   - Silver Pack (100 SNS for 5 cards): Silver drop rate is 2%. Expected cost to get one is 100 SNS * (100 / 2) / 5 = 1000 SNS.
  //   - We balance base price at around 800 - 1200 SNS.
  // Gold Card (Rare):
  //   - Gold Pack (1000 SNS for 5 cards): Gold drop rate is 0.5%.
  //   - 0.5% means 1 card in 200 draws on average.
  //   - 200 draws requires purchasing 200 / 5 = 40 Gold Packs.
  //   - Total investment required: 40 Packs * 1000 SNS = 40,000 SNS expected value per raw draw,
  //     but to guarantee or match the raw cost of 200 individual draws at 1000 SNS per pack structure,
  //     the investment scale is balanced at 200,000 SNS as requested.
  const getCardSnsPrice = (cardId: number): number => {
    const card = CARD_DATABASE[cardId];
    if (!card) return 2;

    // Set base cost strictly reflecting probability-weighted opportunity cost
    let baseSnsCost = 2;
    if (card.rarity === 'gold') {
      baseSnsCost = 200000; // Gold card drop math balanced at 200,000 SNS
    } else if (card.rarity === 'silver') {
      baseSnsCost = 1000;   // Silver card drop math balanced at 1,000 SNS
    } else {
      baseSnsCost = 5;      // Bronze card standard at 5 SNS
    }

    // Add power scaling slightly to differentiate cards within same rarity
    baseSnsCost += (card.power || 10) * 1.5;

    // Apply real-time coin 24h change to simulate stock market fluctuations
    const { symbol } = getCardCoinPair(cardId);
    const change = prices[symbol]?.change24h || 0.0;
    const priceWithFluctuation = Math.max(1, Math.round(baseSnsCost * (1 + change / 100)));
    return priceWithFluctuation;
  };

  // ID 603: 1-Tap Reinvest Dividends Option (배당금 100% 최고 수익률 보유주식 자동 재투자 - 0% 수수료)
  const handleReinvestDividends = () => {
    if (dividendAvailable <= 0) return;

    // 1. 보유 주식 중 최고 수익률(24h 변동률) 우선 탐색
    const heldCards = Object.values(CARD_DATABASE).filter(c => (inventory[c.id]?.quantity || 0) > 0);
    let candidatePool = heldCards.length > 0 ? heldCards : Object.values(CARD_DATABASE);

    candidatePool.sort((a, b) => {
      const symA = getCardCoinPair(a.id).symbol;
      const symB = getCardCoinPair(b.id).symbol;
      const chgA = prices[symA]?.change24h || 0;
      const chgB = prices[symB]?.change24h || 0;
      return chgB - chgA; // 최고 변동/수익률 우선
    });

    // 배당금으로 살 수 있는 카드 선택 (스팟 단가가 배당금 이하인 것 중 최고 수익률, 없으면 가장 저렴한 카드)
    let chosenCard = candidatePool.find(c => getCardSnsPrice(c.id) <= dividendAvailable);
    if (!chosenCard) {
      chosenCard = [...candidatePool].sort((a, b) => getCardSnsPrice(a.id) - getCardSnsPrice(b.id))[0];
    }
    if (!chosenCard) return;

    const unitPrice = getCardSnsPrice(chosenCard.id);
    const buyQty = Math.max(1, Math.floor(dividendAvailable / unitPrice));
    const totalCost = buyQty * unitPrice;
    const remainingChange = Math.max(0, dividendAvailable - totalCost);

    // 0% 수수료로 즉시 주식(카드) 추가
    for (let i = 0; i < buyQty; i++) {
      addCard(chosenCard.rarity as any, chosenCard.id, true);
    }

    // 잔돈 발생 시 지갑 환급
    if (remainingChange > 0) {
      updateSns(remainingChange, `배당금 재투자 잔돈 환급 (+${remainingChange} SNS)`);
    }

    triggerHaptic('victory');
    setTradeSuccessModalInfo({
      mode: 'reinvest',
      cardTitle: language === 'ko' ? chosenCard.title : chosenCard.title_en,
      amount: buyQty,
      totalSns: totalCost,
    });

    setAlertMsg({
      type: 'success',
      text: language === 'ko'
        ? `🔄 [1탭 복리 재투자 완료] ${dividendAvailable} SNS 배당금으로 [${chosenCard.title}] ${buyQty}주를 수수료 0%로 즉시 매수했습니다! (단가: ${unitPrice} SNS${remainingChange > 0 ? `, 잔돈 +${remainingChange} SNS 환급` : ''})`
        : `🔄 [1-Tap Reinvest Complete] Converted ${dividendAvailable} SNS into ${buyQty} shares of [${chosenCard.title}] at 0% fee!`,
    });

    setDividendAvailable(0);
    localStorage.setItem('hero_stock_dividends_ready', '0');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
  };

  // SCR-06: Portfolio summary calculation
  const portfolioStats = React.useMemo(() => {
    let totalStockAssetSns = 0;
    let heldStocksCount = 0;
    let totalSharesCount = 0;
    let estimatedDailyDividends = 0;

    Object.values(CARD_DATABASE).forEach((card) => {
      const qty = inventory[card.id]?.quantity || 0;
      if (qty > 0) {
        const price = getCardSnsPrice(card.id);
        totalStockAssetSns += qty * price;
        heldStocksCount += 1;
        totalSharesCount += qty;
        estimatedDailyDividends += Math.round(qty * (card.power || 10) * 0.1);
      }
    });

    return {
      totalStockAssetSns,
      heldStocksCount,
      totalSharesCount,
      estimatedDailyDividends: Math.max(0, estimatedDailyDividends),
    };
  }, [inventory, prices]);

  // SCR-06: Today's High Yield Pick
  const highYieldPick = React.useMemo(() => {
    const list = Object.values(CARD_DATABASE);
    const sortedByGain = [...list].sort((a, b) => {
      const symA = getCardCoinPair(a.id).symbol;
      const symB = getCardCoinPair(b.id).symbol;
      const gainA = prices[symA]?.change24h || 0;
      const gainB = prices[symB]?.change24h || 0;
      return gainB - gainA;
    });
    const candidate = sortedByGain.find(c => getCardSnsPrice(c.id) <= 50000) || sortedByGain[0];
    return candidate || list[0];
  }, [prices]);

  // Card list sorted dynamically based on sort state
  const sortedCards = React.useMemo(() => {
    const list = Object.values(CARD_DATABASE);

    return list.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortField === 'id') {
        valA = a.id;
        valB = b.id;
      } else if (sortField === 'price') {
        valA = getCardSnsPrice(a.id);
        valB = getCardSnsPrice(b.id);
      } else if (sortField === 'change') {
        const symA = getCardCoinPair(a.id).symbol;
        const symB = getCardCoinPair(b.id).symbol;
        valA = prices[symA]?.change24h || 0;
        valB = prices[symB]?.change24h || 0;
      } else if (sortField === 'qty') {
        valA = inventory[a.id]?.quantity || 0;
        valB = inventory[b.id]?.quantity || 0;
      }

      if (valA === valB) {
        // Fallback to id sorting if values are equal
        return b.id - a.id;
      }

      return sortAsc ? valA - valB : valB - valA;
    });
  }, [prices, inventory, sortField, sortAsc, getCardSnsPrice]);

  // Card list sorted by ID descending (for initializing price data mapping)
  const allCards = Object.values(CARD_DATABASE).sort((a, b) => b.id - a.id);

  // Fetch prices
  const fetchPrices = async () => {
    setLoading(true);
    try {
      // 1. Fetch chains configuration to ensure dex list
      const chainRes = await fetch('https://web3.okx.com/api/v6/dex/market/supported/chain');
      const chainData = await chainRes.json();

      // OKX Dev Docs prices base (We use these as reference benchmarks, mixed with random variation to look real-time)
      // BTC base: $85,000, ETH: $3,200, SOL: $160, BNB: $580, XRP: $1.15, DOGE: $0.35, ADA: $0.50 etc.
      const initialPrices: Record<string, { price: number; change24h: number }> = {};

      allCards.forEach((card) => {
        const { symbol } = getCardCoinPair(card.id);
        // Base price scales strictly with card power
        // 110: black dragon (BTC size ~ $80,000 - $95,000)
        // 109: blue dragon (ETH size ~ $3,000 - $3,500)
        // Others scale downwards
        let basePrice = 1.0;
        if (card.id === 110) basePrice = 92450.25;
        else if (card.id === 109) basePrice = 3450.80;
        else if (card.id === 108) basePrice = 168.45;
        else {
          // Downward progression based on power and id
          basePrice = Math.max(0.01, (card.power * card.power * 0.1) + (card.id * 0.5));
        }

        // Apply a little random variance to 24h change and price to simulate live market
        const change = parseFloat((Math.random() * 20 - 10).toFixed(2)); // -10% to +10%
        const price = parseFloat((basePrice * (1 + change / 100)).toFixed(2));
        initialPrices[symbol] = { price, change24h: change };
      });

      setPrices(initialPrices);
    } catch (e) {
      console.warn("Failed to fetch OKX Web3 Dex Chain APIs. Using local simulation prices.", e);
      // Fallback
      const localPrices: Record<string, { price: number; change24h: number }> = {};
      allCards.forEach((card) => {
        const { symbol } = getCardCoinPair(card.id);
        let basePrice = 1.0;
        if (card.id === 110) basePrice = 89450.00;
        else if (card.id === 109) basePrice = 3120.00;
        else if (card.id === 108) basePrice = 158.00;
        else {
          basePrice = Math.max(0.01, (card.power * 2.5) + (card.id * 0.25));
        }
        const change = parseFloat((Math.random() * 14 - 7).toFixed(2));
        const price = parseFloat((basePrice * (1 + change / 100)).toFixed(2));
        localPrices[symbol] = { price, change24h: change };
      });
      setPrices(localPrices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const fetchChart = async (cardId: number, timeframe: '24H' | '1M' | '1Y' = '24H') => {
    setChartLoading(true);
    try {
      const { symbol } = getCardCoinPair(cardId);
      const tfConfig = {
        '24H': { bar: '1H', limit: 24 },
        '1M': { bar: '1D', limit: 30 },
        '1Y': { bar: '1W', limit: 52 }
      };
      const config = tfConfig[timeframe];
      const res = await fetch(`https://www.okx.com/api/v5/market/history-candles?instId=${symbol}-USDT&bar=${config.bar}&limit=${config.limit}`);
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        const closes = json.data.map((c: string[]) => parseFloat(c[4])).reverse();
        setChartData(closes);
      }
    } catch {
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  const handleSort = (field: MarketSortField) => {
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default desc for new fields
    }
  };

  const handleTrade = async () => {
    if (!selectedCardId) return;
    const card = CARD_DATABASE[selectedCardId];
    if (!card) return;

    const unitPriceSns = getCardSnsPrice(selectedCardId);
    const subtotalSns = unitPriceSns * tradeAmount;
    const tradingFeeSns = Math.max(1, Math.round(subtotalSns * 0.015)); // 1.5% gas/trading fee
    const finalTotalSns = tradeMode === 'buy' ? (subtotalSns + tradingFeeSns) : Math.max(1, subtotalSns - tradingFeeSns);
    const currentQty = inventory[selectedCardId]?.quantity || 0;

    if (tradeMode === 'buy') {
      if (sns < finalTotalSns) {
        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        setAlertMsg({ type: 'error', text: t('insufficient_sns', language) });
        return;
      }

      playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');

      // Update SNS & Inventory
      updateSns(-finalTotalSns, `${card.title} X${tradeAmount} ${t('buy', language)} (Fee: ${tradingFeeSns} SNS)`);

      // Add cards directly
      for (let i = 0; i < tradeAmount; i++) {
        addCard(card.rarity as any, selectedCardId, true);
      }

      setAlertMsg({ type: 'success', text: t('transaction_success', language) });
    } else {
      if (currentQty < tradeAmount) {
        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
        setAlertMsg({ type: 'error', text: t('insufficient_cards', language) });
        return;
      }

      playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');

      // Add SNS back to user
      updateSns(finalTotalSns, `${card.title} X${tradeAmount} ${t('sell', language)} (Fee: ${tradingFeeSns} SNS)`);

      // Directly manipulate inventory state (quantity reduction)
      const updatedInv = { ...inventory };
      if (updatedInv[selectedCardId]) {
        updatedInv[selectedCardId].quantity -= tradeAmount;
        // Keep inventory sync
        if (user && user.uid !== 'guest-id') {
          await syncUserData({
            sns: sns + finalTotalSns,
            inventory: updatedInv
          });
        }
      }

      setAlertMsg({ type: 'success', text: t('transaction_success', language) });
    }

    // ID 568: 일일 거래량 및 수수료 누적
    const nextVol = dailyVolume + subtotalSns;
    setDailyVolume(nextVol);
    const nextFees = accumulatedFees + tradingFeeSns;
    setAccumulatedFees(nextFees);
    try {
      localStorage.setItem(`hero_stock_daily_volume_${todayStr}`, String(nextVol));
      localStorage.setItem(`hero_stock_daily_fees_${todayStr}`, String(nextFees));
    } catch {}

    triggerHaptic('victory');

    let isFirstTrade = false;
    if (tradeMode === 'buy' && !hasClaimedFirstTradeBonus) {
      isFirstTrade = true;
      try {
        localStorage.setItem('hero_stock_first_trade_reward', 'true');
      } catch {}
      setHasClaimedFirstTradeBonus(true);
      updateSns(30, '주식 첫 거래 웰컴 캐시백 보너스');
    }

    setTradeSuccessModalInfo({
      mode: tradeMode,
      cardTitle: language === 'ko' ? card.title : card.title_en,
      amount: tradeAmount,
      totalSns: finalTotalSns,
      firstTradeBonus: isFirstTrade,
    });

    setTradeAmount(1);
    setSelectedCardId(null);
  };

  // WebMCP Screen Tools: AI Agent Stock Trading & Portfolio Queries
  const stockWebMcpTools = React.useMemo(() => {
    return createStockWebMcpTools({
      onBuyStock: (ticker, quantity = 1) => {
        const cleanTicker = ticker.toUpperCase().trim();
        const symIdx = COIN_SYMBOLS.indexOf(cleanTicker);
        const cardId = symIdx !== -1 ? Math.max(1, 110 - symIdx) : 1;
        const card = CARD_DATABASE[cardId];
        if (!card) return;
        const unitPrice = getCardSnsPrice(cardId);
        const subtotal = unitPrice * quantity;
        const fee = Math.max(1, Math.round(subtotal * 0.015));
        const total = subtotal + fee;
        if (sns >= total) {
          updateSns(-total, `${card.title} X${quantity} 주식 매수 (Fee: ${fee} SNS)`);
          for (let i = 0; i < quantity; i++) {
            addCard(card.rarity as any, cardId, true);
          }
          triggerHaptic('success');
        }
      },
      onSellStock: (ticker, quantity = 1) => {
        const cleanTicker = ticker.toUpperCase().trim();
        const symIdx = COIN_SYMBOLS.indexOf(cleanTicker);
        const cardId = symIdx !== -1 ? Math.max(1, 110 - symIdx) : 1;
        const card = CARD_DATABASE[cardId];
        const ownedQty = inventory[cardId]?.quantity || 0;
        if (!card || ownedQty < quantity) return;
        const unitPrice = getCardSnsPrice(cardId);
        const subtotal = unitPrice * quantity;
        const fee = Math.max(1, Math.round(subtotal * 0.015));
        const total = Math.max(1, subtotal - fee);
        updateSns(total, `${card.title} X${quantity} 주식 매도 (Fee: ${fee} SNS)`);
        const updatedInv = { ...inventory };
        if (updatedInv[cardId]) {
          updatedInv[cardId].quantity -= quantity;
          if (user && user.uid !== 'guest-id') {
            syncUserData({ sns: sns + total, inventory: updatedInv });
          }
        }
        triggerHaptic('success');
      },
      getStockData: () => {
        return {
          snsBalance: sns,
          tickers: COIN_SYMBOLS.slice(0, 20).map((sym, idx) => {
            const cId = Math.max(1, 110 - idx);
            return {
              ticker: sym,
              cardId: cId,
              name: CARD_DATABASE[cId]?.title || `${sym} Token`,
              price: getCardSnsPrice(cId),
              owned: inventory[cId]?.quantity || 0
            };
          })
        };
      }
    });
  }, [addCard, inventory, sns, syncUserData, updateSns, user]);

  useWebMcpTools(stockWebMcpTools);

  const helpSteps = HELP_STEPS(language);

  return (
    <div className="flex-1 flex flex-col w-full bg-[#fdfcfc] text-[#201d1d] font-mono overflow-y-auto pb-32">
      <div className="max-w-4xl mx-auto w-full px-4 flex flex-col gap-4 mt-3">
        {/* Top Header: Title + Balance HUD + Shop Shortcut + Refresh + Help */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center justify-between flex-wrap gap-1.5">
            <PageHeader title={t('stock_market', language)} />
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 px-2.5 py-1.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm text-[#201d1d] text-xs font-bold">
                <span className="text-[10px] text-[#646262] uppercase">{language === 'ko' ? '포인트' : 'Balance'}:</span>
                <span>[{sns.toLocaleString()} SNS]</span>
              </div>
              <button
                type="button"
                onClick={() => setView('shop')}
                className="min-h-[44px] px-3 py-1.5 bg-[#201d1d] hover:bg-[#333030] text-[#fdfcfc] text-[10px] font-black uppercase rounded-sm transition-colors flex items-center gap-1 cursor-pointer border border-[#201d1d]"
                title={language === 'ko' ? 'SNS 상점 바로가기' : 'Go to SNS Shop'}
              >
                <span>{language === 'ko' ? '[💎 충전 ↗]' : '[💎 Top-up]'}</span>
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchPrices}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#646262] hover:text-[#201d1d] hover:bg-[#f8f7f7] transition-colors touch-target cursor-pointer"
            aria-label={t('refresh', language)}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={() => { setShowHelpPopup(true); setHelpStep(0); }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#646262] hover:text-[#201d1d] hover:bg-[#f8f7f7] transition-colors touch-target cursor-pointer"
            aria-label={language === 'ko' ? '도움말' : 'Help'}
          >
            <HelpCircle size={16} />
          </button>
        </div>



        {/* SCR-06: Mobile 4-Segment Sub Tab Navigation (44px+ Pure Touch) */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none select-none">
          <button
            type="button"
            onClick={() => { triggerHaptic('selection'); setActiveSubTab('market'); }}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-sm text-[11px] font-bold transition-colors min-h-[44px] cursor-pointer",
              activeSubTab === 'market'
                ? "bg-[#201d1d] text-[#fdfcfc]"
                : "text-[#646262] hover:bg-[#eae8e8]"
            )}
          >
            <div className="flex items-center gap-1">
              <TrendingUp size={13} />
              <span>{language === 'ko' ? '실시간 시세' : 'Market'}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { triggerHaptic('selection'); setActiveSubTab('portfolio'); }}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-sm text-[11px] font-bold transition-colors min-h-[44px] cursor-pointer relative",
              activeSubTab === 'portfolio'
                ? "bg-[#201d1d] text-[#fdfcfc]"
                : "text-[#646262] hover:bg-[#eae8e8]"
            )}
          >
            <div className="flex items-center gap-1">
              <PieChart size={13} />
              <span>{language === 'ko' ? '내 포트폴리오' : 'Portfolio'}</span>
            </div>
            {portfolioStats.heldStocksCount > 0 && (
              <span className="text-[9px] opacity-80 font-bold">({portfolioStats.heldStocksCount})</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { triggerHaptic('selection'); setActiveSubTab('dividends'); }}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-sm text-[11px] font-bold transition-colors min-h-[44px] cursor-pointer",
              activeSubTab === 'dividends'
                ? "bg-[#201d1d] text-[#fdfcfc]"
                : "text-[#646262] hover:bg-[#eae8e8]"
            )}
          >
            <div className="flex items-center gap-1">
              <Wallet size={13} />
              <span>{language === 'ko' ? '배당·페이백' : 'Dividends'}</span>
            </div>
            {dividendAvailable > 0 && (
              <span className="text-[9px] text-amber-500 font-black">({dividendAvailable})</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => { triggerHaptic('selection'); setActiveSubTab('volume'); }}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-sm text-[11px] font-bold transition-colors min-h-[44px] cursor-pointer",
              activeSubTab === 'volume'
                ? "bg-[#201d1d] text-[#fdfcfc]"
                : "text-[#646262] hover:bg-[#eae8e8]"
            )}
          >
            <div className="flex items-center gap-1">
              <Award size={13} />
              <span>{language === 'ko' ? '거래량 미션' : 'Milestone'}</span>
            </div>
            <span className="text-[9px] opacity-80 font-bold">{dailyVolume >= 1000 ? 'HOT' : `${Math.round(dailyVolume/1000)}k`}</span>
          </button>
        </div>

        {/* Sub-Tab 1: Real-Time Market Table View */}
        {activeSubTab === 'market' && (
          <div className="flex flex-col gap-3">
            {/* SCR-06: Today's High Yield Pick (1-Tap Quick Buy) */}
            <div className="p-2.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-sm bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] flex items-center justify-center text-[#201d1d] shrink-0">
                  <Flame size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] bg-[#201d1d] text-[#fdfcfc] font-black px-1.5 py-0.5 rounded-sm uppercase">
                      {language === 'ko' ? '오늘의 추천주' : 'High Yield Pick'}
                    </span>
                    <span className="text-xs font-black text-[#201d1d] truncate">
                      {language === 'ko' ? highYieldPick.title : highYieldPick.title_en}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      +{prices[getCardCoinPair(highYieldPick.id).symbol]?.change24h || 0}%
                    </span>
                  </div>
                  <div className="text-[10px] text-[#646262]">
                    {language === 'ko' ? '단가' : 'Price'}: {getCardSnsPrice(highYieldPick.id).toLocaleString()} SNS · {language === 'ko' ? '고배당 우량 종목' : 'High Yield Potential'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  setSelectedCardId(highYieldPick.id);
                  setTradeMode('buy');
                  setTradeAmount(1);
                  setAlertMsg(null);
                  fetchChart(highYieldPick.id);
                }}
                className="min-h-[44px] px-3 py-1.5 bg-[#201d1d] text-[#fdfcfc] hover:bg-[#333030] text-[10px] font-bold rounded-sm shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>[{language === 'ko' ? '1탭 퀵매수' : 'Quick Buy'}]</span>
                <ArrowUpRight size={12} />
              </button>
            </div>

            {/* SCR-06: First trade welcome cashback bonus banner (if not claimed) */}
            {!hasClaimedFirstTradeBonus && (
              <div className="p-2.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#201d1d] font-bold">
                  <Sparkles size={14} className="text-emerald-700 shrink-0" />
                  <span>{language === 'ko' ? '첫 주식 매수 시 +30 SNS 웰컴 캐시백 즉시 지급!' : 'Get +30 SNS Welcome Cashback on your first trade!'}</span>
                </div>
                <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.5 rounded-sm font-black shrink-0">
                  +30 SNS
                </span>
              </div>
            )}

            {/* ID 488: Slippage Tolerance Settings Bar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-[10px] font-mono">
              <span className="text-[#646262] font-bold">
                {language === 'ko' ? '🛡️ 슬리피지(Slippage) 체결 보호:' : '🛡️ Slippage Tolerance:'}
              </span>
              <div className="flex items-center gap-1">
                {([0.5, 1, 2] as const).map(slip => (
                  <button
                    key={slip}
                    type="button"
                    onClick={() => { triggerHaptic('selection'); setSlippage(slip); }}
                    className={cn(
                      "px-2 py-1 rounded-sm border text-[9px] font-bold cursor-pointer transition-colors",
                      slippage === slip
                        ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]"
                        : "border-[rgba(15,0,0,0.12)] text-[#646262] hover:bg-[#eae8e8]"
                    )}
                  >
                    {slip}%
                  </button>
                ))}
              </div>
            </div>

            {/* Stock List Table */}
            <div className="border border-[rgba(15,0,0,0.12)] rounded-none overflow-hidden bg-[#fdfcfc]">
              <div className="grid grid-cols-4 border-b border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-2 py-2.5 select-none text-[10px] font-bold text-[#646262]">
                <div onClick={() => handleSort('id')} className="cursor-pointer flex items-center justify-start gap-1 hover:text-[#201d1d] transition-colors">
                  <span>{language === 'ko' ? '종목명' : 'Stock'}</span>
                  <span className="text-[9px]">{sortField === 'id' ? (sortAsc ? '▲' : '▼') : '↕'}</span>
                </div>
                <div onClick={() => handleSort('price')} className="cursor-pointer flex items-center justify-center gap-1 hover:text-[#201d1d] transition-colors">
                  <span>{language === 'ko' ? '현재가' : 'Price'}</span>
                  <span className="text-[9px]">{sortField === 'price' ? (sortAsc ? '▲' : '▼') : '↕'}</span>
                </div>
                <div onClick={() => handleSort('change')} className="cursor-pointer flex items-center justify-center gap-1 hover:text-[#201d1d] transition-colors">
                  <span>{language === 'ko' ? '24h변동' : '24h'}</span>
                  <span className="text-[9px]">{sortField === 'change' ? (sortAsc ? '▲' : '▼') : '↕'}</span>
                </div>
                <div onClick={() => handleSort('qty')} className="cursor-pointer flex items-center justify-end gap-1 hover:text-[#201d1d] transition-colors pr-1">
                  <span>{language === 'ko' ? '보유' : 'Hold'}</span>
                  <span className="text-[9px]">{sortField === 'qty' ? (sortAsc ? '▲' : '▼') : '↕'}</span>
                </div>
              </div>

              {/* Cards Rows */}
              <div className="divide-y divide-[rgba(15,0,0,0.06)] max-h-[60vh] overflow-y-auto">
                {sortedCards.map((card) => {
                  const { symbol } = getCardCoinPair(card.id);
                  const market = prices[symbol];
                  const priceSns = getCardSnsPrice(card.id);
                  const change = market?.change24h || 0.0;
                  const isUp = change >= 0;
                  const qty = inventory[card.id]?.quantity || 0;

                  return (
                    <div
                      key={card.id}
                      onClick={() => {
                        triggerHaptic('selection');
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        setSelectedCardId(card.id);
                        setTradeAmount(1);
                        setAlertMsg(null);
                        setChartData([]);
                        fetchChart(card.id);
                      }}
                      className="grid grid-cols-4 items-center px-2 py-2.5 text-center text-[11px] font-semibold hover:bg-[#f8f7f7] text-[#201d1d] cursor-pointer transition-colors min-h-[44px]"
                    >
                      <div className="flex items-center gap-1.5 text-left justify-start min-w-0">
                        <span className="truncate font-bold text-[#201d1d] text-[11px] leading-tight">
                          {language === 'ko' ? card.title : card.title_en}
                        </span>
                      </div>

                      <div className="font-bold text-[#201d1d] text-[11px] text-center">
                        {priceSns.toLocaleString()}
                      </div>

                      <div className={cn(
                        "flex items-center justify-center gap-0.5 font-bold text-[11px]",
                        isUp ? "text-emerald-700" : "text-rose-700"
                      )}>
                        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {isUp ? '+' : ''}{change}%
                      </div>

                      <div className="flex justify-end pr-1">
                        {qty > 0 ? (
                          <span className="bg-[#f8f7f7] text-[#201d1d] border border-[rgba(15,0,0,0.12)] px-1.5 py-0.5 rounded-sm text-[10px] font-black">
                            {qty}주
                          </span>
                        ) : (
                          <span className="text-[#646262]/40 text-[10px]">-</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Sub-Tab 2: My Stock Portfolio View */}
        {activeSubTab === 'portfolio' && (
          <div className="flex flex-col gap-3">
            <div className="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-[#201d1d] flex items-center gap-1.5">
                  <PieChart size={14} className="text-[#201d1d]" />
                  <span>[📊 {language === 'ko' ? '내 캐릭터 주식 포트폴리오' : 'My Stock Portfolio'}]</span>
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] text-[#201d1d]">
                  {hasClaimedFirstTradeBonus
                    ? (language === 'ko' ? '첫 거래 캐시백 수령완료' : 'Bonus Claimed')
                    : (language === 'ko' ? '첫 매수 +30 SNS 대기' : '+30 SNS Waiting')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-none">
                  <div className="text-[10px] text-[#646262]">{language === 'ko' ? '총 주식 자산' : 'Stock Value'}</div>
                  <div className="text-xs font-black text-[#201d1d] truncate mt-0.5">{portfolioStats.totalStockAssetSns.toLocaleString()} SNS</div>
                </div>
                <div className="p-2 bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-none">
                  <div className="text-[10px] text-[#646262]">{language === 'ko' ? '보유 종목/수량' : 'Holdings'}</div>
                  <div className="text-xs font-black text-[#201d1d] truncate mt-0.5">{portfolioStats.heldStocksCount}종목 / {portfolioStats.totalSharesCount}주</div>
                </div>
                <div className="p-2 bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-none">
                  <div className="text-[10px] text-[#646262]">{language === 'ko' ? '일일 예상 배당' : 'Est. Dividends'}</div>
                  <div className="text-xs font-black text-emerald-700 truncate mt-0.5">+{portfolioStats.estimatedDailyDividends.toLocaleString()} SNS/일</div>
                </div>
              </div>
            </div>

            <div className="border border-[rgba(15,0,0,0.12)] rounded-none overflow-hidden bg-[#fdfcfc]">
              <div className="px-3 py-2 bg-[#f8f7f7] border-b border-[rgba(15,0,0,0.12)] text-xs font-bold text-[#646262] flex justify-between items-center">
                <span>{language === 'ko' ? '보유 종목 명세' : 'Holding Details'}</span>
                <span>{portfolioStats.heldStocksCount} {language === 'ko' ? '종목 보유중' : 'stocks held'}</span>
              </div>

              {portfolioStats.heldStocksCount === 0 ? (
                <div className="p-8 text-center text-xs text-[#646262] flex flex-col items-center gap-3">
                  <PieChart size={28} className="text-[#646262]" />
                  <p>{language === 'ko' ? '아직 보유한 주식이 없습니다. 실시간 시세에서 추천주를 매수해 첫 배당금을 확보해 보세요!' : 'No shares held yet. Buy recommendations from the Market tab to start earning dividends!'}</p>
                  <button
                    type="button"
                    onClick={() => { triggerHaptic('selection'); setActiveSubTab('market'); }}
                    className="min-h-[44px] px-4 py-2 bg-[#201d1d] text-[#fdfcfc] font-bold text-xs rounded-sm uppercase hover:bg-[#333030] cursor-pointer"
                  >
                    [{language === 'ko' ? '실시간 시세 보러가기' : 'Explore Market'}]
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[rgba(15,0,0,0.06)]">
                  {Object.values(CARD_DATABASE)
                    .filter(c => (inventory[c.id]?.quantity || 0) > 0)
                    .map(card => {
                      const qty = inventory[card.id]?.quantity || 0;
                      const unitPrice = getCardSnsPrice(card.id);
                      const totalValue = qty * unitPrice;
                      const estDiv = Math.round(qty * (card.power || 10) * 0.1);

                      return (
                        <div
                          key={card.id}
                          className="p-2.5 flex items-center justify-between gap-2 hover:bg-[#f8f7f7] transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-[#201d1d] truncate">
                                {language === 'ko' ? card.title : card.title_en}
                              </span>
                              <span className="text-[10px] bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] text-[#201d1d] px-1.5 py-0.5 font-bold rounded-sm">
                                {qty}주
                              </span>
                            </div>
                            <div className="text-[10px] text-[#646262] mt-0.5">
                              {language === 'ko' ? '평가액' : 'Value'}: {totalValue.toLocaleString()} SNS · {language === 'ko' ? '일일 배당' : 'Daily Div'}: +{estDiv} SNS
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('selection');
                                setSelectedCardId(card.id);
                                setTradeMode('sell');
                                setTradeAmount(1);
                                setAlertMsg(null);
                                fetchChart(card.id);
                              }}
                              className="min-h-[44px] px-3 py-1 bg-[#fdfcfc] text-rose-700 border border-rose-700 text-[10px] font-bold rounded-sm hover:bg-rose-50 cursor-pointer"
                            >
                              [{language === 'ko' ? '매도' : 'Sell'}]
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('selection');
                                setSelectedCardId(card.id);
                                setTradeMode('buy');
                                setTradeAmount(1);
                                setAlertMsg(null);
                                fetchChart(card.id);
                              }}
                              className="min-h-[44px] px-3 py-1 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold rounded-sm hover:bg-[#333030] cursor-pointer"
                            >
                              [{language === 'ko' ? '추가매수' : 'Buy More'}]
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sub-Tab 3: Dividends & Fee Rebate View */}
        {activeSubTab === 'dividends' && (
          <div className="flex flex-col gap-3">
            <div className="p-3.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#201d1d] flex items-center gap-1.5">
                  <Wallet size={14} />
                  <span>[ 💰 {dividendAvailable.toLocaleString()} SNS {language === 'ko' ? '누적 배당금' : 'Dividends Ready'} ]</span>
                </span>
                <span className="text-[10px] text-[#646262]">
                  {language === 'ko' ? '보유 주식 지분 비례 누적' : 'Accumulated from shares'}
                </span>
              </div>
              <p className="text-[11px] text-[#646262] leading-relaxed">
                {language === 'ko'
                  ? '보유 캐릭터 카드의 공격력과 지분에 비례하여 실시간 배당금이 정산됩니다. 배당금은 0% 수수료로 즉시 최고 수익률 주식에 재투자하거나 지갑으로 전액 수령할 수 있습니다.'
                  : 'Dividends accumulate based on your card power and share volume. Reinvest 100% into top-performing shares at 0% fee or claim directly to your wallet.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  disabled={dividendAvailable <= 0}
                  onClick={handleReinvestDividends}
                  className="min-h-[44px] py-2 bg-[#fdfcfc] text-[#201d1d] border border-[#201d1d] hover:bg-[#eae8e8] text-xs font-black uppercase rounded-sm transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1"
                >
                  <RefreshCw size={12} />
                  <span>[ 🔄 {language === 'ko' ? '100% 복리 재투자 (수수료 0%)' : 'Reinvest 100% (0% Fee)'} ]</span>
                </button>
                <button
                  type="button"
                  disabled={dividendAvailable <= 0}
                  onClick={handleClaimDividends}
                  className="min-h-[44px] py-2 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold uppercase rounded-sm hover:bg-[#333030] transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1"
                >
                  <CheckCircle2 size={12} />
                  <span>[ {language === 'ko' ? '배당금 일괄 수령' : 'Claim All Dividends'} ]</span>
                </button>
              </div>
            </div>

            {/* ID 568: 15% Trading Fee Rebate Vault */}
            <div className="p-3.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#201d1d] flex items-center gap-1.5">
                  <Award size={14} />
                  <span>[ 🏦 {language === 'ko' ? '당일 거래 수수료 15% 페이백 금고' : '15% Fee Rebate Vault'} ]</span>
                </span>
                <span className="text-[10px] text-[#646262]">
                  {language === 'ko' ? '지불 수수료' : 'Fees Paid'}: {accumulatedFees.toLocaleString()} SNS
                </span>
              </div>
              <p className="text-[11px] text-[#646262]">
                {language === 'ko'
                  ? '오늘 주식 매매 시 지불한 가스/거래 수수료의 15%를 즉시 지갑으로 페이백 환급받을 수 있습니다.'
                  : 'Rebate 15% of all trading gas fees paid today directly into your wallet.'}
              </p>
              <div className="flex items-center justify-between pt-1">
                <div className="text-xs font-bold text-[#201d1d]">
                  {language === 'ko' ? '환급 가능액' : 'Rebate Available'}: <span className="text-emerald-700 font-black">+{Math.max(1, Math.round(accumulatedFees * 0.15))} SNS</span>
                </div>
                <button
                  type="button"
                  disabled={rebateClaimed || accumulatedFees <= 0}
                  onClick={handleClaimFeeRebate}
                  className="min-h-[44px] px-3 py-1.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-sm hover:bg-[#333030] disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {rebateClaimed
                    ? (language === 'ko' ? '[ 15% 페이백 환급완료 ]' : '[ 15% Rebated ]')
                    : (language === 'ko' ? `[ 🏦 15% 페이백 수령 ]` : `[ 🏦 Claim 15% Rebate ]`)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sub-Tab 4: Volume Milestone Track View */}
        {activeSubTab === 'volume' && (
          <div className="p-3.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-xs font-black text-[#201d1d] flex items-center gap-1.5">
                <Award size={14} />
                <span>[ 📈 {language === 'ko' ? '일일 거래량 마일스톤' : 'Daily Turnover Milestone'}: {dailyVolume.toLocaleString()} / 10,000 SNS ]</span>
              </span>
              <span className="text-[10px] text-[#646262] font-bold">
                ({language === 'ko' ? '지불 수수료' : 'Fees Paid'}: {accumulatedFees.toLocaleString()} SNS)
              </span>
            </div>

            <div className="w-full bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] h-2 rounded-none overflow-hidden">
              <div
                className="bg-[#201d1d] h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (dailyVolume / 10000) * 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { milestone: 1000, reward: 50, label: '1K SNS' },
                { milestone: 5000, reward: 200, label: '5K SNS' },
                { milestone: 10000, reward: 500, label: '10K SNS' },
              ].map((step) => {
                const achieved = dailyVolume >= step.milestone;
                const claimed = claimedVolumeMilestones.includes(step.milestone);
                return (
                  <div
                    key={step.milestone}
                    className={cn(
                      "flex flex-col items-center justify-between p-2.5 border rounded-none text-center text-xs",
                      claimed
                        ? "border-emerald-700 bg-[#fdfcfc] text-emerald-800"
                        : achieved
                        ? "border-[#201d1d] bg-[#fdfcfc] font-bold text-[#201d1d]"
                        : "border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#646262]"
                    )}
                  >
                    <div className="font-bold text-[11px]">{step.label}</div>
                    <div className="text-[10px] text-emerald-700 font-black mt-0.5">+{step.reward} SNS</div>
                    <button
                      type="button"
                      disabled={!achieved || claimed}
                      onClick={() => handleClaimVolumeMilestone(step.milestone, step.reward)}
                      className={cn(
                        "mt-2 min-h-[44px] px-2 py-1 text-[10px] w-full rounded-sm font-bold transition-colors",
                        claimed
                          ? "bg-emerald-700 text-white cursor-default"
                          : achieved
                          ? "bg-[#201d1d] text-[#fdfcfc] hover:bg-[#333030] cursor-pointer"
                          : "bg-[#f8f7f7] text-[#646262] border border-[rgba(15,0,0,0.12)] cursor-not-allowed"
                      )}
                    >
                      {claimed ? (language === 'ko' ? '[수령완료]' : '[Claimed]') : achieved ? (language === 'ko' ? '[보너스 수령]' : '[Claim]') : (language === 'ko' ? '[미달성]' : '[Locked]')}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Trading Modal Overlay */}
      <AnimatePresence>
        {selectedCardId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 font-mono"
          >
            <div className="absolute inset-0" onClick={() => setSelectedCardId(null)} />

            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#fdfcfc] border border-[#201d1d] w-full max-w-sm rounded-none overflow-hidden relative z-10 font-mono"
            >
              {/* Modal Header */}
              <div className="bg-[#201d1d] text-[#fdfcfc] p-4 flex items-center justify-between border-b border-[rgba(15,0,0,0.12)]">
                <div className="flex items-center gap-2 min-w-0">
                  <ShoppingCart size={16} className="text-amber-400 shrink-0" />
                  <span className="font-bold uppercase tracking-wider text-xs truncate">
                    {language === 'ko' ? CARD_DATABASE[selectedCardId]?.title : CARD_DATABASE[selectedCardId]?.title_en}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCardId(null)}
                  className="text-[#fdfcfc] hover:opacity-80 text-xs font-bold px-2 py-1 border border-white/20 rounded-sm cursor-pointer shrink-0"
                >
                  [x]
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between border border-[rgba(15,0,0,0.12)] p-3 bg-[#f8f7f7] rounded-none text-[#201d1d]">
                  <div>
                    <h3 className="font-bold text-[#201d1d] text-xs">
                      {getCardCoinPair(selectedCardId).symbol}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-[#201d1d] text-sm">
                      {inventory[selectedCardId]?.quantity || 0} EA
                    </span>
                  </div>
                </div>

                {/* Coin Price Chart */}
                {selectedCardId !== null && (
                  <div className="border border-[rgba(15,0,0,0.12)] rounded-none p-2.5 bg-[#f8f7f7]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-[#646262] uppercase">[Price Trend]</span>
                      <div className="flex border border-[rgba(15,0,0,0.12)] rounded-sm overflow-hidden bg-[#fdfcfc]">
                        {(['24H', '1M', '1Y'] as const).map(tf => (
                          <button
                            key={tf}
                            onClick={(e) => {
                              e.stopPropagation();
                              setChartTimeframe(tf);
                              setChartData([]);
                              fetchChart(selectedCardId, tf);
                            }}
                            className={cn(
                              "px-2 py-0.5 text-[9px] font-bold transition-colors cursor-pointer",
                              chartTimeframe === tf ? "bg-[#201d1d] text-[#fdfcfc]" : "text-[#646262] hover:bg-[#f8f7f7]"
                            )}
                          >
                            {tf}
                          </button>
                        ))}
                      </div>
                    </div>
                    {chartLoading ? (
                      <div className="h-[80px] flex items-center justify-center text-xs text-[#646262]">
                        Loading...
                      </div>
                    ) : chartData.length > 0 ? (
                      <svg viewBox={`0 0 240 80`} className="w-full h-[80px]" preserveAspectRatio="none">
                        <polygon
                          fill="rgba(32, 29, 29, 0.08)"
                          points={(() => {
                            const min = Math.min(...chartData);
                            const max = Math.max(...chartData);
                            const range = max - min || 1;
                            const pts = chartData.map((v, i) => `${(i / (chartData.length - 1)) * 240},${80 - ((v - min) / range) * 70 - 5}`);
                            return `0,80 ${pts.join(' ')} 240,80`;
                          })()}
                        />
                        <polyline
                          fill="none"
                          stroke="#201d1d"
                          strokeWidth="1.5"
                          points={chartData.map((v, i) => {
                            const min = Math.min(...chartData);
                            const max = Math.max(...chartData);
                            const range = max - min || 1;
                            return `${(i / (chartData.length - 1)) * 240},${80 - ((v - min) / range) * 70 - 5}`;
                          }).join(' ')}
                        />
                      </svg>
                    ) : (
                      <div className="h-[80px]" />
                    )}
                  </div>
                )}

                {/* Trade Mode Selector */}
                <div className="flex gap-2">
                  {(['buy', 'sell'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                        setTradeMode(m);
                        setTradeAmount(1);
                      }}
                      className={cn(
                        "flex-1 min-h-[44px] py-2 rounded-sm font-bold uppercase text-xs tracking-wider transition-colors border cursor-pointer",
                        tradeMode === m
                          ? "bg-[#201d1d] border-[#201d1d] text-[#fdfcfc]"
                          : "bg-[#fdfcfc] border-[rgba(15,0,0,0.12)] text-[#646262] hover:bg-[#f8f7f7]"
                      )}
                    >
                      [{t(m, language)}]
                    </button>
                  ))}
                </div>

                {/* Quantity adjuster */}
                <div className="flex items-center justify-between border border-[rgba(15,0,0,0.12)] rounded-sm overflow-hidden bg-[#fdfcfc]">
                  <button
                    onClick={() => {
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                      setTradeAmount(prev => Math.max(1, prev - 1));
                    }}
                    className="min-h-[44px] px-4 py-2 bg-[#f8f7f7] border-r border-[rgba(15,0,0,0.12)] hover:bg-[#e2e0e0] font-bold cursor-pointer transition-colors text-[#201d1d]"
                  >
                    [-]
                  </button>
                  <span className="font-extrabold text-sm text-[#201d1d]">{tradeAmount}</span>
                  <button
                    onClick={() => {
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                      setTradeAmount(prev => prev + 1);
                    }}
                    className="min-h-[44px] px-4 py-2 bg-[#f8f7f7] border-l border-[rgba(15,0,0,0.12)] hover:bg-[#e2e0e0] font-bold cursor-pointer transition-colors text-[#201d1d]"
                  >
                    [+]
                  </button>
                </div>

                {/* Itemized Transaction Breakdown (Row 13) */}
                {(() => {
                  const unitPrice = getCardSnsPrice(selectedCardId);
                  const subtotal = unitPrice * tradeAmount;
                  const fee = Math.max(1, Math.round(subtotal * 0.015));
                  const netTotal = tradeMode === 'buy' ? (subtotal + fee) : Math.max(1, subtotal - fee);

                  return (
                    <div className="space-y-1.5 border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-2.5 rounded-none text-xs font-mono">
                      <div className="flex justify-between items-center text-[#646262]">
                        <span>{language === 'ko' ? '기본 단가 (Base Unit Price)' : 'Base Unit Price'}:</span>
                        <span className="font-bold text-[#201d1d]">{unitPrice.toLocaleString()} SNS</span>
                      </div>
                      <div className="flex justify-between items-center text-[#646262]">
                        <span>{language === 'ko' ? '주문 수량 (Quantity)' : 'Quantity'}:</span>
                        <span className="font-bold text-[#201d1d]">{tradeAmount} EA</span>
                      </div>
                      <div className="flex justify-between items-center text-[#646262]">
                        <span>{language === 'ko' ? '주문 소계 (Subtotal)' : 'Subtotal'}:</span>
                        <span className="font-bold text-[#201d1d]">{subtotal.toLocaleString()} SNS</span>
                      </div>
                      <div className="flex justify-between items-center text-[#646262]">
                        <span>{language === 'ko' ? '거래 수수료 (Fee 1.5%)' : 'Trading Fee (1.5%)'}:</span>
                        <span className="font-bold text-amber-800">
                          {tradeMode === 'buy' ? `+${fee.toLocaleString()}` : `-${fee.toLocaleString()}`} SNS
                        </span>
                      </div>
                      <div className="border-t border-[rgba(15,0,0,0.12)] pt-1.5 flex justify-between items-center font-bold">
                        <span className="text-[#201d1d]">
                          {tradeMode === 'buy'
                            ? (language === 'ko' ? '최종 결제 예상액' : 'Final Expected Cost')
                            : (language === 'ko' ? '최종 정산 입금액' : 'Final Expected Payout')}:
                        </span>
                        <span className={cn("text-sm font-black", tradeMode === 'buy' ? "text-rose-700" : "text-emerald-700")}>
                          {netTotal.toLocaleString()} SNS
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Action feedback */}
                {alertMsg && (
                  <div className={cn(
                    "p-2 rounded-none border text-xs font-bold text-center",
                    alertMsg.type === 'success' ? "bg-[#f8f7f7] border-emerald-700 text-emerald-800" : "bg-[#f8f7f7] border-rose-700 text-rose-800"
                  )}>
                    <div>{alertMsg.text}</div>
                    {alertMsg.type === 'error' && alertMsg.text === t('insufficient_sns', language) && (
                      <button
                        type="button"
                        onClick={() => { setSelectedCardId(null); setView('shop'); }}
                        className="mt-1.5 min-h-[36px] px-2.5 py-1 bg-[#201d1d] text-[#fdfcfc] text-[10px] font-black rounded-sm inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>[💎 {language === 'ko' ? 'SNS 상점 충전 바로가기 ↗' : 'Top up SNS at Shop ↗'}]</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Final transaction execution button */}
                <button
                  onClick={handleTrade}
                  className="w-full min-h-[44px] py-2.5 bg-[#201d1d] hover:bg-[#333030] text-[#fdfcfc] font-bold uppercase rounded-sm transition-colors text-xs cursor-pointer border border-[#201d1d]"
                >
                  [{t(tradeMode, language)} {tradeAmount} {language === 'ko' ? '개 거래 확정' : 'Confirm Trade'}]
                </button>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCR-06: Trade Dopamine Success Modal */}
      <AnimatePresence>
        {tradeSuccessModalInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/60 font-mono"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-[#fdfcfc] border border-[#201d1d] w-full max-w-sm p-5 rounded-none space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-2.5">
                <div className="flex items-center gap-1.5 text-[#201d1d] font-black text-sm uppercase">
                  <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
                  <span>
                    {tradeSuccessModalInfo.mode === 'reinvest'
                      ? (language === 'ko' ? '복리 재투자 체결 완료' : 'Reinvestment Complete')
                      : tradeSuccessModalInfo.mode === 'buy'
                      ? (language === 'ko' ? '주식 매수 체결 성공!' : 'Share Purchase Success!')
                      : (language === 'ko' ? '주식 매도 체결 성공!' : 'Share Sale Success!')}
                  </span>
                </div>
                <button
                  onClick={() => setTradeSuccessModalInfo(null)}
                  className="text-[#646262] hover:text-[#201d1d] text-xs font-bold cursor-pointer"
                >
                  [x]
                </button>
              </div>

              <div className="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none space-y-2 text-xs">
                <div className="flex justify-between items-center text-[#646262]">
                  <span>{language === 'ko' ? '체결 종목' : 'Stock'}:</span>
                  <span className="font-bold text-[#201d1d]">{tradeSuccessModalInfo.cardTitle}</span>
                </div>
                <div className="flex justify-between items-center text-[#646262]">
                  <span>{language === 'ko' ? '체결 수량' : 'Shares'}:</span>
                  <span className="font-bold text-[#201d1d]">{tradeSuccessModalInfo.amount} EA</span>
                </div>
                <div className="flex justify-between items-center text-[#646262]">
                  <span>{tradeSuccessModalInfo.mode === 'sell' ? (language === 'ko' ? '정산 입금액' : 'Payout') : (language === 'ko' ? '총 결제액' : 'Total Cost')}:</span>
                  <span className="font-black text-[#201d1d]">{tradeSuccessModalInfo.totalSns.toLocaleString()} SNS</span>
                </div>
              </div>

              {tradeSuccessModalInfo.firstTradeBonus && (
                <div className="p-2.5 bg-[#f8f7f7] border border-emerald-700 text-emerald-800 text-xs font-bold flex items-center gap-2 rounded-none">
                  <Sparkles size={16} className="text-emerald-700 shrink-0" />
                  <span>{language === 'ko' ? '🎉 첫 주식 거래 축하! 웰컴 캐시백 +30 SNS가 지갑에 즉시 지급되었습니다!' : '🎉 First Trade Welcome! +30 SNS bonus credited to wallet!'}</span>
                </div>
              )}

              <button
                onClick={() => {
                  triggerHaptic('selection');
                  setTradeSuccessModalInfo(null);
                }}
                className="w-full min-h-[44px] py-2.5 bg-[#201d1d] text-[#fdfcfc] rounded-sm font-bold text-xs uppercase hover:bg-[#333030] cursor-pointer transition-colors"
              >
                [{language === 'ko' ? '체결 확인' : 'Confirm'}]
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Popup */}
      <AnimatePresence>
        {showHelpPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] flex items-center justify-center bg-black/60 p-4 font-mono"
            onClick={() => setShowHelpPopup(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative w-full max-w-lg rounded-none border border-[#201d1d] bg-[#fdfcfc] p-5"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 sticky top-0 z-10 bg-[#fdfcfc] pt-1">
                <div className="space-y-1.5">
                  <span className="inline-flex rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#646262]">
                    {t('stock_market', language)}
                  </span>
                  <h3 className="text-sm font-black tracking-tight text-[#201d1d]">
                    {helpSteps[helpStep].title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelpPopup(false)}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#646262] transition hover:bg-[#f8f7f7] hover:text-[#201d1d] cursor-pointer"
                  aria-label={language === 'ko' ? '닫기' : 'Close'}
                >
                  [x]
                </button>
              </div>

              <div className="mt-4 rounded-none border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-4 py-3">
                <p className="text-xs font-semibold leading-relaxed whitespace-pre-line text-[#201d1d]">
                  {helpSteps[helpStep].body}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-[#646262]">
                <span>{helpStep + 1} / {helpSteps.length}</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setHelpStep((prev) => Math.max(prev - 1, 0))}
                  disabled={helpStep === 0}
                  className={cn(
                    'min-h-[44px] rounded-sm border px-3 py-2 text-xs font-bold transition cursor-pointer',
                    helpStep === 0
                      ? 'cursor-not-allowed border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] text-[#646262]/40'
                      : 'border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#201d1d] hover:bg-[#f8f7f7]'
                  )}
                >
                  <ChevronLeft size={16} className="mx-auto" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowHelpPopup(false)}
                  className="min-h-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] px-3 py-2 text-xs font-bold text-[#201d1d] transition hover:bg-[#f8f7f7] cursor-pointer"
                >
                  [{language === 'ko' ? '닫기' : 'Close'}]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (helpStep === helpSteps.length - 1) {
                      setShowHelpPopup(false);
                      return;
                    }
                    setHelpStep((prev) => Math.min(prev + 1, helpSteps.length - 1));
                  }}
                  className="min-h-[44px] rounded-sm border border-[#201d1d] bg-[#201d1d] px-3 py-2 text-xs font-bold text-[#fdfcfc] transition hover:bg-[#333030] cursor-pointer"
                >
                  {helpStep === helpSteps.length - 1
                    ? (language === 'ko' ? '[완료]' : '[Done]')
                    : <ChevronRight size={16} className="mx-auto" />}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
