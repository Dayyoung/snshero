import React, { useCallback, useEffect, useState } from 'react';
import { cardDb } from './cardDb';
import { GameAdSenseLayout } from './components/GameAdSenseLayout';
import {
  GameOptionsModal,
  PaymentSuccessModal,
  QuestLogModal,
  TavernShopModal,
} from './components/Modals';
import { SNS_LOGO_URL } from './components/SnsHeroArtKit';
import { initSnsHeroConsoleApi } from './consoleApi';
import {
  GamePaymentReturnResult,
  POPUP_PAYMENT_EVENT_KEY,
  buildPayPalCheckoutUrl,
  checkAndProcessGamePaymentReturn,
  getPaymentPopupBridgeParams,
  launchPayAppCheckoutInCurrentWindow,
} from './paymentGateway';
import { BattleScreen } from './screens/BattleScreen';
import { BoxHubScreen } from './screens/BoxHubScreen';
import { CollectionScreen } from './screens/CollectionScreen';
import { HeroDeckSelectScreen } from './screens/HeroDeckSelectScreen';
import { PackOpeningScreen } from './screens/PackOpeningScreen';
import { TavernIntroScreen } from './screens/TavernIntroScreen';
import { initGamePwaFullscreen, isStandalonePwa } from './pwaFullscreen';
import { hsStorage } from './storage';
import {
  BoardThemeId,
  CustomDeck,
  GameMode,
  HeroClass,
  PlayerProfile,
  ScreenName,
} from './types';

