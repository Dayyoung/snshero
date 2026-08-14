import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { CARD_DATABASE } from '../cardDatabase';
import { getMarketplaceFeePolicy, calculateMarketplaceSettlement } from '../content/marketplaceFees';
import { PageHeader } from '../components/PageHeader';
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
        if (rarityFilter === 'all') return true;
        return CARD_DATABASE[listing.cardId]?.rarity === rarityFilter;
      })
      .filter((listing) => {
        if (buildFocusFilter === 'all') return true;
        return getCardBuildFocus(CARD_DATABASE[listing.cardId]) === buildFocusFilter;
      })
      .sort((a, b) => b.askPrice - a.askPrice);
  }, [buildFocusFilter, marketState.listings, rarityFilter]);

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

  const updateFeedback = (key: string) => {
    setFeedbackKey(key);
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        setFeedbackKey((current) => (current === key ? null : current));
      }, 2500);
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
                    <div key={listing.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-black text-slate-900 truncate">{getCardTitle(listing.cardId)}</h3>
                          <div className="text-lg font-black text-slate-900 mt-0.5">{listing.askPrice.toLocaleString()} SNS</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRequestPurchase(listing)}
                          disabled={isMine || hasOpenOffer || listing.status !== 'active' || isGuest || isOfflineMode}
                          className={cn(
                            'min-h-9 px-4 rounded-lg font-bold text-xs transition-all shrink-0',
                            isMine || hasOpenOffer || listing.status !== 'active' || isGuest || isOfflineMode
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-slate-900 text-white hover:bg-slate-800',
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
                  );
                })
              )}
            </div>
          </div>

          {/* Create Listing */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
            <h2 className="text-base font-black text-slate-900">{t('marketplace_create_title', language)}</h2>

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
            <h2 className="text-base font-black text-slate-900">{t('marketplace_my_listings', language)}</h2>
            {myListings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
                {t('marketplace_empty_my_listings', language)}
              </div>
            ) : (
              myListings.map((listing) => (
                <div key={listing.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-black text-sm text-slate-900 truncate">{getCardTitle(listing.cardId)}</div>
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
    </div>
  );
};
