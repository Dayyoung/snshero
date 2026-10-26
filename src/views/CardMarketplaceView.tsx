import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X, ChevronLeft, ChevronRight, TrendingUp, SlidersHorizontal, Sparkles, Bell, Bookmark, Zap, Gift, CheckCircle2, Flame, ArrowUpRight } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';
import { isSfxMutedGlobal } from '../lib/sound';
import { CARD_DATABASE } from '../cardDatabase';
import { getMarketplaceFeePolicy, calculateMarketplaceSettlement } from '../content/marketplaceFees';
import { MarketplacePriceBand } from '../lib/MarketplacePriceBand';
import { PageHeader } from '../components/PageHeader';
import { MarketplaceCardTradeModal } from '../components/MarketplaceCardTradeModal';
import { MarketEscrowModal } from '../components/MarketEscrowModal';
import { MarketSparkline } from '../components/MarketSparkline';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';
import type { DatabaseCard, InventoryRecord, Language, Listing, Offer, TradeAuditLog, TradeStatus, ViewType } from '../types';
import { createMarketWebMcpTools, useWebMcpTools } from '../lib/webMcp/index';

interface CardMarketplaceViewProps {
  language: Language;
  setView: (view: ViewType) => void;
  inventory: Record<number, InventoryRecord>;
  user: { uid: string; displayName?: string | null } | null;
  currentSeason: string;
  lowSpecMode?: boolean;
}

interface MarketplaceState {
  listings: Listing[];
  offers: Offer[];
  auditLogs: TradeAuditLog[];
  counter: number;
}

const STORAGE_BASE_KEY = 'hero_card_marketplace_state';
const MARKETPLACE_NPCS = ['Aurora Deck', 'Guild Vault', 'Nebula Trader', 'Rune Broker'];
const SEEDED_CARD_IDS = [110, 109, 96, 88];

type RarityFilter = 'all' | 'bronze' | 'silver' | 'gold';
type BuildFocusFilter = 'all' | 'tempo' | 'burst' | 'fortress' | 'control' | 'support';

const BUILD_FOCUS_FILTERS: BuildFocusFilter[] = ['all', 'tempo', 'burst', 'fortress', 'control', 'support'];

const getCardBuildFocus = (card?: DatabaseCard): Exclude<BuildFocusFilter, 'all'> => {
  if (!card?.ability) {
    return (card?.power || 0) >= 28 ? 'burst' : 'tempo';
  }

  switch (card.ability.type) {
    case 'POWER_BOOST':
    case 'REINFORCE':
    case 'OMNIBOOST':
      return 'support';
    case 'SHIELD':
    case 'WALL':
    case 'IMMUNITY':
      return 'fortress';
    case 'WEAKEN':
    case 'TIME_WARP':
    case 'COUNTER':
      return 'control';
    case 'PIERCE':
      return 'burst';
    default:
      return (card.power || 0) >= 28 ? 'burst' : 'tempo';
  }
};

const buildStorageKey = (season: string) => `${STORAGE_BASE_KEY}_${season}`;

const getNowIso = () => new Date().toISOString();

const getCardTitle = (cardId: number) => {
  const card = CARD_DATABASE[cardId];
  return card?.title_dis || card?.title || `Card #${cardId}`;
};

const seedListingsForSeason = (season: string): Listing[] =>
  SEEDED_CARD_IDS.map((cardId, index) => ({
    id: `seed-${season}-${cardId}`,
    cardId,
    sellerId: `seed-seller-${index + 1}`,
    sellerName: MARKETPLACE_NPCS[index] || `Trader ${index + 1}`,
    season,
    askPrice: [185000, 124000, 8900, 5400][index] || 3000,
    status: 'active',
    source: 'seed',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  }));

const loadMarketplaceState = (season: string): MarketplaceState => {
  const seededListings = seedListingsForSeason(season);
  if (typeof window === 'undefined') {
    return {
      listings: seededListings,
      offers: [],
      auditLogs: [],
      counter: 1,
    };
  }

  try {
    const raw = window.localStorage.getItem(buildStorageKey(season));
    if (!raw) {
      return {
        listings: seededListings,
        offers: [],
        auditLogs: [],
        counter: 1,
      };
    }

    const parsed = JSON.parse(raw) as Partial<MarketplaceState>;
    const listingMap = new Map<string, Listing>();
    seededListings.forEach((listing) => listingMap.set(listing.id, listing));
    (parsed.listings || []).forEach((listing) => listingMap.set(listing.id, listing));

    return {
      listings: Array.from(listingMap.values()),
      offers: parsed.offers || [],
      auditLogs: parsed.auditLogs || [],
      counter: parsed.counter || 1,
    };
  } catch {
    return {
      listings: seededListings,
      offers: [],
      auditLogs: [],
      counter: 1,
    };
  }
};

const saveMarketplaceState = (season: string, state: MarketplaceState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(buildStorageKey(season), JSON.stringify(state));
};

const HELP_STEPS = [
  { titleKey: 'marketplace_help_browse', descKey: 'marketplace_help_browse_desc' },
  { titleKey: 'marketplace_help_create', descKey: 'marketplace_help_create_desc' },
  { titleKey: 'marketplace_help_manage', descKey: 'marketplace_help_manage_desc' },
];

