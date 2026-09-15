import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X, ChevronLeft, ChevronRight, TrendingUp, SlidersHorizontal, Sparkles, Bell, Bookmark } from 'lucide-react';
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

  const userId = user?.uid || 'guest-id';
  const userName = user?.displayName?.trim() || (language === 'ko' ? '플레이어' : 'Player');
  const isGuest = userId === 'guest-id';
  const isOfflineMode = typeof window !== 'undefined' && window.localStorage.getItem('hero_offline_mode') === 'true';
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

    // ID 558: P2P 카드 거래 가스비 100% SNS 토큰 캐시백 보조금 (+15 SNS)
    try {
      const curSns = Number(localStorage.getItem('hero_sns') || '1000');
      localStorage.setItem('hero_sns', String(curSns + 15));
      window.dispatchEvent(new Event('snshero_sns_updated'));
      setGasRebateNotice(15);
      setTimeout(() => setGasRebateNotice(null), 3500);
    } catch {}
  };

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
    <div className="flex-1 bg-slate-50 text-slate-900 font-sans pb-36">
      <PageHeader
        title={t('marketplace_title', language)}
        onBack={() => setView('shop')}
        rightAction={
          <button
            type="button"
            onClick={() => { setHelpOpen(true); setHelpStep(0); }}
            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <HelpCircle size={16} />
          </button>
        }
      />

      <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">
        {/* Row 1054 / ID 317: Watchlist Price Alert Toast Banner */}
        {priceAlertToast && (
          <div className="p-3 bg-amber-50 border-2 border-amber-400 text-amber-950 font-mono text-xs flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-amber-600 shrink-0 animate-bounce" />
              <span className="font-bold">{priceAlertToast}</span>
            </div>
            <button
              onClick={() => setPriceAlertToast(null)}
              className="text-amber-800 hover:text-black font-black text-xs px-1.5 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* ID 558: P2P 카드 거래 가스비 100% SNS 토큰 캐시백 안내 */}
        {gasRebateNotice && (
          <div className="p-3 bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-mono text-xs flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="text-base">⛽</span>
              <span className="font-bold">
                {language === 'ko'
                  ? `[가스비 100% 캐시백] 거래 지원 보조금 +${gasRebateNotice} SNS가 내 지갑으로 즉시 환급 지급되었습니다!`
                  : `[100% Gas Fee Rebated] +${gasRebateNotice} SNS trade subsidy has been credited to your balance!`}
              </span>
            </div>
            <button
              onClick={() => setGasRebateNotice(null)}
              className="text-emerald-800 hover:text-black font-black text-xs px-1.5 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* ID 523: Auto-Buy Limit Alert / Success Banner */}
        {autoBuySuccessMsg && (
          <div className="p-3 bg-indigo-50 border-2 border-indigo-500 text-indigo-950 font-mono text-xs flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <span className="font-bold">{autoBuySuccessMsg}</span>
            </div>
            <button
              onClick={() => setAutoBuySuccessMsg(null)}
              className="text-indigo-800 hover:text-black font-black text-xs px-1.5 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Browse + Create */}
        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5">
          {/* Browse Listings */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-base font-black text-slate-900">{t('marketplace_browse_title', language)}</h2>
              <div className="flex flex-wrap gap-1">
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  {(['all', 'bronze', 'silver', 'gold'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setRarityFilter(filter)}
                      className={cn(
                        'min-h-8 px-2.5 rounded-md text-[10px] font-bold uppercase transition-colors',
                        rarityFilter === filter ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white',
                      )}
                    >
                      {t(`marketplace_filter_${filter}`, language)}
                    </button>
                  ))}
                </div>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                  {BUILD_FOCUS_FILTERS.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setBuildFocusFilter(filter)}
                      className={cn(
                        'min-h-8 px-2 rounded-md text-[10px] font-bold uppercase transition-colors',
                        buildFocusFilter === filter ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-white',
                      )}
                    >
                      {t(`marketplace_build_${filter}`, language)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ID 383: 4방향 스탯 슬라이더 필터 토글 바 */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDirectionSliders((prev) => !prev)}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <SlidersHorizontal size={11} className="text-indigo-600" />
                <span>{language === 'ko' ? '방향별 최소 스탯 필터 (0~10)' : 'Min Directional Stats (0-10)'}</span>
                {(minStatUp > 0 || minStatRight > 0 || minStatDown > 0 || minStatLeft > 0) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                )}
              </button>
              {(minStatUp > 0 || minStatRight > 0 || minStatDown > 0 || minStatLeft > 0) && (
                <button
                  type="button"
                  onClick={() => { setMinStatUp(0); setMinStatRight(0); setMinStatDown(0); setMinStatLeft(0); }}
                  className="text-[9px] text-rose-500 font-bold hover:underline cursor-pointer"
                >
                  {language === 'ko' ? '필터 리셋' : 'Reset'}
                </button>
              )}
            </div>

            {showDirectionSliders && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[10px] font-mono animate-fade-in">
                <div>
                  <div className="flex justify-between text-slate-500"><span>▲ 상단</span><span className="font-bold text-indigo-600">≥ {minStatUp}</span></div>
                  <input type="range" min={0} max={10} value={minStatUp} onChange={(e) => setMinStatUp(Number(e.target.value))} className="w-full accent-indigo-600 cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-500"><span>▶ 우측</span><span className="font-bold text-indigo-600">≥ {minStatRight}</span></div>
                  <input type="range" min={0} max={10} value={minStatRight} onChange={(e) => setMinStatRight(Number(e.target.value))} className="w-full accent-indigo-600 cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-500"><span>▼ 하단</span><span className="font-bold text-indigo-600">≥ {minStatDown}</span></div>
                  <input type="range" min={0} max={10} value={minStatDown} onChange={(e) => setMinStatDown(Number(e.target.value))} className="w-full accent-indigo-600 cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between text-slate-500"><span>◀ 좌측</span><span className="font-bold text-indigo-600">≥ {minStatLeft}</span></div>
                  <input type="range" min={0} max={10} value={minStatLeft} onChange={(e) => setMinStatLeft(Number(e.target.value))} className="w-full accent-indigo-600 cursor-pointer" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              {filteredListings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
                  {t('marketplace_empty_listings', language)}
                </div>
              ) : (
                filteredListings.map((listing) => {
                  const settlement = calculateMarketplaceSettlement(listing.askPrice, currentSeason);
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
                      className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-300 p-3 transition-all cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-black shrink-0">
                            {String(CARD_DATABASE[listing.cardId]?.element || '').toLowerCase() === 'fire' ? '🔥' : String(CARD_DATABASE[listing.cardId]?.element || '').toLowerCase() === 'water' ? '💧' : String(CARD_DATABASE[listing.cardId]?.element || '').toLowerCase() === 'earth' ? '🌿' : '⚡'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-sm font-black text-slate-900 truncate">{getCardTitle(listing.cardId)}</h3>
                              {/* ID 373: 수수료 및 가스비 배지 */}
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-xs bg-cyan-50 border border-cyan-200 text-cyan-800">
                                {language === 'ko' ? '수수료 5% · L2 가스 0' : 'Fee 5% · Gas Free'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs font-black text-indigo-700">{listing.askPrice.toLocaleString()} SNS</span>
                              {/* ID 408: 7일 시세 변동 스파크라인 HUD */}
                              <MarketSparkline cardId={listing.cardId} currentPrice={listing.askPrice} width={50} height={18} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* ID 523: Auto-Buy Order Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setAutoBuyModalCardId(listing.cardId);
                              setAutoBuyTargetPrice(Math.round(listing.askPrice * 0.9));
                            }}
                            className={cn(
                              "min-h-9 px-2 rounded-lg border text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors",
                              autoBuyOrders[listing.cardId]
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                : "border-slate-300 bg-white hover:bg-slate-50 text-slate-600"
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
                            className="min-h-9 px-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                            title={language === 'ko' ? '실시간 시세 차트 및 상세' : 'Price Chart & Details'}
                          >
                            <TrendingUp size={13} className="text-indigo-600" />
                            <span className="hidden sm:inline">{language === 'ko' ? '시세' : 'Chart'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestPurchase(listing)}
                            disabled={isMine || hasOpenOffer || listing.status !== 'active' || isGuest || isOfflineMode}
                            className={cn(
                              'min-h-9 px-3.5 rounded-lg font-bold text-xs transition-all shrink-0',
                              isMine || hasOpenOffer || listing.status !== 'active' || isGuest || isOfflineMode
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                : 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer',
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
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
            <h2 className="text-base font-black text-slate-900">{t('marketplace_create_title', language)}</h2>

            {feedbackKey && (
              <div className="p-2.5 text-xs font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 rounded-lg">
                {feedbackText || (t(feedbackKey as any, language) !== feedbackKey ? t(feedbackKey as any, language) : feedbackKey)}
              </div>
            )}

            <select
              value={selectedCardId ?? ''}
              onChange={(event) => setSelectedCardId(Number(event.target.value))}
              disabled={listableCards.length === 0 || isGuest || isOfflineMode}
              className="w-full min-h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none focus:border-indigo-400"
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
              className="w-full min-h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 outline-none focus:border-indigo-400"
            />

            {selectedCardId && (
              <div className="text-[10px] text-slate-500 flex items-center justify-between px-1">
                <span>{language === 'ko' ? '공정 가격 밴드 (±30%):' : 'Fair Price Band (±30%):'}</span>
                <span className="font-bold text-indigo-600">
                  {MarketplacePriceBand.getInstance().evaluatePriceBand(selectedCardId, 0).minAllowedPrice.toLocaleString()} ~ {MarketplacePriceBand.getInstance().evaluatePriceBand(selectedCardId, 0).maxAllowedPrice.toLocaleString()} SNS
                </span>
              </div>
            )}

            {/* Row 1060 / ID 323: Suggested Market Price Guidance Chip */}
            {selectedCardId && (() => {
              const band = MarketplacePriceBand.getInstance().evaluatePriceBand(selectedCardId, 0);
              const suggested = band.recommendedPrice;
              return (
                <button
                  type="button"
                  onClick={() => setListingPriceInput(String(suggested))}
                  className="w-full py-1.5 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 rounded-lg text-[11px] font-mono font-bold flex items-center justify-between transition-colors"
                  title={language === 'ko' ? '클릭 시 권장가로 자동 입력' : 'Click to auto-fill suggested price'}
                >
                  <span>💡 {language === 'ko' ? '적정 시장 권장가:' : 'Suggested Price:'}</span>
                  <span className="underline font-black">{suggested.toLocaleString()} SNS (자동입력)</span>
                </button>
              );
            })()}

            <button
              type="button"
              onClick={handleCreateListing}
              disabled={listableCards.length === 0}
              className={cn(
                'w-full min-h-9 rounded-lg font-bold text-xs transition-all',
                listableCards.length === 0 ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500',
              )}
            >
              {t('marketplace_create_listing', language)}
            </button>
          </div>
        </section>

        {/* My Listings + My Requests */}
        <section className="grid lg:grid-cols-2 gap-5">
          {/* My Listings */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900">{t('marketplace_my_listings', language)}</h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* ID 353: 1-클릭 판매 대금 일괄 수령 (Claim All) 버튼 */}
                {totalClaimableSns > 0 && (
                  <button
                    type="button"
                    onClick={handleClaimAllSettlements}
                    className="px-2.5 py-1 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] flex items-center gap-1 shadow-sm cursor-pointer transition-all animate-bounce"
                  >
                    <Sparkles size={12} />
                    <span>{language === 'ko' ? `판매 대금 일괄 수령 (+${totalClaimableSns.toLocaleString()} SNS)` : `Claim All (+${totalClaimableSns.toLocaleString()} SNS)`}</span>
                  </button>
                )}
                {/* ID 403: 만료 임박 매물 1-클릭 일괄 재등록 버튼 */}
                {myListings.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRelistExpiringListings}
                    className="px-2.5 py-1 rounded-sm border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                    title={language === 'ko' ? '등록 유효기간 갱신 및 상단 재노출' : 'Refresh listing expiration'}
                  >
                    <span>{language === 'ko' ? '만료 임박 일괄 재등록' : 'Re-list All'}</span>
                  </button>
                )}
              </div>
            </div>
            {myListings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
                {t('marketplace_empty_my_listings', language)}
              </div>
            ) : (
              myListings.map((listing) => (
                <div key={listing.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-slate-900 truncate">{getCardTitle(listing.cardId)}</span>
                        {/* ID 403: 만료 임박 뱃지 */}
                        {listing.status === 'active' && (
                          <span className="text-[8px] font-bold px-1 py-0.2 rounded-xs bg-amber-100 text-amber-900 border border-amber-300">
                            {language === 'ko' ? '만료 임박' : 'Expiring'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{listing.askPrice.toLocaleString()} SNS</div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {(listing.status === 'active' || listing.status === 'pending' || listing.status === 'escrow') && (
                        <button
                          type="button"
                          onClick={() => handleCancelListing(listing.id)}
                          className="min-h-8 px-3 rounded-lg border border-rose-200 bg-white text-rose-700 font-bold text-[10px] hover:bg-rose-50 transition-colors"
                        >
                          {t('marketplace_cancel_listing', language)}
                        </button>
                      )}
                      {listing.status === 'pending' && listing.requestedByOfferId && (
                        <button
                          type="button"
                          onClick={() => handleStartEscrow(listing.id)}
                          className="min-h-8 px-3 rounded-lg bg-violet-600 text-white font-bold text-[10px] hover:bg-violet-500 transition-colors"
                        >
                          {t('marketplace_move_to_escrow', language)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* My Requests */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-2">
            <h2 className="text-base font-black text-slate-900">{t('marketplace_my_requests', language)}</h2>
            {myOffers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
                {t('marketplace_empty_my_requests', language)}
              </div>
            ) : (
              myOffers.map((offer) => (
                <div key={offer.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-black text-sm text-slate-900 truncate">{getCardTitle(offer.cardId)}</div>
                      <div className="text-xs text-slate-500">
                        {offer.buyerTotal.toLocaleString()} SNS
                      </div>
                    </div>
                    {(offer.status === 'pending' || offer.status === 'escrow') && (
                      <button
                        type="button"
                        onClick={() => handleCancelOffer(offer.id)}
                        className="min-h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold text-[10px] hover:bg-slate-100 transition-colors shrink-0"
                      >
                        {t('marketplace_cancel_request', language)}
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
            className="fixed inset-0 z-[209] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X size={14} />
              </button>

              <div className="text-center mb-5">
                <HelpCircle size={24} className="mx-auto text-indigo-500 mb-2" />
                <h3 className="text-sm font-black text-slate-900">
                  {t(HELP_STEPS[helpStep].titleKey, language)}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {t(HELP_STEPS[helpStep].descKey, language)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setHelpStep((s) => Math.max(0, s - 1))}
                  disabled={helpStep === 0}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-1.5">
                  {HELP_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-colors',
                        i === helpStep ? 'bg-indigo-500' : 'bg-slate-200',
                      )}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setHelpStep((s) => Math.min(HELP_STEPS.length - 1, s + 1))}
                  disabled={helpStep === HELP_STEPS.length - 1}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Ergonomic Bottom 1-Line Slim Filter Bar (Row 656 / ID 553) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#fdfcfc]/95 backdrop-blur-md border-t border-black/15 px-3 py-2 select-none font-mono shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-black text-black/60 uppercase px-1">
              [FILTER]
            </span>
            {(['all', 'instant', 'auction'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTradeTypeFilter(mode)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-bold rounded-sm border transition-all cursor-pointer whitespace-nowrap",
                  tradeTypeFilter === mode
                    ? "bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]"
                    : "bg-white text-black/70 border-black/15 hover:bg-black/5"
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
                onClick={() => setElementFilter(elem)}
                className={cn(
                  "px-2 py-1 text-[11px] font-bold rounded-sm border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1",
                  elementFilter === elem
                    ? "bg-blue-600 text-white border-blue-700 font-black"
                    : "bg-white text-black/70 border-black/15 hover:bg-black/5"
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white border-2 border-black p-5 space-y-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] font-mono">
            <div className="flex items-center justify-between border-b border-black pb-2">
              <h3 className="text-sm font-black flex items-center gap-1.5">
                <span>🎯</span>
                <span>{language === 'ko' ? '희망 매수가 예약 (Auto-Buy)' : 'Auto-Buy Limit Order'}</span>
              </h3>
              <button
                onClick={() => setAutoBuyModalCardId(null)}
                className="text-xs font-bold text-slate-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-800">
                {CARD_DATABASE[autoBuyModalCardId]?.title_dis || `Card #${autoBuyModalCardId}`}
              </div>
              <p className="text-[11px] text-slate-500">
                {language === 'ko'
                  ? '해당 카드에 설정한 희망가 이하의 매물이 마켓에 등록되면 자동 알림 및 구매를 진행합니다.'
                  : 'Receive alerts or auto-execute purchases when this card is listed at or below your target price.'}
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  {language === 'ko' ? '희망 최대 매수가 (SNS):' : 'Max Target Price (SNS):'}
                </label>
                <input
                  type="number"
                  step={50}
                  min={100}
                  value={autoBuyTargetPrice}
                  onChange={(e) => setAutoBuyTargetPrice(Math.max(100, Number(e.target.value)))}
                  className="w-full min-h-9 px-3 border border-black rounded-none text-xs font-mono"
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
                  className="flex-1 py-2 border border-rose-500 text-rose-600 font-bold text-xs hover:bg-rose-50 cursor-pointer"
                >
                  {language === 'ko' ? '예약 취소' : 'Cancel Limit'}
                </button>
              )}
              <button
                type="button"
                onClick={() => saveAutoBuyOrder(autoBuyModalCardId, autoBuyTargetPrice)}
                className="flex-1 py-2 bg-black text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                {language === 'ko' ? '희망가 저장' : 'Set Auto-Buy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
