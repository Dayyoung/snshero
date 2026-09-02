import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ShoppingBag, ArrowRight, Zap, Terminal, Sparkles, AlertCircle, X, Package, Activity, ShieldAlert, History, Clock, Lock, HelpCircle, ChevronLeft, ChevronRight, BookOpen, Film, Download, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer, FUNDING } from "@paypal/react-paypal-js";
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { CARD_DATABASE } from '../cardDatabase';
import { CardItem } from '../components/CardItem';
import { cn, getFormattedCardName, getUserCollectionName, getAssetUrl } from '../lib/utils';
import { Language, CardData, Item, GoodsOrder, GoodsPaymentMethod, GoodsType, RefundRequestReason, CardRarity } from '../types';
import { ITEM_DATABASE } from '../constants/itemDatabase';
import { ProbabilityModal } from '../components/ProbabilityModal';
import { PityGauge } from '../components/PityGauge';
import { GACHA_PACK_CONFIG, determineGachaOutcomeRarity, type GachaPackRarity } from '../content/gachaRates';
import { advanceGachaPityState, getGachaPityView, loadGachaPityState, saveGachaPityState, type GachaPityState } from '../lib/gachaPity';
import { ItemIcon } from '../components/ItemIcon';
import { t } from '../lib/i18n';
import { PageHeader } from '../components/PageHeader';
import { TranslatedText } from '../components/TranslatedText';
import { analytics, logEvent, db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, addDoc } from '../lib/firebaseMock';
import { trackAnalytics, AnalyticsEvent } from '../lib/analyticsEvents';
import { ItemRarity } from '../types';
import { getCharacterIpProfile, getFactionDef } from '../content/characterIpUtils';
import { getCurrentSeasonConfig } from '../content/seasons';
import { buildCharacterShareCopy, buildSeasonShareCopy } from '../lib/shareTemplates';
import { getIpMerchProducts, findBestIpMerchProductForCardId, type IpMerchProduct } from '../content/ipProducts';
import { getCardSkinByKey, getUnlockTypeLabelKey } from '../content/cardSkins';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';
import { detectAppEnvironment } from '../lib/paymentGateways';
import { GachaRevealSequence } from '../components/GachaRevealSequence';
import { ShareTemplateCard } from '../components/ShareTemplateCard';
import { getGoodsSnsCost, getSpendShortfall, SNS_ECONOMY_COSTS } from '../content/snsEconomy';
import { useRefundRequests } from '../hooks/useRefundRequests';

interface ShopViewProps {
  sns: number;
  addCard: (rarity: CardRarity, indexOverride?: number, isSilent?: boolean) => void;
  addItem: (rarity?: ItemRarity, idOverride?: string) => Item;
  updateSns: (amount: number, reason?: string, type?: 'earned' | 'purchased') => void;
  playSfx: (url: string) => void;
  testMode: boolean;
  setTestMode: (val: boolean) => void;
  config?: any;
  language: Language;
  customCardImage?: string | null;
  processedCardImages?: string[];
  isImpersonating?: boolean;
  setGlobalPopupOpen?: (open: boolean) => void;
  onClawReward?: (card: CardData) => void;
  onClawPlay?: () => void;
  tutorialStep?: number;
  setTutorialStep?: (step: number) => void;
  onNavigate?: (view: any) => void;
  onTutorialComplete?: () => void;
  isAdRemoved?: boolean;
  setIsAdRemoved?: (val: boolean) => void;
  triggerDeckUpgradeCheck?: (indexes: number[]) => void;
  isPlayingback?: boolean;
  user?: any;
  userStats?: any;
  syncUserData?: (data: any) => Promise<void>;
  currentSeason?: string;
  ownedCards?: CardData[];
}


interface GachaCard {
  id?: string;
  imageIndex: number;
  rarity: GachaPackRarity;
  isRevealed: boolean;
}

interface AutoDrawState {
  packRarity: GachaPackRarity;
  cost: number;
  completed: number;
  total: number;
  remaining: number;
}

interface ShopPackGuideState {
  packRarity: GachaPackRarity;
  step: number;
}

interface ShopSpendGuideState {
  step: number;
}

interface ShopPityGuideState {
  step: number;
}

interface ShopFeatureGuideState {
  feature: 'item-pack' | 'ad-removal';
  step: number;
}

interface ShopHelpPopupState {
  step: number;
}

const GOODS_ORDERS_STORAGE_KEY = 'hero_goods_orders';
const REFUND_ELIGIBLE_PAYMENT_METHODS: GoodsPaymentMethod[] = ['dollar', 'paypal', 'payoneer', 'card', 'applepay', 'simplePay'];
const REFUND_REASON_OPTIONS: RefundRequestReason[] = ['accidental_purchase', 'wrong_item', 'delivery_issue', 'other'];

function loadStoredGoodsOrders(): GoodsOrder[] {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(GOODS_ORDERS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((order, index): GoodsOrder | null => {
        if (!order || typeof order !== 'object') return null;
        const candidate = order as Partial<GoodsOrder> & {
          itemName?: string;
          price?: string;
          quantity?: number;
          goodsSize?: 'S' | 'M' | 'L';
          paymentMethod?: string;
          cardId?: number;
          cardName?: string;
          email?: string;
          uid?: string;
          buyerName?: string;
          shippingAddress?: string;
          country?: string;
          timestamp?: number;
          season?: string;
        };

        if (typeof candidate.itemName !== 'string' || typeof candidate.timestamp !== 'number') return null;

        const paymentMethod = (typeof candidate.paymentMethod === 'string' ? candidate.paymentMethod : 'dollar') as GoodsPaymentMethod;
        const inferredAmountUsd = typeof candidate.amountUsd === 'number'
          ? candidate.amountUsd
          : (() => {
              if (typeof candidate.price !== 'string') return 0;
              const match = candidate.price.match(/\$([0-9]+(?:\.[0-9]+)?)/);
              return match ? Number(match[1]) : 0;
            })();
        const goodsType: GoodsType = candidate.goodsType
          ?? (candidate.itemName.toLowerCase().includes('shirt') ? 'tshirt' : 'mug');

        return {
          orderId: typeof candidate.orderId === 'string' && candidate.orderId.trim()
            ? candidate.orderId
            : `legacy-goods-${candidate.timestamp}-${index}`,
          buyerName: candidate.buyerName ?? '',
          shippingAddress: candidate.shippingAddress ?? '',
          country: candidate.country ?? 'ko',
          itemName: candidate.itemName,
          goodsType,
          quantity: typeof candidate.quantity === 'number' ? candidate.quantity : 1,
          goodsSize: candidate.goodsSize,
          price: candidate.price ?? (inferredAmountUsd > 0 ? `$${inferredAmountUsd} USD` : '$0 USD'),
          paymentMethod,
          cardId: typeof candidate.cardId === 'number' ? candidate.cardId : 1,
          cardName: candidate.cardName ?? 'Card #1',
          email: candidate.email ?? 'guest-email',
          uid: candidate.uid ?? 'guest-id',
          timestamp: candidate.timestamp,
          season: candidate.season ?? 'season1',
          currency: candidate.currency ?? (paymentMethod === 'coin' ? 'SNS' : 'USD'),
          amountUsd: inferredAmountUsd,
          amountSns: typeof candidate.amountSns === 'number' ? candidate.amountSns : undefined,
        };
      })
      .filter((order): order is GoodsOrder => order !== null)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);
  } catch {
    return [];
  }
}

function persistGoodsOrder(order: GoodsOrder): GoodsOrder[] {
  const existing = loadStoredGoodsOrders();
  const next = [order, ...existing.filter((candidate) => candidate.orderId !== order.orderId)]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 100);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(GOODS_ORDERS_STORAGE_KEY, JSON.stringify(next));
  }

  return next;
}

function getRefundStatusLabelKey(status: string): string {
  switch (status) {
    case 'reviewing':
      return 'refund_request_status_reviewing';
    case 'approved':
      return 'refund_request_status_approved';
    case 'rejected':
      return 'refund_request_status_rejected';
    case 'processed':
      return 'refund_request_status_processed';
    case 'requested':
    default:
      return 'refund_request_status_requested';
  }
}

function isRefundEligibleOrder(order: GoodsOrder): boolean {
  return order.currency === 'USD'
    && order.amountUsd > 0
    && REFUND_ELIGIBLE_PAYMENT_METHODS.includes(order.paymentMethod);
}

const PayPalButtonWrapper = ({ item, updateSns, playSfx, setSuccessVisible, setSelectedPaymentItem, testMode, funding, setCountryModalOpen, language, setIsAdRemoved, onSuccess }: any) => {
  const [{ isRejected, isPending, isResolved }] = usePayPalScriptReducer();

  if (isRejected) {
    return (
      <div className="w-full h-12 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center gap-2 text-red-600 text-[10px] font-bold uppercase tracking-widest">
        <AlertCircle size={14} />
        {language === 'ko' ? '결제 모듈 로드 실패' : 'Payment SDK Error'}
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="w-full h-12 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center gap-3">
        <div className="w-4 h-4 border-2 border-black/10 border-t-black rounded-full animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
          {language === 'ko' ? '로딩 중...' : 'Loading...'}
        </span>
      </div>
    );
  }

  return (
    <PayPalButtons
      fundingSource={funding}
      style={{
        layout: 'horizontal',
        color: 'black',
        shape: 'rect',
        label: 'pay',
        height: 48
      }}
      createOrder={(data, actions) => {
        return actions.order.create({
          purchase_units: [
            {
              description: item.label,
              amount: {
                value: item.price,
              },
            },
          ],
          intent: 'capture'
        });
      }}
      onApprove={async (data, actions) => {
        try {
          if (actions.order) {
            const details = await actions.order.capture();
            if (details.status === 'COMPLETED') {
              if (item.isGoods) {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                if (setCountryModalOpen) setCountryModalOpen(false);
                if (onSuccess) onSuccess();
              } else if (item.isAdRemoval && setIsAdRemoved) {
                setIsAdRemoved(true);
                playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                setSuccessVisible({ isAdRemoval: true });
              } else {
                updateSns(item.amount, 'sns_charge', 'purchased');
                playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                setSuccessVisible({ amount: item.amount });
              }
              setSelectedPaymentItem(null);
              if (setCountryModalOpen) setCountryModalOpen(false);

              if (analytics) {
                (logEvent as any)(analytics, 'purchase', {
                  value: parseFloat(item.price),
                  currency: 'USD',
                  items: [{ 
                    item_id: item.isGoods ? 'GOODS' : (item.isAdRemoval ? 'REMOVE_ADS' : 'SNS_RECHARGE'), 
                    item_name: item.label, 
                    quantity: item.isGoods ? (item.quantity || 1) : (item.isAdRemoval ? 1 : item.amount) 
                  }]
                });
              }
            }
          }
        } catch (error) {
          console.error("Payment failed", error);
        }
      }}
    />
  );
};