export const HearthstoneApp: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [screen, setScreen] = useState<ScreenName>('TAVERN_INTRO');
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  const [selectedMode, setSelectedMode] = useState<GameMode>('RANKED');
  const [battleSessionKey, setBattleSessionKey] = useState(1);
  const [returnToJourneyActive, setReturnToJourneyActive] = useState(false);
  const [activeBattleParams, setActiveBattleParams] = useState<{
    mode: GameMode;
    deck: CustomDeck;
    preferredOpponentClass?: HeroClass;
    boardTheme?: BoardThemeId;
    journeyEpisodeOverride?: number;
    skipStoryIntro?: boolean;
  } | null>(null);

  // Popup checkout bridge state (only active inside window.open popup)
  const [popupBridge] = useState(() => getPaymentPopupBridgeParams());
  const [popupReturnDone, setPopupReturnDone] = useState<GamePaymentReturnResult | null>(null);
  const [popupBridgeStatus, setPopupBridgeStatus] = useState<'launching' | 'ready' | 'error'>(
    'launching',
  );

  // Global Modals
  const [questLogOpen, setQuestLogOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [paymentResult, setPaymentResult] = useState<GamePaymentReturnResult | null>(null);
  const [optionsState, setOptionsState] = useState<{
    open: boolean;
    inBattle: boolean;
    concedeFn?: () => void;
  }>({ open: false, inBattle: false });

  const refreshProfile = useCallback(() => {
    setProfile(hsStorage.getProfile());
  }, []);

  useEffect(() => {
    let mounted = true;
    initSnsHeroConsoleApi();
    initGamePwaFullscreen();

    const syncFromStorage = () => {
      if (mounted) {
        setProfile(hsStorage.getProfile());
      }
    };

    const handlePopupPaymentMessage = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      const data = ev.data as {
        type?: string;
        result?: GamePaymentReturnResult;
      } | null;
      if (data?.type === 'SNSHERO_GAME_PAYMENT_COMPLETE' && data.result?.handled) {
        if (!mounted) return;
        setProfile(hsStorage.getProfile());
        setShopOpen(false);
        setPaymentResult(data.result);
      }
    };

    const handleStorageEvent = (ev: StorageEvent) => {
      if (ev.key === POPUP_PAYMENT_EVENT_KEY && ev.newValue) {
        try {
          const parsed = JSON.parse(ev.newValue) as GamePaymentReturnResult;
          if (parsed?.handled && mounted) {
            setProfile(hsStorage.getProfile());
            setShopOpen(false);
            setPaymentResult(parsed);
          }
        } catch {
          // ignore malformed storage event
        }
      }
    };

    window.addEventListener('snshero:state-changed', syncFromStorage);
    window.addEventListener('message', handlePopupPaymentMessage);
    window.addEventListener('storage', handleStorageEvent);

    cardDb
      .init()
      .then(() => {
        if (!mounted) return;
        hsStorage.ensureInitialized();
        const payRes = checkAndProcessGamePaymentReturn();
        if (payRes.handled) {
          if (payRes.closedPopup) {
            setPopupReturnDone(payRes);
          } else {
            setPaymentResult(payRes);
            setScreen('BOX_HUB');
          }
        } else {
          // PWA App Shortcuts (`?mode=story` / `?mode=ranked` / `?mode=ai`) or standalone launch
          const params = new URLSearchParams(window.location.search);
          const launchMode = params.get('mode')?.toLowerCase();
          if (launchMode === 'story') {
            hsStorage.markJourneyGuideDone();
            const decks = hsStorage.getDecks();
            const kadanDeck = decks.find((d) => d.heroClass === 'PRIEST') || decks[0];
            setActiveBattleParams({
              mode: 'TUTORIAL',
              deck: kadanDeck,
              preferredOpponentClass: 'ROGUE',
              boardTheme: 'STORMWIND',
            });
            setScreen('BATTLE');
          } else if (launchMode === 'ranked') {
            hsStorage.markJourneyGuideDone();
            setSelectedMode('RANKED');
            setScreen('HERO_SELECT');
          } else if (launchMode === 'ai') {
            hsStorage.markJourneyGuideDone();
            setSelectedMode('PRACTICE_NORMAL');
            setScreen('HERO_SELECT');
          } else if (isStandalonePwa()) {
            setScreen('BOX_HUB');
          }
        }
        setProfile(hsStorage.getProfile());
        setReady(true);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setLoadError(err instanceof Error ? err.message : '데이터 로드 오류');
      });

    return () => {
      mounted = false;
      window.removeEventListener('snshero:state-changed', syncFromStorage);
      window.removeEventListener('message', handlePopupPaymentMessage);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Automatically launch payment module inside popup bridge window (`?pay_popup_bridge=1`)
  useEffect(() => {
    if (!ready || !popupBridge.isBridge || popupReturnDone) return;
    if (popupBridge.method === 'paypal') {
      window.location.href = buildPayPalCheckoutUrl(popupBridge.pkg, true);
      return;
    }
    let active = true;
    launchPayAppCheckoutInCurrentWindow(popupBridge.pkg, popupBridge.method).then((ok) => {
      if (!active) return;
      setPopupBridgeStatus(ok ? 'ready' : 'error');
    });
    return () => {
      active = false;
    };
  }, [ready, popupBridge, popupReturnDone]);

  const launchJourneyBattle = useCallback(
    (episodeOverride?: number, skipStoryIntro = false) => {
      hsStorage.markJourneyGuideDone();
      const decks = hsStorage.getDecks();
      const kadanDeck = decks.find((d) => d.heroClass === 'PRIEST') || decks[0];
      setReturnToJourneyActive(false);
      setBattleSessionKey((k) => k + 1);
      setActiveBattleParams({
        mode: 'TUTORIAL',
        deck: kadanDeck,
        preferredOpponentClass: 'ROGUE',
        boardTheme: 'STORMWIND',
        journeyEpisodeOverride: episodeOverride,
        skipStoryIntro,
      });
      refreshProfile();
      setScreen('BATTLE');
    },
    [refreshProfile],
  );

  if (loadError) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-stone-950 p-6 text-center text-amber-100">
        <h1 className="text-2xl font-extrabold text-red-400">눈히어로 데이터를 불러오지 못했습니다</h1>
        <p className="mt-2 text-sm text-amber-200/80">{loadError}</p>
      </div>
    );
  }

  // Dedicated popup return view (closes automatically and returns to main game window)
  if (popupReturnDone) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#0c0805] p-6 text-center text-amber-100">
        <img src={SNS_LOGO_URL} alt="눈히어로" className="w-48 drop-shadow" />
        <div className="mt-5 max-w-md rounded-2xl border-2 border-emerald-400/70 bg-emerald-950/50 p-6 shadow-2xl">
          <div className="text-xl font-extrabold text-emerald-200">
            결제 및 보급품 지급 완료!
          </div>
          <p className="mt-2 text-sm leading-relaxed text-amber-100/90">
            <strong className="text-amber-200">{popupReturnDone.label}</strong> 결제가 완료되어
            열려 있는 눈히어로 본 게임 화면에 즉시 반영되었습니다.
          </p>
          <button
            type="button"
            onClick={() => window.close()}
            className="hs-gold-btn mt-5 w-full rounded-xl px-5 py-3 text-sm font-extrabold"
          >
            창 닫고 게임으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // Dedicated popup checkout bridge view (`?pay_popup_bridge=1`)
  if (popupBridge.isBridge) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#0c0805] p-6 text-center text-amber-100">
        <img src={SNS_LOGO_URL} alt="눈히어로" className="w-48 drop-shadow" />
        <div className="mt-5 w-full max-w-md rounded-2xl border-2 border-amber-500/60 bg-stone-950/90 p-6 shadow-2xl">
          <div className="text-xs font-extrabold tracking-widest text-amber-300">
            눈히어로 공식 팝업 결제창
          </div>
          <h2 className="mt-1 text-xl font-extrabold text-white">{popupBridge.pkg.name}</h2>
          <div className="mt-1 text-lg font-black text-amber-300">
            {popupBridge.pkg.priceUsdLabel}{' '}
            <span className="text-xs font-bold text-amber-200/75">
              ({popupBridge.pkg.priceKrwLabel})
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-amber-100/80">
            {popupBridgeStatus === 'error'
              ? '결제 모듈 호출이 지연되었습니다. 아래 버튼을 눌러 다시 시도하거나 본 화면에서 다른 수단을 선택해 주세요.'
              : '안전한 외부 결제 모듈을 연결하고 있습니다. 결제 성공 시 이 창이 자동으로 닫히고 본 게임 화면으로 즉시 돌아갑니다.'}
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            {popupBridge.method !== 'paypal' && (
              <button
                type="button"
                onClick={() => {
                  setPopupBridgeStatus('launching');
                  launchPayAppCheckoutInCurrentWindow(
                    popupBridge.pkg,
                    popupBridge.method as 'card' | 'kakaopay' | 'naverpay' | 'applepay',
                  ).then((ok) => setPopupBridgeStatus(ok ? 'ready' : 'error'));
                }}
                className="hs-gold-btn w-full rounded-xl px-4 py-3 text-sm font-extrabold"
              >
                결제창 다시 열기
              </button>
            )}
            <button
              type="button"
              onClick={() => window.close()}
              className="hs-brass-btn w-full rounded-xl px-4 py-2.5 text-xs font-extrabold text-amber-100"
            >
              결제 취소 및 창 닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!ready || !profile) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-stone-950 text-amber-100">
        <img
          src={SNS_LOGO_URL}
          alt="눈히어로"
          className="w-64 animate-pulse drop-shadow-[0_12px_28px_rgba(56,189,248,0.45)]"
        />
        <div className="mt-4 text-sm font-extrabold tracking-wider text-sky-200">
          엘윈마을 대결 광장을 준비하고 있습니다...
        </div>
      </div>
    );
  }

  return (
    <GameAdSenseLayout screenKey={screen}>
      {screen === 'TAVERN_INTRO' && (
        <TavernIntroScreen onEnterHub={() => setScreen('BOX_HUB')} />
      )}

      {screen === 'BOX_HUB' && (
        <BoxHubScreen
          profile={profile}
          onSelectPlayMode={(m) => {
            if (m === 'TUTORIAL') {
              launchJourneyBattle();
              return;
            }
            setReturnToJourneyActive(false);
            setSelectedMode(m);
            setScreen('HERO_SELECT');
          }}
          onOpenCollection={() => {
            setReturnToJourneyActive(false);
            setScreen('COLLECTION');
          }}
          onOpenPacks={() => {
            setReturnToJourneyActive(false);
            setScreen('PACK_OPENING');
          }}
          onOpenQuestLog={() => setQuestLogOpen(true)}
          onOpenShop={() => setShopOpen(true)}
          onOpenOptions={() => setOptionsState({ open: true, inBattle: false })}
        />
      )}

      {screen === 'HERO_SELECT' && (
        <HeroDeckSelectScreen
          initialMode={selectedMode}
          onBack={() => {
            refreshProfile();
            setScreen('BOX_HUB');
          }}
          onEditDecks={() => setScreen('COLLECTION')}
          onLaunchBattle={(params) => {
            setReturnToJourneyActive(false);
            setBattleSessionKey((k) => k + 1);
            setActiveBattleParams(params);
            setScreen('BATTLE');
          }}
        />
      )}

      {screen === 'COLLECTION' && (
        <CollectionScreen
          onBack={() => {
            setReturnToJourneyActive(false);
            refreshProfile();
            setScreen('BOX_HUB');
          }}
          onProfileChanged={refreshProfile}
          onReturnToJourney={
            returnToJourneyActive ? () => launchJourneyBattle() : undefined
          }
        />
      )}

      {screen === 'PACK_OPENING' && (
        <PackOpeningScreen
          onBack={() => {
            setReturnToJourneyActive(false);
            refreshProfile();
            setScreen('BOX_HUB');
          }}
          onOpenShop={() => setShopOpen(true)}
          onProfileChanged={refreshProfile}
          onReturnToJourney={
            returnToJourneyActive ? () => launchJourneyBattle() : undefined
          }
        />
      )}

      {screen === 'BATTLE' && activeBattleParams && (
        <BattleScreen
          key={battleSessionKey}
          mode={activeBattleParams.mode}
          playerDeck={activeBattleParams.deck}
          preferredOpponentClass={activeBattleParams.preferredOpponentClass}
          preferredBoardTheme={activeBattleParams.boardTheme}
          journeyEpisodeOverride={activeBattleParams.journeyEpisodeOverride}
          skipStoryIntro={activeBattleParams.skipStoryIntro}
          onOpenOptions={(concedeFn) =>
            setOptionsState({ open: true, inBattle: true, concedeFn })
          }
          onOpenShopFromBattle={() => setShopOpen(true)}
          onGoOpenPacksFromBattle={() => {
            refreshProfile();
            setReturnToJourneyActive(true);
            setActiveBattleParams(null);
            setScreen('PACK_OPENING');
          }}
          onGoCollectionFromBattle={() => {
            refreshProfile();
            setReturnToJourneyActive(true);
            setActiveBattleParams(null);
            setScreen('COLLECTION');
          }}
          onStartJourneyEpisode={(ep, skipStory) => {
            hsStorage.setJourneyProgress(ep, hsStorage.getProfile().journeyReincarnation);
            launchJourneyBattle(ep, Boolean(skipStory));
          }}
          onRematchSameMode={() => {
            refreshProfile();
            setBattleSessionKey((k) => k + 1);
          }}
          onExitBattle={() => {
            setReturnToJourneyActive(false);
            refreshProfile();
            setActiveBattleParams(null);
            setScreen('BOX_HUB');
          }}
        />
      )}

      {/* Global Overlays */}
      {questLogOpen && (
        <QuestLogModal
          onClose={() => setQuestLogOpen(false)}
          onProfileChanged={refreshProfile}
        />
      )}

      {shopOpen && (
        <TavernShopModal
          onClose={() => setShopOpen(false)}
          onProfileChanged={refreshProfile}
          onGoOpenPacks={() => {
            if (screen === 'BATTLE' && activeBattleParams?.mode === 'TUTORIAL') {
              setReturnToJourneyActive(true);
              setActiveBattleParams(null);
            }
            setScreen('PACK_OPENING');
          }}
        />
      )}

      {paymentResult && (
        <PaymentSuccessModal
          info={paymentResult}
          onOpenPacks={() => {
            setPaymentResult(null);
            if (screen === 'BATTLE' && activeBattleParams?.mode === 'TUTORIAL') {
              setReturnToJourneyActive(true);
              setActiveBattleParams(null);
            }
            setScreen('PACK_OPENING');
          }}
          onClose={() => setPaymentResult(null)}
        />
      )}

      {optionsState.open && (
        <GameOptionsModal
          inBattle={optionsState.inBattle}
          onConcede={optionsState.concedeFn}
          onClose={() => setOptionsState({ open: false, inBattle: false })}
        />
      )}
    </GameAdSenseLayout>
  );
};
