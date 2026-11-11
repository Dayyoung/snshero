import React, { useEffect, useState } from 'react';
import { cardDb } from './cardDb';
import {
  GameOptionsModal,
  QuestLogModal,
  ReaEvidenceModal,
  TavernShopModal,
} from './components/Modals';
import { BattleScreen } from './screens/BattleScreen';
import { BoxHubScreen } from './screens/BoxHubScreen';
import { CollectionScreen } from './screens/CollectionScreen';
import { HeroDeckSelectScreen } from './screens/HeroDeckSelectScreen';
import { PackOpeningScreen } from './screens/PackOpeningScreen';
import { TavernIntroScreen } from './screens/TavernIntroScreen';
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
  const [activeBattleParams, setActiveBattleParams] = useState<{
    mode: GameMode;
    deck: CustomDeck;
    preferredOpponentClass?: HeroClass;
    boardTheme?: BoardThemeId;
  } | null>(null);

  // Global Modals
  const [questLogOpen, setQuestLogOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [reaModalOpen, setReaModalOpen] = useState(false);
  const [optionsState, setOptionsState] = useState<{
    open: boolean;
    inBattle: boolean;
    concedeFn?: () => void;
  }>({ open: false, inBattle: false });

  useEffect(() => {
    let mounted = true;
    cardDb
      .init()
      .then(() => {
        if (!mounted) return;
        hsStorage.ensureInitialized();
        setProfile(hsStorage.getProfile());
        setReady(true);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setLoadError(err instanceof Error ? err.message : '데이터 로드 오류');
      });
    return () => {
      mounted = false;
    };
  }, []);

  const refreshProfile = () => {
    setProfile(hsStorage.getProfile());
  };

  if (loadError) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-stone-950 p-6 text-center text-amber-100">
        <h1 className="text-2xl font-extrabold text-red-400">여관 데이터를 불러오지 못했습니다</h1>
        <p className="mt-2 text-sm text-amber-200/80">{loadError}</p>
      </div>
    );
  }

  if (!ready || !profile) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-stone-950 text-amber-100">
        <img
          src="/stone-assets/ui/hs_titlelogo.webp"
          alt="Hearthstone"
          className="w-72 animate-pulse drop-shadow-2xl"
        />
        <div className="mt-4 text-sm font-extrabold tracking-wider text-amber-200">
          스톤브루의 여관 테이블을 준비하고 있습니다...
        </div>
      </div>
    );
  }

  return (
    <>
      {screen === 'TAVERN_INTRO' && (
        <TavernIntroScreen onEnterHub={() => setScreen('BOX_HUB')} />
      )}

      {screen === 'BOX_HUB' && (
        <BoxHubScreen
          profile={profile}
          onSelectPlayMode={(m) => {
            if (m === 'TUTORIAL') {
              const mageDeck =
                hsStorage.getDecks().find((d) => d.heroClass === 'MAGE') ||
                hsStorage.getDecks()[0];
              setActiveBattleParams({
                mode: 'TUTORIAL',
                deck: mageDeck,
                preferredOpponentClass: 'WARRIOR',
                boardTheme: 'STORMWIND',
              });
              setScreen('BATTLE');
              return;
            }
            setSelectedMode(m);
            setScreen('HERO_SELECT');
          }}
          onOpenCollection={() => setScreen('COLLECTION')}
          onOpenPacks={() => setScreen('PACK_OPENING')}
          onOpenQuestLog={() => setQuestLogOpen(true)}
          onOpenShop={() => setShopOpen(true)}
          onOpenOptions={() => setOptionsState({ open: true, inBattle: false })}
          onOpenReaModal={() => setReaModalOpen(true)}
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
            setActiveBattleParams(params);
            setScreen('BATTLE');
          }}
        />
      )}

      {screen === 'COLLECTION' && (
        <CollectionScreen
          onBack={() => {
            refreshProfile();
            setScreen('BOX_HUB');
          }}
          onProfileChanged={refreshProfile}
        />
      )}

      {screen === 'PACK_OPENING' && (
        <PackOpeningScreen
          onBack={() => {
            refreshProfile();
            setScreen('BOX_HUB');
          }}
          onProfileChanged={refreshProfile}
        />
      )}

      {screen === 'BATTLE' && activeBattleParams && (
        <BattleScreen
          mode={activeBattleParams.mode}
          playerDeck={activeBattleParams.deck}
          preferredOpponentClass={activeBattleParams.preferredOpponentClass}
          preferredBoardTheme={activeBattleParams.boardTheme}
          onOpenOptions={(concedeFn) =>
            setOptionsState({ open: true, inBattle: true, concedeFn })
          }
          onExitBattle={() => {
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
          onGoOpenPacks={() => setScreen('PACK_OPENING')}
        />
      )}

      {optionsState.open && (
        <GameOptionsModal
          inBattle={optionsState.inBattle}
          onConcede={optionsState.concedeFn}
          onOpenReaModal={() => setReaModalOpen(true)}
          onProfileChanged={refreshProfile}
          onClose={() => setOptionsState({ open: false, inBattle: false })}
        />
      )}

      {reaModalOpen && <ReaEvidenceModal onClose={() => setReaModalOpen(false)} />}
    </>
  );
};