export const CardMarketplaceView: React.FC<CardMarketplaceViewProps> = ({
  language,
  setView,
  inventory,
  user,
  currentSeason,
  lowSpecMode = false,
}) => {
  const userId = user?.uid || 'guest-id';
  const userName = user?.displayName?.trim() || (language === 'ko' ? '플레이어' : 'Player');
  const isGuest = userId === 'guest-id';
  const isOfflineMode = typeof window !== 'undefined' && window.localStorage.getItem('hero_offline_mode') === 'true';

  const [marketState, setMarketState] = useState<MarketplaceState>(() => loadMarketplaceState(currentSeason));
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all');
  const [buildFocusFilter, setBuildFocusFilter] = useState<BuildFocusFilter>('all');
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [listingPriceInput, setListingPriceInput] = useState('2500');
  const [feedbackKey, setFeedbackKey] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (helpOpen) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [helpOpen]);

  const [helpStep, setHelpStep] = useState(0);
  const [tradeModalListing, setTradeModalListing] = useState<Listing | null>(null);
  const [tradeTypeFilter, setTradeTypeFilter] = useState<'all' | 'instant' | 'auction'>('all');
  const [elementFilter, setElementFilter] = useState<'all' | 'FIRE' | 'WATER' | 'EARTH' | 'WIND'>('all');

  // ID 338: 3단계 안전 에스크로 확인 모달 상태
  const [escrowListing, setEscrowListing] = useState<Listing | null>(null);
  const [isEscrowModalOpen, setIsEscrowModalOpen] = useState(false);

  // ID 383: 상하좌우 4방향 스탯 수치 슬라이더 필터 상태 (0~10)
  const [minStatUp, setMinStatUp] = useState<number>(0);
  const [minStatRight, setMinStatRight] = useState<number>(0);
  const [minStatDown, setMinStatDown] = useState<number>(0);
  const [minStatLeft, setMinStatLeft] = useState<number>(0);
  const [showDirectionSliders, setShowDirectionSliders] = useState<boolean>(false);

  // Row 1054 / ID 317: Watchlist & Price Notification
  const [watchlist, setWatchlist] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem('hero_market_watchlist_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });
  const [priceAlertToast, setPriceAlertToast] = useState<string | null>(null);

  // ID 523: 희망 매수가 자동 매수 예약 (Auto-Buy)
  const [autoBuyOrders, setAutoBuyOrders] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem(`hero_auto_buy_orders_${currentSeason}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [autoBuyModalCardId, setAutoBuyModalCardId] = useState<number | null>(null);
  const [autoBuyTargetPrice, setAutoBuyTargetPrice] = useState<number>(3000);
  const [autoBuySuccessMsg, setAutoBuySuccessMsg] = useState<string | null>(null);

  // ID 558: 가스비 100% 캐시백 토스트
  const [gasRebateNotice, setGasRebateNotice] = useState<number | null>(null);

  // SCR-05 UX: 모바일 서브 탭바 상태 ('browse' | 'create' | 'my_listings' | 'auto_buy')
  const [activeSubTab, setActiveSubTab] = useState<'browse' | 'create' | 'my_listings' | 'auto_buy'>('browse');

  // SCR-05 Monetization: 유저 보유 실시간 SNS 잔액 연동
  const [userSns, setUserSns] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return Number(localStorage.getItem('hero_sns') || localStorage.getItem('hero_sns_points') || '0');
  });

  useEffect(() => {
    const handleSyncSns = () => {
      setUserSns(Number(localStorage.getItem('hero_sns') || localStorage.getItem('hero_sns_points') || '0'));
    };
    window.addEventListener('snshero_currency_updated', handleSyncSns);
    window.addEventListener('snshero_sns_updated', handleSyncSns);
    window.addEventListener('storage', handleSyncSns);
    return () => {
      window.removeEventListener('snshero_currency_updated', handleSyncSns);
      window.removeEventListener('snshero_sns_updated', handleSyncSns);
      window.removeEventListener('storage', handleSyncSns);
    };
  }, []);

  // SCR-05 FTUE: 첫 거래 웰컴 보조금 (+50 SNS) 상태
  const [firstTradeRewardClaimed, setFirstTradeRewardClaimed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('hero_market_first_trade_reward') === 'true';
  });
  const [firstTradeBonusToast, setFirstTradeBonusToast] = useState<boolean>(false);
  const [tradeSuccessModalListing, setTradeSuccessModalListing] = useState<Listing | null>(null);

  // SCR-05 UA & Viral: 일일 1회 특가 매물 & 도전장 링크 공유 (+50 SNS)
  const todayStr = new Date().toISOString().slice(0, 10);
  const [marketViralShared, setMarketViralShared] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(`hero_market_viral_share_${todayStr}`) === 'true';
  });
  const [viralShareNotice, setViralShareNotice] = useState<string | null>(null);

  const handleShareMarketDeal = async () => {
    triggerHaptic('selection');
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://snshero.com';
    const shareUrl = `${origin}/?challenge=1-11-31-51-101&ref=market`;
    const dealName = hotBargainListing ? getCardTitle(hotBargainListing.listing.cardId) : 'SSR Legend Card';
    const shareText = language === 'ko'
      ? `[눈히어로.com P2P 마켓 특가] ${dealName} 급매물 발견! 지금 무설치 3초 결투장 대결하고 특가 카드를 획득하세요: ${shareUrl}`
      : `[SNSHero.com P2P Market Deal] ${dealName} spotted! Join the instant 3s duel and claim the deal: ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: language === 'ko' ? '눈히어로.com P2P 마켓 특가' : 'SNSHero.com P2P Market Deal', text: shareText, url: shareUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }
    } catch {
      try {
        await navigator.clipboard?.writeText(shareUrl);
      } catch {}
    }

    if (!marketViralShared) {
      try {
        localStorage.setItem(`hero_market_viral_share_${todayStr}`, 'true');
        const curSns = Number(localStorage.getItem('hero_sns') || localStorage.getItem('hero_sns_points') || '0');
        const nextSns = curSns + 50;
        localStorage.setItem('hero_sns', String(nextSns));
        setUserSns(nextSns);
        setMarketViralShared(true);
        window.dispatchEvent(new Event('snshero_currency_updated'));
        window.dispatchEvent(new Event('snshero_sns_updated'));
      } catch {}
      setViralShareNotice(
        language === 'ko'
          ? '[바이럴 보상 지급] 특가 매물 & 도전장 링크가 복사되었으며 +50 SNS가 지급되었습니다!'
          : '[Viral Bonus] Deal & challenge link copied! +50 SNS credited!'
      );
    } else {
      setViralShareNotice(
        language === 'ko'
          ? '[링크 복사 완료] 특가 매물 & 도전장 링크(?challenge=)가 클립보드에 복사되었습니다.'
          : '[Link Copied] Deal & challenge link (?challenge=) copied to clipboard.'
      );
    }
    setTimeout(() => setViralShareNotice(null), 4000);
  };

  const saveAutoBuyOrder = (cardId: number, targetPrice: number) => {
    setAutoBuyOrders((prev) => {
      const next = { ...prev, [cardId]: targetPrice };
      try {
        localStorage.setItem(`hero_auto_buy_orders_${currentSeason}`, JSON.stringify(next));
      } catch {}
      return next;
    });
    setAutoBuySuccessMsg(
      language === 'ko'
        ? `[Auto-Buy 예약 완료] #${cardId} 희망가 ${targetPrice.toLocaleString()} SNS 이하 매물 감지 시 자동 체결 대기`
        : `[Auto-Buy Limit Set] Card #${cardId} will auto-execute at <= ${targetPrice.toLocaleString()} SNS`
    );
    setTimeout(() => setAutoBuySuccessMsg(null), 4000);
    setAutoBuyModalCardId(null);
  };

  const removeAutoBuyOrder = (cardId: number) => {
    setAutoBuyOrders((prev) => {
      const next = { ...prev };
      delete next[cardId];
      try {
        localStorage.setItem(`hero_auto_buy_orders_${currentSeason}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleWatchlist = (cardId: number, targetPrice: number) => {
    setWatchlist((prev) => {
      const next = { ...prev };
      if (next[cardId]) {
        delete next[cardId];
      } else {
        next[cardId] = targetPrice;
      }
      try {
        localStorage.setItem('hero_market_watchlist_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // ID 523: Auto-Buy 자동 체결 & 감지
  useEffect(() => {
    if (Object.keys(autoBuyOrders).length === 0) return;
    marketState.listings.forEach((item) => {
      const limit = autoBuyOrders[item.cardId];
      if (limit && item.askPrice <= limit && item.status === 'active' && item.sellerId !== userId) {
        // 자동 체결 안내
        const cardName = CARD_DATABASE[item.cardId]?.title_dis || `Card #${item.cardId}`;
        setAutoBuySuccessMsg(
          language === 'ko'
            ? `[Auto-Buy 체결 알림] ${cardName} 희망가 ${limit.toLocaleString()} SNS 이하 매물 (${item.askPrice.toLocaleString()} SNS) 발견! 즉시 구매를 실행하세요!`
            : `[Auto-Buy Trigger] ${cardName} found at ${item.askPrice.toLocaleString()} SNS (Limit: ${limit.toLocaleString()} SNS)! Ready to execute!`
        );
        setTimeout(() => setAutoBuySuccessMsg(null), 6000);
      }
    });
  }, [marketState.listings, autoBuyOrders, userId, language]);

  // Check matching deals on watchlist
  useEffect(() => {
    const matched: string[] = [];
    marketState.listings.forEach((item) => {
      const target = watchlist[item.cardId];
      if (target && item.askPrice <= target && item.status === 'active') {
        const cardName = CARD_DATABASE[item.cardId]?.title_dis || `Card #${item.cardId}`;
        matched.push(
          language === 'ko'
            ? `🔔 관심 카드 [${cardName}] 매물이 목표가(${target.toLocaleString()} SNS) 이하인 ${item.askPrice.toLocaleString()} SNS에 등록되었습니다!`
            : `🔔 Watchlist Deal: [${cardName}] listed for ${item.askPrice.toLocaleString()} SNS (Target: ${target.toLocaleString()} SNS)!`
        );
      }
    });
    if (matched.length > 0 && !priceAlertToast) {
      setPriceAlertToast(matched[0]);
    }
  }, [marketState.listings, watchlist, language]);

  const feePolicy = useMemo(() => getMarketplaceFeePolicy(currentSeason), [currentSeason]);

  useEffect(() => {
    setMarketState(loadMarketplaceState(currentSeason));
  }, [currentSeason]);

  useEffect(() => {
    saveMarketplaceState(currentSeason, marketState);
  }, [currentSeason, marketState]);

  const inventoryCards = useMemo(() => {
    return (Object.entries(inventory) as Array<[string, InventoryRecord]>)
      .map(([cardId, record]) => ({
        cardId: Number(cardId),
        record,
        card: CARD_DATABASE[Number(cardId)],
      }))
      .filter((entry) => entry.record.quantity > 0 && entry.card)
      .sort((a, b) => (b.card?.power || 0) - (a.card?.power || 0));
  }, [inventory]);

  const activeOwnedListingCardIds = useMemo(() => {
    return new Set(
      marketState.listings
        .filter(
          (listing) =>
            listing.sellerId === userId &&
            (listing.status === 'active' || listing.status === 'pending' || listing.status === 'escrow'),
        )
        .map((listing) => listing.cardId),
    );
  }, [marketState.listings, userId]);

  const listableCards = useMemo(() => {
    return inventoryCards.filter((entry) => !activeOwnedListingCardIds.has(entry.cardId));
  }, [activeOwnedListingCardIds, inventoryCards]);

  useEffect(() => {
    if (listableCards.length === 0) {
      setSelectedCardId(null);
      return;
    }

    if (!selectedCardId || !listableCards.some((entry) => entry.cardId === selectedCardId)) {
      setSelectedCardId(listableCards[0].cardId);
    }
  }, [listableCards, selectedCardId]);

  const filteredListings = useMemo(() => {
    return marketState.listings
      .filter((listing) => listing.status === 'active' || listing.status === 'pending' || listing.status === 'escrow')
      .filter((listing) => {
        if (tradeTypeFilter === 'instant') return listing.status === 'active';
        if (tradeTypeFilter === 'auction') return listing.status === 'pending' || listing.status === 'escrow';
        return true;
      })
      .filter((listing) => {
        if (elementFilter === 'all') return true;
        return (CARD_DATABASE[listing.cardId]?.element || 'FIRE') === elementFilter;
      })
      .filter((listing) => {
        if (rarityFilter === 'all') return true;
        return CARD_DATABASE[listing.cardId]?.rarity === rarityFilter;
      })
      .filter((listing) => {
        if (buildFocusFilter === 'all') return true;
        return getCardBuildFocus(CARD_DATABASE[listing.cardId]) === buildFocusFilter;
      })
      // ID 383: 4방향 스탯 슬라이더 필터
      .filter((listing) => {
        const card = CARD_DATABASE[listing.cardId];
        if (!card) return false;
        const u = card.stats?.[0] ?? (card.stats as any)?.up ?? 0;
        const r = card.stats?.[1] ?? (card.stats as any)?.right ?? 0;
        const d = card.stats?.[2] ?? (card.stats as any)?.down ?? 0;
        const l = card.stats?.[3] ?? (card.stats as any)?.left ?? 0;
        if (minStatUp > 0 && u < minStatUp) return false;
        if (minStatRight > 0 && r < minStatRight) return false;
        if (minStatDown > 0 && d < minStatDown) return false;
        if (minStatLeft > 0 && l < minStatLeft) return false;
        return true;
      })
      .sort((a, b) => b.askPrice - a.askPrice);
  }, [buildFocusFilter, elementFilter, marketState.listings, minStatDown, minStatLeft, minStatRight, minStatUp, rarityFilter, tradeTypeFilter]);

  // SCR-05 FTUE: 실시간 시세 대비 10% 이상 저렴한 급매물 (Hot Bargain) 상위 1건 자동 추출
  const hotBargainListing = useMemo(() => {
    const activeItems = marketState.listings.filter(
      (l) => l.status === 'active' && l.sellerId !== userId
    );
    if (activeItems.length === 0) return null;

    let bestBargain: { listing: Listing; discountPct: number; recPrice: number } | null = null;

    activeItems.forEach((l) => {
      const band = MarketplacePriceBand.getInstance().evaluatePriceBand(l.cardId, 0);
      const recPrice = band.recommendedPrice;
      if (recPrice > 0 && l.askPrice < recPrice) {
        const discountPct = Math.round(((recPrice - l.askPrice) / recPrice) * 100);
        if (discountPct >= 8 && (!bestBargain || discountPct > bestBargain.discountPct)) {
          bestBargain = { listing: l, discountPct, recPrice };
        }
      }
    });

    return bestBargain;
  }, [marketState.listings, userId]);

  // ID 353: 판매 완료 매물 정산 및 Claim All 핸들러
  const completedListings = useMemo(() => {
    return marketState.listings.filter(
      (listing) => listing.sellerId === userId && listing.status === 'completed'
    );
  }, [marketState.listings, userId]);

  const totalClaimableSns = useMemo(() => {
    return completedListings.reduce((sum, l) => {
      const s = calculateMarketplaceSettlement(l.askPrice, currentSeason);
      return sum + s.sellerReceives;
    }, 0);
  }, [completedListings, currentSeason]);

  const handleClaimAllSettlements = () => {
    if (totalClaimableSns <= 0) return;
    try {
      const currentRaw = localStorage.getItem('hero_sns') || '0';
      const newSns = Number(currentRaw) + totalClaimableSns;
      localStorage.setItem('hero_sns', String(newSns));
      window.dispatchEvent(new Event('snshero_currency_updated'));
    } catch {}

    const now = getNowIso();
    setMarketState((prev) => ({
      ...prev,
      listings: prev.listings.map((l) =>
        l.sellerId === userId && l.status === 'completed'
          ? { ...l, status: 'settled' as any, updatedAt: now }
          : l
      ),
    }));
    updateFeedback(
      'marketplace_feedback_claim_all_success',
      language === 'ko'
        ? `미정산 판매 대금 +${totalClaimableSns.toLocaleString()} SNS를 1-클릭으로 일괄 수령했습니다!`
        : `Claimed +${totalClaimableSns.toLocaleString()} SNS from completed sales!`
    );
  };

  // ID 403: 만료 임박 매물 1-클릭 일괄 재등록
  const handleRelistExpiringListings = () => {
    const now = getNowIso();
    let relistedCount = 0;
    setMarketState((prev) => ({
      ...prev,
      listings: prev.listings.map((l) => {
        if (l.sellerId === userId && l.status === 'active') {
          relistedCount++;
          return { ...l, updatedAt: now };
        }
        return l;
      }),
    }));
    updateFeedback(
      'marketplace_feedback_relist_success',
      language === 'ko'
        ? `${relistedCount}건의 등록 매물 유효기간을 최신으로 일괄 갱신/재등록했습니다.`
        : `Re-listed ${relistedCount} items to refresh listing expiration.`
    );
  };

  const myListings = useMemo(() => {
    return marketState.listings
      .filter((listing) => listing.sellerId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [marketState.listings, userId]);

  const myOffers = useMemo(() => {
    return marketState.offers
      .filter((offer) => offer.buyerId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [marketState.offers, userId]);

  const selectedCard = useMemo(
    () => (selectedCardId ? CARD_DATABASE[selectedCardId] : undefined),
    [selectedCardId],
  );

  const pushAuditLog = (logs: TradeAuditLog[], log: TradeAuditLog) => [log, ...logs].slice(0, 12);

  const updateFeedback = (key: string, customMsg?: string) => {
    setFeedbackKey(key);
    setFeedbackText(customMsg || null);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        setFeedbackKey((current) => (current === key ? null : current));
        setFeedbackText(null);
      }, 3000);
    }
  };

  const handleCreateListing = () => {
    if (isGuest) {
      updateFeedback('marketplace_feedback_guest_only_browse');
      return;
    }
    if (isOfflineMode) {
      updateFeedback('marketplace_feedback_offline_readonly');
      return;
    }
    if (!selectedCardId) {
      updateFeedback('marketplace_feedback_select_card');
      return;
    }

    const price = Math.round(Number(listingPriceInput));
    if (!Number.isFinite(price) || price < 100) {
      updateFeedback('marketplace_feedback_invalid_price');
      return;
    }

    // 동적 가격 밴드(±30%) 덤핑 및 마켓 교란 방지 검증 (Row 1046 / ID 554)
    const bandResult = MarketplacePriceBand.getInstance().evaluatePriceBand(selectedCardId, price);
    if (!bandResult.isValidPrice) {
      const reasonText = bandResult.violationReason === 'BELOW_MIN_DUMPING'
        ? (language === 'ko' ? `최근 평균 시세 대비 30% 이하 덤핑 등록은 불가합니다. (최소 ${bandResult.minAllowedPrice.toLocaleString()} SNS)` : `Dumping below 30% moving avg is prohibited. (Min: ${bandResult.minAllowedPrice} SNS)`)
        : (language === 'ko' ? `최근 평균 시세 대비 30% 초과 폭리 등록은 불가합니다. (최대 ${bandResult.maxAllowedPrice.toLocaleString()} SNS)` : `Gouging above 30% moving avg is prohibited. (Max: ${bandResult.maxAllowedPrice} SNS)`);
      updateFeedback('marketplace_feedback_price_band_violation', reasonText);
      return;
    }

    if (activeOwnedListingCardIds.has(selectedCardId)) {
      updateFeedback('marketplace_feedback_duplicate_listing');
      return;
    }

    const now = getNowIso();
    const listingId = `listing-${marketState.counter}`;
    const newListing: Listing = {
      id: listingId,
      cardId: selectedCardId,
      sellerId: userId,
      sellerName: userName,
      season: currentSeason,
      askPrice: price,
      status: 'active',
      source: 'player',
      createdAt: now,
      updatedAt: now,
    };

    const auditLog: TradeAuditLog = {
      id: `audit-${marketState.counter}`,
      entity: 'listing',
      tradeId: listingId,
      relatedListingId: listingId,
      cardId: selectedCardId,
      actorId: userId,
      actorName: userName,
      event: 'listing_created',
      status: 'active',
      createdAt: now,
    };

    setMarketState((prev) => ({
      listings: [newListing, ...prev.listings],
      offers: prev.offers,
      auditLogs: pushAuditLog(prev.auditLogs, auditLog),
      counter: prev.counter + 1,
    }));
    updateFeedback('marketplace_feedback_listing_created');
  };

  const handleRequestPurchase = (listing: Listing) => {
    if (isGuest) {
      updateFeedback('marketplace_feedback_guest_only_browse');
      return;
    }
    if (isOfflineMode) {
      updateFeedback('marketplace_feedback_offline_readonly');
      return;
    }
    if (listing.sellerId === userId) {
      updateFeedback('marketplace_feedback_cannot_buy_own');
      return;
    }
    if (listing.status !== 'active') {
      updateFeedback('marketplace_feedback_listing_locked');
      return;
    }

    const hasOpenOffer = marketState.offers.some(
      (offer) =>
        offer.listingId === listing.id &&
        offer.buyerId === userId &&
        (offer.status === 'pending' || offer.status === 'escrow'),
    );
    if (hasOpenOffer) {
      updateFeedback('marketplace_feedback_existing_request');
      return;
    }

    // ID 338: 3단계 안전 에스크로 확인 모달 팝업 오픈!
    setEscrowListing(listing);
    setIsEscrowModalOpen(true);
  };

  const handleExecutePurchase = (listing: Listing) => {
    const settlement = calculateMarketplaceSettlement(listing.askPrice, currentSeason);
    const now = getNowIso();

    setMarketState((prev) => {
      const offerId = `offer-${prev.counter}`;
      const newOffer: Offer = {
        id: offerId,
        listingId: listing.id,
        cardId: listing.cardId,
        sellerId: listing.sellerId,
        buyerId: userId,
        buyerName: userName,
        offeredPrice: listing.askPrice,
        fee: settlement.fee,
        buyerTotal: settlement.buyerTotal,
        sellerReceives: settlement.sellerReceives,
        season: currentSeason,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      const updatedListings = prev.listings.map((current) =>
        current.id === listing.id
          ? {
              ...current,
              status: 'pending' as const,
              requestedByOfferId: offerId,
              updatedAt: now,
            }
          : current,
      );

      const auditLog: TradeAuditLog = {
        id: `audit-${prev.counter}`,
        entity: 'offer',
        tradeId: offerId,
        relatedListingId: listing.id,
        relatedOfferId: offerId,
        cardId: listing.cardId,
        actorId: userId,
        actorName: userName,
        event: 'offer_requested',
        status: 'pending',
        createdAt: now,
      };

      return {
        listings: updatedListings,
        offers: [newOffer, ...prev.offers],
        auditLogs: pushAuditLog(prev.auditLogs, auditLog),
        counter: prev.counter + 1,
      };
    });

    updateFeedback('marketplace_feedback_request_created');

    // SCR-05 Dopamine: 거래 체결 성공 햅틱 및 축하 사운드 FX
    triggerHaptic('victory');
    if (!isSfxMutedGlobal()) {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch {}
    }

    // ID 558: P2P 카드 거래 가스비 100% SNS 토큰 캐시백 보조금 (+15 SNS)
    try {
      const curSns = Number(localStorage.getItem('hero_sns') || '1000');
      localStorage.setItem('hero_sns', String(curSns + 15));
      window.dispatchEvent(new Event('snshero_sns_updated'));
      setGasRebateNotice(15);
      setTimeout(() => setGasRebateNotice(null), 3500);
    } catch {}

    // SCR-05 FTUE: 첫 거래 웰컴 캐시백 보조금 (+50 SNS) 지급
    if (!firstTradeRewardClaimed) {
      localStorage.setItem('hero_market_first_trade_reward', 'true');
      setFirstTradeRewardClaimed(true);
      try {
        const curSns = Number(localStorage.getItem('hero_sns') || '1000');
        localStorage.setItem('hero_sns', String(curSns + 50));
        window.dispatchEvent(new Event('snshero_sns_updated'));
        setFirstTradeBonusToast(true);
        setTimeout(() => setFirstTradeBonusToast(false), 5000);
      } catch {}
    }

    setTradeSuccessModalListing(listing);
  };

  // WebMCP Screen Tools: AI Agent P2P Marketplace Tools
  const marketWebMcpTools = useMemo(() => {
    return createMarketWebMcpTools({
      onBuyCard: (listingId) => {
        const target = marketState.listings.find(l => l.id === listingId);
        if (target) {
          handleExecutePurchase(target);
        }
      },
      onListCard: (cardId, priceSns) => {
        setSelectedCardId(cardId);
        setListingPriceInput(String(priceSns));
        setTimeout(() => {
          handleCreateListing();
        }, 50);
      },
      getMarketplaceData: () => {
        return {
          activeListings: marketState.listings.filter(l => l.status === 'active').map(l => ({
            id: l.id,
            cardId: l.cardId,
            cardTitle: l.cardTitle,
            askPrice: l.askPrice,
            sellerName: l.sellerName,
            rarity: l.rarity
          })),
          myOffers: marketState.offers.filter(o => o.buyerId === userId),
          snsBalance: userSns
        };
      }
    });
  }, [handleExecutePurchase, handleCreateListing, marketState, userSns, userId]);

  useWebMcpTools(marketWebMcpTools);

  const handleCancelListing = (listingId: string) => {
    const now = getNowIso();
    setMarketState((prev) => {
      const listing = prev.listings.find((item) => item.id === listingId);
      if (!listing) return prev;

      const updatedListings = prev.listings.map((item) =>
        item.id === listingId ? { ...item, status: 'cancelled' as const, updatedAt: now } : item,
      );
      const updatedOffers = prev.offers.map((offer) =>
        offer.listingId === listingId && (offer.status === 'pending' || offer.status === 'escrow')
          ? { ...offer, status: 'cancelled' as const, updatedAt: now }
          : offer,
      );
      const auditLog: TradeAuditLog = {
        id: `audit-${prev.counter}`,
        entity: 'listing',
        tradeId: listingId,
        relatedListingId: listingId,
        cardId: listing.cardId,
        actorId: userId,
        actorName: userName,
        event: 'listing_cancelled',
        status: 'cancelled',
        createdAt: now,
      };
      return {
        listings: updatedListings,
        offers: updatedOffers,
        auditLogs: pushAuditLog(prev.auditLogs, auditLog),
        counter: prev.counter + 1,
      };
    });
    updateFeedback('marketplace_feedback_listing_cancelled');
  };

  const handleCancelOffer = (offerId: string) => {
    const now = getNowIso();
    setMarketState((prev) => {
      const offer = prev.offers.find((item) => item.id === offerId);
      if (!offer) return prev;

      const updatedOffers = prev.offers.map((item) =>
        item.id === offerId ? { ...item, status: 'cancelled' as const, updatedAt: now } : item,
      );
      const updatedListings = prev.listings.map((listing) =>
        listing.requestedByOfferId === offerId && listing.status !== 'escrow'
          ? { ...listing, status: 'active' as const, requestedByOfferId: undefined, updatedAt: now }
          : listing
      );
      const auditLog: TradeAuditLog = {
        id: `audit-${prev.counter}`,
        entity: 'offer',
        tradeId: offerId,
        relatedListingId: offer.listingId,
        relatedOfferId: offerId,
        cardId: offer.cardId,
        actorId: userId,
        actorName: userName,
        event: 'offer_cancelled',
        status: 'cancelled',
        createdAt: now,
      };
      return {
        listings: updatedListings,
        offers: updatedOffers,
        auditLogs: pushAuditLog(prev.auditLogs, auditLog),
        counter: prev.counter + 1,
      };
    });
    updateFeedback('marketplace_feedback_offer_cancelled');
  };

  const handleStartEscrow = (listingId: string) => {
    const now = getNowIso();
    setMarketState((prev) => {
      const listing = prev.listings.find((item) => item.id === listingId);
      if (!listing?.requestedByOfferId) return prev;

      const updatedListings = prev.listings.map((item) =>
        item.id === listingId ? { ...item, status: 'escrow' as const, updatedAt: now } : item,
      );
      const updatedOffers = prev.offers.map((offer) =>
        offer.id === listing.requestedByOfferId
          ? { ...offer, status: 'escrow' as const, updatedAt: now }
          : offer,
      );
      const auditLog: TradeAuditLog = {
        id: `audit-${prev.counter}`,
        entity: 'listing',
        tradeId: listingId,
        relatedListingId: listingId,
        relatedOfferId: listing.requestedByOfferId,
        cardId: listing.cardId,
        actorId: userId,
        actorName: userName,
        event: 'escrow_started',
        status: 'escrow',
        createdAt: now,
      };
      return {
        listings: updatedListings,
        offers: updatedOffers,
        auditLogs: pushAuditLog(prev.auditLogs, auditLog),
        counter: prev.counter + 1,
      };
    });
    updateFeedback('marketplace_feedback_escrow_started');
  };

  return (
    <div className="flex-1 bg-[#fdfcfc] text-[#201d1d] font-mono pb-36">
      <PageHeader
        title={t('marketplace_title', language)}
        onBack={() => setView('shop')}
        rightAction={
          <button
            type="button"
            onClick={() => { setHelpOpen(true); setHelpStep(0); }}
            className="min-h-[44px] min-w-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] flex items-center justify-center text-[#646262] hover:text-[#201d1d] hover:bg-[#f8f7f7] transition-colors cursor-pointer"
          >
            <HelpCircle size={16} />
          </button>
        }
      />

      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* Row 1054 / ID 317: Watchlist Price Alert Toast Banner */}
        {priceAlertToast && (
          <div className="p-3 bg-[#f8f7f7] border border-[#201d1d] rounded-none text-[#201d1d] font-mono text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-amber-600 shrink-0" />
              <span className="font-bold">{priceAlertToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setPriceAlertToast(null)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#646262] hover:text-[#201d1d] font-black text-xs rounded-sm cursor-pointer"
            >
              [x]
            </button>
          </div>
        )}

        {/* Viral Share Notice Toast */}
        {viralShareNotice && (
          <div className="p-3 bg-[#f8f7f7] border border-[#201d1d] rounded-none text-[#201d1d] font-mono text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span className="font-bold">{viralShareNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setViralShareNotice(null)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#646262] hover:text-[#201d1d] font-black text-xs rounded-sm cursor-pointer"
            >
              [x]
            </button>
          </div>
        )}

        {/* ID 558: P2P 카드 거래 가스비 100% SNS 토큰 캐시백 안내 */}
        {gasRebateNotice && (
          <div className="p-3 bg-[#f8f7f7] border border-emerald-600 rounded-none text-emerald-950 font-mono text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">⛽</span>
              <span className="font-bold">
                {language === 'ko'
                  ? `[가스비 100% 캐시백] 거래 지원 보조금 +${gasRebateNotice} SNS가 내 지갑으로 즉시 환급 지급되었습니다!`
                  : `[100% Gas Fee Rebated] +${gasRebateNotice} SNS trade subsidy has been credited to your balance!`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setGasRebateNotice(null)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-emerald-800 hover:text-[#201d1d] font-black text-xs rounded-sm cursor-pointer"
            >
              [x]
            </button>
          </div>
        )}

        {/* ID 523: Auto-Buy Limit Alert / Success Banner */}
        {autoBuySuccessMsg && (
          <div className="p-3 bg-[#f8f7f7] border border-[#201d1d] rounded-none text-[#201d1d] font-mono text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <span className="font-bold">{autoBuySuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setAutoBuySuccessMsg(null)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#646262] hover:text-[#201d1d] font-black text-xs rounded-sm cursor-pointer"
            >
              [x]
            </button>
          </div>
        )}

        {/* SCR-05 FTUE: 첫 거래 웰컴 캐시백 토스트 */}
        {firstTradeBonusToast && (
          <div className="p-3 bg-[#f8f7f7] border border-[#201d1d] rounded-none text-[#201d1d] font-mono text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🎉</span>
              <span className="font-bold">
                {language === 'ko'
                  ? `[첫 거래 웰컴 보너스] 첫 P2P 거래 체결 축하 보조금 +50 SNS가 즉시 지급되었습니다!`
                  : `[First Trade Welcome] +50 SNS bonus has been credited for your first P2P trade!`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFirstTradeBonusToast(false)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#646262] hover:text-[#201d1d] font-black text-xs rounded-sm cursor-pointer"
            >
              [x]
            </button>
          </div>
        )}



        {/* SCR-05 UX: 모바일 원터치 서브 탭바 (스크롤 피로도 해소) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('browse')}
            className={cn(
              "px-3 py-2 rounded-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]",
              activeSubTab === 'browse'
                ? "bg-[#201d1d] text-[#fdfcfc]"
                : "bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] text-[#646262] hover:text-[#201d1d]"
            )}
          >
            <span>🛒</span>
            <span>{language === 'ko' ? '매물 탐색' : 'Browse'}</span>
            <span className="px-1 py-0.5 text-[9px] border border-current rounded-sm">
              {filteredListings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('create')}
            className={cn(
              "px-3 py-2 rounded-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]",
              activeSubTab === 'create'
                ? "bg-[#201d1d] text-[#fdfcfc]"
                : "bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] text-[#646262] hover:text-[#201d1d]"
            )}
          >
            <span>➕</span>
            <span>{language === 'ko' ? '매물 등록' : 'List Card'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('my_listings')}
            className={cn(
              "px-3 py-2 rounded-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]",
              activeSubTab === 'my_listings'
                ? "bg-[#201d1d] text-[#fdfcfc]"
                : "bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] text-[#646262] hover:text-[#201d1d]"
            )}
          >
            <span>📦</span>
            <span>{language === 'ko' ? '내 매물 / 체결' : 'My Listings'}</span>
            {totalClaimableSns > 0 && (
              <span className="px-1 py-0.5 text-[9px] bg-emerald-700 text-white rounded-sm">!</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('auto_buy')}
            className={cn(
              "px-3 py-2 rounded-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]",
              activeSubTab === 'auto_buy'
                ? "bg-[#201d1d] text-[#fdfcfc]"
                : "bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] text-[#646262] hover:text-[#201d1d]"
            )}
          >
            <span>🎯</span>
            <span>{language === 'ko' ? '자동 매수 예약' : 'Auto-Buy'}</span>
            {Object.keys(autoBuyOrders).length > 0 && (
              <span className="px-1 py-0.5 text-[9px] border border-current rounded-sm">
                {Object.keys(autoBuyOrders).length}
              </span>
            )}
          </button>
        </div>

        {/* Browse + Create */}
        <section className={cn(
          "grid lg:grid-cols-[1.1fr_0.9fr] gap-4",
          (activeSubTab === 'my_listings' || activeSubTab === 'auto_buy') && "hidden lg:grid"
        )}>
          {/* Browse Listings */}
          <div className={cn(
            "rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 space-y-3",
            activeSubTab === 'create' && "hidden lg:block"
          )}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-sm font-black uppercase text-[#201d1d]">[{t('marketplace_browse_title', language)}]</h2>
              <div className="flex flex-wrap gap-1.5">
                <div className="inline-flex rounded-none border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-0.5 gap-0.5">
                  {(['all', 'bronze', 'silver', 'gold'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setRarityFilter(filter)}
                      className={cn(
                        'min-h-[44px] px-2.5 rounded-sm text-[10px] font-bold uppercase transition-colors cursor-pointer',
                        rarityFilter === filter ? 'bg-[#201d1d] text-[#fdfcfc]' : 'text-[#646262] hover:text-[#201d1d] hover:bg-[#fdfcfc]',
                      )}
                    >
                      {t(`marketplace_filter_${filter}`, language)}
                    </button>
                  ))}
                </div>
                <div className="inline-flex rounded-none border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-0.5 gap-0.5 flex-wrap">
                  {BUILD_FOCUS_FILTERS.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setBuildFocusFilter(filter)}
                      className={cn(
                        'min-h-[44px] px-2 rounded-sm text-[10px] font-bold uppercase transition-colors cursor-pointer',
                        buildFocusFilter === filter ? 'bg-[#201d1d] text-[#fdfcfc]' : 'text-[#646262] hover:text-[#201d1d] hover:bg-[#fdfcfc]',
                      )}
                    >
                      {t(`marketplace_build_${filter}`, language)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ID 383: 4방향 스탯 슬라이더 필터 토글 바 */}
            <div className="flex items-center justify-between pt-2 border-t border-[rgba(15,0,0,0.12)]">
              <button
                type="button"
                onClick={() => setShowDirectionSliders((prev) => !prev)}
                className="min-h-[44px] text-[11px] font-bold text-[#646262] hover:text-[#201d1d] flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal size={12} className="text-[#201d1d]" />
                <span>{language === 'ko' ? '[방향별 최소 스탯 필터 (0~10)]' : '[Min Directional Stats (0-10)]'}</span>
              </button>
              {(minStatUp > 0 || minStatRight > 0 || minStatDown > 0 || minStatLeft > 0) && (
                <button
                  type="button"
                  onClick={() => { setMinStatUp(0); setMinStatRight(0); setMinStatDown(0); setMinStatLeft(0); }}
                  className="min-h-[44px] px-2 text-[10px] text-rose-700 font-bold hover:underline cursor-pointer"
                >
                  [{language === 'ko' ? '필터 리셋' : 'Reset'}]
                </button>
              )}
            </div>

            {showDirectionSliders && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-[#f8f7f7] rounded-none border border-[rgba(15,0,0,0.12)] text-[10px] font-mono">
                <div>
                  <div className="flex justify-between text-[#646262]"><span>▲ 상단</span><span className="font-bold text-[#201d1d]">≥ {minStatUp}</span></div>
                  <input type="range" min={0} max={10} value={minStatUp} onChange={(e) => setMinStatUp(Number(e.target.value))} className="w-full accent-[#201d1d] cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between text-[#646262]"><span>▶ 우측</span><span className="font-bold text-[#201d1d]">≥ {minStatRight}</span></div>
                  <input type="range" min={0} max={10} value={minStatRight} onChange={(e) => setMinStatRight(Number(e.target.value))} className="w-full accent-[#201d1d] cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between text-[#646262]"><span>▼ 하단</span><span className="font-bold text-[#201d1d]">≥ {minStatDown}</span></div>
                  <input type="range" min={0} max={10} value={minStatDown} onChange={(e) => setMinStatDown(Number(e.target.value))} className="w-full accent-[#201d1d] cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between text-[#646262]"><span>◀ 좌측</span><span className="font-bold text-[#201d1d]">≥ {minStatLeft}</span></div>
                  <input type="range" min={0} max={10} value={minStatLeft} onChange={(e) => setMinStatLeft(Number(e.target.value))} className="w-full accent-[#201d1d] cursor-pointer" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              {filteredListings.length === 0 ? (
                <div className="rounded-none border border-dashed border-[rgba(15,0,0,0.2)] bg-[#f8f7f7] px-4 py-6 text-center text-xs text-[#646262]">
                  {t('marketplace_empty_listings', language)}
                </div>
              ) : (
                filteredListings.map((listing) => {
                  const isMine = listing.sellerId === userId;
                  const hasOpenOffer = marketState.offers.some(
                    (offer) =>
                      offer.listingId === listing.id &&
                      offer.buyerId === userId &&
                      (offer.status === 'pending' || offer.status === 'escrow'),
                  );

                  return (
                    <div
                      key={listing.id}
                      onClick={() => setTradeModalListing(listing)}
                      className="rounded-none border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] hover:bg-[#fdfcfc] hover:border-[#201d1d] p-3 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-sm bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] flex items-center justify-center text-xs font-black shrink-0">
                            {String(CARD_DATABASE[listing.cardId]?.element || '').toLowerCase() === 'fire' ? '🔥' : String(CARD_DATABASE[listing.cardId]?.element || '').toLowerCase() === 'water' ? '💧' : String(CARD_DATABASE[listing.cardId]?.element || '').toLowerCase() === 'earth' ? '🌿' : '⚡'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-xs font-black text-[#201d1d] truncate">{getCardTitle(listing.cardId)}</h3>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] text-[#646262]">
                                {language === 'ko' ? '수수료 5% · 가스 0' : 'Fee 5% · Gas Free'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs font-black text-[#201d1d]">{listing.askPrice.toLocaleString()} SNS</span>
                              <MarketSparkline cardId={listing.cardId} currentPrice={listing.askPrice} width={50} height={18} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setAutoBuyModalCardId(listing.cardId);
                              setAutoBuyTargetPrice(Math.round(listing.askPrice * 0.9));
                            }}
                            className={cn(
                              "min-h-[44px] px-2.5 rounded-sm border text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors",
                              autoBuyOrders[listing.cardId]
                                ? "border-[#201d1d] bg-[#201d1d] text-[#fdfcfc]"
                                : "border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#eae8e8] text-[#201d1d]"
                            )}
                            title={language === 'ko' ? '희망 매수가 예약 (Auto-Buy)' : 'Auto-Buy Limit Order'}
                          >
                            <span>🎯</span>
                            <span className="hidden sm:inline">
                              {autoBuyOrders[listing.cardId]
                                ? `≤${autoBuyOrders[listing.cardId].toLocaleString()}`
                                : (language === 'ko' ? '예약' : 'Auto')}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTradeModalListing(listing)}
                            className="min-h-[44px] px-2.5 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] hover:bg-[#eae8e8] text-[#201d1d] font-bold text-xs flex items-center gap-1 cursor-pointer"
                            title={language === 'ko' ? '실시간 시세 차트 및 상세' : 'Price Chart & Details'}
                          >
                            <TrendingUp size={13} />
                            <span className="hidden sm:inline">{language === 'ko' ? '시세' : 'Chart'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestPurchase(listing)}
                            disabled={isMine || hasOpenOffer || listing.status !== 'active' || isGuest || isOfflineMode}
                            className={cn(
                              'min-h-[44px] px-3.5 rounded-sm font-bold text-xs transition-colors shrink-0 border',
                              isMine || hasOpenOffer || listing.status !== 'active' || isGuest || isOfflineMode
                                ? 'bg-[#f8f7f7] text-[#646262] border-[rgba(15,0,0,0.12)] cursor-not-allowed'
                                : 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] hover:bg-[#333030] cursor-pointer',
                            )}
                          >
                            {isMine
                              ? t('marketplace_my_listing_badge', language)
                              : hasOpenOffer
                                ? t('marketplace_request_exists', language)
                                : t('marketplace_request_purchase', language)}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Create Listing */}
          <div className={cn(
            "rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 space-y-3",
            activeSubTab === 'browse' && "hidden lg:block"
          )}>
            <h2 className="text-sm font-black uppercase text-[#201d1d]">[{t('marketplace_create_title', language)}]</h2>

            {feedbackKey && (
              <div className="p-2.5 text-xs font-bold bg-[#f8f7f7] border border-[#201d1d] text-[#201d1d] rounded-none">
                {feedbackText || (t(feedbackKey as any, language) !== feedbackKey ? t(feedbackKey as any, language) : feedbackKey)}
              </div>
            )}

            <select
              value={selectedCardId ?? ''}
              onChange={(event) => setSelectedCardId(Number(event.target.value))}
              disabled={listableCards.length === 0 || isGuest || isOfflineMode}
              className="w-full min-h-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-3 text-xs text-[#201d1d] outline-none focus:border-[#201d1d]"
            >
              {listableCards.length === 0 ? (
                <option value="">{t('marketplace_no_listable_cards', language)}</option>
              ) : (
                listableCards.map((entry) => (
                  <option key={entry.cardId} value={entry.cardId}>
                    {getCardTitle(entry.cardId)} · x{entry.record.quantity}
                  </option>
                ))
              )}
            </select>

            <input
              type="number"
              min={100}
              step={100}
              value={listingPriceInput}
              onChange={(event) => setListingPriceInput(event.target.value)}
              disabled={isGuest || isOfflineMode}
              placeholder={t('marketplace_ask_price', language)}
              className="w-full min-h-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] px-3 text-xs text-[#201d1d] outline-none focus:border-[#201d1d]"
            />

            {selectedCardId && (
              <div className="text-[10px] text-[#646262] flex items-center justify-between px-1">
                <span>{language === 'ko' ? '공정 가격 밴드 (±30%):' : 'Fair Price Band (±30%):'}</span>
                <span className="font-bold text-[#201d1d]">
                  {MarketplacePriceBand.getInstance().evaluatePriceBand(selectedCardId, 0).minAllowedPrice.toLocaleString()} ~ {MarketplacePriceBand.getInstance().evaluatePriceBand(selectedCardId, 0).maxAllowedPrice.toLocaleString()} SNS
                </span>
              </div>
            )}

            {selectedCardId && (() => {
              const band = MarketplacePriceBand.getInstance().evaluatePriceBand(selectedCardId, 0);
              const suggested = band.recommendedPrice;
              return (
                <button
                  type="button"
                  onClick={() => setListingPriceInput(String(suggested))}
                  className="w-full min-h-[44px] py-2 px-3 bg-[#f8f7f7] hover:bg-[#eae8e8] border border-[rgba(15,0,0,0.12)] text-[#201d1d] rounded-sm text-[11px] font-mono font-bold flex items-center justify-between transition-colors cursor-pointer"
                  title={language === 'ko' ? '클릭 시 권장가로 자동 입력' : 'Click to auto-fill suggested price'}
                >
                  <span>💡 {language === 'ko' ? '적정 시장 권장가:' : 'Suggested Price:'}</span>
                  <span className="underline font-black">[{suggested.toLocaleString()} SNS 자동입력]</span>
                </button>
              );
            })()}

            <button
              type="button"
              onClick={handleCreateListing}
              disabled={listableCards.length === 0}
              className={cn(
                'w-full min-h-[44px] rounded-sm font-bold text-xs transition-colors border',
                listableCards.length === 0
                  ? 'bg-[#f8f7f7] text-[#646262] border-[rgba(15,0,0,0.12)] cursor-not-allowed'
                  : 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] hover:bg-[#333030] cursor-pointer',
              )}
            >
              [{t('marketplace_create_listing', language)}]
            </button>
          </div>
        </section>

        {/* SCR-05 UX: Auto-Buy 자동 매수 예약 관리 패널 */}
        {activeSubTab === 'auto_buy' && (
          <div className="rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 space-y-4 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(15,0,0,0.12)] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span>🎯</span>
                <h2 className="text-sm font-black uppercase text-[#201d1d]">
                  [{language === 'ko' ? '희망 매수가 자동 매수 예약 목록' : 'Auto-Buy Limit Orders'}]
                </h2>
              </div>
              <span className="text-xs text-[#201d1d] font-bold bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] px-2 py-0.5 rounded-sm">
                {Object.keys(autoBuyOrders).length} {language === 'ko' ? '건 활성 대기' : 'Active Orders'}
              </span>
            </div>

            {Object.keys(autoBuyOrders).length === 0 ? (
              <div className="p-8 text-center text-[#646262] text-xs border border-dashed border-[rgba(15,0,0,0.2)] rounded-none space-y-2 bg-[#f8f7f7]">
                <div className="text-xl">🎯</div>
                <div className="font-bold text-[#201d1d]">
                  {language === 'ko' ? '등록된 자동 매수 주문이 없습니다.' : 'No active Auto-Buy limit orders.'}
                </div>
                <div className="text-[11px] text-[#646262] max-w-sm mx-auto">
                  {language === 'ko'
                    ? '매물 탐색(Browse) 탭에서 원하는 카드의 [🎯 예약] 버튼을 누르면 목표 매수가 이하 등록 시 즉시 알림 및 자동 체결을 준비합니다.'
                    : 'Click the [🎯 Auto] button on any card in the Browse tab to set your target maximum price.'}
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(autoBuyOrders).map(([cardIdStr, limitPrice]) => {
                  const cId = Number(cardIdStr);
                  return (
                    <div key={cId} className="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-black text-xs text-[#201d1d] truncate">{getCardTitle(cId)}</div>
                        <div className="text-xs text-[#646262] font-bold mt-0.5">
                          {language === 'ko' ? `희망 목표가: ≤ ${limitPrice.toLocaleString()} SNS` : `Limit: ≤ ${limitPrice.toLocaleString()} SNS`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAutoBuyOrder(cId)}
                        className="min-h-[44px] px-3 text-xs bg-[#fdfcfc] border border-rose-700 hover:bg-rose-50 text-rose-700 font-bold rounded-sm cursor-pointer shrink-0 transition-colors"
                      >
                        [{language === 'ko' ? '주문 취소' : 'Cancel'}]
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* My Listings + My Requests */}
        <section className={cn(
          "grid lg:grid-cols-2 gap-4",
          activeSubTab !== 'my_listings' && "hidden lg:grid"
        )}>
          {/* My Listings */}
          <div className="rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-[rgba(15,0,0,0.12)]">
              <h2 className="text-sm font-black uppercase text-[#201d1d]">[{t('marketplace_my_listings', language)}]</h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                {totalClaimableSns > 0 && (
                  <button
                    type="button"
                    onClick={handleClaimAllSettlements}
                    className="min-h-[44px] px-3 py-1 rounded-sm bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Sparkles size={12} />
                    <span>[{language === 'ko' ? `판매 대금 일괄 수령 (+${totalClaimableSns.toLocaleString()} SNS)` : `Claim All (+${totalClaimableSns.toLocaleString()} SNS)`}]</span>
                  </button>
                )}
                {myListings.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRelistExpiringListings}
                    className="min-h-[44px] px-3 py-1 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] hover:bg-[#eae8e8] text-[#201d1d] font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                    title={language === 'ko' ? '등록 유효기간 갱신 및 상단 재노출' : 'Refresh listing expiration'}
                  >
                    <span>[{language === 'ko' ? '만료 임박 일괄 재등록' : 'Re-list All'}]</span>
                  </button>
                )}
              </div>
            </div>
            {myListings.length === 0 ? (
              <div className="rounded-none border border-dashed border-[rgba(15,0,0,0.2)] bg-[#f8f7f7] px-4 py-6 text-center text-xs text-[#646262]">
                {t('marketplace_empty_my_listings', language)}
              </div>
            ) : (
              myListings.map((listing) => (
                <div key={listing.id} className="rounded-none border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-[#201d1d] truncate">{getCardTitle(listing.cardId)}</span>
                        {listing.status === 'active' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-[#fdfcfc] text-amber-900 border border-[rgba(15,0,0,0.12)]">
                            {language === 'ko' ? '만료 임박' : 'Expiring'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#646262]">{listing.askPrice.toLocaleString()} SNS</div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {(listing.status === 'active' || listing.status === 'pending' || listing.status === 'escrow') && (
                        <button
                          type="button"
                          onClick={() => handleCancelListing(listing.id)}
                          className="min-h-[44px] px-3 rounded-sm border border-rose-700 bg-[#fdfcfc] text-rose-700 font-bold text-[10px] hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          [{t('marketplace_cancel_listing', language)}]
                        </button>
                      )}
                      {listing.status === 'pending' && listing.requestedByOfferId && (
                        <button
                          type="button"
                          onClick={() => handleStartEscrow(listing.id)}
                          className="min-h-[44px] px-3 rounded-sm bg-[#201d1d] text-[#fdfcfc] font-bold text-[10px] hover:bg-[#333030] transition-colors cursor-pointer"
                        >
                          [{t('marketplace_move_to_escrow', language)}]
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* My Requests */}
          <div className="rounded-none border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] p-4 space-y-2">
            <h2 className="text-sm font-black uppercase text-[#201d1d] pb-2 border-b border-[rgba(15,0,0,0.12)]">[{t('marketplace_my_requests', language)}]</h2>
            {myOffers.length === 0 ? (
              <div className="rounded-none border border-dashed border-[rgba(15,0,0,0.2)] bg-[#f8f7f7] px-4 py-6 text-center text-xs text-[#646262]">
                {t('marketplace_empty_my_requests', language)}
              </div>
            ) : (
              myOffers.map((offer) => (
                <div key={offer.id} className="rounded-none border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-black text-xs text-[#201d1d] truncate">{getCardTitle(offer.cardId)}</div>
                      <div className="text-xs text-[#646262]">
                        {offer.buyerTotal.toLocaleString()} SNS
                      </div>
                    </div>
                    {(offer.status === 'pending' || offer.status === 'escrow') && (
                      <button
                        type="button"
                        onClick={() => handleCancelOffer(offer.id)}
                        className="min-h-[44px] px-3 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#201d1d] font-bold text-[10px] hover:bg-[#eae8e8] transition-colors shrink-0 cursor-pointer"
                      >
                        [{t('marketplace_cancel_request', language)}]
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Help Popup */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] flex items-center justify-center p-4 bg-black/60 font-mono"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-[#fdfcfc] border border-[#201d1d] rounded-none p-5 max-w-sm w-full relative"
            >
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="absolute top-3 right-3 min-h-[44px] min-w-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] flex items-center justify-center text-[#646262] hover:text-[#201d1d] hover:bg-[#f8f7f7] transition-colors cursor-pointer"
              >
                [x]
              </button>

              <div className="text-center mb-5 pt-2">
                <HelpCircle size={22} className="mx-auto text-[#201d1d] mb-2" />
                <h3 className="text-sm font-black text-[#201d1d]">
                  {t(HELP_STEPS[helpStep].titleKey, language)}
                </h3>
                <p className="text-xs text-[#646262] mt-1.5 leading-relaxed">
                  {t(HELP_STEPS[helpStep].descKey, language)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setHelpStep((s) => Math.max(0, s - 1))}
                  disabled={helpStep === 0}
                  className="min-h-[44px] min-w-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] flex items-center justify-center text-[#201d1d] hover:bg-[#f8f7f7] disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-xs font-bold text-[#646262]">
                  {helpStep + 1} / {HELP_STEPS.length}
                </div>
                <button
                  type="button"
                  onClick={() => setHelpStep((s) => Math.min(HELP_STEPS.length - 1, s + 1))}
                  disabled={helpStep === HELP_STEPS.length - 1}
                  className="min-h-[44px] min-w-[44px] rounded-sm border border-[rgba(15,0,0,0.12)] flex items-center justify-center text-[#201d1d] hover:bg-[#f8f7f7] disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Ergonomic Bottom 1-Line Slim Filter Bar (Row 656 / ID 553) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#fdfcfc] border-t border-[rgba(15,0,0,0.12)] px-3 py-2 select-none font-mono">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-black text-[#646262] uppercase px-1">
              [FILTER]
            </span>
            {(['all', 'instant', 'auction'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTradeTypeFilter(mode)}
                className={cn(
                  "min-h-[44px] px-2.5 py-1 text-[11px] font-bold rounded-sm border transition-colors cursor-pointer whitespace-nowrap",
                  tradeTypeFilter === mode
                    ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]"
                    : "bg-[#f8f7f7] text-[#646262] border-[rgba(15,0,0,0.12)] hover:text-[#201d1d]"
                )}
              >
                {mode === 'all'
                  ? (language === 'ko' ? '전체 매물' : 'All')
                  : mode === 'instant'
                  ? (language === 'ko' ? '즉시 구매' : 'Instant Buy')
                  : (language === 'ko' ? '경매/입찰' : 'Auction')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {(['all', 'FIRE', 'WATER', 'EARTH', 'WIND'] as const).map((elem) => (
              <button
                key={elem}
                type="button"
                onClick={() => setElementFilter(elem)}
                className={cn(
                  "min-h-[44px] px-2 py-1 text-[11px] font-bold rounded-sm border transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1",
                  elementFilter === elem
                    ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] font-black"
                    : "bg-[#f8f7f7] text-[#646262] border-[rgba(15,0,0,0.12)] hover:text-[#201d1d]"
                )}
              >
                <span>{elem === 'all' ? (language === 'ko' ? '전체속성' : 'All Elem') : elem === 'FIRE' ? '🔥' : elem === 'WATER' ? '💧' : elem === 'EARTH' ? '🌿' : '⚡'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Price History & Trade Modal (Row 656 / ID 553) */}
      <MarketplaceCardTradeModal
        listing={tradeModalListing}
        isOpen={!!tradeModalListing}
        onClose={() => setTradeModalListing(null)}
        language={language}
        currentSeason={currentSeason}
        userId={userId}
        isGuest={isGuest}
        onRequestPurchase={(listing) => {
          handleRequestPurchase(listing);
        }}
      />

      {/* ID 338: 3단계 안전 에스크로 확인 모달 */}
      <MarketEscrowModal
        isOpen={isEscrowModalOpen}
        onClose={() => {
          setIsEscrowModalOpen(false);
          setEscrowListing(null);
        }}
        listing={escrowListing}
        currentSeason={currentSeason}
        language={language}
        onConfirmPurchase={(approved) => handleExecutePurchase(approved)}
      />

      {/* ID 523: Auto-Buy Limit Order Modal */}
      {autoBuyModalCardId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 font-mono">
          <div className="w-full max-w-sm bg-[#fdfcfc] border border-[#201d1d] rounded-none p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-2">
              <h3 className="text-sm font-black flex items-center gap-1.5 text-[#201d1d]">
                <span>🎯</span>
                <span>{language === 'ko' ? '희망 매수가 예약 (Auto-Buy)' : 'Auto-Buy Limit Order'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setAutoBuyModalCardId(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-bold text-[#646262] hover:text-[#201d1d] cursor-pointer"
              >
                [x]
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-[#201d1d]">
                {CARD_DATABASE[autoBuyModalCardId]?.title_dis || `Card #${autoBuyModalCardId}`}
              </div>
              <p className="text-[11px] text-[#646262]">
                {language === 'ko'
                  ? '해당 카드에 설정한 희망가 이하의 매물이 마켓에 등록되면 자동 알림 및 구매를 진행합니다.'
                  : 'Receive alerts or auto-execute purchases when this card is listed at or below your target price.'}
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#201d1d]">
                  {language === 'ko' ? '희망 최대 매수가 (SNS):' : 'Max Target Price (SNS):'}
                </label>
                <input
                  type="number"
                  step={50}
                  min={100}
                  value={autoBuyTargetPrice}
                  onChange={(e) => setAutoBuyTargetPrice(Math.max(100, Number(e.target.value)))}
                  className="w-full min-h-[44px] px-3 border border-[rgba(15,0,0,0.12)] bg-[#f8f7f7] rounded-sm text-xs font-mono text-[#201d1d]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {autoBuyOrders[autoBuyModalCardId] && (
                <button
                  type="button"
                  onClick={() => {
                    removeAutoBuyOrder(autoBuyModalCardId);
                    setAutoBuyModalCardId(null);
                  }}
                  className="flex-1 min-h-[44px] py-2 border border-rose-700 text-rose-700 rounded-sm font-bold text-xs hover:bg-rose-50 cursor-pointer"
                >
                  [{language === 'ko' ? '예약 취소' : 'Cancel Limit'}]
                </button>
              )}
              <button
                type="button"
                onClick={() => saveAutoBuyOrder(autoBuyModalCardId, autoBuyTargetPrice)}
                className="flex-1 min-h-[44px] py-2 bg-[#201d1d] text-[#fdfcfc] rounded-sm font-bold text-xs hover:bg-[#333030] cursor-pointer"
              >
                [{language === 'ko' ? '희망가 저장' : 'Set Auto-Buy'}]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCR-05 Dopamine: P2P 거래 체결 성공 축하 팝업 모달 */}
      {tradeSuccessModalListing && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 font-mono">
          <div className="w-full max-w-sm bg-[#fdfcfc] border border-[#201d1d] rounded-none p-6 space-y-4 text-center">
            <div className="text-3xl">🎉</div>
            <h3 className="text-base font-black text-[#201d1d]">
              {language === 'ko' ? 'P2P 거래 체결 완료!' : 'P2P Deal Executed!'}
            </h3>
            <div className="p-3 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-none text-xs text-[#646262] space-y-1">
              <div className="font-bold text-[#201d1d]">
                [{getCardTitle(tradeSuccessModalListing.cardId)}]
              </div>
              <div className="text-[#201d1d] font-black">
                {tradeSuccessModalListing.askPrice.toLocaleString()} SNS
              </div>
              <div className="text-[10px] text-emerald-700 font-bold pt-1">
                ✓ {language === 'ko' ? '가스비 100% 무료 환급 완료 (+15 SNS)' : 'Gas Fee 100% Rebated (+15 SNS)'}
              </div>
            </div>
            <p className="text-[11px] text-[#646262]">
              {language === 'ko'
                ? '구매 요청이 안전하게 등록되었습니다. 에스크로 확인 후 인벤토리로 카드가 지급됩니다.'
                : 'Purchase request safely recorded. Card will be delivered upon escrow confirmation.'}
            </p>
            <button
              type="button"
              onClick={() => setTradeSuccessModalListing(null)}
              className="w-full min-h-[44px] py-2.5 bg-[#201d1d] hover:bg-[#333030] text-[#fdfcfc] rounded-sm font-black text-xs cursor-pointer transition-colors"
            >
              [{language === 'ko' ? '확인 완료' : 'Confirm'}]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