export const ShopView: React.FC<ShopViewProps> = ({
  sns,
  addCard,
  addItem,
  updateSns,
  playSfx,
  testMode,
  setTestMode,
  config,
  language,
  customCardImage,
  processedCardImages,
  isImpersonating = false,
  setGlobalPopupOpen,
  onClawReward,
  onClawPlay,
  tutorialStep = 0,
  setTutorialStep,
  onNavigate,
  onTutorialComplete,
  isAdRemoved = false,
  setIsAdRemoved,
  triggerDeckUpgradeCheck,
  isPlayingback = false,
  user,
  userStats,
  syncUserData,
  currentSeason = 'season1',
  ownedCards = []
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [goodsOrders, setGoodsOrders] = useState<GoodsOrder[]>(() => loadStoredGoodsOrders());
  const { requestMap: refundRequestMap, submitRequest: submitRefundRequest } = useRefundRequests();
  const [selectedRefundOrder, setSelectedRefundOrder] = useState<GoodsOrder | null>(null);
  const [refundReason, setRefundReason] = useState<RefundRequestReason>('accidental_purchase');
  const [refundDetails, setRefundDetails] = useState('');
  
  // Goods Shop States
  const [mugCardId, setMugCardId] = useState<number>(1);
  const [tshirtCardId, setTshirtCardId] = useState<number>(1);

  const [goodsModalOpen, setGoodsModalOpen] = useState(false);
  const [selectedGoods, setSelectedGoods] = useState<'mug' | 'tshirt' | null>(null);
  const [goodsQuantity, setGoodsQuantity] = useState(1);
  const [goodsSize, setGoodsSize] = useState<'S' | 'M' | 'L'>('M');
  
  const [goodsCardSelectOpen, setGoodsCardSelectOpen] = useState(false);
  const [goodsCheckoutOpen, setGoodsCheckoutOpen] = useState(false);
  const [goodsPaymentMethod, setGoodsPaymentMethod] = useState<
    'dollar' | 'coin' | 'paypal' | 'crypto' | 'test' | 'payoneer' | 'applepay' | 'card' | 'simplePay' | null
  >(null);
  const [selectedGoodsGatewayId, setSelectedGoodsGatewayId] = useState<string>('paypal');
  const [isAppEnv, setIsAppEnv] = useState(false);

  const [goodsShippingOpen, setGoodsShippingOpen] = useState(false);
  const [goodsPaymentPopupOpen, setGoodsPaymentPopupOpen] = useState(false);

  const [goodsSelectedCountry, setGoodsSelectedCountry] = useState<string | null>(null);
  const [goodsBuyerName, setGoodsBuyerName] = useState('');
  const [goodsBuyerAddress, setGoodsBuyerAddress] = useState('');
  const [goodsCountry, setGoodsCountry] = useState('ko');
  const [goodsThankYouOpen, setGoodsThankYouOpen] = useState(false);

  const [goodsCoinSelectOpen, setGoodsCoinSelectOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [customAlert, setCustomAlert] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const lowSpecMode = Boolean(config?.lowSpecMode);
  const currentSeasonConfig = useMemo(() => getCurrentSeasonConfig(currentSeason), [currentSeason]);
  const [probabilityModalOpen, setProbabilityModalOpen] = useState(false);
  const [selectedProbabilityPack, setSelectedProbabilityPack] = useState<GachaPackRarity>('bronze');
  const [packGuideState, setPackGuideState] = useState<ShopPackGuideState | null>(null);
  const [spendGuideState, setSpendGuideState] = useState<ShopSpendGuideState | null>(null);
  const [pityGuideState, setPityGuideState] = useState<ShopPityGuideState | null>(null);
  const [featureGuideState, setFeatureGuideState] = useState<ShopFeatureGuideState | null>(null);
  const [helpPopupState, setHelpPopupState] = useState<ShopHelpPopupState | null>(null);

  useEffect(() => {
    if (helpPopupState !== null) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [helpPopupState]);
  const [pityBannerOpen, setPityBannerOpen] = useState(false);
  const [gachaPityState, setGachaPityState] = useState<GachaPityState>(() => loadGachaPityState(currentSeason));
  const [gachaShareCardId, setGachaShareCardId] = useState<number | null>(null);
  const ipMerchProducts = useMemo(() => getIpMerchProducts(currentSeason), [currentSeason]);
  const [selectedIpProductId, setSelectedIpProductId] = useState<string | null>(null);
  const selectedIpProduct = useMemo(
    () => ipMerchProducts.find(product => product.id === selectedIpProductId) ?? null,
    [ipMerchProducts, selectedIpProductId]
  );
  const selectedIpSkin = useMemo(
    () => selectedIpProduct?.skinUnlockKey ? getCardSkinByKey(selectedIpProduct.skinUnlockKey) ?? null : null,
    [selectedIpProduct]
  );
  const goodsOrderCards = useMemo(() => {
    return goodsOrders.map((order) => ({
      order,
      refundRequest: refundRequestMap[order.orderId],
      eligible: isRefundEligibleOrder(order),
    }));
  }, [goodsOrders, refundRequestMap]);
  const pityBannerViews = useMemo(
    () => (['bronze', 'silver', 'gold'] as GachaPackRarity[]).map((rarity) => ({
      rarity,
      pityView: getGachaPityView(gachaPityState, rarity),
    })),
    [gachaPityState],
  );
  const activePackGuideSteps = useMemo(() => {
    if (!packGuideState) return [];

    const pityView = getGachaPityView(gachaPityState, packGuideState.packRarity);

    return [
      {
        title: t('shop_pack_guide_step_odds_title', language),
        body: t('shop_pack_guide_step_odds_body', language),
        accentClassName: 'border-sky-200 bg-sky-50 text-sky-700',
        actionLabel: t('shop_gacha_probability_button', language),
        onAction: () => {
          setSelectedProbabilityPack(packGuideState.packRarity);
          setProbabilityModalOpen(true);
        },
      },
      {
        title: t('shop_pack_guide_step_pity_title', language),
        body: t('shop_gacha_pity_next_condition', language, {
          threshold: pityView.threshold,
          rarity: t(`rarity_${pityView.guaranteeRarity}` as const, language),
        }),
        detail: t('shop_gacha_pity_scope_note', language),
        accentClassName: 'border-amber-200 bg-amber-50 text-amber-800',
      },
      {
        title: t('shop_pack_guide_step_policy_title', language),
        body: t('shop_pack_guide_step_policy_body', language),
        accentClassName: 'border-violet-200 bg-violet-50 text-violet-700',
        actionLabel: t('policy_center_title', language),
        onAction: () => onNavigate?.('policy-center'),
      },
    ];
  }, [gachaPityState, language, onNavigate, packGuideState]);
  const activePackGuideStep = packGuideState ? activePackGuideSteps[packGuideState.step] : null;
  const spendGuideSteps = useMemo(() => [
    {
      title: t('sns_spend_help_step_season_title', language),
      body: t('sns_spend_help_step_season_body', language),
      accentClassName: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      actionLabel: t('sns_spend_go_season_hub', language),
      onAction: () => onNavigate?.('season-hub'),
    },
    {
      title: t('sns_spend_help_step_event_title', language),
      body: t('sns_spend_help_step_event_body', language),
      accentClassName: 'border-sky-200 bg-sky-50 text-sky-700',
      actionLabel: t('sns_spend_go_event', language),
      onAction: () => onNavigate?.('event'),
    },
    {
      title: t('sns_spend_help_step_ready_title', language),
      body: t('sns_spend_help_step_ready_body', language),
      accentClassName: 'border-slate-200 bg-slate-50 text-slate-700',
    },
  ], [language, onNavigate]);
  const activeSpendGuideStep = spendGuideState ? spendGuideSteps[spendGuideState.step] : null;
  const pityGuideSteps = useMemo(() => [
    {
      title: t('shop_pity_guide_step_tracks_title', language),
      body: t('shop_pity_guide_step_tracks_body', language),
      accentClassName: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    {
      title: t('shop_pity_guide_step_graph_title', language),
      body: t('shop_pity_guide_step_graph_body', language),
      accentClassName: 'border-sky-200 bg-sky-50 text-sky-700',
      actionLabel: t('shop_gacha_pity_banner_cta', language),
      onAction: () => {
        setPityGuideState(null);
        setPityBannerOpen(true);
      },
    },
    {
      title: t('shop_pity_guide_step_pack_help_title', language),
      body: t('shop_pity_guide_step_pack_help_body', language),
      accentClassName: 'border-violet-200 bg-violet-50 text-violet-700',
    },
  ], [language]);
  const activePityGuideStep = pityGuideState ? pityGuideSteps[pityGuideState.step] : null;
  const featureGuideSteps = useMemo(() => ({
    'item-pack': [
      {
        title: t('shop_feature_item_pack_guide_step_rewards_title', language),
        body: t('shop_feature_item_pack_guide_step_rewards_body', language),
        accentClassName: 'border-purple-200 bg-purple-50 text-purple-700',
      },
      {
        title: t('shop_feature_item_pack_guide_step_rates_title', language),
        body: t('shop_feature_item_pack_guide_step_rates_body', language),
        accentClassName: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
      },
      {
        title: t('shop_feature_item_pack_guide_step_flow_title', language),
        body: t('shop_feature_item_pack_guide_step_flow_body', language),
        accentClassName: 'border-slate-200 bg-slate-50 text-slate-700',
      },
    ],
    'ad-removal': [
      {
        title: t('shop_feature_ad_removal_guide_step_effect_title', language),
        body: t('shop_feature_ad_removal_guide_step_effect_body', language),
        accentClassName: 'border-blue-200 bg-blue-50 text-blue-700',
      },
      {
        title: t('shop_feature_ad_removal_guide_step_purchase_title', language),
        body: t('shop_feature_ad_removal_guide_step_purchase_body', language),
        accentClassName: 'border-cyan-200 bg-cyan-50 text-cyan-700',
      },
      {
        title: t('shop_feature_ad_removal_guide_step_scope_title', language),
        body: t('shop_feature_ad_removal_guide_step_scope_body', language),
        accentClassName: 'border-slate-200 bg-slate-50 text-slate-700',
      },
    ],
  }), [language]);
  const activeFeatureGuideSteps = featureGuideState ? featureGuideSteps[featureGuideState.feature] : [];
  const activeFeatureGuideStep = featureGuideState ? activeFeatureGuideSteps[featureGuideState.step] : null;
  const activeFeatureGuideMeta = useMemo(() => {
    if (!featureGuideState) return null;

    if (featureGuideState.feature === 'item-pack') {
      return {
        badge: 'ITEM',
        label: t('item_pack', language),
        icon: Package,
        gradientClassName: 'from-purple-600 via-fuchsia-500 to-violet-500',
      };
    }

    return {
      badge: 'AD-FREE',
      label: language === 'ko' ? '광고 제거' : 'Ad-Free',
      icon: ShieldAlert,
      gradientClassName: 'from-blue-600 via-cyan-500 to-sky-500',
    };
  }, [featureGuideState, language]);

  const helpSteps = useMemo(() => [
    {
      title: t('shop', language),
      body: t('subheader_desc_shop', language),
      accentClassName: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    },
    {
      title: t('common_card_pack', language),
      body: `${t('common_pack_desc', language)}\n\n${t('magic_pack_desc', language)}\n\n${t('rare_pack_desc', language)}`,
      accentClassName: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    {
      title: t('buy_item_pack', language),
      body: t('item_pack_desc', language),
      accentClassName: 'border-purple-200 bg-purple-50 text-purple-700',
    },
    {
      title: language === 'ko' ? '광고 제거' : 'Ad-Free',
      body: language === 'ko' ? '게임 화면의 광고를 영구적으로 정리해 몰입도를 높입니다.' : 'Clean up in-game ads permanently for a calmer play flow.',
      accentClassName: 'border-blue-200 bg-blue-50 text-blue-700',
    },
    {
      title: t('shop_sns_shop_title', language),
      body: t('shop_sns_earn_info', language),
      accentClassName: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    {
      title: t('shop_gacha_pity_banner_modal_title', language),
      body: t('shop_gacha_pity_banner_desc', language) + '\n\n' + t('shop_gacha_pity_scope_note', language),
      accentClassName: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    {
      title: t('coin_recharge', language),
      body: language === 'ko' ? 'USD, 암호화폐, 페이팔 등 다양한 결제 수단으로 SNS 코인을 충전할 수 있습니다.' : 'Recharge SNS coins via USD, crypto, PayPal, and other payment methods.',
      accentClassName: 'border-slate-200 bg-slate-50 text-slate-700',
    },
    {
      title: t('ip_shop_season_limited', language),
      body: t('ip_shop_season_limited_desc', language) + '\n\n' + t('ip_shop_showcase_desc', language),
      accentClassName: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
    },
    {
      title: t('refund_request_section_title', language),
      body: t('refund_request_section_desc', language),
      accentClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
  ], [language]);

  const handleOpenRefundRequest = (order: GoodsOrder) => {
    setSelectedRefundOrder(order);
    setRefundReason('accidental_purchase');
    setRefundDetails('');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handleSubmitRefundRequest = () => {
    if (!selectedRefundOrder) return;

    const createdRequest = submitRefundRequest({
      orderId: selectedRefundOrder.orderId,
      amountUsd: selectedRefundOrder.amountUsd,
      reason: refundReason,
      details: refundDetails,
      expectedBusinessDays: '2-3',
    });

    if (!createdRequest) {
      setCustomAlert({
        isOpen: true,
        title: t('refund_request_submitted', language),
        message: t('refund_request_submitted_desc', language),
      });
      setSelectedRefundOrder(null);
      return;
    }

    setSelectedRefundOrder(null);
    setRefundDetails('');
    setCustomAlert({
      isOpen: true,
      title: t('refund_request_submitted', language),
      message: t('refund_request_submitted_desc', language),
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    
    // Mall에서 전달된 굿즈 구매 파라미터 처리 (?goods=mug|tshirt|table|deck&qty=1&size=M)
    const goodsParam = params.get('goods');
    if (goodsParam) {
      const gType = goodsParam.toLowerCase();
      if (gType.includes('mug') || gType.includes('머그')) {
        setSelectedGoods('mug');
        setGoodsModalOpen(true);
      } else if (gType.includes('tshirt') || gType.includes('shirt') || gType.includes('티셔츠')) {
        setSelectedGoods('tshirt');
        setGoodsModalOpen(true);
      } else {
        setSelectedGoods('tshirt');
        setGoodsModalOpen(true);
      }

      const qParam = parseInt(params.get('qty') || '1', 10);
      if (!isNaN(qParam) && qParam > 0) {
        setGoodsQuantity(qParam);
      }

      const sParam = params.get('size');
      if (sParam === 'S' || sParam === 'M' || sParam === 'L') {
        setGoodsSize(sParam);
      }
      return;
    }

    // PostMessage listener from embedded mall iframe
    const handleMallMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SNSHERO_MALL_BUY') {
        const { goodsType, quantity, size } = event.data;
        const gType = String(goodsType).toLowerCase();
        if (gType.includes('mug') || gType.includes('머그')) {
          setSelectedGoods('mug');
        } else {
          setSelectedGoods('tshirt');
        }
        if (quantity && quantity > 0) setGoodsQuantity(quantity);
        if (size === 'S' || size === 'M' || size === 'L') setGoodsSize(size);
        setGoodsModalOpen(true);
      }
    };
    window.addEventListener('message', handleMallMessage);

    const merchProductId = params.get('merchProductId');
    if (merchProductId && ipMerchProducts.some(product => product.id === merchProductId)) {
      setSelectedIpProductId(merchProductId);
      return () => window.removeEventListener('message', handleMallMessage);
    }

    const merchCardId = Number(params.get('merchCardId') || '');
    if (Number.isFinite(merchCardId) && merchCardId > 0) {
      const matchedProduct = findBestIpMerchProductForCardId(merchCardId, currentSeason);
      if (matchedProduct) {
        setSelectedIpProductId(matchedProduct.id);
      }
    }

    return () => window.removeEventListener('message', handleMallMessage);
  }, [currentSeason, ipMerchProducts]);

  useEffect(() => {
    setGachaPityState(loadGachaPityState(currentSeason));
  }, [currentSeason]);

  useEffect(() => {
    saveGachaPityState(currentSeason, gachaPityState);
  }, [currentSeason, gachaPityState]);

  const recordGachaPity = (packRarity: GachaPackRarity, drawnRarities: Array<'bronze' | 'silver' | 'gold'>) => {
    setGachaPityState((prev) => advanceGachaPityState(prev, packRarity, drawnRarities));
  };

  // 부지런의 나무 관련 상태
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [claimedSteps, setClaimedSteps] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedDate = localStorage.getItem('hero_steps_claimed_date');
      if (savedDate === todayStr) {
        return Number(localStorage.getItem('hero_today_claimed_steps') || '0');
      }
    }
    return 0;
  });

  const [currentSteps, setCurrentSteps] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedDate = localStorage.getItem('hero_steps_claimed_date');
      if (savedDate === todayStr) {
        return Number(localStorage.getItem('hero_current_steps') || '0');
      }
    }
    return 0;
  });



  // 12시(자정) 지나면 정산 기록 리셋
  useEffect(() => {
    const checkMidnight = () => {
      const currentDate = new Date().toISOString().split('T')[0];
      const savedDate = localStorage.getItem('hero_steps_claimed_date');
      if (savedDate !== currentDate) {
        localStorage.setItem('hero_steps_claimed_date', currentDate);
        localStorage.setItem('hero_today_claimed_steps', '0');
        localStorage.setItem('hero_current_steps', '0');
        setClaimedSteps(0);
        setCurrentSteps(0);
      }
    };
    checkMidnight();
    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
  }, []);


  // 걸음수 연동 시도 함수
  const fetchTodaySteps = async (): Promise<number | null> => {
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
    const isChrome = userAgent.includes('chrome') || userAgent.includes('chromium');
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('chromium');

    if (isChrome) {
      if (typeof window !== 'undefined' && (window as any).AndroidBridge?.getTodaySteps) {
        try {
          const steps = await (window as any).AndroidBridge.getTodaySteps();
          return Number(steps);
        } catch (err) {
          console.error("Android Health Connect Bridge Error:", err);
        }
      }
    }

    if (isSafari) {
      if (typeof window !== 'undefined' && (window as any).webkit?.messageHandlers?.healthKit) {
        try {
          return new Promise((resolve) => {
            (window as any).onHealthKitStepsResponse = (steps: number) => {
              resolve(Number(steps));
              delete (window as any).onHealthKitStepsResponse;
            };
            (window as any).webkit.messageHandlers.healthKit.postMessage({
              action: "getTodaySteps",
              callback: "onHealthKitStepsResponse"
            });
            setTimeout(() => {
              resolve(null);
            }, 2000);
          });
        } catch (err) {
          console.error("iOS HealthKit Bridge Error:", err);
        }
      }
    }

    return null;
  };

  // Goods Shop Helper Functions
  const handleOpenGoodsModal = (type: 'mug' | 'tshirt') => {
    setSelectedGoods(type);
    setGoodsQuantity(1);
    setGoodsSize('M');
    setGoodsModalOpen(true);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const getMerchGoodsType = (product: IpMerchProduct): 'mug' | 'tshirt' => {
    return product.type === 'webtoon-poster' || product.type === 'goods-bundle' ? 'tshirt' : 'mug';
  };

  const handleOpenMerchProduct = (product: IpMerchProduct) => {
    setSelectedIpProductId(product.id);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handleCloseMerchProduct = () => {
    setSelectedIpProductId(null);
  };

  const handleMerchGoodsCheckout = (product: IpMerchProduct) => {
    const primaryCardId = product.cardIds[0] ?? product.featuredCardId;
    const goodsType = getMerchGoodsType(product);

    if (goodsType === 'mug') {
      setMugCardId(primaryCardId);
    } else {
      setTshirtCardId(primaryCardId);
    }

    handleOpenGoodsModal(goodsType);
  };

  const handleMerchShareImage = (product: IpMerchProduct) => {
    const cardIds = product.cardIds.slice(0, 5);
    const title = t(product.titleKey, language);
    const query = cardIds.map((cardId, index) => `card${index + 1}=${cardId}`).join('&');
    const shareUrl = `/share?id=${encodeURIComponent(title)}${query ? `&${query}` : ''}`;

    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', shareUrl);
    }

    onNavigate?.('share');
  };

  const handleMerchOpenCodex = (cardId?: number) => {
    if (typeof window !== 'undefined') {
      const url = new URL('/wiki/card', window.location.origin);
      if (cardId) {
        url.searchParams.set('cardId', String(cardId));
      }
      window.history.pushState({}, '', `${url.pathname}${url.search}`);
    }

    onNavigate?.('wiki-card');
  };
  const handleMerchOpenWebtoon = () => onNavigate?.('webtoon');

  const renderMerchProductCard = (product: IpMerchProduct) => {
    const primaryCardId = product.cardIds[0] ?? product.featuredCardId;
    const primaryCard = CARD_DATABASE[primaryCardId];
    const faction = product.faction ?? getCharacterIpProfile(primaryCardId)?.faction;
    const factionDef = faction ? getFactionDef(faction) : undefined;
    const sectionLabel = product.section === 'character'
      ? t('ip_shop_character_goods', language)
      : t('ip_shop_season_limited', language);
    const priceLabel = product.price.currency === 'USD'
      ? `$${product.price.amount.toFixed(2)} USD`
      : `${product.price.amount.toLocaleString()} SNS`;

    return (
      <motion.article
        key={product.id}
        whileHover={lowSpecMode ? undefined : { y: -4 }}
        className="bg-white border border-slate-100 p-4 sm:p-5 md:p-6 flex flex-col gap-4 relative overflow-hidden group shadow-sm hover:shadow-md transition-all rounded-2xl text-left"
      >
        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-slate-900/5 blur-[42px] sm:blur-[52px] -mr-12 -mt-12 sm:-mr-16 sm:-mt-16 transition-all duration-500 group-hover:bg-slate-900/10" />
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="bg-slate-900 text-white px-2.5 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-lg">
            {sectionLabel}
          </div>
          <div className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-amber-100">
            {priceLabel}
          </div>
        </div>

        <div className="flex gap-4 items-start relative z-10">
          <div className="w-24 sm:w-28 shrink-0 aspect-[5/7] rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
            {primaryCard ? (
              <CardItem
                card={{
                  ...primaryCard,
                  id: `ip-merch-${product.id}`,
                  owner: null,
                  level: 1,
                  imageIndex: primaryCard.index,
                }}
                className="w-full h-full text-[6px]"
                customImage={customCardImage}
                processedImage={processedCardImages?.[primaryCard.index - 1]}
                lowSpecMode={true}
                hideStats
              />
            ) : (
              <img src={product.imageFallback} alt={t(product.titleKey, language)} className="w-full h-full object-cover" />
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="space-y-1">
              <h3 className="font-bold text-base sm:text-lg tracking-tight text-slate-800 line-clamp-2">
                {t(product.titleKey, language)}
              </h3>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold tracking-widest uppercase leading-relaxed line-clamp-3">
                {t(product.descKey, language)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-slate-500">
              <span>{t(product.purchaseNoteKey, language)}</span>
              <span>•</span>
              <span>{t(currentSeasonConfig.titleKey, language)}</span>
              {factionDef && (
                <>
                  <span>•</span>
                  <span>{t(factionDef.nameKey, language)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-auto border-t border-slate-100 pt-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {t('ip_shop_open_goods', language)}
              </div>
              <div className="text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-700">
                {t('ip_shop_view_detail', language)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenMerchProduct(product)}
              className="inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-slate-950 px-4 py-3 text-left text-white shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98] touch-target sm:w-auto sm:min-w-[180px]"
              aria-label={t(product.titleKey, language)}
            >
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-white">
                {t('ip_shop_view_detail', language)}
              </span>
              <ArrowRight size={16} className="shrink-0 text-white/70" />
            </button>
          </div>
        </div>
      </motion.article>
    );
  };

  const getMerchShareCaption = (product: IpMerchProduct): string => {
    if (product.shareType === 'season') {
      return buildSeasonShareCopy(
        t(product.seasonKey, language),
        t(product.titleKey, language),
        currentSeason,
        language,
      ).caption;
    }

    return buildCharacterShareCopy(product.featuredCardId, language).caption;
  };


  const handleGoodsDollarCheckout = () => {
    const priceVal = selectedGoods === 'mug' ? 10 : 35;
    const totalPrice = priceVal * goodsQuantity;
    const goodsCardId = selectedGoods === 'mug' ? mugCardId : tshirtCardId;
    const cardInfo = CARD_DATABASE[goodsCardId];

    setSelectedGoodsGatewayId('paypal');
    localStorage.setItem('hero_goods_pending_payment', JSON.stringify({
      goodsType: selectedGoods,
      cardId: goodsCardId,
      cardName: cardInfo ? (language === 'ko' ? cardInfo.title : cardInfo.title_en) : '',
      quantity: goodsQuantity,
      goodsSize: selectedGoods === 'tshirt' ? goodsSize : undefined,
      totalPrice: `$${totalPrice} USD`,
      timestamp: Date.now()
    }));

    setGoodsCheckoutOpen(false);
    setSelectedPackage({
      amount: 0,
      price: totalPrice.toString(),
      label: selectedGoods === 'mug' ? 'Custom Mug Cup' : 'Custom T-Shirt',
      isGoods: true,
      goodsType: selectedGoods,
      quantity: goodsQuantity,
      cardId: goodsCardId
    } as any);
    setSelectedCountry(null);
    setCountryModalOpen(true);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handleGoodsPaymentConfirm = () => {
    setGoodsPaymentMethod('dollar');
    setGoodsPaymentPopupOpen(false);
    setGoodsShippingOpen(true);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  const handleGoodsCryptoPayment = () => {
    const priceVal = selectedGoods === 'mug' ? 10 : 35;
    const totalPrice = priceVal * goodsQuantity;
    const goodsCardId = selectedGoods === 'mug' ? mugCardId : tshirtCardId;

    setSelectedGoodsGatewayId('crypto-okx');
    const pendingPayment = {
      goodsType: selectedGoods,
      cardId: goodsCardId,
      quantity: goodsQuantity,
      goodsSize: selectedGoods === 'tshirt' ? goodsSize : undefined,
      totalPrice: `$${totalPrice} USD`,
      paymentMethod: 'crypto',
      country: goodsCountry || 'ko',
      timestamp: Date.now()
    };
    localStorage.setItem('hero_goods_pending_payment', JSON.stringify(pendingPayment));

    setGoodsCheckoutOpen(false);
    setGoodsPaymentPopupOpen(false);
    setSelectedPaymentItem({ amount: totalPrice * 1000, price: totalPrice.toString(), label: selectedGoods === 'mug' ? 'Goods Mug Cup' : 'Goods T-Shirt', isGoods: true } as any);
    setCryptoModalOpen(true);
    setCryptoStep('coin');
    fetchCryptoCoins();
  };

  const handleGoodsCoinPurchase = async (coinType: string) => {
    const totalSnsCost = getGoodsSnsCost(selectedGoods, goodsQuantity);

    if (sns < totalSnsCost) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      setCustomAlert({
        isOpen: true,
        title: language === 'ko' ? '잔액 부족' : 'INSUFFICIENT COINS',
        message: language === 'ko'
          ? `보유 코인이 부족합니다. 필요한 코인: ${totalSnsCost.toLocaleString()} SNS`
          : `You do not have enough coins. Required: ${totalSnsCost.toLocaleString()} SNS`
      });
      return;
    }

    updateSns(-totalSnsCost, 'goods_purchase', selectedGoods === 'mug' ? 'Mug Cup' : 'T-Shirt');
    setGoodsPaymentMethod('coin');
    setGoodsCheckoutOpen(false);
    setGoodsShippingOpen(true);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  const handleGoodsTestPurchase = () => {
    setGoodsPaymentMethod('test');
    setGoodsCheckoutOpen(false);
    setGoodsShippingOpen(true);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  const handlePayoneerPayment = async () => {
    if (!selectedPackage) return;
    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');

    setCustomAlert({
      isOpen: true,
      title: language === 'ko' ? '결제 요청 중' : 'Processing Payment',
      message: language === 'ko' ? '페이오니아 안전 결제 페이지로 이동하고 있습니다. 잠시만 기다려주세요...' : 'Redirecting to Payoneer secure checkout. Please wait...'
    });

    try {
      const returnBaseUrl = window.location.origin + window.location.pathname;
      const res = await axios.post('/api/payoneer/create-session', {
        amount: selectedPackage.price,
        currency: 'USD',
        label: selectedPackage.label,
        isAdRemoval: !!selectedPackage.isAdRemoval,
        isGoods: false,
        returnBaseUrl
      });

      if (res.data?.redirectUrl) {
        window.location.href = res.data.redirectUrl;
      } else {
        throw new Error(res.data?.error || 'Invalid session response');
      }
    } catch (err: any) {
      console.error("Payoneer checkout initialization failed:", err);
      setCustomAlert({
        isOpen: true,
        title: language === 'ko' ? '결제 실패' : 'Payment Failed',
        message: language === 'ko' ? '결제 세션을 생성하지 못했습니다. 다시 시도해 주세요.' : 'Failed to create payment session. Please try again.'
      });
    }
  };

  const handleGoodsShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goodsBuyerName.trim() || !goodsBuyerAddress.trim()) {
      setCustomAlert({
        isOpen: true,
        title: language === 'ko' ? '입력 오류' : 'INPUT ERROR',
        message: language === 'ko' ? '모든 정보를 입력해주세요.' : 'Please enter all information.'
      });
      return;
    }

    const goodsCardId = selectedGoods === 'mug' ? mugCardId : tshirtCardId;
    const cardInfo = CARD_DATABASE[goodsCardId];
    const priceVal = selectedGoods === 'mug' ? 10 * goodsQuantity : 35 * goodsQuantity;
    const paymentMethod = (goodsPaymentMethod || 'dollar') as GoodsPaymentMethod;
    const goodsType = selectedGoods as GoodsType;

    const purchaseData: GoodsOrder = {
      orderId: `goods-${Date.now()}-${user?.uid || 'guest-id'}-${goodsType}-${goodsCardId}`,
      buyerName: goodsBuyerName,
      shippingAddress: goodsBuyerAddress,
      country: goodsCountry,
      itemName: selectedGoods === 'mug' ? 'Custom Mug Cup' : 'Custom T-Shirt',
      goodsType,
      quantity: goodsQuantity,
      goodsSize: selectedGoods === 'tshirt' ? goodsSize : undefined,
      price: paymentMethod === 'coin' ? `${(priceVal * 1000).toLocaleString()} SNS` : `$${priceVal} USD`,
      paymentMethod,
      cardId: goodsCardId,
      cardName: cardInfo ? (language === 'ko' ? cardInfo.title : cardInfo.title_en) : `Card #${goodsCardId}`,
      email: user?.email || 'guest-email',
      uid: user?.uid || 'guest-id',
      timestamp: Date.now(),
      season: currentSeason,
      currency: paymentMethod === 'coin' ? 'SNS' : 'USD',
      amountUsd: paymentMethod === 'coin' ? 0 : priceVal,
      amountSns: paymentMethod === 'coin' ? priceVal * 1000 : undefined,
    };
    if (goodsPaymentMethod === 'payoneer') {
      localStorage.setItem('hero_goods_pending_order', JSON.stringify(purchaseData));

      setCustomAlert({
        isOpen: true,
        title: language === 'ko' ? '결제 요청 중' : 'Processing Payment',
        message: language === 'ko' ? '페이오니아 안전 결제 페이지로 이동하고 있습니다. 잠시만 기다려주세요...' : 'Redirecting to Payoneer secure checkout. Please wait...'
      });

      try {
        const returnBaseUrl = window.location.origin + window.location.pathname;
        const res = await axios.post('/api/payoneer/create-session', {
          amount: priceVal.toString(),
          currency: 'USD',
          label: selectedGoods === 'mug' ? 'Custom Mug Cup' : 'Custom T-Shirt',
          isAdRemoval: false,
          isGoods: true,
          returnBaseUrl
        });

        if (res.data?.redirectUrl) {
          window.location.href = res.data.redirectUrl;
        } else {
          throw new Error(res.data?.error || 'Invalid session response');
        }
      } catch (err: any) {
        console.error("Payoneer goods checkout initialization failed:", err);
        setCustomAlert({
          isOpen: true,
          title: language === 'ko' ? '결제 실패' : 'Payment Failed',
          message: language === 'ko' ? '결제 세션을 생성하지 못했습니다. 다시 시도해 주세요.' : 'Failed to create payment session. Please try again.'
        });
      }
      return;
    }

    let saved = false;
    try {
      const purchasesRef = collection(db, 'purchases');
      await addDoc(purchasesRef, purchaseData);
      persistGoodsOrder(purchaseData);
      setGoodsOrders(loadStoredGoodsOrders());
      saved = true;
    } catch (error) {
      console.warn("Firestore save failed, falling back to localStorage:", error);
    }

    if (!saved) {
      try {
        setGoodsOrders(persistGoodsOrder(purchaseData));
        saved = true;
      } catch (storageError) {
        console.error("localStorage fallback also failed:", storageError);
      }
    }

    if (!saved) {
      setCustomAlert({
        isOpen: true,
        title: language === 'ko' ? '오류 발생' : 'ERROR',
        message: language === 'ko' ? '주문 처리에 실패했습니다.' : 'Failed to process order.'
      });
      return;
    }

    setGoodsShippingOpen(false);
    setGoodsModalOpen(false);
    setGoodsThankYouOpen(true);

    setGoodsBuyerName('');
    setGoodsBuyerAddress('');
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  const handleClaimSteps = async () => {
    if (!user || user.uid === 'guest-id') {
      setCustomAlert({
        isOpen: true,
        title: language === 'ko' ? '로그인 필요' : 'LOGIN REQUIRED',
        message: t('not_logged_in', language)
      });
      return;
    }

    const steps = await fetchTodaySteps();
    
    if (steps === null) {
      setCustomAlert({
        isOpen: true,
        title: language === 'ko' ? '연동 실패' : 'SYNC FAILED',
        message: t('tree_of_diligence_sync_failed', language)
      });
      return;
    }

    processStepsClaim(steps);
  };

  const processStepsClaim = async (totalSteps: number) => {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem('hero_steps_claimed_date');
    
    let currentClaimed = claimedSteps;
    if (savedDate !== today) {
      currentClaimed = 0;
    }

    const unclaimed = totalSteps - currentClaimed;
    if (unclaimed <= 0) {
      setCustomAlert({
        isOpen: true,
        title: language === 'ko' ? '정산 불가' : 'CLAIM UNAVAILABLE',
        message: language === 'ko' ? '새로운 추가 걸음수가 없습니다.' : 'No new additional steps.'
      });
      return;
    }

    playSfx('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
    try {
      updateSns(unclaimed, 'pedometer_step_reward', 'earned');

      localStorage.setItem('hero_steps_claimed_date', today);
      localStorage.setItem('hero_today_claimed_steps', String(totalSteps));
      localStorage.setItem('hero_current_steps', String(totalSteps));
      setClaimedSteps(totalSteps);
      setCurrentSteps(totalSteps);

      const now = Date.now();
      const historyRef = collection(db, getUserCollectionName(currentSeason), user.uid, 'snsHistory');
      await addDoc(historyRef, {
        reason: t('tree_of_diligence', language),
        amount: unclaimed,
        timestamp: now
      });

      const saved = localStorage.getItem('hero_sns_history');
      const list = saved ? JSON.parse(saved) : [];
      const newList = [{ reason: t('tree_of_diligence', language), amount: unclaimed, timestamp: now }, ...list].slice(0, 50);
      localStorage.setItem('hero_sns_history', JSON.stringify(newList));
      setHistoryList(newList);

      setCustomAlert({
        isOpen: true,
        title: language === 'ko' ? '정산 성공' : 'CLAIM SUCCESS',
        message: language === 'ko' 
          ? `오늘 정산 완료! ${unclaimed.toLocaleString()} SNS 포인트가 지급되었습니다.`
          : `Claim successful! ${unclaimed.toLocaleString()} SNS points awarded.`
      });
    } catch (e) {
      console.error(e);
    }
  };


  useEffect(() => {
    if (!showHistory) return;
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        if (user && user.uid !== 'guest-id') {
          const historyRef = collection(db, getUserCollectionName(currentSeason), user.uid, 'snsHistory');
          const q = query(historyRef, orderBy('timestamp', 'desc'), limit(50));
          const snap = await getDocs(q);
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setHistoryList(list);
        } else {
          const saved = localStorage.getItem('hero_sns_history');
          setHistoryList(saved ? JSON.parse(saved) : []);
        }
      } catch (err) {
        console.error("Error fetching SNS history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [showHistory, user]);

  const [gachaState, setGachaState] = useState<{
    isActive: boolean;
    step: number;
    packType: GachaPackRarity | 'item' | 'roulette' | null;
    isRevealed: boolean;
    cards: GachaCard[];
    items: { id?: string; item: Item; isRevealed: boolean }[];
    acquiredItemName?: string;
    acquiredItemDescription?: string;
    roulettePrize?: { type: 'sns' | 'item' | 'card', value: any, label: string };
  }>({
    isActive: false,
    step: 0,
    packType: null,
    isRevealed: false,
    cards: [],
    items: []
  });

  useEffect(() => {
    if (tutorialStep === 8) {
      setSuccessVisible({ amount: 10 });
    }
    if (tutorialStep === 9 && !gachaState.isActive) {
      buyPack(10, 'bronze');
    }
  }, [tutorialStep, gachaState.isActive]);

  // Macro Playback auto-reveal cards/items cheat/helper to prevent getting stuck
  useEffect(() => {
    if (isPlayingback && gachaState.isActive && gachaState.packType) {
      if (gachaState.packType === 'item') {
        const hasUnrevealed = gachaState.items && gachaState.items.some(i => !i.isRevealed);
        if (hasUnrevealed) {
          const timer = setTimeout(() => {
            setGachaState(prev => ({
              ...prev,
              items: prev.items.map(item => ({ ...item, isRevealed: true }))
            }));
            playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          }, 600);
          return () => clearTimeout(timer);
        }
      } else if (gachaState.packType !== 'roulette') {
        const hasUnrevealed = gachaState.cards && gachaState.cards.some(c => !c.isRevealed);
        if (hasUnrevealed) {
          const timer = setTimeout(() => {
            setGachaState(prev => ({
              ...prev,
              cards: prev.cards.map(c => ({ ...c, isRevealed: true }))
            }));
            playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          }, 600);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [isPlayingback, gachaState.isActive, gachaState.packType, gachaState.cards, gachaState.items, playSfx]);

  const [selectedPaymentItem, setSelectedPaymentItem] = useState<{ amount: number, price: string, label: string, krwPrice?: string } | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Crypto State
  const [cryptoModalOpen, setCryptoModalOpen] = useState(false);
  const [cryptoCoins, setCryptoCoins] = useState<any[]>([]);
  const [isLoadingCoins, setIsLoadingCoins] = useState(false);
  const [coinSearch, setCoinSearch] = useState('');
  const [coinSort, setCoinSort] = useState<'popular' | 'alpha'>('popular');
  const [cryptoStep, setCryptoStep] = useState<'coin' | 'chain'>('coin');
  const [selectedCoinForChains, setSelectedCoinForChains] = useState<any[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<{ address: string, amount: string, ccy: string, expiresAt: number, since: number, snsAmount: number, chain?: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isVerifyingCrypto, setIsVerifyingCrypto] = useState(false);
  const [cryptoSuccessModal, setCryptoSuccessModal] = useState(false);
  const [cryptoError, setCryptoError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);

  const COUNTRIES = [
    { code: 'en', name: 'United States', flag: '🇺🇸' },
    { code: 'gb', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'ko', name: '대한민국 (South Korea)', flag: '🇰🇷' },
    { code: 'ja', name: '日本 (Japan)', flag: '🇯🇵' },
    { code: 'zh', name: '中国 (China)', flag: '🇨🇳' },
    { code: 'es', name: 'España (Spain)', flag: '🇪🇸' },
    { code: 'fr', name: 'France', flag: '🇫🇷' },
    { code: 'de', name: 'Deutschland (Germany)', flag: '🇩🇪' },
    { code: 'vi', name: 'Việt Nam (Vietnam)', flag: '🇻🇳' },
    { code: 'th', name: 'ประเทศไทย (Thailand)', flag: '🇹🇭' },
    { code: 'id', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'ru', name: 'Россия (Russia)', flag: '🇷🇺' },
  ];

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Old Step 4 logic removed to favor Step 8/9 manual flow
  }, [tutorialStep]);

  useEffect(() => {
    if (setGlobalPopupOpen) {
      setGlobalPopupOpen(gachaState.isActive || goodsCardSelectOpen || goodsCheckoutOpen || goodsShippingOpen || goodsPaymentPopupOpen);
    }

    return () => {
      if (setGlobalPopupOpen) {
        setGlobalPopupOpen(false);
      }
    };
  }, [gachaState.isActive, goodsCardSelectOpen, goodsCheckoutOpen, goodsShippingOpen, goodsPaymentPopupOpen, setGlobalPopupOpen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const successAmount = params.get('payapp_success');
    if (successAmount) {
      if (window.opener && window.opener !== window) {
        try {
          window.opener.location.href = window.location.href;
          window.close();
          return;
        } catch (e) {
          console.error('Failed to notify opener', e);
        }
      }

      if (successAmount === 'ad_removal') {
        if (setIsAdRemoved) setIsAdRemoved(true);
        playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        setSuccessVisible({ isAdRemoval: true });
      } else if (successAmount === 'goods') {
        playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
        const pendingOrderStr = localStorage.getItem('hero_goods_pending_order');
        if (pendingOrderStr) {
          try {
            const purchaseData = JSON.parse(pendingOrderStr) as GoodsOrder;
            const purchasesRef = collection(db, 'purchases');
            addDoc(purchasesRef, purchaseData).catch(err => {
              console.warn("Firestore save on return failed, falling back to localStorage", err);
              setGoodsOrders(persistGoodsOrder(purchaseData));
            });
            setGoodsOrders(persistGoodsOrder(purchaseData));
            setGoodsThankYouOpen(true);
            localStorage.removeItem('hero_goods_pending_order');
            localStorage.removeItem('hero_goods_pending_payment');
          } catch (e) {
            console.error('Failed to process returned goods order', e);
          }
        }
      } else {
        const amount = parseInt(successAmount, 10);
        if (!isNaN(amount) && amount > 0) {
          updateSns(amount, 'sns_charge', 'purchased');
          playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
          setSuccessVisible({ amount });
        }
      }
      // Remove query param
      const url = new URL(window.location.href);
      url.searchParams.delete('payapp_success');
      window.history.replaceState({}, '', url.toString());
    }

    const scriptId = 'payapp-lite-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://lite.payapp.kr/public/api/v2/payapp-lite.js";
      script.async = true;
      script.onerror = (e) => {
        console.warn('Payapp lite script failed to load:', e);
      };
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const pendingStr = localStorage.getItem('hero_goods_pending_payment');
    const params = new URLSearchParams(window.location.search);
    const isGoodsReturn = params.get('payapp_success') === 'goods';
    if (pendingStr && isGoodsReturn) {
      try {
        const pending = JSON.parse(pendingStr);
        if (pending.goodsType === 'mug') {
          setMugCardId(pending.cardId);
        } else {
          setTshirtCardId(pending.cardId);
        }
        setGoodsQuantity(pending.quantity || 1);
        setGoodsCountry(pending.country || 'ko');
        setGoodsSelectedCountry(pending.country || 'ko');
        setGoodsPaymentMethod(pending.paymentMethod || 'dollar');
        setSelectedGoods(pending.goodsType);
        setGoodsModalOpen(true);
        setTimeout(() => {
          setGoodsShippingOpen(true);
        }, 500);
      } catch (e) {
        console.warn('Failed to restore goods payment', e);
      }
    }
  }, []);

  const [errorVisible, setErrorVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState<{ amount?: number; isAdRemoval?: boolean } | null>(null);
  const [autoDrawState, setAutoDrawState] = useState<AutoDrawState | null>(null);

  useEffect(() => {
    detectAppEnvironment().then((env) => {
      if (env.isApp) {
        setIsAppEnv(true);
        setSelectedGoodsGatewayId('google-play');
      }
    });

    // Android Native In-App Purchase success callback listener
    const handleNativePurchaseSuccess = (event: Event) => {
      const customEvent = event as CustomEvent;
      const sku = customEvent.detail?.sku;
      if (!sku) return;

      console.log('[Native In-App Purchase Success]:', sku);
      
      if (sku === 'ad_removal') {
        if (setIsAdRemoved) setIsAdRemoved(true);
        setSuccessVisible({ isAdRemoval: true });
      } else if (sku.startsWith('snshero_points_')) {
        const coinAmount = parseInt(sku.replace('snshero_points_', ''), 10);
        if (!isNaN(coinAmount) && coinAmount > 0) {
          updateSns(coinAmount, 'sns_charge', 'purchased');
          setSuccessVisible({ amount: coinAmount });
        }
      } else if (sku.startsWith('sns_coin_')) {
        const coinAmount = parseInt(sku.replace('sns_coin_', ''), 10);
        if (!isNaN(coinAmount) && coinAmount > 0) {
          updateSns(coinAmount, 'sns_charge', 'purchased');
          setSuccessVisible({ amount: coinAmount });
        }
      }
      setCountryModalOpen(false);
    };

    window.addEventListener('onInAppPurchaseSuccess', handleNativePurchaseSuccess);
    (window as any).onInAppPurchaseSuccess = (sku: string) => {
      window.dispatchEvent(new CustomEvent('onInAppPurchaseSuccess', { detail: { sku } }));
    };

    return () => {
      window.removeEventListener('onInAppPurchaseSuccess', handleNativePurchaseSuccess);
    };
  }, [updateSns, setIsAdRemoved]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoDrawTimerRef = useRef<NodeJS.Timeout | null>(null);

  const gachaEntries = useMemo(() => {
    return (gachaState.packType === 'item' || gachaState.packType === 'roulette')
      ? gachaState.items
      : gachaState.cards;
  }, [gachaState.cards, gachaState.items, gachaState.packType]);

  const activeGachaPackType = useMemo<GachaPackRarity | null>(() => {
    if (gachaState.packType === 'bronze' || gachaState.packType === 'silver' || gachaState.packType === 'gold') {
      return gachaState.packType;
    }

    return null;
  }, [gachaState.packType]);

  const activeGachaPityView = useMemo(() => {
    if (!activeGachaPackType) {
      return null;
    }

    return getGachaPityView(gachaPityState, activeGachaPackType);
  }, [activeGachaPackType, gachaPityState]);

  const getGuideButtonClassName = (tone: 'slate' | 'amber' = 'slate') => cn(
    'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm transition active:scale-95 touch-target',
    tone === 'amber'
      ? 'border-amber-300 text-amber-700 hover:border-amber-400 hover:bg-amber-50'
      : 'border-slate-300 text-slate-700 hover:border-slate-900 hover:bg-slate-50 hover:text-slate-900'
  );

  const firstHiddenGachaIndex = useMemo(() => {
    return gachaEntries.findIndex((entry: any) => !entry.isRevealed);
  }, [gachaEntries]);

  const cardPacks: Array<{ title: string; cost: number; rarity: GachaPackRarity; label: string }> = useMemo(() => [
    { title: 'NOR_EXP', cost: SNS_ECONOMY_COSTS.cardPack.bronze, rarity: 'bronze', label: t('common_card_pack', language) },
    { title: 'MAG_EXP', cost: SNS_ECONOMY_COSTS.cardPack.silver, rarity: 'silver', label: t('magic_card_pack', language) },
    { title: 'RAR_EXP', cost: SNS_ECONOMY_COSTS.cardPack.gold, rarity: 'gold', label: t('rare_card_pack', language) },
  ], [language]);

  const itemPackCost = SNS_ECONOMY_COSTS.itemPack;
  const adRemovalCost = SNS_ECONOMY_COSTS.adRemoval;

  const renderSpendStatus = (
    cost: number,
    accentClasses: string,
    options?: { showHelpButton?: boolean; showShortfallAction?: boolean; shortfallHint?: string }
  ) => {
    const shortfall = getSpendShortfall(sns, cost);
    const canSpend = shortfall === 0;
    const showHelpButton = options?.showHelpButton ?? true;
    const showShortfallAction = options?.showShortfallAction ?? true;
    const shortfallHint = options?.shortfallHint ?? t('sns_spend_help_hint', language);

    return (
      <div className={cn('rounded-xl border px-3 py-2.5 text-[10px] font-bold tracking-wide', accentClasses)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 pr-2">
            <span>{t('sns_spend_cost', language)} {cost.toLocaleString()} SNS</span>
            <span>{t('sns_spend_balance', language)} {sns.toLocaleString()} SNS</span>
          </div>
          {showHelpButton ? (
            <button
              type="button"
              onClick={() => setSpendGuideState({ step: 0 })}
              className={cn(getGuideButtonClassName(), 'border-current/20 bg-white/85 text-current hover:border-current/35 hover:bg-white')}
              aria-label={t('sns_spend_help_open', language)}
              title={t('sns_spend_help_open', language)}
            >
              <HelpCircle size={16} />
            </button>
          ) : null}
        </div>
        <p className="mt-1 text-[9px] font-semibold opacity-80">
          {canSpend
            ? t('sns_spend_ready', language)
            : t('sns_spend_shortfall', language, { amount: shortfall.toLocaleString() })}
        </p>
        {canSpend ? (
          <p className="mt-3 text-[9px] font-medium opacity-70">
            {shortfallHint}
          </p>
        ) : showShortfallAction ? (
          <div className="mt-3 rounded-xl border border-current/10 bg-white/60 p-2.5 text-current/80">
            <button
              type="button"
              onClick={() => {
                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                onNavigate?.('season-hub');
              }}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-left text-[10px] font-black uppercase tracking-[0.18em] shadow-sm transition hover:bg-white/95 touch-target active:scale-[0.99]"
            >
              <span className="min-w-0">{t('sns_spend_go_season_hub', language)}</span>
              <ArrowRight size={14} className="shrink-0 opacity-60" />
            </button>
            <p className="mt-2 px-1 text-[9px] font-medium leading-relaxed text-current/70">
              {shortfallHint}
            </p>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-current/15 bg-white/45 px-3 py-2.5 text-[9px] font-medium leading-relaxed text-current/75">
            {shortfallHint}
          </div>
        )}
      </div>
    );
  };

  const cardRarityPools = useMemo(() => {
    return Object.keys(CARD_DATABASE).map(Number).reduce<Record<GachaPackRarity, number[]>>((pools, idx) => {
      const rarity = CARD_DATABASE[idx].rarity as GachaPackRarity;
      if (rarity === 'bronze' || rarity === 'silver' || rarity === 'gold') {
        pools[rarity].push(idx);
      }
      return pools;
    }, { bronze: [], silver: [], gold: [] });
  }, []);

  const goodsSelectableCards = useMemo(() => {
    return ownedCards.length > 0
      ? ownedCards
      : Object.keys(CARD_DATABASE).map(Number).map(idx => ({ imageIndex: idx, rarity: CARD_DATABASE[idx].rarity }));
  }, [ownedCards]);

  const buyItemPack = () => {
    const cost = itemPackCost;
    if (sns >= cost) {
      if (cost > 0) updateSns(-cost, 'pack_purchase', language === 'ko' ? '아이템 팩' : 'Item Pack');

      const newItems = Array.from({ length: 5 }).map(() => {
        const rand = Math.random() * 100;
        let rarity: ItemRarity = 'normal';
        if (rand <= 0.02) rarity = 'rare';
        else if (rand <= 2.02) rarity = 'magic';

        const item = addItem(rarity);
        return { id: Math.random().toString(36).substring(2, 11), item, isRevealed: false };
      });

      setGachaState({
        isActive: true,
        step: 0,
        packType: 'item',
        isRevealed: false,
        cards: [],
        items: newItems
      });

      playSfx('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3');

      // Analytics: Track Item Pack Purchase
      if (analytics) {
        logEvent(analytics, 'buy_item_pack', {
          cost: cost,
          is_test: testMode || isImpersonating
        });
      }
    } else {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 5000);
    }
  };

  const determineRarity = (packRarity: GachaPackRarity): GachaPackRarity => {
    const outcomeRarity = determineGachaOutcomeRarity(packRarity);
    if (outcomeRarity === 'platinum' || outcomeRarity === 'diamond') {
      return 'gold';
    }
    return outcomeRarity;
  };

  const getPackPurchaseLabel = (packRarity: GachaPackRarity) => {
    return packRarity === 'bronze'
      ? (language === 'ko' ? '브론즈 카드팩' : 'Bronze Card Pack')
      : packRarity === 'silver'
        ? (language === 'ko' ? '실버 카드팩' : 'Silver Card Pack')
        : (language === 'ko' ? '골드 카드팩' : 'Gold Card Pack');
  };

  const createPackCards = (packRarity: GachaPackRarity): GachaCard[] => {
    return Array.from({ length: 5 }).map(() => {
      const rarity = determineRarity(packRarity);
      const possible = cardRarityPools[rarity];
      const imageIndex = possible[Math.floor(Math.random() * possible.length)];

      // SNS 소모 즉시 인벤토리에 추가
      addCard(rarity, imageIndex, true);

      return { id: Math.random().toString(36).substring(2, 11), imageIndex, rarity, isRevealed: false };
    });
  };

  const clearAutoDrawTimer = () => {
    if (autoDrawTimerRef.current) {
      clearTimeout(autoDrawTimerRef.current);
      autoDrawTimerRef.current = null;
    }
  };

  const stopAutoDraw = () => {
    clearAutoDrawTimer();
    setAutoDrawState(null);
  };

  const openAutoDrawPack = (
    cost: number,
    packRarity: GachaPackRarity,
    completed: number,
    total: number,
    remaining: number
  ) => {
    updateSns(-cost, 'pack_purchase', `${getPackPurchaseLabel(packRarity)} ${completed}/${total}`);

    const newCards = createPackCards(packRarity).map(card => ({ ...card, isRevealed: true }));
    recordGachaPity(packRarity, newCards.map(card => card.rarity));
    setAutoDrawState({ packRarity, cost, completed, total, remaining });
    setGachaState({
      isActive: true,
      step: 0,
      packType: packRarity,
      isRevealed: true,
      cards: newCards
    });

    playSfx('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3');
  };

  const buyPack = (cost: number, packRarity: GachaPackRarity) => {
    const finalCost = (tutorialStep === 9) ? 0 : cost;
    if (sns >= finalCost) {
      stopAutoDraw();
      if (finalCost > 0) {
        updateSns(-finalCost, 'pack_purchase', getPackPurchaseLabel(packRarity));
      }

      const newCards = createPackCards(packRarity);
      recordGachaPity(packRarity, newCards.map(card => card.rarity));

      // Analytics: Track Card Pack Purchase
      if (analytics) {
        logEvent(analytics, 'buy_card_pack', {
          rarity: packRarity,
          cost: finalCost,
          is_test: testMode || isImpersonating
        });
      }
      trackAnalytics({ event: AnalyticsEvent.CARDPACK_PURCHASE_ATTEMPT, payload: { packId: packRarity, packName: getPackPurchaseLabel(packRarity), priceSns: finalCost } });
      trackAnalytics({ event: AnalyticsEvent.CARDPACK_VIEW, payload: { packId: packRarity, packName: getPackPurchaseLabel(packRarity) } });

      setGachaState({
        isActive: true,
        step: 0,
        packType: packRarity,
        isRevealed: false,
        cards: newCards
      });

      if (tutorialStep === 9 && setTutorialStep) {
        setTutorialStep(10);
      }

      playSfx('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3');
    } else {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 5000);
    }
  };

  const buy10xPack = (singleCost: number, packRarity: GachaPackRarity) => {
    const discountedCost = Math.floor(singleCost * 10 * 0.9);
    const finalCost = (tutorialStep === 9) ? 0 : discountedCost;
    if (sns >= finalCost) {
      stopAutoDraw();
      if (finalCost > 0) {
        updateSns(-finalCost, '10x_pack_purchase', `${getPackPurchaseLabel(packRarity)} 10연차 소환`);
      }

      let set1 = createPackCards(packRarity);
      let set2 = createPackCards(packRarity);
      let combined = [...set1, ...set2];

      const hasSrPlus = combined.some(c => ['gold', 'rare', 'epic', 'legendary', 'platinum'].includes((c.rarity || '').toLowerCase()));
      if (!hasSrPlus) {
        const possibleGold = cardRarityPools['gold'] || [1, 2, 3];
        const goldIndex = possibleGold[Math.floor(Math.random() * possibleGold.length)];
        addCard('gold', goldIndex, true);
        combined[0] = { ...combined[0], rarity: 'gold', imageIndex: goldIndex };
      }

      recordGachaPity(packRarity, combined.map(card => card.rarity));

      setGachaState({
        isActive: true,
        step: 0,
        packType: packRarity,
        isRevealed: false,
        cards: combined
      });

      playSfx('https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3');
    } else {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 5000);
    }
  };

  const buyPackUntilEmpty = (cost: number, packRarity: GachaPackRarity) => {
    if (cost <= 0) {
      buyPack(cost, packRarity);
      return;
    }

    const drawCount = Math.floor(sns / cost);
    if (drawCount <= 0) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      setErrorVisible(true);
      setTimeout(() => setErrorVisible(false), 5000);
      return;
    }

    clearAutoDrawTimer();

    if (analytics) {
      logEvent(analytics, 'buy_card_pack_bulk', {
        rarity: packRarity,
        planned_cost: drawCount * cost,
        count: drawCount,
        is_test: testMode || isImpersonating
      });
    }

    openAutoDrawPack(cost, packRarity, 1, drawCount, drawCount - 1);
  };

  useEffect(() => {
    if (!autoDrawState || !gachaState.isActive || autoDrawState.remaining <= 0) {
      clearAutoDrawTimer();
      return;
    }

    clearAutoDrawTimer();
    autoDrawTimerRef.current = setTimeout(() => {
      openAutoDrawPack(
        autoDrawState.cost,
        autoDrawState.packRarity,
        autoDrawState.completed + 1,
        autoDrawState.total,
        autoDrawState.remaining - 1
      );
    }, 3000);

    return clearAutoDrawTimer;
  }, [autoDrawState, gachaState.isActive]);

  const flipCard = (index: number) => {
    if (gachaState.packType === 'item') {
      if (gachaState.items[index].isRevealed) return;
      const newItems = [...gachaState.items];
      newItems[index].isRevealed = true;
      setGachaState(prev => ({ ...prev, items: newItems }));
    } else {
      if (gachaState.cards[index].isRevealed) return;
      const newCards = [...gachaState.cards];
      newCards[index].isRevealed = true;
      setGachaState(prev => ({ ...prev, cards: newCards }));    }

    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  const handleCloseGacha = () => {
    stopAutoDraw();
    setGachaState(prev => ({ ...prev, isActive: false }));
    if (tutorialStep === 10) {
      let hasUpgradePrompt = false;
      if (triggerDeckUpgradeCheck && gachaState.cards && gachaState.cards.length > 0) {
        const cardImageIndexes = gachaState.cards.map(c => c.imageIndex);
        hasUpgradePrompt = triggerDeckUpgradeCheck(cardImageIndexes) === true;
      }
      if (!hasUpgradePrompt) {
        if (setTutorialStep && onNavigate) {
          setTutorialStep(11);
          onNavigate('mydeck');
        }
      }
    }
  };

  useEffect(() => {
    const handleGlobalBack = (e: Event) => {
      if (!gachaState.isActive) return;
      e.preventDefault();
      handleCloseGacha();
    };

    window.addEventListener('global-back', handleGlobalBack);
    return () => window.removeEventListener('global-back', handleGlobalBack);
  }, [gachaState.isActive, handleCloseGacha]);

  useEffect(() => {
    if (
      gachaState.isActive &&
      gachaState.packType &&
      gachaState.packType !== 'item' &&
      gachaState.packType !== 'roulette' &&
      gachaState.cards &&
      gachaState.cards.length === 5 &&
      gachaState.cards.every(c => c.isRevealed)
    ) {
      const timer = setTimeout(() => {
        let hasUpgradePrompt = false;
        if (triggerDeckUpgradeCheck) {
          const cardImageIndexes = gachaState.cards.map(c => c.imageIndex);
          hasUpgradePrompt = triggerDeckUpgradeCheck(cardImageIndexes) === true;
        }

        if (tutorialStep === 10) {
          if (!hasUpgradePrompt) {
            if (setTutorialStep && onNavigate) {
              setGachaState(prev => ({ ...prev, isActive: false }));
              setTutorialStep(11);
              onNavigate('mydeck');
            }
          } else {
            setGachaState(prev => ({ ...prev, isActive: false }));
          }
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [gachaState.isActive, gachaState.packType, gachaState.cards, tutorialStep, triggerDeckUpgradeCheck, setTutorialStep, onNavigate]);

  // Removed legacy single card sequence logic

  useEffect(() => {
    if (paymentInfo) {
      timerIntervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.floor((paymentInfo.expiresAt - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0) {
          setPaymentInfo(null);
          setCryptoError(t('payment_timeout', language));
        }
      }, 1000);

      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await axios.get(`/api/crypto/check-deposit`, {
            params: {
              address: paymentInfo.address,
              ccy: paymentInfo.ccy,
              amount: paymentInfo.amount,
              since: paymentInfo.since
            }
          });
          if (res.data.status === 'success') {
            if (paymentInfo.isAdRemoval) {
              if (setIsAdRemoved) setIsAdRemoved(true);
              playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
              setSuccessVisible({ isAdRemoval: true });
            } else if (selectedPaymentItem?.isGoods) {
              setCryptoModalOpen(false);
              setPaymentInfo(null);
              setGoodsPaymentMethod('crypto');
              setGoodsShippingOpen(true);
              playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
              return;
            } else {
              updateSns(paymentInfo.snsAmount, 'sns_charge', 'purchased');
              playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
              setCryptoSuccessModal(true);
            }
            setPaymentInfo(null);
          }
        } catch (err: any) {
          if (err.response?.status === 429) {
            console.warn('Polling rate limited, continuing...');
          } else {
            console.error('Polling error', err);
          }
        }
      }, 20000); // Increase to 20s to be very safe
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [paymentInfo, updateSns, playSfx, language]);

  const fetchCryptoCoins = async () => {
    setIsLoadingCoins(true);
    setCryptoError(null);
    try {
      const res = await axios.get('/api/crypto/coins');

      // Check if we got HTML instead of JSON (common when server is misconfigured or not running)
      const isHtml = typeof res.data === 'string' && res.data.trim().toLowerCase().startsWith('<!doctype');

      if (Array.isArray(res.data)) {
        setCryptoCoins(res.data);
      } else if (isHtml) {
        console.error('API returned HTML instead of JSON. Server might not be running correctly.');
        setCryptoError(language === 'ko'
          ? '서버 응답 오류: API 대신 HTML 페이지가 반환되었습니다. 백엔드 서버(Node.js)가 정상적으로 실행 중인지 확인해주세요.'
          : 'Server Error: Received HTML instead of API data. Please ensure the Node.js backend server is running.');
        setCryptoCoins([]);
      } else if (res.data && res.data.error) {
        setCryptoError(res.data.error);
        setCryptoCoins([]);
      } else {
        console.error('Unexpected coins response:', res.data);
        setCryptoError(language === 'ko' ? '암호화폐 목록을 가져오지 못했습니다. 설정 메뉴에서 API 키가 올바르게 입력되었는지 확인해주세요.' : 'Invalid crypto coins data received. Please check your API keys in Settings.');
        setCryptoCoins([]);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to load coins.';
      setCryptoError(msg);
      console.error('Crypto Coins Error:', err);
    } finally {
      setIsLoadingCoins(false);
    }
  };

  const initiateCryptoDeposit = async (coin: any, item: any) => {
    if (!coin || !item) {
      setCryptoError('Invalid coin or selection.');
      return;
    }
    setCryptoError(null);
    try {
      const addrUrl = `/api/crypto/deposit-address?ccy=${coin.ccy}${coin.chain ? `&chain=${coin.chain}` : ''}`;
      const [addrRes, rateRes] = await Promise.all([
        axios.get(addrUrl),
        axios.get(`/api/crypto/rate?ccy=${coin.ccy}`)
      ]);

      const addrData = addrRes.data.data[0];
      const addr = addrData?.addr;
      const rate = rateRes.data.rate;

      if (!addr) {
        if (addrRes.data.code === "58204") {
          throw new Error(language === 'ko' ? '이 코인의 입금 주소가 아직 생성되지 않았습니다. OKX 홈페이지에서 주소를 먼저 생성해주세요.' : 'Deposit address not yet generated for this coin. Please generate it on the OKX website first.');
        }
        throw new Error(language === 'ko' ? '입금 주소를 가져올 수 없습니다. 다른 코인을 선택해보세요.' : 'Could not generate deposit address. Please try another coin or chain.');
      }
      if (!rate) throw new Error('Could not fetch exchange rate for this coin.');

      const cryptoAmount = (parseFloat(item.price) * rate).toFixed(6);

      setPaymentInfo({
        address: addr,
        amount: cryptoAmount,
        ccy: coin.ccy,
        chain: coin.chain,
        expiresAt: Date.now() + 600000,
        since: Date.now(),
        snsAmount: item.amount,
        isAdRemoval: item.isAdRemoval
      });
      setTimeLeft(600);
      setCryptoModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Payment initiation failed.';
      setCryptoError(msg);
      console.error('Crypto Deposit Error:', err);
    }
  };

  const renderHistoryModal = () => (
    <AnimatePresence>
      {showHistory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white border border-slate-100 p-6.5 rounded-3xl shadow-2xl w-full max-w-lg space-y-4 max-h-[85vh] flex flex-col text-slate-800 font-sans"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="text-indigo-600 animate-spin-slow" size={22} />
                <h3 className="text-md font-bold tracking-tight text-slate-800 uppercase leading-none">
                  {t('history_title', language)}
                </h3>
              </div>
              <button
                onClick={() => {
                  playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                  setShowHistory(false);
                }}
                className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 active:scale-95 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[300px]">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase animate-pulse">
                    LOADING LOGS...
                  </p>
                </div>
              ) : historyList.length === 0 ? (
                <div className="text-center py-20 text-slate-400 italic text-sm">
                  {t('no_history', language)}
                </div>
              ) : (
                <div className="border border-slate-150 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
                        <th className="p-3">{t('history_time', language)}</th>
                        <th className="p-3">{t('history_reason', language)}</th>
                        <th className="p-3 text-right">{t('history_amount', language)}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-650">
                      {historyList.map((item, idx) => {
                        const dateStr = new Date(item.timestamp).toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        });

                        // Translate reason
                        let reasonText = item.reason;
                        if (item.reason === 'battle_win_vs') {
                          reasonText = t('battle_win_vs', language).replace('{name}', item.targetName);
                        } else if (item.reason === 'battle_loss_vs') {
                          reasonText = t('battle_loss_vs', language).replace('{name}', item.targetName);
                        } else if (item.reason === 'battle_draw_vs') {
                          reasonText = t('battle_draw_vs', language).replace('{name}', item.targetName);
                        } else if (item.reason === 'opponent_defeated_by') {
                          reasonText = t('opponent_defeated_by', language).replace('{name}', item.targetName);
                        } else if (item.reason === 'opponent_won_against') {
                          reasonText = t('opponent_won_against', language).replace('{name}', item.targetName);
                        } else if (item.reason === 'pack_purchase') {
                          reasonText = language === 'ko' 
                            ? `${item.targetName || '카드팩'} 구매` 
                            : `Purchased ${item.targetName || 'Card Pack'}`;
                        } else if (item.reason === 'claw_play') {
                          reasonText = language === 'ko' ? '인형뽑기 플레이' : 'Claw Machine Play';
                        } else if (item.reason === 'sns_charge') {
                          reasonText = language === 'ko' ? '코인 충전' : 'Coin Recharge';
                        } else if (item.reason === 'achievement_reward') {
                          reasonText = language === 'ko' 
                            ? `업적 보상: ${item.targetName}` 
                            : `Achievement: ${item.targetName}`;
                        } else if (item.reason === 'companion_upgrade') {
                          reasonText = language === 'ko' 
                            ? `${item.targetName || '펫'} 업그레이드` 
                            : `Upgraded ${item.targetName || 'Companion'}`;
                        } else if (item.reason === 'skill_reset') {
                          reasonText = language === 'ko' ? '스킬 초기화' : 'Skill Tree Reset';
                        } else if (item.reason === 'god_mode_reward') {
                          reasonText = language === 'ko' ? '개발자 모드 지급' : 'Developer Admin Reward';
                        } else if (item.reason === 'daily_free_sns') {
                          reasonText = language === 'ko' ? '일일 무료 SNS 지급' : 'Daily Free SNS';
                        } else if (item.reason === 'ad_removal_purchase') {
                          reasonText = language === 'ko' ? '광고 제거 구매' : 'Ad Removal Purchase';
                        }

                        const isPositive = item.amount >= 0;

                        return (
                          <tr key={item.id || idx} className="hover:bg-slate-50/50">
                            <td className="p-3 text-[10px] text-slate-400 font-mono">{dateStr}</td>
                            <td className="p-3 text-slate-700">{reasonText}</td>
                            <td className={cn("p-3 text-right font-bold font-mono text-sm", isPositive ? "text-emerald-600" : "text-rose-600")}>
                              {isPositive ? `+${item.amount}` : item.amount}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="pt-2 text-center text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              SECURE DECENTRALIZED SNS-LEDGER v1.0
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <PayPalScriptProvider options={{
      "client-id": "Ae_xg2SjogcseJVcjXldc_TEnVWBzmPw8aNimrSncYBb0Wrn_m93w_PkMgdxWTQ2fJExV8QKWHR2-7hK",
      currency: "USD",
      intent: "capture",
      components: "buttons"
    }}>
      <>
        <div className="pb-32 max-w-4xl mx-auto min-h-screen bg-transparent text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
          <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <PageHeader title={t('shop', language)} />
              <button
                type="button"
                onClick={() => setHelpPopupState({ step: 0 })}
                className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:border-slate-900 hover:bg-slate-50 hover:text-slate-900 active:scale-95 touch-target"
                aria-label={language === 'ko' ? '도움말' : 'Help'}
              >
                <HelpCircle size={18} />
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-6 md:p-8 pt-0 sm:pt-0 md:pt-0 flex flex-col gap-6 sm:gap-8 md:gap-10">

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    <History size={14} className="shrink-0 text-slate-400" />
                    <span>{t('sns_history', language)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                    setShowHistory(true);
                  }}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 transition-all active:scale-95 hover:border-slate-400 hover:bg-slate-100 cursor-pointer touch-target sm:w-auto"
                  title={t('sns_history', language)}
                  aria-label={t('sns_history', language)}
                >
                  <span>{t('sns_history', language)}</span>
                  <ArrowRight size={14} className="shrink-0 opacity-70" />
                </button>
              </div>
            </div>
          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: 50, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: 20, x: '-50%' }}
                className="fixed bottom-24 left-1/2 z-[200] bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-2xl font-black text-xs tracking-widest uppercase border border-white/20 whitespace-nowrap"
              >
                {toastMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {errorVisible && (
              <motion.div
                key="shop-error-popup"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-4 sm:top-8 left-1/2 -translate-x-1/2 z-[110] bg-red-600 text-white px-4 sm:px-6 py-3 sm:py-4 border border-gray-200 rounded-lg flex items-center gap-3 sm:gap-4 min-w-[280px] sm:min-w-[300px] max-w-[90vw]"
              >
                <AlertCircle className="text-white shrink-0" size={18} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold tracking-tight text-sm">
                    {t('insufficient_coins', language)}
                  </p>
                  <p className="text-xs sm:text-sm opacity-80 font-bold tracking-normal italic pt-1">
                    {t('insufficient_coins_desc', language)}
                  </p>
                </div>
                <button onClick={() => setErrorVisible(false)} className="hover:rotate-90 transition-transform p-2.5 min-w-[44px] min-h-[44px] shrink-0 flex items-center justify-center">
                  <X size={18} />
                </button>
              </motion.div>
            )}

            {successVisible && (
              <motion.div
                key="shop-success-popup"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm cursor-pointer"
                onClick={() => {
                  setSuccessVisible(null);
                  setGachaState(prev => ({ ...prev, isActive: false }));
                  if (tutorialStep === 8 && setTutorialStep) {
                    setTutorialStep(9);
                  }
                }}
              >
                <div 
                  className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 sm:space-y-6 cursor-default shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center animate-bounce">
                      <Zap size={28} className="sm:w-8 sm:h-8" />
                    </div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800">
                      {successVisible.isAdRemoval
                        ? (language === 'ko' ? '광고 제거 완료' : 'Ad-Free Activated')
                        : tutorialStep === 8
                        ? (language === 'ko' ? '첫 카드팩 선물' : 'First Pack Gift')
                        : t('recharge_complete', language)}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 tracking-normal leading-relaxed">
                      {successVisible.isAdRemoval
                        ? (language === 'ko' ? '모든 게임 화면에서 구글 애드센스 광고가 영구적으로 제거되었습니다!' : 'Google AdSense ads have been permanently removed from all screens!')
                        : tutorialStep === 8
                        ? (language === 'ko' ? '무료 카드팩을 개봉할 수 있는 10 SNS가 충전되었습니다.' : '10 SNS has been charged for your first free pack.')
                        : `${successVisible.amount} ${t('recharge_success_msg', language)}`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSuccessVisible(null);
                      setGachaState(prev => ({ ...prev, isActive: false }));
                      if (tutorialStep === 8 && setTutorialStep) {
                        setTutorialStep(9);
                      }
                    }}
                    className="w-full h-12 sm:h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-widest transition-all rounded-xl cursor-pointer active:scale-95 shadow-sm"
                  >
                    OK
                  </button>
                </div>
              </motion.div>
            )}

            {gachaState.isActive && (
              activeGachaPackType && activeGachaPityView ? (
                <GachaRevealSequence
                  language={language}
                  packRarity={activeGachaPackType}
                  packCost={cardPacks.find((pack) => pack.rarity === activeGachaPackType)?.cost ?? 0}
                  cards={gachaState.cards}
                  currentSeason={currentSeason}
                  lowSpecMode={lowSpecMode}
                  customCardImage={customCardImage}
                  processedCardImages={processedCardImages}
                  pityView={activeGachaPityView}
                  autoDrawProgress={autoDrawState ? { current: autoDrawState.completed, total: autoDrawState.total } : null}
                  onSkip={() => {
                    setGachaState((prev) => ({
                      ...prev,
                      cards: prev.cards.map((card) => ({ ...card, isRevealed: true })),
                    }));
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                  }}
                  onClose={handleCloseGacha}
                  onDrawAgain={() => {
                    const pack = cardPacks.find((entry) => entry.rarity === activeGachaPackType);
                    if (pack) {
                      buyPack(pack.cost, pack.rarity);
                    }
                  }}
                  onOpenProbability={() => {
                    setSelectedProbabilityPack(activeGachaPackType);
                    setProbabilityModalOpen(true);
                  }}
                  onShareBestCard={(cardId) => setGachaShareCardId(cardId)}
                />
              ) : (
              <motion.div
                key="shop-gacha-popup"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] w-full h-[100dvh] min-h-[100dvh] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-2 sm:p-4 overflow-y-auto cursor-pointer"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('.gacha-card-wrapper') || target.closest('button')) {
                    return;
                  }
                  handleCloseGacha();
                }}
              >
                {/* Close Icon at Top Right */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseGacha();
                  }}
                  className="absolute top-4 sm:top-6 right-4 sm:right-6 text-white/40 hover:text-white transition-all z-[250] p-2 hover:bg-white/10 rounded-full touch-target"
                >
                  <X size={28} className="sm:w-8 sm:h-8" />
                </button>

                {/* Inner Content Wrapper */}
                <div 
                  className="flex flex-col items-center w-full max-w-full cursor-default"
                >
                  {/* Header Status */}
                <div className="flex flex-col items-center gap-2 mb-8 sm:mb-12">
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <h3 className="text-yellow-500 text-2xl sm:text-3xl font-black tracking-widest uppercase text-center shadow-black drop-shadow-lg">
                      {gachaState.packType === 'item' ? t('equipment_acquired', language) : t('protocol_synchronized', language)}
                    </h3>
                    {gachaState.packType !== 'item' && gachaState.packType !== 'roulette' && (
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                        {autoDrawState
                          ? t('continuous_draw_progress', language, {
                            current: autoDrawState.completed,
                            total: autoDrawState.total
                          })
                          : (language === 'ko' ? '데이터 칩을 클릭하여 해독하세요' : 'Click data chips to decrypt')}
                      </p>
                    )}
                  </motion.div>
                </div>

                {/* Cards Container - Optimized for Mobile (3 Top, 2 Bottom) */}
                <div className="relative w-full flex flex-col items-center gap-4 sm:gap-6 md:gap-12 py-6 sm:py-8 px-2 max-w-full overflow-hidden">
                  {gachaState.packType === 'roulette' ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative border border-white/20 p-6 sm:p-8 rounded-full bg-[#111] aspect-square w-56 sm:w-64 overflow-hidden z-10 flex flex-col items-center justify-center gap-3 sm:gap-4 shadow-[0_0_50px_rgba(234,179,8,0.2)] gacha-card-wrapper"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.2)_0%,transparent_70%)] animate-pulse" />
                      <Sparkles size={56} className="sm:w-16 sm:h-16 text-yellow-500 animate-pulse relative z-10" />
                      <div className="text-center space-y-1 sm:space-y-2 relative z-10 mt-3 sm:mt-4">
                        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest leading-none block">{t('roulette_win', language)}</span>
                        <h4 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter leading-none">{gachaState.roulettePrize?.label}</h4>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      {/* Top Row: 3 Items/Cards */}
                      <div className="flex justify-center gap-2 sm:gap-4 md:gap-6 w-full">
                        {gachaEntries.slice(0, 3).map((obj: any, i) => {
                          const idx = i;
                          const isRevealed = obj.isRevealed;
                          const rarity = (gachaState.packType === 'item' || gachaState.packType === 'roulette') ? obj.item.rarity : obj.rarity;
                          const shouldPromptReveal = !isRevealed && !autoDrawState && idx === firstHiddenGachaIndex;

                          return (
                            <motion.div
                              key={`shop-gacha-top-${idx}`}
                              initial={{ opacity: 0, y: 50, scale: 0.8 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ delay: idx * 0.1 }}
                              className="relative flex flex-col items-center gap-2 gacha-card-wrapper"
                            >
                              <div className="relative perspective-1000">
                                <motion.div
                                  className={cn(
                                    "relative w-[28vw] max-w-[140px] aspect-[5/7] transform-style-3d transition-all duration-700 cursor-pointer",
                                    isRevealed ? "rotate-y-180" : ""
                                  )}
                                  animate={shouldPromptReveal ? {
                                    x: [0, -1, 1, -1, 1, 0],
                                    transition: { duration: 0.3, repeat: Infinity }
                                  } : isRevealed ? { rotateY: 180 } : undefined}
                                  onClick={() => flipCard(idx)}
                                >
                                  <div className="absolute inset-0 backface-hidden z-20">
                                    <div className={cn(
                                      "w-full h-full border border-white/20 bg-[#111] flex flex-col items-center justify-center overflow-hidden shadow-xl rounded-lg relative",
                                      shouldPromptReveal && "animate-bounce"
                                    )}>
                                      {gachaState.packType !== 'item' && (
                                        <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: `url('/background-${(gachaState.packType === 'item' || gachaState.packType === 'roulette') ? 'item' : gachaState.packType}.png')` }} />
                                      )}
                                      {gachaState.packType === 'item' ? (
                                        <span className="text-7xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-bounce">🎁</span>
                                      ) : (
                                        <Terminal className="relative z-10 text-white/40" size={24} />
                                      )}
                                    </div>
                                  </div>
                                  <div className="absolute inset-0 backface-hidden rotate-y-180 z-10">
                                    {gachaState.packType === 'item' ? (
                                      <div className="w-full h-full bg-[#111] border border-white/10 rounded-lg flex flex-col items-center justify-center p-2">
                                        <div className="w-16 h-16 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 mb-2 overflow-hidden shadow-inner relative z-10">
                                          <ItemIcon imageIndex={obj.item.imageIndex} size={64} />
                                        </div>
                                        <div className="flex flex-col items-center gap-1 w-full relative z-10">
                                          <h4 className="text-[10px] font-black text-white truncate text-center w-full px-1">
                                            {language === 'ko' ? obj.item.name_ko : obj.item.name_en}
                                          </h4>
                                          <div className="flex gap-1 flex-wrap justify-center px-1">
                                            {obj.item.stats.map((s, i) => s !== 0 && (
                                              <span key={i} className="text-[7px] font-bold text-green-400 bg-green-400/10 px-1 rounded whitespace-nowrap border border-green-400/20">
                                                {['N', 'E', 'S', 'W'][i]}:{s > 0 ? '+' + s : s}
                                              </span>
                                            ))}
                                            {obj.item.magicChance && (
                                              <span className="text-[7px] font-bold text-purple-400 bg-purple-400/10 px-1 rounded whitespace-nowrap border border-purple-400/20">
                                                M:+{obj.item.magicChance}%
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[6px] text-white/40 text-center leading-tight line-clamp-2 mt-1 px-1">
                                            {language === 'ko' ? obj.item.description_ko : obj.item.description_en}
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <CardItem
                                        card={{
                                          ...CARD_DATABASE[obj.imageIndex],
                                          id: `g-t-${idx}`,
                                          owner: null,
                                          level: 1,
                                          imageIndex: obj.imageIndex
                                        }}
                                        className="w-full h-full rounded-lg overflow-hidden"
                                        customImage={customCardImage}
                                        processedImage={processedCardImages?.[obj.imageIndex - 1]}
                                        lowSpecMode={true}
                                      />
                                    )}
                                  </div>
                                </motion.div>
                                <AnimatePresence>
                                  {isRevealed && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={cn(
                                      "absolute -top-2 -right-2 z-30 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase shadow-lg border border-white/10",
                                      ['rare', 'legendary', 'platinum', 'social', 'epic'].includes(rarity?.toLowerCase() || '') ? 'bg-gradient-to-r from-pink-500 to-purple-600' :
                                      (rarity?.toLowerCase() === 'gold') ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-yellow-950 border-yellow-400' :
                                      ['silver', 'magic'].includes(rarity?.toLowerCase() || '') ? 'bg-gradient-to-r from-slate-400 to-slate-600' :
                                      'bg-gradient-to-r from-amber-600 to-amber-800'
                                    )}>
                                        {t(`rarity_${rarity}` as any, language)}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                              <div className="h-4 flex items-center overflow-hidden">
                                <AnimatePresence>
                                  {isRevealed && (
                                    <motion.span initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-[9px] text-white/60 font-black tracking-tight truncate max-w-[80px]">
                                      {gachaState.packType === 'item' ? (language === 'ko' ? obj.item.name_ko : obj.item.name_en) : getFormattedCardName(CARD_DATABASE[obj.imageIndex], language)}
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Bottom Row: 2 Items/Cards */}
                      <div className="flex justify-center gap-4 sm:gap-10 w-full">
                        {gachaEntries.slice(3, 5).map((obj: any, i) => {
                          const idx = i + 3;
                          const isRevealed = obj.isRevealed;
                          const rarity = (gachaState.packType === 'item' || gachaState.packType === 'roulette') ? obj.item.rarity : obj.rarity;
                          const shouldPromptReveal = !isRevealed && !autoDrawState && idx === firstHiddenGachaIndex;

                          return (
                            <motion.div
                              key={`shop-gacha-bottom-${idx}`}
                              initial={{ opacity: 0, y: 50, scale: 0.8 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ delay: idx * 0.1 }}
                              className="relative flex flex-col items-center gap-2 gacha-card-wrapper"
                            >
                              <div className="relative perspective-1000">
                                <motion.div
                                  className={cn(
                                    "relative w-[28vw] max-w-[140px] aspect-[5/7] transform-style-3d transition-all duration-700 cursor-pointer",
                                    isRevealed ? "rotate-y-180" : ""
                                  )}
                                  animate={shouldPromptReveal ? {
                                    x: [0, -1, 1, -1, 1, 0],
                                    transition: { duration: 0.3, repeat: Infinity }
                                  } : isRevealed ? { rotateY: 180 } : undefined}
                                  onClick={() => flipCard(idx)}
                                >
                                  <div className="absolute inset-0 backface-hidden z-20">
                                    <div className={cn(
                                      "w-full h-full border border-white/20 bg-[#111] flex flex-col items-center justify-center overflow-hidden shadow-xl rounded-lg relative",
                                      shouldPromptReveal && "animate-bounce"
                                    )}>
                                      {gachaState.packType !== 'item' && (
                                        <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: `url('/background-${(gachaState.packType === 'item' || gachaState.packType === 'roulette') ? 'item' : gachaState.packType}.png')` }} />
                                      )}
                                      {gachaState.packType === 'item' ? (
                                        <span className="text-7xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-bounce">🎁</span>
                                      ) : (
                                        <Terminal className="relative z-10 text-white/40" size={24} />
                                      )}
                                    </div>
                                  </div>
                                  <div className="absolute inset-0 backface-hidden rotate-y-180 z-10">
                                    {gachaState.packType === 'item' ? (
                                      <div className="w-full h-full bg-[#111] border border-white/10 rounded-lg flex flex-col items-center justify-center p-2">
                                        <div className="w-16 h-16 flex items-center justify-center bg-white/5 rounded-xl border border-white/10 mb-2 overflow-hidden shadow-inner relative z-10">
                                          <ItemIcon imageIndex={obj.item.imageIndex} size={64} />
                                        </div>
                                        <div className="flex flex-col items-center gap-1 w-full relative z-10">
                                          <h4 className="text-[10px] font-black text-white truncate text-center w-full px-1">
                                            {language === 'ko' ? obj.item.name_ko : obj.item.name_en}
                                          </h4>
                                          <div className="flex gap-1 flex-wrap justify-center px-1">
                                            {obj.item.stats.map((s, i) => s !== 0 && (
                                              <span key={i} className="text-[7px] font-bold text-green-400 bg-green-400/10 px-1 rounded whitespace-nowrap border border-green-400/20">
                                                {['N', 'E', 'S', 'W'][i]}:{s > 0 ? '+' + s : s}
                                              </span>
                                            ))}
                                            {obj.item.magicChance && (
                                              <span className="text-[7px] font-bold text-purple-400 bg-purple-400/10 px-1 rounded whitespace-nowrap border border-purple-400/20">
                                                M:+{obj.item.magicChance}%
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[6px] text-white/40 text-center leading-tight line-clamp-2 mt-1 px-1">
                                            {language === 'ko' ? obj.item.description_ko : obj.item.description_en}
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <CardItem
                                        card={{
                                          ...CARD_DATABASE[obj.imageIndex],
                                          id: `g-b-${idx}`,
                                          owner: null,
                                          level: 1,
                                          imageIndex: obj.imageIndex
                                        }}
                                        className="w-full h-full rounded-lg overflow-hidden"
                                        customImage={customCardImage}
                                        processedImage={processedCardImages?.[obj.imageIndex - 1]}
                                        lowSpecMode={true}
                                      />
                                    )}
                                  </div>
                                </motion.div>
                                <AnimatePresence>
                                  {isRevealed && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={cn(
                                      "absolute -top-2 -right-2 z-30 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase shadow-lg border border-white/10",
                                      ['rare', 'legendary', 'platinum', 'social', 'epic'].includes(rarity?.toLowerCase() || '') ? 'bg-gradient-to-r from-pink-500 to-purple-600' :
                                      (rarity?.toLowerCase() === 'gold') ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-yellow-950 border-yellow-400' :
                                      ['silver', 'magic'].includes(rarity?.toLowerCase() || '') ? 'bg-gradient-to-r from-slate-400 to-slate-600' :
                                      'bg-gradient-to-r from-amber-600 to-amber-800'
                                    )}>
                                      {t(`rarity_${rarity}` as any, language)}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                              <div className="h-4 flex items-center overflow-hidden">
                                <AnimatePresence>
                                  {isRevealed && (
                                    <motion.span initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-[9px] text-white/60 font-black tracking-tight truncate max-w-[80px]">
                                      {gachaState.packType === 'item' ? (language === 'ko' ? obj.item.name_ko : obj.item.name_en) : getFormattedCardName(CARD_DATABASE[obj.imageIndex], language)}
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Draw Again Info (visible only if packType is gacha) */}
                {gachaState.packType !== 'item' && gachaState.packType !== 'roulette' && (
                  <div className="mt-12 flex flex-col items-center gap-6">

                    <button
                      onClick={(e) => {
                        const target = e.currentTarget;
                        target.disabled = true;
                        const pack = cardPacks.find(p => p.rarity === gachaState.packType);
                        if (pack) {
                          const hasUnrevealed = gachaState.cards.some(c => !c.isRevealed);
                          if (hasUnrevealed) {
                            setGachaState(prev => ({
                              ...prev,
                              cards: prev.cards.map(c => ({ ...c, isRevealed: true }))
                            }));
                            playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                          }
                          
                          setTimeout(() => {
                            buyPack(pack.cost, pack.rarity);
                            target.disabled = false;
                          }, 2000);
                        }
                      }}
                      className="flex items-center gap-2 text-white/40 hover:text-yellow-500 transition-colors font-black tracking-widest text-[10px] uppercase group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Package size={14} className="group-hover:animate-bounce" />
                      {t('draw_again', language)} ({(cardPacks.find(p => p.rarity === gachaState.packType)?.cost || 0)} SNS)
                    </button>

                    <button
                      onClick={() => {
                        handleCloseGacha();
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs transition-all"
                    >
                      {language === 'ko' ? '닫기' : 'CLOSE'}
                    </button>
                  </div>
                )}
                
                </div> {/* End of Inner Content Wrapper */}
              </motion.div>
              )
            )}
          </AnimatePresence>

          <AnimatePresence>
            {featureGuideState && activeFeatureGuideStep && activeFeatureGuideMeta && (() => {
              const FeatureGuideIcon = activeFeatureGuideMeta.icon;

              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[213] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                  onClick={() => setFeatureGuideState(null)}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className={cn(
                      'flex items-start justify-between gap-4 rounded-[24px] border px-4 py-4 text-white shadow-sm',
                      `bg-gradient-to-br ${activeFeatureGuideMeta.gradientClassName}`,
                    )}>
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/75">
                          {activeFeatureGuideMeta.badge}
                        </div>
                        <h3 className="mt-1 text-lg font-black tracking-tight">{activeFeatureGuideMeta.label}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/20 bg-white/15">
                          <FeatureGuideIcon size={18} />
                        </div>
                        <button
                          type="button"
                          onClick={() => setFeatureGuideState(null)}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/20 bg-white/15 text-white transition hover:bg-white/25 active:scale-95 touch-target"
                          aria-label={language === 'ko' ? '닫기' : 'Close'}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className={cn('inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]', activeFeatureGuideStep.accentClassName)}>
                        {t('contextual_tutorial_badge', language)}
                      </div>
                      <h4 className="mt-3 text-lg font-black tracking-tight text-slate-900">
                        {activeFeatureGuideStep.title}
                      </h4>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-600 whitespace-pre-line">
                        {activeFeatureGuideStep.body}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                      <span>{t('contextual_tutorial_progress', language, { current: featureGuideState.step + 1, total: activeFeatureGuideSteps.length })}</span>
                      <span>{activeFeatureGuideMeta.badge}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFeatureGuideState((prev) => prev ? { ...prev, step: Math.max(prev.step - 1, 0) } : prev)}
                        disabled={featureGuideState.step === 0}
                        className={cn(
                          'min-h-11 rounded-2xl border px-3 py-2 text-sm font-bold transition touch-target',
                          featureGuideState.step === 0
                            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:scale-95'
                        )}
                      >
                        {language === 'ko' ? '이전' : 'Prev'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeatureGuideState(null)}
                        className="min-h-11 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 touch-target"
                      >
                        {language === 'ko' ? '닫기' : 'Close'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFeatureGuideState((prev) => prev ? { ...prev, step: Math.min(prev.step + 1, activeFeatureGuideSteps.length - 1) } : prev)}
                        className="min-h-11 rounded-2xl border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95 touch-target"
                      >
                        {featureGuideState.step === activeFeatureGuideSteps.length - 1
                          ? t('contextual_tutorial_done', language)
                          : t('contextual_tutorial_next', language)}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          <AnimatePresence>
            {spendGuideState && activeSpendGuideStep && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[211] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                onClick={() => setSpendGuideState(null)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3 sticky top-0 z-10 bg-white pt-2">
                    <div className="space-y-2">
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        {t('contextual_tutorial_badge', language)}
                      </span>
                      <h3 className="text-lg font-black tracking-tight text-slate-900">
                        {activeSpendGuideStep.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSpendGuideState(null)}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 touch-target"
                      aria-label={language === 'ko' ? '닫기' : 'Close'}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className={cn('mt-4 rounded-2xl border px-4 py-3', activeSpendGuideStep.accentClassName)}>
                    <p className="text-sm font-semibold leading-relaxed">
                      {activeSpendGuideStep.body}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    <span>{t('contextual_tutorial_progress', language, { current: spendGuideState.step + 1, total: spendGuideSteps.length })}</span>
                    <span>SNS</span>
                  </div>

                  {activeSpendGuideStep.onAction ? (
                    <button
                      type="button"
                      onClick={() => {
                        activeSpendGuideStep.onAction?.();
                      }}
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 active:scale-95 touch-target"
                    >
                      <span>{activeSpendGuideStep.actionLabel}</span>
                      <ArrowRight size={16} className="shrink-0" />
                    </button>
                  ) : null}

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSpendGuideState((prev) => prev ? { ...prev, step: Math.max(prev.step - 1, 0) } : prev)}
                      disabled={spendGuideState.step === 0}
                      className={cn(
                        'min-h-11 rounded-2xl border px-3 py-2 text-sm font-bold transition touch-target',
                        spendGuideState.step === 0
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:scale-95'
                      )}
                    >
                      {t('shop_pack_guide_previous', language)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpendGuideState(null)}
                      className="min-h-11 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 touch-target"
                    >
                      {language === 'ko' ? '닫기' : 'Close'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (spendGuideState.step === spendGuideSteps.length - 1) {
                          setSpendGuideState(null);
                          return;
                        }

                        setSpendGuideState((prev) => prev ? { ...prev, step: Math.min(prev.step + 1, spendGuideSteps.length - 1) } : prev);
                      }}
                      className="min-h-11 rounded-2xl border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95 touch-target"
                    >
                      {spendGuideState.step === spendGuideSteps.length - 1
                        ? t('contextual_tutorial_done', language)
                        : t('contextual_tutorial_next', language)}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {pityGuideState && activePityGuideStep && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[212] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                onClick={() => setPityGuideState(null)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3 sticky top-0 z-10 bg-white pt-2">
                    <div className="space-y-2">
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        {t('contextual_tutorial_badge', language)}
                      </span>
                      <h3 className="text-lg font-black tracking-tight text-slate-900">
                        {activePityGuideStep.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPityGuideState(null)}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 touch-target"
                      aria-label={language === 'ko' ? '닫기' : 'Close'}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className={cn('mt-4 rounded-2xl border px-4 py-3', activePityGuideStep.accentClassName)}>
                    <p className="text-sm font-semibold leading-relaxed">
                      {activePityGuideStep.body}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    <span>{t('contextual_tutorial_progress', language, { current: pityGuideState.step + 1, total: pityGuideSteps.length })}</span>
                    <span>PITY</span>
                  </div>

                  {'onAction' in activePityGuideStep && activePityGuideStep.onAction ? (
                    <button
                      type="button"
                      onClick={() => {
                        activePityGuideStep.onAction?.();
                      }}
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 active:scale-95 touch-target"
                    >
                      <span>{activePityGuideStep.actionLabel}</span>
                      <ArrowRight size={16} className="shrink-0" />
                    </button>
                  ) : null}

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPityGuideState((prev) => prev ? { ...prev, step: Math.max(prev.step - 1, 0) } : prev)}
                      disabled={pityGuideState.step === 0}
                      className={cn(
                        'min-h-11 rounded-2xl border px-3 py-2 text-sm font-bold transition touch-target',
                        pityGuideState.step === 0
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:scale-95'
                      )}
                    >
                      {t('shop_pack_guide_previous', language)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPityGuideState(null)}
                      className="min-h-11 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 touch-target"
                    >
                      {language === 'ko' ? '닫기' : 'Close'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (pityGuideState.step === pityGuideSteps.length - 1) {
                          setPityGuideState(null);
                          return;
                        }

                        setPityGuideState((prev) => prev ? { ...prev, step: Math.min(prev.step + 1, pityGuideSteps.length - 1) } : prev);
                      }}
                      className="min-h-11 rounded-2xl border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95 touch-target"
                    >
                      {pityGuideState.step === pityGuideSteps.length - 1
                        ? t('contextual_tutorial_done', language)
                        : t('contextual_tutorial_next', language)}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {packGuideState && activePackGuideStep && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                onClick={() => setPackGuideState(null)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3 sticky top-0 z-10 bg-white pt-2">
                    <div className="space-y-2">
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        {t('contextual_tutorial_badge', language)}
                      </span>
                      <h3 className="text-lg font-black tracking-tight text-slate-900">
                        {activePackGuideStep.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPackGuideState(null)}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 touch-target"
                      aria-label={language === 'ko' ? '닫기' : 'Close'}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className={cn('mt-4 rounded-2xl border px-4 py-3', activePackGuideStep.accentClassName)}>
                    <p className="text-sm font-semibold leading-relaxed">
                      {activePackGuideStep.body}
                    </p>
                    {'detail' in activePackGuideStep && activePackGuideStep.detail ? (
                      <p className="mt-2 text-xs font-medium opacity-80">
                        {activePackGuideStep.detail}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    <span>{t('contextual_tutorial_progress', language, { current: packGuideState.step + 1, total: activePackGuideSteps.length })}</span>
                    <span>{packGuideState.packRarity.toUpperCase()}</span>
                  </div>

                  {activePackGuideStep.onAction ? (
                    <button
                      type="button"
                      onClick={() => {
                        activePackGuideStep.onAction?.();
                      }}
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-900 bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 active:scale-95 touch-target"
                    >
                      <span>{activePackGuideStep.actionLabel}</span>
                      <ArrowRight size={16} className="shrink-0" />
                    </button>
                  ) : null}

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPackGuideState((prev) => prev ? { ...prev, step: Math.max(prev.step - 1, 0) } : prev)}
                      disabled={packGuideState.step === 0}
                      className={cn(
                        'min-h-11 rounded-2xl border px-3 py-2 text-sm font-bold transition touch-target',
                        packGuideState.step === 0
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:scale-95'
                      )}
                    >
                      {t('shop_pack_guide_previous', language)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPackGuideState(null)}
                      className="min-h-11 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 touch-target"
                    >
                      {language === 'ko' ? '닫기' : 'Close'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (packGuideState.step === activePackGuideSteps.length - 1) {
                          setPackGuideState(null);
                          return;
                        }

                        setPackGuideState((prev) => prev ? { ...prev, step: Math.min(prev.step + 1, activePackGuideSteps.length - 1) } : prev);
                      }}
                      className="min-h-11 rounded-2xl border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95 touch-target"
                    >
                      {packGuideState.step === activePackGuideSteps.length - 1
                        ? t('contextual_tutorial_done', language)
                        : t('contextual_tutorial_next', language)}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {pityBannerOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[209] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                onClick={() => setPityBannerOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  className="w-full max-w-3xl rounded-3xl border border-amber-200 bg-white p-5 shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3 sticky top-0 z-10 bg-white pt-2">
                    <div className="space-y-2">
                      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
                        {t('shop_gacha_pity_banner_title', language)}
                      </span>
                      <h3 className="text-lg font-black tracking-tight text-slate-900">
                        {t('shop_gacha_pity_banner_modal_title', language)}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-600">
                        {t('shop_gacha_pity_banner_modal_desc', language)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPityBannerOpen(false)}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 touch-target"
                      aria-label={language === 'ko' ? '닫기' : 'Close'}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {pityBannerViews.map(({ rarity, pityView }) => (
                      <PityGauge
                        key={rarity}
                        packRarity={rarity}
                        language={language}
                        variant="light"
                        current={pityView.current}
                        remaining={pityView.remaining}
                        threshold={pityView.threshold}
                        guaranteeRarity={pityView.guaranteeRarity}
                        updatedAt={pityView.lastUpdatedAt ? new Date(pityView.lastUpdatedAt).toISOString().slice(0, 10) : GACHA_PACK_CONFIG[rarity].updatedAt}
                        seasonLabel={currentSeason}
                        lowSpecMode={lowSpecMode}
                        standalone
                      />
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <ProbabilityModal
            isOpen={probabilityModalOpen}
            selectedPack={selectedProbabilityPack}
            onSelectPack={setSelectedProbabilityPack}
            onClose={() => setProbabilityModalOpen(false)}
            language={language}
            lowSpecMode={lowSpecMode}
            onNavigate={onNavigate}
          />

          <AnimatePresence>
            {gachaShareCardId !== null && (
              <ShareTemplateCard
                templateType="character"
                language={language}
                cardId={gachaShareCardId}
                lowSpecMode={lowSpecMode}
                onClose={() => setGachaShareCardId(null)}
                showToast={(message) => showToast(message)}
              />
            )}
          </AnimatePresence>


          <div className="mb-2 flex justify-end">
            <div
              className={cn(
                "min-w-[160px] rounded-xl border p-4 shadow-sm sm:min-w-[180px] sm:p-6 md:min-w-[200px]",
                testMode ? "border-red-200 bg-red-50 text-red-600 animate-pulse" : "border-slate-100 bg-white text-slate-800"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Zap size={12} className="sm:w-3.5 sm:h-3.5 text-yellow-500 animate-pulse" />
                <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-slate-400">
                  {t('owned_coins', language)}
                </span>
              </div>
              <span className={cn("font-bold tracking-tighter truncate block text-slate-900", sns.toLocaleString().length > 8 ? "text-xl sm:text-2xl" : sns.toLocaleString().length > 5 ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl")} title={`${sns.toLocaleString()} SNS`}>
                {sns.toLocaleString()} <span className="text-xs sm:text-sm text-slate-400 tracking-widest font-normal">SNS</span>
              </span>
            </div>
          </div>


          {/* 부지런의 나무 걸음수 충전 섹션 */}
          {false && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-6 border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 relative overflow-hidden mb-8",
                (currentSteps - claimedSteps) > 0 
                  ? "bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-amber-100 shadow-lg hover:shadow-xl active:scale-[0.99]" 
                  : "bg-slate-50 opacity-90 border-dashed border-slate-200 shadow-none"
              )}
            >
              {(currentSteps - claimedSteps) > 0 && (
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-yellow-200/35 rounded-full blur-3xl pointer-events-none" />
              )}
              
              <div className="flex items-center gap-4 relative z-10">
                <div className={cn(
                  "p-4 rounded-xl border flex items-center justify-center shrink-0 shadow-xs",
                  (currentSteps - claimedSteps) > 0 ? "bg-amber-100 border-amber-200 text-amber-600 animate-pulse" : "bg-slate-100 border-slate-200 text-slate-400"
                )}>
                  {(currentSteps - claimedSteps) > 0 ? <Sparkles size={22} /> : <Activity size={22} />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg tracking-tight text-slate-800">{t('tree_of_diligence', language)}</h3>
                    {(currentSteps - claimedSteps) > 0 ? (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-amber-200 animate-bounce">
                        {language === 'ko' ? '정산 가능' : 'READY'}
                      </span>
                    ) : (
                      <span className="bg-slate-200 text-slate-650 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-slate-300 flex items-center gap-1">
                        <Lock size={10} /> {t('tree_of_diligence_claimed', language)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {t('tree_of_diligence_desc', language)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {t('tree_of_diligence_steps', language)
                      .replace('{steps}', currentSteps.toLocaleString())
                      .replace('{claimed}', claimedSteps.toLocaleString())}
                  </p>
                </div>
              </div>

              <div className="w-full md:w-auto flex items-center gap-4 relative z-10">
                <button
                  onClick={handleClaimSteps}
                  className={cn(
                    "w-full md:w-auto px-5 py-3 font-bold text-xs uppercase tracking-wider transition-all duration-150 rounded-xl active:scale-[0.98] border-none",
                    (currentSteps - claimedSteps) > 0
                      ? "bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-950/15 cursor-pointer"
                      : "bg-slate-100 text-slate-400 cursor-default"
                  )}
                >
                  {(currentSteps - claimedSteps) > 0 
                    ? t('tree_of_diligence_btn', language).replace('{steps}', (currentSteps - claimedSteps).toLocaleString()) 
                    : (language === 'ko' ? '걸음수 가져오기' : 'SYNC STEPS')}
                </button>
              </div>
            </motion.div>
          )}

          {/* SNS 코인 상점 섹션 헤더 */}
          <div className="mb-1 mt-2 flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-slate-200" />
          </div>

          <div id="shop-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 font-sans">
            {cardPacks.map((pack) => {
              const packTheme = pack.rarity === 'bronze'
                ? {
                    cardBorder: 'border-amber-100 hover:border-amber-200',
                    glow: 'bg-amber-500/10 group-hover:bg-amber-500/20',
                    badge: 'bg-amber-700 text-white',
                    primaryButton: 'border-amber-700 bg-amber-700 hover:bg-amber-600 hover:border-amber-600',
                  }
                : pack.rarity === 'silver'
                  ? {
                      cardBorder: 'border-slate-200 hover:border-slate-300',
                      glow: 'bg-slate-400/10 group-hover:bg-slate-400/20',
                      badge: 'bg-slate-700 text-white',
                      primaryButton: 'border-slate-900 bg-slate-900 hover:bg-slate-800 hover:border-slate-800',
                    }
                  : {
                      cardBorder: 'border-yellow-200 hover:border-yellow-300',
                      glow: 'bg-yellow-400/10 group-hover:bg-yellow-400/20',
                      badge: 'bg-yellow-500 text-yellow-950',
                      primaryButton: 'border-yellow-500 bg-yellow-500 text-yellow-950 hover:bg-yellow-400 hover:border-yellow-400',
                    };

              return (
              <motion.div
                key={pack.title}
                id={`shop-pack-${pack.rarity}`}
                whileHover={lowSpecMode ? undefined : { y: -4 }}
                className={cn(
                  'relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all group sm:p-6 md:p-7 h-full',
                  packTheme.cardBorder,
                )}
              >
                <div className={cn('absolute -left-10 top-8 h-28 w-28 rounded-full blur-3xl transition-all duration-500', packTheme.glow)} />

                <img
                  src={`/background-${pack.rarity}.png`}
                  alt={pack.rarity}
                  className="pointer-events-none absolute left-4 top-14 z-0 h-16 w-16 object-contain opacity-25 transition-all duration-500 group-hover:scale-105 group-hover:opacity-45 sm:h-20 sm:w-20"
                />

                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className={cn('rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest sm:text-[10px]', packTheme.badge)}>
                      {pack.title}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProbabilityPack(pack.rarity);
                          setProbabilityModalOpen(true);
                        }}
                        className="flex items-center gap-1 rounded-md border border-amber-300/80 bg-amber-50/90 px-2 py-1 text-[10px] font-extrabold text-amber-900 hover:bg-amber-100 hover:border-amber-400 transition-colors shadow-2xs cursor-pointer"
                        aria-label={t('shop_drop_rates_btn', language)}
                        title={t('shop_drop_rates_btn', language)}
                      >
                        <Activity size={12} className="text-amber-700 shrink-0" />
                        <span>{t('shop_drop_rates_btn', language)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPackGuideState({ packRarity: pack.rarity, step: 0 })}
                        className={getGuideButtonClassName()}
                        aria-label={t('shop_pack_guide_open', language)}
                        title={t('shop_pack_guide_open', language)}
                      >
                        <HelpCircle size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="pl-14 sm:pl-16">
                    <h3 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">{pack.label}</h3>
                  </div>
                </div>

                <div className="relative z-10 mt-auto pt-2 w-full flex flex-col gap-2">
                  <button
                    id={`shop-pack-${pack.rarity}-btn`}
                    onClick={() => buyPack(pack.cost, pack.rarity)}
                    className={cn(
                      'min-h-[44px] h-auto w-full rounded-xl border px-3 py-2.5 text-left text-white shadow-sm transition-all active:scale-95 touch-target flex items-center justify-between gap-1 overflow-hidden cursor-pointer',
                      packTheme.primaryButton,
                    )}
                  >
                    <span className="min-w-0 leading-tight flex-1">
                      <span className="block text-[10px] uppercase tracking-[0.05em] text-white/80 truncate">{language === 'ko' ? '카드팩 개봉' : 'Open Pack'}</span>
                      <span className="text-sm font-black truncate block">{pack.cost} SNS</span>
                    </span>
                    <ArrowRight size={16} className="shrink-0 opacity-80 ml-1" />
                  </button>
                </div>

              </motion.div>
              );
            })}

            {/* Item Pack */}
            <motion.div
              whileHover={lowSpecMode ? undefined : { y: -4 }}
              className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-purple-100 bg-white p-5 shadow-sm transition-all group sm:p-6 md:p-7 h-full"
            >
              <div className="absolute -left-10 top-8 h-28 w-28 rounded-full bg-purple-500/10 blur-3xl transition-all duration-500 group-hover:bg-purple-500/20" />
              <Package className="pointer-events-none absolute left-4 top-14 z-0 h-16 w-16 text-purple-200 opacity-80 sm:h-20 sm:w-20" aria-hidden="true" />

              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-lg bg-purple-600 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white sm:text-[10px]">
                    {t('item_pack', language)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeatureGuideState({ feature: 'item-pack', step: 0 })}
                    className={cn(getGuideButtonClassName(), 'border-purple-200 bg-white/90 text-purple-700 hover:border-purple-300 hover:bg-purple-50')}
                    aria-label={t('shop_feature_item_pack_guide_open', language)}
                    title={t('shop_feature_item_pack_guide_open', language)}
                  >
                    <HelpCircle size={16} />
                  </button>
                </div>

                <div className="pl-14 sm:pl-16">
                  <h3 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">{t('buy_item_pack', language)}</h3>
                  <p className="text-xs text-purple-700 font-bold mt-0.5">
                    {language === 'ko' ? '랜덤 장비 3종 획득' : '3 Random Equipments'}
                  </p>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-600 border-t border-purple-100 pt-3 font-medium">
                  <li className="flex items-center gap-1.5">
                    <span className="text-purple-600 font-bold">✓</span>
                    <span>{language === 'ko' ? '무기, 방어구, 장신구 장착 가능' : 'Weapons, Armors, Accessories'}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-purple-600 font-bold">✓</span>
                    <span>{language === 'ko' ? '카드 4방향 스탯 추가 보너스' : '4-Direction Stat Boosts'}</span>
                  </li>
                </ul>
              </div>

              <div className="relative z-10 mt-auto pt-2 w-full">
                <button
                  id="shop-pack-item-btn"
                  onClick={buyItemPack}
                  className="min-h-[44px] h-auto w-full rounded-xl border border-purple-700 bg-purple-700 hover:bg-purple-600 px-3 py-2.5 text-left text-white shadow-sm transition-all active:scale-95 touch-target flex items-center justify-between gap-1 overflow-hidden cursor-pointer"
                >
                  <span className="min-w-0 leading-tight flex-1">
                    <span className="block text-[10px] uppercase tracking-[0.05em] text-white/80 truncate">{language === 'ko' ? '아이템 팩 구매' : 'Buy Item Pack'}</span>
                    <span className="text-sm font-black truncate block">{itemPackCost} SNS</span>
                  </span>
                  <ArrowRight size={16} className="shrink-0 opacity-80 ml-1" />
                </button>
              </div>
            </motion.div>

            {/* Remove Ads Pack */}
            <motion.div
              whileHover={lowSpecMode ? undefined : { y: -4 }}
              className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition-all group sm:p-6 md:p-7 h-full"
            >
              <div className="absolute -left-10 top-8 h-28 w-28 rounded-full bg-blue-500/10 blur-3xl transition-all duration-500 group-hover:bg-blue-500/20" />
              <ShieldAlert className="pointer-events-none absolute left-4 top-14 z-0 h-16 w-16 text-blue-200 opacity-80 sm:h-20 sm:w-20" aria-hidden="true" />

              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-lg bg-blue-600 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white sm:text-[10px]">
                    {language === 'ko' ? '광고 제거' : 'REMOVE ADS'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeatureGuideState({ feature: 'ad-removal', step: 0 })}
                    className={cn(getGuideButtonClassName(), 'border-blue-200 bg-white/90 text-blue-700 hover:border-blue-300 hover:bg-blue-50')}
                    aria-label={t('shop_feature_ad_removal_guide_open', language)}
                    title={t('shop_feature_ad_removal_guide_open', language)}
                  >
                    <HelpCircle size={16} />
                  </button>
                </div>

                <div className="pl-14 sm:pl-16">
                  <h3 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">{language === 'ko' ? '광고 제거 패키지' : 'Ad-Free Package'}</h3>
                  <p className="text-xs text-blue-700 font-bold mt-0.5">
                    {isAdRemoved ? (language === 'ko' ? '영구 적용 완료' : 'Permanently Active') : (language === 'ko' ? '영구 무제한 광고 차단' : 'Permanent Ad Block')}
                  </p>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-600 border-t border-blue-100 pt-3 font-medium">
                  <li className="flex items-center gap-1.5">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>{language === 'ko' ? '전투 및 미니게임 즉시 플레이' : 'Instant play without ads'}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-blue-600 font-bold">✓</span>
                    <span>{language === 'ko' ? '모든 광고 보상 딜레이 없이 즉시 수령' : 'Direct reward claims'}</span>
                  </li>
                </ul>
              </div>

              <div className="relative z-10 mt-auto pt-2 w-full">
                <button
                  id="shop-pack-remove-ads-btn"
                  disabled={isAdRemoved}
                  onClick={() => {
                    if (sns >= adRemovalCost) {
                      updateSns(-adRemovalCost, 'ad_removal_purchase');
                      if (setIsAdRemoved) setIsAdRemoved(true);
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                      setSuccessVisible({ isAdRemoval: true });
                    } else {
                      setErrorVisible(true);
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                    }
                  }}
                  className={cn(
                    'min-h-[44px] h-auto w-full rounded-xl border px-3 py-2.5 text-left shadow-sm transition-all touch-target flex items-center justify-between gap-1 overflow-hidden cursor-pointer',
                    isAdRemoved
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                      : 'border-blue-600 bg-blue-600 text-white hover:border-blue-500 hover:bg-blue-500 active:scale-95'
                  )}
                >
                  <span className="min-w-0 leading-tight flex-1">
                    <span className="block text-[10px] uppercase tracking-[0.05em] text-white/80 truncate">
                      {isAdRemoved ? (language === 'ko' ? '구매 완료' : 'Owned') : (language === 'ko' ? '광고 제거 구매' : 'Buy Ad-Free')}
                    </span>
                    <span className="text-sm font-black truncate block">
                      {isAdRemoved ? '✓' : `${adRemovalCost.toLocaleString()} SNS`}
                    </span>
                  </span>
                  {!isAdRemoved && <ArrowRight size={16} className="shrink-0 opacity-80 ml-1" />}
                </button>
              </div>
            </motion.div>

            {/* Full Novel Download Pack */}
            <motion.div
              whileHover={lowSpecMode ? undefined : { y: -4 }}
              className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-50/50 via-white to-white p-5 sm:p-6 md:p-7 shadow-sm transition-all group hover:border-emerald-500/60 hover:shadow-md h-full"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl transition-all duration-500 group-hover:bg-emerald-500/20" />

              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-xs">
                    <BookOpen size={12} className="shrink-0" />
                    <span>{language === 'ko' ? '공식 소설' : 'OFFICIAL NOVEL'}</span>
                  </div>
                  <span className="rounded-md border border-emerald-400/50 bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-900 tracking-wider">
                    {language === 'ko' ? '무료 (FREE)' : 'FREE'}
                  </span>
                </div>

                <div className="flex items-center gap-3 my-1">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700 group-hover:scale-105 transition-transform">
                    <BookOpen size={24} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                      {language === 'ko' ? '전체 소설 (Part 1)' : 'Full Novel (Part 1)'}
                    </h3>
                    <p className="text-xs text-emerald-700 font-mono font-bold">
                      {language === 'ko' ? 'PDF e-Book (143 Pages)' : 'PDF e-Book (143 Pages)'}
                    </p>
                  </div>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-600 border-t border-emerald-100 pt-3 font-medium">
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{language === 'ko' ? '카단 & 아케인 에코즈 전편 포함' : 'Includes full Kadan & Arcane Echoes'}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{language === 'ko' ? '한글 폰트 적용 가독성 최적화' : 'Optimized e-book reading layout'}</span>
                  </li>
                </ul>
              </div>

              <div className="relative z-10 mt-auto pt-2 w-full">
                <button
                  id="shop-pack-download-novel-btn"
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                    const pdfFileName = language === 'ko' ? 'snshero_part1_ko.pdf' : 'snshero_part1.pdf';
                    const pdfUrl = `/${pdfFileName}`;
                    const link = document.createElement('a');
                    link.href = pdfUrl;
                    link.download = pdfFileName;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="min-h-[44px] h-auto w-full rounded-xl border border-emerald-700 bg-emerald-700 hover:bg-emerald-800 px-3 py-2.5 text-left text-white shadow-sm transition-all active:scale-95 touch-target flex items-center justify-between gap-1 overflow-hidden cursor-pointer"
                >
                  <span className="min-w-0 leading-tight flex-1">
                    <span className="block text-[10px] uppercase tracking-[0.05em] text-white/80 truncate">{language === 'ko' ? '소설 PDF 다운로드' : 'Download Novel PDF'}</span>
                    <span className="text-sm font-black truncate block">FREE (PDF)</span>
                  </span>
                  <Download size={16} className="shrink-0 opacity-80 ml-1" />
                </button>
              </div>
            </motion.div>

            {/* Watch Full Video Pack */}
            <motion.div
              whileHover={lowSpecMode ? undefined : { y: -4 }}
              className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border-2 border-red-500/30 bg-gradient-to-b from-red-50/50 via-white to-white p-5 sm:p-6 md:p-7 shadow-sm transition-all group hover:border-red-500/60 hover:shadow-md h-full"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-red-500/10 blur-2xl transition-all duration-500 group-hover:bg-red-500/20" />

              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-xs">
                    <Film size={12} className="shrink-0" />
                    <span>{language === 'ko' ? '공식 영상' : 'OFFICIAL VIDEO'}</span>
                  </div>
                  <span className="rounded-md border border-red-400/50 bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-900 tracking-wider">
                    {language === 'ko' ? '무료 (FREE)' : 'FREE'}
                  </span>
                </div>

                <div className="flex items-center gap-3 my-1">
                  <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center shrink-0 text-red-700 group-hover:scale-105 transition-transform">
                    <Play size={24} className="fill-current ml-0.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                      {language === 'ko' ? '공식 동영상 전체보기' : 'Watch Official Video'}
                    </h3>
                    <p className="text-xs text-red-700 font-mono font-bold">
                      {language === 'ko' ? 'YouTube HD 스트리밍' : 'YouTube HD Video'}
                    </p>
                  </div>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-600 border-t border-red-100 pt-3 font-medium">
                  <li className="flex items-center gap-1.5">
                    <span className="text-red-600 font-bold">✓</span>
                    <span>{language === 'ko' ? '공식 게임플레이 & 스토리 가이드' : 'Official Gameplay & Story Guide'}</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-red-600 font-bold">✓</span>
                    <span>{language === 'ko' ? '유튜브 새창 원클릭 바로 재생' : 'One-click play on YouTube'}</span>
                  </li>
                </ul>
              </div>

              <div className="relative z-10 mt-auto pt-2 w-full">
                <button
                  id="shop-pack-watch-video-btn"
                  onClick={() => {
                    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                    const videoUrl = language === 'ko'
                      ? 'https://www.youtube.com/watch?v=zs5Fotw6mM8'
                      : 'https://www.youtube.com/watch?v=TA1klx1DSGs';
                    window.open(videoUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="min-h-[44px] h-auto w-full rounded-xl border border-red-700 bg-red-700 hover:bg-red-800 px-3 py-2.5 text-left text-white shadow-sm transition-all active:scale-95 touch-target flex items-center justify-between gap-1 overflow-hidden cursor-pointer"
                >
                  <span className="min-w-0 leading-tight flex-1">
                    <span className="block text-[10px] uppercase tracking-[0.05em] text-white/80 truncate">{language === 'ko' ? '공식 영상 시청' : 'Watch Official Video'}</span>
                    <span className="text-sm font-black truncate block">FREE (YOUTUBE)</span>
                  </span>
                  <Play size={16} className="shrink-0 fill-current opacity-80 ml-1" />
                </button>
              </div>
            </motion.div>


          </div>
          {/* 현금 충전 구분선 */}
          <div className="space-y-6 sm:space-y-8 pt-4 sm:pt-6 md:pt-8 border-t border-slate-200 mt-4 sm:mt-6 md:mt-8">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                <ShoppingBag size={12} className="shrink-0" />
                {t('coin_recharge', language)} (PAYPAL_API)
              </div>
              <div className="h-[1px] flex-1 bg-black/10" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {[
                { amount: 1000, price: "1.00", krwPrice: "1500", label: "1,000 P (SNS)", sku: "snshero_points_1000" },
                { amount: 3000, price: "2.99", krwPrice: "4000", label: "3,000 P (SNS)", sku: "snshero_points_3000" },
                { amount: 10000, price: "10.00", krwPrice: "14000", label: "10,000 P (SNS)", sku: "snshero_points_10000" },
                { amount: 50000, price: "100.00", krwPrice: "140000", label: "50,000 P (SNS)", sku: "snshero_points_50000" },
                { amount: 0, price: "2.99", krwPrice: "4000", label: language === 'ko' ? "광고 제거 패키지" : "Ad Removal Package", isAdRemoval: true, sku: "ad_removal" },
              ].map((item: any) => (
                <div key={item.label} className="bg-white p-5 sm:p-6 md:p-8 flex flex-col justify-between gap-5 sm:gap-6 md:gap-8 border border-slate-100 hover:border-slate-200 transition-all shadow-sm hover:shadow-md rounded-2xl h-full">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <Zap size={20} className="sm:w-6 sm:h-6 text-yellow-500 animate-pulse" />
                      <div className="text-right">
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">
                          {t('unit_price', language)}
                        </p>
                        <p className="text-xl sm:text-2xl font-bold tracking-tighter text-slate-800">${item.price} USD</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-base sm:text-lg tracking-tight text-slate-800">{item.label}</h4>
                      <p className="text-[9px] sm:text-[10px] text-slate-500 font-semibold tracking-widest uppercase whitespace-pre-line leading-relaxed">
                        {item.isAdRemoval 
                          ? (language === 'ko' ? '광고 영구 제거 패키지' : 'PERMANENT AD REMOVAL')
                          : `${item.amount.toLocaleString()} ${t('sns_unit_recharge', language)} ${item.bonus ? `(+${item.bonus}%)` : ""}`}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 w-full flex flex-col gap-2 mt-auto pt-2">
                    <button
                      onClick={() => {
                        setSelectedPackage(item);
                        setSelectedCountry(null);
                        setCountryModalOpen(true);
                        playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                      }}
                      className={cn(
                        "w-full bg-slate-900 text-white font-bold uppercase tracking-wider text-sm hover:bg-slate-800 transition-all font-sans min-h-[52px] sm:min-h-[56px] h-auto py-3 rounded-xl flex items-center justify-center cursor-pointer shadow-xs active:scale-95 touch-target"
                      )}
                    >
                      {t('buy', language)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>


          
          {/* Custom Alert Modal */}
          <AnimatePresence>
            {customAlert.isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-white rounded-3xl p-7 max-w-sm w-full border border-slate-100 shadow-2xl text-center space-y-6 select-none relative overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-full mx-auto flex items-center justify-center shadow-xs">
                    <AlertCircle size={26} className="text-amber-600" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold tracking-tight text-slate-800 uppercase leading-none">{customAlert.title}</h3>
                    <p className="text-sm font-semibold text-slate-500 leading-tight">
                      {customAlert.message}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                      setCustomAlert(prev => ({ ...prev, isOpen: false }));
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-slate-950/10 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {language === 'ko' ? '확인' : 'OK'}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Goods Options Modal */}
          <AnimatePresence>
            {goodsModalOpen && selectedGoods && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-slate-805"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-white border border-slate-100 p-6.5 rounded-3xl shadow-2xl w-full max-w-md flex flex-col gap-5 relative"
                >
                  <button
                    onClick={() => {
                      setGoodsModalOpen(false);
                      setSelectedGoods(null);
                    }}
                    className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 active:scale-95 transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>

                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-36 h-36 flex items-center justify-center bg-slate-50 border border-slate-150 rounded-2xl overflow-hidden shadow-xs">
                      <img src={selectedGoods === 'mug' ? getAssetUrl('/mug.png') : getAssetUrl('/icon.png')} alt="Goods" className="w-full h-full object-contain" />
                      <div className={cn(
                        "absolute bg-transparent overflow-hidden opacity-90 select-none rounded-xs p-1 flex flex-col justify-between items-center",
                        selectedGoods === 'mug'
                          ? "top-[30%] left-[37%] translate-x-[5px] w-[28%] aspect-[4/7] rotate-[-2deg]"
                          : "top-[28%] left-[37%] w-[28%] aspect-[4/7]"
                      )}>
                        <div className="w-full aspect-[5/7] overflow-hidden">
                          <CardItem
                            card={{
                              ...CARD_DATABASE[selectedGoods === 'mug' ? mugCardId : tshirtCardId],
                              id: 'goods-modal-preview',
                              owner: null,
                              level: 1,
                              imageIndex: selectedGoods === 'mug' ? mugCardId : tshirtCardId
                            }}
                            className="w-full h-full text-[4px]"
                            customImage={customCardImage}
                            processedImage={processedCardImages?.[(selectedGoods === 'mug' ? mugCardId : tshirtCardId) - 1]}
                            lowSpecMode={true}
                          />
                        </div>
                        <div className="w-full text-center text-[3.5px] font-black text-slate-950 leading-none truncate my-0.5">
                          {(() => {
                            const cId = selectedGoods === 'mug' ? mugCardId : tshirtCardId;
                            return getFormattedCardName(CARD_DATABASE[cId], language).replace(". ", ".");
                          })()}
                        </div>
                        <div className="w-full flex justify-center origin-center scale-[0.4] my-0.5 whitespace-nowrap">
                          <h1 id="main-logo" className="font-extrabold italic tracking-tight flex items-baseline justify-center mx-auto select-none font-sans"><span className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-rose-500 bg-clip-text text-transparent pr-0.5 text-[8px]">S&amp;SHERO</span><span className="text-slate-900 text-[5px] not-italic">.com</span></h1>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Card Changer Option */}
                    <div className="flex justify-between items-center bg-slate-50 p-3 border border-slate-150 rounded-xl">
                      <span className="font-bold uppercase text-xs">{t('goods_change_card', language)}</span>
                      <button
                        onClick={() => setGoodsCardSelectOpen(true)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold uppercase active:scale-95 transition-all cursor-pointer"
                      >
                        {t('goods_change_card', language)}
                      </button>
                    </div>

                    {/* Size Option (Only for Tshirt) */}
                    {selectedGoods === 'tshirt' && (
                      <div className="flex justify-between items-center bg-slate-50 p-3 border border-slate-150 rounded-xl">
                        <span className="font-bold uppercase text-xs">{t('goods_change_size', language)}</span>
                        <div className="flex gap-1.5">
                          {(['S', 'M', 'L'] as const).map(size => (
                            <button
                              key={size}
                              onClick={() => {
                                setGoodsSize(size);
                                playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
                              }}
                              className={cn(
                                "min-w-[44px] min-h-[44px] rounded-lg text-xs font-bold transition-all border cursor-pointer flex items-center justify-center",
                                goodsSize === size
                                  ? "bg-slate-900 text-white border-slate-900"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              )}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity Regulator */}
                    <div className="flex justify-between items-center bg-slate-50 p-3 border border-slate-150 rounded-xl">
                      <span className="font-bold uppercase text-xs">{t('goods_change_quantity', language)}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setGoodsQuantity(q => Math.max(1, q - 1))}
                          className="min-w-[44px] min-h-[44px] bg-white border border-slate-200 active:scale-95 rounded-lg font-bold flex items-center justify-center hover:bg-slate-50 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-bold text-sm w-6 text-center">{goodsQuantity}</span>
                        <button
                          onClick={() => setGoodsQuantity(q => q + 1)}
                          className="min-w-[44px] min-h-[44px] bg-white border border-slate-200 active:scale-95 rounded-lg font-bold flex items-center justify-center hover:bg-slate-50 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Total billing amount display */}
                    <div className="border-t border-dashed border-slate-200 pt-4 flex justify-between items-center font-bold">
                      <span className="uppercase text-xs">{t('goods_total_price', language)}</span>
                      <span className="text-xl tracking-tighter">${(selectedGoods === 'mug' ? 10 : 35) * goodsQuantity}.00 USD</span>
                    </div>

                    <button
                      onClick={() => setGoodsCheckoutOpen(true)}
                      className="w-full py-3.5 bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-md shadow-slate-950/10 active:scale-[0.98] transition-all rounded-xl uppercase tracking-wider text-xs mt-2 cursor-pointer"
                    >
                      {t('goods_checkout', language)}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Goods Card Selection Modal */}
          <AnimatePresence>
            {goodsCardSelectOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-slate-805"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-white border border-slate-100 p-6 rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col gap-4.5 relative"
                >
                  <button
                    onClick={() => setGoodsCardSelectOpen(false)}
                    className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 active:scale-95 transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>

                  <h3 className="text-lg font-bold tracking-tight text-slate-800 uppercase border-b border-slate-100 pb-3">
                    {t('goods_select_card_title', language)}
                  </h3>

                  <div className="flex-1 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-3.5 p-1 auto-rows-max">
                    {(() => {
                      return goodsSelectableCards.map((cardObj: any, idx) => {
                        const cardId = cardObj.imageIndex;
                        const cardData = CARD_DATABASE[cardId];
                        if (!cardData) return null;

                        return (
                          <div
                            key={`select-goods-card-${idx}`}
                            onClick={() => {
                              if (selectedGoods === 'mug') {
                                setMugCardId(cardId);
                              } else {
                                setTshirtCardId(cardId);
                              }
                              setGoodsCardSelectOpen(false);
                            }}
                            className="border border-slate-200/80 p-2 bg-slate-50/50 hover:bg-slate-100/50 rounded-xl cursor-pointer active:scale-98 transition-all flex flex-col gap-1.5 overflow-hidden min-h-0 shadow-xs"
                          >
                            <div className="aspect-[5/7] w-full overflow-hidden rounded-lg flex-shrink-0">
                               <CardItem
                                card={{
                                  ...cardData,
                                  id: `select-card-${idx}`,
                                  owner: null,
                                  level: 1,
                                  imageIndex: cardData.index
                                }}
                                className="w-full h-full text-[6px]"
                                customImage={customCardImage}
                                processedImage={processedCardImages?.[cardData.index - 1]}
                                lowSpecMode={true}
                                hideStats
                              />
                            </div>
                            <span className="text-[8px] font-bold uppercase text-slate-700 text-center block truncate leading-none py-0.5 flex-shrink-0">
                              {language === 'ko' ? cardData.title : cardData.title_en}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Checkout Method Selection Modal */}
          <AnimatePresence>
            {goodsCheckoutOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-slate-808"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-white border border-slate-100 p-6.5 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col gap-5 relative"
                >
                  <button
                    onClick={() => setGoodsCheckoutOpen(false)}
                    className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 active:scale-95 transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>

                  <h3 className="text-lg font-bold tracking-tight text-slate-800 uppercase border-b border-slate-100 pb-3">
                    {t('goods_checkout', language)}
                  </h3>

                  <div className="flex flex-col gap-4">
                    <button
                      onClick={handleGoodsDollarCheckout}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-orange-500/10 active:scale-[0.98] transition-all rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                    >
                      <span className="text-sm uppercase font-bold">{t('goods_dollar_payment', language)}</span>
                      <span className="text-xs font-semibold opacity-90">${(selectedGoods === 'mug' ? 10 : 35) * goodsQuantity}.00 USD</span>
                    </button>

                    <button
                      onClick={() => handleGoodsCryptoPayment()}
                      className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 shadow-xs active:scale-[0.98] transition-all rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                    >
                      <span className="text-sm uppercase font-bold text-slate-700">{t('goods_coin_payment', language)}</span>
                      <span className="text-xs font-bold text-blue-600">${(selectedGoods === 'mug' ? 10 : 35) * goodsQuantity}.00 USD</span>
                    </button>

                    {user?.email === 'dryudryu@gmail.com' && (
                      <button
                        onClick={handleGoodsTestPurchase}
                        className="w-full py-3 bg-red-650 hover:bg-red-750 text-white shadow-md shadow-red-650/10 active:scale-[0.98] transition-all rounded-xl uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer border-none"
                      >
                        <Lock size={14} />
                        {t('goods_test_payment', language)}
                      </button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shipping Address Form Modal */}
          <AnimatePresence>
            {goodsShippingOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans text-slate-800"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-white border border-slate-100 p-6 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col gap-4 relative"
                >
                  <button
                    onClick={() => setGoodsShippingOpen(false)}
                    className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
                  >
                    <X size={20} />
                  </button>

                  <h3 className="text-xl font-bold uppercase tracking-tight border-b border-slate-100 pb-3 text-slate-800">
                    {t('goods_buyer_info', language)}
                  </h3>

                  <form onSubmit={handleGoodsShippingSubmit} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t('goods_buyer_name', language)}</label>
                      <input
                        type="text"
                        required
                        value={goodsBuyerName}
                        onChange={e => setGoodsBuyerName(e.target.value)}
                        placeholder="Greg You"
                        className="w-full bg-slate-50 border border-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white rounded-xl transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t('goods_buyer_address', language)}</label>
                      <textarea
                        required
                        rows={3}
                        value={goodsBuyerAddress}
                        onChange={e => setGoodsBuyerAddress(e.target.value)}
                        placeholder="Seoul, South Korea..."
                        className="w-full bg-slate-50 border border-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white rounded-xl resize-none transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all rounded-xl uppercase tracking-wider text-sm mt-2 cursor-pointer active:scale-95 shadow-sm border-none"
                    >
                      {t('goods_complete_order', language)}
                    </button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Payment Method Selection Popup */}
          <AnimatePresence>
            {goodsPaymentPopupOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans text-slate-800"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-white border border-slate-100 p-6.5 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col gap-4 relative max-h-[85vh] overflow-y-auto"
                >
                  <button
                    onClick={() => setGoodsPaymentPopupOpen(false)}
                    className="absolute top-4 right-4 p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 active:scale-95 transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>

                  <h3 className="text-lg font-bold tracking-tight border-b border-slate-100 pb-3 text-slate-800">
                    {t('goods_payment_method_title', language)}
                  </h3>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      {t('goods_payment_summary_title', language)}
                    </p>
                    <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                      <span>{selectedGoods === 'mug' ? 'Custom Mug Cup' : 'Custom T-Shirt'}</span>
                      <span>${((selectedGoods === 'mug' ? 10 : 35) * goodsQuantity).toFixed(2)} USD</span>
                    </div>
                    {goodsSelectedCountry && (
                      <p className="text-xs text-slate-500 font-semibold">
                        {(COUNTRIES.find(c => c.code === goodsSelectedCountry)?.flag || '')} {(COUNTRIES.find(c => c.code === goodsSelectedCountry)?.name || goodsSelectedCountry)}
                      </p>
                    )}
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      {t('goods_payment_gateway_notice', language)}
                    </p>
                  </div>

                  <PaymentMethodSelector
                    language={language}
                    lowSpecMode={false}
                    selectedGatewayId={selectedGoodsGatewayId}
                    onGatewaySelect={setSelectedGoodsGatewayId}
                    onNavigate={onNavigate}
                  />

                  <div className="flex flex-col gap-3">
                    {selectedGoodsGatewayId === 'paypal' && (
                      <PayPalButtonWrapper
                        item={{
                          label: selectedGoods === 'mug' ? 'Custom Mug Cup' : 'Custom T-Shirt',
                          price: ((selectedGoods === 'mug' ? 10 : 35) * goodsQuantity).toString(),
                          isGoods: true,
                          goodsType: selectedGoods,
                          quantity: goodsQuantity,
                          cardId: selectedGoods === 'mug' ? mugCardId : tshirtCardId
                        }}
                        updateSns={updateSns}
                        playSfx={playSfx}
                        setSuccessVisible={setSuccessVisible}
                        setSelectedPaymentItem={() => {
                          setTimeout(() => {
                            const pendingStr = localStorage.getItem('hero_goods_pending_payment');
                            if (pendingStr) {
                              try {
                                const pending = JSON.parse(pendingStr);
                                if (pending.goodsType === 'mug') {
                                  setMugCardId(pending.cardId);
                                } else {
                                  setTshirtCardId(pending.cardId);
                                }
                                setGoodsQuantity(pending.quantity || 1);
                                setGoodsCountry(pending.country || 'ko');
                                setGoodsSelectedCountry(pending.country || 'ko');
                                setSelectedGoodsGatewayId('paypal');
                                setGoodsPaymentMethod('paypal');
                                setSelectedGoods(pending.goodsType);
                                setGoodsModalOpen(true);
                                setGoodsPaymentPopupOpen(false);
                                localStorage.removeItem('hero_goods_pending_payment');
                                setTimeout(() => setGoodsShippingOpen(true), 500);
                              } catch (e) {
                                console.warn('Failed to open goods shipping', e);
                              }
                            }
                          }, 100);
                        }}
                        setCountryModalOpen={setGoodsPaymentPopupOpen}
                        language={language}
                        setIsAdRemoved={setIsAdRemoved}
                        funding={FUNDING.PAYPAL}
                      />
                    )}

                    {selectedGoodsGatewayId === 'crypto-okx' && (
                      <button
                        onClick={handleGoodsCryptoPayment}
                        className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-[0.98] transition-all rounded-xl uppercase tracking-wider text-xs font-bold flex items-center justify-center gap-2 cursor-pointer border-none"
                      >
                        {t('goods_crypto_payment', language)}
                      </button>
                    )}

                    {user?.email === 'dryudryu@gmail.com' && (
                      <button
                        onClick={handleGoodsPaymentConfirm}
                        className="w-full py-4 bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all rounded-xl uppercase tracking-wider text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm border-none"
                      >
                        <Lock size={14} />
                        {t('goods_test_payment', language)}
                      </button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Country & Payment Selection Modal */}
          <AnimatePresence>
            {countryModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
              >
                <div className="bg-white border border-slate-100 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col gap-4 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      {selectedCountry && (
                        <button
                          onClick={() => setSelectedCountry(null)}
                          className="mr-2 p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="text-slate-600" size={18} />
                        </button>
                      )}
                      <h3 className="text-xl font-bold tracking-tight text-slate-800">
                        {!selectedCountry ? t('select_country', language) : (language === 'ko' ? '결제 수단 선택' : 'Select Payment Method')}
                      </h3>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 cursor-pointer p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" onClick={() => setCountryModalOpen(false)}><X size={20} /></button>
                  </div>

                  <div className="overflow-y-auto pr-2 space-y-2 flex-1">
                    {!selectedCountry ? (
                      COUNTRIES.map(country => (
                        <button
                          key={country.code}
                          onClick={() => {
                            setSelectedCountry(country.code);
                            if (selectedPackage?.isGoods) {
                              setGoodsSelectedCountry(country.code);
                            }
                          }}
                          className="w-full text-left p-4 border border-slate-100 rounded-xl hover:border-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{country.flag}</span>
                            <span className="font-bold text-sm tracking-tight text-slate-700">{country.name}</span>
                          </div>
                          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform opacity-0 group-hover:opacity-100 text-blue-500" />
                        </button>
                      ))
                    ) : (
                      <div className="flex flex-col gap-4">
                        {isImpersonating || testMode || user?.email === 'dryudryu@gmail.com' ? (
                          <button
                            onClick={() => {
                              if (selectedPackage?.isGoods) {
                                setCountryModalOpen(false);
                                playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                                setGoodsPaymentMethod('dollar');
                                setTimeout(() => setGoodsShippingOpen(true), 300);
                              } else if (selectedPackage?.isAdRemoval) {
                                if (setIsAdRemoved) setIsAdRemoved(true);
                                playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                                setSuccessVisible({ isAdRemoval: true });
                              } else if (selectedPackage) {
                                updateSns(selectedPackage.amount, 'sns_charge', 'purchased');
                                playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                                setSuccessVisible({ amount: selectedPackage.amount });
                              }
                              setCountryModalOpen(false);
                            }}
                            className="w-full bg-slate-900 text-white font-bold uppercase tracking-widest text-base hover:bg-slate-800 transition-all font-sans h-12 rounded-xl flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
                          >
                            {selectedPackage?.isGoods
                              ? (language === 'ko' ? '테스트 결제 (배송정보)' : 'Test Purchase (Shipping)')
                              : selectedPackage?.isAdRemoval 
                                ? (language === 'ko' ? '즉시 구매 (SIM)' : 'Instant Purchase (SIM)')
                                : (language === 'ko' ? '즉시 충전 (SIM)' : 'Instant Charge (SIM)')}
                          </button>
                        ) : isAppEnv ? (
                          <div className="flex flex-col gap-3">
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 font-medium">
                              <ShieldAlert size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="font-bold block uppercase tracking-wider text-[10px] text-emerald-700">
                                  Google Play In-App Billing Active
                                </span>
                                <p className="text-[11px] leading-relaxed text-emerald-900">
                                  {language === 'ko'
                                    ? '구글 플레이 정책 준수를 위하여 안드로이드 앱 환경에서는 구글 인앱 결제만 지원됩니다.'
                                    : 'Per Google Play Store policy, only Google Play In-App Billing is supported in Android app environment.'}
                                </p>
                              </div>
                            </div>

                            {selectedPackage && (
                              <button
                                onClick={() => {
                                  playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
                                  if (selectedPackage.isGoods) {
                                    setCountryModalOpen(false);
                                    setGoodsPaymentMethod('dollar');
                                    setTimeout(() => setGoodsShippingOpen(true), 300);
                                  } else if (selectedPackage.isAdRemoval) {
                                    if ((window as any).AndroidBridge?.buyInAppItem) {
                                      (window as any).AndroidBridge.buyInAppItem('ad_removal');
                                    } else if (setIsAdRemoved) {
                                      setIsAdRemoved(true);
                                    }
                                    setSuccessVisible({ isAdRemoval: true });
                                    setCountryModalOpen(false);
                                  } else {
                                    const targetSku = selectedPackage.sku || (selectedPackage.isAdRemoval ? 'ad_removal' : `snshero_points_${selectedPackage.amount}`);
                                    if ((window as any).AndroidBridge?.buyInAppItem) {
                                      (window as any).AndroidBridge.buyInAppItem(targetSku);
                                    } else {
                                      updateSns(selectedPackage.amount, 'sns_charge', 'purchased');
                                    }
                                    setSuccessVisible({ amount: selectedPackage.amount });
                                    setCountryModalOpen(false);
                                  }
                                }}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-sm rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                              >
                                <Zap size={18} />
                                <span>{language === 'ko' ? 'Google Play 인앱 결제 진행' : 'Pay via Google Play'}</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col gap-3">
                              {selectedPackage && (
                                <PayPalButtonWrapper
                                  funding={FUNDING.PAYPAL}
                                  item={selectedPackage}
                                  updateSns={updateSns}
                                  playSfx={playSfx}
                                  setSuccessVisible={setSuccessVisible}
                                  setSelectedPaymentItem={setSelectedPaymentItem}
                                  setCountryModalOpen={setCountryModalOpen}
                                  language={language}
                                  setIsAdRemoved={setIsAdRemoved}
                                />
                              )}
                              
                              {selectedPackage && (
                                <button
                                  onClick={() => {
                                    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                                    const returnUrl = new URL(window.location.href);
                                    returnUrl.searchParams.set('payapp_success', selectedPackage.isAdRemoval ? 'ad_removal' : selectedPackage.amount.toString());
                                    
                                    if ((window as any).PayApp) {
                                      (window as any).PayApp.setDefault('userid', 'dryudryu');
                                      (window as any).PayApp.setDefault('shopname', 'Applet Store');
                                      (window as any).PayApp.setParam('goodname', selectedPackage.label);
                                      const krwPrice = Math.round(parseFloat(selectedPackage.price) * 1450);
                                      (window as any).PayApp.setParam('price', krwPrice.toString());
                                      (window as any).PayApp.setParam('recvphone', '01000000000');
                                      (window as any).PayApp.setParam('smsuse', 'n');
                                      (window as any).PayApp.setParam('redirectpay', '1');
                                      (window as any).PayApp.setParam('skip_agree', 'y');
                                      (window as any).PayApp.setParam('skip_cstpage', 'y');
                                      (window as any).PayApp.setParam('cashier', '1');
                                      (window as any).PayApp.setParam('method', 'applepay');
                                      (window as any).PayApp.setParam('returnurl', returnUrl.toString());
                                      (window as any).PayApp.payrequest();
                                    }
                                  }}
                                  className="w-full bg-black text-white font-bold uppercase tracking-widest text-lg flex items-center justify-center gap-2 hover:bg-zinc-900 transition-all font-sans h-12 rounded shadow-sm border-b-4 border-zinc-800 active:border-b-0 active:translate-y-1 mt-2"
                                >
                                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.05 20.28c-.96.95-2.208 1.1-2.93 1.1-1.002 0-2.096-.4-2.99-.4-.922 0-2.15.4-2.848.4-.698 0-2.136-.318-3.034-1.1-1.807-1.572-3.055-4.595-3.055-7.19 0-3.968 2.585-6.074 5.073-6.074 1.285 0 2.338.746 3.034.746.68 0 2.046-.81 3.478-.81 1.446 0 3.313.393 4.57 2.1-.284.17-2.697 1.577-2.697 4.607 0 3.512 3.125 4.743 3.164 4.76a11.537 11.537 0 0 1-1.765 2.761zm-2.783-17.428c0 2.1-.825 4.136-3.23 4.136 0-2.1.841-3.917 3.23-4.136z"/>
                                  </svg>
                                  {t('apple_pay', language)}
                                </button>
                              )}

                              {['ko', 'ja', 'zh', 'vi', 'th', 'id'].includes(selectedCountry || '') && selectedPackage && (
                                <div className="flex flex-col gap-3">
                                  <button
                                    onClick={() => {
                                      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                                      const returnUrl = new URL(window.location.href);
                                      returnUrl.searchParams.set('payapp_success', selectedPackage.isAdRemoval ? 'ad_removal' : selectedPackage.amount.toString());
                                      
                                      if ((window as any).PayApp) {
                                        (window as any).PayApp.setDefault('userid', 'dryudryu');
                                        (window as any).PayApp.setDefault('shopname', 'Applet Store');
                                        (window as any).PayApp.setParam('goodname', selectedPackage.label);
                                        const krwPrice = Math.round(parseFloat(selectedPackage.price) * 1450);
                                        (window as any).PayApp.setParam('price', krwPrice.toString());
                                        (window as any).PayApp.setParam('recvphone', '01000000000');
                                        (window as any).PayApp.setParam('smsuse', 'n');
                                        (window as any).PayApp.setParam('redirectpay', '1');
                                        (window as any).PayApp.setParam('skip_agree', 'y');
                                        (window as any).PayApp.setParam('skip_cstpage', 'y');
                                        (window as any).PayApp.setParam('cashier', '1');
                                        (window as any).PayApp.setParam('method', 'naverpay');
                                        (window as any).PayApp.setParam('returnurl', returnUrl.toString());
                                        (window as any).PayApp.payrequest();
                                      }
                                    }}
                                    className="w-full bg-[#2DB400] text-white font-bold uppercase tracking-widest text-lg flex items-center justify-center gap-2 hover:bg-[#2DB400]/80 transition-all font-sans h-12 rounded shadow-sm border-b-4 border-[#249000] active:border-b-0 active:translate-y-1"
                                  >
                                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"/>
                                    </svg>
                                    {t('naver_pay', language)}
                                  </button>
                                </div>
                              )}

                              {selectedCountry === 'zh' && selectedPackage && (
                                <div className="flex flex-col gap-3 mt-3">
                                  <button
                                      onClick={() => {
                                        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                                        const returnUrl = new URL(window.location.href);
                                        returnUrl.searchParams.set('payapp_success', selectedPackage.isAdRemoval ? 'ad_removal' : selectedPackage.amount.toString());
                                        
                                        if ((window as any).PayApp) {
                                          (window as any).PayApp.setDefault('userid', 'dryudryu');
                                          (window as any).PayApp.setDefault('shopname', 'Applet Store');
                                          (window as any).PayApp.setParam('goodname', selectedPackage.label);
                                          const krwPrice = Math.round(parseFloat(selectedPackage.price) * 1450);
                                          (window as any).PayApp.setParam('price', krwPrice.toString());
                                          (window as any).PayApp.setParam('recvphone', '01000000000');
                                          (window as any).PayApp.setParam('smsuse', 'n');
                                          (window as any).PayApp.setParam('redirectpay', '1');
                                          (window as any).PayApp.setParam('skip_agree', 'y');
                                          (window as any).PayApp.setParam('skip_cstpage', 'y');
                                          (window as any).PayApp.setParam('cashier', '1');
                                          (window as any).PayApp.setParam('returnurl', returnUrl.toString());
                                          (window as any).PayApp.setParam('method', 'alipay');
                                          (window as any).PayApp.payrequest();
                                        }
                                      }}
                                      className="w-full bg-[#00A1E9] text-white font-bold uppercase tracking-widest text-lg flex items-center justify-center gap-2 hover:bg-[#00A1E9]/80 transition-all font-sans h-12 rounded shadow-sm border-b-4 border-[#007cb3] active:border-b-0 active:translate-y-1"
                                    >
                                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12.015 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm4.27 12.383h-2.183l-.332 1.417h-2.134l.332-1.417h-2.134l-.248 1.055h-1.92l.493-2.1h5.81l.163-.694H8.435l.164-.694H8.435l.164-.694H8.435l.164-.694H8.435l.164-.694h5.638l.164-.7h5.638l.164-.7h-5.638l.164-.7H9.429l.332-1.417h2.134l-.332 1.417h2.133l.332 1.417h2.134l-.332 1.417h1.921l-.493 2.1h-1.428l-.163.694h1.427l-.163.694h-1.427l.163.694h1.427l-.493 2.1z"/>
                                      </svg>
                                      {t('alipay', language)}
                                    </button>

                                    <button
                                      onClick={() => {
                                        playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                                        const returnUrl = new URL(window.location.href);
                                        returnUrl.searchParams.set('payapp_success', selectedPackage.isAdRemoval ? 'ad_removal' : selectedPackage.amount.toString());
                                        
                                        if ((window as any).PayApp) {
                                          (window as any).PayApp.setDefault('userid', 'dryudryu');
                                          (window as any).PayApp.setDefault('shopname', 'Applet Store');
                                          (window as any).PayApp.setParam('goodname', selectedPackage.label);
                                          const krwPrice = Math.round(parseFloat(selectedPackage.price) * 1450);
                                          (window as any).PayApp.setParam('price', krwPrice.toString());
                                          (window as any).PayApp.setParam('recvphone', '01000000000');
                                          (window as any).PayApp.setParam('smsuse', 'n');
                                          (window as any).PayApp.setParam('redirectpay', '1');
                                          (window as any).PayApp.setParam('skip_agree', 'y');
                                          (window as any).PayApp.setParam('skip_cstpage', 'y');
                                          (window as any).PayApp.setParam('cashier', '1');
                                          (window as any).PayApp.setParam('returnurl', returnUrl.toString());
                                          (window as any).PayApp.setParam('method', 'wechatpay');
                                          (window as any).PayApp.payrequest();
                                        }
                                      }}
                                      className="w-full bg-[#07C160] text-white font-bold uppercase tracking-widest text-lg flex items-center justify-center gap-2 hover:bg-[#07C160]/80 transition-all font-sans h-12 rounded shadow-sm border-b-4 border-[#059048] active:border-b-0 active:translate-y-1"
                                    >
                                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 13.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zm-4.5 0c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zm-4.5 0c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zm9-4.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zm-4.5 0c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zm-4.5 0c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5z"/>
                                      </svg>
                                      {t('wechatpay', language)}
                                    </button>
                                  </div>
                              )}

                              {selectedCountry === 'ko' && selectedPackage && (
                                <div className="flex flex-col gap-3">
                                  <button
                                    onClick={() => {
                                      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
                                      const returnUrl = new URL(window.location.href);
                                      returnUrl.searchParams.set('payapp_success', selectedPackage.isAdRemoval ? 'ad_removal' : selectedPackage.amount.toString());

                                      if ((window as any).PayApp) {
                                        (window as any).PayApp.setDefault('userid', 'dryudryu');
                                        (window as any).PayApp.setDefault('shopname', 'Applet Store');
                                        (window as any).PayApp.setParam('goodname', selectedPackage.label);
                                        (window as any).PayApp.setParam('price', selectedPackage.krwPrice || (parseFloat(selectedPackage.price) * 1400).toString());
                                        (window as any).PayApp.setParam('recvphone', '01000000000');
                                        (window as any).PayApp.setParam('smsuse', 'n');
                                        (window as any).PayApp.setParam('redirectpay', '1');
                                        (window as any).PayApp.setParam('skip_agree', 'y');
                                        (window as any).PayApp.setParam('skip_cstpage', 'y');
                                        (window as any).PayApp.setParam('cashier', '1');
                                        (window as any).PayApp.setParam('returnurl', returnUrl.toString());
                                        (window as any).PayApp.payrequest();
                                      } else {
                                        console.error('PayApp SDK not loaded');
                                      }
                                    }}
                                    className="w-full bg-[#1e58ff] text-white font-bold uppercase tracking-widest text-lg flex items-center justify-center gap-2 hover:bg-[#1e58ff]/80 transition-all font-sans h-12 rounded shadow-sm border-b-4 border-[#1542c7] active:border-b-0 active:translate-y-1"
                                  >
                                    {language === 'ko' ? '신용카드 (PayApp)' : 'Credit Card (PayApp)'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedRefundOrder && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-slate-800"
                onClick={() => setSelectedRefundOrder(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 16 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 16 }}
                  className="bg-white border border-slate-100 p-6 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col gap-4"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">{t('refund_request_section_badge', language)}</p>
                      <h3 className="text-lg font-bold tracking-tight text-slate-900">{t('refund_request_modal_title', language)}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedRefundOrder(null)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-slate-50 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-1.5">
                    <p className="text-sm font-bold text-slate-800">{selectedRefundOrder.itemName}</p>
                    <p className="text-xs font-semibold text-slate-500">{t('refund_request_order_number', language)}: {selectedRefundOrder.orderId}</p>
                    <p className="text-xs font-semibold text-slate-500">{t('refund_request_amount', language)}: ${selectedRefundOrder.amountUsd.toFixed(2)} USD</p>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Clock size={14} />
                      <p className="text-[11px] font-black uppercase tracking-[0.18em]">{t('refund_request_modal_notice_title', language)}</p>
                    </div>
                    <p className="text-sm font-semibold text-amber-900 leading-relaxed">{t('refund_request_modal_notice_body', language)}</p>
                    <p className="text-xs text-amber-800 leading-relaxed">{t('refund_request_modal_desc', language)}</p>
                  </div>

                  <label className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{t('refund_request_reason_label', language)}</span>
                    <select
                      value={refundReason}
                      onChange={(event) => setRefundReason(event.target.value as RefundRequestReason)}
                      className="w-full min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-400"
                    >
                      {REFUND_REASON_OPTIONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {t(`refund_request_reason_${reason}`, language)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{t('refund_request_detail_label', language)}</span>
                    <textarea
                      value={refundDetails}
                      onChange={(event) => setRefundDetails(event.target.value)}
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-400 resize-none"
                      placeholder={t('refund_request_detail_placeholder', language)}
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigate?.('policy-center')}
                      className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-100 touch-target"
                    >
                      {t('refund_request_view_policy', language)}
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitRefundRequest}
                      className="flex-1 min-h-11 rounded-2xl bg-emerald-600 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-emerald-500 touch-target active:scale-[0.98]"
                    >
                      {t('refund_request_submit', language)}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Thank You (Success) Popup */}
          <AnimatePresence>
            {goodsThankYouOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-slate-800"
                onClick={() => setGoodsThankYouOpen(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-white rounded-3xl p-7 max-w-sm w-full border border-slate-100 shadow-2xl text-center space-y-6 relative overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full mx-auto flex items-center justify-center shadow-xs">
                    <Sparkles size={26} className="text-emerald-600" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold tracking-tight text-slate-850 uppercase leading-none">
                      {t('goods_thank_you_title', language)}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 leading-tight">
                      {t('goods_thank_you_desc', language)}
                    </p>
                  </div>

                  <button
                    onClick={() => setGoodsThankYouOpen(false)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-slate-950/10 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {language === 'ko' ? '감사합니다' : 'Thank You'}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-5 sm:space-y-6 pt-4 sm:pt-6 md:pt-8 border-t border-emerald-100 mt-4 sm:mt-6 md:mt-8">
            {goodsOrderCards.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 px-5 py-8 text-center text-sm font-semibold text-emerald-700">
                {t('refund_request_empty', language)}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {goodsOrderCards.map(({ order, refundRequest, eligible }) => {
                  const createdLabel = new Date(order.timestamp).toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={order.orderId} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {t('refund_request_order_number', language)}
                          </p>
                          <p className="text-sm font-bold text-slate-800 break-all">{order.orderId}</p>
                        </div>
                        <span className={cn(
                          'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] border',
                          eligible
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-slate-100 text-slate-500'
                        )}>
                          {eligible ? t('refund_request_eligible', language) : t('refund_request_ineligible', language)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{t('refund_request_item', language)}</p>
                          <p className="mt-1 text-sm text-slate-800">{order.itemName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{t('refund_request_amount', language)}</p>
                          <p className="mt-1 text-sm text-slate-800">${order.amountUsd.toFixed(2)} USD</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{t('refund_request_payment', language)}</p>
                          <p className="mt-1 text-sm text-slate-800 uppercase">{order.paymentMethod}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{t('refund_request_received_at', language)}</p>
                          <p className="mt-1 text-sm text-slate-800">{createdLabel}</p>
                        </div>
                      </div>

                      {refundRequest ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">{t('refund_request_status', language)}</p>
                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                              {t(getRefundStatusLabelKey(refundRequest.status), language)}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                            {t('refund_request_submitted_desc', language)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                          {eligible ? t('refund_request_policy_hint', language) : t('refund_request_ineligible_desc', language)}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onNavigate?.('policy-center')}
                          className="min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-100 touch-target"
                        >
                          {t('refund_request_view_policy', language)}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenRefundRequest(order)}
                          disabled={!eligible || Boolean(refundRequest)}
                          className={cn(
                            'min-h-11 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] touch-target transition',
                            eligible && !refundRequest
                              ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 active:scale-[0.98]'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          )}
                        >
                          {refundRequest ? t('refund_request_submitted', language) : t('refund_request_submit', language)}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 통합 도움말 팝업 */}
          <AnimatePresence>
            {helpPopupState && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[209] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                onClick={() => setHelpPopupState(null)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3 sticky top-0 z-10 bg-white pt-2">
                    <div className="space-y-2">
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        {t('shop', language)}
                      </span>
                      <h3 className="text-lg font-black tracking-tight text-slate-900">
                        {helpSteps[helpPopupState.step].title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHelpPopupState(null)}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 touch-target"
                      aria-label={language === 'ko' ? '닫기' : 'Close'}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className={cn('mt-4 rounded-2xl border px-4 py-3', helpSteps[helpPopupState.step].accentClassName)}>
                    <p className="text-sm font-semibold leading-relaxed whitespace-pre-line">
                      {helpSteps[helpPopupState.step].body}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    <span>{helpPopupState.step + 1} / {helpSteps.length}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setHelpPopupState((prev) => prev ? { step: Math.max(prev.step - 1, 0) } : prev)}
                      disabled={helpPopupState.step === 0}
                      className={cn(
                        'min-h-11 rounded-2xl border px-3 py-2 text-sm font-bold transition touch-target',
                        helpPopupState.step === 0
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:scale-95'
                      )}
                    >
                      <ChevronLeft size={16} className="mx-auto" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setHelpPopupState(null)}
                      className="min-h-11 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 touch-target"
                    >
                      {language === 'ko' ? '닫기' : 'Close'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (helpPopupState.step === helpSteps.length - 1) {
                          setHelpPopupState(null);
                          return;
                        }
                        setHelpPopupState((prev) => prev ? { step: Math.min(prev.step + 1, helpSteps.length - 1) } : prev);
                      }}
                      className="min-h-11 rounded-2xl border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-95 touch-target"
                    >
                      {helpPopupState.step === helpSteps.length - 1
                        ? t('contextual_tutorial_done', language)
                        : <ChevronRight size={16} className="mx-auto" />}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {renderHistoryModal()}
          </div>
        </div>

      </>
    </PayPalScriptProvider>
  );
};
